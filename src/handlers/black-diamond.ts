import { Hono } from 'hono'
import type { Env } from '../types'
import {
	buildCreateWatchlistTx,
	buildUnwatchTx,
	buildWatchTx,
	getWatchlistForAddress,
	isWatchingName,
} from '../utils/black-diamond'
import { jsonResponse } from '../utils/response'
import { serializeTransaction } from '../utils/subnamecap-transactions'

type BlackDiamondEnv = {
	Bindings: Env
	Variables: {
		env: Env
	}
}

export const blackDiamondRoutes = new Hono<BlackDiamondEnv>()

blackDiamondRoutes.get('/watchlist', async (c) => {
	const env = c.get('env')
	const address = c.req.query('address')
	if (!address) return jsonResponse({ error: 'address parameter required' }, 400)

	try {
		const watchlist = await getWatchlistForAddress(address, env)
		if (!watchlist) return jsonResponse({ found: false, names: [] })
		return jsonResponse({ found: true, ...watchlist })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to fetch watchlist'
		return jsonResponse({ error: message }, 500)
	}
})

blackDiamondRoutes.get('/watching', async (c) => {
	const env = c.get('env')
	const address = c.req.query('address')
	const name = c.req.query('name')
	if (!address || !name) return jsonResponse({ error: 'address and name parameters required' }, 400)

	try {
		const watching = await isWatchingName(address, name, env)
		return jsonResponse({ watching })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to check watchlist'
		return jsonResponse({ error: message }, 500)
	}
})

blackDiamondRoutes.post('/watch', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{ sender: string; name: string; watchlistId?: string }>()
		if (!body.sender || !body.name) {
			return jsonResponse({ error: 'sender and name are required' }, 400)
		}

		if (!body.watchlistId) {
			const tx = buildCreateWatchlistTx({ senderAddress: body.sender }, env)
			const result = await serializeTransaction(tx, env)
			return jsonResponse({
				...result,
				action: 'create',
				note: 'Watchlist created. Send a second request with watchlistId to watch the name.',
			})
		}

		const tx = buildWatchTx(
			{
				watchlistId: body.watchlistId,
				name: body.name,
				senderAddress: body.sender,
			},
			env,
		)
		const result = await serializeTransaction(tx, env)
		return jsonResponse({ ...result, action: 'watch' })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build watch transaction'
		return jsonResponse({ error: message }, 500)
	}
})

blackDiamondRoutes.post('/unwatch', async (c) => {
	const env = c.get('env')
	try {
		const body = await c.req.json<{ sender: string; name: string; watchlistId: string }>()
		if (!body.sender || !body.name || !body.watchlistId) {
			return jsonResponse({ error: 'sender, name, and watchlistId are required' }, 400)
		}

		const tx = buildUnwatchTx(
			{
				watchlistId: body.watchlistId,
				name: body.name,
				senderAddress: body.sender,
			},
			env,
		)
		const result = await serializeTransaction(tx, env)
		return jsonResponse({ ...result, action: 'unwatch' })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to build unwatch transaction'
		return jsonResponse({ error: message }, 500)
	}
})
