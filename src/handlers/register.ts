import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { relaySignedTransaction } from '../utils/transactions'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}


export function generateRegistrationPage(name: string, env: Env): string {
	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const network = env.SUI_NETWORK || 'mainnet'
	const isRegisterable = cleanName.length >= 3
	const defaultExec = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
	const serializeJson = (value: unknown) =>
		JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(cleanName)}.sui available | sui.ski</title>
	<style>
		:root {
			--bg: #05060c;
			--card: rgba(15, 18, 32, 0.9);
			--border: rgba(255, 255, 255, 0.08);
			--text: #e4e6f1;
			--muted: #7c819b;
			--accent: #60a5fa;
			--success: #34d399;
			--error: #f87171;
			--warning: #fbbf24;
		}
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 40%), linear-gradient(180deg, #05060c, #090d1a 60%, #05060c);
			min-height: 100vh;
			color: var(--text);
			padding: 32px 16px 64px;
		}
		.container {
			max-width: 880px;
			margin: 0 auto;
			display: flex;
			flex-direction: column;
			gap: 20px;
		}
		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 20px;
			padding: 28px;
			box-shadow: 0 25px 60px rgba(5,6,12,0.7);
		}
		.header {
			text-align: center;
			margin-bottom: 12px;
		}
		.header h1 {
			font-size: clamp(1.8rem, 3vw, 2.8rem);
			margin-bottom: 6px;
			font-weight: 800;
		}
		.header h1 span {
			color: var(--accent);
		}
		.badge {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 6px 14px;
			border-radius: 999px;
			font-size: 0.85rem;
			font-weight: 600;
		}
		.badge.success { background: rgba(52,211,153,0.15); color: var(--success); border: 1px solid rgba(52,211,153,0.3); }
		.badge.warning { background: rgba(251,191,36,0.15); color: var(--warning); border: 1px solid rgba(251,191,36,0.25); }
		.section-title {
			font-size: 1.1rem;
			font-weight: 700;
			margin-bottom: 8px;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.section-title svg { width: 18px; height: 18px; }
		.stat-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
			gap: 12px;
			margin: 18px 0;
		}
		.stat {
			padding: 14px;
			border: 1px solid var(--border);
			border-radius: 14px;
			background: rgba(255,255,255,0.02);
		}
		.stat-label {
			font-size: 0.78rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--muted);
			margin-bottom: 4px;
		}
		.stat-value {
			font-size: 1.2rem;
			font-weight: 700;
		}
		.bid-list {
			border: 1px solid var(--border);
			border-radius: 16px;
			overflow: hidden;
			margin-bottom: 18px;
		}
		.bid-list ul {
			list-style: none;
		}
		.bid-list li {
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 12px 16px;
			border-bottom: 1px solid rgba(255,255,255,0.04);
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 0.85rem;
		}
		.bid-list li:last-child { border-bottom: none; }
		.bid-main {
			display: grid;
			grid-template-columns: 2fr 1fr 1fr;
			gap: 12px;
			align-items: center;
		}
		.bid-meta {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			font-size: 0.75rem;
			color: var(--muted);
		}
		.status-chip {
			padding: 4px 10px;
			border-radius: 999px;
			background: rgba(96,165,250,0.15);
			border: 1px solid rgba(96,165,250,0.25);
			color: #c7d2fe;
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
		}
		.status-chip.auto {
			background: rgba(16,185,129,0.15);
			border-color: rgba(16,185,129,0.35);
			color: var(--success);
		}
		.status-chip.submitted {
			background: rgba(59,130,246,0.18);
			border-color: rgba(59,130,246,0.35);
			color: #bfdbfe;
		}
		.status-chip.failed {
			background: rgba(248,113,113,0.15);
			border-color: rgba(248,113,113,0.3);
			color: var(--error);
		}
		.digest-chip {
			background: rgba(255,255,255,0.04);
			border-radius: 8px;
			padding: 2px 8px;
			font-size: 0.75rem;
		}
		.form {
			display: flex;
			flex-direction: column;
			gap: 16px;
			margin-top: 10px;
		}
		.attach-toggle {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 0.85rem;
			color: var(--muted);
		}
		.attach-toggle input {
			width: auto;
			accent-color: var(--accent);
		}
		.offline-attachment {
			display: none;
			flex-direction: column;
			gap: 12px;
			border: 1px dashed var(--border);
			border-radius: 12px;
			padding: 16px;
			background: rgba(255,255,255,0.02);
		}
		label {
			font-size: 0.8rem;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 6px;
		}
		input, textarea {
			width: 100%;
			padding: 12px 14px;
			background: rgba(255,255,255,0.03);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 0.95rem;
		}
		input:focus, textarea:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 3px rgba(96,165,250,0.25);
		}
		textarea { min-height: 120px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
		button {
			border: none;
			border-radius: 12px;
			padding: 12px 18px;
			font-size: 0.95rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.primary-btn {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			box-shadow: 0 12px 30px rgba(59,130,246,0.3);
		}
		.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
		.secondary-btn {
			background: transparent;
			color: var(--muted);
			border: 1px solid var(--border);
		}
		.status-line {
			font-size: 0.85rem;
			min-height: 20px;
		}
		.status-line.success { color: var(--success); }
		.status-line.error { color: var(--error); }
		.status-line.info { color: var(--muted); }
		.instructions {
			font-size: 0.9rem;
			color: var(--muted);
			line-height: 1.6;
			margin-bottom: 12px;
		}
		.instructions ol { padding-left: 18px; margin-top: 6px; }
		pre {
			background: rgba(0,0,0,0.4);
			border-radius: 12px;
			padding: 16px;
			overflow-x: auto;
			font-size: 0.8rem;
			line-height: 1.4;
		}
		/* Global Wallet Widget */
		.global-wallet-widget {
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 9999;
		}
		.global-wallet-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 16px;
			background: rgba(15, 18, 32, 0.95);
			backdrop-filter: blur(12px);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}
		.global-wallet-btn:hover {
			border-color: var(--accent);
			background: rgba(96, 165, 250, 0.1);
		}
		.global-wallet-btn.connected {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15));
			border-color: rgba(96, 165, 250, 0.3);
		}
		.global-wallet-dropdown {
			position: absolute;
			top: calc(100% + 8px);
			right: 0;
			min-width: 220px;
			background: rgba(15, 18, 32, 0.98);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 8px;
			display: none;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		}
		.global-wallet-widget.open .global-wallet-dropdown {
			display: block;
		}
		.global-wallet-dropdown-addr {
			font-family: ui-monospace, monospace;
			font-size: 0.75rem;
			color: var(--muted);
			padding: 8px 12px;
			border-bottom: 1px solid var(--border);
			margin-bottom: 4px;
			word-break: break-all;
		}
		.global-wallet-dropdown-item {
			display: flex;
			align-items: center;
			gap: 10px;
			width: 100%;
			padding: 10px 12px;
			background: transparent;
			border: none;
			border-radius: 8px;
			color: var(--text);
			font-size: 0.85rem;
			cursor: pointer;
			transition: background 0.15s;
		}
		.global-wallet-dropdown-item:hover {
			background: rgba(255, 255, 255, 0.05);
		}
		.global-wallet-dropdown-item.disconnect {
			color: var(--error);
		}
		.global-wallet-dropdown-item svg {
			width: 16px;
			height: 16px;
		}

		/* Wallet Modal */
		.wallet-modal {
			display: none;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.7);
			backdrop-filter: blur(4px);
			z-index: 10000;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.wallet-modal.open {
			display: flex;
		}
		.wallet-modal-content {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 20px;
			max-width: 400px;
			width: 100%;
			max-height: 80vh;
			overflow: auto;
		}
		.wallet-modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 20px;
			border-bottom: 1px solid var(--border);
		}
		.wallet-modal-header h3 {
			font-size: 1.1rem;
			font-weight: 700;
		}
		.wallet-modal-close {
			background: none;
			border: none;
			color: var(--muted);
			font-size: 1.5rem;
			cursor: pointer;
			padding: 0;
			line-height: 1;
		}
		.wallet-list {
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		.wallet-option {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 14px 16px;
			background: rgba(255, 255, 255, 0.03);
			border: 1px solid var(--border);
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.2s;
			width: 100%;
			text-align: left;
			color: var(--text);
			font-size: 0.95rem;
		}
		.wallet-option:hover {
			border-color: var(--accent);
			background: rgba(96, 165, 250, 0.08);
		}
		.wallet-option img {
			width: 32px;
			height: 32px;
			border-radius: 8px;
		}
		.wallet-detecting {
			text-align: center;
			padding: 24px;
			color: var(--muted);
		}
		.loading {
			display: inline-block;
			width: 16px;
			height: 16px;
			border: 2px solid var(--border);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
			margin-right: 8px;
		}
		@keyframes spin {
			to { transform: rotate(360deg); }
		}

		/* Register Card */
		.register-card {
			background: linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(96, 165, 250, 0.12));
			border: 1px solid rgba(52, 211, 153, 0.25);
		}
		.register-hero {
			text-align: center;
			padding: 12px 0 24px;
		}
		.register-price {
			font-size: 2.5rem;
			font-weight: 800;
			background: linear-gradient(135deg, #34d399, #60a5fa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.register-price-label {
			color: var(--muted);
			font-size: 0.9rem;
			margin-top: 4px;
		}
		.register-btn {
			width: 100%;
			padding: 16px 24px;
			font-size: 1.1rem;
			font-weight: 700;
			background: linear-gradient(135deg, #10b981, #3b82f6);
			color: white;
			border: none;
			border-radius: 14px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			transition: all 0.2s;
			box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
		}
		.register-btn:hover:not(:disabled) {
			transform: translateY(-2px);
			box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
		}
		.register-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.register-btn svg {
			width: 20px;
			height: 20px;
		}
		.register-status {
			margin-top: 16px;
			padding: 12px 16px;
			border-radius: 10px;
			font-size: 0.9rem;
			display: none;
		}
		.register-status.show {
			display: block;
		}
		.register-status.info {
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			color: var(--accent);
		}
		.register-status.success {
			background: rgba(52, 211, 153, 0.1);
			border: 1px solid rgba(52, 211, 153, 0.2);
			color: var(--success);
		}
		.register-status.error {
			background: rgba(248, 113, 113, 0.1);
			border: 1px solid rgba(248, 113, 113, 0.2);
			color: var(--error);
		}
		.register-features {
			display: flex;
			justify-content: center;
			gap: 24px;
			margin-top: 20px;
			flex-wrap: wrap;
		}
		.register-feature {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.85rem;
			color: var(--muted);
		}
		.register-feature svg {
			width: 16px;
			height: 16px;
			color: var(--success);
		}

		/* Collapsible Sections */
		.collapsible-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			cursor: pointer;
			user-select: none;
		}
		.collapsible-header .section-title {
			margin-bottom: 0;
		}
		.collapsible-toggle {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			color: var(--muted);
			padding: 6px 12px;
			background: rgba(255, 255, 255, 0.03);
			border: 1px solid var(--border);
			border-radius: 8px;
			transition: all 0.2s;
		}
		.collapsible-header:hover .collapsible-toggle {
			border-color: var(--accent);
			color: var(--accent);
		}
		.collapsible-toggle svg {
			width: 14px;
			height: 14px;
			transition: transform 0.2s;
		}
		.collapsible-content {
			display: none;
			margin-top: 16px;
		}
		.collapsible-content.open {
			display: block;
		}
		.collapsible-toggle.open svg {
			transform: rotate(180deg);
		}

		@media (max-width: 640px) {
			.card { padding: 20px; }
			.bid-main { grid-template-columns: 1fr; }
			.bid-list li { font-size: 0.8rem; }
			.global-wallet-widget { top: 12px; right: 12px; }
			.global-wallet-btn { padding: 8px 12px; font-size: 0.85rem; }
		}
	</style>
</head>
<body>
	<!-- Global Wallet Widget -->
	<div class="global-wallet-widget" id="global-wallet-widget">
		<button class="global-wallet-btn" id="global-wallet-btn">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
				<circle cx="12" cy="7" r="4"></circle>
			</svg>
			<span id="global-wallet-text">Connect</span>
			<svg class="global-wallet-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</button>
		<div class="global-wallet-dropdown" id="global-wallet-dropdown"></div>
	</div>

	<!-- Wallet Modal -->
	<div class="wallet-modal" id="wallet-modal">
		<div class="wallet-modal-content">
			<div class="wallet-modal-header">
				<h3>Connect Wallet</h3>
				<button class="wallet-modal-close" id="wallet-modal-close">&times;</button>
			</div>
			<div class="wallet-list" id="wallet-list">
				<div class="wallet-detecting"><span class="loading"></span> Detecting wallets...</div>
			</div>
		</div>
	</div>

	<div class="container">
		<div class="card">
			<div class="header">
				<div class="badge ${isRegisterable ? 'success' : 'warning'}">${isRegisterable ? 'Name available for registration' : 'Minimum length is 3 characters'}</div>
				<h1>${escapeHtml(cleanName)}<span>.sui</span></h1>
				<p style="color: var(--muted); font-size: 0.95rem;">Network: ${escapeHtml(network)}</p>
			</div>
		</div>

		${isRegisterable ? `
		<!-- Quick Registration Card -->
		<div class="card register-card">
			<div class="section-title">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
				Quick Registration
			</div>
			<div class="register-hero">
				<div class="register-price" id="register-price"><span class="loading"></span></div>
				<div class="register-price-label">1 year registration</div>
			</div>
			<button class="register-btn" id="register-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
					<circle cx="12" cy="7" r="4"></circle>
				</svg>
				<span id="register-btn-text">Connect Wallet to Register</span>
			</button>
			<div class="register-status" id="register-status"></div>
			<div class="register-features">
				<div class="register-feature">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
					Instant ownership
				</div>
				<div class="register-feature">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
					Single transaction
				</div>
				<div class="register-feature">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
					No middleman
				</div>
			</div>
		</div>
		` : ''}

		<div class="card" id="queue-card">
			<div class="collapsible-header" id="queue-header">
				<div class="section-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
					Registration Queue
				</div>
				<div class="collapsible-toggle" id="queue-toggle">
					<span>Advanced</span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
				</div>
			</div>
			<div class="collapsible-content" id="queue-content">
			<p class="instructions" style="margin-top: 12px; margin-bottom: 16px;">Queue a bid or attach offline-signed registrations for automatic relay when the name becomes available.</p>
			<div class="stat-grid" id="queue-stats">
				<div class="stat">
					<div class="stat-label">Active Bids</div>
					<div class="stat-value" id="stat-count">0</div>
				</div>
				<div class="stat">
					<div class="stat-label">Highest Bid (SUI)</div>
					<div class="stat-value" id="stat-high">0</div>
				</div>
				<div class="stat">
					<div class="stat-label">Earliest Execute</div>
					<div class="stat-value" id="stat-soon">—</div>
				</div>
				<div class="stat">
					<div class="stat-label">Auto Relays</div>
					<div class="stat-value" id="stat-auto">0</div>
				</div>
			</div>
			<div class="bid-list" id="bid-list">
				<ul>
					<li style="text-align:center;color:var(--muted);">No queued bids yet.</li>
				</ul>
			</div>
			<div class="form" id="queue-form">
				<div>
					<label for="bidder-input">Bidder Address</label>
					<input id="bidder-input" type="text" placeholder="0x..." autocomplete="off" spellcheck="false" />
				</div>
				<div style="display:flex; gap:12px; flex-wrap:wrap;">
					<div style="flex:1; min-width:160px;">
						<label for="amount-input">Bid Amount (SUI)</label>
						<input id="amount-input" type="number" min="0.1" step="0.1" value="1.0" />
					</div>
					<div style="flex:1; min-width:160px;">
						<label for="execute-input">Execute On</label>
						<input id="execute-input" type="datetime-local" value="${defaultExec}" />
					</div>
				</div>
				<label class="attach-toggle">
					<input type="checkbox" id="attach-offline-toggle" />
					<span>Attach offline-signed registration transaction for automatic relay</span>
				</label>
				<div class="offline-attachment" id="offline-attachment">
					<div>
						<label for="offline-tx-bytes">Transaction Bytes (base64)</label>
						<textarea id="offline-tx-bytes" placeholder="AAACAA..."></textarea>
					</div>
					<div>
						<label for="offline-tx-signatures">Signatures (newline or comma separated)</label>
						<textarea id="offline-tx-signatures" placeholder="AAQw..."></textarea>
					</div>
					<p class="instructions" style="margin-bottom:0;">Encrypted at rest and relayed automatically once the execution window opens.</p>
				</div>
				<button class="primary-btn" id="queue-submit">Queue Bid</button>
				<div class="status-line" id="queue-status"></div>
			</div>
			</div><!-- end collapsible-content -->
		</div>

		<div class="card">
			<div class="collapsible-header" id="relay-header">
				<div class="section-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"></path></svg>
					Offline Transaction Relay
				</div>
				<div class="collapsible-toggle" id="relay-toggle">
					<span>Advanced</span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
				</div>
			</div>
			<div class="collapsible-content" id="relay-content">
			<p class="instructions" style="margin-top: 12px;">Bring your own signed Sui transaction block (for example, produced via <code>sui client</code> or an air-gapped wallet). sui.ski forwards the signed payload immediately.</p>
			<ol class="instructions">
				<li>Prepare a SuiNS registration transaction offline (choose package, calculate price, build tx bytes).</li>
				<li>Sign the transaction bytes with every required signer.</li>
				<li>Paste the base64-encoded transaction bytes and signatures below, then relay via sui.ski.</li>
			</ol>
			<div class="form" id="tx-form">
				<div>
					<label for="tx-bytes">Transaction Bytes (base64)</label>
					<textarea id="tx-bytes" placeholder="AAACAA..."></textarea>
				</div>
				<div>
					<label for="tx-signatures">Signatures (newline or comma separated)</label>
					<textarea id="tx-signatures" placeholder="AAQw..."></textarea>
				</div>
				<button class="primary-btn" id="tx-submit">Relay Signed Transaction</button>
				<div class="status-line" id="tx-status"></div>
				<pre id="tx-result" style="display:none;"></pre>
			</div>
			</div><!-- end collapsible-content -->
		</div>
	</div>

	<script type="module">
		import { getWallets } from 'https://esm.sh/@mysten/wallet-standard@0.19.9';
		import { SuiClient } from 'https://esm.sh/@mysten/sui@1.45.2/client';
		import { Transaction } from 'https://esm.sh/@mysten/sui@1.45.2/transactions';
		import { SuinsClient, SuinsTransaction } from 'https://esm.sh/@mysten/suins@0.9.13';

		const NAME = ${serializeJson(cleanName)};
		const NETWORK = ${serializeJson(network)};
		const CAN_REGISTER = ${isRegisterable ? 'true' : 'false'};
		const RPC_URL = ${serializeJson(env.SUI_RPC_URL)};
		const NAME_LENGTH = NAME.length;

		// ========== PRICING ==========
		let pricingData = null;
		let currentPrice = 0;
		const registerPriceEl = document.getElementById('register-price');

		// Use SuiNS SDK to get accurate pricing
		async function fetchPricingFromSDK() {
			try {
				const client = new SuiClient({ url: RPC_URL });
				const suinsClient = new SuinsClient({ client, network: NETWORK });
				const domain = NAME + '.sui';

				// Get price for 1 year registration using the SDK
				const priceInMist = await suinsClient.calculatePrice({
					domain,
					years: 1
				});

				currentPrice = Number(priceInMist) / 1e9;
				console.log('SuiNS SDK price for', domain, ':', currentPrice, 'SUI');

				if (registerPriceEl) {
					registerPriceEl.textContent = currentPrice.toFixed(2) + ' SUI';
				}
				updateRegisterButton();
			} catch (e) {
				console.error('Failed to fetch pricing from SDK:', e);
				// Fallback to API
				try {
					const res = await fetch('/api/pricing');
					pricingData = await res.json();
					console.log('Pricing API response:', pricingData);
					currentPrice = getPriceForLength(NAME_LENGTH);
					if (registerPriceEl) {
						registerPriceEl.textContent = currentPrice.toFixed(2) + ' SUI';
					}
					updateRegisterButton();
				} catch (e2) {
					console.error('Fallback pricing also failed:', e2);
					if (registerPriceEl) {
						registerPriceEl.textContent = '-- SUI';
					}
				}
			}
		}

		function getPriceForLength(length) {
			if (!pricingData) return 0;
			// Check exact length first
			if (pricingData[String(length)]) {
				return Number(pricingData[String(length)]) / 1e9;
			}
			// Check ranges
			for (const [key, value] of Object.entries(pricingData)) {
				if (key.includes('-')) {
					const [min, max] = key.split('-').map(Number);
					if (length >= min && length <= max) {
						return Number(value) / 1e9;
					}
				}
			}
			// Default for 5+ char names: 2 SUI (2e9 MIST)
			return 2;
		}

		// Fetch pricing immediately
		fetchPricingFromSDK();

		// ========== WALLET CONNECTION ==========
		const globalWalletWidget = document.getElementById('global-wallet-widget');
		const globalWalletBtn = document.getElementById('global-wallet-btn');
		const globalWalletText = document.getElementById('global-wallet-text');
		const globalWalletDropdown = document.getElementById('global-wallet-dropdown');
		const walletModal = document.getElementById('wallet-modal');
		const walletModalClose = document.getElementById('wallet-modal-close');
		const walletList = document.getElementById('wallet-list');
		const registerBtn = document.getElementById('register-btn');
		const registerBtnText = document.getElementById('register-btn-text');
		const registerStatus = document.getElementById('register-status');

		let connectedWallet = null;
		let connectedAccount = null;
		let connectedAddress = null;

		// Wallet Standard API (proper implementation)
		let walletsApi = null;
		try {
			walletsApi = getWallets();
		} catch (e) {
			console.error('Failed to init wallet API:', e);
		}

		function getSuiWallets() {
			const wallets = [];
			const seenNames = new Set();

			// First, try wallet-standard registry
			if (walletsApi) {
				try {
					const standardWallets = walletsApi.get();
					for (const wallet of standardWallets) {
						if (wallet.chains?.some(chain => chain.startsWith('sui:'))) {
							wallets.push(wallet);
							seenNames.add(wallet.name);
						}
					}
				} catch (e) {
					console.log('Error getting wallets from standard:', e);
				}
			}

			// Fallback: check window globals for common Sui wallets
			const windowWallets = [
				{ check: () => window.phantom?.sui, name: 'Phantom', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNTM0QkI1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNTUxQkY5Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9InVybCgjYSkiIHJ4PSIyNCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMTAuNCw2NC4xYy0uMy0xNS44LTEyLjQtMjguMi0yNy4zLTI4LjVIMjcuNmMtMy4yLDAtNS44LDIuNi01LjgsNS44djg1LjRjMCwxLjQuNCwyLjguNiw0LjIuMi40LjQsLjguNSwxLjNsMCwwYy4xLjMuMi43LjQsMS4xLjIuNS41LDEsLjgsMS41LjMuNi43LDEuMSwxLjEsMS43bDAsMGMuNS43LDEuMSwxLjMsMS43LDEuOWwwLDBjLjcuNywxLjUsMS4zLDIuMywxLjhsLjEuMWMuOC41LDEuNiwuOSwyLjUsMS4yLjMuMS42LjIuOS4zaDBoMC4xYy42LjIsMS4yLjMsMS44LjRoMGMuMSwwLC4yLDAsLjMsMCwuNS4xLDEuMS4xLDEuNi4xaDYxLjljMy4yLDAsNS44LTIuNiw1LjgtNS44VjY0LjFoMFoiLz48L3N2Zz4=' },
				{ check: () => window.suiWallet, name: 'Sui Wallet', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiM2RkJDRjAiIHJ4PSI4Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTI4LjYsMTUuM2MtLjktMy4yLTQuNi01LjUtOS4yLTUuNXMtOC4zLDIuMy05LjIsNS41Yy0uMi44LS4zLDEuNi0uMywyLjRzLjEsMS43LjMsMi41Yy45LDMuMiw0LjYsNS41LDkuMiw1LjVzOC4zLTIuMyw5LjItNS41Yy4yLS44LjMtMS42LjMtMi41cy0uMS0xLjYtLjMtMi40WiIvPjxwYXRoIGZpbGw9IiM2RkJDRjAiIGQ9Ik0xOS40LDE0LjVjLTIuNCwwLTQuMywxLjQtNC4zLDMuMXMxLjksMy4xLDQuMywzLjEsNC4zLTEuNCw0LjMtMy4xLTEuOS0zLjEtNC4zLTMuMVoiLz48L3N2Zz4=' },
			];

			for (const wc of windowWallets) {
				try {
					const wallet = wc.check();
					if (wallet && !seenNames.has(wc.name)) {
						// Wrap window wallet to match wallet-standard interface
						wallets.push({
							name: wc.name,
							icon: wallet.icon || wc.icon,
							chains: ['sui:mainnet', 'sui:testnet'],
							features: wallet.features || {
								'standard:connect': wallet.connect ? { connect: wallet.connect.bind(wallet) } : undefined,
								'sui:signAndExecuteTransaction': wallet.signAndExecuteTransaction
									? { signAndExecuteTransaction: wallet.signAndExecuteTransaction.bind(wallet) }
									: undefined,
							},
							accounts: wallet.accounts || [],
							_rawWallet: wallet,
						});
						seenNames.add(wc.name);
					}
				} catch (e) {
					console.log('Error checking window wallet:', e);
				}
			}

			return wallets;
		}

		async function detectWallets() {
			// Give wallets a moment to register
			await new Promise(r => setTimeout(r, 100));
			let wallets = getSuiWallets();
			if (wallets.length > 0) return wallets;

			// Wait a bit more for slow wallets
			await new Promise(r => setTimeout(r, 500));
			wallets = getSuiWallets();
			if (wallets.length > 0) return wallets;

			// Final attempt
			await new Promise(r => setTimeout(r, 1000));
			return getSuiWallets();
		}

		function renderWalletList(wallets) {
			if (wallets.length === 0) {
				walletList.innerHTML = '<div class="wallet-detecting">' +
					'No Sui wallets detected.' +
					'<br><br>' +
					'<a href="https://phantom.app/download" target="_blank" style="color: var(--accent);">Install Phantom →</a>' +
					'<br>' +
					'<a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank" style="color: var(--accent);">Install Sui Wallet →</a>' +
					'</div>';
				return;
			}

			walletList.innerHTML = wallets.map(wallet => {
				const icon = wallet.icon || '';
				const name = wallet.name || 'Unknown Wallet';
				return '<button class="wallet-option" data-wallet-name="' + escapeHtml(name) + '">' +
					(icon ? '<img src="' + escapeHtml(icon) + '" alt="">' : '') +
					'<span>' + escapeHtml(name) + '</span>' +
					'</button>';
			}).join('');

			walletList.querySelectorAll('.wallet-option').forEach((btn, i) => {
				btn.addEventListener('click', () => selectWallet(wallets[i]));
			});
		}

		async function selectWallet(wallet) {
			try {
				walletList.innerHTML = '<div class="wallet-detecting"><span class="loading"></span> Connecting...</div>';

				const connectFeature = wallet.features?.['standard:connect'] || wallet.connect;
				if (!connectFeature) throw new Error('Wallet does not support connect');

				let accounts;
				if (typeof connectFeature === 'function') {
					const result = await connectFeature();
					accounts = result?.accounts || result;
				} else if (typeof connectFeature.connect === 'function') {
					const result = await connectFeature.connect();
					accounts = result?.accounts || result;
				}

				if (!accounts || accounts.length === 0) {
					throw new Error('No accounts returned');
				}

				connectedWallet = wallet;
				connectedAccount = accounts[0];
				connectedAddress = accounts[0].address;

				walletModal.classList.remove('open');
				updateWalletUI();
				updateRegisterButton();

			} catch (error) {
				console.error('Wallet connection failed:', error);
				walletList.innerHTML = '<div class="wallet-detecting" style="color: var(--error);">' +
					'Connection failed: ' + escapeHtml(error.message) +
					'<br><br><button class="secondary-btn" onclick="location.reload()">Try Again</button></div>';
			}
		}

		function disconnectWallet() {
			connectedWallet = null;
			connectedAccount = null;
			connectedAddress = null;
			updateWalletUI();
			updateRegisterButton();
		}

		function updateWalletUI() {
			if (!connectedAddress) {
				globalWalletBtn.classList.remove('connected');
				globalWalletText.textContent = 'Connect';
				globalWalletDropdown.innerHTML = '';
			} else {
				const shortAddr = connectedAddress.slice(0, 8) + '...' + connectedAddress.slice(-6);
				globalWalletBtn.classList.add('connected');
				globalWalletText.textContent = shortAddr;
				globalWalletDropdown.innerHTML =
					'<div class="global-wallet-dropdown-addr">' + connectedAddress + '</div>' +
					'<button class="global-wallet-dropdown-item" id="gw-switch">' +
						'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>' +
						'Switch Wallet' +
					'</button>' +
					'<button class="global-wallet-dropdown-item disconnect" id="gw-disconnect">' +
						'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>' +
						'Disconnect' +
					'</button>';

				document.getElementById('gw-switch')?.addEventListener('click', () => {
					globalWalletWidget.classList.remove('open');
					disconnectWallet();
					setTimeout(() => openWalletModal(), 100);
				});
				document.getElementById('gw-disconnect')?.addEventListener('click', () => {
					globalWalletWidget.classList.remove('open');
					disconnectWallet();
				});
			}
		}

		function updateRegisterButton() {
			if (!registerBtn || !registerBtnText) return;
			if (connectedAddress) {
				const priceText = currentPrice > 0 ? currentPrice + ' SUI' : '...';
				registerBtnText.textContent = 'Register ' + NAME + '.sui for ' + priceText;
				registerBtn.querySelector('svg').innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
			} else {
				registerBtnText.textContent = 'Connect Wallet to Register';
				registerBtn.querySelector('svg').innerHTML = '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>';
			}
		}

		function openWalletModal() {
			walletModal.classList.add('open');
			walletList.innerHTML = '<div class="wallet-detecting"><span class="loading"></span> Detecting wallets...</div>';
			detectWallets().then(renderWalletList);
		}

		function showRegisterStatus(message, type = 'info') {
			if (!registerStatus) return;
			registerStatus.textContent = message;
			registerStatus.className = 'register-status show ' + type;
		}

		function hideRegisterStatus() {
			if (registerStatus) registerStatus.className = 'register-status';
		}

		// ========== REGISTRATION ==========
		async function registerName() {
			if (!connectedAddress || !connectedWallet) {
				openWalletModal();
				return;
			}

			if (currentPrice <= 0) {
				showRegisterStatus('Loading pricing...', 'info');
				await fetchPricingFromSDK();
				if (currentPrice <= 0) {
					showRegisterStatus('Failed to load pricing. Please refresh.', 'error');
					return;
				}
			}

			registerBtn.disabled = true;
			registerBtnText.textContent = 'Building transaction...';
			hideRegisterStatus();

			try {
				showRegisterStatus('Connecting to Sui network...', 'info');

				const suiClient = new SuiClient({ url: RPC_URL });
				const suinsClient = new SuinsClient({ client: suiClient, network: NETWORK });

				const tx = new Transaction();
				const suinsTx = new SuinsTransaction(suinsClient, tx);

				const coinConfig = suinsClient.config.coins.SUI;
				if (!coinConfig) throw new Error('SuiNS coin config not found');

				const domain = NAME + '.sui';
				// Add a small buffer (1%) for any rounding or fee changes
				const priceWithBuffer = Math.ceil(currentPrice * 1.01 * 1_000_000_000);

				showRegisterStatus('Building registration transaction...', 'info');

				// Get price info object ID (required for SUI/NS coin types)
				const priceInfoObjectId = coinConfig.feed
					? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
					: undefined;

				// Split coin for payment (SDK will use exact amount needed)
				const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceWithBuffer)]);

				// Register the name - SDK handles exact pricing
				const nft = suinsTx.register({
					domain: domain,
					years: 1,
					coinConfig: coinConfig,
					coin: paymentCoin,
					priceInfoObjectId: priceInfoObjectId,
				});

				// Set target address and transfer NFT to sender
				suinsTx.setTargetAddress({
					nft: nft,
					address: connectedAddress,
					isSubname: false,
				});
				tx.transferObjects([nft], connectedAddress);

				tx.setGasBudget(100_000_000); // 0.1 SUI

				registerBtnText.textContent = 'Approve in wallet...';
				showRegisterStatus('Please approve the transaction in your wallet', 'info');

				// Sign and execute
				const signFeature = connectedWallet.features?.['sui:signAndExecuteTransaction']
					|| connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

				if (!signFeature) {
					throw new Error('Wallet does not support transaction signing');
				}

				const result = await signFeature.signAndExecuteTransaction({
					transaction: tx,
					account: connectedAccount,
					chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
				});

				registerBtnText.textContent = 'Confirming...';
				showRegisterStatus('Waiting for confirmation...', 'info');

				if (result.digest) {
					await suiClient.waitForTransaction({ digest: result.digest });

					showRegisterStatus('Success! ' + NAME + '.sui is now yours. Redirecting...', 'success');
					registerBtnText.textContent = 'Registered!';

					// Redirect to profile page
					setTimeout(() => {
						window.location.href = 'https://' + NAME + '.sui.ski';
					}, 2000);
				}

			} catch (error) {
				console.error('Registration failed:', error);

				if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
					showRegisterStatus('Transaction cancelled', 'error');
				} else if (error.message?.includes('Insufficient')) {
					showRegisterStatus('Insufficient SUI balance. You need ' + currentPrice + ' SUI plus gas.', 'error');
				} else {
					showRegisterStatus('Failed: ' + (error.message || 'Unknown error'), 'error');
				}

				registerBtn.disabled = false;
				updateRegisterButton();
			}
		}

		// Event listeners
		if (globalWalletBtn) {
			globalWalletBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				if (!connectedAddress) {
					openWalletModal();
				} else {
					globalWalletWidget.classList.toggle('open');
				}
			});
		}

		if (walletModalClose) {
			walletModalClose.addEventListener('click', () => walletModal.classList.remove('open'));
		}

		if (walletModal) {
			walletModal.addEventListener('click', (e) => {
				if (e.target === walletModal) walletModal.classList.remove('open');
			});
		}

		document.addEventListener('click', (e) => {
			if (globalWalletWidget && !globalWalletWidget.contains(e.target)) {
				globalWalletWidget.classList.remove('open');
			}
		});

		if (registerBtn) {
			registerBtn.addEventListener('click', registerName);
		}

		// Initialize
		updateWalletUI();
		updateRegisterButton();

		// ========== COLLAPSIBLE SECTIONS ==========
		function setupCollapsible(headerId, toggleId, contentId) {
			const header = document.getElementById(headerId);
			const toggle = document.getElementById(toggleId);
			const content = document.getElementById(contentId);
			if (!header || !toggle || !content) return;

			header.addEventListener('click', () => {
				const isOpen = content.classList.contains('open');
				if (isOpen) {
					content.classList.remove('open');
					toggle.classList.remove('open');
				} else {
					content.classList.add('open');
					toggle.classList.add('open');
				}
			});
		}

		setupCollapsible('queue-header', 'queue-toggle', 'queue-content');
		setupCollapsible('relay-header', 'relay-toggle', 'relay-content');

		// ========== BID QUEUE ==========
		const bidListEl = document.getElementById('bid-list');
		const statCount = document.getElementById('stat-count');
		const statHigh = document.getElementById('stat-high');
		const statSoon = document.getElementById('stat-soon');
		const statAuto = document.getElementById('stat-auto');
		const queueStatus = document.getElementById('queue-status');
		const queueSubmit = document.getElementById('queue-submit');
		const bidderInput = document.getElementById('bidder-input');
		const amountInput = document.getElementById('amount-input');
		const executeInput = document.getElementById('execute-input');
		const attachToggle = document.getElementById('attach-offline-toggle');
		const offlineAttachment = document.getElementById('offline-attachment');
		const offlineTxBytesInput = document.getElementById('offline-tx-bytes');
		const offlineTxSignaturesInput = document.getElementById('offline-tx-signatures');

		const txStatus = document.getElementById('tx-status');
		const txResult = document.getElementById('tx-result');
		const txSubmit = document.getElementById('tx-submit');
		const txBytesInput = document.getElementById('tx-bytes');
		const txSignaturesInput = document.getElementById('tx-signatures');

		if (attachToggle && offlineAttachment) {
			attachToggle.addEventListener('change', () => {
				offlineAttachment.style.display = attachToggle.checked ? 'flex' : 'none';
			});
		}

		function setQueueStatus(message, type = 'info') {
			queueStatus.textContent = message || '';
			queueStatus.className = 'status-line ' + type;
		}

		function setTxStatus(message, type = 'info') {
			txStatus.textContent = message || '';
			txStatus.className = 'status-line ' + type;
		}

		async function loadBids() {
			try {
				const res = await fetch('/api/bids/' + NAME);
				if (!res.ok) throw new Error('Request failed');
				const data = await res.json();
				const bids = Array.isArray(data.bids) ? data.bids : [];
				renderBidStats(bids);
				renderBidList(bids);
			} catch (error) {
				console.error('Failed to load bids:', error);
				setQueueStatus('Unable to load queued bids right now.', 'error');
			}
		}

		function renderBidStats(bids) {
			statCount.textContent = String(bids.length);
			if (bids.length === 0) {
				statHigh.textContent = '0';
				statSoon.textContent = '—';
				if (statAuto) statAuto.textContent = '0';
				return;
			}
			const highest = bids.reduce((max, bid) => Math.max(max, Number(bid.amount) || 0), 0);
			statHigh.textContent = highest.toFixed(2);
			const soonest = bids.reduce((min, bid) => {
				const when = Number(bid.executeAt);
				return when && when < min ? when : min;
			}, Number.MAX_SAFE_INTEGER);
			statSoon.textContent = soonest === Number.MAX_SAFE_INTEGER ? '—' : formatDate(soonest);
			if (statAuto) {
				const autoCount = bids.filter(bid => bid.autoRelay).length;
				statAuto.textContent = String(autoCount);
			}
		}

		const HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

		function escapeHtml(value) {
			return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE[char] || char);
		}

		function renderBidList(bids) {
			if (bids.length === 0) {
				bidListEl.innerHTML = '<ul><li style="text-align:center;color:var(--muted);">No queued bids yet.</li></ul>';
				return;
			}
			const items = bids
				.slice()
				.sort((a, b) => Number(b.amount) - Number(a.amount))
				.slice(0, 10)
				.map((bid) => {
					const shortAddr = formatBidder(bid.bidder);
					const amt = Number(bid.amount).toFixed(2);
					const eta = formatDate(Number(bid.executeAt));
					const chips = [];
					if (bid.autoRelay) {
						chips.push('<span class="status-chip auto">Auto Relay</span>');
					}
					const statusLabel = formatBidStatusLabel(bid);
					if (statusLabel) {
						const statusClass = (bid.status || '').toLowerCase();
						chips.push('<span class="status-chip ' + statusClass + '">' + escapeHtml(statusLabel) + '</span>');
					}
					if (bid.resultDigest) {
						chips.push('<span class="digest-chip">' + escapeHtml(shortDigest(bid.resultDigest)) + '</span>');
					}
					if (bid.lastError && bid.status === 'failed') {
						chips.push('<span class="status-chip failed">' + escapeHtml(limitText(bid.lastError, 40)) + '</span>');
					}
					const metaRow = chips.length ? '<div class="bid-meta">' + chips.join('') + '</div>' : '';
					let row = '<li>';
					row += '<div class="bid-main">';
					row += '<span>' + escapeHtml(shortAddr) + '</span>';
					row += '<span>' + escapeHtml(amt) + ' SUI</span>';
					row += '<span>' + escapeHtml(eta) + '</span>';
					row += '</div>';
					row += metaRow;
					row += '</li>';
					return row;
				})
				.join('');
			bidListEl.innerHTML = '<ul>' + items + '</ul>';
		}

		function formatDate(value) {
			if (!value || Number.isNaN(value)) return '—';
			try {
				const date = new Date(Number(value));
				return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
			} catch {
				return '—';
			}
		}

		function formatBidder(value) {
			const str = String(value || '');
			return str.length > 12 ? str.slice(0, 8) + '…' + str.slice(-4) : str;
		}

		function formatBidStatusLabel(bid) {
			switch (bid.status) {
				case 'submitting':
					return 'Relaying…';
				case 'submitted':
					return 'Submitted';
				case 'failed':
					return 'Retry soon';
				case 'queued':
					return bid.autoRelay ? 'Auto-ready' : 'Queued';
				default:
					return bid.autoRelay ? 'Auto-ready' : '';
			}
		}

		function shortDigest(value) {
			const str = String(value || '');
			return str.length > 12 ? str.slice(0, 6) + '…' + str.slice(-4) : str;
		}

		function limitText(value, max) {
			const str = String(value || '');
			return str.length <= max ? str : str.slice(0, max - 1) + '…';
		}

		function parseExecuteAt(inputValue) {
			if (!inputValue) return Date.now() + 60 * 60 * 1000;
			const parsed = Date.parse(inputValue);
			return Number.isNaN(parsed) ? Date.now() + 60 * 60 * 1000 : parsed;
		}

		async function submitBid(event) {
			event.preventDefault();
			if (!CAN_REGISTER) {
				setQueueStatus('Names shorter than 3 characters cannot be registered.', 'error');
				return;
			}
			const bidder = bidderInput.value.trim();
			const amount = Number(amountInput.value);
			const executeAt = parseExecuteAt(executeInput.value);

			if (!bidder || !bidder.startsWith('0x')) {
				setQueueStatus('Enter a valid Sui address for the bidder.', 'error');
				return;
			}
			if (!amount || amount <= 0) {
				setQueueStatus('Enter a positive bid amount.', 'error');
			 return;
			}
			if (executeAt <= Date.now()) {
				setQueueStatus('Execution time must be in the future.', 'error');
				return;
			}

			let txBytes = '';
			let txSignatures = [];
			if (attachToggle?.checked) {
				txBytes = offlineTxBytesInput?.value.trim() || '';
				txSignatures = (offlineTxSignaturesInput?.value || '')
					.split(/[,\\n]+/)
					.map((entry) => entry.trim())
					.filter(Boolean);
				if (!txBytes) {
					setQueueStatus('Provide transaction bytes or disable the attachment toggle.', 'error');
					return;
				}
				if (txSignatures.length === 0) {
					setQueueStatus('Provide signatures for the offline attachment.', 'error');
					return;
				}
			}

			queueSubmit.disabled = true;
			setQueueStatus('Submitting bid...', 'info');

			try {
				const payload = { name: NAME, bidder, amount, executeAt };
				if (txBytes) payload.txBytes = txBytes;
				if (txSignatures.length) payload.signatures = txSignatures;

				const res = await fetch('/api/bids', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.error || 'Queue failed');
				}
				setQueueStatus('Bid queued successfully.', 'success');
				if (attachToggle) {
					attachToggle.checked = false;
					if (offlineAttachment) offlineAttachment.style.display = 'none';
				}
				if (offlineTxBytesInput) offlineTxBytesInput.value = '';
				if (offlineTxSignaturesInput) offlineTxSignaturesInput.value = '';
				await loadBids();
			} catch (error) {
				setQueueStatus(error.message || 'Failed to queue bid.', 'error');
			} finally {
				queueSubmit.disabled = false;
			}
		}

		async function relayTransaction(event) {
			event.preventDefault();
			const txBytes = txBytesInput.value.trim();
			const signatures = txSignaturesInput.value
				.split(/[,\\n]+/)
				.map((s) => s.trim())
				.filter(Boolean);

			if (!txBytes) {
				setTxStatus('Provide base64-encoded transaction bytes.', 'error');
				return;
			}
			if (signatures.length === 0) {
				setTxStatus('Provide at least one signature.', 'error');
				return;
			}

			txSubmit.disabled = true;
			setTxStatus('Relaying signed transaction...', 'info');
			txResult.style.display = 'none';

			try {
				const res = await fetch('/api/register/submit', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ txBytes, signatures }),
				});

				const data = await res.json().catch(() => ({}));
				if (!res.ok || data.error) {
					const message = data.error?.message || data.error || 'Relay failed';
					throw new Error(message);
				}

				txResult.textContent = JSON.stringify(data, null, 2);
				txResult.style.display = 'block';
				setTxStatus('Transaction submitted to Sui RPC.', 'success');
			} catch (error) {
				setTxStatus(error.message || 'Failed to relay transaction.', 'error');
			} finally {
				txSubmit.disabled = false;
			}
		}

		loadBids();
		setInterval(loadBids, 60_000);
		document.getElementById('queue-form').addEventListener('submit', submitBid);
		document.getElementById('tx-form').addEventListener('submit', relayTransaction);
	</script>
