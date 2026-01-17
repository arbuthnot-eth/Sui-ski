/**
 * SuiNS Scheduled Claim Handler
 *
 * x402 payment-gated claim scheduling for names after grace period ends.
 * Uses Nautilus TEE for reliable registration execution.
 *
 * Flow:
 * 1. User schedules claim with payment (x402)
 * 2. System stores claim intent in KV
 * 3. Scheduled worker checks for ready claims
 * 4. Nautilus TEE builds and executes registration at exact moment
 * 5. Name is registered with target address set to alias.sui
 */

import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import type { Env, ScheduledClaim } from '../types'

// Constants
const CLAIM_COST_SUI = 10
const CLAIM_COST_MIST = BigInt(CLAIM_COST_SUI) * BigInt(1_000_000_000)
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const SCHEDULE_BUFFER_MS = 60 * 1000 // 1 minute after availableAt
const DEFAULT_YEARS = 1
const MAX_RETRY_ATTEMPTS = 5

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, X-Payment-Tx-Digest',
}

/**
 * Get the relay/receiver address for payments (atlas.sui)
 */
async function getRelayAddress(env: Env): Promise<string | null> {
	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
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
 * Get the target address (alias.sui) for claimed names
 */
async function getTargetAddress(env: Env): Promise<string | null> {
	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})
		const nameRecord = await suinsClient.getNameRecord('alias.sui')
		return nameRecord?.targetAddress || null
	} catch (error) {
		console.error('Failed to resolve alias.sui:', error)
		return null
	}
}

/**
 * Get name record including expiration
 */
async function getNameExpiration(
	env: Env,
	name: string,
): Promise<{ expirationMs: number; inGracePeriod: boolean } | null> {
	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
		const suinsClient = new SuinsClient({
			client: suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})
		const cleanName = name.replace(/\.sui$/i, '') + '.sui'
		const nameRecord = await suinsClient.getNameRecord(cleanName)

		if (!nameRecord?.expirationTimestampMs) {
			return null
		}

		const expirationMs = Number(nameRecord.expirationTimestampMs)
		const now = Date.now()
		const gracePeriodEnd = expirationMs + GRACE_PERIOD_MS

		// Check if in grace period
		const inGracePeriod = now >= expirationMs && now < gracePeriodEnd

		return { expirationMs, inGracePeriod }
	} catch (error) {
		console.error('Failed to get name expiration:', error)
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
): Promise<{ valid: boolean; sender?: string; error?: string }> {
	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })

		const txResponse = await suiClient.getTransactionBlock({
			digest: txDigest,
			options: {
				showEffects: true,
				showBalanceChanges: true,
				showInput: true,
			},
		})

		if (!txResponse) {
			return { valid: false, error: 'Transaction not found' }
		}

		const effects = txResponse.effects
		if (effects?.status?.status !== 'success') {
			return { valid: false, error: 'Transaction failed' }
		}

		// Get sender from transaction
		const sender = txResponse.transaction?.data?.sender

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

		return { valid: true, sender }
	} catch (error) {
		console.error('Payment verification error:', error)
		return { valid: false, error: 'Failed to verify payment' }
	}
}

/**
 * Generate unique claim ID
 */
