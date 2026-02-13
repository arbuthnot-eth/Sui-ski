import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { getDefaultRpcUrl, getGraphQLUrl } from '../utils/rpc'

const MS_PER_DAY = 86_400_000
const GRACE_PERIOD_MS = 30 * MS_PER_DAY
const EXPIRING_WINDOW_MS = 7 * MS_PER_DAY
const RESCAN_INTERVAL_MS = 24 * MS_PER_DAY
const PAGES_PER_INVOCATION = 500
const PAGE_SIZE = 50
const VERIFY_BATCH_SIZE = 50

const SUINS_REGISTRY_TABLE = '0xe64cd9db9f829c6cc405d9790bd71567ae07259855f4fba6f02c84f52298c106'
const SUINS_DOMAIN_TYPE =
	'0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::domain::Domain'

const KV_CURSOR = 'expiring-scan:cursor'
const KV_TRACKED = 'expiring-names:tracked'
const KV_LAST_SCAN = 'expiring-names:last-scan'
const KV_TOTAL_FIELDS = 'expiring-scan:total-fields'

interface StoredName {
	name: string
	expirationMs: number
}

interface ScanState {
	cursor: string | null
	totalProcessed: number
}

interface DynamicFieldNode {
	name: { json: { labels?: string[] } | null }
	value: { json: { expiration_timestamp_ms?: string } | null } | null
}

interface GraphQLPageInfo {
	hasNextPage: boolean
	endCursor: string | null
}

interface GraphQLResponse {
	data?: {
		object?: {
			dynamicFields?: {
				pageInfo: GraphQLPageInfo
				nodes: DynamicFieldNode[]
			}
		}
	}
	errors?: Array<{ message: string }>
}

const SCAN_QUERY = `
query ScanNameRecords($parentId: SuiAddress!, $cursor: String) {
  object(address: $parentId) {
    dynamicFields(first: ${PAGE_SIZE}, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        name { json }
        value {
          ... on MoveValue { json }
        }
      }
    }
  }
}
`

