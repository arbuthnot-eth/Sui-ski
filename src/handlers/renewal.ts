/**
 * SuiNS Renewal Handler
 *
 * x402 payment-gated renewal service using Mysten Labs tools:
 * - @mysten/payment-kit: Payment processing with receipts
 * - @mysten/seal: Encryption for renewal queue
 * - @mysten/walrus: Decentralized queue storage
 * - Nautilus TEE: Secure off-chain renewal execution
 */

import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { SuinsClient } from '@mysten/suins'
// Note: @mysten/seal and @mysten/walrus are used in production with Nautilus TEE
// Imports commented out until Nautilus integration is complete:
// import { SealClient } from '@mysten/seal'
// import { WalrusClient } from '@mysten/walrus'
import type { Env } from '../types'
import { getDefaultRpcUrl } from '../utils/rpc'

// Constants
const RENEWAL_COST_SUI = 10
const RENEWAL_COST_MIST = BigInt(RENEWAL_COST_SUI) * BigInt(1_000_000_000)
const RENEWAL_MONTHS = 1
const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, X-Payment-Tx-Digest, X-Payment-Receipt',
}

// Renewal request structure
interface RenewalRequest {
	name: string
	nftId?: string
	requesterAddress: string
	paymentDigest: string
	paymentAmount: bigint
	requestedAt: number
	months: number
	status: 'pending' | 'processing' | 'completed' | 'failed'
	renewalTxDigest?: string
	error?: string
}

// Queue item (encrypted and stored on Walrus)
interface QueueItem {
	id: string
	encryptedData: Uint8Array
	createdAt: number
	processedAt?: number
	nautilusJobId?: string
}

/**
 * Get the relay/receiver address for payments (atlas.sui)
 */
async function getRelayAddress(env: Env): Promise<string | null> {
	try {
		const suiClient = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})
		const nameRecord = await suinsClient.getNameRecord('atlas.sui')
		return nameRecord?.targetAddress || null
	} catch (error) {
		console.error('Failed to resolve atlas.sui:', error)
		return null
	}
}

/**
 * Verify payment transaction on-chain
 */
async function verifyPayment(
	env: Env,
	txDigest: string,
	expectedRecipient: string,
	expectedAmount: bigint,
): Promise<{ valid: boolean; error?: string }> {
	try {
		const suiClient = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		const txResponse = await suiClient.getTransactionBlock({
			digest: txDigest,
			options: {
				showEffects: true,
				showBalanceChanges: true,
			},
		})

		if (!txResponse) {
			return { valid: false, error: 'Transaction not found' }
		}

		const effects = txResponse.effects
		if (effects?.status?.status !== 'success') {
			return { valid: false, error: 'Transaction failed' }
		}

		// Verify payment amount to recipient
		const balanceChanges = txResponse.balanceChanges || []
		const recipientChange = balanceChanges.find(
			(change) =>
				'AddressOwner' in (change.owner as Record<string, unknown>) &&
				(change.owner as { AddressOwner: string }).AddressOwner === expectedRecipient &&
				change.coinType === '0x2::sui::SUI',
		)

		if (!recipientChange) {
			return { valid: false, error: 'Payment not found to expected recipient' }
		}

		const receivedAmount = BigInt(recipientChange.amount)
		if (receivedAmount < expectedAmount) {
			return {
				valid: false,
				error: `Insufficient payment: expected ${expectedAmount}, got ${receivedAmount}`,
			}
		}

		return { valid: true }
	} catch (error) {
		console.error('Payment verification error:', error)
		return { valid: false, error: 'Failed to verify payment' }
	}
}

/**
 * Get NFT ID for a SuiNS name
 */
async function getNftId(env: Env, name: string): Promise<string | null> {
	try {
		const suiClient = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})
		const cleanName = name.replace(/\.sui$/i, '') + '.sui'
		const nameRecord = await suinsClient.getNameRecord(cleanName)
		return nameRecord?.nftId || null
	} catch (error) {
		console.error('Failed to get NFT ID:', error)
		return null
	}
}

/**
 * Encrypt renewal request using Seal
 *
 * Production implementation would use:
 * ```
 * const sealClient = new SealClient({
 *   suiClient: new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK }),
 *   keyServerObjectId: 'NAUTILUS_KEY_SERVER_OBJECT_ID',
 * })
 * return await sealClient.encrypt({
 *   data,
 *   policyId: 'NAUTILUS_POLICY_ID', // Only Nautilus enclave can decrypt
 * })
 * ```
 */
