import type { Env } from '../types'
import {
	skiEventBridge,
	skiScriptTag,
	skiStyleTag,
	skiWalletBridge,
	skiWidgetMarkup,
} from '../utils/ski-embed'
import { getSuiGraphQLUrl } from '../utils/sui-graphql'
import { generateWalletTxJs } from '../utils/wallet-tx-js'

export function generateSkiSignPage(env: Env): string {
	return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>SKI Sign Bridge</title>
<style>
@keyframes __skiTendrilSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes __skiTendrilPulse{0%,100%{opacity:.35;filter:blur(38px)}50%{opacity:.55;filter:blur(28px)}}
@keyframes __skiDiamondGlow{0%,100%{box-shadow:0 0 30px 2px rgba(80,40,120,.25),0 0 60px 4px rgba(40,0,80,.15),0 12px 48px rgba(0,0,0,.9)}50%{box-shadow:0 0 40px 4px rgba(100,50,160,.35),0 0 80px 8px rgba(60,0,120,.2),0 12px 48px rgba(0,0,0,.9)}}
body{margin:0;background:transparent}
*::-webkit-scrollbar{width:6px!important;height:6px!important}
*::-webkit-scrollbar-track{background:#000!important}
*::-webkit-scrollbar-thumb{background:#0a0a0a!important;border-radius:3px!important;border:1px solid #111!important}
*::-webkit-scrollbar-thumb:hover{background:#151515!important}
*::-webkit-scrollbar-corner{background:#000!important}
*{scrollbar-width:thin!important;scrollbar-color:#0a0a0a #000!important}
#waap-wallet-iframe-container{z-index:13001!important;background:radial-gradient(ellipse at center,rgba(0,0,0,.92) 0%,rgba(0,0,0,.97) 60%,#000 100%)!important}
#waap-wallet-iframe-container::before{content:'';position:fixed;top:50%;left:50%;width:600px;height:600px;margin:-300px 0 0 -300px;background:conic-gradient(from 0deg,transparent 0%,rgba(60,20,100,.3) 10%,transparent 20%,rgba(40,10,80,.2) 30%,transparent 40%,rgba(80,30,140,.25) 55%,transparent 65%,rgba(50,15,90,.15) 75%,transparent 85%,rgba(70,25,120,.2) 95%,transparent 100%);border-radius:50%;animation:__skiTendrilSpin 12s linear infinite,__skiTendrilPulse 4s ease-in-out infinite;pointer-events:none;z-index:-1}
#waap-wallet-iframe-container::after{content:'';position:fixed;top:50%;left:50%;width:450px;height:450px;margin:-225px 0 0 -225px;background:conic-gradient(from 180deg,transparent 0%,rgba(90,40,150,.2) 15%,transparent 25%,rgba(50,20,100,.15) 40%,transparent 50%,rgba(70,30,130,.2) 65%,transparent 75%,rgba(60,25,110,.1) 90%,transparent 100%);border-radius:50%;animation:__skiTendrilSpin 8s linear infinite reverse,__skiTendrilPulse 5s ease-in-out infinite .5s;pointer-events:none;z-index:-1}
#waap-wallet-iframe-wrapper{height:520px!important;max-height:82vh!important;background:transparent!important;overflow:hidden!important;border-radius:18px!important;position:relative!important}
#waap-wallet-iframe-wrapper::before{content:'';position:absolute;inset:-1px;border-radius:19px;background:linear-gradient(135deg,rgba(80,40,140,.4),rgba(20,5,40,.1) 40%,rgba(0,0,0,0) 50%,rgba(20,5,40,.1) 60%,rgba(60,30,110,.3));z-index:-1;pointer-events:none}
#waap-wallet-iframe{height:520px!important;max-height:82vh!important;border-radius:18px!important;animation:__skiDiamondGlow 6s ease-in-out infinite!important;background:#050505!important;color-scheme:dark!important;border:1px solid rgba(80,40,140,.15)!important}
#waap-wallet-iframe-container div[style*="background"]{background:transparent!important;background-color:transparent!important}
</style>
${skiStyleTag()}
</head><body>
${skiWidgetMarkup()}
<script>
var __skiNetwork = '${env.SUI_NETWORK || 'mainnet'}';
${skiWalletBridge({ network: env.SUI_NETWORK })}
var __skiGraphQLUrl = '${getSuiGraphQLUrl(env)}';
var _skiAddr = null;
${generateWalletTxJs()}

var __signReady = false;
var __TransactionClass = null;
var __SuiClientClass = null;
var __suiClient = null;
var __RPC_URLS = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
	devnet: 'https://fullnode.devnet.sui.io:443',
};
var __handoffMode = '';
var __handoffWalletName = '';
var __handoffSender = '';
var __handoffReturnUrl = '';
var __handoffComplete = false;

function __normalizeHandoffReturnUrl(raw) {
	if (typeof raw !== 'string') return '';
	var trimmed = raw.trim();
	if (!trimmed) return '';
	try {
		var parsed = new URL(trimmed, window.location.href);
		if (parsed.protocol !== 'https:') return '';
		var host = String(parsed.hostname || '').toLowerCase();
		if (host !== 'sui.ski' && !(host.length > 8 && host.slice(-8) === '.sui.ski')) return '';
		return parsed.toString();
	} catch (_e) {
		return '';
	}
}

(function() {
	try {
		var params = new URLSearchParams(window.location.search || '');
		__handoffMode = String(params.get('bridge') || '').trim().toLowerCase();
		__handoffWalletName = String(params.get('walletName') || '').trim();
		__handoffSender = String(params.get('sender') || '').trim();
		__handoffReturnUrl = __normalizeHandoffReturnUrl(String(params.get('returnUrl') || ''));
	} catch (_e) {}
})();

function __normalizeAddress(address) {
	if (typeof address !== 'string') return '';
	var trimmed = address.trim().toLowerCase();
	if (!trimmed) return '';
	if (trimmed.indexOf('0x') === 0) trimmed = trimmed.slice(2);
	if (!trimmed || trimmed.length > 64 || /[^0-9a-f]/.test(trimmed)) return '';
	trimmed = trimmed.replace(/^0+/, '');
	if (!trimmed) return '';
	return '0x' + trimmed.padStart(64, '0');
}

function __extractWalletAccounts(wallet) {
	if (!wallet || typeof wallet !== 'object') return [];
	var out = [];
	var seen = {};
	function pushAccount(account) {
		if (!account || typeof account !== 'object') return;
		var normalized = __normalizeAddress(account.address);
		if (!normalized || seen[normalized]) return;
		seen[normalized] = true;
		out.push(account);
	}
	function collect(source) {
		if (!source || (typeof source !== 'object' && typeof source !== 'function')) return;
		var accounts = null;
		try { accounts = source.accounts; } catch (_e) {}
		if (typeof accounts === 'function') {
			try { accounts = accounts.call(source); } catch (_e2) { accounts = null; }
		}
		if (Array.isArray(accounts)) {
			for (var i = 0; i < accounts.length; i++) pushAccount(accounts[i]);
		}
		var account = null;
		try { account = source.account; } catch (_e3) {}
		pushAccount(account);
	}
	collect(wallet);
	collect(wallet._raw);
	collect(wallet.sui);
	return out;
}

function __walletNeedsLiveAccount(wallet) {
	return __walletNamesMatch(wallet && wallet.name, 'waap');
}

function __resolveSigningAccount(conn, expectedSender) {
	if (!conn || !conn.wallet) return null;
	var target = __normalizeAddress(expectedSender);
	var walletAccounts = __extractWalletAccounts(conn.wallet);
	var connAccount = (conn.account && typeof conn.account === 'object') ? conn.account : null;

	for (var i = 0; i < walletAccounts.length; i++) {
		var candidate = __normalizeAddress(walletAccounts[i] && walletAccounts[i].address);
		if (target && candidate && candidate === target) return walletAccounts[i];
	}

	if (!target) {
		if (connAccount) {
			var connAddress = __normalizeAddress(connAccount.address);
			for (var ci = 0; ci < walletAccounts.length; ci++) {
				if (__normalizeAddress(walletAccounts[ci] && walletAccounts[ci].address) === connAddress) {
					return walletAccounts[ci];
				}
			}
			if (!walletAccounts.length) return connAccount;
		}
		return walletAccounts.length ? walletAccounts[0] : null;
	}

	if (connAccount && __normalizeAddress(connAccount.address) === target && !walletAccounts.length) {
		return connAccount;
	}

	return null;
}

function __normalizeWalletName(name) {
	var normalized = String(name || '').trim().toLowerCase();
	if (!normalized) return '';
	normalized = normalized.replace(/[^a-z0-9]+/g, ' ').trim();
	if (!normalized) return '';
	if (normalized.slice(-7) === ' wallet') {
		normalized = normalized.slice(0, -7).trim();
	}
	return normalized.replace(/ +/g, '');
}

var __walletAliasGroups = [
	['slush', 'sui', 'suiwallet', 'slushwallet', 'mystenwallet'],
	['suiet', 'suietwallet'],
	['phantom', 'phantomwallet'],
	['backpack', 'backpackwallet'],
];

function __walletAliasMatch(leftKey, rightKey) {
	for (var g = 0; g < __walletAliasGroups.length; g++) {
		var group = __walletAliasGroups[g];
		var hasLeft = false;
		var hasRight = false;
		for (var i = 0; i < group.length; i++) {
			if (group[i] === leftKey) hasLeft = true;
			if (group[i] === rightKey) hasRight = true;
		}
		if (hasLeft && hasRight) return true;
	}
	return false;
}

function __walletNamesMatch(left, right) {
	var leftKey = __normalizeWalletName(left);
	var rightKey = __normalizeWalletName(right);
	if (!leftKey || !rightKey) return false;
	if (leftKey === rightKey) return true;
	if (__walletAliasMatch(leftKey, rightKey)) return true;
	if (leftKey.length >= 5 && rightKey.length >= 5) {
		return leftKey.indexOf(rightKey) !== -1 || rightKey.indexOf(leftKey) !== -1;
	}
	return false;
}

function __serializeBridgeWallet(wallet) {
	if (!wallet || typeof wallet !== 'object') return null;
	var name = wallet.name ? String(wallet.name) : '';
	if (!name) return null;
	var icon = '';
	try { if (wallet.icon) icon = String(wallet.icon); } catch (_e) {}
	return {
		name: name,
		icon: icon,
		__isPasskey: !!wallet.__isPasskey,
	};
}

var __bridgeWalletCache = {};
var __bridgeWalletOrder = [];
var __lastPreferredConnectError = '';

function __getBridgeWalletCandidates() {
	var wallets = [];
	try {
		wallets = [];
	} catch (_e) {}
	if (!Array.isArray(wallets) || wallets.length === 0) {
		wallets = [] || [];
	}
	return Array.isArray(wallets) ? wallets : [];
}

function __getBridgeWalletList(walletsInput) {
	var wallets = Array.isArray(walletsInput) ? walletsInput : __getBridgeWalletCandidates();
	var byKey = {};
	var order = [];
	for (var i = 0; i < wallets.length; i++) {
		var serialized = __serializeBridgeWallet(wallets[i]);
		if (!serialized) continue;
		var key = __normalizeWalletName(serialized.name);
		if (!key) key = 'wallet-' + i;
		var existing = byKey[key];
		if (!existing) {
			byKey[key] = serialized;
			order.push(key);
			continue;
		}
		if (!existing.icon && serialized.icon) {
			existing.icon = serialized.icon;
		}
		if (existing.__isPasskey && !serialized.__isPasskey) {
			existing.__isPasskey = false;
		}
	}
	var result = [];
	for (var o = 0; o < order.length; o++) {
		if (byKey[order[o]]) result.push(byKey[order[o]]);
	}
	return result;
}

function __mergeBridgeWalletCache(wallets) {
	var list = Array.isArray(wallets) ? wallets : [];
	for (var i = 0; i < list.length; i++) {
		var wallet = list[i];
		if (!wallet || !wallet.name) continue;
		var key = __normalizeWalletName(wallet.name);
		if (!key) key = 'wallet-' + i;
		var existing = __bridgeWalletCache[key];
		if (!existing) {
			__bridgeWalletCache[key] = {
				name: String(wallet.name),
				icon: wallet.icon ? String(wallet.icon) : '',
				__isPasskey: !!wallet.__isPasskey,
			};
			__bridgeWalletOrder.push(key);
			continue;
		}
		if (!existing.icon && wallet.icon) existing.icon = String(wallet.icon);
		if (existing.__isPasskey && !wallet.__isPasskey) existing.__isPasskey = false;
	}
	var snapshot = [];
	for (var j = 0; j < __bridgeWalletOrder.length; j++) {
		var cacheKey = __bridgeWalletOrder[j];
		if (__bridgeWalletCache[cacheKey]) snapshot.push(__bridgeWalletCache[cacheKey]);
	}
	return snapshot;
}

function __mergeBridgeWalletHints(walletHints) {
	var normalizedHints = __getBridgeWalletList(Array.isArray(walletHints) ? walletHints : []);
	if (normalizedHints.length === 0) {
		return __mergeBridgeWalletCache([]);
	}
	return __mergeBridgeWalletCache(normalizedHints);
}

function __bridgeWalletListSignature(wallets) {
	var list = Array.isArray(wallets) ? wallets : [];
	var parts = [];
	for (var i = 0; i < list.length; i++) {
		var wallet = list[i];
		if (!wallet || !wallet.name) continue;
		parts.push(
			__normalizeWalletName(wallet.name)
			+ '|' + String(wallet.icon || '')
			+ '|' + (wallet.__isPasskey ? '1' : '0')
		);
	}
	return parts.join(',');
}

function __sleep(ms) {
	return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function __collectBridgeWalletCandidates() {
	var cachedBefore = __mergeBridgeWalletCache([]);
	try { await Promise.resolve([]); } catch (_e) {}
	if (window.__wkWaaPLoading) {
		try { await window.__wkWaaPLoading; } catch (_e) {}
	}
	var best = __getBridgeWalletCandidates();
	var bestLen = best.length;
	var lastSig = __bridgeWalletListSignature(__getBridgeWalletList(best));
	var stableTicks = 0;
	var startedAt = Date.now();
	var minScanMs = bestLen <= 2 ? 2200 : 1200;
	if (cachedBefore.length === 0 && minScanMs < 1600) {
		minScanMs = 1600;
	}
	var maxScanMs = bestLen <= 2 ? 4200 : 2400;
	var deadline = startedAt + maxScanMs;
	while (Date.now() < deadline) {
		await __sleep(220);
		try { await Promise.resolve([]); } catch (_e) {}
		var next = __getBridgeWalletCandidates();
		if (next.length > bestLen) {
			best = next;
			bestLen = next.length;
		}
		var sig = __bridgeWalletListSignature(__getBridgeWalletList(next));
		if (sig === lastSig) {
			stableTicks++;
		} else {
			stableTicks = 0;
			lastSig = sig;
		}
		var elapsed = Date.now() - startedAt;
		if (next.length > 0 && stableTicks >= 3 && elapsed >= minScanMs) {
			if (next.length >= bestLen) best = next;
			break;
		}
	}
	return best;
}

async function __collectBridgeWalletList(walletHints) {
	__mergeBridgeWalletHints(walletHints);
	var wallets = await __collectBridgeWalletCandidates();
	var current = __getBridgeWalletList(wallets);
	return __mergeBridgeWalletCache(current);
}

async function __collectBridgeWalletCandidatesForConnection(walletHints) {
	__mergeBridgeWalletHints(walletHints);
	var wallets = await __collectBridgeWalletCandidates();
	var current = __getBridgeWalletList(wallets);
	__mergeBridgeWalletCache(current);
	return Array.isArray(wallets) ? wallets : [];
}

function __readSessionWallet() {
	try {
		var parts = document.cookie ? document.cookie.split(';') : [];
		var address = '';
		var walletName = '';
		for (var i = 0; i < parts.length; i++) {
			var part = String(parts[i] || '').trim();
			if (!part) continue;
			var eqIndex = part.indexOf('=');
			if (eqIndex <= 0) continue;
			var key = part.slice(0, eqIndex).trim();
			var raw = part.slice(eqIndex + 1).trim();
			if (key === 'wallet_address') {
				try { address = decodeURIComponent(raw); } catch (_e) { address = raw; }
				continue;
			}
			if (key === 'wallet_name') {
				try { walletName = decodeURIComponent(raw); } catch (_e2) { walletName = raw; }
			}
		}
		if (!address && !walletName) return null;
		return { address: address, walletName: walletName };
	} catch (_e) {
		return null;
	}
}

var __WALLET_HISTORY_KEY = 'ski_wallet_history';

function __readWalletHistory() {
	try {
		var raw = localStorage.getItem(__WALLET_HISTORY_KEY);
		if (!raw) return [];
		var parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch (_e) {
		return [];
	}
}

function __saveWalletToHistory(walletName, address) {
	if (!walletName) return;
	try {
		var history = __readWalletHistory();
		var existing = -1;
		for (var i = 0; i < history.length; i++) {
			if (history[i].walletName === walletName && history[i].address === address) {
				existing = i;
				break;
			}
		}
		if (existing >= 0) {
			history[existing].lastUsed = Date.now();
		} else {
			history.push({ walletName: walletName, address: address, lastUsed: Date.now() });
		}
		history.sort(function(a, b) { return b.lastUsed - a.lastUsed; });
		if (history.length > 10) history.length = 10;
		localStorage.setItem(__WALLET_HISTORY_KEY, JSON.stringify(history));
	} catch (_e) {}
}

function __walletHasAddress(wallet, targetAddress) {
	if (!wallet || !targetAddress) return false;
	var accounts = __extractWalletAccounts(wallet);
	for (var i = 0; i < accounts.length; i++) {
		if (__normalizeAddress(accounts[i] && accounts[i].address) === targetAddress) return true;
	}
	return false;
}

function __walletCanSignTransactions(wallet) {
	if (!wallet || typeof wallet !== 'object') return false;
	var features = wallet.features || {};
	var raw = wallet._raw || null;
	if (
		(features['sui:signAndExecuteTransaction'] && typeof features['sui:signAndExecuteTransaction'].signAndExecuteTransaction === 'function')
		|| (features['sui:signAndExecuteTransactionBlock'] && typeof features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock === 'function')
		|| (features['sui:signTransaction'] && typeof features['sui:signTransaction'].signTransaction === 'function')
		|| (features['sui:signTransactionBlock'] && typeof features['sui:signTransactionBlock'].signTransactionBlock === 'function')
	) {
		return true;
	}
	if (
		typeof wallet.signAndExecuteTransaction === 'function'
		|| typeof wallet.signAndExecuteTransactionBlock === 'function'
		|| typeof wallet.signTransaction === 'function'
		|| typeof wallet.signTransactionBlock === 'function'
	) {
		return true;
	}
	if (
		raw && (
			typeof raw.signAndExecuteTransaction === 'function'
			|| typeof raw.signAndExecuteTransactionBlock === 'function'
			|| typeof raw.signTransaction === 'function'
			|| typeof raw.signTransactionBlock === 'function'
		)
	) {
		return true;
	}
	return false;
}

async function __ensureWalletConnection(preferredWalletName, expectedSender, allowHistoryFallback, walletHints, forceInteractive) {
	__lastPreferredConnectError = '';
	var normalizedSender = __normalizeAddress(expectedSender);
	var allowHistory = allowHistoryFallback !== false;
	var mustInteractive = !!forceInteractive;
	__mergeBridgeWalletHints(walletHints);
	var conn = _skiConn || null;
	var targetWalletName = preferredWalletName || '';
	if (!mustInteractive && conn && conn.wallet) {
		if (!preferredWalletName || __walletNamesMatch(conn.wallet.name, preferredWalletName)) {
			return conn;
		}
		if (normalizedSender && __walletHasAddress(conn.wallet, normalizedSender)) {
			return conn;
		}
	}

	var wallets = [];
	try {
		wallets = await Promise.resolve([]);
	} catch (_e) {
		wallets = [] || [];
	}
	if (!Array.isArray(wallets) || wallets.length === 0) return conn;

	console.log('[SignBridge] Detected wallets:', wallets.map(function(w) { return w && w.name; }));

	var session = __readSessionWallet();
	if (!targetWalletName) {
		targetWalletName = session && session.walletName ? session.walletName : '';
	}
	var match = null;

	if (targetWalletName) {
		var preferredFallback = null;
		for (var i = 0; i < wallets.length; i++) {
			if (__walletNamesMatch(wallets[i] && wallets[i].name, targetWalletName)) {
				if (__walletCanSignTransactions(wallets[i])) {
					match = wallets[i];
					break;
				}
				if (!preferredFallback) preferredFallback = wallets[i];
			}
		}
		if (!match && preferredFallback) {
			match = preferredFallback;
		}
	}

	if (!match && normalizedSender) {
		for (var a = 0; a < wallets.length; a++) {
			if (
				wallets[a]
				&& !wallets[a].__isPasskey
				&& __walletCanSignTransactions(wallets[a])
				&& __walletHasAddress(wallets[a], normalizedSender)
			) {
				match = wallets[a];
				console.log('[SignBridge] Matched wallet by address:', match.name);
				break;
			}
		}
	}

	if (!allowHistory && !targetWalletName && !normalizedSender) {
		console.warn('[SignBridge] No wallet hint for signing; refusing history-based auto-selection');
		return conn;
	}

	if (!match && allowHistory && !targetWalletName) {
		var history = __readWalletHistory();
		for (var h = 0; h < history.length && !match; h++) {
			for (var hw = 0; hw < wallets.length; hw++) {
				if (
					wallets[hw]
					&& !wallets[hw].__isPasskey
					&& __walletCanSignTransactions(wallets[hw])
					&& __walletNamesMatch(wallets[hw].name, history[h].walletName)
				) {
					match = wallets[hw];
					console.log('[SignBridge] Matched wallet from history:', match.name);
					break;
				}
			}
		}
	}

	if (!match && preferredWalletName) {
		console.warn('[SignBridge] Preferred wallet not available:', preferredWalletName);
		__lastPreferredConnectError = 'Selected wallet not available: ' + preferredWalletName;
		return null;
	}

	if (!match) {
		for (var p = 0; p < wallets.length; p++) {
			if (!wallets[p] || wallets[p].__isPasskey || !__walletCanSignTransactions(wallets[p])) continue;
			match = wallets[p];
			break;
		}
	}

	if (!match) {
		for (var p2 = 0; p2 < wallets.length; p2++) {
			if (!wallets[p2] || wallets[p2].__isPasskey) continue;
			match = wallets[p2];
			break;
		}
	}

	if (!match) match = wallets[0] || null;
	if (!match) return conn;

	if (!__walletCanSignTransactions(match)) {
		if (preferredWalletName) {
			if (window.parent && window.parent !== window) {
				__lastPreferredConnectError = 'Wallet requires top-frame signing. Open https://sui.ski/sign in this tab and reconnect ' + preferredWalletName + '.';
			} else {
				__lastPreferredConnectError = 'Selected wallet does not expose Sui signing in this context: ' + preferredWalletName;
			}
			return null;
		}
		__lastPreferredConnectError = 'No detected wallet exposes Sui transaction signing in this context';
		return conn;
	}

	console.log('[SignBridge] Connecting to wallet:', match.name);

	var sessionAddr = normalizedSender || '';
	if (!sessionAddr) {
		var sessionData = __readSessionWallet();
		sessionAddr = sessionData && sessionData.address ? __normalizeAddress(sessionData.address) : '';
	}

	var preAccounts = [];
	try { preAccounts = __extractWalletAccounts(match); } catch (_ae) {}

	var resolvedAddr = '';
	var resolvedAccount = null;

	if (preAccounts.length > 0) {
		for (var pa = 0; pa < preAccounts.length; pa++) {
			var paAddr = __normalizeAddress(preAccounts[pa] && preAccounts[pa].address);
			if (paAddr && (!sessionAddr || paAddr === sessionAddr)) {
				resolvedAddr = paAddr;
				resolvedAccount = preAccounts[pa];
				break;
			}
		}
		if (!resolvedAddr && preAccounts[0] && preAccounts[0].address) {
			resolvedAddr = __normalizeAddress(preAccounts[0].address);
			resolvedAccount = preAccounts[0];
		}
	}

	var requiresLiveAccount = __walletNeedsLiveAccount(match);

	if (!resolvedAddr && sessionAddr) {
		resolvedAddr = sessionAddr;
		if (!requiresLiveAccount) {
			var networkChain = 'sui:' + (__skiNetwork || 'mainnet');
			resolvedAccount = { address: sessionAddr, chains: [networkChain] };
		}
	}

	if (resolvedAddr && !mustInteractive && (!requiresLiveAccount || !!resolvedAccount)) {
		_skiConn = { wallet: match, account: resolvedAccount || null, address: resolvedAddr, walletName: match.name };
		_skiAddr = resolvedAddr;
		console.log('[SignBridge] Restored wallet from session (no popup):', match.name, resolvedAddr);
		return _skiConn;
	}

	if (!mustInteractive && allowHistoryFallback === false && window.parent && window.parent !== window) {
		__lastPreferredConnectError = 'Wallet session unavailable in bridge. Reconnect wallet from sui.ski and retry.';
		if (preferredWalletName) return null;
		return conn;
	}

	try {
		await _skiConnect(match.name);
	} catch (_e) {
		__lastPreferredConnectError = (_e && _e.message) ? String(_e.message) : 'Connection failed';
		if (preferredWalletName) return null;
		return _skiConn || conn;
	}

	return _skiConn || conn;
}

function __notifyReady() {
	if (__signReady) return;
	__signReady = true;
	if (window.parent && window.parent !== window) {
		window.parent.postMessage({ type: 'ski:ready' }, '*');
	}
	if (window.opener && window.opener !== window) {
		try {
			window.opener.postMessage({ type: 'ski:ready' }, '*');
		} catch (_e) {}
	}
}

function __isTopFrameHandoff() {
	return (
		__handoffMode === 'handoff'
		&& !!__handoffReturnUrl
		&& (!window.parent || window.parent === window)
	);
}

function __completeTopFrameHandoff(status, errorMessage) {
	if (__handoffComplete) return;
	if (!__isTopFrameHandoff()) return;
	__handoffComplete = true;
	try {
		var next = new URL(__handoffReturnUrl);
		next.searchParams.set('ski_handoff', '1');
		next.searchParams.set('ski_handoff_status', status === 'ok' ? 'ok' : 'error');
		if (errorMessage) next.searchParams.set('ski_handoff_error', String(errorMessage).slice(0, 180));
		window.location.replace(next.toString());
	} catch (_e) {
		window.location.href = __handoffReturnUrl;
	}
}

function __finishTopFrameHandoffIfConnected() {
	if (!__isTopFrameHandoff()) return false;
	var conn = _skiAddr;
	if (!conn || !conn.address) return false;
	var expectedSender = __normalizeAddress(__handoffSender);
	if (expectedSender && __normalizeAddress(conn.address) !== expectedSender) return false;
	var walletName = (conn.wallet && conn.wallet.name) || __handoffWalletName || '';
	__saveWalletToHistory(walletName, conn.address);
	__completeTopFrameHandoff('ok', '');
	return true;
}

async function __beginTopFrameHandoffFlow() {
	if (!__isTopFrameHandoff()) return;
	if (__finishTopFrameHandoffIfConnected()) return;
	try {
		var expectedSender = __normalizeAddress(__handoffSender);
		if (__handoffWalletName) {
			var match = await __ensureWalletConnection(__handoffWalletName, expectedSender, true, [], true);
			if (match && match.address && (!expectedSender || __normalizeAddress(match.address) === expectedSender)) {
				__saveWalletToHistory((match.wallet && match.wallet.name) || __handoffWalletName, match.address);
				__completeTopFrameHandoff('ok', '');
				return;
			}
		}
		var existing = _skiAddr;
		if (existing && existing.address && (!expectedSender || __normalizeAddress(existing.address) === expectedSender)) {
			__saveWalletToHistory((existing.wallet && existing.wallet.name) || __handoffWalletName, existing.address);
			__completeTopFrameHandoff('ok', '');
			return;
		}
		window.dispatchEvent(new CustomEvent('ski:request-signin'));
	} catch (err) {
		__completeTopFrameHandoff('error', (err && err.message) ? err.message : 'Wallet handoff failed');
	}
}

function __isAllowedOrigin(origin) {
	if (origin === 'https://sui.ski') return true;
	var suffix = '.sui.ski';
	return origin.indexOf('https://') === 0 && origin.length > 8 + suffix.length && origin.slice(-(suffix.length)) === suffix;
}

function __errorMessage(err) {
	if (!err) return '';
	if (typeof err === 'string') return err.toLowerCase();
	if (err && typeof err.message === 'string') return err.message.toLowerCase();
	return String(err).toLowerCase();
}

function __isSigningCompatibilityError(err) {
	var message = __errorMessage(err);
	if (!message) return false;
	return (
		message.indexOf('missing required fields') !== -1
		|| message.indexOf('invalid transaction object') !== -1
		|| message.indexOf('invalid transaction') !== -1
		|| message.indexOf('unsupported transaction') !== -1
		|| message.indexOf('no compatible signing method found') !== -1
		|| message.indexOf('wallet does not support transaction signing') !== -1
		|| message.indexOf('wallet does not support signing') !== -1
		|| message.indexOf('account, transaction, or chain') !== -1
	);
}

function __shouldFallbackToSignOnly(err) {
	if (!err) return true;
	if (__isSigningCompatibilityError(err)) return true;
	var message = __errorMessage(err);
	if (!message) return true;
	return (
		message.indexOf('no compatible signing method found') !== -1
		|| message.indexOf('wallet does not support') !== -1
		|| message.indexOf('method not found') !== -1
		|| message.indexOf('unavailable') !== -1
	);
}

function __bytesToBase64(bytes) {
	if (typeof bytes === 'string') return bytes;
	if (bytes instanceof ArrayBuffer) bytes = new Uint8Array(bytes);
	if (Array.isArray(bytes)) bytes = Uint8Array.from(bytes);
	if (!bytes || typeof bytes.subarray !== 'function') {
		throw new Error('Expected transaction bytes');
	}
	var CHUNK = 8192;
	var parts = [];
	for (var i = 0; i < bytes.length; i += CHUNK) {
		parts.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length))));
	}
	return btoa(parts.join(''));
}

function __base64ToBytes(base64) {
	if (typeof base64 !== 'string') return null;
	var cleaned = base64.trim();
	if (!cleaned) return null;
	cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
	var mod = cleaned.length % 4;
	if (mod === 1) return null;
	if (mod === 2) cleaned += '==';
	else if (mod === 3) cleaned += '=';
	if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) return null;
	try {
		var raw = atob(cleaned);
		var bytes = new Uint8Array(raw.length);
		for (var i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
		return bytes;
	} catch (_e) {
		return null;
	}
}

function __extractBridgeTxPayload(value, depth) {
	if (!value || depth > 6) return null;
	if (typeof value === 'string') return value.trim();
	var bytes = __toExactArrayBuffer(value);
	if (bytes) return new Uint8Array(bytes);
	if (typeof value !== 'object') return null;

	var byteKeys = [
		'txBytes',
		'transactionBytes',
		'bytes',
		'rawBytes',
		'rawTransaction',
		'signedTransaction',
		'serializedTransaction',
		'transactionBlockBytes',
		'bcsBytes',
		'bcs',
	];
	for (var bi = 0; bi < byteKeys.length; bi++) {
		var nextBytes = __extractBridgeTxPayload(value[byteKeys[bi]], depth + 1);
		if (nextBytes) return nextBytes;
	}

	var txKeys = ['transaction', 'transactionBlock', 'tx', 'payload', 'data'];
	for (var ti = 0; ti < txKeys.length; ti++) {
		var nextTx = __extractBridgeTxPayload(value[txKeys[ti]], depth + 1);
		if (nextTx) return nextTx;
	}

	return null;
}

async function __fetchTransactionBlockByDigest(digest) {
	if (!digest || typeof digest !== 'string') return null;
	var gql = 'query GetTx($digest: String!) { transactionBlock(digest: $digest) { digest effects { status { success } objectChanges { nodes { idCreatedOrDeleted outputState { address } } } } } }';
	var gqlRes = await fetch(__skiGraphQLUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query: gql, variables: { digest: digest } }),
	});
	var gqlJson = await gqlRes.json().catch(function() { return null; });
	if (!gqlRes.ok || !gqlJson || gqlJson.errors || !gqlJson.data) return null;
	return gqlJson.data.transactionBlock || null;
}

