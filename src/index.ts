import { handleBidsRequest } from './handlers/bids'
import { handleGrokipediaRequest } from './handlers/grokipedia'
import { handleLandingPage } from './handlers/landing'
import { handlePlayerEntryPage, handlePlayRequest } from './handlers/media'
import { generateProfilePage } from './handlers/profile'
import { handleTradeportRequest } from './handlers/tradeport'
import { handleTransaction } from './handlers/transaction'
import { handleUploadPage } from './handlers/upload'
import { resolveContent, resolveDirectContent } from './resolvers/content'
import { getMVRDocumentationUrl, getPackageExplorerUrl, resolveMVRPackage } from './resolvers/mvr'
import { handleRPCRequest } from './resolvers/rpc'
import { resolveSuiNS } from './resolvers/suins'
import { isWalrusSiteId, resolveWalrusSite } from './resolvers/walrus-site'
import type { Env, MVRPackage, SuiNSRecord } from './types'
import { errorResponse, htmlResponse, jsonResponse, notFoundPage } from './utils/response'
import { parseSubdomain } from './utils/subdomain'

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-File-Name',
					'Access-Control-Max-Age': '86400',
				},
			})
		}

		const url = new URL(request.url)
		if (url.pathname.startsWith('/api/tradeport')) {
			return handleTradeportRequest(request, env)
		}

		if (url.pathname.startsWith('/api/bids')) {
			return handleBidsRequest(request, env)
		}

		if (url.pathname === '/api/grokipedia') {
			return handleGrokipediaRequest(request, env)
		}

		// Walrus upload proxy (to avoid CORS issues)
		if (url.pathname === '/api/upload' && request.method === 'PUT') {
			return handleUploadProxy(request, env)
		}

		// Upload page with UI
		if (url.pathname.startsWith('/upload')) {
			return handleUploadPage(request, env)
		}

		// Media player entry page
		if (url.pathname === '/play' || url.pathname === '/play/') {
			return handlePlayerEntryPage(env)
		}

		// Transaction viewer: /tx/{digest} or /transaction/{digest}
		if (url.pathname.match(/^\/(tx|transaction)\/[A-Za-z0-9]+/)) {
			return handleTransaction(request, env)
		}
		// For local development: use ?host= query param or X-Host header to simulate subdomain
		const testHost = url.searchParams.get('host') || request.headers.get('X-Host')
		const hostname = testHost || url.hostname
		const parsed = parseSubdomain(hostname)

		try {
			// Handle path-based content routes (preserves case for blob IDs)
			// /walrus/{blobId} or /ipfs/{cid}
			if (parsed.type === 'root') {
				const pathMatch = url.pathname.match(/^\/(walrus|ipfs)\/(.+)$/)
				if (pathMatch) {
					const [, type, id] = pathMatch
					return handlePathContentRequest(type, id, env)
				}
			}

			switch (parsed.type) {
				case 'root':
					return handleLandingPage(request, env)

				case 'rpc':
					return handleRPCRequest(request, env)

				case 'suins':
					return handleSuiNSRequest(parsed.subdomain, url, env)

				case 'mvr':
					if (!parsed.packageName) {
						return errorResponse('Package name is required', 'BAD_REQUEST', 400)
					}
					return handleMVRRequest(parsed.subdomain, parsed.packageName, parsed.version, url, env)

				case 'content':
					return handleContentRequest(parsed.subdomain, env)

				case 'play':
					return handlePlayRequest(parsed.subdomain, env)

				default:
					return errorResponse('Unknown route type', 'UNKNOWN_ROUTE', 400)
			}
		} catch (error) {
			console.error('Gateway error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return errorResponse(`Gateway error: ${message}`, 'GATEWAY_ERROR', 500)
		}
	},
}

/**
 * Handle SuiNS name resolution requests
 */
