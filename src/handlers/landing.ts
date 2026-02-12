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
import { generateSharedWalletMountJs } from '../utils/shared-wallet-js'
import { renderSocialMeta } from '../utils/social'
import { getGatewayStatus } from '../utils/status'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'

export interface LandingPageOptions {
	canonicalUrl?: string
	rpcUrl?: string
	network?: string
	session?: {
		address: string | null
		walletName: string | null
		verified: boolean
	}
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

apiRoutes.get('/primary-name', async (c) => {
	try {
		const env = c.get('env')
		const address = String(c.req.query('address') || '').trim()
		if (!address) return jsonResponse({ error: 'Address parameter required' }, 400)

		const cacheKeyValue = cacheKey('primary-name', env.SUI_NETWORK, address.toLowerCase())
		const cached = await getCached<{ name: string | null }>(cacheKeyValue)
		if (cached) {
			return jsonResponse(
				{
					address,
					name: cached.name,
				},
				200,
				{ 'X-Cache': 'HIT' },
			)
		}

		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		let name: string | null = null
		try {
			const result = await client.resolveNameServiceNames({ address })
			const first = Array.isArray(result?.data) ? result.data[0] : null
			name = typeof first === 'string' ? first : null
		} catch (_error) {
			name = null
		}

		await setCache(cacheKeyValue, { name }, 60)
		return jsonResponse(
			{
				address,
				name,
			},
			200,
			{ 'X-Cache': 'MISS' },
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to resolve primary name'
		return jsonResponse({ error: message }, 500)
	}
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
				txEncoding: 'bcs',
				method: 'sui',
			})
		}

