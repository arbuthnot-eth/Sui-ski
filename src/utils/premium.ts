const USD_TARGET_VALUE = 10_000_000
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000
const NS_DISCOUNT_DAYS = 3

export function calculatePremium(
	expirationMs: number,
	targetTimestamp: number,
	suiPriceUsd: number,
): { suiPremium: number; nsPremium: number; suiUsdValue: number; nsUsdValue: number } {
	const maxSuiSupply = USD_TARGET_VALUE / suiPriceUsd
	const decayConstant = Math.log(maxSuiSupply)

	const gracePeriodEnd = expirationMs + GRACE_PERIOD_MS
	const totalWindow = gracePeriodEnd - expirationMs
	const elapsed = Math.max(0, targetTimestamp - expirationMs)
	const progress = Math.max(0, Math.min(1, elapsed / totalWindow))

	const suiPremium = Math.max(0, Math.round(maxSuiSupply * Math.exp(-decayConstant * progress)))

	const nsProgress = Math.min(1, progress + NS_DISCOUNT_DAYS / 30)
	const nsPremium = Math.max(0, Math.round(maxSuiSupply * Math.exp(-decayConstant * nsProgress)))

	return {
		suiPremium,
		nsPremium,
		suiUsdValue: suiPremium * suiPriceUsd,
		nsUsdValue: nsPremium * suiPriceUsd,
	}
}
