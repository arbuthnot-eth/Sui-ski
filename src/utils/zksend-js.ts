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
