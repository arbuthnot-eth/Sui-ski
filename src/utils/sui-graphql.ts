import { bcs } from '@mysten/sui/bcs'
import { SuiGraphQLClient } from '@mysten/sui/graphql'
import { SuiGrpcClient } from '@mysten/sui/grpc'
import type { SuiEventFilter } from '@mysten/sui/jsonRpc'
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { fromHex, toBase64 } from '@mysten/sui/utils'
import type { Env } from '../types'
import { getDefaultRpcUrl } from './rpc'

// ─── gRPC URL mapping ─────────────────────────────────────────────────────
const GRPC_URLS: Record<string, string> = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
	devnet: 'https://fullnode.devnet.sui.io:443',
}

// ─── Client factory ────────────────────────────────────────────────────────

export function getSuiGraphQLClient(env: Env): SuiGraphQLClient {
	const url =
		(env as unknown as Record<string, string>).SUI_GRAPHQL_URL ??
		(env.SUI_NETWORK === 'testnet'
			? 'https://sui-testnet.mystenlabs.com/graphql'
			: 'https://sui-mainnet.mystenlabs.com/graphql')
	return new SuiGraphQLClient({ url, network: env.SUI_NETWORK as 'mainnet' | 'testnet' })
}

export function getSuiGrpcClient(env: Env): SuiGrpcClient {
	const baseUrl = GRPC_URLS[env.SUI_NETWORK] ?? GRPC_URLS.mainnet
	return new SuiGrpcClient({ baseUrl, network: env.SUI_NETWORK as 'mainnet' | 'testnet' })
}

export function getSuiRpcClient(env: Env): SuiJsonRpcClient {
	const url = env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK)
	return new SuiJsonRpcClient({ url, network: env.SUI_NETWORK })
}

export function getSuiGraphQLUrl(env: Env): string {
	return (
		(env as unknown as Record<string, string>).SUI_GRAPHQL_URL ??
		(env.SUI_NETWORK === 'testnet'
			? 'https://sui-testnet.mystenlabs.com/graphql'
			: 'https://sui-mainnet.mystenlabs.com/graphql')
	)
}

// ─── Race transports ────────────────────────────────────────────────────────

/**
 * Fire multiple transport calls in parallel, return the first successful result.
 * If all fail, throw the last error.
 */
export async function raceTransports<T>(calls: Array<() => Promise<T>>): Promise<T> {
	if (calls.length === 0) throw new Error('raceTransports: no calls provided')
	if (calls.length === 1) return calls[0]()

	// Use Promise.any — resolves with first success, rejects only if ALL fail
	try {
		return await Promise.any(calls.map((fn) => fn()))
	} catch (aggError) {
		if (aggError instanceof AggregateError) {
			throw aggError.errors[aggError.errors.length - 1]
		}
		throw aggError
	}
}

// ─── Object helpers ─────────────────────────────────────────────────────────

export interface LegacyObjectOwner {
	$kind?: string
	AddressOwner?: string
	ObjectOwner?: string
	Shared?: { initialSharedVersion?: string }
	Immutable?: null
}

export interface LegacyObject {
	objectId: string
	type?: string
	owner?: LegacyObjectOwner
	display?: Record<string, string>
	content?: {
		dataType: 'moveObject' | 'package'
		fields?: Record<string, unknown>
		type?: string
	}
}

const GET_OBJECT_GQL = `
query GetObject($id: SuiAddress!) {
  object(address: $id) {
    address
    version
    digest
    type { repr }
    owner {
      ... on AddressOwner { owner { address } }
      ... on ObjectOwner { owner { address } }
    }
    display { key value }
    asMoveObject {
      contents { json type { repr } }
    }
  }
}`

export async function graphqlGetObject(
	client: SuiGraphQLClient,
	objectId: string,
	_options?: { showOwner?: boolean; showContent?: boolean; showDisplay?: boolean },
	rpcClient?: SuiJsonRpcClient,
	grpcClient?: SuiGrpcClient,
): Promise<{ data?: LegacyObject }> {
	const calls: Array<() => Promise<{ data?: LegacyObject }>> = []

	if (grpcClient) {
		calls.push(() => grpcGetObject(grpcClient, objectId))
	}

	calls.push(() => graphqlGetObjectDirect(client, objectId))

	if (rpcClient) {
		calls.push(() => rpcGetObject(rpcClient, objectId))
	}

	return raceTransports(calls)
}

