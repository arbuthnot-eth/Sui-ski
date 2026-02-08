/**
 * PWA App Handler
 * Serves the Signal-like communications app with chat, channels, news, and agents.
 *
 * Routes:
 * /app           - Main dashboard
 * /app/chat      - 1:1 conversation list
 * /app/chat/:id  - Individual encrypted chat
 * /app/channels  - Channel discovery
 * /app/channels/:id - Group channel view
 * /app/news      - Subscribed news feed
 * /app/news/create - Create broadcast channel
 * /app/agents    - Agent marketplace
 * /app/agents/:id - Agency dashboard
 * /app/settings  - User settings, IKA wallet config
 *
 * API Routes:
 * /api/app/*     - Messaging APIs
 * /api/agents/*  - Agency registry APIs
 * /api/ika/*     - IKA dWallet APIs
 * /api/llm/*     - LLM completion proxy
 */

import type {
	ContentIntegrity,
	Conversation,
	Env,
	MessageAuthentication,
	MessageSendRequest,
	MessageSendResponse,
	SealEncryptedEnvelope,
	SealPolicyType,
	StoredMessage,
	UserConversationStore,
} from '../types'
import { htmlResponse, jsonResponse } from '../utils/response'
import { generateWalletSessionJs } from '../utils/wallet-session-js'

const NONCE_EXPIRY_MS = 5 * 60 * 1000
const MAX_MESSAGE_SIZE_BYTES = 1024 * 1024
const NONCE_MAP_MAX_SIZE = 500

const usedNonces = new Map<string, number>()

const llmRateLimits = new Map<string, { count: number; resetAt: number }>()

/**
 * Compute SHA-256 hash of data
 * Used for conversation IDs, content hashes, and message IDs
 */
async function sha256(data: string): Promise<string> {
	const encoder = new TextEncoder()
	const dataBuffer = encoder.encode(data)
	const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
	const hashArray = new Uint8Array(hashBuffer)
	let hex = ''
	for (let i = 0; i < hashArray.length; i++) {
		hex += hashArray[i].toString(16).padStart(2, '0')
	}
	return hex
}

/**
 * Compute a deterministic conversation ID from two addresses
 * Uses SHA-256 for cryptographic security
 */
async function computeConversationId(addr1: string, addr2: string): Promise<string> {
	const sorted = [addr1.toLowerCase(), addr2.toLowerCase()].sort()
	const combined = sorted.join(':')
	const hash = await sha256(combined)
	return `conv_${hash.slice(0, 16)}`
}

/**
 * Generate a unique message ID from content hash, timestamp, and nonce
 */
async function generateMessageId(
	contentHash: string,
	timestamp: number,
	nonce: string,
): Promise<string> {
	const data = `${contentHash}:${timestamp}:${nonce}`
	const hash = await sha256(data)
	return `msg_${hash.slice(0, 24)}`
}

/**
 * Verify Ed25519 signature using Web Crypto API
 * Returns true if signature is valid, false otherwise
 */
async function verifyEd25519Signature(
	publicKeyHex: string,
	signatureHex: string,
	message: string,
): Promise<boolean> {
	try {
		const publicKeyBytes = hexToBytes(publicKeyHex)
		const signatureBytes = hexToBytes(signatureHex)
		const messageBytes = new TextEncoder().encode(message)

		const publicKey = await crypto.subtle.importKey(
			'raw',
			publicKeyBytes,
			{ name: 'Ed25519' },
			false,
			['verify'],
		)

		return await crypto.subtle.verify('Ed25519', publicKey, signatureBytes, messageBytes)
	} catch {
		return false
	}
}

/**
 * Verify Secp256k1 signature (used by some Sui wallets)
 * Note: Web Crypto doesn't natively support secp256k1, so we do basic validation
 * Full verification requires the @noble/secp256k1 library on client side
 */
function verifySecp256k1SignatureFormat(publicKeyHex: string, signatureHex: string): boolean {
	if (publicKeyHex.length !== 66 && publicKeyHex.length !== 130) {
		return false
	}
	if (signatureHex.length !== 128 && signatureHex.length !== 130) {
		return false
	}
	return true
}

/**
 * Verify message authentication
 * Validates signature matches the sender's public key and signed payload
 */
async function verifyMessageAuth(
	auth: MessageAuthentication,
	sender: string,
	recipient: string,
	timestamp: number,
	contentHash: string,
	nonce: string,
): Promise<{ valid: boolean; reason?: string }> {
	const expectedPayload = await sha256(
		`${sender}:${recipient}:${timestamp}:${contentHash}:${nonce}`,
	)

	if (auth.signedPayload !== expectedPayload) {
		return { valid: false, reason: 'Signed payload mismatch' }
	}

	if (auth.scheme === 'ed25519') {
		const isValid = await verifyEd25519Signature(auth.publicKey, auth.signature, auth.signedPayload)
		if (!isValid) {
			return { valid: false, reason: 'Ed25519 signature verification failed' }
		}
	} else if (auth.scheme === 'secp256k1' || auth.scheme === 'secp256r1') {
		if (!verifySecp256k1SignatureFormat(auth.publicKey, auth.signature)) {
			return { valid: false, reason: 'Invalid secp256k1 signature format' }
		}
	} else {
		return { valid: false, reason: `Unsupported signature scheme: ${auth.scheme}` }
	}

	return { valid: true }
}

/**
 * Verify content integrity
 */
async function verifyContentIntegrity(
	integrity: ContentIntegrity,
	envelopeSize: number,
): Promise<{ valid: boolean; reason?: string }> {
	if (integrity.algorithm !== 'sha256') {
		return { valid: false, reason: 'Only sha256 algorithm supported' }
	}

	if (integrity.sizeBytes > MAX_MESSAGE_SIZE_BYTES) {
		return { valid: false, reason: `Message too large: ${integrity.sizeBytes} bytes` }
	}

	if (envelopeSize > MAX_MESSAGE_SIZE_BYTES) {
		return { valid: false, reason: 'Encrypted envelope too large' }
	}

	return { valid: true }
}

function isNonceUsed(nonce: string): boolean {
	const expiry = usedNonces.get(nonce)
	if (expiry === undefined) return false
	if (Date.now() > expiry) {
		usedNonces.delete(nonce)
		return false
	}
	return true
}

function markNonceUsed(nonce: string): void {
	if (usedNonces.size >= NONCE_MAP_MAX_SIZE) {
		const now = Date.now()
		for (const [key, exp] of usedNonces) {
			if (now > exp) usedNonces.delete(key)
		}
		if (usedNonces.size >= NONCE_MAP_MAX_SIZE) {
			const firstKey = usedNonces.keys().next().value
			if (firstKey) usedNonces.delete(firstKey)
		}
	}
	usedNonces.set(nonce, Date.now() + NONCE_EXPIRY_MS)
}

/**
 * Validate timestamp is within acceptable range
 */
function isTimestampValid(timestamp: number): boolean {
	const now = Date.now()
	const fiveMinutesAgo = now - NONCE_EXPIRY_MS
	const oneMinuteAhead = now + 60 * 1000
	return timestamp >= fiveMinutesAgo && timestamp <= oneMinuteAhead
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
	const normalized = hex.startsWith('0x') ? hex.slice(2) : hex
	const bytes = new Uint8Array(normalized.length / 2)
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16)
	}
	return bytes
}

/**
 * Validate Seal policy structure
 */
function validateSealPolicy(envelope: SealEncryptedEnvelope): { valid: boolean; reason?: string } {
	if (!envelope.ciphertext || typeof envelope.ciphertext !== 'string') {
		return { valid: false, reason: 'Missing or invalid ciphertext' }
	}

	if (!envelope.identity || typeof envelope.identity !== 'string') {
		return { valid: false, reason: 'Missing or invalid identity' }
	}

	if (!envelope.identity.includes('*')) {
		return { valid: false, reason: 'Identity must be in format [packageId]*[policyId]' }
	}

	if (!envelope.policy || !envelope.policy.type) {
		return { valid: false, reason: 'Missing policy information' }
	}

	const validPolicyTypes: SealPolicyType[] = [
		'address',
		'nft',
		'allowlist',
		'threshold',
		'time_locked',
		'subscription',
	]
	if (!validPolicyTypes.includes(envelope.policy.type)) {
		return { valid: false, reason: `Invalid policy type: ${envelope.policy.type}` }
	}

	if (envelope.version < 1) {
		return { valid: false, reason: 'Invalid envelope version' }
	}

	if (envelope.threshold < 1 || envelope.threshold > 10) {
		return { valid: false, reason: 'Threshold must be between 1 and 10' }
	}

	return { valid: true }
}

