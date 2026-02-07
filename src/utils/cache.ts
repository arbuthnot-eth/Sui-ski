const DEFAULT_TTL = 300
const MAX_TTL = 86400
const CACHE_URL_PREFIX = 'https://cache.internal/'

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

async function cacheApiGet<T>(key: string): Promise<CacheEntry<T> | null> {
	try {
		const cache = await caches.open('sui-ski')
		const response = await cache.match(new Request(`${CACHE_URL_PREFIX}${encodeURIComponent(key)}`))
		if (!response) return null
		return (await response.json()) as CacheEntry<T>
	} catch {
		return null
	}
}

async function cacheApiSet<T>(key: string, entry: CacheEntry<T>, ttl: number): Promise<void> {
	try {
		const cache = await caches.open('sui-ski')
		await cache.put(
			new Request(`${CACHE_URL_PREFIX}${encodeURIComponent(key)}`),
			new Response(JSON.stringify(entry), {
				headers: { 'Cache-Control': `public, max-age=${ttl}` },
			}),
		)
	} catch {
		// Cache API failures are non-fatal
	}
}

export async function getCached<T>(key: string): Promise<T | null> {
	const mem = memGet<T>(key)
	if (mem !== null) return mem

	const entry = await cacheApiGet<T>(key)
	if (!entry) return null

	if (Date.now() > entry.expiresAt) {
		return null
	}
	memSet(key, entry.data, Math.floor((entry.expiresAt - Date.now()) / 1000))
	return entry.data
}

export async function setCache<T>(key: string, data: T, ttlSeconds = DEFAULT_TTL): Promise<void> {
	const ttl = Math.min(ttlSeconds, MAX_TTL)
	memSet(key, data, ttl)
	const entry: CacheEntry<T> = {
		data,
		expiresAt: Date.now() + ttl * 1000,
	}
	await cacheApiSet(key, entry, ttl)
}

export function cacheKey(type: string, ...parts: string[]): string {
	return `${type}:${parts.join(':')}`
}
