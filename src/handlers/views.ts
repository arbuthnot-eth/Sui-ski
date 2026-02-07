import type { Env } from '../types'
import { cacheKey } from '../utils/cache'
import { jsonResponse } from '../utils/response'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

const FLUSH_THRESHOLD = 10

const viewCounters = new Map<string, { pending: number; flushed: number }>()

export async function handleViewsRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const pathParts = url.pathname.replace('/api/views', '').split('/').filter(Boolean)
	const name = pathParts[0]?.toLowerCase()

	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	if (!name) {
		return jsonResponse({ error: 'Name parameter required' }, 400, CORS_HEADERS)
	}

	try {
		switch (request.method) {
			case 'GET':
				return handleGetViews(name, env)
			case 'POST':
				return handleIncrementViews(name, env)
			default:
				return jsonResponse({ error: 'Method not allowed' }, 405, CORS_HEADERS)
		}
	} catch (error) {
		console.error('Views API error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: message }, 500, CORS_HEADERS)
	}
}

async function handleGetViews(name: string, env: Env): Promise<Response> {
	const viewKey = cacheKey('views', env.SUI_NETWORK, name)
	const counter = viewCounters.get(viewKey)

	try {
		let flushed = counter?.flushed ?? 0
		if (!counter) {
			const cached = await env.CACHE.get(viewKey, 'text')
			flushed = cached ? parseInt(cached, 10) : 0
			viewCounters.set(viewKey, { pending: 0, flushed })
		}
		const score = flushed + (counter?.pending ?? 0)

		return jsonResponse({ name, score }, 200, CORS_HEADERS)
	} catch (error) {
		console.error('Failed to get views:', error)
		return jsonResponse({ name, score: 0 }, 200, CORS_HEADERS)
	}
}

async function handleIncrementViews(name: string, env: Env): Promise<Response> {
	const viewKey = cacheKey('views', env.SUI_NETWORK, name)

	let counter = viewCounters.get(viewKey)
	if (!counter) {
		try {
			const cached = await env.CACHE.get(viewKey, 'text')
			const flushed = cached ? parseInt(cached, 10) : 0
			counter = { pending: 0, flushed }
			viewCounters.set(viewKey, counter)
		} catch {
			counter = { pending: 0, flushed: 0 }
			viewCounters.set(viewKey, counter)
		}
	}

	counter.pending++

	if (counter.pending >= FLUSH_THRESHOLD) {
		const newTotal = counter.flushed + counter.pending
		try {
			await env.CACHE.put(viewKey, String(newTotal))
			counter.flushed = newTotal
			counter.pending = 0
		} catch (error) {
			console.error('Failed to flush views:', error)
		}
	}

	const score = counter.flushed + counter.pending

	return jsonResponse({ name, score, incremented: true }, 200, CORS_HEADERS)
}
