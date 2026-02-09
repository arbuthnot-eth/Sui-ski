import { verifyPersonalMessageSignature } from '@mysten/sui/verify'
import invariant from 'tiny-invariant'
import type { Env } from '../types'
import { errorResponse, jsonResponse } from '../utils/response'

const COOKIE_DOMAIN = '.sui.ski'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60

interface ConnectRequest {
	address: string
	walletName?: string
	signature?: string
	challenge?: string
}

interface DisconnectRequest {
	sessionId: string
}

export async function handleWalletChallenge(_request: Request, env: Env): Promise<Response> {
	const stub = env.WALLET_SESSIONS.getByName('global')
	const { challenge, expiresAt } = await stub.createChallenge()
	return jsonResponse({ challenge, expiresAt })
}

export async function handleWalletConnect(request: Request, env: Env): Promise<Response> {
	try {
		const stub = env.WALLET_SESSIONS.getByName('global')

		const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
		const withinLimit = await stub.checkRateLimit(ip)
		if (!withinLimit) {
			return errorResponse('Too many requests, try again later', 'RATE_LIMITED', 429)
		}

		const body = await request.json<ConnectRequest>()
		invariant(body.address, 'address is required')

		let verified = false
		if (body.signature && body.challenge) {
			const challengeValid = await stub.verifyChallenge(body.challenge)
			if (!challengeValid) {
				return errorResponse('Challenge expired or already used', 'INVALID_CHALLENGE', 400)
			}
			const messageBytes = new TextEncoder().encode(body.challenge)
			try {
				await verifyPersonalMessageSignature(messageBytes, body.signature, {
					address: body.address,
				})
			} catch {
				return errorResponse('Signature verification failed', 'INVALID_SIGNATURE', 401)
			}
			verified = true
		}

		await stub.recordRateLimit(ip)

		const sessionId = crypto.randomUUID()
		await stub.createSession(body.address, sessionId, verified)

		const response = jsonResponse({ sessionId, address: body.address, verified })

		response.headers.append(
			'Set-Cookie',
			`session_id=${sessionId}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
		)

		response.headers.append(
			'Set-Cookie',
			`wallet_address=${body.address}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
		)

		if (body.walletName) {
			response.headers.append(
				'Set-Cookie',
				`wallet_name=${body.walletName}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
			)
		}

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
	const sessionIdParam = url.searchParams.get('sessionId')

	const cookies = request.headers.get('Cookie') || ''
	const sessionCookie = cookies.split('; ').find((row) => row.startsWith('session_id='))
	const nameCookie = cookies.split('; ').find((row) => row.startsWith('wallet_name='))

	const sessionId = sessionIdParam || sessionCookie?.split('=')[1]
	const walletName = nameCookie?.split('=')[1] || null

	if (!sessionId) {
		return jsonResponse({ address: null, verified: false, walletName: null })
	}

	const stub = env.WALLET_SESSIONS.getByName('global')
	const info = await stub.getSessionInfo(sessionId)

	if (info) {
		await stub.extendSession(sessionId)
		return jsonResponse({ address: info.address, verified: info.verified, walletName })
	}

	return jsonResponse({ address: null, verified: false, walletName: null })
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

		response.headers.append(
			'Set-Cookie',
			`wallet_name=; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; SameSite=Lax; Secure`,
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
