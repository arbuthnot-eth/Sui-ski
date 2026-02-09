import { Hono } from 'hono'
import { resolveSuiNS } from '../resolvers/suins'
import type { Env } from '../types'
import { getUSDCSuiPrice } from '../utils/ns-price'
import { jsonResponse } from '../utils/response'
import { computeSwapQuote, getSolSuiPrice } from '../utils/sol-price'

type SolSwapEnv = {
	Bindings: Env
	Variables: {
		env: Env
	}
}

const DEFAULT_FEE_BPS = 50
const DEFAULT_ONCHAIN_FEE_BPS = 30
const SUI_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{2,}$/

export const solSwapRoutes = new Hono<SolSwapEnv>()

function isResolvedAddressRecord(data: unknown): data is { address: string } {
	if (!data || typeof data !== 'object') return false
	if (!('address' in data)) return false
	return typeof data.address === 'string'
}

function normalizeTargetName(target: string): string {
	const trimmed = target.trim().toLowerCase()
	if (!trimmed) return ''
	return trimmed.endsWith('.sui') ? trimmed : `${trimmed}.sui`
}

async function resolveSuiDestination(
	target: string,
	env: Env,
): Promise<{ address: string; targetName?: string }> {
	const raw = String(target || '').trim()
	if (!raw) throw new Error('Sui destination is required')

	if (SUI_ADDRESS_PATTERN.test(raw)) {
		return { address: raw }
	}

	const targetName = normalizeTargetName(raw)
	if (!targetName) throw new Error('Invalid Sui destination')
	const resolution = await resolveSuiNS(targetName, env)
	if (
		!resolution.found ||
		!isResolvedAddressRecord(resolution.data) ||
		!SUI_ADDRESS_PATTERN.test(resolution.data.address)
	) {
		throw new Error(`Unable to resolve Sui destination: ${targetName}`)
	}

	return { address: resolution.data.address, targetName }
}

solSwapRoutes.get('/quote', async (c) => {
	const env = c.get('env')
	const direction = c.req.query('direction') || 'sol_to_sui'
	const amountStr = c.req.query('amount')

	if (!amountStr || Number.isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
		return jsonResponse({ error: 'Valid positive amount required' }, 400)
	}

	const amount = Number(amountStr)
	let price: Awaited<ReturnType<typeof getSolSuiPrice>>
	try {
		price = await getSolSuiPrice(env)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Price service unavailable'
		return jsonResponse({ error: `Unable to fetch quote right now: ${message}` }, 503)
	}
	const poolId = env.SOL_SWAP_POOL_ID
	const solanaAddress = env.SOL_SWAP_SOLANA_ADDRESS

	if (direction === 'sol_to_sui') {
		const quote = computeSwapQuote(amount, price.suiPerSol, DEFAULT_FEE_BPS)
		return jsonResponse({
			direction: 'sol_to_sui',
			inputAmount: amount,
			inputCurrency: 'SOL',
			outputAmount: Number(quote.outputSui.toFixed(6)),
			outputCurrency: 'SUI',
			rate: Number(price.suiPerSol.toFixed(6)),
			fee: Number(quote.feeAmount.toFixed(6)),
			feeBps: DEFAULT_FEE_BPS,
			solanaDepositAddress: solanaAddress || null,
			poolId: poolId || null,
			priceSource: price.source,
			priceTimestamp: price.timestamp,
		})
	}

	if (direction === 'usdc_to_sui') {
		let usdcPrice: Awaited<ReturnType<typeof getUSDCSuiPrice>>
		try {
			usdcPrice = await getUSDCSuiPrice(env)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'USDC/SUI price service unavailable'
			return jsonResponse({ error: `Unable to fetch quote right now: ${message}` }, 503)
		}
		const quote = computeSwapQuote(amount, usdcPrice.suiPerUsdc, DEFAULT_ONCHAIN_FEE_BPS)
		return jsonResponse({
			direction: 'usdc_to_sui',
			inputAmount: amount,
			inputCurrency: 'USDC',
			outputAmount: Number(quote.outputSui.toFixed(6)),
			outputCurrency: 'SUI',
			rate: Number(usdcPrice.suiPerUsdc.toFixed(6)),
			fee: Number(quote.feeAmount.toFixed(6)),
			feeBps: DEFAULT_ONCHAIN_FEE_BPS,
			route: 'deepbook_sui_usdc',
			priceSource: usdcPrice.source,
			priceTimestamp: usdcPrice.timestamp,
		})
	}

	return jsonResponse({ error: 'Supported directions: sol_to_sui, usdc_to_sui' }, 400)
})

solSwapRoutes.get('/status', async (c) => {
	const env = c.get('env')
	const poolId = env.SOL_SWAP_POOL_ID
	const solanaAddress = env.SOL_SWAP_SOLANA_ADDRESS

	let price = null
	try {
		price = await getSolSuiPrice(env)
	} catch {
		price = null
	}

	return jsonResponse({
		active: Boolean(solanaAddress),
		poolId: poolId || null,
		solanaAddress: solanaAddress || null,
		rate: price ? { suiPerSol: price.suiPerSol, solPerSui: price.solPerSui } : null,
		feeBps: DEFAULT_FEE_BPS,
		priceSource: price?.source || null,
	})
})

solSwapRoutes.post('/request', async (c) => {
	const env = c.get('env')
	const solanaAddress = env.SOL_SWAP_SOLANA_ADDRESS

	if (!solanaAddress) {
		return jsonResponse({ error: 'Cross-chain swap not configured' }, 503)
	}

	const body = await c.req.json<{ solAmount?: number; suiAddress?: string; suiTarget?: string }>()
	const solAmount = body.solAmount
	const targetInput = String(body.suiTarget || body.suiAddress || '').trim()

	if (!solAmount || solAmount <= 0) {
		return jsonResponse({ error: 'Valid solAmount required' }, 400)
	}
	if (!targetInput) {
		return jsonResponse({ error: 'A Sui destination address or name is required' }, 400)
	}

	let resolvedDestination: { address: string; targetName?: string }
	try {
		resolvedDestination = await resolveSuiDestination(targetInput, env)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid Sui destination'
		return jsonResponse({ error: message }, 400)
	}

	let price: Awaited<ReturnType<typeof getSolSuiPrice>>
	try {
		price = await getSolSuiPrice(env)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Price service unavailable'
		return jsonResponse({ error: `Unable to fetch quote right now: ${message}` }, 503)
	}

	const quote = computeSwapQuote(solAmount, price.suiPerSol, DEFAULT_FEE_BPS)

	const requestId = crypto.randomUUID()
	const expiresAt = Date.now() + 30 * 60 * 1000

	return jsonResponse({
		requestId,
		depositAddress: solanaAddress,
		solAmount,
		expectedSui: Number(quote.outputSui.toFixed(6)),
		rate: Number(price.suiPerSol.toFixed(6)),
		fee: Number(quote.feeAmount.toFixed(6)),
		expiresAt,
		suiAddress: resolvedDestination.address,
		suiTarget: resolvedDestination.targetName || null,
	})
})

solSwapRoutes.post('/confirm', async (c) => {
	const body = await c.req.json<{ requestId?: string; solTxSignature?: string }>()

	if (!body.requestId || !body.solTxSignature) {
		return jsonResponse({ error: 'requestId and solTxSignature required' }, 400)
	}

	return jsonResponse({
		status: 'pending_verification',
		requestId: body.requestId,
		solTxSignature: body.solTxSignature,
		message: 'Solana transaction verification in progress. Settlement will complete shortly.',
	})
})
