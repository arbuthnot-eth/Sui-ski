interface WalletUiConfig {
	showPrimaryName?: boolean
	onConnect?: string
	onDisconnect?: string
}

export function generateWalletUiCss(): string {
	return `
.wk-modal-overlay {
	display: none;
	position: fixed;
	inset: 0;
	background: rgba(0,0,0,0.7);
	backdrop-filter: blur(4px);
	z-index: 10000;
	align-items: center;
	justify-content: center;
	padding: 20px;
}
.wk-modal-overlay.open { display: flex; }
.wk-modal {
	background: #1a1a1a;
	border: 1px solid rgba(255,255,255,0.08);
	border-radius: 16px;
	max-width: 400px;
	width: 100%;
	overflow: hidden;
	box-shadow: 0 12px 48px rgba(0,0,0,0.7);
}
.wk-modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 18px 20px;
	border-bottom: 1px solid rgba(255,255,255,0.06);
}
.wk-modal-header h3 {
	font-size: 1rem;
	font-weight: 600;
	margin: 0;
	color: #e4e4e7;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}
.wk-modal-close {
	background: none;
	border: none;
	color: #71717a;
	font-size: 1.4rem;
	cursor: pointer;
	padding: 0;
	line-height: 1;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8px;
	transition: background 0.15s, color 0.15s;
}
.wk-modal-close:hover { background: rgba(255,255,255,0.1); color: #e4e4e7; }
.wk-wallet-list {
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.wk-wallet-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 14px;
	background: rgba(255,255,255,0.03);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 12px;
	cursor: pointer;
	transition: border-color 0.2s, background 0.2s;
	color: #e4e4e7;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
	font-size: 0.9rem;
	font-weight: 600;
	width: 100%;
	text-align: left;
}
.wk-wallet-item:hover {
	border-color: #60a5fa;
	background: rgba(96,165,250,0.1);
}
.wk-wallet-item img {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	flex-shrink: 0;
}
.wk-no-wallets {
	text-align: center;
	padding: 20px;
	color: #71717a;
	font-size: 0.9rem;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}
.wk-no-wallets a {
	display: inline-block;
	margin-top: 12px;
	color: #60a5fa;
	text-decoration: none;
}
.wk-no-wallets a:hover { text-decoration: underline; }
.wk-detecting {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 24px;
	color: #71717a;
	font-size: 0.9rem;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}
.wk-spinner {
	width: 20px;
	height: 20px;
	border: 2px solid rgba(96,165,250,0.15);
	border-top-color: #60a5fa;
	border-radius: 50%;
	animation: wk-spin 0.8s linear infinite;
}
@keyframes wk-spin { to { transform: rotate(360deg); } }
.wk-widget { position: relative; display: inline-block; }
.wk-widget-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.1);
	border-radius: 10px;
	color: #e4e4e7;
	font-size: 0.85rem;
	font-weight: 600;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
	cursor: pointer;
	min-height: 38px;
	backdrop-filter: blur(8px);
	-webkit-backdrop-filter: blur(8px);
	box-shadow: 0 4px 18px rgba(2, 6, 23, 0.36);
	transition: background 0.16s, border-color 0.16s, transform 0.16s, box-shadow 0.16s;
}
.wk-widget-btn:hover {
	background: rgba(96,165,250,0.12);
	border-color: rgba(96,165,250,0.3);
	transform: translateY(-1px);
	box-shadow: 0 8px 22px rgba(30, 64, 175, 0.22);
}
.wk-widget-btn:not(.connected) {
	background: linear-gradient(135deg, rgba(96,165,250,0.08), rgba(56,189,248,0.08));
	border-color: rgba(96,165,250,0.2);
	letter-spacing: 0.05em;
}
.wk-widget-btn.connected {
	background: linear-gradient(135deg, rgba(59,130,246,0.19), rgba(99,102,241,0.18));
	border-color: rgba(96,165,250,0.36);
}
.wk-widget-btn.session-only {
	background: linear-gradient(135deg, rgba(96,165,250,0.1), rgba(139,92,246,0.1));
	border: 1px dashed rgba(96,165,250,0.35);
}
.wk-dropdown {
	display: block;
	visibility: hidden;
	opacity: 0;
	pointer-events: none;
	transform: translateY(-4px) scale(0.985);
	transform-origin: top right;
	transition: opacity 0.16s ease, transform 0.16s ease, visibility 0s linear 0.16s;
	position: absolute;
	right: 0;
	top: calc(100% + 6px);
	min-width: 224px;
	padding: 8px;
	background:
		linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98)),
		radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 55%);
	border: 1px solid rgba(96, 165, 250, 0.26);
	border-radius: 14px;
	box-shadow: 0 18px 44px rgba(2, 6, 23, 0.62), inset 0 1px 0 rgba(148, 163, 184, 0.12);
	z-index: 9999;
}
.wk-dropdown.open {
	visibility: visible;
	opacity: 1;
	pointer-events: auto;
	transform: translateY(0) scale(1);
	transition-delay: 0s;
}
.wk-dropdown-item {
	display: flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	padding: 11px 12px;
	background: none;
	border: 1px solid transparent;
	border-radius: 10px;
	color: #e2e8f0;
	font-size: 0.85rem;
	font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
	cursor: pointer;
	transition: background 0.16s, border-color 0.16s, color 0.16s, transform 0.16s;
	text-decoration: none;
	text-align: left;
}
.wk-dropdown-item + .wk-dropdown-item {
	margin-top: 4px;
}
.wk-dropdown-item:hover {
	background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(30, 64, 175, 0.14));
	border-color: rgba(96, 165, 250, 0.32);
	color: #f8fafc;
	transform: translateY(-1px);
}
.wk-dropdown-item svg {
	width: 16px;
	height: 16px;
	flex-shrink: 0;
	opacity: 0.82;
	color: #93c5fd;
}
.wk-dropdown-item.disconnect {
	color: #fca5a5;
}
.wk-dropdown-item.disconnect svg {
	color: #f87171;
}
.wk-dropdown-item.disconnect:hover {
	background: linear-gradient(135deg, rgba(127, 29, 29, 0.36), rgba(69, 10, 10, 0.28));
	border-color: rgba(248, 113, 113, 0.34);
	color: #fee2e2;
}
.wk-copied-flash {
	position: absolute;
	right: 14px;
	top: 50%;
	transform: translateY(-50%);
	color: #34d399;
	font-size: 0.75rem;
	font-weight: 600;
	pointer-events: none;
	animation: wk-fade 1.5s ease forwards;
}
@keyframes wk-fade {
	0% { opacity: 1; }
	70% { opacity: 1; }
	100% { opacity: 0; }
}
`
}

