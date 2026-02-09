import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import { Hono } from 'hono'
import type { Env, X402VerifiedPayment } from '../types'
import { jsonResponse } from '../utils/response'
import { getDefaultRpcUrl } from '../utils/rpc'
import {
	getActiveCapsForDomain,
	getAllowlistJacketById,
	getFeeJacketById,
	getRateLimitJacketById,
	getSubnameCapById,
	getSubnameCapsOwnedBy,
	relaySignedTransaction,
} from '../utils/subnamecap-queries'
import {
	buildAddToAllowlistTx,
	buildClearActiveCapsTx,
	buildCreateAllowlistJacketTx,
	buildCreateFeeJacketTx,
	buildCreateRateLimitJacketTx,
	buildCreateSingleUseJacketTx,
	buildCreateSubnameCapTx,
	buildNewLeafAllowedTx,
	buildNewLeafRateLimitedTx,
	buildNewLeafWithCapTx,
	buildNewLeafWithFeeTx,
	buildNewNodeWithCapTx,
	buildRevokeSubnameCapTx,
	buildSurrenderSubnameCapTx,
	buildUpdateFeesTx,
	buildUpdateRateLimitTx,
	buildUseSingleUseJacketLeafTx,
	buildUseSingleUseJacketNodeTx,
	serializeTransaction,
} from '../utils/subnamecap-transactions'
import { resolveX402Providers, x402PaymentMiddleware } from '../utils/x402-middleware'
import { resolveX402Recipient } from '../utils/x402-sui'

type SubnameCapEnv = {
	Bindings: Env
	Variables: {
		env: Env
		x402Payment?: X402VerifiedPayment
	}
}

const SUBNAME_FEE_MIST = BigInt(1_000_000_000)
const SUBNAME_FEE_SUI = 1

export const subnameCapRoutes = new Hono<SubnameCapEnv>()

function normalizeSuinsName(value: string): string {
	const trimmed = value.trim().toLowerCase()
	if (!trimmed) return ''
	return trimmed.endsWith('.sui') ? trimmed : `${trimmed}.sui`
}

function isValidSuiAddress(value: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(value.trim())
}

async function resolveSuinsTargetAddress(name: string, env: Env): Promise<string | null> {
	const normalizedName = normalizeSuinsName(name)
	if (!normalizedName) return null

	const suiClient = new SuiClient({
		url: getDefaultRpcUrl(env.SUI_NETWORK),
		network: env.SUI_NETWORK,
	})
	const suinsClient = new SuinsClient({
		client: suiClient as never,
		network: env.SUI_NETWORK as 'mainnet' | 'testnet',
	})

	try {
		const nameRecord = await suinsClient.getNameRecord(normalizedName)
		if (nameRecord?.targetAddress && isValidSuiAddress(nameRecord.targetAddress)) {
			return nameRecord.targetAddress
		}
	} catch {
		// Fallback below
	}

	try {
		const resolved = await suiClient.resolveNameServiceAddress({ name: normalizedName })
		if (resolved && isValidSuiAddress(resolved)) {
			return resolved
		}
	} catch {
		// Ignore and return null
	}

	return null
}

