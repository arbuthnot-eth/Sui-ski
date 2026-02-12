import type { Env } from '../types'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'

export function generateSkiSignPage(env: Env): string {
	return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<title>SKI Sign Bridge</title>
</head><body>
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
			var txForWallet = tx;
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
					singleAttempt: true,
					preferTransactionBlock: true,
				};
				if (signingAccount) signExecOptions.account = signingAccount;
				result = await SuiWalletKit.signAndExecute(txForWallet, signExecOptions);
			} catch (signErr) {
				console.warn('[SignBridge] signAndExecute failed, trying sign+execute fallback:', signErr);
				if (signExecOptions.singleAttempt) throw signErr;
				var signOptions = {
					chain: requestedChain,
					singleAttempt: true,
					preferTransactionBlock: true,
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
	var session = __readSessionWallet();
	var sessionAddr = session && session.address ? session.address : '';
	return __ensureWalletConnection('', sessionAddr);
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
