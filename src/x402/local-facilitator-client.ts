import type { FacilitatorClient } from '@x402/core/server'
import type {
	PaymentPayload,
	PaymentRequirements,
	SchemeNetworkFacilitator,
	SettleResponse,
	SupportedResponse,
	VerifyResponse,
} from '@x402/core/types'

export class LocalFacilitatorClient implements FacilitatorClient {
	readonly #facilitators: Map<string, SchemeNetworkFacilitator> = new Map()
	readonly #networks: string[]

	constructor(facilitators: Array<{ network: string; facilitator: SchemeNetworkFacilitator }>) {
		this.#networks = []
		for (const { network, facilitator } of facilitators) {
			this.#facilitators.set(`${facilitator.scheme}:${network}`, facilitator)
			if (!this.#networks.includes(network)) {
				this.#networks.push(network)
			}
		}
	}

	async verify(
		paymentPayload: PaymentPayload,
		paymentRequirements: PaymentRequirements,
	): Promise<VerifyResponse> {
		const key = `${paymentRequirements.scheme}:${paymentRequirements.network}`
		const facilitator = this.#facilitators.get(key)
		if (!facilitator) {
			return {
				isValid: false,
				invalidReason: 'unsupported_scheme',
				invalidMessage: `No facilitator for ${key}`,
			}
		}
		return facilitator.verify(paymentPayload, paymentRequirements)
	}

	async settle(
		paymentPayload: PaymentPayload,
		paymentRequirements: PaymentRequirements,
	): Promise<SettleResponse> {
		const key = `${paymentRequirements.scheme}:${paymentRequirements.network}`
		const facilitator = this.#facilitators.get(key)
		if (!facilitator) {
			return {
				success: false,
				errorReason: 'unsupported_scheme',
				errorMessage: `No facilitator for ${key}`,
				transaction: '',
				network: paymentRequirements.network,
			}
		}
		return facilitator.settle(paymentPayload, paymentRequirements)
	}

	async getSupported(): Promise<SupportedResponse> {
		const kinds: SupportedResponse['kinds'] = []
		const signers: Record<string, string[]> = {}

		for (const [key, facilitator] of this.#facilitators) {
			const [scheme, ...networkParts] = key.split(':')
			const network = networkParts.join(':') as `${string}:${string}`
			const extra = facilitator.getExtra(network)
			kinds.push({ x402Version: 2, scheme, network, extra })

			const family = facilitator.caipFamily
			if (!signers[family]) {
				signers[family] = []
			}
			for (const addr of facilitator.getSigners(network)) {
				if (!signers[family].includes(addr)) {
					signers[family].push(addr)
				}
			}
		}

		return { kinds, extensions: [], signers }
	}
}
