import type { Env } from '../types'

/**
 * Generate a registration page for an available SuiNS name
 */
export function generateRegistrationPage(name: string, env: Env): string {
	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const nameLength = cleanName.length
	const isRegisterable = nameLength >= 3

	const network = env.SUI_NETWORK || 'mainnet'

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${cleanName}.sui - Available | sui.ski</title>
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
			--error: #f87171;
			--error-light: rgba(248, 113, 113, 0.12);
			--border: rgba(255, 255, 255, 0.06);
			--border-strong: rgba(255, 255, 255, 0.12);
			--glow: rgba(96, 165, 250, 0.3);
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
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
			position: relative;
			overflow-x: hidden;
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
		.container { max-width: 520px; width: 100%; position: relative; z-index: 1; }
		.site-header {
			text-align: center;
			margin-bottom: 24px;
			padding: 24px;
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border-radius: 20px;
			border: 1px solid var(--glass-border);
			box-shadow: var(--shadow);
		}
		.site-header h2 {
			font-size: 1.75rem;
			font-weight: 800;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			letter-spacing: -0.03em;
		}
		.card {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border-radius: 24px;
			padding: 36px;
			text-align: center;
			border: 1px solid var(--glass-border);
			box-shadow: var(--shadow-lg);
		}
		.status-badge {
			display: inline-block;
			background: var(--success-light);
			color: var(--success);
			padding: 8px 18px;
			border-radius: 12px;
			font-size: 0.85rem;
			font-weight: 700;
			margin-bottom: 24px;
			border: 1px solid rgba(16, 185, 129, 0.2);
		}
		.name {
			font-size: 2.25rem;
			font-weight: 800;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			word-break: break-all;
			margin-bottom: 10px;
			letter-spacing: -0.03em;
		}
		.suffix {
			color: var(--text-muted);
			-webkit-text-fill-color: var(--text-muted);
		}
		.description {
			color: var(--text-muted);
			margin-bottom: 28px;
			font-size: 1rem;
		}
		.year-selector {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 24px;
			margin-bottom: 28px;
			text-align: center;
		}
		.selector-label {
			font-size: 0.85rem;
			font-weight: 600;
			color: var(--text-muted);
			margin-bottom: 18px;
		}
		.selector-controls {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 24px;
		}
		.year-btn {
			width: 48px;
			height: 48px;
			border-radius: 14px;
			background: var(--card-bg-solid);
			border: 2px solid var(--border-strong);
			color: var(--text);
			font-size: 1.25rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0;
		}
		.year-btn:hover:not(:disabled) {
			border-color: var(--accent);
			background: var(--accent-light);
			color: var(--accent);
		}
		.year-btn:disabled {
			opacity: 0.3;
			cursor: not-allowed;
		}
		.year-display {
			display: flex;
			align-items: baseline;
			gap: 10px;
		}
		.year-display .number {
			font-size: 2.75rem;
			font-weight: 800;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.year-display .unit {
			font-size: 1.25rem;
			font-weight: 600;
			color: var(--text-muted);
		}
		.price-display {
			margin-top: 24px;
			padding: 18px;
			background: var(--success-light);
			border: 1px solid rgba(16, 185, 129, 0.2);
			border-radius: 14px;
		}
		.price-display .price-usd {
			font-size: 1.5rem;
			font-weight: 800;
			color: var(--success);
		}
		.price-display .price-sui {
			font-size: 1rem;
			font-weight: 600;
			color: var(--accent);
			margin-left: 10px;
		}
		.price-display .price-loading {
			font-size: 0.875rem;
			color: var(--text-muted);
		}
		.search-bar {
			display: flex;
			gap: 10px;
			margin-bottom: 28px;
		}
		.search-bar input {
			flex: 1;
			padding: 14px 18px;
			border: 2px solid var(--border);
			border-radius: 14px;
			background: var(--card-bg-solid);
			color: var(--text);
			font-size: 1rem;
			font-weight: 500;
			outline: none;
			transition: all 0.2s;
		}
		.search-bar input:focus {
			border-color: var(--accent);
			box-shadow: 0 0 0 4px var(--accent-glow);
		}
		.search-bar input::placeholder {
			color: var(--text-muted);
		}
		.search-bar button {
			padding: 14px 24px;
			width: auto;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			border: none;
			border-radius: 14px;
			color: white;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}
		.search-bar button:hover {
			filter: brightness(1.1);
			transform: translateY(-1px);
		}
		.preview-boxes {
			display: flex;
			flex-direction: column;
			gap: 18px;
			margin-bottom: 28px;
		}
		.preview-box {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.4), rgba(20, 20, 30, 0.5));
			border: 1px solid var(--border);
			border-radius: 16px;
			overflow: hidden;
			transition: all 0.2s;
		}
		.preview-box:hover {
			border-color: var(--border-strong);
			box-shadow: var(--shadow);
		}
		.preview-box.hidden {
			display: none;
		}
		.collapsible-section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			margin-bottom: 20px;
			overflow: hidden;
			box-shadow: var(--shadow);
		}
		.collapsible-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 18px 20px;
			background: linear-gradient(135deg, rgba(14, 165, 233, 0.05), rgba(6, 182, 212, 0.05));
			border-bottom: 1px solid var(--border);
			cursor: pointer;
			transition: all 0.2s;
		}
		.collapsible-header:hover {
			background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(6, 182, 212, 0.08));
		}
		.collapsible-header-left {
			display: flex;
			align-items: center;
			gap: 14px;
		}
		.collapsible-header-left h3 {
			font-size: 1rem;
			font-weight: 700;
			color: var(--text);
		}
		.collapsible-icon {
			width: 36px;
			height: 36px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, var(--accent), #06b6d4);
		}
		.collapsible-icon svg {
			width: 18px;
			height: 18px;
			color: white;
		}
		.collapsible-toggle {
			width: 30px;
			height: 30px;
			border-radius: 10px;
			background: var(--card-bg-solid);
			border: 1px solid var(--border);
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.3s;
		}
		.collapsible-toggle svg {
			width: 14px;
			height: 14px;
			color: var(--accent);
		}
		.collapsible-section.collapsed .collapsible-toggle {
			transform: rotate(-90deg);
		}
		.collapsible-content {
			max-height: 1000px;
			overflow: hidden;
			transition: max-height 0.3s ease;
		}
		.collapsible-section.collapsed .collapsible-content {
			max-height: 0;
		}
		.ultra-section {
			background: linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(6, 182, 212, 0.08));
			border: 2px solid var(--accent);
		}
		.ultra-header {
			background: linear-gradient(135deg, var(--accent), #06b6d4) !important;
			border-bottom: none !important;
		}
		.ultra-header h3 {
			color: white !important;
		}
		.ultra-header .collapsible-toggle {
			background: rgba(255, 255, 255, 0.2);
			border-color: rgba(255, 255, 255, 0.3);
		}
		.ultra-header .collapsible-toggle svg {
			color: white;
		}
		.ultra-badge {
			background: rgba(255, 255, 255, 0.2);
			color: white;
			padding: 5px 12px;
			border-radius: 8px;
			font-size: 0.7rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.ultra-suggestions {
			padding: 16px;
		}
		.ultra-search {
			display: flex;
			gap: 10px;
			margin-bottom: 16px;
		}
		.ultra-search input {
			flex: 1;
			padding: 12px 16px;
			border: 2px solid var(--border);
			border-radius: 10px;
			background: var(--bg);
			color: var(--text);
			font-size: 1rem;
			outline: none;
			transition: border-color 0.2s;
		}
		.ultra-search input:focus {
			border-color: var(--accent);
		}
		.ultra-search input::placeholder {
			color: var(--text-muted);
		}
		.ultra-search button {
			padding: 12px 20px;
			background: var(--accent);
			border: none;
			border-radius: 10px;
			color: var(--accent-hover);
			font-weight: 600;
			cursor: pointer;
			transition: filter 0.2s;
		}
		.ultra-search button:hover {
			filter: brightness(1.1);
		}
		.ultra-search button:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.suggestion-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}
		@media (max-width: 400px) {
			.suggestion-grid { grid-template-columns: 1fr; }
		}
		.suggestion-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 14px;
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 10px;
			text-decoration: none;
			transition: all 0.2s;
			position: relative;
		}
		.suggestion-item:hover {
			border-color: var(--accent);
			background: rgba(255, 215, 0, 0.05);
			transform: translateY(-2px);
		}
		.suggestion-item.checking {
			opacity: 0.7;
		}
		.suggestion-item.available {
			border-color: #34d399;
			background: rgba(52, 211, 153, 0.08);
		}
		.suggestion-item.taken {
			border-color: var(--border);
			opacity: 0.6;
		}
		.suggestion-item.for-sale {
			border-color: var(--accent);
			background: rgba(255, 215, 0, 0.1);
		}
		.suggestion-left {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.suggestion-name {
			font-family: ui-monospace, monospace;
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--accent);
		}
		.suggestion-status {
			font-size: 0.65rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.suggestion-status.available { color: #34d399; }
		.suggestion-status.taken { color: var(--text-muted); }
		.suggestion-status.for-sale { color: var(--accent); }
		.suggestion-status.checking { color: var(--text-muted); }
		.suggestion-status.sold { color: #ff6b6b; }
		.suggestion-status.minted { color: var(--accent); }
		.suggestion-item.sold {
			border-color: #ff6b6b;
			background: rgba(255, 107, 107, 0.08);
		}
		.suggestion-item.minted {
			border-color: var(--accent);
			background: rgba(0, 212, 255, 0.08);
		}
		.suggestion-arrow {
			color: var(--accent);
			font-size: 1.1rem;
		}
		.suggestion-price {
			font-size: 0.7rem;
			color: var(--accent);
			font-weight: 600;
		}
		.preview-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 14px 18px;
			background: rgba(129, 140, 248, 0.08);
			border-bottom: 1px solid var(--border);
		}
		.preview-header-left {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.preview-icon {
			width: 36px;
			height: 36px;
			background: var(--accent);
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.preview-icon svg {
			width: 20px;
			height: 20px;
			color: white;
		}
		.preview-title {
			font-size: 1rem;
			font-weight: 600;
			color: var(--text);
		}
		.preview-badge {
			font-size: 0.7rem;
			font-weight: 600;
			padding: 4px 10px;
			border-radius: 6px;
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.preview-badge.found {
			background: rgba(52, 211, 153, 0.15);
			color: var(--success);
		}
		.preview-badge.not-found {
			background: rgba(148, 163, 184, 0.15);
			color: var(--text-muted);
		}
		.preview-content {
			padding: 18px;
		}
		.preview-word {
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--accent);
			margin-bottom: 4px;
		}
		.preview-phonetic {
			font-size: 0.9rem;
			color: var(--text-muted);
			font-style: italic;
			margin-bottom: 16px;
		}
		.preview-meanings {
			display: flex;
			flex-direction: column;
			gap: 14px;
		}
		.preview-meaning {
			padding-left: 12px;
			border-left: 3px solid var(--accent);
		}
		.preview-pos {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--accent);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 6px;
		}
		.preview-def {
			font-size: 0.9rem;
			color: var(--text);
			line-height: 1.5;
			margin-bottom: 6px;
		}
		.preview-example {
			font-size: 0.85rem;
			color: var(--text-muted);
			font-style: italic;
			padding-left: 12px;
			border-left: 2px solid var(--border);
		}
		.preview-synonyms {
			display: flex;
			flex-wrap: wrap;
			gap: 6px;
			margin-top: 8px;
		}
		.preview-synonym {
			font-size: 0.75rem;
			padding: 3px 8px;
			background: var(--card-bg);
			border-radius: 4px;
			color: var(--text-muted);
		}
		.preview-article {
			font-size: 0.9rem;
			color: var(--text);
			line-height: 1.7;
		}
		.preview-article-title {
			font-size: 1.1rem;
			font-weight: 600;
			color: var(--text);
			margin-bottom: 12px;
		}
		.preview-article-extract {
			margin-bottom: 16px;
		}
		.preview-meta {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			padding-top: 12px;
			border-top: 1px solid var(--border);
			font-size: 0.8rem;
			color: var(--text-muted);
		}
		.preview-meta-item {
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.preview-meta-item svg {
			width: 14px;
			height: 14px;
			opacity: 0.7;
		}
		.preview-link {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			color: var(--accent);
			text-decoration: none;
			font-size: 0.85rem;
			font-weight: 500;
			margin-top: 12px;
		}
		.preview-link:hover {
			text-decoration: underline;
		}
		.preview-link svg {
			width: 14px;
			height: 14px;
		}
		.preview-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			padding: 24px;
			color: var(--text-muted);
		}
		.preview-empty {
			text-align: center;
			padding: 24px;
			color: var(--text-muted);
		}
		.preview-empty-icon {
			font-size: 2rem;
			margin-bottom: 8px;
			opacity: 0.5;
		}
		.action-btn {
			width: 100%;
			padding: 18px 28px;
			border: none;
			border-radius: 16px;
			font-size: 1rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
		}
		.connect-btn {
			width: 100%;
			padding: 18px 28px;
			border: none;
			border-radius: 16px;
			font-size: 1rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			background: linear-gradient(135deg, var(--accent), #06b6d4);
			color: white;
			box-shadow: 0 4px 16px var(--glow);
		}
		.connect-btn:hover {
			filter: brightness(1.1);
			transform: translateY(-2px);
			box-shadow: 0 6px 20px var(--glow);
		}
		.connect-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
		.register-btn {
			width: 100%;
			padding: 18px 28px;
			border: none;
			border-radius: 16px;
			font-size: 1.05rem;
			font-weight: 800;
			cursor: pointer;
			transition: all 0.2s;
			background: linear-gradient(135deg, var(--success), #059669);
			color: white;
			box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
		}
		.register-btn:hover {
			filter: brightness(1.1);
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
		}
		.wallet-info {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			margin-bottom: 18px;
			padding: 14px;
			background: var(--accent-light);
			border: 1px solid var(--border);
			border-radius: 14px;
		}
		.wallet-address {
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--accent);
		}
		.disconnect {
			background: transparent;
			border: none;
			color: var(--error);
			cursor: pointer;
			font-size: 0.875rem;
			font-weight: 600;
			padding: 4px 8px;
			width: auto;
			transition: opacity 0.2s;
		}
		.disconnect:hover { opacity: 0.7; }
		.status {
			margin-top: 18px;
			padding: 14px 18px;
			border-radius: 14px;
			font-size: 0.875rem;
			font-weight: 500;
		}
		.status.error { background: var(--error-light); color: var(--error); border: 1px solid rgba(239, 68, 68, 0.2); }
		.status.success { background: var(--success-light); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.2); }
		.status.info { background: var(--accent-light); color: var(--accent); border: 1px solid var(--border); }
		.footer {
			text-align: center;
			margin-top: 28px;
			color: var(--text-muted);
			font-size: 0.875rem;
		}
		.footer a { color: var(--accent); text-decoration: none; font-weight: 600; }
		.footer a:hover { text-decoration: underline; }
		.unavailable { color: var(--text-muted); padding: 28px; font-size: 1rem; }
		.wallets-modal {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.8);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
			opacity: 0;
			visibility: hidden;
			transition: all 0.2s;
		}
		.wallets-modal.open { opacity: 1; visibility: visible; }
		.wallets-content {
			background: var(--card-bg);
			border-radius: 16px;
			padding: 24px;
			max-width: 360px;
			width: 100%;
		}
		.wallets-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}
		.wallets-title { font-size: 1.25rem; font-weight: 600; }
		.close-btn {
			background: transparent;
			border: none;
			color: var(--text-muted);
			font-size: 1.5rem;
			cursor: pointer;
			width: auto;
			padding: 4px;
		}
		.wallet-list { display: flex; flex-direction: column; gap: 8px; }
		.wallet-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			background: var(--bg);
			border: 1px solid var(--border);
			border-radius: 12px;
			cursor: pointer;
			transition: all 0.2s;
		}
		.wallet-item:hover {
			border-color: var(--accent);
			background: rgba(129, 140, 248, 0.05);
		}
		.wallet-icon { width: 32px; height: 32px; border-radius: 8px; }
		.wallet-name { font-weight: 500; }
		.loading {
			display: inline-block;
			width: 16px;
			height: 16px;
			border: 2px solid transparent;
			border-top-color: currentColor;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
		@keyframes spin { to { transform: rotate(360deg); } }
		.hidden { display: none !important; }
		.search-tab {
			position: fixed;
			top: 50%;
			right: 0;
			transform: translateY(-50%);
			z-index: 100;
		}
		.search-tab-btn {
			background: var(--accent);
			border: none;
			border-radius: 12px 0 0 12px;
			padding: 12px 8px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: -2px 0 10px rgba(0,0,0,0.3);
		}
		.search-tab-btn svg {
			width: 20px;
			height: 20px;
			color: white;
		}
		.search-tab-btn:hover {
			background: var(--accent-hover);
		}
		.search-panel {
			position: fixed;
			top: 0;
			right: -320px;
			width: 320px;
			height: 100%;
			background: var(--card-bg);
			border-left: 1px solid var(--border);
			padding: 24px;
			z-index: 1001;
			transition: right 0.3s ease;
			box-shadow: -4px 0 20px rgba(0,0,0,0.4);
		}
		.search-panel.open {
			right: 0;
		}
		.search-panel-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20px;
		}
		.search-panel-title {
			font-size: 1.1rem;
			font-weight: 600;
			color: var(--text);
		}
		.search-panel-close {
			background: transparent;
			border: none;
			color: var(--text-muted);
			font-size: 1.5rem;
			cursor: pointer;
			padding: 4px;
			width: auto;
		}
		.search-panel input {
			width: 100%;
			padding: 14px 16px;
			border: 2px solid var(--border);
			border-radius: 12px;
			background: var(--bg);
			color: var(--text);
			font-size: 1rem;
			outline: none;
			margin-bottom: 12px;
		}
		.search-panel input:focus {
			border-color: var(--accent);
		}
		.search-panel input::placeholder {
			color: var(--text-muted);
		}
		.search-panel button.search-go {
			width: 100%;
			padding: 14px;
			background: var(--accent);
			border: none;
			border-radius: 12px;
			color: white;
			font-weight: 600;
			cursor: pointer;
		}
		.search-panel button.search-go:hover {
			background: var(--accent-hover);
		}
		.search-overlay {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0,0,0,0.5);
			z-index: 1000;
			opacity: 0;
			visibility: hidden;
			transition: all 0.3s;
		}
		.search-overlay.open {
			opacity: 1;
			visibility: visible;
		}
	</style>
