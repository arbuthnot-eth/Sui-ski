/**
 * MVR (Move Registry) Compatibility Layer
 *
 * Provides a unified interface for resolving MVR packages using multiple naming formats
 * and version resolution strategies.
 *
 * Supported formats:
 * - @namespace/package
 * - namespace.sui/package
 * - namespace/package
 * - @namespace/package/1 (version pinning)
 * - @namespace/package@1.0.0 (semver version)
 *
 * Features:
 * - Cross-network resolution (mainnet/testnet) with automatic fallback
 * - Version resolution (latest, specific version, semver)
 * - Caching layer for performance
 * - Error handling for invalid names, missing packages, network errors
 */

import { resolveMVRPackage } from '../resolvers/mvr'
import type { Env, MVRPackageInfo } from '../types'

// ========== Types ==========

/**
 * Package name components
 */
export interface ParsedPackageName {
	namespace: string
	packageName: string
	version?: number | string
	format: 'at-format' | 'dot-format' | 'slash-format'
}

/**
 * Version specification
 */
export type VersionSpec = 'latest' | number | string

/**
 * Resolution options
 */
export interface ResolutionOptions {
	/** Network to resolve on (defaults to 'mainnet') */
	network?: 'mainnet' | 'testnet'
	/** Try fallback network if primary fails */
	fallbackNetwork?: boolean
	/** Cache TTL in seconds (default: 300) */
	cacheTtl?: number
	/** Force fresh resolution (skip cache) */
	forceRefresh?: boolean
}

/**
 * Resolution result
 */
export interface ResolutionResult {
	/** Resolved package info */
	package: MVRPackageInfo | null
	/** Network used for resolution */
	network: 'mainnet' | 'testnet'
	/** Whether fallback network was used */
	usedFallback: boolean
	/** Error message if resolution failed */
	error?: string
}

// ========== MVRResolver Class ==========

/**
 * MVR package resolver with compatibility layer
 */
export class MVRResolver {
	private env: Env
	private cache: Map<string, { data: MVRPackageInfo; expires: number }> = new Map()
	private defaultCacheTtl: number = 300 // 5 minutes

	constructor(env: Env) {
		this.env = env
	}

	/**
	 * Parse a package name into components
	 */
	parsePackageName(nameOrFormat: string): ParsedPackageName | null {
		// Remove leading/trailing whitespace
		const input = nameOrFormat.trim()

		// Try @namespace/package format
		const atMatch = input.match(/^@([a-z0-9-]+)\/([a-z0-9-]+)(?:\/(\d+))?(?:@(.+))?$/i)
		if (atMatch) {
			const [, namespace, packageName, versionNum, versionStr] = atMatch
			return {
				namespace,
				packageName,
				version: versionNum ? parseInt(versionNum, 10) : versionStr || undefined,
				format: 'at-format',
			}
		}

		// Try namespace.sui/package format
		const dotMatch = input.match(/^([a-z0-9-]+)\.sui\/([a-z0-9-]+)(?:\/(\d+))?(?:@(.+))?$/i)
		if (dotMatch) {
			const [, namespace, packageName, versionNum, versionStr] = dotMatch
			return {
				namespace,
				packageName,
				version: versionNum ? parseInt(versionNum, 10) : versionStr || undefined,
				format: 'dot-format',
			}
		}

		// Try namespace/package format (no @ or .sui)
		const slashMatch = input.match(/^([a-z0-9-]+)\/([a-z0-9-]+)(?:\/(\d+))?(?:@(.+))?$/i)
		if (slashMatch) {
			const [, namespace, packageName, versionNum, versionStr] = slashMatch
			return {
				namespace,
				packageName,
				version: versionNum ? parseInt(versionNum, 10) : versionStr || undefined,
				format: 'slash-format',
			}
		}

		return null
	}

	/**
	 * Normalize package name to @namespace/package format
	 */
	normalizePackageName(nameOrFormat: string): string | null {
		const parsed = this.parsePackageName(nameOrFormat)
		if (!parsed) return null

		let normalized = `@${parsed.namespace}/${parsed.packageName}`
		if (parsed.version) {
			if (typeof parsed.version === 'number') {
				normalized += `/${parsed.version}`
			} else {
				normalized += `@${parsed.version}`
			}
		}

		return normalized
	}

