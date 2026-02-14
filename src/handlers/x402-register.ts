import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient, SuinsTransaction } from '@mysten/suins'
import { Hono } from 'hono'
import type { Env, X402VerifiedPayment } from '../types'
import { getAgentAddress, getAgentKeypair } from '../utils/agent-keypair'
import {
	calculateSuiNeededForNs,
	DEEP_TYPE,
	DEEPBOOK_NS_SUI_POOL,
	DEEPBOOK_PACKAGE,
	DEFAULT_SLIPPAGE_BPS,
	getNSSuiPrice,
	NS_SCALE,
	NS_TYPE_MAINNET,
	SUI_TYPE,
	simulateBuyNsWithSui,
} from '../utils/ns-price'
import { calculateRegistrationPrice, formatPricingResponse } from '../utils/pricing'
import { jsonResponse } from '../utils/response'
import { getDefaultRpcUrl } from '../utils/rpc'
import { fetchMultichainPaymentRequirements, resolveX402Providers, x402PaymentMiddleware } from '../utils/x402-middleware'
import { resolveX402Recipient } from '../utils/x402-sui'

type X402RegisterEnv = {
	Bindings: Env
	Variables: {
		env: Env
		x402Payment?: X402VerifiedPayment
	}
}

const CLOCK_OBJECT = '0x6'
const X402_FEE_PERCENT = 20
const ESTIMATED_GAS_MIST = 150_000_000
const DEFAULT_AGENT_FEE_MIST = '1000000000'
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{64}$/

