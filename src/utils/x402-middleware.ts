import type { Context, MiddlewareHandler } from 'hono'
import type { Env } from '../types'
import { jsonResponse } from './response'
import { resolveX402Recipient, X402SuiPaymentHandler } from './x402-sui'

interface X402MiddlewareConfig {
	description: string
}

type X402Env = {
	Bindings: Env
	Variables: {
		env: Env
		x402Payment?: { digest: string; payer: string }
	}
}

export function x402PaymentMiddleware(config: X402MiddlewareConfig): MiddlewareHandler<X402Env> {
	return async (c: Context<X402Env>, next) => {
		const env = c.get('env')

		const recipientAddress = await resolveX402Recipient(env)
		if (!recipientAddress) {
			await next()
			return
		}

		const handler = new X402SuiPaymentHandler(recipientAddress, env)

		const paymentHeader = c.req.header('PAYMENT-SIGNATURE') || c.req.header('X-PAYMENT')

		if (!paymentHeader) {
			const url = new URL(c.req.url)
			const requirements = handler.createPaymentRequirements(url.pathname, config.description)
			const encoded = btoa(JSON.stringify(requirements))

			return jsonResponse(
				{
					error: 'Payment required',
					code: 'X402_PAYMENT_REQUIRED',
					x402Version: 2,
				},
				402,
				{
					'PAYMENT-REQUIRED': encoded,
					'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE',
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
					'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE',
				},
			)
		}

		const verification = await handler.verifyPayment(payment)
		if (!verification.valid) {
			return jsonResponse(
				{
					error: 'Payment verification failed',
					code: 'X402_VERIFICATION_FAILED',
					details: verification.error,
				},
				402,
				{
					'Access-Control-Expose-Headers': 'PAYMENT-REQUIRED, PAYMENT-RESPONSE',
				},
			)
		}

		c.set('x402Payment', {
			digest: payment.payload.digest,
			payer: verification.payer || 'unknown',
		})

		await next()

		const settlement = handler.createSettlementResponse(
			payment.payload.digest,
			verification.payer || 'unknown',
		)
		c.header('PAYMENT-RESPONSE', btoa(JSON.stringify(settlement)))
		c.header('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE')
	}
}
