import { SuiClient } from '@mysten/sui/client'
import { getMoveRegistryParentId, resolveMVRPackage } from '../resolvers/mvr'
import type { Env } from '../types'
import {
	buildPublishVersionTx,
	buildRegisterPackageTx,
	buildTransferOwnershipTx,
	buildUpdateMetadataTx,
	getMVRRegistryId,
	getTransactionDigest,
	type PublishVersionParams,
	type RegisterPackageParams,
	serializeTransaction,
	type TransferOwnershipParams,
	type UpdateMetadataParams,
} from '../utils/mvr-transactions'
import { errorResponse, jsonResponse } from '../utils/response'

/**
 * Handle MVR management API requests
 *
 * Endpoints:
 * - POST /api/mvr/register - Generate unsigned tx to register a package
 * - POST /api/mvr/publish-version - Generate unsigned tx to publish a version
 * - POST /api/mvr/update-metadata - Generate unsigned tx to update metadata
 * - POST /api/mvr/transfer - Generate unsigned tx to transfer ownership
 * - GET /api/mvr/packages/:suinsName - List all packages for a SuiNS name
 * - GET /api/mvr/search?q=query - Search packages
 */
export async function handleMVRManagementRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname

	// List packages for a SuiNS name
	if (request.method === 'GET' && path.match(/^\/api\/mvr\/packages\/[^/]+$/)) {
		const suinsName = path.split('/').pop()
		if (!suinsName) {
			return errorResponse('SuiNS name required', 'BAD_REQUEST', 400)
		}
		return handleListPackages(suinsName, env)
	}

	// Search packages
	if (request.method === 'GET' && path === '/api/mvr/search') {
		const query = url.searchParams.get('q')
		if (!query) {
			return errorResponse('Search query required', 'BAD_REQUEST', 400)
		}
		return handleSearchPackages(query, env)
	}

	// All management operations require POST and registry to be configured
	if (request.method !== 'POST') {
		return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405)
	}

	const registryId = getMoveRegistryParentId(env)
	if (!registryId) {
		return errorResponse('Move Registry not configured', 'NOT_CONFIGURED', 503)
	}

	// Parse request body
	let body: unknown
	try {
		body = await request.json()
	} catch {
		return errorResponse('Invalid JSON body', 'BAD_REQUEST', 400)
	}

	// Route to appropriate handler
	switch (path) {
		case '/api/mvr/register':
			return handleRegisterPackage(body, env)
		case '/api/mvr/publish-version':
			return handlePublishVersion(body, env)
		case '/api/mvr/update-metadata':
			return handleUpdateMetadata(body, env)
		case '/api/mvr/transfer':
			return handleTransferOwnership(body, env)
		default:
			return errorResponse('Not found', 'NOT_FOUND', 404)
	}
}

/**
 * Generate unsigned transaction for registering a new package
 */
