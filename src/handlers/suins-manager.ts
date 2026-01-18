/**
 * SuiNS Manager UI
 *
 * Comprehensive interface for SuiNS contract interactions:
 * - Multi-token payments (SUI, NS)
 * - Subdomain management
 * - Coupon redemption
 * - Discount eligibility checking
 */
import type { Env } from '../types'
import { jsonResponse, errorResponse } from '../utils/response'

// SuiNS Contract addresses (mainnet)
const SUINS_CONTRACTS = {
	mainnet: {
		suins: '0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871',
		payments: '0xd5f2c5e55e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c',
		discounts: '0x6a9cf9a1c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5',
		coupons: '0x7b8cf9a1c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5',
		subdomains: '0x8c9cf9a1c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5',
		nsToken: '0x5145494a5f5100e645e4b797a6eeafa55fc0e089d400be81a68c0e8f952f9a39',
		dayOneNft: '0x1c3147c05ad5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5c5e5',
	},
	testnet: {
		suins: '0x22fa05f21b1ad71442571f63c41c3a64c3e67f7a4c8c0e43c4b4c5e5c5e5c5e5',
		payments: '0x22fa05f21b1ad71442571f63c41c3a64c3e67f7a4c8c0e43c4b4c5e5c5e5c5e5',
		discounts: '0x22fa05f21b1ad71442571f63c41c3a64c3e67f7a4c8c0e43c4b4c5e5c5e5c5e5',
		coupons: '0x22fa05f21b1ad71442571f63c41c3a64c3e67f7a4c8c0e43c4b4c5e5c5e5c5e5',
		subdomains: '0x22fa05f21b1ad71442571f63c41c3a64c3e67f7a4c8c0e43c4b4c5e5c5e5c5e5',
		nsToken: '0x22fa05f21b1ad71442571f63c41c3a64c3e67f7a4c8c0e43c4b4c5e5c5e5c5e5',
		dayOneNft: '0x22fa05f21b1ad71442571f63c41c3a64c3e67f7a4c8c0e43c4b4c5e5c5e5c5e5',
	},
}

// Escape HTML for security
function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

/**
 * Handle SuiNS Manager API requests
 */
export async function handleSuinsManagerRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname.replace('/api/suins', '')

	// CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		})
	}

	// Get contract addresses
	if (path === '/contracts') {
		const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
		return jsonResponse(SUINS_CONTRACTS[network])
	}

	// Get NS token price (relative to SUI)
	if (path === '/ns-price') {
		try {
			// TODO: Fetch actual NS/SUI price from DEX or price feed
			// For now, return a placeholder
			return jsonResponse({
				nsPerSui: 10, // 10 NS = 1 SUI (placeholder)
				discountPercent: 10, // 10% discount for NS payments
				source: 'placeholder',
			})
		} catch (error) {
			return errorResponse('Failed to fetch NS price', 'NS_PRICE_ERROR', 500)
		}
	}

	// Check discount eligibility
	if (path === '/check-discounts' && request.method === 'POST') {
		try {
			const body = await request.json() as { address: string }
			const { address } = body
			if (!address) {
				return errorResponse('Address required', 'INVALID_REQUEST', 400)
			}
			// TODO: Query on-chain for DayOne NFT and other eligible objects
			return jsonResponse({
				eligible: [],
				discounts: [],
			})
		} catch (error) {
			return errorResponse('Failed to check discounts', 'DISCOUNT_CHECK_ERROR', 500)
		}
	}

	// Request gas sponsorship for a transaction
	if (path === '/sponsor-tx' && request.method === 'POST') {
		try {
			const body = await request.json() as {
				txBytes: string
				sender: string
				operation: 'register' | 'renew' | 'subdomain'
			}
			const { txBytes, sender, operation: _operation } = body
			if (!txBytes || !sender) {
				return errorResponse('Transaction bytes and sender required', 'INVALID_REQUEST', 400)
			}
			// TODO: Implement gas sponsorship
			// 1. Verify the transaction is a valid SuiNS operation
			// 2. Check sponsorship budget/limits
			// 3. Sign the transaction as gas sponsor
			// 4. Return sponsored transaction bytes
			return jsonResponse({
				sponsored: false,
				message: 'Gas sponsorship not yet configured. Contact admin to enable.',
				sponsorAddress: null,
			})
		} catch (error) {
			return errorResponse('Failed to sponsor transaction', 'SPONSOR_ERROR', 500)
		}
	}

	// Get sponsorship status/limits
	if (path === '/sponsor-status') {
		return jsonResponse({
			enabled: false,
			sponsorAddress: null,
			dailyBudget: 0,
			remainingBudget: 0,
			eligibleOperations: ['register', 'renew', 'subdomain'],
			message: 'Gas sponsorship is not yet configured',
		})
	}

	// Get subdomains for a name
	if (path.startsWith('/subdomains/') && request.method === 'GET') {
		const parentName = path.replace('/subdomains/', '')
		if (!parentName) {
			return errorResponse('Parent name required', 'INVALID_REQUEST', 400)
		}
		// TODO: Query on-chain for subdomains
		return jsonResponse({
			parent: parentName,
			subdomains: [],
		})
	}

	return errorResponse('Not found', 'NOT_FOUND', 404)
}