async function graphqlGetObjectDirect(
	client: SuiGraphQLClient,
	objectId: string,
): Promise<{ data?: LegacyObject }> {
	const result = await client.query({
		query: GET_OBJECT_GQL,
		variables: { id: objectId },
	})

	const raw = result.data as Record<string, unknown>
	const obj = raw?.object as
		| {
				address?: string
				version?: number
				digest?: string
				type?: { repr?: string }
				owner?: { owner?: { address?: string } }
				display?: Array<{ key: string; value: string }>
				asMoveObject?: {
					contents?: {
						json?: Record<string, unknown>
						type?: { repr?: string }
					}
				}
		  }
		| undefined
	if (!obj?.address) return { data: undefined }

	const owner: LegacyObjectOwner = {}
	if (obj.owner?.owner?.address) {
		owner.$kind = 'AddressOwner'
		owner.AddressOwner = obj.owner.owner.address
	}

	const displayMap: Record<string, string> = {}
	if (obj.display) {
		for (const entry of obj.display) {
			displayMap[entry.key] = entry.value
		}
	}

	const contents = obj.asMoveObject?.contents
	const content = contents?.json
		? {
				dataType: 'moveObject' as const,
				fields: contents.json as Record<string, unknown>,
				type: contents.type?.repr,
			}
		: undefined

	return {
		data: {
			objectId: obj.address,
			type: obj.type?.repr,
			owner,
			display: Object.keys(displayMap).length > 0 ? displayMap : undefined,
			content,
		},
	}
}

export async function rpcGetObject(
	rpcClient: SuiJsonRpcClient,
	objectId: string,
): Promise<{ data?: LegacyObject }> {
	const rpcResult = await rpcClient.getObject({
		id: objectId,
		options: { showContent: true, showOwner: true, showDisplay: true, showType: true },
	})

	const rpcObj = rpcResult.data as Record<string, unknown> | undefined
	if (!rpcObj) return { data: undefined }

	const owner: LegacyObjectOwner = {}
	const rpcOwner = rpcObj.owner as Record<string, string> | string | undefined
	if (rpcOwner && typeof rpcOwner === 'object') {
		if ('AddressOwner' in rpcOwner) {
			owner.$kind = 'AddressOwner'
			owner.AddressOwner = rpcOwner.AddressOwner
		} else if ('ObjectOwner' in rpcOwner) {
			owner.$kind = 'ObjectOwner'
			owner.ObjectOwner = rpcOwner.ObjectOwner
		}
	}

	const rpcDisplay = rpcObj.display as { data?: Record<string, string> | null } | undefined
	const displayMap = rpcDisplay?.data ?? undefined

	const rpcContent = rpcObj.content as
		| {
				dataType?: string
				fields?: Record<string, unknown>
				type?: string
		  }
		| undefined
	const content =
		rpcContent?.dataType === 'moveObject'
			? {
					dataType: 'moveObject' as const,
					fields: rpcContent.fields,
					type: rpcContent.type,
				}
			: undefined

	return {
		data: {
			objectId: rpcObj.objectId as string,
			type: rpcObj.type as string | undefined,
			owner,
			display: displayMap && Object.keys(displayMap).length > 0 ? displayMap : undefined,
			content,
		},
	}
}

export async function grpcGetObject(
	grpcClient: SuiGrpcClient,
	objectId: string,
): Promise<{ data?: LegacyObject }> {
	const result = await grpcClient.getObject({ objectId, include: { json: true } })

	const obj = result.object as
		| {
				objectId?: string
				version?: string
				digest?: string
				type?: string
				owner?: LegacyObjectOwner
				json?: Record<string, unknown>
		  }
		| undefined

	if (!obj?.objectId) return { data: undefined }

	return {
		data: {
			objectId: obj.objectId,
			type: obj.type,
			owner: obj.owner,
			display: undefined,
			content: obj.json
				? {
						dataType: 'moveObject' as const,
						fields: obj.json as Record<string, unknown>,
						type: obj.type,
					}
				: undefined,
		},
	}
}

// ─── Transaction helpers ─────────────────────────────────────────────────────

export interface GraphQLTxResult {
	ok: boolean
	status: number
	digest?: string
	effects?: TransactionLike['effects']
	error?: string
}

