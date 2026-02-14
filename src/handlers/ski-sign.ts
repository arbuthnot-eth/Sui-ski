import type { Env } from '../types'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'

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
${generateWalletUiCss()}
</style>
</head><body>
<div id="wk-modal"></div>
<script>
${generateWalletKitJs({ network: env.SUI_NETWORK, autoConnect: false })}
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

function __normalizeAddress(address) {
	if (typeof address !== 'string') return '';
	var trimmed = address.trim();
	if (!trimmed) return '';
	if (/^[0-9a-fA-F]{2,}$/.test(trimmed) && trimmed.indexOf('0x') !== 0) {
		return ('0x' + trimmed).toLowerCase();
	}
	return trimmed.toLowerCase();
}

function __resolveSigningAccount(conn, expectedSender) {
	if (!conn || !conn.wallet) return null;
	var target = __normalizeAddress(expectedSender);
	if (!target) return conn.account || null;
	var walletAccounts = [];
	try {
		walletAccounts = Array.isArray(conn.wallet.accounts) ? conn.wallet.accounts : [];
	} catch (_e) {}
	for (var i = 0; i < walletAccounts.length; i++) {
		var candidate = __normalizeAddress(walletAccounts[i] && walletAccounts[i].address);
		if (candidate && candidate === target) return walletAccounts[i];
	}
	if (conn.account && __normalizeAddress(conn.account.address) === target) {
		return conn.account;
	}
	return null;
}

function __normalizeWalletName(name) {
	return String(name || '').trim().toLowerCase();
}

function __walletNamesMatch(left, right) {
	var leftName = __normalizeWalletName(left);
	var rightName = __normalizeWalletName(right);
	if (!leftName || !rightName) return false;
	if (leftName === rightName) return true;
	return leftName.indexOf(rightName) !== -1 || rightName.indexOf(leftName) !== -1;
}

function __readSessionWallet() {
	try {
		var addrMatch = document.cookie.split('; ').find(function(c) { return c.startsWith('wallet_address='); });
		var nameMatch = document.cookie.split('; ').find(function(c) { return c.startsWith('wallet_name='); });
		var address = addrMatch ? addrMatch.split('=')[1] : '';
		var walletName = nameMatch ? decodeURIComponent(nameMatch.split('=')[1]) : '';
		if (!walletName) return null;
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
	var accounts = [];
	try { accounts = Array.isArray(wallet.accounts) ? wallet.accounts : []; } catch (_e) {}
	for (var i = 0; i < accounts.length; i++) {
		if (__normalizeAddress(accounts[i] && accounts[i].address) === targetAddress) return true;
	}
	return false;
}

async function __ensureWalletConnection(preferredWalletName, expectedSender) {
	var normalizedSender = __normalizeAddress(expectedSender);
	var conn = SuiWalletKit.$connection.value || null;
	if (conn && conn.wallet) {
		if (!preferredWalletName || __walletNamesMatch(conn.wallet.name, preferredWalletName)) {
			return conn;
		}
		if (normalizedSender && __walletHasAddress(conn.wallet, normalizedSender)) {
			return conn;
		}
	}

	var wallets = [];
	try {
		wallets = await SuiWalletKit.detectWallets();
	} catch (_e) {
		wallets = SuiWalletKit.$wallets.value || [];
	}
	if (!Array.isArray(wallets) || wallets.length === 0) return conn;

	console.log('[SignBridge] Detected wallets:', wallets.map(function(w) { return w && w.name; }));

	var session = __readSessionWallet();
	var targetWalletName = preferredWalletName || (session && session.walletName ? session.walletName : '');
	var match = null;

	if (targetWalletName) {
		for (var i = 0; i < wallets.length; i++) {
			if (__walletNamesMatch(wallets[i] && wallets[i].name, targetWalletName)) {
				match = wallets[i];
				break;
			}
		}
	}

	if (!match && normalizedSender) {
		for (var a = 0; a < wallets.length; a++) {
			if (wallets[a] && !wallets[a].__isPasskey && __walletHasAddress(wallets[a], normalizedSender)) {
				match = wallets[a];
				console.log('[SignBridge] Matched wallet by address:', match.name);
				break;
			}
		}
	}

	if (!match) {
		for (var p = 0; p < wallets.length; p++) {
			if (!wallets[p] || wallets[p].__isPasskey) continue;
			match = wallets[p];
			break;
		}
	}

	if (!match) match = wallets[0] || null;
	if (!match) return conn;

	console.log('[SignBridge] Connecting to wallet:', match.name);
	try {
		await SuiWalletKit.connect(match);
	} catch (_e) {
		return SuiWalletKit.$connection.value || conn;
	}

	conn = SuiWalletKit.$connection.value || conn;

	if (normalizedSender && conn && conn.wallet && !__walletHasAddress(conn.wallet, normalizedSender)) {
		console.warn('[SignBridge] Connected wallet does not have expected address, trying others...');
		for (var r = 0; r < wallets.length; r++) {
			if (wallets[r] === match || !wallets[r] || wallets[r].__isPasskey) continue;
			try {
				await SuiWalletKit.connect(wallets[r]);
				var retryConn = SuiWalletKit.$connection.value;
				if (retryConn && retryConn.wallet && __walletHasAddress(retryConn.wallet, normalizedSender)) {
					console.log('[SignBridge] Found wallet with matching address:', wallets[r].name);
					return retryConn;
				}
			} catch (_e) {}
		}
	}

	return SuiWalletKit.$connection.value || conn;
}

function __notifyReady() {
	if (__signReady || !window.parent || window.parent === window) return;
	__signReady = true;
	window.parent.postMessage({ type: 'ski:ready' }, '*');
}

function __isAllowedOrigin(origin) {
	if (origin === 'https://sui.ski') return true;
	var suffix = '.sui.ski';
	return origin.indexOf('https://') === 0 && origin.length > 8 + suffix.length && origin.slice(-(suffix.length)) === suffix;
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

function __getRpcUrl() {
	var network = SuiWalletKit.__config.network || 'mainnet';
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
	var network = SuiWalletKit.__config.network || 'mainnet';
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
		var mod = await import('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle');
		__SuiClientClass = mod.SuiJsonRpcClient;
	}
	var network = SuiWalletKit.__config.network || 'mainnet';
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
	var rpcRes = await fetch(__getRpcUrl(), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'sui_executeTransactionBlock',
			params: [txB64, signatures, execOptions || {}],
		}),
	});
	var rpcJson = await rpcRes.json().catch(function() { return null; });
	if (!rpcRes.ok || !rpcJson || rpcJson.error || !rpcJson.result) {
		throw new Error(
			(rpcJson && rpcJson.error && rpcJson.error.message)
			|| 'Failed to execute signed transaction',
		);
	}
	return rpcJson.result;
}