	/**
	 * Resolve a package using the compatibility layer
	 */
	async resolve(nameOrFormat: string, options: ResolutionOptions = {}): Promise<ResolutionResult> {
		const parsed = this.parsePackageName(nameOrFormat)
		if (!parsed) {
			return {
				package: null,
				network: options.network || (this.env.SUI_NETWORK as 'mainnet' | 'testnet'),
				usedFallback: false,
				error: `Invalid package name format: ${nameOrFormat}`,
			}
		}

		const primaryNetwork = options.network || (this.env.SUI_NETWORK as 'mainnet' | 'testnet')
		const fallbackNetwork = primaryNetwork === 'mainnet' ? 'testnet' : 'mainnet'

		// Build cache key
		const cacheKey = `mvr:${parsed.namespace}:${parsed.packageName}:${parsed.version || 'latest'}:${primaryNetwork}`

		// Check cache
		if (!options.forceRefresh) {
			const cached = this.cache.get(cacheKey)
			if (cached && cached.expires > Date.now()) {
				return {
					package: cached.data,
					network: primaryNetwork,
					usedFallback: false,
				}
			}
		}

		// Try primary network
		try {
			const result = await this.resolveOnNetwork(parsed, primaryNetwork)
			if (result) {
				// Cache the result
				const ttl = (options.cacheTtl || this.defaultCacheTtl) * 1000
				this.cache.set(cacheKey, {
					data: result,
					expires: Date.now() + ttl,
				})

				return {
					package: result,
					network: primaryNetwork,
					usedFallback: false,
				}
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			console.warn(`Failed to resolve on ${primaryNetwork}:`, message)

			// Try fallback network if enabled
			if (options.fallbackNetwork !== false) {
				try {
					const fallbackResult = await this.resolveOnNetwork(parsed, fallbackNetwork)
					if (fallbackResult) {
						// Cache the fallback result
						const fallbackCacheKey = `mvr:${parsed.namespace}:${parsed.packageName}:${parsed.version || 'latest'}:${fallbackNetwork}`
						const ttl = (options.cacheTtl || this.defaultCacheTtl) * 1000
						this.cache.set(fallbackCacheKey, {
							data: fallbackResult,
							expires: Date.now() + ttl,
						})

						return {
							package: fallbackResult,
							network: fallbackNetwork,
							usedFallback: true,
						}
					}
				} catch (fallbackError) {
					const fallbackMessage =
						fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
					return {
						package: null,
						network: primaryNetwork,
						usedFallback: true,
						error: `Failed on both networks: ${message}, ${fallbackMessage}`,
					}
				}
			}

			return {
				package: null,
				network: primaryNetwork,
				usedFallback: false,
				error: message,
			}
		}

		return {
			package: null,
			network: primaryNetwork,
			usedFallback: false,
			error: 'Package not found',
		}
	}

	/**
	 * Resolve package on a specific network
	 */
	private async resolveOnNetwork(
		parsed: ParsedPackageName,
		network: 'mainnet' | 'testnet',
	): Promise<MVRPackageInfo | null> {
		// Create a temporary env with the target network
		const tempEnv: Env = {
			...this.env,
			SUI_NETWORK: network,
		}

		// Resolve version
		let version: number | undefined
		if (parsed.version) {
			if (typeof parsed.version === 'number') {
				version = parsed.version
			} else {
				// Try to parse semver or version string
				const versionMatch = parsed.version.match(/^(\d+)\.(\d+)\.(\d+)$/)
				if (versionMatch) {
					// For now, use major version as the version number
					// In a full implementation, you'd need to map semver to MVR version numbers
					version = parseInt(versionMatch[1], 10)
				} else {
					// Try parsing as number
					const numVersion = parseInt(parsed.version, 10)
					if (!Number.isNaN(numVersion)) {
						version = numVersion
					}
				}
			}
		}

		// Use existing resolver
		const result = await resolveMVRPackage(parsed.namespace, parsed.packageName, version, tempEnv)

		if (result.found && result.data && 'address' in result.data) {
			// Type guard: ensure it's MVRPackageInfo, not SuiNSRecord
			return result.data as MVRPackageInfo
		}

		return null
	}

	/**
	 * Clear the cache
	 */
	clearCache(): void {
		this.cache.clear()
	}

	/**
	 * Clear expired cache entries
	 */
	clearExpiredCache(): void {
		const now = Date.now()
		for (const [key, value] of this.cache.entries()) {
			if (value.expires <= now) {
				this.cache.delete(key)
			}
		}
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { size: number; entries: number } {
		this.clearExpiredCache()
		return {
			size: this.cache.size,
			entries: this.cache.size,
		}
	}
}

/**
 * Create an MVR resolver instance
 */
export function createMVRResolver(env: Env): MVRResolver {
	return new MVRResolver(env)
}
