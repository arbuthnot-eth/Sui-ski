import type { GatewayError } from '../types'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function jsonResponse<T>(data: T, status = 200, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...CORS_HEADERS,
			...headers,
		},
	})
}

export function errorResponse(error: string, code: string, status = 400, details?: unknown) {
	const body: GatewayError = { error, code, details }
	return jsonResponse(body, status)
}

export function htmlResponse(html: string, status = 200) {
	return new Response(html, {
		status,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			...CORS_HEADERS,
		},
	})
}

export function redirectResponse(url: string, permanent = false) {
	return Response.redirect(url, permanent ? 301 : 302)
}

export function proxyResponse(response: Response) {
	// Clone response and add CORS headers
	const newHeaders = new Headers(response.headers)
	for (const [key, value] of Object.entries(CORS_HEADERS)) {
		newHeaders.set(key, value)
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: newHeaders,
	})
}

export function notFoundPage(name: string) {
	return htmlResponse(
		`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${name} - Not Found | sui.ski</title>
	<style>
		body { font-family: system-ui, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
		h1 { color: #4f46e5; }
		a { color: #4f46e5; }
		code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
	</style>
</head>
<body>
	<h1>Name Not Found</h1>
	<p>The name <code>${name}</code> could not be resolved on the Sui network.</p>
	<p><a href="https://suins.io">Register this name on SuiNS</a></p>
</body>
</html>`,
		404,
	)
}
