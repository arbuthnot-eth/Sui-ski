/**
 * gRPC Backend Proxy Handler
 *
 * Proxies requests to a gRPC-enabled backend service for improved performance.
 * The backend translates HTTP/JSON to gRPC calls to Sui fullnodes.
 *
 * Architecture:
 * Client → Cloudflare Worker → gRPC Backend → Sui Fullnode (gRPC)
 *
 * Benefits over direct JSON-RPC:
 * - Binary protocol efficiency
 * - HTTP/2 multiplexing
 * - Streaming support for subscriptions
 * - Connection pooling on backend
 */
import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'

// Proxy configuration
interface ProxyConfig {
	/** gRPC backend URL (HTTP endpoint that translates to gRPC) */
	backendUrl: string
	/** API key for backend authentication */
	apiKey?: string
	/** Request timeout in ms */
	timeout: number
	/** Enable request batching */
	batchEnabled: boolean
	/** Max batch size */
	maxBatchSize: number
}

// Request/response types
interface JsonRpcRequest {
	jsonrpc: '2.0'
	id: number | string
	method: string
	params: unknown[]
}

interface JsonRpcResponse {
	jsonrpc: '2.0'
	id: number | string
	result?: unknown
	error?: {
		code: number
		message: string
		data?: unknown
	}
}

// Default configuration
const DEFAULT_CONFIG: ProxyConfig = {
	backendUrl: '',
	timeout: 30000,
	batchEnabled: true,
	maxBatchSize: 50,
}

// Operations that benefit most from gRPC
const GRPC_PREFERRED_OPERATIONS: Set<string> = new Set([
	'sui_multiGetObjects',
	'sui_multiGetTransactionBlocks',
	'sui_queryEvents',
	'suix_queryTransactionBlocks',
	'suix_getOwnedObjects',
	'suix_getAllCoins',
	'suix_getDynamicFields',
])

/**
 * Get proxy configuration from environment
 */
function getProxyConfig(env: Env): ProxyConfig {
	return {
		...DEFAULT_CONFIG,
		backendUrl: (env as unknown as Record<string, string>).GRPC_BACKEND_URL || '',
		apiKey: (env as unknown as Record<string, string>).GRPC_BACKEND_API_KEY,
	}
}

/**
 * Check if gRPC proxy is available
 */
export function isProxyAvailable(env: Env): boolean {
	const config = getProxyConfig(env)
	return Boolean(config.backendUrl)
}

/**
 * Check if an operation should use gRPC proxy
 */
export function shouldUseProxy(method: string, env: Env): boolean {
	if (!isProxyAvailable(env)) return false
	return GRPC_PREFERRED_OPERATIONS.has(method)
}

/**
 * Proxy a single JSON-RPC request to the gRPC backend
 */
async function proxyRequest(
	request: JsonRpcRequest,
	config: ProxyConfig,
): Promise<JsonRpcResponse> {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), config.timeout)

	try {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'X-Proxy-Source': 'sui-ski-gateway',
		}

		if (config.apiKey) {
			headers['Authorization'] = `Bearer ${config.apiKey}`
		}

		const response = await fetch(`${config.backendUrl}/rpc`, {
			method: 'POST',
			headers,
			body: JSON.stringify(request),
			signal: controller.signal,
		})

		if (!response.ok) {
			throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
		}

		const data = await response.json() as JsonRpcResponse
		return data
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			return {
				jsonrpc: '2.0',
				id: request.id,
				error: {
					code: -32000,
					message: 'Request timeout',
				},
			}
		}

		return {
			jsonrpc: '2.0',
			id: request.id,
			error: {
				code: -32603,
				message: error instanceof Error ? error.message : 'Internal proxy error',
			},
		}
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Proxy a batch of JSON-RPC requests
 */