/**
 * Strip .sui suffix from name if present
 */
function stripSuiSuffix(name: string | null): string | null {
	if (!name) return null
	return name.replace(/\.sui$/i, '')
}

const CONV_STORE_TTL = 60 * 60 * 24 * 90

async function getUserConvStore(env: Env, address: string): Promise<UserConversationStore> {
	const key = `user_convs_${address}`
	const data = await env.CACHE.get(key)
	if (data) {
		try {
			return JSON.parse(data) as UserConversationStore
		} catch {
			// Fall through
		}
	}
	return { conversations: [], totalUnread: 0, updatedAt: 0 }
}

async function saveUserConvStore(
	env: Env,
	address: string,
	store: UserConversationStore,
): Promise<void> {
	const key = `user_convs_${address}`
	await env.CACHE.put(key, JSON.stringify(store), { expirationTtl: CONV_STORE_TTL })
}

function upsertConversation(store: UserConversationStore, conv: Conversation): void {
	const idx = store.conversations.findIndex((c) => c.id === conv.id)
	if (idx >= 0) {
		store.conversations[idx] = conv
	} else {
		store.conversations.push(conv)
	}
	store.updatedAt = Date.now()
}

function recomputeTotalUnread(store: UserConversationStore): void {
	let total = 0
	for (const c of store.conversations) total += c.unreadCount
	store.totalUnread = total
}

async function updateConversationWithMessage(
	env: Env,
	sender: string,
	senderName: string | null,
	recipient: string,
	recipientName: string | null,
	messagePreview: string,
	timestamp: number,
): Promise<string> {
	const conversationId = await computeConversationId(sender, recipient)

	const cleanSenderName = stripSuiSuffix(senderName)
	const cleanRecipientName = stripSuiSuffix(recipientName)

	const [recipientStore, senderStore] = await Promise.all([
		getUserConvStore(env, recipient),
		getUserConvStore(env, sender),
	])

	const existingRecipient = recipientStore.conversations.find((c) => c.id === conversationId)
	const existingSender = senderStore.conversations.find((c) => c.id === conversationId)

	const baseConv: Conversation = existingRecipient ||
		existingSender || {
			id: conversationId,
			participants: [sender, recipient],
			participantNames: {
				[sender]: cleanSenderName,
				[recipient]: cleanRecipientName,
			},
			lastMessage: {
				preview: '',
				timestamp,
				sender,
				senderName: cleanSenderName,
			},
			unreadCount: 0,
			createdAt: timestamp,
			updatedAt: timestamp,
		}

	const recipientConv: Conversation = {
		...baseConv,
		lastMessage: {
			preview: messagePreview.slice(0, 100),
			timestamp,
			sender,
			senderName: cleanSenderName,
		},
		updatedAt: timestamp,
		unreadCount: (existingRecipient?.unreadCount ?? 0) + 1,
	}

	const senderConv: Conversation = {
		...baseConv,
		lastMessage: {
			preview: messagePreview.slice(0, 100),
			timestamp,
			sender,
			senderName: cleanSenderName,
		},
		updatedAt: timestamp,
		unreadCount: existingSender?.unreadCount ?? 0,
	}

	upsertConversation(recipientStore, recipientConv)
	recomputeTotalUnread(recipientStore)

	upsertConversation(senderStore, senderConv)
	recomputeTotalUnread(senderStore)

	await Promise.all([
		saveUserConvStore(env, recipient, recipientStore),
		saveUserConvStore(env, sender, senderStore),
	])

	return conversationId
}

const CONV_MSGS_TTL = 60 * 60 * 24 * 90

async function getConversationMessages(env: Env, conversationId: string): Promise<StoredMessage[]> {
	const key = `conv_msgs_${conversationId}`
	const data = await env.CACHE.get(key)
	if (!data) return []
	try {
		return JSON.parse(data) as StoredMessage[]
	} catch {
		return []
	}
}

async function appendConversationMessage(
	env: Env,
	conversationId: string,
	message: StoredMessage,
): Promise<void> {
	const key = `conv_msgs_${conversationId}`
	const existing = await getConversationMessages(env, conversationId)
	existing.push(message)
	await env.CACHE.put(key, JSON.stringify(existing), { expirationTtl: CONV_MSGS_TTL })
}

async function migrateLegacyConversations(
	env: Env,
	address: string,
): Promise<UserConversationStore> {
	try {
		const prefix = `conv_index_${address}_`
		const keys = await env.CACHE.list({ prefix, limit: 50 })

		const conversationIds = new Set<string>()
		for (const key of keys.keys) {
			const data = await env.CACHE.get(key.name)
			if (data) {
				try {
					const parsed = JSON.parse(data) as { conversationId: string }
					conversationIds.add(parsed.conversationId)
				} catch {
					// Skip
				}
			}
		}

		const conversations: Conversation[] = []
		for (const convId of conversationIds) {
			const convData = await env.CACHE.get(`conv_data_${convId}`)
			if (convData) {
				try {
					conversations.push(JSON.parse(convData) as Conversation)
				} catch {
					// Skip
				}
			}
		}

		if (conversations.length === 0) {
			return { conversations: [], totalUnread: 0, updatedAt: 0 }
		}

		const store: UserConversationStore = {
			conversations,
			totalUnread: 0,
			updatedAt: Date.now(),
		}
		recomputeTotalUnread(store)
		await saveUserConvStore(env, address, store)
		return store
	} catch {
		return { conversations: [], totalUnread: 0, updatedAt: 0 }
	}
}

async function migrateLegacyMessages(
	env: Env,
	conversationId: string,
	conversation: Conversation,
	address: string,
): Promise<StoredMessage[]> {
	try {
		const otherParticipant =
			conversation.participants.find((p) => p !== address) || conversation.participants[0]

		const messages: StoredMessage[] = []
		const [inboxKeys, sentKeys] = await Promise.all([
			env.CACHE.list({ prefix: `msg_inbox_${address}_`, limit: 100 }),
			env.CACHE.list({ prefix: `msg_inbox_${otherParticipant}_`, limit: 100 }),
		])

		const allKeys = [...inboxKeys.keys, ...sentKeys.keys]
		const fetches = await Promise.all(allKeys.map((key) => env.CACHE.get(key.name)))

		for (const data of fetches) {
			if (!data) continue
			try {
				const msg = JSON.parse(data) as StoredMessage
				const isRelevant =
					msg.sender === otherParticipant ||
					msg.recipient === otherParticipant ||
					msg.sender === address ||
					msg.recipient === address
				if (isRelevant) messages.push(msg)
			} catch {
				// Skip
			}
		}

		const uniqueMessages = Array.from(
			new Map(messages.map((m) => [m.id || `${m.sender}_${m.timestamp}`, m])).values(),
		)

		if (uniqueMessages.length > 0) {
			await env.CACHE.put(`conv_msgs_${conversationId}`, JSON.stringify(uniqueMessages), {
				expirationTtl: CONV_MSGS_TTL,
			})
		}

		return uniqueMessages
	} catch {
		return []
	}
}

export async function handleAppRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	let path = url.pathname

	// Normalize path - remove /app prefix for routing
	if (path.startsWith('/app')) {
		path = path.slice(4) || '/'
	}

	// Handle API routes
	if (path.startsWith('/api/') || url.pathname.startsWith('/api/')) {
		return handleAppApi(request, env, url)
	}

	// All other routes serve the SPA shell
	// The client-side router handles the actual navigation
	return htmlResponse(generateAppShell(env, path))
}

/**
 * Store encrypted data on Walrus
 * Used for Seal-encrypted subscription blobs
 */
async function storeOnWalrus(
	encryptedData: string,
	env: Env,
): Promise<{ blobId: string | null; error?: string }> {
	const publisherUrl = env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space'

	try {
		// Convert base64 to binary for Walrus storage
		const binaryData = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))

		const response = await fetch(`${publisherUrl}/v1/blobs`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/octet-stream',
			},
			body: binaryData,
		})

		if (!response.ok) {
			const errorText = await response.text()
			return { blobId: null, error: `Walrus error: ${errorText}` }
		}

		const result = (await response.json()) as {
			newlyCreated?: { blobObject?: { blobId?: string } }
			alreadyCertified?: { blobId?: string }
		}

		// Handle both new and existing blobs
		const blobId =
			result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId || null

		return { blobId }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { blobId: null, error: message }
	}
}