function __mergeSignResult(baseResult, txBlock) {
	if (!txBlock || typeof txBlock !== 'object') return baseResult;
	var merged = {};
	var key = '';
	for (key in baseResult) merged[key] = baseResult[key];
	if (!merged.digest && txBlock.digest) merged.digest = txBlock.digest;
	if (!merged.effects && txBlock.effects) merged.effects = txBlock.effects;
	if ((!merged.objectChanges || !merged.objectChanges.length) && txBlock.objectChanges) {
		merged.objectChanges = txBlock.objectChanges;
	}
	if (!merged.rawEffects && txBlock.rawEffects) merged.rawEffects = txBlock.rawEffects;
	return merged;
}

async function __hydrateSignResult(result) {
	if (!result || typeof result !== 'object') return result;
	var digest = result.digest && typeof result.digest === 'string' ? result.digest : '';
	if (!digest) return result;
	var hasEffects = !!(result.effects && typeof result.effects === 'object');
	var hasObjectChanges = !!(result.objectChanges && result.objectChanges.length);
	var hasRawEffects = !!result.rawEffects;
	if (hasEffects && (hasObjectChanges || hasRawEffects)) return result;
	try {
		var txBlock = await __fetchTransactionBlockByDigest(digest);
		if (!txBlock) return result;
		return __mergeSignResult(result, txBlock);
	} catch (_e) {
		return result;
	}
}

