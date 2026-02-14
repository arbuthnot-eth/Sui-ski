import { type Context, Hono } from 'hono'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import type { VaultMeta } from '../utils/vault'
import {
	VAULT_BLOB_MAX_BYTES,
	VAULT_MAX_BOOKMARKS,
	VAULT_TTL_SECONDS,
	vaultKey,
	vaultMetaKey,
} from '../utils/vault'

type VaultEnv = {
	Bindings: Env
	Variables: {
		env: Env
		session: {
			address: string | null
			walletName: string | null
			verified: boolean
		}
	}
}

const SUI_ADDRESS_LENGTH = 66
const SUI_ADDRESS_PREFIX = '0x'

function isValidSuiAddress(address: string): boolean {
	return address.startsWith(SUI_ADDRESS_PREFIX) && address.length === SUI_ADDRESS_LENGTH
}

function normalizeAddress(address: string): string {
	return address.trim().toLowerCase()
}

function getCookieValue(cookieHeader: string, name: string): string | null {
	const cookie = cookieHeader
		.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${name}=`))
	if (!cookie) return null
	const rawValue = cookie.slice(name.length + 1)
	return rawValue ? decodeURIComponent(rawValue) : null
}

async function getVerifiedSessionAddress(c: Context<VaultEnv>) {
	const env = c.get('env') as Env
	const cookieHeader = c.req.header('Cookie') || ''
	const sessionId = getCookieValue(cookieHeader, 'session_id')
	if (!sessionId) return null

	const stub = env.WALLET_SESSIONS.getByName('global')
	const info = await stub.getSessionInfo(sessionId)
	if (!info?.verified) return null
	if (!isValidSuiAddress(info.address)) return null
	return info.address
}

function sanitizeMeta(meta: Partial<VaultMeta>): VaultMeta {
	const version = Math.max(1, Number(meta.version) || 1)
	const count = Math.max(0, Math.floor(Number(meta.count) || 0))
	const updatedAt = Number(meta.updatedAt) || Date.now()
	return {
		version,
		updatedAt,
		count,
	}
}

export const vaultRoutes = new Hono<VaultEnv>()

const OVERCLOCK_OBJECT_ID = '0x145540d931f182fef76467dd8074c9839aea126852d90d18e1556fcbbd1208b6'

interface KeyServerConfig {
	objectId: string
	weight: number
	apiKeyName?: string
	apiKey?: string
}

function buildKeyServerConfigs(env: Env): KeyServerConfig[] {
	const ids = (env.SEAL_KEY_SERVERS || '').split(',')
	const configs: KeyServerConfig[] = []
	for (const raw of ids) {
		const objectId = raw.trim()
		if (!objectId) continue
		const config: KeyServerConfig = { objectId, weight: 1 }
		if (objectId === OVERCLOCK_OBJECT_ID) {
			configs.push(config)
			continue
		}
		if (env.NATSAI_SEAL_API_KEY) {
			config.apiKeyName = 'x-api-key'
			config.apiKey = env.NATSAI_SEAL_API_KEY
			configs.push(config)
			continue
		}
		if (env.PROVIDER3_SEAL_API_KEY) {
			config.apiKeyName = 'x-api-key'
			config.apiKey = env.PROVIDER3_SEAL_API_KEY
			configs.push(config)
			continue
		}
		configs.push(config)
	}
	return configs
}

function buildLegacyKeyServerConfigs(env: Env): KeyServerConfig[] | null {
	const ids = env.SEAL_TESTNET_KEY_SERVERS
	if (!ids) return null
	const configs: KeyServerConfig[] = []
	for (const raw of ids.split(',')) {
		const objectId = raw.trim()
		if (objectId) configs.push({ objectId, weight: 1 })
	}
	return configs.length > 0 ? configs : null
}

vaultRoutes.get('/config', (c) => {
	const env = c.get('env')
	const keyServers = buildKeyServerConfigs(env)
	const threshold = keyServers.length >= 3 ? 2 : Math.max(1, keyServers.length)
	const legacyKeyServers = buildLegacyKeyServerConfigs(env)

	return jsonResponse({
		seal: {
			packageId: env.SEAL_PACKAGE_ID || '',
			keyServers,
			approveTarget: env.SEAL_APPROVE_TARGET || null,
			threshold,
			network: env.SUI_NETWORK || 'mainnet',
		},
		...(legacyKeyServers
			? {
					sealLegacy: {
						packageId: env.SEAL_TESTNET_PACKAGE_ID || '',
						keyServers: legacyKeyServers,
						approveTarget: env.SEAL_TESTNET_APPROVE_TARGET || null,
						threshold: 2,
						network: 'testnet' as const,
					},
				}
			: {}),
	})
})

vaultRoutes.get('/', async (c) => {
	const env = c.get('env')
	const ownerAddress = await getVerifiedSessionAddress(c)
	if (!ownerAddress) return jsonResponse({ error: 'Verified wallet session required' }, 401)

	const [encryptedBlob, metaJson] = await Promise.all([
		env.CACHE.get(vaultKey(ownerAddress)),
		env.CACHE.get(vaultMetaKey(ownerAddress)),
	])

	if (!encryptedBlob || !metaJson) return jsonResponse({ found: false })

	const meta = sanitizeMeta(JSON.parse(metaJson) as VaultMeta)
	return jsonResponse({ found: true, encryptedBlob, meta })
})

vaultRoutes.post('/sync', async (c) => {
	const env = c.get('env')
	const ownerAddress = await getVerifiedSessionAddress(c)
	if (!ownerAddress) return jsonResponse({ error: 'Verified wallet session required' }, 401)
	const body = await c.req.json<{ encryptedBlob: string; ownerAddress: string; meta: VaultMeta }>()

	if (body.ownerAddress && normalizeAddress(body.ownerAddress) !== normalizeAddress(ownerAddress))
		return jsonResponse({ error: 'ownerAddress must match authenticated wallet session' }, 403)
	if (body.ownerAddress && !isValidSuiAddress(body.ownerAddress))
		return jsonResponse(
			{
				error: `Invalid ownerAddress: expected ${SUI_ADDRESS_LENGTH} hex chars starting with ${SUI_ADDRESS_PREFIX}`,
			},
			400,
		)
	if (!body.encryptedBlob) return jsonResponse({ error: 'encryptedBlob is required' }, 400)
	if (body.encryptedBlob.length > VAULT_BLOB_MAX_BYTES)
		return jsonResponse(
			{ error: `encryptedBlob exceeds max size of ${VAULT_BLOB_MAX_BYTES} bytes` },
			400,
		)
	if (!body.meta) return jsonResponse({ error: 'meta is required' }, 400)
	const nextMeta = sanitizeMeta(body.meta)
	if (nextMeta.count > VAULT_MAX_BOOKMARKS)
		return jsonResponse(
			{ error: `Bookmark count ${nextMeta.count} exceeds max of ${VAULT_MAX_BOOKMARKS}` },
			400,
		)

	await Promise.all([
		env.CACHE.put(vaultKey(ownerAddress), body.encryptedBlob, {
			expirationTtl: VAULT_TTL_SECONDS,
		}),
		env.CACHE.put(
			vaultMetaKey(ownerAddress),
			JSON.stringify({ ...nextMeta, updatedAt: Date.now() }),
			{
				expirationTtl: VAULT_TTL_SECONDS,
			},
		),
	])

	return jsonResponse({ success: true })
})

vaultRoutes.get('/watching', async (c) => {
	const ownerAddress = await getVerifiedSessionAddress(c)
	if (!ownerAddress) return jsonResponse({ error: 'Verified wallet session required' }, 401)
	return jsonResponse(
		{
			error:
				'Deprecated endpoint. Determine watching state by decrypting your wallet vault blob client-side.',
		},
		410,
	)
})

vaultRoutes.post('/toggle-watch', async (c) => {
	const env = c.get('env')
	const ownerAddress = await getVerifiedSessionAddress(c)
	if (!ownerAddress) return jsonResponse({ error: 'Verified wallet session required' }, 401)
	const body = await c.req.json<{
		ownerAddress: string
		name: string
		action: 'watch' | 'unwatch'
		encryptedBlob?: string
		meta?: VaultMeta
	}>()

	if (!body.name || !body.action)
		return jsonResponse({ error: 'name and action are required' }, 400)
	if (body.ownerAddress && normalizeAddress(body.ownerAddress) !== normalizeAddress(ownerAddress))
		return jsonResponse({ error: 'ownerAddress must match authenticated wallet session' }, 403)
	if (body.ownerAddress && !isValidSuiAddress(body.ownerAddress))
		return jsonResponse(
			{
				error: `Invalid ownerAddress: expected ${SUI_ADDRESS_LENGTH} hex chars starting with ${SUI_ADDRESS_PREFIX}`,
			},
			400,
		)

	if (!body.encryptedBlob || !body.meta)
		return jsonResponse(
			{
				error:
					'toggle-watch requires encryptedBlob + meta and no longer stores plaintext bookmark names',
			},
			410,
		)
	if (body.encryptedBlob.length > VAULT_BLOB_MAX_BYTES)
		return jsonResponse(
			{ error: `encryptedBlob exceeds max size of ${VAULT_BLOB_MAX_BYTES} bytes` },
			400,
		)
	const meta = sanitizeMeta(body.meta)
	if (meta.count > VAULT_MAX_BOOKMARKS)
		return jsonResponse({ error: `Vault full: max ${VAULT_MAX_BOOKMARKS} bookmarks` }, 400)

	await Promise.all([
		env.CACHE.put(vaultKey(ownerAddress), body.encryptedBlob, {
			expirationTtl: VAULT_TTL_SECONDS,
		}),
		env.CACHE.put(vaultMetaKey(ownerAddress), JSON.stringify({ ...meta, updatedAt: Date.now() }), {
			expirationTtl: VAULT_TTL_SECONDS,
		}),
	])

	return jsonResponse({ success: true, watching: body.action === 'watch', meta })
})

vaultRoutes.get('/meta', async (c) => {
	const env = c.get('env')
	const ownerAddress = await getVerifiedSessionAddress(c)
	if (!ownerAddress) return jsonResponse({ error: 'Verified wallet session required' }, 401)

	const metaJson = await env.CACHE.get(vaultMetaKey(ownerAddress))
	if (!metaJson) return jsonResponse({ found: false })

	const meta = sanitizeMeta(JSON.parse(metaJson) as VaultMeta)
	return jsonResponse({ found: true, ...meta })
})
