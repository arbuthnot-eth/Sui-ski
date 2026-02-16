import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient } from '@mysten/suins'
import { Hono } from 'hono'
import type { Env, SuiNSRecord } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { getDeepBookSuiPools, getNSSuiPrice, getUSDCSuiPrice } from '../utils/ns-price'
import { generateLogoSvg, getDefaultOgImageUrl } from '../utils/og-image'
import { calculateRegistrationPrice, formatPricingResponse, getBasePricing } from '../utils/pricing'
import { jsonResponse } from '../utils/response'
import { getDefaultRpcUrl } from '../utils/rpc'
import { generateSharedWalletMountJs } from '../utils/shared-wallet-js'
import { renderSocialMeta } from '../utils/social'
import { getGatewayStatus } from '../utils/status'
import { generateExtensionNoiseFilter, generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'
import { generateMessagingChatCss } from '../utils/x402-chat-css'
import { generateMessagingChatJs } from '../utils/x402-chat-js'

interface LandingPageOptions {
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
				{ 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=60, max-age=30' },
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
			{ 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=60, max-age=30' },
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
		return jsonResponse(pools, 200, { 'Cache-Control': 'public, s-maxage=60, max-age=30' })
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
		return jsonResponse(formatPricingResponse(pricing), 200, {
			'Cache-Control': 'public, s-maxage=300, max-age=60',
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch renewal pricing'
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.get('/renew-quote', async (c) => {
	try {
		const env = c.get('env')
		const domain = c.req.query('domain')
		const yearsParam = c.req.query('years')

		if (!domain) return jsonResponse({ error: 'Domain parameter required' }, 400)

		const years = yearsParam ? parseInt(yearsParam, 10) : 1
		const { calculateRenewalPrice } = await import('../utils/pricing')

		const [pricing, nsPrice, pools, usdcPrice] = await Promise.all([
			calculateRenewalPrice({ domain, years, env }),
			getNSSuiPrice(env),
			getDeepBookSuiPools(env),
			getUSDCSuiPrice(env),
		])

		const nsNeededMist = pricing.nsNeededMist
		const nsTokensNeeded = Number(nsNeededMist) / 1e6
		const suiForNsSwap = nsTokensNeeded * nsPrice.suiPerNs
		const SLIPPAGE_BUFFER = 1.03
		const suiWithBuffer = suiForNsSwap * SLIPPAGE_BUFFER

		const NS_COIN_TYPE =
			'0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS'
		const SUI_COIN_TYPE =
			'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'

		const paymentOptions: Array<{
			name: string
			coinType: string
			tokensNeeded: number
			decimals: number
			suiEquivalent: number
			usdEquivalent: number
		}> = []

		paymentOptions.push({
			name: 'SUI',
			coinType: SUI_COIN_TYPE,
			tokensNeeded: suiWithBuffer,
			decimals: 9,
			suiEquivalent: suiWithBuffer,
			usdEquivalent: suiWithBuffer * usdcPrice.usdcPerSui,
		})

		for (const pool of pools) {
			if (pool.coinType === NS_COIN_TYPE || pool.coinType === SUI_COIN_TYPE) continue
			const tokensNeeded = suiWithBuffer / pool.suiPerToken
			paymentOptions.push({
				name: pool.name,
				coinType: pool.coinType,
				tokensNeeded,
				decimals: pool.decimals,
				suiEquivalent: suiWithBuffer,
				usdEquivalent: suiWithBuffer * usdcPrice.usdcPerSui,
			})
		}

		return jsonResponse(
			{
				domain,
				years,
				nsNeededMist: String(nsNeededMist),
				suiNeeded: suiWithBuffer,
				usdcPerSui: usdcPrice.usdcPerSui,
				usdNeeded: suiWithBuffer * usdcPrice.usdcPerSui,
				nsPerSui: nsPrice.nsPerSui,
				suiPerNs: nsPrice.suiPerNs,
				paymentOptions,
			},
			200,
			{ 'Cache-Control': 'public, s-maxage=60, max-age=30' },
		)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to generate renewal quote'
		return jsonResponse({ error: message }, 500)
	}
})

apiRoutes.post('/renew-tx', async (c) => {
	try {
		const env = c.get('env')
		const body = await c.req.json()
		const { domain, nftId, years, senderAddress, paymentMethod, sourceCoinType, coinObjectIds } =
			body as {
				domain: string
				nftId: string
				years: number
				senderAddress: string
				paymentMethod?: 'ns' | 'sui' | 'coin'
				sourceCoinType?: string
				coinObjectIds?: string[]
			}

		if (!domain || !nftId || !years || !senderAddress) {
			return jsonResponse(
				{ error: 'Missing required fields: domain, nftId, years, senderAddress' },
				400,
			)
		}

		const { buildSwapAndRenewTx, buildSuiRenewTx, buildMultiCoinRenewTx } = await import(
			'../utils/swap-transactions'
		)
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

		if (paymentMethod === 'coin') {
			if (!sourceCoinType || !coinObjectIds?.length) {
				return jsonResponse(
					{ error: 'paymentMethod "coin" requires sourceCoinType and coinObjectIds' },
					400,
				)
			}
			const result = await buildMultiCoinRenewTx(
				{ domain, nftId, years, senderAddress, sourceCoinType, coinObjectIds },
				env,
			)
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
					sourceCoinType: result.breakdown.sourceCoinType,
					sourceTokensNeeded: result.breakdown.sourceTokensNeeded,
				},
				method: 'coin',
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
		return jsonResponse({ price: usdcPrice.usdcPerSui, source: usdcPrice.source }, 200, {
			'Cache-Control': 'public, s-maxage=30, max-age=15',
		})
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

apiRoutes.post('/marketplace/cancel-bid', async (c) => {
	try {
		const body = await c.req.json()
		const { bidId, buyerAddress } = body as { bidId?: string; buyerAddress?: string }
		if (!bidId || !buyerAddress || !buyerAddress.startsWith('0x')) {
			return jsonResponse({ error: 'Valid bidId and buyerAddress are required' }, 400)
		}

		const TRADEPORT_MULTI_BID_PACKAGE =
			'0x63ce6caee2ba264e92bca2d160036eb297d99b2d91d4db89d48a9bffca66e55b'
		const TRADEPORT_MULTI_BID_STORE =
			'0x8aaed7e884343fb8b222c721d02eaac2c6ae2abbb4ddcdf16cb55cf8754ee860'
		const TRADEPORT_MULTI_BID_STORE_VERSION = '572206387'

		const tx = new Transaction()
		tx.setSender(buyerAddress)
		tx.setGasBudget(50_000_000)

		tx.moveCall({
			target: `${TRADEPORT_MULTI_BID_PACKAGE}::tradeport_biddings::cancel_bid`,
			arguments: [
				tx.sharedObjectRef({
					objectId: TRADEPORT_MULTI_BID_STORE,
					initialSharedVersion: TRADEPORT_MULTI_BID_STORE_VERSION,
					mutable: true,
				}),
				tx.pure.id(bidId),
				tx.pure.option('address', null),
			],
		})

		const txBytes = await tx.toJSON()
		return jsonResponse({ txBytes })
	} catch (error) {
		const message =
			error instanceof Error ? error.message : 'Failed to build cancel-bid transaction'
		console.error('Cancel bid tx error:', error)
		return jsonResponse({ error: message }, 500)
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
	const response = await handleFeaturedNames(c.get('env'))
	const headers = new Headers(response.headers)
	headers.set('Cache-Control', 'public, s-maxage=300, max-age=60')
	return new Response(response.body, { status: response.status, headers })
})

apiRoutes.get('/owned-names', async (c) => {
	const address = c.req.query('address')
	if (!address || !address.startsWith('0x')) {
		return jsonResponse({ error: 'Valid Sui address required (address query param)' }, 400)
	}
	return handleOwnedNames(address, c.get('env'))
})

apiRoutes.get('/expiring-listings', async (c) => {
	const offset = Math.max(0, parseInt(c.req.query('offset') || '0', 10) || 0)
	const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10) || 50))
	const q = String(c.req.query('q') || '')
	const modeRaw = String(c.req.query('mode') || '').toLowerCase()
	const mode: 'all' | 'grace' | 'expiring' =
		modeRaw === 'all' || modeRaw === 'expiring' ? modeRaw : 'grace'
	const graceWeight = Math.min(
		100,
		Math.max(0, parseInt(c.req.query('graceWeight') || '70', 10) || 70),
	)
	const priceWeight = Math.min(
		100,
		Math.max(0, parseInt(c.req.query('priceWeight') || '30', 10) || 30),
	)
	const minExpirationMs = Math.max(
		0,
		parseInt(c.req.query('minExpirationMs') || String(DEFAULT_MIN_EXPIRATION_MS), 10) ||
			DEFAULT_MIN_EXPIRATION_MS,
	)
	const debug = c.req.query('debug') === 'true'
	return handleExpiringListings(c.get('env'), {
		offset,
		limit,
		q,
		mode,
		graceWeight,
		priceWeight,
		minExpirationMs,
		debug,
	})
})

apiRoutes.get('/grace-feed', async (c) => {
	const offset = Math.max(0, parseInt(c.req.query('offset') || '0', 10) || 0)
	const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') || '50', 10) || 50))
	const q = String(c.req.query('q') || '')
	const statusRaw = String(c.req.query('status') || '').toLowerCase()
	const status: 'all' | 'grace' | 'expiring' =
		statusRaw === 'grace' || statusRaw === 'expiring' ? statusRaw : 'all'
	const minExpirationMs = Math.max(
		0,
		parseInt(c.req.query('minExpirationMs') || String(DEFAULT_MIN_EXPIRATION_MS), 10) ||
			DEFAULT_MIN_EXPIRATION_MS,
	)
	const windowDays = Math.min(
		3650,
		Math.max(30, parseInt(c.req.query('windowDays') || '3650', 10) || 3650),
	)
	const debug = c.req.query('debug') === 'true'
	return handleGraceFeed(c.get('env'), {
		offset,
		limit,
		q,
		status,
		minExpirationMs,
		windowDays,
		debug,
	})
})

apiRoutes.get('/grace-activity', async (c) => {
	const offset = Math.max(0, parseInt(c.req.query('offset') || '0', 10) || 0)
	const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10) || 50))
	const q = String(c.req.query('q') || '')
	const type = String(c.req.query('type') || '')
	const minBlockTimeMs = Math.max(
		0,
		parseInt(c.req.query('minBlockTimeMs') || String(DEFAULT_MIN_EXPIRATION_MS), 10) ||
			DEFAULT_MIN_EXPIRATION_MS,
	)
	return handleGraceActivity(c.get('env'), {
		offset,
		limit,
		q,
		type,
		minBlockTimeMs,
	})
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
				_or: [
					{ owner: { _eq: normalizedAddress } },
					{ claimable_by: { _eq: normalizedAddress } },
					{ delegated_owner: { _eq: normalizedAddress } },
				],
				collection: {
					_or: [{ semantic_slug: { _eq: 'suins' } }, { slug: { _eq: 'suins' } }],
				},
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
							nft: {
								collection: {
									_or: [{ semantic_slug: { _eq: 'suins' } }, { slug: { _eq: 'suins' } }],
								},
							},
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
		console.log(
			`SUMMARY after indexer: ${allNames.length} total (${ownedNames} owned, ${listedNames} listed)`,
		)

		const SUINS_V1_TYPE =
			'0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration'
		let rpcFallbackCount = 0
		try {
			let cursor: string | null | undefined = null
			let hasNext = true
			while (hasNext) {
				const page = await client.getOwnedObjects({
					owner: normalizedAddress,
					filter: { StructType: SUINS_V1_TYPE },
					options: { showContent: true },
					cursor: cursor ?? undefined,
					limit: 50,
				})
				const objects = page.data || []
				for (const obj of objects) {
					if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') continue
					const fields = obj.data.content.fields as Record<string, unknown>
					const domainName = String(fields?.domain_name || '')
					const objectId = obj.data.objectId
					if (!domainName || !objectId) continue
					if (seenNftIds.has(objectId)) continue
					const normalizedName = normalizeSuinsName(domainName)
					if (!normalizedName) continue
					seenNftIds.add(objectId)
					const rawExp = fields?.expiration_timestamp_ms
					allNames.push({
						name: normalizedName,
						nftId: objectId,
						expirationMs: rawExp ? Number(rawExp) : null,
						targetAddress: null,
						isPrimary: false,
						isListed: false,
						listingPriceMist: null,
					})
					rpcFallbackCount++
				}
				hasNext = page.hasNextPage
				cursor = page.nextCursor
			}
		} catch (rpcError) {
			console.error('RPC fallback for owned SuiNS NFTs failed:', rpcError)
		}
		if (rpcFallbackCount > 0) {
			console.log(`RPC fallback found ${rpcFallbackCount} additional names not in indexer`)
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
				...(allNames.map((n) => n.targetAddress).filter(Boolean) as string[]),
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

interface ExpiringListingEntry {
	name: string
	tokenId: string
	expirationMs: number
	daysUntilExpiry: number
	daysSinceExpiry: number
	daysUntilGraceEnds: number
	graceEndsMs: number
	priorityScore: number | null
	expired: boolean
	inGracePeriod: boolean
	price: number
	priceSui: number
	seller: string
	marketName: string
	tradeportUrl: string
	dataSource?: 'tradeport' | 'rpc'
}

interface ExpiringListingsResponse {
	listings: ExpiringListingEntry[]
	total: number
	totalUnfiltered: number
	offset: number
	limit: number
	fetchedAt: number
	windowDays: { expiringWithin: number; expiredWithin: number }
	query: {
		q: string
		mode: 'all' | 'grace' | 'expiring'
		graceWeight: number
		priceWeight: number
		minExpirationMs: number
	}
}

interface GraceFeedEntry {
	name: string
	tokenId: string
	expirationMs: number
	daysUntilExpiry: number
	daysSinceExpiry: number
	daysUntilGraceEnds: number
	expired: boolean
	inGracePeriod: boolean
	status: 'expiring' | 'grace'
	owner: string
	dataSource: 'chain_state' | 'rpc'
}

interface GraceFeedResponse {
	names: GraceFeedEntry[]
	total: number
	offset: number
	limit: number
	fetchedAt: number
	query: {
		q: string
		status: 'all' | 'grace' | 'expiring'
		minExpirationMs: number
		windowDays: number
	}
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

const NFT_ACTIVITY_CACHE_TTL = 60

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
		await setCache(activityCacheKey, activityData, NFT_ACTIVITY_CACHE_TTL)

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
		await setCache(activityCacheKey, activityData, NFT_ACTIVITY_CACHE_TTL)

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
			error instanceof Error ? error.message : 'Failed to prepare offer acceptance transaction'
		return jsonResponse({ error: message }, 500)
	}
}

const EXPIRING_WINDOW_DAYS = 90
const EXPIRED_WINDOW_DAYS = 30
const GRACE_PERIOD_DAYS = 30
const DEFAULT_MIN_EXPIRATION_MS = 1716660606618
const EXPIRING_LISTINGS_CACHE_TTL = 300
const EXPIRING_LISTINGS_PAGE_SIZE = 200
const EXPIRING_LISTINGS_MAX_PAGES = 25
const MS_PER_DAY = 86_400_000
const DEFAULT_GRACE_WEIGHT = 70
const DEFAULT_PRICE_WEIGHT = 30

const ACTIVITY_CACHE_TTL = 180
const ACTIVITY_PAGE_SIZE = 100
const ACTIVITY_MAX_PAGES = 10

interface GraceActivityEntry {
	actionId: string
	type: string
	price: number
	priceSui: number
	usdPrice: number | null
	priceCoin: string | null
	sender: string
	receiver: string
	txId: string
	blockTimeMs: number
	marketName: string
	nftTokenId: string
	nftName: string
	nftOwner: string
	tradeportUrl: string
}

interface GraceActivityOptions {
	offset: number
	limit: number
	q: string
	type: string
	minBlockTimeMs: number
}

interface GraceActivityResponse {
	actions: GraceActivityEntry[]
	total: number
	totalUnfiltered: number
	offset: number
	limit: number
	fetchedAt: number
	query: { q: string; type: string; minBlockTimeMs: number }
}

interface ExpiringListingsOptions {
	offset: number
	limit: number
	q: string
	mode: 'all' | 'grace' | 'expiring'
	graceWeight: number
	priceWeight: number
	minExpirationMs: number
	debug: boolean
}

interface GraceFeedOptions {
	offset: number
	limit: number
	q: string
	status: 'all' | 'grace' | 'expiring'
	minExpirationMs: number
	windowDays: number
	debug: boolean
}

const GRACE_FEED_CACHE_TTL = 600
const GRACE_FEED_SNAPSHOT_TTL = 21600
const GRACE_FEED_PAGE_SIZE = 300
const GRACE_FEED_MAX_PAGES = 40

function parseTimestampMs(rawValue: unknown): number | null {
	if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
		if (rawValue <= 0) return null
		if (rawValue < 1e12 && rawValue > 1e9) return Math.round(rawValue * 1000)
		return Math.round(rawValue)
	}
	if (typeof rawValue === 'string') {
		const parsed = Number(rawValue)
		if (Number.isFinite(parsed) && parsed > 0) {
			if (parsed < 1e12 && parsed > 1e9) return Math.round(parsed * 1000)
			return Math.round(parsed)
		}
		const asDate = Date.parse(rawValue)
		if (Number.isFinite(asDate) && asDate > 0) return asDate
	}
	return null
}

function extractExpirationMsFromChainState(chainState: unknown): number | null {
	const queue: unknown[] = [chainState]
	const visited = new Set<object>()
	let traversed = 0
	while (queue.length > 0 && traversed < 2000) {
		const current = queue.shift()
		traversed++
		if (!current) continue
		if (typeof current === 'string') {
			const trimmed = current.trim()
			if (
				(trimmed.startsWith('{') || trimmed.startsWith('[')) &&
				trimmed.length > 1 &&
				trimmed.length < 200_000
			) {
				try {
					queue.push(JSON.parse(trimmed))
				} catch {
					// non-json string payload
				}
			}
			continue
		}
		if (Array.isArray(current)) {
			for (let i = 0; i < current.length; i++) queue.push(current[i])
			continue
		}
		if (typeof current === 'object') {
			if (visited.has(current as object)) continue
			visited.add(current as object)
			const record = current as Record<string, unknown>
			for (const [key, value] of Object.entries(record)) {
				const keyLower = key.toLowerCase()
				if (
					keyLower === 'expiration_timestamp_ms' ||
					keyLower === 'expirationtimestampms' ||
					keyLower === 'expiration_ms' ||
					keyLower === 'expires_at'
				) {
					const parsed = parseTimestampMs(value)
					if (parsed) return parsed
				}
				queue.push(value)
			}
		}
	}
	return null
}

function hydrateGraceFeedEntries(entries: GraceFeedEntry[], now: number): GraceFeedEntry[] {
	const gracePeriodMs = GRACE_PERIOD_DAYS * MS_PER_DAY
	const hydrated: GraceFeedEntry[] = []
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]
		const expirationMs = Number(entry.expirationMs || 0)
		if (!Number.isFinite(expirationMs) || expirationMs <= 0) continue
		if (expirationMs < now - gracePeriodMs) continue
		const expired = expirationMs < now
		const graceEndsMs = expirationMs + gracePeriodMs
		const inGracePeriod = expired && graceEndsMs > now
		const daysUntilExpiry = Math.round(((expirationMs - now) / MS_PER_DAY) * 10) / 10
		const daysSinceExpiry = expired ? Math.round(((now - expirationMs) / MS_PER_DAY) * 10) / 10 : 0
		const daysUntilGraceEnds = inGracePeriod
			? Math.round(((graceEndsMs - now) / MS_PER_DAY) * 10) / 10
			: GRACE_PERIOD_DAYS
		hydrated.push({
			...entry,
			daysUntilExpiry,
			daysSinceExpiry,
			daysUntilGraceEnds,
			expired,
			inGracePeriod,
			status: inGracePeriod ? 'grace' : 'expiring',
		})
	}
	hydrated.sort((a, b) => a.expirationMs - b.expirationMs)
	return hydrated
}

function filterGraceFeed(
	entries: GraceFeedEntry[],
	q: string,
	status: 'all' | 'grace' | 'expiring',
	windowDays: number,
	now: number,
): GraceFeedEntry[] {
	const query = q.trim().toLowerCase()
	const windowEndMs = now + windowDays * MS_PER_DAY
	const normalizedQueryName = normalizeSearchName(query)
	const filtered: GraceFeedEntry[] = []
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]
		if (entry.expirationMs > windowEndMs) continue
		if (status === 'grace' && !entry.inGracePeriod) continue
		if (status === 'expiring' && entry.expired) continue
		if (!query) {
			filtered.push(entry)
			continue
		}
		const name = entry.name.toLowerCase()
		const tokenId = entry.tokenId.toLowerCase()
		const owner = entry.owner.toLowerCase()
		const normalizedMatches = normalizedQueryName
			? name.includes(normalizedQueryName) || name.includes(`${normalizedQueryName}.sui`)
			: false
		if (
			!name.includes(query) &&
			!tokenId.includes(query) &&
			!owner.includes(query) &&
			!normalizedMatches
		)
			continue
		filtered.push(entry)
	}
	return filtered
}

async function handleGraceFeed(env: Env, options: GraceFeedOptions): Promise<Response> {
	const { offset, limit, q, status, minExpirationMs, windowDays, debug } = options
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
		'Cache-Control': 'no-store, max-age=0',
	}
	const now = Date.now()
	const gracePeriodMs = GRACE_PERIOD_DAYS * MS_PER_DAY
	const sourceCacheKey = cacheKey('grace-feed-source-v2', env.SUI_NETWORK, String(minExpirationMs))
	const snapshotCacheKey = cacheKey('grace-feed-snapshot-v2', env.SUI_NETWORK)
	const cached = debug ? null : await getCached<GraceFeedEntry[]>(sourceCacheKey)
	if (cached) {
		const hydrated = hydrateGraceFeedEntries(cached, now)
		let filtered = filterGraceFeed(hydrated, q, status, windowDays, now)
		if (q && filtered.length === 0) {
			const fallback = await resolveGraceFeedSearchEntry(q, env, now, minExpirationMs)
			if (fallback) {
				const fallbackHydrated = hydrateGraceFeedEntries([fallback], now)
				const fallbackFiltered = filterGraceFeed(fallbackHydrated, q, status, windowDays, now)
				if (fallbackFiltered.length > 0) {
					filtered = fallbackFiltered
				}
			}
		}
		const payload: GraceFeedResponse = {
			names: filtered.slice(offset, offset + limit),
			total: filtered.length,
			offset,
			limit,
			fetchedAt: now,
			query: { q, status, minExpirationMs, windowDays },
		}
		return new Response(JSON.stringify(payload), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'HIT' },
		})
	}

	try {
		type IndexerNft = {
			tokenId: string
			name: string
			owner: string
			chainState: unknown
		}
		const nfts: IndexerNft[] = []
		const gqlErrors: string[] = []
		const queryRegistrations = `query FetchSuinsRegistrations($where: nfts_bool_exp, $offset: Int, $limit: Int!) {
			sui {
				nfts(where: $where, order_by: [{token_id: asc}], offset: $offset, limit: $limit) {
					token_id
					name
					owner
					chain_state
				}
			}
		}`
		const where = {
			collection_id: { _eq: SUINS_COLLECTION_ID },
		}

		for (let page = 0; page < GRACE_FEED_MAX_PAGES; page++) {
			const pageOffset = page * GRACE_FEED_PAGE_SIZE
			const response = await fetch(INDEXER_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-user': INDEXER_API_USER,
					'x-api-key': env.INDEXER_API_KEY || '',
				},
				body: JSON.stringify({
					query: queryRegistrations,
					variables: { where, offset: pageOffset, limit: GRACE_FEED_PAGE_SIZE },
				}),
			})
			if (!response.ok) break
			const result = (await response.json()) as {
				data?: {
					sui?: {
						nfts?: Array<{
							token_id?: string
							name?: string
							owner?: string
							chain_state?: unknown
						}>
					}
				}
				errors?: Array<{ message?: string }>
			}
			if (result.errors && result.errors.length > 0) {
				gqlErrors.push(result.errors[0]?.message || 'Unknown GraphQL error')
				break
			}
			const pageNfts = result.data?.sui?.nfts || []
			if (pageNfts.length === 0) break
			for (let i = 0; i < pageNfts.length; i++) {
				const nft = pageNfts[i]
				if (!nft.token_id || !nft.name) continue
				nfts.push({
					tokenId: nft.token_id,
					name: nft.name.endsWith('.sui') ? nft.name : `${nft.name}.sui`,
					owner: String(nft.owner || ''),
					chainState: nft.chain_state,
				})
			}
			if (pageNfts.length < GRACE_FEED_PAGE_SIZE) break
		}

		const expirationMap = new Map<string, { expirationMs: number; source: 'chain_state' | 'rpc' }>()
		const missingIds: string[] = []
		for (let i = 0; i < nfts.length; i++) {
			const parsed = extractExpirationMsFromChainState(nfts[i].chainState)
			if (parsed && parsed > 0) {
				expirationMap.set(nfts[i].tokenId, { expirationMs: parsed, source: 'chain_state' })
			} else {
				missingIds.push(nfts[i].tokenId)
			}
		}

		if (missingIds.length > 0) {
			const client = new SuiClient({
				url: getDefaultRpcUrl(env.SUI_NETWORK),
				network: env.SUI_NETWORK,
			})
			const RPC_BATCH_SIZE = 50
			for (let i = 0; i < missingIds.length; i += RPC_BATCH_SIZE) {
				const ids = missingIds.slice(i, i + RPC_BATCH_SIZE)
				try {
					const objects = await client.multiGetObjects({
						ids,
						options: { showContent: true },
					})
					for (let j = 0; j < objects.length; j++) {
						const obj = objects[j]
						const fields = (obj.data?.content as { fields?: Record<string, unknown> })?.fields
						if (!fields) continue
						const expMs = Number(
							fields.expiration_timestamp_ms ?? fields.expirationTimestampMs ?? 0,
						)
						if (expMs > 0) {
							expirationMap.set(ids[j], { expirationMs: expMs, source: 'rpc' })
						}
					}
				} catch {
					// continue
				}
			}
		}

		const entries: GraceFeedEntry[] = []
		let chainStateCount = 0
		let rpcCount = 0
		for (let i = 0; i < nfts.length; i++) {
			const nft = nfts[i]
			const resolved = expirationMap.get(nft.tokenId)
			if (!resolved) continue
			const expirationMs = resolved.expirationMs
			if (expirationMs < minExpirationMs) continue
			if (expirationMs < now - gracePeriodMs) continue
			if (resolved.source === 'chain_state') chainStateCount++
			else rpcCount++
			entries.push({
				name: nft.name,
				tokenId: nft.tokenId,
				expirationMs,
				daysUntilExpiry: 0,
				daysSinceExpiry: 0,
				daysUntilGraceEnds: GRACE_PERIOD_DAYS,
				expired: false,
				inGracePeriod: false,
				status: 'expiring',
				owner: nft.owner,
				dataSource: resolved.source,
			})
		}

		const snapshotCached = debug ? null : await getCached<GraceFeedEntry[]>(snapshotCacheKey)
		const mergedByTokenId = new Map<string, GraceFeedEntry>()
		if (snapshotCached) {
			for (let i = 0; i < snapshotCached.length; i++) {
				const snap = snapshotCached[i]
				if (!snap?.tokenId || !snap?.expirationMs) continue
				if (snap.expirationMs < minExpirationMs) continue
				if (snap.expirationMs < now - gracePeriodMs) continue
				mergedByTokenId.set(snap.tokenId, snap)
			}
		}
		for (let i = 0; i < entries.length; i++) {
			mergedByTokenId.set(entries[i].tokenId, entries[i])
		}
		const mergedEntries = Array.from(mergedByTokenId.values())
		mergedEntries.sort((a, b) => a.expirationMs - b.expirationMs)
		const hydratedEntries = hydrateGraceFeedEntries(mergedEntries, now)
		if (!debug) {
			await Promise.all([
				setCache(sourceCacheKey, hydratedEntries, GRACE_FEED_CACHE_TTL),
				setCache(snapshotCacheKey, hydratedEntries, GRACE_FEED_SNAPSHOT_TTL),
			])
		}
		let filtered = filterGraceFeed(hydratedEntries, q, status, windowDays, now)
		if (q && filtered.length === 0) {
			const fallback = await resolveGraceFeedSearchEntry(q, env, now, minExpirationMs)
			if (fallback) {
				const fallbackHydrated = hydrateGraceFeedEntries([fallback], now)
				const fallbackFiltered = filterGraceFeed(fallbackHydrated, q, status, windowDays, now)
				if (fallbackFiltered.length > 0) {
					filtered = fallbackFiltered
				}
			}
		}
		const responseBody: Record<string, unknown> = {
			names: filtered.slice(offset, offset + limit),
			total: filtered.length,
			offset,
			limit,
			fetchedAt: now,
			query: { q, status, minExpirationMs, windowDays },
		}
		if (debug) {
			responseBody.debug = {
				totalRegistrationsScanned: nfts.length,
				snapshotSize: snapshotCached?.length || 0,
				trackedTotal: hydratedEntries.length,
				chainStateCount,
				rpcCount,
				gqlErrors: gqlErrors.slice(0, 3),
			}
		}
		return new Response(JSON.stringify(responseBody), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'MISS' },
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build grace feed'
		return new Response(JSON.stringify({ error: message, names: [] }), {
			status: 200,
			headers: corsHeaders,
		})
	}
}

