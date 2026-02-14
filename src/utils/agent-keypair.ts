import { fromBase64 } from '@mysten/bcs'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import type { Env } from '../types'

const KEYPAIR_CACHE_TTL_MS = 5 * 60 * 1000

interface CachedKeypair {
	keypair: Ed25519Keypair
	expiresAt: number
}

let cached: CachedKeypair | null = null

export function getAgentKeypair(env: Env): Ed25519Keypair {
	if (cached && Date.now() < cached.expiresAt) {
		return cached.keypair
	}

	const secretKey = env.AGENT_PRIVATE_KEY
	if (!secretKey) {
		throw new Error('AGENT_PRIVATE_KEY is not configured')
	}

	const keypair = keypairFromSecret(secretKey)
	cached = { keypair, expiresAt: Date.now() + KEYPAIR_CACHE_TTL_MS }
	return keypair
}

export function getAgentAddress(env: Env): string {
	return getAgentKeypair(env).toSuiAddress()
}

function keypairFromSecret(secret: string): Ed25519Keypair {
	const trimmed = secret.trim()
	if (trimmed.startsWith('suiprivkey')) {
		return Ed25519Keypair.fromSecretKey(trimmed)
	}
	const bytes = fromBase64(trimmed)
	return Ed25519Keypair.fromSecretKey(bytes.length === 33 ? bytes.slice(1) : bytes)
}
