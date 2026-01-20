import { Transaction } from '@mysten/sui/transactions'
import type { Env } from '../types'

/**
 * Move Registry (MVR) Transaction Builder Utilities
 *
 * These utilities generate unsigned transaction blocks that can be signed offline
 * for managing packages in the Move Registry.
 */

// Move Registry package addresses
// @mvr/metadata is used for package_info operations
export const MVR_METADATA_PACKAGE_ID = {
	mainnet: '0xc88768f8b26581a8ee1bf71e6a6ec0f93d4cc6460ebb66a31b94d64de8105c98',
	testnet: '0xb96f44d08ae214887cae08d8ae061bbf6f0908b1bfccb710eea277f45150b9f4',
} as const

// @mvr/core is used for app registry operations
export const MVR_CORE_PACKAGE_ID = {
	mainnet: '0xbb97fa5af2504cc944a8df78dcb5c8b72c3673ca4ba8e4969a98188bf745ee54',
	testnet: '0xbb97fa5af2504cc944a8df78dcb5c8b72c3673ca4ba8e4969a98188bf745ee54', // Using mainnet as fallback - testnet may differ
} as const

// Registry object IDs (the shared objects that store the registry data)
export const MVR_REGISTRY_OBJECT_ID = {
	mainnet: '0x0e5d473a055b6b7d014af557a13ad9075157fdc19b6d51562a18511afd397727',
	testnet: '', // TODO: Set testnet registry object ID when available
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
	/** UpgradeCap object ID for the package */
	upgradeCapId: string
	/** Optional metadata */
	metadata?: PackageMetadata
	/** Gas budget in MIST (default: 100M MIST = 0.1 SUI) */
	gasBudget?: bigint | number
}

export interface PublishVersionParams {
	/** SuiNS name (without .sui suffix) */
	suinsName: string
	/** Package name */
	packageName: string
	/** New package address for this version */
	packageAddress: string
	/** PackageInfo object ID */
	packageInfoId: string
	/** Version number (must be sequential) */
	version: number
	/** Gas budget in MIST */
	gasBudget?: bigint | number
}

export interface UpdateMetadataParams {
	/** SuiNS name (without .sui suffix) */
	suinsName: string
	/** Package name */
	packageName: string
	/** PackageInfo object ID */
	packageInfoId: string
	/** Updated metadata */
	metadata: Partial<PackageMetadata>
	/** Gas budget in MIST */
	gasBudget?: bigint | number
}

export interface TransferOwnershipParams {
	/** SuiNS name (without .sui suffix) */
	suinsName: string
	/** Package name */
	packageName: string
	/** PackageInfo object ID */
	packageInfoId: string
	/** New owner address */
	newOwner: string
	/** Gas budget in MIST */
	gasBudget?: bigint | number
}

