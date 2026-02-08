import type { Env } from '../types'
import { cacheKey, getCached, setCache } from './cache'

export interface SolSuiPriceResult {
	solPerSui: number
	suiPerSol: number
	solUsd: number
	suiUsd: number
	source: 'coingecko'
	timestamp: number
}

const COINGECKO_PRICE_URL =
	'https://api.coingecko.com/api/v3/simple/price?ids=solana,sui&vs_currencies=usd'
const _CACHE_TTL_SECONDS = 60
const KV_CACHE_TTL_SECONDS = 300
const MAX_STALENESS_MS = 5 * 60 * 1000

export async function getSolSuiPrice(_env: Env): Promise<SolSuiPriceResult> {
	const key = cacheKey('sol-sui-price', 'v1')
	const cached = await getCached<SolSuiPriceResult>(key)
	if (cached && Date.now() - cached.timestamp < MAX_STALENESS_MS) {
		return cached
	}

	const response = await fetch(COINGECKO_PRICE_URL, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(8000),
	})

	if (!response.ok) {
		if (cached) return cached
		throw new Error(`CoinGecko API error: ${response.status}`)
	}

	const data = (await response.json()) as {
		solana?: { usd?: number }
		sui?: { usd?: number }
	}

	const solUsd = data.solana?.usd
	const suiUsd = data.sui?.usd
	if (!solUsd || !suiUsd || solUsd <= 0 || suiUsd <= 0) {
		if (cached) return cached
		throw new Error('Invalid price data from CoinGecko')
	}

	const result: SolSuiPriceResult = {
		solPerSui: suiUsd / solUsd,
		suiPerSol: solUsd / suiUsd,
		solUsd,
		suiUsd,
		source: 'coingecko',
		timestamp: Date.now(),
	}

	await setCache(key, result, KV_CACHE_TTL_SECONDS)

	return result
}

export function computeSwapQuote(
	solAmount: number,
	suiPerSol: number,
	feeBps: number,
): { outputSui: number; feeAmount: number; rate: number } {
	const grossSui = solAmount * suiPerSol
	const feeAmount = (grossSui * feeBps) / 10000
	const outputSui = grossSui - feeAmount
	return { outputSui, feeAmount, rate: suiPerSol }
}
