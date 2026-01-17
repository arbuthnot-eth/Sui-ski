/**
 * Vortex Privacy Protocol Handler
 *
 * Uses dynamic imports to avoid module-level initialization issues
 * with the vortex-sdk (which generates random values at load time).
 */
import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'

// Default Vortex API URL
const DEFAULT_VORTEX_API_URL = 'https://api.vortexfi.xyz'

// Cached SDK module - using any to avoid type analysis triggering module load
let vortexSdkModule: any = null
let sdkLoadError: Error | null = null

/**
 * Lazy-load the vortex SDK to avoid module-level initialization errors
 * This must only be called inside request handlers, never at module level
 * 
 * IMPORTANT: The SDK has top-level crypto initialization that fails in Workers global scope.
 * We use a runtime string concatenation trick to prevent static analysis by the bundler.
 */
async function getVortexSdk() {
	if (sdkLoadError) {
		throw sdkLoadError
	}
	if (!vortexSdkModule) {
		try {
			// Split the import path to prevent static analysis
			// This ensures the bundler doesn't pre-analyze the SDK module
			const sdkBase = '@interest-protocol/'
			const sdkName = 'vortex-sdk'
			const sdkPath = sdkBase + sdkName
			vortexSdkModule = await import(/* @vite-ignore */ sdkPath)
		} catch (error) {
			sdkLoadError = error instanceof Error ? error : new Error('Failed to load Vortex SDK')
			throw sdkLoadError
		}
	}
	return vortexSdkModule
}

/**
 * Create a VortexAPI instance with the configured API URL
 */
async function getVortexAPI(env: Env) {
	const sdk = await getVortexSdk()
	return new sdk.VortexAPI({
		apiUrl: env.VORTEX_API_URL || DEFAULT_VORTEX_API_URL,
	})
}

/**
 * Handle all Vortex API requests
 * Routes:
 * - GET /api/vortex/health - Health check
 * - GET /api/vortex/pools - List available pools
 * - GET /api/vortex/pools/:coinType - Get pool details
 * - GET /api/vortex/relayer - Get relayer information
 * - GET /api/vortex/commitments - Get commitments for a coin type
 */
export async function handleVortexRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname.replace('/api/vortex', '')

	try {
		// Health check
		if (path === '/health' || path === '/health/') {
			return handleHealthCheck(env)
		}

		// List pools
		if (path === '/pools' || path === '/pools/') {
			return handleGetPools(request, env)
		}

		// Get specific pool by coin type
		const poolMatch = path.match(/^\/pools\/(.+)$/)
		if (poolMatch) {
			const coinType = decodeURIComponent(poolMatch[1])
			return handleGetPoolDetails(coinType, env)
		}

		// Get relayer info
		if (path === '/relayer' || path === '/relayer/') {
			return handleGetRelayer(env)
		}

		// Get commitments
		if (path === '/commitments' || path === '/commitments/') {
			return handleGetCommitments(request, env)
		}

		// Get merkle path
		if (path === '/merkle-path' || path === '/merkle-path/') {
			return handleGetMerklePath(request, env)
		}

		// Get accounts
		if (path === '/accounts' || path === '/accounts/') {
			return handleGetAccounts(request, env)
		}

		// Protocol info
		if (path === '/info' || path === '/info/' || path === '' || path === '/') {
			return handleGetInfo(env)
		}

		return errorResponse('Vortex endpoint not found', 'NOT_FOUND', 404)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return errorResponse(`Vortex API error: ${message}`, 'VORTEX_ERROR', 500)
	}
}

/**
 * Health check endpoint
 */
