import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import type { Env, ResolverResult, SuiNSRecord } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { toSuiNSName } from '../utils/subdomain'

const CACHE_TTL = 300 // 5 minutes

/**
 * Resolve a SuiNS name to its on-chain records
 */
export async function resolveSuiNS(
	name: string,
	env: Env,
	skipCache = false,
): Promise<ResolverResult> {
	const suinsName = toSuiNSName(name)
	const key = cacheKey('suins', env.SUI_NETWORK, suinsName)

	// Check cache first, but also verify expiration
	if (!skipCache) {
		const cached = await getCached<SuiNSRecord & { expirationTimestampMs?: string }>(env, key)
		if (cached) {
			// Check if cached record has expired
			if (cached.expirationTimestampMs) {
				const expirationTime = Number(cached.expirationTimestampMs)
				if (expirationTime < Date.now()) {
					// Name has expired, clear cache and return not found
					await env.CACHE.delete(key)
					return { found: false, error: `Name "${suinsName}" has expired`, expired: true }
				}
			}
			return { found: true, data: cached, cacheTtl: CACHE_TTL }
		}
	}

	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})

		// Get the name record
		const nameRecord = await suinsClient.getNameRecord(suinsName)
		if (!nameRecord) {
			return { found: false, error: `Name "${suinsName}" not found` }
		}

		// Check if the name has expired
		if (nameRecord.expirationTimestampMs) {
			const expirationTime = Number(nameRecord.expirationTimestampMs)
			const now = Date.now()
			if (expirationTime < now) {
				return { found: false, error: `Name "${suinsName}" has expired`, expired: true }
			}
		}

		// Get the resolved address
		const address = nameRecord.targetAddress

		// Fetch additional data if available
		const record: SuiNSRecord = {
			address: address || '',
			records: nameRecord.data || {},
		}

		// Store expiration for cache validation
		if (nameRecord.expirationTimestampMs) {
			record.expirationTimestampMs = String(nameRecord.expirationTimestampMs)
		}

		if (nameRecord.nftId) {
			record.nftId = nameRecord.nftId
		}

		// Try to get avatar and content hash from name record data
		if (nameRecord.avatar) {
			record.avatar = nameRecord.avatar
		}

		if (nameRecord.contentHash) {
			record.contentHash = nameRecord.contentHash
			// Parse content hash to determine type
			record.content = parseContentHash(nameRecord.contentHash)
		}

		if (nameRecord.walrusSiteId) {
			record.walrusSiteId = nameRecord.walrusSiteId
			// Prefer contentHash when present; fallback to walrusSiteId
			if (!record.content) {
				record.content = { type: 'walrus', value: nameRecord.walrusSiteId }
			}
		}

		// Cache the result
		await setCache(env, key, record, CACHE_TTL)

		return { found: true, data: record, cacheTtl: CACHE_TTL }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { found: false, error: message }
	}
}

/**
 * Parse content hash to determine storage type
 */
function parseContentHash(hash: string): SuiNSRecord['content'] {
	// IPFS CID v0 starts with Qm, v1 starts with bafy
	if (hash.startsWith('Qm') || hash.startsWith('bafy')) {
		return { type: 'ipfs', value: hash }
	}

	// Walrus blob IDs are typically base64 encoded
	if (hash.startsWith('walrus://') || hash.startsWith('0x')) {
		return { type: 'walrus', value: hash.replace('walrus://', '') }
	}

	// Check if it's a URL
	if (hash.startsWith('http://') || hash.startsWith('https://')) {
		return { type: 'url', value: hash }
	}

	// Default to Walrus for unrecognized formats (common on Sui)
	return { type: 'walrus', value: hash }
}

/**
 * Get the owner address for a SuiNS name
 */
export async function getSuiNSOwner(name: string, env: Env): Promise<string | null> {
	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})

		const suinsName = toSuiNSName(name)
		const nameRecord = await suinsClient.getNameRecord(suinsName)
		return nameRecord?.targetAddress || null
	} catch {
		return null
	}
}
