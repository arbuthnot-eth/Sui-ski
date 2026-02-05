import { Container, getContainer } from '@cloudflare/containers'

interface Env {
	GRPC_PROXY: DurableObjectNamespace<GrpcProxyContainer>
	SURFLUX_API_KEY: string
}

export class GrpcProxyContainer extends Container {
	defaultPort = 8080
	sleepAfter = '30m'
	enableInternet = true
}

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function corsResponse(response: Response): Response {
	const headers = new Headers(response.headers)
	for (const [key, value] of Object.entries(CORS_HEADERS)) {
		headers.set(key, value)
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	})
}

function errorResponse(message: string, status: number): Response {
	return new Response(JSON.stringify({ error: message }), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	})
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS })
		}

		if (!env.SURFLUX_API_KEY) {
			return errorResponse('SURFLUX_API_KEY not configured', 500)
		}

		const container = getContainer(env.GRPC_PROXY, 'singleton')

		try {
			await container.start({
				envVars: {
					NODE_ENV: 'production',
					SURFLUX_API_KEY: env.SURFLUX_API_KEY,
					PORT: '8080',
				},
			})

			const response = await container.fetch(request)
			return corsResponse(response)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Container error'
			return errorResponse(message, 502)
		}
	},
}
