import type { Context, MiddlewareHandler } from 'hono'
import type { Env, X402SuiPaymentPayload, X402VerifiedPayment, X402VerifierProvider } from '../types'
import { jsonResponse } from './response'
import { resolveX402Recipient, X402SuiPaymentHandler } from './x402-sui'

const DEFAULT_AMOUNT_MIST = '1000000000'
const EXPOSE_HEADERS = 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-X402-PROVIDER'
const SUPPORTED_PROVIDERS: X402VerifierProvider[] = ['cloudflare', 'coinbase', 'multichain']

interface X402MiddlewareConfig {
	description: string
	amountMist?: string
	providers?: X402VerifierProvider[]
	requireAllProviders?: boolean
	allowBypassWhenUnconfigured?: boolean
}

type X402Env = {
	Bindings: Env
	Variables: {
		env: Env
		x402Payment?: X402VerifiedPayment
	}
}

interface MultichainPaymentPayload {
	x402Version: number
	accepted: {
		scheme: string
		network: string
		asset: string
		amount: string
		payTo: string
		maxTimeoutSeconds: number
		extra?: Record<string, unknown>
	}
	payload: Record<string, unknown>
	resource?: { url: string; description: string; mimeType: string }
}

function normalizeProviders(values: string[]): X402VerifierProvider[] {
	const result: X402VerifierProvider[] = []
	for (const value of values) {
		const candidate = value.trim().toLowerCase() as X402VerifierProvider
		if (!candidate) continue
		if (SUPPORTED_PROVIDERS.includes(candidate) && !result.includes(candidate)) {
			result.push(candidate)
		}
	}
	return result
}

export function resolveX402Providers(
	env: Env,
	overrideProviders?: X402VerifierProvider[],
): X402VerifierProvider[] {
	if (overrideProviders?.length) {
		return normalizeProviders(overrideProviders)
	}
	const configured = normalizeProviders((env.X402_VERIFIERS || 'cloudflare').split(','))
	if (configured.length) return configured
	return ['cloudflare']
}

function parseRequestedProviders(
	headerValue: string | undefined,
	allowedProviders: X402VerifierProvider[],
): { providers: X402VerifierProvider[]; error?: string } {
	if (!headerValue) return { providers: allowedProviders }

	const raw = headerValue.trim().toLowerCase()
	const requested = normalizeProviders(raw === 'both' ? [...SUPPORTED_PROVIDERS] : raw.split(','))
	if (!requested.length) {
		return { providers: [], error: 'Unsupported x402 provider in X-X402-Provider header' }
	}

	const providers = requested.filter((provider) => allowedProviders.includes(provider))
	if (!providers.length) {
		return { providers: [], error: 'Requested x402 provider is not enabled on this endpoint' }
	}
	return { providers }
}

function isMultichainNetwork(network: string): boolean {
	return network.startsWith('eip155:') || network.startsWith('solana:')
}

function extractMultichainPayment(header: string): MultichainPaymentPayload | null {
	try {
		const decoded = atob(header)
		const parsed = JSON.parse(decoded) as MultichainPaymentPayload
		if (!parsed.x402Version || !parsed.accepted?.scheme || !parsed.accepted?.network) return null
		if (parsed.accepted.scheme !== 'exact') return null
		if (!isMultichainNetwork(parsed.accepted.network)) return null
		return parsed
	} catch {
		return null
	}
}

async function verifyWithMultichain(
	env: Env,
	paymentHeader: string,
	payment: MultichainPaymentPayload,
): Promise<{ valid: boolean; error?: string; payer?: string; digest?: string }> {
	if (!env.X402_MULTICHAIN) {
		return { valid: false, error: 'Multi-chain verifier service binding not configured' }
	}

	try {
		const response = await env.X402_MULTICHAIN.fetch('https://internal/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				paymentPayload: payment,
				paymentRequirements: payment.accepted,
			}),
		})

		const body = (await response.json()) as {
			isValid?: boolean
			invalidReason?: string
			payer?: string
		}

		if (!response.ok || !body.isValid) {
			return { valid: false, error: body.invalidReason || `Verifier returned ${response.status}` }
		}

		const digest = typeof payment.payload?.digest === 'string'
			? payment.payload.digest
			: typeof payment.payload?.transaction === 'string'
				? payment.payload.transaction
				: paymentHeader.slice(0, 16)

		return { valid: true, payer: body.payer, digest }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Multi-chain verify error'
		return { valid: false, error: message }
	}
}

