export function generateWalletTxJs(): string {
	return `
    var __wkChain = 'sui:' + SuiWalletKit.__config.network;

    function __wkBytesToBase64(bytes) {
      var CHUNK = 8192;
      var parts = [];
      for (var i = 0; i < bytes.length; i += CHUNK) {
        parts.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length))));
      }
      return btoa(parts.join(''));
    }

    function __wkGetPhantomProvider() {
      var provider = window.phantom && window.phantom.sui;
      return provider && provider.isPhantom ? provider : null;
    }

    function __wkGetWallet() {
      var conn = SuiWalletKit.$connection.value;
      if (!conn || !conn.wallet) throw new Error('No wallet connected. Call SuiWalletKit.connect() first.');
      return conn;
    }

    var __skiRequestCounter = 0;
    var __skiSignTimeout = 120000;

    function __skiPostAndWait(frame, txB64, execOptions) {
      var requestId = 'ski-' + (++__skiRequestCounter) + '-' + Date.now();
      return new Promise(function(resolve, reject) {
        var done = false;
        var timer = setTimeout(function() {
          if (done) return;
          done = true;
          reject(new Error('Signing timed out after ' + (__skiSignTimeout / 1000) + 's'));
        }, __skiSignTimeout);

        function handler(e) {
          if (e.origin !== 'https://sui.ski') return;
          if (!e.data || e.data.requestId !== requestId) return;
          if (e.data.type === 'ski:signed' || e.data.type === 'ski:error') {
            window.removeEventListener('message', handler);
            clearTimeout(timer);
            if (done) return;
            done = true;
            if (e.data.type === 'ski:error') {
              reject(new Error(e.data.error || 'Signing failed'));
            } else {
              resolve(e.data);
            }
          }
        }

        window.addEventListener('message', handler);
        frame.contentWindow.postMessage({
          type: 'ski:sign',
          txBytes: txB64,
          requestId: requestId,
          options: execOptions || {},
        }, 'https://sui.ski');
      });
    }

    async function __skiSerializeTx(txInput) {
      if (typeof txInput === 'string') return txInput;
      if (txInput instanceof Uint8Array) return __wkBytesToBase64(txInput);
      if (txInput && typeof txInput.serialize === 'function') {
        return __wkBytesToBase64(await txInput.serialize());
      }
      if (txInput && typeof txInput.toJSON === 'function') {
        return JSON.stringify(await txInput.toJSON());
      }
      throw new Error('Cannot serialize transaction for sign bridge. Got: ' + typeof txInput);
    }

    async function __skiSerializeForWallet(txInput) {
      if (typeof txInput === 'string') return txInput;
      if (txInput instanceof Uint8Array) return txInput;
      if (txInput && typeof txInput.serialize === 'function') {
        return await txInput.serialize();
      }
      if (txInput && typeof txInput.toJSON === 'function') {
        return JSON.stringify(await txInput.toJSON());
      }
      return txInput;
    }

    function __skiIsSessionBridge() {
      var conn = SuiWalletKit.$connection.value;
      return conn && conn.status === 'session' && SuiWalletKit.__skiSignFrame;
    }

    async function __skiEnsureBridge() {
      var ready = SuiWalletKit.__skiSignReady;
      if (!ready) throw new Error('Sign bridge not initialized');
      var ok = await ready;
      if (!ok) throw new Error('Sign bridge failed to connect wallet. Try refreshing.');
      return SuiWalletKit.__skiSignFrame;
    }

    async function __skiWalletSignAndExecute(txInput, conn, options) {
      var txBytes = await __skiSerializeForWallet(txInput);
      var wallet = conn.wallet;
      var account = (options && options.account) || conn.account;
      var chain = (options && options.chain) || __wkChain;
      var txOptions = options && options.txOptions;

      var signExecFeature = wallet.features && wallet.features['sui:signAndExecuteTransaction'];
      if (signExecFeature && signExecFeature.signAndExecuteTransaction) {
        return await signExecFeature.signAndExecuteTransaction({
          transaction: txBytes,
          account: account,
          chain: chain,
          options: txOptions,
        });
      }

      var signExecBlockFeature = wallet.features && wallet.features['sui:signAndExecuteTransactionBlock'];
      if (signExecBlockFeature && signExecBlockFeature.signAndExecuteTransactionBlock) {
        return await signExecBlockFeature.signAndExecuteTransactionBlock({
          transactionBlock: txBytes,
          account: account,
          chain: chain,
          options: txOptions,
        });
      }

      var phantom = __wkGetPhantomProvider();
      if (phantom && phantom.signAndExecuteTransactionBlock) {
        try {
          return await phantom.signAndExecuteTransactionBlock({
            transactionBlock: txBytes,
          });
        } catch (_e) {
          var b64 = (txBytes instanceof Uint8Array) ? __wkBytesToBase64(txBytes) : txBytes;
          return await phantom.signAndExecuteTransactionBlock({
            transactionBlock: b64,
          });
        }
      }

      if (window.suiWallet && window.suiWallet.signAndExecuteTransactionBlock) {
        return await window.suiWallet.signAndExecuteTransactionBlock({
          transactionBlock: txBytes,
        });
      }

      throw new Error('No compatible signing method found. Install a Sui wallet extension.');
    }

    SuiWalletKit.signAndExecute = async function signAndExecute(txInput, options) {
      if (__skiIsSessionBridge()) {
        var frame = await __skiEnsureBridge();
        var b64 = await __skiSerializeTx(txInput);
        var txOptions = (options && options.txOptions) || {};
        return await __skiPostAndWait(frame, b64, txOptions);
      }
      return await __skiWalletSignAndExecute(txInput, __wkGetWallet(), options);
    };

    SuiWalletKit.signAndExecuteFromBytes = SuiWalletKit.signAndExecute;

    SuiWalletKit.signTransaction = async function signTransaction(txInput, options) {
      if (__skiIsSessionBridge()) {
        var frame = await __skiEnsureBridge();
        var b64 = await __skiSerializeTx(txInput);
        return await __skiPostAndWait(frame, b64, {});
      }

      var txBytes = await __skiSerializeForWallet(txInput);
      var conn = __wkGetWallet();
      var wallet = conn.wallet;
      var account = (options && options.account) || conn.account;
      var chain = (options && options.chain) || __wkChain;

      var signFeature = wallet.features && wallet.features['sui:signTransaction'];
      if (signFeature && signFeature.signTransaction) {
        return await signFeature.signTransaction({
          transaction: txBytes,
          account: account,
          chain: chain,
        });
      }

      var signBlockFeature = wallet.features && wallet.features['sui:signTransactionBlock'];
      if (signBlockFeature && signBlockFeature.signTransactionBlock) {
        return await signBlockFeature.signTransactionBlock({
          transactionBlock: txBytes,
          account: account,
          chain: chain,
        });
      }

      var phantom = __wkGetPhantomProvider();
      if (phantom && phantom.signTransactionBlock) {
        try {
          return await phantom.signTransactionBlock({ transactionBlock: txBytes });
        } catch (_e) {
          var b64 = (txBytes instanceof Uint8Array) ? __wkBytesToBase64(txBytes) : txBytes;
          return await phantom.signTransactionBlock({ transactionBlock: b64 });
        }
      }

      if (window.suiWallet && window.suiWallet.signTransactionBlock) {
        return await window.suiWallet.signTransactionBlock({ transactionBlock: txBytes });
      }

      throw new Error('Wallet does not support transaction signing. Try a different wallet or update your current one.');
    };
  `
}
