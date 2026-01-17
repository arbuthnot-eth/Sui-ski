import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import { getNetworkStatus } from '../resolvers/rpc'
import type { Env } from '../types'
import { htmlResponse, jsonResponse } from '../utils/response'
import { renderSocialMeta } from '../utils/social'

interface LandingPageOptions {
	canonicalUrl?: string
}

/**
 * Handle requests to the root domain (sui.ski)
 */
export async function handleLandingPage(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const canonicalUrl = `${url.protocol}//${url.hostname}${url.pathname || '/'}`

	// API endpoint for status
	if (url.pathname === '/api/status') {
		const status = await getNetworkStatus(env)
		return jsonResponse(status)
	}

	// API endpoint for resolving names programmatically
	if (url.pathname === '/api/resolve' && url.searchParams.has('name')) {
		const name = url.searchParams.get('name')
		if (!name) {
			return jsonResponse({ error: 'Name parameter required' }, 400)
		}
		// Import dynamically to avoid circular dependencies
		const { resolveSuiNS } = await import('../resolvers/suins')
		const result = await resolveSuiNS(name, env)
		return jsonResponse(result)
	}

	// API endpoint for SuiNS pricing
	if (url.pathname === '/api/pricing') {
		try {
			const pricing = await getSuiNSPricing(env)
			return jsonResponse(pricing)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to fetch pricing'
			return jsonResponse({ error: message }, 500)
		}
	}

	// Landing page HTML
	return htmlResponse(landingPageHTML(env.SUI_NETWORK, { canonicalUrl }))
}

/**
 * Fetch SuiNS pricing from on-chain config
 */
async function getSuiNSPricing(env: Env): Promise<Record<string, number>> {
	const client = new SuiClient({ url: env.SUI_RPC_URL })
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const suinsClient = new SuinsClient({ client: client as never, network })

	const priceList = await suinsClient.getPriceList()

	// Convert Map to object with human-readable keys
	// Format: { "3": price, "4": price, "5+": price } (price per year in MIST)
	const pricing: Record<string, number> = {}

	for (const [key, value] of priceList.entries()) {
		const [minLen, maxLen] = key
		if (minLen === maxLen) {
			pricing[String(minLen)] = value
		} else {
			pricing[`${minLen}-${maxLen}`] = value
		}
	}

	return pricing
}

