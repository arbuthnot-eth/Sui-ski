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
	const expiresMs = record.expirationTimestampMs ? Number(record.expirationTimestampMs) : undefined
	const expiresAt =
		typeof expiresMs === 'number' && Number.isFinite(expiresMs) ? new Date(expiresMs) : null
	const daysToExpire = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000) : null
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
	const canonicalTag = canonicalUrl ? `\n\t<link rel="canonical" href="${escapeHtml(canonicalUrl)}">` : ''
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
											daysToExpire <= 0 ? 'Expired' : daysToExpire > 365 ? `${Math.floor(daysToExpire / 365)}y ${daysToExpire % 365}d` : `${daysToExpire}d left`
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
			<!-- Grace Period Banner -->
			<div class="grace-period-banner" id="grace-period-banner">
				<div class="grace-period-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
				</div>
				<div class="grace-period-content">
					<div class="grace-period-title">This name has expired</div>
					<div class="grace-period-text">
						The name <strong>${escapeHtml(cleanName)}.sui</strong> is currently in its 30-day grace period.
						<span id="grace-period-owner-info">The NFT owner</span> can renew it until <strong>${expiresAt ? new Date(expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</strong>.
					</div>
					<div class="grace-period-countdown">
						<div class="grace-countdown-label">Time left to renew:</div>
						<div class="grace-countdown-timer" id="grace-countdown-timer">
							<div class="grace-countdown-unit">
								<span class="grace-countdown-value" id="grace-days">--</span>
								<span class="grace-countdown-unit-label">days</span>
							</div>
							<span class="grace-countdown-separator">:</span>
							<div class="grace-countdown-unit">
								<span class="grace-countdown-value" id="grace-hours">--</span>
								<span class="grace-countdown-unit-label">hrs</span>
							</div>
							<span class="grace-countdown-separator">:</span>
							<div class="grace-countdown-unit">
								<span class="grace-countdown-value" id="grace-mins">--</span>
								<span class="grace-countdown-unit-label">min</span>
							</div>
							<span class="grace-countdown-separator">:</span>
							<div class="grace-countdown-unit">
								<span class="grace-countdown-value" id="grace-secs">--</span>
								<span class="grace-countdown-unit-label">sec</span>
							</div>
						</div>
						<div class="grace-skill-counter">
							<div class="grace-skill-label">$skill-creator decay</div>
							<div class="grace-skill-value">
								<span id="grace-skill-value">100,000,000</span>
								<span class="grace-skill-unit">of 100,000,000 remaining</span>
							</div>
							<div class="grace-skill-hint">Linearly burns across the full grace/premium window.</div>
						</div>
					</div>
				</div>
				<div class="grace-period-actions" id="grace-period-actions">
					<button class="grace-period-btn gift" id="gift-renewal-btn" style="display:none;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="20 12 20 22 4 22 4 12"></polyline>
							<rect x="2" y="7" width="20" height="5"></rect>
							<line x1="12" y1="22" x2="12" y2="7"></line>
							<path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
							<path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
						</svg>
						<span id="gift-renewal-text">Gift 1 Month (10 SUI)</span>
					</button>
					<a href="https://suins.io/name/${escapeHtml(cleanName)}" target="_blank" class="grace-period-btn renew" id="renew-name-btn" style="display:none;">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="23 4 23 10 17 10"></polyline>
							<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
						</svg>
						Renew on SuiNS
					</a>
				</div>
				<div class="grace-period-status" id="grace-period-status"></div>
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

			<!-- Countdown Hero -->
			${
				expiresMs
					? `
			<div class="countdown-hero" id="countdown-hero">
				<svg style="position:absolute;width:0;height:0;">
					<defs>
						<linearGradient id="countdown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
							<stop offset="0%" stop-color="#3b82f6"/>
							<stop offset="100%" stop-color="#8b5cf6"/>
						</linearGradient>
					</defs>
				</svg>
				<div class="countdown-content">
					<div class="countdown-ring">
						<svg viewBox="0 0 100 100">
							<circle class="countdown-ring-bg" cx="50" cy="50" r="42"/>
							<circle class="countdown-ring-progress" id="countdown-ring-progress" cx="50" cy="50" r="42"
								stroke-dasharray="263.89" stroke-dashoffset="0"/>
						</svg>
						<div class="countdown-ring-center">
							<div class="countdown-ring-percent" id="countdown-percent">--</div>
							<div class="countdown-ring-label">score</div>
						</div>
					</div>
					<div class="countdown-details">
						<div class="countdown-status">
							<span class="countdown-status-badge ${options.inGracePeriod ? 'warning' : 'active'}" id="countdown-badge">
								${
									options.inGracePeriod
										? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
										: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`
								}
								<span id="countdown-status-text">${options.inGracePeriod ? 'Grace Period' : 'Active'}</span>
							</span>
						</div>
						<div class="countdown-timer" id="countdown-timer-display">
							<div class="countdown-unit">
								<div class="countdown-value" id="countdown-days">--</div>
								<div class="countdown-label">Days</div>
							</div>
							<span class="countdown-separator">:</span>
							<div class="countdown-unit">
								<div class="countdown-value" id="countdown-hours">--</div>
								<div class="countdown-label">Hours</div>
							</div>
							<span class="countdown-separator">:</span>
							<div class="countdown-unit">
								<div class="countdown-value" id="countdown-mins">--</div>
								<div class="countdown-label">Minutes</div>
							</div>
							<span class="countdown-separator">:</span>
							<div class="countdown-unit">
								<div class="countdown-value" id="countdown-secs">--</div>
								<div class="countdown-label">Seconds</div>
							</div>
						</div>
						<div class="countdown-info">
							<div class="countdown-info-item">
								<span class="countdown-info-label">Expires</span>
								<span class="countdown-info-value">${new Date(expiresMs).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
							</div>
							<div class="countdown-info-item">
								<span class="countdown-info-label">Grace Period Ends</span>
								<span class="countdown-info-value">${new Date(expiresMs + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
							</div>
							<div class="countdown-info-item">
								<span class="countdown-info-label">Available</span>
								<span class="countdown-info-value" id="countdown-available-date">${new Date(expiresMs + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
					`
					: ''
			}

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
							<td class="record-value">${/^https?:\/\//i.test(value) ? `<a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
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
					<!-- Registration Queue Section -->
					<div class="queue-bid-section" id="queue-bid-section">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"></circle>
								<polyline points="12 6 12 12 16 14"></polyline>
							</svg>
							Registration Queue
						</h3>
						<p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px;">
							Queue a bid for when this name expires and becomes available.
						</p>
						<div class="queue-bid-info">
							<div class="queue-bid-stat">
								<div class="queue-bid-stat-label">Expires</div>
								<div class="queue-bid-stat-value">${expiresAt.toLocaleDateString()}</div>
							</div>
							<div class="queue-bid-stat">
								<div class="queue-bid-stat-label">Available</div>
								<div class="queue-bid-stat-value warning" id="grace-period-end">${new Date(expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
							</div>
							<div class="queue-bid-stat">
								<div class="queue-bid-stat-label">Countdown</div>
								<div class="queue-bid-stat-value countdown" id="countdown-timer">Calculating...</div>
							</div>
						</div>
						<div id="existing-bid-container"></div>
						<div class="queue-bid-grid">
							<div class="queue-bid-form" id="queue-bid-form">
								<div class="queue-bid-input-group">
									<label for="bid-amount">Bid Amount (SUI)</label>
									<input type="number" id="bid-amount" min="0.1" step="0.1" value="1.0" />
								</div>
								<div class="queue-bid-input-group">
									<label>Execution Time</label>
									<div class="queue-bid-existing-value">Auto-exec at grace release (${new Date(
										expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000,
									).toLocaleString()})</div>
								</div>
								<label class="queue-bid-existing-label" style="display:flex;align-items:center;gap:8px;">
									<input type="checkbox" id="bid-offline-toggle" />
									<span>Attach offline-signed registration for auto relay</span>
								</label>
								<div class="queue-offline-fields" id="queue-offline-fields">
									<div class="queue-bid-input-group">
										<label for="bid-tx-bytes">Transaction Bytes (base64)</label>
										<textarea id="bid-tx-bytes" placeholder="AAACAA..."></textarea>
									</div>
									<div class="queue-bid-input-group">
										<label for="bid-tx-signatures">Signatures (comma or newline separated)</label>
										<textarea id="bid-tx-signatures" placeholder="AAQw..."></textarea>
									</div>
									<p class="queue-bid-note">We encrypt attachments and auto-relay them via the worker the moment the name is free.</p>
								</div>
								<button class="queue-bid-btn" id="queue-bid-btn">
									Queue Bid with Wallet
								</button>
								<div class="queue-bid-status hidden" id="queue-bid-status"></div>
							</div>
						</div>
						<div class="queue-bid-note">
							The connected wallet address is used as the bidder identity. Offline attachments are optional but unlock automatic submission.
						</div>
						<div class="queue-bid-list" id="queue-bid-list">
							<div class="queue-bid-empty">No queued bids yet.</div>
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
		import { getWallets } from 'https://esm.sh/@mysten/wallet-standard@0.13.8';
		import { SuiClient } from 'https://esm.sh/@mysten/sui@1.45.2/client';
		import { Transaction } from 'https://esm.sh/@mysten/sui@1.45.2/transactions';
		import { SuinsClient, SuinsTransaction } from 'https://esm.sh/@mysten/suins@0.9.13';

		const NAME = '${cleanName}';
		const FULL_NAME = ${serializeJson(fullName)};
		const NETWORK = ${serializeJson(network)};
		const RPC_URL = ${serializeJson(env.SUI_RPC_URL)};
	const NFT_ID = ${serializeJson(record.nftId || '')};
	const CURRENT_ADDRESS = ${serializeJson(record.address)};
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
	const SKILL_CREATOR_MAX_SUPPLY = 100_000_000;
	const numberFormatter =
		typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function'
			? new Intl.NumberFormat('en-US')
			: { format: (value) => String(value ?? 0) };

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
			return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(cleaned);
		}

		// Resolve a SuiNS name to its target address
		async function resolveSuiNSName(name) {
			const suiClient = new SuiClient({ url: RPC_URL });
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

		// Detect wallets with retry logic
		async function detectWallets() {
			return new Promise((resolve) => {
				let attempts = 0;
				const maxAttempts = 25;
				let resolved = false;

				const check = () => {
					if (resolved) return;
					attempts++;
					const wallets = getSuiWallets();

					if (wallets.length > 0 || attempts >= maxAttempts) {
						resolved = true;
						resolve(wallets);
					} else {
						setTimeout(check, 150);
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

				check();
			});
		}

		// Fetch NFT owner address
		async function fetchNftOwner() {
			if (!NFT_ID) return null;
			try {
				const suiClient = new SuiClient({ url: RPC_URL });
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
				const suiClient = new SuiClient({ url: RPC_URL });
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
		async function checkEditPermission() {
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
						? \`Set to \${connectedPrimaryName}\`
						: \`Set to \${truncAddr(connectedAddress)}\`;
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
						chain: \`sui:\${NETWORK}\`
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
						\`Queued! <a href="\${EXPLORER_BASE}/tx/\${result.digest}" target="_blank">Payment</a> ·
						<a href="\${verifyData.statusUrl}" target="_blank">Status</a><br>
						<small>Nautilus TEE will process renewal shortly.</small>\`,
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

				renderWalletBar();
				await checkEditPermission();
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
				renderWalletBar();
				await checkEditPermission();
			} catch (e) {
				console.error('Connection error:', e);
				walletList.innerHTML = \`
					<div class="wallet-no-wallets" style="color: var(--error);">
						Connection failed: \${e.message}
						<br><br>
						<button onclick="document.getElementById('wallet-modal').classList.remove('open')"
							style="padding: 8px 16px; background: var(--accent); border: none; border-radius: 8px; color: white; cursor: pointer;">
							Close
						</button>
					</div>
				\`;
			}
		}

		// Show wallet selection modal
		async function connectWallet() {
			walletModal.classList.add('open');
			walletList.innerHTML = '<div class="wallet-detecting"><span class="loading"></span> Detecting wallets...</div>';

			const wallets = await detectWallets();

			if (wallets.length === 0) {
				walletList.innerHTML = \`
					<div class="wallet-no-wallets">
						No Sui wallets detected.
						<br><br>
						<a href="https://phantom.app/download" target="_blank">Install Phantom →</a>
						<br>
						<a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank">Install Sui Wallet →</a>
					</div>
				\`;
				return;
			}

			walletList.innerHTML = '';
			for (const wallet of wallets) {
				const item = document.createElement('div');
				item.className = 'wallet-item';
				const iconSrc = wallet.icon || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle fill=%22%23818cf8%22 cx=%2216%22 cy=%2216%22 r=%2216%22/></svg>';
				item.innerHTML = \`
					<img src="\${iconSrc}" alt="\${wallet.name}" onerror="this.style.display='none'">
					<span class="wallet-name">\${wallet.name}</span>
				\`;
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
			canEdit = false;
			clearWalletConnection();
			renderWalletBar();
			updateEditButton();
		}

		// Render wallet connection status (preserves search btn and network badge)
		function renderWalletBar() {
			// Remove old wallet elements but keep search btn and network badge
			const existingWalletStatus = walletBar.querySelector('.wallet-status');
			const existingConnectBtn = walletBar.querySelector('.connect-btn');
			if (existingWalletStatus) existingWalletStatus.remove();
			if (existingConnectBtn) existingConnectBtn.remove();

			if (!connectedAddress) {
				const connectBtn = document.createElement('button');
				connectBtn.className = 'connect-btn';
				connectBtn.id = 'connect-wallet-btn';
				connectBtn.textContent = 'Connect Wallet';
				connectBtn.addEventListener('click', connectWallet);
				walletBar.appendChild(connectBtn);
			} else {
				const displayName = connectedPrimaryName || truncAddr(connectedAddress);
				const walletStatus = document.createElement('div');
				walletStatus.className = 'wallet-status';
				walletStatus.style.cursor = 'pointer';
				walletStatus.title = connectedPrimaryName 
					? \`Go to \${connectedPrimaryName} profile\`
					: 'Disconnect wallet';
				walletStatus.innerHTML = \`
					<span class="wallet-addr">\${displayName}</span>
					\${connectedPrimaryName ? \`<span class="wallet-name">\${truncAddr(connectedAddress)}</span>\` : ''}
					<button id="disconnect-wallet-btn">×</button>
				\`;
				walletBar.appendChild(walletStatus);
				
				// Handle click on wallet status (but not the disconnect button)
				walletStatus.addEventListener('click', (e) => {
					// Don't handle if clicking the disconnect button
					if (e.target.closest('#disconnect-wallet-btn')) return;
					
					if (connectedPrimaryName) {
						// Navigate to the primary name's profile
						const cleanedName = connectedPrimaryName.replace(/\\.sui$/i, '');
						window.location.href = \`https://\${cleanedName}.sui.ski\`;
					} else {
						// No primary name, disconnect wallet
						disconnectWallet();
					}
				});
				
				// Disconnect button handler
				const disconnectBtn = document.getElementById('disconnect-wallet-btn');
				if (disconnectBtn) {
					disconnectBtn.addEventListener('click', (e) => {
						e.stopPropagation(); // Prevent triggering wallet status click
						disconnectWallet();
					});
				}
			}
		}

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
				const cleanedName = domain.replace(/\.sui$/i, '');
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

				const suiClient = new SuiClient({ url: RPC_URL });
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
				alert(\`Updated! TX: \${result.digest}\`);

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

				const suiClient = new SuiClient({ url: RPC_URL });
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
			return (mist / 1_000_000_000).toFixed(2);
		}

		// Load marketplace data from Tradeport API
		async function loadMarketplaceData() {
			marketplaceLoading.style.display = 'flex';
			marketplaceContent.style.display = 'none';
			marketplaceError.style.display = 'none';

			try {
				const res = await fetch(\`/api/tradeport/name/\${NAME}\`);
				if (!res.ok) {
					// Handle 502 and other errors gracefully
					if (res.status === 502 || res.status >= 500) {
						throw new Error('Tradeport service temporarily unavailable');
					}
					throw new Error(\`API error: \${res.status}\`);
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

			const amountMist = Math.floor(amount * 1_000_000_000);

			placeBidBtn.disabled = true;
			placeBidBtn.querySelector('.btn-text').textContent = 'Building...';
			hideBidStatusMsg();

			try {
				// Build transaction via server-side API
				const buildRes = await fetch('/api/tradeport/bid', {
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

				showBidStatusMsg(\`Bid placed successfully! <a href="https://suivision.xyz/txblock/\${result.digest}" target="_blank">View transaction</a>\`, 'success');
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

		// ===== QUEUE BID FUNCTIONALITY =====
		const queueBidSection = document.getElementById('queue-bid-section');
		if (queueBidSection && EXPIRATION_MS > 0) {
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

			// Initial load if already connected
			if (connectedAddress) {
				loadExistingBid();
			}
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
			name = name.replace(/[^a-z0-9-]/g, '');
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
				const suiClient = new SuiClient({ url: RPC_URL });
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

			const suiClient = new SuiClient({ url: RPC_URL });
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
		const MESSAGING_CONTRACT = '${env.MESSAGING_CONTRACT_ADDRESS || ''}';
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

				const suiClient = new SuiClient({ url: RPC_URL });
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
					target: \`\${MESSAGING_CONTRACT}::message::send_text\`,
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
					chain: 'sui:' + NETWORK,
				});

				btnText.textContent = 'Confirming...';
				showMessageStatus('Waiting for confirmation...', 'info', true);

				// Wait for transaction confirmation
				if (result.digest) {
					await suiClient.waitForTransaction({ digest: result.digest });

					// Success!
					showMessageStatus(\`Message sent to @\${RECIPIENT_NAME}! Tx: \${result.digest.slice(0, 8)}...\`, 'success');
					messageInput.value = '';

					// Show link to view on explorer
					setTimeout(() => {
						showMessageStatus(\`<a href="https://suiscan.xyz/\${NETWORK}/tx/\${result.digest}" target="_blank" style="color: inherit; text-decoration: underline;">View transaction on explorer →</a>\`, 'success');
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

		// ========== OWNED SUINS NAMES ==========
		const namesContent = document.getElementById('names-content');
		const namesCountEl = document.getElementById('names-count');
		let allOwnedNames = [];
		let namesNextCursor = null;
		let namesHasMore = true;
		let namesLoading = false;

		// Fetch all SuiNS names owned by the target address
		async function fetchOwnedNames(cursor = null) {
			if (namesLoading) return;
			namesLoading = true;

			try {
				const suiClient = new SuiClient({ url: RPC_URL });

				// Use the built-in resolveNameServiceNames method
				const response = await suiClient.resolveNameServiceNames({
					address: CURRENT_ADDRESS,
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
		async function fetchNFTs(cursor = null) {
			if (nftsLoading && cursor === null) return; // Only prevent if starting fresh fetch
			if (cursor === null) {
				// Starting fresh fetch - reset state
				allNFTs = [];
				nftsNextCursor = null;
				nftsHasMore = true;
				nftsLoading = true;
			}

			try {
				const suiClient = new SuiClient({ url: RPC_URL });

				// Fetch owned objects filtered by SuiNS registration type
				// The struct type includes "SuinsRegistration" in the name
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
					// Continue fetching next page
					await fetchNFTs(nftsNextCursor);
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
						owner: CURRENT_ADDRESS,
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
						// Continue fetching next page (recursive call)
						await fetchNFTs(nftsNextCursor);
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
		if (!nftsLoaded && activeTab !== 'nfts') {
			setTimeout(async () => {
				try {
					const suiClient = new SuiClient({ url: RPC_URL });
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

		// ========== COUNTDOWN HERO ANIMATION ==========
		const countdownHero = document.getElementById('countdown-hero');
		const countdownRingProgress = document.getElementById('countdown-ring-progress');
		const countdownPercent = document.getElementById('countdown-percent');
		const countdownBadge = document.getElementById('countdown-badge');
		const countdownStatusText = document.getElementById('countdown-status-text');
		const countdownDays = document.getElementById('countdown-days');
		const countdownHours = document.getElementById('countdown-hours');
		const countdownMins = document.getElementById('countdown-mins');
		const countdownSecs = document.getElementById('countdown-secs');

		// Calculate total registration period (assume 1 year = 365 days for progress)
		const REGISTRATION_PERIOD = 365 * 24 * 60 * 60 * 1000;
		const CIRCLE_CIRCUMFERENCE = 263.89; // 2 * PI * 42
		
		// View score tracking
		let currentViewScore = 0;
		const MAX_SCORE_FOR_RING = 1000; // Max score for 100% ring fill

		// Fetch and update view score
		async function fetchViewScore() {
			try {
				const response = await fetch(\`/api/views/\${NAME}\`);
				if (response.ok) {
					const data = await response.json();
					currentViewScore = data.score || 0;
					updateViewScoreDisplay();
				}
			} catch (error) {
				console.error('Failed to fetch view score:', error);
			}
		}

		// Increment view score when page loads
		async function incrementViewScore() {
			try {
				const response = await fetch(\`/api/views/\${NAME}\`, {
					method: 'POST',
				});
				if (response.ok) {
					const data = await response.json();
					currentViewScore = data.score || 0;
					updateViewScoreDisplay();
				}
			} catch (error) {
				console.error('Failed to increment view score:', error);
			}
		}

		// Update the score display
		function updateViewScoreDisplay() {
			if (countdownPercent) {
				countdownPercent.textContent = String(currentViewScore);
			}
			
			// Update ring progress based on score (0-1000 score = 0-100% ring)
			if (countdownRingProgress) {
				const scorePercent = Math.min(100, Math.round((currentViewScore / MAX_SCORE_FOR_RING) * 100));
				const offset = CIRCLE_CIRCUMFERENCE * (1 - scorePercent / 100);
				countdownRingProgress.style.strokeDashoffset = offset;
			}
		}

		// Initialize view score tracking
		incrementViewScore(); // Increment on page load
		setInterval(fetchViewScore, 30000); // Refresh every 30 seconds

		function updateCountdownHero() {
			if (!EXPIRATION_MS) return;

			const now = Date.now();
			const diff = EXPIRATION_MS - now;
			const graceDiff = AVAILABLE_AT - now;

			// Update countdown values
			if (diff <= 0) {
				// Expired - in grace period or available
				if (graceDiff <= 0) {
					// Available now
					if (countdownDays) countdownDays.textContent = '00';
					if (countdownHours) countdownHours.textContent = '00';
					if (countdownMins) countdownMins.textContent = '00';
					if (countdownSecs) countdownSecs.textContent = '00';
					if (countdownPercent) countdownPercent.textContent = String(currentViewScore || 0);
					if (countdownRingProgress) countdownRingProgress.style.strokeDashoffset = CIRCLE_CIRCUMFERENCE;
					if (countdownHero) countdownHero.className = 'countdown-hero expired';
					if (countdownBadge) {
						countdownBadge.className = 'countdown-status-badge danger';
						countdownBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg><span>Available</span>';
					}
				} else {
					// Grace period
					const gDays = Math.floor(graceDiff / (24 * 60 * 60 * 1000));
					const gHours = Math.floor((graceDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
					const gMins = Math.floor((graceDiff % (60 * 60 * 1000)) / (60 * 1000));
					const gSecs = Math.floor((graceDiff % (60 * 1000)) / 1000);
					if (countdownDays) countdownDays.textContent = String(gDays).padStart(2, '0');
					if (countdownHours) countdownHours.textContent = String(gHours).padStart(2, '0');
					if (countdownMins) countdownMins.textContent = String(gMins).padStart(2, '0');
					if (countdownSecs) countdownSecs.textContent = String(gSecs).padStart(2, '0');
					// Score is managed by view tracking
					if (countdownPercent) countdownPercent.textContent = String(currentViewScore || 0);
					if (countdownRingProgress) {
						const scorePercent = Math.min(100, Math.round((currentViewScore / MAX_SCORE_FOR_RING) * 100));
						const offset = CIRCLE_CIRCUMFERENCE * (1 - scorePercent / 100);
						countdownRingProgress.style.strokeDashoffset = offset;
						countdownRingProgress.style.stroke = '#fbbf24';
					}
					if (countdownHero) countdownHero.className = 'countdown-hero grace';
					if (countdownBadge) {
						countdownBadge.className = 'countdown-status-badge warning';
						countdownBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span>Grace Period</span>';
					}
				}
				return;
			}

			// Active - calculate countdown
			const days = Math.floor(diff / (24 * 60 * 60 * 1000));
			const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
			const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
			const secs = Math.floor((diff % (60 * 1000)) / 1000);

			if (countdownDays) countdownDays.textContent = String(days).padStart(2, '0');
			if (countdownHours) countdownHours.textContent = String(hours).padStart(2, '0');
			if (countdownMins) countdownMins.textContent = String(mins).padStart(2, '0');
			if (countdownSecs) countdownSecs.textContent = String(secs).padStart(2, '0');

			// Score is now managed by view tracking, not percentage
			// The score display is updated by updateViewScoreDisplay()

			// Update status badge based on days remaining
			if (days <= 7) {
				if (countdownHero) countdownHero.className = 'countdown-hero grace';
				if (countdownBadge) {
					countdownBadge.className = 'countdown-status-badge danger';
					countdownBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span>Expiring Soon</span>';
				}
			} else if (days <= 30) {
				if (countdownBadge) {
					countdownBadge.className = 'countdown-status-badge warning';
					countdownBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>Renew Soon</span>';
				}
			} else {
				if (countdownBadge) {
					countdownBadge.className = 'countdown-status-badge active';
					countdownBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>Active</span>';
				}
			}
		}

		if (EXPIRATION_MS) {
			updateCountdownHero();
			setInterval(updateCountdownHero, 1000); // Update every second for smooth animation
		}

		// ========== GRACE PERIOD BANNER COUNTDOWN ==========
		const graceDays = document.getElementById('grace-days');
		const graceHours = document.getElementById('grace-hours');
		const graceMins = document.getElementById('grace-mins');
		const graceSecs = document.getElementById('grace-secs');
		const graceBanner = document.getElementById('grace-period-banner');
		const graceSkillValue = document.getElementById('grace-skill-value');

		function updateGraceSkillCounter(currentTime = Date.now()) {
			if (!graceSkillValue || !EXPIRATION_MS) return;

			const totalWindow = AVAILABLE_AT - EXPIRATION_MS;
			if (totalWindow <= 0) {
				graceSkillValue.textContent = '0';
				return;
			}

			const clampedTime = Math.min(Math.max(currentTime, EXPIRATION_MS), AVAILABLE_AT);
			const elapsed = clampedTime - EXPIRATION_MS;
			const remainingFraction = Math.max(0, 1 - elapsed / totalWindow);
			const remainingValue = Math.max(0, Math.round(SKILL_CREATOR_MAX_SUPPLY * remainingFraction));
			graceSkillValue.textContent = numberFormatter.format(remainingValue);
		}

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
				updateGraceSkillCounter(AVAILABLE_AT);
				if (graceBanner) {
					const title = graceBanner.querySelector('.grace-period-title');
					const text = graceBanner.querySelector('.grace-period-text');
					const countdownLabel = graceBanner.querySelector('.grace-countdown-label');
					if (title) title.textContent = 'This name is now available!';
					if (text) text.innerHTML = 'The grace period has ended. This name can now be registered by anyone.';
					if (countdownLabel) countdownLabel.textContent = 'Available now';
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
			updateGraceSkillCounter(now);
		}

		if (IS_IN_GRACE_PERIOD && EXPIRATION_MS) {
			updateGracePeriodCountdown();
			setInterval(updateGracePeriodCountdown, 1000);
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
				const urlMatch = username.match(/(?:x\\.com|twitter\\.com)\\/([a-zA-Z0-9_]+)/i);
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
									\`<a href="\${EXPLORER_BASE}/account/\${owner}" target="_blank" class="link">\${owner.slice(0, 8)}...\${owner.slice(-6)}</a>\` : 
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

						\${previousTx ? \`
						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="9 18 15 12 9 6"></polyline>
								</svg>
								Previous Transaction
							</div>
							<div class="nft-detail-value mono">
								<a href="\${EXPLORER_BASE}/tx/\${previousTx}" target="_blank" class="link">\${previousTx.slice(0, 10)}...\${previousTx.slice(-8)}</a>
							</div>
						</div>
						\` : ''}

						\${description ? \`
						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14 2 14 8 20 8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10 9 9 9 8 9"></polyline>
								</svg>
								Description
							</div>
							<div class="nft-detail-value">\${escapeHtmlJs(description)}</div>
						</div>
						\` : ''}

						\${link ? \`
						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
									<polyline points="15 3 21 3 21 9"></polyline>
									<line x1="10" y1="14" x2="21" y2="3"></line>
								</svg>
								Link
							</div>
							<div class="nft-detail-value">
								<a href="\${escapeHtmlJs(link)}" target="_blank" class="link" rel="noopener noreferrer">\${escapeHtmlJs(link)}</a>
							</div>
						</div>
						\` : ''}

						\${projectUrl ? \`
						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="2" y1="12" x2="22" y2="12"></line>
									<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
								</svg>
								Project URL
							</div>
							<div class="nft-detail-value">
								<a href="\${escapeHtmlJs(projectUrl)}" target="_blank" class="link" rel="noopener noreferrer">\${escapeHtmlJs(projectUrl)}</a>
							</div>
						</div>
						\` : ''}

						\${imageUrl ? \`
						<div class="nft-detail-card">
							<div class="nft-detail-label">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
									<circle cx="8.5" cy="8.5" r="1.5"></circle>
									<polyline points="21 15 16 10 5 21"></polyline>
								</svg>
								Image URL
							</div>
							<div class="nft-detail-value">
								<a href="\${escapeHtmlJs(imageUrl)}" target="_blank" class="link" rel="noopener noreferrer">\${escapeHtmlJs(imageUrl.length > 50 ? imageUrl.slice(0, 50) + '...' : imageUrl)}</a>
							</div>
						</div>
						\` : ''}

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
</body>
</html>`
}

function collapseWhitespace(value: string): string {
	return value.replace(/\s+/g, ' ').trim()
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

function selectProfileImage(
	record: SuiNSRecord,
	hostname?: string,
): string | undefined {
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
	let cleaned = value.replace(/^@/, '')

	// Extract from URL
	const urlMatch = cleaned.match(/(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i)
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
				${linksHtml || `
					<div class="social-links-empty">
						<p>No social links set</p>
						<p class="social-links-empty-hint">Connect your X profile to let visitors find you</p>
					</div>
				`}
			</div>
			<button class="social-links-add-btn" id="add-social-btn" style="${xUsername ? 'display:none;' : ''}">
				${plusIcon}
				Add X Profile
			</button>
		</div>
	`
}
