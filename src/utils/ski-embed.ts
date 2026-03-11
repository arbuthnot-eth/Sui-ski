const CDN = 'https://cdn.jsdelivr.net/npm/sui.ski@0.1.91/public'
const WALLET_API_ESM = `${CDN}/dist/ski.js`
const WAAP_API_ESM = `${CDN}/dist/ski.js`

interface SkiSessionState {
	address: string | null
	walletName: string | null
	verified: boolean
}

interface SkiProfileButtonBridgeOptions {
	session?: SkiSessionState
	profileButtonId?: string
	profileFallbackHref?: string
	profileVisibleClass?: string
	widgetPrimaryClass?: string
}

export function skiStyleTag(): string {
	return `<link rel="stylesheet" href="${CDN}/styles.css">`
}

export function skiScriptTag(): string {
	return `<script type="module" src="${CDN}/dist/ski.js"></script>`
}

export function skiScriptLoaderTag(conditionJs?: string): string {
	if (!conditionJs) return skiScriptTag()
	return `<script type="module">if (${conditionJs}) import('${CDN}/dist/ski.js').catch(function(err){console.warn('[.SKI] Failed to load ski.js:', err);});</script>`
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
window._skiWalletApi = null;
window._skiWalletApiPromise = null;
window._skiCompatUnsub = null;
window._skiConnListeners = [];
window.__skiWaaPEnsurePromise = null;
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
function __skiNormalizeWalletName(name) {
  var normalized = String(name || '').trim().toLowerCase();
  if (!normalized) return '';
  normalized = normalized.replace(/[^a-z0-9]+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.slice(-7) === ' wallet') normalized = normalized.slice(0, -7).trim();
  return normalized.replace(/ +/g, '');
}
function __skiWalletNamesMatch(left, right) {
  var leftKey = __skiNormalizeWalletName(left);
  var rightKey = __skiNormalizeWalletName(right);
  if (!leftKey || !rightKey) return false;
  if (leftKey === rightKey) return true;
  var groups = [
    ['suiet', 'suietwallet'],
    ['phantom', 'phantomwallet'],
    ['backpack', 'backpackwallet'],
    ['keystone'],
    ['waap'],
  ];
  for (var g = 0; g < groups.length; g++) {
    var group = groups[g];
    if (group.indexOf(leftKey) !== -1 && group.indexOf(rightKey) !== -1) return true;
  }
  return (
    (leftKey.length >= 5 && leftKey.indexOf(rightKey) !== -1)
    || (rightKey.length >= 5 && rightKey.indexOf(leftKey) !== -1)
  );
}
function __skiGetRootInUrl() {
  var host = String(window.location && window.location.hostname ? window.location.hostname : '').toLowerCase();
  var href = String(window.location && window.location.href ? window.location.href : '');
  var root = 'https://sui.ski/in';
  if (host === 't.sui.ski' || host.slice(-10) === '.t.sui.ski') root = 'https://t.sui.ski/in';
  else if (host === 'd.sui.ski' || host.slice(-10) === '.d.sui.ski') root = 'https://d.sui.ski/in';
  var next = new URL(root);
  if (href) next.searchParams.set('return', href);
  return next.toString();
}
function __skiGetRootOrigin() {
  try {
    return new URL(__skiGetRootInUrl()).origin;
  } catch (_e) {
    return 'https://sui.ski';
  }
}
function __skiIsEmbedMode() {
  try {
    return new URLSearchParams(window.location.search).get('embed') === '1';
  } catch (_e) {
    return false;
  }
}
function __skiShouldDeferSigninToRoot() {
  var host = String(window.location && window.location.hostname ? window.location.hostname : '').toLowerCase();
  if (!host) return false;
  if (host === 'sui.ski' || host === 't.sui.ski' || host === 'd.sui.ski') return false;
  return host.slice(-8) === '.sui.ski' || host.slice(-10) === '.t.sui.ski' || host.slice(-10) === '.d.sui.ski';
}
function __skiShouldRegisterWaaP() {
  return !__skiIsEmbedMode() && !__skiShouldDeferSigninToRoot();
}
function __skiGetPreferredWalletName(explicitWalletName) {
  return explicitWalletName || (window._skiConn && window._skiConn.walletName) || localStorage.getItem('ski:last-wallet') || localStorage.getItem('sui_wallet_name') || '';
}
window.__skiRootFrame = null;
window.__skiRootFrameReady = false;
window.__skiRootFrameWaiters = [];
window.__skiRootBridgePending = {};
window.__skiRootBridgeBound = false;
function __skiResolveRootFrameReady() {
  window.__skiRootFrameReady = true;
  while (window.__skiRootFrameWaiters.length) {
    try {
      var waiter = window.__skiRootFrameWaiters.shift();
      if (typeof waiter === 'function') waiter();
    } catch (_e) {}
  }
}
function __skiBindRootBridgeMessages() {
  if (window.__skiRootBridgeBound) return;
  window.__skiRootBridgeBound = true;
  window.addEventListener('message', function(event) {
    if (!event || event.origin !== __skiGetRootOrigin()) return;
    var data = event.data || {};
    if (!data || data.__skiBridge !== 'root-frame') return;
    if (data.type === 'ready') {
      __skiResolveRootFrameReady();
      return;
    }
    if (data.type === 'connected' && data.conn) {
      window._skiAddr = data.conn.address || '';
      window._skiConn = __skiBuildConn(data.conn);
      __skiSetCompatConn(window._skiConn);
      window.dispatchEvent(new CustomEvent('ski:wallet-connected', { detail: data.conn }));
      return;
    }
    if (data.type === 'disconnected') {
      window._skiAddr = null;
      window._skiConn = null;
      __skiSetCompatConn(null);
      window.dispatchEvent(new CustomEvent('ski:wallet-disconnected'));
      return;
    }
    if (data.type !== 'response' || !data.requestId) return;
    var pending = window.__skiRootBridgePending[data.requestId];
    if (!pending) return;
    delete window.__skiRootBridgePending[data.requestId];
    if (data.success) pending.resolve(data.result);
    else pending.reject(new Error(data.error || 'Root frame request failed'));
  });
}
function __skiEnsureRootFrame() {
  if (!__skiShouldDeferSigninToRoot()) return Promise.resolve(null);
  __skiBindRootBridgeMessages();
  if (!window.__skiRootFrame || !window.__skiRootFrame.isConnected) {
    var frame = document.createElement('iframe');
    frame.src = __skiGetRootInUrl() + (String(__skiGetRootInUrl()).indexOf('?') === -1 ? '?' : '&') + 'embed=1';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.position = 'fixed';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    frame.style.border = '0';
    frame.style.left = '-9999px';
    frame.style.bottom = '0';
    frame.style.zIndex = '-1';
    document.documentElement.appendChild(frame);
    window.__skiRootFrame = frame;
    window.__skiRootFrameReady = false;
  }
  if (window.__skiRootFrameReady) return Promise.resolve(window.__skiRootFrame);
  return new Promise(function(resolve) {
    window.__skiRootFrameWaiters.push(function() { resolve(window.__skiRootFrame); });
  });
}
function __skiBridgeRequest(action, payload) {
  return __skiEnsureRootFrame().then(function(frame) {
    if (!frame || !frame.contentWindow) throw new Error('Root signing frame unavailable');
    return new Promise(function(resolve, reject) {
      var requestId = 'root-' + Math.random().toString(36).slice(2);
      window.__skiRootBridgePending[requestId] = { resolve: resolve, reject: reject };
      frame.contentWindow.postMessage({
        __skiBridge: 'parent',
        type: 'request',
        action: action,
        requestId: requestId,
        payload: payload || {},
      }, __skiGetRootOrigin());
      setTimeout(function() {
        if (!window.__skiRootBridgePending[requestId]) return;
        delete window.__skiRootBridgePending[requestId];
        reject(new Error('Root signing frame timed out'));
      }, 45000);
    });
  });
}
function __skiSerializeBytes(value) {
  if (!value) return [];
  if (value instanceof Uint8Array) return Array.from(value);
  if (value instanceof ArrayBuffer) return Array.from(new Uint8Array(value));
  return Array.from(value);
}
function __skiPrepareBridgeTransaction(tx) {
  if (tx instanceof Uint8Array || tx instanceof ArrayBuffer) {
    return Promise.resolve({ kind: 'bytes', value: __skiSerializeBytes(tx) });
  }
  if (typeof tx === 'string') {
    return Promise.resolve({ kind: 'text', value: tx });
  }
  if (tx && typeof tx.build === 'function') {
    var client = typeof window.getSuiClient === 'function' ? window.getSuiClient() : null;
    return Promise.resolve(client ? tx.build({ client: client }) : tx.build()).then(function(built) {
      return { kind: 'bytes', value: __skiSerializeBytes(built) };
    });
  }
  throw new Error('Unsupported transaction payload for root signer');
}
function __skiEnsureWaaPRegistered() {
  if (!__skiShouldRegisterWaaP()) return Promise.resolve(false);
  if (window.__skiWaaPEnsurePromise) return window.__skiWaaPEnsurePromise;
  window.__skiWaaPEnsurePromise = __skiLoadWalletApi().then(async function(api) {
    var wallets = api && typeof api.getSuiWallets === 'function' ? api.getSuiWallets() : [];
    var hasWaaP = false;
    for (var i = 0; i < wallets.length; i++) {
      if (__skiWalletNamesMatch(wallets[i] && wallets[i].name, 'waap')) {
        hasWaaP = true;
        break;
      }
    }
    if (hasWaaP) return true;
    try {
      var mod = await import('${WAAP_API_ESM}');
      if (mod && typeof mod.registerWaaP === 'function') {
        mod.registerWaaP();
      }
      return true;
    } catch (err) {
      console.warn('[.SKI] WaaP fallback registration failed:', err);
      return false;
    }
  }).finally(function() {
    window.__skiWaaPEnsurePromise = null;
  });
  return window.__skiWaaPEnsurePromise;
}
function __skiNotifyConnListeners(conn) {
  for (var i = 0; i < window._skiConnListeners.length; i++) {
    try {
      window._skiConnListeners[i](conn);
    } catch (_e) {}
  }
}
function __skiSetCompatConn(conn) {
  if (window.SuiWalletKit && window.SuiWalletKit.$connection) {
    window.SuiWalletKit.$connection.value = conn;
  }
  __skiNotifyConnListeners(conn);
}
function __skiLoadWalletApi() {
  if (window._skiWalletApi) return Promise.resolve(window._skiWalletApi);
  if (window._skiWalletApiPromise) return window._skiWalletApiPromise;
  window._skiWalletApiPromise = import('${WALLET_API_ESM}').then(function(mod) {
    window._skiWalletApi = mod;
    if (mod && typeof mod.subscribe === 'function') {
      if (window._skiCompatUnsub) {
        try { window._skiCompatUnsub(); } catch (_e) {}
      }
      window._skiCompatUnsub = mod.subscribe(function(state) {
        var conn = null;
        if (state && state.status === 'connected' && state.address) {
          conn = {
            address: state.address,
            walletName: state.walletName || '',
            wallet: state.wallet || null,
            account: state.account || null,
            primaryName: __skiReadPrimaryName(state.address),
            status: 'connected'
          };
          window._skiAddr = state.address;
          window._skiConn = conn;
        } else {
          window._skiAddr = null;
          window._skiConn = null;
        }
        __skiSetCompatConn(conn);
      });
    }
    if (mod && typeof mod.getState === 'function') {
      var state = mod.getState();
      if (state && state.status === 'connected' && state.address) {
        var conn = {
          address: state.address,
          walletName: state.walletName || '',
          wallet: state.wallet || null,
          account: state.account || null,
          primaryName: __skiReadPrimaryName(state.address),
          status: 'connected'
        };
        window._skiAddr = state.address;
        window._skiConn = conn;
        __skiSetCompatConn(conn);
      }
    }
    return mod;
  });
  return window._skiWalletApiPromise;
}
window.addEventListener('ski:wallet-connected', function(e) {
  var d = (e && e.detail) || {};
  window._skiAddr = d.address || '';
  window._skiConn = __skiBuildConn(d);
  __skiSetCompatConn(window._skiConn);
});
window.addEventListener('ski:wallet-disconnected', function() {
  window._skiAddr = null;
  window._skiConn = null;
  __skiSetCompatConn(null);
});
function __skiHasDirectWallet() {
  return !!(window._skiConn && window._skiConn.wallet && window._skiConn.account);
}
window._skiSignAndExecute = function(tx) {
  if (__skiShouldDeferSigninToRoot() && !__skiHasDirectWallet()) {
    return __skiPrepareBridgeTransaction(tx).then(function(serializedTx) {
      return __skiBridgeRequest('signAndExecute', {
        transaction: serializedTx,
        walletName: __skiGetPreferredWalletName(''),
      });
    });
  }
  return __skiLoadWalletApi().then(function(api) {
    return api.signAndExecuteTransaction(tx);
  });
};
window._skiConnect = function(walletName) {
  if (__skiShouldDeferSigninToRoot()) {
    var preferredWalletName = __skiGetPreferredWalletName(walletName || '');
    if (!preferredWalletName && !(window._skiConn && window._skiConn.address) && !window._skiAddr) {
      return Promise.reject(new Error('Root iframe connect requires a remembered wallet; use root sign-in'));
    }
    return __skiBridgeRequest('connect', {
      walletName: preferredWalletName,
      address: (window._skiConn && window._skiConn.address) || window._skiAddr || '',
    }).then(function(conn) {
      if (conn && conn.address) {
        window._skiAddr = conn.address;
        window._skiConn = __skiBuildConn(conn);
        __skiSetCompatConn(window._skiConn);
      }
      return window._skiConn;
    });
  }
  return __skiEnsureWaaPRegistered().then(function() {
    return __skiLoadWalletApi();
  }).then(async function(api) {
    var wallets = api && typeof api.getSuiWallets === 'function' ? api.getSuiWallets() : [];
    if (!wallets || !wallets.length) throw new Error('No Sui wallets detected');
    var target = null;
    if (walletName) {
      for (var i = 0; i < wallets.length; i++) {
        if (__skiWalletNamesMatch(wallets[i] && wallets[i].name, walletName)) {
          target = wallets[i];
          break;
        }
      }
      if (!target) throw new Error('Selected wallet not available: ' + walletName);
    }
    if (!target) target = wallets[0];
    await api.connect(target, { skipSilent: true });
    return window._skiConn;
  });
};
window._skiSignPersonalMessage = function(messageBytes) {
  if (__skiShouldDeferSigninToRoot() && !__skiHasDirectWallet()) {
    return __skiBridgeRequest('signPersonalMessage', {
      messageBytes: __skiSerializeBytes(messageBytes),
      walletName: __skiGetPreferredWalletName(''),
    });
  }
  return __skiLoadWalletApi().then(function(api) {
    return api.signPersonalMessage(messageBytes);
  });
};
window._skiSignTransaction = function(tx) {
  if (__skiShouldDeferSigninToRoot() && !__skiHasDirectWallet()) {
    return __skiPrepareBridgeTransaction(tx).then(function(serializedTx) {
      return __skiBridgeRequest('signTransaction', {
        transaction: serializedTx,
        walletName: __skiGetPreferredWalletName(''),
      });
    });
  }
  return __skiLoadWalletApi().then(function(api) {
    return api.signTransaction(tx);
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
  if (window._skiConn) {
    __skiEmitConn(onConnect, window._skiConn);
    return;
  }
  __skiLoadWalletApi().then(function(api) {
    if (window._skiConn) {
      __skiEmitConn(onConnect, window._skiConn);
      return;
    }
    if (!api || typeof api.getState !== 'function') return;
    var state = api.getState();
    if (state && state.status === 'connected' && state.address) {
      __skiEmitConn(onConnect, state);
    }
  }).catch(function() {});
};
if (!window.SuiWalletKit) {
  window.SuiWalletKit = {
    $connection: { value: null },
    subscribe: function(store, fn) {
      if (!store || store !== window.SuiWalletKit.$connection || typeof fn !== 'function') {
        return function() {};
      }
      window._skiConnListeners.push(fn);
      try { fn(store.value || null); } catch (_e) {}
      return function() {
        var idx = window._skiConnListeners.indexOf(fn);
        if (idx !== -1) window._skiConnListeners.splice(idx, 1);
      };
    },
    autoReconnect: function() {
      return __skiLoadWalletApi().then(function(api) {
        if (api && typeof api.autoReconnect === 'function') return api.autoReconnect();
        return !!window._skiConn;
      });
    },
    openModal: function() {
      window.dispatchEvent(new CustomEvent('ski:request-signin'));
    },
    closeModal: function() {},
    detectWallets: function() {
      return __skiEnsureWaaPRegistered().then(function() {
        return __skiLoadWalletApi();
      }).then(function(api) {
        return api && typeof api.getSuiWallets === 'function' ? api.getSuiWallets() : [];
      });
    },
    connect: function(wallet) {
      var walletName = wallet && wallet.name ? wallet.name : wallet;
      return window._skiConnect(walletName);
    },
    disconnect: function() {
      window._skiDisconnect();
      return Promise.resolve();
    },
    signPersonalMessage: function(messageBytes) {
      return window._skiSignPersonalMessage(messageBytes);
    },
    signTransaction: function(tx) {
      return window._skiSignTransaction(tx);
    },
    signAndExecute: function(tx) {
      return window._skiSignAndExecute(tx);
    },
    initFromSession: function(address, walletName) {
      try {
        if (address && !localStorage.getItem('ski:last-address')) localStorage.setItem('ski:last-address', address);
        if (walletName && !localStorage.getItem('ski:last-wallet')) localStorage.setItem('ski:last-wallet', walletName);
        if (walletName && !localStorage.getItem('sui_wallet_name')) localStorage.setItem('sui_wallet_name', walletName);
      } catch (_e) {}
    }
  };
}
window.addEventListener('ski:request-signin', function(e) {
  if (!__skiShouldDeferSigninToRoot()) return;
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  if (e && typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  if (!__skiGetPreferredWalletName('') && !(window._skiConn && window._skiConn.address) && !window._skiAddr) {
    window.location.href = __skiGetRootInUrl();
    return;
  }
  __skiBridgeRequest('connect', {
    walletName: __skiGetPreferredWalletName(''),
    address: (window._skiConn && window._skiConn.address) || window._skiAddr || '',
  }).catch(function(err) {
    console.warn('[.SKI] Root iframe connect failed:', err);
    window.location.href = __skiGetRootInUrl();
  });
}, true);
if (__skiShouldRegisterWaaP()) {
  __skiEnsureWaaPRegistered().catch(function() { return null; });
}
__skiLoadWalletApi().catch(function() { return null; });
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

function serializeJs(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')
}

export function skiProfileButtonBridge(opts: SkiProfileButtonBridgeOptions = {}): string {
	const config = {
		session: opts.session?.address
			? {
					address: opts.session.address,
					walletName: opts.session.walletName,
					verified: opts.session.verified,
				}
			: null,
		profileButtonId: opts.profileButtonId || '',
		profileFallbackHref: opts.profileFallbackHref || 'https://sui.ski',
		profileVisibleClass: opts.profileVisibleClass || '',
		widgetPrimaryClass: opts.widgetPrimaryClass || '',
	}

	return `;(function() {
  var config = ${serializeJs(config)};

  if (config.session && config.session.walletName) {
    try {
      if (config.session.address && !localStorage.getItem('ski:last-address')) {
        localStorage.setItem('ski:last-address', config.session.address);
      }
      if (!localStorage.getItem('ski:last-wallet')) {
        localStorage.setItem('ski:last-wallet', config.session.walletName);
      }
      if (!localStorage.getItem('sui_wallet_name')) {
        localStorage.setItem('sui_wallet_name', config.session.walletName);
      }
    } catch (_e) {}
  }

  var profileBtn = config.profileButtonId ? document.getElementById(config.profileButtonId) : null;
  var widgetEl = document.getElementById('wallet-widget');

  function getConn() {
    if (window._skiConn && typeof window._skiConn === 'object') return window._skiConn;
    if (window._skiAddr) return { address: window._skiAddr, primaryName: null };
    return null;
  }

  function getPrimaryName() {
    var conn = getConn();
    if (!conn || !conn.primaryName) return '';
    return String(conn.primaryName).replace(/\\.sui$/i, '');
  }

  function syncProfileButton() {
    var conn = getConn();
    var primaryName = getPrimaryName();
    if (profileBtn) {
      if (config.profileVisibleClass) {
        profileBtn.classList.toggle(config.profileVisibleClass, !!(conn && conn.address));
      }
      profileBtn.dataset.href = primaryName
        ? 'https://' + encodeURIComponent(primaryName) + '.sui.ski'
        : config.profileFallbackHref;
      profileBtn.title = primaryName ? primaryName + '.sui' : 'Go to sui.ski';
    }
    if (widgetEl && config.widgetPrimaryClass) {
      widgetEl.classList.toggle(config.widgetPrimaryClass, !!primaryName);
    }
  }

  if (profileBtn && profileBtn.dataset.skiProfileBound !== '1') {
    profileBtn.dataset.skiProfileBound = '1';
    profileBtn.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = profileBtn.dataset.href || config.profileFallbackHref;
    });
  }

  window.__skiSyncProfileButton = syncProfileButton;
  window.addEventListener('ski:wallet-connected', syncProfileButton);
  window.addEventListener('ski:wallet-disconnected', syncProfileButton);
  syncProfileButton();
})();`
}
