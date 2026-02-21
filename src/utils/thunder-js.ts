export interface ThunderConfig {
	page: 'profile' | 'landing' | 'register'
	name?: string
	address?: string
	ownerAddress?: string
	nftId?: string
	expirationMs?: number
	linkedNames?: number
	serverScope?: 'owner' | 'name'
	network?: string
}

export function generateThunderJs(config: ThunderConfig): string {
	return `
		(function() {
			var CONFIG = ${JSON.stringify(config)};
			var OFFICIAL_MESSAGING_SDK_VERSION = '0.4.0';
			var OFFICIAL_SUI_SDK_VERSION = '2.4.0';
			var OFFICIAL_SEAL_SDK_VERSION = '1.0.1';
			var OFFICIAL_MESSAGING_SDK_URLS = [
				'https://esm.sh/gh/arbuthnot-eth/sui-stack-messaging-sdk@mainnet-messaging-v3.3-2026-02-16/packages/messaging',
				'https://cdn.jsdelivr.net/gh/arbuthnot-eth/sui-stack-messaging-sdk@mainnet-messaging-v3.3-2026-02-16/packages/messaging/dist/esm/index.js',
				'https://cdn.jsdelivr.net/gh/arbuthnot-eth/sui-stack-messaging-sdk@thunder-v1.0.0-2026-02-17/cdn/messaging-browser.mjs',
			];
			var OFFICIAL_SUI_CLIENT_URLS = [
				'https://esm.sh/@mysten/sui@' + OFFICIAL_SUI_SDK_VERSION + '/jsonRpc?bundle',
				'https://cdn.jsdelivr.net/npm/@mysten/sui@' + OFFICIAL_SUI_SDK_VERSION + '/dist/jsonRpc/index.mjs',
				'https://esm.sh/@mysten/sui@' + OFFICIAL_SUI_SDK_VERSION + '/graphql',
			];
			var OFFICIAL_SUI_TX_URLS = [
				'https://cdn.jsdelivr.net/npm/@mysten/sui@' + OFFICIAL_SUI_SDK_VERSION + '/transactions/+esm',
				'https://esm.sh/@mysten/sui@' + OFFICIAL_SUI_SDK_VERSION + '/transactions?bundle',
			];
			var OFFICIAL_SEAL_SDK_URLS = [
				'https://cdn.jsdelivr.net/npm/@mysten/seal@' + OFFICIAL_SEAL_SDK_VERSION + '/+esm',
				'https://esm.sh/@mysten/seal@' + OFFICIAL_SEAL_SDK_VERSION + '?bundle',
			];
			var OFFICIAL_GRAPHQL_URLS = {
				mainnet: 'https://graphql.mainnet.sui.io/graphql',
				testnet: 'https://graphql.testnet.sui.io/graphql',
				devnet: 'https://graphql.devnet.sui.io/graphql',
			};
			var OFFICIAL_RPC_URLS = {
				mainnet: 'https://fullnode.mainnet.sui.io:443',
				testnet: 'https://fullnode.testnet.sui.io:443',
				devnet: 'https://fullnode.devnet.sui.io:443',
			};
			var OFFICIAL_DEFAULT_SEAL_KEY_SERVERS = {
				mainnet: [
					{ objectId: '0x145540d931f182fef76467dd8074c9839aea126852d90d18e1556fcbbd1208b6', weight: 1 },
					{ objectId: '0x1afb3a57211ceff8f6781757821847e3ddae73f64e78ec8cd9349914ad985475', weight: 1 },
				],
				testnet: [
					{ objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', weight: 1 },
					{ objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', weight: 1 },
					{ objectId: '0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46', weight: 1 },
				],
				devnet: [],
			};
			var OFFICIAL_DEFAULT_WALRUS = {
				mainnet: {
					publisher: 'https://publisher.walrus.space',
					aggregator: 'https://aggregator.walrus.space',
				},
				testnet: {
					publisher: 'https://publisher.walrus-testnet.walrus.space',
					aggregator: 'https://aggregator.walrus-testnet.walrus.space',
				},
				devnet: {
					publisher: 'https://publisher.walrus-testnet.walrus.space',
					aggregator: 'https://aggregator.walrus-testnet.walrus.space',
				},
			};
			var OFFICIAL_CHANNEL_LIMIT = 32;
			var OFFICIAL_MESSAGE_LIMIT = 80;
			var SENDER_NAME_CACHE_TTL_MS = 5 * 60 * 1000;
			var SUI_NAME_CACHE_TTL_MS = 5 * 60 * 1000;
			var CHANNEL_META_CACHE_KEY_PREFIX = 'thunder-channel-meta';
			var POLL_INTERVAL = 5000;
			var activeChannel = '';
			var channels = [];
			var channelMessages = {};
			var messagesInitialLoadPending = false;
			var loadChannelsInFlight = false;
			var isOpen = false;
		var isSending = false;
		var pollTimer = null;
			var mutedState = { server: false, channel: false };
			var officialMessagingSdk = null;
			var officialMessagingSdkStatus = 'loading';
			var officialMessagingSdkLoadPromise = null;
			var officialSuiTxSdk = null;
			var officialSuiTxSdkLoadPromise = null;
			var officialMessagingClient = null;
			var officialMessagingClientLoadPromise = null;
			var officialMessagingRuntimeClient = null;
			var officialSealThreshold = 2;
			var officialMessagingSigner = null;
			var officialMessagingAddress = '';
			var officialMessagingPackageId = '';
			var officialStormConfig = null;
			var stormMappedChannelId = '';
			var stormNftType = '';
			var officialChannelStateById = {};
			var officialChannelCount = 0;
			var channelMetaById = {};
			var dismissedChannelIds = {};
			var channelCreatePending = false;
			var senderNameByAddress = {};
			var nameAddressCache = {};
			var senderNameOptions = [];
			var selectedSenderName = '';
			var senderNameFilter = '';
			var isAuthorPickerOpen = false;
			var firstChannelDefaultName = isOwnerScope() ? '' : (sanitizeSlug(normalizeName(CONFIG.name || '')) || '');
			var firstChannelDefaultNameResolved = false;
			var firstChannelDefaultNamePromise = null;
			var effectiveOwnerAddress = normalizeAddress(CONFIG.ownerAddress);
			var effectiveOwnerAddressResolved = false;
			var effectiveOwnerAddressPromise = null;
			var channelAcceptPending = false;
			var channelBurnPendingById = {};
			var showExtraPublicChannels = false;
			var localPurgeBeforeByChannelId = {};
				var joinRequestsByChannelId = {};
				var joinRequestLoadPendingByChannelId = {};
				var joinRequestCreatePendingByChannelId = {};
				var joinRequestApprovePendingById = {};
				var activeThreadTab = 'chat';
				var threadStateText = '';
				var threadStateWarn = false;
				var channelMembersByChannelId = {};
				var channelMembersLoadPendingByChannelId = {};
				var channelMemberRemovePendingByKey = {};

			var linkedCandidatesByChannelId = {};
			var linkedCandidateAddPendingByKey = {};

			var server = {
				id: '',
				name: 'sui-ski',
				displayName: 'sui.ski',
			ownerAddress: null,
			isModerator: false,
		};
		var moderation = { serverMuted: [], channelMuted: {} };

		function getWalletConnection() {
			if (typeof SuiWalletKit === 'undefined' || !SuiWalletKit.$connection) return null;
			return SuiWalletKit.$connection.value || null;
		}

		function isSubdomainSuiHost() {
			var host = String(window.location && window.location.hostname ? window.location.hostname : '').toLowerCase();
			return !!host && host !== 'sui.ski' && host.slice(-8) === '.sui.ski';
		}

		function isOwnerScope() {
			return String(CONFIG.serverScope || '') === 'owner';
		}

		function hasWalletSigner(conn) {
			return !!(conn && conn.wallet);
		}

		function normalizeAddress(value) {
			var raw = String(value || '').trim().toLowerCase();
			if (!raw) return '';
			if (raw.indexOf('0x') !== 0) raw = '0x' + raw;
			var hex = raw.slice(2);
			if (!hex || hex.length > 64 || /[^0-9a-f]/.test(hex)) return '';
			hex = hex.replace(/^0+/, '');
			if (!hex) return '';
			return '0x' + hex.padStart(64, '0');
		}

		function resolveAccountAddress(account) {
			if (!account) return '';
			if (typeof account.address === 'string') {
				var fromAddress = normalizeAddress(account.address);
				if (fromAddress) return fromAddress;
			}
			if (account.address && typeof account.address.toString === 'function') {
				var fromString = normalizeAddress(account.address.toString());
				if (fromString) return fromString;
			}
			if (account.publicKey && typeof account.publicKey.toSuiAddress === 'function') {
				try {
					var fromKey = normalizeAddress(account.publicKey.toSuiAddress());
					if (fromKey) return fromKey;
				} catch (_e) {}
			}
			return '';
		}

		function getWalletAddressFromConnection(conn) {
			if (!conn) return '';
			var fromConn = normalizeAddress(conn.address);
			if (fromConn) return fromConn;
			var fromAccount = resolveAccountAddress(conn.account);
			if (fromAccount) return fromAccount;
			var walletAccounts = conn.wallet && Array.isArray(conn.wallet.accounts) ? conn.wallet.accounts : [];
			for (var i = 0; i < walletAccounts.length; i++) {
				var nextAddress = resolveAccountAddress(walletAccounts[i]);
				if (nextAddress) return nextAddress;
			}
			return '';
		}

		function getWalletAccountByAddress(conn, address) {
			if (!conn) return null;
			var target = normalizeAddress(address);
			var currentAccount = conn.account || null;
			if (currentAccount) {
				var currentAddress = resolveAccountAddress(currentAccount);
				if (!target || currentAddress === target) return currentAccount;
			}
			var walletAccounts = conn.wallet && Array.isArray(conn.wallet.accounts) ? conn.wallet.accounts : [];
			if (!walletAccounts.length) return null;
			if (!target) return walletAccounts[0];
			for (var i = 0; i < walletAccounts.length; i++) {
				if (resolveAccountAddress(walletAccounts[i]) === target) return walletAccounts[i];
			}
			return null;
		}

		function canUseSessionSignBridge(conn) {
			if (!conn || !getWalletAddressFromConnection(conn)) return false;
			if (conn.status !== 'session') return false;
			if (!isSubdomainSuiHost()) return false;
			return true;
		}

		function getAddress() {
			var conn = getWalletConnection();
			var address = getWalletAddressFromConnection(conn);
			if (address) return address;
			return null;
		}

		function getPrimaryName() {
			if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.$connection) {
				var conn = SuiWalletKit.$connection.value;
				if (conn && conn.primaryName) return conn.primaryName;
			}
			return null;
		}

		function getSigningAddress() {
			var conn = getWalletConnection();
			if (!conn) return '';
			var address = getWalletAddressFromConnection(conn);
			if (!address) return '';
			if (hasWalletSigner(conn) || canUseSessionSignBridge(conn)) {
				return address;
			}
			return '';
		}

		async function ensureWalletSigningAddress() {
			var signingAddress = getSigningAddress();
			if (signingAddress) return signingAddress;
			if (typeof SuiWalletKit !== 'undefined' && typeof SuiWalletKit.autoReconnect === 'function') {
				try {
					await SuiWalletKit.autoReconnect();
				} catch (_e) {}
			}
			return getSigningAddress();
		}

		function sanitizeSlug(value) {
			return String(value || '')
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, '-')
				.replace(/-+/g, '-')
				.replace(/^-|-$/g, '')
				.slice(0, 48);
		}

		function normalizeName(value) {
			var clean = String(value || '').trim().toLowerCase();
			if (!clean) return '';
			return clean.replace(/\\.sui$/i, '').replace(/\\.sui\\.ski$/i, '');
		}

		function isProfileOwnerPrimaryConnected(currentAddress) {
			if (String(CONFIG.page || '') !== 'profile') return false;
			var ownerAddress = normalizeAddress(CONFIG.ownerAddress);
			if (!ownerAddress || !currentAddress || ownerAddress !== currentAddress) return false;
			var profileName = sanitizeSlug(CONFIG.name || '');
			if (!profileName) return false;
			var primaryName = normalizeName(getPrimaryName());
			if (!primaryName) return false;
			return sanitizeSlug(primaryName) === profileName;
		}

		function getConnectedPrimarySlug() {
			return sanitizeSlug(normalizeName(getPrimaryName()));
		}

		function getSenderNameStorageKey(address) {
			if (!address) return '';
			return 'thunder-sender-name:' + address;
		}

		function readStoredSenderName(address) {
			var key = getSenderNameStorageKey(address);
			if (!key || !window.localStorage) return '';
			try {
				return sanitizeSlug(normalizeName(window.localStorage.getItem(key) || ''));
			} catch (_e) {
				return '';
			}
		}

		function storeSenderName(address, name) {
			var key = getSenderNameStorageKey(address);
			if (!key || !window.localStorage) return;
			try {
				if (name) {
					window.localStorage.setItem(key, name);
				} else {
					window.localStorage.removeItem(key);
				}
			} catch (_e) {}
		}

		function ensureSelectedSenderName() {
			if (!senderNameOptions.length) {
				selectedSenderName = '';
				return;
			}
			var current = sanitizeSlug(normalizeName(selectedSenderName));
			if (current) {
				for (var i = 0; i < senderNameOptions.length; i++) {
					if (senderNameOptions[i] === current) {
						selectedSenderName = current;
						return;
					}
				}
			}
			selectedSenderName = senderNameOptions[0];
		}

		async function refreshSenderNameOptions() {
			var address = normalizeAddress(getAddress());
			if (!address) {
				senderNameOptions = [];
				selectedSenderName = '';
				senderNameFilter = '';
				isAuthorPickerOpen = false;
				renderComposerIdentity();
				return;
			}

			var primarySlug = sanitizeSlug(normalizeName(getPrimaryName()));
			var byName = {};

			try {
				var namesResp = await fetch('/api/names/' + encodeURIComponent(address), { credentials: 'include' });
				if (namesResp.ok) {
					var namesData = await namesResp.json();
					var names = Array.isArray(namesData && namesData.names) ? namesData.names : [];
					var nowMs = Date.now();
					for (var i = 0; i < names.length; i++) {
						var entry = names[i] || {};
						if (entry.expirationMs && Number(entry.expirationMs) <= nowMs) continue;
						var clean = sanitizeSlug(normalizeName(entry.name || ''));
						if (!clean) continue;
						if (!byName[clean]) byName[clean] = { isPrimary: false };
						if (entry.isPrimary) byName[clean].isPrimary = true;
					}
				}
			} catch (_e) {}

			if (primarySlug) {
				if (!byName[primarySlug]) byName[primarySlug] = { isPrimary: true };
				byName[primarySlug].isPrimary = true;
			}
			var next = Object.keys(byName);
			next.sort(function(a, b) {
				var aPrimary = !!(byName[a] && byName[a].isPrimary);
				var bPrimary = !!(byName[b] && byName[b].isPrimary);
				if (aPrimary && !bPrimary) return -1;
				if (!aPrimary && bPrimary) return 1;
				if (a < b) return -1;
				if (a > b) return 1;
				return 0;
			});

			senderNameOptions = next;
			var stored = readStoredSenderName(address);
			if (stored) {
				selectedSenderName = stored;
			} else if (!selectedSenderName) {
				selectedSenderName = primarySlug || getConnectedPrimarySlug();
			}
			ensureSelectedSenderName();
			storeSenderName(address, selectedSenderName);
			if (senderNameOptions.length <= 1) {
				isAuthorPickerOpen = false;
				senderNameFilter = '';
			}
			renderComposerIdentity();
		}

			function getActiveServerSlug() {
				var serverName = sanitizeSlug(normalizeName(server && server.name ? server.name : ''));
				if (serverName && serverName !== 'sui-ski') return serverName;
				var configName = sanitizeSlug(normalizeName(CONFIG.name || ''));
				return configName;
			}

			function getOwnerPrimarySlug() {
				var active = getActiveServerSlug();
				if (active) return active;
				var seeded = sanitizeSlug(normalizeName(firstChannelDefaultName || ''));
				if (seeded) return seeded;
				var canonical = sanitizeSlug(getCanonicalPublicChannelName() || '');
				return canonical;
			}

			function isOwnerPrimaryName(name) {
				var clean = sanitizeSlug(normalizeName(name || ''));
				if (!clean) return false;
				var ownerPrimary = getOwnerPrimarySlug();
				return !!ownerPrimary && clean === ownerPrimary;
			}

		function isConnectedOwnerPrimary(currentAddress) {
			var ownerAddress = normalizeAddress(server && server.ownerAddress ? server.ownerAddress : CONFIG.ownerAddress);
			if (!ownerAddress || !currentAddress || ownerAddress !== currentAddress) return false;
			var primarySlug = getConnectedPrimarySlug();
			if (!primarySlug) return false;
			var serverSlug = getActiveServerSlug();
			if (!serverSlug) return true;
			return primarySlug === serverSlug;
		}

		function getConnectedOwnerAddress() {
			return normalizeAddress(
				(server && server.ownerAddress ? server.ownerAddress : '')
					|| effectiveOwnerAddress
					|| CONFIG.ownerAddress,
			);
		}

		function isConnectedServerOwner() {
			var ownerAddress = getConnectedOwnerAddress();
			var connectedAddress = normalizeAddress(getAddress());
			return !!ownerAddress && !!connectedAddress && ownerAddress === connectedAddress;
		}

		function getMessagingServerQuery() {
			var query = [];
			var scope = isOwnerScope() ? 'owner' : 'name';
			var serverName = sanitizeSlug(
				CONFIG.name
				|| ((isOwnerScope() && firstChannelDefaultName) ? firstChannelDefaultName : '')
				|| (server && server.name ? server.name : ''),
			);
			var ownerAddress = getConnectedOwnerAddress() || normalizeAddress(CONFIG.ownerAddress);
			if (serverName && serverName !== 'sui-ski') {
				query.push('name=' + encodeURIComponent(serverName));
			}
			if (ownerAddress) query.push('owner=' + encodeURIComponent(ownerAddress));
			query.push('scope=' + encodeURIComponent(scope));
			return query.length ? ('?' + query.join('&')) : '';
		}

		function getMessagingServerApiPath(pathSuffix) {
			var suffix = String(pathSuffix || '').trim();
			if (suffix && suffix.charAt(0) !== '/') suffix = '/' + suffix;
			return '/api/app/messages/server' + suffix + getMessagingServerQuery();
		}

		function getProfileHostForNetwork() {
			var network = getNetwork();
			if (network === 'testnet') return 't.sui.ski';
			if (network === 'devnet') return 'd.sui.ski';
			return 'sui.ski';
		}

		function getAddressExplorerHref(address) {
			var normalized = normalizeAddress(address);
			if (!normalized) return '';
			var network = getNetwork();
			var networkPath = network === 'mainnet' ? 'mainnet' : network;
			return 'https://suiscan.xyz/' + networkPath + '/account/' + encodeURIComponent(normalized);
		}

		function buildSenderProfileHref(message) {
			var senderName = message && message.senderName ? sanitizeSlug(normalizeName(message.senderName)) : '';
			if (!senderName) return '';
			var host = getProfileHostForNetwork();
			var sourceName = sanitizeSlug(CONFIG.name || '');
			var sourcePage = String(CONFIG.page || '').trim().toLowerCase() || 'chat';
			var sourceChannel = sanitizeSlug(activeChannel || '');
			var sourceServer = sanitizeSlug(server && server.name ? server.name : '');
			var senderAddress = normalizeAddress(message && message.sender ? message.sender : '');
			var query = []
			query.push('via=thunder')
			query.push('source=' + encodeURIComponent(sourcePage))
			if (sourceName) query.push('from=' + encodeURIComponent(sourceName))
			if (sourceChannel) query.push('channel=' + encodeURIComponent(sourceChannel))
			if (sourceServer) query.push('server=' + encodeURIComponent(sourceServer))
			if (senderAddress) query.push('sender=' + encodeURIComponent(senderAddress))
			return 'https://' + encodeURIComponent(senderName) + '.' + host + (query.length ? '?' + query.join('&') : '')
		}

		function escapeHtml(str) {
			if (!str) return '';
			return String(str).replace(/[&<>"']/g, function(c) {
				switch(c) {
					case '&': return '&amp;';
					case '<': return '&lt;';
					case '>': return '&gt;';
					case '"': return '&quot;';
					case "'": return '&#39;';
					default: return c;
				}
			});
		}

		function formatTime(ts) {
			if (!ts) return '';
			var date = new Date(ts);
			var hours = date.getHours();
			var minutes = date.getMinutes();
			return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
		}

		function truncateAddress(addr) {
			if (!addr) return '';
			if (addr.length < 12) return addr;
			return addr.slice(0, 6) + '...' + addr.slice(-4);
		}

		function buildSkiMessagePayload(content, authorName) {
			var text = String(content || '');
			var authorSlug = sanitizeSlug(normalizeName(authorName || ''));
			if (!authorSlug) return text;
			return '.SKI:' + JSON.stringify({
				v: 1,
				a: authorSlug + '.sui',
				t: text,
			});
		}

		function parseSkiMessagePayload(raw) {
			var text = String(raw || '');
			if (text.indexOf('.SKI:') !== 0) {
				return { content: text, claimedAuthor: '' };
			}
			try {
				var parsed = JSON.parse(text.slice(5));
				var claimed = sanitizeSlug(normalizeName(parsed && parsed.a ? parsed.a : ''));
				var content = parsed && typeof parsed.t === 'string' ? parsed.t : '';
				return { content: content || '', claimedAuthor: claimed };
			} catch (_e) {
				return { content: text, claimedAuthor: '' };
			}
		}

		function getChannelMetaStorageKey() {
			if (isOwnerScope() && CONFIG.ownerAddress) {
				var ownerKey = normalizeAddress(CONFIG.ownerAddress);
				if (ownerKey) return CHANNEL_META_CACHE_KEY_PREFIX + ':' + getNetwork() + ':owner:' + ownerKey;
			}
			var scope = sanitizeSlug(normalizeName(CONFIG.name || server.name || 'sui-ski')) || 'sui-ski';
			return CHANNEL_META_CACHE_KEY_PREFIX + ':' + getNetwork() + ':' + scope;
		}

		function normalizeChannelMetaKey(channelId) {
			var raw = String(channelId || '').trim();
			if (!raw) return '';
			return raw.toLowerCase();
		}

		function loadStoredChannelMeta() {
			channelMetaById = {};
			if (!window.localStorage) return;
			try {
				var raw = window.localStorage.getItem(getChannelMetaStorageKey());
				if (!raw) return;
				var parsed = JSON.parse(raw);
				if (!parsed || typeof parsed !== 'object') return;
				channelMetaById = parsed;
			} catch (_e) {
				channelMetaById = {};
			}
		}

		function persistStoredChannelMeta() {
			if (!window.localStorage) return;
			try {
				window.localStorage.setItem(getChannelMetaStorageKey(), JSON.stringify(channelMetaById || {}));
			} catch (_e) {}
		}

		function getStoredChannelMeta(channelId) {
			if (!channelMetaById || typeof channelMetaById !== 'object') return null;
			var key = normalizeChannelMetaKey(channelId);
			if (!key) return null;
			var meta = channelMetaById[key];
			if (!meta) {
				var legacyKey = String(channelId || '').trim();
				if (legacyKey && channelMetaById[legacyKey]) {
					meta = channelMetaById[legacyKey];
					channelMetaById[key] = meta;
					delete channelMetaById[legacyKey];
					persistStoredChannelMeta();
				}
			}
			if (!meta || typeof meta !== 'object') return null;
			var name = sanitizeSlug(meta.name || '');
			var visibility = meta.visibility === 'private' ? 'private' : 'public';
			return { name: name, visibility: visibility };
		}

		function setStoredChannelMeta(channelId, name, visibility) {
			var key = normalizeChannelMetaKey(channelId);
			if (!key) return;
			var cleanName = sanitizeSlug(name || '');
			var cleanVisibility = visibility === 'private' ? 'private' : 'public';
			channelMetaById[key] = {
				name: cleanName,
				visibility: cleanVisibility,
			};
			persistStoredChannelMeta();
		}

		function removeStoredChannelMeta(channelId) {
			var key = normalizeChannelMetaKey(channelId);
			if (!key) return;
			if (!channelMetaById || typeof channelMetaById !== 'object') return;
			if (!Object.prototype.hasOwnProperty.call(channelMetaById, key)) return;
			delete channelMetaById[key];
			persistStoredChannelMeta();
		}

		function getDismissedStorageKey() {
			if (isOwnerScope() && CONFIG.ownerAddress) {
				var ownerKey = normalizeAddress(CONFIG.ownerAddress);
				if (ownerKey) return 'thunder-dismissed:' + getNetwork() + ':owner:' + ownerKey;
			}
			var scope = sanitizeSlug(normalizeName(CONFIG.name || server.name || 'sui-ski')) || 'sui-ski';
			return 'thunder-dismissed:' + getNetwork() + ':' + scope;
		}

		function loadDismissedChannels() {
			dismissedChannelIds = {};
			if (!window.localStorage) return;
			try {
				var raw = window.localStorage.getItem(getDismissedStorageKey());
				if (!raw) return;
				var parsed = JSON.parse(raw);
				if (!parsed || typeof parsed !== 'object') return;
				dismissedChannelIds = parsed;
			} catch (_e) {
				dismissedChannelIds = {};
			}
		}

		function persistDismissedChannels() {
			if (!window.localStorage) return;
			try {
				window.localStorage.setItem(getDismissedStorageKey(), JSON.stringify(dismissedChannelIds || {}));
			} catch (_e) {}
		}

		function dismissChannelById(onChainChannelId) {
			var key = String(onChainChannelId || '').trim().toLowerCase();
			if (!key) return;
			dismissedChannelIds[key] = 1;
			persistDismissedChannels();
		}

		function isChannelDismissed(onChainChannelId) {
			var key = String(onChainChannelId || '').trim().toLowerCase();
			return !!key && !!dismissedChannelIds[key];
		}

		function getCanonicalPublicChannelName() {
			return sanitizeSlug(normalizeName(CONFIG.name || ''))
				|| sanitizeSlug(firstChannelDefaultName || '')
				|| 'public';
		}

		function getCanonicalPublicChannelId() {
			if (stormMappedChannelId) {
				for (var i = 0; i < channels.length; i++) {
					var mappedChannel = channels[i];
					if (!mappedChannel || mappedChannel.encrypted || !isOfficialChannel(mappedChannel)) continue;
					var mappedState = getOfficialChannelState(mappedChannel.id);
					if (!mappedState) continue;
					if (normalizeAddress(mappedState.channelId) === normalizeAddress(stormMappedChannelId)) {
						return String(mappedChannel.id || '');
					}
				}
			}
			var canonicalName = getCanonicalPublicChannelName();
			if (canonicalName) {
				for (var j = 0; j < channels.length; j++) {
					var channel = channels[j];
					if (!channel || channel.encrypted || !isOfficialChannel(channel)) continue;
					var slug = sanitizeSlug((channel.name) || (channel.id) || '');
					if (slug === canonicalName) return String(channel.id || '');
				}
			}
			for (var k = 0; k < channels.length; k++) {
				var ch = channels[k];
				if (!ch || ch.encrypted || !isOfficialChannel(ch)) continue;
				return String(ch.id || '');
			}
			return '';
		}

		function isCanonicalPublicChannel(channel) {
			if (!channel || channel.encrypted) return false;
			var canonical = getCanonicalPublicChannelName();
			if (canonical) {
				var current = sanitizeSlug((channel.name) || (channel.id) || '');
				if (current === canonical) return true;
			}
			if (isOfficialChannel(channel)) {
				var canonicalId = getCanonicalPublicChannelId();
				return !!canonicalId && String(channel.id || '') === canonicalId;
			}
			return false;
		}

		function migrateChannelMetaToOwnerScope() {
			if (!isOwnerScope() || !CONFIG.ownerAddress || !window.localStorage) return;
			var legacyScope = sanitizeSlug(normalizeName(CONFIG.name || ''));
			if (!legacyScope) return;
			var legacyKey = CHANNEL_META_CACHE_KEY_PREFIX + ':' + getNetwork() + ':' + legacyScope;
			var ownerKey = getChannelMetaStorageKey();
			if (legacyKey === ownerKey) return;
			try {
				var legacyRaw = window.localStorage.getItem(legacyKey);
				if (!legacyRaw) return;
				var legacyParsed = JSON.parse(legacyRaw);
				if (!legacyParsed || typeof legacyParsed !== 'object') return;
				for (var k in legacyParsed) {
					if (!legacyParsed.hasOwnProperty(k)) continue;
					if (!channelMetaById[k]) channelMetaById[k] = legacyParsed[k];
				}
				persistStoredChannelMeta();
				window.localStorage.removeItem(legacyKey);
			} catch (_e) {}
		}

		function getCachedSenderName(address) {
			var key = normalizeAddress(address);
			if (!key) return null;
			var existing = senderNameByAddress[key];
			if (!existing) return null;
			if (!isFinite(existing.expiresAt) || existing.expiresAt < Date.now()) {
				delete senderNameByAddress[key];
				return null;
			}
			return String(existing.name || '');
		}

		async function resolvePrimaryNameForAddress(address) {
			var normalized = normalizeAddress(address);
			if (!normalized || normalized.indexOf('0x') !== 0) return '';
			var cached = getCachedSenderName(normalized);
			if (cached !== null) return cached;
			try {
				var response = await fetch('/api/names/' + encodeURIComponent(normalized), { credentials: 'include' });
				if (!response.ok) throw new Error('Name lookup failed');
				var data = await response.json();
				var names = Array.isArray(data && data.names) ? data.names : [];
				var primary = '';
				for (var i = 0; i < names.length; i++) {
					var entry = names[i] || {};
					var clean = sanitizeSlug(normalizeName(entry.name || ''));
					if (!clean) continue;
					if (entry.isPrimary) {
						primary = clean;
						break;
					}
					if (!primary) primary = clean;
				}
				senderNameByAddress[normalized] = {
					name: primary,
					expiresAt: Date.now() + SENDER_NAME_CACHE_TTL_MS,
				};
				return primary;
			} catch (_e) {
				senderNameByAddress[normalized] = {
					name: '',
					expiresAt: Date.now() + 30 * 1000,
				};
				return '';
			}
		}

		async function resolveAddressForSuiName(name) {
			var clean = sanitizeSlug(normalizeName(name));
			if (!clean) return '';
			var cached = nameAddressCache[clean];
			if (cached && isFinite(cached.expiresAt) && cached.expiresAt >= Date.now()) {
				return normalizeAddress(cached.address);
			}
			try {
				var response = await fetch('/api/resolve?name=' + encodeURIComponent(clean), { credentials: 'include' });
				if (!response.ok) throw new Error('resolve failed');
				var data = await response.json();
				var resolved = normalizeAddress(
					data && data.data
						? (data.data.address || data.data.ownerAddress || '')
						: '',
				);
				nameAddressCache[clean] = {
					address: resolved,
					expiresAt: Date.now() + SUI_NAME_CACHE_TTL_MS,
				};
				return resolved;
			} catch (_e) {
				nameAddressCache[clean] = {
					address: '',
					expiresAt: Date.now() + 30 * 1000,
				};
				return '';
			}
		}

		async function resolveLinkedTargetAddresses(address) {
			var owner = normalizeAddress(address);
			if (!owner) {
				return {
					addresses: [],
					truncated: 0,
					sharedAddress: '',
					linkedCount: 0,
				};
			}
			return {
				addresses: [],
				truncated: 0,
				sharedAddress: owner,
				linkedCount: 0,
			};
		}

		async function resolveMarketplaceSellerAddressForProfile() {
			var profileSlug = sanitizeSlug(normalizeName(CONFIG.name || ''));
			if (!profileSlug) return '';
			try {
				var response = await fetch('/api/marketplace/' + encodeURIComponent(profileSlug), { credentials: 'include' });
				if (!response.ok) return '';
				var data = await response.json();
				var nfts = Array.isArray(data && data.nfts) ? data.nfts : [];
				for (var i = 0; i < nfts.length; i++) {
					var listings = Array.isArray(nfts[i] && nfts[i].listings) ? nfts[i].listings : [];
					for (var j = 0; j < listings.length; j++) {
						var seller = normalizeAddress(listings[j] && listings[j].seller ? listings[j].seller : '');
						if (!seller) continue;
						if (seller.indexOf('0x') !== 0) continue;
						return seller;
					}
				}
			} catch (_e) {}
			return '';
		}

		async function resolveFirstChannelDefaultName() {
			if (firstChannelDefaultNameResolved && firstChannelDefaultName) return firstChannelDefaultName;
			if (firstChannelDefaultNamePromise) return firstChannelDefaultNamePromise;
			firstChannelDefaultNamePromise = (async function() {
				var candidates = [];
				function addCandidate(address) {
					var normalized = normalizeAddress(address);
					if (!normalized || normalized.indexOf('0x') !== 0) return;
					if (candidates.indexOf(normalized) !== -1) return;
					candidates.push(normalized);
				}
				addCandidate(getConnectedOwnerAddress());
				addCandidate(getAddress());
				addCandidate(await resolveMarketplaceSellerAddressForProfile());

				for (var i = 0; i < candidates.length; i++) {
					var resolved = await resolvePrimaryNameForAddress(candidates[i]);
					if (resolved) return resolved;
				}
				if (firstChannelDefaultName) return firstChannelDefaultName;
				return 'public';
			})()
				.then(function(result) {
					var clean = sanitizeSlug(normalizeName(result || '')) || 'public';
					firstChannelDefaultName = clean;
					firstChannelDefaultNameResolved = true;
					return clean;
				})
				.catch(function() {
					firstChannelDefaultNameResolved = true;
					if (!firstChannelDefaultName) firstChannelDefaultName = 'public';
					return firstChannelDefaultName;
				})
				.finally(function() {
					firstChannelDefaultNamePromise = null;
				});
			return firstChannelDefaultNamePromise;
		}

		async function resolveEffectiveOwnerAddress() {
			if (effectiveOwnerAddressResolved) return effectiveOwnerAddress;
			if (effectiveOwnerAddressPromise) return effectiveOwnerAddressPromise;
			effectiveOwnerAddressPromise = (async function() {
				var configuredOwner = normalizeAddress(CONFIG.ownerAddress);
				var connected = normalizeAddress(getAddress());
				var listingSeller = normalizeAddress(await resolveMarketplaceSellerAddressForProfile());
				if (connected && listingSeller && connected === listingSeller) return connected;
				return configuredOwner || listingSeller || connected || '';
			})()
				.then(function(result) {
					effectiveOwnerAddress = normalizeAddress(result);
					effectiveOwnerAddressResolved = true;
					return effectiveOwnerAddress;
				})
				.catch(function() {
					effectiveOwnerAddressResolved = true;
					return effectiveOwnerAddress;
				})
				.finally(function() {
					effectiveOwnerAddressPromise = null;
				});
			return effectiveOwnerAddressPromise;
		}

			function getSdkLabel() {
				if (officialMessagingSdkStatus === 'ready') {
					var channelLabel = officialChannelCount > 0 ? ' · ' + officialChannelCount + ' on-chain' : '';
					return 'SDK @mysten/messaging v' + OFFICIAL_MESSAGING_SDK_VERSION + channelLabel;
				}
				if (officialMessagingSdkStatus === 'unavailable') return 'SDK unavailable';
				return 'SDK loading';
			}

		function normalizeOfficialMessagingSdk(mod) {
			var direct = mod && typeof mod === 'object' ? mod : null;
			if (!direct) return null;
			var def = direct.default && typeof direct.default === 'object' ? direct.default : null;
			var candidate = direct;
			if ((!candidate.messaging && !candidate.SuiStackMessagingClient) && def) {
				candidate = def;
			}
			var clientCtor = candidate && candidate.SuiStackMessagingClient
				? candidate.SuiStackMessagingClient
				: (def && def.SuiStackMessagingClient ? def.SuiStackMessagingClient : null);
			var messagingExt = candidate && typeof candidate.messaging === 'function'
				? candidate.messaging
				: (def && typeof def.messaging === 'function' ? def.messaging : null);
			if (!messagingExt && clientCtor && typeof clientCtor.experimental_asClientExtension === 'function') {
				messagingExt = function(options) {
					return clientCtor.experimental_asClientExtension(options);
				};
			}
			if (!clientCtor || typeof messagingExt !== 'function') return null;
			var normalized = {};
			for (var key in candidate) normalized[key] = candidate[key];
			normalized.SuiStackMessagingClient = clientCtor;
			normalized.messaging = messagingExt;
			return normalized;
		}

		function ensureOfficialMessagingSdk() {
			if (officialMessagingSdk && typeof officialMessagingSdk.messaging === 'function') {
				return Promise.resolve(officialMessagingSdk);
			}
			if (officialMessagingSdkLoadPromise) return officialMessagingSdkLoadPromise;
			var existing = normalizeOfficialMessagingSdk(window.__suiStackMessagingSdk);
			if (existing) {
				officialMessagingSdk = existing;
				officialMessagingSdkStatus = 'ready';
				window.__suiStackMessagingSdk = existing;
				return Promise.resolve(officialMessagingSdk);
			}
			officialMessagingSdkLoadPromise = importFirstAvailable(OFFICIAL_MESSAGING_SDK_URLS)
				.then(function(mod) {
					var resolved = normalizeOfficialMessagingSdk(mod);
					if (!resolved) {
						throw new Error('Official SDK did not expose messaging extension');
					}
					officialMessagingSdk = resolved;
					officialMessagingSdkStatus = 'ready';
					window.__suiStackMessagingSdk = resolved;
					window.__suiStackMessagingSdkVersion = OFFICIAL_MESSAGING_SDK_VERSION;
					renderServerHeader();
					return resolved;
				})
				.catch(function(error) {
					console.warn('Failed to load official Sui Stack Messaging SDK:', error);
					officialMessagingSdkStatus = 'unavailable';
					renderServerHeader();
					return null;
				});
				return officialMessagingSdkLoadPromise;
			}

			function ensureOfficialSuiTransactionSdk() {
				if (officialSuiTxSdk) return Promise.resolve(officialSuiTxSdk);
				if (officialSuiTxSdkLoadPromise) return officialSuiTxSdkLoadPromise;
				officialSuiTxSdkLoadPromise = importFirstAvailable(OFFICIAL_SUI_TX_URLS)
					.then(function(mod) {
						var txCtor = mod && (mod.Transaction || mod.TransactionBlock);
						if (!txCtor) {
							throw new Error('Sui transactions module did not expose Transaction');
						}
						officialSuiTxSdk = mod;
						return mod;
					})
					.catch(function(error) {
						console.warn('Failed to load Sui transactions SDK module:', error);
						officialSuiTxSdk = null;
						return null;
					})
					.finally(function() {
						officialSuiTxSdkLoadPromise = null;
					});
				return officialSuiTxSdkLoadPromise;
			}

			function importFirstAvailable(urls) {
				return (async function() {
					var lastError = null;
					for (var i = 0; i < urls.length; i++) {
						var url = String(urls[i] || '');
						if (!url) continue;
						try {
							return await import(url);
						} catch (error) {
							lastError = error;
						}
					}
					if (lastError) throw lastError;
					throw new Error('No import URLs configured');
				})();
			}

			function getModuleExport(mod, exportName) {
				if (!mod || typeof mod !== 'object') return null;
				if (mod[exportName]) return mod[exportName];
				var def = mod.default && typeof mod.default === 'object' ? mod.default : null;
				if (def && def[exportName]) return def[exportName];
				return null;
			}

			function resolveSuiClientCtor(mod) {
				return getModuleExport(mod, 'SuiClient')
					|| getModuleExport(mod, 'SuiGraphQLClient')
					|| getModuleExport(mod, 'SuiJsonRpcClient')
					|| null;
			}

			function importFirstSuiClientModule(urls) {
				return (async function() {
					var lastError = null;
					for (var i = 0; i < urls.length; i++) {
						var url = String(urls[i] || '');
						if (!url) continue;
						try {
							var mod = await import(url);
							if (resolveSuiClientCtor(mod)) return mod;
							lastError = new Error('Loaded Sui module without client constructor: ' + url);
						} catch (error) {
							lastError = error;
						}
					}
					if (lastError) throw lastError;
					throw new Error('No Sui client import URLs configured');
				})();
			}

			function getNetwork() {
				var network = String(CONFIG.network || 'mainnet').trim().toLowerCase();
				if (network !== 'mainnet' && network !== 'testnet' && network !== 'devnet') return 'mainnet';
				return network;
			}

			function getRpcUrlForNetwork(network) {
				if (network === 'testnet') return OFFICIAL_RPC_URLS.testnet;
				if (network === 'devnet') return OFFICIAL_RPC_URLS.devnet;
				return OFFICIAL_RPC_URLS.mainnet;
			}

			function getGraphqlUrlForNetwork(network) {
				if (network === 'testnet') return OFFICIAL_GRAPHQL_URLS.testnet;
				if (network === 'devnet') return OFFICIAL_GRAPHQL_URLS.devnet;
				return OFFICIAL_GRAPHQL_URLS.mainnet;
			}

		function getMessagingPackageId() {
			if (officialMessagingPackageId) return officialMessagingPackageId;
			return getNetwork() === 'mainnet'
				? '0xbcdf77f551f12be0fa61d1eb7bb2ff4169c1587aaa86fab84d95213cc75139f9'
				: '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d';
		}

		function toUint8Array(value) {
			if (!value) return new Uint8Array(0);
			if (value instanceof Uint8Array) return value;
			if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value)) {
				return new Uint8Array(value.buffer, value.byteOffset || 0, value.byteLength || 0);
			}
			if (value instanceof ArrayBuffer) return new Uint8Array(value);
			if (Array.isArray(value)) return Uint8Array.from(value);
				if (typeof value === 'string') {
					var normalized = value.trim().replace(/^0x/i, '');
					if (normalized && normalized.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(normalized)) {
						var out = new Uint8Array(normalized.length / 2);
						for (var i = 0; i < out.length; i++) {
							out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
						}
						return out;
					}
				}
			return new Uint8Array(0);
		}

		function toExactArrayBuffer(value) {
			var bytes = toUint8Array(value);
			if (!bytes.length) return null;
			if (bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength) {
				return bytes.buffer;
			}
			return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
		}

		function toBase64Bytes(value) {
			var bytes = toUint8Array(value);
			if (!bytes.length) return '';
			var CHUNK = 8192;
			var parts = [];
			for (var i = 0; i < bytes.length; i += CHUNK) {
				parts.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK, bytes.length))));
			}
			return btoa(parts.join(''));
		}

		function bytesToHex(value) {
			var bytes = toUint8Array(value);
			if (!bytes.length) return '';
			var hex = '';
			for (var i = 0; i < bytes.length; i++) {
				var part = bytes[i].toString(16);
				if (part.length < 2) part = '0' + part;
				hex += part;
			}
			return '0x' + hex;
		}

		function hexToBytes(value) {
			var raw = String(value || '').trim().toLowerCase().replace(/^0x/, '');
			if (!raw || raw.length % 2 !== 0 || /[^0-9a-f]/.test(raw)) return new Uint8Array(0);
			var out = new Uint8Array(raw.length / 2);
			for (var i = 0; i < out.length; i++) {
				out[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
			}
			return out;
		}

		function concatBytes(parts) {
			var list = Array.isArray(parts) ? parts : [];
			var total = 0;
			for (var i = 0; i < list.length; i++) total += toUint8Array(list[i]).length;
			if (!total) return new Uint8Array(0);
			var out = new Uint8Array(total);
			var offset = 0;
			for (var j = 0; j < list.length; j++) {
				var next = toUint8Array(list[j]);
				if (!next.length) continue;
				out.set(next, offset);
				offset += next.length;
			}
			return out;
		}

		function randomBytes(length) {
			var size = Number(length || 0);
			if (!isFinite(size) || size <= 0) return new Uint8Array(0);
			var out = new Uint8Array(Math.floor(size));
			if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') return out;
			window.crypto.getRandomValues(out);
			return out;
		}

		function fromBase64String(value) {
			var clean = String(value || '').trim().replace(/\\s+/g, '');
			if (!clean || clean.length % 4 !== 0) return new Uint8Array(0);
			if (!/^[A-Za-z0-9+/=]+$/.test(clean)) return new Uint8Array(0);
			try {
				var binary = atob(clean);
				var out = new Uint8Array(binary.length);
				for (var i = 0; i < binary.length; i++) {
					out[i] = binary.charCodeAt(i);
				}
				return out;
			} catch (_e) {
				return new Uint8Array(0);
			}
		}

		function toMessageBytes(value, depth) {
			var level = Number(depth || 0);
			if (level > 4) return new Uint8Array(0);
			if (value == null) return new Uint8Array(0);
			var direct = toUint8Array(value);
			if (direct.length) return direct;

			if (typeof value === 'string') {
				var text = String(value);
				var trimmed = text.trim();
				if (!trimmed) return new Uint8Array(0);
				var b64 = fromBase64String(trimmed);
				if (b64.length) return b64;
				try {
					return new TextEncoder().encode(text);
				} catch (_e) {
					return new Uint8Array(0);
				}
			}

			if (typeof value === 'object') {
				var obj = value;
				if (Array.isArray(obj.data)) {
					var fromData = toUint8Array(obj.data);
					if (fromData.length) return fromData;
				}
				var keys = ['message', 'bytes', 'data', 'buffer', 'value', 'payload'];
				for (var k = 0; k < keys.length; k++) {
					if (!Object.prototype.hasOwnProperty.call(obj, keys[k])) continue;
					var nested = toMessageBytes(obj[keys[k]], level + 1);
					if (nested.length) return nested;
				}
				if (obj && typeof obj.toBytes === 'function') {
					try {
						var viaToBytes = toMessageBytes(obj.toBytes(), level + 1);
						if (viaToBytes.length) return viaToBytes;
					} catch (_e2) {}
				}
				if (obj && typeof obj.toRawBytes === 'function') {
					try {
						var viaRaw = toMessageBytes(obj.toRawBytes(), level + 1);
						if (viaRaw.length) return viaRaw;
					} catch (_e3) {}
				}
				if (obj && typeof obj.toSuiBytes === 'function') {
					try {
						var viaSui = toMessageBytes(obj.toSuiBytes(), level + 1);
						if (viaSui.length) return viaSui;
					} catch (_e4) {}
				}
			}

			return new Uint8Array(0);
		}

		function normalizeSignPersonalMessageResult(result, messageBytes) {
			var first = Array.isArray(result) ? result[0] : result;
			if (!first) return first;
			var messageB64 = toBase64Bytes(messageBytes);
			if (typeof first === 'string') {
				return {
					bytes: messageB64,
					signature: first,
				};
			}
			if (first.signature && typeof first.signature === 'object' && typeof first.signature.signature === 'string') {
				return {
					bytes: String(first.bytes || first.messageBytes || messageB64),
					signature: first.signature.signature,
				};
			}
			if (first.signature && typeof first.signature !== 'string') {
				var signatureB64 = toBase64Bytes(first.signature);
				if (signatureB64) {
					return {
						bytes: String(first.bytes || first.messageBytes || messageB64),
						signature: signatureB64,
					};
				}
			}
			if (typeof first.signature === 'string') {
				if (!first.bytes && !first.messageBytes && messageB64) {
					first.bytes = messageB64;
				}
				return first;
			}
			if (typeof first.serializedSignature === 'string') {
				return {
					bytes: String(first.bytes || first.messageBytes || messageB64),
					signature: first.serializedSignature,
				};
			}
			return first;
		}

		function extractEncryptedKeyFromChannelObject(channelObject) {
			if (!channelObject || typeof channelObject !== 'object') return null;
			var history = channelObject.encryption_key_history
				|| channelObject.encryptionKeyHistory
				|| (channelObject.content && channelObject.content.fields
					? (channelObject.content.fields.encryption_key_history || channelObject.content.fields.encryptionKeyHistory)
					: null)
				|| null;
			if (history && history.fields) history = history.fields;
			if (!history || typeof history !== 'object') return null;
			var latestRaw = history.latest;
			if (!latestRaw && history.fields) latestRaw = history.fields.latest;
			var latestBytes = toUint8Array(latestRaw);
			if (!latestBytes.length && typeof latestRaw === 'string') {
				latestBytes = fromBase64String(latestRaw);
			}
			if (!latestBytes.length) return null;
			var historyVersion = Number(
				history.latest_version != null
					? history.latest_version
					: history.latestVersion != null
						? history.latestVersion
						: history.fields && history.fields.latest_version != null
							? history.fields.latest_version
							: 0,
			);
			return {
				$kind: 'Encrypted',
				encryptedBytes: latestBytes,
				version: historyVersion,
			};
		}

		function extractPermissionTypeName(entry) {
			if (!entry) return '';
			if (typeof entry === 'string') return entry;
			if (entry.name && typeof entry.name === 'string') return entry.name;
			if (entry.typeName && typeof entry.typeName === 'string') return entry.typeName;
			if (entry.fields && typeof entry.fields.name === 'string') return entry.fields.name;
			return '';
		}

		function channelHasEditEncryptionPermission(channelObject, memberCapId) {
			if (!channelObject || !memberCapId) return false;
			var auth = channelObject.auth && typeof channelObject.auth === 'object'
				? channelObject.auth
				: (channelObject.content && channelObject.content.fields && channelObject.content.fields.auth
					? channelObject.content.fields.auth
					: null);
			if (!auth) return false;
			var memberPermissions = auth.member_permissions || auth.memberPermissions || null;
			if (memberPermissions && memberPermissions.fields) memberPermissions = memberPermissions.fields;
			var entries = memberPermissions && Array.isArray(memberPermissions.contents)
				? memberPermissions.contents
				: [];
			if (!entries.length) return false;
			var target = normalizeAddress(memberCapId);
			for (var i = 0; i < entries.length; i++) {
				var item = entries[i] || {};
				var keyRaw = String(
					item.key
					|| (item.fields ? item.fields.key : '')
					|| '',
				).trim();
				var key = normalizeAddress(keyRaw);
				if (!key || key !== target) continue;
				var value = item.value || (item.fields ? item.fields.value : {}) || {};
				if (value && value.fields) value = value.fields;
				var permissionSet = value && value.contents && Array.isArray(value.contents)
					? value.contents
					: (Array.isArray(value) ? value : []);
				for (var j = 0; j < permissionSet.length; j++) {
					var typeName = String(extractPermissionTypeName(permissionSet[j]) || '').toLowerCase();
					if (!typeName) continue;
					if (typeName.indexOf('::encryption_key_history::editencryptionkey') !== -1) return true;
				}
				return false;
			}
			return false;
		}

		function getWalletPublicKeyBytes() {
			if (typeof SuiWalletKit === 'undefined' || !SuiWalletKit.$connection) return new Uint8Array(32);
			var conn = SuiWalletKit.$connection.value;
				var account = conn && conn.account;
				if (!account || !account.publicKey) return new Uint8Array(32);
				var key = account.publicKey;
				try {
					if (key && typeof key.toSuiBytes === 'function') {
						return toUint8Array(key.toSuiBytes());
					}
					if (key && typeof key.toRawBytes === 'function') {
						return toUint8Array(key.toRawBytes());
					}
					if (key && typeof key.toBytes === 'function') {
						return toUint8Array(key.toBytes());
					}
					return toUint8Array(key);
				} catch (_e) {
					return new Uint8Array(32);
				}
			}

			function createOfficialMessagingSigner(address) {
				var signerAddress = normalizeAddress(address);
				if (!signerAddress) {
					throw new Error('Wallet signer address is unavailable');
				}

				function prepareWalletTransactionInput(input) {
					var transaction = input && (input.transaction || input.transactionBlock)
						? (input.transaction || input.transactionBlock)
						: input;
					if (!transaction) return transaction;
					if (transaction && signerAddress) {
						if (typeof transaction.setSender === 'function') {
							transaction.setSender(signerAddress);
						} else if (typeof transaction.setSenderIfNotSet === 'function') {
							transaction.setSenderIfNotSet(signerAddress);
						}
					}
					return transaction;
				}

				var pendingSignByKey = {};

				function extractTxDigest(rawResult) {
					var digest = String(
						(rawResult && (
							rawResult.digest
							|| rawResult.transactionDigest
							|| rawResult.txDigest
						)) || '',
					).trim();
					return digest;
				}

				function mergeTxResultFields(target, source) {
					if (!source || typeof source !== 'object') return;
					if (!target.objectChanges && Array.isArray(source.objectChanges)) {
						target.objectChanges = source.objectChanges;
					}
					if (!target.balanceChanges && Array.isArray(source.balanceChanges)) {
						target.balanceChanges = source.balanceChanges;
					}
					if (!target.events && Array.isArray(source.events)) {
						target.events = source.events;
					}
					if (!target.rawEffects && source.rawEffects) {
						target.rawEffects = source.rawEffects;
					}
				}

				async function hydrateTxEffectsIfNeeded(txResult, input) {
					var effects = txResult && txResult.effects ? txResult.effects : null;
					var hasChangedObjects = !!(effects && Array.isArray(effects.changedObjects));
					if (hasChangedObjects) return;
					var digest = txResult && txResult.digest ? txResult.digest : '';
					if (!digest) return;
					var client = input && input.client ? input.client : null;
					if (!client || !client.core || typeof client.core.waitForTransaction !== 'function') return;
					try {
						var waited = await client.core.waitForTransaction({
							digest: digest,
							include: { effects: true },
						});
						var waitedTx = waited && waited.$kind === 'Transaction'
							? waited.Transaction
							: (waited && waited.$kind === 'FailedTransaction'
								? waited.FailedTransaction
								: waited);
						if (!waitedTx || typeof waitedTx !== 'object') return;
						if (waitedTx.effects) txResult.effects = waitedTx.effects;
						mergeTxResultFields(txResult, waitedTx);
					} catch (_e) {}
				}

				function isFailedTxEffects(effects) {
					var status = effects && effects.status ? effects.status : null;
					if (!status) return false;
					if (status.$kind === 'Failure') return true;
					if (typeof status.status === 'string' && status.status.toLowerCase() === 'failure') return true;
					return !!status.error;
				}

					return {
						toSuiAddress: function() {
							return signerAddress;
						},
						getPublicKey: function() {
							var connectedKey = null;
							if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.$connection) {
								var conn = SuiWalletKit.$connection.value;
								var account = conn && conn.account;
								connectedKey = account && account.publicKey ? account.publicKey : null;
							}
							if (connectedKey && typeof connectedKey.toSuiAddress === 'function') {
								try {
									var connectedKeyAddress = normalizeAddress(connectedKey.toSuiAddress());
									if (connectedKeyAddress && connectedKeyAddress === signerAddress) {
										return connectedKey;
									}
								} catch (_e) {}
							}
							function getBytes() {
								if (connectedKey && typeof connectedKey.toSuiBytes === 'function') {
									return toUint8Array(connectedKey.toSuiBytes());
								}
								if (connectedKey && typeof connectedKey.toRawBytes === 'function') {
									return toUint8Array(connectedKey.toRawBytes());
								}
								if (connectedKey && typeof connectedKey.toBytes === 'function') {
									return toUint8Array(connectedKey.toBytes());
								}
								return getWalletPublicKeyBytes();
							}
							return {
								toSuiAddress: function() {
									return signerAddress;
								},
								toSuiBytes: function() {
									return getBytes();
								},
								toRawBytes: function() {
									return getBytes();
								},
								toBytes: function() {
									return getBytes();
								},
							};
						},
						signPersonalMessage: async function(input) {
							if (typeof SuiWalletKit === 'undefined' || typeof SuiWalletKit.signPersonalMessage !== 'function') {
								throw new Error('Wallet signer is unavailable');
							}
							var message = input && input.message ? input.message : input;
							var messageBytes = toMessageBytes(message, 0);
							if (!messageBytes.length) {
								throw new Error('Wallet signer message payload was empty');
							}
							var dedupKey = signerAddress + ':' + messageBytes.length + ':' + Array.from(messageBytes.slice(0, 16)).join(',');
							if (pendingSignByKey[dedupKey]) {
								return pendingSignByKey[dedupKey];
							}
							var signPromise = (async function() {
								var signed = null;
								var firstError = null;
								var personalMessageOptions = {
																		expectedSender: signerAddress,
								};
								try {
									signed = await SuiWalletKit.signPersonalMessage(messageBytes, personalMessageOptions);
								} catch (error) {
									firstError = error;
								}
								if (!signed) {
									if (isSubdomainSuiHost()) {
										throw firstError || new Error('Sign bridge unavailable on subdomain');
									}
									try {
										signed = await SuiWalletKit.signPersonalMessage(messageBytes);
									} catch (fallbackError) {
										throw firstError || fallbackError;
									}
								}
								return normalizeSignPersonalMessageResult(signed, messageBytes);
							})();
							pendingSignByKey[dedupKey] = signPromise;
							signPromise.finally(function() { delete pendingSignByKey[dedupKey]; });
							return signPromise;
						},
						signTransaction: async function(input) {
							if (typeof SuiWalletKit === 'undefined' || typeof SuiWalletKit.signTransaction !== 'function') {
								throw new Error('Wallet signer is unavailable');
							}
							var transaction = await prepareWalletTransactionInput(input);
							var signOptions = {};
							signOptions.expectedSender = signerAddress;
							if (input && input.account) {
								signOptions.account = input.account;
							} else {
								var walletAccount = getWalletAccountByAddress(getWalletConnection(), signerAddress);
								if (walletAccount) signOptions.account = walletAccount;
							}
							if (input && input.chain) signOptions.chain = input.chain;
							return await SuiWalletKit.signTransaction(transaction, signOptions);
						},
						signAndExecuteTransaction: async function(input) {
							if (typeof SuiWalletKit === 'undefined' || typeof SuiWalletKit.signAndExecute !== 'function') {
								throw new Error('Wallet signer is unavailable');
							}
						var transaction = await prepareWalletTransactionInput(input);
						var options = input && input.options ? input.options : {};
						var txOptions = {};
						if (options && typeof options === 'object') {
							for (var optionKey in options) {
								txOptions[optionKey] = options[optionKey];
							}
						}
						if (txOptions.showEffects == null) txOptions.showEffects = true;
						if (txOptions.showObjectChanges == null) txOptions.showObjectChanges = true;
						if (txOptions.showRawEffects == null) txOptions.showRawEffects = true;
							var signOptions = {
								txOptions: txOptions,
							};
														signOptions.expectedSender = signerAddress;
							if (input && input.account) {
								signOptions.account = input.account;
							} else {
								var walletAccount = getWalletAccountByAddress(getWalletConnection(), signerAddress);
								if (walletAccount) signOptions.account = walletAccount;
							}
							if (input && input.chain) signOptions.chain = input.chain;
							var rawResult = await SuiWalletKit.signAndExecute(transaction, signOptions);
							if (rawResult && rawResult.effects && typeof rawResult.effects !== 'object') {
								rawResult.effects = undefined;
						}
						if (rawResult && rawResult.$kind) return rawResult;
						var txResult = { digest: extractTxDigest(rawResult), effects: rawResult.effects };
						mergeTxResultFields(txResult, rawResult);
						await hydrateTxEffectsIfNeeded(txResult, input);
						var isFailure = isFailedTxEffects(txResult.effects);
						return isFailure
							? { $kind: 'FailedTransaction', FailedTransaction: txResult }
							: { $kind: 'Transaction', Transaction: txResult };
					},
					signAndExecuteTransactionBlock: async function(input) {
						if (typeof SuiWalletKit === 'undefined' || typeof SuiWalletKit.signAndExecute !== 'function') {
							throw new Error('Wallet signer is unavailable');
						}
						var transaction = await prepareWalletTransactionInput(input);
						var options = input && input.options ? input.options : {};
						var txOptions = {};
						if (options && typeof options === 'object') {
							for (var optionKey in options) {
								txOptions[optionKey] = options[optionKey];
							}
						}
						if (txOptions.showEffects == null) txOptions.showEffects = true;
						if (txOptions.showObjectChanges == null) txOptions.showObjectChanges = true;
						if (txOptions.showRawEffects == null) txOptions.showRawEffects = true;
							var signOptions = {
								txOptions: txOptions,
							};
														signOptions.expectedSender = signerAddress;
							if (input && input.account) {
								signOptions.account = input.account;
							} else {
								var walletAccount = getWalletAccountByAddress(getWalletConnection(), signerAddress);
								if (walletAccount) signOptions.account = walletAccount;
							}
							if (input && input.chain) signOptions.chain = input.chain;
							var rawResult = await SuiWalletKit.signAndExecute(transaction, signOptions);
						if (rawResult && rawResult.effects && typeof rawResult.effects !== 'object') {
							rawResult.effects = undefined;
						}
						if (rawResult && rawResult.$kind) return rawResult;
						var txResult = { digest: extractTxDigest(rawResult), effects: rawResult.effects };
						mergeTxResultFields(txResult, rawResult);
						await hydrateTxEffectsIfNeeded(txResult, input);
						var isFailure = isFailedTxEffects(txResult.effects);
						return isFailure
							? { $kind: 'FailedTransaction', FailedTransaction: txResult }
							: { $kind: 'Transaction', Transaction: txResult };
					},
				};
			}

			async function fetchOfficialMessagingConfig() {
				try {
					var resp = await fetch('/api/app/subscriptions/config', { credentials: 'include' });
					if (!resp.ok) return null;
					return await resp.json();
				} catch (_e) {
					return null;
				}
			}

			function resolveSealServerConfigs(network, config) {
				var source = [];
				var fromApi = config && config.seal && Array.isArray(config.seal.keyServers) ? config.seal.keyServers : [];
				if (fromApi.length) {
					source = fromApi;
				} else if (OFFICIAL_DEFAULT_SEAL_KEY_SERVERS[network]) {
					source = OFFICIAL_DEFAULT_SEAL_KEY_SERVERS[network];
				}
				var resolved = [];
				for (var i = 0; i < source.length; i++) {
					var entry = source[i];
					var objectId = '';
					var weight = 1;
					if (typeof entry === 'string') {
						objectId = entry;
					} else if (entry && typeof entry === 'object') {
						objectId = String(entry.objectId || entry.id || '').trim();
						weight = Number(entry.weight || 1);
					}
					if (!objectId) continue;
					if (!isFinite(weight) || weight <= 0) weight = 1;
					resolved.push({ objectId: objectId, weight: weight });
				}
				return resolved;
			}

			function resolveSealThreshold(config, serverCount) {
				var fallback = 2;
				var configured = Number(config && config.seal && config.seal.threshold);
				var next = isFinite(configured) && configured > 0 ? Math.floor(configured) : fallback;
				if (!isFinite(next) || next < 1) next = 1;
				if (serverCount > 0 && next > serverCount) next = serverCount;
				if (next < 1) next = 1;
				return next;
			}

			function resolveWalrusConfig(network, config) {
				var defaults = OFFICIAL_DEFAULT_WALRUS[network] || OFFICIAL_DEFAULT_WALRUS.mainnet;
				var walrus = (config && config.walrus) || {};
				return {
					publisher: String(walrus.publisherUrl || defaults.publisher),
					aggregator: String(walrus.aggregatorUrl || defaults.aggregator),
				};
			}

			function getStormNftId() {
				return normalizeAddress(CONFIG && CONFIG.nftId ? CONFIG.nftId : '');
			}

			function resolveStormConfig(config) {
				var storm = config && config.storm && typeof config.storm === 'object' ? config.storm : {};
				return {
					packageId: normalizeAddress(storm.packageId || ''),
					registryId: normalizeAddress(storm.registryId || ''),
					module: String(storm.module || 'registry').trim() || 'registry',
					setFunction: String(storm.setFunction || 'set_channel_for_nft').trim() || 'set_channel_for_nft',
					clearFunction: String(storm.clearFunction || 'clear_channel_for_nft').trim() || 'clear_channel_for_nft',
					keyType: String(storm.keyType || '0x2::object::ID').trim() || '0x2::object::ID',
				};
			}

			function hasStormRegistryConfig() {
				return !!(
					officialStormConfig
					&& officialStormConfig.packageId
					&& officialStormConfig.registryId
					&& getStormNftId()
				);
			}

			function extractStormChannelIdFromValue(input) {
				if (!input) return '';
				var queue = [input];
				var seen = 0;
				while (queue.length && seen < 64) {
					var next = queue.shift();
					seen += 1;
					if (!next) continue;
					if (typeof next === 'string') {
						var normalized = normalizeAddress(next);
						if (normalized) return normalized;
						continue;
					}
					if (Array.isArray(next)) {
						for (var i = 0; i < next.length; i++) queue.push(next[i]);
						continue;
					}
					if (typeof next !== 'object') continue;
					if (next.id != null) queue.push(next.id);
					if (next.bytes != null) queue.push(next.bytes);
					if (next.channelId != null) queue.push(next.channelId);
					if (next.channel_id != null) queue.push(next.channel_id);
					if (next.channel != null) queue.push(next.channel);
					if (next.value != null) queue.push(next.value);
					if (next.fields != null) queue.push(next.fields);
				}
				return '';
			}

			async function resolveStormChannelMapping(client) {
				if (!hasStormRegistryConfig()) return '';
				var runtime = client || officialMessagingRuntimeClient;
				if (!runtime || typeof runtime.getDynamicFieldObject !== 'function') return '';
				var nftId = getStormNftId();
				if (!nftId) return '';
				try {
					var dynamicResp = await runtime.getDynamicFieldObject({
						parentId: officialStormConfig.registryId,
						name: {
							type: officialStormConfig.keyType || '0x2::object::ID',
							value: nftId,
						},
					});
					var dynamicValue = dynamicResp
						&& dynamicResp.data
						&& dynamicResp.data.content
						&& dynamicResp.data.content.fields
						? dynamicResp.data.content.fields.value
						: dynamicResp;
					return extractStormChannelIdFromValue(dynamicValue);
				} catch (error) {
					var errText = String(error && error.message ? error.message : error || '');
					if (
						errText.indexOf('not found') === -1
						&& errText.indexOf('DynamicField') === -1
						&& errText.indexOf('Unknown field') === -1
					) {
						console.warn('[storm] failed to read channel mapping:', errText);
					}
					return '';
				}
			}

			async function resolveStormNftType(client) {
				if (stormNftType) return stormNftType;
				var runtime = client || officialMessagingRuntimeClient;
				if (!runtime || typeof runtime.getObject !== 'function') return '';
				var nftId = getStormNftId();
				if (!nftId) return '';
				try {
					var nftResp = await runtime.getObject({
						id: nftId,
						options: { showType: true },
					});
					var nftType = String(
						nftResp && nftResp.data && nftResp.data.type
							? nftResp.data.type
							: '',
					).trim();
					if (!nftType) return '';
					stormNftType = nftType;
					return nftType;
				} catch (error) {
					console.warn('[storm] failed to read SuiNS NFT type:', error);
					return '';
				}
			}

			async function appendStormSetChannelMoveCall(tx, channelObjectId, client) {
				var mappedChannelId = normalizeAddress(channelObjectId);
				if (!mappedChannelId || !hasStormRegistryConfig()) return false;
				if (!tx || typeof tx.moveCall !== 'function' || typeof tx.object !== 'function') return false;
				if (!tx.pure || typeof tx.pure.address !== 'function') return false;
				var nftType = await resolveStormNftType(client);
				if (!nftType) {
					throw new Error('Storm registry requires SuiNS NFT type, but it could not be resolved.');
				}
				var stormTarget = officialStormConfig.packageId
					+ '::'
					+ officialStormConfig.module
					+ '::'
					+ officialStormConfig.setFunction;
				tx.moveCall({
					target: stormTarget,
					typeArguments: [nftType],
					arguments: [
						tx.object(officialStormConfig.registryId),
						tx.object(getStormNftId()),
						tx.pure.address(mappedChannelId),
					],
				});
				return true;
			}

			async function clearStormMappingIfChannel(channelObjectId, senderAddress) {
				var targetChannelId = normalizeAddress(channelObjectId);
				var signerAddress = normalizeAddress(senderAddress);
				if (!targetChannelId || !signerAddress || !hasStormRegistryConfig()) return false;
				var runtime = officialMessagingRuntimeClient;
				if (!runtime) return false;
				var mapped = stormMappedChannelId || await resolveStormChannelMapping(runtime);
				if (!mapped || mapped !== targetChannelId) return false;
				var txMod = await ensureOfficialSuiTransactionSdk();
				var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
				if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');
				var nftType = await resolveStormNftType(runtime);
				if (!nftType) throw new Error('Storm registry clear failed: SuiNS NFT type unavailable.');
				var tx = new TxCtor();
				if (typeof tx.setSenderIfNotSet === 'function') tx.setSenderIfNotSet(signerAddress);
				if (typeof tx.setGasBudget === 'function') tx.setGasBudget(60000000);
				tx.moveCall({
					target: officialStormConfig.packageId
						+ '::'
						+ officialStormConfig.module
						+ '::'
						+ officialStormConfig.clearFunction,
					typeArguments: [nftType],
					arguments: [
						tx.object(officialStormConfig.registryId),
						tx.object(getStormNftId()),
					],
				});
				var signer = officialMessagingSigner || createOfficialMessagingSigner(signerAddress);
				await signer.signAndExecuteTransaction({
					transaction: tx,
					options: { showEffects: true, showObjectChanges: true, showRawEffects: true },
									});
				stormMappedChannelId = '';
				return true;
			}

			function isOfficialChannel(channel) {
				return !!(channel && channel.sdk === 'official');
			}

			function getOfficialChannelState(channelId) {
				if (!channelId) return null;
				return officialChannelStateById[channelId] || null;
			}

			async function ensureOfficialMessagingClient() {
				var normalizedAddress = normalizeAddress(getAddress());
				if (!normalizedAddress) return null;
				if (officialMessagingClient && officialMessagingAddress === normalizedAddress) {
					return officialMessagingClient;
				}
				if (officialMessagingClientLoadPromise) return officialMessagingClientLoadPromise;

				officialMessagingClientLoadPromise = (async function() {
					var sdk = await ensureOfficialMessagingSdk();
					if (!sdk || !sdk.messaging) { console.error('[messaging-init] SDK missing: sdk=', !!sdk, 'messaging=', sdk && !!sdk.messaging); return null; }
					var loaded = await Promise.all([
						importFirstSuiClientModule(OFFICIAL_SUI_CLIENT_URLS),
						importFirstAvailable(OFFICIAL_SEAL_SDK_URLS),
					]);
					var suiMod = loaded[0] || {};
					var sealMod = loaded[1] || {};
					var suiDefault = suiMod && suiMod.default && typeof suiMod.default === 'object' ? suiMod.default : {};
					console.log(
						'[messaging-init] suiMod keys:',
						Object.keys(suiMod).slice(0, 15),
						'suiDefault keys:',
						Object.keys(suiDefault).slice(0, 15),
						'sealMod keys:',
						Object.keys(sealMod).slice(0, 10),
					);
					var SuiClientCtor = resolveSuiClientCtor(suiMod);
					var SuiClientExport = getModuleExport(suiMod, 'SuiClient');
					var SuiGraphQLCtor = getModuleExport(suiMod, 'SuiGraphQLClient');
					var SuiJsonRpcCtor = getModuleExport(suiMod, 'SuiJsonRpcClient');
					var SealClientCtor = getModuleExport(sealMod, 'SealClient');
					if (!SuiClientCtor || !SealClientCtor) {
						throw new Error('Required Sui SDK modules are unavailable (SuiClient=' + !!SuiClientExport + ', SuiGraphQLClient=' + !!SuiGraphQLCtor + ', SuiJsonRpcClient=' + !!SuiJsonRpcCtor + ', SealClient=' + !!SealClientCtor + ')');
					}
					if (!window.SuiClient) window.SuiClient = SuiClientExport || SuiJsonRpcCtor || SuiClientCtor;
					if (!window.SuiGraphQLClient && SuiGraphQLCtor) window.SuiGraphQLClient = SuiGraphQLCtor;

					var config = await fetchOfficialMessagingConfig();
					var network = getNetwork();
					var rpcUrl = getRpcUrlForNetwork(network);
					var graphqlUrl = getGraphqlUrlForNetwork(network);
					var sealServers = resolveSealServerConfigs(network, config);
					if (!sealServers.length) {
						throw new Error('No Seal key servers configured for messaging SDK');
					}
					var sealThreshold = resolveSealThreshold(config, sealServers.length);
					officialSealThreshold = sealThreshold;
					var walrusConfig = resolveWalrusConfig(network, config);
					var signer = createOfficialMessagingSigner(normalizedAddress);

					var resolvedPackageConfig = { packageId: getMessagingPackageId() };
					if (config && config.sdk && config.sdk.messagingPackageConfig && config.sdk.messagingPackageConfig.packageId) {
						resolvedPackageConfig = config.sdk.messagingPackageConfig;
					}
					officialMessagingPackageId = resolvedPackageConfig.packageId;
					officialStormConfig = resolveStormConfig(config);

					var isGraphqlClientCtor = !!(SuiGraphQLCtor && SuiClientCtor === SuiGraphQLCtor);
					var clientOpts = { url: isGraphqlClientCtor ? graphqlUrl : rpcUrl, network: network };
					if (officialMessagingPackageId) {
						clientOpts.mvr = { overrides: { packages: { '@local-pkg/sui-stack-messaging': officialMessagingPackageId } } };
					}
					var baseClient = new SuiClientCtor(clientOpts);
					var sealExtension = {
						name: 'seal',
						register: (client) => new SealClientCtor({ suiClient: client, serverConfigs: sealServers, verifyKeyServers: false }),
					};
					var withSeal = baseClient.$extend(sealExtension);

					var extensionOptions = {
						walrusStorageConfig: {
							publisher: walrusConfig.publisher,
							aggregator: walrusConfig.aggregator,
							epochs: 1,
						},
						sealConfig: {
							threshold: sealThreshold,
						},
						sessionKeyConfig: {
							address: normalizedAddress,
							ttlMin: 30,
							signer: signer,
						},
					};

					if (resolvedPackageConfig) {
						extensionOptions.packageConfig = resolvedPackageConfig;
					}

					var withMessaging = withSeal.$extend(sdk.messaging(extensionOptions));
					var client = withMessaging && withMessaging.messaging ? withMessaging.messaging : null;
					if (!client || typeof client.getChannelMemberships !== 'function') {
						throw new Error('Failed to initialize official messaging client');
					}

					officialMessagingClient = client;
					officialMessagingRuntimeClient = withMessaging;
					officialMessagingAddress = normalizedAddress;
					officialMessagingSigner = signer;
					officialMessagingSdkStatus = 'ready';
					renderServerHeader();
					return client;
				})()
					.catch(function(error) {
						console.error('[messaging-init] FAILED:', error && error.message || error, error && error.stack || '');
						officialMessagingClient = null;
						officialMessagingRuntimeClient = null;
						officialMessagingSigner = null;
						officialMessagingAddress = '';
						officialStormConfig = null;
						stormMappedChannelId = '';
						stormNftType = '';
						return null;
					})
					.finally(function() {
						officialMessagingClientLoadPromise = null;
					});

				return officialMessagingClientLoadPromise;
			}

			async function loadOfficialChannels() {
				officialChannelStateById = {};
				officialChannelCount = 0;
				stormMappedChannelId = '';
				var address = normalizeAddress(getAddress());
				if (!address) {
					renderServerHeader();
					return [];
				}
				var client = await ensureOfficialMessagingClient();
				if (!client) {
					renderServerHeader();
					return [];
				}

				try {
					var membershipsResp = await client.getChannelMemberships({
						owner: address,
						limit: OFFICIAL_CHANNEL_LIMIT,
					});
					var memberships = membershipsResp && Array.isArray(membershipsResp.memberships)
						? membershipsResp.memberships
						: [];
					if (!memberships.length) {
						renderServerHeader();
						return [];
					}

					var channelIds = [];
					var memberCapsByChannel = {};
					var memberAddressByChannel = {};
					for (var i = 0; i < memberships.length; i++) {
						var item = memberships[i];
						var channelId = normalizeAddress(item && item.channel_id ? item.channel_id : '');
						var memberCapId = normalizeAddress(item && item.member_cap_id ? item.member_cap_id : '');
						var memberAddress = normalizeAddress(
							(item && (
								item.member_address
								|| item.memberAddress
								|| item.address
								|| item.member
							)) || address,
						);
						if (!channelId || !memberCapId) continue;
						if (!memberCapsByChannel[channelId]) {
							channelIds.push(channelId);
							memberCapsByChannel[channelId] = [];
						}
						if (memberCapsByChannel[channelId].indexOf(memberCapId) === -1) {
							memberCapsByChannel[channelId].push(memberCapId);
						}
						if (!memberAddressByChannel[channelId]) memberAddressByChannel[channelId] = memberAddress || address;
					}
					channelIds.sort(function(a, b) {
						if (a < b) return -1;
						if (a > b) return 1;
						return 0;
					});
					if (!channelIds.length) {
						renderServerHeader();
						return [];
					}
					var resolvedStormMappedChannelId = '';
					try {
						resolvedStormMappedChannelId = await resolveStormChannelMapping(officialMessagingRuntimeClient);
					} catch (_stormReadErr) {
						resolvedStormMappedChannelId = '';
					}
					if (resolvedStormMappedChannelId && channelIds.indexOf(resolvedStormMappedChannelId) === -1) {
						resolvedStormMappedChannelId = '';
					}
					stormMappedChannelId = resolvedStormMappedChannelId;

					var creatorCapByChannel = {};
					if (typeof client.getCreatorCap === 'function') {
						for (var cc = 0; cc < channelIds.length; cc++) {
							var creatorChannelId = channelIds[cc];
							try {
								var creatorCap = await client.getCreatorCap(address, creatorChannelId);
								var creatorCapId = normalizeAddress(
									creatorCap && creatorCap.id && creatorCap.id.id
										? creatorCap.id.id
										: creatorCap && creatorCap.id
											? creatorCap.id
											: '',
								).trim();
								if (creatorCapId) creatorCapByChannel[creatorChannelId] = creatorCapId;
							} catch (_creatorErr) {}
						}
					}

					var channelObjects = [];
					var membershipCapIds = [];
					for (var mc = 0; mc < channelIds.length; mc++) {
						var capList = memberCapsByChannel[channelIds[mc]] || [];
						for (var cp = 0; cp < capList.length; cp++) {
							var nextCap = String(capList[cp] || '').trim();
							if (nextCap && membershipCapIds.indexOf(nextCap) === -1) membershipCapIds.push(nextCap);
						}
					}
					try {
						channelObjects = await client.getChannelObjectsByChannelIds({
							channelIds: channelIds,
							userAddress: address,
							memberCapIds: membershipCapIds,
						});
						if (!Array.isArray(channelObjects)) channelObjects = [];
						if (!channelObjects.length) {
							channelObjects = await client.getChannelObjectsByChannelIds({
								channelIds: channelIds,
								userAddress: address,
							});
							if (!Array.isArray(channelObjects)) channelObjects = [];
						}
					} catch (coErr) {
						console.warn('[ski-chat] getChannelObjectsByChannelIds failed:', coErr);
					}
					var channelObjectById = {};
					for (var j = 0; j < channelObjects.length; j++) {
						var object = channelObjects[j];
						if (!object) continue;
						var objectId = normalizeAddress(
							object.id && object.id.id ? object.id.id
							: typeof object.id === 'string' ? object.id
							: ''
						);
						if (objectId) channelObjectById[objectId] = object;
					}
					var canonicalPublicName = getCanonicalPublicChannelName();
					var canonicalOnChainId = resolvedStormMappedChannelId;
					if (!canonicalOnChainId && channelIds.length) canonicalOnChainId = channelIds[0];
					var officialChannels = [];
					for (var k = 0; k < channelIds.length; k++) {
						var sdkChannelId = channelIds[k];
						var memberCapCandidates = Array.isArray(memberCapsByChannel[sdkChannelId]) ? memberCapsByChannel[sdkChannelId].slice(0) : [];
						var memberCapId = normalizeAddress(memberCapCandidates[0] || '');
						var keyEditorMemberCapId = '';
						var memberAddress = String(memberAddressByChannel[sdkChannelId] || address || '').trim();
						var channelObject = channelObjectById[sdkChannelId]
							|| (channelObjects.length === channelIds.length ? channelObjects[k] : null);
						for (var capIdx = 0; capIdx < memberCapCandidates.length; capIdx++) {
							var capCandidate = String(memberCapCandidates[capIdx] || '').trim();
							if (!capCandidate) continue;
							if (!keyEditorMemberCapId && channelHasEditEncryptionPermission(channelObject, capCandidate)) {
								keyEditorMemberCapId = capCandidate;
							}
						}
						if (keyEditorMemberCapId) memberCapId = keyEditorMemberCapId;
						var resolvedEncryptedKey = extractEncryptedKeyFromChannelObject(channelObject);
						if (!resolvedEncryptedKey) {
							console.debug('[ski-chat] Channel missing encrypted key (send disabled until repaired):', sdkChannelId);
						}
						var storedMeta = getStoredChannelMeta(sdkChannelId);
						var visibility = storedMeta && storedMeta.visibility === 'private' ? 'private' : 'public';
						var syntheticId = '';
						if (visibility !== 'private' && sdkChannelId === canonicalOnChainId) {
							syntheticId = canonicalPublicName || 'public';
							setStoredChannelMeta(sdkChannelId, syntheticId, visibility);
						} else {
							var preferredMetaName = storedMeta && storedMeta.name ? sanitizeSlug(storedMeta.name) : '';
							if (preferredMetaName && preferredMetaName !== canonicalPublicName) {
								syntheticId = preferredMetaName;
							} else {
								var suffix = String(sdkChannelId || '').replace(/^0x/i, '').slice(0, 6) || String(k + 1);
								var prefix = visibility === 'private'
									? 'dm'
									: ((canonicalPublicName || 'public') + '-x');
								syntheticId = prefix + '-' + sanitizeSlug(suffix);
							}
						}
						if (officialChannelStateById[syntheticId]) {
							var channelSuffix = String(sdkChannelId || '').replace(/^0x/i, '').slice(0, 6);
							var suffixBase = channelSuffix ? sanitizeSlug(channelSuffix) : String(k + 1);
							var baseSyntheticId = syntheticId;
							syntheticId = baseSyntheticId + '-' + suffixBase;
							var suffixIndex = 2;
							while (officialChannelStateById[syntheticId]) {
								syntheticId = baseSyntheticId + '-' + suffixBase + '-' + String(suffixIndex);
								suffixIndex += 1;
							}
						}
						var creatorCapId = normalizeAddress(creatorCapByChannel[sdkChannelId] || '');
						var createdAtMs = Number(
							channelObject && channelObject.created_at_ms
								? channelObject.created_at_ms
								: Date.now(),
						);
						officialChannelStateById[syntheticId] = {
							channelId: sdkChannelId,
							memberCapId: memberCapId,
							memberCapIds: memberCapCandidates,
							keyEditorMemberCapId: keyEditorMemberCapId || null,
							memberAddress: memberAddress || address,
							encryptedKey: resolvedEncryptedKey || null,
							creatorCapId: creatorCapId || null,
							canManage: !!memberCapId || !!creatorCapId || isConnectedServerOwner(),
						};
						officialChannels.push({
							id: syntheticId,
							name: syntheticId,
							description: 'On-chain Sui Stack channel',
							encrypted: visibility === 'private',
							protected: true,
							custom: false,
							createdAt: isFinite(createdAtMs) ? createdAtMs : Date.now(),
							sdk: 'official',
						});
					}
					officialChannels.sort(function(a, b) {
						var aPrimary = isCanonicalPublicChannel(a);
						var bPrimary = isCanonicalPublicChannel(b);
						if (aPrimary && !bPrimary) return -1;
						if (!aPrimary && bPrimary) return 1;
						if (!!a.encrypted !== !!b.encrypted) return a.encrypted ? 1 : -1;
						if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
						if (a.name < b.name) return -1;
						if (a.name > b.name) return 1;
						return 0;
					});
					officialChannelCount = officialChannels.length;
					renderServerHeader();
					return officialChannels;
				} catch (error) {
					console.warn('Failed to load official channels:', error);
					officialChannelCount = 0;
					renderServerHeader();
					return [];
				}
			}

		function getActiveChannel() {
			for (var i = 0; i < channels.length; i++) {
				if (channels[i].id === activeChannel) return channels[i];
			}
			if (!channels.length && activeChannel) {
				return {
					id: activeChannel,
					name: sanitizeSlug(activeChannel || '') || 'public',
					description: 'Bootstrap public channel',
					encrypted: false,
					protected: true,
					custom: false,
					createdAt: Date.now(),
					sdk: 'bootstrap',
				};
			}
			return null;
		}

		function isAddressMuted(address, scope) {
			if (!address) return false;
			if (scope === 'server') {
				return Array.isArray(moderation.serverMuted) && moderation.serverMuted.indexOf(address) !== -1;
			}
			var mutedByChannel = moderation.channelMuted || {};
			var list = mutedByChannel[activeChannel] || [];
			return Array.isArray(list) && list.indexOf(address) !== -1;
		}

		var root = document.getElementById('thunder-root') || document.getElementById('thunder-root');
		if (!root) return;

		root.innerHTML = ''
			+ '<button id="thunder-bubble" aria-label="Open Thunder">'
			+ '<img src="/media-pack/ThunderIcon.png" alt="Thunder" draggable="false">'
			+ '<div class="thunder-shockwave" id="thunder-shockwave"></div>'
			+ '</button>'
			+ '<div id="thunder-backdrop"></div>'
			+ '<div id="thunder-panel">'
			+ '<div class="thunder-header">'
			+ '<div class="thunder-ident">'
			+ '<button class="thunder-avatar-btn" id="thunder-brand-icon" aria-label="Open profile or connect" title="Open profile or connect on sui.ski">'
			+ '<img class="thunder-avatar" src="/media-pack/dotSKI.png" alt=".SKI">'
			+ '</button>'
			+ '<div><div class="thunder-server-title" id="thunder-server-title">Secure Chat</div><div class="thunder-server-meta" id="thunder-server-meta">Wallet-based messaging</div></div>'
			+ '</div>'
			+ '<div class="thunder-header-actions">'
			+ '<button class="thunder-header-btn" id="thunder-close-btn" title="Close">&times;</button>'
			+ '</div>'
			+ '</div>'
			+ '<div class="thunder-layout">'
			+ '<aside class="thunder-sidebar">'
			+ '<div class="thunder-sidebar-title-row">'
			+ '<div class="thunder-sidebar-title">Channels</div>'
			+ '<div class="thunder-sidebar-title-actions">'
			+ '<button class="thunder-sidebar-reset-btn" id="thunder-reset-local-btn" title="Clear local Thunder channel cache">Reset</button>'
			+ '</div>'
			+ '</div>'
			+ '<div id="thunder-channel-list"></div>'
			+ '<div class="thunder-sidebar-footer">'
			+ '<div class="thunder-onchain-badge" id="thunder-onchain-badge" style="display:none">'
			+ '<img src="/media-pack/SuiIcon.svg" alt="Sui" width="12" height="12">'
			+ '<span>Settled on Sui Stack Messaging SDK</span>'
			+ '</div>'
			+ '</div>'
			+ '</aside>'
			+ '<section class="thunder-thread">'
			+ '<div class="thunder-thread-head">'
			+ '<div class="thunder-thread-name" id="thunder-channel-name">#general</div>'
			+ '<div class="thunder-thread-state" id="thunder-thread-state"></div>'
			+ '<div class="thunder-channel-gear-wrap" id="thunder-channel-gear-wrap" style="display:none">'
			+ '<button class="thunder-channel-gear-btn" id="thunder-channel-gear-btn" title="Channel settings" aria-label="Channel settings">'
			+ '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
			+ '</button>'
			+ '<div class="thunder-channel-gear-menu" id="thunder-channel-gear-menu" style="display:none">'
			+ '<button class="thunder-gear-item" id="thunder-gear-sync">Sync</button>'
			+ '<button class="thunder-gear-item" id="thunder-gear-storm">Set primary</button>'
			+ '<button class="thunder-gear-item" id="thunder-gear-repair">Repair key</button>'
			+ '<button class="thunder-gear-item" id="thunder-gear-rename">Rename</button>'
			+ '<button class="thunder-gear-item thunder-gear-item-danger" id="thunder-gear-purge">Purge</button>'
			+ '</div>'
			+ '</div>'
			+ '</div>'
			+ '<div class="thunder-mode-banner" id="thunder-mode-banner" style="display:none"></div>'
			+ '<div class="thunder-messages" id="thunder-messages"></div>'
			+ '<div class="thunder-input-wrap">'
			+ '<div class="thunder-composer-identity" id="thunder-composer-identity"></div>'
			+ '<div class="thunder-input-area">'
			+ '<textarea class="thunder-input" id="thunder-input" placeholder="Type a message..." rows="1"></textarea>'
			+ '<button class="thunder-send-btn" id="thunder-send-btn" disabled>'
			+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
			+ '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
			+ '</button>'
			+ '</div>'
			+ '</div>'
			+ '</section>'
			+ '</div>'
			+ '</div>';

		var bubble = document.getElementById('thunder-bubble');
		var backdrop = document.getElementById('thunder-backdrop');
		var panel = document.getElementById('thunder-panel');
		var closeBtn = document.getElementById('thunder-close-btn');
		var messagesEl = document.getElementById('thunder-messages');
		var inputEl = document.getElementById('thunder-input');
		var sendBtn = document.getElementById('thunder-send-btn');
		var brandIconEl = document.getElementById('thunder-brand-icon');
		var deleteAllBtn = document.getElementById('thunder-delete-all-btn');
		var resetLocalBtn = document.getElementById('thunder-reset-local-btn');
		var composerIdentityEl = document.getElementById('thunder-composer-identity');
		var channelNameEl = document.getElementById('thunder-channel-name');
		var channelListEl = document.getElementById('thunder-channel-list');
		var threadStateEl = document.getElementById('thunder-thread-state');
		var serverTitleEl = document.getElementById('thunder-server-title');
		var serverMetaEl = document.getElementById('thunder-server-meta');
		var modeBannerEl = document.getElementById('thunder-mode-banner');
		loadStoredChannelMeta();
		loadDismissedChannels();
		migrateChannelMetaToOwnerScope();

			function getActiveChannelMembers() {
				var list = channelMembersByChannelId[activeChannel];
				return Array.isArray(list) ? list : [];
			}

			function getPendingJoinRequestCount(list) {
				if (!Array.isArray(list)) return 0;
				var total = 0;
				for (var i = 0; i < list.length; i++) {
					if (list[i] && list[i].status === 'pending') total += 1;
				}
				return total;
			}

			function setThreadState(text, warn) {
				threadStateText = text || '';
				threadStateWarn = !!warn;
				renderThreadState();
			}

			function renderThreadState() {
				if (!threadStateEl) return;
				var channel = getActiveChannel();
				var canShowMembersTab = !!(channel && !channel.encrypted);
				var isMember = canShowMembersTab && isOfficialChannel(channel);
				var waitingForAccess = !!(channel && channel.sdk === 'bootstrap' && !isConnectedServerOwner());
				if (!canShowMembersTab && activeThreadTab === 'members') {
					activeThreadTab = 'chat';
				}
				if (waitingForAccess && activeThreadTab === 'members') {
					activeThreadTab = 'chat';
				}
				var members = getActiveChannelMembers();
				var pendingCount = getPendingJoinRequestCount(getActiveJoinRequests());
				var html = '';
				if (canShowMembersTab) {
					if (waitingForAccess) {
						html += '<span class="thunder-thread-tab disabled" title="Not a member">\ud83d\udd12 No access</span>';
					} else {
						html += '<button class="thunder-thread-tab' + (activeThreadTab === 'members' ? ' active' : '') + '" data-thread-tab="' + (activeThreadTab === 'members' ? 'chat' : 'members') + '">';
						html += activeThreadTab === 'members' ? 'Chat' : 'Members';
						var badge = [];
						if (members.length) badge.push(String(members.length));
						if (pendingCount) badge.push(String(pendingCount) + ' req');
						if (badge.length) html += ' (' + badge.join(' \u00b7 ') + ')';
						html += '</button>';
					}
				}
				threadStateEl.innerHTML = html;
			}

		function applyComposerState() {
			var hasInput = !!String(inputEl.value || '').trim();
			var channel = getActiveChannel();
			var bootstrapName = sanitizeSlug((channel && channel.name) || activeChannel || '') || 'public';
			var waitingForOwnerChannelCreate = !!(channel && channel.sdk === 'bootstrap' && !isConnectedServerOwner());
			if (waitingForOwnerChannelCreate) {
				inputEl.disabled = true;
				inputEl.placeholder = 'Type...';
				setThreadState('', false);
				sendBtn.disabled = true;
				return;
			}
			var connectedAddress = normalizeAddress(getAddress());
			var signingAddress = normalizeAddress(getSigningAddress());
			if (!signingAddress) {
				inputEl.disabled = true;
				if (connectedAddress) {
					inputEl.placeholder = 'Reconnect Sui wallet to send';
					setThreadState('Reconnect Sui wallet signer to send on-chain', true);
				} else {
					inputEl.placeholder = 'Connect wallet to send';
					setThreadState('Connect wallet to send on-chain', true);
				}
				sendBtn.disabled = true;
				return;
			}
			var blocked = mutedState.server || mutedState.channel;
			inputEl.disabled = blocked;
			if (blocked) {
				if (mutedState.server) {
					inputEl.placeholder = 'Muted by server moderator';
					setThreadState('Muted in this server', true);
				} else {
					inputEl.placeholder = 'Muted in this channel';
					setThreadState('Muted in this channel', true);
				}
			} else {
				inputEl.placeholder = 'Type a message...';
				setThreadState('', false);
			}
			sendBtn.disabled = blocked || !hasInput || isSending;
		}

		function renderServerHeader() {
			var titleSlug = sanitizeSlug(normalizeName(CONFIG.name || ''))
				|| ((isOwnerScope() && firstChannelDefaultName) ? firstChannelDefaultName : '');
			if (!titleSlug) {
				var fromDisplay = sanitizeSlug(normalizeName(server.displayName || ''));
				if (fromDisplay && fromDisplay !== 'sui-ski') titleSlug = fromDisplay;
			}
			if (!titleSlug) {
				var fromServer = sanitizeSlug(normalizeName(server.name || ''));
				if (fromServer && fromServer !== 'sui-ski') titleSlug = fromServer;
			}
			if (titleSlug) {
				var titleHost = getProfileHostForNetwork();
				var titleHref = 'https://' + encodeURIComponent(titleSlug) + '.' + titleHost + '?via=thunder&source=server-title';
				serverTitleEl.innerHTML = '<a class="thunder-server-title-link" href="' + escapeHtml(titleHref) + '" title="Open ' + escapeHtml(titleSlug) + '.sui.ski">@' + escapeHtml(titleSlug) + '</a>';
			} else {
				serverTitleEl.textContent = server.displayName || 'Secure Chat';
			}
			var connectedAddress = normalizeAddress(getAddress());
			var ownerAddress = getConnectedOwnerAddress();
			var visibleAddress = ownerAddress || connectedAddress || '';
			if (visibleAddress) {
				var explorerHref = getAddressExplorerHref(visibleAddress);
				serverMetaEl.innerHTML = '<a class="thunder-server-meta-link" href="' + escapeHtml(explorerHref) + '" target="_blank" rel="noopener noreferrer" title="' + escapeHtml(visibleAddress) + '">' + escapeHtml(truncateAddress(visibleAddress)) + '</a>';
			} else {
				serverMetaEl.textContent = getSdkLabel();
			}
		}

		function renderModeBanner(channel) {
			var badge = document.getElementById('thunder-onchain-badge');
			if (badge) {
				badge.style.display = isOfficialChannel(channel) ? 'inline-flex' : 'none';
			}
		}

		function renderComposerIdentity() {
			if (!composerIdentityEl) return;
			var connectedAddress = normalizeAddress(getAddress());
			var signingAddress = normalizeAddress(getSigningAddress());
			ensureSelectedSenderName();
			var connectedPrimary = selectedSenderName || getConnectedPrimarySlug();
			var ownerConnected = isConnectedOwnerPrimary(connectedAddress);
			if (!connectedAddress) {
				composerIdentityEl.className = 'thunder-composer-identity';
				composerIdentityEl.innerHTML = '<span class="thunder-composer-identity-label">Connect wallet to send</span>';
				return;
			}
			if (!signingAddress) {
				composerIdentityEl.className = 'thunder-composer-identity';
				composerIdentityEl.innerHTML = '<span class="thunder-composer-identity-label">Reconnect Sui wallet signer</span>'
					+ '<span class="thunder-composer-identity-address">' + escapeHtml(truncateAddress(connectedAddress)) + '</span>';
				return;
			}
			composerIdentityEl.className = ownerConnected
				? 'thunder-composer-identity owner'
				: 'thunder-composer-identity';
			if (!senderNameOptions.length) {
				composerIdentityEl.innerHTML = '<span class="thunder-composer-identity-label">@</span>'
					+ '<span class="thunder-composer-identity-address">' + escapeHtml(truncateAddress(connectedAddress)) + '</span>';
				renderAuthorModal();
				return;
			}
			var selectedLabel = connectedPrimary
				? connectedPrimary
				: truncateAddress(connectedAddress);
			var selectedOwnerPrimaryClass = isOwnerPrimaryName(selectedLabel) ? ' owner-primary' : '';
			var atChipHtml = '<button type="button" class="thunder-at-chip" data-action="toggle-author-picker" aria-label="Switch identity" title="Switch identity">@</button>';
			var selectedHtml = '<span class="thunder-composer-identity-pill'
				+ selectedOwnerPrimaryClass
				+ '">' + escapeHtml(selectedLabel) + '</span>';
			composerIdentityEl.innerHTML = atChipHtml + selectedHtml;
			renderAuthorModal();
		}

		function renderAuthorModal() {
			var panel = document.getElementById('thunder-panel');
			if (!panel) return;
			var existing = document.getElementById('thunder-author-modal');
			if (!isAuthorPickerOpen || !senderNameOptions.length) {
				if (existing) existing.remove();
				return;
			}
			var connectedPrimary = selectedSenderName || getConnectedPrimarySlug();
			var normalizedFilter = String(senderNameFilter || '').trim().toLowerCase();
			var filteredNames = [];
			for (var i = 0; i < senderNameOptions.length; i++) {
				var option = senderNameOptions[i];
				if (!normalizedFilter || option.indexOf(normalizedFilter) !== -1) {
					filteredNames.push(option);
				}
			}
			var chipsHtml = '';
			for (var j = 0; j < filteredNames.length; j++) {
				var chipName = filteredNames[j];
				var selectedClass = chipName === connectedPrimary ? ' selected' : '';
				var ownerPrimaryClass = isOwnerPrimaryName(chipName) ? ' owner-primary' : '';
				chipsHtml += '<button type="button" class="thunder-author-chip' + selectedClass + ownerPrimaryClass + '" data-author-name="' + escapeHtml(chipName) + '">' + escapeHtml(chipName) + '</button>';
			}
			if (!chipsHtml) chipsHtml = '<span class="thunder-composer-identity-address">No matching linked names</span>';
			var filterInputHtml = senderNameOptions.length > 6
				? '<input class="thunder-author-filter" id="thunder-author-filter" type="text" placeholder="Filter names" value="' + escapeHtml(senderNameFilter || '') + '">'
				: '';
			var modalHtml = '<div class="thunder-author-modal-backdrop" data-action="close-author-modal"></div>'
				+ '<div class="thunder-author-modal-content">'
				+ '<button type="button" class="thunder-author-modal-close" data-action="close-author-modal" aria-label="Close">\u00d7</button>'
				+ filterInputHtml
				+ '<div class="thunder-author-chip-grid">' + chipsHtml + '</div>'
				+ '</div>';
			if (!existing) {
				existing = document.createElement('div');
				existing.id = 'thunder-author-modal';
				existing.className = 'thunder-author-modal';
				panel.appendChild(existing);
			}
			existing.innerHTML = modalHtml;
		}

		function openBrandProfileOrConnect() {
			var primaryName = sanitizeSlug(normalizeName(getPrimaryName()));
			if (primaryName) {
				var profileHost = getProfileHostForNetwork();
				var profileHref = 'https://' + encodeURIComponent(primaryName) + '.' + profileHost + '?via=thunder&source=dotski-icon';
				window.location.href = profileHref;
				return;
			}

			var hasAddress = !!normalizeAddress(getAddress());
			var promptText = hasAddress
				? 'No primary name found for this wallet yet. Open sui.ski to connect and set your primary profile?'
				: 'Connect your wallet on sui.ski to open your primary profile. Open now?';
			if (!window.confirm(promptText)) return;
			window.location.href = 'https://sui.ski?connect=1&via=thunder&source=dotski-icon';
		}

		function renderChannelList() {
			var publicChannels = [];
			var privateChannels = [];
			var extraPublicChannels = [];
			for (var i = 0; i < channels.length; i++) {
				var nextChannel = channels[i];
				var isPrivate = !!nextChannel.encrypted || String(nextChannel.id || '').indexOf('dm-') === 0;
				if (isPrivate) {
					privateChannels.push(nextChannel);
				} else if (isOfficialChannel(nextChannel) && !isCanonicalPublicChannel(nextChannel)) {
					extraPublicChannels.push(nextChannel);
				} else {
					publicChannels.push(nextChannel);
				}
			}
			if (!publicChannels.length && !privateChannels.length) {
				var seededName = sanitizeSlug(firstChannelDefaultName || '') || 'public';
				publicChannels.push({
					id: seededName,
					name: seededName,
					description: 'Bootstrap public channel',
					encrypted: false,
					protected: true,
					custom: false,
					createdAt: Date.now(),
					sdk: 'bootstrap',
				});
			}
			if (!showExtraPublicChannels && activeChannel) {
				for (var ac = 0; ac < extraPublicChannels.length; ac++) {
					if (extraPublicChannels[ac] && extraPublicChannels[ac].id === activeChannel) {
						var canonical = getCanonicalPublicChannelId();
						if (canonical && canonical !== activeChannel) activeChannel = canonical;
						break;
					}
				}
			}

			var html = '';
			function renderChannelItem(channel, allowBurn) {
				var isActive = channel.id === activeChannel;
				var isPinned = isCanonicalPublicChannel(channel);
				var displayName = channel.name;
				var displayPrefix = channel.encrypted ? '🔒 ' : '★ ';
				var displayLabel = displayPrefix + String(displayName || '');
				var isBootstrap = channel.sdk === 'bootstrap';
				var showAccept = isBootstrap && isConnectedServerOwner() && !channelAcceptPending;
				var state = getOfficialChannelState(channel.id);
				var canManage = !!(state && state.canManage);
				var showBurn = !!(allowBurn && isOfficialChannel(channel) && canManage && !isPinned);
				var isBurning = !!channelBurnPendingById[channel.id];
				var ownerGold = !channel.encrypted && isConnectedServerOwner() ? ' owner-gold' : '';
				html += '<div class="thunder-channel-item' + (isActive ? ' active' : '') + (isPinned ? ' pinned' : '') + ownerGold + '" data-channel="' + escapeHtml(channel.id) + '">'
					+ '<span class="thunder-channel-main">'
					+ '<span class="thunder-channel-name">' + escapeHtml(displayLabel) + '</span>'
					+ '</span>';
				if (showAccept) {
					html += '<button class="thunder-channel-accept-btn" data-accept-channel="' + escapeHtml(channel.id) + '" title="Create #' + escapeHtml(displayName) + ' on-chain">Accept</button>';
				} else if (isBootstrap && channelAcceptPending) {
					html += '<span class="thunder-channel-accept-pending">...</span>';
				} else if (showBurn) {
					html += '<button class="thunder-channel-delete" data-burn-channel="' + escapeHtml(channel.id) + '"'
						+ (isBurning ? ' disabled' : '')
						+ ' title="Delete #' + escapeHtml(displayName) + ' for storage rebate">'
						+ (isBurning ? '...' : '✕')
						+ '</button>';
				}
				html += '</div>';
			}
			function renderChannelSection(title, list, allowBurn) {
				html += '<div class="thunder-channel-group">';
				html += '<div class="thunder-channel-group-title">' + escapeHtml(title) + '</div>';
				if (!list.length) {
					html += '<div class="thunder-sidebar-empty">No ' + escapeHtml(title.toLowerCase()) + ' channels</div>';
				} else {
					for (var j = 0; j < list.length; j++) {
						renderChannelItem(list[j], !!allowBurn);
					}
				}
				html += '</div>';
			}

			renderChannelSection('Public', publicChannels, false);
			if (extraPublicChannels.length) {
				var ownerCanClean = isConnectedServerOwner();
				html += '<div class="thunder-channel-group thunder-channel-group-extra">';
				html += '<div class="thunder-extra-head">';
				html += '<button class="thunder-extra-toggle" data-toggle-extra-public="' + (showExtraPublicChannels ? 'hide' : 'show') + '">'
					+ (showExtraPublicChannels ? 'Hide extras' : 'Show extras')
					+ ' (' + String(extraPublicChannels.length) + ')</button>';
				if (ownerCanClean) {
					html += '<button class="thunder-extra-clean" data-clean-extra-public="1">Burn extras</button>';
				}
				html += '</div>';
				if (showExtraPublicChannels) {
					for (var ep = 0; ep < extraPublicChannels.length; ep++) {
						renderChannelItem(extraPublicChannels[ep], true);
					}
				} else {
					html += '<div class="thunder-sidebar-empty">Hidden until expanded.</div>';
				}
				html += '</div>';
			}
			renderChannelSection('Private', privateChannels, true);

			channelListEl.innerHTML = html;
			updateDeleteAllButton();
			updateResetLocalButton();
		}

		function getDeletableChannelIds() {
			var deletable = [];
			for (var i = 0; i < channels.length; i++) {
				var channel = channels[i];
				if (!channel || !isOfficialChannel(channel) || isCanonicalPublicChannel(channel)) continue;
				deletable.push(channel.id);
			}
			return deletable;
		}

		function updateDeleteAllButton() {
			if (!deleteAllBtn) return;
			if (!isConnectedServerOwner()) {
				deleteAllBtn.style.display = 'none';
				return;
			}
			var deletable = getDeletableChannelIds();
			if (!deletable.length) {
				deleteAllBtn.style.display = 'none';
				return;
			}
			deleteAllBtn.style.display = 'inline-flex';
			deleteAllBtn.textContent = 'Delete All (' + String(deletable.length) + ')';
		}

		function updateResetLocalButton() {
			if (!resetLocalBtn) return;
			var hasMeta = false;
			for (var metaKey in channelMetaById) {
				if (Object.prototype.hasOwnProperty.call(channelMetaById, metaKey)) {
					hasMeta = true;
					break;
				}
			}
			var hasDismissed = false;
			for (var dismissKey in dismissedChannelIds) {
				if (Object.prototype.hasOwnProperty.call(dismissedChannelIds, dismissKey)) {
					hasDismissed = true;
					break;
				}
			}
			resetLocalBtn.disabled = !(hasMeta || hasDismissed);
		}

		async function resetLocalChannelStorage() {
			if (!window.localStorage) {
				addSystemMessage('Local storage is unavailable in this browser context.');
				return;
			}
			var confirmed = window.confirm('Clear local Thunder channel cache for this browser? This only affects local labels and dismissed channels.');
			if (!confirmed) return;
			try {
				var keysToRemove = [];
				for (var i = 0; i < window.localStorage.length; i++) {
					var key = window.localStorage.key(i);
					if (!key) continue;
					if (key.indexOf(CHANNEL_META_CACHE_KEY_PREFIX + ':') === 0) {
						keysToRemove.push(key);
						continue;
					}
					if (key.indexOf('thunder-dismissed:') === 0) {
						keysToRemove.push(key);
					}
				}
				for (var k = 0; k < keysToRemove.length; k++) {
					window.localStorage.removeItem(keysToRemove[k]);
				}
			} catch (_e) {}

			channelMetaById = {};
			dismissedChannelIds = {};
			officialChannelStateById = {};
			channelMessages = {};
			channelMembersByChannelId = {};
			joinRequestsByChannelId = {};
			linkedCandidatesByChannelId = {};
			showExtraPublicChannels = false;
			activeChannel = '';

			loadStoredChannelMeta();
			loadDismissedChannels();
			updateResetLocalButton();
			addSystemMessage('Local Thunder cache cleared. Reloading channels...');
			await loadChannels();
		}


		function ensureActiveChannel() {
			if (!channels.length) {
				activeChannel = getCanonicalPublicChannelName();
				return;
			}
			for (var i = 0; i < channels.length; i++) {
				if (channels[i].id === activeChannel) {
					if (showExtraPublicChannels) return;
					if (isOfficialChannel(channels[i]) && !channels[i].encrypted && !isCanonicalPublicChannel(channels[i])) {
						var canonicalId = getCanonicalPublicChannelId();
						if (canonicalId && canonicalId !== activeChannel) {
							activeChannel = canonicalId;
						}
					}
					return;
				}
			}
			var seededName = sanitizeSlug(normalizeName(CONFIG.name || '')) || sanitizeSlug(firstChannelDefaultName || '');
			if (seededName) {
				for (var s = 0; s < channels.length; s++) {
					var seededChannelName = sanitizeSlug(channels[s] && channels[s].name ? channels[s].name : '');
					if (seededChannelName === seededName && !channels[s].encrypted) {
						activeChannel = channels[s].id;
						return;
					}
				}
			}
			for (var p = 0; p < channels.length; p++) {
				var publicName = sanitizeSlug(channels[p] && channels[p].name ? channels[p].name : '');
				if (publicName === 'public' && !channels[p].encrypted) {
					activeChannel = channels[p].id;
					return;
				}
			}
			if (!isOwnerScope()) {
				var preferred = sanitizeSlug(CONFIG.name || '');
				if (preferred) {
					for (var j = 0; j < channels.length; j++) {
						if (channels[j].id === preferred) {
							activeChannel = preferred;
							return;
						}
					}
				}
			}
			activeChannel = channels[0].id;
		}

			function renderMessages() {
				var channel = getActiveChannel();
				var official = isOfficialChannel(channel);
				var displayChannelName = channel
					? channel.name
				: (activeChannel || 'public');
			var requestChannelName = getJoinRequestChannelSlug(channel)
				|| sanitizeSlug(displayChannelName || '')
				|| 'public';
				channelNameEl.textContent = (channel && channel.encrypted ? '🔒 ' : '#') + displayChannelName;
				var gearWrap = document.getElementById('thunder-channel-gear-wrap');
				if (gearWrap) {
					var chState = getOfficialChannelState(activeChannel);
					var showGear = !!(official && chState && chState.canManage);
					gearWrap.style.display = showGear ? '' : 'none';
					gearWrap.dataset.channelId = activeChannel || '';
					var gearStormBtn = document.getElementById('thunder-gear-storm');
					if (gearStormBtn) {
						var activeOnChainId = chState && chState.channelId ? normalizeAddress(chState.channelId) : '';
						var mappedOnChainId = normalizeAddress(stormMappedChannelId || '');
						var isMapped = !!activeOnChainId && activeOnChainId === mappedOnChainId;
						var showStormBtn = !!(showGear && !channel.encrypted && hasStormRegistryConfig());
						gearStormBtn.style.display = showStormBtn ? '' : 'none';
						gearStormBtn.textContent = isMapped ? 'Primary (current)' : 'Set primary';
						gearStormBtn.disabled = isMapped;
					}
					var gearMenu = document.getElementById('thunder-channel-gear-menu');
					if (gearMenu) gearMenu.style.display = 'none';
				}
				renderModeBanner(channel);
				renderComposerIdentity();
				renderThreadState();

				var messages = channelMessages[activeChannel] || [];
				var joinRequests = getActiveJoinRequests();
				var pendingSelfRequest = getPendingSelfJoinRequest();
				var pendingRequests = [];
				for (var pr = 0; pr < joinRequests.length; pr++) {
					if (joinRequests[pr] && joinRequests[pr].status === 'pending') pendingRequests.push(joinRequests[pr]);
				}
				var channelState = getOfficialChannelState(activeChannel);
				var currentAddress = normalizeAddress(getAddress());
				var ownerAddress = getConnectedOwnerAddress();

				if (activeThreadTab === 'members' && channel && !channel.encrypted) {
					var members = getActiveChannelMembers();
					var membersLoading = !!channelMembersLoadPendingByChannelId[activeChannel];
					var requestPendingCreate = !!joinRequestCreatePendingByChannelId[activeChannel];
					var membersHtml = '<div class="thunder-members-tab">';

					membersHtml += '<div class="thunder-members-section">';
					membersHtml += '<div class="thunder-members-title">Members (' + String(members.length) + ')</div>';
					if (membersLoading && !members.length) {
						membersHtml += '<div class="thunder-members-empty">Loading channel members...</div>';
					} else if (!members.length) {
						membersHtml += '<div class="thunder-members-empty">No members found for this channel.</div>';
						} else {
							for (var mr = 0; mr < members.length; mr++) {
								var member = members[mr];
								var memberAddress = normalizeAddress(member && member.address);
							if (!memberAddress) continue;
							var memberName = member.primaryName || truncateAddress(memberAddress) || 'unknown';
								var memberBadge = '';
								if (memberAddress === ownerAddress) memberBadge = 'Owner';
								else if (memberAddress === currentAddress) memberBadge = 'You';
								var memberOwnerPrimaryClass = isOwnerPrimaryName(memberName) || memberAddress === ownerAddress
									? ' owner-primary'
									: '';
								var removeKey = activeChannel + ':' + memberAddress;
								var removing = !!channelMemberRemovePendingByKey[removeKey];
							var canRemove = !!(
								isConnectedServerOwner()
								&& official
								&& channelState
								&& channelState.memberCapId
								&& memberAddress !== ownerAddress
							);
								membersHtml += '<div class="thunder-member-row">';
								membersHtml += '<div class="thunder-member-ident">';
								if (member.primaryName) {
									membersHtml += '<a class="thunder-member-name thunder-member-link' + memberOwnerPrimaryClass + '" href="https://' + escapeHtml(member.primaryName) + '.sui.ski" target="_blank" rel="noopener">' + escapeHtml(member.primaryName) + '</a>';
								} else {
									membersHtml += '<span class="thunder-member-name' + memberOwnerPrimaryClass + '">' + escapeHtml(memberName) + '</span>';
								}
								membersHtml += '<span class="thunder-member-address">' + escapeHtml(truncateAddress(memberAddress)) + (memberBadge ? ' · ' + escapeHtml(memberBadge) : '') + '</span>';
								membersHtml += '</div>';
							if (canRemove) {
								membersHtml += '<button class="thunder-member-remove" data-remove-member-address="' + escapeHtml(memberAddress) + '"'
									+ ' title="Remove ' + escapeHtml(memberName) + '"'
									+ (removing ? ' disabled' : '')
									+ '>'
									+ (removing ? '...' : '\u2715')
									+ '</button>';
							}
							membersHtml += '</div>';
						}
					}
					membersHtml += '</div>';

					membersHtml += '<div class="thunder-members-section">';
					membersHtml += '<div class="thunder-members-title">Join requests (' + String(pendingRequests.length) + ')</div>';
					if (isConnectedServerOwner()) {
						if (!pendingRequests.length) {
							membersHtml += '<div class="thunder-members-empty">No pending join requests.</div>';
						} else {
							for (var rq = 0; rq < pendingRequests.length; rq++) {
								var requestItem = pendingRequests[rq];
								var requestAddr = normalizeAddress(requestItem.requesterAddress);
								var requestName = requestItem.requesterName || truncateAddress(requestAddr) || 'unknown';
								var approvePending = !!joinRequestApprovePendingById[requestItem.id];
								membersHtml += '<div class="thunder-member-row">';
								membersHtml += '<div class="thunder-member-ident">';
								var requestHasName = requestItem.requesterName && requestItem.requesterName !== truncateAddress(requestAddr);
								if (requestHasName) {
									membersHtml += '<a class="thunder-member-name thunder-member-link" href="https://' + escapeHtml(sanitizeSlug(normalizeName(requestItem.requesterName))) + '.sui.ski" target="_blank" rel="noopener">' + escapeHtml(requestName) + '</a>';
								} else {
									membersHtml += '<span class="thunder-member-name">' + escapeHtml(requestName) + '</span>';
								}
								membersHtml += '<span class="thunder-member-address">' + escapeHtml(truncateAddress(requestAddr)) + '</span>';
								membersHtml += '</div>';
								membersHtml += '<div class="thunder-members-actions">';
								membersHtml += '<button class="thunder-msg-action" data-approve-join-request="' + escapeHtml(requestItem.id) + '"'
									+ (approvePending ? ' disabled' : '')
									+ '>'
									+ (approvePending ? 'Approving...' : 'Approve')
									+ '</button>';
								membersHtml += '<button class="thunder-msg-action danger" data-cancel-join-request="' + escapeHtml(requestItem.id) + '">Reject</button>';
								membersHtml += '</div>';
								membersHtml += '</div>';
							}
						}
					} else {
						if (pendingSelfRequest) {
							membersHtml += '<div class="thunder-members-empty">Your join request is pending approval.</div>';
							membersHtml += '<div class="thunder-members-actions">';
							membersHtml += '<button class="thunder-msg-action" data-cancel-join-request="' + escapeHtml(pendingSelfRequest.id) + '">Cancel request</button>';
							membersHtml += '</div>';
						} else if (requestChannelName) {
							membersHtml += '<div class="thunder-members-empty">Request access to #' + escapeHtml(requestChannelName) + ' — the owner will be notified.</div>';
							membersHtml += '<div class="thunder-members-actions">';
							membersHtml += '<button class="thunder-msg-action" data-request-join="' + escapeHtml(requestChannelName) + '"'
								+ (requestPendingCreate ? ' disabled' : '')
								+ '>'
								+ (requestPendingCreate ? 'Requesting...' : 'Request access')
								+ '</button>';
							membersHtml += '</div>';
						}
					}
					membersHtml += '</div>';

					var rawCandidates = linkedCandidatesByChannelId[activeChannel] || [];
					var pendingRequestAddrs = {};
					for (var pra = 0; pra < pendingRequests.length; pra++) {
						var praAddr = normalizeAddress(pendingRequests[pra].requesterAddress);
						if (praAddr) pendingRequestAddrs[praAddr] = true;
					}
					var candidates = [];
					for (var fc = 0; fc < rawCandidates.length; fc++) {
						var fcAddr = normalizeAddress(rawCandidates[fc]);
						if (fcAddr && !pendingRequestAddrs[fcAddr]) candidates.push(fcAddr);
					}
					if (candidates.length && isConnectedServerOwner()) {
						membersHtml += '<div class="thunder-members-section">';
						membersHtml += '<div class="thunder-members-title">Linked addresses (' + String(candidates.length) + ')</div>';
						for (var lc = 0; lc < candidates.length; lc++) {
							var lcAddress = normalizeAddress(candidates[lc]);
							if (!lcAddress) continue;
							var lcPendingKey = activeChannel + ':add:' + lcAddress;
							var lcAdding = !!linkedCandidateAddPendingByKey[lcPendingKey];
							var lcName = getCachedSenderName(lcAddress) || '';
							membersHtml += '<div class="thunder-member-row">';
							membersHtml += '<div class="thunder-member-ident">';
							if (lcName) {
								membersHtml += '<a class="thunder-member-name thunder-member-link" href="https://' + escapeHtml(lcName) + '.sui.ski" target="_blank" rel="noopener">' + escapeHtml(lcName) + '</a>';
							} else {
								membersHtml += '<span class="thunder-member-name">' + escapeHtml(truncateAddress(lcAddress)) + '</span>';
							}
							membersHtml += '<span class="thunder-member-address">' + escapeHtml(truncateAddress(lcAddress)) + ' · Linked · not a member</span>';
							membersHtml += '</div>';
							membersHtml += '<button class="thunder-msg-action" data-add-linked-candidate="' + escapeHtml(lcAddress) + '"'
								+ (lcAdding ? ' disabled' : '')
								+ '>'
								+ (lcAdding ? 'Adding...' : 'Add')
								+ '</button>';
							membersHtml += '</div>';
						}
						membersHtml += '</div>';
					}

					membersHtml += '</div>';
					messagesEl.innerHTML = membersHtml;
					messagesEl.scrollTop = 0;
					return;
				}

				if (!messages.length) {
					if (channel && channel.sdk === 'bootstrap') {
						var bootstrapName = sanitizeSlug((channel && channel.name) || activeChannel || '') || 'public';
						if (isConnectedServerOwner()) {
							var createPrompt = '<div class="thunder-msg system">Send a message to create #' + escapeHtml(bootstrapName) + ' on-chain.</div>';
							messagesEl.innerHTML = createPrompt;
						} else {
							var requestPending = !!joinRequestCreatePendingByChannelId[activeChannel];
							var requestActionHtml = '<div class="thunder-access-gate">';
							if (pendingSelfRequest) {
								requestActionHtml += '<div class="thunder-access-status">Request pending</div>';
								requestActionHtml += '<button class="thunder-access-btn cancel" data-cancel-join-request="' + escapeHtml(pendingSelfRequest.id) + '">Cancel request</button>';
							} else {
								requestActionHtml += '<button class="thunder-access-btn" data-request-join="' + escapeHtml(bootstrapName) + '"'
									+ (requestPending ? ' disabled' : '')
									+ '>'
									+ (requestPending ? 'Requesting...' : 'Request Access')
									+ '</button>';
							}
							requestActionHtml += '</div>';
							messagesEl.innerHTML = requestActionHtml;
					}
						return;
					}
					if (!channels.length && isConnectedServerOwner()) {
						var suggestedName = sanitizeSlug(normalizeName(CONFIG.name || '')) || sanitizeSlug(firstChannelDefaultName || '') || 'public';
						messagesEl.innerHTML = '<div class="thunder-msg system">Create #' + escapeHtml(suggestedName) + ' as your first public channel.</div>';
						return;
					}
					if (messagesInitialLoadPending) {
						messagesEl.innerHTML = '<div class="thunder-loading">'
							+ '<div class="thunder-loading-bolt">'
							+ '<svg viewBox="0 0 32 48" fill="none"><path d="M18 2L4 22h10L12 46l16-24H18L20 2z" fill="url(#tbl)" stroke="rgba(250,204,21,0.6)" stroke-width="0.5"/><defs><linearGradient id="tbl" x1="14" y1="2" x2="18" y2="46"><stop offset="0%" stop-color="rgba(250,204,21,0.9)"/><stop offset="100%" stop-color="rgba(234,179,8,0.5)"/></linearGradient></defs></svg>'
							+ '</div>'
							+ '<span class="thunder-loading-text">channeling\u2026</span>'
							+ '</div>';
						return;
					}
					messagesEl.innerHTML = '<div class="thunder-msg system">No messages yet. Start the conversation.</div>';
					return;
				}

				var ownerPrimaryConnected = isConnectedOwnerPrimary(currentAddress) || isProfileOwnerPrimaryConnected(currentAddress);
				var html = '';
				if (!isConnectedServerOwner() && pendingSelfRequest && !channel.encrypted) {
					html += '<div class="thunder-msg system">Join request pending for #' + escapeHtml(requestChannelName) + '.</div>';
				}
				for (var i = 0; i < messages.length; i++) {
					var message = messages[i];
					var isSystem = message.role === 'system';
				if (isSystem) {
					html += '<div class="thunder-msg system">' + escapeHtml(message.content || '') + '</div>';
					continue;
				}

					var sender = normalizeAddress(message.sender);
					var isMine = !!sender && sender === currentAddress;
					var senderIsOwnerPrimary = isOwnerPrimaryName(message.senderName || '');
					var msgClass = isMine
						? (ownerPrimaryConnected ? 'user owner' : 'user')
						: 'peer';
					if (senderIsOwnerPrimary) msgClass += ' owner-primary';
					var ownerAddress = getConnectedOwnerAddress();
					var senderIsOwnerLinked = !senderIsOwnerPrimary
						&& !!sender && !!ownerAddress && sender === ownerAddress;
					if (senderIsOwnerLinked) msgClass += ' owner-linked';
					var displayName = message.senderName || truncateAddress(message.sender) || 'Unknown';
				var senderHref = buildSenderProfileHref(message);
				var timeText = formatTime(message.timestamp);
				html += '<div class="thunder-msg ' + msgClass + '">'
					+ '<div class="thunder-msg-head">'
					+ (
						senderHref
							? '<a class="thunder-msg-sender thunder-msg-sender-link" href="' + escapeHtml(senderHref) + '" title="Open ' + escapeHtml(displayName) + '.sui.ski">' + escapeHtml(displayName) + '</a>'
							: '<span class="thunder-msg-sender">' + escapeHtml(displayName) + '</span>'
					)
					+ '<span class="thunder-msg-time">' + escapeHtml(timeText) + '</span>'
					+ '</div>'
					+ '<div>' + escapeHtml(message.content || '').replace(/\\n/g, '<br>') + '</div>';

				html += '</div>';
			}

			var wasNearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;
			messagesEl.innerHTML = html;
			if (wasNearBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
		}

		function addSystemMessage(text) {
			if (!channelMessages[activeChannel]) channelMessages[activeChannel] = [];
			channelMessages[activeChannel].push({ role: 'system', content: text, timestamp: Date.now() });
			renderMessages();
		}

		function getJoinRequestChannelSlug(channel) {
			var target = channel || getActiveChannel();
			if (target && target.encrypted) return '';
			var preferred = sanitizeSlug((target && target.name) || activeChannel || '');
			if (preferred) return preferred;
			return sanitizeSlug(getCanonicalPublicChannelName() || '') || 'public';
		}

		function getActiveJoinRequests() {
			var list = joinRequestsByChannelId[activeChannel];
			return Array.isArray(list) ? list : [];
		}

			function getPendingSelfJoinRequest() {
				var requester = normalizeAddress(getAddress());
				if (!requester) return null;
				var list = getActiveJoinRequests();
				for (var i = 0; i < list.length; i++) {
				var item = list[i];
				if (!item || item.status !== 'pending') continue;
				if (normalizeAddress(item.requesterAddress) === requester) return item;
			}
			return null;
		}

		async function loadJoinRequestsForActiveChannel() {
			if (!activeChannel) return;
			var channel = getActiveChannel();
			var requestChannel = getJoinRequestChannelSlug(channel);
			if (!requestChannel) {
				joinRequestsByChannelId[activeChannel] = [];
				if (isOpen) renderMessages();
				return;
			}
			if (joinRequestLoadPendingByChannelId[activeChannel]) return;
			joinRequestLoadPendingByChannelId[activeChannel] = true;
			try {
				var response = await fetch(
					getMessagingServerApiPath('/channels/' + encodeURIComponent(requestChannel) + '/join-requests'),
					{ credentials: 'include' },
				);
				if (response.status === 401) {
					joinRequestsByChannelId[activeChannel] = [];
					return;
				}
				if (!response.ok) {
					throw new Error('Request list failed: HTTP ' + String(response.status));
				}
				var data = await response.json();
				var incoming = Array.isArray(data && data.requests) ? data.requests : [];
				var mapped = [];
				for (var i = 0; i < incoming.length; i++) {
					var item = incoming[i];
					if (!item || typeof item !== 'object') continue;
					var requestId = String(item.id || '').trim();
					var requesterAddress = normalizeAddress(item.requesterAddress);
					if (!requestId || !requesterAddress) continue;
					mapped.push({
						id: requestId,
						requesterAddress: requesterAddress,
						requesterName: sanitizeSlug(normalizeName(item.requesterName || '')) || '',
						note: String(item.note || ''),
						status: String(item.status || 'pending'),
						createdAt: Number(item.createdAt || Date.now()),
					});
				}
				joinRequestsByChannelId[activeChannel] = mapped;
			} catch (error) {
				console.warn('Failed to load channel join requests:', error);
			} finally {
				delete joinRequestLoadPendingByChannelId[activeChannel];
				if (isOpen) {
					renderMessages();
					renderThreadState();
				}
			}
		}

		async function requestJoinForActiveChannel() {
			if (!activeChannel || joinRequestCreatePendingByChannelId[activeChannel]) return;
			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				addSystemMessage('Connect a Sui wallet signer to request channel access.');
				return;
			}
			var channel = getActiveChannel();
			var requestChannel = getJoinRequestChannelSlug(channel);
			if (!requestChannel) {
				addSystemMessage('Select a public channel to request access.');
				return;
			}
			joinRequestCreatePendingByChannelId[activeChannel] = true;
			renderMessages();
			try {
				var authorName = sanitizeSlug(normalizeName(selectedSenderName || getPrimaryName() || '')) || '';
				var response = await fetch(
					getMessagingServerApiPath('/channels/' + encodeURIComponent(requestChannel) + '/join-requests'),
					{
						method: 'POST',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							requesterAddress: senderAddress,
							requesterName: authorName || null,
						}),
					},
				);
				var data = await response.json().catch(function() { return null; });
				if (!response.ok) {
					throw new Error(String(data && data.error ? data.error : 'Request failed'));
				}
				if (data && data.duplicate) {
					addSystemMessage('Join request for #' + requestChannel + ' is already pending.');
				} else {
					addSystemMessage('Requested access to #' + requestChannel + '. Owner can approve from linked names.');
				}
				await loadJoinRequestsForActiveChannel();
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				addSystemMessage('Failed to request access: ' + errText);
			} finally {
				delete joinRequestCreatePendingByChannelId[activeChannel];
				renderMessages();
				applyComposerState();
			}
		}

		async function cancelJoinRequest(requestId) {
			var cleanId = String(requestId || '').trim();
			if (!cleanId || !activeChannel) return;
			var channel = getActiveChannel();
			var requestChannel = getJoinRequestChannelSlug(channel);
			if (!requestChannel) return;
			try {
				var response = await fetch(
					getMessagingServerApiPath(
						'/channels/' + encodeURIComponent(requestChannel) + '/join-requests/' + encodeURIComponent(cleanId),
					),
					{ method: 'DELETE', credentials: 'include' },
				);
				var data = await response.json().catch(function() { return null; });
				if (!response.ok) {
					throw new Error(String(data && data.error ? data.error : 'Cancel failed'));
				}
				await loadJoinRequestsForActiveChannel();
				addSystemMessage('Cancelled join request for #' + requestChannel + '.');
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				addSystemMessage('Failed to cancel join request: ' + errText);
			}
		}

		async function approveJoinRequest(requestId) {
			var cleanId = String(requestId || '').trim();
			if (!cleanId || joinRequestApprovePendingById[cleanId]) return;
			if (!isConnectedServerOwner()) {
				addSystemMessage('Only the owner wallet can approve join requests.');
				return;
			}
			var channel = getActiveChannel();
			if (!isOfficialChannel(channel)) {
				addSystemMessage('Select an on-chain channel before approving requests.');
				return;
			}
			var state = getOfficialChannelState(activeChannel);
			if (!state || !state.channelId || !state.memberCapId) {
				addSystemMessage('Channel state is missing member capability.');
				return;
			}
			var requestList = getActiveJoinRequests();
			var requestItem = null;
			for (var i = 0; i < requestList.length; i++) {
				if (requestList[i] && String(requestList[i].id || '') === cleanId) {
					requestItem = requestList[i];
					break;
				}
			}
			if (!requestItem) {
				addSystemMessage('Join request no longer exists.');
				await loadJoinRequestsForActiveChannel();
				return;
			}
			var requesterAddress = normalizeAddress(requestItem.requesterAddress);
			if (!requesterAddress) {
				addSystemMessage('Join request has an invalid requester address.');
				return;
			}
			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				addSystemMessage('Reconnect wallet signer to approve join requests.');
				return;
			}
			joinRequestApprovePendingById[cleanId] = true;
			renderMessages();
			try {
				var client = await ensureOfficialMessagingClient();
				if (!client) throw new Error('Official messaging client unavailable');
				var membersResp = await client.getChannelMembers(state.channelId);
				var members = membersResp && Array.isArray(membersResp.members) ? membersResp.members : [];
				var alreadyMember = false;
				for (var m = 0; m < members.length; m++) {
					var memberAddress = normalizeAddress(members[m] && members[m].memberAddress ? members[m].memberAddress : '');
					if (!memberAddress) continue;
					if (memberAddress === requesterAddress) {
						alreadyMember = true;
						break;
					}
				}
					var txDigest = '';
					if (!alreadyMember) {
						var txResult = await addMembersToOfficialChannel(state, senderAddress, [requesterAddress], client);
						txDigest = String(
							(txResult && (
								txResult.digest
								|| txResult.txDigest
								|| txResult.transactionDigest
							)) || '',
						).trim();
					}
				var requestChannel = getJoinRequestChannelSlug(channel);
				var approveResp = await fetch(
					getMessagingServerApiPath(
						'/channels/' + encodeURIComponent(requestChannel) + '/join-requests/' + encodeURIComponent(cleanId) + '/approve',
					),
					{
						method: 'POST',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ txDigest: txDigest || null }),
					},
				);
				var approveData = await approveResp.json().catch(function() { return null; });
				if (!approveResp.ok) {
					throw new Error(String(approveData && approveData.error ? approveData.error : 'Approve failed'));
				}
					await loadJoinRequestsForActiveChannel();
					await loadMembersForActiveChannel();
				var requesterName = requestItem.requesterName || truncateAddress(requesterAddress);
				addSystemMessage('Approved join request for ' + requesterName + ' in #' + requestChannel + '.');
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				addSystemMessage('Failed to approve join request: ' + errText);
			} finally {
				delete joinRequestApprovePendingById[cleanId];
				renderMessages();
			}
		}

		function findSyntheticChannelIdByObjectId(channelId) {
			for (var key in officialChannelStateById) {
				if (!Object.prototype.hasOwnProperty.call(officialChannelStateById, key)) continue;
				var state = officialChannelStateById[key];
				if (state && state.channelId === channelId) return key;
			}
			return '';
		}

		function hasPublicChannel(list) {
			if (!Array.isArray(list)) return false;
			for (var i = 0; i < list.length; i++) {
				var next = list[i];
				if (!next || next.encrypted) continue;
				return true;
			}
			return false;
		}

		async function hasAnyOnChainChannelMembership(address, client) {
			var owner = normalizeAddress(address);
			if (!owner) return false;
			var messagingClient = client || await ensureOfficialMessagingClient();
			if (!messagingClient || typeof messagingClient.getChannelMemberships !== 'function') return false;
			try {
				var resp = await messagingClient.getChannelMemberships({
					owner: owner,
					limit: 1,
				});
				var memberships = resp && Array.isArray(resp.memberships) ? resp.memberships : [];
				return memberships.length > 0;
			} catch (_e) {
				return false;
			}
		}

		async function loadChannels() {
			if (loadChannelsInFlight) return;
			loadChannelsInFlight = true;
			try {
				await resolveFirstChannelDefaultName().catch(function() {});
				var resolvedOwnerAddress = normalizeAddress(await resolveEffectiveOwnerAddress().catch(function() { return ''; }));
				server.ownerAddress = resolvedOwnerAddress || null;
				var officialChannels = await loadOfficialChannels();
				channels = officialChannels;
				var serverIdentityName = sanitizeSlug(normalizeName(CONFIG.name || ''))
					|| ((isOwnerScope() && firstChannelDefaultName) ? firstChannelDefaultName : '')
					|| sanitizeSlug(normalizeName(server.name || 'on-chain'))
					|| 'on-chain';
				var serverIdentityDisplay = CONFIG.name
					? (sanitizeSlug(normalizeName(CONFIG.name)) + '.sui')
					: ((isOwnerScope() && firstChannelDefaultName) ? (firstChannelDefaultName + '.sui') : 'On-chain');
				server = {
					id: 'on-chain',
					name: serverIdentityName,
					displayName: serverIdentityDisplay,
					ownerAddress: resolvedOwnerAddress || normalizeAddress(CONFIG.ownerAddress) || null,
					isModerator: false,
				};
				moderation = { serverMuted: [], channelMuted: {} };
				ensureActiveChannel();
				renderServerHeader();
				renderChannelList();
				messagesInitialLoadPending = true;
				renderMessages();
				applyComposerState();
					if (activeChannel) await pollChannelMessages();
					if (activeChannel) {
						await loadJoinRequestsForActiveChannel().catch(function() {});
						await loadMembersForActiveChannel().catch(function() {});
					}
				} catch (_e) {
					messagesInitialLoadPending = false;
					console.warn('[ski-chat] loadChannels failed:', _e);
				} finally {
					loadChannelsInFlight = false;
				}
			}

		async function pollChannelMessages() {
			if (!isOpen || !activeChannel) return;
			var channel = getActiveChannel();
			if (!isOfficialChannel(channel)) return;
			try {
				var state = getOfficialChannelState(activeChannel);
				var client = await ensureOfficialMessagingClient();
				var userAddress = normalizeAddress(getAddress());
				if (!state || !client || !userAddress) {
					messagesInitialLoadPending = false;
					return;
				}
				var result = await client.getChannelMessages({
					channelId: state.channelId,
					userAddress: userAddress,
					limit: OFFICIAL_MESSAGE_LIMIT,
					direction: 'backward',
				});
				messagesInitialLoadPending = false;
				var sourceMessages = result && Array.isArray(result.messages) ? result.messages : [];
				var mapped = [];
				for (var i = 0; i < sourceMessages.length; i++) {
					var item = sourceMessages[i] || {};
					var senderAddress = normalizeAddress(item.sender || '');
					var createdAt = Number(item.createdAtMs || Date.now());
					var rawText = String(item.text || '');
					if (rawText.indexOf('"x-sui-') !== -1 || rawText.indexOf('"sui-node/') !== -1) continue;
					var skiParsed = parseSkiMessagePayload(rawText);
					mapped.push({
						id: state.channelId + ':' + String(i) + ':' + String(createdAt),
						serverId: server.id,
						channel: activeChannel,
						sender: senderAddress,
						senderName: '',
						claimedSenderName: skiParsed.claimedAuthor || '',
						content: String(skiParsed.content || ''),
						encrypted: true,
						timestamp: isFinite(createdAt) ? createdAt : Date.now(),
					});
				}
				var claimedChecks = {};
				for (var c = 0; c < mapped.length; c++) {
					var claimedName = sanitizeSlug(normalizeName(mapped[c].claimedSenderName || ''));
					if (!claimedName) continue;
					var checkKey = claimedName + ':' + normalizeAddress(mapped[c].sender || '');
					if (Object.prototype.hasOwnProperty.call(claimedChecks, checkKey)) continue;
					var claimedAddress = await resolveAddressForSuiName(claimedName);
					claimedChecks[checkKey] = claimedAddress && claimedAddress === normalizeAddress(mapped[c].sender || '');
				}
				for (var d = 0; d < mapped.length; d++) {
					var nextClaimed = sanitizeSlug(normalizeName(mapped[d].claimedSenderName || ''));
					if (!nextClaimed) continue;
					var nextKey = nextClaimed + ':' + normalizeAddress(mapped[d].sender || '');
					if (claimedChecks[nextKey]) mapped[d].senderName = nextClaimed;
				}
				var senderOrder = [];
				var senderSeen = {};
				for (var j = 0; j < mapped.length; j++) {
					var sender = normalizeAddress(mapped[j].sender || '');
					if (!sender || senderSeen[sender]) continue;
					senderSeen[sender] = true;
					senderOrder.push(sender);
				}
				for (var k = 0; k < senderOrder.length; k++) {
					var resolvedName = await resolvePrimaryNameForAddress(senderOrder[k]);
					if (!resolvedName) continue;
					for (var m = 0; m < mapped.length; m++) {
						if (mapped[m].senderName) continue;
						if (normalizeAddress(mapped[m].sender || '') !== senderOrder[k]) continue;
						mapped[m].senderName = resolvedName;
					}
				}
				mapped.sort(function(a, b) { return a.timestamp - b.timestamp; });
				var purgeBefore = Number(localPurgeBeforeByChannelId[activeChannel] || 0);
				if (isFinite(purgeBefore) && purgeBefore > 0) {
					var filtered = [];
					for (var pf = 0; pf < mapped.length; pf++) {
						if (Number(mapped[pf].timestamp || 0) >= purgeBefore) filtered.push(mapped[pf]);
					}
					mapped = filtered;
				}
				channelMessages[activeChannel] = mapped;
				mutedState = { server: false, channel: false };
				renderMessages();
				applyComposerState();
			} catch (error) {
				messagesInitialLoadPending = false;
				console.warn('[ski-chat] poll failed for channel', activeChannel, error);
				if (!channelMessages[activeChannel]) channelMessages[activeChannel] = [];
				renderMessages();
				applyComposerState();
			}
		}

			function switchChannel(channelId) {
				if (!channelId || channelId === activeChannel) return;
				activeChannel = channelId;
				activeThreadTab = 'chat';
				if (!channelMessages[activeChannel]) channelMessages[activeChannel] = [];
				renderChannelList();
				renderMessages();
				applyComposerState();
				loadJoinRequestsForActiveChannel();
				loadMembersForActiveChannel();
				pollChannelMessages();
			}

		async function acceptChannel(channelName) {
			if (channelAcceptPending) return;
			if (!isConnectedServerOwner()) return;
			if (hasPublicChannel(channels)) {
				var existingId = getCanonicalPublicChannelId();
				if (existingId) {
					switchChannel(existingId);
					addSystemMessage('Switched to existing public channel.');
				}
				return;
			}
			var senderAddress = normalizeAddress(getAddress());
			if (!senderAddress) {
				addSystemMessage('Connect wallet to accept channel.');
				return;
			}
			var cleanName = sanitizeSlug(channelName || '') || sanitizeSlug(firstChannelDefaultName || '') || 'public';
			channelAcceptPending = true;
			renderChannelList();
			try {
				var client = await ensureOfficialMessagingClient();
				if (!client) {
					addSystemMessage('On-chain messaging client is unavailable.');
					return;
				}
				var hasExistingMembership = await hasAnyOnChainChannelMembership(senderAddress, client);
				if (hasExistingMembership) {
					await loadChannels();
					var existingCanonical = getCanonicalPublicChannelId();
					if (existingCanonical) switchChannel(existingCanonical);
					addSystemMessage('Existing on-chain channel found. Switched to primary channel.');
					return;
				}
				var linkedMembers = await resolveLinkedTargetAddresses(senderAddress);
				var createResult = await client.executeCreateChannelTransaction({
					signer: officialMessagingSigner || createOfficialMessagingSigner(senderAddress),
					initialMembers: linkedMembers.addresses,
				});
				var channelId = normalizeAddress(createResult && createResult.channelId ? createResult.channelId : '');
				if (channelId) {
					setStoredChannelMeta(channelId, cleanName, 'public');
				}
				await loadChannels();
				var newSyntheticId = findSyntheticChannelIdByObjectId(channelId);
				if (newSyntheticId) switchChannel(newSyntheticId);
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				if (errText.indexOf('No sui client passed to Transaction#build') !== -1) {
					errText = 'wallet could not build transaction. reconnect wallet and retry';
				}
				addSystemMessage('Failed to create on-chain channel: ' + errText);
			} finally {
				channelAcceptPending = false;
				renderChannelList();
			}
		}

		async function renameChannel(channelId) {
			var cleanId = sanitizeSlug(channelId || '');
			if (!cleanId) return;
			var channel = null;
			for (var i = 0; i < channels.length; i++) {
				if (channels[i] && channels[i].id === cleanId) {
					channel = channels[i];
					break;
				}
			}
			if (!channel || !isOfficialChannel(channel)) return;
			var state = getOfficialChannelState(cleanId);
			if (!state || !state.canManage) {
				addSystemMessage('Only channel members can rename this channel.');
				return;
			}
			var oldName = sanitizeSlug(channel.name || cleanId) || cleanId;
			var nextNameInput = window.prompt('Rename channel #' + oldName + ' to:', oldName);
			if (nextNameInput == null) return;
			var nextName = sanitizeSlug(nextNameInput);
			if (!nextName) {
				addSystemMessage('Channel name cannot be empty.');
				return;
			}
			for (var j = 0; j < channels.length; j++) {
				if (!channels[j] || channels[j].id === cleanId) continue;
				if (sanitizeSlug(channels[j].name || '') === nextName) {
					addSystemMessage('Channel #' + nextName + ' already exists.');
					return;
				}
			}
			setStoredChannelMeta(state.channelId, nextName, channel.encrypted ? 'private' : 'public');
			channel.name = nextName;
			renderChannelList();
			renderMessages();
			applyComposerState();
			addSystemMessage('Renamed #' + oldName + ' to #' + nextName + '.');
		}

		async function purgeChannelMessages(channelId) {
			var cleanId = sanitizeSlug(channelId || '');
			if (!cleanId) return;
			var channel = null;
			for (var i = 0; i < channels.length; i++) {
				if (channels[i] && channels[i].id === cleanId) {
					channel = channels[i];
					break;
				}
			}
			if (!channel || !isOfficialChannel(channel)) return;
			var state = getOfficialChannelState(cleanId);
			if (!state || !state.canManage) {
				addSystemMessage('Only channel members can purge this channel.');
				return;
			}
			var label = sanitizeSlug(channel.name || cleanId) || cleanId;
			if (!window.confirm('Purge #' + label + ' messages? Older messages will be hidden in this profile view.')) return;
			localPurgeBeforeByChannelId[cleanId] = Date.now();
			channelMessages[cleanId] = [];
			renderMessages();
			applyComposerState();
			addSystemMessage('Purged #' + label + ' messages in this linked profile view.');
		}

		function unwrapTxResult(raw) {
			if (!raw) return raw;
			if (raw.$kind === 'FailedTransaction' && raw.FailedTransaction) {
				var failed = raw.FailedTransaction;
				var errMsg = 'Transaction failed on-chain';
				if (failed.effects && failed.effects.status && failed.effects.status.error) errMsg = failed.effects.status.error;
				throw new Error(errMsg);
			}
			if (raw.$kind === 'Transaction' && raw.Transaction) return raw.Transaction;
			return raw;
		}

		async function burnChannel(channelId, options) {
			var burnOptions = options || {};
			var skipConfirm = !!burnOptions.skipConfirm;
			var suppressSuccessMessage = !!burnOptions.suppressSuccessMessage;
			var suppressFailureMessage = !!burnOptions.suppressFailureMessage;
			var cleanId = sanitizeSlug(channelId || '');
			if (!cleanId || channelBurnPendingById[cleanId]) return { ok: false, error: 'Channel is already burning.' };
			var channel = null;
			for (var i = 0; i < channels.length; i++) {
				if (channels[i] && channels[i].id === cleanId) {
					channel = channels[i];
					break;
				}
			}
			if (!channel || !isOfficialChannel(channel)) return { ok: false, error: 'Channel is not eligible for burn.' };
			if (isCanonicalPublicChannel(channel)) {
				if (!suppressFailureMessage) addSystemMessage('Primary #' + sanitizeSlug(channel.name || cleanId) + ' is protected.');
				return { ok: false, error: 'Primary channel is protected.' };
			}
			if (!isConnectedServerOwner()) {
				if (!suppressFailureMessage) addSystemMessage('Only the owner wallet can delete channels.');
				return { ok: false, error: 'Only the owner wallet can delete channels.' };
			}
			var state = getOfficialChannelState(cleanId);
			var label = sanitizeSlug(channel.name || cleanId) || cleanId;

			if (!state || !state.channelId || !state.creatorCapId) {
				if (!suppressFailureMessage) {
					addSystemMessage('Cannot delete #' + label + ' on-chain because CreatorCap is unavailable. Reset local cache and retry.');
				}
				return { ok: false, error: 'CreatorCap is unavailable for on-chain deletion.' };
			}

			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				if (!suppressFailureMessage) addSystemMessage('Connect wallet to delete channel objects.');
				return { ok: false, error: 'Connect wallet to delete channel objects.' };
			}
			if (!skipConfirm && !window.confirm('Delete #' + label + '? This cannot be undone.')) {
				return { ok: false, error: 'User cancelled.' };
			}

			channelBurnPendingById[cleanId] = true;
			renderChannelList();
			try {
				await ensureOfficialMessagingClient();
				var txMod = await ensureOfficialSuiTransactionSdk();
				var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
				if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');
				var burnAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';
				var signer = officialMessagingSigner || createOfficialMessagingSigner(senderAddress);
				var pkgId = getMessagingPackageId();

				var tx = new TxCtor();
				if (typeof tx.setSenderIfNotSet === 'function') tx.setSenderIfNotSet(senderAddress);
				if (typeof tx.setGasBudget === 'function') tx.setGasBudget(100000000);
				tx.moveCall({
					target: pkgId + '::member_cap::transfer_to_recipient',
					arguments: [
						tx.object(state.memberCapId),
						tx.object(state.creatorCapId),
						tx.pure.address(burnAddress),
					],
				});

				var burnResult = unwrapTxResult(await signer.signAndExecuteTransaction({
					transaction: tx,
					options: { showEffects: true, showObjectChanges: true, showRawEffects: true },
									}));
				await clearStormMappingIfChannel(state.channelId, senderAddress);

				removeStoredChannelMeta(state.channelId);
				delete channelMessages[cleanId];
				channels = channels.filter(function(c) { return c.id !== cleanId; });
				delete officialChannelStateById[cleanId];

				var effects = burnResult && burnResult.effects ? burnResult.effects : null;
				var gasUsed = effects && effects.gasUsed ? effects.gasUsed : (effects && effects.effects && effects.effects.gasUsed ? effects.effects.gasUsed : null);
				var rebateMist = gasUsed ? Number(gasUsed.storageRebate || gasUsed.storage_rebate || gasUsed.storageRebateMist || 0) : 0;
				var rebateSui = rebateMist / 1000000000;
				var rebateText = rebateMist > 0 ? (' Storage rebate: ' + rebateSui.toFixed(rebateSui >= 1 ? 4 : 6) + ' SUI.') : '';
				if (!suppressSuccessMessage) addSystemMessage('Deleted #' + label + '.' + rebateText);
				renderChannelList();
				renderMessages();
				applyComposerState();
				return { ok: true, channelId: cleanId, channelLabel: label, rebateMist: String(rebateMist) };
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				if (!suppressFailureMessage) addSystemMessage('On-chain delete failed for #' + label + ': ' + errText + '.');
				renderChannelList();
				renderMessages();
				applyComposerState();
				return { ok: false, channelId: cleanId, channelLabel: label, error: errText };
			} finally {
				channelBurnPendingById[cleanId] = false;
			}
		}

		async function deleteAllExtraChannels() {
			if (!isConnectedServerOwner()) {
				addSystemMessage('Only the owner wallet can delete extra channels.');
				return;
			}
			var deletable = getDeletableChannelIds();
			if (!deletable.length) {
				addSystemMessage('No extra channels to delete.');
				return;
			}

			var burnTargets = [];
			var undeletableTargets = [];
			for (var i = 0; i < deletable.length; i++) {
				var cid = deletable[i];
				var state = getOfficialChannelState(cid);
				var channel = null;
				for (var j = 0; j < channels.length; j++) {
					if (channels[j] && channels[j].id === cid) { channel = channels[j]; break; }
				}
				var label = sanitizeSlug((channel && channel.name) || cid) || cid;
				if (state && state.channelId && state.memberCapId && state.creatorCapId) {
					burnTargets.push({ channelId: state.channelId, memberCapId: state.memberCapId, creatorCapId: state.creatorCapId, label: label, syntheticId: cid });
				} else {
					undeletableTargets.push({ label: label, syntheticId: cid });
				}
			}
			if (!burnTargets.length) {
				addSystemMessage('No extra channels are currently deletable on-chain. Missing CreatorCap or MemberCap.');
				return;
			}

			var totalCount = burnTargets.length;
			var confirmText = 'Burn ' + String(totalCount) + ' non-primary channel' + (totalCount > 1 ? 's' : '') + ' on-chain?';
			confirmText += ' This does not touch your SuiNS NFT.';
			if (undeletableTargets.length) {
				confirmText += ' ' + String(undeletableTargets.length) + ' cannot be burned right now.';
			}
			if (!window.confirm(confirmText)) {
				return;
			}

			for (var bp = 0; bp < burnTargets.length; bp++) channelBurnPendingById[burnTargets[bp].syntheticId] = true;
			renderChannelList();

			try {
				var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
				if (!senderAddress) throw new Error('Connect wallet to delete channel objects.');
				await ensureOfficialMessagingClient();
				var txMod = await ensureOfficialSuiTransactionSdk();
				var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
				if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');
				var signer = officialMessagingSigner || createOfficialMessagingSigner(senderAddress);
				var burnAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';
				var pkgId = getMessagingPackageId();

				var tx = new TxCtor();
				if (typeof tx.setSenderIfNotSet === 'function') tx.setSenderIfNotSet(senderAddress);
				if (typeof tx.setGasBudget === 'function') tx.setGasBudget(200000000);
				for (var k = 0; k < burnTargets.length; k++) {
					var t = burnTargets[k];
					tx.moveCall({
						target: pkgId + '::member_cap::transfer_to_recipient',
						arguments: [tx.object(t.memberCapId), tx.object(t.creatorCapId), tx.pure.address(burnAddress)],
					});
				}

				var result = unwrapTxResult(await signer.signAndExecuteTransaction({
					transaction: tx,
					options: { showEffects: true, showObjectChanges: true, showRawEffects: true },
									}));
				for (var sc = 0; sc < burnTargets.length; sc++) {
					await clearStormMappingIfChannel(burnTargets[sc].channelId, senderAddress);
				}

				for (var r = 0; r < burnTargets.length; r++) {
					removeStoredChannelMeta(burnTargets[r].channelId);
					delete channelMessages[burnTargets[r].syntheticId];
					delete officialChannelStateById[burnTargets[r].syntheticId];
				}
				channels = channels.filter(function(c) {
					for (var br = 0; br < burnTargets.length; br++) {
						if (c.id === burnTargets[br].syntheticId) return false;
					}
					return true;
				});

				var effects = result && result.effects ? result.effects : null;
				var gasUsed = effects && effects.gasUsed ? effects.gasUsed : (effects && effects.effects && effects.effects.gasUsed ? effects.effects.gasUsed : null);
				var rebateMist = gasUsed ? Number(gasUsed.storageRebate || gasUsed.storage_rebate || gasUsed.storageRebateMist || 0) : 0;
				var rebateSui = rebateMist / 1000000000;
				var rebateText = rebateMist > 0 ? (' Storage rebate: ' + rebateSui.toFixed(rebateSui >= 1 ? 4 : 6) + ' SUI.') : '';
				var burnLabels = [];
				for (var lb = 0; lb < burnTargets.length; lb++) burnLabels.push('#' + burnTargets[lb].label);
				addSystemMessage('Deleted ' + String(burnTargets.length) + ' on-chain (' + burnLabels.join(', ') + ').' + rebateText);
				if (undeletableTargets.length) {
					var undeletableLabels = [];
					for (var ul = 0; ul < undeletableTargets.length; ul++) undeletableLabels.push('#' + undeletableTargets[ul].label);
					addSystemMessage('Skipped undeletable channels: ' + undeletableLabels.join(', ') + '.');
				}
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				addSystemMessage('On-chain delete failed: ' + errText + '. No channels were removed locally.');
			} finally {
				for (var fp = 0; fp < burnTargets.length; fp++) channelBurnPendingById[burnTargets[fp].syntheticId] = false;
				renderChannelList();
				renderMessages();
				applyComposerState();
			}
		}

				async function syncLinkedMembersToActiveChannel(channelId) {
			if (!isConnectedServerOwner()) {
				addSystemMessage('Only the owner wallet of this SuiNS profile can sync linked members.');
				return;
			}
				var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
				var targetChannelId = sanitizeSlug(channelId || activeChannel || '');
				var activeState = getOfficialChannelState(targetChannelId);
				if (!senderAddress || !activeState) {
					addSystemMessage('Select an on-chain channel to sync linked members.');
					return;
			}
			try {
				var client = await ensureOfficialMessagingClient();
				if (!client) {
					addSystemMessage('Official on-chain messaging client is unavailable.');
					return;
				}
				var linkedMembers = await resolveLinkedTargetAddresses(senderAddress);
				var membersResp = await client.getChannelMembers(activeState.channelId);
				var members = membersResp && Array.isArray(membersResp.members) ? membersResp.members : [];
				var existing = {};
				for (var i = 0; i < members.length; i++) {
					var memberAddress = normalizeAddress(members[i] && members[i].memberAddress ? members[i].memberAddress : '');
					if (!memberAddress) continue;
					existing[memberAddress] = true;
				}
				var candidates = [];
				for (var j = 0; j < linkedMembers.addresses.length; j++) {
					var candidate = normalizeAddress(linkedMembers.addresses[j]);
					if (!candidate || candidate === senderAddress || existing[candidate]) continue;
					candidates.push(candidate);
				}
				linkedCandidatesByChannelId[targetChannelId] = candidates;
				for (var nc = 0; nc < candidates.length; nc++) {
					try { await resolvePrimaryNameForAddress(candidates[nc]); } catch (_) {}
				}
				if (!candidates.length) {
					addSystemMessage('All linked addresses are already members of this channel.');
				} else {
					addSystemMessage('Found ' + candidates.length + ' linked address' + (candidates.length === 1 ? '' : 'es') + ' not in channel. Add them from the Members tab.');
					if (activeThreadTab !== 'members') {
						activeThreadTab = 'members';
					}
				}
				renderThreadState();
				renderMessages();
			} catch (error) {
				addSystemMessage('Failed to resolve linked members: ' + (error && error.message ? error.message : 'unknown error'));
			}
		}

		async function addLinkedCandidate(channelSlug, candidateAddress) {
			var targetAddress = normalizeAddress(candidateAddress);
			var targetChannelId = sanitizeSlug(channelSlug || activeChannel || '');
			if (!targetAddress || !targetChannelId) return;
			var pendingKey = targetChannelId + ':add:' + targetAddress;
			if (linkedCandidateAddPendingByKey[pendingKey]) return;
			var activeState = getOfficialChannelState(targetChannelId);
			if (!activeState || !activeState.channelId || !activeState.memberCapId) {
				addSystemMessage('Channel state is missing.');
				return;
			}
			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				addSystemMessage('Reconnect wallet signer to add members.');
				return;
			}
			linkedCandidateAddPendingByKey[pendingKey] = true;
			renderMessages();
			try {
				var client = await ensureOfficialMessagingClient();
				if (!client) throw new Error('Official messaging client unavailable');
				await addMembersToOfficialChannel(activeState, senderAddress, [targetAddress], client);
				var candidates = linkedCandidatesByChannelId[targetChannelId] || [];
				linkedCandidatesByChannelId[targetChannelId] = candidates.filter(function(a) { return normalizeAddress(a) !== targetAddress; });
				await loadMembersForActiveChannel();
				addSystemMessage('Added ' + truncateAddress(targetAddress) + ' to channel on-chain.');
			} catch (error) {
				addSystemMessage('Failed to add member: ' + (error && error.message ? error.message : 'unknown error'));
			} finally {
				delete linkedCandidateAddPendingByKey[pendingKey];
				renderMessages();
			}
		}

		function isLocalSendErrorMessage(message) {
			var text = String(message || '');
			return text.indexOf('Waiting for owner wallet to create #') === 0
				|| text.indexOf('This wallet is not a member of #') === 0
				|| text.indexOf('Approve channel creation to open #') === 0
				|| text.indexOf('Select an on-chain channel first') === 0
				|| text.indexOf('Official SDK channel is not ready for sending') === 0
				|| text.indexOf('Channel encryption key unavailable') === 0
				|| text.indexOf('Channel encryption setup failed') === 0
				|| text.indexOf('Upgrading channel encryption') === 0
				|| text.indexOf('Failed to create encrypted channel') === 0;
		}

		async function refreshChannelEncryptedKey(client, state, senderAddress) {
			if (!client || !state || !state.channelId || !senderAddress) return null;
			var attempts = [];
			var memberCapId = normalizeAddress(state.memberCapId || '');
			if (memberCapId) {
				attempts.push({
					channelIds: [state.channelId],
					userAddress: senderAddress,
					memberCapIds: [memberCapId],
				});
			}
			attempts.push({
				channelIds: [state.channelId],
				userAddress: senderAddress,
			});
				for (var i = 0; i < attempts.length; i++) {
					try {
						var objects = await client.getChannelObjectsByChannelIds(attempts[i]);
						var fresh = Array.isArray(objects) && objects.length ? objects[0] : null;
						if (!fresh) continue;
						var resolved = extractEncryptedKeyFromChannelObject(fresh);
						if (!resolved) continue;
						return resolved;
					} catch (_e) {}
				}
				return null;
			}

		function extractSealEncryptedBytes(value) {
			if (!value) return new Uint8Array(0);
			if (value.encryptedObject) return toUint8Array(value.encryptedObject);
			if (value.encryptedBytes) return toUint8Array(value.encryptedBytes);
			if (value.data) return toUint8Array(value.data);
			return toUint8Array(value);
		}

		async function repairOfficialChannelEncryptionKey(state, senderAddress) {
			if (!state || !state.channelId || !senderAddress) return null;
			var keyEditorMemberCapId = String(state.keyEditorMemberCapId || '').trim();
			if (!keyEditorMemberCapId) {
				throw new Error('No eligible member cap available for key rotation.');
			}
			var runtime = officialMessagingRuntimeClient;
			if (!runtime || !runtime.seal || typeof runtime.seal.encrypt !== 'function') {
				throw new Error('Seal client is unavailable for channel key repair.');
			}
			var txMod = await ensureOfficialSuiTransactionSdk();
			var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
			if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');

			var channelIdBytes = hexToBytes(state.channelId);
			if (!channelIdBytes.length) throw new Error('Invalid channel id for key repair.');
			var nonce = randomBytes(12);
			var dek = randomBytes(32);
			var sealIdentity = bytesToHex(concatBytes([channelIdBytes, nonce]));
			if (!sealIdentity) throw new Error('Failed to derive Seal identity bytes.');

			var sealResult = await runtime.seal.encrypt({
				threshold: Math.max(1, Number(officialSealThreshold || 2)),
				packageId: getMessagingPackageId(),
				id: sealIdentity,
				data: dek,
			});
			var encryptedBytes = extractSealEncryptedBytes(sealResult);
			if (!encryptedBytes.length) throw new Error('Seal encryption returned empty key bytes.');

			var tx = new TxCtor();
			if (typeof tx.setSenderIfNotSet === 'function') tx.setSenderIfNotSet(senderAddress);
			if (typeof tx.setGasBudget === 'function') tx.setGasBudget(100000000);
			tx.moveCall({
				target: getMessagingPackageId() + '::channel::add_encrypted_key',
				arguments: [
					tx.object(state.channelId),
					tx.object(keyEditorMemberCapId),
					tx.pure.vector('u8', encryptedBytes),
				],
			});

			var signer = officialMessagingSigner || createOfficialMessagingSigner(senderAddress);
			await signer.signAndExecuteTransaction({
				transaction: tx,
				options: { showEffects: true, showObjectChanges: true, showRawEffects: true },
								client: runtime,
			});

			var repaired = await refreshChannelEncryptedKey(officialMessagingClient, state, senderAddress);
			if (!repaired) {
				repaired = {
					$kind: 'Encrypted',
					encryptedBytes: encryptedBytes,
					version: 1,
				};
			}
			state.encryptedKey = repaired;
			return repaired;
		}

		async function repairActiveChannelEncryptionKey() {
			var channel = getActiveChannel();
			if (!channel || !isOfficialChannel(channel)) {
				addSystemMessage('Select an on-chain channel first.');
				return;
			}
			if (!isConnectedServerOwner()) {
				addSystemMessage('Only the owner wallet can repair channel keys.');
				return;
			}
			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				addSystemMessage('Reconnect wallet signer to repair channel key.');
				return;
			}
			var state = getOfficialChannelState(activeChannel);
			if (!state || !state.channelId) {
				addSystemMessage('Channel state is unavailable.');
				return;
			}
			try {
				addSystemMessage('Repairing channel encryption key on-chain...');
				await repairOfficialChannelEncryptionKey(state, senderAddress);
				await loadChannels();
				await pollChannelMessages();
				addSystemMessage('Channel encryption key repaired.');
			} catch (error) {
				addSystemMessage('Channel key repair failed: ' + String(error && error.message ? error.message : 'unknown error'));
			}
		}

		async function setStormPrimaryForActiveChannel() {
			var channel = getActiveChannel();
			if (!channel || !isOfficialChannel(channel)) {
				addSystemMessage('Select an on-chain channel first.');
				return;
			}
			if (!isConnectedServerOwner()) {
				addSystemMessage('Only the owner wallet can set Storm primary.');
				return;
			}
			if (!hasStormRegistryConfig()) {
				addSystemMessage('Storm registry is not configured for this profile yet.');
				return;
			}
			var state = getOfficialChannelState(activeChannel);
			if (!state || !state.channelId) {
				addSystemMessage('Channel state is unavailable.');
				return;
			}
			var channelObjectId = normalizeAddress(state.channelId);
			if (!channelObjectId) {
				addSystemMessage('Active channel has invalid on-chain ID.');
				return;
			}
			if (normalizeAddress(stormMappedChannelId) === channelObjectId) {
				addSystemMessage('#' + sanitizeSlug(channel.name || activeChannel) + ' is already Storm primary.');
				return;
			}
			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				addSystemMessage('Reconnect wallet signer to update Storm primary.');
				return;
			}
			try {
				var txMod = await ensureOfficialSuiTransactionSdk();
				var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
				if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');
				var tx = new TxCtor();
				if (typeof tx.setSenderIfNotSet === 'function') tx.setSenderIfNotSet(senderAddress);
				if (typeof tx.setGasBudget === 'function') tx.setGasBudget(70000000);
				var appended = await appendStormSetChannelMoveCall(tx, channelObjectId, officialMessagingRuntimeClient);
				if (!appended) throw new Error('Storm registry setup is unavailable in this session.');
				var signer = officialMessagingSigner || createOfficialMessagingSigner(senderAddress);
				await signer.signAndExecuteTransaction({
					transaction: tx,
					options: { showEffects: true, showObjectChanges: true, showRawEffects: true },
									});
				stormMappedChannelId = channelObjectId;
				await loadChannels();
				var canonicalId = getCanonicalPublicChannelId();
				if (canonicalId) switchChannel(canonicalId);
				addSystemMessage('Storm primary set to #' + sanitizeSlug(channel.name || activeChannel) + '.');
			} catch (error) {
				addSystemMessage('Failed to set Storm primary: ' + String(error && error.message ? error.message : 'unknown error'));
			}
		}

			async function loadMembersForActiveChannel() {
				if (!activeChannel) return;
				var channel = getActiveChannel();
				if (!isOfficialChannel(channel)) {
					channelMembersByChannelId[activeChannel] = [];
					renderThreadState();
					if (isOpen && activeThreadTab === 'members') renderMessages();
					return;
				}
				if (channelMembersLoadPendingByChannelId[activeChannel]) return;
				channelMembersLoadPendingByChannelId[activeChannel] = true;
				try {
					var state = getOfficialChannelState(activeChannel);
					var client = await ensureOfficialMessagingClient();
					if (!state || !state.channelId || !client || typeof client.getChannelMembers !== 'function') {
						channelMembersByChannelId[activeChannel] = [];
						return;
					}
					var membersResp = await client.getChannelMembers(state.channelId);
					var source = membersResp && Array.isArray(membersResp.members) ? membersResp.members : [];
					var dedupe = {};
					var mapped = [];
					for (var i = 0; i < source.length; i++) {
						var item = source[i] || {};
						var memberAddress = normalizeAddress(
							item.memberAddress
								|| item.member_address
								|| item.address
								|| item.member
								|| '',
						);
						if (!memberAddress || dedupe[memberAddress]) continue;
						dedupe[memberAddress] = true;
						var primaryName = '';
						try {
							primaryName = sanitizeSlug(normalizeName(await resolvePrimaryNameForAddress(memberAddress)));
						} catch (_nameErr) {
							primaryName = '';
						}
						mapped.push({
							address: memberAddress,
							primaryName: primaryName || '',
							memberCapId: normalizeAddress(item.memberCapId || item.member_cap_id || ''),
						});
					}
					var ownerAddress = getConnectedOwnerAddress();
					mapped.sort(function(a, b) {
						var aOwner = a.address === ownerAddress;
						var bOwner = b.address === ownerAddress;
						if (aOwner && !bOwner) return -1;
						if (!aOwner && bOwner) return 1;
						if (a.primaryName && b.primaryName && a.primaryName !== b.primaryName) {
							return a.primaryName < b.primaryName ? -1 : 1;
						}
						if (a.address < b.address) return -1;
						if (a.address > b.address) return 1;
						return 0;
					});
					channelMembersByChannelId[activeChannel] = mapped;
				} catch (error) {
					console.warn('Failed to load channel members:', error);
				} finally {
					delete channelMembersLoadPendingByChannelId[activeChannel];
					renderThreadState();
					if (isOpen && activeThreadTab === 'members') renderMessages();
				}
			}

			async function addMembersToOfficialChannel(state, senderAddress, memberAddresses, client) {
				var targetState = state || null;
				var signingAddress = normalizeAddress(senderAddress);
				if (!targetState || !targetState.channelId || !targetState.memberCapId) {
					throw new Error('Channel state is missing required member capability.');
				}
				if (!signingAddress) {
					throw new Error('Wallet signer address is required.');
				}
				var dedupe = {};
				var cleanMembers = [];
				for (var i = 0; i < memberAddresses.length; i++) {
					var next = normalizeAddress(memberAddresses[i]);
					if (!next || dedupe[next]) continue;
					dedupe[next] = true;
					cleanMembers.push(next);
				}
				if (!cleanMembers.length) return null;
				var messagingClient = client || await ensureOfficialMessagingClient();
				if (!messagingClient) throw new Error('Official messaging client unavailable');
				var txLike = null;
				var txOptions = {
					channelId: targetState.channelId,
					memberCapId: targetState.memberCapId,
					newMemberAddresses: cleanMembers,
					address: signingAddress,
				};
				if (targetState.creatorCapId) txOptions.creatorCapId = targetState.creatorCapId;
				if (typeof messagingClient.addMembersTransaction === 'function') {
					txLike = await messagingClient.addMembersTransaction(txOptions);
				}
				if (!txLike && typeof messagingClient.addMembers === 'function') {
					var addBuilder = await messagingClient.addMembers(txOptions);
					if (typeof addBuilder === 'function') {
						var txMod = await ensureOfficialSuiTransactionSdk();
						var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
						if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');
						var builtTx = new TxCtor();
						if (typeof builtTx.setSenderIfNotSet === 'function') {
							builtTx.setSenderIfNotSet(signingAddress);
						}
						await addBuilder(builtTx);
						txLike = builtTx;
					}
				}
				if (txLike) {
					var signer = officialMessagingSigner || createOfficialMessagingSigner(signingAddress);
					return await signer.signAndExecuteTransaction({
						transaction: txLike,
						options: {
							showEffects: true,
							showObjectChanges: true,
							showRawEffects: true,
						},
											});
				}
				if (typeof messagingClient.executeAddMembersTransaction === 'function') {
					return await messagingClient.executeAddMembersTransaction({
						signer: officialMessagingSigner || createOfficialMessagingSigner(signingAddress),
						channelId: targetState.channelId,
						memberCapId: targetState.memberCapId,
						newMemberAddresses: cleanMembers,
						creatorCapId: targetState.creatorCapId || undefined,
					});
				}
				throw new Error('Add-members transaction builder is unavailable.');
			}

			async function removeMemberFromActiveChannel(memberAddress) {
				var targetAddress = normalizeAddress(memberAddress);
				if (!targetAddress || !activeChannel) return;
				if (!isConnectedServerOwner()) {
					addSystemMessage('Only the owner wallet can remove channel members.');
					return;
				}
				var ownerAddress = getConnectedOwnerAddress();
				if (targetAddress === ownerAddress) {
					addSystemMessage('Owner wallet cannot be removed from this channel.');
					return;
				}
				var channel = getActiveChannel();
				if (!isOfficialChannel(channel)) {
					addSystemMessage('Select an on-chain channel before removing members.');
					return;
				}
				var state = getOfficialChannelState(activeChannel);
				if (!state || !state.channelId || !state.memberCapId) {
					addSystemMessage('Channel state is missing required member capability.');
					return;
				}
				var members = getActiveChannelMembers();
				var targetMemberCapId = '';
				for (var mi = 0; mi < members.length; mi++) {
					if (normalizeAddress(members[mi].address) === targetAddress && members[mi].memberCapId) {
						targetMemberCapId = members[mi].memberCapId;
						break;
					}
				}
				if (!targetMemberCapId) {
					addSystemMessage('Cannot find MemberCap for this member. Reload the members tab and try again.');
					return;
				}
				var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
				if (!senderAddress) {
					addSystemMessage('Reconnect wallet signer to remove members.');
					return;
				}
				var pendingKey = activeChannel + ':' + targetAddress;
				if (channelMemberRemovePendingByKey[pendingKey]) return;
				channelMemberRemovePendingByKey[pendingKey] = true;
				renderMessages();
				try {
					var txMod = await ensureOfficialSuiTransactionSdk();
					var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
					if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');
					var tx = new TxCtor();
					if (typeof tx.setSenderIfNotSet === 'function') {
						tx.setSenderIfNotSet(senderAddress);
					}
					if (typeof tx.setGasBudget === 'function') {
						tx.setGasBudget(100000000);
					}
					var clockArg = tx.object && typeof tx.object.clock === 'function'
						? tx.object.clock()
						: tx.object('0x6');
					tx.moveCall({
						target: getMessagingPackageId() + '::channel::remove_members',
						arguments: [
							tx.object(state.channelId),
							tx.object(state.memberCapId),
							tx.makeMoveVec({
								type: '0x2::object::ID',
								elements: [tx.pure.id(targetMemberCapId)],
							}),
							clockArg,
						],
					});
					var signer = officialMessagingSigner || createOfficialMessagingSigner(senderAddress);
					await signer.signAndExecuteTransaction({
						transaction: tx,
						options: {
							showEffects: true,
							showObjectChanges: true,
							showRawEffects: true,
						},
											});
					await loadMembersForActiveChannel();
					addSystemMessage('Removed ' + (truncateAddress(targetAddress) || targetAddress) + ' from #' + (sanitizeSlug(channel.name || activeChannel) || activeChannel) + '. Decryption access revoked on-chain.');
				} catch (error) {
					var errText = String(error && error.message ? error.message : 'unknown error');
					addSystemMessage('Failed to remove member: ' + errText);
				} finally {
					delete channelMemberRemovePendingByKey[pendingKey];
					renderMessages();
				}
			}

		async function createBootstrapChannelAndSend(client, senderAddress, cleanName, outboundMessage, initialMembers) {
			if (!client || typeof client.createChannelFlow !== 'function' || typeof client.sendMessage !== 'function') {
				return null;
			}
			var signer = officialMessagingSigner || createOfficialMessagingSigner(senderAddress);
			var flow = await client.createChannelFlow({
				creatorAddress: senderAddress,
				initialMemberAddresses: Array.isArray(initialMembers) ? initialMembers : [],
			});
			var createTx = flow.build();
			var createRaw = await signer.signAndExecuteTransaction({
				transaction: createTx,
				options: {
					showEffects: true,
					showObjectChanges: true,
					showRawEffects: true,
				},
								client: client,
			});
			var createResult = unwrapTxResult(createRaw);
			var createDigest = String(
				(createResult && (
					createResult.digest
					|| createResult.transactionDigest
					|| createResult.txDigest
				)) || '',
			).trim();
			if (!createDigest) {
				throw new Error('Create channel transaction digest was unavailable.');
			}
			var generatedCaps = await flow.getGeneratedCaps({ digest: createDigest });
			var attachTx = await flow.generateAndAttachEncryptionKey();
			var generatedKey = flow.getGeneratedEncryptionKey();
			var channelId = normalizeAddress(
				(generatedKey && generatedKey.channelId)
				|| (generatedCaps && generatedCaps.creatorCap && generatedCaps.creatorCap.channel_id)
				|| '',
			);
			var memberCapId = normalizeAddress(
				generatedCaps && generatedCaps.creatorMemberCap && generatedCaps.creatorMemberCap.id
					? (generatedCaps.creatorMemberCap.id.id || generatedCaps.creatorMemberCap.id)
					: '',
			);
			var encryptedBytes = toUint8Array(generatedKey && generatedKey.encryptedKeyBytes);
			if (!channelId || !memberCapId || !encryptedBytes.length) {
				throw new Error('Failed to finalize bootstrap channel capabilities.');
			}
			var encryptedKey = {
				$kind: 'Encrypted',
				encryptedBytes: encryptedBytes,
				version: 1,
			};
			var sendBuilder = await client.sendMessage(channelId, memberCapId, senderAddress, outboundMessage, encryptedKey);
			if (typeof sendBuilder !== 'function') {
				throw new Error('Messaging SDK did not return a send-message builder.');
			}
			await sendBuilder(attachTx);
			await appendStormSetChannelMoveCall(attachTx, channelId, officialMessagingRuntimeClient);
			if (attachTx && typeof attachTx.setGasBudget === 'function') {
				attachTx.setGasBudget(100000000);
			}
			var finalizeRaw = await signer.signAndExecuteTransaction({
				transaction: attachTx,
				options: {
					showEffects: true,
					showObjectChanges: true,
					showRawEffects: true,
				},
								client: client,
			});
			unwrapTxResult(finalizeRaw);
			stormMappedChannelId = normalizeAddress(channelId);
			setStoredChannelMeta(channelId, cleanName, 'public');
			return {
				channelId: channelId,
				memberCapId: memberCapId,
				encryptedKey: encryptedKey,
			};
		}

		async function send() {
			var text = String(inputEl.value || '').trim();
			if (!text || isSending || mutedState.server || mutedState.channel) return;
			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				addSystemMessage('Connect a Sui wallet signer to send on-chain messages. Switch Phantom to Sui and reconnect if needed.');
				applyComposerState();
				return;
			}
			if (!getAddress()) {
				addSystemMessage('Connect wallet to send a message.');
				return;
			}

			isSending = true;
			applyComposerState();

			try {
				var authorName = '';
				var selectedAuthor = sanitizeSlug(normalizeName(selectedSenderName || ''));
				if (selectedAuthor && senderNameOptions.indexOf(selectedAuthor) !== -1) {
					authorName = selectedAuthor;
				} else {
					var primaryAuthor = sanitizeSlug(normalizeName(getPrimaryName() || ''));
					if (primaryAuthor && senderNameOptions.indexOf(primaryAuthor) !== -1) {
						authorName = primaryAuthor;
					}
				}
				var outboundMessage = buildSkiMessagePayload(text, authorName);
				var channel = getActiveChannel();
				if (isOfficialChannel(channel) && !channel.encrypted && !isCanonicalPublicChannel(channel)) {
					throw new Error('This channel is not primary. Burn extras and keep one canonical channel.');
				}
				if (!isOfficialChannel(channel)) {
					var bootstrapName = sanitizeSlug((channel && channel.name) || activeChannel || '') || 'public';
					if (channel && channel.sdk === 'bootstrap') {
						if (!isConnectedServerOwner()) {
							throw new Error('This wallet is not a member of #' + bootstrapName + ' yet. Owner must create the channel or sync linked members.');
						}
						var bootstrapClient = await ensureOfficialMessagingClient();
						if (bootstrapClient && typeof bootstrapClient.createChannelFlow === 'function' && typeof bootstrapClient.sendMessage === 'function') {
							var existingMembership = await hasAnyOnChainChannelMembership(senderAddress, bootstrapClient);
							if (existingMembership) {
								await loadChannels();
								var existingPublic = getCanonicalPublicChannelId();
								if (existingPublic) activeChannel = existingPublic;
								channel = getActiveChannel();
							}
						}
						if (bootstrapClient && typeof bootstrapClient.createChannelFlow === 'function' && typeof bootstrapClient.sendMessage === 'function' && (!channel || !isOfficialChannel(channel))) {
							var linkedMembers = await resolveLinkedTargetAddresses(senderAddress);
							var bootstrapResult = await createBootstrapChannelAndSend(
								bootstrapClient,
								senderAddress,
								bootstrapName,
								outboundMessage,
								linkedMembers.addresses,
							);
							if (!bootstrapResult || !bootstrapResult.channelId) {
								throw new Error('Approve channel creation to open #' + bootstrapName);
							}
							await loadChannels();
							var bootstrapSyntheticId = findSyntheticChannelIdByObjectId(bootstrapResult.channelId);
							if (bootstrapSyntheticId) {
								activeChannel = bootstrapSyntheticId;
							}
							inputEl.value = '';
							inputEl.style.height = 'auto';
							await pollChannelMessages();
							return;
						}
						if (!isOfficialChannel(channel)) {
							throw new Error('Approve channel creation to open #' + bootstrapName);
						}
					} else {
						throw new Error('Select an on-chain channel first');
					}
				}

				var client = await ensureOfficialMessagingClient();
				var state = getOfficialChannelState(activeChannel);
				if (!client || !state) {
					throw new Error('Official SDK channel is not ready for sending');
				}
				if (!state.encryptedKey) {
					var initialKey = await refreshChannelEncryptedKey(client, state, senderAddress);
					if (initialKey) state.encryptedKey = initialKey;
				}
				if (!state.encryptedKey) {
					throw new Error('Encryption key unavailable for #' + sanitizeSlug(channel.name || '') + '. Use channel settings -> Repair key, or clean up and recreate the channel.');
				}
				var sendInput = {
					signer: officialMessagingSigner || createOfficialMessagingSigner(senderAddress),
					channelId: state.channelId,
					memberCapId: state.memberCapId,
					message: outboundMessage,
				};
				sendInput.encryptedKey = state.encryptedKey;
				await client.executeSendMessageTransaction(sendInput);
				inputEl.value = '';
				inputEl.style.height = 'auto';
				await pollChannelMessages();
			} catch (err) {
				var errText = String(err && err.message ? err.message : 'Connection failed');
				var metaIdx = errText.indexOf(', metadata:');
				if (metaIdx > 0) errText = errText.slice(0, metaIdx);
				var selfIdx = errText.indexOf(', self: "');
				if (selfIdx > 0) {
					var selfEnd = errText.indexOf('"', selfIdx + 9);
					if (selfEnd > selfIdx) {
						var selfMsg = errText.slice(selfIdx + 9, selfEnd);
						errText = selfMsg;
					}
				}
				console.error('[send] error:', err);
				var isObjectNotFound = errText.indexOf('not found') !== -1 || errText.indexOf('ObjectNotFound') !== -1;
				if (isObjectNotFound) {
					addSystemMessage('Channel state is stale. Reloading channels...');
					await loadChannels();
				} else if (isLocalSendErrorMessage(errText)) {
					addSystemMessage(errText);
				} else {
					addSystemMessage('Send failed: ' + errText);
				}
			} finally {
				isSending = false;
				applyComposerState();
				inputEl.focus();
			}
		}

		function thunderRumble() {
			try {
				var ac = new (window.AudioContext || window.webkitAudioContext)();
				var now = ac.currentTime;
				var dur = 0.35;
				var gain = ac.createGain();
				gain.gain.setValueAtTime(0.12, now);
				gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
				gain.connect(ac.destination);
				var osc = ac.createOscillator();
				osc.type = 'sine';
				osc.frequency.setValueAtTime(55, now);
				osc.frequency.exponentialRampToValueAtTime(28, now + dur);
				osc.connect(gain);
				osc.start(now);
				osc.stop(now + dur);
				var noise = ac.createBufferSource();
				var nBuf = ac.createBuffer(1, ac.sampleRate * dur | 0, ac.sampleRate);
				var nData = nBuf.getChannelData(0);
				for (var i = 0; i < nData.length; i++) nData[i] = (Math.random() * 2 - 1) * 0.3;
				noise.buffer = nBuf;
				var nGain = ac.createGain();
				nGain.gain.setValueAtTime(0.06, now);
				nGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.7);
				var lp = ac.createBiquadFilter();
				lp.type = 'lowpass';
				lp.frequency.setValueAtTime(120, now);
				lp.frequency.exponentialRampToValueAtTime(40, now + dur);
				noise.connect(lp);
				lp.connect(nGain);
				nGain.connect(ac.destination);
				noise.start(now);
				noise.stop(now + dur);
				setTimeout(function() { ac.close(); }, (dur + 0.5) * 1000);
			} catch (_) {}
		}

		function fireShockwave() {
			var sw = document.getElementById('thunder-shockwave');
			if (!sw) return;
			sw.classList.remove('fire');
			void sw.offsetWidth;
			sw.classList.add('fire');
		}

		function openPanel() {
			isOpen = true;
			panel.classList.add('open');
			backdrop.classList.add('open');
			bubble.classList.add('open');
			if (document.body) document.body.classList.add('thunder-open');
			if (messagesEl && !messagesEl.hasChildNodes()) {
				messagesEl.innerHTML = '<div class="thunder-loading">'
					+ '<div class="thunder-loading-orbs">'
					+ '<div class="thunder-loading-orb"></div>'
					+ '<div class="thunder-loading-orb"></div>'
					+ '<div class="thunder-loading-orb"></div>'
					+ '<div class="thunder-loading-center"></div>'
					+ '</div>'
					+ '<span class="thunder-loading-text">tuning in\u2026</span>'
					+ '</div>';
			}
			renderComposerIdentity();
			refreshSenderNameOptions();
			ensureWalletSigningAddress().then(function() {
				if (!isOpen) return;
				renderComposerIdentity();
				applyComposerState();
			}).catch(function() {});
			ensureOfficialMessagingSdk().then(function() {
				return ensureOfficialMessagingClient();
			}).catch(function() {});
			loadChannels();
			stopPolling();
			pollTimer = setInterval(function() { pollChannelMessages(); pollMembersTab(); }, POLL_INTERVAL);
			applyComposerState();
			inputEl.focus();
		}

		function closePanel() {
			isOpen = false;
			panel.classList.remove('open');
			backdrop.classList.remove('open');
			bubble.classList.remove('open');
			if (document.body) document.body.classList.remove('thunder-open');
			stopPolling();
		}

		async function pollMembersTab() {
			if (!isOpen || !activeChannel) return;
			if (activeThreadTab !== 'members') return;
			await loadJoinRequestsForActiveChannel();
			await loadMembersForActiveChannel();
			renderThreadState();
		}

		function stopPolling() {
			if (!pollTimer) return;
			clearInterval(pollTimer);
			pollTimer = null;
		}

		bubble.addEventListener('click', function() {
			if (isOpen) { closePanel(); return; }
			var connected = !!getAddress();
			fireShockwave();
			thunderRumble();
			if (connected) { openPanel(); return; }
			var walletModalOpen = document.body && document.body.classList.contains('wk-modal-open');
			if (walletModalOpen) {
				if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.closeModal) SuiWalletKit.closeModal();
			} else {
				if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.openModal) SuiWalletKit.openModal();
			}
		});
		if (brandIconEl) {
			brandIconEl.addEventListener('click', function(event) {
				event.preventDefault();
				openBrandProfileOrConnect();
			});
		}
		if (deleteAllBtn) {
			deleteAllBtn.addEventListener('click', function(event) {
				event.preventDefault();
				event.stopPropagation();
				deleteAllExtraChannels();
			});
		}
		if (resetLocalBtn) {
			resetLocalBtn.addEventListener('click', function(event) {
				event.preventDefault();
				event.stopPropagation();
				resetLocalChannelStorage();
			});
		}
				closeBtn.addEventListener('click', closePanel);
				backdrop.addEventListener('click', closePanel);
				sendBtn.addEventListener('click', send);
				threadStateEl.addEventListener('click', function(event) {
					var target = event.target;
					if (!(target instanceof Element)) return;
					var tabBtn = target.closest('[data-thread-tab]');
					if (!tabBtn) return;
					event.preventDefault();
					var nextTab = String(tabBtn.getAttribute('data-thread-tab') || '').trim().toLowerCase();
					activeThreadTab = nextTab === 'members' ? 'members' : 'chat';
					renderThreadState();
					renderMessages();
					applyComposerState();
					if (activeThreadTab === 'members') {
						loadMembersForActiveChannel();
						loadJoinRequestsForActiveChannel();
					}
				});
				messagesEl.addEventListener('click', function(event) {
					var target = event.target;
					if (!(target instanceof Element)) return;
					var removeBtn = target.closest('[data-remove-member-address]');
					if (removeBtn) {
						event.preventDefault();
						removeMemberFromActiveChannel(removeBtn.getAttribute('data-remove-member-address'));
						return;
					}
					var requestBtn = target.closest('[data-request-join]');
					if (requestBtn) {
						event.preventDefault();
						requestJoinForActiveChannel();
					return;
				}
				var cancelBtn = target.closest('[data-cancel-join-request]');
				if (cancelBtn) {
					event.preventDefault();
					cancelJoinRequest(cancelBtn.getAttribute('data-cancel-join-request'));
					return;
				}
				var approveBtn = target.closest('[data-approve-join-request]');
				if (approveBtn) {
					event.preventDefault();
					approveJoinRequest(approveBtn.getAttribute('data-approve-join-request'));
					return;
				}
				var addLinkedBtn = target.closest('[data-add-linked-candidate]');
				if (addLinkedBtn) {
					event.preventDefault();
					addLinkedCandidate(activeChannel, addLinkedBtn.getAttribute('data-add-linked-candidate'));
				}
			});

			channelListEl.addEventListener('click', function(event) {
				var target = event.target;
				if (!(target instanceof Element)) return;
			var toggleExtraBtn = target.closest('[data-toggle-extra-public]');
			if (toggleExtraBtn) {
				event.stopPropagation();
				showExtraPublicChannels = !showExtraPublicChannels;
				renderChannelList();
				return;
			}
			var cleanExtraBtn = target.closest('[data-clean-extra-public]');
			if (cleanExtraBtn) {
				event.stopPropagation();
				deleteAllExtraChannels();
				return;
			}
			var acceptBtn = target.closest('[data-accept-channel]');
			if (acceptBtn) {
				event.stopPropagation();
				acceptChannel(sanitizeSlug(acceptBtn.getAttribute('data-accept-channel') || ''));
				return;
			}
			var burnBtn = target.closest('[data-burn-channel]');
			if (burnBtn) {
				event.stopPropagation();
				burnChannel(sanitizeSlug(burnBtn.getAttribute('data-burn-channel') || ''));
				return;
			}
			var renameBtn = target.closest('[data-rename-channel]');
			if (renameBtn) {
				event.stopPropagation();
				renameChannel(sanitizeSlug(renameBtn.getAttribute('data-rename-channel') || ''));
				return;
			}
			var syncBtn = target.closest('[data-sync-members]');
			if (syncBtn) {
				event.stopPropagation();
				syncLinkedMembersToActiveChannel(sanitizeSlug(syncBtn.getAttribute('data-sync-members') || ''));
				return;
			}
			var purgeBtn = target.closest('[data-purge-channel]');
			if (purgeBtn) {
				event.stopPropagation();
				purgeChannelMessages(sanitizeSlug(purgeBtn.getAttribute('data-purge-channel') || ''));
				return;
			}
			var item = target.closest('.thunder-channel-item');
			if (!item) return;
			switchChannel(item.getAttribute('data-channel'));
		});

		var gearBtn = document.getElementById('thunder-channel-gear-btn');
		var gearMenu = document.getElementById('thunder-channel-gear-menu');
		var gearWrap = document.getElementById('thunder-channel-gear-wrap');
		if (gearBtn && gearMenu) {
			gearBtn.addEventListener('click', function(e) {
				e.stopPropagation();
				gearMenu.style.display = gearMenu.style.display === 'none' ? '' : 'none';
			});
			document.addEventListener('click', function(e) {
				if (gearWrap && !gearWrap.contains(e.target)) {
					gearMenu.style.display = 'none';
				}
			});
			var gearSync = document.getElementById('thunder-gear-sync');
			var gearStorm = document.getElementById('thunder-gear-storm');
			var gearRepair = document.getElementById('thunder-gear-repair');
			var gearRename = document.getElementById('thunder-gear-rename');
			var gearPurge = document.getElementById('thunder-gear-purge');
			if (gearSync) gearSync.addEventListener('click', function() {
				gearMenu.style.display = 'none';
				syncLinkedMembersToActiveChannel(activeChannel || '');
			});
			if (gearStorm) gearStorm.addEventListener('click', function() {
				gearMenu.style.display = 'none';
				setStormPrimaryForActiveChannel();
			});
			if (gearRepair) gearRepair.addEventListener('click', function() {
				gearMenu.style.display = 'none';
				repairActiveChannelEncryptionKey();
			});
			if (gearRename) gearRename.addEventListener('click', function() {
				gearMenu.style.display = 'none';
				renameChannel(activeChannel || '');
			});
			if (gearPurge) gearPurge.addEventListener('click', function() {
				gearMenu.style.display = 'none';
				purgeChannelMessages(activeChannel || '');
			});
		}

		inputEl.addEventListener('input', function() {
			this.style.height = 'auto';
			this.style.height = Math.min(this.scrollHeight, 110) + 'px';
			applyComposerState();
		});

		inputEl.addEventListener('keydown', function(event) {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				send();
			}
		});

		window.addEventListener('keydown', function(event) {
			if (event.key === 'Escape' && isOpen) {
				if (isAuthorPickerOpen) {
					isAuthorPickerOpen = false;
					senderNameFilter = '';
					renderComposerIdentity();
					return;
				}
				closePanel();
			}
		});

		if (composerIdentityEl) {
			composerIdentityEl.addEventListener('click', function(event) {
				var target = event.target;
				if (!(target instanceof Element)) return;
				var toggle = target.closest('[data-action="toggle-author-picker"]');
				if (!toggle) return;
				event.preventDefault();
				isAuthorPickerOpen = !isAuthorPickerOpen;
				if (!isAuthorPickerOpen) senderNameFilter = '';
				renderComposerIdentity();
				if (isAuthorPickerOpen) {
					setTimeout(function() {
						var filterEl = document.getElementById('thunder-author-filter');
						if (filterEl && typeof filterEl.focus === 'function') filterEl.focus();
					}, 0);
				}
			});
		}

		var thunderPanel = document.getElementById('thunder-panel');
		if (thunderPanel) {
			thunderPanel.addEventListener('click', function(event) {
				var target = event.target;
				if (!(target instanceof Element)) return;
				if (target.closest('[data-action="close-author-modal"]')) {
					event.preventDefault();
					isAuthorPickerOpen = false;
					senderNameFilter = '';
					renderComposerIdentity();
					return;
				}
				var chip = target.closest('#thunder-author-modal [data-author-name]');
				if (!chip) return;
				event.preventDefault();
				selectedSenderName = sanitizeSlug(normalizeName(chip.getAttribute('data-author-name') || ''));
				ensureSelectedSenderName();
				storeSenderName(normalizeAddress(getAddress()), selectedSenderName);
				isAuthorPickerOpen = false;
				senderNameFilter = '';
				renderComposerIdentity();
			});
			thunderPanel.addEventListener('input', function(event) {
				var target = event.target;
				if (!(target instanceof HTMLInputElement)) return;
				if (target.id !== 'thunder-author-filter') return;
				senderNameFilter = String(target.value || '').trim().toLowerCase().slice(0, 48);
				renderAuthorModal();
			});
		}

		if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.$connection) {
			SuiWalletKit.subscribe(SuiWalletKit.$connection, function() {
				var nextAddress = normalizeAddress(getAddress());
					if (nextAddress !== officialMessagingAddress) {
						officialMessagingClient = null;
						officialMessagingRuntimeClient = null;
						officialMessagingSigner = null;
						officialMessagingAddress = '';
						officialStormConfig = null;
						stormMappedChannelId = '';
						stormNftType = '';
						officialChannelStateById = {};
							officialChannelCount = 0;
							joinRequestsByChannelId = {};
							joinRequestLoadPendingByChannelId = {};
							joinRequestCreatePendingByChannelId = {};
							joinRequestApprovePendingById = {};
							channelMembersByChannelId = {};
							channelMembersLoadPendingByChannelId = {};
							channelMemberRemovePendingByKey = {};
							activeThreadTab = 'chat';
							threadStateText = '';
							threadStateWarn = false;
							effectiveOwnerAddress = normalizeAddress(CONFIG.ownerAddress);
							effectiveOwnerAddressResolved = false;
							effectiveOwnerAddressPromise = null;
						}
				refreshSenderNameOptions();
				renderComposerIdentity();
				applyComposerState();
				if (isOpen) {
					loadChannels();
				}
			});
		}

		ensureOfficialMessagingSdk();
	})();
	`
}
