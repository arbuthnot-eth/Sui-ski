export function generateX402ChatCss(): string {
	return `
		#x402-chat-bubble {
			position: fixed;
			bottom: 24px;
			right: 24px;
			width: 58px;
			height: 58px;
			border-radius: 50%;
			border: 1px solid rgba(96, 165, 250, 0.45);
			background: radial-gradient(circle at 30% 20%, #2f86ff, #0f4fe2 62%, #0a2f87 100%);
			color: #fff;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 10px 36px rgba(15, 79, 226, 0.45), 0 0 0 1px rgba(96, 165, 250, 0.12);
			transition: transform 0.16s ease, box-shadow 0.16s ease;
			z-index: 9200;
		}
		#x402-chat-bubble:hover {
			transform: translateY(-1px) scale(1.03);
			box-shadow: 0 14px 44px rgba(15, 79, 226, 0.5), 0 0 0 1px rgba(96, 165, 250, 0.18);
		}
		#x402-chat-bubble svg {
			width: 24px;
			height: 24px;
		}

		#x402-chat-backdrop {
			position: fixed;
			inset: 0;
			background: linear-gradient(180deg, rgba(1, 4, 14, 0.2) 0%, rgba(1, 4, 14, 0.7) 100%);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			display: none;
			z-index: 9201;
		}
		#x402-chat-backdrop.open {
			display: block;
		}

		#x402-chat-panel {
			position: fixed;
			top: 18px;
			right: 18px;
			bottom: 92px;
			width: 430px;
			max-width: calc(100vw - 28px);
			background: #10131a;
			border: 1px solid rgba(148, 163, 184, 0.22);
			border-radius: 18px;
			overflow: hidden;
			display: none;
			flex-direction: column;
			z-index: 9202;
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
		.x402-signal-avatar {
			width: 28px;
			height: 28px;
			border-radius: 50%;
			background: linear-gradient(135deg, #22d3ee, #3b82f6);
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
		.x402-server-meta {
			font-size: 11px;
			color: #94a3b8;
			margin-top: 2px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.x402-header-actions {
			display: flex;
			align-items: center;
			gap: 6px;
		}
		.x402-header-btn {
			border: 1px solid rgba(148, 163, 184, 0.3);
			background: rgba(15, 23, 42, 0.75);
			color: #cbd5e1;
			cursor: pointer;
			border-radius: 9px;
			width: 30px;
			height: 30px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
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
		.x402-channel-delete {
			border: none;
			background: transparent;
			color: #fda4af;
			font-size: 11px;
			cursor: pointer;
			padding: 2px 4px;
			border-radius: 6px;
		}
		.x402-channel-delete:hover {
			background: rgba(127, 29, 29, 0.25);
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
			font-size: 11px;
			color: #94a3b8;
		}
		.x402-thread-state.warn {
			color: #fbbf24;
		}

		.x402-messages {
			flex: 1;
			overflow-y: auto;
			padding: 12px;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.x402-msg {
			max-width: 85%;
			border-radius: 14px;
			padding: 9px 11px;
			font-size: 12px;
			line-height: 1.45;
			word-break: break-word;
			border: 1px solid rgba(148, 163, 184, 0.2);
		}
		.x402-msg.user {
			align-self: flex-end;
			background: linear-gradient(135deg, #2563eb, #1d4ed8);
			color: #f8fafc;
			border-color: rgba(96, 165, 250, 0.45);
			border-bottom-right-radius: 4px;
		}
		.x402-msg.peer {
			align-self: flex-start;
			background: rgba(30, 41, 59, 0.65);
			color: #e2e8f0;
			border-bottom-left-radius: 4px;
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
			justify-content: space-between;
			gap: 8px;
			margin-bottom: 4px;
			font-size: 10px;
		}
		.x402-msg-sender {
			font-weight: 700;
			color: #93c5fd;
		}
		.x402-msg.user .x402-msg-sender,
		.x402-msg.user .x402-msg-time {
			color: rgba(226, 232, 240, 0.85);
		}
		.x402-msg-time {
			color: #94a3b8;
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

		.x402-input-area {
			padding: 10px;
			border-top: 1px solid rgba(148, 163, 184, 0.16);
			background: rgba(2, 8, 23, 0.32);
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
				width: 52px;
				height: 52px;
			}
			.x402-sidebar {
				width: 132px;
				min-width: 132px;
			}
		}
	`
}
