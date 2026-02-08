import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import type { Env, MVRPackageInfo, ResolverResult } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { getDefaultRpcUrl } from '../utils/rpc'

const CACHE_TTL = 300 // 5 minutes

// Move Registry object IDs (fallbacks - prefer MOVE_REGISTRY_PARENT_ID env var)
const MVR_REGISTRY_OBJECT_ID = {
	mainnet: '0x0e5d473a055b6b7d014af557a13ad9075157fdc19b6d51562a18511afd397727',
	testnet: null,
} as const

/**
 * Get the Move Registry parent ID for the current network
 */
export function getMoveRegistryParentId(env: Env): string | null {
	// First check environment variable
	if (env.MOVE_REGISTRY_PARENT_ID) {
		return env.MOVE_REGISTRY_PARENT_ID
	}

	// Fall back to hardcoded values
	const network = env.SUI_NETWORK as 'mainnet' | 'testnet'
	const registryId = MVR_REGISTRY_OBJECT_ID[network]
	return registryId || null
}

/**
 * Resolve an MVR package by SuiNS name and package name
 */
export async function resolveMVRPackage(
	suinsName: string,
	packageName: string,
	version: number | undefined,
	env: Env,
): Promise<ResolverResult> {
	const cleanSuinsName = suinsName.toLowerCase().replace(/\.sui$/i, '')
	const cleanPackageName = packageName.toLowerCase()
	const key = cacheKey(
		'mvr',
		env.SUI_NETWORK,
		`${cleanSuinsName}/${cleanPackageName}${version ? `@${version}` : ''}`,
	)

	// Check cache first
	const cached = await getCached<MVRPackageInfo>(key)
	if (cached) {
		return { found: true, data: cached, cacheTtl: CACHE_TTL }
	}

	const registryId = getMoveRegistryParentId(env)
	if (!registryId) {
		return { found: false, error: 'Move Registry not configured for this network' }
	}

	try {
		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		// The MVR stores packages as dynamic fields on the registry object
		// Field name format: "{suinsName}/{packageName}"
		const fieldName = `${cleanSuinsName}/${cleanPackageName}`

		// Get the dynamic field
		const field = await client.getDynamicFieldObject({
			parentId: registryId,
			name: {
				type: '0x1::string::String',
				value: fieldName,
			},
		})

		if (!field.data) {
			return { found: false, error: `Package "${fieldName}" not found in registry` }
		}

		// Parse the package info from the field content
		const content = field.data.content
		if (!content || content.dataType !== 'moveObject') {
			return { found: false, error: 'Invalid package info format' }
		}

		const fields = content.fields as Record<string, unknown>

		// Extract package address from the PackageInfo object
		// The structure depends on the MVR contract implementation
		const packageAddress = extractPackageAddress(fields, version)
		if (!packageAddress) {
			return { found: false, error: 'Could not extract package address' }
		}

		const packageInfo: MVRPackageInfo = {
			name: fieldName,
			suinsName: cleanSuinsName,
			packageName: cleanPackageName,
			address: packageAddress,
			version: version,
			metadata: extractMetadata(fields),
		}

		// Cache the result
		await setCache(key, packageInfo, CACHE_TTL)

		return { found: true, data: packageInfo, cacheTtl: CACHE_TTL }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { found: false, error: message }
	}
}

/**
 * Extract package address from MVR PackageInfo fields
 */
function extractPackageAddress(fields: Record<string, unknown>, version?: number): string | null {
	// Try to get the package address from various possible field structures
	// The exact structure depends on the MVR contract version

	// Check for direct package_id field
	if (typeof fields.package_id === 'string') {
		return fields.package_id
	}

	// Check for versioned packages
	if (fields.versions && Array.isArray(fields.versions)) {
		const versions = fields.versions as Array<{ package_id?: string; version?: number }>
		if (version !== undefined) {
			const versionEntry = versions.find((v) => v.version === version)
			if (versionEntry?.package_id) {
				return versionEntry.package_id
			}
		}
		// Return latest version if no specific version requested
		const latest = versions[versions.length - 1]
		if (latest?.package_id) {
			return latest.package_id
		}
	}

	// Check for package_address field
	if (typeof fields.package_address === 'string') {
		return fields.package_address
	}

	// Check nested value field
	if (fields.value && typeof fields.value === 'object') {
		const value = fields.value as Record<string, unknown>
		if (typeof value.package_id === 'string') {
			return value.package_id
		}
		if (typeof value.package_address === 'string') {
			return value.package_address
		}
	}

	return null
}

/**
 * Extract metadata from MVR PackageInfo fields
 */
function extractMetadata(fields: Record<string, unknown>): MVRPackageInfo['metadata'] {
	const metadata: MVRPackageInfo['metadata'] = {}

	// Try to extract metadata from various possible field structures
	const metadataSource = (fields.metadata as Record<string, unknown>) || fields

	if (typeof metadataSource.name === 'string') {
		metadata.name = metadataSource.name
	}
	if (typeof metadataSource.description === 'string') {
		metadata.description = metadataSource.description
	}
	if (typeof metadataSource.repository === 'string') {
		metadata.repository = metadataSource.repository
	}
	if (typeof metadataSource.documentation === 'string') {
		metadata.documentation = metadataSource.documentation
	}
	if (typeof metadataSource.license === 'string') {
		metadata.license = metadataSource.license
	}
	if (typeof metadataSource.homepage === 'string') {
		metadata.homepage = metadataSource.homepage
	}
	if (typeof metadataSource.icon_url === 'string') {
		metadata.iconUrl = metadataSource.icon_url
	}

	return Object.keys(metadata).length > 0 ? metadata : undefined
}
