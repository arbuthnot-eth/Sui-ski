const SESSION_STORAGE_KEY = 'sui_session_id'
const WALLET_NAME_KEY = 'sui_wallet_name'

export function generateWalletSessionJs(): string {
	return `
    const __SESSION_KEY = '${SESSION_STORAGE_KEY}';
    const __WALLET_NAME_KEY = '${WALLET_NAME_KEY}';

    function connectWalletSession(walletName, address) {
      if (!walletName || !address) return;
      fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address, walletName: walletName }),
        credentials: 'include',
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.sessionId) localStorage.setItem(__SESSION_KEY, data.sessionId);
      }).catch(function() {});
    }

    function __skiReadCookie(name) {
      var match = document.cookie.split('; ').find(function(c) { return c.startsWith(name + '='); });
      return match ? match.split('=')[1] : '';
    }

    function disconnectWalletSession() {
      var sessionId = localStorage.getItem(__SESSION_KEY) || __skiReadCookie('session_id');
      localStorage.removeItem(__SESSION_KEY);
      localStorage.removeItem(__WALLET_NAME_KEY);
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
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.sessionId) {
          localStorage.setItem(__SESSION_KEY, data.sessionId);
          localStorage.setItem(__WALLET_NAME_KEY, walletName);
        }
        return true;
      }).catch(function() {
        connectWalletSession(walletName, address);
        return false;
      });
    }

    function getWalletSession() {
      var address = __skiReadCookie('wallet_address');
      if (!address || !address.startsWith('0x')) return null;
      var walletName = __skiReadCookie('wallet_name') || localStorage.getItem(__WALLET_NAME_KEY) || '';
      if (!walletName) return null;
      return { walletName: walletName, address: address };
    }

    function initSessionFromServer(sessionData) {
      if (!sessionData || !sessionData.address) return;
      if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.initFromSession) {
        SuiWalletKit.initFromSession(sessionData.address, sessionData.walletName || '');
      }
    }
  `
}
