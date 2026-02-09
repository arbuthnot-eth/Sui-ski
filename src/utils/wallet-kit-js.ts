export interface WalletKitConfig {
	network: string
	features?: string[]
	autoConnect?: boolean
}

const PHANTOM_ICON =
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNTM0QkI1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNTUxQkY5Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9InVybCgjYSkiIHJ4PSIyNCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMTAuNCw2NC4xYy0uMy0xNS44LTEyLjQtMjguMi0yNy4zLTI4LjVIMjcuNmMtMy4yLDAtNS44LDIuNi01LjgsNS44djg1LjRjMCwxLjQuNCwyLjguNiw0LjIuMi40LjQsLjguNSwxLjNsMCwwYy4xLjMuMi43LjQsMS4xLjIuNS41LDEsLjgsMS41LjMuNi43LDEuMSwxLjEsMS43bDAsMGMuNS43LDEuMSwxLjMsMS43LDEuOWwwLDBjLjcuNywxLjUsMS4zLDIuMywxLjhsLjEuMWMuOC41LDEuNiwuOSwyLjUsMS4yLjMuMS42LjIuOS4zaDBoMC4xYy42LjIsMS4yLjMsMS44LjRoMGMuMSwwLC4yLDAsLjMsMCwuNS4xLDEuMS4xLDEuNi4xaDYxLjljMy4yLDAsNS44LTIuNiw1LjgtNS44VjY0LjFoMFoiLz48L3N2Zz4='

const SUI_WALLET_ICON =
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiM2RkJDRjAiIHJ4PSI4Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTI4LjYsMTUuM2MtLjktMy4yLTQuNi01LjUtOS4yLTUuNXMtOC4zLDIuMy05LjIsNS41Yy0uMi44LS4zLDEuNi0uMywyLjRzLjEsMS43LjMsMi41Yy45LDMuMiw0LjYsNS41LDkuMiw1LjVzOC4zLTIuMyw5LjItNS41Yy4yLS44LjMtMS42LjMtMi41cy0uMS0xLjYtLjMtMi40WiIvPjxwYXRoIGZpbGw9IiM2RkJDRjAiIGQ9Ik0xOS40LDE0LjVjLTIuNCwwLTQuMywxLjQtNC4zLDMuMXMxLjksMy4xLDQuMywzLjEsNC4zLTEuNCw0LjMtMy4xLTEuOS0zLjEtNC4zLTMuMVoiLz48L3N2Zz4='