async function proxyBatchRequest(
	requests: JsonRpcRequest[],
	config: ProxyConfig,
): Promise<JsonRpcResponse[]> {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), config.timeout)

	try {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'X-Proxy-Source': 'sui-ski-gateway',
			'X-Batch-Size': String(requests.length),
		}

		if (config.apiKey) {
			headers['Authorization'] = `Bearer ${config.apiKey}`
		}

		const response = await fetch(`${config.backendUrl}/rpc/batch`, {
			method: 'POST',
			headers,
			body: JSON.stringify(requests),
			signal: controller.signal,
		})

		if (!response.ok) {
			throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
		}

		const data = await response.json() as JsonRpcResponse[]
		return data
	} catch (error) {
		// Return error responses for all requests in batch
		return requests.map(req => ({
			jsonrpc: '2.0' as const,
			id: req.id,
			error: {
				code: -32603,
				message: error instanceof Error ? error.message : 'Batch request failed',
			},
		}))
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Handle gRPC proxy API requests
 */
export async function handleGrpcProxyRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname.replace('/api/grpc', '')
	const config = getProxyConfig(env)

	// CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			},
		})
	}

	// Check if proxy is configured
	if (!config.backendUrl) {
		return jsonResponse({
			available: false,
			message: 'gRPC backend not configured',
			hint: 'Set GRPC_BACKEND_URL environment variable',
		})
	}

	// Status endpoint
	if (path === '/status' || path === '') {
		try {
			// Health check the backend
			const healthResponse = await fetch(`${config.backendUrl}/health`, {
				method: 'GET',
				signal: AbortSignal.timeout(5000),
			})

			const healthy = healthResponse.ok
			const backendStatus = healthy ? await healthResponse.json() : null

			return jsonResponse({
				available: true,
				healthy,
				backendUrl: config.backendUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'), // Mask credentials
				batchEnabled: config.batchEnabled,
				maxBatchSize: config.maxBatchSize,
				timeout: config.timeout,
				grpcPreferredOperations: Array.from(GRPC_PREFERRED_OPERATIONS),
				backendStatus,
			})
		} catch (error) {
			return jsonResponse({
				available: true,
				healthy: false,
				error: error instanceof Error ? error.message : 'Health check failed',
			})
		}
	}

	// RPC endpoint - single request
	if (path === '/rpc' && request.method === 'POST') {
		try {
			const body = await request.json()

			// Handle batch requests
			if (Array.isArray(body)) {
				if (body.length > config.maxBatchSize) {
					return errorResponse(
						`Batch size ${body.length} exceeds maximum ${config.maxBatchSize}`,
						'BATCH_TOO_LARGE',
						400,
					)
				}

				const responses = await proxyBatchRequest(body as JsonRpcRequest[], config)
				return jsonResponse(responses)
			}

			// Single request
			const rpcRequest = body as JsonRpcRequest
			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Invalid request',
				'INVALID_REQUEST',
				400,
			)
		}
	}

	// Multi-get objects endpoint (convenience wrapper)
	if (path === '/objects' && request.method === 'POST') {
		try {
			const body = await request.json() as { ids: string[]; options?: Record<string, boolean> }
			const { ids, options } = body

			if (!ids || !Array.isArray(ids)) {
				return errorResponse('Object IDs array required', 'INVALID_REQUEST', 400)
			}

			const rpcRequest: JsonRpcRequest = {
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_multiGetObjects',
				params: [ids, options || { showContent: true, showOwner: true }],
			}

			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response.result || response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Failed to fetch objects',
				'FETCH_ERROR',
				500,
			)
		}
	}

	// Query events endpoint (convenience wrapper)
	if (path === '/events' && request.method === 'POST') {
		try {
			const body = await request.json() as {
				filter: Record<string, unknown>
				cursor?: string
				limit?: number
				descending?: boolean
			}

			const rpcRequest: JsonRpcRequest = {
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_queryEvents',
				params: [body.filter, body.cursor || null, body.limit || 50, body.descending ?? true],
			}

			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response.result || response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Failed to query events',
				'QUERY_ERROR',
				500,
			)
		}
	}

	// Get owned objects endpoint (convenience wrapper)
	if (path === '/owned-objects' && request.method === 'POST') {
		try {
			const body = await request.json() as {
				address: string
				filter?: Record<string, unknown>
				options?: Record<string, boolean>
				cursor?: string
				limit?: number
			}

			const rpcRequest: JsonRpcRequest = {
				jsonrpc: '2.0',
				id: 1,
				method: 'suix_getOwnedObjects',
				params: [
					body.address,
					{ filter: body.filter, options: body.options || { showContent: true } },
					body.cursor || null,
					body.limit || 50,
				],
			}

			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response.result || response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Failed to fetch owned objects',
				'FETCH_ERROR',
				500,
			)
		}
	}

	// Dynamic fields endpoint (convenience wrapper)
	if (path === '/dynamic-fields' && request.method === 'POST') {
		try {
			const body = await request.json() as {
				parentId: string
				cursor?: string
				limit?: number
			}

			const rpcRequest: JsonRpcRequest = {
				jsonrpc: '2.0',
				id: 1,
				method: 'suix_getDynamicFields',
				params: [body.parentId, body.cursor || null, body.limit || 50],
			}

			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response.result || response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Failed to fetch dynamic fields',
				'FETCH_ERROR',
				500,
			)
		}
	}

	// SuiNS resolution endpoint (convenience wrapper)
	if (path === '/suins/resolve' && request.method === 'GET') {
		const name = url.searchParams.get('name')
		if (!name) {
			return errorResponse('Name parameter required', 'INVALID_REQUEST', 400)
		}

		try {
			const rpcRequest: JsonRpcRequest = {
				jsonrpc: '2.0',
				id: 1,
				method: 'suins_getAddress',
				params: [name],
			}

			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response.result || response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Failed to resolve name',
				'RESOLVE_ERROR',
				500,
			)
		}
	}

	// Execute transaction endpoint
	if (path === '/execute' && request.method === 'POST') {
		try {
			const body = await request.json() as {
				txBytes: string
				signatures: string[]
				options?: Record<string, boolean>
			}

			const rpcRequest: JsonRpcRequest = {
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_executeTransactionBlock',
				params: [
					body.txBytes,
					body.signatures,
					body.options || { showEffects: true, showEvents: true },
					'WaitForLocalExecution',
				],
			}

			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response.result || response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Failed to execute transaction',
				'EXECUTE_ERROR',
				500,
			)
		}
	}

	// Dry run transaction endpoint
	if (path === '/dry-run' && request.method === 'POST') {
		try {
			const body = await request.json() as { txBytes: string }

			const rpcRequest: JsonRpcRequest = {
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_dryRunTransactionBlock',
				params: [body.txBytes],
			}

			const response = await proxyRequest(rpcRequest, config)
			return jsonResponse(response.result || response)
		} catch (error) {
			return errorResponse(
				error instanceof Error ? error.message : 'Failed to dry run transaction',
				'DRY_RUN_ERROR',
				500,
			)
		}
	}

	return errorResponse('Not found', 'NOT_FOUND', 404)
}

