import invariant from 'tiny-invariant'

const LEAF_PREFIX = new Uint8Array([0x00])
const NODE_PREFIX = new Uint8Array([0x01])
const HASH_LENGTH = 32

export interface MmrPeak {
	height: number
	position: number
	hash: Uint8Array
}

export interface MmrState {
	peaks: MmrPeak[]
	leafCount: number
	size: number
}

export interface MmrProof {
	leafHash: Uint8Array
	siblings: Uint8Array[]
	leafIndex: number
}

export function createMmr(): MmrState {
	return { peaks: [], leafCount: 0, size: 0 }
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
	const buffer = await crypto.subtle.digest('SHA-256', data)
	return new Uint8Array(buffer)
}

async function hashLeaf(data: Uint8Array): Promise<Uint8Array> {
	const prefixed = new Uint8Array(LEAF_PREFIX.length + data.length)
	prefixed.set(LEAF_PREFIX, 0)
	prefixed.set(data, LEAF_PREFIX.length)
	return sha256(prefixed)
}

async function hashNode(left: Uint8Array, right: Uint8Array): Promise<Uint8Array> {
	const prefixed = new Uint8Array(NODE_PREFIX.length + left.length + right.length)
	prefixed.set(NODE_PREFIX, 0)
	prefixed.set(left, NODE_PREFIX.length)
	prefixed.set(right, NODE_PREFIX.length + left.length)
	return sha256(prefixed)
}

function bytesToBigint(bytes: Uint8Array): bigint {
	let value = 0n
	for (let i = 0; i < bytes.length; i++) {
		value = (value << 8n) | BigInt(bytes[i])
	}
	return value
}

export async function appendLeaf(state: MmrState, leafHash: Uint8Array): Promise<MmrState> {
	invariant(
		leafHash.length === HASH_LENGTH,
		`Expected ${HASH_LENGTH}-byte leaf hash, got ${leafHash.length}`,
	)

	const peaks = [...state.peaks]
	const position = state.size

	peaks.push({ height: 0, position, hash: new Uint8Array(leafHash) })

	let nextPosition = position + 1

	while (peaks.length >= 2 && peaks[peaks.length - 1].height === peaks[peaks.length - 2].height) {
		const right = peaks.pop()
		const left = peaks.pop()
		invariant(right && left, 'MMR merge requires two peaks')
		const merged = await hashNode(left.hash, right.hash)
		peaks.push({ height: left.height + 1, position: nextPosition, hash: merged })
		nextPosition++
	}

	return {
		peaks,
		leafCount: state.leafCount + 1,
		size: nextPosition,
	}
}

export async function computeRoot(state: MmrState): Promise<Uint8Array> {
	invariant(state.peaks.length > 0, 'Cannot compute root of empty MMR')

	if (state.peaks.length === 1) {
		return new Uint8Array(state.peaks[0].hash)
	}

	let acc = state.peaks[state.peaks.length - 1].hash
	for (let i = state.peaks.length - 2; i >= 0; i--) {
		acc = await sha256(concat(acc, state.peaks[i].hash))
	}
	return acc
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
	const result = new Uint8Array(a.length + b.length)
	result.set(a, 0)
	result.set(b, a.length)
	return result
}

export function peakHashes(state: MmrState): Uint8Array[] {
	const hashes: Uint8Array[] = []
	for (let i = 0; i < state.peaks.length; i++) {
		hashes.push(new Uint8Array(state.peaks[i].hash))
	}
	return hashes
}

export function verifyAgainstCommitment(state: MmrState, commitment: bigint[]): boolean {
	if (state.peaks.length !== commitment.length) return false

	for (let i = 0; i < state.peaks.length; i++) {
		if (bytesToBigint(state.peaks[i].hash) !== commitment[i]) return false
	}
	return true
}

export interface EventData {
	type: string
	packageId: string
	bcsPayload: Uint8Array
	checkpoint: bigint
	transactionIndex: number
	eventIndex: number
}

export async function hashEvent(event: EventData): Promise<Uint8Array> {
	invariant(event.type.length > 0, 'Event type must not be empty')
	invariant(event.packageId.length > 0, 'Event packageId must not be empty')
	invariant(event.bcsPayload.length > 0, 'Event bcsPayload must not be empty')
	invariant(
		event.transactionIndex >= 0,
		`Event transactionIndex must be non-negative, got ${event.transactionIndex}`,
	)
	invariant(event.eventIndex >= 0, `Event eventIndex must be non-negative, got ${event.eventIndex}`)

	const encoder = new TextEncoder()
	const typeBytes = encoder.encode(event.type)
	const packageBytes = encoder.encode(event.packageId)

	const checkpointBytes = bigintToBytes(event.checkpoint, 8)
	const txIndexBytes = uint32ToBytes(event.transactionIndex)
	const evtIndexBytes = uint32ToBytes(event.eventIndex)

	const totalLength =
		4 +
		typeBytes.length +
		4 +
		packageBytes.length +
		4 +
		event.bcsPayload.length +
		checkpointBytes.length +
		txIndexBytes.length +
		evtIndexBytes.length

	const buffer = new Uint8Array(totalLength)
	let offset = 0

	writeUint32(buffer, offset, typeBytes.length)
	offset += 4
	buffer.set(typeBytes, offset)
	offset += typeBytes.length

	writeUint32(buffer, offset, packageBytes.length)
	offset += 4
	buffer.set(packageBytes, offset)
	offset += packageBytes.length

	writeUint32(buffer, offset, event.bcsPayload.length)
	offset += 4
	buffer.set(event.bcsPayload, offset)
	offset += event.bcsPayload.length

	buffer.set(checkpointBytes, offset)
	offset += checkpointBytes.length

	buffer.set(txIndexBytes, offset)
	offset += txIndexBytes.length

	buffer.set(evtIndexBytes, offset)

	return hashLeaf(buffer)
}

function bigintToBytes(value: bigint, byteLength: number): Uint8Array {
	invariant(value >= 0n, `Expected non-negative bigint, got ${value}`)
	const bytes = new Uint8Array(byteLength)
	let remaining = value
	for (let i = byteLength - 1; i >= 0; i--) {
		bytes[i] = Number(remaining & 0xffn)
		remaining >>= 8n
	}
	return bytes
}

function uint32ToBytes(value: number): Uint8Array {
	const bytes = new Uint8Array(4)
	bytes[0] = (value >>> 24) & 0xff
	bytes[1] = (value >>> 16) & 0xff
	bytes[2] = (value >>> 8) & 0xff
	bytes[3] = value & 0xff
	return bytes
}

function writeUint32(buffer: Uint8Array, offset: number, value: number): void {
	buffer[offset] = (value >>> 24) & 0xff
	buffer[offset + 1] = (value >>> 16) & 0xff
	buffer[offset + 2] = (value >>> 8) & 0xff
	buffer[offset + 3] = value & 0xff
}
