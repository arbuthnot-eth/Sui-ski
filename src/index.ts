import { handleBidsRequest } from './handlers/bids'
import { handleLandingPage, getSUIPrice } from './handlers/landing'
import { handleMessagingPage, handleMessagingRequest } from './handlers/messaging'
import { handleMVRManagementRequest } from './handlers/mvr-management'
import { handleMVRManagementPage } from './handlers/mvr-ui'
import { generateProfilePage } from './handlers/profile'
import { handlePWARequest } from './handlers/pwa'
import { handleRegistrationSubmission } from './handlers/register'
import { handleSuinsManagerRequest, generateSuinsManagerPage } from './handlers/suins-manager'
import { handleGrpcProxyRequest, generateGrpcProxyPage } from './handlers/grpc-proxy'
import {
	handleNautilusCallback,
	handleNautilusQueue,
	handleRenewalRequest,
	handleRenewalStatus,
} from './handlers/renewal'
import {
	handleClaimSchedule,
	handleClaimStatus,
	handleClaimCancel,
	handleNautilusClaimCallback,
	handleNautilusClaimQueue,
	getReadyClaims,
	processClaim,
} from './handlers/claim'
import { handleTransaction } from './handlers/transaction'
import { handleUploadPage } from './handlers/upload'
import { handleViewsRequest } from './handlers/views'
// Vortex SDK uses dynamic imports to avoid bundle size issues
import { generateVortexPage, handleVortexRequest } from './handlers/vortex'
import { resolveContent, resolveDirectContent, WALRUS_AGGREGATORS } from './resolvers/content'
import { getMVRDocumentationUrl, getPackageExplorerUrl, resolveMVRPackage } from './resolvers/mvr'
import { handleRPCRequest } from './resolvers/rpc'
import { resolveSuiNS } from './resolvers/suins'
import { isWalrusSiteId, resolveWalrusSite } from './resolvers/walrus-site'
import type { Env, MVRPackage, SuiNSRecord } from './types'
import { errorResponse, htmlResponse, jsonResponse, notFoundPage } from './utils/response'
import { isTwitterPreviewBot, renderSocialMeta } from './utils/social'
import { parseSubdomain } from './utils/subdomain'
import { fetchSuiNSObjectData } from './utils/suins-object'

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
		const userAgent = request.headers.get('user-agent')

		// PWA assets (manifest, service worker, icons)
		const pwaResponse = handlePWARequest(url.pathname)
		if (pwaResponse) {
			return pwaResponse
		}

		// Messaging API endpoints
		if (url.pathname.startsWith('/api/messaging')) {
			return handleMessagingRequest(request, env)
		}

		if (url.pathname.startsWith('/api/bids')) {
			return handleBidsRequest(request, env)
		}

		// Vortex privacy protocol API
		if (url.pathname.startsWith('/api/vortex')) {
			return handleVortexRequest(request, env)
		}
		// Vortex UI page
		if (url.pathname === '/vortex' || url.pathname === '/vortex/') {
			return htmlResponse(generateVortexPage(env))
		}

		// SuiNS Manager API
		if (url.pathname.startsWith('/api/suins')) {
			return handleSuinsManagerRequest(request, env)
		}
		// SuiNS Manager UI page
		if (url.pathname === '/suins' || url.pathname === '/suins/') {
			return htmlResponse(generateSuinsManagerPage(env))
		}

		// gRPC Backend Proxy API
		if (url.pathname.startsWith('/api/grpc')) {
			return handleGrpcProxyRequest(request, env)
		}
		// gRPC Proxy status page
		if (url.pathname === '/grpc' || url.pathname === '/grpc/') {
			return htmlResponse(generateGrpcProxyPage(env))
		}

		// Renewal API (x402 payment-gated, Nautilus TEE)
		if (url.pathname === '/api/renewal/request') {
			return handleRenewalRequest(request, env)
		}
		if (url.pathname.startsWith('/api/renewal/status/')) {
			return handleRenewalStatus(request, env)
		}
		if (url.pathname === '/api/renewal/nautilus-callback') {
			return handleNautilusCallback(request, env)
		}
		if (url.pathname === '/api/renewal/nautilus-queue') {
			return handleNautilusQueue(request, env)
		}

		// Scheduled Claim API (x402 payment-gated, Nautilus TEE)
		if (url.pathname === '/api/claim/schedule') {
			return handleClaimSchedule(request, env)
		}
		if (url.pathname.startsWith('/api/claim/status/')) {
			return handleClaimStatus(request, env)
		}
		if (url.pathname === '/api/claim/nautilus-callback') {
			return handleNautilusClaimCallback(request, env)
		}
		if (url.pathname === '/api/claim/nautilus-queue') {
			return handleNautilusClaimQueue(request, env)
		}
		// Claim cancellation (DELETE /api/claim/:id)
		if (request.method === 'DELETE' && url.pathname.match(/^\/api\/claim\/[^/]+$/)) {
			return handleClaimCancel(request, env)
		}

		// View tracking API
		if (url.pathname.startsWith('/api/views')) {
			return handleViewsRequest(request, env)
		}

		// API endpoint for SUI price (available from any subdomain)
		if (url.pathname === '/api/sui-price') {
			try {
				const price = await getSUIPrice()
				return jsonResponse({ price })
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to fetch SUI price'
				return jsonResponse({ error: message }, 500)
			}
		}

		// NFT details API
		if (url.pathname.startsWith('/api/nft-details')) {
			return handleNFTDetailsRequest(request, env)
		}

		// MVR package management UI
		if (url.pathname === '/mvr' || url.pathname === '/mvr/') {
			return handleMVRManagementPage(env)
		}

		// MVR package management API
		if (url.pathname.startsWith('/api/mvr')) {
			return handleMVRManagementRequest(request, env)
		}

		// Messaging page
		if (url.pathname === '/messages' || url.pathname === '/messages/') {
			return handleMessagingPage(env)
		}

		// SuiNS image proxy (to avoid CORS issues)
		if (url.pathname.startsWith('/api/suins-image/')) {
			return handleSuiNSImageProxy(request, env)
		}

		// Generic image proxy for external URLs (to avoid CORS issues)
		if (url.pathname === '/api/image-proxy') {
			return handleImageProxy(request)
		}

		// Walrus upload proxy (to avoid CORS issues)
		if (url.pathname === '/api/upload' && request.method === 'PUT') {
			return handleUploadProxy(request, env)
		}

		// Upload page with UI
		if (url.pathname.startsWith('/upload')) {
			return handleUploadPage(request, env)
		}

		if (url.pathname === '/api/register/submit') {
			return handleRegistrationSubmission(request, env)
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
					return handlePathContentRequest(type, id, env, {
						isTwitterBot: isTwitterPreviewBot(userAgent),
						url,
					})
				}
			}

			switch (parsed.type) {
				case 'root':
					return handleLandingPage(request, env)

				case 'rpc':
					return handleRPCRequest(request, env)

				case 'suins':
					return handleSuiNSRequest(parsed.subdomain, url, env, {
						isTwitterBot: isTwitterPreviewBot(userAgent),
						originalHostname: hostname,
					})

				case 'mvr':
					if (!parsed.packageName) {
						return errorResponse('Package name is required', 'BAD_REQUEST', 400)
					}
					return handleMVRRequest(parsed.subdomain, parsed.packageName, parsed.version, url, env)

				case 'content':
					return handleContentRequest(parsed.subdomain, env, {
						isTwitterBot: isTwitterPreviewBot(userAgent),
						url,
					})

				default:
					return errorResponse('Unknown route type', 'UNKNOWN_ROUTE', 400)
			}
		} catch (error) {
			console.error('Gateway error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return errorResponse(`Gateway error: ${message}`, 'GATEWAY_ERROR', 500)
		}
	},

	/**
	 * Scheduled handler for processing claim queue
	 * Runs on cron trigger (every minute)
	 */
	async scheduled(
		_controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		const now = Date.now()
		console.log(`[Scheduled] Processing claims at ${new Date(now).toISOString()}`)

		try {
			// Get all claims ready for processing
			const readyClaims = await getReadyClaims(env, now)
			console.log(`[Scheduled] Found ${readyClaims.length} claims ready for processing`)

			// Process up to 10 claims per run (avoid timeout)
			const claimsToProcess = readyClaims.slice(0, 10)

			for (const claim of claimsToProcess) {
				ctx.waitUntil(
					processClaim(env, claim).catch((error) => {
						console.error(`[Scheduled] Failed to process claim ${claim.id}:`, error)
					}),
				)
			}
		} catch (error) {
			console.error('[Scheduled] Error processing claims:', error)
		}
	},
}

