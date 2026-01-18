import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import type { Env } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { htmlResponse, jsonResponse } from '../utils/response'
import { renderSocialMeta } from '../utils/social'
import { getGatewayStatus } from '../utils/status'

interface LandingPageOptions {
	canonicalUrl?: string
}

/**
 * Handle requests to the root domain (sui.ski)
 */
export async function handleLandingPage(request: Request, env: Env): Promise<Response> {
	const apiResponse = await handleLandingApiRequest(request, env)
	if (apiResponse) {
		return apiResponse
	}

	const url = new URL(request.url)
	const canonicalUrl = `${url.protocol}//${url.hostname}${url.pathname || '/'}`

	// Landing page HTML
	return htmlResponse(landingPageHTML(env.SUI_NETWORK, { canonicalUrl }))
}

export async function handleLandingApiRequest(
	restRequest: Request,
	env: Env,
): Promise<Response | null> {
	const url = new URL(restRequest.url)

	if (url.pathname === '/api/status') {
		const status = await getGatewayStatus(env)
		return jsonResponse(status)
	}

	if (url.pathname === '/api/resolve') {
		const name = url.searchParams.get('name')
		if (!name) {
			return jsonResponse({ error: 'Name parameter required' }, 400)
		}
		const { resolveSuiNS } = await import('../resolvers/suins')
		const result = await resolveSuiNS(name, env)
		return jsonResponse(result)
	}

	if (url.pathname === '/api/pricing') {
		try {
			const pricing = await getSuiNSPricing(env)
			return jsonResponse(pricing)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to fetch pricing'
			return jsonResponse({ error: message }, 500)
		}
	}

	if (url.pathname === '/api/sui-price') {
		try {
			const price = await getSUIPrice(env)
			return jsonResponse({ price })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to fetch SUI price'
			console.error('SUI price API error:', message)
			return jsonResponse({ price: 1.0, error: message, cached: true })
		}
	}

	// SuiNS NFT image proxy - /api/suins-image/{name}.sui
	if (url.pathname.startsWith('/api/suins-image/')) {
		const namePart = url.pathname.replace('/api/suins-image/', '')
		const cleanName = namePart.replace(/\.sui$/i, '')
		if (!cleanName) {
			return jsonResponse({ error: 'Name required' }, 400)
		}
		const expParam = url.searchParams.get('exp')
		// Use api-mainnet.suins.io which is the working endpoint
		const suinsApiUrl = expParam
			? `https://api-mainnet.suins.io/nfts/${encodeURIComponent(cleanName)}.sui/${expParam}`
			: `https://api-mainnet.suins.io/nfts/${encodeURIComponent(cleanName)}.sui`
		
		return proxyImageRequest(suinsApiUrl)
	}

	// Generic image proxy - /api/image-proxy?url={url}
	if (url.pathname === '/api/image-proxy') {
		const targetUrl = url.searchParams.get('url')
		if (!targetUrl) {
			return jsonResponse({ error: 'URL parameter required' }, 400)
		}
		return proxyImageRequest(targetUrl)
	}

	// Names by address endpoint - /api/names/{address}
	if (url.pathname.startsWith('/api/names/')) {
		const address = url.pathname.replace('/api/names/', '')
		if (!address || !address.startsWith('0x')) {
			return jsonResponse({ error: 'Valid Sui address required' }, 400)
		}
		return handleNamesByAddress(address, env)
	}

	// NFT details endpoint - /api/nft-details?objectId={id}
	if (url.pathname === '/api/nft-details') {
		const objectId = url.searchParams.get('objectId')
		if (!objectId) {
			return jsonResponse({ error: 'objectId parameter required' }, 400)
		}
		return handleNftDetails(objectId, env)
	}

	// Tradeport proxy - /api/tradeport/name/{name} or /api/tradeport/bid
	if (url.pathname.startsWith('/api/tradeport/')) {
		return handleTradeportProxy(restRequest, url)
	}

	return null
}

