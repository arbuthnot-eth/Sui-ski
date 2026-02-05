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
			padding: 16px;
			border-radius: 12px;
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
			background: rgba(52, 211, 153, 0.08);
			border: 1px solid rgba(52, 211, 153, 0.25);
			color: var(--text);
		}
		.register-status.error {
			background: rgba(248, 113, 113, 0.1);
			border: 1px solid rgba(248, 113, 113, 0.2);
			color: var(--error);
		}

		/* Transaction Preview Modal */
		.tx-preview-modal {
			display: none;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.8);
			backdrop-filter: blur(8px);
			z-index: 10001;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.tx-preview-modal.open { display: flex; }
		.tx-preview-content {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 20px;
			max-width: 420px;
			width: 100%;
			overflow: hidden;
		}
		.tx-preview-header {
			padding: 20px;
			border-bottom: 1px solid var(--border);
			text-align: center;
		}
		.tx-preview-header h3 {
			font-size: 1.2rem;
			margin-bottom: 4px;
		}
		.tx-preview-header p {
			color: var(--muted);
			font-size: 0.85rem;
		}
		.tx-preview-body {
			padding: 20px;
		}
		.tx-action {
			display: flex;
			align-items: flex-start;
			gap: 12px;
			padding: 12px;
			background: rgba(255, 255, 255, 0.03);
			border-radius: 12px;
			margin-bottom: 12px;
		}
		.tx-action-icon {
			width: 36px;
			height: 36px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}
		.tx-action-icon.swap { background: rgba(96, 165, 250, 0.15); color: var(--accent); }
		.tx-action-icon.register { background: rgba(52, 211, 153, 0.15); color: var(--success); }
		.tx-action-icon.receive { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
		.tx-action-icon svg { width: 18px; height: 18px; }
		.tx-action-details h4 {
			font-size: 0.95rem;
			font-weight: 600;
			margin-bottom: 2px;
		}
		.tx-action-details p {
			font-size: 0.8rem;
			color: var(--muted);
		}
		.tx-action-details code {
			background: rgba(255, 255, 255, 0.08);
			padding: 2px 6px;
			border-radius: 4px;
			font-size: 0.75rem;
		}
		.tx-summary {
			background: rgba(0, 0, 0, 0.3);
			border-radius: 12px;
			padding: 14px;
			margin-top: 16px;
		}
		.tx-summary-row {
			display: flex;
			justify-content: space-between;
			padding: 6px 0;
			font-size: 0.85rem;
		}
		.tx-summary-row .label { color: var(--muted); }
		.tx-summary-row .value { font-family: ui-monospace, monospace; font-weight: 600; }
		.tx-summary-row.total { border-top: 1px solid var(--border); margin-top: 8px; padding-top: 10px; }
		.tx-summary-row.total .value { color: var(--success); font-size: 1rem; }
		.tx-preview-footer {
			padding: 16px 20px;
			border-top: 1px solid var(--border);
			display: flex;
			gap: 12px;
		}
		.tx-preview-footer button {
			flex: 1;
			padding: 14px;
			border-radius: 12px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.tx-cancel-btn {
			background: transparent;
			border: 1px solid var(--border);
			color: var(--muted);
		}
		.tx-cancel-btn:hover { border-color: var(--text); color: var(--text); }
		.tx-confirm-btn {
			background: linear-gradient(135deg, #10b981, #3b82f6);
			border: none;
			color: white;
		}
		.tx-confirm-btn:hover { transform: translateY(-1px); }
		.tx-confirm-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
		.tx-error {
			background: rgba(248, 113, 113, 0.1);
			border: 1px solid rgba(248, 113, 113, 0.2);
			border-radius: 10px;
			padding: 12px;
			color: var(--error);
			font-size: 0.85rem;
			margin-top: 12px;
		}
		.tx-error code {
			display: block;
			margin-top: 8px;
			font-size: 0.75rem;
			opacity: 0.8;
			word-break: break-all;
		}
		.tx-gas-estimate {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			color: var(--muted);
			margin-top: 8px;
		}
		.tx-gas-estimate svg { width: 14px; height: 14px; }

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

		/* Savings Banner */
		.savings-banner {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			padding: 12px 16px;
			background: linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(96, 165, 250, 0.08));
			border: 1px solid rgba(52, 211, 153, 0.25);
			border-radius: 12px;
			margin-bottom: 16px;
			font-size: 0.9rem;
			color: var(--text);
		}
		.savings-banner svg {
			color: var(--success);
			flex-shrink: 0;
		}
		.savings-banner strong {
			color: var(--success);
		}
		.strikethrough {
			text-decoration: line-through;
			opacity: 0.6;
		}

		/* Price Breakdown */
		.price-breakdown {
			background: rgba(0, 0, 0, 0.2);
			border-radius: 12px;
			padding: 16px;
			margin: 12px 0 16px;
		}
		.price-row {
			display: flex;
			justify-content: space-between;
			padding: 6px 0;
			font-size: 0.9rem;
		}
		.price-row .price-label {
			color: var(--muted);
		}
		.price-row .price-value {
			font-family: ui-monospace, monospace;
			font-weight: 600;
		}
		.price-row.premium .price-value {
			color: var(--warning);
		}
		.price-row.discount .price-value {
			color: var(--success);
		}
		.price-row.total {
			border-top: 1px solid var(--border);
			margin-top: 8px;
			padding-top: 12px;
			font-weight: 700;
			font-size: 1rem;
		}
		.price-row.total .price-value {
			font-size: 1.1rem;
		}

		/* NS Rate Info */
		.ns-rate-info {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 8px 12px;
			background: rgba(77, 162, 255, 0.08);
			border: 1px solid rgba(77, 162, 255, 0.15);
			border-radius: 8px;
			margin-bottom: 16px;
			font-size: 0.8rem;
		}
		.ns-rate-label {
			color: var(--muted);
		}
		.ns-rate-value {
			color: #4DA2FF;
			font-weight: 600;
			font-family: ui-monospace, monospace;
		}
		.ns-rate-source {
			color: var(--muted);
			font-size: 0.75rem;
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

	<!-- Transaction Preview Modal -->
	<div class="tx-preview-modal" id="tx-preview-modal">
		<div class="tx-preview-content">
			<div class="tx-preview-header">
				<h3>Confirm Transaction</h3>
				<p id="tx-preview-subtitle">Review before signing</p>
			</div>
			<div class="tx-preview-body">
				<div class="tx-action" id="tx-swap-row" style="display: none;">
					<div class="tx-action-icon swap">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/></svg>
					</div>
					<div class="tx-action-details">
						<h4>Swap SUI → NS</h4>
						<p>Via DeepBook DEX • <span id="tx-swap-amount">-- SUI</span> → <span id="tx-ns-amount">-- NS</span></p>
					</div>
				</div>
				<div class="tx-action" id="tx-pay-row">
					<div class="tx-action-icon register">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
					</div>
					<div class="tx-action-details">
						<h4>Register <span id="tx-domain-name">name</span>.sui</h4>
						<p>Pay <span id="tx-payment-amount">-- SUI</span> • 1 year via SuiNS</p>
					</div>
				</div>
				<div class="tx-action">
					<div class="tx-action-icon receive">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
					</div>
					<div class="tx-action-details">
						<h4>Receive SuiNS NFT</h4>
						<p>Sent to <code id="tx-recipient">0x...</code></p>
					</div>
				</div>
				<div class="tx-summary">
					<div class="tx-summary-row">
						<span class="label">You Pay</span>
						<span class="value" id="tx-total-sui">-- SUI</span>
					</div>
					<div class="tx-summary-row">
						<span class="label">Network Fee (est.)</span>
						<span class="value" id="tx-gas-fee">~0.01 SUI</span>
					</div>
					<div class="tx-summary-row total">
						<span class="label">You Receive</span>
						<span class="value" id="tx-receive-nft">name.sui NFT</span>
					</div>
				</div>
				<div class="tx-gas-estimate" id="tx-simulation-status">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
					<span>Simulating transaction...</span>
				</div>
				<div class="tx-error" id="tx-error" style="display: none;"></div>
			</div>
			<div class="tx-preview-footer">
				<button class="tx-cancel-btn" id="tx-cancel-btn">Cancel</button>
				<button class="tx-confirm-btn" id="tx-confirm-btn" disabled>Confirm</button>
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

		${
			isRegisterable
				? `
		<!-- Quick Registration Card -->
		<div class="card register-card">
			<div class="section-title">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
				Quick Registration
			</div>

			<div class="register-hero">
				<div class="register-price" id="register-price">-- SUI</div>
				<div class="register-price-label">1 year with NS discount</div>
			</div>

			<!-- Savings Banner -->
			<div class="savings-banner" id="savings-banner" style="display: none;">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
					<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
				</svg>
				<span>Save <strong id="savings-percent">~25%</strong> with DeepBook NS swap</span>
			</div>

			<!-- Price Info -->
			<div class="price-breakdown" id="price-breakdown">
				<div class="price-row">
					<span class="price-label">Standard Price</span>
					<span class="price-value strikethrough" id="direct-price">-- SUI</span>
				</div>
				<div class="price-row discount">
					<span class="price-label">Your Price (NS Discount)</span>
					<span class="price-value" id="discounted-price">-- SUI</span>
				</div>
				<div class="price-row premium" id="premium-row" style="display: none;">
					<span class="price-label">Grace Period Premium</span>
					<span class="price-value" id="premium-price">+0 SUI</span>
				</div>
				<div class="price-row total">
					<span class="price-label">You Pay</span>
					<span class="price-value" id="total-price">-- SUI</span>
				</div>
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
		`
				: ''
		}

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
		import { getWallets } from 'https://esm.sh/@wallet-standard/app@1.1.0';
		import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from 'https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle';
		import { Transaction } from 'https://esm.sh/@mysten/sui@2.2.0/transactions?bundle';
		import { SuinsClient, SuinsTransaction } from 'https://esm.sh/@mysten/suins@1.0.0?bundle';

		const NAME = ${serializeJson(cleanName)};
		const NETWORK = ${serializeJson(network)};
		const CAN_REGISTER = ${isRegisterable ? 'true' : 'false'};
		const RPC_URLS = { mainnet: 'https://fullnode.mainnet.sui.io:443', testnet: 'https://fullnode.testnet.sui.io:443', devnet: 'https://fullnode.devnet.sui.io:443' };
		const RPC_URL = RPC_URLS[NETWORK] || RPC_URLS.mainnet;
		const SERVICE_FEE_NAME = ${serializeJson(env.SERVICE_FEE_NAME || null)};
		const NAME_LENGTH = NAME.length;

		// ========== PRICING ==========
		let pricingData = null;
		const registerPriceEl = document.getElementById('register-price');
		const directPriceEl = document.getElementById('direct-price');
		const premiumPriceEl = document.getElementById('premium-price');
		const premiumRowEl = document.getElementById('premium-row');
		const totalPriceEl = document.getElementById('total-price');

		async function fetchEnhancedPricing() {
			try {
				const pricingRes = await fetch('/api/pricing?domain=' + encodeURIComponent(NAME) + '&years=1');
				pricingData = await pricingRes.json();
				console.log('Pricing data:', pricingData);
				updatePriceDisplay();
				updateRegisterButton();
			} catch (e) {
				console.error('Failed to fetch pricing:', e);
				fallbackToSDKPricing();
			}
		}

		async function fallbackToSDKPricing() {
			try {
				const client = new SuiJsonRpcClient({ url: RPC_URL });
				const suinsClient = new SuinsClient({ client, network: NETWORK });
				const domain = NAME + '.sui';
				const priceInMist = await suinsClient.calculatePrice({ domain, years: 1 });

				pricingData = {
					directSuiMist: String(priceInMist),
					discountedSuiMist: String(BigInt(priceInMist) * 80n / 100n),
					nsNeededMist: String(BigInt(priceInMist) * 75n * 50n / 1000n),
					savingsMist: String(BigInt(priceInMist) * 20n / 100n),
					savingsPercent: 20,
					nsPerSui: 50,
					suiPerNs: 0.02,
					isGracePeriod: false,
					breakdown: {
						basePriceUsd: 0,
						discountedPriceUsd: 0,
						premiumUsd: 0,
						suiPriceUsd: 1,
						nsDiscountPercent: 25,
						swapSlippageBps: 100
					}
				};

				updatePriceDisplay();
				updateRegisterButton();
			} catch (e2) {
				console.error('SDK pricing also failed:', e2);
				if (registerPriceEl) registerPriceEl.textContent = '-- SUI';
			}
		}

		function updatePriceDisplay() {
			if (!pricingData) return;

			const directSui = Number(pricingData.directSuiMist) / 1e9;
			const discountedSui = Number(pricingData.discountedSuiMist) / 1e9;
			const savingsPercent = pricingData.savingsPercent || 25;
			const premiumUsd = pricingData.breakdown?.premiumUsd || 0;

			const savingsBanner = document.getElementById('savings-banner');
			const savingsPercentEl = document.getElementById('savings-percent');
			const discountedPriceEl = document.getElementById('discounted-price');
			const discountRow = discountedPriceEl?.parentElement;

			if (directPriceEl) {
				directPriceEl.textContent = directSui.toFixed(2) + ' SUI';
				directPriceEl.classList.add('strikethrough');
			}

			if (savingsBanner) savingsBanner.style.display = 'flex';
			if (savingsPercentEl) savingsPercentEl.textContent = '~' + Math.round(savingsPercent) + '%';
			if (discountRow) discountRow.style.display = 'flex';
			if (discountedPriceEl) discountedPriceEl.textContent = discountedSui.toFixed(2) + ' SUI';

			if (premiumUsd > 0 && premiumRowEl && premiumPriceEl) {
				const premiumSui = premiumUsd / (pricingData.breakdown?.suiPriceUsd || 1);
				premiumRowEl.style.display = 'flex';
				premiumPriceEl.textContent = '+' + premiumSui.toFixed(2) + ' SUI';
			} else if (premiumRowEl) {
				premiumRowEl.style.display = 'none';
			}

			if (totalPriceEl) totalPriceEl.textContent = discountedSui.toFixed(2) + ' SUI';
			if (registerPriceEl) registerPriceEl.textContent = discountedSui.toFixed(2) + ' SUI';
		}

		fetchEnhancedPricing();

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

		function escapeHtml(str) {
			if (!str) return '';
			return String(str)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
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
								'sui:signAndExecuteTransactionBlock': wallet.signAndExecuteTransactionBlock
									? { signAndExecuteTransactionBlock: wallet.signAndExecuteTransactionBlock.bind(wallet) }
									: undefined,
								'sui:signTransaction': wallet.signTransaction
									? { signTransaction: wallet.signTransaction.bind(wallet) }
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

		const nameCache = new Map();

		async function fetchPrimaryName(address) {
			if (!address) return null;
			if (nameCache.has(address)) return nameCache.get(address);
			try {
				const suiClient = new SuiJsonRpcClient({ url: RPC_URL });
				const result = await suiClient.resolveNameServiceNames({ address, limit: 1 });
				const name = result?.data?.[0] || null;
				nameCache.set(address, name);
				return name;
			} catch (e) {
				console.error('Failed to fetch primary name:', e);
				return null;
			}
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

				fetchPrimaryName(connectedAddress).then(name => {
					if (name && connectedAddress) {
						globalWalletText.textContent = '@' + name.replace(/\\.sui$/, '');
					}
				});

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
				let priceText = '...';
				if (pricingData) {
					const discountedSui = Number(pricingData.discountedSuiMist) / 1e9;
					priceText = discountedSui.toFixed(2) + ' SUI (25% off)';
				}
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

		function showRegisterStatus(message, type = 'info', isHtml = false) {
			if (!registerStatus) return;
			if (isHtml) {
				registerStatus.innerHTML = message;
			} else {
				registerStatus.textContent = message;
			}
			registerStatus.className = 'register-status show ' + type;
		}

		function hideRegisterStatus() {
			if (registerStatus) registerStatus.className = 'register-status';
		}

		// ========== REGISTRATION ==========
		// DeepBook v3 constants (mainnet only) - direct SUI→NS swap with deep_amount=0
		const NETWORK_NAME = NETWORK === 'mainnet' ? 'mainnet' : 'testnet';
		const DEEPBOOK_PACKAGE = NETWORK_NAME === 'mainnet'
			? '0x337f4f4f6567fcd778d5454f27c16c70e2f274cc6377ea6249ddf491482ef497'
			: null;
		const DEEPBOOK_NS_SUI_POOL = NETWORK_NAME === 'mainnet'
			? '0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8'
			: null;
		const NS_TYPE = '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS';
		const SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
		const DEEP_TYPE = '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP';
		const USDC_TYPE = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
		const DEEPBOOK_DEEP_SUI_POOL = NETWORK_NAME === 'mainnet'
			? '0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22'
			: null;
		const DEEPBOOK_SUI_USDC_POOL = NETWORK_NAME === 'mainnet'
			? '0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407'
			: null;
		const CLOCK_OBJECT = '0x6';
		const SLIPPAGE_BPS = 100n;
		const SUI_FOR_DEEP_SWAP = 10_000_000n;
		const MIN_DEEP_OUT = 500_000n;

		// Transaction preview modal elements
		const txPreviewModal = document.getElementById('tx-preview-modal');
		const txSwapAmount = document.getElementById('tx-swap-amount');
		const txNsAmount = document.getElementById('tx-ns-amount');
		const txDomainName = document.getElementById('tx-domain-name');
		const txRecipient = document.getElementById('tx-recipient');
		const txTotalSui = document.getElementById('tx-total-sui');
		const txGasFee = document.getElementById('tx-gas-fee');
		const txReceiveNft = document.getElementById('tx-receive-nft');
		const txSimulationStatus = document.getElementById('tx-simulation-status');
		const txError = document.getElementById('tx-error');
		const txCancelBtn = document.getElementById('tx-cancel-btn');
		const txConfirmBtn = document.getElementById('tx-confirm-btn');

		let pendingTransaction = null;
		let pendingTxBytes = null;
		let pendingSuiClient = null;

		function showTxPreview() {
			if (txPreviewModal) txPreviewModal.classList.add('open');
		}

		function hideTxPreview() {
			if (txPreviewModal) txPreviewModal.classList.remove('open');
			pendingTransaction = null;
			pendingTxBytes = null;
		}
		function wrapTxBytes(bytes) {
			return {
				serialize() {
					return bytes;
				},
				toJSON() {
					return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
				}
			};
		}
		function bytesToBase64(bytes) {
			return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
		}
		function getPhantomProvider() {
			const provider = window.phantom?.sui;
			return provider?.isPhantom ? provider : null;
		}

		function updateTxPreviewUI({ suiAmount, nsAmount, domain, recipient, gasFee, simulationOk, error }) {
			const txSwapRow = document.getElementById('tx-swap-row');
			const txPaymentAmount = document.getElementById('tx-payment-amount');
			if (nsAmount && txSwapAmount && txNsAmount && txSwapRow) {
				txSwapAmount.textContent = suiAmount;
				txNsAmount.textContent = nsAmount;
				txSwapRow.style.display = 'flex';
			} else if (txSwapRow) {
				txSwapRow.style.display = 'none';
			}
			if (txPaymentAmount) txPaymentAmount.textContent = suiAmount;
			if (txDomainName) txDomainName.textContent = domain;
			if (txRecipient) txRecipient.textContent = recipient.slice(0, 8) + '...' + recipient.slice(-6);
			if (txTotalSui) txTotalSui.textContent = suiAmount;
			if (txGasFee) txGasFee.textContent = gasFee;
			if (txReceiveNft) txReceiveNft.textContent = domain + '.sui NFT';

			if (simulationOk) {
				if (txSimulationStatus) {
					txSimulationStatus.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span style="color: var(--success);">Transaction verified</span>';
				}
				if (txError) txError.style.display = 'none';
				if (txConfirmBtn) txConfirmBtn.disabled = false;
			} else {
				if (txSimulationStatus) {
					txSimulationStatus.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span style="color: var(--error);">Simulation failed</span>';
				}
				if (txError && error) {
					txError.innerHTML = parseSimulationError(error);
					txError.style.display = 'block';
				}
				if (txConfirmBtn) txConfirmBtn.disabled = true;
			}
		}

		function parseSimulationError(error) {
			const msg = error?.message || String(error);

			if (msg.includes('InsufficientCoinBalance') || msg.includes('Insufficient')) {
				const suiNeeded = Number(pricingData?.discountedSuiMist || 0) / 1e9;
				return '<strong>Insufficient SUI balance</strong><br>You need ~' + suiNeeded.toFixed(2) + ' SUI plus gas fees.';
			}
			if (msg.includes('min_out') || msg.includes('slippage') || msg.includes('MinQuantityOut')) {
				return '<strong>DeepBook liquidity issue</strong><br>The NS/SUI pool doesn\\'t have enough liquidity. Try again later or use a smaller amount.';
			}
			if (msg.includes('ObjectNotFound') || msg.includes('deleted') || msg.includes('not found')) {
				return '<strong>Object not found</strong><br>A required on-chain object could not be found.<code>' + escapeHtml(msg.slice(0, 100)) + '</code>';
			}
			if (msg.includes('MoveAbort') || msg.includes('abort')) {
				const match = msg.match(/MoveAbort.*?(d+)/);
				const code = match ? match[1] : 'unknown';
				return '<strong>Contract error (code ' + code + ')</strong><br>The Move contract rejected this transaction.<code>' + escapeHtml(msg.slice(0, 150)) + '</code>';
			}
			if (msg.includes('GasBudgetTooLow') || msg.includes('gas budget')) {
				return '<strong>Gas budget too low</strong><br>This transaction needs more gas than expected. Please try again.';
			}
			if (msg.includes('already registered') || msg.includes('NameAlreadyRegistered')) {
				return '<strong>Name already registered</strong><br>This name has already been registered by someone else.';
			}

			return '<strong>Transaction cannot be completed</strong><br>' + escapeHtml(msg.slice(0, 200));
		}

		async function registerName() {
			if (!connectedAddress || !connectedWallet) {
				openWalletModal();
				return;
			}

			if (!pricingData) {
				showRegisterStatus('Loading pricing...', 'info');
				await fetchEnhancedPricing();
				if (!pricingData) {
					showRegisterStatus('Failed to load pricing. Please refresh.', 'error');
					return;
				}
			}

			registerBtn.disabled = true;
			registerBtnText.textContent = 'Building transaction...';
			hideRegisterStatus();

			try {
				const suiClient = new SuiJsonRpcClient({ url: RPC_URL });
				pendingSuiClient = suiClient;
				const suinsClient = new SuinsClient({ client: suiClient, network: NETWORK });

				const tx = new Transaction();
				tx.setSender(connectedAddress);

				const nsCoinConfig = suinsClient.config.coins['NS'];
				if (!nsCoinConfig) throw new Error('SuiNS NS coin config not found');

				const domain = NAME + '.sui';

				if (!DEEPBOOK_PACKAGE || !DEEPBOOK_NS_SUI_POOL || !DEEPBOOK_DEEP_SUI_POOL) {
					throw new Error('DeepBook pools not available on ' + NETWORK_NAME);
				}

				const nsNeeded = BigInt(pricingData.nsNeededMist);
				const nsWithSlippage = nsNeeded + (nsNeeded * SLIPPAGE_BPS) / 10000n;
				const nsTokens = Number(nsWithSlippage) / 1e6;
				const suiForNsSwap = BigInt(Math.ceil(nsTokens * pricingData.suiPerNs * 1e9));

				const priceInfoObjectId = pricingData.priceInfoObjectId || undefined;
				if (nsCoinConfig.feed && !priceInfoObjectId) {
					throw new Error('Price info object ID required for NS registration');
				}

				// Check if user has enough SUI; if not, try USDC swap prepend
				const totalSuiNeededForReg = suiForNsSwap + SUI_FOR_DEEP_SWAP + 50_000_000n;
				const suiBalRes = await suiClient.getBalance({ owner: connectedAddress, coinType: SUI_TYPE });
				const suiAvailableForReg = BigInt(suiBalRes.totalBalance);

				if (suiAvailableForReg < totalSuiNeededForReg && DEEPBOOK_SUI_USDC_POOL) {
					registerBtnText.textContent = 'Low SUI, checking USDC...';

					const [usdcBalRes, usdcPriceData] = await Promise.all([
						suiClient.getBalance({ owner: connectedAddress, coinType: USDC_TYPE }).catch(() => ({ totalBalance: '0' })),
						fetch('/api/usdc-price').then(r => r.json()).catch(() => null),
					]);

					const usdcAvail = BigInt(usdcBalRes.totalBalance);
					if (usdcAvail > 0n && usdcPriceData?.usdcPerSui > 0) {
						const usdcShortfallMist = totalSuiNeededForReg - suiAvailableForReg;
						const shortfallSui = Number(usdcShortfallMist) / 1e9;
						const usdcTokensNeeded = shortfallSui * usdcPriceData.usdcPerSui;
						const usdcMistNeeded = BigInt(Math.ceil(usdcTokensNeeded * 1e6));
						const usdcMistWithBuffer = usdcMistNeeded + (usdcMistNeeded * 30n) / 100n;
						const usdcToSell = usdcMistWithBuffer > usdcAvail ? usdcAvail : usdcMistWithBuffer;

						const expectedSuiFromUsdc = Number(usdcToSell) / 1e6 / usdcPriceData.usdcPerSui;
						const minSuiFromUsdc = BigInt(Math.floor(expectedSuiFromUsdc * 0.85 * 1e9));

						if (minSuiFromUsdc > 0n) {
							const usdcCoins = await suiClient.getCoins({ owner: connectedAddress, coinType: USDC_TYPE });
							if (usdcCoins.data.length > 0) {
								registerBtnText.textContent = 'Swapping USDC for SUI...';

								let usdcCoin;
								if (usdcCoins.data.length === 1) {
									usdcCoin = tx.object(usdcCoins.data[0].coinObjectId);
								} else {
									usdcCoin = tx.object(usdcCoins.data[0].coinObjectId);
									tx.mergeCoins(usdcCoin, usdcCoins.data.slice(1).map(c => tx.object(c.coinObjectId)));
								}

								const [usdcToSwap] = tx.splitCoins(usdcCoin, [tx.pure.u64(usdcToSell)]);
								tx.transferObjects([usdcCoin], connectedAddress);

								// Buy DEEP for USDC swap fee
								const [suiForUsdcDeepFee] = tx.splitCoins(tx.gas, [tx.pure.u64(SUI_FOR_DEEP_SWAP)]);
								const [zeroDeepForUsdc] = tx.moveCall({
									target: '0x2::coin::zero',
									typeArguments: [DEEP_TYPE],
								});
								const [deepForUsdc, usdcDeepSuiLeft, usdcDeepDeepLeft] = tx.moveCall({
									target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
									typeArguments: [DEEP_TYPE, SUI_TYPE],
									arguments: [
										tx.object(DEEPBOOK_DEEP_SUI_POOL),
										suiForUsdcDeepFee,
										zeroDeepForUsdc,
										tx.pure.u64(MIN_DEEP_OUT),
										tx.object(CLOCK_OBJECT),
									],
								});
								tx.transferObjects([usdcDeepSuiLeft, usdcDeepDeepLeft], connectedAddress);

								// Swap USDC → SUI (quote → base in SUI/USDC pool)
								const [suiFromUsdc, usdcLeftover, deepFromUsdcSwap] = tx.moveCall({
									target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
									typeArguments: [SUI_TYPE, USDC_TYPE],
									arguments: [
										tx.object(DEEPBOOK_SUI_USDC_POOL),
										usdcToSwap,
										deepForUsdc,
										tx.pure.u64(minSuiFromUsdc),
										tx.object(CLOCK_OBJECT),
									],
								});
								tx.transferObjects([usdcLeftover, deepFromUsdcSwap], connectedAddress);
								tx.mergeCoins(tx.gas, [suiFromUsdc]);
							}
						}
					}

					registerBtnText.textContent = 'Building transaction...';
				}

				const [suiCoinForNs, suiCoinForDeep] = tx.splitCoins(tx.gas, [
					tx.pure.u64(suiForNsSwap),
					tx.pure.u64(SUI_FOR_DEEP_SWAP),
				]);

				const [zeroDeepCoin] = tx.moveCall({
					target: '0x2::coin::zero',
					typeArguments: [DEEP_TYPE],
				});

				const [deepCoin, deepLeftoverSui, deepLeftoverDeep] = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
					typeArguments: [DEEP_TYPE, SUI_TYPE],
					arguments: [
						tx.object(DEEPBOOK_DEEP_SUI_POOL),
						suiCoinForDeep,
						zeroDeepCoin,
						tx.pure.u64(MIN_DEEP_OUT),
						tx.object(CLOCK_OBJECT),
					],
				});

				tx.transferObjects([deepLeftoverSui, deepLeftoverDeep], connectedAddress);

				const [nsCoin, nsLeftoverSui, nsLeftoverDeep] = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
					typeArguments: [NS_TYPE, SUI_TYPE],
					arguments: [
						tx.object(DEEPBOOK_NS_SUI_POOL),
						suiCoinForNs,
						deepCoin,
						tx.pure.u64(nsNeeded),
						tx.object(CLOCK_OBJECT),
					],
				});

				tx.transferObjects([nsLeftoverSui, nsLeftoverDeep], connectedAddress);

				const suinsTx = new SuinsTransaction(suinsClient, tx);
				const nft = suinsTx.register({
					domain,
					years: 1,
					coinConfig: nsCoinConfig,
					coin: nsCoin,
					priceInfoObjectId,
				});
				suinsTx.setTargetAddress({
					nft,
					address: connectedAddress,
					isSubname: domain.replace(/\\.sui$/i, '').includes('.'),
				});
				tx.transferObjects([nft], connectedAddress);

				let feeRecipient = connectedAddress;
				if (SERVICE_FEE_NAME) {
					try {
						const feeRecord = await suinsClient.getNameRecord(SERVICE_FEE_NAME);
						if (feeRecord?.targetAddress) feeRecipient = feeRecord.targetAddress;
					} catch {}
				}
				tx.transferObjects([nsCoin], feeRecipient);

				tx.setGasBudget(100000000);

				registerBtnText.textContent = 'Waiting for wallet...';

				try {
					const phantomProvider = getPhantomProvider();
					let result;
					const signExecFeature = connectedWallet?.features?.['sui:signAndExecuteTransaction'];
					const signExecBlockFeature = connectedWallet?.features?.['sui:signAndExecuteTransactionBlock'];

					// Wallet-standard features expect Transaction object directly (wallet handles serialization)
					if (signExecFeature?.signAndExecuteTransaction) {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: tx,
							account: connectedAccount,
							chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
							options: { showEffects: true },
						});
					} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
						result = await signExecBlockFeature.signAndExecuteTransactionBlock({
							transactionBlock: tx,
							account: connectedAccount,
							chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
							options: { showEffects: true },
						});
					} else {
						// Legacy/direct wallet access needs pre-built bytes
						const txBytes = await tx.build({ client: suiClient });
						if (phantomProvider?.signAndExecuteTransactionBlock) {
							try {
								result = await phantomProvider.signAndExecuteTransactionBlock({
									transactionBlock: txBytes,
									options: { showEffects: true }
								});
							} catch (e) {}
							if (!result) {
								result = await phantomProvider.signAndExecuteTransactionBlock({
									transactionBlock: bytesToBase64(txBytes),
									options: { showEffects: true }
								});
							}
						} else if (window.phantom?.sui?.signAndExecuteTransactionBlock) {
							result = await window.phantom.sui.signAndExecuteTransactionBlock({
								transactionBlock: txBytes,
								options: { showEffects: true }
							});
						} else if (window.suiWallet?.signAndExecuteTransactionBlock) {
							result = await window.suiWallet.signAndExecuteTransactionBlock({
								transactionBlock: tx,
							});
						} else {
							throw new Error('No compatible Sui wallet found');
						}
					}

					console.log('Transaction result:', result);
					const digest = result.digest || '';
					const suiscanUrl = 'https://suiscan.xyz/' + NETWORK + '/tx/' + digest;
					const txsenseUrl = 'https://txsense.netlify.app/?digest=' + digest;
					showRegisterStatus(
						'<div style="text-align: center; margin-bottom: 12px;">' +
						'<strong style="font-size: 1.1rem;">🎉 ' + NAME + '.sui is yours!</strong>' +
						'</div>' +
						'<iframe src="' + txsenseUrl + '" style="width: 100%; height: 300px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); margin: 12px 0;"></iframe>' +
						'<div style="display: flex; gap: 12px; justify-content: center; margin-top: 8px;">' +
						'<a href="' + suiscanUrl + '" target="_blank" style="color: var(--accent); text-decoration: underline;">View on Suiscan</a>' +
						'<a href="https://' + NAME + '.sui.ski" style="color: var(--success); text-decoration: underline; font-weight: 600;">Go to ' + NAME + '.sui →</a>' +
						'</div>',
						'success', true);
					registerBtnText.textContent = 'Registered!';
					registerBtn.disabled = true;

				} catch (txError) {
					console.error('Transaction failed:', txError);
					showRegisterStatus('Transaction failed: ' + (txError.message || 'User rejected'), 'error');
					registerBtn.disabled = false;
					updateRegisterButton();
				}

			} catch (error) {
				console.error('Failed to build transaction:', error);
				showRegisterStatus('Failed to build transaction: ' + (error.message || 'Unknown error'), 'error');
				registerBtn.disabled = false;
				updateRegisterButton();
			}
		}

		async function confirmTransaction() {
			if (!pendingTxBytes || !connectedWallet || !connectedAccount) {
				hideTxPreview();
				return;
			}

			if (txConfirmBtn) {
				txConfirmBtn.disabled = true;
				txConfirmBtn.textContent = 'Signing...';
			}

			try {
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

				if (!signExecFeature && !signExecBlockFeature) {
					const phantomProvider = getPhantomProvider();
					if (!phantomProvider?.signAndExecuteTransactionBlock) {
						throw new Error('Wallet does not support transaction signing');
					}
				}

				const txWrapper = wrapTxBytes(pendingTxBytes);
				const phantomProvider = getPhantomProvider();
				let result;
				if (signExecFeature?.signAndExecuteTransaction) {
					result = await signExecFeature.signAndExecuteTransaction({
						transaction: txWrapper,
						account: connectedAccount,
						chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
					});
				} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
					result = await signExecBlockFeature.signAndExecuteTransactionBlock({
						transactionBlock: txWrapper,
						account: connectedAccount,
						chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
					});
				} else if (phantomProvider?.signAndExecuteTransactionBlock) {
					try {
						result = await phantomProvider.signAndExecuteTransactionBlock({
							transactionBlock: pendingTxBytes,
							options: { showEffects: true }
						});
					} catch (e) {}
					if (!result) {
						result = await phantomProvider.signAndExecuteTransactionBlock({
							transactionBlock: bytesToBase64(pendingTxBytes),
							options: { showEffects: true }
						});
					}
				}

				hideTxPreview();

				if (result.digest) {
					showRegisterStatus('Transaction submitted! Waiting for confirmation...', 'info');

					if (pendingSuiClient) {
						await pendingSuiClient.waitForTransaction({ digest: result.digest });
					}

					showRegisterStatus('Success! ' + NAME + '.sui is now yours. Redirecting...', 'success');

					setTimeout(() => {
						window.location.href = 'https://' + NAME + '.sui.ski';
					}, 2000);
				}

			} catch (error) {
				console.error('Transaction failed:', error);
				hideTxPreview();

				if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
					showRegisterStatus('Transaction cancelled', 'error');
				} else {
					showRegisterStatus('Transaction failed: ' + (error.message || 'Unknown error'), 'error');
				}
			} finally {
				if (txConfirmBtn) {
					txConfirmBtn.disabled = false;
					txConfirmBtn.textContent = 'Confirm';
				}
			}
		}

		if (txCancelBtn) txCancelBtn.addEventListener('click', hideTxPreview);
		if (txConfirmBtn) txConfirmBtn.addEventListener('click', confirmTransaction);
		if (txPreviewModal) {
			txPreviewModal.addEventListener('click', (e) => {
				if (e.target === txPreviewModal) hideTxPreview();
			});
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

		setupCollapsible('relay-header', 'relay-toggle', 'relay-content');

		// ========== OFFLINE RELAY ==========
		const txStatus = document.getElementById('tx-status');
		const txResult = document.getElementById('tx-result');
		const txSubmit = document.getElementById('tx-submit');
		const txBytesInput = document.getElementById('tx-bytes');
		const txSignaturesInput = document.getElementById('tx-signatures');

		function setTxStatus(message, type = 'info') {
			txStatus.textContent = message || '';
			txStatus.className = 'status-line ' + type;
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
