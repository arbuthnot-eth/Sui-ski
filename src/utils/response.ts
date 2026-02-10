import { generateRegistrationPage } from '../handlers/register2'
import type { Env, GatewayError } from '../types'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': '*',
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

export function htmlResponse(html: string, status = 200, headers: Record<string, string> = {}) {
	return new Response(html, {
		status,
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			...CORS_HEADERS,
			...headers,
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

export function notFoundPage(
	name: string,
	env?: Env,
	available?: boolean,
	session?: { address: string | null; walletName: string | null; verified: boolean },
) {
	// Only show registration page if env is provided AND we confirmed the name is available
	// If available is false/undefined, there was a resolution error - don't show registration
	if (env && available === true) {
		return htmlResponse(generateRegistrationPage(name, env, session), 200)
	}

	const escapeHtml = (value: string) =>
		value.replace(/[&<>"']/g, (char) => {
			switch (char) {
				case '&':
					return '&amp;'
				case '<':
					return '&lt;'
				case '>':
					return '&gt;'
				case '"':
					return '&quot;'
				case "'":
					return '&#39;'
				default:
					return char
			}
		})

	// Fallback for cases without env
	return htmlResponse(
		`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(name)} - Not Found | sui.ski</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: #000;
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		body::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(ellipse at 20% 20%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
				radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
			pointer-events: none;
		}
		.container {
			max-width: 480px;
			text-align: center;
			position: relative;
		}
		.icon {
			width: 80px;
			height: 80px;
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.12));
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 auto 24px;
		}
		.icon svg {
			width: 40px;
			height: 40px;
			color: #60a5fa;
		}
		h1 {
			font-size: 1.75rem;
			font-weight: 700;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 16px;
		}
		p {
			color: #71717a;
			line-height: 1.6;
			margin-bottom: 24px;
		}
		code {
			background: rgba(96, 165, 250, 0.12);
			padding: 3px 8px;
			border-radius: 6px;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			font-size: 0.9em;
			color: #60a5fa;
		}
		.btn {
			display: inline-block;
			padding: 12px 24px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			text-decoration: none;
			border-radius: 10px;
			font-weight: 600;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}
		.btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
		}
		.footer {
			margin-top: 40px;
			color: #71717a;
			font-size: 0.875rem;
		}
		.footer a {
			color: #60a5fa;
			text-decoration: none;
		}
		.footer a:hover {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				<line x1="8" y1="11" x2="14" y2="11"></line>
			</svg>
		</div>
		<h1>Name Not Found</h1>
		<p>The name <code>${escapeHtml(name)}</code> could not be resolved on the Sui network.</p>
		<a href="https://suins.io" class="btn">Register on SuiNS</a>
		<div class="footer">
			<p><a href="https://sui.ski">← Back to sui.ski</a></p>
		</div>
	</div>
</body>
</html>`,
		404,
	)
}
