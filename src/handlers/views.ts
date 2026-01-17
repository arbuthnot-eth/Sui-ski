import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { cacheKey } from '../utils/cache'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * Handle view tracking requests
 * GET /api/views/:name - Get view count/score for a name
 * POST /api/views/:name - Increment view count/score for a name
 */
export async function handleViewsRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const pathParts = url.pathname.replace('/api/views', '').split('/').filter(Boolean)
	const name = pathParts[0]?.toLowerCase()

	// Handle CORS preflight
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

/**
 * Get view count/score for a name
 */
async function handleGetViews(name: string, env: Env): Promise<Response> {
	const viewKey = cacheKey('views', env.SUI_NETWORK, name)
	
	try {
		const cached = await env.CACHE.get(viewKey, 'text')
		const score = cached ? parseInt(cached, 10) : 0
		
		return jsonResponse(
			{
				name,
				score,
			},
			200,
			CORS_HEADERS,
		)
	} catch (error) {
		console.error('Failed to get views:', error)
		return jsonResponse({ name, score: 0 }, 200, CORS_HEADERS)
	}
}

/**
 * Increment view count/score for a name
 */
async function handleIncrementViews(name: string, env: Env): Promise<Response> {
	const viewKey = cacheKey('views', env.SUI_NETWORK, name)
	
	try {
		// Get current score
		const cached = await env.CACHE.get(viewKey, 'text')
		const currentScore = cached ? parseInt(cached, 10) : 0
		
		// Increment score
		const newScore = currentScore + 1
		
		// Store in KV (no expiration - permanent storage)
		await env.CACHE.put(viewKey, String(newScore))
		
		return jsonResponse(
			{
				name,
				score: newScore,
				incremented: true,
			},
			200,
			CORS_HEADERS,
		)
	} catch (error) {
		console.error('Failed to increment views:', error)
		return jsonResponse({ error: 'Failed to increment views' }, 500, CORS_HEADERS)
	}
}
