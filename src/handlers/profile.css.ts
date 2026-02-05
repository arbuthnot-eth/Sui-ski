// Auto-extracted CSS for profile page
// This keeps the main profile.ts file focused on HTML generation

export const profileStyles = `
		:root {
			/* Deep dark background with vibrant accents */
			--bg-void: #020204;
			--bg-dark: #050507;
			--bg-subtle: #0a0a0e;
			--card-bg: rgba(12, 12, 18, 0.95);
			--card-bg-solid: #0c0c12;
			--card-bg-elevated: rgba(16, 16, 24, 0.98);
			--glass-border: rgba(255, 255, 255, 0.08);
			--text: #e4e4e7;
			--text-bright: #f4f4f5;
			--text-muted: #71717a;
			--text-dim: #52525b;
			--accent: #60a5fa;
			--accent-bright: #93c5fd;
			--accent-light: rgba(96, 165, 250, 0.12);
			--accent-hover: #93c5fd;
			--accent-glow: rgba(96, 165, 250, 0.3);
			--accent-dim: #60a5fa;
			--purple: #a78bfa;
			--purple-glow: rgba(167, 139, 250, 0.2);
			--success: #34d399;
			--success-light: rgba(52, 211, 153, 0.12);
			--warning: #fbbf24;
			--warning-light: rgba(251, 191, 36, 0.12);
			--error: #f87171;
			--error-light: rgba(248, 113, 113, 0.12);
			--border: rgba(255, 255, 255, 0.06);
			--border-strong: rgba(255, 255, 255, 0.12);
			--border-glow: rgba(96, 165, 250, 0.25);
			--shadow: 0 4px 24px rgba(0, 0, 0, 0.6), 0 1px 4px rgba(0, 0, 0, 0.4);
			--shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5);
			--shadow-glow: 0 0 40px rgba(96, 165, 250, 0.08);
			--spotlight-color: rgba(96, 165, 250, 0.02);
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: var(--bg-void);
			color: var(--text);
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
			background: radial-gradient(
				ellipse 50% 40% at 50% 0%,
				var(--spotlight-color) 0%,
				transparent 70%
			);
			pointer-events: none;
			z-index: 0;
		}
		body::after {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg,
				transparent 0%,
				rgba(104, 137, 176, 0.15) 30%,
				rgba(140, 160, 190, 0.25) 50%,
				rgba(104, 137, 176, 0.15) 70%,
				transparent 100%
			);
			pointer-events: none;
			z-index: 1;
		}

		/* Global Wallet Widget - Fixed position */
		.global-wallet-widget {
			position: fixed;
			top: 16px;
			right: 16px;
			z-index: 9999;
		}
		.global-wallet-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 16px;
			background: var(--card-bg-solid);
			backdrop-filter: blur(16px);
			-webkit-backdrop-filter: blur(16px);
			border: 1px solid var(--border);
			border-radius: 10px;
			color: var(--text-muted);
			font-size: 0.82rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.3s ease;
			box-shadow: var(--shadow), var(--shadow-glow);
		}
		.global-wallet-btn:hover {
			border-color: rgba(96, 165, 250, 0.4);
			color: var(--text);
			box-shadow: var(--shadow-lg), 0 0 25px rgba(96, 165, 250, 0.15);
		}
		.global-wallet-btn svg:first-child {
			width: 16px;
			height: 16px;
			color: var(--accent-dim);
			transition: color 0.3s ease;
		}
		.global-wallet-btn:hover svg:first-child {
			color: var(--accent);
		}
		.global-wallet-btn.connected {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15));
			border-color: rgba(96, 165, 250, 0.3);
		}
		.global-wallet-btn.connected #global-wallet-text {
			color: var(--accent);
		}
		.global-wallet-chevron {
			width: 14px;
			height: 14px;
			color: var(--text-muted);
			transition: transform 0.2s;
			display: none;
		}
		.global-wallet-btn.connected .global-wallet-chevron {
			display: block;
		}
		.global-wallet-widget.open .global-wallet-chevron {
			transform: rotate(180deg);
		}
		.global-wallet-dropdown {
			position: absolute;
			top: calc(100% + 8px);
			right: 0;
			min-width: 200px;
			background: var(--card-bg-solid);
			border: 1px solid var(--border);
			border-radius: 10px;
			box-shadow: var(--shadow-lg);
			opacity: 0;
			visibility: hidden;
			transform: translateY(-8px);
			transition: all 0.25s ease;
			overflow: hidden;
		}
		.global-wallet-widget.open .global-wallet-dropdown {
			opacity: 1;
			visibility: visible;
			transform: translateY(0);
		}
		.global-wallet-dropdown-item {
			display: flex;
			align-items: center;
			gap: 12px;
			width: 100%;
			padding: 12px 16px;
			background: transparent;
			border: none;
			color: var(--text-muted);
			font-size: 0.82rem;
			cursor: pointer;
			transition: all 0.2s ease;
			text-align: left;
		}
		.global-wallet-dropdown-item:hover {
			background: rgba(104, 137, 176, 0.06);
			color: var(--text);
		}
		.global-wallet-dropdown-item svg {
			width: 15px;
			height: 15px;
			color: var(--text-dim);
			transition: color 0.2s ease;
		}
		.global-wallet-dropdown-item:hover svg {
			color: var(--accent);
		}
		.global-wallet-dropdown-item.disconnect {
			border-top: 1px solid var(--border);
			color: var(--error);
		}
		.global-wallet-dropdown-item.disconnect svg {
			color: var(--error);
		}
		.global-wallet-dropdown-item.disconnect:hover {
			background: rgba(168, 96, 104, 0.08);
		}
		.global-wallet-dropdown-addr {
			padding: 12px 16px;
			background: rgba(0, 0, 0, 0.3);
			border-bottom: 1px solid var(--border);
			font-family: ui-monospace, monospace;
			font-size: 0.72rem;
			color: var(--text-muted);
			word-break: break-all;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.global-wallet-dropdown-addr:hover {
			background: rgba(96, 165, 250, 0.08);
			color: #60a5fa;
		}
		.global-wallet-dropdown-addr.copied {
			background: rgba(52, 211, 153, 0.1);
			color: #34d399;
		}

		/* Custom Scrollbar - Vibrant accent */
		* {
			scrollbar-width: thin;
			scrollbar-color: #60a5fa var(--bg-void);
		}
		*::-webkit-scrollbar {
			width: 5px;
			height: 5px;
		}
		*::-webkit-scrollbar-track {
			background: var(--bg-void);
		}
		*::-webkit-scrollbar-thumb {
			background: linear-gradient(180deg, #60a5fa, #a78bfa);
			border-radius: 3px;
		}
		*::-webkit-scrollbar-thumb:hover {
			background: linear-gradient(180deg, #7ab8ff, #b99cff);
		}

		.container { max-width: 900px; margin: 0 auto; position: relative; z-index: 1; }

		.page-layout {
			display: flex;
			gap: 20px;
		}
		.notification-badge {
			position: absolute;
			top: 4px;
			right: 8px;
			min-width: 16px;
			height: 16px;
			background: var(--accent-dim);
			color: var(--bg-void);
			font-size: 0.65rem;
			font-weight: 700;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 4px;
			animation: pulse-badge 3s ease-in-out infinite;
		}
		.notification-badge.hidden {
			display: none;
		}
		@keyframes pulse-badge {
			0%, 100% { opacity: 0.7; transform: scale(1); }
			50% { opacity: 1; transform: scale(1.05); }
		}

		/* Conversation List Styles */
		.conversations-list {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.conversation-card {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 14px;
			background: transparent;
			border: 1px solid transparent;
			border-radius: 10px;
			cursor: pointer;
			transition: all 0.25s ease;
		}
		.conversation-card:hover {
			background: rgba(104, 137, 176, 0.04);
			border-color: var(--border);
		}
		.conversation-card.unread {
			background: rgba(104, 137, 176, 0.03);
			border-color: var(--border-glow);
		}
		.conversation-card.unread .conv-name {
			font-weight: 600;
			color: var(--text);
		}
		.conv-avatar {
			width: 44px;
			height: 44px;
			border-radius: 50%;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 600;
			font-size: 1.1rem;
			color: white;
			flex-shrink: 0;
		}
		.conv-info {
			flex: 1;
			min-width: 0;
		}
		.conv-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 3px;
		}
		.conv-name {
			font-weight: 500;
			color: var(--text);
			font-size: 0.9rem;
		}
		.conv-time {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.conv-preview {
			font-size: 0.82rem;
			color: var(--text-muted);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.conv-unread-badge {
			background: var(--accent);
			color: white;
			font-size: 0.72rem;
			font-weight: 700;
			min-width: 20px;
			height: 20px;
			border-radius: 10px;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 6px;
			flex-shrink: 0;
		}

		/* Conversation Detail View */
		.conversation-detail {
			display: flex;
			flex-direction: column;
			height: 100%;
		}
		.conv-detail-header {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 0;
			border-bottom: 1px solid var(--border);
			margin-bottom: 16px;
		}
		.conv-back-btn {
			background: none;
			border: none;
			color: var(--accent);
			cursor: pointer;
			padding: 8px;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: background 0.2s;
		}
		.conv-back-btn:hover {
			background: var(--accent-light);
		}
		.conv-back-btn svg {
			width: 20px;
			height: 20px;
		}
		.conv-detail-name {
			font-weight: 600;
			font-size: 1rem;
		}
		.conv-messages {
			flex: 1;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: 12px;
			padding: 8px 0;
			max-height: 400px;
		}
		.conv-message {
			max-width: 80%;
			padding: 10px 14px;
			border-radius: 12px;
			font-size: 0.85rem;
			line-height: 1.45;
		}
		.conv-message.sent {
			align-self: flex-end;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			color: white;
			border-bottom-right-radius: 4px;
		}
		.conv-message.received {
			align-self: flex-start;
			background: rgba(255, 255, 255, 0.08);
			border-bottom-left-radius: 4px;
		}
		.conv-message-time {
			font-size: 0.7rem;
			opacity: 0.7;
			margin-top: 4px;
		}
		.conv-message-sender {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--accent);
			margin-bottom: 4px;
			cursor: help;
		}
		.conv-message-content {
			word-break: break-word;
		}
		.conv-date-separator {
			text-align: center;
			font-size: 0.75rem;
			color: var(--text-muted);
			padding: 12px 0;
			position: relative;
		}
		.conv-date-separator::before,
		.conv-date-separator::after {
			content: '';
			position: absolute;
			top: 50%;
			width: 30%;
			height: 1px;
			background: rgba(255, 255, 255, 0.1);
		}
		.conv-date-separator::before { left: 0; }
		.conv-date-separator::after { right: 0; }
		.encrypted-icon {
			opacity: 0.7;
			font-size: 0.8em;
			cursor: help;
		}
		.conv-encryption-warning {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 14px;
			background: rgba(245, 158, 11, 0.15);
			border: 1px solid rgba(245, 158, 11, 0.3);
			border-radius: 8px;
			margin-bottom: 12px;
			font-size: 0.8rem;
			color: #f59e0b;
		}
		.conv-encryption-warning .warning-icon {
			flex-shrink: 0;
		}
		.conv-empty {
			text-align: center;
			padding: 32px;
			color: var(--text-muted);
		}
		.conv-empty svg {
			width: 48px;
			height: 48px;
			margin-bottom: 12px;
			opacity: 0.5;
		}
		.main-content {
			flex: 1;
			min-width: 0;
		}
		.tab-panel {
			display: block;
		}

		.profile-hero {
			display: flex;
			gap: 28px;
			align-items: flex-start;
			margin-bottom: 24px;
		}
		.identity-card {
			width: 180px;
			background: var(--bg-dark);
			border-radius: 16px;
			overflow: hidden;
			box-shadow:
				0 24px 60px rgba(0, 0, 0, 0.5),
				0 0 0 1px var(--border),
				inset 0 1px 0 rgba(180, 200, 230, 0.03);
			position: relative;
			flex-shrink: 0;
			transition: transform 0.4s ease, box-shadow 0.4s ease;
		}
		.identity-card::before {
			content: '';
			position: absolute;
			top: -100%;
			left: 50%;
			transform: translateX(-50%);
			width: 200%;
			height: 200%;
			background: radial-gradient(
				ellipse 30% 25% at 50% 0%,
				rgba(140, 160, 190, 0.06) 0%,
				transparent 60%
			);
			pointer-events: none;
			z-index: 1;
		}
		.identity-card:hover {
			transform: translateY(-3px);
			box-shadow:
				0 32px 70px rgba(0, 0, 0, 0.6),
				0 0 0 1px rgba(96, 165, 250, 0.25),
				0 0 40px rgba(96, 165, 250, 0.08),
				inset 0 1px 0 rgba(180, 200, 230, 0.05);
		}
		.identity-visual {
			position: relative;
			aspect-ratio: 1;
			background: linear-gradient(180deg, var(--bg-subtle) 0%, var(--bg-void) 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border-radius: 12px;
			margin: 4px;
		}
		.identity-visual::before {
			content: '';
			position: absolute;
			inset: -1px;
			background: linear-gradient(180deg, var(--border-glow), transparent 50%);
			border-radius: 13px;
			opacity: 0;
			transition: opacity 0.4s ease;
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
			border-radius: 11px;
			transition: transform 0.4s ease, filter 0.4s ease;
			filter: brightness(0.9) contrast(1.05);
		}
		.identity-card:hover .identity-visual img {
			transform: scale(1.02);
			filter: brightness(0.95) contrast(1.05);
		}
		.identity-visual canvas {
			width: 85%;
			height: 85%;
			border-radius: 8px;
			filter: brightness(0.9);
		}
		/* Loading shimmer for identity visual */
		.identity-visual.loading::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(90deg, transparent, rgba(104, 137, 176, 0.05), transparent);
			animation: shimmer 2s ease-in-out infinite;
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
			padding: 10px 10px;
			background: linear-gradient(to top, rgba(104, 137, 176, 0.04), transparent);
			border-top: 1px solid var(--border);
		}
		.identity-name {
			text-align: center;
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.68rem;
			font-weight: 500;
			color: var(--accent-dim);
			background: rgba(104, 137, 176, 0.06);
			padding: 5px 9px;
			border-radius: 5px;
			cursor: pointer;
			transition: all 0.25s ease;
			letter-spacing: 0.02em;
		}
		.identity-name:hover {
			background: rgba(96, 165, 250, 0.15);
			color: #60a5fa;
			box-shadow: 0 0 15px rgba(96, 165, 250, 0.1);
		}
		.identity-name.copied {
			background: rgba(74, 144, 128, 0.12);
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
			border-radius: 12px;
			padding: 20px;
			border: 1px solid var(--border);
			box-shadow: var(--shadow-lg), var(--shadow-glow);
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
			background: linear-gradient(90deg, transparent, rgba(140, 160, 190, 0.06), transparent);
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
			font-size: 1.65rem;
			font-weight: 700;
			color: var(--text-bright);
			letter-spacing: -0.03em;
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
			transition: opacity 0.3s ease;
		}
		.name-site-link:hover { opacity: 0.75; }
		.name-site-link .site-arrow {
			width: 18px;
			height: 18px;
			color: var(--accent-dim);
			flex-shrink: 0;
		}
		.badge {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			padding: 4px 10px;
			border-radius: 6px;
			font-size: 0.62rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			white-space: nowrap;
			transition: all 0.25s ease;
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
			color: var(--text-dim);
			cursor: pointer;
			padding: 6px;
			display: flex;
			align-items: center;
			transition: all 0.25s ease;
			border-radius: 6px;
		}
		.owner-actions .copy-btn:hover {
			color: #60a5fa;
			background: rgba(96, 165, 250, 0.1);
		}
		.owner-actions .edit-btn {
			background: transparent;
			border: 1px solid var(--border);
			color: var(--text-muted);
			padding: 7px 12px;
			border-radius: 8px;
			font-size: 0.72rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.25s ease;
		}
		.owner-actions .edit-btn:hover:not(:disabled) {
			background: rgba(96, 165, 250, 0.1);
			color: #60a5fa;
			border-color: rgba(96, 165, 250, 0.35);
			box-shadow: 0 0 20px rgba(96, 165, 250, 0.1);
		}
		.owner-actions .edit-btn:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}
		.owner-actions .edit-btn.hidden {
			display: none;
		}
		.owner-actions .message-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			border: none;
			color: white;
			padding: 7px 12px;
			border-radius: 8px;
			font-size: 0.72rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.25s ease;
			box-shadow: 0 2px 10px rgba(96, 165, 250, 0.2);
		}
		.owner-actions .message-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 6px 25px rgba(96, 165, 250, 0.35);
		}
		.owner-actions .message-btn svg {
			width: 13px;
			height: 13px;
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

		/* Wallet dropdown */
		.wallet-status-container {
			position: relative;
			margin-left: auto;
		}
		.wallet-chevron {
			transition: transform 0.2s;
			color: var(--text-muted);
		}
		.wallet-status-container:has(.wallet-dropdown.open) .wallet-chevron {
			transform: rotate(180deg);
		}
		.wallet-dropdown {
			position: absolute;
			top: calc(100% + 8px);
			right: 0;
			min-width: 180px;
			background: var(--card-bg-solid);
			border: 1px solid var(--border);
			border-radius: 12px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
			opacity: 0;
			visibility: hidden;
			transform: translateY(-8px);
			transition: all 0.2s;
			z-index: 1000;
			overflow: hidden;
		}
		.wallet-dropdown.open {
			opacity: 1;
			visibility: visible;
			transform: translateY(0);
		}
		.wallet-dropdown-item {
			display: flex;
			align-items: center;
			gap: 10px;
			width: 100%;
			padding: 12px 16px;
			background: transparent;
			border: none;
			color: var(--text);
			font-size: 0.85rem;
			cursor: pointer;
			transition: background 0.15s;
			text-align: left;
		}
		.wallet-dropdown-item:hover {
			background: rgba(96, 165, 250, 0.1);
		}
		.wallet-dropdown-item svg {
			width: 16px;
			height: 16px;
			color: var(--text-muted);
		}
		.wallet-dropdown-item:hover svg {
			color: var(--accent);
		}
		.wallet-dropdown-item.disconnect {
			border-top: 1px solid var(--border);
			color: var(--error);
		}
		.wallet-dropdown-item.disconnect svg {
			color: var(--error);
		}
		.wallet-dropdown-item.disconnect:hover {
			background: rgba(248, 113, 113, 0.1);
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
		.subscribe-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 18px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border: none;
			border-radius: 12px;
			font-size: 0.8rem;
			color: white;
			transition: all 0.2s;
			font-weight: 600;
			cursor: pointer;
		}
		.subscribe-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 20px rgba(96, 165, 250, 0.4);
		}
		.subscribe-btn svg {
			width: 16px;
			height: 16px;
		}
		.subscribe-btn.subscribed {
			background: var(--card-bg-solid);
			border: 1px solid var(--success);
			color: var(--success);
		}
		.subscribe-btn.subscribed:hover {
			background: rgba(16, 185, 129, 0.1);
		}
		.subscribe-btn.subscribed svg {
			fill: currentColor;
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
			width: 14px;
			height: 14px;
			border: 2px solid var(--border);
			border-top-color: var(--accent-dim);
			border-radius: 50%;
			animation: spin 0.9s linear infinite;
		}
		@keyframes spin { to { transform: rotate(360deg); } }
		.hidden { display: none !important; }

		/* Marketplace Section */
		.marketplace-section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 22px;
			margin-bottom: 20px;
			box-shadow: var(--shadow), var(--shadow-glow);
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

		/* Expiration Timer Section */
		.expiration-timer-section {
			display: flex;
			justify-content: center;
			padding: 20px 0;
		}
		.expiration-timer-card {
			background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.08));
			border: 1px solid rgba(251, 191, 36, 0.3);
			border-radius: 16px;
			padding: 24px 32px;
			text-align: center;
			max-width: 400px;
			width: 100%;
		}
		.expiration-timer-header {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--warning);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 20px;
		}
		.expiration-timer-header svg {
			width: 20px;
			height: 20px;
		}
		.expiration-timer-display {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			margin-bottom: 20px;
		}
		.expiration-timer-unit {
			display: flex;
			flex-direction: column;
			align-items: center;
			min-width: 60px;
			padding: 14px 10px;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(251, 191, 36, 0.3);
			border-radius: 10px;
		}
		.expiration-timer-value {
			font-family: var(--font-mono, ui-monospace, monospace);
			font-size: 1.75rem;
			font-weight: 800;
			color: var(--warning);
			line-height: 1;
		}
		.expiration-timer-label {
			font-size: 0.6rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.03em;
			margin-top: 6px;
		}
		.expiration-timer-sep {
			font-size: 1.5rem;
			font-weight: 700;
			color: var(--warning);
			opacity: 0.5;
			margin-bottom: 20px;
		}
		.expiration-timer-dates {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}
		.expiration-date-row {
			display: flex;
			justify-content: space-between;
			font-size: 0.8rem;
		}
		.expiration-date-label {
			color: var(--text-muted);
		}
		.expiration-date-value {
			color: var(--text);
			font-weight: 600;
		}
		.expiration-date-value.accent {
			color: var(--accent);
		}
		@media (max-width: 480px) {
			.expiration-timer-card {
				padding: 20px 16px;
			}
			.expiration-timer-unit {
				min-width: 50px;
				padding: 10px 8px;
			}
			.expiration-timer-value {
				font-size: 1.35rem;
			}
		}

		/* Renewal Section */
		.renewal-section {
			margin-top: 24px;
			padding-top: 20px;
			border-top: 1px solid rgba(251, 191, 36, 0.2);
		}
		.renewal-header {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			color: var(--accent);
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 16px;
		}
		.renewal-header svg {
			width: 16px;
			height: 16px;
		}

		/* Renewal + Linked Names Side-by-Side Container */
		.renewal-linked-container {
			display: flex;
			gap: 20px;
			margin-top: 20px;
			align-items: flex-start;
		}
		.renewal-linked-container > .renewal-card {
			flex: 0 0 auto;
			width: 340px;
			min-width: 280px;
			margin-top: 0;
		}
		.renewal-linked-container > .linked-names-section {
			flex: 1 1 auto;
			min-width: 0;
			margin-bottom: 0;
			max-height: calc(100vh - 300px);
			overflow-y: auto;
		}
		/* Stack on narrow screens - renewal on top */
		@media (max-width: 768px) {
			.renewal-linked-container {
				flex-direction: column;
			}
			.renewal-linked-container > .renewal-card {
				width: 100%;
				min-width: unset;
			}
			.renewal-linked-container > .linked-names-section {
				max-height: none;
			}
		}

		/* Marketplace Card */
		.marketplace-card {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
			border: 1px solid rgba(139, 92, 246, 0.25);
			padding: 16px;
			border-radius: 12px;
			margin-bottom: 16px;
		}
		.marketplace-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 12px;
			flex-wrap: wrap;
			gap: 8px;
		}
		.marketplace-title {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--accent-secondary, #8b5cf6);
			font-size: 0.9rem;
			font-weight: 600;
		}
		.marketplace-title svg {
			width: 18px;
			height: 18px;
		}
		.marketplace-link {
			font-size: 0.75rem;
			color: var(--text-muted);
			text-decoration: none;
			padding: 4px 8px;
			border-radius: 6px;
			background: rgba(255,255,255,0.05);
			transition: all 0.15s ease;
		}
		.marketplace-link:hover {
			background: rgba(255,255,255,0.1);
			color: var(--text);
		}
		.marketplace-body {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.marketplace-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 12px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 8px;
		}
		.marketplace-label {
			color: var(--text-muted);
			font-size: 0.8rem;
		}
		.marketplace-value {
			font-weight: 600;
			font-family: var(--font-mono, monospace);
		}
		.marketplace-value.listing-price {
			color: var(--accent-secondary, #8b5cf6);
			font-size: 1rem;
		}
		.marketplace-value.bid-price {
			color: var(--accent);
			font-size: 0.9rem;
		}
		.marketplace-buy-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 12px;
			background: linear-gradient(135deg, var(--accent-secondary, #8b5cf6), #7c3aed);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.marketplace-buy-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
		}
		.marketplace-buy-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.marketplace-status {
			text-align: center;
			font-size: 0.75rem;
			color: var(--text-muted);
			min-height: 16px;
		}
		.marketplace-status.success { color: var(--success); }
		.marketplace-status.error { color: var(--danger); }

		/* Renewal Card (Overview Tab) */
		.renewal-card {
			background: linear-gradient(135deg, rgba(74, 222, 128, 0.08), rgba(34, 197, 94, 0.05));
			border: 1px solid rgba(74, 222, 128, 0.2);
			margin-top: 20px;
		}
		.renewal-card-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 10px;
			flex-wrap: wrap;
			gap: 8px;
		}
		.renewal-card-title {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--accent);
			font-size: 0.9rem;
			font-weight: 600;
		}
		.renewal-card-title svg {
			width: 18px;
			height: 18px;
		}
		.renewal-expiry-info {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
		}
		.renewal-expiry-label {
			color: var(--text-muted);
		}
		.renewal-expiry-date {
			color: var(--warning);
			font-weight: 600;
		}
		.renewal-countdown {
			color: var(--text-muted);
			font-size: 0.75rem;
			font-weight: 500;
		}
		.renewal-countdown.warning {
			color: var(--warning);
		}
		.renewal-countdown.urgent {
			color: var(--danger);
			font-weight: 600;
		}
		.renewal-card-body {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.renewal-compact-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 10px 12px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 10px;
		}
		.renewal-info-stack {
			display: flex;
			flex-direction: column;
			gap: 4px;
			flex: 1;
			min-width: 0;
		}
		.renewal-expiry-compact {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			flex-wrap: wrap;
		}
		.renewal-expiry-compact .renewal-expiry-label {
			color: var(--text-muted);
		}
		.renewal-expiry-compact .renewal-expiry-date {
			color: var(--text);
			font-weight: 500;
		}
		.renewal-price-compact {
			display: flex;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
		}
		.renewal-price-compact .renewal-price-value {
			color: var(--accent);
			font-size: 1rem;
			font-weight: 700;
			font-family: var(--font-mono, ui-monospace, monospace);
		}
		.renewal-savings-inline {
			display: inline-flex;
			align-items: center;
			gap: 3px;
			background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.1));
			border: 1px solid rgba(74, 222, 128, 0.3);
			border-radius: 12px;
			padding: 2px 8px;
			font-size: 0.65rem;
			font-weight: 600;
			color: var(--success);
		}
		.renewal-duration-stepper {
			display: flex;
			align-items: center;
			gap: 0;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid var(--glass-border);
			border-radius: 8px;
			overflow: hidden;
			flex-shrink: 0;
		}
		.stepper-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			background: transparent;
			border: none;
			color: var(--accent);
			font-size: 1.1rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s ease;
		}
		.stepper-btn:hover:not(:disabled) {
			background: rgba(74, 222, 128, 0.15);
		}
		.stepper-btn:active:not(:disabled) {
			background: rgba(74, 222, 128, 0.25);
		}
		.stepper-btn:disabled {
			color: var(--text-muted);
			opacity: 0.4;
			cursor: not-allowed;
		}
		.stepper-value {
			display: flex;
			align-items: center;
			justify-content: center;
			min-width: 48px;
			padding: 0 4px;
			color: var(--text);
			font-size: 0.85rem;
			font-weight: 600;
			border-left: 1px solid var(--glass-border);
			border-right: 1px solid var(--glass-border);
		}
		.renewal-form-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			flex-wrap: wrap;
		}
		.renewal-years-control {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.renewal-years-control label {
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.renewal-price-display {
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.renewal-form {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.renewal-years-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
		}
		.renewal-years-row label {
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.renewal-years-select {
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid var(--glass-border);
			border-radius: 8px;
			color: var(--text);
			padding: 8px 12px;
			font-size: 0.85rem;
			cursor: pointer;
			min-width: 100px;
		}
		.renewal-years-select:focus {
			outline: none;
			border-color: var(--accent);
		}
		.renewal-price-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 10px;
		}
		.renewal-price-label {
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.renewal-price-value {
			color: var(--accent);
			font-size: 1.1rem;
			font-weight: 700;
			font-family: var(--font-mono, ui-monospace, monospace);
		}
		.renewal-savings-row {
			display: flex;
			justify-content: center;
		}
		.renewal-savings-badge {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.1));
			border: 1px solid rgba(74, 222, 128, 0.3);
			border-radius: 20px;
			padding: 4px 12px;
			font-size: 0.7rem;
			font-weight: 600;
			color: var(--success);
		}
		.renewal-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 14px;
			background: linear-gradient(135deg, var(--accent), var(--accent-hover));
			border: none;
			border-radius: 12px;
			color: var(--bg);
			font-size: 0.9rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s ease;
			margin-top: 4px;
		}
		.renewal-btn:hover:not(:disabled) {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
		}
		.renewal-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.renewal-btn-loading {
			display: flex;
			align-items: center;
		}
		.renewal-status {
			text-align: center;
			font-size: 0.8rem;
			color: var(--text-muted);
			min-height: 20px;
		}
		.renewal-status.success {
			color: var(--success);
		}
		.renewal-status.error {
			color: var(--danger);
		}

		/* Transaction Success Summary */
		.tx-success-summary {
			background: rgba(34, 197, 94, 0.1);
			border: 1px solid rgba(34, 197, 94, 0.3);
			border-radius: 12px;
			padding: 16px;
			text-align: left;
		}
		.tx-success-header {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: 600;
			font-size: 1rem;
			color: var(--success);
			margin-bottom: 12px;
		}
		.tx-success-header svg {
			flex-shrink: 0;
		}
		.tx-details-loading {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.tx-details {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin-bottom: 12px;
		}
		.tx-detail-row {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			font-size: 0.85rem;
		}
		.tx-label {
			color: var(--text-muted);
		}
		.tx-value {
			color: var(--text);
			text-align: right;
		}
		.tx-value.mono {
			font-family: monospace;
			font-size: 0.8rem;
		}
		.tx-value.status-success {
			color: var(--success);
			font-weight: 600;
		}
		.tx-value.status-failure {
			color: var(--danger);
		}
		.tx-balance-changes {
			display: flex;
			flex-direction: column;
			gap: 2px;
			text-align: right;
		}
		.tx-balance-change {
			font-family: monospace;
			font-size: 0.8rem;
		}
		.tx-balance-change.positive {
			color: var(--success);
		}
		.tx-balance-change.negative {
			color: var(--danger);
		}
		.tx-explorer-links {
			display: flex;
			gap: 12px;
			justify-content: center;
			padding-top: 12px;
			border-top: 1px solid rgba(34, 197, 94, 0.2);
		}
		.tx-explorer-links a {
			color: var(--accent);
			text-decoration: none;
			font-size: 0.85rem;
			display: flex;
			align-items: center;
			gap: 4px;
		}
		.tx-explorer-links a:hover {
			text-decoration: underline;
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

		/* Simplified Grace Period Countdown Card */
		.grace-countdown-card {
			width: 100%;
			text-align: center;
		}
		.grace-countdown-header {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			margin-bottom: 20px;
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--warning);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.grace-countdown-header svg {
			width: 20px;
			height: 20px;
			color: var(--warning);
		}
		.grace-countdown-timer {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			margin-bottom: 24px;
		}
		.countdown-unit {
			display: flex;
			flex-direction: column;
			align-items: center;
			min-width: 70px;
			padding: 16px 12px;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(248, 113, 113, 0.3);
			border-radius: 12px;
		}
		.countdown-value {
			font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
			font-size: 2rem;
			font-weight: 800;
			color: var(--error);
			line-height: 1;
			text-shadow: 0 0 20px rgba(248, 113, 113, 0.5);
		}
		.countdown-label {
			font-size: 0.65rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-top: 6px;
		}
		.countdown-sep {
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--error);
			opacity: 0.5;
			margin-bottom: 20px;
		}
		.grace-snipe-action {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 10px;
		}
		.grace-snipe-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			padding: 14px 32px;
			background: linear-gradient(135deg, #ef4444, #dc2626);
			color: white;
			border: none;
			border-radius: 12px;
			font-size: 1rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s ease;
			box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
		}
		.grace-snipe-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 24px rgba(239, 68, 68, 0.5);
		}
		.grace-snipe-btn:active {
			transform: translateY(0);
		}
		.grace-snipe-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none;
		}
		.grace-snipe-btn svg {
			width: 20px;
			height: 20px;
		}
		.grace-snipe-info {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.grace-snipe-status {
			margin-top: 12px;
			padding: 10px 16px;
			border-radius: 8px;
			font-size: 0.85rem;
		}
		.grace-snipe-status.loading {
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: var(--accent);
		}
		.grace-snipe-status.success {
			background: rgba(34, 197, 94, 0.12);
			border: 1px solid rgba(34, 197, 94, 0.3);
			color: #22c55e;
		}
		.grace-snipe-status.error {
			background: rgba(248, 113, 113, 0.12);
			border: 1px solid rgba(248, 113, 113, 0.3);
			color: #f87171;
		}
		.grace-snipe-status a {
			color: inherit;
			text-decoration: underline;
		}
		@media (max-width: 480px) {
			.countdown-unit {
				min-width: 60px;
				padding: 12px 8px;
			}
			.countdown-value {
				font-size: 1.5rem;
			}
			.countdown-sep {
				font-size: 1.25rem;
			}
			.grace-snipe-btn {
				width: 100%;
				padding: 12px 24px;
			}
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
			background: var(--bg-dark);
			border: 1px solid var(--border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.9rem;
			font-family: inherit;
			resize: vertical;
			min-height: 100px;
			transition: border-color 0.25s ease, box-shadow 0.25s ease;
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

		/* Messaging Tab Section */
		.messaging-header {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 8px;
		}
		.messaging-header svg {
			width: 24px;
			height: 24px;
			color: var(--accent);
		}
		.messaging-header h3 {
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--text);
			margin: 0;
		}
		.messaging-features {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 16px;
			margin: 20px 0;
		}
		.feature-card {
			background: rgba(15, 23, 42, 0.6);
			padding: 20px;
			border-radius: 12px;
			border: 1px solid var(--border);
			text-align: center;
			transition: all 0.2s;
		}
		.feature-card:hover {
			border-color: rgba(96, 165, 250, 0.3);
			transform: translateY(-2px);
		}
		.feature-card svg {
			width: 32px;
			height: 32px;
			color: var(--accent);
			margin-bottom: 12px;
		}
		.feature-card h4 {
			font-size: 0.95rem;
			font-weight: 600;
			color: var(--text);
			margin-bottom: 6px;
		}
		.feature-card p {
			font-size: 0.85rem;
			color: var(--text-muted);
		}
		.messaging-actions {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
			margin: 20px 0;
		}
		.messaging-button {
			display: inline-flex;
			align-items: center;
			gap: 10px;
			padding: 14px 24px;
			border-radius: 12px;
			font-size: 1rem;
			font-weight: 600;
			text-decoration: none;
			transition: transform 0.2s, box-shadow 0.2s;
		}
		.messaging-button.primary {
			background: linear-gradient(135deg, #60a5fa, #8b5cf6);
			color: white;
			box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
		}
		.messaging-button.primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
		}
		.messaging-button.secondary {
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			color: var(--accent);
		}
		.messaging-button.secondary:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: rgba(96, 165, 250, 0.4);
		}
		.messaging-button svg {
			width: 20px;
			height: 20px;
		}
		.messaging-code-example {
			background: rgba(0, 0, 0, 0.3);
			border-radius: 12px;
			padding: 16px;
			margin-top: 20px;
		}
		.messaging-code-example .code-label {
			font-size: 0.85rem;
			color: var(--text-muted);
			margin-bottom: 12px;
		}
		.messaging-code-example pre {
			margin: 0;
			overflow-x: auto;
		}
		.messaging-code-example code {
			font-family: 'SF Mono', Monaco, 'Courier New', monospace;
			font-size: 0.85rem;
			color: var(--text);
			line-height: 1.6;
		}

		/* Connect Wallet Prompt */
		.msg-connect-prompt {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 48px 24px;
			text-align: center;
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.08));
			border: 1px dashed rgba(96, 165, 250, 0.3);
			border-radius: 16px;
			margin-bottom: 20px;
		}
		.msg-connect-prompt.hidden {
			display: none;
		}
		.msg-connect-icon {
			color: var(--accent);
			margin-bottom: 16px;
			opacity: 0.8;
		}
		.msg-connect-prompt h4 {
			font-size: 1.25rem;
			font-weight: 700;
			margin-bottom: 8px;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.msg-connect-prompt p {
			color: var(--text-muted);
			font-size: 0.9rem;
			margin-bottom: 24px;
			max-width: 320px;
		}
		.msg-connect-btn {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 12px 24px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			border: none;
			border-radius: 12px;
			color: white;
			font-size: 1rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
		}
		.msg-connect-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 24px rgba(96, 165, 250, 0.4);
		}
		.msg-connect-features {
			display: flex;
			flex-wrap: wrap;
			gap: 16px;
			margin-top: 24px;
			justify-content: center;
		}
		.msg-connect-features span {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			color: var(--text-muted);
		}
		.msg-connect-features svg {
			color: var(--success);
		}

		/* Message Compose Section */
		.msg-compose-section {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.1));
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 16px;
			padding: 20px;
			margin-bottom: 20px;
		}
		.msg-recipient-bar {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 16px;
			padding-bottom: 12px;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		}
		.msg-recipient-label {
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.msg-recipient-name {
			font-weight: 700;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.msg-recipient-addr {
			font-family: 'SF Mono', Monaco, monospace;
			font-size: 0.75rem;
			color: var(--text-muted);
			background: rgba(0, 0, 0, 0.2);
			padding: 2px 8px;
			border-radius: 4px;
		}
		.msg-compose-box {
			background: rgba(15, 23, 42, 0.6);
			border: 1px solid var(--border);
			border-radius: 12px;
			overflow: hidden;
		}
		.msg-compose-input {
			width: 100%;
			background: transparent;
			border: none;
			padding: 16px;
			color: var(--text);
			font-family: inherit;
			font-size: 0.95rem;
			resize: none;
			outline: none;
			line-height: 1.5;
		}
		.msg-compose-input::placeholder {
			color: var(--text-muted);
		}
		.msg-compose-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 12px 16px;
			background: rgba(0, 0, 0, 0.2);
			border-top: 1px solid var(--border);
		}
		.msg-compose-info {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.msg-send-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 20px;
			background: linear-gradient(135deg, #60a5fa, #8b5cf6);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
		}
		.msg-send-btn:hover:not(:disabled) {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(96, 165, 250, 0.4);
		}
		.msg-send-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			background: var(--text-muted);
			box-shadow: none;
		}
		.msg-send-btn.ready {
			background: linear-gradient(135deg, #60a5fa, #8b5cf6);
		}
		.msg-send-btn svg {
			width: 16px;
			height: 16px;
		}
		.msg-status {
			margin-top: 12px;
			padding: 12px 16px;
			border-radius: 10px;
			font-size: 0.85rem;
		}
		.msg-status.hidden { display: none; }
		.msg-status.success {
			background: var(--success-light);
			color: var(--success);
			border: 1px solid rgba(52, 211, 153, 0.3);
		}
		.msg-status.error {
			background: var(--error-light);
			color: var(--error);
			border: 1px solid rgba(248, 113, 113, 0.3);
		}
		.msg-status.info {
			background: var(--accent-light);
			color: var(--accent);
			border: 1px solid rgba(96, 165, 250, 0.3);
		}

		/* Owner Inbox Header */
		.msg-owner-inbox-header {
			display: flex;
			align-items: center;
			gap: 16px;
			padding: 20px;
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(139, 92, 246, 0.1));
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 12px;
			margin-bottom: 12px;
		}
		.msg-owner-inbox-header svg {
			color: var(--accent);
			flex-shrink: 0;
		}
		.msg-owner-inbox-header h4 {
			margin: 0 0 4px 0;
			font-size: 1.1rem;
			color: var(--text);
		}
		.msg-owner-inbox-header p {
			margin: 0;
			font-size: 0.85rem;
			color: var(--text-muted);
		}
		.msg-refresh-inbox-btn {
			margin-left: auto;
			background: rgba(96, 165, 250, 0.15);
			border: 1px solid rgba(96, 165, 250, 0.3);
			border-radius: 8px;
			padding: 10px;
			cursor: pointer;
			transition: all 0.2s;
			color: var(--accent);
		}
		.msg-refresh-inbox-btn:hover {
			background: rgba(96, 165, 250, 0.25);
			transform: rotate(180deg);
		}
		.msg-refresh-inbox-btn svg {
			width: 18px;
			height: 18px;
		}
		.msg-owner-note {
			font-size: 0.85rem;
			color: var(--text-muted);
			text-align: center;
			padding: 12px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 8px;
		}
		.msg-owner-note a {
			color: var(--accent);
			text-decoration: none;
		}
		.msg-owner-note a:hover {
			text-decoration: underline;
		}

		/* Conversation Section */
		.msg-conversation-section {
			background: rgba(22, 22, 30, 0.9);
			border: 1px solid var(--border);
			border-radius: 16px;
			overflow: hidden;
			margin-bottom: 20px;
		}
		.msg-conversation-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 16px 20px;
			border-bottom: 1px solid var(--border);
		}
		.msg-conversation-header h4 {
			font-size: 1rem;
			font-weight: 600;
			color: var(--text);
			margin: 0;
		}
		.msg-refresh-btn {
			padding: 8px;
			background: transparent;
			border: 1px solid var(--border);
			border-radius: 8px;
			color: var(--text-muted);
			cursor: pointer;
			transition: all 0.2s;
		}
		.msg-refresh-btn:hover {
			background: var(--accent-light);
			border-color: var(--accent);
			color: var(--accent);
		}
		.msg-refresh-btn svg {
			width: 16px;
			height: 16px;
		}
		.msg-conversation-list {
			min-height: 200px;
			max-height: 400px;
			overflow-y: auto;
		}
		.msg-conversation-empty {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 48px 20px;
			text-align: center;
		}
		.msg-conversation-empty svg {
			width: 48px;
			height: 48px;
			color: var(--text-muted);
			opacity: 0.4;
			margin-bottom: 16px;
		}
		.msg-conversation-empty p {
			color: var(--text);
			font-weight: 500;
			margin-bottom: 4px;
		}
		.msg-conversation-empty span {
			color: var(--text-muted);
			font-size: 0.85rem;
		}
		.msg-conversation-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12px;
			padding: 32px;
			color: var(--text-muted);
		}
		.msg-conversation-loading.hidden { display: none; }
		.msg-message {
			padding: 16px 20px;
			border-bottom: 1px solid var(--border);
		}
		.msg-message:last-child { border-bottom: none; }
		.msg-message.sent {
			background: rgba(96, 165, 250, 0.05);
		}
		.msg-message.received {
			background: rgba(139, 92, 246, 0.05);
		}
		.msg-message-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 8px;
		}
		.msg-message-sender {
			font-weight: 600;
			font-size: 0.85rem;
		}
		.msg-message.sent .msg-message-sender { color: var(--accent); }
		.msg-message.received .msg-message-sender { color: #a78bfa; }
		.msg-message-time {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.msg-message-arrow {
			color: var(--text-muted);
			font-size: 0.75rem;
		}
		.msg-message-recipient {
			font-size: 0.8rem;
			color: var(--text-secondary);
		}
		.msg-encrypted-badge {
			display: inline-flex;
			align-items: center;
			padding: 2px 6px;
			background: rgba(139, 92, 246, 0.15);
			color: #a78bfa;
			border-radius: 4px;
			margin-left: auto;
		}
		.msg-encrypted-badge svg {
			width: 12px;
			height: 12px;
		}
		.msg-message.received {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(139, 92, 246, 0.05));
			border-left: 3px solid var(--accent);
		}
		.msg-message-content {
			color: var(--text);
			font-size: 0.9rem;
			line-height: 1.5;
			white-space: pre-wrap;
			word-break: break-word;
		}

		/* SDK Info Section */
		.msg-sdk-info {
			background: rgba(22, 22, 30, 0.9);
			border: 1px solid var(--border);
			border-radius: 12px;
			overflow: hidden;
		}
		.msg-sdk-toggle {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 14px 16px;
			cursor: pointer;
			color: var(--text-muted);
			font-size: 0.9rem;
			transition: all 0.2s;
		}
		.msg-sdk-toggle:hover {
			background: rgba(255, 255, 255, 0.03);
			color: var(--text);
		}
		.msg-sdk-toggle svg {
			width: 18px;
			height: 18px;
		}
		.msg-sdk-toggle .chevron {
			margin-left: auto;
			transition: transform 0.2s;
		}
		.msg-sdk-toggle.expanded .chevron {
			transform: rotate(180deg);
		}
		.msg-sdk-content {
			padding: 0 16px 16px;
			border-top: 1px solid var(--border);
		}
		.msg-sdk-content.hidden { display: none; }
		.msg-features-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 12px;
			margin: 16px 0;
		}
		.msg-feature {
			display: flex;
			gap: 12px;
			padding: 12px;
			background: rgba(15, 23, 42, 0.5);
			border-radius: 10px;
		}
		.msg-feature svg {
			width: 24px;
			height: 24px;
			color: var(--accent);
			flex-shrink: 0;
		}
		.msg-feature strong {
			display: block;
			font-size: 0.85rem;
			color: var(--text);
			margin-bottom: 2px;
		}
		.msg-feature p {
			font-size: 0.75rem;
			color: var(--text-muted);
			margin: 0;
		}
		.msg-code-example {
			background: rgba(0, 0, 0, 0.3);
			border-radius: 10px;
			padding: 14px;
		}
		.msg-code-example p {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 10px;
		}
		.msg-code-example pre {
			margin: 0;
			overflow-x: auto;
		}
		.msg-code-example code {
			font-family: 'SF Mono', Monaco, monospace;
			font-size: 0.8rem;
			color: var(--text);
			line-height: 1.5;
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
		.search-result-badge.listed {
			background: rgba(139, 92, 246, 0.15);
			color: #a78bfa;
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
			padding: 7px 12px;
			background: transparent;
			border: 1px solid var(--border);
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.25s ease;
			color: var(--text-dim);
			font-size: 0.78rem;
			margin-right: 10px;
		}
		.search-btn:hover {
			border-color: rgba(96, 165, 250, 0.35);
			background: rgba(96, 165, 250, 0.06);
			color: #60a5fa;
			box-shadow: 0 0 20px rgba(96, 165, 250, 0.08);
		}
		.search-btn svg {
			width: 14px;
			height: 14px;
			opacity: 0.6;
		}
		.search-btn:hover svg {
			opacity: 1;
		}
		.search-btn kbd {
			background: rgba(104, 137, 176, 0.06);
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
			border: 1px solid var(--border);
			border-radius: 14px;
			padding: 22px;
			margin-bottom: 20px;
			box-shadow: var(--shadow), var(--shadow-glow);
		}
		.upload-section h3 {
			color: var(--text);
			font-size: 0.85rem;
			font-weight: 600;
			margin-bottom: 16px;
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

		/* ===== AVAILABILITY SECTION (Timer + Compact Bounties) ===== */
		.availability-section {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(59, 130, 246, 0.04));
			border: 1px solid rgba(139, 92, 246, 0.2);
			border-radius: 12px;
			padding: 16px;
			margin-bottom: 16px;
		}
		.availability-container {
			display: grid;
			grid-template-columns: 1.4fr 0.6fr;
			gap: 16px;
			align-items: stretch;
		}
		@media (max-width: 600px) {
			.availability-container {
				grid-template-columns: 1fr;
				gap: 12px;
			}
		}

		/* Timer Side (Left) */
		.avail-timer-side {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 24px 16px;
			background: rgba(0, 0, 0, 0.25);
			border-radius: 10px;
			border: 1px solid rgba(139, 92, 246, 0.25);
		}
		.avail-timer-header {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.8rem;
			font-weight: 700;
			color: var(--accent);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 12px;
		}
		.avail-timer-header svg {
			width: 16px;
			height: 16px;
		}
		.avail-timer-display {
			display: flex;
			align-items: center;
			gap: 4px;
			margin-bottom: 10px;
		}
		.avail-timer-unit {
			display: flex;
			flex-direction: column;
			align-items: center;
			min-width: 50px;
			padding: 12px 6px;
			background: rgba(139, 92, 246, 0.2);
			border: 1px solid rgba(139, 92, 246, 0.35);
			border-radius: 10px;
		}
		.avail-timer-value {
			font-family: var(--font-mono, ui-monospace, monospace);
			font-size: 1.75rem;
			font-weight: 800;
			color: var(--accent);
			line-height: 1;
		}
		.avail-timer-label {
			font-size: 0.6rem;
			font-weight: 700;
			color: var(--text-muted);
			text-transform: uppercase;
			margin-top: 4px;
		}
		.avail-timer-sep {
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--accent);
			opacity: 0.4;
			margin-bottom: 16px;
		}
		.avail-timer-date {
			font-size: 0.75rem;
			color: var(--text-muted);
			opacity: 0.9;
		}

		/* Bounty Side (Right) - Compact */
		.avail-bounty-side {
			display: flex;
			flex-direction: column;
			padding: 12px;
			background: rgba(0, 0, 0, 0.15);
			border-radius: 10px;
			border: 1px solid rgba(168, 85, 247, 0.15);
		}
		.avail-bounty-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 8px;
		}
		.avail-bounty-title {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.7rem;
			font-weight: 700;
			color: var(--text);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.avail-bounty-title svg {
			width: 14px;
			height: 14px;
			color: #a855f7;
		}
		.avail-bounty-refresh {
			background: transparent;
			border: none;
			padding: 4px;
			cursor: pointer;
			color: var(--text-muted);
			border-radius: 4px;
			transition: all 0.15s ease;
		}
		.avail-bounty-refresh:hover {
			color: var(--accent);
			background: rgba(139, 92, 246, 0.1);
		}
		.avail-bounty-refresh svg {
			width: 14px;
			height: 14px;
		}
		.avail-bounty-list {
			flex: 1;
			min-height: 60px;
			max-height: 100px;
			overflow-y: auto;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 6px;
			padding: 6px;
			margin-bottom: 8px;
		}
		.avail-bounty-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: var(--text-muted);
			font-size: 0.75rem;
		}
		.avail-bounty-empty {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 12px;
			color: var(--text-muted);
			font-size: 0.75rem;
			font-style: italic;
		}
		.avail-bounty-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			width: 100%;
			padding: 8px 12px;
			background: linear-gradient(135deg, #8b5cf6, #a855f7);
			border: none;
			border-radius: 6px;
			color: white;
			font-size: 0.75rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.avail-bounty-btn:hover {
			background: linear-gradient(135deg, #7c3aed, #9333ea);
			transform: translateY(-1px);
		}
		.avail-bounty-btn svg {
			width: 14px;
			height: 14px;
		}
		.avail-bounty-status {
			margin-top: 6px;
			padding: 6px 8px;
			border-radius: 4px;
			font-size: 0.7rem;
			text-align: center;
		}

		/* Linked Names Section */
		.linked-names-section {
			background: rgba(0, 0, 0, 0.15);
			border: 1px solid rgba(139, 92, 246, 0.15);
			border-radius: 10px;
			padding: 12px;
			margin-bottom: 16px;
			display: flex;
			flex-direction: column;
		}
		.linked-names-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 10px;
		}
		.linked-names-title {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.75rem;
			font-weight: 700;
			color: var(--text);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.linked-names-title svg {
			width: 14px;
			height: 14px;
			color: var(--accent);
		}
		.linked-names-count {
			font-size: 0.7rem;
			color: var(--text-muted);
			background: rgba(139, 92, 246, 0.15);
			padding: 2px 8px;
			border-radius: 10px;
		}
		.linked-names-list {
			display: flex;
			flex-direction: column;
			gap: 10px;
			flex: 1 1 auto;
			overflow-y: auto;
			min-height: 100px;
		}
		.linked-names-loading {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--text-muted);
			font-size: 0.75rem;
			padding: 8px 0;
		}
		/* Grouped layout */
		.linked-group {
			background: rgba(0, 0, 0, 0.1);
			border-radius: 8px;
			padding: 8px;
		}
		.linked-group-header {
			display: flex;
			align-items: center;
			gap: 8px;
			width: 100%;
			padding: 8px;
			margin: -8px -8px 6px -8px;
			background: rgba(139, 92, 246, 0.1);
			border: none;
			border-radius: 6px 6px 0 0;
			cursor: pointer;
			font-family: inherit;
			color: var(--text);
			transition: background 0.15s ease;
		}
		.linked-group-header:hover {
			background: rgba(139, 92, 246, 0.2);
		}
		.linked-group-chevron {
			width: 16px;
			height: 16px;
			color: var(--text-muted);
			transition: transform 0.2s ease;
			flex-shrink: 0;
		}
		.linked-group.collapsed .linked-group-chevron {
			transform: rotate(-90deg);
		}
		.linked-group-names {
			display: flex;
			flex-wrap: wrap;
			gap: 5px;
		}
		.linked-group.collapsed .linked-group-names {
			display: none;
		}
		.linked-group.collapsed .linked-group-header {
			margin-bottom: -8px;
			border-radius: 6px;
		}
		.linked-group-addr {
			font-size: 0.65rem;
			font-family: var(--font-mono, monospace);
			color: var(--text-muted);
		}
		.linked-group-count {
			font-size: 0.6rem;
			font-weight: 600;
			color: var(--text-muted);
			background: rgba(139, 92, 246, 0.15);
			padding: 1px 6px;
			margin-left: auto;
			border-radius: 8px;
		}
		.linked-name-chip {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			padding: 4px 6px 4px 10px;
			background: rgba(139, 92, 246, 0.15);
			border: 1px solid rgba(139, 92, 246, 0.25);
			border-radius: 16px;
			font-size: 0.75rem;
			font-family: inherit;
			color: var(--accent);
			text-decoration: none;
			transition: all 0.15s ease;
		}
		.linked-name-chip:hover {
			background: rgba(139, 92, 246, 0.25);
			border-color: rgba(139, 92, 246, 0.4);
		}
		.linked-name-chip.current {
			background: rgba(139, 92, 246, 0.3);
			border-color: var(--accent);
			font-weight: 600;
		}
		/* Primary name highlighting */
		.linked-name-chip.primary {
			background: linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(251, 191, 36, 0.15));
			border-color: rgba(250, 204, 21, 0.4);
		}
		.linked-name-chip.primary .linked-name-text {
			color: #fbbf24;
			font-weight: 600;
		}
		.linked-name-chip.primary .primary-icon {
			width: 12px;
			height: 12px;
			color: #fbbf24;
			fill: rgba(250, 204, 21, 0.3);
		}
		.linked-name-chip svg {
			width: 10px;
			height: 10px;
		}
		.linked-name-text {
			color: var(--text);
			text-decoration: none;
			cursor: pointer;
			transition: color 0.15s ease;
		}
		.linked-name-text:hover {
			color: var(--accent);
			text-decoration: underline;
		}
		.linked-name-chip .linked-name-text {
			flex: 1;
		}
		.linked-name-extend {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			padding: 0;
			margin-left: auto;
			background: rgba(139, 92, 246, 0.2);
			border: 1px solid rgba(139, 92, 246, 0.3);
			border-radius: 4px;
			color: var(--accent);
			cursor: pointer;
			transition: all 0.15s ease;
			flex-shrink: 0;
		}
		.linked-name-extend:hover {
			background: rgba(139, 92, 246, 0.4);
			border-color: var(--accent);
			transform: scale(1.1);
		}
		.linked-name-extend svg {
			width: 12px;
			height: 12px;
		}
		.linked-name-tag {
			font-size: 0.6rem;
			font-weight: 700;
			padding: 2px 6px;
			border-radius: 8px;
			text-transform: uppercase;
			letter-spacing: 0.02em;
		}
		.linked-name-tag.blue {
			background: rgba(59, 130, 246, 0.2);
			color: #60a5fa;
		}
		.linked-name-tag.green {
			background: rgba(34, 197, 94, 0.2);
			color: #4ade80;
		}
		.linked-name-tag.yellow {
			background: rgba(250, 204, 21, 0.2);
			color: #fbbf24;
		}
		.linked-name-tag.red {
			background: rgba(239, 68, 68, 0.2);
			color: #f87171;
		}
		.linked-name-tag.gray {
			background: rgba(107, 114, 128, 0.2);
			color: #9ca3af;
		}
		.linked-names-empty {
			color: var(--text-muted);
			font-size: 0.75rem;
			font-style: italic;
			padding: 8px 0;
		}
		.linked-names-hint {
			font-size: 0.65rem;
			color: var(--text-dim);
			text-align: center;
			margin-top: 8px;
			padding-top: 8px;
			border-top: 1px solid rgba(139, 92, 246, 0.1);
		}
		.linked-name-chip.selected {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(139, 92, 246, 0.3));
			border-color: var(--accent);
			box-shadow: 0 0 12px rgba(96, 165, 250, 0.3);
		}
		.linked-name-chip.selected .linked-name-text {
			color: var(--accent);
			font-weight: 600;
		}
		/* Renewal card standalone */
		.renewal-card {
			margin-bottom: 16px;
		}
		.renewal-selected-name {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			margin-top: 4px;
		}
		.renewal-name-label {
			color: var(--text-muted);
		}
		.renewal-name-value {
			color: var(--accent);
			font-weight: 600;
			font-family: var(--font-mono, monospace);
		}
		.renewal-card-body .renewal-expiry-info {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.75rem;
		}
		.bounty-create-btn {
			display: inline-flex;
			align-items: center;
			gap: 10px;
			padding: 12px 28px;
			background: linear-gradient(135deg, #8b5cf6, #a855f7);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.95rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
		}
		.bounty-create-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
		}
		.bounty-create-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}
		.bounty-create-btn svg {
			width: 18px;
			height: 18px;
		}
		.bounty-create-info {
			font-size: 0.75rem;
			color: var(--text-muted);
		}
		.bounty-create-status {
			width: 100%;
			text-align: center;
			margin-top: 8px;
			padding: 8px 12px;
			border-radius: 8px;
			font-size: 0.85rem;
		}
		.bounty-create-status.loading {
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: var(--accent);
		}
		.bounty-create-status.success {
			background: rgba(34, 197, 94, 0.12);
			border: 1px solid rgba(34, 197, 94, 0.3);
			color: #22c55e;
		}
		.bounty-create-status.error {
			background: rgba(248, 113, 113, 0.12);
			border: 1px solid rgba(248, 113, 113, 0.3);
			color: #f87171;
		}
		.bounty-create-status a {
			color: inherit;
			text-decoration: underline;
		}
		@media (max-width: 480px) {
			.bounty-timer-unit {
				min-width: 48px;
				padding: 10px 6px;
			}
			.bounty-timer-value {
				font-size: 1.25rem;
			}
			.bounty-create-btn {
				width: 100%;
			}
		}

		/* ===== BID QUEUE & BOUNTY HERO SECTION (legacy) ===== */
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
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.bounty-mode-toggle {
			display: flex;
			background: rgba(0, 0, 0, 0.3);
			border-radius: 8px;
			padding: 2px;
			border: 1px solid var(--border);
		}
		.bounty-mode-btn {
			padding: 4px 10px;
			border-radius: 6px;
			font-size: 0.7rem;
			font-weight: 700;
			cursor: pointer;
			border: none;
			background: transparent;
			color: var(--text-muted);
			transition: all 0.2s;
		}
		.bounty-mode-btn.active {
			background: var(--accent);
			color: white;
		}
		.create-bounty-mode-desc {
			margin-top: 12px;
			font-size: 0.75rem;
			color: var(--text-muted);
			background: rgba(96, 165, 250, 0.05);
			padding: 10px 12px;
			border-radius: 10px;
			border-left: 3px solid var(--accent);
			line-height: 1.4;
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
		/* Simplified single-button bounty creation */
		.create-bounty-simple {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 16px;
			background: rgba(139, 92, 246, 0.08);
			border: 1px dashed rgba(139, 92, 246, 0.3);
			border-radius: 12px;
			margin-top: 12px;
		}
		.create-bounty-btn-simple {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 10px;
			width: 100%;
			padding: 14px 24px;
			background: linear-gradient(135deg, #8b5cf6, #a855f7);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.95rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
		}
		.create-bounty-btn-simple:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
		}
		.create-bounty-btn-simple:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
			box-shadow: none;
		}
		.create-bounty-btn-simple svg {
			width: 18px;
			height: 18px;
		}
		.create-bounty-simple-info {
			font-size: 0.75rem;
			color: var(--text-muted);
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
			border-color: var(--border-glow) !important;
			background: rgba(104, 137, 176, 0.06) !important;
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(104, 137, 176, 0.1);
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

		/* ===== FLOATING APP BAR ===== */
		.floating-app-bar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			background: rgba(10, 10, 15, 0.95);
			backdrop-filter: blur(20px);
			border-top: 1px solid var(--border);
			padding: 8px 0;
			padding-bottom: max(8px, env(safe-area-inset-bottom));
			z-index: 1000;
			display: flex;
			justify-content: center;
		}

		.app-bar-inner {
			display: flex;
			gap: 4px;
			max-width: 500px;
			width: 100%;
			padding: 0 16px;
		}

		.app-bar-btn {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			padding: 8px 4px;
			background: transparent;
			border: none;
			border-radius: 12px;
			color: var(--text-muted);
			font-size: 0.7rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
			text-decoration: none;
		}

		.app-bar-btn:hover {
			background: var(--accent-light);
			color: var(--accent);
		}

		.app-bar-btn.active {
			color: var(--accent);
		}

		.app-bar-btn svg {
			width: 22px;
			height: 22px;
		}

		.app-bar-btn .badge {
			position: absolute;
			top: 2px;
			right: 2px;
			min-width: 16px;
			height: 16px;
			background: var(--error);
			color: white;
			font-size: 0.65rem;
			font-weight: 700;
			border-radius: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0 4px;
		}

		/* Adjust body padding for floating bar */
		body.has-app-bar {
			padding-bottom: 80px;
		}

		/* ===== FULL CHAT VIEW ===== */
		.chat-fullscreen {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: var(--bg-gradient-start);
			z-index: 2000;
			display: flex;
			flex-direction: column;
		}

		.chat-fullscreen.hidden {
			display: none;
		}

		.chat-header {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			background: var(--card-bg);
			border-bottom: 1px solid var(--border);
		}

		.chat-back-btn {
			background: none;
			border: none;
			color: var(--accent);
			cursor: pointer;
			padding: 8px;
			border-radius: 8px;
			display: flex;
			align-items: center;
		}

		.chat-back-btn:hover {
			background: var(--accent-light);
		}

		.chat-header-info {
			flex: 1;
		}

		.chat-header-name {
			font-weight: 600;
			font-size: 1rem;
		}

		.chat-header-status {
			font-size: 0.8rem;
			color: var(--text-muted);
		}

		.chat-messages {
			flex: 1;
			overflow-y: auto;
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.chat-bubble {
			max-width: 80%;
			padding: 10px 14px;
			border-radius: 16px;
			font-size: 0.9rem;
			line-height: 1.4;
		}

		.chat-bubble.sent {
			align-self: flex-end;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			color: white;
			border-bottom-right-radius: 4px;
		}

		.chat-bubble.received {
			align-self: flex-start;
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-bottom-left-radius: 4px;
		}

		.chat-bubble-time {
			font-size: 0.7rem;
			color: rgba(255,255,255,0.6);
			margin-top: 4px;
			text-align: right;
		}

		.chat-bubble.received .chat-bubble-time {
			color: var(--text-muted);
		}

		.chat-input-bar {
			display: flex;
			align-items: flex-end;
			gap: 8px;
			padding: 12px 16px;
			background: var(--card-bg);
			border-top: 1px solid var(--border);
		}

		.chat-input {
			flex: 1;
			background: var(--bg-gradient-start);
			border: 1px solid var(--border);
			border-radius: 20px;
			padding: 10px 16px;
			color: var(--text);
			font-size: 0.9rem;
			resize: none;
			max-height: 120px;
			min-height: 40px;
		}

		.chat-input:focus {
			outline: none;
			border-color: var(--accent);
		}

		.chat-send-btn {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border: none;
			color: white;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: transform 0.2s;
		}

		.chat-send-btn:hover {
			transform: scale(1.05);
		}

		.chat-send-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.chat-send-btn svg {
			width: 20px;
			height: 20px;
		}

		/* ===== CONVERSATIONS LIST ===== */
		.conversations-panel {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: var(--bg-gradient-start);
			z-index: 2000;
			display: flex;
			flex-direction: column;
		}

		.conversations-panel.hidden {
			display: none;
		}

		.conversations-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 16px;
			background: var(--card-bg);
			border-bottom: 1px solid var(--border);
		}

		.conversations-header h2 {
			font-size: 1.25rem;
			font-weight: 700;
		}

		.conversations-close {
			background: none;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			padding: 8px;
			border-radius: 8px;
		}

		.conversations-close:hover {
			color: var(--text);
			background: var(--accent-light);
		}

		.conversations-search {
			padding: 12px 16px;
			background: var(--card-bg);
		}

		.conversations-search input {
			width: 100%;
			padding: 10px 16px;
			background: var(--bg-gradient-start);
			border: 1px solid var(--border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.9rem;
		}

		.conversations-search input:focus {
			outline: none;
			border-color: var(--accent);
		}

		.conversations-list {
			flex: 1;
			overflow-y: auto;
		}

		.conversation-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			border-bottom: 1px solid var(--border);
			cursor: pointer;
			transition: background 0.2s;
		}

		.conversation-item:hover {
			background: var(--accent-light);
		}

		.conversation-avatar {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 1.1rem;
			color: white;
		}

		.conversation-info {
			flex: 1;
			min-width: 0;
		}

		.conversation-name {
			font-weight: 600;
			margin-bottom: 2px;
		}

		.conversation-preview {
			font-size: 0.85rem;
			color: var(--text-muted);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.conversation-meta {
			text-align: right;
		}

		.conversation-time {
			font-size: 0.75rem;
			color: var(--text-muted);
		}

		.conversation-unread {
			background: var(--accent);
			color: white;
			font-size: 0.7rem;
			font-weight: 700;
			min-width: 18px;
			height: 18px;
			border-radius: 9px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0 6px;
			margin-top: 4px;
		}

		.conversations-fab {
			position: absolute;
			bottom: 24px;
			right: 24px;
			width: 56px;
			height: 56px;
			border-radius: 50%;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border: none;
			color: white;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4px 20px rgba(96, 165, 250, 0.4);
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.conversations-fab:hover {
			transform: scale(1.05);
			box-shadow: 0 6px 24px rgba(96, 165, 250, 0.5);
		}

		.conversations-fab svg {
			width: 24px;
			height: 24px;
		}

		/* ===== CHANNELS PANEL ===== */
		.channels-panel {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: var(--bg-gradient-start);
			z-index: 2000;
			display: flex;
			flex-direction: column;
		}

		.channels-panel.hidden {
			display: none;
		}

		.channel-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			border-bottom: 1px solid var(--border);
			cursor: pointer;
			transition: background 0.2s;
		}

		.channel-item:hover {
			background: var(--accent-light);
		}

		.channel-avatar {
			width: 48px;
			height: 48px;
			border-radius: 12px;
			background: linear-gradient(135deg, #22c55e, #10b981);
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 1.25rem;
			color: white;
		}

		.channel-info {
			flex: 1;
			min-width: 0;
		}

		.channel-name {
			font-weight: 600;
			margin-bottom: 2px;
			display: flex;
			align-items: center;
			gap: 6px;
		}

		.channel-name .verified {
			color: var(--accent);
		}

		.channel-members {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		.channel-tag {
			font-size: 0.7rem;
			padding: 2px 6px;
			background: var(--accent-light);
			color: var(--accent);
			border-radius: 4px;
		}

		/* ===== NEWS PANEL ===== */
		.news-panel {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: var(--bg-gradient-start);
			z-index: 2000;
			display: flex;
			flex-direction: column;
		}

		.news-panel.hidden {
			display: none;
		}

		.news-item {
			padding: 16px;
			border-bottom: 1px solid var(--border);
		}

		.news-item-header {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 10px;
		}

		.news-item-avatar {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			background: linear-gradient(135deg, var(--warning), #f59e0b);
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			color: white;
		}

		.news-item-meta {
			flex: 1;
		}

		.news-item-author {
			font-weight: 600;
			font-size: 0.9rem;
		}

		.news-item-time {
			font-size: 0.8rem;
			color: var(--text-muted);
		}

		.news-item-content {
			font-size: 0.95rem;
			line-height: 1.6;
			white-space: pre-wrap;
		}

		.news-item-actions {
			display: flex;
			gap: 16px;
			margin-top: 12px;
			padding-top: 12px;
			border-top: 1px solid var(--border);
		}

		.news-action-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			background: none;
			border: none;
			color: var(--text-muted);
			cursor: pointer;
			font-size: 0.85rem;
			padding: 4px 8px;
			border-radius: 6px;
			transition: all 0.2s;
		}

		.news-action-btn:hover {
			color: var(--accent);
			background: var(--accent-light);
		}

		.news-action-btn svg {
			width: 18px;
			height: 18px;
		}

		/* ===== AGENTS PANEL ===== */
		.agents-panel {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: var(--bg-gradient-start);
			z-index: 2000;
			display: flex;
			flex-direction: column;
		}

		.agents-panel.hidden {
			display: none;
		}

		.agent-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			border-bottom: 1px solid var(--border);
			cursor: pointer;
			transition: background 0.2s;
		}

		.agent-item:hover {
			background: var(--accent-light);
		}

		.agent-avatar {
			width: 48px;
			height: 48px;
			border-radius: 12px;
			background: linear-gradient(135deg, #8b5cf6, #a78bfa);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 1.5rem;
		}

		.agent-info {
			flex: 1;
		}

		.agent-name {
			font-weight: 600;
			margin-bottom: 2px;
		}

		.agent-desc {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		.agent-badge {
			font-size: 0.7rem;
			padding: 2px 8px;
			border-radius: 4px;
			font-weight: 600;
		}

		.agent-badge.llm {
			background: rgba(139, 92, 246, 0.15);
			color: #a78bfa;
		}

		.agent-badge.human {
			background: rgba(34, 197, 94, 0.15);
			color: #22c55e;
		}

		/* ============================================
		   MVR Dashboard Styles
		   ============================================ */

		.mvr-dashboard {
			padding: 4px;
		}

		.mvr-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20px;
			flex-wrap: wrap;
			gap: 16px;
		}

		.mvr-header-title {
			display: flex;
			align-items: center;
			gap: 14px;
		}

		.mvr-header-title svg {
			width: 32px;
			height: 32px;
			color: var(--accent);
		}

		.mvr-header-title h2 {
			font-size: 1.5rem;
			margin: 0;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}

		.mvr-namespace {
			font-size: 0.9rem;
			color: var(--text-muted);
			font-family: ui-monospace, monospace;
		}

		.mvr-external-link {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 8px 14px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 8px;
			color: var(--accent);
			text-decoration: none;
			font-size: 0.85rem;
			font-weight: 500;
			transition: all 0.2s;
		}

		.mvr-external-link:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: var(--accent);
		}

		.mvr-external-link svg {
			width: 14px;
			height: 14px;
		}

		.mvr-stats {
			display: flex;
			gap: 16px;
			margin-bottom: 24px;
			flex-wrap: wrap;
		}

		.mvr-stat {
			flex: 1;
			min-width: 100px;
			padding: 16px 20px;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.6), rgba(20, 20, 30, 0.7));
			border: 1px solid var(--border);
			border-radius: 12px;
			text-align: center;
		}

		.mvr-stat-value {
			display: block;
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--text);
			margin-bottom: 4px;
		}

		.mvr-stat-value.mvr-stat-network {
			font-size: 1rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--accent);
		}

		.mvr-stat-label {
			font-size: 0.8rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.03em;
		}

		.mvr-tabs {
			display: flex;
			gap: 4px;
			margin-bottom: 20px;
			padding: 4px;
			background: rgba(15, 15, 20, 0.5);
			border-radius: 12px;
			overflow-x: auto;
		}

		.mvr-tab {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 10px 14px;
			background: transparent;
			border: none;
			border-radius: 8px;
			color: var(--text-muted);
			font-size: 0.85rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
			white-space: nowrap;
		}

		.mvr-tab svg {
			width: 16px;
			height: 16px;
		}

		.mvr-tab:hover {
			background: rgba(96, 165, 250, 0.1);
			color: var(--text);
		}

		.mvr-tab.active {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.2), rgba(139, 92, 246, 0.2));
			color: var(--accent);
		}

		.mvr-tab-content {
			display: none;
		}

		.mvr-tab-content.active {
			display: block;
			animation: mvrFadeIn 0.2s ease;
		}

		@keyframes mvrFadeIn {
			from { opacity: 0; transform: translateY(8px); }
			to { opacity: 1; transform: translateY(0); }
		}

		.mvr-packages-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 16px;
		}

		.mvr-packages-header h3 {
			font-size: 1.1rem;
			margin: 0;
		}

		.mvr-refresh-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 12px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 8px;
			color: var(--accent);
			font-size: 0.8rem;
			cursor: pointer;
			transition: all 0.2s;
		}

		.mvr-refresh-btn svg {
			width: 14px;
			height: 14px;
		}

		.mvr-refresh-btn:hover {
			background: rgba(96, 165, 250, 0.2);
		}

		.mvr-packages-list {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.mvr-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12px;
			padding: 40px;
			color: var(--text-muted);
		}

		.mvr-packages-empty {
			text-align: center;
			padding: 48px 24px;
			color: var(--text-muted);
		}

		.mvr-packages-empty svg {
			width: 48px;
			height: 48px;
			margin-bottom: 16px;
			opacity: 0.4;
		}

		.mvr-packages-empty p {
			font-size: 1.1rem;
			margin-bottom: 8px;
			color: var(--text);
		}

		.mvr-empty-action {
			margin-top: 20px;
			padding: 12px 24px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			border: none;
			border-radius: 10px;
			color: white;
			font-weight: 600;
			cursor: pointer;
			transition: transform 0.2s;
		}

		.mvr-empty-action:hover {
			transform: translateY(-2px);
		}

		.mvr-package-card {
			padding: 16px;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.6), rgba(20, 20, 30, 0.7));
			border: 1px solid var(--border);
			border-radius: 12px;
			transition: all 0.2s;
		}

		.mvr-package-card:hover {
			border-color: rgba(96, 165, 250, 0.3);
		}

		.mvr-package-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 12px;
		}

		.mvr-package-name {
			font-size: 1rem;
			font-weight: 600;
			color: var(--accent);
		}

		.mvr-package-version {
			font-size: 0.75rem;
			padding: 4px 10px;
			background: rgba(52, 211, 153, 0.15);
			color: var(--success);
			border-radius: 6px;
			font-weight: 600;
		}

		.mvr-package-addr {
			font-family: ui-monospace, monospace;
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 8px;
			word-break: break-all;
		}

		.mvr-package-meta {
			display: flex;
			gap: 16px;
			font-size: 0.8rem;
			color: var(--text-muted);
		}

		.mvr-package-meta a {
			color: var(--accent);
			text-decoration: none;
		}

		.mvr-form-section {
			padding: 20px;
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			border: 1px solid var(--border);
			border-radius: 14px;
			margin-bottom: 20px;
		}

		.mvr-form-section h3 {
			font-size: 1.15rem;
			margin: 0 0 8px 0;
		}

		.mvr-form-desc {
			font-size: 0.9rem;
			color: var(--text-muted);
			margin-bottom: 20px;
			line-height: 1.5;
		}

		.mvr-form-desc code {
			background: rgba(96, 165, 250, 0.1);
			padding: 2px 6px;
			border-radius: 4px;
			font-size: 0.85em;
		}

		.mvr-form {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.mvr-form-grid {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 16px;
		}

		@media (max-width: 600px) {
			.mvr-form-grid {
				grid-template-columns: 1fr;
			}
		}

		.mvr-form-group {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}

		.mvr-form-group label {
			font-size: 0.85rem;
			font-weight: 600;
			color: var(--text-muted);
		}

		.mvr-form-group label .optional {
			font-weight: 400;
			opacity: 0.6;
		}

		.mvr-form-group input,
		.mvr-form-group textarea,
		.mvr-form-group select {
			padding: 12px 14px;
			background: rgba(15, 18, 32, 0.8);
			border: 1px solid var(--border);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.95rem;
			font-family: inherit;
			transition: border-color 0.2s;
		}

		.mvr-form-group input.mono,
		.mvr-form-group textarea.mono {
			font-family: ui-monospace, monospace;
			font-size: 0.85rem;
		}

		.mvr-form-group input:focus,
		.mvr-form-group textarea:focus,
		.mvr-form-group select:focus {
			outline: none;
			border-color: var(--accent);
		}

		.mvr-form-group input[readonly] {
			opacity: 0.6;
			cursor: not-allowed;
		}

		.mvr-form-group textarea {
			resize: vertical;
			min-height: 60px;
		}

		.mvr-hint {
			font-size: 0.8rem;
			color: var(--text-muted);
			opacity: 0.7;
		}

		.mvr-form-actions {
			display: flex;
			gap: 12px;
			margin-top: 8px;
		}

		.mvr-btn-primary {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 12px 24px;
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.95rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}

		.mvr-btn-primary:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
		}

		.mvr-btn-primary:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
		}

		.mvr-btn-primary svg {
			width: 18px;
			height: 18px;
		}

		.mvr-btn-secondary {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 10px 18px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.3);
			border-radius: 8px;
			color: var(--accent);
			font-size: 0.9rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.mvr-btn-secondary:hover {
			background: rgba(96, 165, 250, 0.2);
		}

		.mvr-quick-fill {
			padding: 16px;
			background: rgba(96, 165, 250, 0.08);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 10px;
		}

		.mvr-quick-fill label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.9rem;
			font-weight: 600;
			color: var(--accent);
			margin-bottom: 10px;
		}

		.mvr-quick-fill label svg {
			width: 16px;
			height: 16px;
		}

		.mvr-quick-fill textarea {
			width: 100%;
			padding: 12px;
			background: rgba(15, 18, 32, 0.8);
			border: 1px solid var(--border);
			border-radius: 8px;
			color: var(--text);
			font-size: 0.85rem;
			font-family: ui-monospace, monospace;
			min-height: 80px;
			resize: vertical;
		}

		.mvr-quick-fill-actions {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-top: 10px;
		}

		#mvr-parse-feedback {
			font-size: 0.8rem;
			color: var(--success);
		}

		.mvr-status {
			padding: 12px 16px;
			border-radius: 10px;
			font-size: 0.9rem;
		}

		.mvr-status.success {
			background: rgba(52, 211, 153, 0.15);
			border: 1px solid rgba(52, 211, 153, 0.3);
			color: var(--success);
		}

		.mvr-status.error {
			background: rgba(248, 113, 113, 0.15);
			border: 1px solid rgba(248, 113, 113, 0.3);
			color: var(--error);
		}

		.mvr-status.info {
			background: rgba(96, 165, 250, 0.15);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: var(--accent);
		}

		.mvr-warning {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 14px 16px;
			background: rgba(251, 191, 36, 0.1);
			border: 1px solid rgba(251, 191, 36, 0.3);
			border-radius: 10px;
			color: var(--warning);
			margin-bottom: 16px;
		}

		.mvr-warning svg {
			width: 20px;
			height: 20px;
			flex-shrink: 0;
		}

		.mvr-lookup-results {
			margin-top: 20px;
			padding: 16px;
			background: rgba(15, 18, 32, 0.6);
			border: 1px solid var(--border);
			border-radius: 10px;
		}

		.mvr-lookup-results h4 {
			font-size: 1rem;
			margin: 0 0 12px 0;
		}

		#mvr-lookup-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.mvr-lookup-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px;
			background: rgba(30, 30, 40, 0.5);
			border-radius: 8px;
			gap: 12px;
		}

		.mvr-lookup-item .addr {
			font-family: ui-monospace, monospace;
			font-size: 0.8rem;
			color: var(--text-muted);
			word-break: break-all;
			flex: 1;
		}

		.mvr-lookup-item .name {
			font-weight: 600;
			color: var(--accent);
			white-space: nowrap;
		}

		.mvr-lookup-item .not-found {
			color: var(--text-muted);
			font-style: italic;
		}

		.mvr-resolve-result {
			margin-top: 16px;
			padding: 16px;
			background: rgba(52, 211, 153, 0.1);
			border: 1px solid rgba(52, 211, 153, 0.2);
			border-radius: 10px;
		}

		.mvr-resolve-result .label {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 4px;
		}

		.mvr-resolve-result .value {
			font-family: ui-monospace, monospace;
			font-size: 0.9rem;
			word-break: break-all;
		}

		.mvr-sdk-section {
			margin-bottom: 24px;
		}

		.mvr-sdk-section h3 {
			font-size: 1.15rem;
			margin: 0 0 8px 0;
		}

		.mvr-code-block {
			margin: 12px 0;
			background: rgba(10, 10, 15, 0.8);
			border: 1px solid var(--border);
			border-radius: 10px;
			overflow: hidden;
		}

		.mvr-code-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 10px 14px;
			background: rgba(30, 30, 40, 0.5);
			border-bottom: 1px solid var(--border);
		}

		.mvr-code-header span {
			font-size: 0.8rem;
			font-weight: 600;
			color: var(--text-muted);
		}

		.mvr-copy-btn {
			padding: 4px 10px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 6px;
			color: var(--accent);
			font-size: 0.75rem;
			cursor: pointer;
			transition: all 0.2s;
		}

		.mvr-copy-btn:hover {
			background: rgba(96, 165, 250, 0.2);
		}

		.mvr-code-block pre {
			margin: 0;
			padding: 14px;
			overflow-x: auto;
		}

		.mvr-code-block code {
			font-family: 'Fira Code', ui-monospace, monospace;
			font-size: 0.8rem;
			line-height: 1.5;
			color: var(--text);
		}

		.mvr-api-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.mvr-api-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 14px;
			background: rgba(30, 30, 40, 0.5);
			border: 1px solid var(--border);
			border-radius: 8px;
		}

		.mvr-api-method {
			padding: 4px 10px;
			background: rgba(52, 211, 153, 0.15);
			color: var(--success);
			border-radius: 6px;
			font-size: 0.7rem;
			font-weight: 700;
			text-transform: uppercase;
		}

		.mvr-api-method.post {
			background: rgba(96, 165, 250, 0.15);
			color: var(--accent);
		}

		.mvr-api-item code {
			font-family: ui-monospace, monospace;
			font-size: 0.85rem;
			color: var(--text);
		}

		.mvr-api-desc {
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-left: auto;
		}

		.mvr-info-box {
			padding: 16px;
			background: rgba(96, 165, 250, 0.08);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 12px;
			margin-top: 20px;
		}

		.mvr-info-box h4 {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 1rem;
			margin: 0 0 12px 0;
			color: var(--accent);
		}

		.mvr-info-box h4 svg {
			width: 18px;
			height: 18px;
		}

		.mvr-info-box p {
			font-size: 0.9rem;
			color: var(--text-muted);
			margin-bottom: 12px;
			line-height: 1.5;
		}

		.mvr-info-box pre {
			margin: 0;
			padding: 12px;
			background: rgba(10, 10, 15, 0.6);
			border-radius: 8px;
			overflow-x: auto;
		}

		.mvr-info-box code {
			font-family: 'Fira Code', ui-monospace, monospace;
			font-size: 0.8rem;
			line-height: 1.5;
		}

		.mvr-practices ul {
			margin: 0;
			padding-left: 20px;
		}

		.mvr-practices li {
			font-size: 0.85rem;
			color: var(--text-muted);
			margin-bottom: 10px;
			line-height: 1.5;
		}

		.mvr-practices li strong {
			color: var(--text);
		}

		.mvr-practices code {
			background: rgba(96, 165, 250, 0.1);
			padding: 2px 6px;
			border-radius: 4px;
			font-size: 0.8em;
		}

		/* ========================================
		   Privacy Dashboard Styles
		   ======================================== */

		.privacy-dashboard {
			padding: 24px;
			max-width: 1200px;
			margin: 0 auto;
		}

		.privacy-header {
			margin-bottom: 24px;
		}

		.privacy-title {
			display: flex;
			align-items: center;
			gap: 16px;
		}

		.privacy-title svg {
			color: var(--accent);
		}

		.privacy-title h2 {
			margin: 0;
			font-size: 1.5rem;
			color: var(--text);
		}

		.privacy-subtitle {
			margin: 4px 0 0 0;
			font-size: 0.875rem;
			color: var(--text-muted);
		}

		/* Protocol Status Cards */
		.privacy-protocols {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
			gap: 16px;
			margin-bottom: 24px;
		}

		.protocol-card {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 20px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.protocol-card.vortex-card {
			border-left: 3px solid #8b5cf6;
		}

		.protocol-card.seal-card {
			border-left: 3px solid #f59e0b;
		}

		.protocol-card.walrus-card {
			border-left: 3px solid #06b6d4;
		}

		.protocol-icon {
			width: 48px;
			height: 48px;
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.vortex-card .protocol-icon {
			background: rgba(139, 92, 246, 0.15);
			color: #a78bfa;
		}

		.seal-card .protocol-icon {
			background: rgba(245, 158, 11, 0.15);
			color: #fbbf24;
		}

		.walrus-card .protocol-icon {
			background: rgba(6, 182, 212, 0.15);
			color: #22d3ee;
		}

		.protocol-icon svg {
			width: 24px;
			height: 24px;
		}

		.protocol-info h3 {
			margin: 0;
			font-size: 1.125rem;
			color: var(--text);
		}

		.protocol-info p {
			margin: 4px 0 8px 0;
			font-size: 0.875rem;
			color: var(--text-muted);
		}

		.protocol-status {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			font-size: 0.75rem;
			color: var(--text-muted);
		}

		.protocol-status.online {
			color: #22c55e;
		}

		.protocol-status.degraded {
			color: #f59e0b;
		}

		.protocol-status.offline {
			color: #ef4444;
		}

		.status-dot {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: currentColor;
		}

		.status-dot.loading {
			background: var(--text-muted);
			animation: pulse 1.5s ease-in-out infinite;
		}

		@keyframes pulse {
			0%, 100% { opacity: 0.4; }
			50% { opacity: 1; }
		}

		.protocol-actions {
			display: flex;
			gap: 8px;
			margin-top: auto;
		}

		.protocol-action-btn {
			flex: 1;
			padding: 10px 16px;
			border: none;
			border-radius: 8px;
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.vortex-card .protocol-action-btn {
			background: rgba(139, 92, 246, 0.2);
			color: #a78bfa;
		}

		.vortex-card .protocol-action-btn:hover {
			background: rgba(139, 92, 246, 0.3);
		}

		.seal-card .protocol-action-btn {
			background: rgba(245, 158, 11, 0.2);
			color: #fbbf24;
		}

		.seal-card .protocol-action-btn:hover {
			background: rgba(245, 158, 11, 0.3);
		}

		.walrus-card .protocol-action-btn {
			background: rgba(6, 182, 212, 0.2);
			color: #22d3ee;
		}

		.walrus-card .protocol-action-btn:hover {
			background: rgba(6, 182, 212, 0.3);
		}

		.protocol-action-btn.secondary {
			background: var(--bg-hover);
			color: var(--text-muted);
		}

		.protocol-action-btn.secondary:hover {
			color: var(--text);
		}

		/* Privacy Sub-tabs */
		.privacy-tabs {
			display: flex;
			gap: 4px;
			padding: 4px;
			background: var(--card-bg);
			border-radius: 12px;
			border: 1px solid var(--border);
			margin-bottom: 20px;
			overflow-x: auto;
		}

		.privacy-tab {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 12px 16px;
			border: none;
			border-radius: 8px;
			background: transparent;
			color: var(--text-muted);
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			white-space: nowrap;
			transition: all 0.2s;
		}

		.privacy-tab:hover {
			background: var(--bg-hover);
			color: var(--text);
		}

		.privacy-tab.active {
			background: var(--accent);
			color: white;
		}

		.privacy-tab svg {
			flex-shrink: 0;
		}

		/* Privacy Tab Content */
		.privacy-tab-content {
			display: none;
		}

		.privacy-tab-content.active {
			display: block;
		}

		/* Encrypted Notes Section */
		.encrypted-notes-section {
			display: grid;
			gap: 24px;
		}

		.notes-header {
			display: flex;
			align-items: flex-start;
			gap: 12px;
		}

		.notes-header h3 {
			display: flex;
			align-items: center;
			gap: 8px;
			margin: 0;
			font-size: 1.125rem;
			color: var(--text);
		}

		.notes-header p {
			margin: 4px 0 0 0;
			font-size: 0.875rem;
			color: var(--text-muted);
		}

		.notes-compose {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 20px;
		}

		.notes-policy-selector {
			margin-bottom: 16px;
		}

		.notes-policy-selector label {
			display: block;
			margin-bottom: 8px;
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--text);
		}

		.notes-policy-selector select,
		.notes-policy-config input {
			width: 100%;
			padding: 10px 12px;
			border: 1px solid var(--border);
			border-radius: 8px;
			background: var(--bg);
			color: var(--text);
			font-size: 0.875rem;
		}

		.notes-policy-config {
			margin-bottom: 16px;
		}

		.notes-compose textarea {
			width: 100%;
			padding: 12px;
			border: 1px solid var(--border);
			border-radius: 8px;
			background: var(--bg);
			color: var(--text);
			font-size: 0.875rem;
			resize: vertical;
			margin-bottom: 12px;
		}

		.notes-compose textarea:focus {
			outline: none;
			border-color: var(--accent);
		}

		.notes-actions {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
		}

		.notes-info {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.75rem;
			color: var(--text-muted);
		}

		.notes-save-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 20px;
			border: none;
			border-radius: 8px;
			background: var(--accent);
			color: white;
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.notes-save-btn:hover {
			background: var(--accent-hover);
		}

		.notes-list {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
		}

		.notes-list-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--border);
		}

		.notes-list-header h4 {
			margin: 0;
			font-size: 1rem;
			color: var(--text);
		}

		.notes-refresh-btn {
			padding: 8px;
			border: none;
			border-radius: 8px;
			background: transparent;
			color: var(--text-muted);
			cursor: pointer;
			transition: all 0.2s;
		}

		.notes-refresh-btn:hover {
			background: var(--bg-hover);
			color: var(--text);
		}

		.notes-list-content {
			padding: 20px;
		}

		.notes-empty {
			text-align: center;
			padding: 40px 20px;
			color: var(--text-muted);
		}

		.notes-empty svg {
			margin-bottom: 16px;
			opacity: 0.5;
		}

		.notes-empty p {
			margin: 0 0 8px 0;
			font-size: 0.875rem;
		}

		.notes-empty span {
			font-size: 0.75rem;
		}

		/* Vortex Pools Section */
		.vortex-pools-section {
			display: grid;
			gap: 24px;
		}

		.vortex-info-card,
		.seal-info-card,
		.walrus-info-card {
			display: flex;
			gap: 20px;
			padding: 24px;
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
		}

		.vortex-info-icon,
		.seal-info-icon,
		.walrus-info-icon {
			flex-shrink: 0;
			width: 56px;
			height: 56px;
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.vortex-info-icon {
			background: rgba(139, 92, 246, 0.15);
			color: #a78bfa;
		}

		.seal-info-icon {
			background: rgba(245, 158, 11, 0.15);
			color: #fbbf24;
		}

		.walrus-info-icon {
			background: rgba(6, 182, 212, 0.15);
			color: #22d3ee;
		}

		.vortex-info-icon svg,
		.seal-info-icon svg,
		.walrus-info-icon svg {
			width: 28px;
			height: 28px;
		}

		.vortex-info-text h3,
		.seal-info-text h3,
		.walrus-info-text h3 {
			margin: 0 0 8px 0;
			font-size: 1.125rem;
			color: var(--text);
		}

		.vortex-info-text p,
		.seal-info-text p,
		.walrus-info-text p {
			margin: 0 0 16px 0;
			font-size: 0.875rem;
			color: var(--text-muted);
			line-height: 1.5;
		}

		.vortex-features,
		.walrus-features {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
		}

		.vortex-features li,
		.walrus-features li {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			color: var(--text-muted);
		}

		.vortex-features li svg,
		.walrus-features li svg {
			color: #22c55e;
		}

		.seal-policy-types {
			display: flex;
			flex-wrap: wrap;
			gap: 12px;
		}

		.policy-type {
			font-size: 0.8rem;
			color: var(--text-muted);
		}

		.policy-type strong {
			color: var(--text);
		}

		/* Pools Grid */
		.vortex-pools-list {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
		}

		.pools-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--border);
		}

		.pools-header h3 {
			margin: 0;
			font-size: 1rem;
			color: var(--text);
		}

		.pools-refresh-btn {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 12px;
			border: none;
			border-radius: 8px;
			background: var(--bg-hover);
			color: var(--text-muted);
			font-size: 0.8rem;
			cursor: pointer;
			transition: all 0.2s;
		}

		.pools-refresh-btn:hover {
			color: var(--text);
		}

		.pools-grid {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
			gap: 16px;
			padding: 20px;
		}

		.pools-loading,
		.pools-empty,
		.pools-error {
			grid-column: 1 / -1;
			text-align: center;
			padding: 40px 20px;
			color: var(--text-muted);
		}

		.pools-loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 12px;
		}

		.loading-spinner {
			width: 32px;
			height: 32px;
			border: 3px solid var(--border);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			to { transform: rotate(360deg); }
		}

		.pool-card {
			background: var(--bg);
			border: 1px solid var(--border);
			border-radius: 10px;
			padding: 16px;
		}

		.pool-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 12px;
		}

		.pool-token {
			font-size: 1rem;
			font-weight: 600;
			color: var(--text);
		}

		.pool-tvl {
			font-size: 0.75rem;
			color: var(--text-muted);
		}

		.pool-stats {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 12px;
			margin-bottom: 16px;
		}

		.pool-stat {
			text-align: center;
		}

		.stat-label {
			display: block;
			font-size: 0.7rem;
			color: var(--text-muted);
			margin-bottom: 4px;
		}

		.stat-value {
			font-size: 0.875rem;
			font-weight: 600;
			color: var(--text);
		}

		.pool-deposit-btn {
			width: 100%;
			padding: 10px;
			border: none;
			border-radius: 8px;
			background: rgba(139, 92, 246, 0.15);
			color: #a78bfa;
			font-size: 0.8rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.pool-deposit-btn:hover {
			background: rgba(139, 92, 246, 0.25);
		}

		/* Vortex Deposit Form */
		.vortex-deposit-form,
		.seal-encrypt-form,
		.seal-decrypt-form,
		.walrus-upload-form {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 20px;
		}

		.vortex-deposit-form h3,
		.seal-encrypt-form h3,
		.seal-decrypt-form h3,
		.walrus-upload-form h3 {
			margin: 0 0 20px 0;
			font-size: 1rem;
			color: var(--text);
		}

		.form-group {
			margin-bottom: 16px;
		}

		.form-group label {
			display: block;
			margin-bottom: 8px;
			font-size: 0.875rem;
			font-weight: 500;
			color: var(--text);
		}

		.form-group select,
		.form-group input,
		.form-group textarea {
			width: 100%;
			padding: 10px 12px;
			border: 1px solid var(--border);
			border-radius: 8px;
			background: var(--bg);
			color: var(--text);
			font-size: 0.875rem;
		}

		.form-group select:focus,
		.form-group input:focus,
		.form-group textarea:focus {
			outline: none;
			border-color: var(--accent);
		}

		.input-with-suffix {
			display: flex;
			border: 1px solid var(--border);
			border-radius: 8px;
			overflow: hidden;
		}

		.input-with-suffix input {
			flex: 1;
			border: none;
			border-radius: 0;
		}

		.input-suffix {
			padding: 10px 12px;
			background: var(--bg-hover);
			color: var(--text-muted);
			font-size: 0.875rem;
			border-left: 1px solid var(--border);
		}

		.form-info {
			display: flex;
			align-items: flex-start;
			gap: 8px;
			padding: 12px;
			background: rgba(59, 130, 246, 0.1);
			border-radius: 8px;
			font-size: 0.8rem;
			color: var(--text-muted);
			margin-bottom: 16px;
		}

		.form-info svg {
			flex-shrink: 0;
			margin-top: 2px;
			color: #60a5fa;
		}

		.vortex-deposit-btn,
		.seal-encrypt-btn,
		.seal-decrypt-btn,
		.walrus-upload-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 12px;
			border: none;
			border-radius: 8px;
			font-size: 0.875rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.vortex-deposit-btn {
			background: rgba(139, 92, 246, 0.2);
			color: #a78bfa;
		}

		.vortex-deposit-btn:hover:not(:disabled) {
			background: rgba(139, 92, 246, 0.3);
		}

		.seal-encrypt-btn {
			background: rgba(245, 158, 11, 0.2);
			color: #fbbf24;
		}

		.seal-encrypt-btn:hover:not(:disabled) {
			background: rgba(245, 158, 11, 0.3);
		}

		.seal-decrypt-btn {
			background: var(--bg-hover);
			color: var(--text-muted);
		}

		.seal-decrypt-btn:hover:not(:disabled) {
			color: var(--text);
		}

		.walrus-upload-btn {
			background: rgba(6, 182, 212, 0.2);
			color: #22d3ee;
		}

		.walrus-upload-btn:hover:not(:disabled) {
			background: rgba(6, 182, 212, 0.3);
		}

		.vortex-deposit-btn:disabled,
		.seal-encrypt-btn:disabled,
		.seal-decrypt-btn:disabled,
		.walrus-upload-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		/* Walrus Storage Section */
		.walrus-storage-section {
			display: grid;
			gap: 24px;
		}

		.walrus-dropzone {
			border: 2px dashed var(--border);
			border-radius: 12px;
			padding: 40px 20px;
			text-align: center;
			cursor: pointer;
			transition: all 0.2s;
		}

		.walrus-dropzone:hover,
		.walrus-dropzone.dragover {
			border-color: var(--accent);
			background: rgba(6, 182, 212, 0.05);
		}

		.dropzone-content svg {
			color: var(--text-muted);
			margin-bottom: 16px;
		}

		.dropzone-content p {
			margin: 0 0 8px 0;
			font-size: 0.875rem;
			color: var(--text);
		}

		.dropzone-browse {
			color: var(--accent);
			text-decoration: underline;
		}

		.dropzone-hint {
			font-size: 0.75rem;
			color: var(--text-muted);
		}

		.walrus-upload-options {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			margin-top: 16px;
			margin-bottom: 16px;
		}

		.checkbox-label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.875rem;
			color: var(--text);
			cursor: pointer;
		}

		.checkbox-label input {
			width: auto;
		}

		.storage-duration {
			margin-bottom: 0;
		}

		.storage-duration select {
			width: auto;
			min-width: 160px;
		}

		.walrus-upload-queue {
			margin-bottom: 16px;
		}

		.walrus-upload-queue h4 {
			margin: 0 0 12px 0;
			font-size: 0.875rem;
			color: var(--text);
		}

		.queue-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.queue-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 10px 12px;
			background: var(--bg);
			border-radius: 8px;
			font-size: 0.8rem;
		}

		.queue-file-name {
			flex: 1;
			color: var(--text);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.queue-file-size {
			color: var(--text-muted);
		}

		.queue-status {
			padding: 4px 8px;
			border-radius: 4px;
			background: rgba(34, 197, 94, 0.15);
			color: #22c55e;
			font-size: 0.7rem;
		}

		/* Walrus Browse Section */
		.walrus-browse-section {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
		}

		.browse-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			padding: 16px 20px;
			border-bottom: 1px solid var(--border);
		}

		.browse-header h3 {
			margin: 0;
			font-size: 1rem;
			color: var(--text);
		}

		.browse-actions {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.browse-actions input {
			padding: 8px 12px;
			border: 1px solid var(--border);
			border-radius: 8px;
			background: var(--bg);
			color: var(--text);
			font-size: 0.8rem;
			width: 200px;
		}

		.browse-refresh-btn {
			padding: 8px;
			border: none;
			border-radius: 8px;
			background: var(--bg-hover);
			color: var(--text-muted);
			cursor: pointer;
			transition: all 0.2s;
		}

		.browse-refresh-btn:hover {
			color: var(--text);
		}

		.walrus-blobs-list {
			padding: 20px;
		}

		.blobs-empty {
			text-align: center;
			padding: 40px 20px;
			color: var(--text-muted);
		}

		.blobs-empty svg {
			margin-bottom: 16px;
			opacity: 0.5;
		}

		.blobs-empty p {
			margin: 0 0 8px 0;
			font-size: 0.875rem;
		}

		.blobs-empty span {
			font-size: 0.75rem;
		}

		/* SDK Reference Section */
		.privacy-sdk-reference {
			background: var(--card-bg);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 20px;
			margin-top: 24px;
		}

		.privacy-sdk-reference h3 {
			display: flex;
			align-items: center;
			gap: 8px;
			margin: 0 0 16px 0;
			font-size: 1rem;
			color: var(--text);
		}

		.sdk-tabs {
			display: flex;
			gap: 4px;
			margin-bottom: 16px;
		}

		.sdk-tab {
			padding: 8px 16px;
			border: none;
			border-radius: 6px;
			background: transparent;
			color: var(--text-muted);
			font-size: 0.8rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s;
		}

		.sdk-tab:hover {
			background: var(--bg-hover);
			color: var(--text);
		}

		.sdk-tab.active {
			background: var(--accent);
			color: white;
		}

		.sdk-panel {
			display: none;
			position: relative;
		}

		.sdk-panel.active {
			display: block;
		}

		.sdk-panel .code-block {
			margin: 0;
			padding: 16px;
			background: var(--bg);
			border-radius: 8px;
			overflow-x: auto;
			font-size: 0.8rem;
			line-height: 1.6;
		}

		.sdk-panel .code-block code {
			font-family: 'SF Mono', Monaco, Consolas, monospace;
		}

		.sdk-panel .copy-code-btn {
			position: absolute;
			top: 8px;
			right: 8px;
			display: flex;
			align-items: center;
			gap: 4px;
			padding: 6px 10px;
			border: none;
			border-radius: 6px;
			background: rgba(255, 255, 255, 0.1);
			color: var(--text-muted);
			font-size: 0.7rem;
			cursor: pointer;
			transition: all 0.2s;
		}

		.sdk-panel .copy-code-btn:hover {
			background: rgba(255, 255, 255, 0.2);
			color: var(--text);
		}

		.code-comment {
			color: #6b7280;
		}

		/* Responsive adjustments */
		@media (max-width: 768px) {
			.privacy-dashboard {
				padding: 16px;
			}

			.privacy-protocols {
				grid-template-columns: 1fr;
			}

			.privacy-tabs {
				flex-wrap: nowrap;
				overflow-x: auto;
				-webkit-overflow-scrolling: touch;
			}

			.vortex-info-card,
			.seal-info-card,
			.walrus-info-card {
				flex-direction: column;
				align-items: flex-start;
			}

			.walrus-upload-options {
				flex-direction: column;
				align-items: stretch;
			}

			.browse-actions {
				flex-wrap: wrap;
			}

			.browse-actions input {
				width: 100%;
			}
		}
`
