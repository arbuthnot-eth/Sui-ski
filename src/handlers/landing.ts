import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient } from '@mysten/suins'
import { Hono } from 'hono'
import type { Env } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { getDeepBookSuiPools, getNSSuiPrice, getUSDCSuiPrice } from '../utils/ns-price'
import { generateLogoSvg, getDefaultOgImageUrl } from '../utils/og-image'
import { calculateRegistrationPrice, formatPricingResponse, getBasePricing } from '../utils/pricing'
import { jsonResponse } from '../utils/response'
import { getDefaultRpcUrl } from '../utils/rpc'
import { renderSocialMeta } from '../utils/social'
import { getGatewayStatus } from '../utils/status'
import { generateWalletSessionJs } from '../utils/wallet-session-js'

export interface LandingPageOptions {
	canonicalUrl?: string
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

const SUINS_REG_TYPE_BY_NETWORK: Record<string, string> = {
	mainnet:
		'0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration',
	testnet:
		'0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93::suins_registration::SuinsRegistration',
}

const MIN_AUCTION_PRICE_MIST = 1_000_000_000n
const MIN_AUCTION_DURATION_MS = 3_600_000n
const MAX_AUCTION_DURATION_MS = 30n * 86_400_000n

apiRoutes.post('/auction/list', async (c) => {
	const env = c.get('env')

	if (!env.DECAY_AUCTION_PACKAGE_ID) {
		return jsonResponse({ error: 'Decay auction not configured' }, 400)
	}

	try {
		const body = await c.req.json<{
			nftId: string
			startPriceMist: string
			durationMs: string
			senderAddress: string
		}>()

		if (!body.nftId || !body.startPriceMist || !body.durationMs || !body.senderAddress) {
			return jsonResponse(
				{ error: 'Missing required fields: nftId, startPriceMist, durationMs, senderAddress' },
				400,
			)
		}

		const startPriceMist = BigInt(body.startPriceMist)
		const durationMs = BigInt(body.durationMs)

		if (startPriceMist < MIN_AUCTION_PRICE_MIST) {
			return jsonResponse({ error: 'Start price must be at least 1 SUI' }, 400)
		}

		if (durationMs < MIN_AUCTION_DURATION_MS || durationMs > MAX_AUCTION_DURATION_MS) {
			return jsonResponse({ error: 'Duration must be between 1 hour and 30 days' }, 400)
		}

		const suinsRegType =
			SUINS_REG_TYPE_BY_NETWORK[env.SUI_NETWORK] || SUINS_REG_TYPE_BY_NETWORK.mainnet

		const tx = new Transaction()
		tx.setSender(body.senderAddress)
		tx.setGasBudget(50_000_000)

		tx.moveCall({
			target: `${env.DECAY_AUCTION_PACKAGE_ID}::auction::create_and_share`,
			typeArguments: [suinsRegType],
			arguments: [
				tx.object(body.nftId),
				tx.pure.u64(startPriceMist),
				tx.pure.u64(durationMs),
				tx.object('0x6'),
			],
		})

		const txBytes = await tx.toJSON()
		return jsonResponse({ txBytes })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build auction transaction'
		console.error('Auction list tx error:', error)
		return jsonResponse({ error: message }, 500)
	}
})

const AUCTION_LISTING_TTL = 30 * 86400

apiRoutes.post('/auction/register', async (c) => {
	const env = c.get('env')

	if (!env.DECAY_AUCTION_PACKAGE_ID) {
		return jsonResponse({ error: 'Decay auction not configured' }, 400)
	}

	try {
		const body = await c.req.json<{ nftId: string; listingId: string }>()

		if (!body.nftId || !body.listingId) {
			return jsonResponse({ error: 'Missing required fields: nftId, listingId' }, 400)
		}

		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		const obj = await client.getObject({ id: body.listingId, options: { showType: true } })
		if (!obj.data) {
			return jsonResponse({ error: 'Listing object not found on-chain' }, 404)
		}

		const objType = obj.data.type || ''
		if (!objType.includes('DecayListing')) {
			return jsonResponse({ error: 'Object is not a DecayListing' }, 400)
		}

		const key = cacheKey('auction-listing', body.nftId)
		await env.CACHE.put(key, JSON.stringify({ listingId: body.listingId }), {
			expirationTtl: AUCTION_LISTING_TTL,
		})

		return jsonResponse({ ok: true })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to register auction listing'
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.get('/auction/status/:nftId', async (c) => {
	const env = c.get('env')
	const nftId = c.req.param('nftId')

	if (!nftId) return jsonResponse({ error: 'NFT ID required' }, 400)

	try {
		const key = cacheKey('auction-listing', nftId)
		const cached = (await env.CACHE.get(key, 'json')) as { listingId: string } | null
		if (!cached) {
			return jsonResponse({ active: false })
		}

		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		const obj = await client.getObject({
			id: cached.listingId,
			options: { showContent: true },
		})

		if (!obj.data || obj.data.content?.dataType !== 'moveObject') {
			await env.CACHE.delete(key)
			return jsonResponse({ active: false })
		}

		const fields = (obj.data.content as { dataType: 'moveObject'; fields: Record<string, unknown> })
			.fields
		return jsonResponse({
			active: true,
			listingId: cached.listingId,
			seller: fields.seller as string,
			startPriceMist: String(fields.start_price),
			startTimeMs: String(fields.start_time_ms),
			endTimeMs: String(fields.end_time_ms),
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch auction status'
		return jsonResponse({ error: message, active: false }, 500)
	}
})

apiRoutes.post('/auction/buy', async (c) => {
	const env = c.get('env')

	if (!env.DECAY_AUCTION_PACKAGE_ID) {
		return jsonResponse({ error: 'Decay auction not configured' }, 400)
	}

	try {
		const body = await c.req.json<{ listingId: string; buyerAddress: string }>()

		if (!body.listingId || !body.buyerAddress) {
			return jsonResponse({ error: 'Missing required fields: listingId, buyerAddress' }, 400)
		}

		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		const obj = await client.getObject({
			id: body.listingId,
			options: { showContent: true },
		})

		if (!obj.data || obj.data.content?.dataType !== 'moveObject') {
			return jsonResponse({ error: 'Listing not found or already completed' }, 404)
		}

		const fields = (obj.data.content as { dataType: 'moveObject'; fields: Record<string, unknown> })
			.fields
		const startPrice = BigInt(String(fields.start_price))
		const startTimeMs = BigInt(String(fields.start_time_ms))
		const endTimeMs = BigInt(String(fields.end_time_ms))
		const now = BigInt(Date.now())

		if (now >= endTimeMs) {
			return jsonResponse({ error: 'Auction has ended' }, 400)
		}

		const elapsed = now - startTimeMs
		const duration = endTimeMs - startTimeMs
		const remaining = duration - elapsed
		let currentPrice: bigint
		if (remaining <= 0n) {
			currentPrice = 0n
		} else {
			const fraction = (remaining * 1_000_000_000n) / duration
			let pow8 = fraction
			for (let i = 0; i < 7; i++) {
				pow8 = (pow8 * fraction) / 1_000_000_000n
			}
			currentPrice = (startPrice * pow8) / 1_000_000_000n
		}

		const priceWithBuffer = currentPrice + currentPrice / 50n

		const suinsRegType =
			SUINS_REG_TYPE_BY_NETWORK[env.SUI_NETWORK] || SUINS_REG_TYPE_BY_NETWORK.mainnet

		const tx = new Transaction()
		tx.setSender(body.buyerAddress)
		tx.setGasBudget(50_000_000)

		const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceWithBuffer)])

		tx.moveCall({
			target: `${env.DECAY_AUCTION_PACKAGE_ID}::auction::buy`,
			typeArguments: [suinsRegType],
			arguments: [tx.object(body.listingId), paymentCoin, tx.object('0x6')],
		})

		const txBytes = await tx.toJSON()
		return jsonResponse({
			txBytes,
			currentPriceMist: String(currentPrice),
			paidMist: String(priceWithBuffer),
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build buy transaction'
		console.error('Auction buy tx error:', error)
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.get('/sui-price', async (c) => {
	try {
		const env = c.get('env')
		const usdcPrice = await getUSDCSuiPrice(env)
		return jsonResponse({ price: usdcPrice.usdcPerSui, source: usdcPrice.source })
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
	const tokenId = c.req.query('tokenId') || undefined
	return handleMarketplaceData(name, c.get('env'), tokenId)
})

apiRoutes.post('/marketplace/accept-bid', async (c) => {
	try {
		const body = await c.req.json()
		const { bidId, sellerAddress } = body as { bidId?: string; sellerAddress?: string }
		if (!bidId || !sellerAddress || !sellerAddress.startsWith('0x')) {
			return jsonResponse({ error: 'Valid bidId and sellerAddress are required' }, 400)
		}
		return handleAcceptBidTransaction(bidId, sellerAddress, c.get('env'))
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid request body'
		return jsonResponse({ error: message }, 400)
	}
})

apiRoutes.post('/marketplace/activity', async (c) => {
	try {
		const body = await c.req.json()
		const { nftId, tokenId } = body as { nftId?: string; tokenId?: string }
		if (tokenId) {
			return handleNftActivityByTokenId(tokenId, c.get('env'))
		}
		if (nftId) {
			return handleNftActivity(nftId, c.get('env'))
		}
		return jsonResponse({ error: 'nftId or tokenId parameter required' }, 400)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid request body'
		return jsonResponse({ error: message }, 400)
	}
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

apiRoutes.get('/featured-names', async (c) => {
	return handleFeaturedNames(c.get('env'))
})

apiRoutes.get('/owned-names', async (c) => {
	const address = c.req.query('address')
	if (!address || !address.startsWith('0x')) {
		return jsonResponse({ error: 'Valid Sui address required (address query param)' }, 400)
	}
	return handleOwnedNames(address, c.get('env'))
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
		const cached = await getCached<LinkedNamesCache>(key)
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

		if (allNames.length > 0) {
			await setCache(key, result, LINKED_NAMES_CACHE_TTL)
		}

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

async function handleOwnedNames(address: string, env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		const namesResponse = await handleNamesByAddress(address, env)
		const namesData = (await namesResponse.json()) as LinkedNamesCache & { error?: string }

		if (namesData.error) {
			return new Response(
				JSON.stringify({ error: namesData.error, address, primaryName: null, names: [] }),
				{
					status: 500,
					headers: corsHeaders,
				},
			)
		}

		const allNames = namesData.names || []
		const primaryEntry = allNames.find((n) => n.isPrimary)
		const primaryName = primaryEntry ? primaryEntry.name.replace(/\.sui$/, '') : null

		const MARKETPLACE_BATCH = 5
		const enrichedNames: Array<
			NameInfo & { listings: MarketplaceListing[]; bids: MarketplaceBid[] }
		> = []

		for (let i = 0; i < allNames.length; i += MARKETPLACE_BATCH) {
			const batch = allNames.slice(i, i + MARKETPLACE_BATCH)
			const results = await Promise.all(
				batch.map(async (nameInfo) => {
					const cleanName = nameInfo.name.replace(/\.sui$/, '')
					const listings: MarketplaceListing[] = []
					const bids: MarketplaceBid[] = []
					try {
						const mktResponse = await handleMarketplaceData(cleanName, env)
						const mktData = (await mktResponse.json()) as MarketplaceData
						if (mktData.nfts) {
							for (const nft of mktData.nfts) {
								for (const l of nft.listings) listings.push(l)
								for (const b of nft.bids) bids.push(b)
							}
						}
					} catch {
						// Marketplace data is optional
					}
					return { ...nameInfo, listings, bids }
				}),
			)
			for (const r of results) enrichedNames.push(r)
		}

		return new Response(JSON.stringify({ address, primaryName, names: enrichedNames }), {
			status: 200,
			headers: corsHeaders,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch owned names'
		return new Response(JSON.stringify({ error: message, address, primaryName: null, names: [] }), {
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

interface MarketplaceSale {
	price: number
	buyer: string
	seller: string
	blockTime: string
	txHash: string
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
	sales: MarketplaceSale[]
	floor: number | null
	volume: number | null
}

const INDEXER_API_URL = 'https://api.indexer.xyz/graphql'
const INDEXER_API_USER = 'imbibed.solutions'
const SUINS_COLLECTION_ID = '060fe4fb-9a3e-4170-a494-a25e62aba689'
const TRADEPORT_TX_API_URL = 'https://api.indexer.xyz/api/v1/tradeport'

/**
 * Fetch marketplace data (listings, bids) for a SuiNS name.
 * When tokenId is provided, queries by on-chain token_id for reliable results.
 */
async function handleMarketplaceData(name: string, _env: Env, tokenId?: string): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	const normalizedName = name.endsWith('.sui') ? name : `${name}.sui`

	try {
		const nftFilter = tokenId
			? `token_id: {_eq: $tokenId}, collection_id: {_eq: $collectionId}`
			: `name: {_eq: $name}, collection_id: {_eq: $collectionId}`

		const queryVarDecl = tokenId
			? `$tokenId: String!, $collectionId: uuid!`
			: `$name: String!, $collectionId: uuid!`

		const query = `
			query GetNftMarketplace(${queryVarDecl}) {
				sui {
					nfts(where: {${nftFilter}}, limit: 10) {
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
					collections(where: {id: {_eq: $collectionId}}) {
						floor
						volume
					}
				}
			}
		`

		const variables = tokenId
			? { tokenId, collectionId: SUINS_COLLECTION_ID }
			: { name: normalizedName, collectionId: SUINS_COLLECTION_ID }

		const response = await fetch(INDEXER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-user': INDEXER_API_USER,
				'x-api-key': _env.INDEXER_API_KEY || '',
			},
			body: JSON.stringify({ query, variables }),
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
					collections?: Array<{ floor?: number; volume?: number }>
				}
			}
			errors?: Array<{ message: string }>
		}

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'GraphQL error')
		}

		const nfts = result.data?.sui?.nfts || []
		const collection = result.data?.sui?.collections?.[0]

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

		const tradeportItemUrl = (tokenId: string) =>
			`https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=${tokenId}&modalSlug=suins&nav=1`
		if (bestListing && bestListingTokenId) {
			bestListing = {
				...bestListing,
				tokenId: bestListingTokenId,
				tradeportUrl: tradeportItemUrl(bestListingTokenId),
			}
		}
		if (bestBid && bestBidTokenId) {
			bestBid = {
				...bestBid,
				tokenId: bestBidTokenId,
				tradeportUrl: tradeportItemUrl(bestBidTokenId),
			}
		}

		let sales: MarketplaceSale[] = []
		if (marketplaceNfts.length > 0) {
			const tokenIds = marketplaceNfts.map((nft) => nft.tokenId)
			const salesQuery = `
				query GetNftSales($tokenIds: [String!]!, $collectionId: uuid!) {
					sui {
						actions(
							where: {
								type: {_eq: "buy"}
								token_id: {_in: $tokenIds}
								collection_id: {_eq: $collectionId}
							}
							order_by: {block_time: desc}
							limit: 10
						) {
							price
							buyer
							seller
							block_time
							tx_hash
							token_id
						}
					}
				}
			`

			try {
				const salesResponse = await fetch(INDEXER_API_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-user': INDEXER_API_USER,
						'x-api-key': _env.INDEXER_API_KEY || '',
					},
					body: JSON.stringify({
						query: salesQuery,
						variables: { tokenIds, collectionId: SUINS_COLLECTION_ID },
					}),
				})

				if (salesResponse.ok) {
					const salesResult = (await salesResponse.json()) as {
						data?: {
							sui?: {
								actions?: Array<{
									price: number
									buyer: string
									seller: string
									block_time: string
									tx_hash: string
									token_id: string
								}>
							}
						}
					}

					const actions = salesResult.data?.sui?.actions || []
					sales = actions.map((action) => ({
						price: action.price,
						buyer: action.buyer,
						seller: action.seller,
						blockTime: action.block_time,
						txHash: action.tx_hash,
						tokenId: action.token_id,
						tradeportUrl: tradeportItemUrl(action.token_id),
					}))
				}
			} catch {
				// If sales fetch fails, continue without sales data
			}
		}

		const data: MarketplaceData = {
			name: normalizedName,
			nfts: marketplaceNfts,
			bestListing,
			bestBid,
			sales,
			floor: collection?.floor ?? null,
			volume: collection?.volume ?? null,
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
				degraded: true,
				name: normalizedName,
				nfts: [],
				bestListing: null,
				bestBid: null,
				sales: [],
				floor: null,
				volume: null,
			}),
			{
				status: 200,
				headers: corsHeaders,
			},
		)
	}
}

interface NftActivityAction {
	id: string
	type: string
	price: number
	priceCoin: string
	sender: string
	receiver: string
	txId: string
	blockTime: string
	marketName: string
	boughtOnTradeport: boolean
	liquidBridgeId: string | null
	nonce: string | null
	listingNonce: string | null
}

async function handleNftActivity(nftId: string, _env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		const query = `
			query fetchNftActivity($nftId: uuid!, $offset: Int, $limit: Int!) {
				sui {
					actions(
						where: {nft_id: {_eq: $nftId}}
						order_by: [{block_time: desc}, {tx_index: desc}]
						offset: $offset
						limit: $limit
					) {
						id
						type
						price
						price_coin
						sender
						receiver
						tx_id
						block_time
						market_name
						bought_on_tradeport
						liquid_bridge_id
						nonce
						listing_nonce
					}
				}
			}
		`

		const response = await fetch(INDEXER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-user': INDEXER_API_USER,
				'x-api-key': _env.INDEXER_API_KEY || '',
			},
			body: JSON.stringify({
				query,
				variables: {
					nftId,
					offset: 0,
					limit: 20,
				},
			}),
		})

		if (!response.ok) {
			throw new Error(`Indexer API error: ${response.status}`)
		}

		const result = (await response.json()) as {
			data?: {
				sui?: {
					actions?: Array<{
						id: string
						type: string
						price: number
						price_coin: string
						sender: string
						receiver: string
						tx_id: string
						block_time: string
						market_name: string
						bought_on_tradeport: boolean
						liquid_bridge_id: string | null
						nonce: string | null
						listing_nonce: string | null
					}>
				}
			}
			errors?: Array<{ message: string }>
		}

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'GraphQL error')
		}

		const actions = result.data?.sui?.actions || []
		const formattedActions: NftActivityAction[] = actions.map((action) => ({
			id: action.id,
			type: action.type,
			price: action.price,
			priceCoin: action.price_coin,
			sender: action.sender,
			receiver: action.receiver,
			txId: action.tx_id,
			blockTime: action.block_time,
			marketName: action.market_name,
			boughtOnTradeport: action.bought_on_tradeport,
			liquidBridgeId: action.liquid_bridge_id,
			nonce: action.nonce,
			listingNonce: action.listing_nonce,
		}))

		return new Response(JSON.stringify({ actions: formattedActions }), {
			status: 200,
			headers: corsHeaders,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch NFT activity'
		return new Response(
			JSON.stringify({
				error: message,
				actions: [],
			}),
			{
				status: 200,
				headers: corsHeaders,
			},
		)
	}
}

async function handleNftActivityByTokenId(tokenId: string, _env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		const query = `
			query fetchNftTransactionHistory(
				$collectionId: uuid!
				$tokenId: String!
				$offset: Int
				$limit: Int!
			) {
				sui {
					actions(
						where: {
							collection_id: { _eq: $collectionId }
							nft: { token_id: { _eq: $tokenId } }
						}
						order_by: [{ block_time: desc }, { tx_index: desc }]
						offset: $offset
						limit: $limit
					) {
						id
						type
						price
						price_coin
						sender
						receiver
						tx_id
						block_time
						market_name
						bought_on_tradeport
						liquid_bridge_id
						nonce
						listing_nonce
					}
				}
			}
		`

		const response = await fetch(INDEXER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-user': INDEXER_API_USER,
				'x-api-key': _env.INDEXER_API_KEY || '',
			},
			body: JSON.stringify({
				query,
				variables: {
					collectionId: SUINS_COLLECTION_ID,
					tokenId,
					offset: 0,
					limit: 20,
				},
			}),
		})

		if (!response.ok) {
			throw new Error(`Indexer API error: ${response.status}`)
		}

		const result = (await response.json()) as {
			data?: {
				sui?: {
					actions?: Array<{
						id: string
						type: string
						price: number
						price_coin: string
						sender: string
						receiver: string
						tx_id: string
						block_time: string
						market_name: string
						bought_on_tradeport: boolean
						liquid_bridge_id: string | null
						nonce: string | null
						listing_nonce: string | null
					}>
				}
			}
			errors?: Array<{ message: string }>
		}

		if (result.errors) {
			throw new Error(result.errors[0]?.message || 'GraphQL error')
		}

		const actions = result.data?.sui?.actions || []
		const formattedActions: NftActivityAction[] = actions.map((action) => ({
			id: action.id,
			type: action.type,
			price: action.price,
			priceCoin: action.price_coin,
			sender: action.sender,
			receiver: action.receiver,
			txId: action.tx_id,
			blockTime: action.block_time,
			marketName: action.market_name,
			boughtOnTradeport: action.bought_on_tradeport,
			liquidBridgeId: action.liquid_bridge_id,
			nonce: action.nonce,
			listingNonce: action.listing_nonce,
		}))

		return new Response(JSON.stringify({ actions: formattedActions }), {
			status: 200,
			headers: corsHeaders,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch NFT activity'
		return new Response(
			JSON.stringify({
				error: message,
				actions: [],
			}),
			{
				status: 200,
				headers: corsHeaders,
			},
		)
	}
}

async function sha256Hex(input: string): Promise<string> {
	const bytes = new TextEncoder().encode(input)
	const digest = await crypto.subtle.digest('SHA-256', bytes)
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
	const keyData = new TextEncoder().encode(secret)
	const key = await crypto.subtle.importKey(
		'raw',
		keyData,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	)
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

async function handleAcceptBidTransaction(
	bidId: string,
	sellerAddress: string,
	env: Env,
): Promise<Response> {
	const apiUser = env.TRADEPORT_USER || ''
	const apiKey = env.TRADEPORT_API_KEY || ''
	if (!apiUser || !apiKey) {
		return jsonResponse({ error: 'Tradeport credentials are not configured' }, 500)
	}

	try {
		const path = '/transactions/accept_nft_bid_v2'
		const body = JSON.stringify({
			bid_id: bidId,
			seller: sellerAddress,
		})
		const requestDate = new Date().toISOString()
		const bodyHash = await sha256Hex(body)
		const signatureInput = `POST|${path}|${requestDate}|${bodyHash}`
		const signature = await hmacSha256Hex(apiKey, signatureInput)

		const res = await fetch(`${TRADEPORT_TX_API_URL}${path}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-user': apiUser,
				'x-api-date': requestDate,
				'x-api-signature': signature,
			},
			body,
		})

		const payload = (await res.json().catch(() => ({}))) as {
			transaction?: unknown
			txBytes?: unknown
			tx_bytes?: unknown
			serializedTransaction?: unknown
			serialized_transaction?: unknown
			error?: string
			message?: string
		}

		if (!res.ok) {
			const message = payload?.message || payload?.error || `Tradeport API error (${res.status})`
			return jsonResponse({ error: message }, 502)
		}

		const transactionPayload =
			payload?.transaction ??
			payload?.txBytes ??
			payload?.tx_bytes ??
			payload?.serializedTransaction ??
			payload?.serialized_transaction ??
			null

		if (!transactionPayload) {
			return jsonResponse({ error: 'Tradeport did not return a transaction payload' }, 502)
		}

		return jsonResponse({ transaction: transactionPayload })
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Failed to prepare bid acceptance transaction'
		return jsonResponse({ error: message }, 500)
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

const BRAVE_SUGGEST_URL = 'https://api.search.brave.com/res/v1/suggest/search'
const BRAVE_WEB_URL = 'https://api.search.brave.com/res/v1/web/search'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const SUGGESTION_MODEL = 'google/gemini-2.0-flash-001'
const SUGGESTION_CACHE_TTL_MS = 3600000
const MAX_SUGGESTION_CACHE_SIZE = 200
const MAX_SUGGESTIONS = 10

const suggestionMemCache = new Map<string, { data: string[]; exp: number }>()

async function fetchBraveContext(query: string, apiKey: string): Promise<string[]> {
	const context: string[] = []
	try {
		const [suggestRes, webRes] = await Promise.all([
			fetch(`${BRAVE_SUGGEST_URL}?q=${encodeURIComponent(query)}&count=8`, {
				headers: {
					Accept: 'application/json',
					'Accept-Encoding': 'gzip',
					'X-Subscription-Token': apiKey,
				},
			}).catch(() => null),
			fetch(`${BRAVE_WEB_URL}?q=${encodeURIComponent(query)}&count=5&text_decorations=false`, {
				headers: {
					Accept: 'application/json',
					'Accept-Encoding': 'gzip',
					'X-Subscription-Token': apiKey,
				},
			}).catch(() => null),
		])

		if (suggestRes?.ok) {
			const data = (await suggestRes.json()) as { results?: Array<{ query?: string }> }
			if (data.results) {
				for (const r of data.results) {
					if (r.query) context.push(r.query)
				}
			}
		}

		if (webRes?.ok) {
			const data = (await webRes.json()) as {
				web?: { results?: Array<{ title?: string; description?: string }> }
			}
			if (data.web?.results) {
				for (const r of data.web.results) {
					if (r.title) context.push(r.title)
					if (r.description) context.push(r.description)
				}
			}
		}
	} catch (e) {
		console.error('Brave Search API error:', e)
	}
	return context
}

async function fetchAISuggestions(
	query: string,
	braveContext: string[],
	apiKey: string,
): Promise<string[]> {
	const contextBlock =
		braveContext.length > 0
			? `\nWeb context for "${query}":\n${braveContext.slice(0, 10).join('\n')}`
			: ''

	const res = await fetch(OPENROUTER_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		body: JSON.stringify({
			model: SUGGESTION_MODEL,
			max_tokens: 150,
			temperature: 0.8,
			messages: [
				{
					role: 'user',
					content: `You are a domain name suggestion engine for .sui blockchain names. A user searched: "${query}"
${contextBlock}

Suggest ${MAX_SUGGESTIONS - 1} single-word .sui domain names this person would want to own. Think about:
- Synonyms and closely related concepts
- Industry/niche terms someone interested in "${query}" identifies with
- Short, brandable, memorable words
- Words that signal identity, status, or expertise in this area

Rules: each suggestion must be ONE word, 3-15 lowercase letters only (a-z), no numbers/hyphens. Return ONLY a JSON array of strings, nothing else.`,
				},
			],
		}),
	})

	if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`)

	const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
	const content = data.choices?.[0]?.message?.content?.trim() || '[]'
	const jsonMatch = content.match(/\[[\s\S]*\]/)
	if (!jsonMatch) return []

	const parsed = JSON.parse(jsonMatch[0]) as unknown[]
	const valid: string[] = []
	for (const item of parsed) {
		if (typeof item !== 'string') continue
		const cleaned = item.toLowerCase().trim()
		if (cleaned.length >= 3 && cleaned.length <= 15 && /^[a-z]+$/.test(cleaned)) {
			valid.push(cleaned)
		}
	}
	return valid
}

async function handleNameSuggestions(query: string, env: Env): Promise<Response> {
	const key = query.toLowerCase()
	const cached = suggestionMemCache.get(key)
	if (cached && cached.exp > Date.now()) {
		return jsonResponse({ query, suggestions: cached.data })
	}

	const suggestions: string[] = [query]
	const seen = new Set<string>([key])

	const braveKey = env.BRAVE_SEARCH_API_KEY
	const aiKey = env.OPENROUTER_API_KEY

	if (aiKey) {
		try {
			const braveContext = braveKey ? await fetchBraveContext(query, braveKey) : []
			const aiNames = await fetchAISuggestions(query, braveContext, aiKey)
			for (const name of aiNames) {
				if (!seen.has(name) && suggestions.length < MAX_SUGGESTIONS) {
					seen.add(name)
					suggestions.push(name)
				}
			}
		} catch (e) {
			console.error('AI suggestion error:', e)
		}
	} else if (braveKey) {
		const braveContext = await fetchBraveContext(query, braveKey)
		for (const phrase of braveContext) {
			const words = phrase
				.toLowerCase()
				.replace(/[^a-z\s]/g, ' ')
				.split(/\s+/)
			for (const w of words) {
				if (
					w.length >= 3 &&
					w.length <= 15 &&
					/^[a-z]+$/.test(w) &&
					!seen.has(w) &&
					suggestions.length < MAX_SUGGESTIONS
				) {
					seen.add(w)
					suggestions.push(w)
				}
			}
		}
	}

	if (suggestionMemCache.size > MAX_SUGGESTION_CACHE_SIZE) {
		const first = suggestionMemCache.keys().next().value
		if (first) suggestionMemCache.delete(first)
	}
	suggestionMemCache.set(key, { data: suggestions, exp: Date.now() + SUGGESTION_CACHE_TTL_MS })
	return jsonResponse({ query, suggestions })
}

interface FeaturedName {
	name: string
	marketSui: number
	registrySui: number
	premiumX: number
	source: 'listing' | 'offer'
}

const FEATURED_NAME_CANDIDATES = [
	'agents',
	'agent',
	'ai',
	'alpha',
	'vault',
	'pro',
	'x',
	'trade',
	'money',
	'fund',
	'builder',
	'wallet',
	'domain',
	'index',
	'defi',
	'yield',
	'stable',
	'protocol',
	'scout',
	'prime',
	'oracle',
]
const FEATURED_NAMES_TTL_MS = 5 * 60 * 1000
let featuredNamesCache: { data: FeaturedName[]; exp: number } | null = null

async function handleFeaturedNames(env: Env): Promise<Response> {
	if (featuredNamesCache && featuredNamesCache.exp > Date.now()) {
		return jsonResponse({ names: featuredNamesCache.data, cached: true })
	}

	const checks = await Promise.all(
		FEATURED_NAME_CANDIDATES.map(async (name) => {
			try {
				const [marketRes, pricing] = await Promise.all([
					handleMarketplaceData(name, env),
					calculateRegistrationPrice({ domain: name, years: 1, env }),
				])
				const marketData = (await marketRes.json()) as MarketplaceData & { error?: string }
				if (marketData.error) return null

				const bestListingMist = marketData.bestListing?.price || 0
				const bestBidMist = marketData.bestBid?.price || 0
				const marketMist = Math.max(bestListingMist, bestBidMist)
				if (!marketMist || marketMist <= 0) return null

				const registrySui = Number(pricing.discountedSuiMist) / 1e9
				if (!Number.isFinite(registrySui) || registrySui <= 0) return null

				const marketSui = marketMist / 1e9
				const premiumX = marketSui / registrySui

				// Only keep names meaningfully above registry cost.
				if (!Number.isFinite(premiumX) || premiumX < 1.2) return null

				return {
					name,
					marketSui,
					registrySui,
					premiumX,
					source: bestListingMist >= bestBidMist ? 'listing' : 'offer',
				} satisfies FeaturedName
			} catch {
				return null
			}
		}),
	)

	const ranked = checks
		.filter((item): item is FeaturedName => !!item)
		.sort((a, b) => {
			if (b.premiumX !== a.premiumX) return b.premiumX - a.premiumX
			return b.marketSui - a.marketSui
		})
		.slice(0, 10)

	const pinnedAgents = ranked.find((item) => item.name === 'agents') || {
		name: 'agents',
		marketSui: 0,
		registrySui: 0,
		premiumX: 9999,
		source: 'offer' as const,
	}

	const featuredPinned = [pinnedAgents, ...ranked.filter((item) => item.name !== 'agents')].slice(
		0,
		10,
	)

	featuredNamesCache = { data: featuredPinned, exp: Date.now() + FEATURED_NAMES_TTL_MS }
	return jsonResponse({ names: featuredPinned, cached: false })
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
		cardType: 'summary_large_image',
	})
	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
		<title>sui.ski - SuiNS Gateway</title>
		<link rel="icon" type="image/svg+xml" href="/favicon.svg">
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
			background: #000;
			color: #e4e4e7;
		}
		/* Profile-matched blue scrollbar theme */
		* {
			scrollbar-width: thin;
			scrollbar-color: #60a5fa #000;
		}
		*::-webkit-scrollbar {
			width: 6px;
			height: 6px;
		}
		*::-webkit-scrollbar-track {
			background: #000;
		}
		*::-webkit-scrollbar-thumb {
			background: linear-gradient(180deg, #60a5fa, #93c5fd);
			border-radius: 3px;
		}
		*::-webkit-scrollbar-thumb:hover {
			background: linear-gradient(180deg, #7ab8ff, #a6d2ff);
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
			max-height: 260px;
			overflow: hidden;
			transition: max-height 0.22s ease, padding 0.2s ease, opacity 0.18s ease, transform 0.18s ease;
		}
		body.search-focused .header {
			max-height: 0;
			padding-top: 0;
			padding-bottom: 0;
			opacity: 0;
			transform: translateY(-10px);
			pointer-events: none;
		}
		.search-backdrop-logo {
			position: fixed;
			inset: 0;
			z-index: 20;
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0;
			transform: scale(1.04);
			transition: opacity 0.25s ease, transform 0.25s ease;
			pointer-events: none;
		}
		.search-backdrop-lockup {
			display: flex;
			align-items: center;
			gap: clamp(14px, 2.2vw, 26px);
			opacity: 0.3;
			transform: translateY(-2vh);
		}
		.search-backdrop-lockup svg {
			width: min(20vw, 220px);
			height: auto;
			filter: drop-shadow(0 0 28px rgba(96, 165, 250, 0.32));
			flex-shrink: 0;
		}
		.search-backdrop-lockup-text {
			font-size: clamp(3rem, 11vw, 9rem);
			font-weight: 800;
			letter-spacing: 0.02em;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		body.search-focused .search-backdrop-logo {
			opacity: 1;
			transform: scale(1);
		}

		.logo {
			font-size: 3rem;
			font-weight: 800;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12px;
		}
		.logo svg {
			-webkit-text-fill-color: initial;
			flex-shrink: 0;
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
			display: flex;
			flex-direction: column;
		}
		.dropdown {
			position: static;
			background: rgba(15, 15, 20, 0.98);
			border: 2px solid rgba(96, 165, 250, 0.3);
			border-top: 1px solid rgba(255,255,255,0.06);
			border-radius: 0 0 20px 20px;
			overflow-y: visible;
			overflow-x: hidden;
			max-height: none;
			display: none;
			z-index: 100;
			backdrop-filter: blur(12px);
		}
		.dropdown::-webkit-scrollbar { width: 6px; }
		.dropdown::-webkit-scrollbar-track { background: transparent; }
		.dropdown::-webkit-scrollbar-thumb {
			background: linear-gradient(180deg, #60a5fa, #93c5fd);
			border-radius: 3px;
		}
		.dropdown.visible { display: block; }
			.dropdown-header {
				display: grid;
				grid-template-columns: 1fr 1fr 0.9fr 0.9fr;
				padding: 8px 16px;
				border-bottom: 1px solid rgba(255,255,255,0.08);
				font-size: 0.7rem;
				font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: #52525b;
			}
			.dropdown-header span:nth-child(2) { text-align: center; }
			.dropdown-header span:nth-child(3) { text-align: right; }
			.dropdown-header span:nth-child(4) { text-align: right; }
			.dropdown-item {
				display: grid;
				grid-template-columns: 1fr 1fr 0.9fr 0.9fr;
				align-items: center;
				padding: 10px 16px;
				border-bottom: 1px solid rgba(255,255,255,0.04);
				transition: background 0.15s;
			cursor: pointer;
		}
		.dropdown-item:last-child { border-bottom: none; }
		.dropdown-item:hover { background: rgba(96, 165, 250, 0.08); }
		.dropdown-item .col-name {
			display: flex;
			align-items: flex-start;
			gap: 8px;
			font-size: 0.9rem;
			color: #e4e4e7;
			min-width: 0;
		}
		.dropdown-item .col-name .dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			flex-shrink: 0;
		}
		.dropdown-item .col-name .dot.available { background: #4ade80; box-shadow: 0 0 6px rgba(74, 222, 128, 0.5); }
		.dropdown-item .col-name .dot.taken { background: #f87171; box-shadow: 0 0 6px rgba(248, 113, 113, 0.4); }
		.dropdown-item .col-name .dot.listed { background: #3b82f6; box-shadow: 0 0 6px rgba(59, 130, 246, 0.4); }
		.dropdown-item .col-name .dot.checking { background: #71717a; animation: pulse 1s infinite; }
		@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
		.dropdown-item .col-name .name-meta {
			display: flex;
			flex-direction: column;
			min-width: 0;
		}
		.dropdown-item .col-name .label {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.dropdown-item .col-name .suffix { color: #52525b; }
		.dropdown-item .col-name .name-expiry {
			font-size: 0.65rem;
			line-height: 1.15;
			margin-top: 2px;
			color: #71717a;
		}
		.dropdown-item .col-name .name-expiry.expiry-red { color: #f87171; font-weight: 600; }
		.dropdown-item .col-name .name-expiry.expiry-orange { color: #fb923c; }
		.dropdown-item .col-name .name-expiry.expiry-yellow { color: #facc15; }
		.dropdown-item .col-name .name-expiry.expiry-blue { color: #60a5fa; }
		.dropdown-item .col-price {
			text-align: center;
			font-size: 0.8rem;
			color: #71717a;
			font-family: 'SF Mono', 'Fira Code', monospace;
			line-height: 1.2;
		}
			.dropdown-item .col-price .original {
				text-decoration: line-through;
				color: #52525b;
				font-size: 0.65rem;
				display: block;
			}
			.dropdown-item .col-price .discounted { color: #4ade80; font-weight: 600; display: block; }
			.dropdown-item .col-price .listing-price { color: #3b82f6; font-weight: 600; display: block; }
			.dropdown-item .col-price .offer-price { color: #f59e0b; font-size: 0.65rem; display: block; }
			.dropdown-item .col-status {
				display: flex;
				align-items: center;
				justify-content: flex-end;
				gap: 8px;
			}
			.dropdown-item .col-owner {
				text-align: right;
				font-size: 0.72rem;
				color: #a1a1aa;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.dropdown-item .col-owner.loading {
				color: #71717a;
			}
			.dropdown-item .col-owner a {
				color: #60a5fa;
				text-decoration: none;
				transition: color 0.15s;
			}
			.dropdown-item .col-owner a:hover {
				color: #93bbfd;
				text-decoration: underline;
			}
			.dropdown-item .status-text {
				font-size: 0.75rem;
				color: #71717a;
			}
		.dropdown-item .status-text.available { color: #4ade80; font-weight: 500; }
		.dropdown-item .status-text.taken { color: #a1a1aa; }
		.dropdown-item .status-text.listed { color: #3b82f6; font-weight: 500; }
		.dropdown-item .status-text.expiry-red { color: #f87171; font-weight: 500; }
		.dropdown-item .status-text.expiry-orange { color: #fb923c; }
		.dropdown-item .status-text.expiry-yellow { color: #facc15; }
		.dropdown-item .status-text.expiry-blue { color: #60a5fa; }
		.dropdown-item .action-btn {
			padding: 4px 12px;
			border: none;
			border-radius: 6px;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s;
			white-space: nowrap;
			text-decoration: none;
			text-align: center;
			flex-shrink: 0;
		}
		.dropdown-item .action-btn.register {
			background: linear-gradient(135deg, #4ade80, #22c55e);
			color: #020204;
		}
		.dropdown-item .action-btn.register:hover { background: linear-gradient(135deg, #22c55e, #16a34a); }
		.dropdown-item .action-btn.buy {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: #fff;
			display: inline-block;
		}
		.dropdown-item .action-btn.buy:hover { background: linear-gradient(135deg, #2563eb, #7c3aed); }
		.dropdown-item .action-btn.offer {
			background: linear-gradient(135deg, #f59e0b, #d97706);
			color: #020204;
		}
		.dropdown-item .action-btn.offer:hover { background: linear-gradient(135deg, #d97706, #b45309); }
		.dropdown-item .action-btn.offer:disabled { opacity: 0.5; cursor: not-allowed; }
		.offer-input-wrap {
			display: flex;
			align-items: center;
			gap: 2px;
		}
		.offer-currency {
			color: #52525b;
			font-size: 0.75rem;
			font-family: 'SF Mono', 'Fira Code', monospace;
		}
		.offer-amount {
			width: 52px;
			padding: 2px 4px;
			border: 1px solid rgba(245, 158, 11, 0.4);
			border-radius: 4px;
			background: rgba(245, 158, 11, 0.08);
			color: #f59e0b;
			font-size: 0.75rem;
			font-family: 'SF Mono', 'Fira Code', monospace;
			text-align: right;
			outline: none;
			-moz-appearance: textfield;
		}
		.offer-amount::-webkit-inner-spin-button,
		.offer-amount::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
		.offer-amount:focus { border-color: #f59e0b; box-shadow: 0 0 4px rgba(245, 158, 11, 0.3); }
		.offer-amount::placeholder { color: #71717a; font-size: 0.65rem; }
		.offer-status { font-size: 0.65rem; line-height: 1.2; white-space: nowrap; }
		.offer-status.success { color: #4ade80; }
		.offer-status.error { color: #f87171; }
		.offer-status.info { color: #60a5fa; }
		.dropdown-loading {
			padding: 16px;
			text-align: center;
			color: #71717a;
			font-size: 0.9rem;
		}
			@media (max-width: 400px) {
				.dropdown-item { grid-template-columns: 1.2fr 1fr 0.8fr 0.8fr; padding: 8px 12px; }
				.dropdown-header { grid-template-columns: 1.2fr 1fr 0.8fr 0.8fr; padding: 6px 12px; }
				.dropdown-item .col-name { font-size: 0.8rem; }
				.dropdown-item .col-price { font-size: 0.7rem; }
				.dropdown-item .col-owner { font-size: 0.65rem; }
				.offer-amount { width: 44px; }
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

		/* Wallet Widget */
		.wallet-widget {
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 1000;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.wallet-profile-btn {
			width: 36px;
			height: 36px;
			border-radius: 10px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(96, 165, 250, 0.35);
			cursor: pointer;
			transition: all 0.2s ease;
			padding: 0;
		}
		.wallet-profile-btn svg {
			width: 18px;
			height: 18px;
		}
		.wallet-profile-btn:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: rgba(96, 165, 250, 0.55);
			transform: translateY(-1px);
		}
		.wallet-btn {
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

		/* Wallet Menu */
		.wallet-menu {
			display: none;
			position: fixed;
			top: 58px;
			right: 16px;
			z-index: 1001;
			min-width: 200px;
			background: rgba(20, 20, 28, 0.98);
			backdrop-filter: blur(16px);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 14px;
			overflow: hidden;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		}
		.wallet-menu.open { display: block; }
		.wallet-menu-item {
			display: flex;
			align-items: center;
			gap: 10px;
			width: 100%;
			padding: 12px 16px;
			background: none;
			border: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.05);
			color: #e4e4e7;
			font-size: 0.85rem;
			cursor: pointer;
			transition: background 0.15s;
			text-decoration: none;
			text-align: left;
		}
		.wallet-menu-item:last-child { border-bottom: none; }
		.wallet-menu-item:hover { background: rgba(96, 165, 250, 0.1); }
		.wallet-menu-item svg { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.6; }
		.wallet-menu-item.disconnect { color: #f87171; }
		.wallet-menu-item.disconnect:hover { background: rgba(248, 113, 113, 0.1); }
		.wallet-menu-item .copied-flash { color: #4ade80; font-size: 0.75rem; margin-left: auto; }

		@media (max-width: 540px) {
			.wallet-widget { top: 12px; right: 12px; }
			.wallet-menu { top: 48px; right: 12px; min-width: 180px; }
		}

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

			body.search-focused .wallet-menu { display: none !important; }

		@media (max-width: 540px) {
				.header { padding: 40px 16px 16px; }
				.logo { font-size: 2.5rem; }
				.search-container { padding: 10px 12px; }
				.wallet-btn { padding: 8px 12px; font-size: 0.8rem; }
			}
		</style>
</head>
<body>
	<div class="wallet-widget" id="wallet-widget">
		<button class="wallet-profile-btn" id="wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile">
			${generateLogoSvg(18)}
		</button>
		<button class="wallet-btn" id="wallet-btn">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
				<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
			</svg>
			<span id="wallet-btn-text">Connect</span>
		</button>
	</div>

	<div class="wallet-menu" id="wallet-menu"></div>

	<div class="wallet-modal" id="wallet-modal">
		<div class="wallet-modal-content">
			<div class="wallet-modal-header">
				<h3>Connect Wallet</h3>
				<button class="wallet-modal-close" id="wallet-modal-close">&times;</button>
			</div>
			<div class="wallet-list" id="wallet-list"></div>
		</div>
	</div>

	<div class="search-backdrop-logo" aria-hidden="true">
		<div class="search-backdrop-lockup">
			${generateLogoSvg(220)}
			<div class="search-backdrop-lockup-text">sui.ski</div>
		</div>
	</div>

	<div class="header">
		<h1 class="logo">${generateLogoSvg(42)} sui.ski</h1>
		<p class="tagline">SuiNS name gateway</p>
		<div class="discount-badge">powered by DeepBook</div>
	</div>

	<div class="search-container">
		<div class="search-wrapper">
			<form id="search-form" class="search-box" onsubmit="var n=(this.querySelector('#search-input').value||'').trim().toLowerCase().replace(/[^a-z0-9-]/g,'');if(n&&n.length>=3){location.href='https://'+n+'.sui.ski';}return false;">
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
			let getWallets, getJsonRpcFullnodeUrl, SuiJsonRpcClient, SuinsClient, Transaction;
			{
				const SDK_TIMEOUT = 15000;
				const timedImport = (url) => Promise.race([
					import(url),
					new Promise((_, r) => setTimeout(() => r(new Error('Timeout: ' + url)), SDK_TIMEOUT)),
				]);
				const results = await Promise.allSettled([
					timedImport('https://esm.sh/@wallet-standard/app@1.1.0'),
					timedImport('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle'),
					timedImport('https://esm.sh/@mysten/suins@1.0.0?bundle'),
					timedImport('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle'),
				]);
				if (results[0].status === 'fulfilled') ({ getWallets } = results[0].value);
				if (results[1].status === 'fulfilled') ({ getJsonRpcFullnodeUrl, SuiJsonRpcClient } = results[1].value);
				if (results[2].status === 'fulfilled') ({ SuinsClient } = results[2].value);
				if (results[3].status === 'fulfilled') ({ Transaction } = results[3].value);
				const failed = results.filter(r => r.status === 'rejected');
				if (failed.length > 0) console.warn('SDK modules failed:', failed.map(r => r.reason?.message));
			}
			${generateWalletSessionJs()}
			const RPC_URLS = { mainnet: 'https://fullnode.mainnet.sui.io:443', testnet: 'https://fullnode.testnet.sui.io:443', devnet: 'https://fullnode.devnet.sui.io:443' };
			const NETWORK = ${JSON.stringify(options.network || 'mainnet')};
			const RPC_URL = RPC_URLS[NETWORK] || RPC_URLS.mainnet;

			const SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
			const DEEPBOOK_PACKAGE = '0x337f4f4f6567fcd778d5454f27c16c70e2f274cc6377ea6249ddf491482ef497';
			const USDC_TYPE = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
			const DEEP_TYPE = '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP';
			const DEEPBOOK_DEEP_SUI_POOL = '0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22';
		const DEEPBOOK_SUI_USDC_POOL = '0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407';
		const CLOCK_OBJECT = '0x6';
			const TRADEPORT_MULTI_BID_PACKAGE = '0x63ce6caee2ba264e92bca2d160036eb297d99b2d91d4db89d48a9bffca66e55b';
			const TRADEPORT_MULTI_BID_STORE = '0x8aaed7e884343fb8b222c721d02eaac2c6ae2abbb4ddcdf16cb55cf8754ee860';
			const TRADEPORT_MULTI_BID_STORE_VERSION = '572206387';
			const TRADEPORT_BID_FEE_BPS = 300;
			const SUINS_REGISTRATION_TYPE = '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration';

			let connectedWallet = null;
			let connectedAccount = null;
			let connectedAddress = null;
			let cachedSuiPriceUsd = null;
			let suiClient = null;
			let suinsClient = null;

			const walletBtn = document.getElementById('wallet-btn');
			const walletBtnText = document.getElementById('wallet-btn-text');
			const walletProfileBtn = document.getElementById('wallet-profile-btn');
			const walletMenu = document.getElementById('wallet-menu');
			const walletModal = document.getElementById('wallet-modal');
			const walletModalClose = document.getElementById('wallet-modal-close');
			const walletList = document.getElementById('wallet-list');
			let resolvedPrimaryName = null;

			function getWalletProfileHref() {
				if (resolvedPrimaryName) {
					return 'https://' + encodeURIComponent(resolvedPrimaryName) + '.sui.ski';
				}
				return 'https://sui.ski';
			}

			function updateWalletProfileButton() {
				if (!walletProfileBtn) return;
				const href = getWalletProfileHref();
				walletProfileBtn.dataset.href = href;
				walletProfileBtn.title = resolvedPrimaryName
					? 'View my primary profile'
					: 'Go to sui.ski';
			}

			async function initClients() {
				suiClient = new SuiJsonRpcClient({ url: RPC_URL });
				suinsClient = new SuinsClient({ client: suiClient, network: NETWORK });
			}

		async function resolveWalletName(address) {
			if (!address || !suiClient) return;
			try {
				const result = await suiClient.resolveNameServiceNames({ address });
				const name = result?.data?.[0];
				if (name) {
					resolvedPrimaryName = name.replace(/.sui$/i, '');
					if (walletBtnText) {
						walletBtnText.textContent = name;
						walletBtnText.title = address;
					}
					updateWalletProfileButton();
				}
			} catch (e) {
				console.log('Reverse resolution failed:', e.message);
			}
		}

			// Wallet Standard API with fallbacks
		let walletsApi = null;
		try { walletsApi = getWallets(); } catch (e) { console.error('Wallet API init failed:', e); }

		function isSuiCapableWallet(wallet) {
			if (!wallet) return false;
			const features = wallet.features || {};
			const hasSuiChain = Array.isArray(wallet.chains) && wallet.chains.some(c => c.startsWith('sui:'));
			const hasConnect = !!(features['standard:connect'] || wallet.connect);
			const hasSuiTxFeature = !!(
				features['sui:signAndExecuteTransactionBlock'] ||
				features['sui:signAndExecuteTransaction'] ||
				features['sui:signTransaction'] ||
				wallet.signAndExecuteTransactionBlock ||
				wallet.signAndExecuteTransaction ||
				wallet.signTransaction
			);
			return hasSuiChain || (hasConnect && hasSuiTxFeature);
		}

		function getSuiWallets() {
			const wallets = [];
			const seenNames = new Set();

			if (walletsApi) {
				try {
					for (const wallet of walletsApi.get()) {
						if (isSuiCapableWallet(wallet)) {
							wallets.push(wallet);
							seenNames.add(wallet.name);
						}
					}
				} catch (e) {}
			}

			// Fallback: scan registry exposed by some wallet injectors
			const injectedWallets = Array.isArray(window.__sui_wallets__) ? window.__sui_wallets__ : [];
			for (const wallet of injectedWallets) {
				if (!wallet || !isSuiCapableWallet(wallet)) continue;
				const walletName = wallet.name || 'Sui Wallet';
				if (seenNames.has(walletName)) continue;
				wallets.push(wallet);
				seenNames.add(walletName);
			}

			// Fallback: check window globals
			const windowWallets = [
				{ check: () => window.phantom?.sui, name: 'Phantom' },
				{ check: () => window.suiWallet, name: 'Sui Wallet' },
				{ check: () => window.slush, name: 'Slush' },
				{ check: () => window.suiet, name: 'Suiet' },
				{ check: () => window.martian?.sui, name: 'Martian' },
				{ check: () => window.ethos, name: 'Ethos' },
				{ check: () => window.okxwallet?.sui, name: 'OKX Wallet' },
			];
			for (const wc of windowWallets) {
				try {
					const w = wc.check();
					if (w && !seenNames.has(wc.name)) {
						if (!isSuiCapableWallet(w)) continue;
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
				resolvedPrimaryName = null;
				connectWalletSession(wallet.name, connectedAddress);
				walletBtn.classList.add('connected');
				walletBtnText.textContent = connectedAddress.slice(0, 6) + '...' + connectedAddress.slice(-4);
				walletModal.classList.remove('open');
				updateWalletProfileButton();

					resolveWalletName(connectedAddress);
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
				resolvedPrimaryName = null;
				disconnectWalletSession();
				walletBtn.classList.remove('connected');
				walletBtnText.textContent = 'Connect';
				walletMenu.classList.remove('open');
				updateWalletProfileButton();
			}

		function renderWalletMenu() {
			const profileHref = resolvedPrimaryName
				? 'https://' + encodeURIComponent(resolvedPrimaryName) + '.sui.ski'
				: null;
			const namesHref = 'https://www.tradeport.xyz/sui/' + connectedAddress + '?tab=items&collectionFilter=suins';
			let html = '<button class="wallet-menu-item" id="wm-copy">'
				+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
				+ 'Copy Address</button>';
			if (profileHref) {
				html += '<a class="wallet-menu-item" href="' + profileHref + '">'
					+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>'
					+ 'My Profile</a>';
			}
			html += '<a class="wallet-menu-item" href="' + namesHref + '" target="_blank" rel="noopener noreferrer">'
				+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
				+ 'My Names</a>';
			html += '<button class="wallet-menu-item" id="wm-switch">'
				+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>'
				+ 'Switch Wallet</button>';
			html += '<button class="wallet-menu-item disconnect" id="wm-disconnect">'
				+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
				+ 'Disconnect</button>';
			walletMenu.innerHTML = html;

			document.getElementById('wm-copy').onclick = () => {
				navigator.clipboard.writeText(connectedAddress).then(() => {
					const btn = document.getElementById('wm-copy');
					const flash = document.createElement('span');
					flash.className = 'copied-flash';
					flash.textContent = 'Copied!';
					btn.appendChild(flash);
					setTimeout(() => flash.remove(), 1500);
				});
			};
			document.getElementById('wm-switch').onclick = () => {
				walletMenu.classList.remove('open');
				disconnectWallet();
				setTimeout(() => openWalletModal(), 120);
			};
			document.getElementById('wm-disconnect').onclick = () => disconnectWallet();
		}

		function toggleWalletMenu() {
			if (walletMenu.classList.contains('open')) {
				walletMenu.classList.remove('open');
			} else {
				renderWalletMenu();
				walletMenu.classList.add('open');
			}
		}

		async function openWalletModal() {
			if (connectedAddress) { toggleWalletMenu(); return; }
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
		updateWalletProfileButton();
		if (walletProfileBtn) {
			walletProfileBtn.onclick = (e) => {
				e.stopPropagation();
				window.location.href = walletProfileBtn.dataset.href || 'https://sui.ski';
			};
		}
		walletModalClose.onclick = () => walletModal.classList.remove('open');
		walletModal.onclick = (e) => { if (e.target === walletModal) walletModal.classList.remove('open'); };

		document.addEventListener('click', (e) => {
			if (!e.target.closest('.wallet-btn') && !e.target.closest('.wallet-menu')) {
				walletMenu.classList.remove('open');
			}
		});

			async function executeTransaction(tx) {
			const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
			const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];
			const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];

			const txBytes = await tx.build({ client: suiClient });

			if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
				return await signExecBlockFeature.signAndExecuteTransactionBlock({
					transactionBlock: txBytes,
					account: connectedAccount,
					chain,
				});
			}

			if (signExecFeature?.signAndExecuteTransaction) {
				return await signExecFeature.signAndExecuteTransaction({
					transaction: Transaction.from(txBytes),
					account: connectedAccount,
					chain,
				});
			}

			if (window.phantom?.sui?.signAndExecuteTransactionBlock) {
				try {
					return await window.phantom.sui.signAndExecuteTransactionBlock({
						transactionBlock: txBytes,
					});
				} catch (e) {
					const txB64 = btoa(String.fromCharCode.apply(null, Array.from(txBytes)));
					return await window.phantom.sui.signAndExecuteTransactionBlock({
						transactionBlock: txB64,
					});
				}
			}

			if (window.suiWallet?.signAndExecuteTransactionBlock) {
				return await window.suiWallet.signAndExecuteTransactionBlock({
					transactionBlock: txBytes,
				});
			}

			throw new Error('No compatible Sui wallet found');
		}

		initClients();

		(async () => {
			const hint = getWalletSession();
			if (!hint) return;
			await new Promise(r => setTimeout(r, 300));
			const wallets = getSuiWallets();
			const match = wallets.find(w => w.name === hint.walletName);
			if (match) connectWallet(match);
		})();

		// ========== SEARCH FUNCTIONALITY ==========
		const searchInput = document.getElementById('search-input');
		const searchForm = document.getElementById('search-form');
		const searchBox = searchForm;
		const dropdown = document.getElementById('dropdown');

			let debounceTimer = null;
			let lastQuery = '';
			const cache = new Map();
			const suggestCache = new Map();
			const ownerNameCache = new Map();
			const ownerNameInFlight = new Map();
			const FEATURED_FALLBACK = ['agents', 'agent', 'vault', 'alpha', 'pro', 'wallet', 'builder', 'domain', 'defi'];
			let featuredRequestNonce = 0;

			function showDropdownLoading(message) {
				dropdown.innerHTML = '<div class="dropdown-loading">' + message + '</div>';
				dropdown.classList.add('visible');
				searchBox.classList.add('has-results');
			}

		async function fetchSuggestions(query) {
			if (suggestCache.has(query)) return suggestCache.get(query);
			try {
				const res = await fetch('/api/suggest-names?q=' + encodeURIComponent(query));
				if (res.ok) {
					const data = await res.json();
					const names = data.suggestions || [query];
					suggestCache.set(query, names);
					return names;
				}
			} catch (e) {}
			return [query];
		}

			async function resolveOwnerName(address) {
				if (!address) return null;
				if (ownerNameCache.has(address)) return ownerNameCache.get(address);
				const inflight = ownerNameInFlight.get(address);
				if (inflight) return inflight;

				const request = (async () => {
					try {
						const result = await suiClient.resolveNameServiceNames({ address });
						const name = result?.data?.[0] || null;
						ownerNameCache.set(address, name);
						return name;
					} catch {
						ownerNameCache.set(address, null);
						return null;
					} finally {
						ownerNameInFlight.delete(address);
					}
				})();

				ownerNameInFlight.set(address, request);
				return request;
			}

			async function updateOwnerColumn(item, ownerAddress) {
				const ownerCol = item.querySelector('.col-owner');
				if (!ownerCol) return;
				if (!ownerAddress) {
					ownerCol.textContent = '--';
					ownerCol.classList.remove('loading');
					return;
				}
				ownerCol.textContent = '...';
				ownerCol.classList.add('loading');
				const ownerName = await resolveOwnerName(ownerAddress);
				if (item.dataset.ownerAddress !== ownerAddress) return;
				if (ownerName) {
					const shortName = ownerName.replace(/\\.sui$/, '');
					const link = document.createElement('a');
					link.href = 'https://' + encodeURIComponent(shortName) + '.sui.ski';
					link.textContent = ownerName;
					link.title = ownerAddress;
					link.addEventListener('click', (e) => e.stopPropagation());
					ownerCol.textContent = '';
					ownerCol.appendChild(link);
				} else {
					ownerCol.textContent = ownerAddress.slice(0, 6) + '...' + ownerAddress.slice(-4);
					ownerCol.title = ownerAddress;
				}
				ownerCol.classList.remove('loading');
			}

			async function showFeaturedSuggestions() {
				const nonce = ++featuredRequestNonce;
				showDropdownLoading('Loading premium names...');
				try {
					const res = await fetch('/api/featured-names');
					let names = FEATURED_FALLBACK;
					if (res.ok) {
						const data = await res.json();
						const featured = Array.isArray(data?.names) ? data.names : [];
						const extracted = featured
							.map((item) => (item && typeof item.name === 'string' ? item.name.toLowerCase() : null))
							.filter((name) => !!name && /^[a-z0-9-]{3,}$/.test(name));
						if (extracted.length) {
							const unique = Array.from(new Set(extracted));
							names = ['agents', ...unique.filter((name) => name !== 'agents')].slice(0, 10);
						}
					}
					if (nonce !== featuredRequestNonce) return;
					showDropdown(names);
				} catch {
					if (nonce !== featuredRequestNonce) return;
					showDropdown(FEATURED_FALLBACK);
				}
			}

			function showDropdown(names) {
				if (!names.length) {
					dropdown.classList.remove('visible');
					searchBox.classList.remove('has-results');
					return;
				}
				let html = '<div class="dropdown-header"><span>Name</span><span>Price</span><span>Status</span><span>Owner</span></div>';
				for (const n of names) {
					html += '<div class="dropdown-item" data-name="' + n + '">'
						+ '<div class="col-name"><span class="dot checking"></span><span class="name-meta"><span class="label">' + n + '<span class="suffix">.sui</span></span><span class="name-expiry"></span></span></div>'
						+ '<div class="col-price">--</div>'
						+ '<div class="col-status"><span class="status-text">...</span></div>'
						+ '<div class="col-owner">--</div>'
						+ '</div>';
				}
				dropdown.innerHTML = html;
			dropdown.classList.add('visible');
			searchBox.classList.add('has-results');
			for (const n of names) checkName(n);
		}

		async function checkName(name) {
			const item = dropdown.querySelector('[data-name="' + name + '"]');
			if (!item) return;
			if (cache.has(name)) {
				updateItem(item, name, cache.get(name));
				return;
			}
			try {
				const resolveRes = await fetch('/api/resolve?name=' + encodeURIComponent(name));
				const resolveData = await resolveRes.json();
					const result = {
						available: !resolveData.found,
						expirationMs: resolveData.data?.expirationTimestampMs ? Number(resolveData.data.expirationTimestampMs) : null,
						inGracePeriod: resolveData.inGracePeriod || false,
						nftId: resolveData.data?.nftId || null,
						ownerAddress: resolveData.data?.ownerAddress || null,
					};
					cache.set(name, result);
					updateItem(item, name, result);
			} catch (e) {
				const statusEl = item.querySelector('.status-text');
				if (statusEl) { statusEl.textContent = 'error'; statusEl.className = 'status-text taken'; }
				const dot = item.querySelector('.dot');
				if (dot) dot.className = 'dot taken';
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

		function setNameExpiry(item, label, color) {
			const expiryEl = item.querySelector('.name-expiry');
			if (!expiryEl) return;
			if (label && color) {
				expiryEl.textContent = label;
				expiryEl.className = 'name-expiry expiry-' + color;
			} else {
				expiryEl.textContent = '';
				expiryEl.className = 'name-expiry';
			}
		}

			function updateItem(item, name, result) {
				const dot = item.querySelector('.dot');
				const priceCol = item.querySelector('.col-price');
				const statusCol = item.querySelector('.col-status');
				const ownerCol = item.querySelector('.col-owner');

				if (result.available) {
					dot.className = 'dot available';
					setNameExpiry(item, null, null);
					priceCol.innerHTML = '--';
					statusCol.innerHTML = '<button class="action-btn register" data-action="register">Register</button>';
					if (ownerCol) ownerCol.textContent = '--';
					statusCol.querySelector('.action-btn').onclick = (e) => {
						e.stopPropagation();
						window.location.href = 'https://' + name + '.sui.ski?register=1';
				};
				fetchPricing(item, name);
				} else {
					dot.className = 'dot taken';
					if (result.ownerAddress) {
						item.dataset.ownerAddress = result.ownerAddress;
						updateOwnerColumn(item, result.ownerAddress);
					} else {
						delete item.dataset.ownerAddress;
						if (ownerCol) ownerCol.textContent = '--';
					}
					const expiry = getExpiryInfo(result.expirationMs);
					if (expiry && expiry.daysLeft > 0) {
						const years = Math.floor(expiry.daysLeft / 365);
						const days = expiry.daysLeft % 365;
						const label = years > 0 ? years + 'y ' + days + 'd' : expiry.daysLeft + 'd';
						item.dataset.expiryLabel = label;
						item.dataset.expiryColor = expiry.color;
						setNameExpiry(item, label, expiry.color);
					} else {
						delete item.dataset.expiryLabel;
						delete item.dataset.expiryColor;
						setNameExpiry(item, null, null);
					}
					const canOffer = connectedAddress && result.nftId;
					if (canOffer) {
						item.dataset.nftId = result.nftId;
						priceCol.innerHTML =
							'<div class="offer-input-wrap"><span class="offer-currency">$</span><input type="number" class="offer-amount" min="1" step="any" placeholder="--"></div>';
						statusCol.innerHTML = '<button class="action-btn offer">Offer</button>';
					} else {
						priceCol.innerHTML = '--';
						statusCol.innerHTML = '<a class="action-btn buy" href="https://' + encodeURIComponent(name) + '.sui.ski">View</a>';
					}
					if (canOffer) {
						const offerBtn = statusCol.querySelector('.action-btn.offer');
						const offerInput = priceCol.querySelector('.offer-amount');
					offerBtn.addEventListener('click', (e) => { e.stopPropagation(); placeOffer(name, item); });
					offerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); placeOffer(name, item); } });
					offerInput.addEventListener('click', (e) => e.stopPropagation());
				}
				statusCol.querySelectorAll('a.action-btn').forEach(b => b.addEventListener('click', (e) => e.stopPropagation()));
				fetchListingPrice(item, name);
			}
		}

		async function fetchPricing(item, name) {
			try {
				const res = await fetch('/api/pricing?domain=' + encodeURIComponent(name) + '&years=1');
				if (!res.ok) return;
				const data = await res.json();
				const priceCol = item.querySelector('.col-price');
				if (data.directSuiMist && data.discountedSuiMist) {
					const original = (Number(data.directSuiMist) / 1e9).toFixed(1);
					const discounted = (Number(data.discountedSuiMist) / 1e9).toFixed(1);
					priceCol.innerHTML = '<span class="original">' + original + ' SUI</span><span class="discounted">' + discounted + ' SUI</span>';
				}
			} catch (e) {}
		}

		async function fetchListingPrice(item, name) {
			try {
				const res = await fetch('/api/marketplace/' + encodeURIComponent(name));
				if (!res.ok) return;
				const data = await res.json();
				const dot = item.querySelector('.dot');
				const priceCol = item.querySelector('.col-price');
				const statusCol = item.querySelector('.col-status');
				const hasListing = data.bestListing && data.bestListing.price > 0;
				const hasBid = data.bestBid && data.bestBid.price > 0;

				if (data.nfts && data.nfts.length > 0) {
					const firstNft = data.nfts[0];
					if (firstNft.id && !item.dataset.nftId) {
						item.dataset.nftId = firstNft.id;
					}
					if (firstNft.owner) {
						item.dataset.ownerAddress = firstNft.owner;
						updateOwnerColumn(item, firstNft.owner);
					}
				}

				if (!hasListing && !hasBid) return;

					const offerInput = priceCol.querySelector('.offer-amount');
					const tradeportUrl = hasListing
						? (data.bestListing.tradeportUrl || 'https://www.tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(name))
						: null;

					if (offerInput) {
					if (cachedSuiPriceUsd) {
							const refPrice = hasListing ? data.bestListing.price : (hasBid ? data.bestBid.price : 0);
							if (refPrice > 0) {
								const usdValue = Math.round((refPrice / 1e9) * cachedSuiPriceUsd);
								item.dataset.referenceUsd = usdValue > 0 ? String(usdValue) : '';
								offerInput.placeholder = usdValue > 0 ? String(usdValue) : '--';
							}
						}
						if (hasListing) {
							const listingSui = (data.bestListing.price / 1e9).toFixed(1) + ' SUI';
							priceCol.innerHTML = '<span class="listing-price">' + listingSui + '</span>';
							if (dot) dot.className = 'dot listed';
							if (connectedAddress && item.dataset.nftId) {
								statusCol.innerHTML =
									'<button class="action-btn offer">Offer</button>' +
									'<a class="action-btn register" href="' + tradeportUrl + '" target="_blank" rel="noopener noreferrer">Buy</a>';
								const offerBtn = statusCol.querySelector('.action-btn.offer');
								offerBtn?.addEventListener('click', (e) => { e.stopPropagation(); placeOffer(name, item); });
							} else {
								const viewBtn = '<a class="action-btn buy" href="https://' + encodeURIComponent(name) + '.sui.ski">View</a>';
								const buyBtn = '<a class="action-btn register" href="' + tradeportUrl + '" target="_blank" rel="noopener noreferrer">Buy</a>';
								statusCol.innerHTML = viewBtn + buyBtn;
							}
							statusCol.querySelectorAll('a.action-btn').forEach(b => b.addEventListener('click', (e) => e.stopPropagation()));
						}
					} else {
						let priceHtml = '';
						if (hasListing) {
							priceHtml += '<span class="listing-price">' + (data.bestListing.price / 1e9).toFixed(1) + ' SUI</span>';
						}
						if (hasBid) {
							priceHtml += '<span class="offer-price">' + (data.bestBid.price / 1e9).toFixed(1) + ' offer</span>';
						}
						if (priceCol) priceCol.innerHTML = priceHtml;

					if (hasListing) {
						if (dot) dot.className = 'dot listed';
						const viewBtn = '<a class="action-btn buy" href="https://' + encodeURIComponent(name) + '.sui.ski">View</a>';
						const buyBtn = '<a class="action-btn register" href="' + tradeportUrl + '" target="_blank" rel="noopener noreferrer">Buy</a>';
						statusCol.innerHTML = viewBtn + buyBtn;
						statusCol.querySelectorAll('.action-btn').forEach(b => b.addEventListener('click', (e) => e.stopPropagation()));
					}
				}
				if (hasListing && !dot.classList.contains('listed')) {
					if (dot) dot.className = 'dot listed';
				}
			} catch (e) {}
		}

		searchInput.addEventListener('input', () => {
			const raw = searchInput.value.trim().toLowerCase().replace(/\\.sui$/i, '').replace(/[^a-z0-9-]/g, '');
			if (!raw) {
				clearTimeout(debounceTimer);
				lastQuery = '';
				showFeaturedSuggestions();
				return;
			}
			featuredRequestNonce++;
			if (raw === lastQuery) return;
			if (raw.length < 3) {
				dropdown.innerHTML = '<div class="dropdown-loading">Min 3 characters</div>';
				dropdown.classList.add('visible');
				searchBox.classList.add('has-results');
				return;
			}
			lastQuery = raw;
			clearTimeout(debounceTimer);
			showDropdown([raw]);
			debounceTimer = setTimeout(async () => {
				if (lastQuery !== raw) return;
				const suggestions = await fetchSuggestions(raw);
				if (lastQuery !== raw) return;
				const unique = [raw];
				const seen = new Set([raw]);
				for (const s of suggestions) {
					if (!seen.has(s)) { seen.add(s); unique.push(s); }
				}
				showDropdown(unique);
			}, 200);
		});

		searchInput.addEventListener('focus', () => {
			document.body.classList.add('search-focused');
			const raw = searchInput.value.trim().toLowerCase().replace(/\\.sui$/i, '').replace(/[^a-z0-9-]/g, '');
			if (!raw) {
				showFeaturedSuggestions();
				return;
			}
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
			if (item && !e.target.closest('.action-btn') && !e.target.closest('.col-owner a')) {
				window.location.href = 'https://' + item.dataset.name + '.sui.ski';
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

		function showOfferStatus(statusCol, msg, type) {
			const existing = statusCol.querySelector('.offer-status');
			if (existing) existing.remove();
			const span = document.createElement('span');
			span.className = 'offer-status ' + type;
			span.textContent = msg;
			statusCol.appendChild(span);
			if (type !== 'info') setTimeout(() => span.remove(), 4000);
		}

		function buildBidCall(tx, nftId, bidMist, paymentCoin) {
			const multiBidStoreRef = tx.sharedObjectRef({
				objectId: TRADEPORT_MULTI_BID_STORE,
				initialSharedVersion: TRADEPORT_MULTI_BID_STORE_VERSION,
				mutable: true,
			});
			tx.moveCall({
				target: TRADEPORT_MULTI_BID_PACKAGE + '::tradeport_biddings::create_bid_without_transfer_policy',
				typeArguments: [SUINS_REGISTRATION_TYPE],
				arguments: [
					multiBidStoreRef,
					tx.pure.u64(1),
					tx.pure.option('address', null),
					tx.pure.option('address', nftId),
					tx.pure.option('vector<u8>', null),
					tx.pure.option('u64', null),
					tx.pure.u64(bidMist),
					paymentCoin,
				],
			});
		}

			async function buildUsdcSwapAndBid(
				tx,
				totalMist,
				bidMist,
				nftId,
			) {
				const usdcCoins = await suiClient.getCoins({ owner: connectedAddress, coinType: USDC_TYPE });
				if (!usdcCoins.data.length) throw new Error('No USDC balance found');
			const usdcIds = usdcCoins.data.map(c => c.coinObjectId);
			let usdcCoin;
			if (usdcIds.length === 1) {
				usdcCoin = tx.object(usdcIds[0]);
			} else {
				tx.mergeCoins(tx.object(usdcIds[0]), usdcIds.slice(1).map(id => tx.object(id)));
				usdcCoin = tx.object(usdcIds[0]);
			}

			const deepSwapAmount = 10_000_000n;
			const [deepFeeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(deepSwapAmount)]);
			const [deepOut, suiLeftDeep, deepLeft1] = tx.moveCall({
				target: DEEPBOOK_PACKAGE + '::pool::swap_exact_base_for_quote',
				typeArguments: [SUI_TYPE, DEEP_TYPE],
				arguments: [
					tx.object(DEEPBOOK_DEEP_SUI_POOL),
					deepFeeCoin,
					tx.moveCall({ target: '0x2::coin::zero', typeArguments: [DEEP_TYPE] }),
					tx.pure.u64(0n),
					tx.object(CLOCK_OBJECT),
				],
			});

				const [suiOut, usdcLeft, deepLeft2] = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
					typeArguments: [SUI_TYPE, USDC_TYPE],
					arguments: [
						tx.object(DEEPBOOK_SUI_USDC_POOL),
						usdcCoin,
						deepOut,
						tx.pure.u64(totalMist),
						tx.object(CLOCK_OBJECT),
					],
				});

				const [bidPayment] = tx.splitCoins(suiOut, [tx.pure.u64(totalMist)]);
				buildBidCall(tx, nftId, bidMist, bidPayment);
				tx.transferObjects([suiOut, usdcLeft, deepLeft2, suiLeftDeep, deepLeft1], tx.pure.address(connectedAddress));
			}

		async function placeOffer(name, item) {
			const statusCol = item.querySelector('.col-status');
			const offerBtn = statusCol.querySelector('.action-btn.offer');
			const offerInput = item.querySelector('.offer-amount');
			let offerUsd = parseFloat(offerInput?.value || '');
			if ((!offerUsd || offerUsd <= 0) && !offerInput) {
				const suggested = item.dataset.referenceUsd || '';
				const prompted = window.prompt('Enter offer amount (USD)', suggested);
				offerUsd = parseFloat(prompted || '');
			}

			if (!connectedAddress) { showOfferStatus(statusCol, 'Connect wallet', 'error'); return; }
			if (!offerUsd || offerUsd <= 0) { showOfferStatus(statusCol, 'Enter amount', 'error'); return; }
			if (!cachedSuiPriceUsd) { showOfferStatus(statusCol, 'Price loading...', 'error'); return; }

			const nftId = item.dataset.nftId;
			if (!nftId) { showOfferStatus(statusCol, 'NFT not found', 'error'); return; }

			offerBtn.disabled = true;
			showOfferStatus(statusCol, 'Building...', 'info');

				try {
					const bidMist = BigInt(Math.ceil(offerUsd / cachedSuiPriceUsd * 1e9));
					const feeMist = (bidMist * BigInt(TRADEPORT_BID_FEE_BPS) + 9999n) / 10000n;
					const totalMist = bidMist + feeMist;

					const tx = new Transaction();
					tx.setSender(connectedAddress);

				const suiBalance = await suiClient.getBalance({ owner: connectedAddress, coinType: SUI_TYPE });
				const suiBal = BigInt(suiBalance.totalBalance);
				const gasBuffer = 50_000_000n;

					if (suiBal >= totalMist + gasBuffer) {
						const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalMist)]);
						buildBidCall(tx, nftId, bidMist, paymentCoin);
					} else {
						await buildUsdcSwapAndBid(tx, totalMist, bidMist, nftId);
					}

				tx.setGasBudget(50_000_000);
				showOfferStatus(statusCol, 'Confirm in wallet...', 'info');
				await executeTransaction(tx);

				const existing = statusCol.querySelector('.offer-status');
				if (existing) existing.remove();
				showOfferStatus(statusCol, 'Bid placed!', 'success');
				if (offerInput) offerInput.value = '';
			} catch (e) {
				const msg = e.message || 'Failed';
				showOfferStatus(statusCol, msg.length > 30 ? msg.slice(0, 27) + '...' : msg, 'error');
			} finally {
				offerBtn.disabled = false;
			}
		}

		async function updatePrice() {
			try {
				const res = await fetch('/api/sui-price');
				if (res.ok) {
					const data = await res.json();
					if (data.price) {
						cachedSuiPriceUsd = data.price;
						document.getElementById('sui-price').textContent = '$' + data.price.toFixed(2);
					}
				}
			} catch (e) {}
		}
		updatePrice();
		setInterval(updatePrice, 60000);
	</script>
</body>
</html>`
}
