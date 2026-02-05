import type { ParsedSubdomain } from '../types'

const DOMAIN = 'sui.ski'
const STAGING_DOMAIN = 'staging.sui.ski'

/**
 * MVR package pattern: {pkg}--{suinsName} or {pkg}--{suinsName}--v{version}
 * Examples:
 * - private--iousd.sui.ski -> @iousd/private (latest)
 * - core--suifrens--v2.sui.ski -> @suifrens/core (version 2)
 */
const MVR_PATTERN = /^([a-z0-9-]+)--([a-z0-9-]+)(--v(\d+))?$/

/**
 * Parse subdomain from hostname to determine routing type
 *
 * Patterns:
 * - sui.ski -> root landing page
 * - myname.sui.ski -> SuiNS name resolution
 * - rpc.sui.ski -> RPC proxy endpoint
 * - app.sui.ski -> PWA app (chat, channels, news, agents)
 * - ipfs-{cid}.sui.ski -> Direct IPFS content
 * - walrus-{blobId}.sui.ski -> Direct Walrus content
 * - {pkg}--{name}.sui.ski -> MVR package resolution
 * - {pkg}--{name}--v{n}.sui.ski -> MVR package with version
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

	// Messaging subdomain (msg.sui.ski)
	if (subdomain === 'msg') {
		return { type: 'messaging', subdomain, hostname: host }
	}

	// App subdomain (app.sui.ski) - PWA for chat, channels, news, agents
	if (subdomain === 'app') {
		return { type: 'app', subdomain, hostname: host }
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

	// MVR package pattern: {pkg}--{name} or {pkg}--{name}--v{n}
	const mvrMatch = subdomain.match(MVR_PATTERN)
	if (mvrMatch) {
		return {
			type: 'mvr',
			subdomain,
			hostname: host,
			mvrInfo: {
				packageName: mvrMatch[1],
				suinsName: mvrMatch[2],
				version: mvrMatch[4] ? Number.parseInt(mvrMatch[4], 10) : undefined,
			},
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
