import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'

// Lazy load Tradeport SDK to avoid global scope issues
let SuiTradingClient: any = null
async function getTradingClient() {
	if (!SuiTradingClient) {
		const module = await import('@tradeport/sui-trading-sdk')
		SuiTradingClient = module.SuiTradingClient
	}
	return SuiTradingClient
}

interface GraphQLResponse<T> {
	data?: T
	errors?: Array<{ message: string }>
}

interface CollectionResult {
	sui: {
		collections: Array<{
			id: string
			slug: string
			title: string
			floor: number | null
			volume: number | null
			supply: number | null
			verified: boolean
		}>
	}
}

interface ListingResult {
	sui: {
		listings: Array<{
			id: string
			price: number
			seller: string
			nft: {
				id: string
				name: string
				token_id: string
				owner: string | null
				collection: {
					title: string
					slug: string
				}
			}
		}>
	}
}

interface NFTResult {
	sui: {
		nfts: Array<{
			id: string
			token_id: string
			name: string
			owner: string | null
			collection: {
				id: string
				title: string
				slug: string
				floor: number | null
			}
		}>
	}
}

interface BidResult {
	sui: {
		bids: Array<{
			id: string
			price: number
			bidder: string
			nft: {
				id: string
				name: string
			}
		}>
	}
}

interface ActivityResult {
	sui: {
		activities: Array<{
			price: number | null
			timestamp: string
			marketplace?: {
				name: string | null
			} | null
			nft: {
				name: string
				token_id: string
			}
		}>
	}
}

interface NFTSearchResult {
	sui: {
		nfts: Array<{
			name: string
			last_sale_price: number | null
			listings: Array<{
				price: number
			}>
		}>
	}
}

interface RecentSale {
	name: string
	priceMist: number
	timestamp: string
	marketplace: string | null
}

interface RecentMint {
	name: string
	timestamp: string
}

interface SearchResult {
	name: string
	lastSalePriceMist: number | null
	listingPriceMist: number | null
}

async function graphqlQuery<T>(
	env: Env,
	query: string,
	variables: Record<string, unknown> = {},
): Promise<T> {
	if (!env.TRADEPORT_API_KEY || !env.TRADEPORT_USER || !env.TRADEPORT_API_URL) {
		throw new Error('Tradeport API credentials not configured')
	}

	const response = await fetch(env.TRADEPORT_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-api-key': env.TRADEPORT_API_KEY,
			'x-api-user': env.TRADEPORT_USER,
		},
		body: JSON.stringify({ query, variables }),
	})

	if (!response.ok) {
		throw new Error(`Tradeport API error: ${response.status}`)
	}

	const result = (await response.json()) as GraphQLResponse<T>

	if (result.errors?.length) {
		throw new Error(result.errors[0].message)
	}

	if (!result.data) {
		throw new Error('No data returned from Tradeport API')
	}

	return result.data
}

// Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
function mistToSui(mist: number): number {
	return mist / 1_000_000_000
}

/**
 * Get SuiNS listings (names for sale)
 */
async function getSuiNSListings(env: Env, limit = 25) {
	const query = `
		query GetSuiNSListings($limit: Int!) {
			sui {
				listings(
					where: { nft: { name: { _ilike: "%.sui" } } }
					order_by: { price: asc }
					limit: $limit
				) {
					id
					price
					seller
					nft {
						id
						name
						token_id
						owner
						collection {
							title
							slug
						}
					}
				}
			}
		}
	`

	const data = await graphqlQuery<ListingResult>(env, query, { limit })
	return data.sui.listings.map((l) => ({
		...l,
		priceSui: mistToSui(l.price),
	}))
}

/**
 * Search for a specific SuiNS name
 */
async function searchSuiNSName(env: Env, name: string) {
	// Ensure .sui suffix
	const fullName = name.endsWith('.sui') ? name : `${name}.sui`

	const query = `
		query SearchSuiNSName($name: String!) {
			sui {
				nfts(
					where: { name: { _eq: $name } }
					limit: 1
				) {
					id
					token_id
					name
					owner
					collection {
						id
						title
						slug
						floor
					}
				}
			}
		}
	`

	const data = await graphqlQuery<NFTResult>(env, query, { name: fullName })
	return data.sui.nfts[0] || null
}

/**
 * Get listing for a specific NFT by name
 */
async function getListingByName(env: Env, name: string) {
	const fullName = name.endsWith('.sui') ? name : `${name}.sui`

	const query = `
		query GetListingByName($name: String!) {
			sui {
				listings(
					where: { nft: { name: { _eq: $name } } }
					limit: 1
				) {
					id
					price
					seller
					nft {
						id
						name
						token_id
						owner
						collection {
							title
							slug
						}
					}
				}
			}
		}
	`

	const data = await graphqlQuery<ListingResult>(env, query, { name: fullName })
	const listing = data.sui.listings[0]
	if (listing) {
		return {
			...listing,
			priceSui: mistToSui(listing.price),
		}
	}
	return null
}

