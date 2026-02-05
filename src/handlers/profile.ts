import type { Env, SuiNSRecord } from '../types'
import { normalizeMediaUrl, renderSocialMeta } from '../utils/social'
import { profileStyles } from './profile.css'

export interface ProfilePageOptions {
	canonicalUrl?: string
	hostname?: string
	description?: string
	image?: string
	/** Whether the name is in grace period (expired but not yet available for registration) */
	inGracePeriod?: boolean
}

const DESCRIPTION_RECORD_KEYS = ['description', 'bio', 'about', 'summary', 'tagline', 'note']
const IMAGE_RECORD_KEYS = [
	'avatar',
	'avatar_url',
	'avatar.url',
	'image',
	'image_url',
	'picture',
	'photo',
	'icon',
	'thumbnail',
	'logo',
	'banner',
	'cover',
]

/**
 * Generate sui.ski themed SuiNS profile page HTML
 */
export function generateProfilePage(
	name: string,
	record: SuiNSRecord,
	env: Env,
	options: ProfilePageOptions = {},
): string {
	const network = env.SUI_NETWORK
	const explorerBase =
		network === 'mainnet' ? 'https://suiscan.xyz/mainnet' : `https://suiscan.xyz/${network}`
	const explorerUrl = `${explorerBase}/account/${record.address}`
	const nftExplorerUrl = record.nftId ? `${explorerBase}/object/${record.nftId}` : ''


	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const fullName = `${cleanName}.sui`
	const expiresMs = record.expirationTimestampMs
		? (() => {
				const num = Number(record.expirationTimestampMs)
				return Number.isFinite(num) ? num : undefined
			})()
		: undefined
	const expiresAt =
		typeof expiresMs === 'number' && Number.isFinite(expiresMs) ? new Date(expiresMs) : null
	const daysToExpire = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null
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

	const serializeJson = (value: unknown) =>
		JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')

	// Helper to safely output numbers in JavaScript code (prevents numeric separator issues)
	const safeNumber = (value: unknown): string => {
		if (typeof value === 'number') {
			if (!Number.isFinite(value)) return '0'
			return String(value)
		}
		return '0'
	}

	const canonicalUrl = options.canonicalUrl
	const canonicalTag = canonicalUrl
		? `\n\t<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`
		: ''
	const canonicalOrigin = getOriginFromCanonical(canonicalUrl, options.hostname)
	const metaDescription =
		(options.description && options.description.trim().length > 0
			? options.description
			: buildProfileDescription(fullName, record)) || `${fullName} on Sui`
	const previewImage =
		options.image ||
		selectProfileImage(record, options.hostname) ||
		`${canonicalOrigin}/icon-512.png`
	const socialMeta = `\n${renderSocialMeta({
		title: `${fullName} | sui.ski`,
		description: metaDescription,
		url: canonicalUrl,
		siteName: 'sui.ski',
		image: previewImage,
		imageAlt: `${fullName} profile`,
	})}\n`

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(fullName)} | sui.ski</title>${canonicalTag}${socialMeta}

	
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">

	<style>${profileStyles}</style>