function filterExpiringListings(
	entries: ExpiringListingEntry[],
	q: string,
	mode: 'all' | 'grace' | 'expiring',
	graceWeightPct: number,
	priceWeightPct: number,
): ExpiringListingEntry[] {
	const query = q.trim().toLowerCase()
	const normalizedQueryName = normalizeSearchName(query)
	const filtered: ExpiringListingEntry[] = []
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]
		if (mode === 'grace' && !entry.inGracePeriod) continue
		if (mode === 'expiring' && entry.expired) continue
		if (query.length > 0) {
			const name = entry.name.toLowerCase()
			const tokenId = entry.tokenId.toLowerCase()
			const seller = entry.seller.toLowerCase()
			const normalizedMatches = normalizedQueryName
				? name.includes(normalizedQueryName) || name.includes(`${normalizedQueryName}.sui`)
				: false
			if (
				!name.includes(query) &&
				!tokenId.includes(query) &&
				!seller.includes(query) &&
				!normalizedMatches
			)
				continue
		}
		filtered.push(entry)
	}

	if (mode === 'grace') {
		let minPrice = Number.POSITIVE_INFINITY
		let maxPrice = 0
		for (let i = 0; i < filtered.length; i++) {
			const price = Number(filtered[i].price || 0)
			if (price < minPrice) minPrice = price
			if (price > maxPrice) maxPrice = price
		}
		if (!Number.isFinite(minPrice)) minPrice = 0
		const priceSpread = maxPrice - minPrice
		let graceWeight = Math.min(100, Math.max(0, graceWeightPct)) / 100
		let priceWeight = Math.min(100, Math.max(0, priceWeightPct)) / 100
		const weightSum = graceWeight + priceWeight
		if (weightSum <= 0) {
			graceWeight = DEFAULT_GRACE_WEIGHT / 100
			priceWeight = DEFAULT_PRICE_WEIGHT / 100
		} else {
			graceWeight /= weightSum
			priceWeight /= weightSum
		}

		const ranked: ExpiringListingEntry[] = []
		for (let i = 0; i < filtered.length; i++) {
			const entry = filtered[i]
			const graceRatioRaw = 1 - entry.daysUntilGraceEnds / GRACE_PERIOD_DAYS
			const graceUrgency = Math.max(0, Math.min(1, graceRatioRaw))
			const priceValue =
				priceSpread > 0 ? Math.max(0, Math.min(1, (maxPrice - entry.price) / priceSpread)) : 1
			const score = graceUrgency * graceWeight + priceValue * priceWeight
			ranked.push({
				...entry,
				priorityScore: Math.round(score * 1000) / 1000,
			})
		}

		ranked.sort(
			(a, b) =>
				(b.priorityScore || 0) - (a.priorityScore || 0) ||
				a.daysUntilGraceEnds - b.daysUntilGraceEnds ||
				a.price - b.price,
		)
		return ranked
	}
	if (mode === 'expiring') {
		filtered.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry || a.price - b.price)
		return filtered
	}
	return filtered
}

