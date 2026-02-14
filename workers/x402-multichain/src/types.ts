export interface Env {
	BASE_USDC_ADDRESS: string
	BASE_NETWORK: string
	SOL_USDC_MINT: string
	SOL_NETWORK: string
	BASE_PAY_TO?: string
	SOL_PAY_TO?: string
	CDP_API_KEY?: string
	CDP_FACILITATOR_URL?: string
}

export interface VerifyRequest {
	paymentPayload: {
		x402Version: number
		resource: { url: string; description: string; mimeType: string }
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
		extensions?: Record<string, unknown>
	}
	paymentRequirements: {
		scheme: string
		network: string
		asset: string
		amount: string
		payTo: string
		maxTimeoutSeconds: number
		extra?: Record<string, unknown>
	}
}

export interface VerifyResponse {
	isValid: boolean
	invalidReason?: string
	invalidMessage?: string
	payer?: string
}

export interface SettleRequest {
	paymentPayload: VerifyRequest['paymentPayload']
	paymentRequirements: VerifyRequest['paymentRequirements']
}

export interface SettleResponse {
	success: boolean
	errorReason?: string
	errorMessage?: string
	payer?: string
	transaction: string
	network: string
}

export interface PaymentRequirementsResponse {
	accepts: Array<{
		scheme: string
		network: string
		asset: string
		amount: string
		payTo: string
		maxTimeoutSeconds: number
		extra?: Record<string, unknown>
	}>
}

export interface HealthResponse {
	status: 'ok' | 'degraded'
	chains: {
		base: boolean
		solana: boolean
	}
	facilitator: string
	timestamp: number
}
