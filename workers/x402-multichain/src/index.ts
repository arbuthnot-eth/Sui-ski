import { HTTPFacilitatorClient } from '@x402/core/http'
import { Hono } from 'hono'
import type {
	Env,
	HealthResponse,
	PaymentRequirementsResponse,
	SettleRequest,
	SettleResponse,
	VerifyRequest,
	VerifyResponse,
} from './types'

const CDP_FACILITATOR_DEFAULT = 'https://x402.org/facilitator'
const MAX_TIMEOUT_SECONDS = 120
const X402_VERSION = 2

type AppEnv = { Bindings: Env }
const app = new Hono<AppEnv>()

function getFacilitatorClient(env: Env): HTTPFacilitatorClient {
	const url = env.CDP_FACILITATOR_URL || CDP_FACILITATOR_DEFAULT
	if (!env.CDP_API_KEY) {
		return new HTTPFacilitatorClient({ url })
	}
	return new HTTPFacilitatorClient({
		url,
		createAuthHeaders: async () => {
			const authHeader = { Authorization: `Bearer ${env.CDP_API_KEY}` }
			return {
				verify: authHeader,
				settle: authHeader,
				supported: authHeader,
			}
		},
	})
}

function isEvmNetwork(network: string): boolean {
	return network.startsWith('eip155:')
}

function isSvmNetwork(network: string): boolean {
	return network.startsWith('solana:')
}

function isSupportedNetwork(network: string): boolean {
	return isEvmNetwork(network) || isSvmNetwork(network)
}

function jsonResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	})
}

app.options('*', () => {
	return new Response(null, {
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
			'Access-Control-Max-Age': '86400',
		},
	})
})

app.post('/verify', async (c) => {
	let body: VerifyRequest
	try {
		body = await c.req.json()
	} catch {
		return jsonResponse({ isValid: false, invalidReason: 'Invalid JSON body' } satisfies VerifyResponse, 400)
	}

	const { paymentPayload, paymentRequirements } = body
	if (!paymentPayload || !paymentRequirements) {
		return jsonResponse(
			{ isValid: false, invalidReason: 'Missing paymentPayload or paymentRequirements' } satisfies VerifyResponse,
			400,
		)
	}

	const network = paymentRequirements.network
	if (!isSupportedNetwork(network)) {
		return jsonResponse(
			{
				isValid: false,
				invalidReason: `Unsupported network: ${network}. Supported: eip155:*, solana:*`,
			} satisfies VerifyResponse,
			400,
		)
	}

	try {
		const client = getFacilitatorClient(c.env)
		const result = await client.verify(paymentPayload, paymentRequirements)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Verification failed'
		return jsonResponse({ isValid: false, invalidReason: message } satisfies VerifyResponse, 502)
	}
})

app.post('/settle', async (c) => {
	let body: SettleRequest
	try {
		body = await c.req.json()
	} catch {
		return jsonResponse(
			{ success: false, errorReason: 'Invalid JSON body', transaction: '', network: '' } satisfies SettleResponse,
			400,
		)
	}

	const { paymentPayload, paymentRequirements } = body
	if (!paymentPayload || !paymentRequirements) {
		return jsonResponse(
			{
				success: false,
				errorReason: 'Missing paymentPayload or paymentRequirements',
				transaction: '',
				network: '',
			} satisfies SettleResponse,
			400,
		)
	}

	const network = paymentRequirements.network
	if (!isSupportedNetwork(network)) {
		return jsonResponse(
			{
				success: false,
				errorReason: `Unsupported network: ${network}`,
				transaction: '',
				network,
			} satisfies SettleResponse,
			400,
		)
	}

	try {
		const client = getFacilitatorClient(c.env)
		const result = await client.settle(paymentPayload, paymentRequirements)
		return jsonResponse(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Settlement failed'
		return jsonResponse(
			{ success: false, errorReason: message, transaction: '', network } satisfies SettleResponse,
			502,
		)
	}
})

app.get('/payment-requirements', async (c) => {
	const chainsParam = c.req.query('chains') || 'base,solana'
	const amount = c.req.query('amount') || '1000000'
	const payToBase = c.req.query('payToBase') || c.env.BASE_PAY_TO
	const payToSol = c.req.query('payToSol') || c.env.SOL_PAY_TO

	const chains = chainsParam.split(',').map((s) => s.trim().toLowerCase())
	const accepts: PaymentRequirementsResponse['accepts'] = []

	if (chains.includes('base') && payToBase) {
		accepts.push({
			scheme: 'exact',
			network: c.env.BASE_NETWORK,
			asset: c.env.BASE_USDC_ADDRESS,
			amount,
			payTo: payToBase,
			maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
		})
	}

	if (chains.includes('solana') && payToSol) {
		accepts.push({
			scheme: 'exact',
			network: c.env.SOL_NETWORK,
			asset: c.env.SOL_USDC_MINT,
			amount,
			payTo: payToSol,
			maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
		})
	}

	if (!accepts.length) {
		return jsonResponse(
			{ error: 'No chains configured. Set BASE_PAY_TO and/or SOL_PAY_TO.' },
			503,
		)
	}

	return jsonResponse({ x402Version: X402_VERSION, accepts } satisfies { x402Version: number } & PaymentRequirementsResponse)
})

app.get('/supported', async (c) => {
	try {
		const client = getFacilitatorClient(c.env)
		const supported = await client.getSupported()
		return jsonResponse(supported)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch supported'
		return jsonResponse({ error: message }, 502)
	}
})

app.get('/health', async (c) => {
	const hasBase = !!c.env.BASE_PAY_TO
	const hasSol = !!c.env.SOL_PAY_TO
	const facilitatorUrl = c.env.CDP_FACILITATOR_URL || CDP_FACILITATOR_DEFAULT

	let facilitatorReachable = false
	try {
		const client = getFacilitatorClient(c.env)
		await client.getSupported()
		facilitatorReachable = true
	} catch {
		facilitatorReachable = false
	}

	const response: HealthResponse = {
		status: facilitatorReachable ? 'ok' : 'degraded',
		chains: {
			base: hasBase,
			solana: hasSol,
		},
		facilitator: facilitatorUrl,
		timestamp: Date.now(),
	}

	return jsonResponse(response)
})

export default app
