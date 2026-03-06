const CDN = 'https://cdn.jsdelivr.net/npm/sui.ski@0.1.77/public'

export function skiStyleTag(): string {
	return `<link rel="stylesheet" href="${CDN}/styles.css">`
}

export function skiScriptTag(): string {
	return `<script type="module" src="${CDN}/dist/ski.js"></script>`
}

export function skiWidgetMarkup(): string {
	return `<div class="wallet-widget ski-wallet" id="wallet-widget">
\t<button class="wallet-ski-btn ski-dot-btn ski-btn ski-dot" id="ski-dot" title="Open SKI menu" aria-label="Status" style="display:none"></button>
\t<div id="ski-profile"></div>
\t<button class="wallet-ski-btn ski-btn" id="ski-btn" title="Open SKI menu" aria-label="Open SKI menu">${skiButtonDefaultSvg()}</button>
\t<div id="ski-menu"></div>
</div>
<div id="ski-modal"></div>`
}

/**
 * Generates the inline JS wallet bridge: Wallet Standard discovery + signing helpers.
 * Must be placed inside a plain <script> block (not type="module").
 *
 * Provides:
 *   _skiAddr    — connected address string (null when disconnected)
 *   _skiConn    — { address, walletName, wallet, account } (null when disconnected)
 *   _skiWallets — all discovered Sui wallet-standard objects
 *   _skiConnect(name)                         — programmatic connect
 *   _skiDisconnect()                          — programmatic disconnect
 *   _skiSignAndExecute(txOrBytes, chain?, account?)  — sign + execute tx
 *   _skiSignTransaction(txOrBytes, chain?, account?) — sign only
 *   _skiSignPersonalMessage(messageBytes)     — sign personal message
 *   _skiSubscribe(onConnect, onDisconnect)    — subscribe to state changes
 */
export function skiWalletBridge(opts: { network?: string } = {}): string {
	const _network = opts.network || 'mainnet'
	// Thin bridge that delegates everything to ski.js events.
	// ski.js handles wallet-standard discovery, connection, signing, and UI.
	// This bridge just tracks state so inline page JS can read window._skiAddr etc.
	return `// ─── .SKI Wallet Bridge (event-based, delegates to ski.js) ──────────────────
window._skiAddr = null;
window._skiConn = null;
function __skiReadPrimaryName(address) {
  if (!address) return null;
  try {
    var cached = localStorage.getItem('ski:suins:' + address);
    if (!cached) return null;
    return String(cached).replace(/\\.sui$/i, '');
  } catch (_e) {
    return null;
  }
}
function __skiBuildConn(detail) {
  var d = detail || {};
  var address = d.address || '';
  if (!address) return null;
  return {
    address: address,
    walletName: d.walletName || '',
    wallet: d.wallet || null,
    account: d.account || null,
    primaryName: d.primaryName || __skiReadPrimaryName(address),
    status: d.status || 'connected'
  };
}
function __skiEmitConn(handler, detail) {
  if (typeof handler !== 'function') return;
  handler(__skiBuildConn(detail));
}
window.addEventListener('ski:wallet-connected', function(e) {
  var d = (e && e.detail) || {};
  window._skiAddr = d.address || '';
  window._skiConn = __skiBuildConn(d);
});
window.addEventListener('ski:wallet-disconnected', function() {
  window._skiAddr = null;
  window._skiConn = null;
});
window._skiSignAndExecute = function(tx) {
  return new Promise(function(resolve, reject) {
    var rid = 'r' + Math.random().toString(36).slice(2);
    function onResult(e) {
      var d = (e && e.detail) || {};
      if (d.requestId !== rid) return;
      window.removeEventListener('ski:transaction-result', onResult);
      if (d.success) resolve(d);
      else reject(new Error(d.error || 'Transaction failed'));
    }
    window.addEventListener('ski:transaction-result', onResult);
    window.dispatchEvent(new CustomEvent('ski:sign-and-execute-transaction', { detail: { transaction: tx, requestId: rid } }));
  });
};
window._skiDisconnect = function() {
  window.dispatchEvent(new CustomEvent('ski:request-disconnect'));
};
window._skiSubscribe = function(onConnect, onDisconnect) {
  window.addEventListener('ski:wallet-connected', function(e) {
    var d = (e && e.detail) || {};
    __skiEmitConn(onConnect, d);
  });
  window.addEventListener('ski:wallet-disconnected', function() {
    if (onDisconnect) onDisconnect(null);
  });
};
// ─── End .SKI Wallet Bridge ───────────────────────────────────────────────────`
}

