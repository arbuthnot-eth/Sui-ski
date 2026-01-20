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
	// Optional: Seal key server object IDs (comma-separated)
	SEAL_KEY_SERVERS?: string
	// Optional: Seal approval Move target (e.g., "0x...::messaging::seal_approve")
	SEAL_APPROVE_TARGET?: string
	// Optional: Walrus publisher URL for storing encrypted blobs
	WALRUS_PUBLISHER_URL?: string
	// Optional: Walrus aggregator URL for retrieving blobs
	WALRUS_AGGREGATOR_URL?: string
}

export type RouteType =
	| 'suins'
	| 'content'
	| 'rpc'
	| 'root'
	| 'mvr'
	| 'messaging'
	| 'app'
	| 'agents'

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
	/** Whether the name is confirmed available for registration (only true when we verified it's unregistered) */
	available?: boolean
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
export type ScheduledClaimStatus =
	| 'pending'
	| 'ready'
	| 'processing'
	| 'completed'
	| 'failed'
	| 'cancelled'

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

/**
 * Seal Policy Types
 * Based on Seal whitepaper: https://seal.mystenlabs.com
 *
 * Seal uses Identity-Based Encryption (IBE) with onchain access control.
 * The identity format is [PackageId]*[PolicyId] where the package defines
 * the seal_approve function that gates decryption access.
 */
export type SealPolicyType =
	| 'address' // Only specific address can decrypt
	| 'nft' // Current NFT holder can decrypt
	| 'allowlist' // Any address in allowlist can decrypt
	| 'threshold' // t-of-n signers required
	| 'time_locked' // Auto-unlocks at specified timestamp
	| 'subscription' // Valid subscription pass required

/** Seal encryption policy */
export interface SealPolicy {
	type: SealPolicyType
	/** Package ID containing seal_approve function */
	packageId: string
	/** Policy object ID on Sui (the identity suffix after *) */
	policyId: string
	/** Policy-specific parameters */
	params: SealPolicyParams
}

/** Policy-specific parameters */
export type SealPolicyParams =
	| { type: 'address'; address: string }
	| { type: 'nft'; nftType: string; objectId?: string }
	| { type: 'allowlist'; listId: string }
	| { type: 'threshold'; threshold: number; signers: string[] }
	| { type: 'time_locked'; unlockTimestamp: number }
	| { type: 'subscription'; subscriptionType: string }

/** Encrypted message envelope following Seal protocol */
export interface SealEncryptedEnvelope {
	/** Seal-encrypted ciphertext (base64) */
	ciphertext: string
	/** IBE identity used for encryption: [packageId]*[policyId] */
	identity: string
	/** Policy details for client-side verification */
	policy: SealPolicy
	/** Encryption version for forward compatibility */
	version: number
	/** Threshold for key server quorum (typically 2) */
	threshold: number
}

/** Message authentication data */
export interface MessageAuthentication {
	/** Ed25519 signature of the message hash */
	signature: string
	/** Public key that created the signature */
	publicKey: string
	/** Signed payload: hash(sender + recipient + timestamp + contentHash + nonce) */
	signedPayload: string
	/** Signature scheme used */
	scheme: 'ed25519' | 'secp256k1' | 'secp256r1'
}

/** Content integrity verification */
export interface ContentIntegrity {
	/** SHA-256 hash of plaintext content before encryption */
	contentHash: string
	/** Hash algorithm used */
	algorithm: 'sha256'
	/** Content size in bytes (for validation) */
	sizeBytes: number
}

/** Secure message structure aligned with Seal whitepaper */
export interface SecureMessage {
	/** Unique message ID (derived from content hash + timestamp + nonce) */
	id: string
	/** Seal-encrypted content envelope */
	envelope: SealEncryptedEnvelope
	/** Sender's Sui address */
	sender: string
	/** Sender's SuiNS name (optional) */
	senderName: string | null
	/** Recipient's Sui address */
	recipient: string
	/** Recipient's SuiNS name (optional) */
	recipientName: string | null
	/** Message timestamp (milliseconds since epoch) */
	timestamp: number
	/** Cryptographic nonce for replay protection */
	nonce: string
	/** Content integrity data */
	integrity: ContentIntegrity
	/** Message authentication */
	auth: MessageAuthentication
	/** Message type */
	messageType: 'direct' | 'channel' | 'broadcast'
	/** Optional reply reference */
	replyTo?: string
	/** Message metadata (not encrypted) */
	metadata?: {
		hasAttachments?: boolean
		attachmentCount?: number
		contentType?: 'text' | 'media' | 'file'
	}
}

/** Message stored in inbox (index entry) */
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
	/** Seal policy type used for encryption */
	policyType?: SealPolicyType
	/** Whether signature was verified server-side */
	signatureVerified?: boolean
	/** Content integrity hash for verification */
	contentHash?: string
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
	/** Encryption policy for this conversation */
	encryptionPolicy?: {
		type: SealPolicyType
		packageId: string
	}
}

/** User's read state across conversations */
export interface UserReadState {
	address: string
	conversations: Record<
		string,
		{
			lastReadTimestamp: number
		}
	>
	globalLastChecked: number
}

/** Message send request */
export interface MessageSendRequest {
	/** Seal-encrypted message envelope */
	envelope: SealEncryptedEnvelope
	/** Sender address */
	sender: string
	/** Sender SuiNS name */
	senderName?: string | null
	/** Recipient address */
	recipient: string
	/** Recipient SuiNS name */
	recipientName?: string | null
	/** Message authentication */
	auth: MessageAuthentication
	/** Content integrity */
	integrity: ContentIntegrity
	/** Timestamp */
	timestamp: number
	/** Nonce for replay protection */
	nonce: string
	/** Message type */
	messageType?: 'direct' | 'channel' | 'broadcast'
	/** Reply reference */
	replyTo?: string
}

/** Message send response */
export interface MessageSendResponse {
	success: boolean
	messageId: string
	blobId: string
	storage: 'walrus' | 'kv'
	conversationId: string
	signatureVerified: boolean
	timestamp: number
}