async function encryptRenewalRequest(_env: Env, request: RenewalRequest): Promise<Uint8Array> {
	// For development: return JSON-encoded data without encryption
	// In production, this would use Seal's encrypt method with Nautilus policy
	const data = new TextEncoder().encode(JSON.stringify(request))
	return data
}

/**
 * Store renewal request in queue (Walrus)
 *
 * Production implementation would use proper Walrus writeBlob with signer:
 * ```
 * const walrusClient = new WalrusClient({
 *   network: env.WALRUS_NETWORK,
 *   suiRpcUrl: env.SUI_RPC_URL,
 * })
 * const result = await walrusClient.writeBlob({
 *   blob: data,
 *   deletable: false,
 *   epochs: 5,
 *   signer: nautilusSigner,
 * })
 * ```
 *
 * For now, we use KV storage as the primary storage mechanism.
 * Walrus integration requires a signer which should be handled by Nautilus TEE.
 */
async function storeInQueue(_env: Env, _queueItem: QueueItem): Promise<string | null> {
	// For development: skip Walrus storage
	// KV storage is used as primary storage (see storeInKVQueue)
	// In production, Nautilus TEE would handle Walrus uploads with its own signer
	return null
}

/**
 * Store renewal request in KV cache as backup
 */
async function storeInKVQueue(env: Env, id: string, request: RenewalRequest): Promise<void> {
	const key = `renewal:${id}`
	await env.CACHE.put(key, JSON.stringify(request), { expirationTtl: 86400 * 7 }) // 7 days
}

/**
 * Get renewal status from KV
 */
async function getRenewalStatus(env: Env, id: string): Promise<RenewalRequest | null> {
	const key = `renewal:${id}`
	const data = await env.CACHE.get(key)
	if (!data) return null
	return JSON.parse(data) as RenewalRequest
}

/**
 * Update renewal status in KV
 */
async function updateRenewalStatus(
	env: Env,
	id: string,
	updates: Partial<RenewalRequest>,
): Promise<void> {
	const current = await getRenewalStatus(env, id)
	if (!current) return

	const updated = { ...current, ...updates }
	await env.CACHE.put(`renewal:${id}`, JSON.stringify(updated), { expirationTtl: 86400 * 7 })
}

/**
 * Generate unique renewal request ID
 */
