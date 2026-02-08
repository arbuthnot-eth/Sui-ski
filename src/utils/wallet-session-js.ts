const SESSION_STORAGE_KEY = 'sui_session_id'
const WALLET_NAME_KEY = 'sui_wallet_name'

export function generateWalletSessionJs(): string {
	return `
    const __SESSION_KEY = '${SESSION_STORAGE_KEY}';
    const __WALLET_NAME_KEY = '${WALLET_NAME_KEY}';

    function connectWalletSession(walletName, address) {
      if (!walletName || !address) return;
      localStorage.setItem(__WALLET_NAME_KEY, walletName);
      fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
        credentials: 'include',
      }).then(function(r) { return r.json(); }).then(function(data) {
        if (data.sessionId) localStorage.setItem(__SESSION_KEY, data.sessionId);
      }).catch(function() {});
    }

    function disconnectWalletSession() {
      var sessionId = localStorage.getItem(__SESSION_KEY) || '';
      if (!sessionId) {
        var match = document.cookie.split('; ').find(function(c) { return c.startsWith('session_id='); });
        if (match) sessionId = match.split('=')[1];
      }
      localStorage.removeItem(__SESSION_KEY);
      localStorage.removeItem(__WALLET_NAME_KEY);
      fetch('/api/wallet/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId }),
        credentials: 'include',
      }).catch(function() {});
    }

    function getWalletSession() {
      var addrMatch = document.cookie.split('; ').find(function(c) { return c.startsWith('wallet_address='); });
      if (!addrMatch) return null;
      var address = addrMatch.split('=')[1];
      if (!address || !address.startsWith('0x')) return null;
      var walletName = localStorage.getItem(__WALLET_NAME_KEY) || 'Wallet';
      return { walletName: walletName, address: address };
    }
  `
}
