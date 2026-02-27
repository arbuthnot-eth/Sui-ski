# Header Wallet Buttons: Source Map + Replication Guide

This doc maps the exact code that renders and powers the two header buttons shown in your screenshot:
- Left button: connected wallet pill (`brando.sui`, SUI amount, USD amount, method icon like `𝕏`)
- Right button: `.SKI` profile button

## Exported assets

These were extracted to make the code easier to read and reuse:
- `docs/button-assets/dotSKI-wordmark-black.png`
- `docs/button-assets/dotSKI-wordmark-blue.png`
- `docs/button-assets/sui-drop.svg`
- `docs/button-assets/x-social-icon.svg`

## Files that affect these buttons

- `src/handlers/profile.ts`
- `src/handlers/profile.css.ts`
- `src/utils/wallet-ui-js.ts`
- `src/utils/shared-wallet-js.ts`
- `src/utils/wallet-brand.ts`
- `src/utils/wallet-kit-js.ts`

---

## 1) Base HTML mount points (both buttons)

From `src/handlers/profile.ts`:

```ts
<div class="wallet-widget" id="wallet-widget">
  <div id="wk-widget"></div>
  <button class="wallet-profile-btn" id="wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile" style="display:none">
    <img class="wallet-profile-logo" src="${PROFILE_WALLET_BUTTON_LOGO_DEFAULT_DATA_URL}" alt=".SKI" draggable="false">
  </button>
</div>
```

What it does:
- `#wk-widget` is the left wallet widget mount.
- `#wallet-profile-btn` is the right `.SKI` button.

---

## 2) Left button: connected wallet pill

### 2.1 Core styles

From `src/utils/wallet-ui-js.ts` (`generateWalletUiCss()`):

```css
.wk-widget-btn.connected {
  background: linear-gradient(135deg, rgba(8,8,14,0.72), rgba(16,16,24,0.68));
  border-color: rgba(100,110,135,0.32);
  color: #c8cde0;
  max-width: 280px;
  padding: 6px 10px;
}

.wk-widget-btn.connected .wk-widget-title {
  color: #e8ecf4;
  font-weight: 700;
  font-size: 0.78rem;
}

.wk-widget-btn.connected .wk-widget-token-row {
  font-size: 0.58rem;
  color: rgba(255,255,255,0.96);
}

.wk-widget-btn.connected .wk-widget-usd-row {
  font-size: 0.58rem;
  color: rgba(255,232,160,0.92);
}
```

From `src/handlers/profile.css.ts` (profile-specific override when not in black-diamond state):

```css
.wallet-widget.has-black-diamond #wk-widget .wk-widget-btn.connected,
.wallet-widget.has-black-diamond #wk-widget > div > button.connected {
  background: linear-gradient(135deg, rgba(8, 8, 16, 0.95), rgba(16, 16, 30, 0.94));
  border-color: rgba(198, 170, 98, 0.62);
  color: #d0d4e0;
}
```

### 2.2 Dynamic markup

From `src/utils/wallet-ui-js.ts` (`__wkUpdateWidget`):

```js
var isPrimaryName = ${showPrimaryName} && conn.primaryName;
var label = isPrimaryName ? conn.primaryName : __wkTruncAddr(addressForLabel);

var balanceLine = '';
if (__wkPortfolioData) {
  var suiSummary = __wkFormatBalance(__wkPortfolioData.totalSui);
  var stableTotal = __wkGetStablecoinTotal(__wkPortfolioData);
  var stableSummary = stableTotal >= 0.01 ? __wkFormatUsd(stableTotal) : '';

  if (suiSummary || stableSummary) {
    balanceLine = '<span class="wk-widget-balance-wrap">';
    if (suiSummary) {
      balanceLine += '<span class="wk-widget-token-row">' + __wkEscapeHtml(suiSummary) + __wkSuiIconSvg + '</span>';
    }
    if (stableSummary) {
      balanceLine += '<span class="wk-widget-usd-row">' + __wkEscapeHtml(stableSummary) + '</span>';
    }
    balanceLine += '</span>';
  }
}

var methodSvg = (connectionHint && waapMethod) ? __wkWidgetMethodIconSvg(waapMethod) : '';
```

What this gives you:
- Name row (`brando.sui` or shortened address)
- Token row (`2.1` + SUI droplet)
- USD row (`$1.09`-style)
- Social/method icon for WaaP methods including `𝕏`

### 2.3 Portfolio data source and refresh

From `src/utils/wallet-ui-js.ts`:

```js
async function __wkFetchPortfolio(address) {
  var suiBal = await suiClient.getBalance({ owner: address, coinType: SUI_TYPE });
  var poolsRaw = await fetch('/api/deepbook-pools').then(r => r.json());
  var usdcData = await fetch('/api/usdc-price').then(r => r.json());
  return { totalSui, usdcPerSui, holdings };
}

__wkPortfolioTimer = setInterval(poll, 30000);
window.addEventListener('wk:tx-success', ...);
window.addEventListener('focus', ...);
document.addEventListener('visibilitychange', ...);
```

This is why the left pill updates in near-real-time.

