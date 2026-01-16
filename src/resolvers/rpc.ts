import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'

// Allowed RPC methods - limit to read-only operations for public gateway
const ALLOWED_METHODS = new Set([
	// Read methods
	'sui_getObject',
	'sui_multiGetObjects',
	'sui_getOwnedObjects',
	'sui_getTotalTransactionBlocks',
	'sui_getTransactionBlock',
	'sui_multiGetTransactionBlocks',
	'sui_getEvents',
	'sui_getLatestCheckpointSequenceNumber',
	'sui_getCheckpoint',
	'sui_getCheckpoints',
	'sui_getProtocolConfig',
	'sui_getChainIdentifier',
	// Coin queries
	'suix_getBalance',
	'suix_getAllBalances',
	'suix_getCoins',
	'suix_getTotalSupply',
	'suix_getCoinMetadata',
	// Name service
	'suix_resolveNameServiceAddress',
	'suix_resolveNameServiceNames',
	// Move
	'sui_getNormalizedMoveModulesByPackage',
	'sui_getNormalizedMoveModule',
	'sui_getNormalizedMoveFunction',
	'sui_getNormalizedMoveStruct',
	'sui_getMoveFunctionArgTypes',
	// Dynamic fields
	'suix_getDynamicFields',
	'suix_getDynamicFieldObject',
	// Dry run (no state changes)
	'sui_dryRunTransactionBlock',
	'sui_devInspectTransactionBlock',
])

// Rate limiting - simple in-memory counter (use Durable Objects for production)
const requestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 100 // requests per minute
const RATE_WINDOW = 60000 // 1 minute in ms

/**
 * Handle RPC proxy requests
 */
export async function handleRPCRequest(request: Request, env: Env): Promise<Response> {
	// Only allow POST for JSON-RPC
	if (request.method !== 'POST') {
		return errorResponse(
			'Method not allowed. Use POST for JSON-RPC requests.',
			'METHOD_NOT_ALLOWED',
			405,
		)
	}

	// Rate limiting by IP
	const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
	if (!checkRateLimit(clientIP)) {
		return errorResponse('Rate limit exceeded. Please try again later.', 'RATE_LIMITED', 429)
	}

	// Parse the JSON-RPC request
	let rpcRequest: JsonRpcRequest | JsonRpcRequest[]
	try {
		rpcRequest = await request.json()
	} catch {
		return errorResponse('Invalid JSON', 'PARSE_ERROR', 400)
	}

	// Handle batch requests
	if (Array.isArray(rpcRequest)) {
		const results = await Promise.all(rpcRequest.map((req) => processRPCRequest(req, env)))
		return jsonResponse(results)
	}

	// Single request
	const result = await processRPCRequest(rpcRequest, env)
	return jsonResponse(result)
}

interface JsonRpcRequest {
	jsonrpc: string
	id: string | number | null
	method: string
	params?: unknown[]
}

interface JsonRpcResponse {
	jsonrpc: '2.0'
	id: string | number | null
	result?: unknown
	error?: {
		code: number
		message: string
		data?: unknown
	}
}

/**
 * Process a single RPC request
 */
async function processRPCRequest(rpcRequest: JsonRpcRequest, env: Env): Promise<JsonRpcResponse> {
	const { jsonrpc, id, method, params } = rpcRequest

	// Validate JSON-RPC version
	if (jsonrpc !== '2.0') {
		return {
			jsonrpc: '2.0',
			id,
			error: { code: -32600, message: 'Invalid Request: must use JSON-RPC 2.0' },
		}
	}

	// Check if method is allowed
	if (!ALLOWED_METHODS.has(method)) {
		return {
			jsonrpc: '2.0',
			id,
			error: {
				code: -32601,
				message: `Method not allowed: ${method}. Only read-only methods are permitted.`,
			},
		}
	}

	// Forward to Sui RPC
	try {
		const response = await fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ jsonrpc, id, method, params }),
		})

		const result = (await response.json()) as JsonRpcResponse
		return result
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return {
			jsonrpc: '2.0',
			id,
			error: { code: -32603, message: `Internal error: ${message}` },
		}
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
 * Get current network status
 */
export async function getNetworkStatus(env: Env): Promise<{
	network: string
	chainId: string
	latestCheckpoint: string
}> {
	const [chainIdResponse, checkpointResponse] = await Promise.all([
		fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_getChainIdentifier',
				params: [],
			}),
		}),
		fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 2,
				method: 'sui_getLatestCheckpointSequenceNumber',
				params: [],
			}),
		}),
	])

	const chainIdResult = (await chainIdResponse.json()) as JsonRpcResponse
	const checkpointResult = (await checkpointResponse.json()) as JsonRpcResponse

	return {
		network: env.SUI_NETWORK,
		chainId: String(chainIdResult.result || 'unknown'),
		latestCheckpoint: String(checkpointResult.result || 'unknown'),
	}
}
