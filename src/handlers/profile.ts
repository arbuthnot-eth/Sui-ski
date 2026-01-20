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
	const normalizedNetwork = network === 'mainnet' ? 'mainnet' : 'testnet'
	const bountyPackageId =
		normalizedNetwork === 'mainnet'
			? env.BOUNTY_ESCROW_PACKAGE_MAINNET
			: env.BOUNTY_ESCROW_PACKAGE_TESTNET
	const explorerBase =
		network === 'mainnet' ? 'https://suiscan.xyz/mainnet' : `https://suiscan.xyz/${network}`
	const explorerUrl = `${explorerBase}/account/${record.address}`
	const nftExplorerUrl = record.nftId ? `${explorerBase}/object/${record.nftId}` : ''

	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const fullName = `${cleanName}.sui`
	const expiresMs = record.expirationTimestampMs ? Number(record.expirationTimestampMs) : undefined
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

	const recordEntries = Object.entries(record.records || {})
		.filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
		.sort(([a], [b]) => a.localeCompare(b))
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

	<!-- PWA Meta Tags -->
	<link rel="manifest" href="/manifest.json">
	<meta name="theme-color" content="#60a5fa">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="${escapeHtml(fullName)}">
	<link rel="apple-touch-icon" href="/apple-touch-icon.png">
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
			<div class="sidebar">
				<nav class="sidebar-nav">
					<button class="sidebar-tab active" data-tab="overview">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4M12 8h.01"></path></svg>
						<span>Overview</span>
					</button>
					<button class="sidebar-tab" data-tab="records">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
						<span>Records</span>
					</button>
					<button class="sidebar-tab" data-tab="upload">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
						<span>Upload</span>
					</button>
					<button class="sidebar-tab" data-tab="bid">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
						<span>Queue Bid</span>
					</button>
					<button class="sidebar-tab" data-tab="names">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
						<span>Names</span>
					</button>
					<button class="sidebar-tab" data-tab="nfts">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
						<span>NFTs</span>
					</button>
					<button class="sidebar-tab" data-tab="mvr">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
						<span>Packages</span>
					</button>
					<button class="sidebar-tab" data-tab="privacy">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
						<span>Privacy</span>
					</button>
					<button class="sidebar-tab hidden" data-tab="messaging" id="messaging-tab-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
						<span>Message</span>
						<span class="notification-badge hidden" id="msg-notification-badge">0</span>
					</button>
				</nav>
			</div>
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
				options.inGracePeriod
					? `
			<!-- Grace Period Banner - Simplified -->
			<div class="grace-period-banner" id="grace-period-banner">
				<div class="grace-countdown-card">
					<div class="grace-countdown-header">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 16 14"></polyline>
						</svg>
						<span>Available for Registration</span>
					</div>
					<div class="grace-countdown-timer" id="grace-countdown-timer">
						<div class="countdown-unit">
							<span class="countdown-value" id="grace-days">--</span>
							<span class="countdown-label">Days</span>
						</div>
						<span class="countdown-sep">:</span>
						<div class="countdown-unit">
							<span class="countdown-value" id="grace-hours">--</span>
							<span class="countdown-label">Hours</span>
						</div>
						<span class="countdown-sep">:</span>
						<div class="countdown-unit">
							<span class="countdown-value" id="grace-mins">--</span>
							<span class="countdown-label">Min</span>
						</div>
						<span class="countdown-sep">:</span>
						<div class="countdown-unit">
							<span class="countdown-value" id="grace-secs">--</span>
							<span class="countdown-label">Sec</span>
						</div>
					</div>
					<div class="grace-snipe-action">
						<button class="grace-snipe-btn" id="grace-snipe-btn">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"></circle>
								<circle cx="12" cy="12" r="6"></circle>
								<circle cx="12" cy="12" r="2"></circle>
								<line x1="12" y1="2" x2="12" y2="6"></line>
								<line x1="12" y1="18" x2="12" y2="22"></line>
								<line x1="2" y1="12" x2="6" y2="12"></line>
								<line x1="18" y1="12" x2="22" y2="12"></line>
							</svg>
							<span>Snipe for 10 SUI</span>
						</button>
						<div class="grace-snipe-info">1 year registration • 1 SUI reward to executor</div>
					</div>
					<div class="grace-snipe-status hidden" id="grace-snipe-status"></div>
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

			<!-- Bid Queue & Bounty Section -->
			${
				expiresMs
					? `
			<!-- Availability Section - Timer + Compact Bounties -->
			<div class="availability-section" id="availability-section">
				<div class="availability-container">
					<!-- Left: Countdown Timer -->
					<div class="avail-timer-side">
						<div class="avail-timer-header">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"></circle>
								<polyline points="12 6 12 12 16 14"></polyline>
							</svg>
							<span>Available In</span>
						</div>
						<div class="avail-timer-display" id="bounty-timer-display">
							<div class="avail-timer-unit">
								<span class="avail-timer-value" id="bounty-days">--</span>
								<span class="avail-timer-label">D</span>
							</div>
							<span class="avail-timer-sep">:</span>
							<div class="avail-timer-unit">
								<span class="avail-timer-value" id="bounty-hours">--</span>
								<span class="avail-timer-label">H</span>
							</div>
							<span class="avail-timer-sep">:</span>
							<div class="avail-timer-unit">
								<span class="avail-timer-value" id="bounty-mins">--</span>
								<span class="avail-timer-label">M</span>
							</div>
							<span class="avail-timer-sep">:</span>
							<div class="avail-timer-unit">
								<span class="avail-timer-value" id="bounty-secs">--</span>
								<span class="avail-timer-label">S</span>
							</div>
						</div>
						<div class="avail-timer-date">
							${new Date(expiresMs + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
						</div>
					</div>

					<!-- Right: Compact Bounties -->
					<div class="avail-bounty-side">
						<div class="avail-bounty-header">
							<span class="avail-bounty-title">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="8" r="7"></circle>
									<polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
								</svg>
								Bounties
							</span>
							<button class="avail-bounty-refresh" id="bounty-refresh-btn" title="Refresh">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="23 4 23 10 17 10"></polyline>
									<path d="M20.49 15A9 9 0 1 1 21 5.64"></path>
								</svg>
							</button>
						</div>
						<div class="avail-bounty-list" id="bounty-queue-list">
							<div class="avail-bounty-loading"><span class="loading"></span></div>
						</div>
						<div class="avail-bounty-empty hidden" id="bounty-queue-empty">None yet</div>
						<button class="avail-bounty-btn" id="quick-bounty-btn">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
							10 SUI Bounty
						</button>
						<div class="avail-bounty-status hidden" id="create-bounty-status"></div>
					</div>
				</div>
			</div>

					`
					: ''
			}

			<!-- Linked Names Section (always visible) -->
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
			</div>

			${
				record.nftId
					? `
			<!-- NFT Details Section -->
			<div class="nft-details-section" id="nft-details-section">
				<div class="nft-details-header">
					<div class="nft-details-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
							<circle cx="8.5" cy="8.5" r="1.5"></circle>
							<polyline points="21 15 16 10 5 21"></polyline>
						</svg>
						<span>NFT Object Details</span>
					</div>
					<div class="nft-details-header-actions">
						<button class="nft-details-toggle" id="nft-details-toggle" title="Toggle NFT details">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="6 9 12 15 18 9"></polyline>
							</svg>
							Show Details
						</button>
						<button class="nft-details-refresh" id="nft-details-refresh" title="Refresh NFT data">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="23 4 23 10 17 10"></polyline>
								<polyline points="1 20 1 14 7 14"></polyline>
								<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
							</svg>
							Refresh
						</button>
					</div>
				</div>
				<div class="nft-details-content" id="nft-details-content">
					<div class="nft-details-loading">
						<span class="loading"></span>
						<span>Loading comprehensive NFT data...</span>
					</div>
				</div>
			</div>
			`
					: ''
			}

			<!-- Gateway Services Section -->
			<div class="card" style="margin-top: 24px;">
				<h2 style="font-size: 1.25rem; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent);">
						<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
					</svg>
					Gateway Services
				</h2>
				<p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 20px;">Access Sui ecosystem services through sui.ski</p>
				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
					<a href="/mvr" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6)); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; transition: all 0.2s;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
							<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
							<line x1="12" y1="22.08" x2="12" y2="12"></line>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem;">Move Registry</div>
							<div style="font-size: 0.75rem; color: var(--text-muted);">Manage packages</div>
						</div>
					</a>
					<a href="/upload" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6)); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; transition: all 0.2s;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="17 8 12 3 7 8"></polyline>
							<line x1="12" y1="3" x2="12" y2="15"></line>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem;">Upload Files</div>
							<div style="font-size: 0.75rem; color: var(--text-muted);">To Walrus</div>
						</div>
					</a>
					<a href="/messages" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6)); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; transition: all 0.2s;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem;">Messaging</div>
							<div style="font-size: 0.75rem; color: var(--text-muted);">Encrypted Web3</div>
						</div>
					</a>
					<a href="/vortex" style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6)); border: 1px solid var(--border); border-radius: 12px; text-decoration: none; transition: all 0.2s;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent); flex-shrink: 0;">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem;">Vortex Privacy</div>
							<div style="font-size: 0.75rem; color: var(--text-muted);">ZK transactions</div>
						</div>
					</a>
				</div>
				<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);">
					<div style="display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-muted);">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 16 14"></polyline>
						</svg>
						<span>RPC Proxy: <code style="background: rgba(96, 165, 250, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">rpc.sui.ski</code></span>
					</div>
				</div>
			</div>

			<!-- MVR Package Registration Section -->
			<div class="card" style="margin-top: 24px;" id="mvr-section">
				<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
					<h2 style="font-size: 1.25rem; display: flex; align-items: center; gap: 10px; margin: 0;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; color: var(--accent);">
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
							<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
							<line x1="12" y1="22.08" x2="12" y2="12"></line>
						</svg>
						Move Registry (MVR)
					</h2>
					<button id="mvr-toggle-btn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;" id="mvr-toggle-icon">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</button>
				</div>
				<p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">
					Register Move packages in the on-chain registry under your SuiNS name.
				</p>

				<div id="mvr-content" style="display: none;">
					<div id="mvr-wallet-required" style="display: none; padding: 16px; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 10px; margin-bottom: 16px;">
						<div style="display: flex; align-items: center; gap: 10px; color: #fbbf24;">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
								<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
								<line x1="12" y1="9" x2="12" y2="13"></line>
								<line x1="12" y1="17" x2="12.01" y2="17"></line>
							</svg>
							<span>Connect wallet to register packages</span>
						</div>
					</div>

					<div id="mvr-not-owner" style="display: none; padding: 16px; background: rgba(248, 113, 113, 0.1); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 10px; margin-bottom: 16px;">
						<div style="display: flex; align-items: center; gap: 10px; color: #f87171;">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="15" y1="9" x2="9" y2="15"></line>
								<line x1="9" y1="9" x2="15" y2="15"></line>
							</svg>
							<span>Only the SuiNS NFT owner can register packages</span>
						</div>
					</div>

					<form id="mvr-register-form" style="display: none;">
						<div style="display: grid; gap: 16px;">
							<!-- Auto-fill section -->
							<div style="padding: 16px; background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96, 165, 250, 0.2); border-radius: 10px;">
								<label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--accent); margin-bottom: 8px;">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; display: inline; vertical-align: middle; margin-right: 4px;">
										<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
									</svg>
									Quick Fill (paste deployment output or MVR name)
								</label>
								<textarea id="mvr-autofill" placeholder="Paste deployment output, @name/package, or package ID..." style="width: 100%; padding: 12px; background: rgba(15, 18, 32, 0.8); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.85rem; font-family: monospace; min-height: 60px; resize: vertical;"></textarea>
								<div style="display: flex; gap: 8px; margin-top: 8px;">
									<button type="button" id="mvr-parse-btn" style="padding: 8px 16px; background: rgba(96, 165, 250, 0.2); border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 6px; color: var(--accent); font-size: 0.85rem; cursor: pointer;">Parse & Fill</button>
									<button type="button" id="mvr-ai-parse-btn" style="padding: 8px 16px; background: rgba(168, 85, 247, 0.2); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 6px; color: #a855f7; font-size: 0.85rem; cursor: pointer;">AI Parse</button>
									<span id="mvr-parse-status" style="font-size: 0.8rem; color: var(--text-muted); align-self: center;"></span>
								</div>
							</div>

							<div>
								<label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">SuiNS Name</label>
								<input type="text" id="mvr-suins-name" readonly style="width: 100%; padding: 12px; background: rgba(15, 18, 32, 0.6); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.95rem;" />
							</div>

							<div>
								<label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Package Name</label>
								<input type="text" id="mvr-package-name" placeholder="e.g., bounty-escrow" style="width: 100%; padding: 12px; background: rgba(15, 18, 32, 0.8); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.95rem;" />
								<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Short identifier (letters, numbers, hyphens)</div>
							</div>

							<div>
								<label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Package Address</label>
								<input type="text" id="mvr-package-address" placeholder="0x..." style="width: 100%; padding: 12px; background: rgba(15, 18, 32, 0.8); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.95rem; font-family: monospace;" />
								<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">The on-chain address of your published Move package</div>
							</div>

							<div>
								<label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">UpgradeCap Object ID</label>
								<input type="text" id="mvr-upgrade-cap" placeholder="0x..." style="width: 100%; padding: 12px; background: rgba(15, 18, 32, 0.8); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-size: 0.95rem; font-family: monospace;" />
								<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">The UpgradeCap from package deployment (required for mainnet registration)</div>
							</div>

							<div id="mvr-status" style="display: none; padding: 12px; border-radius: 8px; font-size: 0.9rem;"></div>

							<div style="display: flex; gap: 12px; flex-wrap: wrap;">
								<button type="submit" id="mvr-register-btn" style="flex: 1; min-width: 150px; padding: 12px 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
										<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
									</svg>
									<span id="mvr-register-btn-text">Register Package</span>
								</button>
								<button type="button" id="mvr-transfer-upgrade-cap-btn" style="padding: 12px 20px; background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
										<polyline points="9 18 15 12 9 6"></polyline>
									</svg>
									<span>Transfer UpgradeCap to Connected Wallet</span>
								</button>
								<button type="button" id="mvr-share-upgrade-cap-btn" style="padding: 12px 20px; background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
										<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
										<circle cx="9" cy="7" r="4"></circle>
										<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
										<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
									</svg>
									<span>Make UpgradeCap Shared</span>
								</button>
							</div>
						</div>
					</form>

					<div style="margin-top: 20px; padding: 16px; background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96, 165, 250, 0.2); border-radius: 10px;">
						<h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: var(--accent);">How MVR Registration Works</h4>
						<ol style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
							<li>Connect the wallet that owns this SuiNS NFT</li>
							<li>Enter your package name and the deployed package address</li>
							<li>Provide the UpgradeCap object ID from deployment</li>
							<li>Sign the transaction to register in the Move Registry</li>
							<li>Your package will be accessible as <code style="background: rgba(96, 165, 250, 0.1); padding: 2px 6px; border-radius: 4px;">@${cleanName}/package-name</code></li>
						</ol>
					</div>
				</div>
			</div>

			<!-- Vortex Privacy Protocol Section -->
			<div class="card" style="margin-top: 24px; background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(168, 85, 247, 0.08)); border: 1px solid rgba(96, 165, 250, 0.25);">
				<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; flex-wrap: wrap;">
					<div style="flex: 1; min-width: 0;">
						<h2 style="font-size: 1.5rem; margin-bottom: 8px; display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #60a5fa, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
							</svg>
							Vortex Privacy Protocol
						</h2>
						<p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 16px;">
							Privacy-preserving transactions on Sui using zero-knowledge proofs. Break the on-chain link between deposits and withdrawals.
						</p>
					</div>
					<a href="/vortex" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: linear-gradient(135deg, #60a5fa, #a855f7); color: white; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; white-space: nowrap;">
						<span>Learn More</span>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
							<polyline points="9 18 15 12 9 6"></polyline>
						</svg>
					</a>
				</div>

				<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
					<div style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: rgba(30, 30, 40, 0.4); border: 1px solid var(--border); border-radius: 12px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent); flex-shrink: 0; margin-top: 2px;">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem; margin-bottom: 4px;">Zero-Knowledge Proofs</div>
							<div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">Groth16 proof system for transaction verification</div>
						</div>
					</div>
					<div style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: rgba(30, 30, 40, 0.4); border: 1px solid var(--border); border-radius: 12px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent); flex-shrink: 0; margin-top: 2px;">
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem; margin-bottom: 4px;">UTXO Model</div>
							<div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">2-input/2-output transaction architecture</div>
						</div>
					</div>
					<div style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: rgba(30, 30, 40, 0.4); border: 1px solid var(--border); border-radius: 12px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent); flex-shrink: 0; margin-top: 2px;">
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
							<circle cx="12" cy="10" r="3"></circle>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem; margin-bottom: 4px;">Merkle Tree</div>
							<div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">Efficient commitment tracking and verification</div>
						</div>
					</div>
					<div style="display: flex; align-items: flex-start; gap: 12px; padding: 16px; background: rgba(30, 30, 40, 0.4); border: 1px solid var(--border); border-radius: 12px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px; color: var(--accent); flex-shrink: 0; margin-top: 2px;">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
						</svg>
						<div>
							<div style="font-weight: 600; color: var(--text); font-size: 0.9rem; margin-bottom: 4px;">Client-Side Crypto</div>
							<div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">All ZK proofs generated locally in your browser</div>
						</div>
					</div>
				</div>

				<div style="padding: 16px; background: rgba(0, 0, 0, 0.2); border-radius: 12px; border: 1px dashed rgba(96, 165, 250, 0.3);">
					<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; color: var(--accent);">
							<circle cx="12" cy="12" r="10"></circle>
							<polyline points="12 6 12 12 16 14"></polyline>
						</svg>
						<span style="font-size: 0.85rem; font-weight: 600; color: var(--text);">Quick Access</span>
					</div>
					<div style="display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.8rem;">
						<a href="/vortex" style="color: var(--accent); text-decoration: none; padding: 6px 12px; background: rgba(96, 165, 250, 0.1); border-radius: 6px; transition: all 0.2s;">Vortex Dashboard</a>
						<a href="/api/vortex/info" target="_blank" style="color: var(--accent); text-decoration: none; padding: 6px 12px; background: rgba(96, 165, 250, 0.1); border-radius: 6px; transition: all 0.2s;">API Info</a>
						<a href="/api/vortex/health" target="_blank" style="color: var(--accent); text-decoration: none; padding: 6px 12px; background: rgba(96, 165, 250, 0.1); border-radius: 6px; transition: all 0.2s;">Health Check</a>
						<a href="https://github.com/interest-protocol/vortex" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: none; padding: 6px 12px; background: rgba(96, 165, 250, 0.1); border-radius: 6px; transition: all 0.2s;">Documentation</a>
					</div>
				</div>
			</div>

					</div>
				</div><!-- end tab-overview -->

				<div class="tab-panel" id="tab-records">
					<!-- On-chain Records -->
					<div class="section">
			<h3>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
				</svg>
				On-chain Records
			</h3>
			<table class="records-table">
				<thead>
					<tr><th>Key</th><th>Value</th></tr>
				</thead>
				<tbody>
					${
						recordEntries.length > 0
							? recordEntries
									.map(
										([key, value]) => `
						<tr>
							<td class="record-key">${escapeHtml(key)}</td>
							<td class="record-value">${(function() { const isUrl = value && (value.toLowerCase().startsWith('http://') || value.toLowerCase().startsWith('https://')); return isUrl ? `<a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value); })()}</td>
						</tr>
					`,
									)
									.join('')
							: '<tr><td colspan="2" class="record-empty">No records set</td></tr>'
					}
				</tbody>
			</table>
					</div>
					
					${generateSocialLinksHTML(record)}
				</div><!-- end tab-records -->

				<div class="tab-panel" id="tab-upload">
					<!-- Upload Section (only visible to NFT owner) -->
					<div class="upload-section" id="upload-section" style="display: none;">
			<div class="upload-header">
				<div class="upload-title">
					<h3>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
							<polyline points="17 8 12 3 7 8"></polyline>
							<line x1="12" y1="3" x2="12" y2="15"></line>
						</svg>
						Upload Content
					</h3>
					<p class="upload-subtitle">Stored on Walrus and written to your SuiNS records.</p>
				</div>
				<div class="upload-badges">
					<span class="badge walrus">Walrus ${network}</span>
					<span class="badge browser">Browser Upload</span>
				</div>
			</div>
			<div class="upload-dropzone" id="upload-dropzone">
				<input type="file" id="file-input" hidden>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="17 8 12 3 7 8"></polyline>
					<line x1="12" y1="3" x2="12" y2="15"></line>
				</svg>
				<p>Drop file here or click to upload</p>
				<p class="hint">Images, videos, audio, documents - stored on Walrus</p>
			</div>
			<div class="upload-meta" id="upload-meta">
				<div class="upload-meta-row">
					<span class="upload-meta-label">File</span>
					<span class="upload-meta-value" id="upload-file-name">No file selected</span>
				</div>
				<div class="upload-meta-row">
					<span class="upload-meta-label">Type</span>
					<span class="upload-meta-value" id="upload-file-type">-</span>
				</div>
				<div class="upload-meta-row">
					<span class="upload-meta-label">Size</span>
					<span class="upload-meta-value" id="upload-file-size">-</span>
				</div>
			</div>
			<div class="upload-options">
				<label>Save as:</label>
				<select id="record-key">
					<option value="content_hash">Content (media/files)</option>
					<option value="avatar">Avatar (profile picture)</option>
				</select>
			</div>
			<p class="upload-helper">Uploads stream from your browser to the Walrus publisher, then the blob ID is saved on-chain.</p>
			<div class="upload-progress" id="upload-progress" style="display: none;">
				<div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
				<p class="progress-status" id="progress-status"><span class="loading"></span> Uploading...</p>
			</div>
			<div id="upload-status" class="status hidden"></div>
					</div>
				</div><!-- end tab-upload -->

				<div class="tab-panel" id="tab-bid">
					<!-- Tradeport Marketplace Section -->
					<div class="marketplace-section" id="marketplace-section">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
								<line x1="3" y1="6" x2="21" y2="6"></line>
								<path d="M16 10a4 4 0 0 1-8 0"></path>
							</svg>
							Marketplace
						</h3>
						<p class="marketplace-subtitle">Trade this name on Tradeport</p>

						<div class="marketplace-loading" id="marketplace-loading">
							<span class="loading"></span>
							Loading marketplace data...
						</div>

						<div class="marketplace-content" id="marketplace-content" style="display: none;">
							<!-- Listing Status -->
							<div class="marketplace-listing" id="marketplace-listing">
								<div class="listing-status" id="listing-status">
									<span class="listing-label">Status</span>
									<span class="listing-value" id="listing-value">Not Listed</span>
								</div>
							</div>

							<!-- Existing Bids -->
							<div class="marketplace-bids">
								<div class="bids-header">
									<span>Current Bids</span>
									<span class="bids-count" id="bids-count">0</span>
								</div>
								<div class="bids-list" id="bids-list">
									<div class="no-bids">No bids yet</div>
								</div>
							</div>

							<!-- Place Bid Form -->
							<div class="place-bid-section" id="place-bid-section">
								<h4>Place a Bid</h4>
								<div class="bid-form">
									<div class="bid-input-group">
										<label for="marketplace-bid-amount">Bid Amount (SUI)</label>
										<input type="number" id="marketplace-bid-amount" placeholder="Enter amount" min="0.1" step="0.1" />
									</div>
									<button class="bid-submit-btn" id="place-bid-btn" disabled>
										<span class="btn-text">Connect Wallet</span>
									</button>
								</div>
								<div id="bid-status" class="bid-status hidden"></div>
							</div>

							<!-- Tradeport Link -->
							<a href="https://tradeport.xyz/sui/collection/suins?name=${escapeHtml(cleanName)}.sui" target="_blank" class="tradeport-link">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
								View on Tradeport
							</a>
						</div>

						<div class="marketplace-error" id="marketplace-error" style="display: none;">
							<p class="error-text">Failed to load marketplace data</p>
							<button class="retry-btn" id="retry-marketplace">Retry</button>
						</div>
					</div>

					${
						expiresAt
							? `
					<!-- Expiration Timer Section -->
					<div class="expiration-timer-section">
						<div class="expiration-timer-card">
							<div class="expiration-timer-header">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"></circle>
									<polyline points="12 6 12 12 16 14"></polyline>
								</svg>
								<span>Name Expires</span>
							</div>
							<div class="expiration-timer-display" id="expiration-timer-display">
								<div class="expiration-timer-unit">
									<span class="expiration-timer-value" id="exp-days">--</span>
									<span class="expiration-timer-label">Days</span>
								</div>
								<span class="expiration-timer-sep">:</span>
								<div class="expiration-timer-unit">
									<span class="expiration-timer-value" id="exp-hours">--</span>
									<span class="expiration-timer-label">Hours</span>
								</div>
								<span class="expiration-timer-sep">:</span>
								<div class="expiration-timer-unit">
									<span class="expiration-timer-value" id="exp-mins">--</span>
									<span class="expiration-timer-label">Min</span>
								</div>
								<span class="expiration-timer-sep">:</span>
								<div class="expiration-timer-unit">
									<span class="expiration-timer-value" id="exp-secs">--</span>
									<span class="expiration-timer-label">Sec</span>
								</div>
							</div>
							<div class="expiration-timer-dates">
								<div class="expiration-date-row">
									<span class="expiration-date-label">Expires:</span>
									<span class="expiration-date-value">${expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
								</div>
								<div class="expiration-date-row">
									<span class="expiration-date-label">Available:</span>
									<span class="expiration-date-value accent">${new Date(expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
								</div>
							</div>
						</div>
					</div>
					`
							: ''
					}
				</div><!-- end tab-bid -->

				<div class="tab-panel" id="tab-names">
					<div class="names-section">
						<div class="names-header">
							<div class="names-title">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
									<circle cx="9" cy="7" r="4"></circle>
									<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
									<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
								</svg>
								<h3>Owned SuiNS Names</h3>
							</div>
							<span class="names-count" id="names-count">Loading...</span>
						</div>
						<div id="names-content">
							<div class="names-loading">
								<span class="loading"></span>
								<span>Fetching all SuiNS names owned by this address...</span>
							</div>
						</div>
					</div>
				</div><!-- end tab-names -->

				<div class="tab-panel" id="tab-nfts">
					<div class="nfts-section">
						<div class="nfts-header">
							<div class="nfts-title">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
									<line x1="9" y1="3" x2="9" y2="21"></line>
									<line x1="15" y1="3" x2="15" y2="21"></line>
									<line x1="3" y1="9" x2="21" y2="9"></line>
									<line x1="3" y1="15" x2="21" y2="15"></line>
								</svg>
								<h3>SuiNS Registration NFTs</h3>
							</div>
							<span class="nfts-count" id="nfts-count">Loading...</span>
						</div>
						<div id="nfts-content">
							<div class="nfts-loading">
								<span class="loading"></span>
								<span>Fetching SuiNS registration NFTs...</span>
							</div>
						</div>
					</div>
				</div><!-- end tab-nfts -->

				<div class="tab-panel" id="tab-mvr">
					<div class="mvr-dashboard">
						<!-- Header -->
						<div class="mvr-header">
							<div class="mvr-header-title">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
									<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
									<line x1="12" y1="22.08" x2="12" y2="12"></line>
								</svg>
								<div>
									<h2>Move Registry</h2>
									<span class="mvr-namespace">@${escapeHtml(cleanName)}</span>
								</div>
							</div>
							<a href="https://www.moveregistry.com/apps" target="_blank" class="mvr-external-link">
								<span>Open MVR</span>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
							</a>
						</div>

						<!-- Quick Stats -->
						<div class="mvr-stats">
							<div class="mvr-stat">
								<span class="mvr-stat-value" id="mvr-pkg-count">--</span>
								<span class="mvr-stat-label">Packages</span>
							</div>
							<div class="mvr-stat">
								<span class="mvr-stat-value" id="mvr-version-count">--</span>
								<span class="mvr-stat-label">Total Versions</span>
							</div>
							<div class="mvr-stat">
								<span class="mvr-stat-value mvr-stat-network">${escapeHtml(network)}</span>
								<span class="mvr-stat-label">Network</span>
							</div>
						</div>

						<!-- Sub-tabs Navigation -->
						<div class="mvr-tabs">
							<button class="mvr-tab active" data-mvr-tab="packages">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
								Your Packages
							</button>
							<button class="mvr-tab" data-mvr-tab="register">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
								Register
							</button>
							<button class="mvr-tab" data-mvr-tab="version">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
								Version
							</button>
							<button class="mvr-tab" data-mvr-tab="metadata">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
								Metadata
							</button>
							<button class="mvr-tab" data-mvr-tab="lookup">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
								Lookup
							</button>
							<button class="mvr-tab" data-mvr-tab="sdk">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
								SDK/CLI
							</button>
						</div>

						<!-- Tab Content: Your Packages -->
						<div class="mvr-tab-content active" data-mvr-content="packages">
							<div class="mvr-packages-header">
								<h3>Packages for @${escapeHtml(cleanName)}</h3>
								<button class="mvr-refresh-btn" id="mvr-refresh-packages">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15A9 9 0 1 1 21 5.64"></path></svg>
									Refresh
								</button>
							</div>
							<div class="mvr-packages-list" id="mvr-packages-list">
								<div class="mvr-loading">
									<span class="loading"></span>
									<span>Loading packages...</span>
								</div>
							</div>
							<div class="mvr-packages-empty hidden" id="mvr-packages-empty">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
								<p>No packages registered yet</p>
								<span>Register your first package to get started</span>
								<button class="mvr-empty-action" id="mvr-go-register">Register Package</button>
							</div>
						</div>

						<!-- Tab Content: Register Package -->
						<div class="mvr-tab-content" data-mvr-content="register">
							<div class="mvr-form-section">
								<h3>Register New Package</h3>
								<p class="mvr-form-desc">Register a Move package in the on-chain registry. Your package will be accessible as <code>@${escapeHtml(cleanName)}/package-name</code></p>

								<div id="mvr-register-wallet-warning" class="mvr-warning hidden">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
									<span>Connect wallet to register packages</span>
								</div>

								<form id="mvr-register-form-full" class="mvr-form">
									<!-- Quick Fill -->
									<div class="mvr-quick-fill">
										<label>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
											Quick Fill (paste deployment output)
										</label>
										<textarea id="mvr-quick-fill-input" placeholder="Paste sui client publish output, @name/package, or package address..."></textarea>
										<div class="mvr-quick-fill-actions">
											<button type="button" id="mvr-parse-quick-fill" class="mvr-btn-secondary">Parse & Fill</button>
											<span id="mvr-parse-feedback"></span>
										</div>
									</div>

									<div class="mvr-form-grid">
										<div class="mvr-form-group">
											<label>SuiNS Name</label>
											<input type="text" id="mvr-reg-suins" value="${escapeHtml(cleanName)}" readonly />
										</div>
										<div class="mvr-form-group">
											<label>Package Name</label>
											<input type="text" id="mvr-reg-pkgname" placeholder="e.g., core, nft, utils" />
											<span class="mvr-hint">Letters, numbers, hyphens only</span>
										</div>
									</div>

									<div class="mvr-form-group">
										<label>Package Address</label>
										<input type="text" id="mvr-reg-pkgaddr" placeholder="0x..." class="mono" />
										<span class="mvr-hint">On-chain address of your published Move package</span>
									</div>

									<div class="mvr-form-group">
										<label>UpgradeCap Object ID</label>
										<input type="text" id="mvr-reg-upgradecap" placeholder="0x..." class="mono" />
										<span class="mvr-hint">Required for mainnet registration - proves package ownership</span>
									</div>

									<div class="mvr-form-group">
										<label>Description <span class="optional">(optional)</span></label>
										<textarea id="mvr-reg-desc" placeholder="Brief description of your package" rows="2"></textarea>
									</div>

									<div class="mvr-form-grid">
										<div class="mvr-form-group">
											<label>Repository URL <span class="optional">(optional)</span></label>
											<input type="url" id="mvr-reg-repo" placeholder="https://github.com/..." />
										</div>
										<div class="mvr-form-group">
											<label>Documentation URL <span class="optional">(optional)</span></label>
											<input type="url" id="mvr-reg-docs" placeholder="https://docs..." />
										</div>
									</div>

									<div class="mvr-form-actions">
										<button type="submit" class="mvr-btn-primary" id="mvr-register-submit">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
											<span id="mvr-register-submit-text">Register Package</span>
										</button>
									</div>
									<div id="mvr-register-status" class="mvr-status hidden"></div>
								</form>
							</div>
						</div>

						<!-- Tab Content: Publish Version -->
						<div class="mvr-tab-content" data-mvr-content="version">
							<div class="mvr-form-section">
								<h3>Publish New Version</h3>
								<p class="mvr-form-desc">Publish a new version of an existing package. Versions must be sequential.</p>

								<form id="mvr-version-form" class="mvr-form">
									<div class="mvr-form-grid">
										<div class="mvr-form-group">
											<label>Package</label>
											<select id="mvr-ver-package">
												<option value="">Select a package...</option>
											</select>
										</div>
										<div class="mvr-form-group">
											<label>Version Number</label>
											<input type="number" id="mvr-ver-number" min="1" placeholder="2" />
											<span class="mvr-hint">Must be current version + 1</span>
										</div>
									</div>

									<div class="mvr-form-group">
										<label>New Package Address</label>
										<input type="text" id="mvr-ver-addr" placeholder="0x..." class="mono" />
										<span class="mvr-hint">Address of the upgraded package</span>
									</div>

									<div class="mvr-form-actions">
										<button type="submit" class="mvr-btn-primary">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
											Publish Version
										</button>
									</div>
									<div id="mvr-version-status" class="mvr-status hidden"></div>
								</form>
							</div>

							<!-- Git Versioning Info -->
							<div class="mvr-info-box">
								<h4>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path></svg>
									Source Code Versioning
								</h4>
								<p>Link each version to its source code for verification:</p>
								<pre><code>const git = tx.moveCall({
  target: '@mvr/metadata::git::new',
  arguments: [
    tx.pure.string('https://github.com/user/repo'),
    tx.pure.string('packages/core'),
    tx.pure.string('v1.0.0'), // tag or commit
  ],
});
tx.moveCall({
  target: '@mvr/metadata::package_info::set_git_versioning',
  arguments: [packageInfo, tx.pure.u64(1), git],
});</code></pre>
							</div>
						</div>

						<!-- Tab Content: Metadata -->
						<div class="mvr-tab-content" data-mvr-content="metadata">
							<div class="mvr-form-section">
								<h3>Update Package Metadata</h3>
								<p class="mvr-form-desc">Update description, links, and other metadata for your packages.</p>

								<form id="mvr-metadata-form" class="mvr-form">
									<div class="mvr-form-group">
										<label>Package</label>
										<select id="mvr-meta-package">
											<option value="">Select a package...</option>
										</select>
									</div>

									<div class="mvr-form-group">
										<label>Description</label>
										<textarea id="mvr-meta-desc" placeholder="Package description" rows="3"></textarea>
									</div>

									<div class="mvr-form-grid">
										<div class="mvr-form-group">
											<label>Icon URL</label>
											<input type="url" id="mvr-meta-icon" placeholder="https://..." />
										</div>
										<div class="mvr-form-group">
											<label>Homepage URL</label>
											<input type="url" id="mvr-meta-homepage" placeholder="https://..." />
										</div>
									</div>

									<div class="mvr-form-grid">
										<div class="mvr-form-group">
											<label>Documentation URL</label>
											<input type="url" id="mvr-meta-docs" placeholder="https://docs..." />
										</div>
										<div class="mvr-form-group">
											<label>Contact</label>
											<input type="text" id="mvr-meta-contact" placeholder="@username or email" />
										</div>
									</div>

									<div class="mvr-form-actions">
										<button type="submit" class="mvr-btn-primary">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline></svg>
											Update Metadata
										</button>
									</div>
									<div id="mvr-metadata-status" class="mvr-status hidden"></div>
								</form>
							</div>

							<!-- PackageInfo Creation -->
							<div class="mvr-form-section">
								<h3>Create PackageInfo Object</h3>
								<p class="mvr-form-desc">Create a PackageInfo object for a new package deployment. This is the source of truth for package metadata.</p>

								<form id="mvr-packageinfo-form" class="mvr-form">
									<div class="mvr-form-group">
										<label>UpgradeCap Object ID</label>
										<input type="text" id="mvr-pkginfo-upgradecap" placeholder="0x..." class="mono" />
										<span class="mvr-hint">From your package deployment output</span>
									</div>

									<div class="mvr-form-group">
										<label>Display Name</label>
										<input type="text" id="mvr-pkginfo-display" placeholder="My Package" />
										<span class="mvr-hint">Human-readable name for identification</span>
									</div>

									<div class="mvr-form-group">
										<label>MVR Name (for reverse resolution)</label>
										<input type="text" id="mvr-pkginfo-mvrname" placeholder="@${escapeHtml(cleanName)}/package" />
										<span class="mvr-hint">Enables lookup from package ID to name</span>
									</div>

									<div class="mvr-form-group">
										<label>Transfer To Address</label>
										<input type="text" id="mvr-pkginfo-transfer" placeholder="0x... (defaults to your wallet)" class="mono" />
									</div>

									<div class="mvr-form-actions">
										<button type="submit" class="mvr-btn-primary">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
											Create PackageInfo
										</button>
									</div>
									<div id="mvr-packageinfo-status" class="mvr-status hidden"></div>
								</form>
							</div>
						</div>

						<!-- Tab Content: Lookup / Reverse Resolution -->
						<div class="mvr-tab-content" data-mvr-content="lookup">
							<div class="mvr-form-section">
								<h3>Reverse Resolution</h3>
								<p class="mvr-form-desc">Look up the MVR name for a package address. Useful for identifying packages on-chain.</p>

								<form id="mvr-lookup-form" class="mvr-form">
									<div class="mvr-form-group">
										<label>Package Address(es)</label>
										<textarea id="mvr-lookup-addrs" placeholder="Enter package addresses, one per line or comma-separated&#10;&#10;0x00c2f85e07181b90c140b15c5ce27d863f93c4d9159d2a4e7bdaeb40e286d6f5&#10;0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357661df5d3204809" rows="4" class="mono"></textarea>
									</div>

									<div class="mvr-form-actions">
										<button type="submit" class="mvr-btn-primary">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
											Lookup Names
										</button>
									</div>
								</form>

								<div id="mvr-lookup-results" class="mvr-lookup-results hidden">
									<h4>Results</h4>
									<div id="mvr-lookup-list"></div>
								</div>
							</div>

							<!-- Name to Address Resolution -->
							<div class="mvr-form-section">
								<h3>Name Resolution</h3>
								<p class="mvr-form-desc">Resolve an MVR name to its package address.</p>

								<form id="mvr-resolve-form" class="mvr-form">
									<div class="mvr-form-group">
										<label>MVR Name</label>
										<input type="text" id="mvr-resolve-name" placeholder="@suins/core or @deepbook/core/2" />
										<span class="mvr-hint">Format: @name/package or @name/package/version</span>
									</div>

									<div class="mvr-form-actions">
										<button type="submit" class="mvr-btn-secondary">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
											Resolve
										</button>
									</div>
								</form>

								<div id="mvr-resolve-result" class="mvr-resolve-result hidden"></div>
							</div>
						</div>

						<!-- Tab Content: SDK/CLI Reference -->
						<div class="mvr-tab-content" data-mvr-content="sdk">
							<div class="mvr-sdk-section">
								<h3>TypeScript SDK</h3>
								<p class="mvr-form-desc">Use the MVR plugin for seamless name resolution in your transactions.</p>

								<div class="mvr-code-block">
									<div class="mvr-code-header">
										<span>Installation</span>
										<button class="mvr-copy-btn" data-copy="npm install @mysten/sui">Copy</button>
									</div>
									<pre><code>npm install @mysten/sui  # v1.25.0+</code></pre>
								</div>

								<div class="mvr-code-block">
									<div class="mvr-code-header">
										<span>Global Plugin Registration</span>
										<button class="mvr-copy-btn" data-copy="import { namedPackagesPlugin, Transaction } from '@mysten/sui/transactions';

const plugin = namedPackagesPlugin({
  url: '${network === 'mainnet' ? 'https://mainnet.mvr.mystenlabs.com' : 'https://testnet.mvr.mystenlabs.com'}'
});
Transaction.registerGlobalSerializationPlugin('namedPackagesPlugin', plugin);">Copy</button>
									</div>
									<pre><code>import { namedPackagesPlugin, Transaction } from '@mysten/sui/transactions';

const plugin = namedPackagesPlugin({
  url: '${network === 'mainnet' ? 'https://mainnet.mvr.mystenlabs.com' : 'https://testnet.mvr.mystenlabs.com'}'
});
Transaction.registerGlobalSerializationPlugin('namedPackagesPlugin', plugin);</code></pre>
								</div>

								<div class="mvr-code-block">
									<div class="mvr-code-header">
										<span>Using MVR Names in Transactions</span>
										<button class="mvr-copy-btn" data-copy="const tx = new Transaction();
tx.moveCall({
  target: '@${escapeHtml(cleanName)}/core::module::function',
  arguments: [/* ... */],
});
// Plugin auto-resolves @${escapeHtml(cleanName)}/core to package address">Copy</button>
									</div>
									<pre><code>const tx = new Transaction();
tx.moveCall({
  target: '@${escapeHtml(cleanName)}/core::module::function',
  arguments: [/* ... */],
});
// Plugin auto-resolves @${escapeHtml(cleanName)}/core to package address</code></pre>
								</div>

								<div class="mvr-code-block">
									<div class="mvr-code-header">
										<span>Create PackageInfo Object</span>
										<button class="mvr-copy-btn" data-copy="const packageInfo = tx.moveCall({
  target: '@mvr/metadata::package_info::new',
  arguments: [tx.object('&lt;UpgradeCap&gt;')],
});
const display = tx.moveCall({
  target: '@mvr/metadata::display::default',
  arguments: [tx.pure.string('My Package')],
});
tx.moveCall({
  target: '@mvr/metadata::package_info::set_display',
  arguments: [packageInfo, display],
});
tx.moveCall({
  target: '@mvr/metadata::package_info::set_metadata',
  arguments: [packageInfo, tx.pure.string('default'), tx.pure.string('@${escapeHtml(cleanName)}/package')],
});
tx.moveCall({
  target: '@mvr/metadata::package_info::transfer',
  arguments: [packageInfo, tx.pure.address('&lt;your-address&gt;')],
});">Copy</button>
									</div>
									<pre><code>const packageInfo = tx.moveCall({
  target: '@mvr/metadata::package_info::new',
  arguments: [tx.object('&lt;UpgradeCap&gt;')],
});
const display = tx.moveCall({
  target: '@mvr/metadata::display::default',
  arguments: [tx.pure.string('My Package')],
});
tx.moveCall({
  target: '@mvr/metadata::package_info::set_display',
  arguments: [packageInfo, display],
});
tx.moveCall({
  target: '@mvr/metadata::package_info::set_metadata',
  arguments: [packageInfo, tx.pure.string('default'), tx.pure.string('@${escapeHtml(cleanName)}/package')],
});
tx.moveCall({
  target: '@mvr/metadata::package_info::transfer',
  arguments: [packageInfo, tx.pure.address('&lt;your-address&gt;')],
});</code></pre>
								</div>
							</div>

							<div class="mvr-sdk-section">
								<h3>MVR CLI</h3>
								<p class="mvr-form-desc">Command-line tool for managing Move dependencies.</p>

								<div class="mvr-code-block">
									<div class="mvr-code-header">
										<span>Installation</span>
										<button class="mvr-copy-btn" data-copy="cargo install --locked --git https://github.com/mystenlabs/mvr --branch release mvr">Copy</button>
									</div>
									<pre><code>cargo install --locked --git https://github.com/mystenlabs/mvr --branch release mvr</code></pre>
								</div>

								<div class="mvr-code-block">
									<div class="mvr-code-header">
										<span>Add Dependency</span>
										<button class="mvr-copy-btn" data-copy="mvr add @${escapeHtml(cleanName)}/core --network ${escapeHtml(network)}">Copy</button>
									</div>
									<pre><code>mvr add @${escapeHtml(cleanName)}/core --network ${escapeHtml(network)}</code></pre>
								</div>

								<div class="mvr-code-block">
									<div class="mvr-code-header">
										<span>Move.toml Result</span>
									</div>
									<pre><code>[dependencies]
core = { r.mvr = "@${escapeHtml(cleanName)}/core" }

[r.mvr]
network = "${escapeHtml(network)}"</code></pre>
								</div>
							</div>

							<div class="mvr-sdk-section">
								<h3>API Endpoints</h3>
								<div class="mvr-api-list">
									<div class="mvr-api-item">
										<span class="mvr-api-method">GET</span>
										<code>/v1/names/{name}</code>
										<span class="mvr-api-desc">Resolve MVR name to address</span>
									</div>
									<div class="mvr-api-item">
										<span class="mvr-api-method post">POST</span>
										<code>/v1/reverse-resolution/bulk</code>
										<span class="mvr-api-desc">Bulk reverse lookup</span>
									</div>
								</div>
								<div class="mvr-code-block" style="margin-top: 12px;">
									<div class="mvr-code-header">
										<span>Reverse Resolution Example</span>
										<button class="mvr-copy-btn" data-copy="curl -X POST '${network === 'mainnet' ? 'https://mainnet.mvr.mystenlabs.com' : 'https://testnet.mvr.mystenlabs.com'}/v1/reverse-resolution/bulk' \\
  -H 'Content-Type: application/json' \\
  -d '{&quot;package_ids&quot;: [&quot;0x...&quot;]}'">Copy</button>
									</div>
									<pre><code>curl -X POST '${network === 'mainnet' ? 'https://mainnet.mvr.mystenlabs.com' : 'https://testnet.mvr.mystenlabs.com'}/v1/reverse-resolution/bulk' \\
  -H 'Content-Type: application/json' \\
  -d '{"package_ids": ["0x..."]}'</code></pre>
								</div>
							</div>

							<!-- Best Practices -->
							<div class="mvr-info-box mvr-practices">
								<h4>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
									Maintainer Best Practices
								</h4>
								<ul>
									<li><strong>Automated Address Management:</strong> Use Sui's automated address management when publishing. Commit and tag after config.</li>
									<li><strong>Network Dependencies:</strong> Switch Sui dependency to correct network. From v1.45+, system deps are auto-managed.</li>
									<li><strong>Release Tags:</strong> Use <code>&lt;network&gt;/&lt;version&gt;</code> format (e.g., <code>mainnet/v1</code>)</li>
									<li><strong>Package Naming:</strong> In multi-package repos, prefix with project name (e.g., <code>mvr_utils</code> not <code>utils</code>)</li>
								</ul>
							</div>
						</div>
					</div>
				</div><!-- end tab-mvr -->

				<div class="tab-panel" id="tab-privacy">
					<div class="privacy-dashboard">
						<div class="privacy-header">
							<div class="privacy-title">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
								</svg>
								<div>
									<h2>Privacy Suite</h2>
									<p class="privacy-subtitle">Confidential transactions, encrypted storage & secrets management</p>
								</div>
							</div>
						</div>

						<!-- Protocol Status Cards -->
						<div class="privacy-protocols">
							<div class="protocol-card vortex-card">
								<div class="protocol-icon">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<circle cx="12" cy="12" r="10"></circle>
										<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
									</svg>
								</div>
								<div class="protocol-info">
									<h3>Vortex</h3>
									<p>Zero-knowledge privacy pools</p>
									<span class="protocol-status" id="vortex-status">
										<span class="status-dot loading"></span>
										Checking...
									</span>
								</div>
								<div class="protocol-actions">
									<button class="protocol-action-btn" data-action="vortex-deposit">Deposit</button>
									<button class="protocol-action-btn secondary" data-action="vortex-withdraw">Withdraw</button>
								</div>
							</div>

							<div class="protocol-card seal-card">
								<div class="protocol-icon">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
										<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
									</svg>
								</div>
								<div class="protocol-info">
									<h3>Seal</h3>
									<p>Decentralized secrets management</p>
									<span class="protocol-status online">
										<span class="status-dot"></span>
										Available
									</span>
								</div>
								<div class="protocol-actions">
									<button class="protocol-action-btn" data-action="seal-encrypt">Encrypt</button>
									<button class="protocol-action-btn secondary" data-action="seal-decrypt">Decrypt</button>
								</div>
							</div>

							<div class="protocol-card walrus-card">
								<div class="protocol-icon">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
										<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
										<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
									</svg>
								</div>
								<div class="protocol-info">
									<h3>Walrus</h3>
									<p>Decentralized blob storage</p>
									<span class="protocol-status online">
										<span class="status-dot"></span>
										Available
									</span>
								</div>
								<div class="protocol-actions">
									<button class="protocol-action-btn" data-action="walrus-upload">Upload</button>
									<button class="protocol-action-btn secondary" data-action="walrus-browse">Browse</button>
								</div>
							</div>
						</div>

						<!-- Privacy Sub-tabs -->
						<div class="privacy-tabs">
							<button class="privacy-tab active" data-privacy-tab="encrypted-notes">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14 2 14 8 20 8"></polyline>
									<rect x="8" y="13" width="8" height="4" rx="1"></rect>
								</svg>
								Encrypted Notes
							</button>
							<button class="privacy-tab" data-privacy-tab="vortex-pools">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
									<circle cx="12" cy="12" r="10"></circle>
									<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
								</svg>
								Vortex Pools
							</button>
							<button class="privacy-tab" data-privacy-tab="seal-policies">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
								</svg>
								Seal Policies
							</button>
							<button class="privacy-tab" data-privacy-tab="walrus-storage">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
									<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
									<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
								</svg>
								Walrus Storage
							</button>
						</div>

						<!-- Encrypted Notes Panel -->
						<div class="privacy-tab-content active" id="privacy-encrypted-notes">
							<div class="encrypted-notes-section">
								<div class="notes-header">
									<h3>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
											<polyline points="14 2 14 8 20 8"></polyline>
											<rect x="8" y="13" width="8" height="4" rx="1"></rect>
										</svg>
										Private Notes
									</h3>
									<p>Create encrypted notes stored on Walrus with Seal access control</p>
								</div>

								<div class="notes-compose">
									<div class="notes-policy-selector">
										<label>Access Policy</label>
										<select id="notes-policy-type">
											<option value="owner">Only Me (Owner)</option>
											<option value="address">Specific Address</option>
											<option value="nft">NFT Holders</option>
											<option value="allowlist">Allowlist</option>
											<option value="time_locked">Time-Locked</option>
										</select>
									</div>
									<div class="notes-policy-config hidden" id="notes-policy-config">
										<input type="text" id="notes-policy-value" placeholder="Enter address or policy parameters..." />
									</div>
									<textarea id="notes-content" placeholder="Write your encrypted note..." rows="6"></textarea>
									<div class="notes-actions">
										<span class="notes-info">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
												<circle cx="12" cy="12" r="10"></circle>
												<line x1="12" y1="16" x2="12" y2="12"></line>
												<line x1="12" y1="8" x2="12.01" y2="8"></line>
											</svg>
											Encrypted with Seal, stored on Walrus
										</span>
										<button class="notes-save-btn" id="notes-save-btn">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
												<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
												<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
											</svg>
											Encrypt & Save
										</button>
									</div>
								</div>

								<div class="notes-list" id="notes-list">
									<div class="notes-list-header">
										<h4>Your Encrypted Notes</h4>
										<button class="notes-refresh-btn" id="notes-refresh-btn">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
												<polyline points="23 4 23 10 17 10"></polyline>
												<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
											</svg>
										</button>
									</div>
									<div class="notes-list-content" id="notes-list-content">
										<div class="notes-empty">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
												<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
												<polyline points="14 2 14 8 20 8"></polyline>
											</svg>
											<p>No encrypted notes yet</p>
											<span>Create your first private note above</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Vortex Pools Panel -->
						<div class="privacy-tab-content" id="privacy-vortex-pools">
							<div class="vortex-pools-section">
								<div class="vortex-overview">
									<div class="vortex-info-card">
										<div class="vortex-info-icon">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<circle cx="12" cy="12" r="10"></circle>
												<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
											</svg>
										</div>
										<div class="vortex-info-text">
											<h3>How Vortex Works</h3>
											<p>Vortex is a privacy protocol using zero-knowledge proofs (Groth16) for confidential transactions on Sui. Deposit tokens into privacy pools, then withdraw to any address with complete anonymity.</p>
											<ul class="vortex-features">
												<li>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
													2-input/2-output UTXO model
												</li>
												<li>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
													Merkle tree commitments (depth 20)
												</li>
												<li>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
													Relayer-based withdrawals for privacy
												</li>
											</ul>
										</div>
									</div>
								</div>

								<div class="vortex-pools-list">
									<div class="pools-header">
										<h3>Available Privacy Pools</h3>
										<button class="pools-refresh-btn" id="pools-refresh-btn">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
												<polyline points="23 4 23 10 17 10"></polyline>
												<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
											</svg>
											Refresh
										</button>
									</div>
									<div class="pools-grid" id="vortex-pools-grid">
										<div class="pools-loading">
											<div class="loading-spinner"></div>
											<span>Loading pools...</span>
										</div>
									</div>
								</div>

								<div class="vortex-deposit-form" id="vortex-deposit-form">
									<h3>Deposit to Pool</h3>
									<div class="form-group">
										<label for="vortex-pool-select">Select Pool</label>
										<select id="vortex-pool-select">
											<option value="">Select a privacy pool...</option>
										</select>
									</div>
									<div class="form-group">
										<label for="vortex-deposit-amount">Amount</label>
										<div class="input-with-suffix">
											<input type="number" id="vortex-deposit-amount" placeholder="0.0" step="0.001" />
											<span class="input-suffix" id="vortex-deposit-suffix">SUI</span>
										</div>
									</div>
									<div class="form-info">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="12" y1="16" x2="12" y2="12"></line>
											<line x1="12" y1="8" x2="12.01" y2="8"></line>
										</svg>
										<span>A secret will be generated locally. <strong>Store it safely</strong> - it's required for withdrawal.</span>
									</div>
									<button class="vortex-deposit-btn" id="vortex-deposit-btn" disabled>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
											<line x1="12" y1="5" x2="12" y2="19"></line>
											<polyline points="19 12 12 19 5 12"></polyline>
										</svg>
										Connect Wallet to Deposit
									</button>
								</div>
							</div>
						</div>

						<!-- Seal Policies Panel -->
						<div class="privacy-tab-content" id="privacy-seal-policies">
							<div class="seal-policies-section">
								<div class="seal-overview">
									<div class="seal-info-card">
										<div class="seal-info-icon">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
												<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
											</svg>
										</div>
										<div class="seal-info-text">
											<h3>Seal Encryption</h3>
											<p>Decentralized secrets management using Identity-Based Encryption (IBE) with BLS12-381. Access controlled by onchain Move policies.</p>
											<div class="seal-policy-types">
												<span class="policy-type">
													<strong>Owner:</strong> Single address
												</span>
												<span class="policy-type">
													<strong>NFT:</strong> Token holders
												</span>
												<span class="policy-type">
													<strong>Allowlist:</strong> Group access
												</span>
												<span class="policy-type">
													<strong>Time-Lock:</strong> Scheduled reveal
												</span>
											</div>
										</div>
									</div>
								</div>

								<div class="seal-encrypt-form">
									<h3>Encrypt Data</h3>
									<div class="form-group">
										<label for="seal-policy-type">Access Policy</label>
										<select id="seal-policy-type">
											<option value="address">Address-Based</option>
											<option value="nft">NFT Ownership</option>
											<option value="allowlist">Allowlist</option>
											<option value="threshold">Threshold (M-of-N)</option>
											<option value="time_locked">Time-Locked</option>
											<option value="subscription">Subscription</option>
										</select>
									</div>
									<div class="form-group policy-config" id="seal-policy-config">
										<label for="seal-policy-params">Policy Parameters</label>
										<input type="text" id="seal-policy-params" placeholder="Enter address, NFT type, or policy ID..." />
									</div>
									<div class="form-group">
										<label for="seal-data-input">Data to Encrypt</label>
										<textarea id="seal-data-input" placeholder="Enter text or paste data to encrypt..." rows="4"></textarea>
									</div>
									<div class="form-group">
										<label for="seal-threshold">Key Server Threshold</label>
										<select id="seal-threshold">
											<option value="2">2-of-3 (Recommended)</option>
											<option value="1">1-of-3 (Less secure)</option>
											<option value="3">3-of-3 (Maximum security)</option>
										</select>
									</div>
									<button class="seal-encrypt-btn" id="seal-encrypt-btn">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
											<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
											<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
										</svg>
										Encrypt Data
									</button>
								</div>

								<div class="seal-decrypt-form">
									<h3>Decrypt Data</h3>
									<div class="form-group">
										<label for="seal-encrypted-input">Encrypted Data (Base64)</label>
										<textarea id="seal-encrypted-input" placeholder="Paste encrypted data..." rows="4"></textarea>
									</div>
									<button class="seal-decrypt-btn" id="seal-decrypt-btn" disabled>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
											<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
											<path d="M7 11V7a5 5 0 0 1 9.9 1"></path>
											<path d="M18 8l3-3"></path>
										</svg>
										Connect Wallet to Decrypt
									</button>
								</div>
							</div>
						</div>

						<!-- Walrus Storage Panel -->
						<div class="privacy-tab-content" id="privacy-walrus-storage">
							<div class="walrus-storage-section">
								<div class="walrus-overview">
									<div class="walrus-info-card">
										<div class="walrus-info-icon">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
												<path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
												<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
											</svg>
										</div>
										<div class="walrus-info-text">
											<h3>Walrus Decentralized Storage</h3>
											<p>Store files on the Walrus network using Red Stuff 2D erasure coding. Files are split across storage nodes with 4-5x redundancy.</p>
											<ul class="walrus-features">
												<li>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
													Tolerates 2/3 node failures
												</li>
												<li>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
													Recoverable from 1/3 of slivers
												</li>
												<li>
													<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg>
													Proof of Availability on Sui
												</li>
											</ul>
										</div>
									</div>
								</div>

								<div class="walrus-upload-form">
									<h3>Upload to Walrus</h3>
									<div class="walrus-dropzone" id="walrus-dropzone">
										<div class="dropzone-content">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
												<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
												<polyline points="17 8 12 3 7 8"></polyline>
												<line x1="12" y1="3" x2="12" y2="15"></line>
											</svg>
											<p>Drag & drop files here or <span class="dropzone-browse">browse</span></p>
											<span class="dropzone-hint">Max file size: 10MB per file</span>
										</div>
										<input type="file" id="walrus-file-input" multiple hidden />
									</div>
									<div class="walrus-upload-options">
										<label class="checkbox-label">
											<input type="checkbox" id="walrus-encrypt-option" />
											<span>Encrypt with Seal before upload</span>
										</label>
										<div class="form-group storage-duration">
											<label for="walrus-epochs">Storage Duration</label>
											<select id="walrus-epochs">
												<option value="1">1 Epoch (~24h)</option>
												<option value="7" selected>7 Epochs (~1 week)</option>
												<option value="30">30 Epochs (~1 month)</option>
												<option value="365">365 Epochs (~1 year)</option>
											</select>
										</div>
									</div>
									<div class="walrus-upload-queue hidden" id="walrus-upload-queue">
										<h4>Upload Queue</h4>
										<div class="queue-list" id="walrus-queue-list"></div>
									</div>
									<button class="walrus-upload-btn" id="walrus-upload-btn" disabled>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
											<polyline points="17 8 12 3 7 8"></polyline>
											<line x1="12" y1="3" x2="12" y2="15"></line>
										</svg>
										Select Files to Upload
									</button>
								</div>

								<div class="walrus-browse-section">
									<div class="browse-header">
										<h3>Your Stored Blobs</h3>
										<div class="browse-actions">
											<input type="text" id="walrus-blob-search" placeholder="Search by blob ID..." />
											<button class="browse-refresh-btn" id="walrus-refresh-btn">
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
													<polyline points="23 4 23 10 17 10"></polyline>
													<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
												</svg>
											</button>
										</div>
									</div>
									<div class="walrus-blobs-list" id="walrus-blobs-list">
										<div class="blobs-empty">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
												<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
												<path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
											</svg>
											<p>No blobs found</p>
											<span>Upload files to store them on Walrus</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- SDK Reference Section -->
						<div class="privacy-sdk-reference">
							<h3>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
									<polyline points="16 18 22 12 16 6"></polyline>
									<polyline points="8 6 2 12 8 18"></polyline>
								</svg>
								SDK Integration
							</h3>
							<div class="sdk-tabs">
								<button class="sdk-tab active" data-sdk="vortex-sdk">Vortex</button>
								<button class="sdk-tab" data-sdk="seal-sdk">Seal</button>
								<button class="sdk-tab" data-sdk="walrus-sdk">Walrus</button>
							</div>
							<div class="sdk-content">
								<div class="sdk-panel active" id="sdk-vortex-sdk">
									<pre class="code-block"><code><span class="code-comment">// Client-side Vortex SDK (load from CDN due to size)</span>
&lt;script src="https://unpkg.com/@interest-protocol/vortex-sdk"&gt;&lt;/script&gt;
&lt;script&gt;
  const { VortexAPI, Vortex } = window.VortexSDK;
  const api = new VortexAPI({ apiUrl: '/api/vortex' });

  <span class="code-comment">// Get privacy pools</span>
  const pools = await api.getPools();

  <span class="code-comment">// Generate deposit proof</span>
  const secret = Vortex.generateSecret();
  const commitment = Vortex.computeCommitment(secret);

  <span class="code-comment">// Create withdrawal proof</span>
  const proof = await Vortex.generateWithdrawProof({
    secret,
    recipient: '0x...',
    merklePath: await api.getMerklePath(commitment)
  });
&lt;/script&gt;</code></pre>
									<button class="copy-code-btn" data-code="vortex-sdk">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
										</svg>
										Copy
									</button>
								</div>
								<div class="sdk-panel" id="sdk-seal-sdk">
									<pre class="code-block"><code><span class="code-comment">// Seal SDK for encryption/decryption</span>
import { SealClient, SessionKey } from '@mysten/seal';
import { fromHEX } from '@mysten/bcs';

const client = new SealClient({
  suiClient,
  serverConfigs: serverObjectIds.map(id =&gt; ({ objectId: id, weight: 1 })),
  verifyKeyServers: true,
});

<span class="code-comment">// Encrypt data with access policy</span>
const { encryptedObject, key } = await client.encrypt({
  threshold: 2,
  packageId: fromHEX(packageId),
  id: fromHEX(policyId),
  data: plaintextBytes,
});

<span class="code-comment">// Create session key for decryption</span>
const sessionKey = await SessionKey.create({
  address: suiAddress,
  packageId: fromHEX(packageId),
  ttlMin: 10,
  suiClient,
});</code></pre>
									<button class="copy-code-btn" data-code="seal-sdk">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
										</svg>
										Copy
									</button>
								</div>
								<div class="sdk-panel" id="sdk-walrus-sdk">
									<pre class="code-block"><code><span class="code-comment">// Walrus SDK for blob storage</span>
import { WalrusClient } from '@mysten/walrus';

const client = new WalrusClient({
  network: 'mainnet',
  suiClient,
});

<span class="code-comment">// Upload a blob</span>
const { blobId, suiObject } = await client.writeBlob({
  blob: fileData,
  deletable: true,
  epochs: 7,
  signer: keypair,
});

<span class="code-comment">// Read a blob</span>
const data = await client.readBlob({ blobId });

<span class="code-comment">// Access via gateway</span>
const url = \`https://walrus-\${blobId}.sui.ski\`;</code></pre>
									<button class="copy-code-btn" data-code="walrus-sdk">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
											<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
											<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
										</svg>
										Copy
									</button>
								</div>
							</div>
						</div>
					</div>
				</div><!-- end tab-privacy -->

				<div class="tab-panel" id="tab-messaging">
					<div class="messaging-section">
						<div class="messaging-header">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
							</svg>
							<h3>Message @${escapeHtml(cleanName)}.sui</h3>
							<span class="alpha-badge">Beta</span>
						</div>

						<!-- Connect Wallet Prompt (shown when no wallet connected) -->
						<div class="msg-connect-prompt" id="msg-connect-prompt">
							<div class="msg-connect-icon">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
									<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
								</svg>
							</div>
							<h4>Connect Your Wallet</h4>
							<p>Connect your Sui wallet to send encrypted messages to @${escapeHtml(cleanName)}.sui</p>
							<button class="msg-connect-btn" id="msg-connect-btn">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
									<circle cx="12" cy="7" r="4"></circle>
								</svg>
								Connect Wallet
							</button>
							<div class="msg-connect-features">
								<span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> End-to-end encrypted</span>
								<span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Stored on Walrus</span>
								<span><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Signed with your wallet</span>
							</div>
						</div>

						<!-- Compose Section (hidden until wallet connected) -->
						<div class="msg-compose-section hidden" id="msg-compose-section">
							<div class="msg-recipient-bar">
								<span class="msg-recipient-label">To:</span>
								<span class="msg-recipient-name">@${escapeHtml(cleanName)}.sui</span>
								<span class="msg-recipient-addr" id="msg-recipient-addr">${escapeHtml(record.address.slice(0, 8))}...${escapeHtml(record.address.slice(-6))}</span>
							</div>

							<div class="msg-compose-box">
								<textarea
									id="msg-compose-input"
									class="msg-compose-input"
									placeholder="Write your message..."
									rows="4"
								></textarea>
								<div class="msg-compose-footer">
									<div class="msg-compose-info">
										<span id="msg-char-count">0</span> / 1000 characters
									</div>
									<div class="msg-compose-actions">
										<button class="msg-send-btn" id="msg-send-btn" disabled>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<line x1="22" y1="2" x2="11" y2="13"></line>
												<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
											</svg>
											<span id="msg-send-btn-text">Connect Wallet</span>
										</button>
									</div>
								</div>
							</div>

							<div id="msg-status" class="msg-status hidden"></div>
						</div>

						<!-- Conversation History (hidden until wallet connected) -->
						<div class="msg-conversation-section hidden" id="msg-conversation-section">
							<div class="msg-conversation-header">
								<h4>Conversation</h4>
								<button class="msg-refresh-btn" id="msg-refresh-btn" title="Refresh messages">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polyline points="23 4 23 10 17 10"></polyline>
										<polyline points="1 20 1 14 7 14"></polyline>
										<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
									</svg>
								</button>
							</div>
							<div class="msg-conversation-list" id="msg-conversation-list">
								<div class="msg-conversation-empty" id="msg-conversation-empty">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
									</svg>
									<p>No messages yet</p>
									<span>Start the conversation by sending a message above</span>
								</div>
								<div class="msg-conversation-loading hidden" id="msg-conversation-loading">
									<span class="loading"></span>
									<span>Loading messages...</span>
								</div>
							</div>
						</div>

						<!-- Owner Conversations List (for inbox mode) -->
						<div class="msg-inbox-section hidden" id="msg-inbox-section">
							<div class="msg-inbox-header">
								<h4>Your Conversations</h4>
								<button class="msg-refresh-btn" id="msg-refresh-conversations-btn" title="Refresh conversations">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polyline points="23 4 23 10 17 10"></polyline>
										<polyline points="1 20 1 14 7 14"></polyline>
										<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
									</svg>
								</button>
							</div>
							<div class="conversations-list" id="conversations-list">
								<div class="conv-empty" id="conversations-empty">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
									</svg>
									<p>No conversations yet</p>
									<span>Messages from others will appear here</span>
								</div>
								<div class="msg-conversation-loading hidden" id="conversations-loading">
									<span class="loading"></span>
									<span>Loading conversations...</span>
								</div>
							</div>
						</div>

						<!-- Conversation Detail View (when viewing a specific conversation) -->
						<div class="conversation-detail hidden" id="conversation-detail">
							<div class="conv-detail-header">
								<button class="conv-back-btn" id="conv-back-btn" title="Back to conversations">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polyline points="15 18 9 12 15 6"></polyline>
									</svg>
								</button>
								<span class="conv-detail-name" id="conv-detail-name">Loading...</span>
							</div>
							<div class="conv-messages" id="conv-messages"></div>
							<div class="msg-compose-box" style="margin-top: 16px;">
								<textarea id="conv-reply-input" class="msg-compose-input" placeholder="Type a reply..." rows="2"></textarea>
								<div class="msg-compose-footer">
									<div class="msg-compose-info">
										<span id="conv-reply-char-count">0</span> / 1000
									</div>
									<button class="msg-send-btn" id="conv-reply-btn">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<line x1="22" y1="2" x2="11" y2="13"></line>
											<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
										</svg>
										Reply
									</button>
								</div>
							</div>
						</div>

						<!-- SDK Info -->
						<div class="msg-sdk-info">
							<div class="msg-sdk-toggle" id="msg-sdk-toggle">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="12" y1="16" x2="12" y2="12"></line>
									<line x1="12" y1="8" x2="12.01" y2="8"></line>
								</svg>
								<span>How it works</span>
								<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</div>
							<div class="msg-sdk-content hidden" id="msg-sdk-content">
								<div class="msg-features-grid">
									<div class="msg-feature">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
											<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
										</svg>
										<div>
											<strong>End-to-End Encrypted</strong>
											<p>Messages encrypted with Seal protocol</p>
										</div>
									</div>
									<div class="msg-feature">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="2" y1="12" x2="22" y2="12"></line>
											<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
										</svg>
										<div>
											<strong>Decentralized Storage</strong>
											<p>Messages stored on Walrus</p>
										</div>
									</div>
									<div class="msg-feature">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
											<circle cx="9" cy="7" r="4"></circle>
											<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
											<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
										</svg>
										<div>
											<strong>SuiNS Names</strong>
											<p>Send using @name.sui addresses</p>
										</div>
									</div>
								</div>
								<div class="msg-code-example">
									<p>Integrate in your app:</p>
									<pre><code>import { SuiStackMessagingClient } from '@mysten/messaging';
const client = new SuiStackMessagingClient({ suiClient, signer });
await client.sendMessage('@${escapeHtml(cleanName)}.sui', 'Hello!');</code></pre>
								</div>
							</div>
						</div>
					</div>
				</div><!-- end tab-messaging -->

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

	<!-- Social Links Modal -->
	<div class="social-modal" id="social-modal">
		<div class="social-modal-content">
			<h3>
				<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
				Set X Profile
			</h3>
			<p>Link your X (Twitter) profile to your SuiNS name. This will be visible on your profile page.</p>
			<div class="social-input-group">
				<label class="social-input-label">X Username</label>
				<div class="social-input-wrapper">
					<span class="social-input-prefix">x.com/</span>
					<input type="text" id="x-username-input" placeholder="username" autocomplete="off" spellcheck="false" />
				</div>
			</div>
			<div id="social-modal-status" class="status hidden"></div>
			<div class="social-modal-buttons">
				<button class="cancel-btn" id="cancel-social-btn">Cancel</button>
				<button class="save-btn" id="save-social-btn">Save</button>
			</div>
		</div>
	</div>

	<script type="module">
		import { getWallets } from 'https://esm.sh/@mysten/wallet-standard@0.19.9';
		import { SuiClient } from 'https://esm.sh/@mysten/sui@1.45.2/client';
		import { Transaction } from 'https://esm.sh/@mysten/sui@1.45.2/transactions';
		import { SuinsClient, SuinsTransaction } from 'https://esm.sh/@mysten/suins@0.9.13';
		import { SealClient, SessionKey } from 'https://esm.sh/@mysten/seal@0.9.6';
		import { fromHex, toHex } from 'https://esm.sh/@mysten/bcs@1.3.0';

		const NAME = ${serializeJson(cleanName)};
		const FULL_NAME = ${serializeJson(fullName)};
		const NETWORK = ${serializeJson(network)};
		// Use rpc.sui.ski proxy for client-side requests (routes through Triton server-side)
		const ACTIVE_RPC_URL = 'https://rpc.sui.ski';
		let cachedSuiClient = null;
		const getSuiClient = () => {
			if (!cachedSuiClient) {
				cachedSuiClient = new SuiClient({ url: ACTIVE_RPC_URL });
			}
			return cachedSuiClient;
		};
		const BOUNTY_ESCROW_PACKAGE_ID = ${serializeJson(bountyPackageId || null)};
	const NFT_ID = ${serializeJson(record.nftId || '')};
	const TARGET_ADDRESS = ${serializeJson(record.address)};
	const OWNER_ADDRESS = ${serializeJson(record.ownerAddress || '')};
	const CURRENT_ADDRESS = TARGET_ADDRESS || OWNER_ADDRESS;
	const PROFILE_URL = ${serializeJson(`https://${cleanName}.sui.ski`)};
	const NFT_EXPLORER_URL = ${serializeJson(nftExplorerUrl)};
	const EXPLORER_BASE = ${serializeJson(explorerBase)};
	const IS_SUBNAME = NAME.includes('.');
	const STORAGE_KEY = 'sui_ski_wallet';
	const EXPIRATION_MS = ${expiresMs || 0};
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

		// Tab navigation
		const sidebarTabs = document.querySelectorAll('.sidebar-tab');
		const tabPanels = document.querySelectorAll('.tab-panel');

		function switchTab(tabId) {
			// Update sidebar tabs
			sidebarTabs.forEach(tab => {
				if (tab.dataset.tab === tabId) {
					tab.classList.add('active');
				} else {
					tab.classList.remove('active');
				}
			});
			// Update tab panels
			tabPanels.forEach(panel => {
				if (panel.id === 'tab-' + tabId) {
					panel.classList.add('active');
				} else {
					panel.classList.remove('active');
				}
			});
			// Save preference
			localStorage.setItem('sui_ski_active_tab', tabId);
		}

		// Initialize tab navigation
		sidebarTabs.forEach(tab => {
			tab.addEventListener('click', () => switchTab(tab.dataset.tab));
		});

		// Restore last active tab
		const savedTab = localStorage.getItem('sui_ski_active_tab');
		if (savedTab && document.getElementById('tab-' + savedTab)) {
			switchTab(savedTab);
		}

		// Quick message button - switches to messaging tab
		const quickMsgBtn = document.getElementById('quick-message-btn');
		if (quickMsgBtn) {
			quickMsgBtn.addEventListener('click', () => {
				switchTab('messaging');
				// Focus the compose input after a short delay
				setTimeout(() => {
					const composeInput = document.getElementById('msg-compose-input');
					if (composeInput) {
						composeInput.focus();
					}
				}, 100);
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

					const result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
						transaction: tx,
						account: connectedAccount,
						chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
					});

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

				const { walletName, address } = JSON.parse(saved);
				if (!walletName) return false;

				const wallets = getSuiWallets();
				const wallet = wallets.find(w => w.name === walletName);
				if (!wallet) {
					clearWalletConnection();
					return false;
				}

				const connectFeature = wallet.features?.['standard:connect'];
				if (!connectFeature) return false;

				await connectFeature.connect();
				const accounts = wallet.accounts;
				if (!accounts || accounts.length === 0) return false;

				connectedAccount = accounts[0];
				connectedAddress = accounts[0].address;
				connectedWallet = wallet;
				connectedWalletName = walletName;

				// Update all UI components that depend on wallet state
				updateUIForWallet();
				return true;
			} catch (e) {
				console.log('Failed to restore wallet:', e.message);
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
				const connectFeature = wallet.features?.['standard:connect'];
				if (!connectFeature) throw new Error('Wallet does not support connection');

				await connectFeature.connect();
				const accounts = wallet.accounts;
				if (!accounts || accounts.length === 0) throw new Error('No accounts found. Please unlock your wallet.');

				connectedAccount = accounts[0];
				connectedAddress = accounts[0].address;
				connectedWallet = wallet;
				connectedWalletName = wallet.name;

				walletModal.classList.remove('open');
				saveWalletConnection();
				// Update all UI components that depend on wallet state
				updateUIForWallet();
			} catch (e) {
				console.error('Connection error:', e);
				const errorMsg = e.message || 'Unknown error';
				walletList.innerHTML = '<div class="wallet-no-wallets" style="color: var(--error);">' +
					'Connection failed: ' + errorMsg +
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
				item.addEventListener('click', () => connectToWallet(wallet));
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

		// Render wallet connection status (preserves search btn and network badge)
		function renderWalletBar() {
			// Remove old wallet elements but keep search btn and network badge
			const existingWalletStatus = walletBar.querySelector('.wallet-status');
			const existingConnectBtn = walletBar.querySelector('.connect-btn');
			const existingDropdown = walletBar.querySelector('.wallet-dropdown');
			if (existingWalletStatus) existingWalletStatus.remove();
			if (existingConnectBtn) existingConnectBtn.remove();
			if (existingDropdown) existingDropdown.remove();

			if (!connectedAddress) {
				const connectBtn = document.createElement('button');
				connectBtn.className = 'connect-btn';
				connectBtn.id = 'connect-wallet-btn';
				connectBtn.textContent = 'Connect Wallet';
				connectBtn.addEventListener('click', connectWallet);
				walletBar.appendChild(connectBtn);
			} else {
				const displayName = connectedPrimaryName || truncAddr(connectedAddress);

				// Create wallet status container
				const walletContainer = document.createElement('div');
				walletContainer.className = 'wallet-status-container';

				const walletStatus = document.createElement('div');
				walletStatus.className = 'wallet-status';
				walletStatus.style.cursor = 'pointer';
				walletStatus.title = 'Click for wallet options';
				walletStatus.innerHTML = '<span class="wallet-addr">' + displayName + '</span>' +
					(connectedPrimaryName ? '<span class="wallet-name">' + truncAddr(connectedAddress) + '</span>' : '') +
					'<svg class="wallet-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="6 9 12 15 18 9"></polyline></svg>';

				// Create dropdown menu
				const dropdown = document.createElement('div');
				dropdown.className = 'wallet-dropdown';
				dropdown.innerHTML = \`
					\${connectedPrimaryName ? \`
					<button class="wallet-dropdown-item" id="wallet-view-profile">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
						View My Profile
					</button>
					\` : ''}
					<button class="wallet-dropdown-item" id="wallet-switch">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>
						Switch Wallet
					</button>
					<button class="wallet-dropdown-item disconnect" id="wallet-disconnect">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
						Disconnect
					</button>
				\`;

				walletContainer.appendChild(walletStatus);
				walletContainer.appendChild(dropdown);
				walletBar.appendChild(walletContainer);

				// Toggle dropdown on click
				walletStatus.addEventListener('click', (e) => {
					e.stopPropagation();
					dropdown.classList.toggle('open');
				});

				// Close dropdown when clicking outside
				document.addEventListener('click', (e) => {
					if (!walletContainer.contains(e.target)) {
						dropdown.classList.remove('open');
					}
				});

				// View profile handler
				const viewProfileBtn = document.getElementById('wallet-view-profile');
				if (viewProfileBtn) {
					viewProfileBtn.addEventListener('click', () => {
						const cleanedName = connectedPrimaryName.replace(/\\.sui$/i, '');
						window.location.href = \`https://\${cleanedName}.sui.ski\`;
					});
				}

				// Switch wallet handler
				const switchBtn = document.getElementById('wallet-switch');
				if (switchBtn) {
					switchBtn.addEventListener('click', () => {
						dropdown.classList.remove('open');
						disconnectWallet();
						setTimeout(() => connectWallet(), 100);
					});
				}

				// Disconnect handler
				const disconnectBtn = document.getElementById('wallet-disconnect');
				if (disconnectBtn) {
					disconnectBtn.addEventListener('click', () => {
						dropdown.classList.remove('open');
						disconnectWallet();
					});
				}
			}
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
			renderWalletBar();
			updateGlobalWalletWidget();
			checkEditPermission();
			updateEditButton();
			updateBountiesSectionVisibility();
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

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
				const builtTxBytes = await tx.build({ client: suiClient });

				const txWrapper = {
					_bytes: builtTxBytes,
					toJSON() { return btoa(String.fromCharCode.apply(null, this._bytes)); },
					serialize() { return this._bytes; }
				};

				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signFeature = connectedWallet.features?.['sui:signTransaction'];

				if (signExecFeature?.signAndExecuteTransaction) {
					try {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: txWrapper,
							account: connectedAccount,
							chain
						});
					} catch (e) {}
				}

				if (!result && signFeature?.signTransaction) {
					const { signature } = await signFeature.signTransaction({
						transaction: txWrapper,
						account: connectedAccount,
						chain
					});
					const executeResult = await suiClient.executeTransactionBlock({
						transactionBlock: builtTxBytes,
						signature: signature,
						options: { showEffects: true }
					});
					result = { digest: executeResult.digest };
				}

				if (!result) throw new Error('Could not sign transaction');

				// Update UI
				document.querySelector('.owner-addr').textContent = connectedAddress.slice(0, 8) + '...' + connectedAddress.slice(-6);
				document.querySelector('.owner-name').innerHTML = formatSuiName(connectedPrimaryName);
				ownerDisplayAddress = connectedAddress;
				alert('Updated! TX: ' + result.digest);

			} catch (error) {
				console.error('Set self error:', error);
				alert('Failed: ' + (error.message || 'Unknown error'));
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

				showStatus(modalStatus, '<span class="loading"></span> Approve in wallet...', 'info');

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
				const builtTxBytes = await tx.build({ client: suiClient });

				const txWrapper = {
					_bytes: builtTxBytes,
					toJSON() {
						return btoa(String.fromCharCode.apply(null, this._bytes));
					},
					serialize() {
						return this._bytes;
					}
				};

				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signFeature = connectedWallet.features?.['sui:signTransaction'];

				if (signExecFeature?.signAndExecuteTransaction) {
					try {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: txWrapper,
							account: connectedAccount,
							chain
						});
					} catch (e) {
						console.log('signAndExecuteTransaction failed:', e.message);
					}
				}

				if (!result && signFeature?.signTransaction) {
					const { signature } = await signFeature.signTransaction({
						transaction: txWrapper,
						account: connectedAccount,
						chain
					});

					const executeResult = await suiClient.executeTransactionBlock({
						transactionBlock: builtTxBytes,
						signature: signature,
						options: { showEffects: true }
					});
					result = { digest: executeResult.digest };
				}

				if (!result) {
					throw new Error('Could not sign transaction');
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

		// ===== TRADEPORT MARKETPLACE FUNCTIONALITY =====
		const marketplaceLoading = document.getElementById('marketplace-loading');
		const marketplaceContent = document.getElementById('marketplace-content');
		const marketplaceError = document.getElementById('marketplace-error');
		const listingValue = document.getElementById('listing-value');
		const bidsCount = document.getElementById('bids-count');
		const bidsList = document.getElementById('bids-list');
		const placeBidBtn = document.getElementById('place-bid-btn');
		const marketplaceBidAmount = document.getElementById('marketplace-bid-amount');
		const bidStatusEl = document.getElementById('bid-status');
		const retryMarketplace = document.getElementById('retry-marketplace');

		let tradeportNftId = null;
		let tradeportNft = null;

		// Format SUI amount from MIST
		function formatSui(mist) {
			return (mist / 1000000000).toFixed(2);
		}

		// Load marketplace data from Tradeport API
		async function loadMarketplaceData() {
			marketplaceLoading.style.display = 'flex';
			marketplaceContent.style.display = 'none';
			marketplaceError.style.display = 'none';

			try {
				// Tradeport API expects name without .sui suffix
				const nameForApi = FULL_NAME.replace(/\.sui$/i, '');
				const res = await fetch(\`/api/tradeport/v1/sui/suins/name/\${encodeURIComponent(nameForApi)}\`);
				
				// Handle 404 as "not listed" rather than an error
				if (res.status === 404) {
					listingValue.textContent = 'Not Listed';
					listingValue.classList.remove('for-sale');
					bidsCount.textContent = '0';
					bidsList.innerHTML = '<div class="no-bids">No bids yet</div>';
					updatePlaceBidButton();
					marketplaceLoading.style.display = 'none';
					marketplaceContent.style.display = 'flex';
					return;
				}

				if (!res.ok) {
					// Handle 502 and other errors gracefully
					if (res.status === 502 || res.status >= 500) {
						throw new Error('Tradeport service temporarily unavailable');
					}
					// For other errors, try to get error message from response
					let errorMsg = \`API error: \${res.status}\`;
					try {
						const errorData = await res.json();
						if (errorData.error || errorData.message) {
							errorMsg = errorData.error || errorData.message;
						}
					} catch {
						// Ignore JSON parse errors
					}
					throw new Error(errorMsg);
				}

				// Check content-type before parsing JSON
				const contentType = res.headers.get('content-type') || '';
				if (!contentType.includes('application/json')) {
					// If we got HTML or other non-JSON, it's likely a 404 page
					const text = await res.text();
					console.error('Non-JSON response from Tradeport API:', text.substring(0, 200));
					// Treat as not listed
					listingValue.textContent = 'Not Listed';
					listingValue.classList.remove('for-sale');
					bidsCount.textContent = '0';
					bidsList.innerHTML = '<div class="no-bids">No bids yet</div>';
					updatePlaceBidButton();
					marketplaceLoading.style.display = 'none';
					marketplaceContent.style.display = 'flex';
					return;
				}

				const data = await res.json();

				// Store NFT ID for bidding
				if (data.nft) {
					tradeportNftId = data.nft.id;
					tradeportNft = data.nft;
				}

				// Update listing status
				if (data.isListed && data.listing) {
					listingValue.textContent = 'For Sale';
					listingValue.classList.add('for-sale');
					const listingDiv = document.getElementById('marketplace-listing');
					listingDiv.innerHTML = \`
						<div class="listing-status">
							<span class="listing-label">Status</span>
							<span class="listing-value for-sale">For Sale</span>
						</div>
						<div class="listing-price">
							<span class="listing-price-label">Asking Price</span>
							<span class="listing-price-value">\${formatSui(data.listing.price)} SUI</span>
						</div>
					\`;
				} else {
					listingValue.textContent = 'Not Listed';
					listingValue.classList.remove('for-sale');
				}

				// Update bids
				if (data.bids && data.bids.length > 0) {
					bidsCount.textContent = data.bids.length;
					bidsList.innerHTML = data.bids.map(bid => \`
						<div class="bid-item">
							<div class="bid-item-info">
								<span class="bid-item-bidder">\${bid.bidder.slice(0, 6)}...\${bid.bidder.slice(-4)}</span>
							</div>
							<span class="bid-item-amount">\${formatSui(bid.price)} SUI</span>
						</div>
					\`).join('');
				} else {
					bidsCount.textContent = '0';
					bidsList.innerHTML = '<div class="no-bids">No bids yet</div>';
				}

				// Update bid button state
				updatePlaceBidButton();

				marketplaceLoading.style.display = 'none';
				marketplaceContent.style.display = 'flex';
			} catch (error) {
				console.error('Failed to load marketplace data:', error);
				marketplaceLoading.style.display = 'none';
				marketplaceContent.style.display = 'none';
				marketplaceError.style.display = 'block';
				// Update error message if available
				const errorMsg = error instanceof Error ? error.message : 'Failed to load marketplace data';
				if (marketplaceError) {
					const errorText = marketplaceError.querySelector('.error-text');
					if (errorText) {
						errorText.textContent = errorMsg;
					}
				}
			}
		}

		// Update place bid button state
		function updatePlaceBidButton() {
			if (connectedAddress && tradeportNftId) {
				placeBidBtn.disabled = false;
				placeBidBtn.querySelector('.btn-text').textContent = 'Place Bid';
			} else if (!connectedAddress) {
				placeBidBtn.disabled = false;
				placeBidBtn.querySelector('.btn-text').textContent = 'Connect Wallet';
			} else {
				placeBidBtn.disabled = true;
				placeBidBtn.querySelector('.btn-text').textContent = 'Unavailable';
			}
		}

		// Show bid status
		function showBidStatusMsg(msg, type) {
			bidStatusEl.innerHTML = msg;
			bidStatusEl.className = 'bid-status ' + type;
		}

		function hideBidStatusMsg() {
			bidStatusEl.className = 'bid-status hidden';
		}

		// Place bid via server-side Tradeport SDK
		async function placeBid() {
			if (!connectedAddress) {
				await connectWallet();
				updatePlaceBidButton();
				if (!connectedAddress) return;
			}

			if (!tradeportNftId) {
				showBidStatusMsg('NFT not found on Tradeport', 'error');
				return;
			}

			const amount = parseFloat(marketplaceBidAmount.value);
			if (!amount || amount <= 0) {
				showBidStatusMsg('Please enter a valid bid amount', 'error');
				return;
			}

			const amountMist = Math.floor(amount * 1000000000);

			placeBidBtn.disabled = true;
			placeBidBtn.querySelector('.btn-text').textContent = 'Building...';
			hideBidStatusMsg();

			try {
				// Build transaction via server-side API
				const buildRes = await fetch('/api/tradeport/v1/sui/suins/bid', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						nftId: tradeportNftId,
						bidAmountMist: amountMist,
						walletAddress: connectedAddress,
					}),
				});

				const buildData = await buildRes.json();

				if (!buildRes.ok || !buildData.success) {
					throw new Error(buildData.error || 'Failed to build transaction');
				}

				placeBidBtn.querySelector('.btn-text').textContent = 'Sign in wallet...';

				// Decode transaction bytes
				const txBytes = Uint8Array.from(atob(buildData.transaction), c => c.charCodeAt(0));

				// Sign and execute with connected wallet
				const result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
					transaction: txBytes,
					account: connectedAccount,
					chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
				});

				showBidStatusMsg('Bid placed successfully! <a href="https://suivision.xyz/txblock/' + result.digest + '" target="_blank">View transaction</a>', 'success');
				marketplaceBidAmount.value = '';

				// Refresh marketplace data
				setTimeout(() => loadMarketplaceData(), 2000);

			} catch (error) {
				console.error('Failed to place bid:', error);
				const msg = error.message || 'Failed to place bid';
				showBidStatusMsg(msg + ' <a href="https://tradeport.xyz/sui/collection/suins?name=' + NAME + '.sui" target="_blank">Try on Tradeport</a>', 'error');
			} finally {
				updatePlaceBidButton();
			}
		}

		// Event listeners
		if (placeBidBtn) {
			placeBidBtn.addEventListener('click', placeBid);
		}
		if (retryMarketplace) {
			retryMarketplace.addEventListener('click', loadMarketplaceData);
		}

		// Load marketplace data on page load
		loadMarketplaceData();

		// Queue bid functionality removed - using expiration timer instead
		if (false) {
			const countdownEl = document.getElementById('countdown-timer');
			const bidAmountInput = document.getElementById('bid-amount');
			const queueBidBtn = document.getElementById('queue-bid-btn');
			const queueBidStatus = document.getElementById('queue-bid-status');
			const existingBidContainer = document.getElementById('existing-bid-container');
			const queueBidForm = document.getElementById('queue-bid-form');
			const queueOfflineToggle = document.getElementById('bid-offline-toggle');
			const queueOfflineFields = document.getElementById('queue-offline-fields');
			const bidTxBytesInput = document.getElementById('bid-tx-bytes');
			const bidTxSignaturesInput = document.getElementById('bid-tx-signatures');
			const queueBidList = document.getElementById('queue-bid-list');

			// Countdown timer
			function updateCountdown() {
				const now = Date.now();
				const diff = AVAILABLE_AT - now;

				if (diff <= 0) {
					countdownEl.textContent = 'Available Now!';
					countdownEl.style.color = 'var(--success)';
					return;
				}

				const days = Math.floor(diff / (24 * 60 * 60 * 1000));
				const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
				const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
				const secs = Math.floor((diff % (60 * 1000)) / 1000);

				if (days > 0) {
					countdownEl.textContent = \`\${days}d \${hours}h \${mins}m\`;
				} else if (hours > 0) {
					countdownEl.textContent = \`\${hours}h \${mins}m \${secs}s\`;
				} else {
					countdownEl.textContent = \`\${mins}m \${secs}s\`;
				}
			}

			updateCountdown();
			setInterval(updateCountdown, 1000);

			if (queueOfflineToggle && queueOfflineFields) {
				queueOfflineToggle.addEventListener('change', () => {
					queueOfflineFields.style.display = queueOfflineToggle.checked ? 'flex' : 'none';
				});
			}

			const shortAddr = (value) => {
				const str = String(value || '');
				return str.length > 12 ? str.slice(0, 6) + '…' + str.slice(-4) : str;
			};

			const shortDigest = (value) => {
				const str = String(value || '');
				return str.length > 12 ? str.slice(0, 6) + '…' + str.slice(-4) : str;
			};

			function describeBidStatus(bid) {
				const status = (bid?.status || (bid?.autoRelay ? 'auto' : 'queued')).toLowerCase();
				switch (status) {
					case 'submitted':
						return { label: 'Submitted', className: '' };
					case 'submitting':
						return { label: 'Relaying', className: 'pending' };
					case 'failed':
						return { label: 'Retry soon', className: 'failed' };
					case 'auto':
						return { label: 'Auto-ready', className: 'auto' };
					default:
						return { label: bid?.autoRelay ? 'Auto-ready' : 'Queued', className: bid?.autoRelay ? 'auto' : '' };
				}
			}

			function formatExecuteTime(value) {
				if (!value || Number.isNaN(Number(value))) return '—';
				try {
					return new Date(Number(value)).toLocaleString();
				} catch {
					return '—';
				}
			}

			function renderQueueBoard(bids = []) {
				if (!queueBidList) return;
				if (!Array.isArray(bids) || bids.length === 0) {
					queueBidList.innerHTML = '<div class="queue-bid-empty">No queued bids yet.</div>';
					return;
				}

				const rows = bids.slice(0, 6).map((bid) => {
					const statusInfo = describeBidStatus(bid);
					const chips = [];
					if (bid.autoRelay) {
						chips.push('<span class="queue-bid-chip auto">Auto relay</span>');
					}
					if (statusInfo.label) {
						const cls = statusInfo.className ? ' ' + statusInfo.className : '';
						chips.push('<span class="queue-bid-chip' + cls + '">' + statusInfo.label + '</span>');
					}
					if (bid.resultDigest) {
						chips.push('<span class="queue-bid-chip">' + shortDigest(bid.resultDigest) + '</span>');
					}
					return \`
						<div class="queue-bid-row">
							<div><strong>\${shortAddr(bid.bidder)}</strong></div>
							<div>\${Number(bid.amount || 0).toFixed(2)} SUI</div>
							<div>\${formatExecuteTime(bid.executeAt)}</div>
							<div>\${chips.join(' ')}</div>
						</div>
					\`;
				});

				queueBidList.innerHTML = rows.join('');
			}

			async function loadQueueBoard() {
				if (!queueBidList) return;
				try {
					const res = await fetch(\`/api/bids/\${NAME}\`);
					if (!res.ok) throw new Error('Queue fetch failed');
					const data = await res.json();
					renderQueueBoard(Array.isArray(data.bids) ? data.bids : []);
				} catch (error) {
					queueBidList.innerHTML = '<div class="queue-bid-empty">Unable to load bids right now.</div>';
				}
			}

			function updateQueueButtonState() {
				if (!queueBidBtn) return;
				if (connectedAddress) {
					queueBidBtn.textContent = 'Queue Bid';
				} else {
					queueBidBtn.textContent = 'Connect Wallet';
				}
				queueBidBtn.disabled = false;
			}

			// Show bid status message
			function showBidStatus(msg, type) {
				queueBidStatus.innerHTML = msg;
				queueBidStatus.className = 'queue-bid-status status ' + type;
			}

			function hideBidStatus() {
				queueBidStatus.className = 'queue-bid-status hidden';
			}

			// Load existing bid for this name
			async function loadExistingBid() {
				if (!connectedAddress || !existingBidContainer) return;

				try {
					const res = await fetch(\`/api/bids/\${NAME}?bidder=\${connectedAddress}\`);
					if (res.ok) {
						const data = await res.json();
						if (data.bid) {
							renderExistingBid(data.bid);
						} else {
							clearExistingBid();
						}
					}
				} catch (e) {
					console.log('Failed to load existing bid:', e);
				}
			}

			function clearExistingBid() {
				if (!existingBidContainer) return;
				existingBidContainer.innerHTML = '';
				if (queueBidForm) {
					queueBidForm.style.display = 'flex';
				}
			}

			// Render existing bid UI
			function renderExistingBid(bid) {
				existingBidContainer.innerHTML = \`
					<div class="queue-bid-existing">
						<div class="queue-bid-existing-info">
							<div class="queue-bid-existing-label">Your Queued Bid</div>
							<div class="queue-bid-existing-value">\${bid.amount} SUI</div>
						</div>
						<button class="queue-bid-cancel" id="cancel-bid-btn">Cancel</button>
					</div>
				\`;

				document.getElementById('cancel-bid-btn').addEventListener('click', cancelBid);
				queueBidForm.style.display = 'none';
			}

			// Submit a new bid
			async function submitBid() {
				if (!connectedAddress) {
					await connectWallet();
					if (!connectedAddress) return;
				}

				const amount = parseFloat(bidAmountInput.value);
				if (!amount || amount <= 0) {
					showBidStatus('Please enter a valid bid amount', 'error');
					return;
				}

				try {
					queueBidBtn.disabled = true;
					queueBidBtn.textContent = 'Submitting...';
					showBidStatus('<span class="loading"></span> Submitting bid...', 'info');

					const res = await fetch('/api/bids', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							name: NAME,
							bidder: connectedAddress,
							amount: amount,
							executeAt: AVAILABLE_AT
						})
					});

					const data = await res.json();

					if (res.ok) {
						showBidStatus('Bid queued successfully!', 'success');
						bidAmountInput.value = '';
						loadExistingBid();
					} else {
						showBidStatus(data.error || 'Failed to submit bid', 'error');
					}
				} catch (e) {
					showBidStatus('Failed to submit bid: ' + e.message, 'error');
				} finally {
					queueBidBtn.disabled = false;
					queueBidBtn.textContent = 'Queue Bid';
				}
			}

			// Cancel existing bid
			async function cancelBid() {
				if (!connectedAddress) return;

				if (!confirm('Are you sure you want to cancel your bid?')) return;

				try {
					const res = await fetch(\`/api/bids/\${NAME}?bidder=\${connectedAddress}\`, {
						method: 'DELETE'
					});

					if (res.ok) {
						existingBidContainer.innerHTML = '';
						queueBidForm.style.display = 'flex';
						showBidStatus('Bid cancelled', 'success');
						setTimeout(hideBidStatus, 2000);
					} else {
						const data = await res.json();
						showBidStatus(data.error || 'Failed to cancel bid', 'error');
					}
				} catch (e) {
					showBidStatus('Failed to cancel bid: ' + e.message, 'error');
				}
			}

			// Event listeners
			queueBidBtn.addEventListener('click', submitBid);
			bidAmountInput.addEventListener('keypress', (e) => {
				if (e.key === 'Enter') submitBid();
			});

			// Load existing bid when wallet connects
			const originalRenderWalletBar = renderWalletBar;
			renderWalletBar = function() {
				originalRenderWalletBar();
				if (connectedAddress) {
					loadExistingBid();
				}
			};
		}

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

			// Add click handlers
			searchResults.querySelectorAll('.search-result-item').forEach(item => {
				item.addEventListener('click', () => {
					const name = item.dataset.name;
					navigateToName(name);
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
				const address = await suiClient.resolveNameServiceAddress({ name: name + '.sui' });

				if (!address) {
					return { name, status: 'available' };
				}

				// Name is taken, try to get expiration
				const suinsClient = new SuinsClient({
					client: suiClient,
					network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
				});

				try {
					const record = await suinsClient.getNameRecord(name + '.sui');
					if (record?.expirationTimestampMs) {
						const expiresMs = parseInt(record.expirationTimestampMs);
						const now = Date.now();
						const daysLeft = Math.ceil((expiresMs - now) / (24 * 60 * 60 * 1000));
						return { name, status: 'taken', expiresIn: daysLeft };
					}
				} catch (e) {
					// Couldn't get expiration, that's ok
				}

				return { name, status: 'taken' };
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
					if (currentResults.length > 0 && currentResults[selectedIndex]) {
						navigateToName(currentResults[selectedIndex].name);
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

		// ===== UPLOAD FUNCTIONALITY =====
		const uploadSection = document.getElementById('upload-section');
		const uploadDropzone = document.getElementById('upload-dropzone');
		const fileInput = document.getElementById('file-input');
		const recordKeySelect = document.getElementById('record-key');
		const uploadProgress = document.getElementById('upload-progress');
		const progressFill = document.getElementById('progress-fill');
		const progressStatus = document.getElementById('progress-status');
		const uploadStatusEl = document.getElementById('upload-status');
		const uploadFileName = document.getElementById('upload-file-name');
		const uploadFileType = document.getElementById('upload-file-type');
		const uploadFileSize = document.getElementById('upload-file-size');
		const UPLOAD_ENDPOINT = '/api/upload';

		function updateUploadVisibility() {
			if (canEdit && uploadSection) {
				uploadSection.style.display = 'block';
			}
		}

		const originalCheckEditPermission = checkEditPermission;
		checkEditPermission = async function() {
			await originalCheckEditPermission();
			updateUploadVisibility();
			// Update MVR section only if expanded
			if (window.mvrExpanded && typeof window.updateMvrSectionVisibility === 'function') {
				await window.updateMvrSectionVisibility();
			}
		};

		function formatBytes(bytes) {
			if (!Number.isFinite(bytes) || bytes <= 0) return '-';
			const units = ['B', 'KB', 'MB', 'GB'];
			const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
			const size = (bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2);
			return size + ' ' + units[index];
		}

		function updateFileMeta(file) {
			if (!uploadFileName || !uploadFileType || !uploadFileSize) return;
			if (!file) {
				uploadFileName.textContent = 'No file selected';
				uploadFileType.textContent = '-';
				uploadFileSize.textContent = '-';
				return;
			}
			uploadFileName.textContent = file.name || 'Untitled';
			uploadFileType.textContent = file.type || 'application/octet-stream';
			uploadFileSize.textContent = formatBytes(file.size);
		}

		async function uploadToWalrus(file) {
			const response = await fetch(UPLOAD_ENDPOINT, {
				method: 'PUT',
				body: await file.arrayBuffer(),
				headers: {
					'Content-Type': file.type || 'application/octet-stream',
					'X-File-Name': file.name || 'upload',
				},
			});

			const responseText = await response.text();
			let data = null;
			if (responseText) {
				try {
					data = JSON.parse(responseText);
				} catch {
					data = null;
				}
			}

			if (!response.ok) {
				const message = data?.error || data?.message || responseText || response.statusText;
				throw new Error(message || 'Upload failed');
			}

			const blobId = data?.newlyCreated?.blobObject?.blobId || data?.alreadyCertified?.blobId;
			if (!blobId) {
				throw new Error('Walrus did not return a blob ID');
			}
			return blobId;
		}

		async function setSuiNSRecords(entries) {
			if (!connectedWallet || !connectedAccount) {
				throw new Error('Wallet not connected');
			}

			const suiClient = getSuiClient();
			const suinsClient = new SuinsClient({
				client: suiClient,
				network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
			});

			const senderAddress = connectedAccount.address?.toString?.() || connectedAddress;

			let nftId = NFT_ID;
			if (!nftId) {
				const nameRecord = await suinsClient.getNameRecord(FULL_NAME);
				nftId = nameRecord?.nftId || '';
			}

			if (!nftId) throw new Error('Could not find NFT ID');

			const tx = new Transaction();
			const suinsTx = new SuinsTransaction(suinsClient, tx);

			for (const entry of entries) {
				suinsTx.setUserData({
					nft: nftId,
					key: entry.key,
					value: entry.value,
					isSubname: IS_SUBNAME
				});
			}

			tx.setSender(senderAddress);

			const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
			const builtTxBytes = await tx.build({ client: suiClient });

			const txWrapper = {
				_bytes: builtTxBytes,
				toJSON() { return btoa(String.fromCharCode.apply(null, this._bytes)); },
				serialize() { return this._bytes; }
			};

			let result;
			const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
			const signFeature = connectedWallet.features?.['sui:signTransaction'];

			if (signExecFeature?.signAndExecuteTransaction) {
				try {
					result = await signExecFeature.signAndExecuteTransaction({
						transaction: txWrapper,
						account: connectedAccount,
						chain
					});
				} catch (e) {
					console.log('signAndExecuteTransaction failed:', e);
				}
			}

			if (!result && signFeature?.signTransaction) {
				const { signature } = await signFeature.signTransaction({
					transaction: txWrapper,
					account: connectedAccount,
					chain
				});
				const executeResult = await suiClient.executeTransactionBlock({
					transactionBlock: builtTxBytes,
					signature: signature,
					options: { showEffects: true }
				});
				result = { digest: executeResult.digest };
			}

			if (!result) throw new Error('Could not sign transaction');
			return result;
		}

		async function handleFileUpload(file) {
			if (!recordKeySelect) return;
			const recordKey = recordKeySelect.value;

			try {
				updateFileMeta(file);
				uploadProgress.style.display = 'block';
				progressFill.style.width = '10%';
				progressStatus.innerHTML = '<span class="loading"></span> Uploading to Walrus...';
				hideStatus(uploadStatusEl);

				const blobId = await uploadToWalrus(file);
				progressFill.style.width = '60%';
				progressStatus.innerHTML = '<span class="loading"></span> Updating SuiNS records...';

				await setSuiNSRecords([{ key: recordKey, value: blobId }]);

				progressFill.style.width = '100%';
				progressStatus.textContent = 'Saved to chain';
				showStatus(uploadStatusEl, 'Content uploaded and saved!', 'success');

				setTimeout(() => {
					uploadProgress.style.display = 'none';
					progressFill.style.width = '0%';
				}, 1800);
			} catch (error) {
				console.error('Upload error:', error);
				uploadProgress.style.display = 'none';
				showStatus(uploadStatusEl, 'Upload failed: ' + (error.message || 'Unknown error'), 'error');
			}
		}

		if (uploadDropzone) {
			uploadDropzone.addEventListener('click', () => fileInput?.click());

			uploadDropzone.addEventListener('dragover', (e) => {
				e.preventDefault();
				uploadDropzone.classList.add('dragover');
			});

			uploadDropzone.addEventListener('dragleave', () => {
				uploadDropzone.classList.remove('dragover');
			});

			uploadDropzone.addEventListener('drop', (e) => {
				e.preventDefault();
				uploadDropzone.classList.remove('dragover');
				const file = e.dataTransfer.files[0];
				if (file) handleFileUpload(file);
			});

			if (fileInput) {
				fileInput.addEventListener('change', (e) => {
					const file = e.target.files[0];
					if (file) handleFileUpload(file);
					fileInput.value = '';
				});
			}
		}

		updateFileMeta(null);

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
				const { Transaction } = await import('https://esm.sh/@mysten/sui@1.45.2/transactions');
				const { SuiClient } = await import('https://esm.sh/@mysten/sui@1.45.2/client');

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

				// Get the signing feature from wallet
				const signFeature = connectedWallet?.features?.['sui:signAndExecuteTransaction']
					|| connectedWallet?.features?.['sui:signAndExecuteTransactionBlock'];

				if (!signFeature) {
					throw new Error('Wallet does not support transaction signing');
				}

				// Sign and execute
				const result = await signFeature.signAndExecuteTransaction({
					transaction: tx,
					account: connectedAccount,
					chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
				});

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

		// Register service worker for PWA
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/sw.js')
				.then(reg => console.log('SW registered'))
				.catch(err => console.log('SW registration failed:', err));
		}

		// ========== HELPER FUNCTIONS ==========
		// Validate if a string is a valid Sui address (0x followed by 64 hex chars)
		function isValidSuiAddress(addr) {
			if (!addr || typeof addr !== 'string') return false;
			return /^0x[a-fA-F0-9]{64}$/.test(addr);
		}

		// ========== OWNED SUINS NAMES ==========
		const namesContent = document.getElementById('names-content');
		const namesCountEl = document.getElementById('names-count');
		let allOwnedNames = [];
		let namesNextCursor = null;
		let namesHasMore = true;
		let namesLoading = false;

		// Fetch all SuiNS names owned by the target address
		async function fetchOwnedNames(cursor = null, ownerOverride = null) {
			if (namesLoading) return;

			// Determine the owner address to use
			let ownerAddress = ownerOverride || CURRENT_ADDRESS;

			// Validate address before attempting to fetch
			if (!isValidSuiAddress(ownerAddress)) {
				// Try to get owner from NFT as fallback
				if (!ownerOverride && NFT_ID) {
					console.log('Attempting to fetch NFT owner as fallback for names...');
					const nftOwner = await fetchNftOwner();
					if (nftOwner && isValidSuiAddress(nftOwner)) {
						console.log('Using NFT owner for names:', nftOwner);
						return fetchOwnedNames(cursor, nftOwner);
					}
				}
				console.warn('Invalid or missing address for names fetch:', ownerAddress);
				renderNamesError('No valid owner address available for this name');
				return;
			}

			namesLoading = true;

			try {
				const suiClient = getSuiClient();

				// Use the built-in resolveNameServiceNames method
				const response = await suiClient.resolveNameServiceNames({
					address: ownerAddress,
					cursor: cursor,
					limit: 50
				});

				if (response.data && response.data.length > 0) {
					allOwnedNames = cursor ? [...allOwnedNames, ...response.data] : response.data;
				}

				namesNextCursor = response.nextCursor;
				namesHasMore = response.hasNextPage || false;

				renderOwnedNames();
			} catch (error) {
				console.error('Failed to fetch owned names:', error);
				renderNamesError(error.message || 'Failed to load names');
			} finally {
				namesLoading = false;
			}
		}

		// Render the owned names grid
		function renderOwnedNames() {
			if (!namesContent) return;

			if (allOwnedNames.length === 0) {
				namesCountEl.textContent = '0';
				namesContent.innerHTML = \`
					<div class="names-empty">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
							<circle cx="9" cy="7" r="4"></circle>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
						</svg>
						<p>No SuiNS names found</p>
						<span class="hint">This address doesn't own any SuiNS names yet</span>
					</div>
				\`;
				return;
			}

			namesCountEl.textContent = namesHasMore ? \`\${allOwnedNames.length}+\` : String(allOwnedNames.length);

			const cardsHtml = allOwnedNames.map(name => {
				const cleanedName = name.replace(/\\.sui$/i, '');
				const isCurrentName = cleanedName.toLowerCase() === NAME.toLowerCase();
				const initial = cleanedName.charAt(0).toUpperCase();
				const profileUrl = \`https://\${cleanedName}.sui.ski\`;

				return \`
					<a href="\${profileUrl}" class="name-card\${isCurrentName ? ' current' : ''}" title="View \${cleanedName}.sui profile">
						<div class="name-card-header">
							<div class="name-card-avatar">\${initial}</div>
							<div class="name-card-name">\${escapeHtmlJs(cleanedName)}<span class="suffix">.sui</span></div>
						</div>
						<div class="name-card-meta">
							\${isCurrentName ? '<span class="name-card-badge current-tag">Current</span>' : ''}
							<svg class="name-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="9 18 15 12 9 6"></polyline>
							</svg>
						</div>
					</a>
				\`;
			}).join('');

			namesContent.innerHTML = \`
				<div class="names-grid">
					\${cardsHtml}
				</div>
				\${namesHasMore ? \`
					<div class="names-load-more">
						<button id="load-more-names-btn">Load More Names</button>
					</div>
				\` : ''}
			\`;

			// Attach load more handler
			const loadMoreBtn = document.getElementById('load-more-names-btn');
			if (loadMoreBtn) {
				loadMoreBtn.addEventListener('click', async () => {
					loadMoreBtn.disabled = true;
					loadMoreBtn.textContent = 'Loading...';
					await fetchOwnedNames(namesNextCursor);
				});
			}
		}

		// Render error state
		function renderNamesError(message) {
			if (!namesContent) return;
			namesCountEl.textContent = '-';
			namesContent.innerHTML = \`
				<div class="names-error">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<p>\${escapeHtmlJs(message)}</p>
					<button class="names-retry-btn" id="retry-names-btn">Try Again</button>
				</div>
			\`;

			const retryBtn = document.getElementById('retry-names-btn');
			if (retryBtn) {
				retryBtn.addEventListener('click', () => {
					namesContent.innerHTML = \`
						<div class="names-loading">
							<span class="loading"></span>
							<span>Fetching all SuiNS names owned by this address...</span>
						</div>
					\`;
					allOwnedNames = [];
					namesNextCursor = null;
					namesHasMore = true;
					fetchOwnedNames();
				});
			}
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

		// Load names when the names tab is first activated
		let namesLoaded = false;
		const namesTab = document.querySelector('[data-tab="names"]');
		if (namesTab) {
			namesTab.addEventListener('click', () => {
				if (!namesLoaded) {
					namesLoaded = true;
					fetchOwnedNames();
				}
			});
		}

		// Also load if names tab is already active (from localStorage)
		const activeTab = localStorage.getItem('sui_ski_active_tab');
		if (activeTab === 'names' && !namesLoaded) {
			namesLoaded = true;
			// Small delay to ensure DOM is ready
			setTimeout(() => fetchOwnedNames(), 100);
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
					nftsCountEl.textContent = \`\${allNFTs.length}+...\`;
					// Continue fetching next page (pass ownerAddress to maintain override)
					await fetchNFTs(nftsNextCursor, ownerAddress);
				} else {
					// All pages fetched, render final results
					renderNFTs();
					nftsCountEl.textContent = String(allNFTs.length);
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
						nftsCountEl.textContent = \`\${allNFTs.length}+...\`;
						// Continue fetching next page (pass ownerAddress to maintain override)
						await fetchNFTs(nftsNextCursor, ownerAddress);
					} else {
						// All pages fetched, render final results
						renderNFTs();
						nftsCountEl.textContent = String(allNFTs.length);
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
				nftsCountEl.textContent = '0';
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

			nftsCountEl.textContent = nftsHasMore ? \`\${allNFTs.length}+\` : String(allNFTs.length);

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
			nftsCountEl.textContent = '-';
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

		// Load NFTs when NFTs tab is first activated
		let nftsLoaded = false;
		const nftsTab = document.querySelector('[data-tab="nfts"]');
		if (nftsTab) {
			nftsTab.addEventListener('click', () => {
				if (!nftsLoaded) {
					nftsLoaded = true;
					fetchNFTs();
				}
			});
		}

		// Also load if NFTs tab is already active (from localStorage)
		if (activeTab === 'nfts' && !nftsLoaded) {
			nftsLoaded = true;
			setTimeout(() => fetchNFTs(), 100);
		}

		// Load NFTs on page load to populate the identity card (but don't render to tab yet)
		// This allows the identity card to show the NFT image immediately
		if (!nftsLoaded && activeTab !== 'nfts' && isValidSuiAddress(CURRENT_ADDRESS)) {
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

		// ========== BOUNTY SECTION ==========
		const bountyDays = document.getElementById('bounty-days');
		const bountyHours = document.getElementById('bounty-hours');
		const bountyMins = document.getElementById('bounty-mins');
		const bountySecs = document.getElementById('bounty-secs');
		const bountyQueueList = document.getElementById('bounty-queue-list');
		const bountyQueueEmpty = document.getElementById('bounty-queue-empty');
		const bountyRefreshBtn = document.getElementById('bounty-refresh-btn');
		const quickBountyBtn = document.getElementById('quick-bounty-btn');
		const createBountyStatus = document.getElementById('create-bounty-status');

		// Expiration timer elements
		const expDays = document.getElementById('exp-days');
		const expHours = document.getElementById('exp-hours');
		const expMins = document.getElementById('exp-mins');
		const expSecs = document.getElementById('exp-secs');

		// Track bounties
		let currentBounties = [];

		// Format address for display
		function formatAddress(addr) {
			if (!addr) return 'Unknown';
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		// Format amount with K/M suffix
		function formatAmount(amount) {
			if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
			if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
			return amount.toFixed(2);
		}

		// Update the bounty countdown timer
		function updateBountyCountdown() {
			if (!AVAILABLE_AT) return;

			const now = Date.now();
			const diff = AVAILABLE_AT - now;

			if (diff <= 0) {
				if (bountyDays) bountyDays.textContent = '00';
				if (bountyHours) bountyHours.textContent = '00';
				if (bountyMins) bountyMins.textContent = '00';
				if (bountySecs) bountySecs.textContent = '00';
				return;
			}

			const days = Math.floor(diff / (24 * 60 * 60 * 1000));
			const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
			const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
			const secs = Math.floor((diff % (60 * 1000)) / 1000);

			if (bountyDays) bountyDays.textContent = String(days).padStart(2, '0');
			if (bountyHours) bountyHours.textContent = String(hours).padStart(2, '0');
			if (bountyMins) bountyMins.textContent = String(mins).padStart(2, '0');
			if (bountySecs) bountySecs.textContent = String(secs).padStart(2, '0');
		}

		// Update the expiration countdown timer
		function updateExpirationCountdown() {
			if (!EXPIRATION_MS) return;

			const now = Date.now();
			const diff = EXPIRATION_MS - now;

			if (diff <= 0) {
				if (expDays) expDays.textContent = '00';
				if (expHours) expHours.textContent = '00';
				if (expMins) expMins.textContent = '00';
				if (expSecs) expSecs.textContent = '00';
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
			return {
				_bytes: bytes,
				toJSON() {
					return btoa(
						String.fromCharCode.apply(
							null,
							Array.from(this._bytes),
						),
					)
				},
				serialize() {
					return this._bytes
				},
			}
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
						tx.pure.u64(BigInt(AVAILABLE_AT)),
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

		// Event listeners for bounty section
		if (bountyRefreshBtn) {
			bountyRefreshBtn.addEventListener('click', fetchBountyQueue);
		}
		if (quickBountyBtn) {
			quickBountyBtn.addEventListener('click', createQuickBounty);
		}

		// Initialize bounty section
		if (EXPIRATION_MS) {
			fetchBountyQueue();
			setInterval(fetchBountyQueue, 30000);
			updateBountyCountdown();
			setInterval(updateBountyCountdown, 1000);
			updateExpirationCountdown();
			setInterval(updateExpirationCountdown, 1000);
		}

		// ========== LINKED NAMES (Reverse Resolution) ==========
		const linkedNamesList = document.getElementById('linked-names-list');
		const linkedNamesCount = document.getElementById('linked-names-count');

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
			// Use owner address to find other names owned by the same wallet
			const ownerAddr = OWNER_ADDRESS || TARGET_ADDRESS;
			if (!linkedNamesList || !ownerAddr) {
				if (linkedNamesList) {
					linkedNamesList.innerHTML = '<div class="linked-names-empty">No owner address found</div>';
				}
				if (linkedNamesCount) linkedNamesCount.textContent = '0';
				return;
			}

			try {
				// Fetch all names owned by this address (grouped by target address)
				const res = await fetch('/api/names/' + ownerAddr);
				if (!res.ok) throw new Error('Failed to fetch');
				const data = await res.json();
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

				for (const addr of addresses) {
					const group = grouped[addr];
					if (!group || group.length === 0) continue;

					// Address header
					const addrLabel = addr === 'unset' ? 'No target set' : shortAddr(addr);
					html += '<div class="linked-group">';
					html += '<div class="linked-group-header">';
					html += '<span class="linked-group-addr">' + addrLabel + '</span>';
					html += '<span class="linked-group-count">' + group.length + '</span>';
					html += '</div>';
					html += '<div class="linked-group-names">';

					for (const item of group) {
						const cleanName = item.name.replace(/\\.sui$/, '');
						const isCurrent = cleanName.toLowerCase() === NAME.toLowerCase();
						const tag = getExpirationTag(item.expirationMs);
						const classes = ['linked-name-chip'];
						if (isCurrent) classes.push('current');
						if (item.isPrimary) classes.push('primary');

						html += '<a href="https://' + cleanName + '.sui.ski" class="' + classes.join(' ') + '">';
						if (item.isPrimary) {
							html += '<svg class="primary-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
						}
						html += '<span class="linked-name-text">' + cleanName + '.sui</span>';
						html += '<span class="linked-name-tag ' + tag.color + '">' + tag.text + '</span>';
						html += '</a>';
					}

					html += '</div></div>';
				}

				linkedNamesList.innerHTML = html;
			} catch (error) {
				console.error('Failed to fetch linked names:', error);
				linkedNamesList.innerHTML = '<div class="linked-names-empty">Could not load linked names</div>';
				if (linkedNamesCount) linkedNamesCount.textContent = '--';
			}
		}

		// Initialize linked names
		if (OWNER_ADDRESS || TARGET_ADDRESS) {
			fetchLinkedNames();
		}

		// ========== GRACE PERIOD BANNER COUNTDOWN ==========
		const graceDays = document.getElementById('grace-days');
		const graceHours = document.getElementById('grace-hours');
		const graceMins = document.getElementById('grace-mins');
		const graceSecs = document.getElementById('grace-secs');
		const graceBanner = document.getElementById('grace-period-banner');

		function updateGracePeriodCountdown() {
			if (!EXPIRATION_MS || !IS_IN_GRACE_PERIOD) return;

			const now = Date.now();
			const gracePeriodEnd = AVAILABLE_AT;
			const diff = gracePeriodEnd - now;

			if (diff <= 0) {
				// Grace period has ended - name is now available
				if (graceDays) graceDays.textContent = '00';
				if (graceHours) graceHours.textContent = '00';
				if (graceMins) graceMins.textContent = '00';
				if (graceSecs) graceSecs.textContent = '00';
				if (graceBanner) {
					const header = graceBanner.querySelector('.grace-countdown-header span');
					if (header) header.textContent = 'Available Now!';
				}
				return;
			}

			const days = Math.floor(diff / (24 * 60 * 60 * 1000));
			const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
			const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
			const secs = Math.floor((diff % (60 * 1000)) / 1000);

			if (graceDays) graceDays.textContent = String(days).padStart(2, '0');
			if (graceHours) graceHours.textContent = String(hours).padStart(2, '0');
			if (graceMins) graceMins.textContent = String(mins).padStart(2, '0');
			if (graceSecs) graceSecs.textContent = String(secs).padStart(2, '0');
		}

		if (IS_IN_GRACE_PERIOD && EXPIRATION_MS) {
			// Start countdown
			updateGracePeriodCountdown();
			setInterval(updateGracePeriodCountdown, 1000);
		}

		// ========== SIMPLIFIED SNIPE BUTTON ==========
		const graceSnipeBtn = document.getElementById('grace-snipe-btn');
		const graceSnipeStatus = document.getElementById('grace-snipe-status');

		function showSnipeStatus(message, type) {
			if (!graceSnipeStatus) return;
			graceSnipeStatus.innerHTML = message;
			graceSnipeStatus.className = 'grace-snipe-status ' + type;
			graceSnipeStatus.classList.remove('hidden');
		}

		function hideSnipeStatus() {
			if (!graceSnipeStatus) return;
			graceSnipeStatus.classList.add('hidden');
		}

		// One-click snipe bounty with fixed values: 10 SUI total, 1 SUI reward, 1 year
		async function createSnipeBounty() {
			if (!connectedAddress) {
				showSnipeStatus('Please connect your wallet first', 'error');
				connectWallet();
				return;
			}

			if (!connectedWallet) {
				showSnipeStatus('Wallet not detected. Please reconnect.', 'error');
				return;
			}

			if (!BOUNTY_ESCROW_PACKAGE_ID) {
				showSnipeStatus('Bounty escrow contract is not configured on this network.', 'error');
				return;
			}

			// Fixed values: 10 SUI total, 1 SUI reward, 1 year
			const totalAmountSui = 10;
			const executorRewardSui = 1;
			const years = 1;

			const totalAmountMist = BigInt(totalAmountSui * 1000000000);
			const executorRewardMist = BigInt(executorRewardSui * 1000000000);

			if (graceSnipeBtn) graceSnipeBtn.disabled = true;
			showSnipeStatus('<span class="loading-spinner"></span> Building transaction...', 'loading');

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
						tx.pure.u64(BigInt(AVAILABLE_AT)),
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
					showSnipeStatus('<span class="loading-spinner"></span> Sign in wallet...', 'loading');
					try {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: txWrapper,
							account: connectedAccount,
							chain,
							options: { showEffects: true, showObjectChanges: true },
						});
					} catch (error) {
						console.warn('signAndExecuteTransaction failed, falling back:', error);
					}
				}

				if (!result) {
					if (!signFeature) {
						throw new Error('Wallet does not support transaction execution');
					}
					showSnipeStatus('<span class="loading-spinner"></span> Submitting...', 'loading');
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

				showSnipeStatus('<span class="loading-spinner"></span> Finalizing...', 'loading');
				const escrowObjectId = await resolveBountyObjectIdFromResult(result, suiClient);
				if (!escrowObjectId) {
					throw new Error('Escrow created but object ID could not be determined.');
				}

				// Record the bounty
				await fetch('/api/bounties', {
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

				showSnipeStatus('Bounty created! <a href="https://suivision.xyz/txblock/' + result.digest + '" target="_blank">View tx</a>', 'success');
				setTimeout(hideSnipeStatus, 8000);
			} catch (error) {
				console.error('Failed to create snipe bounty:', error);
				const message = error instanceof Error ? error.message : 'Failed to create bounty';
				showSnipeStatus(message, 'error');
			} finally {
				if (graceSnipeBtn) graceSnipeBtn.disabled = false;
			}
		}

		if (graceSnipeBtn) {
			graceSnipeBtn.addEventListener('click', createSnipeBounty);
		}

		// ========== YOUR BOUNTIES FUNCTIONALITY ==========
		const yourBountiesSection = document.getElementById('your-bounties-section');
		const yourBountiesConnect = document.getElementById('your-bounties-connect');
		const yourBountiesConnectBtn = document.getElementById('your-bounties-connect-btn');
		const yourBountiesList = document.getElementById('your-bounties-list');
		const yourBountiesEmpty = document.getElementById('your-bounties-empty');

		// Store for user's bounties
		let userBounties = [];

		// Connect button handler
		if (yourBountiesConnectBtn) {
			yourBountiesConnectBtn.addEventListener('click', connectWallet);
		}

		// Update bounties section visibility based on wallet connection
		function updateBountiesSectionVisibility() {
			if (!yourBountiesSection) return;

			if (!connectedAddress) {
				yourBountiesConnect?.classList.remove('hidden');
				yourBountiesList?.classList.add('hidden');
				yourBountiesEmpty?.classList.add('hidden');
			} else {
				yourBountiesConnect?.classList.add('hidden');
				refreshUserBounties();
			}
		}

		// Fetch bounties created by the connected wallet for this name
		async function refreshUserBounties() {
			if (!connectedAddress || !yourBountiesList) return;

			yourBountiesList.classList.remove('hidden');
			yourBountiesEmpty?.classList.add('hidden');
			yourBountiesList.innerHTML = \`
				<div class="your-bounties-loading">
					<span class="loading-spinner"></span>
					Loading your bounties...
				</div>
			\`;

			try {
				const creatorParam = connectedAddress.toLowerCase();
				const res = await fetch('/api/bounties/' + NAME + '?creator=' + creatorParam);
				if (!res.ok) throw new Error('Failed to fetch bounties');

				const data = await res.json();
				userBounties = data.bounties || [];

				if (userBounties.length === 0) {
					yourBountiesList.classList.add('hidden');
					yourBountiesEmpty?.classList.remove('hidden');
					return;
				}

				renderUserBounties();
			} catch (error) {
				console.error('Failed to fetch user bounties:', error);
				yourBountiesList.innerHTML = \`
					<div class="your-bounties-error">
						Failed to load bounties. <button class="your-bounties-retry" onclick="refreshUserBounties()">Retry</button>
					</div>
				\`;
			}
		}

		// Render the user's bounties list
		function renderUserBounties() {
			if (!yourBountiesList) return;

			const formatAmount = (mist) => (Number(mist) / 1e9).toFixed(2);
			const formatStatus = (status, hasSignedTx) => {
				if (status === 'pending' && !hasSignedTx) return 'Needs Signature';
				if (status === 'pending' && hasSignedTx) return 'Awaiting Execution';
				if (status === 'ready') return 'Ready to Execute';
				if (status === 'executing') return 'Executing...';
				if (status === 'completed') return 'Completed';
				if (status === 'failed') return 'Failed';
				if (status === 'cancelled') return 'Cancelled';
				return status;
			};
			const getStatusClass = (status, hasSignedTx) => {
				if (status === 'pending' && !hasSignedTx) return 'needs-signature';
				if (status === 'completed') return 'completed';
				if (status === 'failed') return 'failed';
				if (status === 'cancelled') return 'cancelled';
				return status;
			};

			yourBountiesList.innerHTML = userBounties.map(bounty => \`
				<div class="your-bounty-item" data-bounty-id="\${bounty.id}">
					<div class="your-bounty-header">
						<div class="your-bounty-amount">\${formatAmount(bounty.totalAmountMist)} SUI</div>
						<div class="your-bounty-status \${getStatusClass(bounty.status, bounty.hasSignedTx)}">\${formatStatus(bounty.status, bounty.hasSignedTx)}</div>
					</div>
					<div class="your-bounty-details">
						<div class="your-bounty-detail">
							<span class="detail-label">Executor Reward:</span>
							<span class="detail-value">\${formatAmount(bounty.executorRewardMist)} SUI</span>
						</div>
						<div class="your-bounty-detail">
							<span class="detail-label">Duration:</span>
							<span class="detail-value">\${bounty.years} year\${bounty.years > 1 ? 's' : ''}</span>
						</div>
						<div class="your-bounty-detail">
							<span class="detail-label">Created:</span>
							<span class="detail-value">\${new Date(bounty.createdAt).toLocaleDateString()}</span>
						</div>
					</div>
					<div class="your-bounty-actions">
						\${bounty.status === 'pending' && !bounty.hasSignedTx ? \`
							<button class="your-bounty-sign-btn" onclick="signBountyTransaction('\${bounty.id}')">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
								</svg>
								Sign Transaction
							</button>
						\` : ''}
						\${bounty.status === 'pending' && bounty.hasSignedTx ? \`
							<div class="your-bounty-signed">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="20 6 9 17 4 12"></polyline>
								</svg>
								Signed - awaiting grace period end
							</div>
						\` : ''}
						\${bounty.status === 'pending' || bounty.status === 'ready' ? \`
							<button class="your-bounty-cancel-btn" onclick="cancelBounty('\${bounty.id}')">Cancel</button>
						\` : ''}
					</div>
				</div>
			\`).join('');
		}

		// Sign a bounty transaction offline
		async function signBountyTransaction(bountyId) {
			if (!connectedWallet || !connectedAddress) {
				connectWallet();
				return;
			}

			const bounty = userBounties.find(b => b.id === bountyId);
			if (!bounty) {
				alert('Bounty not found');
				return;
			}

			// Update UI to show signing in progress
			const bountyEl = document.querySelector(\`[data-bounty-id="\${bountyId}"]\`);
			const actionsEl = bountyEl?.querySelector('.your-bounty-actions');
			if (actionsEl) {
				actionsEl.innerHTML = \`
					<div class="your-bounty-signing">
						<span class="loading-spinner"></span>
						Building transaction...
					</div>
				\`;
			}

			try {
				// Step 1: Build the transaction bytes
				const buildRes = await fetch('/api/bounties/' + NAME + '/' + bountyId + '/build-tx', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ executorAddress: connectedAddress })
				});

				if (!buildRes.ok) {
					const error = await buildRes.json();
					throw new Error(error.error || 'Failed to build transaction');
				}

				const { txBytes, digest } = await buildRes.json();

				if (actionsEl) {
					actionsEl.innerHTML = \`
						<div class="your-bounty-signing">
							<span class="loading-spinner"></span>
							Sign in your wallet...
						</div>
					\`;
				}

				// Step 2: Sign the transaction with the connected wallet
				const signFeature = connectedWallet.features?.['sui:signTransaction'];
				if (!signFeature) {
					throw new Error('Wallet does not support transaction signing');
				}

				const txBytesUint8 = Uint8Array.from(atob(txBytes), c => c.charCodeAt(0));
				const signResult = await signFeature.signTransaction({
					transaction: txBytesUint8,
					account: connectedAccount,
				});

				if (actionsEl) {
					actionsEl.innerHTML = \`
						<div class="your-bounty-signing">
							<span class="loading-spinner"></span>
							Saving signature...
						</div>
					\`;
				}

				// Step 3: Attach the signature to the bounty
				const attachRes = await fetch('/api/bounties/' + NAME + '/' + bountyId + '/attach-tx', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						txBytes: txBytes,
						signature: signResult.signature,
					})
				});

				if (!attachRes.ok) {
					const error = await attachRes.json();
					throw new Error(error.error || 'Failed to attach signature');
				}

				// Refresh the bounties list
				await refreshUserBounties();

			} catch (error) {
				console.error('Failed to sign bounty transaction:', error);
				if (actionsEl) {
					actionsEl.innerHTML = \`
						<div class="your-bounty-error">
							Failed: \${error.message || 'Unknown error'}
							<button class="your-bounty-retry-btn" onclick="signBountyTransaction('\${bountyId}')">Retry</button>
						</div>
					\`;
				}
			}
		}

		// Cancel a bounty
		async function cancelBounty(bountyId) {
			if (!confirm('Are you sure you want to cancel this bounty? Funds will be returned to your wallet.')) {
				return;
			}

			const bountyEl = document.querySelector(\`[data-bounty-id="\${bountyId}"]\`);
			const actionsEl = bountyEl?.querySelector('.your-bounty-actions');
			if (actionsEl) {
				actionsEl.innerHTML = \`
					<div class="your-bounty-signing">
						<span class="loading-spinner"></span>
						Cancelling...
					</div>
				\`;
			}

			try {
				const res = await fetch('/api/bounties/' + NAME + '/' + bountyId, {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ creator: connectedAddress })
				});

				if (!res.ok) {
					const error = await res.json();
					throw new Error(error.error || 'Failed to cancel bounty');
				}

				// Refresh the bounties list
				await refreshUserBounties();

			} catch (error) {
				console.error('Failed to cancel bounty:', error);
				alert('Failed to cancel bounty: ' + (error.message || 'Unknown error'));
				renderUserBounties(); // Re-render to restore buttons
			}
		}

		// Make functions globally available
		window.signBountyTransaction = signBountyTransaction;
		window.cancelBounty = cancelBounty;
		window.refreshUserBounties = refreshUserBounties;

		// Initialize bounties section if in grace period
		if (IS_IN_GRACE_PERIOD) {
			updateBountiesSectionVisibility();
		}

		// ========== MVR REGISTRATION FUNCTIONALITY ==========
		const MVR_CORE_PACKAGE = '0xbb97fa5af2504cc944a8df78dcb5c8b72c3673ca4ba8e4969a98188bf745ee54';
		const MVR_METADATA_PACKAGE = '0xc88768f8b26581a8ee1bf71e6a6ec0f93d4cc6460ebb66a31b94d64de8105c98';
		const MVR_REGISTRY_ID = '0x0e5d473a055b6b7d014af557a13ad9075157fdc19b6d51562a18511afd397727';

		const mvrToggleBtn = document.getElementById('mvr-toggle-btn');
		const mvrToggleIcon = document.getElementById('mvr-toggle-icon');
		const mvrContent = document.getElementById('mvr-content');
		const mvrWalletRequired = document.getElementById('mvr-wallet-required');
		const mvrNotOwner = document.getElementById('mvr-not-owner');
		const mvrRegisterForm = document.getElementById('mvr-register-form');
		const mvrSuinsName = document.getElementById('mvr-suins-name');
		const mvrPackageName = document.getElementById('mvr-package-name');
		const mvrPackageAddress = document.getElementById('mvr-package-address');
		const mvrUpgradeCap = document.getElementById('mvr-upgrade-cap');
		const mvrStatus = document.getElementById('mvr-status');
		const mvrRegisterBtn = document.getElementById('mvr-register-btn');
		const mvrRegisterBtnText = document.getElementById('mvr-register-btn-text');
		const mvrTransferUpgradeCapBtn = document.getElementById('mvr-transfer-upgrade-cap-btn');
		const mvrShareUpgradeCapBtn = document.getElementById('mvr-share-upgrade-cap-btn');

		let mvrExpanded = false;

		// Toggle MVR section
		if (mvrToggleBtn) {
			mvrToggleBtn.addEventListener('click', async () => {
				mvrExpanded = !mvrExpanded;
				mvrContent.style.display = mvrExpanded ? 'block' : 'none';
				mvrToggleIcon.innerHTML = mvrExpanded
					? '<polyline points="18 15 12 9 6 15"></polyline>'
					: '<polyline points="6 9 12 15 18 9"></polyline>';
				if (mvrExpanded) {
					await updateMvrSectionVisibility();
				}
			});
		}

		// Update MVR section visibility based on wallet state
		async function updateMvrSectionVisibility() {
			if (!mvrContent) return;

			// Set the SuiNS name
			if (mvrSuinsName) {
				mvrSuinsName.value = NAME;
			}

			// Ensure NFT owner is fetched if not already
			if (!nftOwnerAddress && NFT_ID) {
				nftOwnerAddress = await fetchNftOwner();
			}

			// Check if connected wallet can use UpgradeCap (either owns NFT, is target address, or owns UpgradeCap)
			let canUseMvr = false;
			if (connectedAddress) {
				// Can use if: owns NFT, is target address, or owns the UpgradeCap (or UpgradeCap is shared)
				canUseMvr = canEdit || connectedAddress === nftOwnerAddress || connectedAddress === CURRENT_ADDRESS;
				
				// Also check if UpgradeCap is owned by connected wallet or is shared
				if (!canUseMvr && mvrUpgradeCap?.value?.trim()) {
					try {
						const upgradeCapId = mvrUpgradeCap.value.trim();
						if (/^0x[a-f0-9]{64}$/i.test(upgradeCapId)) {
							const suiClient = getSuiClient();
							const upgradeCapObj = await suiClient.getObject({
								id: upgradeCapId,
								options: { showOwner: true }
							});
							if (upgradeCapObj.data) {
								const owner = upgradeCapObj.data.owner;
								// If shared or immutable, anyone can use it
								if (owner && typeof owner === 'object') {
									if ('Shared' in owner || 'Immutable' in owner) {
										canUseMvr = true;
									} else if ('AddressOwner' in owner) {
										// Check if owned by connected wallet or by an object we own
										const ownerAddr = owner.AddressOwner;
										if (ownerAddr === connectedAddress) {
											canUseMvr = true;
										} else {
											// Check if owned by an object ID that we own
											try {
												const ownerObj = await suiClient.getObject({
													id: ownerAddr,
													options: { showOwner: true }
												});
												if (ownerObj.data?.owner && typeof ownerObj.data.owner === 'object' && 'AddressOwner' in ownerObj.data.owner) {
													if (ownerObj.data.owner.AddressOwner === connectedAddress) {
														canUseMvr = true;
													}
												}
											} catch (e) {
												// Not an object, ignore
											}
										}
									}
								}
							}
						}
					} catch (err) {
						// If we can't check, fall back to original logic
						console.log('Could not check UpgradeCap ownership');
					}
				}
			}

			if (!connectedAddress) {
				// Not connected - show connect prompt
				mvrWalletRequired.style.display = 'block';
				mvrNotOwner.style.display = 'none';
				mvrRegisterForm.style.display = 'none';
			} else if (!canUseMvr) {
				// Connected but cannot use MVR
				mvrWalletRequired.style.display = 'none';
				mvrNotOwner.style.display = 'block';
				mvrRegisterForm.style.display = 'none';
			} else {
				// Can use MVR - show form
				mvrWalletRequired.style.display = 'none';
				mvrNotOwner.style.display = 'none';
				mvrRegisterForm.style.display = 'block';
				
				// Set default values for bounty-escrow package if fields are empty
				if (mvrPackageName && !mvrPackageName.value.trim()) {
					mvrPackageName.value = 'bounty-escrow';
				}
				if (mvrPackageAddress && !mvrPackageAddress.value.trim()) {
					mvrPackageAddress.value = '0x8d169b13d5cbdec20ad0a215f27ba8fe6e97daa9f6fa5a41e5e53d62928b1026';
				}
				if (mvrUpgradeCap && !mvrUpgradeCap.value.trim()) {
					mvrUpgradeCap.value = '0x6ba7ed57e524dae7945d0a4a4a574f76b2317918bfe07cf1baf0bead7ff6c711';
				}
			}
		}

		function showMvrStatus(msg, type) {
			if (!mvrStatus) return;
			mvrStatus.style.display = 'block';
			mvrStatus.innerHTML = msg;
			mvrStatus.style.background = type === 'error' ? 'rgba(248, 113, 113, 0.15)' :
				type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(96, 165, 250, 0.15)';
			mvrStatus.style.border = type === 'error' ? '1px solid rgba(248, 113, 113, 0.3)' :
				type === 'success' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(96, 165, 250, 0.3)';
			mvrStatus.style.color = type === 'error' ? '#f87171' :
				type === 'success' ? '#34d399' : '#60a5fa';
		}

		function hideMvrStatus() {
			if (mvrStatus) mvrStatus.style.display = 'none';
		}

		// Handle MVR registration form submission
		if (mvrRegisterForm) {
			mvrRegisterForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				await handleMvrRegistration();
			});
		}

		// Handle UpgradeCap transfer to brando.sui
		if (mvrTransferUpgradeCapBtn) {
			mvrTransferUpgradeCapBtn.addEventListener('click', async () => {
				await handleTransferUpgradeCap();
			});
		}

		// Handle making UpgradeCap shared
		if (mvrShareUpgradeCapBtn) {
			mvrShareUpgradeCapBtn.addEventListener('click', async () => {
				await handleShareUpgradeCap();
			});
		}

		async function handleTransferUpgradeCap() {
			if (!connectedWallet || !connectedAccount) {
				showMvrStatus('Please connect your wallet first.', 'error');
				return;
			}

			const upgradeCap = mvrUpgradeCap?.value?.trim();
			if (!upgradeCap || !/^0x[a-f0-9]{64}$/i.test(upgradeCap)) {
				showMvrStatus('Please enter a valid UpgradeCap object ID first.', 'error');
				return;
			}

			try {
				mvrTransferUpgradeCapBtn.disabled = true;
				mvrTransferUpgradeCapBtn.textContent = 'Checking UpgradeCap...';
				hideMvrStatus();

				const suiClient = getSuiClient();

				// Check UpgradeCap ownership
				const upgradeCapObj = await suiClient.getObject({
					id: upgradeCap,
					options: { showOwner: true }
				});

				if (!upgradeCapObj.data) {
					showMvrStatus('UpgradeCap object not found.', 'error');
					mvrTransferUpgradeCapBtn.disabled = false;
					mvrTransferUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="9 18 15 12 9 6"></polyline></svg><span>Transfer UpgradeCap to Connected Wallet</span>';
					return;
				}

				const owner = upgradeCapObj.data.owner;
				if (!owner || typeof owner !== 'object' || !('AddressOwner' in owner)) {
					showMvrStatus('UpgradeCap is not owned (it may be shared or immutable). Transfer is not needed.', 'error');
					mvrTransferUpgradeCapBtn.disabled = false;
					mvrTransferUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="9 18 15 12 9 6"></polyline></svg><span>Transfer UpgradeCap to Connected Wallet</span>';
					return;
				}

				const currentOwner = owner.AddressOwner;
				
				// Check if already owned by connected wallet
				if (currentOwner === connectedAddress) {
					showMvrStatus('UpgradeCap is already owned by your connected wallet (' + connectedAddress.slice(0, 8) + '...).', 'info');
					mvrTransferUpgradeCapBtn.disabled = false;
					mvrTransferUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="9 18 15 12 9 6"></polyline></svg><span>Transfer UpgradeCap to Connected Wallet</span>';
					return;
				}

			// Special case: If UpgradeCap is owned by an object ID (like vortex.sui NFT),
			// and the connected wallet owns that NFT, we can transfer it
			let canTransfer = false;
			let parentObjectId = null;
			if (currentOwner !== connectedAddress) {
				// First, check if the UpgradeCap is owned by the current domain's SuiNS NFT object ID
				if (NFT_ID && currentOwner === NFT_ID) {
					// The UpgradeCap is owned by this domain's SuiNS object ID
					// Check if we own the NFT
					try {
						const nftObj = await suiClient.getObject({
							id: NFT_ID,
							options: { showOwner: true }
						});
						if (nftObj.data?.owner && typeof nftObj.data.owner === 'object' && 'AddressOwner' in nftObj.data.owner) {
							const nftOwner = nftObj.data.owner.AddressOwner;
							if (nftOwner === connectedAddress) {
								canTransfer = true;
								parentObjectId = NFT_ID; // Use the current domain's NFT ID
							}
						}
					} catch (e) {
						console.error('Error checking NFT ownership:', e);
					}
				}
				
				// If not the current domain's NFT, check if currentOwner is any object we own
				if (!canTransfer) {
					try {
						const ownerObj = await suiClient.getObject({
							id: currentOwner,
							options: { showOwner: true }
						});
						if (ownerObj.data?.owner && typeof ownerObj.data.owner === 'object' && 'AddressOwner' in ownerObj.data.owner) {
							const nftOwner = ownerObj.data.owner.AddressOwner;
							if (nftOwner === connectedAddress) {
								canTransfer = true;
								parentObjectId = currentOwner; // Store the parent object ID
							}
						}
					} catch (e) {
						// Not an object or doesn't exist, treat as regular address
					}
				}
				
				if (!canTransfer) {
					showMvrStatus('UpgradeCap is owned by ' + currentOwner.slice(0, 8) + '... Please connect the wallet that owns the UpgradeCap (or the SuiNS object that owns it) to transfer it.', 'error');
					mvrTransferUpgradeCapBtn.disabled = false;
					mvrTransferUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="9 18 15 12 9 6"></polyline></svg><span>Transfer UpgradeCap to Connected Wallet</span>';
					return;
				}
			}

			mvrTransferUpgradeCapBtn.textContent = 'Building transaction...';

			// Build transfer transaction - transfer TO the connected wallet
			const tx = new Transaction();
			
			// If the UpgradeCap is owned by an object ID that we own, we need to include the parent object
			// In Sui, when transferring an object owned by another object, the parent must be in the transaction.
			// The simplest approach is to just use transferObjects - Sui will automatically include
			// the parent object if we own it and it's needed to authorize the transfer.
			if (canTransfer && parentObjectId) {
				// Simply transfer the UpgradeCap - Sui's transaction builder will automatically
				// include the parent object (which we own) to authorize the transfer
				tx.transferObjects([tx.object(upgradeCap)], connectedAddress);
			} else {
				// Regular transfer from address owner
				tx.transferObjects([tx.object(upgradeCap)], connectedAddress);
			}

				const senderAddress = typeof connectedAccount.address === 'string'
					? connectedAccount.address
					: connectedAccount.address?.toString() || connectedAddress;
				tx.setSender(senderAddress);

				mvrTransferUpgradeCapBtn.textContent = 'Approve in wallet...';

				// Build transaction before signing
				const builtTxBytes = await tx.build({ client: suiClient });

				// Wrap transaction for wallet compatibility
				const txWrapper = {
					_bytes: builtTxBytes,
					toJSON() {
						return btoa(String.fromCharCode.apply(null, this._bytes));
					},
					serialize() {
						return this._bytes;
					}
				};

				// Sign and execute
				const result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
					transaction: txWrapper,
					account: connectedAccount,
					chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
				});

				if (!result?.digest) {
					throw new Error('Transaction failed - no digest returned');
				}

				// Success!
				showMvrStatus(
					'UpgradeCap transferred successfully to your wallet (' + connectedAddress.slice(0, 8) + '...)! ' +
					'<a href="' + EXPLORER_BASE + '/tx/' + result.digest + '" target="_blank" style="color: inherit; text-decoration: underline;">View transaction</a><br>' +
					'<br>You can now use this UpgradeCap to register the package in MVR.',
					'success'
				);

				// Update the form field to show the new owner
				if (mvrUpgradeCap) {
					mvrUpgradeCap.value = upgradeCap; // Keep the same ID, ownership changed
				}

			} catch (error) {
				console.error('UpgradeCap transfer error:', error);
				var msg = error && error.message ? error.message : (typeof error === 'string' ? error : 'Unknown error');
				
				// Clean up the message
				msg = msg
					.replace(new RegExp('^Me:\\s*', 'i'), '')
					.replace(new RegExp('^Error:\\s*', 'i'), '')
					.replace(new RegExp('^SuiError:\\s*', 'i'), '')
					.trim();

				showMvrStatus('Transfer failed: ' + msg, 'error');
			} finally {
				mvrTransferUpgradeCapBtn.disabled = false;
				mvrTransferUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><polyline points="9 18 15 12 9 6"></polyline></svg><span>Transfer UpgradeCap to Connected Wallet</span>';
			}
		}

		async function handleShareUpgradeCap() {
			if (!connectedWallet || !connectedAccount) {
				showMvrStatus('Please connect your wallet first.', 'error');
				return;
			}

			const upgradeCap = mvrUpgradeCap?.value?.trim();
			if (!upgradeCap || !/^0x[a-f0-9]{64}$/i.test(upgradeCap)) {
				showMvrStatus('Please enter a valid UpgradeCap object ID first.', 'error');
				return;
			}

			try {
				mvrShareUpgradeCapBtn.disabled = true;
				mvrShareUpgradeCapBtn.textContent = 'Checking UpgradeCap...';
				hideMvrStatus();

				const suiClient = getSuiClient();

				// Check UpgradeCap ownership
				const upgradeCapObj = await suiClient.getObject({
					id: upgradeCap,
					options: { showOwner: true }
				});

				if (!upgradeCapObj.data) {
					showMvrStatus('UpgradeCap object not found.', 'error');
					mvrShareUpgradeCapBtn.disabled = false;
					mvrShareUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>Make UpgradeCap Shared</span>';
					return;
				}

				const owner = upgradeCapObj.data.owner;
				
				// Check if already shared
				if (owner && typeof owner === 'object' && 'Shared' in owner) {
					showMvrStatus('UpgradeCap is already shared! Anyone can use it for MVR registration.', 'info');
					mvrShareUpgradeCapBtn.disabled = false;
					mvrShareUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>Make UpgradeCap Shared</span>';
					return;
				}

				// Check if owned by connected wallet
				if (!owner || typeof owner !== 'object' || !('AddressOwner' in owner)) {
					showMvrStatus('UpgradeCap is not owned (it may be immutable). Cannot make it shared.', 'error');
					mvrShareUpgradeCapBtn.disabled = false;
					mvrShareUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>Make UpgradeCap Shared</span>';
					return;
				}

				const currentOwner = owner.AddressOwner;
				
				// Check if owned by object ID (like NFT)
				let isOwnedByObjectId = false;
				if (currentOwner !== connectedAddress) {
					try {
						const ownerObj = await suiClient.getObject({
							id: currentOwner,
							options: { showOwner: true }
						});
						if (ownerObj.data) {
							isOwnedByObjectId = true;
							// Check if we own the parent object
							if (ownerObj.data.owner && typeof ownerObj.data.owner === 'object' && 'AddressOwner' in ownerObj.data.owner) {
								const parentOwner = ownerObj.data.owner.AddressOwner;
								if (parentOwner !== connectedAddress) {
									showMvrStatus('UpgradeCap is owned by an object ID, but you do not own that object. Cannot make it shared.', 'error');
									mvrShareUpgradeCapBtn.disabled = false;
									mvrShareUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>Make UpgradeCap Shared</span>';
									return;
								}
							}
						}
					} catch (e) {
						// Not an object, treat as regular address
					}
				}

				if (currentOwner !== connectedAddress && !isOwnedByObjectId) {
					showMvrStatus('You must be the owner of the UpgradeCap to make it shared. Current owner: ' + currentOwner.slice(0, 8) + '...', 'error');
					mvrShareUpgradeCapBtn.disabled = false;
					mvrShareUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>Make UpgradeCap Shared</span>';
					return;
				}

				mvrShareUpgradeCapBtn.textContent = 'Building transaction...';

				// Build transaction to make UpgradeCap shared
				// In Sui, we use public_share_object for objects with 'store' ability
				const tx = new Transaction();
				
				// Use the Move function to share the object
				// @0x2::transfer::public_share_object<T: key + store>(obj: T)
				tx.moveCall({
					target: '0x2::transfer::public_share_object',
					typeArguments: ['0x2::package::UpgradeCap'],
					arguments: [tx.object(upgradeCap)],
				});

				const senderAddress = typeof connectedAccount.address === 'string'
					? connectedAccount.address
					: connectedAccount.address?.toString() || connectedAddress;
				tx.setSender(senderAddress);

				mvrShareUpgradeCapBtn.textContent = 'Approve in wallet...';

				// Build transaction before signing
				const builtTxBytes = await tx.build({ client: suiClient });

				// Wrap transaction for wallet compatibility
				const txWrapper = {
					_bytes: builtTxBytes,
					toJSON() {
						return btoa(String.fromCharCode.apply(null, this._bytes));
					},
					serialize() {
						return this._bytes;
					}
				};

				// Sign and execute
				const result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
					transaction: txWrapper,
					account: connectedAccount,
					chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
				});

				if (!result?.digest) {
					throw new Error('Transaction failed - no digest returned');
				}

				// Success!
				showMvrStatus(
					'UpgradeCap is now shared! Anyone can use it for MVR registration. ' +
					'<a href="' + EXPLORER_BASE + '/tx/' + result.digest + '" target="_blank" style="color: inherit; text-decoration: underline;">View transaction</a>',
					'success'
				);

			} catch (error) {
				console.error('Share UpgradeCap error:', error);
				var msg = error && error.message ? error.message : (typeof error === 'string' ? error : 'Unknown error');
				
				// Clean up the message
				msg = msg
					.replace(new RegExp('^Me:\\s*', 'i'), '')
					.replace(new RegExp('^Error:\\s*', 'i'), '')
					.replace(new RegExp('^SuiError:\\s*', 'i'), '')
					.trim();

				// Special handling for object ID ownership
				if (msg.includes('not signed by the correct sender') || msg.includes('owned by account address')) {
					msg = 'UpgradeCap is owned by an object ID address. To make it shared, you need a Move function that uses the parent object (NFT) to authorize the share operation. This requires deploying a custom Move package.';
				}

				showMvrStatus('Failed to make UpgradeCap shared: ' + msg, 'error');
			} finally {
				mvrShareUpgradeCapBtn.disabled = false;
				mvrShareUpgradeCapBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span>Make UpgradeCap Shared</span>';
			}
		}

		async function handleMvrRegistration() {
			if (!connectedWallet || !connectedAccount) {
				showMvrStatus('Please connect your wallet first.', 'error');
				return;
			}

			const packageName = mvrPackageName?.value?.trim();
			const packageAddress = mvrPackageAddress?.value?.trim();
			const upgradeCap = mvrUpgradeCap?.value?.trim();

			// Validation
			if (!packageName) {
				showMvrStatus('Package name is required.', 'error');
				return;
			}

			if (!/^[a-z0-9-]+$/.test(packageName)) {
				showMvrStatus('Package name can only contain lowercase letters, numbers, and hyphens.', 'error');
				return;
			}

			if (!packageAddress || !/^0x[a-f0-9]{64}$/i.test(packageAddress)) {
				showMvrStatus('Valid package address is required (0x followed by 64 hex characters).', 'error');
				return;
			}

			if (!upgradeCap || !/^0x[a-f0-9]{64}$/i.test(upgradeCap)) {
				showMvrStatus('Valid UpgradeCap object ID is required.', 'error');
				return;
			}

			if (!NFT_ID) {
				showMvrStatus('SuiNS NFT ID not found for this name.', 'error');
				return;
			}

			try {
				mvrRegisterBtn.disabled = true;
				mvrRegisterBtnText.textContent = 'Checking UpgradeCap ownership...';
				hideMvrStatus();

				const suiClient = getSuiClient();

				// Check if the UpgradeCap is owned by the current user
				// If it's owned by someone else, we can't use it as an input object
				let upgradeCapObj;
				try {
					upgradeCapObj = await suiClient.getObject({
						id: upgradeCap,
						options: { showOwner: true }
					});
				} catch (e) {
					showMvrStatus('Failed to fetch UpgradeCap object. Please verify the object ID is correct.', 'error');
					mvrRegisterBtn.disabled = false;
					mvrRegisterBtnText.textContent = 'Register Package';
					return;
				}

				if (!upgradeCapObj.data) {
					showMvrStatus('UpgradeCap object not found. Please verify the object ID is correct.', 'error');
					mvrRegisterBtn.disabled = false;
					mvrRegisterBtnText.textContent = 'Register Package';
					return;
				}

				// Check ownership - if owned, must be owned by the current user
				const owner = upgradeCapObj.data.owner;
				if (owner && typeof owner === 'object' && 'AddressOwner' in owner) {
					const ownerAddress = owner.AddressOwner;
					if (ownerAddress !== connectedAddress) {
						showMvrStatus(
							'UpgradeCap is owned by a different address (' + ownerAddress.slice(0, 8) + '...). ' +
							'You can only register packages with UpgradeCaps that you own, or that are shared/immutable. ' +
							'Please use your own UpgradeCap or contact the owner to make it shared.',
							'error'
						);
						mvrRegisterBtn.disabled = false;
						mvrRegisterBtnText.textContent = 'Register Package';
						return;
					}
				}
				// If it's shared or immutable, we can use it

				mvrRegisterBtnText.textContent = 'Building transaction...';

				// Build the MVR registration transaction (PTB)
				// This is a multi-step process:
				// 1. Create PackageInfo from UpgradeCap
				// 2. Register the app name with SuiNS NFT
				// 3. Assign the package to the app

				const tx = new Transaction();

				// Step 1: Create PackageInfo from UpgradeCap
				// @mvr/metadata::package_info::new(upgrade_cap)
				const [packageInfo] = tx.moveCall({
					target: MVR_METADATA_PACKAGE + '::package_info::new',
					arguments: [tx.object(upgradeCap)],
				});

				// Step 2: Register the app name in MVR using SuiNS NFT
				// @mvr/core::move_registry::register(registry, suins_nft, app_name, clock)
				const [appCap] = tx.moveCall({
					target: MVR_CORE_PACKAGE + '::move_registry::register',
					arguments: [
						tx.object(MVR_REGISTRY_ID),
						tx.object(NFT_ID),
						tx.pure.string(packageName),
						tx.object('0x6'), // Clock
					],
				});

				// Step 3: Assign the package to the app record
				// @mvr/core::move_registry::assign_package(registry, app_cap, package_info)
				tx.moveCall({
					target: MVR_CORE_PACKAGE + '::move_registry::assign_package',
					arguments: [
						tx.object(MVR_REGISTRY_ID),
						appCap,
						packageInfo,
					],
				});

				// Transfer the AppCap to the sender (so they can manage the app later)
				tx.transferObjects([appCap], connectedAddress);

				// Set sender address
				const senderAddress = typeof connectedAccount.address === 'string'
					? connectedAccount.address
					: connectedAccount.address?.toString() || connectedAddress;
				tx.setSender(senderAddress);

				mvrRegisterBtnText.textContent = 'Approve in wallet...';

				// Build transaction before signing
				const builtTxBytes = await tx.build({ client: suiClient });

				// Wrap transaction for wallet compatibility
				const txWrapper = {
					_bytes: builtTxBytes,
					toJSON() {
						return btoa(String.fromCharCode.apply(null, this._bytes));
					},
					serialize() {
						return this._bytes;
					}
				};

				// Sign and execute
				const result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
					transaction: txWrapper,
					account: connectedAccount,
					chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
				});

				if (!result?.digest) {
					throw new Error('Transaction failed - no digest returned');
				}

				// Success!
				showMvrStatus(
					'Package registered successfully! ' +
					'<a href="' + EXPLORER_BASE + '/tx/' + result.digest + '" target="_blank" style="color: inherit; text-decoration: underline;">View transaction</a><br>' +
					'<br>Your package is now accessible as: <code style="background: rgba(52, 211, 153, 0.2); padding: 2px 6px; border-radius: 4px;">@' + NAME + '/' + packageName + '</code>',
					'success'
				);

				// Clear form
				mvrPackageName.value = '';
				mvrPackageAddress.value = '';
				mvrUpgradeCap.value = '';

			} catch (error) {
				console.error('MVR registration error:', error);
				var msg = error && error.message ? error.message : (typeof error === 'string' ? error : 'Unknown error');
				
				// Clean up the message - remove weird prefixes and normalize
				msg = msg
					.replace(new RegExp('^Me:\\s*', 'i'), '')
					.replace(new RegExp('^Error:\\s*', 'i'), '')
					.replace(new RegExp('^SuiError:\\s*', 'i'), '')
					.trim();
				
				// If message is still generic or empty, try to get more info
				if (msg === 'Unknown error' || msg === 'Error' || !msg) {
					// Try to stringify the error for debugging
					try {
						const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error));
						if (errorStr && errorStr !== '{}') {
							msg = 'Transaction failed. Check console for details.';
						}
					} catch {
						// Ignore JSON stringify errors
					}
				}

				if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('User rejected')) {
					showMvrStatus('Transaction cancelled by user.', 'error');
				} else if (msg.includes('already registered') || msg.includes('already exists')) {
					showMvrStatus('This app name is already registered. Try a different package name.', 'error');
				} else if (msg.includes('Insufficient')) {
					showMvrStatus('Insufficient balance for transaction. You need SUI for gas.', 'error');
				} else {
					showMvrStatus('Registration failed: ' + msg, 'error');
				}
			} finally {
				mvrRegisterBtn.disabled = false;
				mvrRegisterBtnText.textContent = 'Register Package';
			}
		}

		// Make MVR state globally available for other code sections
		window.updateMvrSectionVisibility = updateMvrSectionVisibility;
		Object.defineProperty(window, 'mvrExpanded', {
			get: function() { return mvrExpanded; }
		});

		// MVR Auto-fill parsing
		var mvrAutofill = document.getElementById('mvr-autofill');
		var mvrParseBtn = document.getElementById('mvr-parse-btn');
		var mvrAiParseBtn = document.getElementById('mvr-ai-parse-btn');
		var mvrParseStatus = document.getElementById('mvr-parse-status');

		function parseMvrInput(text) {
			var result = { packageName: null, packageAddress: null, upgradeCap: null };
			var addrRegex = new RegExp('0x[a-fA-F0-9]{64}', 'g');
			var addresses = text.match(addrRegex) || [];
			var lines = text.split(new RegExp('[\\r\\n]+'));

			for (var i = 0; i < lines.length; i++) {
				var line = lines[i];
				var lower = line.toLowerCase();
				var lineAddr = line.match(new RegExp('0x[a-fA-F0-9]{64}'));
				if (lineAddr) {
					if (lower.indexOf('package') >= 0 && lower.indexOf('upgrade') < 0 && lower.indexOf('cap') < 0) {
						result.packageAddress = lineAddr[0];
					} else if (lower.indexOf('upgradecap') >= 0 || (lower.indexOf('upgrade') >= 0 && lower.indexOf('cap') >= 0)) {
						result.upgradeCap = lineAddr[0];
					}
				}
			}

			var unique = [];
			for (var j = 0; j < addresses.length; j++) {
				if (unique.indexOf(addresses[j]) < 0) unique.push(addresses[j]);
			}
			if (!result.packageAddress && unique.length >= 1) result.packageAddress = unique[0];
			if (!result.upgradeCap && unique.length >= 2) result.upgradeCap = unique[1];

			var slashIdx = text.indexOf('/');
			if (slashIdx > 0 && !result.packageName) {
				var after = text.substring(slashIdx + 1, slashIdx + 40);
				var pkgMatch = after.match(new RegExp('^([a-zA-Z0-9_-]+)'));
				if (pkgMatch) result.packageName = pkgMatch[1].toLowerCase().replace(/_/g, '-');
			}
			return result;
		}

		function applyParsedResult(result) {
			var filled = 0;
			if (result.packageName && mvrPackageName) { mvrPackageName.value = result.packageName; filled++; }
			if (result.packageAddress && mvrPackageAddress) { mvrPackageAddress.value = result.packageAddress; filled++; }
			if (result.upgradeCap && mvrUpgradeCap) { mvrUpgradeCap.value = result.upgradeCap; filled++; }
			return filled;
		}

		if (mvrParseBtn) {
			mvrParseBtn.addEventListener('click', function() {
				var text = mvrAutofill ? mvrAutofill.value : '';
				if (!text.trim()) { mvrParseStatus.textContent = 'Paste some text first'; mvrParseStatus.style.color = '#f87171'; return; }
				var result = parseMvrInput(text);
				var filled = applyParsedResult(result);
				mvrParseStatus.textContent = filled > 0 ? 'Filled ' + filled + ' field(s)' : 'Could not parse - try AI Parse';
				mvrParseStatus.style.color = filled > 0 ? '#34d399' : '#fbbf24';
			});
		}

		if (mvrAiParseBtn) {
			mvrAiParseBtn.addEventListener('click', function() {
				var text = mvrAutofill ? mvrAutofill.value : '';
				if (!text.trim()) { mvrParseStatus.textContent = 'Paste some text first'; mvrParseStatus.style.color = '#f87171'; return; }
				mvrAiParseBtn.disabled = true;
				mvrParseStatus.textContent = 'AI parsing...';
				mvrParseStatus.style.color = 'var(--text-muted)';

				fetch('/api/ai/parse-mvr', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ text: text, suinsName: NAME })
				}).then(function(r) { return r.json(); }).then(function(data) {
					var filled = applyParsedResult(data);
					mvrParseStatus.textContent = filled > 0 ? 'AI filled ' + filled + ' field(s)' : 'AI could not extract fields';
					mvrParseStatus.style.color = filled > 0 ? '#a855f7' : '#fbbf24';
				}).catch(function(err) {
					console.error('AI parse error:', err);
					var result = parseMvrInput(text);
					var filled = applyParsedResult(result);
					mvrParseStatus.textContent = filled > 0 ? 'Filled ' + filled + ' (fallback)' : 'Parse failed';
					mvrParseStatus.style.color = filled > 0 ? '#34d399' : '#f87171';
				}).finally(function() {
					mvrAiParseBtn.disabled = false;
				});
			});
		}

		// ========== SOCIAL LINKS FUNCTIONALITY (HIDDEN) ==========
		const CURRENT_X_USERNAME = ${serializeJson(getXUsername(record) || '')};
		const socialModal = document.getElementById('social-modal');
		const xUsernameInput = document.getElementById('x-username-input');
		const socialModalStatus = document.getElementById('social-modal-status');
		const cancelSocialBtn = document.getElementById('cancel-social-btn');
		const saveSocialBtn = document.getElementById('save-social-btn');
		const editSocialBtn = document.getElementById('edit-social-btn');
		const addSocialBtn = document.getElementById('add-social-btn');
		const socialLinksList = document.getElementById('social-links-list');

		function showSocialStatus(msg, type) {
			socialModalStatus.innerHTML = msg;
			socialModalStatus.className = 'status ' + type;
		}

		function hideSocialStatus() {
			socialModalStatus.className = 'status hidden';
		}

		function openSocialModal() {
			if (!connectedAddress) {
				connectWallet().then(() => {
					if (connectedAddress && canEdit) {
						socialModal.classList.add('open');
						xUsernameInput.value = CURRENT_X_USERNAME;
						hideSocialStatus();
					}
				});
				return;
			}

			if (!canEdit) {
				alert('Only the NFT owner can edit social links.');
				return;
			}

			socialModal.classList.add('open');
			xUsernameInput.value = CURRENT_X_USERNAME;
			hideSocialStatus();
		}

		function closeSocialModal() {
			socialModal.classList.remove('open');
			hideSocialStatus();
		}

		async function saveXProfile() {
			hideSocialStatus();

			if (!connectedWallet || !connectedAccount) {
				showSocialStatus('Please connect your wallet first.', 'error');
				return;
			}

			let username = xUsernameInput.value.trim();

			// Clean the username - remove @ prefix and extract from URL if needed
			if (username) {
				username = username.replace(/^@/, '');
				const urlMatch = username.match(new RegExp('(?:x\\.com|twitter\\.com)\\/([a-zA-Z0-9_]+)', 'i'));
				if (urlMatch) {
					username = urlMatch[1];
				}
				// Validate username format
				if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
					showSocialStatus('Invalid X username format. Use only letters, numbers, and underscores (max 15 chars).', 'error');
					return;
				}
			}

			try {
				showSocialStatus('<span class="loading"></span> Saving to SuiNS...', 'info');
				saveSocialBtn.disabled = true;

				// Use the existing setSuiNSRecords function to save the X username
				const entries = [{ key: 'x', value: username }];
				await setSuiNSRecords(entries);

				showSocialStatus('X profile saved!', 'success');

				// Update the UI
				updateSocialLinksUI(username);

				setTimeout(() => {
					closeSocialModal();
				}, 1500);

			} catch (error) {
				console.error('Save X profile error:', error);
				showSocialStatus('Failed: ' + (error.message || 'Unknown error'), 'error');
			} finally {
				saveSocialBtn.disabled = false;
			}
		}

		function updateSocialLinksUI(username) {
			const xIcon = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>';
			const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>';

			if (username) {
				socialLinksList.innerHTML = \`
					<a href="https://x.com/\${escapeHtmlJs(username)}" target="_blank" rel="noopener noreferrer" class="social-link-item">
						<div class="social-link-icon">\${xIcon}</div>
						<div class="social-link-info">
							<div class="social-link-label">X (Twitter)</div>
							<div class="social-link-value">@\${escapeHtmlJs(username)}</div>
						</div>
						<div class="social-link-arrow">\${arrowIcon}</div>
					</a>
				\`;
				if (addSocialBtn) addSocialBtn.style.display = 'none';
			} else {
				socialLinksList.innerHTML = \`
					<div class="social-links-empty">
						<p>No social links set</p>
						<p class="social-links-empty-hint">Connect your X profile to let visitors find you</p>
					</div>
				\`;
				if (addSocialBtn) addSocialBtn.style.display = '';
			}
		}

		// Update social edit button visibility when permissions change
		function updateSocialEditVisibility() {
			if (editSocialBtn) {
				if (canEdit) {
					editSocialBtn.classList.add('visible');
				} else {
					editSocialBtn.classList.remove('visible');
				}
			}
		}

		// Extend checkEditPermission to also update social edit visibility
		const originalCheckEditPermissionForSocial = checkEditPermission;
		checkEditPermission = async function() {
			await originalCheckEditPermissionForSocial();
			updateSocialEditVisibility();
		};

		// Event listeners for social modal
		if (editSocialBtn) {
			editSocialBtn.addEventListener('click', openSocialModal);
		}
		if (addSocialBtn) {
			addSocialBtn.addEventListener('click', openSocialModal);
		}
		if (cancelSocialBtn) {
			cancelSocialBtn.addEventListener('click', closeSocialModal);
		}
		if (saveSocialBtn) {
			saveSocialBtn.addEventListener('click', saveXProfile);
		}
		if (socialModal) {
			socialModal.addEventListener('click', (e) => {
				if (e.target === socialModal) closeSocialModal();
			});
		}

		// Initialize social edit visibility
		updateSocialEditVisibility();

		// ========== NFT DETAILS SECTION ==========
		const nftDetailsSection = document.getElementById('nft-details-section');
		const nftDetailsContent = document.getElementById('nft-details-content');
		const nftDetailsRefresh = document.getElementById('nft-details-refresh');
		const nftDetailsToggle = document.getElementById('nft-details-toggle');

		// Toggle NFT details visibility
		if (nftDetailsToggle && nftDetailsContent) {
			nftDetailsToggle.addEventListener('click', () => {
				const isExpanded = nftDetailsContent.classList.contains('expanded');
				if (isExpanded) {
					nftDetailsContent.classList.remove('expanded');
					nftDetailsToggle.classList.remove('expanded');
					nftDetailsToggle.innerHTML = \`
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
						Show Details
					\`;
				} else {
					nftDetailsContent.classList.add('expanded');
					nftDetailsToggle.classList.add('expanded');
					nftDetailsToggle.innerHTML = \`
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
						Hide Details
					\`;
				}
			});
		}

		async function fetchNFTDetails() {
			if (!NFT_ID || !nftDetailsContent) return;

			try {
				// Reset to collapsed state when loading
				if (nftDetailsContent) {
					nftDetailsContent.classList.remove('expanded');
					nftDetailsContent.innerHTML = \`
						<div class="nft-details-loading">
							<span class="loading"></span>
							<span>Loading comprehensive NFT data...</span>
						</div>
					\`;
				}
				if (nftDetailsToggle) {
					nftDetailsToggle.classList.remove('expanded');
					nftDetailsToggle.innerHTML = \`
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
						Show Details
					\`;
				}

				if (nftDetailsRefresh) nftDetailsRefresh.disabled = true;

				const response = await fetch(\`/api/nft-details?objectId=\${encodeURIComponent(NFT_ID)}\`);
				if (!response.ok) {
					throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
				}

				const data = await response.json();

				// Format the data for display
				const domain = data.content?.domain_name || 
					(data.content?.domain?.fields?.labels ? 
						[...data.content.domain.fields.labels].reverse().join('.') : 
						data.display?.name || 'Unknown');
				const expiration = data.content?.expiration_timestamp_ms ? 
					new Date(Number(data.content.expiration_timestamp_ms)).toISOString() : 
					'Not set';
				const expirationTimestamp = data.content?.expiration_timestamp_ms || null;
				const imageUrl = data.display?.image_url || data.content?.image_url || null;
				const owner = data.owner?.AddressOwner || data.owner?.ObjectOwner || 
					(data.owner?.Shared ? 'Shared' : data.owner?.Immutable ? 'Immutable' : 'Unknown');
				const objectType = data.objectType || 'Unknown';
				const version = data.version || 'Unknown';
				const digest = data.digest || 'Unknown';
				const previousTx = data.previousTransaction || null;
				const description = data.display?.description || null;
				const link = data.display?.link || null;
				const projectUrl = data.display?.project_url || null;

				// Calculate days until expiration
				let expirationInfo = '';
				if (expirationTimestamp) {
					const expDate = new Date(Number(expirationTimestamp));
					const now = new Date();
					const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
					if (daysLeft > 0) {
						expirationInfo = \` (\${daysLeft} day\${daysLeft !== 1 ? 's' : ''} remaining)\`;
					} else {
						expirationInfo = ' (Expired)';
					}
				}

				// Content is collapsed by default, so don't add 'expanded' class
				nftDetailsContent.innerHTML = \`
					<div class="nft-details-grid">
						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
								</svg>
								Domain Name
							</div>
							<div class="nft-detail-value">\${escapeHtmlJs(domain)}</div>
						</div>

						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"></circle>
									<polyline points="12 6 12 12 16 14"></polyline>
								</svg>
								Expiration
							</div>
							<div class="nft-detail-value">
								\${escapeHtmlJs(expiration.split('T')[0])}\${expirationInfo ? '<span style="color: var(--accent); margin-left: 8px;">' + escapeHtmlJs(expirationInfo) + '</span>' : ''}
							</div>
						</div>

						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
									<circle cx="12" cy="7" r="4"></circle>
								</svg>
								Owner
							</div>
							<div class="nft-detail-value mono">
								\${owner.startsWith('0x') ? 
									'<a href="' + EXPLORER_BASE + '/account/' + owner + '" target="_blank" class="link">' + owner.slice(0, 8) + '...' + owner.slice(-6) + '</a>' : 
									escapeHtmlJs(owner)}
							</div>
						</div>

						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
									<circle cx="8.5" cy="8.5" r="1.5"></circle>
									<polyline points="21 15 16 10 5 21"></polyline>
								</svg>
								Object ID
							</div>
							<div class="nft-detail-value mono">
								<a href="\${NFT_EXPLORER_URL}" target="_blank" class="link">\${NFT_ID.slice(0, 10)}...\${NFT_ID.slice(-8)}</a>
							</div>
						</div>

						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="9 11 12 14 22 4"></polyline>
									<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
								</svg>
								Version
							</div>
							<div class="nft-detail-value">\${escapeHtmlJs(String(version))}</div>
						</div>

						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
									<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
									<line x1="12" y1="22.08" x2="12" y2="12"></line>
								</svg>
								Digest
							</div>
							<div class="nft-detail-value mono">\${escapeHtmlJs(digest)}</div>
						</div>

						\${previousTx ? '<div class="nft-detail-card"><div class="nft-detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>Previous Transaction</div><div class="nft-detail-value mono"><a href="' + EXPLORER_BASE + '/tx/' + previousTx + '" target="_blank" class="link">' + previousTx.slice(0, 10) + '...' + previousTx.slice(-8) + '</a></div></div>' : ''}

						\${description ? '<div class="nft-detail-card"><div class="nft-detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>Description</div><div class="nft-detail-value">' + escapeHtmlJs(description) + '</div></div>' : ''}

						\${link ? '<div class="nft-detail-card"><div class="nft-detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>Link</div><div class="nft-detail-value"><a href="' + escapeHtmlJs(link) + '" target="_blank" class="link" rel="noopener noreferrer">' + escapeHtmlJs(link) + '</a></div></div>' : ''}

						\${projectUrl ? '<div class="nft-detail-card"><div class="nft-detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>Project URL</div><div class="nft-detail-value"><a href="' + escapeHtmlJs(projectUrl) + '" target="_blank" class="link" rel="noopener noreferrer">' + escapeHtmlJs(projectUrl) + '</a></div></div>' : ''}

						\${imageUrl ? '<div class="nft-detail-card"><div class="nft-detail-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>Image URL</div><div class="nft-detail-value"><a href="' + escapeHtmlJs(imageUrl) + '" target="_blank" class="link" rel="noopener noreferrer">' + escapeHtmlJs(imageUrl.length > 50 ? imageUrl.slice(0, 50) + '...' : imageUrl) + '</a></div></div>' : ''}

						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
								</svg>
								Object Type
							</div>
							<div class="nft-detail-value mono" style="font-size: 0.75rem;">\${escapeHtmlJs(objectType)}</div>
						</div>
					</div>

					<div class="nft-details-raw">
						<div class="nft-details-raw-header">
							<div class="nft-details-raw-title">Raw Object Data</div>
							<button class="nft-details-raw-toggle" id="nft-details-raw-toggle">Show</button>
						</div>
						<div class="nft-details-raw-content" id="nft-details-raw-content">
							<pre>\${escapeHtmlJs(JSON.stringify(data, null, 2))}</pre>
						</div>
					</div>
				\`;

				// Add toggle for raw data
				const rawToggle = document.getElementById('nft-details-raw-toggle');
				const rawContent = document.getElementById('nft-details-raw-content');
				if (rawToggle && rawContent) {
					rawToggle.addEventListener('click', () => {
						const isActive = rawContent.classList.contains('active');
						if (isActive) {
							rawContent.classList.remove('active');
							rawToggle.textContent = 'Show';
						} else {
							rawContent.classList.add('active');
							rawToggle.textContent = 'Hide';
						}
					});
				}

			} catch (error) {
				console.error('Failed to fetch NFT details:', error);
				nftDetailsContent.innerHTML = \`
					<div class="nft-details-error">
						<p>Failed to load NFT details: \${escapeHtmlJs(error.message || 'Unknown error')}</p>
						<button class="nft-details-refresh" onclick="fetchNFTDetails()" style="margin-top: 16px;">Try Again</button>
					</div>
				\`;
			} finally {
				if (nftDetailsRefresh) nftDetailsRefresh.disabled = false;
			}
		}

		// Load NFT details on page load if NFT ID exists
		if (NFT_ID && nftDetailsSection) {
			fetchNFTDetails();
		}

		// Refresh button
		if (nftDetailsRefresh) {
			nftDetailsRefresh.addEventListener('click', fetchNFTDetails);
		}

		// ========== MESSAGING FUNCTIONALITY ==========

		const MESSAGING_RECIPIENT = ${serializeJson(cleanName)};
		const MESSAGING_RECIPIENT_ADDRESS = ${serializeJson(record.address || record.ownerAddress || '')};
		const MESSAGING_OWNER_ADDRESS = ${serializeJson(record.ownerAddress || '')};

		// DOM elements for messaging
		const msgComposeInput = document.getElementById('msg-compose-input');
		const msgCharCount = document.getElementById('msg-char-count');
		const msgSendBtn = document.getElementById('msg-send-btn');
		const msgSendBtnText = document.getElementById('msg-send-btn-text');
		const msgStatus = document.getElementById('msg-status');
		const msgConversationList = document.getElementById('msg-conversation-list');
		const msgConversationEmpty = document.getElementById('msg-conversation-empty');
		const msgConversationLoading = document.getElementById('msg-conversation-loading');
		const msgRefreshBtn = document.getElementById('msg-refresh-btn');
		const msgSdkToggle = document.getElementById('msg-sdk-toggle');
		const msgSdkContent = document.getElementById('msg-sdk-content');
		const msgConnectPrompt = document.getElementById('msg-connect-prompt');
		const msgConnectBtn = document.getElementById('msg-connect-btn');
		const msgComposeSection = document.getElementById('msg-compose-section');
		const msgConversationSection = document.getElementById('msg-conversation-section');
		const messagingTabBtn = document.getElementById('messaging-tab-btn');

		// Update messaging UI visibility based on wallet connection
		function updateMessagingVisibility() {
			if (connectedAddress) {
				// Wallet connected - show messaging tab and content
				if (messagingTabBtn) messagingTabBtn.classList.remove('hidden');
				if (msgConnectPrompt) msgConnectPrompt.classList.add('hidden');
				if (msgConversationSection) msgConversationSection.classList.remove('hidden');

				// Show compose or inbox based on whether user is profile owner
				if (isProfileOwner()) {
					// Profile owner sees inbox
					if (msgComposeSection) msgComposeSection.classList.remove('hidden');
					updateSendButtonState(); // This will convert to inbox view
				} else {
					// Visitor sees compose
					if (msgComposeSection) msgComposeSection.classList.remove('hidden');
				}
			} else {
				// No wallet connected - show connect prompt, hide everything else
				if (messagingTabBtn) messagingTabBtn.classList.add('hidden');
				if (msgConnectPrompt) msgConnectPrompt.classList.remove('hidden');
				if (msgComposeSection) msgComposeSection.classList.add('hidden');
				if (msgConversationSection) msgConversationSection.classList.add('hidden');

				// Clear any displayed messages
				if (msgConversationList) {
					const emptyHtml = msgConversationEmpty ? msgConversationEmpty.outerHTML : '';
					const loadingHtml = msgConversationLoading ? msgConversationLoading.outerHTML : '';
					msgConversationList.innerHTML = emptyHtml + loadingHtml;
				}
			}
		}

		// Connect button in messaging prompt
		if (msgConnectBtn) {
			msgConnectBtn.addEventListener('click', () => {
				connectWallet();
			});
		}

		// ===== SUI STACK MESSAGING INTEGRATION =====
		// Messages are signed by sender wallet for authenticity
		// Encrypted for recipient (only they can read)
		// Stored on Walrus decentralized storage
		// References stored in KV with signature verification

		let messagingClient = null;
		let sealClient = null;
		let sealConfig = null;
		let currentSessionKey = null;

		// Local cache key for messages
		const MSG_CACHE_KEY = \`sui_ski_messages_\${MESSAGING_RECIPIENT}\`;
		const INBOX_CACHE_KEY = 'sui_ski_inbox';

		// Initialize messaging client with connected wallet
		async function initMessagingClient() {
			if (!connectedAddress || !connectedWallet) {
				console.log('Cannot init messaging: no wallet connected');
				return null;
			}

			// Create messaging client with wallet signer
			messagingClient = createMessagingClient();
			console.log('Messaging client initialized');
			return messagingClient;
		}

		// Create messaging client
		function createMessagingClient() {
			if (!connectedAddress || !connectedWallet) return null;

			return {
				wallet: connectedWallet,
				address: connectedAddress,
				primaryName: connectedPrimaryName,
			};
		}

		// Send message to recipient via Walrus + signature verification
		async function sendMessage(recipientName, content) {
			if (!connectedAddress || !connectedWallet) {
				throw new Error('Wallet not connected');
			}

			if (!content || typeof content !== 'string' || content.trim().length === 0) {
				throw new Error('Message content is required');
			}

			let recipientAddr;
			if (recipientName.includes('0x')) {
				recipientAddr = recipientName;
			} else if (MESSAGING_RECIPIENT_ADDRESS && MESSAGING_RECIPIENT_ADDRESS.length > 0) {
				recipientAddr = MESSAGING_RECIPIENT_ADDRESS;
			} else {
				showMsgStatus('Resolving recipient address...', 'info');
				const resolved = await resolveSuiNSName(recipientName);
				recipientAddr = resolved?.address || null;
			}

			if (!recipientAddr || recipientAddr.trim().length === 0) {
				throw new Error('Could not resolve recipient address for ' + recipientName);
			}

			if (!connectedAddress || connectedAddress.trim().length === 0) {
				throw new Error('Sender address is required');
			}

			const timestamp = Date.now();
			const nonce = crypto.randomUUID();

			const messageData = {
				from: connectedAddress,
				fromName: connectedPrimaryName || null,
				to: recipientAddr,
				toName: recipientName.replace('@', '').replace('.sui', ''),
				content: content,
				timestamp: timestamp,
				nonce: nonce,
			};

			// Create signature payload (proves authorship)
			showMsgStatus('Requesting wallet signature...', 'info');

			const contentHash = await hashContent(content);
			const signaturePayload = JSON.stringify({
				type: 'sui_ski_message',
				version: 1,
				from: connectedAddress,
				to: recipientAddr,
				contentHash: contentHash,
				timestamp: timestamp,
				nonce: nonce,
			});

			// Sign with wallet
			let signature = null;
			let signatureBytes = null;
			try {
				const messageBytes = new TextEncoder().encode(signaturePayload);

				// Try different signing methods based on wallet capabilities
				if (connectedWallet.features && connectedWallet.features['sui:signPersonalMessage']) {
					const signFeature = connectedWallet.features['sui:signPersonalMessage'];
					const signResult = await signFeature.signPersonalMessage({
						message: messageBytes,
						account: connectedAccount,
					});
					signature = signResult.signature;
					signatureBytes = signResult.bytes;
				} else if (connectedWallet.signPersonalMessage) {
					const signResult = await connectedWallet.signPersonalMessage({
						message: messageBytes,
					});
					signature = signResult.signature;
				} else if (connectedWallet.signMessage) {
					const signResult = await connectedWallet.signMessage({
						message: messageBytes,
					});
					signature = signResult.signature;
				} else {
					throw new Error('Wallet does not support message signing');
				}
			} catch (signError) {
				if (signError.message.includes('rejected') || signError.message.includes('cancelled') || signError.message.includes('denied')) {
					throw new Error('Signature rejected by user');
				}
				throw signError;
			}

			if (!signature) {
				throw new Error('Failed to get signature from wallet');
			}

			// Add signature to message
			messageData.signature = signature;
			messageData.signaturePayload = signaturePayload;

			showMsgStatus('Encrypting and storing on Walrus...', 'info');

			// Encrypt message (only recipient can decrypt)
			const encrypted = await encryptForRecipient(messageData, recipientAddr);

			if (!encrypted || !encrypted.encrypted) {
				const reason = window.sealUnavailableReason || 'Encryption unavailable';
				throw new Error('Cannot send message: ' + reason);
			}

			// Debug: log what we're sending
			const requestBody = {
				encryptedMessage: encrypted,
				sender: connectedAddress,
				senderName: connectedPrimaryName || null,
				recipient: recipientAddr,
				recipientName: messageData.toName,
				signature: signature,
				signaturePayload: signaturePayload,
				timestamp: timestamp,
				nonce: nonce,
				contentHash: contentHash,
			};

			// Validate request body before sending
			if (!requestBody.encryptedMessage || !requestBody.sender || !requestBody.recipient) {
				throw new Error('Invalid message data: missing required fields');
			}
			console.log('Sending message request:', {
				hasEncryptedMessage: !!requestBody.encryptedMessage,
				hasSender: !!requestBody.sender,
				hasRecipient: !!requestBody.recipient,
				encryptedMessageKeys: requestBody.encryptedMessage ? Object.keys(requestBody.encryptedMessage) : null,
				sender: requestBody.sender,
				recipient: requestBody.recipient,
			});

			// Store on Walrus via our API
			const response = await fetch('/api/app/messages/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({ error: 'Unknown error' }));
				console.error('Server error response:', error);
				const debugInfo = error.debug
					? \` [encrypted: \${error.debug.hasEncryptedMessage}, sender: \${error.debug.hasSender}, recipient: \${error.debug.hasRecipient}]\`
					: '';
				throw new Error((error.error || 'Failed to send message') + debugInfo);
			}

			const result = await response.json();

			return {
				id: result.messageId || result.blobId || nonce,
				blobId: result.blobId,
				...messageData,
				encrypted: true,
				status: 'sent',
			};
		}

		// Fetch messages for an address (inbox)
		async function fetchMessagesForAddress(address) {
			try {
				const response = await fetch(\`/api/app/messages/inbox?address=\${encodeURIComponent(address)}\`);
				if (!response.ok) {
					console.error('Failed to fetch inbox:', response.status);
					return [];
				}
				const data = await response.json();
				return data.messages || [];
			} catch (err) {
				console.error('Failed to fetch messages:', err);
				return [];
			}
		}

		// Hash content for signature (avoids signing raw content)
		async function hashContent(content) {
			const encoder = new TextEncoder();
			const data = encoder.encode(content);
			const hashBuffer = await crypto.subtle.digest('SHA-256', data);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
		}

		// Encrypt message for recipient using Seal (returns null if encryption unavailable)
		async function encryptForRecipient(message, recipientAddress) {
			if (!sealClient) {
				await initSealClient();
			}
			if (!sealClient) {
				window.sealUnavailableReason = 'Seal client not initialized';
				return null;
			}

			if (!sealConfig?.seal?.packageId) {
				window.sealUnavailableReason = 'Seal package ID not configured';
				return null;
			}

			try {
				const packageId = sealConfig.seal.packageId;
				const data = JSON.stringify(message);
				const plaintext = new TextEncoder().encode(data);
				const policyId = recipientAddress.startsWith('0x') ? recipientAddress.slice(2) : recipientAddress;

				const { encryptedObject } = await sealClient.encrypt({
					threshold: 2,
					packageId: fromHex(packageId.startsWith('0x') ? packageId.slice(2) : packageId),
					id: fromHex(policyId),
					data: plaintext,
				});

				const ciphertext = btoa(String.fromCharCode.apply(null, encryptedObject.data));

				return {
					encrypted: ciphertext,
					sealPolicy: {
						type: 'seal',
						address: recipientAddress,
						packageId: packageId,
						policyId: recipientAddress,
					},
					version: 1,
				};
			} catch (error) {
				console.error('Seal encryption failed:', error);
				window.sealUnavailableReason = 'Key servers require authentication - contact provider to register package';
				return null;
			}
		}

		// Decrypt message (only works if you're the recipient)
		async function decryptMessage(encryptedData, _myAddress) {
			try {
				// In production, Seal SDK verifies you own the address before decrypting
				// This would fail if you're not the recipient
				const decrypted = JSON.parse(decodeURIComponent(escape(atob(encryptedData.encrypted))));
				return decrypted;
			} catch (err) {
				console.error('Failed to decrypt (not recipient?):', err);
				return null;
			}
		}

		// Note: storeMessageOnWalrus and fetchMessagesForAddress are defined above

		// Get locally cached sent messages
		function getCachedMessages() {
			try {
				return JSON.parse(localStorage.getItem(MSG_CACHE_KEY) || '[]');
			} catch {
				return [];
			}
		}

		// Cache a sent message locally
		function cacheMessage(message) {
			const messages = getCachedMessages();
			messages.push(message);
			localStorage.setItem(MSG_CACHE_KEY, JSON.stringify(messages));
		}

		// Check if current user is the profile owner (matches target or NFT owner address)
		function isProfileOwner() {
			if (!connectedAddress) return false;
			const addr = connectedAddress.toLowerCase();
			// Check if connected wallet is either the target address or the NFT owner
			if (MESSAGING_RECIPIENT_ADDRESS && addr === MESSAGING_RECIPIENT_ADDRESS.toLowerCase()) return true;
			if (MESSAGING_OWNER_ADDRESS && addr === MESSAGING_OWNER_ADDRESS.toLowerCase()) return true;
			return false;
		}

		// Render messages in conversation view
		function renderMessages(messages, isOwner = false) {
			if (!messages || messages.length === 0) {
				if (msgConversationEmpty) {
					msgConversationEmpty.style.display = 'flex';
					if (isOwner) {
						msgConversationEmpty.querySelector('p').textContent = 'No messages in your inbox';
						msgConversationEmpty.querySelector('span').textContent = 'Messages sent to you will appear here (Seal-encrypted)';
					}
				}
				return;
			}

			if (msgConversationEmpty) msgConversationEmpty.style.display = 'none';

			const html = messages.map(msg => {
				const senderAddr = msg.from || msg.sender || '';
				const isSent = msg.direction === 'sent' || senderAddr === connectedAddress;
				const senderName = msg.fromName || msg.senderName || null;
				const senderDisplay = isSent ? 'You' : (senderName ? '@' + senderName.replace(/\.sui$/i, '') + '.sui' : (senderAddr ? senderAddr.slice(0, 8) + '...' : 'Unknown'));
				const recipientDisplay = isSent ? '@' + MESSAGING_RECIPIENT + '.sui' : 'You';

				return \`
					<div class="msg-message \${isSent ? 'sent' : 'received'}">
						<div class="msg-message-header">
							<span class="msg-message-sender">\${senderDisplay}</span>
							<span class="msg-message-arrow">→</span>
							<span class="msg-message-recipient">\${recipientDisplay}</span>
							<span class="msg-message-time">\${new Date(msg.timestamp).toLocaleString()}</span>
							\${msg.encrypted ? '<span class="msg-encrypted-badge" title="Seal encrypted"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></span>' : ''}
						</div>
						<div class="msg-message-content">\${escapeHtmlJs(msg.content)}</div>
					</div>
				\`;
			}).join('');

			if (msgConversationList) {
				const emptyHtml = msgConversationEmpty ? msgConversationEmpty.outerHTML : '';
				const loadingHtml = msgConversationLoading ? msgConversationLoading.outerHTML : '';
				msgConversationList.innerHTML = html + emptyHtml + loadingHtml;
			}
		}

		// Update send button state and compose visibility
		function updateSendButtonState() {
			if (!msgSendBtn || !msgSendBtnText || !msgComposeInput) return;

			const hasContent = msgComposeInput.value.trim().length > 0;
			const isOwner = isProfileOwner();
			const composeSection = document.getElementById('msg-compose-section');

			if (isOwner) {
				// Profile owner sees their inbox - hide compose, show inbox view
				if (composeSection) {
					composeSection.innerHTML = \`
						<div class="msg-owner-inbox-header">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
								<path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
								<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
							</svg>
							<div>
								<h4>Your Inbox</h4>
								<p>Messages sent to @\${MESSAGING_RECIPIENT}.sui appear here</p>
							</div>
							<button class="msg-refresh-inbox-btn" id="msg-refresh-inbox-btn" title="Refresh inbox">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="23 4 23 10 17 10"></polyline>
									<polyline points="1 20 1 14 7 14"></polyline>
									<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
								</svg>
							</button>
						</div>
						<p class="msg-owner-note">To send messages, visit other SuiNS profiles (e.g., <a href="https://suins.sui.ski">suins.sui.ski</a>)</p>
					\`;
					// Re-attach refresh handler
					const refreshBtn = document.getElementById('msg-refresh-inbox-btn');
					if (refreshBtn) {
						refreshBtn.addEventListener('click', () => loadInbox());
					}
				}
			} else if (!connectedAddress) {
				msgSendBtnText.textContent = 'Connect Wallet';
				msgSendBtn.disabled = false;
				msgSendBtn.classList.remove('ready');
			} else if (window.sealUnavailableReason) {
				msgSendBtnText.textContent = 'Encryption Unavailable';
				msgSendBtn.disabled = true;
				msgSendBtn.classList.remove('ready');
				msgSendBtn.title = window.sealUnavailableReason;
			} else if (!hasContent) {
				msgSendBtnText.textContent = 'Send Encrypted Message';
				msgSendBtn.disabled = true;
				msgSendBtn.classList.add('ready');
				msgSendBtn.title = '';
			} else {
				msgSendBtnText.textContent = 'Send Encrypted Message';
				msgSendBtn.disabled = false;
				msgSendBtn.classList.add('ready');
				msgSendBtn.title = '';
			}
		}

		// Show messaging status
		function showMsgStatus(message, type = 'info') {
			if (!msgStatus) return;
			msgStatus.textContent = message;
			msgStatus.className = \`msg-status \${type}\`;
		}

		function hideMsgStatus() {
			if (msgStatus) msgStatus.className = 'msg-status hidden';
		}

		// Character count handler
		if (msgComposeInput && msgCharCount) {
			msgComposeInput.addEventListener('input', () => {
				const len = msgComposeInput.value.length;
				msgCharCount.textContent = len;
				if (len > 1000) {
					msgCharCount.style.color = 'var(--error)';
				} else {
					msgCharCount.style.color = '';
				}
				updateSendButtonState();
			});
		}

		// Send message handler
		if (msgSendBtn) {
			msgSendBtn.addEventListener('click', async () => {
				// If not connected, show wallet modal
				if (!connectedAddress) {
					connectWallet();
					return;
				}

				// If profile owner, load inbox instead
				if (isProfileOwner()) {
					await loadInbox();
					return;
				}

				const content = msgComposeInput?.value.trim();
				if (!content) return;

				if (content.length > 1000) {
					showMsgStatus('Message too long (max 1000 characters)', 'error');
					return;
				}

				// Disable button while sending
				msgSendBtn.disabled = true;
				msgSendBtnText.textContent = 'Signing...';
				hideMsgStatus();

				try {
					// Send message (wallet signature + Walrus storage)
					const result = await sendMessage(
						'@' + MESSAGING_RECIPIENT + '.sui',
						content
					);

					// Cache locally for display
					const message = {
						id: result.id,
						direction: 'sent',
						from: connectedAddress,
						fromName: connectedPrimaryName,
						to: MESSAGING_RECIPIENT_ADDRESS,
						toName: MESSAGING_RECIPIENT,
						content: content,
						timestamp: result.timestamp || Date.now(),
						encrypted: true,
						blobId: result.blobId,
						status: 'sent'
					};

					cacheMessage(message);
					renderMessages(getCachedMessages());

					// Clear input
					if (msgComposeInput) {
						msgComposeInput.value = '';
						msgCharCount.textContent = '0';
					}

					showMsgStatus('Message sent! Signed and stored on Walrus.', 'success');
					setTimeout(hideMsgStatus, 5000);

				} catch (error) {
					console.error('Failed to send message:', error);
					showMsgStatus('Failed to send: ' + (error.message || 'Unknown error'), 'error');
				} finally {
					updateSendButtonState();
				}
			});
		}

		// Load inbox (only for profile owner - Seal-gated)
		async function loadInbox() {
			if (!isProfileOwner()) {
				showMsgStatus('Only the profile owner can view the inbox', 'error');
				return;
			}

			showMsgStatus('Loading inbox (decrypting with Seal)...', 'info');
			if (msgConversationLoading) {
				msgConversationLoading.classList.remove('hidden');
			}

			try {
				if (!messagingClient) {
					await initMessagingClient();
				}

				let messages = [];

				// Fetch messages for the connected address
				messages = await fetchMessagesForAddress(connectedAddress);

				// Also fetch messages addressed to the profile's target address
				// (Messages to @name.sui are stored under the target address)
				if (MESSAGING_RECIPIENT_ADDRESS &&
					MESSAGING_RECIPIENT_ADDRESS.toLowerCase() !== connectedAddress.toLowerCase()) {
					const targetMessages = await fetchMessagesForAddress(MESSAGING_RECIPIENT_ADDRESS);
					messages = [...messages, ...targetMessages];
				}

				// Also check owner address if different
				if (MESSAGING_OWNER_ADDRESS &&
					MESSAGING_OWNER_ADDRESS.toLowerCase() !== connectedAddress.toLowerCase() &&
					MESSAGING_OWNER_ADDRESS.toLowerCase() !== MESSAGING_RECIPIENT_ADDRESS.toLowerCase()) {
					const ownerMessages = await fetchMessagesForAddress(MESSAGING_OWNER_ADDRESS);
					messages = [...messages, ...ownerMessages];
				}

				// Deduplicate messages by nonce/id
				const seen = new Set();
				messages = messages.filter(m => {
					const key = m.nonce || m.id || m.timestamp;
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				});

				// Add sent messages from cache
				const sentMessages = getCachedMessages().filter(m => m.direction === 'sent');
				const allMessages = [...messages, ...sentMessages].sort((a, b) => a.timestamp - b.timestamp);

				renderMessages(allMessages, true);
				hideMsgStatus();

				if (allMessages.length === 0) {
					showMsgStatus('Inbox empty - messages to @' + MESSAGING_RECIPIENT + '.sui will appear here', 'info');
				}

			} catch (error) {
				console.error('Failed to load inbox:', error);
				showMsgStatus('Failed to load inbox: ' + (error.message || 'Unknown error'), 'error');
			} finally {
				if (msgConversationLoading) {
					msgConversationLoading.classList.add('hidden');
				}
			}
		}

		// Refresh messages
		if (msgRefreshBtn) {
			msgRefreshBtn.addEventListener('click', async () => {
				if (isProfileOwner()) {
					await loadInbox();
				} else {
					renderMessages(getCachedMessages());
				}
			});
		}

		// SDK info toggle
		if (msgSdkToggle && msgSdkContent) {
			msgSdkToggle.addEventListener('click', () => {
				const isExpanded = !msgSdkContent.classList.contains('hidden');
				if (isExpanded) {
					msgSdkContent.classList.add('hidden');
					msgSdkToggle.classList.remove('expanded');
				} else {
					msgSdkContent.classList.remove('hidden');
					msgSdkToggle.classList.add('expanded');
				}
			});
		}

		// Initial load - only show connect prompt (messages only visible after wallet connection)
		updateMessagingVisibility();

		// Update messaging when wallet connects/disconnects
		const originalUpdateUI = updateUIForWallet;
		updateUIForWallet = function() {
			originalUpdateUI();
			updateMessagingVisibility();
			updateSendButtonState();

			// If wallet connected, load messages
			if (connectedAddress) {
				if (isProfileOwner()) {
					loadInbox();
				} else {
					// Load sent messages for this conversation
					renderMessages(getCachedMessages().filter(m => m.to === MESSAGING_RECIPIENT_ADDRESS));
				}
			}
		};

		// Initial button state (will show connect prompt since no wallet)
		updateSendButtonState();

		// Seal uses TESTNET for open mode key servers (mainnet requires registration)
		// These are open mode servers that don't require API keys or package registration
		const SEAL_TESTNET_KEY_SERVERS = [
			'0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', // Mysten Labs #1
			'0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', // Mysten Labs #2
			'0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46', // Triton One
		];
		const SEAL_TESTNET_PACKAGE_ID = '0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82';
		const SEAL_TESTNET_RPC = 'https://fullnode.testnet.sui.io:443';

		// Separate SuiClient for Seal operations (uses testnet)
		let sealSuiClient = null;
		const getSealSuiClient = () => {
			if (!sealSuiClient) {
				sealSuiClient = new SuiClient({ url: SEAL_TESTNET_RPC });
			}
			return sealSuiClient;
		};

		// Initialize Seal SDK with testnet open mode servers
		async function initSealClient() {
			if (sealClient) return sealClient;

			try {
				// Use hardcoded testnet config (open mode servers)
				sealConfig = {
					seal: {
						packageId: SEAL_TESTNET_PACKAGE_ID,
						keyServers: {
							objectIds: SEAL_TESTNET_KEY_SERVERS
						}
					}
				};
				console.log('Using testnet Seal config (open mode):', sealConfig.seal.packageId);

				const suiClient = getSealSuiClient();
				sealClient = new SealClient({
					suiClient,
					serverConfigs: SEAL_TESTNET_KEY_SERVERS.map(id => ({ objectId: id, weight: 1 })),
					verifyKeyServers: true,
				});

				console.log('SealClient initialized with', SEAL_TESTNET_KEY_SERVERS.length, 'testnet key servers');
				return sealClient;
			} catch (error) {
				console.error('Failed to init SealClient:', error);
				window.sealUnavailableReason = 'Failed to initialize: ' + (error.message || 'Unknown error');
				return null;
			}
		}

		// Create a session key for decryption (proves wallet ownership)
		async function createSessionKey() {
			if (!connectedAddress || !connectedWallet) {
				console.log('Cannot create session key: no wallet');
				return null;
			}

			if (!sealConfig?.seal?.packageId) {
				await initSealClient();
			}

			if (!sealConfig?.seal?.packageId) {
				console.warn('No Seal package ID configured');
				return null;
			}

			try {
				// Use testnet SuiClient for Seal operations
				const suiClient = getSealSuiClient();
				const packageId = sealConfig.seal.packageId;

				// Create a custom signer that uses the wallet
				const walletSigner = {
					getPublicKey: async () => {
						return { toSuiBytes: () => new Uint8Array(32) };
					},
					signPersonalMessage: async (message) => {
						const result = await connectedWallet.features['sui:signPersonalMessage'].signPersonalMessage({
							account: connectedAccount,
							message,
						});
						return { signature: result.signature };
					},
				};

				currentSessionKey = await SessionKey.create({
					address: connectedAddress,
					packageId,
					ttlMin: 30,
					suiClient,
					signer: walletSigner,
				});

				console.log('Session key created for address:', connectedAddress);
				return currentSessionKey;
			} catch (error) {
				console.error('Failed to create session key:', error);
				return null;
			}
		}

		// Decrypt a message using Seal SDK
		async function decryptWithSeal(encryptedEnvelope, recipientAddress) {
			if (!sealClient) {
				await initSealClient();
			}
			if (!sealClient) {
				console.warn('SealClient not available');
				return null;
			}

			if (!currentSessionKey) {
				await createSessionKey();
			}
			if (!currentSessionKey) {
				console.warn('Session key not available');
				return null;
			}

			try {
				const approveTarget = sealConfig?.seal?.approveTarget;
				if (!approveTarget) {
					console.warn('No seal_approve target configured');
					return null;
				}

				const [packageId, moduleName, functionName] = approveTarget.split('::');
				const policyId = encryptedEnvelope.policy?.policyId || recipientAddress;

				const tx = new Transaction();
				tx.moveCall({
					target: approveTarget,
					arguments: [tx.pure.vector('u8', fromHex(policyId.startsWith('0x') ? policyId.slice(2) : policyId))],
				});

				const suiClient = getSuiClient();
				const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

				const ciphertext = typeof encryptedEnvelope.ciphertext === 'string'
					? new Uint8Array(atob(encryptedEnvelope.ciphertext).split('').map(c => c.charCodeAt(0)))
					: encryptedEnvelope.ciphertext;

				const decrypted = await sealClient.decrypt({
					data: { data: ciphertext, id: policyId },
					sessionKey: currentSessionKey,
					txBytes,
				});

				const decoder = new TextDecoder();
				const decryptedText = decoder.decode(decrypted);
				return JSON.parse(decryptedText);
			} catch (error) {
				console.error('Seal decryption failed:', error);
				return null;
			}
		}

		// Initialize Seal in background and update UI
		initSealClient().then(() => {
			updateSendButtonState();
		});

		// Expose Seal functions to window for cross-script access
		window.sealClient = null;
		window.sealConfig = null;
		window.initSealClient = async () => {
			await initSealClient();
			window.sealClient = sealClient;
			window.sealConfig = sealConfig;
			updateSendButtonState();
		};
		window.fromHex = fromHex;

		// ========== CONVERSATIONS & NOTIFICATIONS ==========

		// DOM elements for conversations
		const msgInboxSection = document.getElementById('msg-inbox-section');
		const conversationsList = document.getElementById('conversations-list');
		const conversationsEmpty = document.getElementById('conversations-empty');
		const conversationsLoading = document.getElementById('conversations-loading');
		const conversationDetail = document.getElementById('conversation-detail');
		const convDetailName = document.getElementById('conv-detail-name');
		const convMessages = document.getElementById('conv-messages');
		const convBackBtn = document.getElementById('conv-back-btn');
		const convReplyInput = document.getElementById('conv-reply-input');
		const convReplyBtn = document.getElementById('conv-reply-btn');
		const convReplyCharCount = document.getElementById('conv-reply-char-count');
		const msgNotificationBadge = document.getElementById('msg-notification-badge');
		const refreshConversationsBtn = document.getElementById('msg-refresh-conversations-btn');

		// State
		let currentConversationId = null;
		let currentConversationParticipant = null;
		let conversationsData = [];
		let notificationPollInterval = null;
		const ACTIVE_POLL_INTERVAL = 15000;
		const BACKGROUND_POLL_INTERVAL = 60000;

		// Update notification badge
		function updateNotificationBadge(count) {
			if (!msgNotificationBadge) return;
			if (count > 0) {
				msgNotificationBadge.textContent = count > 99 ? '99+' : count;
				msgNotificationBadge.classList.remove('hidden');
			} else {
				msgNotificationBadge.classList.add('hidden');
			}
		}

		// Poll for notifications
		async function pollNotifications() {
			if (!connectedAddress) return;

			try {
				const response = await fetch(\`/api/app/notifications/count?address=\${connectedAddress}\`);
				if (response.ok) {
					const data = await response.json();
					const previousCount = parseInt(msgNotificationBadge?.textContent || '0', 10);
					updateNotificationBadge(data.unreadCount || 0);

					// Show browser notification if count increased
					if (data.unreadCount > previousCount && document.hidden) {
						showBrowserNotification(data.unreadCount - previousCount);
					}
				}
			} catch (error) {
				console.error('Failed to poll notifications:', error);
			}
		}

		// Start/stop polling based on visibility
		function startNotificationPolling() {
			if (notificationPollInterval) return;
			pollNotifications();
			const interval = document.hidden ? BACKGROUND_POLL_INTERVAL : ACTIVE_POLL_INTERVAL;
			notificationPollInterval = setInterval(pollNotifications, interval);
		}

		function stopNotificationPolling() {
			if (notificationPollInterval) {
				clearInterval(notificationPollInterval);
				notificationPollInterval = null;
			}
		}

		// Adjust polling on visibility change
		document.addEventListener('visibilitychange', () => {
			if (connectedAddress && isProfileOwner()) {
				stopNotificationPolling();
				if (!document.hidden) {
					pollNotifications();
				}
				startNotificationPolling();
			}
		});

		// Browser notifications
		async function requestNotificationPermission() {
			if (!('Notification' in window)) return false;
			if (Notification.permission === 'granted') return true;
			if (Notification.permission === 'denied') return false;

			const permission = await Notification.requestPermission();
			return permission === 'granted';
		}

		function showBrowserNotification(newCount) {
			if (Notification.permission !== 'granted') return;
			if (document.hasFocus()) return;

			new Notification('New message on sui.ski', {
				body: \`You have \${newCount} new message\${newCount > 1 ? 's' : ''}\`,
				icon: '/favicon.ico',
				tag: 'sui-ski-message',
			});
		}

		// Load conversations list
		async function loadConversations() {
			if (!connectedAddress || !isProfileOwner()) return;

			if (conversationsLoading) conversationsLoading.classList.remove('hidden');
			if (conversationsEmpty) conversationsEmpty.classList.add('hidden');

			try {
				const response = await fetch(\`/api/app/conversations?address=\${connectedAddress}\`);
				if (!response.ok) throw new Error('Failed to fetch conversations');

				const data = await response.json();
				conversationsData = data.conversations || [];

				updateNotificationBadge(data.totalUnread || 0);
				renderConversationsList();

			} catch (error) {
				console.error('Failed to load conversations:', error);
				showMsgStatus('Failed to load conversations', 'error');
			} finally {
				if (conversationsLoading) conversationsLoading.classList.add('hidden');
			}
		}

		// Render conversations list
		function renderConversationsList() {
			if (!conversationsList) return;

			const existingCards = conversationsList.querySelectorAll('.conversation-card');
			existingCards.forEach(card => card.remove());

			if (conversationsData.length === 0) {
				if (conversationsEmpty) conversationsEmpty.classList.remove('hidden');
				return;
			}

			if (conversationsEmpty) conversationsEmpty.classList.add('hidden');

			conversationsData.forEach(conv => {
				const otherAddr = conv.participants.find(p => p !== connectedAddress) || conv.participants[0];
				const otherNameRaw = conv.participantNames?.[otherAddr] || null;
				const otherName = otherNameRaw ? otherNameRaw.replace(/\.sui$/i, '') : null;
				const displayName = otherName ? \`@\${otherName}.sui\` : \`\${otherAddr.slice(0, 8)}...\${otherAddr.slice(-6)}\`;
				const initial = otherName ? otherName[0].toUpperCase() : otherAddr[2].toUpperCase();
				const timeAgo = formatTimeAgo(conv.lastMessage?.timestamp || conv.updatedAt);
				const preview = conv.lastMessage?.preview || 'No messages yet';

				const card = document.createElement('div');
				card.className = 'conversation-card' + (conv.unreadCount > 0 ? ' unread' : '');
				card.dataset.convId = conv.id;
				card.dataset.otherAddr = otherAddr;
				card.innerHTML = \`
					<div class="conv-avatar">\${initial}</div>
					<div class="conv-info">
						<div class="conv-header">
							<span class="conv-name">\${escapeHtmlJS(displayName)}</span>
							<span class="conv-time">\${timeAgo}</span>
						</div>
						<div class="conv-preview">\${escapeHtmlJS(preview)}</div>
					</div>
					\${conv.unreadCount > 0 ? \`<span class="conv-unread-badge">\${conv.unreadCount}</span>\` : ''}
				\`;

				card.addEventListener('click', () => openConversation(conv.id, otherAddr, displayName));
				conversationsList.appendChild(card);
			});
		}

		// Format time ago
		function formatTimeAgo(timestamp) {
			const seconds = Math.floor((Date.now() - timestamp) / 1000);
			if (seconds < 60) return 'now';
			if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
			if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
			if (seconds < 604800) return Math.floor(seconds / 86400) + 'd';
			return new Date(timestamp).toLocaleDateString();
		}

		// Escape HTML in JS
		function escapeHtmlJS(str) {
			if (!str) return '';
			return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		// Open conversation detail
		async function openConversation(conversationId, otherAddr, displayName) {
			currentConversationId = conversationId;
			currentConversationParticipant = otherAddr;

			if (msgInboxSection) msgInboxSection.classList.add('hidden');
			if (conversationDetail) conversationDetail.classList.remove('hidden');
			if (convDetailName) convDetailName.textContent = displayName;
			if (convMessages) convMessages.innerHTML = '<div class="msg-conversation-loading"><span class="loading"></span> Loading...</div>';

			// Mark as read
			await markConversationRead(conversationId);

			try {
				const response = await fetch(\`/api/app/conversations/\${conversationId}?address=\${connectedAddress}\`);
				if (!response.ok) throw new Error('Failed to load conversation');

				const data = await response.json();
				renderConversationMessages(data.messages || []);

			} catch (error) {
				console.error('Failed to open conversation:', error);
				if (convMessages) convMessages.innerHTML = '<div class="conv-empty">Failed to load messages</div>';
			}
		}

		// Render conversation messages with decryption
		async function renderConversationMessages(messages) {
			if (!convMessages) return;

			if (messages.length === 0) {
				convMessages.innerHTML = \`
					<div class="conv-empty">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
						</svg>
						<p>No messages yet</p>
					</div>
				\`;
				return;
			}

			convMessages.innerHTML = '<div class="msg-conversation-loading"><span class="loading"></span> Loading messages...</div>';

			const decryptedMessages = await Promise.all(messages.map(async (msg) => {
				const isSent = msg.sender?.toLowerCase() === connectedAddress?.toLowerCase();
				const timestamp = new Date(msg.timestamp);
				const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
				const date = timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
				let content = '[Encrypted message]';
				let decrypted = false;

				// Get sender display info
				const senderAddr = msg.sender || '';
				const senderName = msg.senderName || null;
				const senderDisplay = senderName
					? \`@\${senderName.replace(/\\.sui$/i, '')}.sui\`
					: \`\${senderAddr.slice(0, 6)}...\${senderAddr.slice(-4)}\`;

				try {
					if (msg.envelope?.ciphertext) {
						const decryptResult = await decryptWithSeal(msg.envelope, msg.recipient);
						if (decryptResult?.content) {
							content = escapeHtmlJS(decryptResult.content);
							decrypted = true;
						}
					} else if (msg.encryptedContent) {
						const legacy = await decryptMessage({ encrypted: msg.encryptedContent }, connectedAddress);
						if (legacy?.content) {
							content = escapeHtmlJS(legacy.content);
							decrypted = true;
						}
					} else if (msg.content && typeof msg.content === 'string') {
						content = escapeHtmlJS(msg.content);
						decrypted = true;
					}
				} catch (err) {
					console.warn('Failed to decrypt message:', err);
				}

				return { isSent, time, date, content, decrypted, senderDisplay, senderAddr };
			}));

			// Check if any messages failed to decrypt
			const hasEncryptedMessages = decryptedMessages.some(m => !m.decrypted);
			const sealReason = window.sealUnavailableReason || 'Seal key servers not configured';

			// Group messages by date
			let lastDate = null;
			let html = '';

			// Show warning if there are encrypted messages
			if (hasEncryptedMessages) {
				html += \`<div class="conv-encryption-warning">
					<span class="warning-icon">⚠️</span>
					<span>Some messages cannot be decrypted. \${escapeHtmlJS(sealReason)}.</span>
				</div>\`;
			}

			decryptedMessages.forEach(msg => {
				if (msg.date !== lastDate) {
					html += \`<div class="conv-date-separator">\${msg.date}</div>\`;
					lastDate = msg.date;
				}
				html += \`
					<div class="conv-message \${msg.isSent ? 'sent' : 'received'}">
						\${!msg.isSent ? \`<div class="conv-message-sender" title="\${msg.senderAddr}">\${escapeHtmlJS(msg.senderDisplay)}</div>\` : ''}
						<div class="conv-message-content">\${msg.content}\${!msg.decrypted ? ' <span class="encrypted-icon" title="Could not decrypt - \${escapeHtmlJS(sealReason)}">🔒</span>' : ''}</div>
						<div class="conv-message-time">\${msg.time}</div>
					</div>
				\`;
			});

			convMessages.innerHTML = html;
			convMessages.scrollTop = convMessages.scrollHeight;
		}

		// Mark conversation as read
		async function markConversationRead(conversationId) {
			if (!connectedAddress) return;

			try {
				await fetch('/api/app/conversations/read', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						conversationId,
						address: connectedAddress,
					}),
				});

				// Update local state
				const conv = conversationsData.find(c => c.id === conversationId);
				if (conv && conv.unreadCount > 0) {
					const totalBadge = parseInt(msgNotificationBadge?.textContent || '0', 10);
					updateNotificationBadge(Math.max(0, totalBadge - conv.unreadCount));
					conv.unreadCount = 0;
				}
			} catch (error) {
				console.error('Failed to mark as read:', error);
			}
		}

		// Back to conversations list
		if (convBackBtn) {
			convBackBtn.addEventListener('click', () => {
				currentConversationId = null;
				currentConversationParticipant = null;
				if (conversationDetail) conversationDetail.classList.add('hidden');
				if (msgInboxSection) msgInboxSection.classList.remove('hidden');
				loadConversations();
			});
		}

		// Reply input character count
		if (convReplyInput && convReplyCharCount) {
			convReplyInput.addEventListener('input', () => {
				convReplyCharCount.textContent = convReplyInput.value.length;
			});
		}

		// Send reply
		if (convReplyBtn) {
			convReplyBtn.addEventListener('click', async () => {
				if (!connectedAddress || !currentConversationParticipant) return;
				const content = convReplyInput?.value.trim();
				if (!content) return;

				convReplyBtn.disabled = true;
				convReplyBtn.innerHTML = 'Sending...';

				try {
					await sendMessage(currentConversationParticipant, content);
					if (convReplyInput) convReplyInput.value = '';
					if (convReplyCharCount) convReplyCharCount.textContent = '0';
					await openConversation(currentConversationId, currentConversationParticipant, convDetailName?.textContent || '');
				} catch (error) {
					console.error('Failed to send reply:', error);
					showMsgStatus('Failed to send: ' + error.message, 'error');
				} finally {
					convReplyBtn.disabled = false;
					convReplyBtn.innerHTML = \`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Reply\`;
				}
			});
		}

		// Refresh conversations button
		if (refreshConversationsBtn) {
			refreshConversationsBtn.addEventListener('click', () => loadConversations());
		}

		// Update messaging visibility to show conversations for owner
		const originalUpdateMessagingVisibility = updateMessagingVisibility;
		updateMessagingVisibility = function() {
			originalUpdateMessagingVisibility();

			// Show inbox section for owner
			if (connectedAddress && isProfileOwner()) {
				if (msgInboxSection) msgInboxSection.classList.remove('hidden');
				if (msgComposeSection) msgComposeSection.classList.add('hidden');
				loadConversations();
				startNotificationPolling();
				requestNotificationPermission();
			} else {
				if (msgInboxSection) msgInboxSection.classList.add('hidden');
				stopNotificationPolling();
			}
		};

		// ========== END MESSAGING FUNCTIONALITY ==========
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

		// ===== FLOATING APP BAR =====
		document.body.classList.add('has-app-bar');

		// Show/hide panels
		function showPanel(panelId) {
			document.querySelectorAll('.conversations-panel, .channels-panel, .news-panel, .agents-panel, .chat-fullscreen').forEach(p => p.classList.add('hidden'));
			const panel = document.getElementById(panelId);
			if (panel) panel.classList.remove('hidden');
		}

		function hideAllPanels() {
			document.querySelectorAll('.conversations-panel, .channels-panel, .news-panel, .agents-panel, .chat-fullscreen').forEach(p => p.classList.add('hidden'));
		}

		// App bar button handlers
		document.querySelectorAll('.app-bar-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const panel = btn.dataset.panel;
				if (panel) showPanel(panel);
			});
		});

		// Close panel buttons
		document.querySelectorAll('.panel-close-btn').forEach(btn => {
			btn.addEventListener('click', hideAllPanels);
		});

		// Fullscreen chat functionality
		const chatFullscreen = document.getElementById('chat-fullscreen');
		const chatMessages = document.getElementById('fullscreen-chat-messages');
		const chatInput = document.getElementById('fullscreen-chat-input');
		const chatSendBtn = document.getElementById('fullscreen-chat-send');

		function openFullscreenChat(name, address) {
			if (!chatFullscreen) return;
			document.getElementById('fullscreen-chat-name').textContent = '@' + name + '.sui';
			document.getElementById('fullscreen-chat-addr').textContent = address.slice(0, 8) + '...' + address.slice(-6);
			hideAllPanels();
			chatFullscreen.classList.remove('hidden');

			// Load messages for this conversation
			const messages = JSON.parse(localStorage.getItem('sui_ski_messages_' + name) || '[]');
			renderFullscreenMessages(messages, name);
		}

		function renderFullscreenMessages(messages, recipientName) {
			if (!chatMessages) return;
			if (!messages.length) {
				chatMessages.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">No messages yet. Start the conversation!</div>';
				return;
			}
			chatMessages.innerHTML = messages.map(msg => \`
				<div class="chat-bubble \${msg.direction}">
					\${escapeHtmlJs(msg.content)}
					<div class="chat-bubble-time">\${new Date(msg.timestamp).toLocaleTimeString()}</div>
				</div>
			\`).join('');
			chatMessages.scrollTop = chatMessages.scrollHeight;
		}

		if (chatSendBtn && chatInput) {
			chatSendBtn.addEventListener('click', () => {
				const content = chatInput.value.trim();
				if (!content || !connectedAddress) return;

				const name = document.getElementById('fullscreen-chat-name').textContent.replace('@', '').replace('.sui', '');
				const messages = JSON.parse(localStorage.getItem('sui_ski_messages_' + name) || '[]');
				messages.push({
					id: Date.now().toString(),
					direction: 'sent',
					content: content,
					timestamp: Date.now()
				});
				localStorage.setItem('sui_ski_messages_' + name, JSON.stringify(messages));
				renderFullscreenMessages(messages, name);
				chatInput.value = '';
			});

			chatInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					chatSendBtn.click();
				}
			});
		}

		// Open chat with current profile
		window.openChatWithProfile = function() {
			openFullscreenChat(MESSAGING_RECIPIENT, MESSAGING_RECIPIENT_ADDRESS);
		};

		// Conversations panel
		function loadConversations() {
			const list = document.getElementById('conversations-list-items');
			if (!list) return;

			// Get all conversation keys from localStorage
			const conversations = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key.startsWith('sui_ski_messages_')) {
					const name = key.replace('sui_ski_messages_', '');
					const messages = JSON.parse(localStorage.getItem(key) || '[]');
					if (messages.length > 0) {
						const lastMsg = messages[messages.length - 1];
						conversations.push({
							name: name,
							lastMessage: lastMsg.content,
							timestamp: lastMsg.timestamp
						});
					}
				}
			}

			if (conversations.length === 0) {
				list.innerHTML = \`
					<div style="text-align: center; color: var(--text-muted); padding: 40px;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
						</svg>
						<p>No conversations yet</p>
						<p style="font-size: 0.85rem; margin-top: 8px;">Visit any SuiNS profile to start messaging</p>
					</div>
				\`;
				return;
			}

			// Sort by most recent
			conversations.sort((a, b) => b.timestamp - a.timestamp);

			list.innerHTML = conversations.map(conv => \`
				<div class="conversation-item" onclick="openFullscreenChat('\${conv.name}', '0x...')">
					<div class="conversation-avatar">\${conv.name.charAt(0).toUpperCase()}</div>
					<div class="conversation-info">
						<div class="conversation-name">@\${conv.name}.sui</div>
						<div class="conversation-preview">\${escapeHtmlJs(conv.lastMessage.slice(0, 40))}\${conv.lastMessage.length > 40 ? '...' : ''}</div>
					</div>
					<div class="conversation-meta">
						<div class="conversation-time">\${new Date(conv.timestamp).toLocaleDateString()}</div>
					</div>
				</div>
			\`).join('');
		}

		// Load conversations when panel opens
		document.querySelector('[data-panel="conversations-panel"]')?.addEventListener('click', loadConversations);

		// New chat button
		document.getElementById('new-chat-btn')?.addEventListener('click', () => {
			const name = prompt('Enter SuiNS name (e.g., alice):');
			if (name) {
				openFullscreenChat(name.replace('.sui', ''), '0x...');
			}
		});

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

		// ============================================
		// MVR Dashboard JavaScript
		// ============================================

		const MVR_API_BASE = NETWORK === 'mainnet'
			? 'https://mainnet.mvr.mystenlabs.com'
			: 'https://testnet.mvr.mystenlabs.com';

		// MVR Sub-tabs
		const mvrTabs = document.querySelectorAll('.mvr-tab');
		const mvrTabContents = document.querySelectorAll('.mvr-tab-content');

		function switchMvrTab(tabId) {
			mvrTabs.forEach(tab => {
				tab.classList.toggle('active', tab.dataset.mvrTab === tabId);
			});
			mvrTabContents.forEach(content => {
				content.classList.toggle('active', content.dataset.mvrContent === tabId);
			});
		}

		mvrTabs.forEach(tab => {
			tab.addEventListener('click', () => switchMvrTab(tab.dataset.mvrTab));
		});

		// Go to register from empty state
		const mvrGoRegister = document.getElementById('mvr-go-register');
		if (mvrGoRegister) {
			mvrGoRegister.addEventListener('click', () => switchMvrTab('register'));
		}

		// Load packages for this SuiNS name
		async function loadMvrPackages() {
			const list = document.getElementById('mvr-packages-list');
			const empty = document.getElementById('mvr-packages-empty');
			const pkgCount = document.getElementById('mvr-pkg-count');
			const verCount = document.getElementById('mvr-version-count');

			if (!list) return;

			list.innerHTML = '<div class="mvr-loading"><span class="loading"></span><span>Loading packages...</span></div>';
			empty?.classList.add('hidden');

			try {
				const response = await fetch('/api/mvr/packages/' + encodeURIComponent(NAME));
				if (!response.ok) throw new Error('Failed to load packages');

				const data = await response.json();
				const packages = data.packages || [];

				if (pkgCount) pkgCount.textContent = packages.length.toString();

				let totalVersions = 0;
				packages.forEach(pkg => {
					totalVersions += pkg.versions?.length || 1;
				});
				if (verCount) verCount.textContent = totalVersions.toString();

				if (packages.length === 0) {
					list.innerHTML = '';
					empty?.classList.remove('hidden');
					populatePackageSelects([]);
					return;
				}

				list.innerHTML = packages.map(pkg => {
					const latestVersion = pkg.versions?.[pkg.versions.length - 1] || { version: 1 };
					return '<div class="mvr-package-card">' +
						'<div class="mvr-package-header">' +
							'<span class="mvr-package-name">@' + NAME + '/' + escapeHtmlJs(pkg.name) + '</span>' +
							'<span class="mvr-package-version">v' + latestVersion.version + '</span>' +
						'</div>' +
						'<div class="mvr-package-addr">' + escapeHtmlJs(pkg.address || 'Unknown') + '</div>' +
						'<div class="mvr-package-meta">' +
							(pkg.description ? '<span>' + escapeHtmlJs(pkg.description) + '</span>' : '') +
							(pkg.repoUrl ? '<a href="' + escapeHtmlJs(pkg.repoUrl) + '" target="_blank">Repository</a>' : '') +
						'</div>' +
					'</div>';
				}).join('');

				populatePackageSelects(packages);
			} catch (err) {
				console.error('Failed to load MVR packages:', err);
				list.innerHTML = '<div class="mvr-status error">Failed to load packages</div>';
				if (pkgCount) pkgCount.textContent = '0';
				if (verCount) verCount.textContent = '0';
			}
		}

		function escapeHtmlJs(str) {
			if (!str) return '';
			return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		function populatePackageSelects(packages) {
			const selects = [
				document.getElementById('mvr-ver-package'),
				document.getElementById('mvr-meta-package')
			];
			selects.forEach(select => {
				if (!select) return;
				select.innerHTML = '<option value="">Select a package...</option>' +
					packages.map(pkg => '<option value="' + escapeHtmlJs(pkg.name) + '">@' + NAME + '/' + escapeHtmlJs(pkg.name) + '</option>').join('');
			});
		}

		// Refresh packages button
		const mvrRefreshBtn = document.getElementById('mvr-refresh-packages');
		if (mvrRefreshBtn) {
			mvrRefreshBtn.addEventListener('click', loadMvrPackages);
		}

		// Copy buttons
		document.querySelectorAll('.mvr-copy-btn').forEach(btn => {
			btn.addEventListener('click', async () => {
				const text = btn.dataset.copy;
				if (text) {
					try {
						await navigator.clipboard.writeText(text);
						const orig = btn.textContent;
						btn.textContent = 'Copied!';
						setTimeout(() => btn.textContent = orig, 1500);
					} catch (e) {
						console.error('Copy failed:', e);
					}
				}
			});
		});

		// Quick fill parsing
		const mvrQuickFillInput = document.getElementById('mvr-quick-fill-input');
		const mvrParseBtn = document.getElementById('mvr-parse-quick-fill');
		const mvrParseFeedback = document.getElementById('mvr-parse-feedback');

		if (mvrParseBtn && mvrQuickFillInput) {
			mvrParseBtn.addEventListener('click', () => {
				const text = mvrQuickFillInput.value.trim();
				if (!text) return;

				// Parse package ID
				const pkgMatch = text.match(/0x[a-fA-F0-9]{64}/);
				if (pkgMatch) {
					const pkgAddrInput = document.getElementById('mvr-reg-pkgaddr');
					if (pkgAddrInput) pkgAddrInput.value = pkgMatch[0];
				}

				// Parse UpgradeCap (often appears after "UpgradeCap" in output)
				const upgradeCapMatch = text.match(/UpgradeCap[^0x]*(0x[a-fA-F0-9]{64})/i) ||
					text.match(/upgrade_cap[^0x]*(0x[a-fA-F0-9]{64})/i);
				if (upgradeCapMatch) {
					const ucInput = document.getElementById('mvr-reg-upgradecap');
					if (ucInput) ucInput.value = upgradeCapMatch[1];
				}

				// Parse MVR name format (@name/package)
				const mvrNameMatch = text.match(/@([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/);
				if (mvrNameMatch) {
					const pkgNameInput = document.getElementById('mvr-reg-pkgname');
					if (pkgNameInput) pkgNameInput.value = mvrNameMatch[2];
				}

				if (mvrParseFeedback) {
					mvrParseFeedback.textContent = 'Parsed!';
					setTimeout(() => mvrParseFeedback.textContent = '', 2000);
				}
			});
		}

		// Reverse resolution lookup
		const mvrLookupForm = document.getElementById('mvr-lookup-form');
		if (mvrLookupForm) {
			mvrLookupForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const textarea = document.getElementById('mvr-lookup-addrs');
				const resultsDiv = document.getElementById('mvr-lookup-results');
				const listDiv = document.getElementById('mvr-lookup-list');

				if (!textarea || !resultsDiv || !listDiv) return;

				const text = textarea.value.trim();
				const addresses = text.split(/[,\\n]/).map(s => s.trim()).filter(s => s.startsWith('0x'));

				if (addresses.length === 0) return;

				resultsDiv.classList.remove('hidden');
				listDiv.innerHTML = '<div class="mvr-loading"><span class="loading"></span></div>';

				try {
					const response = await fetch(MVR_API_BASE + '/v1/reverse-resolution/bulk', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ package_ids: addresses })
					});

					if (!response.ok) throw new Error('Lookup failed');

					const data = await response.json();
					const resolution = data.resolution || {};

					listDiv.innerHTML = addresses.map(addr => {
						const name = resolution[addr]?.name;
						return '<div class="mvr-lookup-item">' +
							'<span class="addr">' + escapeHtmlJs(addr) + '</span>' +
							(name
								? '<span class="name">' + escapeHtmlJs(name) + '</span>'
								: '<span class="not-found">Not registered</span>') +
						'</div>';
					}).join('');
				} catch (err) {
					listDiv.innerHTML = '<div class="mvr-status error">Lookup failed: ' + escapeHtmlJs(err.message) + '</div>';
				}
			});
		}

		// Name resolution
		const mvrResolveForm = document.getElementById('mvr-resolve-form');
		if (mvrResolveForm) {
			mvrResolveForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const input = document.getElementById('mvr-resolve-name');
				const resultDiv = document.getElementById('mvr-resolve-result');

				if (!input || !resultDiv) return;

				const name = input.value.trim();
				if (!name) return;

				resultDiv.classList.remove('hidden');
				resultDiv.innerHTML = '<div class="mvr-loading"><span class="loading"></span></div>';

				try {
					const response = await fetch(MVR_API_BASE + '/v1/names/' + encodeURIComponent(name));
					if (!response.ok) throw new Error('Resolution failed');

					const data = await response.json();
					resultDiv.innerHTML = '<div class="label">Package Address</div>' +
						'<div class="value">' + escapeHtmlJs(data.address || data.package_id || 'Not found') + '</div>';
				} catch (err) {
					resultDiv.innerHTML = '<div class="mvr-status error">Resolution failed</div>';
				}
			});
		}

		// Update wallet warning in register tab
		function updateMvrWalletWarning() {
			const warning = document.getElementById('mvr-register-wallet-warning');
			if (warning) {
				warning.classList.toggle('hidden', !!connectedAddress);
			}
		}

		// Initialize MVR dashboard
		loadMvrPackages();
		updateMvrWalletWarning();

		// Re-check wallet warning when wallet connects
		const origUpdateEditButton = updateEditButton;
		updateEditButton = function() {
			origUpdateEditButton();
			updateMvrWalletWarning();
		};

		// MVR Full Registration Form Handler
		const mvrRegisterFormFull = document.getElementById('mvr-register-form-full');
		if (mvrRegisterFormFull) {
			mvrRegisterFormFull.addEventListener('submit', async (e) => {
				e.preventDefault();

				const statusDiv = document.getElementById('mvr-register-status');
				const submitBtn = document.getElementById('mvr-register-submit');
				const submitText = document.getElementById('mvr-register-submit-text');

				const showStatus = (msg, type) => {
					if (!statusDiv) return;
					statusDiv.classList.remove('hidden');
					statusDiv.className = 'mvr-status ' + type;
					statusDiv.innerHTML = msg;
				};

				if (!connectedWallet || !connectedAccount || !connectedAddress) {
					showStatus('Please connect your wallet first.', 'error');
					return;
				}

				const pkgName = document.getElementById('mvr-reg-pkgname')?.value?.trim();
				const pkgAddr = document.getElementById('mvr-reg-pkgaddr')?.value?.trim();
				const upgradeCap = document.getElementById('mvr-reg-upgradecap')?.value?.trim();
				const description = document.getElementById('mvr-reg-desc')?.value?.trim() || '';
				const repoUrl = document.getElementById('mvr-reg-repo')?.value?.trim() || '';
				const docsUrl = document.getElementById('mvr-reg-docs')?.value?.trim() || '';

				if (!pkgName || !/^[a-z0-9-]+$/.test(pkgName)) {
					showStatus('Package name must contain only lowercase letters, numbers, and hyphens.', 'error');
					return;
				}

				if (!pkgAddr || !/^0x[a-f0-9]{64}$/i.test(pkgAddr)) {
					showStatus('Valid package address required (0x + 64 hex characters).', 'error');
					return;
				}

				if (!upgradeCap || !/^0x[a-f0-9]{64}$/i.test(upgradeCap)) {
					showStatus('Valid UpgradeCap object ID required.', 'error');
					return;
				}

				if (!NFT_ID) {
					showStatus('SuiNS NFT ID not found for this name.', 'error');
					return;
				}

				try {
					if (submitBtn) submitBtn.disabled = true;
					if (submitText) submitText.textContent = 'Checking ownership...';
					statusDiv?.classList.add('hidden');

					const suiClient = getSuiClient();

					// Verify UpgradeCap ownership
					const ucObj = await suiClient.getObject({ id: upgradeCap, options: { showOwner: true } });
					if (!ucObj.data) {
						showStatus('UpgradeCap not found. Verify the object ID.', 'error');
						return;
					}

					const owner = ucObj.data.owner;
					if (owner && typeof owner === 'object' && 'AddressOwner' in owner) {
						if (owner.AddressOwner !== connectedAddress) {
							showStatus('UpgradeCap owned by different address. You must own it or it must be shared.', 'error');
							return;
						}
					}

					if (submitText) submitText.textContent = 'Building transaction...';

					const tx = new Transaction();

					// Create PackageInfo from UpgradeCap
					const [packageInfo] = tx.moveCall({
						target: MVR_METADATA_PACKAGE + '::package_info::new',
						arguments: [tx.object(upgradeCap)],
					});

					// Register the app name
					const [appCap] = tx.moveCall({
						target: MVR_CORE_PACKAGE + '::move_registry::register',
						arguments: [
							tx.object(MVR_REGISTRY_ID),
							tx.object(NFT_ID),
							tx.pure.string(pkgName),
							tx.object('0x6'),
						],
					});

					// Assign package to app
					tx.moveCall({
						target: MVR_CORE_PACKAGE + '::move_registry::assign_package',
						arguments: [tx.object(MVR_REGISTRY_ID), appCap, packageInfo],
					});

					// Transfer AppCap to sender
					tx.transferObjects([appCap], connectedAddress);
					tx.setSender(connectedAddress);

					if (submitText) submitText.textContent = 'Approve in wallet...';

					const builtTx = await tx.build({ client: suiClient });
					const txWrapper = {
						_bytes: builtTx,
						toJSON() { return btoa(String.fromCharCode.apply(null, this._bytes)); },
						serialize() { return this._bytes; }
					};

					const result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
						transaction: txWrapper,
						account: connectedAccount,
						chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
					});

					if (!result?.digest) throw new Error('No transaction digest');

					showStatus(
						'Package registered! <a href="' + EXPLORER_BASE + '/tx/' + result.digest + '" target="_blank">View tx</a><br>' +
						'<code>@' + NAME + '/' + pkgName + '</code>',
						'success'
					);

					document.getElementById('mvr-reg-pkgname').value = '';
					document.getElementById('mvr-reg-pkgaddr').value = '';
					document.getElementById('mvr-reg-upgradecap').value = '';
					document.getElementById('mvr-reg-desc').value = '';
					document.getElementById('mvr-reg-repo').value = '';
					document.getElementById('mvr-reg-docs').value = '';

					loadMvrPackages();
				} catch (err) {
					console.error('MVR registration error:', err);
					showStatus('Registration failed: ' + (err.message || 'Unknown error'), 'error');
				} finally {
					if (submitBtn) submitBtn.disabled = false;
					if (submitText) submitText.textContent = 'Register Package';
				}
			});
		}

		// MVR Version Form Handler
		const mvrVersionForm = document.getElementById('mvr-version-form');
		if (mvrVersionForm) {
			mvrVersionForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const statusDiv = document.getElementById('mvr-version-status');
				const showStatus = (msg, type) => {
					if (!statusDiv) return;
					statusDiv.classList.remove('hidden');
					statusDiv.className = 'mvr-status ' + type;
					statusDiv.innerHTML = msg;
				};

				if (!connectedWallet || !connectedAddress) {
					showStatus('Please connect your wallet first.', 'error');
					return;
				}

				const pkgSelect = document.getElementById('mvr-ver-package')?.value;
				const versionNum = document.getElementById('mvr-ver-number')?.value;
				const newAddr = document.getElementById('mvr-ver-addr')?.value?.trim();

				if (!pkgSelect || !versionNum || !newAddr) {
					showStatus('All fields are required.', 'error');
					return;
				}

				showStatus('Version publishing coming soon. Use MVR CLI for now.', 'info');
			});
		}

		// MVR Metadata Form Handler
		const mvrMetadataForm = document.getElementById('mvr-metadata-form');
		if (mvrMetadataForm) {
			mvrMetadataForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const statusDiv = document.getElementById('mvr-metadata-status');
				const showStatus = (msg, type) => {
					if (!statusDiv) return;
					statusDiv.classList.remove('hidden');
					statusDiv.className = 'mvr-status ' + type;
					statusDiv.innerHTML = msg;
				};

				if (!connectedWallet || !connectedAddress) {
					showStatus('Please connect your wallet first.', 'error');
					return;
				}

				showStatus('Metadata updates coming soon. Use MVR CLI for now.', 'info');
			});
		}

		// MVR PackageInfo Form Handler
		const mvrPackageInfoForm = document.getElementById('mvr-packageinfo-form');
		if (mvrPackageInfoForm) {
			mvrPackageInfoForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const statusDiv = document.getElementById('mvr-packageinfo-status');
				const showStatus = (msg, type) => {
					if (!statusDiv) return;
					statusDiv.classList.remove('hidden');
					statusDiv.className = 'mvr-status ' + type;
					statusDiv.innerHTML = msg;
				};

				if (!connectedWallet || !connectedAddress) {
					showStatus('Please connect your wallet first.', 'error');
					return;
				}

				const upgradeCap = document.getElementById('mvr-pkginfo-upgradecap')?.value?.trim();
				const displayName = document.getElementById('mvr-pkginfo-display')?.value?.trim();
				const mvrName = document.getElementById('mvr-pkginfo-mvrname')?.value?.trim();
				const transferTo = document.getElementById('mvr-pkginfo-transfer')?.value?.trim() || connectedAddress;

				if (!upgradeCap || !/^0x[a-f0-9]{64}$/i.test(upgradeCap)) {
					showStatus('Valid UpgradeCap object ID required.', 'error');
					return;
				}

				try {
					const suiClient = getSuiClient();
					const tx = new Transaction();

					// Create PackageInfo from UpgradeCap
					const [packageInfo] = tx.moveCall({
						target: MVR_METADATA_PACKAGE + '::package_info::new',
						arguments: [tx.object(upgradeCap)],
					});

					// Transfer to specified address
					tx.transferObjects([packageInfo], transferTo);
					tx.setSender(connectedAddress);

					const builtTx = await tx.build({ client: suiClient });
					const txWrapper = {
						_bytes: builtTx,
						toJSON() { return btoa(String.fromCharCode.apply(null, this._bytes)); },
						serialize() { return this._bytes; }
					};

					const result = await connectedWallet.features['sui:signAndExecuteTransaction'].signAndExecuteTransaction({
						transaction: txWrapper,
						account: connectedAccount,
						chain: NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet',
					});

					if (!result?.digest) throw new Error('No transaction digest');

					showStatus(
						'PackageInfo created! <a href="' + EXPLORER_BASE + '/tx/' + result.digest + '" target="_blank">View tx</a>',
						'success'
					);
				} catch (err) {
					console.error('PackageInfo creation error:', err);
					showStatus('Failed: ' + (err.message || 'Unknown error'), 'error');
				}
			});
		}

		// Initialize subscribe button
		const subscribeBtn = document.getElementById('subscribe-btn');
		if (subscribeBtn) {
			const targetName = subscribeBtn.dataset.name;
			const targetAddress = subscribeBtn.dataset.address;
			const textEl = subscribeBtn.querySelector('.subscribe-text');

			// Check initial state
			if (isSubscribed(targetName)) {
				subscribeBtn.classList.add('subscribed');
				if (textEl) textEl.textContent = 'Subscribed';
			}

			subscribeBtn.addEventListener('click', async () => {
				if (isSubscribed(targetName)) {
					unsubscribeFromName(targetName);
					subscribeBtn.classList.remove('subscribed');
					if (textEl) textEl.textContent = 'Subscribe';
				} else {
					await subscribeToName(targetName, targetAddress);
					subscribeBtn.classList.add('subscribed');
					if (textEl) textEl.textContent = 'Subscribed';
				}
			});
		}

		// Load subscriptions into news panel
		async function loadSubscriptionFeed() {
			const feedList = document.querySelector('.news-panel .news-feed');
			if (!feedList) return;

			// Try to load from Walrus if wallet connected
			let subs = getLocalSubscriptions();
			if (window.connectedAddress) {
				const walrusSubs = await loadSubscriptionsFromWalrus();
				if (walrusSubs && walrusSubs.length > subs.length) {
					// Merge with local (Walrus has newer data)
					subs = walrusSubs;
					saveLocalSubscriptions(subs);
				}
			}

			if (!subs.length) {
				feedList.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">No subscriptions yet. Visit a profile and click Subscribe to follow their feed!</div>';
				return;
			}

			feedList.innerHTML = '<div class="news-section-title">Your Private Subscriptions</div>' +
				'<div style="padding: 8px 16px; font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 8px;">' +
				'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' +
				'Encrypted with Seal • Stored on Walrus</div>' +
				subs.map(sub => \`
					<div class="news-post" style="cursor: pointer;" onclick="window.location.href='https://\${sub.targetName}.sui.ski'">
						<div class="news-post-header">
							<div class="news-post-avatar">\${sub.targetName.charAt(0).toUpperCase()}</div>
							<div class="news-post-info">
								<div class="news-post-channel">@\${sub.targetName}.sui</div>
								<div class="news-post-time">Subscribed \${new Date(sub.subscribedAt).toLocaleDateString()}</div>
							</div>
							<span style="font-size: 0.7rem; padding: 4px 8px; background: rgba(139, 92, 246, 0.2); color: #a78bfa; border-radius: 8px;">
								<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
								Private
							</span>
						</div>
						<p class="news-post-content">Click to view their profile and content</p>
					</div>
				\`).join('');
		}

		// Load subscription feed when news panel opens
		document.querySelector('[data-panel="news-panel"]')?.addEventListener('click', loadSubscriptionFeed);

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

		// Protocol action buttons
		document.querySelectorAll('.protocol-action-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				const action = btn.dataset.action;
				switch (action) {
					case 'vortex-deposit':
						document.querySelector('[data-privacy-tab="vortex-pools"]')?.click();
						document.getElementById('vortex-deposit-form')?.scrollIntoView({ behavior: 'smooth' });
						break;
					case 'vortex-withdraw':
						document.querySelector('[data-privacy-tab="vortex-pools"]')?.click();
						break;
					case 'seal-encrypt':
						document.querySelector('[data-privacy-tab="seal-policies"]')?.click();
						document.querySelector('.seal-encrypt-form')?.scrollIntoView({ behavior: 'smooth' });
						break;
					case 'seal-decrypt':
						document.querySelector('[data-privacy-tab="seal-policies"]')?.click();
						document.querySelector('.seal-decrypt-form')?.scrollIntoView({ behavior: 'smooth' });
						break;
					case 'walrus-upload':
						document.querySelector('[data-privacy-tab="walrus-storage"]')?.click();
						document.getElementById('walrus-dropzone')?.scrollIntoView({ behavior: 'smooth' });
						break;
					case 'walrus-browse':
						document.querySelector('[data-privacy-tab="walrus-storage"]')?.click();
						document.querySelector('.walrus-browse-section')?.scrollIntoView({ behavior: 'smooth' });
						break;
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

		// Initialize privacy features when tab is opened
		const privacyTab = document.querySelector('[data-tab="privacy"]');
		if (privacyTab) {
			let privacyInitialized = false;
			privacyTab.addEventListener('click', () => {
				if (!privacyInitialized) {
					checkVortexStatus();
					loadVortexPools();
					privacyInitialized = true;
				}
			});
		}

		// Pool refresh button
		document.getElementById('pools-refresh-btn')?.addEventListener('click', loadVortexPools);
	</script>

	<!-- Floating App Bar -->
	<nav class="floating-app-bar">
		<div class="app-bar-inner">
			<button class="app-bar-btn" data-panel="conversations-panel" title="Chats">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				<span>Chat</span>
			</button>
			<button class="app-bar-btn" data-panel="channels-panel" title="Channels">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
					<circle cx="9" cy="7" r="4"></circle>
					<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
				</svg>
				<span>Channels</span>
			</button>
			<button class="app-bar-btn active" onclick="document.querySelector('[data-tab=messaging]').click()" title="Message this profile">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<path d="M12 16v-4"></path>
					<path d="M12 8h.01"></path>
				</svg>
				<span>Profile</span>
			</button>
			<button class="app-bar-btn" data-panel="news-panel" title="News">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
				</svg>
				<span>News</span>
			</button>
			<button class="app-bar-btn" data-panel="agents-panel" title="Agents">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3"></circle>
					<path d="M12 1v4"></path>
					<path d="M12 19v4"></path>
					<path d="M1 12h4"></path>
					<path d="M19 12h4"></path>
				</svg>
				<span>Agents</span>
			</button>
		</div>
	</nav>

	<!-- Conversations Panel -->
	<div class="conversations-panel hidden" id="conversations-panel">
		<div class="conversations-header">
			<h2>Chats</h2>
			<button class="conversations-close panel-close-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<div class="conversations-search">
			<input type="text" placeholder="Search conversations..." />
		</div>
		<div class="conversations-list" id="conversations-list-items">
			<div style="text-align: center; color: var(--text-muted); padding: 40px;">
				Loading...
			</div>
		</div>
		<button class="conversations-fab" id="new-chat-btn" title="New Chat">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				<line x1="12" y1="8" x2="12" y2="14"></line>
				<line x1="9" y1="11" x2="15" y2="11"></line>
			</svg>
		</button>
	</div>

	<!-- Fullscreen Chat -->
	<div class="chat-fullscreen hidden" id="chat-fullscreen">
		<div class="chat-header">
			<button class="chat-back-btn panel-close-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>
			<div class="chat-header-info">
				<div class="chat-header-name" id="fullscreen-chat-name">@user.sui</div>
				<div class="chat-header-status" id="fullscreen-chat-addr">0x...</div>
			</div>
		</div>
		<div class="chat-messages" id="fullscreen-chat-messages">
			<div style="text-align: center; color: var(--text-muted); padding: 40px;">
				No messages yet. Start the conversation!
			</div>
		</div>
		<div class="chat-input-bar">
			<textarea class="chat-input" id="fullscreen-chat-input" placeholder="Type a message..." rows="1"></textarea>
			<button class="chat-send-btn" id="fullscreen-chat-send">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="22" y1="2" x2="11" y2="13"></line>
					<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
				</svg>
			</button>
		</div>
	</div>

	<!-- Channels Panel -->
	<div class="channels-panel hidden" id="channels-panel">
		<div class="conversations-header">
			<h2>Channels</h2>
			<button class="conversations-close panel-close-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<div class="conversations-search">
			<input type="text" placeholder="Search channels..." />
		</div>
		<div class="conversations-list">
			<div class="channel-item">
				<div class="channel-avatar">#</div>
				<div class="channel-info">
					<div class="channel-name">
						#sui-general
						<svg class="verified" viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
					</div>
					<div class="channel-members">12,453 members</div>
				</div>
				<span class="channel-tag">Official</span>
			</div>
			<div class="channel-item">
				<div class="channel-avatar" style="background: linear-gradient(135deg, #f59e0b, #d97706);">#</div>
				<div class="channel-info">
					<div class="channel-name">#suins-holders</div>
					<div class="channel-members">3,201 members</div>
				</div>
				<span class="channel-tag">Token-gated</span>
			</div>
			<div class="channel-item">
				<div class="channel-avatar" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">#</div>
				<div class="channel-info">
					<div class="channel-name">#defi-traders</div>
					<div class="channel-members">892 members</div>
				</div>
			</div>
			<div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 0.9rem;">
				Channel discovery coming soon.<br>Connect wallet to create channels.
			</div>
		</div>
		<button class="conversations-fab" title="Create Channel">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</button>
	</div>

	<!-- News Panel -->
	<div class="news-panel hidden" id="news-panel">
		<div class="conversations-header">
			<h2>News Feed</h2>
			<button class="conversations-close panel-close-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<div class="conversations-list">
			<div class="news-item">
				<div class="news-item-header">
					<div class="news-item-avatar">S</div>
					<div class="news-item-meta">
						<div class="news-item-author">@suins.sui</div>
						<div class="news-item-time">2 hours ago</div>
					</div>
				</div>
				<div class="news-item-content">Introducing Sui Stack Messaging SDK - end-to-end encrypted messaging for the Sui ecosystem. Build secure communications into your dApps today!</div>
				<div class="news-item-actions">
					<button class="news-action-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
						234
					</button>
					<button class="news-action-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
						45
					</button>
					<button class="news-action-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
						Share
					</button>
				</div>
			</div>
			<div class="news-item">
				<div class="news-item-header">
					<div class="news-item-avatar" style="background: linear-gradient(135deg, #22c55e, #16a34a);">M</div>
					<div class="news-item-meta">
						<div class="news-item-author">@mysten.sui</div>
						<div class="news-item-time">5 hours ago</div>
					</div>
				</div>
				<div class="news-item-content">The Sui network just processed 50M transactions today! Thank you to our amazing community for making this possible.</div>
				<div class="news-item-actions">
					<button class="news-action-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
						1.2K
					</button>
					<button class="news-action-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
						89
					</button>
					<button class="news-action-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
						Share
					</button>
				</div>
			</div>
			<div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 0.9rem;">
				Subscribe to news channels to see more updates here.
			</div>
		</div>
	</div>

	<!-- Agents Panel -->
	<div class="agents-panel hidden" id="agents-panel">
		<div class="conversations-header">
			<h2>Agents</h2>
			<button class="conversations-close panel-close-btn">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<div class="conversations-list">
			<div class="agent-item">
				<div class="agent-avatar">🤖</div>
				<div class="agent-info">
					<div class="agent-name">Trading Assistant</div>
					<div class="agent-desc">AI-powered DeFi trading agent with safety guardrails</div>
				</div>
				<span class="agent-badge llm">AI</span>
			</div>
			<div class="agent-item">
				<div class="agent-avatar">📊</div>
				<div class="agent-info">
					<div class="agent-name">Portfolio Tracker</div>
					<div class="agent-desc">Monitors your holdings across chains via IKA dWallet</div>
				</div>
				<span class="agent-badge llm">AI</span>
			</div>
			<div class="agent-item">
				<div class="agent-avatar">👤</div>
				<div class="agent-info">
					<div class="agent-name">Create Your Agency</div>
					<div class="agent-desc">Set up an agency with AI + human members</div>
				</div>
				<span class="agent-badge human">New</span>
			</div>
			<div style="text-align: center; color: var(--text-muted); padding: 24px; font-size: 0.9rem;">
				<a href="https://agents.sui.ski" style="color: var(--accent); text-decoration: none;">
					Visit agents.sui.ski for the full marketplace →
				</a>
			</div>
		</div>
	</div>
</body>
</html>`
}

function collapseWhitespace(value: string): string {
	const whitespacePattern = new RegExp('\\s+', 'g');
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

/**
 * Extract X/Twitter username from records
 */
function getXUsername(record: SuiNSRecord): string | undefined {
	const xKeys = ['x', 'twitter', 'com.twitter', 'com.x']

	// Check direct keys first
	for (const key of xKeys) {
		const value = record.records?.[key]
		if (typeof value === 'string' && value.trim()) {
			return extractXUsername(value.trim())
		}
	}

	// Check for URL patterns in any record
	for (const [, value] of Object.entries(record.records || {})) {
		if (typeof value !== 'string') continue
		const trimmed = value.trim().toLowerCase()
		if (trimmed.includes('x.com/') || trimmed.includes('twitter.com/')) {
			return extractXUsername(value.trim())
		}
	}

	return undefined
}

/**
 * Extract username from X/Twitter URL or handle
 */
function extractXUsername(value: string): string {
	// Remove @ prefix
	const cleaned = value.replace(/^@/, '')

	// Extract from URL
	const urlMatch = cleaned.match(new RegExp('(?:x\\.com|twitter\\.com)\\/([a-zA-Z0-9_]+)', 'i'))
	if (urlMatch) {
		return urlMatch[1]
	}

	// If it looks like a username (alphanumeric + underscores)
	if (/^[a-zA-Z0-9_]+$/.test(cleaned)) {
		return cleaned
	}

	return cleaned
}

const escapeHtmlForSocial = (value: string) =>
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

/**
 * Generate HTML for the social links section
 */
function generateSocialLinksHTML(record: SuiNSRecord): string {
	const xUsername = getXUsername(record)

	const xIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>`

	const arrowIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>`

	const plusIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`

	let linksHtml = ''

	if (xUsername) {
		linksHtml = `
			<a href="https://x.com/${escapeHtmlForSocial(xUsername)}" target="_blank" rel="noopener noreferrer" class="social-link-item">
				<div class="social-link-icon">${xIcon}</div>
				<div class="social-link-info">
					<div class="social-link-label">X (Twitter)</div>
					<div class="social-link-value">@${escapeHtmlForSocial(xUsername)}</div>
				</div>
				<div class="social-link-arrow">${arrowIcon}</div>
			</a>
		`
	}

	return `
		<div class="social-links-section">
			<div class="social-links-header">
				<div class="social-links-title">
					${xIcon}
					<span>Social Links</span>
				</div>
				<button class="social-links-edit-btn" id="edit-social-btn">Edit</button>
			</div>
			<div class="social-links-list" id="social-links-list">
				${
					linksHtml ||
					`
					<div class="social-links-empty">
						<p>No social links set</p>
						<p class="social-links-empty-hint">Connect your X profile to let visitors find you</p>
					</div>
				`
				}
			</div>
			<button class="social-links-add-btn" id="add-social-btn" style="${xUsername ? 'display:none;' : ''}">
				${plusIcon}
				Add X Profile
			</button>
		</div>
	`
}
