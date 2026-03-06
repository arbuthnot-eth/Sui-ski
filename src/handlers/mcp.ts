import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createMcpHandler } from 'agents/mcp'
import { z } from 'zod'
import { resolveSuiNS } from '../resolvers/suins'
import type { Env, SuiNSRecord } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { getUSDCSuiPrice } from '../utils/ns-price'
import { calculateRegistrationPrice, formatPricingResponse } from '../utils/pricing'
import { getDefaultRpcUrl } from '../utils/rpc'
import { fetchMultichainPaymentRequirements } from '../utils/x402-middleware'
import { resolveX402Recipient, X402SuiPaymentHandler } from '../utils/x402-sui'

const SUI_ASSET = '0x2::sui::SUI'
const USDC_DECIMALS = 6
const DIGEST_REPLAY_TTL = 3600

const ALLOWED_RPC_METHODS = new Set([
	'sui_getObject',
	'sui_multiGetObjects',
	'sui_getOwnedObjects',
	'sui_getTotalTransactionBlocks',
	'sui_getTransactionBlock',
	'sui_multiGetTransactionBlocks',
	'sui_getEvents',
	'sui_getLatestCheckpointSequenceNumber',
	'sui_getCheckpoint',
	'sui_getProtocolConfig',
	'sui_getChainIdentifier',
	'suix_getOwnedObjects',
	'suix_queryTransactionBlocks',
	'suix_queryEvents',
	'suix_getBalance',
	'suix_getAllBalances',
	'suix_getCoins',
	'suix_getAllCoins',
	'suix_getTotalSupply',
	'suix_getCoinMetadata',
	'suix_resolveNameServiceAddress',
	'suix_resolveNameServiceNames',
	'sui_getNormalizedMoveModulesByPackage',
	'sui_getNormalizedMoveModule',
	'sui_getNormalizedMoveFunction',
	'sui_getNormalizedMoveStruct',
	'sui_getMoveFunctionArgTypes',
	'suix_getDynamicFields',
	'suix_getDynamicFieldObject',
	'sui_dryRunTransactionBlock',
	'sui_devInspectTransactionBlock',
	'suix_getReferenceGasPrice',
])

interface ToolPaymentSuccess {
	paid: true
	payer: string
}

interface ToolPaymentRequired {
	paid: false
	requirements: Record<string, unknown>
}

type ToolPaymentResult = ToolPaymentSuccess | ToolPaymentRequired

const TOOL_PRICES: Record<string, { amountMist: string; description: string }> = {
	'build-register-tx': {
		amountMist: '500000000',
		description: 'Build a SuiNS domain registration transaction',
	},
	'ai-chat': {
		amountMist: '50000000',
		description: 'AI-powered Sui ecosystem assistant',
	},
	'search-expiring-listings': {
		amountMist: '100000000',
		description: 'Deep search of expiring SuiNS listings via TradePort',
	},
}

function suiMistToUsdcSmallest(amountMist: string, usdcPerSui: number): string {
	const suiAmount = Number(amountMist) / 1e9
	const usdcAmount = suiAmount * usdcPerSui
	return String(Math.ceil(usdcAmount * 10 ** USDC_DECIMALS))
}

async function buildMultichainAccepts(
	env: Env,
	amountMist: string,
): Promise<
	Array<{
		scheme: string
		network: string
		asset: string
		amount: string
		payTo: string
		maxTimeoutSeconds: number
		extra?: Record<string, unknown>
	}>
> {
	const hasMultichainAddresses = env.X402_BASE_PAY_TO || env.X402_SOL_PAY_TO
	if (!hasMultichainAddresses || !env.X402_MULTICHAIN) return []

	const usdcPrice = await getUSDCSuiPrice(env)
	const usdcAmount = suiMistToUsdcSmallest(amountMist, usdcPrice.usdcPerSui)

	return fetchMultichainPaymentRequirements(env, usdcAmount)
}

