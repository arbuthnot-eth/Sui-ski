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

    function __wkEnsureAccountForSign(conn, account, chain) {
      if (account && typeof account === 'object') {
        var normalizedAddress = __wkNormalizeAccountAddress(account);
        var nextAccount = account;
        if (normalizedAddress && nextAccount.address !== normalizedAddress) {
          try {
            nextAccount = Object.assign({}, nextAccount, { address: normalizedAddress });
          } catch (_e) {
            nextAccount.address = normalizedAddress;
          }
        }
        if (!Array.isArray(nextAccount.chains) || nextAccount.chains.length === 0) {
          var accountChains = [];
          if (conn && conn.wallet && Array.isArray(conn.wallet.chains)) {
            for (var i = 0; i < conn.wallet.chains.length; i++) {
              var walletChain = conn.wallet.chains[i];
              if (typeof walletChain === 'string' && walletChain.indexOf('sui:') === 0) {
                accountChains.push(walletChain);
              }
            }
          }
          if (!accountChains.length && chain) accountChains = [chain];
          if (!accountChains.length) accountChains = [__wkChain];
          try {
            nextAccount = Object.assign({}, nextAccount, { chains: accountChains });
          } catch (_e) {
            nextAccount.chains = accountChains;
          }
        }
        return nextAccount;
      }

      var fallbackAddress = __wkNormalizeAccountAddress(account);
      if (!fallbackAddress && conn && typeof conn.address === 'string') {
        fallbackAddress = conn.address.trim();
      }
      if (!fallbackAddress) return null;
      return {
        address: fallbackAddress,
        chains: [chain || __wkChain],
      };
    }

    function __wkResolveSigningChain(account, preferredChain) {
      if (preferredChain && typeof preferredChain === 'string') return preferredChain;
      if (account && Array.isArray(account.chains)) {
        for (var i = 0; i < account.chains.length; i++) {
          if (typeof account.chains[i] === 'string' && account.chains[i].indexOf('sui:') === 0) {
            return account.chains[i];
          }
        }
      }
      return __wkChain;
    }

    function __wkNetworkCandidates(chain) {
      var normalized = typeof chain === 'string' ? chain : __wkChain;
      if (normalized === 'sui:mainnet' || normalized === 'mainnet') return ['sui:mainnet', 'mainnet'];
      if (normalized === 'sui:testnet' || normalized === 'testnet') return ['sui:testnet', 'testnet'];
      if (normalized === 'sui:devnet' || normalized === 'devnet') return ['sui:devnet', 'devnet'];
      return [normalized, __wkChain];
    }

    function __wkGetRpcUrl() {
      var network = SuiWalletKit.__config && SuiWalletKit.__config.network
        ? String(SuiWalletKit.__config.network)
        : 'mainnet';
      if (network === 'testnet') return 'https://fullnode.testnet.sui.io:443';
      if (network === 'devnet') return 'https://fullnode.devnet.sui.io:443';
      return 'https://fullnode.mainnet.sui.io:443';
    }

    async function __wkExecuteSignedTransaction(signed, txInput, txOptions) {
      var signature = signed && (signed.signature || signed.signatures);
      var txBytes = signed && (
        signed.bytes ||
        signed.transactionBytes ||
        signed.transactionBlock ||
        signed.signedTransaction ||
        signed.transaction
      );

      if (!txBytes) txBytes = txInput;
      if (!signature) throw new Error('Missing signature from wallet');
      if (!txBytes) throw new Error('Missing signed transaction bytes from wallet');

      var txB64 = __wkBytesToBase64(txBytes);
      var signatures = Array.isArray(signature) ? signature : [signature];
      var rpcRes = await fetch(__wkGetRpcUrl(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_executeTransactionBlock',
          params: [txB64, signatures, txOptions || {}],
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

    var __skiRequestCounter = 0;
    var __skiSignTimeout = 120000;

    function __skiResolvePreferredWalletName() {
      var conn = SuiWalletKit.$connection.value || {};
      if (conn.wallet && conn.wallet.name) return String(conn.wallet.name);
      if (SuiWalletKit.__sessionWalletName) return String(SuiWalletKit.__sessionWalletName);
      try {
        var session = typeof getWalletSession === 'function' ? getWalletSession() : null;
        if (session && session.walletName) return String(session.walletName);
      } catch (_e) {}
      return '';
    }

    var __skiHiddenStyle = 'display:none;width:0;height:0;border:none';
    var __skiOverlayStyle = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;border:none;background:transparent';

    function __skiPostAndWait(frame, txB64, execOptions, expectedSender, preferredWalletName) {
      var requestId = 'ski-' + (++__skiRequestCounter) + '-' + Date.now();
      frame.style.cssText = __skiOverlayStyle;
      return new Promise(function(resolve, reject) {
        var done = false;
        function finish() {
          frame.style.cssText = __skiHiddenStyle;
        }
        var timer = setTimeout(function() {
          if (done) return;
          done = true;
          finish();
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
            finish();
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
          walletName: preferredWalletName || '',
        }, 'https://sui.ski');
      });
    }

    async function __skiSerializeTx(txInput) {
      if (typeof txInput === 'string') return txInput;
      if (txInput instanceof Uint8Array) return __wkBytesToBase64(txInput);
      if (txInput && typeof txInput.toJSON === 'function') {
        try {
          return JSON.stringify(await txInput.toJSON());
        } catch (_e) {
          if (txInput && typeof txInput.build === 'function') {
            var RpcClient = window.SuiJsonRpcClient || window.SuiClient;
            if (RpcClient) {
              var rpcClient = new RpcClient({ url: __wkGetRpcUrl() });
              var builtBytes = await txInput.build({ client: rpcClient });
              return __wkBytesToBase64(builtBytes);
            }
          }
          throw _e;
        }
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

	    function __skiShouldUseBridge(options) {
	      if (options && options.forceSignBridge) {
	        if ((!SuiWalletKit.__skiSignFrame || !SuiWalletKit.__skiSignReady) && typeof SuiWalletKit.__initSignBridge === 'function') {
	          try { SuiWalletKit.__initSignBridge(); } catch (_e) {}
	        }
	        return !!(SuiWalletKit.__skiSignFrame && SuiWalletKit.__skiSignReady);
	      }
	      if (!SuiWalletKit.__skiSignFrame || !SuiWalletKit.__skiSignReady) return false;
	      var conn = SuiWalletKit.$connection.value;
	      return !!(conn && conn.status === 'session' && !conn.wallet);
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

	      var sessionWalletName = '';
	      try {
	        var session = typeof getWalletSession === 'function' ? getWalletSession() : null;
	        sessionWalletName = session && session.walletName ? String(session.walletName) : '';
	      } catch (_e) {}

	      if (window.__wkWaaPLoading) {
	        try { await window.__wkWaaPLoading; } catch (_e) {}
	      }

	      var wallets = [];
	      try {
	        wallets = await SuiWalletKit.detectWallets();
	      } catch (_e) {
	        wallets = SuiWalletKit.$wallets.value || [];
	      }
	      if (!wallets || wallets.length === 0) return null;

	      var match = null;
	      var keyWallets = wallets.filter(function(w) { return !w.__isPasskey; });

	      if (sessionWalletName && sessionWalletName !== 'Passkey Wallet') {
	        for (var i = 0; i < keyWallets.length; i++) {
	          if (keyWallets[i] && keyWallets[i].name === sessionWalletName) {
	            match = keyWallets[i];
	            break;
	          }
	        }
	        if (!match) {
	          for (var j = 0; j < keyWallets.length; j++) {
	            if (keyWallets[j] && keyWallets[j].name && keyWallets[j].name.toLowerCase().indexOf(sessionWalletName.toLowerCase()) !== -1) {
	              match = keyWallets[j];
	              break;
	            }
	          }
	        }
	      }

	      if (!match && sessionWalletName === 'Passkey Wallet' && typeof SuiWalletKit.connectPasskey === 'function') {
	        try {
	          await SuiWalletKit.connectPasskey();
	          conn = SuiWalletKit.$connection.value || {};
	          if (conn.wallet) return conn;
	        } catch (_e) {}
	      }

	      if (!match && !sessionWalletName && keyWallets.length > 0) {
	        match = keyWallets[0];
	      }

	      if (!match) return null;

	      try {
	        await SuiWalletKit.connect(match);
	      } catch (_e) {
	        return null;
	      }

	      conn = SuiWalletKit.$connection.value || {};
	      return conn.wallet ? conn : null;
	    }

    var __wkRejectionPatterns = /reject|denied|cancel|decline|dismissed|disapproved|user refused/i;
    function __wkIsUserRejection(err) {
      if (!err) return false;
      var msg = (err.message || (typeof err === 'string' ? err : ''));
      return __wkRejectionPatterns.test(msg);
    }

    async function __skiWalletSignAndExecute(txInput, conn, options) {
      var txRaw = await __skiSerializeForWallet(txInput);
      var txBytes = txRaw;
      if (txRaw && typeof txRaw.serialize === 'function') {
        try {
          txBytes = await txRaw.serialize();
        } catch (_e) {
          if (txRaw && typeof txRaw.build === 'function') {
            try {
              var RpcClient = window.SuiJsonRpcClient || window.SuiClient;
              if (RpcClient) {
                var rpcClient = new RpcClient({ url: __wkGetRpcUrl() });
                txBytes = await txRaw.build({ client: rpcClient });
              }
            } catch (_e2) {}
          }
        }
      }
      var wallet = conn.wallet;
      var requestedChain = options && options.chain;
      var account = __wkEnsureAccountForSign(
        conn,
        __wkResolveWalletAccount(conn, options && options.account),
        requestedChain || __wkChain,
      );
      if (!account) {
        throw new Error('No wallet account available for signing. Reconnect wallet and retry.');
      }
      var chain = __wkResolveSigningChain(account, requestedChain);
      var txOptions = options && options.txOptions;
      var singleAttempt = !!(options && options.singleAttempt);
      var txB64 = txBytes;
      if (
        txBytes instanceof Uint8Array ||
        txBytes instanceof ArrayBuffer ||
        Array.isArray(txBytes)
      ) {
        txB64 = __wkBytesToBase64(txBytes);
      }

      async function __wkTryCalls(calls) {
        if (singleAttempt) {
          if (!Array.isArray(calls) || calls.length === 0) throw new Error('No compatible signing method found.');
          return await calls[0]();
        }
        var lastErr = null;
        for (var i = 0; i < calls.length; i++) {
          try {
            return await calls[i]();
          } catch (err) {
            lastErr = err;
            if (__wkIsUserRejection(err)) throw err;
          }
        }
        if (lastErr) throw lastErr;
        throw new Error('No compatible signing method found.');
      }

      var phantom = __wkGetPhantomProvider();
      var walletName = String((wallet && wallet.name) || '').toLowerCase();
      var isPhantomWallet = !!(
        (walletName && walletName.indexOf('phantom') !== -1)
        || (wallet && wallet.isPhantom)
        || (wallet && wallet._raw && wallet._raw.isPhantom)
        || (
          phantom && (
            wallet === phantom
            || (wallet && wallet._raw === phantom)
          )
        )
      );
      if (singleAttempt && phantom && isPhantomWallet) {
        var singleSenderAddress = __wkNormalizeAccountAddress(account) || (conn && conn.address) || '';
        var singleNetworkCandidates = __wkNetworkCandidates(chain);
        if (preferTransactionBlock && typeof phantom.signAndExecuteTransactionBlock === 'function') {
          return await phantom.signAndExecuteTransactionBlock({
            transactionBlock: txB64,
            options: txOptions,
          });
        }
        if (typeof phantom.signAndExecuteTransaction === 'function') {
          return await phantom.signAndExecuteTransaction({
            transaction: txB64,
            address: singleSenderAddress,
            networkID: singleNetworkCandidates[0],
            options: txOptions,
          });
        }
      }

      var preferTransactionBlock = !!(options && options.preferTransactionBlock);
      var signExecFeature = wallet.features && wallet.features['sui:signAndExecuteTransaction'];
      var signExecBlockFeature = wallet.features && wallet.features['sui:signAndExecuteTransactionBlock'];

      async function __wkTrySignAndExecuteTransaction() {
        if (!signExecFeature || !signExecFeature.signAndExecuteTransaction) return null;
        try {
          return await __wkTryCalls([
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
                account: account,
                chain: chain,
                options: txOptions,
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
                transaction: txB64,
                account: account,
                chain: chain,
                options: txOptions,
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
                transactionBlock: txB64,
                account: account,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
                account: account,
                chain: chain,
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
                transaction: txB64,
                account: account,
                chain: chain,
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
                transactionBlock: txB64,
                account: account,
                chain: chain,
              });
            },
          ]);
        } catch (err) {
          if (singleAttempt) throw err;
          console.warn('signAndExecuteTransaction failed:', err.message);
        }
        return null;
      }

      async function __wkTrySignAndExecuteTransactionBlock() {
        if (!signExecBlockFeature || !signExecBlockFeature.signAndExecuteTransactionBlock) return null;
        try {
          return await __wkTryCalls([
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
                account: account,
                chain: chain,
                options: txOptions,
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
                transactionBlock: txB64,
                account: account,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txBytes,
                account: account,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txB64,
                account: account,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
                account: account,
                chain: chain,
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
                transactionBlock: txB64,
                account: account,
                chain: chain,
              });
            },
          ]);
        } catch (err) {
          if (singleAttempt) throw err;
          console.warn('signAndExecuteTransactionBlock failed:', err.message);
        }
        return null;
      }

      if (preferTransactionBlock) {
        var byBlock = await __wkTrySignAndExecuteTransactionBlock();
        if (byBlock) return byBlock;
        var byTx = await __wkTrySignAndExecuteTransaction();
        if (byTx) return byTx;
      } else {
        var byTxDefault = await __wkTrySignAndExecuteTransaction();
        if (byTxDefault) return byTxDefault;
        var byBlockDefault = await __wkTrySignAndExecuteTransactionBlock();
        if (byBlockDefault) return byBlockDefault;
      }

      if (phantom && isPhantomWallet) {
        try {
          var networkCandidates = __wkNetworkCandidates(chain);
          var senderAddress = __wkNormalizeAccountAddress(account) || (conn && conn.address) || '';
          return await __wkTryCalls([
            function() {
              if (typeof phantom.signAndExecuteTransactionBlock !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                options: txOptions,
              });
            },
            function() {
              if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransaction({
                transaction: txB64,
                address: senderAddress,
                networkID: networkCandidates[0],
                options: txOptions,
              });
            },
            function() {
              if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransaction({
                transaction: txB64,
                address: senderAddress,
                networkID: networkCandidates.length > 1 ? networkCandidates[1] : networkCandidates[0],
                options: txOptions,
              });
            },
            function() {
              if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransaction({
                transaction: txB64,
                address: senderAddress,
              });
            },
            function() {
              if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransaction({
                transaction: txB64,
                options: txOptions,
              });
            },
            function() {
              if (typeof phantom.signAndExecuteTransaction !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransaction({
                transaction: txB64,
              });
            },
            function() {
              if (typeof phantom.signAndExecuteTransactionBlock !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransactionBlock({
                transaction: txB64,
                options: txOptions,
              });
            },
            function() {
              if (typeof phantom.signAndExecuteTransactionBlock !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransactionBlock({ transactionBlock: txB64 });
            },
            function() {
              if (typeof phantom.signAndExecuteTransactionBlock !== 'function') throw new Error('Unavailable');
              return phantom.signAndExecuteTransactionBlock({ transaction: txB64 });
            },
          ]);
        } catch (_e) {
          if (singleAttempt) throw _e;
          try {
            var signCalls = [];
            for (var ni = 0; ni < networkCandidates.length; ni++) {
              var networkID = networkCandidates[ni];
              signCalls.push(function(networkIDCopy) {
                return function() {
                  if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
                  return phantom.signTransaction({
                    transaction: txB64,
                    address: senderAddress,
                    networkID: networkIDCopy,
                  });
                };
              }(networkID));
            }
            signCalls.push(function() {
              if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
              return phantom.signTransaction({ transaction: txB64, address: senderAddress });
            });
            signCalls.push(function() {
              if (typeof phantom.signTransaction !== 'function') throw new Error('Unavailable');
              return phantom.signTransaction({ transaction: txB64 });
            });
            signCalls.push(function() {
              if (typeof phantom.signTransactionBlock !== 'function') throw new Error('Unavailable');
              return phantom.signTransactionBlock({ transactionBlock: txB64 });
            });
            signCalls.push(function() {
              if (typeof phantom.signTransactionBlock !== 'function') throw new Error('Unavailable');
              return phantom.signTransactionBlock({ transaction: txB64 });
            });

            var signedPhantom = await __wkTryCalls(signCalls);
            if (signedPhantom && signedPhantom.digest) return signedPhantom;
            return await __wkExecuteSignedTransaction(signedPhantom, txB64, txOptions);
          } catch (_e2) {
            if (singleAttempt) throw _e2;
            // Continue to other wallet fallbacks.
          }
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
        } catch (_e) {
          if (singleAttempt) throw _e;
        }
      }

      if (typeof SuiWalletKit.signTransaction === 'function') {
        try {
          var signed = await SuiWalletKit.signTransaction(txInput, {
            account: account,
            chain: chain,
          });
          if (signed && signed.digest) return signed;
          return await __wkExecuteSignedTransaction(signed, txB64, txOptions);
        } catch (_e) {
          if (singleAttempt) throw _e;
        }
      }

      throw new Error('No compatible signing method found. Install a Sui wallet extension.');
    }

	    SuiWalletKit.signAndExecute = async function signAndExecute(txInput, options) {
	      var onSubdomain = window.location.hostname !== 'sui.ski' && window.location.hostname.endsWith('.sui.ski');
	      var mustUseBridge = !!(onSubdomain && options && options.forceSignBridge);

	      if (__skiShouldUseBridge(options)) {
	        var bridgeError = null;
	        try {
	          var frame = await __skiEnsureBridge();
	          var b64 = await __skiSerializeTx(txInput);
	          var txOptions = (options && options.txOptions) || {};
	          var sessionConn = SuiWalletKit.$connection.value || {};
	          var sessionAccount = (options && options.account) || sessionConn.account;
	          var expectedSender = __wkNormalizeAccountAddress(sessionAccount) || sessionConn.address || '';
            var preferredWalletName = __skiResolvePreferredWalletName();
	          return await __skiPostAndWait(frame, b64, txOptions, expectedSender, preferredWalletName);
	        } catch (err) {
	          bridgeError = err;
	          console.warn('Sign bridge failed:', err && err.message ? err.message : err);
	        }

	        var isSessionConn = sessionConn && sessionConn.status === 'session' && !sessionConn.wallet;
	        if ((mustUseBridge && !isSessionConn) || __wkIsUserRejection(bridgeError)) {
	          throw bridgeError || new Error('Sign bridge failed. Reconnect wallet from sui.ski and retry.');
	        }

	        var reconnected = await __skiEnsureConnectedWalletForSigning();
	        if (reconnected && reconnected.wallet) {
	          return await __skiWalletSignAndExecute(txInput, reconnected, options);
	        }
	        if (bridgeError) throw bridgeError;
	      } else if (mustUseBridge) {
	        throw new Error('Sign bridge not available. Reconnect wallet from sui.ski and retry.');
	      }
	      return await __skiWalletSignAndExecute(txInput, __wkGetWallet(), options);
	    };

    SuiWalletKit.signAndExecuteFromBytes = SuiWalletKit.signAndExecute;

	    SuiWalletKit.signTransaction = async function signTransaction(txInput, options) {
	      if (__skiShouldUseBridge(options)) {
	        var bridgeError = null;
	        try {
	          var frame = await __skiEnsureBridge();
	          var b64 = await __skiSerializeTx(txInput);
	          var conn = SuiWalletKit.$connection.value || {};
	          var account = (options && options.account) || conn.account;
	          var expectedSender = __wkNormalizeAccountAddress(account) || conn.address || '';
            var preferredWalletName = __skiResolvePreferredWalletName();
	          return await __skiPostAndWait(frame, b64, {}, expectedSender, preferredWalletName);
	        } catch (err) {
	          bridgeError = err;
	          console.warn('Sign bridge failed:', err && err.message ? err.message : err);
	        }

	        var onSubdomain = window.location.hostname !== 'sui.ski' && window.location.hostname.endsWith('.sui.ski');
	        if (onSubdomain && options && options.forceSignBridge) {
	          throw bridgeError || new Error('Sign bridge failed. Reconnect wallet from sui.ski and retry.');
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
        } catch (_e) {
          if (txRaw && typeof txRaw.build === 'function') {
            try {
              var RpcClient = window.SuiJsonRpcClient || window.SuiClient;
              if (RpcClient) {
                var rpcClient = new RpcClient({ url: __wkGetRpcUrl() });
                txBytes = await txRaw.build({ client: rpcClient });
              }
            } catch (_e2) {}
          }
        }
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
      var walletName = String((wallet && wallet.name) || '').toLowerCase();
      var isPhantomWallet = !!(
        (walletName && walletName.indexOf('phantom') !== -1)
        || (wallet && wallet.isPhantom)
        || (wallet && wallet._raw && wallet._raw.isPhantom)
        || (
          phantom && (
            wallet === phantom
            || (wallet && wallet._raw === phantom)
          )
        )
      );
      if (phantom && phantom.signTransactionBlock && isPhantomWallet) {
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
