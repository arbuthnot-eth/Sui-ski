import type { Env } from '../types'
import { cacheKey, getCached, setCache } from './cache'

export interface NSPriceResult {
	nsPerSui: number
	suiPerNs: number
	source: 'deepbook' | 'fallback'
	poolAddress: string | null
	timestamp: number
	bestBid?: number
	bestAsk?: number
	asks?: [string, string][]
	bids?: [string, string][]
}

export interface SwapQuoteResult {
	inputSui: bigint
	outputNs: bigint
	effectivePrice: number
	priceImpactBps: number
	levelsConsumed: number
}

export const NS_TOKEN = {
	mainnet: '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178',
	testnet: null,
} as const

export const SUI_TYPE =
	'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'
export const NS_TYPE_MAINNET =
	'0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS'

export const DEEPBOOK_NS_SUI_POOL = {
	mainnet: '0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8',
	testnet: null,
} as const

export const DEEPBOOK_PACKAGE = {
	mainnet: '0x337f4f4f6567fcd778d5454f27c16c70e2f274cc6377ea6249ddf491482ef497',
	testnet: null,
} as const

export const DEEP_TYPE =
	'0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP'

export const DEEPBOOK_DEEP_SUI_POOL = {
	mainnet: '0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22',
	testnet: null,
} as const

export const USDC_TYPE =
	'0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'

export const DEEPBOOK_SUI_USDC_POOL = {
	mainnet: '0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407',
	testnet: null,
} as const

const DEEPBOOK_INDEXER = {
	mainnet: 'https://deepbook-indexer.mainnet.mystenlabs.com',
	testnet: 'https://deepbook-indexer.testnet.mystenlabs.com',
} as const

const NS_PRICE_CACHE_TTL = 120
const FALLBACK_NS_PER_SUI = 50
const DEFAULT_SLIPPAGE_BPS = 500
const ORDERBOOK_DEPTH = 20
const NS_DECIMALS = 6
const NS_SCALE = 10 ** NS_DECIMALS

let nsPriceMemCache: { data: NSPriceResult; exp: number } | null = null

interface OrderbookResponse {
	timestamp: string
	bids: [string, string][]
	asks: [string, string][]
}

export async function getNSSuiPrice(env: Env, skipCache = false): Promise<NSPriceResult> {
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const poolAddress = DEEPBOOK_NS_SUI_POOL[network]
	const indexerUrl = DEEPBOOK_INDEXER[network]

	if (!skipCache && nsPriceMemCache && nsPriceMemCache.exp > Date.now()) {
		return nsPriceMemCache.data
	}

	const key = cacheKey('ns-sui-price-v4', network)
	if (!skipCache) {
		const cached = await getCached<NSPriceResult>(env, key)
		if (cached) {
			nsPriceMemCache = { data: cached, exp: Date.now() + NS_PRICE_CACHE_TTL * 1000 }
			return cached
		}
	}

	if (!poolAddress || !indexerUrl) {
		return createFallbackResult()
	}

	try {
		const response = await fetch(`${indexerUrl}/orderbook/NS_SUI?depth=${ORDERBOOK_DEPTH}`)
		if (!response.ok) {
			console.error('DeepBook indexer returned:', response.status)
			return createFallbackResult()
		}

		const orderbook: OrderbookResponse = await response.json()

		if (!orderbook.bids?.length || !orderbook.asks?.length) {
			console.error('Empty orderbook returned')
			return createFallbackResult()
		}

		const bestBid = parseFloat(orderbook.bids[0][0])
		const bestAsk = parseFloat(orderbook.asks[0][0])

		if (!Number.isFinite(bestBid) || !Number.isFinite(bestAsk) || bestBid <= 0 || bestAsk <= 0) {
			console.error('Invalid bid/ask prices:', { bestBid, bestAsk })
			return createFallbackResult()
		}

		const midPrice = (bestBid + bestAsk) / 2
		const nsPerSui = 1 / midPrice
		const suiPerNs = midPrice

		if (!Number.isFinite(nsPerSui) || nsPerSui <= 0) {
			return createFallbackResult()
		}

		const result: NSPriceResult = {
			nsPerSui,
			suiPerNs,
			source: 'deepbook',
			poolAddress,
			timestamp: Date.now(),
			bestBid,
			bestAsk,
			asks: orderbook.asks,
			bids: orderbook.bids,
		}

		nsPriceMemCache = { data: result, exp: Date.now() + NS_PRICE_CACHE_TTL * 1000 }
		await setCache(env, key, result, NS_PRICE_CACHE_TTL)
		return result
	} catch (error) {
		console.error('Failed to fetch NS/SUI price from DeepBook indexer:', error)
		return createFallbackResult()
	}
}

