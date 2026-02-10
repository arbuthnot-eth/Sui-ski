import type { Env } from '../types'
import { generateLogoSvg } from '../utils/og-image'
import { generateSharedWalletMountJs } from '../utils/shared-wallet-js'
import { renderSocialMeta } from '../utils/social'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'

export function generateDashboardPage(env: Env): string {
	const network = env.SUI_NETWORK || 'mainnet'
	const apiBase = network === 'mainnet' ? 'https://sui.ski' : `https://t.sui.ski`
	const profileBase = network === 'mainnet' ? 'sui.ski' : 't.sui.ski'

	const socialMeta = renderSocialMeta({
		title: 'My Names — sui.ski',
		description:
			'View and manage all your SuiNS names in one place. Renew, register, list, and bid with ease.',
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
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

		* { margin: 0; padding: 0; box-sizing: border-box; }

		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: #000;
			color: #e4e4e7;
			min-height: 100vh;
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

		.top-bar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 24px;
			position: relative;
			z-index: 100;
		}
		.top-bar-left {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.top-bar-right {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.logo-btn {
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
		.logo-btn:hover {
			border-color: rgba(96,165,250,0.4);
			box-shadow: 0 4px 24px rgba(0,0,0,0.6), 0 0 25px rgba(96,165,250,0.15);
		}
		.logo-btn svg { width: 28px; height: 28px; }

		.search-box {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 10px 16px;
			background: rgba(12,12,18,0.8);
			border: 1px solid rgba(255,255,255,0.06);
			border-radius: 12px;
			min-width: 280px;
		}
		.search-box svg {
			width: 18px;
			height: 18px;
			color: #52525b;
		}
		.search-box input {
			background: transparent;
			border: none;
			color: #e4e4e7;
			font-size: 0.9rem;
			outline: none;
			width: 100%;
		}
		.search-box input::placeholder {
			color: #52525b;
		}

		.action-btn {
			width: 44px;
			height: 44px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: #0c0c12;
			border: 1px solid rgba(255,255,255,0.06);
			border-radius: 12px;
			color: #71717a;
			cursor: pointer;
			transition: all 0.2s ease;
			text-decoration: none;
		}
		.action-btn:hover {
			border-color: rgba(96,165,250,0.4);
			color: #e4e4e7;
		}
		.action-btn svg { width: 20px; height: 20px; }

		.ski-badge {
			padding: 8px 16px;
			background: rgba(96,165,250,0.12);
			border: 1px solid rgba(96,165,250,0.3);
			border-radius: 12px;
			color: #60a5fa;
			font-size: 0.85rem;
			font-weight: 700;
			letter-spacing: 0.05em;
			text-decoration: none;
			transition: all 0.2s ease;
		}
		.ski-badge:hover {
			background: rgba(96,165,250,0.2);
			border-color: rgba(96,165,250,0.5);
		}

		.main-container {
			display: grid;
			grid-template-columns: 320px 1fr;
			gap: 24px;
			padding: 0 24px 24px;
			max-width: 1400px;
			margin: 0 auto;
			position: relative;
			z-index: 1;
		}

		.sidebar {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.name-card-large {
			background: linear-gradient(145deg, rgba(20,20,35,0.95) 0%, rgba(12,12,25,0.95) 100%);
			border: 1px solid rgba(255,255,255,0.08);
			border-radius: 20px;
			padding: 24px;
			position: relative;
			overflow: hidden;
		}
		.name-card-large::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.3) 50%, transparent 100%);
		}
		.name-card-header {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 16px;
		}
		.name-card-header svg {
			width: 24px;
			height: 24px;
			filter: drop-shadow(0 0 8px rgba(96,165,250,0.3));
		}
		.name-card-title {
			font-size: 1.5rem;
			font-weight: 800;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.qr-section {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 12px;
			padding: 20px;
			background: rgba(0,0,0,0.3);
			border-radius: 16px;
			margin-bottom: 16px;
		}
		.qr-code {
			width: 140px;
			height: 140px;
			background: white;
			border-radius: 12px;
			padding: 8px;
		}
		.qr-label {
			font-size: 0.75rem;
			color: #52525b;
			font-family: monospace;
		}

		.address-row {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 16px;
			background: rgba(96,165,250,0.08);
			border: 1px solid rgba(96,165,250,0.2);
			border-radius: 12px;
			margin-bottom: 12px;
		}
		.address-row svg {
			width: 16px;
			height: 16px;
			color: #60a5fa;
		}
		.address-text {
			font-family: monospace;
			font-size: 0.85rem;
			color: #e4e4e7;
			flex: 1;
		}
		.address-copy {
			width: 28px;
			height: 28px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: transparent;
			border: none;
			color: #71717a;
			cursor: pointer;
			border-radius: 6px;
			transition: all 0.2s;
		}
		.address-copy:hover {
			background: rgba(255,255,255,0.1);
			color: #e4e4e7;
		}
		.address-copy svg { width: 14px; height: 14px; }

		.action-row {
			display: flex;
			gap: 8px;
			margin-bottom: 12px;
		}
		.action-row-btn {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			padding: 10px 12px;
			background: linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.15));
			border: 1px solid rgba(34,197,94,0.3);
			border-radius: 10px;
			color: #4ade80;
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			text-decoration: none;
		}
		.action-row-btn:hover {
			background: linear-gradient(135deg, rgba(34,197,94,0.25), rgba(22,163,74,0.25));
			border-color: rgba(34,197,94,0.5);
		}
		.action-row-btn.secondary {
			background: rgba(255,255,255,0.05);
			border-color: rgba(255,255,255,0.1);
			color: #a1a1aa;
		}
		.action-row-btn.secondary:hover {
			background: rgba(255,255,255,0.1);
			border-color: rgba(255,255,255,0.2);
		}
		.action-row-btn svg { width: 14px; height: 14px; }

		.link-row {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 12px;
			background: rgba(255,255,255,0.03);
			border-radius: 10px;
			font-size: 0.8rem;
			color: #71717a;
			text-decoration: none;
			transition: all 0.2s;
			margin-bottom: 8px;
		}
		.link-row:hover {
			background: rgba(255,255,255,0.06);
			color: #e4e4e7;
		}
		.link-row svg { width: 14px; height: 14px; }

		.renewal-panel {
			background: linear-gradient(145deg, rgba(20,35,25,0.95) 0%, rgba(12,25,18,0.95) 100%);
			border: 1px solid rgba(34,197,94,0.2);
			border-radius: 16px;
			padding: 20px;
		}
		.renewal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 16px;
		}
		.renewal-title {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 1rem;
			font-weight: 700;
			color: #4ade80;
		}
		.renewal-title svg { width: 18px; height: 18px; }
		.discount-badge {
			padding: 4px 10px;
			background: rgba(34,197,94,0.2);
			border: 1px solid rgba(34,197,94,0.4);
			border-radius: 20px;
			font-size: 0.75rem;
			font-weight: 700;
			color: #4ade80;
		}

		.renewal-info {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px 0;
			border-bottom: 1px solid rgba(255,255,255,0.05);
		}
		.renewal-info:last-child {
			border-bottom: none;
		}
		.renewal-label {
			font-size: 0.8rem;
			color: #71717a;
		}
		.renewal-value {
			font-size: 0.9rem;
			font-weight: 600;
			color: #e4e4e7;
		}
		.renewal-value.green {
			color: #4ade80;
		}

		.duration-selector {
			display: flex;
			gap: 6px;
			margin: 12px 0;
		}
		.duration-btn {
			flex: 1;
			padding: 8px;
			background: rgba(255,255,255,0.05);
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 8px;
			color: #71717a;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.duration-btn:hover {
			background: rgba(255,255,255,0.1);
			border-color: rgba(255,255,255,0.2);
		}
		.duration-btn.active {
			background: rgba(34,197,94,0.15);
			border-color: rgba(34,197,94,0.4);
			color: #4ade80;
		}

		.renewal-btn {
			width: 100%;
			padding: 14px;
			background: linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.2));
			border: 1px solid rgba(34,197,94,0.4);
			border-radius: 12px;
			color: #4ade80;
			font-size: 0.9rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			margin-top: 12px;
		}
		.renewal-btn:hover:not(:disabled) {
			background: linear-gradient(135deg, rgba(34,197,94,0.3), rgba(22,163,74,0.3));
			border-color: rgba(34,197,94,0.6);
			box-shadow: 0 0 20px rgba(34,197,94,0.15);
		}
		.renewal-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.marketplace-panel {
			background: linear-gradient(145deg, rgba(35,30,20,0.95) 0%, rgba(25,20,12,0.95) 100%);
			border: 1px solid rgba(251,191,36,0.2);
			border-radius: 16px;
			padding: 20px;
		}
		.marketplace-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 16px;
		}
		.marketplace-title {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 1rem;
			font-weight: 700;
			color: #fbbf24;
		}
		.marketplace-title svg { width: 18px; height: 18px; }
		.tradeport-badge {
			padding: 4px 10px;
			background: rgba(251,191,36,0.15);
			border: 1px solid rgba(251,191,36,0.3);
			border-radius: 20px;
			font-size: 0.7rem;
			font-weight: 700;
			color: #fbbf24;
		}

		.price-input-row {
			display: flex;
			align-items: center;
			gap: 8px;
			margin: 12px 0;
		}
		.price-input {
			flex: 1;
			padding: 10px 12px;
			background: rgba(255,255,255,0.05);
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 8px;
			color: #e4e4e7;
			font-size: 0.9rem;
			outline: none;
		}
		.price-input:focus {
			border-color: rgba(251,191,36,0.4);
		}
		.price-unit {
			font-size: 0.8rem;
			color: #71717a;
			font-weight: 600;
		}

		.marketplace-btn {
			width: 100%;
			padding: 14px;
			background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.15));
			border: 1px solid rgba(251,191,36,0.3);
			border-radius: 12px;
			color: #fbbf24;
			font-size: 0.9rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
		}
		.marketplace-btn:hover:not(:disabled) {
			background: linear-gradient(135deg, rgba(251,191,36,0.25), rgba(217,119,6,0.25));
			border-color: rgba(251,191,36,0.5);
			box-shadow: 0 0 20px rgba(251,191,36,0.15);
		}
		.marketplace-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.content-area {
			display: flex;
			flex-direction: column;
			gap: 24px;
		}

		.section-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 4px;
		}
		.section-title {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 1.1rem;
			font-weight: 700;
			color: #e4e4e7;
		}
		.section-title svg {
			width: 20px;
			height: 20px;
			color: #60a5fa;
		}
		.section-meta {
			display: flex;
			align-items: center;
			gap: 16px;
		}
		.section-count {
			padding: 6px 12px;
			background: rgba(96,165,250,0.1);
			border: 1px solid rgba(96,165,250,0.2);
			border-radius: 20px;
			font-size: 0.75rem;
			font-weight: 700;
			color: #60a5fa;
		}
		.view-toggle {
			display: flex;
			gap: 4px;
		}
		.view-btn {
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(255,255,255,0.05);
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 8px;
			color: #71717a;
			cursor: pointer;
			transition: all 0.2s;
		}
		.view-btn:hover, .view-btn.active {
			background: rgba(96,165,250,0.15);
			border-color: rgba(96,165,250,0.3);
			color: #60a5fa;
		}
		.view-btn svg { width: 16px; height: 16px; }

		.filter-bar {
			display: flex;
			gap: 12px;
			padding: 12px 16px;
			background: rgba(12,12,18,0.8);
			border: 1px solid rgba(255,255,255,0.06);
			border-radius: 12px;
		}
		.filter-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 6px 12px;
			background: transparent;
			border: 1px solid transparent;
			border-radius: 8px;
			color: #71717a;
			font-size: 0.8rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}
		.filter-btn:hover, .filter-btn.active {
			background: rgba(96,165,250,0.1);
			border-color: rgba(96,165,250,0.2);
			color: #60a5fa;
		}
		.filter-btn svg { width: 14px; height: 14px; }
		.filter-search {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.filter-search input {
			flex: 1;
			background: transparent;
			border: none;
			color: #e4e4e7;
			font-size: 0.9rem;
			outline: none;
		}
		.filter-search input::placeholder {
			color: #52525b;
		}
		.clear-btn {
			padding: 6px 12px;
			background: transparent;
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 8px;
			color: #71717a;
			font-size: 0.75rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}
		.clear-btn:hover {
			border-color: rgba(255,255,255,0.2);
			color: #e4e4e7;
		}

		.names-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 12px;
		}

		.name-chip {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 14px;
			background: rgba(12,12,18,0.8);
			border: 1px solid rgba(255,255,255,0.06);
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.2s;
			text-decoration: none;
		}
		.name-chip:hover {
			border-color: rgba(96,165,250,0.3);
			background: rgba(96,165,250,0.05);
			transform: translateY(-1px);
		}
		.name-chip-icon {
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(96,165,250,0.1);
			border-radius: 8px;
		}
		.name-chip-icon svg {
			width: 16px;
			height: 16px;
			color: #60a5fa;
		}
		.name-chip-info {
			flex: 1;
			min-width: 0;
		}
		.name-chip-name {
			font-size: 0.9rem;
			font-weight: 600;
			color: #e4e4e7;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.name-chip-meta {
			font-size: 0.7rem;
			color: #52525b;
			margin-top: 2px;
		}
		.name-chip-badge {
			padding: 3px 8px;
			border-radius: 6px;
			font-size: 0.65rem;
			font-weight: 700;
		}
		.badge-expiry {
			background: rgba(96,165,250,0.15);
			color: #60a5fa;
		}
		.badge-expiry.warning {
			background: rgba(251,191,36,0.15);
			color: #fbbf24;
		}
		.badge-expiry.danger {
			background: rgba(248,113,113,0.15);
			color: #f87171;
		}
		.badge-expired {
			background: rgba(248,113,113,0.2);
			color: #f87171;
		}
		.badge-listed {
			background: rgba(167,139,250,0.15);
			color: #c4b5fd;
		}

		.empty-state {
			text-align: center;
			padding: 60px 20px;
			background: rgba(12,12,18,0.5);
			border: 1px dashed rgba(255,255,255,0.1);
			border-radius: 16px;
		}
		.empty-state svg {
			width: 48px;
			height: 48px;
			color: #52525b;
			margin-bottom: 16px;
		}
		.empty-state h3 {
			font-size: 1.1rem;
			font-weight: 600;
			color: #e4e4e7;
			margin-bottom: 8px;
		}
		.empty-state p {
			color: #71717a;
			font-size: 0.9rem;
			margin-bottom: 20px;
		}
		.connect-wallet-btn {
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
		.connect-wallet-btn:hover {
			background: linear-gradient(135deg, rgba(96,165,250,0.3), rgba(139,92,246,0.3));
			border-color: rgba(96,165,250,0.5);
			box-shadow: 0 0 30px rgba(96,165,250,0.15);
		}
		.connect-wallet-btn svg { width: 18px; height: 18px; }

		.loading-state {
			text-align: center;
			padding: 60px 20px;
		}
		.spinner {
			width: 40px;
			height: 40px;
			border: 3px solid rgba(96,165,250,0.15);
			border-top-color: #60a5fa;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
			margin: 0 auto 16px;
		}
		@keyframes spin { to { transform: rotate(360deg); } }
		.loading-state p { color: #71717a; font-size: 0.95rem; }

		.wallet-widget {
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 9999;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.wallet-profile-btn {
			width: 36px;
			height: 36px;
			border-radius: 10px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(96, 165, 250, 0.35);
			cursor: pointer;
			transition: all 0.2s ease;
			padding: 0;
		}
		.wallet-profile-btn svg {
			width: 18px;
			height: 18px;
		}
		.wallet-profile-btn:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: rgba(96, 165, 250, 0.55);
			transform: translateY(-1px);
		}

		.tx-modal-overlay {
			display: none;
			position: fixed;
			inset: 0;
			background: rgba(0,0,0,0.8);
			backdrop-filter: blur(4px);
			z-index: 10000;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.tx-modal-overlay.show {
			display: flex;
		}
		.tx-modal {
			background: #0c0c12;
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 20px;
			padding: 24px;
			max-width: 420px;
			width: 100%;
			box-shadow: 0 24px 48px rgba(0,0,0,0.5);
		}
		.tx-modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20px;
		}
		.tx-modal-title {
			font-size: 1.1rem;
			font-weight: 700;
			color: #e4e4e7;
		}
		.tx-modal-close {
			width: 32px;
			height: 32px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: transparent;
			border: none;
			color: #71717a;
			cursor: pointer;
			border-radius: 8px;
			transition: all 0.2s;
		}
		.tx-modal-close:hover {
			background: rgba(255,255,255,0.1);
			color: #e4e4e7;
		}
		.tx-modal-close svg { width: 18px; height: 18px; }

		.tx-status {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 16px;
			padding: 20px;
		}
		.tx-status-icon {
			width: 56px;
			height: 56px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(96,165,250,0.1);
			border-radius: 50%;
		}
		.tx-status-icon.success {
			background: rgba(34,197,94,0.15);
		}
		.tx-status-icon.error {
			background: rgba(248,113,113,0.15);
		}
		.tx-status-icon svg { width: 28px; height: 28px; color: #60a5fa; }
		.tx-status-icon.success svg { color: #4ade80; }
		.tx-status-icon.error svg { color: #f87171; }
		.tx-status-text {
			font-size: 0.95rem;
			color: #e4e4e7;
			text-align: center;
		}
		.tx-status-hash {
			font-family: monospace;
			font-size: 0.8rem;
			color: #60a5fa;
			background: rgba(96,165,250,0.1);
			padding: 6px 12px;
			border-radius: 8px;
			word-break: break-all;
		}

		@media (max-width: 900px) {
			.main-container {
				grid-template-columns: 1fr;
			}
			.sidebar {
				order: 2;
			}
			.content-area {
				order: 1;
			}
		}
		@media (max-width: 640px) {
			.top-bar {
				padding: 12px 16px;
			}
			.search-box {
				min-width: auto;
				flex: 1;
			}
			.main-container {
				padding: 0 16px 16px;
				gap: 16px;
			}
			.names-grid {
				grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			}
		}

		${generateWalletUiCss()}
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
	<div class="top-bar">
		<div class="top-bar-left">
			<a href="https://sui.ski" class="logo-btn" title="sui.ski home">
				${generateLogoSvg(28)}
			</a>
			<div class="search-box">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
				<input type="text" placeholder="Search..." id="search-input">
			</div>
		</div>
		<div class="top-bar-right">
			<a href="https://sui.ski/in" class="action-btn" title="Sui Key-In">
				${generateLogoSvg(20)}
			</a>
			<a href="https://sui.ski" class="action-btn" title="Go to sui.ski">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
			</a>
			<a href="https://my.sui.ski" class="ski-badge">SKI</a>
		</div>
	</div>

	<div class="wallet-widget" id="wallet-widget">
		<button class="wallet-profile-btn" id="wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile">
			${generateLogoSvg(18)}
		</button>
		<div id="wk-widget"></div>
	</div>

	<div class="main-container">
		<div class="sidebar">
			<div class="name-card-large">
				<div class="name-card-header">
					${generateLogoSvg(24)}
					<div class="name-card-title" id="primary-name">Connect Wallet</div>
				</div>
				
				<div class="qr-section" id="qr-section" style="display:none">
					<div class="qr-code" id="qr-code"></div>
					<div class="qr-label" id="qr-label">Scan to send</div>
				</div>

				<div class="address-row" id="address-row" style="display:none">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
					<div class="address-text" id="wallet-address">0x...</div>
					<button class="address-copy" id="copy-address" title="Copy address">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
					</button>
				</div>

				<div class="action-row" id="action-row" style="display:none">
					<button class="action-row-btn" id="send-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
						Send
					</button>
					<a class="action-row-btn secondary" id="portfolio-btn" href="#" target="_blank">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
						Portfolio
					</a>
				</div>

				<div id="links-section" style="display:none">
					<a class="link-row" id="profile-link" href="#" target="_blank">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
						<span id="profile-link-text">brando.sui.ski</span>
					</a>
					<a class="link-row" id="nft-link" href="#" target="_blank">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
						View NFT
					</a>
				</div>

				<div class="empty-state" id="connect-cta">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
						<line x1="1" y1="10" x2="23" y2="10"></line>
					</svg>
					<h3>No Wallet Connected</h3>
					<p>Connect your wallet to view and manage your SuiNS names</p>
					<button class="connect-wallet-btn" id="connect-btn">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
							<line x1="1" y1="10" x2="23" y2="10"></line>
						</svg>
						Connect Wallet
					</button>
				</div>
			</div>

			<div class="renewal-panel" id="renewal-panel" style="display:none">
				<div class="renewal-header">
					<div class="renewal-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
						Renewal
					</div>
					<div class="discount-badge" id="discount-badge">-24%</div>
				</div>
				<div class="renewal-info">
					<span class="renewal-label">Current expiry</span>
					<span class="renewal-value" id="current-expiry">Sep 16, 2026</span>
				</div>
				<div class="duration-selector">
					<button class="duration-btn active" data-years="1">1 yr</button>
					<button class="duration-btn" data-years="2">2 yr</button>
					<button class="duration-btn" data-years="3">3 yr</button>
					<button class="duration-btn" data-years="5">5 yr</button>
				</div>
				<div class="renewal-info">
					<span class="renewal-label">New expiry</span>
					<span class="renewal-value green" id="new-expiry">Sep 16, 2027</span>
				</div>
				<div class="renewal-info">
					<span class="renewal-label">Price</span>
					<span class="renewal-value green" id="renewal-price">3.95 SUI</span>
				</div>
				<button class="renewal-btn" id="renew-btn">Connect Wallet to Renew</button>
			</div>

			<div class="marketplace-panel" id="marketplace-panel" style="display:none">
				<div class="marketplace-header">
					<div class="marketplace-title">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
						Marketplace
					</div>
					<div class="tradeport-badge">Tradeport</div>
				</div>
				<div class="price-input-row">
					<input type="number" class="price-input" id="list-price" placeholder="0.00" step="0.01" min="0">
					<span class="price-unit">SUI</span>
				</div>
				<button class="marketplace-btn" id="list-btn">Connect Wallet to List</button>
				<button class="marketplace-btn" id="bid-btn" style="margin-top:8px;background:rgba(96,165,250,0.1);border-color:rgba(96,165,250,0.2);color:#60a5fa;">Connect Wallet to Bid</button>
			</div>
		</div>

		<div class="content-area">
			<div class="section-header">
				<div class="section-title">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L22 12L12 22L2 12Z" fill="rgba(96,165,250,0.2)" stroke="#60a5fa" stroke-width="2"/></svg>
					Linked Names
				</div>
				<div class="section-meta">
					<div class="view-toggle">
						<button class="view-btn active" data-view="grid" title="Grid view">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
						</button>
						<button class="view-btn" data-view="list" title="List view">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
						</button>
					</div>
					<div class="section-count" id="name-count">0 names</div>
				</div>
			</div>

			<div class="filter-bar">
				<button class="filter-btn active" data-filter="all">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
					All
				</button>
				<button class="filter-btn" data-filter="expiring">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
					Expiring
				</button>
				<button class="filter-btn" data-filter="expired">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
					Expired
				</button>
				<button class="filter-btn" data-filter="listed">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
					Listed
				</button>
				<div class="filter-search">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:#52525b;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
					<input type="text" id="filter-input" placeholder="Filter names (partial or fuzzy)...">
				</div>
				<button class="clear-btn" id="clear-filter">Clear</button>
			</div>

			<div class="loading-state" id="loading-state">
				<div class="spinner"></div>
				<p>Loading your names...</p>
			</div>

			<div class="names-grid" id="names-grid" style="display:none"></div>

			<div class="empty-state" id="empty-names" style="display:none">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="15" y1="9" x2="9" y2="15"></line>
					<line x1="9" y1="9" x2="15" y2="15"></line>
				</svg>
				<h3>No Names Found</h3>
				<p>This wallet doesn't own any SuiNS names yet.</p>
				<a href="https://sui.ski" class="connect-wallet-btn" style="text-decoration:none">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
					</svg>
					Register a Name
				</a>
			</div>
		</div>
	</div>

	<div id="wk-modal"></div>

	<div class="tx-modal-overlay" id="tx-modal">
		<div class="tx-modal">
			<div class="tx-modal-header">
				<div class="tx-modal-title" id="tx-title">Transaction</div>
				<button class="tx-modal-close" id="tx-close">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>
			<div class="tx-status" id="tx-status">
				<div class="tx-status-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
				</div>
				<div class="tx-status-text" id="tx-message">Preparing transaction...</div>
				<div class="tx-status-hash" id="tx-hash" style="display:none"></div>
			</div>
		</div>
	</div>

	<script type="module">
		let getWallets, getJsonRpcFullnodeUrl, SuiJsonRpcClient, Transaction, SuinsClient, SuinsTransaction;
		{
			const pickExport = (mod, name) => {
				if (!mod || typeof mod !== 'object') return undefined;
				if (name in mod) return mod[name];
				if (mod.default && typeof mod.default === 'object' && name in mod.default) {
					return mod.default[name];
				}
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
			]);
			if (results[0].status === 'fulfilled') ({ getWallets } = results[0].value);
			if (results[1].status === 'fulfilled') ({ getJsonRpcFullnodeUrl, SuiJsonRpcClient } = results[1].value);
			if (results[2].status === 'fulfilled') ({ Transaction } = results[2].value);
			if (results[3].status === 'fulfilled') {
				const suinsModule = results[3].value;
				SuinsClient = pickExport(suinsModule, 'SuinsClient');
				SuinsTransaction = pickExport(suinsModule, 'SuinsTransaction');
			}
		}

		${generateWalletSessionJs()}
		${generateWalletKitJs({ network, autoConnect: true })}
		${generateWalletTxJs()}
		${generateWalletUiJs({ showPrimaryName: true, onConnect: 'onWalletConnected', onDisconnect: 'onWalletDisconnected' })}

		const API_BASE = ${JSON.stringify(apiBase)};
		const PROFILE_BASE = ${JSON.stringify(profileBase)};
		const TRADEPORT_URL = 'https://www.tradeport.xyz/sui/collection/suins';
		const RPC_URL = ${JSON.stringify(env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443')};

		let cachedNames = [];
		let selectedYears = 1;
		let selectedName = null;
		let currentFilter = 'all';
		let searchQuery = '';

		const loadingState = document.getElementById('loading-state');
		const namesGrid = document.getElementById('names-grid');
		const emptyNames = document.getElementById('empty-names');
		const nameCount = document.getElementById('name-count');
		const connectCta = document.getElementById('connect-cta');
		const qrSection = document.getElementById('qr-section');
		const addressRow = document.getElementById('address-row');
		const actionRow = document.getElementById('action-row');
		const linksSection = document.getElementById('links-section');
		const renewalPanel = document.getElementById('renewal-panel');
		const marketplacePanel = document.getElementById('marketplace-panel');
		const primaryNameEl = document.getElementById('primary-name');
		const walletAddressEl = document.getElementById('wallet-address');

		function truncAddr(addr) {
			if (!addr || addr.length < 12) return addr || '';
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		function formatExpiry(days) {
			if (days < 0) return 'Expired';
			if (days < 30) return days + 'D';
			if (days < 365) return Math.floor(days / 30) + 'mo';
			return Math.floor(days / 365) + 'yr';
		}

		function getExpiryClass(days) {
			if (days < 0) return 'badge-expired';
			if (days < 30) return 'badge-expiry danger';
			if (days < 90) return 'badge-expiry warning';
			return 'badge-expiry';
		}

		function renderNameChip(nameData) {
			const cleanName = nameData.name.replace(/\\.sui$/i, '');
			const daysLeft = nameData.expirationMs ? Math.floor((nameData.expirationMs - Date.now()) / 86400000) : 999;
			const expiryText = formatExpiry(daysLeft);
			const expiryClass = getExpiryClass(daysLeft);
			const isListed = nameData.listings && nameData.listings.length > 0;
			const badgeText = isListed ? 'Listed' : expiryText;
			const badgeClass = isListed ? 'badge-listed' : expiryClass;
			const displayName = cleanName.length > 15 ? cleanName.slice(0, 12) + '...' : cleanName;

			return \`<a class="name-chip" href="https://\${encodeURIComponent(cleanName)}.\${PROFILE_BASE}" target="_blank" data-name="\${cleanName}" data-expiry="\${daysLeft}" data-listed="\${isListed ? 'true' : 'false'}">
				<div class="name-chip-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
				</div>
				<div class="name-chip-info">
					<div class="name-chip-name">\${displayName}.sui</div>
					<div class="name-chip-meta">\${isListed ? 'On sale' : (daysLeft < 0 ? 'Expired' : 'Active')}</div>
				</div>
				<div class="name-chip-badge \${badgeClass}">\${badgeText}</div>
			</a>\`;
		}

		function filterNames() {
			let filtered = cachedNames;

			if (currentFilter === 'expiring') {
				filtered = filtered.filter(n => {
					const days = n.expirationMs ? Math.floor((n.expirationMs - Date.now()) / 86400000) : 999;
					return days >= 0 && days < 90;
				});
			} else if (currentFilter === 'expired') {
				filtered = filtered.filter(n => {
					const days = n.expirationMs ? Math.floor((n.expirationMs - Date.now()) / 86400000) : 999;
					return days < 0;
				});
			} else if (currentFilter === 'listed') {
				filtered = filtered.filter(n => n.listings && n.listings.length > 0);
			}

			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				filtered = filtered.filter(n => n.name.toLowerCase().includes(q));
			}

			return filtered;
		}

		function renderNames() {
			const filtered = filterNames();
			nameCount.textContent = filtered.length + ' name' + (filtered.length !== 1 ? 's' : '');

			if (filtered.length === 0) {
				namesGrid.style.display = 'none';
				emptyNames.style.display = '';
				return;
			}

			namesGrid.style.display = 'grid';
			emptyNames.style.display = 'none';
			namesGrid.innerHTML = filtered.map(renderNameChip).join('');

			document.querySelectorAll('.name-chip').forEach(chip => {
				chip.addEventListener('click', (e) => {
					e.preventDefault();
					const name = chip.dataset.name;
					selectName(name);
				});
			});
		}

		function isWalletActive() {
			const status = SuiWalletKit.$connection.value.status;
			return status === 'connected' || status === 'session';
		}

		function selectName(name) {
			selectedName = cachedNames.find(n => n.name.replace(/\\.sui$/i, '') === name);
			if (!selectedName) return;

			const cleanName = name;
			const daysLeft = selectedName.expirationMs ? Math.floor((selectedName.expirationMs - Date.now()) / 86400000) : 999;

			primaryNameEl.textContent = cleanName + '.sui';
			renewalPanel.style.display = '';
			marketplacePanel.style.display = '';

			const currentExpiry = selectedName.expirationMs ? new Date(selectedName.expirationMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
			document.getElementById('current-expiry').textContent = currentExpiry;

			const renewBtn = document.getElementById('renew-btn');
			const listBtn = document.getElementById('list-btn');
			const bidBtn = document.getElementById('bid-btn');

			const isConnected = isWalletActive();
			renewBtn.textContent = isConnected ? 'Renew This Name' : 'Connect Wallet to Renew';
			listBtn.textContent = isConnected ? 'List for Sale' : 'Connect Wallet to List';
			bidBtn.textContent = isConnected ? 'Place Bid' : 'Connect Wallet to Bid';

			renewBtn.disabled = !isConnected;
			listBtn.disabled = !isConnected;
			bidBtn.disabled = !isConnected;

			updateRenewalDate();
		}

		function updateRenewalDate() {
			if (!selectedName || !selectedName.expirationMs) return;
			const currentExpiry = new Date(selectedName.expirationMs);
			const newExpiry = new Date(currentExpiry);
			newExpiry.setFullYear(newExpiry.getFullYear() + selectedYears);
			document.getElementById('new-expiry').textContent = newExpiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		}

		document.querySelectorAll('.duration-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				selectedYears = parseInt(btn.dataset.years);
				updateRenewalDate();
				fetchRenewalPrice();
			});
		});

		document.querySelectorAll('.filter-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
				currentFilter = btn.dataset.filter;
				renderNames();
			});
		});

		document.querySelectorAll('.view-btn').forEach(btn => {
			btn.addEventListener('click', () => {
				document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
				btn.classList.add('active');
			});
		});

		document.getElementById('filter-input').addEventListener('input', (e) => {
			searchQuery = e.target.value;
			renderNames();
		});

		document.getElementById('clear-filter').addEventListener('click', () => {
			document.getElementById('filter-input').value = '';
			searchQuery = '';
			currentFilter = 'all';
			document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
			document.querySelector('[data-filter="all"]').classList.add('active');
			renderNames();
		});

		async function fetchRenewalPrice() {
			if (!selectedName) return;
			try {
				const cleanName = selectedName.name.replace(/\\.sui$/i, '');
				const res = await fetch(\`/api/pricing?domain=\${encodeURIComponent(cleanName)}&years=\${selectedYears}\`);
				if (!res.ok) throw new Error('Pricing fetch failed');
				const data = await res.json();
				const priceSui = data.discountedSuiMist ? (Number(data.discountedSuiMist) / 1e9).toFixed(2) : '--';
				document.getElementById('renewal-price').textContent = priceSui + ' SUI';
				if (data.savingsPercent) {
					document.getElementById('discount-badge').textContent = '-' + Math.round(data.savingsPercent) + '%';
				}
			} catch (e) {
				console.error('Failed to fetch renewal price:', e);
			}
		}

		async function loadNames() {
			const address = SuiWalletKit.$connection.value.address;
			if (!address) return;

			loadingState.style.display = '';
			namesGrid.style.display = 'none';
			emptyNames.style.display = 'none';

			try {
				const res = await fetch(API_BASE + '/api/owned-names?address=' + encodeURIComponent(address));
				if (!res.ok) throw new Error('API error: ' + res.status);
				const data = await res.json();

				if (data.error) throw new Error(data.error);

				cachedNames = data.names || [];
				cachedNames.sort((a, b) => {
					if (a.isPrimary && !b.isPrimary) return -1;
					if (!a.isPrimary && b.isPrimary) return 1;
					return (a.name || '').localeCompare(b.name || '');
				});

				loadingState.style.display = 'none';
				renderNames();

				if (cachedNames.length > 0) {
					const primary = cachedNames.find(n => n.isPrimary) || cachedNames[0];
					selectName(primary.name.replace(/\\.sui$/i, ''));
				}
			} catch (e) {
				console.error('Failed to load names:', e);
				loadingState.style.display = 'none';
				emptyNames.style.display = '';
				document.querySelector('#empty-names h3').textContent = 'Failed to Load';
				document.querySelector('#empty-names p').textContent = e.message || 'Could not fetch your names.';
			}
		}

		function updateWalletUI() {
			const conn = SuiWalletKit.$connection.value;
			const address = conn.address;
			const isActive = conn.status === 'connected' || conn.status === 'session';

			if (isActive && address) {
				connectCta.style.display = 'none';
				qrSection.style.display = '';
				addressRow.style.display = '';
				actionRow.style.display = '';
				linksSection.style.display = '';

				walletAddressEl.textContent = truncAddr(address);
				document.getElementById('portfolio-btn').href = \`https://suiscan.xyz/mainnet/account/\${address}\`;

				if (selectedName) {
					const cleanName = selectedName.name.replace(/\\.sui$/i, '');
					document.getElementById('profile-link').href = \`https://\${encodeURIComponent(cleanName)}.\${PROFILE_BASE}\`;
					document.getElementById('profile-link-text').textContent = cleanName + '.sui.ski';
					document.getElementById('nft-link').href = \`https://suiscan.xyz/mainnet/object/\${selectedName.nftId || ''}\`;
				}

				const renewBtn = document.getElementById('renew-btn');
				const listBtn = document.getElementById('list-btn');
				const bidBtn = document.getElementById('bid-btn');

				if (selectedName) {
					renewBtn.textContent = 'Renew This Name';
					listBtn.textContent = 'List for Sale';
					bidBtn.textContent = 'Place Bid';
					renewBtn.disabled = false;
					listBtn.disabled = false;
					bidBtn.disabled = false;
				}
			} else {
				connectCta.style.display = '';
				qrSection.style.display = 'none';
				addressRow.style.display = 'none';
				actionRow.style.display = 'none';
				linksSection.style.display = 'none';
				renewalPanel.style.display = 'none';
				marketplacePanel.style.display = 'none';
				primaryNameEl.textContent = 'Connect Wallet';
			}
		}

		async function executeRenewal() {
			if (!selectedName) return;
			const cleanName = selectedName.name.replace(/\\.sui$/i, '');
			showTxModal('Renewing ' + cleanName + '.sui...');

			try {
				const suiClient = new SuiJsonRpcClient({ url: RPC_URL });
				const suinsClient = new SuinsClient({ client: suiClient, network: '${network}' });
				const tx = new Transaction();
				const suinsTx = new SuinsTransaction(suinsClient, tx);

				const priceRes = await fetch(\`/api/pricing?domain=\${encodeURIComponent(cleanName)}&years=\${selectedYears}\`);
				const priceData = await priceRes.json();
				const priceMist = priceData.discountedSuiMist || priceData.directSuiMist;

				suinsTx.renew({
					nftId: selectedName.nftId,
					years: selectedYears,
					price: BigInt(priceMist)
				});

				const result = await SuiWalletKit.signAndExecute(tx);
				showTxSuccess('Renewal successful!', result.digest);
				setTimeout(() => loadNames(), 2000);
			} catch (e) {
				console.error('Renewal failed:', e);
				showTxError(e.message || 'Renewal failed');
			}
		}

		async function executeList() {
			if (!selectedName) return;
			const price = document.getElementById('list-price').value;
			if (!price || parseFloat(price) <= 0) {
				alert('Please enter a valid price');
				return;
			}
			const cleanName = selectedName.name.replace(/\\.sui$/i, '');
			showTxModal('Listing ' + cleanName + '.sui for ' + price + ' SUI...');

			try {
				window.open(\`\${TRADEPORT_URL}?tab=list&tokenId=\${encodeURIComponent(selectedName.nftId || '')}\`, '_blank');
				showTxSuccess('Redirecting to Tradeport...', null);
			} catch (e) {
				showTxError(e.message || 'Listing failed');
			}
		}

		async function executeBid() {
			if (!selectedName) return;
			const cleanName = selectedName.name.replace(/\\.sui$/i, '');
			showTxModal('Opening bid dialog for ' + cleanName + '.sui...');

			try {
				window.open(\`\${TRADEPORT_URL}?tab=bid&tokenId=\${encodeURIComponent(selectedName.nftId || '')}\`, '_blank');
				showTxSuccess('Redirecting to Tradeport...', null);
			} catch (e) {
				showTxError(e.message || 'Bid failed');
			}
		}

		function showTxModal(message) {
			document.getElementById('tx-modal').classList.add('show');
			document.getElementById('tx-title').textContent = 'Transaction';
			document.getElementById('tx-message').textContent = message;
			document.getElementById('tx-hash').style.display = 'none';
			document.querySelector('.tx-status-icon').className = 'tx-status-icon';
		}

		function showTxSuccess(message, hash) {
			document.getElementById('tx-title').textContent = 'Success';
			document.getElementById('tx-message').textContent = message;
			document.querySelector('.tx-status-icon').className = 'tx-status-icon success';
			if (hash) {
				document.getElementById('tx-hash').textContent = truncAddr(hash);
				document.getElementById('tx-hash').style.display = '';
				document.getElementById('tx-hash').onclick = () => window.open(\`https://suiscan.xyz/mainnet/tx/\${hash}\`, '_blank');
			}
		}

		function showTxError(message) {
			document.getElementById('tx-title').textContent = 'Error';
			document.getElementById('tx-message').textContent = message;
			document.querySelector('.tx-status-icon').className = 'tx-status-icon error';
		}

		document.getElementById('tx-close').addEventListener('click', () => {
			document.getElementById('tx-modal').classList.remove('show');
		});

		document.getElementById('connect-btn').addEventListener('click', () => {
			SuiWalletKit.openModal();
		});

		document.getElementById('renew-btn').addEventListener('click', () => {
			if (!isWalletActive()) {
				SuiWalletKit.openModal();
			} else {
				executeRenewal();
			}
		});

		document.getElementById('list-btn').addEventListener('click', () => {
			if (!isWalletActive()) {
				SuiWalletKit.openModal();
			} else {
				executeList();
			}
		});

		document.getElementById('bid-btn').addEventListener('click', () => {
			if (!isWalletActive()) {
				SuiWalletKit.openModal();
			} else {
				executeBid();
			}
		});

		document.getElementById('copy-address').addEventListener('click', async () => {
			const addr = SuiWalletKit.$connection.value.address;
			if (addr) {
				await navigator.clipboard.writeText(addr);
				const btn = document.getElementById('copy-address');
				btn.style.color = '#4ade80';
				setTimeout(() => btn.style.color = '', 1000);
			}
		});

		window.onWalletConnected = function() {
			updateWalletUI();
			loadNames();
		};

		window.onWalletDisconnected = function() {
			cachedNames = [];
			renderNames();
			updateWalletUI();
		};

		SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
			if (conn && (conn.status === 'connected' || conn.status === 'session') && conn.address) {
				updateWalletUI();
				loadNames();
			}
		});

		${generateSharedWalletMountJs({
			network: network,
			onConnect: 'onWalletConnected',
			onDisconnect: 'onWalletDisconnected',
			profileButtonId: 'wallet-profile-btn',
			profileFallbackHref: 'https://sui.ski',
		})}
	</script>
</body>
</html>`
}