async function verifyMultichainPayload(
	env: Env,
	paymentPayload: string,
): Promise<{ valid: boolean; error?: string; payer?: string; digest?: string }> {
	if (!env.X402_MULTICHAIN) {
		return { valid: false, error: 'Multi-chain verifier service binding not configured' }
	}

	let parsed: {
		x402Version?: number
		accepted?: { scheme?: string; network?: string }
		payload?: Record<string, unknown>
	}
	try {
		parsed = JSON.parse(atob(paymentPayload))
	} catch {
		return { valid: false, error: 'Invalid base64 payment payload' }
	}

	if (!parsed.x402Version || !parsed.accepted?.scheme || !parsed.accepted?.network) {
		return { valid: false, error: 'Malformed payment payload structure' }
	}

	try {
		const response = await env.X402_MULTICHAIN.fetch('https://internal/verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				paymentPayload: parsed,
				paymentRequirements: parsed.accepted,
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

		const digest =
			typeof parsed.payload?.digest === 'string'
				? parsed.payload.digest
				: typeof parsed.payload?.transaction === 'string'
					? (parsed.payload.transaction as string)
					: paymentPayload.slice(0, 16)

		return { valid: true, payer: body.payer, digest }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Multi-chain verify error'
		return { valid: false, error: message }
	}
}

async function verifyToolPayment(
	env: Env,
	toolName: string,
	paymentDigest: string | undefined,
	paymentPayload: string | undefined,
): Promise<ToolPaymentResult> {
	const toolConfig = TOOL_PRICES[toolName]
	if (!toolConfig) {
		return { paid: false, requirements: { error: 'Unknown paid tool' } }
	}

	if (!paymentDigest && !paymentPayload) {
		const recipientAddress = await resolveX402Recipient(env)
		if (!recipientAddress) {
			return { paid: false, requirements: { error: 'Payment recipient could not be resolved' } }
		}

		const suiAccept = {
			scheme: 'exact-sui',
			network: `sui:${env.SUI_NETWORK}`,
			amount: toolConfig.amountMist,
			asset: SUI_ASSET,
			payTo: recipientAddress,
			maxTimeoutSeconds: 120,
		}

		const multichainAccepts = await buildMultichainAccepts(env, toolConfig.amountMist)

		return {
			paid: false,
			requirements: {
				x402Version: 2,
				paymentRequired: true,
				tool: toolName,
				accepts: [suiAccept, ...multichainAccepts],
			},
		}
	}

	if (paymentPayload) {
		const replayKey = cacheKey('mcp-payload', paymentPayload.slice(0, 64))
		const used = await getCached<boolean>(replayKey)
		if (used) {
			return { paid: false, requirements: { error: 'Payment payload already used' } }
		}

		const result = await verifyMultichainPayload(env, paymentPayload)
		if (!result.valid) {
			return {
				paid: false,
				requirements: { error: result.error || 'Multi-chain payment verification failed' },
			}
		}

		await setCache(replayKey, true, DIGEST_REPLAY_TTL)
		return { paid: true, payer: result.payer || 'unknown' }
	}

	const digest = paymentDigest
	if (!digest) {
		return { paid: false, requirements: { error: 'Payment digest is required' } }
	}
	const replayKey = cacheKey('mcp-digest', digest)
	const used = await getCached<boolean>(replayKey)
	if (used) {
		return { paid: false, requirements: { error: 'Payment digest already used' } }
	}

	const recipientAddress = await resolveX402Recipient(env)
	if (!recipientAddress) {
		return { paid: false, requirements: { error: 'Payment recipient could not be resolved' } }
	}

	const handler = new X402SuiPaymentHandler(recipientAddress, env)
	const payload = {
		x402Version: 2,
		accepted: {
			scheme: 'exact-sui' as const,
			network: `sui:${env.SUI_NETWORK}`,
			amount: toolConfig.amountMist,
			asset: SUI_ASSET,
			payTo: recipientAddress,
			maxTimeoutSeconds: 120,
		},
		payload: { digest },
	}

	const verification = await handler.verifyPayment(payload, toolConfig.amountMist)
	if (!verification.valid) {
		return {
			paid: false,
			requirements: { error: verification.error || 'Payment verification failed' },
		}
	}

	await setCache(replayKey, true, DIGEST_REPLAY_TTL)

	return { paid: true, payer: verification.payer || 'unknown' }
}

function textResult(text: string) {
	return { content: [{ type: 'text' as const, text }] }
}

function jsonResult(data: unknown) {
	return textResult(JSON.stringify(data, null, 2))
}

function errorResult(message: string) {
	return { content: [{ type: 'text' as const, text: message }], isError: true as const }
}

function createSuiMcpServer(env: Env): McpServer {
	const server = new McpServer({
		name: 'sui-ski',
		version: '1.0.0',
	})

	server.tool(
		'resolve-name',
		'Resolve a SuiNS name to its on-chain record (address, avatar, content hash, expiration, NFT ID)',
		{ name: z.string().describe('SuiNS name to resolve (e.g. "brando" or "brando.sui")') },
		async ({ name }) => {
			const result = await resolveSuiNS(name.replace(/\.sui$/i, ''), env)
			if (!result.found) {
				return jsonResult({
					found: false,
					available: result.available || false,
					error: result.error,
				})
			}
			const record = result.data as SuiNSRecord
			return jsonResult({
				found: true,
				name: `${name.replace(/\.sui$/i, '')}.sui`,
				address: record.address,
				ownerAddress: record.ownerAddress,
				avatar: record.avatar,
				contentHash: record.contentHash,
				nftId: record.nftId,
				expirationTimestampMs: record.expirationTimestampMs,
				inGracePeriod: result.inGracePeriod || false,
				expired: result.expired || false,
				records: record.records,
			})
		},
	)

	server.tool(
		'search-grace-feed',
		'Search SuiNS names by grace period status (expired, expiring soon, or all). Returns lifecycle data for each name.',
		{
			query: z.string().optional().describe('Search filter for name substring'),
			status: z
				.enum(['all', 'grace', 'expiring'])
				.optional()
				.describe(
					'Filter: "grace" = expired in grace period, "expiring" = expiring soon, "all" = both',
				),
			limit: z.number().min(1).max(100).optional().describe('Max results to return (default 20)'),
		},
		async ({ query, status, limit }) => {
			const params = new URLSearchParams()
			if (query) params.set('q', query)
			if (status) params.set('status', status)
			params.set('limit', String(limit || 20))

			const apiUrl = `https://sui.ski/api/grace-feed?${params.toString()}`
			const response = await fetch(apiUrl, {
				headers: { 'Cache-Control': 'no-store' },
			})
			if (!response.ok) {
				return errorResult(`Grace feed API returned ${response.status}`)
			}
			const data = await response.json()
			return jsonResult(data)
		},
	)

	server.tool(
		'lookup-mvr-package',
		'Look up a Move Registry (MVR) package by SuiNS name and package name. Returns package address and metadata.',
		{
			suinsName: z.string().describe('SuiNS name that owns the package (e.g. "suifrens")'),
			packageName: z.string().describe('Package name within the MVR (e.g. "core")'),
			version: z.number().optional().describe('Specific package version (omit for latest)'),
		},
		async ({ suinsName, packageName, version }) => {
			const mvrName = `@${suinsName.replace(/\.sui$/i, '')}/${packageName}`
			const endpoint = `https://${env.SUI_NETWORK}.mvr.mystenlabs.com`
			const body = {
				package_ids: [version ? `${mvrName}/${version}` : mvrName],
			}

			const response = await fetch(`${endpoint}/v1/resolution`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			if (!response.ok) {
				return errorResult(`MVR resolution failed: ${response.status}`)
			}

			const data = await response.json()
			return jsonResult({ mvrName, version: version || 'latest', resolution: data })
		},
	)

	server.tool(
		'get-pricing',
		'Get SuiNS domain registration pricing with NS token discount breakdown',
		{
			domain: z.string().describe('Domain to price (e.g. "example" or "example.sui")'),
			years: z.number().min(1).max(5).optional().describe('Registration years (default 1)'),
		},
		async ({ domain, years }) => {
			const result = await calculateRegistrationPrice({
				domain,
				years: years || 1,
				env,
			})
			return jsonResult(formatPricingResponse(result))
		},
	)

	server.tool(
		'sui-read',
		'Execute a read-only Sui JSON-RPC method against the public fullnode. Write methods are blocked.',
		{
			method: z.string().describe('JSON-RPC method name (e.g. "sui_getObject", "suix_getBalance")'),
			params: z.array(z.unknown()).optional().describe('Method parameters array'),
		},
		async ({ method, params }) => {
			if (!ALLOWED_RPC_METHODS.has(method)) {
				return errorResult(
					`Method "${method}" is not allowed. Only read-only methods are permitted. Allowed: ${[...ALLOWED_RPC_METHODS].join(', ')}`,
				)
			}

			const rpcUrl = env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK)
			const response = await fetch(rpcUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method,
					params: params || [],
				}),
			})

			const result = await response.json()
			return jsonResult(result)
		},
	)

	server.tool(
		'build-register-tx',
		'[PAID: 0.5 SUI] Build an unsigned SuiNS domain registration transaction. Returns serialized transaction bytes for wallet signing.',
		{
			domain: z.string().describe('Domain to register (e.g. "example" or "example.sui")'),
			years: z.number().min(1).max(5).optional().describe('Registration years (default 1)'),
			senderAddress: z.string().describe('Sui address that will sign and send the transaction'),
			paymentDigest: z.string().optional().describe('Sui transaction digest for SUI payment'),
			paymentPayload: z
				.string()
				.optional()
				.describe('Base64-encoded x402 payment payload for EVM/Solana payments'),
		},
		async ({ domain, years, senderAddress, paymentDigest, paymentPayload }) => {
			const payment = await verifyToolPayment(
				env,
				'build-register-tx',
				paymentDigest,
				paymentPayload,
			)
			if (!payment.paid) {
				return jsonResult(payment.requirements)
			}

			const apiUrl = 'https://sui.ski/api/register/build-tx'
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					domain: domain.replace(/\.sui$/i, ''),
					years: years || 1,
					sender: senderAddress,
				}),
			})

			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Build failed' }))
				return errorResult(JSON.stringify(error))
			}

			const data = (await response.json()) as Record<string, unknown>
			return jsonResult({ paidBy: payment.payer, ...data })
		},
	)

	server.tool(
		'ai-chat',
		'[PAID: 0.05 SUI] Ask the Sui ecosystem AI assistant a question about SuiNS, Sui, DeFi, or the blockchain.',
		{
			message: z.string().max(2000).describe('Your question or message'),
			paymentDigest: z.string().optional().describe('Sui transaction digest for SUI payment'),
			paymentPayload: z
				.string()
				.optional()
				.describe('Base64-encoded x402 payment payload for EVM/Solana payments'),
		},
		async ({ message, paymentDigest, paymentPayload }) => {
			const payment = await verifyToolPayment(env, 'ai-chat', paymentDigest, paymentPayload)
			if (!payment.paid) {
				return jsonResult(payment.requirements)
			}

			const apiUrl = env.LLM_API_URL || 'https://api.anthropic.com/v1/messages'
			const apiKey = env.LLM_API_KEY
			if (!apiKey) {
				return errorResult('AI chat is not configured on this server')
			}

			const systemPrompt = [
				'You are a helpful Sui blockchain assistant at sui.ski.',
				'You specialize in SuiNS (Sui Name Service), Move Registry (MVR), Walrus storage, DeepBook DEX, and the broader Sui ecosystem.',
				'Give concise, accurate answers. When referencing on-chain data, mention that the user can verify via sui.ski tools.',
				`Current network: ${env.SUI_NETWORK}.`,
			].join(' ')

			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: 'claude-3-5-haiku-20241022',
					max_tokens: 500,
					system: systemPrompt,
					messages: [{ role: 'user', content: message }],
				}),
			})

			if (!response.ok) {
				return errorResult(`LLM API returned ${response.status}`)
			}

			const result: { content?: { type: string; text: string }[] } = await response.json()
			const reply = result.content?.[0]?.text || 'No response generated'
			return textResult(reply)
		},
	)

	server.tool(
		'search-expiring-listings',
		'[PAID: 0.1 SUI] Deep search of expiring SuiNS domain listings with TradePort marketplace data and grace period analysis.',
		{
			query: z.string().optional().describe('Search filter for name substring'),
			status: z
				.enum(['all', 'grace', 'expiring'])
				.optional()
				.describe('Filter: "grace" = in grace period, "expiring" = expiring soon'),
			limit: z.number().min(1).max(100).optional().describe('Max results (default 25)'),
			paymentDigest: z.string().optional().describe('Sui transaction digest for SUI payment'),
			paymentPayload: z
				.string()
				.optional()
				.describe('Base64-encoded x402 payment payload for EVM/Solana payments'),
		},
		async ({ query, status, limit, paymentDigest, paymentPayload }) => {
			const payment = await verifyToolPayment(
				env,
				'search-expiring-listings',
				paymentDigest,
				paymentPayload,
			)
			if (!payment.paid) {
				return jsonResult(payment.requirements)
			}

			const params = new URLSearchParams()
			if (query) params.set('q', query)
			if (status) params.set('mode', status)
			params.set('limit', String(limit || 25))

			const apiUrl = `https://sui.ski/api/expiring-listings?${params.toString()}`
			const response = await fetch(apiUrl, {
				headers: { 'Cache-Control': 'no-store' },
			})

			if (!response.ok) {
				return errorResult(`Expiring listings API returned ${response.status}`)
			}

			const data = (await response.json()) as Record<string, unknown>
			return jsonResult({ paidBy: payment.payer, ...data })
		},
	)

	return server
}

export function createSuiMcpHandler(env: Env) {
	const server = createSuiMcpServer(env)
	return createMcpHandler(server as unknown as Parameters<typeof createMcpHandler>[0])
}