/**
 * Handle SuiNS name resolution requests
 */
interface SuiRequestOptions {
	isTwitterBot?: boolean
	originalHostname?: string
}

async function handleSuiNSRequest(
	name: string,
	url: URL,
	env: Env,
	options: SuiRequestOptions = {},
): Promise<Response> {
	const skipCache = url.searchParams.has('nocache') || url.searchParams.has('refresh')
	const result = await resolveSuiNS(name, env, skipCache)

	if (!result.found) {
		return notFoundPage(name, env)
	}

	const record = result.data as SuiNSRecord
	const hostname = options.originalHostname || url.hostname
	const normalizedPath = url.pathname || '/'
	const canonicalUrl = `${url.protocol}//${hostname}${normalizedPath}`
	const profileOptions = {
		canonicalUrl,
		hostname,
		inGracePeriod: result.inGracePeriod || false,
	}
	const shouldServeProfileForTwitter = Boolean(options.isTwitterBot) && normalizedPath === '/'
	let cachedProfileHtml: string | null = null
	const renderProfilePage = () => {
		if (cachedProfileHtml === null) {
			cachedProfileHtml = generateProfilePage(name, record, env, profileOptions)
		}
		return cachedProfileHtml
	}

	// If requesting JSON data explicitly
	if (url.pathname === '/json' || url.searchParams.has('json')) {
		return jsonResponse(record)
	}

	// Force profile view (accessible via /home or ?profile)
	if (url.pathname === '/home' || url.searchParams.has('profile')) {
		return htmlResponse(renderProfilePage())
	}

	if (shouldServeProfileForTwitter) {
		return htmlResponse(renderProfilePage())
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
			return htmlResponse(renderProfilePage())
		}
		return siteResponse
	}

	// If the name has other content linked (IPFS, URL, raw Walrus blob), resolve it
	if (record.content) {
		const contentResponse = await resolveContent(record.content, env)
		if (!contentResponse.ok && (url.pathname === '/' || url.pathname === '')) {
			return htmlResponse(renderProfilePage())
		}
		return contentResponse
	}

	// Otherwise, show the name's profile page
	return htmlResponse(renderProfilePage())
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
interface ContentRequestOptions {
	isTwitterBot?: boolean
	url?: URL
}