export function simulateBuyNsWithSui(
	suiInputMist: bigint,
	asks: [string, string][],
): SwapQuoteResult {
	if (!asks?.length) {
		return {
			inputSui: suiInputMist,
			outputNs: 0n,
			effectivePrice: 0,
			priceImpactBps: 10000,
			levelsConsumed: 0,
		}
	}

	const suiInput = Number(suiInputMist) / 1e9
	let suiRemaining = suiInput
	let nsAccumulated = 0
	let levelsConsumed = 0

	for (const [priceStr, qtyStr] of asks) {
		if (suiRemaining <= 0) break

		const price = parseFloat(priceStr)
		const qtyAvailable = parseFloat(qtyStr)
		const suiNeededForLevel = qtyAvailable * price
		const suiToUse = Math.min(suiRemaining, suiNeededForLevel)
		const nsFromLevel = suiToUse / price

		nsAccumulated += nsFromLevel
		suiRemaining -= suiToUse
		levelsConsumed++
	}

	const effectivePrice = nsAccumulated > 0 ? (suiInput - suiRemaining) / nsAccumulated : 0
	const bestAskPrice = parseFloat(asks[0][0])
	const priceImpactBps = Math.round(((effectivePrice - bestAskPrice) / bestAskPrice) * 10000)

	return {
		inputSui: BigInt(Math.floor((suiInput - suiRemaining) * 1e9)),
		outputNs: BigInt(Math.floor(nsAccumulated * NS_SCALE)),
		effectivePrice,
		priceImpactBps: Math.max(0, priceImpactBps),
		levelsConsumed,
	}
}

export function calculateSuiNeededForNs(
	nsTargetMist: bigint,
	asks: [string, string][],
	slippageBps: number,
): { suiNeeded: bigint; expectedNs: bigint; worstCaseNs: bigint } {
	if (!asks?.length) {
		const fallbackRate = 1 / FALLBACK_NS_PER_SUI
		const suiBase = (Number(nsTargetMist) / NS_SCALE) * fallbackRate
		const suiWithSlippage = suiBase * (1 + slippageBps / 10000)
		return {
			suiNeeded: BigInt(Math.ceil(suiWithSlippage * 1e9)),
			expectedNs: nsTargetMist,
			worstCaseNs: nsTargetMist - (nsTargetMist * BigInt(slippageBps)) / 10000n,
		}
	}

	const nsTarget = Number(nsTargetMist) / NS_SCALE
	let suiAccumulated = 0
	let nsAccumulated = 0

	for (const [priceStr, qtyStr] of asks) {
		if (nsAccumulated >= nsTarget) break

		const price = parseFloat(priceStr)
		const qtyAvailable = parseFloat(qtyStr)
		const nsNeeded = nsTarget - nsAccumulated
		const nsFromLevel = Math.min(nsNeeded, qtyAvailable)
		const suiForLevel = nsFromLevel * price

		nsAccumulated += nsFromLevel
		suiAccumulated += suiForLevel
	}

	if (nsAccumulated < nsTarget) {
		const remaining = nsTarget - nsAccumulated
		const worstPrice = parseFloat(asks[asks.length - 1][0]) * 1.1
		suiAccumulated += remaining * worstPrice
		nsAccumulated = nsTarget
	}

	const suiWithSlippage = suiAccumulated * (1 + slippageBps / 10000)
	const worstCaseNs = nsTarget * (1 - slippageBps / 10000)

	return {
		suiNeeded: BigInt(Math.ceil(suiWithSlippage * 1e9)),
		expectedNs: BigInt(Math.floor(nsAccumulated * NS_SCALE)),
		worstCaseNs: BigInt(Math.floor(worstCaseNs * NS_SCALE)),
	}
}