async function handleRegisterPackage(body: unknown, env: Env): Promise<Response> {
	// Validate input
	if (!isRegisterPackageParams(body)) {
		return errorResponse('Invalid request body', 'BAD_REQUEST', 400)
	}

	try {
		const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
		const tx = buildRegisterPackageTx(body, network)

		// Serialize to base64 for signing
		const txBytes = await serializeTransaction(tx, env)
		const digest = await getTransactionDigest(txBytes)

		return jsonResponse({
			success: true,
			operation: 'register_package',
			transaction: {
				bytes: txBytes,
				digest,
			},
			package: {
				name: `@${body.suinsName}/${body.packageName}`,
				address: body.packageAddress,
			},
			instructions: {
				step1: 'Sign the transaction bytes with your wallet',
				step2: 'Submit the signed transaction to the network',
				step3: 'Your package will be registered in the Move Registry',
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return errorResponse(message, 'TRANSACTION_BUILD_ERROR', 500)
	}
}

/**
 * Generate unsigned transaction for publishing a new version
 */
async function handlePublishVersion(body: unknown, env: Env): Promise<Response> {
	if (!isPublishVersionParams(body)) {
		return errorResponse('Invalid request body', 'BAD_REQUEST', 400)
	}

	try {
		const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
		const tx = buildPublishVersionTx(body, network)

		const txBytes = await serializeTransaction(tx, env)
		const digest = await getTransactionDigest(txBytes)

		return jsonResponse({
			success: true,
			operation: 'publish_version',
			transaction: {
				bytes: txBytes,
				digest,
			},
			package: {
				name: `@${body.suinsName}/${body.packageName}`,
				version: body.version,
				address: body.packageAddress,
			},
			instructions: {
				step1: 'Sign the transaction bytes with your wallet',
				step2: 'Submit the signed transaction to the network',
				step3: `Version ${body.version} will be published`,
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return errorResponse(message, 'TRANSACTION_BUILD_ERROR', 500)
	}
}

/**
 * Generate unsigned transaction for updating metadata
 */
async function handleUpdateMetadata(body: unknown, env: Env): Promise<Response> {
	if (!isUpdateMetadataParams(body)) {
		return errorResponse('Invalid request body', 'BAD_REQUEST', 400)
	}

	try {
		const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
		const tx = buildUpdateMetadataTx(body, network)

		const txBytes = await serializeTransaction(tx, env)
		const digest = await getTransactionDigest(txBytes)

		return jsonResponse({
			success: true,
			operation: 'update_metadata',
			transaction: {
				bytes: txBytes,
				digest,
			},
			package: {
				name: `@${body.suinsName}/${body.packageName}`,
				metadata: body.metadata,
			},
			instructions: {
				step1: 'Sign the transaction bytes with your wallet',
				step2: 'Submit the signed transaction to the network',
				step3: 'Package metadata will be updated',
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return errorResponse(message, 'TRANSACTION_BUILD_ERROR', 500)
	}
}

/**
 * Generate unsigned transaction for transferring ownership
 */
async function handleTransferOwnership(body: unknown, env: Env): Promise<Response> {
	if (!isTransferOwnershipParams(body)) {
		return errorResponse('Invalid request body', 'BAD_REQUEST', 400)
	}

	try {
		const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
		const tx = buildTransferOwnershipTx(body, network)

		const txBytes = await serializeTransaction(tx, env)
		const digest = await getTransactionDigest(txBytes)

		return jsonResponse({
			success: true,
			operation: 'transfer_ownership',
			transaction: {
				bytes: txBytes,
				digest,
			},
			package: {
				name: `@${body.suinsName}/${body.packageName}`,
				newOwner: body.newOwner,
			},
			instructions: {
				step1: 'Sign the transaction bytes with your wallet',
				step2: 'Submit the signed transaction to the network',
				step3: `Ownership will be transferred to ${body.newOwner}`,
			},
			warning: 'This action is irreversible. Make sure the new owner address is correct.',
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return errorResponse(message, 'TRANSACTION_BUILD_ERROR', 500)
	}
}

/**
 * List all packages registered under a SuiNS name
 */
async function handleListPackages(suinsName: string, env: Env): Promise<Response> {
	try {
		const registryId = getMoveRegistryParentId(env)
		if (!registryId) {
			return errorResponse('Move Registry not configured', 'NOT_CONFIGURED', 503)
		}

		const client = new SuiClient({ url: env.SUI_RPC_URL })

		// Query all dynamic fields with the pattern {suinsName}/*
		const prefix = `${suinsName}/`
		const dynamicFields = await client.getDynamicFields({
			parentId: registryId,
		})

		// Filter fields that match this SuiNS name
		const packages = []
		for (const field of dynamicFields.data) {
			const fieldName = field.name?.value
			if (typeof fieldName === 'string' && fieldName.startsWith(prefix)) {
				const packageName = fieldName.slice(prefix.length)
				// Fetch the package details
				const result = await resolveMVRPackage(suinsName, packageName, undefined, env)
				if (result.found && result.data) {
					packages.push(result.data)
				}
			}
		}

		return jsonResponse({
			suinsName,
			packages,
			count: packages.length,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to list packages'
		return errorResponse(message, 'QUERY_ERROR', 500)
	}
}

/**
 * Search for packages across the registry
 */
async function handleSearchPackages(query: string, env: Env): Promise<Response> {
	try {
		const registryId = getMoveRegistryParentId(env)
		if (!registryId) {
			return errorResponse('Move Registry not configured', 'NOT_CONFIGURED', 503)
		}

		const client = new SuiClient({ url: env.SUI_RPC_URL })

		// Get all dynamic fields (this could be expensive for large registries)
		const dynamicFields = await client.getDynamicFields({
			parentId: registryId,
		})

		const results = []
		const queryLower = query.toLowerCase()

		// Search through all packages
		for (const field of dynamicFields.data) {
			const fieldName = field.name?.value
			if (typeof fieldName === 'string' && fieldName.includes('/')) {
				const [suinsName, packageName] = fieldName.split('/')

				// Check if query matches name
				if (
					suinsName.toLowerCase().includes(queryLower) ||
					packageName.toLowerCase().includes(queryLower) ||
					fieldName.toLowerCase().includes(queryLower)
				) {
					// Fetch the package details
					const result = await resolveMVRPackage(suinsName, packageName, undefined, env)
					if (result.found && result.data) {
						results.push(result.data)
					}
				}
			}

			// Limit results to prevent excessive queries
			if (results.length >= 20) break
		}

		return jsonResponse({
			query,
			results,
			count: results.length,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to search packages'
		return errorResponse(message, 'SEARCH_ERROR', 500)
	}
}

// Type guards for request validation

function isRegisterPackageParams(body: unknown): body is RegisterPackageParams {
	return (
		typeof body === 'object' &&
		body !== null &&
		'suinsName' in body &&
		typeof body.suinsName === 'string' &&
		'packageName' in body &&
		typeof body.packageName === 'string' &&
		'packageAddress' in body &&
		typeof body.packageAddress === 'string'
	)
}

function isPublishVersionParams(body: unknown): body is PublishVersionParams {
	return (
		typeof body === 'object' &&
		body !== null &&
		'suinsName' in body &&
		typeof body.suinsName === 'string' &&
		'packageName' in body &&
		typeof body.packageName === 'string' &&
		'packageAddress' in body &&
		typeof body.packageAddress === 'string' &&
		'version' in body &&
		typeof body.version === 'number'
	)
}

function isUpdateMetadataParams(body: unknown): body is UpdateMetadataParams {
	return (
		typeof body === 'object' &&
		body !== null &&
		'suinsName' in body &&
		typeof body.suinsName === 'string' &&
		'packageName' in body &&
		typeof body.packageName === 'string' &&
		'metadata' in body &&
		typeof body.metadata === 'object'
	)
}

function isTransferOwnershipParams(body: unknown): body is TransferOwnershipParams {
	return (
		typeof body === 'object' &&
		body !== null &&
		'suinsName' in body &&
		typeof body.suinsName === 'string' &&
		'packageName' in body &&
		typeof body.packageName === 'string' &&
		'newOwner' in body &&
		typeof body.newOwner === 'string'
	)
}
