import invariant from 'tiny-invariant'
import type { Env } from '../types'
import type {
	AuthenticatedEvent,
	EventStreamHead,
	EventVerificationResult,
	ListAuthenticatedEventsResponse,
	ObjectInclusionProof,
} from '../utils/authenticated-events'
import { AuthenticatedEventsClient } from '../utils/authenticated-events'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { errorResponse, jsonResponse } from '../utils/response'

const STREAM_HEAD_CACHE_TTL = 30
const PROOF_CACHE_TTL = 300

function createClient(env: Env): AuthenticatedEventsClient {
	return new AuthenticatedEventsClient({
		rpcUrl: env.SUI_RPC_URL,
	})
}

function parseStreamId(url: URL): string | null {
	const match = url.pathname.match(/^\/api\/events\/stream\/([a-zA-Z0-9_-]+)/)
	return match ? match[1] : null
}

export async function handleAuthenticatedEvents(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname

	if (path === '/api/events/info') {
		return handleInfo(env)
	}

	if (path.startsWith('/api/events/verify') && request.method === 'POST') {
		return handleVerify(request, env)
	}

	const streamId = parseStreamId(url)
	if (!streamId) {
		return errorResponse(
			'Invalid path. Expected /api/events/stream/{streamId}',
			'INVALID_PATH',
			400,
		)
	}

	if (path === `/api/events/stream/${streamId}/head`) {
		return handleStreamHead(streamId, env)
	}

	const proofMatch = path.match(/^\/api\/events\/stream\/[^/]+\/proof\/(\d+)$/)
	if (proofMatch) {
		return handleInclusionProof(streamId, BigInt(proofMatch[1]), env)
	}

	if (path === `/api/events/stream/${streamId}`) {
		return handleListEvents(streamId, url, env)
	}

	return errorResponse('Not found', 'NOT_FOUND', 404)
}

function handleInfo(env: Env): Response {
	return jsonResponse({
		name: 'Sui Authenticated Events Gateway',
		version: '1.0.0',
		network: env.SUI_NETWORK,
		description:
			'Cryptographically verifiable event streams from Sui smart contracts. Events are committed into a Merkle Mountain Range (MMR) structure tied to validator-signed checkpoints.',
		endpoints: {
			listEvents: 'GET /api/events/stream/{streamId}',
			streamHead: 'GET /api/events/stream/{streamId}/head',
			inclusionProof: 'GET /api/events/stream/{streamId}/proof/{checkpoint}',
			verify: 'POST /api/events/verify',
			info: 'GET /api/events/info',
		},
		securityModel: {
			trustRoot: 'Sui genesis validator committee',
			verification:
				'Events verified via MMR commitment in EventStreamHead, which is proven to exist at a checkpoint signed by the validator committee',
			guarantees: [
				'Completeness: receiving event N guarantees all events 0..N-1 were received in order',
				'Correctness: event content is committed to the MMR; any modification causes verification failure',
			],
		},
	})
}

async function handleListEvents(streamId: string, url: URL, env: Env): Promise<Response> {
	const startCheckpoint = url.searchParams.get('startCheckpoint')
	const pageSize = url.searchParams.get('pageSize')
	const pageToken = url.searchParams.get('pageToken')

	const client = createClient(env)

	const response: ListAuthenticatedEventsResponse = await client.listEvents({
		streamId,
		startCheckpoint: startCheckpoint ? BigInt(startCheckpoint) : undefined,
		pageSize: pageSize ? Number(pageSize) : undefined,
		pageToken: pageToken || undefined,
	})

	return jsonResponse(serializeEventsResponse(response))
}

async function handleStreamHead(streamId: string, env: Env): Promise<Response> {
	const cached = await getCached<EventStreamHead>(cacheKey('event-head', streamId, env.SUI_NETWORK))
	if (cached) return jsonResponse(serializeStreamHead(cached))

	const client = createClient(env)
	const head = await client.getStreamHead(streamId)

	if (!head) {
		return errorResponse(
			`No EventStreamHead found for stream ${streamId}. The package may not emit authenticated events.`,
			'STREAM_NOT_FOUND',
			404,
		)
	}

	await setCache(cacheKey('event-head', streamId, env.SUI_NETWORK), head, STREAM_HEAD_CACHE_TTL)

	return jsonResponse(serializeStreamHead(head))
}

