import invariant from 'tiny-invariant'
import type { EventData, MmrState } from './mmr'
import { appendLeaf, createMmr, hashEvent, verifyAgainstCommitment } from './mmr'

export interface AuthenticatedEvent {
	checkpoint: bigint
	transactionIndex: number
	eventIndex: number
	type: string
	packageId: string
	parsedJson: Record<string, unknown>
	bcsPayload: Uint8Array
}

export interface EventStreamHead {
	mmr: bigint[]
	checkpointSeq: bigint
	numEvents: bigint
	streamId: string
}

export interface ListAuthenticatedEventsArgs {
	streamId: string
	startCheckpoint?: bigint
	pageSize?: number
	pageToken?: string
}

export interface ListAuthenticatedEventsResponse {
	events: AuthenticatedEvent[]
	highestIndexedCheckpoint: bigint
	nextPageToken: string
}

export interface ObjectInclusionProof {
	objectRef: { objectId: string; version: bigint; digest: string }
	merkleProof: Uint8Array
	leafIndex: number
	treeRoot: Uint8Array
	objectData: Uint8Array
	checkpointSummary: Uint8Array
}

export interface EventVerificationResult {
	verified: boolean
	streamId: string
	eventCount: bigint
	checkpoint: bigint
	error?: string
}

const MAX_PAGE_SIZE = 1000
const DEFAULT_PAGE_SIZE = 100

export class AuthenticatedEventsClient {
	readonly #rpcUrl: string

	constructor(args: { rpcUrl: string }) {
		invariant(args.rpcUrl.length > 0, 'rpcUrl must not be empty')
		this.#rpcUrl = args.rpcUrl
	}

	async listEvents(args: ListAuthenticatedEventsArgs): Promise<ListAuthenticatedEventsResponse> {
		invariant(args.streamId.length > 0, 'streamId must not be empty')
		const pageSize = Math.min(args.pageSize ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)

		const params: Record<string, unknown> = {
			stream_id: args.streamId,
			page_size: pageSize,
		}
		if (args.startCheckpoint !== undefined) {
			params.start_checkpoint = args.startCheckpoint.toString()
		}
		if (args.pageToken) {
			params.page_token = args.pageToken
		}

		const result = await this.#rpcCall<{
			events?: Array<{
				checkpoint: string
				transaction_index: number
				event_index: number
				type: string
				package_id: string
				parsed_json: Record<string, unknown>
				bcs_payload?: string
			}>
			highest_indexed_checkpoint: string
			next_page_token: string
		}>('sui_listAuthenticatedEvents', [params])

		const events: AuthenticatedEvent[] = (result.events ?? []).map((raw) => ({
			checkpoint: BigInt(raw.checkpoint),
			transactionIndex: raw.transaction_index,
			eventIndex: raw.event_index,
			type: raw.type,
			packageId: raw.package_id,
			parsedJson: raw.parsed_json,
			bcsPayload: raw.bcs_payload ? base64ToBytes(raw.bcs_payload) : new Uint8Array(0),
		}))