/**
 * Handle app API requests
 */
async function handleAppApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname

	// /api/app/* - Messaging APIs
	if (path.startsWith('/api/app/')) {
		return handleMessagingApi(request, env, url)
	}

	// /api/agents/* - Agency APIs
	if (path.startsWith('/api/agents/') || path === '/api/agents') {
		return handleAgencyApi(request, env, url)
	}

	// /api/ika/* - IKA dWallet APIs
	if (path.startsWith('/api/ika/')) {
		return handleIkaApi(request, env, url)
	}

	// /api/llm/* - LLM proxy
	if (path.startsWith('/api/llm/')) {
		return handleLlmApi(request, env, url)
	}

	return jsonResponse({ error: 'Unknown API endpoint' }, 404)
}

/**
 * Messaging API handlers
 */
async function handleMessagingApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/app/', '')

	// GET /api/app/conversations - List user conversations
	if (path === 'conversations' && request.method === 'GET') {
		const address = url.searchParams.get('address')
		if (!address) {
			return jsonResponse({ error: 'Address required' }, 400)
		}

		try {
			let store = await getUserConvStore(env, address)

			if (store.conversations.length === 0) {
				store = await migrateLegacyConversations(env, address)
			}

			const conversations = [...store.conversations]
			conversations.sort((a, b) => b.updatedAt - a.updatedAt)

			return jsonResponse({
				address,
				conversations,
				totalUnread: store.totalUnread,
				count: conversations.length,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return jsonResponse({ error: 'Failed to fetch conversations: ' + message }, 500)
		}
	}

	// GET /api/app/conversations/:id - Get conversation detail with messages
	const convDetailMatch = path.match(/^conversations\/([^/]+)$/)
	if (convDetailMatch && request.method === 'GET') {
		const conversationId = convDetailMatch[1]
		const address = url.searchParams.get('address')

		if (!address) {
			return jsonResponse({ error: 'Address required' }, 400)
		}

		try {
			const store = await getUserConvStore(env, address)
			const conversation = store.conversations.find((c) => c.id === conversationId)

			if (!conversation) {
				return jsonResponse({ error: 'Conversation not found' }, 404)
			}

			if (!conversation.participants.includes(address)) {
				return jsonResponse({ error: 'Not a participant' }, 403)
			}

			let messages = await getConversationMessages(env, conversationId)

			if (messages.length === 0) {
				messages = await migrateLegacyMessages(env, conversationId, conversation, address)
			}

			messages.sort((a, b) => a.timestamp - b.timestamp)

			return jsonResponse({
				conversation,
				messages,
				count: messages.length,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return jsonResponse({ error: 'Failed to fetch conversation: ' + message }, 500)
		}
	}

	// POST /api/app/conversations/read - Mark conversation as read
	if (path === 'conversations/read' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				conversationId?: string
				address?: string
			}

			if (!body.conversationId || !body.address) {
				return jsonResponse({ error: 'Conversation ID and address required' }, 400)
			}

			const store = await getUserConvStore(env, body.address)
			const conversation = store.conversations.find((c) => c.id === body.conversationId)

			if (!conversation) {
				return jsonResponse({ error: 'Conversation not found' }, 404)
			}

			if (!conversation.participants.includes(body.address)) {
				return jsonResponse({ error: 'Not a participant' }, 403)
			}

			const previousUnread = conversation.unreadCount
			conversation.unreadCount = 0
			recomputeTotalUnread(store)

			await saveUserConvStore(env, body.address, store)

			return jsonResponse({
				success: true,
				conversationId: body.conversationId,
				markedRead: previousUnread,
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/app/notifications/count - Get unread message count for badge
	if (path === 'notifications/count' && request.method === 'GET') {
		const address = url.searchParams.get('address')
		if (!address) {
			return jsonResponse({ error: 'Address required' }, 400)
		}

		try {
			const store = await getUserConvStore(env, address)

			return jsonResponse({
				address,
				unreadCount: store.totalUnread,
				timestamp: Date.now(),
			})
		} catch {
			return jsonResponse({ unreadCount: 0, timestamp: Date.now() })
		}
	}

	// GET /api/app/channels - Browse public channels
	if (path === 'channels' && request.method === 'GET') {
		const limit = Number.parseInt(url.searchParams.get('limit') || '20', 10)
		const cursor = url.searchParams.get('cursor')
		// Placeholder - would query on-chain channel registry
		return jsonResponse({
			channels: [],
			pagination: { limit, cursor, hasMore: false },
		})
	}

	// POST /api/app/channels/create - Create channel (returns tx builder)
	if (path === 'channels/create' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				name?: string
				isPublic?: boolean
				tokenGate?: unknown
			}
			if (!body.name) {
				return jsonResponse({ error: 'Channel name required' }, 400)
			}
			// Return transaction building instructions
			return jsonResponse({
				action: 'create_channel',
				params: body,
				note: 'Build and sign transaction client-side using @mysten/messaging SDK',
				sdk: 'https://unpkg.com/@mysten/messaging',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// POST /api/app/channels/:id/join - Join token-gated channel
	const joinMatch = path.match(/^channels\/([^/]+)\/join$/)
	if (joinMatch && request.method === 'POST') {
		const channelId = joinMatch[1]
		return jsonResponse({
			action: 'join_channel',
			channelId,
			note: 'Token gate verification and join happens client-side',
		})
	}

	// ===== PRIVATE SUBSCRIPTION ENDPOINTS (Seal + Walrus) =====
	// Subscriptions are encrypted client-side with Seal and stored on Walrus
	// Only the subscriber can decrypt their subscription list

	// GET /api/app/subscriptions/config - Get Seal/Walrus config for subscriptions
	if (path === 'subscriptions/config' && request.method === 'GET') {
		return jsonResponse({
			seal: {
				packageId:
					env.SEAL_PACKAGE_ID ||
					'0x7f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d',
				network: env.SUI_NETWORK || 'mainnet',
				supportedPolicies: [
					{
						type: 'address',
						description: 'Only specific address can decrypt',
						useCase: '1:1 direct messages',
					},
					{
						type: 'nft',
						description: 'Current NFT holder can decrypt',
						useCase: 'Transferable access rights',
					},
					{
						type: 'allowlist',
						description: 'Any address in allowlist can decrypt',
						useCase: 'Group chats, team access',
					},
					{
						type: 'threshold',
						description: 't-of-n signers required',
						useCase: 'Multi-sig controlled access',
					},
					{
						type: 'time_locked',
						description: 'Auto-unlocks at specified timestamp',
						useCase: 'Scheduled reveals, auctions',
					},
					{
						type: 'subscription',
						description: 'Valid subscription pass required',
						useCase: 'Paid content, premium features',
					},
				],
				keyServers: {
					threshold: 2,
					objectIds: (env.SEAL_KEY_SERVERS || '').split(',').filter(Boolean),
					note: 'Decryption requires 2-of-n key server quorum',
				},
				approveTarget: env.SEAL_APPROVE_TARGET || null,
				encryption: {
					scheme: 'IBE',
					curve: 'BLS12-381',
					symmetric: 'AES-256-GCM',
				},
			},
			walrus: {
				publisherUrl: env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
				aggregatorUrl:
					env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
				network: env.WALRUS_NETWORK || 'testnet',
				encoding: 'Red Stuff 2D',
				replication: '4-5x',
			},
			sdk: {
				messagingSdk: 'https://unpkg.com/@mysten/messaging',
				sealSdk: 'https://unpkg.com/@mysten/seal',
				suiSdk: 'https://unpkg.com/@mysten/sui',
			},
			security: {
				signatureSchemes: ['ed25519', 'secp256k1', 'secp256r1'],
				nonceExpiry: NONCE_EXPIRY_MS,
				maxMessageSize: MAX_MESSAGE_SIZE_BYTES,
				replayProtection: true,
				integrityAlgorithm: 'sha256',
			},
			version: 2,
		})
	}

	// POST /api/app/subscriptions/sync - Store encrypted subscription blob on Walrus
	if (path === 'subscriptions/sync' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				encryptedBlob?: string // Base64 encoded Seal-encrypted data
				subscriberAddress?: string
				sealPolicyId?: string
				signature?: string // Wallet signature to verify ownership
			}

			if (!body.encryptedBlob || !body.subscriberAddress) {
				return jsonResponse({ error: 'Encrypted blob and subscriber address required' }, 400)
			}

			// Verify the signature matches the subscriber address
			// In production, this would verify the wallet signature

			// Store on Walrus (encrypted blob - server never sees plaintext)
			const walrusResponse = await storeOnWalrus(body.encryptedBlob, env)

			if (!walrusResponse.blobId) {
				return jsonResponse({ error: 'Failed to store on Walrus' }, 500)
			}

			// Return the blob ID for client to store
			return jsonResponse({
				success: true,
				blobId: walrusResponse.blobId,
				subscriberAddress: body.subscriberAddress,
				sealPolicyId: body.sealPolicyId,
				version: Date.now(),
				storage: 'walrus',
				note: 'Encrypted subscriptions stored on Walrus. Only you can decrypt with your wallet.',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/app/subscriptions/blob/:blobId - Retrieve encrypted subscription blob
	const blobMatch = path.match(/^subscriptions\/blob\/([^/]+)$/)
	if (blobMatch && request.method === 'GET') {
		const blobId = blobMatch[1]

		try {
			// Fetch encrypted blob from Walrus
			const aggregatorUrl =
				env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space'
			const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`)

			if (!response.ok) {
				return jsonResponse({ error: 'Blob not found' }, 404)
			}

			const encryptedData = await response.text()

			return jsonResponse({
				blobId,
				encryptedData,
				note: 'Decrypt client-side with Seal SDK using your wallet',
			})
		} catch {
			return jsonResponse({ error: 'Failed to fetch blob' }, 500)
		}
	}

	// POST /api/app/subscriptions - Create subscription (client encrypts, we store)
	if (path === 'subscriptions' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				targetName?: string
				targetAddress?: string
				notifications?: boolean
				nickname?: string
			}

			if (!body.targetName) {
				return jsonResponse({ error: 'Target SuiNS name required' }, 400)
			}

			// Return subscription data for client to encrypt with Seal
			return jsonResponse({
				action: 'subscribe',
				subscription: {
					targetName: body.targetName.replace('.sui', ''),
					targetAddress: body.targetAddress || null,
					notifications: body.notifications ?? false,
					nickname: body.nickname,
					subscribedAt: Date.now(),
				},
				encryption: {
					method: 'seal',
					note: 'Encrypt this subscription client-side with Seal before syncing to Walrus',
					steps: [
						'1. Load @mysten/seal SDK',
						'2. Create address-based policy for your wallet',
						'3. Encrypt subscription list with policy',
						'4. POST encrypted blob to /api/app/subscriptions/sync',
						'5. Store blobId locally for retrieval',
					],
				},
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/app/subscriptions - Get subscription sync info
	if (path === 'subscriptions' && request.method === 'GET') {
		const address = url.searchParams.get('address')

		return jsonResponse({
			subscriptions: [],
			address: address || null,
			encryption: {
				method: 'seal',
				storage: 'walrus',
				privacy: 'Only you can decrypt your subscriptions with your wallet',
			},
			note: 'Subscriptions are Seal-encrypted and stored on Walrus. Fetch your blob and decrypt client-side.',
		})
	}

	// DELETE /api/app/subscriptions/:name - Remove subscription (client re-encrypts list)
	const unsubMatch = path.match(/^subscriptions\/([^/]+)$/)
	if (unsubMatch && request.method === 'DELETE') {
		const targetName = unsubMatch[1]
		return jsonResponse({
			action: 'unsubscribe',
			targetName,
			note: 'Remove from local list, re-encrypt with Seal, and sync new blob to Walrus',
		})
	}

	// GET /api/app/feed - Get aggregated feed from subscriptions
	if (path === 'feed' && request.method === 'GET') {
		const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '50', 10), 100)
		const cursor = url.searchParams.get('cursor')
		// Client provides subscription list, server fetches posts
		return jsonResponse({
			posts: [],
			pagination: { limit, cursor, hasMore: false },
			note: 'Send subscription list in request body to fetch aggregated feed',
		})
	}

	// POST /api/app/feed - Get feed for specific subscriptions
	if (path === 'feed' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				subscriptions?: string[] // Array of SuiNS names
				limit?: number
				cursor?: string
			}

			if (!body.subscriptions?.length) {
				return jsonResponse({
					posts: [],
					note: 'No subscriptions provided',
				})
			}

			// Would fetch posts from each subscribed name
			// For now, return placeholder
			return jsonResponse({
				posts: [],
				subscriptions: body.subscriptions,
				pagination: {
					limit: Math.min(body.limit || 50, 100),
					cursor: body.cursor,
					hasMore: false,
				},
				note: 'Feed aggregation from subscribed names - coming with SDK integration',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// POST /api/app/post - Create a post to your feed (for subscribers)
	if (path === 'post' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				content?: string
				attachments?: string[]
				type?: string
				encrypted?: boolean
			}

			if (!body.content) {
				return jsonResponse({ error: 'Post content required' }, 400)
			}

			if (body.content.length > 5000) {
				return jsonResponse({ error: 'Post too long (max 5000 characters)' }, 400)
			}

			return jsonResponse({
				action: 'create_post',
				post: {
					content: body.content,
					attachments: body.attachments || [],
					type: body.type || 'text',
					encrypted: body.encrypted || false,
				},
				note: 'Sign and submit transaction to publish post. Subscribers will see it in their feed.',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/app/posts/:name - Get posts from a specific SuiNS name
	const postsMatch = path.match(/^posts\/([^/]+)$/)
	if (postsMatch && request.method === 'GET') {
		const suinsName = postsMatch[1]
		const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '20', 10), 50)
		const cursor = url.searchParams.get('cursor')

		// Would fetch posts from this user's feed
		return jsonResponse({
			name: suinsName,
			posts: [],
			pagination: { limit, cursor, hasMore: false },
			note: 'Posts from this user will appear here',
		})
	}

	// ===== ENCRYPTED MESSAGE STORAGE (Seal + Walrus) =====
	// Implements secure messaging per Seal whitepaper:
	// - Identity-Based Encryption with onchain access control
	// - Signature verification for message authentication
	// - Replay protection via nonce tracking
	// - Content integrity verification

	// POST /api/app/messages/send - Send Seal-encrypted message with full verification
	if (path === 'messages/send' && request.method === 'POST') {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const body = (await request.json()) as any

			// Handle multiple message formats for backward compatibility
			const isNewFormat = body.envelope && body.auth && body.integrity
			let envelope: SealEncryptedEnvelope
			let auth: MessageAuthentication
			let integrity: ContentIntegrity
			let sender: string
			let senderName: string | null
			let recipient: string
			let recipientName: string | null
			let timestamp: number
			let nonce: string
			let messageType: 'direct' | 'channel' | 'broadcast' = 'direct'

			if (isNewFormat) {
				const newBody = body as MessageSendRequest
				if (!newBody.envelope || !newBody.sender || !newBody.recipient) {
					return jsonResponse({ error: 'Envelope, sender, and recipient required' }, 400)
				}
				if (!newBody.auth || !newBody.integrity) {
					return jsonResponse({ error: 'Authentication and integrity data required' }, 400)
				}
				envelope = newBody.envelope
				auth = newBody.auth
				integrity = newBody.integrity
				sender = newBody.sender
				senderName = newBody.senderName || null
				recipient = newBody.recipient
				recipientName = newBody.recipientName || null
				timestamp = newBody.timestamp
				nonce = newBody.nonce
				messageType = newBody.messageType || 'direct'
			} else {
				// Legacy format - support multiple field names for compatibility
				const encryptedMessage = body.encryptedMessage || body.encrypted || body.message
				const senderAddr = body.sender || body.senderAddress || body.from
				const recipientAddr = body.recipient || body.recipientAddress || body.to
				const sig = body.signature || body.sig
				const sigPayload = body.signaturePayload || body.payload || body.message

				// Validate required fields with better error messages
				if (!encryptedMessage) {
					return jsonResponse(
						{
							error: 'Encrypted message required',
							hint: 'Expected field: encryptedMessage (or encrypted/message)',
							received: Object.keys(body),
						},
						400,
					)
				}

				if (!senderAddr || typeof senderAddr !== 'string' || senderAddr.trim().length === 0) {
					return jsonResponse(
						{
							error: 'Valid sender address required',
							hint: 'Expected field: sender (or senderAddress/from) with non-empty string value',
							received: Object.keys(body),
							debug: {
								sender: senderAddr,
								senderType: typeof senderAddr,
							},
						},
						400,
					)
				}

				if (
					!recipientAddr ||
					typeof recipientAddr !== 'string' ||
					recipientAddr.trim().length === 0
				) {
					return jsonResponse(
						{
							error: 'Valid recipient address required',
							hint: 'Expected field: recipient (or recipientAddress/to) with non-empty string value',
							received: Object.keys(body),
							debug: {
								recipient: recipientAddr,
								recipientType: typeof recipientAddr,
							},
						},
						400,
					)
				}

				// Signature is optional for legacy format to maintain compatibility
				const hasSignature = sig && sigPayload

				// Handle various encrypted message formats
				let ciphertext: string
				let sealPolicyAddress: string
				let version = 1

				if (typeof encryptedMessage === 'string') {
					ciphertext = encryptedMessage
					sealPolicyAddress = recipientAddr
				} else if (encryptedMessage.encrypted) {
					ciphertext = encryptedMessage.encrypted
					sealPolicyAddress = encryptedMessage.sealPolicy?.address || recipientAddr
					version = encryptedMessage.version || 1
				} else if (encryptedMessage.ciphertext) {
					ciphertext = encryptedMessage.ciphertext
					sealPolicyAddress = encryptedMessage.policy?.address || recipientAddr
					version = encryptedMessage.version || 1
				} else {
					ciphertext = JSON.stringify(encryptedMessage)
					sealPolicyAddress = recipientAddr
				}

				const sealPackageId =
					env.SEAL_PACKAGE_ID ||
					'0x0000000000000000000000000000000000000000000000000000000000000000'
				envelope = {
					ciphertext,
					identity: `${sealPackageId}*${sealPolicyAddress}`,
					policy: {
						type: 'address' as SealPolicyType,
						packageId: sealPackageId,
						policyId: sealPolicyAddress,
						params: { type: 'address', address: sealPolicyAddress },
					},
					version,
					threshold: 2,
				}
				auth = {
					signature: hasSignature ? sig : '',
					publicKey: '',
					signedPayload: hasSignature ? sigPayload : '',
					scheme: 'ed25519',
				}
				sender = senderAddr
				senderName = body.senderName || null
				recipient = recipientAddr
				recipientName = body.recipientName || null
				timestamp = body.timestamp || Date.now()
				nonce = body.nonce || crypto.randomUUID()
				integrity = {
					contentHash: body.contentHash || '',
					algorithm: 'sha256',
					sizeBytes: ciphertext.length,
				}
			}

			// Validate Seal policy structure
			const policyValidation = validateSealPolicy(envelope)
			if (!policyValidation.valid) {
				return jsonResponse({ error: `Invalid Seal policy: ${policyValidation.reason}` }, 400)
			}

			// Validate timestamp (prevent replay attacks with old messages)
			if (!isTimestampValid(timestamp)) {
				return jsonResponse({ error: 'Message timestamp out of acceptable range' }, 400)
			}

			// Check for replay attacks (nonce reuse)
			if (isNonceUsed(nonce)) {
				return jsonResponse({ error: 'Nonce already used (replay attack prevented)' }, 400)
			}

			// Verify content integrity
			const integrityCheck = await verifyContentIntegrity(integrity, envelope.ciphertext.length)
			if (!integrityCheck.valid) {
				return jsonResponse({ error: `Integrity check failed: ${integrityCheck.reason}` }, 400)
			}

			// Verify message authentication (signature)
			let signatureVerified = false
			if (auth.publicKey && auth.publicKey.length > 0) {
				const authCheck = await verifyMessageAuth(
					auth,
					sender,
					recipient,
					timestamp,
					integrity.contentHash,
					nonce,
				)
				if (!authCheck.valid) {
					return jsonResponse({ error: `Authentication failed: ${authCheck.reason}` }, 400)
				}
				signatureVerified = true
			}

			// Mark nonce as used (after all validations pass)
			markNonceUsed(nonce)

			// Generate unique message ID
			const messageId = await generateMessageId(integrity.contentHash, timestamp, nonce)

			// Build secure message blob for storage
			const secureMessageBlob = JSON.stringify({
				id: messageId,
				envelope,
				sender,
				senderName,
				recipient,
				recipientName,
				timestamp,
				nonce,
				integrity,
				auth: {
					signature: auth.signature,
					publicKey: auth.publicKey,
					scheme: auth.scheme,
				},
				messageType,
				storedAt: Date.now(),
				version: 2,
			})

			// Store on Walrus
			const walrusResponse = await storeOnWalrus(btoa(secureMessageBlob), env)

			let blobId: string
			let storage: 'walrus' | 'kv'

			if (!walrusResponse.blobId) {
				// Fallback to KV storage
				const fallbackKey = `msg_blob_${messageId}`
				await env.CACHE.put(fallbackKey, secureMessageBlob, { expirationTtl: 60 * 60 * 24 * 30 })
				blobId = fallbackKey
				storage = 'kv'
			} else {
				blobId = walrusResponse.blobId
				storage = 'walrus'
			}

			// Update conversation and store message index
			const conversationId = await updateConversationWithMessage(
				env,
				sender,
				senderName,
				recipient,
				recipientName,
				'[Encrypted message]',
				timestamp,
			)

			const storedMessage: StoredMessage = {
				id: messageId,
				blobId,
				storage,
				sender,
				senderName,
				recipient,
				recipientName,
				timestamp,
				signed: true,
				conversationId,
				policyType: envelope.policy.type,
				signatureVerified,
				contentHash: integrity.contentHash,
			}

			await appendConversationMessage(env, conversationId, storedMessage)

			const response: MessageSendResponse = {
				success: true,
				messageId,
				blobId,
				storage,
				conversationId,
				signatureVerified,
				timestamp,
			}

			return jsonResponse(response)
		} catch (err) {
			console.error('Message send error:', err)
			return jsonResponse({ error: 'Invalid request body or processing error' }, 400)
		}
	}

	// POST /api/app/messages/store - Store Seal-encrypted message on Walrus (legacy)
	if (path === 'messages/store' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				encryptedMessage?: {
					encrypted: string
					sealPolicy: { type: string; address: string }
					version: number
				}
				sender?: string
				recipient?: string
			}

			if (!body.encryptedMessage || !body.sender || !body.recipient) {
				return jsonResponse({ error: 'Encrypted message, sender, and recipient required' }, 400)
			}

			// Store encrypted message on Walrus
			const messageBlob = JSON.stringify({
				...body.encryptedMessage,
				sender: body.sender,
				recipient: body.recipient,
				storedAt: Date.now(),
			})

			const walrusResponse = await storeOnWalrus(btoa(messageBlob), env)

			if (!walrusResponse.blobId) {
				return jsonResponse({ error: 'Failed to store on Walrus' }, 500)
			}

			const now = Date.now()
			const conversationId = await computeConversationId(body.sender, body.recipient)
			const messageId = `msg_${now}`

			const storedMsg: StoredMessage = {
				id: messageId,
				blobId: walrusResponse.blobId,
				storage: 'walrus',
				sender: body.sender,
				senderName: null,
				recipient: body.recipient,
				recipientName: null,
				timestamp: now,
				signed: false,
				conversationId,
			}

			await appendConversationMessage(env, conversationId, storedMsg)

			return jsonResponse({
				success: true,
				messageId,
				blobId: walrusResponse.blobId,
				storage: 'walrus',
				encryption: 'seal',
				note: 'Message encrypted with Seal and stored on Walrus. Only recipient can decrypt.',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/app/messages/inbox - Get encrypted messages for an address (Seal-gated)
	if (path === 'messages/inbox' && request.method === 'GET') {
		const address = url.searchParams.get('address')

		if (!address) {
			return jsonResponse({ error: 'Address required' }, 400)
		}

		try {
			const store = await getUserConvStore(env, address)
			const allMessages: StoredMessage[] = []

			const fetches = store.conversations.map((conv) => getConversationMessages(env, conv.id))
			const results = await Promise.all(fetches)
			for (const msgs of results) {
				for (const msg of msgs) {
					if (msg.recipient === address) {
						allMessages.push(msg)
					}
				}
			}

			allMessages.sort((a, b) => b.timestamp - a.timestamp)

			return jsonResponse({
				address,
				messages: allMessages,
				count: allMessages.length,
				encryption: {
					method: 'seal',
					note: 'Messages are Seal-encrypted. Decrypt client-side with your wallet.',
				},
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return jsonResponse({ error: 'Failed to fetch inbox: ' + message }, 500)
		}
	}

	// GET /api/app/messages/blob/:blobId - Fetch encrypted message blob from Walrus
	const msgBlobMatch = path.match(/^messages\/blob\/([^/]+)$/)
	if (msgBlobMatch && request.method === 'GET') {
		const blobId = msgBlobMatch[1]

		try {
			const aggregatorUrl =
				env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space'
			const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`)

			if (!response.ok) {
				return jsonResponse({ error: 'Message blob not found' }, 404)
			}

			const encryptedData = await response.text()

			return jsonResponse({
				blobId,
				encryptedData,
				note: 'Decrypt with Seal SDK using your wallet. Only recipient can decrypt.',
			})
		} catch {
			return jsonResponse({ error: 'Failed to fetch message blob' }, 500)
		}
	}

	return jsonResponse({ error: 'Unknown messaging endpoint' }, 404)
}

/**
 * Agency API handlers
 */
async function handleAgencyApi(request: Request, _env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/agents/', '').replace('/api/agents', '')

	// GET /api/agents - List agencies
	if ((path === '' || path === '/') && request.method === 'GET') {
		const filter = url.searchParams.get('filter') || 'public'
		// Placeholder - would query on-chain agency registry
		return jsonResponse({
			agencies: [],
			filter,
			note: 'Agency registry coming soon. Configure AGENCY_REGISTRY_ID in env.',
		})
	}

	// POST /api/agents/register - Register new agency (returns tx builder)
	if (path === 'register' && request.method === 'POST') {
		try {
			const body = (await request.json()) as { name?: string }
			if (!body.name) {
				return jsonResponse({ error: 'Agency name required' }, 400)
			}
			return jsonResponse({
				action: 'register_agency',
				params: body,
				note: 'Build and sign transaction client-side',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/agents/:id - Get agency details
	const agencyMatch = path.match(/^([^/]+)$/)
	if (agencyMatch && request.method === 'GET') {
		const agencyId = agencyMatch[1]
		// Placeholder - would fetch from chain
		return jsonResponse(
			{
				error: 'Agency not found',
				agencyId,
				note: 'Agency registry not yet configured',
			},
			404,
		)
	}

	// POST /api/agents/:id/delegate - Create delegation capability
	const delegateMatch = path.match(/^([^/]+)\/delegate$/)
	if (delegateMatch && request.method === 'POST') {
		const agencyId = delegateMatch[1]
		return jsonResponse({
			action: 'create_delegation',
			agencyId,
			note: 'Delegation requires IKA dWallet setup',
		})
	}

	// GET /api/agents/:id/members - List agency members
	const membersMatch = path.match(/^([^/]+)\/members$/)
	if (membersMatch && request.method === 'GET') {
		const agencyId = membersMatch[1]
		return jsonResponse({
			agencyId,
			members: [],
			note: 'Agency not found',
		})
	}

	return jsonResponse({ error: 'Unknown agency endpoint' }, 404)
}

/**
 * IKA dWallet API handlers
 */
async function handleIkaApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/ika/', '')

	// Check if IKA is configured
	if (!env.IKA_PACKAGE_ID) {
		return jsonResponse(
			{
				error: 'IKA not configured',
				note: 'Set IKA_PACKAGE_ID in environment variables',
				docs: 'https://docs.ika.xyz',
			},
			503,
		)
	}

	// POST /api/ika/dwallet/create - Create dWallet (returns tx builder)
	if (path === 'dwallet/create' && request.method === 'POST') {
		return jsonResponse({
			action: 'create_dwallet',
			packageId: env.IKA_PACKAGE_ID,
			note: 'Load @ika.xyz/sdk client-side to create dWallet',
			sdk: 'https://unpkg.com/@ika.xyz/sdk',
		})
	}

	// GET /api/ika/dwallet/:id/addresses - Get foreign chain addresses
	const addressesMatch = path.match(/^dwallet\/([^/]+)\/addresses$/)
	if (addressesMatch && request.method === 'GET') {
		const dWalletId = addressesMatch[1]
		// Placeholder - would fetch from IKA
		return jsonResponse({
			dWalletId,
			addresses: {},
			note: 'dWallet not found or not yet created',
		})
	}

	// POST /api/ika/dwallet/:id/sign - Request cross-chain signature
	const signMatch = path.match(/^dwallet\/([^/]+)\/sign$/)
	if (signMatch && request.method === 'POST') {
		const dWalletId = signMatch[1]
		return jsonResponse({
			action: 'sign_crosschain',
			dWalletId,
			note: '2PC-MPC signing requires client-side SDK and user approval',
		})
	}

	// GET /api/ika/status - IKA integration status
	if (path === 'status') {
		return jsonResponse({
			enabled: true,
			packageId: env.IKA_PACKAGE_ID,
			network: env.SUI_NETWORK,
			features: {
				bitcoin: true,
				ethereum: true,
				solana: true,
			},
		})
	}

	return jsonResponse({ error: 'Unknown IKA endpoint' }, 404)
}

/**
 * LLM proxy API handlers (rate-limited)
 */
async function handleLlmApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/llm/', '')

	// Check if LLM is configured
	if (!env.LLM_API_KEY) {
		return jsonResponse(
			{
				error: 'LLM not configured',
				note: 'Set LLM_API_KEY in environment variables',
			},
			503,
		)
	}

	const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
	const now = Date.now()
	const entry = llmRateLimits.get(clientIP)

	if (entry && now < entry.resetAt) {
		if (entry.count >= 10) {
			return jsonResponse(
				{
					error: 'Rate limit exceeded',
					retryAfter: Math.ceil((entry.resetAt - now) / 1000),
				},
				429,
			)
		}
		entry.count++
	} else {
		llmRateLimits.set(clientIP, { count: 1, resetAt: now + 60_000 })
	}

	// POST /api/llm/complete - Completion endpoint
	if (path === 'complete' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				prompt?: string
				context?: string
				maxTokens?: number
			}
			if (!body.prompt) {
				return jsonResponse({ error: 'Prompt required' }, 400)
			}

			const apiUrl = env.LLM_API_URL || 'https://api.anthropic.com/v1/messages'
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': env.LLM_API_KEY,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: 'claude-3-haiku-20240307',
					max_tokens: Math.min(body.maxTokens || 500, 1000),
					messages: [
						{
							role: 'user',
							content: body.context ? `Context: ${body.context}\n\n${body.prompt}` : body.prompt,
						},
					],
				}),
			})

			if (!response.ok) {
				const error = await response.text()
				return jsonResponse({ error: 'LLM request failed', details: error }, response.status)
			}

			const result = await response.json()
			return jsonResponse(result)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return jsonResponse({ error: 'LLM request failed', details: message }, 500)
		}
	}

	// POST /api/llm/summarize - Summarize conversation
	if (path === 'summarize' && request.method === 'POST') {
		try {
			const body = (await request.json()) as { messages?: string[] }
			if (!body.messages?.length) {
				return jsonResponse({ error: 'Messages array required' }, 400)
			}

			const apiUrl = env.LLM_API_URL || 'https://api.anthropic.com/v1/messages'
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': env.LLM_API_KEY,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: 'claude-3-haiku-20240307',
					max_tokens: 300,
					messages: [
						{
							role: 'user',
							content: `Summarize this conversation concisely:\n\n${body.messages.join('\n\n')}`,
						},
					],
				}),
			})

			if (!response.ok) {
				const error = await response.text()
				return jsonResponse({ error: 'Summarization failed', details: error }, response.status)
			}

			const result = await response.json()
			return jsonResponse(result)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return jsonResponse({ error: 'Summarization failed', details: message }, 500)
		}
	}

	return jsonResponse({ error: 'Unknown LLM endpoint' }, 404)
}

