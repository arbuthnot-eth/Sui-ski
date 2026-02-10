import type { Env } from '../types'
import { generateLogoSvg } from '../utils/og-image'
import { jsonResponse } from '../utils/response'
import { generateSharedWalletMountJs } from '../utils/shared-wallet-js'
import { relaySignedTransaction } from '../utils/transactions'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

interface RegisterSession {
	address: string | null
	walletName: string | null
	verified: boolean
}

export interface RegistrationPageOptions {
	flow?: 'register' | 'register2'
}

export function generateRegistrationPage(
	name: string,
	env: Env,
	session?: RegisterSession,
	options: RegistrationPageOptions = {},
): string {
	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const network = env.SUI_NETWORK || 'mainnet'
	const isRegisterable = cleanName.length >= 3
	const registerFlow = options.flow === 'register2' ? 'register2' : 'register'
	const registerBucket = registerFlow === 'register2' ? 'register-v2' : 'register-v1'
	const serializeJson = (value: unknown) =>
		JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')
	const registrationCardHtml = isRegisterable
		? `<section class="card register-card">
			<div class="header">
				<h1 class="name-heading">
					<span class="name-title">${escapeHtml(cleanName)}<span class="name-tld">.sui</span></span>
					<button type="button" class="primary-star" id="primary-star" aria-label="Set ${escapeHtml(cleanName)}.sui as primary name" aria-pressed="false" title="Set as primary name">☆</button>
				</h1>
				<p class="subtitle">
					<span class="availability-pill">
						<span class="availability-dot" aria-hidden="true"></span>
						<span class="availability-label">Available</span>
					</span>
				</p>
			</div>

				<div class="top-row">
					<div>
						<div class="price" id="price-value">-- <span class="price-unit">SUI</span></div>
						<div class="price-note" id="price-note">Loading pricing...</div>
					</div>
				</div>

				<div class="form">
					<div class="row">
						<div class="field">
							<label for="years">Duration</label>
							<div class="year-stepper" role="group" aria-label="Registration duration">
								<button type="button" class="year-btn" id="years-decrease" aria-label="Decrease duration">-</button>
								<div class="year-display"><span id="years-value">1</span> year</div>
								<button type="button" class="year-btn" id="years-increase" aria-label="Increase duration">+</button>
							</div>
							<input id="years" type="hidden" value="1">
						</div>
						<div class="field">
							<label for="target">Recipient (optional)</label>
							<input id="target" type="text" placeholder="0x... or name.sui">
					</div>
				</div>
				<button class="button" id="register-btn">Connect Wallet</button>
				<div class="status" id="register-status"></div>
			</div>
		</section>`
		: `<section class="card"><div class="header"><h1>${escapeHtml(cleanName)}<span>.sui</span></h1><p class="subtitle">Minimum length is 3 characters.</p></div></section>`
	const discoveryColumnHtml = isRegisterable
		? `<aside class="side-column">
			<section class="side-card better-search-card">
				<div class="panel-head">
					<div class="panel-title">Better Search</div>
					<a class="x402-link" id="x402-link" href="https://www.tradeport.xyz/sui/collection/suins?search=x402" target="_blank" rel="noopener noreferrer">View</a>
				</div>
				<div class="x402-row">
					<div class="x402-name">x402.sui</div>
					<div class="x402-price" id="x402-price">Loading...</div>
				</div>
			</section>
			<section class="side-card suggestions-card">
				<div class="suggestions-head">
					<div class="suggestions-title">AI Suggestions</div>
					<button type="button" class="refresh-btn" id="refresh-suggestions">Refresh</button>
				</div>
				<div class="suggestions-grid" id="suggestions-grid">
					<div class="empty">Loading suggestions...</div>
				</div>
			</section>
		</aside>`
		: ''

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="sui-ski-register-flow" content="${registerFlow}">
	<meta name="sui-ski-register-bucket" content="${registerBucket}">
	<title>${escapeHtml(cleanName)}.sui available | sui.ski</title>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
				:root {
					--bg-0: #050d0b;
					--bg-1: #0a1512;
					--card: rgba(10, 21, 18, 0.92);
					--line: rgba(180, 227, 213, 0.22);
					--text: #e8f7f2;
					--muted: #a6c0b8;
					--accent: #60a5fa;
					--listing-purple: #a855f7;
					--listing-purple-light: #d8b4fe;
					--ski-green: #00a651;
					--ski-green-dark: #008744;
					--ski-green-light: #82e2b3;
					--ski-green-soft: #bff4d8;
					--ski-green-rgb: 0, 166, 81;
					--ok: var(--ski-green);
					--warn: #fbbf24;
					--err: #f87171;
				}
				* { box-sizing: border-box; margin: 0; padding: 0; }
				html {
					scrollbar-color: rgba(var(--ski-green-rgb), 0.82) rgba(7, 20, 16, 0.9);
				}
			::-webkit-scrollbar {
				width: 10px;
				height: 10px;
			}
				::-webkit-scrollbar-track {
					background: rgba(7, 20, 16, 0.88);
				}
				::-webkit-scrollbar-thumb {
					background: linear-gradient(180deg, rgba(var(--ski-green-rgb), 0.95), rgba(var(--ski-green-rgb), 0.8));
					border-radius: 999px;
					border: 2px solid rgba(7, 20, 16, 0.88);
				}
				::-webkit-scrollbar-thumb:hover {
					background: linear-gradient(180deg, rgba(var(--ski-green-rgb), 1), rgba(var(--ski-green-rgb), 0.88));
				}
				body {
					font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
					min-height: 100vh;
					background:
						radial-gradient(90% 70% at 50% -10%, rgba(var(--ski-green-rgb), 0.18) 0%, transparent 50%),
						radial-gradient(70% 60% at 100% 100%, rgba(96, 165, 250, 0.12) 0%, transparent 55%),
						linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%);
				color: var(--text);
					padding: 20px;
					padding-bottom: 82px;
				}
				.container {
					max-width: 1180px;
					margin: 0 auto;
					display: flex;
					flex-direction: column;
					gap: 12px;
				}
				.layout-grid {
					display: grid;
					grid-template-columns: minmax(0, 1.55fr) minmax(310px, 1fr);
					gap: 12px;
					align-items: start;
				}
				.side-column {
					display: grid;
					gap: 10px;
				}
				.side-card {
					background: rgba(10, 21, 18, 0.88);
					border: 1px solid rgba(180, 227, 213, 0.2);
					border-radius: 14px;
					padding: 12px;
				}
			.panel-head {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 8px;
			}
			.panel-title {
				font-size: 0.78rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.06em;
				color: var(--muted);
			}
				.x402-link {
					display: inline-flex;
				align-items: center;
				justify-content: center;
				padding: 4px 10px;
				border-radius: 999px;
					border: 1px solid rgba(96, 165, 250, 0.35);
					background: rgba(96, 165, 250, 0.14);
					color: #9ecbff;
				font-size: 0.72rem;
				font-weight: 700;
				text-decoration: none;
			}
			.x402-row {
				margin-top: 10px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 10px;
			}
			.x402-name {
				font-size: 1rem;
				font-weight: 800;
				color: var(--text);
			}
				.x402-price {
				padding: 5px 10px;
				border-radius: 999px;
					border: 1px solid rgba(168, 85, 247, 0.35);
					background: rgba(168, 85, 247, 0.12);
				color: var(--listing-purple-light);
				font-size: 0.74rem;
				font-weight: 700;
				letter-spacing: 0.02em;
				text-transform: uppercase;
				white-space: nowrap;
			}
				.x402-price.listed {
					border-color: rgba(168, 85, 247, 0.52);
					background: rgba(168, 85, 247, 0.18);
					color: #ead5ff;
				}
		.nav {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 10px;
		}
		.nav-home {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			font-weight: 800;
			color: var(--text);
			text-decoration: none;
		}
		.nav-meta {
			display: inline-flex;
			align-items: center;
			gap: 8px;
		}
		.badge {
			padding: 5px 10px;
			border-radius: 999px;
			font-size: 0.72rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			border: 1px solid var(--line);
			background: rgba(255,255,255,0.04);
			color: var(--muted);
		}
			.flow-badge {
				border-color: rgba(96, 165, 250, 0.45);
				background: rgba(96, 165, 250, 0.14);
				color: #9ecbff;
			}
				.card {
					background: var(--card);
					border: 1px solid var(--line);
					border-radius: 16px;
					padding: 18px;
					box-shadow: 0 18px 42px rgba(0, 0, 0, 0.35);
				}
			body[data-register-flow='register2'] .card {
				border-color: rgba(96, 165, 250, 0.35);
				box-shadow: 0 18px 42px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(96, 165, 250, 0.12);
			}
			.header h1 {
				font-size: clamp(1.8rem, 3.7vw, 2.6rem);
				font-weight: 800;
				overflow-wrap: anywhere;
				letter-spacing: -0.03em;
		}
		.name-heading {
			display: inline-flex;
			align-items: center;
			gap: 10px;
			flex-wrap: wrap;
		}
		.name-title { color: var(--text); }
		.name-tld { color: var(--ok); }
		.primary-star {
			width: 34px;
			height: 34px;
			border-radius: 999px;
			border: 1px solid rgba(148, 163, 184, 0.42);
			background: rgba(148, 163, 184, 0.09);
			color: rgba(148, 163, 184, 0.9);
			font-size: 1.2rem;
			line-height: 1;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: transform 0.12s ease, background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
		}
		.primary-star:hover {
			transform: translateY(-1px);
			background: rgba(148, 163, 184, 0.16);
			border-color: rgba(148, 163, 184, 0.55);
		}
		.primary-star.active {
			color: #ffd700;
			background: rgba(255, 215, 0, 0.2);
			border-color: rgba(255, 215, 0, 0.8);
			box-shadow: 0 0 14px rgba(255, 215, 0, 0.22);
		}
		.subtitle {
			margin-top: 8px;
			font-size: 0.95rem;
			color: var(--muted);
		}
			.availability-pill {
				display: inline-flex;
				align-items: center;
				gap: 8px;
				padding: 4px 12px;
				border-radius: 999px;
				border: 1px solid rgba(var(--ski-green-rgb), 0.42);
				background: rgba(var(--ski-green-rgb), 0.16);
			}
			.availability-dot {
				width: 10px;
				height: 10px;
				border-radius: 50%;
				background: radial-gradient(circle at 35% 35%, #e7faef 0%, var(--ski-green) 80%);
				box-shadow: 0 0 10px rgba(var(--ski-green-rgb), 0.62);
			}
			.availability-label {
				color: var(--ski-green-light);
				font-size: 0.84rem;
				font-weight: 700;
				letter-spacing: 0.02em;
				text-transform: uppercase;
			}
			.top-row {
				display: grid;
				grid-template-columns: 1fr;
				gap: 14px;
				align-items: end;
				margin-top: 12px;
			}
			.price {
				font-size: clamp(1.65rem, 3.8vw, 2.2rem);
				font-weight: 800;
			}
			.price-unit {
				color: #60a5fa;
				font-size: 0.62em;
				font-weight: 700;
				letter-spacing: 0.03em;
				margin-left: 8px;
			}
			.price-decimals {
				font-size: 0.56em;
				font-weight: 700;
				opacity: 0.9;
				margin-left: 2px;
			}
		.price-note {
			font-size: 0.85rem;
			color: var(--muted);
		}
			.price-note.discount {
				display: inline-block;
				margin-top: 8px;
				padding: 4px 12px;
				border-radius: 999px;
				border: 1px solid rgba(var(--ski-green-rgb), 0.36);
				background: rgba(var(--ski-green-rgb), 0.18);
				color: var(--ski-green-light);
				font-weight: 700;
				letter-spacing: 0.02em;
				text-transform: none;
			}
			.form {
				margin-top: 12px;
				display: grid;
				gap: 8px;
			}
			.row {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 8px;
			}
		.field {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
			label {
				font-size: 0.75rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				color: var(--muted);
			}
				input, select {
					width: 100%;
					padding: 9px 11px;
					border-radius: 9px;
					border: 1px solid rgba(255, 255, 255, 0.12);
					background: rgba(255, 255, 255, 0.04);
					color: var(--text);
			}
			.year-stepper {
				display: grid;
				grid-template-columns: 38px 1fr 38px;
				align-items: center;
				gap: 8px;
				padding: 6px;
				border-radius: 11px;
				border: 1px solid rgba(var(--ski-green-rgb), 0.35);
				background: rgba(10, 34, 22, 0.75);
			}
			.year-btn {
				width: 100%;
				height: 34px;
				border-radius: 9px;
				border: 1px solid rgba(var(--ski-green-rgb), 0.48);
				background: rgba(var(--ski-green-rgb), 0.16);
				color: var(--ski-green-light);
				font-size: 1.08rem;
				font-weight: 800;
				line-height: 1;
				cursor: pointer;
			}
			.year-btn:hover {
				background: rgba(var(--ski-green-rgb), 0.24);
			}
			.year-btn:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
			.year-display {
				text-align: center;
				font-size: 0.92rem;
				font-weight: 700;
				color: var(--text);
			}
			input::placeholder { color: #8ea6a0; }
				.button {
					margin-top: 4px;
					width: 100%;
					padding: 12px 14px;
					border-radius: 999px;
					border: 1px solid rgba(var(--ski-green-rgb), 0.58);
					background: linear-gradient(135deg, rgba(14, 56, 36, 0.95), rgba(8, 42, 27, 0.96));
					box-shadow: inset 0 1px 0 rgba(var(--ski-green-rgb), 0.24), 0 0 0 1px rgba(var(--ski-green-rgb), 0.18);
					color: var(--ski-green-light);
					font-weight: 800;
					font-size: 0.94rem;
					cursor: pointer;
				}
			.button:hover { background: linear-gradient(135deg, rgba(16, 67, 42, 0.96), rgba(9, 50, 31, 0.98)); }
			.button:disabled {
				opacity: 0.55;
				cursor: not-allowed;
		}
		.status {
			display: none;
			margin-top: 8px;
			padding: 10px 12px;
			border-radius: 10px;
			font-size: 0.84rem;
		}
		.status.show { display: block; }
		.status.info { background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.3); color: #9ecbff; }
			.status.ok { background: rgba(var(--ski-green-rgb),0.15); border: 1px solid rgba(var(--ski-green-rgb),0.36); color: var(--ski-green-light); }
		.status.err { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.3); color: #ffb0b0; }
				.suggestions-card { border-color: rgba(180, 227, 213, 0.24); }
			.suggestions-head {
				display: flex;
				justify-content: space-between;
			align-items: center;
			gap: 8px;
		}
		.suggestions-title {
			font-size: 0.8rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--muted);
		}
				.refresh-btn {
					padding: 5px 10px;
					border-radius: 999px;
					border: 1px solid rgba(96, 165, 250, 0.44);
					background: rgba(16, 30, 54, 0.82);
					color: #c8dcff;
					font-size: 0.72rem;
					font-weight: 700;
				}
			.refresh-btn:hover { background: rgba(22, 40, 72, 0.9); }
			.suggestions-grid {
				display: grid;
				grid-template-columns: 1fr;
				gap: 7px;
				margin-top: 8px;
			}
				.suggestion {
					padding: 8px;
					border-radius: 10px;
					border: 1px solid rgba(255,255,255,0.12);
					background: rgba(255,255,255,0.03);
				}
		.suggestion-name { font-weight: 700; font-size: 0.86rem; overflow-wrap: anywhere; }
		.suggestion-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 8px;
			margin-top: 5px;
		}
		.suggestion-state {
			font-size: 0.72rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}
			.suggestion-state.available { color: var(--ski-green-light); }
		.suggestion-state.taken { color: #fbbf24; }
		.suggestion-state.error { color: #f87171; }
				.suggestion-link {
					padding: 5px 8px;
					border-radius: 999px;
					font-size: 0.72rem;
					font-weight: 700;
					text-decoration: none;
					border: 1px solid rgba(96,165,250,0.45);
					background: rgba(16, 30, 54, 0.82);
					color: #c7dbff;
				}
			.suggestion-link:hover { background: rgba(22, 40, 72, 0.9); }
				.suggestion-link.available {
					border-color: rgba(var(--ski-green-rgb),0.5);
					background: rgba(12, 52, 33, 0.9);
					color: var(--ski-green-light);
				}
		.empty {
			padding: 10px;
			font-size: 0.82rem;
			color: var(--muted);
			text-align: center;
			border: 1px dashed rgba(255,255,255,0.14);
			border-radius: 10px;
		}
		.wallet-widget {
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 1000;
			display: flex;
			align-items: center;
			gap: 10px;
		}
			.wallet-profile-btn {
				width: 36px;
				height: 36px;
				border-radius: 10px;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				background: rgba(96, 165, 250, 0.12);
				border: 1px solid rgba(96, 165, 250, 0.35);
				padding: 0;
				cursor: pointer;
			}
			.wallet-profile-btn:hover { background: rgba(96, 165, 250, 0.2); }
			.tracker-footer {
				position: fixed;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 900;
				background: rgba(9, 12, 22, 0.94);
				backdrop-filter: blur(10px);
				border-top: 1px solid rgba(var(--ski-green-rgb), 0.35);
			padding: 11px 16px;
			display: flex;
			justify-content: center;
		}
		.tracker-line {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 0.84rem;
			color: #a7b0d8;
			white-space: nowrap;
			overflow-x: auto;
			max-width: 100%;
			scrollbar-width: none;
		}
		.tracker-line::-webkit-scrollbar { display: none; }
		.tracker-price-label { color: #dbe5ff; font-weight: 600; }
		#sui-price { color: var(--ski-green-light); font-weight: 700; }
		.tracker-sep { color: rgba(120, 150, 210, 0.5); }
		.tracker-built-on { color: #96a5d8; }
		.tracker-built-on a {
			color: var(--ski-green-light);
			text-decoration: none;
			font-weight: 600;
		}
		.tracker-built-on a:hover { color: var(--ski-green-soft); }
			@media (max-width: 760px) {
				body { padding: 14px; padding-top: 54px; padding-bottom: 74px; }
				.row { grid-template-columns: 1fr; }
				.layout-grid { grid-template-columns: 1fr; }
				.wallet-widget { top: 12px; right: 12px; }
				.tracker-footer { padding: 10px 8px; }
				.tracker-line { font-size: 0.78rem; }
			}
			@media (max-width: 1020px) {
				.layout-grid { grid-template-columns: 1fr; }
			}
		${generateWalletUiCss()}
	</style>
</head>
<body data-register-flow="${registerFlow}">
	<div id="wk-modal"></div>
	<div class="wallet-widget" id="wallet-widget">
		<button class="wallet-profile-btn" id="wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile">
			${generateLogoSvg(18)}
		</button>
		<div id="wk-widget"></div>
	</div>

	<div class="container">
			<nav class="nav">
				<a class="nav-home" href="https://sui.ski">${generateLogoSvg(22)} sui.ski</a>
				<div class="nav-meta">
					${registerFlow === 'register2' ? '<span class="badge flow-badge">register2</span>' : ''}
				</div>
			</nav>

		<div class="layout-grid">
			${registrationCardHtml}
			${discoveryColumnHtml}
		</div>
	</div>

	<div class="tracker-footer">
		<span class="tracker-line">
			<span class="tracker-price-label">SUI <span id="sui-price">$--</span></span>
			<span class="tracker-sep">·</span>
			<span class="tracker-built-on">
				Built on
				<a href="https://docs.sui.io" target="_blank" rel="noopener">Sui</a>
				<span class="tracker-sep">·</span>
				<a href="https://docs.suins.io" target="_blank" rel="noopener">SuiNS</a>
				<span class="tracker-sep">·</span>
				<a href="https://moveregistry.com/docs" target="_blank" rel="noopener">MVR</a>
				<span class="tracker-sep">·</span>
				<a href="https://docs.sui.io/standards/deepbook" target="_blank" rel="noopener">DeepBook</a>
				<span class="tracker-sep">·</span>
				<a href="https://docs.wal.app" target="_blank" rel="noopener">Walrus</a>
				<span class="tracker-sep">·</span>
				<a href="https://seal-docs.wal.app" target="_blank" rel="noopener">Seal</a>
			</span>
		</span>
	</div>

	<script type="module">
		let SuiJsonRpcClient, Transaction, SuinsClient, SuinsTransaction
		{
			const pickExport = (mod, name) => {
				if (!mod || typeof mod !== 'object') return undefined
				if (name in mod) return mod[name]
				if (mod.default && typeof mod.default === 'object' && name in mod.default) return mod.default[name]
				return undefined
			}
			const SDK_TIMEOUT = 15000
			const timedImport = (url) => Promise.race([
				import(url),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: ' + url)), SDK_TIMEOUT)),
			])
			const results = await Promise.allSettled([
				timedImport('https://esm.sh/@wallet-standard/app@1.1.0'),
				timedImport('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle'),
				timedImport('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle'),
				timedImport('https://esm.sh/@mysten/suins@1.0.0?bundle'),
			])
			if (results[1].status === 'fulfilled') ({ SuiJsonRpcClient } = results[1].value)
			if (results[2].status === 'fulfilled') ({ Transaction } = results[2].value)
			if (results[3].status === 'fulfilled') {
				const suinsModule = results[3].value
				SuinsClient = pickExport(suinsModule, 'SuinsClient')
				SuinsTransaction = pickExport(suinsModule, 'SuinsTransaction')
			}
		}
		if (typeof SuiJsonRpcClient === 'function' && typeof window !== 'undefined') {
			window.SuiJsonRpcClient = SuiJsonRpcClient
		}

		${generateWalletSessionJs()}
		${generateWalletKitJs({ network: env.SUI_NETWORK, autoConnect: true })}
		${generateWalletTxJs()}
		${generateWalletUiJs({ showPrimaryName: true, onConnect: 'onRegisterWalletConnected', onDisconnect: 'onRegisterWalletDisconnected' })}

		const NAME = ${serializeJson(cleanName)}
		const NETWORK = ${serializeJson(network)}
		const REGISTER_FLOW = ${serializeJson(registerFlow)}
		const REGISTER_BUCKET = ${serializeJson(registerBucket)}
		const IS_REGISTERABLE = ${isRegisterable ? 'true' : 'false'}

		const yearsEl = document.getElementById('years')
		const yearsValueEl = document.getElementById('years-value')
		const yearsDecreaseBtn = document.getElementById('years-decrease')
		const yearsIncreaseBtn = document.getElementById('years-increase')
		const targetEl = document.getElementById('target')
		const primaryStarEl = document.getElementById('primary-star')
		const registerBtn = document.getElementById('register-btn')
		const registerStatus = document.getElementById('register-status')
		const priceValue = document.getElementById('price-value')
		const priceNote = document.getElementById('price-note')
		const suiPriceEl = document.getElementById('sui-price')
		const x402PriceEl = document.getElementById('x402-price')
		const x402LinkEl = document.getElementById('x402-link')
		const suggestionsGrid = document.getElementById('suggestions-grid')
		const refreshSuggestionsBtn = document.getElementById('refresh-suggestions')

		let pricingData = null
		const suggestionStatusCache = new Map()
		let wantsPrimaryName = false
		const MIN_YEARS = 1
		const MAX_YEARS = 5

		function formatPrimaryPriceHtml(sui) {
			if (!Number.isFinite(sui) || sui <= 0) return '-- <span class="price-unit">SUI</span>'
			const whole = Math.trunc(sui)
			const fraction = sui - whole
			if (fraction > 0.95) {
				return String(whole + 1) + '<span class="price-unit">SUI</span>'
			}
			const decimals = Math.floor(fraction * 100)
			if (decimals < 5) {
				return String(whole) + '<span class="price-unit">SUI</span>'
			}
			const decimalsText = String(decimals).padStart(2, '0')
			const normalizedDecimals = decimalsText.endsWith('0') ? decimalsText.slice(0, 1) : decimalsText
			return String(whole) + '<span class="price-decimals">.' + normalizedDecimals + '</span><span class="price-unit">SUI</span>'
		}

		function updatePrimaryStarUi() {
			if (!primaryStarEl) return
			primaryStarEl.classList.toggle('active', wantsPrimaryName)
			primaryStarEl.textContent = wantsPrimaryName ? '★' : '☆'
			primaryStarEl.setAttribute('aria-pressed', wantsPrimaryName ? 'true' : 'false')
		}

		function showStatus(message, type = 'info', html = false) {
			if (!registerStatus) return
			registerStatus.className = 'status show ' + type
			if (html) registerStatus.innerHTML = message
			else registerStatus.textContent = message
		}

		function hideStatus() {
			if (!registerStatus) return
			registerStatus.className = 'status'
			registerStatus.textContent = ''
		}

		function getSelectedYears() {
			const years = Number(yearsEl && yearsEl.value ? yearsEl.value : '1')
			if (!Number.isFinite(years)) return MIN_YEARS
			return Math.min(MAX_YEARS, Math.max(MIN_YEARS, Math.floor(years)))
		}

		function setSelectedYears(nextYears) {
			const normalized = Math.min(MAX_YEARS, Math.max(MIN_YEARS, Math.floor(Number(nextYears) || MIN_YEARS)))
			if (yearsEl) yearsEl.value = String(normalized)
			if (yearsValueEl) yearsValueEl.textContent = String(normalized)
			if (yearsDecreaseBtn) yearsDecreaseBtn.disabled = normalized <= MIN_YEARS
			if (yearsIncreaseBtn) yearsIncreaseBtn.disabled = normalized >= MAX_YEARS
		}

		function getConnectedAddress() {
			const conn = SuiWalletKit.$connection.value
			if (!conn) return null
			if (conn.status !== 'connected' && conn.status !== 'session') return null
			return conn.address || null
		}

		function isLikelyAddress(value) {
			return !!value && typeof value === 'string' && value.startsWith('0x') && value.length >= 10
		}

		function parsePriceMist(value) {
			if (typeof value === 'bigint') return value
			if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.floor(value))
			if (typeof value === 'string' && value.trim()) {
				try {
					return BigInt(value)
				} catch {
					return null
				}
			}
			return null
		}

		function getSuiCoinConfig(suinsClient) {
			const coins = suinsClient?.config?.coins || {}
			if (coins.SUI) return coins.SUI
			if (coins.sui) return coins.sui
			const values = Object.values(coins)
			for (const cfg of values) {
				const coinType = String(cfg?.type || cfg?.coinType || '')
				if (coinType.endsWith('::sui::SUI')) return cfg
			}
			return null
		}

		async function resolveAddressOrName(raw, suinsClient) {
			const value = String(raw || '').trim()
			if (!value) return null
			if (isLikelyAddress(value)) return value
			const name = value.endsWith('.sui') ? value : value + '.sui'
			const record = await suinsClient.getNameRecord(name)
			const resolved = record?.targetAddress
			if (!isLikelyAddress(resolved)) {
				throw new Error('Could not resolve recipient name')
			}
			return resolved
		}

		function updateRegisterButton() {
			if (!registerBtn) return
			const address = getConnectedAddress()
			if (!address) {
				registerBtn.textContent = 'Connect Wallet'
				return
			}
			if (pricingData && pricingData.discountedSuiMist) {
				const sui = Number(pricingData.discountedSuiMist) / 1e9
				if (Number.isFinite(sui) && sui > 0) {
					registerBtn.textContent = 'Register for ' + sui.toFixed(2) + ' SUI'
					return
				}
			}
			registerBtn.textContent = 'Register ' + NAME + '.sui'
		}

		async function fetchPricing() {
			if (!IS_REGISTERABLE) return
			const years = getSelectedYears()
			try {
				const response = await fetch('/api/pricing?domain=' + encodeURIComponent(NAME) + '&years=' + years)
				if (!response.ok) throw new Error('Pricing request failed')
				pricingData = await response.json()
				const mist = Number(pricingData?.discountedSuiMist || pricingData?.directSuiMist || 0)
				const sui = mist / 1e9
				if (priceValue) priceValue.innerHTML = formatPrimaryPriceHtml(sui)
				if (priceNote) {
					const rawSavingsMist = Number(pricingData?.savingsMist || 0)
					const directMist = Number(pricingData?.directSuiMist || 0)
					const discountedMist = Number(pricingData?.discountedSuiMist || 0)
					const savingsMist = Number.isFinite(rawSavingsMist) && rawSavingsMist > 0
						? rawSavingsMist
						: (Number.isFinite(directMist) && Number.isFinite(discountedMist) && directMist > discountedMist
							? directMist - discountedMist
							: 0)
					const savingsSui = savingsMist / 1e9
					if (Number.isFinite(savingsSui) && savingsSui > 0) {
						priceNote.classList.add('discount')
						priceNote.textContent = 'SKI saved ' + savingsSui.toFixed(2) + ' SUI'
					} else {
						priceNote.classList.remove('discount')
						priceNote.textContent = years === 1 ? '1 year registration' : years + ' year registration'
					}
				}
				updateRegisterButton()
			} catch (error) {
				if (priceValue) priceValue.innerHTML = '-- <span class="price-unit">SUI</span>'
				if (priceNote) {
					priceNote.classList.remove('discount')
					priceNote.textContent = 'Pricing unavailable'
				}
			}
		}

		async function updateSuiPrice() {
			if (!suiPriceEl) return
			try {
				const res = await fetch('/api/sui-price')
				if (!res.ok) throw new Error('Price request failed')
				const data = await res.json()
				if (data && typeof data.price === 'number' && Number.isFinite(data.price)) {
					suiPriceEl.textContent = '$' + data.price.toFixed(2)
					return
				}
				suiPriceEl.textContent = '$--'
			} catch {
				suiPriceEl.textContent = '$--'
			}
		}

		function formatCompactSuiPrice(suiAmount) {
			if (!Number.isFinite(suiAmount) || suiAmount <= 0) return null
			const units = [
				{ value: 1e9, suffix: 'B' },
				{ value: 1e6, suffix: 'M' },
				{ value: 1e3, suffix: 'K' },
			]
			let scaled = suiAmount
			let suffix = ''
			for (const unit of units) {
				if (suiAmount >= unit.value) {
					scaled = suiAmount / unit.value
					suffix = unit.suffix
					break
				}
			}
			if (scaled >= 100) return String(Math.trunc(scaled)) + suffix + ' SUI'
			const truncatedTenths = Math.floor(scaled * 10) / 10
			return truncatedTenths.toFixed(1) + suffix + ' SUI'
		}

		async function updateX402Listing() {
			if (!x402PriceEl) return
			x402PriceEl.textContent = 'Loading...'
			x402PriceEl.classList.remove('listed')
			try {
				const response = await fetch('/api/marketplace/x402')
				if (!response.ok) throw new Error('Listing request failed')
				const data = await response.json()
				const listingMist = Number(data?.bestListing?.price || 0)
				const tradeportUrl = typeof data?.bestListing?.tradeportUrl === 'string' && data.bestListing.tradeportUrl
					? data.bestListing.tradeportUrl
					: 'https://www.tradeport.xyz/sui/collection/suins?search=x402'
				if (x402LinkEl) x402LinkEl.href = tradeportUrl
				if (Number.isFinite(listingMist) && listingMist > 0) {
					const listingSui = listingMist / 1e9
					const compactPrice = formatCompactSuiPrice(listingSui)
					x402PriceEl.textContent = compactPrice || 'No listing'
					x402PriceEl.classList.add('listed')
					return
				}
				x402PriceEl.textContent = 'No listing'
			} catch {
				x402PriceEl.textContent = 'Unavailable'
			}
		}

		function trackEvent(eventName, payload) {
			try {
				window.dispatchEvent(new CustomEvent(eventName, { detail: payload }))
				if (Array.isArray(window.dataLayer)) {
					window.dataLayer.push({ event: eventName, ...payload })
				}
				if (typeof window.plausible === 'function') {
					window.plausible(eventName, { props: payload })
				}
			} catch {}
		}

		function markRegisterFlowImpression() {
			trackEvent('sui_ski_register_impression', {
				registerFlow: REGISTER_FLOW,
				registerBucket: REGISTER_BUCKET,
				registerName: NAME,
				registerNetwork: NETWORK,
			})
			if (REGISTER_FLOW === 'register2') {
				const currentUrl = new URL(window.location.href)
				if (!currentUrl.searchParams.has('rf')) {
					currentUrl.searchParams.set('rf', '2')
					window.history.replaceState(window.history.state, '', currentUrl.toString())
				}
			}
		}

		function sanitizeCandidate(value) {
			const cleaned = String(value || '').toLowerCase().replace(/\\.sui$/i, '').replace(/[^a-z0-9-]/g, '')
			if (!cleaned || cleaned.length < 3 || cleaned === NAME) return null
			return cleaned
		}

		function buildCandidates(baseName, suggestions) {
			const suffixes = ['ai', 'app', 'hub', 'pro', 'xyz', 'dao', 'labs', 'agent']
			const avoidX402 = !String(baseName || '').toLowerCase().includes('x402')
			const seen = new Set()
			const list = []
			const push = (candidate) => {
				const clean = sanitizeCandidate(candidate)
				if (!clean || seen.has(clean)) return
				if (avoidX402 && clean.includes('x402')) return
				seen.add(clean)
				list.push(clean)
			}
			for (const suggestion of suggestions || []) push(suggestion)
			for (const suffix of suffixes) push(baseName + suffix)
			return list.slice(0, 12)
		}

		async function fetchSuggestions(baseName) {
			try {
				const response = await fetch('/api/suggest-names?q=' + encodeURIComponent(baseName) + '&mode=related')
				if (!response.ok) return [baseName]
				const body = await response.json()
				return Array.isArray(body?.suggestions) ? body.suggestions : [baseName]
			} catch {
				return [baseName]
			}
		}

		async function checkCandidate(name) {
			if (suggestionStatusCache.has(name)) return suggestionStatusCache.get(name)
			try {
				const response = await fetch('/api/resolve?name=' + encodeURIComponent(name))
				if (!response.ok) throw new Error('resolve failed')
				const body = await response.json()
				const status = body?.found ? 'taken' : 'available'
				suggestionStatusCache.set(name, status)
				return status
			} catch {
				suggestionStatusCache.set(name, 'error')
				return 'error'
			}
		}

		function suggestionAction(name, status) {
			const href = 'https://' + encodeURIComponent(name) + '.sui.ski'
			if (status === 'available') return '<a class="suggestion-link available" href="' + href + '">Register</a>'
			return '<a class="suggestion-link" href="' + href + '">View</a>'
		}

		async function loadSuggestions(force = false) {
			if (!suggestionsGrid || !IS_REGISTERABLE) return
			if (force) suggestionStatusCache.clear()
			suggestionsGrid.innerHTML = '<div class="empty">Generating suggestions...</div>'
			const suggested = await fetchSuggestions(NAME)
			const candidates = buildCandidates(NAME, suggested)
			if (candidates.length === 0) {
				suggestionsGrid.innerHTML = '<div class="empty">No suggestions right now.</div>'
				return
			}
			const states = await Promise.all(candidates.map((candidate) => checkCandidate(candidate)))
			let html = ''
			for (let i = 0; i < candidates.length; i++) {
				const candidate = candidates[i]
				const state = states[i]
				const stateLabel = state === 'available' ? 'available' : state === 'taken' ? 'registered' : 'check failed'
				html += '<div class="suggestion">' +
					'<div class="suggestion-name">' + candidate + '.sui</div>' +
					'<div class="suggestion-row">' +
					'<span class="suggestion-state ' + state + '">' + stateLabel + '</span>' +
					suggestionAction(candidate, state) +
					'</div>' +
				'</div>'
			}
			suggestionsGrid.innerHTML = html
		}

		async function registerName() {
			if (!IS_REGISTERABLE || !registerBtn) return
			const address = getConnectedAddress()
			if (!address) {
				SuiWalletKit.openModal()
				return
			}
			if (!SuiJsonRpcClient || !Transaction || !SuinsClient || !SuinsTransaction) {
				showStatus('Wallet SDK not loaded. Refresh and try again.', 'err')
				return
			}

			registerBtn.disabled = true
			hideStatus()
			showStatus('Building transaction...', 'info')

			try {
				const rpcUrls = {
					mainnet: 'https://fullnode.mainnet.sui.io:443',
					testnet: 'https://fullnode.testnet.sui.io:443',
					devnet: 'https://fullnode.devnet.sui.io:443',
				}
				const rpcUrl = rpcUrls[NETWORK] || rpcUrls.mainnet
				const years = getSelectedYears()
				const domain = NAME + '.sui'

				const client = new SuiJsonRpcClient({ url: rpcUrl })
				const suinsClient = new SuinsClient({ client, network: NETWORK })
				const coinConfig = getSuiCoinConfig(suinsClient)
				if (!coinConfig) throw new Error('SUI coin config unavailable')

				let recipient = address
				if (targetEl && targetEl.value.trim()) {
					recipient = await resolveAddressOrName(targetEl.value, suinsClient)
					if (!recipient) throw new Error('Invalid recipient')
				}

				let rawPrice
				try {
					rawPrice = await suinsClient.calculatePrice({ name: domain, years })
				} catch {
					rawPrice = await suinsClient.calculatePrice({ domain, years })
				}
				const priceMist = parsePriceMist(rawPrice)
				if (!priceMist || priceMist <= 0n) throw new Error('Invalid registration price')

				const tx = new Transaction()
				tx.setSender(address)
				tx.setGasBudget(90000000)

				const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)])
				const suinsTx = new SuinsTransaction(suinsClient, tx)
				const nft = suinsTx.register({
					domain,
					years,
					coinConfig,
					coin: paymentCoin,
				})

				suinsTx.setTargetAddress({
					nft,
					address: recipient,
					isSubname: domain.replace(/\\.sui$/i, '').includes('.'),
				})

				if (wantsPrimaryName && recipient !== address) {
					throw new Error('Primary star applies to your connected wallet only. Clear recipient or disable the star.')
				}

				if (wantsPrimaryName) {
					suinsTx.setDefault(domain)
				}

				tx.transferObjects([nft], recipient)

				showStatus('Approve in wallet...', 'info')
				const result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } })
				const digest = result?.digest ? String(result.digest) : ''

				trackEvent('sui_ski_register_success', {
					registerFlow: REGISTER_FLOW,
					registerBucket: REGISTER_BUCKET,
					registerName: NAME,
					registerNetwork: NETWORK,
					txDigest: digest,
				})

				const links = digest
					? '<a href="https://suiscan.xyz/' + NETWORK + '/tx/' + encodeURIComponent(digest) + '" target="_blank" rel="noopener noreferrer">Suiscan</a> · ' +
					  '<a href="https://suiexplorer.com/txblock/' + encodeURIComponent(digest) + '?network=' + NETWORK + '" target="_blank" rel="noopener noreferrer">Explorer</a>'
					: ''
				showStatus(
					'<strong>Registered.</strong> <a href="https://' + NAME + '.sui.ski">Open profile</a>' +
					(digest ? ' · ' + links : ''),
					'ok',
					true,
				)
				registerBtn.textContent = 'Registered'
				registerBtn.disabled = true
			} catch (error) {
				const msg = error && error.message ? error.message : 'Registration failed'
				trackEvent('sui_ski_register_error', {
					registerFlow: REGISTER_FLOW,
					registerBucket: REGISTER_BUCKET,
					registerName: NAME,
					registerNetwork: NETWORK,
					error: String(msg),
				})
				showStatus(msg, 'err')
				registerBtn.disabled = false
				updateRegisterButton()
			}
		}

		window.onRegisterWalletConnected = function() {
			updateRegisterButton()
		}

		window.onRegisterWalletDisconnected = function() {
			updateRegisterButton()
		}

		${generateSharedWalletMountJs({
			network: env.SUI_NETWORK,
			session,
			onConnect: 'onRegisterWalletConnected',
			onDisconnect: 'onRegisterWalletDisconnected',
			profileButtonId: 'wallet-profile-btn',
			profileFallbackHref: 'https://sui.ski',
		})}

		markRegisterFlowImpression()
		updatePrimaryStarUi()
		setSelectedYears(getSelectedYears())
		updateRegisterButton()
		fetchPricing()
		updateSuiPrice()
		updateX402Listing()
		setInterval(updateSuiPrice, 60000)
		setInterval(updateX402Listing, 120000)
		loadSuggestions()

		if (yearsDecreaseBtn) {
			yearsDecreaseBtn.addEventListener('click', () => {
				setSelectedYears(getSelectedYears() - 1)
				fetchPricing()
			})
		}
		if (yearsIncreaseBtn) {
			yearsIncreaseBtn.addEventListener('click', () => {
				setSelectedYears(getSelectedYears() + 1)
				fetchPricing()
			})
		}
		if (primaryStarEl) {
			primaryStarEl.addEventListener('click', () => {
				wantsPrimaryName = !wantsPrimaryName
				updatePrimaryStarUi()
			})
		}
		if (refreshSuggestionsBtn) refreshSuggestionsBtn.addEventListener('click', () => loadSuggestions(true))
		if (registerBtn) registerBtn.addEventListener('click', registerName)
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
