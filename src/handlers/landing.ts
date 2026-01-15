import type { Env } from '../types'
import { getNetworkStatus } from '../resolvers/rpc'
import { htmlResponse, jsonResponse } from '../utils/response'

/**
 * Handle requests to the root domain (sui.ski)
 */
export async function handleLandingPage(
	request: Request,
	env: Env,
): Promise<Response> {
	const url = new URL(request.url)

	// API endpoint for status
	if (url.pathname === '/api/status') {
		const status = await getNetworkStatus(env)
		return jsonResponse(status)
	}

	// API endpoint for resolving names programmatically
	if (url.pathname === '/api/resolve' && url.searchParams.has('name')) {
		const name = url.searchParams.get('name')
		// Import dynamically to avoid circular dependencies
		const { resolveSuiNS } = await import('../resolvers/suins')
		const result = await resolveSuiNS(name!, env)
		return jsonResponse(result)
	}

	// Landing page HTML
	return htmlResponse(landingPageHTML(env.SUI_NETWORK))
}

function landingPageHTML(network: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>sui.ski - Sui Gateway</title>
	<meta name="description" content="Access Sui blockchain content through human-readable URLs. Resolve SuiNS names, Move Registry packages, and decentralized content.">
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: system-ui, -apple-system, sans-serif;
			background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
			color: #fff;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 40px 20px;
		}
		.container { max-width: 800px; width: 100%; }
		h1 {
			font-size: 3rem;
			font-weight: 800;
			margin-bottom: 0.5rem;
			background: linear-gradient(90deg, #a5b4fc, #818cf8);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}
		.tagline { color: #c7d2fe; font-size: 1.25rem; margin-bottom: 2rem; }
		.card {
			background: rgba(255,255,255,0.1);
			backdrop-filter: blur(10px);
			border-radius: 16px;
			padding: 24px;
			margin-bottom: 20px;
		}
		.card h2 { color: #a5b4fc; font-size: 1.25rem; margin-bottom: 12px; }
		.card p { color: #e0e7ff; line-height: 1.6; }
		code {
			background: rgba(0,0,0,0.3);
			padding: 2px 8px;
			border-radius: 4px;
			font-family: 'JetBrains Mono', monospace;
		}
		.examples { display: grid; gap: 12px; margin-top: 16px; }
		.example {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			background: rgba(0,0,0,0.2);
			border-radius: 8px;
		}
		.example-url { color: #a5b4fc; font-family: monospace; }
		.example-desc { color: #c7d2fe; font-size: 0.9rem; }
		.arrow { color: #6366f1; }
		.network-badge {
			display: inline-block;
			padding: 4px 12px;
			background: ${network === 'mainnet' ? '#10b981' : '#f59e0b'};
			border-radius: 999px;
			font-size: 0.8rem;
			font-weight: 600;
			text-transform: uppercase;
			margin-bottom: 1rem;
		}
		a { color: #a5b4fc; text-decoration: none; }
		a:hover { text-decoration: underline; }
		footer { margin-top: auto; padding-top: 40px; color: #818cf8; font-size: 0.9rem; }
	</style>
</head>
<body>
	<div class="container">
		<span class="network-badge">${network}</span>
		<h1>sui.ski</h1>
		<p class="tagline">Your gateway to the Sui ecosystem</p>

		<div class="card">
			<h2>SuiNS Name Resolution</h2>
			<p>Access content linked to SuiNS names directly in your browser.</p>
			<div class="examples">
				<div class="example">
					<span class="example-url">myname.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">Resolves myname.sui content</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>Move Registry Packages</h2>
			<p>Browse Move packages using human-readable MVR names.</p>
			<div class="examples">
				<div class="example">
					<span class="example-url">core--suifrens.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">@suifrens/core package</span>
				</div>
				<div class="example">
					<span class="example-url">nft--myname--v2.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">@myname/nft version 2</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>Decentralized Content</h2>
			<p>Direct access to IPFS and Walrus content.</p>
			<div class="examples">
				<div class="example">
					<span class="example-url">ipfs-Qm....sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">IPFS content by CID</span>
				</div>
				<div class="example">
					<span class="example-url">walrus-{blobId}.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">Walrus blob content</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>RPC Proxy</h2>
			<p>Public Sui RPC endpoint at <code>rpc.sui.ski</code></p>
			<div class="examples">
				<div class="example">
					<span class="example-url">POST rpc.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">JSON-RPC (read-only methods)</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>API</h2>
			<p>Programmatic access to resolution services.</p>
			<div class="examples">
				<div class="example">
					<span class="example-url">sui.ski/api/status</span>
					<span class="arrow">→</span>
					<span class="example-desc">Network status</span>
				</div>
				<div class="example">
					<span class="example-url">sui.ski/api/resolve?name=myname</span>
					<span class="arrow">→</span>
					<span class="example-desc">Resolve SuiNS name</span>
				</div>
			</div>
		</div>
	</div>

	<footer>
		<p>Built on <a href="https://sui.io">Sui</a> · <a href="https://suins.io">SuiNS</a> · <a href="https://moveregistry.com">MVR</a> · <a href="https://walrus.xyz">Walrus</a></p>
	</footer>
</body>
</html>`
}