### 2.4 Widget mount + lifecycle

From `src/utils/wallet-ui-js.ts` (`renderWidget`):

```js
container.innerHTML = '<div class="wk-widget">'
  + '<button class="wk-widget-btn" data-wk-role="toggle">' + __wkWidgetDefaultMarkup + '</button>'
  + '<div class="wk-dropdown"></div>'
  + '</div>';

__wkWidgetUnsub = SuiWalletKit.subscribe(SuiWalletKit.$connection, function(conn) {
  // starts/stops polling and calls __wkUpdateWidget(conn)
});
```

---

## 3) Right button: `.SKI` profile button

### 3.1 Styles

From `src/handlers/profile.css.ts`:

```css
.wallet-profile-btn {
  min-height: 32px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #090f1d, #0d1728);
  border: 1.5px solid rgba(148, 163, 184, 0.42);
  padding: 4px 10px;
}

.wallet-profile-logo {
  width: 92px;
  height: 24px;
  object-fit: contain;
}
```

### 3.2 Runtime behavior

From `src/handlers/profile.ts`:

```js
const WALLET_PROFILE_LOGO_DEFAULT = ${serializeJson(PROFILE_WALLET_BUTTON_LOGO_DEFAULT_DATA_URL)}
const WALLET_PROFILE_LOGO_PRIMARY = ${serializeJson(PROFILE_WALLET_BUTTON_LOGO_PRIMARY_DATA_URL)}

function updateWalletProfileButton() {
  const primaryName = typeof connectedPrimaryName === 'string'
    ? connectedPrimaryName.trim().replace(/\.sui$/i, '')
    : '';
  const shouldUsePrimaryLogo = Boolean(primaryName && connectedAddress);

  walletProfileBtn.dataset.href = getWalletProfileHref();
  walletProfileBtn.title = primaryName ? primaryName + '.sui' : 'Go to sui.ski';

  const profileLogo = walletProfileBtn.querySelector('.wallet-profile-logo');
  if (profileLogo) {
    profileLogo.src = shouldUsePrimaryLogo
      ? WALLET_PROFILE_LOGO_PRIMARY
      : WALLET_PROFILE_LOGO_DEFAULT;
  }
}

walletProfileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.location.href = walletProfileBtn.dataset.href || 'https://sui.ski';
});
```

### 3.3 Shared mount glue

From `src/utils/shared-wallet-js.ts`:

```js
var getProfileHref = function() {
  var conn = walletKit.$connection.value;
  if (conn && conn.primaryName) {
    return 'https://' + encodeURIComponent(conn.primaryName) + '.sui.ski';
  }
  return config.profileFallbackHref;
};

client.resolveNameServiceNames({ address: conn.address }).then(function(result) {
  var name = result && result.data && result.data[0];
  if (!name) return;
  walletKit.setPrimaryName(String(name).replace(/\.sui$/i, ''));
});
```

This is what resolves and keeps the profile button link synchronized to the wallet’s primary name.

---

## 4) Asset source

The right-button logos are embedded as data URLs in:
- `src/utils/wallet-brand.ts`

They are exported in this doc set to:
- `docs/button-assets/dotSKI-wordmark-black.png`
- `docs/button-assets/dotSKI-wordmark-blue.png`

---

## 5) Replicating full functionality (checklist)

1. Include the same mount HTML (`#wk-widget` + `#wallet-profile-btn`).
2. Include wallet scripts in this order:
   - `generateWalletSessionJs()`
   - `generateWalletKitJs(...)`
   - `generateWalletTxJs()`
   - `generateWalletUiJs(...)`
3. Call:
   - `SuiWalletKit.renderModal('wk-modal')`
   - `SuiWalletKit.renderWidget('wk-widget')`
4. Wire connect/disconnect callbacks to refresh:
   - connected address,
   - primary name,
   - `.SKI` button href/logo state,
   - widget rendering.
5. Keep the portfolio APIs available:
   - `/api/deepbook-pools`
   - `/api/usdc-price`
6. Keep Sui RPC available for name resolution.
7. Keep both style layers:
   - base widget CSS in `wallet-ui-js`
   - profile-specific overrides in `profile.css.ts`

---

## 6) Standalone demo (ready to run)

A full local-only replica is included here:
- `docs/header-wallet-buttons-demo/index.html`
- `docs/header-wallet-buttons-demo/style.css`
- `docs/header-wallet-buttons-demo/app.js`

It uses the exported assets:
- `docs/button-assets/dotSKI-wordmark-black.png`
- `docs/button-assets/dotSKI-wordmark-blue.png`
- `docs/button-assets/sui-drop.svg`
- `docs/button-assets/x-social-icon.svg`

What this demo reproduces:
- disconnected left button + connect modal,
- connected left pill with method icon, name/address label, SUI + USD rows,
- dropdown actions (copy address, switch wallet, disconnect),
- right `.SKI` button visibility, logo switching, and profile URL behavior,
- 30s balance jitter to mimic polling updates.

How to open:
1. Open `docs/header-wallet-buttons-demo/index.html` directly in a browser.
2. For best clipboard behavior, run a local server and open the same file path over `http://`.
