import type { KVNamespace } from '@cloudflare/workers-types'

export interface Env {
	SUI_NETWORK: 'mainnet' | 'testnet' | 'devnet'
	SUI_RPC_URL: string
	WALRUS_NETWORK: 'mainnet' | 'testnet'
	CACHE: KVNamespace
	// Optional: Messaging contract address
	MESSAGING_CONTRACT_ADDRESS?: string
	// Optional: Bounty escrow package addresses
	BOUNTY_ESCROW_PACKAGE_MAINNET?: string
	BOUNTY_ESCROW_PACKAGE_TESTNET?: string
	BOUNTY_ESCROW_MVR_ALIAS?: string
	// Optional: Move Registry parent ID
	MOVE_REGISTRY_PARENT_ID?: string
	// Optional: IKA dWallet package ID for cross-chain control
	IKA_PACKAGE_ID?: string
	// Optional: LLM API key for AI copilot features
	LLM_API_KEY?: string
	// Optional: LLM API endpoint (defaults to Anthropic)
	LLM_API_URL?: string
	// Optional: Agency registry object ID
	AGENCY_REGISTRY_ID?: string
	// Optional: Seal package ID for encrypted subscriptions
	SEAL_PACKAGE_ID?: string
	// Optional: Walrus publisher URL for storing encrypted blobs
	WALRUS_PUBLISHER_URL?: string
	// Optional: Walrus aggregator URL for retrieving blobs
	WALRUS_AGGREGATOR_URL?: string
}

export type RouteType = 'suins' | 'content' | 'rpc' | 'root' | 'mvr' | 'messaging' | 'app' | 'agents'

export interface MVRInfo {
	/** Package name (e.g., "private" from "private--iousd.sui.ski") */
	packageName: string
	/** SuiNS name (e.g., "iousd" from "private--iousd.sui.ski") */
	suinsName: string
	/** Optional version number (e.g., 2 from "private--iousd--v2.sui.ski") */
	version?: number
}

export interface ParsedSubdomain {
	type: RouteType
	/** The full subdomain (e.g., "myname" from "myname.sui.ski") */
	subdomain: string
	/** Original hostname */
	hostname: string
	/** MVR package info (only present when type === 'mvr') */
	mvrInfo?: MVRInfo
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

export interface ResolverResult {
	found: boolean
	data?: SuiNSRecord | Response | MVRPackageInfo
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

/** Bounty status */
export type BountyStatus = 'pending' | 'ready' | 'executing' | 'completed' | 'failed' | 'cancelled'

/** Bounty for SuiNS name registration */
export interface Bounty {
	id: string
	name: string
	beneficiary: string
	creator: string
	escrowObjectId: string
	totalAmountMist: string
	executorRewardMist: string
	registrationCostMist: string
	paymentCurrency: 'sui' | 'ns'
	availableAt: number
	years: number
	status: BountyStatus
	createdAt: number
	updatedAt: number
	attempts: number
	txBytes?: string
	signatures?: string[]
	resultDigest?: string
	lastError?: string
	/** Type of bounty: 'standard' (creator pays all) or 'gift' (creator pays reward only) */
	type?: 'standard' | 'gift'
}

/** Public bounty data (without sensitive tx data) */
export interface PublicBounty extends Omit<Bounty, 'txBytes' | 'signatures'> {
	hasSignedTx: boolean
}

/** Scheduled claim status */
export type ScheduledClaimStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'failed' | 'cancelled'

/** Scheduled claim for SuiNS name */
export interface ScheduledClaim {
	id: string
	name: string
	targetAddress: string
	expirationMs: number
	availableAt: number
	scheduledAt: number
	paymentDigest: string
	paymentAmount: string
	paidBy: string
	years: number
	status: ScheduledClaimStatus
	attempts: number
	createdAt: number
	resultDigest?: string
	lastError?: string
	registrationTxDigest?: string
	nftObjectId?: string
	lastAttemptAt?: number
}

/** MVR Package Info */
export interface MVRPackageInfo {
	name: string
	suinsName: string
	packageName: string
	address: string
	version?: number
	metadata?: {
		name?: string
		description?: string
		repository?: string
		documentation?: string
		license?: string
		homepage?: string
		iconUrl?: string
	}
}

/** Message stored in inbox */
export interface StoredMessage {
	id: string
	blobId: string
	storage: 'walrus' | 'kv'
	sender: string
	senderName: string | null
	recipient: string
	recipientName: string | null
	timestamp: number
	signed: boolean
	conversationId?: string
}

/** Conversation between two participants */
export interface Conversation {
	id: string
	participants: [string, string]
	participantNames: Record<string, string | null>
	lastMessage: {
		preview: string
		timestamp: number
		sender: string
		senderName: string | null
	}
	unreadCount: number
	createdAt: number
	updatedAt: number
}

/** User's read state across conversations */
export interface UserReadState {
	address: string
	conversations: Record<string, {
		lastReadTimestamp: number
	}>
	globalLastChecked: number
}
