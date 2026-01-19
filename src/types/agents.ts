/**
 * Agent Framework Types
 * Defines agencies, members, permissions, and delegation capabilities
 * for the Signal-like communications platform with AI agent support.
 */

/**
 * Member types in an agency
 * - human: A wallet-connected user requiring manual action
 * - llm_agent: An AI agent that can act autonomously within limits
 * - backend_bot: A server-side automation (webhooks, cron jobs)
 */
export type MemberType = 'human' | 'llm_agent' | 'backend_bot'

/**
 * Role levels for agency members
 * - owner: Full control, can transfer ownership, manage all members
 * - admin: Can manage operators, update settings, moderate content
 * - operator: Can perform delegated actions within permission limits
 */
export type MemberRole = 'owner' | 'admin' | 'operator'

/**
 * Capability types that can be granted to members
 */
export type Capability =
	| 'send_messages'      // Can send messages on behalf of agency
	| 'read_messages'      // Can read agency messages
	| 'manage_channels'    // Can create/delete channels
	| 'invite_members'     // Can invite new members
	| 'remove_members'     // Can remove members (except owners)
	| 'update_metadata'    // Can update agency profile
	| 'manage_dwallet'     // Can manage IKA dWallet operations
	| 'sign_transactions'  // Can sign cross-chain transactions
	| 'broadcast_news'     // Can post to news channels
	| 'moderate_content'   // Can delete/hide content

/**
 * Permission level for dWallet operations
 * - view: Can view balances and transaction history
 * - propose: Can propose transactions (requires approval)
 * - execute: Can execute pre-approved transactions
 * - full: Full control (dangerous, should require 2PC-MPC for LLMs)
 */
export type DWalletPermission = 'view' | 'propose' | 'execute' | 'full'

/**
 * Agency member definition
 */
export interface AgencyMember {
	/** Member's Sui address */
	address: string
	/** Type of member */
	type: MemberType
	/** Role in the agency */
	role: MemberRole
	/** Granted capabilities */
	capabilities: Capability[]
	/** Optional human-readable name (SuiNS or display name) */
	displayName?: string
	/** For LLM agents: the model identifier */
	modelId?: string
	/** For LLM agents: system prompt/personality */
	systemPrompt?: string
	/** IKA delegation capability object ID */
	delegationCapId?: string
	/** dWallet permission level */
	dwalletPermission?: DWalletPermission
	/** When the member was added */
	addedAt: number
	/** Address of who added this member */
	addedBy: string
	/** Optional avatar URL */
	avatar?: string
}

/**
 * Permission matrix defining what actions require approval
 */
export interface PermissionMatrix {
	/** Actions that require owner approval */
	ownerRequired: Capability[]
	/** Actions that require admin approval */
	adminRequired: Capability[]
	/** Actions that LLM agents can do autonomously */
	llmAutonomous: Capability[]
	/** dWallet actions requiring 2PC-MPC (human + LLM) */
	twoPartyRequired: Capability[]
	/** Spending limits for autonomous actions (in MIST) */
	spendingLimits: {
		perTransaction: string
		perDay: string
		perMonth: string
	}
}

/**
 * Agency definition - a group that can include humans and AI agents
 */
export interface Agency {
	/** Unique agency ID (Sui object ID) */
	id: string
	/** Human-readable name */
	name: string
	/** Description */
	description?: string
	/** Avatar/logo URL */
	avatar?: string
	/** Agency members */
	members: AgencyMember[]
	/** IKA dWallet ID for cross-chain operations */
	dWalletId?: string
	/** Permission configuration */
	permissions: PermissionMatrix
	/** When the agency was created */
	createdAt: number
	/** Last update timestamp */
	updatedAt: number
	/** Owner's SuiNS name (if any) */
	ownerSuinsName?: string
	/** Associated channels */
	channelIds: string[]
	/** Associated news broadcast channels */
	newsChannelIds: string[]
	/** Whether the agency is publicly discoverable */
	isPublic: boolean
	/** Tags for discovery */
	tags: string[]
}

/**
 * Request to create a new agency
 */
export interface CreateAgencyRequest {
	name: string
	description?: string
	avatar?: string
	isPublic?: boolean
	tags?: string[]
	/** Initial permissions (uses defaults if not specified) */
	permissions?: Partial<PermissionMatrix>
}

/**
 * Request to add a member to an agency
 */
export interface AddMemberRequest {
	agencyId: string
	address: string
	type: MemberType
	role: MemberRole
	capabilities: Capability[]
	displayName?: string
	modelId?: string
	systemPrompt?: string
	dwalletPermission?: DWalletPermission
}

/**
 * Request to create delegation capability for IKA dWallet
 */
export interface CreateDelegationRequest {
	agencyId: string
	memberAddress: string
	/** Capabilities being delegated */
	capabilities: Capability[]
	/** Permission level for dWallet */
	dwalletPermission: DWalletPermission
	/** Expiration timestamp (optional) */
	expiresAt?: number
}

