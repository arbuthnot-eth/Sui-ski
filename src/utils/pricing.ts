import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import type { Env } from '../types'
import { calculatePremium, fetchSuiPrice } from './bounty-transactions'
import { cacheKey, getCached, setCache } from './cache'
import { getNSSuiPrice } from './ns-price'

const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000
const PRICING_CACHE_TTL = 60

export interface PricingResult {
	basePriceMist: bigint
	premiumMist: bigint
	totalSuiMist: bigint
	totalNsMist: bigint
	nsDiscount: bigint
	isGracePeriod: boolean
	expirationMs?: number
	gracePeriodEndMs?: number
	nsPerSui: number
	breakdown: {
		basePriceUsd: number
		premiumUsd: number
		totalSuiUsd: number
		totalNsUsd: number
		discountPercent: number
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

	const key = cacheKey('reg-price', cleanDomain, String(years), String(expirationMs || 0))
	const cached = await getCached<PricingResult>(env, key)
	if (cached) {
		return cached
	}

	const client = new SuiClient({ url: env.SUI_RPC_URL })
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const suinsClient = new SuinsClient({ client: client as never, network })

	const [basePriceNumber, suiPriceUsd, nsPriceResult] = await Promise.all([
		suinsClient.calculatePrice({ name: cleanDomain, years }),
		fetchSuiPrice(),
		getNSSuiPrice(env),
	])

	const basePriceMist = BigInt(basePriceNumber)

	let premiumMist = 0n
	let premiumNsMist = 0n
	let isGracePeriod = false
	let gracePeriodEndMs: number | undefined

	if (expirationMs) {
		const now = Date.now()
		gracePeriodEndMs = expirationMs + GRACE_PERIOD_MS

		if (now < gracePeriodEndMs) {
			isGracePeriod = true

			const premiumResult = calculatePremium(expirationMs, now, suiPriceUsd)

			premiumMist = BigInt(Math.round(premiumResult.suiPremium * 1e9))
			premiumNsMist = BigInt(Math.round(premiumResult.nsPremium * 1e9))
		}
	}

	const totalSuiMist = basePriceMist + premiumMist
	const totalNsEquivalentSui = basePriceMist + premiumNsMist

	const totalNsMist = BigInt(Math.ceil(Number(totalNsEquivalentSui) * nsPriceResult.nsPerSui))

	const nsDiscountSui = totalSuiMist - totalNsEquivalentSui
	const discountPercent =
		totalSuiMist > 0n ? Number((nsDiscountSui * 10000n) / totalSuiMist) / 100 : 0

	const basePriceUsd = (Number(basePriceMist) / 1e9) * suiPriceUsd
	const premiumUsd = (Number(premiumMist) / 1e9) * suiPriceUsd
	const totalSuiUsd = (Number(totalSuiMist) / 1e9) * suiPriceUsd
	const totalNsUsd = (Number(totalNsEquivalentSui) / 1e9) * suiPriceUsd

	const result: PricingResult = {
		basePriceMist,
		premiumMist,
		totalSuiMist,
		totalNsMist,
		nsDiscount: nsDiscountSui,
		isGracePeriod,
		expirationMs,
		gracePeriodEndMs,
		nsPerSui: nsPriceResult.nsPerSui,
		breakdown: {
			basePriceUsd,
			premiumUsd,
			totalSuiUsd,
			totalNsUsd,
			discountPercent,
		},
	}

	await setCache(env, key, serializablePricingResult(result), PRICING_CACHE_TTL)

	return result
}

function serializablePricingResult(result: PricingResult): Record<string, unknown> {
	return {
		...result,
		basePriceMist: String(result.basePriceMist),
		premiumMist: String(result.premiumMist),
		totalSuiMist: String(result.totalSuiMist),
		totalNsMist: String(result.totalNsMist),
		nsDiscount: String(result.nsDiscount),
	}
}

export function formatPricingResponse(result: PricingResult): Record<string, unknown> {
	return {
		basePriceMist: String(result.basePriceMist),
		premiumMist: String(result.premiumMist),
		totalSuiMist: String(result.totalSuiMist),
		totalNsMist: String(result.totalNsMist),
		nsPerSui: result.nsPerSui,
		isGracePeriod: result.isGracePeriod,
		expirationMs: result.expirationMs,
		gracePeriodEndMs: result.gracePeriodEndMs,
		breakdown: result.breakdown,
	}
}

export async function getBasePricing(env: Env): Promise<Record<string, number>> {
	const client = new SuiClient({ url: env.SUI_RPC_URL })
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const suinsClient = new SuinsClient({ client: client as never, network })

	const priceList = await suinsClient.getPriceList()

	const pricing: Record<string, number> = {}

	for (const [key, value] of priceList.entries()) {
		const [minLen, maxLen] = key
		if (minLen === maxLen) {
			pricing[String(minLen)] = value
		} else {
			pricing[`${minLen}-${maxLen}`] = value
		}
	}

	return pricing
}
