import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import type {
	PaymentPayloadResult,
	PaymentRequirements,
	SchemeNetworkClient,
} from '@x402/core/types'
import type { SuiSigner } from './sui-signer'

const SUI_TYPE = '0x2::sui::SUI'
const X402_VERSION = 2

export class ExactSuiClientScheme implements SchemeNetworkClient {
	readonly scheme = 'exact'

	readonly #signer: SuiSigner
	readonly #rpcUrl: string

	constructor(signer: SuiSigner, rpcUrl: string) {
		this.#signer = signer
		this.#rpcUrl = rpcUrl
	}

	async createPaymentPayload(
		x402Version: number,
		requirements: PaymentRequirements,
	): Promise<PaymentPayloadResult> {
		const { amount, payTo, asset, network } = requirements
		const suiNetwork = network.split(':')[1] as 'mainnet' | 'testnet' | 'devnet'

		if (asset !== SUI_TYPE) {
			throw new Error(`Unsupported asset: ${asset}, expected ${SUI_TYPE}`)
		}

		const tx = new Transaction()
		const [coin] = tx.splitCoins(tx.gas, [BigInt(amount)])
		tx.transferObjects([coin], payTo)
		tx.setSender(this.#signer.address)

		const client = new SuiJsonRpcClient({ url: this.#rpcUrl, network: suiNetwork })
		const txBytes = await tx.build({ client: client as never })
		const signature = await this.#signer.signTransaction(txBytes)
		const transactionBase64 = btoa(String.fromCharCode(...txBytes))

		return {
			x402Version: x402Version || X402_VERSION,
			payload: {
				signature,
				transaction: transactionBase64,
			},
		}
	}
}
