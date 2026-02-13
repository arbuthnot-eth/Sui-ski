import type { RoutesConfig } from '@x402/core/server'
import type { Network } from '@x402/core/types'
import { paymentMiddleware, x402ResourceServer } from '@x402/hono'
import { Hono } from 'hono'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { resolveX402Recipient } from '../utils/x402-sui'
import { ExactSuiFacilitatorScheme } from '../x402/exact-sui-facilitator'
import { ExactSuiServerScheme } from '../x402/exact-sui-server'
import { LocalFacilitatorClient } from '../x402/local-facilitator-client'
import { SuiSigner } from '../x402/sui-signer'

const SUI_ASSET = '0x2::sui::SUI'

type PremiumEnv = {
	Bindings: Env
	Variables: {
		env: Env
	}
}

function buildPremiumRoutes(payTo: string, network: Network): RoutesConfig {
	return {
		'POST /marketplace-batch': {
			accepts: {
				scheme: 'exact',
				network,
				payTo,
				price: { asset: SUI_ASSET, amount: '500000000' },
				maxTimeoutSeconds: 120,
			},
			description: 'Batch marketplace data for up to 20 names',
			mimeType: 'application/json',
		},
		'GET /expiring-names': {
			accepts: {
				scheme: 'exact',
				network,
				payTo,
				price: { asset: SUI_ASSET, amount: '200000000' },
				maxTimeoutSeconds: 120,
			},
			description: 'Real-time expiring SuiNS names list',
			mimeType: 'application/json',
		},
		'GET /suggest-names': {
			accepts: {
				scheme: 'exact',
				network,
				payTo,
				price: { asset: SUI_ASSET, amount: '100000000' },
				maxTimeoutSeconds: 120,
			},
			description: 'AI-powered name suggestions',
			mimeType: 'application/json',
		},
		'GET /owned-names': {
			accepts: {
				scheme: 'exact',
				network,
				payTo,
				price: { asset: SUI_ASSET, amount: '100000000' },
				maxTimeoutSeconds: 120,
			},
			description: 'Portfolio lookup for owned names',
			mimeType: 'application/json',
		},
		'GET /nft-details': {
			accepts: {
				scheme: 'exact',
				network,
				payTo,
				price: { asset: SUI_ASSET, amount: '100000000' },
				maxTimeoutSeconds: 120,
			},
			description: 'NFT metadata details',
			mimeType: 'application/json',
		},
		'GET /marketplace/:name': {
			accepts: {
				scheme: 'exact',
				network,
				payTo,
				price: { asset: SUI_ASSET, amount: '100000000' },
				maxTimeoutSeconds: 120,
			},
			description: 'Per-name marketplace data',
			mimeType: 'application/json',
		},
	}
}

let cachedMiddleware: ReturnType<typeof paymentMiddleware> | null = null
let cachedPayTo: string | null = null
let cachedNetwork: string | null = null

export function createPremiumRoutes(): Hono<PremiumEnv> {
	const premium = new Hono<PremiumEnv>()

	premium.use('*', async (c, next) => {
		const env = c.get('env')

		if (!env.SUI_AGENT_PRIVATE_KEY) {
			return jsonResponse({ error: 'Premium API not configured', code: 'PREMIUM_UNAVAILABLE' }, 503)
		}

		const network: Network = `sui:${env.SUI_NETWORK}`
		const payTo = await resolveX402Recipient(env)

		if (!payTo) {
			return jsonResponse(
				{ error: 'Payment recipient unavailable', code: 'RECIPIENT_UNAVAILABLE' },
				503,
			)
		}

		if (!cachedMiddleware || cachedPayTo !== payTo || cachedNetwork !== network) {
			const signer = new SuiSigner(env.SUI_AGENT_PRIVATE_KEY)
			const rpcUrl = env.SUI_RPC_URL
			const facilitatorScheme = new ExactSuiFacilitatorScheme(signer, rpcUrl, network)
			const facilitatorClient = new LocalFacilitatorClient([
				{ network, facilitator: facilitatorScheme },
			])
			const routes = buildPremiumRoutes(payTo, network)
			const resourceServer = new x402ResourceServer(facilitatorClient).register(
				network,
				new ExactSuiServerScheme(),
			)

			cachedMiddleware = paymentMiddleware(routes, resourceServer, undefined, undefined, false)
			cachedPayTo = payTo
			cachedNetwork = network
		}

		return cachedMiddleware(c, next)
	})

	premium.post('/marketplace-batch', async (c) => {
		const body = await c.req.json()
		const { names } = body as { names?: string[] }
		if (!names || !Array.isArray(names) || names.length === 0) {
			return jsonResponse({ error: 'names array required' }, 400)
		}
		const internalUrl = new URL(c.req.url)
		internalUrl.pathname = '/api/marketplace-batch'
		const internalReq = new Request(internalUrl.toString(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ names }),
		})
		const { apiRoutes } = await import('./landing')
		return apiRoutes.fetch(internalReq, c.env)
	})

	premium.get('/expiring-names', async (c) => {
		const { handleExpiringNames } = await import('./expiring-names')
		return handleExpiringNames(c.get('env'))
	})

	premium.get('/suggest-names', async (c) => {
		const query = c.req.query('q')
		if (!query || query.length < 3) {
			return jsonResponse({ error: 'Query parameter required (min 3 chars)' }, 400)
		}
		const internalUrl = new URL(c.req.url)
		internalUrl.pathname = '/api/suggest-names'
		const internalReq = new Request(internalUrl.toString())
		const { apiRoutes } = await import('./landing')
		return apiRoutes.fetch(internalReq, c.env)
	})

	premium.get('/owned-names', async (c) => {
		const address = c.req.query('address')
		if (!address || !address.startsWith('0x')) {
			return jsonResponse({ error: 'Valid Sui address required (address query param)' }, 400)
		}
		const internalUrl = new URL(c.req.url)
		internalUrl.pathname = '/api/owned-names'
		const internalReq = new Request(internalUrl.toString())
		const { apiRoutes } = await import('./landing')
		return apiRoutes.fetch(internalReq, c.env)
	})

	premium.get('/nft-details', async (c) => {
		const objectId = c.req.query('objectId')
		if (!objectId) return jsonResponse({ error: 'objectId parameter required' }, 400)
		const internalUrl = new URL(c.req.url)
		internalUrl.pathname = '/api/nft-details'
		const internalReq = new Request(internalUrl.toString())
		const { apiRoutes } = await import('./landing')
		return apiRoutes.fetch(internalReq, c.env)
	})

	premium.get('/marketplace/:name', async (c) => {
		const name = c.req.param('name')
		if (!name) return jsonResponse({ error: 'Name parameter required' }, 400)
		const internalUrl = new URL(c.req.url)
		internalUrl.pathname = `/api/marketplace/${name}`
		const internalReq = new Request(internalUrl.toString())
		const { apiRoutes } = await import('./landing')
		return apiRoutes.fetch(internalReq, c.env)
	})

	return premium
}
