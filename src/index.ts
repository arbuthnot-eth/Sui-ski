import type { Env, SuiNSRecord, MVRPackage } from './types'
import { parseSubdomain } from './utils/subdomain'
import { errorResponse, htmlResponse, notFoundPage, jsonResponse } from './utils/response'
import { resolveSuiNS } from './resolvers/suins'
import { resolveMVRPackage, getMVRDocumentationUrl, getPackageExplorerUrl } from './resolvers/mvr'
import { resolveContent, resolveDirectContent } from './resolvers/content'
import { handleRPCRequest } from './resolvers/rpc'
import { handleLandingPage } from './handlers/landing'

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Max-Age': '86400',
				},
			})
		}

		const url = new URL(request.url)
		const parsed = parseSubdomain(url.hostname)

		try {
			switch (parsed.type) {
				case 'root':
					return handleLandingPage(request, env)

				case 'rpc':
					return handleRPCRequest(request, env)

				case 'suins':
					return handleSuiNSRequest(parsed.subdomain, url, env)

				case 'mvr':
					return handleMVRRequest(
						parsed.subdomain,
						parsed.packageName!,
						parsed.version,
						url,
						env,
					)

				case 'content':
					return handleContentRequest(parsed.subdomain, env)

				default:
					return errorResponse('Unknown route type', 'UNKNOWN_ROUTE', 400)
			}
		} catch (error) {
			console.error('Gateway error:', error)
			const message = error instanceof Error ? error.message : 'Unknown error'
			return errorResponse(`Gateway error: ${message}`, 'GATEWAY_ERROR', 500)
		}
	},
}

/**
 * Handle SuiNS name resolution requests
 */
async function handleSuiNSRequest(
	name: string,
	url: URL,
	env: Env,
): Promise<Response> {
	const result = await resolveSuiNS(name, env)

	if (!result.found) {
		return notFoundPage(name)
	}

	const record = result.data as SuiNSRecord

	// If requesting JSON data explicitly
	if (url.pathname === '/json' || url.searchParams.has('json')) {
		return jsonResponse(record)
	}

	// If the name has content linked, resolve and serve it
	if (record.content) {
		return resolveContent(record.content, env)
	}

	// Otherwise, show the name's profile page
	return htmlResponse(suinsProfilePage(name, record, env.SUI_NETWORK))
}

/**
 * Handle MVR package requests
 */
async function handleMVRRequest(
	suinsName: string,
	packageName: string,
	version: number | undefined,
	url: URL,
	env: Env,
): Promise<Response> {
	const result = await resolveMVRPackage(suinsName, packageName, version, env)

	if (!result.found) {
		return notFoundPage(`@${suinsName}/${packageName}`)
	}

	const pkg = result.data as MVRPackage

	// If requesting JSON data explicitly
	if (url.pathname === '/json' || url.searchParams.has('json')) {
		return jsonResponse(pkg)
	}

	// Show package info page
	return htmlResponse(mvrPackagePage(pkg, env.SUI_NETWORK))
}

/**
 * Handle direct content requests (ipfs-*, walrus-*)
 */
async function handleContentRequest(subdomain: string, env: Env): Promise<Response> {
	const result = await resolveDirectContent(subdomain, env)

	if (!result.found) {
		return errorResponse(result.error || 'Content not found', 'NOT_FOUND', 404)
	}

	return result.data as Response
}

/**
 * Generate SuiNS profile page HTML
 */
function suinsProfilePage(name: string, record: SuiNSRecord, network: string): string {
	const explorerUrl = network === 'mainnet'
		? `https://suiscan.xyz/mainnet/account/${record.address}`
		: `https://suiscan.xyz/${network}/account/${record.address}`

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${name}.sui | sui.ski</title>
	<style>
		body { font-family: system-ui, sans-serif; max-width: 600px; margin: 60px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }
		h1 { color: #a5b4fc; }
		.address { font-family: monospace; background: #1e293b; padding: 12px; border-radius: 8px; word-break: break-all; margin: 16px 0; }
		.avatar { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; }
		a { color: #818cf8; }
		.badge { display: inline-block; padding: 4px 8px; background: #334155; border-radius: 4px; font-size: 0.8rem; margin-right: 8px; }
	</style>
</head>
<body>
	${record.avatar ? `<img src="${record.avatar}" alt="${name}" class="avatar">` : ''}
	<h1>${name}.sui</h1>
	<span class="badge">${network}</span>
	<div class="address">${record.address}</div>
	<p><a href="${explorerUrl}" target="_blank">View on Explorer →</a></p>
	<p><a href="/${name}.sui.ski/json">View JSON →</a></p>
</body>
</html>`
}

/**
 * Generate MVR package page HTML
 */
function mvrPackagePage(pkg: MVRPackage, network: string): string {
	const explorerUrl = getPackageExplorerUrl(pkg.address, network)
	const docsUrl = getMVRDocumentationUrl(pkg)

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${pkg.name} | sui.ski</title>
	<style>
		body { font-family: system-ui, sans-serif; max-width: 600px; margin: 60px auto; padding: 20px; background: #0f172a; color: #e2e8f0; }
		h1 { color: #a5b4fc; }
		.address { font-family: monospace; background: #1e293b; padding: 12px; border-radius: 8px; word-break: break-all; margin: 16px 0; }
		a { color: #818cf8; }
		.badge { display: inline-block; padding: 4px 8px; background: #334155; border-radius: 4px; font-size: 0.8rem; margin-right: 8px; }
		.description { color: #94a3b8; margin: 16px 0; }
	</style>
</head>
<body>
	<h1>${pkg.name}</h1>
	<span class="badge">${network}</span>
	<span class="badge">v${pkg.version}</span>
	${pkg.metadata?.description ? `<p class="description">${pkg.metadata.description}</p>` : ''}
	<div class="address">${pkg.address}</div>
	<p><a href="${explorerUrl}" target="_blank">View on Explorer →</a></p>
	<p><a href="${docsUrl}" target="_blank">Documentation →</a></p>
	${pkg.metadata?.repository ? `<p><a href="${pkg.metadata.repository}" target="_blank">Repository →</a></p>` : ''}
</body>
</html>`
}
