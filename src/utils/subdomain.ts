import type { ParsedSubdomain } from '../types'

const DOMAIN = 'sui.ski'
const STAGING_DOMAIN = 'staging.sui.ski'

/**
 * Parse subdomain from hostname to determine routing type
 *
 * Patterns:
 * - sui.ski -> root landing page
 * - myname.sui.ski -> SuiNS name resolution
 * - rpc.sui.ski -> RPC proxy endpoint
 * - ipfs-{cid}.sui.ski -> Direct IPFS content
 * - walrus-{blobId}.sui.ski -> Direct Walrus content
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