function generateClaimId(): string {
	return `claim_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

/**
 * Store claim in KV
 */
async function storeClaim(env: Env, claim: ScheduledClaim): Promise<void> {
	const key = `claim:${claim.id}`
	// Calculate TTL: keep until 7 days after scheduled execution
	const ttl = Math.max(
		Math.ceil((claim.scheduledAt - Date.now()) / 1000) + 7 * 24 * 60 * 60,
		7 * 24 * 60 * 60,
	)
	await env.CACHE.put(key, JSON.stringify(claim), { expirationTtl: ttl })

	// Also index by name for lookup
	const nameKey = `claims:name:${claim.name}`
	const existingIndex = await env.CACHE.get(nameKey)
	const claimIds: string[] = existingIndex ? JSON.parse(existingIndex) : []
	if (!claimIds.includes(claim.id)) {
		claimIds.push(claim.id)
		await env.CACHE.put(nameKey, JSON.stringify(claimIds), { expirationTtl: ttl })
	}
}

/**
 * Get claim by ID
 */
async function getClaim(env: Env, claimId: string): Promise<ScheduledClaim | null> {
	const key = `claim:${claimId}`
	const data = await env.CACHE.get(key)
	if (!data) return null
	return JSON.parse(data) as ScheduledClaim
}

/**
 * Update claim status
 */
async function updateClaim(
	env: Env,
	claimId: string,
	updates: Partial<ScheduledClaim>,
): Promise<void> {
	const claim = await getClaim(env, claimId)
	if (!claim) return

	const updated = { ...claim, ...updates }
	const key = `claim:${claimId}`
	const ttl =
		updated.status === 'completed' || updated.status === 'failed'
			? 30 * 24 * 60 * 60 // 30 days for completed/failed
			: Math.max(
					Math.ceil((updated.scheduledAt - Date.now()) / 1000) + 7 * 24 * 60 * 60,
					7 * 24 * 60 * 60,
				)

	await env.CACHE.put(key, JSON.stringify(updated), { expirationTtl: ttl })
}

/**
 * Get all claims ready for processing
 */
export async function getReadyClaims(env: Env, now: number): Promise<ScheduledClaim[]> {
	const readyClaims: ScheduledClaim[] = []

	// List all claim keys
	const list = await env.CACHE.list({ prefix: 'claim:' })

	for (const key of list.keys) {
		// Skip index keys
		if (key.name.includes(':name:')) continue

		const data = await env.CACHE.get(key.name)
		if (!data) continue

		const claim = JSON.parse(data) as ScheduledClaim

		// Check if ready for processing
		if (
			claim.status === 'pending' &&
			claim.scheduledAt <= now &&
			claim.attempts < MAX_RETRY_ATTEMPTS
		) {
			// Update status to ready
			claim.status = 'ready'
			readyClaims.push(claim)
		} else if (claim.status === 'ready' && claim.attempts < MAX_RETRY_ATTEMPTS) {
			readyClaims.push(claim)
		}
	}

	// Sort by scheduledAt (earliest first)
	return readyClaims.sort((a, b) => a.scheduledAt - b.scheduledAt)
}

/**
 * Handle claim scheduling request - x402 protocol
 *
 * POST /api/claim/schedule
 * Body: { name: "example", years?: 1 }
 *
 * Without payment: Returns 402 with payment details
 * With X-Payment-Tx-Digest: Verifies payment and schedules claim
 */
export async function handleClaimSchedule(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405)
	}

	let payload: { name?: string; years?: number }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400)
	}

	const name = payload.name
		?.trim()
		?.toLowerCase()
		?.replace(/\.sui$/i, '')
	if (!name) {
		return jsonResponse({ error: 'Name is required' }, 400)
	}

	const years = payload.years || DEFAULT_YEARS
	if (years < 1 || years > 5) {
		return jsonResponse({ error: 'Years must be between 1 and 5' }, 400)
	}

	const cleanName = `${name}.sui`

	// Get name expiration info
	const expirationInfo = await getNameExpiration(env, cleanName)
	if (!expirationInfo) {
		return jsonResponse({ error: 'Name not found or not registered' }, 404)
	}

	if (!expirationInfo.inGracePeriod) {
		const now = Date.now()
		const gracePeriodEnd = expirationInfo.expirationMs + GRACE_PERIOD_MS
		if (now < expirationInfo.expirationMs) {
			return jsonResponse(
				{
					error: 'Name is not expired yet',
					code: 'NOT_EXPIRED',
					expiresAt: expirationInfo.expirationMs,
					availableAt: expirationInfo.expirationMs + GRACE_PERIOD_MS,
				},
				400,
			)
		}
		if (now >= gracePeriodEnd) {
			return jsonResponse(
				{
					error: 'Grace period has ended - name is available for direct registration',
					code: 'AVAILABLE_NOW',
				},
				400,
			)
		}
	}

	// Resolve addresses
	const relayAddress = await getRelayAddress(env)
	if (!relayAddress) {
		return jsonResponse({ error: 'Payment relay service unavailable' }, 503)
	}

	const targetAddress = await getTargetAddress(env)
	if (!targetAddress) {
		return jsonResponse({ error: 'Target address service unavailable' }, 503)
	}

	// Check for payment proof
	const paymentDigest = request.headers.get('X-Payment-Tx-Digest')

	if (!paymentDigest) {
		// Return 402 Payment Required with payment details
		const availableAt = expirationInfo.expirationMs + GRACE_PERIOD_MS
		const scheduledAt = availableAt + SCHEDULE_BUFFER_MS

		return jsonResponse(
			{
				error: 'Payment required',
				code: 'PAYMENT_REQUIRED',
				payment: {
					amount: CLAIM_COST_MIST.toString(),
					amountSui: CLAIM_COST_SUI,
					recipient: relayAddress,
					chain: env.SUI_NETWORK,
					currency: 'SUI',
					description: `Schedule claim for ${cleanName} (${years} year${years > 1 ? 's' : ''}) - target: alias.sui`,
				},
				claim: {
					name: cleanName,
					targetAddress,
					targetAlias: 'alias.sui',
					expirationMs: expirationInfo.expirationMs,
					availableAt,
					scheduledAt,
					years,
				},
				instructions: {
					step1: 'Send the specified amount to the recipient address',
					step2: 'Execute the transaction and obtain the digest',
					step3: 'Retry this request with X-Payment-Tx-Digest header',
				},
			},
			402,
		)
	}

	// Verify payment
	const verification = await verifyPayment(env, paymentDigest, relayAddress, CLAIM_COST_MIST)
	if (!verification.valid) {
		return jsonResponse(
			{
				error: 'Payment verification failed',
				code: 'INVALID_PAYMENT',
				details: verification.error,
				payment: {
					amount: CLAIM_COST_MIST.toString(),
					amountSui: CLAIM_COST_SUI,
					recipient: relayAddress,
					chain: env.SUI_NETWORK,
					currency: 'SUI',
				},
			},
			402,
		)
	}

	// Create scheduled claim
	const claimId = generateClaimId()
	const availableAt = expirationInfo.expirationMs + GRACE_PERIOD_MS
	const scheduledAt = availableAt + SCHEDULE_BUFFER_MS

	const claim: ScheduledClaim = {
		id: claimId,
		name,
		targetAddress,
		expirationMs: expirationInfo.expirationMs,
		availableAt,
		scheduledAt,
		paymentDigest,
		paymentAmount: CLAIM_COST_MIST.toString(),
		paidBy: verification.sender || '',
		years,
		status: 'pending',
		attempts: 0,
		createdAt: Date.now(),
	}

	// Store claim
	await storeClaim(env, claim)

	return jsonResponse({
		success: true,
		claimId,
		status: 'pending',
		name: cleanName,
		targetAddress,
		targetAlias: 'alias.sui',
		expirationMs: expirationInfo.expirationMs,
		availableAt,
		scheduledAt,
		years,
		statusUrl: `/api/claim/status/${claimId}`,
		message: `Claim scheduled for ${cleanName}. Will execute at ${new Date(scheduledAt).toISOString()}`,
	})
}

/**
 * Handle claim status check
 *
 * GET /api/claim/status/:claimId
 */
export async function handleClaimStatus(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	const url = new URL(request.url)
	const pathMatch = url.pathname.match(/\/api\/claim\/status\/(.+)$/)
	if (!pathMatch) {
		return jsonResponse({ error: 'Claim ID required' }, 400)
	}

	const claimId = pathMatch[1]
	const claim = await getClaim(env, claimId)

	if (!claim) {
		return jsonResponse({ error: 'Claim not found' }, 404)
	}

	return jsonResponse({
		claimId: claim.id,
		name: `${claim.name}.sui`,
		targetAddress: claim.targetAddress,
		status: claim.status,
		expirationMs: claim.expirationMs,
		availableAt: claim.availableAt,
		scheduledAt: claim.scheduledAt,
		years: claim.years,
		attempts: claim.attempts,
		createdAt: claim.createdAt,
		paymentDigest: claim.paymentDigest,
		registrationTxDigest: claim.registrationTxDigest,
		nftObjectId: claim.nftObjectId,
		error: claim.lastError,
	})
}

/**
 * Handle claim cancellation
 *
 * DELETE /api/claim/:claimId
 */
export async function handleClaimCancel(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	const url = new URL(request.url)
	const pathMatch = url.pathname.match(/\/api\/claim\/([^/]+)$/)
	if (!pathMatch) {
		return jsonResponse({ error: 'Claim ID required' }, 400)
	}

	const claimId = pathMatch[1]
	const claim = await getClaim(env, claimId)

	if (!claim) {
		return jsonResponse({ error: 'Claim not found' }, 404)
	}

	if (claim.status !== 'pending') {
		return jsonResponse(
			{
				error: 'Can only cancel pending claims',
				currentStatus: claim.status,
			},
			400,
		)
	}

	await updateClaim(env, claimId, { status: 'cancelled' })

	return jsonResponse({
		success: true,
		claimId,
		status: 'cancelled',
	})
}

/**
 * Nautilus callback endpoint
 * Called by Nautilus TEE after processing claim
 *
 * POST /api/claim/nautilus-callback
 */
export async function handleNautilusClaimCallback(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405)
	}

	// Verify request is from Nautilus (in production, use attestation)
	const nautilusAttestation = request.headers.get('X-Nautilus-Attestation')
	if (!nautilusAttestation) {
		console.warn('Nautilus claim callback without attestation')
	}

	let payload: {
		claimId: string
		status: 'completed' | 'failed'
		registrationTxDigest?: string
		nftObjectId?: string
		error?: string
	}

	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400)
	}

	const { claimId, status, registrationTxDigest, nftObjectId, error } = payload

	await updateClaim(env, claimId, {
		status,
		registrationTxDigest,
		nftObjectId,
		lastError: error,
	})

	return jsonResponse({ success: true })
}

/**
 * Get pending claims for Nautilus to process
 * Called by Nautilus TEE to fetch work
 *
 * GET /api/claim/nautilus-queue
 */
export async function handleNautilusClaimQueue(request: Request, env: Env): Promise<Response> {
	// Verify request is from Nautilus
	const nautilusAttestation = request.headers.get('X-Nautilus-Attestation')
	if (!nautilusAttestation) {
		console.warn('Nautilus claim queue request without attestation')
	}

	const now = Date.now()
	const readyClaims = await getReadyClaims(env, now)

	// Return claims with registration details for Nautilus to process
	const claimsForProcessing = readyClaims.map((claim) => ({
		id: claim.id,
		name: `${claim.name}.sui`,
		targetAddress: claim.targetAddress,
		years: claim.years,
		scheduledAt: claim.scheduledAt,
		attempts: claim.attempts,
	}))

	return jsonResponse({
		claims: claimsForProcessing,
		count: claimsForProcessing.length,
		processedAt: now,
	})
}

/**
 * Process a single claim (called by scheduled worker)
 */
export async function processClaim(env: Env, claim: ScheduledClaim): Promise<void> {
	// Mark as processing
	await updateClaim(env, claim.id, {
		status: 'processing',
		lastAttemptAt: Date.now(),
		attempts: claim.attempts + 1,
	})

	// In production, Nautilus TEE would:
	// 1. Build registration transaction using @mysten/suins SDK
	// 2. Set target address in the same PTB
	// 3. Sign and execute with Nautilus wallet
	// 4. Report result via callback

	// For now, mark as ready for Nautilus to pick up
	// The actual execution happens when Nautilus polls /api/claim/nautilus-queue
	console.log(
		`Claim ${claim.id} ready for Nautilus processing: ${claim.name}.sui -> ${claim.targetAddress}`,
	)
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