async function fetchPage(
	graphqlUrl: string,
	cursor: string | null,
): Promise<{ nodes: DynamicFieldNode[]; pageInfo: GraphQLPageInfo }> {
	const variables: Record<string, unknown> = { parentId: SUINS_REGISTRY_TABLE }
	if (cursor) variables.cursor = cursor

	const response = await fetch(graphqlUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query: SCAN_QUERY, variables }),
	})

	if (!response.ok) {
		throw new Error(`GraphQL request failed (${response.status}): ${await response.text()}`)
	}

	const result = (await response.json()) as GraphQLResponse

	if (result.errors?.length) {
		throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`)
	}

	const connection = result.data?.object?.dynamicFields
	if (!connection) {
		return { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } }
	}

	return { nodes: connection.nodes, pageInfo: connection.pageInfo }
}

function extractFromNode(node: DynamicFieldNode): { name: string; expirationMs: number } | null {
	const labels = node.name?.json?.labels
	if (!labels || labels.length < 2) return null

	const rawExp = node.value?.json?.expiration_timestamp_ms
	if (!rawExp) return null

	const expirationMs = Number(rawExp)
	if (Number.isNaN(expirationMs) || expirationMs <= 0) return null

	let name = ''
	for (let i = labels.length - 1; i >= 1; i--) {
		if (name) name += '.'
		name += labels[i]
	}

	if (!name) return null
	return { name, expirationMs }
}

function nameToDomainLabels(name: string): string[] {
	const parts = name.split('.')
	const labels = ['sui']
	for (let i = parts.length - 1; i >= 0; i--) labels.push(parts[i])
	return labels
}

function mergeTracked(existing: StoredName[], incoming: StoredName[], now: number): StoredName[] {
	const byName = new Map<string, StoredName>()
	const cutoff = now - GRACE_PERIOD_MS

	for (const entry of existing) {
		if (entry.expirationMs > cutoff) byName.set(entry.name, entry)
	}
	for (const entry of incoming) {
		if (entry.expirationMs > cutoff) byName.set(entry.name, entry)
	}

	const result = Array.from(byName.values())
	result.sort((a, b) => a.expirationMs - b.expirationMs)
	return result
}

function isInCaptureWindow(expirationMs: number, now: number): boolean {
	const gracePeriodEndsMs = expirationMs + GRACE_PERIOD_MS
	const expired = expirationMs < now
	const graceActive = gracePeriodEndsMs > now
	const upcoming = !expired && expirationMs < now + RESCAN_INTERVAL_MS
	return (expired && graceActive) || upcoming
}

async function fetchNameExpiration(name: string, rpcUrl: string): Promise<number | null> {
	const labels = nameToDomainLabels(name)

	try {
		const response = await fetch(rpcUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'suix_getDynamicFieldObject',
				params: [SUINS_REGISTRY_TABLE, { type: SUINS_DOMAIN_TYPE, value: { labels } }],
			}),
		})

		const result = (await response.json()) as {
			result?: {
				data?: {
					content?: {
						fields?: { value?: { fields?: { expiration_timestamp_ms?: string } } }
					}
				}
			}
		}

		const expStr = result.result?.data?.content?.fields?.value?.fields?.expiration_timestamp_ms
		if (!expStr) return null
		return Number(expStr)
	} catch {
		return null
	}
}

async function verifyNames(
	names: StoredName[],
	rpcUrl: string,
	now: number,
): Promise<StoredName[]> {
	if (names.length === 0) return []

	const verified: StoredName[] = []

	for (let i = 0; i < names.length; i += VERIFY_BATCH_SIZE) {
		const batch = names.slice(i, i + VERIFY_BATCH_SIZE)
		const checks = batch.map(async (entry) => {
			const currentExp = await fetchNameExpiration(entry.name, rpcUrl)
			if (currentExp === null) return entry
			if (currentExp + GRACE_PERIOD_MS <= now) return null
			return { name: entry.name, expirationMs: currentExp }
		})

		const results = await Promise.all(checks)
		for (const r of results) {
			if (r) verified.push(r)
		}
	}

	return verified
}

async function fullScan(env: Env, now: number): Promise<void> {
	const graphqlUrl = getGraphQLUrl(env.SUI_NETWORK)

	const [cursorRaw, trackedRaw, totalFieldsRaw] = await Promise.all([
		env.CACHE.get(KV_CURSOR),
		env.CACHE.get(KV_TRACKED),
		env.CACHE.get(KV_TOTAL_FIELDS),
	])

	const state: ScanState = cursorRaw
		? (JSON.parse(cursorRaw) as ScanState)
		: { cursor: null, totalProcessed: 0 }
	const existingTracked: StoredName[] = trackedRaw ? (JSON.parse(trackedRaw) as StoredName[]) : []
	const prevTotalFields = totalFieldsRaw ? Number(totalFieldsRaw) : 0
	const newEntries: StoredName[] = []

	let pagesProcessed = 0
	let scanComplete = false

	try {
		while (pagesProcessed < PAGES_PER_INVOCATION) {
			const page = await fetchPage(graphqlUrl, state.cursor)
			pagesProcessed++
			state.totalProcessed += page.nodes.length

			for (const node of page.nodes) {
				const record = extractFromNode(node)
				if (!record) continue
				if (isInCaptureWindow(record.expirationMs, now)) {
					newEntries.push(record)
				}
			}

			if (!page.pageInfo.hasNextPage) {
				scanComplete = true
				break
			}

			state.cursor = page.pageInfo.endCursor
		}
	} catch (err) {
		console.error(`[expiring-names] Scan error after ${pagesProcessed} pages:`, err)
	}

	const merged = mergeTracked(existingTracked, newEntries, now)

	const writes: Promise<void>[] = [env.CACHE.put(KV_TRACKED, JSON.stringify(merged))]
	if (scanComplete) {
		writes.push(
			env.CACHE.put(KV_LAST_SCAN, String(now)),
			env.CACHE.put(KV_TOTAL_FIELDS, String(state.totalProcessed)),
			env.CACHE.delete(KV_CURSOR),
		)
	} else {
		writes.push(env.CACHE.put(KV_CURSOR, JSON.stringify(state)))
		if (state.totalProcessed > prevTotalFields) {
			writes.push(env.CACHE.put(KV_TOTAL_FIELDS, String(state.totalProcessed)))
		}
	}
	await Promise.all(writes)

	console.log(
		`[expiring-names] scan: ${pagesProcessed} pages, ${state.totalProcessed} total, +${newEntries.length} captured, ${merged.length} tracked, complete=${scanComplete}`,
	)
}

async function maintain(env: Env, now: number): Promise<void> {
	const trackedRaw = await env.CACHE.get(KV_TRACKED)
	const tracked: StoredName[] = trackedRaw ? (JSON.parse(trackedRaw) as StoredName[]) : []

	if (tracked.length === 0) return

	const cutoff = now - GRACE_PERIOD_MS
	const alive: StoredName[] = []
	let pruned = 0
	for (const entry of tracked) {
		if (entry.expirationMs > cutoff) {
			alive.push(entry)
		} else {
			pruned++
		}
	}

	const windowStart = now - GRACE_PERIOD_MS + EXPIRING_WINDOW_MS
	const needsVerification: StoredName[] = []
	const noVerifyNeeded: StoredName[] = []
	for (const entry of alive) {
		if (entry.expirationMs < now && entry.expirationMs >= windowStart) {
			needsVerification.push(entry)
		} else {
			noVerifyNeeded.push(entry)
		}
	}

	const rpcUrl = getDefaultRpcUrl(env.SUI_NETWORK)
	const verified = await verifyNames(needsVerification, rpcUrl, now)
	const renewed = needsVerification.length - verified.length

	if (pruned === 0 && renewed === 0) {
		console.log(
			`[expiring-names] maintain: no changes (${tracked.length} tracked, ${needsVerification.length} verified)`,
		)
		return
	}

	const final = mergeTracked(noVerifyNeeded, verified, now)
	await env.CACHE.put(KV_TRACKED, JSON.stringify(final))

	console.log(
		`[expiring-names] maintain: ${pruned} pruned, ${renewed} renewed, ${final.length} tracked`,
	)
}

export async function debugScan(env: Env): Promise<Record<string, unknown>> {
	const graphqlUrl = getGraphQLUrl(env.SUI_NETWORK)
	const log: string[] = []
	log.push(`network=${env.SUI_NETWORK}, graphqlUrl=${graphqlUrl}`)

	try {
		const page = await fetchPage(graphqlUrl, null)
		log.push(`firstPage: ${page.nodes.length} nodes, hasNext=${page.pageInfo.hasNextPage}`)

		if (page.nodes.length > 0) {
			const firstNode = page.nodes[0]
			log.push(`firstNode.name.json=${JSON.stringify(firstNode.name?.json)}`)
			log.push(`firstNode.value=${JSON.stringify(firstNode.value)}`)

			const extracted = extractFromNode(firstNode)
			log.push(`extracted=${JSON.stringify(extracted)}`)
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.push(`fetchPage error: ${msg}`)
	}

	try {
		await env.CACHE.put('expiring-debug:test', 'ok')
		const val = await env.CACHE.get('expiring-debug:test')
		log.push(`kvWrite: ${val}`)
		await env.CACHE.delete('expiring-debug:test')
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err)
		log.push(`kvWrite error: ${msg}`)
	}

	return { log }
}

export async function scanExpiringNames(env: Env): Promise<void> {
	const now = Date.now()

	const [cursorRaw, lastScanRaw] = await Promise.all([
		env.CACHE.get(KV_CURSOR),
		env.CACHE.get(KV_LAST_SCAN),
	])

	const scanInProgress = cursorRaw !== null
	const lastScanMs = lastScanRaw ? Number(lastScanRaw) : 0
	const scanStale = now - lastScanMs > RESCAN_INTERVAL_MS

	if (scanInProgress || scanStale) {
		await fullScan(env, now)
	} else {
		await maintain(env, now)
	}
}

export async function handleExpiringNames(env: Env): Promise<Response> {
	const [trackedRaw, lastScanRaw, cursorRaw, totalFieldsRaw] = await Promise.all([
		env.CACHE.get(KV_TRACKED),
		env.CACHE.get(KV_LAST_SCAN),
		env.CACHE.get(KV_CURSOR),
		env.CACHE.get(KV_TOTAL_FIELDS),
	])

	const tracked: StoredName[] = trackedRaw ? (JSON.parse(trackedRaw) as StoredName[]) : []
	const lastScanMs = lastScanRaw ? Number(lastScanRaw) : null
	const totalFields = totalFieldsRaw ? Number(totalFieldsRaw) : 0

	let scanProgress = '0%'
	if (cursorRaw && totalFields > 0) {
		const cursorState = JSON.parse(cursorRaw) as ScanState
		scanProgress = `${Math.min(99, Math.round((cursorState.totalProcessed / totalFields) * 100))}%`
	} else if (lastScanMs) {
		scanProgress = '100%'
	}

	const now = Date.now()
	const names: Array<{
		name: string
		expirationMs: number
		gracePeriodEndsMs: number
		daysLeft: number
	}> = []

	for (const entry of tracked) {
		const gracePeriodEndsMs = entry.expirationMs + GRACE_PERIOD_MS
		const expired = entry.expirationMs < now
		const graceActive = gracePeriodEndsMs > now
		const inWindow = gracePeriodEndsMs - now < EXPIRING_WINDOW_MS

		if (expired && graceActive && inWindow) {
			names.push({
				name: entry.name,
				expirationMs: entry.expirationMs,
				gracePeriodEndsMs,
				daysLeft: Math.max(0, Math.ceil((gracePeriodEndsMs - now) / MS_PER_DAY)),
			})
		}
	}

	names.sort((a, b) => a.gracePeriodEndsMs - b.gracePeriodEndsMs)

	return jsonResponse({ names, lastScanMs, scanProgress, totalTracked: names.length })
}
