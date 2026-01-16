import type { Env } from '../types'

const DEFAULT_TTL = 300 // 5 minutes
const MAX_TTL = 86400 // 24 hours

export interface CacheEntry<T> {
	data: T
	expiresAt: number
}

export async function getCached<T>(env: Env, key: string): Promise<T | null> {
	try {
		const cached = await env.CACHE.get(key, 'json')
		if (!cached) return null

		const entry = cached as CacheEntry<T>
		if (Date.now() > entry.expiresAt) {
			// Expired, delete and return null
			await env.CACHE.delete(key)
			return null
		}
		return entry.data
	} catch {
		return null
	}
}

export async function setCache<T>(
	env: Env,
	key: string,
	data: T,
	ttlSeconds = DEFAULT_TTL,
): Promise<void> {
	const ttl = Math.min(ttlSeconds, MAX_TTL)
	const entry: CacheEntry<T> = {
		data,
		expiresAt: Date.now() + ttl * 1000,
	}
	await env.CACHE.put(key, JSON.stringify(entry), { expirationTtl: ttl })
}

export function cacheKey(type: string, ...parts: string[]): string {
	return `${type}:${parts.join(':')}`
}
