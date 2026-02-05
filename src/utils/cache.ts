import type { Env } from '../types'

const DEFAULT_TTL = 300
const MAX_TTL = 86400

export interface CacheEntry<T> {
	data: T
	expiresAt: number
}

const memCache = new Map<string, CacheEntry<unknown>>()
const MEM_CACHE_MAX_SIZE = 100

function memGet<T>(key: string): T | null {
	const entry = memCache.get(key) as CacheEntry<T> | undefined
	if (!entry) return null
	if (Date.now() > entry.expiresAt) {
		memCache.delete(key)
		return null
	}
	return entry.data
}

function memSet<T>(key: string, data: T, ttlSeconds: number): void {
	if (memCache.size >= MEM_CACHE_MAX_SIZE) {
		const firstKey = memCache.keys().next().value
		if (firstKey) memCache.delete(firstKey)
	}
	memCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export async function getCached<T>(env: Env, key: string): Promise<T | null> {
	const mem = memGet<T>(key)
	if (mem !== null) return mem

	try {
		const cached = await env.CACHE.get(key, 'json')
		if (!cached) return null

		const entry = cached as CacheEntry<T>
		if (Date.now() > entry.expiresAt) {
			return null
		}
		memSet(key, entry.data, Math.floor((entry.expiresAt - Date.now()) / 1000))
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
	memSet(key, data, ttl)
	const entry: CacheEntry<T> = {
		data,
		expiresAt: Date.now() + ttl * 1000,
	}
	await env.CACHE.put(key, JSON.stringify(entry), { expirationTtl: ttl })
}

export function cacheKey(type: string, ...parts: string[]): string {
	return `${type}:${parts.join(':')}`
}
