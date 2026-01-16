import { bcs } from '@mysten/sui/bcs'
import type { Env } from '../types'

// Walrus Sites package IDs by network
const WALRUS_SITES_PACKAGE: Record<string, string> = {
	mainnet: '0x26eb7ee8688da02c5f671679524e379f0b837a12f1d1d799f255b7eea260ad27',
	testnet: '0xf99aee9f21493e1590e7e5a9aea6f343a1f381031a04a732724871fc294be799',
}

// Walrus aggregators by network
const WALRUS_AGGREGATORS: Record<string, string[]> = {
	mainnet: [
		'https://aggregator.wal.app/v1/blobs/',
		'https://walrus-mainnet-aggregator.nodes.guru/v1/blobs/',
	],
	testnet: [
		'https://aggregator.walrus-testnet.walrus.space/v1/blobs/',
		'https://wal-aggregator-testnet.staketab.org/v1/blobs/',
	],
}

interface WalrusSiteResource {
	path: string
	blobId: string
	blobIdDecimal: string
	contentType: string
	contentEncoding: string
	quiltPatchId?: string
	quiltPatchInternalId?: string
	objectId: string
	objectVersion: string
}

interface WalrusSiteData {
	resources: WalrusSiteResource[]
	routes: Record<string, string>
}

interface DynamicFieldInfo {
	objectId: string
	objectType: string
	name: {
		type: string
		value: { path: string } | string
	}
	version: number
}

interface DynamicFieldValue {
	fields: {
		value: {
			fields: {
				path: string
				blob_id: string
				blob_hash: string
				headers: {
					fields: {
						contents: Array<{
							fields: { key: string; value: string }
						}>
					}
				}
				range: unknown
			}
		}
	}
}

/**
 * Convert u256 blob ID to base64url string
 */
function blobIdFromInt(blobIdDecimal: string): string {
	const bytes = bcs.u256().serialize(BigInt(blobIdDecimal)).toBytes()
	return btoa(String.fromCharCode(...bytes))
		.replace(/=+$/, '')
		.replaceAll('+', '-')
		.replaceAll('/', '_')
}

/**
 * Encode a quilt patch ID for fetching from aggregators
 */
function encodeQuiltPatchId(blobIdDecimal: string, patchIdHex: string): string {
	const patchBytes = hexToBytes(patchIdHex.replace('0x', ''))
	const version = patchBytes[0]
	const startIndex = patchBytes[1] | (patchBytes[2] << 8)
	const endIndex = patchBytes[3] | (patchBytes[4] << 8)

	const quiltIdBytes = bcs.u256().serialize(BigInt(blobIdDecimal)).toBytes()
	const patchIdBytes = new Uint8Array(5)
	patchIdBytes[0] = version
	patchIdBytes[1] = startIndex & 0xff
	patchIdBytes[2] = (startIndex >> 8) & 0xff
	patchIdBytes[3] = endIndex & 0xff
	patchIdBytes[4] = (endIndex >> 8) & 0xff

	const fullBytes = new Uint8Array(quiltIdBytes.length + patchIdBytes.length)
	fullBytes.set(quiltIdBytes, 0)
	fullBytes.set(patchIdBytes, quiltIdBytes.length)

	return btoa(String.fromCharCode(...fullBytes))
		.replace(/=+$/, '')
		.replaceAll('+', '-')
		.replaceAll('/', '_')
}

function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2)
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
	}
	return bytes
}

/**
 * Match a path against a route pattern with wildcard support
 * Pattern: /path/* matches /path/anything
 */
function matchRoute(pattern: string, path: string): boolean {
	if (!pattern.endsWith('/*')) {
		return pattern === path
	}
	const prefix = pattern.slice(0, -1) // Remove the *
	return path.startsWith(prefix) || path === prefix.slice(0, -1)
}

/**
 * Find the best matching route for a path
 */
function findMatchingRoute(routes: Record<string, string>, path: string): string | null {
	// Sort routes by specificity (longer patterns first)
	const sortedPatterns = Object.keys(routes).sort((a, b) => b.length - a.length)

	for (const pattern of sortedPatterns) {
		if (matchRoute(pattern, path)) {
			return routes[pattern]
		}
	}
	return null
}

/**
 * Fetch all dynamic fields for a Walrus Site object
 */