/**
 * Fetch NFT details from Sui RPC
 */
async function handleNftDetails(objectId: string, env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		const client = new SuiClient({ url: env.SUI_RPC_URL })
		const object = await client.getObject({
			id: objectId,
			options: {
				showContent: true,
				showDisplay: true,
				showOwner: true,
			},
		})

		if (!object.data) {
			return new Response(JSON.stringify({ error: 'Object not found' }), {
				status: 404,
				headers: corsHeaders,
			})
		}

		return new Response(JSON.stringify(object.data), {
			status: 200,
			headers: corsHeaders,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch NFT details'
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: corsHeaders,
		})
	}
}

interface NameInfo {
	name: string
	nftId: string
	expirationMs: number | null
	targetAddress: string | null
	isPrimary: boolean
}

interface LinkedNamesCache {
	names: NameInfo[]
	grouped: Record<string, NameInfo[]>
}

const LINKED_NAMES_CACHE_TTL = 300 // 5 minutes

/**
 * Fetch all SuiNS names owned by an address with expiration and target address data
 * Uses parallel batch fetching for target addresses to maximize performance
 */
async function handleNamesByAddress(address: string, env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		// Check cache first
		const key = cacheKey('linked-names', env.SUI_NETWORK, address)
		const cached = await getCached<LinkedNamesCache>(env, key)
		if (cached) {
			return new Response(JSON.stringify(cached), {
				status: 200,
				headers: { ...corsHeaders, 'X-Cache': 'HIT' },
			})
		}

		const client = new SuiClient({ url: env.SUI_RPC_URL })
		const suinsClient = new SuinsClient({
			client: client as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})

		// SuiNS NFT types
		const suinsNftTypes = [
			'0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration',
			'0x22fa05f21b1ad71442571fe5757571a2c063d7856c1a2b174de01f21a6f562ee::suins_registration::SuinsRegistration',
		]

		const allNames: NameInfo[] = []
		let cursor: string | null | undefined = undefined

		// Paginate through all owned objects
		do {
			const response = await client.getOwnedObjects({
				owner: address,
				options: { showContent: true, showType: true },
				cursor: cursor || undefined,
				limit: 50,
			})

			// Filter for SuiNS NFTs and extract name + expiration + target address
			for (const item of response.data) {
				const objType = item.data?.type || ''
				const isSuinsNft = suinsNftTypes.some((t) => objType.includes(t.split('::')[0]))
				if (isSuinsNft && item.data?.content?.dataType === 'moveObject') {
					const fields = (item.data.content as { fields?: {
						domain_name?: string
						name?: string
						expiration_timestamp_ms?: string | number
						target_address?: string
					} }).fields
					const name = fields?.domain_name || fields?.name
					const expirationMs = fields?.expiration_timestamp_ms
						? Number(fields.expiration_timestamp_ms)
						: null
					// Get target_address directly from NFT fields (no extra RPC call needed)
					const targetAddress = fields?.target_address || null
					if (name) {
						allNames.push({
							name,
							nftId: item.data.objectId,
							expirationMs,
							targetAddress,
							isPrimary: false,
						})
					}
				}
			}

			cursor = response.hasNextPage ? response.nextCursor : null
		} while (cursor)

		// Get unique target addresses to check reverse resolution
		const uniqueAddresses = [...new Set(allNames.map(n => n.targetAddress).filter(Boolean))] as string[]

		// Fetch reverse resolution for each unique address in parallel
		// Query the reverse_registry dynamic field on the suins object
		const addressDefaultName = new Map<string, string>()
		const suinsObjectId = suinsClient.config.suins
		const CONCURRENCY_LIMIT = 10

		for (let i = 0; i < uniqueAddresses.length; i += CONCURRENCY_LIMIT) {
			const batch = uniqueAddresses.slice(i, i + CONCURRENCY_LIMIT)
			await Promise.all(batch.map(async (addr) => {
				try {
					// Query the reverse lookup dynamic field
					const reverseRecord = await client.getDynamicFieldObject({
						parentId: suinsObjectId,
						name: {
							type: 'address',
							value: addr,
						},
					})
					if (reverseRecord.data?.content?.dataType === 'moveObject') {
						const fields = (reverseRecord.data.content as { fields?: { value?: string; domain_name?: string } }).fields
						const defaultName = fields?.value || fields?.domain_name
						if (defaultName) {
							addressDefaultName.set(addr, defaultName)
						}
					}
				} catch {
					// Skip if reverse resolution fails (no default name set)
				}
			}))
		}

		// Mark primary names only if they match the reverse resolution
		for (const nameInfo of allNames) {
			if (nameInfo.targetAddress) {
				const defaultName = addressDefaultName.get(nameInfo.targetAddress)
				// Compare without .sui suffix
				const cleanName = nameInfo.name.replace(/\.sui$/, '')
				const cleanDefault = defaultName?.replace(/\.sui$/, '')
				nameInfo.isPrimary = cleanName === cleanDefault
			}
		}

		// Group by target address
		const grouped: Record<string, NameInfo[]> = {}
		for (const nameInfo of allNames) {
			const key = nameInfo.targetAddress || 'unset'
			if (!grouped[key]) grouped[key] = []
			grouped[key].push(nameInfo)
		}

		// Sort each group by expiration, with primary first
		for (const groupKey of Object.keys(grouped)) {
			grouped[groupKey].sort((a, b) => {
				// Primary names come first
				if (a.isPrimary && !b.isPrimary) return -1
				if (!a.isPrimary && b.isPrimary) return 1
				// Then by expiration
				if (a.expirationMs === null) return 1
				if (b.expirationMs === null) return -1
				return a.expirationMs - b.expirationMs
			})
		}

		const result: LinkedNamesCache = { names: allNames, grouped }

		// Cache the result
		await setCache(env, key, result, LINKED_NAMES_CACHE_TTL)

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'MISS' },
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch names'
		return new Response(JSON.stringify({ error: message, names: [], grouped: {} }), {
			status: 500,
			headers: corsHeaders,
		})
	}
}

