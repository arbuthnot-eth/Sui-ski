import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { mainPackage, SuinsClient } from '@mysten/suins'
import type { Env } from '../types'
import { cacheKey, getCached, setCache } from './cache'
import { getNSSuiPrice, getUSDCSuiPrice, NS_SCALE } from './ns-price'
import { calculatePremium } from './premium'
import { getPythPriceInfoObjectId } from './pyth-price-info'
import { getDefaultRpcUrl } from './rpc'

const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000
const PRICING_CACHE_TTL = 300
const NS_DISCOUNT_PERCENT = 25
const SWAP_SLIPPAGE_BPS = 100

export interface PricingResult {
	directSuiMist: bigint
	discountedSuiMist: bigint
	nsNeededMist: bigint
	savingsMist: bigint
	savingsPercent: number
	nsPerSui: number
	suiPerNs: number
	isGracePeriod: boolean
	priceInfoObjectId?: string
	expirationMs?: number
	gracePeriodEndMs?: number
	breakdown: {
		basePriceUsd: number
		discountedPriceUsd: number
		premiumUsd: number
		suiPriceUsd: number
		nsDiscountPercent: number
		swapSlippageBps: number
	}
}

export interface CalculatePriceParams {
	domain: string
	years: number
	expirationMs?: number
	env: Env
}

export async function calculateRegistrationPrice(
	params: CalculatePriceParams,
): Promise<PricingResult> {
	const { domain, years, expirationMs, env } = params
	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`

	const key = cacheKey('reg-price-v3', cleanDomain, String(years), String(expirationMs || 0))
	const cached = await getCached<Record<string, unknown>>(key)
	if (cached) {
		return deserializePricingResult(cached)
	}

	const client = new SuiClient({
		url: env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK),
		network: env.SUI_NETWORK,
	})
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const suinsClient = new SuinsClient({ client: client as never, network })

	const nsFeedId =
		network === 'mainnet' ? mainPackage.mainnet.coins.NS.feed : mainPackage.testnet.coins.NS.feed
	const [basePriceUnits, usdcResult, nsPriceResult, priceInfoObjectId] = await Promise.all([
		suinsClient.calculatePrice({ name: cleanDomain, years }),
		getUSDCSuiPrice(env),
		getNSSuiPrice(env),
		nsFeedId
			? getPythPriceInfoObjectId(client, network, nsFeedId).catch(() => undefined)
			: Promise.resolve(undefined),
	])
	const suiPriceUsd = usdcResult.usdcPerSui

	const basePriceUsd = Number(basePriceUnits) / 1e6

	let premiumUsd = 0
	let isGracePeriod = false
	let gracePeriodEndMs: number | undefined

	if (expirationMs) {
		const now = Date.now()
		gracePeriodEndMs = expirationMs + GRACE_PERIOD_MS

		if (now < gracePeriodEndMs) {
			isGracePeriod = true
			const premiumResult = calculatePremium(expirationMs, now, suiPriceUsd)
			premiumUsd = premiumResult.suiPremium * suiPriceUsd
		}
	}

	const totalPriceUsd = basePriceUsd + premiumUsd
	const discountedPriceUsd = totalPriceUsd * (1 - NS_DISCOUNT_PERCENT / 100)

	const directSuiAmount = totalPriceUsd / suiPriceUsd
	const directSuiMist = BigInt(Math.ceil(directSuiAmount * 1e9))

	const discountedSuiAmount = discountedPriceUsd / suiPriceUsd
	const nsNeeded = discountedSuiAmount * nsPriceResult.nsPerSui
	const nsNeededMist = BigInt(Math.ceil(nsNeeded * NS_SCALE))

	const suiForSwap = nsNeeded * nsPriceResult.suiPerNs
	const suiWithSlippage = suiForSwap * (1 + SWAP_SLIPPAGE_BPS / 10000)
	const discountedSuiMist = BigInt(Math.ceil(suiWithSlippage * 1e9))

	const savingsMist = directSuiMist - discountedSuiMist
	const savingsPercent = Number((savingsMist * 10000n) / directSuiMist) / 100

	const result: PricingResult = {
		directSuiMist,
		discountedSuiMist,
		nsNeededMist,
		savingsMist,
		savingsPercent,
		nsPerSui: nsPriceResult.nsPerSui,
		suiPerNs: nsPriceResult.suiPerNs,
		isGracePeriod,
		priceInfoObjectId,
		expirationMs,
		gracePeriodEndMs,
		breakdown: {
			basePriceUsd,
			discountedPriceUsd,
			premiumUsd,
			suiPriceUsd,
			nsDiscountPercent: NS_DISCOUNT_PERCENT,
			swapSlippageBps: SWAP_SLIPPAGE_BPS,
		},
	}

	await setCache(key, serializablePricingResult(result), PRICING_CACHE_TTL)

	return result
}

function serializablePricingResult(result: PricingResult): Record<string, unknown> {
	return {
		...result,
		directSuiMist: String(result.directSuiMist),
		discountedSuiMist: String(result.discountedSuiMist),
		nsNeededMist: String(result.nsNeededMist),
		savingsMist: String(result.savingsMist),
		priceInfoObjectId: result.priceInfoObjectId,
	}
}

function deserializePricingResult(cached: Record<string, unknown>): PricingResult {
	return {
		...cached,
		directSuiMist: BigInt(cached.directSuiMist as string),
		discountedSuiMist: BigInt(cached.discountedSuiMist as string),
		nsNeededMist: BigInt(cached.nsNeededMist as string),
		savingsMist: BigInt(cached.savingsMist as string),
	} as PricingResult
}

export function formatPricingResponse(result: PricingResult): Record<string, unknown> {
	return {
		directSuiMist: String(result.directSuiMist),
		discountedSuiMist: String(result.discountedSuiMist),
		nsNeededMist: String(result.nsNeededMist),
		savingsMist: String(result.savingsMist),
		savingsPercent: result.savingsPercent,
		nsPerSui: result.nsPerSui,
		suiPerNs: result.suiPerNs,
		isGracePeriod: result.isGracePeriod,
		priceInfoObjectId: result.priceInfoObjectId,
		expirationMs: result.expirationMs,
		gracePeriodEndMs: result.gracePeriodEndMs,
		breakdown: result.breakdown,
	}
}

export async function calculateRenewalPrice(params: CalculatePriceParams): Promise<PricingResult> {
	const { domain, years, env } = params
	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`

	const key = cacheKey('renew-price-v1', cleanDomain, String(years))
	const cached = await getCached<Record<string, unknown>>(key)
	if (cached) {
		return deserializePricingResult(cached)
	}

	const client = new SuiClient({
		url: env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK),
		network: env.SUI_NETWORK,
	})
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const suinsClient = new SuinsClient({ client: client as never, network })

	const nsFeedId =
		network === 'mainnet' ? mainPackage.mainnet.coins.NS.feed : mainPackage.testnet.coins.NS.feed
	const [basePriceUnits, usdcResult, nsPriceResult, priceInfoObjectId] = await Promise.all([
		suinsClient.calculatePrice({ name: cleanDomain, years, isRegistration: false }),
		getUSDCSuiPrice(env),
		getNSSuiPrice(env),
		nsFeedId
			? getPythPriceInfoObjectId(client, network, nsFeedId).catch(() => undefined)
			: Promise.resolve(undefined),
	])
	const suiPriceUsd = usdcResult.usdcPerSui

	const basePriceUsd = Number(basePriceUnits) / 1e6
	const discountedPriceUsd = basePriceUsd * (1 - NS_DISCOUNT_PERCENT / 100)

	const directSuiAmount = basePriceUsd / suiPriceUsd
	const directSuiMist = BigInt(Math.ceil(directSuiAmount * 1e9))

	const discountedSuiAmount = discountedPriceUsd / suiPriceUsd
	const nsNeeded = discountedSuiAmount * nsPriceResult.nsPerSui
	const nsNeededMist = BigInt(Math.ceil(nsNeeded * NS_SCALE))

	const suiForSwap = nsNeeded * nsPriceResult.suiPerNs
	const suiWithSlippage = suiForSwap * (1 + SWAP_SLIPPAGE_BPS / 10000)
	const discountedSuiMist = BigInt(Math.ceil(suiWithSlippage * 1e9))

	const savingsMist = directSuiMist - discountedSuiMist
	const savingsPercent = Number((savingsMist * 10000n) / directSuiMist) / 100

	const result: PricingResult = {
		directSuiMist,
		discountedSuiMist,
		nsNeededMist,
		savingsMist,
		savingsPercent,
		nsPerSui: nsPriceResult.nsPerSui,
		suiPerNs: nsPriceResult.suiPerNs,
		isGracePeriod: false,
		priceInfoObjectId,
		breakdown: {
			basePriceUsd,
			discountedPriceUsd,
			premiumUsd: 0,
			suiPriceUsd,
			nsDiscountPercent: NS_DISCOUNT_PERCENT,
			swapSlippageBps: SWAP_SLIPPAGE_BPS,
		},
	}

	await setCache(key, serializablePricingResult(result), PRICING_CACHE_TTL)

	return result
}

