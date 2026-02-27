(function () {
  var ASSETS = {
    logoBlack: '../button-assets/dotSKI-wordmark-black.png',
    logoBlue: '../button-assets/dotSKI-wordmark-blue.png',
    suiDrop: '../button-assets/sui-drop.svg',
    xIcon: '../button-assets/x-social-icon.svg',
  };
  var STORAGE_KEY = 'header-wallet-buttons-demo:session:v1';
  var VALID_METHODS = { x: true, google: true, wallet: true };

  var state = {
    connected: false,
    address: '0x5f2e9b1c4a8d7e0f6b3c2d1a9e8f7b6c5d4a3b2c',
    primaryName: 'brando',
    method: 'x',
    sui: 2.1,
    usd: 1.09,
    dropdownOpen: false,
    copyBannerVisible: false,
    copyBannerTimer: null,
    pollTimer: null,
  };

  var els = {
    walletWidget: document.getElementById('wallet-widget'),
    wkWidget: document.getElementById('wk-widget'),
    profileBtn: document.getElementById('wallet-profile-btn'),
    menuRoot: document.getElementById('wallet-menu-root'),
    modal: document.getElementById('connect-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    connectBtn: document.getElementById('connect-btn'),
    disconnectBtn: document.getElementById('disconnect-btn'),
    applyBtn: document.getElementById('apply-btn'),
    clearPrimaryBtn: document.getElementById('clear-primary-btn'),
    randomizeBtn: document.getElementById('randomize-btn'),
    primaryNameInput: document.getElementById('primary-name-input'),
    addressInput: document.getElementById('address-input'),
    methodSelect: document.getElementById('method-select'),
    suiInput: document.getElementById('sui-input'),
    usdInput: document.getElementById('usd-input'),
  };

  function sanitizeName(value) {
    return String(value || '').trim().toLowerCase().replace(/^@+/, '').replace(/\.sui$/i, '');
  }

  function truncateAddress(address) {
    var text = String(address || '').trim();
    if (!text) return '';
    if (text.length <= 16) return text;
    return text.slice(0, 7) + '...' + text.slice(-6);
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatSui(amount) {
    var n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return '0';
    if (n < 0.01) return '< 0.01';
    if (n < 100) return n.toFixed(2).replace(/\.?0+$/, '');
    if (n < 10000) return n.toFixed(1);
    if (n < 1000000) return (n / 1000).toFixed(1) + 'k';
    return (n / 1000000).toFixed(1) + 'M';
  }

  function formatUsd(amount) {
    var n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return '';
    if (n < 0.01) return '< $0.01';
    if (n < 100) return '$' + n.toFixed(2);
    if (n < 10000) return '$' + n.toFixed(0);
    if (n < 1000000) return '$' + (n / 1000).toFixed(1) + 'k';
    return '$' + (n / 1000000).toFixed(1) + 'M';
  }

  function randomAddress() {
    var out = '0x';
    var chars = 'abcdef0123456789';
    for (var i = 0; i < 40; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  function safeStorageGetItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  }

  function safeStorageSetItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_error) {}
  }

  function safeStorageRemoveItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (_error) {}
  }

  function readSessionFromStorage() {
    var raw = safeStorageGetItem(STORAGE_KEY);
    if (!raw) return null;

    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_error) {
      safeStorageRemoveItem(STORAGE_KEY);
      return null;
    }

    if (!parsed || parsed.connected !== true) {
      safeStorageRemoveItem(STORAGE_KEY);
      return null;
    }

    var address = String(parsed.address || '').trim();
    var method = VALID_METHODS[parsed.method] ? parsed.method : 'wallet';
    var sui = Number(parsed.sui);
    var usd = Number(parsed.usd);

    return {
      connected: true,
      address: address || randomAddress(),
      primaryName: sanitizeName(parsed.primaryName),
      method: method,
      sui: Number.isFinite(sui) && sui >= 0 ? Number(sui.toFixed(2)) : state.sui,
      usd: Number.isFinite(usd) && usd >= 0 ? Number(usd.toFixed(2)) : state.usd,
    };
  }

  function writeSessionToStorage() {
    if (!state.connected) {
      safeStorageRemoveItem(STORAGE_KEY);
      return;
    }

    var payload = {
      connected: true,
      address: String(state.address || '').trim(),
      primaryName: sanitizeName(state.primaryName),
      method: VALID_METHODS[state.method] ? state.method : 'wallet',
      sui: Number.isFinite(state.sui) && state.sui >= 0 ? Number(state.sui.toFixed(2)) : 0,
      usd: Number.isFinite(state.usd) && state.usd >= 0 ? Number(state.usd.toFixed(2)) : 0,
    };

    safeStorageSetItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function clearSessionFromStorage() {
    safeStorageRemoveItem(STORAGE_KEY);
  }

  function hydrateStateFromStorage() {
    var saved = readSessionFromStorage();
    if (!saved) return;
    state.connected = true;
    state.address = saved.address;
    state.primaryName = saved.primaryName;
    state.method = saved.method;
    state.sui = saved.sui;
    state.usd = saved.usd;
    state.dropdownOpen = false;
  }

  function getMethodIconHtml(method) {
    if (method === 'x') {
      return '<span class="wk-widget-method-icon"><img src="' + ASSETS.xIcon + '" alt="X"></span>';
    }
    if (method === 'google') {
      return '<span class="wk-widget-icon-fallback" title="Google" style="background:#1f2937;font-weight:700;font-size:11px">G</span>';
    }
    return '<span class="wk-widget-icon-fallback" title="Wallet" style="background:#111827;font-weight:700;font-size:11px">◎</span>';
  }

  function getProfileHref() {
    var name = sanitizeName(state.primaryName);
    return name ? 'https://' + encodeURIComponent(name) + '.sui.ski' : 'https://sui.ski';
  }

  function fallbackCopyText(text) {
    if (!document.body) return false;
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    var copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (_error) {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  }

  function clearCopyBannerTimer() {
    if (!state.copyBannerTimer) return;
    clearTimeout(state.copyBannerTimer);
    state.copyBannerTimer = null;
  }

  function showCopyBanner() {
    clearCopyBannerTimer();
    state.copyBannerVisible = true;
    render();
    state.copyBannerTimer = setTimeout(function () {
      state.copyBannerVisible = false;
      state.copyBannerTimer = null;
      render();
    }, 2200);
  }

  function copyAddress() {
    var text = String(state.address || '').trim();
    if (!text) return;

    var fallback = function () {
      if (fallbackCopyText(text)) {
        showCopyBanner();
      }
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text)
        .then(function () {
          showCopyBanner();
        })
        .catch(function () {
          fallback();
        });
      return;
    }

    fallback();
  }

  function updateControlsFromState() {
    els.primaryNameInput.value = state.primaryName || '';
    els.addressInput.value = state.address || '';
    els.methodSelect.value = state.method || 'wallet';
    els.suiInput.value = String(Number(state.sui).toFixed(2));
    els.usdInput.value = String(Number(state.usd).toFixed(2));
    els.disconnectBtn.disabled = !state.connected;
  }

  function renderProfileButton() {
    if (!els.profileBtn) return;

    if (!state.connected) {
      els.profileBtn.style.display = 'none';
      if (els.menuRoot) {
        els.menuRoot.innerHTML = '';
      }
      return;
    }

    var hasPrimary = Boolean(sanitizeName(state.primaryName));
    var href = getProfileHref();
    var img = els.profileBtn.querySelector('.wallet-profile-logo');

    els.profileBtn.style.display = '';
    els.profileBtn.dataset.href = href;
    els.profileBtn.title = 'Open wallet menu';
    els.profileBtn.setAttribute('aria-label', 'Open wallet menu');
    els.profileBtn.classList.toggle('has-primary', hasPrimary);
    els.profileBtn.classList.toggle('no-primary', !hasPrimary);

    if (img) {
      img.src = hasPrimary ? ASSETS.logoBlue : ASSETS.logoBlack;
    }

    if (els.menuRoot) {
      els.menuRoot.innerHTML = renderDropdown();
      bindDropdownEvents();
    }
  }

  function renderDropdown() {
    if (!state.connected) return '';
    var addr = state.address || '';
    var copiedText = 'Copied! \u2713';
    return (
      '<div class="wk-dropdown' + (state.dropdownOpen ? ' open' : '') + '">' +
        '<button class="wk-dd-address-banner' + (state.copyBannerVisible ? ' copied' : '') + '" id="wk-dd-address-copy" type="button" title="Copy address">' +
          '<span class="wk-dd-address-text">' + escapeHtml(state.copyBannerVisible ? copiedText : addr) + '</span>' +
        '</button>' +
        '<button class="wk-dd-item" id="wk-dd-switch">Switch Wallet</button>' +
        '<button class="wk-dd-item disconnect" id="wk-dd-disconnect">Disconnect</button>' +
      '</div>'
    );
  }

  function renderWalletWidget() {
    if (!els.wkWidget) return;

    if (!state.connected) {
      els.wkWidget.innerHTML = (
        '<div class="wk-widget">' +
          '<button class="wk-widget-btn" id="wk-widget-toggle" data-role="connect">' +
            '<img src="' + ASSETS.logoBlack + '" class="wk-widget-brand-logo" alt=".SKI">' +
          '</button>' +
        '</div>'
      );
      bindWidgetEvents();
      return;
    }

    var normalizedPrimaryName = sanitizeName(state.primaryName);
    var hasPrimaryName = Boolean(normalizedPrimaryName);
    var label = hasPrimaryName
      ? normalizedPrimaryName
      : truncateAddress(state.address);
    var labelClass = hasPrimaryName ? 'wk-widget-title' : 'wk-widget-title is-address';

    var tokenText = formatSui(state.sui);
    var usdText = formatUsd(state.usd);

    var balanceHtml = '';
    if (tokenText || usdText) {
      balanceHtml = '<span class="wk-widget-balance-wrap">';
      if (tokenText) {
        balanceHtml += '<span class="wk-widget-token-row">' + tokenText + '<img class="sui-icon" src="' + ASSETS.suiDrop + '" alt="SUI"></span>';
      }
      if (usdText) {
        balanceHtml += '<span class="wk-widget-usd-row">' + usdText + '</span>';
      }
      balanceHtml += '</span>';
    }

    els.wkWidget.innerHTML = (
      '<div class="wk-widget">' +
        '<button class="wk-widget-btn connected" id="wk-widget-toggle" data-role="profile">' +
          getMethodIconHtml(state.method) +
          '<span class="wk-widget-label-wrap"><span class="' + labelClass + '"><span class="wk-widget-primary-name">' + escapeHtml(label) + '</span></span></span>' +
          balanceHtml +
        '</button>' +
      '</div>'
    );

    bindWidgetEvents();
  }

  function render() {
    if (els.walletWidget) {
      els.walletWidget.classList.toggle('has-black-diamond', !state.connected);
    }
    renderWalletWidget();
    renderProfileButton();
    updateControlsFromState();
  }

  function openModal() {
    if (!els.modal) return;
    els.modal.hidden = false;
  }

  function closeModal() {
    if (!els.modal) return;
    els.modal.hidden = true;
  }

  function connect(method) {
    state.connected = true;
    state.method = method || state.method || 'wallet';

    var nextPrimary = sanitizeName(els.primaryNameInput.value);
    var nextAddress = String(els.addressInput.value || '').trim();

    state.primaryName = nextPrimary;
    state.address = nextAddress || randomAddress();
    state.dropdownOpen = false;

    writeSessionToStorage();
    startPolling();
    render();
    closeModal();
  }

  function disconnect() {
    state.connected = false;
    state.dropdownOpen = false;
    state.copyBannerVisible = false;
    clearCopyBannerTimer();
    stopPolling();
    clearSessionFromStorage();
    render();
  }

  function switchWallet() {
    disconnect();
    openModal();
  }

  function applyValues() {
    state.primaryName = sanitizeName(els.primaryNameInput.value);
    state.address = String(els.addressInput.value || '').trim() || state.address || randomAddress();
    state.method = String(els.methodSelect.value || 'wallet');

    var nextSui = Number(els.suiInput.value);
    var nextUsd = Number(els.usdInput.value);

    state.sui = Number.isFinite(nextSui) && nextSui >= 0 ? nextSui : state.sui;
    state.usd = Number.isFinite(nextUsd) && nextUsd >= 0 ? nextUsd : state.usd;

    writeSessionToStorage();
    render();
  }

  function randomizeValues() {
    state.sui = Math.max(0, Number((Math.random() * 9 + 0.1).toFixed(2)));
    state.usd = Math.max(0, Number((Math.random() * 8 + 0.1).toFixed(2)));
    writeSessionToStorage();
    render();
  }

  function startPolling() {
    stopPolling();
    state.pollTimer = setInterval(function () {
      if (!state.connected) return;
      var suiDrift = (Math.random() - 0.5) * 0.08;
      var usdDrift = (Math.random() - 0.5) * 0.06;
      state.sui = Math.max(0, Number((state.sui + suiDrift).toFixed(2)));
      state.usd = Math.max(0, Number((state.usd + usdDrift).toFixed(2)));
      writeSessionToStorage();
      render();
    }, 30000);
  }

  function stopPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  function bindWidgetEvents() {
    var btn = document.getElementById('wk-widget-toggle');
    if (!btn) return;

    btn.addEventListener('click', function (event) {
      event.stopPropagation();
      if (!state.connected) {
        openModal();
        return;
      }

      var href = getProfileHref();
      state.dropdownOpen = false;
      render();
      window.open(href, '_blank', 'noopener,noreferrer');
    });
  }

  function bindDropdownEvents() {
    var addressCopyBtn = document.getElementById('wk-dd-address-copy');
    var switchBtn = document.getElementById('wk-dd-switch');
    var disconnectBtn = document.getElementById('wk-dd-disconnect');

    if (addressCopyBtn) {
      addressCopyBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        copyAddress();
      });
    }

    if (switchBtn) {
      switchBtn.addEventListener('click', function () {
        switchWallet();
      });
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', function () {
        disconnect();
      });
    }
  }

  function bindGlobalEvents() {
    if (els.profileBtn) {
      els.profileBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        if (!state.connected) return;
        state.dropdownOpen = !state.dropdownOpen;
        render();
      });
    }

    if (els.closeModalBtn) {
      els.closeModalBtn.addEventListener('click', closeModal);
    }

    if (els.modal) {
      els.modal.addEventListener('click', function (event) {
        if (event.target === els.modal) closeModal();
      });
    }

    var methodButtons = document.querySelectorAll('.wk-method');
    methodButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var method = button.getAttribute('data-method') || 'wallet';
        els.methodSelect.value = method;
        connect(method);
      });
    });

    if (els.connectBtn) {
      els.connectBtn.addEventListener('click', function () {
        if (state.connected) return;
        openModal();
      });
    }

    if (els.disconnectBtn) {
      els.disconnectBtn.addEventListener('click', function () {
        disconnect();
      });
    }

    if (els.applyBtn) {
      els.applyBtn.addEventListener('click', applyValues);
    }

    if (els.randomizeBtn) {
      els.randomizeBtn.addEventListener('click', randomizeValues);
    }

    if (els.clearPrimaryBtn) {
      els.clearPrimaryBtn.addEventListener('click', function () {
        state.primaryName = '';
        if (els.primaryNameInput) {
          els.primaryNameInput.value = '';
        }
        writeSessionToStorage();
        render();
      });
    }

    document.addEventListener('click', function (event) {
      if (!state.dropdownOpen) return;
      if (els.profileBtn && els.profileBtn.contains(event.target)) return;
      if (els.menuRoot && els.menuRoot.contains(event.target)) return;
      state.dropdownOpen = false;
      render();
    });
  }

  hydrateStateFromStorage();
  if (state.connected) {
    startPolling();
  }
  bindGlobalEvents();
  render();
})();