function normalizeSearchName(rawValue: string): string | null {
	let value = String(rawValue || '')
		.trim()
		.toLowerCase()
	if (!value) return null
	value = value.replace(/^https?:\/\//, '')
	value = value.replace(/\/.*$/, '')
	if (value.endsWith('.sui.ski')) value = value.slice(0, -8)
	if (value.endsWith('.sui')) value = value.slice(0, -4)
	if (value.includes('.')) value = value.split('.')[0]
	value = value
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 48)
	return value || null
}

async function resolveGraceFeedSearchEntry(
	q: string,
	env: Env,
	now: number,
	minExpirationMs: number,
): Promise<GraceFeedEntry | null> {
	const name = normalizeSearchName(q)
	if (!name) return null
	try {
		const { resolveSuiNS } = await import('../resolvers/suins')
		const resolved = await resolveSuiNS(name, env)
		if (!resolved.found || !resolved.data) return null
		const record = resolved.data as SuiNSRecord & { expirationTimestampMs?: string }
		const expirationMs = Number(record.expirationTimestampMs || 0)
		if (!Number.isFinite(expirationMs) || expirationMs <= 0) return null
		if (expirationMs < minExpirationMs) return null
		if (expirationMs < now - GRACE_PERIOD_DAYS * MS_PER_DAY) return null
		const cleanName = name.endsWith('.sui') ? name : `${name}.sui`
		return {
			name: cleanName,
			tokenId: record.nftId || cleanName,
			expirationMs,
			daysUntilExpiry: 0,
			daysSinceExpiry: 0,
			daysUntilGraceEnds: GRACE_PERIOD_DAYS,
			expired: false,
			inGracePeriod: false,
			status: 'expiring',
			owner: record.ownerAddress || record.address || '',
			dataSource: 'rpc',
		}
	} catch {
		return null
	}
}

async function resolveRpcSearchEntry(
	q: string,
	env: Env,
	now: number,
	minExpirationMs: number,
	gracePeriodMs: number,
): Promise<ExpiringListingEntry | null> {
	const name = normalizeSearchName(q)
	if (!name) return null
	try {
		const { resolveSuiNS } = await import('../resolvers/suins')
		const resolved = await resolveSuiNS(name, env)
		if (!resolved.found || !resolved.data) return null
		const record = resolved.data as SuiNSRecord & { expirationTimestampMs?: string }
		const expirationMs = Number(record.expirationTimestampMs || 0)
		if (!Number.isFinite(expirationMs) || expirationMs <= 0) return null
		if (expirationMs < minExpirationMs) return null

		const graceEndsMs = expirationMs + gracePeriodMs
		const expired = expirationMs < now
		const inGracePeriod = expired && graceEndsMs > now
		if (expired && graceEndsMs <= now) return null
		const daysUntilExpiry = (expirationMs - now) / MS_PER_DAY
		const cleanName = name.endsWith('.sui') ? name : `${name}.sui`
		return {
			name: cleanName,
			tokenId: record.nftId || cleanName,
			expirationMs,
			daysUntilExpiry: Math.round(daysUntilExpiry * 10) / 10,
			daysSinceExpiry: expired ? Math.round(((now - expirationMs) / MS_PER_DAY) * 10) / 10 : 0,
			daysUntilGraceEnds: expired
				? Math.round(((graceEndsMs - now) / MS_PER_DAY) * 10) / 10
				: GRACE_PERIOD_DAYS,
			graceEndsMs,
			priorityScore: null,
			expired,
			inGracePeriod,
			price: 0,
			priceSui: 0,
			seller: record.ownerAddress || record.address || '',
			marketName: 'rpc',
			tradeportUrl: `https://www.tradeport.xyz/sui/collection/suins?search=${encodeURIComponent(cleanName.replace(/\.sui$/i, ''))}`,
			dataSource: 'rpc',
		}
	} catch {
		return null
	}
}

async function handleExpiringListings(
	env: Env,
	options: ExpiringListingsOptions,
): Promise<Response> {
	const { offset, limit, q, mode, graceWeight, priceWeight, minExpirationMs, debug } = options
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	const fullCacheKey = cacheKey('expiring-listings', env.SUI_NETWORK, String(minExpirationMs))
	const cached = debug ? null : await getCached<ExpiringListingEntry[]>(fullCacheKey)
	if (cached) {
		const filtered = filterExpiringListings(cached, q, mode, graceWeight, priceWeight)
		const slice = filtered.slice(offset, offset + limit)
		const response: ExpiringListingsResponse = {
			listings: slice,
			total: filtered.length,
			totalUnfiltered: cached.length,
			offset,
			limit,
			fetchedAt: Date.now(),
			windowDays: { expiringWithin: EXPIRING_WINDOW_DAYS, expiredWithin: EXPIRED_WINDOW_DAYS },
			query: { q, mode, graceWeight, priceWeight, minExpirationMs },
		}
		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'HIT', 'Cache-Control': 'no-store, max-age=0' },
		})
	}

	try {
		const now = Date.now()
		const expiringCutoff = now + EXPIRING_WINDOW_DAYS * MS_PER_DAY
		const expiredCutoff = now - EXPIRED_WINDOW_DAYS * MS_PER_DAY
		const gracePeriodMs = GRACE_PERIOD_DAYS * MS_PER_DAY

		const queryWithExpiresAt = `query FetchExpiringListings($where: listings_bool_exp, $offset: Int, $limit: Int!) {
			sui {
				listings(where: $where, order_by: [{price: asc}], offset: $offset, limit: $limit) {
					price
					seller
					market_name
					expires_at
					block_time
					nft {
						name
						token_id
					}
				}
			}
		}`
		const queryWithBlockTimeOnly = `query FetchExpiringListings($where: listings_bool_exp, $offset: Int, $limit: Int!) {
			sui {
				listings(where: $where, order_by: [{price: asc}], offset: $offset, limit: $limit) {
					price
					seller
					market_name
					block_time
					nft {
						name
						token_id
					}
				}
			}
		}`

		const where = {
			listed: { _eq: true },
			nft: {
				collection: {
					_or: [{ semantic_slug: { _eq: 'suins' } }, { slug: { _eq: 'suins' } }],
				},
			},
		}

		interface IndexerListing {
			price: number
			seller: string
			marketName: string
			expiresAtMs: number
			timeSource: 'expires_at' | 'block_time'
			name: string
			tokenId: string
		}

		const allListings: IndexerListing[] = []
		let queryVariant: 'expires_at' | 'block_time' = 'expires_at'
		const graphqlErrors: string[] = []

		for (let page = 0; page < EXPIRING_LISTINGS_MAX_PAGES; page++) {
			const pageOffset = page * EXPIRING_LISTINGS_PAGE_SIZE
			let response = await fetch(INDEXER_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-user': INDEXER_API_USER,
					'x-api-key': env.INDEXER_API_KEY || '',
				},
				body: JSON.stringify({
					query: queryVariant === 'expires_at' ? queryWithExpiresAt : queryWithBlockTimeOnly,
					variables: { where, offset: pageOffset, limit: EXPIRING_LISTINGS_PAGE_SIZE },
				}),
			})

			if (!response.ok) {
				console.error(`Expiring listings page ${page} failed: ${response.status}`)
				break
			}

			let result = (await response.json()) as {
				data?: {
					sui?: {
						listings?: Array<{
							price: number
							seller: string
							market_name?: string
							expires_at?: string
							block_time?: string
							nft?: { name?: string; token_id?: string }
						}>
					}
				}
				errors?: Array<{ message: string }>
			}

			if (result.errors && result.errors.length > 0) {
				graphqlErrors.push(result.errors[0]?.message || 'Unknown GraphQL error')
				if (queryVariant === 'expires_at') {
					queryVariant = 'block_time'
					response = await fetch(INDEXER_API_URL, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-api-user': INDEXER_API_USER,
							'x-api-key': env.INDEXER_API_KEY || '',
						},
						body: JSON.stringify({
							query: queryWithBlockTimeOnly,
							variables: { where, offset: pageOffset, limit: EXPIRING_LISTINGS_PAGE_SIZE },
						}),
					})
					if (!response.ok) break
					result = (await response.json()) as typeof result
					if (result.errors && result.errors.length > 0) {
						graphqlErrors.push(result.errors[0]?.message || 'Unknown GraphQL error')
						break
					}
				} else {
					break
				}
			}

			const listings = result.data?.sui?.listings
			if (!listings || listings.length === 0) break

			for (let i = 0; i < listings.length; i++) {
				const l = listings[i]
				if (!l.nft?.token_id || !l.nft.name) continue
				const expiresAtMs = l.expires_at ? Date.parse(l.expires_at) : NaN
				const blockTimeMs = l.block_time ? Date.parse(l.block_time) : NaN
				const hasExpiresAt = Number.isFinite(expiresAtMs)
				const hasBlockTime = Number.isFinite(blockTimeMs)
				if (!hasExpiresAt && !hasBlockTime) continue
				const effectiveMs = hasExpiresAt ? expiresAtMs : blockTimeMs
				if (effectiveMs < minExpirationMs) continue
				allListings.push({
					price: l.price,
					seller: l.seller,
					marketName: l.market_name || 'tradeport',
					expiresAtMs: effectiveMs,
					timeSource: hasExpiresAt ? 'expires_at' : 'block_time',
					name: l.nft.name,
					tokenId: l.nft.token_id,
				})
			}

			if (listings.length < EXPIRING_LISTINGS_PAGE_SIZE) break
		}

		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})

		const RPC_BATCH_SIZE = 50
		const expirationMap = new Map<string, number>()

		for (let i = 0; i < allListings.length; i += RPC_BATCH_SIZE) {
			const batch = allListings.slice(i, i + RPC_BATCH_SIZE)
			const ids = batch.map((l) => l.tokenId)
			try {
				const objects = await client.multiGetObjects({
					ids,
					options: { showContent: true },
				})
				for (let j = 0; j < objects.length; j++) {
					const obj = objects[j]
					const fields = (obj.data?.content as { fields?: Record<string, unknown> })?.fields
					if (!fields) continue
					const expMs = Number(fields.expiration_timestamp_ms ?? fields.expirationTimestampMs ?? 0)
					if (expMs > 0) expirationMap.set(ids[j], expMs)
				}
			} catch (rpcErr) {
				console.error(`RPC batch fetch failed at offset ${i}:`, rpcErr)
			}
		}

		const allEntries: ExpiringListingEntry[] = []
		let sourceExpiresAtCount = 0
		let sourceBlockTimeFallbackCount = 0
		let rpcSearchIncluded = false
		let rpcSearchName: string | null = null

		for (let i = 0; i < allListings.length; i++) {
			const listing = allListings[i]
			if (listing.timeSource === 'expires_at') sourceExpiresAtCount++
			else sourceBlockTimeFallbackCount++
			const expirationMs = expirationMap.get(listing.tokenId)
			if (!expirationMs) continue
			if (expirationMs < minExpirationMs) continue
			if (expirationMs > expiringCutoff || expirationMs < expiredCutoff) continue

			const daysUntilExpiry = (expirationMs - now) / MS_PER_DAY
			const expired = expirationMs < now
			const graceEndsMs = expirationMs + gracePeriodMs
			const inGracePeriod = expired && graceEndsMs > now
			const expiredBeyondGrace = expired && graceEndsMs <= now
			if (expiredBeyondGrace) continue
			const name = listing.name.endsWith('.sui') ? listing.name : `${listing.name}.sui`
			const tradeportUrl = `https://www.tradeport.xyz/sui/collection/suins/${listing.tokenId}`

			allEntries.push({
				name,
				tokenId: listing.tokenId,
				expirationMs,
				daysUntilExpiry: Math.round(daysUntilExpiry * 10) / 10,
				daysSinceExpiry: expired ? Math.round(((now - expirationMs) / MS_PER_DAY) * 10) / 10 : 0,
				daysUntilGraceEnds: expired
					? Math.round(((graceEndsMs - now) / MS_PER_DAY) * 10) / 10
					: GRACE_PERIOD_DAYS,
				graceEndsMs,
				priorityScore: null,
				expired,
				inGracePeriod,
				price: listing.price,
				priceSui: listing.price / 1e9,
				seller: listing.seller,
				marketName: listing.marketName,
				tradeportUrl,
				dataSource: 'tradeport',
			})
		}

		if (q.trim().length > 0) {
			const rpcEntry = await resolveRpcSearchEntry(q, env, now, minExpirationMs, gracePeriodMs)
			if (rpcEntry) {
				rpcSearchName = rpcEntry.name
				const alreadyExists = allEntries.some(
					(entry) => entry.tokenId === rpcEntry.tokenId || entry.name === rpcEntry.name,
				)
				if (!alreadyExists) {
					allEntries.push(rpcEntry)
					rpcSearchIncluded = true
				}
			}
		}

		allEntries.sort((a, b) => a.expirationMs - b.expirationMs)

		if (!debug) {
			await setCache(fullCacheKey, allEntries, EXPIRING_LISTINGS_CACHE_TTL)
		}

		const filtered = filterExpiringListings(allEntries, q, mode, graceWeight, priceWeight)
		const slice = filtered.slice(offset, offset + limit)
		const responseBody: Record<string, unknown> = {
			listings: slice,
			total: filtered.length,
			totalUnfiltered: allEntries.length,
			offset,
			limit,
			fetchedAt: now,
			windowDays: { expiringWithin: EXPIRING_WINDOW_DAYS, expiredWithin: EXPIRED_WINDOW_DAYS },
			query: { q, mode, graceWeight, priceWeight, minExpirationMs },
		}
		if (debug) {
			responseBody.debug = {
				queryVariant,
				graphqlErrors: graphqlErrors.slice(0, 3),
				totalIndexerListings: allListings.length,
				sourceExpiresAtCount,
				sourceBlockTimeFallbackCount,
				rpcSearchName,
				rpcSearchIncluded,
				totalWithExpiration: expirationMap.size,
				totalMatching: allEntries.length,
			}
		}
		return new Response(JSON.stringify(responseBody), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'MISS', 'Cache-Control': 'no-store, max-age=0' },
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch expiring listings'
		return new Response(JSON.stringify({ error: message, listings: [] }), {
			status: 200,
			headers: { ...corsHeaders, 'Cache-Control': 'no-store, max-age=0' },
		})
	}
}

