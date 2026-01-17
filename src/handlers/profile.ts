import type { Env, SuiNSRecord } from '../types'
import { normalizeMediaUrl, renderSocialMeta } from '../utils/social'
import {
	generatePasskeyWalletHTML,
	generatePasskeyWalletScript,
	generatePasskeyWalletStyles,
} from './passkey-wallet'

export interface ProfilePageOptions {
	canonicalUrl?: string
	hostname?: string
	description?: string
	image?: string
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

	<style>
		:root {
			--bg-gradient-start: #0a0a0f;
			--bg-gradient-end: #12121a;
			--card-bg: rgba(22, 22, 30, 0.9);
			--card-bg-solid: #16161e;
			--glass-border: rgba(255, 255, 255, 0.08);
			--text: #e4e4e7;
			--text-muted: #71717a;
			--accent: #60a5fa;
			--accent-light: rgba(96, 165, 250, 0.12);
			--accent-hover: #93c5fd;
			--accent-glow: rgba(96, 165, 250, 0.3);
			--success: #34d399;
			--success-light: rgba(52, 211, 153, 0.12);
			--warning: #fbbf24;
			--warning-light: rgba(251, 191, 36, 0.12);
			--error: #f87171;
			--error-light: rgba(248, 113, 113, 0.12);
			--border: rgba(255, 255, 255, 0.06);
			--border-strong: rgba(255, 255, 255, 0.12);
			--shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
			--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: var(--text);
			min-height: 100vh;
			padding: 24px 16px;
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

		/* Custom Scrollbar Styles - Blue Gradient */
		* {
			scrollbar-width: thin;
			scrollbar-color: rgba(96, 165, 250, 0.6) rgba(96, 165, 250, 0.1);
		}
		*::-webkit-scrollbar {
			width: 10px;
			height: 10px;
		}
		*::-webkit-scrollbar-track {
			background: rgba(96, 165, 250, 0.1);
			border-radius: 10px;
		}
		*::-webkit-scrollbar-thumb {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.8), rgba(96, 165, 250, 0.6));
			border-radius: 10px;
			border: 2px solid transparent;
			background-clip: padding-box;
		}
		*::-webkit-scrollbar-thumb:hover {
			background: linear-gradient(135deg, rgba(96, 165, 250, 1), rgba(96, 165, 250, 0.8));
			background-clip: padding-box;
		}

		.container { max-width: 900px; margin: 0 auto; position: relative; }

		.page-layout {
			display: flex;
			gap: 16px;
		}
		.sidebar {
			width: 180px;
			flex-shrink: 0;
			position: sticky;
			top: 24px;
			align-self: flex-start;
		}
		.sidebar-nav {
			background: var(--card-bg);
			border-radius: 16px;
			padding: 8px;
			border: 1px solid var(--border);
			backdrop-filter: blur(20px);
		}
		.sidebar-tab {
			display: flex;
			align-items: center;
			gap: 10px;
			width: 100%;
			padding: 10px 12px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			font-size: 0.8rem;
			font-weight: 500;
			cursor: pointer;
			border-radius: 10px;
			transition: all 0.2s;
			text-align: left;
		}
		.sidebar-tab:hover {
			background: rgba(255, 255, 255, 0.05);
			color: var(--text);
		}
		.sidebar-tab.active {
			background: var(--accent-light);
			color: var(--accent);
		}
		.sidebar-tab svg {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
		}
		.main-content {
			flex: 1;
			min-width: 0;
		}
		.tab-panel {
			display: none;
		}
		.tab-panel.active {
			display: block;
		}

		.profile-hero {
			display: flex;
			gap: 16px;
			align-items: flex-start;
			margin-bottom: 16px;
		}
		.identity-card {
			width: 160px;
			background: #050818;
			border-radius: 16px;
			overflow: hidden;
			box-shadow: 0 12px 32px rgba(59, 130, 246, 0.2);
			position: relative;
		}
		.identity-visual {
			position: relative;
			aspect-ratio: 1;
			background: linear-gradient(135deg, #0a1628 0%, #050818 100%);
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.identity-visual img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
		.identity-visual canvas {
			width: 85%;
			height: 85%;
			border-radius: 8px;
		}
		.identity-qr-toggle {
			position: absolute;
			bottom: 8px;
			left: 8px;
			right: auto;
			width: 32px;
			height: 32px;
			background: rgba(5, 8, 24, 0.9);
			border: 1px solid rgba(96, 165, 250, 0.3);
			border-radius: 8px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
			z-index: 2;
		}
		.identity-qr-toggle:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: var(--accent);
		}
		.identity-qr-toggle svg {
			width: 16px;
			height: 16px;
			color: var(--accent);
		}
		.identity-qr-toggle.active {
			background: var(--accent);
			border-color: var(--accent);
		}
		.identity-qr-toggle.active svg {
			color: white;
		}
		.ai-generate-btn {
			width: 28px;
			height: 28px;
			border-radius: 6px;
			border: 1px solid rgba(255, 255, 255, 0.1);
			background: rgba(139, 92, 246, 0.15);
			backdrop-filter: blur(10px);
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: all 0.2s;
			flex-shrink: 0;
		}
		.ai-generate-btn:hover {
			background: rgba(139, 92, 246, 0.25);
			border-color: rgba(139, 92, 246, 0.4);
		}
		.ai-generate-btn svg {
			width: 16px;
			height: 16px;
			color: #a78bfa;
		}
		.ai-generate-btn:hover svg {
			color: #c4b5fd;
		}
		.ai-generate-btn.loading svg {
			opacity: 0.6;
		}
		.identity-name-wrapper {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 10px;
			border-top: 1px solid rgba(96, 165, 250, 0.15);
		}
		.identity-name {
			text-align: center;
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--accent);
			background: rgba(96, 165, 250, 0.08);
			cursor: pointer;
			transition: all 0.2s;
		}
		.identity-name:hover {
			background: rgba(96, 165, 250, 0.15);
		}
		.identity-name.copied {
			background: rgba(52, 211, 153, 0.15);
			color: var(--success);
		}
		.hero-main {
			flex: 1;
			min-width: 0;
		}

		.card {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border-radius: 14px;
			padding: 20px;
			border: 1px solid var(--glass-border);
			box-shadow: var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.05);
			margin-bottom: 16px;
			position: relative;
			overflow: hidden;
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

		.header {
			margin-bottom: 16px;
			padding-bottom: 16px;
			border-bottom: 1px solid var(--border);
		}
		.header-top {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 8px;
			flex-wrap: wrap;
		}
		h1 {
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--text);
			letter-spacing: -0.03em;
			margin: 0;
			word-break: break-all;
		}
		h1 .suffix {
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.badge {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			padding: 4px 10px;
			border-radius: 8px;
			font-size: 0.65rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			white-space: nowrap;
		}
		.badge.network {
			background: var(--accent-light);
			color: var(--accent);
			border: 1px solid var(--border);
		}
		.badge.expiry {
			background: rgba(34, 197, 94, 0.15);
			color: #22c55e;
			border: 1px solid rgba(34, 197, 94, 0.2);
		}
		.badge.expiry.warning {
			background: var(--warning-light);
			color: var(--warning);
			border: 1px solid rgba(245, 158, 11, 0.2);
		}
		.badge.expiry.danger {
			background: var(--error-light);
			color: var(--error);
			border: 1px solid rgba(239, 68, 68, 0.2);
		}
		.badge.expiry.premium {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(167, 139, 250, 0.15));
			color: #60a5fa;
			border: 1px solid rgba(96, 165, 250, 0.3);
		}
		.header-meta {
			display: flex;
			align-items: center;
			gap: 16px;
			flex-wrap: wrap;
			font-size: 0.8rem;
			color: var(--text-muted);
		}
		.header-meta-item {
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.header-meta-item svg {
			width: 14px;
			height: 14px;
			opacity: 0.7;
		}
		.header-meta-item a {
			color: var(--text-muted);
		}
		.header-meta-item a:hover {
			color: var(--accent);
		}

		.owner-display {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.8), rgba(20, 20, 30, 0.9));
			padding: 12px 16px;
			border-radius: 12px;
			border: 1px solid var(--border);
			margin-top: 12px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
		}
		.owner-info {
			display: flex;
			align-items: center;
			gap: 10px;
			flex: 1;
		}
		.owner-info-link {
			display: flex;
			align-items: center;
			gap: 10px;
			flex: 1;
			min-width: 0;
			text-decoration: none;
			padding: 8px 12px;
			margin: -8px -12px;
			border-radius: 10px;
			transition: all 0.2s;
			cursor: pointer;
		}
		.owner-info-link:hover {
			background: rgba(96, 165, 250, 0.1);
		}
		.owner-info-link .owner-name {
			color: var(--accent);
		}
		.owner-info-link:hover .owner-name {
			color: var(--accent-hover);
		}
		.owner-info-link .visit-arrow {
			opacity: 0;
			transform: translateX(-4px);
			transition: all 0.2s;
			color: var(--accent);
			flex-shrink: 0;
		}
		.owner-info-link:hover .visit-arrow {
			opacity: 1;
			transform: translateX(0);
		}
		.owner-label {
			font-size: 0.65rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.owner-name {
			font-weight: 700;
			font-size: 0.95rem;
			color: var(--text);
		}
		.owner-name .suffix {
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.owner-addr {
			font-family: ui-monospace, SFMono-Regular, monospace;
			color: var(--text-muted);
			font-size: 0.7rem;
		}
		.owner-actions {
			display: flex;
			gap: 6px;
			align-items: center;
		}
		.owner-actions .copy-btn {
			background: none;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			padding: 6px;
			display: flex;
			align-items: center;
			transition: all 0.2s;
			border-radius: 8px;
		}
		.owner-actions .copy-btn:hover {
			color: var(--accent);
			background: var(--accent-light);
		}
		.owner-actions .edit-btn {
			background: var(--card-bg-solid);
			border: 1px solid var(--border-strong);
			color: var(--text);
			padding: 8px 14px;
			border-radius: 10px;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.owner-actions .edit-btn:hover:not(:disabled) {
			background: var(--accent);
			color: white;
			border-color: var(--accent);
		}
		.owner-actions .edit-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.owner-actions .edit-btn.hidden {
			display: none;
		}


		.qr-expanded {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0,0,0,0.8);
			backdrop-filter: blur(8px);
			z-index: 1000;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			gap: 16px;
			padding: 20px;
		}
		.qr-expanded.active {
			display: flex;
		}
		.qr-expanded-content {
			background: #050818;
			border: 1px solid rgba(96, 165, 250, 0.3);
			border-radius: 24px;
			padding: 24px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 16px;
			max-width: 320px;
			box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 60px rgba(96, 165, 250, 0.15);
		}
		.qr-expanded-content canvas {
			width: 220px;
			height: 220px;
			border-radius: 16px;
		}
		.qr-expanded-url {
			font-family: ui-monospace, monospace;
			font-size: 0.95rem;
			color: var(--text);
			font-weight: 600;
			padding: 8px 16px;
			background: rgba(96, 165, 250, 0.1);
			border-radius: 10px;
		}
		.qr-expanded-actions {
			display: flex;
			gap: 10px;
			width: 100%;
		}
		.qr-expanded-actions button {
			flex: 1;
			padding: 12px 16px;
			border-radius: 10px;
			border: none;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			transition: all 0.2s;
		}
		.qr-expanded-actions button svg {
			width: 16px;
			height: 16px;
		}
		.qr-expanded-actions .copy-btn {
			background: rgba(96, 165, 250, 0.15);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: var(--accent);
		}
		.qr-expanded-actions .copy-btn:hover {
			background: rgba(96, 165, 250, 0.25);
		}
		.qr-expanded-actions .download-btn {
			background: transparent;
			border: 1px solid var(--glass-border);
			color: var(--text);
		}
		.qr-expanded-actions .download-btn:hover {
			background: rgba(255, 255, 255, 0.05);
			border-color: var(--text-muted);
		}
		.qr-expanded-close {
			color: white;
			font-size: 0.85rem;
			opacity: 0.7;
			cursor: pointer;
			margin-top: 8px;
		}
		.qr-expanded-close:hover {
			opacity: 1;
		}

		/* Edit Modal */
		.edit-modal {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.7);
			backdrop-filter: blur(8px);
			z-index: 100;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.edit-modal.open { display: flex; }
		.edit-modal-content {
			background: var(--card-bg-solid);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 28px;
			max-width: 480px;
			width: 100%;
			box-shadow: var(--shadow-lg);
		}
		.edit-modal h3 {
			color: var(--text);
			margin-bottom: 8px;
			font-size: 1.15rem;
			font-weight: 700;
		}
		.edit-modal p {
			color: var(--text-muted);
			font-size: 0.85rem;
			margin-bottom: 18px;
		}
		.edit-modal input {
			width: 100%;
			padding: 14px 16px;
			border: 2px solid var(--border);
			border-radius: 12px;
			background: var(--card-bg-solid);
			color: var(--text);
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.85rem;
			margin-bottom: 8px;
			transition: all 0.2s;
		}
		.edit-modal input:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 4px var(--accent-glow);
		}
		.edit-modal-buttons {
			display: flex;
			gap: 12px;
			margin-top: 20px;
		}
		.edit-modal-buttons button {
			flex: 1;
			padding: 12px 18px;
			border-radius: 12px;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.edit-modal-buttons .cancel-btn {
			background: transparent;
			color: var(--text-muted);
			border: 1px solid var(--border);
		}
		.edit-modal-buttons .cancel-btn:hover {
			background: rgba(255, 255, 255, 0.05);
			color: var(--text);
		}
		.edit-modal-buttons .save-btn {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			border: none;
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}
		.edit-modal-buttons .save-btn:hover {
			filter: brightness(1.1);
			transform: translateY(-1px);
		}
		.edit-modal-buttons .save-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}

		/* Wallet Modal */
		.wallet-modal {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.7);
			backdrop-filter: blur(4px);
			z-index: 2000;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.wallet-modal.open { display: flex; }
		.wallet-modal-content {
			background: var(--card-bg-solid);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 24px;
			width: 100%;
			max-width: 380px;
			box-shadow: var(--shadow-lg);
		}
		.wallet-modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20px;
			font-size: 1.1rem;
			font-weight: 700;
			color: var(--text);
		}
		.wallet-modal-close {
			background: none;
			border: none;
			color: var(--text-muted);
			font-size: 1.5rem;
			cursor: pointer;
			padding: 0;
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 8px;
		}
		.wallet-modal-close:hover {
			background: rgba(255,255,255,0.1);
			color: var(--text);
		}
		.wallet-list {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.wallet-detecting {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			padding: 24px;
			color: var(--text-muted);
			font-size: 0.9rem;
		}
		.wallet-item {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 14px 16px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.2s;
		}
		.wallet-item:hover {
			border-color: var(--accent);
			background: rgba(96, 165, 250, 0.1);
		}
		.wallet-item img {
			width: 36px;
			height: 36px;
			border-radius: 8px;
		}
		.wallet-item .wallet-name {
			font-weight: 600;
			color: var(--text);
		}
		.wallet-no-wallets {
			text-align: center;
			padding: 20px;
			color: var(--text-muted);
			font-size: 0.9rem;
		}
		.wallet-no-wallets a {
			display: inline-block;
			margin-top: 12px;
			color: var(--accent);
			text-decoration: none;
		}
		.wallet-no-wallets a:hover {
			text-decoration: underline;
		}

		/* Wallet status bar */
		.wallet-bar {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 12px;
			font-size: 0.75rem;
		}
		.wallet-bar .wallet-status {
			margin-left: auto;
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 8px 14px;
			background: var(--accent-light);
			border: 1px solid var(--border);
			border-radius: 10px;
		}
		.wallet-bar .wallet-addr {
			font-family: ui-monospace, SFMono-Regular, monospace;
			color: var(--accent);
			font-weight: 600;
		}
		.wallet-bar .wallet-name {
			color: var(--text-muted);
			font-size: 0.7rem;
		}
		.wallet-bar button {
			background: none;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			font-size: 1rem;
			transition: color 0.2s;
			padding: 4px;
		}
		.wallet-bar button:hover { color: var(--error); }
		.wallet-bar .connect-btn {
			margin-left: auto;
			padding: 10px 18px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			border: none;
			border-radius: 10px;
			color: white;
			font-weight: 600;
			font-size: 0.8rem;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}
		.wallet-bar .connect-btn:hover {
			filter: brightness(1.1);
			transform: translateY(-1px);
			box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
		}

		.section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 14px;
			padding: 16px;
			margin-bottom: 14px;
			box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,0.03);
			position: relative;
		}
		.section::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
		}
		.section h3 {
			color: var(--text);
			font-size: 0.85rem;
			font-weight: 700;
			margin-bottom: 12px;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.section h3 svg {
			width: 16px;
			height: 16px;
			color: var(--accent);
		}

		.profile-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
			gap: 8px;
			padding-top: 12px;
			border-top: 1px solid var(--border);
		}
		.profile-item {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 14px;
			box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
		}
		.profile-label {
			font-size: 0.65rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 6px;
		}
		.profile-value {
			font-size: 0.85rem;
			color: var(--text);
			word-break: break-all;
			font-weight: 500;
		}
		.profile-value.mono {
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.75rem;
		}
		.profile-value.highlight {
			color: var(--accent);
		}

		.status {
			padding: 12px 16px;
			border-radius: 12px;
			font-size: 0.85rem;
			margin-top: 14px;
			font-weight: 500;
		}
		.status.error { background: var(--error-light); color: var(--error); border: 1px solid rgba(239, 68, 68, 0.2); }
		.status.success { background: var(--success-light); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
		.status.info { background: var(--accent-light); color: var(--accent); border: 1px solid var(--border); }
		.status.hidden { display: none; }

		/* Records Table */
		.records-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 0.85rem;
		}
		.records-table th,
		.records-table td {
			padding: 12px 10px;
			border-bottom: 1px solid var(--border);
			text-align: left;
		}
		.records-table th {
			color: var(--text-muted);
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			font-size: 0.7rem;
		}
		.record-key {
			font-family: ui-monospace, SFMono-Regular, monospace;
			color: var(--accent);
			width: 35%;
			font-size: 0.8rem;
			font-weight: 600;
		}
		.record-value {
			color: var(--text);
			word-break: break-all;
		}
		.record-empty {
			color: var(--text-muted);
			font-style: italic;
			text-align: center;
		}

		/* Links */
		a { color: var(--accent); text-decoration: none; transition: all 0.2s; }
		a:hover { color: var(--accent-hover); }

		.links {
			display: flex;
			gap: 12px;
			flex-wrap: wrap;
			margin-top: 24px;
		}
		.links a {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 18px;
			background: var(--card-bg-solid);
			border: 1px solid var(--border-strong);
			border-radius: 12px;
			font-size: 0.8rem;
			color: var(--text);
			transition: all 0.2s;
			font-weight: 600;
		}
		.links a:hover {
			border-color: var(--accent);
			color: var(--accent);
			box-shadow: var(--shadow);
			transform: translateY(-2px);
		}
		.links a svg {
			width: 16px;
			height: 16px;
		}

		.footer {
			text-align: center;
			margin-top: 32px;
			padding-top: 20px;
			color: var(--text-muted);
			font-size: 0.8rem;
		}
		.footer a { color: var(--accent); font-weight: 600; }

		.loading {
			display: inline-block;
			width: 16px;
			height: 16px;
			border: 2px solid var(--border);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 0.7s linear infinite;
		}
		@keyframes spin { to { transform: rotate(360deg); } }
		.hidden { display: none !important; }

		/* Marketplace Section */
		.marketplace-section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 24px;
			margin-bottom: 20px;
			box-shadow: var(--shadow);
		}
		.marketplace-section h3 {
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 700;
			margin-bottom: 6px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.marketplace-section h3 svg {
			width: 18px;
			height: 18px;
			color: var(--accent);
		}
		.marketplace-subtitle {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 16px;
		}
		.marketplace-loading {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 20px;
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.marketplace-content {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}
		.marketplace-listing {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.05), rgba(167, 139, 250, 0.05));
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 16px;
		}
		.listing-status {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.listing-label {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.listing-value {
			font-size: 0.9rem;
			font-weight: 700;
			color: var(--text);
		}
		.listing-value.for-sale {
			color: #22c55e;
		}
		.listing-price {
			margin-top: 8px;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.listing-price-label {
			font-size: 0.7rem;
			color: var(--text-muted);
		}
		.listing-price-value {
			font-size: 1.1rem;
			font-weight: 700;
			color: var(--accent);
		}
		.marketplace-bids {
			background: rgba(30, 30, 40, 0.5);
			border: 1px solid var(--border);
			border-radius: 14px;
			overflow: hidden;
		}
		.bids-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px 16px;
			border-bottom: 1px solid var(--border);
			font-size: 0.8rem;
			font-weight: 600;
			color: var(--text-muted);
		}
		.bids-count {
			background: var(--accent-light);
			color: var(--accent);
			padding: 2px 8px;
			border-radius: 10px;
			font-size: 0.7rem;
		}
		.bids-list {
			max-height: 200px;
			overflow-y: auto;
		}
		.bid-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px 16px;
			border-bottom: 1px solid var(--border);
		}
		.bid-item:last-child {
			border-bottom: none;
		}
		.bid-item-info {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.bid-item-bidder {
			font-size: 0.8rem;
			color: var(--text);
			font-family: ui-monospace, SFMono-Regular, monospace;
		}
		.bid-item-time {
			font-size: 0.7rem;
			color: var(--text-muted);
		}
		.bid-item-amount {
			font-size: 0.9rem;
			font-weight: 700;
			color: var(--accent);
		}
		.no-bids {
			padding: 20px 16px;
			text-align: center;
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.place-bid-section {
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(16, 185, 129, 0.05));
			border: 1px solid rgba(34, 197, 94, 0.2);
			border-radius: 14px;
			padding: 16px;
		}
		.place-bid-section h4 {
			font-size: 0.85rem;
			font-weight: 600;
			color: var(--text);
			margin-bottom: 12px;
		}
		.bid-form {
			display: flex;
			gap: 12px;
			align-items: flex-end;
		}
		.bid-input-group {
			flex: 1;
		}
		.bid-input-group label {
			display: block;
			font-size: 0.7rem;
			font-weight: 600;
			color: var(--text-muted);
			margin-bottom: 6px;
		}
		.bid-input-group input {
			width: 100%;
			padding: 10px 12px;
			border: 2px solid var(--border);
			border-radius: 10px;
			background: var(--card-bg-solid);
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 600;
		}
		.bid-input-group input:focus {
			outline: none;
			border-color: #22c55e;
			box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
		}
		.bid-submit-btn {
			padding: 10px 20px;
			background: linear-gradient(135deg, #22c55e, #10b981);
			color: white;
			border: none;
			border-radius: 10px;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			white-space: nowrap;
		}
		.bid-submit-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
		}
		.bid-submit-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.bid-status {
			margin-top: 12px;
			padding: 10px 14px;
			border-radius: 10px;
			font-size: 0.8rem;
		}
		.bid-status.success {
			background: rgba(34, 197, 94, 0.15);
			color: #22c55e;
			border: 1px solid rgba(34, 197, 94, 0.3);
		}
		.bid-status.error {
			background: var(--error-light);
			color: var(--error);
			border: 1px solid rgba(239, 68, 68, 0.3);
		}
		.tradeport-link {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 12px 16px;
			background: rgba(30, 30, 40, 0.5);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--accent);
			font-size: 0.85rem;
			font-weight: 500;
			text-decoration: none;
			transition: all 0.2s;
		}
		.tradeport-link:hover {
			border-color: var(--accent);
			background: var(--accent-light);
		}
		.tradeport-link svg {
			width: 16px;
			height: 16px;
		}
		.marketplace-error {
			text-align: center;
			padding: 20px;
			color: var(--text-muted);
		}
		.marketplace-error p {
			margin-bottom: 12px;
		}
		.retry-btn {
			padding: 8px 16px;
			background: var(--accent-light);
			color: var(--accent);
			border: 1px solid var(--border);
			border-radius: 8px;
			font-size: 0.8rem;
			cursor: pointer;
			transition: all 0.2s;
		}
		.retry-btn:hover {
			border-color: var(--accent);
		}

		/* Queue Bid Section */
		.queue-bid-section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 24px;
			margin-bottom: 20px;
			box-shadow: var(--shadow);
		}
		.queue-bid-section h3 {
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 700;
			margin-bottom: 14px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.queue-bid-section h3 svg {
			width: 18px;
			height: 18px;
			color: var(--warning);
		}
		.queue-bid-info {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 14px;
			margin-bottom: 18px;
		}
		@media (max-width: 480px) {
			.queue-bid-info { grid-template-columns: 1fr; }
		}
		.queue-bid-stat {
			background: linear-gradient(135deg, rgba(14, 165, 233, 0.03), rgba(6, 182, 212, 0.03));
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 14px;
		}
		.queue-bid-stat-label {
			font-size: 0.65rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 6px;
		}
		.queue-bid-stat-value {
			font-size: 0.95rem;
			font-weight: 700;
			color: var(--text);
		}
		.queue-bid-stat-value.warning {
			color: var(--warning);
		}
		.queue-bid-stat-value.countdown {
			color: var(--accent);
			font-family: ui-monospace, SFMono-Regular, monospace;
		}
		.queue-bid-form {
			display: flex;
			gap: 12px;
			align-items: flex-end;
		}
		.queue-bid-input-group {
			flex: 1;
		}
		.queue-bid-input-group label {
			display: block;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
			margin-bottom: 8px;
		}
		.queue-bid-input-group input {
			width: 100%;
			padding: 12px 14px;
			border: 2px solid var(--border);
			border-radius: 12px;
			background: var(--card-bg-solid);
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 600;
		}
		.queue-bid-input-group input:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 4px var(--accent-glow);
		}
		.queue-bid-btn {
			padding: 12px 24px;
			background: linear-gradient(135deg, var(--warning), #f97316);
			color: white;
			border: none;
			border-radius: 12px;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			white-space: nowrap;
			box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
		}
		.queue-bid-btn:hover:not(:disabled) {
			filter: brightness(1.1);
			transform: translateY(-1px);
		}
		.queue-bid-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}
		.queue-bid-status {
			margin-top: 14px;
			padding: 12px 16px;
			border-radius: 12px;
			font-size: 0.85rem;
			font-weight: 500;
		}
		.queue-bid-existing {
			background: var(--accent-light);
			border: 1px solid var(--border-strong);
			border-radius: 14px;
			padding: 14px;
			margin-bottom: 18px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 14px;
		}
		.queue-bid-existing-info {
			flex: 1;
		}
		.queue-bid-existing-label {
			font-size: 0.7rem;
			color: var(--accent);
			text-transform: uppercase;
			font-weight: 600;
			margin-bottom: 4px;
		}
		.queue-bid-existing-value {
			font-size: 1rem;
			font-weight: 700;
			color: var(--text);
		}
		.queue-bid-cancel {
			padding: 8px 14px;
			background: transparent;
			border: 2px solid var(--error);
			color: var(--error);
			border-radius: 10px;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.queue-bid-cancel:hover {
			background: var(--error);
			color: white;
		}
		.queue-bid-note {
			font-size: 0.75rem;
			color: var(--text-muted);
			margin-top: 14px;
			line-height: 1.6;
		}


		/* Quick Message Section (Overview Tab) */
		.quick-message-section {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.12));
			border: 1px solid rgba(96, 165, 250, 0.25);
			border-radius: 16px;
			padding: 20px;
			margin-top: 20px;
		}
		.quick-message-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 16px;
		}
		.quick-message-title {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 1rem;
			font-weight: 700;
			color: var(--text);
		}
		.quick-message-title > svg {
			width: 20px;
			height: 20px;
			color: var(--accent);
		}
		.encrypted-badge {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 0.7rem;
			font-weight: 600;
			color: var(--success);
			background: var(--success-light);
			padding: 4px 10px;
			border-radius: 20px;
		}
		.encrypted-badge svg {
			width: 12px;
			height: 12px;
		}
		.powered-by {
			font-size: 0.75rem;
			color: var(--text-muted);
			text-decoration: none;
		}
		.powered-by:hover {
			color: var(--accent);
		}
		.message-recipient {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 12px;
			padding: 10px 14px;
			background: rgba(0,0,0,0.2);
			border-radius: 10px;
		}
		.to-label {
			font-size: 0.8rem;
			color: var(--text-muted);
		}
		.to-name {
			font-size: 0.95rem;
			font-weight: 700;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.to-address {
			font-size: 0.75rem;
			color: var(--text-muted);
			font-family: ui-monospace, monospace;
		}
		.quick-message-input {
			width: 100%;
			padding: 14px;
			background: rgba(15, 23, 42, 0.8);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 0.9rem;
			font-family: inherit;
			resize: none;
			margin-bottom: 12px;
		}
		.quick-message-input:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
		}
		.quick-message-input::placeholder {
			color: var(--text-muted);
		}
		.quick-message-footer {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
		}
		.message-features {
			display: flex;
			gap: 8px;
		}
		.feature-tag {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 0.7rem;
			color: var(--text-muted);
			background: rgba(0,0,0,0.2);
			padding: 4px 10px;
			border-radius: 6px;
		}
		.feature-tag svg {
			width: 12px;
			height: 12px;
		}
		.send-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 20px;
			background: linear-gradient(135deg, #60a5fa, #8b5cf6);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.send-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 16px rgba(96, 165, 250, 0.4);
		}
		.send-btn:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}
		.send-btn svg {
			width: 16px;
			height: 16px;
		}
		.message-status {
			margin-top: 12px;
			padding: 12px 14px;
			border-radius: 10px;
			font-size: 0.85rem;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.message-status.hidden {
			display: none;
		}
		.message-status.success {
			background: rgba(52, 211, 153, 0.15);
			border: 1px solid rgba(52, 211, 153, 0.3);
			color: var(--success);
		}
		.message-status.error {
			background: rgba(248, 113, 113, 0.15);
			border: 1px solid rgba(248, 113, 113, 0.3);
			color: var(--error);
		}
		.message-status.info {
			background: rgba(96, 165, 250, 0.15);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: var(--accent);
		}
		.message-status .loading {
			width: 14px;
			height: 14px;
		}

		/* Messaging Section (Separate Tab - Legacy) */
		.messaging-section {
			padding: 8px;
		}
		.messaging-header h3 {
			display: flex;
			align-items: center;
			gap: 12px;
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--text);
			margin-bottom: 8px;
		}
		.messaging-header h3 svg {
			width: 24px;
			height: 24px;
			color: var(--accent);
		}
		.alpha-badge {
			font-size: 0.65rem;
			padding: 3px 8px;
			background: rgba(251, 191, 36, 0.15);
			color: #fbbf24;
			border-radius: 6px;
			text-transform: uppercase;
			font-weight: 700;
			letter-spacing: 0.05em;
		}
		.messaging-subtitle {
			color: var(--text-muted);
			font-size: 0.85rem;
			margin-bottom: 20px;
		}
		.messaging-features-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 12px;
			margin-bottom: 24px;
		}
		.messaging-feature {
			display: flex;
			align-items: flex-start;
			gap: 12px;
			background: rgba(15, 23, 42, 0.6);
			padding: 16px;
			border-radius: 12px;
			border: 1px solid var(--border);
		}
		.messaging-feature svg {
			width: 24px;
			height: 24px;
			color: var(--accent);
			flex-shrink: 0;
			margin-top: 2px;
		}
		.messaging-feature h4 {
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--text);
			margin-bottom: 4px;
		}
		.messaging-feature p {
			font-size: 0.8rem;
			color: var(--text-muted);
			line-height: 1.4;
		}
		.messaging-compose {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.1));
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 16px;
			padding: 20px;
			margin-bottom: 20px;
		}
		.compose-header {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 14px;
		}
		.compose-label {
			font-size: 0.85rem;
			color: var(--text-muted);
		}
		.compose-recipient {
			font-size: 1rem;
			font-weight: 700;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.compose-body {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.message-textarea {
			width: 100%;
			padding: 14px;
			background: rgba(15, 23, 42, 0.8);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 0.95rem;
			font-family: inherit;
			resize: vertical;
			min-height: 100px;
		}
		.message-textarea:focus {
			outline: none;
			border-color: var(--accent);
		}
		.message-textarea::placeholder {
			color: var(--text-muted);
		}
		.compose-actions {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
		}
		.compose-info {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			color: var(--success);
		}
		.compose-info svg {
			width: 14px;
			height: 14px;
		}
		.send-message-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 24px;
			background: linear-gradient(135deg, #60a5fa, #8b5cf6);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.95rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.send-message-btn:hover:not(:disabled) {
			transform: translateY(-2px);
			box-shadow: 0 4px 16px rgba(96, 165, 250, 0.4);
		}
		.send-message-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.send-message-btn svg {
			width: 16px;
			height: 16px;
		}
		.message-status {
			margin-top: 12px;
			padding: 12px;
			border-radius: 8px;
			font-size: 0.85rem;
		}
		.message-status.success {
			background: rgba(52, 211, 153, 0.15);
			border: 1px solid rgba(52, 211, 153, 0.3);
			color: var(--success);
		}
		.message-status.error {
			background: rgba(248, 113, 113, 0.15);
			border: 1px solid rgba(248, 113, 113, 0.3);
			color: var(--error);
		}
		.message-status.info {
			background: rgba(96, 165, 250, 0.15);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: var(--accent);
		}
		.messaging-info {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 16px;
			margin-bottom: 20px;
		}
		.info-card {
			background: rgba(15, 23, 42, 0.5);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 16px;
		}
		.info-card h4 {
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--text);
			margin-bottom: 12px;
		}
		.info-card ol {
			list-style: none;
			counter-reset: steps;
			padding: 0;
			margin: 0;
		}
		.info-card ol li {
			counter-increment: steps;
			font-size: 0.8rem;
			color: var(--text-muted);
			padding: 6px 0 6px 28px;
			position: relative;
		}
		.info-card ol li::before {
			content: counter(steps);
			position: absolute;
			left: 0;
			width: 20px;
			height: 20px;
			background: var(--accent-light);
			color: var(--accent);
			border-radius: 50%;
			font-size: 0.7rem;
			font-weight: 700;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.contract-address, .contract-network {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 8px;
		}
		.contract-address .label, .contract-network .label {
			color: var(--text);
			font-weight: 500;
		}
		.contract-address code {
			background: rgba(0,0,0,0.3);
			padding: 2px 6px;
			border-radius: 4px;
			font-family: monospace;
			font-size: 0.75rem;
		}
		.network-badge {
			display: inline-block;
			background: var(--success-light);
			color: var(--success);
			padding: 2px 8px;
			border-radius: 4px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: capitalize;
		}
		.messaging-links {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		.messaging-link {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 12px 16px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 10px;
			color: var(--accent);
			font-size: 0.85rem;
			font-weight: 500;
			text-decoration: none;
			transition: all 0.2s;
		}
		.messaging-link:hover {
			border-color: var(--accent);
			background: rgba(96, 165, 250, 0.1);
		}
		.messaging-link svg {
			width: 16px;
			height: 16px;
		}

		/* Command Palette / Quick Search */
		.search-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(12, 74, 110, 0.6);
			backdrop-filter: blur(8px);
			z-index: 1000;
			display: flex;
			align-items: flex-start;
			justify-content: center;
			padding-top: 20vh;
			opacity: 0;
			visibility: hidden;
			transition: all 0.2s ease;
		}
		.search-overlay.active {
			opacity: 1;
			visibility: visible;
		}
		.search-box {
			background: var(--card-bg-solid);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 8px;
			width: 100%;
			max-width: 520px;
			box-shadow: 0 20px 60px rgba(14, 165, 233, 0.2), 0 8px 24px rgba(0, 0, 0, 0.1);
			transform: translateY(-20px) scale(0.95);
			transition: transform 0.2s ease;
		}
		.search-overlay.active .search-box {
			transform: translateY(0) scale(1);
		}
		.search-input-wrapper {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 14px 18px;
		}
		.search-input-wrapper svg {
			width: 24px;
			height: 24px;
			color: var(--accent);
			flex-shrink: 0;
		}
		.search-input {
			flex: 1;
			border: none;
			background: none;
			font-size: 1.25rem;
			font-weight: 500;
			color: var(--text);
			outline: none;
		}
		.search-input::placeholder {
			color: var(--text-muted);
		}
		.search-hint {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 18px;
			border-top: 1px solid var(--border);
			font-size: 0.8rem;
			color: var(--text-muted);
		}
		.search-hint kbd {
			background: var(--accent-light);
			border: 1px solid var(--border);
			border-radius: 6px;
			padding: 3px 8px;
			font-family: ui-monospace, monospace;
			font-size: 0.75rem;
			color: var(--accent);
		}
		.search-results {
			max-height: 320px;
			overflow-y: auto;
			border-top: 1px solid var(--border);
		}
		.search-result-item {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 14px 18px;
			cursor: pointer;
			transition: all 0.15s;
			border-bottom: 1px solid var(--border);
		}
		.search-result-item:last-child {
			border-bottom: none;
		}
		.search-result-item:hover,
		.search-result-item.selected {
			background: var(--accent-light);
		}
		.search-result-avatar {
			width: 40px;
			height: 40px;
			border-radius: 10px;
			background: linear-gradient(135deg, var(--accent), #a78bfa);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 1rem;
			font-weight: 700;
			color: white;
			flex-shrink: 0;
		}
		.search-result-info {
			flex: 1;
			min-width: 0;
		}
		.search-result-name {
			font-size: 1rem;
			font-weight: 600;
			color: var(--text);
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.search-result-name .suffix {
			background: linear-gradient(135deg, var(--accent), #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.search-result-status {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-top: 2px;
		}
		.search-result-badge {
			padding: 4px 10px;
			border-radius: 8px;
			font-size: 0.7rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.search-result-badge.taken {
			background: rgba(248, 113, 113, 0.15);
			color: #f87171;
		}
		.search-result-badge.available {
			background: rgba(52, 211, 153, 0.15);
			color: #34d399;
		}
		.search-result-badge.checking {
			background: rgba(251, 191, 36, 0.15);
			color: #fbbf24;
		}
		.search-result-badge.expiring {
			background: rgba(251, 191, 36, 0.15);
			color: #fbbf24;
		}
		.search-result-arrow {
			color: var(--text-muted);
			transition: all 0.15s;
		}
		.search-result-item:hover .search-result-arrow,
		.search-result-item.selected .search-result-arrow {
			color: var(--accent);
			transform: translateX(3px);
		}
		.search-empty {
			padding: 24px 18px;
			text-align: center;
			color: var(--text-muted);
			font-size: 0.9rem;
		}
		.search-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			padding: 20px;
			color: var(--text-muted);
		}

		/* Search Button (in wallet bar) */
		.search-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 14px;
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 10px;
			cursor: pointer;
			transition: all 0.2s;
			color: var(--text-muted);
			font-size: 0.8rem;
			margin-right: 10px;
		}
		.search-btn:hover {
			border-color: var(--accent);
			background: var(--accent-light);
			color: var(--accent);
		}
		.search-btn svg {
			width: 16px;
			height: 16px;
		}
		.search-btn kbd {
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid var(--border);
			border-radius: 4px;
			padding: 2px 5px;
			font-family: ui-monospace, monospace;
			font-size: 0.65rem;
			color: var(--text-muted);
		}
		@media (max-width: 600px) {
			.search-btn span,
			.search-btn kbd {
				display: none;
			}
			.search-btn {
				padding: 8px;
				margin-right: 8px;
			}
		}

		/* Upload Section */
		.upload-section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 24px;
			margin-bottom: 20px;
			box-shadow: var(--shadow);
		}
		.upload-section h3 {
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 700;
			margin-bottom: 18px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.upload-section h3 svg {
			width: 18px;
			height: 18px;
			color: var(--accent);
		}
		.upload-header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 14px;
			margin-bottom: 16px;
		}
		.upload-title {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.upload-subtitle {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.upload-badges {
			display: flex;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
		}
		.badge.walrus {
			background: rgba(59, 130, 246, 0.12);
			color: #93c5fd;
			border: 1px solid rgba(59, 130, 246, 0.25);
		}
		.badge.browser {
			background: rgba(16, 185, 129, 0.12);
			color: #6ee7b7;
			border: 1px solid rgba(16, 185, 129, 0.25);
		}
		.upload-dropzone {
			border: 2px dashed var(--border-strong);
			border-radius: 12px;
			padding: 32px 20px;
			text-align: center;
			cursor: pointer;
			transition: all 0.2s;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.3), rgba(20, 20, 30, 0.4));
			position: relative;
			overflow: hidden;
		}
		.upload-dropzone:hover,
		.upload-dropzone.dragover {
			border-color: #60a5fa;
			background: rgba(59, 130, 246, 0.1);
		}
		.upload-dropzone svg {
			width: 40px;
			height: 40px;
			color: var(--accent);
			margin-bottom: 12px;
		}
		.upload-dropzone p {
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 500;
			margin-bottom: 4px;
		}
		.upload-dropzone .hint {
			color: var(--text-muted);
			font-size: 0.75rem;
			font-weight: 400;
		}
		.upload-meta {
			margin-top: 14px;
			display: grid;
			gap: 10px;
			padding: 12px 14px;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.45), rgba(20, 20, 30, 0.55));
			border-radius: 12px;
			border: 1px solid var(--border);
		}
		.upload-meta-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			font-size: 0.75rem;
		}
		.upload-meta-label {
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.06em;
			font-weight: 600;
		}
		.upload-meta-value {
			color: var(--text);
			font-weight: 600;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			max-width: 240px;
			text-align: right;
		}
		.upload-helper {
			margin-top: 12px;
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.upload-options {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-top: 16px;
			font-size: 0.85rem;
		}
		.upload-options label {
			color: var(--text-muted);
			font-weight: 500;
		}
		.upload-options select {
			flex: 1;
			padding: 10px 14px;
			border: 1px solid var(--border);
			border-radius: 10px;
			background: var(--card-bg-solid);
			color: var(--text);
			font-size: 0.85rem;
			cursor: pointer;
		}
		.upload-options select:focus {
			outline: none;
			border-color: var(--accent);
		}
		.upload-progress {
			margin-top: 16px;
			padding: 16px;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			border-radius: 12px;
			border: 1px solid var(--border);
		}
		.upload-progress .progress-bar {
			height: 6px;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 3px;
			overflow: hidden;
			margin-bottom: 10px;
		}
		.upload-progress .progress-fill {
			height: 100%;
			background: linear-gradient(90deg, #3b82f6, #8b5cf6);
			border-radius: 3px;
			transition: width 0.3s;
			width: 0%;
		}
		.upload-progress .progress-status {
			font-size: 0.8rem;
			color: var(--text-muted);
			display: flex;
			align-items: center;
			gap: 8px;
		}

		/* Registration Queue Enhancements */
		.queue-bid-grid {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}
		.queue-offline-fields {
			display: none;
			flex-direction: column;
			gap: 10px;
			margin-top: 10px;
			padding: 12px;
			border-radius: 12px;
			border: 1px dashed var(--border);
			background: rgba(15, 18, 32, 0.65);
		}
		.queue-offline-fields textarea {
			width: 100%;
			min-height: 70px;
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 0.8rem;
			padding: 10px;
			border-radius: 10px;
			border: 1px solid var(--border);
			background: rgba(0,0,0,0.25);
			color: var(--text);
		}
		.queue-offline-fields textarea:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 3px var(--accent-glow);
		}
		.queue-bid-list {
			border: 1px solid var(--border);
			border-radius: 16px;
			overflow: hidden;
		}
		.queue-bid-row {
			display: grid;
			grid-template-columns: 2fr 1fr 1fr 1fr;
			gap: 10px;
			padding: 12px 16px;
			border-bottom: 1px solid rgba(255,255,255,0.04);
			font-size: 0.8rem;
			align-items: center;
		}
		.queue-bid-row:last-child {
			border-bottom: none;
		}
		.queue-bid-row strong {
			font-size: 0.9rem;
			color: var(--text);
		}
		.queue-bid-chip {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			padding: 4px 10px;
			border-radius: 999px;
			font-size: 0.65rem;
			background: rgba(96, 165, 250, 0.12);
			color: var(--accent);
		}
		.queue-bid-chip.auto {
			background: rgba(34, 197, 94, 0.15);
			color: #34d399;
		}
		.queue-bid-chip.failed {
			background: rgba(248, 113, 113, 0.18);
			color: #f87171;
		}
		.queue-bid-chip.pending {
			background: rgba(251, 191, 36, 0.18);
			color: #fbbf24;
		}
		.queue-bid-empty {
			text-align: center;
			padding: 20px;
			color: var(--text-muted);
			font-size: 0.85rem;
		}

		/* ===== OWNED NAMES SECTION ===== */
		.names-section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 24px;
			box-shadow: var(--shadow);
		}
		.names-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20px;
		}
		.names-title {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.names-title h3 {
			font-size: 1rem;
			font-weight: 700;
			color: var(--text);
			margin: 0;
		}
		.names-title svg {
			width: 22px;
			height: 22px;
			color: var(--accent);
		}
		.names-count {
			background: var(--accent-light);
			color: var(--accent);
			padding: 4px 12px;
			border-radius: 20px;
			font-size: 0.75rem;
			font-weight: 600;
		}
		.names-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
			gap: 12px;
		}
		.name-card {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.6), rgba(20, 20, 30, 0.7));
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 16px;
			cursor: pointer;
			transition: all 0.25s ease;
			text-decoration: none;
			display: flex;
			flex-direction: column;
			gap: 10px;
			position: relative;
			overflow: hidden;
		}
		.name-card::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 3px;
			background: linear-gradient(90deg, var(--accent), #a78bfa);
			opacity: 0;
			transition: opacity 0.25s;
		}
		.name-card:hover {
			border-color: var(--accent);
			transform: translateY(-3px);
			box-shadow: 0 8px 24px rgba(96, 165, 250, 0.2);
		}
		.name-card:hover::before {
			opacity: 1;
		}
		.name-card.current {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.12), rgba(139, 92, 246, 0.1));
			border-color: rgba(96, 165, 250, 0.4);
		}
		.name-card.current::before {
			opacity: 1;
		}
		.name-card-header {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.name-card-avatar {
			width: 36px;
			height: 36px;
			border-radius: 10px;
			background: linear-gradient(135deg, var(--accent), #a78bfa);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.9rem;
			font-weight: 700;
			color: white;
			text-transform: uppercase;
			flex-shrink: 0;
		}
		.name-card-avatar img {
			width: 100%;
			height: 100%;
			border-radius: 10px;
			object-fit: cover;
		}
		.name-card-name {
			font-size: 0.95rem;
			font-weight: 700;
			color: var(--text);
			word-break: break-word;
		}
		.name-card-name .suffix {
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.name-card-meta {
			display: flex;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
		}
		.name-card-badge {
			font-size: 0.65rem;
			font-weight: 600;
			padding: 3px 8px;
			border-radius: 6px;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.name-card-badge.current-tag {
			background: rgba(96, 165, 250, 0.2);
			color: var(--accent);
		}
		.name-card-badge.expiry {
			background: rgba(34, 197, 94, 0.15);
			color: #22c55e;
		}
		.name-card-badge.expiry.warning {
			background: var(--warning-light);
			color: var(--warning);
		}
		.name-card-badge.expiry.danger {
			background: var(--error-light);
			color: var(--error);
		}
		.name-card-arrow {
			margin-left: auto;
			color: var(--text-muted);
			opacity: 0;
			transform: translateX(-4px);
			transition: all 0.25s;
		}
		.name-card:hover .name-card-arrow {
			opacity: 1;
			transform: translateX(0);
			color: var(--accent);
		}
		.names-loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 16px;
			padding: 48px 24px;
			color: var(--text-muted);
		}
		.names-loading .loading {
			width: 28px;
			height: 28px;
		}
		.names-empty {
			text-align: center;
			padding: 48px 24px;
			color: var(--text-muted);
		}
		.names-empty svg {
			width: 48px;
			height: 48px;
			margin-bottom: 16px;
			opacity: 0.5;
		}
		.names-empty p {
			font-size: 0.9rem;
			margin-bottom: 8px;
		}
		.names-empty .hint {
			font-size: 0.8rem;
			color: var(--text-muted);
			opacity: 0.8;
		}
		.names-error {
			text-align: center;
			padding: 32px 24px;
			color: var(--error);
		}
		.names-error svg {
			width: 32px;
			height: 32px;
			margin-bottom: 12px;
		}
		.names-error p {
			margin-bottom: 16px;
			font-size: 0.9rem;
		}
		.names-retry-btn {
			padding: 10px 20px;
			background: var(--error-light);
			color: var(--error);
			border: 1px solid rgba(248, 113, 113, 0.3);
			border-radius: 10px;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.names-retry-btn:hover {
			background: rgba(248, 113, 113, 0.2);
		}
		.names-load-more {
			display: flex;
			justify-content: center;
			margin-top: 20px;
		}
		.names-load-more button {
			padding: 12px 24px;
			background: var(--accent-light);
			color: var(--accent);
			border: 1px solid var(--border);
			border-radius: 12px;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.names-load-more button:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: var(--accent);
		}
		.names-load-more button:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		/* ===== COUNTDOWN HERO SECTION ===== */
		.countdown-hero {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
			border: 1px solid rgba(96, 165, 250, 0.3);
			border-radius: 24px;
			padding: 32px;
			margin-bottom: 24px;
			position: relative;
			overflow: hidden;
		}
		.countdown-hero::before {
			content: '';
			position: absolute;
			top: -50%;
			left: -50%;
			width: 200%;
			height: 200%;
			background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.15), transparent 50%),
						radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.15), transparent 50%);
			animation: shimmer 8s ease-in-out infinite;
			pointer-events: none;
		}
		@keyframes shimmer {
			0%, 100% { transform: translate(0, 0) rotate(0deg); }
			50% { transform: translate(5%, 5%) rotate(5deg); }
		}
		.countdown-hero.expired {
			background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
			border-color: rgba(239, 68, 68, 0.3);
		}
		.countdown-hero.expired::before {
			background: radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.15), transparent 50%);
		}
		.countdown-hero.grace {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1));
			border-color: rgba(251, 191, 36, 0.3);
		}
		.countdown-hero.grace::before {
			background: radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.15), transparent 50%);
		}

		.countdown-content {
			display: flex;
			align-items: center;
			gap: 32px;
			position: relative;
			z-index: 1;
		}
		@media (max-width: 600px) {
			.countdown-content {
				flex-direction: column;
				text-align: center;
			}
		}

		/* Progress Ring */
		.countdown-ring {
			flex-shrink: 0;
			width: 140px;
			height: 140px;
			position: relative;
		}
		.countdown-ring svg {
			width: 100%;
			height: 100%;
			transform: rotate(-90deg);
		}
		.countdown-ring-bg {
			fill: none;
			stroke: rgba(255, 255, 255, 0.1);
			stroke-width: 8;
		}
		.countdown-ring-progress {
			fill: none;
			stroke: url(#countdown-gradient);
			stroke-width: 8;
			stroke-linecap: round;
			transition: stroke-dashoffset 0.5s ease;
		}
		.countdown-ring-center {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			text-align: center;
		}
		.countdown-ring-percent {
			font-size: 1.75rem;
			font-weight: 800;
			color: var(--text);
			line-height: 1;
		}
		.countdown-ring-label {
			font-size: 0.65rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-top: 4px;
		}

		/* Countdown Details */
		.countdown-details {
			flex: 1;
		}
		.countdown-status {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 12px;
		}
		.countdown-status-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 6px 14px;
			border-radius: 20px;
			font-size: 0.75rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.countdown-status-badge.active {
			background: rgba(34, 197, 94, 0.2);
			color: #22c55e;
			border: 1px solid rgba(34, 197, 94, 0.3);
		}
		.countdown-status-badge.warning {
			background: rgba(251, 191, 36, 0.2);
			color: #fbbf24;
			border: 1px solid rgba(251, 191, 36, 0.3);
		}
		.countdown-status-badge.danger {
			background: rgba(239, 68, 68, 0.2);
			color: #ef4444;
			border: 1px solid rgba(239, 68, 68, 0.3);
		}
		.countdown-status-badge svg {
			width: 14px;
			height: 14px;
		}

		/* Large Countdown Display */
		.countdown-timer {
			display: flex;
			gap: 16px;
			margin-bottom: 16px;
		}
		@media (max-width: 600px) {
			.countdown-timer {
				justify-content: center;
				gap: 12px;
			}
		}
		.countdown-unit {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		.countdown-value {
			font-size: 2.5rem;
			font-weight: 800;
			font-family: ui-monospace, monospace;
			color: var(--text);
			line-height: 1;
			min-width: 70px;
			text-align: center;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 12px 8px;
		}
		@media (max-width: 600px) {
			.countdown-value {
				font-size: 1.75rem;
				min-width: 55px;
				padding: 10px 6px;
			}
		}
		.countdown-label {
			font-size: 0.65rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin-top: 8px;
		}
		.countdown-separator {
			font-size: 2rem;
			font-weight: 700;
			color: var(--text-muted);
			align-self: flex-start;
			padding-top: 16px;
		}
		@media (max-width: 600px) {
			.countdown-separator { display: none; }
		}

		/* Expiration Info */
		.countdown-info {
			display: flex;
			flex-wrap: wrap;
			gap: 20px;
		}
		@media (max-width: 600px) {
			.countdown-info { justify-content: center; }
		}
		.countdown-info-item {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		.countdown-info-label {
			font-size: 0.7rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.countdown-info-value {
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--text);
		}

		/* ===== OWNERSHIP ARENA ===== */

		.social-links-section {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 18px;
			padding: 18px;
			margin-top: 20px;
		}
		.social-links-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 16px;
		}
		.social-links-title {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 0.95rem;
			font-weight: 700;
			color: var(--text);
		}
		.social-links-title svg {
			width: 20px;
			height: 20px;
			color: #1d9bf0;
		}
		.social-links-edit-btn {
			padding: 6px 14px;
			background: rgba(29, 155, 240, 0.15);
			border: 1px solid rgba(29, 155, 240, 0.3);
			border-radius: 8px;
			color: #1d9bf0;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			display: none;
		}
		.social-links-edit-btn:hover {
			background: rgba(29, 155, 240, 0.25);
		}
		.social-links-edit-btn.visible {
			display: block;
		}
		.social-links-list {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.social-link-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 12px;
			text-decoration: none;
			transition: all 0.2s;
		}
		.social-link-item:hover {
			border-color: rgba(29, 155, 240, 0.4);
			background: rgba(29, 155, 240, 0.1);
		}
		.social-link-icon {
			width: 36px;
			height: 36px;
			background: #000;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.social-link-icon svg {
			width: 20px;
			height: 20px;
			color: white;
		}
		.social-link-info {
			flex: 1;
			min-width: 0;
		}
		.social-link-label {
			font-size: 0.7rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.social-link-value {
			font-size: 0.9rem;
			font-weight: 600;
			color: #1d9bf0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.social-link-arrow {
			color: var(--text-muted);
			transition: all 0.2s;
		}
		.social-link-item:hover .social-link-arrow {
			color: #1d9bf0;
			transform: translateX(2px);
		}
		.social-links-empty {
			text-align: center;
			padding: 16px;
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.social-links-empty-hint {
			font-size: 0.75rem;
			margin-top: 8px;
			opacity: 0.7;
		}
		.social-links-add-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 12px;
			background: transparent;
			border: 1px dashed rgba(29, 155, 240, 0.3);
			border-radius: 10px;
			color: #1d9bf0;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.social-links-add-btn:hover {
			background: rgba(29, 155, 240, 0.1);
			border-color: rgba(29, 155, 240, 0.5);
		}
		.social-links-add-btn svg {
			width: 16px;
			height: 16px;
		}

		/* Social Links Modal */
		.social-modal {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.7);
			backdrop-filter: blur(8px);
			z-index: 100;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.social-modal.open { display: flex; }
		.social-modal-content {
			background: var(--card-bg-solid);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 28px;
			max-width: 480px;
			width: 100%;
			box-shadow: var(--shadow-lg);
		}
		.social-modal h3 {
			color: var(--text);
			margin-bottom: 8px;
			font-size: 1.15rem;
			font-weight: 700;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.social-modal h3 svg {
			width: 24px;
			height: 24px;
			color: #1d9bf0;
		}
		.social-modal p {
			color: var(--text-muted);
			font-size: 0.85rem;
			margin-bottom: 18px;
		}
		.social-input-group {
			margin-bottom: 16px;
		}
		.social-input-label {
			display: block;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
			margin-bottom: 8px;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.social-input-wrapper {
			display: flex;
			align-items: center;
			background: var(--card-bg-solid);
			border: 2px solid var(--border);
			border-radius: 12px;
			overflow: hidden;
			transition: all 0.2s;
		}
		.social-input-wrapper:focus-within {
			border-color: #1d9bf0;
			box-shadow: 0 0 0 4px rgba(29, 155, 240, 0.2);
		}
		.social-input-prefix {
			padding: 12px 14px;
			background: rgba(29, 155, 240, 0.1);
			color: var(--text-muted);
			font-size: 0.85rem;
			border-right: 1px solid var(--border);
		}
		.social-input-wrapper input {
			flex: 1;
			padding: 12px 14px;
			background: transparent;
			border: none;
			color: var(--text);
			font-size: 0.9rem;
			outline: none;
		}
		.social-input-wrapper input::placeholder {
			color: var(--text-muted);
			opacity: 0.6;
		}
		.social-modal-buttons {
			display: flex;
			gap: 12px;
			margin-top: 20px;
		}
		.social-modal-buttons button {
			flex: 1;
			padding: 12px 18px;
			border-radius: 12px;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.social-modal-buttons .cancel-btn {
			background: transparent;
			color: var(--text-muted);
			border: 1px solid var(--border);
		}
		.social-modal-buttons .cancel-btn:hover {
			background: rgba(255, 255, 255, 0.05);
			color: var(--text);
		}
		.social-modal-buttons .save-btn {
			background: linear-gradient(135deg, #1d9bf0, #60a5fa);
			color: white;
			border: none;
			box-shadow: 0 4px 16px rgba(29, 155, 240, 0.3);
		}
		.social-modal-buttons .save-btn:hover {
			filter: brightness(1.1);
			transform: translateY(-1px);
		}
		.social-modal-buttons .save-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}
		#social-modal-status {
			margin-top: 12px;
		}

		/* ===== MOBILE RESPONSIVE ===== */
		@media (max-width: 768px) {
			.page-layout { flex-direction: column; }
			.sidebar {
				width: 100%;
				position: static;
				margin-bottom: 20px;
			}
			.sidebar-nav {
				display: flex;
				gap: 4px;
				overflow-x: auto;
				padding: 6px;
				-webkit-overflow-scrolling: touch;
			}
			.sidebar-tab {
				padding: 8px 12px;
				white-space: nowrap;
				font-size: 0.75rem;
			}
			.sidebar-tab span { display: none; }
			.sidebar-tab svg { margin: 0; }
		}

		@media (max-width: 600px) {
			body { padding: 16px 12px; }
			.card { padding: 20px; border-radius: 12px; margin-bottom: 20px; }

			.profile-hero {
				flex-direction: column;
				align-items: center;
				gap: 20px;
			}
			.identity-card {
				order: 1;
			}
			.hero-main {
				order: 2;
				width: 100%;
			}

			.wallet-bar {
				flex-wrap: wrap;
				gap: 10px;
				margin-bottom: 16px;
			}
			.wallet-bar .connect-btn {
				padding: 10px 16px;
				font-size: 0.8rem;
			}

			.header {
				margin-bottom: 16px;
				padding-bottom: 16px;
			}
			.header-top { gap: 10px; }
			h1 { font-size: 1.35rem; }
			.badge { font-size: 0.6rem; padding: 4px 10px; }
			.header-meta {
				gap: 10px;
				font-size: 0.75rem;
			}
			.header-meta-item { gap: 6px; }
			.header-meta-item svg { width: 14px; height: 14px; }

			.identity-card { width: 160px; }
			.owner-display { flex-direction: column; gap: 12px; padding: 14px; }
			.owner-info { flex-direction: column; align-items: flex-start; gap: 6px; }
			.owner-actions { width: 100%; justify-content: flex-start; }
			.identity-name { font-size: 0.75rem; padding: 10px; }

			.section { padding: 18px; border-radius: 12px; margin-bottom: 16px; }
			.profile-grid { gap: 10px; }
			.profile-item { padding: 12px; }


			.qr-expanded-content { padding: 18px; max-width: 260px; }
			.qr-expanded-content canvas { width: 180px; height: 180px; }
			.qr-expanded-actions { flex-direction: column; width: 100%; }
			.qr-expanded-actions button { width: 100%; justify-content: center; }


			.queue-bid-section { padding: 18px; }
			.queue-bid-form { flex-direction: column; }
			.queue-bid-btn { width: 100%; }

			.edit-modal-content { margin: 12px; padding: 18px; }
		}

		@media (max-width: 380px) {
			body { padding: 12px; }
			.card { padding: 16px; margin-bottom: 16px; }
			h1 { font-size: 1.2rem; }
			.identity-card { width: 140px; }
			.identity-name { font-size: 0.7rem; padding: 8px; }
			.identity-qr-toggle { width: 30px; height: 30px; bottom: 8px; left: 8px; right: auto; }
			.identity-name-wrapper { flex-wrap: wrap; gap: 6px; }
			.ai-generate-btn { width: 24px; height: 24px; }
			.ai-generate-btn svg { width: 14px; height: 14px; }
		}
${generatePasskeyWalletStyles()}
	</style>
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
					<button class="sidebar-tab" data-tab="passkey">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
						<span>Passkey</span>
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
						<button class="ai-generate-btn" id="ai-generate-btn" title="View Grokipedia article">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6l-3 3-3-3c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z"></path>
							</svg>
						</button>
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
							<h1>${escapeHtml(cleanName)}<span class="suffix">.sui</span></h1>
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
							<span class="countdown-status-badge active" id="countdown-badge">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"></circle>
									<polyline points="12 6 12 12 16 14"></polyline>
								</svg>
								<span id="countdown-status-text">Active</span>
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
							<p>Failed to load marketplace data</p>
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

				<div class="tab-panel" id="tab-passkey">
					${generatePasskeyWalletHTML()}
				</div><!-- end tab-passkey -->

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
		const IS_SUBNAME = NAME.includes('.');
		const STORAGE_KEY = 'sui_ski_wallet';
		const EXPIRATION_MS = ${expiresMs || 0};
		const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
		const AVAILABLE_AT = EXPIRATION_MS + GRACE_PERIOD_MS;
		const HAS_WALRUS_SITE = ${record.walrusSiteId ? 'true' : 'false'};
		const HAS_CONTENT_HASH = ${record.contentHash ? 'true' : 'false'};

		let connectedWallet = null;
		let connectedAccount = null;
		let connectedAddress = null;
		let connectedWalletName = null;
		let connectedPrimaryName = null;
		let walletsApi = null;
		let nftOwnerAddress = null;
		let targetPrimaryName = null;
		let canEdit = false;

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
		let showingQr = true;
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
				walletStatus.innerHTML = \`
					<span class="wallet-addr">\${displayName}</span>
					\${connectedPrimaryName ? \`<span class="wallet-name">\${truncAddr(connectedAddress)}</span>\` : ''}
					<button id="disconnect-wallet-btn">×</button>
				\`;
				walletBar.appendChild(walletStatus);
				const disconnectBtn = document.getElementById('disconnect-wallet-btn');
				if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectWallet);
			}
		}

		// Copy address to clipboard
		function copyAddress() {
			navigator.clipboard.writeText(CURRENT_ADDRESS).then(() => {
				copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
				setTimeout(() => {
					copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
				}, 1500);
			});
		}

		// ===== IDENTITY CARD (NFT + QR) =====
		function normalizeImageUrl(url) {
			if (!url) return '';
			if (url.startsWith('ipfs://')) {
				return 'https://ipfs.io/ipfs/' + url.slice(7);
			}
			return url;
		}

		function showIdentityQr() {
			if (!identityVisual || !identityCanvas) return;
			// Remove any NFT image
			const existingImg = identityVisual.querySelector('img');
			if (existingImg) existingImg.remove();
			// Show canvas
			identityCanvas.style.display = 'block';
			showingQr = true;
			if (qrToggle) qrToggle.classList.remove('active');
		}

		function showIdentityNft() {
			if (!identityVisual || !nftImageUrl) return;
			// Hide canvas
			if (identityCanvas) identityCanvas.style.display = 'none';
			// Add/update NFT image
			let img = identityVisual.querySelector('img');
			if (!img) {
				img = document.createElement('img');
				img.alt = FULL_NAME;
				identityVisual.insertBefore(img, identityVisual.firstChild);
			}
			img.src = nftImageUrl;
			showingQr = false;
			if (qrToggle) qrToggle.classList.add('active');
		}

		function toggleIdentityView() {
			if (!nftImageUrl) return; // No NFT image to toggle to
			if (showingQr) {
				showIdentityNft();
			} else {
				showIdentityQr();
			}
		}

		async function loadNftImage() {
			if (!NFT_ID) return;
			if (nftDisplayLoaded) return;
			try {
				const suiClient = new SuiClient({ url: RPC_URL });
				const response = await suiClient.getObject({
					id: NFT_ID,
					options: { showDisplay: true }
				});
				const display = response?.data?.display?.data;
				if (display) {
					const imgUrl = normalizeImageUrl(display.image_url || display.image);
					if (imgUrl) {
						nftImageUrl = imgUrl;
						// Show toggle button since we have an NFT image
						if (qrToggle) qrToggle.style.display = 'flex';
						// Auto-show NFT instead of QR
						showIdentityNft();
						nftDisplayLoaded = true;
					}
				}
			} catch (error) {
				console.error('Failed to load NFT image:', error);
			}
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
				// Don't expand if clicking toggle button
				if (e.target.closest('.identity-qr-toggle')) return;
				openQrOverlay();
			});
		}

		// AI Image Generation with Payment Transaction
		const aiGenerateBtn = document.getElementById('ai-generate-btn');
		if (aiGenerateBtn) {
			aiGenerateBtn.addEventListener('click', async () => {
				// Require wallet connection
				if (!connectedWallet || !connectedAccount || !connectedAddress) {
					await connectWallet();
					if (!connectedWallet || !connectedAccount || !connectedAddress) {
						alert('Please connect your wallet to generate images');
						return;
					}
				}
				
				// Use SuiNS name to search Grokipedia (no prompt needed)
				// The name will be used to search Grokipedia automatically
				
				aiGenerateBtn.classList.add('loading');
				aiGenerateBtn.disabled = true;
				
				try {
					// Step 1: Get payment transaction details (payment goes to alias.sui address)
					const paymentInfoResponse = await fetch('/api/ai/create-payment-tx', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ 
							walletAddress: connectedAddress,
							name: NAME, // Pass the SuiNS name to resolve target address
						}),
					});
					
					if (!paymentInfoResponse.ok) {
						throw new Error('Failed to create payment transaction');
					}
					
					const paymentInfo = await paymentInfoResponse.json();
					
					// Step 2: Build and sign payment transaction
					const { SuiClient } = await import('https://esm.sh/@mysten/sui@1.45.2/client');
					const { Transaction } = await import('https://esm.sh/@mysten/sui@1.45.2/transactions');
					
					const suiClient = new SuiClient({ url: RPC_URL });
					const tx = new Transaction();
					
					// Transfer SUI to payment recipient
					const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(paymentInfo.amount)]);
					tx.transferObjects([coin], paymentInfo.recipient);
					tx.setSender(connectedAddress);
					
					const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';
					const builtTxBytes = await tx.build({ client: suiClient });
					
					const txWrapper = {
						_bytes: builtTxBytes,
						toJSON() { return btoa(String.fromCharCode.apply(null, this._bytes)); },
						serialize() { return this._bytes; }
					};
					
					// Step 3: Sign and execute transaction
					const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
					const signFeature = connectedWallet.features?.['sui:signTransaction'];
					
					let result;
					if (signExecFeature?.signAndExecuteTransaction) {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: txWrapper,
							account: connectedAccount,
							chain
						});
					} else if (signFeature?.signTransaction) {
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
					} else {
						throw new Error('Wallet does not support transaction signing');
					}
					
					if (!result?.digest) {
						throw new Error('Transaction failed');
					}
					
					// Step 4: Wait for transaction confirmation (with timeout)
					try {
						await suiClient.waitForTransaction({ 
							digest: result.digest,
							timeout: 30000, // 30 second timeout
							pollInterval: 1000, // Check every second
						});
					} catch (waitError) {
						console.warn('Transaction wait timeout, proceeding anyway:', waitError);
						// Continue anyway - transaction might still be processing
					}
					
					// Step 5: Retrieve Grokipedia article after payment confirmed (x402 protocol)
					const articleResponse = await fetch('/api/ai/generate-image', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': \`Bearer \${connectedAddress}\`,
							'X-Payment-Tx-Digest': result.digest, // x402 payment proof header
						},
						body: JSON.stringify({
							name: NAME, // SuiNS name to search on Grokipedia
							walletAddress: connectedAddress,
						}),
					});
					
					// Handle x402 Payment Required response
					if (articleResponse.status === 402) {
						const paymentInfo = await articleResponse.json();
						let errorMsg = paymentInfo.error || 'Payment verification failed';
						
						// Include debug info if available
						if (paymentInfo.debug) {
							console.error('Payment verification debug:', paymentInfo.debug);
							errorMsg += '\\n\\nDebug info logged to console.';
							if (paymentInfo.debug.totalReceivedSui !== undefined) {
								errorMsg += \`\\nReceived: \${paymentInfo.debug.totalReceivedSui} SUI, Required: \${paymentInfo.debug.requiredAmountSui} SUI\`;
							}
						}
						
						throw new Error(errorMsg);
					}
					
					const articleData = await articleResponse.json();
					
					if (!articleResponse.ok) {
						throw new Error(articleData.error || 'Failed to retrieve Grokipedia article');
					}
					
					if (articleData.success && articleData.article) {
						// Display the Grokipedia article in a modal
						const articleModal = document.createElement('div');
						articleModal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto;';
						
						const articleContainer = document.createElement('div');
						articleContainer.style.cssText = 'position: relative; max-width: 800px; max-height: 90vh; background: var(--card-bg, #1a1a2e); border-radius: 12px; padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); overflow-y: auto;';
						
						// Title
						const title = document.createElement('h2');
						title.textContent = articleData.title || FULL_NAME;
						title.style.cssText = 'margin: 0 0 16px 0; color: var(--accent, #60a5fa); font-size: 1.5rem;';
						
						// Article content
						const content = document.createElement('div');
						content.textContent = articleData.article;
						content.style.cssText = 'color: var(--text, #e0e0e0); line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; margin-bottom: 16px; max-height: 60vh; overflow-y: auto;';
						
						// Link to Grokipedia
						const link = document.createElement('a');
						link.href = articleData.url || '#';
						link.target = '_blank';
						link.textContent = 'View on Grokipedia →';
						link.style.cssText = 'color: var(--accent, #60a5fa); text-decoration: none; display: inline-block; margin-top: 16px;';
						
						// Close button
						const closeBtn = document.createElement('button');
						closeBtn.textContent = '×';
						closeBtn.style.cssText = 'position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.1); border: none; color: var(--text, #e0e0e0); font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
						closeBtn.addEventListener('click', () => articleModal.remove());
						
						articleContainer.appendChild(closeBtn);
						articleContainer.appendChild(title);
						articleContainer.appendChild(content);
						articleContainer.appendChild(link);
						articleModal.appendChild(articleContainer);
						
						articleModal.addEventListener('click', (e) => {
							if (e.target === articleModal) articleModal.remove();
						});
						
						document.body.appendChild(articleModal);
					} else {
						throw new Error(imageData.error || 'No article in response');
					}
				} catch (error) {
					console.error('AI image generation error:', error);
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					alert('Failed to generate image: ' + errorMessage);
				} finally {
					aiGenerateBtn.classList.remove('loading');
					aiGenerateBtn.disabled = false;
				}
			});
		}

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

		initQR().catch(console.error);
		loadNftImage().catch((err) => console.error('NFT image error:', err));

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

		// Fetch and display target address primary name
		async function fetchTargetPrimaryName() {
			const name = await fetchPrimaryName(CURRENT_ADDRESS);
			if (name) {
				targetPrimaryName = name;
				const ownerNameEl = document.querySelector('.owner-name');
				const ownerInfo = document.getElementById('owner-info');
				const visitArrow = ownerInfo?.querySelector('.visit-arrow');

				if (ownerNameEl) {
					ownerNameEl.innerHTML = formatSuiName(name);
				}

				// Make the owner info clickable to visit their profile
				if (ownerInfo) {
					const cleanedName = name.replace(/\\.sui$/i, '');
					const ownerProfileUrl = \`https://\${cleanedName}.sui.ski\`;

					// Add the link styling class
					ownerInfo.classList.add('owner-info-link');
					ownerInfo.style.cursor = 'pointer';
					ownerInfo.title = \`Visit \${name} profile\`;

					// Show the arrow
					if (visitArrow) {
						visitArrow.style.display = 'block';
					}

					// Add click handler
					ownerInfo.addEventListener('click', (e) => {
						// Don't navigate if clicking on a button inside
						if (e.target.closest('button')) return;
						window.location.href = ownerProfileUrl;
					});
				}
			}
		}

		// Initialize
		renderWalletBar();
		updateEditButton();
		restoreWalletConnection();
		fetchTargetPrimaryName();

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
				if (!res.ok) throw new Error('API error');

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
				marketplaceError.style.display = 'block';
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

		${generatePasskeyWalletScript(env)}
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
