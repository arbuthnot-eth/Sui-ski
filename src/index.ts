import { Hono } from 'hono'
import { WalletSession } from './durable-objects/wallet-session'
import { handleAppRequest } from './handlers/app'
import { generateDashboardPage } from './handlers/dashboard'
import { agentGraceVaultRoutes } from './handlers/grace-vault-agent'
import { apiRoutes, landingPageHTML } from './handlers/landing'
import { generateProfilePage } from './handlers/profile'
import { generateSkiPage } from './handlers/ski'
import { generateSkiSignPage } from './handlers/ski-sign'
import { solSwapRoutes } from './handlers/sol-swap'
import { agentSubnameCapRoutes, subnameCapRoutes } from './handlers/subnamecap'
import { generateSubnameCapPage } from './handlers/subnamecap-ui'
import { vaultRoutes } from './handlers/vault'
import {
	handleWalletChallenge,
	handleWalletCheck,
	handleWalletConnect,
	handleWalletDisconnect,
} from './handlers/wallet-api'
import { resolveContent, resolveDirectContent } from './resolvers/content'
import { handleRPCRequest } from './resolvers/rpc'
import { resolveSuiNS } from './resolvers/suins'
import type { Env, ParsedSubdomain, SuiNSRecord } from './types'
import {
	generateBrandOgPng,
	generateBrandOgSvg,
	generateFaviconSvg,
	generateProfileOgSvg,
} from './utils/og-image'
import { errorResponse, htmlResponse, jsonResponse, notFoundPage } from './utils/response'
import { ensureRpcEnv } from './utils/rpc'
import { isTwitterPreviewBot } from './utils/social'
import { parseSubdomain } from './utils/subdomain'

export { WalletSession }

type AppEnv = {
	Bindings: Env
	Variables: {
		parsed: ParsedSubdomain
		hostname: string
		env: Env
		session: {
			address: string | null
			walletName: string | null
			verified: boolean
		}
	}
}

const app = new Hono<AppEnv>()

app.use('*', async (c, next) => {
	if (c.req.method === 'OPTIONS') {
		const requestedHeaders = c.req.header('Access-Control-Request-Headers') || 'Content-Type'
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Headers': requestedHeaders,
				'Access-Control-Max-Age': '86400',
			},
		})
	}
	await next()
})

app.use('*', async (c, next) => {
	const url = new URL(c.req.url)
	const testHost = url.searchParams.get('host') || c.req.header('X-Host')
	const hostname = testHost || url.hostname
	const parsed = parseSubdomain(hostname)

	let env = c.env
	if (parsed.networkOverride) {
		env = { ...env, SUI_NETWORK: parsed.networkOverride, SUI_RPC_URL: '' }
	}
	c.set('env', ensureRpcEnv(env))
	c.set('parsed', parsed)
	c.set('hostname', hostname)
	await next()
})

// SKI Middleware (Sui-Key-In ubiquitous authentication)
app.use('*', async (c, next) => {
	const cookies = c.req.header('Cookie') || ''
	const sessionCookie = cookies.split('; ').find((row) => row.startsWith('session_id='))
	const addrCookie = cookies.split('; ').find((row) => row.startsWith('wallet_address='))
	const nameCookie = cookies.split('; ').find((row) => row.startsWith('wallet_name='))

	const sessionId = sessionCookie?.split('=')[1]
	const walletAddress = addrCookie?.split('=')[1]
	const walletName = nameCookie?.split('=')[1]

	const session = {
		address: walletAddress || null,
		walletName: walletName || null,
		verified: false,
	}

	if (sessionId) {
		const stub = c.env.WALLET_SESSIONS.getByName('global')
		const info = await stub.getSessionInfo(sessionId)
		if (info) {
			session.address = info.address
			session.verified = info.verified
		}
	}

	c.set('session', session)
	await next()
})

app.post('/api/wallet/challenge', async (c) => {
	return handleWalletChallenge(c.req.raw, c.env)
})

