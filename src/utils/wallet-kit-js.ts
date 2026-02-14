export interface WalletKitConfig {
	network: string
	features?: string[]
	autoConnect?: boolean
}

const PHANTOM_ICON =
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNTM0QkI1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNTUxQkY5Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEyOCIgaGVpZ2h0PSIxMjgiIGZpbGw9InVybCgjYSkiIHJ4PSIyNCIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMTAuNCw2NC4xYy0uMy0xNS44LTEyLjQtMjguMi0yNy4zLTI4LjVIMjcuNmMtMy4yLDAtNS44LDIuNi01LjgsNS44djg1LjRjMCwxLjQuNCwyLjguNiw0LjIuMi40LjQsLjguNSwxLjNsMCwwYy4xLjMuMi43LjQsMS4xLjIuNS41LDEsLjgsMS41LjMuNi43LDEuMSwxLjEsMS43bDAsMGMuNS43LDEuMSwxLjMsMS43LDEuOWwwLDBjLjcuNywxLjUsMS4zLDIuMywxLjhsLjEuMWMuOC41LDEuNiwuOSwyLjUsMS4yLjMuMS42LjIuOS4zaDBoMC4xYy42LjIsMS4yLjMsMS44LjRoMGMuMSwwLC4yLDAsLjMsMCwuNS4xLDEuMS4xLDEuNi4xaDYxLjljMy4yLDAsNS44LTIuNiw1LjgtNS44VjY0LjFoMFoiLz48L3N2Zz4='

const SUI_WALLET_ICON =
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiM2RkJDRjAiIHJ4PSI4Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTI4LjYsMTUuM2MtLjktMy4yLTQuNi01LjUtOS4yLTUuNXMtOC4zLDIuMy05LjIsNS41Yy0uMi44LS4zLDEuNi0uMywyLjRzLjEsMS43LjMsMi41Yy45LDMuMiw0LjYsNS41LDkuMiw1LjVzOC4zLTIuMyw5LjItNS41Yy4yLS44LjMtMS42LjMtMi41cy0uMS0xLjYtLjMtMi40WiIvPjxwYXRoIGZpbGw9IiM2RkJDRjAiIGQ9Ik0xOS40LDE0LjVjLTIuNCwwLTQuMywxLjQtNC4zLDMuMXMxLjksMy4xLDQuMywzLjEsNC4zLTEuNCw0LjMtMy4xLTEuOS0zLjEtNC4zLTMuMVoiLz48L3N2Zz4='

