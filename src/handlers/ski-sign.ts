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

function __notifyReady() {
	if (__signReady || !window.parent || window.parent === window) return;
	__signReady = true;
	window.parent.postMessage({ type: 'ski:ready' }, '*');
}

function __isAllowedOrigin(origin) {
	return origin === 'https://sui.ski' || (origin.indexOf('.sui.ski') !== -1 && origin.indexOf('https://') === 0);
}

function __bytesToBase64(bytes) {
	return btoa(String.fromCharCode.apply(null, Array.from(bytes)));
}

async function __getTransactionClass() {
	if (__TransactionClass) return __TransactionClass;
	var mod = await import('https://esm.sh/@mysten/sui@1.25.0/transactions');
	__TransactionClass = mod.Transaction;
	return __TransactionClass;
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
			var tx = Tx.from(txData);

			var result = await SuiWalletKit.signAndExecute(tx, { txOptions: execOptions });

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
