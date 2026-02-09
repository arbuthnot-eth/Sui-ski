import type { Env } from '../types'
import { generateLogoSvg } from '../utils/og-image'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'

interface SkiSession {
	address: string | null
	walletName: string | null
	verified: boolean
}

export function generateSkiPage(env: Env, session?: SkiSession): string {
	const hasVerifiedSession = session?.address && session.verified
	const sessionJson = hasVerifiedSession
		? JSON.stringify({ address: session.address, walletName: session.walletName, verified: true })
		: 'null'

	return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sui Key-In</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;color:#e4e4e7;font-family:'Inter',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:24px;position:relative;overflow:hidden}
body::before {
	content: '';
	position: absolute;
	top: 50%; left: 50%; transform: translate(-50%, -50%);
	width: 140%; height: 140%;
	background: radial-gradient(circle at center, rgba(96, 165, 250, 0.08) 0%, transparent 50%);
	pointer-events: none; z-index: 0;
}
${generateWalletUiCss()}
.ski-container{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:32px;width:100%;max-width:400px;padding:20px}
.ski-logo{filter:drop-shadow(0 0 20px rgba(96,165,250,0.3))}
.ski-header{text-align:center}
.ski-header h1{font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;letter-spacing:-0.02em}
.ski-header p{color:#71717a;font-size:0.85rem;font-family:monospace}
.ski-status{text-align:center;padding:12px 20px;color:#71717a;font-size:0.85rem;min-height:40px}
.ski-status.success{color:#34d399}
.ski-status.error{color:#f87171}
.ski-locks{display:flex;gap:12px;margin-top:8px}
.ski-lock{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:#52525b;transition:all 0.3s ease}
.ski-lock.active{color:#60a5fa;border-color:rgba(96,165,250,0.3);background:rgba(96,165,250,0.1);box-shadow:0 0 15px rgba(96,165,250,0.2)}
.ski-login-btn{margin-top:12px;padding:12px 24px;background:linear-gradient(135deg,#60a5fa,#8b5cf6);border:none;border-radius:12px;color:white;font-weight:700;font-size:0.95rem;cursor:pointer;transition:all 0.2s ease;box-shadow:0 4px 15px rgba(96,165,250,0.25)}
.ski-login-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(96,165,250,0.35)}
.ski-login-btn:active{transform:translateY(0)}
</style>
</head><body>
<div class="ski-container">
	<div class="ski-logo">${generateLogoSvg(64)}</div>
	<div class="ski-header">
		<h1>Sui Key-In</h1>
		<p>ubiquitous authentication</p>
	</div>
	
	<div id="wk-modal"></div>
	
	<div class="ski-locks" id="ski-locks">
		<div class="ski-lock" title="app.sui.ski"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
		<div class="ski-lock" title="my.sui.ski"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg></div>
		<div class="ski-lock" title="rpc.sui.ski"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
		<div class="ski-lock" title="*.sui.ski"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
	</div>

	<div id="ski-status" class="ski-status">${hasVerifiedSession ? 'Welcome back...' : 'Detecting keys...'}</div>
	
	<button id="ski-login-btn" class="ski-login-btn" style="display:none">Sign In with Sui</button>
</div>

<script>
var __skiReturnUrl = new URLSearchParams(window.location.search).get('return') || '';
var __skiServerSession = ${sessionJson};

${generateWalletSessionJs()}
${generateWalletKitJs({ network: env.SUI_NETWORK, autoConnect: true })}
${generateWalletTxJs()}
${generateWalletUiJs({ onConnect: '__skiDone' })}

function __wkActivateLocks() {
	var locks = document.querySelectorAll('.ski-lock');
	for (var i = 0; i < locks.length; i++) {
		locks[i].classList.add('active');
	}
}

if (__skiServerSession && __skiServerSession.address) {
	initSessionFromServer(__skiServerSession);
	__wkActivateLocks();
}

var __skiDoneTriggered = false;
window.__skiDone = function() {
	if (__skiDoneTriggered) return;
	__skiDoneTriggered = true;
	__wkActivateLocks();
	
	var conn = SuiWalletKit.$connection.value;
	var addr = (conn && conn.address) || (__skiServerSession && __skiServerSession.address) || '';
	if (!addr) return;
	var statusEl = document.getElementById('ski-status');
	var loginBtn = document.getElementById('ski-login-btn');
	if (loginBtn) loginBtn.style.display = 'none';
	
	var truncAddr = addr.slice(0, 6) + '...' + addr.slice(-4);

	if (statusEl) {
		statusEl.className = 'ski-status success';
		statusEl.textContent = 'Key verified...';
	}

	var sessionPromise = SuiWalletKit.__sessionReady || Promise.resolve(true);
	var timedOut = false;
	var timer = setTimeout(function() { timedOut = true; }, 15000);

	sessionPromise.then(function() {
		clearTimeout(timer);
	}).catch(function() {
		clearTimeout(timer);
	}).finally(function() {
		if (statusEl) {
			statusEl.textContent = 'Unlocked as ' + truncAddr;
		}
		if (__skiReturnUrl) {
			if (statusEl) statusEl.textContent += ' — redirecting...';
			setTimeout(function() { window.location.href = __skiReturnUrl; }, 600);
		}
	});
};

SuiWalletKit.renderModal('wk-modal');

document.getElementById('ski-login-btn').onclick = function() {
	SuiWalletKit.openModal();
};

if (__skiServerSession && __skiServerSession.address && __skiReturnUrl) {
	var statusEl = document.getElementById('ski-status');
	if (statusEl) {
		statusEl.className = 'ski-status success';
		statusEl.textContent = 'Welcome back, ' + __skiServerSession.address.slice(0, 6) + '...' + __skiServerSession.address.slice(-4) + ' — redirecting...';
	}
	setTimeout(function() { window.location.href = __skiReturnUrl; }, 800);
} else {
	SuiWalletKit.detectWallets().then(function(wallets) {
		var statusEl = document.getElementById('ski-status');
		var loginBtn = document.getElementById('ski-login-btn');
		
		var session = getWalletSession();
		if (session && session.address) {
			__wkActivateLocks();
			if (statusEl) {
				statusEl.className = 'ski-status success';
				statusEl.textContent = 'Key detected: ' + session.address.slice(0, 6) + '...' + session.address.slice(-4);
			}
			if (__skiReturnUrl) {
				if (statusEl) statusEl.textContent += ' — redirecting...';
				setTimeout(function() { window.location.href = __skiReturnUrl; }, 1000);
				return;
			}
		}

		if (!wallets || wallets.length === 0) {
			if (statusEl) statusEl.textContent = 'No Sui keys detected. Please install a wallet.';
			if (loginBtn) {
				loginBtn.style.display = 'block';
				loginBtn.textContent = 'Install Sui Wallet';
				loginBtn.onclick = function() { window.open('https://phantom.app/download', '_blank'); };
			}
			return;
		}
		
		if (statusEl) statusEl.textContent = 'Ready to unlock';
		if (loginBtn) {
			loginBtn.style.display = 'block';
			loginBtn.textContent = 'Sign In with Sui';
			loginBtn.onclick = function() { SuiWalletKit.openModal(); };
		}
		
		// Auto-open modal if no session
		if (!session || !session.address) {
			setTimeout(function() { SuiWalletKit.openModal(); }, 500);
		}
	});
}
</script>
</body></html>`
}
