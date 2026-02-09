const ZKSEND_CDN_URL = 'https://esm.sh/@mysten/zksend'

export function generateZkSendJs(): string {
	return `
    var __zkCdnUrl = ${JSON.stringify(ZKSEND_CDN_URL)};
    var __zkModule = null;

    async function __zkLoadModule() {
      if (__zkModule) return __zkModule;
      try {
        __zkModule = await import(__zkCdnUrl);
      } catch (e) {
        throw new Error('Failed to load @mysten/zksend from CDN. Check your network connection and try again.');
      }
      return __zkModule;
    }

    SuiWalletKit.createSendLink = async function createSendLink(options) {
      if (!options || !options.sender) throw new Error('createSendLink requires options.sender address');
      if (!options.client) throw new Error('createSendLink requires options.client (SuiClient instance)');

      var mod = await __zkLoadModule();
      var ZkSendLinkBuilder = mod.ZkSendLinkBuilder;
      if (!ZkSendLinkBuilder) throw new Error('@mysten/zksend module did not export ZkSendLinkBuilder');

      var link = new ZkSendLinkBuilder({
        sender: options.sender,
        client: options.client,
      });

      if (options.mist) {
        link.addClaimableMist(options.mist);
      }

      if (options.coins && options.coins.length > 0) {
        for (var i = 0; i < options.coins.length; i++) {
          link.addClaimableBalance(options.coins[i].coinType, options.coins[i].amount);
        }
      }

      if (options.objects && options.objects.length > 0) {
        for (var j = 0; j < options.objects.length; j++) {
          link.addClaimableObject(options.objects[j]);
        }
      }

      var tx = await link.createSendTransaction();
      return { tx: tx, link: link };
    };

    SuiWalletKit.loadClaimLink = async function loadClaimLink(url) {
      if (!url) throw new Error('loadClaimLink requires a zkSend claim URL');

      var mod = await __zkLoadModule();
      var ZkSendLink = mod.ZkSendLink;
      if (!ZkSendLink) throw new Error('@mysten/zksend module did not export ZkSendLink');

      var link = await ZkSendLink.fromUrl(url);
      return {
        link: link,
        assets: link.assets || { nfts: [], balances: [] },
      };
    };

    SuiWalletKit.claimLink = async function claimLink(url, recipientAddress) {
      if (!url) throw new Error('claimLink requires a zkSend claim URL');
      if (!recipientAddress) throw new Error('claimLink requires a recipient address');

      var mod = await __zkLoadModule();
      var ZkSendLink = mod.ZkSendLink;
      if (!ZkSendLink) throw new Error('@mysten/zksend module did not export ZkSendLink');

      var link = await ZkSendLink.fromUrl(url);
      return await link.claimAssets(recipientAddress);
    };
  `
}

export interface ZkSendUiConfig {
	getClientFn?: string
}

