import { Hono } from 'hono'
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
	}
}

const SUI_ADDRESS_LENGTH = 66
const SUI_ADDRESS_PREFIX = '0x'

function isValidSuiAddress(address: string): boolean {
	return address.startsWith(SUI_ADDRESS_PREFIX) && address.length === SUI_ADDRESS_LENGTH
}

export const vaultRoutes = new Hono<VaultEnv>()

vaultRoutes.get('/config', (c) => {
	const env = c.get('env')
	const keyServers = (env.SEAL_KEY_SERVERS || '').split(',')
	const filtered: string[] = []
	for (const s of keyServers) {
		const trimmed = s.trim()
		if (trimmed) filtered.push(trimmed)
	}
	return jsonResponse({
		seal: {
			packageId: env.SEAL_PACKAGE_ID || '',
			keyServers: filtered,
			approveTarget: env.SEAL_APPROVE_TARGET || null,
			threshold: 2,
		},
	})
})

vaultRoutes.get('/', async (c) => {
	const env = c.get('env')
	const address = c.req.query('address')
	if (!address) return jsonResponse({ error: 'address query parameter required' }, 400)
	if (!isValidSuiAddress(address))
		return jsonResponse(
			{
				error: `Invalid Sui address: expected ${SUI_ADDRESS_LENGTH} hex chars starting with ${SUI_ADDRESS_PREFIX}`,
			},
			400,
		)

	const [encryptedBlob, metaJson] = await Promise.all([
		env.CACHE.get(vaultKey(address)),
		env.CACHE.get(vaultMetaKey(address)),
	])

	if (!encryptedBlob || !metaJson) return jsonResponse({ found: false })

	const meta: VaultMeta = JSON.parse(metaJson)
	return jsonResponse({ found: true, encryptedBlob, meta })
})

vaultRoutes.post('/sync', async (c) => {
	const env = c.get('env')
	const body = await c.req.json<{ encryptedBlob: string; ownerAddress: string; meta: VaultMeta }>()

	if (!body.ownerAddress) return jsonResponse({ error: 'ownerAddress is required' }, 400)
	if (!isValidSuiAddress(body.ownerAddress))
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
	if (body.meta.count > VAULT_MAX_BOOKMARKS)
		return jsonResponse(
			{ error: `Bookmark count ${body.meta.count} exceeds max of ${VAULT_MAX_BOOKMARKS}` },
			400,
		)

	await Promise.all([
		env.CACHE.put(vaultKey(body.ownerAddress), body.encryptedBlob, {
			expirationTtl: VAULT_TTL_SECONDS,
		}),
		env.CACHE.put(vaultMetaKey(body.ownerAddress), JSON.stringify(body.meta), {
			expirationTtl: VAULT_TTL_SECONDS,
		}),
	])

	return jsonResponse({ success: true })
})

vaultRoutes.get('/meta', async (c) => {
	const env = c.get('env')
	const address = c.req.query('address')
	if (!address) return jsonResponse({ error: 'address query parameter required' }, 400)
	if (!isValidSuiAddress(address))
		return jsonResponse(
			{
				error: `Invalid Sui address: expected ${SUI_ADDRESS_LENGTH} hex chars starting with ${SUI_ADDRESS_PREFIX}`,
			},
			400,
		)

	const metaJson = await env.CACHE.get(vaultMetaKey(address))
	if (!metaJson) return jsonResponse({ found: false })

	const meta: VaultMeta = JSON.parse(metaJson)
	return jsonResponse({ found: true, ...meta })
})