async function handleHealthCheck(env: Env): Promise<Response> {
	try {
		const api = await getVortexAPI(env)
		const health = await api.health()
		return jsonResponse(health)
	} catch (error) {
		return jsonResponse(
			{
				success: false,
				error: 'Vortex API health check failed',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			503,
		)
	}
}

/**
 * Get all available pools
 */
async function handleGetPools(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const page = parseInt(url.searchParams.get('page') || '1', 10)
	const limit = parseInt(url.searchParams.get('limit') || '20', 10)
	const coinType = url.searchParams.get('coinType') || undefined

	const api = await getVortexAPI(env)
	const pools = await api.getPools({ page, limit, coinType })
	return jsonResponse(pools)
}

/**
 * Get pool details for a specific coin type
 */
async function handleGetPoolDetails(coinType: string, env: Env): Promise<Response> {
	const api = await getVortexAPI(env)
	const sdk = await getVortexSdk()

	// Get pool info from the pools endpoint
	const pools = await api.getPools({ coinType, limit: 1 })

	if (!pools.data.items.length) {
		return errorResponse(`Pool not found for coin type: ${coinType}`, 'NOT_FOUND', 404)
	}

	const pool = pools.data.items[0]

	// Check if this is a known pool ID
	const knownPoolId = sdk.VORTEX_POOL_IDS[coinType as keyof typeof sdk.VORTEX_POOL_IDS]

	return jsonResponse({
		success: true,
		data: {
			...pool,
			knownPoolId,
			explorerUrl: `https://suiscan.xyz/mainnet/object/${pool.objectId}`,
		},
	})
}

/**
 * Get relayer information
 */
async function handleGetRelayer(env: Env): Promise<Response> {
	const api = await getVortexAPI(env)
	const relayer = await api.getRelayer()
	return jsonResponse(relayer)
}

/**
 * Get commitments for a coin type
 */
async function handleGetCommitments(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const coinType = url.searchParams.get('coinType')
	const index = parseInt(url.searchParams.get('index') || '0', 10)
	const op = url.searchParams.get('op') as 'gt' | 'gte' | 'lt' | 'lte' | undefined
	const page = parseInt(url.searchParams.get('page') || '1', 10)
	const limit = parseInt(url.searchParams.get('limit') || '50', 10)

	if (!coinType) {
		return errorResponse('coinType parameter is required', 'BAD_REQUEST', 400)
	}

	const api = await getVortexAPI(env)
	const commitments = await api.getCommitments({
		coinType,
		index,
		op,
		page,
		limit,
	})
	return jsonResponse(commitments)
}

/**
 * Get merkle path for proof generation
 */
async function handleGetMerklePath(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return errorResponse('Method not allowed, use POST', 'METHOD_NOT_ALLOWED', 405)
	}

	const body = (await request.json()) as {
		coinType: string
		index: number
		amount: string
		publicKey: string
		blinding: string
		vortexPool: string
	}

	const { coinType, index, amount, publicKey, blinding, vortexPool } = body

	if (!coinType || index === undefined || !amount || !publicKey || !blinding || !vortexPool) {
		return errorResponse(
			'Missing required fields: coinType, index, amount, publicKey, blinding, vortexPool',
			'BAD_REQUEST',
			400,
		)
	}

	const api = await getVortexAPI(env)
	const merklePath = await api.getMerklePath({
		coinType,
		index,
		amount,
		publicKey,
		blinding,
		vortexPool,
	})
	return jsonResponse(merklePath)
}

/**
 * Get accounts by hashed secret
 */
async function handleGetAccounts(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const hashedSecret = url.searchParams.get('hashedSecret')
	const excludeHidden = url.searchParams.get('excludeHidden') === 'true'

	if (!hashedSecret) {
		return errorResponse('hashedSecret parameter is required', 'BAD_REQUEST', 400)
	}

	const api = await getVortexAPI(env)
	const accounts = await api.getAccounts({
		hashedSecret,
		excludeHidden,
	})
	return jsonResponse(accounts)
}

/**
 * Get Vortex protocol information
 */