function landingPageHTML(network: string, options: LandingPageOptions = {}): string {
	const escapeHtml = (value: string) =>
		value.replace(/[&<>"']/g, (char) => {
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
	const canonicalUrl = options.canonicalUrl || 'https://sui.ski'
	let canonicalOrigin = 'https://sui.ski'
	try {
		canonicalOrigin = new URL(canonicalUrl).origin
	} catch {
		canonicalOrigin = 'https://sui.ski'
	}
	const pageDescription =
		'Access Sui blockchain content through human-readable URLs. Resolve SuiNS names, Move Registry packages, and decentralized content.'
	const socialMeta = renderSocialMeta({
		title: 'sui.ski - Sui Gateway',
		description: pageDescription,
		url: canonicalUrl,
		siteName: 'sui.ski',
		image: `${canonicalOrigin}/icon-512.png`,
		imageAlt: 'sui.ski icon',
	})
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>sui.ski - Sui Gateway</title>
	<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
	<meta name="description" content="${escapeHtml(pageDescription)}">
${socialMeta}
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 60px 20px 40px;
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
		.container { max-width: 1100px; width: 100%; position: relative; margin: 0 auto; }
		.portal-section {
			margin-bottom: 48px;
			padding: 32px;
			border-radius: 28px;
			background: linear-gradient(140deg, rgba(30, 27, 75, 0.8), rgba(15, 118, 110, 0.45));
			border: 1px solid rgba(255, 255, 255, 0.08);
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
			position: relative;
			overflow: hidden;
		}
		.portal-section::after {
			content: '';
			position: absolute;
			inset: 0;
			pointer-events: none;
			background: radial-gradient(circle at 10% 20%, rgba(96, 165, 250, 0.25), transparent 45%),
				radial-gradient(circle at 90% 10%, rgba(248, 113, 113, 0.18), transparent 40%);
			opacity: 0.6;
		}
		.portal-content {
			position: relative;
			z-index: 1;
		}
		.portal-header {
			display: flex;
			flex-wrap: wrap;
			justify-content: space-between;
			align-items: flex-start;
			gap: 24px;
			margin-bottom: 24px;
		}
		.portal-header h2 {
			font-size: 2.5rem;
			margin-bottom: 8px;
			color: #f8fafc;
		}
		.portal-desc {
			color: #cbd5f5;
			font-size: 1rem;
			max-width: 640px;
		}
		.portal-badge {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			font-size: 0.85rem;
			text-transform: uppercase;
			letter-spacing: 0.2em;
			color: #a5b4fc;
			font-weight: 600;
		}
		.portal-meta {
			display: flex;
			gap: 12px;
			align-items: center;
			flex-wrap: wrap;
		}
		.status-pill {
			padding: 8px 16px;
			background: rgba(15, 118, 110, 0.2);
			border-radius: 999px;
			font-size: 0.85rem;
			color: #5eead4;
			font-weight: 600;
			border: 1px solid rgba(94, 234, 212, 0.3);
		}
		.cta-link {
			color: #bfdbfe;
			font-weight: 600;
			text-decoration: none;
		}
		.cta-link:hover { color: #e0f2fe; }
		.portal-tabs {
			display: flex;
			gap: 12px;
			flex-wrap: wrap;
			position: relative;
			z-index: 1;
			margin-bottom: 24px;
		}
		.portal-tab {
			display: inline-flex;
			align-items: center;
			gap: 10px;
			padding: 12px 18px;
			border-radius: 14px;
			border: 1px solid rgba(255, 255, 255, 0.12);
			background: rgba(15, 23, 42, 0.4);
			color: #cbd5f5;
			font-weight: 600;
			font-size: 0.95rem;
			cursor: pointer;
			transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
		}
		.portal-tab svg {
			width: 18px;
			height: 18px;
		}
		.portal-tab.active {
			background: rgba(99, 102, 241, 0.25);
			border-color: rgba(99, 102, 241, 0.6);
			color: #fff;
			box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25);
		}
		.portal-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 28px;
			position: relative;
			z-index: 1;
		}
		.portal-panel {
			background: rgba(15, 15, 25, 0.8);
			border-radius: 24px;
			padding: 24px;
			border: 1px solid rgba(255, 255, 255, 0.08);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
		}
		.portal-panel h3 {
			margin-bottom: 16px;
			font-size: 1.35rem;
			color: #f1f5f9;
		}
		.portal-panel--preview {
			background: rgba(2, 6, 23, 0.85);
		}
		.portal-fields { display: flex; flex-direction: column; gap: 18px; }
		.portal-field label {
			display: block;
			margin-bottom: 8px;
			font-size: 0.9rem;
			font-weight: 600;
			color: #e2e8f0;
		}
		.portal-field input,
		.portal-field textarea {
			width: 100%;
			padding: 14px 16px;
			border-radius: 14px;
			border: 1px solid rgba(148, 163, 184, 0.4);
			background: rgba(15, 23, 42, 0.6);
			color: #f8fafc;
			font-size: 0.95rem;
			transition: border-color 0.2s ease, box-shadow 0.2s ease;
		}
		.portal-field input:focus,
		.portal-field textarea:focus {
			border-color: rgba(99, 102, 241, 0.8);
			box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
			outline: none;
		}
		.portal-field textarea {
			resize: none;
			min-height: 130px;
		}
		.field-hint {
			font-size: 0.8rem;
			color: #cbd5f5;
			margin-top: 6px;
		}
		.portal-field-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 16px;
		}
		.portal-actions {
			margin-top: 16px;
		}
		.ghost-button {
			width: 100%;
			padding: 14px;
			border-radius: 14px;
			background: rgba(248, 250, 252, 0.05);
			color: #e2e8f0;
			border: 1px solid rgba(255, 255, 255, 0.08);
			font-weight: 600;
			cursor: pointer;
			transition: background 0.2s ease, border-color 0.2s ease;
		}
		.ghost-button:hover {
			background: rgba(248, 250, 252, 0.08);
			border-color: rgba(255, 255, 255, 0.18);
		}
		.qr-preview-box {
			background: rgba(15, 23, 42, 0.9);
			border-radius: 20px;
			padding: 24px;
			border: 1px solid rgba(255, 255, 255, 0.08);
			min-height: 320px;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			text-align: center;
		}
		.qr-placeholder {
			color: #94a3b8;
		}
		.qr-placeholder svg {
			width: 64px;
			height: 64px;
			margin-bottom: 12px;
			color: rgba(148, 163, 184, 0.6);
		}
		.qr-container canvas,
		.qr-container img {
			max-width: 280px;
			width: 100%;
			border-radius: 20px;
			background: #fff;
			box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
		}
		.qr-preview p {
			margin-top: 12px;
			font-size: 0.9rem;
			color: #cbd5f5;
		}
		.qr-actions {
			display: flex;
			gap: 12px;
			margin-top: 20px;
			flex-wrap: wrap;
		}
		.qr-actions button {
			flex: 1;
			min-width: 140px;
			padding: 12px 16px;
			border-radius: 14px;
			border: none;
			font-weight: 600;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			transition: transform 0.2s ease, box-shadow 0.2s ease;
		}
		.qr-actions button.primary {
			background: linear-gradient(120deg, #7c3aed, #2563eb);
			color: #fff;
			box-shadow: 0 15px 30px rgba(37, 99, 235, 0.25);
		}
		.qr-actions button.secondary {
			background: rgba(148, 163, 184, 0.15);
			color: #e2e8f0;
			border: 1px solid rgba(148, 163, 184, 0.3);
		}
		.qr-actions button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			box-shadow: none;
		}
		.qr-data {
			margin-top: 18px;
		}
		.qr-data p {
			font-size: 0.85rem;
			color: #cbd5f5;
			margin-bottom: 8px;
			font-weight: 600;
		}
		.qr-data-scroll {
			max-height: 140px;
			overflow-y: auto;
			background: rgba(15, 23, 42, 0.6);
			border-radius: 14px;
			padding: 12px;
			border: 1px solid rgba(255, 255, 255, 0.08);
		}
		.qr-data-scroll pre {
			font-size: 0.8rem;
			color: #e2e8f0;
			white-space: pre-wrap;
			word-break: break-word;
		}
		.portal-footer {
			margin-top: 20px;
			font-size: 0.85rem;
			color: #cbd5f5;
			text-align: center;
		}
		.hidden { display: none !important; }
		.header {
			text-align: center;
			margin-bottom: 48px;
		}
		.logo-container {
			margin-bottom: 16px;
		}
		h1 {
			font-size: 4rem;
			font-weight: 800;
			margin-bottom: 0.5rem;
			background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			letter-spacing: -0.03em;
		}
		.tagline {
			color: #71717a;
			font-size: 1.25rem;
			margin-bottom: 1.5rem;
			font-weight: 500;
		}
		.network-badge {
			display: inline-block;
			padding: 8px 16px;
			background: ${network === 'mainnet' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)'};
			color: ${network === 'mainnet' ? '#34d399' : '#fbbf24'};
			border: 1px solid ${network === 'mainnet' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 191, 36, 0.2)'};
			border-radius: 10px;
			font-size: 0.75rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.06em;
		}
		.card {
			background: rgba(22, 22, 30, 0.9);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 16px;
			padding: 28px;
			margin-bottom: 20px;
			transition: all 0.3s ease;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05);
			position: relative;
		}
		.card::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
		}
		.card:hover {
			border-color: rgba(96, 165, 250, 0.3);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05);
			transform: translateY(-2px);
		}
		.card h2 {
			color: #e4e4e7;
			font-size: 1.15rem;
			font-weight: 700;
			margin-bottom: 10px;
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.card h2 svg {
			width: 22px;
			height: 22px;
			color: #60a5fa;
		}
		.card p { color: #71717a; line-height: 1.7; font-size: 0.95rem; }
		code {
			background: rgba(96, 165, 250, 0.12);
			color: #60a5fa;
			padding: 3px 10px;
			border-radius: 8px;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			font-size: 0.85em;
			font-weight: 600;
		}
		.examples { display: grid; gap: 12px; margin-top: 18px; }
		.example {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 14px 18px;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			border: 1px solid rgba(255, 255, 255, 0.06);
			border-radius: 12px;
			transition: all 0.2s;
		}
		.example:hover {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.08));
			border-color: rgba(96, 165, 250, 0.2);
		}
		.example-url {
			color: #60a5fa;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			font-size: 0.85rem;
			font-weight: 600;
			white-space: nowrap;
		}
		.example-desc { color: #71717a; font-size: 0.85rem; }
		.arrow {
			color: #60a5fa;
			font-weight: bold;
			opacity: 0.6;
		}
		a { color: #60a5fa; text-decoration: none; font-weight: 600; }
		a:hover { color: #93c5fd; }
		.player-input {
			display: flex;
			gap: 10px;
			margin-top: 16px;
		}
		.player-input input {
			flex: 1;
			padding: 12px 14px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 10px;
			color: #e4e4e7;
			font-size: 0.9rem;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			outline: none;
			transition: border-color 0.2s;
		}
		.player-input input:focus {
			border-color: #60a5fa;
		}
		.player-input input::placeholder {
			color: #71717a;
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
		}
		.player-input button {
			padding: 12px 20px;
			background: linear-gradient(135deg, #60a5fa, #8b5cf6);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.25);
		}
		.player-input button:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(96, 165, 250, 0.35);
		}
		.format-badges {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-top: 14px;
		}
		.format-badge {
			padding: 4px 10px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.15);
			border-radius: 6px;
			font-size: 0.7rem;
			font-weight: 600;
			color: #60a5fa;
		}
		@media (max-width: 960px) {
			.portal-grid { grid-template-columns: 1fr; }
			.portal-header h2 { font-size: 2rem; }
			.portal-field-grid { grid-template-columns: 1fr; }
		}
		footer {
			margin-top: auto;
			padding-top: 48px;
			text-align: center;
			color: #71717a;
			font-size: 0.875rem;
		}
		footer a { color: #60a5fa; }
		footer a:hover { text-decoration: underline; }
		@media (max-width: 540px) {
			h1 { font-size: 3rem; }
			.example { flex-direction: column; align-items: flex-start; gap: 6px; }
			.arrow { display: none; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<span class="network-badge">${network}</span>
			<h1>sui.ski</h1>
			<p class="tagline">Your gateway to the Sui ecosystem</p>
		</div>

		<div class="portal-section" id="wildcard-portal">
			<div class="portal-content">
				<div class="portal-header">
					<div>
						<p class="portal-badge">wildcard portal • beta</p>
						<h2 data-i18n="appTitle">QR Code Generator</h2>
						<p class="portal-desc" data-i18n="appDescription">Generate QR codes for URLs, text, and contact information</p>
					</div>
					<div class="portal-meta">
						<span class="status-pill">*.sui.ski</span>
						<a class="cta-link" href="https://docs.sui.io" target="_blank" rel="noopener">Sui Docs</a>
					</div>
				</div>

				<div class="portal-tabs" role="tablist">
					<button type="button" class="portal-tab active" data-tab="url">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7 7l3-3a5 5 0 0 0-7-7"></path><path d="M14 11a5 5 0 0 0-7-7L4 7a5 5 0 0 0 7 7"></path></svg>
						<span data-i18n="urlTab">URL</span>
					</button>
					<button type="button" class="portal-tab" data-tab="text">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h16"></path><path d="M9 4h6"></path><path d="M12 4v16"></path></svg>
						<span data-i18n="textTab">Text</span>
					</button>
					<button type="button" class="portal-tab" data-tab="contact">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><path d="M4 21v-2a4 4 0 0 1 3-3.87"></path><circle cx="12" cy="7" r="4"></circle></svg>
						<span data-i18n="contactTab">Contact</span>
					</button>
				</div>

				<div class="portal-grid">
					<div class="portal-panel">
						<h3 id="portal-input-heading">Enter URL</h3>

						<div class="portal-fields" data-tab-section="url">
							<div class="portal-field">
								<label for="qr-url-input" data-i18n="websiteUrl">Website URL</label>
								<input id="qr-url-input" type="url" autocomplete="off" placeholder="example.com or https://example.com" data-i18n-placeholder="urlPlaceholder" />
								<p class="field-hint" data-i18n="urlHelp">Enter a website URL. If you don't include http://, we'll add https:// automatically.</p>
							</div>
						</div>

						<div class="portal-fields hidden" data-tab-section="text">
							<div class="portal-field">
								<label for="qr-text-input" data-i18n="textContent">Text Content</label>
								<textarea id="qr-text-input" rows="4" placeholder="Enter any text to generate QR code..." data-i18n-placeholder="textPlaceholder"></textarea>
							</div>
						</div>

						<div class="portal-fields hidden" data-tab-section="contact">
							<div class="portal-field-grid">
								<div class="portal-field">
									<label for="contact-first-name" data-i18n="firstName">First Name</label>
									<input id="contact-first-name" type="text" data-contact-field="firstName" placeholder="John" data-i18n-placeholder="firstNamePlaceholder" />
								</div>
								<div class="portal-field">
									<label for="contact-last-name" data-i18n="lastName">Last Name</label>
									<input id="contact-last-name" type="text" data-contact-field="lastName" placeholder="Doe" data-i18n-placeholder="lastNamePlaceholder" />
								</div>
							</div>

							<div class="portal-field">
								<label for="contact-phone" data-i18n="phoneNumber">Phone Number</label>
								<input id="contact-phone" type="tel" data-contact-field="phone" placeholder="+1 (555) 123-4567" data-i18n-placeholder="phonePlaceholder" />
							</div>
							<div class="portal-field">
								<label for="contact-email" data-i18n="emailAddress">Email Address</label>
								<input id="contact-email" type="email" data-contact-field="email" placeholder="john.doe@example.com" data-i18n-placeholder="emailPlaceholder" />
							</div>
							<div class="portal-field">
								<label for="contact-org" data-i18n="organization">Organization</label>
								<input id="contact-org" type="text" data-contact-field="organization" placeholder="Company Name" data-i18n-placeholder="organizationPlaceholder" />
							</div>
							<div class="portal-field">
								<label for="contact-url" data-i18n="website">Website</label>
								<input id="contact-url" type="url" data-contact-field="url" placeholder="https://example.com" data-i18n-placeholder="websitePlaceholder" />
							</div>
						</div>

						<div class="portal-actions">
							<button type="button" id="qr-clear-btn" class="ghost-button" data-i18n="clearAllFields">Clear All Fields</button>
						</div>
					</div>

					<div class="portal-panel portal-panel--preview">
						<h3 data-i18n="generatedQrCode">Generated QR Code</h3>
						<div class="qr-preview-box">
							<div id="qr-empty-state" class="qr-placeholder">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
								<p data-i18n="fillFormPrompt">Fill in the form to generate your QR code</p>
							</div>
							<div id="qr-output" class="qr-preview hidden">
								<div id="qr-container" class="qr-container"></div>
								<p data-i18n="scanQrCode">Scan this QR code with your device</p>
							</div>
						</div>

						<div class="qr-actions">
							<button type="button" id="qr-download-btn" class="primary" disabled>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
								<span data-i18n="download">Download</span>
							</button>
							<button type="button" id="qr-copy-btn" class="secondary" disabled>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
								<span id="qr-copy-label" data-default-key="copyData" data-copied-key="copied" data-i18n="copyData">Copy Data</span>
							</button>
						</div>

						<div class="qr-data hidden" id="qr-data-block">
							<p data-i18n="qrCodeData">QR Code Data:</p>
							<div class="qr-data-scroll">
								<pre id="qr-data-text"></pre>
							</div>
						</div>

						<p class="portal-footer" data-i18n="footerText">Generate QR codes instantly • No data stored • Free to use</p>
					</div>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
				SuiNS Name Resolution
			</h2>
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
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
				Move Registry Packages
			</h2>
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
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
				Decentralized Content
			</h2>
			<p>Direct access to IPFS and Walrus content. <a href="/upload">Upload files</a> to Walrus.</p>
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
				<div class="example">
					<span class="example-url"><a href="/upload" style="color: #60a5fa;">sui.ski/upload</a></span>
					<span class="arrow">→</span>
					<span class="example-desc">Upload to Walrus</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
				Media Player
			</h2>
			<p>Play audio and video stored on Walrus. <a href="/play">More options</a></p>
			<form class="player-input" onsubmit="goToPlayer(event)">
				<input type="text" id="blob-input" placeholder="Paste blob ID or URL...">
				<button type="submit">Play</button>
			</form>
			<div class="format-badges">
				<span class="format-badge">MP4</span>
				<span class="format-badge">WebM</span>
				<span class="format-badge">MP3</span>
				<span class="format-badge">OGG</span>
				<span class="format-badge">WAV</span>
				<span class="format-badge">FLAC</span>
			</div>
			<div class="examples">
				<div class="example">
					<span class="example-url">play-{blobId}.sui.ski</span>
					<span class="arrow">→</span>
					<span class="example-desc">Play media file</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
				RPC Proxy
			</h2>
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
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
				Sui Stack Messaging
				<span style="font-size: 0.7rem; padding: 4px 8px; background: rgba(251, 191, 36, 0.15); color: #fbbf24; border-radius: 6px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-left: 8px;">Alpha</span>
			</h2>
			<p>End-to-end encrypted messaging powered by Sui + Walrus + Seal. <a href="/messages">Learn more</a></p>
			<div class="examples">
				<div class="example">
					<span class="example-url">sui.ski/messages</span>
					<span class="arrow">→</span>
					<span class="example-desc">Encrypted Web3 messaging</span>
				</div>
				<div class="example">
					<span class="example-url">sui.ski/api/messaging/status</span>
					<span class="arrow">→</span>
					<span class="example-desc">SDK status & features</span>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
				API
			</h2>
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

	<script>
		;(function () {
			'use strict'
			const TRANSLATIONS = {
				'en-US': {
					appTitle: 'QR Code Generator',
					appDescription: 'Generate QR codes for URLs, text, and contact information',
					urlTab: 'URL',
					textTab: 'Text',
					contactTab: 'Contact',
					enterUrl: 'Enter URL',
					enterText: 'Enter Text',
					contactInformation: 'Contact Information',
					websiteUrl: 'Website URL',
					urlPlaceholder: 'example.com or https://example.com',
					urlHelp: "Enter a website URL. If you don't include http://, we'll add https:// automatically.",
					textContent: 'Text Content',
					textPlaceholder: 'Enter any text to generate QR code...',
					firstName: 'First Name',
					firstNamePlaceholder: 'John',
					lastName: 'Last Name',
					lastNamePlaceholder: 'Doe',
					phoneNumber: 'Phone Number',
					phonePlaceholder: '+1 (555) 123-4567',
					emailAddress: 'Email Address',
					emailPlaceholder: 'john.doe@example.com',
					organization: 'Organization',
					organizationPlaceholder: 'Company Name',
					website: 'Website',
					websitePlaceholder: 'https://example.com',
					clearAllFields: 'Clear All Fields',
					generatedQrCode: 'Generated QR Code',
					scanQrCode: 'Scan this QR code with your device',
					fillFormPrompt: 'Fill in the form to generate your QR code',
					download: 'Download',
					copyData: 'Copy Data',
					copied: 'Copied!',
					qrCodeData: 'QR Code Data:',
					footerText: 'Generate QR codes instantly • No data stored • Free to use',
					qrCodeAlt: 'Generated QR Code',
				},
				'es-ES': {
					appTitle: 'Generador de Códigos QR',
					appDescription: 'Genera códigos QR para URLs, texto e información de contacto',
					urlTab: 'URL',
					textTab: 'Texto',
					contactTab: 'Contacto',
					enterUrl: 'Ingresa URL',
					enterText: 'Ingresa Texto',
					contactInformation: 'Información de Contacto',
					websiteUrl: 'URL del Sitio Web',
					urlPlaceholder: 'ejemplo.com o https://ejemplo.com',
					urlHelp: 'Ingresa una URL de sitio web. Si no incluyes http://, agregaremos https:// automáticamente.',
					textContent: 'Contenido de Texto',
					textPlaceholder: 'Ingresa cualquier texto para generar código QR...',
					firstName: 'Nombre',
					firstNamePlaceholder: 'Juan',
					lastName: 'Apellido',
					lastNamePlaceholder: 'Pérez',
					phoneNumber: 'Número de Teléfono',
					phonePlaceholder: '+1 (555) 123-4567',
					emailAddress: 'Dirección de Correo',
					emailPlaceholder: 'juan.perez@ejemplo.com',
					organization: 'Organización',
					organizationPlaceholder: 'Nombre de la Empresa',
					website: 'Sitio Web',
					websitePlaceholder: 'https://ejemplo.com',
					clearAllFields: 'Limpiar Todos los Campos',
					generatedQrCode: 'Código QR Generado',
					scanQrCode: 'Escanea este código QR con tu dispositivo',
					fillFormPrompt: 'Completa el formulario para generar tu código QR',
					download: 'Descargar',
					copyData: 'Copiar Datos',
					copied: '¡Copiado!',
					qrCodeData: 'Datos del Código QR:',
					footerText: 'Genera códigos QR al instante • No se almacenan datos • Gratis',
					qrCodeAlt: 'Código QR Generado',
				},
			}
			const appLocale = '{{APP_LOCALE}}'
			const browserLocale =
				(navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language) || 'en-US'
			function findMatchingLocale(locale) {
				if (locale && TRANSLATIONS[locale]) {
					return locale
				}
				if (!locale) return 'en-US'
				const lang = locale.split('-')[0]
				const match = Object.keys(TRANSLATIONS).find(function (key) {
					return key.startsWith(lang + '-')
				})
				return match || 'en-US'
			}
			const locale =
				appLocale !== '{{APP_LOCALE}}' ? findMatchingLocale(appLocale) : findMatchingLocale(browserLocale)
			function t(key) {
				if (!key) return ''
				if (TRANSLATIONS[locale] && TRANSLATIONS[locale][key]) {
					return TRANSLATIONS[locale][key]
				}
				return TRANSLATIONS['en-US'][key] || key
			}
			function applyI18n(root) {
				if (!root) return
				root.querySelectorAll('[data-i18n]').forEach(function (node) {
					const key = node.getAttribute('data-i18n')
					if (key) {
						node.textContent = t(key)
					}
				})
				root.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
					const key = node.getAttribute('data-i18n-placeholder')
					if (key) {
						node.setAttribute('placeholder', t(key))
					}
				})
			}
			document.addEventListener('DOMContentLoaded', function () {
				const portal = document.getElementById('wildcard-portal')
				if (!portal) return

				applyI18n(portal)

				const state = {
					activeTab: 'url',
					urlInput: '',
					textInput: '',
					contact: {
						firstName: '',
						lastName: '',
						phone: '',
						email: '',
						organization: '',
						url: '',
					},
					qrData: '',
				}
				let copyTimer = null
				const headingMap = { url: 'enterUrl', text: 'enterText', contact: 'contactInformation' }

				const tabButtons = portal.querySelectorAll('.portal-tab')
				const tabSections = portal.querySelectorAll('[data-tab-section]')
				const headingEl = document.getElementById('portal-input-heading')
				const urlInput = document.getElementById('qr-url-input')
				const textInput = document.getElementById('qr-text-input')
				const contactInputs = portal.querySelectorAll('[data-contact-field]')
				const qrContainer = document.getElementById('qr-container')
				const qrEmptyState = document.getElementById('qr-empty-state')
				const qrOutput = document.getElementById('qr-output')
				const downloadBtn = document.getElementById('qr-download-btn')
				const copyBtn = document.getElementById('qr-copy-btn')
				const copyLabel = document.getElementById('qr-copy-label')
				const qrDataBlock = document.getElementById('qr-data-block')
				const qrDataText = document.getElementById('qr-data-text')
				const clearBtn = document.getElementById('qr-clear-btn')

				tabButtons.forEach(function (button) {
					button.addEventListener('click', function () {
						const targetTab = button.getAttribute('data-tab') || 'url'
						setActiveTab(targetTab)
					})
				})

				if (urlInput) {
					urlInput.addEventListener('input', function (event) {
						state.urlInput = event.target.value
						updateQRData()
					})
				}
				if (textInput) {
					textInput.addEventListener('input', function (event) {
						state.textInput = event.target.value
						updateQRData()
					})
				}
				contactInputs.forEach(function (input) {
					input.addEventListener('input', function (event) {
						const field = event.target.getAttribute('data-contact-field')
						if (field) {
							state.contact[field] = event.target.value
							updateQRData()
						}
					})
				})
				if (clearBtn) {
					clearBtn.addEventListener('click', resetForm)
				}
				if (downloadBtn) {
					downloadBtn.addEventListener('click', downloadQRCode)
				}
				if (copyBtn) {
					copyBtn.addEventListener('click', copyToClipboard)
				}

				function setActiveTab(tab) {
					if (state.activeTab === tab) {
						refreshHeading()
						syncTabSections()
						return
					}
					state.activeTab = tab
					tabButtons.forEach(function (button) {
						const isActive = button.getAttribute('data-tab') === tab
						button.classList.toggle('active', isActive)
					})
					syncTabSections()
					refreshHeading()
					updateQRData()
				}

				function syncTabSections() {
					tabSections.forEach(function (section) {
						const targetTab = section.getAttribute('data-tab-section')
						if (targetTab === state.activeTab) {
							section.classList.remove('hidden')
						} else {
							section.classList.add('hidden')
						}
					})
				}

				function refreshHeading() {
					if (!headingEl) return
					const key = headingMap[state.activeTab] || 'enterUrl'
					headingEl.textContent = t(key)
				}

				function updateQRData() {
					let data = ''
					if (state.activeTab === 'url') {
						data = formatUrl(state.urlInput)
					} else if (state.activeTab === 'text') {
						data = state.textInput.trim()
					} else if (state.activeTab === 'contact') {
						if (hasContactData()) {
							data = generateVCard(state.contact)
						}
					}
					state.qrData = data
					updatePreview()
					generateQRCode(data)
				}

				function hasContactData() {
					return Object.values(state.contact).some(function (value) {
						return value.trim() !== ''
					})
				}

				function updatePreview() {
					const hasData = Boolean(state.qrData)
					if (!qrContainer || !qrEmptyState || !qrOutput || !downloadBtn || !copyBtn || !qrDataBlock || !qrDataText) {
						return
					}
					if (hasData) {
						qrEmptyState.classList.add('hidden')
						qrOutput.classList.remove('hidden')
						downloadBtn.disabled = false
						copyBtn.disabled = false
						qrDataBlock.classList.remove('hidden')
						qrDataText.textContent = state.qrData
					} else {
						qrContainer.innerHTML = ''
						qrEmptyState.classList.remove('hidden')
						qrOutput.classList.add('hidden')
						downloadBtn.disabled = true
						copyBtn.disabled = true
						qrDataBlock.classList.add('hidden')
						qrDataText.textContent = ''
						setCopyState(false)
					}
				}

				function resetForm() {
					state.urlInput = ''
					state.textInput = ''
					Object.keys(state.contact).forEach(function (key) {
						state.contact[key] = ''
					})
					if (urlInput) urlInput.value = ''
					if (textInput) textInput.value = ''
					contactInputs.forEach(function (input) {
						input.value = ''
					})
					state.qrData = ''
					updatePreview()
					generateQRCode('')
				}

				function downloadQRCode() {
					if (!state.qrData || !qrContainer) return
					const canvas = qrContainer.querySelector('canvas')
					const img = qrContainer.querySelector('img')
					const link = document.createElement('a')
					link.download = 'qr-code-' + state.activeTab + '.png'
					if (canvas && typeof canvas.toDataURL === 'function') {
						link.href = canvas.toDataURL('image/png')
					} else if (img && img.src) {
						link.href = img.src
					} else {
						return
					}
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
				}

				async function copyToClipboard() {
					if (!state.qrData) return
					try {
						await navigator.clipboard.writeText(state.qrData)
						setCopyState(true)
						if (copyTimer) {
							clearTimeout(copyTimer)
						}
						copyTimer = window.setTimeout(function () {
							setCopyState(false)
						}, 2000)
					} catch (error) {
						console.error('Failed to copy text:', error)
					}
				}

				function setCopyState(isCopied) {
					if (!copyLabel) return
					const key = isCopied ? copyLabel.getAttribute('data-copied-key') : copyLabel.getAttribute('data-default-key')
					copyLabel.textContent = t(key || (isCopied ? 'copied' : 'copyData'))
				}

				async function generateQRCode(data) {
					if (!qrContainer) return
					if (!data || !data.trim()) {
						qrContainer.innerHTML = ''
						return
					}
					try {
						if (!window.QRious) {
							await ensureQRiousScript()
						}
						if (window.QRious) {
							createCanvasQR(data)
						} else {
							generateFallbackQR(data)
						}
					} catch (error) {
						console.error('Error loading QR library:', error)
						generateFallbackQR(data)
					}
				}

				function ensureQRiousScript() {
					return new Promise(function (resolve, reject) {
						if (window.QRious) {
							resolve()
							return
						}
						const existing = document.getElementById('qrious-script')
						if (existing) {
							existing.addEventListener('load', resolve, { once: true })
							existing.addEventListener('error', reject, { once: true })
							return
						}
						const script = document.createElement('script')
						script.id = 'qrious-script'
						script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
						script.onload = resolve
						script.onerror = reject
						document.head.appendChild(script)
					})
				}

				function createCanvasQR(text) {
					if (!qrContainer) return
					qrContainer.innerHTML = ''
					const canvas = document.createElement('canvas')
					qrContainer.appendChild(canvas)
					new window.QRious({
						element: canvas,
						value: text,
						size: 300,
						background: 'white',
						foreground: 'black',
						level: 'M',
					})
				}

				function generateFallbackQR(text) {
					if (!qrContainer) return
					qrContainer.innerHTML = ''
					const img = document.createElement('img')
					const encoded = encodeURIComponent(text)
					img.src = 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=' + encoded + '&choe=UTF-8'
					img.alt = t('qrCodeAlt')
					img.dataset.fallbackAttempted = 'false'
					img.onerror = function () {
						if (img.dataset.fallbackAttempted === 'true') return
						img.dataset.fallbackAttempted = 'true'
						img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encoded + '&format=png&margin=10'
					}
					qrContainer.appendChild(img)
				}

				function formatUrl(value) {
					if (!value || !value.trim()) return ''
					const trimmed = value.trim()
					if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
						return 'https://' + trimmed
					}
					return trimmed
				}

				function generateVCard(contact) {
					const lines = [
						'BEGIN:VCARD',
						'VERSION:3.0',
						'FN:' + contact.firstName + ' ' + contact.lastName,
						'N:' + (contact.lastName || '') + ';' + (contact.firstName || '') + ';;;',
						'ORG:' + (contact.organization || ''),
						'TEL:' + (contact.phone || ''),
						'EMAIL:' + (contact.email || ''),
						'URL:' + (contact.url || ''),
						'END:VCARD',
					]
					return lines.join('\n')
				}

				refreshHeading()
				syncTabSections()
				updateQRData()
			})
		})()
	</script>

	<script>
		function goToPlayer(e) {
			e.preventDefault();
			const input = document.getElementById('blob-input').value.trim();
			const blobId = extractBlobId(input);
			if (blobId) {
				window.location.href = 'https://play-' + blobId + '.sui.ski';
			}
		}

		function extractBlobId(input) {
			if (!input) return null;
			// Handle full URLs: play-xxx.sui.ski or walrus-xxx.sui.ski
			let match = input.match(/(?:play|walrus)-([a-zA-Z0-9_-]+)(?:\\.sui\\.ski)?/);
			if (match) return match[1];
			// Handle /walrus/xxx paths
			match = input.match(/\\/walrus\\/([a-zA-Z0-9_-]+)/);
			if (match) return match[1];
			// Handle raw blob ID (alphanumeric with - and _)
			if (/^[a-zA-Z0-9_-]+$/.test(input)) return input;
			return null;
		}
	</script>
</body>
</html>`
}
