/**
 * Surflux gRPC-Web Client
 *
 * Proper gRPC-Web implementation with protobuf encoding.
 * Documentation: https://surflux.dev/docs/grpc/integration/typescript/
 */
import type { Env, SuiNSRecord } from '../types'

const SURFLUX_ENDPOINT = 'https://grpc.surflux.dev'

interface Timestamp {
	seconds?: bigint
	nanos?: number
}

interface NameRecord {
	id?: string
	name?: string
	registrationNftId?: string
	expirationTimestamp?: Timestamp
	targetAddress?: string
	data?: Record<string, string>
}

interface LookupNameResponse {
	record?: NameRecord
}

interface ReverseLookupNameResponse {
	record?: NameRecord
}

// Read varint from buffer, return [value, bytesRead]
function readVarint(data: Uint8Array, pos: number): [number, number] {
	let result = 0
	let shift = 0
	let bytesRead = 0

	while (pos + bytesRead < data.length) {
		const b = data[pos + bytesRead]
		bytesRead++
		result |= (b & 0x7f) << shift
		if ((b & 0x80) === 0) break
		shift += 7
	}

	return [result, bytesRead]
}

// Simple protobuf encoder for our specific messages
function encodeString(fieldNum: number, value: string): Uint8Array {
	const encoded = new TextEncoder().encode(value)
	const header = new Uint8Array(2)
	header[0] = (fieldNum << 3) | 2 // wire type 2 = length-delimited
	header[1] = encoded.length
	const result = new Uint8Array(header.length + encoded.length)
	result.set(header)
	result.set(encoded, header.length)
	return result
}

// Decode protobuf response (for NameRecord structure)
function decodeNameRecord(data: Uint8Array): NameRecord | null {
	if (data.length === 0) return null

	const record: NameRecord = {}
	let pos = 0

	while (pos < data.length) {
		const tag = data[pos]
		const fieldNum = tag >> 3
		const wireType = tag & 0x07
		pos++

		if (wireType === 2) {
			// Length-delimited (string, bytes, embedded message)
			const [length, lenBytes] = readVarint(data, pos)
			pos += lenBytes
			const value = data.slice(pos, pos + length)
			pos += length

			switch (fieldNum) {
				case 1:
					record.id = new TextDecoder().decode(value)
					break
				case 2:
					record.name = new TextDecoder().decode(value)
					break
				case 3:
					record.registrationNftId = new TextDecoder().decode(value)
					break
				case 4:
					// Embedded Timestamp message
					if (value.length > 0) {
						record.expirationTimestamp = { seconds: BigInt(0) }
						let tpos = 0
						while (tpos < value.length) {
							const ttag = value[tpos]
							const tfieldNum = ttag >> 3
							const twireType = ttag & 0x07
							tpos++
							if (twireType === 0 && tfieldNum === 1) {
								// Varint for seconds
								let seconds = BigInt(0)
								let shift = 0
								while (tpos < value.length) {
									const b = value[tpos]
									tpos++
									seconds |= BigInt(b & 0x7f) << BigInt(shift)
									if ((b & 0x80) === 0) break
									shift += 7
								}
								record.expirationTimestamp.seconds = seconds
							} else if (twireType === 0) {
								// Skip other varints
								while (tpos < value.length && (value[tpos] & 0x80) !== 0) tpos++
								tpos++
							} else {
								break
							}
						}
					}
					break
				case 5:
					record.targetAddress = new TextDecoder().decode(value)
					break
			}
		} else if (wireType === 0) {
			// Varint - skip
			while (pos < data.length && (data[pos] & 0x80) !== 0) pos++
			pos++
		} else {
			// Unknown wire type - try to skip
			break
		}
	}

	return record.id || record.name || record.targetAddress ? record : null
}

// Decode gRPC-Web response frame
function decodeGrpcWebFrame(data: Uint8Array): Uint8Array | null {
	if (data.length < 5) return null

	const flag = data[0]
	const length = (data[1] << 24) | (data[2] << 16) | (data[3] << 8) | data[4]

	if (flag === 0 && data.length >= 5 + length) {
		return data.slice(5, 5 + length)
	}

	return null
}

// Encode gRPC-Web request frame
function encodeGrpcWebFrame(data: Uint8Array): Uint8Array {
	const frame = new Uint8Array(5 + data.length)
	frame[0] = 0 // compression flag
	frame[1] = (data.length >> 24) & 0xff
	frame[2] = (data.length >> 16) & 0xff
	frame[3] = (data.length >> 8) & 0xff
	frame[4] = data.length & 0xff
	frame.set(data, 5)
	return frame
}

async function grpcWebCall<T>(
	service: string,
	method: string,
	requestData: Uint8Array,
	apiKey: string,
): Promise<T | null> {
	const url = `${SURFLUX_ENDPOINT}/${service}/${method}`
	const framedRequest = encodeGrpcWebFrame(requestData)

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/grpc-web+proto',
			'x-api-key': apiKey,
			Accept: 'application/grpc-web+proto',
		},
		body: framedRequest,
	})

	if (!response.ok) {
		const grpcStatus = response.headers.get('grpc-status')
		if (grpcStatus === '5') {
			// NOT_FOUND - name doesn't exist
			return null
		}
		return null
	}

	const buffer = await response.arrayBuffer()
	const data = new Uint8Array(buffer)

	// Decode gRPC-Web frame
	const payload = decodeGrpcWebFrame(data)
	if (!payload || payload.length < 2) return null

	// Parse LookupNameResponse - field 1 is the NameRecord
	// First byte is the tag (0x0a = field 1, wire type 2)
	if (payload[0] === 0x0a) {
		const [recordLength, lenBytes] = readVarint(payload, 1)
		const recordStart = 1 + lenBytes
		const recordData = payload.slice(recordStart, recordStart + recordLength)
		const record = decodeNameRecord(recordData)
		return { record } as T
	}

	return null
}

export async function lookupName(name: string, env: Env): Promise<SuiNSRecord | null> {
	if (!env.SURFLUX_API_KEY) return null

	const normalizedName = name.endsWith('.sui') ? name : `${name}.sui`
	const requestData = encodeString(1, normalizedName)

	try {
		const response = await grpcWebCall<LookupNameResponse>(
			'sui.rpc.v2.NameService',
			'LookupName',
			requestData,
			env.SURFLUX_API_KEY,
		)

		if (!response?.record) return null

		const record = response.record
		const expirationMs = record.expirationTimestamp?.seconds
			? String(Number(record.expirationTimestamp.seconds) * 1000)
			: undefined

		return {
			address: record.targetAddress || '',
			nftId: record.registrationNftId,
			expirationTimestampMs: expirationMs,
			records: record.data || {},
		}
	} catch {
		return null
	}
}

export async function reverseLookupName(address: string, env: Env): Promise<string | null> {
	if (!env.SURFLUX_API_KEY) return null

	const requestData = encodeString(1, address)

	try {
		const response = await grpcWebCall<ReverseLookupNameResponse>(
			'sui.rpc.v2.NameService',
			'ReverseLookupName',
			requestData,
			env.SURFLUX_API_KEY,
		)

		return response?.record?.name || null
	} catch {
		return null
	}
}
