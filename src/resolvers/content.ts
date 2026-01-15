import { WalrusClient } from '@mysten/walrus'
import { SuiClient } from '@mysten/sui/client'
import type { Env, ResolverResult, SuiNSRecord } from '../types'
import { proxyResponse } from '../utils/response'

// Public IPFS gateways for fallback
const IPFS_GATEWAYS = [
	'https://cloudflare-ipfs.com/ipfs/',
	'https://ipfs.io/ipfs/',
	'https://dweb.link/ipfs/',
]

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
		} catch {
			// Try next gateway
			continue
		}
	}

	return new Response(`Failed to fetch IPFS content: ${cid}`, { status: 502 })
}

/**
 * Fetch content from Walrus decentralized storage
 */
async function fetchWalrusContent(blobId: string, env: Env): Promise<Response> {
	try {
		const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
		const walrusClient = new WalrusClient({
			network: env.WALRUS_NETWORK,
			suiClient,
		})

		// Fetch the blob from Walrus
		const blob = await walrusClient.readBlob({ blobId })

		// Determine content type from blob metadata or default to octet-stream
		const contentType = detectContentType(blob)

		return new Response(blob, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=3600',
				'X-Walrus-Blob-Id': blobId,
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return new Response(`Failed to fetch Walrus content: ${message}`, { status: 502 })
	}
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
function detectContentType(data: Uint8Array | ArrayBuffer): string {
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

	return 'application/octet-stream'
}

/**
 * Resolve direct content from subdomain pattern
 * - ipfs-{cid}.sui.ski -> IPFS content
 * - walrus-{blobId}.sui.ski -> Walrus content
 */
export async function resolveDirectContent(
	subdomain: string,
	env: Env,
): Promise<ResolverResult> {
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
