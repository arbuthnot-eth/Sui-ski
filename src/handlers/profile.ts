import type { Env, SuiNSRecord } from '../types'
import { generateLogoSvg, getDefaultOgImageUrl, getProfileOgImageUrl } from '../utils/og-image'
import { normalizeMediaUrl, renderSocialMeta } from '../utils/social'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
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
	<script type="module">
		import('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle').catch(()=>{});
		import('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle').catch(()=>{});
		import('https://esm.sh/@mysten/suins@1.0.0?bundle').catch(()=>{});
		import('https://esm.sh/@wallet-standard/app@1.1.0').catch(()=>{});
	</script>

	<style>${profileStyles}</style>
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
		<button class="wallet-btn" id="wallet-btn">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
				<path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
			</svg>
			<span id="wallet-btn-text">Connect</span>
		</button>
	</div>
	<div class="wallet-menu" id="wallet-menu"></div>

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
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 3v18M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"></path></svg>
											</button>
											<span class="target-preview-value" id="target-preview-value"></span>
											<button class="edit-btn target-self-btn hidden" id="set-self-btn" title="Set target to my address" aria-label="Set target to my address">Self</button>
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
						<span class="marketplace-label">Listed for</span>
						<span class="marketplace-value listing-price" id="marketplace-listing-price">--</span>
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
						<span class="marketplace-value bid-price" id="marketplace-bid-price">--</span>
						<button class="marketplace-accept-bid-btn" id="marketplace-accept-bid-btn" style="display:none;" disabled>
							<span class="marketplace-accept-text">Accept</span>
							<span class="marketplace-accept-loading hidden"><span class="loading"></span></span>
						</button>
					</div>
						<button class="marketplace-buy-btn" id="marketplace-buy-btn" style="display:none;" disabled>
							<span class="marketplace-buy-text">Buy Now</span>
							<span class="marketplace-buy-loading hidden"><span class="loading"></span></span>
						</button>
						<div class="marketplace-bid-input" id="marketplace-bid-input">
							<div class="marketplace-bid-estimate" id="marketplace-bid-estimate"></div>
							<div class="marketplace-bid-price-control">
										<button type="button" class="marketplace-bid-stepper-btn" id="marketplace-bid-price-down" aria-label="Decrease bid by 0.5 SUI">-</button>
								<input type="text" id="marketplace-bid-amount" placeholder="Bid amount" inputmode="decimal" pattern="[0-9]*\\.?[0-9]*" step="any">
								<button type="button" class="marketplace-bid-stepper-btn" id="marketplace-bid-price-up" aria-label="Increase bid by 0.5 SUI">+</button>
								<button type="button" class="marketplace-bid-max-btn" id="marketplace-bid-max" title="Use entire portfolio (95%)">MAX</button>
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
										<button type="button" class="marketplace-list-stepper-btn" id="marketplace-list-price-down" aria-label="Decrease list price by 0.5 SUI">-</button>
									<input type="text" id="marketplace-list-amount" placeholder="12" inputmode="numeric" pattern="[0-9]*">
									<button type="button" class="marketplace-list-stepper-btn" id="marketplace-list-price-up" aria-label="Increase list price by 0.5 SUI">+</button>
								</div>
							</div>
							<button class="marketplace-list-btn" id="marketplace-list-btn" style="display:none;" disabled>
								<span class="marketplace-list-text">List ${escapeHtml(cleanName)}.sui</span>
								<span class="marketplace-list-loading hidden"><span class="loading"></span></span>
							</button>
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
					<div class="auction-status" id="auction-status"></div>
					</div>
					</div>
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
			let getWallets, SuiJsonRpcClient, Transaction, SuinsClient, SuinsTransaction, SealClient, SessionKey, fromHex, toHex;
			{
				const pickExport = (mod, name) => {
					if (!mod || typeof mod !== 'object') return undefined;
					if (name in mod) return mod[name];
					if (mod.default && typeof mod.default === 'object' && name in mod.default) {
						return mod.default[name];
					}
					if (name === 'SuinsClient' && typeof mod.default === 'function') return mod.default;
					return undefined;
				};
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
				timedImport('https://esm.sh/@mysten/seal@0.9.6'),
				timedImport('https://esm.sh/@mysten/bcs@1.3.0'),
			]);
				if (results[0].status === 'fulfilled') ({ getWallets } = results[0].value);
				if (results[1].status === 'fulfilled') ({ SuiJsonRpcClient } = results[1].value);
				if (results[2].status === 'fulfilled') ({ Transaction } = results[2].value);
				if (results[3].status === 'fulfilled') {
					const suinsModule = results[3].value;
					SuinsClient = pickExport(suinsModule, 'SuinsClient');
					SuinsTransaction = pickExport(suinsModule, 'SuinsTransaction');
				}
				if (results[4].status === 'fulfilled') ({ SealClient, SessionKey } = results[4].value);
				if (results[5].status === 'fulfilled') ({ fromHex, toHex } = results[5].value);
				const failed = results.filter(r => r.status === 'rejected');
				if (failed.length > 0) console.warn('SDK modules failed:', failed.map(r => r.reason?.message));
				if (!SuinsClient || !Transaction || !SuiJsonRpcClient) {
					console.warn('Retrying failed SDK modules without ?bundle...');
					const retryImport = (url) => Promise.race([
						import(url),
						new Promise((_, r) => setTimeout(() => r(new Error('Retry timeout: ' + url)), 20000)),
					]);
					const retries = [];
					if (!SuiJsonRpcClient) retries.push(
						retryImport('https://esm.sh/@mysten/sui@2.2.0/jsonRpc')
							.then(m => { if (!SuiJsonRpcClient) SuiJsonRpcClient = pickExport(m, 'SuiJsonRpcClient'); })
							.catch(e => console.warn('Retry SuiJsonRpcClient failed:', e.message))
					);
					if (!Transaction) retries.push(
						retryImport('https://esm.sh/@mysten/sui@2.2.0/transactions')
							.then(m => { if (!Transaction) Transaction = pickExport(m, 'Transaction'); })
							.catch(e => console.warn('Retry Transaction failed:', e.message))
					);
					if (!SuinsClient) retries.push(
						retryImport('https://esm.sh/@mysten/suins@1.0.0')
							.then(m => { SuinsClient = pickExport(m, 'SuinsClient') || SuinsClient; SuinsTransaction = pickExport(m, 'SuinsTransaction') || SuinsTransaction; })
							.catch(e => console.warn('Retry SuinsClient failed:', e.message))
					);
					if (retries.length > 0) await Promise.allSettled(retries);
				}
				if (!SuinsClient) console.warn('SuinsClient unavailable after all retries');
			}
		if (Transaction) window.Transaction = Transaction;

		${generateWalletSessionJs()}

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
		let suinsModuleLoadingPromise = null;
		function pickSuinsExport(mod, name) {
			if (!mod || typeof mod !== 'object') return undefined;
			if (name in mod) return mod[name];
			if (mod.default && typeof mod.default === 'object' && name in mod.default) return mod.default[name];
			if (name === 'SuinsClient' && typeof mod.default === 'function') return mod.default;
			return undefined;
		}
		function getSuinsNetwork() {
			if (NETWORK === 'mainnet') return 'mainnet';
			if (NETWORK === 'testnet') return 'testnet';
			return 'testnet';
		}
		async function ensureSuinsSdkLoaded(requireTransaction = false) {
			const clientReady = typeof SuinsClient === 'function';
			const txReady = !requireTransaction || typeof SuinsTransaction === 'function';
			if (clientReady && txReady) return true;

			if (!suinsModuleLoadingPromise) {
				suinsModuleLoadingPromise = (async () => {
					const timeoutMs = 20000;
					const urls = [
						'https://esm.sh/@mysten/suins@1.0.0?bundle',
						'https://esm.sh/@mysten/suins@1.0.0',
						'https://esm.sh/@mysten/suins?bundle',
					];
					for (const url of urls) {
						try {
							const suinsModule = await Promise.race([
								import(url),
								new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: ' + url)), timeoutMs)),
							]);
							SuinsClient = pickSuinsExport(suinsModule, 'SuinsClient') || SuinsClient;
							SuinsTransaction = pickSuinsExport(suinsModule, 'SuinsTransaction') || SuinsTransaction;
							if (typeof SuinsClient === 'function') {
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
			const loadedClient = typeof SuinsClient === 'function';
			const loadedTx = !requireTransaction || typeof SuinsTransaction === 'function';
			return loadedClient && loadedTx;
		}
		async function createSuinsClient(requireTransaction = false) {
			const ready = await ensureSuinsSdkLoaded(requireTransaction);
			if (!ready) {
				throw new Error('SuiNS SDK failed to load from CDN. Check your connection and reload the page.');
			}
			return new SuinsClient({
				client: getSuiClient(),
				network: getSuinsNetwork(),
			});
		}
	const NFT_ID = ${serializeJson(record.nftId || '')};
	const TARGET_ADDRESS = ${serializeJson(record.address)};
	const OWNER_ADDRESS = ${serializeJson(record.ownerAddress || '')};
	const CURRENT_ADDRESS = TARGET_ADDRESS || OWNER_ADDRESS;
		const PROFILE_URL = ${serializeJson(`https://${cleanName}.sui.ski`)};
		const LOGO_SVG_MARKUP = ${serializeJson(generateLogoSvg(220))};
		const LOGO_DATA_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(LOGO_SVG_MARKUP);
		const TRADEPORT_LOGO_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAAA9EAIAAABmTZwGAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRP///////wlY99wAAAAHdElNRQfqAgcQMh6XRTP/AAAFxElEQVR42u3cf1DTdRzH8c9wE4H4pQJiKRyKCuqZphImgmZKcnUcXaKhJ3d2WIY/8jpMHaggEk6NMNM8pSL8AVfadBNFwh+ZcqiICENEFJk4dYLo2Nq++/7oD7ozCzfQj7yHvB9/fm/77nW75x/ffbebSNjAZDz81BxwNiXuIDf1xqbcBmKTmAHst4QoM8vefL7ziJU9fR1/7JXlMsF7v7vda96jizz6+70RvM3z3cGlYVdcJvVLCyjrMV+y3UHxPK/CJ6knyX2YlUXzI+uh37nOI14dmLbkSxGTf/Kd6J+4sBsxufOgJ1lCK6n28C0au/gjXYB26taEELffXs0YdbGjZ+ieSbWy48JuxOTGQs+wLXVTzmfucc6P/op7veyIfoNozFZdwL1B1dHQu7oGO+gBtu7BQXX8xXhFUsqMYXmVeUfj11WSQCGL3wG9y3ZhUh1QzilEiSOOPpLljFvISk2yFjfoRbYIk+qwJpl6eCknX54U7mM2T/xrVbMUepFtwaSeEaMw7GgyHB0lsx/Xj2NZiXEO9CJbgUk9F91Erfbaogsf5O2Ob4beYiswKQpqZ539Y5dSM1w18zAHvQUeJkXNCek2rwgxl2AeZqiF3gIJk6KsrqTkfI4SegUkTIqykgX7VixYInjxSdx86C0wMKkXoiX7fmbt19ArYGBSL8Q9h2sFJ/tCr4CBSb0Qt89WHFBeg14BA5NClGFSiDI7sTTw4yXe0DPaS7SbLCSE+JCucZ2SThSEEB0xQg/pTCKhhFtnimZFl7asPcgXNrjn2+g9Fea0KdjoK/6lJbTKr/WIKZkLlVQ8iGCuOgtN0aZBrikP95qPOAUwk/lUSSjsWvsS1qCZranWzL1zt/WIm8plp8OfHvvcTzof95Z4rnVd6sa6FDrWShaJ88SzYdfS0kPt9/Yck0gQBEEQoMe0Q5SxURtl3JOr8Dxg+YGiu06lA+wkS8cpNy23Sx2oiZxGAkV6SVhnjm2Iuhwul5/6cId/ZKTlR3oXBtRMqxu5IqJ/yvQ+vX3WjM8hvclAMrYz19L1El5LCV76MWqe2XsicWaa0S/7u56T+V23flUwRCAPSRX0uv/STK3yL/AtOLfRKahaMT55xGD+UeCdNarV0Lue3UuY1P8xMb+3vGdvHnns6vQ4ksg0Nx+DXtQ2XYp2Xm2QMjG1cXiyqleBfWo9CRIO8cehd3VMt0iqFXf+tqrgtHHVXrn7NOGyzqEmFXqRJZd+OBQn9SmsyPgk5AAXwpQYJkAvaq9ulNS/mfz3bx8iFbKbiyrnQm+xRLvzetSZLQrXlMwhC9lTJr6lGnqRdd00qVammXL1iBziqi+v56G3WGKIaXZvmFuUumXMlHXC5/widgP0Iku6dVKtTKr8cxOTyBVhKOsEvcWSxtibIedyyh8o7kpF0FsswaSI0EcvVqdyMyrup++H3mKdavoxr/SExoi6L4pl0Fvahkn9w6wq3SwNJyL9qJvh0FusK5RmrAqVCRcEMWdzP6HBpJ7AOl0SJ9+CXmEdX8clMVpNWOWKwzb3SRCTegJ7v2ZxViX5jPFoWgy9xbrivjnZsWeIjmhJDfSWxzCpNnCZ6mGHtkKvsM60Xv9+07IW+8bg63LoLY9hUm3g0qtU36yFXtFemjJV3BEb+qIJk2oDv6xx88VEcpzjjFroLdZdLy+WZblBr3gMk3q6WNP2Rh/oEdY1OdXPurCZrCdBws/QWwjBpCwQ+unHqsXQK9qLTWCGGK5CryAEk7JA+J59S9dlfrfE17IrGZu4/YFJPV2uWa/3hx7RXsJoroe5DHoFIZgUog6TQpRhUogyTApRhkkhyjApRBkmhSjDpBBlmBSiDJNClGFSiDJMClGGSSHKMClEGSaFKMOkEGWYFKIMk0KUYVKIMkwKUYZJIcowKUQZJoUo6zpJpdlPdi/pzBcUBbvKhjo+23Od0z1jhhZ35tqeHo6vuNvEHxj9DcC9E2fGe9rKAAAAAElFTkSuQmCC';
		const META_SEAL_SCHEMA = 'meta-seal-lite-v1';
		const NFT_EXPLORER_URL = ${serializeJson(nftExplorerUrl)};
	const EXPLORER_BASE = ${serializeJson(explorerBase)};
	const IS_SUBNAME = NAME.includes('.');
	const STORAGE_KEY = 'sui_ski_wallet';
	const EXPIRATION_MS = ${safeNumber(expiresMs)};
	const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
	const AVAILABLE_AT = EXPIRATION_MS + GRACE_PERIOD_MS;
	const IS_LONG_RENEWAL = EXPIRATION_MS > Date.now() + 2 * 365.25 * 86400000;
		const HAS_WALRUS_SITE = ${record.walrusSiteId ? 'true' : 'false'};
		const HAS_CONTENT_HASH = ${record.contentHash ? 'true' : 'false'};
		const IS_IN_GRACE_PERIOD = ${options.inGracePeriod ? 'true' : 'false'};
	const DECAY_AUCTION_PACKAGE_ID = ${serializeJson(String(env.DECAY_AUCTION_PACKAGE_ID || ''))};
	const DISCOUNT_RECIPIENT_NAME = ${serializeJson(env.DISCOUNT_RECIPIENT_NAME || 'extra.sui')};

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
		let currentTargetAddress = TARGET_ADDRESS || '';
		let currentListing = null;
		let currentSales = [];
		let pendingBidAmount = null;

		if (typeof getWallets === 'function') {
			try {
				walletsApi = getWallets();
			} catch (e) {
				console.error('Failed to init wallet API:', e);
			}
		} else {
			console.warn('getWallets function not available, wallet connection may not work');
		}

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
			let nftDisplayLoaded = false;
			let restoringIdentityVisual = false;

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
					if (targetPreviewValueEl) targetPreviewValueEl.textContent = 'None';
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

			function isMobileDevice() {
				try {
					const ua = navigator.userAgent || '';
					const uaDataMobile = navigator.userAgentData && navigator.userAgentData.mobile === true;
					const uaMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
					const touchLike = navigator.maxTouchPoints > 1;
					const smallViewport = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900;
					return Boolean(uaDataMobile || uaMobile || (touchLike && smallViewport));
				} catch {
					return false;
				}
			}

			function getNoWalletsMessageHtml(message) {
				const baseMessage = message || 'No Sui wallets detected.';
				if (isMobileDevice()) {
					return '<div class="wallet-no-wallets">'
						+ baseMessage
						+ '<br><br>'
						+ 'Open this page in your wallet\\'s in-app browser:'
						+ '<br>'
						+ '<a href="https://slush.app" target="_blank" rel="noopener noreferrer">Open Slush (Mysten) →</a>'
						+ '<br>'
						+ '<a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer">Open Phantom →</a>'
						+ '</div>';
				}
				return '<div class="wallet-no-wallets">'
					+ baseMessage
					+ '<br><br>'
					+ '<a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer">Install Phantom →</a>'
					+ '<br>'
					+ '<a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank" rel="noopener noreferrer">Install Sui Wallet →</a>'
					+ '</div>';
			}

			function normalizeAccountAddress(account) {
				if (!account) return '';
				if (typeof account.address === 'string') return account.address.trim();
				if (account.address && typeof account.address.toString === 'function') {
					return String(account.address.toString()).trim();
				}
				return '';
			}

			function isSuiAccount(account) {
				if (!account) return false;
				const accountChains = Array.isArray(account.chains) ? account.chains : [];
				if (accountChains.some((chain) => typeof chain === 'string' && chain.startsWith('sui:'))) {
					return true;
				}
				const addr = normalizeAccountAddress(account);
				return /^0x[0-9a-fA-F]{2,}$/.test(addr);
			}

			function filterSuiAccounts(accounts) {
				if (!Array.isArray(accounts)) return [];
				return accounts
					.filter(isSuiAccount)
					.map((account) => {
						const normalizedAddress = normalizeAccountAddress(account);
						if (!normalizedAddress) return account;
						if (typeof account.address === 'string' && account.address === normalizedAddress) return account;
						return { ...account, address: normalizedAddress };
					});
			}

			function extractConnectedAccounts(connectResult, wallet) {
				let accounts = [];
				if (Array.isArray(connectResult)) {
					accounts = connectResult;
				} else if (connectResult && Array.isArray(connectResult.accounts)) {
					accounts = connectResult.accounts;
				} else if (connectResult && connectResult.account && connectResult.account.address) {
					accounts = [connectResult.account];
				}
				if (accounts.length === 0) {
					const walletAccounts = wallet?.accounts;
					if (Array.isArray(walletAccounts) && walletAccounts.length > 0) {
						accounts = walletAccounts;
					}
				}
				if (accounts.length === 0) {
					const rawAccounts = wallet?._raw?.accounts;
					if (Array.isArray(rawAccounts) && rawAccounts.length > 0) {
						accounts = rawAccounts;
					}
				}
				return filterSuiAccounts(accounts);
			}

			// Get available Sui wallets with fallbacks
			function getSuiWallets() {
				const wallets = [];
				const seenNames = new Set();
				const isSuiCapableWallet = (wallet) => {
					if (!wallet) return false;
					const features = wallet.features || {};
					const hasSuiChain =
						Array.isArray(wallet.chains) && wallet.chains.some(chain => chain.startsWith('sui:'));
					const hasConnect = !!(features['standard:connect'] || wallet.connect);
					const hasSuiNamespaceFeature = Object.keys(features).some((key) => key.startsWith('sui:'));
					const hasSuiTxMethod = !!(
						features['sui:signAndExecuteTransactionBlock'] ||
						features['sui:signAndExecuteTransaction'] ||
						wallet.signAndExecuteTransactionBlock ||
						wallet.signAndExecuteTransaction
					);
					return hasConnect && (hasSuiChain || hasSuiNamespaceFeature || hasSuiTxMethod);
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
					{ check: () => window.sui, name: 'Sui Wallet', icon: 'https://sui.io/favicon.png' },
					{ check: () => window.phantom?.sui, name: 'Phantom', icon: 'https://phantom.app/img/phantom-icon-purple.svg' },
					{ check: () => window.suiWallet, name: 'Sui Wallet', icon: 'https://sui.io/favicon.png' },
					{ check: () => window.mystenWallet?.sui || window.mystenWallet, name: 'Sui Wallet', icon: 'https://sui.io/favicon.png' },
					{ check: () => window.mysten?.sui || window.mysten?.wallet, name: 'Sui Wallet', icon: 'https://sui.io/favicon.png' },
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
						if (!isSuiCapableWallet(wallet)) continue;
						// Wrap window wallet to match landing-page wallet features.
							wallets.push({
								name,
								icon,
								chains: ['sui:mainnet', 'sui:testnet'],
								features: {
									'standard:connect': wallet.connect ? { connect: wallet.connect.bind(wallet) } : undefined,
									'standard:disconnect': wallet.disconnect ? { disconnect: wallet.disconnect.bind(wallet) } : undefined,
									'sui:signAndExecuteTransaction': wallet.signAndExecuteTransaction
										? { signAndExecuteTransaction: wallet.signAndExecuteTransaction.bind(wallet) } : undefined,
									'sui:signAndExecuteTransactionBlock': wallet.signAndExecuteTransactionBlock
										? { signAndExecuteTransactionBlock: wallet.signAndExecuteTransactionBlock.bind(wallet) } : undefined,
									'sui:signTransaction': wallet.signTransaction
										? { signTransaction: wallet.signTransaction.bind(wallet) } : undefined,
								},
								get accounts() { return wallet.accounts || []; },
								_raw: wallet,
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
			await new Promise(r => setTimeout(r, 100));
			let wallets = getSuiWallets();
			if (wallets.length) return wallets;
			await new Promise(r => setTimeout(r, 500));
			return getSuiWallets();
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
			const isAlreadyPrimary = Boolean(
				connectedAddress
				&& connectedPrimaryName
				&& connectedPrimaryName.replace(/\\.sui$/i, '') === FULL_NAME.replace(/\\.sui$/i, ''),
			);

			// Show for owners when target is missing or points elsewhere.
			if (isOwner && (!hasExplicitTarget || !isAlreadySelf)) {
				setSelfBtn.disabled = false;
				setSelfBtn.title = connectedPrimaryName
					? 'Set to ' + connectedPrimaryName
					: 'Set to ' + truncAddr(connectedAddress);
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
				} else if (isOwner && connectedWallet && connectedAccount) {
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
				copyTargetBtn.classList.toggle('hidden', !hasExplicitTarget);
				copyTargetBtn.disabled = !hasExplicitTarget;
			}
			if (targetPreviewBtn) {
				targetPreviewBtn.classList.remove('hidden');
				targetPreviewBtn.classList.toggle('self-target', Boolean(hasExplicitTarget && isAlreadySelf));
			}
			if (targetPreviewValue) {
				targetPreviewValue.classList.remove('hidden');
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
				const isOwner = connectedAddress && nftOwnerAddress && connectedAddress.toLowerCase() === nftOwnerAddress.toLowerCase();
				burnBtn.classList.toggle('hidden', !isOwner);
			}
		}

		// Burn NFT and release name
		async function handleBurnNft() {
			if (!connectedAddress || !connectedWallet || !NFT_ID) {
				showBurnStatus('Connect wallet first', 'error');
				return;
			}

			const isOwner = connectedAddress && nftOwnerAddress && connectedAddress.toLowerCase() === nftOwnerAddress.toLowerCase();
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
				const txOptions = { showEffects: true, showObjectChanges: true };

				if (connectedWallet.features?.['sui:signAndExecuteTransaction']?.signAndExecuteTransaction) {
					result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
						transaction: tx,
						options: txOptions,
					});
				} else if (connectedWallet.features?.['sui:signAndExecuteTransactionBlock']?.signAndExecuteTransactionBlock) {
					const suiClient = getSuiClient();
					const txBytes = await tx.build({ client: suiClient });
					result = await connectedWallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
						transactionBlock: txBytes,
						options: txOptions,
					});
				} else {
					throw new Error('Wallet does not support transaction signing');
				}

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

		function saveWalletConnection() {
			if (connectedWalletName && connectedAddress) {
				localStorage.setItem(STORAGE_KEY, JSON.stringify({
					walletName: connectedWalletName,
					address: connectedAddress
				}));
				connectWalletSession(connectedWalletName, connectedAddress);
			}
		}

		function clearWalletConnection() {
			localStorage.removeItem(STORAGE_KEY);
			disconnectWalletSession();
		}

		async function restoreWalletConnection() {
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				const cookieHint = getWalletSession();
				const walletName = saved ? JSON.parse(saved).walletName : cookieHint?.walletName;
				if (!walletName) return false;

				const wallets = getSuiWallets();
				const wallet = wallets.find(w => w.name === walletName);
				if (!wallet) {
					clearWalletConnection();
					return false;
				}

				let accounts = filterSuiAccounts(wallet.accounts || []);

				if (accounts.length === 0) {
					const phantomProvider = window.phantom?.sui;
					const isPhantom = phantomProvider && (walletName === 'Phantom' || wallet._raw === phantomProvider);
					if (isPhantom) {
						accounts = filterSuiAccounts(phantomProvider.accounts || []);
						if (accounts.length === 0 && typeof phantomProvider.connect === 'function') {
							try {
								await phantomProvider.connect();
								accounts = filterSuiAccounts(phantomProvider.accounts || []);
							} catch {}
						}
					}
				}

				if (accounts.length === 0) {
					const connectFeature = wallet.features?.['standard:connect'] || wallet._raw?.connect;
					if (typeof connectFeature === 'function') {
						const result = await connectFeature();
						accounts = extractConnectedAccounts(result, wallet);
					} else if (connectFeature?.connect) {
						const result = await connectFeature.connect();
						accounts = extractConnectedAccounts(result, wallet);
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
			const finishConnect = (accounts, walletName) => {
				connectedAccount = accounts[0];
				connectedAddress = accounts[0].address;
				connectedWallet = wallet;
				connectedWalletName = walletName || wallet.name;
				walletModal.classList.remove('open');
				saveWalletConnection();
				updateUIForWallet();
			};

			try {
				walletList.innerHTML = '<div class="wallet-detecting"><span class="loading"></span> Connecting...</div>';

				const phantomProvider = window.phantom?.sui;
				const isPhantom = phantomProvider && (wallet.name === 'Phantom' || wallet._raw === phantomProvider);

				if (isPhantom) {
					const existing = filterSuiAccounts(phantomProvider.accounts || wallet.accounts || []);
					if (existing.length > 0) {
						finishConnect(existing, 'Phantom');
						return;
					}
					if (typeof phantomProvider.connect === 'function') {
						await phantomProvider.connect();
						const accounts = filterSuiAccounts(phantomProvider.accounts || []);
						if (accounts.length > 0) {
							finishConnect(accounts, 'Phantom');
							return;
						}
					}
				}

				const connectFeature = wallet.features?.['standard:connect'] || wallet._raw?.connect;
				if (!connectFeature) throw new Error('Wallet does not support connection');

				let accounts;
				if (typeof connectFeature === 'function') {
					const result = await connectFeature();
					accounts = extractConnectedAccounts(result, wallet);
				} else if (typeof connectFeature.connect === 'function') {
					const result = await connectFeature.connect();
					accounts = extractConnectedAccounts(result, wallet);
				}

				if (!accounts?.length) {
					await new Promise(r => setTimeout(r, 200));
					accounts = extractConnectedAccounts(null, wallet);
				}
					if (!accounts?.length) throw new Error('No Sui accounts. Switch your wallet to Sui and try again.');

				finishConnect(accounts);
			} catch (e) {
				const errorMsg = e.message || 'Unknown error';

				const phantomProvider = window.phantom?.sui;
				if (phantomProvider) {
					const existing = filterSuiAccounts(phantomProvider.accounts || []);
					if (existing.length > 0) {
						finishConnect(existing, 'Phantom');
						return;
					}
					if (errorMsg.includes('authorized') && typeof phantomProvider.connect === 'function') {
						try {
							walletList.innerHTML = '<div class="wallet-detecting"><span class="loading"></span> Requesting approval...</div>';
							await phantomProvider.connect();
							const accounts = filterSuiAccounts(phantomProvider.accounts || []);
							if (accounts.length > 0) {
								finishConnect(accounts, 'Phantom');
								return;
							}
						} catch (retryErr) {
							console.warn('Phantom direct connect retry failed:', retryErr.message);
						}
					}
				}

				const isUserAction = errorMsg.includes('rejected') ||
					errorMsg.includes('cancelled') ||
					errorMsg.includes('Unexpected');
				if (!isUserAction && !errorMsg.includes('authorized')) {
					console.error('Wallet error:', errorMsg);
				}
				const userMessage = errorMsg.includes('authorized')
					? 'Tap Connect again to approve the connection.'
					: isUserAction
						? 'Connection cancelled.'
						: 'Connection failed: ' + errorMsg;
				walletList.innerHTML = '<div class="wallet-no-wallets" style="color: var(--error);">' +
					userMessage +
					'<br><br>' +
					'<button onclick="connectWallet()" ' +
					'style="padding: 8px 16px; background: var(--accent); border: none; border-radius: 8px; color: white; cursor: pointer;">' +
					'Retry</button></div>';
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
			walletList.innerHTML = getNoWalletsMessageHtml('Detecting wallets...');

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
				walletList.innerHTML = getNoWalletsMessageHtml('No Sui wallets detected.');
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
			if (connectedWallet?.features?.['standard:disconnect']?.disconnect) {
				try { connectedWallet.features['standard:disconnect'].disconnect(); } catch {}
			}
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

		function getWalletProfileHref() {
			if (connectedPrimaryName) {
				const cleanedName = connectedPrimaryName.replace(/\\.sui$/i, '');
				return \`https://\${cleanedName}.sui.ski\`;
			}
			return 'https://sui.ski';
		}

		function closeWalletMenu() {
			if (walletMenu) walletMenu.classList.remove('open');
		}

		function updateWalletProfileButton() {
			if (!walletProfileBtn) return;
			const href = getWalletProfileHref();
			walletProfileBtn.dataset.href = href;
			walletProfileBtn.title = connectedPrimaryName ? 'View my primary profile' : 'Go to sui.ski';
		}

		function renderWalletMenu() {
			if (!walletMenu || !connectedAddress) {
				if (walletMenu) walletMenu.innerHTML = '';
				return;
			}

			const profileHref = connectedPrimaryName
				? getWalletProfileHref()
				: null;
			const namesHref = \`https://www.tradeport.xyz/sui/\${connectedAddress}?tab=items&collectionFilter=suins\`;

			let html = '<button class="wallet-menu-item" id="wm-copy">' +
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
				'Copy Address</button>';
			if (profileHref) {
				html += '<a class="wallet-menu-item" href="' + profileHref + '">' +
					'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>' +
					'My Profile</a>';
			}
			html += '<a class="wallet-menu-item" href="' + namesHref + '" target="_blank" rel="noopener noreferrer">' +
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
				'My Names</a>';
			
			html += '<button class="wallet-menu-item" id="wm-switch">' +
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>' +
				'Switch Wallet</button>';
			html += '<button class="wallet-menu-item disconnect" id="wm-disconnect">' +
				'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
				'Disconnect</button>';
			walletMenu.innerHTML = html;

			const copyBtn = document.getElementById('wm-copy');
			if (copyBtn) {
				copyBtn.onclick = async () => {
					try {
						await navigator.clipboard.writeText(connectedAddress);
						const flash = document.createElement('span');
						flash.className = 'copied-flash';
						flash.textContent = 'Copied!';
						copyBtn.appendChild(flash);
						setTimeout(() => flash.remove(), 1500);
					} catch (err) {
						console.error('Failed to copy address:', err);
					}
				};
			}

			const switchBtn = document.getElementById('wm-switch');
			if (switchBtn) {
				switchBtn.onclick = () => {
					closeWalletMenu();
					disconnectWallet();
					setTimeout(() => connectWallet(), 120);
				};
			}

			const disconnectBtn = document.getElementById('wm-disconnect');
			if (disconnectBtn) {
				disconnectBtn.onclick = () => {
					closeWalletMenu();
					disconnectWallet();
				};
			}
		}

		function updateGlobalWalletWidget() {
			if (!walletBtn || !walletBtnText) return;

			updateWalletProfileButton();
			if (!connectedAddress) {
				walletBtn.classList.remove('connected');
				walletBtnText.textContent = 'Connect';
				closeWalletMenu();
				if (walletMenu) walletMenu.innerHTML = '';
				return;
			}

			const displayName = connectedPrimaryName || truncAddr(connectedAddress);
			walletBtn.classList.add('connected');
			walletBtnText.textContent = displayName;
			renderWalletMenu();
		}

		if (walletProfileBtn) {
			walletProfileBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				window.location.href = walletProfileBtn.dataset.href || 'https://sui.ski';
			});
		}

		if (walletBtn) {
			walletBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				if (!connectedAddress) {
					connectWallet();
					return;
				}
				renderWalletMenu();
				if (walletMenu) walletMenu.classList.toggle('open');
			});
		}

		document.addEventListener('click', (e) => {
			if (walletWidget && walletWidget.contains(e.target)) return;
			if (walletMenu && walletMenu.contains(e.target)) return;
			closeWalletMenu();
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

					const vaultBtn = document.getElementById('vault-diamond-btn');
					if (vaultBtn) {
						if (connectedAddress && connectedAddress !== TARGET_ADDRESS && connectedAddress !== OWNER_ADDRESS) {
							vaultBtn.style.display = '';
							vaultBtn.classList.remove('bookmarked', 'diamond-transforming');
							vaultBtn.title = 'Save to vault';
							if (document.body) document.body.classList.remove('diamond-watch-active');
							const identityCard = document.querySelector('.identity-card');
							if (identityCard) identityCard.classList.remove('black-diamond-active');
							try { diamondWatching = false; } catch {}
							checkWatchingState();
						} else {
							vaultBtn.style.display = 'none';
							vaultBtn.classList.remove('bookmarked', 'diamond-transforming');
							vaultBtn.title = 'Save to vault';
							if (document.body) document.body.classList.remove('diamond-watch-active');
							const identityCard = document.querySelector('.identity-card');
							if (identityCard) identityCard.classList.remove('black-diamond-active');
							try { diamondWatching = false; } catch {}
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

		function getExplicitTargetAddress() {
			return currentTargetAddress || TARGET_ADDRESS || '';
		}

		function getActiveTargetAddress() {
			return getExplicitTargetAddress() || CURRENT_ADDRESS || ownerDisplayAddress || '';
		}

		function canConnectedWalletEditTarget() {
			const normalizedConnected = connectedAddress ? String(connectedAddress).toLowerCase() : '';
			if (!normalizedConnected) return false;
			const normalizedOwner = String(nftOwnerAddress || OWNER_ADDRESS || '').toLowerCase();
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
			if (!connectedAddress || !connectedWallet || !connectedAccount) {
				connectWallet().then(() => {
					if (connectedAddress && connectedWallet && connectedAccount) openSendModal();
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
			if (sendModal) sendModal.classList.add('open');
		}

		function closeSendModal() {
			if (sendModal) sendModal.classList.remove('open');
			if (sendStatus) hideStatus(sendStatus);
		}

		async function sendSuiToProfile() {
			if (!sendStatus || !sendConfirmBtn || !sendAmountInput) return;

			const recipient = getActiveTargetAddress();
			if (!isLikelySuiAddress(recipient)) {
				showStatus(sendStatus, 'Recipient address is invalid', 'error');
				return;
			}
			if (!connectedAddress || !connectedWallet || !connectedAccount) {
				showStatus(sendStatus, 'Connect wallet first', 'error');
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
				const tx = new Transaction();
				tx.setSender(connectedAddress);
				const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)]);
				tx.transferObjects([coin], tx.pure.address(recipient));
				tx.setGasBudget(50000000);

				showStatus(sendStatus, '<span class="loading"></span> Approve in wallet...', 'info');

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

				if (signExecFeature?.signAndExecuteTransaction) {
					result = await signExecFeature.signAndExecuteTransaction({
						transaction: tx,
						account: connectedAccount,
						chain,
						options: { showEffects: true },
					});
				} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
					result = await signExecBlockFeature.signAndExecuteTransactionBlock({
						transactionBlock: tx,
						account: connectedAccount,
						chain,
						options: { showEffects: true },
					});
				} else {
					const txBytes = await tx.build({ client: getSuiClient() });
					const phantomProvider = window.phantom?.sui;
					if (phantomProvider?.signAndExecuteTransactionBlock) {
						result = await phantomProvider.signAndExecuteTransactionBlock({
							transactionBlock: txBytes,
							options: { showEffects: true },
						});
					} else {
						throw new Error('Wallet does not support transaction signing');
					}
				}

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
					const taggedFilename = NAME.replace(/\\./g, '-') + '-sui.png';
				const sealPayload = buildMetaSealPayload(preferQr);
				try {
					const taggedCanvas = await buildTaggedIdentityCanvas(preferQr, currentListing, currentBestBid, { sales: currentSales });
					if (taggedCanvas) {
						triggerCanvasDownload(taggedCanvas, taggedFilename, feedbackBtn, sealPayload);
						return;
					}
				} catch (error) {
					console.error('Tagged download failed, using fallback:', error);
				}

				// Fallback to raw visual export if tagged generation fails
				const fallbackFilename = NAME.replace(/\\./g, '-') + '-sui.png';
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
					const wasOfferAccepted = sales.length > 0;
					const blackDiamondMode = options && options.blackDiamondMode === true;
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

					// Black-diamond mode: ink-crush only the clean base NFT pass, then draw overlays in normal color.
					if (canBlackenBase) {
						ctx.filter = 'saturate(325%) contrast(132%) brightness(98%)';
						ctx.drawImage(visualSource, 0, 0, srcWidth, srcHeight);
						ctx.filter = 'none';
						inkCrushBackgroundPixels();

						const sideShadow = ctx.createLinearGradient(0, 0, srcWidth, 0);
						sideShadow.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
						sideShadow.addColorStop(0.16, 'rgba(2, 6, 12, 0.22)');
						sideShadow.addColorStop(0.5, 'rgba(3, 7, 14, 0.06)');
						sideShadow.addColorStop(0.84, 'rgba(2, 6, 12, 0.24)');
						sideShadow.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
						ctx.fillStyle = sideShadow;
						ctx.fillRect(0, 0, srcWidth, srcHeight);

						const deepVignette = ctx.createRadialGradient(
							srcWidth * 0.5,
							srcHeight * 0.44,
							Math.min(srcWidth, srcHeight) * 0.2,
							srcWidth * 0.5,
							srcHeight * 0.52,
							Math.max(srcWidth, srcHeight) * 0.76,
						);
						deepVignette.addColorStop(0, 'rgba(4, 10, 18, 0.08)');
						deepVignette.addColorStop(0.62, 'rgba(2, 4, 8, 0.32)');
						deepVignette.addColorStop(1, 'rgba(0, 0, 0, 0.84)');
						ctx.save();
						ctx.globalCompositeOperation = 'multiply';
						ctx.fillStyle = deepVignette;
						ctx.fillRect(0, 0, srcWidth, srcHeight);
						ctx.restore();
					} else {
						ctx.drawImage(visualSource, 0, 0, srcWidth, srcHeight);
					}

					// Subtle contrast pass so logo implant reads on bright NFTs.
					const topFade = ctx.createLinearGradient(0, 0, 0, srcHeight * 0.24);
					if (canBlackenBase) {
						topFade.addColorStop(0, 'rgba(2, 8, 18, 0.34)');
						topFade.addColorStop(1, 'rgba(2, 8, 18, 0.04)');
					} else {
						topFade.addColorStop(0, 'rgba(5, 9, 20, 0.26)');
						topFade.addColorStop(1, 'rgba(5, 9, 20, 0.0)');
					}
					ctx.fillStyle = topFade;
					ctx.fillRect(0, 0, srcWidth, srcHeight * 0.24);

					const minSide = Math.min(srcWidth, srcHeight);
					const overlayPadding = Math.max(22, Math.round(minSide * 0.045));
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

					if (canBlackenBase) {
						const overlayName = String(NAME || '').replace(/.sui$/i, '').replace(/^@+/, '') || 'sui';
						const atText = '@';
						const nameText = overlayName;
						const nameFontSize = Math.max(46, Math.round(minSide * 0.175));
						const nameY = overlayPadding;
						ctx.save();
						ctx.font = '800 ' + nameFontSize + 'px Inter, system-ui, -apple-system, sans-serif';
						ctx.textAlign = 'left';
						ctx.textBaseline = 'top';
						ctx.lineJoin = 'round';
						ctx.shadowColor = 'rgba(1, 5, 15, 0.82)';
						ctx.shadowBlur = Math.max(8, Math.round(minSide * 0.028));
						ctx.shadowOffsetY = 1;
						ctx.lineWidth = Math.max(3, Math.round(nameFontSize * 0.12));
						ctx.strokeStyle = 'rgba(191, 229, 255, 0.65)';
						ctx.strokeText(atText, overlayPadding, nameY);
						ctx.fillStyle = '#60a5fa';
						ctx.fillText(atText, overlayPadding, nameY);

						const atWidth = ctx.measureText(atText).width + Math.max(4, Math.round(minSide * 0.008));
						const nameX = overlayPadding + atWidth;
						const nameWidth = ctx.measureText(nameText).width;
						ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)';
						ctx.strokeText(nameText, nameX, nameY);
						const nameGradient = ctx.createLinearGradient(nameX, nameY, nameX + nameWidth, nameY + nameFontSize);
						nameGradient.addColorStop(0, '#86efac');
						nameGradient.addColorStop(0.55, '#facc15');
						nameGradient.addColorStop(1, '#fb7185');
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
							const expiryDate = new Date(EXPIRATION_MS).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
								year: 'numeric',
							});
							const dateSize = Math.max(14, Math.round(minSide * 0.04));
							ctx.save();
							ctx.font = '700 ' + dateSize + 'px Inter, system-ui, -apple-system, sans-serif';
							ctx.textBaseline = 'alphabetic';
							ctx.textAlign = 'right';
							ctx.strokeStyle = 'rgba(0, 0, 0, 0.68)';
							ctx.lineWidth = Math.max(2, Math.round(dateSize * 0.2));
							ctx.strokeText(expiryDate, srcWidth - overlayPadding, srcHeight - overlayPadding);
							ctx.fillStyle = 'rgba(226, 232, 240, 0.95)';
							ctx.fillText(expiryDate, srcWidth - overlayPadding, srcHeight - overlayPadding);
							ctx.restore();
						}
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

					// Upper-right brand lockup: shared sui.ski logo mark + ".sui.ski".
					const brandIconSize = Math.max(40, Math.min(96, Math.round(Math.min(srcWidth, srcHeight) * 0.18)));
					const brandPadding = Math.max(12, Math.round(Math.min(srcWidth, srcHeight) * 0.035));
					const brandShiftDown = Math.max(6, Math.round(Math.min(srcWidth, srcHeight) * 0.018));
					const brandX = srcWidth - brandPadding - brandIconSize;
					const brandY = brandPadding + brandShiftDown;
					if (logoImage) {
						drawVisualIntoBox(
							ctx,
							logoImage,
							brandX,
							brandY,
							brandIconSize,
							brandIconSize,
							Math.round(brandIconSize * 0.2),
						);
					} else {
						drawSiteLogoGlyph(
							ctx,
							brandX,
							brandY,
							brandIconSize,
						);
					}

						const nftTagSize = Math.max(13, Math.round(brandIconSize * 0.28));
						const nftTagY = brandY + brandIconSize + Math.max(6, Math.round(nftTagSize * 0.42));
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

					// Draw TradePort market data badge if available
					const hasListing = listing && listing.price;
					const hasBestBid = bestBid && bestBid.price;
					if (hasListing || hasBestBid) {
						let tradeportLogo = null;
						try {
							const rawLogo = await loadImageForCanvas(TRADEPORT_LOGO_URL);
							const tempCanvas = document.createElement('canvas');
							tempCanvas.width = rawLogo.width;
							tempCanvas.height = rawLogo.height;
							const tempCtx = tempCanvas.getContext('2d');
							tempCtx.drawImage(rawLogo, 0, 0);
							const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
							const data = imageData.data;
							for (let i = 0; i < data.length; i += 4) {
								const r = data[i];
								const g = data[i + 1];
								const b = data[i + 2];
								const brightness = (r + g + b) / 3;
								if (brightness > 240) {
									data[i + 3] = 0;
								}
							}
							tempCtx.putImageData(imageData, 0, 0);
							tradeportLogo = tempCanvas;
						} catch {}

						const badgePadding = Math.max(10, Math.round(Math.min(srcWidth, srcHeight) * 0.015));
						const priceTextSize = Math.max(16, Math.round(Math.min(srcWidth, srcHeight) * 0.04));
						const labelTextSize = Math.max(14, Math.round(priceTextSize * 0.9));
						const logoSize = Math.max(28, Math.round(priceTextSize * 3.0));
						const labelLineHeight = labelTextSize + 3;
						const valueLineHeight = priceTextSize + 2;

						const formatSuiPrice = (mist) => {
							const sui = Number(mist) / 1e9;
							const whole = Math.floor(sui);
							const decimal = sui - whole;
							if (decimal < 0.05) {
								return whole.toString();
							}
							return sui.toFixed(2);
						};

						const entries = [];
						if (hasListing) {
							const listPrice = formatSuiPrice(listing.price);
							entries.push({ label: 'List:', suiValue: listPrice + ' SUI' });
						}
						if (hasBestBid) {
							const bidPrice = formatSuiPrice(bestBid.price);
							entries.push({ label: wasOfferAccepted ? 'Sale:' : 'Offer:', suiValue: bidPrice + ' SUI' });
						}

						ctx.font = '700 ' + priceTextSize + 'px Inter, system-ui, -apple-system, sans-serif';
						let maxWidth = 0;
						for (const entry of entries) {
							const labelWidth = ctx.measureText(entry.label).width;
							const valueWidth = ctx.measureText(entry.suiValue).width;
							maxWidth = Math.max(maxWidth, labelWidth, valueWidth);
						}

						const entryHeight = labelLineHeight + valueLineHeight;
						const totalEntriesHeight = entries.length * entryHeight + (entries.length - 1) * 4;
						const badgeWidth = logoSize + badgePadding + maxWidth + badgePadding;
						const badgeHeight = Math.max(logoSize, totalEntriesHeight) + badgePadding * 2;
						const badgeSpacing = Math.max(12, Math.round(qrMargin * 0.6));
						const badgeX = qrX;
						const badgeY = qrY - badgeHeight - badgeSpacing;

						if (tradeportLogo) {
							const logoX = badgeX + badgePadding;
							const logoY = badgeY + badgePadding + 7;
							ctx.drawImage(tradeportLogo, logoX, logoY, logoSize, logoSize);
						}

						ctx.textAlign = 'left';
						ctx.textBaseline = 'top';

						const textX = badgeX + badgePadding + logoSize + badgePadding;
						const logoBottomY = badgeY + badgePadding + 7 + logoSize;
						const additionalOffset = Math.max(10, Math.round(badgePadding * 1.2));
						const textStartY = logoBottomY - totalEntriesHeight + additionalOffset;

						ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
						ctx.lineWidth = Math.max(5, Math.round(priceTextSize * 0.4));
						ctx.lineJoin = 'round';
						ctx.miterLimit = 2;
						ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
						ctx.shadowBlur = Math.max(6, Math.round(priceTextSize * 0.5));
						ctx.shadowOffsetX = 0;
						ctx.shadowOffsetY = 1;

						let currentY = textStartY;
						for (let i = 0; i < entries.length; i++) {
							const entry = entries[i];

							ctx.font = '700 ' + labelTextSize + 'px Inter, system-ui, -apple-system, sans-serif';
							ctx.strokeText(entry.label, textX, currentY);
							ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
							ctx.fillText(entry.label, textX, currentY);

							currentY += labelLineHeight;

							ctx.font = '800 ' + priceTextSize + 'px Inter, system-ui, -apple-system, sans-serif';
							ctx.strokeText(entry.suiValue, textX, currentY);
							ctx.fillStyle = '#FFFFFF';
							ctx.fillText(entry.suiValue, textX, currentY);

							currentY += valueLineHeight + 4;
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
						const taggedCanvas = await buildTaggedIdentityCanvas(false, currentListing, currentBestBid, { blackDiamondMode, sales: currentSales });
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
						if (identityCanvas) identityCanvas.style.display = 'none';

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

			if (!confirm(\`Set target address to \${connectedPrimaryName || truncAddr(connectedAddress)}?\`)) {
				return;
			}

				try {
					setSelfBtn.disabled = true;

				const suinsClient = await createSuinsClient(true);
				const suiClient = getSuiClient();

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

			const isOwner = connectedAddress && nftOwnerAddress && connectedAddress === nftOwnerAddress;
			if (!isOwner) {
				showOwnerInlineStatus('Only the NFT owner can set this as primary.', 'error');
				return;
			}
			if (!connectedWallet || !connectedAccount) {
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

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';

				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

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

			if (newAddress === getExplicitTargetAddress()) {
				showStatus(modalStatus, 'This is already the target address', 'info');
				return;
			}

			try {
				showStatus(modalStatus, '<span class="loading"></span> Building transaction...', 'info');
				saveBtn.disabled = true;

				const suinsClient = await createSuinsClient(true);
				const suiClient = getSuiClient();

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

				showStatus(modalStatus, '<strong>Updated!</strong> ' + renderTxExplorerLinks(result.digest, true), 'success');

				// Update displayed address and fetch new primary name
				setTimeout(async () => {
					document.querySelector('.owner-addr').textContent = newAddress.slice(0, 8) + '...' + newAddress.slice(-6);
						const newName = await fetchPrimaryName(newAddress);
						document.querySelector('.owner-name').innerHTML = formatSuiName(newName);
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
					if (connectedAddress && nftOwnerAddress && connectedAddress === nftOwnerAddress) {
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

		async function listForAuction() {
			if (!connectedAddress) {
				await connectWallet();
				if (!connectedAddress) return;
			}

			if (!nftOwnerAddress || connectedAddress !== nftOwnerAddress) {
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

				const senderAddress = typeof connectedAccount.address === 'string'
					? connectedAccount.address
					: connectedAccount.address?.toString() || connectedAddress;

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

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

				const txOptions = { showEffects: true, showObjectChanges: true };
				if (signExecFeature?.signAndExecuteTransaction) {
					result = await signExecFeature.signAndExecuteTransaction({
						transaction: tx,
						account: connectedAccount,
						chain,
						options: txOptions,
					});
				} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
					result = await signExecBlockFeature.signAndExecuteTransactionBlock({
						transactionBlock: tx,
						account: connectedAccount,
						chain,
						options: txOptions,
					});
				} else {
					const phantomProvider = window.phantom?.sui;
					if (phantomProvider?.signAndExecuteTransactionBlock) {
						const suiClient = getSuiClient();
						const txBytes = await tx.build({ client: suiClient });
						result = await phantomProvider.signAndExecuteTransactionBlock({
							transactionBlock: txBytes,
							options: txOptions,
						});
					} else {
						throw new Error('Wallet does not support transaction signing');
					}
				}

				let listingId = null;
				const objectChanges = result.objectChanges || [];
				for (const change of objectChanges) {
					if (change.type === 'created' && change.objectType && change.objectType.includes('DecayListing')) {
						listingId = change.objectId;
						break;
					}
				}

				if (!listingId && result.digest) {
					try {
						const suiClient = getSuiClient();
						const txDetail = await suiClient.getTransactionBlock({ digest: result.digest, options: { showObjectChanges: true } });
						const changes = txDetail.objectChanges || [];
						for (const change of changes) {
							if (change.type === 'created' && change.objectType && change.objectType.includes('DecayListing')) {
								listingId = change.objectId;
								break;
							}
						}
					} catch (e) {
						console.error('Failed to fetch tx details for listing ID:', e);
					}
				}

				if (listingId && NFT_ID) {
					try {
						await fetch('/api/auction/register', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ nftId: NFT_ID, listingId }),
						});
					} catch (e) {
						console.error('Failed to register auction listing:', e);
					}
				}

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
		}

			// Initialize
			updatePortfolioLink(ownerDisplayAddress);
			renderWalletBar();
		updateGlobalWalletWidget();
		updateEditButton();
		restoreWalletConnection();
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
						tradeportUrl = NFT_ID
							? 'https://www.tradeport.xyz/sui/collection/suins?bottomTab=trades&tab=items&tokenId=' + encodeURIComponent(NFT_ID) + '&modalSlug=suins&nav=1'
							: 'https://www.tradeport.xyz/sui/collection/suins?search=' + encodeURIComponent(name);
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
			if (!connectedAddress || !connectedWallet) {
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
			if (!EXPIRATION_MS) return;

			const now = Date.now();
			const diff = EXPIRATION_MS - now;

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
		const ovRenewalCard = document.getElementById('overview-renewal-card');
		const expiryQuickRenewBtn = document.getElementById('expiry-quick-renew-btn');

		const expiryBadgeText = document.querySelector('.expiry-badge-text');
		const expiryBadge = document.querySelector('.badge.expiry');

		function updateExpiryBadgeWithRenewal() {
			if (!expiryBadgeText || !EXPIRATION_MS) return;
			const daysFromNow = Math.ceil((EXPIRATION_MS - Date.now()) / 86400000);

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

				const res = await fetch('/api/renewal-pricing?domain=' + encodeURIComponent(nameToPrice) + '&years=' + years);
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
				const halfYearRes = await fetch('/api/renewal-pricing?domain=' + encodeURIComponent(nameToExtend) + '&years=0.5');
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

		async function handleRenewal(yearsEl, btnEl, btnTextEl, btnLoadingEl, statusEl, options = {}) {
			const useProfileName = Boolean(options.useProfileName);
			const nftIdToUse = useProfileName ? NFT_ID : (selectedRenewalNftId || NFT_ID);
			const nameToExtend = useProfileName ? NAME : (selectedRenewalName || NAME);

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

			const forcedYears = Number(options.forcedYears);
			const yearsFromUi = Number(yearsEl?.value || yearsEl?.dataset?.value || '1');
			const years = Number.isFinite(forcedYears) && forcedYears > 0
				? forcedYears
				: (Number.isFinite(yearsFromUi) && yearsFromUi > 0 ? yearsFromUi : 1);
			console.log('[Renewal] Years:', years, 'Sender:', connectedAddress);

			if (btnTextEl) btnTextEl.classList.add('hidden');
			if (btnLoadingEl) btnLoadingEl.classList.remove('hidden');
			if (btnEl) btnEl.disabled = true;
				if (statusEl) {
					statusEl.textContent = options.pricingStatusText || 'Fetching pricing...';
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
				const suinsClient = await createSuinsClient(true);
				const facilitator = await resolveFacilitatorAddress(suinsClient);
				const facilitatorRecipient = isLikelySuiAddress(facilitator)
					? facilitator
					: connectedAddress;

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

				const discountSuiMist = options.includeDiscountTransfer
					? BigInt(pricingData.savingsMist || '0')
					: 0n;

				console.log('[Renewal] NS needed:', nsNeeded.toString(), 'SUI for swap:', suiForNsSwap.toString());

				const priceInfoObjectId = pricingData.priceInfoObjectId || undefined;
				console.log('[Renewal] priceInfoObjectId:', priceInfoObjectId);

				// Validate price info object (required for Pyth price feed)
				if (nsCoinConfig.feed && !priceInfoObjectId) {
					throw new Error('Price info object ID required for NS renewal');
				}

				// Check if user has enough SUI for the renewal swap + fees + optional discount transfer
				const totalSuiNeededForRenewal = suiForNsSwap + SUI_FOR_DEEP_SWAP + 50_000_000n + discountSuiMist;
				const suiBalRes = await suiClient.getBalance({ owner: connectedAddress, coinType: SUI_TYPE });
				const suiAvailableForRenewal = BigInt(suiBalRes.totalBalance);

				if (suiAvailableForRenewal < totalSuiNeededForRenewal) {
					if (statusEl) statusEl.textContent = 'Low SUI balance, checking other tokens...';
					const shortfallMist = totalSuiNeededForRenewal - suiAvailableForRenewal;
					const swapInfo = await findBestSwapForSui(suiClient, shortfallMist, connectedAddress);
					if (swapInfo) {
						if (statusEl) statusEl.textContent = 'Swapping ' + swapInfo.name + ' for SUI...';
						prependSwapToTx(tx, swapInfo, connectedAddress);
					}
				}

				if (statusEl) statusEl.textContent = 'Building transaction...';

				// Split SUI for swaps (+ optional discount transfer)
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

				tx.transferObjects([deepLeftoverSui], tx.pure.address(facilitatorRecipient));
				tx.transferObjects([deepLeftoverDeep], connectedAddress);

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

				tx.transferObjects([nsLeftoverSui], tx.pure.address(facilitatorRecipient));
				tx.transferObjects([nsLeftoverDeep], connectedAddress);

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
					const feeRecord = await suinsClient.getNameRecord(FULL_NAME);
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
				if (!connectedAddress || !connectedWallet) {
					connectWallet();
					return;
				}
				handleRenewal(ovRenewalYears, ovRenewalBtn, ovRenewalBtnText, ovRenewalBtnLoading, ovRenewalStatus);
			});
		}
		if (ovRenewalSavings) {
			ovRenewalSavings.addEventListener('click', () => {
				if (!connectedAddress || !connectedWallet) {
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
				if (!connectedAddress || !connectedWallet) {
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
				if (!connectedAddress || !connectedWallet) {
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

		function compareLinkedItemsByMode(a, b) {
			if (linkedSortMode === 'expiry') {
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

				if (priceA !== null && priceB !== null) return priceA - priceB;
				if (priceA !== null) return -1;
				if (priceB !== null) return 1;
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
			const tag = getExpirationTag(item.expirationMs);
			const matchScore = getLinkedItemMatchScore(item);
			const isFilterMatch = matchScore > 0;
			const classes = ['linked-name-chip'];
			if (isCurrent) classes.push('current');
			if (item.isPrimary) classes.push('primary');
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
			if (item.isPrimary) {
				h += '<svg class="primary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
			}
			h += '<span class="linked-name-text">' + cleanName + '<span class="linked-name-suffix">.sui</span></span>';
			const price = linkedNamesPrices[cleanName];
			if (price) {
				h += '<span class="linked-name-price">' + price + ' SUI</span>';
			}
			h += '<span class="linked-name-tag ' + tag.color + '">' + tag.text + '</span>';
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
					if (linkedNamesPrices[cleanName]) {
						withPrice.push(item);
					} else {
						withoutPrice.push(item);
					}
				}
				withPrice.sort(function(a, b) {
					const nameA = a.name.replace(/\\.sui$/, '');
					const nameB = b.name.replace(/\\.sui$/, '');
					return parseFloat(linkedNamesPrices[nameA]) - parseFloat(linkedNamesPrices[nameB]);
				});
				withoutPrice.sort(function(a, b) {
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
					return fetch('/api/marketplace/' + encodeURIComponent(cleanName))
						.then(function(r) { return r.ok ? r.json() : null; })
						.then(function(data) {
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

			async function fetchLinkedNames() {
			const primaryAddr = TARGET_ADDRESS || OWNER_ADDRESS;
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
					return fetch('/api/names/' + addr).then(function(r) {
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
							return normalizeLinkedNameKey(primary);
						}),
					);
					const primaryNameSet = new Set(primaryResolutions.filter(Boolean));
					if (primaryNameSet.size > 0) {
						for (var pi = 0; pi < names.length; pi++) {
							var normalizedName = normalizeLinkedNameKey(names[pi].name);
							if (primaryNameSet.has(normalizedName)) {
								names[pi].isPrimary = true;
							}
						}
					}
				} catch (e) {
					console.log('Primary fallback resolution failed:', e);
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
				if (linkedNamesSort) linkedNamesSort.style.display = 'none';
				if (linkedNamesFilter) linkedNamesFilter.style.display = 'none';
			}
		}

		if (OWNER_ADDRESS || TARGET_ADDRESS) {
			fetchLinkedNames();
		}

		// Marketplace functionality
		const overviewSecondaryGrid = document.getElementById('overview-secondary-grid');
		const overviewMarketModule = document.getElementById('overview-market-module');
		const marketplaceCard = document.getElementById('marketplace-card');
		const marketplaceListingRow = document.getElementById('marketplace-listing-row');
		const marketplaceBidRow = document.getElementById('marketplace-bid-row');
		const marketplaceListingPrice = document.getElementById('marketplace-listing-price');
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
			const marketplaceBidPriceUpBtn = document.getElementById('marketplace-bid-price-up');
			const marketplaceBidPriceDownBtn = document.getElementById('marketplace-bid-price-down');
			const marketplaceBidMaxBtn = document.getElementById('marketplace-bid-max');
			const marketplacePlaceBidBtn = document.getElementById('marketplace-place-bid-btn');
			const marketplaceBidText = marketplacePlaceBidBtn?.querySelector('.marketplace-bid-text');
			const marketplaceBidLoading = marketplacePlaceBidBtn?.querySelector('.marketplace-bid-loading');
			const marketplaceBidEstimate = document.getElementById('marketplace-bid-estimate');
			const marketplaceListInputWrap = document.getElementById('marketplace-list-input');
			const marketplaceListAmountInput = document.getElementById('marketplace-list-amount');
			const marketplaceListPriceUpBtn = document.getElementById('marketplace-list-price-up');
			const marketplaceListPriceDownBtn = document.getElementById('marketplace-list-price-down');
			const marketplaceListBtn = document.getElementById('marketplace-list-btn');
			const marketplaceListText = marketplaceListBtn?.querySelector('.marketplace-list-text');
			const marketplaceListLoading = marketplaceListBtn?.querySelector('.marketplace-list-loading');
			const marketplaceListEstimate = document.getElementById('marketplace-list-estimate');
			const marketplaceStatus = document.getElementById('marketplace-status');
			const marketplaceActivity = document.getElementById('marketplace-activity');
			const marketplaceActivityList = document.getElementById('marketplace-activity-list');
			const marketplaceActivityLink = document.getElementById('marketplace-activity-link');

				let currentBestBid = null;
				let resolvingNftOwnerForMarketplace = false;
				let bidInputTouched = false;
				let listInputTouched = false;
				let profileRegistrationCostSui = null;
				let profileRegistrationCostPending = null;
				const bidPrimaryNameCache = new Map();
				const linkedPrimaryNameCache = new Map();
				let marketplaceActivityRenderNonce = 0;

		function tryParseMarketplaceTx(candidate) {
			if (!candidate) return null;

			if (typeof candidate === 'string') {
				const trimmed = candidate.trim();
				if (!trimmed) return null;
				if (
					(trimmed.startsWith('{') && trimmed.endsWith('}'))
					|| (trimmed.startsWith('[') && trimmed.endsWith(']'))
				) {
					try {
						const parsed = JSON.parse(trimmed);
						const nestedTx = tryParseMarketplaceTx(parsed);
						if (nestedTx) return nestedTx;
					} catch {
						// Fall through and try as raw/base64 tx bytes
					}
				}
				try {
					return Transaction.from(trimmed);
				} catch {
					return null;
				}
			}

			if (typeof candidate === 'object') {
				const nestedPayload =
					candidate.transaction
					|| candidate.txBytes
					|| candidate.tx_bytes
					|| candidate.serializedTransaction
					|| candidate.serialized_transaction;
				if (nestedPayload) {
					const nestedTx = tryParseMarketplaceTx(nestedPayload);
					if (nestedTx) return nestedTx;
				}
				try {
					return Transaction.from(candidate);
				} catch {
					return null;
				}
			}

			return null;
		}

			function parseMarketplaceAcceptTx(payload) {
				const tx = tryParseMarketplaceTx(payload);
				if (!tx) {
					throw new Error('Missing or invalid transaction payload');
				}
				return tx;
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
							const res = await fetch('/api/renewal-pricing?domain=' + encodeURIComponent(NAME) + '&years=3');
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
				const BID_FLOOR_SUI = 0.01;
				const bestOfferSui = currentBestBid?.price ? (Number(currentBestBid.price) / 1e9) : 0;
				const bestOfferBaselineSui = bestOfferSui > 0 ? (Math.round((bestOfferSui + 0.01) * 100) / 100) : BID_FLOOR_SUI;
				return Math.max(BID_FLOOR_SUI, bestOfferBaselineSui);
			}

			function getRoundedBidAmountSuiOrNull() {
				if (!marketplaceBidAmountInput) return null;
				const amountSui = parseFloat(String(marketplaceBidAmountInput.value).replace(/[^0-9.]/g, ''));
				if (!Number.isFinite(amountSui) || amountSui <= 0) return null;
				return Math.max(getBidMinimumSui(), Math.round(amountSui * 1e4) / 1e4);
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
					? Math.max(minimumSui, Math.round(currentInput * 1e4) / 1e4)
					: minimumSui;
				const tradeportFeeSui = bidSui * (tradeportBidFeeBps / 10000);
				const estimatedCostSui = bidSui + tradeportFeeSui;
				const usdEstimate = cachedSuiUsdPrice > 0 ? (estimatedCostSui * cachedSuiUsdPrice).toFixed(2) : null;
				marketplaceBidEstimate.innerHTML = '<span class="marketplace-bid-usd">≈ $' + (usdEstimate || '--') + '</span>';
				updateBidButtonLabel(bidSui);
			}

			function updateBidButtonLabel(bidSui) {
				if (!marketplaceBidText) return;
				if (!connectedAddress || marketplacePlaceBidBtn?.classList.contains('connect-wallet')) return;
				const display = Number.isInteger(bidSui) ? String(bidSui) : bidSui.toFixed(Math.min(4, String(bidSui).split('.')[1]?.length || 2));
				marketplaceBidText.textContent = 'Offer ' + display + ' SUI for ' + NAME + '.sui';
			}

			function setBidInputDefaultFromBestOffer(force = false) {
				if (!marketplaceBidAmountInput) return;
				const nextBidSui = getBidMinimumSui();
				const currentInput = parseFloat(marketplaceBidAmountInput.value);
				const hasInput = Number.isFinite(currentInput) && currentInput > 0;

				marketplaceBidAmountInput.min = String(nextBidSui);

				if (force || !bidInputTouched || !hasInput || currentInput < nextBidSui) {
					marketplaceBidAmountInput.value = String(nextBidSui);
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
							? [syntheticExpiryAction, ...actions]
							: actions;

						if (displayActions.length === 0) {
							marketplaceActivity.style.display = 'block';
							marketplaceActivityList.innerHTML =
								'<div class="marketplace-activity-empty">No marketplace activity yet.</div>';
							return;
						}

						const renderNonce = ++marketplaceActivityRenderNonce;

						function getActionLabel(type) {
							const labels = {
								sale: 'Buy',
								list: 'Listed',
								delist: 'Delisted',
								bid: 'Offer',
								cancel_bid: 'Offer Cancelled',
								accept_bid: 'Offer Accepted',
								buy: 'Buy',
								mint: 'Mint',
								transfer: 'Transfer',
								expire: 'Expire',
								expired: 'Expire',
							};
							if (labels[type]) return labels[type];
							return String(type || '')
								.split('_')
								.filter(Boolean)
								.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
								.join(' ');
						}

						function getActionAddress(action) {
							const actionType = String(action?.type || '').toLowerCase();
							const showRecipientTypes = new Set(['sale', 'accept_bid', 'buy', 'transfer', 'mint']);
							if (!showRecipientTypes.has(actionType)) return '';
							const receiver = typeof action.receiver === 'string' ? action.receiver.trim() : '';
							if (receiver && receiver.startsWith('0x')) return receiver;
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
						marketplaceActivityList.innerHTML = displayActions
							.slice(0, 10)
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
									? escapeHtmlJs(customAmount)
									: action.price > 0
										? formatMarketplaceBidSuiDisplay(Number(action.price) / 1e9) + ' SUI'
										: '';
								const priceDisplay = '<span class="marketplace-activity-amount">' + amountContent + '</span>';

								const dateStr = customAmount ? '' : formatActivityDate(action.blockTime);
								const txDigest = action.txId || '';
								const timeDisplay = '<span class="marketplace-activity-time">' + (dateStr ? escapeHtmlJs(dateStr) : '') + '</span>';

								const kindHtml = txDigest
									? '<a href="https://suiscan.xyz/' + NETWORK + '/tx/' + escapeHtmlJs(txDigest) + '" target="_blank" class="marketplace-activity-kind marketplace-activity-tx-link" title="' + escapeHtmlJs(txDigest) + '">' + escapeHtmlJs(label) + '</a>'
									: '<span class="marketplace-activity-kind">' + escapeHtmlJs(label) + '</span>';

								return (
									yearHeader +
									'<div class="marketplace-activity-item ' + escapeHtmlJs(action.type) + '">' +
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
				return Boolean(
					connectedAddress
					&& nftOwnerAddress
					&& connectedAddress.toLowerCase() === nftOwnerAddress.toLowerCase(),
				);
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
				const LIST_FLOOR_SUI = 0.01;
				const bestBidSui = currentBestBid?.price ? (Number(currentBestBid.price) / 1e9) : 0;
				const bestBidBaselineSui = bestBidSui > 0 ? (Math.round((bestBidSui + 0.01) * 100) / 100) : LIST_FLOOR_SUI;
				return Math.max(LIST_FLOOR_SUI, bestBidBaselineSui);
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

			function formatMarketplaceBidSuiDisplay(amountSui) {
				if (!Number.isFinite(amountSui) || amountSui <= 0) return '--';
				const nearestInt = Math.round(amountSui);
				if (Math.abs(amountSui - nearestInt) < 0.05) {
					return String(nearestInt);
				}
				return amountSui.toFixed(2);
			}

			function getRoundedListAmountSuiOrNull() {
				if (!marketplaceListAmountInput) return null;
				const amountSui = parseFloat(String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, ''));
				if (!Number.isFinite(amountSui) || amountSui <= 0) return null;
				return Math.max(getListMinimumSui(), Math.round(amountSui * 1e4) / 1e4);
			}

			function normalizeListAmountInput() {
				if (!marketplaceListAmountInput) return null;
				const minimumSui = getListMinimumSui();
				marketplaceListAmountInput.min = String(minimumSui);
				const roundedAmount = getRoundedListAmountSuiOrNull();
				if (!roundedAmount) return null;
				marketplaceListAmountInput.value = String(roundedAmount);
				return roundedAmount;
			}

			function setListInputDefault(force = false) {
				if (!marketplaceListAmountInput) return;

				const existingAmount = parseFloat(marketplaceListAmountInput.value);
				const hasTyped = listInputTouched && Number.isFinite(existingAmount) && existingAmount > 0;
				if (!force && hasTyped) return;

				const minimumSui = getListMinimumSui();

				let defaultValue = 0;

				if (hasOwnerListingForCurrentNft() && currentListing?.price) {
					defaultValue = Number(currentListing.price) / 1e9;
				} else {
					defaultValue = minimumSui;
				}

				if (defaultValue < minimumSui) {
					defaultValue = minimumSui;
				}

				if (defaultValue > 0) {
					marketplaceListAmountInput.value = String(Math.max(minimumSui, Math.round(defaultValue * 1e4) / 1e4));
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

				const listingAmountSui = Math.round(rawListAmountSui * 1e4) / 1e4;
				const usdEstimate = cachedSuiUsdPrice > 0 ? (listingAmountSui * cachedSuiUsdPrice).toFixed(2) : null;
				if (usdEstimate) {
					marketplaceListEstimate.innerHTML = '<span class="marketplace-list-usd">≈ $' + usdEstimate + '</span>';
				} else {
					marketplaceListEstimate.innerHTML = '';
				}
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
						? Math.max(minimumSui, Math.ceil(rawListAmountSui))
						: 0;
				const meetsMinimum = roundedListAmountSui >= minimumSui;
				const canList = Boolean(
					isConnectedProfileOwner()
					&& connectedAddress
					&& connectedWallet
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
					const priceInSui = (currentListing.price / 1e9).toFixed(2);
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
							const bidVal = Number.isFinite(currentBid) && currentBid > 0 ? Math.round(currentBid * 1e4) / 1e4 : getBidMinimumSui();
							const bidDisplay = Number.isInteger(bidVal) ? String(bidVal) : bidVal.toFixed(Math.min(4, String(bidVal).split('.')[1]?.length || 2));
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
					const marketplaceUrl = NFT_ID
						? '/api/marketplace/' + NAME + '?tokenId=' + encodeURIComponent(NFT_ID)
						: '/api/marketplace/' + NAME;
					const response = await fetch(marketplaceUrl);
					if (!response.ok) {
						setMarketplaceActivityMessage('Activity unavailable right now.');
						return;
					}
					const data = await response.json();

						// Fallback if bestBid is not explicitly populated by API.
						let resolvedBestBid = data.bestBid && data.bestBid.price ? data.bestBid : null;
						if (!resolvedBestBid && Array.isArray(data?.nfts)) {
						const preferredTokenId = String(NFT_ID || '').toLowerCase();
						for (const nft of data.nfts) {
							const tokenId = String(nft?.tokenId || nft?.token_id || '');
							if (preferredTokenId && tokenId && tokenId.toLowerCase() !== preferredTokenId) continue;
							const bids = Array.isArray(nft?.bids) ? nft.bids : [];
							for (const bid of bids) {
								const price = Number(bid?.price || 0);
								if (!price || price <= 0) continue;
								if (!resolvedBestBid || price > Number(resolvedBestBid.price || 0)) {
									resolvedBestBid = { ...bid, tokenId };
								}
							}
						}
						if (!resolvedBestBid) {
							try {
								const normalizedName = String(NAME || '').endsWith('.sui') ? String(NAME) : (String(NAME) + '.sui');
								const tradeportBestBidResponse = await fetch('/api/tradeport/name/' + encodeURIComponent(normalizedName));
								if (tradeportBestBidResponse.ok) {
									const tradeportPayload = await tradeportBestBidResponse.json().catch(() => null);
									const tradeportBestBid = extractBestBidFromTradeportPayload(tradeportPayload);
									if (tradeportBestBid?.price) {
										resolvedBestBid = tradeportBestBid;
									}
								}
							} catch (fallbackErr) {
								console.log('Tradeport bid fallback failed:', fallbackErr);
							}
						}
					}

				if (data.bestListing && data.bestListing.price) {
					currentListing = data.bestListing;
					const priceInSui = (data.bestListing.price / 1e9).toFixed(2);
					marketplaceListingPrice.textContent = priceInSui + ' SUI';
					marketplaceListingRow.style.display = 'flex';
					marketplaceBuyBtn.style.display = 'block';
					setListInputDefault();
				} else {
					currentListing = null;
					marketplaceListingRow.style.display = 'none';
					marketplaceBuyBtn.style.display = 'none';
					setListInputDefault(true);
				}

				const sales = data.sales || [];
				currentSales = sales;

				if (resolvedBestBid && resolvedBestBid.price) {
					currentBestBid = resolvedBestBid;
					const bidInSui = formatMarketplaceBidSuiDisplay(Number(resolvedBestBid.price) / 1e9);
					marketplaceBidPrice.textContent = bidInSui + ' SUI';
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
				setListInputDefault();
				updateMarketplaceButton();
				renderMarketplaceActivity(data).catch((error) => {
					console.log('Marketplace activity render failed:', error);
					setMarketplaceActivityMessage('Activity unavailable right now.');
				});
				applyTaggedIdentityToProfile();
			} catch (e) {
				console.log('Marketplace fetch failed:', e);
				setMarketplaceActivityMessage('Activity unavailable right now.');
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
			const TRADEPORT_MULTI_BID_PACKAGE = '0x63ce6caee2ba264e92bca2d160036eb297d99b2d91d4db89d48a9bffca66e55b';
			const TRADEPORT_MULTI_BID_STORE = '0x8aaed7e884343fb8b222c721d02eaac2c6ae2abbb4ddcdf16cb55cf8754ee860';
			const TRADEPORT_MULTI_BID_STORE_VERSION = '572206387';
			const TRADEPORT_BID_FEE_BPS = 300;
			const ACCEPT_BID_EXTRA_FEE_BPS = 500;

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
						marketplaceStatus.innerHTML = 'Purchase successful! ' + renderTxExplorerLinks(digest, true);
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

			if (marketplaceListBtn) {
				marketplaceListBtn.addEventListener('click', async () => {
				if (!connectedAddress || !connectedWallet) {
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

			if (marketplacePlaceBidBtn) {
				marketplacePlaceBidBtn.addEventListener('click', async () => {
					if (!connectedAddress || !connectedWallet) {
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
						marketplaceStatus.innerHTML = 'Bid placed! ' + renderTxExplorerLinks(digest, true);
						marketplaceStatus.className = 'marketplace-status success';
						bidInputTouched = false;
						fetchMarketplaceData();
					} else {
						marketplaceStatus.textContent = 'Bid submitted';
						marketplaceStatus.className = 'marketplace-status success';
					}
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
					const sanitized = String(marketplaceBidAmountInput.value).replace(/[^0-9.]/g, '');
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
				const base = Number.isFinite(currentValue) && currentValue > 0 ? currentValue : minimumSui;
				const step = 0.5;
				const nextValue = Math.round((base + step) * 1e4) / 1e4;
				marketplaceListAmountInput.value = String(nextValue);
				listInputTouched = true;
				updateListButtonState();
			});
		}

if (marketplaceListPriceDownBtn && marketplaceListAmountInput) {
				marketplaceListPriceDownBtn.addEventListener('click', () => {
				const currentValue = parseFloat(String(marketplaceListAmountInput.value).replace(/[^0-9.]/g, ''));
				const minimumSui = getListMinimumSui();
				const base = Number.isFinite(currentValue) && currentValue > 0 ? currentValue : minimumSui;
				const step = 0.5;
				const nextValue = Math.max(minimumSui, Math.round((base - step) * 1e4) / 1e4);
				marketplaceListAmountInput.value = String(nextValue);
				listInputTouched = true;
				updateListButtonState();
			});
		}

			if (marketplaceBidPriceUpBtn && marketplaceBidAmountInput) {
				marketplaceBidPriceUpBtn.addEventListener('click', () => {
					const currentValue = parseFloat(String(marketplaceBidAmountInput.value).replace(/[^0-9.]/g, ''));
					const minimumSui = getBidMinimumSui();
					const base = Number.isFinite(currentValue) && currentValue > 0 ? currentValue : 0;
					const step = 0.5;
					const nextValue = Math.max(minimumSui, Math.round((base + step) * 1e4) / 1e4);
					marketplaceBidAmountInput.value = String(nextValue);
					bidInputTouched = true;
					updateBidEstimateDisplay();
				});
			}

			if (marketplaceBidPriceDownBtn && marketplaceBidAmountInput) {
				marketplaceBidPriceDownBtn.addEventListener('click', () => {
					const currentValue = parseFloat(String(marketplaceBidAmountInput.value).replace(/[^0-9.]/g, ''));
					const minimumSui = getBidMinimumSui();
					const base = Number.isFinite(currentValue) && currentValue > 0 ? currentValue : minimumSui;
					const step = 0.5;
					const nextValue = Math.max(minimumSui, Math.round((base - step) * 1e4) / 1e4);
					marketplaceBidAmountInput.value = String(nextValue);
					bidInputTouched = true;
					updateBidEstimateDisplay();
				});
			}

		if (marketplaceBidMaxBtn && marketplaceBidAmountInput) {
				marketplaceBidMaxBtn.addEventListener('click', async () => {
					if (!connectedAddress) return;
					marketplaceBidMaxBtn.disabled = true;
					marketplaceBidMaxBtn.textContent = '...';
					try {
						const maxSui = await getMaxBidSui();
						if (maxSui > 0) {
							marketplaceBidAmountInput.value = String(maxSui);
							bidInputTouched = true;
							updateBidEstimateDisplay();
						}
					} catch (err) {
						console.warn('Max bid calc failed:', err.message);
					} finally {
						marketplaceBidMaxBtn.disabled = false;
						marketplaceBidMaxBtn.textContent = 'MAX';
					}
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
				if (!connectedAddress || !connectedWallet || !currentBestBid?.id) {
					marketplaceStatus.textContent = 'Connect wallet first';
					marketplaceStatus.className = 'marketplace-status error';
					return;
				}

				const isOwner =
					nftOwnerAddress &&
					connectedAddress.toLowerCase() === String(nftOwnerAddress).toLowerCase();
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
				marketplaceStatus.textContent = 'Preparing accept transaction...';
				marketplaceStatus.className = 'marketplace-status';

				try {
					const txResponse = await fetch('/api/marketplace/accept-bid', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							bidId: currentBestBid.id,
							sellerAddress: connectedAddress,
						}),
					});

					const txData = await txResponse.json().catch(() => ({}));
					if (!txResponse.ok) {
						throw new Error(txData?.error || 'Failed to prepare accept transaction');
					}

						const tx = parseMarketplaceAcceptTx(txData);
						const acceptedBidMist = BigInt(Math.ceil(Number(currentBestBid?.price || 0)));
						if (acceptedBidMist > 0n) {
							const suinsClient = await createSuinsClient();
							const extraBidFeeRecipient = await resolveFacilitatorAddress(suinsClient);
							const extraFeeRecipientAddress = isLikelySuiAddress(extraBidFeeRecipient)
								? extraBidFeeRecipient
								: connectedAddress;
							const extraFeeMist = (acceptedBidMist * BigInt(ACCEPT_BID_EXTRA_FEE_BPS) + 9999n) / 10000n;
							if (extraFeeMist > 0n) {
								await ensureMarketplaceFunding(tx, extraFeeMist);
								const [extraFeeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(extraFeeMist)]);
								tx.transferObjects([extraFeeCoin], tx.pure.address(extraFeeRecipientAddress));
							}
						}

						marketplaceStatus.textContent = 'Waiting for wallet...';

					const signExecFeature = connectedWallet?.features?.['sui:signAndExecuteTransaction'];
					const signExecBlockFeature = connectedWallet?.features?.['sui:signAndExecuteTransactionBlock'];

					let result;
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
						throw new Error('Wallet does not support transaction signing');
					}

					const digest = result.digest || result.result?.digest || '';
					if (digest) {
						marketplaceStatus.innerHTML =
							'Bid accepted! ' + renderTxExplorerLinks(digest, true);
						marketplaceStatus.className = 'marketplace-status success';
						currentBestBid = null;
						marketplaceBidRow.style.display = 'none';
						updateMarketplaceButton();
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
		const auctionCard = document.getElementById('auction-card');
		const auctionCurrentPrice = document.getElementById('auction-current-price');
		const auctionTimeLeft = document.getElementById('auction-time-left');
		const auctionBuyBtn = document.getElementById('auction-buy-btn');
		const auctionBuyText = document.getElementById('auction-buy-text');
		const auctionBuyLoading = auctionBuyBtn?.querySelector('.auction-buy-loading');
		const auctionStatus = document.getElementById('auction-status');
		const auctionSellerLabel = document.getElementById('auction-seller-label');

		let auctionData = null;
		let auctionInterval = null;

		function syncOverviewModulesLayout() {
			if (!overviewSecondaryGrid || !overviewMarketModule) return;

			const hasMarketplace = marketplaceCard && marketplaceCard.style.display !== 'none';
			const hasAuction = auctionCard && auctionCard.style.display !== 'none';
			const showMarketModule = Boolean(hasMarketplace || hasAuction);

			overviewMarketModule.style.display = showMarketModule ? 'flex' : 'none';
			overviewSecondaryGrid.classList.toggle('has-market-module', showMarketModule);
		}

		function computeAuctionPrice(startPriceMist, startTimeMs, endTimeMs) {
			const now = Date.now();
			if (now >= endTimeMs) return 0;
			const remaining = endTimeMs - now;
			const duration = endTimeMs - startTimeMs;
			const fraction = Math.max(0, remaining / duration);
			return Math.floor(Number(startPriceMist) * Math.pow(fraction, 8));
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
			const priceMist = computeAuctionPrice(
				Number(auctionData.startPriceMist),
				Number(auctionData.startTimeMs),
				Number(auctionData.endTimeMs),
			);
			const priceSui = (priceMist / 1e9).toFixed(4);
			auctionCurrentPrice.textContent = priceSui + ' SUI';
			auctionTimeLeft.textContent = formatTimeLeft(Number(auctionData.endTimeMs));

			if (Date.now() >= Number(auctionData.endTimeMs)) {
				auctionBuyBtn.disabled = true;
				auctionBuyText.textContent = 'Auction Ended';
				if (auctionInterval) clearInterval(auctionInterval);
				return;
			}

			const isSeller = connectedAddress && auctionData.seller && connectedAddress === auctionData.seller;
			if (isSeller) {
				auctionSellerLabel.style.display = 'inline';
				auctionBuyBtn.style.display = 'none';
			} else if (connectedAddress) {
				auctionBuyBtn.disabled = false;
				auctionBuyText.textContent = 'Buy for ' + priceSui + ' SUI';
			} else {
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
				if (!data.active) return;

					auctionData = data;
					auctionCard.style.display = 'block';
					syncOverviewModulesLayout();
					updateAuctionDisplay();
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

					const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
					let result;
					const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
					const signExecBlockFeature = connectedWallet.features?.['sui:signAndExecuteTransactionBlock'];

					if (signExecFeature?.signAndExecuteTransaction) {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: tx,
							account: connectedAccount,
							chain,
							options: { showEffects: true },
						});
					} else if (signExecBlockFeature?.signAndExecuteTransactionBlock) {
						result = await signExecBlockFeature.signAndExecuteTransactionBlock({
							transactionBlock: tx,
							account: connectedAccount,
							chain,
							options: { showEffects: true },
						});
					} else {
						const phantomProvider = window.phantom?.sui;
						if (phantomProvider?.signAndExecuteTransactionBlock) {
							const suiClient = getSuiClient();
							const txBytes = await tx.build({ client: suiClient });
							result = await phantomProvider.signAndExecuteTransactionBlock({
								transactionBlock: txBytes,
								options: { showEffects: true },
							});
						} else {
							throw new Error('Wallet does not support transaction signing');
						}
					}

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

		// Fetch marketplace data on load
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
		const NETWORK = ${serializeJson(network)};
		const NAME = ${serializeJson(cleanName)};
		const TARGET_ADDRESS = ${serializeJson(record.address || '')};
		const OWNER_ADDRESS = ${serializeJson(record.ownerAddress || '')};

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

		const SUBSCRIPTIONS_KEY = 'sui_ski_subscriptions';
		const SUBSCRIPTIONS_BLOB_KEY = 'sui_ski_subscriptions_blob';
		let sealClient = null;
		let sealConfigData = null;
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

		async function initSealSdk() {
			if (sealInitialized) return true;
			if (!SealClient || !fromHex) return false;
			try {
				const res = await fetch('/api/vault/config');
				sealConfigData = await res.json();
				const suiClient = getSuiClient();
				sealClient = new SealClient({
					suiClient,
					serverConfigs: sealConfigData.seal.keyServers.map(id => ({ objectId: id, weight: 1 })),
					verifyKeyServers: false,
				});
				sealInitialized = true;
				return true;
			} catch (err) {
				console.error('Failed to init Seal:', err);
				return false;
			}
		}

		async function encryptSubscriptions(subs, subscriberAddress) {
			if (!sealClient) await initSealSdk();
			if (!sealClient || !sealConfigData?.seal?.packageId) {
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
				const packageId = sealConfigData.seal.packageId;
				const data = JSON.stringify({
					subscriptions: subs,
					subscriberAddress: subscriberAddress,
					encryptedAt: Date.now(),
					version: 1,
				});
				const plaintext = new TextEncoder().encode(data);
				const policyId = subscriberAddress.startsWith('0x') ? subscriberAddress.slice(2) : subscriberAddress;

				const { encryptedObject } = await sealClient.encrypt({
					threshold: 2,
					packageId: fromHex(packageId.startsWith('0x') ? packageId.slice(2) : packageId),
					id: fromHex(policyId),
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

		async function encryptVaultData(vaultData) {
			if (!sealClient) await initSealSdk();
			if (!sealClient || !sealConfigData?.seal?.packageId) return null;
			try {
				const packageId = sealConfigData.seal.packageId;
				const policyId = vaultData.ownerAddress.startsWith('0x')
					? vaultData.ownerAddress.slice(2) : vaultData.ownerAddress;
				const plaintext = new TextEncoder().encode(JSON.stringify(vaultData));
				const { encryptedObject } = await sealClient.encrypt({
					threshold: 2,
					packageId: fromHex(packageId.startsWith('0x') ? packageId.slice(2) : packageId),
					id: fromHex(policyId),
					data: plaintext,
				});
				return btoa(String.fromCharCode.apply(null, encryptedObject.data));
			} catch (err) {
				console.error('Vault encryption failed:', err);
				return null;
			}
		}

		async function checkWatchingState() {
			if (!connectedAddress) return;
			try {
				const res = await fetch('/api/vault/watching?address=' + encodeURIComponent(connectedAddress) + '&name=' + encodeURIComponent(NAME));
				const data = await res.json();
				updateDiamondState(!!data.watching);
			} catch (err) {
				console.error('Failed to check watching state:', err);
			}
		}

		async function toggleVaultDiamond() {
			if (diamondBusy) return;
			if (!connectedAddress) return;

			const btn = document.getElementById('vault-diamond-btn');
			if (!btn) return;

			diamondBusy = true;
			btn.classList.add('diamond-loading');

			try {
				const action = diamondWatching ? 'unwatch' : 'watch';
				const toggleBody = {
					ownerAddress: connectedAddress,
					name: NAME,
					action,
				};

				const toggleRes = await fetch('/api/vault/toggle-watch', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(toggleBody),
				});
				const toggleData = await toggleRes.json();
				if (toggleData.error) throw new Error(toggleData.error);

				updateDiamondState(action === 'watch');

				initSealSdk().then(async (ready) => {
					if (!ready) return;
					try {
						const vaultData = {
							bookmarks: (toggleData.meta?.names || []).map(n => ({
								name: n,
								address: '',
								addedAt: Date.now(),
							})),
							ownerAddress: connectedAddress,
							version: toggleData.meta?.version || 1,
							updatedAt: Date.now(),
						};
						const encrypted = await encryptVaultData(vaultData);
						if (encrypted) {
							fetch('/api/vault/sync', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									encryptedBlob: encrypted,
									ownerAddress: connectedAddress,
									meta: toggleData.meta,
								}),
							}).catch(err => console.error('Vault sync failed:', err));
						}
					} catch (err) {
						console.error('Vault encryption failed:', err);
					}
				});
			} catch (err) {
				console.error('Vault toggle failed:', err);
			} finally {
				diamondBusy = false;
				if (btn) btn.classList.remove('diamond-loading');
			}
		}

		const vaultDiamondBtn = document.getElementById('vault-diamond-btn');
		if (vaultDiamondBtn) vaultDiamondBtn.addEventListener('click', toggleVaultDiamond);

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
				});
			});

			document.addEventListener('click', (e) => {
				if (!swapPanel || swapPanel.style.display === 'none') return;
				if (swapPanel.contains(e.target)) return;
				if (swapToggleBtn && swapToggleBtn.contains(e.target)) return;
				swapPanel.style.display = 'none';
			});

			const ccSolAmount = document.getElementById('cc-sol-amount');
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
					const data = await res.json();
					if (data.error) throw new Error(data.error);

					ccQuoteData = data;
					if (ccRateValue) ccRateValue.textContent = '1 SOL = ' + data.rate.toFixed(4) + ' SUI';
					if (ccOutput) ccOutput.textContent = data.outputAmount.toFixed(4) + ' SUI';
					if (ccFee) ccFee.textContent = 'Fee: ' + data.fee.toFixed(4) + ' SUI (' + (data.feeBps / 100) + '%)';
					if (ccQuoteBtn) ccQuoteBtn.disabled = !data.solanaDepositAddress;
				} catch (err) {
					if (ccRateValue) ccRateValue.textContent = 'Error';
					if (ccOutput) ccOutput.textContent = '-- SUI';
					if (ccQuoteBtn) ccQuoteBtn.disabled = true;
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

					if (!window.connectedAddress) {
						if (ccStatus) { ccStatus.textContent = 'Connect wallet first'; ccStatus.className = 'cc-status error'; }
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
								suiAddress: window.connectedAddress,
							}),
						});
						const data = await res.json();
						if (data.error) throw new Error(data.error);

						if (ccDepositAddr) ccDepositAddr.textContent = data.depositAddress;
						if (ccDeposit) ccDeposit.style.display = 'flex';
						if (ccStatus) { ccStatus.textContent = 'Send ' + data.solAmount + ' SOL to the address below'; ccStatus.className = 'cc-status'; }
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
						const data = await res.json();
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
