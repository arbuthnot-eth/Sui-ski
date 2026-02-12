// Auto-extracted CSS for profile page
// This keeps the main profile.ts file focused on HTML generation

export const profileStyles = `
		:root {
			/* Deep dark background with vibrant accents */
			--bg-void: #000;
			--bg-dark: #000;
			--bg-subtle: #050505;
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
		.premium-purple {
			color: var(--purple) !important;
			text-shadow: 0 0 10px var(--purple-glow) !important;
			font-weight: 700 !important;
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
			overflow-x: hidden;
		}

		@media (max-width: 400px) {
			body {
				padding: 16px 12px;
			}
		}

		@media (min-width: 860px) {
			.main-content {
				--overview-side-rail-width: 233px;
			}
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
		.home-btn {
			position: fixed;
			top: calc(16px + env(safe-area-inset-top));
			left: calc(16px + env(safe-area-inset-left));
			z-index: 9999;
			width: 44px;
			height: 44px;
			display: flex;
			align-items: center;
			justify-content: center;
			background: var(--card-bg-solid);
			backdrop-filter: blur(16px);
			-webkit-backdrop-filter: blur(16px);
			border: 1px solid var(--border);
			border-radius: 12px;
			text-decoration: none;
			transition: all 0.25s ease;
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
		}
		.home-btn:hover {
			border-color: rgba(96, 165, 250, 0.4);
			box-shadow: 0 4px 20px rgba(96, 165, 250, 0.15);
			transform: translateY(-1px);
		}
		.home-btn svg {
			width: 28px;
			height: 28px;
		}
		.wallet-widget {
			position: fixed;
			top: calc(16px + env(safe-area-inset-top));
			right: calc(16px + env(safe-area-inset-right));
			z-index: 10040;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.wallet-profile-btn {
			width: 40px;
			height: 40px;
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
		.wallet-btn {
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
		.wallet-btn:hover {
			border-color: rgba(96, 165, 250, 0.4);
			color: var(--text);
			box-shadow: var(--shadow-lg), 0 0 25px rgba(96, 165, 250, 0.15);
		}
		.wallet-btn svg:first-child {
			width: 16px;
			height: 16px;
			color: var(--accent-dim);
			transition: color 0.3s ease;
		}
		.wallet-btn:hover svg:first-child {
			color: var(--accent);
		}
		.wallet-btn.connected {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(139, 92, 246, 0.15));
			border-color: rgba(96, 165, 250, 0.3);
		}
		.wallet-btn.connected #wallet-btn-text {
			color: var(--accent);
		}
		.wallet-menu {
			display: none;
			position: fixed;
			top: 58px;
			right: 16px;
			z-index: 10050;
			min-width: 200px;
			background: rgba(20, 20, 28, 0.98);
			backdrop-filter: blur(16px);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 14px;
			box-shadow: var(--shadow-lg);
			overflow: hidden;
		}
		.wallet-menu.open {
			display: block;
		}
		.wallet-menu-item {
			display: flex;
			align-items: center;
			gap: 10px;
			width: 100%;
			padding: 12px 16px;
			background: none;
			border: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.05);
			color: #e4e4e7;
			font-size: 0.85rem;
			cursor: pointer;
			transition: background 0.15s;
			text-align: left;
			text-decoration: none;
		}
		.wallet-menu-item:last-child {
			border-bottom: none;
		}
		.wallet-menu-item:hover {
			background: rgba(96, 165, 250, 0.1);
		}
		.wallet-menu-item svg {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
			opacity: 0.6;
		}
		.wallet-menu-item.disconnect {
			color: #f87171;
		}
		.wallet-menu-item.disconnect:hover {
			background: rgba(248, 113, 113, 0.1);
		}
		.wallet-menu-item .copied-flash {
			color: #4ade80;
			font-size: 0.75rem;
			margin-left: auto;
		}
		@media (max-width: 540px) {
			.wallet-widget {
				top: 12px;
				right: 12px;
			}
			.wallet-btn {
				padding: 8px 12px;
				font-size: 0.8rem;
			}
			.wallet-menu {
				top: 48px;
				right: 12px;
				min-width: 180px;
			}
		}

		@media (max-width: 400px) {
			.home-btn {
				top: 8px;
				left: 8px;
			}
			.wallet-widget {
				top: 8px;
				right: 8px;
			}
			.wallet-btn #wallet-btn-text {
				display: none;
			}
			.wallet-btn {
				padding: 10px;
			}
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

		.container {
			max-width: 1400px;
			margin: 0 auto;
			position: relative;
			z-index: 1;
			overflow-x: hidden;
			padding-bottom: 48px;
		}

		.page-layout {
			display: flex;
			gap: 20px;
		}
		.notification-badge {
			position: absolute;
			top: 4px;
			right: 8px;
			min-width: 32px;
			height: 32px;
			background: var(--accent-dim);
			color: var(--bg-void);
			font-size: 0.72rem;
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

		@media (max-width: 480px) {
			.notification-badge {
				min-width: 36px;
				height: 36px;
			}
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
			--overview-side-rail-width: 233px;
		}
		.tab-panel {
			display: block;
		}
		.overview-primary-row {
			display: grid;
			grid-template-columns: var(--overview-side-rail-width) minmax(0, 1fr);
			grid-template-rows: auto 1fr;
			grid-template-areas:
				"card content"
				"rail content";
			gap: 6px 16px;
			align-items: start;
			margin-bottom: 2px;
		}
		.overview-secondary-grid {
			grid-area: rail;
			display: flex;
			flex-direction: column;
			gap: 4px;
			align-self: start;
			min-width: 0;
		}
		.overview-module {
			min-width: 0;
		}
		.overview-module .card {
			margin-bottom: 0;
		}
		.renewal-module {
			min-width: 0;
		}
		.linked-owner-row {
			display: flex;
			flex-direction: column;
			gap: 4px;
			min-width: 0;
			width: 100%;
			margin-top: 2px;
		}
		.side-rail-module {
			display: flex;
			flex-direction: column;
			gap: 4px;
			min-width: 0;
		}
		.side-rail-market {
			display: none;
			flex-direction: column;
			gap: 4px;
			min-height: 0;
			overflow-y: visible;
		}
		.linked-controls-module {
			display: block;
			margin-top: 0;
		}
		.linked-controls-module .linked-names-section {
			margin-top: 0;
			margin-bottom: 0;
			padding: 10px 10px 8px;
		}
		.linked-controls-module .linked-names-header {
			margin-bottom: 6px;
		}
		.linked-controls-module .linked-names-sort {
			margin-bottom: 0;
			gap: 3px;
		}
		.linked-controls-module .linked-sort-pill {
		padding: 2px 7px;
		font-size: 0.68rem;
	}
		.linked-controls-module .linked-names-filter {
			margin-bottom: 0;
			gap: 5px;
		}
		.linked-controls-module .linked-names-filter-input {
			padding: 6px 9px;
			font-size: 0.68rem;
		}
		.linked-controls-module .linked-filter-clear {
			padding: 5px 8px;
			font-size: 0.68rem;
		}
		.linked-wide-module {
			min-width: 0;
		}
		.linked-wide-module .linked-names-section {
			margin-bottom: 0;
		}
		.linked-wide-module .linked-names-list {
			max-height: none;
		}

		@media (max-width: 860px) {
			.overview-primary-row {
				grid-template-columns: 1fr;
				grid-template-rows: none;
				grid-template-areas: none;
				gap: 6px;
			}
			.identity-card {
				width: 100%;
				max-width: var(--overview-side-rail-width);
				grid-area: auto;
				margin: 0 auto;
			}
			.hero-main {
				grid-area: auto;
				width: 100%;
				order: 1;
			}
			.overview-secondary-grid {
				grid-area: auto;
				width: 100%;
				order: 2;
			}
			.side-rail-module {
				display: grid;
				grid-template-columns: 1fr 1fr;
				grid-template-rows: auto 1fr;
				align-items: start;
			}
			.side-rail-module > .renewal-module {
				grid-column: 1;
				grid-row: 1;
				min-width: 0;
			}
			.side-rail-module > .linked-controls-module {
				grid-column: 1;
				grid-row: 2;
				min-width: 0;
				align-self: stretch;
				display: flex;
				flex-direction: column;
			}
			.side-rail-module > .linked-controls-module .linked-names-section {
				padding: 8px 8px 6px;
				flex: 1 1 auto;
				display: flex;
				flex-direction: column;
			}
			.side-rail-module > .linked-controls-module .linked-names-header {
				display: grid;
				grid-template-columns: 1fr auto auto;
				grid-template-rows: auto auto;
				gap: 4px 6px;
				align-items: center;
				margin-bottom: 6px;
			}
			.side-rail-module > .linked-controls-module .linked-names-title {
				grid-column: 1;
				grid-row: 1;
				font-size: 0.68rem;
			}
			.side-rail-module > .linked-controls-module .linked-renewal-cost {
				grid-column: 2;
				grid-row: 1;
				margin-left: 0;
				font-size: 0.58rem;
			}
			.side-rail-module > .linked-controls-module .linked-names-count {
				grid-column: 3;
				grid-row: 1;
				font-size: 0.6rem;
			}
			.side-rail-module > .linked-controls-module .linked-renewal-savings {
				grid-column: 2 / -1;
				grid-row: 2;
				justify-self: end;
				font-size: 0.56rem;
			}
			.side-rail-module > .linked-controls-module .linked-names-sort {
				margin-top: auto;
				margin-bottom: 0;
				gap: 3px;
			}
			.side-rail-module > .linked-controls-module .linked-sort-pill {
				padding: 2px 6px;
				font-size: 0.56rem;
			}
			.side-rail-module > .linked-controls-module .linked-names-filter {
				margin-bottom: 0;
				gap: 4px;
			}
			.side-rail-module > .linked-controls-module .linked-names-filter-input {
				padding: 5px 8px;
				font-size: 0.62rem;
				color: #f4f4f5;
				border-color: rgba(255, 255, 255, 0.15);
			}
			.side-rail-module > .linked-controls-module .linked-names-filter-input::placeholder {
				color: rgba(244, 244, 245, 0.4);
			}
			.side-rail-module > .linked-controls-module .linked-names-filter-input:focus {
				border-color: rgba(255, 255, 255, 0.35);
				box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
			}
			.side-rail-module > .linked-controls-module .linked-filter-clear {
				color: #f4f4f5;
				background: rgba(255, 255, 255, 0.08);
				border-color: rgba(255, 255, 255, 0.15);
				font-size: 0.58rem;
			}
			.side-rail-module > .linked-controls-module .linked-filter-clear:hover {
				color: #ffffff;
				background: rgba(255, 255, 255, 0.15);
				border-color: rgba(255, 255, 255, 0.3);
			}
			.side-rail-module > .side-rail-market {
				grid-column: 2;
				grid-row: 1 / -1;
				min-width: 0;
			}
			.linked-wide-module {
				width: 100%;
				order: 3;
			}
			.links {
				grid-column: 1;
				order: 4;
			}
		}

		.profile-hero {
			display: contents;
		}
		.identity-card {
			width: var(--overview-side-rail-width);
			grid-area: card;
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
		.identity-visual img.identity-tagged-image {
			filter: none !important;
			transform: none !important;
		}
		.identity-visual.has-tagged-image::after {
			content: '';
			position: absolute;
			inset: 5%;
			border-radius: 12px;
			border: 1px solid rgba(96, 165, 250, 0.28);
			box-shadow:
				inset 0 0 0 1px rgba(255, 255, 255, 0.05),
				0 12px 30px rgba(59, 130, 246, 0.12);
			pointer-events: none;
			z-index: 8;
		}
		.identity-visual.has-tagged-image img.identity-tagged-image {
			filter: saturate(1.08) contrast(1.05) brightness(1.02);
		}
		body.profile-name-primary .identity-visual.has-tagged-image::after {
			border-color: rgba(251, 191, 36, 0.62);
			box-shadow:
				inset 0 0 0 1px rgba(254, 240, 138, 0.16),
				0 16px 34px rgba(245, 158, 11, 0.2);
		}
		.identity-card:hover .identity-visual img {
			transform: scale(1.02);
			filter: brightness(0.95) contrast(1.05);
		}
		.identity-card:hover .identity-visual img.identity-tagged-image {
			transform: none;
			filter: none !important;
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
		.identity-action-btn {
			width: 28px;
			height: 28px;
			background: rgba(104, 137, 176, 0.08);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 6px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			flex-shrink: 0;
		}
		.identity-action-btn:hover {
			background: rgba(96, 165, 250, 0.2);
			border-color: var(--accent);
		}
		.identity-action-btn svg {
			width: 14px;
			height: 14px;
			color: var(--accent-dim);
			transition: color 0.2s ease;
		}
		.identity-action-btn:hover svg {
			color: var(--accent);
		}
		.identity-action-btn:disabled {
			opacity: 0.55;
			cursor: not-allowed;
		}
		.identity-action-btn.loading svg {
			animation: spin 0.9s linear infinite;
		}
		.identity-action-btn.success {
			background: rgba(34, 197, 94, 0.15);
			border-color: var(--success);
		}
		.identity-action-btn.success svg {
			color: var(--success);
		}
		.diamond-btn {
			width: 28px;
			height: 28px;
			background: transparent;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			padding: 0;
			flex-shrink: 0;
			position: relative;
			transition: filter 0.25s ease;
		}
		.diamond-btn::before {
			content: '';
			width: 12px;
			height: 12px;
			border-radius: 2px;
			background: linear-gradient(145deg, #60a5fa 0%, #2563eb 100%);
			border: 1px solid rgba(191, 219, 254, 0.75);
			box-shadow:
				0 0 0 1px rgba(30, 58, 138, 0.35),
				0 2px 6px rgba(37, 99, 235, 0.45);
			transform: rotate(0deg) scale(1);
			transition:
				transform 0.45s cubic-bezier(0.2, 0.85, 0.2, 1),
				background 0.45s ease,
				border-color 0.35s ease,
				box-shadow 0.45s ease,
				border-radius 0.35s ease;
		}
		.diamond-btn svg {
			display: none;
		}
		.diamond-btn:hover {
			filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.9));
		}
		.diamond-btn:hover::before {
			transform: rotate(0deg) scale(1.12);
		}
		.diamond-btn.bookmarked {
			filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.92));
		}
		.diamond-btn.bookmarked::before {
			transform: rotate(45deg) scale(1.45);
			border-radius: 0;
			background: linear-gradient(160deg, #000 0%, #050505 52%, #000 100%);
			border-color: rgba(8, 8, 10, 0.98);
			box-shadow:
				inset 0 0 0 1px rgba(255, 255, 255, 0.02),
				0 0 16px rgba(0, 0, 0, 0.9),
				0 0 0 1px rgba(20, 20, 24, 0.9);
		}
		.diamond-btn.bookmarked::after {
			content: '';
			position: absolute;
			width: 15px;
			height: 15px;
			border: 1px solid rgba(157, 172, 196, 0.7);
			border-radius: 0;
			transform: rotate(45deg) scale(1.12);
			box-shadow: 0 0 8px rgba(144, 158, 181, 0.35);
			pointer-events: none;
		}
		.diamond-btn.bookmarked:hover::before {
			transform: rotate(45deg) scale(1.55);
		}
		.diamond-btn.diamond-transforming::before {
			animation: diamond-turn-ink 760ms cubic-bezier(0.2, 0.85, 0.2, 1) both;
		}
		.diamond-btn.diamond-loading {
			pointer-events: none;
			opacity: 0.7;
			animation: diamond-pulse 1.2s ease-in-out infinite;
		}
		@keyframes diamond-turn-ink {
			0% {
				transform: rotate(0deg) scale(1);
				border-radius: 2px;
				background: linear-gradient(145deg, #60a5fa 0%, #2563eb 100%);
				border-color: rgba(191, 219, 254, 0.75);
				box-shadow:
					0 0 0 1px rgba(30, 58, 138, 0.35),
					0 2px 6px rgba(37, 99, 235, 0.45);
			}
			34% {
				transform: rotate(240deg) scale(1.9);
			}
			70% {
				transform: rotate(560deg) scale(1.38);
			}
			100% {
				transform: rotate(45deg) scale(1.45);
				border-radius: 0;
				background: linear-gradient(160deg, #000 0%, #050505 52%, #000 100%);
				border-color: rgba(8, 8, 10, 0.98);
				box-shadow:
					inset 0 0 0 1px rgba(255, 255, 255, 0.02),
					0 0 16px rgba(0, 0, 0, 0.9),
					0 0 0 1px rgba(20, 20, 24, 0.9);
			}
		}
		@keyframes diamond-pulse {
			0%, 100% { opacity: 0.7; transform: scale(1); }
			50% { opacity: 1; transform: scale(1.1); }
		}
		.header-name-wrap {
			position: relative;
		}
		.header-name-wrap.diamond-infected h1,
		.header-name-wrap.diamond-infected h1 .name-site-link {
			-webkit-text-fill-color: transparent;
			background:
				linear-gradient(
					90deg,
					transparent 0%,
					transparent calc(var(--tendril-progress, 0%) - 4%),
					rgba(111, 188, 240, 0.85) calc(var(--tendril-progress, 0%) - 2%),
					rgba(0, 174, 239, 0.96) var(--tendril-progress, 0%),
					rgba(111, 188, 240, 0.88) calc(var(--tendril-progress, 0%) + 3%),
					transparent calc(var(--tendril-progress, 0%) + 9%),
					transparent 100%
				),
				linear-gradient(
					90deg,
					#000 var(--tendril-progress, 0%),
					#010101 calc(var(--tendril-progress, 0%) + 7%),
					var(--text-bright) calc(var(--tendril-progress, 0%) + 17%),
					var(--text-bright) 100%
				),
				radial-gradient(120% 120% at 0% 50%, rgba(58, 68, 82, 0.55) 0%, rgba(0, 0, 0, 0) 46%),
				radial-gradient(120% 120% at 100% 50%, rgba(116, 128, 150, 0.42) 0%, rgba(0, 0, 0, 0) 48%),
				linear-gradient(
					115deg,
					rgba(0, 0, 0, 0.99) 0%,
					rgba(34, 42, 56, 0.58) 20%,
					rgba(0, 0, 0, 0.99) 45%,
					rgba(56, 70, 90, 0.52) 67%,
					rgba(0, 0, 0, 0.99) 100%
				);
			background-size: 100% 100%, 100% 100%, 200% 100%, 220% 100%, 240% 100%;
			background-position: 0 0, 0 0, 0% 50%, 100% 50%, 0 0;
			-webkit-background-clip: text;
			background-clip: text;
			transition: --tendril-progress 0.6s ease;
			-webkit-text-stroke: 1.05px rgba(66, 192, 255, 0.8);
			text-shadow:
				0 0 1px rgba(12, 18, 30, 0.85),
				0 0 7px rgba(0, 182, 255, 0.74),
				0 0 15px rgba(8, 96, 180, 0.54),
				0 0 22px rgba(6, 12, 24, 0.9);
			paint-order: stroke fill;
			animation: inky-name-wave 2.6s ease-in-out infinite;
		}
		.header-name-wrap.diamond-infected h1 .suffix {
			background: linear-gradient(135deg, #b9e6ff 0%, #7fc8ff 30%, #d7c3ff 65%, #9fd4ff 100%);
			background-size: 200% auto;
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
			-webkit-text-stroke: 0.65px rgba(189, 232, 255, 0.88);
			text-shadow:
				0 0 8px rgba(147, 197, 253, 0.82),
				0 0 18px rgba(167, 139, 250, 0.48);
			paint-order: stroke fill;
			animation: gradient-shift 1.8s linear infinite, suffix-sparkle 2.4s ease-in-out infinite;
		}
		@property --tendril-progress {
			syntax: '<percentage>';
			inherits: true;
			initial-value: 0%;
		}
		.header-name-wrap.diamond-infected.tendrils-spreading {
			--tendril-progress: 100%;
			transition: --tendril-progress 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		}
		.header-name-wrap.diamond-infected.tendrils-receding {
			--tendril-progress: 0%;
			transition: --tendril-progress 0.8s cubic-bezier(0.55, 0.06, 0.68, 0.19);
		}
		.diamond-tendril-canvas {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: 1;
			opacity: 0;
			transition: opacity 0.4s ease;
		}
		.diamond-infected .diamond-tendril-canvas {
			opacity: 1;
		}

		.identity-card.black-diamond-active {
			box-shadow:
				0 24px 60px rgba(0, 0, 0, 0.68),
				0 0 0 1px rgba(32, 32, 42, 0.9),
				inset 0 1px 0 rgba(255, 255, 255, 0.02);
		}
		.identity-card.black-diamond-active::after {
			content: none;
			position: absolute;
			inset: 0;
			background:
				radial-gradient(circle at 48% 30%, rgba(16, 18, 24, 0.28) 0%, rgba(4, 4, 6, 0.72) 64%, rgba(0, 0, 0, 0.84) 100%);
			mix-blend-mode: multiply;
			pointer-events: none;
			z-index: 2;
		}
		.identity-card.black-diamond-active .identity-visual img {
			z-index: 1;
			filter: none;
		}
		.identity-card.black-diamond-active .identity-visual {
			background:
				radial-gradient(140% 120% at 30% 18%, rgba(26, 34, 48, 0.32) 0%, rgba(2, 3, 6, 0.9) 62%, rgba(0, 0, 0, 1) 100%),
				linear-gradient(180deg, #04060b 0%, #000 100%);
			box-shadow:
				inset 0 0 0 1px rgba(67, 87, 118, 0.22),
				inset 0 -40px 80px rgba(0, 0, 0, 0.92);
		}
		.identity-card.black-diamond-active .identity-visual,
		.identity-card.black-diamond-active .identity-name-wrapper {
			position: relative;
			z-index: 3;
		}
		.identity-card.black-diamond-active .identity-visual canvas {
			position: relative;
			z-index: 4;
			filter: none;
		}
		.identity-card.black-diamond-active .identity-name {
			color: #5f6474;
			background: rgba(15, 15, 18, 0.75);
			border: 1px solid rgba(60, 60, 72, 0.65);
		}

		body.diamond-watch-active .renewal-module,
		body.diamond-watch-active .expiry-quick-renew-btn,
		body.diamond-watch-active #overview-renewal-btn,
		body.diamond-watch-active #renew-name-btn,
		body.diamond-watch-active #gift-renewal-btn,
		body.diamond-watch-active .grace-period-btn.renew,
		body.diamond-watch-active .grace-period-btn.gift {
			display: none !important;
		}
		.vantablack-overlay {
			position: relative;
			overflow: hidden;
		}
		.vantablack-overlay::before {
			content: '';
			position: absolute;
			inset: 0;
			background: #000;
			z-index: 10;
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.8s ease;
		}
		.vantablack-overlay.active::before {
			opacity: 1;
			pointer-events: all;
		}
		.vantablack-overlay.active::after {
			content: '◆';
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			z-index: 11;
			color: #111;
			font-size: 2rem;
			text-shadow: 0 0 20px rgba(0, 0, 0, 0.9);
			pointer-events: none;
			animation: void-breathe 3s ease-in-out infinite;
		}
		@keyframes void-breathe {
			0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
			50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
		}
		@keyframes inky-name-wave {
			0%, 100% { background-position: 0 0, 0 0, 0% 50%, 100% 50%, 0 0; }
			50% { background-position: 0 0, 0 0, 100% 50%, 0% 50%, 100% 0; }
		}
		@keyframes suffix-sparkle {
			0%, 100% {
				text-shadow:
					0 0 8px rgba(147, 197, 253, 0.82),
					0 0 18px rgba(167, 139, 250, 0.48);
			}
			50% {
				text-shadow:
					0 0 12px rgba(186, 230, 253, 0.95),
					0 0 24px rgba(196, 181, 253, 0.62);
			}
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
			justify-content: stretch;
			gap: 6px;
			padding: 8px;
			background: linear-gradient(to top, rgba(104, 137, 176, 0.04), transparent);
			border-top: 1px solid var(--border);
			width: 100%;
		}
		.identity-name {
			flex: 1 1 auto;
			min-width: 0;
			text-align: center;
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: clamp(0.56rem, 0.48rem + 0.24vw, 0.68rem);
			font-weight: 500;
			color: var(--accent-dim);
			background: rgba(104, 137, 176, 0.06);
			padding: 5px 8px;
			border-radius: 5px;
			cursor: pointer;
			transition: all 0.25s ease;
			letter-spacing: 0.01em;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		body.profile-name-primary .identity-name {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 4px;
			background: linear-gradient(135deg, rgba(120, 53, 15, 0.6), rgba(180, 83, 9, 0.5));
			color: #fef3c7;
			border: 1px solid rgba(251, 191, 36, 0.65);
			box-shadow:
				inset 0 1px 0 rgba(254, 240, 138, 0.18),
				0 0 16px rgba(245, 158, 11, 0.2);
			font-weight: 700;
		}
		body.profile-name-primary .identity-name::before {
			content: '★';
			color: #facc15;
			font-size: 0.78rem;
			line-height: 1;
			text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
			flex: 0 0 auto;
		}
		body.profile-name-primary .identity-name:hover {
			background: linear-gradient(135deg, rgba(146, 64, 14, 0.72), rgba(194, 65, 12, 0.62));
			color: #fef9c3;
			box-shadow:
				inset 0 1px 0 rgba(254, 240, 138, 0.26),
				0 0 20px rgba(251, 191, 36, 0.24);
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
			grid-area: content;
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
			margin-bottom: 10px;
			padding-bottom: 12px;
			border-bottom: 1px solid var(--border);
		}
		.header-top {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-bottom: 12px;
			flex-wrap: wrap;
		}
		.header-name-wrap {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			min-width: 0;
			max-width: 100%;
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
			-webkit-text-stroke: 0.5px rgba(125, 211, 252, 0.5);
			paint-order: stroke fill;
		}
		body.profile-primary-active h1 .suffix {
			background: linear-gradient(135deg, #f59e0b 0%, #facc15 45%, #f59e0b 100%);
			background-size: 100% auto;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			animation: none;
			-webkit-text-stroke: 0.5px rgba(251, 191, 36, 0.6);
			paint-order: stroke fill;
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
		.expiry-badge-text {
			display: inline-flex;
			align-items: center;
		}
		.expiry-quick-renew-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 15px;
			height: 15px;
			padding: 0;
			margin-left: 2px;
			border-radius: 999px;
			border: 1px solid currentColor;
			background: rgba(0, 0, 0, 0.12);
			color: inherit;
			font-size: 0.72rem;
			font-weight: 700;
			line-height: 1;
			cursor: pointer;
			transition: transform 0.15s ease, background-color 0.2s ease, opacity 0.2s ease;
		}
		.expiry-quick-renew-btn:hover:not(:disabled) {
			background: rgba(0, 0, 0, 0.24);
			transform: translateY(-1px);
		}
		.expiry-quick-renew-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none;
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
		.badge.expiry.royalty {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(167, 139, 250, 0.15));
			color: #60a5fa;
			border: 1px solid rgba(96, 165, 250, 0.3);
		}
		.badge.expiry.safe {
			background: rgba(244, 244, 245, 0.1);
			color: #f4f4f5;
			border: 1px solid rgba(244, 244, 245, 0.2);
		}
		.badge.jacketed {
			background: linear-gradient(135deg, rgba(167, 139, 250, 0.18), rgba(236, 72, 153, 0.18));
			color: #c084fc;
			border: 1px solid rgba(167, 139, 250, 0.35);
			animation: jacketed-glow 2s ease-in-out infinite;
			cursor: pointer;
		}
		.badge.jacketed:hover {
			background: linear-gradient(135deg, rgba(167, 139, 250, 0.25), rgba(236, 72, 153, 0.25));
		}
		.header-top-expiry-date {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			padding: 4px 10px;
			border-radius: 999px;
			font-size: 0.7rem;
			font-weight: 500;
			color: var(--text-muted);
			background: rgba(255, 255, 255, 0.03);
			border: 1px solid var(--border);
			white-space: nowrap;
		}
		.header-top-expiry-date svg {
			width: 12px;
			height: 12px;
			opacity: 0.75;
		}
		@keyframes jacketed-glow {
			0%, 100% { box-shadow: 0 0 0 0 rgba(167, 139, 250, 0.25); }
			50% { box-shadow: 0 0 10px 2px rgba(167, 139, 250, 0.15); }
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
		.target-meta-item {
			gap: 5px;
			max-width: 100%;
		}

		.owner-display {
			background: var(--card-bg);
			padding: 8px 12px;
			border-radius: 10px;
			border: 1px solid var(--border);
			margin-top: 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			width: 100%;
			max-width: 740px;
		}
		.linked-owner-card {
			margin-top: 0;
			margin-bottom: 0;
			max-width: none;
			width: 100%;
		}
		.owner-display.primary-view {
			background: linear-gradient(135deg, rgba(94, 67, 12, 0.34), rgba(44, 33, 12, 0.5));
			border-color: rgba(250, 204, 21, 0.42);
			box-shadow: 0 0 28px rgba(250, 204, 21, 0.1);
		}
		.owner-display.primary-view .owner-label {
			color: rgba(251, 191, 36, 0.86);
		}
		.owner-display.primary-view .owner-name {
			color: #f8fafc;
		}
		.owner-display.primary-view .owner-addr {
			color: rgba(245, 158, 11, 0.95);
		}
		.owner-display.owner-view {
			background: linear-gradient(135deg, rgba(88, 28, 135, 0.34), rgba(55, 23, 76, 0.5));
			border-color: rgba(167, 139, 250, 0.42);
			box-shadow: 0 0 28px rgba(139, 92, 246, 0.1);
		}
		.owner-display.owner-view .owner-label {
			color: rgba(167, 139, 250, 0.86);
		}
		.owner-display.owner-view .owner-name {
			color: #f8fafc;
		}
		.owner-display.owner-view .owner-addr {
			color: rgba(139, 92, 246, 0.95);
		}
		.owner-display.owner-view .owner-info-link:hover {
			background: rgba(167, 139, 250, 0.1);
		}
		.owner-display.owner-view .owner-name .suffix {
			background: linear-gradient(135deg, #8b5cf6, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.owner-inline-status {
			max-width: 740px;
			margin-top: 8px;
			padding: 8px 12px;
			font-size: 0.78rem;
		}
		.linked-owner-status {
			max-width: none;
			margin-top: 4px;
		}
		.owner-info {
			display: flex;
			align-items: center;
			gap: 6px;
			flex: 1;
			min-width: 0;
		}
		.owner-info-link {
			display: flex;
			align-items: flex-start;
			gap: 8px;
			flex: 1;
			min-width: 0;
			text-decoration: none;
			padding: 6px 12px;
			margin: -6px -12px;
			border-radius: 10px;
			transition: all 0.2s;
			cursor: pointer;
		}
		.owner-info-link:hover {
			background: rgba(96, 165, 250, 0.1);
		}
		.owner-display.primary-view .owner-info-link:hover {
			background: rgba(250, 204, 21, 0.1);
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
			font-size: 0.75rem;
			color: var(--text-muted);
			white-space: nowrap;
			flex-shrink: 0;
		}
		.owner-name {
			font-weight: 600;
			font-size: 0.85rem;
			color: var(--text);
			white-space: nowrap;
		}
		.owner-name-copy {
			cursor: copy;
			transition: color 0.2s ease;
		}
		.owner-name-copy:hover {
			color: var(--accent-hover);
		}
		.owner-name-copy.copied {
			color: var(--success);
		}
		.owner-name .suffix {
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.owner-display.primary-view .owner-name .suffix {
			background: linear-gradient(135deg, #f59e0b, #facc15);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.grace-period-card {
			background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 88, 12, 0.1));
			border: 1px solid rgba(245, 158, 11, 0.3);
			border-radius: 12px;
			padding: 16px;
			margin-top: 0;
			max-width: 740px;
			grid-column: 2;
		}
		.grace-period-header {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: 600;
			color: #f59e0b;
			margin-bottom: 12px;
			font-size: 0.9rem;
		}
		.grace-period-header svg {
			flex-shrink: 0;
		}
		.grace-period-body {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}
		.grace-period-info {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.grace-period-message {
			font-size: 0.85rem;
			color: var(--text-muted);
		}
		.grace-period-countdown {
			font-size: 0.9rem;
			color: var(--text);
		}
		.grace-period-countdown strong {
			color: #f59e0b;
			font-weight: 700;
		}
		.burn-nft-btn {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 10px 16px;
			background: rgba(239, 68, 68, 0.1);
			border: 1px solid rgba(239, 68, 68, 0.3);
			border-radius: 8px;
			color: #ef4444;
			font-weight: 600;
			font-size: 0.875rem;
			cursor: pointer;
			transition: all 0.2s;
		}
		.burn-nft-btn:hover:not(:disabled) {
			background: rgba(239, 68, 68, 0.2);
			border-color: rgba(239, 68, 68, 0.5);
		}
		.burn-nft-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
		.burn-nft-btn svg {
			flex-shrink: 0;
		}
		.burn-nft-loading {
			display: inline-flex;
		}
		.grace-period-status {
			padding: 10px 14px;
			border-radius: 8px;
			font-size: 0.85rem;
			line-height: 1.4;
		}
		.grace-period-status.success {
			background: rgba(34, 197, 94, 0.1);
			border: 1px solid rgba(34, 197, 94, 0.3);
			color: #22c55e;
		}
		.grace-period-status.error {
			background: rgba(239, 68, 68, 0.1);
			border: 1px solid rgba(239, 68, 68, 0.3);
			color: #ef4444;
		}
		.grace-period-status.info {
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.3);
			color: #60a5fa;
		}
		.owner-addr {
			font-family: ui-monospace, SFMono-Regular, monospace;
			color: var(--text-dim);
			font-size: 0.7rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 100%;
		}
		.owner-addr.copyable {
			cursor: pointer;
			padding: 2px 6px;
			border-radius: 6px;
			transition: all 0.2s ease;
		}
		.owner-addr.copyable:hover {
			color: #dbeafe;
			background: rgba(59, 130, 246, 0.14);
			box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
		}
		.owner-addr.copyable:focus-visible {
			outline: none;
			color: #eff6ff;
			background: rgba(59, 130, 246, 0.2);
			box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.28), 0 0 14px rgba(96, 165, 250, 0.2);
		}
		.owner-addr.copyable.copied {
			color: #d1fae5;
			background: rgba(16, 185, 129, 0.2);
			box-shadow: 0 0 14px rgba(16, 185, 129, 0.3);
		}
		.target-preview {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 4px 8px;
			border-radius: 6px;
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.14));
			border: 1px solid rgba(96, 165, 250, 0.45);
			transition: all 0.2s ease;
		}
		.target-preview.is-copyable {
			cursor: pointer;
		}
		.target-preview:hover {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.2));
			border-color: rgba(147, 197, 253, 0.7);
			box-shadow: 0 0 14px rgba(59, 130, 246, 0.25);
		}
		.target-preview.self-target:not(.target-primary-gold):not(.target-owned-blue):not(.target-owned-white) {
			background: linear-gradient(135deg, rgba(88, 28, 135, 0.4), rgba(76, 29, 149, 0.32));
			border-color: rgba(167, 139, 250, 0.62);
			box-shadow: 0 0 16px rgba(139, 92, 246, 0.3);
		}
		.target-preview.self-target:not(.target-primary-gold):not(.target-owned-blue):not(.target-owned-white):hover {
			background: linear-gradient(135deg, rgba(109, 40, 217, 0.46), rgba(107, 33, 168, 0.36));
			border-color: rgba(196, 181, 253, 0.75);
			box-shadow: 0 0 18px rgba(139, 92, 246, 0.36);
		}
		.target-preview.is-copyable:focus-visible {
			outline: none;
			border-color: rgba(191, 219, 254, 0.9);
			box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.28), 0 0 14px rgba(59, 130, 246, 0.26);
		}
		.target-preview.self-target:not(.target-primary-gold):not(.target-owned-blue):not(.target-owned-white).is-copyable:focus-visible {
			border-color: rgba(221, 214, 254, 0.9);
			box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.3), 0 0 16px rgba(139, 92, 246, 0.34);
		}
		.target-preview.no-target {
			background: rgba(148, 163, 184, 0.08);
			border-color: rgba(148, 163, 184, 0.35);
		}
		.target-preview.no-target:hover {
			background: rgba(148, 163, 184, 0.12);
			border-color: rgba(148, 163, 184, 0.45);
			box-shadow: none;
		}
		.target-preview.target-owned-white {
			background: linear-gradient(135deg, rgba(248, 251, 255, 0.26), rgba(226, 232, 240, 0.2));
			border-color: rgba(248, 251, 255, 0.58);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38), 0 1px 5px rgba(148, 163, 184, 0.22);
		}
		.target-preview.target-owned-white:hover {
			background: linear-gradient(135deg, rgba(248, 251, 255, 0.38), rgba(226, 232, 240, 0.32));
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 8px rgba(148, 163, 184, 0.35);
		}
		.target-preview.target-owned-white .target-preview-value {
			color: #f8fbff;
			text-shadow: 0 0 10px rgba(248, 251, 255, 0.3);
		}
		.target-preview.target-owned-white .target-preview-copy-btn,
		.target-preview.target-owned-white .target-preview-edit-btn {
			color: #f1f5f9;
		}
		.target-preview-copy-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: transparent;
			border: none;
			padding: 0;
			margin: 0;
			color: #dbeafe;
			cursor: pointer;
			line-height: 1;
			width: 18px;
			height: 18px;
			border-radius: 4px;
		}
		.target-preview-copy-btn:disabled {
			opacity: 0.45;
			cursor: not-allowed;
		}
		.target-preview-copy-btn svg {
			width: 13px;
			height: 13px;
			flex: 0 0 auto;
		}
		.target-preview-copy-btn:focus-visible {
			outline: none;
			color: #eff6ff;
		}
		.target-preview-copy-btn.copied {
			color: #d1fae5;
			background: rgba(16, 185, 129, 0.22);
		}
		.target-preview-value {
			display: inline-block;
			max-width: 120px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			color: #e2e8f0;
			font-weight: 700;
			text-shadow: none;
		}
		.target-preview.self-target .target-preview-value {
			color: #e9d5ff;
		}
		.target-preview.target-primary-gold {
			background: linear-gradient(135deg, rgba(120, 53, 15, 0.36), rgba(217, 119, 6, 0.22));
			border-color: rgba(251, 191, 36, 0.68);
			box-shadow: 0 0 14px rgba(245, 158, 11, 0.24);
		}
		.target-preview.target-primary-gold:hover {
			background: linear-gradient(135deg, rgba(146, 64, 14, 0.44), rgba(234, 179, 8, 0.28));
			border-color: rgba(252, 211, 77, 0.82);
			box-shadow: 0 0 18px rgba(245, 158, 11, 0.34);
		}
		.target-preview.target-primary-gold.is-copyable:focus-visible {
			border-color: rgba(253, 224, 71, 0.95);
			box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.25), 0 0 16px rgba(245, 158, 11, 0.3);
		}
		.target-preview.target-primary-gold .target-preview-value {
			color: #fbbf24;
			text-shadow: 0 0 10px rgba(251, 191, 36, 0.35);
		}
		.target-preview.target-primary-gold .target-preview-copy-btn,
		.target-preview.target-primary-gold .target-preview-edit-btn {
			color: #fcd34d;
		}
		.target-preview.target-owned-blue {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.24), rgba(99, 102, 241, 0.16));
			border-color: rgba(96, 165, 250, 0.56);
			box-shadow: 0 0 14px rgba(59, 130, 246, 0.24);
		}
		.target-preview.target-owned-blue:hover {
			background: linear-gradient(135deg, rgba(59, 130, 246, 0.34), rgba(99, 102, 241, 0.24));
			border-color: rgba(147, 197, 253, 0.72);
			box-shadow: 0 0 16px rgba(59, 130, 246, 0.3);
		}
		.target-preview.target-owned-blue.is-copyable:focus-visible {
			border-color: rgba(191, 219, 254, 0.92);
			box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.28), 0 0 14px rgba(59, 130, 246, 0.26);
		}
		.target-preview.target-owned-blue .target-preview-value {
			color: #9edcff;
			text-shadow: 0 0 10px rgba(125, 211, 252, 0.28);
		}
		.target-preview.target-owned-blue .target-preview-copy-btn,
		.target-preview.target-owned-blue .target-preview-edit-btn {
			color: #dbeafe;
		}
		.target-preview.self-target:not(.target-primary-gold):not(.target-owned-blue):not(.target-owned-white) .target-preview-copy-btn,
		.target-preview.self-target:not(.target-primary-gold):not(.target-owned-blue):not(.target-owned-white) .target-preview-edit-btn {
			color: #ddd6fe;
		}
		.target-preview.self-target:not(.target-primary-gold):not(.target-owned-blue):not(.target-owned-white) .target-preview-copy-btn:hover:not(:disabled),
		.target-preview.self-target:not(.target-primary-gold):not(.target-owned-blue):not(.target-owned-white) .target-preview-edit-btn:hover:not(:disabled) {
			background: rgba(167, 139, 250, 0.2);
			color: #f5f3ff;
		}
		.target-preview.no-target .target-preview-value {
			color: #64748b;
			font-family: var(--font-main, system-ui);
			font-size: 0.78rem;
			font-weight: 700;
		}
		.target-preview.empty-target .target-preview-value {
			display: none;
		}
		.target-preview.empty-target .target-preview-copy-btn {
			color: #f8fafc;
		}
		.target-preview.empty-target .target-preview-copy-btn:disabled {
			opacity: 0.95;
			cursor: default;
		}
		.target-preview.empty-target .target-preview-copy-btn svg circle:nth-of-type(2) {
			display: none;
		}
		.target-preview.empty-target:hover {
			box-shadow: none;
		}
		.target-preview-edit-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			padding: 0;
			background: transparent;
			border: none;
			color: #dbeafe;
			cursor: pointer;
			border-radius: 4px;
			transition: all 0.2s ease;
			flex: 0 0 auto;
		}
		.target-preview-edit-btn svg {
			width: 12px;
			height: 12px;
		}
		.target-preview-edit-btn:hover:not(:disabled) {
			background: rgba(147, 197, 253, 0.15);
			color: #eff6ff;
		}
		.target-preview-edit-btn:disabled {
			opacity: 0.45;
			cursor: not-allowed;
		}
		.target-preview.copied {
			background: linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(34, 197, 94, 0.24));
			border-color: rgba(52, 211, 153, 0.65);
			box-shadow: 0 0 16px rgba(16, 185, 129, 0.35);
		}
		.target-preview.copied .target-preview-copy-btn,
		.target-preview.copied .target-preview-edit-btn {
			color: #d1fae5;
		}
		.target-preview .target-self-btn {
			height: 24px;
			width: 34px;
			min-width: 34px;
			padding: 0 !important;
			border-radius: 999px;
			font-size: 0.67rem;
			font-weight: 600;
			letter-spacing: 0.01em;
			line-height: 1;
			background: linear-gradient(135deg, rgba(248, 250, 252, 0.22), rgba(226, 232, 240, 0.14));
			border-color: rgba(241, 245, 249, 0.52);
			color: #f8fafc;
			box-shadow: inset 0 0 0 1px rgba(241, 245, 249, 0.2);
		}
		.target-preview .target-self-btn:hover:not(:disabled) {
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(241, 245, 249, 0.24));
			border-color: rgba(255, 255, 255, 0.8);
			color: #ffffff;
		}
		.target-preview .target-self-btn:disabled {
			opacity: 0.5;
		}
		.target-preview.lift-ready {
			background: linear-gradient(135deg, rgba(22, 78, 99, 0.34), rgba(15, 23, 42, 0.88));
			border-color: rgba(45, 212, 191, 0.42);
		}
		.target-preview .target-lift-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 0;
			min-width: 34px;
			height: 24px;
			width: 34px;
			padding: 0 !important;
			background: linear-gradient(135deg, rgba(248, 250, 252, 0.3), rgba(203, 213, 225, 0.2));
			border-color: rgba(226, 232, 240, 0.62);
			color: #f8fafc;
			box-shadow: inset 0 0 0 1px rgba(248, 250, 252, 0.28), 0 0 10px rgba(226, 232, 240, 0.2);
		}
		.target-preview .target-lift-btn svg {
			width: 14px;
			height: 14px;
			flex: 0 0 auto;
			stroke: currentColor;
		}
		.target-preview .target-lift-btn:hover:not(:disabled) {
			background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(226, 232, 240, 0.3));
			border-color: rgba(255, 255, 255, 0.88);
			color: #ffffff;
			box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45), 0 0 14px rgba(226, 232, 240, 0.3);
		}
		.target-meta-item .target-preview {
			max-width: 220px;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.owner-actions {
			display: flex;
			gap: 6px;
			align-items: center;
		}
		.owner-primary-star {
			width: 24px;
			height: 24px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			border-radius: 999px;
			border: 1px solid rgba(148, 163, 184, 0.35);
			background: rgba(15, 23, 42, 0.35);
			color: rgba(203, 213, 225, 0.85);
			padding: 0;
			cursor: pointer;
			transition: all 0.2s ease;
			flex: 0 0 auto;
		}
		.owner-primary-star svg {
			width: 13px;
			height: 13px;
			fill: transparent;
			transition: all 0.2s ease;
		}
		.owner-primary-star svg polygon {
			fill: transparent;
			stroke: currentColor;
			transition: fill 0.2s ease, stroke 0.2s ease;
		}
		.owner-primary-star:hover:not(:disabled) {
			border-color: rgba(250, 204, 21, 0.45);
			color: #facc15;
			transform: translateY(-1px);
		}
		.owner-primary-star.selected {
			border-color: rgba(250, 204, 21, 0.6);
			background: rgba(250, 204, 21, 0.2);
			color: #facc15;
		}
		.owner-primary-star.selected svg polygon {
			fill: #facc15;
			stroke: #facc15;
		}
		.owner-primary-star.loading {
			animation: pulse-star 1s ease-in-out infinite;
		}
		.owner-primary-star:disabled {
			cursor: not-allowed;
			opacity: 0.8;
		}
		.owner-primary-star.selected:disabled {
			opacity: 1;
		}
		.owner-primary-star.hidden {
			display: none;
		}
		.header-primary-star {
			margin-top: 1px;
			width: 28px;
			height: 28px;
		}
		.header-primary-star svg {
			width: 15px;
			height: 15px;
		}
		@keyframes pulse-star {
			0%, 100% { transform: scale(1); }
			50% { transform: scale(1.08); }
		}
		.owner-home-btn {
			width: 30px;
			height: 30px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			border-radius: 8px;
			border: 1px solid var(--border);
			background: rgba(10, 10, 16, 0.7);
			color: var(--accent);
			text-decoration: none;
			transition: all 0.2s ease;
		}
		.owner-home-btn:hover {
			border-color: rgba(96, 165, 250, 0.45);
			background: rgba(18, 24, 40, 0.8);
			box-shadow: 0 0 16px rgba(96, 165, 250, 0.15);
		}
		.owner-home-btn svg {
			width: 16px;
			height: 16px;
		}
		.copy-btn {
			background: none;
			border: none;
			color: var(--text-dim);
			cursor: pointer;
			padding: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.25s ease;
			border-radius: 6px;
			flex: 0 0 auto;
		}
		.copy-btn:hover {
			color: #60a5fa;
			background: rgba(96, 165, 250, 0.1);
		}
		.target-meta-item .copy-btn {
			border: 1px solid var(--border);
			background: rgba(255, 255, 255, 0.02);
			padding: 5px;
		}
		.target-meta-item .copy-btn svg {
			width: 13px;
			height: 13px;
			opacity: 1;
		}
		.owner-copy-btn {
			padding: 4px;
			flex-shrink: 0;
		}
		.owner-copy-btn svg {
			width: 12px;
			height: 12px;
		}
		.owner-actions .edit-btn,
		.target-meta-item .edit-btn {
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
		.owner-actions .edit-btn:hover:not(:disabled),
		.target-meta-item .edit-btn:hover:not(:disabled) {
			background: rgba(96, 165, 250, 0.1);
			color: #60a5fa;
			border-color: rgba(96, 165, 250, 0.35);
			box-shadow: 0 0 20px rgba(96, 165, 250, 0.1);
		}
		.owner-actions .edit-btn:disabled,
		.target-meta-item .edit-btn:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}
		.owner-actions .edit-btn.hidden,
		.target-meta-item .edit-btn.hidden {
			display: none;
		}
		.owner-actions .edit-btn.primary-active,
		.target-meta-item .edit-btn.primary-active {
			background: rgba(52, 211, 153, 0.1);
			border-color: rgba(52, 211, 153, 0.35);
			color: var(--success);
		}
		.target-self-btn {
			width: auto;
			height: 24px;
			padding: 0 10px !important;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			line-height: 1;
		}
		.target-meta-item .send-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			background: rgba(74, 222, 128, 0.1);
			border: 1px solid rgba(74, 222, 128, 0.25);
			color: #4ade80;
			padding: 7px 12px;
			border-radius: 10px;
			font-size: 0.72rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.target-meta-item .send-btn:hover {
			transform: translateY(-1px);
			background: rgba(74, 222, 128, 0.22);
			border-color: rgba(74, 222, 128, 0.5);
		}
		.target-meta-item .send-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.target-meta-item .send-btn svg {
			width: 13px;
			height: 13px;
		}


		.nft-viewer {
			display: none;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.85);
			backdrop-filter: blur(12px);
			z-index: 1000;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.nft-viewer.active {
			display: flex;
		}
		.nft-viewer-content {
			position: relative;
			background: var(--bg-dark);
			border: 1px solid rgba(96, 165, 250, 0.25);
			border-radius: 24px;
			padding: 20px;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 16px;
			max-width: 360px;
			width: 100%;
			box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 80px rgba(96, 165, 250, 0.1);
		}
		.nft-viewer-close {
			position: absolute;
			top: 12px;
			right: 12px;
			width: 32px;
			height: 32px;
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 8px;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
			z-index: 2;
		}
		.nft-viewer-close:hover {
			background: rgba(248, 113, 113, 0.2);
			border-color: rgba(248, 113, 113, 0.4);
		}
		.nft-viewer-close svg {
			width: 16px;
			height: 16px;
			color: var(--text-muted);
		}
		.nft-viewer-close:hover svg {
			color: #f87171;
		}
		.nft-viewer-image {
			width: 100%;
			aspect-ratio: 1;
			border-radius: 16px;
			overflow: hidden;
			background: linear-gradient(180deg, var(--bg-subtle) 0%, var(--bg-void) 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			position: relative;
		}
		.nft-viewer-image img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: 16px;
		}
		.nft-viewer-image canvas {
			width: 75%;
			height: 75%;
			border-radius: 12px;
		}
		.nft-viewer-label {
			font-family: ui-monospace, monospace;
			font-size: 1rem;
			color: var(--text);
			font-weight: 600;
			padding: 6px 16px;
			background: rgba(96, 165, 250, 0.08);
			border-radius: 8px;
		}
		.nft-viewer-actions {
			display: flex;
			gap: 8px;
			width: 100%;
		}
		.nft-viewer-btn {
			flex: 1;
			padding: 10px 12px;
			border-radius: 10px;
			border: 1px solid var(--glass-border);
			background: rgba(255, 255, 255, 0.04);
			font-size: 0.8rem;
			font-weight: 600;
			color: var(--text-muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			transition: all 0.2s;
		}
		.nft-viewer-btn:hover {
			background: rgba(96, 165, 250, 0.15);
			border-color: rgba(96, 165, 250, 0.3);
			color: var(--accent);
		}
		.nft-viewer-btn svg {
			width: 15px;
			height: 15px;
		}
		.nft-viewer-btn.active {
			background: rgba(96, 165, 250, 0.15);
			border-color: rgba(96, 165, 250, 0.4);
			color: var(--accent);
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

		/* Send Modal */
		.send-modal {
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
		.send-modal.open { display: flex; }
		.send-modal-content {
			background: linear-gradient(135deg, rgba(15, 15, 25, 0.98), rgba(20, 15, 35, 0.98));
			border: 1px solid rgba(139, 92, 246, 0.3);
			border-radius: 16px;
			padding: 24px;
			max-width: 380px;
			width: 100%;
			box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1);
		}
		.send-modal-header {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 16px;
		}
		.send-modal-icon {
			width: 22px;
			height: 22px;
			color: #a78bfa;
			flex-shrink: 0;
		}
		.send-modal h3 {
			color: #f0f0f5;
			margin: 0;
			font-size: 1.05rem;
			font-weight: 700;
		}
		.send-recipient-card {
			display: flex;
			flex-direction: column;
			gap: 4px;
			padding: 12px 14px;
			background: rgba(139, 92, 246, 0.06);
			border: 1px solid rgba(139, 92, 246, 0.18);
			border-radius: 10px;
			margin-bottom: 14px;
		}
		.send-recipient-label {
			font-size: 0.62rem;
			color: #94a3b8;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			font-weight: 600;
		}
		.send-recipient-name {
			font-size: 1rem;
			font-weight: 700;
			color: #c4b5fd;
		}
		.send-recipient-addr {
			font-family: var(--font-mono, ui-monospace, monospace);
			font-size: 0.68rem;
			color: #64748b;
			letter-spacing: 0.02em;
		}
		.send-amount-row {
			display: flex;
			align-items: center;
			gap: 0;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(139, 92, 246, 0.25);
			border-radius: 10px;
			overflow: hidden;
			margin-bottom: 10px;
			transition: border-color 0.2s;
		}
		.send-amount-row:focus-within {
			border-color: rgba(167, 139, 250, 0.5);
			box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.15);
		}
		.send-stepper-btn {
			width: 40px;
			height: 42px;
			border: none;
			background: transparent;
			color: #c4b5fd;
			font-size: 1.1rem;
			font-weight: 600;
			cursor: pointer;
			transition: background 0.15s, color 0.15s;
			flex-shrink: 0;
		}
		.send-stepper-btn:first-child {
			border-right: 1px solid rgba(139, 92, 246, 0.15);
		}
		.send-stepper-btn:last-child {
			border-left: 1px solid rgba(139, 92, 246, 0.15);
		}
		.send-stepper-btn:hover {
			background: rgba(139, 92, 246, 0.15);
			color: #e0d4ff;
		}
		.send-stepper-btn:active {
			background: rgba(139, 92, 246, 0.25);
		}
		.send-modal input {
			flex: 1;
			min-width: 0;
			padding: 10px 4px;
			border: none;
			background: transparent;
			color: #f0f0f5;
			font-family: var(--font-mono, ui-monospace, monospace);
			font-size: 1.1rem;
			font-weight: 600;
			text-align: center;
			outline: none;
			appearance: textfield;
			-moz-appearance: textfield;
		}
		.send-modal input::-webkit-outer-spin-button,
		.send-modal input::-webkit-inner-spin-button {
			-webkit-appearance: none;
			margin: 0;
		}
		.send-modal input::placeholder {
			color: #4a5568;
			font-weight: 400;
		}
		.send-amount-currency {
			color: #94a3b8;
			font-size: 0.72rem;
			font-weight: 600;
			font-family: var(--font-mono, ui-monospace, monospace);
			letter-spacing: 0.04em;
			padding-right: 4px;
			flex-shrink: 0;
		}
		.send-wallet-indicator {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			margin-bottom: 6px;
			min-height: 28px;
		}
		.send-wallet-ball {
			width: 24px;
			height: 24px;
			border-radius: 50%;
			background: #ffffff;
			box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
			object-fit: cover;
		}
		.send-wallet-ball-default {
			display: inline-block;
		}
		.send-modal-buttons {
			display: flex;
			gap: 10px;
			margin-top: 14px;
		}
		.send-modal-buttons button {
			flex: 1;
			padding: 10px 16px;
			border-radius: 10px;
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.send-modal-buttons .cancel-btn {
			background: transparent;
			color: #94a3b8;
			border: 1px solid rgba(148, 163, 184, 0.2);
		}
		.send-modal-buttons .cancel-btn:hover {
			background: rgba(255, 255, 255, 0.05);
			color: #f0f0f5;
			border-color: rgba(148, 163, 184, 0.35);
		}
		.send-modal-buttons .save-btn {
			background: rgba(139, 92, 246, 0.2);
			border: 1px solid rgba(139, 92, 246, 0.4);
			color: #c4b5fd;
		}
		.send-modal-buttons .save-btn:hover {
			background: rgba(139, 92, 246, 0.3);
			border-color: rgba(139, 92, 246, 0.55);
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
		}
		.send-modal-buttons .save-btn:disabled {
			opacity: 0.4;
			cursor: not-allowed;
			transform: none;
			box-shadow: none;
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

		/* Jacket Decay Auction Modal */
		.jacket-modal {
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
		.jacket-modal.open { display: flex; }
		.jacket-modal-content {
			background: var(--card-bg-solid);
			border: 1px solid var(--glass-border);
			border-radius: 20px;
			padding: 28px;
			max-width: 480px;
			width: 100%;
			box-shadow: var(--shadow-lg);
		}
		.jacket-modal h3 {
			color: var(--text);
			margin-bottom: 8px;
			font-size: 1.15rem;
			font-weight: 700;
		}
		.jacket-modal p {
			color: var(--text-muted);
			font-size: 0.85rem;
			margin-bottom: 18px;
		}
		.jacket-modal label {
			display: block;
			color: var(--text-muted);
			font-size: 0.8rem;
			margin-bottom: 6px;
			font-weight: 600;
		}
		.jacket-modal input,
		.jacket-modal select {
			width: 100%;
			padding: 14px 16px;
			border: 2px solid var(--border);
			border-radius: 12px;
			background: var(--card-bg-solid);
			color: var(--text);
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.85rem;
			margin-bottom: 16px;
			transition: all 0.2s;
		}
		.jacket-modal input:focus,
		.jacket-modal select:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 4px var(--accent-glow);
		}
		.jacket-modal .jacket-warning {
			background: rgba(245, 158, 11, 0.1);
			border: 1px solid rgba(245, 158, 11, 0.3);
			border-radius: 12px;
			padding: 12px 14px;
			color: #f59e0b;
			font-size: 0.8rem;
			margin-bottom: 18px;
			line-height: 1.4;
		}
		.jacket-modal .jacket-status {
			font-size: 0.8rem;
			min-height: 20px;
			margin-bottom: 8px;
		}
		.jacket-modal .jacket-status.error { color: #ef4444; }
		.jacket-modal .jacket-status.success { color: #22c55e; }
		.jacket-modal-buttons {
			display: flex;
			gap: 12px;
			margin-top: 20px;
		}
		.jacket-modal-buttons button {
			flex: 1;
			padding: 12px 18px;
			border-radius: 12px;
			font-size: 0.9rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.jacket-modal-buttons .cancel-btn {
			background: transparent;
			color: var(--text-muted);
			border: 1px solid var(--border);
		}
		.jacket-modal-buttons .cancel-btn:hover {
			background: rgba(255, 255, 255, 0.05);
			color: var(--text);
		}
		.jacket-modal-buttons .list-btn {
			background: linear-gradient(135deg, #f59e0b, #d97706);
			color: white;
			border: none;
			box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
		}
		.jacket-modal-buttons .list-btn:hover {
			filter: brightness(1.1);
			transform: translateY(-1px);
		}
		.jacket-modal-buttons .list-btn:disabled {
			opacity: 0.5;
			cursor: not-allowed;
			transform: none;
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
			grid-column: 2;
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
			grid-column: 1 / -1;
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

		/* Marketplace module cards */
		.marketplace-card {
			background: linear-gradient(135deg, rgba(255, 107, 0, 0.08), rgba(249, 115, 22, 0.05));
			border: 1px solid rgba(255, 107, 0, 0.25);
			padding: 11px 12px 9px;
			border-radius: 11px;
			margin-top: 0;
			margin-bottom: 0;
			transition: border-color 0.2s ease, box-shadow 0.2s ease;
		}
		.marketplace-card.marketplace-owner-listing {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.05));
			border: 1px solid rgba(139, 92, 246, 0.25);
		}
		.marketplace-header {
			margin-bottom: 5px;
		}
		.marketplace-title {
			display: flex;
			align-items: center;
			gap: 7px;
			color: #f59e0b;
			font-size: 0.84rem;
			font-weight: 600;
		}
		.marketplace-card.marketplace-owner-listing .marketplace-title {
			color: var(--accent-secondary, #8b5cf6);
		}
		.marketplace-title svg {
			width: 16px;
			height: 16px;
		}
.marketplace-link {
			font-size: 0.68rem;
			color: #f0f0f5;
			text-decoration: none;
			margin-left: auto;
			padding: 3px 7px;
			border-radius: 6px;
			background: rgba(255,255,255,0.05);
			transition: all 0.15s ease;
		}
		.marketplace-link:hover {
			background: rgba(255,255,255,0.1);
			color: #ffffff;
		}
		.marketplace-link:visited {
			color: #f0f0f5;
		}
		.marketplace-body {
			display: flex;
			flex-direction: column;
			gap: 5px;
		}
		.marketplace-stats-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 4px 8px;
			background: rgba(255, 107, 0, 0.06);
			border-radius: 7px;
			border: 1px solid rgba(255, 107, 0, 0.1);
		}
		.marketplace-card.marketplace-owner-listing .marketplace-stats-row {
			background: rgba(139, 92, 246, 0.06);
			border: 1px solid rgba(139, 92, 246, 0.1);
		}
		.marketplace-stat {
			display: inline-flex;
			align-items: baseline;
			gap: 5px;
		}
		.marketplace-stat-label {
			color: var(--text-dim, #71717a);
			font-size: 0.68rem;
		}
		.marketplace-stat-value {
			color: var(--text);
			font-size: 0.72rem;
			font-weight: 600;
			font-family: var(--font-mono, monospace);
		}
		.marketplace-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 5px 8px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 8px;
		}
		#marketplace-listing-row {
			order: 1;
		}
		#marketplace-bid-row {
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto auto;
			gap: 6px;
			align-items: center;
			order: 4;
		}
		#marketplace-sold-row {
			order: 5;
		}
		.marketplace-label {
			color: #f0f0f5;
			font-size: 0.85rem;
			font-weight: 600;
		}
		.marketplace-listing-meta {
			display: inline-flex;
			align-items: baseline;
			gap: 6px;
			min-width: 0;
		}
		.marketplace-bid-meta {
			display: inline-flex;
			align-items: baseline;
			gap: 6px;
			min-width: 0;
		}
		.marketplace-lister,
		.marketplace-bidder {
			color: #f0f0f5;
			font-size: 0.75rem;
			font-weight: 500;
			font-family: var(--font-mono, monospace);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 170px;
			text-decoration: none;
			transition: color 0.15s ease, opacity 0.15s ease;
		}
		.marketplace-card.marketplace-card-expanded .marketplace-lister,
		.marketplace-card.marketplace-card-expanded .marketplace-bidder {
			max-width: 250px;
		}
		.marketplace-lister:hover,
		.marketplace-bidder:hover {
			color: #ffffff;
			text-decoration: underline;
		}
		.marketplace-lister:visited,
		.marketplace-bidder:visited {
			color: #f0f0f5;
		}
		.marketplace-lister.inactive,
		.marketplace-bidder.inactive {
			color: var(--text-dim);
			pointer-events: none;
			text-decoration: none;
		}
		.marketplace-value {
			font-weight: 600;
			font-family: var(--font-mono, monospace);
		}
		.marketplace-value.listing-price {
			color: #f59e0b;
			font-size: 1.2rem;
			font-weight: 700;
		}
		.marketplace-card.marketplace-owner-listing .marketplace-value.listing-price {
			color: var(--accent-secondary, #8b5cf6);
		}
		.marketplace-value.bid-price {
			color: #f59e0b;
			font-size: 1.15rem;
			font-weight: 700;
			justify-self: end;
			text-align: right;
			white-space: nowrap;
		}
		.marketplace-card.marketplace-owner-listing .marketplace-value.bid-price {
			color: #8b5cf6;
		}
		.marketplace-value .price-amount {
			color: #ffffff;
		}
		.marketplace-value .price-sui {
			display: inline-flex;
			align-items: center;
			vertical-align: middle;
		}
		.marketplace-value .price-sui .sui-price-icon {
			width: 0.75em;
			height: auto;
			margin-left: 4px;
		}
		.marketplace-value.bid-price .price-amount {
			color: #ffffff;
		}
		.marketplace-accept-bid-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			width: auto;
			padding: 7px 12px;
			background: rgba(74, 222, 128, 0.15);
			border: 1px solid rgba(74, 222, 128, 0.3);
			border-radius: 10px;
			color: #86efac;
			font-size: 0.78rem;
			font-weight: 600;
			line-height: 1;
			white-space: nowrap;
			flex: 0 0 auto;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.marketplace-accept-bid-btn:hover:not(:disabled) {
			background: rgba(74, 222, 128, 0.22);
			border-color: rgba(74, 222, 128, 0.5);
			transform: translateY(-1px);
		}
		.marketplace-accept-bid-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			box-shadow: none;
		}
		.marketplace-accept-loading {
			display: inline-flex;
			align-items: center;
		}
		.marketplace-buy-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 8px 10px;
			background: linear-gradient(135deg, #f59e0b, #d97706);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
			order: 2;
		}
		.marketplace-buy-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(255, 107, 0, 0.3);
		}
		.marketplace-buy-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
			.marketplace-list-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				width: 100%;
				min-width: 0;
				padding: 9px 12px;
				background: rgba(139, 92, 246, 0.12);
				border: 1px solid rgba(139, 92, 246, 0.3);
				border-radius: 10px;
				color: #c4b5fd;
				font-size: 0.82rem;
				font-weight: 600;
				cursor: pointer;
				transition: all 0.2s ease;
				white-space: nowrap;
			}
			.marketplace-wrap-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				width: 100%;
				min-width: 0;
				padding: 9px 12px;
				background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(34, 197, 94, 0.12));
				border: 1px solid rgba(52, 211, 153, 0.38);
				border-radius: 10px;
				color: #6ee7b7;
				font-size: 0.8rem;
				font-weight: 700;
				cursor: pointer;
				transition: all 0.2s ease;
				white-space: nowrap;
			}
			.marketplace-list-btn:hover:not(:disabled) {
				background: rgba(139, 92, 246, 0.22);
				border-color: rgba(139, 92, 246, 0.5);
				transform: translateY(-1px);
			}
			.marketplace-wrap-btn:hover:not(:disabled) {
				background: linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(34, 197, 94, 0.24));
				border-color: rgba(52, 211, 153, 0.6);
				transform: translateY(-1px);
			}
		.marketplace-list-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			box-shadow: none;
		}
		.marketplace-wrap-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			box-shadow: none;
		}
		.marketplace-card.marketplace-owner-listing .marketplace-list-btn {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.1));
			border: 1px solid rgba(139, 92, 246, 0.3);
		}
		.marketplace-card.marketplace-owner-listing .marketplace-list-btn:hover:not(:disabled) {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.22), rgba(124, 58, 237, 0.18));
			border-color: rgba(139, 92, 246, 0.5);
		}
		.marketplace-wrap-hint {
			width: 100%;
			font-size: 0.62rem;
			line-height: 1.35;
			color: #a7f3d0;
			opacity: 0.92;
			padding: 2px 2px 0;
		}
			.marketplace-bid-input {
				display: flex;
				align-items: center;
				justify-content: flex-end;
				gap: 6px;
				margin-top: 2px;
				flex-wrap: wrap;
				width: 100%;
				order: 3;
			}
		.marketplace-list-input {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			justify-content: flex-start;
			gap: 5px;
			margin-top: 2px;
			width: 100%;
			order: 3;
		}
			.marketplace-list-top-row {
				display: flex;
				align-items: flex-start;
				justify-content: flex-end;
				gap: 4px;
				width: 100%;
			}
			.marketplace-bid-price-control,
			.marketplace-list-price-control {
				width: fit-content;
				background: rgba(0, 0, 0, 0.3);
				border: 1px solid var(--glass-border);
				border-radius: 8px;
				padding: 0;
				display: flex;
				align-items: center;
				gap: 0;
				transition: border-color 0.2s ease;
				overflow: hidden;
			}
			.marketplace-bid-price-control {
				min-width: 0;
				max-width: none;
				order: 2;
				margin-left: auto;
			}
			.marketplace-list-price-control {
				min-width: 0;
				max-width: none;
				margin-left: auto;
			}
			.marketplace-bid-stepper-btn,
			.marketplace-list-stepper-btn {
				width: 22px;
				height: 22px;
				border: none;
				background: transparent;
				border-radius: 0;
				padding: 0;
				color: #c4b5fd;
				font-size: 0.95rem;
				font-weight: 600;
				line-height: 1;
				cursor: pointer;
				transition: color 0.15s ease, background 0.15s ease;
				flex: 0 0 auto;
			}
			.marketplace-bid-stepper-btn:hover,
			.marketplace-list-stepper-btn:hover {
				color: #c4b5fd;
				background: rgba(139, 92, 246, 0.18);
			}
			.marketplace-bid-stepper-btn:active,
			.marketplace-list-stepper-btn:active {
				background: rgba(139, 92, 246, 0.28);
			}
			#marketplace-bid-price-down,
			#marketplace-list-price-down {
				border-right: 1px solid var(--glass-border);
			}
			#marketplace-bid-price-up,
			#marketplace-list-price-up {
				border-left: 1px solid var(--glass-border);
			}
			.marketplace-list-stepper-btn:hover:not(:disabled) {
				background: rgba(139, 92, 246, 0.15);
			}
			.marketplace-list-stepper-btn:active:not(:disabled) {
				background: rgba(139, 92, 246, 0.25);
			}
			.marketplace-list-stepper-btn:disabled {
				opacity: 0.45;
				cursor: not-allowed;
			}
			.marketplace-bid-stepper-btn {
				width: 26px;
				height: 26px;
				font-size: 0.95rem;
			}
			.marketplace-bid-price-control input,
			.marketplace-list-price-control input {
				flex: 0 0 auto;
				min-width: 0;
				background: transparent;
				border: none;
				padding: 0 3px;
				color: var(--text);
				font-family: 'JetBrains Mono', monospace;
				font-size: 0.78rem;
				text-align: center;
				font-variant-numeric: tabular-nums;
				outline: none;
				appearance: textfield;
				-moz-appearance: textfield;
			}
			.marketplace-bid-price-control input {
				width: 5ch;
				min-width: 4ch;
				max-width: 12ch;
				padding: 0 2px;
				font-size: 0.75rem;
			}
			.marketplace-list-price-control input {
				width: 5ch;
				min-width: 4ch;
				max-width: 12ch;
			}
			.marketplace-bid-currency,
			.marketplace-list-currency {
				color: #c4b5fd;
				margin-right: 6px;
				font-size: 0.66rem;
				padding-left: 1px;
				font-weight: 600;
				font-family: 'JetBrains Mono', monospace;
				letter-spacing: 0.04em;
				flex: 0 0 auto;
			}
			.marketplace-bid-price-control input::-webkit-outer-spin-button,
			.marketplace-bid-price-control input::-webkit-inner-spin-button,
			.marketplace-list-price-control input::-webkit-outer-spin-button,
			.marketplace-list-price-control input::-webkit-inner-spin-button {
				-webkit-appearance: none;
				margin: 0;
			}
			.marketplace-bid-input:focus-within .marketplace-bid-price-control {
				border-color: rgba(167, 139, 250, 0.5);
				box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.18);
			}
			.marketplace-list-input:focus-within .marketplace-list-price-control {
				border-color: rgba(167, 139, 250, 0.5);
				box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.18);
			}
			.marketplace-bid-price-control input::placeholder {
				color: var(--text-muted);
				opacity: 0.6;
			}
			.marketplace-list-price-control input::placeholder {
				color: var(--text-muted);
				opacity: 0.6;
			}
			.marketplace-bid-btn {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				gap: 8px;
				background: rgba(139, 92, 246, 0.15);
				border: 1px solid rgba(139, 92, 246, 0.4);
				color: #a78bfa;
				border-radius: 10px;
				padding: 9px 12px;
				font-size: 0.82rem;
				font-weight: 600;
				cursor: pointer;
				transition: all 0.2s ease;
				white-space: nowrap;
				width: 100%;
				flex-basis: 100%;
				order: 3;
			}
			.marketplace-bid-btn:hover:not(:disabled) {
				background: rgba(139, 92, 246, 0.25);
				border-color: rgba(139, 92, 246, 0.6);
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
			}
			.marketplace-bid-btn:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
			.marketplace-bid-btn.connect-wallet {
				background: rgba(139, 92, 246, 0.12);
				border: 1px solid rgba(139, 92, 246, 0.3);
				color: #c4b5fd;
				opacity: 1;
				cursor: pointer;
				width: 100%;
				min-width: 0;
				padding: 9px 12px;
				border-radius: 10px;
				font-size: 0.82rem;
				font-weight: 600;
				order: 3;
				flex-basis: 100%;
			}
			.marketplace-bid-btn.connect-wallet:hover {
				background: rgba(139, 92, 246, 0.22);
				border-color: rgba(139, 92, 246, 0.5);
				transform: translateY(-1px);
				box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
			}
			.marketplace-card.marketplace-disconnected .marketplace-bid-input {
				flex-direction: row;
				align-items: center;
				justify-content: flex-end;
				gap: 5px;
				flex-wrap: wrap;
				width: 100%;
			}
			.marketplace-card.marketplace-disconnected .marketplace-bid-price-control {
				width: auto;
				max-width: none;
			}
			.marketplace-card.marketplace-disconnected .marketplace-bid-btn.connect-wallet {
				width: 100%;
				min-width: 0;
				padding: 9px 12px;
				border-radius: 10px;
				font-size: 0.82rem;
			}
			.marketplace-card.marketplace-disconnected .marketplace-bid-estimate {
				display: inline-flex !important;
			}
			.marketplace-card.marketplace-tradeport-empty {
				background: linear-gradient(135deg, rgba(247, 160, 0, 0.1), rgba(166, 108, 0, 0.06));
				border-color: rgba(247, 160, 0, 0.3);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-title {
				color: #f7a000;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-link {
				background: rgba(247, 160, 0, 0.12);
				color: #f0f0f5;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-link:hover {
				background: rgba(247, 160, 0, 0.2);
				color: #ffffff;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-stats-row {
				background: rgba(247, 160, 0, 0.08);
				border-color: rgba(247, 160, 0, 0.2);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-value.listing-price {
				color: #f7a000;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-price-control {
				border-color: rgba(247, 160, 0, 0.32);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-stepper-btn {
				color: #fbbf24;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-stepper-btn:hover {
				background: rgba(247, 160, 0, 0.2);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-stepper-btn:active {
				background: rgba(247, 160, 0, 0.3);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-currency {
				color: #fbbf24;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-input:focus-within .marketplace-bid-price-control {
				border-color: rgba(251, 191, 36, 0.55);
				box-shadow: 0 0 0 1px rgba(247, 160, 0, 0.24);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-estimate {
				color: #fde68a;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-btn {
				background: rgba(247, 160, 0, 0.15);
				border: 1px solid rgba(247, 160, 0, 0.4);
				color: #fbbf24;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-btn:hover:not(:disabled) {
				background: rgba(247, 160, 0, 0.25);
				border-color: rgba(247, 160, 0, 0.6);
				box-shadow: 0 4px 12px rgba(247, 160, 0, 0.3);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-btn.connect-wallet {
				background: rgba(247, 160, 0, 0.18);
				border: 1px solid rgba(247, 160, 0, 0.4);
				color: #fde68a;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-btn.connect-wallet:hover {
				background: rgba(247, 160, 0, 0.28);
				border-color: rgba(251, 191, 36, 0.58);
				box-shadow: 0 4px 12px rgba(247, 160, 0, 0.35);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-buy-btn {
				background: rgba(247, 160, 0, 0.18);
				border: 1px solid rgba(247, 160, 0, 0.4);
				color: #f7a000;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-buy-btn:hover:not(:disabled) {
				background: rgba(247, 160, 0, 0.28);
				border-color: rgba(247, 160, 0, 0.6);
				box-shadow: 0 4px 12px rgba(247, 160, 0, 0.3);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-bid-btn.connect-wallet:hover {
				background: rgba(247, 160, 0, 0.28);
				border-color: rgba(251, 191, 36, 0.58);
				box-shadow: 0 4px 12px rgba(247, 160, 0, 0.35);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-buy-btn {
				background: rgba(247, 160, 0, 0.18);
				border: 1px solid rgba(247, 160, 0, 0.4);
				color: #f7a000;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-buy-btn:hover:not(:disabled) {
				background: rgba(247, 160, 0, 0.28);
				border-color: rgba(247, 160, 0, 0.6);
				box-shadow: 0 4px 12px rgba(247, 160, 0, 0.3);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity {
				border-top-color: rgba(247, 160, 0, 0.16);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item {
				border-color: rgba(247, 160, 0, 0.12);
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.listing .marketplace-activity-kind,
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.list .marketplace-activity-kind,
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.relist .marketplace-activity-kind {
				color: #a78bfa;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.bid .marketplace-activity-kind,
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.solo_bid .marketplace-activity-kind,
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.offer .marketplace-activity-kind {
				color: #f59e0b;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.bid .marketplace-activity-actor,
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.solo_bid .marketplace-activity-actor,
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.offer .marketplace-activity-actor {
				color: #f59e0b;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-item.transfer .marketplace-activity-kind {
				color: #fbbf24;
			}
			.marketplace-card.marketplace-tradeport-empty .marketplace-activity-link:hover {
				border-color: rgba(247, 160, 0, 0.5);
				background: rgba(247, 160, 0, 0.14);
			}
			.marketplace-bid-estimate {
				display: inline-flex;
				align-items: center;
				justify-content: flex-start;
				text-align: left;
				font-size: 0.7rem;
				color: #c4b5fd;
				min-height: 0;
				margin: 0;
				order: 1;
				flex: 0 0 auto;
				margin-right: 2px;
				white-space: nowrap;
			}
			.marketplace-bid-estimate:empty {
				display: none !important;
			}
			.marketplace-bid-usd {
				color: #ffffff;
				font-family: var(--font-mono, ui-monospace, monospace);
				font-weight: 700;
				font-size: 0.76rem;
				letter-spacing: 0.02em;
				font-variant-numeric: tabular-nums;
			}
			.marketplace-list-estimate {
				display: inline-flex;
				flex-direction: column;
				align-items: flex-end;
				justify-content: flex-end;
				font-size: 0.66rem;
				min-height: 0;
				margin: 0;
				white-space: normal;
				text-align: right;
				line-height: 1.2;
				gap: 2px;
				flex: 0 0 auto;
			}
			.marketplace-list-estimate:empty {
				display: none;
			}
			.marketplace-list-usd {
				color: #ffffff;
				font-family: var(--font-mono, ui-monospace, monospace);
				font-weight: 700;
				font-size: 0.78rem;
				letter-spacing: 0.02em;
				font-variant-numeric: tabular-nums;
			}
			.marketplace-list-split {
				color: #a5b4fc;
				font-size: 0.58rem;
				letter-spacing: 0.01em;
			}
		.marketplace-status {
			text-align: center;
			font-size: 0.68rem;
			color: var(--text-muted);
			min-height: 0;
			margin-top: 0;
			line-height: 1.25;
			order: 7;
		}
		.marketplace-status:empty {
			display: none;
		}
		.marketplace-status.success { color: var(--success); }
		.marketplace-status.error { color: var(--danger); }
		.marketplace-activity {
			margin-top: 3px;
			border-top: 1px solid rgba(139, 92, 246, 0.16);
			padding-top: 5px;
			order: 8;
		}
		.marketplace-activity-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			margin-bottom: 4px;
		}
		.marketplace-activity-header span {
			font-size: 0.64rem;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: #f0f0f5;
			font-weight: 600;
		}
		.marketplace-activity-link {
			font-size: 0.72rem;
			font-weight: 700;
			color: #f0f0f5;
			text-decoration: none;
			padding: 2px 7px;
			border-radius: 999px;
			border: 1px solid rgba(148, 163, 184, 0.24);
			background: rgba(255, 255, 255, 0.03);
			transition: all 0.2s ease;
			white-space: nowrap;
		}
		.marketplace-activity-link:hover {
			color: #ffffff;
			border-color: rgba(96, 165, 250, 0.5);
			background: rgba(96, 165, 250, 0.14);
		}
		.marketplace-activity-link:visited {
			color: #f0f0f5;
		}
		.marketplace-activity-list {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.marketplace-activity-year {
			font-size: 0.58rem;
			font-weight: 700;
			letter-spacing: 0.1em;
			text-transform: uppercase;
			color: #94a3b8;
			padding: 5px 0 2px;
			margin-top: 3px;
		}
		.marketplace-activity-year:first-child {
			margin-top: 0;
			padding-top: 0;
		}
		.marketplace-activity-item {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto auto;
			gap: 5px;
			align-items: center;
			padding: 3px 4px 3px 0;
			border-radius: 7px;
			background: rgba(0, 0, 0, 0.18);
			border: 1px solid rgba(139, 92, 246, 0.15);
		}
		.marketplace-activity-kind {
			font-size: 0.56rem;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: var(--text-dim);
			line-height: 1.05;
			white-space: nowrap;
		}
		.marketplace-activity-item.listing .marketplace-activity-kind,
		.marketplace-activity-item.list .marketplace-activity-kind,
		.marketplace-activity-item.relist .marketplace-activity-kind { color: #a78bfa; }
		.marketplace-activity-item.bid .marketplace-activity-kind,
		.marketplace-activity-item.solo_bid .marketplace-activity-kind,
		.marketplace-activity-item.offer .marketplace-activity-kind { color: #f59e0b; }
		.marketplace-activity-item.bid .marketplace-activity-actor,
		.marketplace-activity-item.solo_bid .marketplace-activity-actor,
		.marketplace-activity-item.offer .marketplace-activity-actor { color: #f59e0b; }
		.marketplace-activity-item.cancel_bid .marketplace-activity-kind { color: #f0f0f5; }
		.marketplace-activity-item.accept_bid .marketplace-activity-actor { color: #34d399; }
		.marketplace-activity-item.sale .marketplace-activity-kind,
		.marketplace-activity-item.buy .marketplace-activity-kind,
		.marketplace-activity-item.accept_bid .marketplace-activity-kind { color: #34d399; }
		.marketplace-activity-item.mint .marketplace-activity-kind { color: #60a5fa; }
		.marketplace-activity-item.transfer .marketplace-activity-kind { color: #fbbf24; }
		.marketplace-activity-item.expire .marketplace-activity-kind,
		.marketplace-activity-item.expired .marketplace-activity-kind,
		.marketplace-activity-item.delist .marketplace-activity-kind { color: #f87171; }
		.marketplace-activity-timestamp,
		.marketplace-activity-time {
			font-size: 0.56rem;
			color: #f0f0f5;
			font-family: var(--font-mono, monospace);
			white-space: nowrap;
			line-height: 1.05;
			opacity: 1;
			justify-self: end;
			text-align: right;
		}
		a.marketplace-activity-tx-link {
			color: inherit;
			text-decoration: none;
			cursor: pointer;
			transition: opacity 0.15s ease;
		}
		a.marketplace-activity-tx-link:hover {
			opacity: 0.8;
			text-decoration: underline;
		}
		a.marketplace-activity-tx-link:visited {
			color: inherit;
		}
		.marketplace-activity-actor {
			font-size: 0.62rem;
			color: #f0f0f5;
			font-family: var(--font-mono, monospace);
			display: block;
			line-height: 1.05;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			min-width: 0;
		}
		.marketplace-activity-actor-link {
			color: #f0f0f5;
			text-decoration: none;
			cursor: pointer;
			transition: color 0.15s ease, opacity 0.15s ease;
		}
		.marketplace-activity-actor-link:hover {
			color: #ffffff;
			text-decoration: underline;
		}
		.marketplace-activity-actor-link:visited {
			color: #f0f0f5;
		}
		.marketplace-activity-item.bid .marketplace-activity-actor-link,
		.marketplace-activity-item.bid .marketplace-activity-actor-link:visited,
		.marketplace-activity-item.solo_bid .marketplace-activity-actor-link,
		.marketplace-activity-item.solo_bid .marketplace-activity-actor-link:visited,
		.marketplace-activity-item.offer .marketplace-activity-actor-link,
		.marketplace-activity-item.offer .marketplace-activity-actor-link:visited { color: #f59e0b; }
		.marketplace-activity-item.accept_bid .marketplace-activity-actor-link,
		.marketplace-activity-item.accept_bid .marketplace-activity-actor-link:visited { color: #34d399; }
		.marketplace-activity-amount {
			font-size: 0.74rem;
			font-weight: 600;
			font-family: var(--font-mono, monospace);
			white-space: nowrap;
			line-height: 1.05;
			justify-self: end;
			text-align: right;
		}
		.marketplace-activity-item.bid .marketplace-activity-amount {
			font-size: 0.8rem;
		}
		.marketplace-activity-amount-num {
			color: #ffffff;
		}
		.marketplace-activity-amount-sui {
			display: inline-flex;
			align-items: center;
			vertical-align: middle;
		}
		.marketplace-activity-amount-sui .sui-price-icon {
			width: 0.7em;
			height: auto;
			margin-left: 3px;
		}
		.marketplace-activity-amount-text {
			color: #f0f0f5;
		}
		.marketplace-activity-empty {
			font-size: 0.64rem;
			color: var(--text-muted);
			text-align: left;
			padding: 5px 0;
		}
			@media (max-width: 780px) {
			#marketplace-bid-row {
				grid-template-columns: minmax(0, 1fr) auto auto;
				gap: 5px;
			}
			.marketplace-value.bid-price {
				justify-self: end;
			}
				.marketplace-bid-input {
					justify-content: stretch;
				}
				.marketplace-list-input {
					justify-content: stretch;
				}
				.marketplace-list-top-row {
					flex-wrap: wrap;
					row-gap: 4px;
				}
			}

		/* Auction Card */
		.auction-card {
			background: linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(34, 211, 238, 0.05));
			border: 1px solid rgba(56, 189, 248, 0.25);
			padding: 16px;
			border-radius: 12px;
			margin-top: 0;
			margin-bottom: 0;
		}
		.auction-header {
			margin-bottom: 12px;
		}
		.auction-title {
			display: flex;
			align-items: center;
			gap: 8px;
			color: #38bdf8;
			font-size: 0.9rem;
			font-weight: 600;
		}
		.auction-title svg {
			width: 18px;
			height: 18px;
		}
		.auction-seller-label {
			font-size: 0.7rem;
			color: var(--text-muted);
			background: rgba(255,255,255,0.06);
			padding: 2px 8px;
			border-radius: 6px;
			margin-left: auto;
		}
		.auction-body {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.auction-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 8px 12px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 8px;
		}
		.auction-row-state {
			border: 1px solid rgba(34, 197, 94, 0.35);
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.18), rgba(16, 185, 129, 0.08));
		}
		.auction-label {
			color: var(--text-muted);
			font-size: 0.8rem;
		}
		.auction-value {
			font-weight: 600;
			font-family: var(--font-mono, monospace);
		}
		.auction-value.price {
			color: #38bdf8;
			font-size: 1rem;
		}
		.auction-value.time-left {
			color: var(--text);
			font-size: 0.9rem;
		}
		.auction-value.state {
			color: #86efac;
			font-size: 0.8rem;
			font-family: var(--font-main);
		}
		.auction-buy-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 12px;
			background: linear-gradient(135deg, #0ea5e9, #06b6d4);
			border: none;
			border-radius: 10px;
			color: white;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.auction-buy-btn:hover:not(:disabled) {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
		}
		.auction-buy-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.auction-cancel-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			padding: 10px 12px;
			background: rgba(148, 163, 184, 0.12);
			border: 1px solid rgba(148, 163, 184, 0.45);
			border-radius: 10px;
			color: var(--text);
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
		}
		.auction-cancel-btn:hover:not(:disabled) {
			background: rgba(148, 163, 184, 0.2);
			border-color: rgba(148, 163, 184, 0.7);
		}
		.auction-cancel-btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.auction-status {
			text-align: center;
			font-size: 0.75rem;
			color: var(--text-muted);
			min-height: 16px;
		}
		.auction-status.success { color: var(--success); }
		.auction-status.error { color: var(--danger); }

		/* Swap Toggle Button */
		.swap-toggle-btn {
			width: 40px;
			height: 40px;
			border-radius: 10px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			background: rgba(167, 139, 250, 0.12);
			border: 1px solid rgba(167, 139, 250, 0.35);
			cursor: pointer;
			transition: all 0.2s ease;
			padding: 0;
			color: var(--purple);
		}
		.swap-toggle-btn svg {
			width: 18px;
			height: 18px;
		}
		.swap-toggle-btn:hover {
			background: rgba(167, 139, 250, 0.2);
			border-color: rgba(167, 139, 250, 0.55);
			transform: translateY(-1px);
		}

		/* Swap Panel */
		.swap-panel {
			position: fixed;
			top: calc(68px + env(safe-area-inset-top));
			right: calc(16px + env(safe-area-inset-right));
			z-index: 10050;
			width: 380px;
			max-height: calc(100vh - 100px);
			overflow-y: auto;
			background: var(--card-bg-elevated);
			backdrop-filter: blur(24px);
			-webkit-backdrop-filter: blur(24px);
			border: 1px solid var(--glass-border);
			border-radius: 16px;
			box-shadow: var(--shadow-lg), var(--shadow-glow);
			animation: swapPanelIn 0.2s ease;
		}
		@keyframes swapPanelIn {
			from { opacity: 0; transform: translateY(-8px) scale(0.97); }
			to { opacity: 1; transform: translateY(0) scale(1); }
		}
		.swap-panel-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 14px 16px 0;
		}
		.swap-panel-tabs {
			display: flex;
			gap: 4px;
		}
		.swap-tab {
			padding: 6px 14px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s ease;
		}
		.swap-tab:hover {
			color: var(--text);
			background: rgba(255, 255, 255, 0.04);
		}
		.swap-tab.active {
			color: var(--text-bright);
			background: rgba(96, 165, 250, 0.12);
		}
		.swap-panel-close {
			width: 28px;
			height: 28px;
			border-radius: 6px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			font-size: 1.2rem;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.15s ease;
		}
		.swap-panel-close:hover {
			background: rgba(255, 255, 255, 0.06);
			color: var(--text);
		}
		.swap-tab-content {
			padding: 12px 16px 16px;
		}
		#sui-coins-terminal {
			min-height: 360px;
		}
		.crosschain-ui {
			display: flex;
			flex-direction: column;
			gap: 14px;
		}
		.cc-direction {
			font-size: 0.85rem;
			font-weight: 700;
			color: var(--purple);
			letter-spacing: 0.5px;
		}
		.cc-field {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.cc-label {
			font-size: 0.72rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.cc-input {
			background: var(--bg-subtle);
			border: 1px solid var(--border);
			border-radius: 8px;
			padding: 10px 12px;
			color: var(--text);
			font-size: 0.9rem;
			font-family: var(--font-mono, monospace);
			transition: border-color 0.15s ease;
			width: 100%;
		}
		.cc-input:focus {
			outline: none;
			border-color: var(--purple);
		}
		.cc-input::placeholder {
			color: var(--text-dim);
		}
		.cc-rate {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 0.75rem;
		}
		.cc-rate-label {
			color: var(--text-muted);
			font-weight: 600;
		}
		.cc-rate-value {
			color: var(--text);
			font-family: var(--font-mono, monospace);
		}
		.cc-output {
			background: rgba(167, 139, 250, 0.08);
			border: 1px solid rgba(167, 139, 250, 0.25);
			border-radius: 8px;
			padding: 10px 12px;
			color: var(--purple);
			font-size: 0.9rem;
			font-weight: 600;
			font-family: var(--font-mono, monospace);
		}
		.cc-fee {
			font-size: 0.72rem;
			color: var(--text-dim);
		}
		.cc-btn {
			width: 100%;
			background: linear-gradient(135deg, var(--purple), var(--accent));
			color: var(--text-bright);
			border: none;
			border-radius: 10px;
			padding: 11px 20px;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			transition: opacity 0.15s ease, transform 0.15s ease;
		}
		.cc-btn:hover:not(:disabled) {
			opacity: 0.9;
			transform: translateY(-1px);
		}
		.cc-btn:disabled {
			opacity: 0.45;
			cursor: not-allowed;
		}
		.cc-deposit {
			background: rgba(167, 139, 250, 0.06);
			border: 1px solid rgba(167, 139, 250, 0.15);
			border-radius: 10px;
			padding: 14px;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.cc-deposit-label {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
		}
		.cc-deposit-addr {
			font-family: var(--font-mono, monospace);
			font-size: 0.78rem;
			color: var(--text);
			word-break: break-all;
			background: var(--bg-subtle);
			padding: 8px 10px;
			border-radius: 6px;
			border: 1px solid var(--border);
		}
		.cc-copy-btn {
			align-self: flex-start;
			padding: 4px 12px;
			border-radius: 6px;
			border: 1px solid var(--border);
			background: transparent;
			color: var(--accent);
			font-size: 0.72rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s ease;
		}
		.cc-copy-btn:hover {
			background: rgba(96, 165, 250, 0.1);
			border-color: var(--accent);
		}
		.cc-confirm-section {
			display: flex;
			flex-direction: column;
			gap: 8px;
			margin-top: 6px;
			padding-top: 10px;
			border-top: 1px solid var(--border);
		}
		.cc-confirm-btn {
			background: linear-gradient(135deg, var(--success), #22c55e) !important;
		}
		.cc-status {
			min-height: 16px;
			font-size: 0.8rem;
			color: var(--text-muted);
		}
		.cc-status.success { color: var(--success); }
		.cc-status.error { color: var(--error); }

		@media (max-width: 480px) {
			.swap-panel {
				position: fixed;
				top: auto;
				bottom: 0;
				left: 0;
				right: 0;
				width: 100%;
				max-height: 80vh;
				border-radius: 20px 20px 0 0;
				animation: swapPanelSlideUp 0.25s ease;
			}
			@keyframes swapPanelSlideUp {
				from { opacity: 0; transform: translateY(100%); }
				to { opacity: 1; transform: translateY(0); }
			}
		}

		/* Renewal Card (Overview Tab) */
		.renewal-card {
			background: linear-gradient(135deg, rgba(74, 222, 128, 0.08), rgba(34, 197, 94, 0.05));
			border: 1px solid rgba(74, 222, 128, 0.2);
			padding: 6px 10px 5px;
			margin-top: 0;
		}
		.renewal-card-header {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			margin-bottom: 2px;
			gap: 2px;
		}
		.renewal-top-row,
		.renewal-middle-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
			width: 100%;
		}
		.renewal-middle-row {
			align-items: center;
		}
		.renewal-card-title-row {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 8px;
			width: 100%;
		}
		.renewal-card-title {
			display: inline-flex;
			align-items: center;
			flex-wrap: nowrap;
			gap: 7px;
			color: #86efac;
			font-size: 0.9rem;
			font-weight: 600;
			flex: 0 1 auto;
			min-width: 0;
		}
		.renewal-card-title .renewal-icon-emoji {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			font-size: 15px;
			line-height: 1;
			filter: grayscale(1) saturate(0) brightness(1.55) contrast(0.95);
			opacity: 0.85;
		}
		.renewal-card-title .renewal-title-label {
			flex: 0 0 auto;
		}
		.renewal-card-title .renewal-expiry-date-inline {
			flex-basis: 100%;
			margin-left: 0;
			text-align: left;
		}
		.renewal-date-stepper {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			min-width: 0;
		}
		.renewal-date-stepper .renewal-expiry-date-inline {
			flex-basis: auto;
		}
		.renewal-savings-header {
			margin-left: 0;
			margin-top: 0;
			max-width: none;
			align-self: auto;
		}
		.renewal-header-price {
			flex: 0 0 auto;
			text-align: right;
		}
		.renewal-header-price .renewal-price-usd {
			margin-top: 1px;
		}
		.renewal-price-meta {
			display: flex;
			align-items: baseline;
			gap: 5px;
			font-size: 0.7rem;
			white-space: nowrap;
		}
		.renewal-price-meta .renewal-price-usd {
			margin-left: auto;
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
			color: #ffffff;
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
			gap: 2px;
		}
		.renewal-controls-row {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-top: 2px;
		}
		.renewal-price-meta-row .renewal-countdown-row {
			flex: 0 0 auto;
			font-size: 0.7rem;
			color: #ffffff;
			font-family: var(--font-mono, ui-monospace, monospace);
			white-space: nowrap;
		}
		.renewal-expiry-compact {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.75rem;
			flex-wrap: wrap;
			margin-bottom: 1px;
		}
		.renewal-expiry-compact .renewal-expiry-label {
			color: #d4d4d8;
		}
		.renewal-expiry-compact .renewal-expiry-date {
			color: #ffffff;
			font-weight: 600;
			line-height: 1.05;
		}
		.renewal-price-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 6px 8px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 8px;
			margin-bottom: 2px;
		}
		.renewal-price-label {
			color: #d4d4d8;
			font-size: 0.8rem;
		}
		.renewal-price-values {
			display: grid;
			grid-template-columns: auto auto;
			column-gap: 6px;
			row-gap: 3px;
			align-items: center;
			justify-content: end;
			justify-items: end;
		}
		.renewal-price-values .renewal-savings-header {
			order: 1;
			grid-column: 1 / -1;
			justify-self: end;
		}
		.renewal-price-values .renewal-duration-stepper {
			order: 2;
			grid-column: 1;
			justify-self: start;
			margin-bottom: 0;
		}
		.renewal-price-values .renewal-price-value {
			order: 3;
			grid-column: 2;
			align-self: center;
		}
		.renewal-price-stack {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 1px;
			flex: 0 0 auto;
		}
		.renewal-middle-total {
			text-align: right;
			flex: 0 0 auto;
			align-self: flex-end;
			font-size: 1.3rem;
			line-height: 1.1;
		}
		.renewal-price-meta-row {
			display: flex;
			align-items: baseline;
			justify-content: flex-end;
			gap: 6px;
			white-space: nowrap;
		}
		.renewal-price-stack .renewal-price-usd-row {
			text-align: right;
			font-size: 0.7rem;
			white-space: nowrap;
			opacity: 1;
		}
		.renewal-card .renewal-savings-header,
		.renewal-card .renewal-savings-header #overview-renewal-savings-text,
		.renewal-card .renewal-savings-header #overview-renewal-savings-sui {
			color: #f8fbff;
		}
		.renewal-price-value {
			color: #ffffff;
			font-size: 0.88rem;
			font-weight: 700;
			font-family: var(--font-mono, ui-monospace, monospace);
			line-height: 1.05;
			white-space: nowrap;
		}
		.renewal-price-usd {
			color: #ffffff;
			font-size: 0.7rem;
			font-family: var(--font-mono, ui-monospace, monospace);
			line-height: 1;
			white-space: nowrap;
		}
		.renewal-savings-inline {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			background: linear-gradient(135deg, rgba(248, 251, 255, 0.26), rgba(226, 232, 240, 0.2));
			border: 1px solid rgba(248, 251, 255, 0.58);
			border-radius: 12px;
			padding: 3px 10px;
			font-size: 0.7rem;
			font-weight: 600;
			color: #f8fbff;
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38), 0 1px 5px rgba(148, 163, 184, 0.22);
			white-space: nowrap;
			cursor: pointer;
			transition: background 0.15s, box-shadow 0.15s;
		}
		.renewal-savings-inline:hover {
			background: linear-gradient(135deg, rgba(248, 251, 255, 0.38), rgba(226, 232, 240, 0.32));
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 8px rgba(148, 163, 184, 0.35);
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
			width: fit-content;
		}
		.stepper-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 26px;
			height: 26px;
			background: transparent;
			border: none;
			color: #4ade80;
			font-size: 0.95rem;
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
			min-width: 36px;
			padding: 0 3px;
			color: var(--text);
			font-size: 0.75rem;
			font-weight: 600;
			white-space: nowrap;
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
			border-color: rgba(74, 222, 128, 0.5);
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
			color: #86efac;
			font-size: 0.88rem;
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
			flex: 1;
			min-width: 0;
			background: rgba(74, 222, 128, 0.1);
			border: 1px solid rgba(74, 222, 128, 0.25);
			border-radius: 10px;
			padding: 8px 11px;
			color: #4ade80;
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
			white-space: nowrap;
		}
		.renewal-btn:hover:not(:disabled) {
			background: rgba(74, 222, 128, 0.22);
			border-color: rgba(74, 222, 128, 0.5);
			transform: translateY(-1px);
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
			font-size: 0.72rem;
			color: var(--text-muted);
			min-height: 0;
			margin-top: 1px;
			line-height: 1.25;
		}
		.renewal-status:empty {
			display: none;
		}
		.renewal-status.success {
			color: var(--success);
		}
		.renewal-status.error {
			color: var(--danger);
		}
		.renewal-card .renewal-expiry-compact {
			justify-content: flex-start;
			padding-left: 25px;
		}
		.renewal-card .renewal-expiry-date {
			color: #e4e4e7;
			font-size: 0.7rem;
			font-family: var(--font-mono, ui-monospace, monospace);
			line-height: 1;
			white-space: nowrap;
		}
		.renewal-card .renewal-countdown-row {
			color: #ffffff;
			font-size: 0.68rem;
			white-space: nowrap;
			flex: 0 0 auto;
		}
		.renewal-card .renewal-price-usd-row {
			text-align: right;
			font-size: 0.68rem;
			white-space: nowrap;
		}
		.renewal-card .renewal-price-label {
			color: #d4d4d8;
			font-size: 0.8rem;
		}
		.renewal-card.renewal-disconnected .renewal-controls-row {
			justify-content: stretch;
		}
		.renewal-card.renewal-disconnected .renewal-btn {
			width: 100%;
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
		.nft-card-blackout {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(circle at 22% 18%, rgba(20, 36, 66, 0.38) 0%, rgba(6, 8, 14, 0.06) 38%, rgba(0, 0, 0, 0.88) 100%),
				linear-gradient(160deg, rgba(3, 7, 16, 0.96) 0%, rgba(0, 0, 0, 0.94) 55%, rgba(1, 3, 8, 0.96) 100%);
			z-index: 5;
			transition: opacity 0.3s ease;
		}
		.nft-card-blackout::before {
			content: '';
			position: absolute;
			inset: 0;
			background-image:
				repeating-linear-gradient(135deg, rgba(96, 165, 250, 0.06) 0, rgba(96, 165, 250, 0.06) 2px, transparent 2px, transparent 20px),
				repeating-linear-gradient(-35deg, rgba(148, 163, 184, 0.045) 0, rgba(148, 163, 184, 0.045) 2px, transparent 2px, transparent 26px);
			opacity: 0.58;
		}
		.nft-card-image-wrapper:hover .nft-card-blackout {
			opacity: 0.62;
		}
		.nft-card-name-trace {
			position: absolute;
			top: 10px;
			left: 12px;
			z-index: 9;
			display: flex;
			align-items: baseline;
			gap: 1px;
			pointer-events: none;
			font-size: clamp(1.4rem, 2.8vw, 2rem);
			font-weight: 800;
			line-height: 1;
		}
		.nft-card-name-at {
			color: #60a5fa;
			-webkit-text-stroke: 1.05px rgba(191, 229, 255, 0.72);
			text-shadow:
				0 0 10px rgba(96, 165, 250, 0.45),
				0 0 18px rgba(59, 130, 246, 0.26);
		}
		.nft-card-name-handle {
			max-width: 140px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			-webkit-text-stroke: 0.85px rgba(226, 232, 240, 0.62);
			background: linear-gradient(120deg, #86efac 0%, #facc15 58%, #fb7185 100%);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
			text-shadow:
				0 0 8px rgba(0, 0, 0, 0.8),
				0 0 16px rgba(0, 0, 0, 0.45);
		}
		.nft-card-overlay-tags {
			position: absolute;
			top: 44px;
			left: 12px;
			display: flex;
			align-items: center;
			gap: 6px;
			z-index: 9;
			pointer-events: none;
		}
		.nft-card-overlay-tag {
			display: inline-flex;
			align-items: center;
			padding: 2px 8px;
			border-radius: 999px;
			background: rgba(15, 22, 36, 0.7);
			border: 1px solid rgba(148, 163, 184, 0.45);
			color: rgba(226, 232, 240, 0.95);
			font-size: 0.64rem;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			backdrop-filter: blur(5px);
		}
		.nft-card-overlay-tag.warning {
			border-color: rgba(251, 191, 36, 0.7);
			background: rgba(146, 64, 14, 0.3);
			color: #fef3c7;
		}
		.nft-card-overlay-tag.expired {
			border-color: rgba(248, 113, 113, 0.72);
			background: rgba(127, 29, 29, 0.34);
			color: #fecaca;
		}
		.nft-card-overlay-date {
			position: absolute;
			right: 12px;
			bottom: 10px;
			z-index: 9;
			pointer-events: none;
			font-size: 0.74rem;
			font-weight: 700;
			color: rgba(226, 232, 240, 0.96);
			text-shadow:
				0 0 0 rgba(0, 0, 0, 0.9),
				0 1px 2px rgba(0, 0, 0, 0.95),
				0 0 8px rgba(0, 0, 0, 0.62);
		}
		.nft-card-qr-tag {
			position: absolute;
			bottom: 10px;
			left: 10px;
			width: 32px;
			height: 32px;
			background: rgba(0, 0, 0, 0.8);
			border: 1.5px solid #60a5fa;
			border-radius: 6px;
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 10;
			backdrop-filter: blur(4px);
		}
		.nft-card-qr-tag svg {
			width: 20px;
			height: 20px;
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
		.nft-card-expiry.royalty {
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
				padding: 10px 16px;
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.10), rgba(167, 139, 250, 0.08));
			border: 1px solid rgba(96, 165, 250, 0.28);
			border-radius: 10px;
			cursor: pointer;
			transition: all 0.25s ease;
				color: var(--text);
				font-size: 0.84rem;
				font-weight: 600;
				flex: 0 1 auto;
				width: clamp(170px, 22vw, 260px);
				min-width: 170px;
				max-width: 260px;
				justify-content: flex-start;
			}
			.search-btn span {
				min-width: 0;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			@media (max-width: 1200px) {
				.search-btn {
					width: clamp(150px, 20vw, 220px);
					min-width: 150px;
					max-width: 220px;
					padding: 10px 12px;
				}
			}
			.search-btn:hover {
				border-color: rgba(96, 165, 250, 0.45);
				background: linear-gradient(135deg, rgba(96, 165, 250, 0.16), rgba(167, 139, 250, 0.12));
			color: #60a5fa;
			box-shadow: 0 0 24px rgba(96, 165, 250, 0.12);
		}
		.search-btn svg {
			width: 16px;
			height: 16px;
			opacity: 0.9;
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
		.wallet-home-btn {
			width: 36px;
			height: 36px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			border-radius: 10px;
			border: 1px solid rgba(96, 165, 250, 0.3);
			background: rgba(12, 16, 28, 0.85);
			text-decoration: none;
			transition: all 0.2s ease;
			flex-shrink: 0;
		}
		.wallet-home-btn:hover {
			background: rgba(18, 24, 40, 0.95);
			border-color: rgba(96, 165, 250, 0.5);
			box-shadow: 0 0 18px rgba(96, 165, 250, 0.18);
			transform: translateY(-1px);
		}
		.wallet-home-btn svg {
			width: 18px;
			height: 18px;
		}
		@media (max-width: 600px) {
			.search-btn kbd { display: none; }
			.search-btn {
				min-width: 0;
				padding: 10px 12px;
				font-size: 0.8rem;
			}
			.search-btn span {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
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
			justify-content: flex-start;
			gap: 8px;
			margin-bottom: 10px;
			flex-wrap: wrap;
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
			color: #93c5fd;
			font-weight: 600;
			background: rgba(59, 130, 246, 0.15);
			padding: 3px 10px;
			border-radius: 10px;
			border: 1px solid rgba(59, 130, 246, 0.35);
		}
		.linked-renewal-cost {
			display: none;
			margin-left: auto;
			font-size: 0.65rem;
			font-weight: 600;
			color: #fca5a5;
			background: rgba(239, 68, 68, 0.12);
			padding: 3px 10px;
			border-radius: 10px;
			border: 1px solid rgba(239, 68, 68, 0.3);
			white-space: nowrap;
		}
		.linked-renewal-savings {
			display: none;
			font-size: 0.65rem;
			font-weight: 600;
			color: #4ade80;
			background: rgba(74, 222, 128, 0.1);
			padding: 3px 10px;
			border-radius: 10px;
			border: 1px solid rgba(74, 222, 128, 0.25);
			white-space: nowrap;
		}
		.linked-names-list {
			display: flex;
			flex-direction: column;
			gap: 10px;
			flex: 0 0 auto;
			overflow: visible;
			min-height: 0;
		}
		.linked-names-loading {
			display: flex;
			align-items: center;
			gap: 8px;
			color: var(--text-muted);
			font-size: 0.75rem;
			padding: 8px 0;
		}
		.linked-collapse-all {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			margin-right: 2px;
			padding: 2px;
			background: none;
			border: none;
			color: #f8fbff;
			cursor: pointer;
			opacity: 0.7;
			transition: opacity 0.15s;
		}
		.linked-collapse-all:hover {
			opacity: 1;
		}
		.linked-collapse-all svg {
			width: 16px;
			height: 16px;
		}
		/* Grouped layout */
		.linked-group {
			background: rgba(0, 0, 0, 0.1);
			border-radius: 8px;
			padding: 8px;
		}
		.linked-group.collapsed {
			background: transparent;
			padding: 0;
		}
		.linked-group-header {
			display: flex;
			align-items: center;
			gap: 8px;
			width: calc(100% + 16px);
			padding: 6px 10px;
			margin: -8px -8px 6px -8px;
			background: linear-gradient(135deg, rgba(248, 251, 255, 0.26), rgba(226, 232, 240, 0.2));
			border: 1px solid rgba(248, 251, 255, 0.58);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38), 0 1px 5px rgba(148, 163, 184, 0.22);
			border-radius: 6px 6px 0 0;
			cursor: pointer;
			font-family: inherit;
			color: #f8fbff;
			transition: background 0.15s ease;
		}
		.linked-group-header:hover {
			background: rgba(248, 251, 255, 0.12);
		}
		.linked-group-chevron {
			width: 16px;
			height: 16px;
			color: #f8fbff;
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
			margin: 0;
			width: 100%;
			border-radius: 8px;
		}
		.linked-group-addr {
			font-size: 0.65rem;
			font-family: var(--font-mono, monospace);
			color: #f8fbff;
		}
		.linked-group-count {
			font-size: 0.6rem;
			font-weight: 600;
			color: #f8fbff;
			background: rgba(248, 251, 255, 0.18);
			padding: 1px 6px;
			margin-left: auto;
			border-radius: 8px;
		}
		.linked-name-chip {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 5px 8px 5px 11px;
			background: rgba(15, 23, 42, 0.68);
			border: 1px solid rgba(148, 163, 184, 0.34);
			border-radius: 6px;
			font-size: 0.79rem;
			line-height: 1.2;
			font-family: inherit;
			font-weight: 620;
			color: #e2e8f0;
			text-decoration: none;
			cursor: pointer;
			transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
		}
		.linked-name-chip:hover {
			background: rgba(15, 23, 42, 0.92);
			border-color: rgba(167, 139, 250, 0.5);
			box-shadow: 0 6px 16px rgba(2, 6, 23, 0.42);
			transform: translateY(-1px);
		}
		.linked-name-chip.previewing {
			background: linear-gradient(135deg, rgba(76, 29, 149, 0.68), rgba(59, 130, 246, 0.5));
			border-color: rgba(147, 197, 253, 0.9);
			box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.55), 0 10px 24px rgba(59, 130, 246, 0.34);
			transform: translateY(-2px) scale(1.01);
		}
		.linked-name-chip.previewing .linked-name-text {
			color: #f8fbff;
		}
		.linked-name-chip.previewing .linked-name-price {
			color: #d8b4fe;
		}
		.linked-name-chip.current {
			background: linear-gradient(135deg, rgba(248, 251, 255, 0.26), rgba(226, 232, 240, 0.2));
			border-color: rgba(248, 251, 255, 0.58);
			font-weight: 600;
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38), 0 1px 5px rgba(148, 163, 184, 0.22);
		}
		.linked-name-chip.current:hover {
			background: linear-gradient(135deg, rgba(248, 251, 255, 0.38), rgba(226, 232, 240, 0.32));
			border-color: rgba(248, 251, 255, 0.72);
			box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 1px 8px rgba(148, 163, 184, 0.35);
		}
		.linked-name-chip.current .linked-name-text {
			color: #f8fbff;
		}
		/* Primary name highlighting */
		.linked-name-chip.primary {
			background: linear-gradient(135deg, rgba(120, 53, 15, 0.34), rgba(180, 83, 9, 0.24));
			border-color: rgba(250, 204, 21, 0.4);
		}
		.linked-name-chip.primary .linked-name-text {
			color: #fde68a;
			font-weight: 600;
		}
			.linked-name-chip.primary .primary-icon {
				width: 12px;
				height: 12px;
				color: #fbbf24;
				fill: rgba(250, 204, 21, 0.3);
			}
			.linked-name-chip.listed {
				background: linear-gradient(135deg, rgba(107, 33, 168, 0.4), rgba(76, 29, 149, 0.28));
				border-color: rgba(168, 85, 247, 0.6);
			}
			.linked-name-chip.listed .linked-name-text {
				color: #e9d5ff;
			}
			.linked-name-chip.listed .linked-name-sep {
				color: rgba(192, 132, 252, 0.6);
				margin: 0 -2px 0 0;
			}
			.linked-name-chip.listed .linked-name-price {
				color: #e9d5ff;
				font-weight: 600;
				font-size: 0.95em;
				display: inline-flex;
				align-items: center;
				gap: 2px;
			}
			.linked-name-chip.listed .linked-name-price .sui-price-icon {
				width: 14px;
				height: 14px;
				flex-shrink: 0;
				object-fit: contain;
				margin: 0;
				padding: 0;
			}
			.linked-name-chip.primary .linked-name-sep {
				color: rgba(250, 204, 21, 0.5);
				margin: 0 -2px 0 0;
			}
			.linked-name-chip.primary .linked-name-price {
				color: #fef08a;
				font-weight: 600;
				font-size: 0.95em;
				display: inline-flex;
				align-items: center;
				gap: 2px;
			}
			.linked-name-chip.primary .linked-name-price .sui-price-icon {
				width: 14px;
				height: 14px;
				flex-shrink: 0;
				object-fit: contain;
				margin: 0;
				padding: 0;
			}
			.linked-name-chip.blue {
				background: linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(99, 102, 241, 0.18));
				border-color: rgba(96, 165, 250, 0.5);
			}
			.linked-name-chip.blue .linked-name-text {
				color: #bfdbfe;
			}
			.linked-name-chip.white {
				background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(226, 232, 240, 0.1));
				border-color: rgba(255, 255, 255, 0.45);
			}
			.linked-name-chip.white .linked-name-text {
				color: #f1f5f9;
			}
			.linked-name-chip.expired {
				background: linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.18));
				border-color: rgba(248, 113, 113, 0.5);
			}
			.linked-name-chip.expired .linked-name-text {
				color: #fca5a5;
			}
			.linked-name-chip svg {
				width: 10px;
				height: 10px;
			}
		.linked-name-text {
			color: #f8fafc;
			text-decoration: none;
			cursor: pointer;
			transition: color 0.15s ease;
		}
		.linked-name-text:hover {
			color: #e9d5ff;
			text-decoration: none;
		}
		.linked-name-chip .linked-name-text {
			flex: 1;
			letter-spacing: 0.01em;
			font-weight: 640;
		}
		.linked-name-suffix {
			opacity: 0.58;
			font-size: 0.66em;
			margin-left: 1px;
		}
		.linked-name-hover-card {
			position: fixed;
			z-index: 120;
			display: none;
			flex-direction: column;
			gap: 8px;
			width: min(300px, calc(100vw - 24px));
			padding: 10px;
			border-radius: 10px;
			border: 1px solid rgba(139, 92, 246, 0.35);
			background: linear-gradient(135deg, rgba(13, 10, 28, 0.98), rgba(8, 10, 24, 0.98));
			box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(139, 92, 246, 0.12);
			pointer-events: none;
			opacity: 0;
			transform: translateY(4px);
			transition: opacity 0.14s ease, transform 0.14s ease;
		}
		.linked-name-hover-card.active {
			opacity: 1;
			transform: translateY(0);
		}
		.linked-name-hover-header {
			display: flex;
			align-items: baseline;
			justify-content: flex-end;
			gap: 8px;
		}
		.linked-name-hover-listing {
			font-size: 0.66rem;
			color: #93c5fd;
			font-weight: 600;
			text-align: right;
			white-space: nowrap;
		}
		.linked-name-hover-preview {
			display: block;
			align-items: stretch;
		}
		.linked-name-hover-image-wrap {
			position: relative;
			border-radius: 8px;
			overflow: hidden;
			border: 1px solid rgba(148, 163, 184, 0.2);
			background: rgba(2, 6, 23, 0.55);
			min-height: 116px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.linked-name-hover-image-wrap img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			display: block;
		}
		.linked-name-hover-info {
			display: flex;
			justify-content: space-between;
			gap: 10px;
			font-size: 0.64rem;
			color: var(--text-muted);
			font-family: var(--font-mono, ui-monospace, monospace);
		}
		.linked-name-tag {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			font-size: 0.64rem;
			font-weight: 760;
			padding: 3px 7px;
			border-radius: 8px;
			text-transform: uppercase;
			letter-spacing: 0.03em;
			font-variant-numeric: tabular-nums;
			line-height: 1;
		}
		.linked-name-tag.with-icon {
			gap: 3px;
		}
		.linked-name-tag-icon {
			width: 0.78rem;
			height: 0.78rem;
			flex: 0 0 auto;
			color: #60a5fa;
		}
		.linked-name-tag.blue {
			background: rgba(59, 130, 246, 0.2);
			color: #60a5fa;
		}
		.linked-name-tag.white {
			background: rgba(255, 255, 255, 0.15);
			color: #e2e8f0;
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
		.linked-name-tag.purple {
			background: linear-gradient(135deg, rgba(88, 28, 135, 0.52), rgba(124, 58, 237, 0.38));
			color: #e9d5ff;
			border: 1px solid rgba(167, 139, 250, 0.45);
		}
		.linked-name-tag.purple .linked-name-tag-icon {
			color: #7dd3fc;
			filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.38));
		}
		.linked-names-empty {
			color: var(--text-muted);
			font-size: 0.75rem;
			font-style: italic;
			padding: 8px 0;
		}
		.linked-names-sort {
			display: flex;
			align-items: center;
			gap: 4px;
			margin-bottom: 8px;
		}
		.linked-names-filter {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-bottom: 8px;
		}
		.linked-names-filter-input {
			flex: 1 1 auto;
			min-width: 120px;
			background: rgba(0, 0, 0, 0.2);
			border: 1px solid rgba(139, 92, 246, 0.2);
			border-radius: 8px;
			padding: 7px 10px;
			font-size: 0.7rem;
			color: var(--text);
			outline: none;
			transition: border-color 0.15s ease, box-shadow 0.15s ease;
		}
		.linked-names-filter-input::placeholder {
			color: var(--text-dim);
		}
		.linked-names-filter-input:focus {
			border-color: rgba(139, 92, 246, 0.45);
			box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.18);
		}
		.linked-filter-clear {
			flex: 0 0 auto;
			padding: 6px 9px;
			font-size: 0.62rem;
			font-weight: 600;
			color: var(--text-muted);
			background: rgba(0, 0, 0, 0.2);
			border: 1px solid rgba(139, 92, 246, 0.15);
			border-radius: 8px;
			cursor: pointer;
			transition: all 0.15s ease;
		}
		.linked-filter-clear:hover {
			color: var(--text);
			background: rgba(139, 92, 246, 0.12);
			border-color: rgba(139, 92, 246, 0.3);
		}
		.linked-sort-pill {
			display: inline-flex;
			align-items: center;
			gap: 3px;
			padding: 3px 8px;
			font-size: 0.6rem;
			font-weight: 600;
			font-family: inherit;
			color: var(--text-muted);
			background: rgba(0, 0, 0, 0.2);
			border: 1px solid transparent;
			border-radius: 10px;
			cursor: pointer;
			transition: all 0.15s ease;
			white-space: nowrap;
		}
		.linked-sort-pill:hover {
			color: var(--text);
			background: rgba(139, 92, 246, 0.1);
		}
		.linked-sort-pill.active {
			color: var(--accent);
			background: rgba(139, 92, 246, 0.15);
			border-color: rgba(139, 92, 246, 0.3);
		}
		.linked-sort-pill svg {
			width: 10px;
			height: 10px;
		}
		.linked-name-price {
			font-size: 0.55rem;
			font-weight: 600;
			color: #60a5fa;
			margin-left: auto;
			white-space: nowrap;
		}
		.linked-name-price.listed {
			color: #c084fc;
		}
		.linked-name-chip.dimmed {
			opacity: 0.58;
			filter: saturate(0.72);
			border-color: rgba(148, 163, 184, 0.18);
		}
		.linked-name-chip.dimmed .linked-name-text {
			color: var(--text-dim);
		}
		.linked-name-chip.dimmed .linked-name-tag {
			opacity: 0.75;
		}
		.linked-names-hint {
			font-size: 0.65rem;
			color: var(--text-dim);
			text-align: center;
			margin-top: 8px;
			padding-top: 8px;
			border-top: 1px solid rgba(139, 92, 246, 0.1);
		}
		/* Renewal card standalone */
		.renewal-card {
			margin-bottom: 16px;
		}
		.renewal-name-value {
			color: #4ade80;
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
		@media (max-width: 860px) {
			.page-layout { flex-direction: column; }
			.overview-primary-row {
				grid-template-columns: 1fr;
				grid-template-areas: none;
				gap: 6px;
			}
			.overview-primary-row > * {
				min-width: 0;
			}
			.identity-card {
				grid-area: auto;
				width: 100%;
				max-width: var(--overview-side-rail-width);
				margin: 0 auto;
				order: 0;
			}
			.hero-main,
			.side-rail-module,
			.linked-wide-module {
				grid-column: 1 / -1;
				width: 100%;
			}
			.hero-main {
				grid-area: auto;
				order: 1;
			}
			.side-rail-module {
				order: 2;
				flex-direction: row;
				align-items: flex-start;
			}
			.side-rail-module > * {
				flex: 1;
				min-width: 0;
			}
			.linked-wide-module {
				order: 3;
			}
			.links {
				grid-column: 1 / -1;
				order: 4;
			}
		}

		@media (min-width: 601px) and (max-width: 860px) {
			.overview-primary-row {
				gap: 10px;
			}
			.identity-card {
				justify-self: start;
			}
			.side-rail-module {
				display: grid;
				grid-template-columns: repeat(2, minmax(0, 1fr));
				gap: 10px;
				align-items: stretch;
			}
			.side-rail-module > * {
				width: 100%;
				max-width: 100%;
				min-width: 0;
			}
			.side-rail-module > :only-child {
				grid-column: 1 / -1;
			}
			.renewal-card,
			.marketplace-card {
				width: 100%;
				max-width: 100%;
			}
			.links a,
			.subscribe-btn {
				flex: 1 1 calc(50% - 12px);
				justify-content: center;
			}
		}

		@media (max-width: 600px) {
			body { padding: 16px 12px; }
			.card { padding: 18px; border-radius: 12px; margin-bottom: 14px; }

			.overview-primary-row {
				grid-template-columns: 1fr;
				gap: 8px;
			}
			.identity-card {
				grid-column: 1 / -1;
				grid-row: auto;
				justify-self: center;
				order: 0;
				width: min(100%, 300px);
				max-width: calc(100vw - 24px);
			}
			.hero-main {
				grid-column: 1 / -1;
				width: 100%;
				order: 1;
				display: flex;
				flex-direction: column;
			}
			.hero-main .header {
				order: 0;
			}
			.hero-main .wallet-bar {
				order: 1;
			}
			.hero-main .linked-owner-row {
				order: 2;
			}
			.side-rail-module {
				display: flex;
				grid-template-columns: none;
				flex-direction: column;
				grid-column: 1 / -1;
				order: 2;
				gap: 8px;
				width: 100%;
				max-width: 100%;
			}
			.side-rail-module > * {
				flex: none;
				width: 100%;
				max-width: 100%;
				min-width: 0;
			}
			.side-rail-module > .renewal-module { order: 0; }
			.side-rail-module > .side-rail-market { order: 1; }
			.side-rail-module > .linked-controls-module {
				order: 2;
				align-self: auto;
			}
			.renewal-module,
			.side-rail-market {
				width: 100%;
				max-width: 100%;
			}
			.renewal-card,
			.marketplace-card {
				width: 100%;
				max-width: 100%;
			}
			.linked-wide-module {
				grid-column: 1 / -1;
				order: 3;
				width: 100%;
			}
			.linked-controls-module {
				width: 100%;
				max-width: 100%;
			}
			.links {
				grid-column: 1 / -1;
				order: 4;
				width: 100%;
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 8px;
			}
			.links a,
			.links .subscribe-btn {
				padding: 10px 12px;
				font-size: 0.75rem;
				justify-content: center;
			}

			.wallet-bar {
				flex-wrap: wrap;
				gap: 8px;
				margin-bottom: 10px;
			}
			.wallet-bar .connect-btn {
				padding: 10px 16px;
				font-size: 0.8rem;
			}

			.header {
				margin-bottom: 10px;
				padding-bottom: 10px;
			}
			.header-top { gap: 8px; }
			.target-meta-item { width: 100%; }
			h1 { font-size: 1.35rem; }
			.badge { font-size: 0.6rem; padding: 4px 10px; }
			.header-top-expiry-date { font-size: 0.62rem; padding: 4px 8px; }
			.header-meta {
				gap: 8px;
				font-size: 0.75rem;
			}
			.header-meta-item { gap: 6px; }
			.header-meta-item svg { width: 14px; height: 14px; }

			.linked-owner-row,
			.linked-controls-module {
				width: 100%;
				max-width: 100%;
			}
			.linked-owner-row {
				margin-top: 2px;
			}
			.owner-display { gap: 8px; padding: 8px 10px; }
			.owner-info { gap: 4px; font-size: 0.8rem; }
			.owner-label { font-size: 0.7rem; }
			.owner-name { font-size: 0.78rem; }
			.owner-addr { font-size: 0.65rem; }
			.owner-actions { flex-shrink: 0; }
			.identity-name { font-size: 0.62rem; padding: 6px 7px; }

			.section { padding: 18px; border-radius: 12px; margin-bottom: 16px; }
			.profile-grid { gap: 10px; }
			.profile-item { padding: 12px; }

			.renewal-card .renewal-price-value {
				font-size: 1.05rem;
			}
			.renewal-card .renewal-countdown-row,
			.renewal-card .renewal-price-usd-row {
				font-size: 0.64rem;
			}
			.renewal-card .renewal-duration-stepper {
				border-radius: 7px;
			}
			.renewal-card .stepper-btn {
				width: 24px;
				height: 24px;
				font-size: 0.9rem;
			}
			.renewal-card .stepper-value {
				min-width: 34px;
				font-size: 0.7rem;
				padding: 0 2px;
				white-space: nowrap;
			}
			.side-rail-module {
				flex-direction: column;
			}

			.grace-period-card {
				grid-column: 1 / -1;
				max-width: 100%;
			}
			.target-preview-value {
				max-width: 120px;
			}
			.target-meta-item .target-preview {
				max-width: 180px;
			}

			.nft-viewer-content { max-width: 280px; padding: 16px; }
			.nft-viewer-actions { flex-direction: column; }
			.nft-viewer-btn { justify-content: center; }
			.edit-modal-content { margin: 12px; padding: 18px; }
			.send-modal-content { margin: 12px; padding: 18px; }
			.jacket-modal-content { margin: 12px; padding: 18px; }
		}

		@media (max-width: 380px) {
			body { padding: 12px; }
			.card { padding: 14px; margin-bottom: 10px; }
			h1 { font-size: 1.2rem; }
			.renewal-card .renewal-price-value {
				font-size: 0.95rem;
			}
			.renewal-card .renewal-countdown-row,
			.renewal-card .renewal-price-usd-row {
				font-size: 0.6rem;
			}
			.renewal-card .stepper-btn {
				width: 22px;
				height: 22px;
				font-size: 0.85rem;
			}
			.renewal-card .stepper-value {
				min-width: 30px;
				font-size: 0.65rem;
			}
			.identity-name { font-size: 0.58rem; padding: 5px 6px; }
			.identity-action-btn { width: 24px; height: 24px; }
			.identity-action-btn svg { width: 12px; height: 12px; }
			.identity-name-wrapper { flex-wrap: nowrap; gap: 4px; }
			.ai-generate-btn { width: 24px; height: 24px; }
			.ai-generate-btn svg { width: 14px; height: 14px; }
			.links {
				grid-template-columns: 1fr;
			}
			.links a,
			.links .subscribe-btn {
				padding: 10px;
				font-size: 0.72rem;
			}
			.target-preview-value {
				max-width: 100px;
			}
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

		/* Footer tracker docs links */
		#crypto-tracker .tracker-line {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			flex-wrap: nowrap;
			white-space: nowrap;
			max-width: 100%;
			min-width: 0;
		}
		#crypto-tracker .tracker-built-on {
			display: inline-flex;
			align-items: center;
			flex-wrap: nowrap;
			justify-content: center;
			gap: 6px;
			color: var(--text-muted);
			font-weight: 500;
			white-space: nowrap;
			min-width: 0;
		}
		#crypto-tracker .tracker-built-on a {
			color: var(--accent);
			text-decoration: none;
			font-weight: 600;
		}
		#crypto-tracker .tracker-built-on a:hover {
			text-decoration: underline;
		}
		#crypto-tracker .tracker-sep {
			color: var(--text-dim);
		}
/* Keep the fixed bottom footer compact on phones */
@media (max-width: 600px) {
	body {
		padding-bottom: 56px;
	}
	#crypto-tracker {
		flex-direction: row !important;
		align-items: center !important;
		justify-content: center !important;
		gap: 0 !important;
		height: 36px !important;
		min-height: 36px !important;
		max-height: 36px !important;
		padding: 0 12px !important;
		font-size: 0.72rem !important;
		line-height: 1 !important;
		left: 0 !important;
		right: 0 !important;
		width: 100% !important;
		max-width: 100vw !important;
		overflow: hidden;
	}
	#crypto-tracker .tracker-line {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 0;
		width: auto;
		max-width: 100%;
	}
	#crypto-tracker .tracker-line > .tracker-sep,
	#crypto-tracker .tracker-built-on {
		display: none !important;
	}
}
@media (max-width: 380px) {
	body {
		padding-bottom: 52px;
	}
	#crypto-tracker {
		height: 34px !important;
		min-height: 34px !important;
		max-height: 34px !important;
		padding: 0 10px !important;
		font-size: 0.68rem !important;
	}
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