async function handleGetInfo(env: Env): Promise<Response> {
	const api = await getVortexAPI(env)
	const sdk = await getVortexSdk()

	// Get health and pools for overview
	let health = null
	let pools = null
	let relayer = null

	try {
		health = await api.health()
	} catch {
		// Health check failed
	}

	try {
		pools = await api.getPools({ limit: 10 })
	} catch {
		// Pools fetch failed
	}

	try {
		relayer = await api.getRelayer()
	} catch {
		// Relayer fetch failed
	}

	return jsonResponse({
		success: true,
		data: {
			name: 'Vortex Privacy Protocol',
			description: 'Privacy-preserving transactions on Sui using zero-knowledge proofs',
			packageId: sdk.VORTEX_PACKAGE_ID,
			registryId: sdk.REGISTRY_OBJECT_ID || null,
			knownPools: sdk.VORTEX_POOL_IDS || {},
			apiUrl: env.VORTEX_API_URL || DEFAULT_VORTEX_API_URL,
			health: health?.data || null,
			poolCount: pools?.data?.pagination?.total || null,
			relayer: relayer?.data || null,
			documentation: 'https://github.com/interest-protocol/vortex',
			features: [
				'Confidential transactions using ZK proofs',
				'Break on-chain link between deposit and withdrawal',
				'2-input/2-output UTXO model',
				'Groth16 proof verification',
				'Merkle tree commitment tracking',
			],
		},
	})
}

/**
 * Generate Vortex UI page
 * Note: This function doesn't need the SDK - it's just static HTML
 */