app.post('/api/wallet/connect', async (c) => {
	return handleWalletConnect(c.req.raw, c.env)
})

app.get('/api/wallet/check', async (c) => {
	return handleWalletCheck(c.req.raw, c.env)
})

app.post('/api/wallet/disconnect', async (c) => {
	return handleWalletDisconnect(c.req.raw, c.env)
})

app.use('*', async (c, next) => {
	const parsed = c.get('parsed')
	const env = c.get('env')

	switch (parsed.type) {
		case 'rpc':
			return handleRPCRequest(c.req.raw, env)
		case 'app':
			return handleAppRequest(c.req.raw, env, c.get('session'))
		case 'dashboard':
			return htmlResponse(generateDashboardPage(env))
		case 'content': {
			const result = await resolveDirectContent(parsed.subdomain, env)
			if (!result.found) return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
			return result.data as Response
		}
		case 'mvr': {
			const mvrInfo = parsed.mvrInfo
			if (!mvrInfo) return errorResponse('Missing MVR info', 'INVALID_MVR', 400)
			return jsonResponse({
				mvrPackage: `@${mvrInfo.suinsName}/${mvrInfo.packageName}`,
				version: mvrInfo.version || 'latest',
				message: 'MVR package resolution coming soon',
			})
		}
		default:
			await next()
	}
})

app.all('/api/app/*', async (c) => handleAppRequest(c.req.raw, c.get('env'), c.get('session')))
app.use('/api/agents/subnamecap/*', async (c, next) => {
	if (c.get('parsed').type !== 'root') return c.notFound()
	await next()
})
app.route('/api/agents/subnamecap', agentSubnameCapRoutes)
app.use('/api/agents/grace-vault/*', async (c, next) => {
	if (c.get('parsed').type !== 'root') return c.notFound()
	await next()
})
app.route('/api/agents/grace-vault', agentGraceVaultRoutes)
app.all('/api/agents/*', async (c) => handleAppRequest(c.req.raw, c.get('env'), c.get('session')))
app.all('/api/ika/*', async (c) => handleAppRequest(c.req.raw, c.get('env'), c.get('session')))
app.all('/api/llm/*', async (c) => handleAppRequest(c.req.raw, c.get('env'), c.get('session')))

app.route('/api/sol-swap', solSwapRoutes)
app.route('/api/subnamecap', subnameCapRoutes)
app.route('/api/vault', vaultRoutes)
app.route('/api', apiRoutes)

