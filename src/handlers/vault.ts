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

vaultRoutes.get('/watching', async (c) => {
	const env = c.get('env')
	const address = c.req.query('address')
	const name = c.req.query('name')
	if (!address || !name) return jsonResponse({ error: 'address and name parameters required' }, 400)
	if (!isValidSuiAddress(address))
		return jsonResponse(
			{
				error: `Invalid Sui address: expected ${SUI_ADDRESS_LENGTH} hex chars starting with ${SUI_ADDRESS_PREFIX}`,
			},
			400,
		)

	const metaJson = await env.CACHE.get(vaultMetaKey(address))
	if (!metaJson) return jsonResponse({ watching: false })

	const meta: VaultMeta = JSON.parse(metaJson)
	const watching = Array.isArray(meta.names) && meta.names.includes(name)
	return jsonResponse({ watching })
})

vaultRoutes.post('/toggle-watch', async (c) => {
	const env = c.get('env')
	const body = await c.req.json<{
		ownerAddress: string
		name: string
		action: 'watch' | 'unwatch'
		encryptedBlob?: string
	}>()

	if (!body.ownerAddress || !body.name || !body.action)
		return jsonResponse({ error: 'ownerAddress, name, and action are required' }, 400)
	if (!isValidSuiAddress(body.ownerAddress))
		return jsonResponse(
			{
				error: `Invalid ownerAddress: expected ${SUI_ADDRESS_LENGTH} hex chars starting with ${SUI_ADDRESS_PREFIX}`,
			},
			400,
		)

	const metaJson = await env.CACHE.get(vaultMetaKey(body.ownerAddress))
	const meta: VaultMeta = metaJson
		? JSON.parse(metaJson)
		: { version: 1, updatedAt: Date.now(), count: 0, names: [] }

	if (!Array.isArray(meta.names)) meta.names = []

	if (body.action === 'watch') {
		if (!meta.names.includes(body.name)) {
			if (meta.names.length >= VAULT_MAX_BOOKMARKS)
				return jsonResponse({ error: `Vault full: max ${VAULT_MAX_BOOKMARKS} bookmarks` }, 400)
			meta.names.push(body.name)
			meta.count = meta.names.length
		}
	} else {
		const idx = meta.names.indexOf(body.name)
		if (idx !== -1) {
			meta.names.splice(idx, 1)
			meta.count = meta.names.length
		}
	}

	meta.updatedAt = Date.now()

	const writes: Promise<void>[] = [
		env.CACHE.put(vaultMetaKey(body.ownerAddress), JSON.stringify(meta), {
			expirationTtl: VAULT_TTL_SECONDS,
		}),
	]

	if (body.encryptedBlob) {
		if (body.encryptedBlob.length > VAULT_BLOB_MAX_BYTES)
			return jsonResponse(
				{ error: `encryptedBlob exceeds max size of ${VAULT_BLOB_MAX_BYTES} bytes` },
				400,
			)
		writes.push(
			env.CACHE.put(vaultKey(body.ownerAddress), body.encryptedBlob, {
				expirationTtl: VAULT_TTL_SECONDS,
			}),
		)
	}

	await Promise.all(writes)

	return jsonResponse({ success: true, watching: body.action === 'watch', meta })
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
