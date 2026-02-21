import type { DurableObjectNamespace, KVNamespace } from '@cloudflare/workers-types'
import type { WalletSession } from './durable-objects/wallet-session'

export interface Env {
	SUI_NETWORK: 'mainnet' | 'testnet' | 'devnet'
	SUI_RPC_URL: string
	WALRUS_NETWORK: 'mainnet' | 'testnet'
	CACHE: KVNamespace
	WALLET_SESSIONS: DurableObjectNamespace<WalletSession>
	SKI_OPERATOR?: string
	SKI_FACILITATOR?: string
	MESSAGING_CONTRACT_ADDRESS?: string
	MOVE_REGISTRY_PARENT_ID?: string
	IKA_PACKAGE_ID?: string
	LLM_API_KEY?: string
	LLM_API_URL?: string
	AGENCY_REGISTRY_ID?: string
	SEAL_PACKAGE_ID?: string
	SEAL_KEY_SERVERS?: string
	SEAL_APPROVE_TARGET?: string
	SEAL_TESTNET_PACKAGE_ID?: string
	SEAL_TESTNET_KEY_SERVERS?: string
	SEAL_TESTNET_APPROVE_TARGET?: string
	STORM_PACKAGE_ID?: string
	STORM_REGISTRY_ID?: string
	NATSAI_SEAL_API_KEY?: string
	PROVIDER3_SEAL_API_KEY?: string
	WALRUS_PUBLISHER_URL?: string
	WALRUS_AGGREGATOR_URL?: string
	BOUNTY_ESCROW_MVR_ALIAS?: string
	BOUNTY_ESCROW_PACKAGE_ID?: string
	X402_VERIFIERS?: string
	X402_AGENT_FEE_MIST?: string
	COINBASE_X402_VERIFY_URL?: string
	COINBASE_X402_API_KEY?: string
	COINGECKO_API_KEY?: string
	SURFLUX_API_KEY?: string
	DECAY_AUCTION_PACKAGE_ID?: string
	BRAVE_SEARCH_API_KEY?: string
	OPENROUTER_API_KEY?: string
	INDEXER_API_KEY?: string
	SOL_SWAP_POOL_ID?: string
	SOL_SWAP_DWALLET_ID?: string
	SOL_SWAP_SOLANA_ADDRESS?: string
	USDY_COIN_TYPE?: string
	AGENT_PRIVATE_KEY?: string
	AGENT_ENCRYPTED_KEY_KV?: string
	X402_MULTICHAIN?: Fetcher
	X402_BASE_PAY_TO?: string
	X402_SOL_PAY_TO?: string
	X402_BTC_PAY_TO?: string
}

export type X402VerifierProvider = 'cloudflare' | 'coinbase' | 'multichain'

export interface X402VerifiedPayment {
	digest: string
	payer: string
	provider: X402VerifierProvider
}

export interface X402PaymentRequirements {
	scheme: 'exact-sui' | 'exact'
	network: string
	amount: string
	asset: string
	payTo: string
	maxTimeoutSeconds: number
	extra?: Record<string, unknown>
}

export interface X402PaymentRequired {
	x402Version: number
	resource: {
		url: string
		description: string
		mimeType: string
	}
	accepts: X402PaymentRequirements[]
}

export interface X402SuiPaymentPayload {
	x402Version: number
	accepted: X402PaymentRequirements
	payload: {
		digest: string
	}
}

export interface X402SettlementResponse {
	success: boolean
	transaction: string
	network: string
	payer: string
}

export type RouteType =
	| 'suins'
	| 'content'
	| 'rpc'
	| 'root'
	| 'mvr'
	| 'messaging'
	| 'app'
	| 'dashboard'

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
	/** Network override from subdomain prefix (e.g., "t.sui.ski" → testnet) */
	networkOverride?: 'testnet' | 'devnet'
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

export type ThunderPage = 'profile' | 'landing' | 'register'

export interface ThunderContext {
	page: ThunderPage
	name?: string
	address?: string
	expirationMs?: number
	linkedNames?: number
}

export interface ThunderTab {
	messages: number
	costMist: string
	settledMist: string
	lastActivity: number
	context: ThunderContext
}

export interface ThunderRequest {
	message: string
	context: ThunderContext
}

export interface ThunderResponse {
	reply: string
	suggestions?: string[]
	action?: 'dice' | 'lookup' | 'navigate'
	actionData?: Record<string, unknown>
	tab: {
		costMist: string
		thresholdMist: string
		settleRequired: boolean
	}
}

export interface ThunderDiceCommit {
	commitHash: string
	serverEntropy: string
	timestamp: number
}

export interface ThunderDiceReveal {
	result: number
	serverEntropy: string
	clientEntropy: string
	combined: string
}
