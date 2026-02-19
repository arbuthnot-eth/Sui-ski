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

function getCookieValue(cookieHeader: string, name: string): string | null {
	if (!cookieHeader) return null
	const parts = cookieHeader.split(';')
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i].trim()
		if (!part) continue
		const eqIndex = part.indexOf('=')
		if (eqIndex <= 0) continue
		if (part.slice(0, eqIndex).trim() !== name) continue
		return part.slice(eqIndex + 1).trim()
	}
	return null
}

function decodeCookieValue(value: string | null): string | null {
	if (!value) return null
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
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
			`wallet_address=${encodeURIComponent(body.address)}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
		)

		if (body.walletName) {
			response.headers.append(
				'Set-Cookie',
				`wallet_name=${encodeURIComponent(body.walletName)}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure`,
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

	const cookieHeader = request.headers.get('Cookie') || ''
	const sessionId = sessionIdParam || decodeCookieValue(getCookieValue(cookieHeader, 'session_id'))
	const walletName = decodeCookieValue(getCookieValue(cookieHeader, 'wallet_name'))

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
