import type { SuiGraphQLClient } from '@mysten/sui/graphql'
import type { SuiGrpcClient } from '@mysten/sui/grpc'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { SuinsClient } from '@mysten/suins'
import type { Env, ResolverResult, SuiNSRecord } from '../types'
import { cacheKey } from '../utils/cache'
import { getDefaultRpcUrl } from '../utils/rpc'
import { toSuiNSName } from '../utils/subdomain'
import {
	getSuiGraphQLClient,
	getSuiGrpcClient,
	getSuiRpcClient,
	graphqlGetObject,
} from '../utils/sui-graphql'
import { lookupName as surfluxLookupName } from '../utils/surflux-grpc'

const CACHE_TTL = 600
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Resolve the human owner of an NFT. Walks up the ObjectOwner chain
 * (DynamicField wrappers, Kiosks, Tradeport listings) to find the
 * actual AddressOwner or seller address.
 */
async function resolveNftHumanOwner(
	nftId: string,
	gqlClient: SuiGraphQLClient,
	rpcClient: SuiJsonRpcClient,
	grpcClient: SuiGrpcClient,
): Promise<string | undefined> {
	const MAX_DEPTH = 4
	let currentId = nftId

	for (let depth = 0; depth < MAX_DEPTH; depth++) {
		const obj = await graphqlGetObject(gqlClient, currentId, undefined, rpcClient, grpcClient)
		if (!obj.data) return undefined

		const owner = obj.data.owner
		if (!owner) return undefined

		// Direct address owner — we're done
		if (owner.AddressOwner) return owner.AddressOwner

		// Check content fields for seller (Tradeport listing) or owner (Kiosk)
		const fields = obj.data.content?.fields as Record<string, unknown> | undefined
		if (fields?.seller && typeof fields.seller === 'string') return fields.seller
		if (fields?.owner && typeof fields.owner === 'string') return fields.owner

		// ObjectOwner — walk up one level
		if (owner.ObjectOwner) {
			currentId = owner.ObjectOwner
			continue
		}

		return undefined
	}

	return undefined
}

const suinsMemCache = new Map<
	string,
	{ data: SuiNSRecord & { expirationTimestampMs?: string }; exp: number }
>()

export async function resolveSuiNS(
	name: string,
	env: Env,
	skipCache = false,
): Promise<ResolverResult> {
	const suinsName = toSuiNSName(name)
	const key = cacheKey('suins-v2', env.SUI_NETWORK, suinsName)

	// KV caching disabled - use in-memory only to reduce KV operations
	if (!skipCache) {
		const mem = suinsMemCache.get(key)
		if (mem && mem.exp > Date.now()) {
			return processRecord(mem.data, suinsName)
		}
	}

	function processRecord(
		record: SuiNSRecord & { expirationTimestampMs?: string },
		name: string,
	): ResolverResult {
		if (record.expirationTimestampMs) {
			const expirationTime = Number(record.expirationTimestampMs)
			const now = Date.now()
			const gracePeriodEnd = expirationTime + GRACE_PERIOD_MS

			if (now >= gracePeriodEnd) {
				return {
					found: false,
					error: `Name "${name}" has expired and is available`,
					expired: true,
					available: true,
				}
			}
			if (now >= expirationTime) {
				return {
					found: true,
					data: record,
					cacheTtl: CACHE_TTL,
					expired: true,
					inGracePeriod: true,
				}
			}
		}
		return { found: true, data: record, cacheTtl: CACHE_TTL }
	}

	try {
		// Surflux gRPC-Web (faster, with proper protobuf encoding)
		if (env.SURFLUX_API_KEY) {
			const surfluxRecord = await surfluxLookupName(suinsName, env)
			if (surfluxRecord) {
				// Fetch NFT owner if we have the NFT ID (Surflux doesn't return owner)
				if (surfluxRecord.nftId && !surfluxRecord.ownerAddress) {
					try {
						const gqlClient = getSuiGraphQLClient(env)
						const rpcClient = getSuiRpcClient(env)
						const grpcClient = getSuiGrpcClient(env)
						surfluxRecord.ownerAddress = await resolveNftHumanOwner(
							surfluxRecord.nftId,
							gqlClient,
							rpcClient,
							grpcClient,
						)
					} catch (e) {
						console.log('Could not fetch NFT owner for Surflux record:', e)
					}
				}
				const result = processRecord(surfluxRecord, suinsName)
				if (result.found && !result.expired) {
					suinsMemCache.set(key, { data: surfluxRecord, exp: Date.now() + 300000 })
				}
				return result
			}
		}

		// Fallback: SuiNS SDK (JSON-RPC)
		const suiClient = new SuiJsonRpcClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})

		// Get the name record
		const nameRecord = await suinsClient.getNameRecord(suinsName)
		if (!nameRecord) {
			// Name genuinely not found - available for registration
			return { found: false, error: `Name "${suinsName}" not found`, available: true }
		}

		let ownerAddress: string | undefined
		if (nameRecord.nftId) {
			try {
				const gqlClient = getSuiGraphQLClient(env)
				const rpcClient = getSuiRpcClient(env)
				const grpcClient = getSuiGrpcClient(env)
				ownerAddress = await resolveNftHumanOwner(
					nameRecord.nftId,
					gqlClient,
					rpcClient,
					grpcClient,
				)
			} catch (e) {
				console.log('Could not fetch NFT owner:', e)
			}
		}

		// Check expiration status
		let expired = false
		let inGracePeriod = false
		if (nameRecord.expirationTimestampMs) {
			const expirationTime = Number(nameRecord.expirationTimestampMs)
			const now = Date.now()
			const gracePeriodEnd = expirationTime + GRACE_PERIOD_MS

			if (now >= gracePeriodEnd) {
				// Past grace period - name is available for registration
				return {
					found: false,
					error: `Name "${suinsName}" has expired and is available`,
					expired: true,
					available: true,
				}
			}
			if (now >= expirationTime) {
				// In grace period - continue to fetch data but mark as expired
				expired = true
				inGracePeriod = true
			}
		}

		// Get the resolved address
		const address = nameRecord.targetAddress

		// Fetch additional data if available
		const record: SuiNSRecord = {
			address: address || '',
			ownerAddress: ownerAddress,
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

		if (!expired) {
			if (suinsMemCache.size > 100) {
				const first = suinsMemCache.keys().next().value
				if (first) suinsMemCache.delete(first)
			}
			suinsMemCache.set(key, { data: record, exp: Date.now() + 300000 })
		}

		return { found: true, data: record, cacheTtl: CACHE_TTL, expired, inGracePeriod }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		// SuinsClient throws ObjectError with "does not exist" for genuinely non-existent names
		if (message.includes('does not exist')) {
			return { found: false, error: `Name "${suinsName}" not found`, available: true }
		}
		// Other resolution errors - do NOT mark as available, this could be a registered name
		// that we failed to resolve due to network/RPC issues
		return { found: false, error: message, available: false }
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
		const suiClient = new SuiJsonRpcClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
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
