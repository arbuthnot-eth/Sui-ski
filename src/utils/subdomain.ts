import type { ParsedSubdomain } from '../types'

const DOMAIN = 'sui.ski'
const STAGING_DOMAIN = 'staging.sui.ski'

/**
 * Parse subdomain from hostname to determine routing type
 *
 * Patterns:
 * - sui.ski -> root landing page
 * - myname.sui.ski -> SuiNS name resolution
 * - pkg--myname.sui.ski -> MVR package (package "pkg" under SuiNS name "myname")
 * - pkg--myname--v2.sui.ski -> MVR package version 2
 * - rpc.sui.ski -> RPC proxy endpoint
 * - ipfs-{cid}.sui.ski -> Direct IPFS content
 * - walrus-{blobId}.sui.ski -> Direct Walrus content
 * - play-{blobId}.sui.ski -> Media player for audio/video or playlist
 */
export function parseSubdomain(hostname: string): ParsedSubdomain {
	// Normalize hostname
	const host = hostname.toLowerCase()

	// Check for staging environment
	const isStaging = host.endsWith(STAGING_DOMAIN)
	const baseDomain = isStaging ? STAGING_DOMAIN : DOMAIN

	// Root domain
	if (host === baseDomain || host === `www.${baseDomain}`) {
		return { type: 'root', subdomain: '', hostname: host }
	}

	// Extract subdomain
	const subdomain = host.replace(`.${baseDomain}`, '')

	// RPC proxy
	if (subdomain === 'rpc') {
		return { type: 'rpc', subdomain, hostname: host }
	}

	// Direct IPFS content: ipfs-{cid}.sui.ski
	if (subdomain.startsWith('ipfs-')) {
		return {
			type: 'content',
			subdomain,
			hostname: host,
		}
	}

	// Direct Walrus content: walrus-{blobId}.sui.ski
	if (subdomain.startsWith('walrus-')) {
		return {
			type: 'content',
			subdomain,
			hostname: host,
		}
	}

	// Media player: play-{blobId}.sui.ski
	if (subdomain.startsWith('play-')) {
		return {
			type: 'play',
			subdomain,
			hostname: host,
		}
	}

	// MVR package pattern: pkg--name or pkg--name--v{version}
	if (subdomain.includes('--')) {
		const parts = subdomain.split('--')
		const packageName = parts[0]
		const suinsName = parts[1]
		let version: number | undefined

		// Check for version suffix: --v2, --v3, etc.
		if (parts.length > 2 && parts[2].startsWith('v')) {
			version = parseInt(parts[2].slice(1), 10)
			if (Number.isNaN(version)) version = undefined
		}

		return {
			type: 'mvr',
			subdomain: suinsName,
			packageName,
			version,
			hostname: host,
		}
	}

	// Default: SuiNS name resolution
	return { type: 'suins', subdomain, hostname: host }
}

/**
 * Convert SuiNS name to full domain
 */
export function toSuiNSName(subdomain: string): string {
	// Already has .sui suffix
	if (subdomain.endsWith('.sui')) {
		return subdomain
	}
	return `${subdomain}.sui`
}

/**
 * Build MVR name from components
 * Format: @suins_name/package_name or @suins_name/package_name/version
 */
export function toMVRName(suinsName: string, packageName: string, version?: number): string {
	const base = `@${suinsName}/${packageName}`
	return version ? `${base}/${version}` : base
}