async function handleSuiNSRequest(name: string, url: URL, env: Env): Promise<Response> {
	const skipCache = url.searchParams.has('nocache') || url.searchParams.has('refresh')
	const result = await resolveSuiNS(name, env, skipCache)

	if (!result.found) {
		return notFoundPage(name, env)
	}

	const record = result.data as SuiNSRecord

	// If requesting JSON data explicitly
	if (url.pathname === '/json' || url.searchParams.has('json')) {
		return jsonResponse(record)
	}

	// Force profile view
	if (url.pathname === '/profile' || url.searchParams.has('profile')) {
		return htmlResponse(generateProfilePage(name, record, env))
	}

	// If the name has a Walrus Site ID, resolve and serve the site
	if (record.walrusSiteId && isWalrusSiteId(record.walrusSiteId)) {
		const siteResponse = await resolveWalrusSite(
			record.walrusSiteId,
			url.pathname,
			env,
			`${name}.sui`,
		)
		if (!siteResponse.ok && (url.pathname === '/' || url.pathname === '')) {
			return htmlResponse(generateProfilePage(name, record, env))
		}
		return siteResponse
	}

	// If the name has other content linked (IPFS, URL, raw Walrus blob), resolve it
	if (record.content) {
		const contentResponse = await resolveContent(record.content, env)
		if (!contentResponse.ok && (url.pathname === '/' || url.pathname === '')) {
			return htmlResponse(generateProfilePage(name, record, env))
		}
		return contentResponse
	}

	// Otherwise, show the name's profile page
	return htmlResponse(generateProfilePage(name, record, env))
}

/**
 * Handle MVR package requests
 */
async function handleMVRRequest(
	suinsName: string,
	packageName: string,
	version: number | undefined,
	url: URL,
	env: Env,
): Promise<Response> {
	const result = await resolveMVRPackage(suinsName, packageName, version, env)

	if (!result.found) {
		return notFoundPage(`@${suinsName}/${packageName}`)
	}

	const pkg = result.data as MVRPackage

	// If requesting JSON data explicitly
	if (url.pathname === '/json' || url.searchParams.has('json')) {
		return jsonResponse(pkg)
	}

	// Show package info page
	return htmlResponse(mvrPackagePage(pkg, env.SUI_NETWORK))
}

/**
 * Handle direct content requests (ipfs-*, walrus-*)
 */
async function handleContentRequest(subdomain: string, env: Env): Promise<Response> {
	const result = await resolveDirectContent(subdomain, env)

	if (!result.found) {
		return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
	}

	return result.data as Response
}

/**
 * Handle path-based content requests (preserves case sensitivity)
 * /walrus/{blobId} or /ipfs/{cid}
 */
async function handlePathContentRequest(type: string, id: string, env: Env): Promise<Response> {
	const subdomain = `${type}-${id}`
	const result = await resolveDirectContent(subdomain, env)

	if (!result.found) {
		return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
	}

	return result.data as Response
}

/**
 * Generate MVR package page HTML
 */
