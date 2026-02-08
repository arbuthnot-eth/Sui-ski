import { Hono } from 'hono'
import type { Env, X402VerifiedPayment } from '../types'
import {
	buildCreateGraceVaultTx,
	buildExecuteGraceVaultTx,
} from '../utils/grace-vault-transactions'
import { jsonResponse } from '../utils/response'
import { resolveX402Providers, x402PaymentMiddleware } from '../utils/x402-middleware'
import { resolveX402Recipient } from '../utils/x402-sui'

type GraceVaultAgentEnv = {
	Bindings: Env
	Variables: {
		env: Env
		x402Payment?: X402VerifiedPayment
	}
}

const DEFAULT_AGENT_FEE_MIST = '1000000000'
const ESTIMATED_GAS_MIST = 150_000_000

function generateAgentRequestId(prefix: 'create' | 'execute'): string {
	return `grace_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function isSuiAddress(value: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(value.trim())
}

function parseRequiredBigInt(value: unknown, field: string): bigint {
	if (typeof value === 'bigint') return value
	if (typeof value === 'number') return BigInt(Math.trunc(value))
	if (typeof value === 'string' && value.trim()) return BigInt(value.trim())
	throw new Error(`${field} is required`)
}

function parseOptionalBigInt(value: unknown): bigint | undefined {
	if (value === undefined || value === null || value === '') return undefined
	if (typeof value === 'bigint') return value
	if (typeof value === 'number') return BigInt(Math.trunc(value))
	if (typeof value === 'string') return BigInt(value.trim())
	return undefined
}

function parseOptionalNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') return undefined
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) return undefined
	return parsed
}

function getAgentFeeMist(env: Env): string {
	const configured = env.X402_AGENT_FEE_MIST?.trim()
	if (!configured) return DEFAULT_AGENT_FEE_MIST
	if (!/^\d+$/.test(configured)) return DEFAULT_AGENT_FEE_MIST
	return configured
}

async function storeAgentRequest(
	env: Env,
	requestId: string,
	payload: Record<string, unknown>,
): Promise<void> {
	await env.CACHE.put(`grace-vault:agent:${requestId}`, JSON.stringify(payload), {
		expirationTtl: 86400,
	})
}

export const agentGraceVaultRoutes = new Hono<GraceVaultAgentEnv>()

agentGraceVaultRoutes.get('/info', async (c) => {
	const env = c.get('env')
	const providers = resolveX402Providers(env)
	const [payTo] = await Promise.all([resolveX402Recipient(env)])
	const feeMist = getAgentFeeMist(env)

	return jsonResponse({
		service: 'Grace Vault Agent API',
		description: 'Build NS vault and execution transactions for SuiNS grace-period registration',
		pricing: {
			amountMist: feeMist,
			asset: '0x2::sui::SUI',
			network: `sui:${env.SUI_NETWORK}`,
		},
		paymentMethods: ['x402'],
		x402: {
			version: 2,
			scheme: 'exact-sui',
			network: `sui:${env.SUI_NETWORK}`,
			asset: '0x2::sui::SUI',
			payTo,
			verificationProviders: providers,
		},
		endpoints: {
			info: 'GET /api/agents/grace-vault/info',
			buildCreate: 'POST /api/agents/grace-vault/build-create',
			buildExecute: 'POST /api/agents/grace-vault/build-execute',
			status: 'GET /api/agents/grace-vault/status/:id',
		},
	})
})

agentGraceVaultRoutes.post(
	'/build-create',
	x402PaymentMiddleware({
		description: 'Build NS grace-vault creation transaction',
		allowBypassWhenUnconfigured: false,
	}),
	async (c) => {
		const env = c.get('env')
		const x402Payment = c.get('x402Payment')

		let payload: {
			packageId?: string
			senderAddress?: string
			domain?: string
			beneficiaryAddress?: string
			expiredAtMs?: number | string
			years?: number | string
			executorRewardNsMist?: string | number
			protocolFeeNsMist?: string | number
			protocolFeeRecipient?: string
			paymentAsset?: 'sui' | 'usdc' | 'ns'
			paymentCoinObjectIds?: string[]
			maxInputMist?: string | number
			registrationBudgetNsMist?: string | number
			slippageBps?: number | string
			expirationMs?: number | string
		}
		try {
			payload = await c.req.json()
		} catch {
			return jsonResponse({ error: 'Invalid JSON body' }, 400)
		}

		if (!payload.senderAddress || !isSuiAddress(payload.senderAddress)) {
			return jsonResponse({ error: 'Valid senderAddress is required' }, 400)
		}
		if (!payload.beneficiaryAddress || !isSuiAddress(payload.beneficiaryAddress)) {
			return jsonResponse({ error: 'Valid beneficiaryAddress is required' }, 400)
		}
		if (!payload.domain?.trim()) {
			return jsonResponse({ error: 'domain is required' }, 400)
		}
		if (!payload.paymentAsset || !['sui', 'usdc', 'ns'].includes(payload.paymentAsset)) {
			return jsonResponse({ error: 'paymentAsset must be one of: sui, usdc, ns' }, 400)
		}

		const expiredAtMs = Number(payload.expiredAtMs)
		const years = Number(payload.years)
		if (!Number.isFinite(expiredAtMs) || expiredAtMs <= 0) {
			return jsonResponse({ error: 'expiredAtMs must be a valid timestamp in milliseconds' }, 400)
		}
		if (!Number.isInteger(years) || years < 1 || years > 5) {
			return jsonResponse({ error: 'years must be an integer between 1 and 5' }, 400)
		}

		try {
			const result = await buildCreateGraceVaultTx(
				{
					packageId: payload.packageId,
					senderAddress: payload.senderAddress,
					domain: payload.domain,
					beneficiaryAddress: payload.beneficiaryAddress,
					expiredAtMs,
					years,
					executorRewardNsMist: parseRequiredBigInt(
						payload.executorRewardNsMist,
						'executorRewardNsMist',
					),
					protocolFeeNsMist: parseOptionalBigInt(payload.protocolFeeNsMist),
					protocolFeeRecipient: payload.protocolFeeRecipient,
					paymentAsset: payload.paymentAsset,
					paymentCoinObjectIds: payload.paymentCoinObjectIds,
					maxInputMist: parseOptionalBigInt(payload.maxInputMist),
					registrationBudgetNsMist: parseOptionalBigInt(payload.registrationBudgetNsMist),
					slippageBps: parseOptionalNumber(payload.slippageBps),
					expirationMs: parseOptionalNumber(payload.expirationMs),
				},
				env,
			)

			const txBytes = await result.tx.toJSON()
			const requestId = generateAgentRequestId('create')
			await storeAgentRequest(env, requestId, {
				id: requestId,
				type: 'build-create',
				status: 'built',
				createdAt: Date.now(),
				domain: payload.domain,
				payment: x402Payment,
				breakdown: {
					paymentAsset: result.breakdown.paymentAsset,
					inputUsedMist: result.breakdown.inputUsedMist.toString(),
					registrationBudgetNsMist: result.breakdown.registrationBudgetNsMist.toString(),
					executorRewardNsMist: result.breakdown.executorRewardNsMist.toString(),
					protocolFeeNsMist: result.breakdown.protocolFeeNsMist.toString(),
					totalRequiredNsMist: result.breakdown.totalRequiredNsMist.toString(),
				},
			})

			return jsonResponse({
				success: true,
				requestId,
				status: 'built',
				statusUrl: `/api/agents/grace-vault/status/${requestId}`,
				tx: {
					txBytes,
					estimatedGas: ESTIMATED_GAS_MIST,
				},
				breakdown: {
					paymentAsset: result.breakdown.paymentAsset,
					inputUsedMist: result.breakdown.inputUsedMist.toString(),
					registrationBudgetNsMist: result.breakdown.registrationBudgetNsMist.toString(),
					executorRewardNsMist: result.breakdown.executorRewardNsMist.toString(),
					protocolFeeNsMist: result.breakdown.protocolFeeNsMist.toString(),
					totalRequiredNsMist: result.breakdown.totalRequiredNsMist.toString(),
				},
				payment: x402Payment,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to build create transaction'
			return jsonResponse({ error: message }, 400)
		}
	},
)

agentGraceVaultRoutes.post(
	'/build-execute',
	x402PaymentMiddleware({
		description: 'Build NS grace-vault execution transaction',
		allowBypassWhenUnconfigured: false,
	}),
	async (c) => {
		const env = c.get('env')
		const x402Payment = c.get('x402Payment')

		let payload: {
			packageId?: string
			senderAddress?: string
			vaultObjectId?: string
			domain?: string
			beneficiaryAddress?: string
			years?: number | string
		}
		try {
			payload = await c.req.json()
		} catch {
			return jsonResponse({ error: 'Invalid JSON body' }, 400)
		}

		if (!payload.senderAddress || !isSuiAddress(payload.senderAddress)) {
			return jsonResponse({ error: 'Valid senderAddress is required' }, 400)
		}
		if (!payload.beneficiaryAddress || !isSuiAddress(payload.beneficiaryAddress)) {
			return jsonResponse({ error: 'Valid beneficiaryAddress is required' }, 400)
		}
		if (!payload.vaultObjectId?.trim()) {
			return jsonResponse({ error: 'vaultObjectId is required' }, 400)
		}
		if (!payload.domain?.trim()) {
			return jsonResponse({ error: 'domain is required' }, 400)
		}

		const years = Number(payload.years)
		if (!Number.isInteger(years) || years < 1 || years > 5) {
			return jsonResponse({ error: 'years must be an integer between 1 and 5' }, 400)
		}

		try {
			const tx = await buildExecuteGraceVaultTx(
				{
					packageId: payload.packageId,
					senderAddress: payload.senderAddress,
					vaultObjectId: payload.vaultObjectId,
					domain: payload.domain,
					beneficiaryAddress: payload.beneficiaryAddress,
					years,
				},
				env,
			)

			const txBytes = await tx.toJSON()
			const requestId = generateAgentRequestId('execute')
			await storeAgentRequest(env, requestId, {
				id: requestId,
				type: 'build-execute',
				status: 'built',
				createdAt: Date.now(),
				domain: payload.domain,
				vaultObjectId: payload.vaultObjectId,
				payment: x402Payment,
			})

			return jsonResponse({
				success: true,
				requestId,
				status: 'built',
				statusUrl: `/api/agents/grace-vault/status/${requestId}`,
				tx: {
					txBytes,
					estimatedGas: ESTIMATED_GAS_MIST,
				},
				payment: x402Payment,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to build execute transaction'
			return jsonResponse({ error: message }, 400)
		}
	},
)

agentGraceVaultRoutes.get('/status/:id', async (c) => {
	const env = c.get('env')
	const requestId = c.req.param('id')
	try {
		const data = await env.CACHE.get(`grace-vault:agent:${requestId}`)
		if (!data) return jsonResponse({ error: 'Request not found' }, 404)
		return jsonResponse(JSON.parse(data))
	} catch {
		return jsonResponse({ error: 'Failed to fetch request status' }, 500)
	}
})