async function handleContentRequest(
	subdomain: string,
	env: Env,
	options: ContentRequestOptions = {},
): Promise<Response> {
	if (options.isTwitterBot && options.url) {
		const preview = await buildContentPreview(subdomain, options.url, env)
		if (preview) {
			return htmlResponse(preview)
		}
	}

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
async function handlePathContentRequest(
	type: string,
	id: string,
	env: Env,
	options: ContentRequestOptions = {},
): Promise<Response> {
	if (options.isTwitterBot && options.url) {
		const preview = await buildContentPreview(`${type}-${id}`, options.url, env)
		if (preview) {
			return htmlResponse(preview)
		}
	}

	const subdomain = `${type}-${id}`
	const result = await resolveDirectContent(subdomain, env)

	if (!result.found) {
		return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
	}

	return result.data as Response
}

interface ContentPreviewMeta {
	title: string
	description: string
	canonicalUrl: string
	imageUrl?: string
	imageAlt?: string
}

interface WalrusMetadata {
	contentType?: string
	contentLength?: number
}

async function buildContentPreview(subdomain: string, url: URL, env: Env): Promise<string | null> {
	const canonicalUrl = `${url.origin}${url.pathname}${url.search}`
	if (subdomain.startsWith('walrus-')) {
		const blobId = subdomain.slice(7)
		const metadata = await inspectWalrusMetadata(blobId, env)
		const rootHost = resolveRootHostname(url.hostname)
		const isImage = isImageType(metadata.contentType)
		const imageUrl = isImage
			? `${url.protocol}//${rootHost}/walrus/${blobId}`
			: `${url.protocol}//${rootHost}/icon-512.png`
		const infoBits = []
		if (metadata.contentType) {
			infoBits.push(`Type: ${metadata.contentType}`)
		}
		const sizeLabel = formatByteSize(metadata.contentLength)
		if (sizeLabel) {
			infoBits.push(`Size: ${sizeLabel}`)
		}
		const description = ['Walrus blob served via sui.ski gateway.', ...infoBits].join(' ')

		return contentPreviewHtml({
			title: `Walrus blob ${blobId.slice(0, 10)}…`,
			description,
			canonicalUrl,
			imageUrl,
			imageAlt: isImage ? `Walrus blob ${blobId}` : 'sui.ski preview',
		})
	}

	if (subdomain.startsWith('ipfs-')) {
		const cid = subdomain.slice(5)
		const rootHost = resolveRootHostname(url.hostname)
		const description = 'IPFS content delivered through the sui.ski wildcard gateway.'
		return contentPreviewHtml({
			title: `IPFS content ${cid.slice(0, 10)}…`,
			description,
			canonicalUrl,
			imageUrl: `${url.protocol}//${rootHost}/icon-512.png`,
			imageAlt: 'sui.ski preview',
		})
	}

	return null
}

async function inspectWalrusMetadata(blobId: string, env: Env): Promise<WalrusMetadata> {
	const aggregators = WALRUS_AGGREGATORS[env.WALRUS_NETWORK] || WALRUS_AGGREGATORS.testnet

	for (const aggregator of aggregators) {
		const endpoint = `${aggregator}${blobId}`
		try {
			const headResponse = await fetch(endpoint, {
				method: 'HEAD',
				headers: { 'User-Agent': 'sui.ski-preview/1.0' },
			})
			if (headResponse.ok) {
				return {
					contentType: headResponse.headers.get('content-type') || undefined,
					contentLength:
						parseInt(headResponse.headers.get('content-length') || '', 10) || undefined,
				}
			}
		} catch {}

		try {
			const peekResponse = await fetch(endpoint, {
				method: 'GET',
				headers: { 'User-Agent': 'sui.ski-preview/1.0', Range: 'bytes=0-0' },
			})
			if (peekResponse.ok) {
				peekResponse.body?.cancel()
				return {
					contentType: peekResponse.headers.get('content-type') || undefined,
					contentLength:
						parseInt(peekResponse.headers.get('content-length') || '', 10) || undefined,
				}
			}
		} catch {}
	}

	return {}
}

function isImageType(contentType?: string): boolean {
	return Boolean(contentType && contentType.startsWith('image/'))
}

function formatByteSize(bytes?: number): string | undefined {
	if (!bytes || !Number.isFinite(bytes) || bytes <= 0) {
		return undefined
	}
	const kb = bytes / 1024
	if (kb < 1024) {
		return `${kb.toFixed(2)} KB`
	}
	const mb = kb / 1024
	return `${mb.toFixed(2)} MB`
}

function resolveRootHostname(hostname: string): string {
	const lower = hostname.toLowerCase()
	return lower.endsWith('staging.sui.ski') ? 'staging.sui.ski' : 'sui.ski'
}

function contentPreviewHtml(meta: ContentPreviewMeta): string {
	const socialMeta = renderSocialMeta({
		title: meta.title,
		description: meta.description,
		url: meta.canonicalUrl,
		siteName: 'sui.ski',
		image: meta.imageUrl,
		imageAlt: meta.imageAlt,
	})

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<title>${escapeHtml(meta.title)}</title>
	<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}">
${socialMeta}
	<style>
		body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #05060c; color: #e4e6f1; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
		.preview-card { max-width: 520px; width: 100%; background: rgba(15, 18, 32, 0.92); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; padding: 28px; box-shadow: 0 25px 60px rgba(5, 6, 12, 0.7); text-align: center; }
		.preview-card h1 { font-size: 1.2rem; margin-bottom: 12px; }
		.preview-card p { color: #a1a6c5; font-size: 0.95rem; line-height: 1.6; }
		.preview-card a { margin-top: 16px; display: inline-flex; align-items: center; gap: 8px; color: #60a5fa; text-decoration: none; font-weight: 600; }
	</style>
</head>
<body>
	<div class="preview-card">
		<h1>${escapeHtml(meta.title)}</h1>
		<p>${escapeHtml(meta.description)}</p>
		<a href="${escapeHtml(meta.canonicalUrl)}" rel="noopener">Open content</a>
	</div>
</body>
</html>`
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => {
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
				<a href="/mvr" style="background: rgba(96, 165, 250, 0.15); border-color: rgba(96, 165, 250, 0.3);">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
					Manage Package
				</a>
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

/**
 * Proxy SuiNS NFT images to avoid CORS issues
 * Endpoint: /api/suins-image/{domain}.sui?exp={expirationTimestamp}
 * The expiration timestamp is required as it's part of the SuiNS API URL
 */
async function handleSuiNSImageProxy(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url)
		// Extract domain from path: /api/suins-image/example.sui -> example.sui
		const pathMatch = url.pathname.match(/^\/api\/suins-image\/(.+)$/)
		if (!pathMatch) {
			return new Response('Invalid path', { status: 400 })
		}

		const domain = decodeURIComponent(pathMatch[1])
		const expirationTs = url.searchParams.get('exp')

		// Validate domain format (basic check)
		if (!domain || !domain.includes('.sui')) {
			return new Response('Invalid domain format', { status: 400 })
		}

		// Build SuiNS API URL
		const suinsApiBase =
			env.SUI_NETWORK === 'mainnet'
				? 'https://api-mainnet.suins.io'
				: 'https://api-testnet.suins.io'

		// SuiNS API format: /nfts/{domain}/{expirationTimestamp}
		const imageUrl = expirationTs
			? `${suinsApiBase}/nfts/${domain}/${expirationTs}`
			: `${suinsApiBase}/nfts/${domain}`

		// Fetch the image from SuiNS API
		const response = await fetch(imageUrl, {
			headers: {
				Accept: 'image/*,*/*',
				'User-Agent': 'sui.ski-gateway/1.0',
			},
		})

		if (!response.ok) {
			// Try alternative endpoint without timestamp
			if (expirationTs) {
				const altUrl = `${suinsApiBase}/nfts/${domain}`
				const altResponse = await fetch(altUrl, {
					headers: {
						Accept: 'image/*,*/*',
						'User-Agent': 'sui.ski-gateway/1.0',
					},
				})
				if (altResponse.ok) {
					const imageData = await altResponse.arrayBuffer()
					const contentType = altResponse.headers.get('Content-Type') || 'image/svg+xml'
					return new Response(imageData, {
						status: 200,
						headers: {
							'Content-Type': contentType,
							'Access-Control-Allow-Origin': '*',
							'Cache-Control': 'public, max-age=3600',
						},
					})
				}
			}
			return new Response(`Failed to fetch image: ${response.status}`, {
				status: response.status,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			})
		}

		// Get the image data
		const imageData = await response.arrayBuffer()
		const contentType = response.headers.get('Content-Type') || 'image/svg+xml'

		// Return the image with CORS headers
		return new Response(imageData, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
			},
		})
	} catch (error) {
		console.error('SuiNS image proxy error:', error)
		return new Response('Failed to proxy image', {
			status: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
	}
}

/**
 * Generic image proxy for external URLs
 * Endpoint: /api/image-proxy?url={encodedUrl}
 * Only allows specific trusted domains
 */
async function handleImageProxy(request: Request): Promise<Response> {
	try {
		const reqUrl = new URL(request.url)
		const targetUrl = reqUrl.searchParams.get('url')

		if (!targetUrl) {
			return new Response('Missing url parameter', { status: 400 })
		}

		// Validate URL
		let parsedUrl: URL
		try {
			parsedUrl = new URL(targetUrl)
		} catch {
			return new Response('Invalid URL', { status: 400 })
		}

		// Only allow specific trusted domains
		const allowedDomains = [
			'api-mainnet.suins.io',
			'api-testnet.suins.io',
			'suins.io',
			'ipfs.io',
			'nftstorage.link',
			'cloudflare-ipfs.com',
		]

		if (
			!allowedDomains.some(
				(domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`),
			)
		) {
			return new Response('Domain not allowed', { status: 403 })
		}

		// Fetch the image
		const response = await fetch(targetUrl, {
			headers: {
				Accept: 'image/*,*/*',
				'User-Agent': 'sui.ski-gateway/1.0',
			},
		})

		if (!response.ok) {
			return new Response(`Failed to fetch image: ${response.status}`, {
				status: response.status,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			})
		}

		// Get the image data
		const imageData = await response.arrayBuffer()
		const contentType = response.headers.get('Content-Type') || 'image/png'

		// Return the image with CORS headers
		return new Response(imageData, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'public, max-age=3600',
			},
		})
	} catch (error) {
		console.error('Image proxy error:', error)
		return new Response('Failed to proxy image', {
			status: 500,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
	}
}

/**
 * Handle NFT details API requests
 */
async function handleNFTDetailsRequest(request: Request, env: Env): Promise<Response> {
	try {
		const url = new URL(request.url)
		const objectId = url.searchParams.get('objectId')

		if (!objectId) {
			return jsonResponse({ error: 'objectId parameter is required' }, 400)
		}

		// Validate object ID format
		if (!/^0x[a-fA-F0-9]{64}$/.test(objectId)) {
			return jsonResponse({ error: 'Invalid object ID format' }, 400)
		}

		const objectData = await fetchSuiNSObjectData(objectId, env)

		if (!objectData) {
			return jsonResponse({ error: 'Object not found or failed to fetch' }, 404)
		}

		return jsonResponse(objectData)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch NFT details'
		return jsonResponse({ error: message }, 500)
	}
}