const PASSKEY_ICON =
	'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjMTExODI3Ii8+PHBhdGggZmlsbD0iIzYwQTVGQSIgZD0iTTI0IDE3YTYgNiAwIDEgMC04IDUuNjZWMjdoM3YtNGg0djRoM3YtNmgtNS4xQTMuOTkgMy45OSAwIDAgMSAyNCAxN1ptLTYtMmEyIDIgMCAxIDEgMCA0IDIgMiAwIDAgMSAwLTRaIi8+PC9zdmc+'

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
      var __wkWalletEventsUnsub = null;

      function subscribe(store, fn) {
        return store.subscribe(fn);
      }

      function __wkDetachWalletEvents() {
        if (typeof __wkWalletEventsUnsub === 'function') {
          try { __wkWalletEventsUnsub(); } catch (_e) {}
        }
        __wkWalletEventsUnsub = null;
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
          if (normalizedAddress && account && typeof account === 'object') {
            if (typeof account.address !== 'string' || account.address !== normalizedAddress) {
              try { account.address = normalizedAddress; } catch (e) {}
            }
          }
          result.push(account);
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

	      function __wkIsUserRejection(err) {
	        if (!err) return false;
	        if (err.code === 4001) return true;
	        var message = '';
	        if (typeof err === 'string') message = err;
	        else if (err && typeof err.message === 'string') message = err.message;
	        message = String(message || '').toLowerCase();
	        if (!message) return false;
	        return (
	          message.indexOf('user rejected') !== -1
	          || message.indexOf('user denied') !== -1
	          || message.indexOf('user cancelled') !== -1
	          || message.indexOf('user canceled') !== -1
	          || message.indexOf('rejected by user') !== -1
	          || message.indexOf('request rejected') !== -1
	        );
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

      function __wkInitWalletsApi() {
        if (__wkWalletsApi) return __wkWalletsApi;
        try {
          if (typeof getWallets === 'function') __wkWalletsApi = getWallets();
        } catch (e) {}
        return __wkWalletsApi;
      }

	      var __wkWaaPLoading = null;
	      function __wkPrepareWaaPIframe(useStaging) {
	        return new Promise(function(resolve) {
	          var origin = useStaging ? 'https://staging.waap.xyz' : 'https://waap.xyz';
	          var targetSrc = origin + '/iframe';
	          var containerId = 'waap-wallet-iframe-container';
	          var wrapperId = 'waap-wallet-iframe-wrapper';
	          var iframeId = 'waap-wallet-iframe';
	          var container = document.getElementById(containerId);
	          if (!container) {
	            container = document.createElement('div');
	            container.id = containerId;
	            container.style.position = 'fixed';
	            container.style.top = '0';
	            container.style.left = '0';
	            container.style.right = '0';
	            container.style.bottom = '0';
	            container.style.width = '100%';
	            container.style.height = '100%';
	            container.style.display = 'none';
	            container.style.alignItems = 'center';
	            container.style.justifyContent = 'center';
	            container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
	            container.style.zIndex = '9999999999';
	            document.body.appendChild(container);
	          }

	          var wrapper = document.getElementById(wrapperId);
	          if (!wrapper) {
	            wrapper = document.createElement('div');
	            wrapper.id = wrapperId;
	            wrapper.style.position = 'relative';
	            wrapper.style.display = 'flex';
	            wrapper.style.alignItems = 'center';
	            wrapper.style.justifyContent = 'center';
	            wrapper.style.padding = '0';
	            wrapper.style.margin = '0';
	            wrapper.style.height = '600px';
	            wrapper.style.width = '380px';
	            container.appendChild(wrapper);
	          } else if (wrapper.parentNode !== container) {
	            container.appendChild(wrapper);
	          }

	          var frame = document.getElementById(iframeId);
	          if (!frame) {
	            frame = document.createElement('iframe');
	            frame.id = iframeId;
	            frame.style.width = '100%';
	            frame.style.height = '100%';
	            frame.style.border = 'none';
	            frame.style.borderRadius = '24px';
	            frame.style.backgroundColor = 'transparent';
	            frame.style.background = 'transparent';
	            frame.style.padding = '0';
	            frame.style.margin = '0';
	            wrapper.appendChild(frame);
	          } else if (frame.parentNode !== wrapper) {
	            wrapper.appendChild(frame);
	          }

	          var done = false;
	          var timer = null;
	          var onLoad = function() {
	            if (done) return;
	            done = true;
	            if (timer) clearTimeout(timer);
	            resolve(true);
	          };

	          frame.addEventListener('load', onLoad, { once: true });
	          timer = setTimeout(function() {
	            if (done) return;
	            done = true;
	            resolve(false);
	          }, 2000);

	          if (frame.getAttribute('src') !== targetSrc) {
	            frame.setAttribute('src', targetSrc);
	          } else {
	            frame.setAttribute('src', targetSrc);
	          }
	        });
	      }
	      function __wkInitWaaP() {
	        if (__wkWaaPLoading) return __wkWaaPLoading;
	        __wkWaaPLoading = import('https://esm.sh/@human.tech/waap-sdk@1.2.0').then(async function(mod) {
	          if (typeof mod.initWaaPSui !== 'function') return;
	          var useStaging = false;
	          var config = {
	            authenticationMethods: ['email', 'phone', 'social'],
	            allowedSocials: ['google', 'twitter', 'discord', 'apple', 'coinbase'],
	            styles: { darkMode: true },
	          };
	          var iframeReady = false;
	          try {
	            iframeReady = await __wkPrepareWaaPIframe(useStaging);
	          } catch (_e) {
	            iframeReady = false;
	          }
	          var options = { useStaging: useStaging };
	          if (iframeReady) options.config = config;
	          var wallet = mod.initWaaPSui(options);
	          __wkInitWalletsApi();
	          if (__wkWalletsApi && typeof __wkWalletsApi.register === 'function') {
	            __wkWalletsApi.register(wallet);
          } else if (typeof registerWallet === 'function') {
            registerWallet(wallet);
          } else {
            try {
              var stdMod = window.__suiWalletStandard;
              if (stdMod && typeof stdMod.registerWallet === 'function') {
                stdMod.registerWallet(wallet);
              }
            } catch (e) {}
          }
        }).catch(function(e) {
          console.log('WaaP SDK load skipped:', e.message);
        });
        window.__wkWaaPLoading = __wkWaaPLoading;
        return __wkWaaPLoading;
      }

      var __wkPasskeySdk = null;
      var __wkPasskeyStorageKey = 'sui_ski_passkey_public_key_b64_v1';
      var __wkPasskeyWalletName = 'Passkey Wallet';
      var __wkPasskeyRuntime = {
        provider: null,
        keypair: null,
        client: null,
        account: null
      };

      function __wkHasPasskeySupport() {
        try {
          return typeof window.PublicKeyCredential !== 'undefined'
            && !!navigator.credentials
            && typeof navigator.credentials.get === 'function'
            && typeof navigator.credentials.create === 'function';
        } catch (e) {
          return false;
        }
      }

      function __wkGetRpcUrlForNetwork() {
        if (__wkNetwork === 'testnet') return 'https://fullnode.testnet.sui.io:443';
        if (__wkNetwork === 'devnet') return 'https://fullnode.devnet.sui.io:443';
        return 'https://fullnode.mainnet.sui.io:443';
      }

      function __wkGetPasskeyRpId() {
        var host = window.location && window.location.hostname ? String(window.location.hostname) : '';
        if (!host) return 'sui.ski';
        if (host === 'sui.ski' || host.endsWith('.sui.ski')) return 'sui.ski';
        return host;
      }

      function __wkBytesToB64(bytes) {
        if (!bytes || typeof bytes.length !== 'number') return '';
        var CHUNK = 8192;
        var parts = [];
        for (var i = 0; i < bytes.length; i += CHUNK) {
          parts.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length))));
        }
        return btoa(parts.join(''));
      }

      function __wkB64ToBytes(value) {
        if (!value || typeof value !== 'string') return null;
        var raw = atob(value);
        var out = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
        return out;
      }

      var __wkPasskeyCookieName = 'passkey_pk';

      function __wkSetPasskeyCookie(b64Value) {
        var domain = '';
        try {
          var host = window.location.hostname;
          if (host === 'sui.ski' || host.endsWith('.sui.ski')) domain = '; domain=.sui.ski';
        } catch (_e) {}
        document.cookie = __wkPasskeyCookieName + '=' + encodeURIComponent(b64Value) + domain + '; path=/; max-age=31536000; secure; samesite=lax';
      }

      function __wkGetPasskeyCookie() {
        try {
          var cookies = document.cookie.split('; ');
          for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].indexOf(__wkPasskeyCookieName + '=') === 0) {
              return decodeURIComponent(cookies[i].slice(__wkPasskeyCookieName.length + 1));
            }
          }
          return '';
        } catch (_e) { return ''; }
      }

      function __wkClearPasskeyCookie() {
        var domain = '';
        try {
          var host = window.location.hostname;
          if (host === 'sui.ski' || host.endsWith('.sui.ski')) domain = '; domain=.sui.ski';
        } catch (_e) {}
        document.cookie = __wkPasskeyCookieName + '=' + domain + '; path=/; max-age=0; secure; samesite=lax';
      }

      function __wkCreatePasskeyAccount(address, publicKey) {
        return {
          address: address,
          publicKey: publicKey,
          chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet']
        };
      }

      function __wkClearPasskeyRuntime() {
        __wkPasskeyRuntime.provider = null;
        __wkPasskeyRuntime.keypair = null;
        __wkPasskeyRuntime.client = null;
        __wkPasskeyRuntime.account = null;
        try { localStorage.removeItem(__wkPasskeyStorageKey); } catch (_e) {}
        __wkClearPasskeyCookie();
      }

      async function __wkLoadPasskeySdk() {
        if (__wkPasskeySdk) return __wkPasskeySdk;
        var passkeyModule = await import('https://esm.sh/@mysten/sui@2.2.0/keypairs/passkey?bundle');
        var clientModule = await import('https://esm.sh/@mysten/sui@2.2.0/client?bundle');
        var PasskeyKeypair = passkeyModule && passkeyModule.PasskeyKeypair;
        var BrowserPasskeyProvider = passkeyModule && passkeyModule.BrowserPasskeyProvider;
        var SuiClient = clientModule && (clientModule.SuiClient || clientModule.SuiJsonRpcClient);
        if (!PasskeyKeypair || !BrowserPasskeyProvider || !SuiClient) {
          throw new Error('Passkey SDK unavailable in this browser');
        }
        __wkPasskeySdk = {
          PasskeyKeypair: PasskeyKeypair,
          BrowserPasskeyProvider: BrowserPasskeyProvider,
          SuiClient: SuiClient
        };
        return __wkPasskeySdk;
      }

      function __wkSetPasskeyKeypair(keypair, provider) {
        var publicKey = keypair && typeof keypair.getPublicKey === 'function' ? keypair.getPublicKey() : null;
        var address = publicKey && typeof publicKey.toSuiAddress === 'function' ? publicKey.toSuiAddress() : '';
        if (!address && keypair && typeof keypair.toSuiAddress === 'function') {
          address = keypair.toSuiAddress();
        }
        if (!address) throw new Error('Failed to derive passkey wallet address');
        var account = __wkCreatePasskeyAccount(address, publicKey || null);
        __wkPasskeyRuntime.provider = provider;
        __wkPasskeyRuntime.keypair = keypair;
        __wkPasskeyRuntime.account = account;
        if (!__wkPasskeyRuntime.client) {
          __wkPasskeyRuntime.client = new __wkPasskeySdk.SuiClient({ url: __wkGetRpcUrlForNetwork() });
        }
        if (publicKey && typeof publicKey.toRawBytes === 'function') {
          try {
            var rawBytes = publicKey.toRawBytes();
            if (rawBytes && rawBytes.length > 0) {
              var b64Pk = __wkBytesToB64(rawBytes);
              localStorage.setItem(__wkPasskeyStorageKey, b64Pk);
              __wkSetPasskeyCookie(b64Pk);
            }
          } catch (e) {}
        }
        return account;
      }

      async function __wkConnectPasskeyWallet() {
        if (!__wkHasPasskeySupport()) {
          throw new Error('Passkeys are not supported in this browser');
        }
        var sdk = await __wkLoadPasskeySdk();
        var provider = new sdk.BrowserPasskeyProvider('sui.ski', {
          rp: {
            id: __wkGetPasskeyRpId(),
            name: 'sui.ski'
          },
          timeout: 120000,
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            residentKey: 'required',
            requireResidentKey: true,
            userVerification: 'required'
          }
        });

        var storedPk = '';
        try { storedPk = localStorage.getItem(__wkPasskeyStorageKey) || ''; } catch (_e) {}
        if (!storedPk) storedPk = __wkGetPasskeyCookie();
        if (storedPk) {
          try {
            var restored = new sdk.PasskeyKeypair(__wkB64ToBytes(storedPk), provider);
            var restoredAccount = __wkSetPasskeyKeypair(restored, provider);
            return { accounts: [restoredAccount] };
          } catch (_e) {
            try { localStorage.removeItem(__wkPasskeyStorageKey); } catch (_ignore) {}
            __wkClearPasskeyCookie();
            __wkClearPasskeyRuntime();
          }
        }

        if (!sdk.PasskeyKeypair || typeof sdk.PasskeyKeypair.getPasskeyInstance !== 'function') {
          throw new Error('Passkey wallet creation is unavailable');
        }
        var created = await sdk.PasskeyKeypair.getPasskeyInstance(provider);
        var createdAccount = __wkSetPasskeyKeypair(created, provider);
        return { accounts: [createdAccount] };
      }

      async function __wkEnsurePasskeyWallet() {
        if (__wkPasskeyRuntime.keypair && __wkPasskeyRuntime.account) return __wkPasskeyRuntime;
        await __wkConnectPasskeyWallet();
        if (__wkPasskeyRuntime.keypair && __wkPasskeyRuntime.account) return __wkPasskeyRuntime;
        throw new Error('Failed to connect passkey wallet');
      }

      async function __wkPasskeyTryCalls(calls, fallbackMessage) {
        var lastErr = null;
        for (var i = 0; i < calls.length; i++) {
          try {
            var result = await calls[i]();
            if (typeof result !== 'undefined') return result;
          } catch (err) {
            lastErr = err;
          }
        }
        if (lastErr && lastErr.message) throw new Error(lastErr.message);
        throw new Error(fallbackMessage || 'Passkey wallet operation failed');
      }

      async function __wkPasskeySignAndExecute(input) {
        var runtime = await __wkEnsurePasskeyWallet();
        var keypair = runtime.keypair;
        var client = runtime.client;
        var tx = input && (input.transaction || input.transactionBlock);
        var options = input && input.options;
        if (!tx) throw new Error('Missing transaction for passkey execution');
        return __wkPasskeyTryCalls([
          async function() {
            if (!client || typeof client.signAndExecuteTransaction !== 'function') return undefined;
            return client.signAndExecuteTransaction({ signer: keypair, transaction: tx, options: options || {} });
          },
          async function() {
            if (!client || typeof client.signAndExecuteTransactionBlock !== 'function') return undefined;
            return client.signAndExecuteTransactionBlock({ signer: keypair, transactionBlock: tx, options: options || {} });
          },
          async function() {
            if (!client || typeof client.signAndExecuteTransaction !== 'function') return undefined;
            return client.signAndExecuteTransaction({ signer: keypair, transactionBlock: tx, options: options || {} });
          },
        ], 'Passkey wallet cannot execute this transaction');
      }

      async function __wkPasskeySignTransaction(input) {
        var runtime = await __wkEnsurePasskeyWallet();
        var keypair = runtime.keypair;
        var client = runtime.client;
        var tx = input && (input.transaction || input.transactionBlock);
        if (!tx) throw new Error('Missing transaction for passkey signing');
        return __wkPasskeyTryCalls([
          async function() {
            if (!keypair || typeof keypair.signTransaction !== 'function') return undefined;
            return keypair.signTransaction(tx);
          },
          async function() {
            if (!keypair || typeof keypair.signTransactionBlock !== 'function') return undefined;
            return keypair.signTransactionBlock(tx);
          },
          async function() {
            if (!client || typeof client.signTransaction !== 'function') return undefined;
            return client.signTransaction({ signer: keypair, transaction: tx });
          },
          async function() {
            if (!client || typeof client.signTransactionBlock !== 'function') return undefined;
            return client.signTransactionBlock({ signer: keypair, transactionBlock: tx });
          },
        ], 'Passkey wallet cannot sign this transaction');
      }

      async function __wkPasskeySignPersonalMessage(input) {
        var runtime = await __wkEnsurePasskeyWallet();
        var keypair = runtime.keypair;
        var message = input && input.message ? input.message : input;
        if (!message || (typeof message.length !== 'number' && typeof message.byteLength !== 'number')) {
          throw new Error('Missing message bytes for passkey signing');
        }
        if (keypair && typeof keypair.signPersonalMessage === 'function') {
          try { return await keypair.signPersonalMessage({ message: message }); } catch (_e) {}
          return keypair.signPersonalMessage(message);
        }
        throw new Error('Passkey wallet does not support personal message signing');
      }

      function __wkCreatePasskeyWallet() {
        return {
          name: __wkPasskeyWalletName,
          icon: ${JSON.stringify(PASSKEY_ICON)},
          chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet'],
          features: {
            'standard:connect': { connect: __wkConnectPasskeyWallet },
            'standard:disconnect': { disconnect: __wkClearPasskeyRuntime },
            'sui:signAndExecuteTransaction': { signAndExecuteTransaction: __wkPasskeySignAndExecute },
            'sui:signAndExecuteTransactionBlock': { signAndExecuteTransactionBlock: __wkPasskeySignAndExecute },
            'sui:signTransaction': { signTransaction: __wkPasskeySignTransaction },
            'sui:signTransactionBlock': { signTransactionBlock: __wkPasskeySignTransaction },
            'sui:signPersonalMessage': { signPersonalMessage: __wkPasskeySignPersonalMessage }
          },
          get accounts() {
            return __wkPasskeyRuntime.account ? [__wkPasskeyRuntime.account] : [];
          },
          __isPasskey: true
        };
      }

	      var __wkWindowWallets = [
	        { check: function() { return window.phantom && window.phantom.sui; }, name: 'Phantom', icon: ${JSON.stringify(PHANTOM_ICON)} },
	        { check: function() { return (window.backpack && (window.backpack.sui || window.backpack)) || null; }, name: 'Backpack', icon: 'https://backpack.app/favicon.ico' },
	        { check: function() { return (window.slush && (window.slush.sui || window.slush.wallet || window.slush)) || null; }, name: 'Slush', icon: 'https://slush.app/favicon.ico' },
	        { check: function() { return (window.suiet && (window.suiet.sui || window.suiet.wallet || window.suiet)) || null; }, name: 'Suiet', icon: 'https://suiet.app/favicon.ico' },
	        { check: function() { return window.martian && window.martian.sui; }, name: 'Martian', icon: 'https://martianwallet.xyz/favicon.ico' },
	        { check: function() { return (window.ethos && (window.ethos.sui || window.ethos.wallet || window.ethos)) || null; }, name: 'Ethos', icon: 'https://ethoswallet.xyz/favicon.ico' },
	        { check: function() { return window.okxwallet && window.okxwallet.sui; }, name: 'OKX Wallet', icon: 'https://static.okx.com/cdn/assets/imgs/226/EB771A4D4E5CC234.png' },
	        { check: function() { return (window.mystenWallet && (window.mystenWallet.sui || window.mystenWallet)) || null; }, name: 'Sui Wallet', icon: ${JSON.stringify(SUI_WALLET_ICON)} },
	        { check: function() { return window.suiWallet; }, name: 'Sui Wallet', icon: ${JSON.stringify(SUI_WALLET_ICON)} },
	        { check: function() { return window.sui; }, name: 'Sui Wallet', icon: ${JSON.stringify(SUI_WALLET_ICON)} }
	      ];

	      function __wkUnwrapWalletProvider(provider) {
	        if (!provider || typeof provider !== 'object') return null;
	        if (__wkIsSuiCapableWallet(provider)) return provider;
	        var candidates = [
	          provider.sui,
	          provider.wallet,
	          provider.provider,
	          provider.suiWallet,
	        ];
	        for (var i = 0; i < candidates.length; i++) {
	          var candidate = candidates[i];
	          if (!candidate || typeof candidate !== 'object') continue;
	          if (__wkIsSuiCapableWallet(candidate)) return candidate;
	        }
	        return provider;
	      }

	      function __wkGetProviderObject(wallet) {
	        if (!wallet || typeof wallet !== 'object') return null;
	        var raw = wallet._raw;
	        if (raw && typeof raw === 'object') return raw;
	        return wallet;
	      }

	      function __wkGetWalletSeenKey(wallet) {
	        if (!wallet || typeof wallet !== 'object') return '';
	        var name = wallet.name ? String(wallet.name) : '';
	        var icon = wallet.icon ? String(wallet.icon) : '';
	        var featureNames = [];
	        if (wallet.features && typeof wallet.features === 'object') {
	          featureNames = Object.keys(wallet.features).sort();
	        }
	        return name + '|' + icon + '|' + featureNames.join(',');
	      }

	      function __wkHasSeenWallet(wallet, seenProviders, seenKeys) {
	        var provider = __wkGetProviderObject(wallet);
	        if (provider && seenProviders) {
	          try {
	            if (seenProviders.has(provider)) return true;
	          } catch (e) {}
	        }
	        var key = __wkGetWalletSeenKey(wallet);
	        if (key && seenKeys[key]) return true;
	        var name = wallet && wallet.name ? String(wallet.name).toLowerCase() : '';
	        if (name && seenKeys['__name__' + name]) return true;
	        return false;
	      }

	      function __wkMarkSeenWallet(wallet, seenProviders, seenKeys) {
	        var provider = __wkGetProviderObject(wallet);
	        if (provider && seenProviders) {
	          try {
	            seenProviders.add(provider);
	          } catch (e) {}
	        }
	        var key = __wkGetWalletSeenKey(wallet);
	        if (key) seenKeys[key] = true;
	        var name = wallet && wallet.name ? String(wallet.name).toLowerCase() : '';
	        if (name) seenKeys['__name__' + name] = true;
	      }

	      function __wkWalletPriority(wallet) {
	        if (!wallet) return 50;
	        if (wallet.__isPasskey) return 99;
	        var name = wallet.name ? String(wallet.name).toLowerCase() : '';
	        if (name === 'phantom') return 0;
	        if (name === 'waap') return 1;
	        if (name === 'backpack') return 2;
	        if (name === 'slush') return 3;
	        if (name === 'suiet') return 4;
	        if (name === 'sui wallet' || name === 'martian' || name === 'ethos') return 5;
	        if (name.indexOf('okx') !== -1) return 6;
	        return 10;
	      }

	      function __wkSortWallets(wallets) {
	        if (!Array.isArray(wallets)) return [];
	        return wallets.slice().sort(function(a, b) {
	          var pa = __wkWalletPriority(a);
	          var pb = __wkWalletPriority(b);
	          if (pa !== pb) return pa - pb;
	          var an = a && a.name ? String(a.name) : '';
	          var bn = b && b.name ? String(b.name) : '';
	          return an.localeCompare(bn);
	        });
	      }

      function getSuiWallets() {
        __wkInitWalletsApi();
        var wallets = [];
        var seenProviders = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
        var seenKeys = {};

        if (__wkWalletsApi) {
          try {
            var standardWallets = __wkWalletsApi.get();
            for (var i = 0; i < standardWallets.length; i++) {
              var sw = __wkUnwrapWalletProvider(standardWallets[i]);
              if (!sw || !__wkIsSuiCapableWallet(sw)) continue;
              if (__wkHasSeenWallet(sw, seenProviders, seenKeys)) continue;
              wallets.push(sw);
              __wkMarkSeenWallet(sw, seenProviders, seenKeys);
            }
          } catch (e) {}
        }

        var injected = Array.isArray(window.__sui_wallets__) ? window.__sui_wallets__ : [];
        for (var j = 0; j < injected.length; j++) {
          var iw = __wkUnwrapWalletProvider(injected[j]);
          if (!iw || !__wkIsSuiCapableWallet(iw)) continue;
          if (__wkHasSeenWallet(iw, seenProviders, seenKeys)) continue;
          wallets.push(iw);
          __wkMarkSeenWallet(iw, seenProviders, seenKeys);
        }

        for (var k = 0; k < __wkWindowWallets.length; k++) {
          var wc = __wkWindowWallets[k];
          try {
            var w = __wkUnwrapWalletProvider(wc.check());
            if (w && typeof w === 'object') {
              if (!__wkIsSuiCapableWallet(w)) continue;
              var wrappedWallet = {
                name: wc.name,
                icon: w.icon || wc.icon,
	                chains: ['sui:mainnet', 'sui:testnet', 'sui:devnet'],
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
              };
              if (__wkHasSeenWallet(wrappedWallet, seenProviders, seenKeys)) continue;
              wallets.push(wrappedWallet);
              __wkMarkSeenWallet(wrappedWallet, seenProviders, seenKeys);
            }
          } catch (e) {}
        }

        if (wallets.length === 0 && __wkHasPasskeySupport()) {
          var passkeyWallet = __wkCreatePasskeyWallet();
          wallets.push(passkeyWallet);
          __wkMarkSeenWallet(passkeyWallet, seenProviders, seenKeys);
        }

	        return __wkSortWallets(wallets);
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
	        if (!__wkIsSubdomain()) __wkInitWaaP();
	        var immediate = getSuiWallets();
	        if (immediate.length > 0) {
	          $wallets.set(immediate);
	        }

        return new Promise(function(resolve) {
          if (immediate.length > 0) {
            (__wkWaaPLoading || Promise.resolve()).then(function() {
              setTimeout(function() {
                var updated = getSuiWallets();
                if (updated.length > immediate.length) $wallets.set(updated);
              }, 300);
            });
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
	                  if (__wkIsUserRejection(phantomLastError)) {
	                    throw phantomLastError;
	                  }
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
              if (__wkIsUserRejection(e)) {
                $connection.set({
                  wallet: null, account: null, address: null,
                  status: 'disconnected', primaryName: null
                });
                reject(e);
                return;
              }
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
	              var isPhantomWallet = phantomFallback && (
	                wallet.name === 'Phantom'
	                || wallet._raw === phantomFallback
	                || (phantomFallback.isPhantom && wallet._raw && wallet._raw.isPhantom)
	              );
	              if (phantomFallback && isPhantomWallet) {
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

      function __wkExtractEventAccounts(changeEvent, wallet) {
        if (changeEvent && Array.isArray(changeEvent.accounts)) {
          return __wkFilterSuiAccounts(changeEvent.accounts);
        }
        if (changeEvent && Array.isArray(changeEvent.nextAccounts)) {
          return __wkFilterSuiAccounts(changeEvent.nextAccounts);
        }
        if (changeEvent && changeEvent.wallet && Array.isArray(changeEvent.wallet.accounts)) {
          return __wkFilterSuiAccounts(changeEvent.wallet.accounts);
        }
        return __wkFilterSuiAccounts(
          __wkSafeGetAccounts(wallet).concat(__wkSafeGetAccounts(wallet && wallet._raw))
        );
      }

      function __wkAttachWalletEvents(wallet) {
        __wkDetachWalletEvents();
        if (!wallet || !wallet.features) return;
        var eventsFeature = wallet.features['standard:events'];
        if (!eventsFeature || typeof eventsFeature.on !== 'function') return;
        try {
          __wkWalletEventsUnsub = eventsFeature.on('change', function(changeEvent) {
            var current = $connection.value;
            if (!current || current.wallet !== wallet) return;
            var accounts = __wkExtractEventAccounts(changeEvent, wallet);
            if (!accounts || accounts.length === 0) {
              __wkDetachWalletEvents();
              $connection.set({
                wallet: null,
                account: null,
                address: null,
                status: 'disconnected',
                primaryName: null
              });
              return;
            }
            var nextAccount = accounts[0];
            var nextAddress = __wkNormalizeAccountAddress(nextAccount);
            if (!nextAddress) return;
            var sameAddress = current.address === nextAddress;
            var sameStatus = current.status === 'connected';
            var nextPrimary = sameAddress ? current.primaryName : null;
            if (sameAddress && sameStatus && current.account === nextAccount) return;
            $connection.set({
              wallet: wallet,
              account: nextAccount,
              address: nextAddress,
              status: 'connected',
              primaryName: nextPrimary
            });
          });
        } catch (_e) {
          __wkWalletEventsUnsub = null;
        }
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
          __wkDetachWalletEvents();
          __wkSessionWalletName = '';
	        var account = accounts[0];
	        var address = __wkNormalizeAccountAddress(account);
	        if (!address && account && typeof account.address === 'string') {
	          address = account.address;
        }
        $connection.set({
          wallet: wallet,
          account: account,
          address: address,
          status: 'connected',
          primaryName: null
        });
        if (__wkIsSubdomain()) {
          try { __wkInitSignBridge(); } catch (_e) {}
        }
        __wkAttachWalletEvents(wallet);
        var existingSession = typeof getWalletSession === 'function' ? getWalletSession() : null;
        var hasSessionCookie = document.cookie.indexOf('session_id=') !== -1;
        var existingWalletName = existingSession && existingSession.walletName ? String(existingSession.walletName) : '';
        var currentWalletName = wallet && wallet.name ? String(wallet.name) : '';
	        if (
            existingSession
            && existingSession.address === address
            && existingWalletName === currentWalletName
            && hasSessionCookie
          ) {
	          __sessionReady = Promise.resolve(true);
	          return;
	        }
	        if (typeof connectWalletSession === 'function') {
	          connectWalletSession(wallet.name, address);
	          __sessionReady = Promise.resolve(true);
	        } else {
	          __sessionReady = Promise.resolve(true);
	        }
      }

      var __wkSessionWalletName = '';

      function initFromSession(address, walletName) {
        if (!address) return;
        __wkDetachWalletEvents();
        __wkSessionWalletName = walletName || '';
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
        __wkSessionWalletName = '';
        __wkDetachWalletEvents();
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

      function connectPasskey() {
        if (!__wkHasPasskeySupport()) return Promise.reject(new Error('Passkeys not supported'));
        return connect(__wkCreatePasskeyWallet());
      }

      function __wkPickReconnectAccount(accounts, expectedAddress) {
        if (!Array.isArray(accounts) || accounts.length === 0) return null;
        var normalizedExpected = __wkNormalizeAccountAddress({ address: expectedAddress || '' });
        if (!normalizedExpected) return accounts[0];
        for (var i = 0; i < accounts.length; i++) {
          if (__wkNormalizeAccountAddress(accounts[i]) === normalizedExpected) {
            return accounts[i];
          }
        }
        return accounts[0];
      }

      function __wkTrySilentReconnect(wallet, expectedAddress) {
        if (!wallet) return false;
        try {
          var existing = __wkFilterSuiAccounts(
            __wkSafeGetAccounts(wallet).concat(__wkSafeGetAccounts(wallet && wallet._raw))
          );
          var selected = __wkPickReconnectAccount(existing, expectedAddress);
          if (selected) {
            __wkFinishConnect(wallet, [selected]);
            return true;
          }
        } catch (e) {}

        try {
          var phantomProvider = (window.phantom && window.phantom.sui) || window.sui;
          var isPhantom = phantomProvider && (
            wallet.name === 'Phantom'
            || wallet._raw === phantomProvider
            || phantomProvider.isPhantom
          );
          if (!isPhantom) return false;
          var phantomAccounts = __wkFilterSuiAccounts(
            __wkSafeGetAccounts(phantomProvider).concat(__wkSafeGetAccounts(wallet))
          );
          var selectedPhantom = __wkPickReconnectAccount(phantomAccounts, expectedAddress);
          if (selectedPhantom) {
            __wkFinishConnect(wallet, [selectedPhantom]);
            return true;
          }
          var phantomAddress = __wkExtractPhantomAddress(phantomProvider);
          if (phantomAddress) {
            var fallbackAccount = __wkBuildPhantomAccount(phantomAddress);
            if (fallbackAccount) {
              __wkFinishConnect(wallet, [fallbackAccount]);
              return true;
            }
          }
        } catch (e2) {}

        return false;
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
	              var keyWallets = wallets.filter(function(w) { return !w.__isPasskey; });
	              var match = null;
	              if (session.walletName && session.walletName !== __wkPasskeyWalletName) {
	                for (var i = 0; i < keyWallets.length; i++) {
	                  if (keyWallets[i].name === session.walletName) { match = keyWallets[i]; break; }
	                }
	              }
	              if (!match && keyWallets.length > 0) {
	                match = keyWallets[0];
	              }

	              if (!match) {
	                if (__wkIsInAppBrowser()) {
	                  for (var attempt = 0; attempt < 5; attempt++) {
	                    await new Promise(function(r) { setTimeout(r, 300); });
	                    wallets = getSuiWallets();
	                    keyWallets = wallets.filter(function(w) { return !w.__isPasskey; });
	                    if (session.walletName && session.walletName !== __wkPasskeyWalletName) {
	                      for (var j = 0; j < keyWallets.length; j++) {
	                        if (keyWallets[j].name === session.walletName) { match = keyWallets[j]; break; }
	                      }
	                    }
	                    if (!match && keyWallets.length > 0) {
	                      match = keyWallets[0];
	                    }
	                    if (match) break;
	                  }
	                }
	              }

	              if (match && __wkTrySilentReconnect(match, session.address)) {
	                resolve(true);
	                return;
	              }

	              if (match && !match.__isPasskey) {
	                try {
	                  await connect(match);
	                  var connAfterReconnect = $connection.value;
	                  if (connAfterReconnect && connAfterReconnect.wallet) {
	                    resolve(true);
	                    return;
	                  }
	                } catch (_reconnectErr) {}
	              }

	              if (session.address) {
	                initFromSession(session.address, session.walletName);
	                resolve(true);
	                return;
	              }
	              resolve(false);
	            } catch (e) {
	              resolve(false);
	            }
	          })();
        });
      }

      function setPrimaryName(name) {
        var current = $connection.value;
        if (current.status !== 'connected' && current.status !== 'session') return;
        var nextName = typeof name === 'string' ? name.trim() : '';
        var currentName = typeof current.primaryName === 'string' ? current.primaryName.trim() : '';
        if (nextName === currentName) return;
        $connection.set({
          wallet: current.wallet,
          account: current.account,
          address: current.address,
          status: current.status,
          primaryName: nextName
        });
      }

      function signPersonalMessage(message) {
        var conn = $connection.value;
        if (!conn || !conn.wallet) return Promise.reject(new Error('No wallet connected'));
        return __wkSignPersonalMessage(conn.wallet, conn.account, message);
      }

      function switchChain(chain) {
        var conn = $connection.value;
        if (!conn || !conn.wallet) return Promise.reject(new Error('No wallet connected'));
        var chainName = String(chain || '').trim();
        if (!chainName) return Promise.reject(new Error('Missing chain identifier'));
        var feature = conn.wallet.features && conn.wallet.features['sui:switchChain'];
        if (feature && typeof feature.switchChain === 'function') {
          return feature.switchChain({ chain: chainName });
        }
        var raw = conn.wallet._raw;
        if (raw && raw.features && raw.features['sui:switchChain'] && typeof raw.features['sui:switchChain'].switchChain === 'function') {
          return raw.features['sui:switchChain'].switchChain({ chain: chainName });
        }
        return Promise.reject(new Error('Wallet does not support chain switching'));
      }

      function requestEmail() {
        var conn = $connection.value;
        if (!conn || !conn.wallet) return Promise.reject(new Error('No wallet connected'));
        if (typeof conn.wallet.requestEmail === 'function') {
          return conn.wallet.requestEmail();
        }
        var raw = conn.wallet._raw;
        if (raw && typeof raw.requestEmail === 'function') {
          return raw.requestEmail();
        }
        return Promise.reject(new Error('Current wallet does not support requestEmail'));
      }

      return {
        __config: { network: __wkNetwork },
        $wallets: $wallets,
        $connection: $connection,
        subscribe: subscribe,
        getSuiWallets: getSuiWallets,
        detectWallets: detectWallets,
        connect: connect,
        connectPasskey: connectPasskey,
        disconnect: disconnect,
        autoReconnect: autoReconnect,
        setPrimaryName: setPrimaryName,
        signPersonalMessage: signPersonalMessage,
        switchChain: switchChain,
        requestEmail: requestEmail,
        initFromSession: initFromSession,
        get __sessionWalletName() { return __wkSessionWalletName; },
        get __sessionReady() { return __sessionReady; },
        get __skiSignFrame() { return __skiSignFrame; },
        get __skiSignReady() { return __skiSignReady; },
        __initSignBridge: __wkInitSignBridge,
        __isMobileDevice: __wkIsMobileDevice,
        __isInAppBrowser: __wkIsInAppBrowser,
        __filterSuiAccounts: __wkFilterSuiAccounts,
        __normalizeAccountAddress: __wkNormalizeAccountAddress
      };
    })();

    if (typeof window !== 'undefined') {
      window.SuiWalletKit = SuiWalletKit;
    }
  `
}
