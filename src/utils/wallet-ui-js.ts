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
	background: rgba(0,0,0,0.75);
	backdrop-filter: blur(10px);
	-webkit-backdrop-filter: blur(10px);
	z-index: 13000;
	align-items: center;
	justify-content: center;
	padding: 20px;
}
.wk-modal-overlay.open { display: flex; }
.wk-modal {
	background: linear-gradient(180deg, #1a1b23 0%, #13141a 100%);
	border: 1px solid rgba(255,255,255,0.07);
	border-radius: 24px;
	max-width: 400px;
	width: 100%;
	overflow: hidden;
	box-shadow: 0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04);
	animation: wk-modal-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes wk-modal-in {
	from { opacity: 0; transform: scale(0.95) translateY(10px); }
	to { opacity: 1; transform: scale(1) translateY(0); }
}
.wk-modal-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 22px 24px 0;
}
.wk-modal-header-left {
	display: flex;
	align-items: center;
	gap: 10px;
}
.wk-modal-logo svg {
	display: block;
}
.wk-modal-header h3 {
	font-size: 1.1rem;
	font-weight: 700;
	margin: 0;
	color: #ededf5;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	letter-spacing: -0.02em;
}
.wk-modal-subtitle {
	padding: 5px 24px 18px;
	color: #4e4e64;
	font-size: 0.76rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	letter-spacing: 0.01em;
}
.wk-modal-close {
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.06);
	color: #5e5e74;
	font-size: 1.15rem;
	cursor: pointer;
	padding: 0;
	line-height: 1;
	width: 30px;
	height: 30px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 10px;
	transition: all 0.15s;
}
.wk-modal-close:hover { background: rgba(255,255,255,0.1); color: #d0d0e0; }

.wk-social-section {
	padding: 0 20px;
}
.wk-social-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
}
.wk-social-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 7px;
	padding: 16px 6px 13px;
	background: rgba(255,255,255,0.025);
	border: 1px solid rgba(255,255,255,0.06);
	border-radius: 14px;
	cursor: pointer;
	transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	color: #8e8ea4;
	font-size: 0.7rem;
	font-weight: 500;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	letter-spacing: 0.02em;
}
.wk-social-btn:hover {
	background: rgba(255,255,255,0.06);
	border-color: rgba(255,255,255,0.14);
	color: #d8d8ec;
	transform: translateY(-2px);
	box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.wk-social-btn:active {
	transform: translateY(0);
	transition-duration: 0.05s;
}
.wk-social-btn svg {
	width: 24px;
	height: 24px;
	flex-shrink: 0;
}
.wk-powered-by {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	padding: 12px 0 4px;
	color: #33334a;
	font-size: 0.65rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	letter-spacing: 0.06em;
	text-transform: uppercase;
}
.wk-powered-by img {
	width: 13px;
	height: 13px;
	border-radius: 3px;
	opacity: 0.5;
}
.wk-divider {
	display: flex;
	align-items: center;
	padding: 10px 24px 6px;
	gap: 14px;
}
.wk-divider::before, .wk-divider::after {
	content: '';
	flex: 1;
	height: 1px;
	background: rgba(255,255,255,0.05);
}
.wk-divider span {
	color: #3e3e56;
	font-size: 0.68rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	white-space: nowrap;
	letter-spacing: 0.06em;
	text-transform: uppercase;
}

.wk-wallet-list {
	padding: 4px 14px 18px;
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.wk-wallet-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 14px;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.18s;
	color: #b0b0c8;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	font-size: 0.88rem;
	font-weight: 500;
	width: 100%;
	text-align: left;
	letter-spacing: -0.005em;
}
.wk-wallet-item:hover {
	background: rgba(255,255,255,0.04);
	border-color: rgba(255,255,255,0.07);
	color: #e8e8f5;
}
.wk-wallet-item:active {
	background: rgba(255,255,255,0.06);
	transform: scale(0.99);
	transition-duration: 0.05s;
}
.wk-wallet-item img {
	width: 28px;
	height: 28px;
	border-radius: 8px;
	flex-shrink: 0;
}
.wk-wallet-item .wk-wallet-name {
	flex: 1;
}
.wk-wallet-item .wk-recent-badge {
	font-size: 0.62rem;
	font-weight: 600;
	color: #60a5fa;
	background: rgba(96,165,250,0.1);
	border: 1px solid rgba(96,165,250,0.15);
	padding: 2px 7px;
	border-radius: 6px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
}

.wk-no-wallets {
	text-align: center;
	padding: 24px 20px;
	color: #5a5a6e;
	font-size: 0.85rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	line-height: 1.5;
}
.wk-no-wallets a {
	display: inline-block;
	margin-top: 8px;
	color: #60a5fa;
	text-decoration: none;
	font-size: 0.82rem;
}
.wk-no-wallets a:hover { text-decoration: underline; }
.wk-detecting {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 28px;
	color: #5a5a6e;
	font-size: 0.85rem;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
.wk-spinner {
	width: 20px;
	height: 20px;
	border: 2px solid rgba(96,165,250,0.12);
	border-top-color: #60a5fa;
	border-radius: 50%;
	animation: wk-spin 0.8s linear infinite;
}
@keyframes wk-spin { to { transform: rotate(360deg); } }
.wk-retry-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 10px 24px;
	margin-top: 12px;
	background: rgba(255,255,255,0.05);
	border: 1px solid rgba(255,255,255,0.1);
	border-radius: 10px;
	color: #b0b0c8;
	font-size: 0.82rem;
	font-weight: 500;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
	cursor: pointer;
	transition: all 0.15s;
}
.wk-retry-btn:hover {
	background: rgba(255,255,255,0.08);
	border-color: rgba(255,255,255,0.16);
	color: #e0e0f0;
}

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
	background: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(200,210,255,0.08));
	border-color: rgba(255,255,255,0.22);
	color: #fff;
	font-size: 1.05rem;
	font-weight: 800;
	padding: 10px 22px;
	min-height: 44px;
	letter-spacing: 0.08em;
	text-shadow: 0 0 12px rgba(255,255,255,0.7), 0 0 28px rgba(255,255,255,0.3);
	box-shadow: 0 4px 20px rgba(2,6,23,0.4), 0 0 20px rgba(255,255,255,0.1);
}
.wk-widget-btn.connected {
	background: linear-gradient(135deg, rgba(59,130,246,0.19), rgba(99,102,241,0.18));
	border-color: rgba(96,165,250,0.36);
	color: #fff;
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
#waap-wallet-iframe-container {
	z-index: 13001 !important;
	background-color: rgba(0,0,0,0.7) !important;
}
#waap-wallet-iframe-wrapper {
	height: 480px !important;
	max-height: 80vh !important;
	background: transparent !important;
	overflow: hidden !important;
	border-radius: 16px !important;
}
#waap-wallet-iframe {
	height: 480px !important;
	max-height: 80vh !important;
	border-radius: 16px !important;
	box-shadow: 0 12px 48px rgba(0,0,0,0.7) !important;
	background: #1a1a1a !important;
	color-scheme: dark !important;
}
#waap-wallet-iframe-container div[style*="background"] {
	background: transparent !important;
	background-color: transparent !important;
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

		function __wkNormalizeSuiAddress(addr) {
			var value = typeof addr === 'string' ? addr.trim() : '';
			if (!value) return '';
			if (value.indexOf('0x') !== 0 && /^[0-9a-fA-F]+$/.test(value)) {
				return '0x' + value;
			}
			return value;
		}

		function __wkIsValidSuiAddress(addr) {
			var normalized = __wkNormalizeSuiAddress(addr);
			return /^0x[0-9a-fA-F]{1,64}$/.test(normalized);
		}

	    var __wkModalContainer = null;
	    var __wkWidgetContainer = null;
	    var __wkModalUnsub = null;
	    var __wkWidgetUnsub = null;
	    var __wkWidgetDocClickBound = false;
	    var __wkWidgetBtnMarkup = '';
	    var __wkWidgetBtnStateClass = '';
	    var __wkWidgetDropdownMarkup = '';
	    var __wkLastWalletKey = 'sui_ski_last_wallet';

    var __wkPortfolioTimer = null;
    var __wkPortfolioData = null;

	    function __wkFormatBalance(sui) {
	      if (sui < 0.01) return '< 0.01';
	      if (sui < 10000) {
	        var snapped = Math.round(sui);
	        if (Math.abs(sui - snapped) <= 0.05) return String(snapped);
	      }
	      if (sui < 100) {
	        return sui.toFixed(2).replace(/\\.?0+$/, '');
	      }
	      if (sui < 10000) return sui.toFixed(1);
	      if (sui < 1000000) return (sui / 1000).toFixed(1) + 'k';
	      return (sui / 1000000).toFixed(1) + 'M';
	    }

    function __wkFormatUsd(usd) {
      if (usd < 0.01) return '< $0.01';
      if (usd < 100) return '$' + usd.toFixed(2);
      if (usd < 10000) return '$' + usd.toFixed(0);
      if (usd < 1000000) return '$' + (usd / 1000).toFixed(1) + 'k';
      return '$' + (usd / 1000000).toFixed(1) + 'M';
    }

    async function __wkFetchPortfolio(address) {
      try {
        var suiClient = typeof getSuiClient === 'function' ? getSuiClient() : null;
        if (!suiClient) return null;

        var SUI_TYPE = '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
        var suiBal = await suiClient.getBalance({ owner: address, coinType: SUI_TYPE }).catch(function() { return { totalBalance: '0' }; });
        var suiAmount = Number(BigInt(suiBal.totalBalance)) / 1e9;
        var totalSui = suiAmount;
        var holdings = [{ name: 'SUI', balance: suiAmount, suiValue: suiAmount }];

        var pools = await fetch('/api/deepbook-pools').then(function(r) { return r.json(); }).catch(function() { return []; });
        if (pools.length) {
          var balances = await Promise.all(
            pools.map(function(p) {
              return suiClient.getBalance({ owner: address, coinType: p.coinType }).catch(function() { return { totalBalance: '0' }; });
            })
          );
          for (var i = 0; i < pools.length; i++) {
            var bal = Number(BigInt(balances[i].totalBalance));
            if (bal <= 0) continue;
            var tokenAmount = bal / Math.pow(10, pools[i].decimals);
            var suiValue = tokenAmount * pools[i].suiPerToken * 0.95;
            totalSui += suiValue;
            holdings.push({ name: pools[i].name, balance: tokenAmount, suiValue: suiValue });
          }
        }

        var usdcData = await fetch('/api/usdc-price').then(function(r) { return r.json(); }).catch(function() { return null; });
        var usdcPerSui = usdcData && usdcData.usdcPerSui ? usdcData.usdcPerSui : 0;

        return { totalSui: totalSui, usdcPerSui: usdcPerSui, holdings: holdings };
      } catch (e) {
        return null;
      }
    }

    function __wkStartPortfolioPolling(address) {
      __wkStopPortfolioPolling();
      function poll() {
        __wkFetchPortfolio(address).then(function(data) {
          if (data) {
            __wkPortfolioData = data;
            __wkUpdateWidget(SuiWalletKit.$connection.value);
          }
        });
      }
      poll();
      __wkPortfolioTimer = setInterval(poll, 60000);
    }

    function __wkStopPortfolioPolling() {
      if (__wkPortfolioTimer) {
        clearInterval(__wkPortfolioTimer);
        __wkPortfolioTimer = null;
      }
      __wkPortfolioData = null;
    }

    function __wkDefaultIcon() {
      return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="#818cf8" cx="16" cy="16" r="16"/></svg>');
    }

    var __wkWaaPIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNjM2NmYxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjYTg1NWY3Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9InVybCgjZykiIHJ4PSIyNCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE0LDE0KSBzY2FsZSgxKSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02Mi4xOCAwQzY3LjYzIDAgNzEuNjUgMy4xIDc0LjQ4IDcuMDljMi41OCAzLjY0IDQuMzcgOC4yNiA1LjY0IDEyLjc3IDQuNTEgMS4yNiA5LjEzIDMuMDQgMTIuNzcgNS42MiAzLjk5IDIuODMgNy4xIDYuODUgNy4xIDEyLjMgMCA1LjAyLTIuNTUgOS4wNy02Ljg4IDEyLjIgNC4zMyAzLjEzIDYuODggNy4xOCA2Ljg5IDEyLjIgMCA1LjQ1LTMuMSA5LjQ3LTcuMDkgMTIuMy0zLjY0IDIuNTgtOC4yNiA0LjM3LTEyLjc3IDUuNjQtMS4yNiA0LjUyLTMuMDQgOS4xNC01LjYyIDEyLjc4LTIuODMgMy45OS02Ljg1IDcuMS0xMi4zIDcuMS01LjAyIDAtOS4wNy0yLjU1LTEyLjItNi44OC0zLjEzIDQuMzMtNy4xOCA2Ljg4LTEyLjIgNi44OS01LjQ1IDAtOS40Ny0zLjEtMTIuMy03LjA5LTIuNTgtMy42NC00LjM3LTguMjYtNS42NC0xMi43Ny00LjUxLTEuMjYtOS4xMy0zLjA1LTEyLjc3LTUuNjJDMy4xMiA3MS42OSAwIDY3LjY3IDAgNjIuMjJjMC01LjAyIDIuNTUtOS4wNyA2Ljg5LTEyLjJDMi41NiA0Ni44OSAwIDQyLjg0IDAgMzcuODIgMCAzMi4zNyAzLjEgMjguMzUgNy4wOSAyNS41MmMzLjY0LTIuNTggOC4yNi00LjM3IDEyLjc3LTUuNjQgMS4yNi00LjUyIDMuMDQtOS4xNCA1LjYyLTEyLjc4QzI4LjMxIDMuMTEgMzIuMzMgMC4wMSAzNy43OCAwLjAxYzUuMDIgMCA5LjA3IDIuNTUgMTIuMiA2Ljg4QzUzLjExIDIuNTYgNTcuMTYgMCA2Mi4xOCAwem0wIDUuNjJjLTMuMjcgMC02LjMyIDEuODQtOS4wMyA2Ljc2LTEuMzcgMi40OC00Ljk1IDIuNDgtNi4zMiAwLTIuNzItNC45Mi01Ljc4LTYuNzYtOS4wNC02Ljc2LTMuMDEgMC01LjUyIDEuNjMtNy43MiA0LjczLTIuMjMgMy4xNC0zLjg5IDcuNS01LjA0IDEyLjEtLjMzIDEuMjUtMS4zIDIuMjItMi41NCAyLjU1LTQuNiAxLjIxLTguOTUgMi44Ny0xMi4xIDUuMUM3LjI0IDMyLjMgNS42MiAzNC44MSA1LjYyIDM3LjgyYzAgMy4yNyAxLjg0IDYuMzIgNi43NiA5LjA0IDIuNDggMS4zNyAyLjQ4IDQuOTUgMCA2LjMyLTQuOTIgMi43Mi02Ljc2IDUuNzgtNi43NiA5LjA0IDAgMy4wMSAxLjYzIDUuNTIgNC43MyA3LjcyIDMuMTQgMi4yMyA3LjUgMy44OSAxMi4xIDUuMDggMS4xNy4zIDIuMSAxLjE4IDIuNDggMi4zMWwuMDcuMjMuMjMuODZjMS4xOSA0LjI4IDIuNzggOC4yOSA0Ljg3IDExLjI0IDIuMiAzLjEgNC43MSA0LjcyIDcuNzIgNC43MiAzLjI3IDAgNi4zMi0xLjg0IDkuMDQtNi43N2wuMTMtLjIyYzEuNDEtMi4xOCA0LjY0LTIuMTggNi4wNSAwbC4xMy4yMi4yNi40NWMyLjY1IDQuNTggNS42MiA2LjMxIDguNzggNi4zMSAzLjAxIDAgNS41Mi0xLjYzIDcuNzItNC43MiAyLjIzLTMuMTQgMy44OS03LjUgNS4wOC0xMi4xLjMzLTEuMjUgMS4zLTIuMjIgMi41NC0yLjU1IDQuNi0xLjIxIDguOTUtMi44NyAxMi4xLTUuMSAzLjEtMi4yIDQuNzItNC43MSA0LjcyLTcuNzIgMC0zLjI3LTEuODQtNi4zMi02Ljc3LTkuMDQtMi40OC0xLjM3LTIuNDgtNC45NSAwLTYuMzJsLjQ1LS4yNmM0LjU4LTIuNjUgNi4zMS01LjYyIDYuMzEtOC43OCAwLTMuMDEtMS42My01LjUyLTQuNzMtNy43Mi0zLjE0LTIuMjMtNy41LTMuODktMTIuMS01LjA0LTEuMjUtLjMyLTIuMjItMS4zLTIuNTQtMi41NC0xLjIxLTQuNi0yLjg3LTguOTUtNS4xLTEyLjEtMi4yLTMuMS00LjcxLTQuNzItNy43Mi00LjcyeiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNNjIuNjcgNjMuMTVjLjk1LTEuMjMgMi43MS0xLjQ2IDMuOTQtLjUxIDEuMjMuOTUgMS40NiAyLjcxLjUxIDMuOTQtMy4xOSA0LjE1LTguOTggNi45Ni0xNS4xNSA3LjQ4LTYuMjcuNTMtMTMuMjYtMS4yNy0xOC44NS02Ljc5LTEuMS0xLjA5LTEuMTEtMi44Ny0uMDItMy45NyAxLjA5LTEuMSAyLjg3LTEuMTEgMy45Ny0uMDIgNC4yNyA0LjIxIDkuNTcgNS42IDE0LjQzIDUuMTkgNC45Ni0uNDIgOS4xNC0yLjY3IDExLjE3LTUuMzJ6IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0zOS42NiAzMC44NGMxLjQ0IDAgMi41NS43MyAzLjI4IDEuNDguNzIuNzQgMS4yNCAxLjY3IDEuNjIgMi41OS43NiAxLjg1IDEuMTcgNC4yMSAxLjE3IDYuNjcgMCAyLjQ2LS40IDQuODMtMS4xNiA2LjY4LS4zOC45Mi0uOSAxLjg1LTEuNjIgMi41OS0uNzMuNzUtMS44NCAxLjQ4LTMuMjggMS40OC0xLjQ0IDAtMi41NS0uNzItMy4yOC0xLjQ3LS43Mi0uNzQtMS4yNC0xLjY3LTEuNjItMi41OS0uNzYtMS44NS0xLjE3LTQuMjEtMS4xNy02LjY3IDAtMi40Ni40LTQuODMgMS4xNi02LjY4LjM4LS45Mi45LTEuODUgMS42Mi0yLjU5LjczLS43NSAxLjg0LTEuNDggMy4yOC0xLjQ4eiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNNjAuMzMgMzAuODRsLjI3LjAxYzEuMzEuMDggMi4zMy43NiAzLjAxIDEuNDcuNzIuNzQgMS4yNCAxLjY3IDEuNjIgMi41OS43NiAxLjg1IDEuMTcgNC4yMSAxLjE3IDYuNjcgMCAyLjQ2LS40IDQuODMtMS4xNiA2LjY4LS4zOC45Mi0uOSAxLjg1LTEuNjIgMi41OS0uNzMuNzUtMS44NCAxLjQ4LTMuMjggMS40OC0xLjQ0IDAtMi41NS0uNzItMy4yOC0xLjQ3LS43Mi0uNzQtMS4yNC0xLjY3LTEuNjItMi41OS0uNzYtMS44NS0xLjE3LTQuMjEtMS4xNy02LjY3IDAtMi40Ni40LTQuODMgMS4xNi02LjY4LjM4LS45Mi45LTEuODUgMS42Mi0yLjU5LjczLS43NSAxLjg0LTEuNDggMy4yOC0xLjQ4eiIgZmlsbD0id2hpdGUiLz48L2c+PC9zdmc+Cg==';

    var __wkSocialIcons = {
      google: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>',
      github: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#8e8ea4"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/></svg>',
      email: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8e8ea4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>',
      phone: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#8e8ea4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2"/></svg>',
      x: '<svg viewBox="0 0 24 24" width="20" height="20" fill="#8e8ea4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
      discord: '<svg viewBox="0 0 24 24" width="22" height="22" fill="#8e8ea4"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
      coinbase: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="12" r="11" stroke="#8e8ea4" stroke-width="1.5"/><path d="M14.5 10.5h-5v3h5v-3z" fill="#8e8ea4" rx="0.5"/></svg>'
    };

    var __wkLogoSvg = '<svg viewBox="0 0 512 512" width="28" height="28" fill="none"><defs><linearGradient id="wk-lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs><path d="M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z" fill="url(#wk-lg)"/><path d="M128 384Q208 348 288 384Q368 420 432 384" stroke="url(#wk-lg)" stroke-width="24" fill="none" stroke-linecap="round"/></svg>';

    function __wkGetLastWallet() {
      try { return localStorage.getItem(__wkLastWalletKey) || ''; } catch (_e) { return ''; }
    }

	    function __wkSetLastWallet(name) {
	      try { localStorage.setItem(__wkLastWalletKey, name); } catch (_e) {}
	    }

	    var __wkWaaPMethodByAddressKey = 'sui_ski_waap_method_by_address_v1';
	    var __wkPendingWaaPMethod = '';
	    var __wkWaaPMethodLabels = {
	      x: 'X',
	      phone: 'Phone',
	      email: 'Email',
	      google: 'Google',
	      coinbase: 'Coinbase',
	      discord: 'Discord',
	    };

	    function __wkNormalizeWaaPMethod(method) {
	      var key = String(method || '').trim().toLowerCase();
	      return __wkWaaPMethodLabels[key] ? key : '';
	    }

	    function __wkRememberPendingWaaPMethod(method) {
	      __wkPendingWaaPMethod = __wkNormalizeWaaPMethod(method);
	    }

	    function __wkReadSessionWalletName() {
	      try {
	        if (typeof getWalletSession !== 'function') return '';
	        var session = getWalletSession();
	        return session && session.walletName ? String(session.walletName) : '';
	      } catch (_e) {
	        return '';
	      }
	    }

	    function __wkGetConnectionWalletName(conn) {
	      if (conn && conn.wallet && conn.wallet.name) return String(conn.wallet.name);
	      return __wkReadSessionWalletName();
	    }

	    function __wkGetWaaPMethodMap() {
	      try {
	        var raw = localStorage.getItem(__wkWaaPMethodByAddressKey);
	        if (!raw) return {};
	        var parsed = JSON.parse(raw);
	        return parsed && typeof parsed === 'object' ? parsed : {};
	      } catch (_e) {
	        return {};
	      }
	    }

	    function __wkSetWaaPMethodMap(map) {
	      try {
	        localStorage.setItem(__wkWaaPMethodByAddressKey, JSON.stringify(map || {}));
	      } catch (_e) {}
	    }

	    function __wkSaveWaaPMethodForAddress(address, method) {
	      var normalizedAddress = __wkNormalizeSuiAddress(address).toLowerCase();
	      var normalizedMethod = __wkNormalizeWaaPMethod(method);
	      if (!normalizedAddress || !normalizedMethod) return;
	      var map = __wkGetWaaPMethodMap();
	      map[normalizedAddress] = normalizedMethod;
	      __wkSetWaaPMethodMap(map);
	    }

	    function __wkGetWaaPMethodForAddress(address) {
	      var normalizedAddress = __wkNormalizeSuiAddress(address).toLowerCase();
	      if (!normalizedAddress) return '';
	      var map = __wkGetWaaPMethodMap();
	      return __wkNormalizeWaaPMethod(map[normalizedAddress]);
	    }

	    function __wkPersistPendingWaaPMethod(address) {
	      if (!__wkPendingWaaPMethod) return;
	      __wkSaveWaaPMethodForAddress(address, __wkPendingWaaPMethod);
	      __wkPendingWaaPMethod = '';
	    }

	    function __wkGetWaaPConnectionHint(conn) {
	      var walletName = __wkGetConnectionWalletName(conn).trim().toLowerCase();
	      if (walletName !== 'waap') return '';
	      var method = __wkGetWaaPMethodForAddress(conn && conn.address ? conn.address : '') || __wkPendingWaaPMethod;
	      var methodLabel = method ? (__wkWaaPMethodLabels[method] || '') : '';
	      return methodLabel ? ('WaaP via ' + methodLabel) : 'WaaP connected';
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
      return '<div class="wk-no-wallets">'
        + 'No wallets detected.'
        + '<br><br>'
        + '<a href="https://phantom.app/download" target="_blank" rel="noopener noreferrer">Get Phantom \\u2192</a>'
        + '<br>'
        + '<a href="https://backpack.app" target="_blank" rel="noopener noreferrer">Get Backpack \\u2192</a>'
        + '<br>'
        + '<a href="https://slush.app" target="_blank" rel="noopener noreferrer">Get Slush \\u2192</a>'
        + '<br>'
        + '<a href="https://suiet.app" target="_blank" rel="noopener noreferrer">Get Suiet \\u2192</a>'
        + '</div>';
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

    function __wkShowConnectError(containerEl, err, walletName) {
      containerEl.innerHTML = '<div class="wk-detecting" style="color:#f87171;text-align:center;font-size:0.82rem;line-height:1.5;">'
        + __wkFormatConnectError(err, walletName)
        + '<br><button type="button" class="wk-retry-btn">Try Again</button>'
        + '</div>';
      var retryBtn = containerEl.querySelector('.wk-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function() {
          __wkPopulateModal();
        });
      }
    }

    function __wkFindWaaPWallet() {
      var sources = [SuiWalletKit.$wallets.value || []];
      try {
        var api = typeof getWallets === 'function' ? getWallets() : null;
        if (api) sources.push(api.get());
      } catch (e) {}
      for (var s = 0; s < sources.length; s++) {
        var list = sources[s];
        for (var i = 0; i < list.length; i++) {
          var name = list[i].name ? String(list[i].name).toLowerCase() : '';
          if (name === 'waap') return list[i];
        }
      }
      return null;
    }

	    function __wkConnectWaaPSocial(wallets, waapMethod) {
	      __wkRememberPendingWaaPMethod(waapMethod);
	      if (__wkIsSubdomain()) {
	        __wkConnectWaaPViaBridge(waapMethod);
	        return;
	      }
      var waapWallet = __wkFindWaaPWallet();
      if (!waapWallet) {
        var socialSection = __wkModalContainer && __wkModalContainer.querySelector('.wk-social-section');
        if (socialSection) {
          __wkShowConnectError(socialSection, { message: 'WaaP wallet is still loading, please try again' }, 'WaaP');
        }
        return;
      }
	      SuiWalletKit.closeModal();
	      SuiWalletKit.connect(waapWallet).then(function() {
	        var conn = SuiWalletKit.$connection.value || null;
	        if (conn && conn.address) __wkPersistPendingWaaPMethod(conn.address);
	        __wkSetLastWallet('WaaP');
	      }).catch(function(err) {
	        __wkPendingWaaPMethod = '';
	        SuiWalletKit.openModal();
	        setTimeout(function() {
	          var socialSection = __wkModalContainer && __wkModalContainer.querySelector('.wk-social-section');
          if (socialSection) {
            __wkShowConnectError(socialSection, err, 'WaaP');
          }
        }, 100);
      });
    }

	    function __wkConnectWaaPViaBridge(waapMethod) {
	      __wkRememberPendingWaaPMethod(waapMethod);
	      SuiWalletKit.closeModal();
      var bridge = SuiWalletKit.__skiSignFrame;
      var bridgeReady = SuiWalletKit.__skiSignReady;
      if (!bridge) {
        SuiWalletKit.__initSignBridge();
        bridge = SuiWalletKit.__skiSignFrame;
        bridgeReady = SuiWalletKit.__skiSignReady;
      }
      var requestId = 'waap-' + Date.now();
      (bridgeReady || Promise.resolve(true)).then(function(ready) {
        if (!ready || !bridge || !bridge.contentWindow) {
          SuiWalletKit.openModal();
          return;
        }
	        bridge.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:13001;border:none;background:transparent;';
        bridge.contentWindow.postMessage({
          type: 'ski:connect-waap',
          requestId: requestId
        }, 'https://sui.ski');
        var timeout = setTimeout(function() {
          cleanup();
          bridge.style.cssText = 'display:none;width:0;height:0;border:none';
          SuiWalletKit.openModal();
        }, 120000);
        function cleanup() {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
        }
        function handleResponse(ev) {
          if (ev.origin !== 'https://sui.ski') return;
          if (!ev.data || ev.data.requestId !== requestId) return;
	          if (ev.data.type === 'ski:connected') {
	            cleanup();
	            bridge.style.cssText = 'display:none;width:0;height:0;border:none';
	            SuiWalletKit.initFromSession(ev.data.address, 'WaaP');
	            __wkPersistPendingWaaPMethod(ev.data.address);
	            __wkSetLastWallet('WaaP');
	            if (typeof connectWalletSession === 'function') {
	              connectWalletSession('WaaP', ev.data.address);
	            }
	          } else if (ev.data.type === 'ski:connect-error') {
	            __wkPendingWaaPMethod = '';
	            cleanup();
	            bridge.style.cssText = 'display:none;width:0;height:0;border:none';
	            SuiWalletKit.openModal();
            setTimeout(function() {
              var socialSection = __wkModalContainer && __wkModalContainer.querySelector('.wk-social-section');
              if (socialSection) {
                __wkShowConnectError(socialSection, { message: ev.data.error }, 'WaaP');
              }
            }, 100);
          }
        }
        window.addEventListener('message', handleResponse);
      });
    }

    function __wkRenderSocialSection(container, wallets) {
      var socialEl = container.querySelector('.wk-social-section');
      var dividerEl = container.querySelector('.wk-divider');
      if (!socialEl) return;

      socialEl.style.display = '';
      if (dividerEl) dividerEl.style.display = '';

      var grid = socialEl.querySelector('.wk-social-grid');
      if (!grid) return;

      var socialOptions = [
        { key: 'x', label: 'X' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'google', label: 'Google' },
        { key: 'coinbase', label: 'Coinbase' },
        { key: 'discord', label: 'Discord' }
      ];

      grid.innerHTML = '';
      for (var s = 0; s < socialOptions.length; s++) {
        (function(opt) {
          var btn = document.createElement('button');
          btn.className = 'wk-social-btn';
          btn.innerHTML = (__wkSocialIcons[opt.key] || '') + '<span>' + opt.label + '</span>';
          btn.addEventListener('click', function() {
            var waapLoading = typeof __wkWaaPLoading !== 'undefined' ? __wkWaaPLoading : (window.__wkWaaPLoading || null);
            if (waapLoading) {
              btn.disabled = true;
              btn.style.opacity = '0.6';
              waapLoading.then(function() {
                btn.disabled = false;
                btn.style.opacity = '';
	                __wkConnectWaaPSocial(SuiWalletKit.$wallets.value || wallets, opt.key);
	              }).catch(function() {
	                btn.disabled = false;
	                btn.style.opacity = '';
	              });
	            } else {
	              __wkConnectWaaPSocial(wallets, opt.key);
	            }
	          });
          grid.appendChild(btn);
        })(socialOptions[s]);
      }
    }

    function __wkSortWithRecent(wallets) {
      var lastWalletName = __wkGetLastWallet().toLowerCase();
      if (!lastWalletName) return wallets;
      var recent = [];
      var rest = [];
      for (var i = 0; i < wallets.length; i++) {
        var wName = wallets[i].name ? String(wallets[i].name).toLowerCase() : '';
        if (wName === lastWalletName) {
          recent.push(wallets[i]);
        } else {
          rest.push(wallets[i]);
        }
      }
      return recent.concat(rest);
    }

    function __wkConnectViaBridge(walletName, listEl) {
      var bridge = SuiWalletKit.__skiSignFrame;
      var bridgeReady = SuiWalletKit.__skiSignReady;
      if (!bridge) {
        SuiWalletKit.__initSignBridge();
        bridge = SuiWalletKit.__skiSignFrame;
        bridgeReady = SuiWalletKit.__skiSignReady;
      }
      var requestId = 'connect-' + Date.now();
      (bridgeReady || Promise.resolve(true)).then(function(ready) {
        if (!ready || !bridge || !bridge.contentWindow) {
          __wkShowConnectError(listEl, { message: 'Bridge not available' }, walletName);
          return;
        }
        bridge.contentWindow.postMessage({
          type: 'ski:connect',
          requestId: requestId,
          walletName: walletName
        }, 'https://sui.ski');
        var timeout = setTimeout(function() {
          cleanup();
          __wkShowConnectError(listEl, { message: 'Connection timed out' }, walletName);
        }, 120000);
        function cleanup() {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
        }
        function handleResponse(ev) {
          if (ev.origin !== 'https://sui.ski') return;
          if (!ev.data || ev.data.requestId !== requestId) return;
          if (ev.data.type === 'ski:connected') {
            cleanup();
            SuiWalletKit.initFromSession(ev.data.address, ev.data.walletName || walletName);
            __wkSetLastWallet(ev.data.walletName || walletName);
            if (typeof connectWalletSession === 'function') {
              connectWalletSession(ev.data.walletName || walletName, ev.data.address);
            }
          } else if (ev.data.type === 'ski:connect-error') {
            cleanup();
            __wkShowConnectError(listEl, { message: ev.data.error }, walletName);
          }
        }
        window.addEventListener('message', handleResponse);
      });
    }

    function __wkRenderWalletItems(listEl, wallets) {
      if (!wallets || wallets.length === 0) {
        listEl.innerHTML = __wkInstallLinksHtml();
        return;
      }
      var lastWalletName = __wkGetLastWallet().toLowerCase();
      var sorted = __wkSortWithRecent(wallets);
      var isSubdomain = __wkIsSubdomain();
      listEl.innerHTML = '';
      for (var i = 0; i < sorted.length; i++) {
        (function(wallet) {
          var item = document.createElement('button');
          item.className = 'wk-wallet-item';
          var name = wallet.name || 'Unknown';
          var iconSrc = wallet.icon || __wkDefaultIcon();
          var isRecent = lastWalletName && name.toLowerCase() === lastWalletName;
          item.innerHTML = '<img src="' + iconSrc + '" alt="" onerror="this.style.display=\\'none\\'">'
            + '<span class="wk-wallet-name">' + name + '</span>'
            + (isRecent ? '<span class="wk-recent-badge">Recent</span>' : '');
	          item.addEventListener('click', function() {
	            listEl.innerHTML = '<div class="wk-detecting"><div class="wk-spinner"></div> Connecting...</div>';
	            if (isSubdomain) {
	              __wkConnectViaBridge(name, listEl);
	            } else {
	              SuiWalletKit.connect(wallet).then(function() {
	                __wkSetLastWallet(name);
	              }).catch(function(err) {
	                __wkShowConnectError(listEl, err, name);
	              });
	            }
	          });
	          listEl.appendChild(item);
	        })(sorted[i]);
	      }
    }

    function __wkRenderSplit(wallets) {
      if (!__wkModalContainer) return;
      var listEl = __wkModalContainer.querySelector('.wk-wallet-list');
      if (!listEl) return;

      var nonWaaPWallets = [];
      for (var i = 0; i < wallets.length; i++) {
        var name = wallets[i].name ? String(wallets[i].name).toLowerCase() : '';
        if (name !== 'waap') {
          nonWaaPWallets.push(wallets[i]);
        }
      }

      __wkRenderSocialSection(__wkModalContainer, wallets);
      __wkRenderWalletItems(listEl, nonWaaPWallets);
    }

    function __wkPopulateModal() {
      if (!__wkModalContainer) return;
      var listEl = __wkModalContainer.querySelector('.wk-wallet-list');
      if (!listEl) return;
      listEl.innerHTML = '<div class="wk-detecting"><div class="wk-spinner"></div> Detecting wallets...</div>';
      if (__wkIsSubdomain() && typeof SuiWalletKit.__initSignBridge === 'function') {
        try { SuiWalletKit.__initSignBridge(); } catch (_e) {}
      }

      var immediate = SuiWalletKit.$wallets.value;
      if (immediate && immediate.length > 0) {
        __wkRenderSplit(immediate);
      }
      SuiWalletKit.detectWallets().then(function(wallets) {
        if (wallets && wallets.length > 0) {
          __wkRenderSplit(wallets);
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
        + '<div class="wk-modal-header-left">'
        + '<span class="wk-modal-logo">' + __wkLogoSvg + '</span>'
        + '<h3>.Sui Key-In</h3>'
        + '</div>'
        + '<button class="wk-modal-close" id="__wk-close">\\u00D7</button>'
        + '</div>'
        + '<div class="wk-modal-subtitle">sign once, access all *.sui.ski</div>'
        + '<div class="wk-social-section" style="display:none">'
        + '<div class="wk-social-grid"></div>'
        + '<div class="wk-powered-by"><img src="' + __wkWaaPIcon + '" alt=""> powered by WaaP</div>'
        + '</div>'
        + '<div class="wk-divider" style="display:none"><span>or connect wallet</span></div>'
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

	    SuiWalletKit.openModal = function openModal() {
	      if (!__wkModalContainer) return;
	      var overlay = __wkModalContainer.querySelector('.wk-modal-overlay');
	      if (overlay) {
	        overlay.classList.add('open');
	        try { document.body.classList.add('wk-modal-open'); } catch (_e) {}
	        __wkPopulateModal();
	      }
	    };

	    SuiWalletKit.closeModal = function closeModal() {
	      if (!__wkModalContainer) return;
	      var overlay = __wkModalContainer.querySelector('.wk-modal-overlay');
	      if (overlay) overlay.classList.remove('open');
	      try { document.body.classList.remove('wk-modal-open'); } catch (_e) {}
	    };

		    function __wkBuildDropdownHtml(conn) {
	      var rawAddr = conn && conn.address ? conn.address : '';
	      var normalizedAddr = __wkNormalizeSuiAddress(rawAddr);
	      var addr = normalizedAddr || rawAddr;
	      var primaryName = ${showPrimaryName} ? (conn && conn.primaryName ? conn.primaryName : null) : null;
	      var connectionHint = __wkGetWaaPConnectionHint(conn);
	      var html = '';

      if (__wkPortfolioData && __wkPortfolioData.holdings && __wkPortfolioData.holdings.length > 0) {
        html += '<div style="padding:8px 12px 4px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">';
        html += '<span style="font-size:0.7rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Portfolio</span>';
	        html += '<span style="font-size:0.82rem;font-weight:600;color:#e2e8f0;">~' + __wkFormatBalance(__wkPortfolioData.totalSui) + __wkSuiIconSvg + '</span>';
        html += '</div>';
        var sorted = __wkPortfolioData.holdings.slice().sort(function(a, b) { return b.suiValue - a.suiValue; });
        for (var h = 0; h < sorted.length && h < 6; h++) {
          var holding = sorted[h];
          if (holding.suiValue < 0.001) continue;
          var balFmt = holding.balance < 0.01 ? '< 0.01' : holding.balance < 100 ? holding.balance.toFixed(2) : holding.balance < 10000 ? holding.balance.toFixed(1) : (holding.balance / 1000).toFixed(1) + 'k';
          var suiValFmt = __wkFormatBalance(holding.suiValue);
          html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;font-size:0.75rem;color:#94a3b8;">';
          html += '<span>' + holding.name + '</span>';
	          html += '<span style="color:#cbd5e1;">' + balFmt + ' <span style="opacity:0.5;">(' + suiValFmt + __wkSuiIconSvg + ')</span></span>';
          html += '</div>';
        }
        html += '</div>';
      }

      if (addr) {
        html += '<div style="padding:6px 12px 6px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px;cursor:pointer;" id="__wk-dd-addr-display" title="Click to copy full address">';
        html += '<div style="font-size:0.65rem;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px">Your Address</div>';
        html += '<div style="font-size:0.68rem;color:#94a3b8;word-break:break-all;line-height:1.35;font-family:SF Mono,Fira Code,monospace">' + __wkEscapeHtml(addr) + '</div>';
	        if (connectionHint) {
	          html += '<div style="font-size:0.62rem;margin-top:4px;color:#cbd5e1;">' + __wkEscapeHtml(connectionHint) + '</div>';
	        }
	        html += '</div>';
	      }

      html += '<button class="wk-dropdown-item" id="__wk-dd-copy" style="position:relative;">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
        + 'Copy Address</button>';

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

		    var __wkSuiIconSvg = '<svg viewBox="0 0 300 384" width="10" height="13" aria-hidden="true" focusable="false" style="display:inline-block;vertical-align:-2px;margin-left:4px;fill:#4DA2FF;"><path fill-rule="evenodd" clip-rule="evenodd" d="M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007 -0.655678 147.993 -0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z"></path></svg>';

	    function __wkBindDropdownEvents(conn) {
      var copyBtn = document.getElementById('__wk-dd-copy');
      var addrDisplay = document.getElementById('__wk-dd-addr-display');
      var switchBtn = document.getElementById('__wk-dd-switch');
      var disconnectBtn = document.getElementById('__wk-dd-disconnect');

      function __wkCopyAddress(targetEl) {
        var rawAddr = conn && conn.address ? conn.address : '';
        var normalizedAddr = __wkNormalizeSuiAddress(rawAddr);
        var addr = __wkIsValidSuiAddress(normalizedAddr) ? normalizedAddr : rawAddr;
        if (!addr) return;
        navigator.clipboard.writeText(addr).then(function() {
          var flash = document.createElement('span');
          flash.className = 'wk-copied-flash';
          flash.textContent = 'Copied!';
          targetEl.appendChild(flash);
          setTimeout(function() { flash.remove(); }, 1500);
        });
      }
      if (copyBtn) {
        copyBtn.addEventListener('click', function() { __wkCopyAddress(copyBtn); });
      }
      if (addrDisplay) {
        addrDisplay.addEventListener('click', function() { __wkCopyAddress(addrDisplay); });
      }
      if (switchBtn) {
        switchBtn.addEventListener('click', function() {
          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
          if (dropdown) dropdown.classList.remove('open');
          var bridge = SuiWalletKit.__skiSignFrame;
          if (bridge && bridge.contentWindow) {
            bridge.contentWindow.postMessage({ type: 'ski:disconnect' }, 'https://sui.ski');
          }
          SuiWalletKit.disconnect();
          setTimeout(function() { SuiWalletKit.openModal(); }, 120);
        });
      }
      if (disconnectBtn) {
        disconnectBtn.addEventListener('click', function() {
          var dropdown = __wkWidgetContainer && __wkWidgetContainer.querySelector('.wk-dropdown');
          if (dropdown) dropdown.classList.remove('open');
          var bridge = SuiWalletKit.__skiSignFrame;
          if (bridge && bridge.contentWindow) {
            bridge.contentWindow.postMessage({ type: 'ski:disconnect' }, 'https://sui.ski');
          }
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
	        var normalizedAddress = __wkNormalizeSuiAddress(conn.address);
	        var hasValidAddress = __wkIsValidSuiAddress(normalizedAddress);
	        var addressForLabel = hasValidAddress ? normalizedAddress : String(conn.address || '');
	        var isPrimaryName = ${showPrimaryName} && conn.primaryName;
	        var label = isPrimaryName ? conn.primaryName : __wkTruncAddr(addressForLabel);
	        var safeLabel = isPrimaryName
	          ? '<span style="color:#ffd700;font-weight:700">' + __wkEscapeHtml(label) + '</span>'
	          : __wkEscapeHtml(label);
	        var walletIcon = conn.wallet && conn.wallet.icon ? conn.wallet.icon : '';
	        var connectionHint = __wkGetWaaPConnectionHint(conn);
		        var balanceLine = '';
		        if (__wkPortfolioData) {
		          var suiFmt = __wkFormatBalance(__wkPortfolioData.totalSui);
		          balanceLine = '<div style="display:flex;flex-direction:column;gap:0;opacity:1;color:#fff;font-weight:500;margin-top:1px;">';
		          balanceLine += '<span style="font-size:0.66rem;line-height:1.15;">~' + suiFmt + __wkSuiIconSvg + '</span>';
		          if (__wkPortfolioData.usdcPerSui > 0) {
		            balanceLine += '<span style="font-size:0.6rem;line-height:1.1;opacity:0.88;color:#ffe8a0;">' + __wkFormatUsd(__wkPortfolioData.totalSui * __wkPortfolioData.usdcPerSui) + '</span>';
		          }
		          balanceLine += '</div>';
		        }
	        var nextBtnMarkup = '';
	        if (walletIcon) {
	          nextBtnMarkup = '<img src="' + walletIcon + '" alt="" style="width:18px;height:18px;border-radius:5px;flex-shrink:0" onerror="this.style.display=\\'none\\'"> <div style="display:flex;flex-direction:column;line-height:1.2;">' + safeLabel + balanceLine + '</div>';
	        } else if (conn.status === 'session') {
	          var waapMethod = connectionHint ? (__wkGetWaaPMethodForAddress(conn.address || '') || __wkPendingWaaPMethod) : '';
	          if (connectionHint && waapMethod) {
	            var methodSvg = waapMethod && __wkSocialIcons[waapMethod] ? __wkSocialIcons[waapMethod].replace(/width="\\d+"/, 'width="18"').replace(/height="\\d+"/, 'height="18"').replace(/fill="[^"]*"/, 'fill="#e2e8f0"') : '';
	            if (methodSvg) {
	              nextBtnMarkup = '<span style="display:flex;align-items:center;justify-content:center;flex-shrink:0">' + methodSvg + '</span> <div style="display:flex;flex-direction:column;line-height:1.2;">' + safeLabel + balanceLine + '</div>';
	            } else {
	              nextBtnMarkup = '<img src="' + __wkWaaPIcon + '" alt="" style="width:18px;height:18px;border-radius:5px;flex-shrink:0" onerror="this.style.display=\\'none\\'"> <div style="display:flex;flex-direction:column;line-height:1.2;">' + safeLabel + balanceLine + '</div>';
	            }
	          } else if (connectionHint) {
	            nextBtnMarkup = '<img src="' + __wkWaaPIcon + '" alt="" style="width:18px;height:18px;border-radius:5px;flex-shrink:0" onerror="this.style.display=\\'none\\'"> <div style="display:flex;flex-direction:column;line-height:1.2;">' + safeLabel + balanceLine + '</div>';
	          } else {
	            nextBtnMarkup = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:0.6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> <div style="display:flex;flex-direction:column;line-height:1.2;">' + safeLabel + balanceLine + '</div>';
	          }
	        } else {
	          nextBtnMarkup = '<div style="display:flex;flex-direction:column;line-height:1.2;">' + safeLabel + balanceLine + '</div>';
	        }
	        if (__wkWidgetBtnMarkup !== nextBtnMarkup) {
	          btn.innerHTML = nextBtnMarkup;
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
	        __wkStopPortfolioPolling();
	        if (__wkWidgetBtnMarkup !== '.ski') {
	          btn.textContent = '.ski';
	          __wkWidgetBtnMarkup = '.ski';
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
	          + '<button class="wk-widget-btn" data-wk-role="toggle">.ski</button>'
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
	      var __wkLastPollingAddr = null;
	      __wkWidgetUnsub = SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
	        var rawAddr = conn && (conn.status === 'connected' || conn.status === 'session') ? conn.address : null;
	        var normalizedAddr = __wkNormalizeSuiAddress(rawAddr || '');
	        var addr = __wkIsValidSuiAddress(normalizedAddr) ? normalizedAddr : null;
	        if (addr && addr !== __wkLastPollingAddr) {
	          __wkLastPollingAddr = addr;
	          __wkStartPortfolioPolling(addr);
	        } else if (!addr && __wkLastPollingAddr) {
	          __wkLastPollingAddr = null;
	          __wkStopPortfolioPolling();
	        }
	        __wkUpdateWidget(conn);
	      });

	      var initConn = SuiWalletKit.$connection.value;
	      if (initConn && (initConn.status === 'connected' || initConn.status === 'session') && initConn.address) {
	        var initAddr = __wkNormalizeSuiAddress(initConn.address || '');
	        if (__wkIsValidSuiAddress(initAddr)) {
	          __wkLastPollingAddr = initAddr;
	          __wkStartPortfolioPolling(initAddr);
	        }
	      }
	      __wkUpdateWidget(initConn);
	    };
	  `
}