async function handleGraceActivity(env: Env, options: GraceActivityOptions): Promise<Response> {
	const { offset, limit, q, type: activityType, minBlockTimeMs } = options
	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/json',
	}

	const fullCacheKey = cacheKey('grace-activity', env.SUI_NETWORK, String(minBlockTimeMs))
	const cached = await getCached<GraceActivityEntry[]>(fullCacheKey)
	if (cached) {
		const filtered = filterGraceActivity(cached, q, activityType)
		const slice = filtered.slice(offset, offset + limit)
		const response: GraceActivityResponse = {
			actions: slice,
			total: filtered.length,
			totalUnfiltered: cached.length,
			offset,
			limit,
			fetchedAt: Date.now(),
			query: { q, type: activityType, minBlockTimeMs },
		}
		return new Response(JSON.stringify(response), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'HIT', 'Cache-Control': 'no-store, max-age=0' },
		})
	}

	try {
		const minBlockTimeIso = new Date(minBlockTimeMs).toISOString()
		const activityQuery = `query FetchCollectionActivity($where: recent_actions_bool_exp, $offset: Int, $limit: Int!) {
			sui {
				recent_actions(where: $where, order_by: [{block_time: desc}], offset: $offset, limit: $limit) {
					action_id
					action_type
					price
					usd_price
					price_coin
					seller
					buyer
					tx_id
					block_time
					market_name
					nft {
						name
						token_id
						owner
					}
				}
			}
		}`

		const where = {
			nft: {
				collection: {
					_or: [{ semantic_slug: { _eq: 'suins' } }, { slug: { _eq: 'suins' } }],
				},
			},
			block_time: { _gte: minBlockTimeIso },
		}

		const allActions: GraceActivityEntry[] = []

		for (let page = 0; page < ACTIVITY_MAX_PAGES; page++) {
			const pageOffset = page * ACTIVITY_PAGE_SIZE
			const response = await fetch(INDEXER_API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-user': INDEXER_API_USER,
					'x-api-key': env.INDEXER_API_KEY || '',
				},
				body: JSON.stringify({
					query: activityQuery,
					variables: { where, offset: pageOffset, limit: ACTIVITY_PAGE_SIZE },
				}),
			})

			if (!response.ok) break

			const result = (await response.json()) as {
				data?: {
					sui?: {
						recent_actions?: Array<{
							action_id?: string
							action_type?: string
							price?: number
							usd_price?: number
							price_coin?: string
							seller?: string
							buyer?: string
							tx_id?: string
							block_time?: string
							market_name?: string
							nft?: { name?: string; token_id?: string; owner?: string }
						}>
					}
				}
				errors?: Array<{ message: string }>
			}

			if (result.errors && result.errors.length > 0) break

			const actions = result.data?.sui?.recent_actions
			if (!actions || actions.length === 0) break

			for (let i = 0; i < actions.length; i++) {
				const a = actions[i]
				if (!a.nft?.token_id) continue
				const blockTimeMs = a.block_time ? Date.parse(a.block_time) : 0
				const price = Number(a.price || 0)
				const nftName = a.nft.name || a.nft.token_id
				allActions.push({
					actionId: a.action_id || `${a.tx_id || ''}-${i}`,
					type: (a.action_type || 'unknown').toLowerCase(),
					price,
					priceSui: price / 1e9,
					usdPrice: a.usd_price ?? null,
					priceCoin: a.price_coin ?? null,
					sender: a.seller || '',
					receiver: a.buyer || '',
					txId: a.tx_id || '',
					blockTimeMs,
					marketName: a.market_name || 'unknown',
					nftTokenId: a.nft.token_id,
					nftName,
					nftOwner: a.nft.owner || '',
					tradeportUrl: `https://www.tradeport.xyz/sui/collection/suins/${a.nft.token_id}`,
				})
			}

			if (actions.length < ACTIVITY_PAGE_SIZE) break
		}

		await setCache(fullCacheKey, allActions, ACTIVITY_CACHE_TTL)

		const filtered = filterGraceActivity(allActions, q, activityType)
		const slice = filtered.slice(offset, offset + limit)
		const responseBody: GraceActivityResponse = {
			actions: slice,
			total: filtered.length,
			totalUnfiltered: allActions.length,
			offset,
			limit,
			fetchedAt: Date.now(),
			query: { q, type: activityType, minBlockTimeMs },
		}
		return new Response(JSON.stringify(responseBody), {
			status: 200,
			headers: { ...corsHeaders, 'X-Cache': 'MISS', 'Cache-Control': 'no-store, max-age=0' },
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch collection activity'
		return new Response(JSON.stringify({ error: message, actions: [] }), {
			status: 200,
			headers: { ...corsHeaders, 'Cache-Control': 'no-store, max-age=0' },
		})
	}
}

function filterGraceActivity(
	entries: GraceActivityEntry[],
	q: string,
	activityType: string,
): GraceActivityEntry[] {
	const query = q.trim().toLowerCase()
	const typeFilter = activityType.trim().toLowerCase()
	const filtered: GraceActivityEntry[] = []
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]
		if (typeFilter && entry.type !== typeFilter) continue
		if (query.length > 0) {
			const name = entry.nftName.toLowerCase()
			const sender = entry.sender.toLowerCase()
			const receiver = entry.receiver.toLowerCase()
			const tokenId = entry.nftTokenId.toLowerCase()
			if (
				!name.includes(query) &&
				!sender.includes(query) &&
				!receiver.includes(query) &&
				!tokenId.includes(query)
			)
				continue
		}
		filtered.push(entry)
	}
	return filtered
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
type SuggestionMode = 'related'
const SUGGESTION_FALLBACK_SUFFIXES = ['ai', 'agent', 'agents', 'app', 'hub', 'sdk', 'kit', 'labs']

const suggestionMemCache = new Map<string, { data: string[]; exp: number }>()