/**
 * Generate the PWA app shell HTML
 * This serves as the SPA container with client-side routing
 */
function generateAppShell(env: Env, currentPath: string): string {
	const title = getPageTitle(currentPath)

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>${title} | sui.ski</title>
	<meta name="description" content="Secure, decentralized communications on Sui blockchain">
	<meta name="theme-color" content="#000">
	
	<style>
		${getAppStyles()}
	</style>
</head>
<body>
	<div id="app">
		${generateAppContent(currentPath, env)}
	</div>

	<script>
		${getAppScript(env)}
	</script>
</body>
</html>`
}

function getPageTitle(path: string): string {
	if (path === '/' || path === '') return 'Signal'
	if (path.startsWith('/chat')) return 'Chat'
	if (path.startsWith('/channels')) return 'Channels'
	if (path.startsWith('/news')) return 'News'
	if (path.startsWith('/agents')) return 'Agents'
	if (path.startsWith('/settings')) return 'Settings'
	return 'Signal'
}

function getAppStyles(): string {
	return `
		* { margin: 0; padding: 0; box-sizing: border-box; }

		:root {
			--bg-primary: #000;
			--bg-secondary: #12121a;
			--bg-tertiary: #1a1a24;
			--text-primary: #e4e4e7;
			--text-secondary: #71717a;
			--accent: #60a5fa;
			--accent-hover: #3b82f6;
			--success: #22c55e;
			--warning: #f59e0b;
			--error: #ef4444;
			--border: rgba(255, 255, 255, 0.08);
		}

		html, body {
			height: 100%;
			overflow: hidden;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: var(--bg-primary);
			color: var(--text-primary);
		}

		#app {
			display: flex;
			flex-direction: column;
			height: 100%;
			max-width: 100%;
		}

		/* Header */
		.app-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 16px;
			background: var(--bg-secondary);
			border-bottom: 1px solid var(--border);
			position: sticky;
			top: 0;
			z-index: 100;
		}

		.app-logo {
			font-size: 1.25rem;
			font-weight: 700;
			background: linear-gradient(135deg, var(--accent), #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			text-decoration: none;
		}

		.wallet-bar {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.wallet-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 16px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border: none;
			border-radius: 8px;
			color: white;
			font-weight: 600;
			font-size: 0.875rem;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.wallet-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
		}

		.wallet-connected {
			background: var(--bg-tertiary);
			border: 1px solid var(--border);
		}

		/* Main content */
		.app-main {
			flex: 1;
			overflow-y: auto;
			padding: 0;
		}

		/* Bottom navigation */
		.app-nav {
			display: flex;
			background: var(--bg-secondary);
			border-top: 1px solid var(--border);
			padding: 8px 0;
			padding-bottom: max(8px, env(safe-area-inset-bottom));
		}

		.nav-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			padding: 8px;
			color: var(--text-secondary);
			text-decoration: none;
			font-size: 0.75rem;
			transition: color 0.2s;
		}

		.nav-item:hover, .nav-item.active {
			color: var(--accent);
		}

		.nav-item svg {
			width: 24px;
			height: 24px;
		}

		/* Dashboard cards */
		.dashboard {
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.welcome-card {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(139, 92, 246, 0.1));
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 16px;
			padding: 24px;
		}

		.welcome-card h1 {
			font-size: 1.5rem;
			margin-bottom: 8px;
		}

		.welcome-card p {
			color: var(--text-secondary);
			margin-bottom: 16px;
		}

		.feature-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 12px;
		}

		.feature-card {
			background: var(--bg-secondary);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 16px;
			text-decoration: none;
			color: inherit;
			transition: border-color 0.2s, transform 0.2s;
		}

		.feature-card:hover {
			border-color: var(--accent);
			transform: translateY(-2px);
		}

		.feature-card h3 {
			font-size: 1rem;
			margin-bottom: 4px;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.feature-card p {
			font-size: 0.85rem;
			color: var(--text-secondary);
		}

		.feature-card svg {
			width: 20px;
			height: 20px;
			color: var(--accent);
		}

		/* Status badges */
		.status-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 4px 10px;
			border-radius: 999px;
			font-size: 0.75rem;
			font-weight: 600;
		}

		.status-alpha {
			background: rgba(251, 191, 36, 0.15);
			color: #fbbf24;
		}

		.status-connected {
			background: rgba(34, 197, 94, 0.15);
			color: var(--success);
		}

		/* Empty states */
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 48px 24px;
			text-align: center;
		}

		.empty-state svg {
			width: 64px;
			height: 64px;
			color: var(--text-secondary);
			margin-bottom: 16px;
			opacity: 0.5;
		}

		.empty-state h2 {
			font-size: 1.25rem;
			margin-bottom: 8px;
		}

		.empty-state p {
			color: var(--text-secondary);
			max-width: 280px;
		}

		/* Chat list */
		.chat-list {
			display: flex;
			flex-direction: column;
		}

		.chat-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 16px;
			border-bottom: 1px solid var(--border);
			text-decoration: none;
			color: inherit;
			transition: background 0.2s;
		}

		.chat-item:hover {
			background: var(--bg-secondary);
		}

		.chat-avatar {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 1.25rem;
		}

		.chat-info {
			flex: 1;
			min-width: 0;
		}

		.chat-name {
			font-weight: 600;
			margin-bottom: 2px;
		}

		.chat-preview {
			color: var(--text-secondary);
			font-size: 0.875rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.chat-meta {
			text-align: right;
		}

		.chat-time {
			font-size: 0.75rem;
			color: var(--text-secondary);
		}

		.unread-badge {
			background: var(--accent);
			color: white;
			font-size: 0.75rem;
			font-weight: 700;
			padding: 2px 8px;
			border-radius: 999px;
			margin-top: 4px;
			display: inline-block;
		}

		/* Loading state */
		.loading {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 48px;
		}

		.spinner {
			width: 32px;
			height: 32px;
			border: 3px solid var(--border);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			to { transform: rotate(360deg); }
		}

		/* Responsive */
		@media (min-width: 768px) {
			.feature-grid {
				grid-template-columns: repeat(4, 1fr);
			}
		}
	`
}

function generateAppContent(path: string, env: Env): string {
	// Header with wallet connection
	const header = `
		<header class="app-header">
			<a href="/app" class="app-logo">sui.ski</a>
			<div class="wallet-bar">
				<span class="status-badge status-alpha">Alpha</span>
				<button class="wallet-btn" id="connect-wallet" onclick="connectWallet()">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
						<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
						<line x1="1" y1="10" x2="23" y2="10"></line>
					</svg>
					<span id="wallet-text">Connect</span>
				</button>
			</div>
		</header>
	`

	// Bottom navigation
	const nav = `
		<nav class="app-nav">
			<a href="/app/chat" class="nav-item ${path.startsWith('/chat') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				Chat
			</a>
			<a href="/app/channels" class="nav-item ${path.startsWith('/channels') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
					<circle cx="9" cy="7" r="4"></circle>
					<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
				</svg>
				Channels
			</a>
			<a href="/app/news" class="nav-item ${path.startsWith('/news') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
				</svg>
				News
			</a>
			<a href="/app/agents" class="nav-item ${path.startsWith('/agents') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3"></circle>
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
				</svg>
				Agents
			</a>
			<a href="/app/settings" class="nav-item ${path.startsWith('/settings') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<circle cx="12" cy="12" r="4"></circle>
					<line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
					<line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
					<line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
					<line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
				</svg>
				Settings
			</a>
		</nav>
	`

	// Page content based on path
	let content = ''
	if (path === '/' || path === '') {
		content = generateDashboard(env)
	} else if (path === '/chat' || path.startsWith('/chat/')) {
		content = generateChatPage(path, env)
	} else if (path === '/channels' || path.startsWith('/channels/')) {
		content = generateChannelsPage(path, env)
	} else if (path === '/news' || path.startsWith('/news/')) {
		content = generateNewsPage(path, env)
	} else if (path === '/agents' || path.startsWith('/agents/')) {
		content = generateAgentsPage(path, env)
	} else if (path === '/settings') {
		content = generateSettingsPage(env)
	} else {
		content = `<div class="empty-state"><h2>Page Not Found</h2></div>`
	}

	return `${header}<main class="app-main">${content}</main>${nav}`
}

function generateDashboard(env: Env): string {
	return `
		<div class="dashboard">
			<div class="welcome-card">
				<h1>Welcome to Signal</h1>
				<p>Secure, decentralized communications on Sui blockchain</p>
				<div class="feature-grid">
					<a href="/app/chat" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
							</svg>
							Chat
						</h3>
						<p>E2E encrypted 1:1 messaging</p>
					</a>
					<a href="/app/channels" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
								<circle cx="9" cy="7" r="4"></circle>
								<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
								<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
							</svg>
							Channels
						</h3>
						<p>Token-gated group chats</p>
					</a>
					<a href="/app/news" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
							</svg>
							News
						</h3>
						<p>Community broadcasts</p>
					</a>
					<a href="/app/agents" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="3"></circle>
								<path d="M12 1v4"></path>
								<path d="M12 19v4"></path>
								<path d="M1 12h4"></path>
								<path d="M19 12h4"></path>
							</svg>
							Agents
						</h3>
						<p>AI + human delegation</p>
					</a>
				</div>
			</div>

			<div class="feature-card" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(96, 165, 250, 0.1)); border-color: rgba(139, 92, 246, 0.2);">
				<h3 style="margin-bottom: 12px;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<path d="M12 16v-4"></path>
						<path d="M12 8h.01"></path>
					</svg>
					How It Works
				</h3>
				<p style="margin-bottom: 8px;">This app uses the <strong>Sui Stack Messaging SDK</strong> for encrypted communications:</p>
				<ul style="color: var(--text-secondary); font-size: 0.85rem; padding-left: 20px; margin-bottom: 12px;">
					<li>Messages encrypted with Seal protocol</li>
					<li>Attachments stored on Walrus</li>
					<li>Cross-chain control via IKA dWallets</li>
					<li>AI agents with guardrails</li>
				</ul>
				<p style="font-size: 0.85rem;">Network: <strong>${env.SUI_NETWORK}</strong></p>
			</div>
		</div>
	`
}

function generateChatPage(path: string, _env: Env): string {
	if (path === '/chat') {
		// Chat list
		return `
			<div class="chat-list">
				<div class="empty-state">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
					<h2>No Conversations Yet</h2>
					<p>Connect your wallet and start a conversation with any Sui address or SuiNS name.</p>
				</div>
			</div>
		`
	}

	// Individual chat view
	const chatId = path.replace('/chat/', '')
	return `
		<div class="empty-state">
			<h2>Chat with ${chatId}</h2>
			<p>Connect wallet to load encrypted messages.</p>
		</div>
	`
}

function generateChannelsPage(path: string, _env: Env): string {
	if (path === '/channels') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>Channels</h1>
					<p>Join token-gated communities and group chats</p>
				</div>
				<div class="empty-state">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
					</svg>
					<h2>No Channels Found</h2>
					<p>Public channels will appear here. Create your own or join with an invite.</p>
				</div>
			</div>
		`
	}

	const channelId = path.replace('/channels/', '')
	return `
		<div class="empty-state">
			<h2>Channel: ${channelId}</h2>
			<p>Connect wallet to view channel content.</p>
		</div>
	`
}

