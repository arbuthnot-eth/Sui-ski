import type { Env, MVRPackage } from '../types'
import { htmlResponse } from '../utils/response'
import { renderSocialMeta } from '../utils/social'

/**
 * Generate MVR Package Management UI
 *
 * This provides a web interface for:
 * - Browsing packages
 * - Registering new packages
 * - Publishing versions
 * - Updating metadata
 * - Generating unsigned transactions for offline signing
 */

export function handleMVRManagementPage(env: Env): Response {
	const html = generateMVRManagementHTML(env)
	return htmlResponse(html)
}

export function generateMVRPackageBrowser(suinsName: string, env: Env): Response {
	const html = generatePackageBrowserHTML(suinsName, env)
	return htmlResponse(html)
}

function generateMVRManagementHTML(env: Env): string {
	const network = env.SUI_NETWORK
	const socialMeta = renderSocialMeta({
		title: 'Move Registry Manager - sui.ski',
		description:
			'Manage your Move packages in the Move Registry. Register packages, publish versions, and generate transactions for offline signing.',
		url: 'https://sui.ski/mvr',
		siteName: 'sui.ski',
	})

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Move Registry Manager | sui.ski</title>
	${socialMeta}
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			padding: 40px 20px;
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
			max-width: 900px;
			margin: 0 auto;
			position: relative;
		}
		.header {
			text-align: center;
			margin-bottom: 40px;
		}
		.header h1 {
			font-size: 2.5rem;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 12px;
		}
		.header p {
			color: #a1a6c5;
			font-size: 1.1rem;
		}
		.network-badge {
			display: inline-block;
			padding: 6px 14px;
			background: ${network === 'mainnet' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(251, 191, 36, 0.15)'};
			color: ${network === 'mainnet' ? '#34d399' : '#fbbf24'};
			border-radius: 8px;
			font-size: 0.85rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 20px;
		}
		.card {
			background: rgba(22, 22, 30, 0.9);
			backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 16px;
			padding: 32px;
			margin-bottom: 24px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		}
		.card h2 {
			font-size: 1.5rem;
			margin-bottom: 16px;
			color: #60a5fa;
		}
		.card h3 {
			font-size: 1.2rem;
			margin: 24px 0 12px;
			color: #a78bfa;
		}
		.form-group {
			margin-bottom: 20px;
		}
		.form-group label {
			display: block;
			font-size: 0.9rem;
			font-weight: 600;
			color: #c7d2fe;
			margin-bottom: 8px;
		}
		.form-group input,
		.form-group textarea,
		.form-group select {
			width: 100%;
			padding: 12px 16px;
			background: rgba(15, 18, 32, 0.8);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 10px;
			color: #e4e4e7;
			font-size: 0.95rem;
			font-family: inherit;
		}
		.form-group textarea {
			min-height: 80px;
			resize: vertical;
		}
		.form-group input:focus,
		.form-group textarea:focus,
		.form-group select:focus {
			outline: none;
			border-color: #60a5fa;
		}
		.form-group .hint {
			font-size: 0.85rem;
			color: #71717a;
			margin-top: 6px;
		}
		.button {
			padding: 12px 24px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			border: none;
			border-radius: 10px;
			font-size: 1rem;
			font-weight: 600;
			cursor: pointer;
			transition: transform 0.2s;
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}
		.button:hover {
			transform: translateY(-2px);
		}
		.button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.button-secondary {
			background: rgba(96, 165, 250, 0.15);
			border: 1px solid rgba(96, 165, 250, 0.3);
			box-shadow: none;
		}
		.tabs {
			display: flex;
			gap: 8px;
			margin-bottom: 24px;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		}
		.tab {
			padding: 12px 20px;
			background: none;
			border: none;
			color: #a1a6c5;
			font-size: 1rem;
			font-weight: 500;
			cursor: pointer;
			border-bottom: 2px solid transparent;
			transition: all 0.2s;
		}
		.tab:hover {
			color: #60a5fa;
		}
		.tab.active {
			color: #60a5fa;
			border-bottom-color: #60a5fa;
		}
		.tab-content {
			display: none;
		}
		.tab-content.active {
			display: block;
		}
		.code-block {
			background: rgba(10, 10, 15, 0.8);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 8px;
			padding: 16px;
			font-family: 'Fira Code', 'Courier New', monospace;
			font-size: 0.85rem;
			overflow-x: auto;
			margin: 16px 0;
		}
		.code-block pre {
			margin: 0;
			white-space: pre-wrap;
			word-break: break-all;
		}
		.copy-button {
			float: right;
			padding: 6px 12px;
			font-size: 0.8rem;
			margin-top: -8px;
		}
		.success {
			background: rgba(52, 211, 153, 0.15);
			border: 1px solid rgba(52, 211, 153, 0.3);
			color: #34d399;
			padding: 16px;
			border-radius: 10px;
			margin: 16px 0;
		}
		.error {
			background: rgba(248, 113, 113, 0.15);
			border: 1px solid rgba(248, 113, 113, 0.3);
			color: #f87171;
			padding: 16px;
			border-radius: 10px;
			margin: 16px 0;
		}
		.warning {
			background: rgba(251, 191, 36, 0.15);
			border: 1px solid rgba(251, 191, 36, 0.3);
			color: #fbbf24;
			padding: 16px;
			border-radius: 10px;
			margin: 16px 0;
		}
		.info-box {
			background: rgba(96, 165, 250, 0.15);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: #60a5fa;
			padding: 16px;
			border-radius: 10px;
			margin: 16px 0;
		}
		.info-box h4 {
			margin-bottom: 8px;
		}
		.info-box ol {
			margin-left: 20px;
			margin-top: 8px;
		}
		.info-box li {
			margin-bottom: 6px;
		}
		.example-code {
			background: rgba(30, 30, 40, 0.5);
			padding: 12px;
			border-radius: 8px;
			margin: 12px 0;
			font-family: monospace;
			font-size: 0.9rem;
		}
		.grid-2 {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 16px;
		}
		@media (max-width: 768px) {
			.grid-2 {
				grid-template-columns: 1fr;
			}
			.header h1 {
				font-size: 2rem;
			}
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<span class="network-badge">${network}</span>
			<h1>📦 Move Registry Manager</h1>
			<p>Register and manage Move packages with offline transaction signing</p>
		</div>

		<div class="card">
			<div class="tabs">
				<button class="tab active" data-tab="register">Register Package</button>
				<button class="tab" data-tab="version">Publish Version</button>
				<button class="tab" data-tab="metadata">Update Metadata</button>
				<button class="tab" data-tab="transfer">Transfer Ownership</button>
				<button class="tab" data-tab="browse">Browse Packages</button>
				<button class="tab" data-tab="config">Configuration</button>
			</div>

			<!-- Register Package Tab -->
			<div class="tab-content active" data-tab-content="register">
				<h2>Register a New Package</h2>
				<p style="color: #a1a6c5; margin-bottom: 24px;">
					Register a new Move package in the registry. This will generate an unsigned transaction that you can sign with your wallet.
				</p>

				<form id="register-form">
					<div class="form-group">
						<label>SuiNS Name</label>
						<input type="text" id="register-suins" placeholder="myname" required />
						<div class="hint">Your SuiNS name without the .sui suffix</div>
					</div>

					<div class="form-group">
						<label>Package Name</label>
						<input type="text" id="register-package" placeholder="core" required />
						<div class="hint">Short identifier for your package (e.g., "core", "nft", "utils")</div>
					</div>

					<div class="form-group">
						<label>Package Address</label>
						<input type="text" id="register-address" placeholder="0x..." required />
						<div class="hint">The on-chain address of your published Move package</div>
					</div>

					<div class="form-group">
						<label>Description (Optional)</label>
						<textarea id="register-description" placeholder="A brief description of your package"></textarea>
					</div>

					<div class="grid-2">
						<div class="form-group">
							<label>Repository URL (Optional)</label>
							<input type="url" id="register-repository" placeholder="https://github.com/user/repo" />
						</div>

						<div class="form-group">
							<label>Documentation URL (Optional)</label>
							<input type="url" id="register-docs" placeholder="https://docs.example.com" />
						</div>
					</div>

					<button type="submit" class="button">Generate Transaction</button>
				</form>

				<div id="register-result"></div>
			</div>

			<!-- Publish Version Tab -->
			<div class="tab-content" data-tab-content="version">
				<h2>Publish New Version</h2>
				<p style="color: #a1a6c5; margin-bottom: 24px;">
					Publish a new version of an existing package.
				</p>

				<form id="version-form">
					<div class="form-group">
						<label>SuiNS Name</label>
						<input type="text" id="version-suins" placeholder="myname" required />
					</div>

					<div class="form-group">
						<label>Package Name</label>
						<input type="text" id="version-package" placeholder="core" required />
					</div>

					<div class="grid-2">
						<div class="form-group">
							<label>Version Number</label>
							<input type="number" id="version-number" min="1" placeholder="2" required />
							<div class="hint">Must be sequential (current version + 1)</div>
						</div>

						<div class="form-group">
							<label>Package Address</label>
							<input type="text" id="version-address" placeholder="0x..." required />
							<div class="hint">Address of the new package version</div>
						</div>
					</div>

					<button type="submit" class="button">Generate Transaction</button>
				</form>

				<div id="version-result"></div>
			</div>

			<!-- Update Metadata Tab -->
			<div class="tab-content" data-tab-content="metadata">
				<h2>Update Package Metadata</h2>
				<p style="color: #a1a6c5; margin-bottom: 24px;">
					Update the metadata for an existing package.
				</p>

				<form id="metadata-form">
					<div class="grid-2">
						<div class="form-group">
							<label>SuiNS Name</label>
							<input type="text" id="metadata-suins" placeholder="myname" required />
						</div>

						<div class="form-group">
							<label>Package Name</label>
							<input type="text" id="metadata-package" placeholder="core" required />
						</div>
					</div>

					<div class="form-group">
						<label>Description</label>
						<textarea id="metadata-description" placeholder="Updated description"></textarea>
					</div>

					<div class="grid-2">
						<div class="form-group">
							<label>Repository URL</label>
							<input type="url" id="metadata-repository" placeholder="https://github.com/user/repo" />
						</div>

						<div class="form-group">
							<label>Documentation URL</label>
							<input type="url" id="metadata-docs" placeholder="https://docs.example.com" />
						</div>
					</div>

					<button type="submit" class="button">Generate Transaction</button>
				</form>

				<div id="metadata-result"></div>
			</div>

			<!-- Transfer Ownership Tab -->
			<div class="tab-content" data-tab-content="transfer">
				<h2>Transfer Package Ownership</h2>
				<div class="warning">
					<strong>⚠️ Warning:</strong> This action is irreversible. Double-check the new owner address before proceeding.
				</div>

				<form id="transfer-form">
					<div class="grid-2">
						<div class="form-group">
							<label>SuiNS Name</label>
							<input type="text" id="transfer-suins" placeholder="myname" required />
						</div>

						<div class="form-group">
							<label>Package Name</label>
							<input type="text" id="transfer-package" placeholder="core" required />
						</div>
					</div>

					<div class="form-group">
						<label>New Owner Address</label>
						<input type="text" id="transfer-owner" placeholder="0x..." required />
						<div class="hint">The Sui address that will become the new owner</div>
					</div>

					<button type="submit" class="button">Generate Transaction</button>
				</form>

				<div id="transfer-result"></div>
			</div>

			<!-- Browse Packages Tab -->
			<div class="tab-content" data-tab-content="browse">
				<h2>Browse Packages</h2>
				<p style="color: #a1a6c5; margin-bottom: 24px;">
					Search for packages in the Move Registry or list all packages for a SuiNS name.
				</p>

				<div class="form-group">
					<label>Search Packages</label>
					<input type="text" id="search-query" placeholder="Enter package name or SuiNS name" />
				</div>
				<button type="button" class="button" onclick="searchPackages()">Search</button>

				<h3>List by SuiNS Name</h3>
				<div class="form-group">
					<input type="text" id="list-suins" placeholder="myname" />
				</div>
				<button type="button" class="button button-secondary" onclick="listPackages()">List Packages</button>

				<div id="browse-result"></div>
			</div>

			<!-- Configuration Tab -->
			<div class="tab-content" data-tab-content="config">
				<h2>Bounty Escrow Configuration</h2>
				<p style="color: #a1a6c5; margin-bottom: 24px;">
					Configure the bounty escrow package ID using an MVR alias. This allows you to manage the package address through the Move Registry.
				</p>

				<form id="config-form">
					<div class="form-group">
						<label>MVR Alias</label>
						<input type="text" id="config-alias" placeholder="sui.ski/bounty-escrow" />
						<div class="hint">Format: {suinsName}/{packageName} (e.g., "sui.ski/bounty-escrow")</div>
					</div>

					<button type="submit" class="button">Save Configuration</button>
				</form>

				<div id="config-result"></div>

				<div style="margin-top: 24px; padding: 16px; background: rgba(96, 165, 250, 0.1); border-radius: 8px; border: 1px solid rgba(96, 165, 250, 0.2);">
					<h4 style="margin-top: 0; color: #60a5fa;">Current Configuration</h4>
					<p style="color: #a1a6c5; margin: 8px 0;">
						<strong>MVR Alias:</strong> <span id="current-alias">Not configured</span>
					</p>
					<p style="color: #a1a6c5; margin: 8px 0; font-size: 0.875rem;">
						To use this feature, set the <code>BOUNTY_ESCROW_MVR_ALIAS</code> environment variable in your Cloudflare Workers configuration.
					</p>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>📘 How It Works</h2>
			<div class="info-box">
				<h4>Transaction Generation & Signing</h4>
				<ol>
					<li>Fill out the form with your package details</li>
					<li>Click "Generate Transaction" to create an unsigned transaction</li>
					<li>Copy the transaction bytes and sign them with your wallet</li>
					<li>Submit the signed transaction to the Sui network</li>
					<li>Your package will be registered in the Move Registry</li>
				</ol>
			</div>

			<h3>Package Naming Convention</h3>
			<p style="color: #a1a6c5; margin: 12px 0;">
				Packages are identified by the format: <code>@{suinsName}/{packageName}</code>
			</p>
			<div class="example-code">
				@myname/core → core--myname.sui.ski<br>
				@suifrens/nft/2 → nft--suifrens--v2.sui.ski
			</div>

			<h3>API Endpoints</h3>
			<div class="example-code">
				POST /api/mvr/register - Register new package<br>
				POST /api/mvr/publish-version - Publish version<br>
				POST /api/mvr/update-metadata - Update metadata<br>
				POST /api/mvr/transfer - Transfer ownership<br>
				GET /api/mvr/packages/{suinsName} - List packages<br>
				GET /api/mvr/search?q={query} - Search packages
			</div>
		</div>
	</div>

	<script>
		// Tab switching
		document.querySelectorAll('.tab').forEach(tab => {
			tab.addEventListener('click', () => {
				const tabName = tab.dataset.tab

				// Update tabs
				document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
				tab.classList.add('active')

				// Update content
				document.querySelectorAll('.tab-content').forEach(content => {
					content.classList.remove('active')
				})
				document.querySelector(\`[data-tab-content="\${tabName}"]\`).classList.add('active')
			})
		})

		// Form submission handlers
		document.getElementById('register-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			await handleFormSubmit('register', '/api/mvr/register', {
				suinsName: document.getElementById('register-suins').value.trim(),
				packageName: document.getElementById('register-package').value.trim(),
				packageAddress: document.getElementById('register-address').value.trim(),
				metadata: {
					description: document.getElementById('register-description').value.trim() || undefined,
					repository: document.getElementById('register-repository').value.trim() || undefined,
					documentation: document.getElementById('register-docs').value.trim() || undefined,
				}
			})
		})

		document.getElementById('version-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			await handleFormSubmit('version', '/api/mvr/publish-version', {
				suinsName: document.getElementById('version-suins').value.trim(),
				packageName: document.getElementById('version-package').value.trim(),
				version: parseInt(document.getElementById('version-number').value),
				packageAddress: document.getElementById('version-address').value.trim(),
			})
		})

		document.getElementById('metadata-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			await handleFormSubmit('metadata', '/api/mvr/update-metadata', {
				suinsName: document.getElementById('metadata-suins').value.trim(),
				packageName: document.getElementById('metadata-package').value.trim(),
				metadata: {
					description: document.getElementById('metadata-description').value.trim() || undefined,
					repository: document.getElementById('metadata-repository').value.trim() || undefined,
					documentation: document.getElementById('metadata-docs').value.trim() || undefined,
				}
			})
		})

		document.getElementById('transfer-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			await handleFormSubmit('transfer', '/api/mvr/transfer', {
				suinsName: document.getElementById('transfer-suins').value.trim(),
				packageName: document.getElementById('transfer-package').value.trim(),
				newOwner: document.getElementById('transfer-owner').value.trim(),
			})
		})

		// Load current configuration
		async function loadConfig() {
			try {
				const response = await fetch('/api/mvr/config')
				const data = await response.json()
				if (data.alias) {
					document.getElementById('current-alias').textContent = data.alias
					document.getElementById('config-alias').value = data.alias
				}
			} catch (error) {
				console.error('Failed to load config:', error)
			}
		}
		loadConfig()

		document.getElementById('config-form').addEventListener('submit', async (e) => {
			e.preventDefault()
			const alias = document.getElementById('config-alias').value.trim()
			const resultDiv = document.getElementById('config-result')
			resultDiv.innerHTML = '<div class="info-box">Saving configuration...</div>'

			try {
				const response = await fetch('/api/mvr/config', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ alias: alias || null })
				})

				const result = await response.json()
				if (!response.ok) {
					throw new Error(result.error || 'Failed to save configuration')
				}

				resultDiv.innerHTML = '<div class="success">Configuration saved! Note: You must set BOUNTY_ESCROW_MVR_ALIAS in your Cloudflare Workers environment variables for this to take effect.</div>'
				document.getElementById('current-alias').textContent = alias || 'Not configured'
			} catch (error) {
				resultDiv.innerHTML = \`<div class="error">Failed to save: \${error.message}</div>\`
			}
		})

		async function handleFormSubmit(formName, endpoint, data) {
			const resultDiv = document.getElementById(formName + '-result')
			resultDiv.innerHTML = '<div class="info-box">Generating transaction...</div>'

			try {
				const response = await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(data)
				})

				const result = await response.json()

				if (!response.ok) {
					throw new Error(result.error || 'Request failed')
				}

				displayTransactionResult(resultDiv, result)
			} catch (error) {
				resultDiv.innerHTML = \`<div class="error"><strong>Error:</strong> \${error.message}</div>\`
			}
		}

		function displayTransactionResult(container, result) {
			container.innerHTML = \`
				<div class="success">
					<strong>✓ Transaction Generated Successfully</strong>
				</div>
				<div class="info-box">
					<h4>Instructions</h4>
					<ol>
						\${Object.entries(result.instructions).map(([k, v]) => \`<li>\${v}</li>\`).join('')}
					</ol>
				</div>
				<div class="code-block">
					<button class="copy-button button button-secondary" onclick="copyToClipboard('\${result.transaction.bytes}')">Copy</button>
					<strong>Transaction Bytes:</strong>
					<pre>\${result.transaction.bytes}</pre>
				</div>
				<div class="code-block">
					<strong>Transaction Digest:</strong>
					<pre>\${result.transaction.digest}</pre>
				</div>
				\${result.warning ? \`<div class="warning">\${result.warning}</div>\` : ''}
			\`
		}

		async function searchPackages() {
			const query = document.getElementById('search-query').value.trim()
			if (!query) return

			const resultDiv = document.getElementById('browse-result')
			resultDiv.innerHTML = '<div class="info-box">Searching...</div>'

			try {
				const response = await fetch(\`/api/mvr/search?q=\${encodeURIComponent(query)}\`)
				const data = await response.json()

				if (data.results && data.results.length > 0) {
					resultDiv.innerHTML = \`
						<h3>Search Results (\${data.count})</h3>
						<div style="margin-top: 16px;">
							\${data.results.map(pkg => \`
								<div class="code-block">
									<strong>\${pkg.name}</strong> - Version \${pkg.version}<br>
									Address: <code>\${pkg.address}</code><br>
									\${pkg.metadata?.description ? \`<br>\${pkg.metadata.description}\` : ''}
								</div>
							\`).join('')}
						</div>
					\`
				} else {
					resultDiv.innerHTML = '<div class="info-box">No packages found</div>'
				}
			} catch (error) {
				resultDiv.innerHTML = \`<div class="error">Search failed: \${error.message}</div>\`
			}
		}

		async function listPackages() {
			const suinsName = document.getElementById('list-suins').value.trim()
			if (!suinsName) return

			const resultDiv = document.getElementById('browse-result')
			resultDiv.innerHTML = '<div class="info-box">Loading packages...</div>'

			try {
				const response = await fetch(\`/api/mvr/packages/\${suinsName}\`)
				const data = await response.json()

				if (data.packages && data.packages.length > 0) {
					resultDiv.innerHTML = \`
						<h3>Packages for @\${data.suinsName} (\${data.count})</h3>
						<div style="margin-top: 16px;">
							\${data.packages.map(pkg => \`
								<div class="code-block">
									<strong>\${pkg.name}</strong> - Version \${pkg.version}<br>
									Address: <code>\${pkg.address}</code><br>
									\${pkg.metadata?.description ? \`<br>\${pkg.metadata.description}\` : ''}
									\${pkg.metadata?.repository ? \`<br>Repository: <a href="\${pkg.metadata.repository}" target="_blank">\${pkg.metadata.repository}</a>\` : ''}
								</div>
							\`).join('')}
						</div>
					\`
				} else {
					resultDiv.innerHTML = \`<div class="info-box">No packages found for @\${suinsName}</div>\`
				}
			} catch (error) {
				resultDiv.innerHTML = \`<div class="error">Failed to list packages: \${error.message}</div>\`
			}
		}

		function copyToClipboard(text) {
			navigator.clipboard.writeText(text).then(() => {
				alert('Copied to clipboard!')
			}).catch(err => {
				console.error('Failed to copy:', err)
			})
		}
	</script>
</body>
</html>`
}

function generatePackageBrowserHTML(suinsName: string, env: Env): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Packages for @${suinsName} | sui.ski</title>
	<style>
		/* Use same styles as management page */
	</style>
</head>
<body>
	<h1>Packages for @${suinsName}</h1>
	<div id="packages-list"></div>

	<script>
		async function loadPackages() {
			try {
				const response = await fetch('/api/mvr/packages/${suinsName}')
				const data = await response.json()
				// Display packages
				document.getElementById('packages-list').innerHTML =
					data.packages.map(pkg => \`
						<div>\${pkg.name} - v\${pkg.version}</div>
					\`).join('')
			} catch (error) {
				console.error('Failed to load packages:', error)
			}
		}
		loadPackages()
	</script>
</body>
</html>`
}