function normalizeSuggestionMode(_value: string | undefined): SuggestionMode {
	return 'related'
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

function rankSuggestion(name: string, query: string): number {
	let score = 0
	if (name === query) score += 7000
	if (name.startsWith(query)) score += 380
	if (name.includes(query)) score += 220
	if (query.startsWith(name)) score += 140
	if (name.includes('x402')) score -= 2200
	if (name.length <= 6) score += 360
	else if (name.length <= 8) score += 220
	else if (name.length <= 12) score += 100
	if (/\d/.test(name)) score -= 60
	if (name.includes('-')) score -= 15
	return score
}

function finalizeSuggestions(query: string, values: string[]): string[] {
	const normalizedQuery = normalizeSuggestionName(query)
	const seen = new Set<string>()
	const normalized: string[] = []
	for (const candidate of values) {
		const clean = normalizeSuggestionName(candidate)
		if (clean?.includes('x402')) continue
		if (!clean || seen.has(clean)) continue
		seen.add(clean)
		normalized.push(clean)
	}
	if (!normalizedQuery) return normalized.slice(0, MAX_SUGGESTIONS)
	const sorted = normalized
		.filter((name) => !!name)
		.sort((a, b) => {
			const scoreDiff = rankSuggestion(b, normalizedQuery) - rankSuggestion(a, normalizedQuery)
			if (scoreDiff !== 0) return scoreDiff
			if (a.length !== b.length) return a.length - b.length
			return a.localeCompare(b)
		})
	const withoutQuery = sorted.filter((name) => name !== normalizedQuery)
	if (withoutQuery.length > 0) return withoutQuery.slice(0, MAX_SUGGESTIONS)
	return sorted.slice(0, MAX_SUGGESTIONS)
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
): Promise<string[]> {
	const contextBlock =
		braveContext.length > 0
			? `\nWeb context for "${query}":\n${braveContext.slice(0, 10).join('\n')}`
			: ''
	const strategyBlock = `- Focus on names related to "${query}" from mainstream search context
- Favor common words people actually search for and recognize
- Include many single-word premium names someone would actually pay for
- Avoid "x402" or anything that looks like x402 derivatives`

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
	mode: SuggestionMode = 'related',
): Promise<Response> {
	const normalizedQueryRaw =
		normalizeSuggestionName(query) ||
		query
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, '')
			.slice(0, 18)
	const normalizedQuery = normalizedQueryRaw.length >= 3 ? normalizedQueryRaw : 'name'
	const key = `${mode}:${normalizedQuery}`
	const cached = suggestionMemCache.get(key)
	if (cached && cached.exp > Date.now()) {
		return jsonResponse({ query: normalizedQuery, mode, suggestions: cached.data })
	}

	const suggestions: string[] = [normalizedQuery]
	const seen = new Set<string>([normalizedQuery])
	const pushSuggestion = (value: string) => {
		const clean = normalizeSuggestionName(value)
		if (clean?.includes('x402')) return
		if (!clean || seen.has(clean)) return
		seen.add(clean)
		suggestions.push(clean)
	}

	for (const suffix of SUGGESTION_FALLBACK_SUFFIXES) {
		pushSuggestion(`${normalizedQuery}${suffix}`)
	}

	const braveKey = env.BRAVE_SEARCH_API_KEY
	const aiKey = env.OPENROUTER_API_KEY

	if (aiKey) {
		try {
			const braveContext = braveKey ? await fetchBraveContext(normalizedQuery, braveKey) : []
			const aiNames = await fetchAISuggestions(normalizedQuery, braveContext, aiKey)
			for (const name of aiNames) {
				pushSuggestion(name)
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
			}
		}
	}

	const finalized = finalizeSuggestions(normalizedQuery, suggestions)

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

	featuredNamesCache = { data: ranked, exp: Date.now() + FEATURED_NAMES_TTL_MS }
	return jsonResponse({ names: ranked, cached: false })
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
		${generateExtensionNoiseFilter()}
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
			white-space: nowrap;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
		}
		.footer::-webkit-scrollbar { display: none; }
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
				top: calc(16px + env(safe-area-inset-top));
				right: calc(16px + env(safe-area-inset-right));
				z-index: 10040;
				display: flex;
				align-items: center;
				gap: 10px;
			}
			.wallet-profile-btn {
				width: 40px;
				height: 40px;
				border-radius: 10px;
				display: none;
				align-items: center;
				justify-content: center;
				background: rgba(96, 165, 250, 0.12);
				border: 1px solid rgba(96, 165, 250, 0.35);
				cursor: pointer;
				transition: all 0.2s ease;
				padding: 0;
			}
			.wallet-profile-btn.visible { display: inline-flex; }
		.wallet-profile-btn svg {
			width: 18px;
			height: 18px;
		}
			.wallet-profile-btn:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: rgba(96, 165, 250, 0.55);
			transform: translateY(-1px);
		}
		.wallet-widget.has-black-diamond .wallet-profile-btn {
			background: linear-gradient(135deg, rgba(10, 10, 18, 0.6), rgba(18, 18, 28, 0.7));
			border-color: rgba(120, 130, 155, 0.42);
			box-shadow: 0 0 24px rgba(0, 0, 0, 0.4);
		}
		.wallet-widget.has-black-diamond .wallet-profile-btn:hover {
			background: linear-gradient(135deg, rgba(16, 16, 26, 0.7), rgba(24, 24, 36, 0.8));
			border-color: rgba(140, 150, 175, 0.62);
			box-shadow: 0 0 28px rgba(0, 0, 0, 0.5);
		}
		.wallet-widget.has-black-diamond .wallet-profile-btn svg {
			filter: brightness(0.7) contrast(1.2) saturate(0.4);
		}
		.wallet-widget.has-black-diamond #wk-widget .wk-widget-btn.connected,
		.wallet-widget.has-black-diamond #wk-widget > div > button.connected {
			background: linear-gradient(135deg, rgba(8, 8, 16, 0.95), rgba(16, 16, 30, 0.94));
			border-color: rgba(198, 170, 98, 0.62);
			color: #d0d4e0;
			box-shadow:
				0 0 0 1px rgba(160, 120, 56, 0.24) inset,
				0 10px 24px rgba(0, 0, 0, 0.58),
				0 0 18px rgba(194, 145, 72, 0.26);
		}
		.wallet-widget.has-black-diamond #wk-widget .wk-widget-btn.connected:hover,
		.wallet-widget.has-black-diamond #wk-widget > div > button.connected:hover {
			border-color: rgba(234, 206, 128, 0.88);
			box-shadow:
				0 0 0 1px rgba(196, 154, 76, 0.34) inset,
				0 12px 28px rgba(0, 0, 0, 0.62),
				0 0 24px rgba(234, 179, 8, 0.28);
		}
		@media (max-width: 540px) {
			.wallet-widget { top: 12px; right: 12px; }
		}

		body.search-focused .wk-dropdown { display: none !important; }

		.reg-modal-overlay {
			position: fixed;
			inset: 0;
			z-index: 10100;
			background: rgba(0, 0, 0, 0.7);
			backdrop-filter: blur(6px);
			-webkit-backdrop-filter: blur(6px);
			display: flex;
			align-items: center;
			justify-content: center;
			animation: regModalFadeIn 0.2s ease;
		}
		@keyframes regModalFadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
		.reg-modal {
			width: 380px;
			max-width: calc(100vw - 32px);
			background: rgba(15, 15, 22, 0.98);
			backdrop-filter: blur(24px);
			-webkit-backdrop-filter: blur(24px);
			border: 1px solid rgba(130, 255, 190, 0.18);
			border-radius: 16px;
			box-shadow: 0 18px 44px rgba(2, 6, 23, 0.62), 0 0 30px rgba(130, 255, 190, 0.06);
			animation: regModalSlideIn 0.2s ease;
			overflow: hidden;
		}
		@keyframes regModalSlideIn {
			from { opacity: 0; transform: translateY(-12px) scale(0.97); }
			to { opacity: 1; transform: translateY(0) scale(1); }
		}
		.reg-modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 18px 0;
		}
		.reg-modal-title {
			font-size: 1.1rem;
			font-weight: 700;
			color: #fff;
		}
		.reg-modal-title .reg-modal-tld {
			color: var(--ski-green);
		}
		.reg-modal-close {
			width: 28px;
			height: 28px;
			border-radius: 6px;
			border: none;
			background: transparent;
			color: #71717a;
			font-size: 1.3rem;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.15s ease;
		}
		.reg-modal-close:hover {
			background: rgba(255, 255, 255, 0.06);
			color: #e4e4e7;
		}
		.reg-modal-body {
			padding: 18px;
			display: flex;
			flex-direction: column;
			gap: 14px;
		}
		.reg-modal-price-row {
			display: flex;
			align-items: baseline;
			gap: 8px;
		}
		.reg-modal-price {
			font-size: 1.5rem;
			font-weight: 800;
			color: #fff;
		}
		.reg-modal-price .reg-price-sui-icon {
			width: 14px;
			height: 18px;
			vertical-align: -2px;
			margin-left: 4px;
		}
		.reg-modal-price-usd {
			font-size: 0.85rem;
			color: #71717a;
		}
		.reg-modal-years-row {
			display: flex;
			align-items: center;
			gap: 0;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(130, 255, 190, 0.12);
			border-radius: 10px;
			overflow: hidden;
		}
		.reg-modal-year-btn {
			width: 44px;
			height: 40px;
			border: none;
			background: transparent;
			color: var(--ski-green);
			font-size: 1.1rem;
			font-weight: 700;
			cursor: pointer;
			transition: background 0.15s;
		}
		.reg-modal-year-btn:hover {
			background: rgba(130, 255, 190, 0.08);
		}
		.reg-modal-year-btn:disabled {
			opacity: 0.3;
			cursor: default;
		}
		.reg-modal-year-display {
			flex: 1;
			text-align: center;
			font-size: 1rem;
			font-weight: 700;
			color: #fff;
		}
		.reg-modal-year-unit {
			color: #71717a;
			margin-left: 3px;
			font-weight: 500;
		}
		.reg-modal-primary-toggle {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 14px;
			border-radius: 10px;
			border: 1px solid rgba(130, 255, 190, 0.1);
			background: transparent;
			color: #71717a;
			font-size: 0.88rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.15s;
		}
		.reg-modal-primary-toggle:hover {
			border-color: rgba(130, 255, 190, 0.25);
			color: #a1a1aa;
		}
		.reg-modal-primary-toggle.active {
			border-color: rgba(130, 255, 190, 0.35);
			color: var(--ski-green);
		}
		.reg-modal-star {
			font-size: 1.1rem;
		}
		.reg-modal-register-btn {
			width: 100%;
			padding: 12px 0;
			border-radius: 10px;
			border: none;
			background: var(--ski-green);
			color: #010201;
			font-size: 0.95rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.15s;
		}
		.reg-modal-register-btn:hover {
			filter: brightness(1.1);
		}
		.reg-modal-register-btn:disabled {
			opacity: 0.5;
			cursor: default;
		}
		.reg-modal-status {
			font-size: 0.85rem;
			line-height: 1.4;
			min-height: 0;
			transition: all 0.2s;
		}
		.reg-modal-status:empty {
			display: none;
		}
		.reg-modal-status.info { color: #93c5fd; }
		.reg-modal-status.ok { color: var(--ski-green); }
		.reg-modal-status.err { color: #fca5a5; }
		.reg-modal-status a {
			color: inherit;
			text-decoration: underline;
			text-underline-offset: 2px;
		}

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

	<div class="reg-modal-overlay" id="reg-modal-overlay" style="display:none;">
		<div class="reg-modal">
			<div class="reg-modal-header">
				<span class="reg-modal-title" id="reg-modal-title"></span>
				<button class="reg-modal-close" id="reg-modal-close" aria-label="Close">&times;</button>
			</div>
			<div class="reg-modal-body">
				<div class="reg-modal-price-row">
					<span class="reg-modal-price" id="reg-modal-price">--</span>
					<span class="reg-modal-price-usd" id="reg-modal-price-usd"></span>
				</div>
				<div class="reg-modal-years-row">
					<button type="button" class="reg-modal-year-btn" id="reg-modal-years-dec" aria-label="Decrease">&minus;</button>
					<div class="reg-modal-year-display"><span id="reg-modal-years-value">1</span><span class="reg-modal-year-unit">yr</span></div>
					<button type="button" class="reg-modal-year-btn" id="reg-modal-years-inc" aria-label="Increase">+</button>
				</div>
				<button type="button" class="reg-modal-primary-toggle" id="reg-modal-primary-toggle" aria-pressed="false" title="Set as primary name"><span class="reg-modal-star">&#9734;</span> Set as primary name</button>
				<button class="reg-modal-register-btn" id="reg-modal-register-btn">Register</button>
				<div class="reg-modal-status" id="reg-modal-status"></div>
			</div>
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
		<span class="sep">\u00b7</span>
		<a href="https://suins.io" target="_blank">SuiNS</a>
		<span class="sep">\u00b7</span>
		<a href="https://deepbook.tech" target="_blank">DeepBook</a>
		<span class="sep">\u00b7</span>
		<a href="https://docs.waap.xyz/category/guides-sui" target="_blank">WaaP</a>
		<span class="sep">\u00b7</span>
		<span>SUI <span class="price" id="sui-price">$--</span></span>
	</div>

		<script type="module">
				let getWallets, getJsonRpcFullnodeUrl, SuiJsonRpcClient, Transaction, SuinsClient, SuinsTransaction;
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
						timedImport('https://esm.sh/@mysten/sui@2.4.0/jsonRpc?bundle'),
						timedImport('https://esm.sh/@mysten/sui@2.4.0/transactions?bundle'),
						timedImport('https://esm.sh/@mysten/suins@1.0.0?bundle'),
					]);
						if (results[0].status === 'fulfilled') ({ getWallets } = results[0].value);
						if (results[1].status === 'fulfilled') ({ getJsonRpcFullnodeUrl, SuiJsonRpcClient } = results[1].value);
						if (results[2].status === 'fulfilled') ({ Transaction } = results[2].value);
						if (results[3].status === 'fulfilled') {
							const suinsModule = results[3].value;
							SuinsClient = pickExport(suinsModule, 'SuinsClient');
							SuinsTransaction = pickExport(suinsModule, 'SuinsTransaction');
						}
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
					return conn && (conn.status === 'connected' || conn.status === 'session') ? conn.address : null;
				}

				function getViewerAddress() {
					var conn = SuiWalletKit.$connection.value;
					return conn && (conn.status === 'connected' || conn.status === 'session') ? conn.address : null;
				}

				function getConnectedPrimaryName() {
					var conn = SuiWalletKit.$connection.value;
					if (!conn || (conn.status !== 'connected' && conn.status !== 'session')) return null;
					if (!conn.primaryName) return null;
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

					const walletWidgetEl = document.getElementById('wallet-widget');
					const walletProfileBtnEl = document.getElementById('wallet-profile-btn');
					function syncWalletProfileButtonVisibility() {
						if (!walletProfileBtnEl) return;
						const hasWallet = !!getConnectedAddress();
						const primaryName = getConnectedPrimaryName();
						walletProfileBtnEl.classList.toggle('visible', hasWallet);
						walletProfileBtnEl.title = primaryName ? primaryName + '.sui' : 'Go to sui.ski';
						if (walletWidgetEl) {
							walletWidgetEl.classList.toggle('has-black-diamond', !!primaryName);
						}
					}

					window.onLandingWalletConnected = function() {
						syncWalletProfileButtonVisibility();
						scheduleWalletDrivenDropdownRefresh();
						return undefined;
					};

					window.onLandingWalletDisconnected = function() {
						syncWalletProfileButtonVisibility();
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
							syncWalletProfileButtonVisibility();
							scheduleWalletDrivenDropdownRefresh();
						});
					}

			async function executeTransaction(tx) {
				var txBytes = await tx.build({ client: suiClient });
				return SuiWalletKit.signAndExecuteFromBytes(txBytes);
			}

			const WAAP_REFERRAL_ADDRESS = '0x53f1e3d5f1e3f5aefa47fd3d5a47c9b8cc87e26a2c7bf39e26c870ded4eca7df';
			const REG_MODAL_MIN_YEARS = 1;
			const REG_MODAL_MAX_YEARS = 5;
			let regModalName = '';
			let regModalYears = 1;
			let regModalWantsPrimary = true;
			let regModalPricingData = null;
			let regModalBusy = false;

			function regModalShowStatus(message, type, html) {
				var el = document.getElementById('reg-modal-status');
				if (!el) return;
				el.className = 'reg-modal-status ' + (type || 'info');
				if (html) el.innerHTML = message;
				else el.textContent = message;
			}

			function regModalHideStatus() {
				var el = document.getElementById('reg-modal-status');
				if (!el) return;
				el.className = 'reg-modal-status';
				el.textContent = '';
			}

			function regModalUpdatePrice() {
				var priceEl = document.getElementById('reg-modal-price');
				var usdEl = document.getElementById('reg-modal-price-usd');
				if (!regModalPricingData) {
					if (priceEl) priceEl.textContent = '--';
					if (usdEl) usdEl.textContent = '';
					return;
				}
				var mist = Number(regModalPricingData.discountedSuiMist || regModalPricingData.directSuiMist || 0);
				var sui = mist / 1e9;
				var suiIcon = '<svg class="reg-price-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg>';
				if (Number.isFinite(sui) && sui > 0) {
					priceEl.innerHTML = sui.toFixed(1) + ' ' + suiIcon;
				} else {
					priceEl.textContent = '--';
				}
				var usd = Number(regModalPricingData.breakdown && regModalPricingData.breakdown.discountedPriceUsd || 0);
				if (usdEl) {
					usdEl.textContent = Number.isFinite(usd) && usd > 0 ? '\\u2248 $' + Math.round(usd) : '';
				}
			}

			async function regModalFetchPricing() {
				try {
					var res = await fetch('/api/pricing?domain=' + encodeURIComponent(regModalName) + '&years=' + regModalYears);
					if (!res.ok) return;
					regModalPricingData = await res.json();
					regModalUpdatePrice();
				} catch {}
			}

			function regModalUpdateYearsUi() {
				var valEl = document.getElementById('reg-modal-years-value');
				var decBtn = document.getElementById('reg-modal-years-dec');
				var incBtn = document.getElementById('reg-modal-years-inc');
				if (valEl) valEl.textContent = String(regModalYears);
				if (decBtn) decBtn.disabled = regModalYears <= REG_MODAL_MIN_YEARS;
				if (incBtn) incBtn.disabled = regModalYears >= REG_MODAL_MAX_YEARS;
			}

			function regModalUpdatePrimaryUi() {
				var toggle = document.getElementById('reg-modal-primary-toggle');
				if (!toggle) return;
				toggle.classList.toggle('active', regModalWantsPrimary);
				toggle.setAttribute('aria-pressed', regModalWantsPrimary ? 'true' : 'false');
				var star = toggle.querySelector('.reg-modal-star');
				if (star) star.innerHTML = regModalWantsPrimary ? '\\u2605' : '\\u2606';
			}

			function openRegisterModal(name) {
				var overlay = document.getElementById('reg-modal-overlay');
				if (!overlay) return;
				regModalName = name;
				regModalYears = 1;
				regModalWantsPrimary = true;
				regModalPricingData = null;
				regModalBusy = false;

				var titleEl = document.getElementById('reg-modal-title');
				if (titleEl) titleEl.innerHTML = name + '<span class="reg-modal-tld">.sui</span>';

				var regBtn = document.getElementById('reg-modal-register-btn');
				if (regBtn) { regBtn.disabled = false; regBtn.textContent = 'Register'; }

				regModalHideStatus();
				regModalUpdateYearsUi();
				regModalUpdatePrimaryUi();
				regModalUpdatePrice();
				overlay.style.display = '';
				regModalFetchPricing();

				var address = getConnectedAddress();
				if (!address) {
					regModalShowStatus('Connect your wallet first', 'info');
				}
			}

			function closeRegisterModal() {
				var overlay = document.getElementById('reg-modal-overlay');
				if (overlay) overlay.style.display = 'none';
				regModalBusy = false;
			}

			async function registerNameInline() {
				if (regModalBusy) return;
				var address = getConnectedAddress();
				if (!address) {
					regModalShowStatus('Connect your wallet first', 'info');
					if (typeof SuiWalletKit !== 'undefined' && typeof SuiWalletKit.openModal === 'function') {
						SuiWalletKit.openModal();
					}
					return;
				}
				regModalBusy = true;
				var regBtn = document.getElementById('reg-modal-register-btn');
				if (regBtn) regBtn.disabled = true;
				regModalHideStatus();
				regModalShowStatus('Building transaction...', 'info');

				try {
					var buildRes = await fetch('/api/register/build-tx', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							domain: regModalName,
							years: regModalYears,
							sender: address,
							waapReferral: WAAP_REFERRAL_ADDRESS,
							wantsPrimary: regModalWantsPrimary,
						}),
					});
					if (!buildRes.ok) {
						var errBody = await buildRes.json().catch(function() { return {}; });
						throw new Error(errBody.error || 'Failed to build transaction');
					}
					var buildData = await buildRes.json();
					var txBytesBase64 = buildData.txBytes;

					var raw = atob(txBytesBase64);
					var txBytes = new Uint8Array(raw.length);
					for (var i = 0; i < raw.length; i++) txBytes[i] = raw.charCodeAt(i);

					regModalShowStatus('Approve in wallet...', 'info');
					var result = await SuiWalletKit.signAndExecute(txBytes, { txOptions: { showEffects: true }, forceSignBridge: true });
					var digest = result && result.digest ? String(result.digest) : '';

					var effectsStatus = result && result.effects && result.effects.status ? result.effects.status : null;
					if (effectsStatus && effectsStatus.status === 'failure') {
						throw new Error(effectsStatus.error || 'Transaction failed on-chain');
					}

					var createdNft = false;
					if (result && result.effects && result.effects.created) {
						for (var ci = 0; ci < result.effects.created.length; ci++) {
							var ref = result.effects.created[ci].reference || result.effects.created[ci];
							if (ref && ref.objectId) { createdNft = true; break; }
						}
					}
					if (!createdNft && digest && SuiJsonRpcClient) {
						regModalShowStatus('Verifying registration...', 'info');
						try {
							var rpcClient = new SuiJsonRpcClient({ url: RPC_URL });
							var txCheck = await rpcClient.getTransactionBlock({ digest: digest, options: { showEffects: true, showObjectChanges: true } });
							var checkStatus = txCheck && txCheck.effects && txCheck.effects.status ? txCheck.effects.status : null;
							if (checkStatus && checkStatus.status === 'failure') {
								throw new Error(checkStatus.error || 'Transaction failed on-chain');
							}
							if (txCheck && txCheck.objectChanges) {
								for (var oci = 0; oci < txCheck.objectChanges.length; oci++) {
									if (txCheck.objectChanges[oci].type === 'created') { createdNft = true; break; }
								}
							}
						} catch (verifyErr) {
							if (verifyErr && verifyErr.message && verifyErr.message.indexOf('failed on-chain') !== -1) throw verifyErr;
						}
					}

					if (!createdNft) {
						throw new Error('Registration transaction did not create a SuiNS NFT. Check your balance and try again.');
					}

					var links = digest
						? '<a href="https://suiscan.xyz/' + NETWORK + '/tx/' + encodeURIComponent(digest) + '" target="_blank" rel="noopener noreferrer">Suiscan</a> \\u00b7 ' +
						  '<a href="https://suiexplorer.com/txblock/' + encodeURIComponent(digest) + '?network=' + NETWORK + '" target="_blank" rel="noopener noreferrer">Explorer</a>'
						: '';
					regModalShowStatus(
						'<strong>Registered!</strong> <a href="https://' + regModalName + '.sui.ski">Open profile</a>' +
						(digest ? ' \\u00b7 ' + links : ''),
						'ok',
						true,
					);
					if (regModalWantsPrimary && typeof SuiWalletKit.setPrimaryName === 'function') {
						SuiWalletKit.setPrimaryName(regModalName);
					}
					if (regBtn) { regBtn.textContent = 'Registered'; regBtn.disabled = true; }
				} catch (error) {
					var msg = error && error.message ? error.message : 'Registration failed';
					regModalShowStatus(msg, 'err');
					if (regBtn) regBtn.disabled = false;
				}
				regModalBusy = false;
			}

			(function initRegModal() {
				var overlay = document.getElementById('reg-modal-overlay');
				var closeBtn = document.getElementById('reg-modal-close');
				var decBtn = document.getElementById('reg-modal-years-dec');
				var incBtn = document.getElementById('reg-modal-years-inc');
				var primaryToggle = document.getElementById('reg-modal-primary-toggle');
				var regBtn = document.getElementById('reg-modal-register-btn');

				if (overlay) overlay.addEventListener('click', function(e) {
					if (e.target === overlay && !regModalBusy) closeRegisterModal();
				});
				if (closeBtn) closeBtn.addEventListener('click', function() {
					if (!regModalBusy) closeRegisterModal();
				});
				if (decBtn) decBtn.addEventListener('click', function() {
					if (regModalYears > REG_MODAL_MIN_YEARS) {
						regModalYears--;
						regModalUpdateYearsUi();
						regModalFetchPricing();
					}
				});
				if (incBtn) incBtn.addEventListener('click', function() {
					if (regModalYears < REG_MODAL_MAX_YEARS) {
						regModalYears++;
						regModalUpdateYearsUi();
						regModalFetchPricing();
					}
				});
				if (primaryToggle) primaryToggle.addEventListener('click', function() {
					regModalWantsPrimary = !regModalWantsPrimary;
					regModalUpdatePrimaryUi();
				});
				if (regBtn) regBtn.addEventListener('click', registerNameInline);
			})();

					initClients().catch(function(error) {
						console.warn('initClients failed:', error && error.message ? error.message : error);
						suiClient = null;
						suinsClient = null;
					});
					syncWalletProfileButtonVisibility();

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
				'agents',
				'agent',
				'ai',
				'alpha',
				'pro',
				'vault',
				'wallet',
				'builder',
				'domain',
				'defi',
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
							names = unique.slice(0, 18);
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
					const res = await fetch('/api/suggest-names?q=' + encodeURIComponent(query) + '&mode=related');
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
							openRegisterModal(name);
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
				showOfferStatus(statusCol, 'Offer placed!', 'success');
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

	<style>${generateMessagingChatCss()}</style>
	<div id="messaging-chat-root"></div>
	<script>${generateMessagingChatJs({ page: 'landing', network: options.network || 'mainnet' })}</script>