export function generateZkSendUiJs(config?: ZkSendUiConfig): string {
	const getClientFn = config?.getClientFn ?? 'getSuiClient'

	return `
    var __zkSendModalOpen = false;

    function __zkGetClient() {
      if (typeof ${getClientFn} === 'function') return ${getClientFn}();
      if (window.__suiClient) return window.__suiClient;
      return null;
    }

    function __zkGetSendModalHtml() {
      return '<div class="wk-modal-overlay" id="__zk-overlay">'
        + '<div class="wk-modal" style="max-width:440px;">'
        + '<div class="wk-modal-header">'
        + '<h3>Send via Link</h3>'
        + '<button class="wk-modal-close" id="__zk-close">\\u00D7</button>'
        + '</div>'
        + '<div style="padding:16px 20px;">'
        + '<div style="display:flex;gap:8px;margin-bottom:16px;">'
        + '<button class="__zk-tab __zk-tab-active" id="__zk-tab-sui" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(96,165,250,0.15);color:#60a5fa;font-family:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;">SUI</button>'
        + '<button class="__zk-tab" id="__zk-tab-nft" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);color:#71717a;font-family:inherit;font-size:0.85rem;font-weight:600;cursor:pointer;">NFT / Object</button>'
        + '</div>'
        + '<div id="__zk-panel-sui">'
        + '<label style="display:block;color:#a1a1aa;font-size:0.8rem;margin-bottom:6px;">Amount (SUI)</label>'
        + '<input type="number" id="__zk-amount" step="0.001" min="0" placeholder="0.00" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e4e4e7;font-family:inherit;font-size:0.95rem;box-sizing:border-box;" />'
        + '</div>'
        + '<div id="__zk-panel-nft" style="display:none;">'
        + '<label style="display:block;color:#a1a1aa;font-size:0.8rem;margin-bottom:6px;">Object ID</label>'
        + '<input type="text" id="__zk-object-id" placeholder="0x..." style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e4e4e7;font-family:inherit;font-size:0.95rem;box-sizing:border-box;" />'
        + '</div>'
        + '<button id="__zk-generate" style="width:100%;margin-top:16px;padding:12px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);border:none;border-radius:10px;color:#fff;font-family:inherit;font-size:0.9rem;font-weight:600;cursor:pointer;transition:opacity 0.15s;">Generate Link</button>'
        + '<div id="__zk-status" style="margin-top:12px;display:none;"></div>'
        + '<div id="__zk-result" style="margin-top:12px;display:none;"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    }

    function __zkShowStatus(msg, isError) {
      var el = document.getElementById('__zk-status');
      if (!el) return;
      el.style.display = 'block';
      el.style.color = isError ? '#f87171' : '#a1a1aa';
      el.style.fontSize = '0.85rem';
      el.style.textAlign = 'center';
      el.innerHTML = msg;
    }

    function __zkHideStatus() {
      var el = document.getElementById('__zk-status');
      if (el) el.style.display = 'none';
    }

    function __zkShowResult(url) {
      var el = document.getElementById('__zk-result');
      if (!el) return;
      el.style.display = 'block';
      el.innerHTML = '<div style="padding:12px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:8px;">'
        + '<div style="color:#34d399;font-size:0.8rem;font-weight:600;margin-bottom:8px;">Link Generated</div>'
        + '<div style="display:flex;gap:8px;align-items:center;">'
        + '<input type="text" readonly id="__zk-link-url" value="' + url.replace(/"/g, '&quot;') + '" style="flex:1;padding:8px 10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#e4e4e7;font-family:inherit;font-size:0.8rem;overflow:hidden;text-overflow:ellipsis;" />'
        + '<button id="__zk-copy-link" style="padding:8px 14px;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);border-radius:6px;color:#34d399;font-family:inherit;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;">Copy</button>'
        + '</div>'
        + '</div>';

      var copyBtn = document.getElementById('__zk-copy-link');
      if (copyBtn) {
        copyBtn.addEventListener('click', function() {
          var input = document.getElementById('__zk-link-url');
          if (input) navigator.clipboard.writeText(input.value).then(function() {
            copyBtn.textContent = 'Copied!';
            setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
          });
        });
      }
    }

    function __zkBindTabs() {
      var tabSui = document.getElementById('__zk-tab-sui');
      var tabNft = document.getElementById('__zk-tab-nft');
      var panelSui = document.getElementById('__zk-panel-sui');
      var panelNft = document.getElementById('__zk-panel-nft');
      if (!tabSui || !tabNft) return;

      tabSui.addEventListener('click', function() {
        tabSui.style.background = 'rgba(96,165,250,0.15)';
        tabSui.style.color = '#60a5fa';
        tabNft.style.background = 'rgba(255,255,255,0.03)';
        tabNft.style.color = '#71717a';
        if (panelSui) panelSui.style.display = 'block';
        if (panelNft) panelNft.style.display = 'none';
      });

      tabNft.addEventListener('click', function() {
        tabNft.style.background = 'rgba(96,165,250,0.15)';
        tabNft.style.color = '#60a5fa';
        tabSui.style.background = 'rgba(255,255,255,0.03)';
        tabSui.style.color = '#71717a';
        if (panelNft) panelNft.style.display = 'block';
        if (panelSui) panelSui.style.display = 'none';
      });
    }

    function __zkBindGenerate() {
      var btn = document.getElementById('__zk-generate');
      if (!btn) return;

      btn.addEventListener('click', async function() {
        var conn = SuiWalletKit.$connection.value;
        if (!conn || conn.status !== 'connected' || !conn.address) {
          __zkShowStatus('Connect your wallet first.', true);
          return;
        }

        var client = __zkGetClient();
        if (!client) {
          __zkShowStatus('SuiClient not available.', true);
          return;
        }

        var panelSui = document.getElementById('__zk-panel-sui');
        var isSuiTab = panelSui && panelSui.style.display !== 'none';

        var options = {
          sender: conn.address,
          client: client,
        };

        if (isSuiTab) {
          var amountInput = document.getElementById('__zk-amount');
          var suiAmount = amountInput ? parseFloat(amountInput.value) : 0;
          if (!suiAmount || suiAmount <= 0) {
            __zkShowStatus('Enter a valid SUI amount.', true);
            return;
          }
          options.mist = BigInt(Math.round(suiAmount * 1e9));
        } else {
          var objectInput = document.getElementById('__zk-object-id');
          var objectId = objectInput ? objectInput.value.trim() : '';
          if (!objectId || !objectId.startsWith('0x')) {
            __zkShowStatus('Enter a valid object ID starting with 0x.', true);
            return;
          }
          options.objects = [objectId];
        }

        __zkHideStatus();
        var resultEl = document.getElementById('__zk-result');
        if (resultEl) resultEl.style.display = 'none';

        btn.disabled = true;
        btn.textContent = 'Generating...';
        btn.style.opacity = '0.6';

        try {
          var result = await SuiWalletKit.createSendLink(options);
          var linkUrl = result.link.getLink();

          __zkShowStatus('Sign the transaction in your wallet...', false);
          await SuiWalletKit.signAndExecute(result.tx);

          __zkHideStatus();
          __zkShowResult(linkUrl);
        } catch (e) {
          __zkShowStatus(e.message || 'Failed to generate link.', true);
        } finally {
          btn.disabled = false;
          btn.textContent = 'Generate Link';
          btn.style.opacity = '1';
        }
      });
    }

    SuiWalletKit.openSendLinkModal = function openSendLinkModal(containerId) {
      var container = containerId ? document.getElementById(containerId) : null;
      if (!container) {
        container = document.getElementById('__zk-send-container');
        if (!container) {
          container = document.createElement('div');
          container.id = '__zk-send-container';
          document.body.appendChild(container);
        }
      }

      container.innerHTML = __zkGetSendModalHtml();
      __zkSendModalOpen = true;

      var overlay = document.getElementById('__zk-overlay');
      if (overlay) {
        overlay.classList.add('open');
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) SuiWalletKit.closeSendLinkModal();
        });
      }

      var closeBtn = document.getElementById('__zk-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          SuiWalletKit.closeSendLinkModal();
        });
      }

      __zkBindTabs();
      __zkBindGenerate();
    };

    SuiWalletKit.closeSendLinkModal = function closeSendLinkModal() {
      __zkSendModalOpen = false;
      var overlay = document.getElementById('__zk-overlay');
      if (overlay) overlay.classList.remove('open');
      var container = document.getElementById('__zk-send-container');
      if (container) container.innerHTML = '';
    };
  `
}