function __toExactArrayBuffer(value) {
	if (!value) return null;
	if (value instanceof ArrayBuffer) return value;
	if (value instanceof Uint8Array) {
		if (value.byteOffset === 0 && value.byteLength === value.buffer.byteLength) return value.buffer;
		return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
	}
	if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) {
		var view = new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || 0);
		if (view.byteOffset === 0 && view.byteLength === view.buffer.byteLength) return view.buffer;
		return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
	}
	if (Array.isArray(value)) {
		var bytes = Uint8Array.from(value);
		return bytes.buffer;
	}
	return null;
}

function __extractMessageSigningResult(signResult, fallbackBytesB64) {
	var first = Array.isArray(signResult) ? signResult[0] : signResult;
	if (!first) {
		return {
			signature: '',
			bytes: String(fallbackBytesB64 || ''),
		};
	}
	if (typeof first === 'string') {
		return {
			signature: first,
			bytes: String(fallbackBytesB64 || ''),
		};
	}
	var resolvedSignature = '';
	var resolvedBytes = '';
	if (typeof first.signature === 'string') resolvedSignature = first.signature;
	if (first.signature && typeof first.signature === 'object' && typeof first.signature.signature === 'string') {
		resolvedSignature = first.signature.signature;
	}
	if (!resolvedSignature && first.signature && (first.signature instanceof Uint8Array || Array.isArray(first.signature))) {
		try {
			resolvedSignature = __bytesToBase64(first.signature);
		} catch (_e) {}
	}
	if (!resolvedSignature && typeof first.serializedSignature === 'string') {
		resolvedSignature = first.serializedSignature;
	}
	if (typeof first.bytes === 'string' && first.bytes) resolvedBytes = first.bytes;
	if (!resolvedBytes && typeof first.messageBytes === 'string' && first.messageBytes) resolvedBytes = first.messageBytes;
	if (!resolvedBytes && first.bytes && (first.bytes instanceof Uint8Array || Array.isArray(first.bytes))) {
		try {
			resolvedBytes = __bytesToBase64(first.bytes);
		} catch (_e2) {}
	}
	if (!resolvedBytes) resolvedBytes = String(fallbackBytesB64 || '');
	return {
		signature: resolvedSignature,
		bytes: resolvedBytes,
	};
}

