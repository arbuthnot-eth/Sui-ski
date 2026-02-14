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
	const suiIconSvg = '<svg class="price-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg>'
	const registrationCardHtml = isRegisterable
		? `<div class="card-with-stepper">
			<div class="nft-card">
				<div class="nft-top">
					<div class="nft-name-block">
						<div class="nft-name-line"><button type="button" class="primary-star" id="primary-star" aria-label="Set as primary" aria-pressed="false" title="Set as primary name">\u2606</button><span class="nft-name">${escapeHtml(cleanName)}<span class="nft-name-tld">.sui</span></span></div>
					</div>
					<div class="nft-card-wallet" id="nft-card-wallet"></div>
				</div>
				<div class="nft-body">
					<div class="nft-qr-col">
						<div class="nft-price-stack" id="price-value">
							<div class="nft-price-main">
								<span class="price-amount">--</span>
								${suiIconSvg}
							</div>
							<span class="price-usd">\u2248 $--</span>
						</div>
						<span class="nft-chip"><span class="nft-dot"></span>Available</span>
						<canvas class="nft-qr" id="nft-qr" width="140" height="140" title="${escapeHtml(cleanName)}.sui"></canvas>
					</div>
					<div class="nft-logo-col">
						<div class="nft-logo-badge"><svg viewBox="0 0 512 560" fill="none" aria-hidden="true"><defs><linearGradient id="nlg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#b8ffda"/></linearGradient></defs><path d="M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z" fill="url(#nlg)"/><path d="M128 384Q208 348 288 384Q368 420 432 384" stroke="url(#nlg)" stroke-width="24" fill="none" stroke-linecap="round"/><text x="256" y="480" font-family="Inter,system-ui,sans-serif" font-size="90" font-weight="800" fill="url(#nlg)" text-anchor="middle">sui.ski</text></svg></div>
						<div class="nft-discount" id="price-savings"></div>
					</div>
				</div>
			</div>
			<div class="year-stepper-v" role="group" aria-label="Registration duration">
				<button type="button" class="year-btn-v" id="years-increase" aria-label="Increase">+</button>
				<div class="year-display-v"><span id="years-value">1</span><span class="year-unit">yr</span></div>
				<button type="button" class="year-btn-v" id="years-decrease" aria-label="Decrease">\u2212</button>
				<input id="years" type="hidden" value="1">
			</div>
			</div>
			<div class="reg-form">
				<button class="button" id="register-btn">Connect Wallet</button>
				<div class="wallet-balance" id="wallet-balance"></div>
				<div class="status" id="register-status"></div>
			</div>`
		: `<div class="nft-card" style="aspect-ratio:1;justify-content:center;align-items:center;text-align:center;"><span style="font-size:1.6rem;font-weight:800;color:#fff;">${escapeHtml(cleanName)}<span style="color:var(--ski-green);">.sui</span></span><span style="font-size:0.85rem;color:var(--muted);margin-top:8px;">Minimum length is 3 characters.</span></div>`
	const discoveryColumnHtml = ''

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
						--bg-0: #010201;
						--bg-1: #030806;
						--card: rgba(3, 10, 8, 0.9);
						--line: rgba(130, 255, 190, 0.24);
						--text: #ebfff4;
						--muted: #8fb9a3;
						--accent: #49da91;
						--listing-purple: #a855f7;
						--listing-purple-light: #d8b4fe;
						--ski-green: #49da91;
						--ski-green-dark: #27bd74;
						--ski-green-light: #b8ffda;
						--ski-green-soft: #ecfff4;
						--ski-green-rgb: 73, 218, 145;
						--snow-rgb: 228, 255, 242;
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
						position: relative;
						background:
							radial-gradient(45% 35% at 50% 32%, rgba(255, 255, 255, 0.04) 0%, transparent 70%),
							radial-gradient(80% 60% at 50% -8%, rgba(106, 255, 185, 0.16) 0%, transparent 52%),
							radial-gradient(75% 62% at 100% 100%, rgba(47, 186, 116, 0.16) 0%, transparent 62%),
							linear-gradient(180deg, var(--bg-1) 0%, var(--bg-0) 100%);
					color: var(--text);
						padding: 20px;
						padding-bottom: 82px;
						overflow-x: hidden;
					}
				body::before,
				body::after {
					content: '';
					position: fixed;
					inset: -20vh 0 0 0;
					pointer-events: none;
					z-index: 0;
					background-repeat: repeat;
				}
				body::before {
					opacity: 0.32;
					background-image:
						radial-gradient(circle, rgba(var(--snow-rgb), 0.86) 0 1px, transparent 1.8px),
						radial-gradient(circle, rgba(var(--snow-rgb), 0.6) 0 1.2px, transparent 2px);
					background-size: 190px 190px, 260px 260px;
					background-position: 0 0, 88px 120px;
					animation: snow-fall-a 23s linear infinite;
				}
				body::after {
					opacity: 0.2;
					background-image:
						radial-gradient(circle, rgba(var(--snow-rgb), 0.64) 0 0.9px, transparent 1.6px),
						radial-gradient(circle, rgba(var(--snow-rgb), 0.5) 0 0.8px, transparent 1.4px);
					background-size: 120px 120px, 170px 170px;
					background-position: 20px 40px, 72px 96px;
					animation: snow-fall-b 31s linear infinite;
				}
				@keyframes snow-fall-a {
					from { transform: translateY(-12%); }
					to { transform: translateY(12%); }
				}
				@keyframes snow-fall-b {
					from { transform: translateY(-8%); }
					to { transform: translateY(10%); }
				}
					.container {
						max-width: 600px;
						margin: 0 auto;
						display: flex;
						flex-direction: column;
						gap: 12px;
						position: relative;
						z-index: 1;
					}
					.layout-grid {
						display: grid;
						grid-template-columns: minmax(0, 1fr);
						gap: 12px;
						align-items: start;
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
			.nft-card {
			width: 100%;
			max-width: 380px;
			aspect-ratio: 1;
			margin: 0 auto;
			padding: 22px;
			border-radius: 20px;
			background: linear-gradient(155deg, #0a1a13 0%, #040d09 100%);
			border: 1px solid rgba(255, 255, 255, 0.22);
			box-shadow: 0 0 25px rgba(255, 255, 255, 0.12), 0 0 60px rgba(255, 255, 255, 0.06), 0 0 120px rgba(255, 255, 255, 0.03), 0 24px 60px rgba(0, 0, 0, 0.55);
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			gap: 8px;
			position: relative;
		}
		.nft-card::before {
			content: '';
			position: absolute;
			inset: -80px;
			border-radius: 60px;
			background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 70%);
			pointer-events: none;
			z-index: -1;
		}
		.nft-top {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
		}
		.nft-card-wallet {
			display: none;
			flex-direction: column;
			align-items: flex-end;
			gap: 2px;
			flex-shrink: 0;
		}
		.nft-card-wallet.show {
			display: flex;
		}
		.nft-card-wallet-badge {
			display: flex;
			align-items: center;
			gap: 5px;
			font-size: 0.7rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.75);
		}
		.nft-card-wallet-badge img {
			width: 18px;
			height: 18px;
			border-radius: 5px;
		}
		.nft-card-wallet-badge .waap-blue {
			filter: hue-rotate(-50deg) saturate(1.4) brightness(1.15);
		}
		.nft-card-wallet-balance {
			font-size: 0.65rem;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.45);
		}
		.nft-name-block { flex: 1; min-width: 0; }
		.nft-name-line {
			display: flex;
			align-items: center;
			gap: 6px;
			overflow-wrap: anywhere;
		}
		.nft-name {
			font-size: clamp(2.2rem, 10vw, 3.2rem);
			font-weight: 900;
			letter-spacing: -0.04em;
			line-height: 1.05;
			background: linear-gradient(180deg, #ffffff 0%, #b8ffda 40%, #49da91 70%, #27bd74 100%);
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
			filter: drop-shadow(0 2px 8px rgba(var(--ski-green-rgb), 0.3));
		}
		.nft-name-tld {
			background: linear-gradient(180deg, rgba(73, 218, 145, 0.45) 0%, rgba(39, 189, 116, 0.3) 100%);
			-webkit-background-clip: text;
			background-clip: text;
		}
		.primary-star {
			width: 28px;
			height: 28px;
			border-radius: 999px;
			border: 1px solid rgba(148, 163, 184, 0.25);
			background: rgba(148, 163, 184, 0.06);
			color: rgba(148, 163, 184, 0.5);
			font-size: 0.95rem;
			line-height: 1;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			flex-shrink: 0;
			transition: all 0.15s ease;
			margin-top: 4px;
		}
		.primary-star:hover { background: rgba(148, 163, 184, 0.14); border-color: rgba(148, 163, 184, 0.5); color: rgba(148, 163, 184, 0.7); }
		.primary-star.active {
			color: #ffd700;
			background: rgba(255, 215, 0, 0.18);
			border-color: rgba(255, 215, 0, 0.7);
			box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
		}
		.nft-qr-col {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			gap: 6px;
			width: 120px;
			flex-shrink: 0;
		}
		.nft-chip {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			padding: 4px 0;
			border-radius: 999px;
			background: rgba(var(--ski-green-rgb), 0.15);
			border: 1px solid rgba(var(--ski-green-rgb), 0.35);
			font-size: 0.68rem;
			font-weight: 700;
			color: #86efac;
			letter-spacing: 0.04em;
			text-transform: uppercase;
		}
		.nft-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: #34d399;
			box-shadow: 0 0 8px rgba(52, 211, 153, 0.8);
		}
		.nft-body {
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
			gap: 12px;
		}
		.nft-qr {
			width: 100%;
			height: auto;
			aspect-ratio: 1;
			border-radius: 10px;
		}
		.nft-logo-col {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0;
			align-self: flex-end;
			flex-shrink: 0;
			margin-right: -22px;
			margin-bottom: -18px;
		}
		.nft-logo-badge {
			width: 130px;
			opacity: 0.85;
			filter: drop-shadow(0 2px 12px rgba(var(--ski-green-rgb), 0.25));
		}
		.nft-logo-badge svg {
			width: 100%;
			height: auto;
			display: block;
		}
		.nft-discount {
			display: flex;
			flex-direction: row;
			align-items: center;
			gap: 8px;
			font-size: 0.72rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.9);
			line-height: 1.3;
			margin-top: -14px;
			position: relative;
			z-index: 1;
		}
		.nft-discount .discount-sui-icon {
			width: 0.65em;
			height: 0.85em;
			display: inline-block;
			vertical-align: -0.1em;
			margin-left: 2px;
		}
		.nft-price-stack {
			display: flex;
			flex-direction: column;
			gap: 2px;
			margin-bottom: -4px;
		}
		.nft-price-main {
			display: flex;
			align-items: baseline;
			gap: 6px;
			font-size: clamp(1.8rem, 5.5vw, 2.2rem);
			font-weight: 800;
		}
		.nft-price-stack .price-amount { color: #e9fff3; }
		.nft-price-stack .price-sui-icon {
			width: 0.5em;
			height: 0.65em;
			display: inline-block;
			vertical-align: -0.04em;
			fill: #4DA2FF;
		}
		.nft-price-stack .price-usd {
			color: var(--muted);
			font-size: 0.72rem;
			font-weight: 600;
			white-space: nowrap;
		}
		.nft-price-stack .price-decimals {
			font-size: 0.56em;
			font-weight: 700;
			opacity: 0.9;
			margin-left: 2px;
		}
		.reg-form {
			max-width: 380px;
			margin: 14px auto 0;
			display: grid;
			gap: 10px;
			width: 100%;
		}
		.price-amount { color: #e9fff3; }
		.price-sui-icon {
			width: 0.6em;
			height: 0.77em;
			display: inline-block;
			vertical-align: -0.05em;
			fill: #4DA2FF;
		}
		.price-usd {
			color: var(--muted);
			font-size: 0.44em;
			font-weight: 600;
			white-space: nowrap;
		}
		.price-decimals {
			font-size: 0.56em;
			font-weight: 700;
			opacity: 0.9;
			margin-left: 2px;
		}
		.card-with-stepper {
			display: flex;
			align-items: stretch;
			gap: 10px;
			justify-content: center;
		}
		.card-with-stepper .nft-card {
			margin: 0;
		}
		.year-stepper-v {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			gap: 8px;
			width: 200px;
			padding: 10px;
			border-radius: 20px;
			border: 1px solid rgba(var(--ski-green-rgb), 0.28);
			background: rgba(10, 34, 22, 0.55);
			flex-shrink: 0;
		}
		.year-btn-v {
			flex: 1;
			min-height: 60px;
			border-radius: 14px;
			border: 1px solid rgba(var(--ski-green-rgb), 0.38);
			background: rgba(var(--ski-green-rgb), 0.12);
			color: var(--ski-green-light);
			font-size: 1.8rem;
			font-weight: 800;
			line-height: 1;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.year-btn-v:hover { background: rgba(var(--ski-green-rgb), 0.2); }
		.year-btn-v:disabled { opacity: 0.4; cursor: not-allowed; }
		.year-display-v {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2px;
			font-size: 2rem;
			font-weight: 800;
			color: var(--text);
			padding: 4px 0;
		}
		.year-unit {
			font-size: 0.7rem;
			font-weight: 600;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.06em;
		}
		.button {
			width: 100%;
			padding: 12px 14px;
			border-radius: 999px;
			border: 1px solid rgba(var(--ski-green-rgb), 0.5);
			background: linear-gradient(135deg, rgba(14, 56, 36, 0.95), rgba(8, 42, 27, 0.96));
			box-shadow: inset 0 1px 0 rgba(var(--ski-green-rgb), 0.2);
			color: var(--ski-green-light);
			font-weight: 800;
			font-size: 0.92rem;
			cursor: pointer;
		}
		.button:hover { background: linear-gradient(135deg, rgba(16, 67, 42, 0.96), rgba(9, 50, 31, 0.98)); }
		.button:disabled { opacity: 0.55; cursor: not-allowed; }
		.wallet-balance {
			display: none;
			text-align: center;
			font-size: 0.72rem;
			font-weight: 500;
			color: var(--muted);
		}
		.wallet-balance.show { display: block; }
		.status {
			display: none;
			padding: 8px 10px;
			border-radius: 8px;
			font-size: 0.8rem;
		}
		.status.show { display: block; }
		.status.info {
			background: rgba(var(--ski-green-rgb), 0.12);
			border: 1px solid rgba(var(--ski-green-rgb), 0.3);
			color: var(--ski-green-light);
		}
		.status.ok { background: rgba(var(--ski-green-rgb),0.15); border: 1px solid rgba(var(--ski-green-rgb),0.36); color: var(--ski-green-light); }
		.status.err { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.3); color: #ffb0b0; }
			.wallet-widget {
				position: fixed;
				top: calc(16px + env(safe-area-inset-top));
				right: calc(16px + env(safe-area-inset-right));
				z-index: 10040;
				display: flex;
				align-items: center;
				gap: 10px;
			}
				.wallet-profile-btn {
					width: 40px;
					height: 40px;
					border-radius: 10px;
					display: none;
					align-items: center;
					justify-content: center;
					background: rgba(var(--ski-green-rgb), 0.14);
					border: 1px solid rgba(var(--ski-green-rgb), 0.35);
					padding: 0;
					cursor: pointer;
				}
				.wallet-profile-btn.visible { display: inline-flex; }
			.wallet-profile-btn:hover { background: rgba(var(--ski-green-rgb), 0.24); }
			.tracker-footer {
				position: fixed;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 900;
				background: rgba(2, 9, 6, 0.94);
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
			color: #8cae9a;
			white-space: nowrap;
			overflow-x: auto;
			max-width: 100%;
			scrollbar-width: none;
		}
		.tracker-line::-webkit-scrollbar { display: none; }
		.tracker-price-label { color: #deffec; font-weight: 600; }
		#sui-price { color: var(--ski-green-light); font-weight: 700; }
		.tracker-sep { color: rgba(var(--ski-green-rgb), 0.4); }
		.tracker-built-on { color: #8cae9a; }
		.tracker-built-on a {
			color: var(--ski-green-light);
			text-decoration: none;
			font-weight: 600;
		}
		.tracker-built-on a:hover { color: var(--ski-green-soft); }
			@media (max-width: 760px) {
				body { padding: 14px; padding-top: 54px; padding-bottom: 74px; }
				.layout-grid { grid-template-columns: 1fr; }
				.wallet-widget { top: 12px; right: 12px; }
				.tracker-footer { padding: 10px 8px; }
				.tracker-line { font-size: 0.78rem; }
				.nft-card { padding: 16px; gap: 8px; }
				.nft-qr-col { width: 90px; }
				.nft-logo-badge { width: 100px; }
				.year-stepper-v { width: 80px; padding: 8px; }
				.year-btn-v { min-height: 40px; font-size: 1.3rem; }
				.year-display-v { font-size: 1.4rem; }
			}
			@media (max-width: 1020px) {
				.layout-grid { grid-template-columns: 1fr; }
			}
		${generateWalletUiCss()}
		#wk-widget .wk-widget-btn,
		#wk-widget > div > button {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 16px;
			background: rgba(5, 13, 10, 0.94);
			backdrop-filter: blur(16px);
			-webkit-backdrop-filter: blur(16px);
			border: 1px solid rgba(var(--ski-green-rgb), 0.28);
			border-radius: 10px;
			color: #c7f5db;
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.3s ease;
			box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42), 0 0 24px rgba(var(--ski-green-rgb), 0.14);
		}
		#wk-widget .wk-widget-btn:hover,
		#wk-widget > div > button:hover {
			border-color: rgba(var(--ski-green-rgb), 0.46);
			color: var(--text);
			transform: translateY(-1px);
			box-shadow: 0 14px 32px rgba(0, 0, 0, 0.48), 0 0 30px rgba(var(--ski-green-rgb), 0.2);
		}
		#wk-widget .wk-widget-btn.connected,
		#wk-widget > div > button.connected {
			background: linear-gradient(135deg, rgba(40, 160, 103, 0.2), rgba(22, 110, 68, 0.2));
			border-color: rgba(var(--ski-green-rgb), 0.38);
		}
		#wk-widget .wk-widget-btn.session-only,
		#wk-widget > div > button.session-only {
			border-style: dashed;
			background: linear-gradient(135deg, rgba(21, 90, 59, 0.28), rgba(11, 46, 30, 0.3));
		}
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
				<div class="nav-meta"></div>
			</nav>

		<div class="layout-grid">
			${registrationCardHtml}
			${discoveryColumnHtml}
		</div>
	</div>

	<div class="tracker-footer">
		<span class="tracker-line">
			<span class="tracker-price-label">SUI <span id="sui-price">$--</span></span>
			<span class="tracker-sep">\u00b7</span>
			<span class="tracker-built-on">
				Built on
				<a href="https://docs.sui.io" target="_blank" rel="noopener">Sui</a>
				<span class="tracker-sep">\u00b7</span>
				<a href="https://docs.suins.io" target="_blank" rel="noopener">SuiNS</a>
				<span class="tracker-sep">\u00b7</span>
				<a href="https://moveregistry.com/docs" target="_blank" rel="noopener">MVR</a>
				<span class="tracker-sep">\u00b7</span>
				<a href="https://docs.sui.io/standards/deepbook" target="_blank" rel="noopener">DeepBook</a>
				<span class="tracker-sep">\u00b7</span>
				<a href="https://docs.wal.app" target="_blank" rel="noopener">Walrus</a>
				<span class="tracker-sep">\u00b7</span>
				<a href="https://seal-docs.wal.app" target="_blank" rel="noopener">Seal</a>
				<span class="tracker-sep">\u00b7</span>
				<a href="https://docs.waap.xyz/category/guides-sui" target="_blank" rel="noopener">WaaP</a>
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
			const primaryStarEl = document.getElementById('primary-star')
			const registerBtn = document.getElementById('register-btn')
			const registerStatus = document.getElementById('register-status')
			const priceValue = document.getElementById('price-value')
			const suiPriceEl = document.getElementById('sui-price')
			const walletProfileBtn = document.getElementById('wallet-profile-btn')
		const walletBalanceEl = document.getElementById('wallet-balance')
		const x402PriceEl = document.getElementById('x402-price')
		const x402LinkEl = document.getElementById('x402-link')
		const suggestionsGrid = document.getElementById('suggestions-grid')
		const refreshSuggestionsBtn = document.getElementById('refresh-suggestions')

		let pricingData = null
		const suggestionStatusCache = new Map()
		let wantsPrimaryName = false
		let primaryStarManualOverride = null
		let primaryStarAddress = ''
		let primaryStarSyncNonce = 0
		const MIN_YEARS = 1
		const MAX_YEARS = 5
		const RPC_URLS = {
			mainnet: 'https://fullnode.mainnet.sui.io:443',
			testnet: 'https://fullnode.testnet.sui.io:443',
			devnet: 'https://fullnode.devnet.sui.io:443',
		}

			function formatPrimaryPriceHtml(sui) {
				if (!Number.isFinite(sui) || sui <= 0) return '--'
				const whole = Math.trunc(sui)
				const fraction = sui - whole
				if (fraction > 0.95) {
					return String(whole + 1)
				}
				const decimals = Math.floor(fraction * 100)
				if (decimals < 5) {
					return String(whole)
				}
				const decimalsText = String(decimals).padStart(2, '0')
				const normalizedDecimals = decimalsText.endsWith('0') ? decimalsText.slice(0, 1) : decimalsText
				return String(whole) + '<span class="price-decimals">.' + normalizedDecimals + '</span>'
			}

		function formatUsdAmount(usdValue) {
			if (!Number.isFinite(usdValue) || usdValue <= 0) return null
			return new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0,
			}).format(Math.round(usdValue))
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
			if (conn.status !== 'connected') return null
			return conn.address || null
		}

		function getConnectedPrimaryName() {
			const conn = SuiWalletKit.$connection.value
			if (!conn) return null
			if (conn.status !== 'connected') return null
			if (!conn.primaryName || typeof conn.primaryName !== 'string') return null
			const normalized = conn.primaryName.trim().replace(/\\.sui$/i, '')
			return normalized || null
		}

		function getRpcUrlForNetwork() {
			return RPC_URLS[NETWORK] || RPC_URLS.mainnet
		}

		async function fetchPrimaryNameForAddress(address) {
			if (!address || typeof SuiJsonRpcClient !== 'function') return { resolved: false, name: null }
			try {
				const client = new SuiJsonRpcClient({ url: getRpcUrlForNetwork() })
				const result = await client.resolveNameServiceNames({ address })
				const name = result?.data?.[0]
				if (!name || typeof name !== 'string') return { resolved: true, name: null }
				const normalized = name.replace(/\\.sui$/i, '')
				return { resolved: true, name: normalized || null }
			} catch {
				return { resolved: false, name: null }
			}
		}

		async function syncPrimaryStarState() {
			const address = getConnectedAddress()
			if (!address) {
				primaryStarAddress = ''
				primaryStarManualOverride = null
				wantsPrimaryName = false
				updatePrimaryStarUi()
				return
			}

			if (primaryStarAddress !== address) {
				primaryStarAddress = address
				primaryStarManualOverride = null
			}

			if (typeof primaryStarManualOverride === 'boolean') {
				wantsPrimaryName = primaryStarManualOverride
				updatePrimaryStarUi()
				return
			}

			const connectedPrimaryName = getConnectedPrimaryName()
			if (connectedPrimaryName) {
				wantsPrimaryName = false
				updatePrimaryStarUi()
				return
			}

			const syncNonce = ++primaryStarSyncNonce
			const primaryResolution = await fetchPrimaryNameForAddress(address)
			if (syncNonce !== primaryStarSyncNonce) return
			if (getConnectedAddress() !== address) return
			if (!primaryResolution.resolved) return
			wantsPrimaryName = primaryResolution.name === null
			updatePrimaryStarUi()
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

		function updateRegisterButton() {
			if (!registerBtn) return
			const address = getConnectedAddress()
			if (walletProfileBtn) {
				walletProfileBtn.classList.toggle('visible', !!address)
			}
			if (!address) {
				registerBtn.style.display = 'none'
				return
			}
			registerBtn.style.display = ''
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
				const discountedUsdRaw = Number(pricingData?.breakdown?.discountedPriceUsd || 0)
				const discountedUsdText = formatUsdAmount(discountedUsdRaw)
				const savingsMist = Number(pricingData?.savingsMist || 0)
				const savingsSui = savingsMist / 1e9
				const directUsd = Number(pricingData?.breakdown?.basePriceUsd || 0)
				const savingsUsd = directUsd - discountedUsdRaw
					if (priceValue) {
						const primaryPriceHtml = formatPrimaryPriceHtml(sui)
						const perYearUsd = years > 0 ? discountedUsdRaw / years : discountedUsdRaw
						const perYearUsdText = formatUsdAmount(perYearUsd)
						const usdLabel = perYearUsdText ? '$' + perYearUsdText + '/yr' : '$--'
						const suiIcon = '<svg class="price-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg>'
						let savingsHtml = ''
						const discountEl = document.getElementById('price-savings')
						if (savingsSui > 0.5 && savingsUsd > 0.5 && discountEl) {
							const savingsUsdText = formatUsdAmount(savingsUsd)
							const discountSuiIcon = '<svg class="discount-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg>'
							discountEl.innerHTML =
								'<span>-' + Math.round(savingsSui) + discountSuiIcon + '</span>' +
								'<span>($' + (savingsUsdText || '--') + ')</span>'
						}
						priceValue.innerHTML =
							'<div class="nft-price-main"><span class="price-amount">' + primaryPriceHtml + '</span>' + suiIcon + '</div>' +
							'<span class="price-usd">\u2248 ' + usdLabel + '</span>'
					}
					updateRegisterButton()
				} catch (error) {
					if (priceValue) {
						priceValue.innerHTML =
							'<div class="nft-price-main"><span class="price-amount">--</span>' +
							'<svg class="price-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg></div>' +
							'<span class="price-usd">\u2248 $--</span>'
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

		async function updateWalletBalance() {
			if (!walletBalanceEl) return
			const address = getConnectedAddress()
			if (!address || typeof SuiJsonRpcClient !== 'function') {
				walletBalanceEl.className = 'wallet-balance'
				walletBalanceEl.textContent = ''
				return
			}
			try {
				const client = new SuiJsonRpcClient({ url: getRpcUrlForNetwork() })
				const result = await client.getBalance({ owner: address })
				const totalMist = Number(result?.totalBalance || 0)
				const sui = totalMist / 1e9
				walletBalanceEl.className = 'wallet-balance show'
				walletBalanceEl.textContent = 'Balance: ' + sui.toFixed(2) + ' SUI'
			} catch {
				walletBalanceEl.className = 'wallet-balance'
			}
		}

		function getConnectedWalletName() {
			const conn = SuiWalletKit.$connection.value
			if (conn && conn.wallet && conn.wallet.name) return String(conn.wallet.name)
			const session = typeof getWalletSession === 'function' ? getWalletSession() : null
			return session && session.walletName ? String(session.walletName) : ''
		}

		function getConnectedWalletIcon() {
			const conn = SuiWalletKit.$connection.value
			if (conn && conn.wallet && conn.wallet.icon) return String(conn.wallet.icon)
			return ''
		}

		async function updateCardWalletInfo() {
			const el = document.getElementById('nft-card-wallet')
			if (!el) return
			const address = getConnectedAddress()
			if (!address) {
				el.className = 'nft-card-wallet'
				el.innerHTML = ''
				return
			}
			const walletName = getConnectedWalletName()
			const isWaaP = walletName.toLowerCase() === 'waap'
			let badgeHtml = ''
			if (isWaaP) {
				const waapIcon = typeof __wkWaaPIcon === 'string' ? __wkWaaPIcon : ''
				badgeHtml = (waapIcon ? '<img class="waap-blue" src="' + waapIcon + '">' : '') + ' WaaP'
			} else if (walletName) {
				const icon = getConnectedWalletIcon()
				badgeHtml = (icon ? '<img src="' + icon + '">' : '') + ' ' + walletName
			}
			el.className = 'nft-card-wallet show'
			el.innerHTML =
				'<div class="nft-card-wallet-badge">' + badgeHtml + '</div>' +
				'<div class="nft-card-wallet-balance" id="nft-card-balance"></div>'
			try {
				const client = new SuiJsonRpcClient({ url: getRpcUrlForNetwork() })
				const result = await client.getBalance({ owner: address })
				const totalMist = Number(result?.totalBalance || 0)
				const sui = totalMist / 1e9
				const balanceEl = document.getElementById('nft-card-balance')
				if (balanceEl) balanceEl.textContent = sui.toFixed(2) + ' SUI'
			} catch {}
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
				const rpcUrl = getRpcUrlForNetwork()
				const years = getSelectedYears()
				const domain = NAME + '.sui'

				const client = new SuiJsonRpcClient({ url: rpcUrl })
				const suinsClient = new SuinsClient({ client, network: NETWORK })
				const coinConfig = getSuiCoinConfig(suinsClient)
				if (!coinConfig) throw new Error('SUI coin config unavailable')

				const recipient = address

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
				if (wantsPrimaryName && typeof SuiWalletKit.setPrimaryName === 'function') {
					SuiWalletKit.setPrimaryName(NAME)
				}
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
			syncPrimaryStarState()
			updateWalletBalance()
			updateCardWalletInfo()
		}

		window.onRegisterWalletDisconnected = function() {
			updateRegisterButton()
			syncPrimaryStarState()
			updateWalletBalance()
			updateCardWalletInfo()
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
		syncPrimaryStarState()
		setSelectedYears(getSelectedYears())
		updateRegisterButton()
		fetchPricing()
		updateSuiPrice()
		updateX402Listing()
		updateCardWalletInfo()
		setInterval(updateSuiPrice, 60000)
		setInterval(updateX402Listing, 120000)
		loadSuggestions()

		;(async function renderNftQr() {
			const canvas = document.getElementById('nft-qr')
			if (!canvas || !canvas.getContext) return
			try {
				const qrMod = await import('https://esm.sh/qr-creator@1.0.0')
				const QrCreator = qrMod.default || qrMod
				QrCreator.render({
					text: 'https://' + NAME + '.sui.ski',
					radius: 0.4,
					ecLevel: 'M',
					fill: '#49da91',
					background: 'transparent',
					size: 200,
				}, canvas)
			} catch {
				canvas.style.display = 'none'
			}
		})()

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
				primaryStarManualOverride = wantsPrimaryName
				updatePrimaryStarUi()
			})
		}
		document.addEventListener('keydown', (e) => {
			if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
			if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
				e.preventDefault()
				setSelectedYears(getSelectedYears() + 1)
				fetchPricing()
			} else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
				e.preventDefault()
				setSelectedYears(getSelectedYears() - 1)
				fetchPricing()
			}
		})
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
