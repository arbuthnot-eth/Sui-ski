import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { SuinsClient } from '@mysten/suins'
import { Hono } from 'hono'
import type { Env } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { getDeepBookSuiPools, getNSSuiPrice, getUSDCSuiPrice } from '../utils/ns-price'
import { getDefaultOgImageUrl, getTwitterFallbackImage } from '../utils/og-image'
import { calculateRegistrationPrice, formatPricingResponse, getBasePricing } from '../utils/pricing'
import { jsonResponse } from '../utils/response'
import { getDefaultRpcUrl } from '../utils/rpc'
import { renderSocialMeta } from '../utils/social'
import { getGatewayStatus } from '../utils/status'

export interface LandingPageOptions {
	canonicalUrl?: string
	serviceFeeName?: string
	rpcUrl?: string
	network?: string
}

type ApiEnv = {
	Bindings: Env
	Variables: {
		env: Env
	}
}

export const apiRoutes = new Hono<ApiEnv>()

apiRoutes.get('/status', async (c) => {
	const status = await getGatewayStatus(c.get('env'))
	return jsonResponse(status)
})

apiRoutes.get('/resolve', async (c) => {
	const name = c.req.query('name')
	if (!name) return jsonResponse({ error: 'Name parameter required' }, 400)
	const { resolveSuiNS } = await import('../resolvers/suins')
	const result = await resolveSuiNS(name, c.get('env'))
	return jsonResponse(result)
})

