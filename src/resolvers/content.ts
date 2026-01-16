import type { Env, ResolverResult, SuiNSRecord } from '../types'
import { proxyResponse } from '../utils/response'

// Public IPFS gateways for fallback
const IPFS_GATEWAYS = [
	'https://cloudflare-ipfs.com/ipfs/',
	'https://ipfs.io/ipfs/',
	'https://dweb.link/ipfs/',
]

// Walrus aggregator endpoints by network
export const WALRUS_AGGREGATORS: Record<string, string[]> = {
	mainnet: [
		'https://aggregator.wal.app/v1/blobs/',
		'https://walrus-mainnet-aggregator.nodes.guru/v1/blobs/',
	],
	testnet: [
		'https://aggregator.walrus-testnet.walrus.space/v1/blobs/',
		'https://wal-aggregator-testnet.staketab.org/v1/blobs/',
	],
}

/**
 * Resolve and fetch content from decentralized storage
 */
export async function resolveContent(
	content: NonNullable<SuiNSRecord['content']>,
	env: Env,
): Promise<Response> {
	switch (content.type) {
		case 'ipfs':
			return fetchIPFSContent(content.value)
		case 'walrus':
			return fetchWalrusContent(content.value, env)
		case 'url':
			return fetchURLContent(content.value)
		default:
			return new Response('Unsupported content type', { status: 400 })
	}
}

/**
 * Fetch content from IPFS
 */
async function fetchIPFSContent(cid: string): Promise<Response> {
	// Try each gateway in order
	for (const gateway of IPFS_GATEWAYS) {
		try {
			const response = await fetch(`${gateway}${cid}`, {
				headers: {
					'User-Agent': 'sui.ski-gateway/1.0',
				},
			})

			if (response.ok) {
				return proxyResponse(response)
			}
		} catch {}
	}

	return new Response(`Failed to fetch IPFS content: ${cid}`, { status: 502 })
}

/**
 * Fetch content from Walrus decentralized storage via HTTP aggregators
 */
async function fetchWalrusContent(blobId: string, env: Env): Promise<Response> {
	const aggregators = WALRUS_AGGREGATORS[env.WALRUS_NETWORK] || WALRUS_AGGREGATORS.testnet

	// Try each aggregator in order
	for (const aggregator of aggregators) {
		try {
			const response = await fetch(`${aggregator}${blobId}`, {
				headers: {
					'User-Agent': 'sui.ski-gateway/1.0',
				},
			})

			if (response.ok) {
				const blob = await response.arrayBuffer()
				const contentType = detectContentType(blob)

				return new Response(blob, {
					status: 200,
					headers: {
						'Content-Type': contentType,
						'Cache-Control': 'public, max-age=3600',
						'Access-Control-Allow-Origin': '*',
						'X-Walrus-Blob-Id': blobId,
						'X-Walrus-Network': env.WALRUS_NETWORK,
					},
				})
			}
		} catch {}
	}

	return new Response(`Failed to fetch Walrus content: ${blobId}`, { status: 502 })
}

/**
 * Proxy content from a URL
 */
async function fetchURLContent(url: string): Promise<Response> {
	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'sui.ski-gateway/1.0',
			},
		})

		return proxyResponse(response)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return new Response(`Failed to fetch URL content: ${message}`, { status: 502 })
	}
}

/**
 * Detect content type from blob data
 */
export function detectContentType(data: Uint8Array | ArrayBuffer): string {
	const bytes = new Uint8Array(data)

	// Check magic bytes for common formats
	if (bytes[0] === 0x3c) {
		// < - likely HTML
		return 'text/html; charset=utf-8'
	}
	if (bytes[0] === 0x7b) {
		// { - likely JSON
		return 'application/json'
	}
	if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
		// PNG
		return 'image/png'
	}
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		// JPEG
		return 'image/jpeg'
	}
	if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
		// GIF
		return 'image/gif'
	}
	if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
		// PDF
		return 'application/pdf'
	}

	// MP3 - MPEG audio Layer III sync bytes
	if (
		bytes[0] === 0xff &&
		(bytes[1] === 0xfb || bytes[1] === 0xfa || bytes[1] === 0xf3 || bytes[1] === 0xf2)
	) {
		return 'audio/mpeg'
	}

	// MP3 with ID3 tag
	if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
		// ID3 tag header
		return 'audio/mpeg'
	}

	// MP4/M4A/MOV - check for 'ftyp' box at offset 4
	if (
		bytes.length > 8 &&
		bytes[4] === 0x66 &&
		bytes[5] === 0x74 &&
		bytes[6] === 0x79 &&
		bytes[7] === 0x70
	) {
		// Check the brand to distinguish video vs audio
		const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
		if (brand === 'M4A ' || brand === 'M4B ') {
			return 'audio/mp4'
		}
		return 'video/mp4'
	}

	// WebM - EBML header
	if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
		return 'video/webm'
	}

	// OGG - 'OggS' magic
	if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
		return 'audio/ogg'
	}

	// WAV - 'RIFF....WAVE'
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x41 &&
		bytes[10] === 0x56 &&
		bytes[11] === 0x45
	) {
		return 'audio/wav'
	}

	// FLAC
	if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
		return 'audio/flac'
	}

	return 'application/octet-stream'
}

/**
 * Resolve direct content from subdomain pattern
 * - ipfs-{cid}.sui.ski -> IPFS content
 * - walrus-{blobId}.sui.ski -> Walrus content
 */
export async function resolveDirectContent(subdomain: string, env: Env): Promise<ResolverResult> {
	if (subdomain.startsWith('ipfs-')) {
		const cid = subdomain.slice(5)
		const response = await fetchIPFSContent(cid)
		return { found: response.ok, data: response }
	}

	if (subdomain.startsWith('walrus-')) {
		const blobId = subdomain.slice(7)
		const response = await fetchWalrusContent(blobId, env)
		return { found: response.ok, data: response }
	}

	return { found: false, error: 'Invalid content subdomain pattern' }
}