subnameCapRoutes.get('/resolve-target', async (c) => {
	const env = c.get('env')
	const name = c.req.query('name')?.trim() || ''
	if (!name) {
		return jsonResponse({ error: 'name query parameter is required' }, 400)
	}
	try {
		const normalizedName = normalizeSuinsName(name)
		const targetAddress = await resolveSuinsTargetAddress(normalizedName, env)
		if (!targetAddress) {
			return jsonResponse({ error: `No target address found for ${normalizedName}` }, 404)
		}
		return jsonResponse({ name: normalizedName, targetAddress })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to resolve target address'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.get('/caps/owned/:address', async (c) => {
	const address = c.req.param('address')
	const env = c.get('env')
	try {
		const caps = await getSubnameCapsOwnedBy(address, env)
		return jsonResponse({ caps, count: caps.length })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch caps'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.get('/caps/:domain', async (c) => {
	const domain = c.req.param('domain')
	const env = c.get('env')
	try {
		const caps = await getActiveCapsForDomain(domain, env)
		return jsonResponse({ domain, caps, count: caps.length })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch active caps'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.get('/cap/:capId', async (c) => {
	const capId = c.req.param('capId')
	const env = c.get('env')
	try {
		const cap = await getSubnameCapById(capId, env)
		if (!cap) return jsonResponse({ error: 'Cap not found' }, 404)
		return jsonResponse(cap)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch cap'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/create-cap', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			parentNftId: string
			allowLeafCreation: boolean
			allowNodeCreation: boolean
			defaultNodeAllowCreation?: boolean
			defaultNodeAllowExtension?: boolean
			maxUses?: number
			maxDurationMs?: number
			capExpirationMs?: number
			senderAddress: string
		}>()

		if (!body.parentNftId || !body.senderAddress) {
			return jsonResponse({ error: 'parentNftId and senderAddress are required' }, 400)
		}

		const tx = buildCreateSubnameCapTx(
			{
				parentNftId: body.parentNftId,
				allowLeafCreation: body.allowLeafCreation ?? true,
				allowNodeCreation: body.allowNodeCreation ?? false,
				defaultNodeAllowCreation: body.defaultNodeAllowCreation,
				defaultNodeAllowExtension: body.defaultNodeAllowExtension,
				maxUses: body.maxUses ?? null,
				maxDurationMs: body.maxDurationMs ?? null,
				capExpirationMs: body.capExpirationMs ?? null,
				senderAddress: body.senderAddress,
			},
			env,
		)

		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/revoke-cap', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			parentNftId: string
			capId: string
			senderAddress: string
		}>()

		if (!body.parentNftId || !body.capId || !body.senderAddress) {
			return jsonResponse({ error: 'parentNftId, capId, and senderAddress are required' }, 400)
		}

		const tx = buildRevokeSubnameCapTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/surrender-cap', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			capObjectId: string
			senderAddress: string
		}>()

		if (!body.capObjectId || !body.senderAddress) {
			return jsonResponse({ error: 'capObjectId and senderAddress are required' }, 400)
		}

		const tx = buildSurrenderSubnameCapTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/clear-caps', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			parentNftId: string
			senderAddress: string
		}>()

		if (!body.parentNftId || !body.senderAddress) {
			return jsonResponse({ error: 'parentNftId and senderAddress are required' }, 400)
		}

		const tx = buildClearActiveCapsTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/create-leaf', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			capObjectId: string
			subdomainName: string
			targetAddress: string
			senderAddress: string
		}>()

		if (!body.capObjectId || !body.subdomainName || !body.targetAddress || !body.senderAddress) {
			return jsonResponse(
				{ error: 'capObjectId, subdomainName, targetAddress, and senderAddress are required' },
				400,
			)
		}

		const tx = buildNewLeafWithCapTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/create-node', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			capObjectId: string
			subdomainName: string
			expirationTimestampMs: number
			senderAddress: string
		}>()

		if (
			!body.capObjectId ||
			!body.subdomainName ||
			!body.expirationTimestampMs ||
			!body.senderAddress
		) {
			return jsonResponse(
				{
					error:
						'capObjectId, subdomainName, expirationTimestampMs, and senderAddress are required',
				},
				400,
			)
		}

		const tx = buildNewNodeWithCapTx(body, env)

		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/relay', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			txBytes: string
			signatures: string[]
		}>()

		if (!body.txBytes || !body.signatures?.length) {
			return jsonResponse({ error: 'txBytes and signatures are required' }, 400)
		}

		const result = await relaySignedTransaction(body.txBytes, body.signatures, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to relay transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.get('/info', async (c) => {
	const env = c.get('env')
	return jsonResponse({
		network: env.SUI_NETWORK,
		configured: !!(
			env.SUBNAMECAP_SUINS_PACKAGE_ID &&
			env.SUBNAMECAP_SUBDOMAINS_PACKAGE_ID &&
			env.SUBNAMECAP_SUINS_OBJECT_ID
		),
		packages: {
			suins: env.SUBNAMECAP_SUINS_PACKAGE_ID || null,
			subdomains: env.SUBNAMECAP_SUBDOMAINS_PACKAGE_ID || null,
			suinsObject: env.SUBNAMECAP_SUINS_OBJECT_ID || null,
			singleUseJacket: env.JACKET_SINGLE_USE_PACKAGE_ID || null,
			feeJacket: env.JACKET_FEE_PACKAGE_ID || null,
			allowlistJacket: env.JACKET_ALLOWLIST_PACKAGE_ID || null,
			rateLimitJacket: env.JACKET_RATE_LIMIT_PACKAGE_ID || null,
		},
		jackets: {
			fee: env.JACKET_FEE_OBJECT_ID || null,
			allowlist: env.JACKET_ALLOWLIST_OBJECT_ID || null,
			rateLimit: env.JACKET_RATE_LIMIT_OBJECT_ID || null,
		},
		agentPricing: {
			leafSubname: {
				amount: SUBNAME_FEE_MIST.toString(),
				amountSui: SUBNAME_FEE_SUI,
				currency: 'SUI',
			},
		},
	})
})

subnameCapRoutes.post('/jacket/single-use/create', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			parentNftId: string
			recipientAddress?: string
			recipientName?: string
			allowNodeCreation: boolean
			maxUses?: number
			maxDurationMs?: number
			capExpirationMs?: number
			senderAddress: string
		}>()

		if (!body.parentNftId || !body.senderAddress) {
			return jsonResponse({ error: 'parentNftId and senderAddress are required' }, 400)
		}

		let recipientAddress = body.recipientAddress?.trim() || ''
		let recipientName: string | null = null
		let usedSelfFallbackForUnresolvedName = false
		if (!recipientAddress && body.recipientName?.trim()) {
			recipientName = normalizeSuinsName(body.recipientName)
		} else if (recipientAddress && !isValidSuiAddress(recipientAddress)) {
			recipientName = normalizeSuinsName(recipientAddress)
			recipientAddress = ''
		}

		if (!recipientAddress && recipientName) {
			const resolved = await resolveSuinsTargetAddress(recipientName, env)
			if (resolved) {
				recipientAddress = resolved
			} else {
				recipientAddress = body.senderAddress
				usedSelfFallbackForUnresolvedName = true
			}
		}

		recipientAddress = recipientAddress || body.senderAddress
		if (!isValidSuiAddress(recipientAddress)) {
			return jsonResponse(
				{ error: 'recipientAddress must be a valid Sui address or .sui name' },
				400,
			)
		}

		const tx = buildCreateSingleUseJacketTx(
			{
				parentNftId: body.parentNftId,
				recipientAddress,
				allowNodeCreation: body.allowNodeCreation ?? false,
				maxUses: body.maxUses ?? null,
				maxDurationMs: body.maxDurationMs ?? null,
				capExpirationMs: body.capExpirationMs ?? null,
				senderAddress: body.senderAddress,
			},
			env,
		)

		const result = await serializeTransaction(tx, env)
		return jsonResponse({
			...result,
			recipientAddress,
			recipientName: recipientName || null,
			requiresRecipientFallbackConfirmation: usedSelfFallbackForUnresolvedName,
			recipientFallbackMessage: usedSelfFallbackForUnresolvedName
				? `No target address found for ${recipientName}. Voucher will default to sender ${body.senderAddress}.`
				: null,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/single-use/use-leaf', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			jacketObjectId: string
			subdomainName: string
			targetAddress: string
			senderAddress: string
		}>()

		if (!body.jacketObjectId || !body.subdomainName || !body.targetAddress || !body.senderAddress) {
			return jsonResponse(
				{ error: 'jacketObjectId, subdomainName, targetAddress, and senderAddress are required' },
				400,
			)
		}

		const tx = buildUseSingleUseJacketLeafTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/single-use/use-node', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			jacketObjectId: string
			subdomainName: string
			expirationDays: number
			senderAddress: string
		}>()

		if (!body.jacketObjectId || !body.subdomainName || !body.senderAddress) {
			return jsonResponse(
				{ error: 'jacketObjectId, subdomainName, and senderAddress are required' },
				400,
			)
		}

		const days = body.expirationDays ?? 365
		const expirationTimestampMs = Date.now() + days * 86_400_000

		const tx = buildUseSingleUseJacketNodeTx(
			{
				jacketObjectId: body.jacketObjectId,
				subdomainName: body.subdomainName,
				expirationTimestampMs,
				senderAddress: body.senderAddress,
			},
			env,
		)

		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.get('/jacket/fee/:id', async (c) => {
	const jacketId = c.req.param('id')
	const env = c.get('env')
	try {
		const jacket = await getFeeJacketById(jacketId, env)
		if (!jacket) return jsonResponse({ error: 'Fee jacket not found' }, 404)
		return jsonResponse(jacket)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch fee jacket'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/fee/create', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			parentNftId: string
			leafFee: number
			nodeFee: number
			feeRecipient: string
			maxUses?: number
			maxDurationMs?: number
			capExpirationMs?: number
			senderAddress: string
		}>()

		if (!body.parentNftId || !body.feeRecipient || !body.senderAddress) {
			return jsonResponse(
				{ error: 'parentNftId, feeRecipient, and senderAddress are required' },
				400,
			)
		}

		const tx = buildCreateFeeJacketTx(
			{
				parentNftId: body.parentNftId,
				leafFee: body.leafFee ?? 1_000_000_000,
				nodeFee: body.nodeFee ?? 5_000_000_000,
				feeRecipient: body.feeRecipient,
				maxUses: body.maxUses ?? null,
				maxDurationMs: body.maxDurationMs ?? null,
				capExpirationMs: body.capExpirationMs ?? null,
				senderAddress: body.senderAddress,
			},
			env,
		)

		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/fee/create-leaf', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			jacketObjectId: string
			feeMist: number
			subdomainName: string
			targetAddress: string
			senderAddress: string
		}>()

		if (!body.jacketObjectId || !body.subdomainName || !body.targetAddress || !body.senderAddress) {
			return jsonResponse(
				{ error: 'jacketObjectId, subdomainName, targetAddress, and senderAddress are required' },
				400,
			)
		}

		const tx = buildNewLeafWithFeeTx(
			{
				jacketObjectId: body.jacketObjectId,
				feeMist: body.feeMist ?? 1_000_000_000,
				subdomainName: body.subdomainName,
				targetAddress: body.targetAddress,
				senderAddress: body.senderAddress,
			},
			env,
		)

		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/fee/update-fees', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			adminCapId: string
			jacketObjectId: string
			leafFee: number
			nodeFee: number
			senderAddress: string
		}>()

		if (!body.adminCapId || !body.jacketObjectId || !body.senderAddress) {
			return jsonResponse(
				{ error: 'adminCapId, jacketObjectId, and senderAddress are required' },
				400,
			)
		}

		const tx = buildUpdateFeesTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.get('/jacket/allowlist/:id', async (c) => {
	const jacketId = c.req.param('id')
	const env = c.get('env')
	try {
		const jacket = await getAllowlistJacketById(jacketId, env)
		if (!jacket) return jsonResponse({ error: 'Allowlist jacket not found' }, 404)
		return jsonResponse(jacket)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch allowlist jacket'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/allowlist/create', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			parentNftId: string
			maxUses?: number
			maxDurationMs?: number
			capExpirationMs?: number
			senderAddress: string
		}>()

		if (!body.parentNftId || !body.senderAddress) {
			return jsonResponse({ error: 'parentNftId and senderAddress are required' }, 400)
		}

		const tx = buildCreateAllowlistJacketTx(
			{
				parentNftId: body.parentNftId,
				maxUses: body.maxUses ?? null,
				maxDurationMs: body.maxDurationMs ?? null,
				capExpirationMs: body.capExpirationMs ?? null,
				senderAddress: body.senderAddress,
			},
			env,
		)

		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/allowlist/add', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			adminCapId: string
			jacketObjectId: string
			addresses: string[]
			senderAddress: string
		}>()

		if (
			!body.adminCapId ||
			!body.jacketObjectId ||
			!body.addresses?.length ||
			!body.senderAddress
		) {
			return jsonResponse(
				{ error: 'adminCapId, jacketObjectId, addresses, and senderAddress are required' },
				400,
			)
		}

		const tx = buildAddToAllowlistTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/allowlist/create-leaf', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			jacketObjectId: string
			subdomainName: string
			targetAddress: string
			senderAddress: string
		}>()

		if (!body.jacketObjectId || !body.subdomainName || !body.targetAddress || !body.senderAddress) {
			return jsonResponse(
				{ error: 'jacketObjectId, subdomainName, targetAddress, and senderAddress are required' },
				400,
			)
		}

		const tx = buildNewLeafAllowedTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.get('/jacket/ratelimit/:id', async (c) => {
	const jacketId = c.req.param('id')
	const env = c.get('env')
	try {
		const jacket = await getRateLimitJacketById(jacketId, env)
		if (!jacket) return jsonResponse({ error: 'Rate limit jacket not found' }, 404)
		return jsonResponse(jacket)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch rate limit jacket'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/ratelimit/create', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			parentNftId: string
			maxPerWindow: number
			windowDurationMs: number
			maxUses?: number
			maxDurationMs?: number
			capExpirationMs?: number
			senderAddress: string
		}>()

		if (!body.parentNftId || !body.senderAddress) {
			return jsonResponse({ error: 'parentNftId and senderAddress are required' }, 400)
		}

		const tx = buildCreateRateLimitJacketTx(
			{
				parentNftId: body.parentNftId,
				maxPerWindow: body.maxPerWindow ?? 10,
				windowDurationMs: body.windowDurationMs ?? 3_600_000,
				maxUses: body.maxUses ?? null,
				maxDurationMs: body.maxDurationMs ?? null,
				capExpirationMs: body.capExpirationMs ?? null,
				senderAddress: body.senderAddress,
			},
			env,
		)

		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/ratelimit/create-leaf', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			jacketObjectId: string
			subdomainName: string
			targetAddress: string
			senderAddress: string
		}>()

		if (!body.jacketObjectId || !body.subdomainName || !body.targetAddress || !body.senderAddress) {
			return jsonResponse(
				{ error: 'jacketObjectId, subdomainName, targetAddress, and senderAddress are required' },
				400,
			)
		}

		const tx = buildNewLeafRateLimitedTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

subnameCapRoutes.post('/jacket/ratelimit/update', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{
			adminCapId: string
			jacketObjectId: string
			maxPerWindow: number
			windowDurationMs: number
			senderAddress: string
		}>()

		if (!body.adminCapId || !body.jacketObjectId || !body.senderAddress) {
			return jsonResponse(
				{ error: 'adminCapId, jacketObjectId, and senderAddress are required' },
				400,
			)
		}

		const tx = buildUpdateRateLimitTx(body, env)
		const result = await serializeTransaction(tx, env)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
})

function getSubnameCapRpcUrl(env: Env): string {
	return env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK)
}

