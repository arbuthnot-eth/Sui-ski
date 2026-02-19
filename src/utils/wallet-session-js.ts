const SESSION_STORAGE_KEY = 'sui_session_id'
const WALLET_NAME_KEY = 'sui_wallet_name'
const WALLET_ADDRESS_KEY = 'sui_wallet_address'
const WALLET_NAME_MAP_KEY = 'sui_wallet_name_by_address_v1'

export function generateWalletSessionJs(): string {
	return `
    const __SESSION_KEY = '${SESSION_STORAGE_KEY}';
    const __WALLET_NAME_KEY = '${WALLET_NAME_KEY}';
    const __WALLET_ADDRESS_KEY = '${WALLET_ADDRESS_KEY}';
    const __WALLET_NAME_MAP_KEY = '${WALLET_NAME_MAP_KEY}';

    function __skiNormalizeAddress(address) {
      var raw = String(address || '').trim().toLowerCase();
      if (!raw) return '';
      if (raw.indexOf('0x') === 0) raw = raw.slice(2);
      if (!raw || raw.length > 64 || /[^0-9a-f]/.test(raw)) return '';
      raw = raw.replace(/^0+/, '');
      if (!raw) raw = '0';
      return '0x' + raw.padStart(64, '0');
    }

    function __skiReadWalletNameMap() {
      try {
        var raw = localStorage.getItem(__WALLET_NAME_MAP_KEY);
        if (!raw) return {};
        var parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
      } catch (_e) {
        return {};
      }
    }

    function __skiWriteWalletNameMap(map) {
      try {
        localStorage.setItem(__WALLET_NAME_MAP_KEY, JSON.stringify(map || {}));
      } catch (_e) {}
    }

    function __skiSaveWalletNameForAddress(address, walletName) {
      var normalizedAddress = __skiNormalizeAddress(address);
      var normalizedWalletName = String(walletName || '').trim();
      if (!normalizedAddress || !normalizedWalletName) return;
      var map = __skiReadWalletNameMap();
      map[normalizedAddress] = normalizedWalletName;
      __skiWriteWalletNameMap(map);
    }

    function __skiReadWalletNameForAddress(address) {
      var normalizedAddress = __skiNormalizeAddress(address);
      if (!normalizedAddress) return '';
      var map = __skiReadWalletNameMap();
      var value = map[normalizedAddress];
      return value ? String(value) : '';
    }

    function __skiDeleteWalletNameForAddress(address) {
      var normalizedAddress = __skiNormalizeAddress(address);
      if (!normalizedAddress) return;
      var map = __skiReadWalletNameMap();
      if (!Object.prototype.hasOwnProperty.call(map, normalizedAddress)) return;
      delete map[normalizedAddress];
      __skiWriteWalletNameMap(map);
    }

    function connectWalletSession(walletName, address) {
      if (!walletName || !address) return Promise.resolve(false);
      var normalizedAddress = __skiNormalizeAddress(address);
      localStorage.setItem(__WALLET_NAME_KEY, walletName);
      if (normalizedAddress) localStorage.setItem(__WALLET_ADDRESS_KEY, normalizedAddress);
      __skiSaveWalletNameForAddress(normalizedAddress || address, walletName);
      return fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address, walletName: walletName }),
        credentials: 'include',
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.sessionId) localStorage.setItem(__SESSION_KEY, data.sessionId);
        return true;
      }).catch(function() { return false; });
    }

    function __skiReadCookie(name) {
      try {
        var pairs = document.cookie ? document.cookie.split(';') : [];
        for (var i = 0; i < pairs.length; i++) {
          var part = String(pairs[i] || '').trim();
          if (!part) continue;
          var eqIndex = part.indexOf('=');
          if (eqIndex <= 0) continue;
          if (part.slice(0, eqIndex).trim() !== name) continue;
          var raw = part.slice(eqIndex + 1).trim();
          try { return decodeURIComponent(raw); } catch (_e) { return raw; }
        }
      } catch (_e2) {}
      return '';
    }

    function __skiClearSessionCookies() {
      var domains = ['', '; domain=.sui.ski'];
      var names = ['session_id', 'wallet_address', 'wallet_name'];
      for (var d = 0; d < domains.length; d++) {
        for (var n = 0; n < names.length; n++) {
          document.cookie = names[n] + '=' + domains[d] + '; path=/; max-age=0; secure; samesite=lax';
        }
      }
    }

    function disconnectWalletSession() {
      var walletAddress = __skiReadCookie('wallet_address') || localStorage.getItem(__WALLET_ADDRESS_KEY) || '';
      var sessionId = localStorage.getItem(__SESSION_KEY) || __skiReadCookie('session_id');
      localStorage.removeItem(__SESSION_KEY);
      localStorage.removeItem(__WALLET_NAME_KEY);
      localStorage.removeItem(__WALLET_ADDRESS_KEY);
      __skiDeleteWalletNameForAddress(walletAddress);
      try { localStorage.removeItem('sui_ski_last_wallet'); } catch (_e) {}
      try { localStorage.removeItem('ski_wallet_history'); } catch (_e) {}
      __skiClearSessionCookies();
      fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId }),
        credentials: 'include',
      }).catch(function() {});
    }

    function challengeAndConnect(walletName, address, signMessageFn) {
      return fetch('/api/wallet/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(function(r) { return r.json(); }).then(function(challengeData) {
        if (!challengeData.challenge) throw new Error('No challenge received');
        var messageBytes = new TextEncoder().encode(challengeData.challenge);
        return signMessageFn(messageBytes).then(function(signResult) {
          var signature = signResult.signature || signResult;
          return fetch('/api/wallet/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: address, walletName: walletName, signature: signature, challenge: challengeData.challenge }),
            credentials: 'include',
          });
        });
      }).then(function(r) {
        if (!r.ok) throw new Error('Key-In verification failed (status ' + r.status + ')');
        return r.json();
      }).then(function(data) {
        if (data.sessionId) {
          var normalizedAddress = __skiNormalizeAddress(address);
          localStorage.setItem(__SESSION_KEY, data.sessionId);
          localStorage.setItem(__WALLET_NAME_KEY, walletName);
          if (normalizedAddress) localStorage.setItem(__WALLET_ADDRESS_KEY, normalizedAddress);
          __skiSaveWalletNameForAddress(normalizedAddress || address, walletName);
        }
        return true;
      });
    }

    function getWalletSession() {
      var addressRaw = __skiReadCookie('wallet_address');
      var address = __skiNormalizeAddress(addressRaw);
      if (!address) return null;
      var walletName = __skiReadCookie('wallet_name');
      if (!walletName) {
        walletName = __skiReadWalletNameForAddress(address);
      }
      if (!walletName) {
        var localAddress = __skiNormalizeAddress(localStorage.getItem(__WALLET_ADDRESS_KEY) || '');
        if (localAddress && localAddress === address) {
          walletName = localStorage.getItem(__WALLET_NAME_KEY) || '';
        }
      }
      if (walletName) __skiSaveWalletNameForAddress(address, walletName);
      return { walletName: walletName || '', address: address };
    }

    function initSessionFromServer(sessionData) {
      if (!sessionData || !sessionData.address) return;
      if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.initFromSession) {
        SuiWalletKit.initFromSession(sessionData.address, sessionData.walletName || '');
      }
    }

    if (typeof window !== 'undefined') {
      window.connectWalletSession = connectWalletSession;
      window.disconnectWalletSession = disconnectWalletSession;
      window.challengeAndConnect = challengeAndConnect;
      window.getWalletSession = getWalletSession;
      window.initSessionFromServer = initSessionFromServer;
    }
  `
}
