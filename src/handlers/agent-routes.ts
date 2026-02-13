import { getAgentByName, routeAgentRequest } from 'agents'
import { Hono } from 'hono'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'

type AgentEnv = {
	Bindings: Env
	Variables: {
		env: Env
	}
}

export function createAgentRoutes(): Hono<AgentEnv> {
	const routes = new Hono<AgentEnv>()

	routes.all('/pay/:action', async (c) => {
		const env = c.get('env')
		if (!env.SUI_PAY_AGENT) {
			return jsonResponse({ error: 'SuiPayAgent not configured' }, 503)
		}

		const action = c.req.param('action')
		const url = new URL(c.req.url)
		const agentUrl = new URL(`/${action}`, url.origin)
		agentUrl.search = url.search

		const stub = await getAgentByName(env.SUI_PAY_AGENT as never, 'default')
		const agentRequest = new Request(agentUrl.toString(), {
			method: c.req.method,
			headers: c.req.raw.headers,
			body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
		})

		const response = await stub.fetch(agentRequest)
		return new Response(response.body, {
			status: response.status,
			headers: response.headers,
		})
	})

	routes.all('/mcp/*', async (c) => {
		const env = c.get('env')
		if (!env.SUI_MCP_SERVER) {
			return jsonResponse({ error: 'SuiMcpServer not configured' }, 503)
		}

		const agentResponse = await routeAgentRequest(c.req.raw, env as unknown as Cloudflare.Env)
		if (agentResponse) {
			return new Response(agentResponse.body, {
				status: agentResponse.status,
				headers: agentResponse.headers,
			})
		}

		const url = new URL(c.req.url)
		const sessionId = url.searchParams.get('sessionId') || 'default'
		const transportType = url.pathname.includes('/sse') ? 'sse' : 'streamable-http'
		const agentName = `${transportType}:${sessionId}`

		const stub = env.SUI_MCP_SERVER.get(env.SUI_MCP_SERVER.idFromName(agentName))
		const response = await stub.fetch(c.req.raw)
		return new Response(response.body, {
			status: response.status,
			headers: response.headers,
		})
	})

	routes.get('/mcp-info', () => {
		return jsonResponse({
			service: 'SuiSkiMCP',
			description: 'MCP server for SuiNS name service with free and paid tools',
			version: '1.0.0',
			transport: ['sse', 'streamable-http'],
			endpoints: {
				sse: '/api/agents/mcp/sse',
				streamableHttp: '/api/agents/mcp/mcp',
			},
			tools: {
				free: ['resolve-name', 'primary-name', 'pricing', 'ns-price', 'gateway-status'],
				paid: [
					'marketplace-data',
					'marketplace-batch',
					'expiring-names',
					'suggest-names',
					'owned-names',
				],
			},
		})
	})

	return routes
}