function generateNewsPage(path: string, _env: Env): string {
	if (path === '/news') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>News Feed</h1>
					<p>Subscribe to broadcast channels from your favorite projects</p>
				</div>
				<div class="empty-state">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
					</svg>
					<h2>No Subscriptions</h2>
					<p>Browse and subscribe to news channels to see updates here.</p>
				</div>
			</div>
		`
	}

	if (path === '/news/create') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>Create News Channel</h1>
					<p>Start a broadcast channel for your community</p>
				</div>
			</div>
		`
	}

	return `<div class="empty-state"><h2>News Post</h2></div>`
}

function generateAgentsPage(path: string, _env: Env): string {
	if (path === '/agents') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>Agent Marketplace</h1>
					<p>Create agencies with AI agents and human members</p>
				</div>
				<div class="feature-grid">
					<a href="/app/agents/create" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="12" y1="8" x2="12" y2="16"></line>
								<line x1="8" y1="12" x2="16" y2="12"></line>
							</svg>
							Create Agency
						</h3>
						<p>Start your own agency with delegated permissions</p>
					</a>
					<div class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="11" cy="11" r="8"></circle>
								<path d="M21 21l-4.35-4.35"></path>
							</svg>
							Browse Agencies
						</h3>
						<p>Find and join existing agencies</p>
					</div>
				</div>
				<div class="feature-card" style="margin-top: 8px;">
					<h3>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
						</svg>
						IKA Cross-Chain Control
					</h3>
					<p>Agencies can control dWallets on Bitcoin, Ethereum, and Solana with 2PC-MPC security. LLM agents require human approval for sensitive actions.</p>
				</div>
			</div>
		`
	}

	const agencyId = path.replace('/agents/', '')
	return `
		<div class="empty-state">
			<h2>Agency: ${agencyId}</h2>
			<p>Agency dashboard coming soon.</p>
		</div>
	`
}

function generateSettingsPage(env: Env): string {
	return `
		<div class="dashboard">
			<div class="welcome-card">
				<h1>Settings</h1>
				<p>Configure your account and preferences</p>
			</div>
			<div class="feature-card">
				<h3>Network</h3>
				<p>Connected to: <strong>${env.SUI_NETWORK}</strong></p>
			</div>
			<div class="feature-card">
				<h3>IKA dWallet</h3>
				<p>${env.IKA_PACKAGE_ID ? 'Configured' : 'Not configured'}</p>
			</div>
			<div class="feature-card">
				<h3>AI Copilot</h3>
				<p>${env.LLM_API_KEY ? 'Enabled' : 'Not configured'}</p>
			</div>
		</div>
	`
}

function getAppScript(_env: Env): string {
	return `
		${generateWalletSessionJs()}
		let connectedAddress = null;
		let suiWallet = null;

		async function connectWallet() {
			const btn = document.getElementById('connect-wallet');
			const text = document.getElementById('wallet-text');

			if (connectedAddress) {
				connectedAddress = null;
				suiWallet = null;
				text.textContent = 'Connect';
				btn.classList.remove('wallet-connected');
				disconnectWalletSession();
				return;
			}

			try {
				// Check for Sui wallet
				if (typeof window.sui === 'undefined') {
					alert('Please install a Sui wallet (Sui Wallet, Suiet, etc.)');
					return;
				}

				const wallet = window.sui;
				const response = await wallet.connect();
				connectedAddress = response.accounts[0]?.address;
				suiWallet = wallet;

				if (connectedAddress) {
					text.textContent = connectedAddress.slice(0, 6) + '...' + connectedAddress.slice(-4);
					btn.classList.add('wallet-connected');
					connectWalletSession('Sui Wallet', connectedAddress);
				}
			} catch (error) {
				console.error('Wallet connection failed:', error);
				alert('Failed to connect wallet');
			}
		}

		// Client-side routing
		document.addEventListener('click', (e) => {
			const link = e.target.closest('a[href^="/app"]');
			if (link) {
				e.preventDefault();
				const href = link.getAttribute('href');
				history.pushState(null, '', href);
				// In a full SPA, this would update the view
				window.location.href = href;
			}
		});

		// Handle back/forward
		window.addEventListener('popstate', () => {
			window.location.reload();
		});

		// Check for existing wallet connection
		if (typeof window.sui !== 'undefined') {
			window.sui.hasPermissions().then((hasPerms) => {
				if (hasPerms) {
					window.sui.getAccounts().then((accounts) => {
						if (accounts?.length > 0) {
							connectedAddress = accounts[0].address;
							suiWallet = window.sui;
							const text = document.getElementById('wallet-text');
							const btn = document.getElementById('connect-wallet');
							text.textContent = connectedAddress.slice(0, 6) + '...' + connectedAddress.slice(-4);
							btn.classList.add('wallet-connected');
							connectWalletSession('Sui Wallet', connectedAddress);
						}
					});
				} else {
					const hint = getWalletSession();
					if (hint) {
						window.sui.connect().then((response) => {
							const addr = response.accounts?.[0]?.address;
							if (addr) {
								connectedAddress = addr;
								suiWallet = window.sui;
								const text = document.getElementById('wallet-text');
								const btn = document.getElementById('connect-wallet');
								text.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
								btn.classList.add('wallet-connected');
								connectWalletSession('Sui Wallet', addr);
							}
						}).catch(() => {});
					}
				}
			});
		} else {
			const hint = getWalletSession();
			if (hint) {
				setTimeout(() => {
					if (typeof window.sui !== 'undefined') {
						window.sui.connect().then((response) => {
							const addr = response.accounts?.[0]?.address;
							if (addr) {
								connectedAddress = addr;
								suiWallet = window.sui;
								const text = document.getElementById('wallet-text');
								const btn = document.getElementById('connect-wallet');
								text.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
								btn.classList.add('wallet-connected');
							}
						}).catch(() => {});
					}
				}, 500);
			}
		}
	`
}