export function generateWalletKitJs(config: WalletKitConfig): string {
	const network = config.network || 'mainnet'
	const autoConnect = config.autoConnect !== false

	return `
    var SuiWalletKit = (function() {
      var __wkNetwork = ${JSON.stringify(network)};
      var __wkAutoConnect = ${autoConnect};

      function __wkCreateStore(initial) {
        var value = initial;
        var listeners = [];
        return {
          get value() { return value; },
          set: function(next) {
            value = next;
            for (var i = 0; i < listeners.length; i++) listeners[i](value);
          },
          subscribe: function(fn) {
            listeners.push(fn);
            return function() {
              var idx = listeners.indexOf(fn);
              if (idx >= 0) listeners.splice(idx, 1);
            };
          }
        };
      }

      var $wallets = __wkCreateStore([]);
      var $connection = __wkCreateStore({
        wallet: null,
        account: null,
        address: null,
        status: 'disconnected',
        primaryName: null
      });

      function subscribe(store, fn) {
        return store.subscribe(fn);
      }

      function __wkSafeGetAccounts(obj) {
        if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return [];
        try {
          var accounts = null;
          // Use Reflect if available for proxy safety, with a fallback to direct access
          if (typeof Reflect !== 'undefined' && typeof Reflect.get === 'function') {
            try { accounts = Reflect.get(obj, 'accounts'); } catch(e) { accounts = obj.accounts; }
          } else {
            accounts = obj.accounts;
          }
          
          if (typeof accounts === 'function') {
            try { accounts = accounts.call(obj); } catch(e) {}
          }
          
          if (Array.isArray(accounts)) return accounts;
          
          // Legacy check for single account objects or nested accounts
          if (obj.address || obj.publicKey) return [obj];
          if (obj.account && (obj.account.address || obj.account.publicKey)) return [obj.account];
          
          // Deep check for injected providers
          if (obj._raw && obj._raw !== obj) return __wkSafeGetAccounts(obj._raw);
          if (obj.sui && obj.sui !== obj) return __wkSafeGetAccounts(obj.sui);
          
          return [];
        } catch (e) {
          return [];
        }
      }

	      function __wkNormalizeAccountAddress(account) {
	        if (!account) return '';
	        var rawAddress = '';
	        if (typeof account.address === 'string') {
	          rawAddress = account.address.trim();
	        } else if (account.address && typeof account.address.toString === 'function') {
	          rawAddress = String(account.address.toString()).trim();
	        } else if (typeof account.publicKey === 'string') {
	          rawAddress = account.publicKey.trim();
	        } else if (account.publicKey && typeof account.publicKey.toString === 'function') {
	          rawAddress = String(account.publicKey.toString()).trim();
	        }
	        if (!rawAddress) return '';
	        if (/^[0-9a-fA-F]{2,}$/.test(rawAddress) && rawAddress.indexOf('0x') !== 0) {
	          return '0x' + rawAddress;
	        }
	        return rawAddress;
	      }

	      function __wkBuildPhantomAccount(address) {
	        var normalized = __wkNormalizeAccountAddress({ address: address });
	        if (!normalized) return null;
	        if (!/^0x[0-9a-fA-F]{2,}$/.test(normalized)) return null;
	        return {
	          address: normalized,
	          chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet']
	        };
	      }

	      function __wkExtractPhantomAddress(result) {
	        if (!result) return '';
	        if (typeof result === 'string') return __wkNormalizeAccountAddress({ address: result });
	        var direct = __wkNormalizeAccountAddress(result);
	        if (direct) return direct;
	        var accounts = __wkSafeGetAccounts(result);
	        if (accounts.length > 0) {
	          var first = __wkNormalizeAccountAddress(accounts[0]);
	          if (first) return first;
	        }
	        return '';
	      }

	      function __wkIsSuiAccount(account) {
	        if (!account) return false;
	        var accountChains = Array.isArray(account.chains) ? account.chains : [];
	        if (accountChains.length > 0) {
	          for (var i = 0; i < accountChains.length; i++) {
	            if (typeof accountChains[i] === 'string' && accountChains[i].indexOf('sui:') === 0) return true;
	          }
	          return false;
	        }
	        var addr = __wkNormalizeAccountAddress(account);
	        return /^0x[0-9a-fA-F]{2,}$/.test(addr);
	      }

      function __wkFilterSuiAccounts(accounts) {
        if (!Array.isArray(accounts)) return [];
        var result = [];
        for (var i = 0; i < accounts.length; i++) {
          var account = accounts[i];
          if (!__wkIsSuiAccount(account)) continue;
          var normalizedAddress = __wkNormalizeAccountAddress(account);
          if (!normalizedAddress) { result.push(account); continue; }
          if (typeof account.address === 'string' && account.address === normalizedAddress) {
            result.push(account);
          } else {
            var copy = {};
            for (var k in account) copy[k] = account[k];
            copy.address = normalizedAddress;
            result.push(copy);
          }
        }
        return result;
      }

	      function __wkExtractConnectedAccounts(connectResult, wallet) {
	        var accounts = [];
	        if (Array.isArray(connectResult)) {
	          accounts = connectResult;
	        } else if (connectResult) {
	          accounts = __wkSafeGetAccounts(connectResult);
	        }
	        if (accounts.length === 0) {
	          accounts = __wkSafeGetAccounts(wallet);
	        }
	        return __wkFilterSuiAccounts(accounts);
	      }

	      function __wkIsPhantomAuthError(err) {
	        if (!err) return false;
	        var message = '';
	        if (typeof err === 'string') message = err;
	        else if (err && typeof err.message === 'string') message = err.message;
	        message = String(message || '').toLowerCase();
	        if (!message) return false;
	        return (
	          message.indexOf('not been authorized') !== -1
	          || message.indexOf('not authorized') !== -1
	          || message.indexOf('unauthorized') !== -1
	          || message.indexOf('user rejected') !== -1
	          || message.indexOf('user denied') !== -1
	          || message.indexOf('something went wrong') !== -1
	        );
	      }

	      function __wkIsSuiCapableWallet(wallet) {
	        if (!wallet) return false;
	        var features = wallet.features || {};
	        var hasSuiChain = Array.isArray(wallet.chains) && wallet.chains.some(function(c) {
	          return typeof c === 'string' && c.indexOf('sui:') === 0;
	        });
	        var hasConnect = !!(features['standard:connect'] || wallet.connect || wallet.requestAccounts || wallet.requestAccount);
	        var featureKeys = Object.keys(features);
	        var hasSuiNamespaceFeature = false;
        for (var i = 0; i < featureKeys.length; i++) {
          if (featureKeys[i].indexOf('sui:') === 0) { hasSuiNamespaceFeature = true; break; }
        }
        var hasSuiTxMethod = !!(
          features['sui:signAndExecuteTransactionBlock'] ||
          features['sui:signAndExecuteTransaction'] ||
          wallet.signAndExecuteTransactionBlock ||
          wallet.signAndExecuteTransaction
        );
        return hasConnect && (hasSuiChain || hasSuiNamespaceFeature || hasSuiTxMethod);
      }

      var __wkWalletsApi = null;
      try { if (typeof getWallets === 'function') __wkWalletsApi = getWallets(); } catch (e) {}

      var __wkWindowWallets = [
        { check: function() { return window.sui; }, name: 'Sui Wallet', icon: ${JSON.stringify(SUI_WALLET_ICON)} },
        { check: function() { return window.phantom && window.phantom.sui; }, name: 'Phantom', icon: ${JSON.stringify(PHANTOM_ICON)} },
        { check: function() { return window.suiWallet; }, name: 'Sui Wallet', icon: ${JSON.stringify(SUI_WALLET_ICON)} },
        { check: function() { return (window.mystenWallet && (window.mystenWallet.sui || window.mystenWallet)) || null; }, name: 'Sui Wallet', icon: ${JSON.stringify(SUI_WALLET_ICON)} },
        { check: function() { return window.slush || null; }, name: 'Slush', icon: 'https://slush.app/favicon.ico' },
        { check: function() { return window.suiet || null; }, name: 'Suiet', icon: 'https://suiet.app/favicon.ico' },
        { check: function() { return window.martian && window.martian.sui; }, name: 'Martian', icon: 'https://martianwallet.xyz/favicon.ico' },
        { check: function() { return window.ethos || null; }, name: 'Ethos', icon: 'https://ethoswallet.xyz/favicon.ico' },
        { check: function() { return window.okxwallet && window.okxwallet.sui; }, name: 'OKX Wallet', icon: 'https://static.okx.com/cdn/assets/imgs/226/EB771A4D4E5CC234.png' }
      ];

      function getSuiWallets() {
        var wallets = [];
        var seenNames = {};

        if (__wkWalletsApi) {
          try {
            var standardWallets = __wkWalletsApi.get();
            for (var i = 0; i < standardWallets.length; i++) {
              var sw = standardWallets[i];
              if (__wkIsSuiCapableWallet(sw)) {
                wallets.push(sw);
                seenNames[sw.name] = true;
              }
            }
          } catch (e) {}
        }

        var injected = Array.isArray(window.__sui_wallets__) ? window.__sui_wallets__ : [];
        for (var j = 0; j < injected.length; j++) {
          var iw = injected[j];
          if (!iw || !__wkIsSuiCapableWallet(iw)) continue;
          var iwName = iw.name || 'Sui Wallet';
          if (seenNames[iwName]) continue;
          wallets.push(iw);
          seenNames[iwName] = true;
        }

        for (var k = 0; k < __wkWindowWallets.length; k++) {
          var wc = __wkWindowWallets[k];
          if (seenNames[wc.name]) continue;
          try {
            var w = wc.check();
            if (w && typeof w === 'object') {
              if (!__wkIsSuiCapableWallet(w)) continue;
              wallets.push({
                name: wc.name,
                icon: w.icon || wc.icon,
	                chains: ['sui:mainnet', 'sui:testnet'],
	                features: w.features || {
	                  'standard:connect': w.connect
	                    ? { connect: w.connect.bind(w) }
	                    : (w.requestAccounts
	                        ? { connect: w.requestAccounts.bind(w) }
	                        : (w.requestAccount ? { connect: w.requestAccount.bind(w) } : undefined)),
	                  'standard:disconnect': w.disconnect ? { disconnect: w.disconnect.bind(w) } : undefined,
	                  'sui:signAndExecuteTransaction': w.signAndExecuteTransaction
	                    ? { signAndExecuteTransaction: w.signAndExecuteTransaction.bind(w) } : undefined,
                  'sui:signAndExecuteTransactionBlock': w.signAndExecuteTransactionBlock
                    ? { signAndExecuteTransactionBlock: w.signAndExecuteTransactionBlock.bind(w) } : undefined,
                  'sui:signTransaction': w.signTransaction
                    ? { signTransaction: w.signTransaction.bind(w) } : undefined
                },
                get accounts() { 
                  var self = this;
                  if (!self) return [];
                  var raw = self._raw;
                  return __wkSafeGetAccounts(raw || self); 
                },
                _raw: w
              });
              seenNames[wc.name] = true;
            }
          } catch (e) {}
        }

        return wallets;
      }

      function __wkIsMobileDevice() {
        try {
          var ua = navigator.userAgent || '';
          var uaDataMobile = navigator.userAgentData && navigator.userAgentData.mobile === true;
          var uaMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
          var touchLike = navigator.maxTouchPoints > 1;
          var smallViewport = Math.min(window.innerWidth || 0, window.innerHeight || 0) <= 900;
          return Boolean(uaDataMobile || uaMobile || (touchLike && smallViewport));
        } catch (e) {
          return false;
        }
      }

      function __wkIsInAppBrowser() {
        var ua = navigator.userAgent || '';
        return /Phantom/i.test(ua) || /Slush/i.test(ua);
      }

      function __wkPollAccounts(getAccountsFn, maxAttempts, intervalMs) {
        return new Promise(function(resolve) {
          var attempt = 0;
          function check() {
            var accounts = getAccountsFn();
            if (accounts.length > 0) { resolve(accounts); return; }
            attempt++;
            if (attempt >= maxAttempts) { resolve([]); return; }
            setTimeout(check, intervalMs);
          }
          check();
        });
      }

      function detectWallets() {
        var immediate = getSuiWallets();
        if (immediate.length > 0) {
          $wallets.set(immediate);
        }

        return new Promise(function(resolve) {
          if (immediate.length > 0) {
            var bgCheck = function() {
              setTimeout(function() {
                var updated = getSuiWallets();
                if (updated.length > immediate.length) $wallets.set(updated);
              }, 1000);
            };
            bgCheck();
            resolve(immediate);
            return;
          }

          var resolved = false;
          var attempts = 0;
          var maxAttempts = 15;

          function finish(wallets) {
            if (resolved) return;
            resolved = true;
            $wallets.set(wallets);
            resolve(wallets);
          }

          if (__wkWalletsApi && __wkWalletsApi.on) {
            __wkWalletsApi.on('register', function() {
              if (resolved) return;
              var wallets = getSuiWallets();
              if (wallets.length > 0) finish(wallets);
            });
          }

          function poll() {
            if (resolved) return;
            var wallets = getSuiWallets();
            if (wallets.length > 0) { finish(wallets); return; }
            attempts++;
            if (attempts >= maxAttempts) { finish([]); return; }
            var delay = attempts <= 1 ? 100 : attempts <= 2 ? 500 : 200;
            setTimeout(poll, delay);
          }
          poll();
        });
      }

	      function connect(wallet) {
	        if (!wallet) return Promise.reject(new Error('No wallet selected'));
        $connection.set({
          wallet: null, account: null, address: null,
          status: 'connecting', primaryName: null
        });

        return new Promise(function(resolve, reject) {
          (async function() {
            try {
              var phantomProvider = (window.phantom && window.phantom.sui) || window.sui;
              var isPhantom = phantomProvider && (wallet.name === 'Phantom' || wallet._raw === phantomProvider || phantomProvider.isPhantom);

	              if (isPhantom) {
	                var existing = __wkFilterSuiAccounts(
	                  __wkSafeGetAccounts(phantomProvider).concat(__wkSafeGetAccounts(wallet))
	                );
	                if (existing.length > 0) {
	                  __wkFinishConnect(wallet, existing);
	                  resolve(existing[0]); return;
	                }
	                var phantomLastError = null;

	                var phantomConnectFeature = wallet.features && wallet.features['standard:connect'];
	                if (phantomConnectFeature) {
	                  try {
	                    var standardConnectResult;
	                    if (typeof phantomConnectFeature === 'function') {
	                      standardConnectResult = await phantomConnectFeature();
	                    } else if (typeof phantomConnectFeature.connect === 'function') {
	                      standardConnectResult = await phantomConnectFeature.connect();
	                    }
	                    var standardConnectAccounts = __wkExtractConnectedAccounts(standardConnectResult, wallet);
	                    if (standardConnectAccounts.length > 0) {
	                      __wkFinishConnect(wallet, standardConnectAccounts);
	                      resolve(standardConnectAccounts[0]); return;
	                    }
	                    var standardConnectAddress = __wkExtractPhantomAddress(standardConnectResult);
	                    var standardConnectAccount = __wkBuildPhantomAccount(standardConnectAddress);
	                    if (standardConnectAccount) {
	                      __wkFinishConnect(wallet, [standardConnectAccount]);
	                      resolve(standardConnectAccount); return;
	                    }
	                  } catch (err) {
	                    phantomLastError = err;
	                  }
	                }

	                if (typeof phantomProvider.requestAccounts === 'function') {
	                  try {
	                    var requestAccountsResult = await phantomProvider.requestAccounts();
	                    var requestAccountsList = __wkExtractConnectedAccounts(requestAccountsResult, wallet);
	                    if (requestAccountsList.length > 0) {
	                      __wkFinishConnect(wallet, requestAccountsList);
	                      resolve(requestAccountsList[0]); return;
	                    }
	                    var requestAccountsAddress = __wkExtractPhantomAddress(requestAccountsResult);
	                    var requestAccountsAccount = __wkBuildPhantomAccount(requestAccountsAddress);
	                    if (requestAccountsAccount) {
	                      __wkFinishConnect(wallet, [requestAccountsAccount]);
	                      resolve(requestAccountsAccount); return;
	                    }
	                  } catch (err) {
	                    phantomLastError = err;
	                  }
	                }

	                if (typeof phantomProvider.requestAccount === 'function') {
	                  try {
	                    var requestResult = await phantomProvider.requestAccount();
	                    var requestAccounts = __wkExtractConnectedAccounts(requestResult, wallet);
	                    if (requestAccounts.length > 0) {
	                      __wkFinishConnect(wallet, requestAccounts);
	                      resolve(requestAccounts[0]); return;
	                    }
	                    var requestAddress = __wkExtractPhantomAddress(requestResult);
	                    var requestAccount = __wkBuildPhantomAccount(requestAddress);
	                    if (requestAccount) {
	                      __wkFinishConnect(wallet, [requestAccount]);
	                      resolve(requestAccount); return;
	                    }
	                  } catch (err) {
	                    phantomLastError = err;
	                  }
	                }

	                if (typeof phantomProvider.connect === 'function') {
	                  var connectVariants = [
	                    null,
	                    { onlyIfTrusted: false },
	                  ];
	                  for (var cv = 0; cv < connectVariants.length; cv++) {
	                    try {
	                      var connectVariant = connectVariants[cv];
	                      var connectResponse = connectVariant === null
	                        ? await phantomProvider.connect()
	                        : await phantomProvider.connect(connectVariant);
	                      var connectAccounts = __wkExtractConnectedAccounts(connectResponse, wallet);
	                      if (connectAccounts.length > 0) {
	                        __wkFinishConnect(wallet, connectAccounts);
	                        resolve(connectAccounts[0]); return;
	                      }
	                      var connectAddress = __wkExtractPhantomAddress(connectResponse);
	                      var connectAccount = __wkBuildPhantomAccount(connectAddress);
	                      if (connectAccount) {
	                        __wkFinishConnect(wallet, [connectAccount]);
	                        resolve(connectAccount); return;
	                      }
	                    } catch (err) {
	                      phantomLastError = err;
	                    }
	                  }
	                }

	                if (typeof phantomProvider.getAccounts === 'function') {
	                  try {
	                    var fetchedAccounts = await phantomProvider.getAccounts();
	                    var filteredFetched = __wkFilterSuiAccounts(fetchedAccounts);
	                    if (filteredFetched.length > 0) {
	                      __wkFinishConnect(wallet, filteredFetched);
	                      resolve(filteredFetched[0]); return;
	                    }
	                  } catch (err) {
	                    phantomLastError = err;
	                  }
	                }

	                var directAddress = __wkExtractPhantomAddress(phantomProvider);
	                var directAccount = __wkBuildPhantomAccount(directAddress);
	                if (directAccount) {
	                  __wkFinishConnect(wallet, [directAccount]);
	                  resolve(directAccount); return;
	                }

	                if (
	                  (phantomProvider && typeof phantomProvider.connect === 'function')
	                  || (phantomProvider && typeof phantomProvider.requestAccounts === 'function')
	                  || (phantomProvider && typeof phantomProvider.requestAccount === 'function')
	                ) {
	                  var polled = await __wkPollAccounts(
	                    function() { return __wkFilterSuiAccounts(__wkSafeGetAccounts(phantomProvider).concat(__wkSafeGetAccounts(wallet))); },
	                    10, 150
                  );
                  if (polled.length > 0) {
	                    __wkFinishConnect(wallet, polled);
	                    resolve(polled[0]); return;
	                  }
	                }
	                if (phantomLastError) {
	                  if (__wkIsPhantomAuthError(phantomLastError)) {
	                    throw new Error('Phantom blocked Sui account authorization for this site. In Phantom, approve this site for Sui accounts and retry.');
	                  }
	                  if (phantomLastError.message) {
	                    throw new Error(phantomLastError.message);
	                  }
	                }
	                throw new Error('Phantom connected, but no Sui address was returned. In Phantom, enable Sui and approve this site for Sui, then retry.');
	              }

	              var preExisting = __wkFilterSuiAccounts(__wkSafeGetAccounts(wallet));
	              if (preExisting.length > 0) {
	                __wkFinishConnect(wallet, preExisting);
	                resolve(preExisting[0]); return;
	              }

	              var connectFeature = (wallet.features && wallet.features['standard:connect']) || (wallet._raw && wallet._raw.connect);
	              if (!connectFeature && wallet._raw && typeof wallet._raw.requestAccounts === 'function') {
	                connectFeature = { connect: wallet._raw.requestAccounts.bind(wallet._raw) };
	              }
	              if (!connectFeature && wallet._raw && typeof wallet._raw.requestAccount === 'function') {
	                connectFeature = { connect: wallet._raw.requestAccount.bind(wallet._raw) };
	              }
	              if (!connectFeature) throw new Error('Wallet does not support connection');

              var connectResult;
              if (typeof connectFeature === 'function') {
                connectResult = await connectFeature();
              } else if (typeof connectFeature.connect === 'function') {
                connectResult = await connectFeature.connect();
              }

              var accounts = __wkExtractConnectedAccounts(connectResult, wallet);

              if (!accounts || accounts.length === 0) {
                await new Promise(function(r) { setTimeout(r, 200); });
                accounts = __wkExtractConnectedAccounts(null, wallet);
              }

              if (!accounts || accounts.length === 0) {
                throw new Error('No Sui accounts. Switch your wallet to Sui and try again.');
              }

              __wkFinishConnect(wallet, accounts);
              resolve(accounts[0]);
            } catch (e) {
              try {
                var fallbackAccounts = __wkFilterSuiAccounts(
                  __wkSafeGetAccounts(wallet).concat(__wkSafeGetAccounts(wallet && wallet._raw))
                );
                if (fallbackAccounts.length > 0) {
                  __wkFinishConnect(wallet, fallbackAccounts);
                  resolve(fallbackAccounts[0]); return;
                }
              } catch (e3) {}
              var phantomFallback = (window.phantom && window.phantom.sui) || window.sui;
	              if (phantomFallback) {
	                try {
	                  var recovered = await __wkPollAccounts(
	                    function() { return __wkFilterSuiAccounts(__wkSafeGetAccounts(phantomFallback).concat(__wkSafeGetAccounts(wallet))); },
	                    8, 200
	                  );
                  if (recovered.length > 0) {
                    __wkFinishConnect(wallet, recovered);
                    resolve(recovered[0]); return;
                  }
                } catch (e2) {}
              }
              $connection.set({
                wallet: null, account: null, address: null,
                status: 'disconnected', primaryName: null
              });
              reject(e);
            }
          })();
        });
      }

      function __wkSignPersonalMessage(wallet, account, message) {
        var feature = wallet.features && wallet.features['sui:signPersonalMessage'];
        if (feature && feature.signPersonalMessage) {
          return feature.signPersonalMessage({ account: account, message: message });
        }
        var raw = wallet._raw;
        if (raw && typeof raw.signPersonalMessage === 'function') {
          return raw.signPersonalMessage({ message: message });
        }
        if (raw && raw.signMessage && typeof raw.signMessage === 'function') {
          return raw.signMessage({ message: message });
        }
        return Promise.reject(new Error('Wallet does not support message signing'));
      }

      var __sessionReady = null;

      function __wkIsSubdomain() {
        var host = window.location.hostname;
        return host !== 'sui.ski' && host.endsWith('.sui.ski');
      }

      var __skiSignFrame = null;
      var __skiSignReady = null;

      function __wkInitSignBridge() {
        if (__skiSignFrame) return;
        var frame = document.createElement('iframe');
        frame.src = 'https://sui.ski/sign';
        frame.style.cssText = 'display:none;width:0;height:0;border:none';
        frame.id = 'ski-sign-bridge';
        document.body.appendChild(frame);
        __skiSignFrame = frame;
        __skiSignReady = new Promise(function(resolve) {
          var resolved = false;
          window.addEventListener('message', function handler(e) {
            if (e.origin === 'https://sui.ski' && e.data && e.data.type === 'ski:ready') {
              window.removeEventListener('message', handler);
              resolved = true;
              resolve(true);
            }
          });
          setTimeout(function() { if (!resolved) resolve(false); }, 10000);
        });
      }

      function __wkFinishConnect(wallet, accounts) {
        var account = accounts[0];
        var address = account.address;
        $connection.set({
          wallet: wallet,
          account: account,
          address: address,
          status: 'connected',
          primaryName: null
        });
        var existingSession = typeof getWalletSession === 'function' ? getWalletSession() : null;
        var hasSessionCookie = document.cookie.indexOf('session_id=') !== -1;
        if (existingSession && existingSession.address === address && hasSessionCookie) {
          __sessionReady = Promise.resolve(true);
          return;
        }
        if (typeof challengeAndConnect === 'function') {
          __sessionReady = challengeAndConnect(wallet.name, address, function(messageBytes) {
            return __wkSignPersonalMessage(wallet, account, messageBytes);
          });
        } else if (typeof connectWalletSession === 'function') {
          connectWalletSession(wallet.name, address);
          __sessionReady = Promise.resolve(true);
        } else {
          __sessionReady = Promise.resolve(true);
        }
      }

      function initFromSession(address, walletName) {
        if (!address) return;
        $connection.set({
          wallet: null,
          account: null,
          address: address,
          status: 'session',
          primaryName: null
        });
      }

      function disconnect() {
        var conn = $connection.value;
        if (conn.wallet) {
          var disconnectFeature = conn.wallet.features && conn.wallet.features['standard:disconnect'];
          if (disconnectFeature && disconnectFeature.disconnect) {
            try { disconnectFeature.disconnect(); } catch (e) {}
          }
        }
        $connection.set({
          wallet: null, account: null, address: null,
          status: 'disconnected', primaryName: null
        });
        if (typeof disconnectWalletSession === 'function') {
          disconnectWalletSession();
        }
      }

      function autoReconnect() {
        if (!__wkAutoConnect) return Promise.resolve(false);
        return new Promise(function(resolve) {
          (async function() {
            try {
              var session = typeof getWalletSession === 'function' ? getWalletSession() : null;
              if (!session || !session.walletName) { resolve(false); return; }

              if (__wkIsSubdomain() && session.address) {
                initFromSession(session.address, session.walletName);
                __wkInitSignBridge();
                resolve(true);
                return;
              }

              await new Promise(function(r) { setTimeout(r, 300); });

              var wallets = getSuiWallets();
              var match = null;
              for (var i = 0; i < wallets.length; i++) {
                if (wallets[i].name === session.walletName) { match = wallets[i]; break; }
              }
              if (!match) {
                if (__wkIsInAppBrowser()) {
                  for (var attempt = 0; attempt < 5; attempt++) {
                    await new Promise(function(r) { setTimeout(r, 300); });
                    wallets = getSuiWallets();
                    for (var j = 0; j < wallets.length; j++) {
                      if (wallets[j].name === session.walletName) { match = wallets[j]; break; }
                    }
                    if (match) break;
                  }
                }
                if (!match) {
                  if (session.address) {
                    initFromSession(session.address, session.walletName);
                    resolve(true);
                  } else {
                    resolve(false);
                  }
                  return;
                }
              }

              await connect(match);
              resolve(true);
            } catch (e) {
              resolve(false);
            }
          })();
        });
      }

      function setPrimaryName(name) {
        var current = $connection.value;
        if (current.status !== 'connected' && current.status !== 'session') return;
        $connection.set({
          wallet: current.wallet,
          account: current.account,
          address: current.address,
          status: current.status,
          primaryName: name
        });
      }

      function signPersonalMessage(message) {
        var conn = $connection.value;
        if (!conn || !conn.wallet) return Promise.reject(new Error('No wallet connected'));
        return __wkSignPersonalMessage(conn.wallet, conn.account, message);
      }

      return {
        __config: { network: __wkNetwork },
        $wallets: $wallets,
        $connection: $connection,
        subscribe: subscribe,
        getSuiWallets: getSuiWallets,
        detectWallets: detectWallets,
        connect: connect,
        disconnect: disconnect,
        autoReconnect: autoReconnect,
        setPrimaryName: setPrimaryName,
        signPersonalMessage: signPersonalMessage,
        initFromSession: initFromSession,
        get __sessionReady() { return __sessionReady; },
        get __skiSignFrame() { return __skiSignFrame; },
        get __skiSignReady() { return __skiSignReady; },
        __isMobileDevice: __wkIsMobileDevice,
        __isInAppBrowser: __wkIsInAppBrowser,
        __filterSuiAccounts: __wkFilterSuiAccounts,
        __normalizeAccountAddress: __wkNormalizeAccountAddress
      };
    })();
  `
}