// Shared SKI letter paths (S, K, I) — simplified from ski.svg viewBox "0 460 1214 387"
const SKI_LETTER_PATHS = `<g><path fill="#FFF" d="M548.12 695.48c-30.3.22-60.12.77-89.94.56-41.57-.28-70.62-23.96-80.08-64.36-4.53-19.33-4.93-38.76.29-57.85 8.64-31.62 29.16-51.27 61.6-57.57 7.96-1.55 16.18-2.38 24.28-2.43 41.82-.26 83.63-.12 125.45-.19 14.49-.03 28.99-.18 43.48-.48 3.83-.08 5.25 1 5.18 5.08-.25 14.11-.1 28.22-.1 43.45-10.88 0-20.98.03-31.09 0-42.82-.18-85.63-.49-128.45-.45-7.95 0-16 .93-23.84 2.27-9.62 1.65-16.53 7.74-21.11 16.11-7.4 13.5-8.58 27.97-4.5 42.62 4.33 15.55 17.28 24.56 35.23 24.81 22.99.33 45.98.21 68.97.43 15.66.15 31.33.2 46.97.9 31 1.39 55.32 15.16 68.4 43.41 16.53 35.7 16.23 72-5.95 105.69-14.4 21.88-36.5 33.07-62.26 35.16-21.04 1.71-42.26 1.43-63.4 1.56-41.99.24-83.97.16-125.96.19-1.64 0-3.28-.14-5.56-.24 0-15.39 0-30.47 0-47.05 10.3 0 20.9-.04 31.5 0 46.14.23 92.28.6 138.43.64 9.44.01 18.73-1.06 27.64-5.41 13.41-6.54 20.44-17 22.33-31.42 1.25-9.48 1.81-19.07-1.12-28.23-4.92-15.42-16.46-23.44-32-25.67-7.88-1.13-15.93-1.06-24.39-1.52z"/><path fill="#FFF" d="M910.64 815.38c-16.95-21.85-33.63-43.46-50.39-64.5-12.06-15.5-24.21-30.92-36.33-46.38-2.6-3.31-5.68-5.09-10.22-5-13 .24-26 .21-38.99-.13-4.45-.12-5.76 1.32-5.74 5.61.1 29.82.02 59.65 0 89.47 0 13.13.01 26.26.01 39.34-17.64 0-34.69 0-52.31 0 0-106.56 0-213.13 0-320.04 17.15 0 34.55 0 52.26 0 0 46.61 0 92.83 0 140 9.18 0 17.95-.01 26.72.01 5 .01 10.06-.43 14.98.22 5.62.75 8.82-1.66 11.96-5.89 16.36-22.06 32.84-45.04 49.46-66.9 17.02-22.39 34.23-44.64 51.47-66.87.96-1.23 2.94-2.36 4.46-2.36 18.66-.1 37.32 0 55.98.1 1.24.01 2.48.5 4.84 1.01-2.33 3.67-4.01 6.83-6.16 9.62-18.16 23.62-36.38 47.2-54.64 70.74-13.57 17.49-27.22 34.91-40.87 52.34-6.05 7.73-12.13 15.43-18.35 23.03-1.96 2.4-1.19 4.16.39 6.17 8.05 10.19 16.1 20.39 24.09 30.63 17.92 22.97 35.78 46 53.73 68.95 14.25 18.22 28.62 36.36 42.92 54.54.5.63.91 1.34 2 2.97-2.51.53-4.42 1.27-6.34 1.27-16.49.05-33.03-.75-49.47-.27-8.92.53-14.31-2.21-18.36-9.67-1.81-3.33-4.53-6.16-7.07-9.49z"/><path fill="#FFF" d="M1042.05 811c0-99.39 0-198.29 0-297.23 18.1 0 34.87 0 52.05 0 .11 1.76.28 3.21.28 4.66.03 60.15.08 120.29.04 180.44-.02 42.82-.17 85.64-.27 128.45-.02 6.81-.05 6.8-6.92 6.83-13.33.06-26.66.14-39.99.19-1.47.01-2.93-.16-5.19-.29 0-7.68 0-15.11 0-22.93z"/></g>`

/**
 * Returns an inline SVG for the green-circle SKI button (pre-login default).
 * The CDN ski.js script replaces this content when it loads.
 */
export function skiButtonDefaultSvg(): string {
	return `<svg viewBox="0 460 1214 387" xmlns="http://www.w3.org/2000/svg" class="wk-ski-btn-logo"><circle cx="184" cy="658" r="152" fill="#22c55e" stroke="white" stroke-width="30"/>${SKI_LETTER_PATHS}</svg>`
}

/**
 * Returns an inline SVG for the red-hexagon SKI button (grace period).
 * Shows a red hexagon dot instead of green circle to signal the domain is in grace.
 */
export function skiButtonGraceSvg(): string {
	// Regular hexagon centered at (184, 658) with circumradius ~152, flat-top orientation
	const cx = 184,
		cy = 658,
		r = 152
	const pts: string[] = []
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i - Math.PI / 6 // flat-top: start at -30°
		pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
	}
	const hex = `<polygon points="${pts.join(' ')}" fill="#dc2626" stroke="white" stroke-width="30" stroke-linejoin="round"/>`
	return `<svg viewBox="0 460 1214 387" xmlns="http://www.w3.org/2000/svg" class="wk-ski-btn-logo">${hex}${SKI_LETTER_PATHS}</svg>`
}

/**
 * Returns the HTML for the grace period days-left pill shown alongside the SKI button.
 * Styled as a small red badge with white text.
 */
export function skiGraceDaysPill(graceDaysLeft: number): string {
	const label = graceDaysLeft <= 0 ? 'Expired' : `${graceDaysLeft}d`
	return `<span class="ski-grace-pill">${label}</span>`
}

/**
 * Bridges old onConnect/onDisconnect string callbacks to new CustomEvents.
 * Emits: ski:wallet-connected → { address, walletName }, ski:wallet-disconnected
 */
export function skiEventBridge(opts: { onConnect?: string; onDisconnect?: string } = {}): string {
	const { onConnect, onDisconnect } = opts
	const lines: string[] = []
	if (onConnect) {
		lines.push(
			`window.addEventListener('ski:wallet-connected',function(e){var d=e&&e.detail||{};(${onConnect})(d.address,d.walletName);});`,
		)
	}
	if (onDisconnect) {
		lines.push(
			`window.addEventListener('ski:wallet-disconnected',function(){(${onDisconnect})();});`,
		)
	}
	return lines.join('\n')
}
