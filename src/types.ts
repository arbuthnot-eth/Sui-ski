import type { KVNamespace } from '@cloudflare/workers-types'

export interface Env {
	SUI_NETWORK: 'mainnet' | 'testnet' | 'devnet'
	SUI_RPC_URL: string
	WALRUS_NETWORK: 'mainnet' | 'testnet'
	CACHE: KVNamespace
	TRADEPORT_API_KEY?: string
	TRADEPORT_USER?: string
	TRADEPORT_API_URL?: string
}

export type RouteType = 'suins' | 'mvr' | 'content' | 'rpc' | 'root' | 'play'

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
	walrusSiteId?: string
	nftId?: string
	expirationTimestampMs?: string
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
	/** Whether the name has expired (available for re-registration) */
	expired?: boolean
}

/** Standard gateway error response */
export interface GatewayError {
	error: string
	code: string
	details?: unknown
}

/** Media playlist item */
export interface PlaylistItem {
	blobId: string
	title: string
	artist?: string
	duration?: number
	thumbnail?: string
}

/** Media playlist stored on Walrus */
export interface Playlist {
	title: string
	items: PlaylistItem[]
	description?: string
	author?: string
}

/** Content manifest item (stored in manifest JSON on Walrus) */
export interface ManifestItem {
	blobId: string
	type: string
	name: string
	size?: number
	uploadedAt?: string
	title?: string
	artist?: string
}

/** Content manifest stored on Walrus (hybrid approach: avatar in SuiNS, rest in manifest) */
export interface ContentManifest {
	version: 1
	media?: ManifestItem
	files: ManifestItem[]
}
