import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'
import { getSuiGraphQLUrl } from '../utils/sui-graphql'

// Rate limiting - simple in-memory counter (use Durable Objects for production)
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 100 // requests per minute
const RATE_WINDOW = 60000 // 1 minute in ms

/**
 * Handle GraphQL proxy requests.
 * Accepts POST /api/rpc with JSON body { query, variables? }.
 * Read-only constraint: mutations are rejected.
 */
export async function handleRPCRequest(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return errorResponse(
			'Method not allowed. Use POST with { query, variables }.',
			'METHOD_NOT_ALLOWED',
			405,
		)
	}

	// Rate limiting by IP
	const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
	if (!checkRateLimit(clientIP)) {
		return errorResponse('Rate limit exceeded. Please try again later.', 'RATE_LIMITED', 429)
	}

	let body: { query?: string; variables?: Record<string, unknown> }
	try {
		body = await request.json()
	} catch {
		return errorResponse('Invalid JSON body', 'PARSE_ERROR', 400)
	}

	const { query, variables } = body

	if (!query || typeof query !== 'string') {
		return errorResponse('Missing "query" field', 'INVALID_REQUEST', 400)
	}

	// Reject mutations (read-only constraint)
	const trimmed = query.trimStart()
	if (/^mutation\b/i.test(trimmed)) {
		return errorResponse(
			'Mutations are not allowed through the public RPC proxy.',
			'MUTATION_FORBIDDEN',
			403,
		)
	}

	const graphqlUrl = getSuiGraphQLUrl(env)

	try {
		const upstream = await fetch(graphqlUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables: variables ?? {} }),
		})

		const result = await upstream.json()
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return errorResponse(`Upstream GraphQL error: ${message}`, 'UPSTREAM_ERROR', 502)
	}
}

/**
 * Simple rate limiting check
 */
function checkRateLimit(clientIP: string): boolean {
	const now = Date.now()
	const record = requestCounts.get(clientIP)

	if (!record || now > record.resetAt) {
		requestCounts.set(clientIP, { count: 1, resetAt: now + RATE_WINDOW })
		return true
	}

	if (record.count >= RATE_LIMIT) {
		return false
	}

	record.count++
	return true
}

/**
 * Get current network status via GraphQL
 */
export async function getNetworkStatus(env: Env): Promise<{
	network: string
	chainId: string
	latestCheckpoint: string
}> {
	const graphqlUrl = getSuiGraphQLUrl(env)

	try {
		const response = await fetch(graphqlUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				query: `{ chainIdentifier currentEpoch { epochId } }`,
			}),
		})

		const result = (await response.json()) as {
			data?: { chainIdentifier?: string; currentEpoch?: { epochId?: string } }
		}

		return {
			network: env.SUI_NETWORK,
			chainId: result.data?.chainIdentifier ?? 'unknown',
			latestCheckpoint: result.data?.currentEpoch?.epochId ?? 'unknown',
		}
	} catch {
		return { network: env.SUI_NETWORK, chainId: 'unknown', latestCheckpoint: 'unknown' }
	}
}
