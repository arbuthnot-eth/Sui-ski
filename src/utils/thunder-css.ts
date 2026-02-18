export function generateThunderCss(): string {
	return `
		#thunder-bubble {
			position: fixed;
			bottom: 24px;
			right: 24px;
			width: 56px;
			height: 56px;
			padding: 0;
			border-radius: 16px;
			border: none;
			background: transparent;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 180, 50, 0.15);
			transition: transform 0.16s ease, box-shadow 0.16s ease;
			z-index: 20040;
			overflow: visible;
		}
		#thunder-bubble:hover {
			transform: translateY(-2px) scale(1.06);
			box-shadow: 0 12px 36px rgba(230, 160, 30, 0.35), 0 0 0 1px rgba(255, 200, 80, 0.25);
		}
		#thunder-bubble img {
			width: 100%;
			height: 100%;
			border-radius: 16px;
			object-fit: cover;
			pointer-events: none;
		}
		#thunder-bubble.open {
			box-shadow: 0 4px 18px rgba(230, 160, 30, 0.25), 0 0 0 2px rgba(255, 180, 50, 0.4);
			z-index: 20043;
		}
		.thunder-shockwave {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 56px;
			height: 56px;
			margin-top: -28px;
			margin-left: -28px;
			border-radius: 50%;
			border: 2px solid rgba(255, 190, 60, 0.7);
			opacity: 0;
			pointer-events: none;
			transform: scale(1);
		}
		.thunder-shockwave.fire {
			animation: thunder-wave 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
		}
		@keyframes thunder-wave {
			0% { transform: scale(1); opacity: 0.8; border-color: rgba(255, 190, 60, 0.8); }
			100% { transform: scale(3.5); opacity: 0; border-color: rgba(255, 140, 20, 0); }
		}

		#thunder-backdrop {
			position: fixed;
			inset: 0;
			background: linear-gradient(180deg, rgba(1, 4, 14, 0.2) 0%, rgba(1, 4, 14, 0.7) 100%);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
			display: none;
			z-index: 20041;
		}
		#thunder-backdrop.open {
			display: block;
		}

		#thunder-panel {
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
		#thunder-panel.open {
			display: flex;
		}

		.thunder-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 14px;
			background: linear-gradient(180deg, rgba(17, 24, 39, 0.95) 0%, rgba(17, 24, 39, 0.84) 100%);
			border-bottom: 1px solid rgba(148, 163, 184, 0.2);
		}
		.thunder-ident {
			display: flex;
			align-items: center;
			gap: 10px;
			min-width: 0;
		}
		.thunder-avatar-btn {
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
		.thunder-avatar-btn:hover {
			transform: translateY(-1px);
			border-color: rgba(96, 165, 250, 0.55);
		}
		.thunder-avatar {
			width: 100%;
			height: 100%;
			border-radius: 6px;
			object-fit: contain;
			flex-shrink: 0;
		}
		.thunder-server-title {
			font-size: 14px;
			font-weight: 700;
			color: #e2e8f0;
			line-height: 1.15;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.thunder-server-title-link {
			color: inherit;
			text-decoration: none;
		}
		.thunder-server-title-link:hover {
			color: #93c5fd;
			text-decoration: underline;
		}
		.thunder-server-meta {
			font-size: 11px;
			color: #94a3b8;
			margin-top: 2px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		}
		.thunder-server-meta-link {
			color: inherit;
			text-decoration: none;
			border-bottom: 1px dotted rgba(148, 163, 184, 0.5);
		}
		.thunder-server-meta-link:hover {
			color: #bfdbfe;
			border-bottom-color: rgba(191, 219, 254, 0.9);
		}
		.thunder-header-actions {
			display: flex;
			align-items: center;
			gap: 6px;
			flex-shrink: 0;
		}
		.thunder-header-btn {
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
		.thunder-header-btn:hover {
			background: rgba(30, 41, 59, 0.9);
			color: #f8fafc;
		}

		.thunder-layout {
			display: flex;
			flex: 1;
			min-height: 0;
		}
		.thunder-sidebar {
			width: 156px;
			min-width: 156px;
			border-right: 1px solid rgba(148, 163, 184, 0.18);
			background: rgba(2, 8, 23, 0.4);
			overflow-y: auto;
			padding: 10px 8px;
			display: flex;
			flex-direction: column;
		}
		.thunder-sidebar-title {
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: #64748b;
			padding: 0 8px 8px;
		}
		.thunder-sidebar-title-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 6px;
			padding: 0 4px 8px;
		}
		.thunder-sidebar-title-row .thunder-sidebar-title {
			padding: 0 4px;
		}
		.thunder-sidebar-title-actions {
			display: inline-flex;
			align-items: center;
			justify-content: flex-end;
			flex-wrap: wrap;
			gap: 6px;
		}
		.thunder-sidebar-reset-btn {
			border: 1px solid rgba(59, 130, 246, 0.38);
			background: rgba(30, 58, 138, 0.22);
			color: #bfdbfe;
			font-size: 9px;
			font-weight: 700;
			padding: 2px 6px;
			border-radius: 6px;
			cursor: pointer;
			white-space: nowrap;
		}
		.thunder-sidebar-reset-btn:hover {
			border-color: rgba(96, 165, 250, 0.6);
			background: rgba(30, 64, 175, 0.34);
			color: #dbeafe;
		}
		.thunder-sidebar-reset-btn[disabled] {
			opacity: 0.45;
			cursor: not-allowed;
		}
		.thunder-sidebar-delete-all-btn {
			border: 1px solid rgba(239, 68, 68, 0.4);
			background: rgba(127, 29, 29, 0.25);
			color: #fca5a5;
			font-size: 10px;
			font-weight: 700;
			padding: 2px 7px;
			border-radius: 6px;
			cursor: pointer;
			white-space: nowrap;
		}
		.thunder-sidebar-delete-all-btn:hover {
			border-color: rgba(239, 68, 68, 0.62);
			background: rgba(153, 27, 27, 0.4);
			color: #fee2e2;
		}
		.thunder-sidebar-footer {
			margin-top: auto;
			padding: 8px 4px 2px;
		}
		.thunder-onchain-badge {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			font-size: 9px;
			font-weight: 600;
			color: #64748b;
			line-height: 1.2;
		}
		.thunder-onchain-badge img {
			opacity: 0.5;
			flex-shrink: 0;
		}
		.thunder-channel-compose {
			display: none;
			grid-template-columns: 1fr;
			gap: 6px;
			padding: 0 6px 10px;
		}
		.thunder-channel-compose-input,
		.thunder-channel-compose-select {
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
		.thunder-channel-compose-input:focus,
		.thunder-channel-compose-select:focus {
			border-color: rgba(96, 165, 250, 0.55);
		}
		.thunder-channel-compose-btn {
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
		.thunder-channel-compose-actions {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 6px;
		}
		.thunder-channel-compose-btn.secondary {
			border-color: rgba(148, 163, 184, 0.35);
			background: rgba(15, 23, 42, 0.7);
			color: #cbd5e1;
		}
		.thunder-channel-compose-btn:disabled {
			opacity: 0.55;
			cursor: default;
		}
		.thunder-channel-group + .thunder-channel-group {
			margin-top: 10px;
		}
		.thunder-channel-group-extra {
			border: 1px solid rgba(148, 163, 184, 0.14);
			border-radius: 8px;
			padding: 6px;
			margin-top: 8px;
			background: rgba(15, 23, 42, 0.25);
		}
		.thunder-extra-head {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-bottom: 4px;
		}
		.thunder-extra-toggle,
		.thunder-extra-clean {
			border: 1px solid rgba(148, 163, 184, 0.32);
			background: rgba(15, 23, 42, 0.56);
			color: #cbd5e1;
			font-size: 10px;
			font-weight: 700;
			padding: 2px 6px;
			border-radius: 6px;
			cursor: pointer;
			white-space: nowrap;
		}
		.thunder-extra-toggle:hover {
			border-color: rgba(147, 197, 253, 0.48);
			color: #e2e8f0;
		}
		.thunder-extra-clean {
			border-color: rgba(239, 68, 68, 0.4);
			background: rgba(127, 29, 29, 0.28);
			color: #fca5a5;
		}
		.thunder-extra-clean:hover {
			border-color: rgba(239, 68, 68, 0.62);
			background: rgba(153, 27, 27, 0.4);
			color: #fee2e2;
		}
		.thunder-channel-group-title {
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			color: #64748b;
			padding: 0 8px 6px;
		}
		.thunder-channel-item {
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
		.thunder-channel-item:hover {
			background: rgba(59, 130, 246, 0.08);
			color: #e2e8f0;
		}
		.thunder-channel-item.active {
			background: rgba(59, 130, 246, 0.14);
			border-color: rgba(59, 130, 246, 0.4);
			color: #e2e8f0;
		}
		.thunder-channel-item.pinned {
			border-bottom: 1px solid rgba(148, 163, 184, 0.12);
			margin-bottom: 6px;
			padding-bottom: 8px;
		}
		.thunder-channel-item.pinned .thunder-channel-name {
			font-weight: 700;
		}
		.thunder-channel-item.owner-gold {
			color: #fde68a;
		}
		.thunder-channel-item.owner-gold.active {
			background: rgba(234, 179, 8, 0.12);
			border-color: rgba(250, 204, 21, 0.35);
			color: #fef08a;
		}
		.thunder-channel-item.owner-gold:hover {
			background: rgba(234, 179, 8, 0.10);
			color: #fef9c3;
		}
		.thunder-channel-main {
			display: flex;
			align-items: center;
			gap: 6px;
			min-width: 0;
		}
		.thunder-channel-icon {
			font-size: 11px;
			opacity: 0.9;
			width: 12px;
			text-align: center;
			flex-shrink: 0;
		}
		.thunder-channel-name {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
		.thunder-channel-actions {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			flex-shrink: 0;
		}
		.thunder-channel-sync,
		.thunder-channel-rename,
		.thunder-channel-purge {
			border: none;
			background: transparent;
			color: #fda4af;
			font-size: 11px;
			cursor: pointer;
			padding: 2px 4px;
			border-radius: 6px;
		}
		.thunder-channel-delete {
			border: none;
			background: transparent;
			color: #ef4444;
			font-size: 14px;
			font-weight: 700;
			line-height: 1;
			cursor: pointer;
			padding: 0 4px;
			border-radius: 4px;
			flex-shrink: 0;
			opacity: 0.7;
			transition: opacity 0.12s ease;
		}
		.thunder-channel-delete:hover {
			opacity: 1;
			background: rgba(239, 68, 68, 0.15);
		}
		.thunder-channel-rename {
			color: #bfdbfe;
		}
		.thunder-channel-sync {
			color: #bbf7d0;
		}
		.thunder-channel-purge {
			color: #fbcfe8;
		}
		.thunder-channel-sync:hover {
			background: rgba(20, 83, 45, 0.28);
		}
		.thunder-channel-rename:hover {
			background: rgba(30, 58, 138, 0.25);
		}
		.thunder-channel-purge:hover {
			background: rgba(131, 24, 67, 0.24);
		}
		.thunder-channel-delete:hover {
			background: rgba(127, 29, 29, 0.25);
		}
		.thunder-channel-delete[disabled] {
			opacity: 0.6;
			cursor: default;
		}
		.thunder-channel-accept-btn {
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
		.thunder-channel-accept-btn:hover {
			border-color: rgba(74, 222, 128, 0.65);
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.34), rgba(22, 163, 74, 0.28));
			color: #dcfce7;
		}
		.thunder-channel-accept-pending {
			font-size: 10px;
			color: #64748b;
			flex-shrink: 0;
		}
		.thunder-sidebar-empty {
			padding: 8px;
			font-size: 11px;
			color: #64748b;
		}

		.thunder-thread {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-width: 0;
			min-height: 0;
		}
		.thunder-thread-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			padding: 10px 14px;
			border-bottom: 1px solid rgba(148, 163, 184, 0.16);
			background: rgba(2, 8, 23, 0.32);
		}
		.thunder-thread-name {
			font-size: 13px;
			font-weight: 700;
			color: #e2e8f0;
		}
		.thunder-channel-gear-wrap {
			position: relative;
			display: inline-flex;
		}
		.thunder-channel-gear-btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			border: none;
			border-radius: 6px;
			background: transparent;
			color: #64748b;
			cursor: pointer;
			transition: all 0.15s ease;
		}
		.thunder-channel-gear-btn:hover {
			background: rgba(148, 163, 184, 0.14);
			color: #94a3b8;
		}
		.thunder-channel-gear-menu {
			position: absolute;
			top: 100%;
			left: 0;
			margin-top: 4px;
			min-width: 110px;
			background: rgba(10, 15, 30, 0.96);
			border: 1px solid rgba(148, 163, 184, 0.2);
			border-radius: 8px;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
			z-index: 100;
			padding: 4px;
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
		}
		.thunder-gear-item {
			display: block;
			width: 100%;
			padding: 6px 10px;
			border: none;
			border-radius: 5px;
			background: none;
			color: #cbd5e1;
			font-size: 11px;
			font-weight: 600;
			text-align: left;
			cursor: pointer;
			transition: background 0.12s ease;
		}
		.thunder-gear-item:hover {
			background: rgba(148, 163, 184, 0.12);
			color: #e2e8f0;
		}
		.thunder-gear-item-danger:hover {
			background: rgba(239, 68, 68, 0.15);
			color: #fca5a5;
		}
		.thunder-thread-state {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			font-size: 11px;
			color: #94a3b8;
			margin-left: auto;
		}
		.thunder-thread-tab {
			border: 1px solid rgba(147, 197, 253, 0.35);
			background: rgba(30, 41, 59, 0.45);
			color: #cbd5e1;
			font-size: 11px;
			font-weight: 600;
			line-height: 1.3;
			padding: 4px 10px;
			border-radius: 7px;
			cursor: pointer;
		}
		.thunder-thread-tab:hover {
			border-color: rgba(147, 197, 253, 0.55);
			color: #e2e8f0;
		}
		.thunder-thread-tab.active {
			border-color: rgba(56, 189, 248, 0.58);
			background: rgba(8, 47, 73, 0.5);
			color: #bae6fd;
		}
		.thunder-thread-tab.disabled {
			border-color: rgba(100, 116, 139, 0.3);
			background: rgba(30, 41, 59, 0.25);
			color: #64748b;
			cursor: default;
			font-size: 10px;
		}
		.thunder-access-gate {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 12px;
			height: 100%;
			min-height: 120px;
		}
		.thunder-access-status {
			font-size: 12px;
			color: #fbbf24;
			font-weight: 600;
		}
		.thunder-access-btn {
			border: 1px solid rgba(56, 189, 248, 0.5);
			background: rgba(8, 47, 73, 0.6);
			color: #bae6fd;
			font-size: 13px;
			font-weight: 700;
			padding: 10px 28px;
			border-radius: 10px;
			cursor: pointer;
			transition: background 0.15s, border-color 0.15s;
		}
		.thunder-access-btn:hover {
			background: rgba(8, 47, 73, 0.9);
			border-color: rgba(56, 189, 248, 0.8);
		}
		.thunder-access-btn:disabled {
			opacity: 0.5;
			cursor: default;
		}
		.thunder-access-btn.cancel {
			border-color: rgba(239, 68, 68, 0.4);
			background: rgba(239, 68, 68, 0.1);
			color: #fca5a5;
			font-size: 11px;
			padding: 6px 16px;
		}
		.thunder-access-btn.cancel:hover {
			background: rgba(239, 68, 68, 0.2);
		}
		.thunder-mode-banner {
			display: none;
			align-items: center;
			gap: 8px;
			padding: 8px 12px;
			background: linear-gradient(180deg, rgba(8, 47, 73, 0.44) 0%, rgba(15, 23, 42, 0.42) 100%);
			border-bottom: 1px solid rgba(14, 165, 233, 0.35);
		}
		.thunder-mode-banner-icon {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
			opacity: 0.95;
		}
		.thunder-mode-banner-copy {
			display: flex;
			flex-direction: column;
			min-width: 0;
			gap: 1px;
		}
		.thunder-mode-banner-title {
			font-size: 10px;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: #bae6fd;
		}
		.thunder-mode-banner-subtitle {
			font-size: 11px;
			color: #cbd5e1;
			line-height: 1.25;
		}

		.thunder-messages {
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
		.thunder-msg {
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
		.thunder-msg.user {
			align-self: flex-end;
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.24) 0%, rgba(22, 163, 74, 0.18) 100%);
			color: #dcfce7;
			border-color: rgba(74, 222, 128, 0.38);
			border-bottom-right-radius: 4px;
			box-shadow: 0 7px 18px rgba(34, 197, 94, 0.14), inset 0 1px 0 rgba(187, 247, 208, 0.12);
		}
		.thunder-msg.user.owner {
			background: linear-gradient(135deg, rgba(34, 197, 94, 0.28) 0%, rgba(22, 163, 74, 0.22) 100%);
			border-color: rgba(74, 222, 128, 0.42);
			box-shadow: 0 7px 18px rgba(34, 197, 94, 0.18), inset 0 1px 0 rgba(187, 247, 208, 0.14);
		}
		.thunder-msg.owner-primary,
		.thunder-msg.user.owner.owner-primary {
			background: linear-gradient(135deg, rgba(250, 204, 21, 0.20) 0%, rgba(234, 179, 8, 0.15) 100%);
			border-color: rgba(250, 204, 21, 0.38);
			box-shadow: 0 7px 18px rgba(234, 179, 8, 0.16), inset 0 1px 0 rgba(254, 249, 195, 0.14);
		}
		.thunder-msg.peer {
			align-self: flex-start;
			background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 58%, #1e40af 100%);
			color: #f8fafc;
			border-color: rgba(96, 165, 250, 0.45);
			border-bottom-left-radius: 4px;
			box-shadow: 0 9px 24px rgba(29, 78, 216, 0.3), inset 0 1px 0 rgba(219, 234, 254, 0.16);
		}
		.thunder-msg.system {
			align-self: center;
			max-width: 95%;
			background: rgba(15, 23, 42, 0.5);
			color: #93c5fd;
			font-size: 11px;
			text-align: center;
			padding: 8px 10px;
		}
		.thunder-msg-head {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			gap: 8px;
			margin-bottom: 4px;
			font-size: 10px;
		}
		.thunder-msg-auth {
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
		.thunder-msg-time {
			margin-left: auto;
			color: #94a3b8;
		}
		.thunder-msg-sender {
			font-weight: 700;
			color: #93c5fd;
		}
		.thunder-msg-sender-link {
			text-decoration: none;
			cursor: pointer;
			transition: color 0.14s ease, text-shadow 0.14s ease;
		}
		.thunder-msg-sender-link:hover {
			color: #dbeafe;
			text-shadow: 0 0 10px rgba(147, 197, 253, 0.35);
			text-decoration: underline;
			text-underline-offset: 2px;
		}
		.thunder-msg.user .thunder-msg-sender,
		.thunder-msg.user .thunder-msg-time {
			color: #86efac;
		}
		.thunder-msg.user.owner .thunder-msg-sender,
		.thunder-msg.user.owner .thunder-msg-time {
			color: #86efac;
		}
		.thunder-msg.user .thunder-msg-sender-link:hover {
			color: #bbf7d0;
			text-shadow: 0 0 10px rgba(74, 222, 128, 0.32);
		}
		.thunder-msg.peer .thunder-msg-sender,
		.thunder-msg.peer .thunder-msg-time {
			color: rgba(226, 232, 240, 0.85);
		}
		.thunder-msg.owner-primary .thunder-msg-sender,
		.thunder-msg.owner-primary .thunder-msg-time,
		.thunder-msg.user.owner.owner-primary .thunder-msg-sender,
		.thunder-msg.user.owner.owner-primary .thunder-msg-time {
			color: #facc15;
		}
		.thunder-msg.owner-primary .thunder-msg-sender-link:hover,
		.thunder-msg.user.owner.owner-primary .thunder-msg-sender-link:hover {
			color: #fef08a;
			text-shadow: 0 0 10px rgba(250, 204, 21, 0.32);
		}
		.thunder-msg.peer.owner-linked {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.38) 0%, rgba(124, 58, 237, 0.32) 100%);
			border-color: rgba(192, 132, 252, 0.44);
			box-shadow: 0 7px 18px rgba(124, 58, 237, 0.24), inset 0 1px 0 rgba(250, 245, 255, 0.16);
		}
		.thunder-msg.peer.owner-linked .thunder-msg-sender,
		.thunder-msg.peer.owner-linked .thunder-msg-time {
			color: rgba(250, 245, 255, 0.9);
		}
		.thunder-msg-actions {
			display: flex;
			gap: 4px;
			margin-top: 7px;
		}
		.thunder-msg-action {
			font-size: 10px;
			padding: 4px 6px;
			border-radius: 7px;
			border: 1px solid rgba(148, 163, 184, 0.32);
			background: rgba(15, 23, 42, 0.5);
			color: #cbd5e1;
			cursor: pointer;
		}
		.thunder-msg-action:hover {
			background: rgba(30, 41, 59, 0.72);
		}
		.thunder-msg-action.danger {
			color: #fda4af;
			border-color: rgba(248, 113, 113, 0.35);
		}
		.thunder-join-requests {
			display: flex;
			flex-direction: column;
			gap: 6px;
			margin-bottom: 6px;
			padding: 8px;
			border-radius: 10px;
			border: 1px solid rgba(56, 189, 248, 0.28);
			background: rgba(8, 47, 73, 0.24);
		}
		.thunder-join-requests-title {
			font-size: 11px;
			font-weight: 700;
			color: #bae6fd;
		}
		.thunder-join-request-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}
		.thunder-join-request-label {
			font-size: 11px;
			color: #dbeafe;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			min-width: 0;
		}
		.thunder-members-tab {
			display: flex;
			flex-direction: column;
			gap: 8px;
			padding: 8px 10px 10px;
		}
		.thunder-members-section {
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 9px;
			border-radius: 10px;
			border: 1px solid rgba(56, 189, 248, 0.2);
			background: rgba(15, 23, 42, 0.34);
		}
		.thunder-members-title {
			font-size: 11px;
			font-weight: 700;
			color: #bae6fd;
		}
		.thunder-members-empty {
			font-size: 11px;
			color: #94a3b8;
		}
		.thunder-member-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}
		.thunder-member-ident {
			display: flex;
			flex-direction: column;
			gap: 2px;
			min-width: 0;
		}
		.thunder-member-name {
			font-size: 11px;
			font-weight: 700;
			color: #dbeafe;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.thunder-member-name.owner-primary {
			color: #facc15;
		}
		a.thunder-member-link {
			text-decoration: none;
			cursor: pointer;
		}
		a.thunder-member-link:hover {
			text-decoration: underline;
		}
		a.thunder-member-link.owner-primary:hover {
			color: #fde047;
		}
		.thunder-member-address {
			font-size: 10px;
			color: #94a3b8;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.thunder-member-remove {
			border: none;
			background: transparent;
			color: #ef4444;
			font-size: 15px;
			font-weight: 700;
			line-height: 1;
			cursor: pointer;
			padding: 2px 6px;
			border-radius: 6px;
			flex-shrink: 0;
			opacity: 0.6;
			transition: opacity 0.12s ease, background 0.12s ease;
		}
		.thunder-member-remove:hover {
			opacity: 1;
			background: rgba(239, 68, 68, 0.15);
		}
		.thunder-member-remove[disabled] {
			opacity: 0.4;
			cursor: default;
		}
		.thunder-members-actions {
			display: inline-flex;
			align-items: center;
			gap: 6px;
		}

		.thunder-input-wrap {
			padding: 8px 10px 10px;
			border-top: 1px solid rgba(148, 163, 184, 0.16);
			background: rgba(2, 8, 23, 0.32);
		}
		.thunder-composer-identity {
			min-height: 18px;
			padding: 0 2px 8px;
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 8px;
			font-size: 11px;
			color: #94a3b8;
		}
		.thunder-composer-identity.owner {
			color: #e9d5ff;
		}
		.thunder-composer-identity-label {
			opacity: 0.9;
		}
		.thunder-composer-identity-pill {
			display: inline-flex;
			align-items: center;
			padding: 2px 8px;
			border-radius: 999px;
			border: 1px solid rgba(192, 132, 252, 0.45);
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.32), rgba(124, 58, 237, 0.28));
			color: #f3e8ff;
			font-weight: 700;
			font-size: 11px;
			line-height: 1.25;
		}
		.thunder-composer-identity-pill.owner-primary {
			border-color: rgba(234, 179, 8, 0.52);
			background: linear-gradient(135deg, rgba(120, 53, 15, 0.46), rgba(202, 138, 4, 0.34));
			color: #fef08a;
		}
		.thunder-at-chip {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			border-radius: 999px;
			border: 1px solid rgba(96, 165, 250, 0.5);
			background: linear-gradient(135deg, rgba(37, 99, 235, 0.55), rgba(29, 78, 216, 0.55));
			color: #dbeafe;
			font-size: 13px;
			font-weight: 700;
			cursor: pointer;
			flex-shrink: 0;
			padding: 0;
			line-height: 1;
		}
		.thunder-at-chip:hover {
			border-color: rgba(147, 197, 253, 0.7);
			background: linear-gradient(135deg, rgba(37, 99, 235, 0.72), rgba(29, 78, 216, 0.72));
			color: #eff6ff;
		}
		.thunder-author-modal {
			position: absolute;
			inset: 0;
			z-index: 10;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.thunder-author-modal-backdrop {
			position: absolute;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			border-radius: 18px;
		}
		.thunder-author-modal-content {
			position: relative;
			z-index: 1;
			max-width: 340px;
			max-height: 60%;
			width: 90%;
			padding: 16px;
			border-radius: 14px;
			border: 1px solid rgba(148, 163, 184, 0.22);
			background: rgba(16, 19, 26, 0.97);
			box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.thunder-author-modal-close {
			position: absolute;
			top: 8px;
			right: 8px;
			width: 24px;
			height: 24px;
			border: none;
			border-radius: 6px;
			background: transparent;
			color: #94a3b8;
			font-size: 18px;
			line-height: 1;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.thunder-author-modal-close:hover {
			background: rgba(148, 163, 184, 0.14);
			color: #e2e8f0;
		}
		.thunder-author-chip-grid {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			justify-content: center;
		}
		.thunder-author-filter {
			width: 100%;
			min-height: 30px;
			border-radius: 8px;
			border: 1px solid rgba(148, 163, 184, 0.28);
			background: rgba(15, 23, 42, 0.6);
			color: #dbeafe;
			font-size: 12px;
			padding: 0 10px;
			outline: none;
		}
		.thunder-author-filter:focus {
			border-color: rgba(192, 132, 252, 0.55);
		}
		.thunder-author-chip {
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
		.thunder-author-chip:hover {
			border-color: rgba(147, 197, 253, 0.5);
			color: #e2e8f0;
		}
		.thunder-author-chip.selected {
			border-color: rgba(192, 132, 252, 0.52);
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.28), rgba(124, 58, 237, 0.24));
			color: #f3e8ff;
		}
		.thunder-author-chip.owner-primary {
			border-color: rgba(234, 179, 8, 0.45);
			background: linear-gradient(135deg, rgba(120, 53, 15, 0.36), rgba(202, 138, 4, 0.25));
			color: #fde68a;
		}
		.thunder-author-chip.owner-primary:hover {
			border-color: rgba(250, 204, 21, 0.66);
			color: #fef3c7;
		}
		.thunder-author-chip.owner-primary.selected {
			border-color: rgba(250, 204, 21, 0.78);
			background: linear-gradient(135deg, rgba(113, 63, 18, 0.5), rgba(202, 138, 4, 0.4));
			color: #fef9c3;
		}
		.thunder-composer-select {
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
		.thunder-composer-select:focus {
			border-color: rgba(216, 180, 254, 0.62);
		}
		.thunder-composer-identity-address {
			font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
			color: #cbd5e1;
		}
		.thunder-input-area {
			display: flex;
			gap: 8px;
			align-items: flex-end;
		}
		.thunder-input {
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
		.thunder-input:focus {
			border-color: rgba(59, 130, 246, 0.55);
		}
		.thunder-input:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
		.thunder-send-btn {
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
		.thunder-send-btn:disabled {
			opacity: 0.45;
			cursor: default;
		}
		.thunder-send-btn svg {
			width: 18px;
			height: 18px;
		}

		body.wk-modal-open #thunder-backdrop,
		body.wk-modal-open #thunder-panel {
			display: none !important;
		}

		body.thunder-open #wallet-widget {
			opacity: 1;
			pointer-events: auto;
		}

		@media (max-width: 640px) {
			#thunder-panel {
				top: 0;
				right: 0;
				bottom: 0;
				width: 100vw;
				max-width: 100vw;
				border-radius: 0;
			}
			#thunder-bubble {
				bottom: 16px;
				right: 16px;
				width: 48px;
				height: 48px;
			}
			.thunder-sidebar {
				width: 132px;
				min-width: 132px;
			}
		}
		.thunder-loading {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 16px;
			height: 100%;
			min-height: 120px;
			opacity: 0;
			animation: thunder-load-fadein 0.4s ease 0.1s forwards;
		}
		@keyframes thunder-load-fadein {
			to { opacity: 1; }
		}
		.thunder-loading-orbs {
			position: relative;
			width: 56px;
			height: 56px;
		}
		.thunder-loading-orb {
			position: absolute;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: rgba(96, 165, 250, 0.7);
			box-shadow: 0 0 12px rgba(96, 165, 250, 0.4);
			animation: thunder-orbit 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
		}
		.thunder-loading-orb:nth-child(1) {
			animation-delay: 0s;
			background: rgba(96, 165, 250, 0.8);
		}
		.thunder-loading-orb:nth-child(2) {
			animation-delay: -0.8s;
			background: rgba(139, 92, 246, 0.7);
			box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
		}
		.thunder-loading-orb:nth-child(3) {
			animation-delay: -1.6s;
			background: rgba(74, 222, 128, 0.7);
			box-shadow: 0 0 12px rgba(74, 222, 128, 0.4);
		}
		@keyframes thunder-orbit {
			0% { top: 0; left: 50%; transform: translate(-50%, 0) scale(0.8); opacity: 0.4; }
			25% { top: 50%; left: 100%; transform: translate(-100%, -50%) scale(1); opacity: 1; }
			50% { top: 100%; left: 50%; transform: translate(-50%, -100%) scale(0.8); opacity: 0.4; }
			75% { top: 50%; left: 0; transform: translate(0, -50%) scale(1); opacity: 1; }
			100% { top: 0; left: 50%; transform: translate(-50%, 0) scale(0.8); opacity: 0.4; }
		}
		.thunder-loading-center {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%);
			animation: thunder-center-pulse 2.4s ease-in-out infinite;
		}
		@keyframes thunder-center-pulse {
			0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
			50% { transform: translate(-50%, -50%) scale(1.8); opacity: 0.15; }
		}
		.thunder-loading-text {
			color: #64748b;
			font-size: 10px;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			font-family: 'JetBrains Mono', monospace;
		}
	`
}