/**
 * Generate SuiNS Manager page HTML
 */
export function generateSuinsManagerPage(env: Env, name?: string): string {
	const network = env.SUI_NETWORK || 'mainnet'
	const cleanName = name ? name.replace(/\.sui$/i, '').toLowerCase() : ''

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>SuiNS Manager | sui.ski</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
	<style>
		:root {
			--bg: #05060c;
			--card: rgba(15, 18, 32, 0.95);
			--border: rgba(255, 255, 255, 0.08);
			--text: #e4e6f1;
			--text-muted: #7c819b;
			--accent: #60a5fa;
			--accent-hover: #93c5fd;
			--success: #34d399;
			--error: #f87171;
			--warning: #fbbf24;
			--ns-color: #4DA2FF;
			--sui-color: #60a5fa;
		}
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: radial-gradient(ellipse at top, rgba(77,162,255,0.08), transparent 50%),
						radial-gradient(ellipse at bottom right, rgba(96,165,250,0.06), transparent 50%),
						linear-gradient(180deg, #05060c, #090d1a 50%, #05060c);
			min-height: 100vh;
			color: var(--text);
			padding: 24px 16px 64px;
		}
		.container {
			max-width: 1000px;
			margin: 0 auto;
		}
		.header {
			text-align: center;
			margin-bottom: 32px;
		}
		.header h1 {
			font-size: 2.2rem;
			font-weight: 800;
			margin-bottom: 8px;
			background: linear-gradient(135deg, var(--sui-color), var(--ns-color));
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.header p {
			color: var(--text-muted);
			font-size: 1rem;
		}
		.tabs {
			display: flex;
			gap: 8px;
			margin-bottom: 24px;
			border-bottom: 1px solid var(--border);
			padding-bottom: 16px;
			flex-wrap: wrap;
			justify-content: center;
		}
		.tab {
			padding: 10px 20px;
			border-radius: 10px;
			background: transparent;
			border: 1px solid var(--border);
			color: var(--text-muted);
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.tab:hover {
			background: rgba(255,255,255,0.05);
			color: var(--text);
		}
		.tab.active {
			background: linear-gradient(135deg, rgba(96,165,250,0.15), rgba(77,162,255,0.15));
			border-color: var(--accent);
			color: var(--accent);
		}
		.tab svg { width: 18px; height: 18px; }
		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 20px;
			padding: 28px;
			margin-bottom: 20px;
			box-shadow: 0 25px 60px rgba(5,6,12,0.7);
		}
		.card-title {
			font-size: 1.2rem;
			font-weight: 700;
			margin-bottom: 16px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.card-title svg { width: 22px; height: 22px; color: var(--accent); }
		.section { display: none; }
		.section.active { display: block; }

		/* Payment Comparison */
		.payment-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 16px;
			margin: 20px 0;
		}
		@media (max-width: 600px) {
			.payment-grid { grid-template-columns: 1fr; }
		}
		.payment-option {
			padding: 20px;
			border: 2px solid var(--border);
			border-radius: 16px;
			cursor: pointer;
			transition: all 0.2s;
			position: relative;
		}
		.payment-option:hover {
			border-color: rgba(255,255,255,0.2);
		}
		.payment-option.selected {
			border-color: var(--accent);
			background: rgba(96,165,250,0.08);
		}
		.payment-option.ns-option.selected {
			border-color: var(--ns-color);
			background: rgba(77,162,255,0.08);
		}
		.payment-badge {
			position: absolute;
			top: -10px;
			right: 16px;
			padding: 4px 12px;
			border-radius: 20px;
			font-size: 0.7rem;
			font-weight: 700;
			text-transform: uppercase;
		}
		.payment-badge.discount {
			background: rgba(52,211,153,0.2);
			color: var(--success);
			border: 1px solid rgba(52,211,153,0.3);
		}
		.payment-header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 12px;
		}
		.payment-icon {
			width: 40px;
			height: 40px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 800;
			font-size: 0.9rem;
		}
		.sui-icon {
			background: linear-gradient(135deg, rgba(96,165,250,0.3), rgba(96,165,250,0.1));
			color: var(--sui-color);
		}
		.ns-icon {
			background: linear-gradient(135deg, rgba(77,162,255,0.3), rgba(77,162,255,0.1));
			color: var(--ns-color);
		}
		.payment-name {
			font-size: 1.1rem;
			font-weight: 700;
		}
		.payment-price {
			font-size: 1.8rem;
			font-weight: 800;
			margin: 8px 0;
		}
		.payment-price .currency {
			font-size: 1rem;
			color: var(--text-muted);
			font-weight: 600;
		}
		.payment-usd {
			font-size: 0.9rem;
			color: var(--text-muted);
		}
		.payment-savings {
			margin-top: 12px;
			padding: 8px 12px;
			background: rgba(52,211,153,0.1);
			border-radius: 8px;
			font-size: 0.85rem;
			color: var(--success);
		}

		/* Form Elements */
		.form-group {
			margin-bottom: 20px;
		}
		.form-label {
			display: block;
			font-size: 0.85rem;
			font-weight: 600;
			color: var(--text-muted);
			margin-bottom: 8px;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.form-input {
			width: 100%;
			padding: 14px 16px;
			background: rgba(0,0,0,0.3);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 1rem;
			font-family: inherit;
			transition: all 0.2s;
		}
		.form-input:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 3px rgba(96,165,250,0.15);
		}
		.form-input::placeholder {
			color: var(--text-muted);
		}
		.form-hint {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-top: 6px;
		}

		/* Buttons */
		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 14px 24px;
			border-radius: 12px;
			font-size: 1rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			border: none;
			font-family: inherit;
		}
		.btn-primary {
			background: linear-gradient(135deg, var(--accent), #3b82f6);
			color: white;
		}
		.btn-primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 20px rgba(96,165,250,0.3);
		}
		.btn-secondary {
			background: rgba(255,255,255,0.05);
			border: 1px solid var(--border);
			color: var(--text);
		}
		.btn-secondary:hover {
			background: rgba(255,255,255,0.1);
		}
		.btn-ns {
			background: linear-gradient(135deg, var(--ns-color), #2563eb);
			color: white;
		}
		.btn svg { width: 18px; height: 18px; }
		.btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none !important;
		}

		/* Subdomain List */
		.subdomain-list {
			border: 1px solid var(--border);
			border-radius: 12px;
			overflow: hidden;
		}
		.subdomain-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px;
			border-bottom: 1px solid var(--border);
		}
		.subdomain-item:last-child { border-bottom: none; }
		.subdomain-name {
			font-weight: 600;
			font-family: ui-monospace, monospace;
		}
		.subdomain-meta {
			font-size: 0.85rem;
			color: var(--text-muted);
		}
		.subdomain-actions {
			display: flex;
			gap: 8px;
		}

		/* Discount Cards */
		.discount-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 12px;
		}
		.discount-card {
			padding: 16px;
			border: 1px solid var(--border);
			border-radius: 12px;
			text-align: center;
		}
		.discount-card.eligible {
			border-color: var(--success);
			background: rgba(52,211,153,0.08);
		}
		.discount-icon {
			font-size: 2rem;
			margin-bottom: 8px;
		}
		.discount-name {
			font-weight: 600;
			margin-bottom: 4px;
		}
		.discount-value {
			font-size: 1.2rem;
			font-weight: 700;
			color: var(--success);
		}

		/* Sponsor Operation Badges */
		.sponsor-op-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 8px 14px;
			border-radius: 20px;
			font-size: 0.8rem;
			font-weight: 600;
			background: rgba(255,255,255,0.05);
			border: 1px solid var(--border);
			color: var(--text-muted);
			transition: all 0.2s;
		}
		.sponsor-op-badge.active {
			background: rgba(52,211,153,0.15);
			border-color: rgba(52,211,153,0.3);
			color: var(--success);
		}
		.sponsor-op-badge.disabled {
			opacity: 0.5;
			text-decoration: line-through;
		}

		/* Status Messages */
		.status {
			padding: 12px 16px;
			border-radius: 10px;
			font-size: 0.9rem;
			margin-top: 16px;
			display: none;
		}
		.status.visible { display: block; }
		.status.success {
			background: rgba(52,211,153,0.15);
			border: 1px solid rgba(52,211,153,0.3);
			color: var(--success);
		}
		.status.error {
			background: rgba(248,113,113,0.15);
			border: 1px solid rgba(248,113,113,0.3);
			color: var(--error);
		}
		.status.loading {
			background: rgba(96,165,250,0.15);
			border: 1px solid rgba(96,165,250,0.3);
			color: var(--accent);
		}

		/* Connect Wallet */
		.wallet-banner {
			background: linear-gradient(135deg, rgba(96,165,250,0.1), rgba(77,162,255,0.1));
			border: 1px dashed var(--accent);
			border-radius: 16px;
			padding: 24px;
			text-align: center;
			margin-bottom: 24px;
		}
		.wallet-banner h3 {
			margin-bottom: 8px;
		}
		.wallet-banner p {
			color: var(--text-muted);
			margin-bottom: 16px;
		}

		/* Price Calculator */
		.price-calculator {
			background: rgba(0,0,0,0.2);
			border-radius: 12px;
			padding: 20px;
			margin: 20px 0;
		}
		.price-row {
			display: flex;
			justify-content: space-between;
			padding: 8px 0;
			border-bottom: 1px dashed rgba(255,255,255,0.1);
		}
		.price-row:last-child { border-bottom: none; }
		.price-row.total {
			font-weight: 700;
			font-size: 1.1rem;
			padding-top: 12px;
			margin-top: 8px;
			border-top: 1px solid var(--border);
			border-bottom: none;
		}
		.price-label { color: var(--text-muted); }
		.price-value { font-family: ui-monospace, monospace; }

		/* Network Badge */
		.network-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			border-radius: 20px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			background: rgba(96,165,250,0.15);
			color: var(--accent);
			margin-bottom: 16px;
		}
		.network-badge .dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: var(--success);
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<span class="network-badge">
				<span class="dot"></span>
				${escapeHtml(network)}
			</span>
			<h1>SuiNS Manager</h1>
			<p>Register names, manage subdomains, and apply discounts</p>
		</div>

		<div class="tabs">
			<button class="tab active" data-tab="payments">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="2" y="5" width="20" height="14" rx="2"/>
					<line x1="2" y1="10" x2="22" y2="10"/>
				</svg>
				Payments
			</button>
			<button class="tab" data-tab="subdomains">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"/>
					<line x1="2" y1="12" x2="22" y2="12"/>
					<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
				</svg>
				Subdomains
			</button>
			<button class="tab" data-tab="sponsor">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
				</svg>
				Gas Sponsor
			</button>
			<button class="tab" data-tab="discounts">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
				</svg>
				Discounts
			</button>
		</div>

		<!-- Wallet Connection Banner -->
		<div class="wallet-banner" id="wallet-banner">
			<h3>Connect Your Wallet</h3>
			<p>Connect your Sui wallet to manage names and make payments</p>
			<button class="btn btn-primary" id="connect-wallet-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"/>
					<circle cx="16" cy="8" r="2"/>
					<path d="M18 12h4m-2-2v4"/>
				</svg>
				Connect Wallet
			</button>
		</div>

		<!-- Payments Section -->
		<section class="section active" id="payments-section">
			<div class="card">
				<h2 class="card-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="2" y="5" width="20" height="14" rx="2"/>
						<line x1="2" y1="10" x2="22" y2="10"/>
					</svg>
					Multi-Token Payments
				</h2>
				<p style="color: var(--text-muted); margin-bottom: 20px;">
					Pay for SuiNS registrations with SUI or $NS tokens. Using $NS provides a discount equivalent to 3 days on the premium decay curve.
				</p>

				<div class="form-group">
					<label class="form-label">Domain Name</label>
					<input type="text" class="form-input" id="domain-input" placeholder="yourname" value="${escapeHtml(cleanName)}">
					<p class="form-hint">Enter the name without .sui suffix</p>
				</div>

				<div class="form-group">
					<label class="form-label">Registration Period</label>
					<select class="form-input" id="years-select">
						<option value="1">1 Year</option>
						<option value="2">2 Years</option>
						<option value="3">3 Years</option>
						<option value="5">5 Years</option>
					</select>
				</div>

				<h3 style="font-size: 1rem; margin-bottom: 12px; color: var(--text-muted);">Select Payment Method</h3>

				<div class="payment-grid">
					<div class="payment-option selected" data-payment="sui" id="sui-payment">
						<div class="payment-header">
							<div class="payment-icon sui-icon">SUI</div>
							<div class="payment-name">Pay with SUI</div>
						</div>
						<div class="payment-price">
							<span id="sui-price">--</span>
							<span class="currency">SUI</span>
						</div>
						<div class="payment-usd">≈ $<span id="sui-usd">--</span> USD</div>
					</div>

					<div class="payment-option ns-option" data-payment="ns" id="ns-payment">
						<span class="payment-badge discount">3-Day Discount</span>
						<div class="payment-header">
							<div class="payment-icon ns-icon">NS</div>
							<div class="payment-name">Pay with $NS</div>
						</div>
						<div class="payment-price">
							<span id="ns-price">--</span>
							<span class="currency">NS</span>
						</div>
						<div class="payment-usd">≈ $<span id="ns-usd">--</span> USD</div>
						<div class="payment-savings" id="ns-savings">
							Save <span id="savings-amount">--</span> SUI equivalent
						</div>
					</div>
				</div>

				<div class="price-calculator">
					<div class="price-row">
						<span class="price-label">Base Registration Price</span>
						<span class="price-value" id="base-price">-- SUI</span>
					</div>
					<div class="price-row">
						<span class="price-label">Premium (Grace Period)</span>
						<span class="price-value" id="premium-price">-- SUI</span>
					</div>
					<div class="price-row">
						<span class="price-label">Discount Applied</span>
						<span class="price-value" id="discount-amount" style="color: var(--success);">-0 SUI</span>
					</div>
					<div class="price-row total">
						<span class="price-label">Total</span>
						<span class="price-value" id="total-price">-- SUI</span>
					</div>
				</div>

				<button class="btn btn-primary" id="register-btn" style="width: 100%;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 6L9 17l-5-5"/>
					</svg>
					Register Name
				</button>

				<div class="status" id="payment-status"></div>
			</div>
		</section>

		<!-- Subdomains Section -->
		<section class="section" id="subdomains-section">
			<div class="card">
				<h2 class="card-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"/>
						<line x1="2" y1="12" x2="22" y2="12"/>
						<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
					</svg>
					Subdomain Manager
				</h2>
				<p style="color: var(--text-muted); margin-bottom: 20px;">
					Create and manage subdomains for your SuiNS names. Configure permissions and expiration rules.
				</p>

				<div class="form-group">
					<label class="form-label">Parent Domain</label>
					<select class="form-input" id="parent-domain-select">
						<option value="">Connect wallet to see your names</option>
					</select>
				</div>

				<div class="form-group">
					<label class="form-label">Create New Subdomain</label>
					<div style="display: flex; gap: 12px;">
						<input type="text" class="form-input" id="subdomain-input" placeholder="sub" style="flex: 1;">
						<span style="display: flex; align-items: center; color: var(--text-muted);">.parent.sui</span>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label">Subdomain Type</label>
					<div style="display: flex; gap: 12px;">
						<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
							<input type="radio" name="subdomain-type" value="leaf" checked>
							<span>Leaf (no children)</span>
						</label>
						<label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
							<input type="radio" name="subdomain-type" value="node">
							<span>Node (can have children)</span>
						</label>
					</div>
				</div>

				<div class="form-group">
					<label class="form-label">Target Address</label>
					<input type="text" class="form-input" id="subdomain-target" placeholder="0x...">
					<p class="form-hint">The address this subdomain will resolve to</p>
				</div>

				<button class="btn btn-primary" id="create-subdomain-btn" style="width: 100%; margin-bottom: 24px;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="12" y1="5" x2="12" y2="19"/>
						<line x1="5" y1="12" x2="19" y2="12"/>
					</svg>
					Create Subdomain
				</button>

				<h3 style="font-size: 1rem; margin-bottom: 12px;">Existing Subdomains</h3>
				<div class="subdomain-list" id="subdomain-list">
					<div class="subdomain-item" style="justify-content: center; color: var(--text-muted);">
						No subdomains found. Select a parent domain to view subdomains.
					</div>
				</div>

				<div class="status" id="subdomain-status"></div>
			</div>
		</section>

		<!-- Gas Sponsorship Section -->
		<section class="section" id="sponsor-section">
			<div class="card">
				<h2 class="card-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
					</svg>
					Gas Sponsorship
				</h2>
				<p style="color: var(--text-muted); margin-bottom: 20px;">
					Get your SuiNS transactions sponsored - no SUI needed for gas fees. Perfect for new users or bulk operations.
				</p>

				<div class="sponsor-status-card" id="sponsor-status-card">
					<div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(0,0,0,0.2); border-radius: 12px; margin-bottom: 20px;">
						<div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, rgba(96,165,250,0.2), rgba(77,162,255,0.2)); display: flex; align-items: center; justify-content: center;">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent);">
								<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
							</svg>
						</div>
						<div style="flex: 1;">
							<div style="font-weight: 600; margin-bottom: 4px;">Sponsorship Status</div>
							<div style="font-size: 0.9rem; color: var(--text-muted);" id="sponsor-status-text">Checking...</div>
						</div>
						<div id="sponsor-status-indicator" style="width: 12px; height: 12px; border-radius: 50%; background: var(--text-muted);"></div>
					</div>
				</div>

				<div class="sponsor-stats" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
					<div style="padding: 16px; background: rgba(0,0,0,0.2); border-radius: 12px; text-align: center;">
						<div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Daily Budget</div>
						<div style="font-size: 1.3rem; font-weight: 700;" id="sponsor-daily-budget">-- SUI</div>
					</div>
					<div style="padding: 16px; background: rgba(0,0,0,0.2); border-radius: 12px; text-align: center;">
						<div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Remaining</div>
						<div style="font-size: 1.3rem; font-weight: 700; color: var(--success);" id="sponsor-remaining">-- SUI</div>
					</div>
					<div style="padding: 16px; background: rgba(0,0,0,0.2); border-radius: 12px; text-align: center;">
						<div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Sponsor</div>
						<div style="font-size: 0.85rem; font-weight: 600; font-family: ui-monospace, monospace;" id="sponsor-address">--</div>
					</div>
				</div>

				<h3 style="font-size: 1rem; margin-bottom: 12px;">Eligible Operations</h3>
				<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px;">
					<span class="sponsor-op-badge" data-op="register">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
							<path d="M12 5v14M5 12h14"/>
						</svg>
						Register
					</span>
					<span class="sponsor-op-badge" data-op="renew">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
							<polyline points="23 4 23 10 17 10"/>
							<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
						</svg>
						Renew
					</span>
					<span class="sponsor-op-badge" data-op="subdomain">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
							<circle cx="12" cy="12" r="10"/>
							<line x1="2" y1="12" x2="22" y2="12"/>
						</svg>
						Subdomain
					</span>
				</div>

				<div style="padding: 16px; background: linear-gradient(135deg, rgba(96,165,250,0.1), rgba(77,162,255,0.1)); border: 1px dashed var(--accent); border-radius: 12px;">
					<h4 style="margin-bottom: 8px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
							<circle cx="12" cy="12" r="10"/>
							<line x1="12" y1="16" x2="12" y2="12"/>
							<line x1="12" y1="8" x2="12" y2="8"/>
						</svg>
						How Gas Sponsorship Works
					</h4>
					<ol style="color: var(--text-muted); font-size: 0.85rem; padding-left: 20px;">
						<li>Build your transaction (register, renew, or create subdomain)</li>
						<li>Submit the unsigned transaction to the sponsor</li>
						<li>Sponsor validates and signs the gas portion</li>
						<li>You sign only the user portion and execute</li>
					</ol>
				</div>

				<button class="btn btn-primary" id="refresh-sponsor-btn" style="width: 100%; margin-top: 20px;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="23 4 23 10 17 10"/>
						<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
					</svg>
					Refresh Sponsor Status
				</button>

				<div class="status" id="sponsor-section-status"></div>
			</div>
		</section>

		<!-- Discounts Section -->
		<section class="section" id="discounts-section">
			<div class="card">
				<h2 class="card-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
					</svg>
					Discount Eligibility
				</h2>
				<p style="color: var(--text-muted); margin-bottom: 20px;">
					Check if your wallet holds any NFTs or objects that qualify for registration discounts.
				</p>

				<button class="btn btn-secondary" id="check-discounts-btn" style="width: 100%; margin-bottom: 24px;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"/>
						<path d="M21 21l-4.35-4.35"/>
					</svg>
					Check My Discounts
				</button>

				<h3 style="font-size: 1rem; margin-bottom: 16px;">Available Discount Types</h3>

				<div class="discount-grid">
					<div class="discount-card" id="dayone-discount">
						<div class="discount-icon">🎫</div>
						<div class="discount-name">DayOne NFT</div>
						<div class="discount-value">Up to 50% off</div>
						<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
							Early supporter discount
						</div>
					</div>

					<div class="discount-card" id="free-claim">
						<div class="discount-icon">🎁</div>
						<div class="discount-name">Free Claims</div>
						<div class="discount-value">100% off</div>
						<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
							Promotional free registration
						</div>
					</div>

					<div class="discount-card" id="ns-discount">
						<div class="discount-icon">💎</div>
						<div class="discount-name">$NS Payment</div>
						<div class="discount-value">3-Day Discount</div>
						<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
							Pay with NS tokens
						</div>
					</div>
				</div>

				<div style="margin-top: 24px;">
					<h3 style="font-size: 1rem; margin-bottom: 12px;">Your Eligible Objects</h3>
					<div id="eligible-objects" style="padding: 16px; background: rgba(0,0,0,0.2); border-radius: 12px; color: var(--text-muted); text-align: center;">
						Connect wallet to check eligibility
					</div>
				</div>

				<div class="status" id="discount-status"></div>
			</div>
		</section>
	</div>

	<script>
		// Tab switching
		document.querySelectorAll('.tab').forEach(tab => {
			tab.addEventListener('click', () => {
				document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
				document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
				tab.classList.add('active');
				document.getElementById(tab.dataset.tab + '-section').classList.add('active');
			});
		});

		// Payment method selection
		document.querySelectorAll('.payment-option').forEach(option => {
			option.addEventListener('click', () => {
				document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
				option.classList.add('selected');
				updatePriceDisplay();
			});
		});

		// State
		let suiPrice = null;
		let nsPrice = null;
		let pricingData = null;
		let connectedAddress = null;

		// Number formatters
		const suiFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
		const usdFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

		// Fetch SUI price
		async function fetchSuiPrice() {
			try {
				const res = await fetch('/api/sui-price');
				const data = await res.json();
				suiPrice = data.price;
				updatePriceDisplay();
			} catch (e) {
				console.error('Failed to fetch SUI price:', e);
			}
		}

		// Fetch SuiNS pricing
		async function fetchPricing() {
			try {
				const res = await fetch('/api/pricing');
				pricingData = await res.json();
				updatePriceDisplay();
			} catch (e) {
				console.error('Failed to fetch pricing:', e);
			}
		}

		// Get price for domain length
		function getPriceForLength(length) {
			if (!pricingData) return 0;

			// Check exact length first
			if (pricingData[String(length)]) {
				return pricingData[String(length)] / 1e9; // Convert MIST to SUI
			}

			// Check ranges
			for (const [key, value] of Object.entries(pricingData)) {
				if (key.includes('-')) {
					const [min, max] = key.split('-').map(Number);
					if (length >= min && length <= max) {
						return value / 1e9;
					}
				}
			}

			// Default to 5+ character price
			return (pricingData['5-63'] || pricingData['5'] || 200000000000) / 1e9;
		}

		// Update price display
		function updatePriceDisplay() {
			const domainInput = document.getElementById('domain-input');
			const yearsSelect = document.getElementById('years-select');
			const domainName = domainInput.value.trim().toLowerCase();
			const years = parseInt(yearsSelect.value);

			if (!domainName || domainName.length < 3) {
				document.getElementById('sui-price').textContent = '--';
				document.getElementById('ns-price').textContent = '--';
				return;
			}

			const basePrice = getPriceForLength(domainName.length) * years;
			const nsDiscount = 0.1; // 10% discount for NS (3-day equivalent)
			const nsBasePrice = basePrice * (1 - nsDiscount);

			// Update SUI payment
			document.getElementById('sui-price').textContent = suiFormatter.format(basePrice);
			if (suiPrice) {
				document.getElementById('sui-usd').textContent = usdFormatter.format(basePrice * suiPrice);
			}

			// Update NS payment (assuming 1 NS = 0.1 SUI for display)
			const nsRate = 10; // 10 NS per SUI
			const nsAmount = nsBasePrice * nsRate;
			document.getElementById('ns-price').textContent = suiFormatter.format(nsAmount);
			if (suiPrice) {
				document.getElementById('ns-usd').textContent = usdFormatter.format(nsBasePrice * suiPrice);
			}

			// Update savings
			const savings = basePrice - nsBasePrice;
			document.getElementById('savings-amount').textContent = suiFormatter.format(savings);

			// Update price calculator
			document.getElementById('base-price').textContent = suiFormatter.format(basePrice) + ' SUI';
			document.getElementById('premium-price').textContent = '0 SUI'; // Premium calculated separately

			const selectedPayment = document.querySelector('.payment-option.selected').dataset.payment;
			const discount = selectedPayment === 'ns' ? savings : 0;
			const total = selectedPayment === 'ns' ? nsBasePrice : basePrice;

			document.getElementById('discount-amount').textContent = '-' + suiFormatter.format(discount) + ' SUI';
			document.getElementById('total-price').textContent = suiFormatter.format(total) + ' SUI';
		}

		// Event listeners
		document.getElementById('domain-input').addEventListener('input', updatePriceDisplay);
		document.getElementById('years-select').addEventListener('change', updatePriceDisplay);

		// Initialize
		fetchSuiPrice();
		fetchPricing();
		setInterval(fetchSuiPrice, 60000);

		// Gas sponsorship status
		async function fetchSponsorStatus() {
			const statusText = document.getElementById('sponsor-status-text');
			const statusIndicator = document.getElementById('sponsor-status-indicator');
			const dailyBudget = document.getElementById('sponsor-daily-budget');
			const remaining = document.getElementById('sponsor-remaining');
			const sponsorAddress = document.getElementById('sponsor-address');

			try {
				const res = await fetch('/api/suins/sponsor-status');
				const data = await res.json();

				if (data.enabled) {
					statusText.textContent = 'Sponsorship Active';
					statusIndicator.style.background = 'var(--success)';
					dailyBudget.textContent = (data.dailyBudget / 1e9).toFixed(2) + ' SUI';
					remaining.textContent = (data.remainingBudget / 1e9).toFixed(2) + ' SUI';
					sponsorAddress.textContent = data.sponsorAddress ?
						data.sponsorAddress.slice(0, 6) + '...' + data.sponsorAddress.slice(-4) : '--';

					// Mark eligible operations as active
					data.eligibleOperations.forEach(op => {
						const badge = document.querySelector('.sponsor-op-badge[data-op="' + op + '"]');
						if (badge) badge.classList.add('active');
					});
				} else {
					statusText.textContent = data.message || 'Sponsorship Not Configured';
					statusIndicator.style.background = 'var(--warning)';
					dailyBudget.textContent = '0 SUI';
					remaining.textContent = '0 SUI';
					sponsorAddress.textContent = '--';
				}
			} catch (e) {
				statusText.textContent = 'Failed to fetch status';
				statusIndicator.style.background = 'var(--error)';
			}
		}

		// Refresh sponsor status button
		document.getElementById('refresh-sponsor-btn').addEventListener('click', () => {
			fetchSponsorStatus();
		});

		// Fetch sponsor status on load
		fetchSponsorStatus();

		// Check discounts
		document.getElementById('check-discounts-btn').addEventListener('click', async () => {
			const status = document.getElementById('discount-status');
			const eligibleDiv = document.getElementById('eligible-objects');

			if (!connectedAddress) {
				status.textContent = 'Please connect your wallet first';
				status.className = 'status visible error';
				return;
			}

			status.textContent = 'Checking eligibility...';
			status.className = 'status visible loading';

			try {
				const res = await fetch('/api/suins/check-discounts', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ address: connectedAddress })
				});
				const data = await res.json();

				if (data.eligible && data.eligible.length > 0) {
					eligibleDiv.innerHTML = data.eligible.map(obj =>
						'<div style="padding: 8px; border: 1px solid var(--success); border-radius: 8px; margin-bottom: 8px;">' +
						'<strong>' + obj.type + '</strong> - ' + obj.discount + '% discount</div>'
					).join('');

					// Mark eligible discount cards
					data.eligible.forEach(obj => {
						if (obj.type === 'DayOne') {
							document.getElementById('dayone-discount').classList.add('eligible');
						}
					});

					status.textContent = 'Found ' + data.eligible.length + ' eligible discount(s)!';
					status.className = 'status visible success';
				} else {
					eligibleDiv.innerHTML = '<p>No eligible discount objects found in your wallet.</p>';
					status.textContent = 'No discounts available';
					status.className = 'status visible';
				}
			} catch (e) {
				status.textContent = 'Failed to check discounts';
				status.className = 'status visible error';
			}
		});

		// Wallet connection placeholder
		document.getElementById('connect-wallet-btn').addEventListener('click', () => {
			// This would integrate with @mysten/dapp-kit in production
			alert('Wallet connection would be implemented with @mysten/dapp-kit');
		});

		// Register button placeholder
		document.getElementById('register-btn').addEventListener('click', () => {
			const status = document.getElementById('payment-status');
			if (!connectedAddress) {
				status.textContent = 'Please connect your wallet first';
				status.className = 'status visible error';
				return;
			}
			status.textContent = 'Registration would be implemented with PTB transaction';
			status.className = 'status visible loading';
		});

		// Create subdomain placeholder
		document.getElementById('create-subdomain-btn').addEventListener('click', () => {
			const status = document.getElementById('subdomain-status');
			if (!connectedAddress) {
				status.textContent = 'Please connect your wallet first';
				status.className = 'status visible error';
				return;
			}
			status.textContent = 'Subdomain creation would be implemented with PTB transaction';
			status.className = 'status visible loading';
		});
	</script>
</body>
</html>`
}
