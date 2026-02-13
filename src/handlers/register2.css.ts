export const registerStyles = `
	:root {
		--bg-void: #000;
		--bg-dark: #000;
		--card-bg: rgba(12, 12, 18, 0.95);
		--card-bg-solid: #0c0c12;
		--border: rgba(255, 255, 255, 0.06);
		--border-strong: rgba(255, 255, 255, 0.12);
		--glass-border: rgba(255, 255, 255, 0.08);
		--text: #e4e4e7;
		--text-bright: #f4f4f5;
		--text-muted: #71717a;
		--text-dim: #52525b;
		--accent: #60a5fa;
		--accent-bright: #93c5fd;
		--accent-light: rgba(96, 165, 250, 0.12);
		--accent-glow: rgba(96, 165, 250, 0.3);
		--purple: #a78bfa;
		--purple-glow: rgba(167, 139, 250, 0.2);
		--success: #34d399;
		--success-light: rgba(52, 211, 153, 0.12);
		--warning: #fbbf24;
		--warning-light: rgba(251, 191, 36, 0.12);
		--error: #f87171;
		--error-light: rgba(248, 113, 113, 0.12);
		--shadow: 0 4px 24px rgba(0, 0, 0, 0.6), 0 1px 4px rgba(0, 0, 0, 0.4);
		--shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.5);
		--shadow-glow: 0 0 40px rgba(96, 165, 250, 0.08);
		--spotlight-color: rgba(96, 165, 250, 0.02);
		--ski-green: #00a651;
		--ski-green-dark: #008744;
		--ski-green-light: #82e2b3;
		--ski-green-soft: #bff4d8;
		--ski-green-rgb: 0, 166, 81;
	}

	/* Reset & Scrollbar */
	* { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: #60a5fa var(--bg-void); }
	*::-webkit-scrollbar { width: 5px; height: 5px; }
	*::-webkit-scrollbar-track { background: var(--bg-void); }
	*::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #60a5fa, #a78bfa); border-radius: 3px; }
	*::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #7ab8ff, #b99cff); }

	/* Body & Atmosphere */
	body {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		min-height: 100vh;
		background: var(--bg-void);
		color: var(--text);
		padding: 20px;
		padding-bottom: 82px;
		position: relative;
		overflow-x: hidden;
	}
	body::before {
		content: '';
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 40%;
		background:
			linear-gradient(165deg, transparent 42%, rgba(var(--ski-green-rgb), 0.04) 43%, rgba(var(--ski-green-rgb), 0.02) 60%, transparent 61%),
			linear-gradient(195deg, transparent 38%, rgba(96, 165, 250, 0.03) 39%, rgba(96, 165, 250, 0.015) 55%, transparent 56%);
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
		background: linear-gradient(90deg, transparent 0%, rgba(var(--ski-green-rgb), 0.15) 30%, rgba(200, 220, 240, 0.25) 50%, rgba(var(--ski-green-rgb), 0.15) 70%, transparent 100%);
		pointer-events: none;
		z-index: 1;
	}
	.snow-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 0;
	}

	/* Layout */
	.container {
		max-width: 1180px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
		position: relative;
		z-index: 1;
	}
	.layout-grid {
		display: grid;
		grid-template-columns: 480px 1fr;
		gap: 12px;
		align-items: start;
	}
	.main-column {
		display: grid;
		gap: 12px;
	}
	.side-column {
		display: grid;
		gap: 10px;
	}

	/* Cards (shared base) */
	.card {
		background: var(--card-bg);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 18px;
		box-shadow: var(--shadow-lg), var(--shadow-glow);
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
	.side-card {
		background: var(--card-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 12px;
		box-shadow: var(--shadow);
		transition: border-color 0.25s ease, box-shadow 0.25s ease;
	}
	.side-card:hover {
		border-color: var(--border-strong);
		box-shadow: var(--shadow-lg);
	}

	/* Nav */
	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
	}
	.nav-home {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 800;
		color: var(--text);
		text-decoration: none;
	}
	.nav-meta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.badge {
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: linear-gradient(135deg, rgba(var(--ski-green-rgb), 0.18), rgba(96, 165, 250, 0.14));
		border: 1px solid rgba(var(--ski-green-rgb), 0.35);
		color: var(--ski-green-light);
	}

	/* Header & Name */
	.header h1 {
		font-size: clamp(1.8rem, 3.7vw, 2.6rem);
		font-weight: 800;
		overflow-wrap: anywhere;
		letter-spacing: -0.03em;
	}
	.name-heading {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.name-title { color: var(--text-bright); }
	.name-tld {
		background: linear-gradient(135deg, var(--ski-green-light), #60a5fa, var(--ski-green-light));
		background-size: 200% auto;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		animation: gradient-shift 3s ease infinite;
	}

	/* Primary Star */
	.primary-star {
		width: 34px;
		height: 34px;
		border-radius: 999px;
		border: 1px solid rgba(148, 163, 184, 0.42);
		background: rgba(148, 163, 184, 0.09);
		color: rgba(148, 163, 184, 0.9);
		font-size: 1.2rem;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: transform 0.12s ease, background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
	}
	.primary-star:hover {
		transform: translateY(-1px);
		background: rgba(148, 163, 184, 0.16);
		border-color: rgba(148, 163, 184, 0.55);
	}
	.primary-star.active {
		color: #ffd700;
		background: rgba(255, 215, 0, 0.2);
		border-color: rgba(255, 215, 0, 0.8);
		box-shadow: 0 0 14px rgba(255, 215, 0, 0.22);
	}

	/* Subtitle & Availability */
	.subtitle {
		margin-top: 8px;
		font-size: 0.95rem;
		color: var(--text-muted);
	}
	.availability-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		border: 1px solid rgba(52, 211, 153, 0.42);
		background: var(--success-light);
	}
	.availability-dot {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: var(--ski-green);
		box-shadow: 0 0 10px rgba(var(--ski-green-rgb), 0.6), 0 0 20px rgba(var(--ski-green-rgb), 0.3);
		flex-shrink: 0;
	}
	.availability-label {
		color: var(--success);
		font-size: 0.84rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	/* Pricing */
	.top-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 14px;
		align-items: end;
		margin-top: 12px;
	}
	.price {
		font-size: clamp(1.65rem, 3.8vw, 2.2rem);
		font-weight: 800;
	}
	.price-unit {
		display: inline-flex;
		align-items: center;
		vertical-align: baseline;
		margin-left: 6px;
	}
	.price-unit .sui-icon { width: 0.55em; height: auto; }
	.price-usd {
		color: var(--text-muted);
		font-size: 0.5em;
		font-weight: 600;
		letter-spacing: 0.01em;
		margin-left: 10px;
		white-space: nowrap;
	}
	.price-decimals {
		font-size: 0.56em;
		font-weight: 700;
		opacity: 0.9;
		margin-left: 2px;
	}
	.price-note {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.price-note .sui-icon { width: 0.75em; height: auto; vertical-align: -0.08em; }
	.price-note.discount {
		display: inline-block;
		margin-top: 8px;
		padding: 4px 12px;
		border-radius: 999px;
		border: 1px solid rgba(52, 211, 153, 0.36);
		background: var(--success-light);
		color: var(--success);
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: none;
	}

	/* Form Controls */
	.form {
		margin-top: 12px;
		display: grid;
		gap: 8px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}
	input, select {
		width: 100%;
		padding: 9px 11px;
		border-radius: 9px;
		border: 1px solid var(--border-strong);
		background: var(--card-bg-solid);
		color: var(--text);
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}
	input:focus, select:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-glow);
	}
	input::placeholder { color: var(--text-dim); }
	.year-stepper {
		display: grid;
		grid-template-columns: 38px 1fr 38px;
		align-items: center;
		gap: 8px;
		padding: 6px;
		border-radius: 11px;
		border: 1px solid rgba(96, 165, 250, 0.25);
		background: var(--card-bg-solid);
	}
	.year-btn {
		width: 100%;
		height: 34px;
		border-radius: 9px;
		border: 1px solid rgba(96, 165, 250, 0.35);
		background: var(--accent-light);
		color: var(--accent-bright);
		font-size: 1.08rem;
		font-weight: 800;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.year-btn:hover { background: rgba(96, 165, 250, 0.2); }
	.year-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.year-display {
		text-align: center;
		font-size: 0.92rem;
		font-weight: 700;
		color: var(--text);
	}

	/* Register Button (green CTA) */
	.button {
		margin-top: 4px;
		width: 100%;
		padding: 12px 14px;
		border-radius: 999px;
		border: 1px solid rgba(var(--ski-green-rgb), 0.58);
		background: linear-gradient(135deg, rgba(14, 56, 36, 0.95), rgba(8, 42, 27, 0.96));
		box-shadow: inset 0 1px 0 rgba(var(--ski-green-rgb), 0.24), 0 0 0 1px rgba(var(--ski-green-rgb), 0.18);
		color: var(--ski-green-light);
		font-weight: 800;
		font-size: 0.94rem;
		cursor: pointer;
		transition: all 0.25s ease;
	}
	.button .sui-icon { width: 0.85em; height: auto; vertical-align: -0.1em; }
	.button:hover {
		background: linear-gradient(135deg, rgba(16, 67, 42, 0.96), rgba(9, 50, 31, 0.98));
		transform: translateY(-1px);
		box-shadow: inset 0 1px 0 rgba(var(--ski-green-rgb), 0.24), 0 0 0 1px rgba(var(--ski-green-rgb), 0.18), 0 4px 20px rgba(var(--ski-green-rgb), 0.25), 0 0 40px rgba(var(--ski-green-rgb), 0.1);
	}
	.button:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

	/* Status Messages */
	.status {
		display: none;
		margin-top: 8px;
		padding: 10px 12px;
		border-radius: 10px;
		font-size: 0.84rem;
	}
	.status.show { display: block; }
	.status.info { background: var(--accent-light); border: 1px solid var(--accent-glow); color: var(--accent-bright); }
	.status.ok { background: var(--success-light); border: 1px solid rgba(52, 211, 153, 0.36); color: var(--success); }
	.status.err { background: var(--error-light); border: 1px solid rgba(248, 113, 113, 0.3); color: #ffb0b0; }

/* Side Panel: Better Search */
	.panel-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.panel-title {
		font-size: 0.78rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}
	.x402-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 10px;
		border-radius: 999px;
		border: 1px solid rgba(96, 165, 250, 0.35);
		background: var(--accent-light);
		color: var(--accent-bright);
		font-size: 0.72rem;
		font-weight: 700;
		text-decoration: none;
		transition: all 0.2s ease;
	}
	.x402-link:hover {
		background: rgba(96, 165, 250, 0.2);
		border-color: rgba(96, 165, 250, 0.55);
	}
	.x402-row {
		margin-top: 10px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.x402-name {
		font-size: 1rem;
		font-weight: 800;
		color: var(--text-bright);
	}
	.x402-price {
		padding: 5px 10px;
		border-radius: 999px;
		border: 1px solid rgba(167, 139, 250, 0.35);
		background: var(--purple-glow);
		color: #d8b4fe;
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		white-space: nowrap;
	}
	.x402-price.listed {
		border-color: rgba(167, 139, 250, 0.52);
		background: rgba(167, 139, 250, 0.22);
		color: #ead5ff;
	}

	/* Side Panel: Suggestions */
	.suggestions-card { border-color: var(--border-strong); }
	.suggestions-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
	}
	.suggestions-title {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}
	.refresh-btn {
		padding: 5px 10px;
		border-radius: 999px;
		border: 1px solid rgba(96, 165, 250, 0.44);
		background: rgba(16, 30, 54, 0.82);
		color: var(--accent-bright);
		font-size: 0.72rem;
		font-weight: 700;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.refresh-btn:hover { background: rgba(22, 40, 72, 0.9); }
	.suggestions-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 7px;
		margin-top: 8px;
	}
	.suggestion {
		padding: 8px;
		border-radius: 10px;
		border: 1px solid var(--border-strong);
		background: rgba(255, 255, 255, 0.03);
		transition: border-color 0.15s ease;
	}
	.suggestion:hover { border-color: rgba(96, 165, 250, 0.25); }
	.suggestion-name { font-weight: 700; font-size: 0.86rem; overflow-wrap: anywhere; }
	.suggestion-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		margin-top: 5px;
	}
	.suggestion-state {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		flex-shrink: 0;
	}
	.status-dot.green { background: #34d399; box-shadow: 0 0 6px rgba(52, 211, 153, 0.5); }
	.status-dot.blue { background: #60a5fa; box-shadow: 0 0 6px rgba(96, 165, 250, 0.4); }
	.status-dot.white { background: #e2e8f0; box-shadow: 0 0 6px rgba(226, 232, 240, 0.4); }
	.status-dot.orange { background: #fb923c; box-shadow: 0 0 6px rgba(251, 146, 60, 0.5); border-radius: 0; clip-path: polygon(50% 0%, 100% 100%, 0% 100%); }
	.status-dot.red { background: #f87171; box-shadow: 0 0 6px rgba(248, 113, 113, 0.5); }
	.suggestion-state.available { color: #34d399; }
	.suggestion-state.listed { color: #fb923c; }
	.suggestion-state.grace { color: #f87171; }
	.suggestion-state.expiring { color: #fbbf24; }
	.suggestion-state.taken { color: #60a5fa; }
	.suggestion-link {
		padding: 5px 8px;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
		text-decoration: none;
		border: 1px solid rgba(96, 165, 250, 0.45);
		background: rgba(16, 30, 54, 0.82);
		color: var(--accent-bright);
		transition: background 0.15s ease;
	}
	.suggestion-link:hover { background: rgba(22, 40, 72, 0.9); }
	.suggestion-link.available {
		border-color: rgba(52, 211, 153, 0.5);
		background: rgba(12, 52, 33, 0.9);
		color: var(--success);
	}
	.suggestion-link.listed {
		border-color: rgba(251, 146, 60, 0.5);
		background: rgba(80, 40, 10, 0.9);
		color: #fb923c;
	}
	.suggestion-link.grace {
		border-color: rgba(248, 113, 113, 0.4);
		background: rgba(60, 20, 20, 0.9);
		color: #f87171;
	}
	.suggestion-link.expiring {
		border-color: rgba(251, 191, 36, 0.4);
		background: rgba(60, 45, 10, 0.9);
		color: #fbbf24;
	}
	.suggestion-link.taken {
		border-color: rgba(96, 165, 250, 0.4);
		background: rgba(16, 30, 54, 0.82);
		color: #60a5fa;
	}
	.empty {
		padding: 10px;
		font-size: 0.82rem;
		color: var(--text-muted);
		text-align: center;
		border: 1px dashed var(--border-strong);
		border-radius: 10px;
	}

	/* Wallet Widget */
	.wallet-widget {
		position: fixed;
		top: 16px;
		right: 16px;
		z-index: 10040;
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
		background: var(--accent-light);
		border: 1px solid rgba(96, 165, 250, 0.35);
		padding: 0;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	.wallet-profile-btn:hover {
		background: rgba(96, 165, 250, 0.2);
		border-color: rgba(96, 165, 250, 0.55);
		transform: translateY(-1px);
	}

	/* Footer */
	.tracker-footer {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 900;
		background: rgba(10, 10, 15, 0.95);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-top: 1px solid var(--border);
		padding: 11px 16px;
		display: flex;
		justify-content: center;
	}
	.tracker-line {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.84rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow-x: auto;
		max-width: 100%;
		scrollbar-width: none;
	}
	.tracker-line::-webkit-scrollbar { display: none; }
	.tracker-price-label { color: var(--text); font-weight: 600; display: inline-flex; align-items: center; gap: 3px; }
	.tracker-price-label .sui-icon { width: 0.7em; height: auto; }
	#sui-price { color: var(--ski-green-light); font-weight: 700; }
	.tracker-sep { color: var(--text-dim); }
	.tracker-built-on { color: var(--text-muted); }
	.tracker-built-on a {
		color: var(--accent);
		text-decoration: none;
		font-weight: 600;
		transition: color 0.15s ease;
	}
	.tracker-built-on a:hover { color: var(--accent-bright); }

	/* Responsive */
	@media (max-width: 760px) {
		body { padding: 14px; padding-top: 54px; padding-bottom: 74px; }
		.layout-grid { grid-template-columns: 1fr; }
		.wallet-widget { top: 12px; right: 12px; }
		.tracker-footer { padding: 10px 8px; }
		.tracker-line { font-size: 0.78rem; }
	}
	@media (max-width: 540px) {
		.wallet-widget { gap: 6px; }
	}
	@media (max-width: 400px) {
		.wallet-widget { top: 8px; right: 8px; gap: 4px; }
	}
	@media (max-width: 1020px) {
		.layout-grid { grid-template-columns: 1fr; }
	}

	/* Animations */
	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}
	@keyframes gradient-shift {
		0%, 100% { background-position: 0% center; }
		50% { background-position: 100% center; }
	}
`
