import { handleLandingPage, handleLandingApiRequest } from './handlers/landing'
import { handleMessagingRequest } from './handlers/messaging'
import { generateProfilePage } from './handlers/profile'
import { handlePWARequest } from './handlers/pwa'
import { handlePrivateRequest } from './handlers/private'
import { handleAppRequest } from './handlers/app'
import { handleAgentsRequest } from './handlers/agents'
import { handleRPCRequest } from './resolvers/rpc'
import { resolveSuiNS } from './resolvers/suins'
import { resolveContent, resolveDirectContent } from './resolvers/content'
import { handleBidsRequest } from './handlers/bids'
import { handleBountiesRequest } from './handlers/bounties'
import type { Env, SuiNSRecord } from './types'
import { errorResponse, htmlResponse, jsonResponse, notFoundPage } from './utils/response'
import { isTwitterPreviewBot } from './utils/social'
import { parseSubdomain } from './utils/subdomain'
import { ensureRpcEnv } from './utils/rpc'

export default {
	async fetch(request: Request, rawEnv: Env, _ctx: ExecutionContext): Promise<Response> {
		const env = ensureRpcEnv(rawEnv)
		
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
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

				// Handle /app routes on root domain (sui.ski/app/*)
				if (url.pathname === '/app' || url.pathname.startsWith('/app/')) {
					return handleAppRequest(request, env)
				}

				// Handle /api/app, /api/agents, /api/ika, /api/llm routes on root domain
				if (url.pathname.startsWith('/api/app/') || url.pathname.startsWith('/api/agents/') ||
					url.pathname.startsWith('/api/ika/') || url.pathname.startsWith('/api/llm/')) {
					return handleAppRequest(request, env)
				}
			}

			switch (parsed.type) {
				case 'root':
					return handleLandingPage(request, env)

				case 'rpc':
					return handleRPCRequest(request, env)

				case 'messaging':
					return handleMessagingRequest(request, env)

				case 'app':
					return handleAppRequest(request, env)

				case 'agents':
					return handleAgentsRequest(request, env)

				case 'suins': {
					// Special handling for private.sui.ski -> Private Protocol
					if (parsed.subdomain === 'private') {
						return handlePrivateRequest(request, env)
					}

					// Handle API requests on suins subdomains
					if (url.pathname.startsWith('/api/')) {
						// Route to specific API handlers
						if (url.pathname.startsWith('/api/bids')) {
							return handleBidsRequest(request, env)
						}
						if (url.pathname.startsWith('/api/bounties')) {
							return handleBountiesRequest(request, env)
						}
						// Handle /api/app/* routes (messaging, subscriptions, etc.)
						if (url.pathname.startsWith('/api/app/')) {
							return handleAppRequest(request, env)
						}
						// Try landing API handlers (sui-price, suins-image, image-proxy, etc.)
						const apiResponse = await handleLandingApiRequest(request, env)
						if (apiResponse) {
							return apiResponse
						}
					}
					return handleSuiNSRequest(parsed.subdomain, url, env, {
						isTwitterBot: isTwitterPreviewBot(userAgent),
						originalHostname: hostname,
					})
				}

				case 'content':
					return handleContentRequest(parsed.subdomain, env, {
						isTwitterBot: isTwitterPreviewBot(userAgent),
						url,
					})

				case 'mvr': {
					// Handle MVR package routes (pkg--name.sui.ski)
					const { packageName, suinsName } = parsed.mvrInfo!

					// Special handling for @iousd/private
					if (suinsName === 'iousd' && packageName === 'private') {
						return handlePrivateRequest(request, env)
					}

					// Generic MVR packages - resolve via MVR registry
					return jsonResponse({
						mvrPackage: `@${suinsName}/${packageName}`,
						version: parsed.mvrInfo?.version || 'latest',
						message: 'MVR package resolution coming soon',
					})
				}

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
		return notFoundPage(name, env, result.available)
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

	// If the name has content linked (IPFS, URL, raw Walrus blob), resolve it
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
 * Handle direct content requests (ipfs-*, walrus-*)
 */
interface ContentRequestOptions {
	isTwitterBot?: boolean
	url?: URL
}

async function handleContentRequest(
	subdomain: string,
	env: Env,
	_options: ContentRequestOptions = {},
): Promise<Response> {
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
	_options: ContentRequestOptions = {},
): Promise<Response> {
	const subdomain = `${type}-${id}`
	const result = await resolveDirectContent(subdomain, env)

	if (!result.found) {
		return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
	}

	return result.data as Response
}
