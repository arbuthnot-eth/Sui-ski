const SUI_WALLET_COOKIE = 'sui_wallet'
const COOKIE_MAX_AGE = 2592000
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{64}$/

export function parseWalletCookie(
	request: Request,
): { walletName: string; address: string } | null {
	const cookieHeader = request.headers.get('Cookie')
	if (!cookieHeader) return null

	const match = cookieHeader
		.split(';')
		.map((c) => c.trim())
		.find((c) => c.startsWith(SUI_WALLET_COOKIE + '='))
	if (!match) return null

	try {
		const encoded = match.slice(SUI_WALLET_COOKIE.length + 1)
		const decoded = JSON.parse(atob(encoded))
		if (!decoded.w || !decoded.a || !ADDRESS_PATTERN.test(decoded.a)) return null
		return { walletName: decoded.w, address: decoded.a }
	} catch {
		return null
	}
}

export function walletCookieHeader(walletName: string, address: string): string {
	if (!ADDRESS_PATTERN.test(address)) throw new Error(`Invalid address format: ${address}`)
	const value = btoa(JSON.stringify({ w: walletName, a: address }))
	return `${SUI_WALLET_COOKIE}=${value}; Domain=.sui.ski; Path=/; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
}

export function clearWalletCookieHeader(): string {
	return `${SUI_WALLET_COOKIE}=; Domain=.sui.ski; Path=/; Secure; SameSite=Lax; Max-Age=0`
}

export function generateWalletCookieJs(): string {
	return `
    const __WALLET_COOKIE_NAME = 'sui_wallet';
    function setWalletCookie(walletName, address) {
      if (!walletName || !address) return;
      const encoded = btoa(JSON.stringify({ w: walletName, a: address }));
      document.cookie = __WALLET_COOKIE_NAME + '=' + encoded + '; domain=.sui.ski; path=/; secure; samesite=lax; max-age=2592000';
      fetch('/_wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ walletName, address }) }).catch(() => {});
    }
    function clearWalletCookie() {
      document.cookie = __WALLET_COOKIE_NAME + '=; domain=.sui.ski; path=/; secure; samesite=lax; max-age=0';
      fetch('/_wallet', { method: 'DELETE' }).catch(() => {});
    }
    function getWalletCookie() {
      const match = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith(__WALLET_COOKIE_NAME + '='));
      if (!match) return null;
      try {
        const decoded = JSON.parse(atob(match.slice(__WALLET_COOKIE_NAME.length + 1)));
        return decoded.w && decoded.a ? { walletName: decoded.w, address: decoded.a } : null;
      } catch { return null; }
    }
  `
}