async function __getTransactionClass() {
	if (__TransactionClass) return __TransactionClass;
	var mod = await import('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle');
	__TransactionClass = mod.Transaction;
	return __TransactionClass;
}

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:sign') return;

	var txData = e.data.txBytes;
	var requestId = e.data.requestId;
	var execOptions = e.data.options || {};
	var expectedSender = e.data.sender || '';
	var preferredWalletName = e.data.walletName || '';
	if (!txData || !requestId) return;

	(async function() {
		try {
			var conn = await __ensureWalletConnection(preferredWalletName, expectedSender);
			if (!conn || !conn.wallet) throw new Error('Wallet not connected in sign bridge');
			if (
				preferredWalletName
				&& !__walletNamesMatch(conn.wallet && conn.wallet.name, preferredWalletName)
			) {
				console.warn('[SignBridge] Wallet name mismatch: expected', preferredWalletName, 'got', conn.wallet && conn.wallet.name);
			}
			var signingAccount = __resolveSigningAccount(conn, expectedSender);
			if (expectedSender && !signingAccount) {
				throw new Error('Connected wallet account does not match transaction sender');
			}

			var Tx = await __getTransactionClass();
			var parsed = txData;
			try { parsed = JSON.parse(txData); } catch (_e) {}
			var tx = Tx.from(parsed);
			if (expectedSender && typeof tx.setSenderIfNotSet === 'function') {
				tx.setSenderIfNotSet(expectedSender);
			}
			var txForWallet;
			try {
				txForWallet = await __buildTransactionBytes(tx, expectedSender);
			} catch (preBuildErr) {
				console.warn('[SignBridge] Pre-build to bytes failed, passing raw tx:', preBuildErr && preBuildErr.message);
				txForWallet = tx;
			}
			var requestedChain = (
				signingAccount
				&& Array.isArray(signingAccount.chains)
				&& typeof signingAccount.chains[0] === 'string'
			) ? signingAccount.chains[0] : ('sui:' + (SuiWalletKit.__config.network || 'mainnet'));

			console.log('[SignBridge] Signing transaction...');
			var result;
				try {
					var signExecOptions = {
						txOptions: execOptions,
						chain: requestedChain,
						singleAttempt: false,
						preferTransactionBlock: false,
					};
					if (signingAccount) signExecOptions.account = signingAccount;
					result = await SuiWalletKit.signAndExecute(txForWallet, signExecOptions);
				} catch (signErr) {
					console.warn('[SignBridge] signAndExecute failed, trying sign+execute fallback:', signErr);
					var signOptions = {
						chain: requestedChain,
						singleAttempt: false,
						preferTransactionBlock: false,
					};
				if (signingAccount) signOptions.account = signingAccount;
				var signed = await SuiWalletKit.signTransaction(txForWallet, signOptions);
				result = await __executeSignedTransaction(signed, txForWallet, execOptions);
			}

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
	if (!e.data || e.data.type !== 'ski:connect-waap') return;

	var requestId = e.data.requestId;
	if (!requestId) return;

	(async function() {
		try {
			await SuiWalletKit.detectWallets();
			var wallets = SuiWalletKit.getSuiWallets();
			var waapWallet = null;
			for (var i = 0; i < wallets.length; i++) {
				if (wallets[i].name && wallets[i].name.toLowerCase() === 'waap') {
					waapWallet = wallets[i];
					break;
				}
			}
			if (!waapWallet) {
				var allStored = SuiWalletKit.$wallets.value || [];
				for (var j = 0; j < allStored.length; j++) {
					if (allStored[j].name && allStored[j].name.toLowerCase() === 'waap') {
						waapWallet = allStored[j];
						break;
					}
				}
			}
			if (!waapWallet) throw new Error('WaaP wallet not available');
			await SuiWalletKit.connect(waapWallet);
			var conn = SuiWalletKit.$connection.value;
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

	(async function() {
		try {
			var existing = SuiWalletKit.$connection.value;
			if (existing && existing.wallet && existing.address) {
				if (!preferredWallet || __walletNamesMatch(existing.wallet.name, preferredWallet)) {
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
			var conn = await __ensureWalletConnection(preferredWallet, '');
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
			await SuiWalletKit.detectWallets();
			var wallets = SuiWalletKit.getSuiWallets();
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
			}
			if (!target) {
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
			if (!target) {
				for (var k = 0; k < wallets.length; k++) {
					if (!wallets[k].__isPasskey) { target = wallets[k]; break; }
				}
			}
			if (!target) target = wallets[0];
			await SuiWalletKit.connect(target);
			conn = SuiWalletKit.$connection.value;
			if (!conn || !conn.address) throw new Error('Wallet connection failed');
			var connectedName = (conn.wallet && conn.wallet.name) || target.name || '';
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
	SuiWalletKit.disconnect();
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
});

${generateWalletUiJs({ onConnect: '__onBridgeModalConnect', onDisconnect: '' })}

var __modalRequestId = '';
var __modalSource = null;
var __modalOrigin = '';

window.__onBridgeModalConnect = function() {
	var conn = SuiWalletKit.$connection.value;
	if (!conn || !conn.address || !__modalRequestId) return;
	var walletName = (conn.wallet && conn.wallet.name) || '';
	__saveWalletToHistory(walletName, conn.address);
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

SuiWalletKit.renderModal('wk-modal');

var __origCloseModal = SuiWalletKit.closeModal;
SuiWalletKit.closeModal = function() {
	__origCloseModal();
	if (__modalRequestId && __modalSource) {
		var conn = SuiWalletKit.$connection.value;
		if (!conn || conn.status === 'disconnected' || !conn.address) {
			__modalSource.postMessage({
				type: 'ski:modal-closed',
				requestId: __modalRequestId
			}, __modalOrigin);
			__modalRequestId = '';
			__modalSource = null;
			__modalOrigin = '';
		}
	}
};

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:open-modal') return;
	__modalRequestId = e.data.requestId || '';
	__modalSource = e.source;
	__modalOrigin = e.origin;
	SuiWalletKit.openModal();
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

__loadWalletStandard().then(function() {
	return SuiWalletKit.detectWallets();
}).catch(function() {
	return null;
}).then(function() {
	return __getTransactionClass();
}).catch(function() {
	return null;
}).then(function() {
	__notifyReady();
});
</script>
</body></html>`
}