/**
 * Build an unsigned transaction to create a PackageInfo object for a package.
 * This is the first step in registering a package with MVR.
 *
 * The PackageInfo object is created by passing your UpgradeCap. This proves
 * you own the package and links the PackageInfo to it.
 *
 * @example
 * ```ts
 * const tx = buildRegisterPackageTx({
 *   suinsName: 'myname',
 *   packageName: 'core',
 *   packageAddress: '0x123...',
 *   upgradeCapId: '0xabc...', // Your UpgradeCap object ID
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

	const metadataPackageId = MVR_METADATA_PACKAGE_ID[network]

	// Step 1: Create PackageInfo by passing UpgradeCap
	// Move call: @mvr/metadata::package_info::new(upgrade_cap: &UpgradeCap): PackageInfo
	const packageInfo = tx.moveCall({
		target: `${metadataPackageId}::package_info::new`,
		arguments: [tx.object(params.upgradeCapId)],
	})

	// Step 2: Optionally set metadata on the PackageInfo
	if (params.metadata?.description) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_description`,
			arguments: [packageInfo, tx.pure.string(params.metadata.description)],
		})
	}

	if (params.metadata?.repository) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_repository`,
			arguments: [packageInfo, tx.pure.string(params.metadata.repository)],
		})
	}

	if (params.metadata?.documentation) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_documentation`,
			arguments: [packageInfo, tx.pure.string(params.metadata.documentation)],
		})
	}

	if (params.metadata?.homepage) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_homepage`,
			arguments: [packageInfo, tx.pure.string(params.metadata.homepage)],
		})
	}

	// Step 3: Transfer the PackageInfo to the sender (they become the owner)
	tx.transferObjects([packageInfo], tx.pure.address(params.packageAddress))

	if (params.gasBudget) {
		tx.setGasBudget(params.gasBudget)
	}

	return tx
}

/**
 * Build an unsigned transaction to add a new version to an existing PackageInfo.
 * Call this after upgrading your package to link the new version.
 *
 * @example
 * ```ts
 * const tx = buildPublishVersionTx({
 *   suinsName: 'myname',
 *   packageName: 'core',
 *   packageAddress: '0x456...', // The new upgraded package address
 *   packageInfoId: '0x789...', // Your PackageInfo object
 *   version: 2
 * }, 'mainnet')
 * ```
 */
export function buildPublishVersionTx(
	params: PublishVersionParams,
	network: 'mainnet' | 'testnet' = 'mainnet',
): Transaction {
	const tx = new Transaction()

	const metadataPackageId = MVR_METADATA_PACKAGE_ID[network]

	// Add a new version to the PackageInfo
	// This links the upgraded package address as a new version
	tx.moveCall({
		target: `${metadataPackageId}::package_info::add_version`,
		arguments: [
			tx.object(params.packageInfoId),
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
 *   packageInfoId: '0x789...', // Your PackageInfo object
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

	const metadataPackageId = MVR_METADATA_PACKAGE_ID[network]

	// Update each metadata field that is provided
	if (params.metadata.description !== undefined) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_description`,
			arguments: [tx.object(params.packageInfoId), tx.pure.string(params.metadata.description)],
		})
	}

	if (params.metadata.repository !== undefined) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_repository`,
			arguments: [tx.object(params.packageInfoId), tx.pure.string(params.metadata.repository)],
		})
	}

	if (params.metadata.documentation !== undefined) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_documentation`,
			arguments: [tx.object(params.packageInfoId), tx.pure.string(params.metadata.documentation)],
		})
	}

	if (params.metadata.homepage !== undefined) {
		tx.moveCall({
			target: `${metadataPackageId}::package_info::set_homepage`,
			arguments: [tx.object(params.packageInfoId), tx.pure.string(params.metadata.homepage)],
		})
	}

	if (params.gasBudget) {
		tx.setGasBudget(params.gasBudget)
	}

	return tx
}

/**
 * Build an unsigned transaction to transfer PackageInfo ownership.
 * The PackageInfo is an owned object, so transferring it transfers control.
 *
 * @example
 * ```ts
 * const tx = buildTransferOwnershipTx({
 *   suinsName: 'myname',
 *   packageName: 'core',
 *   packageInfoId: '0x789...', // Your PackageInfo object
 *   newOwner: '0xabc...'
 * }, 'mainnet')
 * ```
 */
export function buildTransferOwnershipTx(
	params: TransferOwnershipParams,
	_network: 'mainnet' | 'testnet' = 'mainnet',
): Transaction {
	const tx = new Transaction()

	// PackageInfo is an owned object, so we simply transfer it
	tx.transferObjects([tx.object(params.packageInfoId)], tx.pure.address(params.newOwner))

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
	const { toBase64 } = await import('@mysten/sui/utils')
	const client = new SuiClient({ url: env.SUI_RPC_URL })

	const txBytes = await tx.build({ client })
	return toBase64(txBytes)
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

	// Fall back to hardcoded values
	return MVR_REGISTRY_OBJECT_ID[network] || ''
}