async function getAgentRelayAddress(env: Env): Promise<string | null> {
	try {
		const suiClient = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})
		const nameRecord = await suinsClient.getNameRecord('atlas.sui')
		return nameRecord?.targetAddress || null
	} catch {
		return null
	}
}

async function verifyAgentPayment(
	env: Env,
	txDigest: string,
	expectedRecipient: string,
	expectedAmount: bigint,
): Promise<{ valid: boolean; error?: string }> {
	try {
		const suiClient = new SuiClient({
			url: getSubnameCapRpcUrl(env),
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})

		const txResponse = await suiClient.getTransaction({
			digest: txDigest,
			options: { showEffects: true, showBalanceChanges: true },
		})

		if (!txResponse) return { valid: false, error: 'Transaction not found' }

		const effects = txResponse.effects
		if (effects?.status?.status !== 'success') {
			return { valid: false, error: 'Transaction failed' }
		}

		const balanceChanges = txResponse.balanceChanges || []
		const recipientChange = balanceChanges.find(
			(change) =>
				'AddressOwner' in (change.owner as Record<string, unknown>) &&
				(change.owner as { AddressOwner: string }).AddressOwner === expectedRecipient &&
				change.coinType === '0x2::sui::SUI',
		)

		if (!recipientChange) {
			return { valid: false, error: 'Payment not found to expected recipient' }
		}

		if (BigInt(recipientChange.amount) < expectedAmount) {
			return {
				valid: false,
				error: `Insufficient payment: expected ${expectedAmount}, got ${recipientChange.amount}`,
			}
		}

		return { valid: true }
	} catch (error) {
		console.error('Agent payment verification error:', error)
		return { valid: false, error: 'Failed to verify payment' }
	}
}