function createFallbackResult(): NSPriceResult {
	return {
		nsPerSui: FALLBACK_NS_PER_SUI,
		suiPerNs: 1 / FALLBACK_NS_PER_SUI,
		source: 'fallback',
		poolAddress: null,
		timestamp: Date.now(),
	}
}

export interface USDCPriceResult {
	suiPerUsdc: number
	usdcPerSui: number
	source: 'deepbook' | 'fallback'
	poolAddress: string | null
	timestamp: number
	bestBid?: number
	bestAsk?: number
}

const USDC_PRICE_CACHE_TTL = 120
const FALLBACK_SUI_PER_USDC = 0.25

let usdcPriceMemCache: { data: USDCPriceResult; exp: number } | null = null

export async function getUSDCSuiPrice(env: Env, skipCache = false): Promise<USDCPriceResult> {
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const poolAddress = DEEPBOOK_SUI_USDC_POOL[network]
	const indexerUrl = DEEPBOOK_INDEXER[network]

	if (!skipCache && usdcPriceMemCache && usdcPriceMemCache.exp > Date.now()) {
		return usdcPriceMemCache.data
	}

	const key = cacheKey('usdc-sui-price-v1', network)
	if (!skipCache) {
		const cached = await getCached<USDCPriceResult>(env, key)
		if (cached) {
			usdcPriceMemCache = { data: cached, exp: Date.now() + USDC_PRICE_CACHE_TTL * 1000 }
			return cached
		}
	}

	if (!poolAddress || !indexerUrl) {
		return createUSDCFallbackResult()
	}

	try {
		const response = await fetch(`${indexerUrl}/orderbook/SUI_USDC?depth=${ORDERBOOK_DEPTH}`)
		if (!response.ok) {
			console.error('DeepBook USDC indexer returned:', response.status)
			return createUSDCFallbackResult()
		}

		const orderbook: OrderbookResponse = await response.json()

		if (!orderbook.bids?.length || !orderbook.asks?.length) {
			console.error('Empty USDC orderbook returned')
			return createUSDCFallbackResult()
		}

		const bestBid = parseFloat(orderbook.bids[0][0])
		const bestAsk = parseFloat(orderbook.asks[0][0])

		if (!Number.isFinite(bestBid) || !Number.isFinite(bestAsk) || bestBid <= 0 || bestAsk <= 0) {
			console.error('Invalid USDC bid/ask prices:', { bestBid, bestAsk })
			return createUSDCFallbackResult()
		}

		const midPrice = (bestBid + bestAsk) / 2
		const usdcPerSui = midPrice
		const suiPerUsdc = 1 / midPrice

		if (!Number.isFinite(suiPerUsdc) || suiPerUsdc <= 0) {
			return createUSDCFallbackResult()
		}

		const result: USDCPriceResult = {
			suiPerUsdc,
			usdcPerSui,
			source: 'deepbook',
			poolAddress,
			timestamp: Date.now(),
			bestBid,
			bestAsk,
		}

		usdcPriceMemCache = { data: result, exp: Date.now() + USDC_PRICE_CACHE_TTL * 1000 }
		await setCache(env, key, result, USDC_PRICE_CACHE_TTL)
		return result
	} catch (error) {
		console.error('Failed to fetch USDC/SUI price from DeepBook indexer:', error)
		return createUSDCFallbackResult()
	}
}

function createUSDCFallbackResult(): USDCPriceResult {
	return {
		suiPerUsdc: FALLBACK_SUI_PER_USDC,
		usdcPerSui: 1 / FALLBACK_SUI_PER_USDC,
		source: 'fallback',
		poolAddress: null,
		timestamp: Date.now(),
	}
}

export async function convertSuiToNs(suiAmount: bigint, env: Env): Promise<bigint> {
	const price = await getNSSuiPrice(env)
	return BigInt(Math.ceil(Number(suiAmount) * price.nsPerSui))
}

export async function convertNsToSui(nsAmount: bigint, env: Env): Promise<bigint> {
	const price = await getNSSuiPrice(env)
	return BigInt(Math.ceil(Number(nsAmount) * price.suiPerNs))
}

export { DEFAULT_SLIPPAGE_BPS, NS_DECIMALS, NS_SCALE }
