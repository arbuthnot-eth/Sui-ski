import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { x402ResourceServer } from '@x402/core/server'
import type { PaymentRequirements } from '@x402/core/types'
import { createPaymentWrapper } from '@x402/mcp'
import { McpAgent } from 'agents/mcp'
import { z } from 'zod'
import type { Env } from '../types'
import { getDefaultRpcUrl } from '../utils/rpc'
import { ExactSuiFacilitatorScheme } from '../x402/exact-sui-facilitator'
import { ExactSuiServerScheme } from '../x402/exact-sui-server'
import { LocalFacilitatorClient } from '../x402/local-facilitator-client'
import { SuiSigner } from '../x402/sui-signer'

const SUI_ASSET = '0x2::sui::SUI'

export class SuiMcpServer extends McpAgent<Env> {
	server = new McpServer({
		name: 'SuiSkiMCP',
		version: '1.0.0',
	})

	async init(): Promise<void> {
		const env = this.env
		const network = `sui:${env.SUI_NETWORK}` as `${string}:${string}`
		const rpcUrl = env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK)

		this.registerFreeTools(env, rpcUrl)

		if (env.SUI_AGENT_PRIVATE_KEY) {
			this.registerPaidTools(env, network, rpcUrl)
		}
	}

	private registerFreeTools(env: Env, rpcUrl: string): void {
		this.server.tool(
			'resolve-name',
			'Resolve a SuiNS name to its target address and records',
			{ name: z.string().describe('SuiNS name (e.g., "myname.sui")') },
			async ({ name }) => {
				const { resolveSuiNS } = await import('../resolvers/suins')
				const result = await resolveSuiNS(name.replace(/\.sui$/, ''), env)
				return {
					content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
				}
			},
		)

		this.server.tool(
			'primary-name',
			'Look up the primary SuiNS name for a Sui address',
			{ address: z.string().describe('Sui address (0x...)') },
			async ({ address }) => {
				const { SuiJsonRpcClient } = await import('@mysten/sui/jsonRpc')
				const client = new SuiJsonRpcClient({ url: rpcUrl, network: env.SUI_NETWORK })
				let name: string | null = null
				try {
					const result = await client.resolveNameServiceNames({ address })
					const first = Array.isArray(result?.data) ? result.data[0] : null
					name = typeof first === 'string' ? first : null
				} catch {
					name = null
				}
				return {
					content: [{ type: 'text', text: JSON.stringify({ address, name }) }],
				}
			},
		)

		this.server.tool(
			'pricing',
			'Get SuiNS registration pricing for a name',
			{
				name: z.string().describe('Name to check pricing for'),
				years: z.number().optional().describe('Number of years (1-5, default 1)'),
			},
			async ({ name, years }) => {
				const { calculateRegistrationPrice, formatPricingResponse } = await import(
					'../utils/pricing'
				)
				const pricing = await calculateRegistrationPrice({
					domain: name.replace(/\.sui$/, ''),
					years: years || 1,
					env,
				})
				return {
					content: [{ type: 'text', text: JSON.stringify(formatPricingResponse(pricing)) }],
				}
			},
		)

		this.server.tool('ns-price', 'Get current NS/SUI exchange rate from DeepBook', {}, async () => {
			const { getNSSuiPrice } = await import('../utils/ns-price')
			const price = await getNSSuiPrice(env)
			return {
				content: [{ type: 'text', text: JSON.stringify(price) }],
			}
		})

		this.server.tool(
			'gateway-status',
			'Get sui.ski gateway health and RPC status',
			{},
			async () => {
				const { getGatewayStatus } = await import('../utils/status')
				const status = await getGatewayStatus(env)
				return {
					content: [{ type: 'text', text: JSON.stringify(status) }],
				}
			},
		)
	}

	private registerPaidTools(env: Env, network: `${string}:${string}`, rpcUrl: string): void {
		const privateKey = env.SUI_AGENT_PRIVATE_KEY
		if (!privateKey) return
		const signer = new SuiSigner(privateKey)
		const facilitatorScheme = new ExactSuiFacilitatorScheme(signer, rpcUrl, network)
		const facilitatorClient = new LocalFacilitatorClient([
			{ network, facilitator: facilitatorScheme },
		])
		const resourceServer = new x402ResourceServer(facilitatorClient).register(
			network,
			new ExactSuiServerScheme(),
		)

		const payTo = signer.address

		const marketplaceRequirements: PaymentRequirements[] = [
			{
				scheme: 'exact',
				network,
				amount: '100000000',
				asset: SUI_ASSET,
				payTo,
				maxTimeoutSeconds: 120,
				extra: {},
			},
		]

		const batchRequirements: PaymentRequirements[] = [
			{
				scheme: 'exact',
				network,
				amount: '500000000',
				asset: SUI_ASSET,
				payTo,
				maxTimeoutSeconds: 120,
				extra: {},
			},
		]

		const expiringRequirements: PaymentRequirements[] = [
			{
				scheme: 'exact',
				network,
				amount: '200000000',
				asset: SUI_ASSET,
				payTo,
				maxTimeoutSeconds: 120,
				extra: {},
			},
		]

		const paidMarketplace = createPaymentWrapper(resourceServer, {
			accepts: marketplaceRequirements,
			resource: { description: 'Marketplace listing data for a SuiNS name' },
		})

		const paidBatch = createPaymentWrapper(resourceServer, {
			accepts: batchRequirements,
			resource: { description: 'Batch marketplace data for up to 20 names' },
		})

		const paidExpiring = createPaymentWrapper(resourceServer, {
			accepts: expiringRequirements,
			resource: { description: 'Real-time expiring SuiNS names list' },
		})

		const paidSuggestions = createPaymentWrapper(resourceServer, {
			accepts: marketplaceRequirements,
			resource: { description: 'AI-powered name suggestions' },
		})

		const paidOwnedNames = createPaymentWrapper(resourceServer, {
			accepts: marketplaceRequirements,
			resource: { description: 'Portfolio lookup for owned SuiNS names' },
		})

		this.server.tool(
			'marketplace-data',
			'Get marketplace listing data for a SuiNS name (0.1 SUI)',
			{ name: z.string().describe('SuiNS name to look up') },
			paidMarketplace(async ({ name }) => {
				const response = await fetch(
					`https://${env.SUI_NETWORK === 'mainnet' ? '' : 't.'}sui.ski/api/marketplace/${encodeURIComponent(name)}`,
				)
				const data = await response.json()
				return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
			}),
		)

		this.server.tool(
			'marketplace-batch',
			'Batch marketplace data for up to 20 names (0.5 SUI)',
			{ names: z.array(z.string()).max(20).describe('Array of SuiNS names') },
			paidBatch(async ({ names }) => {
				const response = await fetch(
					`https://${env.SUI_NETWORK === 'mainnet' ? '' : 't.'}sui.ski/api/marketplace-batch`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ names }),
					},
				)
				const data = await response.json()
				return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
			}),
		)

		this.server.tool(
			'expiring-names',
			'Get real-time list of expiring SuiNS names (0.2 SUI)',
			{},
			paidExpiring(async () => {
				const { handleExpiringNames } = await import('../handlers/expiring-names')
				const response = await handleExpiringNames(env)
				const data = await response.json()
				return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
			}),
		)

		this.server.tool(
			'suggest-names',
			'Get AI-powered name suggestions (0.1 SUI)',
			{ query: z.string().min(3).describe('Search query (min 3 chars)') },
			paidSuggestions(async ({ query }) => {
				const response = await fetch(
					`https://${env.SUI_NETWORK === 'mainnet' ? '' : 't.'}sui.ski/api/suggest-names?q=${encodeURIComponent(query)}`,
				)
				const data = await response.json()
				return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
			}),
		)

		this.server.tool(
			'owned-names',
			'Look up SuiNS names owned by an address (0.1 SUI)',
			{ address: z.string().describe('Sui address (0x...)') },
			paidOwnedNames(async ({ address }) => {
				const response = await fetch(
					`https://${env.SUI_NETWORK === 'mainnet' ? '' : 't.'}sui.ski/api/owned-names?address=${encodeURIComponent(address)}`,
				)
				const data = await response.json()
				return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
			}),
		)
	}
}