		const result = await buildSwapAndRenewTx({ domain, nftId, years, senderAddress }, env)
		const txBytes = await result.tx.build({ client })
		return jsonResponse({
			txBytes: Buffer.from(txBytes).toString('base64'),
			txEncoding: 'bcs',
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
const GRACE_WRAP_WINDOW_MS = 30n * 86_400_000n
const GRACE_WRAP_DURATION_MS = 30n * 86_400_000n
const GRACE_WRAP_CURVE_EXPONENT = 69n
const GRACE_WRAP_START_PRICE_MIST = 100_000_000n * 1_000_000_000n
const AUCTION_DECAY_PPM_SCALE = 1_000_000n

function computeDecayPriceMist(
	startPriceMist: bigint,
	remainingMs: bigint,
	totalMs: bigint,
): bigint {
	if (totalMs <= 0n || remainingMs <= 0n) return 0n
	const remainingPpm = (remainingMs * AUCTION_DECAY_PPM_SCALE) / totalMs
	let ratioPpm = AUCTION_DECAY_PPM_SCALE
	for (let i = 0n; i < GRACE_WRAP_CURVE_EXPONENT; i++) {
		ratioPpm = (ratioPpm * remainingPpm) / AUCTION_DECAY_PPM_SCALE
	}
	const price = (startPriceMist * ratioPpm) / AUCTION_DECAY_PPM_SCALE
	return price > 0n ? price : 1n
}

function computeGraceWrapAuctionParams(expirationMs: bigint, nowMs: bigint) {
	const graceEndMs = expirationMs + GRACE_WRAP_WINDOW_MS
	if (nowMs >= graceEndMs) return null
	const remainingGraceMs = nowMs < expirationMs ? GRACE_WRAP_WINDOW_MS : graceEndMs - nowMs
	const currentPremiumMist =
		nowMs < expirationMs
			? GRACE_WRAP_START_PRICE_MIST
			: computeDecayPriceMist(GRACE_WRAP_START_PRICE_MIST, remainingGraceMs, GRACE_WRAP_WINDOW_MS)
	return {
		startPriceMist: GRACE_WRAP_START_PRICE_MIST,
		startTimeMs: expirationMs,
		durationMs: GRACE_WRAP_DURATION_MS,
		graceEndMs,
		currentPremiumMist,
	}
}

apiRoutes.post('/auction/list', async (c) => {
	const env = c.get('env')

	if (!env.DECAY_AUCTION_PACKAGE_ID) {
		return jsonResponse({ error: 'Decay auction not configured' }, 400)
	}

	try {
		const body = await c.req.json<{
			nftId: string
			startPriceMist?: string
			durationMs?: string
			senderAddress: string
			curveMode?: string
			expirationMs?: string | number
		}>()

		if (!body.nftId || !body.senderAddress) {
			return jsonResponse({ error: 'Missing required fields: nftId, senderAddress' }, 400)
		}

		const isGraceWindowMode = body.curveMode === 'grace-window'
		let startPriceMist: bigint
		let durationMs: bigint
		let startTimeMs: bigint | null = null
		let graceEndMs: bigint | null = null
		let currentPremiumMist: bigint | null = null

		if (isGraceWindowMode) {
			if (body.expirationMs === undefined || body.expirationMs === null) {
				return jsonResponse({ error: 'expirationMs is required for grace-window mode' }, 400)
			}
			const expirationMs = BigInt(String(body.expirationMs))
			if (expirationMs <= 0n) {
				return jsonResponse({ error: 'Invalid expiration timestamp' }, 400)
			}
			const nowMs = BigInt(Date.now())
			const computed = computeGraceWrapAuctionParams(expirationMs, nowMs)
			if (!computed) {
				return jsonResponse({ error: 'Grace period has ended for this name' }, 400)
			}
			startPriceMist = computed.startPriceMist
			startTimeMs = computed.startTimeMs
			durationMs = computed.durationMs
			graceEndMs = computed.graceEndMs
			currentPremiumMist = computed.currentPremiumMist
		} else {
			if (!body.startPriceMist || !body.durationMs) {
				return jsonResponse({ error: 'Missing required fields: startPriceMist, durationMs' }, 400)
			}
			startPriceMist = BigInt(body.startPriceMist)
			durationMs = BigInt(body.durationMs)
			if (startPriceMist < MIN_AUCTION_PRICE_MIST) {
				return jsonResponse({ error: 'Start price must be at least 1 SUI' }, 400)
			}
		}

		if (durationMs < MIN_AUCTION_DURATION_MS || durationMs > MAX_AUCTION_DURATION_MS) {
			return jsonResponse({ error: 'Duration must be between 1 hour and 30 days' }, 400)
		}

		const suinsRegType =
			SUINS_REG_TYPE_BY_NETWORK[env.SUI_NETWORK] || SUINS_REG_TYPE_BY_NETWORK.mainnet

		const tx = new Transaction()
		tx.setSender(body.senderAddress)
		tx.setGasBudget(50_000_000)

		if (isGraceWindowMode) {
			tx.moveCall({
				target: `${env.DECAY_AUCTION_PACKAGE_ID}::auction::create_and_share_with_start_time`,
				typeArguments: [suinsRegType],
				arguments: [
					tx.object(body.nftId),
					tx.pure.u64(startPriceMist),
					tx.pure.u64(startTimeMs || 0n),
					tx.pure.u64(durationMs),
					tx.object('0x6'),
				],
			})
		} else {
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
		}

		const txBytes = await tx.toJSON()
		return jsonResponse({
			txBytes,
			curveMode: isGraceWindowMode ? 'grace-window' : 'custom',
			startPriceMist: String(startPriceMist),
			...(startTimeMs ? { startTimeMs: String(startTimeMs) } : {}),
			durationMs: String(durationMs),
			...(graceEndMs ? { graceEndMs: String(graceEndMs) } : {}),
			...(currentPremiumMist ? { currentPremiumMist: String(currentPremiumMist) } : {}),
		})
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
		const startPrice = fields.start_price_mist || fields.start_price
		return jsonResponse({
			active: true,
			listingId: cached.listingId,
			seller: fields.seller as string,
			startPriceMist: String(startPrice || 0),
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
		const startPriceRaw = fields.start_price_mist || fields.start_price
		const startPrice = BigInt(String(startPriceRaw || 0))
		const startTimeMs = BigInt(String(fields.start_time_ms))
		const endTimeMs = BigInt(String(fields.end_time_ms))
		const now = BigInt(Date.now())

		if (now < startTimeMs) {
			return jsonResponse({ error: 'Auction has not started yet' }, 400)
		}
		if (now >= endTimeMs) {
			return jsonResponse({ error: 'Auction has ended' }, 400)
		}

		const duration = endTimeMs - startTimeMs
		const remaining = endTimeMs - now
		const currentPrice = computeDecayPriceMist(startPrice, remaining, duration)

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

apiRoutes.post('/auction/cancel', async (c) => {
	const env = c.get('env')

	if (!env.DECAY_AUCTION_PACKAGE_ID) {
		return jsonResponse({ error: 'Decay auction not configured' }, 400)
	}

	try {
		const body = await c.req.json<{ listingId: string; sellerAddress: string }>()
		if (!body.listingId || !body.sellerAddress) {
			return jsonResponse({ error: 'Missing required fields: listingId, sellerAddress' }, 400)
		}

		const suinsRegType =
			SUINS_REG_TYPE_BY_NETWORK[env.SUI_NETWORK] || SUINS_REG_TYPE_BY_NETWORK.mainnet

		const tx = new Transaction()
		tx.setSender(body.sellerAddress)
		tx.setGasBudget(50_000_000)

		tx.moveCall({
			target: `${env.DECAY_AUCTION_PACKAGE_ID}::auction::cancel`,
			typeArguments: [suinsRegType],
			arguments: [tx.object(body.listingId), tx.object('0x6')],
		})

		const txBytes = await tx.toJSON()
		return jsonResponse({ txBytes })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build cancel transaction'
		console.error('Auction cancel tx error:', error)
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
	const refresh = c.req.query('refresh') === '1'
	return handleNamesByAddress(address, c.get('env'), { bypassCache: refresh })
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

apiRoutes.post('/marketplace-batch', async (c) => {
	try {
		const body = await c.req.json()
		const { names } = body as { names?: string[] }
		if (!names || !Array.isArray(names) || names.length === 0) {
			return jsonResponse({ error: 'names array required' }, 400)
		}
		const MAX_BATCH = 20
		const batch = names.slice(0, MAX_BATCH)
		const env = c.get('env')
		const settled = await Promise.allSettled(
			batch.map(async (name) => {
				const res = await handleMarketplaceData(name, env)
				const data = await res.json()
				return { name, data }
			}),
		)
		const results: Record<string, unknown> = {}
		for (const entry of settled) {
			if (entry.status === 'fulfilled') {
				results[entry.value.name] = entry.value.data
			}
		}
		return jsonResponse({ results })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Invalid request body'
		return jsonResponse({ error: message }, 400)
	}
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
	const mode = normalizeSuggestionMode(c.req.query('mode'))
	return handleNameSuggestions(query, c.get('env'), mode)
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
	isListed: boolean
	listingPriceMist: number | null
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
async function handleNamesByAddress(
	address: string,
	env: Env,
	options: { bypassCache?: boolean } = {},
): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	try {
		const bypassCache = options.bypassCache === true
		const key = cacheKey('linked-names', env.SUI_NETWORK, address)
		if (!bypassCache) {
			const cached = await getCached<LinkedNamesCache>(key)
			if (cached) {
				return new Response(JSON.stringify(cached), {
					status: 200,
					headers: { ...corsHeaders, 'X-Cache': 'HIT' },
				})
			}
		}

		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		const allNames: NameInfo[] = []
		const seenNftIds = new Set<string>()
		const normalizedAddress = address.toLowerCase()

		const normalizeSuinsName = (value: unknown): string | null => {
			const raw = String(value || '')
				.trim()
				.toLowerCase()
			if (!raw) return null
			// Remove .sui suffix if present
			const namePart = raw.endsWith('.sui') ? raw.slice(0, -4) : raw
			// Reject names with invalid characters (only allow a-z, 0-9, -, and . for subdomains)
			if (!/^[a-z0-9.-]+$/.test(namePart)) return null
			return namePart
		}

		// Tradeport indexer query - include delegated_owner for listed NFTs
		const indexerNftQuery = `query fetchWalletInventoryWithListings(
			$where: nfts_bool_exp
			$listingsWhere: listings_bool_exp
			$order_by: [nfts_order_by!]
			$offset: Int
			$limit: Int!
		) {
			sui {
				nfts(where: $where, order_by: $order_by, offset: $offset, limit: $limit) {
					id
					token_id
					name
					owner
					delegated_owner
					delegated_owner_reason
					claimable
					claimable_by
					collection {
						slug
						semantic_slug
					}
					listings(where: $listingsWhere, order_by: {price: asc}) {
						price
						seller
						listed
					}
				}
			}
		}`

		const PAGE_SIZE = 50
		const MAX_PAGES = 200
		const defaultOrderBy = [{ ranking: 'asc_nulls_last' }]
		const listingsWhere = { listed: { _eq: true } }

		const upsertNft = (nft: {
			name: string
			token_id: string
			owner?: string
			delegated_owner?: string
			delegated_owner_reason?: string
			collection?: { slug?: string | null; semantic_slug?: string | null }
			listings?: Array<{ seller?: string; listed?: boolean; price?: number }>
		}) => {
			if (!nft.token_id) return
			const slug = String(nft?.collection?.slug || '').toLowerCase()
			const semanticSlug = String(nft?.collection?.semantic_slug || '').toLowerCase()
			if (slug !== 'suins' && semanticSlug !== 'suins') return

			const tokenId = String(nft.token_id)
			const normalizedName = normalizeSuinsName(nft.name)
			if (!normalizedName) return

			const sellerListing = (nft.listings || []).find(
				(l) => l.listed !== false && String(l.seller || '').toLowerCase() === normalizedAddress,
			)
			const listingPriceMist = sellerListing?.price ?? null

			if (seenNftIds.has(tokenId)) {
				const existing = allNames.find(
					(entry) => String(entry.nftId || '').toLowerCase() === tokenId.toLowerCase(),
				)
				if (existing) {
					if (sellerListing) {
						existing.isListed = true
						if (listingPriceMist !== null) existing.listingPriceMist = listingPriceMist
					}
				}
				return
			}

			seenNftIds.add(tokenId)
			allNames.push({
				name: normalizedName,
				nftId: tokenId,
				expirationMs: null,
				targetAddress: null,
				isPrimary: false,
				isListed: !!sellerListing,
				listingPriceMist,
			})
		}

		const fetchIndexerByWhere = async (where: Record<string, unknown>, queryName: string) => {
			for (let page = 0; page < MAX_PAGES; page++) {
				const offset = page * PAGE_SIZE
				const response = await fetch(INDEXER_API_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'x-api-user': INDEXER_API_USER,
						'x-api-key': env.INDEXER_API_KEY || '',
					},
					body: JSON.stringify({
						query: indexerNftQuery,
						variables: { where, listingsWhere, order_by: defaultOrderBy, offset, limit: PAGE_SIZE },
					}),
				})
				const responseText = await response.text()
				if (!response.ok) {
					console.error(`Tradeport ${queryName} HTTP error:`, response.status, responseText)
					break
				}
				let payload: {
					data?: {
						sui?: {
							nfts?: Array<{
								name: string
								token_id: string
								collection?: { slug?: string | null; semantic_slug?: string | null }
								listings?: Array<{ seller?: string; listed?: boolean; price?: number }>
							}>
						}
					}
					errors?: Array<{ message?: string }>
				}
				try {
					payload = JSON.parse(responseText)
				} catch {
					console.error(`Tradeport ${queryName} JSON parse error:`, responseText.slice(0, 500))
					break
				}
				if (payload?.errors?.length) {
					console.error(`Tradeport ${queryName} query errors:`, JSON.stringify(payload.errors))
					break
				}
				const pageNfts = payload?.data?.sui?.nfts || []
				console.log(`Tradeport ${queryName} page ${page}: ${pageNfts.length} NFTs`)
				if (pageNfts.length === 0) break
				for (const nft of pageNfts) upsertNft(nft)
			}
		}

		console.log('Starting Tradeport queries for address:', normalizedAddress)

		// Query 1: Owned or claimable SuiNS NFTs
		console.log('Query 1: Fetching owned/claimable SuiNS NFTs...')
		await fetchIndexerByWhere(
			{
				_or: [{ owner: { _eq: normalizedAddress } }, { claimable_by: { _eq: normalizedAddress } }],
				collection: { semantic_slug: { _eq: 'suins' } },
			},
			'owned',
		)
		console.log(`After owned query: ${allNames.length} names collected`)

		// Query 2: Query listings table directly for seller's active listings
		// When NFT is listed, owner becomes marketplace but seller remains original owner
		console.log('Query 2: Fetching listings table for seller...')
		const listingsQuery = `query fetchSellerListings($where: listings_bool_exp, $order_by: [listings_order_by!], $offset: Int, $limit: Int!) {
			sui {
				listings(where: $where, order_by: $order_by, offset: $offset, limit: $limit) {
					id
					price
					seller
					listed
					nft {
						id
						token_id
						name
						owner
						collection {
							slug
							semantic_slug
						}
						listings(order_by: {price: asc}) {
							price
							seller
							listed
						}
					}
				}
			}
		}`

		let listedCount = 0
		let newFromListings = 0
		for (let page = 0; page < 50; page++) {
			const offset = page * PAGE_SIZE
			const response = await fetch(INDEXER_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-user': INDEXER_API_USER,
					'x-api-key': env.INDEXER_API_KEY || '',
				},
				body: JSON.stringify({
					query: listingsQuery,
					variables: {
						where: {
							seller: { _eq: normalizedAddress },
							listed: { _eq: true },
							nft: { collection: { semantic_slug: { _eq: 'suins' } } },
						},
						order_by: [{ block_time: 'desc' }],
						offset,
						limit: PAGE_SIZE,
					},
				}),
			})
			if (!response.ok) {
				console.error(`Listings query page ${page} failed:`, response.status)
				break
			}
			const payload = (await response.json()) as {
				data?: {
					sui?: {
						listings?: Array<{
							price?: number
							seller?: string
							listed?: boolean
							nft?: {
								name: string
								token_id: string
								collection?: { slug?: string | null; semantic_slug?: string | null }
								listings?: Array<{ seller?: string; listed?: boolean; price?: number }>
							}
						}>
					}
				}
				errors?: Array<{ message?: string }>
			}
			if (payload?.errors?.length) {
				console.error(`Listings query page ${page} errors:`, JSON.stringify(payload.errors))
				break
			}
			const pageListings = payload?.data?.sui?.listings || []
			console.log(`Listings query page ${page}: ${pageListings.length} listings`)
			let pageNew = 0
			for (const listing of pageListings) {
				if (listing.nft) {
					const tokenId = String(listing.nft.token_id)
					const isNew = !seenNftIds.has(tokenId)
					const nftWithPrice = {
						...listing.nft,
						listings: [
							{ price: listing.price, seller: listing.seller, listed: listing.listed },
							...(listing.nft.listings || []),
						],
					}
					upsertNft(nftWithPrice)
					listedCount++
					if (isNew) {
						newFromListings++
						pageNew++
					}
				}
			}
			console.log(`  -> ${pageNew} new from this page`)
			if (pageListings.length === 0) break
		}
		console.log(`Listings table: ${listedCount} total, ${newFromListings} new (not in owned)`)

		const listedNames = allNames.filter((n) => n.isListed).length
		const ownedNames = allNames.filter((n) => !n.isListed).length
		console.log(`SUMMARY: ${allNames.length} total (${ownedNames} owned, ${listedNames} listed)`)

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
						if (nameRecord?.expirationTimestampMs) {
							nameInfo.expirationMs = Number(nameRecord.expirationTimestampMs)
						}
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

		const missingExpiration = allNames.filter((n) => n.expirationMs === null && n.nftId)
		if (missingExpiration.length > 0) {
			for (let i = 0; i < missingExpiration.length; i += BATCH_SIZE) {
				const batch = missingExpiration.slice(i, i + BATCH_SIZE)
				const objectIds = batch.map((n) => n.nftId)
				try {
					const objects = await client.multiGetObjects({
						ids: objectIds,
						options: { showContent: true },
					})
					for (let j = 0; j < objects.length; j++) {
						const obj = objects[j]
						if (obj.data?.content?.dataType === 'moveObject') {
							const fields = obj.data.content.fields as Record<string, unknown>
							const rawExp = fields?.expiration_timestamp_ms ?? fields?.expirationTimestampMs
							if (rawExp) {
								batch[j].expirationMs = Number(rawExp)
							}
						}
					}
				} catch {
					// NFT objects may have been deleted
				}
			}
		}

		// Step 3: Get unique target addresses and fetch their default names (reverse resolution)
		// Include the queried address itself so the owner's primary name is always detected
		const uniqueAddresses = [
			...new Set([
				normalizedAddress,
				...allNames.map((n) => n.targetAddress).filter(Boolean) as string[],
			]),
		]
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
		const ownerDefaultName = addressDefaultName.get(normalizedAddress)
		const cleanOwnerDefault = ownerDefaultName ? ownerDefaultName.replace(/\.sui$/, '') : null
		for (const nameInfo of allNames) {
			const cleanName = nameInfo.name.replace(/\.sui$/, '')
			if (cleanOwnerDefault && cleanName === cleanOwnerDefault) {
				nameInfo.isPrimary = true
				continue
			}
			if (nameInfo.targetAddress) {
				const defaultName = addressDefaultName.get(nameInfo.targetAddress)
				if (defaultName) {
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
			headers: { ...corsHeaders, 'X-Cache': bypassCache ? 'BYPASS' : 'MISS' },
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
const MARKETPLACE_CACHE_TTL = 60

async function handleMarketplaceData(name: string, _env: Env, tokenId?: string): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	const normalizedName = name.endsWith('.sui') ? name : `${name}.sui`
	const marketCacheKey = cacheKey('marketplace', normalizedName, tokenId || '')

	const cached = await getCached<MarketplaceData>(marketCacheKey)
	if (cached) {
		return new Response(JSON.stringify(cached), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'HIT' },
		})
	}

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
								type: {_in: ["buy", "accept_bid"]}
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

		await setCache(marketCacheKey, data, MARKETPLACE_CACHE_TTL)

		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'MISS' },
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

const ACTIVITY_CACHE_TTL = 60

async function handleNftActivity(nftId: string, _env: Env): Promise<Response> {
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	const activityCacheKey = cacheKey('activity', nftId)
	const cached = await getCached<{ actions: NftActivityAction[] }>(activityCacheKey)
	if (cached) {
		return new Response(JSON.stringify(cached), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'HIT' },
		})
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

		const activityData = { actions: formattedActions }
		await setCache(activityCacheKey, activityData, ACTIVITY_CACHE_TTL)

		return new Response(JSON.stringify(activityData), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'MISS' },
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

	const activityCacheKey = cacheKey('activity-token', tokenId)
	const cached = await getCached<{ actions: NftActivityAction[] }>(activityCacheKey)
	if (cached) {
		return new Response(JSON.stringify(cached), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'HIT' },
		})
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

		const activityData = { actions: formattedActions }
		await setCache(activityCacheKey, activityData, ACTIVITY_CACHE_TTL)

		return new Response(JSON.stringify(activityData), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'MISS' },
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
const MAX_SUGGESTIONS = 24
const SUGGESTION_NAME_RE = /^[a-z0-9-]{3,18}$/
type SuggestionMode = 'x402' | 'related'
const SUGGESTION_X402_SEEDS = [
	'x402',
	'x402ai',
	'x402pay',
	'x402agent',
	'x402wallet',
	'x402app',
	'x402hub',
	'x402sdk',
	'x402kit',
	'x402labs',
]
const SUGGESTION_AI_SEEDS = [
	'ai',
	'agent',
	'agents',
	'aikit',
	'aiwallet',
	'payai',
	'agentai',
	'miniai',
	'quickai',
	'liteai',
]
const SUGGESTION_FALLBACK_SUFFIXES = ['ai', 'agent', 'agents', 'app', 'hub', 'sdk', 'kit', 'labs']

const suggestionMemCache = new Map<string, { data: string[]; exp: number }>()

function normalizeSuggestionMode(value: string | undefined): SuggestionMode {
	return value === 'related' ? 'related' : 'x402'
}

function normalizeSuggestionName(value: string): string | null {
	const cleaned = value
		.toLowerCase()
		.trim()
		.replace(/\.sui$/i, '')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-{2,}/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '')
	if (!SUGGESTION_NAME_RE.test(cleaned)) return null
	return cleaned
}

function buildX402PriorityCandidates(base: string): string[] {
	const normalizedBase = normalizeSuggestionName(base)
	if (!normalizedBase) return [...SUGGESTION_X402_SEEDS]
	const candidates = [
		`x402${normalizedBase}`,
		`${normalizedBase}x402`,
		`x402-${normalizedBase}`,
		`${normalizedBase}-x402`,
		`x402${normalizedBase}ai`,
		`${normalizedBase}x402ai`,
	]
	for (const suffix of SUGGESTION_FALLBACK_SUFFIXES) {
		candidates.push(`${normalizedBase}${suffix}`)
		candidates.push(`x402${normalizedBase}${suffix}`)
	}
	return candidates
}

function rankSuggestion(name: string, query: string, mode: SuggestionMode): number {
	let score = 0
	if (name === query) score += 7000
	if (mode === 'related') {
		if (name.startsWith(query)) score += 380
		if (name.includes(query)) score += 220
		if (query.startsWith(name)) score += 140
		if (name.includes('x402')) score -= 2200
		if (name.length <= 6) score += 360
		else if (name.length <= 8) score += 220
		else if (name.length <= 12) score += 100
		if (/\d/.test(name)) score -= 60
	} else {
		if (name.includes('x402')) score += 1200
		if (name.startsWith('x402')) score += 500
		if (name.includes('ai')) score += 220
		if (name.includes('agent')) score += 180
		if (name.length <= 8) score += 120
		if (name.length <= 12) score += 40
	}
	if (name.includes('-')) score -= 15
	return score
}

function finalizeSuggestions(query: string, values: string[], mode: SuggestionMode): string[] {
	const normalizedQuery = normalizeSuggestionName(query)
	const seen = new Set<string>()
	const normalized: string[] = []
	for (const candidate of values) {
		const clean = normalizeSuggestionName(candidate)
		if (mode === 'related' && clean?.includes('x402')) continue
		if (!clean || seen.has(clean)) continue
		seen.add(clean)
		normalized.push(clean)
	}
	if (!normalizedQuery) return normalized.slice(0, MAX_SUGGESTIONS)
	const sorted = normalized
		.filter((name) => !!name)
		.sort((a, b) => {
			const scoreDiff =
				rankSuggestion(b, normalizedQuery, mode) - rankSuggestion(a, normalizedQuery, mode)
			if (scoreDiff !== 0) return scoreDiff
			if (a.length !== b.length) return a.length - b.length
			return a.localeCompare(b)
		})
	if (mode === 'related') {
		const withoutQuery = sorted.filter((name) => name !== normalizedQuery)
		if (withoutQuery.length > 0) return withoutQuery.slice(0, MAX_SUGGESTIONS)
		return sorted.slice(0, MAX_SUGGESTIONS)
	}
	if (normalizedQuery.includes('x402')) return sorted.slice(0, MAX_SUGGESTIONS)
	const withoutQuery = sorted.filter((name) => name !== normalizedQuery)
	return [...withoutQuery.slice(0, MAX_SUGGESTIONS - 1), normalizedQuery]
}

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
	mode: SuggestionMode,
): Promise<string[]> {
	const contextBlock =
		braveContext.length > 0
			? `\nWeb context for "${query}":\n${braveContext.slice(0, 10).join('\n')}`
			: ''
	const strategyBlock =
		mode === 'related'
			? `- Focus on names related to "${query}" from mainstream search context
- Include many single-word premium names someone would actually pay for
- Avoid "x402" or anything that looks like x402 derivatives`
			: `- Prioritize cheap-feeling, utility-style names
- Make most suggestions include "x402" (prefix/suffix/infix)`

	const res = await fetch(OPENROUTER_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
		body: JSON.stringify({
			model: SUGGESTION_MODEL,
			max_tokens: 260,
			temperature: 0.8,
			messages: [
				{
					role: 'user',
					content: `You are a domain name suggestion engine for .sui blockchain names. A user searched: "${query}"
${contextBlock}

Suggest ${MAX_SUGGESTIONS + 8} .sui names this person would want to own. Think about:
- Synonyms and closely related concepts
- Industry/niche terms someone interested in "${query}" identifies with
- Short, brandable, memorable words
- Words that signal identity, status, or expertise in this area
${strategyBlock}

Rules: each suggestion must be 3-18 chars, lowercase a-z 0-9 and optional hyphens. Return ONLY a JSON array of strings, nothing else.`,
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
		const cleaned = normalizeSuggestionName(item)
		if (cleaned) valid.push(cleaned)
	}
	return valid
}

async function handleNameSuggestions(
	query: string,
	env: Env,
	mode: SuggestionMode = 'x402',
): Promise<Response> {
	const normalizedQueryRaw =
		normalizeSuggestionName(query) ||
		query
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '')
			.slice(0, 18)
	const normalizedQuery =
		normalizedQueryRaw.length >= 3 ? normalizedQueryRaw : mode === 'related' ? 'name' : 'x402'
	const key = `${mode}:${normalizedQuery}`
	const cached = suggestionMemCache.get(key)
	if (cached && cached.exp > Date.now()) {
		return jsonResponse({ query: normalizedQuery, mode, suggestions: cached.data })
	}

	const suggestions: string[] = [normalizedQuery]
	const seen = new Set<string>([normalizedQuery])
	const pushSuggestion = (value: string) => {
		const clean = normalizeSuggestionName(value)
		if (mode === 'related' && clean?.includes('x402')) return
		if (!clean || seen.has(clean)) return
		seen.add(clean)
		suggestions.push(clean)
	}

	if (mode === 'related') {
		for (const suffix of SUGGESTION_FALLBACK_SUFFIXES) {
			pushSuggestion(`${normalizedQuery}${suffix}`)
		}
	} else {
		for (const seed of SUGGESTION_X402_SEEDS) pushSuggestion(seed)
		for (const seed of buildX402PriorityCandidates(normalizedQuery)) pushSuggestion(seed)
	}
	for (const seed of SUGGESTION_AI_SEEDS) pushSuggestion(seed)

	const braveKey = env.BRAVE_SEARCH_API_KEY
	const aiKey = env.OPENROUTER_API_KEY

	if (aiKey) {
		try {
			const braveContext = braveKey ? await fetchBraveContext(normalizedQuery, braveKey) : []
			const aiNames = await fetchAISuggestions(normalizedQuery, braveContext, aiKey, mode)
			for (const name of aiNames) {
				pushSuggestion(name)
				if (mode === 'x402') {
					for (const derived of buildX402PriorityCandidates(name)) pushSuggestion(derived)
				}
			}
		} catch (e) {
			console.error('AI suggestion error:', e)
		}
	} else if (braveKey) {
		const braveContext = await fetchBraveContext(normalizedQuery, braveKey)
		for (const phrase of braveContext) {
			const words = phrase
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, ' ')
				.split(/\s+/)
			for (const w of words) {
				pushSuggestion(w)
				if (mode === 'x402') {
					for (const derived of buildX402PriorityCandidates(w)) pushSuggestion(derived)
				}
			}
		}
	}

	const finalized = finalizeSuggestions(normalizedQuery, suggestions, mode)

	if (suggestionMemCache.size > MAX_SUGGESTION_CACHE_SIZE) {
		const first = suggestionMemCache.keys().next().value
		if (first) suggestionMemCache.delete(first)
	}
	suggestionMemCache.set(key, { data: finalized, exp: Date.now() + SUGGESTION_CACHE_TTL_MS })
	return jsonResponse({ query: normalizedQuery, mode, suggestions: finalized })
}

interface FeaturedName {
	name: string
	marketSui: number
	registrySui: number
	premiumX: number
	source: 'listing' | 'offer'
}

const FEATURED_NAME_CANDIDATES = [
	'x402',
	'x402ai',
	'x402pay',
	'x402agent',
	'x402wallet',
	'x402app',
	'x402hub',
	'x402sdk',
	'x402kit',
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
	'aikit',
	'aiwallet',
	'agentai',
	'payai',
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

	const pinnedX402 = ranked.find((item) => item.name === 'x402') || {
		name: 'x402',
		marketSui: 0,
		registrySui: 0,
		premiumX: 9999,
		source: 'offer' as const,
	}

	const featuredPinned = [pinnedX402, ...ranked.filter((item) => item.name !== 'x402')].slice(0, 10)

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
			.dropdown-header span:nth-child(2) { text-align: right; }
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
			margin-top: 4px;
		}
		.dropdown-item .col-name .dot.available { background: #4ade80; box-shadow: 0 0 6px rgba(74, 222, 128, 0.5); }
		.dropdown-item .col-name .dot.taken {
			background: #60a5fa;
			box-shadow: 0 0 8px rgba(96, 165, 250, 0.42);
			border-radius: 2px;
		}
		.dropdown-item .col-name .dot.listed {
			background: #f7a000;
			box-shadow: 0 0 8px rgba(247, 160, 0, 0.45);
			border-radius: 0;
			clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
		}
		.dropdown-item .col-name .dot.frozen { background: #f4f4f5; box-shadow: 0 0 8px rgba(244, 244, 245, 0.45); }
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
			line-height: 1.2;
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
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			justify-content: center;
			text-align: right;
			font-size: 0.8rem;
			color: #71717a;
			font-family: 'SF Mono', 'Fira Code', monospace;
			line-height: 1.2;
			font-variant-numeric: tabular-nums;
		}
			.dropdown-item .col-price .original {
				text-decoration: line-through;
				color: #52525b;
				font-size: 0.65rem;
				display: block;
			}
			.dropdown-item .col-price .discounted { color: #4ade80; font-weight: 600; display: block; }
			.dropdown-item .col-price .listing-price { font-weight: 600; display: inline-flex; gap: 6px; align-items: baseline; }
			.dropdown-item .col-price .listing-price .value { color: #f5f5f5; }
			.dropdown-item .col-price .listing-price .unit { color: #60a5fa; }
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
			.dropdown-item .col-owner.self {
				color: #c4b5fd;
				font-weight: 600;
			}
			.dropdown-item .col-owner a {
				color: #60a5fa;
				text-decoration: none;
				transition: color 0.15s;
			}
			.dropdown-item .col-owner a.owner-self {
				color: #c4b5fd;
			}
			.dropdown-item .col-owner a:hover {
				color: #93bbfd;
				text-decoration: underline;
			}
			.dropdown-item .col-owner a.owner-self:hover {
				color: #ddd6fe;
			}
			.dropdown-item .status-text {
				font-size: 0.75rem;
				color: #71717a;
			}
		.dropdown-item .status-text.available { color: #4ade80; font-weight: 500; }
		.dropdown-item .status-text.taken { color: #a1a1aa; }
		.dropdown-item .status-text.listed { color: #c084fc; font-weight: 600; }
		.dropdown-item .status-text.frozen { color: #f5f5f5; font-weight: 700; }
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
		.dropdown-item .action-btn.register2 {
			border-radius: 999px;
			border: 1px solid rgba(0, 166, 81, 0.58);
			background: linear-gradient(135deg, rgba(14, 56, 36, 0.95), rgba(8, 42, 27, 0.96));
			box-shadow: inset 0 1px 0 rgba(0, 166, 81, 0.24), 0 0 0 1px rgba(0, 166, 81, 0.18);
			color: #82e2b3;
			font-weight: 800;
			padding: 6px 12px;
		}
		.dropdown-item .action-btn.register2:hover {
			background: linear-gradient(135deg, rgba(16, 67, 42, 0.96), rgba(9, 50, 31, 0.98));
		}
		.dropdown-item .action-btn.buy {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: #fff;
			display: inline-block;
		}
		.dropdown-item .action-btn.buy:hover { background: linear-gradient(135deg, #2563eb, #7c3aed); }
		.dropdown-item .action-btn.tradeport {
			background: rgba(247, 160, 0, 0.18);
			border: 1px solid rgba(247, 160, 0, 0.4);
			color: #f7a000;
			display: inline-block;
		}
		.dropdown-item .action-btn.tradeport:hover {
			background: rgba(247, 160, 0, 0.28);
			border-color: rgba(247, 160, 0, 0.6);
			box-shadow: 0 4px 12px rgba(247, 160, 0, 0.3);
		}
		.dropdown-item .action-btn.relist {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.1));
			border: 1px solid rgba(139, 92, 246, 0.3);
			color: #c4b5fd;
			display: inline-block;
		}
		.dropdown-item .action-btn.relist:hover {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(124, 58, 237, 0.18));
			border-color: rgba(139, 92, 246, 0.5);
			box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
		}
		.dropdown-item .action-btn.frozen {
			background: linear-gradient(135deg, #f5f5f5, #d4d4d8);
			color: #09090b;
		}
		.dropdown-item .action-btn.frozen:hover { background: linear-gradient(135deg, #ffffff, #e4e4e7); }
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
		.dropdown-item.frozen {
			background: rgba(255, 255, 255, 0.1);
			border-top: 1px solid rgba(255, 255, 255, 0.2);
			border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		}
		.dropdown-item.frozen:hover {
			background: rgba(255, 255, 255, 0.14);
		}
		.dropdown-item.frozen .col-name .label {
			color: #f5f5f5;
		}
		.dropdown-item.frozen .col-name .suffix {
			color: #d4d4d8;
		}
		.dropdown-item.frozen .col-name .name-expiry,
		.dropdown-item.frozen .col-price,
		.dropdown-item.frozen .col-owner {
			color: #e4e4e7;
		}
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
		@media (max-width: 540px) {
			.wallet-widget { top: 12px; right: 12px; }
		}

		body.search-focused .wk-dropdown { display: none !important; }

		${generateWalletUiCss()}

		@media (max-width: 540px) {
				.header { padding: 40px 16px 16px; }
				.logo { font-size: 2.5rem; }
				.search-container { padding: 10px 12px; }
			}
		</style>
</head>
<body>
	<div class="wallet-widget" id="wallet-widget">
		<button class="wallet-profile-btn" id="wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile">
			${generateLogoSvg(18)}
		</button>
		<div id="wk-widget"></div>
	</div>
	<div id="wk-modal"></div>

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
				let getWallets, getJsonRpcFullnodeUrl, SuiJsonRpcClient, Transaction;
				{
					const pickExport = (mod, name) => {
						if (!mod || typeof mod !== 'object') return undefined;
						if (name in mod) return mod[name];
						if (mod.default && typeof mod.default === 'object' && name in mod.default) {
							return mod.default[name];
						}
						return undefined;
					};
					const SDK_TIMEOUT = 15000;
					const timedImport = (url) => Promise.race([
						import(url),
						new Promise((_, r) => setTimeout(() => r(new Error('Timeout: ' + url)), SDK_TIMEOUT)),
					]);
					const results = await Promise.allSettled([
						timedImport('https://esm.sh/@wallet-standard/app@1.1.0'),
						timedImport('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle'),
						timedImport('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle'),
					]);
						if (results[0].status === 'fulfilled') ({ getWallets } = results[0].value);
						if (results[1].status === 'fulfilled') ({ getJsonRpcFullnodeUrl, SuiJsonRpcClient } = results[1].value);
						if (results[2].status === 'fulfilled') ({ Transaction } = results[2].value);
						const failed = results.filter(r => r.status === 'rejected');
						if (failed.length > 0) console.warn('SDK modules failed:', failed.map(r => r.reason?.message));
					}
				if (SuiJsonRpcClient) window.SuiJsonRpcClient = SuiJsonRpcClient;
				if (Transaction) window.Transaction = Transaction;
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

				let cachedSuiPriceUsd = null;
				let suiClient = null;
					let suinsClient = null;
				let walletDropdownRefreshTimer = null;

				function getConnectedAddress() {
					var conn = SuiWalletKit.$connection.value;
					return conn && conn.status === 'connected' ? conn.address : null;
				}

				function getViewerAddress() {
					var conn = SuiWalletKit.$connection.value;
					return conn && (conn.status === 'connected' || conn.status === 'session') ? conn.address : null;
				}

				function getConnectedPrimaryName() {
					var conn = SuiWalletKit.$connection.value;
					if (!conn || !conn.primaryName) return null;
					return String(conn.primaryName).replace(/\\.sui$/i, '');
				}

				function normalizeAddress(value) {
					var raw = String(value || '').trim().toLowerCase();
					if (!raw) return '';
					var noPrefix = raw.replace(/^0x/, '').replace(/^0+/, '');
					return '0x' + (noPrefix || '0');
				}

				function isSameAddress(left, right) {
					var a = normalizeAddress(left);
					var b = normalizeAddress(right);
					return !!a && !!b && a === b;
				}

				async function initClients() {
					if (typeof SuiJsonRpcClient !== 'function') {
						console.warn('SuiJsonRpcClient unavailable; RPC-dependent UI features disabled');
						suiClient = null;
						suinsClient = null;
						return;
					}
					suiClient = new SuiJsonRpcClient({ url: RPC_URL });
					suinsClient = null;
				}

			${generateWalletKitJs({ network: options.network || 'mainnet', autoConnect: true })}
			${generateWalletTxJs()}
			${generateWalletUiJs({ showPrimaryName: true, onConnect: 'onLandingWalletConnected', onDisconnect: 'onLandingWalletDisconnected' })}

				window.onLandingWalletConnected = function() {
					scheduleWalletDrivenDropdownRefresh();
					return undefined;
				};

				window.onLandingWalletDisconnected = function() {
					scheduleWalletDrivenDropdownRefresh();
					return undefined;
				};

					${generateSharedWalletMountJs({
						network: options.network || 'mainnet',
						session: options.session,
						onConnect: 'onLandingWalletConnected',
						onDisconnect: 'onLandingWalletDisconnected',
						profileButtonId: 'wallet-profile-btn',
						profileFallbackHref: 'https://sui.ski',
					})}

				if (typeof SuiWalletKit.subscribe === 'function' && SuiWalletKit.$connection) {
					SuiWalletKit.subscribe(SuiWalletKit.$connection, function() {
						scheduleWalletDrivenDropdownRefresh();
					});
				}

			async function executeTransaction(tx) {
				var txBytes = await tx.build({ client: suiClient });
				return SuiWalletKit.signAndExecuteFromBytes(txBytes);
			}

				initClients().catch(function(error) {
					console.warn('initClients failed:', error && error.message ? error.message : error);
					suiClient = null;
					suinsClient = null;
				});

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
			let featuredNamePool = null;
			let featuredNamePoolExp = 0;
			const FEATURED_POOL_TTL_MS = 2 * 60 * 1000;
			const FEATURED_FALLBACK = [
				'x402',
				'x402ai',
				'x402pay',
				'x402agent',
				'x402wallet',
				'x402app',
				'x402hub',
				'x402sdk',
				'x402kit',
				'aikit',
				'aiwallet',
				'agentai',
				'payai',
				'agents',
				'agent',
				'ai',
				'vault',
				'wallet',
			];
				let featuredRequestNonce = 0;

			function showDropdownLoading(message) {
				dropdown.innerHTML = '<div class="dropdown-loading">' + message + '</div>';
				dropdown.classList.add('visible');
				searchBox.classList.add('has-results');
			}

			function normalizeSuggestedName(value) {
				const clean = String(value || '')
					.toLowerCase()
					.replace(/\\.sui$/i, '')
					.replace(/[^a-z0-9-]/g, '');
				if (!clean || clean.length < 3) return null;
				return clean;
			}

			function dedupeSuggestedNames(names, limit = 18) {
				const seen = new Set();
				const list = [];
				for (const candidate of names || []) {
					const clean = normalizeSuggestedName(candidate);
					if (!clean || seen.has(clean)) continue;
					seen.add(clean);
					list.push(clean);
					if (list.length >= limit) break;
				}
				return list;
			}

			function buildLocalSuggestionFallback(query) {
				const base = normalizeSuggestedName(query) || 'name';
				const pool = [
					base,
					base + 'ai',
					base + 'app',
					base + 'hub',
					base + 'pay',
					base + 'agent',
					base + 'sdk',
					base + 'kit',
					base + 'labs',
				];
				if (!base.includes('x402')) {
					pool.push(
						'x402' + base,
						base + 'x402',
						'x402-' + base,
						base + '-x402',
						'x402' + base + 'ai',
					);
				}
				return dedupeSuggestedNames(pool, 24);
			}

			async function fetchFeaturedNamePool(force = false) {
				const now = Date.now();
				if (!force && Array.isArray(featuredNamePool) && featuredNamePool.length && featuredNamePoolExp > now) {
					return featuredNamePool;
				}
				let names = FEATURED_FALLBACK;
				try {
					const res = await fetch('/api/featured-names');
					if (res.ok) {
						const data = await res.json();
						const featured = Array.isArray(data?.names) ? data.names : [];
						const extracted = featured
							.map((item) => (item && typeof item.name === 'string' ? item.name.toLowerCase() : null))
							.filter((name) => !!name && /^[a-z0-9-]{3,}$/.test(name));
						if (extracted.length) {
							const unique = Array.from(new Set(extracted));
							names = ['x402', ...unique.filter((name) => name !== 'x402')].slice(0, 18);
						}
					}
				} catch {}
				const seeded = dedupeSuggestedNames([...names, ...FEATURED_FALLBACK], 18);
				featuredNamePool = seeded.length ? seeded : dedupeSuggestedNames(FEATURED_FALLBACK, 18);
				featuredNamePoolExp = now + FEATURED_POOL_TTL_MS;
				return featuredNamePool;
			}

			async function fetchAiSuggestions(query) {
				try {
					const res = await fetch('/api/suggest-names?q=' + encodeURIComponent(query));
					if (!res.ok) return [query];
					const data = await res.json();
					const names = Array.isArray(data?.suggestions) ? data.suggestions : [query];
					return names;
				} catch {
					return [query];
				}
			}

			async function fetchSuggestions(query) {
				const cleanQuery = normalizeSuggestedName(query) || String(query || '').toLowerCase();
				if (suggestCache.has(cleanQuery)) return suggestCache.get(cleanQuery);
				const [featuredNames, aiNames] = await Promise.all([
					fetchFeaturedNamePool(),
					fetchAiSuggestions(cleanQuery),
				]);
				const matchedFeatured = [];
				const overflowFeatured = [];
				for (const name of featuredNames || []) {
					if (name.includes(cleanQuery) || cleanQuery.includes(name)) matchedFeatured.push(name);
					else overflowFeatured.push(name);
				}
				let merged = dedupeSuggestedNames(
					[...matchedFeatured, ...aiNames, cleanQuery, ...overflowFeatured],
					18,
				);
				if (merged.length < 10) {
					const localFallback = buildLocalSuggestionFallback(cleanQuery);
					merged = dedupeSuggestedNames([...merged, ...localFallback, ...FEATURED_FALLBACK], 18);
				}
				suggestCache.set(cleanQuery, merged);
				return merged;
			}

				async function resolveOwnerName(address) {
				if (!address) return null;
				if (!suiClient || typeof suiClient.resolveNameServiceNames !== 'function') return null;
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

				function scheduleWalletDrivenDropdownRefresh() {
					if (walletDropdownRefreshTimer) {
						clearTimeout(walletDropdownRefreshTimer);
					}
					walletDropdownRefreshTimer = setTimeout(function() {
						walletDropdownRefreshTimer = null;
						refreshDropdownForWalletState();
					}, 80);
				}

				function refreshDropdownForWalletState() {
					if (!dropdown) return;
					var items = dropdown.querySelectorAll('.dropdown-item');
					if (!items || !items.length) return;
					items.forEach(function(item) {
						var name = item.dataset.name || '';
						if (!name) return;
						if (item.dataset.ownerAddress) {
							updateOwnerColumn(item, item.dataset.ownerAddress);
						}
						var cached = cache.get(name);
						if (cached) {
							updateItem(item, name, cached);
						}
						if (item.dataset.marketHasListing === '1' || item.dataset.marketHasBid === '1') {
							fetchListingPrice(item, name);
						}
					});
				}

				async function updateOwnerColumn(item, ownerAddress) {
					const ownerCol = item.querySelector('.col-owner');
					if (!ownerCol) return;
					if (!ownerAddress) {
						ownerCol.textContent = '--';
						ownerCol.classList.remove('loading');
						ownerCol.classList.remove('self');
						return;
					}
					const selfOwner = isSameAddress(ownerAddress, getViewerAddress());
					ownerCol.classList.toggle('self', selfOwner);
					ownerCol.textContent = '...';
					ownerCol.classList.add('loading');
					let shortName = selfOwner ? getConnectedPrimaryName() : null;
					if (!shortName) {
						const ownerName = await resolveOwnerName(ownerAddress);
						if (ownerName) shortName = String(ownerName).replace(/\\.sui$/i, '');
					}
					if (item.dataset.ownerAddress !== ownerAddress) return;
					if (shortName) {
						const link = document.createElement('a');
						link.href = 'https://' + encodeURIComponent(shortName) + '.sui.ski';
						link.textContent = shortName;
						link.title = ownerAddress;
						if (selfOwner) link.classList.add('owner-self');
						link.addEventListener('click', (e) => e.stopPropagation());
						ownerCol.textContent = '';
						ownerCol.appendChild(link);
					} else {
						ownerCol.textContent = ownerAddress.slice(0, 6) + '...' + ownerAddress.slice(-4);
						ownerCol.title = ownerAddress;
					}
					ownerCol.classList.remove('loading');
					ownerCol.classList.toggle('self', selfOwner);
				}

			async function showFeaturedSuggestions() {
				const nonce = ++featuredRequestNonce;
				showDropdownLoading('Loading premium names...');
				try {
					const names = await fetchFeaturedNamePool(true);
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
						+ '<div class="col-name"><span class="dot checking"></span><span class="name-meta"><span class="label">' + n + '</span><span class="name-expiry"></span></span></div>'
						+ '<div class="col-price">--</div>'
						+ '<div class="col-status"><span class="status-text">...</span></div>'
						+ '<div class="col-owner">--</div>'
						+ '</div>';
				}
				dropdown.innerHTML = html;
			dropdown.classList.add('visible');
			searchBox.classList.add('has-results');
			var checkPromises = names.map(n => checkName(n));
			Promise.allSettled(checkPromises).then(() => {
				var takenNames = [];
				for (var i = 0; i < names.length; i++) {
					var cached = cache.get(names[i]);
					if (cached && !cached.available) takenNames.push(names[i]);
				}
				if (takenNames.length === 0) return;
				fetch('/api/marketplace-batch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ names: takenNames }),
				})
				.then(function(res) { return res.ok ? res.json() : null; })
				.then(function(body) {
					if (!body || !body.results) return;
					for (var k = 0; k < takenNames.length; k++) {
						var n = takenNames[k];
						var data = body.results[n];
						if (!data) continue;
						var item = dropdown.querySelector('[data-name="' + n + '"]');
						if (item) {
							applyMarketplaceData(item, n, data);
							if (item.dataset && item.dataset.nftId) {
								fetchListingPrice(item, n);
							}
						}
					}
				})
				.catch(function() {});
			});
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

		function toPositiveNumber(value) {
			const num = typeof value === 'string' ? Number(value) : value;
			return Number.isFinite(num) && num > 0 ? num : 0;
		}

		const TRADEPORT_DISPLAY_COMMISSION_BPS = 300;

		function getTradeportListingDisplayMist(listingMistValue) {
			const listingMist = toPositiveNumber(listingMistValue);
			if (!listingMist) return 0;
			const marketFeeMist = TRADEPORT_DISPLAY_COMMISSION_BPS > 0
				? Math.ceil((listingMist * TRADEPORT_DISPLAY_COMMISSION_BPS) / 10000)
				: 0;
			return listingMist + marketFeeMist;
		}

		function formatSuiCompactFromMist(mistValue) {
			const mist = toPositiveNumber(mistValue);
			if (!mist) return '--';
			const sui = mist / 1e9;
			if (sui >= 1_000_000_000) {
				return (sui / 1_000_000_000).toFixed(1).replace(/\\.0$/, '') + 'B';
			}
			if (sui >= 1_000_000) {
				return (sui / 1_000_000).toFixed(1).replace(/\\.0$/, '') + 'M';
			}
			if (sui > 100) {
				return Math.round(sui).toLocaleString();
			}
			return sui.toFixed(1).replace(/\\.0$/, '');
		}

		function getTakenActionMarkup(name, item) {
			const ownerAddress = String(item?.dataset?.ownerAddress || '');
			const isConnectedOwner =
				!!getViewerAddress() &&
				!!ownerAddress &&
				isSameAddress(getViewerAddress(), ownerAddress);
			if (isConnectedOwner) {
				return '<a class="action-btn relist" href="https://' + encodeURIComponent(name) + '.sui.ski#marketplace-card">List</a>';
			}
			return '<a class="action-btn tradeport" href="https://' + encodeURIComponent(name) + '.sui.ski">Offer</a>';
		}

			function updateItem(item, name, result) {
					const dot = item.querySelector('.dot');
					const priceCol = item.querySelector('.col-price');
					const statusCol = item.querySelector('.col-status');
				const ownerCol = item.querySelector('.col-owner');

				item.classList.remove('frozen');
				delete item.dataset.marketHasListing;
				delete item.dataset.marketHasBid;
				delete item.dataset.referenceUsd;

				if (result.available) {
					item.dataset.available = '1';
					delete item.dataset.expirationMs;
					delete item.dataset.nftId;
					dot.className = 'dot available';
					setNameExpiry(item, null, null);
					priceCol.innerHTML = '--';
					statusCol.innerHTML = '<span class="status-text available">Available</span>';
					if (ownerCol) {
						ownerCol.innerHTML =
							'<button class="action-btn register2" data-action="register">Register</button>';
					}
					const registerBtn = ownerCol?.querySelector('.action-btn.register2');
					if (registerBtn) {
						registerBtn.onclick = (e) => {
							e.stopPropagation();
							window.location.href = 'https://' + name + '.sui.ski?register=1';
						};
					}
					fetchPricing(item, name);
					return;
				}

				item.dataset.available = '0';
				if (result.expirationMs) item.dataset.expirationMs = String(result.expirationMs);
				else delete item.dataset.expirationMs;
				if (result.nftId) item.dataset.nftId = result.nftId;
				else delete item.dataset.nftId;
				dot.className = 'dot taken';
				if (result.ownerAddress) {
					item.dataset.ownerAddress = result.ownerAddress;
					updateOwnerColumn(item, result.ownerAddress);
				} else {
					delete item.dataset.ownerAddress;
					if (ownerCol) ownerCol.textContent = '--';
				}

				delete item.dataset.expiryLabel;
				delete item.dataset.expiryColor;
				setNameExpiry(item, null, null);

					priceCol.innerHTML = '--';
					statusCol.innerHTML = getTakenActionMarkup(name, item);
					statusCol.querySelectorAll('a.action-btn').forEach((b) => b.addEventListener('click', (e) => e.stopPropagation()));
				}

			function isFrozenCandidate(item, hasListing, hasBid) {
				if (hasListing || hasBid) return false;
				const expirationMs = Number(item.dataset.expirationMs || 0);
				if (!Number.isFinite(expirationMs) || expirationMs <= 0) return false;
				const expiry = getExpiryInfo(expirationMs);
				if (!expiry) return false;
				return expiry.daysLeft > 730;
			}

			function applyFrozenTheme(item, name) {
				const dot = item.querySelector('.dot');
				const priceCol = item.querySelector('.col-price');
				const statusCol = item.querySelector('.col-status');
				item.classList.add('frozen');
				if (dot) dot.className = 'dot frozen';
				if (priceCol) priceCol.innerHTML = '<span class="listing-price">--</span>';
				if (statusCol) {
					statusCol.innerHTML =
						'<span class="status-text frozen">Frozen</span>' +
						'<a class="action-btn frozen" href="https://' + encodeURIComponent(name) + '.sui.ski">View</a>';
					statusCol.querySelectorAll('a.action-btn').forEach((b) => b.addEventListener('click', (e) => e.stopPropagation()));
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

		function applyMarketplaceData(item, name, data) {
			const dot = item.querySelector('.dot');
			const priceCol = item.querySelector('.col-price');
			const statusCol = item.querySelector('.col-status');
			const bestListingMist = toPositiveNumber(data.bestListing && data.bestListing.price);
			const bestBidMist = toPositiveNumber(data.bestBid && data.bestBid.price);
			const hasListing = bestListingMist > 0;
			const hasBid = bestBidMist > 0;
			item.dataset.marketHasListing = hasListing ? '1' : '0';
			item.dataset.marketHasBid = hasBid ? '1' : '0';

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
				if (hasListing && data.bestListing && data.bestListing.seller) {
					const listingSeller = String(data.bestListing.seller);
					item.dataset.ownerAddress = listingSeller;
					updateOwnerColumn(item, listingSeller);
				}

			if (!hasListing && !hasBid) {
				if (isFrozenCandidate(item, hasListing, hasBid)) {
					applyFrozenTheme(item, name);
				}
				return;
			}

			item.classList.remove('frozen');
			const tradeportUrl = hasListing
				? (data.bestListing.tradeportUrl || 'https://www.tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(name))
				: null;

					if (hasListing) {
						const listingDisplayMist = getTradeportListingDisplayMist(bestListingMist);
						const listingSuiValue = formatSuiCompactFromMist(listingDisplayMist);
						const listingSellerAddress = data.bestListing && data.bestListing.seller
							? String(data.bestListing.seller)
							: (item.dataset.ownerAddress || '');
						const isConnectedOwner = !!getViewerAddress() && isSameAddress(getViewerAddress(), listingSellerAddress);
						priceCol.innerHTML =
							'<span class="listing-price"><span class="value">' +
							listingSuiValue +
							'</span><span class="unit">SUI</span></span>';
						if (dot) dot.className = 'dot listed';
						if (isConnectedOwner) {
							statusCol.innerHTML =
								'<a class="action-btn relist" href="https://' + encodeURIComponent(name) + '.sui.ski#marketplace-card">Re-list</a>';
						} else if (getConnectedAddress() && item.dataset.nftId) {
								statusCol.innerHTML =
									'<button class="action-btn offer">Offer</button>' +
									'<a class="action-btn tradeport" href="https://' + encodeURIComponent(name) + '.sui.ski">Buy</a>';
						const offerBtn = statusCol.querySelector('.action-btn.offer');
						offerBtn?.addEventListener('click', (e) => { e.stopPropagation(); placeOffer(name, item); });
					} else {
							const buyBtn = '<a class="action-btn tradeport" href="https://' + encodeURIComponent(name) + '.sui.ski">Buy</a>';
						statusCol.innerHTML = buyBtn;
					}
					statusCol.querySelectorAll('a.action-btn').forEach((b) => b.addEventListener('click', (e) => e.stopPropagation()));
					return;
				}

				let priceHtml = '';
				if (hasBid) {
					priceHtml +=
						'<span class="listing-price"><span class="value">' +
						formatSuiCompactFromMist(bestBidMist) +
						'</span><span class="unit">SUI</span></span>';
					statusCol.innerHTML = getTakenActionMarkup(name, item);
					statusCol.querySelectorAll('a.action-btn').forEach((b) => b.addEventListener('click', (e) => e.stopPropagation()));
				}
				if (priceCol && priceHtml) priceCol.innerHTML = priceHtml;
			}

		async function fetchListingPrice(item, name) {
			try {
				const nftId = item?.dataset?.nftId ? String(item.dataset.nftId) : '';
				const marketplaceUrl = nftId
					? ('/api/marketplace/' + encodeURIComponent(name) + '?tokenId=' + encodeURIComponent(nftId))
					: ('/api/marketplace/' + encodeURIComponent(name));
				const res = await fetch(marketplaceUrl);
				if (!res.ok) return;
				const data = await res.json();
				applyMarketplaceData(item, name, data);
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
				const unique = [];
				const seen = new Set();
				for (const s of suggestions) {
					if (!seen.has(s)) { seen.add(s); unique.push(s); }
				}
				if (!seen.has(raw)) unique.push(raw);
				showDropdown(unique.slice(0, 18));
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
				const usdcCoins = await suiClient.getCoins({ owner: getConnectedAddress(), coinType: USDC_TYPE });
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
				tx.transferObjects([suiOut, usdcLeft, deepLeft2, suiLeftDeep, deepLeft1], tx.pure.address(getConnectedAddress()));
			}

		async function placeOffer(name, item) {
			const statusCol = item.querySelector('.col-status');
			const offerBtn = statusCol.querySelector('.action-btn.offer');
			const offerInput = item.querySelector('.offer-amount');
			let offerUsd = parseFloat(offerInput?.value || '');
			if ((!offerUsd || offerUsd <= 0) && offerInput && offerInput.placeholder && offerInput.placeholder !== '--') {
				offerUsd = parseFloat(offerInput.placeholder);
			}

			if (!getConnectedAddress()) { showOfferStatus(statusCol, 'Connect wallet', 'error'); return; }
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
					tx.setSender(getConnectedAddress());

				const suiBalance = await suiClient.getBalance({ owner: getConnectedAddress(), coinType: SUI_TYPE });
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