/**
 * Get bids on a specific NFT
 */
async function getBidsForName(env: Env, name: string) {
	const fullName = name.endsWith('.sui') ? name : `${name}.sui`

	const query = `
		query GetBidsForName($name: String!) {
			sui {
				bids(
					where: { nft: { name: { _eq: $name } } }
					order_by: { price: desc }
					limit: 10
				) {
					id
					price
					bidder
					nft {
						id
						name
					}
				}
			}
		}
	`

	const data = await graphqlQuery<BidResult>(env, query, { name: fullName })
	return data.sui.bids.map((b) => ({
		...b,
		priceSui: mistToSui(b.price),
	}))
}

/**
 * Get top Sui collections
 */
async function getTopCollections(env: Env, limit = 10) {
	const query = `
		query GetTopCollections($limit: Int!) {
			sui {
				collections(
					order_by: { volume: desc }
					limit: $limit
				) {
					id
					slug
					title
					floor
					volume
					supply
					verified
				}
			}
		}
	`

	const data = await graphqlQuery<CollectionResult>(env, query, { limit })
	return data.sui.collections.map((c) => ({
		...c,
		floorSui: c.floor ? mistToSui(c.floor) : null,
		volumeSui: c.volume ? mistToSui(c.volume) : null,
	}))
}

async function getRecentSuiNSSales(
	env: Env,
	minPriceMist: number,
	limit = 12,
): Promise<RecentSale[]> {
	const safeLimit = Math.min(Math.max(limit, 1), 50)
	const minPrice = Math.max(Math.floor(minPriceMist), 0)

	const query = `
		query GetRecentSuiNSSales {
			sui {
				activities(
					where: {
						collection: { slug: { _eq: "suins" } }
						type: { _eq: "sale" }
						price: { _gte: ${minPrice} }
					}
					order_by: { timestamp: desc }
					limit: ${safeLimit}
				) {
					price
					timestamp
					marketplace {
						name
					}
					nft {
						name
						token_id
					}
				}
			}
		}
	`

	const data = await graphqlQuery<ActivityResult>(env, query)
	return data.sui.activities
		.map((activity) => {
			const rawName = activity.nft?.name || ''
			const cleaned = rawName.replace(/\.sui$/i, '')
			if (!cleaned) {
				return null
			}

			return {
				name: cleaned,
				priceMist: activity.price ?? 0,
				timestamp: activity.timestamp,
				marketplace: activity.marketplace?.name || null,
			}
		})
		.filter((entry): entry is RecentSale => Boolean(entry))
}

async function getRecentSuiNSMints(env: Env, limit = 20): Promise<RecentMint[]> {
	const safeLimit = Math.min(Math.max(limit, 1), 50)

	const query = `
		query GetRecentSuiNSMints {
			sui {
				activities(
					where: {
						collection: { slug: { _eq: "suins" } }
						type: { _eq: "mint" }
					}
					order_by: { timestamp: desc }
					limit: ${safeLimit}
				) {
					timestamp
					nft {
						name
						token_id
					}
				}
			}
		}
	`

	const data = await graphqlQuery<ActivityResult>(env, query)
	return data.sui.activities
		.map((activity) => {
			const rawName = activity.nft?.name || ''
			const cleaned = rawName.replace(/\.sui$/i, '')
			if (!cleaned) {
				return null
			}

			return {
				name: cleaned,
				timestamp: activity.timestamp,
			}
		})
		.filter((entry): entry is RecentMint => Boolean(entry))
}

async function searchSuiNames(env: Env, search: string, limit = 8): Promise<SearchResult[]> {
	const safeLimit = Math.min(Math.max(limit, 1), 25)
	const pattern = `%${search}%`

	const query = `
		query SearchSuiNames($pattern: String!, $limit: Int!) {
			sui {
				nfts(
					where: {
						collection: { slug: { _eq: "suins" } }
						name: { _ilike: $pattern }
					}
					order_by: { last_sale_price: desc_nulls_last }
					limit: $limit
				) {
					name
					last_sale_price
					listings(where: { status: { _eq: "active" } }, limit: 1) {
						price
					}
				}
			}
		}
	`

	const data = await graphqlQuery<NFTSearchResult>(env, query, {
		pattern,
		limit: safeLimit,
	})

	return data.sui.nfts.map((nft) => ({
		name: nft.name,
		lastSalePriceMist: nft.last_sale_price ?? null,
		listingPriceMist: nft.listings?.[0]?.price ?? null,
	}))
}

