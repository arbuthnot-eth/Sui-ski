export interface MessagingChatConfig {
	page: 'profile' | 'landing' | 'register'
	name?: string
	address?: string
	ownerAddress?: string
	expirationMs?: number
	linkedNames?: number
	serverScope?: 'owner' | 'name'
	network?: string
}

export function generateMessagingChatJs(config: MessagingChatConfig): string {
	return `
		(function() {
			var CONFIG = ${JSON.stringify(config)};
			var OFFICIAL_MESSAGING_SDK_VERSION = '0.4.0';
			var OFFICIAL_SUI_SDK_VERSION = '2.4.0';
			var OFFICIAL_SEAL_SDK_VERSION = '1.0.1';
			var OFFICIAL_MESSAGING_SDK_URLS = [
				'https://cdn.jsdelivr.net/gh/arbuthnot-eth/sui-stack-messaging-sdk@mainnet-messaging-v3.1-2026-02-16/cdn/messaging-browser.mjs',
			];
			var OFFICIAL_SUI_CLIENT_URLS = [
				'https://esm.sh/@mysten/sui@' + OFFICIAL_SUI_SDK_VERSION + '/graphql',
				'https://cdn.jsdelivr.net/npm/@mysten/sui@' + OFFICIAL_SUI_SDK_VERSION + '/dist/graphql/index.mjs',
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
			var CHANNEL_META_CACHE_KEY_PREFIX = 'x402-chat-channel-meta';
			var POLL_INTERVAL = 5000;
			var activeChannel = '';
			var channels = [];
			var channelMessages = {};
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
			var officialMessagingSigner = null;
			var officialMessagingAddress = '';
			var officialMessagingPackageId = '';
			var officialChannelStateById = {};
			var officialChannelCount = 0;
			var channelMetaById = {};
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
			var defaultPublicChannelAutoCreateByOwner = {};
			var channelAcceptPending = false;
			var channelBurnPendingById = {};
			var localPurgeBeforeByChannelId = {};
			var bulkBurnPending = false;
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
			return 'x402-chat-sender-name:' + address;
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
					for (var i = 0; i < names.length; i++) {
						var entry = names[i] || {};
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
				(isOwnerScope() && firstChannelDefaultName)
					? firstChannelDefaultName
					: (server && server.name ? server.name : CONFIG.name || ''),
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
			query.push('via=messaging-chat')
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

		function getCanonicalPublicChannelName() {
			return sanitizeSlug(firstChannelDefaultName || '')
				|| (isOwnerScope() ? '' : sanitizeSlug(normalizeName(CONFIG.name || '')))
				|| 'public';
		}

		function getCanonicalPublicChannelId() {
			for (var i = 0; i < channels.length; i++) {
				var channel = channels[i];
				if (!channel || channel.encrypted || !isOfficialChannel(channel)) continue;
				return String(channel.id || '');
			}
			return '';
		}

		function isCanonicalPublicChannel(channel) {
			if (!channel || channel.encrypted) return false;
			if (isOfficialChannel(channel)) {
				var canonicalId = getCanonicalPublicChannelId();
				return !!canonicalId && String(channel.id || '') === canonicalId;
			}
			var canonical = getCanonicalPublicChannelName();
			if (!canonical) return false;
			var current = sanitizeSlug((channel && channel.name) || (channel && channel.id) || '');
			return !!current && current === canonical;
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
			try {
				var response = await fetch('/api/names/' + encodeURIComponent(owner), { credentials: 'include' });
				if (!response.ok) {
					return {
						addresses: [],
						truncated: 0,
						sharedAddress: owner,
						linkedCount: 0,
					};
				}
				var data = await response.json();
				var names = Array.isArray(data && data.names) ? data.names : [];
				var sharedAddress = normalizeAddress(getConnectedOwnerAddress()) || owner;
				var linkedCount = names.length;
				var MAX_LINKED_MEMBER_ADDRESSES = 24;
				var candidates = [];
				var dedupe = {};
				function pushCandidate(nextAddress) {
					var clean = normalizeAddress(nextAddress);
					if (!clean || clean === owner || dedupe[clean]) return;
					dedupe[clean] = true;
					candidates.push(clean);
				}
				if (sharedAddress && sharedAddress !== owner) {
					pushCandidate(sharedAddress);
				}
				var resolveTasks = [];
				for (var i = 0; i < names.length; i++) {
					var cleanName = sanitizeSlug(normalizeName(names[i] && names[i].name ? names[i].name : ''));
					if (!cleanName) continue;
					resolveTasks.push(resolveAddressForSuiName(cleanName));
				}
				var resolvedAddresses = resolveTasks.length ? await Promise.all(resolveTasks) : [];
				for (var r = 0; r < resolvedAddresses.length; r++) {
					pushCandidate(resolvedAddresses[r]);
				}
				var truncated = 0;
				if (candidates.length > MAX_LINKED_MEMBER_ADDRESSES) {
					truncated = candidates.length - MAX_LINKED_MEMBER_ADDRESSES;
					candidates = candidates.slice(0, MAX_LINKED_MEMBER_ADDRESSES);
				}
				return {
					addresses: candidates,
					truncated: truncated,
					sharedAddress: sharedAddress,
					linkedCount: linkedCount,
				};
			} catch (_e) {
				return {
					addresses: [],
					truncated: 0,
					sharedAddress: owner,
					linkedCount: 0,
				};
			}
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

		function ensureOfficialMessagingSdk() {
			if (officialMessagingSdk) return Promise.resolve(officialMessagingSdk);
			if (officialMessagingSdkLoadPromise) return officialMessagingSdkLoadPromise;
			if (window.__suiStackMessagingSdk && window.__suiStackMessagingSdk.SuiStackMessagingClient) {
				officialMessagingSdk = window.__suiStackMessagingSdk;
				officialMessagingSdkStatus = 'ready';
				return Promise.resolve(officialMessagingSdk);
			}
			officialMessagingSdkLoadPromise = importFirstAvailable(OFFICIAL_MESSAGING_SDK_URLS)
				.then(function(mod) {
					if (!mod || !mod.SuiStackMessagingClient) {
						throw new Error('Official SDK did not expose SuiStackMessagingClient');
					}
					officialMessagingSdk = mod;
					officialMessagingSdkStatus = 'ready';
					window.__suiStackMessagingSdk = mod;
					window.__suiStackMessagingSdkVersion = OFFICIAL_MESSAGING_SDK_VERSION;
					renderServerHeader();
					return mod;
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
							console.log('[ski-chat-signer] signPersonalMessage called.',
								'input type:', typeof input,
								input instanceof Uint8Array ? 'Uint8Array(' + input.length + ')' :
								(input && typeof input === 'object') ? 'keys:' + Object.keys(input).slice(0, 5).join(',') : '',
								'message type:', typeof message,
								message instanceof Uint8Array ? 'Uint8Array(' + message.length + ')' :
								Array.isArray(message) ? 'Array(' + message.length + ')' :
								(message && typeof message === 'object') ? 'keys:' + Object.keys(message).slice(0, 5).join(',') : '');
							var messageBytes = toMessageBytes(message, 0);
							console.log('[ski-chat-signer] messageBytes:', messageBytes.length, 'bytes, first8:', Array.from(messageBytes.slice(0, 8)));
							if (!messageBytes.length) {
								throw new Error('Wallet signer message payload was empty');
							}
							var signed = null;
							var firstError = null;
							try {
								signed = await SuiWalletKit.signPersonalMessage(messageBytes, { forceSignBridge: true });
							} catch (error) {
								firstError = error;
								console.warn('[ski-chat-signer] bridge sign failed:', error && error.message ? error.message : error);
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
						},
						signTransaction: async function(input) {
							if (typeof SuiWalletKit === 'undefined' || typeof SuiWalletKit.signTransaction !== 'function') {
								throw new Error('Wallet signer is unavailable');
							}
							var transaction = await prepareWalletTransactionInput(input);
							var signOptions = { forceSignBridge: true };
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
							signOptions.forceSignBridge = isSubdomainSuiHost() || !!(input && input.forceSignBridge);
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
						var txResult = { digest: rawResult.digest, effects: rawResult.effects };
						if (rawResult.rawEffects) txResult.rawEffects = rawResult.rawEffects;
						var isFailure = rawResult.effects && rawResult.effects.status && rawResult.effects.status.status === 'failure';
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
							signOptions.forceSignBridge = isSubdomainSuiHost() || !!(input && input.forceSignBridge);
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
						var txResult = { digest: rawResult.digest, effects: rawResult.effects };
						if (rawResult.rawEffects) txResult.rawEffects = rawResult.rawEffects;
						var isFailure = rawResult.effects && rawResult.effects.status && rawResult.effects.status.status === 'failure';
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

			function channelIdToLabel(channelId, index) {
				var compact = String(channelId || '').trim();
				if (!compact) return 'on-chain-' + String(index + 1);
				var meta = getStoredChannelMeta(compact);
				if (meta && meta.name) return meta.name;
				var baseName = firstChannelDefaultName || (isOwnerScope() ? '' : (sanitizeSlug(normalizeName(CONFIG.name || '')) || ''));
				if (baseName) {
					var label = index === 0 ? baseName : baseName + '-' + String(index + 1);
					setStoredChannelMeta(compact, label, 'public');
					return label;
				}
				if (compact.length <= 12) return 'on-' + compact;
				var safe = compact.replace(/^0x/i, '');
				return 'on-' + safe.slice(0, 8);
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
						importFirstAvailable(OFFICIAL_SUI_CLIENT_URLS),
						importFirstAvailable(OFFICIAL_SEAL_SDK_URLS),
					]);
					var suiMod = loaded[0] || {};
					var sealMod = loaded[1] || {};
					console.log('[messaging-init] suiMod keys:', Object.keys(suiMod).slice(0, 15), 'sealMod keys:', Object.keys(sealMod).slice(0, 10));
					var SuiClientCtor = suiMod.SuiGraphQLClient || suiMod.SuiJsonRpcClient || suiMod.SuiClient;
					if (!SuiClientCtor || !sealMod.SealClient) {
						throw new Error('Required Sui SDK modules are unavailable (SuiGraphQLClient=' + !!suiMod.SuiGraphQLClient + ', SealClient=' + !!sealMod.SealClient + ')');
					}
					if (!window.SuiClient) window.SuiClient = SuiClientCtor;
					if (!window.SuiGraphQLClient) window.SuiGraphQLClient = SuiClientCtor;

					var config = await fetchOfficialMessagingConfig();
					var network = getNetwork();
					var graphqlUrl = getGraphqlUrlForNetwork(network);
					var sealServers = resolveSealServerConfigs(network, config);
					if (!sealServers.length) {
						throw new Error('No Seal key servers configured for messaging SDK');
					}
					var sealThreshold = resolveSealThreshold(config, sealServers.length);
					var walrusConfig = resolveWalrusConfig(network, config);
					var signer = createOfficialMessagingSigner(normalizedAddress);

					var resolvedPackageConfig = { packageId: getMessagingPackageId() };
					if (config && config.sdk && config.sdk.messagingPackageConfig && config.sdk.messagingPackageConfig.packageId) {
						resolvedPackageConfig = config.sdk.messagingPackageConfig;
					}
					officialMessagingPackageId = resolvedPackageConfig.packageId;

					var clientOpts = { url: graphqlUrl, network: network };
					if (officialMessagingPackageId) {
						clientOpts.mvr = { overrides: { packages: { '@local-pkg/sui-stack-messaging': officialMessagingPackageId } } };
					}
					var baseClient = new SuiClientCtor(clientOpts);
					var SealClientCtor = sealMod.SealClient;
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
					officialMessagingAddress = normalizedAddress;
					officialMessagingSigner = signer;
					officialMessagingSdkStatus = 'ready';
					renderServerHeader();
					return client;
				})()
					.catch(function(error) {
						console.error('[messaging-init] FAILED:', error && error.message || error, error && error.stack || '');
						officialMessagingClient = null;
						officialMessagingSigner = null;
						officialMessagingAddress = '';
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
					var memberCapByChannel = {};
					var memberAddressByChannel = {};
					for (var i = 0; i < memberships.length; i++) {
						var item = memberships[i];
						var channelId = String(item && item.channel_id ? item.channel_id : '').trim();
						var memberCapId = String(item && item.member_cap_id ? item.member_cap_id : '').trim();
						var memberAddress = normalizeAddress(
							(item && (
								item.member_address
								|| item.memberAddress
								|| item.address
								|| item.member
							)) || address,
						);
						if (!channelId || !memberCapId) continue;
						if (!memberCapByChannel[channelId]) {
							channelIds.push(channelId);
						}
						memberCapByChannel[channelId] = memberCapId;
						memberAddressByChannel[channelId] = memberAddress || address;
					}
					if (!channelIds.length) {
						renderServerHeader();
						return [];
					}

					var creatorCapByChannel = {};
					if (typeof client.getCreatorCap === 'function') {
						for (var cc = 0; cc < channelIds.length; cc++) {
							var creatorChannelId = channelIds[cc];
							try {
								var creatorCap = await client.getCreatorCap(address, creatorChannelId);
								var creatorCapId = String(
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

					var fallbackBase = sanitizeSlug(firstChannelDefaultName || '')
						|| (isOwnerScope() ? '' : sanitizeSlug(normalizeName(CONFIG.name || '')))
						|| 'public';
					var fallbackOrdinal = 0;
					var usedSyntheticNames = {};
					for (var p = 0; p < channelIds.length; p++) {
						var existingMeta = getStoredChannelMeta(channelIds[p]);
						if (!existingMeta || !existingMeta.name) continue;
						usedSyntheticNames[existingMeta.name] = true;
					}

					var channelObjects = [];
					var membershipCapIds = [];
					for (var mc = 0; mc < channelIds.length; mc++) {
						var nextCap = String(memberCapByChannel[channelIds[mc]] || '').trim();
						if (nextCap) membershipCapIds.push(nextCap);
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
						var objectId = String(
							object.id && object.id.id ? object.id.id
							: typeof object.id === 'string' ? object.id
							: ''
						).trim();
						if (objectId) channelObjectById[objectId] = object;
					}
					var officialChannels = [];
					for (var k = 0; k < channelIds.length; k++) {
						var sdkChannelId = channelIds[k];
						var memberCapId = String(memberCapByChannel[sdkChannelId] || '').trim();
						var memberAddress = String(memberAddressByChannel[sdkChannelId] || address || '').trim();
						var channelObject = channelObjectById[sdkChannelId]
							|| (channelObjects.length === channelIds.length ? channelObjects[k] : null);
						var resolvedEncryptedKey = extractEncryptedKeyFromChannelObject(channelObject);
						if (!resolvedEncryptedKey) {
							console.debug('[ski-chat] Channel missing encrypted key (send disabled until repaired):', sdkChannelId);
						}
						var storedMeta = getStoredChannelMeta(sdkChannelId);
						var visibility = storedMeta && storedMeta.visibility === 'private' ? 'private' : 'public';
						if (!storedMeta || !storedMeta.name) {
							var nextLabel = '';
							while (!nextLabel) {
								var candidate = fallbackBase;
								if (fallbackOrdinal > 0) candidate = fallbackBase + '-' + String(fallbackOrdinal + 1);
								fallbackOrdinal += 1;
								if (!usedSyntheticNames[candidate]) nextLabel = candidate;
							}
							setStoredChannelMeta(sdkChannelId, nextLabel, visibility);
							storedMeta = getStoredChannelMeta(sdkChannelId);
							usedSyntheticNames[nextLabel] = true;
						} else {
							usedSyntheticNames[storedMeta.name] = true;
						}
						var syntheticId = storedMeta && storedMeta.name
							? storedMeta.name
							: channelIdToLabel(sdkChannelId, k);
						while (officialChannelStateById[syntheticId]) {
							syntheticId = syntheticId + '-' + String(k + 1);
						}
						var creatorCapId = String(creatorCapByChannel[sdkChannelId] || '').trim();
						var createdAtMs = Number(
							channelObject && channelObject.created_at_ms
								? channelObject.created_at_ms
								: Date.now(),
						);
						officialChannelStateById[syntheticId] = {
							channelId: sdkChannelId,
							memberCapId: memberCapId,
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

		var root = document.getElementById('messaging-chat-root') || document.getElementById('x402-chat-root');
		if (!root) return;

		root.innerHTML = ''
			+ '<button id="x402-chat-bubble" aria-label="Open secure chat">'
			+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
			+ '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
			+ '</button>'
			+ '<div id="x402-chat-backdrop"></div>'
			+ '<div id="x402-chat-panel">'
			+ '<div class="x402-signal-header">'
			+ '<div class="x402-signal-ident">'
			+ '<button class="x402-signal-avatar-btn" id="x402-brand-icon" aria-label="Open profile or connect" title="Open profile or connect on sui.ski">'
			+ '<img class="x402-signal-avatar" src="/media-pack/dotSKI.png" alt=".ski">'
			+ '</button>'
			+ '<div><div class="x402-server-title" id="x402-server-title">Secure Chat</div><div class="x402-server-meta" id="x402-server-meta">Wallet-based messaging</div></div>'
			+ '</div>'
			+ '<div class="x402-header-actions">'
			+ '<button class="x402-header-btn" id="x402-close-btn" title="Close">&times;</button>'
			+ '</div>'
			+ '</div>'
			+ '<div class="x402-layout">'
			+ '<aside class="x402-sidebar">'
			+ '<div class="x402-sidebar-title-row">'
			+ '<div class="x402-sidebar-title">Channels</div>'
			+ '<button class="x402-sidebar-burn-all-btn" id="x402-burn-duplicates-btn" style="display:none">Burn Duplicates</button>'
			+ '</div>'
			+ '<div id="x402-channel-list"></div>'
			+ '<div class="x402-sidebar-footer">'
			+ '<div class="x402-onchain-badge" id="x402-onchain-badge" style="display:none">'
			+ '<img src="/media-pack/SuiIcon.svg" alt="Sui" width="12" height="12">'
			+ '<span>Settled on Sui Stack Messaging SDK</span>'
			+ '</div>'
			+ '</div>'
			+ '</aside>'
			+ '<section class="x402-thread">'
			+ '<div class="x402-thread-head">'
			+ '<div class="x402-thread-name" id="x402-channel-name">#general</div>'
			+ '<div class="x402-channel-gear-wrap" id="x402-channel-gear-wrap" style="display:none">'
			+ '<button class="x402-channel-gear-btn" id="x402-channel-gear-btn" title="Channel settings" aria-label="Channel settings">'
			+ '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
			+ '</button>'
			+ '<div class="x402-channel-gear-menu" id="x402-channel-gear-menu" style="display:none">'
			+ '<button class="x402-gear-item" id="x402-gear-sync">Sync</button>'
			+ '<button class="x402-gear-item" id="x402-gear-rename">Rename</button>'
			+ '<button class="x402-gear-item x402-gear-item-danger" id="x402-gear-purge">Purge</button>'
			+ '</div>'
			+ '</div>'
			+ '<div class="x402-thread-state" id="x402-thread-state"></div>'
			+ '</div>'
			+ '<div class="x402-mode-banner" id="x402-mode-banner" style="display:none"></div>'
			+ '<div class="x402-messages" id="x402-messages"></div>'
			+ '<div class="x402-input-wrap">'
			+ '<div class="x402-composer-identity" id="x402-composer-identity"></div>'
			+ '<div class="x402-input-area">'
			+ '<textarea class="x402-input" id="x402-input" placeholder="Type a message..." rows="1"></textarea>'
			+ '<button class="x402-send-btn" id="x402-send-btn" disabled>'
			+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
			+ '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
			+ '</button>'
			+ '</div>'
			+ '</div>'
			+ '</section>'
			+ '</div>'
			+ '</div>';

		var bubble = document.getElementById('x402-chat-bubble');
		var backdrop = document.getElementById('x402-chat-backdrop');
		var panel = document.getElementById('x402-chat-panel');
		var closeBtn = document.getElementById('x402-close-btn');
		var messagesEl = document.getElementById('x402-messages');
		var inputEl = document.getElementById('x402-input');
		var sendBtn = document.getElementById('x402-send-btn');
		var brandIconEl = document.getElementById('x402-brand-icon');
		var burnDuplicatesBtn = document.getElementById('x402-burn-duplicates-btn');
		var composerIdentityEl = document.getElementById('x402-composer-identity');
		var channelNameEl = document.getElementById('x402-channel-name');
		var channelListEl = document.getElementById('x402-channel-list');
		var threadStateEl = document.getElementById('x402-thread-state');
		var serverTitleEl = document.getElementById('x402-server-title');
		var serverMetaEl = document.getElementById('x402-server-meta');
		var modeBannerEl = document.getElementById('x402-mode-banner');
		loadStoredChannelMeta();
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
				if (!canShowMembersTab && activeThreadTab === 'members') {
					activeThreadTab = 'chat';
				}
				var members = getActiveChannelMembers();
				var pendingCount = getPendingJoinRequestCount(getActiveJoinRequests());
				var html = '';
				if (canShowMembersTab) {
					html += '<button class="x402-thread-tab' + (activeThreadTab === 'members' ? ' active' : '') + '" data-thread-tab="' + (activeThreadTab === 'members' ? 'chat' : 'members') + '">';
					html += activeThreadTab === 'members' ? 'Back to Chat' : 'Members';
					var badge = [];
					if (members.length) badge.push(String(members.length));
					if (pendingCount) badge.push(String(pendingCount) + ' req');
					if (badge.length) html += ' (' + badge.join(' · ') + ')';
					html += '</button>';
				}
				if (threadStateText) {
					html += '<span class="x402-thread-state-copy' + (threadStateWarn ? ' warn' : '') + '">' + escapeHtml(threadStateText) + '</span>';
				}
				threadStateEl.innerHTML = html;
			}

		function applyComposerState() {
			var hasInput = !!String(inputEl.value || '').trim();
			var channel = getActiveChannel();
			var bootstrapName = sanitizeSlug((channel && channel.name) || activeChannel || '') || 'public';
			var waitingForOwnerChannelCreate = !!(channel && channel.sdk === 'bootstrap' && !isConnectedServerOwner());
			if (waitingForOwnerChannelCreate) {
				var pendingSelfRequest = getPendingSelfJoinRequest();
				var requestPending = !!joinRequestCreatePendingByChannelId[activeChannel];
				inputEl.disabled = true;
				inputEl.placeholder = 'Owner must create #' + bootstrapName + ' or add this wallet as member';
				if (pendingSelfRequest || requestPending) {
					setThreadState(
						'Join request pending for #' + bootstrapName + '. Owner can approve and auto-add this wallet.',
						true,
					);
				} else {
					setThreadState(
						'This wallet is not a member of #' + bootstrapName + ' yet. Request access or ask owner to sync linked members.',
						true,
					);
				}
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
			var titleSlug = isOwnerScope() && firstChannelDefaultName
				? firstChannelDefaultName
				: sanitizeSlug(normalizeName(CONFIG.name || ''));
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
				var titleHref = 'https://' + encodeURIComponent(titleSlug) + '.' + titleHost + '?via=messaging-chat&source=server-title';
				serverTitleEl.innerHTML = '<a class="x402-server-title-link" href="' + escapeHtml(titleHref) + '" title="Open ' + escapeHtml(titleSlug) + '.sui.ski">@' + escapeHtml(titleSlug) + '</a>';
			} else {
				serverTitleEl.textContent = server.displayName || 'Secure Chat';
			}
			var connectedAddress = normalizeAddress(getAddress());
			var ownerAddress = getConnectedOwnerAddress();
			var visibleAddress = ownerAddress || connectedAddress || '';
			if (visibleAddress) {
				var explorerHref = getAddressExplorerHref(visibleAddress);
				serverMetaEl.innerHTML = '<a class="x402-server-meta-link" href="' + escapeHtml(explorerHref) + '" target="_blank" rel="noopener noreferrer" title="' + escapeHtml(visibleAddress) + '">' + escapeHtml(truncateAddress(visibleAddress)) + '</a>';
			} else {
				serverMetaEl.textContent = getSdkLabel();
			}
		}

		function renderModeBanner(channel) {
			var badge = document.getElementById('x402-onchain-badge');
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
				composerIdentityEl.className = 'x402-composer-identity';
				composerIdentityEl.innerHTML = '<span class="x402-composer-identity-label">Connect wallet to send</span>';
				return;
			}
			if (!signingAddress) {
				composerIdentityEl.className = 'x402-composer-identity';
				composerIdentityEl.innerHTML = '<span class="x402-composer-identity-label">Reconnect Sui wallet signer</span>'
					+ '<span class="x402-composer-identity-address">' + escapeHtml(truncateAddress(connectedAddress)) + '</span>';
				return;
			}
			composerIdentityEl.className = ownerConnected
				? 'x402-composer-identity owner'
				: 'x402-composer-identity';
			if (!senderNameOptions.length) {
				composerIdentityEl.innerHTML = '<span class="x402-composer-identity-label">Author</span>'
					+ '<span class="x402-composer-identity-address">' + escapeHtml(truncateAddress(connectedAddress)) + '</span>';
				return;
			}
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
					chipsHtml += '<button type="button" class="x402-author-chip' + selectedClass + ownerPrimaryClass + '" data-author-name="' + escapeHtml(chipName) + '">' + escapeHtml(chipName) + '</button>';
				}
			if (!chipsHtml) chipsHtml = '<span class="x402-composer-identity-address">No matching linked names</span>';
			var filterInputHtml = senderNameOptions.length > 6
				? '<input class="x402-author-filter" id="x402-author-filter" type="text" placeholder="Filter names" value="' + escapeHtml(senderNameFilter || '') + '">'
				: '';
				var selectedLabel = connectedPrimary
					? connectedPrimary
					: truncateAddress(connectedAddress);
				var selectedOwnerPrimaryClass = isOwnerPrimaryName(selectedLabel) ? ' owner-primary' : '';
				var selectedHtml = '<button type="button" class="x402-composer-identity-pill x402-author-toggle'
					+ selectedOwnerPrimaryClass
					+ (isAuthorPickerOpen ? ' open' : '')
					+ '" data-action="toggle-author-picker" aria-expanded="'
				+ (isAuthorPickerOpen ? 'true' : 'false')
				+ '">' + escapeHtml(selectedLabel) + '</button>';
			var pickerHtml = '';
			if (isAuthorPickerOpen) {
				pickerHtml = '<div class="x402-author-picker">'
					+ filterInputHtml
					+ '<div class="x402-author-chip-list">' + chipsHtml + '</div>'
					+ '</div>';
			}
			composerIdentityEl.innerHTML = ''
				+ '<span class="x402-composer-identity-label">Author</span>'
				+ selectedHtml
				+ pickerHtml;
		}

		function openBrandProfileOrConnect() {
			var primaryName = sanitizeSlug(normalizeName(getPrimaryName()));
			if (primaryName) {
				var profileHost = getProfileHostForNetwork();
				var profileHref = 'https://' + encodeURIComponent(primaryName) + '.' + profileHost + '?via=messaging-chat&source=dotski-icon';
				window.location.href = profileHref;
				return;
			}

			var hasAddress = !!normalizeAddress(getAddress());
			var promptText = hasAddress
				? 'No primary name found for this wallet yet. Open sui.ski to connect and set your primary profile?'
				: 'Connect your wallet on sui.ski to open your primary profile. Open now?';
			if (!window.confirm(promptText)) return;
			window.location.href = 'https://sui.ski?connect=1&via=messaging-chat&source=dotski-icon';
		}

		function renderChannelList() {
			var publicChannels = [];
			var privateChannels = [];
			for (var i = 0; i < channels.length; i++) {
				var nextChannel = channels[i];
				var isPrivate = !!nextChannel.encrypted || String(nextChannel.id || '').indexOf('dm-') === 0;
				if (isPrivate) {
					privateChannels.push(nextChannel);
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

			var html = '';
			function renderChannelSection(title, list) {
				html += '<div class="x402-channel-group">';
				html += '<div class="x402-channel-group-title">' + escapeHtml(title) + '</div>';
				if (!list.length) {
					html += '<div class="x402-sidebar-empty">No ' + escapeHtml(title.toLowerCase()) + ' channels</div>';
				} else {
					for (var j = 0; j < list.length; j++) {
						var channel = list[j];
						var isActive = channel.id === activeChannel;
						var displayName = channel.name;
						var displayLabel = (channel.encrypted ? '🔒 ' : '#') + String(displayName || '');
						var isBootstrap = channel.sdk === 'bootstrap';
						var showAccept = isBootstrap && isConnectedServerOwner() && !channelAcceptPending;
						var state = getOfficialChannelState(channel.id);
						var canManage = !!(state && state.canManage);
						var showSyncMembers = !!(isOfficialChannel(channel) && isConnectedServerOwner() && state);
						var showBurn = !!(isOfficialChannel(channel) && canManage && state && state.creatorCapId && !isCanonicalPublicChannel(channel));
						var showRename = !!(isOfficialChannel(channel) && canManage && state);
						var showPurge = !!(isOfficialChannel(channel) && canManage && state);
						var isBurning = !!channelBurnPendingById[channel.id];
						html += '<div class="x402-channel-item' + (isActive ? ' active' : '') + '" data-channel="' + escapeHtml(channel.id) + '">'
							+ '<span class="x402-channel-main">'
							+ '<span class="x402-channel-name">' + escapeHtml(displayLabel) + '</span>'
							+ '</span>';
						if (showAccept) {
							html += '<button class="x402-channel-accept-btn" data-accept-channel="' + escapeHtml(channel.id) + '" title="Create #' + escapeHtml(displayName) + ' on-chain">Accept</button>';
						} else if (isBootstrap && channelAcceptPending) {
							html += '<span class="x402-channel-accept-pending">...</span>';
						} else if (showBurn) {
							html += '<span class="x402-channel-actions">';
							if (showBurn) {
								html += '<button class="x402-channel-delete" data-burn-channel="' + escapeHtml(channel.id) + '"'
									+ (isBurning ? ' disabled' : '')
									+ ' title="Burn #' + escapeHtml(displayName) + ' membership objects">'
									+ (isBurning ? 'Burning...' : 'Burn')
									+ '</button>';
							}
							html += '</span>';
						}
						html += '</div>';
					}
				}
				html += '</div>';
			}

			renderChannelSection('Public', publicChannels);
			renderChannelSection('Private', privateChannels);

			channelListEl.innerHTML = html;
			updateBulkBurnButton();
		}

		function getBulkBurnableChannelIds() {
			var burnable = [];
			for (var i = 0; i < channels.length; i++) {
				var channel = channels[i];
				if (!channel || !isOfficialChannel(channel) || isCanonicalPublicChannel(channel)) continue;
				var state = getOfficialChannelState(channel.id);
				if (!state || !state.creatorCapId) continue;
				burnable.push(channel.id);
			}
			return burnable;
		}

		function updateBulkBurnButton() {
			if (!burnDuplicatesBtn) return;
			if (!isConnectedServerOwner()) {
				burnDuplicatesBtn.style.display = 'none';
				burnDuplicatesBtn.disabled = true;
				return;
			}
			var burnable = getBulkBurnableChannelIds();
			if (!burnable.length) {
				burnDuplicatesBtn.style.display = 'none';
				burnDuplicatesBtn.disabled = true;
				return;
			}
			burnDuplicatesBtn.style.display = 'inline-flex';
			burnDuplicatesBtn.disabled = bulkBurnPending;
			if (bulkBurnPending) {
				burnDuplicatesBtn.textContent = 'Burning...';
			} else {
				burnDuplicatesBtn.textContent = 'Burn Duplicates (' + String(burnable.length) + ')';
			}
		}

		function ensureActiveChannel() {
			if (!channels.length) {
				activeChannel = getCanonicalPublicChannelName();
				return;
			}
			for (var i = 0; i < channels.length; i++) {
				if (channels[i].id === activeChannel) return;
			}
			var seededName = sanitizeSlug(firstChannelDefaultName || '');
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
				var gearWrap = document.getElementById('x402-channel-gear-wrap');
				if (gearWrap) {
					var chState = getOfficialChannelState(activeChannel);
					var showGear = !!(official && chState && chState.canManage);
					gearWrap.style.display = showGear ? '' : 'none';
					gearWrap.dataset.channelId = activeChannel || '';
					var gearMenu = document.getElementById('x402-channel-gear-menu');
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
					var membersHtml = '<div class="x402-members-tab">';

					membersHtml += '<div class="x402-members-section">';
					membersHtml += '<div class="x402-members-title">Members (' + String(members.length) + ')</div>';
					if (membersLoading && !members.length) {
						membersHtml += '<div class="x402-members-empty">Loading channel members...</div>';
					} else if (!members.length) {
						membersHtml += '<div class="x402-members-empty">No members found for this channel.</div>';
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
								membersHtml += '<div class="x402-member-row">';
								membersHtml += '<div class="x402-member-ident">';
								membersHtml += '<span class="x402-member-name' + memberOwnerPrimaryClass + '">' + escapeHtml(memberName) + '</span>';
								membersHtml += '<span class="x402-member-address">' + escapeHtml(truncateAddress(memberAddress)) + (memberBadge ? ' · ' + escapeHtml(memberBadge) : '') + '</span>';
								membersHtml += '</div>';
							if (canRemove) {
								membersHtml += '<button class="x402-msg-action danger" data-remove-member-address="' + escapeHtml(memberAddress) + '"'
									+ (removing ? ' disabled' : '')
									+ '>'
									+ (removing ? 'Removing...' : 'Remove')
									+ '</button>';
							}
							membersHtml += '</div>';
						}
					}
					membersHtml += '</div>';

					membersHtml += '<div class="x402-members-section">';
					membersHtml += '<div class="x402-members-title">Join requests (' + String(pendingRequests.length) + ')</div>';
					if (isConnectedServerOwner()) {
						if (!pendingRequests.length) {
							membersHtml += '<div class="x402-members-empty">No pending join requests.</div>';
						} else {
							for (var rq = 0; rq < pendingRequests.length; rq++) {
								var requestItem = pendingRequests[rq];
								var requestAddr = normalizeAddress(requestItem.requesterAddress);
								var requestName = requestItem.requesterName || truncateAddress(requestAddr) || 'unknown';
								var approvePending = !!joinRequestApprovePendingById[requestItem.id];
								membersHtml += '<div class="x402-member-row">';
								membersHtml += '<div class="x402-member-ident">';
								membersHtml += '<span class="x402-member-name">' + escapeHtml(requestName) + '</span>';
								membersHtml += '<span class="x402-member-address">' + escapeHtml(truncateAddress(requestAddr)) + '</span>';
								membersHtml += '</div>';
								membersHtml += '<div class="x402-members-actions">';
								membersHtml += '<button class="x402-msg-action" data-approve-join-request="' + escapeHtml(requestItem.id) + '"'
									+ (approvePending ? ' disabled' : '')
									+ '>'
									+ (approvePending ? 'Approving...' : 'Approve')
									+ '</button>';
								membersHtml += '<button class="x402-msg-action danger" data-cancel-join-request="' + escapeHtml(requestItem.id) + '">Reject</button>';
								membersHtml += '</div>';
								membersHtml += '</div>';
							}
						}
					} else {
						if (pendingSelfRequest) {
							membersHtml += '<div class="x402-members-empty">Your join request is pending approval.</div>';
							membersHtml += '<div class="x402-members-actions">';
							membersHtml += '<button class="x402-msg-action" data-cancel-join-request="' + escapeHtml(pendingSelfRequest.id) + '">Cancel request</button>';
							membersHtml += '</div>';
						} else if (!official || (channel && channel.sdk === 'bootstrap')) {
							membersHtml += '<div class="x402-members-empty">This wallet is not a member yet. Request access to #' + escapeHtml(requestChannelName) + '.</div>';
							membersHtml += '<div class="x402-members-actions">';
							membersHtml += '<button class="x402-msg-action" data-request-join="' + escapeHtml(requestChannelName) + '"'
								+ (requestPendingCreate ? ' disabled' : '')
								+ '>'
								+ (requestPendingCreate ? 'Requesting...' : 'Request access')
								+ '</button>';
							membersHtml += '</div>';
						} else {
							membersHtml += '<div class="x402-members-empty">Only owner-linked names can approve join requests.</div>';
						}
					}
					membersHtml += '</div>';
					membersHtml += '</div>';
					messagesEl.innerHTML = membersHtml;
					messagesEl.scrollTop = 0;
					return;
				}

				if (!messages.length) {
					if (channel && channel.sdk === 'bootstrap') {
						var bootstrapName = sanitizeSlug((channel && channel.name) || activeChannel || '') || 'public';
						if (isConnectedServerOwner()) {
							var createPrompt = '<div class="x402-msg system">Send a message to create #' + escapeHtml(bootstrapName) + ' on-chain.</div>';
							messagesEl.innerHTML = createPrompt;
						} else {
							var requestPending = !!joinRequestCreatePendingByChannelId[activeChannel];
							var requestActionHtml = '';
							if (pendingSelfRequest) {
							requestActionHtml = '<div class="x402-msg system">'
								+ 'Join request pending for #' + escapeHtml(bootstrapName) + '.'
								+ '<div class="x402-msg-actions"><button class="x402-msg-action" data-cancel-join-request="' + escapeHtml(pendingSelfRequest.id) + '">Cancel request</button></div>'
								+ '</div>';
						} else {
							requestActionHtml = '<div class="x402-msg system">'
								+ 'This wallet is not a member of #' + escapeHtml(bootstrapName) + ' yet. Owner must create the channel or sync linked members.'
								+ '<div class="x402-msg-actions"><button class="x402-msg-action" data-request-join="' + escapeHtml(bootstrapName) + '"'
								+ (requestPending ? ' disabled' : '')
								+ '>'
								+ (requestPending ? 'Requesting...' : 'Request Access')
								+ '</button></div>'
								+ '</div>';
						}
						messagesEl.innerHTML = requestActionHtml;
					}
						return;
					}
					if (!channels.length && isConnectedServerOwner()) {
						var suggestedName = sanitizeSlug(firstChannelDefaultName || '') || 'public';
						messagesEl.innerHTML = '<div class="x402-msg system">Create #' + escapeHtml(suggestedName) + ' as your first public channel.</div>';
						return;
					}
					messagesEl.innerHTML = '<div class="x402-msg system">No messages yet. Start the conversation.</div>';
					return;
				}

				var ownerPrimaryConnected = isConnectedOwnerPrimary(currentAddress) || isProfileOwnerPrimaryConnected(currentAddress);
				var html = '';
				if (!isConnectedServerOwner() && pendingSelfRequest && !channel.encrypted) {
					html += '<div class="x402-msg system">Join request pending for #' + escapeHtml(requestChannelName) + '.</div>';
				}
				for (var i = 0; i < messages.length; i++) {
					var message = messages[i];
					var isSystem = message.role === 'system';
				if (isSystem) {
					html += '<div class="x402-msg system">' + escapeHtml(message.content || '') + '</div>';
					continue;
				}

					var sender = normalizeAddress(message.sender);
					var isMine = !!sender && sender === currentAddress;
					var senderIsOwnerPrimary = isOwnerPrimaryName(message.senderName || '');
					var msgClass = isMine
						? (ownerPrimaryConnected ? 'user owner' : 'user')
						: 'peer';
					if (senderIsOwnerPrimary) msgClass += ' owner-primary';
					var displayName = message.senderName || truncateAddress(message.sender) || 'Unknown';
				var senderHref = buildSenderProfileHref(message);
				var timeText = formatTime(message.timestamp);
				html += '<div class="x402-msg ' + msgClass + '">'
					+ '<div class="x402-msg-head">'
					+ (
						senderHref
							? '<a class="x402-msg-sender x402-msg-sender-link" href="' + escapeHtml(senderHref) + '" title="Open ' + escapeHtml(displayName) + '.sui.ski">' + escapeHtml(displayName) + '</a>'
							: '<span class="x402-msg-sender">' + escapeHtml(displayName) + '</span>'
					)
					+ '<span class="x402-msg-time">' + escapeHtml(timeText) + '</span>'
					+ '</div>'
					+ '<div>' + escapeHtml(message.content || '').replace(/\\n/g, '<br>') + '</div>';

				html += '</div>';
			}

			messagesEl.innerHTML = html;
			messagesEl.scrollTop = messagesEl.scrollHeight;
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
				if (isOpen) renderMessages();
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

		async function ensureDefaultPublicChannel() {
			var senderAddress = normalizeAddress(getAddress());
			if (!senderAddress || !isConnectedServerOwner()) return false;
			var autoCreateState = defaultPublicChannelAutoCreateByOwner[senderAddress];
			if (!autoCreateState) {
				autoCreateState = { inFlight: false, created: false };
				defaultPublicChannelAutoCreateByOwner[senderAddress] = autoCreateState;
			}
			if (autoCreateState.inFlight || autoCreateState.created) return false;
			autoCreateState.inFlight = true;

			try {
				var client = await ensureOfficialMessagingClient();
				if (!client) return false;
				var defaultName = sanitizeSlug(await resolveFirstChannelDefaultName()) || 'public';
				var linkedMembers = await resolveLinkedTargetAddresses(senderAddress);
				var createResult = await client.executeCreateChannelTransaction({
					signer: officialMessagingSigner || createOfficialMessagingSigner(senderAddress),
					initialMembers: linkedMembers.addresses,
				});
				var channelId = String(createResult && createResult.channelId ? createResult.channelId : '');
				if (!channelId) return false;
				setStoredChannelMeta(channelId, defaultName, 'public');
				autoCreateState.created = true;
				return true;
			} catch (error) {
				console.warn('Default public channel auto-create failed:', error);
				return false;
			} finally {
				autoCreateState.inFlight = false;
			}
		}

		async function loadChannels() {
			try {
				await resolveFirstChannelDefaultName().catch(function() {});
				var resolvedOwnerAddress = normalizeAddress(await resolveEffectiveOwnerAddress().catch(function() { return ''; }));
				server.ownerAddress = resolvedOwnerAddress || null;
				var officialChannels = await loadOfficialChannels();
				channels = officialChannels;
				var serverIdentityName = (isOwnerScope() && firstChannelDefaultName)
					? firstChannelDefaultName
					: sanitizeSlug(normalizeName(CONFIG.name || server.name || 'on-chain')) || 'on-chain';
				var serverIdentityDisplay = (isOwnerScope() && firstChannelDefaultName)
					? (firstChannelDefaultName + '.sui')
					: (CONFIG.name ? (sanitizeSlug(normalizeName(CONFIG.name)) + '.sui') : 'On-chain');
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
				renderMessages();
				applyComposerState();
					if (activeChannel) {
						await loadJoinRequestsForActiveChannel();
						await loadMembersForActiveChannel();
					}
					if (activeChannel) await pollChannelMessages();
				} catch (_e) {}
			}

		async function pollChannelMessages() {
			if (!isOpen || !activeChannel) return;
			var channel = getActiveChannel();
			if (!isOfficialChannel(channel)) return;
			try {
				var state = getOfficialChannelState(activeChannel);
				var client = await ensureOfficialMessagingClient();
				var userAddress = normalizeAddress(getAddress());
				if (!state || !client || !userAddress) return;
				var result = await client.getChannelMessages({
					channelId: state.channelId,
					userAddress: userAddress,
					limit: OFFICIAL_MESSAGE_LIMIT,
					direction: 'backward',
				});
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
				console.warn('Official channel poll failed:', error);
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
				var linkedMembers = await resolveLinkedTargetAddresses(senderAddress);
				var createResult = await client.executeCreateChannelTransaction({
					signer: officialMessagingSigner || createOfficialMessagingSigner(senderAddress),
					initialMembers: linkedMembers.addresses,
				});
				var channelId = String(createResult && createResult.channelId ? createResult.channelId : '');
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
				if (!suppressFailureMessage) addSystemMessage('Primary #' + sanitizeSlug(channel.name || cleanId) + ' is protected. Burn duplicate channels first.');
				return { ok: false, error: 'Primary channel is protected.' };
			}
			if (!isConnectedServerOwner()) {
				if (!suppressFailureMessage) addSystemMessage('Only the owner wallet can burn duplicate channels.');
				return { ok: false, error: 'Only the owner wallet can burn duplicate channels.' };
			}
			var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
			if (!senderAddress) {
				if (!suppressFailureMessage) addSystemMessage('Connect wallet to burn channel objects.');
				return { ok: false, error: 'Connect wallet to burn channel objects.' };
			}
			var state = getOfficialChannelState(cleanId);
			if (!state || !state.channelId || !state.memberCapId) {
				if (!suppressFailureMessage) addSystemMessage('Channel state is missing required on-chain identifiers.');
				return { ok: false, error: 'Channel state missing on-chain identifiers.' };
			}
			if (!state.creatorCapId) {
				if (!suppressFailureMessage) addSystemMessage('Channel cannot be burned without creator capability.');
				return { ok: false, error: 'Creator capability is required for burn.' };
			}
			var label = sanitizeSlug(channel.name || cleanId) || cleanId;
			if (!skipConfirm && !window.confirm('Burn #' + label + ' and remove its member objects? This cannot be undone.')) {
				return { ok: false, error: 'User cancelled burn confirmation.' };
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

				function buildBurnTx(includeMembershipRemoval) {
					var tx = new TxCtor();
					if (typeof tx.setSenderIfNotSet === 'function') {
						tx.setSenderIfNotSet(senderAddress);
					}
					if (typeof tx.setGasBudget === 'function') {
						tx.setGasBudget(100000000);
					}
					if (includeMembershipRemoval) {
						var memberAddressForRemoval = normalizeAddress(state.memberAddress || senderAddress || '');
						if (!state.encryptedKey) {
							tx.moveCall({
								target: getMessagingPackageId() + '::channel::add_encrypted_key',
								arguments: [
									tx.object(state.channelId),
									tx.object(state.memberCapId),
									tx.pure.vector('u8', [1]),
								],
							});
						}
						var clockArg = tx.object && typeof tx.object.clock === 'function'
							? tx.object.clock()
							: tx.object('0x6');
						tx.moveCall({
							target: getMessagingPackageId() + '::channel::remove_members',
							arguments: [
								tx.object(state.channelId),
								tx.object(state.memberCapId),
								tx.pure.vector('address', [memberAddressForRemoval]),
								clockArg,
							],
						});
					}
					tx.moveCall({
						target: getMessagingPackageId() + '::member_cap::transfer_to_recipient',
						arguments: [
							tx.object(state.memberCapId),
							tx.object(state.creatorCapId),
							tx.pure.address(burnAddress),
						],
					});
					return tx;
				}

				async function executeBurnTx(includeMembershipRemoval) {
					var raw = await signer.signAndExecuteTransaction({
						transaction: buildBurnTx(includeMembershipRemoval),
						options: {
							showEffects: true,
							showObjectChanges: true,
							showRawEffects: true,
						},
						forceSignBridge: true,
					});
					return unwrapTxResult(raw);
				}

				function extractStorageRebateMist(result) {
					var effects = result && result.effects ? result.effects : null;
					if (!effects || typeof effects !== 'object') return '';
					var gasUsed = effects.gasUsed || null;
					if (!gasUsed && effects.effects && typeof effects.effects === 'object') {
						gasUsed = effects.effects.gasUsed || null;
					}
					if (!gasUsed || typeof gasUsed !== 'object') return '';
					var rebate = gasUsed.storageRebate;
					if (rebate == null) rebate = gasUsed.storage_rebate;
					if (rebate == null) rebate = gasUsed.storageRebateMist;
					if (rebate == null) return '';
					return String(rebate);
				}

				function formatStorageRebate(rebateMist) {
					var asNum = Number(rebateMist);
					if (!isFinite(asNum) || asNum < 0) return '';
					var sui = asNum / 1000000000;
					if (sui >= 1) return sui.toFixed(4) + ' SUI';
					if (sui > 0) return sui.toFixed(6) + ' SUI';
					return '0 SUI';
				}

				var burnResult = null;
				var usedRebatePath = false;
				try {
					burnResult = await executeBurnTx(true);
					usedRebatePath = true;
				} catch (rebateError) {
					console.warn('Rebate burn path failed, falling back to transfer-only:', rebateError);
					burnResult = await executeBurnTx(false);
					usedRebatePath = false;
				}

				removeStoredChannelMeta(state.channelId);
				delete channelMessages[cleanId];
				var rebateMist = extractStorageRebateMist(burnResult);
				var rebateLabel = rebateMist ? formatStorageRebate(rebateMist) : '';
				var rebateSuffix = rebateLabel ? ' Storage rebate: ' + rebateLabel + '.' : '';
				if (usedRebatePath) {
					if (!suppressSuccessMessage) addSystemMessage('Burned #' + label + ' via membership-removal path.' + rebateSuffix);
				} else {
					if (!suppressSuccessMessage) addSystemMessage('Burned #' + label + ' via transfer-only fallback.' + rebateSuffix);
				}
				await loadChannels();
				return {
					ok: true,
					channelId: cleanId,
					channelLabel: label,
					usedRebatePath: usedRebatePath,
					fallbackUsed: !usedRebatePath,
					rebateMist: rebateMist,
				};
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				if (!suppressFailureMessage) addSystemMessage('Failed to burn #' + label + ': ' + errText);
				return {
					ok: false,
					channelId: cleanId,
					channelLabel: label,
					error: errText,
				};
			} finally {
				channelBurnPendingById[cleanId] = false;
				renderChannelList();
				applyComposerState();
			}
		}

		async function burnDuplicateChannels() {
			if (bulkBurnPending) return;
			if (!isConnectedServerOwner()) {
				addSystemMessage('Only the owner wallet can bulk-burn duplicate channels.');
				return;
			}
			addSystemMessage('Refreshing channel state...');
			await loadChannels();
			var burnable = getBulkBurnableChannelIds();
			if (!burnable.length) {
				addSystemMessage('No duplicate channels are eligible for bulk burn.');
				return;
			}

			var burnTargets = [];
			var skippedLabels = [];
			for (var i = 0; i < burnable.length; i++) {
				var cid = burnable[i];
				var state = getOfficialChannelState(cid);
				var channel = null;
				for (var j = 0; j < channels.length; j++) {
					if (channels[j] && channels[j].id === cid) { channel = channels[j]; break; }
				}
				var label = sanitizeSlug((channel && channel.name) || cid) || cid;
				if (!state || !state.channelId || !state.memberCapId || !state.creatorCapId) {
					skippedLabels.push('#' + label);
					continue;
				}
				burnTargets.push({ channelId: state.channelId, memberCapId: state.memberCapId, creatorCapId: state.creatorCapId, memberAddress: normalizeAddress(state.memberAddress || ''), encryptedKey: state.encryptedKey, label: label });
			}

			if (!burnTargets.length) {
				addSystemMessage('No duplicate channels have the required on-chain state for burn.');
				return;
			}
			if (!window.confirm('Burn ' + String(burnTargets.length) + ' duplicate channel' + (burnTargets.length > 1 ? 's' : '') + ' in a single transaction? This cannot be undone.')) {
				return;
			}

			bulkBurnPending = true;
			for (var bp = 0; bp < burnTargets.length; bp++) channelBurnPendingById[burnTargets[bp].channelId] = true;
			renderChannelList();

			try {
				var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
				if (!senderAddress) throw new Error('Connect wallet to burn channel objects.');
				await ensureOfficialMessagingClient();
				var txMod = await ensureOfficialSuiTransactionSdk();
				var TxCtor = txMod && (txMod.Transaction || txMod.TransactionBlock);
				if (!TxCtor) throw new Error('Sui transaction builder module is unavailable.');
				var signer = officialMessagingSigner || createOfficialMessagingSigner(senderAddress);
				var burnAddress = '0x0000000000000000000000000000000000000000000000000000000000000000';
				var pkgId = getMessagingPackageId();

				function buildBulkBurnTx(withMemberRemoval) {
					var tx = new TxCtor();
					if (typeof tx.setSenderIfNotSet === 'function') tx.setSenderIfNotSet(senderAddress);
					if (typeof tx.setGasBudget === 'function') tx.setGasBudget(200000000);
					for (var k = 0; k < burnTargets.length; k++) {
						var t = burnTargets[k];
						if (withMemberRemoval) {
							var memberAddr = t.memberAddress || senderAddress;
							if (!t.encryptedKey) {
								tx.moveCall({
									target: pkgId + '::channel::add_encrypted_key',
									arguments: [tx.object(t.channelId), tx.object(t.memberCapId), tx.pure.vector('u8', [1])],
								});
							}
							var clockArg = tx.object && typeof tx.object.clock === 'function' ? tx.object.clock() : tx.object('0x6');
							tx.moveCall({
								target: pkgId + '::channel::remove_members',
								arguments: [tx.object(t.channelId), tx.object(t.memberCapId), tx.pure.vector('address', [memberAddr]), clockArg],
							});
						}
						tx.moveCall({
							target: pkgId + '::member_cap::transfer_to_recipient',
							arguments: [tx.object(t.memberCapId), tx.object(t.creatorCapId), tx.pure.address(burnAddress)],
						});
					}
					return tx;
				}

				var burnResult = null;
				var usedRebatePath = false;
				try {
					burnResult = unwrapTxResult(await signer.signAndExecuteTransaction({
						transaction: buildBulkBurnTx(true),
						options: { showEffects: true, showObjectChanges: true, showRawEffects: true },
						forceSignBridge: true,
					}));
					usedRebatePath = true;
				} catch (rebateError) {
					console.warn('Bulk burn rebate path failed, falling back to transfer-only:', rebateError);
					burnResult = unwrapTxResult(await signer.signAndExecuteTransaction({
						transaction: buildBulkBurnTx(false),
						options: { showEffects: true, showObjectChanges: true, showRawEffects: true },
						forceSignBridge: true,
					}));
				}
				console.log('[bulk-burn] result:', burnResult);

				for (var r = 0; r < burnTargets.length; r++) {
					removeStoredChannelMeta(burnTargets[r].channelId);
					delete channelMessages[burnTargets[r].channelId];
				}

				var effects = burnResult && burnResult.effects ? burnResult.effects : null;
				var gasUsed = effects && effects.gasUsed ? effects.gasUsed : (effects && effects.effects && effects.effects.gasUsed ? effects.effects.gasUsed : null);
				var rebateMist = gasUsed ? Number(gasUsed.storageRebate || gasUsed.storage_rebate || gasUsed.storageRebateMist || 0) : 0;
				var rebateSui = rebateMist / 1000000000;
				var rebateText = rebateMist > 0 ? (' Storage rebate: ' + rebateSui.toFixed(rebateSui >= 1 ? 4 : 6) + ' SUI.') : '';
				var labels = [];
				for (var lb = 0; lb < burnTargets.length; lb++) labels.push('#' + burnTargets[lb].label);
				addSystemMessage('Burned ' + String(burnTargets.length) + ' duplicate channel' + (burnTargets.length > 1 ? 's' : '') + ' (' + labels.join(', ') + ').' + (usedRebatePath ? '' : ' (transfer-only fallback)') + rebateText);
				if (skippedLabels.length) addSystemMessage('Skipped (missing state): ' + skippedLabels.join(', ') + '.');
				await loadChannels();
			} catch (error) {
				var errText = String(error && error.message ? error.message : 'unknown error');
				addSystemMessage('Bulk burn failed: ' + errText);
			} finally {
				bulkBurnPending = false;
				for (var fp = 0; fp < burnTargets.length; fp++) channelBurnPendingById[burnTargets[fp].channelId] = false;
				renderChannelList();
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
			var channelLabel = targetChannelId || sanitizeSlug(activeChannel || '') || 'channel';
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
				var toAdd = [];
				for (var j = 0; j < linkedMembers.addresses.length; j++) {
					var candidate = normalizeAddress(linkedMembers.addresses[j]);
					if (!candidate || candidate === senderAddress || existing[candidate]) continue;
					toAdd.push(candidate);
				}
				if (!toAdd.length) {
					if (linkedMembers.linkedCount > 1) {
						addSystemMessage('Linked names are already synced for #' + channelLabel + '.');
					} else {
						addSystemMessage('No linked-member addresses found to add for #' + channelLabel + '.');
					}
					return;
				}
					await addMembersToOfficialChannel(activeState, senderAddress, toAdd, client);
					await loadMembersForActiveChannel();
					addSystemMessage('Synced linked member addresses into #' + channelLabel + '.');
			} catch (error) {
				addSystemMessage('Failed to sync linked members: ' + (error && error.message ? error.message : 'unknown error'));
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
			var memberCapId = String(state.memberCapId || '').trim();
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
							memberCapId: String(item.memberCapId || item.member_cap_id || '').trim(),
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
						forceSignBridge: true,
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
				var senderAddress = normalizeAddress(await ensureWalletSigningAddress());
				if (!senderAddress) {
					addSystemMessage('Reconnect wallet signer to remove members.');
					return;
				}
				var pendingKey = activeChannel + ':' + targetAddress;
				if (channelMemberRemovePendingByKey[pendingKey]) return;
				if (!window.confirm('Remove ' + (truncateAddress(targetAddress) || targetAddress) + ' from #' + (sanitizeSlug(channel.name || activeChannel) || activeChannel) + '?')) {
					return;
				}
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
							tx.pure.vector('address', [targetAddress]),
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
						forceSignBridge: true,
					});
					await loadMembersForActiveChannel();
					addSystemMessage('Removed member ' + (truncateAddress(targetAddress) || targetAddress) + ' from #' + (sanitizeSlug(channel.name || activeChannel) || activeChannel) + '.');
				} catch (error) {
					var errText = String(error && error.message ? error.message : 'unknown error');
					addSystemMessage('Failed to remove member: ' + errText);
				} finally {
					delete channelMemberRemovePendingByKey[pendingKey];
					renderMessages();
				}
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
				var channel = getActiveChannel();
				if (isOfficialChannel(channel) && !channel.encrypted && !isCanonicalPublicChannel(channel)) {
					throw new Error('Duplicate public channel detected. Burn this channel from the sidebar before sending.');
				}
				if (!isOfficialChannel(channel)) {
					var bootstrapName = sanitizeSlug((channel && channel.name) || activeChannel || '') || 'public';
					if (channel && channel.sdk === 'bootstrap') {
						if (!isConnectedServerOwner()) {
							throw new Error('This wallet is not a member of #' + bootstrapName + ' yet. Owner must create the channel or sync linked members.');
						}
						var createdFromBootstrap = await ensureDefaultPublicChannel();
						if (createdFromBootstrap) {
							await loadChannels();
							for (var i = 0; i < channels.length; i++) {
								var nextName = sanitizeSlug(channels[i] && channels[i].name ? channels[i].name : '');
								if (nextName === bootstrapName && !channels[i].encrypted) {
									activeChannel = channels[i].id;
									break;
								}
							}
							channel = getActiveChannel();
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
						throw new Error('Channel encryption key unavailable for this channel. Select another channel or recreate it once.')
					}
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
				if (isLocalSendErrorMessage(errText)) {
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

		function openPanel() {
			isOpen = true;
			panel.classList.add('open');
			backdrop.classList.add('open');
			bubble.style.display = 'none';
			if (document.body) document.body.classList.add('x402-chat-open');
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
			pollTimer = setInterval(pollChannelMessages, POLL_INTERVAL);
			applyComposerState();
			inputEl.focus();
		}

		function closePanel() {
			isOpen = false;
			panel.classList.remove('open');
			backdrop.classList.remove('open');
			bubble.style.display = 'flex';
			if (document.body) document.body.classList.remove('x402-chat-open');
			stopPolling();
		}

		function stopPolling() {
			if (!pollTimer) return;
			clearInterval(pollTimer);
			pollTimer = null;
		}

		bubble.addEventListener('click', openPanel);
		if (brandIconEl) {
			brandIconEl.addEventListener('click', function(event) {
				event.preventDefault();
				openBrandProfileOrConnect();
			});
		}
		if (burnDuplicatesBtn) {
			burnDuplicatesBtn.addEventListener('click', function(event) {
				event.preventDefault();
				event.stopPropagation();
				burnDuplicateChannels();
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
				}
			});

			channelListEl.addEventListener('click', function(event) {
				var target = event.target;
				if (!(target instanceof Element)) return;
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
			var item = target.closest('.x402-channel-item');
			if (!item) return;
			switchChannel(item.getAttribute('data-channel'));
		});

		var gearBtn = document.getElementById('x402-channel-gear-btn');
		var gearMenu = document.getElementById('x402-channel-gear-menu');
		var gearWrap = document.getElementById('x402-channel-gear-wrap');
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
			var gearSync = document.getElementById('x402-gear-sync');
			var gearRename = document.getElementById('x402-gear-rename');
			var gearPurge = document.getElementById('x402-gear-purge');
			if (gearSync) gearSync.addEventListener('click', function() {
				gearMenu.style.display = 'none';
				syncLinkedMembersToActiveChannel(activeChannel || '');
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
				closePanel();
			}
		});

		if (composerIdentityEl) {
			composerIdentityEl.addEventListener('click', function(event) {
				var target = event.target;
				if (!(target instanceof Element)) return;
				var toggle = target.closest('[data-action="toggle-author-picker"]');
				if (toggle) {
					event.preventDefault();
					isAuthorPickerOpen = !isAuthorPickerOpen;
					if (!isAuthorPickerOpen) senderNameFilter = '';
					renderComposerIdentity();
					if (isAuthorPickerOpen) {
						setTimeout(function() {
							var filterEl = document.getElementById('x402-author-filter');
							if (filterEl && typeof filterEl.focus === 'function') filterEl.focus();
						}, 0);
					}
					return;
				}
				var chip = target.closest('[data-author-name]');
				if (!chip) return;
				event.preventDefault();
				selectedSenderName = sanitizeSlug(normalizeName(chip.getAttribute('data-author-name') || ''));
				ensureSelectedSenderName();
				storeSenderName(normalizeAddress(getAddress()), selectedSenderName);
				isAuthorPickerOpen = false;
				senderNameFilter = '';
				renderComposerIdentity();
			});
			composerIdentityEl.addEventListener('input', function(event) {
				var target = event.target;
				if (!(target instanceof HTMLInputElement)) return;
				if (target.id !== 'x402-author-filter') return;
				senderNameFilter = String(target.value || '').trim().toLowerCase().slice(0, 48);
				renderComposerIdentity();
			});
		}

		window.addEventListener('mousedown', function(event) {
			if (!isAuthorPickerOpen || !composerIdentityEl) return;
			var target = event.target;
			if (target instanceof Element && composerIdentityEl.contains(target)) return;
			isAuthorPickerOpen = false;
			senderNameFilter = '';
			renderComposerIdentity();
		});

		if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.$connection) {
			SuiWalletKit.subscribe(SuiWalletKit.$connection, function() {
				var nextAddress = normalizeAddress(getAddress());
					if (nextAddress !== officialMessagingAddress) {
						officialMessagingClient = null;
						officialMessagingSigner = null;
						officialMessagingAddress = '';
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
							defaultPublicChannelAutoCreateByOwner = {};
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