async function fetchSiteData(siteObjectId: string, env: Env): Promise<WalrusSiteData> {
	const resources: WalrusSiteResource[] = []
	const routes: Record<string, string> = {}

	// Fetch dynamic fields from the site object
	const response = await fetch(env.SUI_RPC_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'suix_getDynamicFields',
			params: [siteObjectId, null, 100],
		}),
	})

	const result = (await response.json()) as {
		result?: { data: DynamicFieldInfo[] }
	}

	if (!result.result?.data) {
		return { resources, routes }
	}

	// Separate resources and routes
	const resourceFields: DynamicFieldInfo[] = []
	const routeFields: DynamicFieldInfo[] = []

	for (const field of result.result.data) {
		if (field.objectType.includes('::site::Resource')) {
			resourceFields.push(field)
		} else if (field.name.type.includes('::site::Route')) {
			routeFields.push(field)
		}
	}

	// Fetch resources in parallel for better performance
	const resourcePromises = resourceFields.map(async (field) => {
		const resourceResponse = await fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_getObject',
				params: [field.objectId, { showContent: true }],
			}),
		})

		const resourceResult = (await resourceResponse.json()) as {
			result?: { data?: { content?: DynamicFieldValue; version?: string } }
		}

		const resourceValue = resourceResult.result?.data?.content?.fields?.value?.fields
		if (!resourceValue) return null

		let contentType = 'application/octet-stream'
		let contentEncoding = 'identity'
		let quiltPatchInternalId: string | undefined

		for (const entry of resourceValue.headers?.fields?.contents || []) {
			const key = entry.fields.key
			const value = entry.fields.value
			if (key === 'content-type') contentType = value
			if (key === 'content-encoding') contentEncoding = value
			if (key === 'x-wal-quilt-patch-internal-id') quiltPatchInternalId = value
		}

		const blobId = blobIdFromInt(resourceValue.blob_id)
		const quiltPatchId = quiltPatchInternalId
			? encodeQuiltPatchId(resourceValue.blob_id, quiltPatchInternalId)
			: undefined

		return {
			path: resourceValue.path,
			blobId,
			blobIdDecimal: resourceValue.blob_id,
			contentType,
			contentEncoding,
			quiltPatchId,
			quiltPatchInternalId,
			objectId: field.objectId,
			objectVersion: String(field.version),
		} as WalrusSiteResource
	})

	const resolvedResources = await Promise.all(resourcePromises)
	resources.push(...resolvedResources.filter((r): r is WalrusSiteResource => r !== null))

	// Fetch route fields to build routes map
	for (const field of routeFields) {
		const routeResponse = await fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_getObject',
				params: [field.objectId, { showContent: true }],
			}),
		})

		const routeResult = (await routeResponse.json()) as {
			result?: {
				data?: {
					content?: {
						fields: {
							name: { fields: { route: string } }
							value: string
						}
					}
				}
			}
		}

		const routeData = routeResult.result?.data?.content?.fields
		if (routeData) {
			const pattern = routeData.name?.fields?.route
			const target = routeData.value
			if (pattern && target) {
				routes[pattern] = target
			}
		}
	}

	return { resources, routes }
}

/**
 * Fetch content for a resource from Walrus aggregators
 */
async function fetchResourceContent(resource: WalrusSiteResource, env: Env): Promise<Response> {
	const aggregators = WALRUS_AGGREGATORS[env.WALRUS_NETWORK] || WALRUS_AGGREGATORS.testnet
	const now = Date.now()

	for (const baseUrl of aggregators) {
		try {
			const url = resource.quiltPatchId
				? `${baseUrl}by-quilt-patch-id/${resource.quiltPatchId}`
				: `${baseUrl}${resource.blobId}`

			const response = await fetch(url, {
				headers: { 'User-Agent': 'sui.ski-gateway/1.0' },
			})

			if (response.ok) {
				const body = await response.arrayBuffer()

				// Generate ETag from blob ID
				const etag = `"${resource.blobId.slice(0, 16)}"`

				return new Response(body, {
					status: 200,
					headers: {
						'Content-Type': resource.contentType,
						'Content-Encoding': resource.contentEncoding,
						'Cache-Control': 'public, max-age=3600',
						'Access-Control-Allow-Origin': '*',
						ETag: etag,
						'Last-Modified': new Date(now).toUTCString(),
						'Accept-Ranges': 'bytes',
						// Resource metadata headers (like wal.app)
						'X-Walrus-Blob-Id': resource.blobId,
						'X-Walrus-Network': env.WALRUS_NETWORK,
						'X-Resource-Sui-Object-Id': resource.objectId,
						'X-Resource-Sui-Object-Version': resource.objectVersion,
						...(resource.quiltPatchInternalId && {
							'X-Wal-Quilt-Patch-Internal-Id': resource.quiltPatchInternalId,
						}),
						'X-Unix-Time-Cached': String(now),
					},
				})
			}
		} catch {}
	}

	return new Response(`Failed to fetch resource: ${resource.path}`, { status: 502 })
}

