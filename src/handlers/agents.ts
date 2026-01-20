/**
 * Agents Handler
 * Serves the agent marketplace and agency management at agents.sui.ski
 *
 * Routes:
 * /              - Agent marketplace landing
 * /create        - Create new agency
 * /:agencyId     - Agency dashboard
 * /api/*         - Agency APIs (delegated to app.ts handlers)
 */

import type { Env } from '../types'
import { htmlResponse, jsonResponse } from '../utils/response'
import { getPWAMetaTags } from './pwa'

/**
 * Handle all agents.sui.ski requests
 */
export async function handleAgentsRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname

	// API endpoints
	if (path.startsWith('/api/')) {
		return handleAgentsApi(request, env, url)
	}

	// Web pages
	return htmlResponse(generateAgentsPage(path, env))
}

/**
 * Handle API requests
 */
async function handleAgentsApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/', '')

	// GET /api/agencies - List all public agencies
	if ((path === 'agencies' || path === '') && request.method === 'GET') {
		const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '20', 10), 100)
		const cursor = url.searchParams.get('cursor')
		const tags = url.searchParams.get('tags')?.split(',').filter(Boolean)

		// Placeholder - would query on-chain agency registry
		return jsonResponse({
			agencies: [],
			filters: { tags },
			pagination: { limit, cursor, hasMore: false },
			note: env.AGENCY_REGISTRY_ID
				? 'Fetching from on-chain registry'
				: 'Agency registry not configured. Set AGENCY_REGISTRY_ID in env.',
		})
	}

	// GET /api/agencies/:id - Get agency details
	const agencyMatch = path.match(/^agencies\/([^/]+)$/)
	if (agencyMatch && request.method === 'GET') {
		const agencyId = agencyMatch[1]
		// Placeholder - would fetch from chain
		return jsonResponse(
			{
				error: 'Agency not found',
				agencyId,
			},
			404,
		)
	}

	// POST /api/agencies/create - Create agency (returns tx builder)
	if (path === 'agencies/create' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				name?: string
				description?: string
				isPublic?: boolean
				tags?: string[]
			}

			if (!body.name) {
				return jsonResponse({ error: 'Agency name required' }, 400)
			}

			if (body.name.length < 3 || body.name.length > 32) {
				return jsonResponse({ error: 'Agency name must be 3-32 characters' }, 400)
			}

			// Return transaction building instructions
			return jsonResponse({
				action: 'create_agency',
				params: {
					name: body.name,
					description: body.description || '',
					isPublic: body.isPublic ?? true,
					tags: body.tags || [],
				},
				note: 'Build and sign transaction to create agency on-chain',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// POST /api/agencies/:id/members - Add member to agency
	const addMemberMatch = path.match(/^agencies\/([^/]+)\/members$/)
	if (addMemberMatch && request.method === 'POST') {
		const agencyId = addMemberMatch[1]
		try {
			const body = (await request.json()) as {
				address?: string
				type?: string
				role?: string
				capabilities?: string[]
			}

			if (!body.address) {
				return jsonResponse({ error: 'Member address required' }, 400)
			}

			return jsonResponse({
				action: 'add_member',
				agencyId,
				params: body,
				note: 'Build and sign transaction to add member',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// DELETE /api/agencies/:id/members/:address - Remove member
	const removeMemberMatch = path.match(/^agencies\/([^/]+)\/members\/([^/]+)$/)
	if (removeMemberMatch && request.method === 'DELETE') {
		const [, agencyId, memberAddress] = removeMemberMatch
		return jsonResponse({
			action: 'remove_member',
			agencyId,
			memberAddress,
			note: 'Build and sign transaction to remove member',
		})
	}

	// POST /api/agencies/:id/dwallet - Create or link dWallet
	const dwalletMatch = path.match(/^agencies\/([^/]+)\/dwallet$/)
	if (dwalletMatch && request.method === 'POST') {
		const agencyId = dwalletMatch[1]

		if (!env.IKA_PACKAGE_ID) {
			return jsonResponse(
				{
					error: 'IKA not configured',
					note: 'Set IKA_PACKAGE_ID in environment to enable dWallet features',
				},
				503,
			)
		}

		return jsonResponse({
			action: 'create_dwallet',
			agencyId,
			ikaPackageId: env.IKA_PACKAGE_ID,
			note: 'Load @ika.xyz/sdk client-side to create dWallet for this agency',
		})
	}

	// POST /api/agencies/:id/delegate - Create delegation capability
	const delegateMatch = path.match(/^agencies\/([^/]+)\/delegate$/)
	if (delegateMatch && request.method === 'POST') {
		const agencyId = delegateMatch[1]
		try {
			const body = (await request.json()) as {
				memberAddress?: string
				capabilities?: string[]
				dwalletPermission?: string
				expiresAt?: number
			}

			if (!body.memberAddress) {
				return jsonResponse({ error: 'Member address required' }, 400)
			}

			return jsonResponse({
				action: 'create_delegation',
				agencyId,
				params: body,
				note: 'Build and sign transaction to create delegation capability',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/stats - Platform statistics
	if (path === 'stats' && request.method === 'GET') {
		return jsonResponse({
			totalAgencies: 0,
			totalMembers: 0,
			totalDwallets: 0,
			activeToday: 0,
			network: env.SUI_NETWORK,
		})
	}

	return jsonResponse({ error: 'Unknown endpoint' }, 404)
}

/**
 * Generate agents page HTML
 */
function generateAgentsPage(path: string, env: Env): string {
	const title = getPageTitle(path)
	const content = getPageContent(path, env)

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title} | sui.ski Agents</title>
	<meta name="description" content="Create agencies with AI agents and human members. Cross-chain control with IKA dWallets.">
	${getPWAMetaTags()}
	<style>
		${getAgentsStyles()}
	</style>
</head>
<body>
	${getAgentsHeader(path)}
	<main class="main">
		${content}
	</main>
	${getAgentsFooter(env)}
</body>
</html>`
}

function getPageTitle(path: string): string {
	if (path === '/') return 'Agent Marketplace'
	if (path === '/create') return 'Create Agency'
	if (path.startsWith('/')) return 'Agency'
	return 'Agents'
}

function getPageContent(path: string, env: Env): string {
	if (path === '/' || path === '') {
		return getMarketplacePage(env)
	}

	if (path === '/create') {
		return getCreateAgencyPage(env)
	}

	// Agency detail page
	const agencyId = path.replace('/', '')
	return getAgencyDetailPage(agencyId, env)
}

function getMarketplacePage(_env: Env): string {
	return `
		<div class="container">
			<section class="hero">
				<h1>Agent Marketplace</h1>
				<p>Create agencies with AI agents and human members. Delegate permissions with guardrails.</p>
				<div class="hero-actions">
					<a href="/create" class="btn btn-primary">Create Agency</a>
					<a href="#browse" class="btn btn-secondary">Browse Agencies</a>
				</div>
			</section>

			<section class="features">
				<div class="feature-card">
					<div class="feature-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
							<circle cx="9" cy="7" r="4"></circle>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
						</svg>
					</div>
					<h3>Multi-Member Agencies</h3>
					<p>Combine humans, LLM agents, and backend bots in a single organization with role-based permissions.</p>
				</div>

				<div class="feature-card">
					<div class="feature-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<path d="M12 16v-4"></path>
							<path d="M12 8h.01"></path>
						</svg>
					</div>
					<h3>IKA Cross-Chain Control</h3>
					<p>Control Bitcoin, Ethereum, and Solana wallets via IKA dWallets. No bridges, no wrapping.</p>
				</div>

				<div class="feature-card">
					<div class="feature-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
						</svg>
					</div>
					<h3>2PC-MPC Security</h3>
					<p>LLM agents require human approval for sensitive actions. Zero-trust security model.</p>
				</div>

				<div class="feature-card">
					<div class="feature-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="3"></circle>
							<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9"></path>
						</svg>
					</div>
					<h3>Delegation Capabilities</h3>
					<p>Grant fine-grained permissions with spending limits, expiration, and revocation.</p>
				</div>
			</section>

			<section id="browse" class="browse">
				<h2>Public Agencies</h2>
				<div class="agency-list" id="agency-list">
					<div class="empty-state">
						<p>No public agencies found. Be the first to create one!</p>
					</div>
				</div>
			</section>

			<section class="sdk-info">
				<h2>Integration</h2>
				<div class="code-block">
					<pre><code>// Load IKA SDK for dWallet control
import { IKA } from '@ika.xyz/sdk';

// Create dWallet controlled by your agency
const dwallet = await ika.createDWallet({
  agencyId: 'your-agency-id',
  chains: ['bitcoin', 'ethereum', 'solana']
});

// Get cross-chain addresses
const btcAddress = await dwallet.getAddress('bitcoin');
const ethAddress = await dwallet.getAddress('ethereum');</code></pre>
				</div>
				<p class="sdk-note">
					Load SDKs client-side from CDN. Cloudflare Worker provides metadata and transaction builders.
				</p>
			</section>
		</div>
	`
}

function getCreateAgencyPage(_env: Env): string {
	return `
		<div class="container">
			<section class="form-section">
				<h1>Create Agency</h1>
				<p>Set up your organization with AI agents and human members.</p>

				<form id="create-agency-form" class="agency-form">
					<div class="form-group">
						<label for="name">Agency Name *</label>
						<input type="text" id="name" name="name" required minlength="3" maxlength="32"
							placeholder="My Agency">
						<span class="hint">3-32 characters</span>
					</div>

					<div class="form-group">
						<label for="description">Description</label>
						<textarea id="description" name="description" rows="3"
							placeholder="What does your agency do?"></textarea>
					</div>

					<div class="form-group">
						<label for="tags">Tags</label>
						<input type="text" id="tags" name="tags"
							placeholder="defi, trading, nft (comma-separated)">
					</div>

					<div class="form-group checkbox">
						<input type="checkbox" id="isPublic" name="isPublic" checked>
						<label for="isPublic">Make agency publicly discoverable</label>
					</div>

					<div class="form-actions">
						<button type="submit" class="btn btn-primary" id="submit-btn">
							Connect Wallet & Create
						</button>
					</div>
				</form>

				<div class="info-box">
					<h3>What happens next?</h3>
					<ol>
						<li>Connect your Sui wallet</li>
						<li>Sign the transaction to create your agency on-chain</li>
						<li>Add members (humans, LLM agents, bots)</li>
						<li>Optionally create an IKA dWallet for cross-chain control</li>
					</ol>
				</div>
			</section>
		</div>

		<script>
			document.getElementById('create-agency-form').addEventListener('submit', async (e) => {
				e.preventDefault();
				const btn = document.getElementById('submit-btn');
				btn.disabled = true;
				btn.textContent = 'Connecting...';

				try {
					// Check for wallet
					if (typeof window.sui === 'undefined') {
						alert('Please install a Sui wallet');
						return;
					}

					// Connect wallet
					await window.sui.connect();

					// Get form data
					const form = e.target;
					const data = {
						name: form.name.value,
						description: form.description.value,
						tags: form.tags.value.split(',').map(t => t.trim()).filter(Boolean),
						isPublic: form.isPublic.checked,
					};

					btn.textContent = 'Creating...';

					// Call API to get transaction
					const response = await fetch('/api/agencies/create', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(data),
					});

					const result = await response.json();

					if (result.error) {
						alert(result.error);
						return;
					}

					alert('Agency creation coming soon! Transaction builder returned: ' + JSON.stringify(result));

				} catch (error) {
					console.error(error);
					alert('Failed to create agency: ' + error.message);
				} finally {
					btn.disabled = false;
					btn.textContent = 'Connect Wallet & Create';
				}
			});
		</script>
	`
}

function getAgencyDetailPage(agencyId: string, _env: Env): string {
	return `
		<div class="container">
			<section class="agency-detail">
				<div class="agency-header">
					<div class="agency-avatar">A</div>
					<div class="agency-info">
						<h1>Agency: ${agencyId}</h1>
						<p class="agency-meta">Loading...</p>
					</div>
				</div>

				<div class="empty-state">
					<p>Agency details will be loaded from the blockchain.</p>
					<p>Configure AGENCY_REGISTRY_ID in environment to enable.</p>
				</div>
			</section>
		</div>

		<script>
			// Fetch agency details
			fetch('/api/agencies/${agencyId}')
				.then(r => r.json())
				.then(data => {
					console.log('Agency data:', data);
				})
				.catch(console.error);
		</script>
	`
}

function getAgentsHeader(path: string): string {
	return `
		<header class="header">
			<div class="header-content">
				<a href="/" class="logo">
					<span class="logo-text">sui.ski</span>
					<span class="logo-badge">agents</span>
				</a>
				<nav class="nav">
					<a href="/" class="${path === '/' ? 'active' : ''}">Marketplace</a>
					<a href="/create" class="${path === '/create' ? 'active' : ''}">Create</a>
					<a href="https://sui.ski/app" class="nav-external">Open App</a>
				</nav>
				<button class="wallet-btn" id="wallet-btn" onclick="connectWallet()">
					Connect Wallet
				</button>
			</div>
		</header>

		<script>
			async function connectWallet() {
				const btn = document.getElementById('wallet-btn');
				if (typeof window.sui === 'undefined') {
					alert('Please install a Sui wallet');
					return;
				}
				try {
					const response = await window.sui.connect();
					const address = response.accounts[0]?.address;
					if (address) {
						btn.textContent = address.slice(0, 6) + '...' + address.slice(-4);
						btn.classList.add('connected');
					}
				} catch (error) {
					console.error('Connection failed:', error);
				}
			}

			// Auto-connect if already authorized
			if (typeof window.sui !== 'undefined') {
				window.sui.hasPermissions().then(has => {
					if (has) {
						window.sui.getAccounts().then(accounts => {
							if (accounts?.length > 0) {
								const btn = document.getElementById('wallet-btn');
								const addr = accounts[0].address;
								btn.textContent = addr.slice(0, 6) + '...' + addr.slice(-4);
								btn.classList.add('connected');
							}
						});
					}
				});
			}
		</script>
	`
}

function getAgentsFooter(env: Env): string {
	return `
		<footer class="footer">
			<div class="footer-content">
				<p>Powered by <a href="https://sui.ski">sui.ski</a> | Network: ${env.SUI_NETWORK}</p>
				<p class="footer-links">
					<a href="https://docs.ika.xyz">IKA Docs</a>
					<a href="https://github.com/anthropics/claude-code">GitHub</a>
				</p>
			</div>
		</footer>
	`
}

function getAgentsStyles(): string {
	return `
		* { margin: 0; padding: 0; box-sizing: border-box; }

		:root {
			--bg-primary: #0a0a0f;
			--bg-secondary: #12121a;
			--bg-card: rgba(22, 22, 30, 0.9);
			--text-primary: #e4e4e7;
			--text-secondary: #71717a;
			--accent: #60a5fa;
			--accent-secondary: #8b5cf6;
			--border: rgba(255, 255, 255, 0.08);
			--success: #22c55e;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: var(--bg-primary);
			color: var(--text-primary);
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}

		.header {
			background: var(--bg-secondary);
			border-bottom: 1px solid var(--border);
			position: sticky;
			top: 0;
			z-index: 100;
		}

		.header-content {
			max-width: 1200px;
			margin: 0 auto;
			padding: 16px 24px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 24px;
		}

		.logo {
			display: flex;
			align-items: center;
			gap: 8px;
			text-decoration: none;
		}

		.logo-text {
			font-size: 1.25rem;
			font-weight: 700;
			background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.logo-badge {
			font-size: 0.75rem;
			padding: 2px 8px;
			background: var(--accent);
			color: white;
			border-radius: 4px;
			font-weight: 600;
		}

		.nav {
			display: flex;
			gap: 24px;
		}

		.nav a {
			color: var(--text-secondary);
			text-decoration: none;
			font-weight: 500;
			transition: color 0.2s;
		}

		.nav a:hover, .nav a.active {
			color: var(--text-primary);
		}

		.nav-external {
			color: var(--accent) !important;
		}

		.wallet-btn {
			padding: 10px 20px;
			background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
			border: none;
			border-radius: 8px;
			color: white;
			font-weight: 600;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.wallet-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
		}

		.wallet-btn.connected {
			background: var(--bg-card);
			border: 1px solid var(--border);
		}

		.main {
			flex: 1;
		}

		.container {
			max-width: 1200px;
			margin: 0 auto;
			padding: 48px 24px;
		}

		.hero {
			text-align: center;
			margin-bottom: 64px;
		}

		.hero h1 {
			font-size: 3rem;
			margin-bottom: 16px;
			background: linear-gradient(135deg, var(--text-primary), var(--accent));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.hero p {
			font-size: 1.25rem;
			color: var(--text-secondary);
			margin-bottom: 32px;
		}

		.hero-actions {
			display: flex;
			gap: 16px;
			justify-content: center;
		}

		.btn {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 14px 28px;
			border-radius: 12px;
			font-weight: 600;
			text-decoration: none;
			transition: transform 0.2s, box-shadow 0.2s;
			border: none;
			cursor: pointer;
		}

		.btn-primary {
			background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
			color: white;
		}

		.btn-primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
		}

		.btn-secondary {
			background: var(--bg-card);
			color: var(--text-primary);
			border: 1px solid var(--border);
		}

		.btn-secondary:hover {
			border-color: var(--accent);
		}

		.features {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 24px;
			margin-bottom: 64px;
		}

		.feature-card {
			background: var(--bg-card);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 24px;
			transition: border-color 0.2s, transform 0.2s;
		}

		.feature-card:hover {
			border-color: var(--accent);
			transform: translateY(-2px);
		}

		.feature-icon {
			width: 48px;
			height: 48px;
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(139, 92, 246, 0.1));
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 16px;
		}

		.feature-icon svg {
			width: 24px;
			height: 24px;
			color: var(--accent);
		}

		.feature-card h3 {
			font-size: 1.1rem;
			margin-bottom: 8px;
		}

		.feature-card p {
			color: var(--text-secondary);
			font-size: 0.9rem;
			line-height: 1.6;
		}

		.browse {
			margin-bottom: 64px;
		}

		.browse h2 {
			font-size: 1.75rem;
			margin-bottom: 24px;
		}

		.agency-list {
			background: var(--bg-card);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 24px;
		}

		.empty-state {
			text-align: center;
			padding: 48px;
			color: var(--text-secondary);
		}

		.sdk-info {
			background: var(--bg-card);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 32px;
		}

		.sdk-info h2 {
			margin-bottom: 24px;
		}

		.code-block {
			background: var(--bg-primary);
			border-radius: 12px;
			padding: 20px;
			overflow-x: auto;
		}

		.code-block pre {
			margin: 0;
		}

		.code-block code {
			font-family: 'SF Mono', Monaco, monospace;
			font-size: 0.875rem;
			color: var(--text-primary);
		}

		.sdk-note {
			margin-top: 16px;
			color: var(--text-secondary);
			font-size: 0.9rem;
		}

		/* Form styles */
		.form-section {
			max-width: 600px;
			margin: 0 auto;
		}

		.form-section h1 {
			font-size: 2rem;
			margin-bottom: 8px;
		}

		.form-section > p {
			color: var(--text-secondary);
			margin-bottom: 32px;
		}

		.agency-form {
			background: var(--bg-card);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 32px;
			margin-bottom: 24px;
		}

		.form-group {
			margin-bottom: 24px;
		}

		.form-group label {
			display: block;
			font-weight: 600;
			margin-bottom: 8px;
		}

		.form-group input[type="text"],
		.form-group textarea {
			width: 100%;
			padding: 12px 16px;
			background: var(--bg-primary);
			border: 1px solid var(--border);
			border-radius: 8px;
			color: var(--text-primary);
			font-size: 1rem;
			transition: border-color 0.2s;
		}

		.form-group input:focus,
		.form-group textarea:focus {
			outline: none;
			border-color: var(--accent);
		}

		.form-group .hint {
			display: block;
			font-size: 0.85rem;
			color: var(--text-secondary);
			margin-top: 4px;
		}

		.form-group.checkbox {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.form-group.checkbox input {
			width: 20px;
			height: 20px;
		}

		.form-group.checkbox label {
			margin-bottom: 0;
			font-weight: 400;
		}

		.form-actions {
			margin-top: 32px;
		}

		.form-actions .btn {
			width: 100%;
			justify-content: center;
		}

		.info-box {
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 12px;
			padding: 24px;
		}

		.info-box h3 {
			margin-bottom: 16px;
		}

		.info-box ol {
			color: var(--text-secondary);
			padding-left: 24px;
		}

		.info-box li {
			margin-bottom: 8px;
		}

		/* Agency detail */
		.agency-detail {
			max-width: 800px;
			margin: 0 auto;
		}

		.agency-header {
			display: flex;
			align-items: center;
			gap: 24px;
			margin-bottom: 32px;
		}

		.agency-avatar {
			width: 80px;
			height: 80px;
			background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
			border-radius: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 2rem;
			font-weight: 700;
		}

		.agency-info h1 {
			font-size: 1.75rem;
			margin-bottom: 4px;
		}

		.agency-meta {
			color: var(--text-secondary);
		}

		.footer {
			background: var(--bg-secondary);
			border-top: 1px solid var(--border);
			padding: 24px;
			text-align: center;
		}

		.footer-content {
			max-width: 1200px;
			margin: 0 auto;
		}

		.footer p {
			color: var(--text-secondary);
			font-size: 0.9rem;
		}

		.footer a {
			color: var(--accent);
			text-decoration: none;
		}

		.footer-links {
			margin-top: 8px;
		}

		.footer-links a {
			margin: 0 12px;
		}

		@media (max-width: 768px) {
			.header-content {
				flex-wrap: wrap;
			}

			.nav {
				order: 3;
				width: 100%;
				justify-content: center;
				margin-top: 16px;
			}

			.hero h1 {
				font-size: 2rem;
			}

			.hero-actions {
				flex-direction: column;
			}
		}
	`
}