/**
 * Proxy requests to Tradeport API
 */
async function handleTradeportProxy(request: Request, url: URL): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		// Build Tradeport API URL
		const tradeportPath = url.pathname.replace('/api/tradeport', '')
		const tradeportUrl = `https://api.tradeport.xyz${tradeportPath}${url.search}`

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 15000)

		const response = await fetch(tradeportUrl, {
			method: request.method,
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': 'sui.ski-gateway/1.0',
			},
			body: request.method !== 'GET' ? await request.text() : undefined,
			signal: controller.signal,
		})
		clearTimeout(timeoutId)

		const data = await response.text()

		return new Response(data, {
			status: response.status,
			headers: corsHeaders,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to proxy Tradeport request'
		return new Response(JSON.stringify({ error: message }), {
			status: 502,
			headers: corsHeaders,
		})
	}
}

/**
 * Proxy an image request to avoid CORS issues
 */
async function proxyImageRequest(targetUrl: string): Promise<Response> {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 15000)

		const response = await fetch(targetUrl, {
			headers: {
				'User-Agent': 'sui.ski-gateway/1.0',
				Accept: 'image/*,*/*',
			},
			signal: controller.signal,
		})
		clearTimeout(timeoutId)

		if (!response.ok) {
			return new Response(null, { status: response.status })
		}

		const contentType = response.headers.get('content-type') || 'image/png'
		const body = await response.arrayBuffer()

		return new Response(body, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=3600',
				'Access-Control-Allow-Origin': '*',
			},
		})
	} catch (error) {
		console.error('Image proxy error:', error)
		return new Response(null, { status: 502 })
	}
}