function generateRequestId(): string {
	return `x402reg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function getAgentFeeMist(env: Env): string {
	const configured = env.X402_AGENT_FEE_MIST?.trim()
	if (!configured || !/^\d+$/.test(configured)) return DEFAULT_AGENT_FEE_MIST
	return configured
}

async function resolveFeeRecipient(
	client: SuiClient,
	suinsClient: SuinsClient,
	feeName: string | undefined,
	fallback: string,
): Promise<string> {
	if (!feeName) return fallback
	const normalizedName = feeName.replace(/\.sui$/i, '') + '.sui'
	try {
		const record = await suinsClient.getNameRecord(normalizedName)
		if (record?.targetAddress && ADDRESS_PATTERN.test(record.targetAddress)) {
			return record.targetAddress
		}
	} catch {
		// fall through
	}
	try {
		const resolved = await client.resolveNameServiceAddress({ name: normalizedName })
		if (resolved && ADDRESS_PATTERN.test(resolved)) {
			return resolved
		}
	} catch {
		// fall through
	}
	return fallback
}

async function storeRequest(
	env: Env,
	requestId: string,
	payload: Record<string, unknown>,
): Promise<void> {
	await env.CACHE.put(`x402-register:${requestId}`, JSON.stringify(payload), {
		expirationTtl: 86400,
	})
}

export const x402RegisterRoutes = new Hono<X402RegisterEnv>()

x402RegisterRoutes.get('/info', async (c) => {
	const env = c.get('env')
	const providers = resolveX402Providers(env)
	const feeMist = getAgentFeeMist(env)

	const [payTo, multichainAccepts, agentAddress] = await Promise.all([
		resolveX402Recipient(env),
		fetchMultichainPaymentRequirements(env, feeMist),
		Promise.resolve<string | null>((() => {
			try { return getAgentAddress(env) } catch { return null }
		})()),
	])

	const suiAccept = {
		scheme: 'exact-sui' as const,
		network: `sui:${env.SUI_NETWORK}`,
		asset: '0x2::sui::SUI',
		amount: feeMist,
		payTo: payTo || '',
		maxTimeoutSeconds: 120,
		extra: { verificationMethod: 'pre-executed' },
	}

	const accepts = [suiAccept, ...multichainAccepts]

	return jsonResponse({
		service: 'x402 Auto-Registration Agent',
		description:
			'Pay with x402, agent registers .sui names with 25% NS discount and transfers NFT to you',
		agentAddress,
		pricing: {
			amountMist: feeMist,
			asset: '0x2::sui::SUI',
			network: `sui:${env.SUI_NETWORK}`,
		},
		features: {
			nsDiscount: '25%',
			x402FeePercent: X402_FEE_PERCENT,
			autoSwap: 'SUI → NS via DeepBook',
			nftTransfer: 'To payer address',
		},
		paymentMethods: ['x402'],
		x402: {
			version: 2,
			accepts,
			verificationProviders: providers,
		},
		endpoints: {
			info: 'GET /api/agents/x402-register/info',
			quote: 'GET /api/agents/x402-register/quote?domain=example&years=1',
			register: 'POST /api/agents/x402-register/register',
			status: 'GET /api/agents/x402-register/status/:id',
		},
	})
})

x402RegisterRoutes.get('/quote', async (c) => {
	const env = c.get('env')
	const domain = c.req.query('domain')?.trim()
	const yearsParam = c.req.query('years')

	if (!domain) {
		return jsonResponse({ error: 'domain query parameter is required' }, 400)
	}

	const years = yearsParam ? Number.parseInt(yearsParam, 10) : 1
	if (!Number.isInteger(years) || years < 1 || years > 5) {
		return jsonResponse({ error: 'years must be an integer between 1 and 5' }, 400)
	}

	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`

	try {
		const pricing = await calculateRegistrationPrice({ domain: cleanDomain, years, env })
		const feeMist = getAgentFeeMist(env)
		const x402FeeMist = (pricing.discountedSuiMist * BigInt(X402_FEE_PERCENT)) / 100n
		const totalMist = pricing.discountedSuiMist + x402FeeMist + BigInt(ESTIMATED_GAS_MIST)

		return jsonResponse({
			domain: cleanDomain,
			years,
			pricing: formatPricingResponse(pricing),
			agentFees: {
				x402PaymentMist: feeMist,
				x402FeeMist: String(x402FeeMist),
				x402FeePercent: X402_FEE_PERCENT,
				estimatedGasMist: String(ESTIMATED_GAS_MIST),
			},
			totalEstimatedMist: String(totalMist),
			note: 'Agent wallet must hold sufficient SUI for gas + registration. x402 payment covers service fee.',
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to calculate pricing'
		return jsonResponse({ error: message }, 400)
	}
})

x402RegisterRoutes.post(
	'/register',
	x402PaymentMiddleware({
		description: 'Auto-register .sui name with 25% NS discount',
		allowBypassWhenUnconfigured: false,
	}),
	async (c) => {
		const env = c.get('env')
		const x402Payment = c.get('x402Payment')

		if (!x402Payment) {
			return jsonResponse({ error: 'Payment verification missing' }, 402)
		}

		let payload: {
			domain?: string
			years?: number
			targetAddress?: string
		}
		try {
			payload = await c.req.json()
		} catch {
			return jsonResponse({ error: 'Invalid JSON body' }, 400)
		}

		if (!payload.domain?.trim()) {
			return jsonResponse({ error: 'domain is required' }, 400)
		}

		const years = payload.years ?? 1
		if (!Number.isInteger(years) || years < 1 || years > 5) {
			return jsonResponse({ error: 'years must be an integer between 1 and 5' }, 400)
		}

		const payerAddress = payload.targetAddress || x402Payment.payer
		if (!ADDRESS_PATTERN.test(payerAddress)) {
			return jsonResponse({ error: 'Could not determine valid payer address' }, 400)
		}

		const cleanDomain = `${payload.domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
		const requestId = generateRequestId()
		const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

		try {
			const keypair = getAgentKeypair(env)
			const agentAddress = keypair.toSuiAddress()

			const client = new SuiClient({
				url: getDefaultRpcUrl(env.SUI_NETWORK),
				network: env.SUI_NETWORK,
			})
			const suinsClient = new SuinsClient({ client: client as never, network })

			const [pricing, nsPrice, x402Recipient, feeRecipient] = await Promise.all([
				calculateRegistrationPrice({ domain: cleanDomain, years, env }),
				getNSSuiPrice(env, true),
				resolveX402Recipient(env),
				resolveFeeRecipient(client, suinsClient, env.SERVICE_FEE_NAME, agentAddress),
			])

			const registrationCostNsMist = pricing.nsNeededMist
			const nsPoolAddress = DEEPBOOK_NS_SUI_POOL[network]
			const deepbookPackage = DEEPBOOK_PACKAGE[network]

			if (!nsPoolAddress || !deepbookPackage) {
				throw new Error(`DeepBook pools not available on ${network}`)
			}

			const slippageBps = DEFAULT_SLIPPAGE_BPS
			let suiForNsSwap: bigint
			let minNsOutput: bigint
			let priceImpactBps = 0

			if (nsPrice.asks?.length) {
				const wideSlippage = Math.max(slippageBps, 1500)
				const quote = calculateSuiNeededForNs(registrationCostNsMist, nsPrice.asks, wideSlippage)
				suiForNsSwap = quote.suiNeeded

				minNsOutput = registrationCostNsMist

				const simResult = simulateBuyNsWithSui(suiForNsSwap, nsPrice.asks)
				priceImpactBps = simResult.priceImpactBps

				if (simResult.outputNs < minNsOutput) {
					suiForNsSwap = suiForNsSwap + (suiForNsSwap * 30n) / 100n
				}
			} else {
				const bufferBps = Math.max(slippageBps * 3, 3000)
				const nsWithBuffer =
					registrationCostNsMist + (registrationCostNsMist * BigInt(bufferBps)) / 10000n
				const nsTokens = Number(nsWithBuffer) / NS_SCALE
				suiForNsSwap = BigInt(Math.ceil(nsTokens * nsPrice.suiPerNs * 1e9))

				minNsOutput = registrationCostNsMist
			}

			const x402FeeMist = (pricing.discountedSuiMist * BigInt(X402_FEE_PERCENT)) / 100n

			const tx = new Transaction()
			tx.setSender(agentAddress)

			const [suiCoinForNs] = tx.splitCoins(tx.gas, [tx.pure.u64(suiForNsSwap)])

			const [zeroDeepCoin] = tx.moveCall({
				target: '0x2::coin::zero',
				typeArguments: [DEEP_TYPE],
			})

			const [nsCoin, nsLeftoverSui, nsLeftoverDeep] = tx.moveCall({
				target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
				typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
				arguments: [
					tx.object(nsPoolAddress),
					suiCoinForNs,
					zeroDeepCoin,
					tx.pure.u64(minNsOutput),
					tx.object(CLOCK_OBJECT),
				],
			})

			tx.transferObjects([nsLeftoverSui, nsLeftoverDeep], agentAddress)

			const suinsTx = new SuinsTransaction(suinsClient, tx)
			const coinConfig = suinsClient.config.coins.NS
			if (!coinConfig) {
				throw new Error('SuiNS NS coin configuration not found')
			}

			const priceInfoObjectId = coinConfig.feed
				? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
				: undefined

			const nft = suinsTx.register({
				domain: cleanDomain,
				years,
				coinConfig,
				coin: nsCoin,
				priceInfoObjectId,
			})

			suinsTx.setTargetAddress({
				nft,
				address: payerAddress,
				isSubname: cleanDomain.replace(/\.sui$/i, '').includes('.'),
			})

			tx.transferObjects([nft], payerAddress)

			if (x402Recipient && x402FeeMist > 0n) {
				const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(x402FeeMist)])
				tx.transferObjects([feeCoin], x402Recipient)
			}

			tx.transferObjects([nsCoin], feeRecipient)
			tx.setGasBudget(ESTIMATED_GAS_MIST)

			const txBytes = await tx.build({ client: client as never })
			const { signature } = await keypair.signTransaction(txBytes)
			const txBytesBase64 = btoa(String.fromCharCode(...txBytes))

			const rpcResponse = await fetch(env.SUI_RPC_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: Date.now(),
					method: 'sui_executeTransactionBlock',
					params: [
						txBytesBase64,
						[signature],
						{ showEffects: true, showEvents: true, showObjectChanges: true },
						'WaitForLocalExecution',
					],
				}),
			})

			const rpcJson = (await rpcResponse.json()) as {
				result?: {
					digest?: string
					effects?: { status?: { status: string; error?: string } }
					events?: Array<{ type: string; parsedJson?: Record<string, unknown> }>
					objectChanges?: Array<{
						type: string
						objectType?: string
						objectId?: string
						owner?: unknown
					}>
				}
				error?: { message?: string }
			}

			if (rpcJson.error) {
				throw new Error(`Transaction failed: ${rpcJson.error.message}`)
			}

			const txResult = rpcJson.result
			if (!txResult?.effects?.status || txResult.effects.status.status !== 'success') {
				throw new Error(
					`Transaction execution failed: ${txResult?.effects?.status?.error || 'unknown error'}`,
				)
			}

			const digest = txResult.digest || 'unknown'

			let nftId: string | null = null
			if (txResult.objectChanges) {
				for (const change of txResult.objectChanges) {
					if (
						change.type === 'created' &&
						change.objectType?.includes('::suins_registration::SuinsRegistration')
					) {
						nftId = change.objectId || null
						break
					}
				}
			}

			let registrationEvent: Record<string, unknown> | null = null
			if (txResult.events) {
				for (const event of txResult.events) {
					if (
						event.type.includes('::register::NameRegistered') ||
						event.type.includes('Register')
					) {
						registrationEvent = event.parsedJson || null
						break
					}
				}
			}

			const receipt = {
				success: true,
				requestId,
				domain: cleanDomain,
				years,
				nftId,
				digest,
				payerAddress,
				agentAddress,
				pricing: {
					registrationCostNsMist: String(registrationCostNsMist),
					suiInputMist: String(suiForNsSwap),
					x402FeeMist: String(x402FeeMist),
					nsPerSui: nsPrice.nsPerSui,
					priceImpactBps,
				},
				registrationEvent,
				x402Payment,
				timestamp: Date.now(),
			}

			await storeRequest(env, requestId, receipt)

			return jsonResponse(receipt)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Registration failed'
			const failureRecord = {
				success: false,
				requestId,
				domain: cleanDomain,
				error: message,
				payerAddress,
				x402Payment,
				timestamp: Date.now(),
			}
			await storeRequest(env, requestId, failureRecord).catch(() => {})
			return jsonResponse({ error: message, requestId }, 500)
		}
	},
)

x402RegisterRoutes.post('/sweep', async (c) => {
	const env = c.get('env')

	try {
		const keypair = getAgentKeypair(env)
		const agentAddress = keypair.toSuiAddress()
		const client = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
		const x402Recipient = await resolveX402Recipient(env)
		if (!x402Recipient) {
			return jsonResponse({ error: 'Could not resolve x402.sui recipient address' }, 500)
		}

		const GAS_RESERVE_MIST = 200_000_000n
		const SWEEP_GAS_BUDGET = 50_000_000

		const STABLECOIN_TYPES = [
			'0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
			'0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
		]

		const allCoins = await client.getAllCoins({ owner: agentAddress })
		const coinsByType: Map<string, Array<{ objectId: string; balance: bigint }>> = new Map()

		for (const coin of allCoins.data) {
			const existing = coinsByType.get(coin.coinType) || []
			existing.push({ objectId: coin.coinObjectId, balance: BigInt(coin.balance) })
			coinsByType.set(coin.coinType, existing)
		}

		const suiCoins = coinsByType.get('0x2::sui::SUI') || []
		let totalSuiBalance = 0n
		for (const coin of suiCoins) totalSuiBalance += coin.balance

		const sweepableSui = totalSuiBalance - GAS_RESERVE_MIST - BigInt(SWEEP_GAS_BUDGET)
		const transfers: Array<{ type: string; amount: string }> = []

		if (sweepableSui <= 0n && STABLECOIN_TYPES.every((t) => !coinsByType.has(t))) {
			return jsonResponse({
				message: 'Nothing to sweep',
				agentAddress,
				recipient: x402Recipient,
				suiBalance: String(totalSuiBalance),
				gasReserve: String(GAS_RESERVE_MIST),
			})
		}

		const tx = new Transaction()
		tx.setSender(agentAddress)

		if (sweepableSui > 0n) {
			const [sweepCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(sweepableSui)])
			tx.transferObjects([sweepCoin], x402Recipient)
			transfers.push({ type: 'SUI', amount: String(sweepableSui) })
		}

		for (const coinType of STABLECOIN_TYPES) {
			const coins = coinsByType.get(coinType)
			if (!coins?.length) continue

			let totalBalance = 0n
			for (const c of coins) totalBalance += c.balance
			if (totalBalance === 0n) continue

			const coinRefs = coins.map((c) => tx.object(c.objectId))
			if (coinRefs.length > 1) {
				tx.mergeCoins(coinRefs[0], coinRefs.slice(1))
			}
			tx.transferObjects([coinRefs[0]], x402Recipient)

			const label = coinType.includes('usdc') ? 'USDC' : coinType.split('::').pop() || coinType
			transfers.push({ type: label, amount: String(totalBalance) })
		}

		tx.setGasBudget(SWEEP_GAS_BUDGET)

		const txBytes = await tx.build({ client: client as never })
		const { signature } = await keypair.signTransaction(txBytes)
		const txBytesBase64 = btoa(String.fromCharCode(...txBytes))

		const rpcResponse = await fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: Date.now(),
				method: 'sui_executeTransactionBlock',
				params: [
					txBytesBase64,
					[signature],
					{ showEffects: true, showBalanceChanges: true },
					'WaitForLocalExecution',
				],
			}),
		})

		const rpcJson = (await rpcResponse.json()) as {
			result?: {
				digest?: string
				effects?: { status?: { status: string; error?: string } }
			}
			error?: { message?: string }
		}

		if (rpcJson.error) {
			throw new Error(`Sweep transaction failed: ${rpcJson.error.message}`)
		}

		if (rpcJson.result?.effects?.status?.status !== 'success') {
			throw new Error(
				`Sweep execution failed: ${rpcJson.result?.effects?.status?.error || 'unknown'}`,
			)
		}

		return jsonResponse({
			success: true,
			digest: rpcJson.result.digest,
			agentAddress,
			recipient: x402Recipient,
			transfers,
			timestamp: Date.now(),
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Sweep failed'
		return jsonResponse({ error: message }, 500)
	}
})

x402RegisterRoutes.get('/status/:id', async (c) => {
	const env = c.get('env')
	const requestId = c.req.param('id')
	try {
		const data = await env.CACHE.get(`x402-register:${requestId}`)
		if (!data) return jsonResponse({ error: 'Request not found' }, 404)
		return jsonResponse(JSON.parse(data))
	} catch {
		return jsonResponse({ error: 'Failed to fetch request status' }, 500)
	}
})