type TransactionLike = {
	digest?: string
	status?: { success?: boolean; error?: string | null } | string
	effects?: {
		status?: { success?: boolean; error?: string | null } | { status?: string; error?: string }
		changedObjects?: Array<{
			objectId: string
			idOperation?: string
		}>
	}
	objectTypes?: Record<string, string>
	events?: Array<{
		eventType: string
		json: Record<string, unknown> | null
	}>
}

export function unwrapTransactionResult(result: {
	$kind: 'Transaction' | 'FailedTransaction'
	Transaction?: unknown
	FailedTransaction?: unknown
}): TransactionLike | undefined {
	if (result.$kind === 'Transaction') return result.Transaction as unknown as TransactionLike
	if (result.$kind === 'FailedTransaction') {
		return result.FailedTransaction as unknown as TransactionLike
	}
	return undefined
}

function isTransactionSuccess(tx: TransactionLike | undefined): boolean {
	if (!tx) return false
	if (typeof tx.status === 'string') {
		return tx.status.toLowerCase() === 'success'
	}
	if (typeof tx.status?.success === 'boolean') {
		return tx.status.success
	}
	const effectsStatus = tx.effects?.status
	if (effectsStatus && typeof effectsStatus === 'object') {
		if ('success' in effectsStatus && typeof effectsStatus.success === 'boolean') {
			return effectsStatus.success
		}
		if ('status' in effectsStatus && typeof effectsStatus.status === 'string') {
			return effectsStatus.status.toLowerCase() === 'success'
		}
	}
	return false
}

export async function graphqlExecuteTransaction(
	client: SuiGraphQLClient,
	txBytes: Uint8Array,
	signatures: string[],
): Promise<GraphQLTxResult> {
	try {
		const result = await client.executeTransaction({
			transaction: txBytes,
			signatures,
			include: { effects: true },
		})
		const tx = unwrapTransactionResult(result)
		const digest = tx?.digest
		return {
			ok: isTransactionSuccess(tx),
			status: 200,
			digest,
			effects: tx?.effects,
		}
	} catch (error) {
		return {
			ok: false,
			status: 0,
			error: error instanceof Error ? error.message : 'GraphQL execute failed',
		}
	}
}

export async function graphqlGetTransaction(
	client: SuiGraphQLClient,
	digest: string,
): Promise<{ data?: Record<string, unknown>; error?: string }> {
	try {
		const result = await client.getTransaction({ digest, include: { effects: true, events: true } })
		const tx = unwrapTransactionResult(result)
		return tx
			? { data: tx as unknown as Record<string, unknown> }
			: { error: 'Transaction not found' }
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'Unknown error' }
	}
}

export async function graphqlGetBalance(
	client: SuiGraphQLClient,
	address: string,
	coinType?: string,
): Promise<{ balance?: string; coinType?: string; error?: string }> {
	try {
		const result = await client.getBalance({ owner: address, coinType })
		return {
			balance: result.balance.coinBalance,
			coinType: result.balance.coinType,
		}
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'Unknown error' }
	}
}

// ─── Events helpers ──────────────────────────────────────────────────────────

const EVENTS_GQL = `
query QueryEvents($filter: EventFilter!, $first: Int, $after: String) {
  events(filter: $filter, first: $first, after: $after) {
    nodes {
      type { repr }
      json
      timestamp
      transactionBlock { digest }
    }
    pageInfo { hasNextPage endCursor }
  }
}`

export interface LegacyEventFilter {
	MoveEventModule?: { package: string; module: string }
	Sender?: string
	[k: string]: unknown
}

export interface LegacyEvent {
	id: { txDigest: string; eventSeq: string }
	type: string
	parsedJson: Record<string, unknown>
	timestampMs?: string
}