async function handleInclusionProof(
	streamId: string,
	checkpoint: bigint,
	env: Env,
): Promise<Response> {
	const ck = cacheKey('event-proof', streamId, checkpoint.toString(), env.SUI_NETWORK)
	const cached = await getCached<ObjectInclusionProof>(ck)
	if (cached) return jsonResponse(serializeProof(cached))

	const client = createClient(env)
	const headObjectId = streamId
	const proof = await client.getObjectInclusionProof(headObjectId, checkpoint)

	if (!proof) {
		return errorResponse(
			`No inclusion proof found for stream ${streamId} at checkpoint ${checkpoint}`,
			'PROOF_NOT_FOUND',
			404,
		)
	}

	await setCache(ck, proof, PROOF_CACHE_TTL)

	return jsonResponse(serializeProof(proof))
}

async function handleVerify(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as {
		streamId?: string
		events?: Array<{
			checkpoint: string
			transactionIndex: number
			eventIndex: number
			type: string
			packageId: string
			parsedJson: Record<string, unknown>
			bcsPayload?: string
		}>
		checkpoint?: string
	}

	invariant(body.streamId, 'streamId is required')
	invariant(Array.isArray(body.events), 'events array is required')

	const client = createClient(env)

	const [head] = await Promise.all([client.getStreamHead(body.streamId)])

	if (!head) {
		return jsonResponse({
			verified: false,
			streamId: body.streamId,
			eventCount: '0',
			checkpoint: body.checkpoint || '0',
			error: `No EventStreamHead found for stream ${body.streamId}`,
		})
	}

	const events: AuthenticatedEvent[] = body.events.map((raw) => ({
		checkpoint: BigInt(raw.checkpoint),
		transactionIndex: raw.transactionIndex,
		eventIndex: raw.eventIndex,
		type: raw.type,
		packageId: raw.packageId,
		parsedJson: raw.parsedJson,
		bcsPayload: raw.bcsPayload ? base64ToBytes(raw.bcsPayload) : new Uint8Array(0),
	}))

	const result: EventVerificationResult = await client.verifyEvents(body.streamId, events, head)

	return jsonResponse({
		verified: result.verified,
		streamId: result.streamId,
		eventCount: result.eventCount.toString(),
		checkpoint: result.checkpoint.toString(),
		error: result.error,
		streamHead: serializeStreamHead(head),
	})
}

function serializeEventsResponse(
	response: ListAuthenticatedEventsResponse,
): Record<string, unknown> {
	return {
		events: response.events.map((ev) => ({
			checkpoint: ev.checkpoint.toString(),
			transactionIndex: ev.transactionIndex,
			eventIndex: ev.eventIndex,
			type: ev.type,
			packageId: ev.packageId,
			parsedJson: ev.parsedJson,
			bcsPayload: bytesToBase64(ev.bcsPayload),
		})),
		highestIndexedCheckpoint: response.highestIndexedCheckpoint.toString(),
		nextPageToken: response.nextPageToken,
	}
}

function serializeStreamHead(head: EventStreamHead): Record<string, unknown> {
	return {
		streamId: head.streamId,
		mmr: head.mmr.map((v) => v.toString()),
		checkpointSeq: head.checkpointSeq.toString(),
		numEvents: head.numEvents.toString(),
	}
}

function serializeProof(proof: ObjectInclusionProof): Record<string, unknown> {
	return {
		objectRef: {
			objectId: proof.objectRef.objectId,
			version: proof.objectRef.version.toString(),
			digest: proof.objectRef.digest,
		},
		merkleProof: bytesToBase64(proof.merkleProof),
		leafIndex: proof.leafIndex,
		treeRoot: bytesToBase64(proof.treeRoot),
		objectData: bytesToBase64(proof.objectData),
		checkpointSummary: bytesToBase64(proof.checkpointSummary),
	}
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

function bytesToBase64(bytes: Uint8Array): string {
	if (bytes.length === 0) return ''
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary)
}
