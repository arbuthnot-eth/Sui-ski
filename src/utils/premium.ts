const USD_TARGET_VALUE = 10_000_000
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

export function calculatePremium(
	expirationMs: number,
	targetTimestamp: number,
	suiPriceUsd: number,
): { suiPremium: number } {
	const maxSuiSupply = USD_TARGET_VALUE / suiPriceUsd
	const decayConstant = Math.log(maxSuiSupply)

	const gracePeriodEnd = expirationMs + GRACE_PERIOD_MS
	const totalWindow = gracePeriodEnd - expirationMs
	const elapsed = Math.max(0, targetTimestamp - expirationMs)
	const progress = Math.max(0, Math.min(1, elapsed / totalWindow))

	const suiPremium = Math.max(0, Math.round(maxSuiSupply * Math.exp(-decayConstant * progress)))

	return { suiPremium }
}
