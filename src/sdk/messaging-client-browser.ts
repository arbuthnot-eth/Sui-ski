/**
 * Browser adapter for MessagingClient
 *
 * Provides a browser-friendly wrapper that integrates with Sui wallets
 * and DOM APIs while using the framework-agnostic MessagingClient under the hood.
 */

import {
	createDefaultSuiNSResolver,
	DEFAULT_SEAL_TESTNET_CONFIG,
	MessagingClient,
	type WalletSigner,
} from './messaging-client'

/**
 * Browser wallet signer adapter
 */
export function createBrowserWalletSigner(
	wallet: unknown,
	account: unknown,
	getAddress: () => string | null,
	getPrimaryName: () => string | null,
): WalletSigner {
	return {
		async getAddress(): Promise<string> {
			const addr = getAddress()
			if (!addr) throw new Error('Wallet not connected')
			return addr
		},
		async signPersonalMessage(
			message: Uint8Array,
		): Promise<{ signature: string; bytes?: Uint8Array }> {
			// @ts-expect-error - wallet types vary
			if (wallet?.features?.['sui:signPersonalMessage']) {
				// @ts-expect-error
				const signFeature = wallet.features['sui:signPersonalMessage']
				const signResult = await signFeature.signPersonalMessage({
					message,
					account,
				})
				return {
					signature: signResult.signature,
					bytes: signResult.bytes,
				}
			}
			// @ts-expect-error
			if (wallet?.signPersonalMessage) {
				// @ts-expect-error
				const signResult = await wallet.signPersonalMessage({ message })
				return { signature: signResult.signature }
			}
			// @ts-expect-error
			if (wallet?.signMessage) {
				// @ts-expect-error
				const signResult = await wallet.signMessage({ message })
				return { signature: signResult.signature }
			}
			throw new Error('Wallet does not support message signing')
		},
		async getPrimaryName(): Promise<string | null> {
			return getPrimaryName()
		},
	}
}

/**
 * Create a browser-compatible messaging client
 */
export function createBrowserMessagingClient(
	wallet: unknown,
	account: unknown,
	getAddress: () => string | null,
	getPrimaryName: () => string | null,
	suiRpcUrl: string,
	network: 'mainnet' | 'testnet' = 'testnet',
	sealRpcUrl?: string,
	apiEndpoint?: string,
): MessagingClient | null {
	const addr = getAddress()
	if (!addr || !wallet) return null

	const signer = createBrowserWalletSigner(wallet, account, getAddress, getPrimaryName)
	const suinsResolver = createDefaultSuiNSResolver(suiRpcUrl, network)

	return new MessagingClient({
		signer,
		suinsResolver,
		sealConfig: {
			...DEFAULT_SEAL_TESTNET_CONFIG,
			rpcUrl: sealRpcUrl || DEFAULT_SEAL_TESTNET_CONFIG.rpcUrl,
		},
		apiEndpoint: apiEndpoint || '/api/app/messages/send',
		suiRpcUrl,
		network,
	})
}
