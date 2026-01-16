import type { Env } from '../types'

interface QueuedBid {
	name: string
	bidder: string
	amount: number
	executeAt: number
	createdAt: number
}

/**
 * Handle bid queue API requests
 * POST /api/bids - Create a new bid
 * GET /api/bids/:name - Get bids for a name
 * DELETE /api/bids/:name?bidder=address - Cancel a bid
 */
export async function handleBidsRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const pathParts = url.pathname.replace('/api/bids', '').split('/').filter(Boolean)
	const name = pathParts[0]?.toLowerCase()

	const corsHeaders = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
	}

	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: corsHeaders })
	}

	try {
		switch (request.method) {
			case 'POST':
				return handleCreateBid(request, env, corsHeaders)
			case 'GET':
				if (!name) {
					return jsonResponse({ error: 'Name parameter required' }, 400, corsHeaders)
				}
				return handleGetBids(name, url, env, corsHeaders)
			case 'DELETE':
				if (!name) {
					return jsonResponse({ error: 'Name parameter required' }, 400, corsHeaders)
				}
				return handleCancelBid(name, url, env, corsHeaders)
			default:
				return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders)
		}
	} catch (error) {
		console.error('Bids API error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: message }, 500, corsHeaders)
	}
}

/**
 * Create a new bid
 */
async function handleCreateBid(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const body = (await request.json()) as {
		name?: string
		bidder?: string
		amount?: number
		executeAt?: number
	}

	const { name, bidder, amount, executeAt } = body

	if (!name || !bidder || !amount || !executeAt) {
		return jsonResponse(
			{ error: 'Missing required fields: name, bidder, amount, executeAt' },
			400,
			corsHeaders,
		)
	}

	if (amount <= 0) {
		return jsonResponse({ error: 'Amount must be greater than 0' }, 400, corsHeaders)
	}

	const cleanName = name.toLowerCase().replace(/\.sui$/i, '')

	// Create the bid object
	const bid: QueuedBid = {
		name: cleanName,
		bidder,
		amount,
		executeAt,
		createdAt: Date.now(),
	}

	// Store in KV with composite key: bid:{name}:{bidder}
	const bidKey = `bid:${cleanName}:${bidder}`
	await env.CACHE.put(bidKey, JSON.stringify(bid), {
		// Expire after execution time + 1 day buffer
		expirationTtl: Math.max(Math.ceil((executeAt - Date.now()) / 1000) + 86400, 86400),
	})

	// Also maintain an index of all bids for this name
	const indexKey = `bids:${cleanName}`
	const existingIndex = await env.CACHE.get(indexKey)
	const bidders: string[] = existingIndex ? JSON.parse(existingIndex) : []

	if (!bidders.includes(bidder)) {
		bidders.push(bidder)
		await env.CACHE.put(indexKey, JSON.stringify(bidders), {
			expirationTtl: Math.max(Math.ceil((executeAt - Date.now()) / 1000) + 86400, 86400),
		})
	}

	return jsonResponse({ success: true, bid }, 201, corsHeaders)
}

/**
 * Get bids for a name
 */
async function handleGetBids(
	name: string,
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const bidder = url.searchParams.get('bidder')
	const cleanName = name.toLowerCase().replace(/\.sui$/i, '')

	// If bidder specified, return just their bid
	if (bidder) {
		const bidKey = `bid:${cleanName}:${bidder}`
		const bidData = await env.CACHE.get(bidKey)

		if (!bidData) {
			return jsonResponse({ bid: null }, 200, corsHeaders)
		}

		return jsonResponse({ bid: JSON.parse(bidData) }, 200, corsHeaders)
	}

	// Otherwise return all bids for this name
	const indexKey = `bids:${cleanName}`
	const index = await env.CACHE.get(indexKey)

	if (!index) {
		return jsonResponse({ bids: [] }, 200, corsHeaders)
	}

	const bidders: string[] = JSON.parse(index)
	const bids: QueuedBid[] = []

	for (const b of bidders) {
		const bidKey = `bid:${cleanName}:${b}`
		const bidData = await env.CACHE.get(bidKey)
		if (bidData) {
			bids.push(JSON.parse(bidData))
		}
	}

	// Sort by amount descending (highest bid first)
	bids.sort((a, b) => b.amount - a.amount)

	return jsonResponse({ bids }, 200, corsHeaders)
}

/**
 * Cancel a bid
 */
async function handleCancelBid(
	name: string,
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const bidder = url.searchParams.get('bidder')

	if (!bidder) {
		return jsonResponse({ error: 'Bidder parameter required' }, 400, corsHeaders)
	}

	const cleanName = name.toLowerCase().replace(/\.sui$/i, '')
	const bidKey = `bid:${cleanName}:${bidder}`

	// Check if bid exists
	const existingBid = await env.CACHE.get(bidKey)
	if (!existingBid) {
		return jsonResponse({ error: 'Bid not found' }, 404, corsHeaders)
	}

	// Delete the bid
	await env.CACHE.delete(bidKey)

	// Update the index
	const indexKey = `bids:${cleanName}`
	const index = await env.CACHE.get(indexKey)

	if (index) {
		const bidders: string[] = JSON.parse(index)
		const filtered = bidders.filter((b) => b !== bidder)

		if (filtered.length > 0) {
			await env.CACHE.put(indexKey, JSON.stringify(filtered))
		} else {
			await env.CACHE.delete(indexKey)
		}
	}

	return jsonResponse({ success: true }, 200, corsHeaders)
}

function jsonResponse(
	data: unknown,
	status = 200,
	extraHeaders: Record<string, string> = {},
): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...extraHeaders,
		},
	})
}