function generateAgentRequestId(): string {
	return `subcap_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

export const agentSubnameCapRoutes = new Hono<SubnameCapEnv>()

agentSubnameCapRoutes.get('/info', async (c) => {
	const env = c.get('env')
	const [relayAddress, x402Address] = await Promise.all([
		getAgentRelayAddress(env),
		resolveX402Recipient(env),
	])
	const x402Providers = resolveX402Providers(env)

	return jsonResponse({
		service: 'SubnameCap Agent API',
		description: 'Register subnames under delegated domains via x402 payment',
		pricing: {
			leafSubname: {
				amount: SUBNAME_FEE_MIST.toString(),
				amountSui: SUBNAME_FEE_SUI,
				currency: 'SUI',
				chain: env.SUI_NETWORK,
			},
		},
		paymentRecipient: relayAddress,
		paymentMethods: x402Address ? ['x402', 'legacy'] : ['legacy'],
		x402: x402Address
			? {
					scheme: 'exact-sui',
					network: `sui:${env.SUI_NETWORK}`,
					version: 2,
					asset: '0x2::sui::SUI',
					payTo: x402Address,
					verificationMethod: 'pre-executed',
					verificationProviders: x402Providers,
				}
			: null,
		endpoints: {
			register: 'POST /api/agents/subnamecap/register',
			info: 'GET /api/agents/subnamecap/info',
			status: 'GET /api/agents/subnamecap/status/:id',
		},
	})
})

agentSubnameCapRoutes.post(
	'/register',
	x402PaymentMiddleware({
		description: 'Register a leaf subname under a delegated SuiNS domain',
		amountMist: SUBNAME_FEE_MIST.toString(),
	}),
	async (c) => {
		const env = c.get('env')

		let payload: {
			parentDomain?: string
			subname?: string
			target?: string
		}
		try {
			payload = await c.req.json()
		} catch {
			return jsonResponse({ error: 'Invalid JSON body' }, 400)
		}

		const parentDomain = payload.parentDomain?.trim()
		const subname = payload.subname?.trim()
		const target = payload.target?.trim()

		if (!parentDomain || !subname || !target) {
			return jsonResponse({ error: 'parentDomain, subname, and target are required' }, 400)
		}

		if (!/^0x[a-fA-F0-9]{64}$/.test(target)) {
			return jsonResponse({ error: 'Invalid target address format' }, 400)
		}

		const x402Payment = c.get('x402Payment')
		let paymentDigest: string
		let paymentMethod: 'x402' | 'legacy'
		let paymentProvider: string | null = null

		if (x402Payment) {
			paymentDigest = x402Payment.digest
			paymentMethod = 'x402'
			paymentProvider = x402Payment.provider
		} else {
			const legacyDigest = c.req.header('X-Payment-Tx-Digest')

			if (!legacyDigest) {
				const relayAddress = await getAgentRelayAddress(env)
				return jsonResponse(
					{
						error: 'Payment required',
						code: 'PAYMENT_REQUIRED',
						payment: {
							amount: SUBNAME_FEE_MIST.toString(),
							amountSui: SUBNAME_FEE_SUI,
							recipient: relayAddress,
							chain: env.SUI_NETWORK,
							currency: 'SUI',
							description: `Register ${subname}.${parentDomain} as a leaf subname`,
						},
						instructions: {
							step1: 'Send the specified SUI amount to the recipient address',
							step2: 'Execute the transaction and obtain the digest',
							step3: 'Retry this request with X-Payment-Tx-Digest header',
						},
					},
					402,
				)
			}

			const relayAddress = await getAgentRelayAddress(env)
			if (!relayAddress) {
				return jsonResponse({ error: 'Payment relay service unavailable' }, 503)
			}

			const verification = await verifyAgentPayment(
				env,
				legacyDigest,
				relayAddress,
				SUBNAME_FEE_MIST,
			)
			if (!verification.valid) {
				return jsonResponse(
					{
						error: 'Payment verification failed',
						code: 'INVALID_PAYMENT',
						details: verification.error,
						payment: {
							amount: SUBNAME_FEE_MIST.toString(),
							amountSui: SUBNAME_FEE_SUI,
							recipient: relayAddress,
							chain: env.SUI_NETWORK,
							currency: 'SUI',
						},
					},
					402,
				)
			}

			paymentDigest = legacyDigest
			paymentMethod = 'legacy'
		}

		const requestId = generateAgentRequestId()

		try {
			await env.CACHE.put(
				`subnamecap:agent:${requestId}`,
				JSON.stringify({
					id: requestId,
					parentDomain,
					subname,
					target,
					paymentDigest,
					paymentMethod,
					paymentProvider,
					status: 'pending',
					createdAt: Date.now(),
				}),
				{ expirationTtl: 86400 },
			)

			return jsonResponse({
				success: true,
				requestId,
				status: 'pending',
				message: `Subname registration queued: ${subname}.${parentDomain}`,
				statusUrl: `/api/agents/subnamecap/status/${requestId}`,
				paymentMethod,
				paymentProvider,
			})
		} catch (error) {
			console.error('Failed to queue subname registration:', error)
			return jsonResponse({ error: 'Failed to queue registration' }, 500)
		}
	},
)

agentSubnameCapRoutes.get('/status/:id', async (c) => {
	const requestId = c.req.param('id')
	const env = c.get('env')

	try {
		const data = await env.CACHE.get(`subnamecap:agent:${requestId}`)
		if (!data) {
			return jsonResponse({ error: 'Request not found' }, 404)
		}
		return jsonResponse(JSON.parse(data))
	} catch {
		return jsonResponse({ error: 'Failed to fetch request status' }, 500)
	}
})
