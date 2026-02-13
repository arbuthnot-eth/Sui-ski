import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import type {
	Network,
	PaymentPayload,
	PaymentRequirements,
	SchemeNetworkFacilitator,
	SettleResponse,
	VerifyResponse,
} from '@x402/core/types'
import type { SuiSigner } from './sui-signer'

const SUI_TYPE = '0x2::sui::SUI'

export class ExactSuiFacilitatorScheme implements SchemeNetworkFacilitator {
	readonly scheme = 'exact'
	readonly caipFamily = 'sui:*'

	readonly #signer: SuiSigner
	readonly #rpcUrl: string

	constructor(signer: SuiSigner, rpcUrl: string, _network: string) {
		this.#signer = signer
		this.#rpcUrl = rpcUrl
	}

	getExtra(_network: Network): Record<string, unknown> | undefined {
		return { facilitator: this.#signer.address }
	}

	getSigners(_network: string): string[] {
		return this.#signer.getAddresses()
	}

	async verify(
		payload: PaymentPayload,
		requirements: PaymentRequirements,
	): Promise<VerifyResponse> {
		const { signature, transaction } = payload.payload as {
			signature?: string
			transaction?: string
		}

		if (!signature || !transaction) {
			return {
				isValid: false,
				invalidReason: 'missing_payload',
				invalidMessage: 'Payment payload must contain signature and transaction fields',
			}
		}

		if (requirements.asset !== SUI_TYPE) {
			return {
				isValid: false,
				invalidReason: 'unsupported_asset',
				invalidMessage: `Unsupported asset: ${requirements.asset}, expected ${SUI_TYPE}`,
			}
		}

		const suiNetwork = requirements.network.split(':')[1] as 'mainnet' | 'testnet' | 'devnet'
		const client = new SuiJsonRpcClient({ url: this.#rpcUrl, network: suiNetwork })

		try {
			const dryRun = await client.dryRunTransactionBlock({ transactionBlock: transaction })

			if (dryRun.effects?.status?.status !== 'success') {
				return {
					isValid: false,
					invalidReason: 'simulation_failed',
					invalidMessage: `Transaction simulation failed: ${dryRun.effects?.status?.error || 'unknown error'}`,
				}
			}

			const balanceChanges = dryRun.balanceChanges || []
			const recipientChange = balanceChanges.find(
				(change) =>
					'AddressOwner' in (change.owner as Record<string, unknown>) &&
					(change.owner as { AddressOwner: string }).AddressOwner === requirements.payTo &&
					change.coinType === SUI_TYPE,
			)

			if (!recipientChange) {
				return {
					isValid: false,
					invalidReason: 'no_transfer',
					invalidMessage: `No transfer found to recipient ${requirements.payTo}`,
				}
			}

			const expectedAmount = BigInt(requirements.amount)
			if (BigInt(recipientChange.amount) < expectedAmount) {
				return {
					isValid: false,
					invalidReason: 'insufficient_amount',
					invalidMessage: `Insufficient payment: expected ${expectedAmount}, got ${recipientChange.amount}`,
				}
			}

			const senderChange = balanceChanges.find(
				(change) =>
					'AddressOwner' in (change.owner as Record<string, unknown>) &&
					change.coinType === SUI_TYPE &&
					BigInt(change.amount) < 0n,
			)
			const payer = senderChange
				? (senderChange.owner as { AddressOwner: string }).AddressOwner
				: undefined

			return { isValid: true, payer }
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown verification error'
			return {
				isValid: false,
				invalidReason: 'verification_error',
				invalidMessage: `Verification failed: ${message}`,
			}
		}
	}

	async settle(
		payload: PaymentPayload,
		requirements: PaymentRequirements,
	): Promise<SettleResponse> {
		const { signature, transaction } = payload.payload as { signature: string; transaction: string }
		const suiNetwork = requirements.network.split(':')[1] as 'mainnet' | 'testnet' | 'devnet'
		const client = new SuiJsonRpcClient({ url: this.#rpcUrl, network: suiNetwork })

		try {
			const result = await client.executeTransactionBlock({
				transactionBlock: transaction,
				signature: [signature],
				options: { showEffects: true, showBalanceChanges: true },
			})

			if (result.effects?.status?.status !== 'success') {
				return {
					success: false,
					errorReason: 'execution_failed',
					errorMessage: `Transaction execution failed: ${result.effects?.status?.error || 'unknown error'}`,
					transaction: result.digest || '',
					network: requirements.network,
				}
			}

			const balanceChanges = result.balanceChanges || []
			const senderChange = balanceChanges.find(
				(change) =>
					'AddressOwner' in (change.owner as Record<string, unknown>) &&
					change.coinType === SUI_TYPE &&
					BigInt(change.amount) < 0n,
			)
			const payer = senderChange
				? (senderChange.owner as { AddressOwner: string }).AddressOwner
				: undefined

			return {
				success: true,
				payer,
				transaction: result.digest,
				network: requirements.network,
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown settlement error'
			return {
				success: false,
				errorReason: 'settlement_error',
				errorMessage: `Settlement failed: ${message}`,
				transaction: '',
				network: requirements.network,
			}
		}
	}
}
