/**
 * IKA dWallet Transaction Builders
 * Utilities for building transactions that interact with IKA dWallets
 * for cross-chain control (Bitcoin, Ethereum, Solana).
 *
 * Note: These builders return serialized transaction data.
 * Actual signing happens client-side using the IKA SDK.
 */

/**
 * Supported foreign chains for IKA dWallets
 */
export type ForeignChain = 'bitcoin' | 'ethereum' | 'solana' | 'aptos' | 'cosmos'

/**
 * dWallet creation parameters
 */
export interface CreateDWalletParams {
	/** Package ID of the IKA dWallet module */
	packageId: string
	/** Chains to enable for this dWallet */
	chains: ForeignChain[]
	/** Optional agency ID to associate with */
	agencyId?: string
	/** Optional metadata */
	metadata?: {
		name?: string
		description?: string
	}
}

/**
 * Cross-chain signing request
 */
export interface SigningRequest {
	/** dWallet object ID */
	dWalletId: string
	/** Target chain */
	chain: ForeignChain
	/** Transaction hash to sign (chain-specific) */
	txHash: string
	/** Whether 2PC-MPC approval is required */
	requires2PC: boolean
	/** Human approvers required (for 2PC-MPC) */
	requiredApprovers?: string[]
}

/**
 * Build transaction to create a new dWallet
 * Returns serializable transaction data for client-side signing
 */
export function buildCreateDWalletTx(params: CreateDWalletParams): {
	action: 'create_dwallet'
	moveCall: {
		packageId: string
		module: string
		function: string
		arguments: unknown[]
	}
	note: string
} {
	return {
		action: 'create_dwallet',
		moveCall: {
			packageId: params.packageId,
			module: 'dwallet',
			function: 'create',
			arguments: [
				params.chains,
				params.agencyId || null,
				params.metadata || {},
			],
		},
		note: 'Use @ika.xyz/sdk client-side to build and sign this transaction',
	}
}

/**
 * Build transaction to request a cross-chain signature
 */
export function buildSigningRequestTx(request: SigningRequest): {
	action: 'request_signature'
	moveCall: {
		packageId: string
		module: string
		function: string
		arguments: unknown[]
	}
	requires2PC: boolean
	note: string
} {
	return {
		action: 'request_signature',
		moveCall: {
			packageId: '', // Set from env
			module: 'dwallet',
			function: 'request_sign',
			arguments: [
				request.dWalletId,
				request.chain,
				request.txHash,
			],
		},
		requires2PC: request.requires2PC,
		note: request.requires2PC
			? '2PC-MPC signing requires approval from both human and agent'
			: 'Single-party signature request',
	}
}

/**
 * Build transaction to approve a 2PC-MPC signing request
 */
export function buildApprovalTx(params: {
	requestId: string
	dWalletId: string
	approverType: 'human' | 'agent'
}): {
	action: 'approve_signature'
	moveCall: {
		packageId: string
		module: string
		function: string
		arguments: unknown[]
	}
	note: string
} {
	return {
		action: 'approve_signature',
		moveCall: {
			packageId: '', // Set from env
			module: 'dwallet',
			function: 'approve',
			arguments: [
				params.requestId,
				params.dWalletId,
			],
		},
		note: `Approval from ${params.approverType}`,
	}
}

/**
 * Build transaction to get foreign chain address from dWallet
 */
export function buildGetAddressTx(params: {
	dWalletId: string
	chain: ForeignChain
}): {
	action: 'get_address'
	moveCall: {
		packageId: string
		module: string
		function: string
		arguments: unknown[]
	}
	note: string
} {
	return {
		action: 'get_address',
		moveCall: {
			packageId: '', // Set from env
			module: 'dwallet',
			function: 'get_foreign_address',
			arguments: [
				params.dWalletId,
				params.chain,
			],
		},
		note: `Get ${params.chain} address for dWallet`,
	}
}

/**
 * Chain-specific transaction data structures
 */
export interface BitcoinTxData {
	inputs: Array<{
		txid: string
		vout: number
		value: number
	}>
	outputs: Array<{
		address: string
		value: number
	}>
	fee: number
}

export interface EthereumTxData {
	to: string
	value: string
	data?: string
	nonce?: number
	gasLimit?: string
	maxFeePerGas?: string
	maxPriorityFeePerGas?: string
	chainId: number
}

export interface SolanaTxData {
	recentBlockhash: string
	instructions: Array<{
		programId: string
		keys: Array<{
			pubkey: string
			isSigner: boolean
			isWritable: boolean
		}>
		data: string
	}>
}

/**
 * Validate transaction data for a specific chain
 */
export function validateTxData(chain: ForeignChain, data: unknown): { valid: boolean; error?: string } {
	switch (chain) {
		case 'bitcoin': {
			const btc = data as BitcoinTxData
			if (!btc.inputs?.length) return { valid: false, error: 'Bitcoin tx requires inputs' }
			if (!btc.outputs?.length) return { valid: false, error: 'Bitcoin tx requires outputs' }
			return { valid: true }
		}
		case 'ethereum': {
			const eth = data as EthereumTxData
			if (!eth.to) return { valid: false, error: 'Ethereum tx requires "to" address' }
			if (!eth.chainId) return { valid: false, error: 'Ethereum tx requires chainId' }
			return { valid: true }
		}
		case 'solana': {
			const sol = data as SolanaTxData
			if (!sol.recentBlockhash) return { valid: false, error: 'Solana tx requires recentBlockhash' }
			if (!sol.instructions?.length) return { valid: false, error: 'Solana tx requires instructions' }
			return { valid: true }
		}
		default:
			return { valid: false, error: `Unsupported chain: ${chain}` }
	}
}