		return {
			events,
			highestIndexedCheckpoint: BigInt(result.highest_indexed_checkpoint || '0'),
			nextPageToken: result.next_page_token || '',
		}
	}

	async getStreamHead(streamId: string): Promise<EventStreamHead | null> {
		invariant(streamId.length > 0, 'streamId must not be empty')

		const headObjectId = deriveStreamHeadId(streamId)

		const result = await this.#rpcCall<{
			data?: {
				content?: {
					fields?: {
						mmr?: string[]
						checkpoint_seq?: string
						num_events?: string
					}
				}
				objectId?: string
			}
		}>('sui_getObject', [headObjectId, { showContent: true }])

		if (!result.data?.content?.fields) return null

		const fields = result.data.content.fields
		return {
			mmr: (fields.mmr ?? []).map((v: string) => BigInt(v)),
			checkpointSeq: BigInt(fields.checkpoint_seq ?? '0'),
			numEvents: BigInt(fields.num_events ?? '0'),
			streamId,
		}
	}

	async getObjectInclusionProof(
		objectId: string,
		checkpoint: bigint,
	): Promise<ObjectInclusionProof | null> {
		invariant(objectId.length > 0, 'objectId must not be empty')
		invariant(checkpoint >= 0n, `checkpoint must be non-negative, got ${checkpoint}`)

		const result = await this.#rpcCall<{
			object_ref?: { object_id: string; version: string; digest: string }
			inclusion_proof?: {
				merkle_proof: string
				leaf_index: number
				tree_root: string
			}
			object_data?: string
			checkpoint_summary?: string
		}>('sui_getObjectInclusionProof', [objectId, checkpoint.toString()])

		if (!result.object_ref || !result.inclusion_proof) return null

		return {
			objectRef: {
				objectId: result.object_ref.object_id,
				version: BigInt(result.object_ref.version),
				digest: result.object_ref.digest,
			},
			merkleProof: base64ToBytes(result.inclusion_proof.merkle_proof),
			leafIndex: result.inclusion_proof.leaf_index,
			treeRoot: base64ToBytes(result.inclusion_proof.tree_root),
			objectData: base64ToBytes(result.object_data ?? ''),
			checkpointSummary: base64ToBytes(result.checkpoint_summary ?? ''),
		}
	}

	async verifyEvents(
		streamId: string,
		events: AuthenticatedEvent[],
		expectedHead: EventStreamHead,
	): Promise<EventVerificationResult> {
		invariant(streamId.length > 0, 'streamId must not be empty')

		if (events.length === 0) {
			return {
				verified: true,
				streamId,
				eventCount: 0n,
				checkpoint: expectedHead.checkpointSeq,
			}
		}

		let mmr: MmrState = createMmr()

		for (const event of events) {
			const eventData: EventData = {
				type: event.type,
				packageId: event.packageId,
				bcsPayload: event.bcsPayload,
				checkpoint: event.checkpoint,
				transactionIndex: event.transactionIndex,
				eventIndex: event.eventIndex,
			}
			const leafHash = await hashEvent(eventData)
			mmr = await appendLeaf(mmr, leafHash)
		}

		const verified = verifyAgainstCommitment(mmr, expectedHead.mmr)

		return {
			verified,
			streamId,
			eventCount: BigInt(events.length),
			checkpoint: events[events.length - 1].checkpoint,
			error: verified ? undefined : 'MMR commitment mismatch: events do not match on-chain state',
		}
	}

	async *streamEvents(
		streamId: string,
		startCheckpoint?: bigint,
	): AsyncGenerator<AuthenticatedEvent> {
		let pageToken = ''
		let hasMore = true

		while (hasMore) {
			const response = await this.listEvents({
				streamId,
				startCheckpoint: pageToken ? undefined : startCheckpoint,
				pageSize: MAX_PAGE_SIZE,
				pageToken: pageToken || undefined,
			})

			for (const event of response.events) {
				yield event
			}

			if (response.nextPageToken && response.events.length > 0) {
				pageToken = response.nextPageToken
			} else {
				hasMore = false
			}
		}
	}

	async #rpcCall<T>(method: string, params: unknown[]): Promise<T> {
		const response = await fetch(this.#rpcUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method,
				params,
			}),
		})

		invariant(response.ok, `RPC request failed: ${response.status} ${response.statusText}`)

		const json = (await response.json()) as {
			result?: T
			error?: { message: string; code: number }
		}

		if (json.error) {
			invariant(false, `RPC error ${json.error.code}: ${json.error.message}`)
		}

		return json.result as T
	}
}

function deriveStreamHeadId(streamId: string): string {
	return streamId
}

function base64ToBytes(base64: string): Uint8Array {
	if (!base64) return new Uint8Array(0)
	const binary = atob(base64)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return bytes
}
