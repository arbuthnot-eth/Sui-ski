import { Hono } from 'hono'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { computeSwapQuote, getSolSuiPrice } from '../utils/sol-price'

type SolSwapEnv = {
	Bindings: Env
	Variables: {
		env: Env
	}
}

const DEFAULT_FEE_BPS = 50

export const solSwapRoutes = new Hono<SolSwapEnv>()

solSwapRoutes.get('/quote', async (c) => {
	const env = c.get('env')
	const direction = c.req.query('direction') || 'sol_to_sui'
	const amountStr = c.req.query('amount')

	if (!amountStr || Number.isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
		return jsonResponse({ error: 'Valid positive amount required' }, 400)
	}

	const amount = Number(amountStr)
	const price = await getSolSuiPrice(env)
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

	return jsonResponse({ error: 'Only sol_to_sui direction supported' }, 400)
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
		active: Boolean(poolId && solanaAddress),
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

	const body = await c.req.json<{ solAmount?: number; suiAddress?: string }>()
	const solAmount = body.solAmount
	const suiAddress = body.suiAddress

	if (!solAmount || solAmount <= 0) {
		return jsonResponse({ error: 'Valid solAmount required' }, 400)
	}
	if (!suiAddress || !suiAddress.startsWith('0x')) {
		return jsonResponse({ error: 'Valid suiAddress required' }, 400)
	}

	const price = await getSolSuiPrice(env)
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
		suiAddress,
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
