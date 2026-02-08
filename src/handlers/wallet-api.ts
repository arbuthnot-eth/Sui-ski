import invariant from 'tiny-invariant'
import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'

const COOKIE_DOMAIN = '.sui.ski'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60

interface ConnectRequest {
	address: string
	signature?: string
}

interface DisconnectRequest {
	sessionId: string
}

export async function handleWalletConnect(request: Request, env: Env): Promise<Response> {
	try {
		const body = await request.json<ConnectRequest>()
		invariant(body.address, 'address is required')

		const sessionId = crypto.randomUUID()
		const stub = env.WALLET_SESSIONS.getByName('global')
		await stub.createSession(body.address, sessionId)

		const response = jsonResponse({ sessionId, address: body.address })

		response.headers.append(
			'Set-Cookie',
			`session_id=${sessionId}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
		)

		response.headers.append(
			'Set-Cookie',
			`wallet_address=${body.address}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
		)

		return response
	} catch (error) {
		return errorResponse(
			error instanceof Error ? error.message : 'Invalid request',
			'INVALID_REQUEST',
			400,
		)
	}
}

export async function handleWalletCheck(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const sessionId = url.searchParams.get('sessionId')

	if (!sessionId) {
		const cookies = request.headers.get('Cookie') || ''
		const sessionCookie = cookies.split('; ').find((row) => row.startsWith('session_id='))

		if (!sessionCookie) {
			return jsonResponse({ address: null })
		}

		const cookieSessionId = sessionCookie.split('=')[1]
		const stub = env.WALLET_SESSIONS.getByName('global')
		const address = await stub.getSession(cookieSessionId)

		if (address) {
			await stub.extendSession(cookieSessionId)
		}

		return jsonResponse({ address })
	}

	const stub = env.WALLET_SESSIONS.getByName('global')
	const address = await stub.getSession(sessionId)

	if (address) {
		await stub.extendSession(sessionId)
	}

	return jsonResponse({ address })
}

export async function handleWalletDisconnect(request: Request, env: Env): Promise<Response> {
	try {
		const body = await request.json<DisconnectRequest>()
		invariant(body.sessionId, 'sessionId is required')

		const stub = env.WALLET_SESSIONS.getByName('global')
		const success = await stub.deleteSession(body.sessionId)

		const response = jsonResponse({ success })

		response.headers.append(
			'Set-Cookie',
			`session_id=; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; SameSite=Lax; Secure`,
		)

		response.headers.append(
			'Set-Cookie',
			`wallet_address=; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; SameSite=Lax; Secure`,
		)

		return response
	} catch (error) {
		return errorResponse(
			error instanceof Error ? error.message : 'Invalid request',
			'INVALID_REQUEST',
			400,
		)
	}
}