async function __signPersonalMessageBridge(messageBytes, conn, signingAccount) {
	var wallet = conn && conn.wallet ? conn.wallet : null;
	if (!wallet) throw new Error('Wallet not connected in sign bridge');
	var raw = wallet._raw || null;
	var messageBuffer = __toExactArrayBuffer(messageBytes);
	var messageBase64 = __bytesToBase64(messageBytes);
	var calls = [];
	var walletName = String((wallet && wallet.name) || '').toLowerCase();
	var phantomProvider = __getPhantomProvider();
	var isPhantomWallet = !!(
		(walletName && walletName.indexOf('phantom') !== -1)
		|| (wallet && wallet.isPhantom)
		|| (raw && raw.isPhantom)
		|| (
			phantomProvider && (
				wallet === phantomProvider
				|| raw === phantomProvider
			)
		)
	);
	function addCall(label, fn) {
		calls.push({ label: label, fn: fn });
	}

	var signFeature = wallet.features && wallet.features['sui:signPersonalMessage'];
	if (signFeature && typeof signFeature.signPersonalMessage === 'function') {
		addCall('feature(account, bytes)', function() {
			return signFeature.signPersonalMessage({
				account: signingAccount || conn.account || null,
				message: messageBytes,
			});
		});
		addCall('feature(account, number[])', function() {
			return signFeature.signPersonalMessage({
				account: signingAccount || conn.account || null,
				message: Array.from(messageBytes),
			});
		});
		addCall('feature(account, base64)', function() {
			return signFeature.signPersonalMessage({
				account: signingAccount || conn.account || null,
				message: messageBase64,
			});
		});
		if (messageBuffer) {
			addCall('feature(account, arrayBuffer)', function() {
				return signFeature.signPersonalMessage({
					account: signingAccount || conn.account || null,
					message: messageBuffer,
				});
			});
			addCall('feature(arrayBuffer)', function() {
				return signFeature.signPersonalMessage({
					message: messageBuffer,
				});
			});
		}
		addCall('feature(bytes)', function() {
			return signFeature.signPersonalMessage({
				message: messageBytes,
			});
		});
		addCall('feature(number[])', function() {
			return signFeature.signPersonalMessage({
				message: Array.from(messageBytes),
			});
		});
		addCall('feature(base64)', function() {
			return signFeature.signPersonalMessage({
				message: messageBase64,
			});
		});
	}
	if (raw && typeof raw.signPersonalMessage === 'function') {
		if (messageBuffer) {
			addCall('raw.signPersonalMessage({arrayBuffer})', function() { return raw.signPersonalMessage({ message: messageBuffer }); });
			addCall('raw.signPersonalMessage(arrayBuffer)', function() { return raw.signPersonalMessage(messageBuffer); });
		}
		addCall('raw.signPersonalMessage({bytes})', function() { return raw.signPersonalMessage({ message: messageBytes }); });
		addCall('raw.signPersonalMessage(bytes)', function() { return raw.signPersonalMessage(messageBytes); });
		if (!isPhantomWallet) {
			addCall('raw.signPersonalMessage({number[]})', function() { return raw.signPersonalMessage({ message: Array.from(messageBytes) }); });
		}
		addCall('raw.signPersonalMessage({base64})', function() { return raw.signPersonalMessage({ message: messageBase64 }); });
	}
	if (raw && typeof raw.signMessage === 'function') {
		if (messageBuffer) {
			addCall('raw.signMessage({arrayBuffer})', function() { return raw.signMessage({ message: messageBuffer }); });
			addCall('raw.signMessage(arrayBuffer)', function() { return raw.signMessage(messageBuffer); });
		}
		addCall('raw.signMessage({bytes})', function() { return raw.signMessage({ message: messageBytes }); });
		addCall('raw.signMessage(bytes)', function() { return raw.signMessage(messageBytes); });
		if (!isPhantomWallet) {
			addCall('raw.signMessage({number[]})', function() { return raw.signMessage({ message: Array.from(messageBytes) }); });
		}
		addCall('raw.signMessage({base64})', function() { return raw.signMessage({ message: messageBase64 }); });
	}
	if (!calls.length) throw new Error('Wallet does not support personal message signing');
	var lastErr = null;
	for (var i = 0; i < calls.length; i++) {
		var attempt = calls[i];
		try {
			var result = await attempt.fn();
			console.log('[SignBridge] Message signing attempt succeeded:', attempt.label);
			return result;
		} catch (err) {
			lastErr = err;
			console.warn('[SignBridge] Message signing attempt failed:', attempt.label, (err && err.message) ? err.message : err);
		}
	}
	throw lastErr || new Error('Wallet personal message signing failed');
}

