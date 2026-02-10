export function generateWalletTxJs(): string {
	return `
    var __wkChain = 'sui:' + SuiWalletKit.__config.network;

    function __wkBytesToBase64(bytes) {
      if (typeof bytes === 'string') return bytes;
      if (bytes instanceof ArrayBuffer) bytes = new Uint8Array(bytes);
      if (Array.isArray(bytes)) bytes = Uint8Array.from(bytes);
      if (!bytes || typeof bytes.subarray !== 'function') {
        throw new Error('Expected byte array for base64 conversion');
      }
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

    function __wkNormalizeAccountAddress(account) {
      if (!account) return '';
      var rawAddress = '';
      if (typeof account.address === 'string') rawAddress = account.address.trim();
      if (!rawAddress && account.address && typeof account.address.toString === 'function') {
        rawAddress = String(account.address.toString()).trim();
      }
      if (!rawAddress) return '';
      if (/^[0-9a-fA-F]{2,}$/.test(rawAddress) && rawAddress.indexOf('0x') !== 0) {
        return '0x' + rawAddress;
      }
      return rawAddress;
    }

    function __wkResolveWalletAccount(conn, preferredAccount) {
      var wallet = conn && conn.wallet;
      var resolved = preferredAccount || conn.account || null;
      var walletAccounts = [];
      try {
        walletAccounts = (wallet && Array.isArray(wallet.accounts)) ? wallet.accounts : [];
      } catch (_e) {}
      if (!walletAccounts.length) return resolved;
      if (!resolved) return walletAccounts[0];
      var targetAddress = __wkNormalizeAccountAddress(resolved);
      if (!targetAddress) return walletAccounts[0];
      for (var i = 0; i < walletAccounts.length; i++) {
        if (__wkNormalizeAccountAddress(walletAccounts[i]) === targetAddress) {
          return walletAccounts[i];
        }
      }
      return walletAccounts[0];
    }

    var __skiRequestCounter = 0;
    var __skiSignTimeout = 120000;

    function __skiPostAndWait(frame, txB64, execOptions, expectedSender) {
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
          sender: expectedSender || '',
        }, 'https://sui.ski');
      });
    }

    async function __skiSerializeTx(txInput) {
      if (typeof txInput === 'string') return txInput;
      if (txInput instanceof Uint8Array) return __wkBytesToBase64(txInput);
      if (txInput && typeof txInput.toJSON === 'function') {
        return JSON.stringify(await txInput.toJSON());
      }
      throw new Error('Cannot serialize transaction for sign bridge. Got: ' + typeof txInput);
    }

    async function __skiSerializeForWallet(txInput) {
      if (typeof txInput === 'string') return txInput;
      if (txInput instanceof Uint8Array) return txInput;
      if (txInput && typeof txInput.serialize === 'function') {
        return txInput;
      }
      return txInput;
    }

	    function __skiIsSessionBridge() {
	      var conn = SuiWalletKit.$connection.value;
	      return conn && conn.status === 'session' && !conn.wallet && SuiWalletKit.__skiSignFrame;
	    }

	    async function __skiEnsureBridge() {
	      var ready = SuiWalletKit.__skiSignReady;
	      if (!ready) throw new Error('Sign bridge not initialized');
	      var ok = await ready;
	      if (!ok) throw new Error('Sign bridge failed to connect wallet. Try refreshing.');
	      return SuiWalletKit.__skiSignFrame;
	    }

	    async function __skiEnsureConnectedWalletForSigning() {
	      var conn = SuiWalletKit.$connection.value || {};
	      if (conn.wallet) return conn;

	      var preferredWalletName = '';
	      try {
	        var session = typeof getWalletSession === 'function' ? getWalletSession() : null;
	        preferredWalletName = session && session.walletName ? String(session.walletName) : '';
	      } catch (_e) {}

	      var wallets = [];
	      try {
	        wallets = await SuiWalletKit.detectWallets();
	      } catch (_e) {
	        wallets = SuiWalletKit.$wallets.value || [];
	      }
	      if (!wallets || wallets.length === 0) return null;

	      var match = null;
	      var keyWallets = wallets.filter(function(w) { return !w.__isPasskey; });
	      if (preferredWalletName && preferredWalletName !== 'Passkey Wallet') {
	        for (var i = 0; i < keyWallets.length; i++) {
	          if (keyWallets[i] && keyWallets[i].name === preferredWalletName) {
	            match = keyWallets[i];
	            break;
	          }
	        }
	      }
	      if (!match) {
	        for (var p = 0; p < keyWallets.length; p++) {
	          if (String(keyWallets[p].name || '') === 'Phantom') {
	            match = keyWallets[p];
	            break;
	          }
	        }
	      }
	      if (!match && keyWallets.length > 0) {
	        match = keyWallets[0];
	      }

	      if (!match && preferredWalletName === 'Passkey Wallet' && typeof SuiWalletKit.connectPasskey === 'function') {
	        try {
	          await SuiWalletKit.connectPasskey();
	          conn = SuiWalletKit.$connection.value || {};
	          if (conn.wallet) return conn;
	        } catch (_e) {}
	      }

	      if (!match) match = wallets[0];
	      if (!match) return null;

	      try {
	        await SuiWalletKit.connect(match);
	      } catch (_e) {
	        return null;
	      }

	      conn = SuiWalletKit.$connection.value || {};
	      return conn.wallet ? conn : null;
	    }

    async function __skiWalletSignAndExecute(txInput, conn, options) {
      var txRaw = await __skiSerializeForWallet(txInput);
      var txBytes = txRaw;
      if (txRaw && typeof txRaw.serialize === 'function') {
        try {
          txBytes = await txRaw.serialize();
        } catch (_e) {}
      }
      var wallet = conn.wallet;
      var account = __wkResolveWalletAccount(conn, options && options.account);
      var chain = (options && options.chain) || __wkChain;
      var txOptions = options && options.txOptions;
      var txB64 = txBytes;
      if (
        txBytes instanceof Uint8Array ||
        txBytes instanceof ArrayBuffer ||
        Array.isArray(txBytes)
      ) {
        txB64 = __wkBytesToBase64(txBytes);
      }

      async function __wkTryCalls(calls) {
        var lastErr = null;
        for (var i = 0; i < calls.length; i++) {
          try {
            return await calls[i]();
          } catch (err) {
            lastErr = err;
          }
        }
        if (lastErr) throw lastErr;
        throw new Error('No compatible signing method found.');
      }

      var signExecFeature = wallet.features && wallet.features['sui:signAndExecuteTransaction'];
      if (signExecFeature && signExecFeature.signAndExecuteTransaction) {
        try {
          return await __wkTryCalls([
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
                account: account,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
                account: account,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txB64,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txB64,
                account: account,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txB64,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
                account: account,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txB64,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
                account: account,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txB64,
                account: account,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txBytes,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txBytes,
                account: account,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txBytes,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txB64,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txB64,
                account: account,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txB64,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txBytes,
                account: account,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txBytes,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txB64,
                options: txOptions,
              });
            },
          ]);
        } catch (err) {
          console.warn('signAndExecuteTransaction failed:', err.message);
        }
      }

      var signExecBlockFeature = wallet.features && wallet.features['sui:signAndExecuteTransactionBlock'];
      if (signExecBlockFeature && signExecBlockFeature.signAndExecuteTransactionBlock) {
        try {
          return await __wkTryCalls([
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
                account: account,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                account: account,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                account: account,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                account: account,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                account: account,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txBytes,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txB64,
                options: txOptions,
              });
            },
          ]);
        } catch (err) {
          console.warn('signAndExecuteTransactionBlock failed:', err.message);
        }
      }

      var phantom = __wkGetPhantomProvider();
      if (phantom && phantom.signAndExecuteTransactionBlock) {
        try {
          return await __wkTryCalls([
            function() {
              return phantom.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                options: txOptions,
              });
            },
            function() {
              return phantom.signAndExecuteTransactionBlock({
                transaction: txBytes,
                options: txOptions,
              });
            },
            function() {
              return phantom.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                options: txOptions,
              });
            },
            function() {
              return phantom.signAndExecuteTransactionBlock({
                transaction: txB64,
                options: txOptions,
              });
            },
          ]);
        } catch (_e) {
          // Continue to other wallet fallbacks.
        }
      }

      if (window.suiWallet && window.suiWallet.signAndExecuteTransactionBlock) {
        try {
          return await __wkTryCalls([
            function() {
              return window.suiWallet.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                options: txOptions,
              });
            },
            function() {
              return window.suiWallet.signAndExecuteTransactionBlock({
                transaction: txBytes,
                options: txOptions,
              });
            },
            function() {
              return window.suiWallet.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                options: txOptions,
              });
            },
          ]);
        } catch (_e) {}
      }

      throw new Error('No compatible signing method found. Install a Sui wallet extension.');
    }

	    SuiWalletKit.signAndExecute = async function signAndExecute(txInput, options) {
	      if (__skiIsSessionBridge()) {
	        var bridgeError = null;
	        try {
	          var frame = await __skiEnsureBridge();
	          var b64 = await __skiSerializeTx(txInput);
	          var txOptions = (options && options.txOptions) || {};
	          var sessionConn = SuiWalletKit.$connection.value || {};
	          var sessionAccount = (options && options.account) || sessionConn.account;
	          var expectedSender = __wkNormalizeAccountAddress(sessionAccount) || sessionConn.address || '';
	          return await __skiPostAndWait(frame, b64, txOptions, expectedSender);
	        } catch (err) {
	          bridgeError = err;
	          console.warn('Sign bridge unavailable, falling back to direct wallet signing:', err && err.message ? err.message : err);
	        }

	        var reconnected = await __skiEnsureConnectedWalletForSigning();
	        if (reconnected && reconnected.wallet) {
	          return await __skiWalletSignAndExecute(txInput, reconnected, options);
	        }
	        if (bridgeError) throw bridgeError;
	      }
	      return await __skiWalletSignAndExecute(txInput, __wkGetWallet(), options);
	    };

    SuiWalletKit.signAndExecuteFromBytes = SuiWalletKit.signAndExecute;

	    SuiWalletKit.signTransaction = async function signTransaction(txInput, options) {
	      if (__skiIsSessionBridge()) {
	        var bridgeError = null;
	        try {
	          var frame = await __skiEnsureBridge();
	          var b64 = await __skiSerializeTx(txInput);
	          var conn = SuiWalletKit.$connection.value || {};
	          var account = (options && options.account) || conn.account;
	          var expectedSender = __wkNormalizeAccountAddress(account) || conn.address || '';
	          return await __skiPostAndWait(frame, b64, {}, expectedSender);
	        } catch (err) {
	          bridgeError = err;
	          console.warn('Sign bridge unavailable, falling back to direct wallet signing:', err && err.message ? err.message : err);
	        }

	        var reconnected = await __skiEnsureConnectedWalletForSigning();
	        if (reconnected && reconnected.wallet) {
	          // Continue into direct wallet signing flow below.
	        } else if (bridgeError) {
	          throw bridgeError;
	        }
	      }

      var txRaw = await __skiSerializeForWallet(txInput);
      var txBytes = txRaw;
      if (txRaw && typeof txRaw.serialize === 'function') {
        try {
          txBytes = await txRaw.serialize();
        } catch (_e) {}
      }
      var txB64 = txBytes;
      if (
        txBytes instanceof Uint8Array ||
        txBytes instanceof ArrayBuffer ||
        Array.isArray(txBytes)
      ) {
        txB64 = __wkBytesToBase64(txBytes);
      }
      var conn = __wkGetWallet();
      var wallet = conn.wallet;
      var account = __wkResolveWalletAccount(conn, options && options.account);
      var chain = (options && options.chain) || __wkChain;
      async function __wkTryCalls(calls) {
        var lastErr = null;
        for (var i = 0; i < calls.length; i++) {
          try {
            return await calls[i]();
          } catch (err) {
            lastErr = err;
          }
        }
        if (lastErr) throw lastErr;
        throw new Error('Wallet does not support transaction signing. Try a different wallet or update your current one.');
      }

      var signFeature = wallet.features && wallet.features['sui:signTransaction'];
      if (signFeature && signFeature.signTransaction) {
        try {
          return await __wkTryCalls([
            function() {
              return signFeature.signTransaction({
                transaction: txRaw,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txRaw,
                account: account,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txRaw,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txBytes,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txBytes,
                account: account,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txBytes,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txB64,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txB64,
                account: account,
              });
            },
            function() {
              return signFeature.signTransaction({
                transaction: txB64,
              });
            },
          ]);
        } catch (err) {
          console.warn('signTransaction failed:', err && err.message ? err.message : err);
        }
      }

      var signBlockFeature = wallet.features && wallet.features['sui:signTransactionBlock'];
      if (signBlockFeature && signBlockFeature.signTransactionBlock) {
        try {
          return await __wkTryCalls([
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txRaw,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txRaw,
                account: account,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txRaw,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txBytes,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txBytes,
                account: account,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txBytes,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txB64,
                account: account,
                chain: chain,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txB64,
                account: account,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transactionBlock: txB64,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transaction: txRaw,
                account: account,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transaction: txBytes,
                account: account,
              });
            },
            function() {
              return signBlockFeature.signTransactionBlock({
                transaction: txB64,
                account: account,
              });
            },
          ]);
        } catch (err) {
          console.warn('signTransactionBlock failed:', err && err.message ? err.message : err);
        }
      }

      var phantom = __wkGetPhantomProvider();
      if (phantom && phantom.signTransactionBlock) {
        try {
          return await __wkTryCalls([
            function() { return phantom.signTransactionBlock({ transactionBlock: txRaw }); },
            function() { return phantom.signTransactionBlock({ transaction: txRaw }); },
            function() { return phantom.signTransactionBlock({ transactionBlock: txBytes }); },
            function() { return phantom.signTransactionBlock({ transaction: txBytes }); },
            function() { return phantom.signTransactionBlock({ transactionBlock: txB64 }); },
            function() { return phantom.signTransactionBlock({ transaction: txB64 }); },
          ]);
        } catch (_e) {
          // Continue to wallet fallback.
        }
      }

      if (window.suiWallet && window.suiWallet.signTransactionBlock) {
        try {
          return await __wkTryCalls([
            function() { return window.suiWallet.signTransactionBlock({ transactionBlock: txRaw }); },
            function() { return window.suiWallet.signTransactionBlock({ transaction: txRaw }); },
            function() { return window.suiWallet.signTransactionBlock({ transactionBlock: txBytes }); },
            function() { return window.suiWallet.signTransactionBlock({ transaction: txBytes }); },
            function() { return window.suiWallet.signTransactionBlock({ transactionBlock: txB64 }); },
            function() { return window.suiWallet.signTransactionBlock({ transaction: txB64 }); },
          ]);
        } catch (_e) {}
      }

      throw new Error('Wallet does not support transaction signing. Try a different wallet or update your current one.');
    };
  `
}
