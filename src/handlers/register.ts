import type { Env } from '../types'
import { generateLogoSvg } from '../utils/og-image'
import { jsonResponse } from '../utils/response'
import { relaySignedTransaction } from '../utils/transactions'
import { generateWalletSessionJs } from '../utils/wallet-session-js'

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
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
	<style>
		:root {
			--bg: #000;
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
			background: #000;
			height: 100vh;
			overflow: hidden;
			color: var(--text);
			padding: 16px 16px 8px;
			display: flex;
			flex-direction: column;
			justify-content: center;
			position: relative;
		}
		.container {
			max-width: 880px;
			margin: 0 auto;
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 20px;
			padding: 20px;
			box-shadow: 0 25px 60px rgba(5,6,12,0.7);
		}
		.header {
			text-align: left;
			margin-bottom: 0;
		}
		.header h1 {
			font-size: clamp(1.4rem, 2.5vw, 2rem);
			margin-bottom: 4px;
			font-weight: 800;
		}
		.header h1 span {
			color: var(--accent);
		}
		.register-layout {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 20px;
			align-items: start;
		}
		.register-left {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding-top: 4px;
		}
		.register-right {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		.gear-fab {
			position: fixed;
			bottom: 24px;
			right: 24px;
			width: 44px;
			height: 44px;
			border-radius: 50%;
			background: rgba(15, 18, 32, 0.95);
			backdrop-filter: blur(12px);
			border: 1px solid var(--border);
			color: var(--muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.3s;
			z-index: 9998;
		}
		.gear-fab:hover {
			border-color: var(--accent);
			color: var(--accent);
			transform: rotate(90deg);
		}
		.gear-fab svg {
			width: 20px;
			height: 20px;
		}
		.gear-panel {
			display: none;
			position: fixed;
			bottom: 80px;
			right: 24px;
			width: 420px;
			max-height: 70vh;
			overflow-y: auto;
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 24px;
			box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
			z-index: 9998;
		}
		.gear-panel.open {
			display: block;
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
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.global-wallet-profile-btn {
			width: 36px;
			height: 36px;
			border-radius: 10px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(96, 165, 250, 0.35);
			cursor: pointer;
			transition: all 0.2s ease;
			padding: 0;
		}
		.global-wallet-profile-btn svg {
			width: 18px;
			height: 18px;
		}
		.global-wallet-profile-btn:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: rgba(96, 165, 250, 0.55);
			transform: translateY(-1px);
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
		.network-indicator {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			position: absolute;
			top: -2px;
			right: -2px;
			z-index: 1;
		}
		.network-indicator.mainnet {
			background: var(--success);
			box-shadow: 0 0 6px rgba(52, 211, 153, 0.6);
		}
		.network-indicator.testnet {
			background: var(--warning);
			box-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
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
			text-align: left;
			padding: 0;
		}
		.register-price-row {
			display: flex;
			align-items: center;
			gap: 10px;
			flex-wrap: wrap;
		}
		.register-price {
			font-size: 1.6rem;
			font-weight: 800;
			background: linear-gradient(135deg, #34d399, #60a5fa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.register-price-label {
			color: var(--muted);
			font-size: 0.8rem;
			margin-top: 1px;
		}
		.register-btn {
			width: 100%;
			padding: 12px 20px;
			font-size: 0.95rem;
			font-weight: 700;
			background: linear-gradient(135deg, #10b981, #3b82f6);
			color: white;
			border: none;
			border-radius: 12px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			transition: all 0.2s;
			box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
		}
		.register-btn.compact {
			width: auto;
			margin: 0 auto;
			padding: 8px 28px;
			font-size: 0.9rem;
			border-radius: 10px;
			box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
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
			margin-top: 8px;
			padding: 12px;
			border-radius: 10px;
			font-size: 0.85rem;
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
			gap: 12px;
			margin-top: 4px;
			flex-wrap: wrap;
		}
		.register-feature {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 0.78rem;
			color: var(--muted);
		}
		.register-feature svg {
			width: 14px;
			height: 14px;
			color: var(--success);
		}

		.savings-badge {
			display: inline-flex;
			align-items: center;
			padding: 4px 10px;
			border-radius: 999px;
			background: rgba(52, 211, 153, 0.18);
			border: 1px solid rgba(52, 211, 153, 0.35);
			color: #fff;
			font-size: 0.78rem;
			font-weight: 700;
			letter-spacing: 0.02em;
			white-space: nowrap;
			cursor: pointer;
			transition: all 0.2s;
		}
		.savings-badge:hover {
			background: rgba(52, 211, 153, 0.28);
			border-color: rgba(52, 211, 153, 0.5);
		}
		.savings-badge.active {
			background: rgba(52, 211, 153, 0.35);
			border-color: rgba(52, 211, 153, 0.7);
			box-shadow: 0 0 12px rgba(52, 211, 153, 0.25);
		}

		/* Price Breakdown */
		.price-breakdown {
			background: rgba(0, 0, 0, 0.24);
			border-radius: 10px;
			padding: 10px 14px;
			margin: 4px 0 8px;
		}
		.price-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 3px 0;
			font-size: 0.82rem;
		}
		.price-row .price-label {
			color: var(--muted);
		}
		.price-row .price-value {
			font-family: ui-monospace, monospace;
			font-weight: 600;
			text-align: right;
		}
		.price-row.discount .price-value {
			color: var(--success);
		}
		.price-row.premium .price-value {
			color: var(--warning);
		}
		.price-row.total {
			border-top: 1px solid var(--border);
			margin-top: 6px;
			padding-top: 8px;
		}
		.price-row.total .price-label {
			color: var(--text);
			font-weight: 600;
		}
		.price-row.total .price-value {
			color: var(--text);
			font-size: 1rem;
			font-weight: 700;
		}
		.strikethrough {
			text-decoration: line-through;
			opacity: 0.6;
		}

		/* Nav Bar */
		.nav-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 16px;
			margin-bottom: 4px;
			max-width: 880px;
			margin-left: auto;
			margin-right: auto;
		}
		.nav-logo {
			display: flex;
			align-items: center;
			gap: 8px;
			text-decoration: none;
			color: var(--text);
			font-size: 1.1rem;
			font-weight: 800;
			letter-spacing: -0.02em;
		}
		.nav-logo:hover { opacity: 0.85; }
		.nav-logo svg { filter: drop-shadow(0 2px 8px rgba(96, 165, 250, 0.3)); }
		.nav-badge {
			font-size: 0.65rem;
			padding: 2px 8px;
			border-radius: 999px;
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(96, 165, 250, 0.2);
			color: var(--accent);
			font-weight: 600;
			letter-spacing: 0.04em;
			text-transform: uppercase;
		}

		/* Background Watermark */
		.brand-watermark {
			position: fixed;
			inset: 0;
			z-index: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			pointer-events: none;
			opacity: 0.035;
		}
		.brand-watermark svg {
			width: min(70vw, 520px);
			height: min(70vw, 520px);
		}

		/* Footer */
		.footer-brand {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 6px 0 0;
			max-width: 880px;
			margin: 0 auto;
		}
		.footer-logo {
			display: flex;
			align-items: center;
			gap: 8px;
			text-decoration: none;
			color: var(--muted);
			font-size: 0.95rem;
			font-weight: 700;
			transition: color 0.2s;
		}
		.footer-logo:hover { color: var(--text); }
		.footer-logo svg { opacity: 0.6; }
		.footer-tagline {
			font-size: 0.78rem;
			color: var(--muted);
			opacity: 0.6;
			text-align: center;
		}
		.footer-links {
			display: flex;
			gap: 16px;
			margin-top: 4px;
		}
		.footer-links a {
			font-size: 0.75rem;
			color: var(--muted);
			text-decoration: none;
			opacity: 0.5;
			transition: opacity 0.2s;
		}
		.footer-links a:hover { opacity: 1; }

		/* Card header logo accent */
		.card-brand-row {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-bottom: 2px;
			opacity: 0.5;
		}
		.card-brand-row span {
			font-size: 0.72rem;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			color: var(--muted);
			font-weight: 700;
		}

		/* NS Rate Info */
		.ns-rate-info {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 6px 10px;
			background: rgba(77, 162, 255, 0.08);
			border: 1px solid rgba(77, 162, 255, 0.15);
			border-radius: 8px;
			margin-bottom: 8px;
			font-size: 0.75rem;
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

		.options-panel {
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 12px;
			background: rgba(0, 0, 0, 0.2);
			border: 1px solid var(--border);
			border-radius: 12px;
			margin: 2px 0 6px;
		}
		.options-title {
			font-size: 0.82rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--muted);
		}
		.option-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			min-height: 30px;
		}
		.option-label {
			font-size: 0.88rem;
			color: var(--text);
			font-weight: 500;
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.option-label .hint {
			font-size: 0.75rem;
			color: var(--muted);
			font-weight: 400;
		}
		.duration-pills {
			display: flex;
			gap: 4px;
			background: rgba(255, 255, 255, 0.04);
			border-radius: 10px;
			padding: 3px;
			border: 1px solid var(--border);
		}
		.duration-pill {
			padding: 6px 14px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--muted);
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s;
		}
		.duration-pill.active {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.25), rgba(139, 92, 246, 0.2));
			color: var(--text);
			box-shadow: 0 2px 8px rgba(96, 165, 250, 0.15);
		}
		.duration-pill:hover:not(.active) {
			color: var(--text);
			background: rgba(255, 255, 255, 0.06);
		}
		.option-toggle {
			position: relative;
			width: 40px;
			height: 22px;
			flex-shrink: 0;
		}
		.option-toggle input {
			opacity: 0;
			width: 0;
			height: 0;
			position: absolute;
		}
		.option-toggle .slider {
			position: absolute;
			inset: 0;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 11px;
			cursor: pointer;
			transition: background 0.2s;
		}
		.option-toggle .slider::before {
			content: '';
			position: absolute;
			width: 16px;
			height: 16px;
			left: 3px;
			top: 3px;
			background: var(--text);
			border-radius: 50%;
			transition: transform 0.2s;
		}
		.option-toggle input:checked + .slider {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		}
		.option-toggle input:checked + .slider::before {
			transform: translateX(18px);
		}
		.option-toggle input:disabled + .slider {
			opacity: 0.4;
			cursor: not-allowed;
		}
		.option-input-row {
			display: none;
			margin-top: -6px;
		}
		.option-input-row.visible {
			display: block;
		}
		.option-input {
			width: 100%;
			padding: 8px 12px;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid var(--border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.85rem;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		}
		.option-input:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
		}
		.option-input::placeholder {
			color: var(--muted);
			opacity: 0.6;
		}
		.subname-cap-section {
			border-top: 1px solid var(--border);
			padding-top: 14px;
			margin-top: 4px;
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.jacket-type-pills {
			display: flex;
			gap: 4px;
			background: rgba(255, 255, 255, 0.04);
			border-radius: 10px;
			padding: 3px;
			border: 1px solid var(--border);
		}
		.jacket-pill {
			padding: 6px 14px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--muted);
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s;
		}
		.jacket-pill.active {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.25), rgba(139, 92, 246, 0.2));
			color: var(--text);
			box-shadow: 0 2px 8px rgba(96, 165, 250, 0.15);
		}
		.jacket-pill:hover:not(.active) {
			color: var(--text);
			background: rgba(255, 255, 255, 0.06);
		}
		.jacket-config {
			display: none;
			flex-direction: column;
			gap: 10px;
		}
		.jacket-config.visible {
			display: flex;
		}
		.fee-input-row {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.fee-input-row input {
			flex: 1;
			padding: 8px 12px;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid var(--border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.85rem;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		}
		.fee-input-row input:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
		}
		.fee-input-row .unit-label {
			font-size: 0.82rem;
			color: var(--muted);
			font-weight: 600;
			flex-shrink: 0;
		}

			@media (max-width: 640px) {
				.card { padding: 16px; }
				.register-layout { grid-template-columns: 1fr; gap: 12px; }
				.register-left { text-align: center; align-items: center; }
				.header { text-align: center; }
			.register-hero { text-align: center; }
			.register-features { justify-content: center; }
				.bid-main { grid-template-columns: 1fr; }
				.bid-list li { font-size: 0.8rem; }
				.global-wallet-widget { top: 12px; right: 12px; }
				.global-wallet-profile-btn { width: 34px; height: 34px; }
				.global-wallet-btn { padding: 8px 12px; font-size: 0.85rem; }
				.gear-panel { width: calc(100vw - 32px); right: 16px; bottom: 76px; }
				.gear-fab { bottom: 16px; right: 16px; }
				.nav-bar { padding: 0 8px; }
				.nav-logo { font-size: 1.1rem; }
			.card-brand-row { justify-content: center; }
		}
	</style>
</head>
<body>
	<!-- Background Watermark -->
	<div class="brand-watermark" aria-hidden="true">${generateLogoSvg(520)}</div>

	<!-- Nav Bar -->
	<nav class="nav-bar">
		<a href="https://sui.ski" class="nav-logo">
			${generateLogoSvg(24)}
			sui.ski
		</a>
		<span class="nav-badge">${escapeHtml(network)}</span>
	</nav>

	<!-- Global Wallet Widget -->
	<div class="global-wallet-widget" id="global-wallet-widget">
		<button class="global-wallet-profile-btn" id="global-wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile">
			${generateLogoSvg(18)}
		</button>
		<div class="network-indicator ${network === 'mainnet' ? 'mainnet' : 'testnet'}" title="${escapeHtml(network)}"></div>
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
				<h3>${generateLogoSvg(20)} Connect Wallet</h3>
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
				<h3>${generateLogoSvg(22)} Confirm Transaction</h3>
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
						<p>Pay <span id="tx-payment-amount">-- SUI</span> • <span id="tx-duration">1 year</span> via SuiNS</p>
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
				<div class="tx-action" id="tx-primary-row" style="display: none;">
					<div class="tx-action-icon register">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
					</div>
					<div class="tx-action-details">
						<h4>Set as Primary Name</h4>
						<p>Your address will resolve to <span id="tx-primary-name">name</span>.sui</p>
					</div>
				</div>
				<div class="tx-action" id="tx-avatar-row" style="display: none;">
					<div class="tx-action-icon swap">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
					</div>
					<div class="tx-action-details">
						<h4>Set Avatar</h4>
						<p id="tx-avatar-url">...</p>
					</div>
				</div>
				<div class="tx-action" id="tx-content-row" style="display: none;">
					<div class="tx-action-icon swap">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
					</div>
					<div class="tx-action-details">
						<h4>Set Content Hash</h4>
						<p id="tx-content-value">...</p>
					</div>
				</div>
				<div class="tx-action" id="tx-subnamecap-row" style="display: none;">
					<div class="tx-action-icon register">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
					</div>
					<div class="tx-action-details">
						<h4>Create SubnameCap</h4>
						<p id="tx-subnamecap-desc">Allows creating subnames</p>
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
		${
			isRegisterable
				? `
		<div class="card register-card">
			<div class="register-layout">
				<div class="register-left">
					<div class="card-brand-row">${generateLogoSvg(16)} <span>via sui.ski</span></div>
					<div class="header">
						<h1>${escapeHtml(cleanName)}<span>.sui</span></h1>
						<div class="badge success">Available</div>
					</div>
					<div class="register-features">
						<div class="register-feature">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
							Single PTB
						</div>
						<div class="register-feature">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
							Atomic ownership
						</div>
						<div class="register-feature">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
							Native DeFi
						</div>
					</div>
				</div>
				<div class="register-right">
					<div class="register-hero">
						<div class="register-price-row">
							<div class="register-price" id="register-price">-- SUI</div>
							<span class="savings-badge" id="savings-badge" style="display: none;" title="Click to send savings to facilitator"><span id="savings-percent">-25%</span> <span id="savings-sui-amount"></span></span>
						</div>
						<div class="register-price-label" id="register-price-usd">1 year registration</div>
					</div>
					<div class="price-breakdown" id="price-breakdown">
						<div class="price-row">
							<span class="price-label" id="standard-price-label">List price</span>
							<span class="price-value strikethrough" id="direct-price">-- SUI</span>
						</div>
						<div class="price-row discount" id="discount-row">
							<span class="price-label">DeepBook discount</span>
							<span class="price-value" id="discounted-price">-- SUI</span>
						</div>
						<div class="price-row premium" id="premium-row" style="display: none;">
							<span class="price-label">Grace period premium</span>
							<span class="price-value" id="premium-price">+0 SUI</span>
						</div>
						<div class="price-row total">
							<span class="price-label">You pay</span>
							<span class="price-value" id="total-price">-- SUI</span>
						</div>
					</div>
					<div class="options-panel" id="options-panel">
						<div class="options-title">Registration Options</div>
						<div class="option-row">
							<span class="option-label">Duration</span>
							<div class="duration-pills" id="duration-pills">
								<button class="duration-pill active" data-years="1">1 yr</button>
								<button class="duration-pill" data-years="2">2 yr</button>
								<button class="duration-pill" data-years="3">3 yr</button>
								<button class="duration-pill" data-years="5">5 yr</button>
							</div>
						</div>
						<div class="option-row">
							<span class="option-label">Set as Primary</span>
							<label class="option-toggle">
								<input type="checkbox" id="opt-primary" checked>
								<span class="slider"></span>
							</label>
						</div>
						<div class="option-row">
							<span class="option-label">Register for someone else</span>
							<label class="option-toggle">
								<input type="checkbox" id="opt-custom-target">
								<span class="slider"></span>
							</label>
						</div>
						<div class="option-input-row" id="custom-target-row">
							<input class="option-input" id="opt-target-address" type="text" placeholder="0x... address or name.sui">
						</div>
						<div class="option-row">
							<span class="option-label" id="avatar-toggle" style="cursor: pointer;">Avatar URL <span class="hint">(optional)</span></span>
						</div>
						<div class="option-input-row" id="avatar-input-row">
							<input class="option-input" id="opt-avatar" type="text" placeholder="https://example.com/avatar.png">
						</div>
						<div class="option-row">
							<span class="option-label" id="content-hash-toggle" style="cursor: pointer;">Content Hash <span class="hint">(optional)</span></span>
						</div>
						<div class="option-input-row" id="content-hash-input-row">
							<input class="option-input" id="opt-content-hash" type="text" placeholder="ipfs://Qm... or walrus blob ID">
						</div>
						<div class="subname-cap-section" id="subname-cap-section" style="display: none;">
							<div class="option-row">
								<span class="option-label">Create SubnameCap</span>
								<label class="option-toggle">
									<input type="checkbox" id="opt-subname-cap">
									<span class="slider"></span>
								</label>
							</div>
							<div id="jacket-options" style="display: none;">
								<div class="option-row" style="margin-bottom: 8px;">
									<span class="option-label">Jacket Type</span>
									<div class="jacket-type-pills" id="jacket-type-pills">
										<button class="jacket-pill active" data-jacket="none">None</button>
										<button class="jacket-pill" data-jacket="fee">Fee</button>
										<button class="jacket-pill" data-jacket="single-use">Single-Use</button>
									</div>
								</div>
								<div class="jacket-config" id="jacket-fee-config">
									<label style="margin-bottom: 0;">Leaf Fee</label>
									<div class="fee-input-row">
										<input type="number" id="opt-leaf-fee" step="0.001" min="0" placeholder="0.1">
										<span class="unit-label">SUI</span>
									</div>
									<label style="margin-bottom: 0;">Fee Recipient <span class="hint">(defaults to you)</span></label>
									<input class="option-input" id="opt-fee-recipient" type="text" placeholder="0x... address (optional)">
								</div>
								<div class="jacket-config" id="jacket-single-use-config">
									<label style="margin-bottom: 0;">Send Voucher To</label>
									<input class="option-input" id="opt-single-use-recipient" type="text" placeholder="0x... address or name.sui">
								</div>
							</div>
						</div>
					</div>
					<button class="register-btn compact" id="register-btn">
						<span id="register-btn-text">Connect Wallet</span>
					</button>
					<div class="register-status" id="register-status"></div>
				</div>
			</div>
		</div>
		`
				: `
		<div class="card">
			<div class="card-brand-row" style="justify-content: center;">${generateLogoSvg(16)} <span>via sui.ski</span></div>
			<div class="header" style="text-align: center;">
				<h1>${escapeHtml(cleanName)}<span>.sui</span></h1>
				<div class="badge warning">Minimum length is 3 characters</div>
			</div>
		</div>
		`
		}
	</div>

	<footer class="footer-brand">
		<a href="https://sui.ski" class="footer-logo">
			${generateLogoSvg(16)}
			sui.ski
		</a>
	</footer>

	<!-- Gear FAB for advanced relay -->
	<button class="gear-fab" id="gear-fab" title="Advanced options">
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="3"></circle>
			<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
		</svg>
	</button>
	<div class="gear-panel" id="gear-panel">
		<div class="section-title" style="margin-bottom: 12px;">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M5 12l5 5L20 7"></path></svg>
			Offline Transaction Relay
		</div>
		<p class="instructions" style="margin-top: 0;">Bring your own signed Sui transaction block (for example, produced via <code>sui client</code> or an air-gapped wallet). sui.ski forwards the signed payload immediately.</p>
		<ol class="instructions">
			<li>Prepare a SuiNS registration transaction offline.</li>
			<li>Sign the transaction bytes with every required signer.</li>
			<li>Paste the base64-encoded transaction bytes and signatures below, then relay.</li>
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
	</div>

		<script>
			(function() {
				var NAME = ${serializeJson(cleanName)};
				var NAME_LENGTH = NAME.length;
				var selectedYears = 1;
				window.__suiskiModuleLoaded = false;
				window.__suiskiPricingData = null;

				function isValidPricingPayload(pd) {
					var suiPerNs = pd && typeof pd.suiPerNs === 'string' ? Number(pd.suiPerNs) : pd && pd.suiPerNs;
					return !!pd &&
						typeof pd === 'object' &&
						pd.directSuiMist != null &&
						pd.discountedSuiMist != null &&
						pd.nsNeededMist != null &&
						Number.isFinite(suiPerNs) &&
						suiPerNs > 0;
				}

				window.__suiskiIsValidPricingPayload = isValidPricingPayload;

				function fallbackUpdatePriceDisplay(pd) {
					if (!isValidPricingPayload(pd)) return;
					var directMist = Number(pd.directSuiMist);
					var discountedMist = Number(pd.discountedSuiMist);
					if (!Number.isFinite(directMist) || !Number.isFinite(discountedMist)) return;
					var directSui = directMist / 1e9;
					var discountedSui = discountedMist / 1e9;
					var savingsPercent = pd.savingsPercent || 25;
					var suiPriceUsd = (pd.breakdown && pd.breakdown.suiPriceUsd) || 1;
					var premiumUsd = (pd.breakdown && pd.breakdown.premiumUsd) || 0;

				var el = function(id) { return document.getElementById(id); };
				var standardLabelEl = el('standard-price-label');
				if (standardLabelEl) standardLabelEl.textContent = NAME_LENGTH + '-char list price';
				var directPriceEl = el('direct-price');
				if (directPriceEl) { directPriceEl.textContent = directSui.toFixed(2) + ' SUI'; directPriceEl.classList.add('strikethrough'); }
				var savingsBadge = el('savings-badge');
				if (savingsBadge) savingsBadge.style.display = 'inline-flex';
				var savingsPercentEl = el('savings-percent');
				if (savingsPercentEl) savingsPercentEl.textContent = '-' + Math.round(savingsPercent) + '%';
				var savingsSuiEl = el('savings-sui-amount');
				if (savingsSuiEl) savingsSuiEl.textContent = (directSui - discountedSui).toFixed(2) + ' SUI';
				var discountedPriceEl = el('discounted-price');
				if (discountedPriceEl) discountedPriceEl.textContent = '-' + (directSui - discountedSui).toFixed(2) + ' SUI';
				var premiumRowEl = el('premium-row');
				var premiumPriceEl = el('premium-price');
				if (premiumUsd > 0 && premiumRowEl && premiumPriceEl) {
					premiumRowEl.style.display = 'flex';
					premiumPriceEl.textContent = '+' + (premiumUsd / suiPriceUsd).toFixed(2) + ' SUI';
				} else if (premiumRowEl) { premiumRowEl.style.display = 'none'; }
				var totalPriceEl = el('total-price');
				if (totalPriceEl) totalPriceEl.textContent = discountedSui.toFixed(2) + ' SUI';
				var registerPriceEl = el('register-price');
				if (registerPriceEl) registerPriceEl.textContent = discountedSui.toFixed(2) + ' SUI';
				var priceUsdEl = el('register-price-usd');
				if (priceUsdEl) {
					var yearLabel = selectedYears === 1 ? '1 year' : selectedYears + ' years';
					priceUsdEl.textContent = '~$' + (discountedSui * suiPriceUsd).toFixed(2) + ' USD \\u00b7 ' + yearLabel;
				}
			}

				function fallbackFetchPricing() {
					fetch('/api/pricing?domain=' + encodeURIComponent(NAME) + '&years=' + selectedYears)
						.then(function(r) {
							if (!r.ok) throw new Error('Pricing request failed (' + r.status + ')');
							return r.json();
						})
						.then(function(data) {
							if (!isValidPricingPayload(data)) throw new Error('Invalid pricing payload');
							window.__suiskiPricingData = data;
							fallbackUpdatePriceDisplay(data);
						})
						.catch(function(error) { console.warn('Fallback pricing fetch failed:', error); });
				}

			var durationPills = document.getElementById('duration-pills');
			if (durationPills) {
				durationPills.addEventListener('click', function(e) {
					var pill = e.target.closest && e.target.closest('.duration-pill');
					if (!pill) return;
					var years = parseInt(pill.dataset.years, 10);
					if (years === selectedYears) return;
					selectedYears = years;
					durationPills.querySelectorAll('.duration-pill').forEach(function(p) { p.classList.remove('active'); });
					pill.classList.add('active');
					if (!window.__suiskiModuleLoaded) fallbackFetchPricing();
				});
			}

			setTimeout(function() {
				if (!window.__suiskiModuleLoaded) fallbackFetchPricing();
			}, 2000);

			fallbackFetchPricing();
		})();
	</script>
		<script type="module">
		let getWallets, getJsonRpcFullnodeUrl, SuiJsonRpcClient, Transaction, ALLOWED_METADATA, SuinsClient, SuinsTransaction;
		{
			const SDK_TIMEOUT = 15000;
			const timedImport = (url) => Promise.race([
				import(url),
				new Promise((_, r) => setTimeout(() => r(new Error('Timeout: ' + url)), SDK_TIMEOUT)),
			]);
			const results = await Promise.allSettled([
				timedImport('https://esm.sh/@wallet-standard/app@1.1.0'),
				timedImport('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle'),
				timedImport('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle'),
				timedImport('https://esm.sh/@mysten/suins@1.0.0?bundle'),
			]);
			if (results[0].status === 'fulfilled') ({ getWallets } = results[0].value);
			if (results[1].status === 'fulfilled') ({ getJsonRpcFullnodeUrl, SuiJsonRpcClient } = results[1].value);
			if (results[2].status === 'fulfilled') ({ Transaction } = results[2].value);
			if (results[3].status === 'fulfilled') ({ ALLOWED_METADATA, SuinsClient, SuinsTransaction } = results[3].value);
			const failed = results.filter(r => r.status === 'rejected');
			if (failed.length > 0) console.warn('SDK modules failed:', failed.map(r => r.reason?.message));
		}
		${generateWalletSessionJs()}
		window.__suiskiModuleLoaded = true;

		const NAME = ${serializeJson(cleanName)};
		const NETWORK = ${serializeJson(network)};
		const CAN_REGISTER = ${isRegisterable ? 'true' : 'false'};
		const RPC_URLS = { mainnet: 'https://fullnode.mainnet.sui.io:443', testnet: 'https://fullnode.testnet.sui.io:443', devnet: 'https://fullnode.devnet.sui.io:443' };
		const RPC_URL = RPC_URLS[NETWORK] || RPC_URLS.mainnet;
		const SERVICE_FEE_NAME = ${serializeJson(env.SERVICE_FEE_NAME || null)};
		const FACILITATOR_NAME = ${serializeJson(env.DISCOUNT_RECIPIENT_NAME || 'extra.sui')};
		const SUBDOMAINS_PACKAGE = ${serializeJson(env.SUBNAMECAP_SUBDOMAINS_PACKAGE_ID || null)};
		const SUINS_OBJECT = ${serializeJson(env.SUBNAMECAP_SUINS_OBJECT_ID || null)};
		const FEE_JACKET_PACKAGE = ${serializeJson(env.JACKET_FEE_PACKAGE_ID || null)};
		const SINGLE_USE_JACKET_PACKAGE = ${serializeJson(env.JACKET_SINGLE_USE_PACKAGE_ID || null)};
		const NAME_LENGTH = NAME.length;

		// ========== PRICING ==========
		let pricingData = null;
		const registerPriceEl = document.getElementById('register-price');
		const directPriceEl = document.getElementById('direct-price');
		const premiumPriceEl = document.getElementById('premium-price');
		const premiumRowEl = document.getElementById('premium-row');
		const totalPriceEl = document.getElementById('total-price');

			function isValidPricingPayload(pd) {
				const sharedValidator = window.__suiskiIsValidPricingPayload;
				if (typeof sharedValidator === 'function') {
					return sharedValidator(pd);
				}
				const suiPerNs =
					pd && typeof pd.suiPerNs === 'string' ? Number(pd.suiPerNs) : pd && pd.suiPerNs;
				return !!pd &&
					typeof pd === 'object' &&
					pd.directSuiMist != null &&
					pd.discountedSuiMist != null &&
					pd.nsNeededMist != null &&
					Number.isFinite(suiPerNs) &&
					suiPerNs > 0;
			}

		async function fetchEnhancedPricing() {
			try {
				const pricingRes = await fetch('/api/pricing?domain=' + encodeURIComponent(NAME) + '&years=' + selectedYears);
				if (!pricingRes.ok) {
					throw new Error('Pricing request failed (' + pricingRes.status + ')');
				}
				const data = await pricingRes.json();
				if (!isValidPricingPayload(data)) {
					throw new Error('Invalid pricing payload');
				}
				pricingData = data;
				window.__suiskiPricingData = data;
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
				let priceInMist;
				try {
					priceInMist = await suinsClient.calculatePrice({ name: domain, years: selectedYears });
				} catch {
					priceInMist = await suinsClient.calculatePrice({ domain, years: selectedYears });
				}
				const normalizedPriceInMist =
					typeof priceInMist === 'bigint' ? priceInMist : BigInt(priceInMist);

				pricingData = {
					directSuiMist: String(normalizedPriceInMist),
					discountedSuiMist: String((normalizedPriceInMist * 80n) / 100n),
					nsNeededMist: String((normalizedPriceInMist * 75n * 50n) / 1000n),
					savingsMist: String((normalizedPriceInMist * 20n) / 100n),
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
				window.__suiskiPricingData = pricingData;

				updatePriceDisplay();
				updateRegisterButton();
			} catch (e2) {
				console.error('SDK pricing also failed:', e2);
				if (!isValidPricingPayload(pricingData) && registerPriceEl) registerPriceEl.textContent = '-- SUI';
			}
		}

		function updatePriceDisplay() {
				if (!isValidPricingPayload(pricingData)) return;

				const directMist = Number(pricingData.directSuiMist);
				const discountedMist = Number(pricingData.discountedSuiMist);
				if (!Number.isFinite(directMist) || !Number.isFinite(discountedMist)) return;
				const directSui = directMist / 1e9;
				const discountedSui = discountedMist / 1e9;
				const savingsPercent = pricingData.savingsPercent || 25;
				const premiumUsd = pricingData.breakdown?.premiumUsd || 0;
				const suiPriceUsd = pricingData.breakdown?.suiPriceUsd || 1;

				const savingsBadge = document.getElementById('savings-badge');
				const savingsPercentEl = document.getElementById('savings-percent');
				const discountedPriceEl = document.getElementById('discounted-price');
				const priceUsdEl = document.getElementById('register-price-usd');
				const standardLabelEl = document.getElementById('standard-price-label');

				if (standardLabelEl) {
					standardLabelEl.textContent = NAME_LENGTH + '-char list price';
				}

				if (directPriceEl) {
					directPriceEl.textContent = directSui.toFixed(2) + ' SUI';
					directPriceEl.classList.add('strikethrough');
				}

				if (savingsBadge) savingsBadge.style.display = 'inline-flex';
				if (savingsPercentEl) savingsPercentEl.textContent = '-' + Math.round(savingsPercent) + '%';

				const savingsSui = directSui - discountedSui;
				const savingsSuiEl = document.getElementById('savings-sui-amount');
				if (savingsSuiEl) savingsSuiEl.textContent = savingsSui.toFixed(2) + ' SUI';
				if (discountedPriceEl) discountedPriceEl.textContent = '-' + savingsSui.toFixed(2) + ' SUI';

				if (premiumUsd > 0 && premiumRowEl && premiumPriceEl) {
					const premiumSui = premiumUsd / suiPriceUsd;
					premiumRowEl.style.display = 'flex';
					premiumPriceEl.textContent = '+' + premiumSui.toFixed(2) + ' SUI';
				} else if (premiumRowEl) {
					premiumRowEl.style.display = 'none';
				}

				if (totalPriceEl) totalPriceEl.textContent = discountedSui.toFixed(2) + ' SUI';
				if (registerPriceEl) registerPriceEl.textContent = discountedSui.toFixed(2) + ' SUI';

				const discountedUsd = discountedSui * suiPriceUsd;
				const yearLabel = selectedYears === 1 ? '1 year' : selectedYears + ' years';
				if (priceUsdEl) priceUsdEl.textContent = '~$' + discountedUsd.toFixed(2) + ' USD \u00b7 ' + yearLabel;
			}

		// ========== REGISTRATION OPTIONS ==========
		let selectedYears = 1;
		let setPrimary = true;
		let customTarget = null;
		let avatarUrl = null;
		let contentHash = null;
		var createSubnameCap = false;
		var jacketType = 'none';
		var leafFee = null;
		var feeRecipient = null;
		var singleUseRecipient = null;

		if (isValidPricingPayload(window.__suiskiPricingData)) {
			pricingData = window.__suiskiPricingData;
			updatePriceDisplay();
		}

		const durationPills = document.getElementById('duration-pills');
		const optPrimary = document.getElementById('opt-primary');
		const optCustomTarget = document.getElementById('opt-custom-target');
		const customTargetRow = document.getElementById('custom-target-row');
		const optTargetAddress = document.getElementById('opt-target-address');
		const optAvatar = document.getElementById('opt-avatar');
		const optContentHash = document.getElementById('opt-content-hash');

		if (durationPills) {
			durationPills.addEventListener('click', (e) => {
				const pill = e.target.closest('.duration-pill');
				if (!pill) return;
				const years = parseInt(pill.dataset.years, 10);
				if (years === selectedYears) return;
				selectedYears = years;
				durationPills.querySelectorAll('.duration-pill').forEach(p => p.classList.remove('active'));
				pill.classList.add('active');
				fetchEnhancedPricing();
			});
		}

		if (optPrimary) {
			optPrimary.addEventListener('change', () => {
				setPrimary = optPrimary.checked;
			});
		}

		if (optCustomTarget) {
			optCustomTarget.addEventListener('change', () => {
				const isCustom = optCustomTarget.checked;
				if (customTargetRow) customTargetRow.classList.toggle('visible', isCustom);
				if (isCustom) {
					setPrimary = false;
					if (optPrimary) { optPrimary.checked = false; optPrimary.disabled = true; }
				} else {
					customTarget = null;
					if (optTargetAddress) optTargetAddress.value = '';
					if (optPrimary) { optPrimary.disabled = false; }
				}
			});
		}

		if (optTargetAddress) {
			optTargetAddress.addEventListener('input', () => {
				const val = optTargetAddress.value.trim();
				customTarget = val || null;
			});
		}

		if (optAvatar) {
			optAvatar.addEventListener('input', () => {
				const val = optAvatar.value.trim();
				avatarUrl = val || null;
			});
		}

		if (optContentHash) {
			optContentHash.addEventListener('input', () => {
				const val = optContentHash.value.trim();
				contentHash = val || null;
			});
		}

		const subnameCapSection = document.getElementById('subname-cap-section');
		const optSubnameCap = document.getElementById('opt-subname-cap');
		const jacketOptions = document.getElementById('jacket-options');
		const jacketTypePills = document.getElementById('jacket-type-pills');
		const jacketFeeConfig = document.getElementById('jacket-fee-config');
		const jacketSingleUseConfig = document.getElementById('jacket-single-use-config');
		const optLeafFee = document.getElementById('opt-leaf-fee');
		const optFeeRecipient = document.getElementById('opt-fee-recipient');
		const optSingleUseRecipient = document.getElementById('opt-single-use-recipient');

		if (SUBDOMAINS_PACKAGE && SUINS_OBJECT && subnameCapSection) {
			subnameCapSection.style.display = 'flex';
		}

		if (optSubnameCap) {
			optSubnameCap.addEventListener('change', () => {
				createSubnameCap = optSubnameCap.checked;
				if (jacketOptions) jacketOptions.style.display = createSubnameCap ? 'block' : 'none';
			});
		}

		if (jacketTypePills) {
			jacketTypePills.addEventListener('click', (e) => {
				const pill = e.target.closest('.jacket-pill');
				if (!pill) return;
				jacketType = pill.dataset.jacket;
				jacketTypePills.querySelectorAll('.jacket-pill').forEach(p => p.classList.remove('active'));
				pill.classList.add('active');
				if (jacketFeeConfig) jacketFeeConfig.classList.toggle('visible', jacketType === 'fee');
				if (jacketSingleUseConfig) jacketSingleUseConfig.classList.toggle('visible', jacketType === 'single-use');
			});
		}

		if (optLeafFee) {
			optLeafFee.addEventListener('input', () => { leafFee = optLeafFee.value.trim() || null; });
		}
		if (optFeeRecipient) {
			optFeeRecipient.addEventListener('input', () => { feeRecipient = optFeeRecipient.value.trim() || null; });
		}
		if (optSingleUseRecipient) {
			optSingleUseRecipient.addEventListener('input', () => { singleUseRecipient = optSingleUseRecipient.value.trim() || null; });
		}

		const avatarToggle = document.getElementById('avatar-toggle');
		const avatarInputRow = document.getElementById('avatar-input-row');
		if (avatarToggle && avatarInputRow) {
			avatarToggle.addEventListener('click', () => {
				avatarInputRow.classList.toggle('visible');
			});
		}

		const contentHashToggle = document.getElementById('content-hash-toggle');
		const contentHashInputRow = document.getElementById('content-hash-input-row');
		if (contentHashToggle && contentHashInputRow) {
			contentHashToggle.addEventListener('click', () => {
				contentHashInputRow.classList.toggle('visible');
			});
		}

		const savingsBadgeEl = document.getElementById('savings-badge');
		if (savingsBadgeEl) {
			savingsBadgeEl.addEventListener('click', () => {
				if (!connectedAddress) { openWalletModal(); return; }
				includeDiscountTransfer = !includeDiscountTransfer;
				savingsBadgeEl.classList.toggle('active', includeDiscountTransfer);
				updateRegisterButton();
			});
		}

		fetchEnhancedPricing();

		// ========== WALLET CONNECTION ==========
			const globalWalletWidget = document.getElementById('global-wallet-widget');
			const globalWalletBtn = document.getElementById('global-wallet-btn');
			const globalWalletProfileBtn = document.getElementById('global-wallet-profile-btn');
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
			let resolvedPrimaryName = null;
			let includeDiscountTransfer = false;
			let facilitatorAddress = '';

		function isLikelySuiAddress(address) {
			return Boolean(address && typeof address === 'string' && address.startsWith('0x') && address.length >= 10);
		}

		async function resolveFacilitatorAddress(suinsClient) {
			if (isLikelySuiAddress(facilitatorAddress)) return facilitatorAddress;
			try {
				const record = await suinsClient.getNameRecord(FACILITATOR_NAME);
				const resolved = typeof record?.targetAddress === 'string' ? record.targetAddress : '';
				if (isLikelySuiAddress(resolved)) {
					facilitatorAddress = resolved;
					return resolved;
				}
			} catch (error) {
				console.log('Failed to resolve facilitator address:', error?.message || error);
			}
			return connectedAddress || '';
		}

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
			const isSuiCapableWallet = (wallet) => {
				if (!wallet) return false;
				const features = wallet.features || {};
				const hasSuiChain = Array.isArray(wallet.chains) && wallet.chains.some(chain => chain.startsWith('sui:'));
				const hasConnect = !!(features['standard:connect'] || wallet.connect);
				const hasSuiTxFeature = !!(
					features['sui:signAndExecuteTransactionBlock'] ||
					features['sui:signAndExecuteTransaction'] ||
					features['sui:signTransaction'] ||
					wallet.signAndExecuteTransactionBlock ||
					wallet.signAndExecuteTransaction ||
					wallet.signTransaction
				);
				return hasSuiChain || (hasConnect && hasSuiTxFeature);
			};

			// First, try wallet-standard registry
			if (walletsApi) {
				try {
					const standardWallets = walletsApi.get();
					for (const wallet of standardWallets) {
						if (isSuiCapableWallet(wallet)) {
							wallets.push(wallet);
							seenNames.add(wallet.name);
						}
					}
				} catch (e) {
					console.log('Error getting wallets from standard:', e);
				}
			}

			// Fallback: scan registry exposed by some wallet injectors
			const injectedWallets = Array.isArray(window.__sui_wallets__) ? window.__sui_wallets__ : [];
			for (const wallet of injectedWallets) {
				if (!wallet || !isSuiCapableWallet(wallet)) continue;
				const walletName = wallet.name || 'Sui Wallet';
				if (seenNames.has(walletName)) continue;
				wallets.push(wallet);
				seenNames.add(walletName);
			}

			// Fallback: check window globals for common Sui wallets
			const windowWallets = [
				{ check: () => window.phantom?.sui, name: 'Phantom', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNTM0QkI1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNTUxQkY5Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9InVybCgjYSkiIHJ4PSIyNCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMTAuNCw2NC4xYy0uMy0xNS44LTEyLjQtMjguMi0yNy4zLTI4LjVIMjcuNmMtMy4yLDAtNS44LDIuNi01LjgsNS44djg1LjRjMCwxLjQuNCwyLjguNiw0LjIuMi40LjQsLjguNSwxLjNsMCwwYy4xLjMuMi43LjQsMS4xLjIuNS41LDEsLjgsMS41LjMuNi43LDEuMSwxLjEsMS43bDAsMGMuNS43LDEuMSwxLjMsMS43LDEuOWwwLDBjLjcuNywxLjUsMS4zLDIuMywxLjhsLjEuMWMuOC41LDEuNiwuOSwyLjUsMS4yLjMuMS42LjIuOS4zaDBoMC4xYy42LjIsMS4yLjMsMS44LjRoMGMuMSwwLC4yLDAsLjMsMCwuNS4xLDEuMS4xLDEuNi4xaDYxLjljMy4yLDAsNS44LTIuNiw1LjgtNS44VjY0LjFoMFoiLz48L3N2Zz4=' },
				{ check: () => window.suiWallet, name: 'Sui Wallet', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiM2RkJDRjAiIHJ4PSI4Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTI4LjYsMTUuM2MtLjktMy4yLTQuNi01LjUtOS4yLTUuNXMtOC4zLDIuMy05LjIsNS41Yy0uMi44LS4zLDEuNi0uMywyLjRzLjEsMS43LjMsMi41Yy45LDMuMiw0LjYsNS41LDkuMiw1LjVzOC4zLTIuMyw5LjItNS41Yy4yLS44LjMtMS42LjMtMi41cy0uMS0xLjYtLjMtMi40WiIvPjxwYXRoIGZpbGw9IiM2RkJDRjAiIGQ9Ik0xOS40LDE0LjVjLTIuNCwwLTQuMywxLjQtNC4zLDMuMXMxLjksMy4xLDQuMywzLjEsNC4zLTEuNCw0LjMtMy4xLTEuOS0zLjEtNC4zLTMuMVoiLz48L3N2Zz4=' },
				{ check: () => window.slush, name: 'Slush', icon: 'https://slush.app/favicon.ico' },
				{ check: () => window.suiet, name: 'Suiet', icon: 'https://suiet.app/favicon.ico' },
				{ check: () => window.martian?.sui, name: 'Martian', icon: 'https://martianwallet.xyz/favicon.ico' },
				{ check: () => window.ethos, name: 'Ethos', icon: 'https://ethoswallet.xyz/favicon.ico' },
				{ check: () => window.okxwallet?.sui, name: 'OKX Wallet', icon: 'https://static.okx.com/cdn/assets/imgs/226/EB771A4D4E5CC234.png' },
			];

			for (const wc of windowWallets) {
				try {
					const wallet = wc.check();
					if (wallet && !seenNames.has(wc.name)) {
						if (!isSuiCapableWallet(wallet)) continue;
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
				connectWalletSession(wallet.name, connectedAddress);

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
			disconnectWalletSession();
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

			function getWalletProfileHref() {
				if (resolvedPrimaryName) {
					return 'https://' + encodeURIComponent(resolvedPrimaryName) + '.sui.ski';
				}
				return 'https://sui.ski';
			}

			function updateWalletProfileButton() {
				if (!globalWalletProfileBtn) return;
				const href = getWalletProfileHref();
				globalWalletProfileBtn.dataset.href = href;
				globalWalletProfileBtn.title = resolvedPrimaryName
					? 'View my primary profile'
					: 'Go to sui.ski';
			}

			function updateWalletUI() {
				if (!connectedAddress) {
					resolvedPrimaryName = null;
					globalWalletBtn.classList.remove('connected');
					globalWalletText.textContent = 'Connect';
					globalWalletDropdown.innerHTML = '';
					updateWalletProfileButton();
				} else {
					const shortAddr = connectedAddress.slice(0, 8) + '...' + connectedAddress.slice(-6);
					const lookupAddress = connectedAddress;
					resolvedPrimaryName = null;
					globalWalletBtn.classList.add('connected');
					globalWalletText.textContent = shortAddr;
					updateWalletProfileButton();

						fetchPrimaryName(lookupAddress).then(name => {
							if (name && connectedAddress && connectedAddress === lookupAddress) {
								resolvedPrimaryName = name.replace(/\\.sui$/i, '');
								globalWalletText.textContent = '@' + name.replace(/\\.sui$/, '');
								updateWalletProfileButton();
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
				if (isValidPricingPayload(pricingData)) {
					const discountedSui = Number(pricingData.discountedSuiMist) / 1e9;
					priceText = discountedSui.toFixed(2) + ' SUI';
				}
				const yearSuffix = selectedYears === 1 ? ' · 1 yr' : ' · ' + selectedYears + ' yrs';
				registerBtnText.textContent = 'Register ' + NAME + '.sui for ' + priceText + yearSuffix;
				registerBtn.classList.remove('compact');
			} else {
				registerBtnText.textContent = 'Connect Wallet';
				registerBtn.classList.add('compact');
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

		function renderTxExplorerChoices(digest) {
			const encodedDigest = encodeURIComponent(String(digest || ''));
			if (!encodedDigest) return '';

			const explorerLinks = [
				{
					label: 'Suiscan',
					url: 'https://suiscan.xyz/' + NETWORK + '/tx/' + encodedDigest,
				},
				{
					label: 'Sui Explorer',
					url: 'https://suiexplorer.com/txblock/' + encodedDigest + '?network=' + NETWORK,
				},
			];

			if (NETWORK === 'mainnet') {
				explorerLinks.push({
					label: 'Suivision',
					url: 'https://suivision.xyz/txblock/' + encodedDigest,
				});
			}

			return '<div style="margin: 12px 0 8px; text-align: center;">' +
				'<div style="color: var(--muted); font-size: 0.85rem; margin-bottom: 6px;">Choose explorer:</div>' +
				'<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center;">' +
				explorerLinks.map((link) =>
					'<a href="' + link.url + '" target="_blank" rel="noopener noreferrer" style="color: var(--accent); text-decoration: underline;">View on ' + link.label + '</a>'
				).join('<span style="color: var(--muted);">•</span>') +
				'</div>' +
			'</div>';
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

		function prependSwapToTx(tx, swapInfo, sender) {
			let tokenCoin;
			if (swapInfo.coins.length === 1) {
				tokenCoin = tx.object(swapInfo.coins[0].coinObjectId);
			} else {
				tokenCoin = tx.object(swapInfo.coins[0].coinObjectId);
				tx.mergeCoins(tokenCoin, swapInfo.coins.slice(1).map(c => tx.object(c.coinObjectId)));
			}

			const [tokenToSell] = tx.splitCoins(tokenCoin, [tx.pure.u64(swapInfo.amountToSell)]);

			const [suiForDeep] = tx.splitCoins(tx.gas, [tx.pure.u64(SUI_FOR_DEEP_SWAP)]);
			const [zeroDeep] = tx.moveCall({
				target: '0x2::coin::zero',
				typeArguments: [DEEP_TYPE],
			});
			const [deepFeeCoin, dsSuiLeft, dsDeepLeft] = tx.moveCall({
				target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
				typeArguments: [DEEP_TYPE, SUI_TYPE],
				arguments: [
					tx.object(DEEPBOOK_DEEP_SUI_POOL),
					suiForDeep,
					zeroDeep,
					tx.pure.u64(MIN_DEEP_OUT),
					tx.object(CLOCK_OBJECT),
				],
			});
			tx.transferObjects([dsSuiLeft, dsDeepLeft], sender);

			let swappedSui;
			if (!swapInfo.isDirect) {
				const [tokenLeft1, usdcOut, deepLeft1] = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::swap_exact_base_for_quote',
					typeArguments: [swapInfo.type, USDC_TYPE],
					arguments: [
						tx.object(swapInfo.usdcPoolAddress),
						tokenToSell,
						deepFeeCoin,
						tx.pure.u64(0n),
						tx.object(CLOCK_OBJECT),
					],
				});
				const [suiOut, usdcLeft, deepLeft2] = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
					typeArguments: [SUI_TYPE, USDC_TYPE],
					arguments: [
						tx.object(DEEPBOOK_SUI_USDC_POOL),
						usdcOut,
						deepLeft1,
						tx.pure.u64(swapInfo.minSuiOut),
						tx.object(CLOCK_OBJECT),
					],
				});
				swappedSui = suiOut;
				tx.transferObjects([tokenLeft1, usdcLeft, deepLeft2, tokenCoin], sender);
			} else if (swapInfo.suiIsBase) {
				const [suiOut, tokenLeft, deepLeft2] = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::swap_exact_quote_for_base',
					typeArguments: [SUI_TYPE, swapInfo.type],
					arguments: [
						tx.object(swapInfo.pool),
						tokenToSell,
						deepFeeCoin,
						tx.pure.u64(swapInfo.minSuiOut),
						tx.object(CLOCK_OBJECT),
					],
				});
				swappedSui = suiOut;
				tx.transferObjects([tokenLeft, deepLeft2, tokenCoin], sender);
			} else {
				const [tokenLeft, suiOut, deepLeft2] = tx.moveCall({
					target: DEEPBOOK_PACKAGE + '::pool::swap_exact_base_for_quote',
					typeArguments: [swapInfo.type, SUI_TYPE],
					arguments: [
						tx.object(swapInfo.pool),
						tokenToSell,
						deepFeeCoin,
						tx.pure.u64(swapInfo.minSuiOut),
						tx.object(CLOCK_OBJECT),
					],
				});
				swappedSui = suiOut;
				tx.transferObjects([tokenLeft, deepLeft2, tokenCoin], sender);
			}
			tx.mergeCoins(tx.gas, [swappedSui]);
		}

		async function findBestSwapForSui(suiClient, shortfallMist, sender) {
			const pools = await fetch('/api/deepbook-pools').then(r => r.json()).catch(() => []);
			if (!pools.length) return null;

			const balanceChecks = pools.map(p =>
				suiClient.getBalance({ owner: sender, coinType: p.coinType })
					.catch(() => ({ totalBalance: '0' }))
			);
			const balances = await Promise.all(balanceChecks);

			const candidates = [];
			for (let i = 0; i < pools.length; i++) {
				const pool = pools[i];
				const bal = BigInt(balances[i].totalBalance);
				if (bal <= 0n) continue;
				const tokenAmount = Number(bal) / Math.pow(10, pool.decimals);
				const suiValue = tokenAmount * pool.suiPerToken;
				candidates.push({ pool, balance: bal, suiValue });
			}

			candidates.sort((a, b) => {
				if (a.pool.isDirect && !b.pool.isDirect) return -1;
				if (!a.pool.isDirect && b.pool.isDirect) return 1;
				return b.suiValue - a.suiValue;
			});

			for (const candidate of candidates) {
				const pool = candidate.pool;
				const shortfallSui = Number(shortfallMist) / 1e9;
				const tokensNeeded = shortfallSui / pool.suiPerToken;
				const tokenMistNeeded = BigInt(Math.ceil(tokensNeeded * Math.pow(10, pool.decimals)));
				const tokenMistWithBuffer = tokenMistNeeded * 130n / 100n;
				const amountToSell = tokenMistWithBuffer > candidate.balance ? candidate.balance : tokenMistWithBuffer;

				const expectedSui = Number(amountToSell) / Math.pow(10, pool.decimals) * pool.suiPerToken;
				const minSuiOut = BigInt(Math.floor(expectedSui * 0.80 * 1e9));

				if (minSuiOut <= 0n) continue;

				const coins = await suiClient.getCoins({ owner: sender, coinType: pool.coinType });
				if (!coins.data.length) continue;

				return {
					type: pool.coinType,
					pool: pool.poolAddress,
					name: pool.name,
					coins: coins.data,
					amountToSell,
					minSuiOut,
					needsDeepFee: true,
					isDirect: pool.isDirect,
					suiIsBase: pool.suiIsBase,
					usdcPoolAddress: pool.usdcPoolAddress,
				};
			}
			return null;
		}

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
		function bytesToBase64(bytes) {
			return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
		}
		function getPhantomProvider() {
			const provider = window.phantom?.sui;
			return provider?.isPhantom ? provider : null;
		}
		async function executeWalletTx(tx, client) {
			const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
			const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];
			const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];

			const txBytes = await tx.build({ client });

			if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
				return await signExecBlockFeature.signAndExecuteTransactionBlock({
					transactionBlock: txBytes,
					account: connectedAccount,
					chain,
				});
			}

			if (signExecFeature?.signAndExecuteTransaction) {
				return await signExecFeature.signAndExecuteTransaction({
					transaction: Transaction.from(txBytes),
					account: connectedAccount,
					chain,
				});
			}

			const phantomProvider = getPhantomProvider();
			if (phantomProvider?.signAndExecuteTransactionBlock) {
				try {
					return await phantomProvider.signAndExecuteTransactionBlock({
						transactionBlock: txBytes,
					});
				} catch (e) {
					return await phantomProvider.signAndExecuteTransactionBlock({
						transactionBlock: bytesToBase64(txBytes),
					});
				}
			}

			if (window.suiWallet?.signAndExecuteTransactionBlock) {
				return await window.suiWallet.signAndExecuteTransactionBlock({
					transactionBlock: txBytes,
				});
			}

			throw new Error('No compatible Sui wallet found');
		}
		async function executeWalletTxFromBytes(txBytes) {
			const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
			const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];
			const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];

			if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
				return await signExecBlockFeature.signAndExecuteTransactionBlock({
					transactionBlock: txBytes,
					account: connectedAccount,
					chain,
				});
			}

			if (signExecFeature?.signAndExecuteTransaction) {
				return await signExecFeature.signAndExecuteTransaction({
					transaction: Transaction.from(txBytes),
					account: connectedAccount,
					chain,
				});
			}

			const phantomProvider = getPhantomProvider();
			if (phantomProvider?.signAndExecuteTransactionBlock) {
				try {
					return await phantomProvider.signAndExecuteTransactionBlock({
						transactionBlock: txBytes,
					});
				} catch (e) {
					return await phantomProvider.signAndExecuteTransactionBlock({
						transactionBlock: bytesToBase64(txBytes),
					});
				}
			}

			if (window.suiWallet?.signAndExecuteTransactionBlock) {
				return await window.suiWallet.signAndExecuteTransactionBlock({
					transactionBlock: txBytes,
				});
			}

			throw new Error('No compatible Sui wallet found');
		}

		function updateTxPreviewUI({ suiAmount, nsAmount, domain, recipient, gasFee, simulationOk, error }) {
			const txSwapRow = document.getElementById('tx-swap-row');
			const txPaymentAmount = document.getElementById('tx-payment-amount');
			const txDurationEl = document.getElementById('tx-duration');
			const txPrimaryRow = document.getElementById('tx-primary-row');
			const txPrimaryName = document.getElementById('tx-primary-name');
			const txAvatarRow = document.getElementById('tx-avatar-row');
			const txAvatarUrl = document.getElementById('tx-avatar-url');
			const txContentRow = document.getElementById('tx-content-row');
			const txContentValue = document.getElementById('tx-content-value');

			if (nsAmount && txSwapAmount && txNsAmount && txSwapRow) {
				txSwapAmount.textContent = suiAmount;
				txNsAmount.textContent = nsAmount;
				txSwapRow.style.display = 'flex';
			} else if (txSwapRow) {
				txSwapRow.style.display = 'none';
			}
			if (txPaymentAmount) txPaymentAmount.textContent = suiAmount;
			if (txDomainName) txDomainName.textContent = domain;
			if (txDurationEl) txDurationEl.textContent = selectedYears === 1 ? '1 year' : selectedYears + ' years';
			if (txRecipient) txRecipient.textContent = recipient.slice(0, 8) + '...' + recipient.slice(-6);
			if (txTotalSui) txTotalSui.textContent = suiAmount;
			if (txGasFee) txGasFee.textContent = gasFee;
			if (txReceiveNft) txReceiveNft.textContent = domain + '.sui NFT';

			if (txPrimaryRow) {
				const showPrimary = setPrimary && !customTarget;
				txPrimaryRow.style.display = showPrimary ? 'flex' : 'none';
				if (txPrimaryName) txPrimaryName.textContent = domain;
			}
			if (txAvatarRow) {
				txAvatarRow.style.display = avatarUrl ? 'flex' : 'none';
				if (txAvatarUrl && avatarUrl) txAvatarUrl.textContent = avatarUrl.length > 40 ? avatarUrl.slice(0, 37) + '...' : avatarUrl;
			}
			if (txContentRow) {
				txContentRow.style.display = contentHash ? 'flex' : 'none';
				if (txContentValue && contentHash) txContentValue.textContent = contentHash.length > 40 ? contentHash.slice(0, 37) + '...' : contentHash;
			}

			const txSubnameCapRow = document.getElementById('tx-subnamecap-row');
			const txSubnameCapDesc = document.getElementById('tx-subnamecap-desc');
			if (txSubnameCapRow) {
				txSubnameCapRow.style.display = createSubnameCap ? 'flex' : 'none';
				if (txSubnameCapDesc && createSubnameCap) {
					if (jacketType === 'fee') {
						txSubnameCapDesc.textContent = 'Fee Jacket (' + (leafFee || '0') + ' SUI per subname) \u2192 you';
					} else if (jacketType === 'single-use') {
						const target = singleUseRecipient || 'you';
						txSubnameCapDesc.textContent = 'Single-use voucher \u2192 ' + (target.length > 20 ? target.slice(0, 17) + '...' : target);
					} else {
						txSubnameCapDesc.textContent = 'Raw SubnameCap \u2192 you';
					}
				}
			}

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

			if (!isValidPricingPayload(pricingData)) {
				showRegisterStatus('Loading pricing...', 'info');
				await fetchEnhancedPricing();
				if (!isValidPricingPayload(pricingData)) {
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

				const facilitator = await resolveFacilitatorAddress(suinsClient);
				const facilitatorRecipient = isLikelySuiAddress(facilitator)
					? facilitator
					: connectedAddress;

				const discountSuiMist = includeDiscountTransfer
					? BigInt(pricingData.savingsMist || '0')
					: 0n;

				const totalSuiNeededForReg = suiForNsSwap + SUI_FOR_DEEP_SWAP + 50_000_000n + discountSuiMist;
				const suiBalRes = await suiClient.getBalance({ owner: connectedAddress, coinType: SUI_TYPE });
				const suiAvailableForReg = BigInt(suiBalRes.totalBalance);

				if (suiAvailableForReg < totalSuiNeededForReg) {
					registerBtnText.textContent = 'Low SUI, checking other tokens...';
					const shortfallMist = totalSuiNeededForReg - suiAvailableForReg;
					const swapInfo = await findBestSwapForSui(suiClient, shortfallMist, connectedAddress);
					if (swapInfo) {
						registerBtnText.textContent = 'Swapping ' + swapInfo.name + ' for SUI...';
						prependSwapToTx(tx, swapInfo, connectedAddress);
					}
					registerBtnText.textContent = 'Building transaction...';
				}

				const splitAmounts = [
					tx.pure.u64(suiForNsSwap),
					tx.pure.u64(SUI_FOR_DEEP_SWAP),
				];
				if (discountSuiMist > 0n) splitAmounts.push(tx.pure.u64(discountSuiMist));
				const splitResults = tx.splitCoins(tx.gas, splitAmounts);
				const suiCoinForNs = splitResults[0];
				const suiCoinForDeep = splitResults[1];

				if (discountSuiMist > 0n) {
					tx.transferObjects([splitResults[2]], tx.pure.address(facilitatorRecipient));
				}

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

				tx.transferObjects([deepLeftoverSui], tx.pure.address(facilitatorRecipient));
				tx.transferObjects([deepLeftoverDeep], connectedAddress);

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

				tx.transferObjects([nsLeftoverSui], tx.pure.address(facilitatorRecipient));
				tx.transferObjects([nsLeftoverDeep], connectedAddress);

				let recipientAddress = connectedAddress;
				if (customTarget) {
					registerBtnText.textContent = 'Resolving recipient...';
					if (customTarget.startsWith('0x') && customTarget.length >= 42) {
						recipientAddress = customTarget;
					} else {
						const targetName = customTarget.endsWith('.sui') ? customTarget : customTarget + '.sui';
						const nameRecord = await suinsClient.getNameRecord(targetName);
						if (!nameRecord?.targetAddress) throw new Error('Could not resolve ' + targetName);
						recipientAddress = nameRecord.targetAddress;
					}
					registerBtnText.textContent = 'Building transaction...';
				}

				const suinsTx = new SuinsTransaction(suinsClient, tx);
				const nft = suinsTx.register({
					domain,
					years: selectedYears,
					coinConfig: nsCoinConfig,
					coin: nsCoin,
					priceInfoObjectId,
				});
				suinsTx.setTargetAddress({
					nft,
					address: recipientAddress,
					isSubname: domain.replace(/\\.sui$/i, '').includes('.'),
				});

				if (setPrimary && !customTarget) {
					suinsTx.setDefault(domain);
				}

				if (avatarUrl) {
					suinsTx.setUserData({
						nft,
						key: ALLOWED_METADATA.avatar,
						value: avatarUrl,
						isSubname: false,
					});
				}

				if (contentHash) {
					suinsTx.setUserData({
						nft,
						key: ALLOWED_METADATA.contentHash,
						value: contentHash,
						isSubname: false,
					});
				}

				if (createSubnameCap && SUBDOMAINS_PACKAGE && SUINS_OBJECT) {
					const capResult = tx.moveCall({
						target: SUBDOMAINS_PACKAGE + '::subdomains::create_subname_cap',
						arguments: [
							tx.object(SUINS_OBJECT),
							nft,
							tx.object(CLOCK_OBJECT),
							tx.pure.bool(true),
							tx.pure.bool(false),
							tx.pure.bool(true),
							tx.pure.bool(false),
							tx.pure.option('u64', null),
							tx.pure.option('u64', null),
							tx.pure.option('u64', null),
						],
					});

					if (jacketType === 'fee' && FEE_JACKET_PACKAGE) {
						const feeMist = Math.round(parseFloat(leafFee || '0') * 1e9);
						const adminCap = tx.moveCall({
							target: FEE_JACKET_PACKAGE + '::fee_jacket::create',
							arguments: [
								capResult,
								tx.pure.u64(feeMist),
								tx.pure.u64(0),
								tx.pure.address(feeRecipient || recipientAddress),
							],
						});
						tx.transferObjects([adminCap], recipientAddress);
					} else if (jacketType === 'single-use' && SINGLE_USE_JACKET_PACKAGE) {
						const jacket = tx.moveCall({
							target: SINGLE_USE_JACKET_PACKAGE + '::single_use_jacket::create',
							arguments: [capResult],
						});
						let resolvedSingleUseRecipient = recipientAddress;
						if (singleUseRecipient) {
							if (singleUseRecipient.startsWith('0x') && singleUseRecipient.length >= 42) {
								resolvedSingleUseRecipient = singleUseRecipient;
							} else {
								const singleUseName = singleUseRecipient.endsWith('.sui') ? singleUseRecipient : singleUseRecipient + '.sui';
								const singleUseRecord = await suinsClient.getNameRecord(singleUseName);
								if (!singleUseRecord?.targetAddress) throw new Error('Could not resolve ' + singleUseName);
								resolvedSingleUseRecipient = singleUseRecord.targetAddress;
							}
						}
						tx.transferObjects([jacket], resolvedSingleUseRecipient);
					} else {
						tx.transferObjects([capResult], recipientAddress);
					}
				}

				tx.transferObjects([nft], recipientAddress);

				let serviceFeeRecipient = connectedAddress;
				if (SERVICE_FEE_NAME) {
					try {
						const feeRecord = await suinsClient.getNameRecord(SERVICE_FEE_NAME);
						if (feeRecord?.targetAddress) serviceFeeRecipient = feeRecord.targetAddress;
					} catch {}
				}
				tx.transferObjects([nsCoin], serviceFeeRecipient);

				tx.setGasBudget(100000000);

				registerBtnText.textContent = 'Waiting for wallet...';

				try {
					const result = await executeWalletTx(tx, suiClient);
					console.log('Transaction result:', result);
					const digest = result.digest || '';

					const yearLabel = selectedYears === 1 ? '1 year' : selectedYears + ' years';
					const primaryNote = (setPrimary && !customTarget) ? ' Primary name set.' : '';
					const recipientNote = customTarget ? ' Sent to ' + escapeHtml(recipientAddress.slice(0, 8)) + '...' : '';

					showRegisterStatus(
						'<div style="text-align: center; margin-bottom: 12px;">' +
						'<strong style="font-size: 1.1rem;">🎉 ' + NAME + '.sui is yours!</strong>' +
						'<div style="color: var(--muted); font-size: 0.85rem; margin-top: 4px;">' + yearLabel + ' registration.' + primaryNote + recipientNote + '</div>' +
						'</div>' +
						renderTxExplorerChoices(digest) +
						'<div style="display: flex; gap: 12px; justify-content: center; align-items: center; margin-top: 8px;">' +
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
				const result = await executeWalletTxFromBytes(pendingTxBytes);

				hideTxPreview();

				if (result.digest) {
					showRegisterStatus('Transaction submitted! Waiting for confirmation...', 'info');

					if (pendingSuiClient) {
						await pendingSuiClient.waitForTransaction({ digest: result.digest });
					}

					const digest = result.digest;
					const confirmYearLabel = selectedYears === 1 ? '1 year' : selectedYears + ' years';
					const confirmPrimaryNote = (setPrimary && !customTarget) ? ' Primary name set.' : '';
					showRegisterStatus(
						'<div style="text-align: center; margin-bottom: 12px;">' +
						'<strong style="font-size: 1.1rem;">🎉 ' + NAME + '.sui is yours!</strong>' +
						'<div style="color: var(--muted); font-size: 0.85rem; margin-top: 4px;">' + confirmYearLabel + ' registration.' + confirmPrimaryNote + '</div>' +
						'</div>' +
						renderTxExplorerChoices(digest) +
						'<div style="display: flex; gap: 12px; justify-content: center; align-items: center; margin-top: 8px;">' +
						'<a href="https://' + NAME + '.sui.ski" style="color: var(--success); text-decoration: underline; font-weight: 600;">Go to ' + NAME + '.sui →</a>' +
						'</div>',
						'success', true);
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
			if (globalWalletProfileBtn) {
				globalWalletProfileBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					window.location.href = globalWalletProfileBtn.dataset.href || 'https://sui.ski';
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
			updateWalletProfileButton();
			updateWalletUI();
			updateRegisterButton();

		(async () => {
			const hint = getWalletSession();
			if (!hint) return;
			await new Promise(r => setTimeout(r, 300));
			const wallets = getSuiWallets();
			const match = wallets.find(w => w.name === hint.walletName);
			if (match) selectWallet(match);
		})();

		// ========== GEAR FAB ==========
		const gearFab = document.getElementById('gear-fab');
		const gearPanel = document.getElementById('gear-panel');
		if (gearFab && gearPanel) {
			gearFab.addEventListener('click', () => {
				gearPanel.classList.toggle('open');
			});
			document.addEventListener('click', (e) => {
				if (!gearPanel.contains(e.target) && !gearFab.contains(e.target)) {
					gearPanel.classList.remove('open');
				}
			});
		}

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