export function generateVortexPage(env: Env): string {
	const network = env.SUI_NETWORK

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Vortex Privacy | sui.ski</title>
	<meta name="description" content="Privacy-preserving transactions on Sui blockchain using Vortex protocol">
	<style>
		:root {
			--bg: #0a0a0f;
			--surface: #12121a;
			--surface-hover: #1a1a25;
			--border: rgba(96, 165, 250, 0.1);
			--text: #e2e8f0;
			--text-muted: #94a3b8;
			--accent: #60a5fa;
			--accent-hover: #3b82f6;
			--success: #22c55e;
			--warning: #fbbf24;
			--error: #ef4444;
			--purple: #a855f7;
		}
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: var(--bg);
			color: var(--text);
			min-height: 100vh;
			line-height: 1.6;
		}
		.container {
			max-width: 1200px;
			margin: 0 auto;
			padding: 32px 24px;
		}
		.header {
			text-align: center;
			margin-bottom: 48px;
		}
		.header h1 {
			font-size: 2.5rem;
			font-weight: 700;
			background: linear-gradient(135deg, var(--accent), var(--purple));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			margin-bottom: 12px;
		}
		.header p {
			color: var(--text-muted);
			font-size: 1.1rem;
			max-width: 600px;
			margin: 0 auto;
		}
		.badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 4px 12px;
			border-radius: 999px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-top: 16px;
			background: ${network === 'mainnet' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)'};
			color: ${network === 'mainnet' ? 'var(--success)' : 'var(--warning)'};
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 24px;
			margin-bottom: 32px;
		}
		.card {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 24px;
			transition: all 0.2s;
		}
		.card:hover {
			border-color: rgba(96, 165, 250, 0.3);
			transform: translateY(-2px);
		}
		.card-header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 16px;
		}
		.card-icon {
			width: 48px;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(168, 85, 247, 0.15));
			border-radius: 12px;
		}
		.card-icon svg {
			width: 24px;
			height: 24px;
			color: var(--accent);
		}
		.card-title {
			font-size: 1.25rem;
			font-weight: 600;
		}
		.card-desc {
			color: var(--text-muted);
			font-size: 0.9rem;
			margin-bottom: 16px;
		}
		.stat {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 0;
			border-bottom: 1px solid var(--border);
		}
		.stat:last-child {
			border-bottom: none;
		}
		.stat-label {
			color: var(--text-muted);
			font-size: 0.875rem;
		}
		.stat-value {
			font-weight: 600;
			font-family: monospace;
		}
		.status-indicator {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}
		.status-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: var(--success);
			animation: pulse 2s infinite;
		}
		@keyframes pulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.5; }
		}
		.features {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 32px;
			margin-bottom: 32px;
		}
		.features h2 {
			font-size: 1.5rem;
			margin-bottom: 24px;
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.feature-list {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 16px;
		}
		.feature-item {
			display: flex;
			align-items: flex-start;
			gap: 12px;
			padding: 16px;
			background: var(--surface-hover);
			border-radius: 12px;
		}
		.feature-item svg {
			width: 20px;
			height: 20px;
			color: var(--success);
			flex-shrink: 0;
			margin-top: 2px;
		}
		.api-section {
			background: var(--surface);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 32px;
		}
		.api-section h2 {
			font-size: 1.5rem;
			margin-bottom: 24px;
		}
		.api-endpoint {
			background: var(--bg);
			border-radius: 8px;
			padding: 16px;
			margin-bottom: 12px;
			font-family: monospace;
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.api-method {
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 0.75rem;
			font-weight: 600;
		}
		.api-method.get { background: rgba(34, 197, 94, 0.2); color: var(--success); }
		.api-method.post { background: rgba(59, 130, 246, 0.2); color: var(--accent); }
		.api-path {
			color: var(--text);
		}
		.loading {
			display: inline-block;
			width: 16px;
			height: 16px;
			border: 2px solid var(--border);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
		@keyframes spin {
			to { transform: rotate(360deg); }
		}
		a {
			color: var(--accent);
			text-decoration: none;
		}
		a:hover {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Vortex Privacy Protocol</h1>
			<p>Privacy-preserving transactions on Sui blockchain using zero-knowledge proofs. Break the on-chain link between deposits and withdrawals.</p>
			<span class="badge">${network}</span>
		</div>

		<div class="grid">
			<div class="card">
				<div class="card-header">
					<div class="card-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<div class="card-title">Protocol Status</div>
				</div>
				<div class="card-desc">Real-time status of Vortex services</div>
				<div id="health-status">
					<div class="stat">
						<span class="stat-label">API Status</span>
						<span class="stat-value"><span class="loading"></span></span>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header">
					<div class="card-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/>
							<path d="M12 6v6l4 2"/>
						</svg>
					</div>
					<div class="card-title">Pools</div>
				</div>
				<div class="card-desc">Available privacy pools</div>
				<div id="pools-status">
					<div class="stat">
						<span class="stat-label">Loading...</span>
						<span class="stat-value"><span class="loading"></span></span>
					</div>
				</div>
			</div>

			<div class="card">
				<div class="card-header">
					<div class="card-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/>
						</svg>
					</div>
					<div class="card-title">Relayer</div>
				</div>
				<div class="card-desc">Transaction relayer info</div>
				<div id="relayer-status">
					<div class="stat">
						<span class="stat-label">Loading...</span>
						<span class="stat-value"><span class="loading"></span></span>
					</div>
				</div>
			</div>
		</div>

		<div class="features">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:24px;height:24px;color:var(--purple);">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
				</svg>
				Privacy Features
			</h2>
			<div class="feature-list">
				<div class="feature-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
						<polyline points="22 4 12 14.01 9 11.01"/>
					</svg>
					<div>
						<strong>Zero-Knowledge Proofs</strong>
						<p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">Groth16 proof system for transaction verification</p>
					</div>
				</div>
				<div class="feature-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
						<polyline points="22 4 12 14.01 9 11.01"/>
					</svg>
					<div>
						<strong>UTXO Model</strong>
						<p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">2-input/2-output transaction architecture</p>
					</div>
				</div>
				<div class="feature-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
						<polyline points="22 4 12 14.01 9 11.01"/>
					</svg>
					<div>
						<strong>Merkle Tree Commitments</strong>
						<p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">Efficient commitment tracking and verification</p>
					</div>
				</div>
				<div class="feature-item">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
						<polyline points="22 4 12 14.01 9 11.01"/>
					</svg>
					<div>
						<strong>Encrypted Outputs</strong>
						<p style="color:var(--text-muted);font-size:0.875rem;margin-top:4px;">Note encryption with recipient's public key</p>
					</div>
				</div>
			</div>
		</div>

		<div class="api-section">
			<h2>API Endpoints</h2>
			<div class="api-endpoint">
				<span class="api-method get">GET</span>
				<span class="api-path">/api/vortex/health</span>
			</div>
			<div class="api-endpoint">
				<span class="api-method get">GET</span>
				<span class="api-path">/api/vortex/pools</span>
			</div>
			<div class="api-endpoint">
				<span class="api-method get">GET</span>
				<span class="api-path">/api/vortex/relayer</span>
			</div>
			<div class="api-endpoint">
				<span class="api-method get">GET</span>
				<span class="api-path">/api/vortex/commitments?coinType=0x2::sui::SUI&index=0</span>
			</div>
			<div class="api-endpoint">
				<span class="api-method post">POST</span>
				<span class="api-path">/api/vortex/merkle-path</span>
			</div>
			<p style="margin-top:16px;color:var(--text-muted);">
				Full documentation: <a href="https://github.com/interest-protocol/vortex" target="_blank">github.com/interest-protocol/vortex</a>
			</p>
		</div>
	</div>

	<script>
		const API_BASE = '/api/vortex';

		async function loadHealth() {
			const container = document.getElementById('health-status');
			try {
				const res = await fetch(API_BASE + '/health');
				const data = await res.json();
				if (data.success && data.data) {
					const status = data.data;
					container.innerHTML = \`
						<div class="stat">
							<span class="stat-label">Overall</span>
							<span class="stat-value status-indicator">
								<span class="status-dot" style="background:\${status.status === 'healthy' ? 'var(--success)' : 'var(--warning)'}"></span>
								\${status.status}
							</span>
						</div>
						<div class="stat">
							<span class="stat-label">MongoDB</span>
							<span class="stat-value">\${status.services?.mongodb || 'unknown'}</span>
						</div>
						<div class="stat">
							<span class="stat-label">Redis</span>
							<span class="stat-value">\${status.services?.redis || 'unknown'}</span>
						</div>
						<div class="stat">
							<span class="stat-label">Sui RPC</span>
							<span class="stat-value">\${status.services?.sui || 'unknown'}</span>
						</div>
					\`;
				} else {
					container.innerHTML = '<div class="stat"><span class="stat-label">Status</span><span class="stat-value" style="color:var(--error)">Error</span></div>';
				}
			} catch (e) {
				container.innerHTML = '<div class="stat"><span class="stat-label">Status</span><span class="stat-value" style="color:var(--error)">Unavailable</span></div>';
			}
		}

		async function loadPools() {
			const container = document.getElementById('pools-status');
			try {
				const res = await fetch(API_BASE + '/pools?limit=5');
				const data = await res.json();
				if (data.success && data.data) {
					const pools = data.data.items || [];
					const total = data.data.pagination?.total || pools.length;
					let html = \`<div class="stat"><span class="stat-label">Total Pools</span><span class="stat-value">\${total}</span></div>\`;
					pools.slice(0, 3).forEach(pool => {
						const coinType = pool.coinType?.split('::').pop() || 'Unknown';
						html += \`<div class="stat"><span class="stat-label">\${coinType}</span><span class="stat-value" style="font-size:0.75rem">\${pool.objectId?.slice(0,8)}...</span></div>\`;
					});
					container.innerHTML = html;
				} else {
					container.innerHTML = '<div class="stat"><span class="stat-label">Pools</span><span class="stat-value">0</span></div>';
				}
			} catch (e) {
				container.innerHTML = '<div class="stat"><span class="stat-label">Status</span><span class="stat-value" style="color:var(--error)">Error</span></div>';
			}
		}

		async function loadRelayer() {
			const container = document.getElementById('relayer-status');
			try {
				const res = await fetch(API_BASE + '/relayer');
				const data = await res.json();
				if (data.success && data.data) {
					const relayer = data.data;
					container.innerHTML = \`
						<div class="stat">
							<span class="stat-label">Address</span>
							<span class="stat-value" style="font-size:0.75rem">\${relayer.address?.slice(0,8)}...\${relayer.address?.slice(-6)}</span>
						</div>
					\`;
				} else {
					container.innerHTML = '<div class="stat"><span class="stat-label">Relayer</span><span class="stat-value" style="color:var(--error)">Unavailable</span></div>';
				}
			} catch (e) {
				container.innerHTML = '<div class="stat"><span class="stat-label">Status</span><span class="stat-value" style="color:var(--error)">Error</span></div>';
			}
		}

		// Load all data
		loadHealth();
		loadPools();
		loadRelayer();
	</script>
</body>
</html>`
}
