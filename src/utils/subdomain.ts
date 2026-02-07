import type { ParsedSubdomain } from '../types'

const DOMAIN = 'sui.ski'
const STAGING_DOMAIN = 'staging.sui.ski'

const NETWORK_PREFIXES: Record<string, 'testnet' | 'devnet'> = {
	t: 'testnet',
	d: 'devnet',
}

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
 * Network selectors (multi-level subdomain):
 * - {name}.t.sui.ski -> testnet resolution of {name}.sui
 * - {name}.d.sui.ski -> devnet resolution of {name}.sui
 * - t.sui.ski -> testnet landing page
 * - rpc.t.sui.ski -> testnet RPC proxy
 *
 * Standard patterns:
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
	const host = hostname.toLowerCase()

	const isStaging = host.endsWith(STAGING_DOMAIN)
	const baseDomain = isStaging ? STAGING_DOMAIN : DOMAIN

	let networkOverride: 'testnet' | 'devnet' | undefined
	let effectiveHost = host

	for (const [prefix, network] of Object.entries(NETWORK_PREFIXES)) {
		const prefixedDomain = `${prefix}.${baseDomain}`
		if (host === prefixedDomain || host === `www.${prefixedDomain}`) {
			return { type: 'root', subdomain: '', hostname: host, networkOverride: network }
		}
		if (host.endsWith(`.${prefixedDomain}`)) {
			networkOverride = network
			effectiveHost = host.replace(`.${prefixedDomain}`, `.${baseDomain}`)
			break
		}
	}

	if (effectiveHost === baseDomain || effectiveHost === `www.${baseDomain}`) {
		return { type: 'root', subdomain: '', hostname: host, networkOverride }
	}

	const subdomain = effectiveHost.replace(`.${baseDomain}`, '')

	if (subdomain === 'rpc') {
		return { type: 'rpc', subdomain, hostname: host, networkOverride }
	}

	if (subdomain === 'msg') {
		return { type: 'messaging', subdomain, hostname: host, networkOverride }
	}

	if (subdomain === 'app') {
		return { type: 'app', subdomain, hostname: host, networkOverride }
	}

	if (subdomain === 'my') {
		return { type: 'dashboard', subdomain, hostname: host, networkOverride }
	}

	if (subdomain.startsWith('ipfs-')) {
		return { type: 'content', subdomain, hostname: host, networkOverride }
	}

	if (subdomain.startsWith('walrus-')) {
		return { type: 'content', subdomain, hostname: host, networkOverride }
	}

	const mvrMatch = subdomain.match(MVR_PATTERN)
	if (mvrMatch) {
		return {
			type: 'mvr',
			subdomain,
			hostname: host,
			networkOverride,
			mvrInfo: {
				packageName: mvrMatch[1],
				suinsName: mvrMatch[2],
				version: mvrMatch[4] ? Number.parseInt(mvrMatch[4], 10) : undefined,
			},
		}
	}

	return { type: 'suins', subdomain, hostname: host, networkOverride }
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