</body>
</html>`
}

export function cloudflareGracePageHTML(network: string): string {
	return `<!doctype html>
<html lang="en">
<head>
	${generateExtensionNoiseFilter()}
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>SuiNS Grace Radar | sui.ski</title>
	<style>
		:root { --bg: #07101f; --panel: #0c1830; --line: #22375b; --text: #d9e7ff; --muted: #88a1c7; --accent: #60a5fa; --grace: #fbbf24; --exp: #34d399; --ok: #10b981; --danger: #ef4444; }
		* { box-sizing: border-box; }
		body { margin: 0; font-family: 'SF Mono', 'Consolas', monospace; background: var(--bg); color: var(--text); }
		.wrap { max-width: 1160px; margin: 0 auto; padding: 18px; }
		h1 { margin: 0; font-size: 24px; line-height: 1.1; }
		.subtitle { margin-top: 6px; color: var(--muted); font-size: 12px; }
		.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
		.controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
		.input, .select, .button { border: 1px solid var(--line); background: var(--panel); color: var(--text); border-radius: 9px; padding: 10px 12px; font: inherit; font-size: 13px; }
		.input { min-width: 260px; flex: 1; }
		.button { cursor: pointer; }
		.button:disabled { opacity: 0.5; cursor: not-allowed; }
		.meta { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
		.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
		.stat { border: 1px solid var(--line); background: rgba(12, 24, 48, 0.82); border-radius: 10px; padding: 10px; }
		.stat .k { color: var(--muted); font-size: 11px; }
		.stat .v { font-size: 18px; font-weight: 800; margin-top: 3px; }
		.tab-bar { display: flex; gap: 0; margin-bottom: 10px; border-bottom: 2px solid var(--line); }
		.tab-btn { background: none; border: none; color: var(--muted); font: inherit; font-size: 13px; font-weight: 700; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color 0.15s, border-color 0.15s; }
		.tab-btn.active { color: var(--text); border-bottom-color: var(--accent); }
		.tab-btn:hover { color: var(--text); }
		.tab-panel { display: none; }
		.tab-panel.active { display: block; }
		.table-wrap { border: 1px solid var(--line); border-radius: 11px; overflow: hidden; background: var(--panel); }
		table { width: 100%; border-collapse: collapse; }
		th, td { padding: 10px 12px; border-bottom: 1px solid rgba(34, 55, 91, 0.7); font-size: 12px; text-align: left; vertical-align: middle; }
		th { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; text-transform: uppercase; background: rgba(6, 13, 27, 0.45); }
		tr:last-child td { border-bottom: none; }
		.name { color: var(--text); text-decoration: none; font-weight: 700; }
		.name:hover { color: var(--accent); }
		.tag { display: inline-flex; padding: 2px 8px; border-radius: 999px; border: 1px solid; font-size: 11px; font-weight: 700; }
		.tag.grace { color: var(--grace); border-color: rgba(251, 191, 36, 0.5); }
		.tag.expiring { color: var(--exp); border-color: rgba(52, 211, 153, 0.5); }
		.tag.buy, .tag.sale { color: #86efac; border-color: rgba(34, 197, 94, 0.5); }
		.tag.list { color: #93c5fd; border-color: rgba(77, 163, 255, 0.5); }
		.tag.bid { color: #fdba74; border-color: rgba(251, 146, 60, 0.5); }
		.tag.mint { color: #c4b5fd; border-color: rgba(168, 85, 247, 0.5); }
		.tag.delist { color: #fca5a5; border-color: rgba(239, 68, 68, 0.5); }
		.tag.unknown { color: var(--muted); border-color: rgba(136, 161, 199, 0.4); }
		.muted { color: var(--muted); }
		.pager { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 10px; color: var(--muted); font-size: 12px; }
		.diamond-btn { width: 28px; height: 28px; background: transparent; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding: 0; flex-shrink: 0; position: relative; transition: filter 0.25s ease; }
		.diamond-btn::before { content: ''; width: 12px; height: 12px; border-radius: 2px; background: linear-gradient(145deg, #60a5fa, #2563eb); border: 1px solid rgba(191, 219, 254, 0.75); box-shadow: 0 0 0 1px rgba(30, 58, 138, 0.35), 0 2px 6px rgba(37, 99, 235, 0.45); transform: rotate(0deg) scale(1); transition: transform 0.45s cubic-bezier(0.2, 0.85, 0.2, 1), background 0.45s ease, border-color 0.35s ease, box-shadow 0.45s ease, border-radius 0.35s ease; }
		.diamond-btn:hover { filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.9)); }
		.diamond-btn:hover::before { transform: rotate(0deg) scale(1.12); }
		.diamond-btn.bookmarked { filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.92)); }
		.diamond-btn.bookmarked::before { transform: rotate(45deg) scale(1.45); border-radius: 0; background: linear-gradient(160deg, #000, #050505 52%, #000); border-color: rgba(8, 8, 10, 0.98); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02), 0 0 16px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(20, 20, 24, 0.9); }
		.diamond-btn.bookmarked::after { content: ''; position: absolute; width: 15px; height: 15px; border: 1px solid rgba(157, 172, 196, 0.7); border-radius: 0; transform: rotate(45deg) scale(1.12); box-shadow: 0 0 8px rgba(144, 158, 181, 0.35); pointer-events: none; }
		.diamond-btn.bookmarked:hover::before { transform: rotate(45deg) scale(1.55); }
		.diamond-btn.diamond-transforming::before { animation: diamond-turn-ink 760ms cubic-bezier(0.2, 0.85, 0.2, 1) both; }
		@keyframes diamond-turn-ink { 0% { transform: rotate(0deg) scale(1); border-radius: 2px; } 34% { transform: rotate(240deg) scale(1.9); } 70% { transform: rotate(560deg) scale(1.38); } 100% { transform: rotate(45deg) scale(1.45); border-radius: 0; background: linear-gradient(160deg, #000, #050505 52%, #000); } }
		@keyframes diamond-pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; transform: scale(1.1); } }
		.bm-panel { border: 1px solid var(--line); border-radius: 11px; background: rgba(12, 24, 48, 0.85); margin-bottom: 10px; overflow: hidden; }
		.bm-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; cursor: pointer; user-select: none; }
		.bm-header:hover { background: rgba(12, 24, 48, 0.6); }
		.bm-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
		.bm-badge { background: rgba(96, 165, 250, 0.2); color: var(--accent); border-radius: 999px; padding: 1px 8px; font-size: 11px; font-weight: 700; }
		.bm-body { display: none; padding: 0 14px 14px; }
		.bm-panel.open .bm-body { display: block; }
		.bm-grid { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0; }
		.bm-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px 6px 8px; border-radius: 8px; background: linear-gradient(135deg, rgba(6, 6, 14, 0.85), rgba(12, 12, 22, 0.75)); border: 1px solid rgba(60, 65, 85, 0.4); color: rgba(200, 205, 220, 0.9); font-size: 0.78rem; font-weight: 600; text-decoration: none; cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.15s; }
		.bm-chip:hover { border-color: rgba(120, 130, 170, 0.55); transform: translateY(-1px); }
		.bm-diamond { flex-shrink: 0; width: 8px; height: 8px; background: linear-gradient(160deg, #000, #050505 52%, #000); border: 1px solid rgba(157, 172, 196, 0.5); transform: rotate(45deg); }
		.bm-name { flex: 1; white-space: nowrap; }
		.bm-price { color: #fff; font-weight: 600; font-size: 0.72rem; }
		.chip-rm { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 0 0 0 4px; line-height: 1; }
		.chip-rm:hover { color: var(--danger); }
		.wallet-btn { border: 1px solid var(--line); background: var(--panel); color: var(--text); border-radius: 9px; padding: 10px 14px; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
		.wallet-btn:hover { border-color: #3a5a8a; }
		.wallet-btn.connected { border-color: rgba(34, 197, 94, 0.5); }
		.w-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); display: inline-block; }
		.wallet-btn.connected .w-dot { background: var(--ok); }
		${generateWalletUiCss()}
		@media (max-width: 940px) { .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .input { min-width: 0; width: 100%; } }
		@media (max-width: 820px) { .table-wrap { overflow-x: auto; } table { min-width: 820px; } }
	</style>
</head>
<body>
	<div class="wrap">
		<div class="top">
			<div>
				<h1>SuiNS Grace Radar</h1>
				<div class="subtitle">Network: ${network} · SuiNS expirations + marketplace activity since ${DEFAULT_MIN_EXPIRATION_MS}</div>
			</div>
			<div class="controls">
				<input id="q" class="input" placeholder="Search name, token id, owner..." />
				<select id="status" class="select">
					<option value="all">All tracked</option>
					<option value="expiring">Expiring soon</option>
					<option value="grace">In grace period</option>
				</select>
				<button id="refresh" class="button">Refresh</button>
				<button id="wallet-btn" class="wallet-btn"><span class="w-dot"></span><span id="w-label">Connect</span></button>
			</div>
		</div>

		<div id="bm-panel" class="bm-panel" style="display:none">
			<div class="bm-header" id="bm-toggle">
				<span class="bm-title"><span class="bm-diamond"></span> Black Diamonds <span class="bm-badge" id="bm-count">0</span></span>
				<span class="muted" style="font-size:11px" id="bm-arrow">&#9660;</span>
			</div>
			<div class="bm-body"><div class="bm-grid" id="bm-grid"></div></div>
		</div>

		<div class="stats" id="stats-listings">
			<div class="stat"><div class="k">Total</div><div class="v" id="s-total">-</div></div>
			<div class="stat"><div class="k">Grace</div><div class="v" id="s-grace">-</div></div>
			<div class="stat"><div class="k">Expiring</div><div class="v" id="s-exp">-</div></div>
			<div class="stat"><div class="k">Fetched</div><div class="v" id="s-time">-</div></div>
		</div>
		<div class="stats" id="stats-activity" style="display:none">
			<div class="stat"><div class="k">Total Actions</div><div class="v" id="sa-total">-</div></div>
			<div class="stat"><div class="k">Buys</div><div class="v" id="sa-buys">-</div></div>
			<div class="stat"><div class="k">Lists</div><div class="v" id="sa-lists">-</div></div>
			<div class="stat"><div class="k">Bids</div><div class="v" id="sa-bids">-</div></div>
		</div>

		<div id="meta" class="meta"></div>

		<div class="tab-bar">
			<button class="tab-btn active" data-tab="listings">Listings</button>
			<button class="tab-btn" data-tab="activity">Activity</button>
		</div>

		<div id="panel-listings" class="tab-panel active">
			<div class="table-wrap">
				<table>
					<thead><tr><th style="width:28px"></th><th>Name</th><th>Status</th><th>Expiry</th><th>Clock</th><th>Grace</th><th>Owner</th><th>Source</th></tr></thead>
					<tbody id="rows"><tr><td colspan="8" class="muted">Loading...</td></tr></tbody>
				</table>
			</div>
			<div class="pager">
				<div id="count">-</div>
				<div class="controls"><button id="prev" class="button">Prev</button><button id="next" class="button">Next</button></div>
			</div>
		</div>

		<div id="panel-activity" class="tab-panel">
			<div class="table-wrap">
				<table>
					<thead><tr><th style="width:28px"></th><th>Name</th><th>Type</th><th>Price</th><th>From</th><th>To</th><th>Market</th><th>Time</th><th>Tx</th></tr></thead>
					<tbody id="act-rows"><tr><td colspan="9" class="muted">Click Activity tab to load</td></tr></tbody>
				</table>
			</div>
			<div class="pager">
				<div id="act-count">-</div>
				<div class="controls"><button id="act-prev" class="button">Prev</button><button id="act-next" class="button">Next</button></div>
			</div>
		</div>
	</div>

	<div id="wk-modal"></div>

	<script type="module">
	var SDK_TIMEOUT = 20000;
	var timedImport = function(url, ms) { ms = ms || SDK_TIMEOUT; return Promise.race([import(url), new Promise(function(_, r) { setTimeout(function() { r(new Error('Timeout')); }, ms); })]); };
	var pick = function(m, n) { if (!m || typeof m !== 'object') return undefined; if (n in m) return m[n]; if (m.default && typeof m.default === 'object' && n in m.default) return m.default[n]; return undefined; };
	var getWallets;
	var sdkR = await Promise.allSettled([timedImport('https://esm.sh/@wallet-standard/app@1.1.0')]);
	if (sdkR[0].status === 'fulfilled') getWallets = pick(sdkR[0].value, 'getWallets');
	${generateWalletSessionJs()}
	${generateWalletKitJs({ network: network || 'mainnet', autoConnect: true })}
	${generateWalletUiJs({ showPrimaryName: false, onConnect: 'onGraceWalletConnected', onDisconnect: 'onGraceWalletDisconnected' })}

	function getAddr() {
		if (typeof SuiWalletKit === 'undefined') return null;
		var c = SuiWalletKit.$connection.value;
		return c && (c.status === 'connected' || c.status === 'session') ? c.address : null;
	}
	var wBtn = document.getElementById('wallet-btn');
	var wLbl = document.getElementById('w-label');
	function syncW() {
		var a = getAddr();
		if (a) { wBtn.classList.add('connected'); wLbl.textContent = a.slice(0, 6) + '...' + a.slice(-4); }
		else { wBtn.classList.remove('connected'); wLbl.textContent = 'Connect'; }
	}
	window.onGraceWalletConnected = function() { syncW(); if (window.loadBm) window.loadBm(); };
	window.onGraceWalletDisconnected = function() { syncW(); window.bookmarks = {}; if (window.renderBm) window.renderBm(); };
	wBtn.addEventListener('click', function() {
		if (getAddr()) { if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.disconnect) SuiWalletKit.disconnect(); }
		else { if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.openModal) SuiWalletKit.openModal(); }
	});
	setTimeout(syncW, 500);
	window.getAddr = getAddr;
	</script>

	<script>
	(function() {
		var LIMIT = 50;
		var MIN_EXP = ${DEFAULT_MIN_EXPIRATION_MS};
		var state = { offset: 0, total: 0, q: '', status: 'all', minExpirationMs: MIN_EXP, windowDays: 180, tab: 'listings', actOff: 0, actTotal: 0, actLoaded: false };
		var qEl = document.getElementById('q');
		var statusEl = document.getElementById('status');
		var refreshEl = document.getElementById('refresh');
		var prevEl = document.getElementById('prev');
		var nextEl = document.getElementById('next');
		var rowsEl = document.getElementById('rows');
		var metaEl = document.getElementById('meta');
		var countEl = document.getElementById('count');
		var actRowsEl = document.getElementById('act-rows');
		var actCountEl = document.getElementById('act-count');
		var actPrevEl = document.getElementById('act-prev');
		var actNextEl = document.getElementById('act-next');
		var statsL = document.getElementById('stats-listings');
		var statsA = document.getElementById('stats-activity');
		var bmPanelEl = document.getElementById('bm-panel');
		var bmToggleEl = document.getElementById('bm-toggle');
		var bmGridEl = document.getElementById('bm-grid');
		var bmCountEl = document.getElementById('bm-count');
		var bmArrowEl = document.getElementById('bm-arrow');
		var debounceTimer = null;
		var syncTimer = null;
		window.bookmarks = {};

		function bmKey() { var a = typeof getAddr === 'function' ? getAddr() : null; return 'grace-bm-' + (a || 'anon'); }

		window.loadBm = function() {
			try { var raw = localStorage.getItem(bmKey()); window.bookmarks = raw ? JSON.parse(raw) : {}; } catch(e) { window.bookmarks = {}; }
			window.renderBm();
		};

		function saveBm() {
			try { localStorage.setItem(bmKey(), JSON.stringify(window.bookmarks)); } catch(e) {}
			window.renderBm();
			if (syncTimer) clearTimeout(syncTimer);
			syncTimer = setTimeout(function() {
				var a = typeof getAddr === 'function' ? getAddr() : null;
				if (!a) return;
				fetch('/api/vault/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: a, category: 'grace', data: JSON.stringify(window.bookmarks) }) }).catch(function(){});
			}, 2000);
		}

		function toggleBm(name, tokenId, price) {
			if (window.bookmarks[name]) delete window.bookmarks[name];
			else window.bookmarks[name] = { name: name, address: tokenId || '', addedAt: Date.now(), note: '', category: 'grace', priceSnapshot: price || 0, lastActivityAt: Date.now() };
			saveBm();
			syncDiamonds();
		}

		function syncDiamonds() {
			document.querySelectorAll('.diamond-btn').forEach(function(btn) {
				var n = btn.getAttribute('data-name');
				var is = !!window.bookmarks[n];
				var was = btn.classList.contains('bookmarked');
				if (is && !was) {
					btn.classList.add('diamond-transforming');
					btn.addEventListener('animationend', function h() { btn.classList.remove('diamond-transforming'); btn.removeEventListener('animationend', h); });
				}
				btn.classList.toggle('bookmarked', is);
			});
		}

		window.renderBm = function() {
			var keys = Object.keys(window.bookmarks);
			bmCountEl.textContent = String(keys.length);
			if (keys.length === 0) { bmPanelEl.style.display = 'none'; return; }
			bmPanelEl.style.display = '';
			var html = '';
			for (var i = 0; i < keys.length; i++) {
				var b = window.bookmarks[keys[i]];
				html += '<a class="bm-chip" href="/' + esc(b.name.replace(/\\.sui$/i, '')) + '" target="_blank">'
					+ '<span class="bm-diamond"></span><span class="bm-name">' + esc(b.name) + '</span>'
					+ (b.priceSnapshot ? '<span class="bm-price">' + Number(b.priceSnapshot).toFixed(2) + ' SUI</span>' : '')
					+ '<button class="chip-rm" data-rm="' + esc(keys[i]) + '">&times;</button></a>';
			}
			bmGridEl.innerHTML = html;
		};

		bmToggleEl.addEventListener('click', function() { bmPanelEl.classList.toggle('open'); bmArrowEl.innerHTML = bmPanelEl.classList.contains('open') ? '&#9650;' : '&#9660;'; });
		bmGridEl.addEventListener('click', function(e) { var rm = e.target.closest('.chip-rm'); if (rm) { e.preventDefault(); e.stopPropagation(); var k = rm.getAttribute('data-rm'); if (k && window.bookmarks[k]) { delete window.bookmarks[k]; saveBm(); syncDiamonds(); } } });
		document.addEventListener('click', function(e) { var d = e.target.closest('.diamond-btn'); if (d) { e.preventDefault(); toggleBm(d.getAttribute('data-name'), d.getAttribute('data-token'), parseFloat(d.getAttribute('data-price') || '0')); } });

		function esc(str) { return String(str || '').replace(/[&<>"']/g, function(c) { return c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'; }); }
		function shortAddr(v) { v = String(v || ''); if (!v) return '-'; if (v.length <= 14) return v; return v.slice(0, 8) + '...' + v.slice(-4); }
		function relTime(ms) { var d = Date.now() - ms; if (d < 60000) return 'now'; if (d < 3600000) return Math.floor(d/60000) + 'm ago'; if (d < 86400000) return Math.floor(d/3600000) + 'h ago'; return Math.floor(d/86400000) + 'd ago'; }
		function dHtml(name, tid, price) { var bm = window.bookmarks[name] ? ' bookmarked' : ''; return '<button class="diamond-btn' + bm + '" data-name="' + esc(name) + '" data-token="' + esc(tid) + '" data-price="' + (price||0) + '" title="Bookmark"></button>'; }

		function renderRows(names) {
			if (!Array.isArray(names) || names.length === 0) { rowsEl.innerHTML = '<tr><td colspan="8" class="muted">No names found.</td></tr>'; return; }
			var html = '';
			for (var i = 0; i < names.length; i++) {
				var it = names[i] || {};
				var cn = String(it.name || '').replace(/\\.sui$/i, '');
				var st = it.inGracePeriod ? 'grace' : 'expiring';
				var sl = it.inGracePeriod ? 'GRACE' : 'EXPIRING';
				var ck = it.expired ? ('Expired ' + Number(it.daysSinceExpiry||0).toFixed(1) + 'd ago') : ('In ' + Number(it.daysUntilExpiry||0).toFixed(1) + 'd');
				var gt = it.inGracePeriod ? (Number(it.daysUntilGraceEnds||0).toFixed(1) + 'd left') : '-';
				html += '<tr><td>' + dHtml(it.name, it.tokenId, 0) + '</td>'
					+ '<td><a class="name" href="/' + encodeURIComponent(cn) + '" target="_blank" rel="noreferrer">' + esc(it.name) + '</a><div class="muted" style="font-size:10px">' + shortAddr(it.tokenId) + '</div></td>'
					+ '<td><span class="tag ' + st + '">' + sl + '</span></td>'
					+ '<td>' + new Date(Number(it.expirationMs||0)).toLocaleDateString() + '</td>'
					+ '<td>' + esc(ck) + '</td><td>' + esc(gt) + '</td>'
					+ '<td title="' + esc(it.owner) + '">' + esc(shortAddr(it.owner)) + '</td>'
					+ '<td>' + esc(it.dataSource||'-') + '</td></tr>';
			}
			rowsEl.innerHTML = html;
		}

		function renderAct(actions) {
			if (!Array.isArray(actions) || actions.length === 0) { actRowsEl.innerHTML = '<tr><td colspan="9" class="muted">No activity found.</td></tr>'; return; }
			var tc = { buy: 'buy', sale: 'sale', list: 'list', bid: 'bid', mint: 'mint', delist: 'delist' };
			var html = '';
			for (var i = 0; i < actions.length; i++) {
				var a = actions[i];
				var cls = tc[a.type] || 'unknown';
				var ps = Number(a.priceSui || 0);
				html += '<tr><td>' + dHtml(a.nftName, a.nftTokenId, ps) + '</td>'
					+ '<td><a class="name" href="/' + encodeURIComponent(String(a.nftName||'').replace(/\\.sui$/i,'')) + '" target="_blank">' + esc(a.nftName) + '</a></td>'
					+ '<td><span class="tag ' + cls + '">' + esc(a.type.toUpperCase()) + '</span></td>'
					+ '<td>' + (ps > 0 ? ps.toFixed(2) + ' SUI' : '-') + '</td>'
					+ '<td title="' + esc(a.sender) + '">' + esc(shortAddr(a.sender)) + '</td>'
					+ '<td title="' + esc(a.receiver) + '">' + esc(shortAddr(a.receiver)) + '</td>'
					+ '<td>' + esc(a.marketName) + '</td>'
					+ '<td>' + relTime(a.blockTimeMs) + '</td>'
					+ '<td><a class="name" href="https://suivision.xyz/txblock/' + esc(a.txId) + '" target="_blank">view</a></td></tr>';
			}
			actRowsEl.innerHTML = html;
		}

		function updateUrl() {
			var url = new URL(window.location.href);
			url.searchParams.set('q', state.q); url.searchParams.set('status', state.status);
			url.searchParams.set('offset', String(state.offset)); url.searchParams.set('tab', state.tab);
			window.history.replaceState({}, '', url.toString());
		}

		function hydrateFromUrl() {
			var url = new URL(window.location.href);
			state.q = String(url.searchParams.get('q') || '');
			state.status = String(url.searchParams.get('status') || 'all');
			if (state.status !== 'grace' && state.status !== 'expiring') state.status = 'all';
			var po = parseInt(url.searchParams.get('offset') || '0', 10);
			state.offset = Number.isFinite(po) && po > 0 ? po : 0;
			var tab = String(url.searchParams.get('tab') || '');
			if (tab === 'activity') state.tab = 'activity';
			qEl.value = state.q; statusEl.value = state.status;
		}

		async function load() {
			rowsEl.innerHTML = '<tr><td colspan="8" class="muted">Loading...</td></tr>';
			updateUrl();
			var params = new URLSearchParams();
			params.set('limit', String(LIMIT)); params.set('offset', String(state.offset));
			params.set('q', state.q); params.set('status', state.status);
			params.set('minExpirationMs', String(state.minExpirationMs));
			params.set('windowDays', String(state.windowDays)); params.set('_', String(Date.now()));
			var res = await fetch('/api/grace-feed?' + params.toString());
			if (!res.ok) { rowsEl.innerHTML = '<tr><td colspan="8" class="muted">Failed to load.</td></tr>'; return; }
			var data = await res.json().catch(function() { return null; });
			if (!data || !Array.isArray(data.names)) { rowsEl.innerHTML = '<tr><td colspan="8" class="muted">Invalid response.</td></tr>'; return; }
			state.total = Number(data.total || 0);
			renderRows(data.names);
			document.getElementById('s-total').textContent = String(state.total);
			var gc = 0, ec = 0;
			for (var i = 0; i < data.names.length; i++) { if (data.names[i].inGracePeriod) gc++; else ec++; }
			document.getElementById('s-grace').textContent = String(gc);
			document.getElementById('s-exp').textContent = String(ec);
			document.getElementById('s-time').textContent = new Date(Number(data.fetchedAt || Date.now())).toLocaleTimeString();
			metaEl.textContent = 'Window: next ' + state.windowDays + 'd + 30d grace';
			var from = state.total === 0 ? 0 : state.offset + 1;
			var to = Math.min(state.offset + LIMIT, state.total);
			countEl.textContent = from + '-' + to + ' of ' + state.total;
			prevEl.disabled = state.offset <= 0; nextEl.disabled = state.offset + LIMIT >= state.total;
		}

		async function loadAct() {
			actRowsEl.innerHTML = '<tr><td colspan="9" class="muted">Loading activity...</td></tr>';
			var params = new URLSearchParams();
			params.set('limit', String(LIMIT)); params.set('offset', String(state.actOff));
			params.set('minBlockTimeMs', String(state.minExpirationMs)); params.set('_', String(Date.now()));
			if (state.q) params.set('q', state.q);
			var res = await fetch('/api/grace-activity?' + params.toString());
			if (!res.ok) { actRowsEl.innerHTML = '<tr><td colspan="9" class="muted">Failed to load.</td></tr>'; return; }
			var data = await res.json().catch(function() { return null; });
			if (!data || !Array.isArray(data.actions)) { actRowsEl.innerHTML = '<tr><td colspan="9" class="muted">Invalid response.</td></tr>'; return; }
			state.actTotal = Number(data.total || 0); state.actLoaded = true;
			renderAct(data.actions);
			document.getElementById('sa-total').textContent = String(state.actTotal);
			var buys = 0, lists = 0, bids = 0;
			for (var i = 0; i < data.actions.length; i++) { var t = data.actions[i].type; if (t === 'buy' || t === 'sale') buys++; else if (t === 'list') lists++; else if (t === 'bid') bids++; }
			document.getElementById('sa-buys').textContent = String(buys);
			document.getElementById('sa-lists').textContent = String(lists);
			document.getElementById('sa-bids').textContent = String(bids);
			var from = state.actTotal === 0 ? 0 : state.actOff + 1;
			var to = Math.min(state.actOff + LIMIT, state.actTotal);
			actCountEl.textContent = from + '-' + to + ' of ' + state.actTotal;
			actPrevEl.disabled = state.actOff <= 0; actNextEl.disabled = state.actOff + LIMIT >= state.actTotal;
		}

		function switchTab(tab) {
			state.tab = tab;
			document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
			document.getElementById('panel-listings').classList.toggle('active', tab === 'listings');
			document.getElementById('panel-activity').classList.toggle('active', tab === 'activity');
			statsL.style.display = tab === 'listings' ? '' : 'none';
			statsA.style.display = tab === 'activity' ? '' : 'none';
			updateUrl();
			if (tab === 'activity' && !state.actLoaded) loadAct();
		}

		document.querySelectorAll('.tab-btn').forEach(function(b) { b.addEventListener('click', function() { switchTab(b.getAttribute('data-tab')); }); });
		qEl.addEventListener('input', function() { state.q = String(qEl.value || '').trim(); state.offset = 0; state.actOff = 0; state.actLoaded = false; if (debounceTimer) clearTimeout(debounceTimer); debounceTimer = setTimeout(function() { load(); if (state.tab === 'activity') loadAct(); }, 250); });
		statusEl.addEventListener('change', function() { state.status = statusEl.value === 'grace' || statusEl.value === 'expiring' ? statusEl.value : 'all'; state.offset = 0; load(); });
		refreshEl.addEventListener('click', function() { if (state.tab === 'activity') { state.actLoaded = false; loadAct(); } else load(); });
		prevEl.addEventListener('click', function() { state.offset = Math.max(0, state.offset - LIMIT); load(); });
		nextEl.addEventListener('click', function() { state.offset += LIMIT; load(); });
		actPrevEl.addEventListener('click', function() { state.actOff = Math.max(0, state.actOff - LIMIT); loadAct(); });
		actNextEl.addEventListener('click', function() { state.actOff += LIMIT; loadAct(); });

		hydrateFromUrl();
		window.loadBm();
		if (state.tab === 'activity') switchTab('activity'); else load();
	})();
	</script>

	<style>${generateMessagingChatCss()}</style>
	<div id="messaging-chat-root"></div>
	<script>${generateMessagingChatJs({ page: 'landing', network: network || 'mainnet' })}</script>
</body>
</html>`
}

export function generateCancelBidPage(env: Env, bidId: string): string {
	const escapedBidId = bidId.replace(/[^a-fA-F0-9x]/g, '')
	return `<!DOCTYPE html>
<html lang="en"><head>
${generateExtensionNoiseFilter()}
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cancel Bid - sui.ski</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#060610;color:#e0e0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:linear-gradient(135deg,#0c0c1a 0%,#101028 100%);border:1px solid rgba(120,100,200,.2);border-radius:16px;padding:32px;max-width:480px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.6)}
h1{font-size:1.4rem;margin-bottom:8px;color:#c8c0f0}
.subtitle{color:#888;font-size:.85rem;margin-bottom:24px}
.field{margin-bottom:16px}
.field label{display:block;font-size:.75rem;color:#999;margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px}
.field input{width:100%;background:#0a0a18;border:1px solid rgba(120,100,200,.2);border-radius:8px;padding:10px 12px;color:#e0e0e8;font-family:monospace;font-size:.85rem}
.field input:focus{outline:none;border-color:rgba(120,100,200,.5)}
button{width:100%;padding:14px;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:all .2s}
button.primary{background:linear-gradient(135deg,#6040c0,#4020a0);color:#fff}
button.primary:hover{filter:brightness(1.15)}
button:disabled{opacity:.5;cursor:not-allowed}
.status{margin-top:16px;padding:10px 12px;border-radius:8px;font-size:.85rem;display:none}
.status.error{display:block;background:rgba(200,60,60,.15);border:1px solid rgba(200,60,60,.3);color:#f08080}
.status.success{display:block;background:rgba(60,200,120,.15);border:1px solid rgba(60,200,120,.3);color:#80f0a0}
.status.info{display:block;background:rgba(100,100,200,.15);border:1px solid rgba(100,100,200,.3);color:#a0a0f0}
a{color:#a090e0;text-decoration:none}
a:hover{text-decoration:underline}
.back{display:inline-block;margin-bottom:16px;font-size:.8rem;color:#888}
.back:hover{color:#c8c0f0}
${generateWalletUiCss()}
</style>
</head><body>
<div class="card">
<a class="back" href="/">&larr; Back to sui.ski</a>
<h1>Cancel TradePort Bid</h1>
<p class="subtitle">Cancel an active bid and return locked SUI to your wallet.</p>
<div class="field">
<label>Bid Object ID</label>
<input id="bidId" type="text" placeholder="0x..." value="${escapedBidId}">
</div>
<button id="cancelBtn" class="primary">Connect Wallet</button>
<div id="status" class="status"></div>
</div>
<div id="wk-modal"></div>

<script>
${generateWalletKitJs({ network: env.SUI_NETWORK, autoConnect: true })}
${generateWalletTxJs()}
${generateWalletUiJs({ onConnect: 'onWalletConnect', onDisconnect: '' })}

var statusEl = document.getElementById('status');
var cancelBtn = document.getElementById('cancelBtn');
var bidInput = document.getElementById('bidId');
var connectedAddress = null;

function showStatus(msg, type) {
	statusEl.className = 'status ' + type;
	statusEl.innerHTML = msg;
}

function onWalletConnect() {
	var conn = SuiWalletKit.$connection.value;
	if (conn && conn.address) {
		connectedAddress = conn.address;
		cancelBtn.textContent = 'Cancel Bid';
	}
}

SuiWalletKit.$connection.listen(function(conn) {
	if (conn && conn.address) {
		onWalletConnect();
	} else {
		connectedAddress = null;
		cancelBtn.textContent = 'Connect Wallet';
	}
});

cancelBtn.addEventListener('click', async function() {
	if (!connectedAddress) {
		SuiWalletKit.openModal();
		return;
	}
	var bid = (bidInput.value || '').trim();
	if (!bid || !bid.startsWith('0x')) {
		showStatus('Enter a valid bid object ID', 'error');
		return;
	}
	cancelBtn.disabled = true;
	cancelBtn.textContent = 'Building transaction...';
	showStatus('Building cancel transaction...', 'info');

	try {
		var res = await fetch('/api/marketplace/cancel-bid', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ bidId: bid, buyerAddress: connectedAddress }),
		});
		var data = await res.json();
		if (!res.ok || data.error) throw new Error(data.error || 'API error');

		showStatus('Waiting for wallet approval...', 'info');

		var Tx = await import('https://esm.sh/@mysten/sui@2.4.0/transactions?bundle').then(function(m) { return m.Transaction; });
		var tx = Tx.from(data.txBytes);

		var result = await SuiWalletKit.signAndExecute(tx, {
			txOptions: { showEffects: true },
		});

		var digest = result.digest || (result.result && result.result.digest) || '';
		if (digest) {
			showStatus(
				'Bid cancelled! SUI returned to your wallet.<br>' +
				'<a href="https://suiscan.xyz/mainnet/tx/' + digest + '" target="_blank">View on Suiscan</a> | ' +
				'<a href="https://suivision.xyz/txblock/' + digest + '" target="_blank">View on SuiVision</a>',
				'success'
			);
		} else {
			showStatus('Bid cancelled!', 'success');
		}
	} catch (e) {
		var msg = (e && e.message) || 'Transaction failed';
		if (msg.includes('rejected') || msg.includes('cancelled')) {
			showStatus('Transaction cancelled by user', 'error');
		} else {
			showStatus('Failed: ' + msg, 'error');
		}
	} finally {
		cancelBtn.disabled = false;
		cancelBtn.textContent = 'Cancel Bid';
	}
});

SuiWalletKit.detectWallets().then(function() {
	var conn = SuiWalletKit.$connection.value;
	if (conn && conn.address) onWalletConnect();
});
SuiWalletKit.renderModal('wk-modal');
</script>
</body></html>`
}