/**
 * Generate gRPC proxy status page
 */
export function generateGrpcProxyPage(env: Env): string {
	const config = getProxyConfig(env)
	const isConfigured = Boolean(config.backendUrl)

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>gRPC Proxy | sui.ski</title>
	<style>
		:root {
			--bg: #05060c;
			--card: rgba(15, 18, 32, 0.95);
			--border: rgba(255, 255, 255, 0.08);
			--text: #e4e6f1;
			--text-muted: #7c819b;
			--accent: #60a5fa;
			--success: #34d399;
			--error: #f87171;
			--warning: #fbbf24;
		}
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, sans-serif;
			background: linear-gradient(180deg, #05060c, #090d1a);
			min-height: 100vh;
			color: var(--text);
			padding: 32px 16px;
		}
		.container { max-width: 800px; margin: 0 auto; }
		.header { text-align: center; margin-bottom: 32px; }
		.header h1 { font-size: 2rem; margin-bottom: 8px; }
		.header p { color: var(--text-muted); }
		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 24px;
			margin-bottom: 20px;
		}
		.status-badge {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 8px 16px;
			border-radius: 20px;
			font-size: 0.85rem;
			font-weight: 600;
		}
		.status-badge.online {
			background: rgba(52,211,153,0.15);
			color: var(--success);
		}
		.status-badge.offline {
			background: rgba(248,113,113,0.15);
			color: var(--error);
		}
		.status-badge.warning {
			background: rgba(251,191,36,0.15);
			color: var(--warning);
		}
		.dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: currentColor;
		}
		.endpoint-list {
			margin-top: 16px;
		}
		.endpoint {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px;
			border: 1px solid var(--border);
			border-radius: 8px;
			margin-bottom: 8px;
			font-family: ui-monospace, monospace;
			font-size: 0.85rem;
		}
		.method {
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 0.75rem;
			font-weight: 600;
		}
		.method.get { background: rgba(52,211,153,0.2); color: var(--success); }
		.method.post { background: rgba(96,165,250,0.2); color: var(--accent); }
		.path { flex: 1; }
		.desc { color: var(--text-muted); font-family: inherit; }
		code {
			background: rgba(0,0,0,0.3);
			padding: 2px 6px;
			border-radius: 4px;
			font-size: 0.85rem;
		}
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 12px;
			margin-top: 16px;
		}
		.stat {
			text-align: center;
			padding: 16px;
			background: rgba(0,0,0,0.2);
			border-radius: 8px;
		}
		.stat-value { font-size: 1.5rem; font-weight: 700; }
		.stat-label { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>⚡ gRPC Backend Proxy</h1>
			<p>High-performance Sui RPC via gRPC protocol</p>
		</div>

		<div class="card">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
				<h2 style="font-size: 1.2rem;">Status</h2>
				<span class="status-badge ${isConfigured ? 'warning' : 'offline'}" id="status-badge">
					<span class="dot"></span>
					<span id="status-text">${isConfigured ? 'Checking...' : 'Not Configured'}</span>
				</span>
			</div>

			<div class="stats-grid">
				<div class="stat">
					<div class="stat-value" id="latency">--</div>
					<div class="stat-label">Latency (ms)</div>
				</div>
				<div class="stat">
					<div class="stat-value" id="batch-size">${config.maxBatchSize}</div>
					<div class="stat-label">Max Batch Size</div>
				</div>
				<div class="stat">
					<div class="stat-value" id="timeout">${config.timeout / 1000}s</div>
					<div class="stat-label">Timeout</div>
				</div>
			</div>
		</div>

		<div class="card">
			<h2 style="font-size: 1.2rem; margin-bottom: 16px;">API Endpoints</h2>
			<div class="endpoint-list">
				<div class="endpoint">
					<span class="method get">GET</span>
					<span class="path">/api/grpc/status</span>
					<span class="desc">Proxy health check</span>
				</div>
				<div class="endpoint">
					<span class="method post">POST</span>
					<span class="path">/api/grpc/rpc</span>
					<span class="desc">JSON-RPC passthrough</span>
				</div>
				<div class="endpoint">
					<span class="method post">POST</span>
					<span class="path">/api/grpc/objects</span>
					<span class="desc">Multi-get objects</span>
				</div>
				<div class="endpoint">
					<span class="method post">POST</span>
					<span class="path">/api/grpc/events</span>
					<span class="desc">Query events</span>
				</div>
				<div class="endpoint">
					<span class="method post">POST</span>
					<span class="path">/api/grpc/owned-objects</span>
					<span class="desc">Get owned objects</span>
				</div>
				<div class="endpoint">
					<span class="method post">POST</span>
					<span class="path">/api/grpc/dynamic-fields</span>
					<span class="desc">Get dynamic fields</span>
				</div>
				<div class="endpoint">
					<span class="method get">GET</span>
					<span class="path">/api/grpc/suins/resolve?name=</span>
					<span class="desc">Resolve SuiNS name</span>
				</div>
				<div class="endpoint">
					<span class="method post">POST</span>
					<span class="path">/api/grpc/execute</span>
					<span class="desc">Execute transaction</span>
				</div>
				<div class="endpoint">
					<span class="method post">POST</span>
					<span class="path">/api/grpc/dry-run</span>
					<span class="desc">Dry run transaction</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2 style="font-size: 1.2rem; margin-bottom: 16px;">Usage Example</h2>
			<pre style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 0.85rem;"><code>// Fetch multiple objects via gRPC proxy
const response = await fetch('https://sui.ski/api/grpc/objects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ids: ['0x...', '0x...', '0x...'],
    options: { showContent: true, showOwner: true }
  })
});

const objects = await response.json();</code></pre>
		</div>
	</div>

	<script>
		async function checkStatus() {
			const badge = document.getElementById('status-badge');
			const statusText = document.getElementById('status-text');
			const latencyEl = document.getElementById('latency');

			const start = performance.now();
			try {
				const res = await fetch('/api/grpc/status');
				const latency = Math.round(performance.now() - start);
				const data = await res.json();

				latencyEl.textContent = latency;

				if (data.healthy) {
					badge.className = 'status-badge online';
					statusText.textContent = 'Online';
				} else if (data.available) {
					badge.className = 'status-badge warning';
					statusText.textContent = 'Degraded';
				} else {
					badge.className = 'status-badge offline';
					statusText.textContent = 'Not Configured';
				}
			} catch (e) {
				badge.className = 'status-badge offline';
				statusText.textContent = 'Error';
				latencyEl.textContent = '--';
			}
		}

		checkStatus();
		setInterval(checkStatus, 30000);
	</script>
</body>
</html>`
}