</body>
</html>`
}

export async function handleRegistrationSubmission(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405, CORS_HEADERS)
	}

	let payload: {
		txBytes?: string
		signatures?: unknown
		options?: Record<string, unknown>
		requestType?: string
	}
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	const txBytes = typeof payload.txBytes === 'string' ? payload.txBytes.trim() : ''
	const rawSignatures = Array.isArray(payload.signatures) ? payload.signatures : []
	const signatures = rawSignatures
		.filter((sig): sig is string => typeof sig === 'string' && sig.trim().length > 0)
		.map((sig) => sig.trim())

	if (!txBytes) {
		return jsonResponse({ error: 'txBytes is required' }, 400, CORS_HEADERS)
	}
	if (signatures.length === 0) {
		return jsonResponse({ error: 'At least one signature is required' }, 400, CORS_HEADERS)
	}

	const relay = await relaySignedTransaction(
		env,
		txBytes,
		signatures,
		(payload.options as Record<string, unknown>) || {},
		payload.requestType || 'WaitForLocalExecution',
	)
	const status = relay.ok ? 200 : relay.status || 502
	const body =
		typeof relay.response === 'undefined'
			? relay.ok
				? { ok: true }
				: { error: relay.error || 'Relay failed' }
			: relay.response

	// Ensure error message is surfaced even if RPC response omits details
	if (!relay.ok && relay.error && body && typeof body === 'object' && !('error' in body)) {
		Object.assign(body as Record<string, unknown>, { error: relay.error })
	}

	return jsonResponse(body, status, CORS_HEADERS)
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => {
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
}