const SVG_HEADERS = { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=604800' }

app.get('/favicon.svg', () => new Response(generateFaviconSvg(), { headers: SVG_HEADERS }))

app.get('/og-image.svg', () => new Response(generateBrandOgSvg(), { headers: SVG_HEADERS }))

const PNG_HEADERS = { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' }

app.get('/og-image.png', () => new Response(generateBrandOgPng(), { headers: PNG_HEADERS }))

app.get('/og/:name{.+\\.svg}', (c) => {
	const rawName = c.req.param('name').replace(/\.svg$/, '')
	const name = decodeURIComponent(rawName)
	return new Response(generateProfileOgSvg(name, ''), { headers: SVG_HEADERS })
})

app.get('/walrus/:id{.+}', async (c) => {
	if (c.get('parsed').type !== 'root') return c.notFound()
	const subdomain = `walrus-${c.req.param('id')}`
	const result = await resolveDirectContent(subdomain, c.get('env'))
	if (!result.found) return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
	return result.data as Response
})

app.get('/ipfs/:id{.+}', async (c) => {
	if (c.get('parsed').type !== 'root') return c.notFound()
	const subdomain = `ipfs-${c.req.param('id')}`
	const result = await resolveDirectContent(subdomain, c.get('env'))
	if (!result.found) return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
	return result.data as Response
})

app.get('/in', async (c) => {
	return htmlResponse(generateSkiPage(c.get('env'), c.get('session')))
})

app.get('/sign', async (c) => {
	return htmlResponse(generateSkiSignPage(c.get('env')))
})

app.get('/subnamecap', async (c) => {
	if (c.get('parsed').type !== 'root') return c.notFound()
	return htmlResponse(generateSubnameCapPage(c.get('env')))
})

app.all('/app', async (c) => {
	if (c.get('parsed').type !== 'root') return c.notFound()
	return handleAppRequest(c.req.raw, c.get('env'), c.get('session'))
})

app.all('/app/*', async (c) => {
	if (c.get('parsed').type !== 'root') return c.notFound()
	return handleAppRequest(c.req.raw, c.get('env'), c.get('session'))
})

app.all('*', async (c) => {
	const parsed = c.get('parsed')
	const env = c.get('env')
	const url = new URL(c.req.url)

	if (parsed.type === 'root') {
		const canonicalUrl = `${url.protocol}//${url.hostname}${url.pathname || '/'}`
		return htmlResponse(
			landingPageHTML(env.SUI_NETWORK, {
				canonicalUrl,
				rpcUrl: env.SUI_RPC_URL,
				network: env.SUI_NETWORK,
				session: c.get('session'),
			}),
		)
	}

	if (parsed.type === 'suins') {
		if (url.pathname === '/favicon.svg') {
			return new Response(generateFaviconSvg(), { headers: SVG_HEADERS })
		}
		if (url.pathname === '/og-image.svg') {
			return new Response(generateBrandOgSvg(), { headers: SVG_HEADERS })
		}
		if (url.pathname.startsWith('/og/') && url.pathname.endsWith('.svg')) {
			const nameSlug = url.pathname.slice(4, -4)
			const ogResult = await resolveSuiNS(parsed.subdomain, env)
			const ogAddr =
				ogResult.found && ogResult.data && 'address' in ogResult.data
					? (ogResult.data as SuiNSRecord).address
					: ''
			return new Response(generateProfileOgSvg(decodeURIComponent(nameSlug), ogAddr), {
				headers: SVG_HEADERS,
			})
		}

		const hostname = c.get('hostname')
		const userAgent = c.req.header('user-agent')
		const skipCache = url.searchParams.has('nocache') || url.searchParams.has('refresh')
		const result = await resolveSuiNS(parsed.subdomain, env, skipCache)

		if (!result.found) return notFoundPage(parsed.subdomain, env, result.available)

		const record = result.data as SuiNSRecord
		const normalizedPath = url.pathname || '/'
		const canonicalUrl = `${url.protocol}//${hostname}${normalizedPath}`
		const profileOptions = {
			canonicalUrl,
			hostname,
			inGracePeriod: result.inGracePeriod || false,
			session: c.get('session'),
		}
		const shouldServeProfileForTwitter =
			isTwitterPreviewBot(userAgent ?? null) && normalizedPath === '/'
		let cachedProfileHtml: string | null = null
		const renderProfile = () => {
			if (cachedProfileHtml === null) {
				cachedProfileHtml = generateProfilePage(parsed.subdomain, record, env, profileOptions)
			}
			return cachedProfileHtml
		}

		if (url.pathname === '/json' || url.searchParams.has('json')) return jsonResponse(record)
		if (url.pathname === '/home' || url.searchParams.has('profile'))
			return htmlResponse(renderProfile())
		if (shouldServeProfileForTwitter) return htmlResponse(renderProfile())

		if (record.content) {
			const contentResponse = await resolveContent(record.content, env)
			if (!contentResponse.ok && (url.pathname === '/' || url.pathname === '')) {
				return htmlResponse(renderProfile())
			}
			return contentResponse
		}

		return htmlResponse(renderProfile())
	}

	return errorResponse('Unknown route type', 'UNKNOWN_ROUTE', 400)
})

app.onError((err, _c) => {
	console.error('Gateway error:', err)
	const message = err instanceof Error ? err.message : 'Unknown error'
	return errorResponse(`Gateway error: ${message}`, 'GATEWAY_ERROR', 500)
})

export default app