/**
 * Fetch SuiNS pricing from on-chain config
 */
async function getSuiNSPricing(env: Env): Promise<Record<string, number>> {
	const client = new SuiClient({ url: env.SUI_RPC_URL })
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const suinsClient = new SuinsClient({ client: client as never, network })

	const priceList = await suinsClient.getPriceList()

	// Convert Map to object with human-readable keys
	// Format: { "3": price, "4": price, "5+": price } (price per year in MIST)
	const pricing: Record<string, number> = {}

	for (const [key, value] of priceList.entries()) {
		const [minLen, maxLen] = key
		if (minLen === maxLen) {
			pricing[String(minLen)] = value
		} else {
			pricing[`${minLen}-${maxLen}`] = value
		}
	}

	return pricing
}

/**
 * Fetch SUI price from CoinGecko API with caching and rate limit handling
 */
export async function getSUIPrice(env?: { CACHE?: KVNamespace }): Promise<number> {
	const CACHE_KEY = 'sui_price_cache'
	const CACHE_TTL = 60 // Cache for 60 seconds
	const DEFAULT_PRICE = 1.0 // Fallback price
	
	try {
		// Check cache first
		if (env?.CACHE) {
			const cached = await env.CACHE.get(CACHE_KEY)
			if (cached) {
				const cachedData = JSON.parse(cached) as { price: number; timestamp: number }
				const age = Date.now() - cachedData.timestamp
				if (age < CACHE_TTL * 1000) {
					return cachedData.price
				}
			}
		}

		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

		try {
			const response = await fetch(
				'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd',
				{
					headers: {
						Accept: 'application/json',
						'User-Agent': 'sui.ski-gateway/1.0',
					},
					signal: controller.signal,
				},
			)
			clearTimeout(timeoutId)

			if (!response.ok) {
				// Handle rate limiting (429) gracefully
				if (response.status === 429) {
					console.warn('CoinGecko API rate limited, using cached or default price')
					// Try to get cached value even if expired
					if (env?.CACHE) {
						const staleCache = await env.CACHE.get(CACHE_KEY)
						if (staleCache) {
							const staleData = JSON.parse(staleCache) as { price: number }
							return staleData.price
						}
					}
					return DEFAULT_PRICE
				}
				throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
			}

			const data = (await response.json()) as { sui?: { usd?: number } }
			if (!data.sui?.usd || typeof data.sui.usd !== 'number' || !Number.isFinite(data.sui.usd)) {
				throw new Error('Invalid price data from CoinGecko')
			}
			
			const price = data.sui.usd
			
			// Cache the result
			if (env?.CACHE) {
				await env.CACHE.put(
					CACHE_KEY,
					JSON.stringify({ price, timestamp: Date.now() }),
					{ expirationTtl: CACHE_TTL * 2 }, // Cache for 2x TTL to handle rate limits
				)
			}
			
			return price
		} catch (fetchError) {
			clearTimeout(timeoutId)
			if (fetchError instanceof Error && fetchError.name === 'AbortError') {
				console.warn('CoinGecko API timeout, using cached or default price')
				// Try cached value on timeout
				if (env?.CACHE) {
					const cached = await env.CACHE.get(CACHE_KEY)
					if (cached) {
						const cachedData = JSON.parse(cached) as { price: number }
						return cachedData.price
					}
				}
				return DEFAULT_PRICE
			}
			// For other errors, try cache before throwing
			if (env?.CACHE) {
				const cached = await env.CACHE.get(CACHE_KEY)
				if (cached) {
					const cachedData = JSON.parse(cached) as { price: number }
					console.warn('Using cached price due to error:', fetchError instanceof Error ? fetchError.message : String(fetchError))
					return cachedData.price
				}
			}
			throw fetchError
		}
	} catch (error) {
		console.error('Failed to fetch SUI price:', error)
		// Return default price instead of throwing to prevent UI errors
		return DEFAULT_PRICE
	}
}