function __getRpcUrl() {
	var network = __skiNetwork || 'mainnet';
	return __RPC_URLS[network] || __RPC_URLS.mainnet;
}

function __getPhantomProvider() {
	var provider = window.phantom && window.phantom.sui;
	return provider && provider.isPhantom ? provider : null;
}

async function __tryCallList(calls) {
	var lastErr = null;
	for (var i = 0; i < calls.length; i++) {
		try {
			return await calls[i]();
		} catch (err) {
			lastErr = err;
		}
	}
	if (lastErr) throw lastErr;
	throw new Error('No callable method succeeded');
}

function __getNetworkCandidates() {
	var network = __skiNetwork || 'mainnet';
	if (network === 'mainnet') return ['sui:mainnet', 'mainnet'];
	if (network === 'testnet') return ['sui:testnet', 'testnet'];
	if (network === 'devnet') return ['sui:devnet', 'devnet'];
	return [network];
}

async function __phantomSignAndExecute(txInput, execOptions, senderAddress, txJson) {
	var phantom = __getPhantomProvider();
	if (!phantom) throw new Error('Phantom provider unavailable');
	var txB64 = __bytesToBase64(txInput);
	var normalizedSender = __normalizeAddress(senderAddress);
	var hasOptions = execOptions && Object.keys(execOptions).length > 0;
	var networks = __getNetworkCandidates();
	var calls = [];

	if (typeof txJson === 'string' && txJson) {
		for (let ni = 0; ni < networks.length; ni++) {
			const networkID = networks[ni];
			calls.push(async function() {
				if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
				return await phantom.signAndExecuteTransaction({
					transaction: txJson,
					address: normalizedSender,
					networkID: networkID,
				});
			});
		}
		calls.push(async function() {
			if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
			return await phantom.signAndExecuteTransaction({
				transaction: txJson,
				address: normalizedSender,
			});
		});
		calls.push(async function() {
			if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
			return await phantom.signAndExecuteTransaction({
				transaction: txJson,
			});
		});
	}

	for (let nb = 0; nb < networks.length; nb++) {
		const networkIDBytes = networks[nb];
		calls.push(async function() {
			if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
			return await phantom.signAndExecuteTransaction({
				transaction: txB64,
				address: normalizedSender,
				networkID: networkIDBytes,
			});
		});
	}
	calls.push(async function() {
		if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
		return await phantom.signAndExecuteTransaction({
			transaction: txB64,
			address: normalizedSender,
		});
	});
	calls.push(async function() {
		if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
		return await phantom.signAndExecuteTransaction({ transaction: txB64 });
	});
	calls.push(async function() {
		if (typeof phantom.signAndExecuteTransactionBlock !== 'function') throw new Error('Unavailable');
		return await phantom.signAndExecuteTransactionBlock({ transactionBlock: txB64 });
	});
	calls.push(async function() {
		if (typeof phantom.signAndExecuteTransactionBlock !== 'function') throw new Error('Unavailable');
		return await phantom.signAndExecuteTransactionBlock({ transaction: txB64 });
	});
	if (hasOptions) {
		calls.push(async function() {
			if (typeof phantom.signAndExecuteTransactionBlock !== 'function') throw new Error('Unavailable');
			return await phantom.signAndExecuteTransactionBlock({
				transactionBlock: txB64,
				options: execOptions,
			});
		});
		calls.push(async function() {
			if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
			return await phantom.signAndExecuteTransaction({
				transaction: txB64,
				options: execOptions,
			});
		});
	}

	return await __tryCallList(calls);
}

