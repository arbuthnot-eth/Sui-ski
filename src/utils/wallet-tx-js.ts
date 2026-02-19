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

    function __wkLooksLikeBase64(value) {
      return !!__wkNormalizeBase64(value);
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

    function __wkExtractBridgePayload(value, depth) {
      if (!value || depth > 6) return null;
      if (typeof value === 'string') return value.trim();
      var asBytes = __wkTryNormalizeBytes(value);
      if (asBytes) return asBytes;
      if (typeof value !== 'object') return null;

      var byteKeys = [
        'txBytes',
        'transactionBytes',
        'bytes',
        'rawBytes',
        'rawTransaction',
        'signedTransaction',
        'serializedTransaction',
        'transactionBlockBytes',
        'bcsBytes',
        'bcs',
      ];
      for (var bi = 0; bi < byteKeys.length; bi++) {
        var byteCandidate = __wkExtractBridgePayload(value[byteKeys[bi]], depth + 1);
        if (byteCandidate) return byteCandidate;
      }

      var txKeys = ['transaction', 'transactionBlock', 'tx', 'payload', 'data'];
      for (var ti = 0; ti < txKeys.length; ti++) {
        var txCandidate = __wkExtractBridgePayload(value[txKeys[ti]], depth + 1);
        if (txCandidate) return txCandidate;
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
      try {
        walletAccounts = (wallet && Array.isArray(wallet.accounts)) ? wallet.accounts : [];
      } catch (_e) {}
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

    var __skiRequestCounter = 0;
    var __skiSignTimeout = 120000;
    var __skiHandoffResult = null;

    function __skiConsumeHandoffQuery() {
      try {
        var url = new URL(window.location.href);
        if (url.searchParams.get('ski_handoff') !== '1') return;
        var status = String(url.searchParams.get('ski_handoff_status') || '').toLowerCase();
        var error = String(url.searchParams.get('ski_handoff_error') || '');
        __skiHandoffResult = {
          status: status || 'unknown',
          error: error,
          at: Date.now(),
        };
        try {
          sessionStorage.setItem('sui_ski_handoff_result', JSON.stringify(__skiHandoffResult));
        } catch (_eStore) {}
        url.searchParams.delete('ski_handoff');
        url.searchParams.delete('ski_handoff_status');
        url.searchParams.delete('ski_handoff_error');
        history.replaceState(null, '', url.toString());
      } catch (_e) {}
    }

    function __skiReadRecentHandoffResult() {
      if (__skiHandoffResult) return __skiHandoffResult;
      try {
        var raw = sessionStorage.getItem('sui_ski_handoff_result');
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.at || !Number.isFinite(Number(parsed.at))) return null;
        __skiHandoffResult = {
          status: String(parsed.status || 'unknown'),
          error: String(parsed.error || ''),
          at: Number(parsed.at),
        };
        return __skiHandoffResult;
      } catch (_e) {
        return null;
      }
    }

    function __skiClearHandoffResult() {
      __skiHandoffResult = null;
      try { sessionStorage.removeItem('sui_ski_handoff_result'); } catch (_e) {}
    }

    function __skiBuildHandoffReturnUrl() {
      var next = new URL(window.location.href);
      next.searchParams.delete('ski_handoff');
      next.searchParams.delete('ski_handoff_status');
      next.searchParams.delete('ski_handoff_error');
      return next.toString();
    }

    function __skiStartTopFrameHandoff(preferredWalletName, expectedSender) {
      var target = new URL('https://sui.ski/sign');
      target.searchParams.set('bridge', 'handoff');
      target.searchParams.set('returnUrl', __skiBuildHandoffReturnUrl());
      if (preferredWalletName && String(preferredWalletName).trim()) {
        target.searchParams.set('walletName', String(preferredWalletName).trim());
      }
      var normalizedSender = __wkNormalizeAccountAddress(expectedSender || '');
      if (normalizedSender) {
        target.searchParams.set('sender', normalizedSender);
      }
      window.location.assign(target.toString());
      return true;
    }

    function __skiMaybeStartTopFrameHandoff(preferredWalletName, err, expectedSender) {
      if (!__skiIsSubdomainHost()) return false;
      if (window.top !== window.self) return false;
      if (!(__skiRequiresTopFrameSigning(err) || __skiIsBridgeWalletAvailabilityError(err))) return false;
      var recent = __skiReadRecentHandoffResult();
      if (recent && recent.status !== 'ok' && (Date.now() - recent.at) < 15000) {
        return false;
      }
      __skiClearHandoffResult();
      return __skiStartTopFrameHandoff(preferredWalletName, expectedSender);
    }

    __skiConsumeHandoffQuery();

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

    function __skiResolvePreferredWalletNameForOperation(options) {
      if (options && options.walletName) {
        var explicitWalletName = String(options.walletName).trim();
        if (explicitWalletName) return explicitWalletName;
      }
      if (options && options.preferredWalletName) {
        var preferredWalletName = String(options.preferredWalletName).trim();
        if (preferredWalletName) return preferredWalletName;
      }
      return __skiResolvePreferredWalletName();
    }

    function __skiCollectWalletHints() {
      var wallets = [];
      try {
        if (typeof SuiWalletKit.getSuiWallets === 'function') {
          wallets = SuiWalletKit.getSuiWallets();
        }
      } catch (_e) {}
      if ((!Array.isArray(wallets) || wallets.length === 0) && SuiWalletKit.$wallets) {
        wallets = Array.isArray(SuiWalletKit.$wallets.value) ? SuiWalletKit.$wallets.value : [];
      }
      var out = [];
      var byKey = {};
      for (var i = 0; i < wallets.length; i++) {
        var wallet = wallets[i];
        if (!wallet || !wallet.name) continue;
        var name = String(wallet.name);
        var key = __skiWalletNameKey(name);
        if (!key) key = 'wallet-' + i;
        var icon = wallet.icon ? String(wallet.icon) : '';
        var existing = byKey[key];
        if (!existing) {
          existing = {
            name: name,
            icon: icon,
            __isPasskey: !!wallet.__isPasskey,
          };
          byKey[key] = existing;
          out.push(existing);
          continue;
        }
        if (!existing.icon && icon) existing.icon = icon;
        if (existing.__isPasskey && !wallet.__isPasskey) existing.__isPasskey = false;
      }
      return out;
    }

    var __skiHiddenStyle = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;z-index:-1;background:transparent';
    var __skiOverlayStyle = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;border:none;background:transparent';

    function __skiPostAndWait(frame, txB64, execOptions, expectedSender, preferredWalletName) {
      var requestId = 'ski-' + (++__skiRequestCounter) + '-' + Date.now();
      var walletHints = __skiCollectWalletHints();
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
          walletHints: walletHints,
        }, 'https://sui.ski');
      });
    }

    function __skiPostMessageAndWait(frame, messageB64, expectedSender, preferredWalletName) {
      var requestId = 'ski-msg-' + (++__skiRequestCounter) + '-' + Date.now();
      var walletHints = __skiCollectWalletHints();
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
          if (e.data.type === 'ski:signed-message' || e.data.type === 'ski:error') {
            window.removeEventListener('message', handler);
            clearTimeout(timer);
            if (done) return;
            done = true;
            finish();
            if (e.data.type === 'ski:error') {
              reject(new Error(e.data.error || 'Message signing failed'));
            } else {
              resolve(e.data);
            }
          }
        }

        window.addEventListener('message', handler);
        frame.contentWindow.postMessage({
          type: 'ski:sign-message',
          message: messageB64,
          requestId: requestId,
          sender: expectedSender || '',
          walletName: preferredWalletName || '',
          walletHints: walletHints,
        }, 'https://sui.ski');
      });
    }

    function __skiConnectBridgeAndWait(frame, preferredWalletName, expectedSender, forceInteractive) {
      var requestId = 'ski-connect-' + (++__skiRequestCounter) + '-' + Date.now();
      var walletHints = __skiCollectWalletHints();
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
          reject(new Error('Bridge connection timed out'));
        }, 60000);

        function handler(e) {
          if (e.origin !== 'https://sui.ski') return;
          if (!e.data || e.data.requestId !== requestId) return;
          if (e.data.type === 'ski:connected') {
            window.removeEventListener('message', handler);
            clearTimeout(timer);
            if (done) return;
            done = true;
            finish();
            resolve(e.data);
            return;
          }
          if (e.data.type === 'ski:connect-error' || e.data.type === 'ski:error') {
            window.removeEventListener('message', handler);
            clearTimeout(timer);
            if (done) return;
            done = true;
            finish();
            reject(new Error(e.data.error || 'Bridge connection failed'));
          }
        }

        window.addEventListener('message', handler);
        frame.contentWindow.postMessage({
          type: 'ski:connect',
          requestId: requestId,
          walletName: preferredWalletName || '',
          sender: expectedSender || '',
          walletHints: walletHints,
          forceInteractive: !!forceInteractive,
        }, 'https://sui.ski');
      });
    }

    function __skiOpenBridgeModalAndWait(frame, preferredWalletName) {
      var requestId = 'ski-modal-' + (++__skiRequestCounter) + '-' + Date.now();
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
          reject(new Error('Bridge wallet selection timed out'));
        }, 180000);

        function handler(e) {
          if (e.origin !== 'https://sui.ski') return;
          if (!e.data || e.data.requestId !== requestId) return;
          if (e.data.type === 'ski:connected') {
            window.removeEventListener('message', handler);
            clearTimeout(timer);
            if (done) return;
            done = true;
            finish();
            resolve(e.data);
            return;
          }
          if (e.data.type === 'ski:modal-closed' || e.data.type === 'ski:error') {
            window.removeEventListener('message', handler);
            clearTimeout(timer);
            if (done) return;
            done = true;
            finish();
            reject(new Error(e.data.error || 'Wallet selection was cancelled'));
          }
        }

        window.addEventListener('message', handler);
        frame.contentWindow.postMessage({
          type: 'ski:open-modal',
          requestId: requestId,
          walletName: preferredWalletName || '',
        }, 'https://sui.ski');
      });
    }

    function __skiHasBridgeSessionHints(preferredWalletName, expectedSender) {
      var expected = __wkNormalizeAccountAddress(expectedSender || '');
      if (expected) return true;
      if (preferredWalletName && String(preferredWalletName).trim()) return true;
      var conn = SuiWalletKit.$connection.value || {};
      if (conn && (conn.address || conn.primaryName || conn.status === 'session')) return true;
      try {
        var session = typeof getWalletSession === 'function' ? getWalletSession() : null;
        if (session && (session.address || session.walletName)) return true;
      } catch (_e) {}
      try {
        if (localStorage.getItem('sui_ski_last_wallet')) return true;
      } catch (_e2) {}
      return false;
    }

    async function __skiEnsureBridgeConnectionViaIframe(preferredWalletName, expectedSender) {
      var frame = await __skiEnsureBridge();
      try {
        await __skiConnectBridgeAndWait(frame, preferredWalletName, expectedSender, false);
        return true;
      } catch (_connectErr) {
        if (__skiHasBridgeSessionHints(preferredWalletName, expectedSender)) throw _connectErr;
        try {
          await __skiConnectBridgeAndWait(frame, preferredWalletName, expectedSender, true);
          return true;
        } catch (_interactiveErr) {
          await __skiOpenBridgeModalAndWait(frame, preferredWalletName);
          return true;
        }
      }
    }

    function __skiResolveBridgeExpectedSender(options) {
      var sessionConn = SuiWalletKit.$connection.value || {};
      var sessionAccount = (options && options.account) || sessionConn.account;
      var forcedExpectedSender = __wkNormalizeAccountAddress(
        options && options.expectedSender ? options.expectedSender : '',
      );
      return forcedExpectedSender || __wkResolveConnectionAddress(sessionConn, sessionAccount);
    }

    async function __skiSignViaBridge(txInput, execOptions, options, preferredWalletName) {
      var frame = await __skiEnsureBridge();
      var b64 = await __skiSerializeTx(txInput);
      var expectedSender = __skiResolveBridgeExpectedSender(options);
      return await __skiPostAndWait(
        frame,
        b64,
        execOptions || {},
        expectedSender,
        preferredWalletName,
      );
    }

    async function __skiSignMessageViaBridge(message, options, preferredWalletName) {
      var frame = await __skiEnsureBridge();
      var expectedSender = __skiResolveBridgeExpectedSender(options);
      var bytes = __wkNormalizeMessageBytes(message);
      if (!bytes.length) throw new Error('Missing message bytes for bridge signing');
      var messageB64 = __wkBytesToBase64(bytes);
      return await __skiPostMessageAndWait(frame, messageB64, expectedSender, preferredWalletName);
    }

    var __skiBridgePopup = null;

    function __skiOpenBridgePopup() {
      if (__skiBridgePopup && !__skiBridgePopup.closed) {
        try { __skiBridgePopup.focus(); } catch (_e) {}
      } else {
        __skiBridgePopup = window.open(
          'https://sui.ski/sign?bridge=popup',
          'sui_ski_sign_bridge_popup',
          'popup=yes,width=460,height=760,resizable=yes,scrollbars=yes',
        );
      }
      if (!__skiBridgePopup || __skiBridgePopup.closed) {
        return Promise.reject(new Error('Popup blocked. Allow popups for this site and retry.'));
      }
      var popup = __skiBridgePopup;
      return new Promise(function(resolve, reject) {
        var done = false;
        function cleanup() {
          window.removeEventListener('message', handler);
        }
        var timeout = setTimeout(function() {
          if (done) return;
          done = true;
          cleanup();
          reject(new Error('Sign bridge popup timed out'));
        }, 15000);
        function handler(e) {
          if (e.origin !== 'https://sui.ski') return;
          if (e.source !== popup) return;
          if (!e.data || e.data.type !== 'ski:ready') return;
          clearTimeout(timeout);
          if (done) return;
          done = true;
          cleanup();
          resolve(popup);
        }
        window.addEventListener('message', handler);
        var pingAttempts = 0;
        var pingTimer = setInterval(function() {
          if (done) {
            clearInterval(pingTimer);
            return;
          }
          pingAttempts++;
          if (pingAttempts > 20) {
            clearInterval(pingTimer);
            return;
          }
          try {
            popup.postMessage({ type: 'ski:ping' }, 'https://sui.ski');
          } catch (_e) {}
        }, 300);
        try {
          popup.postMessage({ type: 'ski:ping' }, 'https://sui.ski');
        } catch (_e) {}
      });
    }

    function __skiPostViaPopupAndWait(payload, successType) {
      var requestId = payload && payload.requestId ? payload.requestId : ('popup-' + (++__skiRequestCounter) + '-' + Date.now());
      var message = Object.assign({}, payload || {}, { requestId: requestId });
      return __skiOpenBridgePopup().then(function(popup) {
        return new Promise(function(resolve, reject) {
          var done = false;
          function cleanup() {
            window.removeEventListener('message', handler);
          }
          var timer = setTimeout(function() {
            if (done) return;
            done = true;
            cleanup();
            reject(new Error('Popup bridge request timed out'));
          }, __skiSignTimeout);
          function handler(e) {
            if (e.origin !== 'https://sui.ski') return;
            if (e.source !== popup) return;
            if (!e.data || e.data.requestId !== requestId) return;
            if (e.data.type === successType) {
              clearTimeout(timer);
              if (done) return;
              done = true;
              cleanup();
              resolve(e.data);
              return;
            }
            if (e.data.type === 'ski:error') {
              clearTimeout(timer);
              if (done) return;
              done = true;
              cleanup();
              reject(new Error(e.data.error || 'Popup signing failed'));
            }
          }
          window.addEventListener('message', handler);
          popup.postMessage(message, 'https://sui.ski');
        });
      });
    }

    function __skiPostAndWaitViaPopup(txB64, execOptions, expectedSender, preferredWalletName) {
      return __skiPostViaPopupAndWait({
        type: 'ski:sign',
        txBytes: txB64,
        options: execOptions || {},
        sender: expectedSender || '',
        walletName: preferredWalletName || '',
        walletHints: __skiCollectWalletHints(),
      }, 'ski:signed');
    }

    function __skiPostMessageAndWaitViaPopup(messageB64, expectedSender, preferredWalletName) {
      return __skiPostViaPopupAndWait({
        type: 'ski:sign-message',
        message: messageB64,
        sender: expectedSender || '',
        walletName: preferredWalletName || '',
        walletHints: __skiCollectWalletHints(),
      }, 'ski:signed-message');
    }

    function __wkNormalizeMessageBytes(message) {
      if (!message) return new Uint8Array(0);
      if (message instanceof Uint8Array) return message;
      if (message instanceof ArrayBuffer) return new Uint8Array(message);
      if (Array.isArray(message)) return Uint8Array.from(message);
      if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(message)) {
        return new Uint8Array(message.buffer, message.byteOffset || 0, message.byteLength || 0);
      }
      if (typeof message === 'string') {
        try {
          var decoded = atob(message);
          var out = new Uint8Array(decoded.length);
          for (var i = 0; i < decoded.length; i++) out[i] = decoded.charCodeAt(i);
          return out;
        } catch (_e) {
          try {
            return new TextEncoder().encode(message);
          } catch (_e2) {
            return new Uint8Array(0);
          }
        }
      }
      return new Uint8Array(0);
    }

    async function __skiSerializeTx(txInput) {
      var extracted = __wkExtractBridgePayload(txInput, 0);
      var candidateTx = (
        extracted && typeof extracted === 'object' && !__wkTryNormalizeBytes(extracted)
      ) ? extracted : txInput;
      if (typeof extracted === 'string') {
        var extractedB64 = __wkNormalizeBase64(extracted);
        if (extractedB64) return extractedB64;
        var hexBytes = __wkTryHexToBytes(extracted);
        if (hexBytes) return __wkBytesToBase64(hexBytes);
        if (extracted[0] === '{' || extracted[0] === '[') return extracted;
      }
      var directBytes = __wkTryNormalizeBytes(extracted || txInput);
      if (directBytes) return __wkBytesToBase64(directBytes);
      if (candidateTx && typeof candidateTx.serialize === 'function') {
        try {
          var serialized = await candidateTx.serialize();
          var serializedBytes = __wkTryNormalizeBytes(serialized);
          if (serializedBytes) return __wkBytesToBase64(serializedBytes);
          if (typeof serialized === 'string') {
            if (__wkLooksLikeBase64(serialized)) return serialized.trim();
            var serializedHex = __wkTryHexToBytes(serialized);
            if (serializedHex) return __wkBytesToBase64(serializedHex);
            return serialized;
          }
        } catch (_serializeErr) {}
      }
      if (candidateTx && typeof candidateTx.build === 'function') {
        try {
          var builtWithoutClient = await candidateTx.build();
          var builtNoClientBytes = __wkTryNormalizeBytes(builtWithoutClient);
          if (builtNoClientBytes) return __wkBytesToBase64(builtNoClientBytes);
          if (typeof builtWithoutClient === 'string') {
            var noClientB64 = __wkNormalizeBase64(builtWithoutClient);
            if (noClientB64) return noClientB64;
          }
        } catch (_buildNoClientErr) {}
        var RpcClient = window.SuiJsonRpcClient || window.SuiClient;
        if (RpcClient && typeof RpcClient === 'function') {
          try {
            var rpcClient = new RpcClient({ url: __wkGetRpcUrl() });
            var builtBytes = await candidateTx.build({ client: rpcClient });
            var builtWithClientBytes = __wkTryNormalizeBytes(builtBytes);
            if (builtWithClientBytes) return __wkBytesToBase64(builtWithClientBytes);
            if (typeof builtBytes === 'string') {
              var builtWithClientB64 = __wkNormalizeBase64(builtBytes);
              if (builtWithClientB64) return builtWithClientB64;
            }
          } catch (_buildErr) {}
        }
      }
      if (candidateTx && typeof candidateTx.toJSON === 'function') {
        try {
          var candidateJson = JSON.stringify(await candidateTx.toJSON());
          if (candidateJson && candidateJson !== '{}' && candidateJson !== '[]') return candidateJson;
        } catch (_jsonErr) {}
      }
      if (txInput && typeof txInput === 'object') {
        try {
          var rawJson = JSON.stringify(txInput);
          if (rawJson && rawJson !== '{}' && rawJson !== '[]') return rawJson;
        } catch (_stringifyErr) {}
      }
      var detail = txInput && typeof txInput === 'object'
        ? ('keys=' + Object.keys(txInput).slice(0, 6).join(','))
        : ('type=' + typeof txInput);
      throw new Error('Cannot serialize transaction for sign bridge. ' + detail);
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

	    function __skiShouldUseBridge(options) {
      if (__skiShouldBypassBridgeForSlush(options)) return false;
	      if (__skiIsSubdomainHost()) {
	        if ((!SuiWalletKit.__skiSignFrame || !SuiWalletKit.__skiSignReady) && typeof SuiWalletKit.__initSignBridge === 'function') {
	          try { SuiWalletKit.__initSignBridge(); } catch (_e) {}
	        }
	        return true;
	      }
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

    function __skiIsBridgeWalletAvailabilityError(err) {
      if (!err) return false;
      var msg = String(err && err.message ? err.message : err).toLowerCase();
      if (!msg) return false;
      return (
        msg.indexOf('selected wallet not available') !== -1
        || msg.indexOf('preferred wallet not available') !== -1
        || msg.indexOf('wallet not connected in sign bridge') !== -1
        || msg.indexOf('wallet requires reconnect in the bridge iframe') !== -1
        || msg.indexOf('connected wallet account does not match') !== -1
      );
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

	    SuiWalletKit.signAndExecute = async function signAndExecute(txInput, options) {
	      var onSubdomain = __skiIsSubdomainHost();
	      var bypassBridgeForSlush = __skiShouldBypassBridgeForSlush(options);
	      var mustUseBridge = !bypassBridgeForSlush && !!(onSubdomain || (options && options.forceSignBridge));
        var preferredWalletName = __skiResolvePreferredWalletNameForOperation(options);

	      if (__skiShouldUseBridge(options)) {
	        var bridgeError = null;
          var txOptions = (options && options.txOptions) || {};
	        try {
	          return await __skiSignViaBridge(txInput, txOptions, options, preferredWalletName);
	        } catch (err) {
	          bridgeError = err;
	          console.warn('Sign bridge failed:', err && err.message ? err.message : err);
	        }

	        if (mustUseBridge || __wkIsUserRejection(bridgeError)) {
            if (
              mustUseBridge
              && !__wkIsUserRejection(bridgeError)
              && (
                __skiRequiresTopFrameSigning(bridgeError)
                || __skiIsBridgeWalletAvailabilityError(bridgeError)
              )
            ) {
              try {
                await __skiEnsureBridgeConnectionViaIframe(
                  preferredWalletName,
                  __skiResolveBridgeExpectedSender(options),
                );
                return await __skiSignViaBridge(txInput, txOptions, options, preferredWalletName);
              } catch (reconnectErr) {
                bridgeError = reconnectErr || bridgeError;
              }
            }
            if (
              mustUseBridge
              && __skiMaybeStartTopFrameHandoff(
                preferredWalletName,
                bridgeError,
                __skiResolveBridgeExpectedSender(options),
              )
            ) {
              throw new Error('Redirecting to top-frame wallet authorization...');
            }
	          throw bridgeError || new Error('Sign bridge failed. Reconnect wallet from sui.ski and retry.');
	        }

	        var reconnected = await __skiEnsureConnectedWalletForSigning(preferredWalletName);
	        if (reconnected && reconnected.wallet) {
	          return await __skiWalletSignAndExecute(txInput, reconnected, options);
	        }
	        if (bridgeError) throw bridgeError;
	      } else if (mustUseBridge) {
	        throw new Error('Sign bridge not available. Reconnect wallet from sui.ski and retry.');
	      }
	      if (bypassBridgeForSlush) {
	        var slushConn = await __skiEnsureConnectedWalletForSigning('Slush');
	        if (!slushConn || !slushConn.wallet) {
	          throw new Error('Slush extension not detected in this tab. Open Slush and retry.');
	        }
	        return await __skiWalletSignAndExecute(txInput, slushConn, options);
	      }
	      return await __skiWalletSignAndExecute(txInput, __wkGetWallet(), options);
	    };

    SuiWalletKit.signAndExecuteFromBytes = SuiWalletKit.signAndExecute;

    var __wkNativeSignPersonalMessage = typeof SuiWalletKit.signPersonalMessage === 'function'
      ? SuiWalletKit.signPersonalMessage.bind(SuiWalletKit)
      : null;

    SuiWalletKit.signPersonalMessage = async function signPersonalMessage(message, options) {
      var onSubdomain = __skiIsSubdomainHost();
      var bypassBridgeForSlush = __skiShouldBypassBridgeForSlush(options);
      var preferredWalletName = __skiResolvePreferredWalletNameForOperation(options);
      if (__skiShouldUseBridge(options)) {
        var bridgeError = null;
        try {
          var signedMessage = await __skiSignMessageViaBridge(message, options, preferredWalletName);
          console.log('[WalletTx] Message sign bridge success');
          return signedMessage;
        } catch (err) {
          bridgeError = err;
          console.warn('Message sign bridge failed:', err && err.message ? err.message : err);
        }

        var mustUseBridge = !bypassBridgeForSlush && !!(onSubdomain || (options && options.forceSignBridge));
        if (mustUseBridge || __wkIsUserRejection(bridgeError)) {
          if (
            mustUseBridge
            && !__wkIsUserRejection(bridgeError)
            && (
              __skiRequiresTopFrameSigning(bridgeError)
              || __skiIsBridgeWalletAvailabilityError(bridgeError)
            )
          ) {
            try {
              await __skiEnsureBridgeConnectionViaIframe(
                preferredWalletName,
                __skiResolveBridgeExpectedSender(options),
              );
              return await __skiSignMessageViaBridge(message, options, preferredWalletName);
            } catch (reconnectErr) {
              bridgeError = reconnectErr || bridgeError;
            }
          }
          if (
            mustUseBridge
            && __skiMaybeStartTopFrameHandoff(
              preferredWalletName,
              bridgeError,
              __skiResolveBridgeExpectedSender(options),
            )
          ) {
            throw new Error('Redirecting to top-frame wallet authorization...');
          }
          throw bridgeError || new Error('Sign bridge failed. Reconnect wallet from sui.ski and retry.');
        }

        var reconnected = await __skiEnsureConnectedWalletForSigning(preferredWalletName);
        if (reconnected && reconnected.wallet && __wkNativeSignPersonalMessage) {
          return await __wkNativeSignPersonalMessage(message);
        }
        if (bridgeError) throw bridgeError;
      } else {
        var onSubdomainFallback = __skiIsSubdomainHost();
        if ((!bypassBridgeForSlush && onSubdomainFallback) || (options && options.forceSignBridge)) {
          throw new Error('Sign bridge not available. Reconnect wallet from sui.ski and retry.');
        }
      }

      if (bypassBridgeForSlush) {
        var slushMsgConn = await __skiEnsureConnectedWalletForSigning('Slush');
        if (!slushMsgConn || !slushMsgConn.wallet) {
          throw new Error('Slush extension not detected in this tab. Open Slush and retry.');
        }
      }

      if (!__wkNativeSignPersonalMessage) {
        throw new Error('Current wallet does not support personal message signing');
      }
      return await __wkNativeSignPersonalMessage(message);
    };

	    SuiWalletKit.signTransaction = async function signTransaction(txInput, options) {
        var onSubdomain = __skiIsSubdomainHost();
        var bypassBridgeForSlush = __skiShouldBypassBridgeForSlush(options);
        var mustUseBridge = !bypassBridgeForSlush && !!(onSubdomain || (options && options.forceSignBridge));
        var preferredWalletName = __skiResolvePreferredWalletNameForOperation(options);
	      if (__skiShouldUseBridge(options)) {
	        var bridgeError = null;
	        try {
	          return await __skiSignViaBridge(txInput, {}, options, preferredWalletName);
	        } catch (err) {
	          bridgeError = err;
	          console.warn('Sign bridge failed:', err && err.message ? err.message : err);
	        }

	        if (mustUseBridge) {
            if (
              !__wkIsUserRejection(bridgeError)
              && (
                __skiRequiresTopFrameSigning(bridgeError)
                || __skiIsBridgeWalletAvailabilityError(bridgeError)
              )
            ) {
              try {
                await __skiEnsureBridgeConnectionViaIframe(
                  preferredWalletName,
                  __skiResolveBridgeExpectedSender(options),
                );
                return await __skiSignViaBridge(txInput, {}, options, preferredWalletName);
              } catch (reconnectErr) {
                bridgeError = reconnectErr || bridgeError;
              }
            }
            if (
              __skiMaybeStartTopFrameHandoff(
                preferredWalletName,
                bridgeError,
                __skiResolveBridgeExpectedSender(options),
              )
            ) {
              throw new Error('Redirecting to top-frame wallet authorization...');
            }
	          throw bridgeError || new Error('Sign bridge failed. Reconnect wallet from sui.ski and retry.');
	        }

	        var reconnected = await __skiEnsureConnectedWalletForSigning(preferredWalletName);
	        if (reconnected && reconnected.wallet) {
	          // Continue into direct wallet signing flow below.
	        } else if (bridgeError) {
	          throw bridgeError;
	        }
	      }

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