export async function handleTradeportRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname.replace(/^\/api\/tradeport\/?/, '').replace(/\/$/, '')

	// Check API credentials
	if (!env.TRADEPORT_API_KEY || !env.TRADEPORT_USER) {
		return errorResponse(
			'Tradeport API credentials not configured',
			'TRADEPORT_NOT_CONFIGURED',
			501,
		)
	}

	try {
		// GET /api/tradeport or /api/tradeport/status
		if (path === '' || path === 'status') {
			return jsonResponse({
				configured: true,
				ready: true,
				endpoints: [
					'GET /api/tradeport/listings - SuiNS names for sale',
					'GET /api/tradeport/name/:name - Details & listing for a name',
					'GET /api/tradeport/collections - Top Sui collections',
					'GET /api/tradeport/suins/recent-sales - High-value recent sales',
					'GET /api/tradeport/suins/recent-mints - Recent mints',
					'GET /api/tradeport/search?query=name - Search SuiNS names',
				],
			})
		}

		// GET /api/tradeport/listings - Get SuiNS names for sale
		if (path === 'listings') {
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '25', 10), 25)
			const listings = await getSuiNSListings(env, limit)
			return jsonResponse({
				listings,
				count: listings.length,
			})
		}

		// GET /api/tradeport/collections - Get top collections
		if (path === 'collections') {
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10), 25)
			const collections = await getTopCollections(env, limit)
			return jsonResponse({ collections })
		}

		// GET /api/tradeport/suins/recent-sales
		if (path === 'suins/recent-sales') {
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '12', 10), 50)
			const minPriceMistRaw = parseInt(url.searchParams.get('minPriceMist') || '0', 10)
			const minPriceMist = Number.isFinite(minPriceMistRaw) ? minPriceMistRaw : 0

			const sales = await getRecentSuiNSSales(env, minPriceMist, limit)
			return jsonResponse({ sales })
		}

		// GET /api/tradeport/suins/recent-mints
		if (path === 'suins/recent-mints') {
			const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)
			const mints = await getRecentSuiNSMints(env, limit)
			return jsonResponse({ mints })
		}

		// GET /api/tradeport/search?query=xyz
		if (path === 'search') {
			const queryParam = url.searchParams.get('query')?.trim() || ''
			if (queryParam.length < 3) {
				return errorResponse('Query parameter must be at least 3 characters', 'BAD_REQUEST', 400)
			}

			const limit = Math.min(parseInt(url.searchParams.get('limit') || '8', 10), 25)
			const results = await searchSuiNames(env, queryParam, limit)
			return jsonResponse({ results })
		}

		// GET /api/tradeport/name/:name - Get details for a specific name
		if (path.startsWith('name/')) {
			const name = decodeURIComponent(path.replace('name/', '')).toLowerCase()
			if (!name) {
				return errorResponse('Name parameter required', 'BAD_REQUEST', 400)
			}

			const [nft, listing, bids] = await Promise.all([
				searchSuiNSName(env, name),
				getListingByName(env, name),
				getBidsForName(env, name).catch(() => []),
			])

			return jsonResponse({
				name: name.endsWith('.sui') ? name : `${name}.sui`,
				found: !!nft,
				nft,
				listing,
				isListed: !!listing,
				bids,
				highestBid: bids[0] || null,
			})
		}

		// POST /api/tradeport/bid - Build a bid transaction
		if (path === 'bid' && request.method === 'POST') {
			try {
				const body = (await request.json()) as {
					nftId?: string
					bidAmountMist?: number
					walletAddress?: string
				}

				const { nftId, bidAmountMist, walletAddress } = body

				if (!nftId || !bidAmountMist || !walletAddress) {
					return errorResponse(
						'Missing required fields: nftId, bidAmountMist, walletAddress',
						'BAD_REQUEST',
						400,
					)
				}

				if (bidAmountMist <= 0) {
					return errorResponse('Bid amount must be greater than 0', 'BAD_REQUEST', 400)
				}

				// Initialize Tradeport SDK (lazy loaded)
				const TradingClient = await getTradingClient()
				const tradingClient = new TradingClient({
					apiKey: env.TRADEPORT_API_KEY,
					apiUser: env.TRADEPORT_USER,
				})

				// Build the bid transaction
				const transaction = await tradingClient.placeNftBids({
					nfts: [
						{
							id: nftId,
							bidAmountInMist: bidAmountMist,
						},
					],
					walletAddress,
				})

				// Serialize transaction for frontend signing
				const txBytes = await transaction.build({ client: undefined as any })
				const txBase64 = Buffer.from(txBytes).toString('base64')

				return jsonResponse({
					success: true,
					transaction: txBase64,
					message: 'Transaction built successfully. Sign with your wallet to complete.',
				})
			} catch (error) {
				console.error('Failed to build bid transaction:', error)
				const message = error instanceof Error ? error.message : 'Failed to build transaction'
				return errorResponse(message, 'BID_ERROR', 500)
			}
		}

		return errorResponse('Unknown endpoint', 'NOT_FOUND', 404)
	} catch (error) {
		console.error('Tradeport API error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return errorResponse(message, 'TRADEPORT_ERROR', 500)
	}
}