apiRoutes.get('/pricing', async (c) => {
	try {
		const env = c.get('env')
		const domain = c.req.query('domain')
		const yearsParam = c.req.query('years')
		const expParam = c.req.query('expirationMs')

		if (domain) {
			const years = yearsParam ? parseInt(yearsParam, 10) : 1
			const expirationMs = expParam ? parseInt(expParam, 10) : undefined
			const pricing = await calculateRegistrationPrice({ domain, years, expirationMs, env })
			return jsonResponse(formatPricingResponse(pricing))
		}

		const pricing = await getBasePricing(env)
		return jsonResponse(pricing)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch pricing'
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.get('/ns-price', async (c) => {
	try {
		const nsPrice = await getNSSuiPrice(c.get('env'))
		return jsonResponse(nsPrice)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch NS price'
		return jsonResponse({ error: message, source: 'fallback', nsPerSui: 10, suiPerNs: 0.1 }, 500)
	}
})

apiRoutes.get('/usdc-price', async (c) => {
	try {
		const usdcPrice = await getUSDCSuiPrice(c.get('env'))
		return jsonResponse(usdcPrice)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch USDC price'
		return jsonResponse(
			{ error: message, source: 'fallback', suiPerUsdc: 0.25, usdcPerSui: 4.0 },
			500,
		)
	}
})

apiRoutes.get('/deepbook-pools', async (c) => {
	try {
		const pools = await getDeepBookSuiPools(c.get('env'))
		return jsonResponse(pools)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch pools'
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.get('/renewal-pricing', async (c) => {
	try {
		const env = c.get('env')
		const domain = c.req.query('domain')
		const yearsParam = c.req.query('years')

		if (!domain) return jsonResponse({ error: 'Domain parameter required' }, 400)

		const years = yearsParam ? parseInt(yearsParam, 10) : 1
		const { calculateRenewalPrice, formatPricingResponse } = await import('../utils/pricing')
		const pricing = await calculateRenewalPrice({ domain, years, env })
		return jsonResponse(formatPricingResponse(pricing))
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch renewal pricing'
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.post('/renew-tx', async (c) => {
	try {
		const env = c.get('env')
		const body = await c.req.json()
		const { domain, nftId, years, senderAddress, paymentMethod } = body as {
			domain: string
			nftId: string
			years: number
			senderAddress: string
			paymentMethod?: 'ns' | 'sui'
		}

		if (!domain || !nftId || !years || !senderAddress) {
			return jsonResponse(
				{ error: 'Missing required fields: domain, nftId, years, senderAddress' },
				400,
			)
		}

		const { buildSwapAndRenewTx, buildSuiRenewTx } = await import('../utils/swap-transactions')
		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		if (paymentMethod === 'sui') {
			const tx = await buildSuiRenewTx({ domain, nftId, years, senderAddress }, env)
			const txBytes = await tx.build({ client })
			return jsonResponse({
				txBytes: Buffer.from(txBytes).toString('base64'),
				method: 'sui',
			})
		}

		const result = await buildSwapAndRenewTx({ domain, nftId, years, senderAddress }, env)
		const txBytes = await result.tx.build({ client })
		return jsonResponse({
			txBytes: Buffer.from(txBytes).toString('base64'),
			breakdown: {
				suiInputMist: String(result.breakdown.suiInputMist),
				nsOutputEstimate: String(result.breakdown.nsOutputEstimate),
				renewalCostNsMist: String(result.breakdown.registrationCostNsMist),
				slippageBps: result.breakdown.slippageBps,
				nsPerSui: result.breakdown.nsPerSui,
				source: result.breakdown.source,
				priceImpactBps: result.breakdown.priceImpactBps,
			},
			method: 'ns',
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build renewal transaction'
		console.error('Renewal tx error:', error)
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.get('/sui-price', async (c) => {
	try {
		const price = await getSUIPrice(c.get('env'))
		return jsonResponse({ price })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch SUI price'
		console.error('SUI price API error:', message)
		return jsonResponse({ price: 1.0, error: message, cached: true })
	}
})

apiRoutes.get('/suins-image/:name', async (c) => {
	const namePart = c.req.param('name')
	const cleanName = namePart.replace(/\.sui$/i, '')
	if (!cleanName) return jsonResponse({ error: 'Name required' }, 400)
	const expParam = c.req.query('exp')
	const suinsApiUrl = expParam
		? `https://api-mainnet.suins.io/nfts/${encodeURIComponent(cleanName)}.sui/${expParam}`
		: `https://api-mainnet.suins.io/nfts/${encodeURIComponent(cleanName)}.sui`
	return proxyImageRequest(suinsApiUrl)
})

apiRoutes.get('/image-proxy', async (c) => {
	const targetUrl = c.req.query('url')
	if (!targetUrl) return jsonResponse({ error: 'URL parameter required' }, 400)
	return proxyImageRequest(targetUrl)
})

apiRoutes.get('/names/:address', async (c) => {
	const address = c.req.param('address')
	if (!address.startsWith('0x')) {
		return jsonResponse({ error: 'Valid Sui address required' }, 400)
	}
	return handleNamesByAddress(address, c.get('env'))
})

apiRoutes.get('/nft-details', async (c) => {
	const objectId = c.req.query('objectId')
	if (!objectId) return jsonResponse({ error: 'objectId parameter required' }, 400)
	return handleNftDetails(objectId, c.get('env'))
})

apiRoutes.get('/marketplace/:name', async (c) => {
	const name = c.req.param('name')
	if (!name) return jsonResponse({ error: 'Name parameter required' }, 400)
	return handleMarketplaceData(name, c.get('env'))
})

apiRoutes.all('/tradeport/*', async (c) => {
	return handleTradeportProxy(c.req.raw, new URL(c.req.url))
})

apiRoutes.get('/suggest-names', async (c) => {
	const query = c.req.query('q')
	if (!query || query.length < 3) {
		return jsonResponse({ error: 'Query parameter required (min 3 chars)' }, 400)
	}
	return handleNameSuggestions(query, c.get('env'))
})

/**
 * Fetch NFT details from Sui RPC
 */
async function handleNftDetails(objectId: string, env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
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
 * Uses native Sui RPC methods for reliable name resolution
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

		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		const allNames: NameInfo[] = []
		const seenNftIds = new Set<string>()

		// Network-aware SuiNS type definitions
		const SUINS_REGISTRATION_TYPES: Record<string, string[]> = {
			mainnet: [
				'0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration',
				'0xb7004c7914308557f7afbaf0dca8dd258e18e306cb7a45b28019f3d0a693f162::subdomain_registration::SubDomainRegistration',
			],
			testnet: [
				'0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93::suins_registration::SuinsRegistration',
				'0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93::subdomain_registration::SubDomainRegistration',
			],
		}

		const typesToQuery =
			SUINS_REGISTRATION_TYPES[env.SUI_NETWORK] || SUINS_REGISTRATION_TYPES.mainnet

		// Step 1: Query all SuiNS NFT types owned by this address
		for (const structType of typesToQuery) {
			let cursor: string | null | undefined
			const isSubdomain = structType.includes('subdomain_registration')

			do {
				const response = await client
					.getOwnedObjects({
						owner: address,
						filter: { StructType: structType },
						options: { showContent: true, showType: true },
						cursor: cursor || undefined,
						limit: 50,
					})
					.catch(() => null)
				if (!response) break

				for (const item of response.data) {
					if (item.data?.content?.dataType !== 'moveObject') continue
					const objectId = item.data.objectId
					if (seenNftIds.has(objectId)) continue
					seenNftIds.add(objectId)

					const fields = (item.data.content as any).fields
					let name: string | undefined
					let expirationMs: number | null = null

					if (isSubdomain) {
						const inner = fields?.nft?.fields
						name = inner?.domain_name || inner?.name
						expirationMs = inner?.expiration_timestamp_ms
							? Number(inner.expiration_timestamp_ms)
							: null
					} else {
						name = fields?.domain_name || fields?.name
						expirationMs = fields?.expiration_timestamp_ms
							? Number(fields.expiration_timestamp_ms)
							: null
					}

					if (name) {
						allNames.push({
							name: String(name),
							nftId: objectId,
							expirationMs,
							targetAddress: null,
							isPrimary: false,
						})
					}
				}

				cursor = response.hasNextPage ? response.nextCursor : null
			} while (cursor)
		}

		// Step 2: Use SuinsClient.getNameRecord to resolve each name to its target address
		// This is more reliable than the raw RPC method
		const suinsClient = new SuinsClient({
			client: client as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})

		const BATCH_SIZE = 10
		for (let i = 0; i < allNames.length; i += BATCH_SIZE) {
			const batch = allNames.slice(i, i + BATCH_SIZE)
			await Promise.all(
				batch.map(async (nameInfo) => {
					const suinsName = nameInfo.name.endsWith('.sui') ? nameInfo.name : `${nameInfo.name}.sui`
					try {
						const nameRecord = await suinsClient.getNameRecord(suinsName)
						nameInfo.targetAddress = nameRecord?.targetAddress || null
					} catch {
						// getNameRecord can fail for some valid names
					}
					if (!nameInfo.targetAddress) {
						try {
							const resolved = await client.resolveNameServiceAddress({ name: suinsName })
							if (resolved) nameInfo.targetAddress = resolved
						} catch {
							// Name genuinely has no target address
						}
					}
				}),
			)
		}

		// Step 3: Get unique target addresses and fetch their default names (reverse resolution)
		const uniqueAddresses = [
			...new Set(allNames.map((n) => n.targetAddress).filter(Boolean)),
		] as string[]
		const addressDefaultName = new Map<string, string>()

		for (let i = 0; i < uniqueAddresses.length; i += BATCH_SIZE) {
			const batch = uniqueAddresses.slice(i, i + BATCH_SIZE)
			await Promise.all(
				batch.map(async (addr) => {
					try {
						// Use native suix_resolveNameServiceNames RPC method
						const result = await client.resolveNameServiceNames({ address: addr })
						if (result.data && result.data.length > 0) {
							// First name in the list is the primary/default name
							addressDefaultName.set(addr, result.data[0])
						}
					} catch {
						// Address may not have a default name set
					}
				}),
			)
		}

		// Step 4: Mark primary names based on reverse resolution
		for (const nameInfo of allNames) {
			if (nameInfo.targetAddress) {
				const defaultName = addressDefaultName.get(nameInfo.targetAddress)
				if (defaultName) {
					const cleanName = nameInfo.name.replace(/\.sui$/, '')
					const cleanDefault = defaultName.replace(/\.sui$/, '')
					nameInfo.isPrimary = cleanName === cleanDefault
				}
			}
		}

		// Step 5: Group by target address
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

interface MarketplaceListing {
	id: string
	price: number
	seller: string
	tokenId?: string
	tradeportUrl?: string
	nonce?: string
	marketName?: string
}

interface MarketplaceBid {
	id: string
	price: number
	bidder: string
	tokenId?: string
	tradeportUrl?: string
}

interface MarketplaceNft {
	id: string
	name: string
	tokenId: string
	owner: string
	listings: MarketplaceListing[]
	bids: MarketplaceBid[]
}

interface MarketplaceData {
	name: string
	nfts: MarketplaceNft[]
	bestListing: MarketplaceListing | null
	bestBid: MarketplaceBid | null
}

const INDEXER_API_URL = 'https://api.indexer.xyz/graphql'
const INDEXER_API_USER = 'imbibed.solutions'
const INDEXER_API_KEY = 'CxDJX9A.8009f624a8a7f2549a44bedc8b1d5142'
const SUINS_COLLECTION_ID = '060fe4fb-9a3e-4170-a494-a25e62aba689'

/**
 * Fetch marketplace data (listings, bids) for a SuiNS name
 */
async function handleMarketplaceData(name: string, _env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	const normalizedName = name.endsWith('.sui') ? name : `${name}.sui`

	try {
		const query = `
			query GetNftMarketplace($name: String!, $collectionId: uuid!) {
				sui {
					nfts(where: {name: {_eq: $name}, collection_id: {_eq: $collectionId}}, limit: 10) {
						id
						name
						token_id
						owner
						listings(where: {listed: {_eq: true}}) {
							id
							price
							seller
							nonce
							market_name
						}
						bids {
							id
							price
							bidder
						}
					}
				}
			}
		`

		const response = await fetch(INDEXER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-user': INDEXER_API_USER,
				'x-api-key': INDEXER_API_KEY,
			},
			body: JSON.stringify({
				query,
				variables: { name: normalizedName, collectionId: SUINS_COLLECTION_ID },
			}),
		})

		if (!response.ok) {
			throw new Error(`Indexer API error: ${response.status}`)
		}

		const result = (await response.json()) as {
			data?: {
				sui?: {
					nfts?: Array<{
						id: string
						name: string
						token_id: string
						owner: string
						listings: Array<{
							id: string
							price: number
							seller: string
							nonce?: string
							market_name?: string
						}>
						bids: Array<{ id: string; price: number; bidder: string }>
					}>
				}
			}
			errors?: Array<{ message: string }>
		}

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'GraphQL error')
		}

		const nfts = result.data?.sui?.nfts || []

		// Transform to our format
		const marketplaceNfts: MarketplaceNft[] = nfts.map((nft) => ({
			id: nft.id,
			name: nft.name,
			tokenId: nft.token_id,
			owner: nft.owner,
			listings: nft.listings.map((l) => ({
				id: l.id,
				price: l.price,
				seller: l.seller,
				nonce: l.nonce,
				marketName: l.market_name,
			})),
			bids: nft.bids.map((b) => ({
				id: b.id,
				price: b.price,
				bidder: b.bidder,
			})),
		}))

		// Find best (lowest) listing and best (highest) bid across all NFTs
		let bestListing: MarketplaceListing | null = null
		let bestListingTokenId: string | null = null
		let bestBid: MarketplaceBid | null = null
		let bestBidTokenId: string | null = null

		for (const nft of marketplaceNfts) {
			for (const listing of nft.listings) {
				if (listing.price && (!bestListing || listing.price < bestListing.price)) {
					bestListing = listing
					bestListingTokenId = nft.tokenId
				}
			}
			for (const bid of nft.bids) {
				if (bid.price && (!bestBid || bid.price > bestBid.price)) {
					bestBid = bid
					bestBidTokenId = nft.tokenId
				}
			}
		}

		// Add Tradeport URLs
		if (bestListing && bestListingTokenId) {
			bestListing = {
				...bestListing,
				tokenId: bestListingTokenId,
				tradeportUrl: `https://www.tradeport.xyz/sui/item/${bestListingTokenId}`,
			}
		}
		if (bestBid && bestBidTokenId) {
			bestBid = {
				...bestBid,
				tokenId: bestBidTokenId,
				tradeportUrl: `https://www.tradeport.xyz/sui/item/${bestBidTokenId}`,
			}
		}

		const data: MarketplaceData = {
			name: normalizedName,
			nfts: marketplaceNfts,
			bestListing,
			bestBid,
		}

		return new Response(JSON.stringify(data), {
			status: 200,
			headers: corsHeaders,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch marketplace data'
		return new Response(
			JSON.stringify({
				error: message,
				name: normalizedName,
				nfts: [],
				bestListing: null,
				bestBid: null,
			}),
			{
				status: 500,
				headers: corsHeaders,
			},
		)
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
				Accept: 'application/json',
			},
			body: request.method !== 'GET' ? await request.text() : undefined,
			signal: controller.signal,
		})
		clearTimeout(timeoutId)

		// For 404s, return proper JSON error instead of HTML
		if (response.status === 404) {
			return new Response(JSON.stringify({ error: 'Not found', status: 404 }), {
				status: 404,
				headers: corsHeaders,
			})
		}

		const data = await response.text()

		// Ensure we return JSON for all responses
		let contentType = response.headers.get('content-type') || ''
		if (!contentType.includes('application/json')) {
			// If response is not JSON, wrap it or return error
			try {
				// Try to parse as JSON anyway (some APIs don't set content-type correctly)
				JSON.parse(data)
				contentType = 'application/json'
			} catch {
				// Not JSON, return as error
				return new Response(
					JSON.stringify({ error: 'Invalid response format', status: response.status }),
					{
						status: response.status >= 400 ? response.status : 502,
						headers: corsHeaders,
					},
				)
			}
		}

		return new Response(data, {
			status: response.status,
			headers: {
				...corsHeaders,
				'Content-Type': contentType,
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to proxy Tradeport request'
		const isTimeout =
			error instanceof Error && (error.name === 'AbortError' || message.includes('timeout'))
		return new Response(JSON.stringify({ error: message, timeout: isTimeout }), {
			status: isTimeout ? 504 : 502,
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

let suiPriceCache: { price: number; exp: number } | null = null

/**
 * Fetch SUI price from CoinGecko API with in-memory caching
 */
export async function getSUIPrice(_env?: { CACHE?: KVNamespace }): Promise<number> {
	const CACHE_TTL = 120000
	const DEFAULT_PRICE = 1.0

	if (suiPriceCache && suiPriceCache.exp > Date.now()) {
		return suiPriceCache.price
	}

	try {
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
					// Return cached in-memory value or default
					if (suiPriceCache) return suiPriceCache.price
					return DEFAULT_PRICE
				}
				throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
			}

			const data = (await response.json()) as { sui?: { usd?: number } }
			if (!data.sui?.usd || typeof data.sui.usd !== 'number' || !Number.isFinite(data.sui.usd)) {
				throw new Error('Invalid price data from CoinGecko')
			}

			const price = data.sui.usd
			suiPriceCache = { price, exp: Date.now() + CACHE_TTL }
			return price
		} catch (fetchError) {
			clearTimeout(timeoutId)
			if (suiPriceCache) return suiPriceCache.price
			return DEFAULT_PRICE
		}
	} catch {
		return suiPriceCache?.price ?? DEFAULT_PRICE
	}
}

const suggestionMemCache = new Map<string, { data: string[]; exp: number }>()

async function handleNameSuggestions(query: string, _env: Env): Promise<Response> {
	const key = query.toLowerCase()
	const cached = suggestionMemCache.get(key)
	if (cached && cached.exp > Date.now()) {
		return jsonResponse({ query, suggestions: cached.data })
	}

	const suggestions: string[] = [query]

	try {
		const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
		const response = await fetch(searchUrl, {
			headers: { 'User-Agent': 'sui.ski/1.0' },
		})

		if (response.ok) {
			const data = (await response.json()) as {
				RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
				Abstract?: string
				AbstractText?: string
			}

			const keywords = new Set<string>()

			if (data.AbstractText) {
				extractKeywords(data.AbstractText, keywords)
			}

			if (data.RelatedTopics) {
				for (const topic of data.RelatedTopics.slice(0, 8)) {
					if (topic.Text) {
						extractKeywords(topic.Text, keywords)
					}
				}
			}

			for (const kw of keywords) {
				if (kw !== query.toLowerCase() && suggestions.length < 8) {
					suggestions.push(kw)
				}
			}
		}
	} catch (e) {
		console.error('DuckDuckGo API error:', e)
	}

	if (suggestions.length < 4) {
		const fallbacks = generateFallbackSuggestions(query)
		for (const fb of fallbacks) {
			if (!suggestions.includes(fb) && suggestions.length < 8) {
				suggestions.push(fb)
			}
		}
	}

	if (suggestionMemCache.size > 50) {
		const first = suggestionMemCache.keys().next().value
		if (first) suggestionMemCache.delete(first)
	}
	suggestionMemCache.set(key, { data: suggestions, exp: Date.now() + 3600000 })
	return jsonResponse({ query, suggestions })
}

function extractKeywords(text: string, keywords: Set<string>): void {
	const stopWords = new Set([
		'the',
		'a',
		'an',
		'is',
		'are',
		'was',
		'were',
		'be',
		'been',
		'being',
		'have',
		'has',
		'had',
		'do',
		'does',
		'did',
		'will',
		'would',
		'could',
		'should',
		'may',
		'might',
		'must',
		'shall',
		'can',
		'need',
		'dare',
		'ought',
		'used',
		'to',
		'of',
		'in',
		'for',
		'on',
		'with',
		'at',
		'by',
		'from',
		'as',
		'into',
		'through',
		'during',
		'before',
		'after',
		'above',
		'below',
		'between',
		'under',
		'again',
		'further',
		'then',
		'once',
		'here',
		'there',
		'when',
		'where',
		'why',
		'how',
		'all',
		'each',
		'few',
		'more',
		'most',
		'other',
		'some',
		'such',
		'no',
		'nor',
		'not',
		'only',
		'own',
		'same',
		'so',
		'than',
		'too',
		'very',
		'just',
		'and',
		'but',
		'if',
		'or',
		'because',
		'until',
		'while',
		'also',
		'about',
		'which',
		'who',
		'whom',
		'this',
		'that',
		'these',
		'those',
		'am',
		'it',
		'its',
		'he',
		'she',
		'his',
		'her',
		'they',
		'them',
		'their',
		'what',
		'both',
		'any',
		'many',
		'known',
	])

	const words = text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
	for (const word of words) {
		if (word.length >= 3 && word.length <= 15 && !stopWords.has(word) && /^[a-z]+$/.test(word)) {
			keywords.add(word)
		}
	}
}

function generateFallbackSuggestions(query: string): string[] {
	const suggestions: string[] = []
	if (query.length >= 4) {
		suggestions.push(query + '1')
		suggestions.push(query + 's')
		suggestions.push('the' + query)
	}
	if (query.length >= 5) {
		suggestions.push(query + '0')
		suggestions.push(query.slice(0, -1))
	}
	return suggestions
}

export function landingPageHTML(_network: string, options: LandingPageOptions = {}): string {
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
		'Register SuiNS names with ~25% discount via DeepBook. Search availability instantly.'
	const socialMeta = renderSocialMeta({
		title: 'sui.ski - SuiNS Gateway',
		description: pageDescription,
		url: canonicalUrl,
		siteName: 'sui.ski',
		image: getDefaultOgImageUrl(canonicalOrigin),
		imageAlt: 'sui.ski - SuiNS Gateway',
		imageWidth: 1200,
		imageHeight: 630,
		twitterImage: getTwitterFallbackImage(),
		cardType: 'summary_large_image',
	})
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>sui.ski - SuiNS Gateway</title>
	<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
	<meta name="description" content="${escapeHtml(pageDescription)}">
${socialMeta}
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		html, body {
			min-height: 100%;
			min-height: 100dvh;
		}
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: #0a0a0f;
			color: #e4e4e7;
		}
		body::before {
			content: '';
			position: fixed;
			top: 0; left: 0; right: 0; bottom: 0;
			background: radial-gradient(ellipse at 50% 30%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
			            radial-gradient(ellipse at 70% 70%, rgba(167, 139, 250, 0.06) 0%, transparent 40%);
			pointer-events: none;
			z-index: -1;
		}

		.header {
			text-align: center;
			padding: 60px 20px 20px;
			transition: all 0.2s ease;
		}
		body.search-focused .header { display: none; }

		.logo {
			font-size: 3rem;
			font-weight: 800;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 6px;
		}
		.tagline {
			color: #71717a;
			font-size: 0.9rem;
			margin-bottom: 8px;
		}
		.discount-badge {
			font-size: 0.75rem;
			color: #52525b;
		}

		.search-container {
			position: sticky;
			top: 0;
			z-index: 100;
			padding: 12px 16px;
			background: rgba(10, 10, 15, 0.95);
			backdrop-filter: blur(10px);
		}
		.search-box {
			display: flex;
			align-items: center;
			background: rgba(20, 20, 28, 0.9);
			border: 2px solid rgba(96, 165, 250, 0.2);
			border-radius: 50px;
			padding: 4px 6px 4px 16px;
			max-width: 500px;
			margin: 0 auto;
			transition: border-color 0.2s, box-shadow 0.2s;
		}
		.search-box:focus-within {
			border-color: rgba(96, 165, 250, 0.5);
			box-shadow: 0 0 20px rgba(96, 165, 250, 0.15);
		}
		.search-box.has-results { border-radius: 20px 20px 0 0; }
		.search-input {
			flex: 1;
			padding: 10px 4px;
			background: transparent;
			border: none;
			color: #e4e4e7;
			font-size: 1rem;
			outline: none;
			min-width: 0;
		}
		.search-input::placeholder { color: #52525b; }
		.search-suffix {
			color: #71717a;
			font-size: 0.95rem;
			font-weight: 500;
			padding-right: 8px;
		}
		.search-btn {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background: linear-gradient(135deg, #60a5fa, #818cf8);
			border: none;
			color: #fff;
			cursor: pointer;
			transition: all 0.2s;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
		.search-btn svg { width: 18px; height: 18px; }
		.search-btn:hover { background: linear-gradient(135deg, #3b82f6, #6366f1); transform: scale(1.05); }
		.search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

		.search-wrapper {
			position: relative;
			max-width: 500px;
			margin: 0 auto;
		}
		.dropdown {
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			background: rgba(15, 15, 20, 0.98);
			border: 2px solid rgba(96, 165, 250, 0.3);
			border-top: 1px solid rgba(255,255,255,0.06);
			border-radius: 0 0 20px 20px;
			overflow-y: auto;
			overflow-x: hidden;
			max-height: calc(100vh - 100px);
			max-height: calc(100dvh - 100px);
			display: none;
			z-index: 100;
			backdrop-filter: blur(12px);
		}
		.dropdown::-webkit-scrollbar { width: 6px; }
		.dropdown::-webkit-scrollbar-track { background: transparent; }
		.dropdown::-webkit-scrollbar-thumb { background: rgba(96, 165, 250, 0.3); border-radius: 3px; }
		.dropdown.visible { display: block; }
		.dropdown-item {
			display: flex;
			align-items: center;
			padding: 12px 16px;
			gap: 12px;
			border-bottom: 1px solid rgba(255,255,255,0.04);
			transition: background 0.15s;
			cursor: pointer;
		}
		.dropdown-item:last-child { border-bottom: none; }
		.dropdown-item:hover { background: rgba(96, 165, 250, 0.08); }
		.dropdown-item .dot {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			flex-shrink: 0;
		}
		.dropdown-item .dot.available { background: #4ade80; box-shadow: 0 0 8px rgba(74, 222, 128, 0.5); }
		.dropdown-item .dot.taken { background: #f87171; box-shadow: 0 0 8px rgba(248, 113, 113, 0.5); }
		.dropdown-item .dot.checking { background: #71717a; animation: pulse 1s infinite; }
		@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
		.dropdown-item .name {
			flex: 1;
			font-size: 0.95rem;
			color: #e4e4e7;
			text-align: left;
		}
		.dropdown-item .name .suffix { color: #71717a; }
		.dropdown-item .status {
			font-size: 0.8rem;
			color: #71717a;
			margin-right: 8px;
		}
		.dropdown-item .status.available { color: #4ade80; }
		.dropdown-item .status.taken { color: #a1a1aa; }
		.dropdown-item .status.expiry { font-weight: 500; }
		.dropdown-item .status.expiry-red { color: #f87171; }
		.dropdown-item .status.expiry-orange { color: #fb923c; }
		.dropdown-item .status.expiry-yellow { color: #facc15; }
		.dropdown-item .status.expiry-blue { color: #60a5fa; }
		.dropdown-item .status.expiry-gray { color: #a1a1aa; }
		.dropdown-item .pricing {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			margin-right: 8px;
		}
		.dropdown-item .pricing .original {
			color: #71717a;
			text-decoration: line-through;
		}
		.dropdown-item .pricing .discounted {
			color: #4ade80;
			font-weight: 600;
		}
		.dropdown-item .register-btn {
			padding: 6px 14px;
			background: linear-gradient(135deg, #4ade80, #22c55e);
			border: none;
			border-radius: 8px;
			color: #020204;
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			white-space: nowrap;
		}
		.dropdown-item .register-btn:hover { background: linear-gradient(135deg, #22c55e, #16a34a); transform: scale(1.02); }
		.dropdown-item .dot.listed { background: #3b82f6; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5); }
		.dropdown-item .status.listing { color: #3b82f6; font-weight: 600; font-size: 0.85rem; }
		.dropdown-item .buy-btn {
			padding: 6px 14px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			border: none;
			border-radius: 8px;
			color: #fff;
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			white-space: nowrap;
			text-decoration: none;
			display: inline-block;
		}
		.dropdown-item .buy-btn:hover { background: linear-gradient(135deg, #2563eb, #7c3aed); transform: scale(1.02); }
		.dropdown-loading {
			padding: 16px;
			text-align: center;
			color: #71717a;
			font-size: 0.9rem;
		}

		.footer {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			padding: 12px 20px;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 16px;
			font-size: 0.8rem;
			color: #52525b;
			background: rgba(10, 10, 15, 0.8);
			backdrop-filter: blur(8px);
			border-top: 1px solid rgba(255,255,255,0.04);
		}
		.footer a {
			color: #71717a;
			text-decoration: none;
			transition: color 0.2s;
		}
		.footer a:hover { color: #60a5fa; }
		.footer .sep { color: #3f3f46; }
		.footer .price { color: #60a5fa; font-weight: 500; }

		body.search-focused .footer { display: none; }

		/* Wallet Button */
		.wallet-btn {
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 1000;
			padding: 10px 16px;
			background: rgba(20, 20, 28, 0.95);
			backdrop-filter: blur(12px);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 12px;
			color: #e4e4e7;
			font-size: 0.85rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.wallet-btn:hover {
			border-color: rgba(96, 165, 250, 0.5);
			background: rgba(96, 165, 250, 0.1);
		}
		.wallet-btn.connected {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15));
			border-color: rgba(96, 165, 250, 0.3);
		}
		.wallet-btn svg { width: 16px; height: 16px; }

		/* Admin Panel */
		.admin-panel {
			display: none;
			max-width: 500px;
			margin: 20px auto;
			padding: 20px;
			background: rgba(20, 20, 28, 0.9);
			border: 1px solid rgba(96, 165, 250, 0.25);
			border-radius: 16px;
			backdrop-filter: blur(12px);
		}
		.admin-panel.visible { display: block; }
		.admin-panel h3 {
			font-size: 1rem;
			font-weight: 600;
			margin-bottom: 16px;
			color: #60a5fa;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.admin-panel h3 svg { width: 18px; height: 18px; }
		.admin-stat {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px 0;
			border-bottom: 1px solid rgba(255,255,255,0.06);
		}
		.admin-stat:last-of-type { border-bottom: none; }
		.admin-stat-label { color: #71717a; font-size: 0.85rem; }
		.admin-stat-value { font-weight: 600; font-size: 1.1rem; }
		.admin-stat-value.ns { color: #a78bfa; }
		.admin-actions { margin-top: 16px; }
		.admin-btn {
			width: 100%;
			padding: 14px 20px;
			background: linear-gradient(135deg, #a78bfa, #818cf8);
			border: none;
			border-radius: 12px;
			color: white;
			font-weight: 700;
			font-size: 1rem;
			cursor: pointer;
			transition: all 0.2s;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
		}
		.admin-btn:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(167, 139, 250, 0.3); }
		.admin-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
		.admin-btn svg { width: 18px; height: 18px; }
		.admin-status {
			font-size: 0.8rem;
			padding: 8px 12px;
			border-radius: 8px;
			display: none;
		}
		.admin-status.show { display: block; }
		.admin-status.success { background: rgba(74, 222, 128, 0.1); color: #4ade80; }
		.admin-status.error { background: rgba(248, 113, 113, 0.1); color: #f87171; }
		.admin-status.info { background: rgba(96, 165, 250, 0.1); color: #60a5fa; }

		/* Wallet Modal */
		.wallet-modal {
			display: none;
			position: fixed;
			inset: 0;
			background: rgba(0,0,0,0.7);
			backdrop-filter: blur(4px);
			z-index: 10000;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.wallet-modal.open { display: flex; }
		.wallet-modal-content {
			background: rgba(20, 20, 28, 0.98);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 20px;
			max-width: 380px;
			width: 100%;
			overflow: hidden;
		}
		.wallet-modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 18px 20px;
			border-bottom: 1px solid rgba(255,255,255,0.06);
		}
		.wallet-modal-header h3 { font-size: 1rem; font-weight: 600; }
		.wallet-modal-close {
			background: none;
			border: none;
			color: #71717a;
			font-size: 1.4rem;
			cursor: pointer;
			padding: 0;
			line-height: 1;
		}
		.wallet-list { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
		.wallet-option {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 14px;
			background: rgba(255,255,255,0.03);
			border: 1px solid rgba(255,255,255,0.06);
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.2s;
			width: 100%;
			text-align: left;
			color: #e4e4e7;
			font-size: 0.95rem;
		}
		.wallet-option:hover { border-color: rgba(96, 165, 250, 0.4); background: rgba(96, 165, 250, 0.08); }
		.wallet-option img { width: 28px; height: 28px; border-radius: 6px; }

		body.search-focused .admin-panel { display: none !important; }
		body.search-focused .wallet-btn { display: none; }

		@media (max-width: 540px) {
			.header { padding: 40px 16px 16px; }
			.logo { font-size: 2.5rem; }
			.search-container { padding: 10px 12px; }
			.wallet-btn { top: 12px; right: 12px; padding: 8px 12px; font-size: 0.8rem; }
			.admin-panel { margin: 16px 12px; padding: 16px; }
		}
	</style>
</head>
<body>
	<button class="wallet-btn" id="wallet-btn">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
			<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
		</svg>
		<span id="wallet-btn-text">Connect</span>
	</button>

	<div class="wallet-modal" id="wallet-modal">
		<div class="wallet-modal-content">
			<div class="wallet-modal-header">
				<h3>Connect Wallet</h3>
				<button class="wallet-modal-close" id="wallet-modal-close">&times;</button>
			</div>
			<div class="wallet-list" id="wallet-list"></div>
		</div>
	</div>

	<div class="header">
		<h1 class="logo">sui.ski</h1>
		<p class="tagline">SuiNS name gateway</p>
		<div class="discount-badge">powered by DeepBook</div>
	</div>

	<div class="admin-panel" id="admin-panel">
		<h3>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 2L2 7l10 5 10-5-10-5z"/>
				<path d="M2 17l10 5 10-5"/>
				<path d="M2 12l10 5 10-5"/>
			</svg>
			Liquidity Pool
		</h3>
		<div class="admin-stat">
			<span class="admin-stat-label">Available NS</span>
			<span class="admin-stat-value ns" id="admin-ns-balance">--</span>
		</div>
		<div class="admin-stat">
			<span class="admin-stat-label">LP Price (+5% premium)</span>
			<span class="admin-stat-value" id="admin-ns-price">--</span>
		</div>
		<div class="admin-actions">
			<button class="admin-btn" id="add-lp-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 5v14M5 12h14"/>
				</svg>
				Add All NS to Liquidity
			</button>
			<div class="admin-status" id="admin-status"></div>
		</div>
	</div>

	<div class="search-container">
		<div class="search-wrapper">
			<form id="search-form" class="search-box">
				<input
					type="text"
					id="search-input"
					class="search-input"
					placeholder="Search names..."
					autocomplete="off"
					spellcheck="false"
				/>
				<span class="search-suffix">.sui</span>
				<button type="submit" class="search-btn" id="search-btn">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
				</button>
			</form>
			<div class="dropdown" id="dropdown"></div>
		</div>
	</div>

	<div class="footer">
		<a href="/mvr">Packages</a>
		<span class="sep">·</span>
		<a href="https://suins.io" target="_blank">SuiNS</a>
		<span class="sep">·</span>
		<a href="https://deepbook.tech" target="_blank">DeepBook</a>
		<span class="sep">·</span>
		<span>SUI <span class="price" id="sui-price">$--</span></span>
	</div>

	<script type="module">
		import { getWallets } from 'https://esm.sh/@wallet-standard/app@1.1.0';
		import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from 'https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle';
		import { SuinsClient } from 'https://esm.sh/@mysten/suins@1.0.0?bundle';
		import { Transaction } from 'https://esm.sh/@mysten/sui@2.2.0/transactions?bundle';
		const SERVICE_FEE_NAME = ${JSON.stringify(options.serviceFeeName || null)};
		const RPC_URLS = { mainnet: 'https://fullnode.mainnet.sui.io:443', testnet: 'https://fullnode.testnet.sui.io:443', devnet: 'https://fullnode.devnet.sui.io:443' };
		const NETWORK = ${JSON.stringify(options.network || 'mainnet')};
		const RPC_URL = RPC_URLS[NETWORK] || RPC_URLS.mainnet;

		const NS_TYPE = '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS';
		const SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
		const DEEPBOOK_PACKAGE = '0x337f4f4f6567fcd778d5454f27c16c70e2f274cc6377ea6249ddf491482ef497';
		const NS_SUI_POOL = '0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8';
		const BALANCE_MANAGER_TYPE = DEEPBOOK_PACKAGE + '::balance_manager::BalanceManager';

		let connectedWallet = null;
		let connectedAccount = null;
		let connectedAddress = null;
		let adminAddress = null;
		let suiClient = null;
		let suinsClient = null;
		let balanceManagerId = null;

		const walletBtn = document.getElementById('wallet-btn');
		const walletBtnText = document.getElementById('wallet-btn-text');
		const walletModal = document.getElementById('wallet-modal');
		const walletModalClose = document.getElementById('wallet-modal-close');
		const walletList = document.getElementById('wallet-list');
		const adminPanel = document.getElementById('admin-panel');
		const adminNsBalance = document.getElementById('admin-ns-balance');
		const adminNsPrice = document.getElementById('admin-ns-price');
		const addLpBtn = document.getElementById('add-lp-btn');
		const adminStatus = document.getElementById('admin-status');

		const LP_PREMIUM = 1.05;
		let currentNsBalance = 0n;
		let currentMarketPrice = 0;

		async function initClients() {
			suiClient = new SuiJsonRpcClient({ url: RPC_URL });
			suinsClient = new SuinsClient({ client: suiClient, network: NETWORK });
			if (SERVICE_FEE_NAME) {
				try {
					const record = await suinsClient.getNameRecord(SERVICE_FEE_NAME);
					if (record?.targetAddress) adminAddress = record.targetAddress;
				} catch {}
			}
		}

		async function resolveWalletName(address) {
			if (!address || !suiClient) return;
			try {
				const result = await suiClient.resolveNameServiceNames({ address });
				const name = result?.data?.[0];
				if (name && walletBtnText) {
					walletBtnText.textContent = name;
					walletBtnText.title = address;
				}
			} catch (e) {
				console.log('Reverse resolution failed:', e.message);
			}
		}

		function showStatus(msg, type) {
			adminStatus.textContent = msg;
			adminStatus.className = 'admin-status show ' + type;
		}

		async function findBalanceManager() {
			if (!connectedAddress) return null;
			try {
				const objects = await suiClient.getOwnedObjects({
					owner: connectedAddress,
					filter: { StructType: BALANCE_MANAGER_TYPE },
					options: { showContent: true }
				});
				console.log('Balance Manager search result:', objects);
				if (objects.data?.length) {
					return objects.data[0].data?.objectId || null;
				}
			} catch (e) {
				console.error('findBalanceManager error:', e);
			}
			return null;
		}

		async function loadAdminData() {
			if (!connectedAddress || connectedAddress !== adminAddress) return;
			adminPanel.classList.add('visible');
			try {
				const [coins, bmId, priceRes] = await Promise.all([
					suiClient.getCoins({ owner: connectedAddress, coinType: NS_TYPE }),
					findBalanceManager(),
					fetch('/api/ns-price')
				]);

				balanceManagerId = bmId;

				currentNsBalance = 0n;
				for (const c of coins.data) currentNsBalance += BigInt(c.balance);
				const nsTokens = Number(currentNsBalance) / 1e6;
				adminNsBalance.textContent = nsTokens.toFixed(2) + ' NS';

				if (priceRes.ok) {
					const priceData = await priceRes.json();
					currentMarketPrice = priceData.suiPerNs || 0;
					const lpPrice = currentMarketPrice * LP_PREMIUM;
					adminNsPrice.textContent = lpPrice.toFixed(4) + ' SUI/NS';
				}

				if (!balanceManagerId) {
					addLpBtn.textContent = 'Create Balance Manager';
					addLpBtn.disabled = false;
				} else if (nsTokens < 1) {
					addLpBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Add All NS to Liquidity';
					addLpBtn.disabled = true;
				} else {
					addLpBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Add All NS to Liquidity';
					addLpBtn.disabled = false;
				}
			} catch (e) {
				console.error('Failed to load admin data:', e);
			}
		}

		// Wallet Standard API with fallbacks
		let walletsApi = null;
		try { walletsApi = getWallets(); } catch (e) { console.error('Wallet API init failed:', e); }

		function getSuiWallets() {
			const wallets = [];
			const seenNames = new Set();

			if (walletsApi) {
				try {
					for (const wallet of walletsApi.get()) {
						if (wallet.chains?.some(c => c.startsWith('sui:'))) {
							wallets.push(wallet);
							seenNames.add(wallet.name);
						}
					}
				} catch (e) {}
			}

			// Fallback: check window globals
			const windowWallets = [
				{ check: () => window.phantom?.sui, name: 'Phantom' },
				{ check: () => window.suiWallet, name: 'Sui Wallet' },
			];
			for (const wc of windowWallets) {
				try {
					const w = wc.check();
					if (w && !seenNames.has(wc.name)) {
						wallets.push({
							name: wc.name,
							icon: w.icon || '',
							chains: ['sui:mainnet', 'sui:testnet'],
							features: w.features || {
								'standard:connect': w.connect ? { connect: w.connect.bind(w) } : undefined,
								'sui:signAndExecuteTransaction': w.signAndExecuteTransaction
									? { signAndExecuteTransaction: w.signAndExecuteTransaction.bind(w) } : undefined,
								'sui:signAndExecuteTransactionBlock': w.signAndExecuteTransactionBlock
									? { signAndExecuteTransactionBlock: w.signAndExecuteTransactionBlock.bind(w) } : undefined,
							},
							accounts: w.accounts || [],
							_raw: w,
						});
						seenNames.add(wc.name);
					}
				} catch (e) {}
			}
			return wallets;
		}

		async function detectWallets() {
			await new Promise(r => setTimeout(r, 100));
			let wallets = getSuiWallets();
			if (wallets.length) return wallets;
			await new Promise(r => setTimeout(r, 500));
			return getSuiWallets();
		}

		async function connectWallet(wallet) {
			walletList.innerHTML = '<div style="padding:20px;text-align:center"><span class="loading"></span> Connecting...</div>';
			try {
				const connectFeature = wallet.features?.['standard:connect'] || wallet._raw?.connect;
				if (!connectFeature) throw new Error('Wallet does not support connect');

				let accounts;
				if (typeof connectFeature === 'function') {
					const result = await connectFeature();
					accounts = result?.accounts || result;
				} else if (typeof connectFeature.connect === 'function') {
					const result = await connectFeature.connect();
					accounts = result?.accounts || result;
				}

				if (!accounts?.length) {
					await new Promise(r => setTimeout(r, 200));
					accounts = wallet.accounts || wallet._raw?.accounts;
				}

				if (!accounts?.length) throw new Error('No accounts. Please unlock your wallet.');

				connectedWallet = wallet;
				connectedAccount = accounts[0];
				connectedAddress = connectedAccount.address;
				walletBtn.classList.add('connected');
				walletBtnText.textContent = connectedAddress.slice(0, 6) + '...' + connectedAddress.slice(-4);
				walletModal.classList.remove('open');

				// Reverse resolve SuiNS name for connected address
				resolveWalletName(connectedAddress);

				await loadAdminData();
			} catch (e) {
				const msg = String(e?.message || '');
				if (msg.includes('unlock') || msg.includes('No accounts') || msg.includes('rejected')) {
					walletList.innerHTML = '<div style="padding:20px;color:#f87171;text-align:center">' + msg + '</div>';
				} else {
					walletModal.classList.remove('open');
				}
			}
		}

		function disconnectWallet() {
			if (connectedWallet?.features?.['standard:disconnect']?.disconnect) {
				try { connectedWallet.features['standard:disconnect'].disconnect(); } catch {}
			}
			connectedWallet = null;
			connectedAccount = null;
			connectedAddress = null;
			walletBtn.classList.remove('connected');
			walletBtnText.textContent = 'Connect';
			adminPanel.classList.remove('visible');
		}

		async function openWalletModal() {
			if (connectedAddress) { disconnectWallet(); return; }
			walletList.innerHTML = '<div style="padding:20px;text-align:center"><span class="loading"></span> Detecting wallets...</div>';
			walletModal.classList.add('open');

			const wallets = await detectWallets();
			if (!wallets.length) {
				walletList.innerHTML = '<div style="padding:20px;color:#71717a;text-align:center">' +
					'No Sui wallets detected.<br><br>' +
					'<a href="https://phantom.app/download" target="_blank" style="color:#a78bfa">Install Phantom →</a><br>' +
					'<a href="https://suiwallet.com" target="_blank" style="color:#a78bfa">Install Sui Wallet →</a></div>';
			} else {
				walletList.innerHTML = wallets.map(w =>
					'<button class="wallet-option" data-name="' + w.name + '">' +
					(w.icon ? '<img src="' + w.icon + '" alt="" onerror="this.style.display=\\'none\\'">' : '') +
					w.name + '</button>'
				).join('');
				wallets.forEach(w => {
					const btn = walletList.querySelector('[data-name="' + w.name + '"]');
					if (btn) btn.onclick = () => connectWallet(w);
				});
			}
		}

		walletBtn.onclick = openWalletModal;
		walletModalClose.onclick = () => walletModal.classList.remove('open');
		walletModal.onclick = (e) => { if (e.target === walletModal) walletModal.classList.remove('open'); };

		addLpBtn.onclick = async () => {
			if (!connectedAddress || !connectedWallet) {
				showStatus('Connect wallet first', 'error');
				return;
			}

			addLpBtn.disabled = true;

			try {
				if (!balanceManagerId) {
					showStatus('Creating Balance Manager...', 'info');
					const tx = new Transaction();
					tx.setSender(connectedAddress);

					const bm = tx.moveCall({
						target: DEEPBOOK_PACKAGE + '::balance_manager::new',
						arguments: [],
					});
					tx.transferObjects([bm], connectedAddress);
					tx.setGasBudget(10000000);

					showStatus('Confirm in wallet...', 'info');
					const result = await executeTransaction(tx);
					console.log('Create BM result:', result);

					// Extract created Balance Manager ID from transaction result (handle different wallet formats)
					const createdObjects = result?.effects?.created || [];
					for (const obj of createdObjects) {
						const objId = obj.reference?.objectId || obj.objectId;
						if (objId) {
							balanceManagerId = objId;
							break;
						}
					}

					// Fallback: check objectChanges format
					if (!balanceManagerId && result?.objectChanges) {
						for (const change of result.objectChanges) {
							if (change.type === 'created' && change.objectType?.includes('BalanceManager')) {
								balanceManagerId = change.objectId;
								break;
							}
						}
					}

					if (balanceManagerId) {
						showStatus('Balance Manager created! Click again to add LP.', 'success');
						addLpBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Add All NS to Liquidity';
						addLpBtn.disabled = false;
					} else {
						showStatus('Created! Waiting for indexer...', 'info');
						await new Promise(r => setTimeout(r, 3000));
						await loadAdminData();
					}
					return;
				}

				if (currentNsBalance < 1000000n) {
					showStatus('Need at least 1 NS', 'error');
					return;
				}
				if (!currentMarketPrice) {
					showStatus('Price not loaded', 'error');
					return;
				}

				showStatus('Building transaction...', 'info');

				const coins = await suiClient.getCoins({ owner: connectedAddress, coinType: NS_TYPE });
				if (!coins.data.length) throw new Error('No NS coins found');

				const tx = new Transaction();
				tx.setSender(connectedAddress);

				const coinIds = coins.data.map(c => c.coinObjectId);
				let nsCoin;
				if (coinIds.length === 1) {
					nsCoin = tx.object(coinIds[0]);
				} else {
					tx.mergeCoins(tx.object(coinIds[0]), coinIds.slice(1).map(id => tx.object(id)));
					nsCoin = tx.object(coinIds[0]);
				}

				tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::balance_manager::deposit',
					typeArguments: [NS_TYPE],
					arguments: [tx.object(balanceManagerId), nsCoin],
				});

				const lpPrice = currentMarketPrice * LP_PREMIUM;
				const priceInTicks = BigInt(Math.floor(lpPrice * 1e9));

				const tradeProof = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::balance_manager::generate_proof_as_owner',
					arguments: [tx.object(balanceManagerId)],
				});

				tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::place_limit_order',
					typeArguments: [NS_TYPE, SUI_TYPE],
					arguments: [
						tx.object(NS_SUI_POOL),
						tx.object(balanceManagerId),
						tradeProof,
						tx.pure.u64(Date.now()),
						tx.pure.u8(0),
						tx.pure.u8(0),
						tx.pure.u64(priceInTicks),
						tx.pure.u64(currentNsBalance),
						tx.pure.bool(false),
						tx.pure.bool(true),
						tx.pure.u64(Date.now() + 30 * 86400000),
						tx.object('0x6'),
					],
				});

				tx.setGasBudget(50000000);

				showStatus('Confirm in wallet...', 'info');
				await executeTransaction(tx);

				const nsAdded = (Number(currentNsBalance) / 1e6).toFixed(2);
				showStatus('Added ' + nsAdded + ' NS to LP!', 'success');
				await loadAdminData();
			} catch (e) {
				showStatus('Failed: ' + e.message, 'error');
			} finally {
				addLpBtn.disabled = false;
			}
		};

		async function executeTransaction(tx) {
			const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
			const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
			const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];
			const txOptions = { showEffects: true, showObjectChanges: true };

			// Wallet-standard features expect Transaction object directly (wallet handles serialization)
			if (signExecFeature?.signAndExecuteTransaction) {
				return await signExecFeature.signAndExecuteTransaction({
					transaction: tx,
					account: connectedAccount,
					chain,
					options: txOptions,
				});
			}

			if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
				return await signExecBlockFeature.signAndExecuteTransactionBlock({
					transactionBlock: tx,
					account: connectedAccount,
					chain,
					options: txOptions,
				});
			}

			// Legacy/direct wallet access needs pre-built bytes
			const txBytes = await tx.build({ client: suiClient });

			if (window.phantom?.sui?.signAndExecuteTransactionBlock) {
				try {
					return await window.phantom.sui.signAndExecuteTransactionBlock({
						transactionBlock: txBytes,
						options: txOptions,
					});
				} catch (e) {
					const txB64 = btoa(String.fromCharCode.apply(null, Array.from(txBytes)));
					return await window.phantom.sui.signAndExecuteTransactionBlock({
						transactionBlock: txB64,
						options: txOptions,
					});
				}
			}

			if (window.suiWallet?.signAndExecuteTransactionBlock) {
				return await window.suiWallet.signAndExecuteTransactionBlock({
					transactionBlock: tx,
				});
			}

			throw new Error('No compatible Sui wallet found');
		}

		initClients();

		// ========== SEARCH FUNCTIONALITY ==========
		const searchInput = document.getElementById('search-input');
		const searchForm = document.getElementById('search-form');
		const searchBox = searchForm;
		const dropdown = document.getElementById('dropdown');

		let debounceTimer = null;
		let lastQuery = '';
		const cache = new Map();
		const suggestCache = new Map();

		async function fetchSuggestions(query) {
			if (suggestCache.has(query)) return suggestCache.get(query);
			try {
				const res = await fetch('/api/suggest-names?q=' + encodeURIComponent(query));
				if (res.ok) {
					const data = await res.json();
					suggestCache.set(query, data.suggestions || [query]);
					return data.suggestions || [query];
				}
			} catch (e) {}
			return [query];
		}

		function showDropdown(names) {
			if (!names.length) {
				dropdown.classList.remove('visible');
				searchBox.classList.remove('has-results');
				return;
			}
			dropdown.innerHTML = names.map(n =>
				'<div class="dropdown-item" data-name="' + n + '">' +
				'<span class="dot checking"></span>' +
				'<span class="name">' + n + '<span class="suffix">.sui</span></span>' +
				'<span class="status">checking...</span>' +
				'</div>'
			).join('');
			dropdown.classList.add('visible');
			searchBox.classList.add('has-results');
			names.forEach(checkName);
		}

		async function checkName(name) {
			const item = dropdown.querySelector('[data-name="' + name + '"]');
			if (!item) return;
			if (cache.has(name)) {
				updateItem(item, name, cache.get(name));
				return;
			}
			try {
				const [resolveRes, marketRes] = await Promise.all([
					fetch('/api/resolve?name=' + encodeURIComponent(name)),
					fetch('/api/marketplace/' + encodeURIComponent(name)).catch(() => null)
				]);
				const resolveData = await resolveRes.json();
				let marketData = null;
				if (marketRes && marketRes.ok) {
					marketData = await marketRes.json();
				}
				let available = !resolveData.found;
				let listingPrice = null;
				let tradeportUrl = null;
				if (marketData && marketData.bestListing && marketData.bestListing.price) {
					if (available) available = false;
					listingPrice = marketData.bestListing.price;
					tradeportUrl = marketData.bestListing.tradeportUrl;
				}
				const result = {
					available,
					expirationMs: resolveData.data?.expirationTimestampMs ? Number(resolveData.data.expirationTimestampMs) : null,
					inGracePeriod: resolveData.inGracePeriod || false,
					listingPrice,
					tradeportUrl
				};
				cache.set(name, result);
				updateItem(item, name, result);
			} catch (e) {
				item.querySelector('.status').textContent = 'error';
				item.querySelector('.dot').className = 'dot taken';
			}
		}

		function getExpiryInfo(expirationMs) {
			if (!expirationMs) return null;
			const now = Date.now();
			const gracePeriodMs = 30 * 24 * 60 * 60 * 1000;
			const fullExpiry = expirationMs + gracePeriodMs;
			const daysLeft = Math.ceil((fullExpiry - now) / (24 * 60 * 60 * 1000));
			let color = 'gray';
			if (daysLeft <= 0) color = 'red';
			else if (daysLeft <= 30) color = 'red';
			else if (daysLeft <= 90) color = 'orange';
			else if (daysLeft <= 180) color = 'yellow';
			else color = 'blue';
			return { daysLeft: Math.max(0, daysLeft), color };
		}

		async function updateItem(item, name, result) {
			const dot = item.querySelector('.dot');
			const status = item.querySelector('.status');
			const available = typeof result === 'boolean' ? result : result.available;
			const expirationMs = typeof result === 'object' ? result.expirationMs : null;
			const listingPrice = typeof result === 'object' ? result.listingPrice : null;
			const tradeportUrl = typeof result === 'object' ? result.tradeportUrl : null;

			if (available) {
				dot.className = 'dot available';
				status.className = 'status available';
				status.textContent = '';
				fetchPricing(item, name);
				const btn = document.createElement('button');
				btn.className = 'register-btn';
				btn.textContent = 'Register';
				btn.onclick = (e) => {
					e.stopPropagation();
					window.location.href = 'https://' + name + '.sui.ski?register=1';
				};
				item.appendChild(btn);
			} else if (listingPrice && tradeportUrl) {
				dot.className = 'dot listed';
				const suiPrice = (Number(listingPrice) / 1e9).toFixed(2);
				status.className = 'status listing';
				status.textContent = suiPrice + ' SUI';
				const btn = document.createElement('a');
				btn.className = 'buy-btn';
				btn.textContent = 'Buy';
				btn.href = tradeportUrl;
				btn.target = '_blank';
				btn.rel = 'noopener noreferrer';
				btn.onclick = (e) => e.stopPropagation();
				item.appendChild(btn);
			} else {
				dot.className = 'dot taken';
				const expiry = getExpiryInfo(expirationMs);
				if (expiry && expiry.daysLeft > 0) {
					status.className = 'status expiry expiry-' + expiry.color;
					const years = Math.floor(expiry.daysLeft / 365);
					const days = expiry.daysLeft % 365;
					status.textContent = years > 0 ? years + 'y ' + days + 'd' : expiry.daysLeft + 'd';
				} else {
					status.className = 'status taken';
					status.textContent = 'taken';
				}
			}
		}

		async function fetchPricing(item, name) {
			try {
				const res = await fetch('/api/pricing?domain=' + encodeURIComponent(name) + '&years=1');
				if (!res.ok) return;
				const data = await res.json();
				const status = item.querySelector('.status');
				if (data.directSuiMist && data.discountedSuiMist) {
					const original = (Number(data.directSuiMist) / 1e9).toFixed(2);
					const discounted = (Number(data.discountedSuiMist) / 1e9).toFixed(2);
					status.innerHTML = '<span class="pricing"><span class="original">' + original + '</span><span class="discounted">' + discounted + ' SUI</span></span>';
				}
			} catch (e) {}
		}

		searchInput.addEventListener('input', () => {
			const name = searchInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\\.sui$/, '');
			if (!name) {
				dropdown.classList.remove('visible');
				searchBox.classList.remove('has-results');
				lastQuery = '';
				return;
			}
			if (name === lastQuery) return;
			if (name.length < 3) {
				dropdown.innerHTML = '<div class="dropdown-loading">Min 3 characters</div>';
				dropdown.classList.add('visible');
				searchBox.classList.add('has-results');
				return;
			}
			lastQuery = name;
			clearTimeout(debounceTimer);
			dropdown.innerHTML = '<div class="dropdown-loading">Finding related names...</div>';
			dropdown.classList.add('visible');
			searchBox.classList.add('has-results');
			debounceTimer = setTimeout(async () => {
				const suggestions = await fetchSuggestions(name);
				if (lastQuery === name) showDropdown(suggestions);
			}, 300);
		});

		searchInput.addEventListener('focus', () => {
			document.body.classList.add('search-focused');
			window.scrollTo({ top: 0, behavior: 'instant' });
			searchInput.scrollIntoView({ block: 'start', behavior: 'instant' });
			if (dropdown.innerHTML && lastQuery.length >= 3) {
				dropdown.classList.add('visible');
				searchBox.classList.add('has-results');
			}
		});

		searchInput.addEventListener('blur', () => {
			setTimeout(() => {
				if (!dropdown.contains(document.activeElement)) {
					document.body.classList.remove('search-focused');
				}
			}, 200);
		});

		dropdown.addEventListener('click', (e) => {
			const item = e.target.closest('.dropdown-item');
			if (item && !e.target.classList.contains('register-btn') && !e.target.classList.contains('buy-btn')) {
				const name = item.dataset.name;
				window.location.href = 'https://' + name + '.sui.ski';
			}
		});

		document.addEventListener('click', (e) => {
			if (!e.target.closest('.search-container')) {
				dropdown.classList.remove('visible');
				searchBox.classList.remove('has-results');
				document.body.classList.remove('search-focused');
			}
		});

		searchForm.addEventListener('submit', (e) => {
			e.preventDefault();
			const name = searchInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
			if (name && name.length >= 3) window.location.href = 'https://' + name + '.sui.ski';
		});

		async function updatePrice() {
			try {
				const res = await fetch('/api/sui-price');
				if (res.ok) {
					const data = await res.json();
					if (data.price) document.getElementById('sui-price').textContent = '$' + data.price.toFixed(2);
				}
			} catch (e) {}
		}
		updatePrice();
		setInterval(updatePrice, 60000);
	</script>
</body>
</html>`
}
