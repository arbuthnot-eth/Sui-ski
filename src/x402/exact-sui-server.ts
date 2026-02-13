import type {
	AssetAmount,
	Network,
	PaymentRequirements,
	Price,
	SchemeNetworkServer,
} from '@x402/core/types'

const SUI_TYPE = '0x2::sui::SUI'
const SUI_DECIMALS = 9
const MIST_PER_SUI = 10 ** SUI_DECIMALS

export class ExactSuiServerScheme implements SchemeNetworkServer {
	readonly scheme = 'exact'

	async parsePrice(price: Price, _network: Network): Promise<AssetAmount> {
		if (typeof price === 'object' && 'asset' in price && 'amount' in price) {
			return { asset: price.asset, amount: price.amount, extra: price.extra }
		}

		const numericPrice = typeof price === 'string' ? Number.parseFloat(price) : Number(price)
		if (!Number.isFinite(numericPrice) || numericPrice < 0) {
			throw new Error(`Invalid SUI price: ${String(price)}`)
		}

		const mist = Math.ceil(numericPrice * MIST_PER_SUI)
		return { asset: SUI_TYPE, amount: String(mist) }
	}

	async enhancePaymentRequirements(
		paymentRequirements: PaymentRequirements,
		_supportedKind: {
			x402Version: number
			scheme: string
			network: Network
			extra?: Record<string, unknown>
		},
		_facilitatorExtensions: string[],
	): Promise<PaymentRequirements> {
		return {
			...paymentRequirements,
			extra: {
				...paymentRequirements.extra,
				verificationMethod: 'simulation',
			},
		}
	}
}
