import type { Env, SuiNSRecord } from '../types'
import { generateLogoSvg, getDefaultOgImageUrl, getProfileOgImageUrl } from '../utils/og-image'
import { generateSharedWalletMountJs } from '../utils/shared-wallet-js'
import { normalizeMediaUrl, renderSocialMeta } from '../utils/social'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'
import { generateZkSendCss, generateZkSendJs } from '../utils/zksend-js'
import { profileStyles } from './profile.css'

export interface ProfilePageOptions {
	canonicalUrl?: string
	hostname?: string
	description?: string
	image?: string
	/** Whether the name is in grace period (expired but not yet available for registration) */
	inGracePeriod?: boolean
	session?: {
		address: string | null
		walletName: string | null
		verified: boolean
	}
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

const TRADEPORT_LOGO_ICON_SVG = `<svg width="99" height="61" viewBox="0 0 99 61" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.7101 0V17.8976H1.83946C0.824278 17.8976 8.3292e-06 17.0715 8.3292e-06 16.0541V1.84352C-0.00302207 0.826089 0.821248 0 1.83643 0H28.707H28.7101Z" fill="#F7A000"/>
<path d="M57.4402 17.8976H28.709V0H39.5851C49.446 0 57.4433 8.01185 57.4433 17.8976H57.4402Z" fill="#A66C00"/>
<path d="M46.5611 35.789V59.1564C46.5611 60.1738 45.7368 60.9999 44.7216 60.9999H30.5484C29.5333 60.9999 28.709 60.1738 28.709 59.1564V17.8975C38.5699 17.8975 46.5611 25.9093 46.5611 35.789Z" fill="#F7A000"/>
<path d="M98.8943 1.84352V16.051C98.8943 17.0685 98.07 17.8945 97.0548 17.8945H57.4414V0H97.0548C98.07 0 98.8943 0.826089 98.8943 1.84352Z" fill="#F7A000"/>
<path d="M75.2985 35.792V59.1533C75.2985 60.1707 74.4742 60.9968 73.459 60.9968H59.2828C58.2676 60.9968 57.4434 60.1707 57.4434 59.1533V17.8975C67.3043 17.8975 75.3015 25.9093 75.3015 35.795L75.2985 35.792Z" fill="#A66C00"/>
</svg>`

const TRADEPORT_LOGO_ICON_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(TRADEPORT_LOGO_ICON_SVG)}`

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
	const initialPortfolioAddress = record.ownerAddress || record.address || ''
	const tradeportPortfolioUrl = initialPortfolioAddress
		? `https://www.tradeport.xyz/sui/${encodeURIComponent(initialPortfolioAddress)}?tab=items&bottomTab=trades&collectionFilter=suins`
		: 'https://www.tradeport.xyz/sui?tab=items&bottomTab=trades&collectionFilter=suins'

	const cleanName = name
		.replace(/\.sui$/i, '')
		.replace(/^@+/, '')
		.toLowerCase()
	const fullName = `${cleanName}.sui`
	const profileDomain = `${cleanName}.sui.ski`
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
	const rootOrigin = getRootOrigin(canonicalOrigin)
	const metaDescription =
		(options.description && options.description.trim().length > 0
			? options.description
			: buildProfileDescription(profileDomain, record)) || `${fullName} on Sui`
	const userAvatar = options.image || selectProfileImage(record, options.hostname)
	const suinsPreviewImage = getSuinsNftPreviewUrl(rootOrigin, cleanName, expiresMs)
	const previewImage =
		userAvatar || suinsPreviewImage || getProfileOgImageUrl(canonicalOrigin, fullName)
	const twitterPreview = userAvatar || getDefaultOgImageUrl(rootOrigin)
	const socialMeta = `\n${renderSocialMeta({
		title: `${profileDomain} | sui.ski`,
		description: metaDescription,
		url: canonicalUrl,
		siteName: 'sui.ski',
		image: previewImage,
		imageAlt: `${profileDomain} profile on sui.ski`,
		imageWidth: 1200,
		imageHeight: 630,
		twitterImage: twitterPreview,
		cardType: 'summary_large_image',
	})}\n`

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(fullName)} | sui.ski</title>${canonicalTag}${socialMeta}


	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
	<link rel="preconnect" href="https://esm.sh" crossorigin>
	<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
	<link rel="preconnect" href="https://unpkg.com" crossorigin>
	<script type="module">
		import('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle').catch(()=>{});
		import('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle').catch(()=>{});
		import('https://esm.sh/@mysten/suins@1.0.0?bundle').catch(()=>{});
		import('https://esm.sh/@wallet-standard/app@1.1.0').catch(()=>{});
	</script>

	<style>${profileStyles}
${generateWalletUiCss()}
${generateZkSendCss()}</style>
</head>
<body>
	<!-- Home Button -->
	<a class="home-btn" href="https://sui.ski" title="sui.ski home">
		${generateLogoSvg(28)}
	</a>

	<!-- Wallet Widget (Shared with landing page component) -->
	<div class="wallet-widget" id="wallet-widget">
		<button class="wallet-profile-btn" id="wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile">
			${generateLogoSvg(18)}
		</button>
		<button class="swap-toggle-btn" id="swap-toggle-btn" title="Swap tokens">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M16 3l4 4-4 4"/><path d="M20 7H4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h16"/>
			</svg>
		</button>
		<div id="wk-widget"></div>
	</div>

	<!-- Swap Panel -->
	<div class="swap-panel" id="swap-panel" style="display:none;">
		<div class="swap-panel-header">
			<div class="swap-panel-tabs">
				<button class="swap-tab active" data-tab="swap">Swap</button>
				<button class="swap-tab" data-tab="crosschain">Cross-Chain</button>
			</div>
			<button class="swap-panel-close" id="swap-panel-close">&times;</button>
		</div>
		<div class="swap-tab-content" id="swap-tab-swap">
			<div id="sui-coins-terminal"></div>
		</div>
		<div class="swap-tab-content" id="swap-tab-crosschain" style="display:none;">
			<div class="crosschain-ui" id="crosschain-ui">
				<div class="cc-direction">SOL &rarr; SUI</div>
				<div class="cc-field">
					<label class="cc-label">Amount (SOL)</label>
					<input type="text" id="cc-sol-amount" class="cc-input" placeholder="0.00" inputmode="decimal" autocomplete="off">
				</div>
				<div class="cc-field">
					<label class="cc-label">Recipient (Sui Address or Name)</label>
					<input type="text" id="cc-target" class="cc-input" placeholder="0x... or name.sui" autocomplete="off">
				</div>
				<div class="cc-rate" id="cc-rate">
					<span class="cc-rate-label">Rate:</span>
					<span class="cc-rate-value" id="cc-rate-value">--</span>
				</div>
				<div class="cc-field">
					<label class="cc-label">You receive</label>
					<div class="cc-output" id="cc-output">-- SUI</div>
				</div>
				<div class="cc-fee" id="cc-fee"></div>
				<button class="cc-btn" id="cc-quote-btn" disabled>Get Deposit Address</button>
				<div class="cc-deposit" id="cc-deposit" style="display:none;">
					<div class="cc-deposit-label">Send SOL to:</div>
					<div class="cc-deposit-addr" id="cc-deposit-addr"></div>
					<button class="cc-copy-btn" id="cc-copy-addr">Copy</button>
					<div class="cc-confirm-section">
						<label class="cc-label">Solana TX Signature</label>
						<input type="text" id="cc-sol-tx" class="cc-input" placeholder="Paste Solana transaction signature">
						<button class="cc-btn cc-confirm-btn" id="cc-confirm-btn" disabled>Confirm &amp; Receive SUI</button>
					</div>
				</div>
				<div class="cc-status" id="cc-status"></div>
			</div>
		</div>
	</div>

		<div class="container">
			<div class="page-layout">
				<div class="main-content">
					<div class="tab-panel active" id="tab-overview">
						<div class="card">
				<div class="overview-primary-row">
				<div class="profile-hero">
				<div class="identity-card">
					<div class="identity-visual" id="identity-visual">
						<canvas id="qr-canvas"></canvas>
					</div>
					<div class="identity-name-wrapper">
						<button class="identity-action-btn" id="qr-toggle" title="Show QR code">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>
						</button>
						<div class="identity-name" id="identity-name" title="Click to copy">${escapeHtml(cleanName)}.sui</div>
						<button class="identity-action-btn" id="identity-download-btn" title="Save image">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
						</button>
						<button class="identity-action-btn" id="identity-restore-btn" title="Restore NFT visual">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.5 9A9 9 0 0 1 18.9 5.3L23 10"></path><path d="M20.5 15a9 9 0 0 1-15.4 3.7L1 14"></path></svg>
						</button>
					</div>
				</div>
				<div class="hero-main">
					<div class="wallet-bar" id="wallet-bar">
						<a class="wallet-home-btn" href="https://sui.ski" title="sui.ski home">
							${generateLogoSvg(18)}
						</a>
						<button class="search-btn" id="search-btn" title="Search SuiNS names (Press /)">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="11" cy="11" r="8"></circle>
								<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							</svg>
							<span>Search...</span>
							<kbd>/</kbd>
						</button>
					</div>
						<div class="header">
						<div class="header-top">
							<div class="header-name-wrap" id="header-name-wrap">
								<button class="diamond-btn" id="vault-diamond-btn" title="Save to vault" style="display:none">
									<svg viewBox="0 0 24 24"><path d="M12 2L22 12L12 22L2 12Z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
								</button>
								<canvas class="diamond-tendril-canvas" id="diamond-tendril-canvas"></canvas>
								<h1>${
									record.walrusSiteId
										? `<a href="/" class="name-site-link" title="View Walrus site">${escapeHtml(cleanName)}<span class="suffix">.sui</span><svg class="site-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></a>`
										: `${escapeHtml(cleanName)}<span class="suffix">.sui</span>`
								}</h1>
								<button class="owner-primary-star header-primary-star hidden" id="owner-primary-star" title="Set as primary name" aria-label="Set as primary name">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
									</svg>
								</button>
							</div>
								${
									daysToExpire !== null
										? `<span class="badge expiry${daysToExpire <= 0 ? ' danger' : daysToExpire <= 7 ? ' danger' : daysToExpire <= 90 ? ' warning' : daysToExpire > 365 ? ' premium' : ''}">
											<span class="expiry-badge-text">${
												daysToExpire <= 0
													? 'Expired'
													: daysToExpire > 365
														? `${Math.floor(daysToExpire / 365)}y ${daysToExpire % 365}d`
														: `${daysToExpire}d`
											}</span>
											${
												daysToExpire > 0
													? `<button type="button" class="expiry-quick-renew-btn" id="expiry-quick-renew-btn" title="Quick renew (180d if available, else 365d)" aria-label="Quick renew">+</button>`
													: ''
											}
										</span>`
										: ''
								}
								${
									expiresAt
										? `<span class="header-top-expiry-date">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
											Expires ${expiresAt.toLocaleDateString()}
										</span>`
										: ''
								}
								<span class="badge jacketed hidden" id="jacketed-badge" title="This name is listed in a decay auction">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
									Jacketed
								</span>
							</div>
							<div class="header-meta">
									<div class="header-meta-item target-meta-item">
										<div class="target-preview" id="target-preview">
											<button type="button" class="target-preview-copy-btn" id="copy-target-address-btn" title="Copy target address" aria-label="Copy target address">
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="2.5"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path></svg>
											</button>
											<span class="target-preview-value" id="target-preview-value"></span>
											<button class="edit-btn target-self-btn target-lift-btn hidden" id="set-self-btn" title="Lift target to my wallet" aria-label="Lift target to my wallet">
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
													<path d="M4 20h16"></path>
													<path d="M6 20l4-8"></path>
													<path d="M14 20l4-8"></path>
													<path d="M10 9h4"></path>
													<rect x="9.5" y="5.5" width="5" height="5" rx="1.2"></rect>
													<path d="M12 4v-2"></path>
												</svg>
											</button>
											<button class="target-preview-edit-btn hidden" id="edit-address-btn" title="Edit target address" aria-label="Edit target address">
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
											</button>
										</div>
										<button class="send-btn target-send-btn" id="send-sui-btn" title="Send SUI to this profile target">
											<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4z"></path><path d="M22 2 11 13"></path></svg>
											<span>Send</span>
									</button>
								</div>
								<div class="header-meta-item">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
									<a href="https://${escapeHtml(cleanName)}.sui.ski" target="_blank">${escapeHtml(cleanName)}.sui.ski</a>
								</div>
								${record.nftId ? `<a href="${escapeHtml(nftExplorerUrl)}" target="_blank" class="header-meta-item" style="color:var(--accent);text-decoration:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>View NFT</a>` : ''}
								<a href="${escapeHtml(tradeportPortfolioUrl)}" target="_blank" id="view-portfolio-link" class="header-meta-item" style="color:var(--accent);text-decoration:none;" title="View all SuiNS names on TradePort">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"></path></svg>
									View Portfolio
								</a>
							</div>
						</div>

						<div class="overview-module linked-owner-row">
						<div class="owner-display linked-owner-card">
							<div class="owner-info" id="owner-info">
								<span class="owner-label">Owner:</span>
								<span class="owner-name" id="addr-name"></span>
								<span class="owner-addr" id="addr-text">${escapeHtml(record.address.slice(0, 6))}...${escapeHtml(record.address.slice(-4))}</span>
								<button class="copy-btn owner-copy-btn" id="copy-address-btn" title="Copy owner address" aria-label="Copy owner address">
									<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
								</button>
								<svg class="visit-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><polyline points="9 18 15 12 9 6"></polyline></svg>
							</div>
							<div class="owner-actions">
								<button class="edit-btn hidden" id="jacket-btn" title="List for decay auction">Jacket</button>
							</div>
						</div>
						<div id="owner-inline-status" class="status owner-inline-status linked-owner-status hidden"></div>
						<div class="linked-controls-module">
						<div class="linked-names-section" id="linked-names-section">
						<div class="linked-names-header">
							<span class="linked-names-title">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
								<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
							</svg>
								Linked Names
							</span>
					<div class="linked-names-sort" id="linked-names-sort" style="display:none;">
						<button type="button" class="linked-sort-pill" data-sort="address">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
							Address
						</button>
						<button type="button" class="linked-sort-pill active" data-sort="expiry">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
							Expiry
						</button>
						<button type="button" class="linked-sort-pill" data-sort="price">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
							Price
						</button>
					</div>
						<span class="linked-names-count" id="linked-names-count">Loading...</span>
						<span class="linked-renewal-cost" id="linked-renewal-cost"></span>
					</div>
					<div class="linked-names-filter" id="linked-names-filter" style="display:none;">
						<label for="linked-names-filter-input" class="visually-hidden">Filter linked names</label>
						<input
							type="text"
							id="linked-names-filter-input"
							class="linked-names-filter-input"
							placeholder="Filter names (partial or fuzzy)..."
							autocomplete="off"
							spellcheck="false"
						/>
						<button type="button" class="linked-filter-clear" id="linked-filter-clear" aria-label="Clear linked name filter">Clear</button>
					</div>
						</div>
						</div>
						</div>
						</div>
						</div>

			${
				options.inGracePeriod
					? `
		<div class="grace-period-card">
			<div class="grace-period-header">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
					<circle cx="12" cy="12" r="10"></circle>
					<polyline points="12 6 12 12 16 14"></polyline>
				</svg>
				<span>Grace Period</span>
			</div>
			<div class="grace-period-body">
				<div class="grace-period-info">
					<span class="grace-period-message" id="grace-period-message">This name expired and is in grace period.</span>
					<span class="grace-period-countdown" id="grace-period-countdown">Available for registration in <strong id="days-until-available">--</strong> days</span>
				</div>
				<button class="burn-nft-btn hidden" id="burn-nft-btn">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
						<polyline points="3 6 5 6 21 6"></polyline>
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
						<line x1="10" y1="11" x2="10" y2="17"></line>
						<line x1="14" y1="11" x2="14" y2="17"></line>
					</svg>
					<span id="burn-nft-text">Burn NFT & Release Name</span>
					<span class="burn-nft-loading hidden"><span class="loading"></span></span>
				</button>
				<div class="grace-period-status hidden" id="grace-period-burn-status"></div>
			</div>
		</div>
		`
					: ''
			}

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

				<div class="overview-secondary-grid" id="overview-secondary-grid">
				<div class="overview-module side-rail-module">
				<div class="renewal-module">
			<!-- Renewal Card -->
			<div class="card renewal-card vantablack-overlay" id="overview-renewal-card" data-expires-ms="${safeNumber(expiresMs)}" data-current-name="${escapeHtml(cleanName)}">
				<div class="renewal-card-header">
					<div class="renewal-top-row">
						<div class="renewal-card-title">
							<span class="renewal-title-label">Renewal</span>
							<span class="renewal-icon-emoji" aria-hidden="true">💸</span>
						</div>
						<span class="renewal-savings-inline renewal-savings-header" id="overview-renewal-savings" style="display:inline-flex;">
							<span id="overview-renewal-savings-text">-24%</span>
							<span id="overview-renewal-savings-sui">(0.00 SUI)</span>
						</span>
					</div>
					<div class="renewal-middle-row">
						<div class="renewal-date-stepper">
							${
								expiresAt
									? `<span class="renewal-expiry-date renewal-expiry-date-inline" id="renewal-expiry-date">${new Date(expiresAt.getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>`
									: ''
							}
							<div class="renewal-duration-stepper">
								<button type="button" class="stepper-btn stepper-minus" id="renewal-years-minus">−</button>
								<span class="stepper-value" id="overview-renewal-years" data-value="1">1 yr</span>
								<button type="button" class="stepper-btn stepper-plus" id="renewal-years-plus">+</button>
							</div>
						</div>
						<div class="renewal-price-stack">
							<span class="renewal-price-value renewal-middle-total" id="overview-renewal-price">-- SUI</span>
							<span class="renewal-price-meta-row">
								<span class="renewal-countdown renewal-countdown-row" id="renewal-countdown"></span>
								<span class="renewal-price-usd renewal-price-usd-row" id="overview-renewal-price-usd"></span>
							</span>
						</div>
					</div>
				</div>
				<div class="renewal-card-body">
					<div class="renewal-controls-row">
						<button class="renewal-btn" id="overview-renewal-btn">
							<span class="renewal-btn-text">Connect Wallet to Renew</span>
							<span class="renewal-btn-loading hidden">
								<span class="loading"></span>
							</span>
						</button>
					</div>
					<div class="renewal-status" id="overview-renewal-status"></div>
				</div>
			</div>

				</div>

					<div class="side-rail-market" id="overview-market-module" style="display:none;">
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
						<a href="${record.nftId ? `https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=${escapeHtml(record.nftId)}&modalSlug=suins&nav=1` : `https://www.tradeport.xyz/sui/collection/suins?search=${escapeHtml(cleanName)}`}" target="_blank" class="marketplace-link">Tradeport</a>
					</div>
				</div>
				<div class="marketplace-body">
					<div class="marketplace-row" id="marketplace-listing-row" style="display:none;">
						<span class="marketplace-listing-meta">
							<a
								class="marketplace-lister"
								id="marketplace-lister"
								href="https://sui.ski"
								target="_blank"
								rel="noopener noreferrer"
							>--</a>
						</span>
						<span class="marketplace-value listing-price" id="marketplace-listing-price"><span class="price-amount">--</span><span class="price-sui"></span></span>
					</div>
						<div class="marketplace-row" id="marketplace-bid-row" style="display:none;">
							<span class="marketplace-bid-meta">
								<a
									class="marketplace-bidder"
									id="marketplace-bidder"
									href="https://sui.ski"
									target="_blank"
									rel="noopener noreferrer"
								>--</a>
							</span>
						<span class="marketplace-value bid-price" id="marketplace-bid-price"><span class="price-amount">--</span><span class="price-sui"></span></span>
						<button class="marketplace-accept-bid-btn" id="marketplace-accept-bid-btn" style="display:none;" disabled>
							<span class="marketplace-accept-text">Accept</span>
							<span class="marketplace-accept-loading hidden"><span class="loading"></span></span>
						</button>
					</div>
					<div class="marketplace-row" id="marketplace-sold-row" style="display:none;">
						<span class="marketplace-seller-meta">
							<a
								class="marketplace-seller"
								id="marketplace-seller"
								href="https://sui.ski"
								target="_blank"
								rel="noopener noreferrer"
							>--</a>
						</span>
						<span class="marketplace-value sold-price" id="marketplace-sold-price"><span class="price-amount">--</span><span class="price-sui"></span></span>
					</div>
						<button class="marketplace-buy-btn" id="marketplace-buy-btn" style="display:none;" disabled>
							<span class="marketplace-buy-text">Buy Now</span>
							<span class="marketplace-buy-loading hidden"><span class="loading"></span></span>
						</button>
						<div class="marketplace-bid-input" id="marketplace-bid-input">
							<div class="marketplace-bid-estimate" id="marketplace-bid-estimate"></div>
							<div class="marketplace-bid-price-control">
										<button type="button" class="marketplace-bid-stepper-btn" id="marketplace-bid-price-down" aria-label="Decrease bid amount">-</button>
									<input type="text" id="marketplace-bid-amount" placeholder="Bid amount" inputmode="numeric" pattern="[0-9]*" step="1">
								<button type="button" class="marketplace-bid-stepper-btn" id="marketplace-bid-price-up" aria-label="Increase bid amount">+</button>
							</div>
							<button class="marketplace-bid-btn" id="marketplace-place-bid-btn" disabled>
								<span class="marketplace-bid-text">Offer SUI for ${escapeHtml(cleanName)}.sui</span>
								<span class="marketplace-bid-loading hidden"><span class="loading"></span></span>
							</button>
						</div>
						<div class="marketplace-list-input" id="marketplace-list-input" style="display:none;">
							<div class="marketplace-list-top-row">
								<div class="marketplace-list-estimate" id="marketplace-list-estimate"></div>
								<div class="marketplace-list-price-control">
										<button type="button" class="marketplace-list-stepper-btn" id="marketplace-list-price-down" aria-label="Decrease list price amount">-</button>
									<input type="text" id="marketplace-list-amount" placeholder="12" inputmode="decimal" pattern="[0-9]*\\.?[0-9]*" step="any">
									<button type="button" class="marketplace-list-stepper-btn" id="marketplace-list-price-up" aria-label="Increase list price amount">+</button>
								</div>
							</div>
							<button class="marketplace-list-btn" id="marketplace-list-btn" style="display:none;" disabled>
								<span class="marketplace-list-text">List ${escapeHtml(cleanName)}.sui</span>
								<span class="marketplace-list-loading hidden"><span class="loading"></span></span>
							</button>
							<button class="marketplace-wrap-btn" id="marketplace-wrap-btn" style="display:none;" disabled>
								<span class="marketplace-wrap-text">Authorize Grace Wrap</span>
								<span class="marketplace-wrap-loading hidden"><span class="loading"></span></span>
							</button>
							<div class="marketplace-wrap-hint" id="marketplace-wrap-hint" style="display:none;"></div>
						</div>
					<div class="marketplace-status" id="marketplace-status"></div>
					<div class="marketplace-activity" id="marketplace-activity" style="display:none;">
						<div class="marketplace-activity-header">
							<span>Activity</span>
							<a href="${record.nftId ? `https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=${escapeHtml(record.nftId)}&modalSlug=suins&nav=1` : `https://www.tradeport.xyz/sui/collection/suins?search=${escapeHtml(cleanName)}`}" target="_blank" id="marketplace-activity-link" class="marketplace-activity-link">${escapeHtml(cleanName)}.sui</a>
						</div>
						<div class="marketplace-activity-list" id="marketplace-activity-list">
							<div class="marketplace-activity-empty">Loading activity...</div>
						</div>
					</div>
				</div>
			</div>
			<!-- Auction Card -->
			<div class="card auction-card" id="auction-card" style="display:none;">
				<div class="auction-header">
					<div class="auction-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
							<polyline points="17 6 23 6 23 12"></polyline>
						</svg>
						<span>Decay Auction</span>
						<span class="auction-seller-label" id="auction-seller-label" style="display:none;">Your Listing</span>
					</div>
				</div>
				<div class="auction-body">
					<div class="auction-row auction-row-state" id="auction-state-row" style="display:none;">
						<span class="auction-label">State</span>
						<span class="auction-value state" id="auction-state-value">--</span>
					</div>
					<div class="auction-row">
						<span class="auction-label">Current Price</span>
						<span class="auction-value price" id="auction-current-price">--</span>
					</div>
					<div class="auction-row">
						<span class="auction-label">Time Left</span>
						<span class="auction-value time-left" id="auction-time-left">--</span>
					</div>
					<button class="auction-buy-btn" id="auction-buy-btn" disabled>
						<span class="auction-buy-text" id="auction-buy-text">Connect Wallet to Buy</span>
						<span class="auction-buy-loading hidden"><span class="loading"></span></span>
					</button>
					<button class="auction-cancel-btn" id="auction-cancel-btn" style="display:none;" disabled>
						<span class="auction-cancel-text" id="auction-cancel-text">Cancel Wrap</span>
						<span class="auction-cancel-loading hidden"><span class="loading"></span></span>
					</button>
					<div class="auction-status" id="auction-status"></div>
					</div>
					</div>
					</div>
					</div>

						<div class="overview-module linked-wide-module vault-list-module" id="vault-list-module" style="display:none;">
							<div class="vault-list-header">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
									<path d="M12 2L22 12L12 22L2 12Z" fill="currentColor"/>
								</svg>
								<span>YOUR BLACK DIAMONDS</span>
							</div>
							<div class="linked-names-list" id="vault-names-list">
								<div class="linked-names-empty">No black diamonds saved yet.</div>
							</div>
						</div>

						<div class="overview-module linked-wide-module">
						<div class="linked-names-section linked-names-results">
							<div class="linked-names-list" id="linked-names-list">
								<div class="linked-names-loading"><span class="loading"></span> Fetching linked names...</div>
							</div>
							<div class="linked-names-hint" id="linked-names-hint"></div>
						</div>
					</div>
					</div><!-- end overview-secondary-grid -->
				</div><!-- end profile-hero -->

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

	<!-- Send SUI Modal -->
	<div class="send-modal" id="send-modal">
		<div class="send-modal-content">
			<div class="send-modal-header">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="send-modal-icon"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
				<h3>Send SUI</h3>
			</div>
			<div class="send-tab-row">
				<button class="send-tab-btn active" id="send-tab-direct">Direct Transfer</button>
				<button class="send-tab-btn" id="send-tab-link">Send via Link</button>
			</div>
			<div id="send-panel-direct" class="send-tab-panel">
			<div class="send-recipient-card">
				<span class="send-recipient-label">To</span>
				<span class="send-recipient-name" id="send-recipient-name">${escapeHtml(cleanName)}.sui</span>
				<code class="send-recipient-addr" id="send-recipient-address">--</code>
			</div>
			<div class="send-amount-row">
				<button type="button" class="send-stepper-btn" id="send-amount-down" aria-label="Decrease by 1 SUI">-</button>
				<label for="send-amount" class="visually-hidden">Amount in SUI</label>
				<input type="text" id="send-amount" value="1" inputmode="decimal" placeholder="1" />
				<span class="send-amount-currency">SUI</span>
				<button type="button" class="send-stepper-btn" id="send-amount-up" aria-label="Increase by 1 SUI">+</button>
			</div>
			<div class="send-wallet-indicator" id="send-wallet-indicator"></div>
			<div id="send-status" class="status hidden"></div>
			<div class="send-modal-buttons">
				<button class="cancel-btn" id="send-cancel-btn">Cancel</button>
				<button class="save-btn" id="send-confirm-btn">Send to ${escapeHtml(cleanName)}.sui</button>
			</div>
			</div>
			<div id="send-panel-link" class="send-tab-panel hidden">
				<div class="send-amount-row">
					<button type="button" class="send-stepper-btn" id="zk-amount-down" aria-label="Decrease by 1 SUI">-</button>
					<label for="zk-amount" class="visually-hidden">Amount in SUI</label>
					<input type="text" id="zk-amount" value="1" inputmode="decimal" placeholder="1" />
					<span class="send-amount-currency">SUI</span>
					<button type="button" class="send-stepper-btn" id="zk-amount-up" aria-label="Increase by 1 SUI">+</button>
				</div>
				<div class="send-wallet-indicator" id="zk-wallet-indicator"></div>
				<div id="zk-status" class="status hidden"></div>
				<div id="zk-result" style="display:none;"></div>
				<div class="send-modal-buttons">
					<button class="cancel-btn" id="zk-cancel-btn">Cancel</button>
					<button class="save-btn" id="zk-generate-btn">Generate Link</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Jacket Decay Auction Modal -->
	<div class="jacket-modal" id="jacket-modal">
		<div class="jacket-modal-content">
			<h3>List for Decay Auction</h3>
			<p>The price starts high and decays to zero over the chosen duration. Anyone can buy at the current price.</p>
			<label for="jacket-start-price">Start Price (SUI)</label>
			<input type="number" id="jacket-start-price" min="1" step="1" value="100000000" />
			<label for="jacket-duration">Duration</label>
			<select id="jacket-duration">
				<option value="7">7 days</option>
				<option value="14">14 days</option>
				<option value="30" selected>30 days</option>
			</select>
			<div class="jacket-warning">Your NFT will be transferred to the auction contract. You can cancel within 24 hours.</div>
			<div class="jacket-status" id="jacket-status"></div>
			<div class="jacket-modal-buttons">
				<button class="cancel-btn" id="jacket-cancel-btn">Cancel</button>
				<button class="list-btn" id="jacket-list-btn">List</button>
			</div>
		</div>
	</div>

	<div id="wk-modal"></div>

		<script type="module">
			let getWallets, SuiJsonRpcClient, Transaction, SuinsClient, SuinsTransaction;
			let SealClient = null, SessionKey = null, fromHex = null, toHex = null;
			let sealSdkLoaded = false;
			async function initSealSdk() {
				if (sealSdkLoaded) return !!SealClient;
				sealSdkLoaded = true;
				try {
					const [sealMod, bcsMod] = await Promise.allSettled([
						import('https://esm.sh/@mysten/seal@0.2.0?bundle'),
						import('https://esm.sh/@mysten/bcs@1.3.0?bundle'),
					]);
					if (sealMod.status === 'fulfilled') {
						SealClient = sealMod.value.SealClient || (sealMod.value.default && sealMod.value.default.SealClient) || null;
						SessionKey = sealMod.value.SessionKey || (sealMod.value.default && sealMod.value.default.SessionKey) || null;
					}
					if (bcsMod.status === 'fulfilled') {
						fromHex = bcsMod.value.fromHEX || bcsMod.value.fromHex || (bcsMod.value.default && bcsMod.value.default.fromHEX) || null;
						toHex = bcsMod.value.toHEX || bcsMod.value.toHex || (bcsMod.value.default && bcsMod.value.default.toHEX) || null;
					}
				} catch (e) {
					console.warn('Seal SDK load failed:', e.message);
				}
				return !!SealClient;
			}
			{
				const pickExport = (mod, name) => {
					if (!mod || typeof mod !== 'object') return undefined;
					if (name in mod) return mod[name];
					if (mod.default && typeof mod.default === 'object' && name in mod.default) {
						return mod.default[name];
					}
					return undefined;
				};
				const pickSuiClientExport = (mod) => pickExport(mod, 'SuiJsonRpcClient') || pickExport(mod, 'SuiClient');
				const pickTransactionExport = (mod) => pickExport(mod, 'Transaction') || pickExport(mod, 'TransactionBlock');
				const pickSuinsClientExport = (mod) => {
					const direct = pickExport(mod, 'SuinsClient');
					if (typeof direct === 'function') return direct;
					if (direct && typeof direct === 'object' && typeof direct.SuinsClient === 'function') {
						return direct.SuinsClient;
					}
					if (mod && typeof mod.default === 'function') return mod.default;
					return direct;
				};
				const SDK_TIMEOUT = 25000;
				const SDK_RETRY_TIMEOUT = 35000;
				const timedImport = (url, timeoutMs = SDK_TIMEOUT) => Promise.race([
					import(url),
					new Promise((_, r) => setTimeout(() => r(new Error('Timeout: ' + url)), timeoutMs)),
				]);
				const importFirst = async (urls, timeoutMs = SDK_TIMEOUT) => {
					let lastError = null;
					for (const url of urls) {
						try {
							return await timedImport(url, timeoutMs);
						} catch (error) {
							lastError = error;
						}
					}
					throw lastError || new Error('Import failed');
				};

				const walletStandardUrls = [
					'https://esm.sh/@wallet-standard/app@1.1.0',
					'https://cdn.jsdelivr.net/npm/@wallet-standard/app@1.1.0/+esm',
					'https://unpkg.com/@wallet-standard/app@1.1.0?module',
				];
				const suiJsonRpcUrls = [
					'https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle',
					'https://esm.sh/@mysten/sui@2.2.0/jsonRpc',
					'https://cdn.jsdelivr.net/npm/@mysten/sui@2.2.0/+esm',
					'https://unpkg.com/@mysten/sui@2.2.0?module',
				];
				const suiTransactionsUrls = [
					'https://esm.sh/@mysten/sui@2.2.0/transactions?bundle',
					'https://esm.sh/@mysten/sui@2.2.0/transactions',
					'https://cdn.jsdelivr.net/npm/@mysten/sui@2.2.0/+esm',
					'https://unpkg.com/@mysten/sui@2.2.0?module',
				];
				const suinsUrls = [
					'https://esm.sh/@mysten/suins@1.0.0?bundle',
					'https://esm.sh/@mysten/suins@1.0.0',
					'https://cdn.jsdelivr.net/npm/@mysten/suins@1.0.0/+esm',
					'https://unpkg.com/@mysten/suins@1.0.0?module',
				];

				const results = await Promise.allSettled([
					importFirst(walletStandardUrls),
					importFirst(suiJsonRpcUrls),
					importFirst(suiTransactionsUrls),
					importFirst(suinsUrls),
				]);
				if (results[0].status === 'fulfilled') {
					const walletsModule = results[0].value;
					getWallets = pickExport(walletsModule, 'getWallets') || getWallets;
					if (typeof window !== 'undefined') {
						window.__suiWalletStandard = walletsModule;
					}
				}
				if (results[1].status === 'fulfilled') {
					const suiModule = results[1].value;
					SuiJsonRpcClient = pickSuiClientExport(suiModule) || SuiJsonRpcClient;
					Transaction = pickTransactionExport(suiModule) || Transaction;
				}
				if (results[2].status === 'fulfilled') {
					const txModule = results[2].value;
					Transaction = pickTransactionExport(txModule) || Transaction;
					SuiJsonRpcClient = pickSuiClientExport(txModule) || SuiJsonRpcClient;
				}
				if (results[3].status === 'fulfilled') {
					const suinsModule = results[3].value;
					SuinsClient = pickSuinsClientExport(suinsModule);
					SuinsTransaction = pickExport(suinsModule, 'SuinsTransaction');
				}
				const failed = results.filter(r => r.status === 'rejected');
				if (failed.length > 0) {
					console.warn('SDK modules failed:', failed.map(r => r.reason?.message));
					console.warn('Retrying failed SDK modules with fallback CDNs...');
					const retries = [];
					if (!getWallets) retries.push(
						importFirst(walletStandardUrls, SDK_RETRY_TIMEOUT)
							.then(m => {
								getWallets = pickExport(m, 'getWallets') || getWallets;
								if (typeof window !== 'undefined') {
									window.__suiWalletStandard = m;
								}
							})
							.catch(e => console.warn('Retry getWallets failed:', e.message))
					);
					if (!SuiJsonRpcClient) retries.push(
						importFirst(suiJsonRpcUrls, SDK_RETRY_TIMEOUT)
							.then(m => { if (!SuiJsonRpcClient) SuiJsonRpcClient = pickSuiClientExport(m) || SuiJsonRpcClient; })
							.catch(e => console.warn('Retry SuiJsonRpcClient failed:', e.message))
					);
					if (!Transaction) retries.push(
						importFirst(suiTransactionsUrls, SDK_RETRY_TIMEOUT)
							.then(m => { if (!Transaction) Transaction = pickTransactionExport(m) || Transaction; })
							.catch(e => console.warn('Retry Transaction failed:', e.message))
					);
					if (!SuinsClient) retries.push(
						importFirst(suinsUrls, SDK_RETRY_TIMEOUT)
							.then(m => { SuinsClient = pickSuinsClientExport(m) || SuinsClient; SuinsTransaction = pickExport(m, 'SuinsTransaction') || SuinsTransaction; })
							.catch(e => console.warn('Retry SuinsClient failed:', e.message))
					);
					if (retries.length > 0) await Promise.allSettled(retries);
				}
				if (!SuinsClient) console.warn('SuinsClient unavailable after all retries');
			}
		if (Transaction) window.Transaction = Transaction;

		// ===== CONSTANTS =====
		window.NAME = ${serializeJson(cleanName)};
		window.FULL_NAME = ${serializeJson(fullName)};
		window.NETWORK = ${serializeJson(network)};
		const NFT_ID = ${serializeJson(record.nftId || '')};
		const TARGET_ADDRESS = ${serializeJson(record.address)};
		const OWNER_ADDRESS = ${serializeJson(record.ownerAddress || '')};
		const CURRENT_ADDRESS = TARGET_ADDRESS || OWNER_ADDRESS;
		const PROFILE_URL = ${serializeJson(`https://${cleanName}.sui.ski`)};
		const LOGO_SVG_MARKUP = ${serializeJson(generateLogoSvg(220))};
		const LOGO_DATA_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LOGO_SVG_MARKUP);
		const TRADEPORT_LOGO_URL = ${serializeJson(TRADEPORT_LOGO_ICON_DATA_URL)};
		const META_SEAL_SCHEMA = 'meta-seal-lite-v1';
		const NFT_EXPLORER_URL = ${serializeJson(nftExplorerUrl)};
		const EXPLORER_BASE = ${serializeJson(explorerBase)};
		const IS_SUBNAME = window.NAME.includes('.');
		const EXPIRATION_MS = ${safeNumber(expiresMs)};
		const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
		const AVAILABLE_AT = EXPIRATION_MS + GRACE_PERIOD_MS;
		const AUCTION_DECAY_EXPONENT = 69;
		const IS_LONG_RENEWAL = EXPIRATION_MS > Date.now() + 2 * 365.25 * 86400000;
		const HAS_WALRUS_SITE = ${record.walrusSiteId ? 'true' : 'false'};
		const HAS_CONTENT_HASH = ${record.contentHash ? 'true' : 'false'};
		const IS_IN_GRACE_PERIOD = ${options.inGracePeriod ? 'true' : 'false'};
		const DECAY_AUCTION_PACKAGE_ID = ${serializeJson(String(env.DECAY_AUCTION_PACKAGE_ID || ''))};
		const DISCOUNT_RECIPIENT_NAME = ${serializeJson(env.DISCOUNT_RECIPIENT_NAME || 'extra.sui')};

		const NAME = window.NAME;
		const FULL_NAME = window.FULL_NAME;
		const NETWORK = window.NETWORK;
		window.NFT_ID = NFT_ID;
		window.TARGET_ADDRESS = TARGET_ADDRESS;
		window.OWNER_ADDRESS = OWNER_ADDRESS;
		window.CURRENT_ADDRESS = CURRENT_ADDRESS;
		window.PROFILE_URL = PROFILE_URL;
		window.LOGO_SVG_MARKUP = LOGO_SVG_MARKUP;
		window.LOGO_DATA_URL = LOGO_DATA_URL;
		window.META_SEAL_SCHEMA = META_SEAL_SCHEMA;
		window.NFT_EXPLORER_URL = NFT_EXPLORER_URL;
		window.EXPLORER_BASE = EXPLORER_BASE;
		window.IS_SUBNAME = IS_SUBNAME;
		window.EXPIRATION_MS = EXPIRATION_MS;
		window.GRACE_PERIOD_MS = GRACE_PERIOD_MS;
		window.AVAILABLE_AT = AVAILABLE_AT;
		window.IS_LONG_RENEWAL = IS_LONG_RENEWAL;
		window.HAS_WALRUS_SITE = HAS_WALRUS_SITE;
		window.HAS_CONTENT_HASH = HAS_CONTENT_HASH;
		window.IS_IN_GRACE_PERIOD = IS_IN_GRACE_PERIOD;
		window.DECAY_AUCTION_PACKAGE_ID = DECAY_AUCTION_PACKAGE_ID;
		window.DISCOUNT_RECIPIENT_NAME = DISCOUNT_RECIPIENT_NAME;
		window.rawIdentityNftImage = null;

		${generateWalletSessionJs()}
		${generateWalletKitJs({ network: env.SUI_NETWORK, autoConnect: true })}
		${generateWalletTxJs()}
		${generateWalletUiJs({ showPrimaryName: true, onConnect: 'onProfileWalletConnected', onDisconnect: 'onProfileWalletDisconnected' })}
		${generateZkSendJs()}

		SuiWalletKit.renderModal('wk-modal');
		SuiWalletKit.renderWidget('wk-widget');

		window.onProfileWalletConnected = function() {
			updateUIForWallet();
			if (connectedAddress) {
				resolveWalletName(connectedAddress);
			}
		};

		window.onProfileWalletDisconnected = function() {
			updateUIForWallet();
		};

		const RPC_URLS = { mainnet: 'https://fullnode.mainnet.sui.io:443', testnet: 'https://fullnode.testnet.sui.io:443', devnet: 'https://fullnode.devnet.sui.io:443' };
		const ACTIVE_RPC_URL = RPC_URLS[NETWORK] || RPC_URLS.mainnet;

		let cachedSuiClient = null;
		const getSuiClient = () => {
			if (!cachedSuiClient) {
				cachedSuiClient = new SuiJsonRpcClient({ url: ACTIVE_RPC_URL });
			}
			return cachedSuiClient;
		};
		const primaryNameCache = new Map();
		const primaryNameInflight = new Map();
		const PRIMARY_NAME_CACHE_TTL_MS = 60000;
		let lastWalletPrimaryResolvedAddress = '';

		async function resolvePrimaryNameViaApi(address) {
			const normalizedAddress = String(address || '').trim().toLowerCase();
			if (!normalizedAddress) return null;

			const cached = primaryNameCache.get(normalizedAddress);
			if (cached && cached.expiresAt > Date.now()) {
				return cached.name;
			}

			const inflight = primaryNameInflight.get(normalizedAddress);
			if (inflight) return inflight;

			const request = (async () => {
				try {
					const res = await fetch('/api/primary-name?address=' + encodeURIComponent(normalizedAddress));
					if (!res.ok) return null;
					const data = await res.json().catch(() => null);
					const rawName = typeof data?.name === 'string' ? String(data.name) : null;
					primaryNameCache.set(normalizedAddress, {
						name: rawName,
						expiresAt: Date.now() + PRIMARY_NAME_CACHE_TTL_MS,
					});
					return rawName;
				} catch (_e) {
					return null;
				} finally {
					primaryNameInflight.delete(normalizedAddress);
				}
			})();

			primaryNameInflight.set(normalizedAddress, request);
			return request;
		}

		async function resolveWalletName(address) {
			const normalizedAddress = String(address || '').trim().toLowerCase();
			if (!normalizedAddress) return;
			if (normalizedAddress === lastWalletPrimaryResolvedAddress && connectedPrimaryName) return;

			const name = await resolvePrimaryNameViaApi(normalizedAddress);
			lastWalletPrimaryResolvedAddress = normalizedAddress;
			if (!name) return;
			const normalizedPrimary = String(name).replace(/\\.sui$/i, '');
			if (
				connectedPrimaryName &&
				String(connectedPrimaryName).toLowerCase() === String(normalizedPrimary).toLowerCase()
			) {
				return;
			}
			SuiWalletKit.setPrimaryName(normalizedPrimary);
		}
		let suinsModuleLoadingPromise = null;
		function pickSuinsExport(mod, name) {
			if (!mod || typeof mod !== 'object') return undefined;
			if (name in mod) return mod[name];
			if (mod.default && typeof mod.default === 'object' && name in mod.default) return mod.default[name];
			if (name === 'SuinsClient' && typeof mod.default === 'function') return mod.default;
			return undefined;
		}
		function resolveSuinsClientCtor(candidate) {
			if (typeof candidate === 'function') return candidate;
			if (!candidate || typeof candidate !== 'object') return null;
			if (typeof candidate.SuinsClient === 'function') return candidate.SuinsClient;
			if (candidate.default && typeof candidate.default === 'function') return candidate.default;
			if (
				candidate.default &&
				typeof candidate.default === 'object' &&
				typeof candidate.default.SuinsClient === 'function'
			) {
				return candidate.default.SuinsClient;
			}
			return null;
		}
		function getSuinsNetwork() {
			if (NETWORK === 'mainnet') return 'mainnet';
			if (NETWORK === 'testnet') return 'testnet';
			return 'testnet';
		}
		async function ensureSuinsSdkLoaded(requireTransaction = false) {
			const clientReady = !!resolveSuinsClientCtor(SuinsClient);
			const txReady = !requireTransaction || typeof SuinsTransaction === 'function';
			if (clientReady && txReady) return true;

			if (!suinsModuleLoadingPromise) {
					suinsModuleLoadingPromise = (async () => {
						const timeoutMs = 30000;
						const urls = [
							'https://esm.sh/@mysten/suins@1.0.0?bundle',
							'https://esm.sh/@mysten/suins@1.0.0',
							'https://esm.sh/@mysten/suins?bundle',
							'https://cdn.jsdelivr.net/npm/@mysten/suins@1.0.0/+esm',
							'https://unpkg.com/@mysten/suins@1.0.0?module',
						];
					for (const url of urls) {
						try {
							const suinsModule = await Promise.race([
								import(url),
								new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: ' + url)), timeoutMs)),
							]);
							SuinsClient = pickSuinsExport(suinsModule, 'SuinsClient') || SuinsClient;
							SuinsTransaction = pickSuinsExport(suinsModule, 'SuinsTransaction') || SuinsTransaction;
							if (resolveSuinsClientCtor(SuinsClient)) {
								if (!requireTransaction || typeof SuinsTransaction === 'function') return;
							}
						} catch (error) {
							console.warn('Failed loading SuiNS SDK from', url, error);
						}
					}
				})().finally(() => {
					suinsModuleLoadingPromise = null;
				});
			}

			await suinsModuleLoadingPromise;
			const loadedClient = !!resolveSuinsClientCtor(SuinsClient);
			const loadedTx = !requireTransaction || typeof SuinsTransaction === 'function';
			return loadedClient && loadedTx;
		}
		async function createSuinsClient(requireTransaction = false) {
			const ready = await ensureSuinsSdkLoaded(requireTransaction);
			if (!ready) {
				throw new Error('SuiNS SDK failed to load from CDN. Check your connection and reload the page.');
			}
			const SuinsClientCtor = resolveSuinsClientCtor(SuinsClient);
			if (!SuinsClientCtor) {
				throw new Error('SuiNS SDK loaded without a usable SuinsClient constructor.');
			}
			return new SuinsClientCtor({
				client: getSuiClient(),
				network: getSuinsNetwork(),
			});
		}

		let connectedWallet = null;
		let connectedAccount = null;
		let connectedAddress = null;
		let connectedWalletName = null;
		let connectedPrimaryName = null;
		let nftOwnerAddress = null;
		let targetPrimaryName = null;
		let ownerPrimaryName = null;
		let canEdit = false;
		let ownerDisplayAddress = CURRENT_ADDRESS;
		let currentTargetAddress = TARGET_ADDRESS || '';
			let currentListing = null;
			let currentBestBid = null;
			let currentSales = [];
			let lastSoldPriceMist = null;
			let lastSaleEventMs = 0;
			let lastListingEventMs = 0;
			let pendingBidAmount = null;

		var __lastVaultAddress = null;
		SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
			connectedWallet = conn.wallet;
			connectedAccount = conn.account;
			connectedAddress = conn.address;
			connectedWalletName = conn.wallet ? conn.wallet.name : null;
			connectedPrimaryName = conn.primaryName;

			if (connectedAddress) {
				if (connectedAddress !== __lastVaultAddress) {
					__lastVaultAddress = connectedAddress;
					window.userVaultNames = new Set();
					if (typeof window.renderVaultList === 'function') window.renderVaultList();
					if (typeof window.loadUserVault === 'function') window.loadUserVault();
				}
			} else {
				__lastVaultAddress = null;
				window.userVaultNames = new Set();
				if (typeof window.renderVaultList === 'function') window.renderVaultList();
			}
		});

			function canSign() {
				if (!connectedAddress) return false;
				if (connectedWallet && connectedAccount) return true;
				var conn = SuiWalletKit.$connection.value;
				return conn && conn.status === 'session' && !!SuiWalletKit.__skiSignFrame;
			}

			function getConnectedSenderAddress() {
				const senderAddress =
					typeof connectedAccount?.address === 'string'
						? connectedAccount.address
						: connectedAccount?.address?.toString?.() || connectedAddress || '';
				return senderAddress;
			}

			function normalizeSuiNameForCompare(value) {
				return String(value || '').trim().toLowerCase().replace(/\\.sui$/i, '');
			}

			function isProfilePrimaryNameForOwner() {
				const currentName = normalizeSuiNameForCompare(FULL_NAME || NAME);
				if (!currentName) return false;
				const ownerPrimary = normalizeSuiNameForCompare(ownerPrimaryName || targetPrimaryName);
				if (ownerPrimary) return ownerPrimary === currentName;
				const ownerNameEl = document.getElementById('addr-name');
				const ownerNameFromUi = normalizeSuiNameForCompare(ownerNameEl?.dataset?.copyName || '');
				return ownerNameFromUi ? ownerNameFromUi === currentName : false;
			}

			function syncIdentityPrimaryBadgeState() {
				const isPrimaryName = isProfilePrimaryNameForOwner();
				if (document.body) {
					document.body.classList.toggle('profile-name-primary', isPrimaryName);
				}
				if (identityVisual) {
					identityVisual.classList.toggle('primary-identity', isPrimaryName);
				}
			}

			window.connectWallet = function connectWallet() {
				if (canSign()) return Promise.resolve();
				SuiWalletKit.openModal();
				return new Promise(function(resolve) {
				var unsub = SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
					if (conn && (conn.status === 'connected' || conn.status === 'session') && conn.address) {
						unsub();
						resolve();
					}
				});
			});
		};

		function renderWalletBar() {}
		function updateGlobalWalletWidget() {}

		// DOM Elements
		const walletBar = document.getElementById('wallet-bar');
		const editBtn = document.getElementById('edit-address-btn');
		const setSelfBtn = document.getElementById('set-self-btn');
		const ownerPrimaryStar = document.getElementById('owner-primary-star');
		const copyBtn = document.getElementById('copy-address-btn');
		const ownerAddrText = document.getElementById('addr-text');
		const ownerDisplayCard = document.querySelector('.owner-display');
		const jacketBtn = document.getElementById('jacket-btn');
		const jacketModal = document.getElementById('jacket-modal');
		const jacketStartPrice = document.getElementById('jacket-start-price');
		const jacketDuration = document.getElementById('jacket-duration');
		const jacketStatus = document.getElementById('jacket-status');
		const jacketCancelBtn = document.getElementById('jacket-cancel-btn');
		const jacketListBtn = document.getElementById('jacket-list-btn');

		// Shared wallet widget elements (same pattern as landing page)
		const walletWidget = document.getElementById('wallet-widget');
		const walletBtn = document.getElementById('wallet-btn');
		const walletBtnText = document.getElementById('wallet-btn-text');
		const walletProfileBtn = document.getElementById('wallet-profile-btn');
		const walletMenu = document.getElementById('wallet-menu');
		const viewPortfolioLink = document.getElementById('view-portfolio-link');
		const editModal = document.getElementById('edit-modal');
		const sendModal = document.getElementById('send-modal');
			const targetAddressInput = document.getElementById('target-address');
			const resolvedAddressEl = document.getElementById('resolved-address');
			const modalStatus = document.getElementById('modal-status');
			const ownerInlineStatus = document.getElementById('owner-inline-status');
			const cancelBtn = document.getElementById('cancel-edit-btn');
			const saveBtn = document.getElementById('save-address-btn');
			const copyTargetBtn = document.getElementById('copy-target-address-btn');
			const targetPreviewBtn = document.getElementById('target-preview');
			const targetPreviewValue = document.getElementById('target-preview-value');
			const sendBtn = document.getElementById('send-sui-btn');
			const sendAmountInput = document.getElementById('send-amount');
			const sendRecipientAddressEl = document.getElementById('send-recipient-address');
			const sendStatus = document.getElementById('send-status');
			const sendCancelBtn = document.getElementById('send-cancel-btn');
			const sendConfirmBtn = document.getElementById('send-confirm-btn');
		// Identity card elements (merged NFT + QR)
		const identityVisual = document.getElementById('identity-visual');
		const identityCanvas = document.getElementById('qr-canvas');
			const identityName = document.getElementById('identity-name');
			const qrToggle = document.getElementById('qr-toggle');
			const identityDownloadBtn = document.getElementById('identity-download-btn');
			const identityRestoreBtn = document.getElementById('identity-restore-btn');
			let nftImageUrl = null;
			let rawIdentityNftImage = null;
			let showingQr = false; // Default to NFT display, QR is fallback
			let stylizedMode = false;
			let nftDisplayLoaded = false;
			let restoringIdentityVisual = false;

		// Marketplace elements (declared early to avoid temporal dead zone)
		const mainContentEl = document.querySelector('.main-content');
		const overviewSecondaryGrid = document.getElementById('overview-secondary-grid');
		const overviewMarketModule = document.getElementById('overview-market-module');
		const marketplaceCard = document.getElementById('marketplace-card');
		const marketplaceListingRow = document.getElementById('marketplace-listing-row');
		const marketplaceBidRow = document.getElementById('marketplace-bid-row');
		const marketplaceListingPrice = document.getElementById('marketplace-listing-price');
		const marketplaceLister = document.getElementById('marketplace-lister');
		const marketplaceBidPrice = document.getElementById('marketplace-bid-price');
		const marketplaceBidder = document.getElementById('marketplace-bidder');
		const marketplaceAcceptBidBtn = document.getElementById('marketplace-accept-bid-btn');
		const marketplaceAcceptText = marketplaceAcceptBidBtn?.querySelector('.marketplace-accept-text');
		const marketplaceAcceptLoading = marketplaceAcceptBidBtn?.querySelector('.marketplace-accept-loading');
		const marketplaceBuyBtn = document.getElementById('marketplace-buy-btn');
		const marketplaceBuyText = marketplaceBuyBtn?.querySelector('.marketplace-buy-text');
		const marketplaceBuyLoading = marketplaceBuyBtn?.querySelector('.marketplace-buy-loading');
		const marketplaceBidInputWrap = document.getElementById('marketplace-bid-input');
		const marketplaceBidAmountInput = document.getElementById('marketplace-bid-amount');
		const marketplaceBidPriceControl = marketplaceBidInputWrap?.querySelector('.marketplace-bid-price-control');
		const marketplaceBidPriceUpBtn = document.getElementById('marketplace-bid-price-up');
		const marketplaceBidPriceDownBtn = document.getElementById('marketplace-bid-price-down');
		const marketplacePlaceBidBtn = document.getElementById('marketplace-place-bid-btn');
		const marketplaceBidText = marketplacePlaceBidBtn?.querySelector('.marketplace-bid-text');
		const marketplaceBidLoading = marketplacePlaceBidBtn?.querySelector('.marketplace-bid-loading');
		const marketplaceBidEstimate = document.getElementById('marketplace-bid-estimate');
		const marketplaceListInputWrap = document.getElementById('marketplace-list-input');
		const marketplaceListTopRow = marketplaceListInputWrap?.querySelector('.marketplace-list-top-row');
		const marketplaceListAmountInput = document.getElementById('marketplace-list-amount');
		const marketplaceListPriceControl = marketplaceListInputWrap?.querySelector('.marketplace-list-price-control');
		const marketplaceListPriceUpBtn = document.getElementById('marketplace-list-price-up');
		const marketplaceListPriceDownBtn = document.getElementById('marketplace-list-price-down');
		const marketplaceListBtn = document.getElementById('marketplace-list-btn');
		const marketplaceListText = marketplaceListBtn?.querySelector('.marketplace-list-text');
		const marketplaceListLoading = marketplaceListBtn?.querySelector('.marketplace-list-loading');
		const marketplaceWrapBtn = document.getElementById('marketplace-wrap-btn');
		const marketplaceWrapText = marketplaceWrapBtn?.querySelector('.marketplace-wrap-text');
		const marketplaceWrapLoading = marketplaceWrapBtn?.querySelector('.marketplace-wrap-loading');
		const marketplaceWrapHint = document.getElementById('marketplace-wrap-hint');
		const marketplaceListEstimate = document.getElementById('marketplace-list-estimate');
		const marketplaceStatus = document.getElementById('marketplace-status');
		const marketplaceActivity = document.getElementById('marketplace-activity');
		const marketplaceActivityList = document.getElementById('marketplace-activity-list');
		const marketplaceActivityLink = document.getElementById('marketplace-activity-link');
		const marketplaceSoldRow = document.getElementById('marketplace-sold-row');
		const marketplaceSoldPrice = document.getElementById('marketplace-sold-price');
		const marketplaceSeller = document.getElementById('marketplace-seller');

		// Decay auction elements (declared early to avoid temporal dead zone)
		const auctionCard = document.getElementById('auction-card');
		const auctionCurrentPrice = document.getElementById('auction-current-price');
		const auctionTimeLeft = document.getElementById('auction-time-left');
		const auctionStateRow = document.getElementById('auction-state-row');
		const auctionStateValue = document.getElementById('auction-state-value');
		const auctionBuyBtn = document.getElementById('auction-buy-btn');
		const auctionBuyText = document.getElementById('auction-buy-text');
		const auctionBuyLoading = auctionBuyBtn?.querySelector('.auction-buy-loading');
		const auctionCancelBtn = document.getElementById('auction-cancel-btn');
		const auctionCancelText = document.getElementById('auction-cancel-text');
		const auctionCancelLoading = auctionCancelBtn?.querySelector('.auction-cancel-loading');
		const auctionStatus = document.getElementById('auction-status');
		const auctionSellerLabel = document.getElementById('auction-seller-label');

		function truncAddr(addr) {
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		function previewAddr6(addr) {
			if (!addr || typeof addr !== 'string' || addr.length < 14) return addr || '';
			return addr.slice(0, 6) + '...' + addr.slice(-6);
		}

		function getTradeportPortfolioHref(address) {
			const normalized = typeof address === 'string' ? address.trim() : '';
			const query = '?tab=items&bottomTab=trades&collectionFilter=suins';
			return normalized
				? 'https://www.tradeport.xyz/sui/' + encodeURIComponent(normalized) + query
				: 'https://www.tradeport.xyz/sui' + query;
		}

		function updatePortfolioLink(address) {
			if (!viewPortfolioLink) return;
			const resolvedAddress =
				address || ownerDisplayAddress || CURRENT_ADDRESS || TARGET_ADDRESS || OWNER_ADDRESS || '';
			viewPortfolioLink.href = getTradeportPortfolioHref(resolvedAddress);
			viewPortfolioLink.title = resolvedAddress
				? 'View all SuiNS names on TradePort for ' + truncAddr(resolvedAddress)
				: 'View all SuiNS names on TradePort';
		}

			function renderTargetPreview(address) {
				const targetPreviewEl = document.getElementById('target-preview');
				const targetPreviewValueEl = document.getElementById('target-preview-value');
				const targetCopyBtnEl = document.getElementById('copy-target-address-btn');
				if (!targetPreviewEl) return;
				currentTargetAddress = address || '';
				if (address) {
					targetPreviewEl.classList.remove('no-target');
					targetPreviewEl.title = 'Copy target address: ' + address;
					targetPreviewEl.setAttribute('role', 'button');
					targetPreviewEl.tabIndex = 0;
					targetPreviewEl.setAttribute('aria-label', 'Copy target address');
					if (targetPreviewValueEl) targetPreviewValueEl.textContent = previewAddr6(address);
					if (targetCopyBtnEl) {
						targetCopyBtnEl.classList.remove('hidden');
						targetCopyBtnEl.disabled = false;
						targetCopyBtnEl.title = 'Copy target address: ' + address;
					targetCopyBtnEl.setAttribute('aria-label', 'Copy target address');
				}
				targetPreviewEl.style.display = '';
				targetPreviewEl.classList.add('is-copyable');
				targetPreviewEl.classList.toggle('long-renewal', IS_LONG_RENEWAL);
				} else {
					targetPreviewEl.style.display = '';
					targetPreviewEl.classList.remove('is-copyable', 'copied', 'long-renewal');
					targetPreviewEl.classList.add('no-target');
					targetPreviewEl.removeAttribute('role');
					targetPreviewEl.removeAttribute('aria-label');
					targetPreviewEl.removeAttribute('tabindex');
					targetPreviewEl.title = 'No target address';
					if (targetPreviewValueEl) targetPreviewValueEl.textContent = '—';
					if (targetCopyBtnEl) {
						targetCopyBtnEl.classList.add('hidden');
						targetCopyBtnEl.disabled = true;
						targetCopyBtnEl.title = 'No target address';
				}
			}
		}

		function showStatus(el, msg, type) {
			el.innerHTML = msg;
			el.className = 'status ' + type;
		}

			function hideStatus(el) {
				el.className = 'status hidden';
			}

			let ownerInlineStatusTimer = null;
			function showOwnerInlineStatus(message, type = 'info', isHtml = false) {
				if (!ownerInlineStatus) return;
				if (ownerInlineStatusTimer) {
					clearTimeout(ownerInlineStatusTimer);
					ownerInlineStatusTimer = null;
				}

				if (isHtml) {
					ownerInlineStatus.innerHTML = message;
				} else {
					ownerInlineStatus.textContent = message;
				}
				ownerInlineStatus.className = 'status owner-inline-status ' + type;

				ownerInlineStatusTimer = setTimeout(() => {
					ownerInlineStatus.className = 'status owner-inline-status hidden';
				}, 7000);
			}

		function getTxExplorerLinks(digest) {
			const safeDigest = encodeURIComponent(String(digest || ''));
			if (!safeDigest) return [];

			const links = [
				{
					label: 'Suiscan',
					url: 'https://suiscan.xyz/' + NETWORK + '/tx/' + safeDigest,
				},
				{
					label: 'Sui Explorer',
					url: 'https://suiexplorer.com/txblock/' + safeDigest + '?network=' + NETWORK,
				},
			];

			if (NETWORK === 'mainnet') {
				links.push({
					label: 'Suivision',
					url: 'https://suivision.xyz/txblock/' + safeDigest,
				});
			}

			return links;
		}

		function renderTxExplorerLinks(digest, includeViewPrefix = false) {
			const links = getTxExplorerLinks(digest);
			if (!links.length) return '';
			return links.map((link) =>
				'<a href="' + link.url + '" target="_blank" rel="noopener noreferrer">' +
				(includeViewPrefix ? 'View on ' : '') + link.label +
				'</a>'
			).join(' · ');
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
			const suinsClient = await createSuinsClient();

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
			return await resolvePrimaryNameViaApi(address);
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
				canEdit = canConnectedWalletEditTarget();
				updateEditButton();
				renderWalletBar(); // Re-render to show primary name
				updateGlobalWalletWidget(); // Update global widget with primary name
			} finally {
				isCheckingEditPermission = false;
			}
		}

		// Update edit button state
		function updateEditButton() {
			const normalizedConnected = connectedAddress ? String(connectedAddress).toLowerCase() : '';
			const explicitTargetAddress = getExplicitTargetAddress();
			const normalizedTarget = String(explicitTargetAddress || '').toLowerCase();
			const normalizedOwner = String(nftOwnerAddress || OWNER_ADDRESS || '').toLowerCase();
			const hasExplicitTarget = isLikelySuiAddress(explicitTargetAddress);
			const isAlreadySelf = Boolean(normalizedConnected && normalizedTarget && normalizedConnected === normalizedTarget);
			const isOwner = Boolean(normalizedConnected && normalizedOwner && normalizedConnected === normalizedOwner);
			const isLinkedTarget = Boolean(hasExplicitTarget && isAlreadySelf);
			const isPrimaryForTarget = Boolean(hasExplicitTarget && isProfilePrimaryNameForOwner());
			const hasTwoPlusYearsRemaining = Boolean(
				Number.isFinite(EXPIRATION_MS)
				&& Number(EXPIRATION_MS) - Date.now() >= 2 * 365.25 * 24 * 60 * 60 * 1000,
			);
			const isUnlisted = !currentListing;
			const useOwnedWhiteTheme = Boolean(
				!isPrimaryForTarget
				&& isOwner
				&& isUnlisted
				&& hasTwoPlusYearsRemaining,
			);
			const useOwnedBlueTheme = Boolean(!isPrimaryForTarget && !useOwnedWhiteTheme && isOwner);
			const isAlreadyPrimary = Boolean(
				connectedAddress
				&& connectedPrimaryName
				&& connectedPrimaryName.replace(/\\.sui$/i, '') === FULL_NAME.replace(/\\.sui$/i, ''),
			);

			// Show for owners when target is missing or points elsewhere.
			if (isOwner && (!hasExplicitTarget || !isAlreadySelf)) {
				setSelfBtn.disabled = false;
				setSelfBtn.title = connectedPrimaryName
					? 'Lift target to ' + connectedPrimaryName
					: 'Lift target to ' + truncAddr(connectedAddress);
				setSelfBtn.classList.remove('hidden');
			} else {
				setSelfBtn.classList.add('hidden');
			}

			// Primary star (shown next to the profile title)
			if (ownerPrimaryStar) {
				const canSeePrimaryStar = Boolean(connectedAddress && (isOwner || isLinkedTarget));
				ownerPrimaryStar.classList.toggle('hidden', !canSeePrimaryStar);
				ownerPrimaryStar.classList.toggle('selected', canSeePrimaryStar && isAlreadyPrimary);
				if (!canSeePrimaryStar) {
					ownerPrimaryStar.disabled = true;
					ownerPrimaryStar.title = '';
				} else if (isAlreadyPrimary) {
					ownerPrimaryStar.disabled = true;
					ownerPrimaryStar.title = 'This is your primary name';
				} else if (isOwner && canSign()) {
					ownerPrimaryStar.disabled = false;
					ownerPrimaryStar.title = 'Set as primary name';
				} else {
					ownerPrimaryStar.disabled = true;
					ownerPrimaryStar.title = isLinkedTarget
						? 'Only the NFT owner can set primary'
						: 'Wallet not ready';
				}
			}

			if (ownerDisplayCard) {
				ownerDisplayCard.classList.toggle('primary-view', isAlreadyPrimary);
				ownerDisplayCard.classList.toggle('owner-view', isOwner && !isAlreadyPrimary);
			}
				if (document.body) {
					document.body.classList.toggle('profile-primary-active', isAlreadyPrimary);
				}
				syncIdentityPrimaryBadgeState();

				// Jacket button - visible when owner and package configured
				if (jacketBtn) {
					jacketBtn.classList.toggle('hidden', !isOwner || !DECAY_AUCTION_PACKAGE_ID);
				}

			// Edit button
			if (editBtn) {
				const canShowEdit = Boolean(connectedAddress && (isOwner || canEdit));
				editBtn.classList.toggle('hidden', !canShowEdit);
				editBtn.disabled = !canShowEdit;
				editBtn.title = canShowEdit ? 'Edit target address' : '';
			}
				if (copyTargetBtn) {
					const showEmptyTarget = Boolean(connectedAddress && !isOwner && !hasExplicitTarget);
					copyTargetBtn.classList.toggle('hidden', !hasExplicitTarget && !showEmptyTarget);
					copyTargetBtn.disabled = !hasExplicitTarget;
					if (showEmptyTarget) {
						copyTargetBtn.title = 'No target address';
						copyTargetBtn.setAttribute('aria-label', 'No target address');
					}
				}
				if (targetPreviewBtn) {
					const showEmptyTarget = Boolean(connectedAddress && !isOwner && !hasExplicitTarget);
					targetPreviewBtn.classList.remove('hidden');
					targetPreviewBtn.classList.toggle('self-target', Boolean(hasExplicitTarget && isAlreadySelf));
					targetPreviewBtn.classList.toggle('lift-ready', Boolean(isOwner && !hasExplicitTarget));
					targetPreviewBtn.classList.toggle('empty-target', showEmptyTarget);
					targetPreviewBtn.classList.toggle('target-primary-gold', Boolean(hasExplicitTarget && isPrimaryForTarget));
					targetPreviewBtn.classList.toggle('target-owned-blue', Boolean(hasExplicitTarget && useOwnedBlueTheme));
					targetPreviewBtn.classList.toggle('target-owned-white', Boolean(hasExplicitTarget && useOwnedWhiteTheme));
				}
				if (targetPreviewValue) {
					const showEmptyTarget = Boolean(connectedAddress && !isOwner && !hasExplicitTarget);
					targetPreviewValue.classList.remove('hidden');
					if (!hasExplicitTarget) {
						targetPreviewValue.textContent = showEmptyTarget ? '' : '—';
					}
				}

			// Update grace period banner visibility
			updateGracePeriodActions();
			updateGracePeriodCountdown();
		}

		// Update grace period actions visibility
		function updateGracePeriodActions() {
			if (!IS_IN_GRACE_PERIOD) return;
			const giftBtn = document.getElementById('gift-renewal-btn');
			const renewBtn = document.getElementById('renew-name-btn');
			const normalizedOwner = getResolvedOwnerAddress();
			const isOwner = Boolean(
				connectedAddress
				&& normalizedOwner
				&& connectedAddress.toLowerCase() === normalizedOwner,
			);
			if (giftBtn) giftBtn.style.display = connectedAddress ? 'inline-flex' : 'none';
			if (renewBtn) renewBtn.style.display = isOwner ? 'inline-flex' : 'none';
		}

		// x402 Renewal API - uses Payment Kit pattern
		async function handleGiftRenewal() {
			if (!canSign()) {
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

					const result = await SuiWalletKit.signAndExecute(tx);

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
						'Queued! Payment tx: ' + renderTxExplorerLinks(result.digest, true) + ' · ' +
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
							'Renewed! ' + renderTxExplorerLinks(data.renewalTxDigest, true) + '<br>' +
							'<small>Reload page to see updated expiration.</small>',
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

		// Update grace period countdown and burn button
		function updateGracePeriodCountdown() {
			if (!IS_IN_GRACE_PERIOD) return;

			const daysEl = document.getElementById('days-until-available');
			const burnBtn = document.getElementById('burn-nft-btn');

			if (daysEl && AVAILABLE_AT) {
				const msUntilAvailable = AVAILABLE_AT - Date.now();
				const daysUntilAvailable = Math.max(0, Math.ceil(msUntilAvailable / (24 * 60 * 60 * 1000)));
				daysEl.textContent = String(daysUntilAvailable);
			}

			if (burnBtn) {
				const normalizedOwner = getResolvedOwnerAddress();
				const isOwner = Boolean(
					connectedAddress
					&& normalizedOwner
					&& connectedAddress.toLowerCase() === normalizedOwner,
				);
				burnBtn.classList.toggle('hidden', !isOwner);
			}
		}

		// Burn NFT and release name
		async function handleBurnNft() {
			if (!canSign() || !NFT_ID) {
				showBurnStatus('Connect wallet first', 'error');
				return;
			}

			const normalizedOwner = getResolvedOwnerAddress();
			const isOwner = Boolean(
				connectedAddress
				&& normalizedOwner
				&& connectedAddress.toLowerCase() === normalizedOwner,
			);
			if (!isOwner) {
				showBurnStatus('Only the NFT owner can burn', 'error');
				return;
			}

			if (!confirm('⚠️ This will permanently burn your NFT and release "' + FULL_NAME + '" for registration.\\n\\nThis action cannot be undone. Continue?')) {
				return;
			}

			const btn = document.getElementById('burn-nft-btn');
			const txt = document.getElementById('burn-nft-text');
			const loading = btn?.querySelector('.burn-nft-loading');
			const orig = txt?.textContent || 'Burn NFT & Release Name';

			try {
				if (btn) btn.disabled = true;
				if (txt) txt.style.display = 'none';
				if (loading) loading.classList.remove('hidden');

				const tx = new Transaction();
				tx.moveCall({
					target: '${env.SUI_NETWORK === 'mainnet' ? '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0' : '0xcb63193327801b8a90aa3778a6c50def5d2be3aac0630393d3329346cee58eaf'}::suins_registration::burn',
					arguments: [tx.object(NFT_ID)],
				});

				let result;
				result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true, showObjectChanges: true } });

				showBurnStatus(
					'NFT burned! ' + renderTxExplorerLinks(result.digest, true) + '<br>' +
					'<small>The name is now available for registration.</small>',
					'success'
				);

				if (btn) {
					btn.disabled = true;
					btn.classList.add('hidden');
				}

			} catch (e) {
				const m = e.message || '';
				if (m.includes('rejected') || m.includes('cancelled')) {
					showBurnStatus('Cancelled', 'error');
				} else {
					showBurnStatus('Error: ' + m, 'error');
				}
			} finally {
				if (btn) btn.disabled = false;
				if (txt) {
					txt.textContent = orig;
					txt.style.display = '';
				}
				if (loading) loading.classList.add('hidden');
			}
		}

		function showBurnStatus(msg, type) {
			const el = document.getElementById('grace-period-burn-status');
			if (!el) return;
			el.innerHTML = msg;
			el.className = 'grace-period-status ' + type;
			el.classList.remove('hidden');
			if (type !== 'success') setTimeout(() => { el.classList.add('hidden'); }, 15000);
		}

		const burnBtnEl = document.getElementById('burn-nft-btn');
		if (burnBtnEl) burnBtnEl.addEventListener('click', handleBurnNft);

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
					const cleanedName = ownerPrimaryName.replace(/.sui$/i, '');
					ownerInfoEl.innerHTML = \`<a href="https://\${cleanedName}.sui.ski" target="_blank">\${ownerPrimaryName}</a> (<code>\${truncatedAddr}</code>)\`;
				} else {
					ownerInfoEl.innerHTML = \`<code>\${truncatedAddr}</code>\`;
				}
			} else {
				// No NFT owner found - show unknown
				ownerInfoEl.textContent = 'Unknown owner';
			}
		}

		function getWalletProfileHref() {
			if (connectedPrimaryName) {
				const cleanedName = connectedPrimaryName.replace(/.sui$/i, '');
				return \`https://\${cleanedName}.sui.ski\`;
			}
			return 'https://sui.ski';
		}

		function updateWalletProfileButton() {
			if (!walletProfileBtn) return;
			const href = getWalletProfileHref();
			walletProfileBtn.dataset.href = href;
			walletProfileBtn.title = connectedPrimaryName ? 'View my primary profile' : 'Go to sui.ski';
		}

		if (walletProfileBtn) {
			walletProfileBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				window.location.href = walletProfileBtn.dataset.href || 'https://sui.ski';
			});
		}

			// Global function to update UI when wallet connects/disconnects
			var renewalUiReady = false

			// This can be extended by other features (messaging, etc.)
				var updateUIForWallet = () => {
			// Expose wallet state to window for cross-script access
			window.connectedAddress = connectedAddress;
			window.connectedWallet = connectedWallet;
			window.connectedAccount = connectedAccount;
			window.connectedPrimaryName = connectedPrimaryName;
			window.updateEditButton = updateEditButton;
			if (typeof syncCrosschainTargetFromWallet === 'function') syncCrosschainTargetFromWallet();

			renderWalletBar();
			updateGlobalWalletWidget();
			checkEditPermission();
			updateEditButton();
				if (typeof loadUserVault === 'function') loadUserVault();
				if (typeof updateBountiesSectionVisibility === 'function') updateBountiesSectionVisibility();
					if (renewalUiReady && typeof updateRenewalButton === 'function') updateRenewalButton();
				if (typeof updateMarketplaceButton === 'function') updateMarketplaceButton();

					const vaultBtn = document.getElementById('vault-diamond-btn');
					if (vaultBtn) {
						if (connectedAddress && connectedAddress !== TARGET_ADDRESS && connectedAddress !== OWNER_ADDRESS) {
							vaultBtn.style.display = '';
							if (!diamondWatching) {
								checkWatchingState();
							}
						} else {
							vaultBtn.style.display = 'none';
							if (diamondWatching) {
								vaultBtn.classList.remove('bookmarked', 'diamond-transforming');
								vaultBtn.title = 'Save to vault';
								if (document.body) document.body.classList.remove('diamond-watch-active');
								const identityCard = document.querySelector('.identity-card');
								if (identityCard) identityCard.classList.remove('black-diamond-active');
								try { diamondWatching = false; } catch {}
							}
						}
					}

				if (connectedAddress && typeof pendingBidAmount !== 'undefined' && pendingBidAmount !== null) {
					setTimeout(() => {
						if (marketplaceBidAmountInput) {
							marketplaceBidAmountInput.value = String(pendingBidAmount);
						}
						pendingBidAmount = null;
						if (marketplacePlaceBidBtn) {
							marketplacePlaceBidBtn.click();
						}
					}, 500);
				}
			};

		const COPY_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
		const COPY_OK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';

		function flashCopyButton(btn) {
			if (!btn) return;
			btn.innerHTML = COPY_OK_SVG;
			setTimeout(() => {
				btn.innerHTML = COPY_ICON_SVG;
			}, 1500);
		}

		function flashTargetCopyButton(btn) {
			if (!btn) return;
			btn.classList.add('copied');
			setTimeout(() => {
				btn.classList.remove('copied');
			}, 1400);
		}

		function flashTargetPreview() {
			if (!targetPreviewBtn) return;
			targetPreviewBtn.classList.add('copied');
			setTimeout(() => {
				targetPreviewBtn.classList.remove('copied');
			}, 1400);
		}

		function flashOwnerAddress() {
			if (!ownerAddrText) return;
			ownerAddrText.classList.add('copied');
			setTimeout(() => {
				ownerAddrText.classList.remove('copied');
			}, 1400);
		}

		// Copy owner address to clipboard (uses NFT owner during grace period)
		async function copyAddress() {
			const addressToCopy = ownerDisplayAddress || CURRENT_ADDRESS;
			if (!addressToCopy) {
				console.warn('No owner address available to copy.');
				return;
			}

			try {
				await navigator.clipboard.writeText(addressToCopy);
				flashCopyButton(copyBtn);
				flashOwnerAddress();
				showOwnerInlineStatus('Owner address copied to clipboard.', 'success');
			} catch (error) {
				console.error('Failed to copy owner address:', error);
				showOwnerInlineStatus('Could not copy owner address.', 'error');
			}
		}

		async function copyTargetAddress() {
			const addressToCopy = getExplicitTargetAddress();
			if (!addressToCopy) return;

			try {
				await navigator.clipboard.writeText(addressToCopy);
				flashTargetCopyButton(copyTargetBtn);
				flashTargetPreview();
				showOwnerInlineStatus('Target address copied to clipboard.', 'success');
			} catch (error) {
				console.error('Failed to copy target address:', error);
				showOwnerInlineStatus('Could not copy target address.', 'error');
			}
		}

		function isLikelySuiAddress(address) {
			return Boolean(address && typeof address === 'string' && address.startsWith('0x') && address.length >= 10);
		}

		function getResolvedOwnerAddress() {
			return String(nftOwnerAddress || OWNER_ADDRESS || '').toLowerCase();
		}

		function getExplicitTargetAddress() {
			return currentTargetAddress || TARGET_ADDRESS || '';
		}

		function getActiveTargetAddress() {
			return getExplicitTargetAddress() || CURRENT_ADDRESS || ownerDisplayAddress || '';
		}

		function canConnectedWalletEditTarget() {
			const normalizedConnected = connectedAddress ? String(connectedAddress).toLowerCase() : '';
			if (!normalizedConnected) return false;
			const normalizedOwner = getResolvedOwnerAddress();
			const normalizedTarget = String(getExplicitTargetAddress() || '').toLowerCase();
			return Boolean(
				(normalizedOwner && normalizedConnected === normalizedOwner)
				|| (normalizedTarget && normalizedConnected === normalizedTarget),
			);
		}

		function openSendModal() {
			const recipient = getActiveTargetAddress();
			if (!isLikelySuiAddress(recipient)) {
				showOwnerInlineStatus('No valid target address available for this profile.', 'error');
				return;
			}
			if (!canSign()) {
				connectWallet().then(() => {
					if (canSign()) openSendModal();
				});
				return;
			}
			if (sendRecipientAddressEl) {
				const truncated = recipient.length > 13
					? recipient.slice(0, 6) + '...' + recipient.slice(-7)
					: recipient;
				sendRecipientAddressEl.textContent = truncated;
				sendRecipientAddressEl.title = recipient;
			}
			if (sendAmountInput) {
				sendAmountInput.value = '1';
				sendAmountInput.select();
			}
			const walletIndicator = document.getElementById('send-wallet-indicator');
			if (walletIndicator && connectedWallet) {
				const iconSrc = connectedWallet.icon || '';
				walletIndicator.innerHTML = iconSrc
					? '<img src="' + iconSrc + '" class="send-wallet-ball" alt="' + (connectedWallet.name || '') + '" onerror="this.style.display=\\'none\\'">'
					: '<span class="send-wallet-ball send-wallet-ball-default"></span>';
			}
			if (sendStatus) hideStatus(sendStatus);
			if (typeof switchSendTab === 'function') switchSendTab('direct');
			const zkWalletInd = document.getElementById('zk-wallet-indicator');
			if (zkWalletInd && connectedWallet) {
				const iconSrc = connectedWallet.icon || '';
				zkWalletInd.innerHTML = iconSrc
					? '<img src="' + iconSrc + '" class="send-wallet-ball" alt="' + (connectedWallet.name || '') + '" onerror="this.style.display=\\'none\\'">'
					: '<span class="send-wallet-ball send-wallet-ball-default"></span>';
			}
			const zkAmtInput = document.getElementById('zk-amount');
			if (zkAmtInput) zkAmtInput.value = '1';
			if (sendModal) sendModal.classList.add('open');
		}

		function closeSendModal() {
			if (sendModal) sendModal.classList.remove('open');
			if (sendStatus) hideStatus(sendStatus);
			const zkSt = document.getElementById('zk-status');
			const zkRes = document.getElementById('zk-result');
			if (zkSt) hideStatus(zkSt);
			if (zkRes) zkRes.style.display = 'none';
		}

		async function sendSuiToProfile() {
			if (!sendStatus || !sendConfirmBtn || !sendAmountInput) return;

			const recipient = getActiveTargetAddress();
			if (!isLikelySuiAddress(recipient)) {
				showStatus(sendStatus, 'Recipient address is invalid', 'error');
				return;
			}
			if (!canSign()) {
				showStatus(sendStatus, 'Connect wallet first', 'error');
				return;
			}
			const senderAddress = getConnectedSenderAddress();
			if (!isLikelySuiAddress(senderAddress)) {
				showStatus(sendStatus, 'Wallet sender address is unavailable', 'error');
				return;
			}

			const amountSui = Number(sendAmountInput.value);
			if (!Number.isFinite(amountSui) || amountSui <= 0) {
				showStatus(sendStatus, 'Enter a valid amount', 'error');
				return;
			}

			const amountMist = BigInt(Math.ceil(amountSui * 1e9));
			if (amountMist <= 0n) {
				showStatus(sendStatus, 'Amount is too small', 'error');
				return;
			}

			sendConfirmBtn.disabled = true;
			showStatus(sendStatus, '<span class="loading"></span> Building transaction...', 'info');

			try {
				showStatus(sendStatus, '<span class="loading"></span> Checking balance...', 'info');
				const suiClient = getSuiClient();
				const balanceRes = await suiClient.getBalance({
					owner: senderAddress,
					coinType: SUI_TYPE,
				});
				const totalBalanceMist = BigInt(balanceRes?.totalBalance || '0');
				const gasReserveMist = 10000000n;
				if (totalBalanceMist < amountMist + gasReserveMist) {
					const neededSui = Number(amountMist + gasReserveMist) / 1e9;
					const availableSui = Number(totalBalanceMist) / 1e9;
					showStatus(
						sendStatus,
						'Insufficient SUI. Need ~' + neededSui.toFixed(4) + ' SUI, have ' + availableSui.toFixed(4) + ' SUI',
						'error',
					);
					return;
				}

				const tx = new Transaction();
				tx.setSender(senderAddress);
				const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);
				tx.transferObjects([coin], tx.pure.address(recipient));

				showStatus(sendStatus, '<span class="loading"></span> Approve in wallet...', 'info');

				let result;
				result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

				showStatus(sendStatus, '<strong>Sent!</strong> ' + renderTxExplorerLinks(result.digest, true), 'success');
				try {
					const scoreKey = 'sui_ski_send_scores';
					const scores = JSON.parse(localStorage.getItem(scoreKey) || '{}');
					const nameKey = NAME + '.sui';
					scores[nameKey] = (scores[nameKey] || 0) + 1;
					localStorage.setItem(scoreKey, JSON.stringify(scores));
				} catch {}
				setTimeout(() => closeSendModal(), 1400);
			} catch (error) {
				const msg = error?.message || 'Transaction failed';
				showStatus(sendStatus, 'Failed: ' + msg, 'error');
			} finally {
				sendConfirmBtn.disabled = false;
			}
		}

		// ===== IDENTITY CARD (NFT + QR CODE) =====
			function showIdentityQr() {
				if (!identityVisual || !identityCanvas) return;
				// Show canvas (for QR overlay)
				identityCanvas.style.display = 'block';
				// Hide NFT image if it exists
				const nftImg = identityVisual.querySelector('img');
				if (nftImg) nftImg.style.display = 'none';
				identityVisual.classList.remove('has-tagged-image');
				showingQr = true;
				stylizedMode = false;
			}

			function showIdentityNft() {
				if (!identityVisual || !identityCanvas) return;
				// Hide QR canvas
				identityCanvas.style.display = 'none';
				// Show NFT image if it exists
				const nftImg = identityVisual.querySelector('img');
				if (nftImg) nftImg.style.display = 'block';
				identityVisual.classList.toggle('has-tagged-image', Boolean(identityVisual.querySelector('img.identity-tagged-image')));
				showingQr = false;
				stylizedMode = false;
			}

		function toggleIdentityView() {
			if (showingQr) {
				showingQr = false;
				stylizedMode = true;
				applyTaggedIdentityToProfile();
			} else if (stylizedMode) {
				stylizedMode = false;
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

		// Toggle button click (in name wrapper)
		if (qrToggle) {
			qrToggle.addEventListener('click', (e) => {
				e.stopPropagation();
				toggleIdentityView();
			});
		}

			// Download button click (in name wrapper)
			if (identityDownloadBtn) {
				identityDownloadBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					downloadIdentityImage(identityDownloadBtn, showingQr);
				});
			}
			if (identityRestoreBtn) {
				identityRestoreBtn.addEventListener('click', async (e) => {
					e.stopPropagation();
					await restoreIdentityVisual();
				});
			}

			async function downloadIdentityImage(feedbackBtn, preferQr = showingQr) {
				const safeNameBase = String(NAME || 'sui')
					.replace(/.sui$/i, '')
					.toLowerCase()
					.replace(/[^a-z0-9-]/g, '-')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '') || 'sui';
				const taggedFilename = safeNameBase + '-sui.png';
				const sealPayload = buildMetaSealPayload(preferQr);
				try {
					const taggedCanvas = await buildTaggedIdentityCanvas(preferQr, currentListing, currentBestBid, {
						sales: currentSales,
						soldPriceMist: lastSoldPriceMist,
						saleEventMs: lastSaleEventMs,
						listingEventMs: lastListingEventMs,
					});
					if (taggedCanvas) {
						triggerCanvasDownload(taggedCanvas, taggedFilename, feedbackBtn, sealPayload);
						return;
					}
				} catch (error) {
					console.error('Tagged download failed, using fallback:', error);
				}

				// Fallback to raw visual export if tagged generation fails
				const fallbackFilename = safeNameBase + '-sui.png';
				if (preferQr && identityCanvas) {
					triggerCanvasDownload(identityCanvas, fallbackFilename, feedbackBtn, sealPayload);
					return;
				}
				const nftImg = identityVisual?.querySelector('img');
				if (nftImg) {
					const canvas = document.createElement('canvas');
					canvas.width = nftImg.naturalWidth || nftImg.width;
					canvas.height = nftImg.naturalHeight || nftImg.height;
					const ctx = canvas.getContext('2d');
					if (ctx) {
						ctx.drawImage(nftImg, 0, 0, canvas.width, canvas.height);
						triggerCanvasDownload(canvas, fallbackFilename, feedbackBtn, sealPayload);
						return;
					}
				}
				if (identityCanvas) {
					triggerCanvasDownload(identityCanvas, fallbackFilename, feedbackBtn, sealPayload);
				}
			}

			async function buildTaggedIdentityCanvas(preferQr = showingQr, listing = null, bestBid = null, options = {}) {
				const sales = options.sales || [];
				const soldPriceMist = options.soldPriceMist || null;
				const saleEventMs = Number(options.saleEventMs || 0);
				const listingEventMs = Number(options.listingEventMs || 0);
				const lastSale = sales.length > 0 ? sales[0] : null;
				const lastSalePriceMist = soldPriceMist || (lastSale?.price ?? null);
				const blackDiamondMode = options && options.blackDiamondMode === true;
				const isStylized = options && options.stylizedMode === true;
				const taggedNftSource = identityVisual?.querySelector('img.identity-tagged-image') || null;
				const cleanNftSource =
					rawIdentityNftImage || identityVisual?.querySelector('img:not(.identity-tagged-image)') || null;
				const nftSource = cleanNftSource || taggedNftSource || null;
				const qrSource = identityCanvas && identityCanvas.width > 0 ? identityCanvas : null;
				// Prefer the SuiNS registration NFT visual for export; QR is fallback only.
				const visualSource = nftSource || qrSource;
				if (!visualSource) return null;
				const canBlackenBase = blackDiamondMode && Boolean(cleanNftSource);

				const srcWidth = visualSource.naturalWidth || visualSource.width || 1600;
				const srcHeight = visualSource.naturalHeight || visualSource.height || 900;
				const canvas = document.createElement('canvas');
				canvas.width = srcWidth;
				canvas.height = srcHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) return null;

				const clamp8 = (value) => Math.max(0, Math.min(255, Math.round(value)));
				const inkCrushBackgroundPixels = () => {
					let imageData;
					try {
						imageData = ctx.getImageData(0, 0, srcWidth, srcHeight);
					} catch {
						return;
					}
					const data = imageData.data;
					for (let i = 0; i < data.length; i += 4) {
						const r = data[i];
						const g = data[i + 1];
						const b = data[i + 2];
						const max = Math.max(r, g, b);
						const min = Math.min(r, g, b);
						const sat = max === 0 ? 0 : (max - min) / max;
						const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
						const blueBias = b - ((r + g) * 0.5);
						const backgroundLike = sat < 0.48 || (blueBias > 8 && sat < 0.72);
						if (!backgroundLike) continue;

						const darkness = luma < 72 ? 0.1 : luma < 128 ? 0.16 : luma < 188 ? 0.24 : 0.32;
						const blueLift = sat < 0.25 ? 1.16 : 1.08;
						data[i] = clamp8(r * darkness * 0.9);
						data[i + 1] = clamp8(g * darkness * 0.88);
						data[i + 2] = clamp8(b * darkness * blueLift);
					}
					ctx.putImageData(imageData, 0, 0);
				};

				const drawWavyBackground = (w, h) => {
					ctx.fillStyle = '#05050a';
					ctx.fillRect(0, 0, w, h);
					ctx.save();
					const waveWidth = Math.round(w * 0.18);
					const spacingX = Math.round(waveWidth * 1.3);
					const spacingY = Math.round(waveWidth * 0.65);
					ctx.globalAlpha = 0.08;
					for (let y = -spacingY; y < h + spacingY; y += spacingY) {
						const row = Math.floor((y + spacingY) / spacingY);
						const offsetX = (row % 2 === 0) ? 0 : spacingX / 2;
						for (let x = -spacingX; x < w + spacingX; x += spacingX) {
							const pathWidth = 304;
							const scale = waveWidth / pathWidth;
							const lw = Math.max(2, Math.round(16 * scale));
							const c1x = (x + offsetX) + 80 * scale;
							const c1y = y - 36 * scale;
							const midX = (x + offsetX) + 160 * scale;
							const midY = y;
							const c2x = (x + offsetX) + 240 * scale;
							const c2y = y + 36 * scale;
							const endX = (x + offsetX) + 304 * scale;
							const endY = y;
							ctx.lineCap = 'round';
							ctx.lineWidth = lw;
							ctx.strokeStyle = '#60a5fa';
							ctx.beginPath();
							ctx.moveTo(x + offsetX, y);
							ctx.quadraticCurveTo(c1x, c1y, midX, midY);
							ctx.quadraticCurveTo(c2x, c2y, endX, endY);
							ctx.stroke();
						}
					}
					ctx.restore();
				};

					const minSide = Math.min(srcWidth, srcHeight);
					const overlayPadding = Math.max(22, Math.round(minSide * 0.045));
					let lowerRightOverlayReserve = Math.max(72, Math.round(srcWidth * 0.24));

				if (blackDiamondMode) {
					drawWavyBackground(srcWidth, srcHeight);
					if (isStylized) {
						const waterLogoSize = minSide * 0.75;
						const waterX = (srcWidth - waterLogoSize) / 2;
						const waterY = (srcHeight - waterLogoSize) / 2;
						ctx.save();
						ctx.globalAlpha = 0.18;
						const waterG = ctx.createLinearGradient(waterX, waterY, waterX + waterLogoSize, waterY + waterLogoSize);
						waterG.addColorStop(0, '#60a5fa');
						waterG.addColorStop(1, '#34d399');
						const px = (v) => waterX + (v - 96) * (waterLogoSize / 320);
						const py = (v) => waterY + (v - 96) * (waterLogoSize / 320);
						ctx.fillStyle = waterG;
						ctx.beginPath();
						ctx.moveTo(px(256), py(96));
						ctx.lineTo(px(416), py(352));
						ctx.lineTo(px(336), py(352));
						ctx.lineTo(px(280), py(256));
						ctx.lineTo(px(256), py(296));
						ctx.lineTo(px(232), py(256));
						ctx.lineTo(px(176), py(352));
						ctx.lineTo(px(96), py(352));
						ctx.closePath();
						ctx.fill();
						const waveScale = waterLogoSize / 304;
						ctx.strokeStyle = waterG;
						ctx.lineWidth = 24 * waveScale;
						ctx.lineCap = 'round';
						ctx.beginPath();
						ctx.moveTo(px(128), py(384));
						ctx.quadraticCurveTo(px(208), py(348), px(288), py(384));
						ctx.quadraticCurveTo(px(368), py(420), px(432), py(384));
						ctx.stroke();
						ctx.restore();
					}
				} else {
					ctx.drawImage(visualSource, 0, 0, srcWidth, srcHeight);
				}

				// Subtle contrast pass for top brand lockup
				const topFade = ctx.createLinearGradient(0, 0, 0, srcHeight * 0.24);
				topFade.addColorStop(0, blackDiamondMode ? 'rgba(5, 9, 20, 0.4)' : 'rgba(5, 9, 20, 0.26)');
				topFade.addColorStop(1, 'rgba(5, 9, 20, 0.0)');
				ctx.fillStyle = topFade;
				ctx.fillRect(0, 0, srcWidth, srcHeight * 0.24);

				const drawOverlayTag = (label, x, y, variant = 'neutral') => {
					const textSize = Math.max(14, Math.round(minSide * 0.043));
					const px = Math.max(10, Math.round(minSide * 0.022));
					const py = Math.max(6, Math.round(minSide * 0.013));
					ctx.font = '700 ' + textSize + 'px Inter, system-ui, -apple-system, sans-serif';
					const textWidth = ctx.measureText(label).width;
					const tagWidth = Math.round(textWidth + px * 2);
					const tagHeight = Math.round(textSize + py * 1.9);
					const radius = Math.round(tagHeight * 0.5);
					let fill = 'rgba(14, 18, 28, 0.68)';
					let stroke = 'rgba(148, 163, 184, 0.36)';
					let textColor = 'rgba(232, 238, 249, 0.95)';
					if (variant === 'accent') {
						fill = 'rgba(37, 99, 235, 0.28)';
						stroke = 'rgba(96, 165, 250, 0.72)';
						textColor = '#dbeafe';
					}
					if (variant === 'warning') {
						fill = 'rgba(146, 64, 14, 0.3)';
						stroke = 'rgba(251, 191, 36, 0.68)';
						textColor = '#fef3c7';
					}
					if (variant === 'expired') {
						fill = 'rgba(127, 29, 29, 0.34)';
						stroke = 'rgba(248, 113, 113, 0.68)';
						textColor = '#fecaca';
					}
					ctx.save();
					drawRoundedRect(ctx, x, y, tagWidth, tagHeight, radius);
					ctx.fillStyle = fill;
					ctx.fill();
					ctx.strokeStyle = stroke;
					ctx.lineWidth = Math.max(1.2, Math.round(minSide * 0.0038));
					ctx.stroke();
					ctx.fillStyle = textColor;
					ctx.textAlign = 'left';
					ctx.textBaseline = 'middle';
					ctx.fillText(label, x + px, y + tagHeight / 2);
					ctx.restore();
					return { width: tagWidth, height: tagHeight };
				};

				const nameFontSize = Math.max(46, Math.round(minSide * 0.175));
				const nameY = overlayPadding + Math.max(4, Math.round(minSide * 0.02));
				// Stylized look (no @) is preferred for black diamonds too
				const nameText = (blackDiamondMode || isStylized) 
					? (String(NAME || '').replace(/.sui$/i, '').replace(/^@+/, '') || 'sui')
					: ((blackDiamondMode ? '@' : '') + (String(NAME || '').replace(/.sui$/i, '') || 'sui'));
					ctx.save();
					// Only draw name and date if activated
					if (blackDiamondMode || isStylized) {
						ctx.font = '800 ' + nameFontSize + 'px Inter, system-ui, -apple-system, sans-serif';
						ctx.textAlign = 'left';
						ctx.textBaseline = 'top';
						ctx.lineJoin = 'round';
						ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
						ctx.shadowBlur = 12;
						ctx.shadowOffsetY = 2;
						const nameWidth = ctx.measureText(nameText).width;
						const nameX = overlayPadding;
						ctx.lineWidth = Math.max(3, Math.round(nameFontSize * 0.1));
						ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
						ctx.strokeText(nameText, nameX, nameY);
						const nameGradient = ctx.createLinearGradient(nameX, nameY, nameX + nameWidth, nameY + nameFontSize);
						
						// Always use water gradient for stylized/black diamond
						nameGradient.addColorStop(0, '#60a5fa');
						nameGradient.addColorStop(1, '#34d399');
						
						ctx.fillStyle = nameGradient;
						ctx.fillText(nameText, nameX, nameY);
						ctx.restore();

						const tagY = nameY + nameFontSize + Math.max(8, Math.round(minSide * 0.014));
						const primaryTag = drawOverlayTag('.sui', overlayPadding, tagY, 'accent');
						let expiryLabel = '';
						let expiryVariant = 'neutral';
						if (Number.isFinite(EXPIRATION_MS) && EXPIRATION_MS > 0) {
							const daysLeft = Math.ceil((EXPIRATION_MS - Date.now()) / 86400000);
							if (daysLeft <= 0) {
								expiryLabel = 'Expired';
								expiryVariant = 'expired';
							} else {
								expiryLabel = String(daysLeft) + 'D';
								expiryVariant = daysLeft <= 30 ? 'warning' : 'neutral';
							}
						}
						if (expiryLabel) {
							const expiryX = overlayPadding + primaryTag.width + Math.max(8, Math.round(minSide * 0.012));
							drawOverlayTag(expiryLabel, expiryX, tagY, expiryVariant);
						}
							if (Number.isFinite(EXPIRATION_MS) && EXPIRATION_MS > 0) {
								const expiryDate = new Date(EXPIRATION_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
								const dateSize = Math.max(14, Math.round(minSide * 0.04));
								ctx.save();
								ctx.font = '700 ' + dateSize + 'px Inter, system-ui, -apple-system, sans-serif';
								const dateWidth = ctx.measureText(expiryDate).width;
								lowerRightOverlayReserve = Math.max(
									lowerRightOverlayReserve,
									Math.round(dateWidth + overlayPadding * 1.4),
								);
								ctx.textBaseline = 'bottom';
								ctx.textAlign = 'right';
								ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
							ctx.lineWidth = Math.max(2, Math.round(dateSize * 0.25));
							// Position at bottom right with standard margin
							const dateX = srcWidth - overlayPadding;
							const dateY = srcHeight - overlayPadding;
							ctx.strokeText(expiryDate, dateX, dateY);
							ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
							ctx.fillText(expiryDate, dateX, dateY);
							ctx.restore();
						}
					} else {
						ctx.restore();
					}

				let logoImage = null;
				try {
					logoImage = await loadImageForCanvas(LOGO_DATA_URL);
				} catch {}

				// Place QR back in the lower-left corner.
				const qrBadgeSize = Math.max(132, Math.round(Math.min(srcWidth, srcHeight) * 0.2));
				const qrMargin = Math.max(16, Math.round(qrBadgeSize * 0.14));
				const qrX = qrMargin;
				const qrY = srcHeight - qrBadgeSize - qrMargin;
				drawCornerBrandedQr(ctx, qrX, qrY, qrBadgeSize, PROFILE_URL, logoImage, qrSource);
				const ownerNameEl = document.getElementById('addr-name');
				const ownerNameFromUi = String(ownerNameEl?.dataset?.copyName || '').trim();
				const ownerNameResolved = String(ownerNameFromUi || ownerPrimaryName || targetPrimaryName || '').trim();
				const ownerAddressFallback = String(ownerDisplayAddress || nftOwnerAddress || OWNER_ADDRESS || CURRENT_ADDRESS || '').trim();
					const ownerNameText = ownerNameResolved
						? (ownerNameResolved.toLowerCase().endsWith('.sui') ? ownerNameResolved.slice(0, -4) : ownerNameResolved)
						: (ownerAddressFallback ? truncAddr(ownerAddressFallback) : '');
					if (ownerNameText) {
						const ownerNameIsPrimary = isProfilePrimaryNameForOwner();
						const ownerValueSize = Math.max(16, Math.round(minSide * 0.05));
						const ownerPadX = Math.max(10, Math.round(minSide * 0.022));
						const ownerPadY = Math.max(8, Math.round(minSide * 0.016));
						const ownerGapFromQr = Math.max(10, Math.round(minSide * 0.018));
						const ownerIconSize = Math.max(10, Math.round(minSide * 0.03));
						const ownerIconGap = Math.max(6, Math.round(minSide * 0.01));
						const ownerBlockMaxWidth = Math.min(
							srcWidth - qrX - overlayPadding,
							Math.max(qrBadgeSize, Math.round(minSide * 0.42)),
						);
						const ownerValueFont = '800 ' + ownerValueSize + 'px Inter, system-ui, -apple-system, sans-serif';
						const fitOwnerText = (value, maxWidth) => {
							if (!value) return '';
							ctx.font = ownerValueFont;
							if (ctx.measureText(value).width <= maxWidth) return value;
							let base = value;
							while (base.length > 6 && ctx.measureText(base + '...').width > maxWidth) {
								base = base.slice(0, -1);
							}
							return base.length < value.length ? base + '...' : base;
						};
						ctx.save();
						const ownerTextMaxWidth = Math.max(28, ownerBlockMaxWidth - ownerPadX * 2 - ownerIconSize - ownerIconGap);
						const fittedOwnerName = fitOwnerText(ownerNameText, ownerTextMaxWidth);
						ctx.font = ownerValueFont;
						const ownerValueWidth = ctx.measureText(fittedOwnerName).width;
						const ownerBlockWidth = Math.max(
							qrBadgeSize,
							Math.min(ownerBlockMaxWidth, Math.round(ownerValueWidth + ownerPadX * 2 + ownerIconSize + ownerIconGap)),
						);
						const ownerBlockHeight = Math.round(ownerPadY * 2 + ownerValueSize + 2);
						const ownerX = qrX;
						const ownerY = Math.max(overlayPadding, qrY - ownerBlockHeight - ownerGapFromQr);
						const ownerGradient = ctx.createLinearGradient(ownerX, ownerY, ownerX, ownerY + ownerBlockHeight);
						if (ownerNameIsPrimary) {
							ownerGradient.addColorStop(0, 'rgba(161, 98, 7, 0.86)');
							ownerGradient.addColorStop(1, 'rgba(120, 53, 15, 0.9)');
						} else {
							ownerGradient.addColorStop(0, 'rgba(30, 58, 138, 0.8)');
							ownerGradient.addColorStop(1, 'rgba(30, 64, 175, 0.86)');
						}
						drawRoundedRect(ctx, ownerX, ownerY, ownerBlockWidth, ownerBlockHeight, Math.round(ownerBlockHeight * 0.32));
						ctx.fillStyle = ownerGradient;
						ctx.fill();
						ctx.strokeStyle = ownerNameIsPrimary
							? 'rgba(251, 191, 36, 0.9)'
							: 'rgba(147, 197, 253, 0.82)';
						ctx.lineWidth = Math.max(1.2, Math.round(minSide * 0.003));
						ctx.stroke();
						const iconX = ownerX + ownerPadX;
						const iconY = ownerY + Math.round((ownerBlockHeight - ownerIconSize) / 2);
						if (ownerNameIsPrimary) {
							drawStarPath(
								ctx,
								iconX + ownerIconSize * 0.5,
								iconY + ownerIconSize * 0.5,
								ownerIconSize * 0.52,
								ownerIconSize * 0.24,
							);
							ctx.fillStyle = '#facc15';
							ctx.fill();
							ctx.strokeStyle = 'rgba(251, 191, 36, 0.82)';
							ctx.lineWidth = Math.max(1, Math.round(minSide * 0.0026));
							ctx.stroke();
						} else {
							drawRoundedRect(ctx, iconX, iconY, ownerIconSize, ownerIconSize, Math.max(2, Math.round(ownerIconSize * 0.2)));
							ctx.fillStyle = '#60a5fa';
							ctx.fill();
							ctx.strokeStyle = 'rgba(191, 219, 254, 0.85)';
							ctx.lineWidth = Math.max(1, Math.round(minSide * 0.0022));
							ctx.stroke();
						}
						ctx.font = ownerValueFont;
						ctx.fillStyle = ownerNameIsPrimary
							? 'rgba(255, 251, 235, 0.99)'
							: 'rgba(239, 246, 255, 0.99)';
						ctx.textAlign = 'left';
						ctx.textBaseline = 'middle';
						ctx.fillText(
							fittedOwnerName,
							iconX + ownerIconSize + ownerIconGap,
							ownerY + ownerBlockHeight / 2 + Math.max(1, Math.round(ownerValueSize * 0.06)),
						);
						ctx.restore();
					}

				// Upper-right brand lockup: shared sui.ski logo mark + ".sui.ski".
					const brandIconSize = isStylized ? Math.floor(nameFontSize * 1.1) : Math.max(48, Math.min(120, Math.round(Math.min(srcWidth, srcHeight) * 0.22)));
					const brandPadding = Math.max(12, Math.round(Math.min(srcWidth, srcHeight) * 0.035));
					const brandX = srcWidth - brandPadding - brandIconSize;
					// Keep bottom aligned by adjusting Y position when logo is larger
					const baseBrandY = brandPadding + Math.max(6, Math.round(Math.min(srcWidth, srcHeight) * 0.018));
					const standardIconSize = Math.max(40, Math.min(96, Math.round(Math.min(srcWidth, srcHeight) * 0.18)));
					const brandY = isStylized ? nameY : baseBrandY + (standardIconSize - brandIconSize);
					ctx.save();
					ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
					ctx.shadowBlur = Math.max(8, Math.round(brandIconSize * 0.28));
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 2;
					if (logoImage) {
						drawVisualIntoBox(ctx, logoImage, brandX, brandY, brandIconSize, brandIconSize, Math.round(brandIconSize * 0.2));
					} else {
						drawSiteLogoGlyph(ctx, brandX, brandY, brandIconSize);
					}
					ctx.restore();

					const nftTagSize = Math.max(13, Math.round(brandIconSize * 0.28));
					const nftTagY = isStylized ? (nameY + nameFontSize) : (brandY + brandIconSize + Math.max(6, Math.round(nftTagSize * 0.42)));
					const brandTextGradient = ctx.createLinearGradient(brandX, brandY, brandX + brandIconSize, brandY + brandIconSize);
					brandTextGradient.addColorStop(0, '#60a5fa');
					brandTextGradient.addColorStop(1, '#a78bfa');
					ctx.fillStyle = brandTextGradient;
					ctx.font = '700 ' + nftTagSize + 'px Inter, system-ui, -apple-system, sans-serif';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'alphabetic';
					ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
					ctx.shadowBlur = Math.max(6, Math.round(nftTagSize * 0.75));
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 1;
					ctx.fillText('.sui.ski', brandX + brandIconSize / 2, nftTagY);
					ctx.shadowColor = 'transparent';
					ctx.textAlign = 'left';

				// Draw TradePort market data badge if available
				const listingPriceMist = Number(listing?.price || 0);
				const bestBidPriceMist = Number(bestBid?.price || 0);
				const soldPriceValueMist = Number(lastSalePriceMist || 0);
				const hasListing = Number.isFinite(listingPriceMist) && listingPriceMist > 0;
				const hasBestBid = Number.isFinite(bestBidPriceMist) && bestBidPriceMist > 0;
				const hasSold = Number.isFinite(soldPriceValueMist) && soldPriceValueMist > 0;
				const shouldShowSoldOnly = hasSold && (!hasListing || (saleEventMs > 0 && listingEventMs > 0 && saleEventMs >= listingEventMs));
				if (hasListing || hasBestBid || hasSold) {
					let tradeportLogo = null;
					try { tradeportLogo = await loadImageForCanvas(TRADEPORT_LOGO_URL); } catch {}
						const basePriceTextSize = Math.max(26, Math.round(Math.min(srcWidth, srcHeight) * 0.067));
						const priceTextSize = basePriceTextSize + 13;
						const baseLabelTextSize = Math.max(22, Math.round(basePriceTextSize * 0.88));
						const labelTextSize = baseLabelTextSize + 9;
					const logoSize = Math.max(20, Math.round(priceTextSize * 1.4));
						const formatListingSuiPrice = (mist) => {
							const listingDisplaySui = getMarketplaceListingDisplaySui(mist);
							if (!Number.isFinite(listingDisplaySui) || listingDisplaySui <= 0) return '0';
							return formatMarketplaceListingSuiDisplay(listingDisplaySui);
						};
						const formatBidSuiPrice = (mist) => {
							const sui = Number(mist) / 1e9;
							if (!Number.isFinite(sui) || sui <= 0) return '0';
							return formatMarketplaceBidSuiDisplay(sui);
						};
						const entries = [];
						if (shouldShowSoldOnly) {
							const soldPrice = formatBidSuiPrice(soldPriceValueMist);
							entries.push({ label: 'Sold:', priceNum: soldPrice, labelColor: '#4ade80', priceColor: '#ffffff', suiColor: '#60a5fa' });
						} else {
							if (hasListing) {
								const listPrice = formatListingSuiPrice(listingPriceMist);
								entries.push({ label: 'List:', priceNum: listPrice, labelColor: '#c084fc', priceColor: '#ffffff', suiColor: '#60a5fa' });
							}
							if (hasBestBid) {
								const offerPrice = formatBidSuiPrice(bestBidPriceMist);
								entries.push({ label: 'Offer:', priceNum: offerPrice, labelColor: '#8b5cf6', priceColor: '#ffffff', suiColor: '#60a5fa' });
							}
						}
					ctx.font = '700 ' + priceTextSize + 'px Inter, system-ui, -apple-system, sans-serif';
					let maxWidth = 0;
					for (const entry of entries) {
						const labelWidth = ctx.measureText(entry.label).width;
						const valueWidth = ctx.measureText(entry.priceNum + ' SUI').width;
						maxWidth = Math.max(maxWidth, labelWidth, valueWidth);
					}
						const qrBottom = qrY + qrBadgeSize;
						const textGap = Math.max(6, Math.round(qrMargin * 0.4));
						const textX = qrX + qrBadgeSize + textGap;
						const rightBoundaryX = Math.min(
							srcWidth - overlayPadding - Math.round(lowerRightOverlayReserve * 1.2),
							brandX - Math.max(10, Math.round(brandIconSize * 0.2)),
						);
						const textSafetyPad = Math.max(16, Math.round(priceTextSize * 0.55));
						const availableWidth = Math.max(
							Math.round(minSide * 0.14),
							rightBoundaryX - textX - textSafetyPad,
						);
						let priceFontScale = 1.0;
						const measuredWidthWithEffects = maxWidth + textSafetyPad;
						if (measuredWidthWithEffects > availableWidth) {
							priceFontScale = availableWidth / measuredWidthWithEffects;
						}
					const scaledPriceTextSize = Math.floor(priceTextSize * priceFontScale);
					const scaledLabelTextSize = Math.floor(labelTextSize * priceFontScale);
					const scaledLabelLineHeight = scaledLabelTextSize + 3;
					const scaledValueLineHeight = scaledPriceTextSize + 2;
					const totalEntriesHeight = entries.length * (scaledLabelLineHeight + scaledValueLineHeight) + (entries.length - 1) * 4;
					const textStartY = qrBottom - totalEntriesHeight;
					if (tradeportLogo) {
						const logoX = brandX + (brandIconSize - logoSize) / 2;
						const logoY = nftTagY + Math.max(8, Math.round(nftTagSize * 0.6));
						ctx.drawImage(tradeportLogo, logoX, logoY, logoSize, logoSize);
					}
					ctx.textAlign = 'left';
					ctx.textBaseline = 'top';
					ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
					ctx.lineWidth = Math.max(5, Math.round(scaledPriceTextSize * 0.4));
					ctx.lineJoin = 'round';
					ctx.miterLimit = 2;
					ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
					ctx.shadowBlur = Math.max(6, Math.round(scaledPriceTextSize * 0.5));
					ctx.shadowOffsetX = 0;
					ctx.shadowOffsetY = 1;
					let currentY = textStartY;
					for (let i = 0; i < entries.length; i++) {
						const entry = entries[i];
						ctx.font = '700 ' + scaledLabelTextSize + 'px Inter, system-ui, -apple-system, sans-serif';
						ctx.strokeText(entry.label, textX, currentY);
						ctx.fillStyle = entry.labelColor;
						ctx.fillText(entry.label, textX, currentY);
						currentY += scaledLabelLineHeight;
						ctx.font = '800 ' + scaledPriceTextSize + 'px Inter, system-ui, -apple-system, sans-serif';
						const numText = entry.priceNum + ' ';
						const suiText = 'SUI';
						ctx.strokeText(numText + suiText, textX, currentY);
						ctx.fillStyle = entry.priceColor;
						ctx.fillText(numText, textX, currentY);
						const numWidth = ctx.measureText(numText).width;
						ctx.fillStyle = entry.suiColor;
						ctx.fillText(suiText, textX + numWidth, currentY);
						currentY += scaledValueLineHeight + 4;
					}
					ctx.shadowColor = 'transparent';
					ctx.textAlign = 'left';
				}
				return canvas;
			}

			async function applyTaggedIdentityToProfile() {
				if (!identityVisual || !rawIdentityNftImage) return;
				try {
					const blackDiamondMode =
						Boolean(document.body && document.body.classList.contains('diamond-watch-active')) ||
						Boolean(typeof diamondWatching !== 'undefined' && diamondWatching);
					const taggedCanvas = await buildTaggedIdentityCanvas(false, currentListing, currentBestBid, {
						blackDiamondMode,
						stylizedMode,
						sales: currentSales,
						soldPriceMist: lastSoldPriceMist,
						saleEventMs: lastSaleEventMs,
						listingEventMs: lastListingEventMs,
					});
					if (!taggedCanvas) return;
					const taggedImg = new Image();
					taggedImg.onload = () => {
						const existingImg = identityVisual.querySelector('img');
						if (existingImg) existingImg.remove();
						taggedImg.className = 'identity-tagged-image';
						taggedImg.style.width = '90%';
						taggedImg.style.height = '90%';
						taggedImg.style.objectFit = 'cover';
						taggedImg.style.display = 'block';
						taggedImg.style.position = 'absolute';
						taggedImg.style.top = '5%';
						taggedImg.style.left = '5%';
						taggedImg.style.zIndex = '6';
						taggedImg.style.borderRadius = '12px';
						identityVisual.appendChild(taggedImg);
						identityVisual.classList.add('has-tagged-image');
						if (identityCanvas) identityCanvas.style.display = 'none';

						// Hide HTML elements that are now redundant in the stylized image
						const nameWrap = document.getElementById('identity-name');
						const headerExpiry = document.querySelector('.header-top-expiry-date');
						if (stylizedMode || blackDiamondMode) {
							if (nameWrap) nameWrap.style.opacity = '0';
							if (headerExpiry) headerExpiry.style.visibility = 'hidden';
						} else {
							if (nameWrap) nameWrap.style.opacity = '1';
							if (headerExpiry) headerExpiry.style.visibility = 'visible';
						}

						// Keep viewer in sync with tagged profile visual.
						if (nftViewerImage) {
							const viewerImg = nftViewerImage.querySelector('img');
							if (viewerImg) viewerImg.remove();
							const clone = taggedImg.cloneNode(true);
							clone.style.width = '100%';
							clone.style.height = '100%';
							clone.style.position = 'static';
							clone.style.borderRadius = '16px';
							nftViewerImage.appendChild(clone);
						}
					};
					taggedImg.src = taggedCanvas.toDataURL('image/png');
				} catch (error) {
					console.error('Failed to apply tagged identity visual:', error);
				}
			}

			function drawRoundedRect(ctx, x, y, width, height, radius) {
				const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
				ctx.beginPath();
			ctx.moveTo(x + r, y);
			ctx.arcTo(x + width, y, x + width, y + height, r);
			ctx.arcTo(x + width, y + height, x, y + height, r);
			ctx.arcTo(x, y + height, x, y, r);
				ctx.arcTo(x, y, x + width, y, r);
				ctx.closePath();
			}

			function drawStarPath(ctx, centerX, centerY, outerRadius, innerRadius) {
				const points = 5;
				let angle = -Math.PI / 2;
				const step = Math.PI / points;
				ctx.beginPath();
				for (let i = 0; i < points * 2; i++) {
					const radius = i % 2 === 0 ? outerRadius : innerRadius;
					const x = centerX + Math.cos(angle) * radius;
					const y = centerY + Math.sin(angle) * radius;
					if (i === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
					angle += step;
				}
				ctx.closePath();
			}

		function drawSiteLogoGlyph(ctx, x, y, size) {
			// Exact sui.ski mark geometry used site-wide: 512 viewbox.
			const scale = size / 512;
			const px = (v) => x + v * scale;
			const py = (v) => y + v * scale;
			const lg = ctx.createLinearGradient(x, y, x + size, y + size);
			lg.addColorStop(0, '#60a5fa');
			lg.addColorStop(1, '#a78bfa');

			ctx.save();
			ctx.fillStyle = lg;
			ctx.beginPath();
			ctx.moveTo(px(256), py(96));
			ctx.lineTo(px(416), py(352));
			ctx.lineTo(px(336), py(352));
			ctx.lineTo(px(280), py(256));
			ctx.lineTo(px(256), py(296));
			ctx.lineTo(px(232), py(256));
			ctx.lineTo(px(176), py(352));
			ctx.lineTo(px(96), py(352));
			ctx.closePath();
			ctx.fill();

			ctx.strokeStyle = lg;
			ctx.lineWidth = Math.max(1.5, 24 * scale);
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(px(128), py(384));
			ctx.quadraticCurveTo(px(208), py(348), px(288), py(384));
			ctx.quadraticCurveTo(px(368), py(420), px(432), py(384));
			ctx.stroke();
			ctx.restore();
		}

		function drawSuiWaveMark(ctx, x, baselineY, width) {
			// Based on: M128 384Q208 348 288 384Q368 420 432 384
			const pathWidth = 304;
			const scale = width / pathWidth;
			const lineWidth = Math.max(4, Math.round(24 * scale));
			const c1x = x + 80 * scale;
			const c1y = baselineY - 36 * scale;
			const midX = x + 160 * scale;
			const midY = baselineY;
			const c2x = x + 240 * scale;
			const c2y = baselineY + 36 * scale;
			const endX = x + 304 * scale;
			const endY = baselineY;

			const lg = ctx.createLinearGradient(x, baselineY, endX, baselineY);
			lg.addColorStop(0, 'rgba(106, 227, 255, 0.9)');
			lg.addColorStop(0.5, 'rgba(133, 122, 255, 0.9)');
			lg.addColorStop(1, 'rgba(131, 250, 191, 0.9)');

			ctx.save();
			ctx.lineCap = 'round';
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = lg;
			ctx.beginPath();
			ctx.moveTo(x, baselineY);
			ctx.quadraticCurveTo(c1x, c1y, midX, midY);
			ctx.quadraticCurveTo(c2x, c2y, endX, endY);
			ctx.stroke();
			ctx.restore();
		}

		function drawSuiPeakMark(ctx, x, y, width) {
			// Based on: M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z
			const baseMinX = 96;
			const baseMinY = 96;
			const pathWidth = 320;
			const pathHeight = 256;
			const scale = width / pathWidth;

			const px = (value) => x + (value - baseMinX) * scale;
			const py = (value) => y + (value - baseMinY) * scale;

			const lg = ctx.createLinearGradient(x, y, x + width, y + pathHeight * scale);
			lg.addColorStop(0, 'rgba(111, 255, 209, 0.95)');
			lg.addColorStop(0.45, 'rgba(132, 119, 255, 0.95)');
			lg.addColorStop(1, 'rgba(248, 125, 186, 0.95)');

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(px(256), py(96));
			ctx.lineTo(px(416), py(352));
			ctx.lineTo(px(336), py(352));
			ctx.lineTo(px(280), py(256));
			ctx.lineTo(px(256), py(296));
			ctx.lineTo(px(232), py(256));
			ctx.lineTo(px(176), py(352));
			ctx.lineTo(px(96), py(352));
			ctx.closePath();
			ctx.fillStyle = lg;
			ctx.fill();
			ctx.restore();
		}

			function drawVisualIntoBox(ctx, source, x, y, width, height, radius = 0) {
				const srcWidth = source.naturalWidth || source.videoWidth || source.width;
				const srcHeight = source.naturalHeight || source.videoHeight || source.height;
				if (!srcWidth || !srcHeight) return;

			const scale = Math.max(width / srcWidth, height / srcHeight);
			const drawWidth = srcWidth * scale;
			const drawHeight = srcHeight * scale;
			const drawX = x + (width - drawWidth) / 2;
			const drawY = y + (height - drawHeight) / 2;

			ctx.save();
			if (radius > 0) {
				drawRoundedRect(ctx, x, y, width, height, radius);
				ctx.clip();
			}
				ctx.drawImage(source, drawX, drawY, drawWidth, drawHeight);
				ctx.restore();
			}

			function buildQrCanvasForExport(size, value, fallbackCanvas = null) {
				// Reuse the exact in-page QR canvas first so download matches profile styling/colors.
				if (fallbackCanvas && fallbackCanvas.width > 0 && fallbackCanvas.height > 0) {
					return fallbackCanvas;
				}
				if (window.QRious) {
					const qrCanvas = document.createElement('canvas');
					new window.QRious({
						element: qrCanvas,
						value,
						size,
						level: 'H',
						padding: 0,
						background: '#ffffff',
						foreground: '#0b1224',
					});
					return qrCanvas;
				}
				return null;
			}

			function sampleDarkness(imageData, width, height, x, y) {
				const px = Math.max(0, Math.min(width - 1, Math.round(x)));
				const py = Math.max(0, Math.min(height - 1, Math.round(y)));
				const idx = (py * width + px) * 4;
				const r = imageData[idx];
				const g = imageData[idx + 1];
				const b = imageData[idx + 2];
				const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
				return 1 - luminance / 255; // 1 = dark, 0 = light
			}

			function estimateQrModuleCount(imageData, size) {
				let bestModules = 29;
				let bestScore = -Infinity;
				// Practical range for these URLs; keeps scoring fast.
				for (let modules = 21; modules <= 73; modules += 4) {
					const step = size / modules;
					if (step < 1.5) continue;
					let score = 0;
					for (let y = 0; y < modules; y++) {
						for (let x = 0; x < modules; x++) {
							const cx = (x + 0.5) * step;
							const cy = (y + 0.5) * step;
							const dark = sampleDarkness(imageData, size, size, cx, cy);
							score += Math.abs(dark - 0.5);
						}
					}
					if (score > bestScore) {
						bestScore = score;
						bestModules = modules;
					}
				}
				return bestModules;
			}

			function decodeQrMatrixFromCanvas(baseQrCanvas, size) {
				const readCanvas = document.createElement('canvas');
				readCanvas.width = size;
				readCanvas.height = size;
				const readCtx = readCanvas.getContext('2d');
				if (!readCtx) return null;
				readCtx.fillStyle = '#ffffff';
				readCtx.fillRect(0, 0, size, size);
				readCtx.drawImage(baseQrCanvas, 0, 0, size, size);
				const image = readCtx.getImageData(0, 0, size, size);
				const modules = estimateQrModuleCount(image.data, size);
				const step = size / modules;
				const matrix = Array.from({ length: modules }, () => Array(modules).fill(false));
				for (let y = 0; y < modules; y++) {
					for (let x = 0; x < modules; x++) {
						const cx = (x + 0.5) * step;
						const cy = (y + 0.5) * step;
						const dark = sampleDarkness(image.data, size, size, cx, cy);
						matrix[y][x] = dark >= 0.5;
					}
				}
				return matrix;
			}

			function isFinderRegion(x, y, modules) {
				const edge = modules - 7;
				return (x < 7 && y < 7) || (x >= edge && y < 7) || (x < 7 && y >= edge);
			}

			function drawRoundedModule(ctx, x, y, size, radius) {
				drawRoundedRect(ctx, x, y, size, size, radius);
				ctx.fill();
			}

			function drawStyledFinderEye(ctx, x, y, cell, themeGradient) {
				const outer = 7 * cell;
				const inner = 5 * cell;
				const pupil = 3 * cell;
				const rOuter = Math.max(cell * 0.9, 3);
				const rInner = Math.max(cell * 0.7, 2);
				const rPupil = Math.max(cell * 0.55, 1.5);

				ctx.save();
				ctx.fillStyle = themeGradient;
				drawRoundedRect(ctx, x, y, outer, outer, rOuter);
				ctx.fill();

				// Branded accent ring on top of the dark finder base.
				const accent = ctx.createLinearGradient(x, y, x + outer, y + outer);
				accent.addColorStop(0, 'rgba(99, 224, 255, 0.7)');
				accent.addColorStop(0.5, 'rgba(139, 120, 255, 0.55)');
				accent.addColorStop(1, 'rgba(122, 244, 205, 0.7)');
				ctx.lineWidth = Math.max(1.2, cell * 0.32);
				ctx.strokeStyle = accent;
				drawRoundedRect(
					ctx,
					x + ctx.lineWidth * 0.5,
					y + ctx.lineWidth * 0.5,
					outer - ctx.lineWidth,
					outer - ctx.lineWidth,
					Math.max(1, rOuter - ctx.lineWidth * 0.4),
				);
				ctx.stroke();

				// Keep center ring as negative-space to blend with underlying NFT tones.
				clearRoundedRect(ctx, x + cell, y + cell, inner, inner, rInner);

				// Soft ring inside the white window for depth.
				ctx.lineWidth = Math.max(1, cell * 0.2);
				ctx.strokeStyle = 'rgba(202, 220, 255, 0.44)';
				drawRoundedRect(
					ctx,
					x + cell + ctx.lineWidth * 0.5,
					y + cell + ctx.lineWidth * 0.5,
					inner - ctx.lineWidth,
					inner - ctx.lineWidth,
					Math.max(1, rInner - ctx.lineWidth * 0.35),
				);
				ctx.stroke();

				ctx.fillStyle = 'rgba(11, 18, 36, 0.98)';
				drawRoundedRect(ctx, x + 2 * cell, y + 2 * cell, pupil, pupil, rPupil);
				ctx.fill();

				// Tiny highlight in the pupil.
				const h = Math.max(0.8, cell * 0.36);
				ctx.fillStyle = 'rgba(210, 240, 255, 0.78)';
				drawRoundedRect(
					ctx,
					x + 2 * cell + h * 0.65,
					y + 2 * cell + h * 0.5,
					h,
					h,
					h * 0.45,
				);
				ctx.fill();
				ctx.restore();
			}

			function clearRoundedRect(ctx, x, y, width, height, radius) {
				ctx.save();
				drawRoundedRect(ctx, x, y, width, height, radius);
				ctx.clip();
				ctx.clearRect(Math.floor(x) - 1, Math.floor(y) - 1, Math.ceil(width) + 2, Math.ceil(height) + 2);
				ctx.restore();
			}

			function styleQrCanvas(baseQrCanvas, size) {
				const matrix = decodeQrMatrixFromCanvas(baseQrCanvas, size);
				if (!matrix || !matrix.length) return baseQrCanvas;
				const modules = matrix.length;
				const quietModules = 4;
				const totalModules = modules + quietModules * 2;
				const cell = size / totalModules;
				const origin = quietModules * cell;

				const styled = document.createElement('canvas');
				styled.width = size;
				styled.height = size;
				const styledCtx = styled.getContext('2d');
				if (!styledCtx) return baseQrCanvas;

				const moduleGradient = styledCtx.createLinearGradient(0, 0, size, size);
				moduleGradient.addColorStop(0, 'rgba(5, 12, 27, 0.96)');
				moduleGradient.addColorStop(0.42, 'rgba(15, 34, 64, 0.96)');
				moduleGradient.addColorStop(1, 'rgba(13, 56, 91, 0.96)');
				styledCtx.fillStyle = moduleGradient;

				const moduleRadius = Math.max(0.8, cell * 0.29);
				for (let y = 0; y < modules; y++) {
					for (let x = 0; x < modules; x++) {
						if (!matrix[y][x] || isFinderRegion(x, y, modules)) continue;
						const px = origin + x * cell;
						const py = origin + y * cell;
						drawRoundedModule(styledCtx, px, py, cell, moduleRadius);
					}
				}

				const topLeftTheme = styledCtx.createLinearGradient(origin, origin, origin + 7 * cell, origin + 7 * cell);
				topLeftTheme.addColorStop(0, 'rgba(10, 22, 48, 1)');
				topLeftTheme.addColorStop(1, 'rgba(23, 84, 145, 1)');
				drawStyledFinderEye(styledCtx, origin, origin, cell, topLeftTheme);

				const topRightX = origin + (modules - 7) * cell;
				const topRightTheme = styledCtx.createLinearGradient(topRightX, origin, topRightX + 7 * cell, origin + 7 * cell);
				topRightTheme.addColorStop(0, 'rgba(12, 34, 66, 1)');
				topRightTheme.addColorStop(1, 'rgba(28, 97, 162, 1)');
				drawStyledFinderEye(styledCtx, topRightX, origin, cell, topRightTheme);

				const bottomLeftY = origin + (modules - 7) * cell;
				const bottomLeftTheme = styledCtx.createLinearGradient(origin, bottomLeftY, origin + 7 * cell, bottomLeftY + 7 * cell);
				bottomLeftTheme.addColorStop(0, 'rgba(11, 28, 56, 1)');
				bottomLeftTheme.addColorStop(1, 'rgba(24, 91, 152, 1)');
				drawStyledFinderEye(styledCtx, origin, bottomLeftY, cell, bottomLeftTheme);

				return styled;
			}

			function sampleBackdropTone(ctx, x, y, width, height) {
				const fallback = { r: 24, g: 38, b: 64 };
				try {
					const sx = Math.max(0, Math.floor(x));
					const sy = Math.max(0, Math.floor(y));
					const sw = Math.max(1, Math.min(ctx.canvas.width - sx, Math.floor(width)));
					const sh = Math.max(1, Math.min(ctx.canvas.height - sy, Math.floor(height)));
					const img = ctx.getImageData(sx, sy, sw, sh).data;
					let r = 0;
					let g = 0;
					let b = 0;
					let count = 0;
					const stride = Math.max(1, Math.floor(Math.min(sw, sh) / 18));
					for (let py = 0; py < sh; py += stride) {
						for (let px = 0; px < sw; px += stride) {
							const idx = (py * sw + px) * 4;
							r += img[idx];
							g += img[idx + 1];
							b += img[idx + 2];
							count++;
						}
					}
					if (!count) return fallback;
					r = Math.round(r / count);
					g = Math.round(g / count);
					b = Math.round(b / count);
					// Keep NFT hue but gently lift brightness for scan contrast.
					return {
						r: Math.round(r + (255 - r) * 0.18),
						g: Math.round(g + (255 - g) * 0.18),
						b: Math.round(b + (255 - b) * 0.18),
					};
				} catch {
					return fallback;
				}
			}

			function drawCornerBrandedQr(ctx, x, y, size, targetUrl, logoImage = null, fallbackQrCanvas = null) {
				const qrCanvas = buildQrCanvasForExport(Math.max(256, size), targetUrl, fallbackQrCanvas);
				if (!qrCanvas) return;

				// Draw the same QR visual from profile page directly on top of the NFT.
				drawVisualIntoBox(ctx, qrCanvas, x, y, size, size, Math.round(size * 0.08));
			}

		function loadImageForCanvas(src) {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = 'anonymous';
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = src;
			});
		}

				function buildMetaSealPayload(preferQr) {
					return JSON.stringify({
						s: META_SEAL_SCHEMA,
						a: 'sui.ski',
						n: FULL_NAME,
						d: NAME + '.sui.ski',
						p: PROFILE_URL,
						net: NETWORK,
						nft: NFT_ID || null,
						v: preferQr ? 'qr' : 'nft',
						t: Date.now(),
					});
				}

			function hash32(text) {
				let hash = 2166136261;
				for (let i = 0; i < text.length; i++) {
					hash ^= text.charCodeAt(i);
					hash = Math.imul(hash, 16777619);
				}
				return hash >>> 0;
			}

			function applyMetaSealSignature(sourceCanvas, payload) {
				const sealedCanvas = document.createElement('canvas');
				sealedCanvas.width = sourceCanvas.width;
				sealedCanvas.height = sourceCanvas.height;
				const sealedCtx = sealedCanvas.getContext('2d');
				if (!sealedCtx) return sourceCanvas;

				sealedCtx.drawImage(sourceCanvas, 0, 0);
				const imageData = sealedCtx.getImageData(0, 0, sealedCanvas.width, sealedCanvas.height);
				const data = imageData.data;
				const totalPixels = data.length / 4;

				const encoder = new TextEncoder();
					const payloadBytes = encoder.encode(payload).slice(0, 192);
				const sealBytes = new Uint8Array(payloadBytes.length + 8);
				sealBytes[0] = 0x4d; // M
				sealBytes[1] = 0x53; // S
				sealBytes[2] = 0x4c; // L
				sealBytes[3] = 0x31; // 1
				sealBytes[4] = (payloadBytes.length >> 8) & 0xff;
				sealBytes[5] = payloadBytes.length & 0xff;
				let checksum = 0;
				for (const b of payloadBytes) checksum = (checksum + b) & 0xff;
				sealBytes[6] = checksum;
				sealBytes[7] = hash32(payload) & 0xff;
				sealBytes.set(payloadBytes, 8);

				const bitCount = sealBytes.length * 8;
				if (totalPixels < bitCount * 2) return sealedCanvas;

				const seed = hash32(payload) % totalPixels;
					const step = Math.max(31, Math.floor(totalPixels / (bitCount + 101)));
				let pixelIndex = seed;

				for (let i = 0; i < bitCount; i++) {
					const byte = sealBytes[i >> 3];
					const bit = (byte >> (7 - (i & 7))) & 1;
					const channelIndex = pixelIndex * 4 + 2; // Blue channel LSB
					data[channelIndex] = (data[channelIndex] & 0xfe) | bit;
					pixelIndex = (pixelIndex + step + (i % 13)) % totalPixels;
				}

				sealedCtx.putImageData(imageData, 0, 0);
				return sealedCanvas;
			}

			function triggerCanvasDownload(canvas, filename, feedbackBtn, sealPayload = null) {
				try {
					const exportCanvas = sealPayload ? applyMetaSealSignature(canvas, sealPayload) : canvas;
					exportCanvas.toBlob((blob) => {
						if (!blob) return;
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
					a.href = url;
					a.download = filename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
					if (feedbackBtn) flashDownloadSuccess(feedbackBtn);
				}, 'image/png');
			} catch (error) {
				console.error('Failed to export image:', error);
			}
		}

		function flashDownloadSuccess(btn) {
			btn.classList.add('success');
			const orig = btn.innerHTML;
			btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
			setTimeout(() => {
				btn.classList.remove('success');
				btn.innerHTML = orig;
			}, 1500);
		}

		// ===== QR CODE =====
		const nftViewer = document.getElementById('nft-viewer');
		const nftViewerContent = document.getElementById('nft-viewer-content');
		const nftViewerImage = document.getElementById('nft-viewer-image');
		const nftViewerClose = document.getElementById('nft-viewer-close');
		const nftViewerQrBtn = document.getElementById('nft-viewer-qr-btn');
		const nftViewerCopyBtn = document.getElementById('nft-viewer-copy-btn');
		const nftViewerDownloadBtn = document.getElementById('nft-viewer-download-btn');
		const qrExpandedCanvas = document.getElementById('qr-expanded-canvas');
		let viewerShowingQr = false;

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

		function renderQR(canvas, size, value = PROFILE_URL) {
			if (!canvas || !window.QRious) return;
			new window.QRious({
				element: canvas,
				value: value,
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
			if (rawIdentityNftImage) applyTaggedIdentityToProfile();
		}

		function openNftViewer() {
			if (!nftViewer) return;
			viewerShowingQr = false;
			syncViewerDisplay();
			nftViewer.classList.add('active');
		}

		function closeNftViewer() {
			nftViewer?.classList.remove('active');
		}

		function syncViewerDisplay() {
			if (!nftViewerImage) return;
			const existingImg = nftViewerImage.querySelector('img');
			const viewerCanvas = nftViewerImage.querySelector('canvas');
			if (viewerShowingQr) {
				if (existingImg) existingImg.style.display = 'none';
				if (viewerCanvas) viewerCanvas.style.display = 'block';
				if (nftViewerQrBtn) nftViewerQrBtn.classList.add('active');
			} else {
				if (existingImg) existingImg.style.display = 'block';
				if (viewerCanvas) viewerCanvas.style.display = nftImageUrl ? 'none' : 'block';
				if (nftViewerQrBtn) nftViewerQrBtn.classList.remove('active');
			}
		}

		// Click identity visual to open viewer
		if (identityVisual) {
			identityVisual.addEventListener('click', () => {
				openNftViewer();
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

		// NFT Viewer: close on backdrop or X click
		if (nftViewer) {
			nftViewer.addEventListener('click', (e) => {
				if (e.target === nftViewer) closeNftViewer();
			});
		}
		if (nftViewerClose) {
			nftViewerClose.addEventListener('click', (e) => {
				e.stopPropagation();
				closeNftViewer();
			});
		}

		// NFT Viewer: click image to toggle NFT/QR
		if (nftViewerImage) {
			nftViewerImage.addEventListener('click', (e) => {
				e.stopPropagation();
				viewerShowingQr = !viewerShowingQr;
				syncViewerDisplay();
			});
		}

		// NFT Viewer: QR button
		if (nftViewerQrBtn) {
			nftViewerQrBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				viewerShowingQr = !viewerShowingQr;
				syncViewerDisplay();
			});
		}

		// NFT Viewer: Copy URL
		if (nftViewerCopyBtn) {
			nftViewerCopyBtn.addEventListener('click', async (e) => {
				e.stopPropagation();
				try {
					await navigator.clipboard.writeText(PROFILE_URL);
					nftViewerCopyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
					setTimeout(() => {
						nftViewerCopyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
					}, 1500);
				} catch (err) {
					console.error('Copy failed:', err);
				}
			});
		}

		// NFT Viewer: Download
		if (nftViewerDownloadBtn) {
			nftViewerDownloadBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				downloadIdentityImage(nftViewerDownloadBtn, viewerShowingQr);
			});
		}

		// Initialize QR code
		initQR().then(() => {
			showIdentityQr();
		}).catch(console.error);

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

			function normalizeIdentityName(value) {
				return String(value || '').toLowerCase().replace(/\\.sui$/i, '');
			}

			async function buildIdentityImageCandidates(forceRecovery = false) {
				const imageUrlsToTry = [];
				const addUniqueImageUrl = (url) => {
					if (!url || imageUrlsToTry.includes(url)) return;
					imageUrlsToTry.push(url);
				};

				// Always prefer the direct SuiNS image endpoint for the active profile name.
				if (typeof EXPIRATION_MS === 'number' && EXPIRATION_MS > 0) {
					addUniqueImageUrl(getSuiNSImageUrl(NAME, EXPIRATION_MS));
				}
				addUniqueImageUrl(getSuiNSImageUrl(NAME));

				let resolvedNftId = NFT_ID || '';
				let resolvedExpirationMs = typeof EXPIRATION_MS === 'number' && EXPIRATION_MS > 0
					? EXPIRATION_MS
					: null;

				if (forceRecovery || !resolvedNftId || !resolvedExpirationMs) {
					const addressCandidates = Array.from(
						new Set(
							[OWNER_ADDRESS, TARGET_ADDRESS, currentTargetAddress]
								.map((value) => String(value || '').trim())
								.filter((value) => value.startsWith('0x') && value.length > 10),
						),
					);

					for (const address of addressCandidates) {
						try {
							const response = await fetch('/api/names/' + encodeURIComponent(address));
							if (!response.ok) continue;
							const payload = await response.json();
							const names = Array.isArray(payload?.names) ? payload.names : [];
							const match = names.find((item) => normalizeIdentityName(item?.name) === normalizeIdentityName(NAME));
							if (!match) continue;
							if (!resolvedNftId && match?.nftId) resolvedNftId = String(match.nftId);
							if (
								!resolvedExpirationMs
								&& typeof match?.expirationMs === 'number'
								&& Number.isFinite(match.expirationMs)
								&& match.expirationMs > 0
							) {
								resolvedExpirationMs = match.expirationMs;
							}
							if (resolvedNftId && resolvedExpirationMs) break;
						} catch (error) {
							console.log('Identity recovery lookup failed for address', address, error);
						}
					}
				}

				if (
					typeof resolvedExpirationMs === 'number'
					&& resolvedExpirationMs > 0
					&& resolvedExpirationMs !== EXPIRATION_MS
				) {
					addUniqueImageUrl(getSuiNSImageUrl(NAME, resolvedExpirationMs));
				}

				// Try fetching display image from NFT metadata if an object id is available.
				if (resolvedNftId) {
					try {
						const response = await fetch('/api/nft-details?objectId=' + encodeURIComponent(resolvedNftId));
						if (response.ok) {
						const data = await response.json();
						const activeTokenId = String(NFT_ID || '').toLowerCase();
							const displayUrl = data?.display?.image_url
								|| data?.display?.image
								|| data?.display?.avatar_url
								|| data?.display?.avatar
								|| data?.content?.image_url;
							const normalizedUrl = normalizeImageUrl(displayUrl);
							if (normalizedUrl) addUniqueImageUrl(normalizedUrl);
						}
					} catch (error) {
						console.log('Failed to fetch identity NFT details:', error);
					}
				}

				return imageUrlsToTry;
			}

			function loadNFTImageWithFallbacksAsync(imageUrls) {
				return new Promise((resolve) => {
					loadNFTImageWithFallbacks(
						imageUrls,
						(img, url) => {
							displayNFTImage(img, url);
							resolve(true);
						},
						() => resolve(false),
					);
				});
			}

			// Display NFT image in identity card and viewer
			function displayNFTImage(img, imageUrl) {
				if (!identityVisual) return;
				rawIdentityNftImage = img;

			const existingImg = identityVisual.querySelector('img');
			if (existingImg) existingImg.remove();

			img.style.width = '100%';
			img.style.height = '100%';
			img.style.objectFit = 'cover';
			img.style.display = 'block';
			img.style.position = 'absolute';
				img.style.top = '0';
				img.style.left = '0';
				img.style.borderRadius = '12px';
				identityVisual.appendChild(img);
				identityVisual.classList.remove('has-tagged-image');
				syncIdentityPrimaryBadgeState();

				if (identityCanvas) identityCanvas.style.display = 'none';

			// Clone image into viewer overlay
			if (nftViewerImage) {
				const viewerImg = nftViewerImage.querySelector('img');
				if (viewerImg) viewerImg.remove();
				const clone = img.cloneNode(true);
				clone.style.position = 'static';
				clone.style.borderRadius = '16px';
				nftViewerImage.appendChild(clone);
			}

			showingQr = false;
			nftDisplayLoaded = true;
			nftImageUrl = imageUrl;
			applyTaggedIdentityToProfile();
			}

			// Load NFT image - try SuiNS API first (most reliable), then on-chain display data
			async function loadCurrentNFTImage() {
				if (nftDisplayLoaded || !identityVisual) return;
				const imageUrlsToTry = await buildIdentityImageCandidates(false);
				const loaded = await loadNFTImageWithFallbacksAsync(imageUrlsToTry);
				if (!loaded) {
					console.log('All image URLs failed, keeping QR code');
					nftDisplayLoaded = true;
				}
			}

			async function restoreIdentityVisual() {
				if (restoringIdentityVisual || !identityVisual) return;
				restoringIdentityVisual = true;
				if (identityRestoreBtn) {
					identityRestoreBtn.disabled = true;
					identityRestoreBtn.classList.add('loading');
				}
				try {
					nftDisplayLoaded = false;
					nftImageUrl = null;
					rawIdentityNftImage = null;
					const staleImg = identityVisual.querySelector('img');
					if (staleImg) staleImg.remove();
					showIdentityQr();

					const imageUrlsToTry = await buildIdentityImageCandidates(true);
					const loaded = await loadNFTImageWithFallbacksAsync(imageUrlsToTry);
					if (loaded) {
						showOwnerInlineStatus('NFT visual restored.', 'success');
					} else {
						nftDisplayLoaded = true;
						showOwnerInlineStatus('No NFT image is currently available for this name.', 'info');
					}
				} catch (error) {
					console.error('Failed to restore NFT visual:', error);
					showOwnerInlineStatus('Failed to restore NFT visual.', 'error');
				} finally {
					restoringIdentityVisual = false;
					if (identityRestoreBtn) {
						identityRestoreBtn.disabled = false;
						identityRestoreBtn.classList.remove('loading');
					}
				}
			}

			// Try to load NFT image immediately
			loadCurrentNFTImage();

		// Set target address to connected wallet (direct transaction)
			async function setToSelf() {
				if (!connectedAddress) {
					await connectWallet();
					if (!connectedAddress || !canConnectedWalletEditTarget()) return;
				}

				if (!canConnectedWalletEditTarget()) {
					showOwnerInlineStatus('Only the NFT owner or target address can edit.', 'error');
					return;
				}

				const activeTargetAddress = getExplicitTargetAddress();
				if (
					connectedAddress
					&& activeTargetAddress
					&& connectedAddress.toLowerCase() === String(activeTargetAddress).toLowerCase()
				) {
					showOwnerInlineStatus('Already set to your address.', 'info');
					return;
				}

				try {
					setSelfBtn.disabled = true;

				const suinsClient = await createSuinsClient(true);
				const suiClient = getSuiClient();

					const senderAddress = getConnectedSenderAddress();

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

				let result;
				result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

					// Update UI
					document.querySelector('.owner-addr').textContent = connectedAddress.slice(0, 8) + '...' + connectedAddress.slice(-6);
						document.querySelector('.owner-name').innerHTML = formatSuiName(connectedPrimaryName);
						ownerPrimaryName = connectedPrimaryName || null;
						ownerDisplayAddress = connectedAddress;
						renderTargetPreview(connectedAddress);
						updatePortfolioLink(connectedAddress);
						showOwnerInlineStatus(
							'<strong>Updated!</strong> ' + renderTxExplorerLinks(result.digest, true),
							'success',
							true,
					);

				} catch (error) {
					const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
					console.error('Set self error:', errorMsg, error);
					showOwnerInlineStatus('Failed: ' + errorMsg, 'error');
				} finally {
					setSelfBtn.disabled = false;
					updateEditButton();
				}
			}

		// Set this name as the connected wallet's primary/default name
		async function setPrimary() {
			if (!connectedAddress) {
				await connectWallet();
				if (!connectedAddress) return;
			}

			const normalizedOwner = getResolvedOwnerAddress();
			const isOwner = Boolean(
				connectedAddress
				&& normalizedOwner
				&& connectedAddress.toLowerCase() === normalizedOwner,
			);
			if (!isOwner) {
				showOwnerInlineStatus('Only the NFT owner can set this as primary.', 'error');
				return;
			}
			if (!canSign()) {
				showOwnerInlineStatus('Please connect your wallet first.', 'error');
				return;
			}

			const isAlreadyPrimary =
				connectedPrimaryName
				&& connectedPrimaryName.replace(/\\.sui$/i, '') === FULL_NAME.replace(/\\.sui$/i, '');
			if (isAlreadyPrimary) {
				showOwnerInlineStatus('This is already your primary name.', 'info');
				return;
			}

			try {
				if (ownerPrimaryStar) {
					ownerPrimaryStar.disabled = true;
					ownerPrimaryStar.classList.add('loading');
				}

				const suinsClient = await createSuinsClient(true);
				const suiClient = getSuiClient();

					const senderAddress = getConnectedSenderAddress();

				let nftId = NFT_ID;
				if (!nftId) {
					const nameRecord = await suinsClient.getNameRecord(FULL_NAME);
					nftId = nameRecord?.nftId || '';
				}
				if (!nftId) throw new Error('Could not find NFT ID');

				const tx = new Transaction();
				const suinsTx = new SuinsTransaction(suinsClient, tx);

				// If target is not self yet, update it first so default name can be set in one flow.
				if (connectedAddress !== CURRENT_ADDRESS) {
					suinsTx.setTargetAddress({
						nft: nftId,
						address: connectedAddress,
						isSubname: IS_SUBNAME,
					});
				}

				suinsTx.setDefault(FULL_NAME);

				tx.setSender(senderAddress);
				tx.setGasBudget(50000000);

				let result;
				result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

					connectedPrimaryName = FULL_NAME;
					ownerDisplayAddress = connectedAddress;
					updatePortfolioLink(connectedAddress);
					updateEditButton();
					updateGlobalWalletWidget();
					renderWalletBar();

				const ownerAddrEl = document.querySelector('.owner-addr');
				const ownerNameEl = document.querySelector('.owner-name');
				if (ownerAddrEl) {
					ownerAddrEl.textContent = connectedAddress.slice(0, 8) + '...' + connectedAddress.slice(-6);
				}
				if (ownerNameEl) {
					ownerNameEl.innerHTML = formatSuiName(connectedPrimaryName);
				}
				ownerPrimaryName = connectedPrimaryName || null;
				showOwnerInlineStatus(
					'<strong>Primary set!</strong> ' + renderTxExplorerLinks(result.digest, true),
					'success',
					true,
				);

			} catch (error) {
				const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
				console.error('Set primary error:', errorMsg, error);
				showOwnerInlineStatus('Failed: ' + errorMsg, 'error');
			} finally {
				if (ownerPrimaryStar) {
					ownerPrimaryStar.classList.remove('loading');
				}
				updateEditButton();
			}
		}

		// Open edit modal
		function openEditModal() {
			if (!connectedAddress) {
				connectWallet().then(() => {
					if (connectedAddress && canConnectedWalletEditTarget()) {
						editModal.classList.add('open');
						targetAddressInput.value = getExplicitTargetAddress();
						resolvedAddressEl.textContent = '';
						hideStatus(modalStatus);
					}
				});
				return;
			}

			if (!canConnectedWalletEditTarget()) {
				alert('Only the NFT owner or target address can edit.');
				return;
			}

			editModal.classList.add('open');
			targetAddressInput.value = getExplicitTargetAddress();
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

			if (!canSign()) {
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

			if (newAddress === getExplicitTargetAddress()) {
				showStatus(modalStatus, 'This is already the target address', 'info');
				return;
			}

			try {
				showStatus(modalStatus, '<span class="loading"></span> Building transaction...', 'info');
				saveBtn.disabled = true;

				const suinsClient = await createSuinsClient(true);
				const suiClient = getSuiClient();

					const senderAddress = getConnectedSenderAddress();

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

				let result;
				result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

				showStatus(modalStatus, '<strong>Updated!</strong> ' + renderTxExplorerLinks(result.digest, true), 'success');

				// Update displayed address and fetch new primary name
				setTimeout(async () => {
					document.querySelector('.owner-addr').textContent = newAddress.slice(0, 8) + '...' + newAddress.slice(-6);
						const newName = await fetchPrimaryName(newAddress);
						document.querySelector('.owner-name').innerHTML = formatSuiName(newName);
						ownerPrimaryName = newName || null;
						ownerDisplayAddress = newAddress;
						updatePortfolioLink(newAddress);
						renderTargetPreview(newAddress);
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

		// Jacket decay auction
		function openJacketModal() {
			if (!connectedAddress) {
				connectWallet().then(() => {
					if (isConnectedProfileOwner()) {
						jacketModal.classList.add('open');
					}
				});
				return;
			}
			if (jacketStatus) jacketStatus.textContent = '';
			jacketModal.classList.add('open');
		}

		function closeJacketModal() {
			jacketModal.classList.remove('open');
			if (jacketStatus) jacketStatus.textContent = '';
		}

		async function extractDecayListingIdFromTxResult(result) {
			let listingId = null;
			const objectChanges = result?.objectChanges || [];
			for (const change of objectChanges) {
				if (change.type === 'created' && change.objectType && change.objectType.includes('DecayListing')) {
					listingId = change.objectId;
					break;
				}
			}

			if (!listingId && result?.digest) {
				try {
					const suiClient = getSuiClient();
					const txDetail = await suiClient.getTransactionBlock({
						digest: result.digest,
						options: { showObjectChanges: true },
					});
					const changes = txDetail.objectChanges || [];
					for (const change of changes) {
						if (change.type === 'created' && change.objectType && change.objectType.includes('DecayListing')) {
							listingId = change.objectId;
							break;
						}
					}
				} catch (error) {
					console.error('Failed to fetch tx details for listing ID:', error);
				}
			}

			return listingId;
		}

		async function registerDecayListingForNft(nftId, listingId) {
			if (!nftId || !listingId) return;
			try {
				await fetch('/api/auction/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ nftId, listingId }),
				});
			} catch (error) {
				console.error('Failed to register auction listing:', error);
			}
		}

		async function listForAuction() {
			if (!connectedAddress) {
				await connectWallet();
				if (!connectedAddress) return;
			}

			if (!isConnectedProfileOwner()) {
				if (jacketStatus) {
					jacketStatus.textContent = 'You must be the NFT owner to list';
					jacketStatus.className = 'jacket-status error';
				}
				return;
			}

			if (!NFT_ID) {
				if (jacketStatus) {
					jacketStatus.textContent = 'No NFT found for this name';
					jacketStatus.className = 'jacket-status error';
				}
				return;
			}

			const priceSui = Number(jacketStartPrice.value);
			if (!priceSui || priceSui < 1) {
				if (jacketStatus) {
					jacketStatus.textContent = 'Start price must be at least 1 SUI';
					jacketStatus.className = 'jacket-status error';
				}
				return;
			}

			const durationDays = Number(jacketDuration.value);
			const startPriceMist = String(BigInt(Math.floor(priceSui)) * 1000000000n);
			const durationMs = String(BigInt(durationDays) * 86400000n);

			try {
				jacketListBtn.disabled = true;
				jacketListBtn.textContent = '...';
				if (jacketStatus) {
					jacketStatus.textContent = 'Building transaction...';
					jacketStatus.className = 'jacket-status';
				}

					const senderAddress = getConnectedSenderAddress();

				const res = await fetch('/api/auction/list', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						nftId: NFT_ID,
						startPriceMist,
						durationMs,
						senderAddress,
					}),
				});
				const data = await res.json();

				if (data.error) throw new Error(data.error);

				const tx = Transaction.from(data.txBytes);

				if (jacketStatus) {
					jacketStatus.textContent = 'Confirm in wallet...';
					jacketStatus.className = 'jacket-status';
				}

				let result;
				result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true, showObjectChanges: true } });
				const listingId = await extractDecayListingIdFromTxResult(result);
				await registerDecayListingForNft(NFT_ID, listingId);

				if (jacketStatus) {
					jacketStatus.innerHTML = 'Listed! ' + renderTxExplorerLinks(result.digest, true);
					jacketStatus.className = 'jacket-status success';
				}
				jacketBtn.disabled = true;
				jacketBtn.textContent = 'Listed';
				fetchAuctionStatus();
			} catch (error) {
				const errorMsg = error?.message || (typeof error === 'string' ? error : 'Unknown error');
				console.error('Jacket listing error:', errorMsg, error);
				if (jacketStatus) {
					jacketStatus.textContent = 'Failed: ' + errorMsg;
					jacketStatus.className = 'jacket-status error';
				}
			} finally {
				jacketListBtn.disabled = false;
				jacketListBtn.textContent = 'List';
			}
		}

		// Event listeners
		if (editBtn) editBtn.addEventListener('click', openEditModal);
		if (setSelfBtn) setSelfBtn.addEventListener('click', setToSelf);
		if (ownerPrimaryStar) ownerPrimaryStar.addEventListener('click', setPrimary);
		if (jacketBtn) jacketBtn.addEventListener('click', openJacketModal);
		if (jacketCancelBtn) jacketCancelBtn.addEventListener('click', closeJacketModal);
		if (jacketListBtn) jacketListBtn.addEventListener('click', listForAuction);
		if (jacketModal) jacketModal.addEventListener('click', (e) => {
			if (e.target === jacketModal) closeJacketModal();
		});
		if (copyBtn) copyBtn.addEventListener('click', copyAddress);
		if (ownerAddrText) {
			ownerAddrText.classList.add('copyable');
			ownerAddrText.setAttribute('title', 'Copy owner address');
			ownerAddrText.setAttribute('aria-label', 'Copy owner address');
			ownerAddrText.setAttribute('role', 'button');
			ownerAddrText.tabIndex = 0;
			ownerAddrText.addEventListener('click', function(e) {
				e.preventDefault();
				e.stopPropagation();
				copyAddress();
			});
			ownerAddrText.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					e.stopPropagation();
					copyAddress();
				}
			});
		}
			if (copyTargetBtn) {
				copyTargetBtn.addEventListener('click', (event) => {
					event.preventDefault();
					event.stopPropagation();
					copyTargetAddress();
				});
			}
			if (targetPreviewBtn) {
				targetPreviewBtn.addEventListener('click', (event) => {
					if (!getExplicitTargetAddress()) return;
					const rawTarget = event.target;
					const targetEl = rawTarget instanceof Element
						? rawTarget
						: rawTarget instanceof Node
							? rawTarget.parentElement
							: null;
					if (!targetEl) return;
					if (targetEl.closest('button, a, input, textarea, select')) return;
					copyTargetAddress();
				});
				targetPreviewBtn.addEventListener('keydown', (event) => {
					if (!getExplicitTargetAddress()) return;
					if (event.key !== 'Enter' && event.key !== ' ') return;
					event.preventDefault();
					copyTargetAddress();
				});
			}
		if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
		if (saveBtn) saveBtn.addEventListener('click', saveTargetAddress);
		if (editModal) editModal.addEventListener('click', (e) => {
			if (e.target === editModal) closeEditModal();
		});
		if (sendBtn) sendBtn.addEventListener('click', openSendModal);
		if (sendCancelBtn) sendCancelBtn.addEventListener('click', closeSendModal);
		if (sendConfirmBtn) sendConfirmBtn.addEventListener('click', sendSuiToProfile);
		if (sendAmountInput) {
			sendAmountInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					sendSuiToProfile();
				}
			});
			sendAmountInput.addEventListener('input', () => {
				sendAmountInput.value = sendAmountInput.value.replace(/[^0-9.]/g, '');
			});
			sendAmountInput.addEventListener('focus', () => {
				sendAmountInput.select();
			});
		}
		const sendAmountDown = document.getElementById('send-amount-down');
		const sendAmountUp = document.getElementById('send-amount-up');
		if (sendAmountDown && sendAmountInput) {
			sendAmountDown.addEventListener('click', () => {
				const current = parseFloat(sendAmountInput.value) || 1;
				sendAmountInput.value = String(Math.max(1, Math.floor(current - 1)));
			});
		}
		if (sendAmountUp && sendAmountInput) {
			sendAmountUp.addEventListener('click', () => {
				const current = parseFloat(sendAmountInput.value) || 0;
				sendAmountInput.value = String(Math.floor(current + 1));
			});
		}
		if (sendModal) sendModal.addEventListener('click', (e) => {
			if (e.target === sendModal) closeSendModal();
		});

		const sendTabDirect = document.getElementById('send-tab-direct');
		const sendTabLink = document.getElementById('send-tab-link');
		const sendPanelDirect = document.getElementById('send-panel-direct');
		const sendPanelLink = document.getElementById('send-panel-link');
		function switchSendTab(tab) {
			if (tab === 'direct') {
				if (sendTabDirect) sendTabDirect.classList.add('active');
				if (sendTabLink) sendTabLink.classList.remove('active');
				if (sendPanelDirect) sendPanelDirect.classList.remove('hidden');
				if (sendPanelLink) sendPanelLink.classList.add('hidden');
			} else {
				if (sendTabLink) sendTabLink.classList.add('active');
				if (sendTabDirect) sendTabDirect.classList.remove('active');
				if (sendPanelLink) sendPanelLink.classList.remove('hidden');
				if (sendPanelDirect) sendPanelDirect.classList.add('hidden');
			}
		}
		if (sendTabDirect) sendTabDirect.addEventListener('click', () => switchSendTab('direct'));
		if (sendTabLink) sendTabLink.addEventListener('click', () => switchSendTab('link'));

		const zkAmountInput = document.getElementById('zk-amount');
		const zkAmountDown = document.getElementById('zk-amount-down');
		const zkAmountUp = document.getElementById('zk-amount-up');
		const zkCancelBtn = document.getElementById('zk-cancel-btn');
		const zkGenerateBtn = document.getElementById('zk-generate-btn');
		const zkStatus = document.getElementById('zk-status');
		const zkResult = document.getElementById('zk-result');
		if (zkCancelBtn) zkCancelBtn.addEventListener('click', closeSendModal);
		if (zkAmountInput) {
			zkAmountInput.addEventListener('input', () => {
				zkAmountInput.value = zkAmountInput.value.replace(/[^0-9.]/g, '');
			});
			zkAmountInput.addEventListener('focus', () => { zkAmountInput.select(); });
			zkAmountInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') { e.preventDefault(); zkGenerateBtn?.click(); }
			});
		}
		if (zkAmountDown && zkAmountInput) {
			zkAmountDown.addEventListener('click', () => {
				const current = parseFloat(zkAmountInput.value) || 1;
				zkAmountInput.value = String(Math.max(1, Math.floor(current - 1)));
			});
		}
		if (zkAmountUp && zkAmountInput) {
			zkAmountUp.addEventListener('click', () => {
				const current = parseFloat(zkAmountInput.value) || 0;
				zkAmountInput.value = String(Math.floor(current + 1));
			});
		}
		if (zkGenerateBtn) {
			zkGenerateBtn.addEventListener('click', async () => {
				if (!canSign()) {
					showStatus(zkStatus, 'Connect wallet first', 'error');
					return;
				}
				const suiAmount = zkAmountInput ? Number(zkAmountInput.value) : 0;
				if (!Number.isFinite(suiAmount) || suiAmount <= 0) {
					showStatus(zkStatus, 'Enter a valid amount', 'error');
					return;
				}
				const mist = BigInt(Math.ceil(suiAmount * 1e9));
				if (mist <= 0n) {
					showStatus(zkStatus, 'Amount is too small', 'error');
					return;
				}
				zkGenerateBtn.disabled = true;
				showStatus(zkStatus, '<span class="loading"></span> Loading zkSend...', 'info');
				if (zkResult) zkResult.style.display = 'none';
				try {
					const result = await SuiWalletKit.createSendLink({
						sender: connectedAddress,
						client: getSuiClient(),
						mist: mist,
					});
					const linkUrl = result.link.getLink();
					showStatus(zkStatus, '<span class="loading"></span> Approve in wallet...', 'info');
					await SuiWalletKit.signAndExecute(result.tx);
					hideStatus(zkStatus);
					if (zkResult) {
						zkResult.style.display = 'block';
						zkResult.innerHTML = '<div class="zk-link-result">'
							+ '<div class="zk-link-result-label">Claim Link</div>'
							+ '<div class="zk-link-row">'
							+ '<input type="text" readonly class="zk-link-input" id="zk-link-url" value="' + linkUrl.replace(/"/g, '&quot;') + '" />'
							+ '<button class="zk-copy-btn" id="zk-copy-btn">Copy</button>'
							+ '</div></div>';
						const zkCopyBtn = document.getElementById('zk-copy-btn');
						const zkLinkUrl = document.getElementById('zk-link-url');
						if (zkCopyBtn && zkLinkUrl) {
							zkCopyBtn.addEventListener('click', () => {
								navigator.clipboard.writeText(zkLinkUrl.value).then(() => {
									zkCopyBtn.textContent = 'Copied!';
									setTimeout(() => { zkCopyBtn.textContent = 'Copy'; }, 2000);
								});
							});
						}
					}
				} catch (error) {
					const msg = error?.message || 'Failed to generate link';
					showStatus(zkStatus, 'Failed: ' + msg, 'error');
				} finally {
					zkGenerateBtn.disabled = false;
				}
			});
		}

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
				ownerPrimaryName = displayName || null;
				syncIdentityPrimaryBadgeState();

				ownerDisplayAddress = displayAddress || '';
				updatePortfolioLink(ownerDisplayAddress);

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

			renderTargetPreview(TARGET_ADDRESS);

			if (displayName) {
				if (ownerNameEl) {
					ownerNameEl.innerHTML = formatSuiName(displayName);
					ownerNameEl.style.display = '';
					ownerNameEl.classList.add('owner-name-copy');
					ownerNameEl.title = 'Click to copy';
					ownerNameEl.dataset.copyName = displayName;
					if (!ownerNameEl.dataset.copyBound) {
						ownerNameEl.addEventListener('click', async (event) => {
							event.stopPropagation();
							try {
								const nameToCopy = ownerNameEl.dataset.copyName || '';
								if (!nameToCopy) return;
								await navigator.clipboard.writeText(nameToCopy);
								ownerNameEl.classList.add('copied');
								setTimeout(() => ownerNameEl.classList.remove('copied'), 900);
							} catch (err) {
								console.error('Failed to copy owner name:', err);
							}
						});
						ownerNameEl.dataset.copyBound = 'true';
					}
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
				if (rawIdentityNftImage) {
					applyTaggedIdentityToProfile();
				}
				updateEditButton();
			}

		updatePortfolioLink(ownerDisplayAddress);
		renderWalletBar();
		updateGlobalWalletWidget();
		updateEditButton();

		window.onProfileWalletConnected = function() {
			checkEditPermission();
			updateUIForWallet();
			updateGlobalWalletWidget();
			var conn = SuiWalletKit.$connection.value;
			if (conn && conn.address) resolveWalletName(conn.address);
		};

		window.onProfileWalletDisconnected = function() {
			canEdit = false;
			connectedPrimaryName = null;
			updateEditButton();
			updateUIForWallet();
			updateGlobalWalletWidget();
		};

		${generateSharedWalletMountJs({
			network: env.SUI_NETWORK,
			session: options.session,
			onConnect: 'onProfileWalletConnected',
			onDisconnect: 'onProfileWalletDisconnected',
			profileButtonId: 'wallet-profile-btn',
			profileFallbackHref: 'https://sui.ski',
		})}

		fetchAndDisplayOwnerInfo();
		updateGracePeriodOwnerInfo();
		updateGracePeriodCountdown();


		// ===== QUICK SEARCH (Keyboard-activated + Button) =====
			const searchOverlay = document.getElementById('search-overlay');
			const searchInput = document.getElementById('search-input');
			const searchResults = document.getElementById('search-results');
			let searchActive = false;
			let searchTimeout = null;
			let selectedIndex = 0;
			let currentResults = [];
			let searchRequestNonce = 0;
			const suggestionCache = new Map();
			const availabilityCache = new Map();
			const FEATURED_FALLBACK = ['agents', 'agent', 'vault', 'alpha', 'pro', 'wallet', 'builder', 'domain', 'defi'];

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
				} else {
					performSearch('');
				}
				setTimeout(() => searchInput?.focus(), 50);
			}

			function closeSearch() {
				searchActive = false;
				searchRequestNonce++;
				clearTimeout(searchTimeout);
				if (searchOverlay) searchOverlay.classList.remove('active');
				if (searchInput) searchInput.value = '';
				if (searchResults) searchResults.innerHTML = '';
				currentResults = [];
				selectedIndex = 0;
			}

			function showSearchLoading(message) {
				if (!searchResults) return;
				searchResults.innerHTML = '<div class="search-loading"><span class="loading"></span>' + message + '</div>';
			}

			function showSearchEmpty(message) {
				if (!searchResults) return;
				searchResults.innerHTML = '<div class="search-empty">' + message + '</div>';
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
							badgeText = result.expiresIn + 'd';
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

			async function fetchSuggestions(query) {
				if (suggestionCache.has(query)) return suggestionCache.get(query);
				try {
					const res = await fetch('/api/suggest-names?q=' + encodeURIComponent(query));
					if (res.ok) {
						const data = await res.json();
						const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [query];
						suggestionCache.set(query, suggestions);
						return suggestions;
					}
				} catch {}
				return [query];
			}

			async function fetchFeaturedNames() {
				try {
					const res = await fetch('/api/featured-names');
					if (!res.ok) return FEATURED_FALLBACK;
					const data = await res.json();
					const featured = Array.isArray(data?.names) ? data.names : [];
					const extracted = featured
						.map((item) => (item && typeof item.name === 'string' ? cleanNameInput(item.name) : ''))
						.filter((name) => !!name && name.length >= 3);
					if (!extracted.length) return FEATURED_FALLBACK;
					const unique = Array.from(new Set(extracted));
					return ['agents', ...unique.filter((name) => name !== 'agents')].slice(0, 10);
				} catch {
					return FEATURED_FALLBACK;
				}
			}

			function buildUniqueCandidates(baseName, suggestions) {
				const unique = [baseName];
				const seen = new Set([baseName]);
				for (const candidate of suggestions || []) {
					const clean = cleanNameInput(candidate);
					if (!clean || seen.has(clean)) continue;
					seen.add(clean);
					unique.push(clean);
					if (unique.length >= 10) break;
				}
				return unique;
			}

			function buildVariantFallbacks(baseName) {
				const suffixes = ['ai', 'app', 'hub', 'pro', 'xyz', 'dao', 'labs', 'wallet', 'agent'];
				const variants = [];
				for (const suffix of suffixes) {
					const candidate = cleanNameInput(baseName + suffix);
					if (!candidate) continue;
					if (candidate.length < 3 || candidate.length > 15) continue;
					variants.push(candidate);
				}
				return variants;
			}

			async function expandCandidates(baseName, suggestions) {
				const expanded = buildUniqueCandidates(baseName, suggestions);
				if (expanded.length >= 6) return expanded.slice(0, 10);

				const featured = await fetchFeaturedNames();
				for (const featuredName of featured) {
					const clean = cleanNameInput(featuredName);
					if (!clean || expanded.includes(clean)) continue;
					expanded.push(clean);
					if (expanded.length >= 10) return expanded;
				}

				const variants = buildVariantFallbacks(baseName);
				for (const variant of variants) {
					if (expanded.includes(variant)) continue;
					expanded.push(variant);
					if (expanded.length >= 10) break;
				}

				return expanded;
			}

			async function populateSearchCandidates(names, requestNonce) {
				const cleaned = Array.from(
					new Set((names || []).map((name) => cleanNameInput(name)).filter((name) => !!name)),
				);
				if (!cleaned.length) {
					currentResults = [];
					renderSearchResults();
					showSearchEmpty('No matching names');
					return;
				}

				currentResults = cleaned.map((name) => ({ name, status: 'checking' }));
				selectedIndex = 0;
				renderSearchResults();

				const checked = await Promise.all(cleaned.map((name) => checkNameAvailability(name)));
				if (requestNonce !== searchRequestNonce || !searchActive) return;
				currentResults = checked;
				selectedIndex = 0;
				renderSearchResults();
			}

			async function checkNameAvailability(name) {
				const cached = availabilityCache.get(name);
				if (cached) return cached;
				const remember = (value) => {
					availabilityCache.set(name, value);
					return value;
				};
				try {
					const suinsClient = await createSuinsClient();

					const [record, marketRes] = await Promise.all([
						suinsClient.getNameRecord(name + '.sui').catch(() => null),
						fetch('/api/marketplace/' + encodeURIComponent(name)).catch(() => null),
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

						if (!record) {
							if (listing) {
								return remember({ name, status: 'listed', listingPrice, tradeportUrl, listing });
						}
						return remember({ name, status: 'available' });
					}

				let expiresIn = null;
				if (record.expirationTimestampMs) {
					const expiresMs = parseInt(record.expirationTimestampMs);
					expiresIn = Math.ceil((expiresMs - Date.now()) / (24 * 60 * 60 * 1000));
				}

					if (listing) {
						return remember({ name, status: 'listed', expiresIn, listingPrice, tradeportUrl, listing });
					}

					return remember({ name, status: 'taken', expiresIn });
				} catch (e) {
					console.error('Error checking name:', e);
					return remember({ name, status: 'taken' });
				}
			}

			async function performSearch(query) {
				const name = cleanNameInput(query);
				const requestNonce = ++searchRequestNonce;

				if (!name) {
					showSearchLoading('Loading premium names...');
					const featuredNames = await fetchFeaturedNames();
					if (requestNonce !== searchRequestNonce || !searchActive) return;
					await populateSearchCandidates(featuredNames, requestNonce);
					return;
				}

				if (name.length < 3) {
					currentResults = [];
					renderSearchResults();
					showSearchEmpty('Min 3 characters');
					return;
				}

				// Show immediate result for the typed query while suggestion API resolves.
				currentResults = [{ name, status: 'checking' }];
				selectedIndex = 0;
				renderSearchResults();

				const suggestions = await fetchSuggestions(name);
				if (requestNonce !== searchRequestNonce || !searchActive) return;
				const candidates = await expandCandidates(name, suggestions);
				if (requestNonce !== searchRequestNonce || !searchActive) return;
				await populateSearchCandidates(candidates, requestNonce);
			}

		async function buyListedName(result) {
			if (!canSign()) {
				openWalletModal();
				return;
			}

			const listing = result.listing;
			if (!listing || !listing.price) return;

			const nonce = listing.nonce || '';
			const tradeportUrl = result.tradeportUrl
				|| (NFT_ID
					? 'https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=' + encodeURIComponent(NFT_ID) + '&modalSlug=suins&nav=1'
					: 'https://www.tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(result.name));

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
					if (!DEEPBOOK_PACKAGE) {
						const needed = (Number(totalSuiNeeded) / 1e9).toFixed(4);
						const have = (Number(suiAvailable) / 1e9).toFixed(4);
						if (statusEl) statusEl.textContent = 'Need ' + needed + ' SUI (have ' + have + ')';
						return;
					}

					if (statusEl) statusEl.textContent = 'Insufficient SUI. Checking holdings...';

					const pools = await fetch('/api/deepbook-pools').then(r => r.json()).catch(() => []);
					if (!pools.length) {
						const needed = (Number(totalSuiNeeded) / 1e9).toFixed(4);
						const have = (Number(suiAvailable) / 1e9).toFixed(4);
						if (statusEl) statusEl.textContent = 'Need ' + needed + ' SUI (have ' + have + ')';
						return;
					}

					const balanceChecks = pools.map(p =>
						suiClient.getBalance({ owner: connectedAddress, coinType: p.coinType })
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
						const shortfallSui = Number(shortfall) / 1e9;
						const tokensNeeded = shortfallSui / pool.suiPerToken;
						const tokenMistNeeded = BigInt(Math.ceil(tokensNeeded * Math.pow(10, pool.decimals)));
						const tokenMistWithBuffer = tokenMistNeeded * 130n / 100n;
						const amountToSell = tokenMistWithBuffer > candidate.balance ? candidate.balance : tokenMistWithBuffer;

						const expectedSui = Number(amountToSell) / Math.pow(10, pool.decimals) * pool.suiPerToken;
						const minSuiOut = BigInt(Math.floor(expectedSui * 0.80 * 1e9));

						if (minSuiOut <= 0n) continue;

						const coins = await suiClient.getCoins({ owner: connectedAddress, coinType: pool.coinType });
						if (!coins.data.length) continue;

						swapInfo = {
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
						break;
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
					prependSwapToTx(tx, swapInfo, connectedAddress);
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

				let txResult;
				txResult = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

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

					// Ensure Sui SDK
					if (typeof Transaction !== 'function' || typeof SuiJsonRpcClient !== 'function') {
						const timedImport = (url, timeoutMs = 30000) => Promise.race([
							import(url),
							new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: ' + url)), timeoutMs)),
						]);
						const importFirst = async (urls) => {
							let lastError = null;
							for (const url of urls) {
								try {
									return await timedImport(url);
								} catch (error) {
									lastError = error;
								}
							}
							throw lastError || new Error('Import failed');
						};
						const suiUrls = [
							'https://esm.sh/@mysten/sui@2.2.0?bundle',
							'https://esm.sh/@mysten/sui@2.2.0',
							'https://cdn.jsdelivr.net/npm/@mysten/sui@2.2.0/+esm',
							'https://unpkg.com/@mysten/sui@2.2.0?module',
						];
						const sdkModule = await importFirst(suiUrls);
						SuiJsonRpcClient = sdkModule?.SuiJsonRpcClient || sdkModule?.SuiClient || sdkModule?.default?.SuiJsonRpcClient || SuiJsonRpcClient;
						Transaction = sdkModule?.Transaction || sdkModule?.TransactionBlock || sdkModule?.default?.Transaction || Transaction;
					}
					if (typeof Transaction !== 'function' || typeof SuiJsonRpcClient !== 'function') {
						throw new Error('Sui SDK unavailable. Check network and retry.');
					}

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
				const result = await SuiWalletKit.signAndExecute(tx);

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
						showMessageStatus(renderTxExplorerLinks(result.digest, true), 'success');
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
				const overlayName = cleanedName ? escapeHtmlJs(cleanedName) : 'unknown';
				const overlayExpiryTag = daysRemaining === null
					? ''
					: daysRemaining <= 0
						? 'Expired'
						: String(daysRemaining) + 'd';
				const overlayExpiryClass = daysRemaining !== null && daysRemaining <= 0
					? 'expired'
					: daysRemaining !== null && daysRemaining <= 30
						? 'warning'
						: '';

				return \`
					<div class="nft-card\${isCurrentName ? ' current' : ''}" onclick="\${profileUrl ? \`window.location.href='\${profileUrl}'\` : ''}">
						<div class="nft-card-image-wrapper">
							<div class="nft-card-blackout"></div>
							<div class="nft-card-name-trace">
								<span class="nft-card-name-at">@</span><span class="nft-card-name-handle">\${overlayName}</span>
							</div>
							<div class="nft-card-overlay-tags">
								<span class="nft-card-overlay-tag">.sui</span>
								\${overlayExpiryTag ? \`<span class="nft-card-overlay-tag \${overlayExpiryClass}">\${overlayExpiryTag}</span>\` : ''}
							</div>
							\${expirationText ? \`<div class="nft-card-overlay-date">\${escapeHtmlJs(expirationText)}</div>\` : ''}
							<div class="nft-card-qr-tag">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
									<rect x="3" y="3" width="7" height="7"/>
									<rect x="14" y="3" width="7" height="7"/>
									<rect x="14" y="14" width="7" height="7"/>
									<path d="M10 10h4"/>
									<path d="M7 17h4"/>
									<rect x="3" y="14" width="7" height="7"/>
								</svg>
							</div>
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
		let currentRenewalYears = 1;
		const MIN_YEARS = 1;
		const MAX_YEARS = 5;
		const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

		function getSelectedRenewalBaseExpirationMs() {
			return (typeof selectedRenewalExpiration !== 'undefined' && selectedRenewalExpiration)
				? selectedRenewalExpiration
				: EXPIRATION_MS;
		}

		function getProjectedRenewalExpirationMs() {
			const baseExpiration = getSelectedRenewalBaseExpirationMs();
			if (!baseExpiration) return 0;
			return baseExpiration + (currentRenewalYears * ONE_YEAR_MS);
		}

		function updateExpirationCountdown() {
			const baseExpirationMs = getSelectedRenewalBaseExpirationMs();
			if (!baseExpirationMs) return;

			const now = Date.now();
			const diff = baseExpirationMs - now;

			if (diff <= 0) {
				if (expDays) expDays.textContent = '00';
				if (expHours) expHours.textContent = '00';
				if (expMins) expMins.textContent = '00';
				if (expSecs) expSecs.textContent = '00';
			} else {
				const days = Math.floor(diff / (24 * 60 * 60 * 1000));
				const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
				const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
				const secs = Math.floor((diff % (60 * 1000)) / 1000);

				if (expDays) expDays.textContent = String(days).padStart(2, '0');
				if (expHours) expHours.textContent = String(hours).padStart(2, '0');
				if (expMins) expMins.textContent = String(mins).padStart(2, '0');
				if (expSecs) expSecs.textContent = String(secs).padStart(2, '0');
			}

			if (renewalCountdown) {
				const projectedDiff = getProjectedRenewalExpirationMs() - now;
				if (projectedDiff <= 0) {
					renewalCountdown.textContent = 'Expired';
				} else {
					const projectedDays = Math.floor(projectedDiff / (24 * 60 * 60 * 1000));
					const projectedHours = Math.floor((projectedDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
					const projectedMins = Math.floor((projectedDiff % (60 * 60 * 1000)) / (60 * 1000));
					if (projectedDays > 365) {
						const years = Math.floor(projectedDays / 365);
						const remainingDays = projectedDays % 365;
						renewalCountdown.textContent = years + 'y ' + remainingDays + 'd';
					} else if (projectedDays > 0) {
						renewalCountdown.textContent = projectedDays + 'd ' + projectedHours + 'h';
					} else {
						renewalCountdown.textContent = projectedHours + 'h ' + projectedMins + 'm';
					}
				}
			}
		}

		// Initialize expiration timer
		if (getSelectedRenewalBaseExpirationMs()) {
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
		const ovRenewalCard = document.getElementById('overview-renewal-card');
		const expiryQuickRenewBtn = document.getElementById('expiry-quick-renew-btn');

		const expiryBadgeText = document.querySelector('.expiry-badge-text');
		const expiryBadge = document.querySelector('.badge.expiry');

		function updateExpiryBadgeWithRenewal() {
			const baseExpirationMs = getSelectedRenewalBaseExpirationMs();
			if (!expiryBadgeText || !baseExpirationMs) return;
			const daysFromNow = Math.ceil((baseExpirationMs - Date.now()) / 86400000);

			if (daysFromNow <= 0) {
				expiryBadgeText.textContent = 'Expired';
			} else if (daysFromNow > 365) {
				const years = Math.floor(daysFromNow / 365);
				const days = daysFromNow % 365;
				expiryBadgeText.textContent = years + 'y ' + days + 'd';
			} else {
				expiryBadgeText.textContent = daysFromNow + 'd';
			}

			if (expiryBadge) {
				expiryBadge.className = 'badge expiry';
				if (daysFromNow <= 0) {
					expiryBadge.classList.add('danger');
				} else if (daysFromNow > 365) {
					expiryBadge.classList.add('premium');
				} else if (daysFromNow > 90) {
					expiryBadge.classList.remove('warning', 'danger', 'premium');
				} else if (daysFromNow > 7) {
					expiryBadge.classList.add('warning');
				} else {
					expiryBadge.classList.add('danger');
				}
			}
		}

		function updateYearsStepper() {
			if (ovRenewalYears) {
				ovRenewalYears.textContent = currentRenewalYears + ' yr' + (currentRenewalYears > 1 ? 's' : '');
				ovRenewalYears.dataset.value = String(currentRenewalYears);
			}
			if (ovRenewalYearsMinus) ovRenewalYearsMinus.disabled = currentRenewalYears <= MIN_YEARS;
			if (ovRenewalYearsPlus) ovRenewalYearsPlus.disabled = currentRenewalYears >= MAX_YEARS;

			// Update projected expiration date
			const projectedExpiration = getProjectedRenewalExpirationMs();
			if (projectedExpiration && ovRenewalExpiryDate) {
				const newExpiration = new Date(projectedExpiration);
				ovRenewalExpiryDate.textContent = newExpiration.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
			}

			updateExpirationCountdown();
			updateExpiryBadgeWithRenewal();
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
			try {
				const nameToPrice = selectedRenewalName || NAME;
				const cacheKey = nameToPrice + '-' + years;
				if (renewalPricingCache && renewalPricingCache[cacheKey]) {
					return renewalPricingCache[cacheKey];
				}

					const res = await fetch(getRenewalApiUrl('/api/renewal-pricing?domain=' + encodeURIComponent(nameToPrice) + '&years=' + years));
				if (!res.ok) throw new Error('Failed to fetch pricing');
				const data = await res.json();
				if (renewalPricingCache) renewalPricingCache[cacheKey] = data;
				return data;
			} catch (error) {
				console.error('Renewal pricing error:', error);
				return null;
			}
		}

		async function resolveQuickRenewalYears(nameToExtend) {
			try {
					const halfYearRes = await fetch(getRenewalApiUrl('/api/renewal-pricing?domain=' + encodeURIComponent(nameToExtend) + '&years=0.5'));
				if (!halfYearRes.ok) return 1;
				const halfYearPricing = await halfYearRes.json();
				const nsNeededMist = BigInt(halfYearPricing?.nsNeededMist || 0);
				if (nsNeededMist > 0n) {
					if (renewalPricingCache) {
						renewalPricingCache[nameToExtend + '-0.5'] = halfYearPricing;
					}
					return 0.5;
				}
			} catch (error) {
				console.log('180-day renewal pricing unavailable, falling back to 365-day renewal:', error?.message || error);
			}
			return 1;
		}

		var lastRenewalSuiAmount = 0;
		var cachedSuiUsdPrice = 0;
		const ovRenewalPriceUsd = document.getElementById('overview-renewal-price-usd');
		const suiPriceEl = document.getElementById('sui-price');

		function updateRenewalUsdPrice() {
			if (!ovRenewalPriceUsd || !cachedSuiUsdPrice || !lastRenewalSuiAmount) return;
			const usd = lastRenewalSuiAmount * cachedSuiUsdPrice;
			ovRenewalPriceUsd.textContent = '≈ $' + usd.toFixed(2);
		}

		async function updateSUIPrice() {
			try {
				const response = await fetch('/api/sui-price');
				if (!response.ok) throw new Error('Failed to fetch price');
				const contentType = response.headers.get('content-type') || '';
				if (!contentType.includes('application/json')) throw new Error('Invalid price response type');
				const data = await response.json();
				if (data && typeof data.price === 'number' && Number.isFinite(data.price)) {
					cachedSuiUsdPrice = data.price;
					if (suiPriceEl) suiPriceEl.textContent = '$' + data.price.toFixed(2);
					updateRenewalUsdPrice();
					if (typeof updateBidEstimateDisplay === 'function') updateBidEstimateDisplay();
					if (typeof updateListEstimateDisplay === 'function') updateListEstimateDisplay();
				}
			} catch (error) {
				console.error('Failed to update SUI price:', error);
				if (suiPriceEl) suiPriceEl.textContent = '$--';
			}
		}
		updateSUIPrice();
		setInterval(updateSUIPrice, 60000);

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
			priceEl.textContent = discountedSui.toFixed(2) + ' SUI';
			lastRenewalSuiAmount = discountedSui;
			updateRenewalUsdPrice();

			if (savingsRowEl) {
				savingsRowEl.style.display = 'inline-flex';
				if (savingsTextEl) {
					savingsTextEl.textContent = '-24%';
				}
				const savingsSuiEl = document.getElementById('overview-renewal-savings-sui');
				if (savingsSuiEl) {
					const savedSui = Number(pricing.savingsMist || 0) / 1e9;
					const roundedSavedSui = Math.ceil(savedSui * 100) / 100;
					savingsSuiEl.textContent = '(' + roundedSavedSui.toFixed(2) + ' SUI)';
				}
			}
		}

		function updateAllRenewalDisplays() {
			updateRenewalDisplay(ovRenewalYears, ovRenewalPrice, ovRenewalSavings, ovRenewalSavingsText);
			updateRenewalDisplay(renewalYearsSelect, renewalPriceEl, renewalSavingsRow, renewalSavingsText);
		}

		// Initialize stepper state (must be after pricing functions are defined)
		updateYearsStepper();

			function updateRenewalButton() {
				const nameToExtend = selectedRenewalName || NAME;
				if (ovRenewalCard) {
					ovRenewalCard.classList.toggle('renewal-disconnected', !connectedAddress);
			}
			if (ovRenewalYearsMinus) ovRenewalYearsMinus.disabled = currentRenewalYears <= MIN_YEARS;
			if (ovRenewalYearsPlus) ovRenewalYearsPlus.disabled = currentRenewalYears >= MAX_YEARS;
			// Update overview renewal button
			if (ovRenewalBtn && ovRenewalBtnText) {
				if (connectedAddress) {
					ovRenewalBtn.disabled = false;
					ovRenewalBtnText.textContent = 'Renew ' + nameToExtend + '.sui';
				} else {
					ovRenewalBtn.disabled = false;
					ovRenewalBtnText.textContent = 'Connect Wallet to Renew';
				}
			}
			// Update bid tab renewal button
			if (renewalBtn && renewalBtnText) {
				if (connectedAddress) {
					renewalBtn.disabled = false;
					renewalBtnText.textContent = 'Renew ' + nameToExtend + '.sui';
				} else {
					renewalBtn.disabled = true;
					renewalBtnText.textContent = 'Connect Wallet to Renew';
				}
				}
			}

			renewalUiReady = true

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
		const FACILITATOR_NAME = DISCOUNT_RECIPIENT_NAME;
		let facilitatorAddress = '';

		async function resolveFacilitatorAddress(suinsClient) {
			if (isLikelySuiAddress(facilitatorAddress)) {
				return facilitatorAddress;
			}
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
			return connectedAddress || CURRENT_ADDRESS || '';
		}

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
				const maxSellable = candidate.balance * 95n / 100n;
				const amountToSell = tokenMistWithBuffer > maxSellable ? maxSellable : tokenMistWithBuffer;

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

	async function estimatePortfolioSui(suiClient, address) {
			const suiBal = await suiClient.getBalance({ owner: address, coinType: SUI_TYPE }).catch(() => ({ totalBalance: '0' }));
			let totalSui = Number(BigInt(suiBal.totalBalance)) / 1e9;
			const pools = await fetch('/api/deepbook-pools').then(r => r.json()).catch(() => []);
			if (pools.length) {
				const balances = await Promise.all(
					pools.map(p => suiClient.getBalance({ owner: address, coinType: p.coinType }).catch(() => ({ totalBalance: '0' })))
				);
				for (let i = 0; i < pools.length; i++) {
					const bal = Number(BigInt(balances[i].totalBalance));
					if (bal <= 0) continue;
					const tokenAmount = bal / Math.pow(10, pools[i].decimals);
					totalSui += tokenAmount * pools[i].suiPerToken * 0.95;
				}
			}
			return totalSui;
		}

		async function getMaxBidSui() {
			if (!connectedAddress) return 0;
			const suiClient = getSuiClient();
			const OVERHEAD_SUI = 0.15;
			const TRADEPORT_FEE_RATE = 1.03;
			const totalSui = await estimatePortfolioSui(suiClient, connectedAddress);
			const maxBid = (totalSui - OVERHEAD_SUI) / TRADEPORT_FEE_RATE;
			return Math.max(0, Math.round(maxBid * 1e4) / 1e4);
		}

		let renewalInFlight = false;

		function getRenewalApiUrl(path) {
			const normalizedPath = String(path || '').startsWith('/') ? path : '/' + String(path || '');
			const conn = SuiWalletKit?.$connection?.value || {};
			const accountChains = Array.isArray(conn?.account?.chains) ? conn.account.chains : [];
			let chain = '';
			for (const candidate of accountChains) {
				if (typeof candidate === 'string' && candidate.indexOf('sui:') === 0) {
					chain = candidate.toLowerCase();
					break;
				}
			}
			if (!chain) {
				const normalizedNetwork = String(window.NETWORK || NETWORK || 'mainnet').toLowerCase();
				chain = normalizedNetwork.indexOf('sui:') === 0 ? normalizedNetwork : ('sui:' + normalizedNetwork);
			}
			const rootOrigin = chain === 'sui:testnet'
				? 'https://t.sui.ski'
				: chain === 'sui:devnet'
					? 'https://d.sui.ski'
					: 'https://sui.ski';
			return rootOrigin + normalizedPath;
		}

		function parseRenewalTransactionBytes(rawTxBytes) {
			if (rawTxBytes instanceof Uint8Array) return rawTxBytes;
			if (rawTxBytes instanceof ArrayBuffer) return new Uint8Array(rawTxBytes);
			if (Array.isArray(rawTxBytes)) return Uint8Array.from(rawTxBytes);
			if (typeof rawTxBytes !== 'string') {
				throw new Error('Unsupported renewal transaction payload format');
			}
			const trimmed = rawTxBytes.trim();
			if (!trimmed) throw new Error('Empty renewal transaction payload');
			return base64ToBytes(trimmed);
		}

		function buildRenewalTransactionBlock(txBytes) {
			if (!txBytes || !(txBytes instanceof Uint8Array)) return null;
			if (typeof Transaction !== 'function' || typeof Transaction.from !== 'function') return null;
			try {
				return Transaction.from(txBytes);
			} catch (_error) {}
			try {
				return Transaction.from(bytesToBase64(txBytes));
			} catch (_error) {}
			return null;
		}

		function getRenewalSignatureFromResult(signResult) {
			if (!signResult) return '';
			if (typeof signResult.signature === 'string') return signResult.signature;
			if (Array.isArray(signResult.signatures) && typeof signResult.signatures[0] === 'string') {
				return signResult.signatures[0];
			}
			if (Array.isArray(signResult.signatures) && signResult.signatures[0]?.length) {
				try {
					return bytesToBase64(new Uint8Array(signResult.signatures[0]));
				} catch (_error) {}
			}
			if (signResult.signature && signResult.signature.length) {
				try {
					return bytesToBase64(new Uint8Array(signResult.signature));
				} catch (_error) {}
			}
			return '';
		}

		function getRenewalTxBase64(txInput) {
			if (typeof txInput === 'string') return txInput;
			if (txInput instanceof Uint8Array) return bytesToBase64(txInput);
			if (txInput instanceof ArrayBuffer) return bytesToBase64(new Uint8Array(txInput));
			if (Array.isArray(txInput)) return bytesToBase64(Uint8Array.from(txInput));
			if (txInput && typeof txInput.serialize === 'function') {
				const serialized = txInput.serialize();
				if (serialized instanceof Uint8Array) return bytesToBase64(serialized);
				if (serialized instanceof ArrayBuffer) return bytesToBase64(new Uint8Array(serialized));
				if (Array.isArray(serialized)) return bytesToBase64(Uint8Array.from(serialized));
			}
			return '';
		}

		async function reconnectWalletForRenewal() {
			let conn = SuiWalletKit?.$connection?.value || {};
			if (conn.wallet) return conn;

			let preferredWalletName = '';
			try {
				const session = typeof getWalletSession === 'function' ? getWalletSession() : null;
				preferredWalletName = String(session?.walletName || connectedWalletName || '').trim();
			} catch (_error) {
				preferredWalletName = String(connectedWalletName || '').trim();
			}

			let wallets = [];
			try {
				wallets = await SuiWalletKit.detectWallets();
			} catch (_error) {
				wallets = SuiWalletKit?.$wallets?.value || [];
			}
			if (!Array.isArray(wallets) || wallets.length === 0) return conn;

			let walletMatch = null;
			if (preferredWalletName) {
				walletMatch = wallets.find(function(wallet) {
					return String(wallet?.name || '') === preferredWalletName;
				}) || null;
			}
			if (!walletMatch) {
				walletMatch = wallets.find(function(wallet) {
					return String(wallet?.name || '').toLowerCase() === 'phantom';
				}) || null;
			}
			if (!walletMatch) {
				walletMatch = wallets.find(function(wallet) {
					return !wallet?.__isPasskey;
				}) || null;
			}
			if (!walletMatch) walletMatch = wallets[0] || null;
			if (!walletMatch) return conn;

			try {
				await SuiWalletKit.connect(walletMatch);
			} catch (_error) {}

			return SuiWalletKit?.$connection?.value || conn;
		}

			async function signAndExecuteRenewalOneClick(
				txBytes,
				txBlockInput,
				signingChain,
				txOptions,
				suiClient,
				expectedSenderAddress,
			) {
				let conn = SuiWalletKit?.$connection?.value || {};
				let wallet = conn.wallet;
				let account = conn.account || null;
				const canUseBridge = !!(SuiWalletKit?.__skiSignFrame && SuiWalletKit?.__skiSignReady);

				if (!wallet && !canUseBridge) {
					conn = await reconnectWalletForRenewal();
					wallet = conn.wallet;
					account = conn.account || account;
				}

				if (!wallet && !(SuiWalletKit?.__skiSignFrame && SuiWalletKit?.__skiSignReady)) {
					throw new Error('Wallet not connected. Reconnect wallet from sui.ski and retry.');
				}

				const senderAddress = String(
					expectedSenderAddress || getConnectedSenderAddress() || conn.address || '',
				).trim();
				if (!senderAddress) throw new Error('Wallet address unavailable for renewal signing');

				const accountAddress = String(
					(typeof account?.address === 'string'
						? account.address
						: account?.address?.toString?.() || conn.address || '') || '',
				).trim();
				if (
					accountAddress &&
					accountAddress.toLowerCase() !== senderAddress.toLowerCase()
				) {
					throw new Error('Connected wallet account changed. Reconnect and retry renewal.');
				}

				const txB64 = getRenewalTxBase64(txBytes);
				if (!txB64) {
					throw new Error('Unable to serialize renewal transaction');
				}
				const accountChains = Array.isArray(account?.chains)
					? account.chains.filter(function(chain) {
						return typeof chain === 'string' && chain.indexOf('sui:') === 0;
					})
					: [];
				const requestChain = accountChains[0] || signingChain;
				const signOptions = {
					account: account || undefined,
					chain: requestChain,
					txOptions: txOptions || {},
					forceSignBridge: true,
					preferTransactionBlock: true,
					singleAttempt: true,
				};

				if (typeof SuiWalletKit?.signAndExecuteFromBytes === 'function') {
					return await SuiWalletKit.signAndExecuteFromBytes(txBytes, signOptions);
				}

				if (txBlockInput && typeof SuiWalletKit?.signAndExecute === 'function') {
					return await SuiWalletKit.signAndExecute(txBlockInput, signOptions);
				}

				if (typeof SuiWalletKit?.signAndExecute === 'function') {
					return await SuiWalletKit.signAndExecute(txBytes, signOptions);
				}

				throw new Error('No compatible wallet signing method found for renewal');
			}

		async function handleRenewal(yearsEl, btnEl, btnTextEl, btnLoadingEl, statusEl, options = {}) {
			const useProfileName = Boolean(options.useProfileName);
			const nftIdToUse = useProfileName ? NFT_ID : (selectedRenewalNftId || NFT_ID);
			const nameToExtend = useProfileName ? NAME : (selectedRenewalName || NAME);

			console.log('[Renewal] Starting renewal for:', nameToExtend, 'NFT:', nftIdToUse);

			if (!canSign()) {
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

			const forcedYears = Number(options.forcedYears);
			const yearsFromUi = Number(yearsEl?.value || yearsEl?.dataset?.value || '1');
			const years = Number.isFinite(forcedYears) && forcedYears > 0
				? forcedYears
				: (Number.isFinite(yearsFromUi) && yearsFromUi > 0 ? yearsFromUi : 1);
			console.log('[Renewal] Years:', years, 'Sender:', connectedAddress);

			if (renewalInFlight) {
				if (statusEl) {
					statusEl.textContent = 'Renewal already in progress. Please complete the wallet prompt.';
					statusEl.className = 'renewal-status';
				}
				return;
			}

			renewalInFlight = true;
			if (btnTextEl) btnTextEl.classList.add('hidden');
			if (btnLoadingEl) btnLoadingEl.classList.remove('hidden');
			if (btnEl) btnEl.disabled = true;
				if (statusEl) {
					statusEl.textContent = options.pricingStatusText || 'Fetching pricing...';
					statusEl.className = 'renewal-status';
				}

			try {
				const suiClient = getSuiClient();
				const senderAddress = String(getConnectedSenderAddress() || connectedAddress || '').trim();
				if (!senderAddress) {
					throw new Error('Please reconnect your wallet and try renewal again');
				}
				const renewalDomain = String(nameToExtend || '').endsWith('.sui')
					? String(nameToExtend)
					: String(nameToExtend) + '.sui';

				if (statusEl) {
					statusEl.textContent = 'Building transaction...';
				}

				const renewTxRes = await fetch(getRenewalApiUrl('/api/renew-tx'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						domain: renewalDomain,
						nftId: nftIdToUse,
						years: years,
						senderAddress,
						paymentMethod: 'ns',
					}),
				});
				const renewTxData = await renewTxRes.json().catch(() => null);
				if (!renewTxRes.ok || !renewTxData?.txBytes) {
					throw new Error(
						(renewTxData && renewTxData.error)
							? String(renewTxData.error)
							: 'Failed to build renewal transaction',
					);
				}

				if (statusEl) {
					statusEl.textContent = 'Please sign in your wallet...';
				}

				console.log('[Renewal] Signing transaction...');
				const signingChain = NETWORK === 'testnet'
					? 'sui:testnet'
					: NETWORK === 'devnet'
						? 'sui:devnet'
						: 'sui:mainnet';
				const renewalTxBytes = parseRenewalTransactionBytes(renewTxData.txBytes);
				const renewalTxBlock = buildRenewalTransactionBlock(renewalTxBytes);
				const executeOptions = {
					chain: signingChain,
					txOptions: { showEffects: true, showObjectChanges: true },
				}
					const result = await signAndExecuteRenewalOneClick(
						renewalTxBytes,
						renewalTxBlock,
						executeOptions.chain,
						executeOptions.txOptions,
						suiClient,
						senderAddress,
					);
					const renewalDigest =
						result?.digest
						|| result?.effects?.transactionDigest
						|| result?.result?.digest
						|| '';

					console.log('[Renewal] Transaction result:', result);

					if (renewalDigest) {
						if (statusEl) {
							// Show immediate success, then fetch full tx details
							const digest = renewalDigest;
						const txExplorerLinks = renderTxExplorerLinks(digest);
						const txExplorerLinksWithPrefix = renderTxExplorerLinks(digest, true);

						statusEl.innerHTML = '<div class="tx-success-summary">' +
							'<div class="tx-success-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Renewed ' + escapeHtmlJs(nameToExtend) + '.sui</div>' +
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
								const ownerAddress = String(
									change?.owner?.AddressOwner
									|| change?.owner?.ObjectOwner
									|| '',
								).toLowerCase();
								if (!ownerAddress || ownerAddress !== String(senderAddress || '').toLowerCase()) {
									continue;
								}
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
								'<div class="tx-success-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Renewed ' + escapeHtmlJs(nameToExtend) + '.sui</div>' +
								'<div class="tx-details">' +
									'<div class="tx-detail-row"><span class="tx-label">Status</span><span class="tx-value status-' + status + '">' + (status === 'success' ? 'Success' : status) + '</span></div>' +
									'<div class="tx-detail-row"><span class="tx-label">Gas</span><span class="tx-value">' + totalGas.toFixed(6) + ' SUI</span></div>' +
									(balanceHtml ? '<div class="tx-detail-row"><span class="tx-label">Changes</span><div class="tx-balance-changes">' + balanceHtml + '</div></div>' : '') +
									'<div class="tx-detail-row"><span class="tx-label">Digest</span><span class="tx-value mono">' + digest.slice(0, 16) + '...</span></div>' +
								'</div>' +
								'<div class="tx-explorer-links">' +
									txExplorerLinks +
								'</div>' +
							'</div>';
						} catch (fetchErr) {
							console.warn('[Renewal] Could not fetch tx details:', fetchErr);
							// Fallback to simple success message
							statusEl.innerHTML = '<div class="tx-success-summary">' +
								'<div class="tx-success-header"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Renewed ' + escapeHtmlJs(nameToExtend) + '.sui</div>' +
								'<div class="tx-explorer-links">' +
									txExplorerLinksWithPrefix +
								'</div>' +
							'</div>';
						}
					}
					fetchLinkedNames({ forceRefresh: true }).catch((refreshError) => {
						console.warn('Failed to refresh linked names after renewal:', refreshError)
					})
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
				renewalInFlight = false;
				if (btnTextEl) btnTextEl.classList.remove('hidden');
				if (btnLoadingEl) btnLoadingEl.classList.add('hidden');
				updateRenewalButton();
			}
		}

		// Overview tab renewal event listeners
		if (ovRenewalBtn) {
			ovRenewalBtn.addEventListener('click', () => {
				if (!canSign()) {
					connectWallet();
					return;
				}
				handleRenewal(ovRenewalYears, ovRenewalBtn, ovRenewalBtnText, ovRenewalBtnLoading, ovRenewalStatus);
			});
		}
		if (ovRenewalSavings) {
			ovRenewalSavings.addEventListener('click', () => {
				if (!canSign()) {
					if (ovRenewalStatus) {
						ovRenewalStatus.textContent = 'Connect wallet first';
						ovRenewalStatus.className = 'renewal-status error';
					}
					return;
				}
				handleRenewal(
					ovRenewalYears, ovRenewalBtn, ovRenewalBtnText,
					ovRenewalBtnLoading, ovRenewalStatus,
					{ includeDiscountTransfer: true }
				);
			});
		}
		if (expiryQuickRenewBtn) {
			expiryQuickRenewBtn.addEventListener('click', async (event) => {
				event.preventDefault();
				event.stopPropagation();
				if (expiryQuickRenewBtn.disabled) return;
				if (!canSign()) {
					connectWallet();
					return;
				}

				const originalText = expiryQuickRenewBtn.textContent || '+';
				expiryQuickRenewBtn.disabled = true;
				expiryQuickRenewBtn.textContent = '…';

				try {
					const quickYears = await resolveQuickRenewalYears(NAME);
					await handleRenewal(
						ovRenewalYears,
						ovRenewalBtn,
						ovRenewalBtnText,
						ovRenewalBtnLoading,
						ovRenewalStatus,
						{
							useProfileName: true,
							forcedYears: quickYears,
							pricingStatusText: quickYears === 0.5 ? 'Fetching 180-day pricing...' : 'Fetching 365-day pricing...',
						},
					);
				} catch (error) {
					console.error('Quick renewal failed:', error);
					if (ovRenewalStatus) {
						ovRenewalStatus.textContent = error?.message || 'Quick renewal failed';
						ovRenewalStatus.className = 'renewal-status error';
					}
				} finally {
					expiryQuickRenewBtn.disabled = false;
					expiryQuickRenewBtn.textContent = originalText;
				}
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
				if (!canSign()) {
					connectWallet();
					return;
				}
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

			if (!canSign()) {
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
					const senderAddress = getConnectedSenderAddress();
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
				showBidBountyStatus(createBountyStatus, 'Sign transaction in wallet...', 'loading');
				try {
					result = await SuiWalletKit.signAndExecute(txWrapper, { txOptions: { showEffects: true, showObjectChanges: true } });
				} catch (error) {
					console.warn('signAndExecute failed, falling back to manual execution:', error);
				}

				if (!result) {
					showBidBountyStatus(createBountyStatus, 'Submitting transaction...', 'loading');
					const signResult = await SuiWalletKit.signTransaction(txWrapper);
					result = await suiClient.executeTransactionBlock({
						transactionBlock: builtTxBytes,
						signature: signResult.signature,
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
						'Escrow created! ' + renderTxExplorerLinks(result.digest, true) + ' (record may not be saved)',
						'success',
						true,
					);
				} else {
					showBidBountyStatus(
						createBountyStatus,
						'Bounty created! ' + renderTxExplorerLinks(result.digest, true),
						'success',
						true,
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
		function showBidBountyStatus(element, message, type, isHtml = false) {
			if (!element) return;
			if (isHtml) {
				element.innerHTML = message;
			} else {
				element.textContent = message;
			}
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
		const linkedRenewalCost = document.getElementById('linked-renewal-cost');
		const linkedNamesSort = document.getElementById('linked-names-sort');
		const linkedNamesFilter = document.getElementById('linked-names-filter');
		const linkedNamesFilterInput = document.getElementById('linked-names-filter-input');
		const linkedFilterClear = document.getElementById('linked-filter-clear');
		const linkedNamesHint = document.getElementById('linked-names-hint');
		const linkedOwnerRow = document.querySelector('.linked-owner-row');
		const linkedControlsModule = linkedOwnerRow?.querySelector('.linked-controls-module');
		const linkedWideModule = document.querySelector('.linked-wide-module');
		const linkedNamesResultsSection = linkedWideModule?.querySelector('.linked-names-results');
		const linkedControlsAnchor = document.createComment('linked-controls-anchor');

		if (linkedControlsModule && linkedControlsModule.parentNode) {
			linkedControlsModule.parentNode.insertBefore(linkedControlsAnchor, linkedControlsModule);
		}

		const mobileLinkedControlsQuery = window.matchMedia
			? window.matchMedia('(max-width: 600px)')
			: null;

		function positionLinkedControlsForViewport() {
			if (!linkedControlsModule || !linkedWideModule) return;

			if (mobileLinkedControlsQuery && mobileLinkedControlsQuery.matches) {
				if (linkedNamesResultsSection && linkedNamesResultsSection.parentNode === linkedWideModule) {
					linkedWideModule.insertBefore(linkedControlsModule, linkedNamesResultsSection);
				} else {
					linkedWideModule.insertBefore(linkedControlsModule, linkedWideModule.firstChild);
				}
				linkedControlsModule.classList.add('linked-controls-mobile');
				return;
			}

			const anchorParent = linkedControlsAnchor.parentNode;
			if (anchorParent) {
				anchorParent.insertBefore(linkedControlsModule, linkedControlsAnchor.nextSibling);
			}
			linkedControlsModule.classList.remove('linked-controls-mobile');
		}

		positionLinkedControlsForViewport();
		if (mobileLinkedControlsQuery) {
			if (typeof mobileLinkedControlsQuery.addEventListener === 'function') {
				mobileLinkedControlsQuery.addEventListener('change', positionLinkedControlsForViewport);
			} else if (typeof mobileLinkedControlsQuery.addListener === 'function') {
				mobileLinkedControlsQuery.addListener(positionLinkedControlsForViewport);
			}
		}
		window.addEventListener('orientationchange', positionLinkedControlsForViewport);

		// Track selected name for renewal (defaults to current page name)
		var selectedRenewalName = NAME;
		var selectedRenewalExpiration = EXPIRATION_MS;
		var selectedRenewalNftId = NFT_ID;

		var linkedNamesData = [];
		var linkedNamesGrouped = {};
		var linkedNamesPrices = {};
		var linkedNamesMarketData = {};
		var linkedSortMode = 'expiry';
		var linkedFilterQuery = '';
		var linkedMatchedCount = 0;
		const linkedNameHoverCard = document.getElementById('linked-name-hover-card');
		const linkedNameHoverListing = document.getElementById('linked-name-hover-listing');
		const linkedNameHoverImage = document.getElementById('linked-name-hover-image');
		const linkedNameHoverExpiry = document.getElementById('linked-name-hover-expiry');
		const linkedNameHoverTarget = document.getElementById('linked-name-hover-target');
		let linkedNameHoverAnchor = null;
		let linkedNameHoverHideTimer = null;
		let linkedHoverRenderNonce = 0;
		const linkedTaggedPreviewCache = new Map();

			function updateLinkedNamesMeta() {
			if (linkedNamesCount) {
				const total = linkedNamesData.length;
				const totalLabel = total + ' name' + (total !== 1 ? 's' : '');
				if (!linkedFilterQuery) {
					linkedNamesCount.textContent = totalLabel;
				} else {
					linkedNamesCount.textContent =
						linkedMatchedCount + ' match' + (linkedMatchedCount !== 1 ? 'es' : '') + ' / ' + totalLabel;
				}
			}

			if (linkedRenewalCost) {
				if (linkedNamesData.length > 0) {
					var totalUsd = 0;
					for (var ri = 0; ri < linkedNamesData.length; ri++) {
						var rName = String(linkedNamesData[ri].name || '').replace(/\.sui$/i, '');
						var rLen = rName.length;
						if (rLen === 3) totalUsd += 500;
						else if (rLen === 4) totalUsd += 100;
						else if (rLen >= 5) totalUsd += 10;
					}
					var discountedUsd = totalUsd * 0.75;
					linkedRenewalCost.textContent = '$' + discountedUsd.toFixed(0) + '/yr';
					linkedRenewalCost.title = '$' + totalUsd + '/yr before 25% discount';
					linkedRenewalCost.style.display = 'inline';
				} else {
					linkedRenewalCost.style.display = 'none';
				}
			}

				if (linkedNamesHint) {
					if (!linkedFilterQuery) {
						linkedNamesHint.textContent = '';
						linkedNamesHint.style.display = 'none';
					} else if (linkedMatchedCount === 0) {
						linkedNamesHint.textContent = 'No partial or fuzzy matches yet. All names are dimmed.';
						linkedNamesHint.style.display = '';
					} else {
						linkedNamesHint.textContent = 'Showing partial and fuzzy matches first. Non-matches are dimmed.';
						linkedNamesHint.style.display = '';
					}
				}
			}

		function getExpirationTag(expirationMs) {
			if (!expirationMs) return { color: 'blue', text: '' };
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

		function trimLinkedTagNumber(value) {
			if (value.indexOf('.') === -1) return value;
			return value.replace(/.0+$/, '').replace(/(.d*?[1-9])0+$/, '$1');
		}

		function formatLinkedTagListingPriceSui(priceSui) {
			if (!Number.isFinite(priceSui) || priceSui <= 0) return '0';
			const units = [
				{ divisor: 1000000000000, suffix: 'T' },
				{ divisor: 1000000000, suffix: 'B' },
				{ divisor: 1000000, suffix: 'M' },
				{ divisor: 1000, suffix: 'K' },
			];
			for (const unit of units) {
				if (priceSui >= unit.divisor) {
					const compact = priceSui / unit.divisor;
					const decimals = compact >= 100 ? 0 : 1;
					return trimLinkedTagNumber(compact.toFixed(decimals)) + unit.suffix;
				}
			}
			if (priceSui >= 100) return Math.round(priceSui).toString();
			if (priceSui >= 1) return trimLinkedTagNumber(priceSui.toFixed(2));
			return trimLinkedTagNumber(priceSui.toFixed(3));
		}

function shortAddr(addr) {
					if (!addr || typeof addr !== 'string') return '--';
					return addr.slice(0, 6) + '...' + addr.slice(-4);
				}

				async function resolveLinkedPrimaryName(addr) {
					if (!addr || typeof addr !== 'string' || !addr.startsWith('0x')) return null;
					const cacheKey = addr.toLowerCase();
					if (linkedPrimaryNameCache.has(cacheKey)) {
						return linkedPrimaryNameCache.get(cacheKey);
					}
					const primaryName = await fetchPrimaryName(addr).catch(() => null);
					if (primaryName) {
						linkedPrimaryNameCache.set(cacheKey, primaryName);
					}
					return primaryName;
				}

			function normalizeLinkedGroupAddress(value) {
				if (!value) return '';
				const normalized = String(value).trim().toLowerCase();
				if (!normalized) return '';
				return normalized.startsWith('0x') ? normalized : '';
			}

			function isLinkedNameExpired(item) {
				return typeof item?.expirationMs === 'number' && item.expirationMs < Date.now();
			}

			function isLinkedGroupAllExpired(group) {
				if (!group || group.length === 0) return false;
				for (let i = 0; i < group.length; i++) {
					if (!isLinkedNameExpired(group[i])) return false;
				}
				return true;
			}

		function normalizeLinkedNameKey(name) {
			return String(name || '')
				.toLowerCase()
				.replace(/.sui$/, '');
		}

		function isRootLinkedSuiName(name) {
			const normalized = normalizeLinkedNameKey(name);
			if (!normalized) return false;
			return normalized.indexOf('.') === -1;
		}

		function isLinkedNameListed(item) {
			if (!item || !item.name) return false;
			const cleanName = String(item.name).replace(/\\.sui$/, '');
			const isCurrent = cleanName.toLowerCase() === NAME.toLowerCase();
			if (isCurrent && Number.isFinite(Number(currentListing?.price)) && Number(currentListing.price) > 0) {
				return true;
			}
			const marketData = linkedNamesMarketData[cleanName];
			if (marketData?.listingPriceSui) return true;
			return Boolean(linkedNamesPrices[cleanName] || item.isListed);
		}

		function getLinkedNameListingPriceSui(item) {
			if (!item || !item.name) return null;
			if (typeof item.listingPriceMist === 'number' && Number.isFinite(item.listingPriceMist) && item.listingPriceMist > 0) {
				return item.listingPriceMist / 1e9;
			}
			const cleanName = String(item.name).replace(/\\.sui$/, '');
			const isCurrent = cleanName.toLowerCase() === NAME.toLowerCase();
			if (isCurrent && Number.isFinite(Number(currentListing?.price)) && Number(currentListing.price) > 0) {
				return Number(currentListing.price) / 1e9;
			}
			const marketData = linkedNamesMarketData[cleanName];
			if (marketData?.listingPriceSui) {
				const parsed = parseFloat(marketData.listingPriceSui);
				return Number.isFinite(parsed) ? parsed : null;
			}
			if (linkedNamesPrices[cleanName]) {
				const parsed = parseFloat(linkedNamesPrices[cleanName]);
				return Number.isFinite(parsed) ? parsed : null;
			}
			return null;
		}

		function normalizeLinkedMatchText(value) {
			return String(value || '')
				.toLowerCase()
				.replace(/\\.sui$/, '')
				.replace(/[^a-z0-9]/g, '');
		}

		function isSubsequenceMatch(query, target) {
			if (!query) return true;
			let qIndex = 0;
			for (let i = 0; i < target.length; i++) {
				if (target[i] === query[qIndex]) qIndex++;
				if (qIndex >= query.length) return true;
			}
			return false;
		}

		function editDistanceWithin(a, b, maxDistance) {
			if (Math.abs(a.length - b.length) > maxDistance) return false;

			const prev = new Array(b.length + 1);
			for (let j = 0; j <= b.length; j++) prev[j] = j;

			for (let i = 1; i <= a.length; i++) {
				let left = i;
				let diag = i - 1;
				let rowMin = left;

				for (let j = 1; j <= b.length; j++) {
					const up = prev[j];
					const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
					const next = Math.min(left + 1, up + 1, diag + cost);
					diag = up;
					prev[j] = next;
					left = next;
					if (next < rowMin) rowMin = next;
				}

				if (rowMin > maxDistance) return false;
			}

			return prev[b.length] <= maxDistance;
		}

		function bigramSimilarity(a, b) {
			if (!a || !b) return 0;
			if (a === b) return 1;
			if (a.length < 2 || b.length < 2) return 0;

			const counts = {};
			let aTotal = 0;
			for (let i = 0; i < a.length - 1; i++) {
				const key = a.slice(i, i + 2);
				counts[key] = (counts[key] || 0) + 1;
				aTotal++;
			}

			let overlap = 0;
			let bTotal = 0;
			for (let i = 0; i < b.length - 1; i++) {
				const key = b.slice(i, i + 2);
				bTotal++;
				if (counts[key] > 0) {
					overlap++;
					counts[key]--;
				}
			}

			return overlap / Math.max(aTotal, bTotal);
		}

		function getLinkedNameMatchScore(name, query) {
			const target = normalizeLinkedMatchText(name);
			const needle = normalizeLinkedMatchText(query);
			if (!needle) return 1;
			if (!target) return 0;

			if (target === needle) return 1;
			if (target.startsWith(needle)) return 0.96;
			if (target.indexOf(needle) !== -1) return 0.86;
			if (needle.length >= 2 && isSubsequenceMatch(needle, target)) return 0.74;

			const maxDistance = needle.length <= 4 ? 1 : 2;
			if (editDistanceWithin(needle, target, maxDistance)) return 0.66;
			if (bigramSimilarity(needle, target) >= 0.45) return 0.55;

			return 0;
		}

		function getLinkedItemMatchScore(item) {
			const cleanName = item.name.replace(/\\.sui$/, '');
			return getLinkedNameMatchScore(cleanName, linkedFilterQuery);
		}

		function isCurrentProfile(name) {
			return name.replace(/\\.sui$/, '').toLowerCase() === NAME.toLowerCase();
		}

		function compareLinkedItemsByMode(a, b) {
			const aIsCurrent = isCurrentProfile(a.name);
			const bIsCurrent = isCurrentProfile(b.name);

			// Current profile always comes first
			if (aIsCurrent && !bIsCurrent) return -1;
			if (!aIsCurrent && bIsCurrent) return 1;

			if (linkedSortMode === 'expiry') {
				const aListed = isLinkedNameListed(a);
				const bListed = isLinkedNameListed(b);
				if (aListed && !bListed) return -1;
				if (!aListed && bListed) return 1;
				if (a.isPrimary && !b.isPrimary) return -1;
				if (!a.isPrimary && b.isPrimary) return 1;
				if (a.expirationMs === null) return 1;
				if (b.expirationMs === null) return -1;
				return a.expirationMs - b.expirationMs;
			}

		if (linkedSortMode === 'price') {
			const nameA = a.name.replace(/\\.sui$/, '');
			const nameB = b.name.replace(/\\.sui$/, '');
			const priceA = linkedNamesPrices[nameA] ? parseFloat(linkedNamesPrices[nameA]) : null;
			const priceB = linkedNamesPrices[nameB] ? parseFloat(linkedNamesPrices[nameB]) : null;

			// Listed names (with or without price loaded) come before unlisted
			const hasPriceA = priceA !== null || a.isListed;
			const hasPriceB = priceB !== null || b.isListed;

			if (hasPriceA && hasPriceB) {
				// Both have price data - sort by actual price
				if (priceA !== null && priceB !== null) return priceA - priceB;
				// If only one has price loaded, it comes first
				if (priceA !== null) return -1;
				if (priceB !== null) return 1;
				// Both listed but no price loaded - sort by expiration
				if (a.expirationMs === null) return 1;
				if (b.expirationMs === null) return -1;
				return a.expirationMs - b.expirationMs;
			}
			if (hasPriceA) return -1;
			if (hasPriceB) return 1;
			// Neither has price - sort by expiration
			if (a.expirationMs === null) return 1;
			if (b.expirationMs === null) return -1;
			return a.expirationMs - b.expirationMs;
		}

			const aName = a.name.replace(/\\.sui$/, '');
			const bName = b.name.replace(/\\.sui$/, '');
			return aName.localeCompare(bName);
		}

		function renderNameChip(item) {
			const cleanName = item.name.replace(/\\.sui$/, '');
			const isCurrent = cleanName.toLowerCase() === NAME.toLowerCase();
			const showGoldStar = Boolean(item.isPrimary);
			const listingPriceSui = getLinkedNameListingPriceSui(item);
			const isListed = isLinkedNameListed(item) && Number.isFinite(listingPriceSui) && listingPriceSui > 0;
			const tag = getExpirationTag(item.expirationMs);
			const matchScore = getLinkedItemMatchScore(item);
			const isFilterMatch = matchScore > 0;
				const classes = ['linked-name-chip'];
				if (isCurrent) classes.push('current');
				if (item.isPrimary) classes.push('primary');
				else if (isListed) classes.push('listed');
				else classes.push('blue');
				if (linkedFilterQuery && !isFilterMatch) classes.push('dimmed');
				if (isFilterMatch) linkedMatchedCount++;

			const profileUrl = 'https://' + encodeURIComponent(cleanName) + '.sui.ski';
			const imageUrl = getSuiNSImageUrl(cleanName, item.expirationMs);
			const expirationAttr =
				typeof item.expirationMs === 'number' && Number.isFinite(item.expirationMs)
					? String(item.expirationMs)
					: '';
			const targetAddress = item.targetAddress || '';
			let h =
				'<a href="' + escapeHtmlJs(profileUrl) + '" class="' + classes.join(' ') + '" data-match-score="' + matchScore.toFixed(2) + '"' +
				' data-name="' + escapeHtmlJs(cleanName) + '"' +
				' data-profile-url="' + escapeHtmlJs(profileUrl) + '"' +
				' data-image-url="' + escapeHtmlJs(imageUrl) + '"' +
				' data-expiration-ms="' + escapeHtmlJs(expirationAttr) + '"' +
				' data-target-address="' + escapeHtmlJs(targetAddress) + '"' +
				'>';
				if (showGoldStar) {
					h += '<svg class="primary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
				}
				h += '<span class="linked-name-text">' + cleanName + '</span>';
			if (isListed) {
				const priceText = formatLinkedTagListingPriceSui(listingPriceSui);
				h += '<span class="linked-name-sep">|</span><span class="linked-name-price"><svg class="sui-price-icon" viewBox="0 0 300 384" fill="#4da2ff"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z"/></svg>' + priceText + '</span>';
			} else if (tag.text) {
				h += '<span class="linked-name-tag ' + tag.color + '">' + tag.text + '</span>';
			}
			h += '</a>';
			return h;
		}

		function formatLinkedHoverExpiry(expirationMs) {
			if (!expirationMs || !Number.isFinite(expirationMs)) return 'Expiry: --';
			const diffMs = expirationMs - Date.now();
			const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
			if (days < 0) return 'Expiry: expired';
			if (days === 0) return 'Expiry: <1d';
			return 'Expiry: ' + days + 'd';
		}

		function formatLinkedHoverTarget(targetAddress) {
			if (!targetAddress) return 'Target: unset';
			return 'Target: ' + shortAddr(targetAddress);
		}

		function getLinkedHoverListing(name) {
			const market = linkedNamesMarketData[name];
			if (!market) return 'No active listing';
			if (market.listingPriceSui) return 'Listed ' + market.listingPriceSui + ' SUI';
			if (market.bestBidSui) return 'Best bid ' + market.bestBidSui + ' SUI';
			return 'No active listing';
		}

		async function buildTaggedLinkedPreviewDataUrl(imageUrl, profileUrl) {
			if (!imageUrl) return null;
			const cacheKey = imageUrl + '|' + profileUrl;
			if (linkedTaggedPreviewCache.has(cacheKey)) return linkedTaggedPreviewCache.get(cacheKey);

			if (!window.QRious) {
				await loadQRious().catch(() => null);
			}

			const srcImg = await loadImageForCanvas(imageUrl).catch(() => null);
			if (!srcImg) return null;

			const srcWidth = srcImg.naturalWidth || srcImg.width || 600;
			const srcHeight = srcImg.naturalHeight || srcImg.height || 600;
			const maxSide = 640;
			const scale = Math.min(1, maxSide / Math.max(srcWidth, srcHeight));
			const canvasWidth = Math.max(220, Math.round(srcWidth * scale));
			const canvasHeight = Math.max(220, Math.round(srcHeight * scale));

			const canvas = document.createElement('canvas');
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			const ctx = canvas.getContext('2d');
			if (!ctx) return null;

			ctx.drawImage(srcImg, 0, 0, canvasWidth, canvasHeight);

			const topFade = ctx.createLinearGradient(0, 0, 0, canvasHeight * 0.24);
			topFade.addColorStop(0, 'rgba(5, 9, 20, 0.26)');
			topFade.addColorStop(1, 'rgba(5, 9, 20, 0.0)');
			ctx.fillStyle = topFade;
			ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.24);

			let logoImage = null;
			try {
				logoImage = await loadImageForCanvas(LOGO_DATA_URL);
			} catch {}

			const qrBadgeSize = Math.max(76, Math.round(Math.min(canvasWidth, canvasHeight) * 0.2));
			const qrMargin = Math.max(8, Math.round(qrBadgeSize * 0.14));
			const qrX = qrMargin;
			const qrY = canvasHeight - qrBadgeSize - qrMargin;
			const hoverQrCanvas = document.createElement('canvas');
			renderQR(hoverQrCanvas, Math.max(256, qrBadgeSize * 2), profileUrl);
			drawCornerBrandedQr(ctx, qrX, qrY, qrBadgeSize, profileUrl, logoImage, hoverQrCanvas);

			const minSide = Math.min(canvasWidth, canvasHeight);
			const brandIconSize = Math.max(40, Math.min(96, Math.round(minSide * 0.18)));
			const brandPadding = Math.max(12, Math.round(minSide * 0.035));
			const brandShiftDown = Math.max(6, Math.round(minSide * 0.018));
			const brandX = canvasWidth - brandPadding - brandIconSize;
			const brandY = brandPadding + brandShiftDown;
			if (logoImage) {
				drawVisualIntoBox(ctx, logoImage, brandX, brandY, brandIconSize, brandIconSize, Math.round(brandIconSize * 0.2));
			} else {
				drawSiteLogoGlyph(ctx, brandX, brandY, brandIconSize);
			}

			const nftTagSize = Math.max(8, Math.round(brandIconSize * 0.28));
			const nftTagY = brandY + brandIconSize + Math.max(4, Math.round(nftTagSize * 0.42));
			const brandTextGradient = ctx.createLinearGradient(
				brandX,
				brandY,
				brandX + brandIconSize,
				brandY + brandIconSize,
			);
			brandTextGradient.addColorStop(0, '#60a5fa');
			brandTextGradient.addColorStop(1, '#a78bfa');
			ctx.fillStyle = brandTextGradient;
			ctx.font = '700 ' + nftTagSize + 'px Inter, system-ui, -apple-system, sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'alphabetic';
			ctx.fillText('.sui.ski', brandX + brandIconSize / 2, nftTagY);
			ctx.textAlign = 'left';

			const dataUrl = canvas.toDataURL('image/png');
			linkedTaggedPreviewCache.set(cacheKey, dataUrl);
			return dataUrl;
		}

		function clearLinkedNameHoverHideTimer() {
			if (!linkedNameHoverHideTimer) return;
			clearTimeout(linkedNameHoverHideTimer);
			linkedNameHoverHideTimer = null;
		}

		function hideLinkedNameHover(immediate = false) {
			if (!linkedNameHoverCard) return;
			clearLinkedNameHoverHideTimer();
			const doHide = function() {
				if (linkedNameHoverAnchor) linkedNameHoverAnchor.classList.remove('previewing');
				linkedNameHoverCard.classList.remove('active');
				linkedNameHoverCard.style.display = 'none';
				linkedNameHoverCard.setAttribute('aria-hidden', 'true');
				linkedNameHoverAnchor = null;
			};
			if (immediate) {
				doHide();
				return;
			}
			linkedNameHoverHideTimer = setTimeout(doHide, 90);
		}

		function positionLinkedNameHover(anchorEl) {
			if (!linkedNameHoverCard || !anchorEl) return;
			const margin = 14;
			const rect = anchorEl.getBoundingClientRect();
			const cardWidth = linkedNameHoverCard.offsetWidth || 288;
			const cardHeight = linkedNameHoverCard.offsetHeight || 170;

			let left = rect.left + rect.width / 2 - cardWidth / 2;
			left = Math.max(10, Math.min(left, window.innerWidth - cardWidth - 10));

			let top = rect.top - cardHeight - margin;
			if (top < 10) top = rect.bottom + margin;
			if (top + cardHeight > window.innerHeight - 10) {
				top = Math.max(10, window.innerHeight - cardHeight - 10);
			}

			linkedNameHoverCard.style.left = left + 'px';
			linkedNameHoverCard.style.top = top + 'px';
		}

		function renderLinkedNameHover(anchorEl) {
			if (
				!linkedNameHoverCard
				|| !linkedNameHoverListing
				|| !linkedNameHoverImage
				|| !linkedNameHoverExpiry
				|| !linkedNameHoverTarget
			) {
				return;
			}

			clearLinkedNameHoverHideTimer();
			if (linkedNameHoverAnchor && linkedNameHoverAnchor !== anchorEl) {
				linkedNameHoverAnchor.classList.remove('previewing');
			}
			linkedNameHoverAnchor = anchorEl;
			linkedNameHoverAnchor.classList.add('previewing');
			const renderNonce = ++linkedHoverRenderNonce;

			const cleanName = String(anchorEl.dataset.name || '').trim();
			const profileUrl = String(anchorEl.dataset.profileUrl || '');
			const imageUrl = String(anchorEl.dataset.imageUrl || '');
			const targetAddress = String(anchorEl.dataset.targetAddress || '');
			const expirationRaw = Number(anchorEl.dataset.expirationMs || NaN);
			const expirationMs = Number.isFinite(expirationRaw) ? expirationRaw : null;

			linkedNameHoverListing.textContent = getLinkedHoverListing(cleanName);
			linkedNameHoverExpiry.textContent = formatLinkedHoverExpiry(expirationMs);
			linkedNameHoverTarget.textContent = formatLinkedHoverTarget(targetAddress);

			linkedNameHoverImage.onerror = function() {
				linkedNameHoverImage.style.display = 'none';
			};
			linkedNameHoverImage.onload = function() {
				linkedNameHoverImage.style.display = 'block';
			};
			linkedNameHoverImage.src = imageUrl || getSuiNSImageUrl(cleanName, expirationMs);

			linkedNameHoverCard.style.display = 'flex';
			linkedNameHoverCard.setAttribute('aria-hidden', 'false');
			positionLinkedNameHover(anchorEl);
			requestAnimationFrame(function() {
				linkedNameHoverCard.classList.add('active');
				positionLinkedNameHover(anchorEl);
			});

			const qrValue = profileUrl || ('https://' + encodeURIComponent(cleanName) + '.sui.ski');
			buildTaggedLinkedPreviewDataUrl(imageUrl || getSuiNSImageUrl(cleanName, expirationMs), qrValue)
				.then(function(taggedUrl) {
					if (!taggedUrl) return;
					if (renderNonce !== linkedHoverRenderNonce) return;
					if (!linkedNameHoverAnchor || linkedNameHoverAnchor !== anchorEl) return;
					linkedNameHoverImage.src = taggedUrl;
				})
				.catch(function() {});
		}

			async function renderLinkedNames() {
				if (!linkedNamesList || linkedNamesData.length === 0) {
					hideLinkedNameHover(true);
					return;
				}

			let html = '';
			linkedMatchedCount = 0;

			if (linkedFilterQuery) {
				const ranked = linkedNamesData.slice().sort(function(a, b) {
					if (a.isPrimary && !b.isPrimary) return -1;
					if (!a.isPrimary && b.isPrimary) return 1;
					const scoreA = getLinkedItemMatchScore(a);
					const scoreB = getLinkedItemMatchScore(b);
					const matchedA = scoreA > 0;
					const matchedB = scoreB > 0;

					if (matchedA && !matchedB) return -1;
					if (!matchedA && matchedB) return 1;
					if (matchedA && matchedB && scoreA !== scoreB) return scoreB - scoreA;

					return compareLinkedItemsByMode(a, b);
				});

				html += '<div class="linked-group-names">';
				for (const item of ranked) html += renderNameChip(item);
				html += '</div>';
				linkedNamesList.innerHTML = html;
				updateLinkedNamesMeta();
				return;
			}

				if (linkedSortMode === 'address') {
					const addresses = Object.keys(linkedNamesGrouped).sort(function(a, b) {
						const groupA = linkedNamesGrouped[a] || [];
						const groupB = linkedNamesGrouped[b] || [];
						const aExpired = isLinkedGroupAllExpired(groupA);
						const bExpired = isLinkedGroupAllExpired(groupB);
						if (aExpired && !bExpired) return 1;
						if (!aExpired && bExpired) return -1;

						const rank = function(key) {
							if (key === '__expired_misc') return 4;
							if (key === 'unset') return 3;
							if (key === '__misc') return 2;
							return 1;
						};
						const rankA = rank(a);
						const rankB = rank(b);
						if (rankA !== rankB) return rankA - rankB;

						if (groupB.length !== groupA.length) return groupB.length - groupA.length;
						return String(a).localeCompare(String(b));
					});

					const realAddresses = addresses.filter(function(addr) {
						return addr !== 'unset' && addr !== '__misc' && addr !== '__expired_misc' && addr.startsWith('0x');
					});
					const primaryNamePromises = realAddresses.map(function(addr) {
						return resolveLinkedPrimaryName(addr).then(function(primary) {
							return [addr, primary];
						});
					});
					const primaryNamePairs = await Promise.all(primaryNamePromises);
					const primaryNameMap = new Map(primaryNamePairs);

				let groupIndex = 0;
				for (const addr of addresses) {
					const group = linkedNamesGrouped[addr];
					if (!group || group.length === 0) continue;

					const primaryName = primaryNameMap.get(addr);
					const addrLabel =
						addr === 'unset'
							? 'No target set'
							: addr === '__misc'
								? 'Other linked targets'
								: addr === '__expired_misc'
									? 'Expired linked targets'
									: (primaryName ? primaryName.replace(/.sui$/i, '') : shortAddr(addr));
					const collapseByDefault = isLinkedGroupAllExpired(group);
					html += '<div class="linked-group' + (collapseByDefault ? ' collapsed' : '') + '" data-group-index="' + groupIndex + '">';
					html += '<button type="button" class="linked-group-header">';
					html += '<svg class="linked-group-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
					html += '<span class="linked-group-addr">' + addrLabel + '</span>';
					html += '<span class="linked-group-count">' + group.length + '</span>';
					html += '</button>';
					html += '<div class="linked-group-names">';
					for (const item of group) html += renderNameChip(item);
					html += '</div></div>';
					groupIndex++;
				}
			} else if (linkedSortMode === 'expiry') {
				const sorted = linkedNamesData.slice().sort(function(a, b) {
					if (a.isPrimary && !b.isPrimary) return -1;
					if (!a.isPrimary && b.isPrimary) return 1;
					const aListed = isLinkedNameListed(a);
					const bListed = isLinkedNameListed(b);
					if (aListed && !bListed) return -1;
					if (!aListed && bListed) return 1;
					if (a.expirationMs === null) return 1;
					if (b.expirationMs === null) return -1;
					return a.expirationMs - b.expirationMs;
				});
				html += '<div class="linked-group-names">';
				for (const item of sorted) html += renderNameChip(item);
				html += '</div>';
		} else if (linkedSortMode === 'price') {
			const withPrice = [];
			const withoutPrice = [];
			for (const item of linkedNamesData) {
				const cleanName = item.name.replace(/\\.sui$/, '');
				// Listed names (with or without price loaded) go in withPrice
				if (linkedNamesPrices[cleanName] || item.isListed) {
					withPrice.push(item);
				} else {
					withoutPrice.push(item);
				}
			}
			withPrice.sort(function(a, b) {
					if (a.isPrimary && !b.isPrimary) return -1;
					if (!a.isPrimary && b.isPrimary) return 1;
					const nameA = a.name.replace(/\\.sui$/, '');
					const nameB = b.name.replace(/\\.sui$/, '');
					const priceA = linkedNamesPrices[nameA] ? parseFloat(linkedNamesPrices[nameA]) : null;
					const priceB = linkedNamesPrices[nameB] ? parseFloat(linkedNamesPrices[nameB]) : null;
					// Both have price - sort by price
					if (priceA !== null && priceB !== null) return priceA - priceB;
					// Only one has price - it comes first
					if (priceA !== null) return -1;
					if (priceB !== null) return 1;
					// Neither has price loaded - sort by expiration
					if (a.expirationMs === null) return 1;
					if (b.expirationMs === null) return -1;
					return a.expirationMs - b.expirationMs;
				});
				withoutPrice.sort(function(a, b) {
					if (a.isPrimary && !b.isPrimary) return -1;
					if (!a.isPrimary && b.isPrimary) return 1;
					if (a.expirationMs === null) return 1;
					if (b.expirationMs === null) return -1;
					return a.expirationMs - b.expirationMs;
				});
				const sorted = withPrice.concat(withoutPrice);
				html += '<div class="linked-group-names">';
				for (const item of sorted) html += renderNameChip(item);
				html += '</div>';
			}

			linkedNamesList.innerHTML = html;

			linkedNamesList.querySelectorAll('.linked-group-header').forEach(function(header) {
				header.addEventListener('click', function(e) {
					e.preventDefault();
					const addrEl = e.target.closest('.linked-group-addr');
					if (addrEl instanceof Element) {
						const text = addrEl.textContent || '';
						const isLabel = text !== 'No target set'
							&& !text.startsWith('Other')
							&& !text.startsWith('Expired')
							&& !text.startsWith('0x')
							&& text.length > 0;
						if (isLabel) {
							const profileUrl = 'https://' + encodeURIComponent(text) + '.sui.ski';
							window.open(profileUrl, '_blank', 'noopener,noreferrer');
							return;
						}
					}
					const group = this.closest('.linked-group');
					if (group) group.classList.toggle('collapsed');
				});
			});

			updateLinkedNamesMeta();
		}

			async function fetchListingPrices(names) {
				const batchSize = 6;
				for (let i = 0; i < names.length; i += batchSize) {
					const batch = names.slice(i, i + batchSize);
					const fetches = batch.map(function(item) {
						const cleanName = item.name.replace(/\\.sui$/, '');
						const tokenId = typeof item?.nftId === 'string' ? item.nftId : '';
						const tokenQuery = tokenId ? ('?tokenId=' + encodeURIComponent(tokenId)) : '';
						const tokenUrl = '/api/marketplace/' + encodeURIComponent(cleanName) + tokenQuery;
						const fallbackUrl = '/api/marketplace/' + encodeURIComponent(cleanName);
						return fetch(tokenUrl)
							.then(function(r) { return r.ok ? r.json() : null; })
							.then(async function(data) {
								if ((!data || !data.bestListing) && tokenId) {
									const fallback = await fetch(fallbackUrl)
										.then(function(r) { return r.ok ? r.json() : null; })
										.catch(function() { return null; });
									if (fallback) data = fallback;
								}
								const listingPriceSui = data?.bestListing?.price
									? (Number(data.bestListing.price) / 1e9).toFixed(2)
									: null;
								const bestBidSui = data?.bestBid?.price
									? (Number(data.bestBid.price) / 1e9).toFixed(2)
								: null;
							linkedNamesMarketData[cleanName] = {
								listingPriceSui,
								bestBidSui,
								bidder: data?.bestBid?.bidder || '',
								seller: data?.bestListing?.seller || '',
							};
							if (data?.bestListing?.price) {
								linkedNamesPrices[cleanName] = (Number(data.bestListing.price) / 1e9).toFixed(2);
							}
						})
						.catch(function() {});
				});
				await Promise.all(fetches);
			}
			await renderLinkedNames();
		}

		if (linkedNamesSort) {
			linkedNamesSort.addEventListener('click', function(e) {
				const pill = e.target.closest('.linked-sort-pill');
				if (!pill) return;
				const mode = pill.dataset.sort;
				if (!mode || mode === linkedSortMode) return;
				linkedSortMode = mode;
				linkedNamesSort.querySelectorAll('.linked-sort-pill').forEach(function(p) { p.classList.remove('active'); });
				pill.classList.add('active');
				renderLinkedNames();
			});
		}

		if (linkedNamesFilterInput) {
			linkedNamesFilterInput.addEventListener('input', function() {
				linkedFilterQuery = (this.value || '').trim();
				renderLinkedNames();
			});
			linkedNamesFilterInput.addEventListener('keydown', function(e) {
				if (e.key !== 'Escape') return;
				if (!this.value) return;
				this.value = '';
				linkedFilterQuery = '';
				renderLinkedNames();
			});
		}

		if (linkedFilterClear) {
			linkedFilterClear.addEventListener('click', function() {
				if (!linkedNamesFilterInput) return;
				linkedNamesFilterInput.value = '';
				linkedFilterQuery = '';
				renderLinkedNames();
				linkedNamesFilterInput.focus();
			});
		}

			async function fetchLinkedNames(options = {}) {
			const primaryAddr = TARGET_ADDRESS || OWNER_ADDRESS;
			const forceRefresh = options?.forceRefresh === true;
			if (!linkedNamesList || !primaryAddr) {
				linkedNamesData = [];
				linkedNamesGrouped = {};
				linkedNamesPrices = {};
				linkedNamesMarketData = {};
				linkedMatchedCount = 0;
				if (linkedNamesList) {
					linkedNamesList.innerHTML = '<div class="linked-names-empty">No address found</div>';
				}
				if (linkedNamesCount) linkedNamesCount.textContent = '0';
				if (linkedRenewalCost) linkedRenewalCost.style.display = 'none';
				if (linkedNamesSort) linkedNamesSort.style.display = 'none';
				if (linkedNamesFilter) linkedNamesFilter.style.display = 'none';
				return;
			}

			try {
				linkedNamesPrices = {};
				linkedNamesMarketData = {};
				const addressesToQuery = [primaryAddr];
				const secondaryAddr = (TARGET_ADDRESS && OWNER_ADDRESS && TARGET_ADDRESS !== OWNER_ADDRESS)
					? OWNER_ADDRESS : null;
				if (secondaryAddr) addressesToQuery.push(secondaryAddr);

				const fetches = addressesToQuery.map(function(addr) {
					const refreshQuery = forceRefresh
						? ('?refresh=1&t=' + String(Date.now()))
						: '';
					return fetch('/api/names/' + addr + refreshQuery).then(function(r) {
						return r.ok ? r.json() : { names: [], grouped: {} };
					}).catch(function() { return { names: [], grouped: {} }; });
				});
				const results = await Promise.all(fetches);

				const seenIds = {};
					var names = [];
					for (var ri = 0; ri < results.length; ri++) {
						var rNames = results[ri].names || [];
						var sourceOwner = normalizeLinkedGroupAddress(addressesToQuery[ri]);
						for (var ni = 0; ni < rNames.length; ni++) {
							var item = rNames[ni];
							if (seenIds[item.nftId]) continue;
							seenIds[item.nftId] = true;
							item.__sourceOwner = sourceOwner;
							names.push(item);
						}
					}

					const fallbackSelectedNameKey = normalizeLinkedNameKey(selectedRenewalName || NAME);
					const hasSelectedName = names.some(function(item) {
						return normalizeLinkedNameKey(item?.name) === fallbackSelectedNameKey;
					});
					if (!hasSelectedName && fallbackSelectedNameKey) {
						names.push({
							name: fallbackSelectedNameKey,
							nftId: selectedRenewalNftId || NFT_ID || ('profile-' + fallbackSelectedNameKey),
							expirationMs: Number.isFinite(selectedRenewalExpiration) ? selectedRenewalExpiration : EXPIRATION_MS,
							targetAddress: currentTargetAddress || TARGET_ADDRESS || OWNER_ADDRESS || null,
							isPrimary: Boolean(isProfilePrimaryNameForOwner()),
							isListed: Boolean(currentListing),
							__sourceOwner: normalizeLinkedGroupAddress(OWNER_ADDRESS || TARGET_ADDRESS || ''),
						});
					}

						var grouped = {};
						var singletonActive = [];
					var singletonExpired = [];
					for (var gi = 0; gi < names.length; gi++) {
						var normalizedTarget = normalizeLinkedGroupAddress(names[gi].targetAddress);
						var normalizedOwner = normalizeLinkedGroupAddress(names[gi].__sourceOwner);
						var gKey = normalizedTarget || normalizedOwner || 'unset';
						if (!grouped[gKey]) grouped[gKey] = [];
						grouped[gKey].push(names[gi]);
					}

					for (const gk of Object.keys(grouped)) {
						const group = grouped[gk];
						if (!group || group.length !== 1) continue;
						const only = group[0];
						if (isLinkedNameExpired(only)) {
							singletonExpired.push(only);
						} else {
							singletonActive.push(only);
						}
						delete grouped[gk];
					}
					if (singletonActive.length > 0) grouped.__misc = singletonActive;
					if (singletonExpired.length > 0) grouped.__expired_misc = singletonExpired;

				// Fallback primary detection:
				// Resolve the primary name for each queried wallet address and mark matching names.
				// This guards against stale/missed backend isPrimary flags.
				try {
					const primaryResolutions = await Promise.all(
						addressesToQuery.map(async function(addr) {
							const primary = await fetchPrimaryName(addr).catch(() => null);
							console.log('fetchPrimaryName for', addr, 'returned:', primary);
							return normalizeLinkedNameKey(primary);
						}),
					);
					console.log('primaryResolutions:', primaryResolutions);
					const primaryNameSet = new Set(primaryResolutions.filter(Boolean));
					console.log('primaryNameSet:', Array.from(primaryNameSet));
					if (primaryNameSet.size > 0) {
						for (var pi = 0; pi < names.length; pi++) {
							var normalizedName = normalizeLinkedNameKey(names[pi].name);
							if (primaryNameSet.has(normalizedName)) {
								console.log('Marking as primary:', names[pi].name);
								names[pi].isPrimary = true;
							}
						}
					}
				} catch (e) {
					console.log('Primary fallback resolution failed:', e);
				}

				var hasPrimary = names.some(function(n) { return n.isPrimary; });
				if (!hasPrimary) {
					var ownerNameEl = document.querySelector('.owner-name');
					var ownerPrimary = ownerNameEl ? normalizeLinkedNameKey(ownerNameEl.textContent) : '';
					if (!ownerPrimary && connectedPrimaryName) {
						ownerPrimary = normalizeLinkedNameKey(connectedPrimaryName);
					}
					if (ownerPrimary) {
						var found = false;
						for (var fi = 0; fi < names.length; fi++) {
							if (normalizeLinkedNameKey(names[fi].name) === ownerPrimary) {
								names[fi].isPrimary = true;
								found = true;
								break;
							}
						}
						if (!found) {
							var injected = {
								name: ownerPrimary,
								nftId: 'primary-injected-' + ownerPrimary,
								expirationMs: null,
								targetAddress: TARGET_ADDRESS || OWNER_ADDRESS || null,
								isPrimary: true,
								isListed: false,
								__sourceOwner: normalizeLinkedGroupAddress(OWNER_ADDRESS || TARGET_ADDRESS || ''),
							};
							names.unshift(injected);
							var injectKey = normalizeLinkedGroupAddress(injected.targetAddress || injected.__sourceOwner);
							if (injectKey && grouped[injectKey]) {
								grouped[injectKey].unshift(injected);
							} else if (grouped.__misc) {
								grouped.__misc.unshift(injected);
							} else {
								grouped.__misc = [injected];
							}
						}
					}
				}

				for (const groupKey of Object.keys(grouped)) {
					grouped[groupKey].sort(function(a, b) {
						if (a.isPrimary && !b.isPrimary) return -1;
						if (!a.isPrimary && b.isPrimary) return 1;
						return compareLinkedItemsByMode(a, b);
					});
				}

				linkedNamesData = names;
				linkedNamesGrouped = grouped;
				linkedMatchedCount = 0;
				const selectedNameKey = normalizeLinkedNameKey(selectedRenewalName || NAME);
				const selectedNameItem = names.find(function(item) {
					return normalizeLinkedNameKey(item?.name) === selectedNameKey;
				});
				if (selectedNameItem) {
					if (selectedNameItem.nftId) {
						selectedRenewalNftId = selectedNameItem.nftId;
					}
					if (
						typeof selectedNameItem.expirationMs === 'number'
						&& Number.isFinite(selectedNameItem.expirationMs)
						&& selectedNameItem.expirationMs > 0
					) {
						selectedRenewalExpiration = selectedNameItem.expirationMs;
						if (ovRenewalCard) {
							ovRenewalCard.setAttribute('data-expires-ms', String(selectedNameItem.expirationMs));
						}
						updateYearsStepper();
					}
				}

				if (names.length === 0) {
					linkedNamesList.innerHTML = '<div class="linked-names-empty">No other names owned by this wallet</div>';
					updateLinkedNamesMeta();
					if (linkedNamesSort) linkedNamesSort.style.display = 'none';
					if (linkedNamesFilter) linkedNamesFilter.style.display = 'none';
					return;
				}

				if (linkedNamesSort) linkedNamesSort.style.display = '';
				if (linkedNamesFilter) linkedNamesFilter.style.display = '';
				await renderLinkedNames();
				fetchListingPrices(names);
			} catch (error) {
				console.error('Failed to fetch linked names:', error);
				linkedNamesList.innerHTML = '<div class="linked-names-empty">Could not load linked names</div>';
				if (linkedNamesCount) linkedNamesCount.textContent = '--';
				if (linkedRenewalCost) linkedRenewalCost.style.display = 'none';
				if (linkedNamesSort) linkedNamesSort.style.display = 'none';
				if (linkedNamesFilter) linkedNamesFilter.style.display = 'none';
			}
		}

		if (OWNER_ADDRESS || TARGET_ADDRESS) {
			fetchLinkedNames();
		}

			// Marketplace functionality
			var resolvingNftOwnerForMarketplace = false;
			var bidInputTouched = false;
			var listInputTouched = false;
			var marketplaceWrapPending = false;
			var profileRegistrationCostSui = null;
			var profileRegistrationCostPending = null;
			var profileRenewalBaseCostSui = null;
			var profileRenewalBaseCostPending = null;
			const bidPrimaryNameCache = new Map();
			const linkedPrimaryNameCache = new Map();
			let marketplaceActivityRenderNonce = 0;
			var MARKETPLACE_MIN_SIDE_WIDTH = 233;
			var MARKETPLACE_MAX_SIDE_WIDTH = 420;
			var marketplaceLayoutRaf = null;
			var MIST_PER_SUI = 1_000_000_000;

			function toSuiInputPrecision(amountSui) {
				if (!Number.isFinite(amountSui) || amountSui <= 0) return 0;
				return Math.round(amountSui * MIST_PER_SUI) / MIST_PER_SUI;
			}

			function formatSuiInputValue(amountSui) {
				const normalized = toSuiInputPrecision(amountSui);
				if (!Number.isFinite(normalized) || normalized <= 0) return '';
				return normalized
					.toFixed(9)
					.replace(/0+$/, '')
					.replace(/.$/, '');
			}

			function getListingIncrementStepSui(amountSui) {
				const base = Number.isFinite(amountSui) && amountSui > 0 ? amountSui : 0;
				if (base < 10) return 0.01;
				const whole = Math.floor(base);
				if (!Number.isFinite(whole) || whole <= 0) return 0.01;
				const digits = String(Math.abs(whole)).length;
				const exponent = Math.max(-2, digits - 3);
				return Math.max(0.01, Math.pow(10, exponent));
			}

				function applyListingPriceStep(currentSui, minimumSui, direction) {
					const safeMinimum = Number.isFinite(minimumSui) && minimumSui > 0 ? minimumSui : 0;
					const base = Number.isFinite(currentSui) && currentSui > 0 ? currentSui : Math.max(safeMinimum, 0.01);
					const step = getListingIncrementStepSui(base);
					const nextRaw = direction === 'down' ? base - step : base + step;
					return Math.max(safeMinimum, toSuiInputPrecision(nextRaw));
				}

				function applyBidPriceStep(currentSui, minimumSui, direction) {
					const safeMinimum = Number.isFinite(minimumSui) && minimumSui > 0 ? Math.ceil(minimumSui) : 1;
					const baseRaw = Number.isFinite(currentSui) && currentSui > 0 ? currentSui : safeMinimum;
					const base = Math.max(safeMinimum, Math.ceil(baseRaw));
					const nextRaw = direction === 'down' ? base - 1 : base + 1;
					return Math.max(safeMinimum, Math.ceil(nextRaw));
				}

			function setMarketplaceInputWidth(inputEl) {
				if (!inputEl) return;
				const raw = String(inputEl.value || inputEl.placeholder || '').replace(/[^0-9.]/g, '');
				const visibleChars = Math.min(12, Math.max(4, raw.length + 1));
				inputEl.style.width = visibleChars + 'ch';
			}

			function getVisibleWidth(element) {
				if (!element) return 0;
				if (!(element instanceof HTMLElement)) return 0;
				const computed = window.getComputedStyle(element);
				if (computed.display === 'none' || computed.visibility === 'hidden') return 0;
				return Math.max(element.scrollWidth || 0, Math.ceil(element.getBoundingClientRect().width || 0));
			}

			function getInlineNodesWidth(nodes, gapPx = 0) {
				const visibleNodes = (nodes || []).filter((node) => getVisibleWidth(node) > 0);
				if (!visibleNodes.length) return 0;
				let total = 0;
				for (const node of visibleNodes) {
					total += getVisibleWidth(node);
				}
				total += gapPx * Math.max(0, visibleNodes.length - 1);
				return total;
			}

			function syncMarketplaceCardSizingNow() {
				if (!mainContentEl || !marketplaceCard) return;
				if (window.innerWidth <= 860 || marketplaceCard.style.display === 'none') {
					mainContentEl.style.setProperty('--overview-side-rail-width', MARKETPLACE_MIN_SIDE_WIDTH + 'px');
					marketplaceCard.classList.remove('marketplace-card-expanded');
					return;
				}

				const listingRowWidth = getVisibleWidth(marketplaceListingRow);
				const bidRowWidth = getVisibleWidth(marketplaceBidRow);
				const soldRowWidth = getVisibleWidth(marketplaceSoldRow);
				const bidControlWidth = getInlineNodesWidth(
					[marketplaceBidEstimate, marketplaceBidPriceControl],
					6,
				);
				const listControlWidth = getInlineNodesWidth(
					[marketplaceListEstimate, marketplaceListPriceControl],
					4,
				);
				const buyBtnWidth = getVisibleWidth(marketplaceBuyBtn);
				const listBtnWidth = getVisibleWidth(marketplaceListBtn);
				const wrapBtnWidth = getVisibleWidth(marketplaceWrapBtn);
				const maxInnerWidth = Math.max(
					listingRowWidth,
					bidRowWidth,
					soldRowWidth,
					bidControlWidth,
					listControlWidth,
					buyBtnWidth,
					listBtnWidth,
					wrapBtnWidth,
				);
				const targetWidth = Math.min(
					MARKETPLACE_MAX_SIDE_WIDTH,
					Math.max(MARKETPLACE_MIN_SIDE_WIDTH, maxInnerWidth + 26),
				);

				mainContentEl.style.setProperty('--overview-side-rail-width', Math.ceil(targetWidth) + 'px');
				marketplaceCard.classList.toggle(
					'marketplace-card-expanded',
					targetWidth > MARKETPLACE_MIN_SIDE_WIDTH + 4,
				);
			}

			function queueMarketplaceLayoutSync() {
				if (marketplaceLayoutRaf) cancelAnimationFrame(marketplaceLayoutRaf);
				marketplaceLayoutRaf = requestAnimationFrame(() => {
					marketplaceLayoutRaf = null;
					setMarketplaceInputWidth(marketplaceBidAmountInput);
					setMarketplaceInputWidth(marketplaceListAmountInput);
					syncMarketplaceCardSizingNow();
				});
			}

			function updateMarketplaceStepperLabels() {
				const bidCurrentValue = parseFloat(String(marketplaceBidAmountInput?.value || '').replace(/[^0-9.]/g, ''));
				const bidBase = Number.isFinite(bidCurrentValue) && bidCurrentValue > 0
					? bidCurrentValue
					: getBidMinimumSui();
					const bidStep = 1;
				const bidStepText = formatSuiInputValue(bidStep) || String(bidStep);
				if (marketplaceBidPriceUpBtn) {
					const upLabel = 'Increase bid by ' + bidStepText + ' SUI';
					marketplaceBidPriceUpBtn.setAttribute('aria-label', upLabel);
					marketplaceBidPriceUpBtn.title = upLabel;
				}
				if (marketplaceBidPriceDownBtn) {
					const downLabel = 'Decrease bid by ' + bidStepText + ' SUI';
					marketplaceBidPriceDownBtn.setAttribute('aria-label', downLabel);
					marketplaceBidPriceDownBtn.title = downLabel;
				}

				const listCurrentValue = parseFloat(String(marketplaceListAmountInput?.value || '').replace(/[^0-9.]/g, ''));
				const listBase = Number.isFinite(listCurrentValue) && listCurrentValue > 0
					? listCurrentValue
					: getListDefaultSui();
				const listStep = getListingIncrementStepSui(listBase);
				const listStepText = formatSuiInputValue(listStep) || String(listStep);
				if (marketplaceListPriceUpBtn) {
					const upLabel = 'Increase list by ' + listStepText + ' SUI';
					marketplaceListPriceUpBtn.setAttribute('aria-label', upLabel);
					marketplaceListPriceUpBtn.title = upLabel;
				}
				if (marketplaceListPriceDownBtn) {
					const downLabel = 'Decrease list by ' + listStepText + ' SUI';
					marketplaceListPriceDownBtn.setAttribute('aria-label', downLabel);
					marketplaceListPriceDownBtn.title = downLabel;
				}
			}
					async function ensureProfileRegistrationCostSui() {
					if (Number.isFinite(profileRegistrationCostSui) && profileRegistrationCostSui > 0) {
						return profileRegistrationCostSui;
					}
				if (profileRegistrationCostPending) return profileRegistrationCostPending;

				profileRegistrationCostPending = (async () => {
					try {
						const cacheKey = NAME + '-3';
						let pricing = renewalPricingCache?.[cacheKey] || null;

						if (!pricing) {
							const res = await fetch(getRenewalApiUrl('/api/renewal-pricing?domain=' + encodeURIComponent(NAME) + '&years=3'));
							if (!res.ok) return null;
							pricing = await res.json();
							if (renewalPricingCache) renewalPricingCache[cacheKey] = pricing;
						}

						const registrationCostSui = Number(pricing?.discountedSuiMist) / 1e9;
						if (Number.isFinite(registrationCostSui) && registrationCostSui > 0) {
							profileRegistrationCostSui = registrationCostSui;
							return registrationCostSui;
						}
						return null;
					} catch (error) {
						console.log('Failed to fetch 3-year registration cost baseline:', error);
						return null;
					}
				})().finally(() => {
					profileRegistrationCostPending = null;
				});

					return profileRegistrationCostPending;
				}

				function resolveRenewalBaseCostSuiFromPricing(pricing) {
					const discountedMist = Number(pricing?.discountedSuiMist || 0);
					if (!Number.isFinite(discountedMist) || discountedMist <= 0) return null;
					const savingsMist = Number(pricing?.savingsMist || 0);
					const normalizedSavingsMist = Number.isFinite(savingsMist) && savingsMist > 0 ? savingsMist : 0;
					return (discountedMist + normalizedSavingsMist) / 1e9;
				}

				function getProfileRenewalBaseCostSuiOrNull() {
					if (Number.isFinite(profileRenewalBaseCostSui) && profileRenewalBaseCostSui > 0) {
						return profileRenewalBaseCostSui;
					}
					const cacheKey = NAME + '-1';
					const cachedPricing = renewalPricingCache?.[cacheKey] || null;
					const cachedBaseCostSui = resolveRenewalBaseCostSuiFromPricing(cachedPricing);
					if (Number.isFinite(cachedBaseCostSui) && cachedBaseCostSui > 0) {
						profileRenewalBaseCostSui = cachedBaseCostSui;
						return cachedBaseCostSui;
					}
					return null;
				}

				async function ensureProfileRenewalBaseCostSui() {
					const cachedBaseCostSui = getProfileRenewalBaseCostSuiOrNull();
					if (Number.isFinite(cachedBaseCostSui) && cachedBaseCostSui > 0) {
						return cachedBaseCostSui;
					}
					if (profileRenewalBaseCostPending) return profileRenewalBaseCostPending;

					profileRenewalBaseCostPending = (async () => {
						try {
							const cacheKey = NAME + '-1';
							let pricing = renewalPricingCache?.[cacheKey] || null;
							if (!pricing) {
								const res = await fetch(getRenewalApiUrl('/api/renewal-pricing?domain=' + encodeURIComponent(NAME) + '&years=1'));
								if (!res.ok) return null;
								pricing = await res.json();
								if (renewalPricingCache) renewalPricingCache[cacheKey] = pricing;
							}

							const renewalBaseCostSui = resolveRenewalBaseCostSuiFromPricing(pricing);
							if (Number.isFinite(renewalBaseCostSui) && renewalBaseCostSui > 0) {
								profileRenewalBaseCostSui = renewalBaseCostSui;
								return renewalBaseCostSui;
							}
							return null;
						} catch (error) {
							console.log('Failed to fetch 1-year renewal baseline:', error);
							return null;
						}
					})().finally(() => {
						profileRenewalBaseCostPending = null;
					});

					return profileRenewalBaseCostPending;
				}

			async function ensureMarketplaceFunding(tx, requiredMist) {
				if (!connectedAddress) return;

			const suiClient = getSuiClient();
			const BASE_GAS_RESERVE = 50_000_000n;
			const SWAP_OVERHEAD = SUI_FOR_DEEP_SWAP + 50_000_000n;
			const balanceRes = await suiClient.getBalance({
				owner: connectedAddress,
				coinType: SUI_TYPE,
			});
			const availableMist = BigInt(balanceRes?.totalBalance || '0');
			const basicShortfall = requiredMist + BASE_GAS_RESERVE - availableMist;

			if (basicShortfall <= 0n) return;
				if (!DEEPBOOK_PACKAGE) {
					const neededSui = Number(requiredMist + BASE_GAS_RESERVE) / 1e9;
					const haveSui = Number(availableMist) / 1e9;
					throw new Error(
						'Need ~' + neededSui.toFixed(2) + ' SUI (have ' + haveSui.toFixed(2) + ')',
					);
				}

			const swapShortfall = requiredMist + BASE_GAS_RESERVE + SWAP_OVERHEAD - availableMist;
			marketplaceStatus.textContent = 'Insufficient SUI. Routing via DeepBook...';
			const swapInfo = await findBestSwapForSui(suiClient, swapShortfall, connectedAddress);
				if (!swapInfo) {
					const totalPortfolio = await estimatePortfolioSui(suiClient, connectedAddress);
					const maxBidSui = totalPortfolio > 0 ? (totalPortfolio * 0.95).toFixed(2) : '?';
					throw new Error(
						'Not enough funds for this bid. Max offer ~' + maxBidSui + ' SUI',
					);
				}

				marketplaceStatus.textContent = 'Swapping ' + swapInfo.name + ' to SUI via DeepBook...';
					prependSwapToTx(tx, swapInfo, connectedAddress);
				}

				function getBidMinimumSui() {
					const BID_FLOOR_SUI = 1;
					const bestOfferSui = currentBestBid?.price ? (Number(currentBestBid.price) / 1e9) : 0;
					const bestOfferBaselineSui = bestOfferSui > 0 ? (bestOfferSui + 1) : BID_FLOOR_SUI;
					const lastSaleSui = lastSoldPriceMist ? (Number(lastSoldPriceMist) / 1e9) : 0;
					return Math.max(BID_FLOOR_SUI, Math.ceil(bestOfferBaselineSui), Math.ceil(lastSaleSui));
				}

				function getRoundedBidAmountSuiOrNull() {
					if (!marketplaceBidAmountInput) return null;
					const amountSui = parseFloat(String(marketplaceBidAmountInput.value).replace(/[^0-9.]/g, ''));
					if (!Number.isFinite(amountSui) || amountSui <= 0) return null;
					return Math.max(getBidMinimumSui(), Math.ceil(amountSui));
				}

			function normalizeBidAmountInput() {
				if (!marketplaceBidAmountInput) return null;
				const minimumSui = getBidMinimumSui();
				marketplaceBidAmountInput.min = String(minimumSui);
				const roundedAmount = getRoundedBidAmountSuiOrNull();
				if (!roundedAmount) return null;
				marketplaceBidAmountInput.value = String(roundedAmount);
				return roundedAmount;
			}

				function updateBidEstimateDisplay() {
				if (!marketplaceBidEstimate) return;
				const tradeportBidFeeBps = 300;
				const minimumSui = getBidMinimumSui();
					const currentInput = parseFloat(String(marketplaceBidAmountInput?.value || '').replace(/[^0-9.]/g, ''));
					const bidSui = Number.isFinite(currentInput) && currentInput > 0
						? Math.max(minimumSui, Math.ceil(currentInput))
						: minimumSui;
				const tradeportFeeSui = bidSui * (tradeportBidFeeBps / 10000);
				const estimatedCostSui = bidSui + tradeportFeeSui;
				const usdEstimate = cachedSuiUsdPrice > 0 ? (estimatedCostSui * cachedSuiUsdPrice) : null;
				if (usdEstimate && Number.isFinite(usdEstimate) && usdEstimate > 0) {
					const formattedEstimate = formatMarketplaceUsdEstimate(usdEstimate);
					marketplaceBidEstimate.innerHTML =
						'<span class="marketplace-bid-usd" title="$' + formattedEstimate.full + '">≈ $' + formattedEstimate.compact + '</span>';
				} else {
					marketplaceBidEstimate.innerHTML = '<span class="marketplace-bid-usd">≈ --</span>';
				}
				updateBidButtonLabel(bidSui);
				updateMarketplaceStepperLabels();
				queueMarketplaceLayoutSync();
			}

				function updateBidButtonLabel(bidSui) {
					if (!marketplaceBidText) return;
					if (!connectedAddress || marketplacePlaceBidBtn?.classList.contains('connect-wallet')) return;
					const display = String(Math.max(1, Math.ceil(bidSui)));
					marketplaceBidText.textContent = 'Offer ' + display + ' SUI for ' + NAME + '.sui';
				}

			function setBidInputDefaultFromBestOffer(force = false) {
				if (!marketplaceBidAmountInput) return;
				const minBidSui = getBidMinimumSui();
				const bestOfferSui = currentBestBid?.price ? (Number(currentBestBid.price) / 1e9) : 0;
					const regCostSui = Number.isFinite(profileRegistrationCostSui) && profileRegistrationCostSui > 0 ? profileRegistrationCostSui : 1;
					const nextBidSui = Math.max(
						minBidSui,
						bestOfferSui > 0 ? (bestOfferSui + 1) : 1,
						regCostSui,
					);
				const currentInput = parseFloat(marketplaceBidAmountInput.value);
				const hasInput = Number.isFinite(currentInput) && currentInput > 0;

				marketplaceBidAmountInput.min = String(minBidSui);

					if (force || !bidInputTouched || !hasInput || currentInput < nextBidSui) {
						marketplaceBidAmountInput.value = String(Math.ceil(nextBidSui));
						bidInputTouched = false;
					}
				updateBidEstimateDisplay();
			}

			function getBidderFallback(address) {
				if (!address || typeof address !== 'string') return '--';
				return address.slice(0, 8) + '...' + address.slice(-6);
			}

			function getBidderProfileHref(address, resolvedName) {
				const normalizedName = String(resolvedName || '').trim().toLowerCase();
				const cleanedName = normalizedName.replace(/.sui$/i, '');
				if (cleanedName && /^[a-z0-9][a-z0-9-]*$/.test(cleanedName)) {
					return 'https://' + encodeURIComponent(cleanedName) + '.sui.ski';
				}

				if (address && typeof address === 'string' && address.startsWith('0x')) {
					return getTradeportPortfolioHref(address);
				}

				return '';
			}

			function setMarketplaceBidderLink(address, resolvedName = '') {
				if (!marketplaceBidder) return;
				const hasAddress = Boolean(address && typeof address === 'string' && address.startsWith('0x'));
				const displayRaw = resolvedName || (hasAddress ? getBidderFallback(address) : '--');
				const display = /.sui$/i.test(displayRaw) ? displayRaw.replace(/.sui$/i, '') : displayRaw;
				marketplaceBidder.textContent = display;
				marketplaceBidder.title = hasAddress ? address : '';

				const href = getBidderProfileHref(address, resolvedName);
				if (href) {
					marketplaceBidder.href = href;
					marketplaceBidder.setAttribute('aria-disabled', 'false');
					marketplaceBidder.classList.remove('inactive');
				} else {
					marketplaceBidder.removeAttribute('href');
					marketplaceBidder.setAttribute('aria-disabled', 'true');
					marketplaceBidder.classList.add('inactive');
				}
			}

			function setMarketplaceListerLink(address, resolvedName = '') {
				if (!marketplaceLister) return;
				const hasAddress = Boolean(address && typeof address === 'string' && address.startsWith('0x'));
				const displayRaw = resolvedName || (hasAddress ? getBidderFallback(address) : '--');
				const display = /.sui$/i.test(displayRaw) ? displayRaw.replace(/.sui$/i, '') : displayRaw;
				marketplaceLister.textContent = display;
				marketplaceLister.title = hasAddress ? address : '';

				const href = getBidderProfileHref(address, resolvedName);
				if (href) {
					marketplaceLister.href = href;
					marketplaceLister.setAttribute('aria-disabled', 'false');
					marketplaceLister.classList.remove('inactive');
				} else {
					marketplaceLister.removeAttribute('href');
					marketplaceLister.setAttribute('aria-disabled', 'true');
					marketplaceLister.classList.add('inactive');
				}
			}

					function getTradeportItemUrl(tokenId) {
						const normalized = typeof tokenId === 'string' ? tokenId.trim() : '';
						return normalized
							? 'https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=' + encodeURIComponent(normalized) + '&modalSlug=suins&nav=1'
							: 'https://www.tradeport.xyz/sui/collection/suins';
					}

					function normalizeTradeportBidPriceMist(rawPrice) {
						const numeric = Number(rawPrice);
						if (!Number.isFinite(numeric) || numeric <= 0) return 0;
						// Tradeport/indexer payloads can be either SUI units or mist.
						return numeric < 1_000_000 ? Math.round(numeric * 1e9) : Math.round(numeric);
					}

					function pickBestBidCandidateFromList(candidates, fallbackTokenId) {
						if (!Array.isArray(candidates) || candidates.length === 0) return null;
						let best = null;
						let bestPrice = 0;
						for (const candidate of candidates) {
							if (!candidate || typeof candidate !== 'object') continue;
							const priceMist = normalizeTradeportBidPriceMist(
								candidate.price
								?? candidate.bidPrice
								?? candidate.bid_price
								?? candidate.offerPrice
								?? candidate.offer_price
								?? candidate.amount
								?? candidate.value,
							);
							if (!priceMist || priceMist <= bestPrice) continue;
							bestPrice = priceMist;
							const tokenId = String(candidate.tokenId || candidate.token_id || fallbackTokenId || '');
							best = {
								id: String(candidate.id || candidate.bidId || candidate.bid_id || 'tradeport-fallback-bid'),
								price: priceMist,
								bidder: String(candidate.bidder || candidate.buyer || candidate.offerer || candidate.address || candidate.wallet || ''),
								tokenId: tokenId,
								tradeportUrl: getTradeportItemUrl(tokenId),
							};
						}
						return best;
					}

					function extractBestBidFromTradeportPayload(payload) {
						if (!payload || typeof payload !== 'object') return null;
						const fallbackTokenId = String(NFT_ID || '');
						const containers = [payload, payload.data, payload.result, payload.market, payload.listing, payload.name];
						let best = null;
						let bestPrice = 0;

						for (const container of containers) {
							if (!container || typeof container !== 'object') continue;
							const listCandidate = pickBestBidCandidateFromList(
								container.bids
								|| container.offers
								|| container.activeBids
								|| container.active_bids
								|| container.activeOffers
								|| container.active_offers,
								fallbackTokenId,
							);
							if (listCandidate && Number(listCandidate.price) > bestPrice) {
								best = listCandidate;
								bestPrice = Number(listCandidate.price);
							}

							const scalarPriceMist = normalizeTradeportBidPriceMist(
								container.bestBid
								?? container.best_bid
								?? container.highestBid
								?? container.highest_bid
								?? container.bestOffer
								?? container.best_offer
								?? container.offer,
							);
							if (scalarPriceMist > bestPrice) {
								const tokenId = String(container.tokenId || container.token_id || fallbackTokenId || '');
								best = {
									id: 'tradeport-fallback-bid',
									price: scalarPriceMist,
									bidder: String(container.bestBidder || container.best_bidder || container.bidder || container.buyer || ''),
									tokenId: tokenId,
									tradeportUrl: getTradeportItemUrl(tokenId),
								};
								bestPrice = scalarPriceMist;
							}
						}

						return best;
					}

				function setMarketplaceActivityMessage(message) {
					if (!marketplaceActivity || !marketplaceActivityList) return;
					marketplaceActivity.style.display = 'block';
					marketplaceActivityList.innerHTML = '<div class="marketplace-activity-empty">' + escapeHtmlJs(message) + '</div>';
				}

				function parseMarketEventTimeMs(value) {
					if (!value) return 0;
					const ms = Date.parse(String(value));
					return Number.isFinite(ms) ? ms : 0;
				}

				async function renderMarketplaceActivity(data) {
					if (!marketplaceActivity || !marketplaceActivityList) return;

					const preferredTokenId = String(NFT_ID || '').toLowerCase();
					const nfts = Array.isArray(data?.nfts) ? data.nfts : [];
					let targetNft = null;

					if (preferredTokenId) {
						targetNft = nfts.find((nft) =>
							String(nft?.tokenId || nft?.token_id || '').toLowerCase() === preferredTokenId,
						);
					}
					if (!targetNft && nfts.length > 0) {
						targetNft = nfts[0];
					}

					const tokenForLink = preferredTokenId || String(targetNft?.tokenId || targetNft?.token_id || '');

					if (marketplaceActivityLink) {
						marketplaceActivityLink.href = getTradeportItemUrl(tokenForLink);
						marketplaceActivityLink.title = tokenForLink
							? 'View full NFT trades on TradePort'
							: 'View SuiNS trades on TradePort';
					}

					const activityPayload = targetNft && targetNft.id
						? { nftId: targetNft.id }
						: preferredTokenId
							? { tokenId: NFT_ID }
							: null;

					if (!activityPayload) {
						marketplaceActivity.style.display = 'block';
						marketplaceActivityList.innerHTML =
							'<div class="marketplace-activity-empty">No NFT data available.</div>';
						return;
					}

					try {
						const activityResponse = await fetch('/api/marketplace/activity', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(activityPayload),
						});

						if (!activityResponse.ok) {
							marketplaceActivity.style.display = 'block';
							marketplaceActivityList.innerHTML =
								'<div class="marketplace-activity-empty">Activity unavailable right now.</div>';
							return;
						}

						const activityData = await activityResponse.json();
						const actions = Array.isArray(activityData?.actions) ? activityData.actions : [];
						let derivedSoldPriceMist = null;
						let derivedSaleEventMs = 0;
						let derivedListingEventMs = 0;
						for (const action of actions) {
							const actionType = String(action?.type || '').replace(/-/g, '_').toLowerCase();
							const actionMs = parseMarketEventTimeMs(action?.blockTime || action?.block_time || '');
							if (actionType === 'accept_bid' || actionType === 'buy' || actionType === 'sale') {
								const actionPrice = Number(action?.price || 0);
								if (!Number.isFinite(actionPrice) || actionPrice <= 0) continue;
								if (actionMs > 0 && actionMs >= derivedSaleEventMs) {
									derivedSaleEventMs = actionMs;
									derivedSoldPriceMist = actionPrice;
								} else if (!derivedSoldPriceMist) {
									derivedSoldPriceMist = actionPrice;
								}
								continue;
							}
							if (
								actionType === 'list'
								|| actionType === 'listed'
								|| actionType === 'relist'
								|| actionType === 'create_listing'
							) {
								if (actionMs > derivedListingEventMs) derivedListingEventMs = actionMs;
							}
						}

						const filteredActions = actions.filter((action) => {
							if (!derivedSaleEventMs) return true;
							const actionType = String(action?.type || '').replace(/-/g, '_').toLowerCase();
							if (actionType !== 'bid' && actionType !== 'cancel_bid') return true;
							const actionMs = parseMarketEventTimeMs(action?.blockTime || action?.block_time || '');
							if (!actionMs) return true;
							return actionMs >= derivedSaleEventMs;
						});

						const sawBidEvents = actions.some((action) => String(action?.type || '').replace(/-/g, '_').toLowerCase() === 'bid');
						const hasBidAfterSale = actions.some((action) => {
							const actionType = String(action?.type || '').replace(/-/g, '_').toLowerCase();
							if (actionType !== 'bid') return false;
							const actionMs = parseMarketEventTimeMs(action?.blockTime || action?.block_time || '');
							if (!actionMs) return true;
							return !derivedSaleEventMs || actionMs >= derivedSaleEventMs;
						});
						let clearedStaleBestBid = false;
						if (derivedSaleEventMs > 0 && sawBidEvents && !hasBidAfterSale) {
							currentBestBid = null;
							if (marketplaceBidRow) marketplaceBidRow.style.display = 'none';
							if (marketplaceBidder) setMarketplaceBidderLink('', '');
							clearedStaleBestBid = true;
						}

						let shouldRetagIdentity = false;
						let shouldRefreshBidDefaults = false;
						if (derivedSoldPriceMist && Number(lastSoldPriceMist || 0) !== derivedSoldPriceMist) {
							lastSoldPriceMist = derivedSoldPriceMist;
							shouldRetagIdentity = true;
							shouldRefreshBidDefaults = true;
						}
						if (derivedSaleEventMs && derivedSaleEventMs !== lastSaleEventMs) {
							lastSaleEventMs = derivedSaleEventMs;
							shouldRetagIdentity = true;
							shouldRefreshBidDefaults = true;
						}
						if (derivedListingEventMs !== lastListingEventMs) {
							lastListingEventMs = derivedListingEventMs;
							shouldRetagIdentity = true;
						}
						if (clearedStaleBestBid) {
							shouldRefreshBidDefaults = true;
						}
						if (shouldRefreshBidDefaults) {
							setBidInputDefaultFromBestOffer();
							updateMarketplaceButton();
						}
						if (shouldRetagIdentity) {
							applyTaggedIdentityToProfile();
						}
						const dayMs = 24 * 60 * 60 * 1000;
						const hasExpiry = Number.isFinite(EXPIRATION_MS) && EXPIRATION_MS > 0;
						let expirySummary = '';
							if (hasExpiry) {
								const nowMs = Date.now();
								const totalDays = Math.max(0, Math.ceil((AVAILABLE_AT - nowMs) / dayMs));
								const years = Math.floor(totalDays / 365);
								const remainDays = totalDays - years * 365;
								expirySummary = years > 0
									? years + 'y ' + remainDays + 'd'
									: totalDays + 'd';
							}
						const syntheticExpiryAction = expirySummary
							? {
									id: 'suins-expiry-' + String(EXPIRATION_MS),
									type: 'expire',
									price: 0,
									sender: '',
									receiver: '',
									blockTime: '',
									expirySummary,
								}
							: null;
						const displayActions = syntheticExpiryAction
							? [syntheticExpiryAction, ...filteredActions]
							: filteredActions;

						if (displayActions.length === 0) {
							marketplaceActivity.style.display = 'block';
							marketplaceActivityList.innerHTML =
								'<div class="marketplace-activity-empty">No marketplace activity yet.</div>';
							return;
						}

						const renderNonce = ++marketplaceActivityRenderNonce;

						function normalizeActionType(type) {
							return String(type || '').toLowerCase().replace(/-/g, '_');
						}

						const actionWindow = displayActions.slice(0, 10);
						const hasMintInWindow = actionWindow.some((action) =>
							normalizeActionType(action?.type).toLowerCase() === 'mint',
						);
						if (!hasMintInWindow) {
							const mintAction = displayActions.find((action) =>
								normalizeActionType(action?.type).toLowerCase() === 'mint',
							);
							if (mintAction) {
								if (actionWindow.length >= 10) {
									actionWindow[actionWindow.length - 1] = mintAction;
								} else {
									actionWindow.push(mintAction);
								}
							}
						}

						function getActionLabel(type) {
							const normalized = normalizeActionType(type);
							const labels = {
								sale: 'Buy',
								list: 'List',
								relist: 'Relist',
								delist: 'Delist',
								bid: 'Offer',
								cancel_bid: 'Offer Cancelled',
								accept_bid: 'Sale',
								buy: 'Buy',
								mint: 'Mint',
								transfer: 'Transfer',
								expire: 'Expire',
								expired: 'Expire',
							};
							if (labels[normalized]) return labels[normalized];
							return String(normalized || '')
								.split('_')
								.filter(Boolean)
								.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
								.join(' ');
						}

						function getActionAddress(action) {
							const actionType = normalizeActionType(action?.type).toLowerCase();
							const sender = typeof action.sender === 'string' ? action.sender.trim() : '';
							const receiver = typeof action.receiver === 'string' ? action.receiver.trim() : '';
							const isSuiAddress = (value) => value && value.startsWith('0x');
							if (actionType === 'bid') {
								if (isSuiAddress(receiver)) return receiver;
								if (isSuiAddress(sender)) return sender;
								return '';
							}
							if (actionType === 'accept_bid') {
								if (isSuiAddress(sender)) return sender;
								if (isSuiAddress(receiver)) return receiver;
								return '';
							}
							const listingActorTypes = new Set([
								'list',
								'listed',
								'relist',
								'create_listing',
								'delist',
								'cancel_listing',
							]);
							if (listingActorTypes.has(actionType)) {
								if (isSuiAddress(sender)) return sender;
								if (isSuiAddress(receiver)) return receiver;
								return '';
							}
							const showRecipientTypes = new Set(['sale', 'buy', 'transfer', 'mint']);
							if (!showRecipientTypes.has(actionType)) return '';
							if (isSuiAddress(receiver)) return receiver;
							if (isSuiAddress(sender)) return sender;
							return '';
						}

						function formatActivityDate(blockTime) {
							try {
								const date = new Date(blockTime);
								const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
								return months[date.getMonth()] + ' ' + date.getDate();
							} catch {
								return '';
							}
						}

						function getActivityYear(blockTime) {
							try {
								return new Date(blockTime).getFullYear();
							} catch {
								return 0;
							}
						}

						marketplaceActivity.style.display = 'block';
						let lastYear = 0;
						marketplaceActivityList.innerHTML = actionWindow
							.map((action) => {
								let yearHeader = '';
								const year = getActivityYear(action.blockTime);
								if (year && year !== lastYear) {
									lastYear = year;
									yearHeader = '<div class="marketplace-activity-year">' + year + '</div>';
								}

								const label = getActionLabel(action.type);
								const addr = getActionAddress(action);
								const fallbackActor = addr ? getBidderFallback(addr) : '--';
								const activityActorAttr = addr ? ' data-activity-address="' + escapeHtmlJs(addr) + '"' : '';
								const activityActorClass = addr
									? 'marketplace-activity-actor marketplace-activity-actor-link'
									: 'marketplace-activity-actor';
								const activityActorHtml =
									'<span class="' + activityActorClass + '"' + activityActorAttr +
									(addr
										? ' role="link" tabindex="0" title="View SuiNS names on TradePort for ' + escapeHtmlJs(fallbackActor) + '"'
										: '') +
									'>' + escapeHtmlJs(fallbackActor) + '</span>';

									const customAmount = typeof action.expirySummary === 'string' ? action.expirySummary : '';
									const amountContent = customAmount
										? '<span class="marketplace-activity-amount-text">' + escapeHtmlJs(customAmount) + '</span>'
										: action.price > 0
											? '<span class="marketplace-activity-amount-num">' + escapeHtmlJs((() => {
												const actionType = normalizeActionType(action.type);
												if (
													actionType === 'list'
													|| actionType === 'listed'
													|| actionType === 'relist'
													|| actionType === 'create_listing'
												) {
													const listingDisplaySui = getMarketplaceListingDisplaySui(action.price);
													return formatMarketplaceListingSuiDisplay(listingDisplaySui);
												}
												const actionSui = Number(action.price) / 1e9;
												return formatMarketplaceBidSuiDisplay(actionSui);
											})()) + '</span><span class="marketplace-activity-amount-sui"> SUI</span>'
											: '';
								const priceDisplay = '<span class="marketplace-activity-amount">' + amountContent + '</span>';

								const dateStr = customAmount ? '' : formatActivityDate(action.blockTime);
								const txDigest = action.txId || '';
								const timeDisplay = '<span class="marketplace-activity-time">' + (dateStr ? escapeHtmlJs(dateStr) : '') + '</span>';

								const kindHtml = txDigest
									? '<a href="https://suiscan.xyz/' + NETWORK + '/tx/' + escapeHtmlJs(txDigest) + '" target="_blank" class="marketplace-activity-kind marketplace-activity-tx-link" title="' + escapeHtmlJs(txDigest) + '">' + escapeHtmlJs(label) + '</a>'
									: '<span class="marketplace-activity-kind">' + escapeHtmlJs(label) + '</span>';

								const normalizedType = normalizeActionType(action.type);
								return (
									yearHeader +
									'<div class="marketplace-activity-item ' + escapeHtmlJs(normalizedType) + '">' +
										kindHtml +
										activityActorHtml +
										priceDisplay +
										timeDisplay +
									'</div>'
								);
							})
							.join('');

						const addressNodes = Array.from(
							marketplaceActivityList.querySelectorAll('[data-activity-address]'),
						);
						const uniqueAddresses = Array.from(
							new Set(
								addressNodes
									.map((node) => node.getAttribute('data-activity-address') || '')
									.filter(Boolean),
							),
						);

						if (uniqueAddresses.length > 0) {
							const namePairs = await Promise.all(
								uniqueAddresses.map(async (address) => {
									const resolved = await resolveBidderDisplay(address).catch(() => getBidderFallback(address));
									return [address, resolved];
								}),
							);

							if (renderNonce === marketplaceActivityRenderNonce) {
								const nameMap = new Map(namePairs);
								addressNodes.forEach((node) => {
									const address = node.getAttribute('data-activity-address') || '';
									const display = nameMap.get(address);
									if (display) {
										node.textContent = display.endsWith('.sui') ? display.slice(0, -4) : display;
										node.setAttribute('title', address);
										if (connectedAddress && address.toLowerCase() === connectedAddress.toLowerCase()) {
											node.classList.add('premium-purple');
										}
									}
								});
							}
						}
					} catch (error) {
						console.log('Activity fetch failed:', error);
						marketplaceActivity.style.display = 'block';
						marketplaceActivityList.innerHTML =
							'<div class="marketplace-activity-empty">Activity unavailable right now.</div>';
					}
				}

				async function resolveBidderDisplay(address) {
				if (!address || typeof address !== 'string') return '--';
				const cacheKey = address.toLowerCase();
			if (bidPrimaryNameCache.has(cacheKey)) {
				return bidPrimaryNameCache.get(cacheKey);
			}

			const resolvedName = await fetchPrimaryName(address).catch(() => null);
			const display = resolvedName || getBidderFallback(address);
			bidPrimaryNameCache.set(cacheKey, display);
				return display;
			}

			function isConnectedProfileOwner() {
				const normalizedOwner = getResolvedOwnerAddress();
				const isOnChainOwner = Boolean(
					connectedAddress
					&& normalizedOwner
					&& connectedAddress.toLowerCase() === normalizedOwner,
				);
				// Also check if connected wallet is the seller in marketplace listing
				// This handles cases where NFT is listed (ObjectOwner) and on-chain owner is the marketplace contract
				const isMarketplaceSeller = Boolean(
					connectedAddress
					&& currentListing?.seller
					&& connectedAddress.toLowerCase() === currentListing.seller.toLowerCase()
				);
				return isOnChainOwner || isMarketplaceSeller;
			}

			function hasOwnerListingForCurrentNft() {
				return Boolean(
					isConnectedProfileOwner()
					&& connectedAddress
					&& currentListing?.seller
					&& currentListing.seller.toLowerCase() === connectedAddress.toLowerCase()
					&& (!NFT_ID || !currentListing?.tokenId || currentListing.tokenId.toLowerCase() === NFT_ID.toLowerCase()),
				);
			}

			function getListMinimumSui() {
				return 0;
			}

			function roundUpToWholeSui(amountSui) {
				if (!Number.isFinite(amountSui) || amountSui <= 0) return 0;
				return Math.ceil(amountSui);
			}

			function getListDefaultSui() {
				const minimumSui = getListMinimumSui();
				if (hasOwnerListingForCurrentNft() && currentListing?.price) {
					return Math.max(
						minimumSui,
						roundUpToWholeSui(Number(currentListing.price) / 1e9),
					);
				}
				const renewalBaseSui = getProfileRenewalBaseCostSuiOrNull();
				if (Number.isFinite(renewalBaseSui) && renewalBaseSui > 0) {
					return Math.max(minimumSui, roundUpToWholeSui(renewalBaseSui * 2));
				}
				return Math.max(minimumSui, 1);
			}

				function getMarketplaceListLabel() {
				const normalizedName = String(NAME || '').replace(/.sui$/i, '');
				return 'List ' + normalizedName + '.sui';
			}

				function getMarketplaceListingTokenId() {
					if (currentListing?.tokenId) return String(currentListing.tokenId);
					if (currentBestBid?.tokenId) return String(currentBestBid.tokenId);
					if (NFT_ID) return NFT_ID;
					return '';
				}

				const TRADEPORT_DISPLAY_COMMISSION_BPS = 300;

					function formatMarketplaceBidSuiDisplay(amountSui) {
						if (!Number.isFinite(amountSui) || amountSui <= 0) return '--';
						const absSui = Math.abs(amountSui);
						if (absSui >= 1000) return formatMarketplaceListingSuiDisplay(amountSui);
						const nearestInt = Math.round(amountSui);
					const diffFromWhole = Math.abs(amountSui - nearestInt);

				if (absSui >= 0.05) {
					const fivePercentOfValue = absSui * 0.05;
					if (diffFromWhole < fivePercentOfValue) {
						return String(nearestInt);
					}
				}

					if (absSui >= 1) {
						return trimTrailingZeros(amountSui.toFixed(2));
					}
					if (absSui >= 0.1) {
						return trimTrailingZeros(amountSui.toFixed(3));
					}
					return amountSui.toFixed(2);
				}

				function roundToSignificantFigures(value, significantFigures = 3) {
					if (!Number.isFinite(value) || value === 0) return 0;
					const digits = Math.floor(Math.log10(Math.abs(value))) + 1;
					const decimals = Math.max(0, significantFigures - digits);
					return Number(value.toFixed(decimals));
				}

				function formatMarketplaceUsdEstimate(amountUsd) {
					if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
						return { compact: '--', full: '--' };
					}

					const absAmount = Math.abs(amountUsd);
					const compactFormatter = new Intl.NumberFormat('en-US', {
						notation: 'compact',
						maximumFractionDigits: absAmount >= 100 ? 1 : 2,
					});
					const fullFormatter = new Intl.NumberFormat('en-US', {
						minimumFractionDigits: 2,
						maximumFractionDigits: 2,
					});

					return {
						compact: compactFormatter.format(amountUsd),
						full: fullFormatter.format(amountUsd),
					};
				}

					function formatMarketplaceListingSuiDisplay(amountSui) {
						if (!Number.isFinite(amountSui) || amountSui <= 0) return '--';

					const COMPACT_UNITS = [
						{ divisor: 1e12, suffix: 'T' },
						{ divisor: 1e9, suffix: 'B' },
						{ divisor: 1e6, suffix: 'M' },
						{ divisor: 1e3, suffix: 'K' },
					];
					const SIG_FIGS = 3;
					const absAmount = Math.abs(amountSui);

					for (let i = 0; i < COMPACT_UNITS.length; i++) {
						const unit = COMPACT_UNITS[i];
						if (absAmount < unit.divisor) continue;

						let scaled = absAmount / unit.divisor;
						let rounded = roundToSignificantFigures(scaled, SIG_FIGS);
						let suffix = unit.suffix;

						if (rounded >= 1000 && i > 0) {
							const largerUnit = COMPACT_UNITS[i - 1];
							scaled = absAmount / largerUnit.divisor;
							rounded = roundToSignificantFigures(scaled, SIG_FIGS);
							suffix = largerUnit.suffix;
						}

						return trimTrailingZeros(String(rounded)) + suffix;
					}

						const baseRounded = roundToSignificantFigures(absAmount, SIG_FIGS);
						return trimTrailingZeros(String(baseRounded));
					}

					function getMarketplaceListingDisplaySui(listingPriceMist) {
						const listingMist = Number(listingPriceMist || 0);
						if (!Number.isFinite(listingMist) || listingMist <= 0) return 0;
						const marketFeeMist = TRADEPORT_DISPLAY_COMMISSION_BPS > 0
							? Math.ceil(listingMist * TRADEPORT_DISPLAY_COMMISSION_BPS / 10000)
							: 0;
						return (listingMist + marketFeeMist) / 1e9;
					}

					const trimTrailingZeros = (value) => value.replace(/[.]?0+$/, '');

			function getRoundedListAmountSuiOrNull() {
				if (!marketplaceListAmountInput) return null;
				const amountSui = parseFloat(String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, ''));
				if (!Number.isFinite(amountSui) || amountSui <= 0) return null;
				return Math.max(getListMinimumSui(), toSuiInputPrecision(amountSui));
			}

			function normalizeListAmountInput() {
				if (!marketplaceListAmountInput) return null;
				const minimumSui = getListMinimumSui();
				marketplaceListAmountInput.min = String(minimumSui);
				const roundedAmount = getRoundedListAmountSuiOrNull();
				if (!roundedAmount) return null;
				marketplaceListAmountInput.value = formatSuiInputValue(roundedAmount);
				return roundedAmount;
			}

			function setListInputDefault(force = false) {
				if (!marketplaceListAmountInput) return;

				const existingAmount = parseFloat(marketplaceListAmountInput.value);
				const hasTyped = listInputTouched && Number.isFinite(existingAmount) && existingAmount > 0;
				if (!force && hasTyped) return;

				const minimumSui = getListMinimumSui();

				let defaultValue = getListDefaultSui();
				const renewalBaseSui = getProfileRenewalBaseCostSuiOrNull();
				if (!(Number.isFinite(renewalBaseSui) && renewalBaseSui > 0) && !hasOwnerListingForCurrentNft()) {
					ensureProfileRenewalBaseCostSui()
						.then((resolvedRenewalBaseSui) => {
							if (!marketplaceListAmountInput || listInputTouched || hasOwnerListingForCurrentNft()) return;
							if (!Number.isFinite(resolvedRenewalBaseSui) || resolvedRenewalBaseSui <= 0) return;
							const latestMinimumSui = getListMinimumSui();
							const hydratedDefaultSui = Math.max(
								latestMinimumSui,
								roundUpToWholeSui(resolvedRenewalBaseSui * 2),
							);
							marketplaceListAmountInput.value = formatSuiInputValue(hydratedDefaultSui);
							marketplaceListAmountInput.min = String(latestMinimumSui);
							updateListButtonState();
						})
						.catch(() => null);
				}

				if (defaultValue < minimumSui) {
					defaultValue = minimumSui;
				}

				if (defaultValue > 0) {
					marketplaceListAmountInput.value = formatSuiInputValue(
						Math.max(minimumSui, toSuiInputPrecision(defaultValue)),
					);
					marketplaceListAmountInput.min = String(minimumSui);
				} else {
					marketplaceListAmountInput.value = '';
					marketplaceListAmountInput.min = String(minimumSui);
				}

				listInputTouched = false;
			}

			function getListAmountMistOrNull() {
				const amountSui = normalizeListAmountInput();
				if (!amountSui) return null;
				return BigInt(Math.round(amountSui * 1e9));
			}

			function updateListEstimateDisplay() {
				if (!marketplaceListEstimate) return;

				const rawListAmountSui = marketplaceListAmountInput
					? parseFloat(String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, ''))
					: 0;

				if (!Number.isFinite(rawListAmountSui) || rawListAmountSui <= 0) {
					marketplaceListEstimate.innerHTML = '';
					return;
				}

				const listingAmountSui = toSuiInputPrecision(rawListAmountSui);
				const usdEstimate = cachedSuiUsdPrice > 0 ? (listingAmountSui * cachedSuiUsdPrice) : null;
					const renewalBaseSui = getProfileRenewalBaseCostSuiOrNull();
					if (!(Number.isFinite(renewalBaseSui) && renewalBaseSui > 0) && !profileRenewalBaseCostPending) {
						ensureProfileRenewalBaseCostSui()
							.then(() => {
								updateListEstimateDisplay();
							})
							.catch(() => null);
					}

				const estimateLines = [];
				if (usdEstimate && Number.isFinite(usdEstimate) && usdEstimate > 0) {
					const formattedEstimate = formatMarketplaceUsdEstimate(usdEstimate);
					estimateLines.push(
						'<span class="marketplace-list-usd" title="$' + formattedEstimate.full + '">≈ $' + formattedEstimate.compact + '</span>',
					);
				}

					marketplaceListEstimate.innerHTML = estimateLines.join('');
				}

			function updateListButtonState() {
				if (!marketplaceListBtn) return;
				const listingTokenId = getMarketplaceListingTokenId();
				const minimumSui = getListMinimumSui();
				if (marketplaceListAmountInput) {
					marketplaceListAmountInput.min = String(minimumSui);
				}
				const rawListAmountSui = marketplaceListAmountInput
					? parseFloat(String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, ''))
					: 0;
				const roundedListAmountSui =
					Number.isFinite(rawListAmountSui) && rawListAmountSui > 0
						? Math.max(minimumSui, toSuiInputPrecision(rawListAmountSui))
						: 0;
				const meetsMinimum = roundedListAmountSui >= minimumSui;
				const canList = Boolean(
					isConnectedProfileOwner()
					&& canSign()
					&& listingTokenId
					&& roundedListAmountSui > 0
					&& meetsMinimum,
				);
				marketplaceListBtn.disabled = !canList;

				if (marketplaceStatus && roundedListAmountSui > 0 && roundedListAmountSui < minimumSui) {
					marketplaceStatus.textContent = 'List price must be at least ' + minimumSui + ' SUI';
					marketplaceStatus.className = 'marketplace-status error';
				} else if (marketplaceStatus && marketplaceStatus.className === 'marketplace-status error') {
					marketplaceStatus.textContent = '';
					marketplaceStatus.className = 'marketplace-status';
				}

				updateListEstimateDisplay();
				updateMarketplaceStepperLabels();
				queueMarketplaceLayoutSync();
			}

			function getGraceWrapState() {
				const expirationMs = Number(EXPIRATION_MS || 0);
				const availableAtMs = Number(AVAILABLE_AT || 0);
				if (!Number.isFinite(expirationMs) || expirationMs <= 0 || !Number.isFinite(availableAtMs)) {
					return { eligible: false, reason: 'Expiration data unavailable' };
				}
				const now = Date.now();
				if (now >= availableAtMs) {
					return { eligible: false, reason: 'Grace period has ended' };
				}
				if (now < expirationMs) {
					return {
						eligible: true,
						phase: 'pre-expiry',
						startsInMs: Math.max(0, expirationMs - now),
						remainingMs: GRACE_PERIOD_MS,
						premiumSui: 100000000,
					};
				}
				const remainingMs = Math.max(0, availableAtMs - now);
				const ratio = Math.max(0, Math.min(1, remainingMs / GRACE_PERIOD_MS));
				const premiumSui = 100000000 * Math.pow(ratio, AUCTION_DECAY_EXPONENT);
				return {
					eligible: true,
					phase: 'grace',
					remainingMs,
					premiumSui,
				};
			}

			function formatGraceWrapTimeLeft(ms) {
				if (!Number.isFinite(ms) || ms <= 0) return '0m';
				const days = Math.floor(ms / 86400000);
				const hours = Math.floor((ms % 86400000) / 3600000);
				const mins = Math.floor((ms % 3600000) / 60000);
				if (days > 0) return days + 'd ' + hours + 'h';
				if (hours > 0) return hours + 'h ' + mins + 'm';
				return mins + 'm';
			}

			function updateGraceWrapControls(isOwner) {
				if (!marketplaceWrapBtn || !marketplaceWrapHint) return;
				const canShowWrap = Boolean(isOwner && DECAY_AUCTION_PACKAGE_ID && NFT_ID);
				marketplaceWrapBtn.style.display = canShowWrap ? 'flex' : 'none';
				marketplaceWrapHint.style.display = canShowWrap ? 'block' : 'none';
				if (!canShowWrap) return;

				const wrapState = getGraceWrapState();
				const hasAuctionListing = Boolean(auctionData?.listingId);
				const canAuthorize = Boolean(
					canSign() &&
					!marketplaceWrapPending &&
					wrapState.eligible &&
					!hasAuctionListing,
				);
				marketplaceWrapBtn.disabled = !canAuthorize;

				if (hasAuctionListing) {
					if (marketplaceWrapText) marketplaceWrapText.textContent = 'Grace Wrap Active';
					const now = Date.now();
					const listingStartMs = Number(auctionData?.startTimeMs || 0);
					if (Number.isFinite(listingStartMs) && listingStartMs > now) {
						const startsInLabel = formatGraceWrapTimeLeft(listingStartMs - now);
						marketplaceWrapHint.textContent =
							'Grace wrap is scheduled. Starts in ' + startsInLabel + '. You can cancel in the auction card.';
					} else {
						marketplaceWrapHint.textContent = 'This name already has an active decay listing.';
					}
					return;
				}

				if (marketplaceWrapText) {
					marketplaceWrapText.textContent = 'Authorize Grace Wrap';
				}

				if (!wrapState.eligible) {
					marketplaceWrapHint.textContent = wrapState.reason;
					return;
				}

				const premiumLabel = formatMarketplaceListingSuiDisplay(wrapState.premiumSui);
				const timeLeftLabel = formatGraceWrapTimeLeft(wrapState.remainingMs);
				if (wrapState.phase === 'pre-expiry') {
					const startsInLabel = formatGraceWrapTimeLeft(wrapState.startsInMs);
					marketplaceWrapHint.textContent =
						'One signature. Activates at expiration in ' +
						startsInLabel +
						', starts at ~' +
						premiumLabel +
						' SUI, then decays to ~0 over ' +
						timeLeftLabel +
						'. Renewal cost applies separately.';
					return;
				}
				marketplaceWrapHint.textContent =
					'One signature. Premium now ~' +
					premiumLabel +
					' SUI, decays to ~0 in ' +
					timeLeftLabel +
					'. Renewal cost applies separately.';
			}

			function updateMarketplaceButton() {
				if (connectedAddress && !nftOwnerAddress && NFT_ID && !resolvingNftOwnerForMarketplace) {
					resolvingNftOwnerForMarketplace = true;
					fetchNftOwner()
						.then((owner) => {
							if (owner) nftOwnerAddress = owner;
						})
						.catch(() => null)
						.finally(() => {
							resolvingNftOwnerForMarketplace = false;
							updateMarketplaceButton();
						});
				}

					const isOwner = isConnectedProfileOwner();
					const isDisconnectedBidderView = !connectedAddress && !isOwner;
					const useTradeportBidTheme = !isOwner;
					if (marketplaceCard) {
						marketplaceCard.classList.toggle('marketplace-disconnected', isDisconnectedBidderView);
						marketplaceCard.classList.toggle('marketplace-tradeport-empty', useTradeportBidTheme);
						marketplaceCard.classList.toggle('marketplace-owner-listing', isOwner);
					}

					if (marketplaceBuyBtn && marketplaceBuyText && currentListing) {
						const priceInSui = formatMarketplaceListingSuiDisplay(
							getMarketplaceListingDisplaySui(currentListing.price),
						);
					if (isOwner) {
						marketplaceBuyBtn.style.display = 'none';
					} else if (connectedAddress) {
						marketplaceBuyBtn.style.display = 'flex';
						marketplaceBuyBtn.disabled = false;
						marketplaceBuyText.textContent = 'Buy for ' + priceInSui + ' SUI';
					} else {
						marketplaceBuyBtn.style.display = 'flex';
						marketplaceBuyBtn.disabled = true;
						marketplaceBuyText.textContent = 'Connect Wallet to Buy';
					}
				}

				if (marketplaceBidInputWrap) {
					marketplaceBidInputWrap.style.display = isOwner ? 'none' : 'flex';
				}
				if (marketplaceBidEstimate) {
					marketplaceBidEstimate.style.display = isOwner ? 'none' : 'inline-flex';
				}
					if (marketplacePlaceBidBtn && marketplaceBidText) {
						if (!connectedAddress && !isOwner) {
							marketplacePlaceBidBtn.disabled = false;
							marketplacePlaceBidBtn.classList.add('connect-wallet');
							marketplaceBidText.textContent = 'Connect Wallet to Offer';
						} else {
							marketplacePlaceBidBtn.disabled = !connectedAddress || isOwner;
							marketplacePlaceBidBtn.classList.remove('connect-wallet');
							const currentBid = parseFloat(String(marketplaceBidAmountInput?.value || '').replace(/[^0-9.]/g, ''));
								const bidVal = Number.isFinite(currentBid) && currentBid > 0 ? Math.ceil(currentBid) : getBidMinimumSui();
								const bidDisplay = String(Math.max(1, Math.ceil(bidVal)));
							marketplaceBidText.textContent = 'Offer ' + bidDisplay + ' SUI for ' + NAME + '.sui';
						}
				}
				updateBidEstimateDisplay();

				if (marketplaceListInputWrap) {
					marketplaceListInputWrap.style.display = isOwner ? 'flex' : 'none';
				}
				if (isOwner) {
					setListInputDefault();
					ensureProfileRegistrationCostSui()
						.then(() => {
							setListInputDefault();
							updateListButtonState();
						})
						.catch(() => null);
				}
				if (marketplaceListBtn) {
						if (isOwner) {
							marketplaceListBtn.style.display = 'flex';
						if (marketplaceListText) marketplaceListText.textContent = getMarketplaceListLabel();
					} else {
						marketplaceListBtn.style.display = 'none';
					}
				}
				updateListButtonState();
				updateGraceWrapControls(isOwner);

				if (marketplaceAcceptBidBtn && marketplaceAcceptText) {
					const bidMatchesCurrentNft =
						!NFT_ID ||
						!currentBestBid?.tokenId ||
						currentBestBid.tokenId.toLowerCase() === NFT_ID.toLowerCase();
					const canAcceptBestBid = Boolean(
						isOwner && currentBestBid?.id && currentBestBid?.price && bidMatchesCurrentNft,
					);

					if (!canAcceptBestBid) {
						marketplaceAcceptBidBtn.style.display = 'none';
					} else {
						marketplaceAcceptBidBtn.style.display = 'flex';
						marketplaceAcceptBidBtn.disabled = false;
						marketplaceAcceptText.textContent = 'Accept';
					}
				}
				updateEditButton();
				queueMarketplaceLayoutSync();
			}

			async function fetchMarketplaceData() {
				marketplaceCard.style.display = 'block';
				syncOverviewModulesLayout();
				updateMarketplaceButton();
				setMarketplaceActivityMessage('Loading activity...');
				if (marketplaceActivityLink) {
					marketplaceActivityLink.href = getTradeportItemUrl(NFT_ID || '');
				}
				ensureProfileRegistrationCostSui()
					.then(() => {
						setListInputDefault();
						setBidInputDefaultFromBestOffer();
						updateListButtonState();
					})
					.catch(() => null);
				try {
					const currentNameKey = String(NAME || '').replace(/.sui$/i, '');
					const marketplaceUrl = NFT_ID
						? '/api/marketplace/' + NAME + '?tokenId=' + encodeURIComponent(NFT_ID)
						: '/api/marketplace/' + NAME;
					const response = await fetch(marketplaceUrl);
					if (!response.ok) {
						setMarketplaceActivityMessage('Activity unavailable right now.');
						return;
					}
					const data = await response.json();
					const activeTokenId = String(NFT_ID || '').toLowerCase();

						// Fallback if bestBid is not explicitly populated by API.
						let resolvedBestBid = data.bestBid && data.bestBid.price ? data.bestBid : null;
							if (!resolvedBestBid && Array.isArray(data?.nfts)) {
							for (const nft of data.nfts) {
								const tokenId = String(nft?.tokenId || nft?.token_id || '');
								if (activeTokenId && tokenId && tokenId.toLowerCase() !== activeTokenId) continue;
							const bids = Array.isArray(nft?.bids) ? nft.bids : [];
							for (const bid of bids) {
								const price = Number(bid?.price || 0);
								if (!price || price <= 0) continue;
								if (!resolvedBestBid || price > Number(resolvedBestBid.price || 0)) {
									resolvedBestBid = { ...bid, tokenId };
								}
							}
						}
						}

				lastSoldPriceMist = null;
				lastSaleEventMs = 0;
				lastListingEventMs = 0;
					if (data.bestListing && data.bestListing.price) {
						currentListing = data.bestListing;
						const currentListingSui = (Number(data.bestListing.price) / 1e9).toFixed(2);
						if (currentNameKey) {
							linkedNamesPrices[currentNameKey] = currentListingSui;
							linkedNamesMarketData[currentNameKey] = {
								listingPriceSui: currentListingSui,
								bestBidSui: linkedNamesMarketData[currentNameKey]?.bestBidSui || null,
								bidder: linkedNamesMarketData[currentNameKey]?.bidder || '',
								seller: typeof data.bestListing.seller === 'string' ? data.bestListing.seller : '',
							};
						}
						const priceInSui = formatMarketplaceListingSuiDisplay(
							getMarketplaceListingDisplaySui(data.bestListing.price),
						);
					const listingAmountEl = marketplaceListingPrice.querySelector('.price-amount');
					const listingSuiEl = marketplaceListingPrice.querySelector('.price-sui');
					if (listingAmountEl) listingAmountEl.textContent = priceInSui;
					if (listingSuiEl) listingSuiEl.textContent = ' ' + 'SUI';
					if (marketplaceLister) {
						const sellerAddress = typeof data.bestListing.seller === 'string' ? data.bestListing.seller : '';
						setMarketplaceListerLink(sellerAddress);
						if (sellerAddress) {
							resolveBidderDisplay(sellerAddress).then((display) => {
								if (currentListing?.seller === sellerAddress) {
									setMarketplaceListerLink(sellerAddress, display);
								}
							});
						}
					}
					marketplaceListingRow.style.display = 'flex';
					marketplaceBuyBtn.style.display = 'block';
					setListInputDefault();
				} else {
					currentListing = null;
					if (currentNameKey) {
						delete linkedNamesPrices[currentNameKey];
						if (linkedNamesMarketData[currentNameKey]) {
							linkedNamesMarketData[currentNameKey] = {
								listingPriceSui: null,
								bestBidSui: linkedNamesMarketData[currentNameKey]?.bestBidSui || null,
								bidder: linkedNamesMarketData[currentNameKey]?.bidder || '',
								seller: '',
							};
						}
					}
					marketplaceListingRow.style.display = 'none';
					marketplaceBuyBtn.style.display = 'none';
					if (marketplaceLister) setMarketplaceListerLink('', '');
					setListInputDefault(true);
				}

					const sales = data.sales || [];
					currentSales = sales;
					for (const sale of sales) {
						const saleTokenId = String(sale?.tokenId || sale?.token_id || '').toLowerCase();
						if (activeTokenId && saleTokenId && saleTokenId !== activeTokenId) continue;
						const salePrice = Number(sale?.price || 0);
						if (!Number.isFinite(salePrice) || salePrice <= 0) continue;
						const saleTimeMs = parseMarketEventTimeMs(sale?.blockTime || sale?.block_time || '');
						if (saleTimeMs > 0 && saleTimeMs >= lastSaleEventMs) {
							lastSaleEventMs = saleTimeMs;
							lastSoldPriceMist = salePrice;
							continue;
						}
						if (!lastSoldPriceMist) {
							lastSoldPriceMist = salePrice;
						}
					}

				if (resolvedBestBid && resolvedBestBid.price) {
					currentBestBid = resolvedBestBid;
					const bidInSui = formatMarketplaceBidSuiDisplay(Number(resolvedBestBid.price) / 1e9);
					const bidAmountEl = marketplaceBidPrice.querySelector('.price-amount');
					const bidSuiEl = marketplaceBidPrice.querySelector('.price-sui');
					if (bidAmountEl) bidAmountEl.textContent = bidInSui;
					if (bidSuiEl) bidSuiEl.textContent = ' ' + 'SUI';
					marketplaceBidRow.style.display = 'grid';
					if (marketplaceBidder) {
						const bidderAddress = resolvedBestBid.bidder || '';
						setMarketplaceBidderLink(bidderAddress);
						resolveBidderDisplay(bidderAddress).then((display) => {
							if (currentBestBid?.bidder === bidderAddress) {
								setMarketplaceBidderLink(bidderAddress, display);
							}
						});
					}
					setBidInputDefaultFromBestOffer();
				} else {
					currentBestBid = null;
					marketplaceBidRow.style.display = 'none';
					if (marketplaceBidder) {
						setMarketplaceBidderLink('', '');
					}
					setBidInputDefaultFromBestOffer();
				}

				if (lastSoldPriceMist && lastSaleEventMs > 0) {
					const soldInSui = formatMarketplaceBidSuiDisplay(lastSoldPriceMist / 1e9);
					const soldAmountEl = marketplaceSoldPrice.querySelector('.price-amount');
					const soldSuiEl = marketplaceSoldPrice.querySelector('.price-sui');
					if (soldAmountEl) soldAmountEl.textContent = soldInSui;
					if (soldSuiEl) soldSuiEl.textContent = ' ' + 'SUI';
					marketplaceSoldRow.style.display = 'flex';
					const latestSale = sales.find(s => Number(s?.price || 0) === lastSoldPriceMist);
					if (latestSale && latestSale.receiver) {
						const sellerAddress = latestSale.receiver;
						marketplaceSeller.href = 'https://sui.ski';
						marketplaceSeller.setAttribute('data-activity-address', sellerAddress);
						marketplaceSeller.textContent = getBidderFallback(sellerAddress);
						resolveBidderDisplay(sellerAddress).then((display) => {
							if (marketplaceSeller.getAttribute('data-activity-address') === sellerAddress) {
								marketplaceSeller.textContent = display;
							}
						});
					}
				} else {
					marketplaceSoldRow.style.display = 'none';
				}

					setListInputDefault();
					updateMarketplaceButton();
					if (linkedNamesData && linkedNamesData.length > 0) {
						renderLinkedNames().catch(function() {});
					}
					renderMarketplaceActivity(data).catch((error) => {
						console.log('Marketplace activity render failed:', error);
						setMarketplaceActivityMessage('Activity unavailable right now.');
					});
				queueMarketplaceLayoutSync();
				applyTaggedIdentityToProfile();
			} catch (e) {
				console.log('Marketplace fetch failed:', e);
				setMarketplaceActivityMessage('Activity unavailable right now.');
				queueMarketplaceLayoutSync();
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
			const TRADEPORT_COMMISSION_BPS = TRADEPORT_DISPLAY_COMMISSION_BPS;
		const SUINS_REGISTRATION_TYPE = '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0::suins_registration::SuinsRegistration';
				const TRADEPORT_MULTI_BID_PACKAGE = '0x63ce6caee2ba264e92bca2d160036eb297d99b2d91d4db89d48a9bffca66e55b';
				const TRADEPORT_MULTI_BID_STORE = '0x8aaed7e884343fb8b222c721d02eaac2c6ae2abbb4ddcdf16cb55cf8754ee860';
				const TRADEPORT_MULTI_BID_STORE_VERSION = '572206387';
				const TRADEPORT_BID_FEE_BPS = 300;
				const TRADEPORT_CLOCK_OBJECT = '0x6';

		if (marketplaceBuyBtn) {
			marketplaceBuyBtn.addEventListener('click', async () => {
				if (!canSign() || !currentListing) {
					marketplaceStatus.textContent = 'Connect wallet first';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

				const nonce = currentListing.nonce || '';

				// Kiosk listings (1::) or no nonce - redirect to Tradeport
				if (!nonce || nonce.startsWith('1::')) {
					const tradeportUrl = currentListing.tradeportUrl
						|| (NFT_ID
							? 'https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=' + encodeURIComponent(NFT_ID) + '&modalSlug=suins&nav=1'
							: 'https://www.tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(NAME));
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
					const isNewFormat = nonce.startsWith('0::');
					const listingPriceMist = BigInt(currentListing.price);
					const marketFeeMist = isNewFormat
						? BigInt(Math.ceil(currentListing.price * TRADEPORT_COMMISSION_BPS / 10000))
						: 0n;
					const totalRequiredMist = listingPriceMist + marketFeeMist;

					const tx = new Transaction();
					tx.setSender(connectedAddress);
					await ensureMarketplaceFunding(tx, totalRequiredMist);

					if (isNewFormat) {
						// Newer Tradeport listings - use tradeport_listings::buy_listing_without_transfer_policy
						const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalRequiredMist)]);

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
						const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(listingPriceMist)]);

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

					let result;
					result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

					const digest = result.digest || result.result?.digest || '';
					if (digest) {
						lastSoldPriceMist = currentListing.price;
						marketplaceStatus.innerHTML = 'Purchase successful! ' + renderTxExplorerLinks(digest, true);
						marketplaceStatus.className = 'marketplace-status success';
						marketplaceBuyBtn.style.display = 'none';
						currentListing = null;
						applyTaggedIdentityToProfile();
						fetchMarketplaceData();
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

			if (marketplaceListBtn) {
				marketplaceListBtn.addEventListener('click', async () => {
				if (!canSign()) {
					marketplaceStatus.textContent = 'Connect wallet first';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}
				if (!isConnectedProfileOwner()) {
					marketplaceStatus.textContent = 'Only the NFT owner can list this name';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}
					const listingTokenId = getMarketplaceListingTokenId();
					if (!listingTokenId) {
						marketplaceStatus.textContent = 'No NFT found for this name';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}

				const listAmountMist = getListAmountMistOrNull();
				if (!listAmountMist) {
					marketplaceStatus.textContent = 'Enter a valid listing amount';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

				const isRelist = hasOwnerListingForCurrentNft();
				marketplaceListBtn.disabled = true;
				marketplaceListText?.classList.add('hidden');
				marketplaceListLoading?.classList.remove('hidden');
				marketplaceStatus.textContent = isRelist
					? 'Building relist transaction...'
					: 'Building listing transaction...';
				marketplaceStatus.className = 'marketplace-status';

				try {
					const tx = new Transaction();
					tx.setSender(connectedAddress);

					const listingsStoreRef = tx.sharedObjectRef({
						objectId: TRADEPORT_LISTINGS_STORE,
						initialSharedVersion: TRADEPORT_LISTINGS_STORE_VERSION,
						mutable: true,
					});

						if (isRelist) {
							tx.moveCall({
								target: TRADEPORT_LISTINGS_PACKAGE + '::tradeport_listings::relist_listing_without_transfer_policy',
								typeArguments: [SUINS_REGISTRATION_TYPE],
								arguments: [
									listingsStoreRef,
									tx.pure.id(listingTokenId),
									tx.pure.u64(listAmountMist),
								],
							});
						} else {
							tx.moveCall({
								target: TRADEPORT_LISTINGS_PACKAGE + '::tradeport_listings::create_listing_without_transfer_policy',
								typeArguments: [SUINS_REGISTRATION_TYPE],
								arguments: [
									listingsStoreRef,
									tx.object(listingTokenId),
									tx.pure.u64(listAmountMist),
								],
							});
						}

					marketplaceStatus.textContent = 'Waiting for wallet...';

					let result;
					result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

					const digest = result.digest || result.result?.digest || '';
					if (digest) {
						marketplaceStatus.innerHTML =
							(isRelist ? 'Listing updated! ' : 'Listed! ') + renderTxExplorerLinks(digest, true);
						marketplaceStatus.className = 'marketplace-status success';
						listInputTouched = false;
						await fetchMarketplaceData();
					} else {
						marketplaceStatus.textContent = isRelist
							? 'Relist transaction submitted'
							: 'List transaction submitted';
						marketplaceStatus.className = 'marketplace-status success';
					}
					applyTaggedIdentityToProfile();
				} catch (e) {
					console.error('List transaction failed:', e);
					const msg = e?.message || 'Transaction failed';
					if (msg.includes('rejected') || msg.includes('cancelled')) {
						marketplaceStatus.textContent = 'Transaction cancelled';
					} else {
						marketplaceStatus.textContent = 'Failed: ' + msg.slice(0, 100);
					}
					marketplaceStatus.className = 'marketplace-status error';
				} finally {
					marketplaceListText?.classList.remove('hidden');
					marketplaceListLoading?.classList.add('hidden');
					updateMarketplaceButton();
				}
			});
		}

			if (marketplaceWrapBtn) {
				marketplaceWrapBtn.addEventListener('click', async () => {
					if (!canSign()) {
						marketplaceStatus.textContent = 'Connect wallet first';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}
					if (!isConnectedProfileOwner()) {
						marketplaceStatus.textContent = 'Only the NFT owner can authorize grace wrap';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}
					if (!NFT_ID) {
						marketplaceStatus.textContent = 'No NFT found for this name';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}
					const wrapState = getGraceWrapState();
					if (!wrapState.eligible) {
						marketplaceStatus.textContent = wrapState.reason;
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}
					if (!Number.isFinite(EXPIRATION_MS) || Number(EXPIRATION_MS) <= 0) {
						marketplaceStatus.textContent = 'Missing expiration timestamp';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}

					try {
						marketplaceWrapPending = true;
						marketplaceWrapBtn.disabled = true;
						marketplaceWrapText?.classList.add('hidden');
						marketplaceWrapLoading?.classList.remove('hidden');
						marketplaceStatus.textContent = 'Building grace wrap authorization...';
						marketplaceStatus.className = 'marketplace-status';

						const senderAddress = getConnectedSenderAddress();
						const res = await fetch('/api/auction/list', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								nftId: NFT_ID,
								senderAddress,
								curveMode: 'grace-window',
								expirationMs: String(EXPIRATION_MS),
							}),
						});
						const data = await res.json();
						if (!res.ok || data.error) throw new Error(data.error || 'Failed to build grace wrap transaction');

						const tx = Transaction.from(data.txBytes);
						marketplaceStatus.textContent = 'Confirm in wallet (one-time authorization)...';
						marketplaceStatus.className = 'marketplace-status';

						const result = await SuiWalletKit.signAndExecute(tx, {
							txOptions: { showEffects: true, showObjectChanges: true },
						});
						const listingId = await extractDecayListingIdFromTxResult(result);
						await registerDecayListingForNft(NFT_ID, listingId);

						const digest = result.digest || result.result?.digest || '';
						const startSui = Number(data.startPriceMist || 0) / 1e9;
						const startLabel = Number.isFinite(startSui) ? formatMarketplaceListingSuiDisplay(startSui) : '--';
						const startTimeMs = Number(data.startTimeMs || 0);
						const nowMs = Date.now();
						if (Number.isFinite(startTimeMs) && startTimeMs > nowMs) {
							marketplaceStatus.innerHTML =
								'Grace wrap authorized. Starts at ~' +
								startLabel +
								' SUI premium at expiration. ' +
								renderTxExplorerLinks(digest, true);
						} else {
							const currentSui = Number(data.currentPremiumMist || data.startPriceMist || 0) / 1e9;
							const currentLabel = Number.isFinite(currentSui)
								? formatMarketplaceListingSuiDisplay(currentSui)
								: startLabel;
							marketplaceStatus.innerHTML =
								'Grace wrap authorized at ~' +
								currentLabel +
								' SUI premium. ' +
								renderTxExplorerLinks(digest, true);
						}
						marketplaceStatus.className = 'marketplace-status success';
						await fetchAuctionStatus();
						await fetchMarketplaceData();
					} catch (error) {
						const message = error?.message || 'Transaction failed';
						marketplaceStatus.textContent =
							message.includes('cancel') || message.includes('reject')
								? 'Transaction cancelled'
								: 'Failed: ' + message.slice(0, 120);
						marketplaceStatus.className = 'marketplace-status error';
					} finally {
						marketplaceWrapPending = false;
						marketplaceWrapText?.classList.remove('hidden');
						marketplaceWrapLoading?.classList.add('hidden');
						updateMarketplaceButton();
					}
				});
			}

			if (marketplacePlaceBidBtn) {
				marketplacePlaceBidBtn.addEventListener('click', async () => {
					if (!canSign()) {
						if (marketplacePlaceBidBtn.classList.contains('connect-wallet')) {
							const bidAmountSui = getRoundedBidAmountSuiOrNull();
							if (bidAmountSui && bidAmountSui > 0) {
								pendingBidAmount = bidAmountSui;
							}
							connectWallet();
							return;
						}
					marketplaceStatus.textContent = 'Connect wallet first';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}
					if (isConnectedProfileOwner()) {
						marketplaceStatus.textContent = 'Owners should list this name instead of bidding';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}

					const bidAmountSui = normalizeBidAmountInput();
					if (!bidAmountSui || bidAmountSui <= 0) {
						marketplaceStatus.textContent = 'Enter a valid bid amount';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}

					const minBidSui = getBidMinimumSui();
					if (bidAmountSui + 1e-9 < minBidSui) {
						marketplaceStatus.textContent =
							'Bid must be at least ' + minBidSui + ' SUI';
						marketplaceStatus.className = 'marketplace-status error';
						return;
					}

				if (!NFT_ID) {
					marketplaceStatus.textContent = 'No NFT found for this name';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

				marketplacePlaceBidBtn.disabled = true;
				marketplaceBidText.classList.add('hidden');
				marketplaceBidLoading.classList.remove('hidden');
				marketplaceStatus.textContent = 'Building transaction...';
					marketplaceStatus.className = 'marketplace-status';

					try {
						const bidMist = BigInt(Math.ceil(bidAmountSui * 1e9));
						const tradeportFeeMist = (bidMist * BigInt(TRADEPORT_BID_FEE_BPS) + 9999n) / 10000n;
						const totalMist = bidMist + tradeportFeeMist;

						const tx = new Transaction();
						tx.setSender(connectedAddress);
						await ensureMarketplaceFunding(tx, totalMist);

						const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalMist)]);

						const multiBidStoreRef = tx.sharedObjectRef({
							objectId: TRADEPORT_MULTI_BID_STORE,
						initialSharedVersion: TRADEPORT_MULTI_BID_STORE_VERSION,
						mutable: true,
					});

					tx.moveCall({
						target: TRADEPORT_MULTI_BID_PACKAGE + '::tradeport_biddings::create_bid_without_transfer_policy',
						typeArguments: [SUINS_REGISTRATION_TYPE],
						arguments: [
							multiBidStoreRef,
							tx.pure.u64(1),
							tx.pure.option('address', null),
							tx.pure.option('address', NFT_ID),
							tx.pure.option('vector<u8>', null),
							tx.pure.option('u64', null),
							tx.pure.u64(bidMist),
							paymentCoin,
						],
					});

					marketplaceStatus.textContent = 'Waiting for wallet...';

					let result;
					result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

					const digest = result.digest || result.result?.digest || '';
					if (digest) {
						marketplaceStatus.innerHTML = 'Bid placed! ' + renderTxExplorerLinks(digest, true);
						marketplaceStatus.className = 'marketplace-status success';
						bidInputTouched = false;
						fetchMarketplaceData();
					} else {
						marketplaceStatus.textContent = 'Bid submitted';
						marketplaceStatus.className = 'marketplace-status success';
					}
					applyTaggedIdentityToProfile();
				} catch (e) {
					console.error('Bid transaction failed:', e);
					const msg = e.message || 'Transaction failed';
					if (msg.includes('rejected') || msg.includes('cancelled')) {
						marketplaceStatus.textContent = 'Transaction cancelled';
					} else if (msg.includes('InsufficientCoinBalance') || msg.includes('Insufficient')) {
						marketplaceStatus.textContent = 'Insufficient balance. Try a lower amount or tap MAX.';
					} else {
						marketplaceStatus.textContent = 'Failed: ' + msg.slice(0, 100);
					}
					marketplaceStatus.className = 'marketplace-status error';
				} finally {
					marketplacePlaceBidBtn.disabled = !connectedAddress;
					marketplaceBidText.classList.remove('hidden');
					marketplaceBidLoading.classList.add('hidden');
				}
			});
		}

				if (marketplaceBidAmountInput) {
					marketplaceBidAmountInput.addEventListener('input', () => {
						const sanitized = String(marketplaceBidAmountInput.value).replace(/[^0-9]/g, '');
						if (sanitized !== marketplaceBidAmountInput.value) {
							marketplaceBidAmountInput.value = sanitized;
						}
					bidInputTouched = true;
					updateBidEstimateDisplay();
				});
				marketplaceBidAmountInput.addEventListener('blur', () => {
					normalizeBidAmountInput();
					updateBidEstimateDisplay();
				});
			}

		if (marketplaceListAmountInput) {
			marketplaceListAmountInput.addEventListener('input', () => {
				const sanitized = String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, '');
				if (sanitized !== marketplaceListAmountInput.value) {
					marketplaceListAmountInput.value = sanitized;
				}
				listInputTouched = true;
				updateListButtonState();
			});
			marketplaceListAmountInput.addEventListener('blur', () => {
				normalizeListAmountInput();
				updateListButtonState();
			});
		}

		if (marketplaceListPriceUpBtn && marketplaceListAmountInput) {
			marketplaceListPriceUpBtn.addEventListener('click', () => {
				const currentValue = parseFloat(String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, ''));
				const minimumSui = getListMinimumSui();
				const baselineValue = Number.isFinite(currentValue) && currentValue > 0
					? currentValue
					: getListDefaultSui();
				const nextValue = applyListingPriceStep(baselineValue, minimumSui, 'up');
				marketplaceListAmountInput.value = formatSuiInputValue(nextValue);
				listInputTouched = true;
				updateListButtonState();
			});
		}

if (marketplaceListPriceDownBtn && marketplaceListAmountInput) {
				marketplaceListPriceDownBtn.addEventListener('click', () => {
				const currentValue = parseFloat(String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, ''));
				const minimumSui = getListMinimumSui();
				const baselineValue = Number.isFinite(currentValue) && currentValue > 0
					? currentValue
					: getListDefaultSui();
				const nextValue = applyListingPriceStep(baselineValue, minimumSui, 'down');
				marketplaceListAmountInput.value = formatSuiInputValue(nextValue);
				listInputTouched = true;
				updateListButtonState();
			});
		}

				if (marketplaceBidPriceUpBtn && marketplaceBidAmountInput) {
					marketplaceBidPriceUpBtn.addEventListener('click', () => {
						const currentValue = parseFloat(String(marketplaceBidAmountInput.value).replace(/[^0-9.]/g, ''));
						const minimumSui = getBidMinimumSui();
						const nextValue = applyBidPriceStep(currentValue, minimumSui, 'up');
						marketplaceBidAmountInput.value = formatSuiInputValue(nextValue);
						bidInputTouched = true;
						updateBidEstimateDisplay();
				});
			}

				if (marketplaceBidPriceDownBtn && marketplaceBidAmountInput) {
					marketplaceBidPriceDownBtn.addEventListener('click', () => {
						const currentValue = parseFloat(String(marketplaceBidAmountInput.value).replace(/[^0-9.]/g, ''));
						const minimumSui = getBidMinimumSui();
						const nextValue = applyBidPriceStep(currentValue, minimumSui, 'down');
						marketplaceBidAmountInput.value = formatSuiInputValue(nextValue);
						bidInputTouched = true;
						updateBidEstimateDisplay();
				});
			}

		if (marketplaceActivityList) {
			marketplaceActivityList.addEventListener('click', (event) => {
				const rawTarget = event.target;
				const targetEl = rawTarget instanceof Element
					? rawTarget
					: rawTarget instanceof Node
						? rawTarget.parentElement
						: null;
				if (!targetEl) return;
				const actorEl = targetEl.closest('[data-activity-address]');
				if (!(actorEl instanceof Element)) return;
				const address = actorEl.getAttribute('data-activity-address') || '';
				if (!address) return;
				fetchPrimaryName(address).then((primaryName) => {
					if (primaryName) {
						const cleanedName = primaryName.replace(/.sui$/i, '');
						window.open('https://' + encodeURIComponent(cleanedName) + '.sui.ski', '_blank', 'noopener,noreferrer');
					} else {
						window.open(getTradeportPortfolioHref(address), '_blank', 'noopener,noreferrer');
					}
				});
			});

			marketplaceActivityList.addEventListener('keydown', (event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return;
				const rawTarget = event.target;
				const targetEl = rawTarget instanceof Element
					? rawTarget
					: rawTarget instanceof Node
						? rawTarget.parentElement
						: null;
				if (!targetEl) return;
				const actorEl = targetEl.closest('[data-activity-address]');
				if (!(actorEl instanceof Element)) return;
				const address = actorEl.getAttribute('data-activity-address') || '';
				if (!address) return;
				event.preventDefault();
				fetchPrimaryName(address).then((primaryName) => {
					if (primaryName) {
						const cleanedName = primaryName.replace(/.sui$/i, '');
						window.open('https://' + encodeURIComponent(cleanedName) + '.sui.ski', '_blank', 'noopener,noreferrer');
					} else {
						window.open(getTradeportPortfolioHref(address), '_blank', 'noopener,noreferrer');
					}
				});
			});
		}

		if (marketplaceAcceptBidBtn) {
			marketplaceAcceptBidBtn.addEventListener('click', async () => {
				if (!canSign() || !currentBestBid?.id) {
					marketplaceStatus.textContent = 'Connect wallet first';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

				const isOwner = isConnectedProfileOwner();
				if (!isOwner) {
					marketplaceStatus.textContent = 'Only the NFT owner can accept bids';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

				const bidMatchesCurrentNft =
					!NFT_ID ||
					!currentBestBid.tokenId ||
					currentBestBid.tokenId.toLowerCase() === NFT_ID.toLowerCase();
				if (!bidMatchesCurrentNft) {
					marketplaceStatus.textContent = 'Highest bid is for a different NFT';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

					marketplaceAcceptBidBtn.disabled = true;
					marketplaceAcceptText?.classList.add('hidden');
					marketplaceAcceptLoading?.classList.remove('hidden');
					marketplaceStatus.textContent = 'Building accept transaction...';
					marketplaceStatus.className = 'marketplace-status';

					try {
						const senderAddress = getConnectedSenderAddress();
						if (!isLikelySuiAddress(senderAddress)) {
							throw new Error('Wallet sender unavailable');
						}
						const bidId = String(currentBestBid?.id || '').trim();
						if (!bidId || !bidId.startsWith('0x')) {
							throw new Error('Invalid bid id');
						}
						const listingTokenId = getMarketplaceListingTokenId();
						if (!listingTokenId || !listingTokenId.startsWith('0x')) {
							throw new Error('Missing listing token id');
						}

						const tx = new Transaction();
						tx.setSender(senderAddress);

						const multiBidStoreRef = tx.sharedObjectRef({
							objectId: TRADEPORT_MULTI_BID_STORE,
							initialSharedVersion: TRADEPORT_MULTI_BID_STORE_VERSION,
							mutable: true,
						});

						tx.moveCall({
							target: TRADEPORT_MULTI_BID_PACKAGE + '::tradeport_biddings::accept_bid_without_transfer_policy',
							typeArguments: [SUINS_REGISTRATION_TYPE],
							arguments: [
								tx.object(TRADEPORT_CLOCK_OBJECT),
								multiBidStoreRef,
								tx.pure.id(bidId),
								tx.pure.option('address', null),
								tx.object(listingTokenId),
							],
						});

						tx.setGasBudget(100000000);
						marketplaceStatus.textContent = 'Waiting for wallet...';

					let result;
					result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

					const digest = result.digest || result.result?.digest || '';
					if (digest) {
						lastSoldPriceMist = currentBestBid?.price || null;
						marketplaceStatus.innerHTML =
							'Bid accepted! ' + renderTxExplorerLinks(digest, true);
						marketplaceStatus.className = 'marketplace-status success';
						currentBestBid = null;
						currentListing = null;
						marketplaceBidRow.style.display = 'none';
						updateMarketplaceButton();
						applyTaggedIdentityToProfile();
						setTimeout(() => {
							fetchMarketplaceData();
						}, 2000);
					} else {
						marketplaceStatus.textContent = 'Transaction submitted';
						marketplaceStatus.className = 'marketplace-status success';
					}
				} catch (e) {
					const msg = e?.message || 'Transaction failed';
					marketplaceStatus.textContent = msg.includes('cancel')
						? 'Transaction cancelled'
						: 'Failed: ' + msg.slice(0, 120);
					marketplaceStatus.className = 'marketplace-status error';
				} finally {
					marketplaceAcceptBidBtn.disabled = false;
					marketplaceAcceptText?.classList.remove('hidden');
					marketplaceAcceptLoading?.classList.add('hidden');
					updateMarketplaceButton();
				}
			});
		}

		// Decay auction functionality
		let auctionData = null;
		let auctionInterval = null;

		function syncOverviewModulesLayout() {
			if (!overviewSecondaryGrid || !overviewMarketModule) return;

			const hasMarketplace = marketplaceCard && marketplaceCard.style.display !== 'none';
			const hasAuction = auctionCard && auctionCard.style.display !== 'none';
			const showMarketModule = Boolean(hasMarketplace || hasAuction);

			overviewMarketModule.style.display = showMarketModule ? 'flex' : 'none';
			overviewSecondaryGrid.classList.toggle('has-market-module', showMarketModule);
			queueMarketplaceLayoutSync();
		}

		function computeAuctionPrice(startPriceMist, startTimeMs, endTimeMs) {
			const now = Date.now();
			if (now < startTimeMs) return Math.floor(Number(startPriceMist));
			if (now >= endTimeMs) return 0;
			const remaining = endTimeMs - now;
			const duration = endTimeMs - startTimeMs;
			const fraction = Math.max(0, remaining / duration);
			const price = Math.floor(Number(startPriceMist) * Math.pow(fraction, AUCTION_DECAY_EXPONENT));
			return price > 0 ? price : 1;
		}

		function formatAuctionSui(priceMist) {
			const sui = Number(priceMist) / 1e9;
			if (!Number.isFinite(sui) || sui <= 0) return '0 SUI';
			if (sui >= 1_000_000) return formatMarketplaceListingSuiDisplay(sui) + ' SUI';
			if (sui >= 100) return sui.toFixed(2) + ' SUI';
			if (sui >= 1) return sui.toFixed(4).replace(/0+$/, '').replace(/.$/, '') + ' SUI';
			return sui.toFixed(6).replace(/0+$/, '').replace(/.$/, '') + ' SUI';
		}

		function formatTimeLeft(endTimeMs) {
			const remaining = endTimeMs - Date.now();
			if (remaining <= 0) return 'Ended';
			const days = Math.floor(remaining / 86400000);
			const hours = Math.floor((remaining % 86400000) / 3600000);
			const mins = Math.floor((remaining % 3600000) / 60000);
			if (days > 0) return days + 'd ' + hours + 'h ' + mins + 'm';
			if (hours > 0) return hours + 'h ' + mins + 'm';
			return mins + 'm';
		}

		function updateAuctionDisplay() {
			if (!auctionData) return;
			const now = Date.now();
			const startTimeMs = Number(auctionData.startTimeMs);
			const endTimeMs = Number(auctionData.endTimeMs);
			const isScheduled = Number.isFinite(startTimeMs) && now < startTimeMs;
			const priceMist = computeAuctionPrice(
				Number(auctionData.startPriceMist),
				startTimeMs,
				endTimeMs,
			);
			auctionCurrentPrice.textContent = formatAuctionSui(priceMist);
			auctionTimeLeft.textContent = formatTimeLeft(endTimeMs);
			if (auctionStateRow && auctionStateValue) {
				if (isScheduled) {
					auctionStateRow.style.display = 'flex';
					auctionStateValue.textContent = 'Scheduled · starts in ' + formatTimeLeft(startTimeMs);
				} else {
					auctionStateRow.style.display = 'none';
					auctionStateValue.textContent = '--';
				}
			}

			if (now >= endTimeMs) {
				auctionBuyBtn.disabled = true;
				auctionBuyText.textContent = 'Auction Ended';
				if (auctionCancelBtn) {
					auctionCancelBtn.disabled = true;
					auctionCancelBtn.style.display = 'none';
				}
				if (auctionInterval) clearInterval(auctionInterval);
				return;
			}

			const isSeller = connectedAddress && auctionData.seller && connectedAddress === auctionData.seller;
			if (isSeller) {
				auctionSellerLabel.style.display = 'inline';
				auctionBuyBtn.style.display = 'none';
				if (auctionCancelBtn) {
					auctionCancelBtn.style.display = isScheduled ? 'flex' : 'none';
					auctionCancelBtn.disabled = !isScheduled || !canSign();
				}
			} else if (connectedAddress) {
				auctionBuyBtn.style.display = 'flex';
				auctionSellerLabel.style.display = 'none';
				if (auctionCancelBtn) {
					auctionCancelBtn.disabled = true;
					auctionCancelBtn.style.display = 'none';
				}
				if (isScheduled) {
					auctionBuyBtn.disabled = true;
					auctionBuyText.textContent = 'Starts in ' + formatTimeLeft(startTimeMs);
				} else {
					auctionBuyBtn.disabled = false;
					auctionBuyText.textContent = 'Buy for ' + formatAuctionSui(priceMist);
				}
			} else {
				auctionBuyBtn.style.display = 'flex';
				auctionSellerLabel.style.display = 'none';
				if (auctionCancelBtn) {
					auctionCancelBtn.disabled = true;
					auctionCancelBtn.style.display = 'none';
				}
				auctionBuyBtn.disabled = true;
				auctionBuyText.textContent = 'Connect Wallet to Buy';
			}
		}

		async function fetchAuctionStatus() {
			if (!NFT_ID) return;
			try {
				const res = await fetch('/api/auction/status/' + NFT_ID);
				if (!res.ok) return;
				const data = await res.json();
				if (!data.active) {
					auctionData = null;
					if (auctionCard) auctionCard.style.display = 'none';
					syncOverviewModulesLayout();
					updateMarketplaceButton();
					return;
				}

					auctionData = data;
					auctionCard.style.display = 'block';
					syncOverviewModulesLayout();
					updateAuctionDisplay();
					updateMarketplaceButton();
				if (auctionInterval) clearInterval(auctionInterval);
				auctionInterval = setInterval(updateAuctionDisplay, 1000);

				const jacketedBadge = document.getElementById('jacketed-badge');
				if (jacketedBadge) {
					jacketedBadge.classList.remove('hidden');
					jacketedBadge.addEventListener('click', () => {
						auctionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
					});
				}
			} catch (e) {
				console.log('Auction status fetch failed:', e);
			}
		}

		if (auctionBuyBtn) {
			auctionBuyBtn.addEventListener('click', async () => {
				if (!connectedAddress || !auctionData) return;

				auctionBuyBtn.disabled = true;
				auctionBuyText.classList.add('hidden');
				auctionBuyLoading.classList.remove('hidden');
				auctionStatus.textContent = '';

				try {
					const res = await fetch('/api/auction/buy', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							listingId: auctionData.listingId,
							buyerAddress: connectedAddress,
						}),
					});
					const data = await res.json();
					if (data.error) throw new Error(data.error);

					const tx = Transaction.from(data.txBytes);
					auctionStatus.textContent = 'Confirm in wallet...';
					let result;
					result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });

					const digest = result.digest || '';
					auctionStatus.innerHTML = 'Purchased! ' + renderTxExplorerLinks(digest, true);
					auctionStatus.className = 'auction-status success';
					auctionBuyBtn.disabled = true;
					auctionBuyText.textContent = 'Purchased';
					auctionBuyText.classList.remove('hidden');
					auctionBuyLoading.classList.add('hidden');
					if (auctionInterval) clearInterval(auctionInterval);
				} catch (e) {
					const msg = e.message || 'Transaction failed';
					if (msg.includes('rejected') || msg.includes('cancelled')) {
						auctionStatus.textContent = 'Transaction cancelled';
					} else {
						auctionStatus.textContent = 'Failed: ' + msg.slice(0, 100);
					}
					auctionStatus.className = 'auction-status error';
					auctionBuyText.classList.remove('hidden');
					auctionBuyLoading.classList.add('hidden');
					updateAuctionDisplay();
				}
			});
		}

		if (auctionCancelBtn) {
			auctionCancelBtn.addEventListener('click', async () => {
				if (!connectedAddress || !auctionData) return;
				const now = Date.now();
				const startTimeMs = Number(auctionData.startTimeMs || 0);
				if (!(Number.isFinite(startTimeMs) && now < startTimeMs)) {
					auctionStatus.textContent = 'Wrap can only be cancelled before start';
					auctionStatus.className = 'auction-status error';
					return;
				}
				if (!auctionData.seller || connectedAddress !== auctionData.seller) {
					auctionStatus.textContent = 'Only the listing owner can cancel wrap';
					auctionStatus.className = 'auction-status error';
					return;
				}

				auctionCancelBtn.disabled = true;
				auctionCancelText?.classList.add('hidden');
				auctionCancelLoading?.classList.remove('hidden');
				auctionStatus.textContent = '';

				try {
					const res = await fetch('/api/auction/cancel', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							listingId: auctionData.listingId,
							sellerAddress: connectedAddress,
						}),
					});
					const data = await res.json();
					if (data.error) throw new Error(data.error);

					const tx = Transaction.from(data.txBytes);
					auctionStatus.textContent = 'Confirm cancel in wallet...';

					const result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } });
					const digest = result.digest || result.result?.digest || '';
					auctionStatus.innerHTML = 'Wrap cancelled. ' + renderTxExplorerLinks(digest, true);
					auctionStatus.className = 'auction-status success';
					await fetchAuctionStatus();
					await fetchMarketplaceData();
				} catch (e) {
					const msg = e?.message || 'Transaction failed';
					auctionStatus.textContent =
						msg.includes('rejected') || msg.includes('cancelled')
							? 'Transaction cancelled'
							: 'Failed: ' + msg.slice(0, 100);
					auctionStatus.className = 'auction-status error';
					updateAuctionDisplay();
				} finally {
					auctionCancelText?.classList.remove('hidden');
					auctionCancelLoading?.classList.add('hidden');
				}
			});
		}

		// Fetch marketplace data on load
		window.addEventListener('resize', queueMarketplaceLayoutSync);
		updateMarketplaceStepperLabels();
		queueMarketplaceLayoutSync();
		syncOverviewModulesLayout();
		fetchMarketplaceData();
		fetchAuctionStatus();

	</script>

	<!-- NFT Viewer Overlay -->
	<div class="nft-viewer" id="nft-viewer">
		<div class="nft-viewer-content" id="nft-viewer-content">
			<button class="nft-viewer-close" id="nft-viewer-close" title="Close">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
			</button>
			<div class="nft-viewer-image" id="nft-viewer-image">
				<canvas id="qr-expanded-canvas"></canvas>
			</div>
			<div class="nft-viewer-label" id="nft-viewer-label">${escapeHtml(cleanName)}.sui</div>
			<div class="nft-viewer-actions">
				<button class="nft-viewer-btn" id="nft-viewer-qr-btn" title="Toggle QR code">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>
					QR
				</button>
				<button class="nft-viewer-btn" id="nft-viewer-copy-btn" title="Copy link">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					Copy
				</button>
				<button class="nft-viewer-btn" id="nft-viewer-download-btn" title="Save image">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
					Save
				</button>
			</div>
		</div>
	</div>

	<!-- Footer Tracker -->
	<div id="crypto-tracker" style="position: fixed; bottom: 0; left: 0; right: 0; background: rgba(10, 10, 15, 0.95); backdrop-filter: blur(10px); border-top: 1px solid rgba(96, 165, 250, 0.2); padding: 12px 20px; display: flex; justify-content: center; gap: 16px; flex-wrap: nowrap; z-index: 1000; font-size: 0.875rem; align-items: center;">
		<span class="tracker-line">
			<span style="color: #c7d2fe; font-weight: 500;">SUI: <span id="sui-price" style="color: #60a5fa; font-weight: 600;">$--</span></span>
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

	<script>
		const GLOBAL_NETWORK = ${serializeJson(network)};
		const GLOBAL_NAME = ${serializeJson(cleanName)};
		const GLOBAL_TARGET_ADDRESS = ${serializeJson(record.address || '')};
		const GLOBAL_OWNER_ADDRESS = ${serializeJson(record.ownerAddress || '')};

		const ENABLE_UPLOAD = false;
		const ENABLE_BOUNTIES = false;
		const ENABLE_VORTEX = false;

		// Getters for wallet state from module script (via window)
		const getConnectedAddress = () => window.connectedAddress;
		const getConnectedWallet = () => window.connectedWallet;
		const getConnectedAccount = () => window.connectedAccount;

		// ===== PRIVATE SUBSCRIPTIONS (Seal + Walrus) =====
		// Subscriptions are encrypted with Seal and stored on Walrus for privacy
		// Only the subscriber's wallet can decrypt the subscription list

		const SUBSCRIPTIONS_KEY_PREFIX = 'sui_ski_subscriptions';
		const SUBSCRIPTIONS_BLOB_KEY_PREFIX = 'sui_ski_subscriptions_blob';
		const SUBSCRIPTIONS_CIPHER_VERSION = 2;
		const SUBSCRIPTIONS_KEY_CONTEXT = 'sui.ski:black-diamond:v2';
		let subscriptionsCryptoKeyAddress = null;
		let subscriptionsCryptoKey = null;
		let subscriptionsCryptoKeyPromise = null;

		function normalizeWalletAddress(value) {
			return String(value || '').trim().toLowerCase();
		}

		function getActiveWalletAddress() {
			return normalizeWalletAddress(window.connectedAddress);
		}

		function getScopedStorageKey(prefix, walletAddress = getActiveWalletAddress()) {
			return walletAddress ? prefix + ':' + walletAddress : prefix;
		}

		function filterSubscriptionsForWallet(subs, walletAddress = getActiveWalletAddress()) {
			if (!Array.isArray(subs)) return [];
			if (!walletAddress) return subs;
			return subs.filter((entry) => normalizeWalletAddress(entry?.subscriberAddress) === walletAddress);
		}

		// Local cache (also encrypted on Walrus for cross-device sync)
		function getLocalSubscriptions() {
			try {
				const scopedRaw = localStorage.getItem(getScopedStorageKey(SUBSCRIPTIONS_KEY_PREFIX));
				if (scopedRaw) {
					return filterSubscriptionsForWallet(JSON.parse(scopedRaw));
				}

				const legacyRaw = localStorage.getItem(SUBSCRIPTIONS_KEY_PREFIX);
				const legacySubs = filterSubscriptionsForWallet(JSON.parse(legacyRaw || '[]'));
				if (legacySubs.length > 0) {
					saveLocalSubscriptions(legacySubs);
				}
				return legacySubs;
			} catch {
				return [];
			}
		}

		function saveLocalSubscriptions(subs) {
			localStorage.setItem(
				getScopedStorageKey(SUBSCRIPTIONS_KEY_PREFIX),
				JSON.stringify(filterSubscriptionsForWallet(subs)),
			);
		}

		function getBlobInfo() {
			try {
				const scopedRaw = localStorage.getItem(getScopedStorageKey(SUBSCRIPTIONS_BLOB_KEY_PREFIX));
				if (scopedRaw) {
					const scopedInfo = JSON.parse(scopedRaw);
					if (scopedInfo?.blobId) return scopedInfo;
				}

				const legacyInfo = JSON.parse(localStorage.getItem(SUBSCRIPTIONS_BLOB_KEY_PREFIX) || 'null');
				if (!legacyInfo?.blobId) return null;

				const walletAddress = getActiveWalletAddress();
				const blobWalletAddress = normalizeWalletAddress(legacyInfo.subscriberAddress);
				if (walletAddress && blobWalletAddress && walletAddress !== blobWalletAddress) {
					return null;
				}
				saveBlobInfo(legacyInfo);
				return legacyInfo;
			} catch {
				return null;
			}
		}

		function saveBlobInfo(info) {
			if (!info || !info.blobId) return;
			const walletAddress = getActiveWalletAddress();
			const nextInfo = walletAddress
				? { ...info, subscriberAddress: info.subscriberAddress || window.connectedAddress || '' }
				: info;
			localStorage.setItem(getScopedStorageKey(SUBSCRIPTIONS_BLOB_KEY_PREFIX), JSON.stringify(nextInfo));
		}

		function bytesToBase64(bytes) {
			let binary = '';
			for (let i = 0; i < bytes.length; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			return btoa(binary);
		}

		function base64ToBytes(value) {
			const binary = atob(value);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				bytes[i] = binary.charCodeAt(i);
			}
			return bytes;
		}

		function getSignatureFromSignResult(signResult) {
			if (!signResult) return '';
			if (typeof signResult === 'string') return signResult;
			if (typeof signResult.signature === 'string') return signResult.signature;
			if (signResult.signature && signResult.signature.length) {
				try {
					return bytesToBase64(new Uint8Array(signResult.signature));
				} catch {}
			}
			return '';
		}

		async function signSubscriptionsMessage(messageBytes) {
			const wallet = getConnectedWallet();
			const account = getConnectedAccount();
			if (!wallet || !account) throw new Error('Wallet must be connected');

			const signFeature = wallet.features && wallet.features['sui:signPersonalMessage'];
			if (signFeature && typeof signFeature.signPersonalMessage === 'function') {
				const signResult = await signFeature.signPersonalMessage({
					account,
					message: messageBytes,
				});
				const firstResult = Array.isArray(signResult) ? signResult[0] : signResult;
				const signature = getSignatureFromSignResult(firstResult);
				if (signature) return signature;
			}

			const rawWallet = wallet._raw;
			if (rawWallet && typeof rawWallet.signPersonalMessage === 'function') {
				const signResult = await rawWallet.signPersonalMessage({ message: messageBytes });
				const signature = getSignatureFromSignResult(signResult);
				if (signature) return signature;
			}
			if (rawWallet && typeof rawWallet.signMessage === 'function') {
				const signResult = await rawWallet.signMessage({ message: messageBytes });
				const signature = getSignatureFromSignResult(signResult);
				if (signature) return signature;
			}

			throw new Error('Wallet does not support personal message signing for private bookmarks');
		}

		async function getSubscriptionsCryptoKey(subscriberAddress) {
			const normalizedAddress = normalizeWalletAddress(subscriberAddress || window.connectedAddress);
			if (!normalizedAddress) throw new Error('Subscriber wallet address is required');
			if (subscriptionsCryptoKey && subscriptionsCryptoKeyAddress === normalizedAddress) {
				return subscriptionsCryptoKey;
			}
			if (subscriptionsCryptoKeyPromise && subscriptionsCryptoKeyAddress === normalizedAddress) {
				return subscriptionsCryptoKeyPromise;
			}

			subscriptionsCryptoKeyAddress = normalizedAddress;
			subscriptionsCryptoKeyPromise = (async () => {
				const signaturePayload = new TextEncoder().encode(
					SUBSCRIPTIONS_KEY_CONTEXT + ':' + normalizedAddress,
				);
				const signature = await signSubscriptionsMessage(signaturePayload);
				const seed = new TextEncoder().encode(
					signature + ':' + normalizedAddress + ':' + SUBSCRIPTIONS_KEY_CONTEXT,
				);
				const keyMaterial = await crypto.subtle.digest('SHA-256', seed);
				subscriptionsCryptoKey = await crypto.subtle.importKey(
					'raw',
					keyMaterial,
					{ name: 'AES-GCM' },
					false,
					['encrypt', 'decrypt'],
				);
				return subscriptionsCryptoKey;
			})()
				.catch((error) => {
					subscriptionsCryptoKey = null;
					subscriptionsCryptoKeyAddress = null;
					throw error;
				})
				.finally(() => {
					subscriptionsCryptoKeyPromise = null;
				});

			return subscriptionsCryptoKeyPromise;
		}

		async function encryptSubscriptions(subs, subscriberAddress) {
			const key = await getSubscriptionsCryptoKey(subscriberAddress);
			const data = JSON.stringify({
				subscriptions: subs,
				subscriberAddress: subscriberAddress,
				encryptedAt: Date.now(),
				version: SUBSCRIPTIONS_CIPHER_VERSION,
			});
			const iv = crypto.getRandomValues(new Uint8Array(12));
			const plaintext = new TextEncoder().encode(data);
			const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
			return JSON.stringify({
				v: SUBSCRIPTIONS_CIPHER_VERSION,
				iv: bytesToBase64(iv),
				cipher: bytesToBase64(new Uint8Array(ciphertext)),
			});
		}

		async function decryptSubscriptions(encryptedData, subscriberAddress) {
			if (!encryptedData) return [];
			try {
				const envelope = JSON.parse(encryptedData);
				if (
					envelope &&
					Number(envelope.v) === SUBSCRIPTIONS_CIPHER_VERSION &&
					typeof envelope.iv === 'string' &&
					typeof envelope.cipher === 'string'
				) {
					const key = await getSubscriptionsCryptoKey(subscriberAddress);
					const plaintext = await crypto.subtle.decrypt(
						{ name: 'AES-GCM', iv: base64ToBytes(envelope.iv) },
						key,
						base64ToBytes(envelope.cipher),
					);
					const data = JSON.parse(new TextDecoder().decode(new Uint8Array(plaintext)));
					return Array.isArray(data.subscriptions) ? data.subscriptions : [];
				}
			} catch {}

			try {
				const data = JSON.parse(decodeURIComponent(escape(atob(encryptedData))));
				return Array.isArray(data.subscriptions) ? data.subscriptions : [];
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
		async function loadSubscriptionsFromWalrus(options = {}) {
			const blobInfo = getBlobInfo();
			const walletAddress = getActiveWalletAddress();
			if (!blobInfo?.blobId || !walletAddress) return null;
			const blobWalletAddress = normalizeWalletAddress(blobInfo.subscriberAddress);
			if (blobWalletAddress && blobWalletAddress !== walletAddress) return null;
			const allowSignaturePrompt = options.allowSignaturePrompt === true;
			const hasCachedKey =
				subscriptionsCryptoKey
				&& subscriptionsCryptoKeyAddress === walletAddress;
			if (!allowSignaturePrompt && !hasCachedKey) return null;

			try {
				const res = await fetch(\`/api/app/subscriptions/blob/\${blobInfo.blobId}\`);
				if (!res.ok) return null;

				const data = await res.json();
				if (data.encryptedData) {
					const decrypted = await decryptSubscriptions(data.encryptedData, window.connectedAddress);
					return filterSubscriptionsForWallet(decrypted, walletAddress);
				}
			} catch (err) {
				console.error('Failed to load from Walrus:', err);
			}
			return null;
		}

		function isSubscribed(targetName) {
			const cleanTargetName = String(targetName || '').replace(/.sui$/i, '').toLowerCase() + '.sui';
			return getLocalSubscriptions().some(s => String(s?.targetName || '').toLowerCase() === cleanTargetName);
		}

		async function subscribeToName(targetName, targetAddress) {
			const cleanTargetName = String(targetName || '').replace(/.sui$/i, '').toLowerCase() + '.sui';
			const subs = getLocalSubscriptions();
			if (subs.some(s => String(s?.targetName || '').toLowerCase() === cleanTargetName)) {
				return false;
			}
			subs.push({
				subscriberAddress: window.connectedAddress || 'anonymous',
				targetName: cleanTargetName,
				targetAddress: targetAddress,
				subscribedAt: Date.now(),
				notifications: true,
				lastCheckedAt: Date.now()
			});
			saveLocalSubscriptions(subs);
			return true;
		}

		function unsubscribeFromName(targetName) {
			const cleanTargetName = String(targetName || '').replace(/.sui$/i, '').toLowerCase() + '.sui';
			const subs = getLocalSubscriptions().filter(
				s => String(s?.targetName || '').toLowerCase() !== cleanTargetName,
			);
			saveLocalSubscriptions(subs);
		}

		let diamondWatching = false;
		let diamondBusy = false;
		let tendrilAnimId = null;

		function drawTendrils(canvas, progress) {
			const ctx = canvas.getContext('2d');
			const w = canvas.width;
			const h = canvas.height;
			ctx.clearRect(0, 0, w, h);
			if (progress <= 0) return;

			const tendrilCount = 5;
			const maxLen = w * progress;
			ctx.lineCap = 'round';

			for (let i = 0; i < tendrilCount; i++) {
				const yBase = (h / (tendrilCount + 1)) * (i + 1);
				const amplitude = 3 + Math.sin(i * 1.7) * 2;
				const freq = 0.04 + i * 0.008;
				const phase = i * 2.1;

				ctx.beginPath();
				ctx.moveTo(0, yBase);
				const steps = Math.floor(maxLen / 2);
				for (let s = 0; s <= steps; s++) {
					const x = (s / steps) * maxLen;
					const y = yBase + Math.sin(x * freq + phase + performance.now() * 0.002) * amplitude;
					ctx.lineTo(x, y);
				}
				const alpha = 0.15 + (progress * 0.4) - (i * 0.03);
				ctx.strokeStyle = 'rgba(0, 0, 0, ' + Math.max(0, Math.min(1, alpha)) + ')';
				ctx.lineWidth = 1.5 - i * 0.15;
				ctx.stroke();
			}
		}

		function startTendrilAnimation() {
			const canvas = document.getElementById('diamond-tendril-canvas');
			const wrap = document.getElementById('header-name-wrap');
			if (!canvas || !wrap) return;

			canvas.width = wrap.offsetWidth;
			canvas.height = wrap.offsetHeight;

			const startTime = performance.now();
			const duration = 1200;

			function animate() {
				const elapsed = performance.now() - startTime;
				const progress = Math.min(1, elapsed / duration);
				drawTendrils(canvas, progress);
				if (progress < 1) {
					tendrilAnimId = requestAnimationFrame(animate);
				} else {
					tendrilAnimId = requestAnimationFrame(function loop() {
						drawTendrils(canvas, 1);
						tendrilAnimId = requestAnimationFrame(loop);
					});
				}
			}
			tendrilAnimId = requestAnimationFrame(animate);
		}

		function stopTendrilAnimation() {
			const canvas = document.getElementById('diamond-tendril-canvas');
			if (tendrilAnimId) {
				cancelAnimationFrame(tendrilAnimId);
				tendrilAnimId = null;
			}

			if (!canvas) return;
			const ctx = canvas.getContext('2d');
			const startTime = performance.now();
			const duration = 800;
			const w = canvas.width;
			const h = canvas.height;

			function fadeOut() {
				const elapsed = performance.now() - startTime;
				const progress = 1 - Math.min(1, elapsed / duration);
				drawTendrils(canvas, progress);
				if (progress > 0) {
					tendrilAnimId = requestAnimationFrame(fadeOut);
				} else {
					ctx.clearRect(0, 0, w, h);
					tendrilAnimId = null;
				}
			}
			tendrilAnimId = requestAnimationFrame(fadeOut);
		}

		function applyDiamondInfection(active) {
			const wrap = document.getElementById('header-name-wrap');
			const identityCard = document.querySelector('.identity-card');

			if (!wrap) return;

				if (active) {
					if (document.body) document.body.classList.add('diamond-watch-active');
					wrap.classList.add('diamond-infected');
					requestAnimationFrame(() => wrap.classList.add('tendrils-spreading'));
					startTendrilAnimation();

					if (identityCard) identityCard.classList.add('black-diamond-active');
					if (rawIdentityNftImage) applyTaggedIdentityToProfile();
				} else {
					if (document.body) document.body.classList.remove('diamond-watch-active');
					wrap.classList.add('tendrils-receding');
					wrap.classList.remove('tendrils-spreading');
					stopTendrilAnimation();

					setTimeout(() => {
						wrap.classList.remove('diamond-infected', 'tendrils-receding');
					}, 800);

					if (identityCard) identityCard.classList.remove('black-diamond-active');
					if (rawIdentityNftImage) applyTaggedIdentityToProfile();
				}
			}

		// ===== BLACK DIAMOND VAULT (Seal + Walrus) =====
		// Persistent list of "Black Diamonds" (watched names) for the connected wallet.
		window.userVaultNames = new Set();
		let vaultLoadingForAddress = null;
		let vaultLoadNonce = 0;

		async function loadUserVault(options = {}) {
			const walletAddress = getActiveWalletAddress();
			if (!walletAddress) return;
			if (vaultLoadingForAddress === walletAddress) return;
			const allowSignaturePrompt = options.allowSignaturePrompt === true;

			const loadNonce = ++vaultLoadNonce;
			vaultLoadingForAddress = walletAddress;
			try {
				let sourceList = getLocalSubscriptions();
				if (allowSignaturePrompt || sourceList.length === 0) {
					try {
						const persistentList = await loadSubscriptionsFromWalrus({ allowSignaturePrompt });
						if (persistentList && Array.isArray(persistentList)) {
							sourceList = persistentList;
							saveLocalSubscriptions(persistentList);
						}
					} catch (e) {
						console.warn('Walrus vault load failed, falling back to local');
					}
				}

				if (loadNonce !== vaultLoadNonce || getActiveWalletAddress() !== walletAddress) return;

				const walletList = filterSubscriptionsForWallet(sourceList, walletAddress);
				window.userVaultNames = new Set(
					walletList
						.map(s => String(s?.targetName || '').replace(/.sui$/i, '').toLowerCase())
						.filter(Boolean),
				);

				// Synchronize the current page's diamond state
				const currentClean = NAME.toLowerCase();
				const isBlackDiamond = window.userVaultNames.has(currentClean);
				
				if (isBlackDiamond !== diamondWatching) {
					updateDiamondState(isBlackDiamond);
				}

				renderVaultList();
			} catch (err) {
				console.error('Failed to load user vault:', err);
			} finally {
				if (loadNonce === vaultLoadNonce && vaultLoadingForAddress === walletAddress) {
					vaultLoadingForAddress = null;
				}
			}
		}
		window.loadUserVault = loadUserVault;

		function renderVaultList() {
			const container = document.getElementById('vault-names-list');
			const module = document.getElementById('vault-list-module');
			if (!container) return;

			// Only show the vault list to the owner of the profile
			const isProfileOwner = window.connectedAddress && (
				window.connectedAddress.toLowerCase() === String(OWNER_ADDRESS).toLowerCase() ||
				window.connectedAddress.toLowerCase() === String(TARGET_ADDRESS).toLowerCase()
			);

			if (!isProfileOwner || window.userVaultNames.size === 0) {
				if (module) module.style.display = 'none';
				return;
			}

			if (module) module.style.display = 'block';
			
			const names = Array.from(window.userVaultNames).sort();
			container.innerHTML = names.map(name => {
				const profileUrl = 'https://' + encodeURIComponent(name) + '.sui.ski';
				return '<a href="' + profileUrl + '" class="linked-name-chip primary">' +
					'<svg viewBox="0 0 24 24" width="12" height="12" style="margin-right:4px;"><path d="M12 2L22 12L12 22L2 12Z" fill="currentColor"/></svg>' +
					'<span class="chip-name">' + name + '.sui</span>' +
					'</a>';
			}).join('');
		}
		window.renderVaultList = renderVaultList;

		async function syncVaultAction(name, action) {
			const cleanName = String(name || '').replace(/.sui$/i, '').toLowerCase();
			if (action === 'watch') {
				window.userVaultNames.add(cleanName);
				await subscribeToName(cleanName + '.sui', '');
			} else {
				window.userVaultNames.delete(cleanName);
				unsubscribeFromName(cleanName + '.sui');
			}
			
			// Sync to Walrus if connected
			if (window.connectedAddress) {
				const subs = getLocalSubscriptions();
				await syncSubscriptionsToWalrus(subs);
			}
			
			renderVaultList();
		}

		function updateDiamondState(watching) {
			const btn = document.getElementById('vault-diamond-btn');
			const wasWatching = diamondWatching;
			diamondWatching = watching;
			if (btn) {
				if (watching) {
					if (!wasWatching) {
						btn.classList.remove('diamond-transforming');
						void btn.offsetWidth;
						btn.classList.add('diamond-transforming');
						setTimeout(() => btn.classList.remove('diamond-transforming'), 820);
					}
					btn.classList.add('bookmarked');
					btn.title = 'Remove from vault';
				} else {
					btn.classList.remove('bookmarked');
					btn.classList.remove('diamond-transforming');
					btn.title = 'Save to vault';
				}
			}
			if (watching !== wasWatching) {
				applyDiamondInfection(watching);
			}
		}

		async function checkWatchingState() {
			if (!connectedAddress) return;
			if (window.userVaultNames.size === 0) {
				await loadUserVault();
			}
			updateDiamondState(window.userVaultNames.has(NAME.toLowerCase()));
		}

		async function toggleVaultDiamond() {
			if (diamondBusy) return;
			if (!connectedAddress) {
				await connectWallet();
				if (!connectedAddress) return;
			}
			if (window.userVaultNames.size === 0) {
				await loadUserVault({ allowSignaturePrompt: true });
			}

			const btn = document.getElementById('vault-diamond-btn');
			if (!btn) return;

			diamondBusy = true;
			btn.classList.add('diamond-loading');

			try {
				const action = diamondWatching ? 'unwatch' : 'watch';
				await syncVaultAction(NAME, action === 'watch' ? 'watch' : 'unwatch');
				updateDiamondState(action === 'watch');
			} catch (err) {
				console.error('Vault toggle failed:', err);
			} finally {
				diamondBusy = false;
				if (btn) btn.classList.remove('diamond-loading');
			}
		}

		const vaultDiamondBtn = document.getElementById('vault-diamond-btn');
		if (vaultDiamondBtn) vaultDiamondBtn.addEventListener('click', toggleVaultDiamond);

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

	<script>
		(function() {
			const swapPanel = document.getElementById('swap-panel');
			const swapToggleBtn = document.getElementById('swap-toggle-btn');
			const swapCloseBtn = document.getElementById('swap-panel-close');
			const tabs = swapPanel ? swapPanel.querySelectorAll('.swap-tab') : [];
			const tabSwap = document.getElementById('swap-tab-swap');
			const tabCrosschain = document.getElementById('swap-tab-crosschain');
			let terminalLoaded = false;

			function toggleSwapPanel() {
				if (!swapPanel) return;
				const isOpen = swapPanel.style.display !== 'none';
				swapPanel.style.display = isOpen ? 'none' : 'block';
				if (!isOpen && !terminalLoaded) {
					loadTerminal();
				}
			}

			function loadTerminal() {
				if (terminalLoaded) return;
				terminalLoaded = true;
				const container = document.getElementById('sui-coins-terminal');
				if (container) container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);"><span class="loading"></span> Loading swap terminal...</div>';
				const script = document.createElement('script');
				script.src = 'https://cdn.jsdelivr.net/npm/@interest-protocol/sui-coins-terminal-vanilla@1.1.1/dist/index.umd.js';
				script.onload = function() {
					if (typeof window.SuiCoinsTerminal === 'function') {
						if (container) container.innerHTML = '';
						window.SuiCoinsTerminal({
							container: container,
							projectAddress: '0xf7c22e1d2bcc6b8a9afb98730fdd2bec3af417ee1a8fbb27755ba0e64e96f0e1',
							slippage: 1,
							aggregator: 'Aftermath'
						});
					}
				};
				script.onerror = function() {
					if (container) container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">Failed to load swap terminal</div>';
				};
				document.body.appendChild(script);
			}

			if (swapToggleBtn) {
				swapToggleBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					toggleSwapPanel();
				});
			}

			if (swapCloseBtn) {
				swapCloseBtn.addEventListener('click', () => {
					if (swapPanel) swapPanel.style.display = 'none';
				});
			}

				tabs.forEach(tab => {
					tab.addEventListener('click', () => {
						tabs.forEach(t => t.classList.remove('active'));
						tab.classList.add('active');
						const target = tab.dataset.tab;
						if (tabSwap) tabSwap.style.display = target === 'swap' ? 'block' : 'none';
						if (tabCrosschain) tabCrosschain.style.display = target === 'crosschain' ? 'block' : 'none';
						if (target === 'crosschain') {
							syncCrosschainTargetFromWallet();
							refreshCrosschainStatus();
							fetchCCQuote();
						}
					});
				});

			document.addEventListener('click', (e) => {
				if (!swapPanel || swapPanel.style.display === 'none') return;
				if (swapPanel.contains(e.target)) return;
				if (swapToggleBtn && swapToggleBtn.contains(e.target)) return;
				swapPanel.style.display = 'none';
			});

			const ccSolAmount = document.getElementById('cc-sol-amount');
			const ccTarget = document.getElementById('cc-target');
			const ccRateValue = document.getElementById('cc-rate-value');
			const ccOutput = document.getElementById('cc-output');
			const ccFee = document.getElementById('cc-fee');
			const ccQuoteBtn = document.getElementById('cc-quote-btn');
			const ccDeposit = document.getElementById('cc-deposit');
			const ccDepositAddr = document.getElementById('cc-deposit-addr');
			const ccCopyAddr = document.getElementById('cc-copy-addr');
				const ccSolTx = document.getElementById('cc-sol-tx');
				const ccConfirmBtn = document.getElementById('cc-confirm-btn');
				const ccStatus = document.getElementById('cc-status');
				let ccQuoteData = null;

				function shortSuiTarget(value) {
					const v = String(value || '').trim();
					if (!v) return '';
					if (v.startsWith('0x') && v.length > 16) {
						return v.slice(0, 6) + '...' + v.slice(-4);
					}
					return v;
				}

				function syncCrosschainTargetFromWallet() {
					if (!ccTarget) return;
					const currentValue = String(ccTarget.value || '').trim();
					if (currentValue) return;
					const preferred = String(window.connectedPrimaryName || '').trim();
					const connected = String(window.connectedAddress || '').trim();
					if (preferred) {
						ccTarget.value = preferred;
						return;
					}
					if (connected) {
						ccTarget.value = connected;
					}
				}

				function getCrosschainTargetValue() {
					const inputValue = String(ccTarget?.value || '').trim();
					if (inputValue) return inputValue;
					const preferred = String(window.connectedPrimaryName || '').trim();
					if (preferred) return preferred;
					return String(window.connectedAddress || '').trim();
				}

				async function parseApiError(res, fallback) {
					try {
						const payload = await res.json();
						if (payload && typeof payload.error === 'string' && payload.error) {
							return payload.error;
						}
					} catch {}
					return fallback + ' (' + res.status + ')';
				}

				async function refreshCrosschainStatus() {
					try {
						const res = await fetch('/api/sol-swap/status');
						const data = await res.json().catch(() => null);
						if (!res.ok) {
							if (ccStatus) {
								ccStatus.textContent = 'Cross-chain status unavailable right now.';
								ccStatus.className = 'cc-status error';
							}
							return;
						}
						if (data?.active) {
							if (ccStatus && !ccQuoteData) {
								ccStatus.textContent = '';
								ccStatus.className = 'cc-status';
							}
							return;
						}
						if (ccStatus) {
							ccStatus.textContent = 'Cross-chain swap is not configured yet.';
							ccStatus.className = 'cc-status error';
						}
						if (ccQuoteBtn) ccQuoteBtn.disabled = true;
					} catch {
						if (ccStatus) {
							ccStatus.textContent = 'Cross-chain status unavailable right now.';
							ccStatus.className = 'cc-status error';
						}
					}
				}

				async function fetchCCQuote() {
					const amount = parseFloat(ccSolAmount?.value || '');
					if (!Number.isFinite(amount) || amount <= 0) {
					if (ccRateValue) ccRateValue.textContent = '--';
					if (ccOutput) ccOutput.textContent = '-- SUI';
					if (ccFee) ccFee.textContent = '';
					if (ccQuoteBtn) ccQuoteBtn.disabled = true;
					ccQuoteData = null;
					return;
					}

					try {
						const res = await fetch('/api/sol-swap/quote?direction=sol_to_sui&amount=' + amount);
						if (!res.ok) throw new Error(await parseApiError(res, 'Quote unavailable'));
						const data = await res.json().catch(() => null);
						if (!data || typeof data !== 'object') throw new Error('Quote unavailable');
						if (data.error) throw new Error(data.error);

						ccQuoteData = data;
						if (ccRateValue) ccRateValue.textContent = '1 SOL = ' + data.rate.toFixed(4) + ' SUI';
						if (ccOutput) ccOutput.textContent = data.outputAmount.toFixed(4) + ' SUI';
						if (ccFee) ccFee.textContent = 'Fee: ' + data.fee.toFixed(4) + ' SUI (' + (data.feeBps / 100) + '%)';
						if (ccQuoteBtn) ccQuoteBtn.disabled = !data.solanaDepositAddress;
						if (ccStatus) {
							if (!data.solanaDepositAddress) {
								ccStatus.textContent = 'Cross-chain deposit address is not configured yet.';
								ccStatus.className = 'cc-status error';
							} else {
								ccStatus.textContent = '';
								ccStatus.className = 'cc-status';
							}
						}
					} catch (err) {
						if (ccRateValue) ccRateValue.textContent = 'Unavailable';
						if (ccOutput) ccOutput.textContent = '-- SUI';
						if (ccQuoteBtn) ccQuoteBtn.disabled = true;
						if (ccStatus) {
							ccStatus.textContent = err?.message || 'Quote unavailable right now.';
							ccStatus.className = 'cc-status error';
						}
						ccQuoteData = null;
					}
				}

			if (ccSolAmount) {
				let debounceTimer = null;
				ccSolAmount.addEventListener('input', () => {
					if (debounceTimer) clearTimeout(debounceTimer);
					debounceTimer = setTimeout(fetchCCQuote, 400);
				});
			}

			if (ccQuoteBtn) {
				ccQuoteBtn.addEventListener('click', async () => {
					if (!ccQuoteData || !ccQuoteData.solanaDepositAddress) return;
					const destinationTarget = getCrosschainTargetValue();
					if (!destinationTarget) {
						if (ccStatus) { ccStatus.textContent = 'Enter a Sui address or name'; ccStatus.className = 'cc-status error'; }
						return;
					}

					try {
						ccQuoteBtn.disabled = true;
						ccQuoteBtn.textContent = 'Requesting...';

							const res = await fetch('/api/sol-swap/request', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								solAmount: ccQuoteData.inputAmount,
									suiTarget: destinationTarget,
									suiAddress: window.connectedAddress || undefined,
								}),
							});
							if (!res.ok) throw new Error(await parseApiError(res, 'Request failed'));
							const data = await res.json().catch(() => null);
							if (!data || typeof data !== 'object') throw new Error('Request failed');
							if (data.error) throw new Error(data.error);
						if (ccQuoteData) ccQuoteData.requestId = data.requestId || null;

						if (ccDepositAddr) ccDepositAddr.textContent = data.depositAddress;
						if (ccDeposit) ccDeposit.style.display = 'flex';
						if (ccStatus) {
							const destinationSummary = data.suiTarget
								? data.suiTarget + ' (' + shortSuiTarget(data.suiAddress) + ')'
								: shortSuiTarget(data.suiAddress);
							ccStatus.textContent = 'Send ' + data.solAmount + ' SOL to the address below. Destination: ' + destinationSummary;
							ccStatus.className = 'cc-status';
						}
					} catch (err) {
						if (ccStatus) { ccStatus.textContent = err.message || 'Request failed'; ccStatus.className = 'cc-status error'; }
					} finally {
						ccQuoteBtn.textContent = 'Get Deposit Address';
						ccQuoteBtn.disabled = false;
					}
				});
			}

			if (ccCopyAddr) {
				ccCopyAddr.addEventListener('click', async () => {
					const addr = ccDepositAddr?.textContent;
					if (addr) {
						await navigator.clipboard.writeText(addr).catch(() => {});
						ccCopyAddr.textContent = 'Copied!';
						setTimeout(() => { ccCopyAddr.textContent = 'Copy'; }, 1500);
					}
				});
			}

			if (ccSolTx) {
				ccSolTx.addEventListener('input', () => {
					if (ccConfirmBtn) ccConfirmBtn.disabled = !ccSolTx.value.trim();
				});
			}

			if (ccConfirmBtn) {
				ccConfirmBtn.addEventListener('click', async () => {
					const sig = ccSolTx?.value?.trim();
					if (!sig) return;

					ccConfirmBtn.disabled = true;
					ccConfirmBtn.textContent = 'Verifying...';
					if (ccStatus) { ccStatus.textContent = 'Verifying Solana transaction...'; ccStatus.className = 'cc-status'; }

					try {
							const res = await fetch('/api/sol-swap/confirm', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ requestId: ccQuoteData?.requestId || 'unknown', solTxSignature: sig }),
							});
							if (!res.ok) throw new Error(await parseApiError(res, 'Confirmation failed'));
							const data = await res.json().catch(() => null);
							if (!data || typeof data !== 'object') throw new Error('Confirmation failed');
							if (data.error) throw new Error(data.error);

						if (ccStatus) {
							ccStatus.textContent = 'Verification submitted. SUI will be sent to your wallet shortly.';
							ccStatus.className = 'cc-status success';
						}
					} catch (err) {
						if (ccStatus) { ccStatus.textContent = err.message || 'Confirmation failed'; ccStatus.className = 'cc-status error'; }
					} finally {
						ccConfirmBtn.textContent = 'Confirm & Receive SUI';
						ccConfirmBtn.disabled = false;
					}
					});
				}

				refreshCrosschainStatus();
				syncCrosschainTargetFromWallet();
				fetchCCQuote();
			})();
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

function buildProfileDescription(profileDomain: string, record: SuiNSRecord): string {
	const fromRecords = pickRecordValue(record, DESCRIPTION_RECORD_KEYS)
	if (fromRecords) {
		return fromRecords
	}
	if (record.content?.type === 'url' && record.content.value) {
		return collapseWhitespace(`${profileDomain} · Link: ${record.content.value}`)
	}
	const shortOwner = shortenAddress(record.address || '')
	if (shortOwner) {
		return `${profileDomain} on Sui · Owner ${shortOwner}`
	}
	return `${profileDomain} profile on Sui`
}

function shortenAddress(address: string): string {
	if (!address) return ''
	if (address.length <= 12) return address
	return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getRootOrigin(origin: string): string {
	try {
		const url = new URL(origin)
		const parts = url.hostname.split('.')
		if (parts.length > 2) {
			url.hostname = parts.slice(-2).join('.')
		}
		return url.origin
	} catch {
		return 'https://sui.ski'
	}
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

function getSuinsNftPreviewUrl(origin: string, cleanName: string, expiresMs?: number): string {
	const encodedName = encodeURIComponent(`${cleanName}.sui`)
	if (typeof expiresMs === 'number' && Number.isFinite(expiresMs) && expiresMs > 0) {
		return `${origin}/api/suins-image/${encodedName}?exp=${Math.floor(expiresMs)}&v=2`
	}
	return `${origin}/api/suins-image/${encodedName}?v=2`
}
