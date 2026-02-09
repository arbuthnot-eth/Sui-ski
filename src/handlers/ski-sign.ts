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
	var CHUNK = 8192;
	var parts = [];
	for (var i = 0; i < bytes.length; i += CHUNK) {
		parts.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length))));
	}
	return btoa(parts.join(''));
}

async function __getTransactionClass() {
	if (__TransactionClass) return __TransactionClass;
	var mod = await import('https://esm.sh/@mysten/sui@2/transactions');
	__TransactionClass = mod.Transaction;
	return __TransactionClass;
}

async function __getSuiClient() {
	if (__suiClient) return __suiClient;
	var mod = await import('https://esm.sh/@mysten/sui@2/client');
	var ClientClass = mod.SuiClient || mod.SuiJsonRpcClient;
	var network = SuiWalletKit.__config.network || 'mainnet';
	__suiClient = new ClientClass({ url: __RPC_URLS[network] || __RPC_URLS.mainnet });
	return __suiClient;
}

window.addEventListener('message', function(e) {
	if (!__isAllowedOrigin(e.origin)) return;
	if (!e.data || e.data.type !== 'ski:sign') return;

	var txData = e.data.txBytes;
	var requestId = e.data.requestId;
	var execOptions = e.data.options || {};
	if (!txData || !requestId) return;

	(async function() {
		try {
			var conn = SuiWalletKit.$connection.value;
			if (!conn || !conn.wallet) throw new Error('Wallet not connected in sign bridge');

			var Tx = await __getTransactionClass();
			var parsed = txData;
			try { parsed = JSON.parse(txData); } catch (_e) {}
			var tx = Tx.from(parsed);

			var result;
			try {
				var client = await __getSuiClient();
				console.log('[SignBridge] Building transaction...');
				var builtBytes = await tx.build({ client: client });
				console.log('[SignBridge] Signing transaction...');
				result = await SuiWalletKit.signAndExecute(builtBytes, { txOptions: execOptions });
			} catch (buildErr) {
				console.error('[SignBridge] Build/Sign error:', buildErr);
				// Fallback: try signing the raw object if building failed
				result = await SuiWalletKit.signAndExecute(tx, { txOptions: execOptions });
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

SuiWalletKit.detectWallets().then(function(wallets) {
	if (!wallets || wallets.length === 0) return;

	var session = null;
	try {
		var addrMatch = document.cookie.split('; ').find(function(c) { return c.startsWith('wallet_address='); });
		var nameMatch = document.cookie.split('; ').find(function(c) { return c.startsWith('wallet_name='); });
		var address = addrMatch ? addrMatch.split('=')[1] : '';
		var walletName = nameMatch ? decodeURIComponent(nameMatch.split('=')[1]) : '';
		if (address && walletName) session = { address: address, walletName: walletName };
	} catch (_e) {}

	if (!session || !session.walletName) return;

	var match = null;
	for (var i = 0; i < wallets.length; i++) {
		if (wallets[i].name === session.walletName) { match = wallets[i]; break; }
	}
	if (!match) return;

	SuiWalletKit.connect(match).then(function() {
		__getTransactionClass().then(function() {
			__notifyReady();
		}).catch(function() {
			__notifyReady();
		});
	}).catch(function() {});
});
</script>
</body></html>`
}