function landingPageHTML(network: string, options: LandingPageOptions = {}): string {
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
	const canonicalUrl = options.canonicalUrl || 'https://sui.ski'
	let canonicalOrigin = 'https://sui.ski'
	try {
		canonicalOrigin = new URL(canonicalUrl).origin
	} catch {
		canonicalOrigin = 'https://sui.ski'
	}
	const pageDescription =
		'Access Sui blockchain content through human-readable URLs. Resolve SuiNS names, Move Registry packages, and decentralized content.'
	const socialMeta = renderSocialMeta({
		title: 'sui.ski - Sui Gateway',
		description: pageDescription,
		url: canonicalUrl,
		siteName: 'sui.ski',
		image: `${canonicalOrigin}/icon-512.png`,
		imageAlt: 'sui.ski icon',
	})
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>sui.ski - Sui Gateway</title>
	<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
	<meta name="description" content="${escapeHtml(pageDescription)}">
${socialMeta}
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 60px 20px 40px;
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
		.container { max-width: 1100px; width: 100%; position: relative; margin: 0 auto; }
		.focus-card {
			border: 1px solid rgba(96, 165, 250, 0.18);
			background: linear-gradient(145deg, rgba(30, 41, 110, 0.35), rgba(8, 47, 73, 0.35));
			padding: 28px;
			border-radius: 24px;
			margin-bottom: 32px;
			box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
		}
		.focus-card h2 { font-size: 1.4rem; margin-bottom: 12px; }
		.focus-card p { color: #c1c9e8; }
		.focus-list {
			margin: 18px 0 0;
			padding-left: 20px;
			color: #a1accf;
			line-height: 1.6;
		}
		.focus-list li { margin-bottom: 6px; }
		.quick-form {
			display: flex;
			gap: 12px;
			margin-top: 18px;
			flex-wrap: wrap;
		}
		.quick-form input {
			flex: 1;
			min-width: 200px;
			padding: 12px 14px;
			border-radius: 12px;
			border: 1px solid rgba(255, 255, 255, 0.08);
			background: rgba(12, 16, 35, 0.7);
			color: #e4e4e7;
			font-size: 0.95rem;
		}
		.quick-form button {
			border-radius: 12px;
			border: none;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			font-weight: 600;
			padding: 12px 20px;
			cursor: pointer;
			box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
		}
		.quick-form button:hover { transform: translateY(-1px); }
		@media (max-width: 960px) {
			.portal-grid { grid-template-columns: 1fr; }
			.portal-header h2 { font-size: 2rem; }
			.portal-field-grid { grid-template-columns: 1fr; }
		}
		.status-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 16px;
			margin-bottom: 32px;
		}
		.status-card {
			background: rgba(15, 23, 42, 0.7);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 18px;
			padding: 20px;
			display: flex;
			flex-direction: column;
			gap: 6px;
			box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
		}
		.status-card h3 {
			font-size: 0.95rem;
			font-weight: 600;
			color: #c7d2fe;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			margin: 0;
		}
		.status-value {
			font-size: 1.25rem;
			font-weight: 700;
		}
		.status-value.ok { color: #34d399; }
		.status-value.warn { color: #fbbf24; }
		.status-value.error { color: #f87171; }
		.status-meta {
			font-size: 0.8rem;
			color: #94a3b8;
			min-height: 1.25rem;
		}
		footer {
			margin-top: auto;
			padding-top: 48px;
			text-align: center;
			color: #71717a;
			font-size: 0.875rem;
		}
		footer a { color: #60a5fa; }
		footer a:hover { text-decoration: underline; }
		#crypto-tracker {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			background: rgba(10, 10, 15, 0.95);
			backdrop-filter: blur(10px);
			border-top: 1px solid rgba(96, 165, 250, 0.2);
			padding: 12px 20px;
			display: flex;
			justify-content: center;
			gap: 24px;
			flex-wrap: wrap;
			z-index: 1000;
			font-size: 0.875rem;
		}
		#crypto-tracker span {
			color: #c7d2fe;
			font-weight: 500;
		}
		#sui-price {
			color: #60a5fa;
			font-weight: 600;
		}
		@media (max-width: 540px) {
			h1 { font-size: 3rem; }
			.example { flex-direction: column; align-items: flex-start; gap: 6px; }
			.arrow { display: none; }
			#crypto-tracker {
				gap: 16px;
				padding: 10px 16px;
				font-size: 0.8rem;
			}
		}
		/* Custom Scrollbar Styles - Black track with SuiNS blue gradient */
		* {
			scrollbar-width: thin;
			scrollbar-color: #60a5fa #000000;
		}
		*::-webkit-scrollbar {
			width: 6px;
			height: 6px;
		}
		*::-webkit-scrollbar-track {
			background: #000000;
		}
		*::-webkit-scrollbar-thumb {
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			border-radius: 3px;
		}
		*::-webkit-scrollbar-thumb:hover {
			background: linear-gradient(135deg, #7ab8ff, #b99cff);
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<span class="network-badge">${network}</span>
			<h1>sui.ski</h1>
			<p class="tagline">Your gateway to the Sui ecosystem</p>
		</div>

		<div class="status-grid" id="status-grid">
			<div class="status-card">
				<h3>Sui RPC</h3>
				<div class="status-value" id="status-rpc-value">Loading...</div>
				<div class="status-meta" id="status-rpc-meta">Checking checkpoints</div>
			</div>
			<div class="status-card">
				<h3>Move Registry</h3>
				<div class="status-value" id="status-mvr-value">Loading...</div>
				<div class="status-meta" id="status-mvr-meta">Validating registry object</div>
			</div>
			<div class="status-card">
				<h3>Passkey / Ika</h3>
				<div class="status-value" id="status-ika-value">Loading...</div>
				<div class="status-meta" id="status-ika-meta">Verifying shared objects</div>
			</div>
			<div class="status-card">
				<h3>Messaging SDK</h3>
				<div class="status-value" id="status-msg-value">Loading...</div>
				<div class="status-meta" id="status-msg-meta">Contract wiring</div>
			</div>
		</div>

		<div class="card focus-card">
			<h2>Registration Workflow</h2>
			<p>Queue bids, attach offline-signed registrations, and let sui.ski relay them the moment a name becomes available.</p>
			<form id="registration-check" class="quick-form">
				<input id="registration-name" type="text" placeholder="example" autocomplete="off" spellcheck="false" />
				<button type="submit">Open name</button>
			</form>
			<ul class="focus-list">
				<li>Attach offline-signed tx bytes without exposing key material.</li>
				<li>Automatic relays publish digests once finalized.</li>
				<li>Monitor public queue data at <code>/api/bids/&lt;name&gt;</code>.</li>
			</ul>
		</div>

		<div class="card focus-card">
			<h2>Shareable *.sui.ski Links</h2>
			<p>Every *.sui.ski hostname now returns Open Graph metadata so Twitter/X and other crawlers always render a preview.</p>
			<ul class="focus-list">
				<li>Profile pages expose avatars and descriptions for SuiNS names.</li>
				<li>Walrus/IPFS subdomains return lightweight preview HTML.</li>
				<li>Fallback imagery served from sui.ski keeps embeds consistent.</li>
			</ul>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
				SuiNS Name Resolution
			</h2>
			<p>Access content linked to SuiNS names directly in your browser.</p>
			<div class="examples">
				<div class="example">
					<span class="example-url">myname.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">Resolves myname.sui content</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
				Move Registry Packages
			</h2>
			<p>Browse Move packages using human-readable MVR names. <a href="/mvr">Manage your packages</a></p>
			<div class="examples">
				<div class="example">
					<span class="example-url">core--suifrens.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">@suifrens/core package</span>
				</div>
				<div class="example">
					<span class="example-url">nft--myname--v2.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">@myname/nft version 2</span>
				</div>
				<div class="example">
					<span class="example-url"><a href="/mvr" style="color: #60a5fa;">sui.ski/mvr</a></span>
					<span class="arrow">→</span>
					<span class="example-desc">Package management UI</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
				Decentralized Content
			</h2>
			<p>Direct access to IPFS and Walrus content. <a href="/upload">Upload files</a> to Walrus.</p>
			<div class="examples">
				<div class="example">
					<span class="example-url">ipfs-Qm....sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">IPFS content by CID</span>
				</div>
				<div class="example">
					<span class="example-url">walrus-{blobId}.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">Walrus blob content</span>
				</div>
				<div class="example">
					<span class="example-url"><a href="/upload" style="color: #60a5fa;">sui.ski/upload</a></span>
					<span class="arrow">→</span>
					<span class="example-desc">Upload to Walrus</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
				RPC Proxy
			</h2>
			<p>Public Sui RPC endpoint at <code>rpc.sui.ski</code></p>
			<div class="examples">
				<div class="example">
					<span class="example-url">POST rpc.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">JSON-RPC (read-only methods)</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
				Sui Stack Messaging
				<span style="font-size: 0.7rem; padding: 4px 8px; background: rgba(251, 191, 36, 0.15); color: #fbbf24; border-radius: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-left: 8px;">Alpha</span>
			</h2>
			<p>End-to-end encrypted messaging powered by Sui + Walrus + Seal. <a href="/messages">Learn more</a></p>
			<div class="examples">
				<div class="example">
					<span class="example-url">sui.ski/messages</span>
					<span class="arrow">→</span>
					<span class="example-desc">Encrypted Web3 messaging</span>
				</div>
				<div class="example">
					<span class="example-url">sui.ski/api/messaging/status</span>
					<span class="arrow">→</span>
					<span class="example-desc">SDK status & features</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
				API
			</h2>
			<p>Programmatic access to resolution services.</p>
			<div class="examples">
				<div class="example">
					<span class="example-url">sui.ski/api/status</span>
					<span class="arrow">→</span>
					<span class="example-desc">Network status</span>
				</div>
				<div class="example">
					<span class="example-url">sui.ski/api/resolve?name=myname</span>
					<span class="arrow">→</span>
					<span class="example-desc">Resolve SuiNS name</span>
				</div>
			</div>
		</div>
	</div>

	<div id="crypto-tracker">
		<span id="sui-price">SUI: $--</span>
	</div>

	<footer>
		<p>Built on <a href="https://sui.io">Sui</a> · <a href="https://suins.io">SuiNS</a> · <a href="https://moveregistry.com">MVR</a> · <a href="https://walrus.xyz">Walrus</a></p>
	</footer>

	<script>
		(() => {
			const cards = {
				rpc: {
					value: document.getElementById('status-rpc-value'),
					meta: document.getElementById('status-rpc-meta'),
				},
				mvr: {
					value: document.getElementById('status-mvr-value'),
					meta: document.getElementById('status-mvr-meta'),
				},
				ika: {
					value: document.getElementById('status-ika-value'),
					meta: document.getElementById('status-ika-meta'),
				},
				msg: {
					value: document.getElementById('status-msg-value'),
					meta: document.getElementById('status-msg-meta'),
				},
			}

			updateGatewayStatus()

			async function updateGatewayStatus() {
				try {
					const response = await fetch('/api/status')
					if (!response.ok) {
						throw new Error('Status request failed')
					}
					const data = await response.json()
					applyRpc(data.rpc)
					applyMoveRegistry(data.moveRegistry)
					applyIka(data.ika)
					applyMessaging(data.messaging)
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Unable to load status'
					Object.values(cards).forEach((card) => {
						setCardState(card, 'error', message, 'Unavailable')
					})
				}
			}

			function applyRpc(payload) {
				if (!payload) return
				const meta = payload.ok
					? 'Checkpoint #' + (payload.latestCheckpoint ?? 'unknown')
					: payload.error || 'RPC unreachable'
				const value = payload.ok ? payload.chainId || 'Online' : 'Offline'
				setCardState(cards.rpc, payload.ok ? 'ok' : 'error', meta, value)
			}

			function applyMoveRegistry(payload) {
				if (!payload) return
				if (!payload.configured) {
					setCardState(cards.mvr, 'warn', 'Set MOVE_REGISTRY_PARENT_ID', 'Not Configured')
					return
				}
				const meta = payload.ok
					? 'Object ' + shorten(payload.registryId)
					: payload.error || 'Registry object unreachable'
				setCardState(cards.mvr, payload.ok ? 'ok' : 'error', meta, payload.ok ? 'Ready' : 'Degraded')
			}

			function applyIka(payload) {
				if (!payload) return
				const failing = Object.entries(payload.objects || {})
					.filter(([, ok]) => !ok)
					.map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
				let meta = 'Network: ' + payload.network
				if (failing.length > 0) {
					meta += ' - Check ' + failing.join(', ')
				}
				setCardState(
					cards.ika,
					payload.ok ? 'ok' : 'error',
					meta,
					payload.ok ? 'Ready' : 'Unavailable',
				)
			}

			function applyMessaging(payload) {
				if (!payload) {
					setCardState(cards.msg, 'warn', 'No configuration data', 'Unknown')
					return
				}
				if (!payload.configured) {
					setCardState(cards.msg, 'warn', 'Set MESSAGING_CONTRACT_ADDRESS', 'Disabled')
					return
				}
				const meta = payload.contractAddress ? 'Contract ' + shorten(payload.contractAddress) : ''
				setCardState(cards.msg, 'ok', meta, 'Enabled')
			}

			function setCardState(card, state, meta, value) {
				if (!card?.value || !card?.meta) return
				card.value.textContent = value || ''
				card.value.classList.remove('ok', 'warn', 'error')
				card.value.classList.add(state)
				card.meta.textContent = meta || ''
			}

			function shorten(value) {
				if (!value) return ''
				if (value.length <= 12) return value
				return value.slice(0, 6) + '...' + value.slice(-4)
			}

			const registrationForm = document.getElementById('registration-check')
			const registrationInput = document.getElementById('registration-name')
			if (registrationForm && registrationInput) {
				registrationForm.addEventListener('submit', (event) => {
					event.preventDefault()
					const rawValue = registrationInput.value.trim().toLowerCase()
					if (!rawValue) return
					const slug = rawValue.endsWith('.sui') ? rawValue.slice(0, -4) : rawValue
					if (!slug) return
					window.location.href = 'https://' + slug + '.sui.ski'
				})
			}

			// Update SUI price
			const suiPriceEl = document.getElementById('sui-price')
			async function updateSUIPrice() {
				if (!suiPriceEl) return
				try {
					const response = await fetch('/api/sui-price')
					if (!response.ok) throw new Error('Failed to fetch price')
					const contentType = response.headers.get('content-type') || ''
					if (!contentType.includes('application/json')) {
						throw new Error('Invalid price response type')
					}
					let data
					try {
						data = await response.json()
					} catch (parseError) {
						throw new Error('Failed to parse price response')
					}
					if (data && typeof data.price === 'number' && Number.isFinite(data.price)) {
						suiPriceEl.textContent = 'SUI: $' + data.price.toFixed(2)
						return
					}
					throw new Error('Malformed price payload')
				} catch (error) {
					console.error('Failed to update SUI price:', error)
					suiPriceEl.textContent = 'SUI: --'
				}
			}
			updateSUIPrice()
			setInterval(updateSUIPrice, 60000) // Update every minute
		})()
	</script>

	
</body>
</html>`
}