async function __phantomSignThenExecute(txInput, execOptions, senderAddress, txJson) {
	var phantom = __getPhantomProvider();
	if (!phantom) throw new Error('Phantom provider unavailable');
	var txB64 = __bytesToBase64(txInput);
	var normalizedSender = __normalizeAddress(senderAddress);
	var networks = __getNetworkCandidates();
	var calls = [];

	if (typeof txJson === 'string' && txJson) {
		for (let ni = 0; ni < networks.length; ni++) {
			const networkID = networks[ni];
			calls.push(async function() {
				if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
				return await phantom.signTransaction({
					transaction: txJson,
					address: normalizedSender,
					networkID: networkID,
				});
			});
		}
		calls.push(async function() {
			if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
			return await phantom.signTransaction({
				transaction: txJson,
				address: normalizedSender,
			});
		});
	}

	for (let nb = 0; nb < networks.length; nb++) {
		const networkIDBytes = networks[nb];
		calls.push(async function() {
			if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
			return await phantom.signTransaction({
				transaction: txB64,
				address: normalizedSender,
				networkID: networkIDBytes,
			});
		});
	}
	calls.push(async function() {
		if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
		return await phantom.signTransaction({
			transaction: txB64,
			address: normalizedSender,
		});
	});
	calls.push(async function() {
		if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
		return await phantom.signTransaction({ transaction: txB64 });
	});
	calls.push(async function() {
		if (typeof phantom.signTransactionBlock !== 'function') throw new Error('Unavailable');
		return await phantom.signTransactionBlock({ transactionBlock: txB64 });
	});
	calls.push(async function() {
		if (typeof phantom.signTransactionBlock !== 'function') throw new Error('Unavailable');
		return await phantom.signTransactionBlock({ transaction: txB64 });
	});

	var signed = await __tryCallList(calls);

	if (signed && signed.digest) return signed;

	return await __executeSignedTransaction(signed, txB64, execOptions);
}

async function __getSuiClient() {
	if (__suiClient) return __suiClient;
	if (!__SuiClientClass) {
		var mod = await import('https://esm.sh/@mysten/sui@2.6.0/jsonRpc?bundle');
		__SuiClientClass = mod.SuiJsonRpcClient;
	}
	var network = __skiNetwork || 'mainnet';
	__suiClient = new __SuiClientClass({ url: __getRpcUrl(), network: network });
	return __suiClient;
}

async function __buildTransactionBytes(tx, expectedSender) {
	if (expectedSender && typeof tx.setSenderIfNotSet === 'function') {
		tx.setSenderIfNotSet(expectedSender);
	}
	var client = await __getSuiClient();
	return await tx.build({ client: client });
}

async function __executeSignedTransaction(signed, tx, execOptions) {
	var signature = signed && (signed.signature || signed.signatures);
	var txBytes = signed && (
		signed.bytes ||
		signed.transactionBytes ||
		signed.transactionBlock ||
		signed.signedTransaction ||
		signed.transaction
	);

	if (!txBytes && (tx instanceof Uint8Array || tx instanceof ArrayBuffer || Array.isArray(tx))) {
		txBytes = tx;
	}

	if (!txBytes && typeof tx === 'string') {
		txBytes = tx;
	}

	if (!txBytes && tx && typeof tx.build === 'function') {
		try {
			txBytes = await __buildTransactionBytes(tx, '');
		} catch (_e) {}
	}

	if (!txBytes && tx && typeof tx.serialize === 'function') {
		txBytes = await tx.serialize();
	}

	if (!signature) throw new Error('Missing signature from wallet');
	if (!txBytes) throw new Error('Missing signed transaction bytes from wallet');

	var txB64 = __bytesToBase64(txBytes);
	var signatures = Array.isArray(signature) ? signature : [signature];
	var gql = 'mutation ExecTx($txBytes: String!, $signatures: [String!]!) { executeTransactionBlock(txBytes: $txBytes, signatures: $signatures) { effects { status { success error } objectChanges { nodes { idCreatedOrDeleted outputState { address } } } } digest } }';
	var gqlRes = await fetch(__skiGraphQLUrl, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query: gql, variables: { txBytes: txB64, signatures: signatures } }),
	});
	var gqlJson = await gqlRes.json().catch(function() { return null; });
	if (!gqlRes.ok || !gqlJson || gqlJson.errors) {
		throw new Error(
			(gqlJson && gqlJson.errors && gqlJson.errors[0] && gqlJson.errors[0].message)
			|| 'Failed to execute signed transaction',
		);
	}
	return gqlJson.data && gqlJson.data.executeTransactionBlock ? gqlJson.data.executeTransactionBlock : {};
}

var __TransactionClassFallback = null;

async function __getTransactionClass() {
	if (__TransactionClass) return __TransactionClass;
	var primaryUrls = [
		'https://cdn.jsdelivr.net/npm/@mysten/sui@2.6.0/transactions/+esm',
		'https://esm.sh/@mysten/sui@2.6.0/transactions?bundle',
	];
	var fallbackUrls = [
		'https://cdn.jsdelivr.net/npm/@mysten/sui@2.6.0/transactions/+esm',
		'https://esm.sh/@mysten/sui@2.6.0/transactions?bundle',
	];
	for (var i = 0; i < primaryUrls.length; i++) {
		try {
			var mod = await import(primaryUrls[i]);
			if (mod && mod.Transaction) {
				__TransactionClass = mod.Transaction;
				break;
			}
		} catch (_e) {}
	}
	for (var j = 0; j < fallbackUrls.length; j++) {
		try {
			var fbMod = await import(fallbackUrls[j]);
			if (fbMod && fbMod.Transaction) {
				if (!__TransactionClass) __TransactionClass = fbMod.Transaction;
				else __TransactionClassFallback = fbMod.Transaction;
				break;
			}
		} catch (_e2) {}
	}
	if (!__TransactionClass) throw new Error('Failed to load Sui Transaction class');
	return __TransactionClass;
}

