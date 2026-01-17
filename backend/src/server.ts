/**
 * Sui gRPC Backend Proxy Server
 *
 * High-performance backend that translates HTTP/JSON to Sui RPC calls.
 * Designed to run on a VM/container with persistent connections to Sui fullnodes.
 *
 * Features:
 * - Connection pooling to Sui nodes
 * - Request batching
 * - Response caching for read-only operations
 * - Health monitoring
 * - Rate limiting
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { SuiClient, SuiHTTPTransport } from '@mysten/sui/client'
import pino from 'pino'

// Configuration
const config = {
	port: parseInt(process.env.PORT || '8080'),
	suiRpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443',
	suiRpcUrlBackup: process.env.SUI_RPC_URL_BACKUP,
	apiKey: process.env.API_KEY,
	maxBatchSize: parseInt(process.env.MAX_BATCH_SIZE || '50'),
	cacheEnabled: process.env.CACHE_ENABLED !== 'false',
	cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || '5000'),
	rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '1000'),
}

// Logger
const log = pino({
	level: process.env.LOG_LEVEL || 'info',
	transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
})

// BigInt-safe JSON serialization helper
// The Sui SDK returns BigInt values that JSON.stringify cannot handle natively
function serializeBigInts<T>(obj: T): T {
	if (obj === null || obj === undefined) {
		return obj
	}
	if (typeof obj === 'bigint') {
		return obj.toString() as unknown as T
	}
	if (Array.isArray(obj)) {
		return obj.map(serializeBigInts) as unknown as T
	}
	if (typeof obj === 'object') {
		const result: Record<string, unknown> = {}
		for (const [key, value] of Object.entries(obj)) {
			result[key] = serializeBigInts(value)
		}
		return result as T
	}
	return obj
}

// Sui client with connection pooling
class SuiConnectionPool {
	private clients: SuiClient[] = []
	private currentIndex = 0
	private readonly urls: string[]

	constructor(urls: string[]) {
		this.urls = urls.filter(Boolean)
		this.initClients()
	}

	private initClients() {
		for (const url of this.urls) {
			const transport = new SuiHTTPTransport({ url })
			const client = new SuiClient({ transport })
			this.clients.push(client)
		}
		log.info({ clientCount: this.clients.length }, 'Initialized Sui client pool')
	}

	getClient(): SuiClient {
		if (this.clients.length === 0) {
			throw new Error('No Sui clients available')
		}
		// Round-robin load balancing
		const client = this.clients[this.currentIndex]
		this.currentIndex = (this.currentIndex + 1) % this.clients.length
		return client
	}

	async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; chainId?: string }> {
		const start = Date.now()
		try {
			const client = this.getClient()
			const chainId = await client.getChainIdentifier()
			return {
				healthy: true,
				latencyMs: Date.now() - start,
				chainId,
			}
		} catch (error) {
			return {
				healthy: false,
				latencyMs: Date.now() - start,
			}
		}
	}
}

// Simple in-memory cache
class ResponseCache {
	private cache = new Map<string, { data: unknown; expiry: number }>()
	private readonly ttlMs: number

	constructor(ttlMs: number) {
		this.ttlMs = ttlMs
		// Cleanup expired entries every minute
		setInterval(() => this.cleanup(), 60000)
	}

	private getCacheKey(method: string, params: unknown[]): string {
		return `${method}:${JSON.stringify(params)}`
	}

	get(method: string, params: unknown[]): unknown | undefined {
		const key = this.getCacheKey(method, params)
		const entry = this.cache.get(key)
		if (entry && entry.expiry > Date.now()) {
			return entry.data
		}
		return undefined
	}

	set(method: string, params: unknown[], data: unknown): void {
		const key = this.getCacheKey(method, params)
		this.cache.set(key, {
			data,
			expiry: Date.now() + this.ttlMs,
		})
	}

	private cleanup(): void {
		const now = Date.now()
		for (const [key, entry] of this.cache.entries()) {
			if (entry.expiry <= now) {
				this.cache.delete(key)
			}
		}
	}

	get size(): number {
		return this.cache.size
	}
}

// Rate limiter
class RateLimiter {
	private requests = new Map<string, number[]>()
	private readonly windowMs = 60000 // 1 minute
	private readonly maxRequests: number

	constructor(maxRequestsPerMinute: number) {
		this.maxRequests = maxRequestsPerMinute
	}

	isAllowed(clientId: string): boolean {
		const now = Date.now()
		const windowStart = now - this.windowMs

		let timestamps = this.requests.get(clientId) || []
		timestamps = timestamps.filter(t => t > windowStart)

		if (timestamps.length >= this.maxRequests) {
			return false
		}

		timestamps.push(now)
		this.requests.set(clientId, timestamps)
		return true
	}
}

// Read-only methods that can be cached
const CACHEABLE_METHODS = new Set([
	'sui_getObject',
	'sui_multiGetObjects',
	'sui_getTransactionBlock',
	'sui_multiGetTransactionBlocks',
	'suix_getBalance',
	'suix_getAllBalances',
])

// Initialize services
const pool = new SuiConnectionPool([config.suiRpcUrl, config.suiRpcUrlBackup].filter(Boolean) as string[])
const cache = config.cacheEnabled ? new ResponseCache(config.cacheTtlMs) : null
const rateLimiter = new RateLimiter(config.rateLimitPerMinute)

// Stats
const stats = {
	totalRequests: 0,
	cacheHits: 0,
	cacheMisses: 0,
	errors: 0,
	startTime: Date.now(),
}

// Create Hono app
const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())

// API key validation middleware
app.use('/rpc/*', async (c, next) => {
	if (config.apiKey) {
		const authHeader = c.req.header('Authorization')
		const token = authHeader?.replace('Bearer ', '')
		if (token !== config.apiKey) {
			return c.json({ error: 'Unauthorized' }, 401)
		}
	}

	// Rate limiting
	const clientId = c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || 'unknown'
	if (!rateLimiter.isAllowed(clientId)) {
		return c.json({ error: 'Rate limit exceeded' }, 429)
	}

	await next()
})

// Health check endpoint
app.get('/health', async (c) => {
	const health = await pool.healthCheck()
	return c.json({
		status: health.healthy ? 'healthy' : 'unhealthy',
		...health,
		uptime: Date.now() - stats.startTime,
		stats: {
			totalRequests: stats.totalRequests,
			cacheHits: stats.cacheHits,
			cacheMisses: stats.cacheMisses,
			cacheSize: cache?.size || 0,
			errors: stats.errors,
		},
		config: {
			maxBatchSize: config.maxBatchSize,
			cacheEnabled: config.cacheEnabled,
			cacheTtlMs: config.cacheTtlMs,
		},
	})
})

// JSON-RPC endpoint
app.post('/rpc', async (c) => {
	stats.totalRequests++

	try {
		const body = await c.req.json()

		// Handle batch requests
		if (Array.isArray(body)) {
			if (body.length > config.maxBatchSize) {
				return c.json({
					error: `Batch size ${body.length} exceeds maximum ${config.maxBatchSize}`,
				}, 400)
			}

			const results = await Promise.all(
				body.map(req => executeRpcRequest(req))
			)
			return c.json(results)
		}

		// Single request
		const result = await executeRpcRequest(body)
		return c.json(result)
	} catch (error) {
		stats.errors++
		log.error({ error }, 'RPC request failed')
		return c.json({
			jsonrpc: '2.0',
			id: null,
			error: {
				code: -32603,
				message: error instanceof Error ? error.message : 'Internal error',
			},
		}, 500)
	}
})

// Batch RPC endpoint
app.post('/rpc/batch', async (c) => {
	stats.totalRequests++

	try {
		const requests = await c.req.json()

		if (!Array.isArray(requests)) {
			return c.json({ error: 'Expected array of requests' }, 400)
		}

		if (requests.length > config.maxBatchSize) {
			return c.json({
				error: `Batch size ${requests.length} exceeds maximum ${config.maxBatchSize}`,
			}, 400)
		}

		const results = await Promise.all(
			requests.map(req => executeRpcRequest(req))
		)
		return c.json(results)
	} catch (error) {
		stats.errors++
		log.error({ error }, 'Batch request failed')
		return c.json({ error: 'Batch request failed' }, 500)
	}
})

// Execute a single RPC request
async function executeRpcRequest(request: {
	jsonrpc: string
	id: number | string
	method: string
	params: unknown[]
}): Promise<{
	jsonrpc: string
	id: number | string
	result?: unknown
	error?: { code: number; message: string }
}> {
	const { id, method, params } = request

	// Check cache for cacheable methods
	if (cache && CACHEABLE_METHODS.has(method)) {
		const cached = cache.get(method, params)
		if (cached !== undefined) {
			stats.cacheHits++
			return { jsonrpc: '2.0', id, result: cached }
		}
		stats.cacheMisses++
	}

	try {
		const client = pool.getClient()
		const result = await executeMethod(client, method, params)

		// Serialize BigInt values to strings for JSON compatibility
		const serializedResult = serializeBigInts(result)

		// Cache the serialized result
		if (cache && CACHEABLE_METHODS.has(method)) {
			cache.set(method, params, serializedResult)
		}

		return { jsonrpc: '2.0', id, result: serializedResult }
	} catch (error) {
		stats.errors++
		log.error({ method, error }, 'Method execution failed')
		return {
			jsonrpc: '2.0',
			id,
			error: {
				code: -32603,
				message: error instanceof Error ? error.message : 'Method execution failed',
			},
		}
	}
}

// Execute RPC method using Sui client
async function executeMethod(client: SuiClient, method: string, params: unknown[]): Promise<unknown> {
	switch (method) {
		// Object methods
		case 'sui_getObject':
			return client.getObject({
				id: params[0] as string,
				options: params[1] as Record<string, boolean> | undefined,
			})

		case 'sui_multiGetObjects':
			return client.multiGetObjects({
				ids: params[0] as string[],
				options: params[1] as Record<string, boolean> | undefined,
			})

		case 'sui_getOwnedObjects':
		case 'suix_getOwnedObjects':
			return client.getOwnedObjects({
				owner: params[0] as string,
				...(params[1] as Record<string, unknown> | undefined),
				cursor: params[2] as string | undefined,
				limit: params[3] as number | undefined,
			})

		// Transaction methods
		case 'sui_getTransactionBlock':
			return client.getTransactionBlock({
				digest: params[0] as string,
				options: params[1] as Record<string, boolean> | undefined,
			})

		case 'sui_multiGetTransactionBlocks':
			return client.multiGetTransactionBlocks({
				digests: params[0] as string[],
				options: params[1] as Record<string, boolean> | undefined,
			})

		case 'sui_executeTransactionBlock':
			return client.executeTransactionBlock({
				transactionBlock: params[0] as string,
				signature: params[1] as string | string[],
				options: params[2] as Record<string, boolean> | undefined,
				requestType: params[3] as 'WaitForEffectsCert' | 'WaitForLocalExecution' | undefined,
			})

		case 'sui_dryRunTransactionBlock':
			return client.dryRunTransactionBlock({
				transactionBlock: params[0] as string,
			})

		// Event methods
		case 'sui_queryEvents':
		case 'suix_queryEvents':
			return client.queryEvents({
				query: params[0] as Record<string, unknown>,
				cursor: params[1] as string | undefined,
				limit: params[2] as number | undefined,
				order: params[3] as 'ascending' | 'descending' | undefined,
			})

		// Balance methods
		case 'suix_getBalance':
			return client.getBalance({
				owner: params[0] as string,
				coinType: params[1] as string | undefined,
			})

		case 'suix_getAllBalances':
			return client.getAllBalances({
				owner: params[0] as string,
			})

		// Coin methods
		case 'suix_getCoins':
			return client.getCoins({
				owner: params[0] as string,
				coinType: params[1] as string | undefined,
				cursor: params[2] as string | undefined,
				limit: params[3] as number | undefined,
			})

		case 'suix_getAllCoins':
			return client.getAllCoins({
				owner: params[0] as string,
				cursor: params[1] as string | undefined,
				limit: params[2] as number | undefined,
			})

		// Dynamic field methods
		case 'suix_getDynamicFields':
			return client.getDynamicFields({
				parentId: params[0] as string,
				cursor: params[1] as string | undefined,
				limit: params[2] as number | undefined,
			})

		case 'suix_getDynamicFieldObject':
			return client.getDynamicFieldObject({
				parentId: params[0] as string,
				name: params[1] as { type: string; value: unknown },
			})

		// Transaction query methods
		case 'suix_queryTransactionBlocks':
			return client.queryTransactionBlocks({
				filter: params[0] as Record<string, unknown> | undefined,
				options: params[1] as Record<string, boolean> | undefined,
				cursor: params[2] as string | undefined,
				limit: params[3] as number | undefined,
				order: params[4] as 'ascending' | 'descending' | undefined,
			})

		// Chain info methods
		case 'sui_getChainIdentifier':
			return client.getChainIdentifier()

		case 'sui_getLatestCheckpointSequenceNumber':
			return client.getLatestCheckpointSequenceNumber()

		case 'sui_getCheckpoint':
			return client.getCheckpoint({ id: params[0] as string })

		case 'sui_getTotalTransactionBlocks':
			return client.getTotalTransactionBlocks()

		case 'suix_getReferenceGasPrice':
			return client.getReferenceGasPrice()

		// Protocol config
		case 'sui_getProtocolConfig':
			return client.getProtocolConfig({ version: params[0] as string | undefined })

		// Resolve name service
		case 'suix_resolveNameServiceAddress':
			return client.resolveNameServiceAddress({ name: params[0] as string })

		case 'suix_resolveNameServiceNames':
			return client.resolveNameServiceNames({
				address: params[0] as string,
				cursor: params[1] as string | undefined,
				limit: params[2] as number | undefined,
			})

		default:
			throw new Error(`Unsupported method: ${method}`)
	}
}

// Start server
log.info({ port: config.port, suiRpcUrl: config.suiRpcUrl }, 'Starting Sui gRPC backend proxy')

export default {
	port: config.port,
	fetch: app.fetch,
}