export async function graphqlQueryEvents(
	client: SuiGraphQLClient,
	filter: LegacyEventFilter,
	opts?: { limit?: number; order?: 'ascending' | 'descending'; cursor?: string | null },
): Promise<{ data: LegacyEvent[]; hasNextPage: boolean; nextCursor?: string | null }> {
	const gqlFilter: Record<string, unknown> = {}
	if (filter.MoveEventModule) {
		gqlFilter.emittingModule = `${filter.MoveEventModule.package}::${filter.MoveEventModule.module}`
	}
	if (filter.Sender) {
		gqlFilter.sender = filter.Sender
	}

	const result = await client.query({
		query: EVENTS_GQL,
		variables: {
			filter: gqlFilter,
			first: opts?.limit ?? 50,
			after: opts?.cursor ?? null,
		},
	})

	const raw = result.data as Record<string, unknown>
	const eventsData = raw?.events as
		| {
				nodes?: Array<{
					type?: { repr?: string }
					json?: Record<string, unknown>
					timestamp?: string
					transactionBlock?: { digest?: string }
				}>
				pageInfo?: { hasNextPage?: boolean; endCursor?: string | null }
		  }
		| undefined

	const nodes = eventsData?.nodes ?? []
	const pageInfo = eventsData?.pageInfo

	const data: LegacyEvent[] = nodes.map((node, i) => {
		const txDigest = node.transactionBlock?.digest ?? ''
		const tsMs = node.timestamp ? String(new Date(node.timestamp).getTime()) : undefined
		return {
			id: { txDigest, eventSeq: String(i) },
			type: node.type?.repr ?? '',
			parsedJson: node.json ?? {},
			timestampMs: tsMs,
		}
	})

	return {
		data,
		hasNextPage: pageInfo?.hasNextPage ?? false,
		nextCursor: pageInfo?.endCursor ?? null,
	}
}

// ─── Dynamic field helpers ───────────────────────────────────────────────────

const DYNAMIC_OBJECT_FIELD_GQL = `
query GetDynamicObjectField($parentId: SuiAddress!, $type: String!, $bcs: Base64!) {
  object(address: $parentId) {
    dynamicObjectField(name: { type: $type, bcs: $bcs }) {
      address
      asMoveObject {
        contents { json type { repr } }
      }
    }
  }
}`

/**
 * Encode a legacy `{ type, value }` dynamic field name to base64 BCS bytes.
 * Handles the common types used in this codebase.
 */
function encodeLegacyName(type: string, value: unknown): string {
	const t = type.toLowerCase()

	// Address / ObjectID types → 32 raw bytes
	if (t === 'address' || t === '0x2::object::id' || t.endsWith('::object::id')) {
		const addr = String(value)
		const hex = addr.startsWith('0x') ? addr.slice(2) : addr
		return toBase64(fromHex(hex.padStart(64, '0')))
	}

	// vector<u8> with string or bytes
	if (t === 'vector<u8>') {
		let bytes: number[]
		if (typeof value === 'string') {
			bytes = Array.from(new TextEncoder().encode(value))
		} else if (Array.isArray(value)) {
			bytes = value as number[]
		} else {
			bytes = []
		}
		return toBase64(bcs.vector(bcs.u8()).serialize(bytes).toBytes())
	}

	// Struct with single { bytes: [...] } field (e.g. PriceIdentifier)
	if (typeof value === 'object' && value !== null && 'bytes' in value) {
		const bytes = (value as { bytes: number[] }).bytes
		return toBase64(bcs.vector(bcs.u8()).serialize(bytes).toBytes())
	}

	throw new Error(`Cannot BCS-encode dynamic field name for type: ${type}`)
}

export interface LegacyDynamicFieldObject {
	data?: {
		objectId: string
		type?: string
		content?: {
			dataType: 'moveObject' | 'package'
			fields?: Record<string, unknown>
		}
	}
}

export async function graphqlGetDynamicField(
	client: SuiGraphQLClient,
	parentId: string,
	name: { type: string; value: unknown },
): Promise<LegacyDynamicFieldObject> {
	const bcsBased64 = encodeLegacyName(name.type, name.value)

	const result = await client.query({
		query: DYNAMIC_OBJECT_FIELD_GQL,
		variables: {
			parentId,
			type: name.type,
			bcs: bcsBased64,
		},
	})

	const raw = result.data as Record<string, unknown>
	const field = (raw?.object as Record<string, unknown> | undefined)?.dynamicObjectField as
		| {
				address?: string
				asMoveObject?: {
					contents?: {
						json?: Record<string, unknown>
						type?: { repr?: string }
					}
				}
		  }
		| undefined

	if (!field?.address) return { data: undefined }

	const json = field.asMoveObject?.contents?.json
	const typeRepr = field.asMoveObject?.contents?.type?.repr

	return {
		data: {
			objectId: field.address,
			type: typeRepr,
			content: json
				? {
						dataType: 'moveObject',
						fields: json as Record<string, unknown>,
					}
				: undefined,
		},
	}
}