</head>
<body>
	<!-- Search Tab -->
	<div class="search-tab">
		<button class="search-tab-btn" id="open-search">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
		</button>
	</div>
	<div class="search-overlay" id="search-overlay"></div>
	<div class="search-panel" id="search-panel">
		<div class="search-panel-header">
			<span class="search-panel-title">Search Names</span>
			<button class="search-panel-close" id="close-search">&times;</button>
		</div>
		<input type="text" id="search-input" placeholder="Enter a name..." />
		<button class="search-go" id="search-btn">Search</button>
	</div>

	<div class="container">
		<div class="site-header">
			<h2>sui.ski</h2>
		</div>
		<div class="card">
			${
				isRegisterable
					? `
			<div class="status-badge">Available for Claiming</div>
			<div class="name">${cleanName}<span class="suffix">.sui</span></div>
			<p class="description">This name is available for registration.</p>

			<!-- Knowledge Section (Dictionary + Grokipedia) -->
			<div class="collapsible-section" id="knowledge-section">
				<div class="collapsible-header" onclick="toggleSection('knowledge-section')">
					<div class="collapsible-header-left">
						<div class="collapsible-icon" style="background: linear-gradient(135deg, var(--accent), #10b981);">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
								<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
							</svg>
						</div>
						<h3>Knowledge Base</h3>
					</div>
					<div class="collapsible-toggle">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</div>
				</div>
				<div class="collapsible-content">
					<div class="preview-boxes" style="margin: 0;">
						<!-- Dictionary Preview -->
						<div class="preview-box" id="dictionary-box" style="border-radius: 0; border: none; border-bottom: 1px solid var(--border);">
							<div class="preview-header">
								<div class="preview-header-left">
									<div class="preview-icon">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
											<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
										</svg>
									</div>
									<span class="preview-title">Dictionary</span>
								</div>
								<span class="preview-badge" id="dictionary-badge">Loading...</span>
							</div>
							<div class="preview-content" id="dictionary-content">
								<div class="preview-loading">
									<span class="loading"></span>
									Looking up definition...
								</div>
							</div>
						</div>

						<!-- Grokipedia Preview -->
						<div class="preview-box" id="grokipedia-box" style="border-radius: 0; border: none;">
							<div class="preview-header">
								<div class="preview-header-left">
									<div class="preview-icon" style="background: #10b981;">
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<circle cx="12" cy="12" r="10"></circle>
											<line x1="2" y1="12" x2="22" y2="12"></line>
											<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
										</svg>
									</div>
									<span class="preview-title">Grokipedia</span>
								</div>
								<span class="preview-badge" id="grokipedia-badge">Loading...</span>
							</div>
							<div class="preview-content" id="grokipedia-content">
								<div class="preview-loading">
									<span class="loading"></span>
									Searching encyclopedia...
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Ultra Suggestions Section -->
			<div class="collapsible-section ultra-section" id="ultra-section">
				<div class="collapsible-header ultra-header" onclick="toggleSection('ultra-section')">
					<div class="collapsible-header-left">
						<div class="collapsible-icon" style="background: var(--accent-hover);">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
							</svg>
						</div>
						<h3>Ultra</h3>
						<span class="ultra-badge">TradePort</span>
					</div>
					<div class="collapsible-toggle">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9"></polyline>
						</svg>
					</div>
				</div>
				<div class="collapsible-content">
					<div class="ultra-suggestions">
						<div class="ultra-search">
							<input type="text" id="ultra-search-input" placeholder="Search names or leave empty for trending..." value="" />
							<button id="ultra-search-btn">Search</button>
						</div>
						<p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px; text-align: center;">Recent sales over $12 + iconic minted names</p>
						<div class="suggestion-grid" id="ultra-suggestions">
							<div class="preview-loading">
								<span class="loading"></span>
								Loading trending names...
							</div>
						</div>
					</div>
				</div>
			</div>

			<div id="price-section">
				<div class="year-selector">
					<div class="selector-label">Registration Duration</div>
					<div class="selector-controls">
						<button class="year-btn" id="year-minus" disabled>−</button>
						<div class="year-display">
							<span class="number" id="year-number">1</span>
							<span class="unit" id="year-label">year</span>
						</div>
						<button class="year-btn" id="year-plus">+</button>
					</div>
					<div class="price-display" id="price-display">
						<span class="price-loading">Loading price...</span>
					</div>
				</div>
			</div>

			<div id="wallet-section">
				<div id="wallet-info" class="wallet-info hidden">
					<span class="wallet-address" id="wallet-address"></span>
					<button class="disconnect" id="disconnect-btn">Disconnect</button>
				</div>
				<button class="connect-btn" id="connect-btn">Connect Wallet</button>
				<button class="register-btn hidden" id="register-btn">Register ${cleanName}.sui</button>
			</div>

			<div id="status" class="status hidden"></div>
			`
					: `
			<div class="status-badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171;">✗ Unavailable</div>
			<div class="name">${cleanName}<span class="suffix">.sui</span></div>
			<div class="unavailable">
				<p>Names with fewer than 3 characters are not available for public registration.</p>
			</div>
			`
			}
		</div>

		<div class="footer">
			<p><a href="https://sui.ski">sui.ski</a> • <a href="https://suins.io">SuiNS</a></p>
		</div>
	</div>

	<!-- Wallet Selection Modal -->
	<div class="wallets-modal" id="wallets-modal">
		<div class="wallets-content">
			<div class="wallets-header">
				<span class="wallets-title">Connect Wallet</span>
				<button class="close-btn" id="close-modal">&times;</button>
			</div>
			<div class="wallet-list" id="wallet-list">
				<div class="status info">Detecting wallets...</div>
			</div>
		</div>
	</div>

	${
		isRegisterable
			? `
	<script type="module">
		import { getWallets } from 'https://esm.sh/@mysten/wallet-standard@0.13.8';
		import { SuiClient } from 'https://esm.sh/@mysten/sui@1.27.0/client';
		import { Transaction } from 'https://esm.sh/@mysten/sui@1.27.0/transactions';
		import { SuinsClient, SuinsTransaction } from 'https://esm.sh/@mysten/suins@0.7.2';

		const NAME = '${cleanName}';
		const NETWORK = '${network}';
		const RPC_URL = '${env.SUI_RPC_URL}';

		// Collapsible section toggle
		window.toggleSection = function(sectionId) {
			const section = document.getElementById(sectionId);
			if (section) {
				section.classList.toggle('collapsed');
			}
		};

		// TradePort API integration (proxied through the Worker)
		const TRADEPORT_ENDPOINT = '/api/tradeport';

		// Fetch SUI price for USD conversion
		let suiPriceForUltra = null;
		async function getSuiPrice() {
			if (suiPriceForUltra) return suiPriceForUltra;
			try {
				const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd');
				if (res.ok) {
					const data = await res.json();
					suiPriceForUltra = data?.sui?.usd || 3.5;
				}
			} catch (e) {
				suiPriceForUltra = 3.5; // fallback
			}
			return suiPriceForUltra;
		}

		// Fetch recent SuiNS sales over $12 via the Worker proxy
		async function fetchRecentSales() {
			const suiPrice = await getSuiPrice();
			const minPriceSui = 12 / suiPrice; // $12 worth of SUI
			const minPriceMist = Math.floor(minPriceSui * 1e9);

			try {
					const response = await fetch(
						\`\${TRADEPORT_ENDPOINT}/suins/recent-sales?minPriceMist=\${minPriceMist}&limit=12\`
					);

				if (response.ok) {
					const data = await response.json();
					const activities = data?.sales || [];
					return activities
						.map(a => {
							const name = a.name?.replace(/\\.sui$/i, '') || a.name || '';
							if (!name) return null;
							const priceSui = (a.priceMist || 0) / 1e9;
							return {
								name,
								priceSui,
								priceUsd: priceSui * suiPrice,
								timestamp: a.timestamp,
								type: 'sold'
							};
						})
						.filter(a => a && a.name && a.name.length >= 3);
				}
			} catch (e) {
				console.log('Failed to fetch recent sales:', e);
			}
			return [];
		}


		// Fetch recently minted iconic SuiNS names via the Worker proxy
		async function fetchRecentMints() {
			try {
				const response = await fetch(\`\${TRADEPORT_ENDPOINT}/suins/recent-mints?limit=20\`);

				if (response.ok) {
					const data = await response.json();
					const activities = data?.mints || [];

					// Filter for "iconic" names - short, dictionary words, clean
					const iconic = activities
						.map(a => ({
							name: a.name?.replace(/\\.sui$/i, '') || a.name || '',
							timestamp: a.timestamp,
							type: 'minted'
						}))
						.filter(a => {
							if (!a.name || a.name.length < 3) return false;
							// Iconic = short (3-6 chars), no numbers, clean
							if (a.name.length <= 6 && /^[a-z]+$/.test(a.name)) return true;
							// Or longer but looks like a real word (no weird patterns)
							if (a.name.length <= 10 && /^[a-z]+$/.test(a.name) && !a.name.includes('xxx')) return true;
							return false;
						});

					return iconic;
				}
			} catch (e) {
				console.log('Failed to fetch recent mints:', e);
			}
			return [];
		}


		// Check if a name is currently listed for sale
		async function checkListing(domainName) {
			try {
				const response = await fetch(\`\${TRADEPORT_ENDPOINT}/name/\${encodeURIComponent(domainName)}\`);

				if (response.ok) {
					const data = await response.json();
					if (data.isListed && data.listing) {
						const priceSui = typeof data.listing.priceSui === 'number'
							? data.listing.priceSui
							: data.listing.price
							? data.listing.price / 1e9
							: null;
						if (priceSui) {
							return { listed: true, price: priceSui };
						}
					}
				}
			} catch (e) {
				console.log('Listing check failed:', e);
			}
			return { listed: false, price: null };
		}


		// Render trending names (recent sales + iconic mints)
		async function renderTrendingNames() {
			const container = document.getElementById('ultra-suggestions');

			// Fetch both data sources in parallel
			const [sales, mints] = await Promise.all([
				fetchRecentSales(),
				fetchRecentMints()
			]);

			const suiPrice = await getSuiPrice();

			// Combine and dedupe, prioritizing sales
			const seenNames = new Set();
			const trending = [];

			// Add high-value sales first
			for (const sale of sales) {
				if (!seenNames.has(sale.name)) {
					seenNames.add(sale.name);
					trending.push(sale);
				}
			}

			// Add iconic mints
			for (const mint of mints) {
				if (!seenNames.has(mint.name) && trending.length < 12) {
					seenNames.add(mint.name);
					trending.push(mint);
				}
			}

			if (trending.length === 0) {
				container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">No trending names found. Try searching above.</p>';
				return;
			}

			// Render grid
			let html = '';
			for (const item of trending.slice(0, 8)) {
				const isSale = item.type === 'sold';
				const priceDisplay = isSale ? \`Sold: \${item.priceSui.toFixed(1)} SUI (~$\${item.priceUsd.toFixed(0)})\` : 'Recently Minted';
				const statusClass = isSale ? 'sold' : 'minted';

				html += \`
					<a href="https://tradeport.xyz/sui/collection/suins?search=\${item.name}" target="_blank" class="suggestion-item \${statusClass}" id="trending-\${item.name}" data-name="\${item.name}">
						<div class="suggestion-left">
							<span class="suggestion-name">\${item.name}.sui</span>
							<span class="suggestion-status \${statusClass}">\${priceDisplay}</span>
						</div>
						<span class="suggestion-arrow">\u2192</span>
					</a>
				\`;
			}
			container.innerHTML = html;

			// Check current listing status for each
			for (const item of trending.slice(0, 8)) {
				try {
					const listing = await checkListing(item.name);
					const el = document.getElementById('trending-' + item.name);
					if (el && listing.listed) {
						el.classList.remove('sold', 'minted');
						el.classList.add('for-sale');
						const statusEl = el.querySelector('.suggestion-status');
						if (statusEl) {
							const usdPrice = listing.price * suiPrice;
							statusEl.className = 'suggestion-status for-sale';
							statusEl.textContent = \`For Sale: \${listing.price.toFixed(1)} SUI (~$\${usdPrice.toFixed(0)})\`;
						}
					}
				} catch (e) {
					// Keep original status
				}
			}
		}

		// Search for specific names
		async function searchNames(searchTerm) {
			const container = document.getElementById('ultra-suggestions');
			const baseName = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');

			if (baseName.length < 3) {
				container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">Name must be at least 3 characters.</p>';
				return;
			}

			try {
				const response = await fetch(\`\${TRADEPORT_ENDPOINT}/search?query=\${encodeURIComponent(baseName)}&limit=8\`);
				const suiPrice = await getSuiPrice();

				if (response.ok) {
					const data = await response.json();
					const results = data?.results || [];

					if (results.length === 0) {
						container.innerHTML = \`
							<a href="https://\${baseName}.sui.ski" class="suggestion-item available" style="grid-column: 1/-1;">
								<div class="suggestion-left">
									<span class="suggestion-name">\${baseName}.sui</span>
									<span class="suggestion-status available">Check Availability</span>
								</div>
								<span class="suggestion-arrow">\u2192</span>
							</a>
						\`;
						return;
					}

					let html = '';
					for (const result of results) {
						const name = result.name?.replace(/\\.sui$/i, '') || result.name || '';
						if (!name) continue;

						const listingPrice = result.listingPriceMist ? result.listingPriceMist / 1e9 : null;
						const lastSale = result.lastSalePriceMist ? result.lastSalePriceMist / 1e9 : null;

						let statusClass = 'taken';
						let statusText = 'Taken';

						if (listingPrice) {
							statusClass = 'for-sale';
							const usd = listingPrice * suiPrice;
							statusText = \`For Sale: \${listingPrice.toFixed(1)} SUI (~$\${usd.toFixed(0)})\`;
						} else if (lastSale) {
							statusClass = 'sold';
							const usd = lastSale * suiPrice;
							statusText = \`Last Sale: \${lastSale.toFixed(1)} SUI (~$\${usd.toFixed(0)})\`;
						}

						html += \`
							<a href="https://tradeport.xyz/sui/collection/suins?search=\${name}" target="_blank" class="suggestion-item \${statusClass}">
								<div class="suggestion-left">
									<span class="suggestion-name">\${name}.sui</span>
									<span class="suggestion-status \${statusClass}">\${statusText}</span>
								</div>
								<span class="suggestion-arrow">\u2192</span>
							</a>
						\`;
					}
					container.innerHTML = html || '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">No matching names found.</p>';
				}
			} catch (e) {
				console.log('Search failed:', e);
				container.innerHTML = '<p style="color: var(--text-muted); text-align: center; grid-column: 1/-1;">Search failed. Try again.</p>';
			}
		}

		// Initialize Ultra - load trending names on page load
		setTimeout(renderTrendingNames, 500);

		// Ultra search bar event listeners
		const ultraSearchInput = document.getElementById('ultra-search-input');
		const ultraSearchBtn = document.getElementById('ultra-search-btn');

		function performUltraSearch() {
			const searchTerm = ultraSearchInput.value.trim();
			if (!searchTerm) {
				// Empty search = show trending
				const container = document.getElementById('ultra-suggestions');
				container.innerHTML = \`
					<div class="preview-loading" style="grid-column: 1/-1;">
						<span class="loading"></span>
						Loading trending names...
					</div>
				\`;
				ultraSearchBtn.disabled = true;
				renderTrendingNames().then(() => {
					ultraSearchBtn.disabled = false;
				});
				return;
			}

			// Show loading state
			const container = document.getElementById('ultra-suggestions');
			container.innerHTML = \`
				<div class="preview-loading" style="grid-column: 1/-1;">
					<span class="loading"></span>
					Searching for "\${searchTerm}"...
				</div>
			\`;

			// Disable button during search
			ultraSearchBtn.disabled = true;
			ultraSearchBtn.textContent = 'Searching...';

			// Search TradePort for matching names
			searchNames(searchTerm).then(() => {
				ultraSearchBtn.disabled = false;
				ultraSearchBtn.textContent = 'Search';
			});
		}

		ultraSearchBtn.addEventListener('click', performUltraSearch);
		ultraSearchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') performUltraSearch();
		});

		let selectedYears = 1;
		let connectedWallet = null;
		let currentAccount = null;
		let walletsApi = null;
		let ownsName = false;

		// DOM elements
		const connectBtn = document.getElementById('connect-btn');
		const registerBtn = document.getElementById('register-btn');
		const disconnectBtn = document.getElementById('disconnect-btn');
		const walletInfo = document.getElementById('wallet-info');
		const walletAddress = document.getElementById('wallet-address');
		const statusEl = document.getElementById('status');
		const walletsModal = document.getElementById('wallets-modal');
		const walletList = document.getElementById('wallet-list');
		const closeModal = document.getElementById('close-modal');

		// Initialize wallet API
		try {
			walletsApi = getWallets();
		} catch (e) {
			console.error('Failed to initialize wallet API:', e);
		}

		const yearNumber = document.getElementById('year-number');
		const yearLabel = document.getElementById('year-label');
		const yearMinus = document.getElementById('year-minus');
		const yearPlus = document.getElementById('year-plus');
		const priceDisplay = document.getElementById('price-display');

		// SuiNS pricing in USD per year (fixed rates)
		const NAME_LEN = NAME.length;
		let suiPriceUsd = null;

		function getPricePerYearUsd() {
			if (NAME_LEN === 3) return 500;
			if (NAME_LEN === 4) return 120;
			return 10; // 5+ characters
		}

		async function fetchPrices() {
			// Fetch SUI/USD price
			try {
				const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd');
				if (res.ok) {
					const data = await res.json();
					suiPriceUsd = data?.sui?.usd || null;
				}
			} catch (e) {
				console.log('Failed to fetch SUI price');
			}
			updatePriceDisplay();
		}

		function updatePriceDisplay() {
			const priceUsd = getPricePerYearUsd() * selectedYears;
			if (suiPriceUsd) {
				const priceSui = (priceUsd / suiPriceUsd).toFixed(2);
				priceDisplay.innerHTML = \`<span class="price-usd">~$\${priceUsd} USD</span><span class="price-sui">(~\${priceSui} SUI)</span>\`;
			} else {
				priceDisplay.innerHTML = \`<span class="price-usd">~$\${priceUsd} USD</span><span class="price-loading">(loading SUI...)</span>\`;
			}
		}

		function updateYearDisplay() {
			yearNumber.textContent = selectedYears;
			yearLabel.textContent = selectedYears === 1 ? 'year' : 'years';
			yearMinus.disabled = selectedYears <= 1;
			yearPlus.disabled = selectedYears >= 5;
			updatePriceDisplay();
		}

		// Year selection with +/- buttons
		yearMinus.addEventListener('click', () => {
			if (selectedYears > 1) {
				selectedYears--;
				updateYearDisplay();
			}
		});

		yearPlus.addEventListener('click', () => {
			if (selectedYears < 5) {
				selectedYears++;
				updateYearDisplay();
			}
		});

		// Fetch prices
		fetchPrices();

		function showStatus(message, type = 'info') {
			statusEl.className = 'status ' + type;
			statusEl.innerHTML = message;
			statusEl.classList.remove('hidden');
		}

		function hideStatus() {
			statusEl.classList.add('hidden');
		}

		function truncateAddress(addr) {
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		// Wallet detection using @mysten/wallet-standard with window fallback
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
										if (wallet.connect) {
											return await wallet.connect();
										}
										if (wallet.requestPermissions) {
											return await wallet.requestPermissions();
										}
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

		// Show wallet modal
		connectBtn.addEventListener('click', async () => {
			walletsModal.classList.add('open');
			walletList.innerHTML = '<div class="status info"><span class="loading"></span> Detecting wallets...</div>';

			const wallets = await detectWallets();

			if (wallets.length === 0) {
				walletList.innerHTML = \`
					<div class="status error">
						No Sui wallets detected. Please install a wallet extension.
						<br><br>
						<a href="https://phantom.app/download" target="_blank" style="color: var(--accent);">
							Install Phantom →
						</a>
						<br>
						<a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank" style="color: var(--accent);">
							Install Sui Wallet →
						</a>
					</div>
				\`;
				return;
			}

			walletList.innerHTML = '';
			for (const wallet of wallets) {
				const item = document.createElement('div');
				item.className = 'wallet-item';
				// Handle icon - can be string URL or data URI
				const iconSrc = wallet.icon || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><circle fill=%22%23818cf8%22 cx=%2216%22 cy=%2216%22 r=%2216%22/></svg>';
				item.innerHTML = \`
					<img class="wallet-icon" src="\${iconSrc}" alt="\${wallet.name}" onerror="this.style.display='none'">
					<span class="wallet-name">\${wallet.name}</span>
				\`;
				item.addEventListener('click', () => connectToWallet(wallet));
				walletList.appendChild(item);
			}
		});

		closeModal.addEventListener('click', () => {
			walletsModal.classList.remove('open');
		});

		walletsModal.addEventListener('click', (e) => {
			if (e.target === walletsModal) {
				walletsModal.classList.remove('open');
			}
		});

		// Check if connected wallet owns the SuiNS name
		async function checkOwnership() {
			if (!currentAccount) {
				ownsName = false;
				updateRegisterButton();
				return;
			}

			try {
				const addr = currentAccount.address || currentAccount;
				const addrStr = typeof addr === 'string' ? addr : addr.toString();

				const suiClient = new SuiClient({ url: RPC_URL });
				const suinsClient = new SuinsClient({
					client: suiClient,
					network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
				});

				// Get the name record
				const nameRecord = await suinsClient.getNameRecord(NAME + '.sui');
				if (!nameRecord || !nameRecord.nftId) {
					ownsName = false;
					updateRegisterButton();
					return;
				}

				// Check if the connected wallet owns the NFT
				const nftObj = await suiClient.getObject({
					id: nameRecord.nftId,
					options: { showOwner: true }
				});

				if (nftObj?.data?.owner && typeof nftObj.data.owner === 'object') {
					let ownerAddress = null;
					if ('AddressOwner' in nftObj.data.owner) {
						ownerAddress = nftObj.data.owner.AddressOwner;
					} else if ('ObjectOwner' in nftObj.data.owner) {
						ownerAddress = nftObj.data.owner.ObjectOwner;
					}

					ownsName = ownerAddress === addrStr;
				} else {
					ownsName = false;
				}

				updateRegisterButton();
			} catch (e) {
				console.log('Failed to check ownership:', e);
				ownsName = false;
				updateRegisterButton();
			}
		}

		// Update register button visibility based on ownership
		function updateRegisterButton() {
			if (ownsName) {
				registerBtn.classList.add('hidden');
				showStatus('You already own this name!', 'success');
			} else {
				registerBtn.classList.remove('hidden');
			}
		}

		async function connectToWallet(wallet) {
			try {
				walletsModal.classList.remove('open');
				showStatus('<span class="loading"></span> Connecting to ' + wallet.name + '...', 'info');

				// Use standard:connect feature
				const connectFeature = wallet.features?.['standard:connect'];
				if (!connectFeature) {
					throw new Error('Wallet does not support connection');
				}

				const result = await connectFeature.connect();

				// Get accounts - try multiple approaches
				let accounts = wallet.accounts;
				if ((!accounts || accounts.length === 0) && result?.accounts) {
					accounts = result.accounts;
				}

				if (!accounts || accounts.length === 0) {
					throw new Error('No accounts available. Please unlock your wallet and try again.');
				}

				currentAccount = accounts[0];
				connectedWallet = wallet;

				// Update UI
				const addr = currentAccount.address || currentAccount;
				const addrStr = typeof addr === 'string' ? addr : addr.toString();
				walletAddress.textContent = truncateAddress(addrStr);
				walletInfo.classList.remove('hidden');
				connectBtn.classList.add('hidden');
				hideStatus();

				// Try to resolve primary SuiNS name via GraphQL
				try {
					const gqlRes = await fetch('https://sui-mainnet.mystenlabs.com/graphql', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							query: \`query { address(address: "\${addrStr}") { defaultSuinsName } }\`
						})
					});
					if (gqlRes.ok) {
						const gqlData = await gqlRes.json();
						const suinsName = gqlData?.data?.address?.defaultSuinsName;
						if (suinsName) {
							walletAddress.textContent = suinsName;
						}
					}
				} catch (e) {
					// Keep truncated address on error
				}

				// Check if user owns the name
				await checkOwnership();

				showStatus('Connected to ' + wallet.name, 'success');
				setTimeout(hideStatus, 2000);
			} catch (error) {
				console.error('Wallet connection error:', error);
				showStatus('Failed to connect: ' + (error.message || 'Unknown error'), 'error');
			}
		}

		disconnectBtn.addEventListener('click', async () => {
			try {
				const disconnectFeature = connectedWallet?.features?.['standard:disconnect'];
				if (disconnectFeature) {
					await disconnectFeature.disconnect();
				}
			} catch (e) {
				// Ignore disconnect errors
			}

			connectedWallet = null;
			currentAccount = null;
			ownsName = false;
			walletInfo.classList.add('hidden');
			connectBtn.classList.remove('hidden');
			registerBtn.classList.add('hidden');
			hideStatus();
		});

		// Registration - execute transaction directly
		registerBtn.addEventListener('click', async () => {
			if (!connectedWallet || !currentAccount) {
				showStatus('Please connect your wallet first', 'error');
				return;
			}

			try {
				showStatus('<span class="loading"></span> Building registration transaction...', 'info');
				registerBtn.disabled = true;

				// Initialize Sui client and SuiNS client
				const suiClient = new SuiClient({ url: RPC_URL });
				const suinsClient = new SuinsClient({
					client: suiClient,
					network: NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
				});

				// Get the sender address
				const senderAddress = typeof currentAccount.address === 'string'
					? currentAccount.address
					: currentAccount.address?.toString() || currentAccount.toString();

				// Build registration transaction using SuinsTransaction
				const tx = new Transaction();
				const suinsTx = new SuinsTransaction(suinsClient, tx);

				// Use SUI for payment
				const coinConfig = suinsClient.config.coins.SUI;

				// Get price info object (required for SUI payments via Pyth oracle)
				const priceInfoResult = await suinsClient.getPriceInfoObject(tx, coinConfig.feed);
				const priceInfoObjectId = priceInfoResult[0];

				// Register the name - SDK handles coin splitting internally
				// Pass tx.gas as the coin source, SDK will split the required amount
				const nft = suinsTx.register({
					domain: NAME + '.sui',
					years: selectedYears,
					coinConfig,
					coin: tx.gas,
					priceInfoObjectId
				});

				// Transfer the NFT to the sender
				tx.transferObjects([nft], senderAddress);

				tx.setSender(senderAddress);

				showStatus('<span class="loading"></span> Please approve the transaction in your wallet...', 'info');

				const chain = NETWORK === 'mainnet' ? 'sui:mainnet' : 'sui:testnet';

				// Build the transaction
				const builtTxBytes = await tx.build({ client: suiClient });

				// Create a wrapper object that satisfies wallet's interface requirements
				const txWrapper = {
					_bytes: builtTxBytes,
					toJSON() {
						// Return base64 encoded bytes
						return btoa(String.fromCharCode.apply(null, this._bytes));
					},
					serialize() {
						return this._bytes;
					}
				};

				// Try signing and executing
				let result;
				const signExecFeature = connectedWallet.features?.['sui:signAndExecuteTransaction'];
				const signFeature = connectedWallet.features?.['sui:signTransaction'];

				if (signExecFeature?.signAndExecuteTransaction) {
					try {
						result = await signExecFeature.signAndExecuteTransaction({
							transaction: txWrapper,
							account: currentAccount,
							chain
						});
					} catch (e) {
						console.log('signAndExecuteTransaction failed:', e.message);
					}
				}

				// Fallback: sign then execute separately
				if (!result && signFeature?.signTransaction) {
					try {
						const { signature } = await signFeature.signTransaction({
							transaction: txWrapper,
							account: currentAccount,
							chain
						});

						// Execute via RPC
						const executeResult = await suiClient.executeTransactionBlock({
							transactionBlock: builtTxBytes,
							signature: signature,
							options: { showEffects: true }
						});
						result = { digest: executeResult.digest };
					} catch (e) {
						console.log('signTransaction failed:', e.message);
					}
				}

				if (!result) {
					throw new Error('Could not sign transaction. Please try using SuiNS directly.');
				}

				console.log('Transaction result:', result);

				showStatus(\`
					<strong>✓ Registration successful!</strong><br><br>
					<a href="https://suiscan.xyz/\${NETWORK}/tx/\${result.digest}" target="_blank" style="color: var(--accent);">
						View transaction →
					</a><br><br>
					Your name <strong>\${NAME}.sui</strong> is now registered!
				\`, 'success');

				registerBtn.textContent = 'Registered!';
				registerBtn.disabled = true;

			} catch (error) {
				console.error('Registration error:', error);

				// Provide helpful error messages
				let errorMessage = error.message || 'Unknown error';
				if (errorMessage.includes('Insufficient')) {
					errorMessage = 'Insufficient SUI balance to complete registration';
				} else if (errorMessage.includes('rejected') || errorMessage.includes('cancelled')) {
					errorMessage = 'Transaction was cancelled';
				}

				showStatus('Registration failed: ' + errorMessage, 'error');
				registerBtn.disabled = false;
			}
		});

		// Initialize
		updateYearDisplay();

		// Fetch dictionary definition
		async function fetchDictionary() {
			const contentEl = document.getElementById('dictionary-content');
			const badgeEl = document.getElementById('dictionary-badge');
			const boxEl = document.getElementById('dictionary-box');

			try {
				const response = await fetch(\`https://api.dictionaryapi.dev/api/v2/entries/en/\${NAME}\`);
				if (!response.ok) throw new Error('Not found');
				const data = await response.json();

				if (data && data[0]) {
					const entry = data[0];
					const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';

					let meaningsHtml = '<div class="preview-meanings">';
					let totalDefs = 0;

					for (const meaning of entry.meanings || []) {
						const pos = meaning.partOfSpeech || 'unknown';

						for (const def of (meaning.definitions || []).slice(0, 2)) {
							totalDefs++;
							meaningsHtml += \`<div class="preview-meaning">
								<div class="preview-pos">\${pos}</div>
								<div class="preview-def">\${def.definition}</div>
								\${def.example ? \`<div class="preview-example">"\${def.example}"</div>\` : ''}
							</div>\`;
						}

						// Add synonyms if available
						if (meaning.synonyms && meaning.synonyms.length > 0) {
							meaningsHtml += '<div class="preview-synonyms">';
							for (const syn of meaning.synonyms.slice(0, 5)) {
								meaningsHtml += \`<span class="preview-synonym">\${syn}</span>\`;
							}
							meaningsHtml += '</div>';
						}
					}
					meaningsHtml += '</div>';

					contentEl.innerHTML = \`
						<div class="preview-word">\${entry.word}</div>
						\${phonetic ? \`<div class="preview-phonetic">\${phonetic}</div>\` : ''}
						\${meaningsHtml}
						<div class="preview-meta">
							<div class="preview-meta-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
								\${totalDefs} definition\${totalDefs !== 1 ? 's' : ''}
							</div>
							<div class="preview-meta-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
								Free Dictionary API
							</div>
						</div>
					\`;
					badgeEl.textContent = 'Found';
					badgeEl.className = 'preview-badge found';
				} else {
					throw new Error('No definition');
				}
			} catch (e) {
				// Collapse content but keep header visible
				badgeEl.textContent = 'Not Found';
				badgeEl.className = 'preview-badge not-found';
				contentEl.classList.add('hidden');
			}
		}

		// Fetch Grokipedia article
		async function fetchGrokipedia() {
			const contentEl = document.getElementById('grokipedia-content');
			const badgeEl = document.getElementById('grokipedia-badge');
			const boxEl = document.getElementById('grokipedia-box');
			const grokipediaUrl = \`https://grokipedia.com/wiki/\${encodeURIComponent(NAME)}\`;

			try {
				// Fetch from our API endpoint
				const apiUrl = \`\${window.location.origin}/api/grokipedia?name=\${encodeURIComponent(NAME)}\`;
				const response = await fetch(apiUrl);
				if (!response.ok) throw new Error('Not found');
				const data = await response.json();

				if (data && data.found && data.excerpt) {
					const title = data.title || NAME;
					const excerpt = data.excerpt;

					contentEl.innerHTML = \`
						<div class="preview-article-title">\${title}</div>
						<div class="preview-article-extract">\${excerpt}\${excerpt.length >= 500 ? '...' : ''}</div>
						<div class="preview-meta">
							<div class="preview-meta-item">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
								\${excerpt.length} characters
							</div>
						</div>
						<a href="\${grokipediaUrl}" target="_blank" class="preview-link">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
							View full article on Grokipedia
						</a>
					\`;
					badgeEl.textContent = 'Found';
					badgeEl.className = 'preview-badge found';
				} else {
					throw new Error('No article');
				}
			} catch (e) {
				// Collapse content but keep header visible
				badgeEl.textContent = 'Not Found';
				badgeEl.className = 'preview-badge not-found';
				contentEl.classList.add('hidden');
			}
		}

		// Load info widgets
		fetchDictionary();
		fetchGrokipedia();

		// Search panel functionality
		const searchPanel = document.getElementById('search-panel');
		const searchOverlay = document.getElementById('search-overlay');
		const openSearchBtn = document.getElementById('open-search');
		const closeSearchBtn = document.getElementById('close-search');
		const searchInput = document.getElementById('search-input');
		const searchBtn = document.getElementById('search-btn');

		function openSearch() {
			searchPanel.classList.add('open');
			searchOverlay.classList.add('open');
			searchInput.focus();
		}

		function closeSearch() {
			searchPanel.classList.remove('open');
			searchOverlay.classList.remove('open');
		}

		openSearchBtn.addEventListener('click', openSearch);
		closeSearchBtn.addEventListener('click', closeSearch);
		searchOverlay.addEventListener('click', closeSearch);

		function navigateToName() {
			let name = searchInput.value.trim().toLowerCase();
			if (!name) return;
			name = name.replace(/\\.sui$/i, '');
			name = name.replace(/[^a-z0-9-]/g, '');
			if (name) {
				window.location.href = 'https://' + name + '.sui.ski';
			}
		}

		searchBtn.addEventListener('click', navigateToName);
		searchInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') navigateToName();
		});
	</script>
	`
			: ''
	}
</body>
</html>`
}
