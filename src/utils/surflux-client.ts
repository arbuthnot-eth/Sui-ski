/**
 * Surflux gRPC-Web Client for SuiNS name resolution
 *
 * Uses gRPC-Web protocol which is supported by Cloudflare Workers.
 * Requires SURFLUX_API_KEY environment variable.
 *
 * Documentation: https://surflux.dev/docs/grpc/integration/typescript/
 */
import type { Env, SuiNSRecord } from '../types'

const SURFLUX_GRPC_ENDPOINT = 'https://grpc.surflux.dev'

interface NameRecord {
	id?: string
	name?: string
	registrationNftId?: string
	expirationTimestamp?: { seconds: string; nanos?: number }
	targetAddress?: string
	data?: Record<string, string>
}

interface LookupNameResponse {
	record?: NameRecord
}

interface ReverseLookupNameResponse {
	record?: NameRecord
}

function decodeGrpcWebResponse(data: ArrayBuffer): unknown {
	const bytes = new Uint8Array(data)
	if (bytes.length < 5) return null

	const flag = bytes[0]
	const length = (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4]

	if (flag === 0 && bytes.length >= 5 + length) {
		const payload = bytes.slice(5, 5 + length)
		const text = new TextDecoder().decode(payload)
		return JSON.parse(text)
	}

	return null
}

async function grpcWebRequest<T>(
	service: string,
	method: string,
	payload: unknown,
	apiKey: string,
): Promise<T | null> {
	const url = `${SURFLUX_GRPC_ENDPOINT}/${service}/${method}`

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/grpc-web+json',
			'x-api-key': apiKey,
			Accept: 'application/grpc-web+json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		console.error(`Surflux gRPC error: ${response.status} ${response.statusText}`)
		return null
	}

	const contentType = response.headers.get('content-type') || ''

	if (contentType.includes('application/grpc-web+json') || contentType.includes('application/json')) {
		return (await response.json()) as T
	}

	if (contentType.includes('application/grpc-web')) {
		const buffer = await response.arrayBuffer()
		return decodeGrpcWebResponse(buffer) as T
	}

	const text = await response.text()
	try {
		return JSON.parse(text) as T
	} catch {
		console.error('Surflux unexpected response:', text.slice(0, 200))
		return null
	}
}

export async function lookupName(name: string, env: Env): Promise<SuiNSRecord | null> {
	if (!env.SURFLUX_API_KEY) return null

	const normalizedName = name.endsWith('.sui') ? name : `${name}.sui`

	const response = await grpcWebRequest<LookupNameResponse>(
		'sui.rpc.v2.NameService',
		'LookupName',
		{ name: normalizedName },
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
}

export async function reverseLookupName(address: string, env: Env): Promise<string | null> {
	if (!env.SURFLUX_API_KEY) return null

	const response = await grpcWebRequest<ReverseLookupNameResponse>(
		'sui.rpc.v2.NameService',
		'ReverseLookupName',
		{ address },
		env.SURFLUX_API_KEY,
	)

	return response?.record?.name || null
}
