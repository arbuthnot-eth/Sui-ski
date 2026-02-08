import type { Context, MiddlewareHandler } from 'hono'
import type { Env, X402VerifiedPayment, X402VerifierProvider } from '../types'
import { jsonResponse } from './response'
import { resolveX402Recipient, X402SuiPaymentHandler } from './x402-sui'

const DEFAULT_AMOUNT_MIST = '1000000000'
const EXPOSE_HEADERS = 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-X402-PROVIDER'
const SUPPORTED_PROVIDERS: X402VerifierProvider[] = ['cloudflare', 'coinbase']

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

function normalizeProviders(values: string[]): X402VerifierProvider[] {
	const result: X402VerifierProvider[] = []
	for (const value of values) {
		const candidate = value.trim().toLowerCase()
		if (!candidate) continue
		if ((candidate === 'cloudflare' || candidate === 'coinbase') && !result.includes(candidate)) {
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

		const payment = handler.extractPayment(paymentHeader)
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

		const providerChecks = await Promise.all(
			requestedProviders.providers.map(async (provider) => {
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
			? successfulChecks.length === requestedProviders.providers.length
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
