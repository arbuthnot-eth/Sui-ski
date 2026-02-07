import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import type {
	Env,
	X402PaymentRequired,
	X402SettlementResponse,
	X402SuiPaymentPayload,
} from '../types'
import { getDefaultRpcUrl } from './rpc'

const SUI_ASSET = '0x2::sui::SUI'
const SCHEME = 'exact-sui' as const
const X402_VERSION = 2
const DEFAULT_TIMEOUT_SECONDS = 120
const SUBNAME_FEE_MIST = '1000000000'
const X402_SUINS_NAME = 'x402.sui'

export async function resolveX402Recipient(env: Env): Promise<string | null> {
	try {
		const { SuinsClient } = await import('@mysten/suins')
		const suiClient = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})
		const nameRecord = await suinsClient.getNameRecord(X402_SUINS_NAME)
		return nameRecord?.targetAddress || null
	} catch {
		return null
	}
}

export class X402SuiPaymentHandler {
	readonly #recipientAddress: string
	readonly #networkId: string
	readonly #rpcUrl: string
	readonly #suiNetwork: Env['SUI_NETWORK']

	constructor(recipientAddress: string, env: Env) {
		this.#recipientAddress = recipientAddress
		this.#suiNetwork = env.SUI_NETWORK
		this.#networkId = `sui:${env.SUI_NETWORK}`
		this.#rpcUrl = env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK)
	}

	createPaymentRequirements(resourceUrl: string, description: string): X402PaymentRequired {
		return {
			x402Version: X402_VERSION,
			resource: {
				url: resourceUrl,
				description,
				mimeType: 'application/json',
			},
			accepts: [
				{
					scheme: SCHEME,
					network: this.#networkId,
					amount: SUBNAME_FEE_MIST,
					asset: SUI_ASSET,
					payTo: this.#recipientAddress,
					maxTimeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
					extra: { verificationMethod: 'pre-executed' },
				},
			],
		}
	}

	extractPayment(header: string): X402SuiPaymentPayload | null {
		try {
			const decoded = atob(header)
			const parsed = JSON.parse(decoded) as X402SuiPaymentPayload
			if (parsed.x402Version !== X402_VERSION) return null
			if (parsed.accepted?.scheme !== SCHEME) return null
			if (!parsed.payload?.digest) return null
			return parsed
		} catch {
			return null
		}
	}

	async verifyPayment(
		payload: X402SuiPaymentPayload,
	): Promise<{ valid: boolean; error?: string; payer?: string }> {
		try {
			const suiClient = new SuiClient({
				url: this.#rpcUrl,
				network: this.#suiNetwork,
			})

			const txResponse = await suiClient.getTransactionBlock({
				digest: payload.payload.digest,
				options: { showEffects: true, showBalanceChanges: true },
			})

			if (!txResponse) return { valid: false, error: 'Transaction not found' }

			const effects = txResponse.effects
			if (effects?.status?.status !== 'success') {
				return { valid: false, error: 'Transaction failed on chain' }
			}

			const balanceChanges = txResponse.balanceChanges || []
			const recipientChange = balanceChanges.find(
				(change) =>
					'AddressOwner' in (change.owner as Record<string, unknown>) &&
					(change.owner as { AddressOwner: string }).AddressOwner === this.#recipientAddress &&
					change.coinType === SUI_ASSET,
			)

			if (!recipientChange) {
				return { valid: false, error: 'Payment not found to expected recipient' }
			}

			const expectedAmount = BigInt(payload.accepted.amount)
			if (BigInt(recipientChange.amount) < expectedAmount) {
				return {
					valid: false,
					error: `Insufficient payment: expected ${expectedAmount}, got ${recipientChange.amount}`,
				}
			}

			const senderChange = balanceChanges.find(
				(change) =>
					'AddressOwner' in (change.owner as Record<string, unknown>) &&
					change.coinType === SUI_ASSET &&
					BigInt(change.amount) < 0n,
			)

			const payer = senderChange
				? (senderChange.owner as { AddressOwner: string }).AddressOwner
				: undefined

			return { valid: true, payer }
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown verification error'
			return { valid: false, error: `Verification failed: ${message}` }
		}
	}

	createSettlementResponse(digest: string, payer: string): X402SettlementResponse {
		return {
			success: true,
			transaction: digest,
			network: this.#networkId,
			payer,
		}
	}
}