function mvrPackagePage(pkg: MVRPackage, network: string): string {
	const explorerUrl = getPackageExplorerUrl(pkg.address, network)
	const docsUrl = getMVRDocumentationUrl(pkg)

	const escapeHtml = (value: string) =>
		value.replace(/[&<>"']/g, (char) => {
			switch (char) {
				case '&':
					return '&amp;'
				case '<':
					return '&lt;'
				case '>':
					return '&gt;'
				case '"':
					return '&quot;'
				case "'":
					return '&#39;'
				default:
					return char
			}
		})

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(pkg.name)} | sui.ski</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			padding: 40px 20px;
		}
		body::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(ellipse at 20% 20%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
				radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
			pointer-events: none;
		}
		.container {
			max-width: 640px;
			margin: 0 auto;
			position: relative;
		}
		.card {
			background: rgba(22, 22, 30, 0.9);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 16px;
			padding: 32px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
			position: relative;
		}
		.card::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
		}
		.header {
			text-align: center;
			margin-bottom: 24px;
		}
		.package-icon {
			width: 64px;
			height: 64px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			border-radius: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 auto 16px;
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}
		.package-icon svg {
			width: 32px;
			height: 32px;
			color: white;
		}
		h1 {
			font-size: 1.75rem;
			font-weight: 700;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 12px;
		}
		.badges {
			display: flex;
			justify-content: center;
			gap: 8px;
			flex-wrap: wrap;
		}
		.badge {
			display: inline-block;
			padding: 4px 10px;
			background: rgba(255, 255, 255, 0.08);
			border-radius: 6px;
			font-size: 0.75rem;
			font-weight: 500;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.badge.network {
			background: ${network === 'mainnet' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)'};
			color: ${network === 'mainnet' ? '#34d399' : '#fbbf24'};
		}
		.badge.version {
			background: rgba(96, 165, 250, 0.12);
			color: #60a5fa;
		}
		.description {
			color: #71717a;
			margin: 20px 0;
			text-align: center;
			line-height: 1.6;
		}
		.address-section {
			margin: 24px 0;
		}
		.address-label {
			font-size: 0.75rem;
			font-weight: 600;
			color: #71717a;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 8px;
		}
		.address {
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			padding: 14px 16px;
			border-radius: 12px;
			border: 1px solid rgba(255, 255, 255, 0.06);
			word-break: break-all;
			font-size: 0.85rem;
		}
		.links {
			display: flex;
			flex-direction: column;
			gap: 10px;
			margin-top: 24px;
		}
		.links a {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 12px 16px;
			background: rgba(30, 30, 40, 0.5);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 10px;
			color: #60a5fa;
			font-size: 0.9rem;
			font-weight: 500;
			text-decoration: none;
			transition: all 0.2s;
		}
		.links a:hover {
			border-color: #60a5fa;
			background: rgba(96, 165, 250, 0.1);
		}
		.links a svg {
			width: 18px;
			height: 18px;
		}
		.footer {
			text-align: center;
			margin-top: 32px;
			color: #71717a;
			font-size: 0.875rem;
		}
		.footer a { color: #60a5fa; text-decoration: none; }
		.footer a:hover { text-decoration: underline; }
	</style>
</head>
<body>
	<div class="container">
		<div class="card">
			<div class="header">
				<div class="package-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
						<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
						<line x1="12" y1="22.08" x2="12" y2="12"></line>
					</svg>
				</div>
				<h1>${escapeHtml(pkg.name)}</h1>
				<div class="badges">
					<span class="badge network">${network}</span>
					<span class="badge version">v${pkg.version}</span>
				</div>
			</div>
			${pkg.metadata?.description ? `<p class="description">${escapeHtml(pkg.metadata.description)}</p>` : ''}
			<div class="address-section">
				<div class="address-label">Package Address</div>
				<div class="address">${escapeHtml(pkg.address)}</div>
			</div>
			<div class="links">
				<a href="${escapeHtml(explorerUrl)}" target="_blank" rel="noopener noreferrer">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
					View on Explorer
				</a>
				<a href="${escapeHtml(docsUrl)}" target="_blank" rel="noopener noreferrer">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
					Documentation
				</a>
				${
					pkg.metadata?.repository
						? `<a href="${escapeHtml(pkg.metadata.repository)}" target="_blank" rel="noopener noreferrer">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
					Repository
				</a>`
						: ''
				}
			</div>
		</div>
		<div class="footer">
			<p>Powered by <a href="https://sui.ski">sui.ski</a> · <a href="https://moveregistry.com">Move Registry</a> · <a href="https://sui.io">Sui</a></p>
		</div>
	</div>
</body>
</html>`
}

/**
 * Proxy uploads to Walrus publisher to avoid CORS issues
 * Uses public publishers - upload relay requires SDK with on-chain registration
 */
async function handleUploadProxy(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const epochs = url.searchParams.get('epochs') || '1'

	// Public mainnet publishers (multiple for redundancy)
	const mainnetPublishers = [
		'https://walrus-mainnet-publisher-1.staketab.org/v1/blobs',
		'https://walrus-mainnet-publisher.nodes.guru/v1/blobs',
	]
	const testnetPublishers = ['https://publisher.walrus-testnet.walrus.space/v1/blobs']

	const publishers = env.WALRUS_NETWORK === 'mainnet' ? mainnetPublishers : testnetPublishers

	try {
		const body = await request.arrayBuffer()
		const contentType = request.headers.get('Content-Type') || 'application/octet-stream'

		let lastError: { status: number; message: string } | null = null

		for (const publisher of publishers) {
			const targetUrl = `${publisher}?epochs=${epochs}`

			try {
				const response = await fetch(targetUrl, {
					method: 'PUT',
					body,
					headers: { 'Content-Type': contentType },
				})

				const responseText = await response.text()
				let data: unknown = null
				if (responseText) {
					try {
						data = JSON.parse(responseText)
					} catch {
						data = null
					}
				}

				if (!response.ok) {
					const message =
						typeof data === 'object' && data !== null
							? String(
									(data as { error?: unknown; message?: unknown }).error ||
										(data as { message?: unknown }).message ||
										responseText ||
										'Upload failed',
								)
							: responseText || 'Upload failed'
					lastError = { status: response.status, message }
					// Try next publisher
					continue
				}

				return new Response(JSON.stringify(data), {
					status: response.status,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'PUT, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type',
					},
				})
			} catch (fetchError) {
				// Network error, try next publisher
				lastError = {
					status: 502,
					message: fetchError instanceof Error ? fetchError.message : 'Network error',
				}
			}
		}

		return new Response(JSON.stringify({ error: lastError?.message || 'All publishers failed' }), {
			status: lastError?.status || 502,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Upload failed'
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		})
	}
}