export async function grpcGetDynamicObjectField(
	grpcClient: SuiGrpcClient,
	parentId: string,
	name: { type: string; value: unknown },
): Promise<LegacyDynamicFieldObject> {
	// Encode legacy name to BCS bytes (same encoding used for GraphQL)
	const bcsBase64 = encodeLegacyName(name.type, name.value)
	const bcsBytes = Uint8Array.from(atob(bcsBase64), (c) => c.charCodeAt(0))

	const result = await grpcClient.getDynamicField({
		parentId,
		name: { type: name.type, bcs: bcsBytes },
	})

	// Extract child object ID from the dynamic field entry
	const df = result.dynamicField as
		| {
				fieldId?: string
				childId?: string
				$kind?: string
		  }
		| undefined

	// For DynamicObjectField, the child object ID is in childId
	// For plain DynamicField, the fieldId IS the object containing the value
	const childId = df?.childId ?? df?.fieldId
	if (!childId) return { data: undefined }

	// Fetch the actual child object with JSON content
	const childResult = await grpcClient.getObject({ objectId: childId, include: { json: true } })
	const obj = childResult.object as
		| {
				objectId?: string
				type?: string
				json?: Record<string, unknown>
		  }
		| undefined

	if (!obj?.objectId) return { data: undefined }

	return {
		data: {
			objectId: obj.objectId,
			type: obj.type,
			content: obj.json
				? {
						dataType: 'moveObject',
						fields: obj.json as Record<string, unknown>,
					}
				: undefined,
		},
	}
}

export async function rpcGetDynamicObjectField(
	rpcClient: SuiJsonRpcClient,
	parentId: string,
	name: { type: string; value: unknown },
): Promise<LegacyDynamicFieldObject> {
	const result = await rpcClient.getDynamicFieldObject({
		parentId,
		name: { type: name.type, value: name.value },
	})

	const rpcObj = result.data as Record<string, unknown> | undefined
	if (!rpcObj) return { data: undefined }

	const rpcContent = rpcObj.content as
		| {
				dataType?: string
				fields?: Record<string, unknown>
				type?: string
		  }
		| undefined

	return {
		data: {
			objectId: rpcObj.objectId as string,
			type: rpcContent?.type,
			content:
				rpcContent?.dataType === 'moveObject'
					? {
							dataType: 'moveObject',
							fields: rpcContent.fields,
						}
					: undefined,
		},
	}
}

export async function rpcQueryEvents(
	rpcClient: SuiJsonRpcClient,
	filter: LegacyEventFilter,
	opts?: { limit?: number; order?: 'ascending' | 'descending'; cursor?: string | null },
): Promise<{ data: LegacyEvent[]; hasNextPage: boolean; nextCursor?: string | null }> {
	const parts: Array<Record<string, unknown>> = []
	if (filter.MoveEventModule) {
		parts.push({ MoveEventModule: filter.MoveEventModule })
	}
	if (filter.Sender) {
		parts.push({ Sender: filter.Sender })
	}
	const rpcFilter = (parts.length > 1 ? { All: parts } : (parts[0] ?? {})) as SuiEventFilter

	const result = await rpcClient.queryEvents({
		query: rpcFilter,
		limit: opts?.limit ?? 50,
		order: opts?.order ?? 'descending',
		cursor: opts?.cursor ? JSON.parse(opts.cursor) : undefined,
	})

	const events = result.data as Array<{
		id: { txDigest: string; eventSeq: string }
		type: string
		parsedJson: Record<string, unknown>
		timestampMs?: string
	}>

	const data: LegacyEvent[] = events.map((evt) => ({
		id: evt.id,
		type: evt.type,
		parsedJson: evt.parsedJson ?? {},
		timestampMs: evt.timestampMs,
	}))

	return {
		data,
		hasNextPage: result.hasNextPage ?? false,
		nextCursor: result.nextCursor ? JSON.stringify(result.nextCursor) : null,
	}
}

/**
 * Race event queries across GraphQL and JSON-RPC.
 */
export async function raceQueryEvents(
	client: SuiGraphQLClient,
	filter: LegacyEventFilter,
	opts?: { limit?: number; order?: 'ascending' | 'descending'; cursor?: string | null },
	rpcClient?: SuiJsonRpcClient,
): Promise<{ data: LegacyEvent[]; hasNextPage: boolean; nextCursor?: string | null }> {
	const calls: Array<
		() => Promise<{ data: LegacyEvent[]; hasNextPage: boolean; nextCursor?: string | null }>
	> = []

	calls.push(() => graphqlQueryEvents(client, filter, opts))

	if (rpcClient) {
		calls.push(() => rpcQueryEvents(rpcClient, filter, opts))
	}

	return raceTransports(calls)
}