function generateRequestId(): string {
	return `ren_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

/**
 * Handle renewal request - x402 protocol
 *
 * POST /api/renewal/request
 * Body: { name: "example.sui" }
 *
 * Without payment: Returns 402 with payment details
 * With X-Payment-Tx-Digest: Verifies payment and queues renewal
 */
export async function handleRenewalRequest(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405)
	}

	let payload: { name?: string; walletAddress?: string }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400)
	}

	const name = payload.name?.trim()
	if (!name) {
		return jsonResponse({ error: 'Name is required' }, 400)
	}

	const cleanName = name.replace(/\.sui$/i, '') + '.sui'

	// Resolve relay address
	const relayAddress = await getRelayAddress(env)
	if (!relayAddress) {
		return jsonResponse({ error: 'Relay service unavailable' }, 503)
	}

	// Check for payment proof
	const paymentDigest = request.headers.get('X-Payment-Tx-Digest')

	if (!paymentDigest) {
		// Return 402 Payment Required with payment details (x402 protocol)
		return jsonResponse(
			{
				error: 'Payment required',
				code: 'PAYMENT_REQUIRED',
				payment: {
					amount: RENEWAL_COST_MIST.toString(),
					amountSui: RENEWAL_COST_SUI,
					recipient: relayAddress,
					chain: env.SUI_NETWORK,
					currency: 'SUI',
					description: `Renew ${cleanName} for ${RENEWAL_MONTHS} month`,
				},
				instructions: {
					step1: 'Create a transaction sending the specified amount to the recipient',
					step2: 'Execute the transaction and obtain the digest',
					step3: 'Retry this request with X-Payment-Tx-Digest header',
				},
				// Payment Kit integration details
				paymentKit: {
					coinType: '0x2::sui::SUI',
					nonce: generateRequestId(),
					receiver: relayAddress,
				},
			},
			402,
		)
	}

	// Verify payment
	const verification = await verifyPayment(env, paymentDigest, relayAddress, RENEWAL_COST_MIST)
	if (!verification.valid) {
		return jsonResponse(
			{
				error: 'Payment verification failed',
				code: 'INVALID_PAYMENT',
				details: verification.error,
				payment: {
					amount: RENEWAL_COST_MIST.toString(),
					amountSui: RENEWAL_COST_SUI,
					recipient: relayAddress,
					chain: env.SUI_NETWORK,
					currency: 'SUI',
				},
			},
			402,
		)
	}

	// Get NFT ID
	const nftId = await getNftId(env, cleanName)
	if (!nftId) {
		return jsonResponse({ error: 'Could not find NFT for this name' }, 404)
	}

	// Create renewal request
	const requestId = generateRequestId()
	const renewalRequest: RenewalRequest = {
		name: cleanName,
		nftId,
		requesterAddress: payload.walletAddress || '',
		paymentDigest,
		paymentAmount: RENEWAL_COST_MIST,
		requestedAt: Date.now(),
		months: RENEWAL_MONTHS,
		status: 'pending',
	}

	// Encrypt and store in queue
	try {
		const encryptedData = await encryptRenewalRequest(env, renewalRequest)
		const queueItem: QueueItem = {
			id: requestId,
			encryptedData,
			createdAt: Date.now(),
		}

		// Store in Walrus (primary) and KV (backup)
		const blobId = await storeInQueue(env, queueItem)
		await storeInKVQueue(env, requestId, renewalRequest)

		return jsonResponse({
			success: true,
			requestId,
			status: 'pending',
			message: `Renewal request queued for ${cleanName}`,
			statusUrl: `/api/renewal/status/${requestId}`,
			walrusBlobId: blobId,
			nautilus: {
				jobQueued: true,
				estimatedProcessingTime: '1-5 minutes',
			},
		})
	} catch (error) {
		console.error('Failed to queue renewal:', error)
		return jsonResponse({ error: 'Failed to queue renewal request' }, 500)
	}
}

/**
 * Handle renewal status check
 *
 * GET /api/renewal/status/:requestId
 */
export async function handleRenewalStatus(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	const url = new URL(request.url)
	const pathMatch = url.pathname.match(/\/api\/renewal\/status\/(.+)$/)
	if (!pathMatch) {
		return jsonResponse({ error: 'Request ID required' }, 400)
	}

	const requestId = pathMatch[1]
	const status = await getRenewalStatus(env, requestId)

	if (!status) {
		return jsonResponse({ error: 'Renewal request not found' }, 404)
	}

	return jsonResponse({
		requestId,
		name: status.name,
		status: status.status,
		requestedAt: status.requestedAt,
		months: status.months,
		paymentDigest: status.paymentDigest,
		renewalTxDigest: status.renewalTxDigest,
		error: status.error,
	})
}

/**
 * Nautilus callback endpoint
 * Called by Nautilus TEE after processing renewal
 *
 * POST /api/renewal/nautilus-callback
 */
export async function handleNautilusCallback(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405)
	}

	// Verify request is from Nautilus (in production, use attestation)
	const nautilusSignature = request.headers.get('X-Nautilus-Attestation')
	if (!nautilusSignature) {
		// For now, accept without attestation in development
		console.warn('Nautilus callback without attestation')
	}

	let payload: {
		requestId: string
		status: 'completed' | 'failed'
		renewalTxDigest?: string
		error?: string
	}

	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400)
	}

	const { requestId, status, renewalTxDigest, error } = payload

	await updateRenewalStatus(env, requestId, {
		status,
		renewalTxDigest,
		error,
	})

	return jsonResponse({ success: true })
}

/**
 * Get pending renewals for Nautilus to process
 * Called by Nautilus TEE to fetch work
 *
 * GET /api/renewal/nautilus-queue
 */
export async function handleNautilusQueue(request: Request, env: Env): Promise<Response> {
	// Verify request is from Nautilus
	const nautilusSignature = request.headers.get('X-Nautilus-Attestation')
	if (!nautilusSignature) {
		console.warn('Nautilus queue request without attestation')
	}

	// List pending renewals from KV
	const list = await env.CACHE.list({ prefix: 'renewal:' })
	const pendingItems: RenewalRequest[] = []

	for (const key of list.keys) {
		const data = await env.CACHE.get(key.name)
		if (data) {
			const request = JSON.parse(data) as RenewalRequest
			if (request.status === 'pending') {
				pendingItems.push(request)
			}
		}
	}

	return jsonResponse({
		pending: pendingItems,
		count: pendingItems.length,
	})
}

// JSON response helper
function jsonResponse<T>(data: T, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...CORS_HEADERS,
		},
	})
}