export async function getBasePricing(env: Env): Promise<Record<string, unknown>> {
	const client = new SuiClient({
		url: env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK),
		network: env.SUI_NETWORK,
	})
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const suinsClient = new SuinsClient({ client: client as never, network })

	const [priceList, usdcResult, nsPriceResult] = await Promise.all([
		suinsClient.getPriceList(),
		getUSDCSuiPrice(env),
		getNSSuiPrice(env),
	])
	const suiPriceUsd = usdcResult.usdcPerSui

	const pricing: Record<string, unknown> = {
		suiPriceUsd,
		nsPerSui: nsPriceResult.nsPerSui,
		suiPerNs: nsPriceResult.suiPerNs,
		nsDiscountPercent: NS_DISCOUNT_PERCENT,
		swapSlippageBps: SWAP_SLIPPAGE_BPS,
		tiers: {} as Record<string, unknown>,
	}

	const tiers = pricing.tiers as Record<string, unknown>

	for (const [key, value] of priceList.entries()) {
		const [minLen, maxLen] = key
		const keyStr = minLen === maxLen ? String(minLen) : `${minLen}-${maxLen}`
		const usdAmount = value / 1e6
		const discountedUsd = usdAmount * (1 - NS_DISCOUNT_PERCENT / 100)

		const directSui = usdAmount / suiPriceUsd
		const nsNeeded = (discountedUsd / suiPriceUsd) * nsPriceResult.nsPerSui
		const suiForSwap = nsNeeded * nsPriceResult.suiPerNs * (1 + SWAP_SLIPPAGE_BPS / 10000)

		tiers[keyStr] = {
			usd: usdAmount,
			discountedUsd,
			directSuiMist: Math.ceil(directSui * 1e9),
			discountedSuiMist: Math.ceil(suiForSwap * 1e9),
			savingsPercent: Math.round((1 - suiForSwap / directSui) * 10000) / 100,
		}
	}

	return pricing
}
