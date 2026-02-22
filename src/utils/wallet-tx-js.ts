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

    function __wkNormalizeBase64(value) {
      if (typeof value !== 'string') return '';
      var cleaned = value.trim();
      if (!cleaned) return '';
      cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');
      var mod = cleaned.length % 4;
      if (mod === 1) return '';
      if (mod === 2) cleaned += '==';
      else if (mod === 3) cleaned += '=';
      if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) return '';
      return cleaned;
    }

    function __wkTryHexToBytes(value) {
      if (typeof value !== 'string') return null;
      var cleaned = value.trim().toLowerCase();
      if (!cleaned) return null;
      if (cleaned.indexOf('0x') === 0) cleaned = cleaned.slice(2);
      if (!cleaned || cleaned.length % 2 !== 0) return null;
      if (!/^[0-9a-f]+$/.test(cleaned)) return null;
      var out = new Uint8Array(cleaned.length / 2);
      for (var i = 0; i < cleaned.length; i += 2) {
        out[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
      }
      return out;
    }

    function __wkTryNormalizeBytes(value) {
      if (!value) return null;
      if (value instanceof Uint8Array) return value;
      if (value instanceof ArrayBuffer) return new Uint8Array(value);
      if (Array.isArray(value)) return Uint8Array.from(value);
      if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) {
        return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || 0);
      }
      return null;
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
      function __wkNormalizeRawAddress(rawAddress) {
        if (!rawAddress) return '';
        var clean = String(rawAddress).trim().toLowerCase();
        if (!clean) return '';
        if (clean.indexOf('0x') === 0) {
          clean = clean.slice(2);
        }
        if (!clean || clean.length > 64 || /[^0-9a-f]/.test(clean)) return '';
        clean = clean.replace(/^0+/, '');
        if (!clean) return '';
        return '0x' + clean.padStart(64, '0');
      }

      var normalizedFromAddress = '';
      if (typeof account === 'string') {
        normalizedFromAddress = __wkNormalizeRawAddress(account);
        if (normalizedFromAddress) return normalizedFromAddress;
      } else if (typeof account === 'object') {
        if (typeof account.address === 'string') {
          normalizedFromAddress = __wkNormalizeRawAddress(account.address);
        }
        if (!normalizedFromAddress && account.address && typeof account.address.toString === 'function') {
          normalizedFromAddress = __wkNormalizeRawAddress(account.address.toString());
        }
        if (normalizedFromAddress) return normalizedFromAddress;
        if (account.publicKey && typeof account.publicKey.toSuiAddress === 'function') {
          try {
            var fromKey = __wkNormalizeRawAddress(account.publicKey.toSuiAddress() || '');
            if (fromKey) return fromKey;
          } catch (_e) {}
        }
      }
      return '';
    }

    function __wkResolveConnectionAddress(conn, preferredAccount) {
      var preferred = __wkNormalizeAccountAddress(preferredAccount);
      if (preferred) return preferred;

      var fromConnAccount = __wkNormalizeAccountAddress(conn && conn.account);
      if (fromConnAccount) return fromConnAccount;
      var fromConnAddress = __wkNormalizeAccountAddress(conn && conn.address);
      if (fromConnAddress) return fromConnAddress;
      return '';
    }

    function __wkResolveWalletAccount(conn, preferredAccount) {
      var wallet = conn && conn.wallet;
      var resolved = preferredAccount || conn.account || null;
      var walletAccounts = [];
      var seenWalletAccounts = {};

      function __wkPushWalletAccount(account) {
        if (!account || typeof account !== 'object') return;
        var normalized = __wkNormalizeAccountAddress(account);
        if (!normalized || seenWalletAccounts[normalized]) return;
        seenWalletAccounts[normalized] = true;
        walletAccounts.push(account);
      }

      function __wkCollectWalletAccounts(source) {
        if (!source || (typeof source !== 'object' && typeof source !== 'function')) return;
        var accounts = null;
        try { accounts = source.accounts; } catch (_e) {}
        if (typeof accounts === 'function') {
          try { accounts = accounts.call(source); } catch (_e2) { accounts = null; }
        }
        if (Array.isArray(accounts)) {
          for (var i = 0; i < accounts.length; i++) __wkPushWalletAccount(accounts[i]);
        }
        var singleAccount = null;
        try { singleAccount = source.account; } catch (_e3) {}
        __wkPushWalletAccount(singleAccount);
      }

      __wkCollectWalletAccounts(wallet);
      __wkCollectWalletAccounts(wallet && wallet._raw);
      __wkCollectWalletAccounts(wallet && wallet.sui);

      var targetAddress = __wkNormalizeAccountAddress(resolved);
      if (!targetAddress) return null;
      if (!walletAccounts.length) return resolved;
      for (var i = 0; i < walletAccounts.length; i++) {
        if (__wkNormalizeAccountAddress(walletAccounts[i]) === targetAddress) {
          return walletAccounts[i];
        }
      }
      return null;
    }

    function __wkEnsureAccountForSign(conn, account, chain) {
      if (account && typeof account === 'object') {
        return account;
      }

      var fallbackAddress = __wkNormalizeAccountAddress(account);
      if (!fallbackAddress) fallbackAddress = __wkResolveConnectionAddress(conn);
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

    function __skiResolvePreferredWalletName() {
      var conn = SuiWalletKit.$connection.value || {};
      if (conn.wallet && conn.wallet.name) return String(conn.wallet.name);
      if (SuiWalletKit.__sessionWalletName) return String(SuiWalletKit.__sessionWalletName);
      try {
        var session = typeof getWalletSession === 'function' ? getWalletSession() : null;
        if (session && session.walletName) return String(session.walletName);
      } catch (_e) {}
      try {
        var remembered = String(localStorage.getItem('sui_ski_last_wallet') || '').trim();
        if (remembered) return remembered;
      } catch (_e2) {}
      return '';
    }



    async function __skiSerializeForWallet(txInput) {
      if (typeof txInput === 'string') return txInput;
      if (txInput instanceof Uint8Array) return txInput;
      if (txInput && typeof txInput.serialize === 'function') {
        return txInput;
      }
      return txInput;
    }

    function __skiIsSubdomainHost() {
      var host = window.location.hostname || '';
      return host !== 'sui.ski' && host.endsWith('.sui.ski');
    }

    function __skiIsSlushWalletName(name) {
      var key = __skiWalletNameKey(name);
      return (
        key === 'slush'
        || key === 'slushwallet'
        || key === 'sui'
        || key === 'suiwallet'
        || key === 'mystenwallet'
      );
    }

    function __skiLooksLikeSlushProvider(provider) {
      if (!provider || typeof provider !== 'object') return false;
      if (provider.isSlush || provider.__isSlush) return true;
      var providerName = '';
      try {
        if (typeof provider.name === 'string') {
          providerName = provider.name;
        } else if (provider.wallet && typeof provider.wallet.name === 'string') {
          providerName = provider.wallet.name;
        }
      } catch (_e) {}
      return __skiIsSlushWalletName(providerName);
    }

    function __skiCanDirectSlush() {
      try {
        if (window.slush && (window.slush.sui || window.slush.wallet || window.slush)) return true;
      } catch (_e) {}
      try {
        var sui = window.sui;
        if (!sui || sui.isPhantom) return false;
        return __skiLooksLikeSlushProvider(sui)
          || typeof sui.connect === 'function'
          || typeof sui.requestAccounts === 'function'
          || typeof sui.requestAccount === 'function';
      } catch (_e2) {}
      return false;
    }

    function __skiShouldBypassBridgeForSlush(options) {
      if (__skiIsSubdomainHost()) return false;
      var preferredWalletName = '';
      if (options && options.walletName) {
        preferredWalletName = String(options.walletName);
      }
      if (!preferredWalletName && options && options.preferredWalletName) {
        preferredWalletName = String(options.preferredWalletName);
      }
      if (!preferredWalletName) {
        try {
          var conn = SuiWalletKit.$connection.value || {};
          preferredWalletName = conn && conn.wallet && conn.wallet.name ? String(conn.wallet.name) : '';
        } catch (_eConn) {}
      }
      if (!preferredWalletName) {
        preferredWalletName = __skiResolvePreferredWalletName();
      }
      if (!preferredWalletName) {
        try {
          preferredWalletName = String(localStorage.getItem('sui_ski_last_wallet') || '');
        } catch (_eLs) {}
      }
      if (!__skiIsSlushWalletName(preferredWalletName)) return false;
      return __skiCanDirectSlush();
    }

    function __skiWalletNameKey(name) {
      var normalized = String(name || '').trim().toLowerCase();
      if (!normalized) return '';
      normalized = normalized.replace(/[^a-z0-9]+/g, ' ').trim();
      if (!normalized) return '';
      if (normalized.slice(-7) === ' wallet') {
        normalized = normalized.slice(0, -7).trim();
      }
      return normalized.replace(/\s+/g, '');
    }

    function __skiWalletNamesMatch(left, right) {
      var leftRaw = String(left || '').trim().toLowerCase();
      var rightRaw = String(right || '').trim().toLowerCase();
      if (!leftRaw || !rightRaw) return false;
      if (leftRaw === rightRaw) return true;
      var leftKey = __skiWalletNameKey(leftRaw);
      var rightKey = __skiWalletNameKey(rightRaw);
      if (!leftKey || !rightKey) return false;
      if (leftKey === rightKey) return true;
      return leftKey.indexOf(rightKey) !== -1 || rightKey.indexOf(leftKey) !== -1;
    }

	    async function __skiEnsureConnectedWalletForSigning(preferredWalletName) {
	      var conn = SuiWalletKit.$connection.value || {};
	      if (conn.wallet) {
	        if (!preferredWalletName || __skiWalletNamesMatch(conn.wallet.name, preferredWalletName)) {
	          return conn;
	        }
	      }

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

	      if (preferredWalletName) {
	        for (var p = 0; p < keyWallets.length; p++) {
	          if (keyWallets[p] && __skiWalletNamesMatch(keyWallets[p].name, preferredWalletName)) {
	            match = keyWallets[p];
	            break;
	          }
	        }
	      }

	      if (!match && sessionWalletName && !__skiWalletNamesMatch(sessionWalletName, 'Passkey Wallet')) {
	        for (var i = 0; i < keyWallets.length; i++) {
	          if (keyWallets[i] && __skiWalletNamesMatch(keyWallets[i].name, sessionWalletName)) {
	            match = keyWallets[i];
	            break;
	          }
	        }
	      }

	      if (!match && __skiWalletNamesMatch(sessionWalletName, 'Passkey Wallet') && typeof SuiWalletKit.connectPasskey === 'function') {
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


    function __skiRequiresTopFrameSigning(err) {
      if (!err) return false;
      var msg = String(err && err.message ? err.message : err).toLowerCase();
      if (!msg) return false;
      return (
        msg.indexOf('wallet requires top-frame signing') !== -1
        || msg.indexOf('open https://sui.ski/sign in this tab and retry') !== -1
        || msg.indexOf('failed to open new window') !== -1
        || (msg.indexOf('popup') !== -1 && msg.indexOf('blocked') !== -1)
        || (msg.indexOf('new window') !== -1 && msg.indexOf('failed') !== -1)
      );
    }

	    function __skiCanUseSessionSignBridge(conn) {
	      return !!(conn && !conn.wallet && conn.address && conn.status === 'session' && __skiIsSubdomainHost());
	    }

	    function __skiResolveRequestedWalletName(options) {
	      var walletName = '';
	      if (options && options.walletName) walletName = String(options.walletName).trim();
	      if (!walletName && options && options.preferredWalletName) walletName = String(options.preferredWalletName).trim();
	      if (!walletName) walletName = __skiResolvePreferredWalletName();
	      return walletName;
	    }

	    function __skiShouldTopFrameHandoffFromBridgeError(err) {
	      if (!err) return false;
	      if (__skiRequiresTopFrameSigning(err)) return true;
	      var msg = String(err && err.message ? err.message : err).toLowerCase();
	      if (!msg) return false;
	      return (
	        msg.indexOf('does not expose sui signing in this context') !== -1
	        || msg.indexOf('wallet session unavailable in bridge') !== -1
	        || msg.indexOf('wallet not connected in sign bridge') !== -1
	        || msg.indexOf('selected wallet not available') !== -1
	      );
	    }

	    function __skiStartTopFrameSignHandoff(walletName, sender) {
	      if (!__skiIsSubdomainHost()) return false;
	      try {
	        if (window.__skiTopFrameHandoffInFlight) return true;
	        try {
	          var sp = new URLSearchParams(window.location.search);
	          if (sp.get('ski_handoff') === '1') return false;
	        } catch (_ep) {}
	        var currentUrl = new URL(window.location.href);
	        currentUrl.searchParams.delete('ski_handoff');
	        currentUrl.searchParams.delete('ski_handoff_status');
	        currentUrl.searchParams.delete('ski_handoff_error');
	        var handoffUrl = new URL('https://sui.ski/sign');
	        handoffUrl.searchParams.set('bridge', 'handoff');
	        handoffUrl.searchParams.set('returnUrl', currentUrl.toString());
	        if (walletName) handoffUrl.searchParams.set('walletName', String(walletName).slice(0, 120));
	        if (sender) handoffUrl.searchParams.set('sender', String(sender).slice(0, 120));
	        window.__skiTopFrameHandoffInFlight = true;
	        window.location.assign(handoffUrl.toString());
	        return true;
	      } catch (_e) {
	        return false;
	      }
	    }

	    function __skiCollectBridgeWalletHints(preferredWalletName) {
	      var out = [];
	      var seen = {};
      function pushHint(name, icon, isPasskey) {
        var normalizedName = String(name || '').trim();
        if (!normalizedName) return;
        var key = __skiWalletNameKey(normalizedName) || normalizedName.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        out.push({
          name: normalizedName,
          icon: String(icon || ''),
          __isPasskey: !!isPasskey,
        });
      }
      if (preferredWalletName) {
        pushHint(preferredWalletName, '', false);
      }
      var wallets = [];
      try {
        wallets = SuiWalletKit.$wallets && Array.isArray(SuiWalletKit.$wallets.value)
          ? SuiWalletKit.$wallets.value
          : [];
      } catch (_e) {
        wallets = [];
      }
      for (var i = 0; i < wallets.length; i++) {
        var wallet = wallets[i] || {};
        pushHint(wallet.name, wallet.icon, wallet.__isPasskey);
      }
      return out;
    }

    async function __skiEnsureBridgeFrame() {
      var bridge = SuiWalletKit.__skiSignFrame;
      var bridgeReady = SuiWalletKit.__skiSignReady;
      if (!bridge && typeof SuiWalletKit.__initSignBridge === 'function') {
        SuiWalletKit.__initSignBridge();
        bridge = SuiWalletKit.__skiSignFrame;
        bridgeReady = SuiWalletKit.__skiSignReady;
      }
      if (bridgeReady) {
        var ready = await bridgeReady;
        if (!ready) return null;
      }
      if (!bridge || !bridge.contentWindow) return null;
      return bridge;
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
      var preferTransactionBlock = !!(options && options.preferTransactionBlock);
      var topFrameSigningError = null;
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
            if (!topFrameSigningError && __skiRequiresTopFrameSigning(err)) {
              topFrameSigningError = err;
            }
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
        var singleSenderAddress = __wkResolveConnectionAddress(conn, account);
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
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txB64,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txBytes,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txB64,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txBytes,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txB64,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txBytes,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transactionBlock: txB64,
                chain: chain,
              });
            },
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
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
            function() {
              return signExecFeature.signAndExecuteTransaction({
                transaction: txRaw,
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
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txBytes,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txB64,
                chain: chain,
                options: txOptions,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txBytes,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txB64,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txBytes,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txB64,
                chain: chain,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
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
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transactionBlock: txRaw,
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
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txBytes,
              });
            },
            function() {
              return signExecBlockFeature.signAndExecuteTransactionBlock({
                transaction: txB64,
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
          var senderAddress = __wkResolveConnectionAddress(conn, account);
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

      if (topFrameSigningError) {
        throw new Error('Wallet requires reconnect in the bridge iframe. Reconnect wallet and retry.');
      }
      throw new Error('No compatible signing method found. Install a Sui wallet extension.');
    }

    async function __skiSignViaBridge(txInput, conn, options) {
      var bridgeHiddenCss = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;z-index:-1;background:transparent';
      var bridgeVisibleCss = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:13001;border:none;background:transparent;';
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
      if (txBytes instanceof Uint8Array || txBytes instanceof ArrayBuffer || Array.isArray(txBytes)) {
        txB64 = __wkBytesToBase64(txBytes);
      }
      var sender = __wkNormalizeAccountAddress(options && options.expectedSender);
      if (!sender) sender = __wkResolveConnectionAddress(conn, options && options.account);
      var walletName = '';
      if (options && options.walletName) walletName = String(options.walletName).trim();
      if (!walletName && options && options.preferredWalletName) walletName = String(options.preferredWalletName).trim();
      if (!walletName) walletName = __skiResolvePreferredWalletName();
      var walletHints = __skiCollectBridgeWalletHints(walletName);
      var requestId = 'sign-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      var bridge = await __skiEnsureBridgeFrame();
      if (!bridge) {
        throw new Error('Sign bridge not available. Reconnect wallet and retry.');
      }
      bridge.style.cssText = bridgeVisibleCss;
      return new Promise(function(resolve, reject) {
        var timeout = setTimeout(function() {
          cleanup();
          bridge.style.cssText = bridgeHiddenCss;
          reject(new Error('Transaction signing timed out'));
        }, 120000);
        function cleanup() {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
        }
        function handleResponse(ev) {
          if (ev.origin !== 'https://sui.ski') return;
          if (!ev.data || ev.data.requestId !== requestId) return;
          if (ev.data.type === 'ski:signed') {
            cleanup();
            bridge.style.cssText = bridgeHiddenCss;
            resolve(ev.data);
          } else if (ev.data.type === 'ski:error') {
            cleanup();
            bridge.style.cssText = bridgeHiddenCss;
            reject(new Error(ev.data.error || 'Signing failed'));
          }
        }
        window.addEventListener('message', handleResponse);
        bridge.contentWindow.postMessage({
          type: 'ski:sign',
          txBytes: txB64,
          requestId: requestId,
          sender: sender,
          walletName: walletName,
          walletHints: walletHints,
          options: (options && options.txOptions) || {},
        }, 'https://sui.ski');
      });
    }

    function __skiMessageToBytes(message) {
      var normalized = __wkTryNormalizeBytes(message);
      if (normalized) return normalized;
      if (typeof message === 'string') {
        if (typeof TextEncoder !== 'undefined') {
          return new TextEncoder().encode(message);
        }
        var fallback = new Uint8Array(message.length);
        for (var i = 0; i < message.length; i++) {
          fallback[i] = message.charCodeAt(i) & 0xff;
        }
        return fallback;
      }
      return new Uint8Array(0);
    }

	    async function __skiSignPersonalMessageViaBridge(message, conn, options) {
      var bridgeHiddenCss = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;z-index:-1;background:transparent';
      var bridgeVisibleCss = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:13001;border:none;background:transparent;';
      var messageBytes = __skiMessageToBytes(message);
      if (!messageBytes || messageBytes.length === 0) {
        throw new Error('Message payload is empty');
      }
      var sender = __wkNormalizeAccountAddress(options && options.expectedSender);
      if (!sender) sender = __wkResolveConnectionAddress(conn, options && options.account);
      var walletName = '';
      if (options && options.walletName) walletName = String(options.walletName).trim();
      if (!walletName && options && options.preferredWalletName) walletName = String(options.preferredWalletName).trim();
      if (!walletName) walletName = __skiResolvePreferredWalletName();
      var walletHints = __skiCollectBridgeWalletHints(walletName);
      var requestId = 'sign-message-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      var bridge = await __skiEnsureBridgeFrame();
      if (!bridge) {
        throw new Error('Sign bridge not available. Reconnect wallet and retry.');
      }
      bridge.style.cssText = bridgeVisibleCss;
      return new Promise(function(resolve, reject) {
        var timeout = setTimeout(function() {
          cleanup();
          bridge.style.cssText = bridgeHiddenCss;
          reject(new Error('Message signing timed out'));
        }, 120000);
        function cleanup() {
          clearTimeout(timeout);
          window.removeEventListener('message', handleResponse);
        }
        function handleResponse(ev) {
          if (ev.origin !== 'https://sui.ski') return;
          if (!ev.data || ev.data.requestId !== requestId) return;
          if (ev.data.type === 'ski:signed-message') {
            cleanup();
            bridge.style.cssText = bridgeHiddenCss;
            resolve({
              signature: ev.data.signature || '',
              bytes: ev.data.bytes || __wkBytesToBase64(messageBytes),
            });
          } else if (ev.data.type === 'ski:error') {
            cleanup();
            bridge.style.cssText = bridgeHiddenCss;
            reject(new Error(ev.data.error || 'Message signing failed'));
          }
        }
        window.addEventListener('message', handleResponse);
        bridge.contentWindow.postMessage({
          type: 'ski:sign-message',
          message: __wkBytesToBase64(messageBytes),
          requestId: requestId,
          sender: sender,
          walletName: walletName,
          walletHints: walletHints,
        }, 'https://sui.ski');
      });
	    }

	    function __wkEmitTxSuccess(result) {
	      try {
	        var digest = '';
	        if (result && typeof result === 'object') {
	          digest = result.digest || (result.result && result.result.digest) || '';
	        }
	        window.dispatchEvent(new CustomEvent('wk:tx-success', {
	          detail: { digest: digest || '' },
	        }));
	      } catch (_e) {}
	    }

			    SuiWalletKit.signAndExecute = async function signAndExecute(txInput, options) {
			      var result;
			      var bypassBridgeForSlush = __skiShouldBypassBridgeForSlush(options);
		      if (bypassBridgeForSlush) {
		        var slushConn = await __skiEnsureConnectedWalletForSigning('Slush');
		        if (!slushConn || !slushConn.wallet) {
		          throw new Error('Slush extension not detected in this tab. Open Slush and retry.');
		        }
		        result = await __skiWalletSignAndExecute(txInput, slushConn, options);
		        __wkEmitTxSuccess(result);
		        return result;
		      }
			      var bridgeConn = SuiWalletKit.$connection.value || {};
			      if (__skiCanUseSessionSignBridge(bridgeConn)) {
			        var requestedWalletName = __skiResolveRequestedWalletName(options);
			        var localConn = await __skiEnsureConnectedWalletForSigning(requestedWalletName);
			        if (localConn && localConn.wallet) {
			          try {
			            result = await __skiWalletSignAndExecute(txInput, localConn, options);
			            __wkEmitTxSuccess(result);
			            return result;
			          } catch (_localSignErr) {
			            if (__wkIsUserRejection(_localSignErr)) throw _localSignErr;
			          }
			        }
			        try {
			          result = await __skiSignViaBridge(txInput, bridgeConn, options);
			          __wkEmitTxSuccess(result);
			          return result;
			        } catch (bridgeErr) {
			          if (__skiShouldTopFrameHandoffFromBridgeError(bridgeErr)) {
			            var handoffWalletName = requestedWalletName;
			            var handoffSender = __wkNormalizeAccountAddress(options && options.expectedSender);
			            if (!handoffSender) handoffSender = __wkResolveConnectionAddress(bridgeConn, options && options.account);
			            if (__skiStartTopFrameSignHandoff(handoffWalletName, handoffSender)) {
			              return new Promise(function() {});
			            }
			            throw new Error('Wallet signing unavailable. Please reconnect your wallet and retry.');
				          }
				          throw bridgeErr;
				        }
			      }
			      result = await __skiWalletSignAndExecute(txInput, __wkGetWallet(), options);
			      __wkEmitTxSuccess(result);
		      return result;
		    };

    SuiWalletKit.signAndExecuteFromBytes = SuiWalletKit.signAndExecute;

    var __wkNativeSignPersonalMessage = typeof SuiWalletKit.signPersonalMessage === 'function'
      ? SuiWalletKit.signPersonalMessage.bind(SuiWalletKit)
      : null;

    SuiWalletKit.signPersonalMessage = async function signPersonalMessage(message, options) {
      var bypassBridgeForSlush = __skiShouldBypassBridgeForSlush(options);
      if (bypassBridgeForSlush) {
        var slushMsgConn = await __skiEnsureConnectedWalletForSigning('Slush');
        if (!slushMsgConn || !slushMsgConn.wallet) {
          throw new Error('Slush extension not detected in this tab. Open Slush and retry.');
        }
      }

	      var bridgeMsgConn = SuiWalletKit.$connection.value || {};
	      if (__skiCanUseSessionSignBridge(bridgeMsgConn)) {
	        var requestedMsgWalletName = __skiResolveRequestedWalletName(options);
	        var localMsgConn = await __skiEnsureConnectedWalletForSigning(requestedMsgWalletName);
	        if (localMsgConn && localMsgConn.wallet && __wkNativeSignPersonalMessage) {
	          try {
	            return await __wkNativeSignPersonalMessage(message);
	          } catch (_localMsgSignErr) {}
	        }
	        try {
	          return await __skiSignPersonalMessageViaBridge(message, bridgeMsgConn, options);
	        } catch (bridgeMsgErr) {
	          if (__skiShouldTopFrameHandoffFromBridgeError(bridgeMsgErr)) {
	            var handoffMsgWalletName = requestedMsgWalletName;
	            var handoffMsgSender = __wkNormalizeAccountAddress(options && options.expectedSender);
	            if (!handoffMsgSender) handoffMsgSender = __wkResolveConnectionAddress(bridgeMsgConn, options && options.account);
	            if (__skiStartTopFrameSignHandoff(handoffMsgWalletName, handoffMsgSender)) {
	              return new Promise(function() {});
	            }
	          }
	          throw bridgeMsgErr;
	        }
	      }

      if (!__wkNativeSignPersonalMessage) {
        throw new Error('Current wallet does not support personal message signing');
      }
      return await __wkNativeSignPersonalMessage(message);
    };

	    SuiWalletKit.signTransaction = async function signTransaction(txInput, options) {
        var bypassBridgeForSlush = __skiShouldBypassBridgeForSlush(options);

      if (bypassBridgeForSlush) {
        var slushTxConn = await __skiEnsureConnectedWalletForSigning('Slush');
        if (!slushTxConn || !slushTxConn.wallet) {
          throw new Error('Slush extension not detected in this tab. Open Slush and retry.');
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
