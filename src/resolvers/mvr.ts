import { SuiClient } from '@mysten/sui/client'
import type { Env, MVRPackage, ResolverResult } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { toMVRName } from '../utils/subdomain'

const CACHE_TTL = 600 // 10 minutes - packages change less frequently

const PLACEHOLDER_REGISTRY_ID = '0x0000000000000000000000000000000000000000000000000000000000000001'
const MVR_REGISTRY_MAINNET = ''
const MVR_REGISTRY_TESTNET = ''

export function getMoveRegistryParentId(env: Env): string | null {
	const configured = env.MOVE_REGISTRY_PARENT_ID?.trim()
	if (configured && configured !== PLACEHOLDER_REGISTRY_ID) {
		return configured
	}

	const fallback = env.SUI_NETWORK === 'mainnet' ? MVR_REGISTRY_MAINNET : MVR_REGISTRY_TESTNET
	if (fallback && fallback !== PLACEHOLDER_REGISTRY_ID) {
		return fallback
	}
	return null
}

/**
 * Resolve a Move Registry package by name
 */
export async function resolveMVRPackage(
	suinsName: string,
	packageName: string,
	version: number | undefined,
	env: Env,
): Promise<ResolverResult> {
	const mvrName = toMVRName(suinsName, packageName, version)
	const key = cacheKey('mvr', env.SUI_NETWORK, mvrName)

	// Check cache first
	const cached = await getCached<MVRPackage>(env, key)
	if (cached) {
		return { found: true, data: cached, cacheTtl: CACHE_TTL }
	}

	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })

		// Query the MVR registry for the package
		// This uses the MVR on-chain resolution mechanism
		const packageData = await queryMVRRegistry(suiClient, suinsName, packageName, version, env)

		if (!packageData) {
			return {
				found: false,
				error: `Package "${mvrName}" not found in Move Registry`,
			}
		}

		// Cache the result
		await setCache(env, key, packageData, CACHE_TTL)

		return { found: true, data: packageData, cacheTtl: CACHE_TTL }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { found: false, error: message }
	}
}

/**
 * Query the MVR registry on-chain
 */
async function queryMVRRegistry(
	client: SuiClient,
	suinsName: string,
	packageName: string,
	version: number | undefined,
	env: Env,
): Promise<MVRPackage | null> {
	const registryId = getMoveRegistryParentId(env)
	if (!registryId) {
		throw new Error('Move Registry parent ID not configured')
	}

	// The MVR registry stores package mappings as dynamic fields
	// Key format: {suins_name}/{package_name}
	const lookupKey = `${suinsName}/${packageName}`

	try {
		// Get the dynamic field for this package name
		const dynamicField = await client.getDynamicFieldObject({
			parentId: registryId,
			name: {
				type: '0x1::string::String',
				value: lookupKey,
			},
		})

		if (!dynamicField.data) {
			return null
		}

		// Parse the package data from the dynamic field
		const content = dynamicField.data.content
		if (content?.dataType !== 'moveObject') {
			return null
		}

		// Extract fields from the Move object
		const fields = content.fields as Record<string, unknown>

		// Get all versions and find the requested one (or latest)
		const versions = fields.versions as Array<{ address: string; version: number }>
		if (!versions || versions.length === 0) {
			return null
		}

		const targetVersion = version ?? versions.length // Default to latest
		const versionData =
			versions.find((v) => v.version === targetVersion) || versions[versions.length - 1]

		return {
			name: `@${suinsName}/${packageName}`,
			address: versionData.address,
			version: versionData.version,
			metadata: {
				description: fields.description as string | undefined,
				repository: fields.repository as string | undefined,
				documentation: fields.documentation as string | undefined,
			},
		}
	} catch {
		// Package not found or registry query failed
		return null
	}
}

/**
 * Get documentation URL for an MVR package
 */
export function getMVRDocumentationUrl(pkg: MVRPackage): string {
	if (pkg.metadata?.documentation) {
		return pkg.metadata.documentation
	}
	// Default to moveregistry.com documentation page
	return `https://www.moveregistry.com/package/${pkg.name}`
}

/**
 * Get explorer URL for the package address
 */
export function getPackageExplorerUrl(address: string, network: string): string {
	const baseUrl =
		network === 'mainnet' ? 'https://suiscan.xyz/mainnet' : `https://suiscan.xyz/${network}`
	return `${baseUrl}/object/${address}`
}