/**
 * Generate a styled 404 page
 */
function generate404Page(
	siteName: string,
	requestedPath: string,
	_availablePaths: string[],
): Response {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found | ${siteName}</title>
    <style>
        :root {
            --bg-light: #f9f9f9;
            --text-light: #333;
            --subtext-light: #555;
            --code-bg-light: #e8e8e8;
            --bg-dark: #0f172a;
            --text-dark: #e2e8f0;
            --subtext-dark: #94a3b8;
            --code-bg-dark: #1e293b;
            --accent: #818cf8;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: var(--bg-dark);
                --text: var(--text-dark);
                --subtext: var(--subtext-dark);
                --code-bg: var(--code-bg-dark);
            }
        }
        @media (prefers-color-scheme: light) {
            :root {
                --bg: var(--bg-light);
                --text: var(--text-light);
                --subtext: var(--subtext-light);
                --code-bg: var(--code-bg-light);
            }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            padding: 2rem;
            max-width: 500px;
        }
        .code {
            font-size: 6rem;
            font-weight: bold;
            color: var(--accent);
            line-height: 1;
        }
        h1 {
            margin: 1rem 0;
            font-size: 1.5rem;
        }
        .path {
            font-family: monospace;
            background: var(--code-bg);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            word-break: break-all;
        }
        .subtext {
            color: var(--subtext);
            margin-top: 1rem;
            font-size: 0.9rem;
        }
        .links {
            margin-top: 2rem;
        }
        a {
            color: var(--accent);
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .badge {
            display: inline-block;
            background: rgba(129, 140, 248, 0.15);
            color: var(--accent);
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="code">404</div>
        <h1>Page Not Found</h1>
        <div class="path">${requestedPath}</div>
        <p class="subtext">
            This resource doesn't exist on <strong>${siteName}</strong>
        </p>
        <div class="links">
            <a href="/">← Back to Home</a>
        </div>
        <div class="badge">Served via sui.ski</div>
    </div>
</body>
</html>`

	return new Response(html, {
		status: 404,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'no-cache',
			'Access-Control-Allow-Origin': '*',
		},
	})
}

/**
 * Resolve a Walrus Site and serve a specific resource path
 */
export async function resolveWalrusSite(
	siteObjectId: string,
	requestPath: string,
	env: Env,
	siteName?: string,
): Promise<Response> {
	// Normalize path
	let path = requestPath || '/'
	if (!path.startsWith('/')) path = `/${path}`

	try {
		// Fetch all resources and routes from the site
		const { resources, routes } = await fetchSiteData(siteObjectId, env)

		if (resources.length === 0) {
			return generate404Page(siteName || 'Walrus Site', path, [])
		}

		// First, try exact match
		let resource = resources.find((r) => r.path === path)

		// Try with trailing slash variations
		if (!resource && path === '/') {
			resource = resources.find((r) => r.path === '/index.html')
		}

		// Try .html extension
		if (!resource && !path.endsWith('.html') && !path.includes('.')) {
			resource = resources.find((r) => r.path === `${path}.html`)
		}

		// Try directory index
		if (!resource && !path.endsWith('/')) {
			resource = resources.find((r) => r.path === `${path}/index.html`)
		}

		// Check SPA routes if still not found
		if (!resource && Object.keys(routes).length > 0) {
			const routeTarget = findMatchingRoute(routes, path)
			if (routeTarget) {
				resource = resources.find((r) => r.path === routeTarget)
			}
		}

		// Fallback: check for catch-all route /*
		if (!resource) {
			const catchAllTarget = routes['/*']
			if (catchAllTarget) {
				resource = resources.find((r) => r.path === catchAllTarget)
			}
		}

		if (!resource) {
			const availablePaths = resources.map((r) => r.path)
			return generate404Page(siteName || 'Walrus Site', path, availablePaths)
		}

		return fetchResourceContent(resource, env)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return new Response(`Failed to resolve Walrus Site: ${message}`, { status: 500 })
	}
}

/**
 * Check if a content value looks like a Walrus Site object ID
 */
export function isWalrusSiteId(value: string): boolean {
	return /^0x[a-fA-F0-9]{64}$/.test(value)
}

/**
 * Get the Walrus Sites package ID for a network
 */
export function getWalrusSitesPackage(network: string): string {
	return WALRUS_SITES_PACKAGE[network] || WALRUS_SITES_PACKAGE.testnet
}
