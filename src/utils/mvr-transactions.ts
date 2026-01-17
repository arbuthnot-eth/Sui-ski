import { Transaction } from '@mysten/sui/transactions'
import type { Env } from '../types'

/**
 * Move Registry (MVR) Transaction Builder Utilities
 *
 * These utilities generate unsigned transaction blocks that can be signed offline
 * for managing packages in the Move Registry.
 */

// Move Registry package address - will need to be configured based on network
export const MVR_PACKAGE_ID = {
	mainnet: '0x0000000000000000000000000000000000000000000000000000000000000000', // TODO: Update with actual mainnet package ID
	testnet: '0x0000000000000000000000000000000000000000000000000000000000000000', // TODO: Update with actual testnet package ID
} as const

export interface PackageMetadata {
	name: string
	description?: string
	repository?: string
	documentation?: string
	license?: string
	homepage?: string
	iconUrl?: string
}

export interface RegisterPackageParams {
	/** SuiNS name (without .sui suffix) */
	suinsName: string
	/** Package name (e.g., "core", "nft", "utils") */
	packageName: string
	/** Package address on Sui */
	packageAddress: string
	/** Optional metadata */
	metadata?: PackageMetadata
	/** Gas budget in MIST (default: 100M MIST = 0.1 SUI) */
	gasBudget?: string
}

export interface PublishVersionParams {
	/** SuiNS name (without .sui suffix) */
	suinsName: string
	/** Package name */
	packageName: string
	/** New package address for this version */
	packageAddress: string
	/** Version number (must be sequential) */
	version: number
	/** Gas budget in MIST */
	gasBudget?: string
}

export interface UpdateMetadataParams {
	/** SuiNS name (without .sui suffix) */
	suinsName: string
	/** Package name */
	packageName: string
	/** Updated metadata */
	metadata: Partial<PackageMetadata>
	/** Gas budget in MIST */
	gasBudget?: string
}

export interface TransferOwnershipParams {
	/** SuiNS name (without .sui suffix) */
	suinsName: string
	/** Package name */
	packageName: string
	/** New owner address */
	newOwner: string
	/** Gas budget in MIST */
	gasBudget?: string
}

/**
 * Build an unsigned transaction to register a new package in the Move Registry
 *
 * @example
 * ```ts
 * const tx = buildRegisterPackageTx({
 *   suinsName: 'myname',
 *   packageName: 'core',
 *   packageAddress: '0x123...',
 *   metadata: {
 *     description: 'Core utilities for my project',
 *     repository: 'https://github.com/user/repo',
 *   }
 * }, 'mainnet')
 *
 * const bytes = await tx.build({ client })
 * // Sign with wallet and execute
 * ```
 */
export function buildRegisterPackageTx(
	params: RegisterPackageParams,
	network: 'mainnet' | 'testnet' = 'mainnet',
): Transaction {
	const tx = new Transaction()

	const packageId = MVR_PACKAGE_ID[network]
	const registryKey = `${params.suinsName}/${params.packageName}`

	// Move call: registry::register_package(
	//   registry: &mut Registry,
	//   name: String,
	//   package_address: address,
	//   description: Option<String>,
	//   repository: Option<String>,
	//   documentation: Option<String>,
	//   ctx: &mut TxContext
	// )
	tx.moveCall({
		target: `${packageId}::registry::register_package`,
		arguments: [
			tx.object('0x0'), // TODO: Replace with actual registry object ID
			tx.pure.string(registryKey),
			tx.pure.address(params.packageAddress),
			tx.pure.option('string', params.metadata?.description),
			tx.pure.option('string', params.metadata?.repository),
			tx.pure.option('string', params.metadata?.documentation),
		],
	})

	if (params.gasBudget) {
		tx.setGasBudget(params.gasBudget)
	}

	return tx
}

/**
 * Build an unsigned transaction to publish a new version of an existing package
 *
 * @example
 * ```ts
 * const tx = buildPublishVersionTx({
 *   suinsName: 'myname',
 *   packageName: 'core',
 *   packageAddress: '0x456...',
 *   version: 2
 * }, 'mainnet')
 * ```
 */
export function buildPublishVersionTx(
	params: PublishVersionParams,
	network: 'mainnet' | 'testnet' = 'mainnet',
): Transaction {
	const tx = new Transaction()

	const packageId = MVR_PACKAGE_ID[network]
	const registryKey = `${params.suinsName}/${params.packageName}`

	// Move call: registry::publish_version(
	//   registry: &mut Registry,
	//   name: String,
	//   version: u64,
	//   package_address: address,
	//   ctx: &mut TxContext
	// )
	tx.moveCall({
		target: `${packageId}::registry::publish_version`,
		arguments: [
			tx.object('0x0'), // TODO: Replace with actual registry object ID
			tx.pure.string(registryKey),
			tx.pure.u64(params.version),
			tx.pure.address(params.packageAddress),
		],
	})

	if (params.gasBudget) {
		tx.setGasBudget(params.gasBudget)
	}

	return tx
}