async function settleWithMultichain(
	env: Env,
	payment: MultichainPaymentPayload,
): Promise<{ success: boolean; transaction?: string; error?: string }> {
	if (!env.X402_MULTICHAIN) {
		return { success: false, error: 'Multi-chain verifier service binding not configured' }
	}

	try {
		const response = await env.X402_MULTICHAIN.fetch('https://internal/settle', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				paymentPayload: payment,
				paymentRequirements: payment.accepted,
			}),
		})

		const body = (await response.json()) as {
			success?: boolean
			errorReason?: string
			transaction?: string
		}

		if (!response.ok || !body.success) {
			return { success: false, error: body.errorReason || `Settlement returned ${response.status}` }
		}

		return { success: true, transaction: body.transaction }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Multi-chain settle error'
		return { success: false, error: message }
	}
}

async function verifyWithCoinbase(
	env: Env,
	paymentHeader: string,
	expectedAmountMist: string,
	recipientAddress: string,
): Promise<{ valid: boolean; error?: string; payer?: string }> {
	const verifyUrl = env.COINBASE_X402_VERIFY_URL
	if (!verifyUrl) {
		return { valid: false, error: 'Coinbase x402 verifier is not configured' }
	}

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	}
	if (env.COINBASE_X402_API_KEY) {
		headers.Authorization = `Bearer ${env.COINBASE_X402_API_KEY}`
	}

	try {
		const response = await fetch(verifyUrl, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				paymentHeader,
				expected: {
					network: `sui:${env.SUI_NETWORK}`,
					asset: '0x2::sui::SUI',
					amount: expectedAmountMist,
					payTo: recipientAddress,
				},
			}),
		})

		const body = (await response.json().catch(() => null)) as {
			valid?: boolean
			error?: string
			payer?: string
		} | null
		if (!response.ok) {
			return {
				valid: false,
				error: body?.error || `Coinbase verifier returned ${response.status}`,
			}
		}
		if (!body?.valid) {
			return { valid: false, error: body?.error || 'Coinbase verifier rejected payment' }
		}
		return { valid: true, payer: body.payer }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown Coinbase verify error'
		return { valid: false, error: message }
	}
}

export async function fetchMultichainPaymentRequirements(
	env: Env,
	amount: string,
): Promise<Array<{ scheme: string; network: string; asset: string; amount: string; payTo: string; maxTimeoutSeconds: number; extra?: Record<string, unknown> }>> {
	if (!env.X402_MULTICHAIN) return []

	try {
		const params = new URLSearchParams({ chains: 'base,solana', amount })
		if (env.X402_BASE_PAY_TO) params.set('payToBase', env.X402_BASE_PAY_TO)
		if (env.X402_SOL_PAY_TO) params.set('payToSol', env.X402_SOL_PAY_TO)

		const response = await env.X402_MULTICHAIN.fetch(
			`https://internal/payment-requirements?${params}`,
		)

		if (!response.ok) return []

		const body = (await response.json()) as { accepts?: Array<{ scheme: string; network: string; asset: string; amount: string; payTo: string; maxTimeoutSeconds: number; extra?: Record<string, unknown> }> }
		return body.accepts || []
	} catch {
		return []
	}
}

