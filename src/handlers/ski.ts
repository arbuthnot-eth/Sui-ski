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
	background: radial-gradient(circle at center, rgba(34, 197, 94, 0.11) 0%, rgba(16, 185, 129, 0.04) 35%, transparent 62%);
	pointer-events: none; z-index: 0;
}
${generateWalletUiCss()}
.ski-container{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:24px;width:100%;max-width:460px;padding:20px}
.ski-suins-preview{width:100%;border-radius:20px;border:1px solid rgba(74,222,128,0.25);background:linear-gradient(140deg, rgba(8,20,15,0.96), rgba(10,18,16,0.9));box-shadow:0 18px 42px rgba(16,185,129,0.12), inset 0 0 0 1px rgba(34,197,94,0.08);padding:16px}
.ski-suins-top{display:flex;gap:14px;align-items:center;margin-bottom:12px}
.ski-green-orb{width:72px;height:72px;border-radius:999px;background:radial-gradient(circle at 30% 30%, rgba(134,239,172,0.95), rgba(34,197,94,0.55) 44%, rgba(5,46,22,0.6) 78%);box-shadow:0 0 28px rgba(34,197,94,0.25), inset 0 0 0 1px rgba(187,247,208,0.3);display:flex;align-items:center;justify-content:center;color:#f0fdf4}
.ski-green-orb svg{width:34px;height:34px;filter:drop-shadow(0 0 8px rgba(220,252,231,0.35))}
.ski-suins-title{display:flex;flex-direction:column;gap:3px;min-width:0}
.ski-suins-title h2{font-size:1.35rem;font-weight:900;letter-spacing:-0.02em;color:#bbf7d0;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
.ski-suins-sub{font-size:0.72rem;font-family:'JetBrains Mono',monospace;color:#86efac;letter-spacing:0.04em;text-transform:uppercase}
.ski-suins-grid{display:grid;grid-template-columns:1fr;gap:8px}
.ski-meta-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 9px;border-radius:10px;background:rgba(20,36,27,0.55);border:1px solid rgba(34,197,94,0.12);font-size:0.72rem}
.ski-meta-label{color:#86efac;text-transform:uppercase;letter-spacing:0.05em;font-family:'JetBrains Mono',monospace}
.ski-meta-value{color:#dcfce7;font-family:'JetBrains Mono',monospace;font-weight:600;text-align:right;word-break:break-all}
.ski-meta-value.pending{color:#bbf7d0}
.ski-logo{filter:drop-shadow(0 0 20px rgba(34,197,94,0.35))}
.ski-header{text-align:center}
.ski-header h1{font-size:1.5rem;font-weight:800;background:linear-gradient(135deg,#34d399,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;letter-spacing:-0.02em}
.ski-header p{color:#71717a;font-size:0.85rem;font-family:monospace}
.ski-status{text-align:center;padding:12px 20px;color:#71717a;font-size:0.85rem;min-height:40px}
.ski-status.success{color:#34d399}
.ski-status.error{color:#f87171}
.ski-locks{display:flex;gap:12px;margin-top:8px}
.ski-lock{width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:#52525b;transition:all 0.3s ease}
.ski-lock.active{color:#22c55e;border-color:rgba(34,197,94,0.36);background:rgba(34,197,94,0.13);box-shadow:0 0 15px rgba(34,197,94,0.24)}
.ski-login-btn{margin-top:12px;padding:12px 24px;background:linear-gradient(135deg,#22c55e,#10b981);border:none;border-radius:12px;color:white;font-weight:700;font-size:0.95rem;cursor:pointer;transition:all 0.2s ease;box-shadow:0 4px 15px rgba(34,197,94,0.25)}
.ski-login-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(34,197,94,0.35)}
.ski-login-btn:active{transform:translateY(0)}
@media (max-width: 560px){
	.ski-container{max-width:100%;padding:14px}
	.ski-suins-title h2{max-width:220px;font-size:1.2rem}
	.ski-green-orb{width:62px;height:62px}
}
</style>
</head><body>
<div class="ski-container">
	<div class="ski-suins-preview">
		<div class="ski-suins-top">
			<div class="ski-green-orb">${generateLogoSvg(34)}</div>
			<div class="ski-suins-title">
				<h2 id="ski-name-title">pending.sui</h2>
				<div class="ski-suins-sub">SuiNS Pre-Mint Derived Object</div>
			</div>
		</div>
		<div class="ski-suins-grid">
			<div class="ski-meta-row">
				<span class="ski-meta-label">Name Key</span>
				<span class="ski-meta-value" id="ski-name-key">pending</span>
			</div>
			<div class="ski-meta-row">
				<span class="ski-meta-label">Derived NFT ID</span>
				<span class="ski-meta-value" id="ski-derived-nft-id">0x--</span>
			</div>
			<div class="ski-meta-row">
				<span class="ski-meta-label">Mint State</span>
				<span class="ski-meta-value pending" id="ski-mint-state">Unminted</span>
			</div>
			<div class="ski-meta-row">
				<span class="ski-meta-label">Owner Key</span>
				<span class="ski-meta-value" id="ski-owner-key">--</span>
			</div>
		</div>
	</div>
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
	__skiUpdatePreviewOwner(addr);

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

function __skiNormalizeNameKey(raw) {
	var value = String(raw || '').trim().toLowerCase();
	value = value.replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
	if (!value) value = 'pending';
	value = value.replace(/\\.sui$/i, '');
	if (!value) value = 'pending';
	return value;
}

function __skiExtractNameKeyFromReturn() {
	try {
		var params = new URLSearchParams(window.location.search);
		var explicit = params.get('name');
		if (explicit) return __skiNormalizeNameKey(explicit);
		if (!__skiReturnUrl) return 'pending';
		var parsed = new URL(__skiReturnUrl);
		var host = String(parsed.hostname || '').toLowerCase();
		if (!host.endsWith('.sui.ski')) return 'pending';
		var rawSub = host.slice(0, -('.sui.ski'.length));
		if (!rawSub || rawSub === 'sui' || rawSub === 't' || rawSub === 'd' || rawSub === 'in' || rawSub === 'www') return 'pending';
		return __skiNormalizeNameKey(rawSub);
	} catch (_e) {
		return 'pending';
	}
}

function __skiDeriveObjectIdFromNameKey(nameKey) {
	var seed = String(nameKey || 'pending');
	var h1 = 0x811c9dc5;
	var h2 = 0x811c9dc5;
	for (var i = 0; i < seed.length; i++) {
		var c = seed.charCodeAt(i);
		h1 ^= c;
		h2 ^= c + i;
		h1 = Math.imul(h1, 0x01000193);
		h2 = Math.imul(h2, 0x01000197);
	}
	function toChunk(v) {
		var n = (v >>> 0).toString(16);
		return ('00000000' + n).slice(-8);
	}
	var hex = '';
	for (var j = 0; j < 8; j++) {
		h1 = Math.imul(h1 ^ (0x9e3779b9 + j), 0x85ebca6b);
		h2 = Math.imul(h2 ^ (0xc2b2ae35 + j), 0x27d4eb2f);
		hex += toChunk(h1) + toChunk(h2);
	}
	return '0x' + hex.slice(0, 64);
}

function __skiUpdatePreviewOwner(address) {
	var ownerEl = document.getElementById('ski-owner-key');
	if (!ownerEl) return;
	if (!address) {
		ownerEl.textContent = '--';
		return;
	}
	ownerEl.textContent = address.slice(0, 8) + '...' + address.slice(-6);
}

function __skiInitDerivedPreview() {
	var nameKey = __skiExtractNameKeyFromReturn();
	var fullName = nameKey + '.sui';
	var nftId = __skiDeriveObjectIdFromNameKey(nameKey);
	var titleEl = document.getElementById('ski-name-title');
	var keyEl = document.getElementById('ski-name-key');
	var nftEl = document.getElementById('ski-derived-nft-id');
	if (titleEl) titleEl.textContent = fullName;
	if (keyEl) keyEl.textContent = nameKey;
	if (nftEl) nftEl.textContent = nftId;
	var conn = SuiWalletKit.$connection.value;
	var session = getWalletSession();
	var owner = (conn && conn.address) || (session && session.address) || (__skiServerSession && __skiServerSession.address) || '';
	__skiUpdatePreviewOwner(owner);
}

SuiWalletKit.renderModal('wk-modal');
__skiInitDerivedPreview();

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
