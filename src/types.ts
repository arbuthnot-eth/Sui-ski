import type { KVNamespace } from '@cloudflare/workers-types'

export interface Env {
	SUI_NETWORK: 'mainnet' | 'testnet' | 'devnet'
	SUI_RPC_URL: string
	WALRUS_NETWORK: 'mainnet' | 'testnet'
	CACHE: KVNamespace
	/** Optional bounty escrow Move package id for mainnet */
	BOUNTY_ESCROW_PACKAGE_MAINNET?: string
	/** Optional bounty escrow Move package id for testnet */
	BOUNTY_ESCROW_PACKAGE_TESTNET?: string
	/** Optional MVR alias for bounty escrow package (e.g., "sui.ski/bounty-escrow") */
	BOUNTY_ESCROW_MVR_ALIAS?: string
	// Messaging SDK contract addresses (testnet/mainnet)
	MESSAGING_CONTRACT_ADDRESS?: string
	MOVE_REGISTRY_PARENT_ID?: string
	// Vortex privacy protocol API URL
	VORTEX_API_URL?: string
	// gRPC backend proxy configuration
	GRPC_BACKEND_URL?: string
	GRPC_BACKEND_API_KEY?: string
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
	/** Target address (where the name resolves to) */
	address: string
	/** NFT owner address (who owns the SuiNS NFT) */
	ownerAddress?: string
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
	/** Whether the name has expired */
	expired?: boolean
	/** Whether the name is in the grace period (expired but not yet available for registration) */
	inGracePeriod?: boolean
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

/** Scheduled claim status */
export type ClaimStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled'

/** Scheduled claim for SuiNS name registration after grace period ends */
export interface ScheduledClaim {
	/** Unique identifier (format: "claim_{timestamp}_{random}") */
	id: string
	/** Name without .sui suffix */
	name: string
	/** Target address (resolved from alias.sui) */
	targetAddress: string
	/** Original name expiration timestamp in ms */
	expirationMs: number
	/** When name becomes available (expirationMs + 30 days) */
	availableAt: number
	/** When to attempt claim (availableAt + 60s buffer) */
	scheduledAt: number
	/** Transaction digest proving payment */
	paymentDigest: string
	/** Amount paid in MIST (stored as string for JSON serialization) */
	paymentAmount: string
	/** Address that paid for the claim */
	paidBy: string
	/** Registration duration in years */
	years: number
	/** Current status */
	status: ClaimStatus
	/** Number of execution attempts */
	attempts: number
	/** When this claim was created */
	createdAt: number
	/** Timestamp of last execution attempt */
	lastAttemptAt?: number
	/** Last error message */
	lastError?: string
	/** Transaction digest of successful registration */
	registrationTxDigest?: string
	/** Resulting NFT object ID */
	nftObjectId?: string
	/** Nautilus job ID for tracking */
	nautilusJobId?: string
}

/** Bounty status for name sniping */
export type BountyStatus = 'pending' | 'ready' | 'executing' | 'completed' | 'failed' | 'cancelled'

/** Bounty for sniping expired SuiNS names */
export interface Bounty {
	/** Unique identifier (format: "bounty_{timestamp}_{random}") */
	id: string
	/** Name without .sui suffix */
	name: string
	/** Address that will receive the registered name NFT */
	beneficiary: string
	/** Address that created the bounty */
	creator: string
	/** On-chain escrow object ID */
	escrowObjectId: string
	/** Total escrowed amount in MIST (stored as string for JSON) */
	totalAmountMist: string
	/** Executor reward in MIST (minimum 1 SUI) */
	executorRewardMist: string
	/** Estimated registration cost in MIST */
	registrationCostMist: string
	/** Payment currency preference */
	paymentCurrency: 'sui' | 'ns'
	/** When name becomes available (grace period end timestamp in ms) */
	availableAt: number
	/** Registration duration in years (1-5) */
	years: number
	/** Pre-signed transaction bytes (base64) */
	txBytes?: string
	/** Signatures for the transaction */
	signatures?: string[]
	/** Current status */
	status: BountyStatus
	/** When this bounty was created */
	createdAt: number
	/** Last status update timestamp */
	updatedAt: number
	/** Transaction digest of successful execution */
	resultDigest?: string
	/** Last error message */
	lastError?: string
	/** Number of execution attempts */
	attempts: number
}

/** Public bounty info (without sensitive tx data) */
export type PublicBounty = Omit<Bounty, 'txBytes' | 'signatures'> & {
	hasSignedTx: boolean
}