export function x402PaymentMiddleware(config: X402MiddlewareConfig): MiddlewareHandler<X402Env> {
	return async (c: Context<X402Env>, next) => {
		const env = c.get('env')
		const amountMist = config.amountMist || env.X402_AGENT_FEE_MIST || DEFAULT_AMOUNT_MIST
		const allowedProviders = resolveX402Providers(env, config.providers)

		const recipientAddress = await resolveX402Recipient(env)
		if (!recipientAddress) {
			if (config.allowBypassWhenUnconfigured ?? true) {
				await next()
				return
			}
			return jsonResponse(
				{
					error: 'x402 recipient is unavailable',
					code: 'X402_UNAVAILABLE',
				},
				503,
				{
					'Access-Control-Expose-Headers': EXPOSE_HEADERS,
				},
			)
		}

		const handler = new X402SuiPaymentHandler(recipientAddress, env)
		const paymentHeader = c.req.header('PAYMENT-SIGNATURE') || c.req.header('X-PAYMENT')

		if (!paymentHeader) {
			const url = new URL(c.req.url)
			const requirements = handler.createPaymentRequirements(
				url.pathname,
				config.description,
				amountMist,
			)
			const encoded = btoa(JSON.stringify(requirements))

			return jsonResponse(
				{
					error: 'Payment required',
					code: 'X402_PAYMENT_REQUIRED',
					x402Version: 2,
					providers: allowedProviders,
				},
				402,
				{
					'PAYMENT-REQUIRED': encoded,
					'Access-Control-Expose-Headers': EXPOSE_HEADERS,
				},
			)
		}

		const multichainPayment = extractMultichainPayment(paymentHeader)
		if (multichainPayment && allowedProviders.includes('multichain')) {
			const result = await verifyWithMultichain(env, paymentHeader, multichainPayment)
			if (!result.valid) {
				return jsonResponse(
					{
						error: 'Multi-chain payment verification failed',
						code: 'X402_VERIFICATION_FAILED',
						details: [{ provider: 'multichain', error: result.error }],
					},
					402,
					{ 'Access-Control-Expose-Headers': EXPOSE_HEADERS },
				)
			}

			c.set('x402Payment', {
				digest: result.digest || 'multichain',
				payer: result.payer || 'unknown',
				provider: 'multichain',
			})

			await next()

			const settlement = await settleWithMultichain(env, multichainPayment)
			c.header('PAYMENT-RESPONSE', btoa(JSON.stringify(settlement)))
			c.header('X-X402-PROVIDER', 'multichain')
			c.header('Access-Control-Expose-Headers', EXPOSE_HEADERS)
			return
		}

		const payment: X402SuiPaymentPayload | null = handler.extractPayment(paymentHeader)
		if (!payment) {
			return jsonResponse(
				{
					error: 'Invalid payment header',
					code: 'X402_INVALID_PAYMENT',
				},
				402,
				{
					'Access-Control-Expose-Headers': EXPOSE_HEADERS,
				},
			)
		}

		const requestedProviders = parseRequestedProviders(
			c.req.header('X-X402-Provider'),
			allowedProviders,
		)
		if (requestedProviders.error) {
			return jsonResponse(
				{
					error: requestedProviders.error,
					code: 'X402_INVALID_PROVIDER',
					supportedProviders: allowedProviders,
				},
				400,
				{
					'Access-Control-Expose-Headers': EXPOSE_HEADERS,
				},
			)
		}

		const suiProviders = requestedProviders.providers.filter((p) => p !== 'multichain')
		const providerChecks = await Promise.all(
			suiProviders.map(async (provider) => {
				if (provider === 'coinbase') {
					return {
						provider,
						verification: await verifyWithCoinbase(
							env,
							paymentHeader,
							amountMist,
							recipientAddress,
						),
					}
				}
				return {
					provider,
					verification: await handler.verifyPayment(payment, amountMist),
				}
			}),
		)

		const successfulChecks = providerChecks.filter((check) => check.verification.valid)
		const requiresAll = config.requireAllProviders ?? false
		const isVerified = requiresAll
			? successfulChecks.length === suiProviders.length
			: successfulChecks.length > 0

		if (!isVerified) {
			return jsonResponse(
				{
					error: 'Payment verification failed',
					code: 'X402_VERIFICATION_FAILED',
					details: providerChecks.map((check) => ({
						provider: check.provider,
						error: check.verification.error || null,
					})),
				},
				402,
				{
					'Access-Control-Expose-Headers': EXPOSE_HEADERS,
				},
			)
		}

		const winner = successfulChecks[0]
		const payer = winner?.verification.payer || 'unknown'
		c.set('x402Payment', {
			digest: payment.payload.digest,
			payer,
			provider: winner.provider,
		})

		await next()

		const settlement = handler.createSettlementResponse(payment.payload.digest, payer)
		c.header('PAYMENT-RESPONSE', btoa(JSON.stringify(settlement)))
		c.header('X-X402-PROVIDER', winner.provider)
		c.header('Access-Control-Expose-Headers', EXPOSE_HEADERS)
	}
}
