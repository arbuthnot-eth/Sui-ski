import { SuiGraphQLClient } from '@mysten/sui/graphql'
import { bcs } from '@mysten/sui/bcs'
import { fromHex, toBase64 } from '@mysten/sui/utils'
import type { Env } from '../types'

// ─── Client factory ────────────────────────────────────────────────────────

export function getSuiGraphQLClient(env: Env): SuiGraphQLClient {
	const url =
		(env as unknown as Record<string, string>).SUI_GRAPHQL_URL ??
		(env.SUI_NETWORK === 'testnet'
			? 'https://sui-testnet.mystenlabs.com/graphql'
			: 'https://sui-mainnet.mystenlabs.com/graphql')
	return new SuiGraphQLClient({ url, network: env.SUI_NETWORK as 'mainnet' | 'testnet' })
}

export function getSuiGraphQLUrl(env: Env): string {
	return (
		(env as unknown as Record<string, string>).SUI_GRAPHQL_URL ??
		(env.SUI_NETWORK === 'testnet'
			? 'https://sui-testnet.mystenlabs.com/graphql'
			: 'https://sui-mainnet.mystenlabs.com/graphql')
	)
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
	content?: {
		dataType: 'moveObject' | 'package'
		fields?: Record<string, unknown>
		type?: string
	}
}

export async function graphqlGetObject(
	client: SuiGraphQLClient,
	objectId: string,
	_options?: { showOwner?: boolean; showContent?: boolean; showDisplay?: boolean },
): Promise<{ data?: LegacyObject }> {
	const result = await client.getObject({ objectId })
	const obj = result.object
	if (!obj) return { data: undefined }

	const owner: LegacyObjectOwner = {}
	const rawOwner = obj.owner as
		| { $kind: string; AddressOwner?: string; ObjectOwner?: string }
		| undefined
	if (rawOwner) {
		if (rawOwner.$kind === 'AddressOwner' && rawOwner.AddressOwner) {
			owner.$kind = 'AddressOwner'
			owner.AddressOwner = rawOwner.AddressOwner
		} else if (rawOwner.$kind === 'ObjectOwner' && rawOwner.ObjectOwner) {
			owner.$kind = 'ObjectOwner'
			owner.ObjectOwner = rawOwner.ObjectOwner
		}
	}

	return {
		data: {
			objectId: obj.objectId,
			type: obj.type,
			owner,
		},
	}
}

// ─── Transaction helpers ─────────────────────────────────────────────────────

export interface GraphQLTxResult {
	ok: boolean
	status: number
	digest?: string
	effects?: { status?: { status: string; error?: string } }
	error?: string
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
		})
		const tx = result.transaction as
			| {
					digest?: string
					effects?: { status?: { status: string; error?: string } }
					status?: string
			  }
			| undefined
		const digest = tx?.digest
		const status = tx?.status ?? 'success'
		return {
			ok: status === 'success' || status === 'Success',
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
		const result = await client.getTransaction({ digest })
		return { data: result.transaction as unknown as Record<string, unknown> }
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

	const result = await client.query({
		query: EVENTS_GQL,
		variables: {
			filter: gqlFilter,
			first: opts?.limit ?? 50,
			after: opts?.cursor ?? null,
		},
	})

	// biome-ignore lint: accessing generated GraphQL response shape
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
		const tsMs = node.timestamp
			? String(new Date(node.timestamp).getTime())
			: undefined
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
		return toBase64(bcs.vector(bcs.u8()).serialize(bytes))
	}

	// Struct with single { bytes: [...] } field (e.g. PriceIdentifier)
	if (typeof value === 'object' && value !== null && 'bytes' in value) {
		const bytes = (value as { bytes: number[] }).bytes
		return toBase64(bcs.vector(bcs.u8()).serialize(bytes))
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

	// biome-ignore lint: accessing generated GraphQL response shape
	const raw = result.data as Record<string, unknown>
	const field = (raw?.object as Record<string, unknown> | undefined)
		?.dynamicObjectField as
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