function __tryParseTx(data) {
	if (!data) return null;
	var classes = [__TransactionClass, __TransactionClassFallback].filter(Boolean);
	for (var i = 0; i < classes.length; i++) {
		try {
			var result = classes[i].from(data);
			if (result) return result;
		} catch (_e) {}
	}
	return null;
}

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:sign') return;

	var txData = e.data.txBytes;
	var requestId = e.data.requestId;
	var execOptions = e.data.options || {};
	var expectedSender = e.data.sender || '';
	var preferredWalletName = e.data.walletName || '';
	var walletHints = Array.isArray(e.data.walletHints) ? e.data.walletHints : [];
	if (!txData || !requestId) return;

	(async function() {
		try {
			var Tx = await __getTransactionClass();
			var parsed = txData;
			var rawSerializedTx = (typeof txData === 'string') ? txData.trim() : '';
			if (typeof txData === 'string') {
				try { parsed = JSON.parse(txData); } catch (_e) {}
			}
			var extractedPayload = __extractBridgeTxPayload(parsed, 0);
			if (!extractedPayload && typeof txData === 'string') extractedPayload = txData;
			var txBytesFromInput = null;
			if (typeof extractedPayload === 'string') {
				txBytesFromInput = __base64ToBytes(extractedPayload);
			} else {
				txBytesFromInput = __toExactArrayBuffer(extractedPayload);
				txBytesFromInput = txBytesFromInput ? new Uint8Array(txBytesFromInput) : null;
			}
			var tx = null;
			if (txBytesFromInput && txBytesFromInput.length) {
				tx = __tryParseTx(txBytesFromInput);
			}
			if (!tx && rawSerializedTx) {
				tx = __tryParseTx(rawSerializedTx);
			}
			if (!tx) {
				tx = __tryParseTx(parsed && typeof parsed === 'object' ? parsed : extractedPayload);
			}
			if (!tx && !txBytesFromInput) {
				throw new Error('Invalid transaction payload for sign bridge');
			}
			var transactionSender = '';
			try {
				var txDataObject = tx && typeof tx.getData === 'function' ? tx.getData() : null;
				transactionSender = __normalizeAddress(txDataObject && txDataObject.sender);
			} catch (_e) {}
			var resolvedSender = __normalizeAddress(expectedSender) || transactionSender;
			if (tx && resolvedSender && typeof tx.setSenderIfNotSet === 'function') {
				tx.setSenderIfNotSet(resolvedSender);
			}

			var conn = await __ensureWalletConnection(preferredWalletName, resolvedSender, true, walletHints, false);
			if (!conn || !conn.wallet) {
				throw new Error(__lastPreferredConnectError || 'Wallet not connected in sign bridge');
			}
			if (
				preferredWalletName
				&& !__walletNamesMatch(conn.wallet && conn.wallet.name, preferredWalletName)
			) {
				console.warn('[SignBridge] Wallet name mismatch: expected', preferredWalletName, 'got', conn.wallet && conn.wallet.name);
			}
			var signingAccount = __resolveSigningAccount(conn, resolvedSender);
			if (!signingAccount && __walletNeedsLiveAccount(conn.wallet)) {
				conn = await __ensureWalletConnection(
					preferredWalletName || (conn.wallet && conn.wallet.name) || '',
					resolvedSender,
					true,
					walletHints,
					true,
				);
				if (!conn || !conn.wallet) {
					throw new Error(__lastPreferredConnectError || 'Wallet not connected in sign bridge');
				}
				signingAccount = __resolveSigningAccount(conn, resolvedSender);
			}
			if (resolvedSender && !signingAccount) {
				throw new Error('Connected wallet account does not match transaction sender');
			}

			var txForWallet = tx;
			var txBytesForFallback = null;
			if (txForWallet) {
				try {
					txBytesForFallback = await __buildTransactionBytes(txForWallet, resolvedSender);
				} catch (preBuildErr) {
					console.warn('[SignBridge] Pre-build to bytes failed, continuing with raw tx:', preBuildErr && preBuildErr.message);
				}
			}
			var signingInputs = [];
			if (txBytesFromInput) signingInputs.push(txBytesFromInput);
			if (txForWallet) signingInputs.push(txForWallet);
			if (txBytesForFallback) signingInputs.push(txBytesForFallback);
			var requestedChain = (
				signingAccount
				&& Array.isArray(signingAccount.chains)
				&& typeof signingAccount.chains[0] === 'string'
			) ? signingAccount.chains[0] : ('sui:' + (__skiNetwork || 'mainnet'));
			var isWaaP = __walletNamesMatch(conn.wallet && conn.wallet.name, 'waap');

			console.log('[SignBridge] Signing transaction...');
			var result;
				try {
					var signExecOptions = {
						txOptions: execOptions,
						chain: requestedChain,
						singleAttempt: false,
						preferTransactionBlock: isWaaP,
					};
					if (signingAccount) signExecOptions.account = signingAccount;
					var signExecError = null;
					for (var si = 0; si < signingInputs.length; si++) {
						try {
							result = await _skiSignAndExecute(signingInputs[si], requestedChain, signingAccount || undefined);
							signExecError = null;
							break;
						} catch (attemptErr) {
							signExecError = attemptErr;
							if (__wkIsUserRejection(attemptErr)) throw attemptErr;
							if (!__isSigningCompatibilityError(attemptErr)) break;
						}
					}
						if (!result) {
							throw signExecError || new Error('Wallet failed to sign and execute transaction');
						}
					} catch (signErr) {
						if (isWaaP) throw signErr;
						if (!__shouldFallbackToSignOnly(signErr)) throw signErr;
						console.warn('[SignBridge] signAndExecute failed, trying sign+execute fallback:', signErr);
						var signOptions = {
							chain: requestedChain,
							singleAttempt: false,
							preferTransactionBlock: true,
						};
				if (signingAccount) signOptions.account = signingAccount;
				var signOnlyError = null;
				for (var sj = 0; sj < signingInputs.length; sj++) {
					try {
						var signed = await _skiSignTransaction(signingInputs[sj], requestedChain, signingAccount || undefined);
						result = await __executeSignedTransaction(signed, signingInputs[sj], execOptions);
						signOnlyError = null;
						break;
					} catch (signOnlyErr) {
						signOnlyError = signOnlyErr;
						if (__wkIsUserRejection(signOnlyErr)) throw signOnlyErr;
						if (!__isSigningCompatibilityError(signOnlyErr)) break;
					}
				}
				if (!result) {
					throw signOnlyError || new Error('Wallet failed to sign transaction');
				}
			}

			result = await __hydrateSignResult(result);
			console.log('[SignBridge] result:', result);

			var response = { type: 'ski:signed', requestId: requestId };
			if (result.digest) response.digest = result.digest;
			if (result.bytes) response.bytes = result.bytes;
			if (result.signature) response.signature = result.signature;
			if (result.effects) response.effects = result.effects;
			if (result.objectChanges) response.objectChanges = result.objectChanges;
			if (result.rawEffects) {
				response.rawEffects = (result.rawEffects instanceof Uint8Array)
					? __bytesToBase64(result.rawEffects) : result.rawEffects;
			}

			e.source.postMessage(response, e.origin);
		} catch (err) {
			var message = (err && err.message) ? err.message : 'Signing failed';
			e.source.postMessage({
				type: 'ski:error',
				error: message,
				requestId: requestId,
			}, e.origin);
		}
	})();
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:sign-message') return;

	var messageB64 = typeof e.data.message === 'string' ? e.data.message : '';
	var requestId = e.data.requestId;
	var expectedSender = e.data.sender || '';
	var preferredWalletName = e.data.walletName || '';
	var walletHints = Array.isArray(e.data.walletHints) ? e.data.walletHints : [];
	if (!messageB64 || !requestId) return;

	(async function() {
		try {
			var messageBytes = __base64ToBytes(messageB64);
			if (!messageBytes || !messageBytes.length) throw new Error('Invalid message payload');
			console.log('[SignBridge] sign-message: bytes=' + messageBytes.length + ', sender=' + expectedSender + ', wallet=' + preferredWalletName);
			var resolvedSender = __normalizeAddress(expectedSender);
			var conn = await __ensureWalletConnection(preferredWalletName, resolvedSender, true, walletHints, false);
			if (!conn || !conn.wallet) {
				throw new Error(__lastPreferredConnectError || 'Wallet not connected in sign bridge');
			}
			console.log('[SignBridge] sign-message conn: wallet=' + (conn.wallet && conn.wallet.name) + ', status=' + conn.status + ', accounts=' + (conn.wallet && conn.wallet.accounts ? conn.wallet.accounts.length : 'N/A'));
			if (
				preferredWalletName
				&& !__walletNamesMatch(conn.wallet && conn.wallet.name, preferredWalletName)
			) {
				console.warn('[SignBridge] Wallet name mismatch for message signing: expected', preferredWalletName, 'got', conn.wallet && conn.wallet.name);
			}
			var signingAccount = __resolveSigningAccount(conn, resolvedSender);
			if (!signingAccount && __walletNeedsLiveAccount(conn.wallet)) {
				conn = await __ensureWalletConnection(
					preferredWalletName || (conn.wallet && conn.wallet.name) || '',
					resolvedSender,
					true,
					walletHints,
					true,
				);
				if (!conn || !conn.wallet) {
					throw new Error(__lastPreferredConnectError || 'Wallet not connected in sign bridge');
				}
				signingAccount = __resolveSigningAccount(conn, resolvedSender);
			}
			console.log('[SignBridge] sign-message account:', signingAccount ? ('addr=' + (signingAccount.address || 'none') + ' chains=' + JSON.stringify(signingAccount.chains || []) + ' hasPubKey=' + !!(signingAccount.publicKey)) : 'null');
			if (resolvedSender && !signingAccount) {
				throw new Error('Connected wallet account does not match message signer');
			}

			var signed = await __signPersonalMessageBridge(messageBytes, conn, signingAccount);
			var signedMessage = __extractMessageSigningResult(signed, messageB64);
			if (!signedMessage.signature) throw new Error('Wallet returned no personal message signature');
			console.log('[SignBridge] Message signing completed');

			e.source.postMessage({
				type: 'ski:signed-message',
				requestId: requestId,
				signature: signedMessage.signature,
				bytes: signedMessage.bytes || messageB64,
			}, e.origin);
		} catch (err) {
			var message = (err && err.message) ? err.message : 'Message signing failed';
			e.source.postMessage({
				type: 'ski:error',
				error: message,
				requestId: requestId,
			}, e.origin);
		}
	})();
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:connect-waap') return;

	var requestId = e.data.requestId;
	if (!requestId) return;

	(async function() {
		try {
			await Promise.resolve([]);
			if (window.__wkWaaPLoading) await window.__wkWaaPLoading;
			var wallets = [];
			var waapWallet = null;
			for (var i = 0; i < wallets.length; i++) {
				if (wallets[i].name && wallets[i].name.toLowerCase() === 'waap') {
					waapWallet = wallets[i];
					break;
				}
			}
			if (!waapWallet) {
				var allStored = [] || [];
				for (var j = 0; j < allStored.length; j++) {
					if (allStored[j].name && allStored[j].name.toLowerCase() === 'waap') {
						waapWallet = allStored[j];
						break;
					}
				}
			}
			if (!waapWallet) throw new Error('WaaP wallet not available');
			await _skiConnect(waapWallet.name);
			var conn = _skiAddr;
			if (!conn || !conn.address) throw new Error('WaaP connection failed');
			__saveWalletToHistory('WaaP', conn.address);
			e.source.postMessage({
				type: 'ski:connected',
				requestId: requestId,
				address: conn.address,
				walletName: 'WaaP'
			}, e.origin);
		} catch (err) {
			e.source.postMessage({
				type: 'ski:connect-error',
				requestId: requestId,
				error: (err && err.message) || 'WaaP connection failed'
			}, e.origin);
		}
	})();
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:connect') return;

	var requestId = e.data.requestId;
	if (!requestId) return;
	var preferredWallet = e.data.walletName || '';
	var expectedSender = __normalizeAddress(e.data.sender || '');
	var walletHints = Array.isArray(e.data.walletHints) ? e.data.walletHints : [];
	var forceInteractive = !!e.data.forceInteractive;

	(async function() {
		try {
			__mergeBridgeWalletHints(walletHints);
			var existing = _skiAddr;
			if (!forceInteractive && existing && existing.wallet && existing.address) {
				if (
					(!preferredWallet || __walletNamesMatch(existing.wallet.name, preferredWallet))
					&& (!expectedSender || __normalizeAddress(existing.address) === expectedSender)
				) {
					__saveWalletToHistory(existing.wallet.name || '', existing.address);
					e.source.postMessage({
						type: 'ski:connected',
						requestId: requestId,
						address: existing.address,
						walletName: existing.wallet.name || ''
					}, e.origin);
					return;
				}
			}
				var conn = await __ensureWalletConnection(preferredWallet, expectedSender, true, walletHints, forceInteractive);
				if (conn && conn.wallet && conn.address) {
				__saveWalletToHistory(conn.wallet.name || '', conn.address);
				e.source.postMessage({
					type: 'ski:connected',
					requestId: requestId,
					address: conn.address,
					walletName: conn.wallet.name || ''
				}, e.origin);
					return;
				}
				if (preferredWallet) {
					throw new Error(__lastPreferredConnectError || ('Failed to connect selected wallet: ' + preferredWallet));
				}
				var wallets = await __collectBridgeWalletCandidates();
			if (!wallets || wallets.length === 0) {
				throw new Error('No Sui wallets detected');
			}
			var target = null;
			if (preferredWallet) {
				for (var i = 0; i < wallets.length; i++) {
					if (__walletNamesMatch(wallets[i].name, preferredWallet)) {
						target = wallets[i];
						break;
					}
				}
				if (!target) throw new Error('Selected wallet not available: ' + preferredWallet);
			}
			if (!target && !preferredWallet) {
				var history = __readWalletHistory();
				for (var h = 0; h < history.length && !target; h++) {
					for (var w = 0; w < wallets.length; w++) {
						if (__walletNamesMatch(wallets[w].name, history[h].walletName)) {
							target = wallets[w];
							break;
						}
					}
				}
			}
			if (!target && !preferredWallet) {
				for (var k = 0; k < wallets.length; k++) {
					if (!wallets[k].__isPasskey) { target = wallets[k]; break; }
				}
			}
			if (!target && !preferredWallet) target = wallets[0];
			if (!target) throw new Error('Failed to connect selected wallet: ' + preferredWallet);
			await _skiConnect(target.name);
			conn = _skiAddr;
			if (!conn || !conn.address) throw new Error('Wallet connection failed');
			var connectedName = (conn.wallet && conn.wallet.name) || target.name || '';
			if (preferredWallet && !__walletNamesMatch(connectedName, preferredWallet)) {
				throw new Error('Connected wallet does not match selected wallet: ' + preferredWallet);
			}
			__saveWalletToHistory(connectedName, conn.address);
			e.source.postMessage({
				type: 'ski:connected',
				requestId: requestId,
				address: conn.address,
				walletName: connectedName
			}, e.origin);
		} catch (err) {
			e.source.postMessage({
				type: 'ski:connect-error',
				requestId: requestId,
				error: (err && err.message) || 'Connection failed'
			}, e.origin);
		}
	})();
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:wallet-hints') return;
	__mergeBridgeWalletHints(e.data.wallets);
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:wallets') return;

	var requestId = e.data.requestId;
	var walletHints = Array.isArray(e.data.walletHints) ? e.data.walletHints : [];
	if (!requestId) return;

	(async function() {
		try {
			e.source.postMessage({
				type: 'ski:wallets-result',
				requestId: requestId,
				wallets: await __collectBridgeWalletList(walletHints),
			}, e.origin);
		} catch (err) {
			e.source.postMessage({
				type: 'ski:wallets-error',
				requestId: requestId,
				error: (err && err.message) || 'Wallet discovery failed',
			}, e.origin);
		}
	})();
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:wallet-history') return;
	var requestId = e.data.requestId;
	if (!requestId) return;
	e.source.postMessage({
		type: 'ski:wallet-history-result',
		requestId: requestId,
		history: __readWalletHistory()
	}, e.origin);
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:disconnect') return;
	_skiDisconnect();
	var cookieNames = ['session_id', 'wallet_address', 'wallet_name'];
	var domains = ['', '; domain=.sui.ski'];
	for (var d = 0; d < domains.length; d++) {
		for (var n = 0; n < cookieNames.length; n++) {
			document.cookie = cookieNames[n] + '=' + domains[d] + '; path=/; max-age=0; secure; samesite=lax';
		}
	}
	try { localStorage.removeItem('sui_session_id'); } catch (_e) {}
	try { localStorage.removeItem('sui_wallet_name'); } catch (_e) {}
	try { localStorage.removeItem('sui_ski_last_wallet'); } catch (_e) {}
	try { localStorage.removeItem(__WALLET_HISTORY_KEY); } catch (_e) {}
});

