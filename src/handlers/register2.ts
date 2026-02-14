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
		? `<div class="nft-card">
				<div class="nft-top">
					<div class="nft-name-block">
						<div class="nft-name-line"><button type="button" class="primary-star" id="primary-star" aria-label="Set as primary" aria-pressed="false" title="Set as primary name">\u2606</button><span class="nft-name">${escapeHtml(cleanName)}<span class="nft-name-tld">.sui</span></span></div>
					</div>
				</div>
				<div class="nft-body">
					<div class="nft-qr-col">
						<div class="nft-price-stack" id="price-value">
							<div class="nft-price-main"><span class="price-amount">--</span></div>
							<div class="price-rest">
								<span class="price-rest-top">${suiIconSvg}</span>
								<span class="price-usd">\u2248 $--</span>
							</div>
						</div>
						<span class="nft-chip"><span class="nft-dot"></span>Available</span>
						<canvas class="nft-qr" id="nft-qr" width="140" height="140" title="${escapeHtml(cleanName)}.sui"></canvas>
					</div>
					<div class="nft-wallet-icons" id="nft-wallet-icons"></div>
					<div class="nft-logo-col">
						<div class="nft-logo-badge"><svg viewBox="0 0 512 560" fill="none" aria-hidden="true"><defs><linearGradient id="nlg" x1="0" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#ffffff"><animate attributeName="stop-color" values="#ffffff;#b8ffda;#49da91;#ffffff" dur="6s" repeatCount="indefinite"/></stop><stop offset="100%" stop-color="#b8ffda"><animate attributeName="stop-color" values="#b8ffda;#49da91;#ffffff;#b8ffda" dur="6s" repeatCount="indefinite"/></stop></linearGradient></defs><path d="M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z" fill="url(#nlg)"/><path d="M128 384Q208 348 288 384Q368 420 432 384" stroke="url(#nlg)" stroke-width="24" fill="none" stroke-linecap="round"/><text x="256" y="480" font-family="Inter,system-ui,sans-serif" font-size="90" font-weight="800" fill="url(#nlg)" text-anchor="middle">sui.ski</text></svg></div>
						<div class="nft-discount" id="price-savings"></div>
					</div>
				</div>
			</div>
			<div class="reg-form">
				<div class="reg-action-row">
					<button class="download-qr-btn" id="scrub-btn" title="Toggle private mode"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button>
					<button class="download-qr-btn" id="download-qr-btn" title="Download QR card"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>
					<button class="button" id="register-btn">Connect Wallet</button>
					<div class="year-stepper-h" role="group" aria-label="Registration duration" tabindex="0">
						<button type="button" class="year-btn-h" id="years-decrease" aria-label="Decrease">\u2212</button>
						<div class="year-display-h"><span id="years-value">1</span><span class="year-unit">yr</span></div>
						<button type="button" class="year-btn-h" id="years-increase" aria-label="Increase">+</button>
						<input id="years" type="hidden" value="1">
					</div>
				</div>
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
						padding-bottom: 52px;
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
					opacity: calc(0.32 + var(--snow-boost, 0));
					background-image:
						radial-gradient(circle, rgba(var(--snow-rgb), 0.86) 0 1px, transparent 1.8px),
						radial-gradient(circle, rgba(var(--snow-rgb), 0.6) 0 1.2px, transparent 2px);
					background-size: 190px 190px, 260px 260px;
					background-position: 0 0, 88px 120px;
					animation: snow-fall-a 23s linear infinite;
				}
				body::after {
					opacity: calc(0.2 + var(--snow-boost, 0) * 0.7);
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
			.nft-brand-link {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			text-decoration: none;
			flex-shrink: 0;
		}
		.nft-brand-name {
			font-size: 0.84rem;
			font-weight: 800;
			color: var(--text);
		}
		.nft-brand-tagline {
			font-size: 0.62rem;
			font-weight: 500;
			color: var(--muted);
			line-height: 1.3;
			opacity: 0.75;
			white-space: nowrap;
		}
			@keyframes portal-ring {
			0% { opacity: 0.5; transform: scale(0.97); }
			50% { opacity: 1; transform: scale(1); }
			100% { opacity: 0.5; transform: scale(0.97); }
		}
		.nft-card {
			color-scheme: only light;
			width: 100%;
			max-width: 380px;
			aspect-ratio: 1;
			margin: 0 auto;
			padding: 22px;
			border-radius: 20px;
			background: linear-gradient(155deg, #0a1a13 0%, #040d09 100%);
			border: 1px solid rgba(var(--ski-green-rgb), 0.18);
			box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			gap: 8px;
			position: relative;
		}
		.nft-card::before {
			content: '';
			position: absolute;
			inset: -2px;
			border-radius: 21px;
			background: conic-gradient(from 0deg, transparent 0%, rgba(var(--portal-r, 73), var(--portal-g, 218), var(--portal-b, 145), var(--portal-a, 0.35)) 25%, transparent 50%, rgba(var(--portal-r, 73), var(--portal-g, 218), var(--portal-b, 145), calc(var(--portal-a, 0.35) * 0.6)) 75%, transparent 100%);
			pointer-events: none;
			z-index: -1;
			mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
			mask-composite: exclude;
			-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
			-webkit-mask-composite: xor;
			padding: 1px;
			animation: portal-ring 4s ease-in-out infinite;
		}
		.nft-top {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
		}
		.nft-wallet-icons {
			display: none;
			flex-direction: column;
			align-items: flex-start;
			gap: 5px;
			align-self: flex-end;
			margin-bottom: 2px;
			flex-shrink: 0;
		}
		.nft-wallet-icons.show { display: flex; }
		.nft-wallet-icon-row {
			display: flex;
			align-items: center;
			gap: 5px;
		}
		.nft-wallet-icon-row img,
		.nft-wallet-icon-row > svg {
			width: 20px;
			height: 20px;
			border-radius: 4px;
			display: block;
			flex-shrink: 0;
			filter: drop-shadow(0 1px 3px rgba(0,0,0,0.4));
		}
		.nft-wallet-icon-label {
			font-size: 0.6rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.6);
			white-space: nowrap;
			max-width: 60px;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.nft-name-block { flex: 1; min-width: 0; }
		.nft-name-line {
			display: flex;
			align-items: baseline;
			gap: 6px;
			flex-wrap: wrap;
		}
		@keyframes tld-pulse {
			0%, 100% { text-shadow: 0 0 8px rgba(73, 218, 145, 0.5), 0 0 20px rgba(73, 218, 145, 0.2); }
			50% { text-shadow: 0 0 12px rgba(73, 218, 145, 0.7), 0 0 30px rgba(73, 218, 145, 0.3), 0 0 50px rgba(73, 218, 145, 0.1); }
		}
		.nft-name {
			font-size: clamp(2.2rem, 10vw, 3.2rem);
			font-weight: 900;
			letter-spacing: -0.04em;
			line-height: 1.05;
			color: #f0f4f8;
			text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 0 12px rgba(200, 220, 240, 0.15);
			transition: color 0.4s ease, text-shadow 0.4s ease;
		}
		.nft-name-tld {
			color: var(--ski-green);
			text-shadow: 0 0 8px rgba(73, 218, 145, 0.5), 0 0 20px rgba(73, 218, 145, 0.2);
			animation: tld-pulse 3s ease-in-out infinite;
			transition: color 0.4s ease;
		}
		.primary-star {
			width: 28px;
			height: 28px;
			border-radius: 999px;
			border: 1px solid rgba(180, 195, 210, 0.4);
			background: rgba(180, 195, 210, 0.1);
			color: rgba(200, 210, 225, 0.7);
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
		.primary-star:hover { background: rgba(180, 195, 210, 0.2); border-color: rgba(200, 210, 225, 0.6); color: rgba(220, 225, 235, 0.85); }
		.primary-star.active {
			color: #c8d0e0;
			background: rgba(120, 130, 155, 0.18);
			border-color: rgba(120, 130, 155, 0.7);
			box-shadow: 0 0 12px rgba(120, 130, 155, 0.2);
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
			padding: 5px 0;
			border-radius: 6px;
			background: rgba(13, 82, 48, 0.4);
			border: 1px solid rgba(20, 130, 72, 0.5);
			font-size: 0.78rem;
			font-weight: 700;
			color: #ffffff;
			letter-spacing: 0.05em;
			text-transform: uppercase;
			transition: background 0.4s ease, border-color 0.4s ease;
		}
		.nft-dot {
			width: 9px;
			height: 9px;
			border-radius: 50%;
			background: #16a34a;
			box-shadow: 0 0 10px rgba(22, 163, 74, 0.9);
			transition: background 0.4s ease, box-shadow 0.4s ease;
		}
		.nft-body {
			display: flex;
			align-items: flex-end;
			gap: 8px;
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
			margin-left: auto;
			margin-right: -22px;
			margin-bottom: -18px;
		}
		.nft-logo-badge {
			width: 130px;
			filter: drop-shadow(0 2px 12px rgba(var(--ski-green-rgb), 0.35));
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
			gap: 4px;
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
			margin-left: 1px;
			margin-right: 0;
		}
		.nft-price-stack {
			display: flex;
			align-items: stretch;
			gap: 0;
			margin-bottom: -4px;
		}
		.nft-price-main {
			display: flex;
			align-items: center;
		}
		.nft-price-stack .price-amount {
			font-size: clamp(2.4rem, 7vw, 3rem);
			font-weight: 800;
			color: #e9fff3;
			line-height: 1;
		}
		.nft-price-stack .price-rest {
			display: flex;
			flex-direction: column;
			justify-content: center;
			gap: 1px;
			margin-left: 2px;
		}
		.nft-price-stack .price-rest-top {
			display: flex;
			align-items: baseline;
			gap: 4px;
		}
		.nft-price-stack .price-decimals {
			font-size: 1.05rem;
			font-weight: 700;
			color: rgba(233, 255, 243, 0.75);
		}
		.nft-price-stack .price-sui-icon {
			width: 14px;
			height: 18px;
			display: inline-block;
			vertical-align: baseline;
			fill: #4DA2FF;
		}
		.nft-price-stack .price-usd {
			color: var(--muted);
			font-size: 0.88rem;
			font-weight: 700;
			white-space: nowrap;
		}
		.reg-form {
			max-width: 440px;
			margin: 8px auto 0;
			display: grid;
			gap: 10px;
			width: 100%;
		}
		.reg-action-row {
			display: flex;
			align-items: stretch;
			gap: 6px;
		}
		.reg-action-row .button {
			flex: 1;
			white-space: nowrap;
		}
		.download-qr-btn {
			width: 38px;
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0;
			border-radius: 10px;
			border: 1px solid rgba(var(--ski-green-rgb), 0.18);
			background: rgba(var(--ski-green-rgb), 0.05);
			color: var(--muted);
			cursor: pointer;
			opacity: 0.45;
			transition: opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease;
		}
		.download-qr-btn:hover { opacity: 1; border-color: rgba(var(--ski-green-rgb), 0.45); color: var(--ski-green-light); background: rgba(var(--ski-green-rgb), 0.1); }
		.download-qr-btn.active { opacity: 0.9; border-color: rgba(var(--ski-green-rgb), 0.5); color: var(--ski-green); background: rgba(var(--ski-green-rgb), 0.12); }
		.download-qr-btn svg { width: 14px; height: 14px; flex-shrink: 0; }
		.reg-sui-icon {
			width: 0.85em;
			height: 1.1em;
			display: inline-block;
			vertical-align: -0.15em;
			margin-left: 1px;
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
		.year-stepper-h {
			display: flex;
			align-items: center;
			gap: 0;
			border-radius: 10px;
			border: 1px solid rgba(var(--ski-green-rgb), 0.28);
			background: rgba(10, 34, 22, 0.55);
			flex-shrink: 0;
			transition: border-color 0.4s ease;
			outline: none;
		}
		.year-stepper-h:focus-within { border-color: rgba(var(--ski-green-rgb), 0.5); }
		.year-btn-h {
			width: 34px;
			height: 38px;
			border: none;
			background: rgba(var(--ski-green-rgb), 0.1);
			color: var(--ski-green-light);
			font-size: 1rem;
			font-weight: 800;
			line-height: 1;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.year-btn-h:first-child { border-radius: 9px 0 0 9px; }
		.year-btn-h:last-of-type { border-radius: 0 9px 9px 0; }
		.year-btn-h:hover { background: rgba(var(--ski-green-rgb), 0.22); }
		.year-btn-h:disabled { opacity: 0.35; cursor: not-allowed; }
		.year-display-h {
			display: flex;
			align-items: baseline;
			gap: 2px;
			font-size: 1rem;
			font-weight: 800;
			color: var(--text);
			padding: 0 6px;
			white-space: nowrap;
			user-select: none;
		}
		.year-unit {
			font-size: 0.6rem;
			font-weight: 600;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.06em;
		}
		.button {
			width: 100%;
			padding: 14px 18px;
			border-radius: 14px;
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
					background: rgba(120, 130, 155, 0.1);
					border: 1px solid rgba(120, 130, 155, 0.35);
					padding: 0;
					cursor: pointer;
				}
				.wallet-profile-btn svg {
					filter: brightness(0.7) contrast(1.2) saturate(0.4);
				}
				.wallet-profile-btn.visible { display: inline-flex; }
			.wallet-profile-btn:hover { background: rgba(120, 130, 155, 0.2); border-color: rgba(120, 130, 155, 0.55); }
			.wallet-widget.has-black-diamond .wallet-profile-btn {
				background: linear-gradient(135deg, rgba(10, 10, 18, 0.6), rgba(18, 18, 28, 0.7));
				border-color: rgba(120, 130, 155, 0.42);
				box-shadow: 0 0 24px rgba(0, 0, 0, 0.4);
			}
			.wallet-widget.has-black-diamond .wallet-profile-btn:hover {
				background: linear-gradient(135deg, rgba(16, 16, 26, 0.7), rgba(24, 24, 36, 0.8));
				border-color: rgba(140, 150, 175, 0.62);
				box-shadow: 0 0 28px rgba(0, 0, 0, 0.5);
			}
			.wallet-widget.has-black-diamond #wk-widget .wk-widget-btn.connected,
			.wallet-widget.has-black-diamond #wk-widget > div > button.connected {
				background: linear-gradient(135deg, rgba(10, 10, 18, 0.6), rgba(18, 18, 28, 0.7));
				border-color: rgba(120, 130, 155, 0.42);
				color: #d0d4e0;
				box-shadow: 0 0 24px rgba(0, 0, 0, 0.35);
			}
			.wallet-widget.has-black-diamond #wk-widget .wk-widget-btn.connected:hover,
			.wallet-widget.has-black-diamond #wk-widget > div > button.connected:hover {
				border-color: rgba(140, 150, 175, 0.62);
				box-shadow: 0 0 28px rgba(0, 0, 0, 0.5);
			}
			.tracker-footer {
				position: fixed;
				left: 0;
				right: 0;
				bottom: 0;
				z-index: 900;
				background: rgba(2, 9, 6, 0.94);
				backdrop-filter: blur(10px);
				border-top: 1px solid rgba(var(--ski-green-rgb), 0.35);
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0;
		}
		.tracker-brand {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 7px 16px 0;
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
			padding: 5px 16px 9px;
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
				.year-btn-h { width: 28px; height: 34px; font-size: 0.9rem; }
				.year-display-h { font-size: 0.85rem; padding: 0 4px; }
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
			background: rgba(13, 10, 5, 0.94);
			backdrop-filter: blur(16px);
			-webkit-backdrop-filter: blur(16px);
			border: 1px solid rgba(120, 130, 155, 0.28);
			border-radius: 10px;
			color: #d0d4e0;
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.3s ease;
			box-shadow: 0 10px 28px rgba(0, 0, 0, 0.42);
		}
		#wk-widget .wk-widget-btn:hover,
		#wk-widget > div > button:hover {
			border-color: rgba(140, 150, 175, 0.5);
			color: #fff;
			transform: translateY(-1px);
			box-shadow: 0 14px 32px rgba(0, 0, 0, 0.48), 0 0 20px rgba(0, 0, 0, 0.2);
		}
		#wk-widget .wk-widget-btn.connected,
		#wk-widget > div > button.connected {
			background: linear-gradient(135deg, rgba(10, 10, 18, 0.3), rgba(18, 18, 28, 0.3));
			border-color: rgba(120, 130, 155, 0.38);
		}
		#wk-widget .wk-widget-btn.session-only,
		#wk-widget > div > button.session-only {
			border-style: dashed;
			background: linear-gradient(135deg, rgba(10, 10, 18, 0.25), rgba(18, 18, 28, 0.25));
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
		<div class="layout-grid">
			${registrationCardHtml}
			${discoveryColumnHtml}
		</div>
	</div>

	<div class="tracker-footer">
		<div class="tracker-brand">
			<a class="nft-brand-link" href="https://sui.ski">${generateLogoSvg(14)}<span class="nft-brand-name">.ski</span></a>
			<span class="nft-brand-tagline">Lift every 0xAddr to human-readability at scale</span>
		</div>
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
		const WAAP_REFERRAL_ADDRESS = '0x53f1e3d5f1e3f5aefa47fd3d5a47c9b8cc87e26a2c7bf39e26c870ded4eca7df'

		function isValidSuiAddress(addr) {
			return typeof addr === 'string' && /^0x[0-9a-fA-F]{64}$/.test(addr)
		}

		const urlParams = new URLSearchParams(window.location.search)
		const referrerAddress = isValidSuiAddress(urlParams.get('ref')) ? urlParams.get('ref') : null
		const waapReferralAddress = isValidSuiAddress(urlParams.get('rw')) ? urlParams.get('rw') : WAAP_REFERRAL_ADDRESS
		let referralFeeMist = 0n
		let waapFeeMist = 0n

			const yearsEl = document.getElementById('years')
			const yearsValueEl = document.getElementById('years-value')
			const yearsDecreaseBtn = document.getElementById('years-decrease')
			const yearsIncreaseBtn = document.getElementById('years-increase')
			const primaryStarEl = document.getElementById('primary-star')
			const registerBtn = document.getElementById('register-btn')
			const registerStatus = document.getElementById('register-status')
			const priceValue = document.getElementById('price-value')
			const suiPriceEl = document.getElementById('sui-price')
			const walletWidget = document.getElementById('wallet-widget')
			const walletProfileBtn = document.getElementById('wallet-profile-btn')
		const downloadQrBtn = document.getElementById('download-qr-btn')
		const scrubBtn = document.getElementById('scrub-btn')
		const x402PriceEl = document.getElementById('x402-price')
		const x402LinkEl = document.getElementById('x402-link')
		const suggestionsGrid = document.getElementById('suggestions-grid')
		const refreshSuggestionsBtn = document.getElementById('refresh-suggestions')

		let pricingData = null
		const suggestionStatusCache = new Map()
		let scrubMode = false
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

			function formatPrimaryPriceParts(sui) {
				if (!Number.isFinite(sui) || sui <= 0) return { whole: '--', decimals: '' }
				const whole = Math.trunc(sui)
				const fraction = sui - whole
				if (fraction > 0.95) {
					return { whole: String(whole + 1), decimals: '' }
				}
				const dec = Math.floor(fraction * 100)
				if (dec < 5) {
					return { whole: String(whole), decimals: '' }
				}
				const decText = String(dec).padStart(2, '0')
				const normalized = decText.endsWith('0') ? decText.slice(0, 1) : decText
				return { whole: String(whole), decimals: '.' + normalized }
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

		function yearProgress(years) {
			return Math.min(1, Math.max(0, (years - MIN_YEARS) / (MAX_YEARS - MIN_YEARS)))
		}

		function lerpRgb(r0, g0, b0, r1, g1, b1, t) {
			return 'rgb(' + Math.round(r0 + (r1 - r0) * t) + ',' + Math.round(g0 + (g1 - g0) * t) + ',' + Math.round(b0 + (b1 - b0) * t) + ')'
		}

		function yearColor(years) {
			return lerpRgb(26, 153, 96, 255, 255, 255, yearProgress(years))
		}

		function updateYearTheme(years) {
			const t = yearProgress(years)

			const nameEl = document.querySelector('.nft-name')
			if (nameEl) {
				nameEl.style.color = lerpRgb(240, 244, 248, 255, 255, 255, t)
				const ng = (0.15 + t * 0.25).toFixed(2)
				nameEl.style.textShadow = '0 1px 3px rgba(0,0,0,' + (0.4 - t * 0.2).toFixed(2) + '), 0 0 ' + (12 + t * 18) + 'px rgba(200,220,240,' + ng + ')'
			}

			const tldEl = document.querySelector('.nft-name-tld')
			if (tldEl) {
				tldEl.style.color = lerpRgb(73, 218, 145, 240, 248, 255, t)
				tldEl.style.animation = 'none'
				const ga = (0.5 + t * 0.4).toFixed(2)
				const gb = (0.2 + t * 0.4).toFixed(2)
				const gc = (t * 0.25).toFixed(2)
				tldEl.style.textShadow = '0 0 ' + (8 + t * 12) + 'px rgba(73,218,145,' + ga + '), 0 0 ' + (20 + t * 30) + 'px rgba(73,218,145,' + gb + '), 0 0 ' + (50 + t * 30) + 'px rgba(73,218,145,' + gc + ')'
			}

			const borderColor = lerpRgb(73, 218, 145, 200, 210, 225, t)
			const borderA = (0.18 + t * 0.3).toFixed(2)
			const cardEl = document.querySelector('.nft-card')
			if (cardEl) {
				cardEl.style.borderColor = borderColor.replace('rgb(', 'rgba(').replace(')', ',' + borderA + ')')
			}

			const pr = Math.round(73 + 127 * t)
			const pg = Math.round(218 - 8 * t)
			const pb = Math.round(145 + 80 * t)
			document.documentElement.style.setProperty('--portal-r', String(pr))
			document.documentElement.style.setProperty('--portal-g', String(pg))
			document.documentElement.style.setProperty('--portal-b', String(pb))
			document.documentElement.style.setProperty('--portal-a', (0.35 + t * 0.5).toFixed(2))

			const chipEl = document.querySelector('.nft-chip')
			if (chipEl) {
				chipEl.style.color = '#ffffff'
				const cbg = lerpRgb(13, 82, 48, 80, 90, 100, t)
				chipEl.style.background = cbg.replace('rgb(', 'rgba(').replace(')', ',' + (0.4 - t * 0.1).toFixed(2) + ')')
				const cbd = lerpRgb(20, 130, 72, 180, 195, 210, t)
				chipEl.style.borderColor = cbd.replace('rgb(', 'rgba(').replace(')', ',' + (0.5 + t * 0.2).toFixed(2) + ')')
			}

			const dotEl = document.querySelector('.nft-dot')
			if (dotEl) {
				const dotColor = lerpRgb(22, 163, 74, 220, 235, 245, t)
				dotEl.style.background = dotColor
				dotEl.style.boxShadow = '0 0 ' + (8 + t * 6) + 'px ' + dotColor
			}

			const stepperEl = document.querySelector('.year-stepper-h')
			if (stepperEl) {
				const sb = lerpRgb(73, 218, 145, 200, 210, 225, t)
				stepperEl.style.borderColor = sb.replace('rgb(', 'rgba(').replace(')', ',' + (0.28 + t * 0.3).toFixed(2) + ')')
			}

			document.body.style.setProperty('--snow-boost', (t * 0.5).toFixed(3))
		}

		function setSelectedYears(nextYears) {
			const normalized = Math.min(MAX_YEARS, Math.max(MIN_YEARS, Math.floor(Number(nextYears) || MIN_YEARS)))
			if (yearsEl) yearsEl.value = String(normalized)
			if (yearsValueEl) {
				yearsValueEl.textContent = String(normalized)
				yearsValueEl.style.color = yearColor(normalized)
			}
			if (yearsDecreaseBtn) yearsDecreaseBtn.disabled = normalized <= MIN_YEARS
			if (yearsIncreaseBtn) yearsIncreaseBtn.disabled = normalized >= MAX_YEARS
			updateYearTheme(normalized)
		}

		function getConnectedAddress() {
			const conn = SuiWalletKit.$connection.value
			if (!conn) return null
			if (conn.status !== 'connected' && conn.status !== 'session') return null
			return conn.address || null
		}

		function getConnectedPrimaryName() {
			const conn = SuiWalletKit.$connection.value
			if (!conn) return null
			if (conn.status !== 'connected' && conn.status !== 'session') return null
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

		function updateWalletProfileButton() {
			if (!walletProfileBtn) return
			const address = getConnectedAddress()
			const primaryName = getConnectedPrimaryName()
			walletProfileBtn.classList.toggle('visible', !!address)
			if (walletWidget) {
				walletWidget.classList.toggle('has-black-diamond', !!primaryName)
			}
			if (primaryName) {
				walletProfileBtn.dataset.href = 'https://' + encodeURIComponent(primaryName) + '.sui.ski'
				walletProfileBtn.title = primaryName + '.sui'
			} else {
				walletProfileBtn.dataset.href = 'https://sui.ski'
				walletProfileBtn.title = 'Go to sui.ski'
			}
		}

		const REG_SUI_ICON = '<svg class="reg-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg>'

		function updateRegisterButton() {
			if (!registerBtn) return
			const address = getConnectedAddress()
			updateWalletProfileButton()
			const stepperEl = document.querySelector('.year-stepper-h')
			if (!address) {
				registerBtn.style.display = 'none'
				if (downloadQrBtn) downloadQrBtn.style.display = 'none'
				if (scrubBtn) scrubBtn.style.display = 'none'
				if (stepperEl) stepperEl.style.display = 'none'
				return
			}
			registerBtn.style.display = ''
			if (downloadQrBtn) downloadQrBtn.style.display = ''
			if (scrubBtn) scrubBtn.style.display = ''
			if (stepperEl) stepperEl.style.display = ''
			if (pricingData && pricingData.discountedSuiMist) {
				const sui = Number(pricingData.discountedSuiMist) / 1e9
				if (Number.isFinite(sui) && sui > 0) {
					registerBtn.innerHTML = 'Accept ' + Math.ceil(sui) + ' ' + REG_SUI_ICON
					return
				}
			}
			registerBtn.innerHTML = 'Accept ' + NAME + '.sui'
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
				if (referrerAddress && savingsMist > 0) {
					referralFeeMist = BigInt(Math.floor(savingsMist * 10 / 100))
					waapFeeMist = BigInt(Math.floor(savingsMist * 5 / 100))
				} else {
					referralFeeMist = 0n
					waapFeeMist = 0n
				}
					if (priceValue) {
						const priceParts = formatPrimaryPriceParts(sui)
						const perYearUsd = years > 0 ? discountedUsdRaw / years : discountedUsdRaw
						const perYearUsdText = formatUsdAmount(perYearUsd)
						const usdLabel = perYearUsdText ? '= $' + perYearUsdText + '/yr' : '= $--'
						const suiIcon = '<svg class="price-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg>'
						const discountEl = document.getElementById('price-savings')
						if (savingsSui > 0.5 && savingsUsd > 0.5 && discountEl) {
							const savingsUsdText = formatUsdAmount(savingsUsd)
							const discountSuiIcon = '<svg class="discount-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg>'
							discountEl.innerHTML =
								'<span>-' + Math.round(savingsSui) + discountSuiIcon + '</span>' +
								'<span>($' + (savingsUsdText || '--') + ')</span>'
						}
						const usdColor = yearColor(years)
						const decimalsHtml = priceParts.decimals ? '<span class="price-decimals">' + priceParts.decimals + '</span>' : ''
						priceValue.innerHTML =
							'<div class="nft-price-main"><span class="price-amount">' + priceParts.whole + '</span></div>' +
							'<div class="price-rest">' +
								'<span class="price-rest-top">' + decimalsHtml + suiIcon + '</span>' +
								'<span class="price-usd" style="color:' + usdColor + '">' + usdLabel + '</span>' +
							'</div>'
					}
					updateRegisterButton()
				} catch (error) {
					if (priceValue) {
						priceValue.innerHTML =
							'<div class="nft-price-main"><span class="price-amount">--</span></div>' +
							'<div class="price-rest">' +
								'<span class="price-rest-top"><svg class="price-sui-icon" viewBox="0 0 300 384" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z" fill="#4DA2FF"/></svg></span>' +
								'<span class="price-usd">\u2248 $--</span>' +
							'</div>'
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

		function getConnectedAccountLabel() {
			const conn = SuiWalletKit.$connection.value
			if (!conn || !conn.account) return ''
			return typeof conn.account.label === 'string' ? conn.account.label.trim() : ''
		}

		function updateCardWalletInfo() {
			const el = document.getElementById('nft-wallet-icons')
			if (!el) return
			const address = getConnectedAddress()
			if (!address || scrubMode) {
				el.className = 'nft-wallet-icons'
				el.innerHTML = ''
				return
			}
			const walletName = getConnectedWalletName()
			const isWaaP = walletName.toLowerCase() === 'waap'
			let accountLabel = getConnectedAccountLabel()
			if (!accountLabel && isWaaP && typeof __wkGetWaaPLabelForAddress === 'function') {
				accountLabel = __wkGetWaaPLabelForAddress(address)
			}
			if (!accountLabel && isWaaP) {
				const pName = getConnectedPrimaryName()
				if (pName) accountLabel = pName
			}
			let html = ''
			if (isWaaP && typeof __wkWaaPIcon === 'string' && __wkWaaPIcon) {
				html += '<div class="nft-wallet-icon-row">' +
					'<img src="' + __wkWaaPIcon + '" alt="WaaP" onerror="this.style.display=\\'none\\'">' +
					'<span class="nft-wallet-icon-label">WaaP</span>' +
					'</div>'
			}
			const waapMethod = isWaaP && typeof __wkGetWaaPMethodForAddress === 'function'
				? __wkGetWaaPMethodForAddress(address)
				: (isWaaP && typeof __wkPendingWaaPMethod === 'string' ? __wkPendingWaaPMethod : '')
			if (waapMethod && typeof __wkSocialIcons === 'object' && __wkSocialIcons[waapMethod]) {
				const methodSvg = __wkSocialIcons[waapMethod]
					.replace(/width="\\d+"/, 'width="20"')
					.replace(/height="\\d+"/, 'height="20"')
					.replace(/fill="[^"]*"/, 'fill="#e2e8f0"')
				let methodLabel = accountLabel || ''
				if (!methodLabel) {
					const fallbackLabels = { x: 'X', google: 'Google', discord: 'Discord', apple: 'Apple', email: 'Email', phone: 'Phone' }
					methodLabel = fallbackLabels[waapMethod] || ''
				}
				html += '<div class="nft-wallet-icon-row">' + methodSvg +
					(methodLabel ? '<span class="nft-wallet-icon-label">' + methodLabel + '</span>' : '') +
					'</div>'
			}
			if (!isWaaP && walletName) {
				html += '<div class="nft-wallet-icon-row"><span class="nft-wallet-icon-label">' + walletName + '</span></div>'
			}
			if (html) {
				el.className = 'nft-wallet-icons show'
				el.innerHTML = html
			} else {
				el.className = 'nft-wallet-icons'
				el.innerHTML = ''
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

				if (referrerAddress && referralFeeMist > 0n) {
					const [refCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(referralFeeMist)])
					tx.transferObjects([refCoin], referrerAddress)
				}
				if (waapReferralAddress && waapFeeMist > 0n) {
					const [waapCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(waapFeeMist)])
					tx.transferObjects([waapCoin], waapReferralAddress)
				}

				showStatus('Approve in wallet...', 'info')
				const result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } })
				const digest = result?.digest ? String(result.digest) : ''

				trackEvent('sui_ski_register_success', {
					registerFlow: REGISTER_FLOW,
					registerBucket: REGISTER_BUCKET,
					registerName: NAME,
					registerNetwork: NETWORK,
					txDigest: digest,
					referrer: referrerAddress || '',
					referralFee: referralFeeMist > 0n ? String(referralFeeMist) : '',
					waapFee: waapFeeMist > 0n ? String(waapFeeMist) : '',
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
			updateWalletProfileButton()
			syncPrimaryStarState()
			updateCardWalletInfo()
			renderNftQr()
		}

		window.onRegisterWalletDisconnected = function() {
			updateRegisterButton()
			updateWalletProfileButton()
			syncPrimaryStarState()
			updateCardWalletInfo()
			renderNftQr()
		}

		${generateSharedWalletMountJs({
			network: env.SUI_NETWORK,
			session,
			onConnect: 'onRegisterWalletConnected',
			onDisconnect: 'onRegisterWalletDisconnected',
			profileButtonId: 'wallet-profile-btn',
			profileFallbackHref: 'https://sui.ski',
		})}

		;(function fitNameSize() {
			const nameEl = document.querySelector('.nft-name')
			if (!nameEl) return
			const fullName = NAME + '.sui'
			const len = fullName.length
			if (len > 12) {
				nameEl.style.fontSize = 'clamp(1.4rem, 6vw, 2rem)'
			} else if (len > 9) {
				nameEl.style.fontSize = 'clamp(1.7rem, 7.5vw, 2.4rem)'
			} else if (len > 7) {
				nameEl.style.fontSize = 'clamp(2rem, 8.5vw, 2.8rem)'
			}
		})()

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

		let __qrCreatorMod = null
		async function renderNftQr() {
			const canvas = document.getElementById('nft-qr')
			if (!canvas || !canvas.getContext) return
			try {
				if (!__qrCreatorMod) __qrCreatorMod = await import('https://esm.sh/qr-creator@1.0.0')
				const QrCreator = __qrCreatorMod.default || __qrCreatorMod
				let qrUrl = 'https://' + NAME + '.sui.ski'
				if (!scrubMode) {
					const address = getConnectedAddress()
					if (address) {
						const qrParams = new URLSearchParams()
						qrParams.set('ref', address)
						qrParams.set('rw', waapReferralAddress || WAAP_REFERRAL_ADDRESS)
						qrUrl += '?' + qrParams.toString()
					}
				}
				const ctx = canvas.getContext('2d')
				ctx.clearRect(0, 0, canvas.width, canvas.height)
				QrCreator.render({
					text: qrUrl,
					radius: 0.4,
					ecLevel: 'M',
					fill: '#49da91',
					background: 'transparent',
					size: 200,
				}, canvas)
			} catch {
				canvas.style.display = 'none'
			}
		}
		renderNftQr()

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
		if (walletProfileBtn && !walletProfileBtn.dataset.registerBound) {
			walletProfileBtn.dataset.registerBound = '1'
			walletProfileBtn.addEventListener('click', (e) => {
				e.stopPropagation()
				window.location.href = walletProfileBtn.dataset.href || 'https://sui.ski'
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
		if (scrubBtn) {
			scrubBtn.addEventListener('click', function() {
				scrubMode = !scrubMode
				scrubBtn.classList.toggle('active', scrubMode)
				updateCardWalletInfo()
				renderNftQr()
			})
		}
		let __html2canvasMod = null
		if (downloadQrBtn) {
			downloadQrBtn.addEventListener('click', async function() {
				const card = document.querySelector('body > div.container > div > div.nft-card')
				if (!card) return
				try {
					if (!__html2canvasMod) __html2canvasMod = await import('https://esm.sh/html2canvas@1.4.1')
					const html2canvas = __html2canvasMod.default || __html2canvasMod
					const canvas = await html2canvas(card, {
						backgroundColor: '#040d09',
						scale: 2,
						useCORS: true,
						logging: false,
					})
					const link = document.createElement('a')
					link.download = NAME + '-sui-ski.png'
					link.href = canvas.toDataURL('image/png')
					link.click()
				} catch {}
			})
		}
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