/**
 * Delegation capability object
 */
export interface DelegationCapability {
	id: string
	agencyId: string
	memberAddress: string
	capabilities: Capability[]
	dwalletPermission: DWalletPermission
	createdAt: number
	expiresAt?: number
	/** Whether this delegation has been revoked */
	revoked: boolean
}

/**
 * IKA dWallet info
 */
export interface DWalletInfo {
	/** dWallet object ID on Sui */
	id: string
	/** Associated agency ID */
	agencyId: string
	/** Bitcoin address (if created) */
	bitcoinAddress?: string
	/** Ethereum address (if created) */
	ethereumAddress?: string
	/** Solana address (if created) */
	solanaAddress?: string
	/** Other supported chain addresses */
	addresses: Record<string, string>
	/** Creation timestamp */
	createdAt: number
}

/**
 * Cross-chain transaction request
 */
export interface CrossChainTxRequest {
	dWalletId: string
	/** Target chain */
	chain: 'bitcoin' | 'ethereum' | 'solana' | string
	/** Transaction data (chain-specific) */
	txData: unknown
	/** Requesting member address */
	requestedBy: string
	/** Whether this requires 2PC-MPC approval */
	requires2PC: boolean
}

/**
 * Cross-chain transaction status
 */
export interface CrossChainTxStatus {
	id: string
	request: CrossChainTxRequest
	status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
	/** Approvals received (for 2PC-MPC) */
	approvals: Array<{
		address: string
		signature: string
		timestamp: number
	}>
	/** Required number of approvals */
	requiredApprovals: number
	/** Execution result */
	result?: {
		txHash?: string
		error?: string
	}
	createdAt: number
	updatedAt: number
}

/**
 * Default permission matrix
 */
export const DEFAULT_PERMISSIONS: PermissionMatrix = {
	ownerRequired: ['remove_members', 'manage_dwallet'],
	adminRequired: ['invite_members', 'manage_channels', 'moderate_content'],
	llmAutonomous: ['send_messages', 'read_messages'],
	twoPartyRequired: ['sign_transactions'],
	spendingLimits: {
		perTransaction: '1000000000', // 1 SUI
		perDay: '10000000000',        // 10 SUI
		perMonth: '100000000000',     // 100 SUI
	},
}

/**
 * News channel types
 */
export type NewsChannelType = 'broadcast' | 'announcement' | 'newsletter'

/**
 * News channel definition (Telegram-style broadcast)
 */
export interface NewsChannel {
	id: string
	name: string
	description?: string
	avatar?: string
	type: NewsChannelType
	/** Owner agency or address */
	ownerId: string
	/** Who can post */
	posterIds: string[]
	/** Subscriber count */
	subscriberCount: number
	/** Whether subscriptions are public */
	publicSubscribers: boolean
	/** Token/NFT requirements for subscription (optional) */
	tokenGate?: {
		type: 'token' | 'nft'
		contractAddress: string
		minBalance?: string
	}
	createdAt: number
	updatedAt: number
}

/**
 * News post
 */
export interface NewsPost {
	id: string
	channelId: string
	/** Poster address */
	poster: string
	/** Content (supports markdown) */
	content: string
	/** Attachments (Walrus blob IDs) */
	attachments: string[]
	/** Poll (optional) */
	poll?: {
		question: string
		options: string[]
		votes: Record<string, number>
		endsAt?: number
	}
	createdAt: number
	editedAt?: number
}

/**
 * Private subscription to a SuiNS name's feed
 * Subscriptions are stored locally and optionally on-chain for persistence
 */
export interface Subscription {
	/** Subscriber's address */
	subscriberAddress: string
	/** SuiNS name being subscribed to (without .sui) */
	targetName: string
	/** Target address */
	targetAddress: string
	/** When subscription was created */
	subscribedAt: number
	/** Whether to receive push notifications */
	notifications: boolean
	/** Privacy setting - subscriptions are private by default */
	isPrivate: boolean
	/** Optional nickname for the subscription */
	nickname?: string
	/** Last time the feed was checked */
	lastCheckedAt?: number
}

/**
 * Feed post from a subscribed SuiNS name
 */
export interface FeedPost {
	id: string
	/** Author's SuiNS name */
	authorName: string
	/** Author's address */
	authorAddress: string
	/** Post content */
	content: string
	/** Attachments (Walrus blob IDs) */
	attachments: string[]
	/** Created timestamp */
	createdAt: number
	/** Whether this is encrypted (for private posts) */
	encrypted: boolean
	/** Post type */
	type: 'text' | 'image' | 'poll' | 'announcement'
}

/**
 * Subscription settings
 */
export interface SubscriptionSettings {
	/** Default privacy for new subscriptions */
	defaultPrivate: boolean
	/** Enable push notifications */
	pushEnabled: boolean
	/** Sync subscriptions to chain (for cross-device) */
	syncToChain: boolean
}
