import type { Env, Bounty, PublicBounty } from '../types'
import { relaySignedTransaction } from '../utils/transactions'
import { buildExecuteBountyTx, buildCreateBountyTx, serializeTransaction } from '../utils/bounty-transactions'
import { jsonResponse } from '../utils/response'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

// Minimum executor reward: 1 SUI in MIST
const MIN_EXECUTOR_REWARD_MIST = '1000000000'

/**
 * Handle bounty API requests
 *
 * POST /api/bounties - Create a new bounty
 * GET /api/bounties/:name - Get bounties for a name
 * GET /api/bounties/:name/:id - Get specific bounty
 * DELETE /api/bounties/:name/:id - Cancel a bounty
 * POST /api/bounties/:name/:id/build-tx - Build unsigned execution tx
 * POST /api/bounties/:name/:id/attach-tx - Attach pre-signed tx to bounty
 * POST /api/bounties/execute/:id - Execute a ready bounty
 */
export async function handleBountiesRequest(request: Request, env: Env): Promise<Response> {
	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	const url = new URL(request.url)
	const pathParts = url.pathname.replace('/api/bounties', '').split('/').filter(Boolean)

	try {
		// POST /api/bounties/build-create - Build create bounty transaction
		if (request.method === 'POST' && pathParts[0] === 'build-create') {
			return handleBuildCreateBountyTx(request, env)
		}

		// POST /api/bounties - Create bounty
		if (request.method === 'POST' && pathParts.length === 0) {
			return handleCreateBounty(request, env)
		}

		// POST /api/bounties/execute/:id - Execute bounty
		if (request.method === 'POST' && pathParts[0] === 'execute' && pathParts[1]) {
			return handleExecuteBounty(pathParts[1], env)
		}

		// Routes with name parameter
		const name = pathParts[0]?.toLowerCase()
		if (!name) {
			return jsonResponse({ error: 'Name parameter required' }, 400)
		}

		// POST /api/bounties/:name/:id/build-tx - Build execution tx
		if (request.method === 'POST' && pathParts[2] === 'build-tx' && pathParts[1]) {
			return handleBuildTx(name, pathParts[1], request, env)
		}

		// POST /api/bounties/:name/:id/attach-tx - Attach pre-signed tx
		if (request.method === 'POST' && pathParts[2] === 'attach-tx' && pathParts[1]) {
			return handleAttachTx(name, pathParts[1], request, env)
		}

		// GET /api/bounties/:name - List bounties for name
		if (request.method === 'GET' && pathParts.length === 1) {
			return handleGetBounties(name, env, url.searchParams)
		}

		// GET /api/bounties/:name/:id - Get specific bounty
		if (request.method === 'GET' && pathParts.length === 2) {
			return handleGetBounty(name, pathParts[1], env)
		}

		// DELETE /api/bounties/:name/:id - Cancel bounty
		if (request.method === 'DELETE' && pathParts.length === 2) {
			return handleCancelBounty(name, pathParts[1], request, env)
		}

		return jsonResponse({ error: 'Not found' }, 404)
	} catch (error) {
		console.error('Bounty API error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: message }, 500)
	}
}

/**
 * Build create bounty escrow transaction
 */
async function handleBuildCreateBountyTx(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as {
		name?: string
		beneficiary?: string
		coinObjectId?: string
		totalAmountMist?: string
		executorRewardMist?: string
		availableAt?: number
		years?: number
	}

	const {
		name,
		beneficiary,
		coinObjectId,
		totalAmountMist,
		executorRewardMist,
		availableAt,
		years = 1,
	} = body

	if (!name || !beneficiary || !coinObjectId || !totalAmountMist || !executorRewardMist || !availableAt) {
		return jsonResponse(
			{
				error: 'Missing required fields: name, beneficiary, coinObjectId, totalAmountMist, executorRewardMist, availableAt',
			},
			400,
		)
	}

	try {
		const tx = buildCreateBountyTx(
			{
				name: name.toLowerCase().replace(/\.sui$/i, ''),
				beneficiary,
				coinObjectId,
				totalAmountMist,
				executorRewardMist,
				availableAt,
				years,
			},
			env,
		)

		const { txBytes } = await serializeTransaction(tx, env, beneficiary)

		return jsonResponse({
			success: true,
			transaction: txBytes,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build transaction'
		return jsonResponse({ error: message }, 500)
	}
}

/**
 * Create a new bounty
 */
async function handleCreateBounty(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as {
		name?: string
		beneficiary?: string
		creator?: string
		escrowObjectId?: string
		totalAmountMist?: string
		executorRewardMist?: string
		registrationCostMist?: string
		paymentCurrency?: 'sui' | 'ns'
		availableAt?: number
		years?: number
	}

	const {
		name,
		beneficiary,
		creator,
		escrowObjectId,
		totalAmountMist,
		executorRewardMist,
		registrationCostMist,
		paymentCurrency = 'sui',
		availableAt,
		years = 1,
	} = body

	// Validate required fields
	if (!name || !beneficiary || !creator || !escrowObjectId || !totalAmountMist || !executorRewardMist || !availableAt) {
		return jsonResponse(
			{
				error: 'Missing required fields: name, beneficiary, creator, escrowObjectId, totalAmountMist, executorRewardMist, availableAt',
			},
			400,
		)
	}

	const totalAmount = BigInt(totalAmountMist)
	const executorReward = BigInt(executorRewardMist)

	// Validate executor reward minimum
	if (executorReward < BigInt(MIN_EXECUTOR_REWARD_MIST)) {
		return jsonResponse({ error: `Executor reward must be at least 1 SUI (${MIN_EXECUTOR_REWARD_MIST} MIST)` }, 400)
	}

	if (totalAmount < executorReward) {
		return jsonResponse({ error: 'Total amount must be greater than or equal to executor reward' }, 400)
	}

	const escrowId = escrowObjectId.trim()
	if (!/^0x[0-9a-f]{64}$/i.test(escrowId)) {
		return jsonResponse({ error: 'escrowObjectId must be a valid 0x-prefixed object id' }, 400)
	}

	// Validate years
	if (years < 1 || years > 5) {
		return jsonResponse({ error: 'Years must be between 1 and 5' }, 400)
	}

	const effectiveRegistrationMist =
		registrationCostMist && BigInt(registrationCostMist) > BigInt(0)
			? registrationCostMist
			: (totalAmount - executorReward).toString()

	const cleanName = name.toLowerCase().replace(/\.sui$/i, '')
	const bountyId = `bounty_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
	const now = Date.now()

	const bounty: Bounty = {
		id: bountyId,
		name: cleanName,
		beneficiary,
		creator,
		escrowObjectId: escrowId,
		totalAmountMist: totalAmount.toString(),
		executorRewardMist: executorReward.toString(),
		registrationCostMist: effectiveRegistrationMist,
		paymentCurrency,
		availableAt,
		years,
		status: 'pending',
		createdAt: now,
		updatedAt: now,
		attempts: 0,
	}

	// Store bounty
	await env.CACHE.put(`bounty:${bountyId}`, JSON.stringify(bounty), {
		expirationTtl: 30 * 24 * 60 * 60, // 30 days
	})

	// Add to name index
	const indexKey = `bounties:name:${cleanName}`
	const existingIndex = await env.CACHE.get(indexKey)
	const index: string[] = existingIndex ? JSON.parse(existingIndex) : []
	if (!index.includes(bountyId)) {
		index.push(bountyId)
		await env.CACHE.put(indexKey, JSON.stringify(index), {
			expirationTtl: 30 * 24 * 60 * 60,
		})
	}

	// Add to pending index
	const pendingKey = 'bounties:pending'
	const pendingIndex = await env.CACHE.get(pendingKey)
	const pending: string[] = pendingIndex ? JSON.parse(pendingIndex) : []
	if (!pending.includes(bountyId)) {
		pending.push(bountyId)
		await env.CACHE.put(pendingKey, JSON.stringify(pending), {
			expirationTtl: 30 * 24 * 60 * 60,
		})
	}

	return jsonResponse({ bounty: toPublicBounty(bounty) }, 201)
}

/**
 * Get all bounties for a name
 */
async function handleGetBounties(name: string, env: Env, searchParams?: URLSearchParams): Promise<Response> {
	const indexKey = `bounties:name:${name}`
	const indexData = await env.CACHE.get(indexKey)

	if (!indexData) {
		return jsonResponse({ bounties: [] })
	}

	const bountyIds: string[] = JSON.parse(indexData)
	const bounties: PublicBounty[] = []
	const creatorFilter = searchParams?.get('creator')?.toLowerCase()

	for (const id of bountyIds) {
		const bountyData = await env.CACHE.get(`bounty:${id}`)
		if (bountyData) {
			const bounty: Bounty = JSON.parse(bountyData)
			if (creatorFilter && bounty.creator.toLowerCase() !== creatorFilter) {
				continue
			}
			bounties.push(toPublicBounty(bounty))
		}
	}

	// Sort by total amount (highest first)
	bounties.sort((a, b) => Number(BigInt(b.totalAmountMist) - BigInt(a.totalAmountMist)))

	return jsonResponse({ bounties })
}

/**
 * Get a specific bounty
 */
async function handleGetBounty(name: string, bountyId: string, env: Env): Promise<Response> {
	const bountyData = await env.CACHE.get(`bounty:${bountyId}`)

	if (!bountyData) {
		return jsonResponse({ error: 'Bounty not found' }, 404)
	}

	const bounty: Bounty = JSON.parse(bountyData)

	if (bounty.name !== name) {
		return jsonResponse({ error: 'Bounty not found for this name' }, 404)
	}

	return jsonResponse({ bounty: toPublicBounty(bounty) })
}

/**
 * Cancel a bounty
 */
async function handleCancelBounty(name: string, bountyId: string, request: Request, env: Env): Promise<Response> {
	const body = (await request.json().catch(() => ({}))) as { creator?: string }

	const bountyData = await env.CACHE.get(`bounty:${bountyId}`)
	if (!bountyData) {
		return jsonResponse({ error: 'Bounty not found' }, 404)
	}

	const bounty: Bounty = JSON.parse(bountyData)

	if (bounty.name !== name) {
		return jsonResponse({ error: 'Bounty not found for this name' }, 404)
	}

	// Verify creator
	if (body.creator && bounty.creator !== body.creator) {
		return jsonResponse({ error: 'Only the creator can cancel this bounty' }, 403)
	}

	// Cannot cancel if already executed or has pre-signed tx
	if (bounty.status === 'completed' || bounty.status === 'executing') {
		return jsonResponse({ error: 'Cannot cancel bounty in current state' }, 400)
	}

	if (bounty.txBytes) {
		return jsonResponse({ error: 'Cannot cancel bounty with attached transaction. Use on-chain cancellation.' }, 400)
	}

	// Update status
	bounty.status = 'cancelled'
	bounty.updatedAt = Date.now()
	await env.CACHE.put(`bounty:${bountyId}`, JSON.stringify(bounty))

	// Remove from pending index
	await removeFromPendingIndex(bountyId, env)

	return jsonResponse({ success: true, bounty: toPublicBounty(bounty) })
}

/**
 * Build an unsigned execution transaction
 */
async function handleBuildTx(
	name: string,
	bountyId: string,
	request: Request,
	env: Env,
): Promise<Response> {
	const body = (await request.json()) as { executorAddress?: string }

	const bountyData = await env.CACHE.get(`bounty:${bountyId}`)
	if (!bountyData) {
		return jsonResponse({ error: 'Bounty not found' }, 404)
	}

	const bounty: Bounty = JSON.parse(bountyData)

	if (bounty.name !== name) {
		return jsonResponse({ error: 'Bounty not found for this name' }, 404)
	}

	if (bounty.status !== 'pending' && bounty.status !== 'ready') {
		return jsonResponse({ error: 'Bounty is not in a valid state for transaction building' }, 400)
	}

	const executorAddress = body.executorAddress
	if (!executorAddress) {
		return jsonResponse({ error: 'executorAddress is required' }, 400)
	}

	// Build the execution transaction
	const tx = buildExecuteBountyTx(
		{
			bountyObjectId: bounty.escrowObjectId,
			name: bounty.name,
			beneficiary: bounty.beneficiary,
			years: bounty.years,
		},
		env,
	)

	// Serialize for signing
	const { txBytes, digest } = await serializeTransaction(tx, env, executorAddress)

	return jsonResponse({
		txBytes,
		digest,
		bountyId,
		message: 'Sign this transaction and attach it to the bounty using /attach-tx',
	})
}

/**
 * Attach a pre-signed transaction to a bounty
 */
async function handleAttachTx(
	name: string,
	bountyId: string,
	request: Request,
	env: Env,
): Promise<Response> {
	const body = (await request.json()) as {
		txBytes?: string
		signatures?: string[] | string
		signature?: string
		creator?: string
	}

	const bountyData = await env.CACHE.get(`bounty:${bountyId}`)
	if (!bountyData) {
		return jsonResponse({ error: 'Bounty not found' }, 404)
	}

	const bounty: Bounty = JSON.parse(bountyData)

	if (bounty.name !== name) {
		return jsonResponse({ error: 'Bounty not found for this name' }, 404)
	}

	// Verify creator
	if (body.creator && bounty.creator !== body.creator) {
		return jsonResponse({ error: 'Only the creator can attach transactions' }, 403)
	}

	if (!body.txBytes) {
		return jsonResponse({ error: 'txBytes and signatures are required' }, 400)
	}

	// Normalize signatures to array
	const signatures: string[] = []
	if (Array.isArray(body.signatures)) {
		signatures.push(...body.signatures.filter(Boolean))
	} else if (typeof body.signatures === 'string' && body.signatures.trim()) {
		signatures.push(body.signatures)
	}
	if (body.signature && body.signature.trim()) {
		signatures.push(body.signature.trim())
	}
	if (signatures.length === 0) {
		return jsonResponse({ error: 'At least one signature is required' }, 400)
	}

	// Update bounty with transaction
	bounty.txBytes = body.txBytes
	bounty.signatures = signatures
	bounty.status = 'ready'
	bounty.updatedAt = Date.now()

	await env.CACHE.put(`bounty:${bountyId}`, JSON.stringify(bounty))

	return jsonResponse({
		success: true,
		bounty: toPublicBounty(bounty),
		message: 'Transaction attached. Bounty will be executed when the grace period ends.',
	})
}

/**
 * Execute a ready bounty
 */
async function handleExecuteBounty(bountyId: string, env: Env): Promise<Response> {
	const bountyData = await env.CACHE.get(`bounty:${bountyId}`)
	if (!bountyData) {
		return jsonResponse({ error: 'Bounty not found' }, 404)
	}

	const bounty: Bounty = JSON.parse(bountyData)

	// Check if bounty is ready
	if (bounty.status !== 'ready') {
		return jsonResponse({ error: `Bounty is not ready for execution (status: ${bounty.status})` }, 400)
	}

	// Check if grace period has ended
	const now = Date.now()
	if (now < bounty.availableAt) {
		const waitMs = bounty.availableAt - now
		return jsonResponse({
			error: 'Grace period has not ended yet',
			availableAt: bounty.availableAt,
			waitMs,
		}, 400)
	}

	// Check if we have the pre-signed transaction
	if (!bounty.txBytes || !bounty.signatures || bounty.signatures.length === 0) {
		return jsonResponse({ error: 'Bounty does not have a pre-signed transaction' }, 400)
	}

	// Update status to executing
	bounty.status = 'executing'
	bounty.attempts += 1
	bounty.updatedAt = now
	await env.CACHE.put(`bounty:${bountyId}`, JSON.stringify(bounty))

	// Broadcast the transaction
	const result = await relaySignedTransaction(env, bounty.txBytes, bounty.signatures)

	if (result.ok) {
		// Success!
		bounty.status = 'completed'
		bounty.resultDigest = (result.response as { result?: { digest?: string } })?.result?.digest
		bounty.updatedAt = Date.now()

		// Remove from pending index
		await removeFromPendingIndex(bountyId, env)
	} else {
		// Failed - mark as failed but keep for retry
		bounty.status = 'failed'
		bounty.lastError = result.error || 'Transaction execution failed'
		bounty.updatedAt = Date.now()
	}

	await env.CACHE.put(`bounty:${bountyId}`, JSON.stringify(bounty))

	return jsonResponse({
		success: result.ok,
		bounty: toPublicBounty(bounty),
		txResult: result,
	})
}

/**
 * Get all ready bounties (for scheduled execution)
 */
export async function getReadyBounties(env: Env): Promise<Bounty[]> {
	const pendingIndex = await env.CACHE.get('bounties:pending')
	if (!pendingIndex) return []

	const bountyIds: string[] = JSON.parse(pendingIndex)
	const readyBounties: Bounty[] = []
	const now = Date.now()

	for (const id of bountyIds) {
		const bountyData = await env.CACHE.get(`bounty:${id}`)
		if (!bountyData) continue

		const bounty: Bounty = JSON.parse(bountyData)
		if (bounty.status === 'ready' && now >= bounty.availableAt) {
			readyBounties.push(bounty)
		}
	}

	return readyBounties
}

/**
 * Execute all ready bounties (called from scheduled handler)
 */
export async function executeReadyBounties(env: Env): Promise<{ executed: number; failed: number }> {
	const bounties = await getReadyBounties(env)
	let executed = 0
	let failed = 0

	for (const bounty of bounties) {
		try {
			const result = await relaySignedTransaction(env, bounty.txBytes!, bounty.signatures!)

			if (result.ok) {
				bounty.status = 'completed'
				bounty.resultDigest = (result.response as { result?: { digest?: string } })?.result?.digest
				executed++
			} else {
				bounty.status = 'failed'
				bounty.lastError = result.error
				failed++
			}

			bounty.attempts += 1
			bounty.updatedAt = Date.now()
			await env.CACHE.put(`bounty:${bounty.id}`, JSON.stringify(bounty))

			if (bounty.status === 'completed' || bounty.status === 'failed') {
				await removeFromPendingIndex(bounty.id, env)
			}
		} catch (error) {
			console.error(`Failed to execute bounty ${bounty.id}:`, error)
			failed++
		}
	}

	return { executed, failed }
}

// Helper functions
async function removeFromPendingIndex(bountyId: string, env: Env): Promise<void> {
	const pendingKey = 'bounties:pending'
	const pendingData = await env.CACHE.get(pendingKey)
	if (!pendingData) return

	const pending: string[] = JSON.parse(pendingData)
	const filtered = pending.filter((id) => id !== bountyId)
	await env.CACHE.put(pendingKey, JSON.stringify(filtered))
}

function toPublicBounty(bounty: Bounty): PublicBounty {
	const { txBytes, signatures, ...publicData } = bounty
	return {
		...publicData,
		hasSignedTx: Boolean(txBytes && signatures && signatures.length > 0),
	}
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...CORS_HEADERS,
		},
	})
}
