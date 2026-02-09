import type { Env } from '../types'
import { cacheKey, getCached, setCache } from './cache'
import { getUSDCSuiPrice } from './ns-price'

export interface SolSuiPriceResult {
	solPerSui: number
	suiPerSol: number
	solUsd: number
	suiUsd: number
	source: 'deepbook+jupiter' | 'deepbook+external' | 'deepbook+coingecko' | 'coingecko'
	timestamp: number
}

const COINGECKO_PRICE_URL =
	'https://api.coingecko.com/api/v3/simple/price?ids=solana,sui&vs_currencies=usd'
const JUPITER_SOL_PRICE_URL =
	'https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112'
const COINBASE_SOL_PRICE_URL = 'https://api.coinbase.com/v2/prices/SOL-USD/spot'
const BINANCE_SOL_PRICE_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT'
const KRAKEN_SOL_PRICE_URL = 'https://api.kraken.com/0/public/Ticker?pair=SOLUSD'
const KV_CACHE_TTL_SECONDS = 300
const MAX_STALENESS_MS = 5 * 60 * 1000

function isValidUsd(value: unknown): value is number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function buildResult(
	solUsd: number,
	suiUsd: number,
	source: SolSuiPriceResult['source'],
): SolSuiPriceResult {
	return {
		solPerSui: suiUsd / solUsd,
		suiPerSol: solUsd / suiUsd,
		solUsd,
		suiUsd,
		source,
		timestamp: Date.now(),
	}
}

async function fetchCoinGeckoUsdPrices(
	env: Env,
): Promise<{ solUsd: number; suiUsd: number } | null> {
	const headers: Record<string, string> = { Accept: 'application/json' }
	if (env.COINGECKO_API_KEY) {
		headers['x-cg-pro-api-key'] = env.COINGECKO_API_KEY
	}
	const response = await fetch(COINGECKO_PRICE_URL, {
		headers,
		signal: AbortSignal.timeout(8000),
	})
	if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`)

	const data = (await response.json()) as {
		solana?: { usd?: number }
		sui?: { usd?: number }
	}

	const solUsd = data.solana?.usd
	const suiUsd = data.sui?.usd
	if (!isValidUsd(solUsd) || !isValidUsd(suiUsd)) return null

	return { solUsd, suiUsd }
}

async function fetchSolUsdFromJupiter(): Promise<number | null> {
	const response = await fetch(JUPITER_SOL_PRICE_URL, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(7000),
	})
	if (!response.ok) throw new Error(`Jupiter API error: ${response.status}`)

	const data = (await response.json()) as {
		data?: Record<string, { price?: number }>
	}
	const key = 'So11111111111111111111111111111111111111112'
	const solUsd = data?.data?.[key]?.price
	return isValidUsd(solUsd) ? solUsd : null
}

async function fetchSolUsdFromCoinbase(): Promise<number | null> {
	const response = await fetch(COINBASE_SOL_PRICE_URL, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(7000),
	})
	if (!response.ok) throw new Error(`Coinbase API error: ${response.status}`)

	const data = (await response.json()) as {
		data?: { amount?: string }
	}
	const solUsd = Number(data?.data?.amount)
	return isValidUsd(solUsd) ? solUsd : null
}

async function fetchSolUsdFromBinance(): Promise<number | null> {
	const response = await fetch(BINANCE_SOL_PRICE_URL, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(7000),
	})
	if (!response.ok) throw new Error(`Binance API error: ${response.status}`)

	const data = (await response.json()) as { price?: string }
	const solUsd = Number(data?.price)
	return isValidUsd(solUsd) ? solUsd : null
}

async function fetchSolUsdFromKraken(): Promise<number | null> {
	const response = await fetch(KRAKEN_SOL_PRICE_URL, {
		headers: { Accept: 'application/json' },
		signal: AbortSignal.timeout(7000),
	})
	if (!response.ok) throw new Error(`Kraken API error: ${response.status}`)

	const data = (await response.json()) as {
		error?: string[]
		result?: Record<string, { c?: string[] }>
	}
	if (Array.isArray(data?.error) && data.error.length > 0) {
		throw new Error(`Kraken API error: ${data.error.join(', ')}`)
	}
	const resultMap = data?.result || {}
	for (const ticker of Object.values(resultMap)) {
		const solUsd = Number(ticker?.c?.[0])
		if (isValidUsd(solUsd)) return solUsd
	}
	return null
}

export async function getSolSuiPrice(env: Env): Promise<SolSuiPriceResult> {
	const key = cacheKey('sol-sui-price', 'v1')
	const cached = await getCached<SolSuiPriceResult>(key)
	if (cached && Date.now() - cached.timestamp < MAX_STALENESS_MS) {
		return cached
	}

	let deepbookSuiUsd: number | null = null
	let solUsdFromAlt: number | null = null
	let solAltSource: 'jupiter' | 'coinbase' | 'binance' | 'kraken' | null = null
	let coingeckoPair: { solUsd: number; suiUsd: number } | null = null
	const failures: string[] = []

	try {
		const usdcPrice = await getUSDCSuiPrice(env)
		if (isValidUsd(usdcPrice.usdcPerSui)) {
			deepbookSuiUsd = usdcPrice.usdcPerSui
		}
	} catch (error) {
		failures.push(error instanceof Error ? error.message : 'DeepBook SUI price unavailable')
	}

	try {
		solUsdFromAlt = await fetchSolUsdFromJupiter()
		if (solUsdFromAlt) solAltSource = 'jupiter'
	} catch (error) {
		failures.push(error instanceof Error ? error.message : 'Jupiter SOL price unavailable')
	}

	if (!solUsdFromAlt) {
		try {
			solUsdFromAlt = await fetchSolUsdFromCoinbase()
			if (solUsdFromAlt) solAltSource = 'coinbase'
		} catch (error) {
			failures.push(error instanceof Error ? error.message : 'Coinbase SOL price unavailable')
		}
	}

	if (!solUsdFromAlt) {
		try {
			solUsdFromAlt = await fetchSolUsdFromBinance()
			if (solUsdFromAlt) solAltSource = 'binance'
		} catch (error) {
			failures.push(error instanceof Error ? error.message : 'Binance SOL price unavailable')
		}
	}

	if (!solUsdFromAlt) {
		try {
			solUsdFromAlt = await fetchSolUsdFromKraken()
			if (solUsdFromAlt) solAltSource = 'kraken'
		} catch (error) {
			failures.push(error instanceof Error ? error.message : 'Kraken SOL price unavailable')
		}
	}

	try {
		coingeckoPair = await fetchCoinGeckoUsdPrices(env)
	} catch (error) {
		failures.push(error instanceof Error ? error.message : 'CoinGecko price unavailable')
	}

	let result: SolSuiPriceResult | null = null
	if (deepbookSuiUsd && solUsdFromAlt) {
		result = buildResult(
			solUsdFromAlt,
			deepbookSuiUsd,
			solAltSource === 'jupiter' ? 'deepbook+jupiter' : 'deepbook+external',
		)
	} else if (deepbookSuiUsd && coingeckoPair?.solUsd) {
		result = buildResult(coingeckoPair.solUsd, deepbookSuiUsd, 'deepbook+coingecko')
	} else if (coingeckoPair) {
		result = buildResult(coingeckoPair.solUsd, coingeckoPair.suiUsd, 'coingecko')
	}

	if (!result) {
		if (cached) return cached
		throw new Error(
			failures.length > 0
				? failures[failures.length - 1]
				: 'Unable to fetch SOL/SUI price from available sources',
		)
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