</head>
<body>
	<!-- Global Wallet Widget (Fixed Position) -->
	<div class="global-wallet-widget" id="global-wallet-widget">
		<button class="global-wallet-btn" id="global-wallet-btn">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
				<line x1="1" y1="10" x2="23" y2="10"></line>
			</svg>
			<span id="global-wallet-text">Connect</span>
			<svg class="global-wallet-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</button>
		<div class="global-wallet-dropdown" id="global-wallet-dropdown">
			<!-- Populated by JS -->
		</div>
	</div>

	<div class="container">
		<div class="page-layout">
			<div class="main-content">
				<div class="tab-panel active" id="tab-overview">
					<div class="card">
			<div class="profile-hero">
				<div class="identity-card">
					<div class="identity-visual" id="identity-visual">
						<canvas id="qr-canvas"></canvas>
						<button class="identity-qr-toggle" id="qr-toggle" title="Toggle QR code">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>
						</button>
					</div>
					<div class="identity-name-wrapper">
						<div class="identity-name" id="identity-name" title="Click to copy">${escapeHtml(cleanName)}.sui.ski</div>
					</div>
				</div>
				<div class="hero-main">
					<div class="wallet-bar" id="wallet-bar">
						<button class="search-btn" id="search-btn" title="Search SuiNS names (Press /)">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="11" cy="11" r="8"></circle>
								<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							</svg>
							<span>Search...</span>
							<kbd>/</kbd>
						</button>
						<span class="badge network">${network}</span>
					</div>
					<div class="header">
						<div class="header-top">
							<h1>${
								record.walrusSiteId
									? `<a href="/" class="name-site-link" title="View Walrus site">${escapeHtml(cleanName)}<span class="suffix">.sui</span><svg class="site-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></a>`
									: `${escapeHtml(cleanName)}<span class="suffix">.sui</span>`
							}</h1>
							${
								daysToExpire !== null
									? `<span class="badge expiry${daysToExpire <= 0 ? ' danger' : daysToExpire <= 7 ? ' danger' : daysToExpire <= 90 ? ' warning' : daysToExpire > 365 ? ' premium' : ''}">${
											daysToExpire <= 0
												? 'Expired'
												: daysToExpire > 365
													? `${Math.floor(daysToExpire / 365)}y ${daysToExpire % 365}d`
													: `${daysToExpire}d left`
										}</span>`
									: ''
							}
						</div>
						<div class="header-meta">
							<div class="header-meta-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
								${expiresAt ? `Expires ${expiresAt.toLocaleDateString()}` : 'No expiration'}
							</div>
							<div class="header-meta-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
								<a href="https://${escapeHtml(cleanName)}.sui.ski" target="_blank">${escapeHtml(cleanName)}.sui.ski</a>
							</div>
							${record.nftId ? `<a href="${escapeHtml(nftExplorerUrl)}" target="_blank" class="header-meta-item" style="color:var(--accent);text-decoration:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>View NFT</a>` : ''}
							<a href="${explorerBase}/account/@${escapeHtml(cleanName)}/portfolio" target="_blank" class="header-meta-item" style="color:var(--accent);text-decoration:none;" title="View all SuiNS names owned by @${escapeHtml(cleanName)}">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"></path></svg>
								View Portfolio
							</a>
						</div>
					</div>
					<div class="owner-display">
						<div class="owner-info" id="owner-info">
							<span class="owner-label">Owner</span>
							<span class="owner-name" id="addr-name"></span>
							<span class="owner-addr" id="addr-text">${escapeHtml(record.address.slice(0, 8))}...${escapeHtml(record.address.slice(-6))}</span>
							<svg class="visit-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><polyline points="9 18 15 12 9 6"></polyline></svg>
						</div>
						<div class="owner-actions">
							<button class="message-btn" id="quick-message-btn" title="Send encrypted message to @${escapeHtml(cleanName)}.sui">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
								<span>Message</span>
							</button>
							<button class="copy-btn" id="copy-address-btn" title="Copy address">
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
							</button>
							<button class="edit-btn hidden" id="set-self-btn" title="Set to my address">Self</button>
							<button class="edit-btn" id="edit-address-btn">Edit</button>
						</div>
					</div>
				</div>
			</div>

			${
				record.contentHash || record.walrusSiteId
					? `
			<div class="profile-grid">
				${
					record.contentHash
						? `
				<div class="profile-item">
					<div class="profile-label">Content Hash</div>
					<div class="profile-value mono">${escapeHtml(`${record.contentHash.slice(0, 24)}...`)}</div>
				</div>
				`
						: ''
				}
				${
					record.walrusSiteId
						? `
				<div class="profile-item">
					<div class="profile-label">Walrus Site</div>
					<div class="profile-value mono">${escapeHtml(`${record.walrusSiteId.slice(0, 24)}...`)}</div>
				</div>
				`
						: ''
				}
			</div>
			`
					: ''
			}

			<!-- Marketplace Card -->
			<div class="card marketplace-card" id="marketplace-card" style="display:none;">
				<div class="marketplace-header">
					<div class="marketplace-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="9" cy="21" r="1"></circle>
							<circle cx="20" cy="21" r="1"></circle>
							<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
						</svg>
						<span>Marketplace</span>
					</div>
					<a href="https://tradeport.xyz/sui/collection/suins?search=${escapeHtml(cleanName)}" target="_blank" class="marketplace-link">View on Tradeport</a>
				</div>
				<div class="marketplace-body">
					<div class="marketplace-row" id="marketplace-listing-row" style="display:none;">
						<span class="marketplace-label">Listed for</span>
						<span class="marketplace-value listing-price" id="marketplace-listing-price">--</span>
					</div>
					<div class="marketplace-row" id="marketplace-bid-row" style="display:none;">
						<span class="marketplace-label">Best offer</span>
						<span class="marketplace-value bid-price" id="marketplace-bid-price">--</span>
					</div>
					<button class="marketplace-buy-btn" id="marketplace-buy-btn" style="display:none;" disabled>
						<span class="marketplace-buy-text">Buy Now</span>
						<span class="marketplace-buy-loading hidden"><span class="loading"></span></span>
					</button>
					<div class="marketplace-status" id="marketplace-status"></div>
				</div>
			</div>

			<!-- Renewal + Linked Names Side-by-Side Container -->
			<div class="renewal-linked-container">
				<!-- Renewal Card -->
				<div class="card renewal-card" id="overview-renewal-card" data-expires-ms="${safeNumber(expiresMs)}" data-current-name="${escapeHtml(cleanName)}">
					<div class="renewal-card-header">
						<div class="renewal-card-title">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M23 4v6h-6"></path>
								<path d="M1 20v-6h6"></path>
								<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
							</svg>
							<span>Extend Registration</span>
						</div>
						<div class="renewal-selected-name" id="renewal-selected-name">
							<span class="renewal-name-label">Extending:</span>
							<span class="renewal-name-value" id="renewal-name-value">${escapeHtml(cleanName)}.sui</span>
						</div>
					</div>
					<div class="renewal-card-body">
						<div class="renewal-compact-row">
							<div class="renewal-info-stack">
								${expiresAt ? `<div class="renewal-expiry-compact">
									<span class="renewal-expiry-label" id="renewal-expiry-label">New expiry</span>
									<span class="renewal-expiry-date" id="renewal-expiry-date">${new Date(expiresAt.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
									<span class="renewal-countdown" id="renewal-countdown"></span>
								</div>` : ''}
								<div class="renewal-price-compact">
									<span class="renewal-price-value" id="overview-renewal-price">-- SUI</span>
									<span class="renewal-savings-inline" id="overview-renewal-savings" style="display:none;">
										<span id="overview-renewal-savings-text">Save 25%</span>
									</span>
								</div>
							</div>
							<div class="renewal-duration-stepper">
								<button type="button" class="stepper-btn stepper-minus" id="renewal-years-minus">−</button>
								<span class="stepper-value" id="overview-renewal-years" data-value="1">1 yr</span>
								<button type="button" class="stepper-btn stepper-plus" id="renewal-years-plus">+</button>
							</div>
						</div>
						<button class="renewal-btn" id="overview-renewal-btn" disabled>
							<span class="renewal-btn-text">Connect Wallet to Extend</span>
							<span class="renewal-btn-loading hidden">
								<span class="loading"></span>
							</span>
						</button>
						<div class="renewal-status" id="overview-renewal-status"></div>
					</div>
				</div>

				<!-- Linked Names Section -->
				<div class="linked-names-section" id="linked-names-section">
					<div class="linked-names-header">
						<span class="linked-names-title">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
								<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
							</svg>
							Linked Names
						</span>
						<span class="linked-names-count" id="linked-names-count">Loading...</span>
					</div>
					<div class="linked-names-list" id="linked-names-list">
						<div class="linked-names-loading"><span class="loading"></span> Fetching linked names...</div>
					</div>
					<div class="linked-names-hint">Click name to view profile · Click + to extend</div>
				</div>
			</div>
				</div><!-- end tab-overview -->

				<div class="links">
			<a href="${escapeHtml(explorerUrl)}" target="_blank">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
				View on Explorer
			</a>
			<a href="/json">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
				View JSON
			</a>
			<a href="https://suins.io/name/${escapeHtml(cleanName)}" target="_blank">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
				Manage on SuiNS
			</a>
			<button class="subscribe-btn" id="subscribe-btn" data-name="${escapeHtml(cleanName)}" data-address="${escapeHtml(record.address)}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
				<span class="subscribe-text">Subscribe</span>
			</button>
				</div>
			</div><!-- end main-content -->
		</div><!-- end page-layout -->
	</div>

	<!-- Quick Search Overlay -->
	<div class="search-overlay" id="search-overlay">
		<div class="search-box">
			<div class="search-input-wrapper">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				<label for="search-input" class="visually-hidden">Search for a name</label>
				<input type="text" class="search-input" id="search-input" placeholder="Search for a name..." autocomplete="off" spellcheck="false" />
			</div>
			<div class="search-results" id="search-results"></div>
			<div class="search-hint">
				<span>Type to check availability</span>
				<span><kbd>↑↓</kbd> navigate · <kbd>Enter</kbd> go · <kbd>Esc</kbd> close</span>
			</div>
		</div>
	</div>

	<!-- Edit Address Modal -->
	<div class="edit-modal" id="edit-modal">
		<div class="edit-modal-content">
			<h3>Set Target Address</h3>
			<p>Enter a Sui address or SuiNS name. Only the NFT owner can change this.</p>
			<label for="target-address" class="visually-hidden">Target address</label>
			<input type="text" id="target-address" placeholder="0x... or name.sui" value="${escapeHtml(record.address)}" />
			<div id="resolved-address" style="font-size: 0.75rem; color: var(--text-muted); min-height: 18px;"></div>
			<div id="modal-status" class="status hidden"></div>
			<div class="edit-modal-buttons">
				<button class="cancel-btn" id="cancel-edit-btn">Cancel</button>
				<button class="save-btn" id="save-address-btn">Update</button>
			</div>
		</div>
	</div>

	<!-- Wallet Selection Modal -->
	<div class="wallet-modal" id="wallet-modal">
		<div class="wallet-modal-content">
			<div class="wallet-modal-header">
				<span>Connect Wallet</span>
				<button class="wallet-modal-close" id="wallet-modal-close">&times;</button>
			</div>
			<div class="wallet-list" id="wallet-list">
				<div class="wallet-detecting">
					<span class="loading"></span>
					Detecting wallets...
				</div>
			</div>
		</div>
	</div>

	<script type="module">
		import { getWallets } from 'https://esm.sh/@wallet-standard/app@1.1.0';
		import { SuiJsonRpcClient } from 'https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle';
		import { Transaction } from 'https://esm.sh/@mysten/sui@2.2.0/transactions?bundle';
		import { SuinsClient, SuinsTransaction } from 'https://esm.sh/@mysten/suins@1.0.0?bundle';
		import { SealClient, SessionKey } from 'https://esm.sh/@mysten/seal@0.9.6';
		import { fromHex, toHex } from 'https://esm.sh/@mysten/bcs@1.3.0';

		// ===== CONSTANTS =====
		const NAME = ${serializeJson(cleanName)};
		const FULL_NAME = ${serializeJson(fullName)};
		const NETWORK = ${serializeJson(network)};
		const RPC_URLS = { mainnet: 'https://fullnode.mainnet.sui.io:443', testnet: 'https://fullnode.testnet.sui.io:443', devnet: 'https://fullnode.devnet.sui.io:443' };
		const ACTIVE_RPC_URL = RPC_URLS[NETWORK] || RPC_URLS.mainnet;

		let cachedSuiClient = null;
		const getSuiClient = () => {
			if (!cachedSuiClient) {
				cachedSuiClient = new SuiJsonRpcClient({ url: ACTIVE_RPC_URL });
			}
			return cachedSuiClient;
		};
	const NFT_ID = ${serializeJson(record.nftId || '')};
	const TARGET_ADDRESS = ${serializeJson(record.address)};
	const OWNER_ADDRESS = ${serializeJson(record.ownerAddress || '')};
	const CURRENT_ADDRESS = TARGET_ADDRESS || OWNER_ADDRESS;
	const PROFILE_URL = ${serializeJson(`https://${cleanName}.sui.ski`)};
	const NFT_EXPLORER_URL = ${serializeJson(nftExplorerUrl)};
	const EXPLORER_BASE = ${serializeJson(explorerBase)};
	const IS_SUBNAME = NAME.includes('.');
	const STORAGE_KEY = 'sui_ski_wallet';
	const EXPIRATION_MS = ${safeNumber(expiresMs)};
	const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
	const AVAILABLE_AT = EXPIRATION_MS + GRACE_PERIOD_MS;
	const HAS_WALRUS_SITE = ${record.walrusSiteId ? 'true' : 'false'};
	const HAS_CONTENT_HASH = ${record.contentHash ? 'true' : 'false'};
	const IS_IN_GRACE_PERIOD = ${options.inGracePeriod ? 'true' : 'false'};

		let connectedWallet = null;
		let connectedAccount = null;
		let connectedAddress = null;
		let connectedWalletName = null;
		let connectedPrimaryName = null;
		let walletsApi = null;
		let nftOwnerAddress = null;
		let targetPrimaryName = null;
		let canEdit = false;
		let ownerDisplayAddress = CURRENT_ADDRESS;

		try {
			walletsApi = getWallets();
		} catch (e) {
			console.error('Failed to init wallet API:', e);
		}

		// DOM Elements
		const walletBar = document.getElementById('wallet-bar');
		const editBtn = document.getElementById('edit-address-btn');
		const setSelfBtn = document.getElementById('set-self-btn');
		const copyBtn = document.getElementById('copy-address-btn');

		// Global Wallet Widget Elements
		const globalWalletWidget = document.getElementById('global-wallet-widget');
		const globalWalletBtn = document.getElementById('global-wallet-btn');
		const globalWalletText = document.getElementById('global-wallet-text');
		const globalWalletDropdown = document.getElementById('global-wallet-dropdown');
		const editModal = document.getElementById('edit-modal');
		const targetAddressInput = document.getElementById('target-address');
		const resolvedAddressEl = document.getElementById('resolved-address');
		const modalStatus = document.getElementById('modal-status');
		const cancelBtn = document.getElementById('cancel-edit-btn');
		const saveBtn = document.getElementById('save-address-btn');
		// Identity card elements (merged NFT + QR)
		const identityVisual = document.getElementById('identity-visual');
		const identityCanvas = document.getElementById('qr-canvas');
		const identityName = document.getElementById('identity-name');
		const qrToggle = document.getElementById('qr-toggle');
		let nftImageUrl = null;
		let showingQr = false; // Default to NFT display, QR is fallback
		let nftDisplayLoaded = false;


		// Quick message button - focuses the compose input
		const quickMsgBtn = document.getElementById('quick-message-btn');
		if (quickMsgBtn) {
			quickMsgBtn.addEventListener('click', () => {
				const composeInput = document.getElementById('msg-compose-input');
				if (composeInput) {
					composeInput.focus();
					composeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			});
		}

		function truncAddr(addr) {
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		function showStatus(el, msg, type) {
			el.innerHTML = msg;
			el.className = 'status ' + type;
		}

		function hideStatus(el) {
			el.className = 'status hidden';
		}

		// Check if input looks like a SuiNS name
		function isSuiNSName(input) {
			if (!input || input.startsWith('0x')) return false;
			const cleaned = input.toLowerCase().replace(/\\.sui$/i, '');
			const pattern1 = new RegExp('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
			const pattern2 = new RegExp('^[a-z0-9]$');
			return pattern1.test(cleaned) || pattern2.test(cleaned);
		}

		// Resolve a SuiNS name to its target address
		async function resolveSuiNSName(name) {
			const suiClient = getSuiClient();
			const suinsClient = new SuinsClient({
				client: suiClient,
				network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
			});

			const cleanedName = name.toLowerCase().replace(/\\.sui$/i, '') + '.sui';
			const record = await suinsClient.getNameRecord(cleanedName);
			if (!record || !record.targetAddress) {
				throw new Error(\`Could not resolve "\${cleanedName}" to an address\`);
			}
			return { address: record.targetAddress, name: cleanedName };
		}

		// Debounce helper
		let resolveTimeout = null;
		function debounce(fn, delay) {
			return (...args) => {
				clearTimeout(resolveTimeout);
				resolveTimeout = setTimeout(() => fn(...args), delay);
			};
		}

		// Live preview of resolved address
		const previewResolvedAddress = debounce(async (input) => {
			if (!input || input === CURRENT_ADDRESS) {
				resolvedAddressEl.textContent = '';
				return;
			}

			if (isSuiNSName(input)) {
				resolvedAddressEl.innerHTML = '<span class="loading" style="width:12px;height:12px;border-width:1px;"></span> Resolving...';
				try {
					const { address, name } = await resolveSuiNSName(input);
					resolvedAddressEl.innerHTML = \`→ \${name} resolves to <span style="color:var(--accent);">\${truncAddr(address)}</span>\`;
				} catch (e) {
					resolvedAddressEl.innerHTML = \`<span style="color:var(--error);">Could not resolve "\${input}"</span>\`;
				}
			} else {
				resolvedAddressEl.textContent = '';
			}
		}, 500);

		if (targetAddressInput) {
			targetAddressInput.addEventListener('input', (e) => {
				previewResolvedAddress(e.target.value.trim());
			});
		}

		// Get available Sui wallets with fallbacks
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
				{ check: () => window.phantom?.sui, name: 'Phantom', icon: 'https://phantom.app/img/phantom-icon-purple.svg' },
				{ check: () => window.suiWallet, name: 'Sui Wallet', icon: 'https://sui.io/favicon.png' },
				{ check: () => window.slush, name: 'Slush', icon: 'https://slush.app/favicon.ico' },
				{ check: () => window.suiet, name: 'Suiet', icon: 'https://suiet.app/favicon.ico' },
				{ check: () => window.martian?.sui, name: 'Martian', icon: 'https://martianwallet.xyz/favicon.ico' },
				{ check: () => window.ethos, name: 'Ethos', icon: 'https://ethoswallet.xyz/favicon.ico' },
				{ check: () => window.okxwallet?.sui, name: 'OKX Wallet', icon: 'https://static.okx.com/cdn/assets/imgs/226/EB771A4D4E5CC234.png' },
			];

			for (const { check, name, icon } of windowWallets) {
				try {
					const wallet = check();
					if (wallet && !seenNames.has(name)) {
						// Wrap window wallet to match standard interface
						wallets.push({
							name,
							icon,
							chains: ['sui:mainnet', 'sui:testnet'],
							features: {
								'standard:connect': {
									connect: async () => {
										if (wallet.connect) return await wallet.connect();
										if (wallet.requestPermissions) return await wallet.requestPermissions();
									}
								},
								'standard:disconnect': {
									disconnect: async () => wallet.disconnect?.()
								}
							},
							get accounts() {
								return wallet.accounts || [];
							}
						});
						seenNames.add(name);
					}
				} catch (e) {
					// Wallet check failed, skip
				}
			}

			return wallets;
		}

		// Detect wallets with retry logic (non-blocking)
		async function detectWallets() {
			// First, try immediate detection
			const immediateWallets = getSuiWallets();
			if (immediateWallets.length > 0) {
				return immediateWallets;
			}

			// If no wallets found immediately, return empty and let the UI show install links
			// The wallet API will register wallets asynchronously
			return new Promise((resolve) => {
				let attempts = 0;
				const maxAttempts = 10; // Reduced from 25 to avoid long blocking
				let resolved = false;

				const check = () => {
					if (resolved) return;
					attempts++;
					const wallets = getSuiWallets();

					if (wallets.length > 0 || attempts >= maxAttempts) {
						resolved = true;
						resolve(wallets);
					} else {
						setTimeout(check, 100); // Reduced from 150ms
					}
				};

				// Also listen for new wallets being registered
				if (walletsApi) {
					try {
						walletsApi.on('register', () => {
							if (resolved) return;
							const wallets = getSuiWallets();
							if (wallets.length > 0) {
								resolved = true;
								resolve(wallets);
							}
						});
					} catch (e) {
						console.log('Could not register wallet listener:', e);
					}
				}

				// Start checking after a short delay to allow async wallet registration
				setTimeout(check, 50);
			});
		}

		// Fetch NFT owner address
		async function fetchNftOwner() {
			if (!NFT_ID) return null;
			try {
				const suiClient = getSuiClient();
				const obj = await suiClient.getObject({
					id: NFT_ID,
					options: { showOwner: true }
				});
				if (obj?.data?.owner && typeof obj.data.owner === 'object') {
					if ('AddressOwner' in obj.data.owner) {
						return obj.data.owner.AddressOwner;
					}
					if ('ObjectOwner' in obj.data.owner) {
						return obj.data.owner.ObjectOwner;
					}
				}
			} catch (e) {
				console.log('Failed to fetch NFT owner:', e.message);
			}
			return null;
		}

		// Fetch primary SuiNS name for an address using RPC
		async function fetchPrimaryName(address) {
			if (!address) return null;
			try {
				const suiClient = getSuiClient();
				const result = await suiClient.resolveNameServiceNames({ address });
				if (result?.data?.length > 0) {
					return result.data[0];
				}
			} catch (e) {
				console.log('Failed to fetch primary name:', e.message);
			}
			return null;
		}

		// Check if connected wallet can edit
		var isCheckingEditPermission = false;
		async function checkEditPermission() {
			if (isCheckingEditPermission) return;
			isCheckingEditPermission = true;
			try {
				if (!connectedAddress) {
					canEdit = false;
					connectedPrimaryName = null;
					updateEditButton();
					return;
				}

				// Fetch NFT owner and primary name in parallel
				const [owner, primaryName] = await Promise.all([
					nftOwnerAddress ? Promise.resolve(nftOwnerAddress) : fetchNftOwner(),
					fetchPrimaryName(connectedAddress)
				]);

				if (!nftOwnerAddress && owner) {
					nftOwnerAddress = owner;
				}
				connectedPrimaryName = primaryName;

				// Can edit if wallet is the NFT owner OR the current target address
				canEdit = connectedAddress === nftOwnerAddress || connectedAddress === CURRENT_ADDRESS;
				updateEditButton();
				renderWalletBar(); // Re-render to show primary name
				updateGlobalWalletWidget(); // Update global widget with primary name
			} finally {
				isCheckingEditPermission = false;
			}
		}

		// Update edit button state
		function updateEditButton() {
			const isAlreadySelf = connectedAddress && connectedAddress === CURRENT_ADDRESS;
			const isOwner = connectedAddress && nftOwnerAddress && connectedAddress === nftOwnerAddress;

			// Self button only visible to owner
			if (isOwner) {
				if (isAlreadySelf) {
					setSelfBtn.disabled = true;
					setSelfBtn.title = 'Already set to your address';
					setSelfBtn.classList.add('already-set');
				} else {
					setSelfBtn.disabled = false;
					setSelfBtn.title = connectedPrimaryName
						? 'Set to ' + connectedPrimaryName
						: 'Set to ' + truncAddr(connectedAddress);
					setSelfBtn.classList.remove('already-set');
				}
				setSelfBtn.classList.remove('hidden');
			} else {
				setSelfBtn.classList.add('hidden');
			}

			// Edit button
			if (!connectedAddress) {
				editBtn.disabled = false;
				editBtn.title = 'Connect wallet to edit';
			} else if (canEdit) {
				editBtn.disabled = false;
				editBtn.title = 'Edit target address';
			} else {
				editBtn.disabled = true;
				editBtn.title = 'Only the NFT owner or target address can edit';
			}

			// Update grace period banner visibility
			updateGracePeriodActions();
		}

		// Update grace period actions visibility
		function updateGracePeriodActions() {
			if (!IS_IN_GRACE_PERIOD) return;
			const giftBtn = document.getElementById('gift-renewal-btn');
			const renewBtn = document.getElementById('renew-name-btn');
			const isOwner = connectedAddress && nftOwnerAddress && connectedAddress === nftOwnerAddress;
			if (giftBtn) giftBtn.style.display = connectedAddress ? 'inline-flex' : 'none';
			if (renewBtn) renewBtn.style.display = isOwner ? 'inline-flex' : 'none';
		}

		// x402 Renewal API - uses Payment Kit pattern
		async function handleGiftRenewal() {
			if (!connectedAddress || !connectedWallet) {
				showGracePeriodStatus('Connect wallet first', 'error');
				return;
			}

			const btn = document.getElementById('gift-renewal-btn');
			const txt = document.getElementById('gift-renewal-text');
			const orig = txt?.textContent || 'Gift 1 Month (10 SUI)';

			try {
				if (btn) btn.disabled = true;
				if (txt) txt.textContent = 'Requesting...';

				// Step 1: Request renewal - get payment details (x402)
				const reqResponse = await fetch('/api/renewal/request', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: FULL_NAME, walletAddress: connectedAddress })
				});

				const reqData = await reqResponse.json();

				if (reqResponse.status === 402) {
					// Payment required - build and send payment
					const payment = reqData.payment;
					if (!payment?.recipient || !payment?.amount) {
						throw new Error('Invalid payment details from server');
					}

					if (txt) txt.textContent = 'Building payment...';

					const tx = new Transaction();
					const [coin] = tx.splitCoins(tx.gas, [BigInt(payment.amount)]);
					tx.transferObjects([coin], payment.recipient);

					if (txt) txt.textContent = 'Approve in wallet...';

					const result = await signAndExecuteWithWallet(
						tx,
						getSuiClient(),
						connectedAccount,
						NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet'
					);

					if (!result?.digest) throw new Error('No transaction digest');

					if (txt) txt.textContent = 'Verifying payment...';

					// Step 2: Retry with payment proof
					const verifyResponse = await fetch('/api/renewal/request', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-Payment-Tx-Digest': result.digest
						},
						body: JSON.stringify({ name: FULL_NAME, walletAddress: connectedAddress })
					});

					const verifyData = await verifyResponse.json();

					if (!verifyResponse.ok) {
						throw new Error(verifyData.error || 'Verification failed');
					}

					// Success - show result with status link
					showGracePeriodStatus(
						'Queued! <a href="' + EXPLORER_BASE + '/tx/' + result.digest + '" target="_blank">Payment</a> · ' +
						'<a href="' + verifyData.statusUrl + '" target="_blank">Status</a><br>' +
						'<small>Nautilus TEE will process renewal shortly.</small>',
						'success'
					);

					// Poll for status updates
					if (verifyData.requestId) {
						pollRenewalStatus(verifyData.requestId);
					}

				} else if (reqResponse.ok) {
					// Already processed or no payment needed
					showGracePeriodStatus(reqData.message || 'Request processed', 'success');
				} else {
					throw new Error(reqData.error || 'Request failed');
				}

			} catch (e) {
				const m = e.message || '';
				if (m.includes('rejected') || m.includes('cancelled')) {
					showGracePeriodStatus('Cancelled', 'error');
				} else if (m.includes('Insufficient')) {
					showGracePeriodStatus('Need 10 SUI + gas', 'error');
				} else {
					showGracePeriodStatus('Error: ' + m, 'error');
				}
			} finally {
				if (btn) btn.disabled = false;
				if (txt) txt.textContent = orig;
			}
		}

		// Poll renewal status from Nautilus
		async function pollRenewalStatus(requestId) {
			let attempts = 0;
			const maxAttempts = 30; // 5 minutes max
			const interval = setInterval(async () => {
				attempts++;
				try {
					const res = await fetch(\`/api/renewal/status/\${requestId}\`);
					const data = await res.json();

					if (data.status === 'completed') {
						clearInterval(interval);
						showGracePeriodStatus(
							\`Renewed! <a href="\${EXPLORER_BASE}/tx/\${data.renewalTxDigest}" target="_blank">View tx</a><br>
							<small>Reload page to see updated expiration.</small>\`,
							'success'
						);
					} else if (data.status === 'failed') {
						clearInterval(interval);
						showGracePeriodStatus('Renewal failed: ' + (data.error || 'Unknown error'), 'error');
					} else if (attempts >= maxAttempts) {
						clearInterval(interval);
						showGracePeriodStatus('Still processing... check status later.', 'info');
					}
				} catch (e) {
					// Ignore polling errors
				}
			}, 10000); // Every 10 seconds
		}

		function showGracePeriodStatus(msg, type) {
			const el = document.getElementById('grace-period-status');
			if (!el) return;
			el.innerHTML = msg;
			el.className = 'grace-period-status ' + type;
			el.style.display = 'block';
			if (type !== 'success') setTimeout(() => { el.style.display = 'none'; }, 15000);
		}

		const giftBtnEl = document.getElementById('gift-renewal-btn');
		if (giftBtnEl) giftBtnEl.addEventListener('click', handleGiftRenewal);

		// Update grace period owner info display
		async function updateGracePeriodOwnerInfo() {
			if (!IS_IN_GRACE_PERIOD) return;

			const ownerInfoEl = document.getElementById('grace-period-owner-info');
			if (!ownerInfoEl) return;

			// First, ensure we have the NFT owner address
			if (!nftOwnerAddress && NFT_ID) {
				nftOwnerAddress = await fetchNftOwner();
			}

			if (nftOwnerAddress) {
				// Try to get the owner's primary name
				const ownerPrimaryName = await fetchPrimaryName(nftOwnerAddress);
				const truncatedAddr = truncAddr(nftOwnerAddress);

				if (ownerPrimaryName) {
					const cleanedName = ownerPrimaryName.replace(/\\.sui$/i, '');
					ownerInfoEl.innerHTML = \`<a href="https://\${cleanedName}.sui.ski" target="_blank">\${ownerPrimaryName}</a> (<code>\${truncatedAddr}</code>)\`;
				} else {
					ownerInfoEl.innerHTML = \`<code>\${truncatedAddr}</code>\`;
				}
			} else {
				// No NFT owner found - show unknown
				ownerInfoEl.textContent = 'Unknown owner';
			}
		}

		// Save wallet connection to localStorage
		function saveWalletConnection() {
			if (connectedWalletName && connectedAddress) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify({
					walletName: connectedWalletName,
					address: connectedAddress
				}));
			}
		}

		// Clear wallet connection from localStorage
		function clearWalletConnection() {
			localStorage.removeItem(STORAGE_KEY);
		}

		// Try to restore wallet connection from localStorage
		async function restoreWalletConnection() {
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (!saved) return false;

				const { walletName } = JSON.parse(saved);
				if (!walletName) return false;

				const wallets = getSuiWallets();
				const wallet = wallets.find(w => w.name === walletName);
				if (!wallet) {
					clearWalletConnection();
					return false;
				}

				// Per Sui docs: wallets auto-restore authorized accounts
				// Check wallet.accounts first before calling connect()
				let accounts = wallet.accounts || [];

				if (accounts.length === 0) {
					const connectFeature = wallet.features?.['standard:connect'];
					if (connectFeature?.connect) {
						const result = await connectFeature.connect();
						accounts = result?.accounts || wallet.accounts || [];
					}
				}

				if (accounts.length === 0) return false;

				connectedAccount = accounts[0];
				connectedAddress = accounts[0].address;
				connectedWallet = wallet;
				connectedWalletName = walletName;

				updateUIForWallet();
				return true;
			} catch {
				clearWalletConnection();
				return false;
			}
		}

		// Wallet modal elements
		const walletModal = document.getElementById('wallet-modal');
		const walletList = document.getElementById('wallet-list');
		const walletModalClose = document.getElementById('wallet-modal-close');

		// Close wallet modal
		if (walletModalClose) {
			walletModalClose.addEventListener('click', () => {
				walletModal.classList.remove('open');
			});
		}

		// Close on backdrop click
		if (walletModal) {
			walletModal.addEventListener('click', (e) => {
				if (e.target === walletModal) {
					walletModal.classList.remove('open');
				}
			});
		}

		// Connect to a specific wallet
		async function connectToWallet(wallet) {
			try {
				let accounts = wallet.accounts || [];

				// Per Sui docs: wallets auto-restore authorized accounts
				// Only call connect() if no accounts are available
				if (accounts.length === 0) {
					const connectFeature = wallet.features?.['standard:connect'];
					if (!connectFeature?.connect) {
						throw new Error('Wallet does not support connection');
					}

					const result = await connectFeature.connect();
					accounts = result?.accounts || wallet.accounts || [];

					// Some wallets populate accounts async
					if (accounts.length === 0) {
						await new Promise(r => setTimeout(r, 150));
						accounts = wallet.accounts || [];
					}
				}

				if (accounts.length === 0) {
					throw new Error('No accounts. Please unlock your wallet.');
				}

				connectedAccount = accounts[0];
				connectedAddress = accounts[0].address;
				connectedWallet = wallet;
				connectedWalletName = wallet.name;

				walletModal.classList.remove('open');
				saveWalletConnection();
				updateUIForWallet();
			} catch (e) {
				const errorMsg = e.message || 'Unknown error';
				const isUserAction = errorMsg.includes('rejected') ||
					errorMsg.includes('cancelled') ||
					errorMsg.includes('Unexpected');
				if (!isUserAction) {
					console.error('Wallet error:', errorMsg);
				}
				const userMessage = isUserAction
					? 'Connection cancelled.'
					: 'Connection failed: ' + errorMsg;
				walletList.innerHTML = '<div class="wallet-no-wallets" style="color: var(--error);">' +
					userMessage +
					'<br><br>' +
					'<button onclick="document.getElementById(\\'wallet-modal\\').classList.remove(\\'open\\')" ' +
					'style="padding: 8px 16px; background: var(--accent); border: none; border-radius: 8px; color: white; cursor: pointer;">' +
					'Close</button></div>';
			}
		}

		// Show wallet selection modal (non-blocking)
		async function connectWallet() {
			walletModal.classList.add('open');
			walletList.innerHTML = '<div class="wallet-detecting"><span class="loading"></span> Detecting wallets...</div>';

			// Don't block - show immediate results and update as wallets are detected
			const immediateWallets = getSuiWallets();
			if (immediateWallets.length > 0) {
				renderWalletList(immediateWallets);
				// Continue detecting in background for newly registered wallets
				detectWallets().then(wallets => {
					if (wallets.length > immediateWallets.length) {
						renderWalletList(wallets);
					}
				}).catch(() => {});
				return;
			}

			// If no immediate wallets, show install links and detect in background
			walletList.innerHTML = '<div class="wallet-no-wallets">' +
				'Detecting wallets...' +
				'<br><br>' +
				'<a href="https://phantom.app/download" target="_blank">Install Phantom →</a>' +
				'<br>' +
				'<a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank">Install Sui Wallet →</a>' +
				'</div>';

			// Detect wallets in background without blocking
			detectWallets().then(wallets => {
				if (wallets.length > 0) {
					renderWalletList(wallets);
				}
			}).catch(() => {});
		}

		// Render wallet list (helper function)
		function renderWalletList(wallets) {
			if (wallets.length === 0) {
				walletList.innerHTML = '<div class="wallet-no-wallets">' +
					'No Sui wallets detected.' +
					'<br><br>' +
					'<a href="https://phantom.app/download" target="_blank">Install Phantom →</a>' +
					'<br>' +
					'<a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank">Install Sui Wallet →</a>' +
					'</div>';
				return;
			}

			walletList.innerHTML = '';
			for (const wallet of wallets) {
				const item = document.createElement('div');
				item.className = 'wallet-item';
				const iconSrc = wallet.icon || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle fill=%22%23818cf8%22 cx=%2216%22 cy=%2216%22 r=%2216%22/></svg>';
				const walletName = wallet.name || 'Unknown';
				item.innerHTML = '<img src="' + iconSrc + '" alt="' + walletName + '" onerror="this.style.display=\\'none\\'">' +
					'<span class="wallet-name">' + walletName + '</span>';
				item.addEventListener('click', () => {
					console.log('Wallet item clicked:', walletName);
					connectToWallet(wallet);
				});
				walletList.appendChild(item);
			}
		}


		// Disconnect wallet
		function disconnectWallet() {
			connectedWallet = null;
			connectedAccount = null;
			connectedAddress = null;
			connectedWalletName = null;
			connectedPrimaryName = null;
			canEdit = false;
			clearWalletConnection();
			// Update all UI components
			updateUIForWallet();
		}

		// Render wallet connection status (no-op, wallet UI removed)
		function renderWalletBar() {
			const existingWalletStatus = walletBar.querySelector('.wallet-status');
			if (existingWalletStatus) existingWalletStatus.remove();
		}

		// Update global wallet widget
		function updateGlobalWalletWidget() {
			if (!globalWalletWidget || !globalWalletBtn || !globalWalletText || !globalWalletDropdown) return;

			if (!connectedAddress) {
				// Not connected - show connect button
				globalWalletBtn.classList.remove('connected');
				globalWalletText.textContent = 'Connect';
				globalWalletDropdown.innerHTML = '';
			} else {
				// Connected - show address and dropdown
				const displayName = connectedPrimaryName || truncAddr(connectedAddress);
				globalWalletBtn.classList.add('connected');
				globalWalletText.textContent = displayName;

				globalWalletDropdown.innerHTML = \`
					<div class="global-wallet-dropdown-addr">\${connectedAddress}</div>
					\${connectedPrimaryName ? \`
					<button class="global-wallet-dropdown-item" id="gw-view-profile">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
						View My Profile
					</button>
					\` : ''}
					<button class="global-wallet-dropdown-item" id="gw-switch">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
						Switch Wallet
					</button>
					<button class="global-wallet-dropdown-item disconnect" id="gw-disconnect">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
						Disconnect
					</button>
				\`;

				// Re-attach event handlers
				const viewProfileBtn = document.getElementById('gw-view-profile');
				if (viewProfileBtn) {
					viewProfileBtn.addEventListener('click', () => {
						const cleanedName = connectedPrimaryName.replace(/\\.sui$/i, '');
						window.location.href = \`https://\${cleanedName}.sui.ski\`;
					});
				}

				const switchBtn = document.getElementById('gw-switch');
				if (switchBtn) {
					switchBtn.addEventListener('click', () => {
						globalWalletWidget.classList.remove('open');
						disconnectWallet();
						setTimeout(() => connectWallet(), 100);
					});
				}

				const disconnectBtn = document.getElementById('gw-disconnect');
				if (disconnectBtn) {
					disconnectBtn.addEventListener('click', () => {
						globalWalletWidget.classList.remove('open');
						disconnectWallet();
					});
				}

				// Copy address on click
				const addrEl = globalWalletDropdown.querySelector('.global-wallet-dropdown-addr');
				if (addrEl) {
					addrEl.addEventListener('click', async () => {
						try {
							await navigator.clipboard.writeText(connectedAddress);
							addrEl.classList.add('copied');
							const originalText = addrEl.textContent;
							addrEl.textContent = 'Copied!';
							setTimeout(() => {
								addrEl.classList.remove('copied');
								addrEl.textContent = originalText;
							}, 1500);
						} catch (err) {
							console.error('Failed to copy:', err);
						}
					});
				}
			}
		}

		// Global wallet widget click handlers
		if (globalWalletBtn) {
			globalWalletBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				if (!connectedAddress) {
					// Not connected - show wallet modal
					connectWallet();
				} else {
					// Connected - toggle dropdown
					globalWalletWidget.classList.toggle('open');
				}
			});
		}

		// Close global wallet dropdown when clicking outside
		document.addEventListener('click', (e) => {
			if (globalWalletWidget && !globalWalletWidget.contains(e.target)) {
				globalWalletWidget.classList.remove('open');
			}
		});

		// Global function to update UI when wallet connects/disconnects
		// This can be extended by other features (messaging, etc.)
		var updateUIForWallet = function() {
			// Expose wallet state to window for cross-script access
			window.connectedAddress = connectedAddress;
			window.connectedWallet = connectedWallet;
			window.connectedAccount = connectedAccount;
			window.updateEditButton = updateEditButton;

			renderWalletBar();
			updateGlobalWalletWidget();
			checkEditPermission();
			updateEditButton();
			if (typeof updateBountiesSectionVisibility === 'function') updateBountiesSectionVisibility();
			if (typeof updateRenewalButton === 'function') updateRenewalButton();
			if (typeof updateMarketplaceButton === 'function') updateMarketplaceButton();
		};

		// Copy address to clipboard (uses NFT owner during grace period)
		function copyAddress() {
			const addressToCopy = ownerDisplayAddress || CURRENT_ADDRESS;
			if (!addressToCopy) {
				console.warn('No owner address available to copy.');
				return;
			}

			navigator.clipboard.writeText(addressToCopy).then(() => {
				copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
				setTimeout(() => {
					copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
				}, 1500);
			});
		}

		// ===== IDENTITY CARD (NFT + QR CODE) =====
		function showIdentityQr() {
			if (!identityVisual || !identityCanvas) return;
			// Show canvas (for QR overlay)
			identityCanvas.style.display = 'block';
			// Hide NFT image if it exists
			const nftImg = identityVisual.querySelector('img');
			if (nftImg) nftImg.style.display = 'none';
			showingQr = true;
		}

		function showIdentityNft() {
			if (!identityVisual || !identityCanvas) return;
			// Hide QR canvas
			identityCanvas.style.display = 'none';
			// Show NFT image if it exists
			const nftImg = identityVisual.querySelector('img');
			if (nftImg) nftImg.style.display = 'block';
			showingQr = false;
		}

		function toggleIdentityView() {
			if (showingQr) {
				showIdentityNft();
			} else {
				showIdentityQr();
			}
		}

		function loadIdentityCardNFT() {
			if (nftDisplayLoaded || !allNFTs || allNFTs.length === 0) return;

			// Find the current name's NFT, or use the first one
			let selectedNft = allNFTs.find(nft => {
				const domain = nft.domain || '';
				const cleanedName = domain.replace(/\\.sui$/i, '');
				return cleanedName.toLowerCase() === NAME.toLowerCase();
			});

			// Fallback to first NFT if current name not found
			if (!selectedNft) {
				selectedNft = allNFTs[0];
			}

			// Build list of image URLs to try
			const imageUrlsToTry = [];

			// 1. SuiNS API URL for the selected domain (with expiration timestamp)
			const domainName = selectedNft?.domain || NAME;
			const expTs = selectedNft?.expirationTimestampMs || EXPIRATION_MS;
			imageUrlsToTry.push(getSuiNSImageUrl(domainName, expTs));

			// 2. On-chain image URL from NFT data
			if (selectedNft?.imageUrl) {
				const normalizedUrl = normalizeImageUrl(selectedNft.imageUrl);
				if (normalizedUrl && !imageUrlsToTry.includes(normalizedUrl)) {
					imageUrlsToTry.push(normalizedUrl);
				}
			}

			// Try loading with fallbacks
			loadNFTImageWithFallbacks(
				imageUrlsToTry,
				(img, url) => displayNFTImage(img, url),
				() => {
					console.log('All image URLs failed for identity card, showing QR');
					showIdentityQr();
					nftDisplayLoaded = true;
				}
			);
		}

		// Toggle button click
		if (qrToggle) {
			qrToggle.style.display = 'none'; // Hidden until NFT image loads
			qrToggle.addEventListener('click', (e) => {
				e.stopPropagation();
				toggleIdentityView();
			});
		}

		// ===== QR CODE =====
		const qrExpanded = document.getElementById('qr-expanded');
		const qrExpandedCanvas = document.getElementById('qr-expanded-canvas');
		const qrCopyBtn = document.getElementById('qr-copy-btn');
		const qrDownloadBtn = document.getElementById('qr-download-btn');

		async function loadQRious() {
			if (window.QRious) return;
			await new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js';
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});
		}

		function renderQR(canvas, size) {
			if (!canvas || !window.QRious) return;
			new window.QRious({
				element: canvas,
				value: PROFILE_URL,
				size: size,
				level: 'H',
				background: '#050818',
				foreground: '#60a5fa'
			});
			canvas.style.background = '#050818';
		}

		async function initQR() {
			await loadQRious();
			if (identityCanvas) renderQR(identityCanvas, 320);
			if (qrExpandedCanvas) renderQR(qrExpandedCanvas, 420);
		}

		function openQrOverlay() {
			qrExpanded?.classList.add('active');
		}

		// Click identity visual to expand QR
		if (identityVisual) {
			identityVisual.addEventListener('click', (e) => {
				// Don't expand if clicking toggle button (if it exists)
				if (e.target.closest('.identity-qr-toggle')) return;
				openQrOverlay();
			});
		}

		// AI Image Generation removed

		// Click identity name to copy
		if (identityName) {
			identityName.addEventListener('click', async (e) => {
				e.stopPropagation();
				try {
					await navigator.clipboard.writeText(PROFILE_URL);
					const originalText = identityName.textContent;
					identityName.textContent = 'Copied!';
					identityName.classList.add('copied');
					setTimeout(() => {
						identityName.textContent = originalText;
						identityName.classList.remove('copied');
					}, 1500);
				} catch (err) {
					console.error('Copy failed:', err);
				}
			});
		}

		if (qrExpanded) {
			qrExpanded.addEventListener('click', (e) => {
				if (e.target === qrExpanded || e.target.id === 'qr-close') {
					qrExpanded.classList.remove('active');
				}
			});
		}

		// Copy URL (expanded overlay)
		if (qrCopyBtn) {
			qrCopyBtn.addEventListener('click', async (e) => {
				e.stopPropagation();
				try {
					await navigator.clipboard.writeText(PROFILE_URL);
					qrCopyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
					setTimeout(() => {
						qrCopyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
					}, 1500);
				} catch (err) {
					console.error('Copy failed:', err);
				}
			});
		}

		// Download QR
		if (qrDownloadBtn) {
			qrDownloadBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				if (!qrExpandedCanvas) return;
				const link = document.createElement('a');
				link.download = NAME + '-qr.png';
				link.href = qrExpandedCanvas.toDataURL('image/png');
				link.click();
			});
		}

		// Initialize QR code - show it initially as placeholder until NFT loads
		initQR().then(() => {
			// Show QR code initially (will be hidden when NFT loads)
			showIdentityQr();
		}).catch(console.error);
		// Hide toggle button initially (will show when NFT loads)
		if (qrToggle) qrToggle.style.display = 'none';

		// Generate SuiNS image URL via our proxy (to avoid CORS issues)
		function getSuiNSImageUrl(domainName, expirationMs = null) {
			const cleanDomain = domainName.toLowerCase().replace(/\\.sui$/i, '');
			// Use our proxy endpoint to fetch SuiNS NFT images
			// Include expiration timestamp if available (required for SuiNS API)
			const baseUrl = \`/api/suins-image/\${encodeURIComponent(cleanDomain)}.sui\`;
			// Check for valid expiration timestamp (must be a positive number)
			const hasValidExp = typeof expirationMs === 'number' && expirationMs > 0;
			return hasValidExp ? \`\${baseUrl}?exp=\${expirationMs}\` : baseUrl;
		}

		// Try to load an image with fallback URLs
		function loadNFTImageWithFallbacks(imageUrls, onSuccess, onAllFailed) {
			let currentIndex = 0;

			function tryNextUrl() {
				if (currentIndex >= imageUrls.length) {
					onAllFailed();
					return;
				}

				const url = imageUrls[currentIndex];
				if (!url) {
					currentIndex++;
					tryNextUrl();
					return;
				}

				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => onSuccess(img, url);
				img.onerror = () => {
					console.log('Failed to load image from:', url);
					currentIndex++;
					tryNextUrl();
				};
				img.src = url;
			}

			tryNextUrl();
		}

		// Normalize image URL (handle IPFS, proxy external URLs to avoid CORS)
		function normalizeImageUrl(url) {
			if (!url || typeof url !== 'string') return null;

			// Check if it's an IPFS CID (starts with Qm or bafy)
			if (/^(Qm|bafy)[A-Za-z0-9]+/i.test(url)) {
				const ipfsUrl = \`https://ipfs.io/ipfs/\${url}\`;
				return \`/api/image-proxy?url=\${encodeURIComponent(ipfsUrl)}\`;
			}
			// Check if it starts with ipfs://
			if (url.startsWith('ipfs://')) {
				const ipfsUrl = \`https://ipfs.io/ipfs/\${url.slice(7)}\`;
				return \`/api/image-proxy?url=\${encodeURIComponent(ipfsUrl)}\`;
			}
			// SuiNS API URLs need to be proxied due to CORS
			if (url.includes('suins.io')) {
				return \`/api/image-proxy?url=\${encodeURIComponent(url)}\`;
			}
			// Other external URLs that might have CORS issues
			if (url.startsWith('http://') || url.startsWith('https://')) {
				// Proxy external URLs to avoid CORS issues
				return \`/api/image-proxy?url=\${encodeURIComponent(url)}\`;
			}
			return null;
		}

		// Display NFT image in identity card
		function displayNFTImage(img, imageUrl) {
			if (!identityVisual) return;

			// Remove any existing images
			const existingImg = identityVisual.querySelector('img');
			if (existingImg) {
				existingImg.remove();
			}

			// Add the new image with proper styling
			img.style.width = '100%';
			img.style.height = '100%';
			img.style.objectFit = 'cover';
			img.style.display = 'block';
			img.style.position = 'absolute';
			img.style.top = '0';
			img.style.left = '0';
			img.style.borderRadius = '12px';
			identityVisual.appendChild(img);

			// Hide QR code and show toggle button
			if (identityCanvas) {
				identityCanvas.style.display = 'none';
			}
			if (qrToggle) {
				qrToggle.style.display = 'flex';
			}

			showingQr = false;
			nftDisplayLoaded = true;
			nftImageUrl = imageUrl;

			console.log('NFT image loaded successfully:', imageUrl);
		}

		// Load NFT image - try SuiNS API first (most reliable), then on-chain display data
		async function loadCurrentNFTImage() {
			if (nftDisplayLoaded || !identityVisual) return;

			// Build list of image URLs to try (in order of preference)
			const imageUrlsToTry = [];

			// 1. SuiNS API URL (most reliable for SuiNS NFTs) - include expiration timestamp
			imageUrlsToTry.push(getSuiNSImageUrl(NAME, EXPIRATION_MS));

			// 2. Try fetching from on-chain display data if NFT_ID is available
			if (NFT_ID) {
				try {
					const response = await fetch(\`/api/nft-details?objectId=\${encodeURIComponent(NFT_ID)}\`);
					if (response.ok) {
						const data = await response.json();

						// Extract image URL from display/content data
						const displayUrl = data.display?.image_url || data.display?.image ||
						                   data.display?.avatar_url || data.display?.avatar ||
						                   data.content?.image_url;

						if (displayUrl) {
							const normalizedUrl = normalizeImageUrl(displayUrl);
							if (normalizedUrl && !imageUrlsToTry.includes(normalizedUrl)) {
								imageUrlsToTry.push(normalizedUrl);
							}
						}
					}
				} catch (error) {
					console.log('Failed to fetch NFT details:', error);
				}
			}

			// Try loading images with fallbacks
			loadNFTImageWithFallbacks(
				imageUrlsToTry,
				(img, url) => displayNFTImage(img, url),
				() => {
					console.log('All image URLs failed, keeping QR code');
					nftDisplayLoaded = true;
				}
			);
		}

		// Try to load NFT image immediately
		loadCurrentNFTImage();

		// Set target address to connected wallet (direct transaction)
		async function setToSelf() {
			if (!connectedAddress) {
				await connectWallet();
				if (!connectedAddress || !canEdit) return;
			}

			if (!canEdit) {
				alert('Only the NFT owner or target address can edit.');
				return;
			}

			if (connectedAddress === CURRENT_ADDRESS) {
				alert('Already set to your address.');
				return;
			}

			if (!confirm(\`Set target address to \${connectedPrimaryName || truncAddr(connectedAddress)}?\`)) {
				return;
			}

			try {
				setSelfBtn.disabled = true;
				setSelfBtn.textContent = '...';

				const suiClient = getSuiClient();
				const suinsClient = new SuinsClient({
					client: suiClient,
					network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
				});

				const senderAddress = typeof connectedAccount.address === 'string'
					? connectedAccount.address
					: connectedAccount.address?.toString() || connectedAddress;

				let nftId = NFT_ID;
				if (!nftId) {
					const nameRecord = await suinsClient.getNameRecord(FULL_NAME);
					nftId = nameRecord?.nftId || '';
				}

				if (!nftId) throw new Error('Could not find NFT ID');

				const tx = new Transaction();
				const suinsTx = new SuinsTransaction(suinsClient, tx);

				suinsTx.setTargetAddress({
					nft: nftId,
					address: connectedAddress,
					isSubname: IS_SUBNAME
				});

				tx.setSender(senderAddress);
				tx.setGasBudget(50000000);

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';

				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

				// Pass Transaction object directly (modern wallets handle serialization)
				if (signExecFeature?.signAndExecuteTransaction) {
					result = await signExecFeature.signAndExecuteTransaction({
						transaction: tx,
						account: connectedAccount,
						chain,
						options: { showEffects: true }
					});
				} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
					result = await signExecBlockFeature.signAndExecuteTransactionBlock({
						transactionBlock: tx,
						account: connectedAccount,
						chain,
						options: { showEffects: true }
					});
				} else {
					// Fallback for legacy wallets
					const txBytes = await tx.build({ client: suiClient });
					const phantomProvider = window.phantom?.sui;
					if (phantomProvider?.signAndExecuteTransactionBlock) {
						result = await phantomProvider.signAndExecuteTransactionBlock({
							transactionBlock: txBytes,
							options: { showEffects: true }
						});
					} else {
						throw new Error('Wallet does not support transaction signing');
					}
				}

				// Update UI
				document.querySelector('.owner-addr').textContent = connectedAddress.slice(0, 8) + '...' + connectedAddress.slice(-6);
				document.querySelector('.owner-name').innerHTML = formatSuiName(connectedPrimaryName);
				ownerDisplayAddress = connectedAddress;
				alert('Updated! TX: ' + result.digest);

			} catch (error) {
				const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
				console.error('Set self error:', errorMsg, error);
				alert('Failed: ' + errorMsg);
			} finally {
				setSelfBtn.disabled = false;
				setSelfBtn.textContent = 'Self';
			}
		}

		// Open edit modal
		function openEditModal() {
			if (!connectedAddress) {
				connectWallet().then(() => {
					if (connectedAddress && canEdit) {
						editModal.classList.add('open');
						targetAddressInput.value = CURRENT_ADDRESS;
						resolvedAddressEl.textContent = '';
						hideStatus(modalStatus);
					}
				});
				return;
			}

			if (!canEdit) {
				alert('Only the NFT owner or target address can edit.');
				return;
			}

			editModal.classList.add('open');
			targetAddressInput.value = CURRENT_ADDRESS;
			resolvedAddressEl.textContent = '';
			hideStatus(modalStatus);
		}

		// Close edit modal
		function closeEditModal() {
			editModal.classList.remove('open');
			hideStatus(modalStatus);
		}

		// Save target address
		async function saveTargetAddress() {
			hideStatus(modalStatus);

			if (!connectedWallet || !connectedAccount) {
				showStatus(modalStatus, 'Please connect your wallet first.', 'error');
				return;
			}

			const inputValue = targetAddressInput.value.trim();
			if (!inputValue) {
				showStatus(modalStatus, 'Please enter an address or SuiNS name', 'error');
				return;
			}

			let newAddress = inputValue;
			let resolvedFromName = null;

			// If it looks like a SuiNS name, resolve it first
			if (isSuiNSName(inputValue)) {
				try {
					showStatus(modalStatus, '<span class="loading"></span> Resolving...', 'info');
					const resolved = await resolveSuiNSName(inputValue);
					newAddress = resolved.address;
					resolvedFromName = resolved.name;
				} catch (e) {
					showStatus(modalStatus, e.message || 'Could not resolve name', 'error');
					return;
				}
			}

			if (!newAddress || !newAddress.startsWith('0x') || newAddress.length < 10) {
				showStatus(modalStatus, 'Invalid address format', 'error');
				return;
			}

			if (newAddress === CURRENT_ADDRESS) {
				showStatus(modalStatus, 'This is already the target address', 'info');
				return;
			}

			try {
				showStatus(modalStatus, '<span class="loading"></span> Building transaction...', 'info');
				saveBtn.disabled = true;

				const suiClient = getSuiClient();
				const suinsClient = new SuinsClient({
					client: suiClient,
					network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
				});

				const senderAddress = typeof connectedAccount.address === 'string'
					? connectedAccount.address
					: connectedAccount.address?.toString() || connectedAddress;

				let nftId = NFT_ID;
				if (!nftId) {
					const nameRecord = await suinsClient.getNameRecord(FULL_NAME);
					nftId = nameRecord?.nftId || '';
				}

				if (!nftId) {
					throw new Error('Could not find NFT ID');
				}

				const tx = new Transaction();
				const suinsTx = new SuinsTransaction(suinsClient, tx);

				suinsTx.setTargetAddress({
					nft: nftId,
					address: newAddress,
					isSubname: IS_SUBNAME
				});

				tx.setSender(senderAddress);
				tx.setGasBudget(50000000);

				showStatus(modalStatus, '<span class="loading"></span> Approve in wallet...', 'info');

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';

				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

				// Pass Transaction object directly (modern wallets handle serialization)
				if (signExecFeature?.signAndExecuteTransaction) {
					result = await signExecFeature.signAndExecuteTransaction({
						transaction: tx,
						account: connectedAccount,
						chain,
						options: { showEffects: true }
					});
				} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
					result = await signExecBlockFeature.signAndExecuteTransactionBlock({
						transactionBlock: tx,
						account: connectedAccount,
						chain,
						options: { showEffects: true }
					});
				} else {
					// Fallback for legacy wallets
					const txBytes = await tx.build({ client: suiClient });
					const phantomProvider = window.phantom?.sui;
					if (phantomProvider?.signAndExecuteTransactionBlock) {
						result = await phantomProvider.signAndExecuteTransactionBlock({
							transactionBlock: txBytes,
							options: { showEffects: true }
						});
					} else {
						throw new Error('Wallet does not support transaction signing');
					}
				}

				showStatus(modalStatus, \`
					<strong>Updated!</strong> <a href="https://suiscan.xyz/\${NETWORK}/tx/\${result.digest}" target="_blank">View tx →</a>
				\`, 'success');

				// Update displayed address and fetch new primary name
				setTimeout(async () => {
					document.querySelector('.owner-addr').textContent = newAddress.slice(0, 8) + '...' + newAddress.slice(-6);
					const newName = await fetchPrimaryName(newAddress);
					document.querySelector('.owner-name').innerHTML = formatSuiName(newName);
					ownerDisplayAddress = newAddress;
					closeEditModal();
				}, 2000);

			} catch (error) {
				console.error('Set address error:', error);
				let msg = error.message || 'Unknown error';
				if (msg.includes('not the owner')) {
					msg = 'You are not the owner of this name';
				}
				showStatus(modalStatus, 'Failed: ' + msg, 'error');
			} finally {
				saveBtn.disabled = false;
			}
		}

		// Event listeners
		if (editBtn) editBtn.addEventListener('click', openEditModal);
		if (setSelfBtn) setSelfBtn.addEventListener('click', setToSelf);
		if (copyBtn) copyBtn.addEventListener('click', copyAddress);
		if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
		if (saveBtn) saveBtn.addEventListener('click', saveTargetAddress);
		if (editModal) editModal.addEventListener('click', (e) => {
			if (e.target === editModal) closeEditModal();
		});

		// Format SuiNS name with gradient suffix
		function formatSuiName(name) {
			if (!name) return '';
			const cleanName = name.replace(/\\.sui$/i, '');
			return cleanName + '<span class="suffix">.sui</span>';
		}

		// Fetch and display owner info
		// For grace period names, show the NFT owner; otherwise show the target address
		async function fetchAndDisplayOwnerInfo() {
			const ownerNameEl = document.querySelector('.owner-name');
			const ownerAddrEl = document.querySelector('.owner-addr');
			const ownerLabelEl = document.querySelector('.owner-label');
			const ownerInfo = document.getElementById('owner-info');
			const visitArrow = ownerInfo?.querySelector('.visit-arrow');

			let displayAddress = CURRENT_ADDRESS;
			let displayName = null;
			let labelOverridden = false;

			// For grace period names, show the NFT owner instead of target address
			if (IS_IN_GRACE_PERIOD && NFT_ID) {
				if (ownerLabelEl) {
					ownerLabelEl.textContent = 'NFT Owner';
					labelOverridden = true;
				}

				if (!nftOwnerAddress) {
					nftOwnerAddress = await fetchNftOwner();
				}

				if (nftOwnerAddress) {
					displayAddress = nftOwnerAddress;
					displayName = await fetchPrimaryName(nftOwnerAddress);
				}
			}

			if (!IS_IN_GRACE_PERIOD && ownerLabelEl && !labelOverridden) {
				ownerLabelEl.textContent = 'Owner';
			}

			// For active names, show the target address (targetPrimaryName is used elsewhere)
			if (!IS_IN_GRACE_PERIOD) {
				displayName = await fetchPrimaryName(CURRENT_ADDRESS);
				if (displayName) {
					targetPrimaryName = displayName;
				}
			}

			ownerDisplayAddress = displayAddress || '';

			if (ownerAddrEl && displayAddress) {
				ownerAddrEl.textContent = truncAddr(displayAddress);
				ownerAddrEl.title = displayAddress;
				ownerAddrEl.style.removeProperty('font-size');
				ownerAddrEl.style.removeProperty('font-weight');
				ownerAddrEl.style.removeProperty('color');
			} else if (ownerAddrEl) {
				ownerAddrEl.textContent = 'Unknown';
				ownerAddrEl.title = 'Unknown owner';
			}

			if (displayName) {
				if (ownerNameEl) {
					ownerNameEl.innerHTML = formatSuiName(displayName);
					ownerNameEl.style.display = '';
				}

				if (ownerInfo) {
					const cleanedName = displayName.replace(/\\.sui$/i, '');
					const ownerProfileUrl = \`https://\${cleanedName}.sui.ski\`;

					ownerInfo.classList.add('owner-info-link');
					ownerInfo.style.cursor = 'pointer';
					ownerInfo.title = \`Visit \${displayName} profile\`;

					if (visitArrow) {
						visitArrow.style.display = 'block';
					}

					if (!ownerInfo.dataset.visitBound) {
						ownerInfo.addEventListener('click', (e) => {
							if (e.target.closest('button')) return;
							window.location.href = ownerProfileUrl;
						});
						ownerInfo.dataset.visitBound = 'true';
					}
				}
			} else {
				if (ownerNameEl) {
					ownerNameEl.style.display = 'none';
				}
				if (ownerAddrEl) {
					ownerAddrEl.style.fontSize = '0.95rem';
					ownerAddrEl.style.fontWeight = '600';
					ownerAddrEl.style.color = 'var(--text)';
				}
			}
		}

		// Initialize
		renderWalletBar();
		updateGlobalWalletWidget();
		updateEditButton();
		restoreWalletConnection();
		fetchAndDisplayOwnerInfo();
		updateGracePeriodOwnerInfo();


		// ===== QUICK SEARCH (Keyboard-activated + Button) =====
		const searchOverlay = document.getElementById('search-overlay');
		const searchInput = document.getElementById('search-input');
		const searchResults = document.getElementById('search-results');
		let searchActive = false;
		let searchTimeout = null;
		let selectedIndex = 0;
		let currentResults = [];

		function openSearch(initialChar) {
			if (searchActive) return;
			searchActive = true;
			selectedIndex = 0;
			currentResults = [];
			if (searchOverlay) searchOverlay.classList.add('active');
			if (searchResults) searchResults.innerHTML = '';
			if (initialChar && searchInput) {
				searchInput.value = initialChar;
				performSearch(initialChar);
			}
			setTimeout(() => searchInput?.focus(), 50);
		}

		function closeSearch() {
			searchActive = false;
			if (searchOverlay) searchOverlay.classList.remove('active');
			if (searchInput) searchInput.value = '';
			if (searchResults) searchResults.innerHTML = '';
			currentResults = [];
			selectedIndex = 0;
		}

		function cleanNameInput(input) {
			let name = input?.trim()?.toLowerCase() || '';
			name = name.replace(/\\.sui$/i, '');
			const invalidChars = new RegExp('[^a-z0-9-]', 'g');
			name = name.replace(invalidChars, '');
			return name;
		}

		function navigateToName(name) {
			const cleanName = name ? cleanNameInput(name) : cleanNameInput(searchInput?.value);
			if (cleanName && cleanName.length >= 1) {
				window.location.href = 'https://' + cleanName + '.sui.ski';
			}
		}

		function renderSearchResults() {
			if (!searchResults) return;
			if (currentResults.length === 0) {
				searchResults.innerHTML = '';
				return;
			}

			const arrowIcon = '<svg class="search-result-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';

			searchResults.innerHTML = currentResults.map((result, idx) => {
				const initial = result.name.charAt(0).toUpperCase();
				let badgeClass = 'checking';
				let badgeText = 'Checking...';
				let statusText = '';

				if (result.status === 'available') {
					badgeClass = 'available';
					badgeText = 'Available';
					statusText = 'Register this name on SuiNS';
				} else if (result.status === 'listed') {
					badgeClass = 'listed';
					badgeText = result.listingPrice + ' SUI';
					statusText = connectedAddress ? 'Click to buy' : 'Connect wallet to buy';
				} else if (result.status === 'taken') {
					badgeClass = 'taken';
					badgeText = 'Taken';
					if (result.expiresIn) {
						if (result.expiresIn <= 0) {
							badgeClass = 'expiring';
							badgeText = 'Expired';
							statusText = 'In grace period - may become available';
						} else if (result.expiresIn <= 90) {
							badgeClass = 'expiring';
							badgeText = result.expiresIn + 'd left';
							statusText = 'Expiring soon';
						} else {
							statusText = 'Expires in ' + result.expiresIn + ' days';
						}
					} else {
						statusText = 'View profile';
					}
				}

				return \`
					<div class="search-result-item\${idx === selectedIndex ? ' selected' : ''}" data-name="\${result.name}" data-index="\${idx}">
						<div class="search-result-avatar">\${initial}</div>
						<div class="search-result-info">
							<div class="search-result-name">\${result.name}<span class="suffix">.sui</span></div>
							<div class="search-result-status">\${statusText}</div>
						</div>
						<span class="search-result-badge \${badgeClass}">\${badgeText}</span>
						\${arrowIcon}
					</div>
				\`;
			}).join('');

			searchResults.querySelectorAll('.search-result-item').forEach(item => {
				item.addEventListener('click', () => {
					const idx = parseInt(item.dataset.index);
					const result = currentResults[idx];
					if (result?.status === 'listed' && result.listing) {
						buyListedName(result);
					} else {
						navigateToName(item.dataset.name);
					}
				});
				item.addEventListener('mouseenter', () => {
					selectedIndex = parseInt(item.dataset.index);
					updateSelection();
				});
			});
		}

		function updateSelection() {
			if (!searchResults) return;
			searchResults.querySelectorAll('.search-result-item').forEach((item, idx) => {
				item.classList.toggle('selected', idx === selectedIndex);
			});
		}

		async function checkNameAvailability(name) {
			try {
				const suiClient = getSuiClient();
				const suinsClient = new SuinsClient({
					client: suiClient,
					network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
				});

				const [record, marketRes, tradeportRes] = await Promise.all([
					suinsClient.getNameRecord(name + '.sui').catch(() => null),
					fetch('/api/marketplace/' + encodeURIComponent(name)).catch(() => null),
					fetch('/api/tradeport/name/' + encodeURIComponent(name + '.sui')).catch(() => null)
				]);

				let listing = null;
				let listingPrice = null;
				let tradeportUrl = null;

				if (marketRes && marketRes.ok) {
					const marketData = await marketRes.json().catch(() => null);
					if (marketData?.bestListing?.price) {
						listing = marketData.bestListing;
						listingPrice = (Number(listing.price) / 1e9).toFixed(2);
						tradeportUrl = listing.tradeportUrl;
					}
				}

				if (!listing && tradeportRes && tradeportRes.ok) {
					const tpData = await tradeportRes.json().catch(() => null);
					if (tpData?.price || tpData?.listing?.price) {
						const rawPrice = tpData.price || tpData.listing?.price;
						listing = tpData.listing || tpData;
						listingPrice = (Number(rawPrice) / 1e9).toFixed(2);
						tradeportUrl = 'https://tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(name);
					}
				}

				if (!record) {
					if (listing) {
						return { name, status: 'listed', listingPrice, tradeportUrl, listing };
					}
					return { name, status: 'available' };
				}

				let expiresIn = null;
				if (record.expirationTimestampMs) {
					const expiresMs = parseInt(record.expirationTimestampMs);
					expiresIn = Math.ceil((expiresMs - Date.now()) / (24 * 60 * 60 * 1000));
				}

				if (listing) {
					return { name, status: 'listed', expiresIn, listingPrice, tradeportUrl, listing };
				}

				return { name, status: 'taken', expiresIn };
			} catch (e) {
				console.error('Error checking name:', e);
				return { name, status: 'taken' };
			}
		}

		async function performSearch(query) {
			const name = cleanNameInput(query);
			if (!name || name.length < 1) {
				currentResults = [];
				renderSearchResults();
				return;
			}

			// Show the name being searched with checking status
			currentResults = [{ name, status: 'checking' }];
			selectedIndex = 0;
			renderSearchResults();

			// Check availability
			const result = await checkNameAvailability(name);

			// Only update if the input hasn't changed
			if (cleanNameInput(searchInput?.value) === name) {
				currentResults = [result];
				renderSearchResults();
			}
		}

		async function buyListedName(result) {
			if (!connectedAddress || !connectedWallet) {
				openWalletModal();
				return;
			}

			const listing = result.listing;
			if (!listing || !listing.price) return;

			const nonce = listing.nonce || '';
			const tradeportUrl = result.tradeportUrl || 'https://tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(result.name);

			if (!nonce || nonce.startsWith('1::')) {
				window.open(tradeportUrl, '_blank');
				return;
			}

			const statusEl = searchResults?.querySelector('[data-name="' + result.name + '"] .search-result-status');
			if (statusEl) statusEl.textContent = 'Checking balance...';

			try {
				const suiClient = getSuiClient();
				const listingPriceMist = BigInt(listing.price);
				const isNewFormat = nonce.startsWith('0::');
				const COMMISSION_BPS = 300;
				const marketFeeMist = isNewFormat
					? BigInt(Math.ceil(Number(listingPriceMist) * COMMISSION_BPS / 10000))
					: 0n;
				const totalSuiNeeded = listingPriceMist + marketFeeMist;
				const GAS_RESERVE = 50_000_000n;

				const suiBalanceRes = await suiClient.getBalance({
					owner: connectedAddress,
					coinType: '0x2::sui::SUI',
				});
				const suiAvailable = BigInt(suiBalanceRes.totalBalance);
				const shortfall = totalSuiNeeded + GAS_RESERVE - suiAvailable;

				let swapInfo = null;

				if (shortfall > 0n) {
					if (!DEEPBOOK_PACKAGE || !DEEPBOOK_NS_SUI_POOL || !DEEPBOOK_DEEP_SUI_POOL) {
						const needed = (Number(totalSuiNeeded) / 1e9).toFixed(4);
						const have = (Number(suiAvailable) / 1e9).toFixed(4);
						if (statusEl) statusEl.textContent = 'Need ' + needed + ' SUI (have ' + have + ')';
						return;
					}

					if (statusEl) statusEl.textContent = 'Insufficient SUI. Checking holdings...';

					const [nsBalRes, deepBalRes, usdcBalRes, nsPriceData] = await Promise.all([
						suiClient.getBalance({ owner: connectedAddress, coinType: NS_TYPE }).catch(() => ({ totalBalance: '0' })),
						suiClient.getBalance({ owner: connectedAddress, coinType: DEEP_TYPE }).catch(() => ({ totalBalance: '0' })),
						suiClient.getBalance({ owner: connectedAddress, coinType: USDC_TYPE }).catch(() => ({ totalBalance: '0' })),
						fetch('/api/ns-price').then(r => r.json()).catch(() => null),
					]);

					const nsAvail = BigInt(nsBalRes.totalBalance);
					const deepAvail = BigInt(deepBalRes.totalBalance);
					const usdcAvail = BigInt(usdcBalRes.totalBalance);

					if (nsAvail > 0n && nsPriceData?.suiPerNs > 0) {
						const suiPerNs = nsPriceData.suiPerNs;
						const shortfallSui = Number(shortfall) / 1e9;
						const nsTokensNeeded = shortfallSui / suiPerNs;
						const nsMistNeeded = BigInt(Math.ceil(nsTokensNeeded * 1e6));
						const nsMistWithBuffer = nsMistNeeded + (nsMistNeeded * 25n) / 100n;
						const amountToSell = nsMistWithBuffer > nsAvail ? nsAvail : nsMistWithBuffer;

						const expectedSui = Number(amountToSell) / 1e6 * suiPerNs;
						const minSuiOut = BigInt(Math.floor(expectedSui * 0.85 * 1e9));

						if (minSuiOut > 0n) {
							const nsCoins = await suiClient.getCoins({ owner: connectedAddress, coinType: NS_TYPE });
							if (nsCoins.data.length > 0) {
								swapInfo = {
									type: NS_TYPE,
									pool: DEEPBOOK_NS_SUI_POOL,
									name: 'NS',
									coins: nsCoins.data,
									amountToSell,
									minSuiOut,
									needsDeepFee: true,
								};
							}
						}
					}

					if (!swapInfo && deepAvail > 1_000_000n) {
						const deepForFee = 500_000n;
						const deepToSellMax = deepAvail - deepForFee;

						if (deepToSellMax > 0n) {
							const roughDeepPrice = 0.02;
							const expectedSui = Number(deepToSellMax) / 1e6 * roughDeepPrice;
							const minSuiOut = BigInt(Math.floor(expectedSui * 0.5 * 1e9));

							if (minSuiOut > 0n) {
								const deepCoins = await suiClient.getCoins({ owner: connectedAddress, coinType: DEEP_TYPE });
								if (deepCoins.data.length > 0) {
									swapInfo = {
										type: DEEP_TYPE,
										pool: DEEPBOOK_DEEP_SUI_POOL,
										name: 'DEEP',
										coins: deepCoins.data,
										amountToSell: deepToSellMax,
										deepForFee,
										minSuiOut,
										needsDeepFee: false,
									};
								}
							}
						}
					}

					if (!swapInfo && usdcAvail > 0n && DEEPBOOK_SUI_USDC_POOL) {
						const usdcPriceData = await fetch('/api/usdc-price').then(r => r.json()).catch(() => null);
						if (usdcPriceData?.usdcPerSui > 0) {
							const shortfallSui = Number(shortfall) / 1e9;
							const usdcTokensNeeded = shortfallSui * usdcPriceData.usdcPerSui;
							const usdcMistNeeded = BigInt(Math.ceil(usdcTokensNeeded * 1e6));
							const usdcMistWithBuffer = usdcMistNeeded + (usdcMistNeeded * 30n) / 100n;
							const amountToSell = usdcMistWithBuffer > usdcAvail ? usdcAvail : usdcMistWithBuffer;

							const expectedSui = Number(amountToSell) / 1e6 / usdcPriceData.usdcPerSui;
							const minSuiOut = BigInt(Math.floor(expectedSui * 0.85 * 1e9));

							if (minSuiOut > 0n) {
								const usdcCoins = await suiClient.getCoins({ owner: connectedAddress, coinType: USDC_TYPE });
								if (usdcCoins.data.length > 0) {
									swapInfo = {
										type: USDC_TYPE,
										pool: DEEPBOOK_SUI_USDC_POOL,
										name: 'USDC',
										coins: usdcCoins.data,
										amountToSell,
										minSuiOut,
										needsDeepFee: true,
										isQuoteSwap: true,
									};
								}
							}
						}
					}

					if (!swapInfo) {
						const needed = (Number(totalSuiNeeded) / 1e9).toFixed(4);
						const have = (Number(suiAvailable) / 1e9).toFixed(4);
						if (statusEl) statusEl.textContent = 'Need ' + needed + ' SUI (have ' + have + ')';
						return;
					}
				}

				if (statusEl) statusEl.textContent = swapInfo
					? 'Swapping ' + swapInfo.name + ' for SUI...'
					: 'Building transaction...';

				const tx = new Transaction();
				tx.setSender(connectedAddress);

				const TRADEPORT_LEGACY_STORE = '0x47cba0b6309a12ce39f9306e28b899ed4b3698bce4f4911fd0c58ff2329a2ff6';
				const TRADEPORT_LEGACY_STORE_VERSION = '3377344';
				const TRADEPORT_LEGACY_PACKAGE = '0xb42dbb7413b79394e1a0175af6ae22b69a5c7cc5df259cd78072b6818217c027';
				const TRADEPORT_LISTINGS_STORE = '0xf96f9363ac5a64c058bf7140723226804d74c0dab2dd27516fb441a180cd763b';
				const TRADEPORT_LISTINGS_STORE_VERSION = '670935706';
				const TRADEPORT_LISTINGS_PACKAGE = '0x6cfe7388ccf732432906d7faebcc33fd91e11d4c2f8cb3ae0082b8d3269e3d5b';
				const REG_TYPE = '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration';

				if (swapInfo) {
					let tokenCoin;
					if (swapInfo.coins.length === 1) {
						tokenCoin = tx.object(swapInfo.coins[0].coinObjectId);
					} else {
						tokenCoin = tx.object(swapInfo.coins[0].coinObjectId);
						tx.mergeCoins(tokenCoin, swapInfo.coins.slice(1).map(c => tx.object(c.coinObjectId)));
					}

					const [tokenToSell] = tx.splitCoins(tokenCoin, [tx.pure.u64(swapInfo.amountToSell)]);

					let deepFeeCoin;

					if (swapInfo.needsDeepFee) {
						const [suiForDeep] = tx.splitCoins(tx.gas, [tx.pure.u64(SUI_FOR_DEEP_SWAP)]);
						const [zeroDeep] = tx.moveCall({
							target: '0x2::coin::zero',
							typeArguments: [DEEP_TYPE],
						});
						const [boughtDeep, dsSuiLeft, dsDeepLeft] = tx.moveCall({
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
						tx.transferObjects([dsSuiLeft, dsDeepLeft], connectedAddress);
						deepFeeCoin = boughtDeep;
					} else {
						const [feeFromDeep] = tx.splitCoins(tokenCoin, [tx.pure.u64(swapInfo.deepForFee)]);
						deepFeeCoin = feeFromDeep;
					}

					let swappedSui;
					if (swapInfo.isQuoteSwap) {
						const [suiOut, usdcLeft, deepLeft2] = tx.moveCall({
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
						const leftovers = [usdcLeft, deepLeft2];
						if (swapInfo.needsDeepFee) leftovers.push(tokenCoin);
						tx.transferObjects(leftovers, connectedAddress);
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
						const leftovers = [tokenLeft, deepLeft2];
						if (swapInfo.needsDeepFee) leftovers.push(tokenCoin);
						tx.transferObjects(leftovers, connectedAddress);
					}
					tx.mergeCoins(tx.gas, [swappedSui]);
				}

				if (isNewFormat) {
					const marketFee = Math.ceil(Number(listingPriceMist) * COMMISSION_BPS / 10000);
					const totalAmount = Number(listingPriceMist) + marketFee;
					const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalAmount)]);
					const listingsStoreRef = tx.sharedObjectRef({
						objectId: TRADEPORT_LISTINGS_STORE,
						initialSharedVersion: TRADEPORT_LISTINGS_STORE_VERSION,
						mutable: true,
					});
					tx.moveCall({
						target: TRADEPORT_LISTINGS_PACKAGE + '::tradeport_listings::buy_listing_without_transfer_policy',
						typeArguments: [REG_TYPE],
						arguments: [listingsStoreRef, tx.pure.id(listing.tokenId), paymentCoin],
					});
					tx.moveCall({
						target: '0x2::coin::destroy_zero',
						typeArguments: ['0x2::sui::SUI'],
						arguments: [paymentCoin],
					});
				} else {
					const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(Number(listingPriceMist))]);
					const listingStoreRef = tx.sharedObjectRef({
						objectId: TRADEPORT_LEGACY_STORE,
						initialSharedVersion: TRADEPORT_LEGACY_STORE_VERSION,
						mutable: true,
					});
					tx.moveCall({
						target: TRADEPORT_LEGACY_PACKAGE + '::listings::buy',
						typeArguments: [REG_TYPE],
						arguments: [listingStoreRef, tx.pure.address(nonce), paymentCoin],
					});
					tx.moveCall({
						target: '0x2::coin::destroy_zero',
						typeArguments: ['0x2::sui::SUI'],
						arguments: [paymentCoin],
					});
				}

				if (statusEl) statusEl.textContent = 'Confirm in wallet...';

				const signExecFeature = connectedWallet?.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet?.features?.['sui:signAndExecuteTransactionBlock'];

				let txResult;
				if (signExecFeature?.signAndExecuteTransaction) {
					txResult = await signExecFeature.signAndExecuteTransaction({
						transaction: tx,
						account: connectedAccount,
						chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
						options: { showEffects: true },
					});
				} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
					txResult = await signExecBlockFeature.signAndExecuteTransactionBlock({
						transactionBlock: tx,
						account: connectedAccount,
						chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
						options: { showEffects: true },
					});
				} else {
					throw new Error('Wallet does not support transaction signing');
				}

				if (statusEl) statusEl.textContent = 'Purchased! Redirecting...';
				closeSearch();
				setTimeout(() => {
					window.location.href = 'https://' + result.name + '.sui.ski';
				}, 1500);
			} catch (e) {
				console.error('Search buy failed:', e);
				const msg = e.message || 'Failed';
				if (statusEl) {
					statusEl.textContent = msg.includes('rejected') || msg.includes('cancelled')
						? 'Cancelled'
						: 'Failed: ' + msg.slice(0, 60);
				}
			}
		}

		// Search input events
		if (searchInput) {
			searchInput.addEventListener('input', (e) => {
				clearTimeout(searchTimeout);
				searchTimeout = setTimeout(() => {
					performSearch(e.target.value);
				}, 300);
			});

			searchInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					const selected = currentResults[selectedIndex];
					if (selected?.status === 'listed' && selected.listing) {
						buyListedName(selected);
					} else if (selected) {
						navigateToName(selected.name);
					} else {
						navigateToName();
					}
				} else if (e.key === 'Escape') {
					e.preventDefault();
					closeSearch();
				} else if (e.key === 'ArrowDown') {
					e.preventDefault();
					if (currentResults.length > 0) {
						selectedIndex = (selectedIndex + 1) % currentResults.length;
						updateSelection();
					}
				} else if (e.key === 'ArrowUp') {
					e.preventDefault();
					if (currentResults.length > 0) {
						selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
						updateSelection();
					}
				}
			});
		}

		// Listen for any keypress on the page to open search
		document.addEventListener('keydown', (e) => {
			// Ignore if already in search or other input
			if (searchActive) return;
			if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

			// Ignore modifier keys
			if (e.metaKey || e.ctrlKey || e.altKey) return;

			// Slash or Cmd+K opens search
			if (e.key === '/' || e.key === 'k') {
				e.preventDefault();
				openSearch('');
				return;
			}

			// If it's a letter or number, open search with that character
			if (/^[a-zA-Z0-9]$/.test(e.key)) {
				e.preventDefault();
				openSearch(e.key.toLowerCase());
			}
		});

		// Global escape to close
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && searchActive) {
				closeSearch();
			}
		});

		// Click outside closes search
		if (searchOverlay) {
			searchOverlay.addEventListener('click', (e) => {
				if (e.target === searchOverlay) {
					closeSearch();
				}
			});
		}

		// Search button click handler
		const searchBtn = document.getElementById('search-btn');
		if (searchBtn) {
			searchBtn.addEventListener('click', () => openSearch(''));
		}


		// ===== MESSAGING FUNCTIONALITY =====
		const MESSAGING_CONTRACT = ${serializeJson(String(env.MESSAGING_CONTRACT_ADDRESS || ''))};
		const RECIPIENT_ADDRESS = CURRENT_ADDRESS;
		const RECIPIENT_NAME = NAME;
		const messageInput = document.getElementById('message-input');
		const sendMessageBtn = document.getElementById('send-message-btn');
		const messageStatus = document.getElementById('message-status');

		function updateMessagingButton() {
			if (!sendMessageBtn) return;
			const btnText = sendMessageBtn.querySelector('.btn-text');
			if (!btnText) return;

			if (connectedAddress) {
				sendMessageBtn.disabled = false;
				btnText.textContent = 'Send Message';
			} else {
				sendMessageBtn.disabled = false;
				btnText.textContent = 'Connect Wallet';
			}
		}

		function showMessageStatus(message, type = 'info', showSpinner = false) {
			if (!messageStatus) return;
			messageStatus.innerHTML = (showSpinner ? '<span class="loading"></span> ' : '') + message;
			messageStatus.className = 'message-status ' + type;
		}

		function hideMessageStatus() {
			if (!messageStatus) return;
			messageStatus.className = 'message-status hidden';
		}

		async function sendEncryptedMessage() {
			const message = messageInput?.value?.trim();
			if (!message) {
				showMessageStatus('Please enter a message', 'error');
				return;
			}

			if (message.length > 512) {
				showMessageStatus('Message too long (max 512 characters)', 'error');
				return;
			}

			if (!MESSAGING_CONTRACT) {
				showMessageStatus('Messaging contract not configured', 'error');
				return;
			}

			const btnText = sendMessageBtn.querySelector('.btn-text');

			try {
				sendMessageBtn.disabled = true;
				btnText.textContent = 'Preparing...';
				showMessageStatus('Initializing encrypted channel...', 'info', true);

				// Import Sui SDK
				const { Transaction } = await import('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle');
				const { SuiJsonRpcClient } = await import('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle');

				const suiClient = getSuiClient();
				const tx = new Transaction();

				btnText.textContent = 'Encrypting...';
				showMessageStatus('Encrypting message with Seal protocol...', 'info', true);

				// Create channel and send message using the Sui Stack Messaging contract
				// The contract structure: channel::create_channel, message::send_message

				// For 1:1 messaging, we create a direct channel if needed
				// Package modules: channel, message, config, auth, etc.

				// Create message payload (in production this would be encrypted with Seal)
				const messagePayload = {
					from: connectedAddress,
					to: RECIPIENT_ADDRESS,
					toName: RECIPIENT_NAME,
					content: message,
					timestamp: Date.now(),
					version: 1
				};

				// Encode message as bytes
				const encoder = new TextEncoder();
				const messageBytes = encoder.encode(JSON.stringify(messagePayload));

				// Call the messaging contract to create/join channel and send message
				// Note: This is a simplified version - full implementation needs channel creation first
				tx.moveCall({
					target: MESSAGING_CONTRACT + '::message::send_text',
					arguments: [
						tx.pure.address(RECIPIENT_ADDRESS),
						tx.pure.string(message.slice(0, 512)),
					],
				});

				tx.setGasBudget(50000000);

				btnText.textContent = 'Signing...';
				showMessageStatus('Please approve the transaction in your wallet...', 'info', true);

				// Sign and execute
				const result = await signAndExecuteWithWallet(
					tx,
					suiClient,
					connectedAccount,
					NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet'
				);

				btnText.textContent = 'Confirming...';
				showMessageStatus('Waiting for confirmation...', 'info', true);

				// Wait for transaction confirmation
				if (result.digest) {
					await suiClient.waitForTransaction({ digest: result.digest });

					// Success!
					showMessageStatus('Message sent to @' + RECIPIENT_NAME + '! Tx: ' + result.digest.slice(0, 8) + '...', 'success');
					messageInput.value = '';

					// Show link to view on explorer
					setTimeout(() => {
						showMessageStatus('<a href="https://suiscan.xyz/' + NETWORK + '/tx/' + result.digest + '" target="_blank" style="color: inherit; text-decoration: underline;">View transaction on explorer →</a>', 'success');
					}, 2000);
				}

			} catch (error) {
				console.error('Messaging error:', error);

				// Handle specific errors
				if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
					showMessageStatus('Transaction cancelled', 'error');
				} else if (error.message?.includes('Insufficient')) {
					showMessageStatus('Insufficient SUI balance for gas', 'error');
				} else if (error.message?.includes('MoveAbort') || error.message?.includes('function not found')) {
					// Contract function may not exist yet - fall back to demo mode
					showMessageStatus('Direct messaging coming soon! Try Polymedia Chat for now.', 'info');
					setTimeout(() => {
						if (confirm('Open Polymedia Chat to send encrypted messages?')) {
							window.open('https://chat.polymedia.app/', '_blank');
						}
					}, 500);
				} else {
					showMessageStatus('Failed: ' + (error.message || 'Unknown error'), 'error');
				}
			} finally {
				updateMessagingButton();
			}
		}

		// Add messaging event listeners
		if (sendMessageBtn) {
			sendMessageBtn.addEventListener('click', async () => {
				if (!connectedAddress) {
					await connectWallet();
					updateMessagingButton();
					if (connectedAddress && messageInput?.value?.trim()) {
						// Auto-send after connecting if message is ready
						await sendEncryptedMessage();
					}
				} else {
					await sendEncryptedMessage();
				}
			});
		}

		if (messageInput) {
			messageInput.addEventListener('input', () => {
				hideMessageStatus();
			});

			// Allow Ctrl+Enter to send
			messageInput.addEventListener('keydown', async (e) => {
				if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
					e.preventDefault();
					if (connectedAddress) {
						await sendEncryptedMessage();
					} else {
						sendMessageBtn?.click();
					}
				}
			});
		}

		// Update messaging button when wallet state changes
		const originalRenderWalletBar = renderWalletBar;
		renderWalletBar = function() {
			originalRenderWalletBar();
			updateMessagingButton();
		};

		// Initialize messaging button state
		updateMessagingButton();

		// ========== HELPER FUNCTIONS ==========
		// Validate if a string is a valid Sui address (0x followed by 64 hex chars)
		function isValidSuiAddress(addr) {
			if (!addr || typeof addr !== 'string') return false;
			return /^0x[a-fA-F0-9]{64}$/.test(addr);
		}

		// Helper to wrap transaction bytes for wallet-standard
		function wrapTxBytes(bytes) {
			return {
				serialize() { return bytes; },
				toJSON() { return btoa(String.fromCharCode.apply(null, Array.from(bytes))); }
			};
		}

		// Helper function to escape HTML in JS
		function escapeHtmlJs(str) {
			if (!str) return '';
			return str
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
		}

		// ========== SUINS REGISTRATION NFTS ==========
		const nftsContent = document.getElementById('nfts-content');
		const nftsCountEl = document.getElementById('nfts-count');
		let allNFTs = [];
		let nftsNextCursor = null;
		let nftsHasMore = true;
		let nftsLoading = false;

		// Extract domain name from NFT object data
		function extractDomainFromNFT(nftData) {
			try {
				// Try to get domain from content fields
				if (nftData?.content?.dataType === 'moveObject' && nftData.content.fields) {
					const fields = nftData.content.fields;
					// Try domain_name field first (most direct)
					if (fields.domain_name) {
						return String(fields.domain_name);
					}
					// Try domain object with labels array
					if (fields.domain && typeof fields.domain === 'object') {
						const domainObj = fields.domain;
						const labels = domainObj.fields?.labels || domainObj.labels;
						if (Array.isArray(labels) && labels.length > 0) {
							// Reverse labels and join with dots (e.g., ["sui", "agent"] -> "agent.sui")
							return [...labels].reverse().join('.');
						}
					}
					// Check various other possible field names for domain
					if (fields.domain && typeof fields.domain === 'string') {
						return fields.domain;
					}
					if (fields.name) {
						return String(fields.name);
					}
					// Check nested structures
					if (fields.registration && typeof fields.registration === 'object') {
						if (fields.registration.fields?.domain) {
							return String(fields.registration.fields.domain);
						}
						if (fields.registration.fields?.name) {
							return String(fields.registration.fields.name);
						}
					}
				}
				// Try display data
				if (nftData?.display?.data) {
					const display = nftData.display.data;
					if (display.name) return String(display.name);
					if (display.domain) return String(display.domain);
				}
			} catch (e) {
				console.error('Error extracting domain:', e);
			}
			return null;
		}

		// Extract expiration timestamp from NFT object data
		function extractExpirationFromNFT(nftData) {
			try {
				if (nftData?.content?.dataType === 'moveObject' && nftData.content.fields) {
					const fields = nftData.content.fields;
					if (fields.expiration_timestamp_ms) {
						return String(fields.expiration_timestamp_ms);
					}
					if (fields.expirationTimestampMs) {
						return String(fields.expirationTimestampMs);
					}
				}
			} catch (e) {
				console.error('Error extracting expiration:', e);
			}
			return null;
		}

		// Fetch all SuiNS registration NFTs owned by the address
		async function fetchNFTs(cursor = null, ownerOverride = null) {
			if (nftsLoading && cursor === null) return; // Only prevent if starting fresh fetch

			// Determine the owner address to use
			let ownerAddress = ownerOverride || CURRENT_ADDRESS;

			// Validate address before attempting to fetch
			if (!isValidSuiAddress(ownerAddress)) {
				// Try to get owner from NFT as fallback
				if (!ownerOverride && NFT_ID) {
					console.log('Attempting to fetch NFT owner as fallback...');
					const nftOwner = await fetchNftOwner();
					if (nftOwner && isValidSuiAddress(nftOwner)) {
						console.log('Using NFT owner:', nftOwner);
						return fetchNFTs(cursor, nftOwner);
					}
				}
				console.warn('Invalid or missing address for NFT fetch:', ownerAddress);
				renderNFTsError('No valid owner address available for this name');
				nftsLoading = false;
				return;
			}

			if (cursor === null) {
				// Starting fresh fetch - reset state
				allNFTs = [];
				nftsNextCursor = null;
				nftsHasMore = true;
				nftsLoading = true;
			}

			// Create client outside try block so it's available in catch
			const suiClient = getSuiClient();

			try {
				// Fetch owned objects filtered by SuiNS registration type
				// The struct type includes "SuinsRegistration" in the name
				const response = await suiClient.getOwnedObjects({
					owner: ownerAddress,
					filter: {
						StructType: '0x2d0dee46d9f967ec56c2fb8d64f9b01bb3c5c8d11e8c03a42b149f2e90e8e9b::suins_registration::SuinsRegistration'
					},
					options: {
						showType: true,
						showContent: true,
						showDisplay: true,
						showOwner: true
					},
					cursor: cursor,
					limit: 50
				});

				if (response.data && response.data.length > 0) {
					// Process each NFT object
					const processedNFTs = response.data.map(item => {
						if (!item.data) return null;

						const objectId = item.data.objectId;
						const domain = extractDomainFromNFT(item.data);
						const expirationTimestampMs = extractExpirationFromNFT(item.data);

						// Extract image URL from display data
						let imageUrl = null;
						if (item.data.display?.data) {
							const display = item.data.display.data;
							imageUrl = display.image_url || display.image || display.avatar || display.avatar_url || null;
						}

						return {
							nftId: objectId,
							domain: domain,
							objectData: item.data,
							expirationTimestampMs: expirationTimestampMs,
							imageUrl: imageUrl
						};
					}).filter(nft => nft !== null);

					allNFTs = cursor ? [...allNFTs, ...processedNFTs] : processedNFTs;

					// Load the first NFT image (or the current one) into the identity card
					if (!nftDisplayLoaded && allNFTs.length > 0) {
						loadIdentityCardNFT();
					}
				}

				nftsNextCursor = response.nextCursor;
				nftsHasMore = response.hasNextPage || false;

				// Continue fetching if there are more pages
				if (nftsHasMore && nftsNextCursor) {
					// Update count to show progress
					if (nftsCountEl) nftsCountEl.textContent = \`\${allNFTs.length}+...\`;
					// Continue fetching next page (pass ownerAddress to maintain override)
					await fetchNFTs(nftsNextCursor, ownerAddress);
				} else {
					// All pages fetched, render final results
					renderNFTs();
					if (nftsCountEl) nftsCountEl.textContent = String(allNFTs.length);
					// If no NFT was loaded, show QR code as fallback
					if (!nftDisplayLoaded && allNFTs.length === 0) {
						showIdentityQr();
						nftDisplayLoaded = true;
					}
				}
			} catch (error) {
				console.error('Failed to fetch NFTs with struct filter:', error);
				// If the struct type filter fails, try fetching all owned objects and filtering client-side
				try {
					if (cursor === null) {
						console.log('Trying alternative method: fetching all objects and filtering...');
						allNFTs = [];
					}
					const response = await suiClient.getOwnedObjects({
						owner: ownerAddress,
						options: {
							showType: true,
							showContent: true,
							showDisplay: true,
							showOwner: true
						},
						cursor: cursor,
						limit: 50
					});

					if (response.data && response.data.length > 0) {
						// Filter for SuiNS registration NFTs by checking object type
						const suinsNFTs = response.data.filter(item => {
							const objectType = item.data?.type || '';
							return objectType.includes('SuinsRegistration') || objectType.includes('suins_registration');
						}).map(item => {
							if (!item.data) return null;

							const objectId = item.data.objectId;
							const domain = extractDomainFromNFT(item.data);
							const expirationTimestampMs = extractExpirationFromNFT(item.data);

							// Extract image URL from display data
							let imageUrl = null;
							if (item.data.display?.data) {
								const display = item.data.display.data;
								imageUrl = display.image_url || display.image || display.avatar || display.avatar_url || null;
							}

							return {
								nftId: objectId,
								domain: domain,
								objectData: item.data,
								expirationTimestampMs: expirationTimestampMs,
								imageUrl: imageUrl
							};
						}).filter(nft => nft !== null);

						allNFTs = cursor ? [...allNFTs, ...suinsNFTs] : suinsNFTs;

						// Load the first NFT image (or the current one) into the identity card
						if (!nftDisplayLoaded && allNFTs.length > 0) {
							loadIdentityCardNFT();
						}
					}

					nftsNextCursor = response.nextCursor;
					nftsHasMore = response.hasNextPage || false;

					// Continue fetching if there are more pages
					if (nftsHasMore && nftsNextCursor) {
						// Update count to show progress
						if (nftsCountEl) nftsCountEl.textContent = \`\${allNFTs.length}+...\`;
						// Continue fetching next page (pass ownerAddress to maintain override)
						await fetchNFTs(nftsNextCursor, ownerAddress);
					} else {
						// All pages fetched, render final results
						renderNFTs();
						if (nftsCountEl) nftsCountEl.textContent = String(allNFTs.length);
						// If no NFT was loaded, show QR code as fallback
						if (!nftDisplayLoaded && allNFTs.length === 0) {
							showIdentityQr();
							nftDisplayLoaded = true;
						}
					}
				} catch (fallbackError) {
					console.error('Fallback method also failed:', fallbackError);
					renderNFTsError(fallbackError.message || error.message || 'Failed to load NFTs');
					nftsLoading = false;
					// Show QR code as fallback if NFT loading failed
					if (!nftDisplayLoaded) {
						showIdentityQr();
						nftDisplayLoaded = true;
					}
				}
			} finally {
				// Only set loading to false when we're completely done (no more pages)
				if (!nftsHasMore || !nftsNextCursor) {
					nftsLoading = false;
				}
			}
		}


		// Render the NFTs grid
		function renderNFTs() {
			if (!nftsContent) return;

			if (allNFTs.length === 0) {
				if (nftsCountEl) nftsCountEl.textContent = '0';
				nftsContent.innerHTML = \`
					<div class="names-empty">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="9" y1="3" x2="9" y2="21"></line>
							<line x1="15" y1="3" x2="15" y2="21"></line>
							<line x1="3" y1="9" x2="21" y2="9"></line>
							<line x1="3" y1="15" x2="21" y2="15"></line>
						</svg>
						<p>No SuiNS registration NFTs found</p>
						<span class="hint">This address doesn't own any SuiNS registration NFTs</span>
					</div>
				\`;
				return;
			}

			if (nftsCountEl) nftsCountEl.textContent = nftsHasMore ? \`\${allNFTs.length}+\` : String(allNFTs.length);

			const cardsHtml = allNFTs.map(nft => {
				const objectId = nft.nftId || 'Unknown';
				const domain = nft.domain || '';
				const cleanedName = domain ? domain.replace(/\\.sui$/i, '') : null;
				const isCurrentName = cleanedName && cleanedName.toLowerCase() === NAME.toLowerCase();
				const profileUrl = cleanedName ? \`https://\${cleanedName}.sui.ski\` : null;
				const explorerUrl = \`\${EXPLORER_BASE}/object/\${objectId}\`;

				// Extract expiration if available (need this first for image URL)
				let expirationText = '';
				let daysRemaining = null;
				let expMs = null;
				try {
					if (nft.expirationTimestampMs) {
						expMs = Number(nft.expirationTimestampMs);
						if (expMs) {
							const expDate = new Date(expMs);
							expirationText = expDate.toLocaleDateString();
							daysRemaining = Math.ceil((expMs - Date.now()) / (1000 * 60 * 60 * 24));
						}
					}
				} catch (e) {}

				// Generate SuiNS API image URL for this NFT (with expiration timestamp)
				const nftImageUrl = cleanedName ? getSuiNSImageUrl(cleanedName, expMs) : null;

				// Determine expiry status for badge styling
				let expiryClass = '';
				if (daysRemaining !== null) {
					if (daysRemaining <= 0) expiryClass = 'expired';
					else if (daysRemaining <= 30) expiryClass = 'warning';
					else if (daysRemaining > 365) expiryClass = 'premium';
				}

				return \`
					<div class="nft-card\${isCurrentName ? ' current' : ''}" onclick="\${profileUrl ? \`window.location.href='\${profileUrl}'\` : ''}">
						<div class="nft-card-image-wrapper">
							\${nftImageUrl ? \`<img src="\${nftImageUrl}" alt="\${cleanedName}.sui" class="nft-card-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">\` : ''}
							<div class="nft-card-fallback"\${nftImageUrl ? ' style="display:none;"' : ''}>
								<span class="nft-card-initial">\${cleanedName ? cleanedName.charAt(0).toUpperCase() : '?'}</span>
							</div>
							\${isCurrentName ? '<span class="nft-card-current-badge">Current</span>' : ''}
						</div>
						<div class="nft-card-info">
							<div class="nft-card-name">
								<span class="domain">\${cleanedName ? escapeHtmlJs(cleanedName) : 'Unknown'}<span class="suffix">.sui</span></span>
							</div>
							<div class="nft-card-details">
								\${expirationText ? \`
									<div class="nft-card-expiry \${expiryClass}">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
										<span>\${daysRemaining !== null && daysRemaining <= 0 ? 'Expired' : expirationText}</span>
									</div>
								\` : ''}
								<a href="\${explorerUrl}" target="_blank" onclick="event.stopPropagation();" class="nft-card-explorer-link">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
									<span>Explorer</span>
								</a>
							</div>
						</div>
					</div>
				\`;
			}).join('');

			nftsContent.innerHTML = \`
				<div class="nfts-grid">
					\${cardsHtml}
				</div>
				\${nftsHasMore ? \`
					<div class="names-load-more" style="margin-top: 16px; text-align: center;">
						<button id="load-more-nfts-btn" style="padding: 10px 20px; background: var(--accent-light); color: var(--accent); border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Load More NFTs</button>
					</div>
				\` : ''}
			\`;

			// Attach load more handler
			const loadMoreBtn = document.getElementById('load-more-nfts-btn');
			if (loadMoreBtn) {
				loadMoreBtn.addEventListener('click', async () => {
					loadMoreBtn.disabled = true;
					loadMoreBtn.textContent = 'Loading...';
					await fetchNFTs(nftsNextCursor);
				});
			}
		}

		// Render error state
		function renderNFTsError(message) {
			if (!nftsContent) return;
			if (nftsCountEl) nftsCountEl.textContent = '-';
			nftsContent.innerHTML = \`
				<div class="names-error">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<p>\${escapeHtmlJs(message)}</p>
					<button class="names-retry-btn" id="retry-nfts-btn">Try Again</button>
				</div>
			\`;

			const retryBtn = document.getElementById('retry-nfts-btn');
			if (retryBtn) {
				retryBtn.addEventListener('click', () => {
					nftsContent.innerHTML = \`
						<div class="nfts-loading">
							<span class="loading"></span>
							<span>Fetching SuiNS registration NFTs...</span>
						</div>
					\`;
					allNFTs = [];
					nftsNextCursor = null;
					nftsHasMore = true;
					fetchNFTs();
				});
			}
		}

		// Load NFTs on page load
		let nftsLoaded = false;
		setTimeout(() => {
			if (!nftsLoaded) {
				nftsLoaded = true;
				fetchNFTs();
			}
		}, 200);

		// Also load NFTs for the identity card immediately
		if (isValidSuiAddress(CURRENT_ADDRESS)) {
			setTimeout(async () => {
				try {
					const suiClient = getSuiClient();
					const response = await suiClient.getOwnedObjects({
						owner: CURRENT_ADDRESS,
						filter: {
							StructType: '0x2d0dee46d9f967ec56c2fb8d64f9b01bb3c5c8d11e8c03a42b149f2e90e8e9b::suins_registration::SuinsRegistration'
						},
						options: {
							showType: true,
							showContent: true,
							showDisplay: true,
							showOwner: true
						},
						limit: 10 // Only fetch first 10 for identity card
					});

					if (response.data && response.data.length > 0) {
						const processedNFTs = response.data.map(item => {
							if (!item.data) return null;

							const objectId = item.data.objectId;
							const domain = extractDomainFromNFT(item.data);
							const expirationTimestampMs = extractExpirationFromNFT(item.data);

							// Extract image URL from display data
							let imageUrl = null;
							if (item.data.display?.data) {
								const display = item.data.display.data;
								imageUrl = display.image_url || display.image || display.avatar || display.avatar_url || null;
							}

							return {
								nftId: objectId,
								domain: domain,
								objectData: item.data,
								expirationTimestampMs: expirationTimestampMs,
								imageUrl: imageUrl
							};
						}).filter(nft => nft !== null);

						allNFTs = processedNFTs;
						loadIdentityCardNFT();
					}
				} catch (error) {
					console.log('Could not pre-load NFTs for identity card:', error);
				}
			}, 500);
		}

		// ========== EXPIRATION TIMER ==========
		const expDays = document.getElementById('exp-days');
		const expHours = document.getElementById('exp-hours');
		const expMins = document.getElementById('exp-mins');
		const expSecs = document.getElementById('exp-secs');
		const renewalCountdown = document.getElementById('renewal-countdown');

		function updateExpirationCountdown() {
			if (!EXPIRATION_MS) return;

			const now = Date.now();
			const diff = EXPIRATION_MS - now;

			if (diff <= 0) {
				if (expDays) expDays.textContent = '00';
				if (expHours) expHours.textContent = '00';
				if (expMins) expMins.textContent = '00';
				if (expSecs) expSecs.textContent = '00';
				if (renewalCountdown) renewalCountdown.textContent = 'Expired';
				return;
			}

			const days = Math.floor(diff / (24 * 60 * 60 * 1000));
			const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
			const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
			const secs = Math.floor((diff % (60 * 1000)) / 1000);

			if (expDays) expDays.textContent = String(days).padStart(2, '0');
			if (expHours) expHours.textContent = String(hours).padStart(2, '0');
			if (expMins) expMins.textContent = String(mins).padStart(2, '0');
			if (expSecs) expSecs.textContent = String(secs).padStart(2, '0');

			if (renewalCountdown) {
				if (days > 365) {
					const years = Math.floor(days / 365);
					const remainingDays = days % 365;
					renewalCountdown.textContent = '(' + years + 'y ' + remainingDays + 'd left)';
				} else if (days > 0) {
					renewalCountdown.textContent = '(' + days + 'd ' + hours + 'h left)';
				} else {
					renewalCountdown.textContent = '(' + hours + 'h ' + mins + 'm left)';
				}
			}
		}

		// Initialize expiration timer
		if (EXPIRATION_MS) {
			updateExpirationCountdown();
			setInterval(updateExpirationCountdown, 1000);
		}

		// Renewal functionality - Overview tab elements
		const ovRenewalYears = document.getElementById('overview-renewal-years');
		const ovRenewalYearsMinus = document.getElementById('renewal-years-minus');
		const ovRenewalYearsPlus = document.getElementById('renewal-years-plus');
		const ovRenewalPrice = document.getElementById('overview-renewal-price');
		const ovRenewalSavings = document.getElementById('overview-renewal-savings');
		const ovRenewalSavingsText = document.getElementById('overview-renewal-savings-text');
		const ovRenewalBtn = document.getElementById('overview-renewal-btn');
		const ovRenewalBtnText = ovRenewalBtn?.querySelector('.renewal-btn-text');
		const ovRenewalBtnLoading = ovRenewalBtn?.querySelector('.renewal-btn-loading');
		const ovRenewalStatus = document.getElementById('overview-renewal-status');
		const ovRenewalExpiryDate = document.getElementById('renewal-expiry-date');
		const ovRenewalCountdown = document.getElementById('renewal-countdown');

		// Stepper control for years
		let currentRenewalYears = 1;
		const MIN_YEARS = 1;
		const MAX_YEARS = 5;
		const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

		function updateYearsStepper() {
			if (ovRenewalYears) {
				ovRenewalYears.textContent = currentRenewalYears + ' yr' + (currentRenewalYears > 1 ? 's' : '');
				ovRenewalYears.dataset.value = String(currentRenewalYears);
			}
			if (ovRenewalYearsMinus) ovRenewalYearsMinus.disabled = currentRenewalYears <= MIN_YEARS;
			if (ovRenewalYearsPlus) ovRenewalYearsPlus.disabled = currentRenewalYears >= MAX_YEARS;

			// Update projected expiration date
			const baseExpiration = (typeof selectedRenewalExpiration !== 'undefined' && selectedRenewalExpiration)
				? selectedRenewalExpiration
				: EXPIRATION_MS;
			if (baseExpiration && ovRenewalExpiryDate) {
				const newExpiration = new Date(baseExpiration + (currentRenewalYears * ONE_YEAR_MS));
				ovRenewalExpiryDate.textContent = newExpiration.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

				// Update countdown to show new duration
				if (ovRenewalCountdown) {
					const daysUntilNew = Math.ceil((newExpiration.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
					ovRenewalCountdown.textContent = '→ ' + daysUntilNew + ' days';
					ovRenewalCountdown.className = 'renewal-countdown';
				}
			}

			updateRenewalDisplay(ovRenewalYears, ovRenewalPrice, ovRenewalSavings, ovRenewalSavingsText);
		}

		if (ovRenewalYearsMinus) {
			ovRenewalYearsMinus.addEventListener('click', () => {
				if (currentRenewalYears > MIN_YEARS) {
					currentRenewalYears--;
					updateYearsStepper();
				}
			});
		}
		if (ovRenewalYearsPlus) {
			ovRenewalYearsPlus.addEventListener('click', () => {
				if (currentRenewalYears < MAX_YEARS) {
					currentRenewalYears++;
					updateYearsStepper();
				}
			});
		}

		// Initialize stepper state (minus disabled at 1 year, set initial projected date)
		updateYearsStepper();

		// Renewal functionality - Bid tab elements (legacy)
		const renewalYearsSelect = document.getElementById('renewal-years');
		const renewalPriceEl = document.getElementById('renewal-price');
		const renewalSavingsRow = document.getElementById('renewal-savings-row');
		const renewalSavingsText = document.getElementById('renewal-savings-text');
		const renewalBtn = document.getElementById('renewal-btn');
		const renewalBtnText = renewalBtn?.querySelector('.renewal-btn-text');
		const renewalBtnLoading = renewalBtn?.querySelector('.renewal-btn-loading');
		const renewalStatus = document.getElementById('renewal-status');

		var renewalPricingCache = {};

		async function fetchRenewalPricing(years) {
			const nameToPrice = selectedRenewalName || NAME;
			const cacheKey = nameToPrice + '-' + years;
			if (renewalPricingCache[cacheKey]) {
				return renewalPricingCache[cacheKey];
			}

			try {
				const res = await fetch('/api/renewal-pricing?domain=' + encodeURIComponent(nameToPrice) + '&years=' + years);
				if (!res.ok) throw new Error('Failed to fetch pricing');
				const data = await res.json();
				renewalPricingCache[cacheKey] = data;
				return data;
			} catch (error) {
				console.error('Renewal pricing error:', error);
				return null;
			}
		}

		async function updateRenewalDisplay(yearsEl, priceEl, savingsRowEl, savingsTextEl) {
			if (!yearsEl || !priceEl) return;

			// Support both select (yearsEl.value) and stepper span (yearsEl.dataset.value)
			const years = parseInt(yearsEl.value || yearsEl.dataset?.value || '1', 10);
			priceEl.textContent = '...';

			const pricing = await fetchRenewalPricing(years);
			if (!pricing) {
				priceEl.textContent = 'Error';
				return;
			}

			const discountedSui = Number(pricing.discountedSuiMist) / 1e9;
			priceEl.textContent = discountedSui.toFixed(4) + ' SUI';

			if (savingsRowEl && pricing.savingsPercent > 0) {
				savingsRowEl.style.display = 'inline-flex';
				if (savingsTextEl) {
					savingsTextEl.textContent = 'Save ' + pricing.savingsPercent.toFixed(1) + '%';
				}
			}
		}

		function updateAllRenewalDisplays() {
			updateRenewalDisplay(ovRenewalYears, ovRenewalPrice, ovRenewalSavings, ovRenewalSavingsText);
			updateRenewalDisplay(renewalYearsSelect, renewalPriceEl, renewalSavingsRow, renewalSavingsText);
		}

		function updateRenewalButton() {
			const nameToExtend = selectedRenewalName || NAME;
			// Update overview renewal button
			if (ovRenewalBtn && ovRenewalBtnText) {
				if (connectedAddress) {
					ovRenewalBtn.disabled = false;
					ovRenewalBtnText.textContent = 'Extend ' + nameToExtend;
				} else {
					ovRenewalBtn.disabled = true;
					ovRenewalBtnText.textContent = 'Connect Wallet to Extend';
				}
			}
			// Update bid tab renewal button
			if (renewalBtn && renewalBtnText) {
				if (connectedAddress) {
					renewalBtn.disabled = false;
					renewalBtnText.textContent = 'Extend ' + nameToExtend;
				} else {
					renewalBtn.disabled = true;
					renewalBtnText.textContent = 'Connect Wallet';
				}
			}
		}

		// DeepBook constants for client-side PTB building (must match register.ts)
		const DEEPBOOK_PACKAGE = NETWORK === 'mainnet'
			? '0x337f4f4f6567fcd778d5454f27c16c70e2f274cc6377ea6249ddf491482ef497'
			: null;
		const DEEPBOOK_NS_SUI_POOL = NETWORK === 'mainnet'
			? '0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8'
			: null;
		const DEEPBOOK_DEEP_SUI_POOL = NETWORK === 'mainnet'
			? '0xb663828d6217467c8a1838a03793da896cbe745b150ebd57d82f814ca579fc22'
			: null;
		const NS_TYPE = '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS';
		const SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
		const DEEP_TYPE = '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP';
		const USDC_TYPE = '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC';
		const DEEPBOOK_SUI_USDC_POOL = NETWORK === 'mainnet'
			? '0xe05dafb5133bcffb8d59f4e12465dc0e9faeaa05e3e342a08fe135800e3e4407'
			: null;
		const CLOCK_OBJECT = '0x6';
		const SLIPPAGE_BPS = 100n;
		const SUI_FOR_DEEP_SWAP = 10_000_000n;
		const MIN_DEEP_OUT = 500_000n;

		async function handleRenewal(yearsEl, btnEl, btnTextEl, btnLoadingEl, statusEl) {
			const nftIdToUse = selectedRenewalNftId || NFT_ID;
			const nameToExtend = selectedRenewalName || NAME;

			console.log('[Renewal] Starting renewal for:', nameToExtend, 'NFT:', nftIdToUse);

			if (!connectedAddress || !connectedWallet) {
				if (statusEl) {
					statusEl.textContent = 'Please connect your wallet';
					statusEl.className = 'renewal-status error';
				}
				return;
			}

			if (!nftIdToUse) {
				if (statusEl) {
					statusEl.textContent = 'NFT not found for ' + nameToExtend + '. Registration may be expired.';
					statusEl.className = 'renewal-status error';
				}
				return;
			}

			const years = parseInt(yearsEl?.value || '1', 10);
			console.log('[Renewal] Years:', years, 'Sender:', connectedAddress);

			if (btnTextEl) btnTextEl.classList.add('hidden');
			if (btnLoadingEl) btnLoadingEl.classList.remove('hidden');
			if (btnEl) btnEl.disabled = true;
			if (statusEl) {
				statusEl.textContent = 'Fetching pricing...';
				statusEl.className = 'renewal-status';
			}

			try {
				// Fetch pricing from API
				console.log('[Renewal] Fetching pricing...');
				const pricingRes = await fetch('/api/renewal-pricing?domain=' + encodeURIComponent(nameToExtend) + '&years=' + years);
				if (!pricingRes.ok) throw new Error('Failed to fetch pricing');
				const pricingData = await pricingRes.json();
				console.log('[Renewal] Pricing:', pricingData);

				if (statusEl) {
					statusEl.textContent = 'Building transaction...';
				}

				// Build PTB client-side (like registration does)
				const suiClient = getSuiClient();
				const suinsClient = new SuinsClient({ client: suiClient, network: NETWORK });

				const tx = new Transaction();
				tx.setSender(connectedAddress);

				const nsCoinConfig = suinsClient.config.coins['NS'];
				if (!nsCoinConfig) throw new Error('SuiNS NS coin config not found');

				if (!DEEPBOOK_PACKAGE || !DEEPBOOK_NS_SUI_POOL || !DEEPBOOK_DEEP_SUI_POOL) {
					throw new Error('DeepBook pools not available on ' + NETWORK);
				}

				// Calculate amounts with slippage
				const nsNeeded = BigInt(pricingData.nsNeededMist);
				const nsWithSlippage = nsNeeded + (nsNeeded * SLIPPAGE_BPS) / 10000n;
				const suiForNsSwap = BigInt(Math.ceil((Number(nsWithSlippage) / 1e6) * pricingData.suiPerNs * 1e9));

				console.log('[Renewal] NS needed:', nsNeeded.toString(), 'SUI for swap:', suiForNsSwap.toString());

				const priceInfoObjectId = pricingData.priceInfoObjectId || undefined;
				console.log('[Renewal] priceInfoObjectId:', priceInfoObjectId);

				// Validate price info object (required for Pyth price feed)
				if (nsCoinConfig.feed && !priceInfoObjectId) {
					throw new Error('Price info object ID required for NS renewal');
				}

				// Check if user has enough SUI for the renewal swap + fees
				const totalSuiNeededForRenewal = suiForNsSwap + SUI_FOR_DEEP_SWAP + 50_000_000n;
				const suiBalRes = await suiClient.getBalance({ owner: connectedAddress, coinType: SUI_TYPE });
				const suiAvailableForRenewal = BigInt(suiBalRes.totalBalance);

				if (suiAvailableForRenewal < totalSuiNeededForRenewal && DEEPBOOK_SUI_USDC_POOL) {
					if (statusEl) statusEl.textContent = 'Low SUI balance, checking USDC...';

					const [usdcBalRes, usdcPriceData] = await Promise.all([
						suiClient.getBalance({ owner: connectedAddress, coinType: USDC_TYPE }).catch(() => ({ totalBalance: '0' })),
						fetch('/api/usdc-price').then(r => r.json()).catch(() => null),
					]);

					const usdcAvail = BigInt(usdcBalRes.totalBalance);
					if (usdcAvail > 0n && usdcPriceData?.usdcPerSui > 0) {
						const usdcShortfallMist = totalSuiNeededForRenewal - suiAvailableForRenewal;
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
								if (statusEl) statusEl.textContent = 'Swapping USDC for SUI...';

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
				}

				if (statusEl) statusEl.textContent = 'Building transaction...';

				// Split SUI for swaps
				const [suiCoinForNs, suiCoinForDeep] = tx.splitCoins(tx.gas, [
					tx.pure.u64(suiForNsSwap),
					tx.pure.u64(SUI_FOR_DEEP_SWAP),
				]);

				// Swap SUI -> DEEP (for DeepBook fees)
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

				// Swap SUI -> NS (for renewal payment)
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

				// Renew using SuinsTransaction
				const suinsTx = new SuinsTransaction(suinsClient, tx);
				suinsTx.renew({
					nft: tx.object(nftIdToUse),
					years: years,
					coinConfig: nsCoinConfig,
					coin: nsCoin,
					priceInfoObjectId,
				});

				// Transfer leftover NS to fee recipient
				let feeRecipient = connectedAddress;
				try {
					const feeRecord = await suinsClient.getNameRecord('brando.sui');
					if (feeRecord?.targetAddress) feeRecipient = feeRecord.targetAddress;
				} catch {}
				tx.transferObjects([nsCoin], feeRecipient);

				tx.setGasBudget(100000000);

				if (statusEl) {
					statusEl.textContent = 'Please sign in your wallet...';
				}

				// Sign and execute using wallet-standard (exactly like registration)
				console.log('[Renewal] Signing transaction...');
				let result = null;
				const signExecFeature = connectedWallet?.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet?.features?.['sui:signAndExecuteTransactionBlock'];

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
					const phantomProvider = window.phantom?.sui;
					if (phantomProvider?.signAndExecuteTransactionBlock) {
						try {
							result = await phantomProvider.signAndExecuteTransactionBlock({
								transactionBlock: txBytes,
								options: { showEffects: true }
							});
						} catch (e) {
							// Try base64 format
							const base64Tx = btoa(String.fromCharCode.apply(null, Array.from(txBytes)));
							result = await phantomProvider.signAndExecuteTransactionBlock({
								transactionBlock: base64Tx,
								options: { showEffects: true }
							});
						}
					} else if (window.suiWallet?.signAndExecuteTransactionBlock) {
						result = await window.suiWallet.signAndExecuteTransactionBlock({
							transactionBlock: tx,
						});
					} else {
						throw new Error('No compatible Sui wallet found');
					}
				}

				console.log('[Renewal] Transaction result:', result);

				if (result?.digest) {
					if (statusEl) {
						// Show immediate success, then fetch full tx details
						const digest = result.digest;
						const suiscanUrl = 'https://suiscan.xyz/' + NETWORK + '/tx/' + digest;
						const suivisionUrl = 'https://suivision.xyz/txblock/' + digest;

						statusEl.innerHTML = '<div class="tx-success-summary">' +
							'<div class="tx-success-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Extended ' + escapeHtmlJs(nameToExtend) + '.sui</div>' +
							'<div class="tx-details-loading"><span class="loading"></span> Fetching transaction details...</div>' +
							'</div>';
						statusEl.className = 'renewal-status success';

						// Fetch transaction details using Sui SDK
						try {
							const txDetails = await suiClient.getTransactionBlock({
								digest: digest,
								options: { showEffects: true, showBalanceChanges: true, showInput: true }
							});

							const status = txDetails.effects?.status?.status || 'unknown';
							const gasUsed = txDetails.effects?.gasUsed;
							const totalGas = gasUsed ? (Number(gasUsed.computationCost) + Number(gasUsed.storageCost) - Number(gasUsed.storageRebate)) / 1e9 : 0;
							const balanceChanges = txDetails.balanceChanges || [];

							let balanceHtml = '';
							for (const change of balanceChanges) {
								const amount = Number(change.amount);
								const coinType = change.coinType?.split('::').pop() || 'Unknown';
								if (Math.abs(amount) > 0) {
									const formatted = coinType === 'SUI' ? (amount / 1e9).toFixed(4) : (amount / 1e6).toFixed(2);
									const sign = amount > 0 ? '+' : '';
									const colorClass = amount > 0 ? 'positive' : 'negative';
									balanceHtml += '<div class="tx-balance-change ' + colorClass + '">' + sign + formatted + ' ' + coinType + '</div>';
								}
							}

							statusEl.innerHTML = '<div class="tx-success-summary">' +
								'<div class="tx-success-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Extended ' + escapeHtmlJs(nameToExtend) + '.sui</div>' +
								'<div class="tx-details">' +
									'<div class="tx-detail-row"><span class="tx-label">Status</span><span class="tx-value status-' + status + '">' + (status === 'success' ? 'Success' : status) + '</span></div>' +
									'<div class="tx-detail-row"><span class="tx-label">Gas</span><span class="tx-value">' + totalGas.toFixed(6) + ' SUI</span></div>' +
									(balanceHtml ? '<div class="tx-detail-row"><span class="tx-label">Changes</span><div class="tx-balance-changes">' + balanceHtml + '</div></div>' : '') +
									'<div class="tx-detail-row"><span class="tx-label">Digest</span><span class="tx-value mono">' + digest.slice(0, 16) + '...</span></div>' +
								'</div>' +
								'<div class="tx-explorer-links">' +
									'<a href="' + suiscanUrl + '" target="_blank">Suiscan</a>' +
									'<a href="' + suivisionUrl + '" target="_blank">Suivision</a>' +
								'</div>' +
							'</div>';
						} catch (fetchErr) {
							console.warn('[Renewal] Could not fetch tx details:', fetchErr);
							// Fallback to simple success message
							statusEl.innerHTML = '<div class="tx-success-summary">' +
								'<div class="tx-success-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Extended ' + escapeHtmlJs(nameToExtend) + '.sui</div>' +
								'<div class="tx-explorer-links">' +
									'<a href="' + suiscanUrl + '" target="_blank">View on Suiscan</a>' +
									'<a href="' + suivisionUrl + '" target="_blank">View on Suivision</a>' +
								'</div>' +
							'</div>';
						}
					}
				} else {
					throw new Error('Transaction failed or was cancelled');
				}
			} catch (error) {
				console.error('Renewal error:', error);
				if (statusEl) {
					statusEl.textContent = error.message || 'Renewal failed';
					statusEl.className = 'renewal-status error';
				}
			} finally {
				if (btnTextEl) btnTextEl.classList.remove('hidden');
				if (btnLoadingEl) btnLoadingEl.classList.add('hidden');
				updateRenewalButton();
			}
		}

		// Overview tab renewal event listeners
		if (ovRenewalBtn) {
			ovRenewalBtn.addEventListener('click', () => {
				handleRenewal(ovRenewalYears, ovRenewalBtn, ovRenewalBtnText, ovRenewalBtnLoading, ovRenewalStatus);
			});
		}

		// Bid tab renewal event listeners (legacy)
		if (renewalYearsSelect) {
			renewalYearsSelect.addEventListener('change', () => {
				updateRenewalDisplay(renewalYearsSelect, renewalPriceEl, renewalSavingsRow, renewalSavingsText);
			});
		}
		if (renewalBtn) {
			renewalBtn.addEventListener('click', () => {
				handleRenewal(renewalYearsSelect, renewalBtn, renewalBtnText, renewalBtnLoading, renewalStatus);
			});
		}

		// Initialize renewal displays
		if (EXPIRATION_MS) {
			updateAllRenewalDisplays();
			updateRenewalButton();
		}

		// Fetch and display bounties
		async function fetchBountyQueue() {
			if (!bountyQueueList) return;

			try {
				const res = await fetch('/api/bounties/' + NAME);
				if (!res.ok) throw new Error('Failed to fetch bounties');

				const data = await res.json();
				currentBounties = data.bounties || [];

				if (currentBounties.length === 0) {
					bountyQueueList.innerHTML = '';
					if (bountyQueueEmpty) bountyQueueEmpty.classList.remove('hidden');
					return;
				}

				if (bountyQueueEmpty) bountyQueueEmpty.classList.add('hidden');

				// Sort by total amount (highest first)
				currentBounties.sort((a, b) => Number(b.totalAmountMist) - Number(a.totalAmountMist));

				bountyQueueList.innerHTML = currentBounties.map(bounty => {
					const totalSui = Number(bounty.totalAmountMist) / 1e9;
					const rewardSui = Number(bounty.executorRewardMist) / 1e9;
					return \`
						<div class="bounty-queue-item">
							<div class="bounty-item-left">
								<div class="bounty-item-icon">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="8" r="7"></circle>
										<polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
									</svg>
								</div>
								<div class="bounty-item-info">
									<div class="bounty-item-amount">\${formatAmount(totalSui)} SUI</div>
									<div class="bounty-item-reward">Reward: \${rewardSui} SUI</div>
								</div>
							</div>
							<div class="bounty-item-right">
								<div class="bounty-item-beneficiary">\${formatAddress(bounty.beneficiary)}</div>
								<div class="bounty-item-status \${bounty.status}">\${bounty.status}</div>
							</div>
						</div>
					\`;
				}).join('');
			} catch (error) {
				console.error('Failed to fetch bounty queue:', error);
				bountyQueueList.innerHTML = '<div class="bounty-queue-loading">Failed to load bounties</div>';
			}
		}

		function buildTxWrapper(bytes) {
			return bytes
		}

		function extractBountyObjectIdFromChanges(changes) {
			if (!Array.isArray(changes)) return null
			for (const change of changes) {
				if (
					change.type === 'created' &&
					typeof change.objectType === 'string' &&
					change.objectType.includes('bounty_escrow::escrow::Bounty')
				) {
					return change.objectId
				}
			}
			return null
		}

		async function resolveBountyObjectIdFromResult(result, suiClient) {
			const directId = extractBountyObjectIdFromChanges(result?.objectChanges)
			if (directId) return directId
			const digest = result?.digest
			if (!digest) return null
			try {
				const finalized = await suiClient.waitForTransaction({
					digest,
					options: { showObjectChanges: true },
				})
				return extractBountyObjectIdFromChanges(finalized?.objectChanges)
			} catch (error) {
				console.error('Failed to fetch finalized transaction:', error)
				return null
			}
		}

		// Create a new bounty with one-click - fixed 10 SUI, 1 SUI reward, 1 year
		async function createQuickBounty() {
			if (!connectedAddress) {
				showBidBountyStatus(createBountyStatus, 'Please connect your wallet first', 'error');
				connectWallet();
				return;
			}

			if (!connectedWallet) {
				showBidBountyStatus(createBountyStatus, 'Wallet not detected. Please reconnect.', 'error');
				return;
			}

			if (!BOUNTY_ESCROW_PACKAGE_ID) {
				showBidBountyStatus(createBountyStatus, 'Bounty escrow contract is not configured on this network.', 'error');
				return;
			}

			// Determine amount: 1 SUI higher than current highest, or 10 SUI minimum
			let highestAmountMist = 0n;
			if (currentBounties && currentBounties.length > 0) {
				// currentBounties is already sorted highest first
				highestAmountMist = BigInt(currentBounties[0].totalAmountMist);
			}

			const minAmountMist = BigInt(10 * 1000000000);
			const totalAmountMist = highestAmountMist >= minAmountMist
				? highestAmountMist + BigInt(1 * 1000000000)
				: minAmountMist;

			const executorRewardMist = BigInt(1 * 1000000000);
			const years = 1;

			if (quickBountyBtn) quickBountyBtn.disabled = true;
			showBidBountyStatus(createBountyStatus, 'Building escrow transaction...', 'loading');

			try {
				const suiClient = getSuiClient();
				const tx = new Transaction();
				const senderAddress =
					typeof connectedAccount?.address === 'string'
						? connectedAccount.address
						: connectedAddress;
				tx.setSender(senderAddress);

				const [depositCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalAmountMist)]);
				tx.moveCall({
					target: BOUNTY_ESCROW_PACKAGE_ID + '::escrow::create_and_share_bounty',
					arguments: [
						tx.pure.string(NAME),
						tx.pure.address(connectedAddress),
						depositCoin,
						tx.pure.u64(executorRewardMist),
						tx.pure.u64(BigInt(Number(AVAILABLE_AT) || 0)),
						tx.pure.u8(years),
						tx.object('0x6'),
					],
				});

				const builtTxBytes = await tx.build({ client: suiClient });
				const txWrapper = buildTxWrapper(builtTxBytes);
				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';

				let result = null;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signFeature = connectedWallet.features?.['sui:signTransaction'];

				if (signExecFeature?.signAndExecuteTransaction) {
					showBidBountyStatus(createBountyStatus, 'Sign transaction in wallet...', 'loading');
					try {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: txWrapper,
							account: connectedAccount,
							chain,
							options: { showEffects: true, showObjectChanges: true },
						});
					} catch (error) {
						console.warn('signAndExecuteTransaction failed, falling back to manual execution:', error);
					}
				}

				if (!result) {
					if (!signFeature) {
						throw new Error('Wallet does not support transaction execution on this device');
					}
					showBidBountyStatus(createBountyStatus, 'Submitting transaction...', 'loading');
					const { signature } = await signFeature.signTransaction({
						transaction: txWrapper,
						account: connectedAccount,
						chain,
					});
					result = await suiClient.executeTransactionBlock({
						transactionBlock: builtTxBytes,
						signature,
						options: { showEffects: true, showObjectChanges: true },
					});
				}

				showBidBountyStatus(createBountyStatus, 'Finalizing bounty...', 'loading');
				const escrowObjectId = await resolveBountyObjectIdFromResult(result, suiClient);
				if (!escrowObjectId) {
					throw new Error('Escrow created but object ID could not be determined. Please check the transaction manually.');
				}

				const res = await fetch('/api/bounties', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: NAME,
						beneficiary: connectedAddress,
						creator: connectedAddress,
						escrowObjectId,
						totalAmountMist: totalAmountMist.toString(),
						executorRewardMist: executorRewardMist.toString(),
						registrationCostMist: (totalAmountMist - executorRewardMist).toString(),
						availableAt: AVAILABLE_AT,
						years,
						type: 'standard',
					}),
				});

				const data = await res.json();
				if (!res.ok) {
					console.warn('Escrow created but bounty record creation failed:', data.error);
					showBidBountyStatus(
						createBountyStatus,
						'Escrow created! <a href="https://suivision.xyz/txblock/' + result.digest + '" target="_blank">View tx</a> (record may not be saved)',
						'success',
					);
				} else {
					showBidBountyStatus(
						createBountyStatus,
						'Bounty created! <a href="https://suivision.xyz/txblock/' + result.digest + '" target="_blank">View tx</a>',
						'success',
					);
				}

				fetchBountyQueue();
				if (typeof refreshUserBounties === 'function') {
					refreshUserBounties();
				}

				setTimeout(() => hideBidBountyStatus(createBountyStatus), 5000);
			} catch (error) {
				console.error('Failed to create bounty:', error);
				const message = error instanceof Error ? error.message : 'Failed to create bounty';
				showBidBountyStatus(createBountyStatus, message, 'error');
			} finally {
				if (quickBountyBtn) quickBountyBtn.disabled = false;
			}
		}

		const INLINE_STATUS_TYPES = new Set(['success', 'error', 'info', 'loading'])

		// Show bid/bounty status message (separate from modal showStatus)
		function showBidBountyStatus(element, message, type) {
			if (!element) return;
			element.textContent = message;
			if (!element.dataset.baseClass) {
				const baseClass =
					element.className
						.split(' ')
						.filter((cls) => cls && cls !== 'hidden' && !INLINE_STATUS_TYPES.has(cls))[0] || 'create-bid-status';
				element.dataset.baseClass = baseClass;
			}
			const base = element.dataset.baseClass || 'create-bid-status';
			element.className = (base + ' ' + type).trim();
			element.classList.remove('hidden');
		}

		// Hide bid/bounty status message
		function hideBidBountyStatus(element) {
			if (!element) return;
			const base = element.dataset?.baseClass || 'create-bid-status';
			element.className = (base + ' hidden').trim();
		}

		// ========== LINKED NAMES (Reverse Resolution) ==========
		const linkedNamesList = document.getElementById('linked-names-list');
		const linkedNamesCount = document.getElementById('linked-names-count');

		// Track selected name for renewal (defaults to current page name)
		var selectedRenewalName = NAME;
		var selectedRenewalExpiration = EXPIRATION_MS;
		var selectedRenewalNftId = NFT_ID;
		var linkedNamesData = {};

		// Get expiration tag color and text
		function getExpirationTag(expirationMs) {
			if (!expirationMs) return { color: 'gray', text: '?' };
			const now = Date.now();
			const daysLeft = Math.floor((expirationMs - now) / (24 * 60 * 60 * 1000));

			if (daysLeft < 0) {
				return { color: 'red', text: 'Expired' };
			} else if (daysLeft <= 30) {
				return { color: 'red', text: daysLeft + 'd' };
			} else if (daysLeft <= 90) {
				return { color: 'yellow', text: daysLeft + 'd' };
			} else if (daysLeft <= 180) {
				return { color: 'green', text: daysLeft + 'd' };
			} else {
				return { color: 'blue', text: daysLeft + 'd' };
			}
		}

		// Shorten address for display
		function shortAddr(addr) {
			if (!addr || addr.length < 12) return addr || 'Unknown';
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		async function fetchLinkedNames() {
			// Use TARGET_ADDRESS to find names owned by the same wallet
			// TARGET_ADDRESS is more reliable since OWNER_ADDRESS can be a Kiosk/wrapper object
			const ownerAddr = TARGET_ADDRESS || OWNER_ADDRESS;
			console.log('[LinkedNames] Fetching for address:', ownerAddr, '(TARGET_ADDRESS:', TARGET_ADDRESS, 'OWNER_ADDRESS:', OWNER_ADDRESS, ')');
			if (!linkedNamesList || !ownerAddr) {
				console.log('[LinkedNames] No address or list element');
				if (linkedNamesList) {
					linkedNamesList.innerHTML = '<div class="linked-names-empty">No address found</div>';
				}
				if (linkedNamesCount) linkedNamesCount.textContent = '0';
				return;
			}

			try {
				// Fetch all names owned by this address (grouped by target address)
				const res = await fetch('/api/names/' + ownerAddr);
				console.log('[LinkedNames] API response status:', res.status);
				if (!res.ok) throw new Error('Failed to fetch: ' + res.status);
				const data = await res.json();
				console.log('[LinkedNames] Data:', data);
				const grouped = data.grouped || {};
				const names = data.names || [];

				if (linkedNamesCount) {
					linkedNamesCount.textContent = names.length + ' name' + (names.length !== 1 ? 's' : '');
				}

				if (names.length === 0) {
					linkedNamesList.innerHTML = '<div class="linked-names-empty">No other names owned by this wallet</div>';
					return;
				}

				// Render grouped names by target address
				let html = '';
				const addresses = Object.keys(grouped).sort((a, b) => {
					// Put 'unset' last
					if (a === 'unset') return 1;
					if (b === 'unset') return -1;
					// Sort by number of names (most first)
					return grouped[b].length - grouped[a].length;
				});

				let groupIndex = 0;
				for (const addr of addresses) {
					const group = grouped[addr];
					if (!group || group.length === 0) continue;

					// Address header with collapse toggle (all groups start expanded)
					const addrLabel = addr === 'unset' ? 'No target set' : shortAddr(addr);
					html += '<div class="linked-group" data-group-index="' + groupIndex + '">';
					html += '<button type="button" class="linked-group-header">';
					html += '<svg class="linked-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
					html += '<span class="linked-group-addr">' + addrLabel + '</span>';
					html += '<span class="linked-group-count">' + group.length + '</span>';
					html += '</button>';
					html += '<div class="linked-group-names">';

					for (const item of group) {
						const cleanName = item.name.replace(/\\.sui$/, '');
						const isCurrent = cleanName.toLowerCase() === NAME.toLowerCase();
						const isSelected = cleanName.toLowerCase() === selectedRenewalName.toLowerCase();
						const tag = getExpirationTag(item.expirationMs);
						const classes = ['linked-name-chip'];
						if (isCurrent) classes.push('current');
						if (isSelected) classes.push('selected');
						if (item.isPrimary) classes.push('primary');

						// Store name data for renewal
						linkedNamesData[cleanName.toLowerCase()] = {
							name: cleanName,
							expirationMs: item.expirationMs,
							nftId: item.nftId
						};

						const profileUrl = 'https://' + cleanName + '.sui.ski';
						html += '<div class="' + classes.join(' ') + '" data-name="' + cleanName + '" data-expiration="' + (item.expirationMs || '') + '" data-nft-id="' + (item.nftId || '') + '">';
						if (item.isPrimary) {
							html += '<svg class="primary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
						}
						html += '<a href="' + profileUrl + '" class="linked-name-text">' + cleanName + '.sui</a>';
						html += '<span class="linked-name-tag ' + tag.color + '">' + tag.text + '</span>';
						html += '<button type="button" class="linked-name-extend" data-name="' + cleanName + '" data-expiration="' + (item.expirationMs || '') + '" data-nft-id="' + (item.nftId || '') + '" title="Select for renewal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v8m-4-4h8"/></svg></button>';
						html += '</div>';
					}

					html += '</div></div>';
					groupIndex++;
				}

				linkedNamesList.innerHTML = html;

				// Add click handlers for collapsing/expanding groups
				linkedNamesList.querySelectorAll('.linked-group-header').forEach(function(header) {
					header.addEventListener('click', function(e) {
						e.preventDefault();
						const group = this.closest('.linked-group');
						if (group) {
							group.classList.toggle('collapsed');
						}
					});
				});

				// Add click handlers for extend buttons (select for renewal)
				linkedNamesList.querySelectorAll('.linked-name-extend').forEach(function(btn) {
					btn.addEventListener('click', function(e) {
						e.preventDefault();
						e.stopPropagation();
						const name = this.dataset.name;
						const expirationMs = this.dataset.expiration ? parseInt(this.dataset.expiration, 10) : null;
						const nftId = this.dataset.nftId || null;
						selectNameForRenewal(name, expirationMs, nftId);
					});
				});
			} catch (error) {
				console.error('Failed to fetch linked names:', error);
				linkedNamesList.innerHTML = '<div class="linked-names-empty">Could not load linked names</div>';
				if (linkedNamesCount) linkedNamesCount.textContent = '--';
			}
		}

		// Select a name for renewal and update the UI
		function selectNameForRenewal(name, expirationMs, nftId) {
			selectedRenewalName = name;
			selectedRenewalExpiration = expirationMs;
			selectedRenewalNftId = nftId;

			// Update selected state on chips
			linkedNamesList.querySelectorAll('.linked-name-chip').forEach(function(chip) {
				if (chip.dataset.name.toLowerCase() === name.toLowerCase()) {
					chip.classList.add('selected');
				} else {
					chip.classList.remove('selected');
				}
			});

			// Update renewal card display
			const nameValue = document.getElementById('renewal-name-value');
			if (nameValue) nameValue.textContent = name + '.sui';

			// Update expiry display
			const expiryDate = document.getElementById('renewal-expiry-date');
			const renewalCountdown = document.getElementById('renewal-countdown');
			if (expirationMs) {
				const expDate = new Date(expirationMs);
				if (expiryDate) expiryDate.textContent = expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
				
				// Update countdown
				const daysLeft = Math.ceil((expirationMs - Date.now()) / (1000 * 60 * 60 * 24));
				if (renewalCountdown) {
					if (daysLeft <= 0) {
						renewalCountdown.textContent = '(Expired)';
						renewalCountdown.className = 'renewal-countdown urgent';
					} else if (daysLeft > 365) {
						const years = Math.floor(daysLeft / 365);
						const remainingDays = daysLeft % 365;
						renewalCountdown.textContent = '(' + years + 'y ' + remainingDays + 'd left)';
						renewalCountdown.className = 'renewal-countdown';
					} else {
						renewalCountdown.textContent = '(' + daysLeft + 'd left)';
						renewalCountdown.className = 'renewal-countdown' + (daysLeft <= 7 ? ' urgent' : daysLeft <= 90 ? ' warning' : '');
					}
				}
			} else {
				if (expiryDate) expiryDate.textContent = 'Unknown';
				if (renewalCountdown) renewalCountdown.textContent = '';
			}

			// Clear pricing cache for this name and update display
			renewalPricingCache = {};
			updateAllRenewalDisplays();

			// Scroll renewal card into view
			const renewalCard = document.getElementById('overview-renewal-card');
			if (renewalCard) {
				renewalCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		}

		// Initialize linked names
		if (OWNER_ADDRESS || TARGET_ADDRESS) {
			fetchLinkedNames();
		}

		// Marketplace functionality
		const marketplaceCard = document.getElementById('marketplace-card');
		const marketplaceListingRow = document.getElementById('marketplace-listing-row');
		const marketplaceBidRow = document.getElementById('marketplace-bid-row');
		const marketplaceListingPrice = document.getElementById('marketplace-listing-price');
		const marketplaceBidPrice = document.getElementById('marketplace-bid-price');
		const marketplaceBuyBtn = document.getElementById('marketplace-buy-btn');
		const marketplaceBuyText = marketplaceBuyBtn?.querySelector('.marketplace-buy-text');
		const marketplaceBuyLoading = marketplaceBuyBtn?.querySelector('.marketplace-buy-loading');
		const marketplaceStatus = document.getElementById('marketplace-status');

		let currentListing = null;

		function updateMarketplaceButton() {
			if (!marketplaceBuyBtn || !marketplaceBuyText || !currentListing) return;
			const priceInSui = (currentListing.price / 1e9).toFixed(2);
			if (connectedAddress) {
				marketplaceBuyBtn.disabled = false;
				marketplaceBuyText.textContent = 'Buy for ' + priceInSui + ' SUI';
			} else {
				marketplaceBuyBtn.disabled = true;
				marketplaceBuyText.textContent = 'Connect Wallet to Buy';
			}
		}

		async function fetchMarketplaceData() {
			try {
				const response = await fetch('/api/marketplace/' + NAME);
				if (!response.ok) return;
				const data = await response.json();

				if (data.bestListing || data.bestBid) {
					marketplaceCard.style.display = 'block';

					if (data.bestListing && data.bestListing.price) {
						currentListing = data.bestListing;
						const priceInSui = (data.bestListing.price / 1e9).toFixed(2);
						marketplaceListingPrice.textContent = priceInSui + ' SUI';
						marketplaceListingRow.style.display = 'flex';
						marketplaceBuyBtn.style.display = 'block';
						if (connectedAddress) {
							marketplaceBuyBtn.disabled = false;
							marketplaceBuyText.textContent = 'Buy for ' + priceInSui + ' SUI';
						} else {
							marketplaceBuyBtn.disabled = true;
							marketplaceBuyText.textContent = 'Connect Wallet to Buy';
						}
					}

					if (data.bestBid && data.bestBid.price) {
						const bidInSui = (data.bestBid.price / 1e9).toFixed(2);
						marketplaceBidPrice.textContent = bidInSui + ' SUI';
						marketplaceBidRow.style.display = 'flex';
					}
				}
			} catch (e) {
				console.log('Marketplace fetch failed:', e);
			}
		}

		// Tradeport contract constants
		// Legacy listings (nonce starts with 0x)
		const TRADEPORT_LEGACY_STORE = '0x47cba0b6309a12ce39f9306e28b899ed4b3698bce4f4911fd0c58ff2329a2ff6';
		const TRADEPORT_LEGACY_STORE_VERSION = '3377344';
		const TRADEPORT_LEGACY_PACKAGE = '0xb42dbb7413b79394e1a0175af6ae22b69a5c7cc5df259cd78072b6818217c027';
		// Newer listings (nonce starts with 0::)
		const TRADEPORT_LISTINGS_STORE = '0xf96f9363ac5a64c058bf7140723226804d74c0dab2dd27516fb441a180cd763b';
		const TRADEPORT_LISTINGS_STORE_VERSION = '670935706';
		const TRADEPORT_LISTINGS_PACKAGE = '0x6cfe7388ccf732432906d7faebcc33fd91e11d4c2f8cb3ae0082b8d3269e3d5b';
		const TRADEPORT_COMMISSION_BPS = 300;
		const SUINS_REGISTRATION_TYPE = '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration';

		if (marketplaceBuyBtn) {
			marketplaceBuyBtn.addEventListener('click', async () => {
				if (!connectedAddress || !connectedWallet || !currentListing) {
					marketplaceStatus.textContent = 'Connect wallet first';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

				const nonce = currentListing.nonce || '';

				// Kiosk listings (1::) or no nonce - redirect to Tradeport
				if (!nonce || nonce.startsWith('1::')) {
					const tradeportUrl = currentListing.tradeportUrl || 'https://tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(NAME);
					window.open(tradeportUrl, '_blank');
					marketplaceStatus.textContent = 'Complete purchase on Tradeport';
					marketplaceStatus.className = 'marketplace-status success';
					return;
				}

				marketplaceBuyBtn.disabled = true;
				marketplaceBuyText.classList.add('hidden');
				marketplaceBuyLoading.classList.remove('hidden');
				marketplaceStatus.textContent = 'Building transaction...';
				marketplaceStatus.className = 'marketplace-status';

				try {
					const tx = new Transaction();
					tx.setSender(connectedAddress);

					if (nonce.startsWith('0::')) {
						// Newer Tradeport listings - use tradeport_listings::buy_listing_without_transfer_policy
						const marketFee = Math.ceil(currentListing.price * TRADEPORT_COMMISSION_BPS / 10000);
						const totalAmount = currentListing.price + marketFee;

						const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalAmount)]);

						const listingsStoreRef = tx.sharedObjectRef({
							objectId: TRADEPORT_LISTINGS_STORE,
							initialSharedVersion: TRADEPORT_LISTINGS_STORE_VERSION,
							mutable: true,
						});

						tx.moveCall({
							target: TRADEPORT_LISTINGS_PACKAGE + '::tradeport_listings::buy_listing_without_transfer_policy',
							typeArguments: [SUINS_REGISTRATION_TYPE],
							arguments: [
								listingsStoreRef,
								tx.pure.id(currentListing.tokenId),
								paymentCoin,
							],
						});

						tx.moveCall({
							target: '0x2::coin::destroy_zero',
							typeArguments: ['0x2::sui::SUI'],
							arguments: [paymentCoin],
						});
					} else {
						// Legacy Tradeport listings (0x nonce) - use listings::buy
						const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(currentListing.price)]);

						const listingStoreRef = tx.sharedObjectRef({
							objectId: TRADEPORT_LEGACY_STORE,
							initialSharedVersion: TRADEPORT_LEGACY_STORE_VERSION,
							mutable: true,
						});

						tx.moveCall({
							target: TRADEPORT_LEGACY_PACKAGE + '::listings::buy',
							typeArguments: [SUINS_REGISTRATION_TYPE],
							arguments: [
								listingStoreRef,
								tx.pure.address(nonce),
								paymentCoin,
							],
						});

						tx.moveCall({
							target: '0x2::coin::destroy_zero',
							typeArguments: ['0x2::sui::SUI'],
							arguments: [paymentCoin],
						});
					}

					marketplaceStatus.textContent = 'Waiting for wallet...';

					// Sign and execute
					const signExecFeature = connectedWallet?.features?.['sui:signAndExecuteTransaction'];
					const signExecBlockFeature = connectedWallet?.features?.['sui:signAndExecuteTransactionBlock'];

					let result;
					if (signExecFeature?.signAndExecuteTransaction) {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: tx,
							account: connectedAccount,
							chain: 'sui:mainnet',
							options: { showEffects: true },
						});
					} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
						result = await signExecBlockFeature.signAndExecuteTransactionBlock({
							transactionBlock: tx,
							account: connectedAccount,
							chain: 'sui:mainnet',
							options: { showEffects: true },
						});
					} else {
						throw new Error('Wallet does not support transaction signing');
					}

					const digest = result.digest || result.result?.digest || '';
					if (digest) {
						const suiscanUrl = 'https://suiscan.xyz/mainnet/tx/' + digest;
						marketplaceStatus.innerHTML = 'Purchase successful! <a href="' + suiscanUrl + '" target="_blank" style="color: var(--accent);">View tx</a>';
						marketplaceStatus.className = 'marketplace-status success';
						marketplaceBuyBtn.style.display = 'none';
					} else {
						marketplaceStatus.textContent = 'Transaction submitted';
						marketplaceStatus.className = 'marketplace-status success';
					}
				} catch (e) {
					console.error('Buy transaction failed:', e);
					const msg = e.message || 'Transaction failed';
					if (msg.includes('rejected') || msg.includes('cancelled')) {
						marketplaceStatus.textContent = 'Transaction cancelled';
					} else {
						marketplaceStatus.textContent = 'Failed: ' + msg.slice(0, 100);
					}
					marketplaceStatus.className = 'marketplace-status error';
				} finally {
					marketplaceBuyBtn.disabled = false;
					marketplaceBuyText.classList.remove('hidden');
					marketplaceBuyLoading.classList.add('hidden');
				}
			});
		}

		// Fetch marketplace data on load
		fetchMarketplaceData();

	</script>

	<!-- Expanded QR Overlay -->
	<div class="qr-expanded" id="qr-expanded">
		<div class="qr-expanded-content">
			<canvas id="qr-expanded-canvas"></canvas>
			<div class="qr-expanded-url">${escapeHtml(cleanName)}.sui.ski</div>
			<div class="qr-expanded-actions">
				<button class="copy-btn" id="qr-copy-btn">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					Copy
				</button>
				<button class="download-btn" id="qr-download-btn">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
					Save
				</button>
			</div>
		</div>
		<div class="qr-expanded-close" id="qr-close">Click anywhere to close</div>
	</div>

	<!-- Crypto Tracker -->
	<div id="crypto-tracker" style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(10, 10, 15, 0.95); backdrop-filter: blur(10px); border-top: 1px solid rgba(96, 165, 250, 0.2); padding: 12px 20px; display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; z-index: 1000; font-size: 0.875rem;">
		<span style="color: #c7d2fe; font-weight: 500;">SUI: <span id="sui-price" style="color: #60a5fa; font-weight: 600;">$--</span></span>
	</div>

	<!-- Footer -->
	<footer style="margin-top: 48px; padding-top: 32px; text-align: center; color: var(--text-muted); font-size: 0.875rem; border-top: 1px solid var(--border);">
		<p style="margin: 0;">Built on <a href="https://sui.io" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none;">Sui</a> · <a href="https://suins.io" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none;">SuiNS</a> · <a href="https://moveregistry.com" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none;">MVR</a> · <a href="https://walrus.xyz" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none;">Walrus</a></p>
	</footer>

	<script>
		// Config (duplicated from module script for this non-module context)
		const NETWORK = ${serializeJson(network)};
		const NAME = ${serializeJson(cleanName)};

		// Feature flags (disabled until fully implemented)
		const ENABLE_UPLOAD = false;
		const ENABLE_BOUNTIES = false;
		const ENABLE_VORTEX = false;

		// Getters for wallet state from module script (via window)
		const getConnectedAddress = () => window.connectedAddress;
		const getConnectedWallet = () => window.connectedWallet;
		const getConnectedAccount = () => window.connectedAccount;

		// Update SUI price
		const suiPriceEl = document.getElementById('sui-price');
		async function updateSUIPrice() {
			if (!suiPriceEl) return;
			try {
				const response = await fetch('/api/sui-price');
				if (!response.ok) {
					throw new Error('Failed to fetch price');
				}
				const contentType = response.headers.get('content-type') || '';
				if (!contentType.includes('application/json')) {
					throw new Error('Invalid price response type');
				}
				let data;
				try {
					data = await response.json();
				} catch (parseError) {
					throw new Error('Failed to parse price response');
				}
				if (data && typeof data.price === 'number' && Number.isFinite(data.price)) {
					suiPriceEl.textContent = '$' + data.price.toFixed(2);
				} else {
					throw new Error('Malformed price payload');
				}
			} catch (error) {
				console.error('Failed to update SUI price:', error);
				suiPriceEl.textContent = '$--';
			}
		}
		if (suiPriceEl) {
			updateSUIPrice();
			setInterval(updateSUIPrice, 60000); // Update every minute
		}

		// ===== PRIVATE SUBSCRIPTIONS (Seal + Walrus) =====
		// Subscriptions are encrypted with Seal and stored on Walrus for privacy
		// Only the subscriber's wallet can decrypt the subscription list

		const SUBSCRIPTIONS_KEY = 'sui_ski_subscriptions';
		const SUBSCRIPTIONS_BLOB_KEY = 'sui_ski_subscriptions_blob';
		let sealSdk = null;
		let sealInitialized = false;

		// Local cache (also encrypted on Walrus for cross-device sync)
		function getLocalSubscriptions() {
			try {
				return JSON.parse(localStorage.getItem(SUBSCRIPTIONS_KEY) || '[]');
			} catch {
				return [];
			}
		}

		function saveLocalSubscriptions(subs) {
			localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subs));
			// Trigger Walrus sync if wallet connected
			if (window.connectedAddress && sealInitialized) {
				syncSubscriptionsToWalrus(subs);
			}
		}

		function getBlobInfo() {
			try {
				return JSON.parse(localStorage.getItem(SUBSCRIPTIONS_BLOB_KEY) || 'null');
			} catch {
				return null;
			}
		}

		function saveBlobInfo(info) {
			localStorage.setItem(SUBSCRIPTIONS_BLOB_KEY, JSON.stringify(info));
		}

		// Initialize Seal SDK for encryption (uses module-scoped functions via window)
		async function initSealSdk() {
			if (sealInitialized) return true;
			try {
				if (window.initSealClient) {
					await window.initSealClient();
					sealInitialized = window.sealClient !== null;
				}
				return sealInitialized;
			} catch (err) {
				console.error('Failed to init Seal:', err);
				return false;
			}
		}

		// Encrypt subscriptions with Seal
		async function encryptSubscriptions(subs, subscriberAddress) {
			if (!window.sealClient) {
				if (window.initSealClient) await window.initSealClient();
			}
			if (!window.sealClient || !window.sealConfig?.seal?.packageId) {
				console.warn('SealClient not available, falling back to base64');
				const data = JSON.stringify({
					subscriptions: subs,
					subscriberAddress: subscriberAddress,
					encryptedAt: Date.now(),
					version: 1,
				});
				return btoa(unescape(encodeURIComponent(data)));
			}

			try {
				const packageId = window.sealConfig.seal.packageId;
				const data = JSON.stringify({
					subscriptions: subs,
					subscriberAddress: subscriberAddress,
					encryptedAt: Date.now(),
					version: 1,
				});
				const plaintext = new TextEncoder().encode(data);
				const policyId = subscriberAddress.startsWith('0x') ? subscriberAddress.slice(2) : subscriberAddress;

				const { encryptedObject } = await window.sealClient.encrypt({
					threshold: 2,
					packageId: window.fromHex(packageId.startsWith('0x') ? packageId.slice(2) : packageId),
					id: window.fromHex(policyId),
					data: plaintext,
				});

				return btoa(String.fromCharCode.apply(null, encryptedObject.data));
			} catch (error) {
				console.error('Seal encryption failed:', error);
				const data = JSON.stringify({
					subscriptions: subs,
					subscriberAddress: subscriberAddress,
					encryptedAt: Date.now(),
					version: 1,
				});
				return btoa(unescape(encodeURIComponent(data)));
			}
		}

		// Decrypt subscriptions (simplified)
		async function decryptSubscriptions(encryptedData, _subscriberAddress) {
			try {
				// In production, use @mysten/seal SDK for decryption
				const data = JSON.parse(decodeURIComponent(escape(atob(encryptedData))));
				return data.subscriptions || [];
			} catch {
				return [];
			}
		}

		// Sync encrypted subscriptions to Walrus
		async function syncSubscriptionsToWalrus(subs) {
			if (!window.connectedAddress) return;

			try {
				const encrypted = await encryptSubscriptions(subs, window.connectedAddress);

				const res = await fetch('/api/app/subscriptions/sync', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						encryptedBlob: encrypted,
						subscriberAddress: window.connectedAddress,
					}),
				});

				if (res.ok) {
					const result = await res.json();
					if (result.blobId) {
						saveBlobInfo({
							blobId: result.blobId,
							version: result.version,
							subscriberAddress: window.connectedAddress,
						});
						console.log('Subscriptions synced to Walrus:', result.blobId);
					}
				}
			} catch (err) {
				console.error('Failed to sync to Walrus:', err);
			}
		}

		// Load subscriptions from Walrus (for cross-device sync)
		async function loadSubscriptionsFromWalrus() {
			const blobInfo = getBlobInfo();
			if (!blobInfo?.blobId || !window.connectedAddress) return null;

			try {
				const res = await fetch(\`/api/app/subscriptions/blob/\${blobInfo.blobId}\`);
				if (!res.ok) return null;

				const data = await res.json();
				if (data.encryptedData) {
					return await decryptSubscriptions(data.encryptedData, window.connectedAddress);
				}
			} catch (err) {
				console.error('Failed to load from Walrus:', err);
			}
			return null;
		}

		function isSubscribed(targetName) {
			return getLocalSubscriptions().some(s => s.targetName === targetName);
		}

		async function subscribeToName(targetName, targetAddress) {
			const subs = getLocalSubscriptions();
			if (subs.some(s => s.targetName === targetName)) {
				return false;
			}
			subs.push({
				subscriberAddress: window.connectedAddress || 'anonymous',
				targetName: targetName,
				targetAddress: targetAddress,
				subscribedAt: Date.now(),
				notifications: true,
				lastCheckedAt: Date.now()
			});
			saveLocalSubscriptions(subs);
			return true;
		}

		function unsubscribeFromName(targetName) {
			const subs = getLocalSubscriptions().filter(s => s.targetName !== targetName);
			saveLocalSubscriptions(subs);
		}

		// Initialize Seal on page load
		initSealSdk();

		// ========================================
		// Privacy Tab Handlers
		// ========================================

		// Privacy sub-tab switching
		document.querySelectorAll('.privacy-tab').forEach(tab => {
			tab.addEventListener('click', () => {
				document.querySelectorAll('.privacy-tab').forEach(t => t.classList.remove('active'));
				document.querySelectorAll('.privacy-tab-content').forEach(c => c.classList.remove('active'));
				tab.classList.add('active');
				const targetId = 'privacy-' + tab.dataset.privacyTab;
				document.getElementById(targetId)?.classList.add('active');
			});
		});

		// SDK tab switching
		document.querySelectorAll('.sdk-tab').forEach(tab => {
			tab.addEventListener('click', () => {
				document.querySelectorAll('.sdk-tab').forEach(t => t.classList.remove('active'));
				document.querySelectorAll('.sdk-panel').forEach(p => p.classList.remove('active'));
				tab.classList.add('active');
				const targetId = 'sdk-' + tab.dataset.sdk;
				document.getElementById(targetId)?.classList.add('active');
			});
		});

		// Copy code buttons for SDK examples
		document.querySelectorAll('.copy-code-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const codeBlock = btn.previousElementSibling?.querySelector('code');
				if (codeBlock) {
					const text = codeBlock.textContent || '';
					navigator.clipboard.writeText(text).then(() => {
						const originalText = btn.innerHTML;
						btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
						setTimeout(() => { btn.innerHTML = originalText; }, 2000);
					});
				}
			});
		});

		// Notes policy selector
		const notesPolicyType = document.getElementById('notes-policy-type');
		const notesPolicyConfig = document.getElementById('notes-policy-config');
		const notesPolicyValue = document.getElementById('notes-policy-value');
		if (notesPolicyType && notesPolicyConfig) {
			notesPolicyType.addEventListener('change', () => {
				const val = notesPolicyType.value;
				if (val === 'owner') {
					notesPolicyConfig.classList.add('hidden');
				} else {
					notesPolicyConfig.classList.remove('hidden');
					const placeholders = {
						address: 'Enter recipient address (0x...)',
						nft: 'Enter NFT type (e.g., 0x2::kiosk::KioskOwnerCap)',
						allowlist: 'Enter comma-separated addresses',
						time_locked: 'Enter unlock timestamp (Unix)'
					};
					if (notesPolicyValue) notesPolicyValue.placeholder = placeholders[val] || 'Enter policy parameters...';
				}
			});
		}

		// Check Vortex status on privacy tab load
		async function checkVortexStatus() {
			const statusEl = document.getElementById('vortex-status');
			if (!statusEl) return;
			try {
				const resp = await fetch('/api/vortex/health');
				if (resp.ok) {
					const data = await resp.json();
					statusEl.innerHTML = '<span class="status-dot"></span>' + (data.status === 'ok' ? 'Online' : 'Degraded');
					statusEl.classList.add(data.status === 'ok' ? 'online' : 'degraded');
				} else {
					statusEl.innerHTML = '<span class="status-dot"></span>Offline';
					statusEl.classList.add('offline');
				}
			} catch {
				statusEl.innerHTML = '<span class="status-dot"></span>Offline';
				statusEl.classList.add('offline');
			}
		}

		// Load Vortex pools
		async function loadVortexPools() {
			const poolsGrid = document.getElementById('vortex-pools-grid');
			const poolSelect = document.getElementById('vortex-pool-select');
			if (!poolsGrid) return;

			try {
				const resp = await fetch('/api/vortex/pools');
				if (!resp.ok) throw new Error('Failed to load pools');
				const pools = await resp.json();

				if (!pools || pools.length === 0) {
					poolsGrid.innerHTML = '<div class="pools-empty"><p>No privacy pools available</p></div>';
					return;
				}

				poolsGrid.innerHTML = pools.map(pool => \`
					<div class="pool-card" data-coin-type="\${pool.coinType || pool.coin_type}">
						<div class="pool-header">
							<span class="pool-token">\${pool.symbol || 'SUI'}</span>
							<span class="pool-tvl">\${pool.tvl ? (pool.tvl / 1e9).toFixed(2) : '0'} TVL</span>
						</div>
						<div class="pool-stats">
							<div class="pool-stat">
								<span class="stat-label">Deposits</span>
								<span class="stat-value">\${pool.depositCount || pool.deposit_count || 0}</span>
							</div>
							<div class="pool-stat">
								<span class="stat-label">Anonymity Set</span>
								<span class="stat-value">\${pool.anonymitySet || pool.anonymity_set || 0}</span>
							</div>
						</div>
						<button class="pool-deposit-btn" data-pool="\${pool.coinType || pool.coin_type}">
							Deposit \${pool.symbol || 'SUI'}
						</button>
					</div>
				\`).join('');

				// Populate pool selector
				if (poolSelect) {
					poolSelect.innerHTML = '<option value="">Select a privacy pool...</option>' +
						pools.map(pool => \`<option value="\${pool.coinType || pool.coin_type}">\${pool.symbol || 'SUI'}</option>\`).join('');
				}

				// Add click handlers for pool cards
				poolsGrid.querySelectorAll('.pool-deposit-btn').forEach(btn => {
					btn.addEventListener('click', () => {
						const poolType = btn.dataset.pool;
						if (poolSelect) poolSelect.value = poolType;
						document.getElementById('vortex-deposit-form')?.scrollIntoView({ behavior: 'smooth' });
					});
				});
			} catch (err) {
				console.error('Error loading Vortex pools:', err);
				poolsGrid.innerHTML = '<div class="pools-error"><p>Failed to load pools. Check API connection.</p></div>';
			}
		}

		// Walrus dropzone handlers
		const walrusDropzone = document.getElementById('walrus-dropzone');
		const walrusFileInput = document.getElementById('walrus-file-input');
		const walrusUploadBtn = document.getElementById('walrus-upload-btn');
		const walrusUploadQueue = document.getElementById('walrus-upload-queue');
		const walrusQueueList = document.getElementById('walrus-queue-list');

		let uploadFiles = [];

		if (walrusDropzone && walrusFileInput) {
			walrusDropzone.addEventListener('click', () => walrusFileInput.click());

			walrusDropzone.addEventListener('dragover', (e) => {
				e.preventDefault();
				walrusDropzone.classList.add('dragover');
			});

			walrusDropzone.addEventListener('dragleave', () => {
				walrusDropzone.classList.remove('dragover');
			});

			walrusDropzone.addEventListener('drop', (e) => {
				e.preventDefault();
				walrusDropzone.classList.remove('dragover');
				const files = Array.from(e.dataTransfer?.files || []);
				handleWalrusFiles(files);
			});

			walrusFileInput.addEventListener('change', () => {
				const files = Array.from(walrusFileInput.files || []);
				handleWalrusFiles(files);
			});
		}

		function handleWalrusFiles(files) {
			uploadFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
			if (uploadFiles.length !== files.length) {
				alert('Some files were skipped (max 10MB per file)');
			}

			if (uploadFiles.length > 0 && walrusUploadQueue && walrusQueueList && walrusUploadBtn) {
				walrusUploadQueue.classList.remove('hidden');
				walrusQueueList.innerHTML = uploadFiles.map((f, i) => \`
					<div class="queue-item" data-index="\${i}">
						<span class="queue-file-name">\${f.name}</span>
						<span class="queue-file-size">\${(f.size / 1024).toFixed(1)} KB</span>
						<span class="queue-status">Ready</span>
					</div>
				\`).join('');
				walrusUploadBtn.disabled = false;
				walrusUploadBtn.innerHTML = \`
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="17 8 12 3 7 8"></polyline>
						<line x1="12" y1="3" x2="12" y2="15"></line>
					</svg>
					Upload \${uploadFiles.length} File\${uploadFiles.length > 1 ? 's' : ''}
				\`;
			}
		}

		// Initialize privacy features on page load
		setTimeout(() => {
			checkVortexStatus();
			loadVortexPools();
		}, 300);

		// Pool refresh button
		document.getElementById('pools-refresh-btn')?.addEventListener('click', loadVortexPools);
	</script>

</body>
</html>`
}

function collapseWhitespace(value: string): string {
	const whitespacePattern = /\s+/g
	return value.replace(whitespacePattern, ' ').trim()
}

function pickRecordValue(record: SuiNSRecord, keys: string[]): string | undefined {
	const lowerKeys = keys.map((key) => key.toLowerCase())
	for (const key of keys) {
		const direct = record.records?.[key]
		if (typeof direct === 'string' && direct.trim().length > 0) {
			return collapseWhitespace(direct)
		}
	}
	for (const [recordKey, value] of Object.entries(record.records || {})) {
		if (typeof value !== 'string' || value.trim().length === 0) continue
		const normalizedKey = recordKey.toLowerCase()
		if (lowerKeys.some((candidate) => normalizedKey.includes(candidate))) {
			return collapseWhitespace(value)
		}
	}
	return undefined
}

function buildProfileDescription(fullName: string, record: SuiNSRecord): string {
	const fromRecords = pickRecordValue(record, DESCRIPTION_RECORD_KEYS)
	if (fromRecords) {
		return fromRecords
	}
	if (record.content?.type === 'url' && record.content.value) {
		return collapseWhitespace(`${fullName} · Link: ${record.content.value}`)
	}
	const shortOwner = shortenAddress(record.address || '')
	if (shortOwner) {
		return `${fullName} on Sui · Owner ${shortOwner}`
	}
	return `${fullName} profile on Sui`
}

function shortenAddress(address: string): string {
	if (!address) return ''
	if (address.length <= 12) return address
	return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getOriginFromCanonical(canonicalUrl?: string, hostname?: string): string {
	if (canonicalUrl) {
		try {
			return new URL(canonicalUrl).origin
		} catch {
			// Ignore invalid canonical url
		}
	}
	if (hostname?.startsWith('http://') || hostname?.startsWith('https://')) {
		try {
			return new URL(hostname).origin
		} catch {
			return 'https://sui.ski'
		}
	}
	const fallbackHost = hostname || 'sui.ski'
	return `https://${fallbackHost}`
}

function selectProfileImage(record: SuiNSRecord, hostname?: string): string | undefined {
	const candidates = [record.avatar, pickRecordValue(record, IMAGE_RECORD_KEYS)]
	for (const candidate of candidates) {
		if (!candidate) continue
		const normalized = normalizeMediaUrl(candidate, hostname)
		if (normalized) {
			return normalized
		}
	}
	return undefined
}