/**
 * Build an unsigned transaction to update package metadata
 *
 * @example
 * ```ts
 * const tx = buildUpdateMetadataTx({
 *   suinsName: 'myname',
 *   packageName: 'core',
 *   metadata: {
 *     description: 'Updated description',
 *     homepage: 'https://example.com'
 *   }
 * }, 'mainnet')
 * ```
 */
export function buildUpdateMetadataTx(
	params: UpdateMetadataParams,
	network: 'mainnet' | 'testnet' = 'mainnet',
): Transaction {
	const tx = new Transaction()

	const packageId = MVR_PACKAGE_ID[network]
	const registryKey = `${params.suinsName}/${params.packageName}`

	// Move call: registry::update_metadata(
	//   registry: &mut Registry,
	//   name: String,
	//   description: Option<String>,
	//   repository: Option<String>,
	//   documentation: Option<String>,
	//   ctx: &mut TxContext
	// )
	tx.moveCall({
		target: `${packageId}::registry::update_metadata`,
		arguments: [
			tx.object('0x0'), // TODO: Replace with actual registry object ID
			tx.pure.string(registryKey),
			tx.pure.option('string', params.metadata.description),
			tx.pure.option('string', params.metadata.repository),
			tx.pure.option('string', params.metadata.documentation),
		],
	})

	if (params.gasBudget) {
		tx.setGasBudget(params.gasBudget)
	}

	return tx
}

/**
 * Build an unsigned transaction to transfer package ownership
 *
 * @example
 * ```ts
 * const tx = buildTransferOwnershipTx({
 *   suinsName: 'myname',
 *   packageName: 'core',
 *   newOwner: '0x789...'
 * }, 'mainnet')
 * ```
 */
export function buildTransferOwnershipTx(
	params: TransferOwnershipParams,
	network: 'mainnet' | 'testnet' = 'mainnet',
): Transaction {
	const tx = new Transaction()

	const packageId = MVR_PACKAGE_ID[network]
	const registryKey = `${params.suinsName}/${params.packageName}`

	// Move call: registry::transfer_ownership(
	//   registry: &mut Registry,
	//   name: String,
	//   new_owner: address,
	//   ctx: &mut TxContext
	// )
	tx.moveCall({
		target: `${packageId}::registry::transfer_ownership`,
		arguments: [
			tx.object('0x0'), // TODO: Replace with actual registry object ID
			tx.pure.string(registryKey),
			tx.pure.address(params.newOwner),
		],
	})

	if (params.gasBudget) {
		tx.setGasBudget(params.gasBudget)
	}

	return tx
}

/**
 * Serialize a transaction to base64 for offline signing
 *
 * This allows you to:
 * 1. Build the transaction
 * 2. Serialize it to base64
 * 3. Sign it with a wallet/key offline
 * 4. Submit the signed transaction
 *
 * @example
 * ```ts
 * const tx = buildRegisterPackageTx(params, 'mainnet')
 * const txBytes = await serializeTransaction(tx, env)
 * // User signs txBytes with their wallet
 * // Then submit with relaySignedTransaction(env, txBytes, [signature])
 * ```
 */
export async function serializeTransaction(tx: Transaction, env: Env): Promise<string> {
	// Note: This requires a SuiClient instance to build the transaction
	// The client is needed to resolve object references and gas
	const { SuiClient } = await import('@mysten/sui/client')
	const client = new SuiClient({ url: env.SUI_RPC_URL })

	const txBytes = await tx.build({ client })
	return txBytes
}

/**
 * Generate a transaction digest for preview/verification before signing
 */
export async function getTransactionDigest(txBytes: string): Promise<string> {
	const { fromB64 } = await import('@mysten/sui/utils')
	const { blake2b } = await import('@noble/hashes/blake2b')

	const bytes = fromB64(txBytes)
	const hash = blake2b(bytes, { dkLen: 32 })
	return `0x${Buffer.from(hash).toString('hex')}`
}

/**
 * Helper to get the MVR registry object ID for the current network
 */
export function getMVRRegistryId(network: 'mainnet' | 'testnet', env: Env): string {
	// First check environment variable
	if (env.MOVE_REGISTRY_PARENT_ID) {
		return env.MOVE_REGISTRY_PARENT_ID
	}

	// Fall back to hardcoded values (if available)
	// These would be set once the MVR contract is deployed
	const REGISTRY_IDS = {
		mainnet: '', // TODO: Set mainnet registry ID
		testnet: '', // TODO: Set testnet registry ID
	}

	return REGISTRY_IDS[network] || ''
}