${skiEventBridge({ onConnect: '__onBridgeModalConnect' })}

var __modalRequestId = '';
var __modalSource = null;
var __modalOrigin = '';

window.__onBridgeModalConnect = function() {
	var conn = _skiConn;
	if (!conn || !conn.address) return;
	if (__isTopFrameHandoff()) {
		__finishTopFrameHandoffIfConnected();
		return;
	}
	var walletName = (conn && conn.walletName) || '';
	__saveWalletToHistory(walletName, conn.address);
	if (!__modalRequestId) return;
	if (__modalSource) {
		__modalSource.postMessage({
			type: 'ski:connected',
			requestId: __modalRequestId,
			address: conn.address,
			walletName: walletName
		}, __modalOrigin);
	}
	__modalRequestId = '';
	__modalSource = null;
	__modalOrigin = '';
};

window.addEventListener('load', function() { window.dispatchEvent(new CustomEvent('ski:request-signin')); });

// Modal close handling: check _skiAddr for cancellation

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:ping') return;
	e.source.postMessage({ type: 'ski:ready' }, e.origin);
});

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:open-modal') return;
	__modalRequestId = e.data.requestId || '';
	__modalSource = e.source;
	__modalOrigin = e.origin;
	window.dispatchEvent(new CustomEvent('ski:request-signin'));
});

async function __loadWalletStandard() {
	var urls = [
		'https://esm.sh/@wallet-standard/app@1.1.0',
	];
	for (var i = 0; i < urls.length; i++) {
		try {
			var mod = await import(urls[i]);
			if (mod && typeof mod.getWallets === 'function') {
				window.getWallets = mod.getWallets;
				return true;
			}
		} catch (_e) {}
	}
	return false;
}

async function __registerSlushWallet() {
	try {
		var mod = await import('https://esm.sh/@mysten/slush-wallet@1.0.2');
		if (mod && typeof mod.registerSlushWallet === 'function') {
			mod.registerSlushWallet('.SKI');
		}
	} catch (_e) {}
}

Promise.all([__loadWalletStandard(), __registerSlushWallet()]).then(function() {
	return Promise.resolve(_skiWallets.slice());
}).catch(function() {
	return null;
}).then(function() {
	return __getTransactionClass();
}).catch(function() {
	return null;
}).then(function() {
	return null;
}).catch(function() {
	return null;
}).then(function() {
	__notifyReady();
	return __beginTopFrameHandoffFlow();
}).catch(function() {
	return null;
});
</script>
${skiScriptTag()}
</body></html>`
}
