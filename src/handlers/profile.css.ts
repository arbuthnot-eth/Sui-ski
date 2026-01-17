// Auto-extracted CSS for profile page
// This keeps the main profile.ts file focused on HTML generation

export const profileStyles = `
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

		/* Custom Scrollbar Styles - Black track with SuiNS blue gradient */
		* {
			scrollbar-width: thin;
			scrollbar-color: #60a5fa #000000;
		}
		*::-webkit-scrollbar {
			width: 6px;
			height: 6px;
		}
		*::-webkit-scrollbar-track {
			background: #000000;
		}
		*::-webkit-scrollbar-thumb {
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			border-radius: 3px;
		}
		*::-webkit-scrollbar-thumb:hover {
			background: linear-gradient(135deg, #7ab8ff, #b99cff);
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
			gap: 24px;
			align-items: flex-start;
			margin-bottom: 20px;
		}
		.identity-card {
			width: 180px;
			background: linear-gradient(145deg, #080c1a 0%, #050818 100%);
			border-radius: 20px;
			overflow: hidden;
			box-shadow:
				0 20px 50px rgba(59, 130, 246, 0.25),
				0 0 0 1px rgba(96, 165, 250, 0.15),
				inset 0 1px 0 rgba(255, 255, 255, 0.05);
			position: relative;
			flex-shrink: 0;
			transition: transform 0.3s ease, box-shadow 0.3s ease;
		}
		.identity-card:hover {
			transform: translateY(-4px);
			box-shadow:
				0 28px 60px rgba(59, 130, 246, 0.35),
				0 0 0 1px rgba(96, 165, 250, 0.25),
				inset 0 1px 0 rgba(255, 255, 255, 0.08);
		}
		.identity-visual {
			position: relative;
			aspect-ratio: 1;
			background: linear-gradient(135deg, #0a1628 0%, #050818 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border-radius: 16px;
			margin: 4px;
		}
		.identity-visual::before {
			content: '';
			position: absolute;
			inset: -2px;
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(167, 139, 250, 0.3));
			border-radius: 18px;
			opacity: 0;
			transition: opacity 0.3s ease;
			z-index: -1;
		}
		.identity-card:hover .identity-visual::before {
			opacity: 1;
		}
		.identity-visual img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			position: absolute;
			top: 0;
			left: 0;
			border-radius: 14px;
			transition: transform 0.3s ease;
		}
		.identity-card:hover .identity-visual img {
			transform: scale(1.02);
		}
		.identity-visual canvas {
			width: 85%;
			height: 85%;
			border-radius: 10px;
		}
		/* Loading shimmer for identity visual */
		.identity-visual.loading::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.1), transparent);
			animation: shimmer 1.5s infinite;
		}
		@keyframes shimmer {
			0% { transform: translateX(-100%); }
			100% { transform: translateX(100%); }
		}
		.identity-description {
			padding: 24px;
			text-align: center;
			color: var(--text);
			font-size: 0.95rem;
			line-height: 1.6;
			display: flex;
			align-items: center;
			justify-content: center;
			min-height: 100%;
		}
		.identity-description p {
			margin: 0;
			color: rgba(228, 228, 231, 0.9);
			font-style: italic;
		}
		.identity-description.loading {
			color: var(--text-muted);
			font-style: normal;
		}
		.identity-qr-toggle {
			position: absolute;
			bottom: 10px;
			left: 10px;
			right: auto;
			width: 36px;
			height: 36px;
			background: rgba(5, 8, 24, 0.85);
			border: 1px solid rgba(96, 165, 250, 0.35);
			border-radius: 10px;
			cursor: pointer;
			display: none;
			align-items: center;
			justify-content: center;
			transition: all 0.25s ease;
			z-index: 2;
			backdrop-filter: blur(8px);
		}
		.identity-qr-toggle:hover {
			background: rgba(96, 165, 250, 0.25);
			border-color: var(--accent);
			transform: scale(1.05);
		}
		.identity-qr-toggle svg {
			width: 18px;
			height: 18px;
			color: var(--accent);
			transition: transform 0.2s ease;
		}
		.identity-qr-toggle:hover svg {
			transform: scale(1.1);
		}
		.identity-qr-toggle.active {
			background: linear-gradient(135deg, var(--accent), #a78bfa);
			border-color: transparent;
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
			padding: 12px 10px;
			background: linear-gradient(to top, rgba(96, 165, 250, 0.08), transparent);
			border-top: 1px solid rgba(96, 165, 250, 0.15);
		}
		.identity-name {
			text-align: center;
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.7rem;
			font-weight: 600;
			color: var(--accent);
			background: rgba(96, 165, 250, 0.1);
			padding: 6px 10px;
			border-radius: 6px;
			cursor: pointer;
			transition: all 0.2s ease;
			letter-spacing: 0.02em;
		}
		.identity-name:hover {
			background: rgba(96, 165, 250, 0.2);
			color: var(--accent-hover);
		}
		.identity-name.copied {
			background: rgba(52, 211, 153, 0.2);
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
			margin-bottom: 20px;
			padding-bottom: 20px;
			border-bottom: 1px solid var(--border);
		}
		.header-top {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 12px;
			flex-wrap: wrap;
		}
		h1 {
			font-size: 1.75rem;
			font-weight: 800;
			color: var(--text);
			letter-spacing: -0.04em;
			margin: 0;
			word-break: break-all;
			line-height: 1.2;
		}
		h1 .suffix {
			background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #60a5fa 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: gradient-shift 3s ease infinite;
		}
		@keyframes gradient-shift {
			0%, 100% { background-position: 0% center; }
			50% { background-position: 100% center; }
		}
		.name-site-link {
			color: inherit;
			text-decoration: none;
			display: inline-flex;
			align-items: center;
			gap: 6px;
			transition: opacity 0.2s;
		}
		.name-site-link:hover { opacity: 0.8; }
		.name-site-link .site-arrow {
			width: 20px;
			height: 20px;
			color: var(--accent);
			flex-shrink: 0;
		}
		.badge {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			padding: 5px 12px;
			border-radius: 20px;
			font-size: 0.65rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			white-space: nowrap;
			transition: all 0.2s ease;
		}
		.badge.network {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15));
			color: var(--accent);
			border: 1px solid rgba(96, 165, 250, 0.25);
		}
		.badge.expiry {
			background: rgba(34, 197, 94, 0.12);
			color: #22c55e;
			border: 1px solid rgba(34, 197, 94, 0.25);
		}
		.badge.expiry.warning {
			background: rgba(251, 191, 36, 0.12);
			color: #fbbf24;
			border: 1px solid rgba(251, 191, 36, 0.25);
			animation: pulse-warning 2s infinite;
		}
		@keyframes pulse-warning {
			0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.3); }
			50% { box-shadow: 0 0 12px 2px rgba(251, 191, 36, 0.2); }
		}
		.badge.expiry.danger {
			background: rgba(248, 113, 113, 0.12);
			color: #f87171;
			border: 1px solid rgba(248, 113, 113, 0.25);
			animation: pulse-danger 1.5s infinite;
		}
		@keyframes pulse-danger {
			0%, 100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.3); }
			50% { box-shadow: 0 0 12px 2px rgba(248, 113, 113, 0.25); }
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
			transition: background 0.2s, border-color 0.2s;
		}
		.wallet-bar .wallet-status:hover {
			background: var(--accent);
			border-color: var(--accent);
		}
		.wallet-bar .wallet-status:hover .wallet-addr {
			color: var(--bg);
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

		/* NFTs Section */
		.nfts-section {
			width: 100%;
		}
		.nfts-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;
		}
		.nfts-title {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.nfts-title svg {
			width: 20px;
			height: 20px;
			color: var(--accent);
		}
		.nfts-title h3 {
			margin: 0;
			font-size: 1.1rem;
			font-weight: 600;
			color: var(--text);
		}
		.nfts-count {
			font-size: 0.875rem;
			color: var(--text-muted);
			font-weight: 500;
		}
		.nfts-loading {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 40px;
			justify-content: center;
			color: var(--text-muted);
		}
		.nfts-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
			gap: 20px;
		}
		.nft-card {
			background: linear-gradient(145deg, rgba(22, 22, 30, 0.95), rgba(15, 15, 22, 0.95));
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 16px;
			overflow: hidden;
			transition: all 0.3s ease;
			cursor: pointer;
			position: relative;
		}
		.nft-card:hover {
			border-color: rgba(96, 165, 250, 0.4);
			transform: translateY(-6px) scale(1.02);
			box-shadow:
				0 20px 40px rgba(0, 0, 0, 0.4),
				0 0 0 1px rgba(96, 165, 250, 0.2),
				0 0 30px rgba(96, 165, 250, 0.15);
		}
		.nft-card.current {
			border-color: rgba(96, 165, 250, 0.3);
			box-shadow: 0 0 20px rgba(96, 165, 250, 0.1);
		}
		.nft-card-image-wrapper {
			position: relative;
			aspect-ratio: 1;
			background: linear-gradient(135deg, #0a1628 0%, #050818 100%);
			overflow: hidden;
		}
		.nft-card-image {
			width: 100%;
			height: 100%;
			object-fit: cover;
			transition: transform 0.3s ease;
		}
		.nft-card:hover .nft-card-image {
			transform: scale(1.05);
		}
		.nft-card-fallback {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15));
		}
		.nft-card-initial {
			font-size: 3rem;
			font-weight: 800;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.nft-card-current-badge {
			position: absolute;
			top: 10px;
			right: 10px;
			padding: 4px 10px;
			background: rgba(96, 165, 250, 0.9);
			color: white;
			border-radius: 6px;
			font-size: 0.65rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			backdrop-filter: blur(8px);
		}
		.nft-card-info {
			padding: 14px 16px;
		}
		.nft-card-name {
			margin-bottom: 10px;
		}
		.nft-card-name .domain {
			font-size: 1rem;
			font-weight: 700;
			color: var(--text);
			display: block;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.nft-card-name .suffix {
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			font-weight: 600;
		}
		.nft-card-details {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}
		.nft-card-expiry {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.nft-card-expiry svg {
			opacity: 0.7;
		}
		.nft-card-expiry.warning {
			color: var(--warning);
		}
		.nft-card-expiry.expired {
			color: var(--error);
		}
		.nft-card-expiry.premium {
			color: var(--accent);
		}
		.nft-card-explorer-link {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 0.75rem;
			color: var(--text-muted);
			text-decoration: none;
			transition: color 0.2s;
		}
		.nft-card-explorer-link:hover {
			color: var(--accent);
		}

		/* Grace Period Banner */
		.grace-period-banner {
			display: flex;
			align-items: flex-start;
			gap: 16px;
			margin-top: 24px;
			padding: 20px;
			background: linear-gradient(135deg, rgba(248, 113, 113, 0.08) 0%, rgba(251, 191, 36, 0.06) 100%);
			border: 1px solid rgba(248, 113, 113, 0.25);
			border-radius: 12px;
			animation: pulse-danger 2s infinite;
		}
		.grace-period-icon {
			flex-shrink: 0;
			width: 40px;
			height: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(248, 113, 113, 0.15);
			border-radius: 10px;
		}
		.grace-period-icon svg {
			width: 22px;
			height: 22px;
			color: var(--error);
		}
		.grace-period-content {
			flex: 1;
			min-width: 0;
		}
		.grace-period-title {
			font-size: 1rem;
			font-weight: 600;
			color: var(--error);
			margin-bottom: 6px;
		}
		.grace-period-text {
			font-size: 0.875rem;
			color: var(--text-muted);
			line-height: 1.5;
		}
		.grace-period-text strong {
			color: var(--text);
		}
		.grace-period-text code {
			background: rgba(96, 165, 250, 0.1);
			padding: 2px 6px;
			border-radius: 4px;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			color: var(--accent);
		}
		.grace-period-text a {
			color: var(--accent);
			text-decoration: none;
		}
		.grace-period-text a:hover {
			text-decoration: underline;
		}
		.grace-period-countdown {
			margin-top: 16px;
			padding-top: 16px;
			border-top: 1px solid rgba(248, 113, 113, 0.15);
		}
		.grace-countdown-label {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 8px;
		}
		.grace-countdown-timer {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.grace-countdown-unit {
			display: flex;
			flex-direction: column;
			align-items: center;
			min-width: 48px;
		}
		.grace-countdown-value {
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--error);
			font-family: var(--font-mono, monospace);
			line-height: 1;
		}
		.grace-countdown-unit-label {
			font-size: 0.65rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.03em;
			margin-top: 2px;
		}
		.grace-countdown-separator {
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--text-muted);
			opacity: 0.5;
			line-height: 1;
			margin-bottom: 14px;
		}
		/* Top Offers Section */
		.grace-top-offers {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.05));
			border: 1px solid rgba(251, 191, 36, 0.2);
			border-radius: 12px;
			padding: 12px;
			margin-bottom: 12px;
			min-height: 80px;
		}
		.grace-offers-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			color: var(--text-muted);
			font-size: 0.8rem;
			padding: 20px;
		}
		.loading-spinner {
			width: 16px;
			height: 16px;
			border: 2px solid var(--border);
			border-top-color: var(--warning);
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
		@keyframes spin {
			to { transform: rotate(360deg); }
		}
		.grace-offers-empty {
			text-align: center;
			color: var(--text-muted);
			font-size: 0.8rem;
			padding: 16px;
		}
		.grace-offer-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px 12px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 8px;
			margin-bottom: 8px;
		}
		.grace-offer-item:last-child {
			margin-bottom: 0;
		}
		.grace-offer-left {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.grace-offer-type {
			font-size: 0.65rem;
			font-weight: 700;
			text-transform: uppercase;
			padding: 3px 6px;
			border-radius: 4px;
		}
		.grace-offer-type.bid {
			background: rgba(96, 165, 250, 0.2);
			color: var(--accent);
		}
		.grace-offer-type.bounty {
			background: rgba(251, 191, 36, 0.2);
			color: var(--warning);
		}
		.grace-offer-amount {
			font-size: 0.95rem;
			font-weight: 700;
			color: var(--text);
		}
		.grace-offer-usd {
			font-size: 0.75rem;
			color: var(--text-muted);
			margin-left: 6px;
		}
		.grace-offer-right {
			text-align: right;
		}
		.grace-offer-bidder {
			font-size: 0.7rem;
			color: var(--text-muted);
			font-family: var(--font-mono, monospace);
		}
		.grace-offer-status {
			font-size: 0.6rem;
			font-weight: 600;
			text-transform: uppercase;
			padding: 2px 5px;
			border-radius: 3px;
			margin-top: 4px;
			display: inline-block;
		}
		.grace-offer-status.ready {
			background: rgba(34, 197, 94, 0.2);
			color: var(--success);
		}
		.grace-offer-status.pending {
			background: rgba(251, 191, 36, 0.2);
			color: var(--warning);
		}
		.grace-countdown-mini {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 8px 12px;
			background: rgba(239, 68, 68, 0.1);
			border: 1px solid rgba(239, 68, 68, 0.2);
			border-radius: 8px;
			margin-bottom: 12px;
		}
		.grace-countdown-mini-label {
			font-size: 0.7rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}
		.grace-countdown-mini-timer {
			font-family: var(--font-mono, monospace);
			font-size: 0.85rem;
			font-weight: 700;
			color: var(--error);
		}
		.grace-countdown-mini-timer span {
			color: var(--error);
		}
		.grace-skill-counter {
			margin-top: 14px;
			padding: 12px 14px;
			background: rgba(96, 165, 250, 0.08);
			border: 1px dashed rgba(96, 165, 250, 0.3);
			border-radius: 10px;
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.grace-skill-label {
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--accent);
		}
		.grace-skill-value {
			display: flex;
			align-items: baseline;
			gap: 6px;
			font-family: var(--font-mono, SFMono-Regular, monospace);
			font-size: 1.35rem;
			font-weight: 700;
			color: var(--accent);
		}
		.grace-skill-unit {
			font-size: 0.75rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.grace-skill-hint {
			font-size: 0.7rem;
			color: var(--text-muted);
			line-height: 1.4;
		}
		.grace-skill-usd {
			font-size: 0.85rem;
			color: var(--text-muted);
			font-family: var(--font-mono, SFMono-Regular, monospace);
		}
		.premium-graph-container {
			margin: 10px 0;
			position: relative;
			cursor: crosshair;
		}
		.premium-decay-graph {
			width: 100%;
			height: 80px;
			border-radius: 6px;
			background: rgba(0, 0, 0, 0.2);
			overflow: visible;
		}
		.graph-grid {
			stroke: rgba(255, 255, 255, 0.1);
			stroke-width: 1;
			stroke-dasharray: 4 4;
		}
		.decay-area {
			fill: url(#decayGradient);
		}
		.decay-curve {
			fill: none;
			stroke: var(--accent);
			stroke-width: 2;
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		.decay-marker {
			fill: var(--accent);
			stroke: var(--bg);
			stroke-width: 2;
			filter: drop-shadow(0 0 4px var(--accent));
			transition: cx 0.3s ease, cy 0.3s ease;
		}
		.decay-marker-line {
			stroke: var(--accent);
			stroke-width: 1;
			stroke-dasharray: 3 3;
			opacity: 0.5;
			transition: x1 0.3s ease, y1 0.3s ease, x2 0.3s ease;
		}
		/* NS (SuiNS) decay curve styles */
		.ns-decay-area {
			fill: url(#nsDecayGradient);
		}
		.ns-decay-curve {
			fill: none;
			stroke: #4DA2FF;
			stroke-width: 2;
			stroke-linecap: round;
			stroke-linejoin: round;
			stroke-dasharray: 6 3;
		}
		.ns-decay-marker {
			fill: #4DA2FF;
			stroke: var(--bg);
			stroke-width: 2;
			filter: drop-shadow(0 0 4px #4DA2FF);
			transition: cx 0.3s ease, cy 0.3s ease;
		}
		.decay-hover-path,
		.ns-decay-hover-path {
			fill: none;
			stroke-width: 2.5;
			stroke-linecap: round;
			stroke-linejoin: round;
			opacity: 0.4;
			transition: opacity 0.15s ease;
		}
		.decay-hover-path {
			stroke: var(--accent);
			filter: drop-shadow(0 0 6px rgba(96, 165, 250, 0.45));
		}
		.ns-decay-hover-path {
			stroke: #4DA2FF;
			filter: drop-shadow(0 0 6px rgba(77, 162, 255, 0.4));
		}
		.premium-graph-container.hovering .decay-hover-path,
		.premium-graph-container.hovering .ns-decay-hover-path {
			opacity: 1;
		}
		.graph-labels {
			display: flex;
			justify-content: space-between;
			font-size: 0.65rem;
			color: var(--text-muted);
			margin-top: 4px;
			padding: 0 2px;
		}
		.graph-time-labels {
			display: flex;
			justify-content: space-between;
			font-size: 0.6rem;
			color: var(--text-muted);
			opacity: 0.7;
			padding: 0 2px;
		}
		/* Premium values grid */
		.premium-values-grid {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin-top: 12px;
		}
		.premium-value-row {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.premium-currency-badge {
			font-size: 0.7rem;
			font-weight: 700;
			padding: 3px 8px;
			border-radius: 4px;
			text-transform: uppercase;
			letter-spacing: 0.03em;
			min-width: 42px;
			text-align: center;
		}
		.sui-badge {
			background: rgba(96, 165, 250, 0.2);
			color: var(--accent);
			border: 1px solid rgba(96, 165, 250, 0.3);
		}
		.ns-badge {
			background: rgba(77, 162, 255, 0.2);
			color: #4DA2FF;
			border: 1px solid rgba(77, 162, 255, 0.3);
		}
		.premium-value {
			font-family: var(--font-mono, SFMono-Regular, monospace);
			font-size: 1.1rem;
			font-weight: 700;
			color: var(--text);
		}
		.sui-row .premium-value {
			color: var(--accent);
		}
		.ns-row .premium-value {
			color: #4DA2FF;
		}
		.premium-usd {
			font-size: 0.8rem;
			color: var(--text-muted);
			font-family: var(--font-mono, SFMono-Regular, monospace);
		}
		.premium-discount {
			font-size: 0.7rem;
			color: #4DA2FF;
			opacity: 0.8;
			font-style: italic;
		}
		.premium-hover-time strong {
			color: var(--text);
		}
		.grace-period-actions {
			flex-shrink: 0;
			display: flex;
			gap: 10px;
		}
		.grace-period-btn {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 10px 18px;
			border-radius: 8px;
			font-size: 0.875rem;
			font-weight: 600;
			text-decoration: none;
			transition: all 0.2s;
			cursor: pointer;
			border: none;
		}
		.grace-period-btn svg {
			width: 16px;
			height: 16px;
		}
		.grace-period-btn.renew {
			background: linear-gradient(135deg, #22c55e, #16a34a);
			color: white;
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.25);
		}
		.grace-period-btn.renew:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
		}
		.grace-period-btn.gift {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
		}
		.grace-period-btn.gift:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
		}
		.grace-period-btn.gift:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none;
		}
		.grace-period-status {
			display: none;
			margin-top: 12px;
			padding: 10px 14px;
			border-radius: 8px;
			font-size: 0.85rem;
			line-height: 1.4;
		}
		.grace-period-status.success {
			background: rgba(34, 197, 94, 0.12);
			border: 1px solid rgba(34, 197, 94, 0.3);
			color: #22c55e;
		}
		.grace-period-status.error {
			background: rgba(248, 113, 113, 0.12);
			border: 1px solid rgba(248, 113, 113, 0.3);
			color: #f87171;
		}
		.grace-period-status a {
			color: inherit;
			text-decoration: underline;
		}
		.grace-period-status small {
			display: block;
			margin-top: 4px;
			opacity: 0.8;
		}
		@media (max-width: 640px) {
			.grace-period-banner {
				flex-direction: column;
				gap: 12px;
			}
			.grace-period-actions {
				width: 100%;
			}
			.grace-period-btn {
				flex: 1;
				justify-content: center;
			}
			.grace-countdown-unit {
				min-width: 40px;
			}
			.grace-countdown-value {
				font-size: 1.25rem;
			}
		}

		/* NFT Details Section */
		.nft-details-section {
			margin-top: 32px;
			padding: 24px;
			background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%);
			border-radius: 16px;
			border: 1px solid rgba(96, 165, 250, 0.1);
			backdrop-filter: blur(10px);
		}
		.nft-details-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 24px;
			padding-bottom: 16px;
			border-bottom: 1px solid rgba(96, 165, 250, 0.1);
		}
		.nft-details-header-actions {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.nft-details-title {
			display: flex;
			align-items: center;
			gap: 12px;
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--text);
		}
		.nft-details-title svg {
			width: 28px;
			height: 28px;
			color: var(--accent);
		}
		.nft-details-refresh {
			padding: 8px 16px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 8px;
			color: var(--accent);
			cursor: pointer;
			font-size: 0.875rem;
			font-weight: 600;
			transition: all 0.2s;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.nft-details-refresh:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: rgba(96, 165, 250, 0.4);
		}
		.nft-details-refresh:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.nft-details-refresh svg {
			width: 16px;
			height: 16px;
		}
		.nft-details-toggle {
			padding: 8px 16px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 8px;
			color: var(--accent);
			cursor: pointer;
			font-size: 0.875rem;
			font-weight: 600;
			transition: all 0.2s;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.nft-details-toggle:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: rgba(96, 165, 250, 0.4);
		}
		.nft-details-toggle svg {
			width: 16px;
			height: 16px;
			transition: transform 0.2s;
		}
		.nft-details-toggle.expanded svg {
			transform: rotate(180deg);
		}
		.nft-details-content {
			display: none;
		}
		.nft-details-content.expanded {
			display: block;
		}
		.nft-details-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 20px;
			margin-bottom: 24px;
		}
		.nft-detail-card {
			background: rgba(15, 23, 42, 0.6);
			border: 1px solid rgba(96, 165, 250, 0.1);
			border-radius: 12px;
			padding: 20px;
			transition: all 0.3s;
		}
		.nft-detail-card:hover {
			border-color: rgba(96, 165, 250, 0.3);
			background: rgba(15, 23, 42, 0.8);
			transform: translateY(-2px);
			box-shadow: 0 8px 24px rgba(96, 165, 250, 0.1);
		}
		.nft-detail-label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--text-muted);
			margin-bottom: 8px;
		}
		.nft-detail-label svg {
			width: 14px;
			height: 14px;
			color: var(--accent);
		}
		.nft-detail-value {
			font-size: 1rem;
			font-weight: 600;
			color: var(--text);
			word-break: break-all;
			line-height: 1.5;
		}
		.nft-detail-value.mono {
			font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Source Code Pro', monospace;
			font-size: 0.875rem;
		}
		.nft-detail-value.link {
			color: var(--accent);
			text-decoration: none;
			cursor: pointer;
			transition: color 0.2s;
		}
		.nft-detail-value.link:hover {
			color: var(--accent-light);
			text-decoration: underline;
		}
		.nft-detail-value.badge {
			display: inline-block;
			padding: 4px 12px;
			background: rgba(96, 165, 250, 0.15);
			color: var(--accent);
			border-radius: 6px;
			font-size: 0.875rem;
			font-weight: 600;
		}
		.nft-details-loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 48px 24px;
			color: var(--text-muted);
		}
		.nft-details-loading .loading {
			margin-bottom: 16px;
		}
		.nft-details-error {
			padding: 24px;
			background: rgba(239, 68, 68, 0.1);
			border: 1px solid rgba(239, 68, 68, 0.2);
			border-radius: 12px;
			color: #fca5a5;
			text-align: center;
		}
		.nft-details-raw {
			margin-top: 24px;
			padding: 20px;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(96, 165, 250, 0.1);
			border-radius: 12px;
		}
		.nft-details-raw-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 16px;
		}
		.nft-details-raw-title {
			font-size: 0.875rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--text-muted);
		}
		.nft-details-raw-toggle {
			padding: 4px 12px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 6px;
			color: var(--accent);
			cursor: pointer;
			font-size: 0.75rem;
			font-weight: 600;
			transition: all 0.2s;
		}
		.nft-details-raw-toggle:hover {
			background: rgba(96, 165, 250, 0.2);
		}
		.nft-details-raw-content {
			display: none;
			font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Droid Sans Mono', 'Source Code Pro', monospace;
			font-size: 0.75rem;
			line-height: 1.6;
			color: var(--text-muted);
			background: rgba(0, 0, 0, 0.4);
			padding: 16px;
			border-radius: 8px;
			overflow-x: auto;
			max-height: 400px;
			overflow-y: auto;
		}
		.nft-details-raw-content.active {
			display: block;
		}
		.nft-details-raw-content pre {
			margin: 0;
			white-space: pre-wrap;
			word-wrap: break-word;
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

		/* ===== BID QUEUE & BOUNTY HERO SECTION ===== */
		.bid-bounty-hero {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08));
			border: 1px solid rgba(96, 165, 250, 0.25);
			border-radius: 20px;
			padding: 24px;
			margin-bottom: 24px;
			position: relative;
			overflow: hidden;
		}
		.bid-bounty-hero::before {
			content: '';
			position: absolute;
			top: -50%;
			left: -50%;
			width: 200%;
			height: 200%;
			background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1), transparent 40%),
						radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1), transparent 40%);
			pointer-events: none;
		}

		.bid-bounty-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20px;
			position: relative;
			z-index: 1;
			flex-wrap: wrap;
			gap: 12px;
		}
		.bid-bounty-title {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 1.1rem;
			font-weight: 700;
			color: var(--text);
		}
		.bid-bounty-title svg {
			width: 22px;
			height: 22px;
			color: var(--accent);
		}
		.bid-bounty-status-bar {
			display: flex;
			align-items: center;
			gap: 16px;
			flex-wrap: wrap;
		}
		.bid-bounty-status-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 5px 12px;
			border-radius: 16px;
			font-size: 0.7rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.bid-bounty-status-badge.active {
			background: rgba(34, 197, 94, 0.2);
			color: #22c55e;
			border: 1px solid rgba(34, 197, 94, 0.3);
		}
		.bid-bounty-status-badge.warning {
			background: rgba(251, 191, 36, 0.2);
			color: #fbbf24;
			border: 1px solid rgba(251, 191, 36, 0.3);
		}
		.bid-bounty-status-badge svg {
			width: 12px;
			height: 12px;
		}
		.bid-bounty-timer {
			font-size: 0.8rem;
			color: var(--text-muted);
			font-family: ui-monospace, monospace;
		}
		.bid-bounty-timer span {
			color: var(--text);
			font-weight: 600;
		}

		.bid-bounty-content {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 20px;
			position: relative;
			z-index: 1;
		}
		@media (max-width: 768px) {
			.bid-bounty-content {
				grid-template-columns: 1fr;
			}
		}

		/* Bid Queue Section */
		.bid-queue-section,
		.bounty-queue-section {
			background: rgba(20, 20, 30, 0.6);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 16px;
		}
		.bid-queue-header,
		.bounty-queue-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 12px;
		}
		.bid-queue-header h4,
		.bounty-queue-header h4 {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.9rem;
			font-weight: 700;
			color: var(--text);
			margin: 0;
		}
		.bid-queue-header h4 svg,
		.bounty-queue-header h4 svg {
			width: 16px;
			height: 16px;
			color: var(--accent);
		}
		.bid-refresh-btn,
		.bounty-refresh-btn {
			background: transparent;
			border: none;
			padding: 6px;
			cursor: pointer;
			color: var(--text-muted);
			border-radius: 8px;
			transition: all 0.2s;
		}
		.bid-refresh-btn:hover,
		.bounty-refresh-btn:hover {
			background: rgba(255, 255, 255, 0.1);
			color: var(--text);
		}
		.bid-refresh-btn svg,
		.bounty-refresh-btn svg {
			width: 16px;
			height: 16px;
		}

		.bid-queue-list,
		.bounty-queue-list {
			max-height: 180px;
			overflow-y: auto;
			margin-bottom: 12px;
		}
		.bid-queue-loading,
		.bounty-queue-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 20px;
			color: var(--text-muted);
			font-size: 0.8rem;
		}
		.bid-queue-empty,
		.bounty-queue-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 20px;
			color: var(--text-muted);
			font-size: 0.8rem;
			text-align: center;
		}
		.bid-queue-empty svg,
		.bounty-queue-empty svg {
			width: 24px;
			height: 24px;
			opacity: 0.5;
		}

		/* Bid Item */
		.bid-queue-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px 12px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 10px;
			margin-bottom: 8px;
			transition: all 0.2s;
		}
		.bid-queue-item:last-child {
			margin-bottom: 0;
		}
		.bid-queue-item:hover {
			border-color: rgba(59, 130, 246, 0.4);
		}
		.bid-queue-item.own-bid {
			border-color: rgba(34, 197, 94, 0.4);
			background: rgba(34, 197, 94, 0.08);
		}
		.bid-item-left {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.bid-item-rank {
			width: 24px;
			height: 24px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border-radius: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.7rem;
			font-weight: 700;
			color: white;
		}
		.bid-item-rank.gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); }
		.bid-item-rank.silver { background: linear-gradient(135deg, #94a3b8, #64748b); }
		.bid-item-rank.bronze { background: linear-gradient(135deg, #f97316, #ea580c); }
		.bid-item-info {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.bid-item-amount {
			font-size: 0.9rem;
			font-weight: 700;
			color: var(--text);
		}
		.bid-item-bidder {
			font-size: 0.7rem;
			color: var(--text-muted);
			font-family: ui-monospace, monospace;
		}
		.bid-item-right {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 4px;
		}
		.bid-item-usd {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.bid-item-status {
			font-size: 0.65rem;
			padding: 2px 8px;
			border-radius: 10px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.bid-item-status.pending {
			background: rgba(59, 130, 246, 0.2);
			color: #60a5fa;
		}
		.bid-item-status.queued {
			background: rgba(251, 191, 36, 0.2);
			color: #fbbf24;
		}
		.bid-item-status.submitted {
			background: rgba(34, 197, 94, 0.2);
			color: #22c55e;
		}

		/* Bounty Item */
		.bounty-queue-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px 12px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 10px;
			margin-bottom: 8px;
			transition: all 0.2s;
		}
		.bounty-queue-item:last-child {
			margin-bottom: 0;
		}
		.bounty-queue-item:hover {
			border-color: rgba(139, 92, 246, 0.4);
		}
		.bounty-item-left {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.bounty-item-icon {
			width: 24px;
			height: 24px;
			background: linear-gradient(135deg, #8b5cf6, #a855f7);
			border-radius: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.bounty-item-icon svg {
			width: 14px;
			height: 14px;
			color: white;
		}
		.bounty-item-info {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.bounty-item-amount {
			font-size: 0.9rem;
			font-weight: 700;
			color: var(--text);
		}
		.bounty-item-reward {
			font-size: 0.7rem;
			color: #a855f7;
		}
		.bounty-item-right {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 4px;
		}
		.bounty-item-beneficiary {
			font-size: 0.7rem;
			color: var(--text-muted);
			font-family: ui-monospace, monospace;
		}
		.bounty-item-status {
			font-size: 0.65rem;
			padding: 2px 8px;
			border-radius: 10px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.bounty-item-status.pending {
			background: rgba(251, 191, 36, 0.2);
			color: #fbbf24;
		}
		.bounty-item-status.ready {
			background: rgba(34, 197, 94, 0.2);
			color: #22c55e;
		}

		/* Create Bid Form */
		.create-bid-form,
		.create-bounty-quick {
			background: rgba(30, 30, 40, 0.8);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 14px;
		}
		.create-bid-header,
		.create-bounty-header {
			font-size: 0.8rem;
			font-weight: 600;
			color: var(--text);
			margin-bottom: 10px;
		}
		.create-bid-row {
			display: flex;
			gap: 10px;
		}
		.create-bid-input-group {
			flex: 1;
			display: flex;
			align-items: center;
			background: rgba(20, 20, 30, 0.8);
			border: 1px solid var(--border);
			border-radius: 10px;
			padding: 0 12px;
			transition: border-color 0.2s;
		}
		.create-bid-input-group:focus-within {
			border-color: var(--accent);
		}
		.create-bid-input-group input {
			flex: 1;
			background: transparent;
			border: none;
			padding: 10px 0;
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 600;
			width: 100%;
			min-width: 0;
		}
		.create-bid-input-group input::placeholder {
			color: var(--text-muted);
		}
		.create-bid-input-group input:focus {
			outline: none;
		}
		.bid-input-suffix,
		.bounty-input-suffix {
			font-size: 0.8rem;
			color: var(--text-muted);
			font-weight: 600;
		}
		.create-bid-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 10px 16px;
			background: linear-gradient(135deg, var(--accent), #3b82f6);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.8rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			white-space: nowrap;
		}
		.create-bid-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
		}
		.create-bid-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
			box-shadow: none;
		}
		.create-bid-btn svg {
			width: 14px;
			height: 14px;
		}
		.create-bid-info {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: 8px;
			font-size: 0.7rem;
		}
		.create-bid-usd {
			color: var(--text-muted);
		}
		.create-bid-note {
			color: var(--text-muted);
			font-style: italic;
		}
		.create-bid-status,
		.create-bounty-status {
			margin-top: 10px;
			padding: 10px;
			border-radius: 8px;
			font-size: 0.8rem;
			text-align: center;
		}
		.create-bid-status.success,
		.create-bounty-status.success {
			background: rgba(34, 197, 94, 0.15);
			color: #22c55e;
			border: 1px solid rgba(34, 197, 94, 0.3);
		}
		.create-bid-status.error,
		.create-bounty-status.error {
			background: rgba(239, 68, 68, 0.15);
			color: #ef4444;
			border: 1px solid rgba(239, 68, 68, 0.3);
		}
		.create-bid-status.loading,
		.create-bounty-status.loading {
			background: rgba(59, 130, 246, 0.15);
			color: #60a5fa;
			border: 1px solid rgba(59, 130, 246, 0.3);
		}

		/* Create Bounty Form */
		.create-bounty-row {
			display: flex;
			gap: 12px;
			align-items: flex-end;
		}
		@media (max-width: 600px) {
			.create-bounty-row {
				flex-direction: column;
				align-items: stretch;
			}
		}
		.create-bounty-inputs {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
			flex: 1;
		}
		.create-bounty-input-group {
			display: flex;
			flex-direction: column;
			gap: 4px;
			flex: 1;
			min-width: 80px;
		}
		.create-bounty-input-group label {
			font-size: 0.65rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.create-bounty-input-row {
			display: flex;
			align-items: center;
			background: rgba(20, 20, 30, 0.8);
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 0 10px;
		}
		.create-bounty-input-row:focus-within {
			border-color: #8b5cf6;
		}
		.create-bounty-input-row input {
			flex: 1;
			background: transparent;
			border: none;
			padding: 8px 0;
			color: var(--text);
			font-size: 0.85rem;
			font-weight: 600;
			width: 100%;
			min-width: 0;
		}
		.create-bounty-input-row input:focus {
			outline: none;
		}
		.create-bounty-input-group select {
			background: rgba(20, 20, 30, 0.8);
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 8px 10px;
			color: var(--text);
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
		}
		.create-bounty-input-group select:focus {
			outline: none;
			border-color: #8b5cf6;
		}
		.create-bounty-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 10px 16px;
			background: linear-gradient(135deg, #8b5cf6, #a855f7);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.8rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			white-space: nowrap;
		}
		.create-bounty-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
		}
		.create-bounty-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
			box-shadow: none;
		}
		.create-bounty-btn svg {
			width: 14px;
			height: 14px;
		}
		.create-bounty-summary {
			margin-top: 10px;
			padding-top: 10px;
			border-top: 1px solid var(--border);
		}
		.create-bounty-summary-row {
			display: flex;
			justify-content: space-between;
			font-size: 0.75rem;
			color: var(--text-muted);
			margin-bottom: 4px;
		}
		.create-bounty-summary-row.total {
			color: var(--text);
			font-weight: 600;
			margin-top: 6px;
			padding-top: 6px;
			border-top: 1px dashed var(--border);
		}

		/* Footer Info */
		.bid-bounty-footer {
			margin-top: 16px;
			padding-top: 16px;
			border-top: 1px solid var(--border);
			position: relative;
			z-index: 1;
		}
		.bid-bounty-info-row {
			display: flex;
			flex-wrap: wrap;
			gap: 24px;
			justify-content: center;
		}
		.bid-bounty-info-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
		}
		.bid-bounty-info-label {
			font-size: 0.65rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.bid-bounty-info-value {
			font-size: 0.85rem;
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

		/* Gateway Services Links Hover Effects */
		.card a[href="/mvr"]:hover,
		.card a[href="/upload"]:hover,
		.card a[href="/messages"]:hover,
		.card a[href="/vortex"]:hover {
			border-color: var(--accent) !important;
			background: rgba(96, 165, 250, 0.1) !important;
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.2);
		}

		/* Vortex Section Styling */
		.card a[href="/vortex"]:hover {
			filter: brightness(1.1);
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
		}

		/* Vortex Quick Access Links */
		.card .sdk-note a,
		.card div[style*="Quick Access"] a {
			transition: all 0.2s;
		}
		.card .sdk-note a:hover,
		.card div[style*="Quick Access"] a:hover {
			background: rgba(96, 165, 250, 0.2) !important;
			border-color: var(--accent) !important;
			transform: translateY(-1px);
		}

		/* Crypto Tracker Responsive */
		@media (max-width: 540px) {
			#crypto-tracker {
				gap: 16px;
				padding: 10px 16px;
				font-size: 0.8rem;
			}
		}

		/* Footer Styles */
		footer {
			margin-top: 48px;
			padding-top: 32px;
			text-align: center;
			color: var(--text-muted);
			font-size: 0.875rem;
			border-top: 1px solid var(--border);
		}
		footer p {
			margin: 0;
		}
		footer a {
			color: var(--accent);
			text-decoration: none;
			font-weight: 600;
		}
		footer a:hover {
			text-decoration: underline;
		}

		/* ========== BOUNTY SECTION ========== */
		.bounty-section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 24px;
			margin-top: 20px;
			box-shadow: var(--shadow);
		}
		.bounty-section h3 {
			color: var(--text);
			font-size: 0.9rem;
			font-weight: 700;
			margin-bottom: 14px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.bounty-section h3 svg {
			width: 18px;
			height: 18px;
			color: var(--warning);
		}
		.bounty-list {
			margin-bottom: 18px;
		}
		.bounty-empty {
			color: var(--text-muted);
			font-size: 0.8rem;
			text-align: center;
			padding: 16px;
			background: rgba(255, 255, 255, 0.02);
			border: 1px dashed var(--border);
			border-radius: 12px;
		}
		.bounty-item {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(245, 158, 11, 0.05));
			border: 1px solid rgba(251, 191, 36, 0.2);
			border-radius: 12px;
			padding: 14px;
			margin-bottom: 10px;
		}
		.bounty-item-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 8px;
		}
		.bounty-item-amount {
			font-size: 1rem;
			font-weight: 700;
			color: var(--warning);
		}
		.bounty-item-status {
			font-size: 0.7rem;
			padding: 4px 8px;
			border-radius: 6px;
			font-weight: 600;
			text-transform: uppercase;
		}
		.bounty-item-status.pending {
			background: rgba(251, 191, 36, 0.2);
			color: var(--warning);
		}
		.bounty-item-status.ready {
			background: rgba(34, 197, 94, 0.2);
			color: var(--success);
		}
		.bounty-item-details {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.bounty-form {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.03), rgba(245, 158, 11, 0.03));
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 18px;
			margin-bottom: 16px;
		}
		.bounty-amount-row {
			display: flex;
			align-items: flex-end;
			gap: 16px;
			margin-bottom: 14px;
		}
		.bounty-input-group {
			flex: 1;
			margin-bottom: 14px;
		}
		.bounty-input-group label {
			display: block;
			font-size: 0.7rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 6px;
		}
		.bounty-amount-input {
			display: flex;
			gap: 8px;
		}
		.bounty-amount-input input {
			flex: 1;
			padding: 10px 12px;
			background: var(--glass-bg);
			border: 1px solid var(--glass-border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.9rem;
		}
		.bounty-amount-input select {
			padding: 10px 12px;
			background: var(--glass-bg);
			border: 1px solid var(--glass-border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.85rem;
			cursor: pointer;
		}
		.bounty-usd-display {
			font-size: 0.85rem;
			color: var(--text-muted);
			padding-bottom: 10px;
		}
		.bounty-reward-input {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.bounty-reward-input input {
			width: 80px;
			padding: 10px 12px;
			background: var(--glass-bg);
			border: 1px solid var(--glass-border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.9rem;
		}
		.bounty-reward-unit {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.bounty-input-group select {
			width: 100%;
			padding: 10px 12px;
			background: var(--glass-bg);
			border: 1px solid var(--glass-border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.85rem;
			cursor: pointer;
		}
		.bounty-cost-breakdown {
			background: rgba(0, 0, 0, 0.2);
			border-radius: 10px;
			padding: 14px;
			margin-bottom: 16px;
		}
		.bounty-cost-row {
			display: flex;
			justify-content: space-between;
			font-size: 0.8rem;
			color: var(--text-muted);
			padding: 6px 0;
		}
		.bounty-cost-row.total {
			border-top: 1px solid var(--border);
			margin-top: 8px;
			padding-top: 10px;
			font-weight: 700;
			color: var(--text);
		}
		.bounty-create-btn {
			width: 100%;
			padding: 14px 20px;
			background: linear-gradient(135deg, var(--warning), #f59e0b);
			border: none;
			border-radius: 12px;
			color: #000;
			font-size: 0.85rem;
			font-weight: 700;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			transition: all 0.2s ease;
		}
		.bounty-create-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
		}
		.bounty-create-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}
		.bounty-create-btn svg {
			width: 16px;
			height: 16px;
		}
		.bounty-status {
			margin-top: 12px;
			padding: 10px 14px;
			border-radius: 10px;
			font-size: 0.8rem;
			text-align: center;
		}
		.bounty-status.error {
			background: rgba(239, 68, 68, 0.1);
			border: 1px solid rgba(239, 68, 68, 0.3);
			color: var(--danger);
		}
		.bounty-status.success {
			background: rgba(34, 197, 94, 0.1);
			border: 1px solid rgba(34, 197, 94, 0.3);
			color: var(--success);
		}
		.bounty-presign {
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(16, 185, 129, 0.05));
			border: 1px solid rgba(34, 197, 94, 0.2);
			border-radius: 14px;
			padding: 18px;
			margin-bottom: 16px;
			text-align: center;
		}
		.bounty-presign h4 {
			font-size: 0.85rem;
			font-weight: 700;
			margin-bottom: 8px;
			color: var(--success);
		}
		.bounty-presign p {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 14px;
		}
		.bounty-sign-btn {
			padding: 12px 24px;
			background: linear-gradient(135deg, var(--success), #10b981);
			border: none;
			border-radius: 10px;
			color: #fff;
			font-size: 0.85rem;
			font-weight: 700;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 8px;
			transition: all 0.2s ease;
		}
		.bounty-sign-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
		}
		.bounty-sign-btn svg {
			width: 16px;
			height: 16px;
		}
		.bounty-note {
			font-size: 0.75rem;
			color: var(--text-muted);
			background: rgba(255, 255, 255, 0.02);
			border-radius: 10px;
			padding: 12px;
			line-height: 1.5;
		}
		.bounty-note strong {
			color: var(--text);
		}

		/* Your Bounties Section */
		.your-bounties-section {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.03), rgba(139, 92, 246, 0.03));
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 18px;
			margin-top: 20px;
			margin-bottom: 16px;
		}
		.your-bounties-section h4 {
			font-size: 0.9rem;
			font-weight: 700;
			margin-bottom: 8px;
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--text);
		}
		.your-bounties-section h4 svg {
			width: 18px;
			height: 18px;
			color: var(--accent);
		}
		.your-bounties-description {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 16px;
		}

		/* Connect wallet prompt */
		.your-bounties-connect {
			text-align: center;
			padding: 20px;
		}
		.your-bounties-connect p {
			font-size: 0.85rem;
			color: var(--text-muted);
			margin-bottom: 12px;
		}
		.your-bounties-connect-btn {
			padding: 10px 20px;
			background: linear-gradient(135deg, var(--accent), #3b82f6);
			border: none;
			border-radius: 8px;
			color: #fff;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			gap: 8px;
			transition: all 0.2s ease;
		}
		.your-bounties-connect-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.4);
		}
		.your-bounties-connect-btn svg {
			width: 16px;
			height: 16px;
		}

		/* Loading state */
		.your-bounties-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 20px;
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.loading-spinner {
			width: 16px;
			height: 16px;
			border: 2px solid var(--border);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		/* Empty state */
		.your-bounties-empty {
			text-align: center;
			padding: 20px;
		}
		.your-bounties-empty p {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		/* Error state */
		.your-bounties-error {
			text-align: center;
			padding: 16px;
			color: var(--error);
			font-size: 0.85rem;
		}
		.your-bounties-retry {
			margin-left: 8px;
			padding: 4px 10px;
			background: transparent;
			border: 1px solid var(--error);
			border-radius: 6px;
			color: var(--error);
			font-size: 0.8rem;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.your-bounties-retry:hover {
			background: var(--error-light);
		}

		/* Bounty item card */
		.your-bounty-item {
			background: rgba(22, 22, 30, 0.6);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 14px;
			margin-bottom: 12px;
		}
		.your-bounty-item:last-child {
			margin-bottom: 0;
		}
		.your-bounty-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 12px;
		}
		.your-bounty-amount {
			font-size: 1.1rem;
			font-weight: 700;
			color: var(--text);
		}
		.your-bounty-status {
			font-size: 0.75rem;
			font-weight: 600;
			padding: 4px 10px;
			border-radius: 20px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.your-bounty-status.needs-signature {
			background: var(--warning-light);
			color: var(--warning);
		}
		.your-bounty-status.pending {
			background: var(--accent-light);
			color: var(--accent);
		}
		.your-bounty-status.ready {
			background: var(--success-light);
			color: var(--success);
		}
		.your-bounty-status.executing {
			background: var(--accent-light);
			color: var(--accent);
		}
		.your-bounty-status.completed {
			background: var(--success-light);
			color: var(--success);
		}
		.your-bounty-status.failed {
			background: var(--error-light);
			color: var(--error);
		}
		.your-bounty-status.cancelled {
			background: rgba(113, 113, 122, 0.15);
			color: var(--text-muted);
		}

		.your-bounty-details {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 8px;
			margin-bottom: 14px;
			padding-bottom: 14px;
			border-bottom: 1px solid var(--border);
		}
		.your-bounty-detail {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.your-bounty-detail .detail-label {
			font-size: 0.7rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.your-bounty-detail .detail-value {
			font-size: 0.85rem;
			font-weight: 600;
			color: var(--text);
		}

		/* Bounty actions */
		.your-bounty-actions {
			display: flex;
			align-items: center;
			gap: 10px;
			flex-wrap: wrap;
		}
		.your-bounty-sign-btn {
			flex: 1;
			padding: 10px 16px;
			background: linear-gradient(135deg, var(--success), #10b981);
			border: none;
			border-radius: 8px;
			color: #fff;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			transition: all 0.2s ease;
		}
		.your-bounty-sign-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
		}
		.your-bounty-sign-btn svg {
			width: 16px;
			height: 16px;
		}
		.your-bounty-cancel-btn {
			padding: 10px 16px;
			background: transparent;
			border: 1px solid var(--border-strong);
			border-radius: 8px;
			color: var(--text-muted);
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.your-bounty-cancel-btn:hover {
			border-color: var(--error);
			color: var(--error);
			background: var(--error-light);
		}

		/* Signed state */
		.your-bounty-signed {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--success);
			font-size: 0.85rem;
			font-weight: 600;
		}
		.your-bounty-signed svg {
			width: 16px;
			height: 16px;
		}

		/* Signing/loading state */
		.your-bounty-signing {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			color: var(--text-muted);
			font-size: 0.85rem;
			padding: 10px 0;
		}

		/* Error state in actions */
		.your-bounty-error {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--error);
			font-size: 0.85rem;
		}
		.your-bounty-retry-btn {
			padding: 4px 10px;
			background: transparent;
			border: 1px solid var(--error);
			border-radius: 6px;
			color: var(--error);
			font-size: 0.8rem;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.your-bounty-retry-btn:hover {
			background: var(--error-light);
		}

		@media (max-width: 480px) {
			.your-bounty-details {
				grid-template-columns: 1fr 1fr;
			}
			.your-bounty-actions {
				flex-direction: column;
			}
			.your-bounty-sign-btn,
			.your-bounty-cancel-btn {
				width: 100%;
			}
		}

		@media (max-width: 480px) {
			.bounty-amount-row {
				flex-direction: column;
				align-items: stretch;
			}
			.bounty-usd-display {
				text-align: right;
			}
		}
`