export function generateWalletUiJs(config?: WalletUiConfig): string {
	const showPrimaryName = config?.showPrimaryName ?? true
	const onConnect = config?.onConnect ?? ''
	const onDisconnect = config?.onDisconnect ?? ''

	return `
    function __wkTruncAddr(addr) {
      return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
    }

	    var __wkModalContainer = null;
	    var __wkWidgetContainer = null;
	    var __wkModalUnsub = null;
	    var __wkWidgetUnsub = null;
	    var __wkWidgetDocClickBound = false;
	    var __wkWidgetBtnMarkup = '';
	    var __wkWidgetBtnStateClass = '';
	    var __wkWidgetDropdownMarkup = '';

    function __wkDefaultIcon() {
      return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="#818cf8" cx="16" cy="16" r="16"/></svg>');
    }

    function __wkHasPasskeySupport() {
      try {
        return typeof window.PublicKeyCredential !== 'undefined'
          && !!navigator.credentials
          && typeof navigator.credentials.create === 'function';
      } catch (e) {
        return false;
      }
    }

    function __wkInstallLinksHtml() {
      var html = '<div class="wk-no-wallets">'
        + 'No Sui wallets detected in this browser.'
        + '<br><br>';
      if (__wkHasPasskeySupport()) {
        html += '<span style="display:inline-block;margin-top:6px;font-size:0.78rem;color:#52525b;">Passkey wallet is available from the wallet list above.</span><br>';
      } else {
        html += '<span style="display:inline-block;margin-top:6px;font-size:0.78rem;color:#52525b;">This browser does not support passkey wallet creation.</span><br>';
      }
      html += '<br>'
        + '<a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer">Install Phantom \\u2192</a>'
        + '<br>'
        + '<a href="https://slush.app" target="_blank" rel="noopener noreferrer">Install Slush \\u2192</a>'
        + '<br>'
        + '<a href="https://suiet.app" target="_blank" rel="noopener noreferrer">Install Suiet \\u2192</a>'
        + '<br>'
        + '<a href="https://martianwallet.xyz" target="_blank" rel="noopener noreferrer">Install Martian \\u2192</a>'
        + '<br>'
        + '<a href="https://ethoswallet.xyz" target="_blank" rel="noopener noreferrer">Install Ethos \\u2192</a>'
        + '<br>'
        + '<a href="https://www.okx.com/web3" target="_blank" rel="noopener noreferrer">Install OKX Wallet \\u2192</a>'
        + '<br>'
        + '<a href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil" target="_blank" rel="noopener noreferrer">Install Sui Wallet \\u2192</a>'
        + '</div>';
      return html;
    }

    function __wkFormatConnectError(err, walletName) {
      var message = '';
      if (err && typeof err.message === 'string' && err.message) {
        message = String(err.message);
      } else if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err.name === 'string' && err.name) {
        message = err.name;
      } else {
        message = 'Connection failed';
      }
      var lower = message.toLowerCase();
      if (
        lower.indexOf('not been authorized') !== -1
        || lower.indexOf('not authorized') !== -1
        || lower.indexOf('unauthorized') !== -1
        || lower.indexOf('something went wrong') !== -1
      ) {
        if (walletName === 'Phantom') {
          return 'Phantom has not authorized Sui accounts for this site yet. Open Phantom app permissions for this site, allow Sui account access, then retry.';
        }
      }
      if (
        walletName === 'Passkey Wallet'
        && (
        lower.indexOf('unexpected') !== -1
        || lower.indexOf('notallowederror') !== -1
        || lower.indexOf('invalidstateerror') !== -1
        )
      ) {
        return 'Passkey setup failed. Use a supported browser profile with passkeys enabled and try again.';
      }
      return message;
    }

    function __wkRenderWalletItems(listEl, wallets) {
      if (!wallets || wallets.length === 0) {
        listEl.innerHTML = __wkInstallLinksHtml();
        return;
      }
      listEl.innerHTML = '';
      for (var i = 0; i < wallets.length; i++) {
        (function(wallet) {
          var item = document.createElement('button');
          item.className = 'wk-wallet-item';
          var iconSrc = wallet.icon || __wkDefaultIcon();
          var name = wallet.name || 'Unknown';
          item.innerHTML = '<img src="' + iconSrc + '" alt="" onerror="this.style.display=\\'none\\'">'
            + '<span>' + name + '</span>';
	          item.addEventListener('click', function() {
	            listEl.innerHTML = '<div class="wk-detecting"><div class="wk-spinner"></div> Connecting...</div>';
	            SuiWalletKit.connect(wallet).catch(function(err) {
	              var formattedError = __wkFormatConnectError(err, wallet.name || '');
	              listEl.innerHTML = '<div class="wk-detecting" style="color:#f87171;">'
	                + 'Connection failed: ' + formattedError
	                + '<br><br><button type="button" class="wk-wallet-item wk-retry-connect" style="justify-content:center;">Try Again</button>'
	                + '</div>';
	              var retryBtn = listEl.querySelector('.wk-retry-connect');
	              if (retryBtn) {
	                retryBtn.addEventListener('click', function() {
	                  __wkPopulateModal();
	                });
	              }
	            });
	          });
	          listEl.appendChild(item);
	        })(wallets[i]);
	      }
    }

    function __wkPopulateModal() {
      if (!__wkModalContainer) return;
      var listEl = __wkModalContainer.querySelector('.wk-wallet-list');
      if (!listEl) return;
      listEl.innerHTML = '<div class="wk-detecting"><div class="wk-spinner"></div> Detecting wallets...</div>';
      var immediate = SuiWalletKit.$wallets.value;
      if (immediate && immediate.length > 0) {
        __wkRenderWalletItems(listEl, immediate);
      }
      SuiWalletKit.detectWallets().then(function(wallets) {
        if (wallets && wallets.length > 0) {
          __wkRenderWalletItems(listEl, wallets);
        } else if (!immediate || immediate.length === 0) {
          listEl.innerHTML = __wkInstallLinksHtml();
        }
      }).catch(function() {
        if (!immediate || immediate.length === 0) {
          listEl.innerHTML = __wkInstallLinksHtml();
        }
      });
    }

    SuiWalletKit.renderModal = function renderModal(containerId) {
      var container = document.getElementById(containerId);
      if (!container) throw new Error('Modal container not found: ' + containerId);
      __wkModalContainer = container;

      container.innerHTML = '<div class="wk-modal-overlay" id="__wk-overlay">'
        + '<div class="wk-modal">'
        + '<div class="wk-modal-header">'
        + '<h3>Sui Key-In</h3>'
        + '<button class="wk-modal-close" id="__wk-close">\\u00D7</button>'
        + '</div>'
        + '<div style="padding:0 20px 8px;color:#71717a;font-size:0.75rem;font-family:SF Mono,Fira Code,Cascadia Code,monospace;">sign once, access all *.sui.ski</div>'
        + '<div class="wk-wallet-list"></div>'
        + '</div>'
        + '</div>';

      var overlay = document.getElementById('__wk-overlay');
      var closeBtn = document.getElementById('__wk-close');

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) SuiWalletKit.closeModal();
      });
      closeBtn.addEventListener('click', function() {
        SuiWalletKit.closeModal();
      });

      if (__wkModalUnsub) __wkModalUnsub();
      __wkModalUnsub = SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
        if (conn && (conn.status === 'connected' || conn.status === 'session')) {
          SuiWalletKit.closeModal();
          ${onConnect ? `if (typeof window['${onConnect}'] === 'function') window['${onConnect}']();` : ''}
        }
        if (conn && conn.status === 'disconnected') {
          ${onDisconnect ? `if (typeof window['${onDisconnect}'] === 'function') window['${onDisconnect}']();` : ''}
        }
      });
    };

	    function __wkIsSubdomain() {
	      var host = window.location.hostname;
	      return host !== 'sui.ski' && host.endsWith('.sui.ski');
	    }

	    function __wkRedirectToSharedConnect() {
	      window.location.href = 'https://sui.ski/in?return=' + encodeURIComponent(window.location.href);
	    }

	    SuiWalletKit.openModal = function openModal() {
	      var conn = SuiWalletKit.$connection.value;
	      var isSessionOnly = conn && conn.status === 'session';
	      if (__wkIsSubdomain()) {
	        if (isSessionOnly) return;
	      }
	      if (!__wkModalContainer) {
	        if (__wkIsSubdomain()) __wkRedirectToSharedConnect();
	        return;
	      }
	      var overlay = __wkModalContainer.querySelector('.wk-modal-overlay');
	      if (overlay) {
	        overlay.classList.add('open');
	        __wkPopulateModal();
	        if (__wkIsSubdomain()) {
	          var hasPasskey = __wkHasPasskeySupport();
	          SuiWalletKit.detectWallets().then(function(wallets) {
	            var hasWalletOptions = Array.isArray(wallets) && wallets.length > 0;
	            if (!hasWalletOptions && !hasPasskey) {
	              __wkRedirectToSharedConnect();
	            }
	          }).catch(function() {
	            if (!hasPasskey) {
	              __wkRedirectToSharedConnect();
	            }
	          });
	        }
	      }
	    };

    SuiWalletKit.closeModal = function closeModal() {
      if (!__wkModalContainer) return;
      var overlay = __wkModalContainer.querySelector('.wk-modal-overlay');
      if (overlay) overlay.classList.remove('open');
    };

	    function __wkBuildDropdownHtml(conn) {
      var addr = conn && conn.address ? conn.address : '';
      var primaryName = ${showPrimaryName} ? (conn && conn.primaryName ? conn.primaryName : null) : null;
      var html = '';

      html += '<button class="wk-dropdown-item" id="__wk-dd-copy" style="position:relative;">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
        + 'Copy Address</button>';

      // Always show My Profile link to me.sui.ski
      var profileHref = primaryName 
        ? 'https://' + encodeURIComponent(primaryName) + '.sui.ski'
        : 'https://me.sui.ski';
      html += '<a class="wk-dropdown-item" href="' + profileHref + '">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>'
        + 'My Profile</a>';

      html += '<button class="wk-dropdown-item" id="__wk-dd-switch">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>'
        + 'Switch Wallet</button>';

      html += '<button class="wk-dropdown-item disconnect" id="__wk-dd-disconnect">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
        + 'Disconnect</button>';

	      return html;
	    }

	    function __wkEscapeHtml(value) {
	      var text = String(value || '');
	      return text
	        .replace(/&/g, '&amp;')
	        .replace(/</g, '&lt;')
	        .replace(/>/g, '&gt;')
	        .replace(/"/g, '&quot;')
	        .replace(/'/g, '&#39;');
	    }

    function __wkBindDropdownEvents(conn) {
      var copyBtn = document.getElementById('__wk-dd-copy');
      var switchBtn = document.getElementById('__wk-dd-switch');
      var disconnectBtn = document.getElementById('__wk-dd-disconnect');

      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          var addr = conn && conn.address ? conn.address : '';
          navigator.clipboard.writeText(addr).then(function() {
            var flash = document.createElement('span');
            flash.className = 'wk-copied-flash';
            flash.textContent = 'Copied!';
            copyBtn.appendChild(flash);
            setTimeout(function() { flash.remove(); }, 1500);
          });
        });
      }
      if (switchBtn) {
        switchBtn.addEventListener('click', function() {
          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
          if (dropdown) dropdown.classList.remove('open');
          SuiWalletKit.disconnect();
          setTimeout(function() { SuiWalletKit.openModal(); }, 120);
        });
      }
      if (disconnectBtn) {
        disconnectBtn.addEventListener('click', function() {
          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
          if (dropdown) dropdown.classList.remove('open');
          SuiWalletKit.disconnect();
        });
      }
    }

	    function __wkUpdateWidget(conn) {
	      if (!__wkWidgetContainer) return;
	      var widget = __wkWidgetContainer.querySelector('.wk-widget');
	      if (!widget) return;
	      var btn = widget.querySelector('.wk-widget-btn');
	      var dropdown = widget.querySelector('.wk-dropdown');
	      if (!btn || !dropdown) return;

	      var isActive = conn && (conn.status === 'connected' || conn.status === 'session') && conn.address;
	      if (isActive) {
	        var label = ${showPrimaryName} && conn.primaryName ? conn.primaryName : __wkTruncAddr(conn.address);
	        var safeLabel = __wkEscapeHtml(label);
	        var walletIcon = conn.wallet && conn.wallet.icon ? conn.wallet.icon : '';
	        var nextBtnMarkup = '';
	        if (walletIcon) {
	          nextBtnMarkup = '<img src="' + walletIcon + '" alt="" style="width:18px;height:18px;border-radius:5px;flex-shrink:0" onerror="this.style.display=\\'none\\'"> ' + safeLabel;
	        } else if (conn.status === 'session') {
	          nextBtnMarkup = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> ' + safeLabel;
	        } else {
	          nextBtnMarkup = safeLabel;
	        }
	        if (__wkWidgetBtnMarkup !== nextBtnMarkup) {
	          if (walletIcon || conn.status === 'session') {
	            btn.innerHTML = nextBtnMarkup;
	          } else {
	            btn.textContent = label;
	          }
	          __wkWidgetBtnMarkup = nextBtnMarkup;
	        }
	        var nextBtnStateClass = 'connected';
	        if (__wkWidgetBtnStateClass !== nextBtnStateClass) {
	          btn.classList.remove('connected', 'session-only');
	          btn.classList.add(nextBtnStateClass);
	          __wkWidgetBtnStateClass = nextBtnStateClass;
	        }
	        var nextDropdownMarkup = __wkBuildDropdownHtml(conn);
	        if (__wkWidgetDropdownMarkup !== nextDropdownMarkup) {
	          dropdown.innerHTML = nextDropdownMarkup;
	          __wkWidgetDropdownMarkup = nextDropdownMarkup;
	          __wkBindDropdownEvents(conn);
	        }
	      } else {
	        if (__wkWidgetBtnMarkup !== 'SKI') {
	          btn.textContent = 'SKI';
	          __wkWidgetBtnMarkup = 'SKI';
	        }
	        if (__wkWidgetBtnStateClass) {
	          btn.classList.remove('connected', 'session-only');
	          __wkWidgetBtnStateClass = '';
	        }
	        if (__wkWidgetDropdownMarkup) {
	          dropdown.innerHTML = '';
	          __wkWidgetDropdownMarkup = '';
	        }
	        dropdown.classList.remove('open');
	      }
	    }

	    SuiWalletKit.renderWidget = function renderWidget(containerId) {
	      var container = document.getElementById(containerId);
	      if (!container) throw new Error('Widget container not found: ' + containerId);
	      __wkWidgetContainer = container;

	      var widget = container.querySelector('.wk-widget');
	      if (!widget) {
	        container.innerHTML = '<div class="wk-widget">'
	          + '<button class="wk-widget-btn" data-wk-role="toggle">SKI</button>'
	          + '<div class="wk-dropdown"></div>'
	          + '</div>';
	        widget = container.querySelector('.wk-widget');
	        __wkWidgetBtnMarkup = '';
	        __wkWidgetBtnStateClass = '';
	        __wkWidgetDropdownMarkup = '';
	      }

	      var btn = container.querySelector('.wk-widget-btn');
	      if (btn && container.dataset.wkWidgetBound !== '1') {
	        container.dataset.wkWidgetBound = '1';
	        btn.addEventListener('click', function() {
	          var activeWidget = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-widget');
	          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
	          if (!activeWidget || !dropdown) return;
	          var conn = SuiWalletKit.$connection.value;
	          if (conn && (conn.status === 'connected' || conn.status === 'session')) {
	            dropdown.classList.toggle('open');
	          } else {
	            SuiWalletKit.openModal();
	          }
	        });
	      }
	      if (btn) {
	        try { window.__wkWidgetButton = btn; } catch (_) {}
	        try {
	          window.getWalletWidgetButton = window.getWalletWidgetButton || function() {
	            return document.querySelector('#wk-widget > div > button') || document.querySelector('#wk-widget .wk-widget-btn');
	          };
	        } catch (_) {}
	        try { window.dispatchEvent(new CustomEvent('wk-widget-ready')); } catch (_) {}
	      }

	      if (!__wkWidgetDocClickBound) {
	        __wkWidgetDocClickBound = true;
	        document.addEventListener('click', function(e) {
	          var activeContainer = __wkWidgetContainer;
	          if (!activeContainer) return;
	          var activeWidget = activeContainer.querySelector('.wk-widget');
	          var dropdown = activeContainer.querySelector('.wk-dropdown');
	          if (activeWidget && dropdown && !activeWidget.contains(e.target)) {
	            dropdown.classList.remove('open');
	          }
	        });
	      }

	      if (__wkWidgetUnsub) __wkWidgetUnsub();
	      __wkWidgetUnsub = SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
	        __wkUpdateWidget(conn);
	      });

	      __wkUpdateWidget(SuiWalletKit.$connection.value);
	    };
	  `
}
