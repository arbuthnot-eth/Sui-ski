export const subnameCapStyles = `
	:root {
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
		--purple: #a78bfa;
		--purple-light: rgba(167, 139, 250, 0.12);
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
	}
	* { margin: 0; padding: 0; box-sizing: border-box; }
	body {
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		background: var(--bg-void);
		color: var(--text);
		min-height: 100vh;
		padding: 24px 16px;
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

	.container {
		max-width: 960px;
		margin: 0 auto;
		position: relative;
		z-index: 1;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 32px;
		flex-wrap: wrap;
		gap: 16px;
	}
	.header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.wallet-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: var(--card-bg-solid);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	.wallet-btn:hover {
		border-color: var(--accent);
		background: var(--accent-light);
	}
	.wallet-btn.connected {
		border-color: var(--success);
		color: var(--success);
	}

	.tabs {
		display: flex;
		gap: 4px;
		background: var(--card-bg);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 4px;
		margin-bottom: 24px;
		overflow-x: auto;
	}
	.tab {
		padding: 10px 18px;
		border-radius: 8px;
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}
	.tab:hover {
		color: var(--text);
		background: rgba(255, 255, 255, 0.04);
	}
	.tab.active {
		color: var(--text-bright);
		background: var(--accent-light);
	}

	.tab-content {
		display: none;
	}
	.tab-content.active {
		display: block;
	}

	.card {
		background: var(--card-bg);
		border: 1px solid var(--glass-border);
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 16px;
		box-shadow: var(--shadow);
		position: relative;
	}
	.card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
		border-radius: 16px 16px 0 0;
	}
	.card-title {
		font-size: 1.1rem;
		font-weight: 700;
		margin-bottom: 16px;
		color: var(--text-bright);
	}

	.form-group {
		margin-bottom: 16px;
	}
	.form-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 6px;
	}
	.form-input {
		width: 100%;
		padding: 10px 14px;
		background: var(--bg-dark);
		border: 1px solid var(--border);
		border-radius: 10px;
		color: var(--text);
		font-size: 0.9rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}
	.form-input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-light);
	}
	.form-input::placeholder {
		color: var(--text-dim);
	}
	select.form-input {
		appearance: none;
		cursor: pointer;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.checkbox-group {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 0;
	}
	.checkbox-group input[type="checkbox"] {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
		cursor: pointer;
	}
	.checkbox-group label {
		font-size: 0.875rem;
		color: var(--text);
		cursor: pointer;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 24px;
		border: none;
		border-radius: 10px;
		font-size: 0.9rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-primary {
		background: linear-gradient(135deg, #3b82f6, #8b5cf6);
		color: white;
		box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
	}
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}
	.btn-danger {
		background: var(--error-light);
		color: var(--error);
		border: 1px solid rgba(248, 113, 113, 0.2);
	}
	.btn-danger:hover {
		background: rgba(248, 113, 113, 0.2);
	}
	.btn-secondary {
		background: var(--card-bg-solid);
		color: var(--text);
		border: 1px solid var(--border-strong);
	}
	.btn-secondary:hover {
		background: var(--accent-light);
		border-color: var(--accent);
		color: var(--accent);
	}
	.btn-sm {
		padding: 6px 14px;
		font-size: 0.8rem;
	}

	.cap-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.cap-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
		border: 1px solid var(--border);
		border-radius: 12px;
		gap: 16px;
		flex-wrap: wrap;
	}
	.cap-info {
		flex: 1;
		min-width: 200px;
	}
	.cap-domain {
		font-weight: 700;
		font-size: 1rem;
		color: var(--accent-bright);
		margin-bottom: 4px;
	}
	.cap-id {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.75rem;
		color: var(--text-dim);
		word-break: break-all;
	}
	.cap-badges {
		display: flex;
		gap: 6px;
		margin-top: 8px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.badge-leaf {
		background: var(--success-light);
		color: var(--success);
	}
	.badge-node {
		background: var(--purple-light);
		color: var(--purple);
	}
	.badge-active {
		background: var(--success-light);
		color: var(--success);
	}
	.badge-revoked {
		background: var(--error-light);
		color: var(--error);
	}

	.cap-actions {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}

	.subname-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.subname-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: rgba(20, 20, 28, 0.6);
		border: 1px solid var(--border);
		border-radius: 10px;
		gap: 12px;
	}
	.subname-name {
		font-weight: 600;
		color: var(--text-bright);
	}
	.subname-target {
		font-family: ui-monospace, SFMono-Regular, monospace;
		font-size: 0.75rem;
		color: var(--text-muted);
		word-break: break-all;
	}

	.empty-state {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-muted);
	}
	.empty-state svg {
		width: 48px;
		height: 48px;
		margin-bottom: 16px;
		opacity: 0.4;
	}
	.empty-state p {
		font-size: 0.9rem;
		line-height: 1.6;
	}

	.toast {
		position: fixed;
		bottom: 24px;
		right: 24px;
		padding: 14px 20px;
		background: var(--card-bg-elevated);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		box-shadow: var(--shadow-lg);
		font-size: 0.875rem;
		color: var(--text);
		z-index: 10000;
		transform: translateY(100px);
		opacity: 0;
		transition: all 0.3s ease;
	}
	.toast.show {
		transform: translateY(0);
		opacity: 1;
	}
	.toast.success {
		border-color: rgba(52, 211, 153, 0.3);
	}
	.toast.error {
		border-color: rgba(248, 113, 113, 0.3);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 9998;
		display: none;
		align-items: center;
		justify-content: center;
	}
	.modal-overlay.show {
		display: flex;
	}
	.modal {
		background: var(--card-bg-elevated);
		border: 1px solid var(--border-strong);
		border-radius: 20px;
		padding: 32px;
		max-width: 500px;
		width: 90%;
		box-shadow: var(--shadow-lg);
	}
	.modal-title {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 16px;
		background: linear-gradient(135deg, #60a5fa, #a78bfa);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		margin-top: 24px;
	}

	.spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
	}
	.status-dot.online {
		background: var(--success);
		box-shadow: 0 0 8px var(--success);
	}
	.status-dot.offline {
		background: var(--error);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 20px;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--accent);
	}

	.info-banner {
		padding: 14px 18px;
		background: var(--accent-light);
		border: 1px solid rgba(96, 165, 250, 0.2);
		border-radius: 10px;
		font-size: 0.85rem;
		color: var(--accent-bright);
		margin-bottom: 20px;
		line-height: 1.5;
	}

	@media (max-width: 640px) {
		.form-row {
			grid-template-columns: 1fr;
		}
		.cap-item {
			flex-direction: column;
			align-items: flex-start;
		}
		.cap-actions {
			width: 100%;
		}
		.cap-actions .btn {
			flex: 1;
		}
		.tabs {
			gap: 2px;
		}
		.tab {
			padding: 8px 12px;
			font-size: 0.8rem;
		}
	}
`
