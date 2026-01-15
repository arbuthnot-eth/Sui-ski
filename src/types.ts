import type { KVNamespace } from '@cloudflare/workers-types'

export interface Env {
	SUI_NETWORK: 'mainnet' | 'testnet' | 'devnet'
	SUI_RPC_URL: string
	WALRUS_NETWORK: 'mainnet' | 'testnet'
	CACHE: KVNamespace
}

export type RouteType = 'suins' | 'mvr' | 'content' | 'rpc' | 'root'

export interface ParsedSubdomain {
	type: RouteType
	/** The full subdomain (e.g., "myname" from "myname.sui.ski") */
	subdomain: string
	/** For MVR: package name after the SuiNS name (e.g., "pkg" from "pkg--myname.sui.ski") */
	packageName?: string
	/** For MVR: version specifier */
	version?: number
	/** Original hostname */
	hostname: string
}

export interface SuiNSRecord {
	address: string
	avatar?: string
	contentHash?: string
	/** IPFS CID or Walrus blob ID */
	content?: {
		type: 'ipfs' | 'walrus' | 'url'
		value: string
	}
	/** Additional text records */
	records: Record<string, string>
}

export interface MVRPackage {
	name: string
	address: string
	version: number
	metadata?: {
		description?: string
		repository?: string
		documentation?: string
	}
}

export interface ResolverResult {
	found: boolean
	data?: SuiNSRecord | MVRPackage | Response
	error?: string
	/** Cache TTL in seconds */
	cacheTtl?: number
}

/** Standard gateway error response */
export interface GatewayError {
	error: string
	code: string
	details?: unknown
}
