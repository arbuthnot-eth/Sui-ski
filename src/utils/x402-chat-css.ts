export function generateMessagingChatCss(): string {
	return `
		#x402-chat-bubble {
			position: fixed;
			bottom: 24px;
			right: 24px;
			width: 52px;
			height: 52px;
			padding: 0;
			border-radius: 14px;
			border: 1px solid rgba(96, 165, 250, 0.45);
			background: radial-gradient(circle at 30% 20%, #2f86ff, #0f4fe2 62%, #0a2f87 100%);
			color: #fff;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 10px 36px rgba(15, 79, 226, 0.45), 0 0 0 1px rgba(96, 165, 250, 0.12);
			transition: transform 0.16s ease, box-shadow 0.16s ease;
			z-index: 20040;
		}
		#x402-chat-bubble:hover {
			transform: translateY(-1px) scale(1.03);
			box-shadow: 0 14px 44px rgba(15, 79, 226, 0.5), 0 0 0 1px rgba(96, 165, 250, 0.18);
		}
		#x402-chat-bubble svg {
			width: 22px;
			height: 22px;
			flex-shrink: 0;
		}

		#x402-chat-backdrop {
			position: fixed;
			inset: 0;
			background: linear-gradient(180deg, rgba(1, 4, 14, 0.2) 0%, rgba(1, 4, 14, 0.7) 100%);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			display: none;
			z-index: 20041;
		}
		#x402-chat-backdrop.open {
			display: block;
		}

		#x402-chat-panel {
			position: fixed;
			top: max(84px, env(safe-area-inset-top));
			right: max(18px, env(safe-area-inset-right));
			bottom: max(92px, env(safe-area-inset-bottom));
			width: 430px;
			max-width: calc(100vw - 28px);
			background: #10131a;
			border: 1px solid rgba(148, 163, 184, 0.22);
			border-radius: 18px;
			overflow: hidden;
			display: none;
			flex-direction: column;
			z-index: 20042;
			box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(148, 163, 184, 0.08);
		}
		#x402-chat-panel.open {
			display: flex;
		}

		.x402-signal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 14px;
			background: linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(17, 24, 39, 0.84) 100%);
			border-bottom: 1px solid rgba(148, 163, 184, 0.2);
		}
		.x402-signal-ident {
			display: flex;
			align-items: center;
			gap: 10px;
			min-width: 0;
		}
		.x402-signal-avatar-btn {
			border: 1px solid rgba(148, 163, 184, 0.24);
			background: rgba(2, 8, 23, 0.6);
			width: 30px;
			height: 30px;
			padding: 2px;
			border-radius: 8px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			flex-shrink: 0;
			overflow: hidden;
			transition: transform 0.14s ease, border-color 0.14s ease;
		}
		.x402-signal-avatar-btn:hover {
			transform: translateY(-1px);
			border-color: rgba(96, 165, 250, 0.55);
		}
		.x402-signal-avatar {
			width: 100%;
			height: 100%;
			border-radius: 6px;
			object-fit: contain;
			flex-shrink: 0;
		}
		.x402-server-title {
			font-size: 14px;
			font-weight: 700;
			color: #e2e8f0;
			line-height: 1.15;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.x402-server-title-link {
			color: inherit;
			text-decoration: none;
		}
		.x402-server-title-link:hover {
			color: #93c5fd;
			text-decoration: underline;
		}
		.x402-server-meta {
			font-size: 11px;
			color: #94a3b8;
			margin-top: 2px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		}
		.x402-server-meta-link {
			color: inherit;
			text-decoration: none;
			border-bottom: 1px dotted rgba(148, 163, 184, 0.5);
		}
		.x402-server-meta-link:hover {
			color: #bfdbfe;
			border-bottom-color: rgba(191, 219, 254, 0.9);
		}
		.x402-header-actions {
			display: flex;
			align-items: center;
			gap: 6px;
			flex-shrink: 0;
		}
		.x402-header-btn {
			border: 1px solid rgba(148, 163, 184, 0.3);
			background: rgba(15, 23, 42, 0.75);
			color: #cbd5e1;
			cursor: pointer;
			border-radius: 9px;
			width: 34px;
			height: 34px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			font-size: 18px;
			font-weight: 700;
		}
		.x402-header-btn:hover {
			background: rgba(30, 41, 59, 0.9);
			color: #f8fafc;
		}

		.x402-layout {
			display: flex;
			flex: 1;
			min-height: 0;
		}
		.x402-sidebar {
			width: 156px;
			min-width: 156px;
			border-right: 1px solid rgba(148, 163, 184, 0.18);
			background: rgba(2, 8, 23, 0.4);
			overflow-y: auto;
			padding: 10px 8px;
		}
		.x402-sidebar-title {
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: #64748b;
			padding: 0 8px 8px;
		}
		.x402-sidebar-title-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 6px;
			padding: 0 4px 8px;
		}
		.x402-sidebar-title-row .x402-sidebar-title {
			padding: 0 4px;
		}
		.x402-sidebar-burn-all-btn {
			border: 1px solid rgba(248, 113, 113, 0.4);
			background: rgba(127, 29, 29, 0.25);
			color: #fecaca;
			font-size: 10px;
			font-weight: 700;
			padding: 2px 7px;
			border-radius: 6px;
			cursor: pointer;
			white-space: nowrap;
		}
		.x402-sidebar-burn-all-btn:hover {
			border-color: rgba(248, 113, 113, 0.62);
			background: rgba(153, 27, 27, 0.4);
			color: #fee2e2;
		}
		.x402-sidebar-burn-all-btn[disabled] {
			opacity: 0.6;
			cursor: default;
		}
		.x402-channel-compose {
			display: none;
			grid-template-columns: 1fr;
			gap: 6px;
			padding: 0 6px 10px;
		}
		.x402-channel-compose-input,
		.x402-channel-compose-select {
			width: 100%;
			min-height: 28px;
			border-radius: 7px;
			border: 1px solid rgba(59, 130, 246, 0.26);
			background: rgba(15, 23, 42, 0.7);
			color: #dbeafe;
			font-size: 11px;
			padding: 0 8px;
			outline: none;
		}
		.x402-channel-compose-input:focus,
		.x402-channel-compose-select:focus {
			border-color: rgba(96, 165, 250, 0.55);
		}
		.x402-channel-compose-btn {
			min-height: 28px;
			border-radius: 7px;
			border: 1px solid rgba(59, 130, 246, 0.44);
			background: linear-gradient(135deg, rgba(29, 78, 216, 0.78), rgba(37, 99, 235, 0.78));
			color: #f8fafc;
			font-size: 11px;
			font-weight: 700;
			cursor: pointer;
			padding: 0 8px;
		}
		.x402-channel-compose-actions {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 6px;
		}
		.x402-channel-compose-btn.secondary {
			border-color: rgba(148, 163, 184, 0.35);
			background: rgba(15, 23, 42, 0.7);
			color: #cbd5e1;
		}
		.x402-channel-compose-btn:disabled {
			opacity: 0.55;
			cursor: default;
		}
		.x402-channel-group + .x402-channel-group {
			margin-top: 10px;
		}
		.x402-channel-group-title {
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: #64748b;
			padding: 0 8px 6px;
		}
		.x402-channel-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 6px;
			padding: 7px 8px;
			border-radius: 8px;
			cursor: pointer;
			color: #a8b3c8;
			font-size: 12px;
			border: 1px solid transparent;
			margin-bottom: 3px;
		}
		.x402-channel-item:hover {
			background: rgba(59, 130, 246, 0.08);
			color: #e2e8f0;
		}
		.x402-channel-item.active {
			background: rgba(59, 130, 246, 0.14);
			border-color: rgba(59, 130, 246, 0.4);
			color: #e2e8f0;
		}
		.x402-channel-main {
			display: flex;
			align-items: center;
			gap: 6px;
			min-width: 0;
		}
		.x402-channel-icon {
			font-size: 11px;
			opacity: 0.9;
			width: 12px;
			text-align: center;
			flex-shrink: 0;
		}
		.x402-channel-name {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
		.x402-channel-actions {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			flex-shrink: 0;
		}
		.x402-channel-sync,
		.x402-channel-rename,
		.x402-channel-purge,
		.x402-channel-delete {
			border: none;
			background: transparent;
			color: #fda4af;
			font-size: 11px;
			cursor: pointer;
			padding: 2px 4px;
			border-radius: 6px;
		}
		.x402-channel-rename {
			color: #bfdbfe;
		}
		.x402-channel-sync {
			color: #bbf7d0;
		}
		.x402-channel-purge {
			color: #fbcfe8;
		}
		.x402-channel-sync:hover {
			background: rgba(20, 83, 45, 0.28);
		}
		.x402-channel-rename:hover {
			background: rgba(30, 58, 138, 0.25);
		}
		.x402-channel-purge:hover {
			background: rgba(131, 24, 67, 0.24);
		}
		.x402-channel-delete:hover {
			background: rgba(127, 29, 29, 0.25);
		}
		.x402-channel-delete[disabled] {
			opacity: 0.6;
			cursor: default;
		}
		.x402-channel-accept-btn {
			border: 1px solid rgba(74, 222, 128, 0.42);
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.22), rgba(22, 163, 74, 0.18));
			color: #bbf7d0;
			font-size: 10px;
			font-weight: 700;
			padding: 2px 8px;
			border-radius: 6px;
			cursor: pointer;
			flex-shrink: 0;
			letter-spacing: 0.02em;
		}
		.x402-channel-accept-btn:hover {
			border-color: rgba(74, 222, 128, 0.65);
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.34), rgba(22, 163, 74, 0.28));
			color: #dcfce7;
		}
		.x402-channel-accept-pending {
			font-size: 10px;
			color: #64748b;
			flex-shrink: 0;
		}
		.x402-sidebar-empty {
			padding: 8px;
			font-size: 11px;
			color: #64748b;
		}

		.x402-thread {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-width: 0;
			min-height: 0;
		}
		.x402-thread-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			padding: 10px 14px;
			border-bottom: 1px solid rgba(148, 163, 184, 0.16);
			background: rgba(2, 8, 23, 0.32);
		}
		.x402-thread-name {
			font-size: 13px;
			font-weight: 700;
			color: #e2e8f0;
		}
		.x402-thread-state {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			font-size: 11px;
			color: #94a3b8;
		}
		.x402-thread-state.warn {
			color: #fbbf24;
		}
		.x402-thread-tab {
			border: 1px solid rgba(147, 197, 253, 0.35);
			background: rgba(30, 41, 59, 0.45);
			color: #cbd5e1;
			font-size: 11px;
			line-height: 1.3;
			padding: 3px 8px;
			border-radius: 999px;
			cursor: pointer;
		}
		.x402-thread-tab:hover {
			border-color: rgba(147, 197, 253, 0.55);
			color: #e2e8f0;
		}
		.x402-thread-tab.active {
			border-color: rgba(56, 189, 248, 0.58);
			background: rgba(8, 47, 73, 0.5);
			color: #bae6fd;
		}
		.x402-thread-state-copy.warn {
			color: #fbbf24;
		}
		.x402-mode-banner {
			display: none;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			background: linear-gradient(180deg, rgba(8, 47, 73, 0.44) 0%, rgba(15, 23, 42, 0.42) 100%);
			border-bottom: 1px solid rgba(14, 165, 233, 0.35);
		}
		.x402-mode-banner-icon {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
			opacity: 0.95;
		}
		.x402-mode-banner-copy {
			display: flex;
			flex-direction: column;
			min-width: 0;
			gap: 1px;
		}
		.x402-mode-banner-title {
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: #bae6fd;
		}
		.x402-mode-banner-subtitle {
			font-size: 11px;
			color: #cbd5e1;
			line-height: 1.25;
		}

		.x402-messages {
			flex: 1;
			overflow-y: auto;
			padding: 12px;
			display: flex;
			flex-direction: column;
			gap: 10px;
			background:
				radial-gradient(circle at 80% -30%, rgba(139, 92, 246, 0.16), transparent 46%),
				radial-gradient(circle at 18% -12%, rgba(59, 130, 246, 0.13), transparent 42%),
				linear-gradient(180deg, rgba(2, 8, 23, 0.18) 0%, rgba(2, 8, 23, 0.04) 100%);
		}
		.x402-msg {
			max-width: 85%;
			border-radius: 15px;
			padding: 10px 12px;
			font-size: 12px;
			line-height: 1.45;
			word-break: break-word;
			border: 1px solid rgba(148, 163, 184, 0.2);
			backdrop-filter: blur(3px);
			-webkit-backdrop-filter: blur(3px);
		}
		.x402-msg.user {
			align-self: flex-end;
			background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 58%, #1e40af 100%);
			color: #f8fafc;
			border-color: rgba(96, 165, 250, 0.45);
			border-bottom-right-radius: 4px;
			box-shadow: 0 9px 24px rgba(29, 78, 216, 0.3), inset 0 1px 0 rgba(219, 234, 254, 0.16);
		}
		.x402-msg.user.owner {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.38) 0%, rgba(124, 58, 237, 0.32) 100%);
			border-color: rgba(192, 132, 252, 0.44);
			box-shadow: 0 7px 18px rgba(124, 58, 237, 0.24), inset 0 1px 0 rgba(250, 245, 255, 0.16);
		}
		.x402-msg.peer {
			align-self: flex-start;
			background: linear-gradient(180deg, rgba(30, 41, 59, 0.74) 0%, rgba(15, 23, 42, 0.78) 100%);
			color: #e2e8f0;
			border-bottom-left-radius: 4px;
			box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.16);
		}
		.x402-msg.system {
			align-self: center;
			max-width: 95%;
			background: rgba(15, 23, 42, 0.5);
			color: #93c5fd;
			font-size: 11px;
			text-align: center;
			padding: 8px 10px;
		}
		.x402-msg-head {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			gap: 8px;
			margin-bottom: 4px;
			font-size: 10px;
		}
		.x402-msg-auth {
			display: inline-flex;
			align-items: center;
			padding: 1px 6px;
			border-radius: 999px;
			border: 1px solid rgba(74, 222, 128, 0.4);
			background: rgba(34, 197, 94, 0.18);
			color: #bbf7d0;
			font-size: 9px;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
		}
		.x402-msg-time {
			margin-left: auto;
			color: #94a3b8;
		}
		.x402-msg-sender {
			font-weight: 700;
			color: #93c5fd;
		}
		.x402-msg-sender-link {
			text-decoration: none;
			cursor: pointer;
			transition: color 0.14s ease, text-shadow 0.14s ease;
		}
		.x402-msg-sender-link:hover {
			color: #dbeafe;
			text-shadow: 0 0 10px rgba(147, 197, 253, 0.35);
			text-decoration: underline;
			text-underline-offset: 2px;
		}
		.x402-msg.user .x402-msg-sender,
		.x402-msg.user .x402-msg-time {
			color: rgba(226, 232, 240, 0.85);
		}
		.x402-msg.user.owner .x402-msg-sender,
		.x402-msg.user.owner .x402-msg-time {
			color: rgba(250, 245, 255, 0.9);
		}
		.x402-msg.owner-primary .x402-msg-sender,
		.x402-msg.owner-primary .x402-msg-time,
		.x402-msg.user.owner.owner-primary .x402-msg-sender,
		.x402-msg.user.owner.owner-primary .x402-msg-time {
			color: #facc15;
		}
		.x402-msg.owner-primary .x402-msg-sender-link:hover,
		.x402-msg.user.owner.owner-primary .x402-msg-sender-link:hover {
			color: #fef08a;
			text-shadow: 0 0 10px rgba(250, 204, 21, 0.32);
		}
		.x402-msg-actions {
			display: flex;
			gap: 4px;
			margin-top: 7px;
		}
		.x402-msg-action {
			font-size: 10px;
			padding: 4px 6px;
			border-radius: 7px;
			border: 1px solid rgba(148, 163, 184, 0.32);
			background: rgba(15, 23, 42, 0.5);
			color: #cbd5e1;
			cursor: pointer;
		}
		.x402-msg-action:hover {
			background: rgba(30, 41, 59, 0.72);
		}
		.x402-msg-action.danger {
			color: #fda4af;
			border-color: rgba(248, 113, 113, 0.35);
		}
		.x402-join-requests {
			display: flex;
			flex-direction: column;
			gap: 6px;
			margin-bottom: 6px;
			padding: 8px;
			border-radius: 10px;
			border: 1px solid rgba(56, 189, 248, 0.28);
			background: rgba(8, 47, 73, 0.24);
		}
		.x402-join-requests-title {
			font-size: 11px;
			font-weight: 700;
			color: #bae6fd;
		}
		.x402-join-request-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}
		.x402-join-request-label {
			font-size: 11px;
			color: #dbeafe;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			min-width: 0;
		}
		.x402-members-tab {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding: 8px 10px 10px;
		}
		.x402-members-section {
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 9px;
			border-radius: 10px;
			border: 1px solid rgba(56, 189, 248, 0.2);
			background: rgba(15, 23, 42, 0.34);
		}
		.x402-members-title {
			font-size: 11px;
			font-weight: 700;
			color: #bae6fd;
		}
		.x402-members-empty {
			font-size: 11px;
			color: #94a3b8;
		}
		.x402-member-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}
		.x402-member-ident {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;
		}
		.x402-member-name {
			font-size: 11px;
			font-weight: 700;
			color: #dbeafe;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.x402-member-name.owner-primary {
			color: #facc15;
		}
		.x402-member-address {
			font-size: 10px;
			color: #94a3b8;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.x402-members-actions {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		.x402-input-wrap {
			padding: 8px 10px 10px;
			border-top: 1px solid rgba(148, 163, 184, 0.16);
			background: rgba(2, 8, 23, 0.32);
		}
		.x402-composer-identity {
			min-height: 18px;
			padding: 0 2px 8px;
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;
			font-size: 11px;
			color: #94a3b8;
		}
		.x402-composer-identity.owner {
			color: #e9d5ff;
		}
		.x402-composer-identity-label {
			opacity: 0.9;
		}
		.x402-composer-identity-pill {
			display: inline-flex;
			align-items: center;
			padding: 2px 8px;
			border-radius: 999px;
			border: 1px solid rgba(192, 132, 252, 0.45);
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.32), rgba(124, 58, 237, 0.28));
			color: #f3e8ff;
			text-decoration: none;
			font-weight: 700;
			line-height: 1.25;
			appearance: none;
			-webkit-appearance: none;
			cursor: pointer;
		}
		.x402-composer-identity-pill:hover {
			border-color: rgba(216, 180, 254, 0.62);
			color: #faf5ff;
		}
		.x402-composer-identity-pill.owner-primary {
			border-color: rgba(234, 179, 8, 0.52);
			background: linear-gradient(135deg, rgba(120, 53, 15, 0.46), rgba(202, 138, 4, 0.34));
			color: #fef08a;
		}
		.x402-composer-identity-pill.owner-primary:hover {
			border-color: rgba(250, 204, 21, 0.75);
			color: #fef9c3;
		}
		.x402-author-toggle::after {
			content: '▾';
			font-size: 10px;
			opacity: 0.85;
			margin-left: 6px;
			transform: translateY(-1px);
		}
		.x402-author-toggle.open::after {
			content: '▴';
		}
		.x402-author-picker {
			width: 100%;
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.x402-author-filter {
			width: 100%;
			min-height: 26px;
			border-radius: 8px;
			border: 1px solid rgba(148, 163, 184, 0.28);
			background: rgba(15, 23, 42, 0.6);
			color: #dbeafe;
			font-size: 11px;
			padding: 0 8px;
			outline: none;
		}
		.x402-author-filter:focus {
			border-color: rgba(192, 132, 252, 0.55);
		}
		.x402-author-chip-list {
			display: flex;
			flex-wrap: nowrap;
			gap: 6px;
			width: 100%;
			overflow-x: auto;
			padding-bottom: 2px;
		}
		.x402-author-chip {
			border: 1px solid rgba(148, 163, 184, 0.28);
			background: rgba(15, 23, 42, 0.5);
			color: #cbd5e1;
			border-radius: 999px;
			font-size: 11px;
			font-weight: 600;
			padding: 2px 10px;
			cursor: pointer;
			white-space: nowrap;
		}
		.x402-author-chip:hover {
			border-color: rgba(147, 197, 253, 0.5);
			color: #e2e8f0;
		}
		.x402-author-chip.selected {
			border-color: rgba(192, 132, 252, 0.52);
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(124, 58, 237, 0.24));
			color: #f3e8ff;
		}
		.x402-author-chip.owner-primary {
			border-color: rgba(234, 179, 8, 0.45);
			background: linear-gradient(135deg, rgba(120, 53, 15, 0.36), rgba(202, 138, 4, 0.25));
			color: #fde68a;
		}
		.x402-author-chip.owner-primary:hover {
			border-color: rgba(250, 204, 21, 0.66);
			color: #fef3c7;
		}
		.x402-author-chip.owner-primary.selected {
			border-color: rgba(250, 204, 21, 0.78);
			background: linear-gradient(135deg, rgba(113, 63, 18, 0.5), rgba(202, 138, 4, 0.4));
			color: #fef9c3;
		}
		.x402-composer-select {
			max-width: 170px;
			padding: 2px 22px 2px 8px;
			border-radius: 999px;
			border: 1px solid rgba(192, 132, 252, 0.45);
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.32), rgba(124, 58, 237, 0.28));
			color: #f3e8ff;
			font-size: 11px;
			font-weight: 700;
			line-height: 1.25;
			outline: none;
			appearance: none;
			-webkit-appearance: none;
			background-image:
				linear-gradient(135deg, rgba(139, 92, 246, 0.32), rgba(124, 58, 237, 0.28)),
				url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M2 4l4 4 4-4" fill="none" stroke="%23f3e8ff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>');
			background-repeat: no-repeat, no-repeat;
			background-position: 0 0, right 7px center;
			background-size: auto, 12px;
			cursor: pointer;
		}
		.x402-composer-select:focus {
			border-color: rgba(216, 180, 254, 0.62);
		}
		.x402-composer-identity-address {
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			color: #cbd5e1;
		}
		.x402-input-area {
			display: flex;
			gap: 8px;
			align-items: flex-end;
		}
		.x402-input {
			flex: 1;
			min-height: 40px;
			max-height: 110px;
			padding: 10px 12px;
			border-radius: 12px;
			border: 1px solid rgba(148, 163, 184, 0.3);
			background: rgba(15, 23, 42, 0.7);
			color: #e2e8f0;
			font-size: 13px;
			font-family: inherit;
			line-height: 1.35;
			resize: none;
			outline: none;
		}
		.x402-input:focus {
			border-color: rgba(59, 130, 246, 0.55);
		}
		.x402-input:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.x402-send-btn {
			width: 40px;
			height: 40px;
			border-radius: 11px;
			border: 1px solid rgba(96, 165, 250, 0.45);
			background: linear-gradient(135deg, #1d4ed8, #2563eb);
			color: #fff;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			flex-shrink: 0;
		}
		.x402-send-btn:disabled {
			opacity: 0.45;
			cursor: default;
		}
		.x402-send-btn svg {
			width: 18px;
			height: 18px;
		}

		body.wk-modal-open #x402-chat-backdrop,
		body.wk-modal-open #x402-chat-panel,
		body.wk-modal-open #x402-chat-bubble {
			display: none !important;
		}

		body.x402-chat-open #wallet-widget {
			opacity: 1;
			pointer-events: auto;
		}

		@media (max-width: 640px) {
			#x402-chat-panel {
				top: 0;
				right: 0;
				bottom: 0;
				width: 100vw;
				max-width: 100vw;
				border-radius: 0;
			}
			#x402-chat-bubble {
				bottom: 16px;
				right: 16px;
				width: 48px;
				height: 48px;
			}
			.x402-sidebar {
				width: 132px;
				min-width: 132px;
			}
		}
	`
}