export function generateZkSendCss(): string {
	return `
		.send-tab-row {
			display: flex;
			gap: 0;
			margin-bottom: 14px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 10px;
			padding: 3px;
			border: 1px solid rgba(139, 92, 246, 0.12);
		}
		.send-tab-btn {
			flex: 1;
			padding: 8px 12px;
			border: none;
			border-radius: 8px;
			background: transparent;
			color: #64748b;
			font-family: var(--font-mono, ui-monospace, monospace);
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			letter-spacing: 0.02em;
		}
		.send-tab-btn.active {
			background: rgba(139, 92, 246, 0.18);
			color: #c4b5fd;
			box-shadow: 0 1px 4px rgba(139, 92, 246, 0.15);
		}
		.send-tab-btn:hover:not(.active) {
			color: #94a3b8;
			background: rgba(255, 255, 255, 0.03);
		}
		.send-tab-panel { display: block; }
		.send-tab-panel.hidden { display: none; }
		.zk-link-result {
			padding: 12px;
			background: rgba(52, 211, 153, 0.06);
			border: 1px solid rgba(52, 211, 153, 0.18);
			border-radius: 10px;
			margin-top: 10px;
		}
		.zk-link-result-label {
			font-size: 0.68rem;
			color: #34d399;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			margin-bottom: 8px;
		}
		.zk-link-row {
			display: flex;
			gap: 8px;
			align-items: center;
		}
		.zk-link-input {
			flex: 1;
			min-width: 0;
			padding: 8px 10px;
			background: rgba(0, 0, 0, 0.3);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 8px;
			color: #e4e4e7;
			font-family: var(--font-mono, ui-monospace, monospace);
			font-size: 0.72rem;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		.zk-copy-btn {
			padding: 8px 14px;
			background: rgba(52, 211, 153, 0.12);
			border: 1px solid rgba(52, 211, 153, 0.25);
			border-radius: 8px;
			color: #34d399;
			font-family: var(--font-mono, ui-monospace, monospace);
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			white-space: nowrap;
			transition: all 0.15s;
		}
		.zk-copy-btn:hover {
			background: rgba(52, 211, 153, 0.2);
			border-color: rgba(52, 211, 153, 0.4);
		}
	`
}
