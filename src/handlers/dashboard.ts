import type { Env } from '../types'
import { generateLogoSvg } from '../utils/og-image'
import { renderSocialMeta } from '../utils/social'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'

export function generateDashboardPage(env: Env): string {
	const network = env.SUI_NETWORK || 'mainnet'
	const apiBase = network === 'mainnet' ? 'https://sui.ski' : `https://t.sui.ski`
	const profileBase = network === 'mainnet' ? 'sui.ski' : 't.sui.ski'

	const socialMeta = renderSocialMeta({
		title: 'My Names — sui.ski',
		description: 'View and manage all your SuiNS names in one place.',
		url: 'https://my.sui.ski',
		image: 'https://sui.ski/og-image.png',
	})

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>My Names — sui.ski</title>
	<link rel="icon" type="image/svg+xml" href="https://sui.ski/favicon.svg">
	${socialMeta}
	<style>
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

		* { margin: 0; padding: 0; box-sizing: border-box; }

		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: #000;
			color: #e4e4e7;
			min-height: 100vh;
			padding: 24px 16px;
			position: relative;
		}
		body::before {
			content: '';
			position: fixed;
			top: -50%;
			left: 50%;
			transform: translateX(-50%);
			width: 120%;
			height: 100%;
			background: radial-gradient(ellipse 50% 40% at 50% 0%, rgba(96, 165, 250, 0.02) 0%, transparent 70%);
			pointer-events: none;
			z-index: 0;
		}
		body::after {
			content: '';
			position: fixed;
			top: 0; left: 0; right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent 0%, rgba(104,137,176,0.15) 30%, rgba(140,160,190,0.25) 50%, rgba(104,137,176,0.15) 70%, transparent 100%);
			pointer-events: none;
			z-index: 1;
		}

		.home-btn {
			position: fixed;
			top: 16px;
			left: 16px;
			z-index: 9999;
			width: 44px;
			height: 44px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #0c0c12;
			border: 1px solid rgba(255,255,255,0.06);
			border-radius: 12px;
			text-decoration: none;
			transition: all 0.3s ease;
			box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4);
		}
		.home-btn:hover {
			border-color: rgba(96,165,250,0.4);
			box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 0 25px rgba(96,165,250,0.15);
		}
		.home-btn svg { width: 28px; height: 28px; }


		.container {
			max-width: 1200px;
			margin: 0 auto;
			padding-top: 80px;
			position: relative;
			z-index: 1;
		}

		.page-header {
			text-align: center;
			margin-bottom: 40px;
		}
		.page-header h1 {
			font-size: 1.8rem;
			font-weight: 700;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			margin-bottom: 8px;
		}
		.page-header p {
			color: #71717a;
			font-size: 0.95rem;
		}
		.page-header .name-count {
			display: inline-block;
			margin-top: 8px;
			padding: 4px 12px;
			background: rgba(96,165,250,0.12);
			border-radius: 20px;
			font-size: 0.82rem;
			font-weight: 600;
			color: #60a5fa;
		}

		.empty-state {
			text-align: center;
			padding: 80px 20px;
		}
		.empty-state svg {
			width: 64px;
			height: 64px;
			color: #52525b;
			margin-bottom: 20px;
		}
		.empty-state h2 {
			font-size: 1.3rem;
			font-weight: 600;
			margin-bottom: 8px;
			color: #e4e4e7;
		}
		.empty-state p {
			color: #71717a;
			font-size: 0.95rem;
			margin-bottom: 24px;
		}
		.empty-state .connect-cta {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 12px 24px;
			background: linear-gradient(135deg, rgba(96,165,250,0.2), rgba(139,92,246,0.2));
			border: 1px solid rgba(96,165,250,0.3);
			border-radius: 12px;
			color: #93c5fd;
			font-weight: 600;
			font-size: 0.95rem;
			cursor: pointer;
			transition: all 0.3s ease;
		}
		.empty-state .connect-cta:hover {
			background: linear-gradient(135deg, rgba(96,165,250,0.3), rgba(139,92,246,0.3));
			border-color: rgba(96,165,250,0.5);
			box-shadow: 0 0 30px rgba(96,165,250,0.15);
		}
		.empty-state .connect-cta svg { width: 18px; height: 18px; }

		.loading-state {
			text-align: center;
			padding: 80px 20px;
		}
		.spinner {
			width: 40px; height: 40px;
			border: 3px solid rgba(96,165,250,0.15);
			border-top-color: #60a5fa;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
			margin: 0 auto 16px;
		}
		@keyframes spin { to { transform: rotate(360deg); } }
		.loading-state p { color: #71717a; font-size: 0.95rem; }

		.names-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
			gap: 16px;
		}

		.name-card {
			background: rgba(12,12,18,0.95);
			border: 1px solid rgba(255,255,255,0.06);
			border-radius: 16px;
			padding: 20px;
			transition: all 0.3s ease;
			position: relative;
			overflow: hidden;
		}
		.name-card:hover {
			border-color: rgba(96,165,250,0.25);
			box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 40px rgba(96,165,250,0.06);
			transform: translateY(-2px);
		}

		.name-card-header {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 14px;
		}
		.status-dot {
			width: 8px; height: 8px;
			border-radius: 50%;
			flex-shrink: 0;
		}
		.status-dot.active { background: #34d399; box-shadow: 0 0 8px rgba(52,211,153,0.4); }
		.status-dot.listed { background: #60a5fa; box-shadow: 0 0 8px rgba(96,165,250,0.4); }
		.status-dot.has-bids { background: #fbbf24; box-shadow: 0 0 8px rgba(251,191,36,0.4); }
		.status-dot.expired { background: #f87171; box-shadow: 0 0 8px rgba(248,113,113,0.4); }

		.name-card-title {
			font-size: 1.15rem;
			font-weight: 700;
			color: #f4f4f5;
			flex: 1;
			min-width: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.primary-badge {
			flex-shrink: 0;
			padding: 2px 8px;
			background: linear-gradient(135deg, rgba(96,165,250,0.2), rgba(139,92,246,0.2));
			border: 1px solid rgba(96,165,250,0.3);
			border-radius: 6px;
			font-size: 0.68rem;
			font-weight: 700;
			color: #93c5fd;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		.name-card-meta {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-bottom: 14px;
			font-size: 0.78rem;
			color: #71717a;
		}
		.meta-tag {
			padding: 3px 8px;
			background: rgba(255,255,255,0.04);
			border-radius: 6px;
		}
		.meta-tag.expiring-soon { color: #fbbf24; background: rgba(251,191,36,0.12); }
		.meta-tag.expired { color: #f87171; background: rgba(248,113,113,0.12); }

		.name-card-market {
			display: flex;
			gap: 12px;
			margin-bottom: 14px;
			font-size: 0.82rem;
		}
		.market-item {
			flex: 1;
			padding: 8px 10px;
			background: rgba(255,255,255,0.03);
			border-radius: 8px;
		}
		.market-label {
			display: block;
			font-size: 0.7rem;
			color: #52525b;
			margin-bottom: 2px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.market-value { color: #e4e4e7; font-weight: 600; }
		.market-usd { color: #71717a; font-size: 0.72rem; margin-left: 4px; }
		.market-none { color: #52525b; font-style: italic; }

		.name-card-actions {
			display: flex;
			gap: 8px;
		}
		.card-action {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			padding: 8px 12px;
			border-radius: 10px;
			font-size: 0.78rem;
			font-weight: 600;
			text-decoration: none;
			transition: all 0.2s ease;
			cursor: pointer;
		}
		.card-action svg { width: 14px; height: 14px; }
		.card-action.profile-link {
			background: rgba(96,165,250,0.12);
			border: 1px solid rgba(96,165,250,0.2);
			color: #93c5fd;
		}
		.card-action.profile-link:hover {
			background: rgba(96,165,250,0.2);
			border-color: rgba(96,165,250,0.4);
		}
		.card-action.tradeport-link {
			background: rgba(167,139,250,0.12);
			border: 1px solid rgba(167,139,250,0.2);
			color: #c4b5fd;
		}
		.card-action.tradeport-link:hover {
			background: rgba(167,139,250,0.2);
			border-color: rgba(167,139,250,0.4);
		}

		.footer-bar {
			margin-top: 48px;
			padding: 20px 0;
			text-align: center;
			font-size: 0.78rem;
			color: #52525b;
			border-top: 1px solid rgba(255,255,255,0.04);
		}
		.footer-bar a { color: #60a5fa; text-decoration: none; }
		.footer-bar a:hover { text-decoration: underline; }
		.footer-bar .sep { margin: 0 8px; opacity: 0.4; }
		.footer-bar .price { color: #71717a; }

		.section-header {
			margin-bottom: 20px;
		}
		.section-header h2 {
			font-size: 1.15rem;
			font-weight: 700;
			color: #e4e4e7;
		}
		.empty-hint {
			text-align: center;
			padding: 32px 20px;
			color: #52525b;
			font-size: 0.88rem;
		}

		@media (max-width: 680px) {
			.names-grid { grid-template-columns: 1fr; }
			.page-header h1 { font-size: 1.4rem; }
			.container { padding-top: 64px; }
			.page-header { margin-bottom: 28px; }
			.empty-state { padding: 48px 16px; }
			.name-card { padding: 16px; }
			.name-card-actions { gap: 6px; }
			.card-action { padding: 10px 10px; font-size: 0.82rem; min-height: 44px; }
			.footer-bar { margin-top: 32px; padding: 16px 0; flex-wrap: wrap; gap: 4px; }
		}
		@media (max-width: 400px) {
			body { padding: 16px 10px; }
			.page-header h1 { font-size: 1.25rem; }
			.page-header p { font-size: 0.88rem; }
			.name-card-title { font-size: 1.05rem; }
			.name-card-market { gap: 8px; }
			.market-item { padding: 6px 8px; }
			.card-action { padding: 10px 8px; font-size: 0.78rem; }
			.footer-bar { font-size: 0.72rem; }
		}

		${generateWalletUiCss()}
		.wallet-widget { position: fixed; top: 16px; right: 16px; z-index: 9999; }
		.wk-widget-btn {
			padding: 10px 16px;
			background: #0c0c12;
			border: 1px solid rgba(255,255,255,0.08);
			border-radius: 14px;
			color: #71717a;
			font-size: 0.82rem;
			font-weight: 500;
			box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 0 40px rgba(96,165,250,0.08);
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
		}
		.wk-widget-btn:hover { border-color: rgba(96,165,250,0.4); color: #e4e4e7; }
		.wk-widget-btn.connected {
			background: linear-gradient(135deg, rgba(96,165,250,0.15), rgba(139,92,246,0.15));
			border-color: rgba(96,165,250,0.3);
			color: #60a5fa;
		}
		.wk-dropdown {
			background: #0c0c12;
			border: 1px solid rgba(255,255,255,0.08);
			border-radius: 14px;
			box-shadow: 0 12px 48px rgba(0,0,0,0.7);
		}
		.wk-modal { background: #0c0c12; border-radius: 20px; }
		.wk-modal-header { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
		.wk-wallet-item { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
	</style>
</head>
<body>
	<a class="home-btn" href="https://sui.ski" title="sui.ski home">
		${generateLogoSvg(28)}
	</a>

	<div class="wallet-widget" id="wk-widget"></div>

	<div class="container">
		<div class="page-header">
			<h1>My SuiNS Names</h1>
			<p id="header-subtitle">Connect your wallet to view your portfolio</p>
		</div>

		<div id="content-area">
			<div class="empty-state" id="empty-state">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
					<line x1="1" y1="10" x2="23" y2="10"></line>
				</svg>
				<h2>Connect Your Wallet</h2>
				<p>View all your SuiNS names, marketplace listings, and manage your portfolio.</p>
				<button class="connect-cta" id="connect-cta">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
						<line x1="1" y1="10" x2="23" y2="10"></line>
					</svg>
					Connect Wallet
				</button>
			</div>

			<div class="loading-state" id="loading-state" style="display:none">
				<div class="spinner"></div>
				<p>Loading your names...</p>
			</div>

			<div id="names-container" style="display:none">
				<div class="names-grid" id="names-grid"></div>
			</div>

			<div id="watching-section" style="display:none;margin-top:40px">
				<div class="section-header">
					<h2>
						<svg viewBox="0 0 24 24" style="width:20px;height:20px;vertical-align:middle;margin-right:8px">
							<path d="M12 2L22 12L12 22L2 12Z" fill="#60a5fa" stroke="#60a5fa" stroke-width="2"/>
						</svg>
						Vault
					</h2>
				</div>
				<div id="watching-grid" class="names-grid"></div>
				<div id="watching-empty" class="empty-hint" style="display:none">
					Click &#9670; on any profile to save it to your vault
				</div>
			</div>

			<div class="empty-state" id="no-names-state" style="display:none">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				<h2>No Names Found</h2>
				<p>This wallet doesn't own any SuiNS names yet.</p>
				<a class="connect-cta" href="https://sui.ski" style="text-decoration:none">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					Register a Name
				</a>
			</div>
		</div>

		<div class="footer-bar">
			<a href="https://sui.ski">sui.ski</a>
			<span class="sep">&middot;</span>
			<a href="https://suins.io" target="_blank">SuiNS</a>
			<span class="sep">&middot;</span>
			<a href="https://tradeport.xyz/sui/collection/suins" target="_blank">Tradeport</a>
			<span class="sep">&middot;</span>
			<span>SUI <span class="price" id="sui-price">$--</span></span>
		</div>
	</div>

	<div id="wk-modal"></div>

	<script type="module">
		let getWallets;
		{
			const SDK_TIMEOUT = 15000;
			const timedImport = (url) => Promise.race([
				import(url),
				new Promise((_, r) => setTimeout(() => r(new Error('Timeout: ' + url)), SDK_TIMEOUT)),
			]);
			const results = await Promise.allSettled([
				timedImport('https://esm.sh/@wallet-standard/app@1.1.0'),
			]);
			if (results[0].status === 'fulfilled') ({ getWallets } = results[0].value);
		}

		${generateWalletSessionJs()}
		${generateWalletKitJs({ network })}
		${generateWalletUiJs({ showPrimaryName: false, onConnect: 'onWalletConnected', onDisconnect: 'onWalletDisconnected' })}

		const API_BASE = ${JSON.stringify(apiBase)};
		const PROFILE_BASE = ${JSON.stringify(profileBase)};
		const TRADEPORT_ITEM_URL = 'https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=TOKEN_ID&modalSlug=suins&nav=1';

		let cachedSuiPriceUsd = null;

		const emptyState = document.getElementById('empty-state');
		const loadingState = document.getElementById('loading-state');
		const namesContainer = document.getElementById('names-container');
		const namesGrid = document.getElementById('names-grid');
		const noNamesState = document.getElementById('no-names-state');
		const headerSubtitle = document.getElementById('header-subtitle');
		const connectCta = document.getElementById('connect-cta');

		connectCta.addEventListener('click', () => SuiWalletKit.openModal());

		function truncAddr(addr) {
			if (!addr || addr.length < 12) return addr || '';
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		function formatSui(mist) {
			const sui = mist / 1e9;
			if (sui >= 1000) return sui.toFixed(0);
			if (sui >= 100) return sui.toFixed(1);
			if (sui >= 1) return sui.toFixed(2);
			return sui.toFixed(3);
		}

		function formatUsd(mist) {
			if (!cachedSuiPriceUsd) return '';
			const usd = (mist / 1e9) * cachedSuiPriceUsd;
			if (usd >= 1000) return '$' + usd.toFixed(0);
			if (usd >= 1) return '$' + usd.toFixed(2);
			return '$' + usd.toFixed(3);
		}

		function getExpirationInfo(expirationMs) {
			if (!expirationMs) return { text: 'No expiry', className: '' };
			const now = Date.now();
			const diff = expirationMs - now;
			if (diff < 0) return { text: 'Expired', className: 'expired' };
			const days = Math.floor(diff / 86400000);
			if (days < 30) return { text: days + 'd left', className: 'expiring-soon' };
			if (days < 365) return { text: Math.floor(days / 30) + 'mo left', className: '' };
			const years = (days / 365).toFixed(1);
			return { text: years + 'y left', className: '' };
		}

		function renderNameCard(nameData) {
			const cleanName = nameData.name.replace(/\\.sui$/, '');
			const displayName = cleanName + '.sui';
			const listings = nameData.listings || [];
			const bids = nameData.bids || [];

			let bestListing = null;
			for (const l of listings) {
				if (l.price && (!bestListing || l.price < bestListing.price)) bestListing = l;
			}
			let bestBid = null;
			for (const b of bids) {
				if (b.price && (!bestBid || b.price > bestBid.price)) bestBid = b;
			}

			let statusClass = 'active';
			if (nameData.expirationMs && nameData.expirationMs < Date.now()) statusClass = 'expired';
			else if (listings.length > 0) statusClass = 'listed';
			else if (bids.length > 0) statusClass = 'has-bids';

			const exp = getExpirationInfo(nameData.expirationMs);
			const tokenId = nameData.nftId || '';
			const tradeportUrl = tokenId ? TRADEPORT_ITEM_URL.replace('TOKEN_ID', encodeURIComponent(tokenId)) : 'https://www.tradeport.xyz/sui/collection/suins';

			const listingHtml = bestListing
				? '<span class="market-value">' + formatSui(bestListing.price) + ' SUI</span>' +
				  (cachedSuiPriceUsd ? '<span class="market-usd">' + formatUsd(bestListing.price) + '</span>' : '')
				: '<span class="market-none">None</span>';

			const bidHtml = bestBid
				? '<span class="market-value">' + formatSui(bestBid.price) + ' SUI</span>' +
				  (cachedSuiPriceUsd ? '<span class="market-usd">' + formatUsd(bestBid.price) + '</span>' : '')
				: '<span class="market-none">None</span>';

			return '<div class="name-card">' +
				'<div class="name-card-header">' +
					'<div class="status-dot ' + statusClass + '"></div>' +
					'<div class="name-card-title">' + displayName + '</div>' +
					(nameData.isPrimary ? '<span class="primary-badge">Primary</span>' : '') +
				'</div>' +
				'<div class="name-card-meta">' +
					(exp.text ? '<span class="meta-tag ' + exp.className + '">' + exp.text + '</span>' : '') +
					(listings.length > 0 ? '<span class="meta-tag">Listed</span>' : '') +
					(bids.length > 0 ? '<span class="meta-tag">' + bids.length + ' bid' + (bids.length > 1 ? 's' : '') + '</span>' : '') +
				'</div>' +
				'<div class="name-card-market">' +
					'<div class="market-item"><span class="market-label">Listing</span>' + listingHtml + '</div>' +
					'<div class="market-item"><span class="market-label">Best Bid</span>' + bidHtml + '</div>' +
				'</div>' +
				'<div class="name-card-actions">' +
					'<a class="card-action profile-link" href="https://' + encodeURIComponent(cleanName) + '.' + PROFILE_BASE + '" target="_blank">' +
						'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
						'Profile</a>' +
					'<a class="card-action tradeport-link" href="' + tradeportUrl + '" target="_blank" rel="noopener">' +
						'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
						'Tradeport</a>' +
				'</div>' +
			'</div>';
		}

		async function loadNames() {
			const address = SuiWalletKit.$connection.value.address;
			if (!address) return;

			emptyState.style.display = 'none';
			noNamesState.style.display = 'none';
			namesContainer.style.display = 'none';
			loadingState.style.display = '';

			try {
				const res = await fetch(API_BASE + '/api/owned-names?address=' + encodeURIComponent(address));
				if (!res.ok) throw new Error('API error: ' + res.status);
				const data = await res.json();

				if (data.error) throw new Error(data.error);

				const names = data.names || [];
				if (names.length === 0) {
					loadingState.style.display = 'none';
					noNamesState.style.display = '';
					headerSubtitle.textContent = 'No names found for ' + truncAddr(address);
					return;
				}

				if (data.primaryName) {
					headerSubtitle.textContent = data.primaryName + '.sui — ' + names.length + ' name' + (names.length !== 1 ? 's' : '');
				} else {
					headerSubtitle.textContent = truncAddr(address) + ' — ' + names.length + ' name' + (names.length !== 1 ? 's' : '');
				}

				names.sort((a, b) => {
					if (a.isPrimary && !b.isPrimary) return -1;
					if (!a.isPrimary && b.isPrimary) return 1;
					return (a.name || '').localeCompare(b.name || '');
				});

				namesGrid.innerHTML = '';
				for (const name of names) {
					namesGrid.innerHTML += renderNameCard(name);
				}

				loadingState.style.display = 'none';
				namesContainer.style.display = '';
			} catch (e) {
				console.error('Failed to load names:', e);
				loadingState.style.display = 'none';
				noNamesState.style.display = '';
				document.querySelector('#no-names-state h2').textContent = 'Failed to Load';
				document.querySelector('#no-names-state p').textContent = e.message || 'Could not fetch your names. Please try again.';
			}
		}

		async function fetchSuiPrice() {
			try {
				const res = await fetch(API_BASE + '/api/sui-price');
				if (!res.ok) return;
				const data = await res.json();
				if (data.price) {
					cachedSuiPriceUsd = data.price;
					document.getElementById('sui-price').textContent = '$' + data.price.toFixed(2);
				}
			} catch {}
		}

		async function loadWatchlist() {
			const address = SuiWalletKit.$connection.value.address;
			if (!address) return;
			const watchingSection = document.getElementById('watching-section');
			const watchingGrid = document.getElementById('watching-grid');
			const watchingEmpty = document.getElementById('watching-empty');

			try {
				const res = await fetch(API_BASE + '/api/vault/meta?address=' + encodeURIComponent(address));
				const data = await res.json();

				if (!data.found || !data.names || data.names.length === 0) {
					watchingSection.style.display = '';
					watchingGrid.style.display = 'none';
					watchingEmpty.style.display = '';
					return;
				}

				watchingSection.style.display = '';
				watchingGrid.style.display = '';
				watchingEmpty.style.display = 'none';

				watchingGrid.innerHTML = data.names.map(function(name) {
					const cleanName = name.replace(/\\.sui$/i, '');
					return '<a href="https://' + encodeURIComponent(cleanName) + '.' + PROFILE_BASE + '" class="name-card" style="text-decoration:none">' +
						'<div class="name-card-header">' +
							'<svg viewBox="0 0 24 24" style="width:16px;height:16px;flex-shrink:0"><path d="M12 2L22 12L12 22L2 12Z" fill="#60a5fa" stroke="#60a5fa" stroke-width="2"/></svg>' +
							'<div class="name-card-title">' + cleanName + '<span style="color:#52525b">.sui</span></div>' +
						'</div>' +
					'</a>';
				}).join('');
			} catch (e) {
				console.error('Failed to load watchlist:', e);
			}
		}

		window.onWalletConnected = function() {
			loadNames();
			loadWatchlist();
			fetchSuiPrice();
		};

		window.onWalletDisconnected = function() {
			emptyState.style.display = '';
			loadingState.style.display = 'none';
			namesContainer.style.display = 'none';
			noNamesState.style.display = 'none';
			document.getElementById('watching-section').style.display = 'none';
			headerSubtitle.textContent = 'Connect your wallet to view your portfolio';
		};

		SuiWalletKit.renderModal('wk-modal');
		SuiWalletKit.renderWidget('wk-widget');
		fetchSuiPrice();
		SuiWalletKit.autoReconnect();
	</script>
</body>
</html>`
}
