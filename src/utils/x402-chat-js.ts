export interface X402ChatConfig {
	page: 'profile' | 'landing' | 'register'
	name?: string
	address?: string
	ownerAddress?: string
	expirationMs?: number
	linkedNames?: number
	network?: string
}

export function generateX402ChatJs(config: X402ChatConfig): string {
	return `
	(function() {
		var CONFIG = ${JSON.stringify(config)};
		var API_BASE = '/api/app/messages';
		var POLL_INTERVAL = 5000;
		var activeChannel = 'general';
		var channels = [];
		var channelMessages = {};
		var isOpen = false;
		var isSending = false;
		var pollTimer = null;
		var mutedState = { server: false, channel: false };
		var server = {
			id: '',
			name: 'sui-ski',
			displayName: 'sui.ski',
			ownerAddress: null,
			isModerator: false,
		};
		var moderation = { serverMuted: [], channelMuted: {} };

		function getAddress() {
			if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.$connection) {
				var conn = SuiWalletKit.$connection.value;
				if (conn && conn.address) return conn.address;
			}
			return null;
		}

		function getPrimaryName() {
			if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.$connection) {
				var conn = SuiWalletKit.$connection.value;
				if (conn && conn.primaryName) return conn.primaryName;
			}
			return null;
		}

		function normalizeAddress(value) {
			return String(value || '').trim().toLowerCase();
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

		function getServerQuery() {
			var params = [];
			if (CONFIG.name) params.push('name=' + encodeURIComponent(CONFIG.name));
			if (CONFIG.ownerAddress) params.push('owner=' + encodeURIComponent(CONFIG.ownerAddress));
			if (!params.length) return '';
			return '?' + params.join('&');
		}

		function buildApiUrl(path) {
			var query = getServerQuery();
			if (!query) return API_BASE + path;
			if (path.indexOf('?') !== -1) return API_BASE + path + '&' + query.slice(1);
			return API_BASE + path + query;
		}

		function getActiveChannel() {
			for (var i = 0; i < channels.length; i++) {
				if (channels[i].id === activeChannel) return channels[i];
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

		var root = document.getElementById('x402-chat-root');
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
			+ '<span class="x402-signal-avatar"></span>'
			+ '<div><div class="x402-server-title" id="x402-server-title">Secure Chat</div><div class="x402-server-meta" id="x402-server-meta">Wallet-based messaging</div></div>'
			+ '</div>'
			+ '<div class="x402-header-actions">'
			+ '<button class="x402-header-btn" id="x402-add-channel-btn" title="Add channel" style="display:none">+</button>'
			+ '<button class="x402-header-btn" id="x402-close-btn" title="Close">&times;</button>'
			+ '</div>'
			+ '</div>'
			+ '<div class="x402-layout">'
			+ '<aside class="x402-sidebar">'
			+ '<div class="x402-sidebar-title">Channels</div>'
			+ '<div id="x402-channel-list"></div>'
			+ '</aside>'
			+ '<section class="x402-thread">'
			+ '<div class="x402-thread-head">'
			+ '<div class="x402-thread-name" id="x402-channel-name">#general</div>'
			+ '<div class="x402-thread-state" id="x402-thread-state"></div>'
			+ '</div>'
			+ '<div class="x402-messages" id="x402-messages"></div>'
			+ '<div class="x402-input-area">'
			+ '<textarea class="x402-input" id="x402-input" placeholder="Type a message..." rows="1"></textarea>'
			+ '<button class="x402-send-btn" id="x402-send-btn" disabled>'
			+ '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
			+ '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
			+ '</button>'
			+ '</div>'
			+ '</section>'
			+ '</div>'
			+ '</div>';

		var bubble = document.getElementById('x402-chat-bubble');
		var backdrop = document.getElementById('x402-chat-backdrop');
		var panel = document.getElementById('x402-chat-panel');
		var closeBtn = document.getElementById('x402-close-btn');
		var addChannelBtn = document.getElementById('x402-add-channel-btn');
		var messagesEl = document.getElementById('x402-messages');
		var inputEl = document.getElementById('x402-input');
		var sendBtn = document.getElementById('x402-send-btn');
		var channelNameEl = document.getElementById('x402-channel-name');
		var channelListEl = document.getElementById('x402-channel-list');
		var threadStateEl = document.getElementById('x402-thread-state');
		var serverTitleEl = document.getElementById('x402-server-title');
		var serverMetaEl = document.getElementById('x402-server-meta');

		function setThreadState(text, warn) {
			threadStateEl.textContent = text || '';
			threadStateEl.classList.toggle('warn', !!warn);
		}

		function applyComposerState() {
			var hasInput = !!String(inputEl.value || '').trim();
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
			serverTitleEl.textContent = server.displayName || 'Secure Chat';
			var ownerLabel = server.ownerAddress ? truncateAddress(server.ownerAddress) : 'No moderator assigned';
			serverMetaEl.textContent = server.isModerator
				? 'You are the moderator · ' + ownerLabel
				: 'Moderator ' + ownerLabel;
			addChannelBtn.style.display = server.isModerator ? 'inline-flex' : 'none';
		}

		function renderChannelList() {
			if (!channels.length) {
				channelListEl.innerHTML = '<div class="x402-sidebar-empty">No channels</div>';
				return;
			}
			var html = '';
			for (var i = 0; i < channels.length; i++) {
				var channel = channels[i];
				var isActive = channel.id === activeChannel;
				var icon = channel.encrypted ? '🔒' : '#';
				html += '<div class="x402-channel-item' + (isActive ? ' active' : '') + '" data-channel="' + escapeHtml(channel.id) + '">'
					+ '<span class="x402-channel-main">'
					+ '<span class="x402-channel-icon">' + icon + '</span>'
					+ '<span class="x402-channel-name">' + escapeHtml(channel.name) + '</span>'
					+ '</span>';
				if (server.isModerator && !channel.protected) {
					html += '<button class="x402-channel-delete" data-action="delete-channel" data-channel="' + escapeHtml(channel.id) + '" title="Delete channel">Del</button>';
				}
				html += '</div>';
			}
			channelListEl.innerHTML = html;
		}

		function ensureActiveChannel() {
			if (!channels.length) {
				activeChannel = '';
				return;
			}
			for (var i = 0; i < channels.length; i++) {
				if (channels[i].id === activeChannel) return;
			}
			var preferred = sanitizeSlug(CONFIG.name || '');
			if (preferred) {
				for (var j = 0; j < channels.length; j++) {
					if (channels[j].id === preferred) {
						activeChannel = preferred;
						return;
					}
				}
			}
			activeChannel = channels[0].id;
		}

		function renderMessages() {
			var channel = getActiveChannel();
			channelNameEl.textContent = (channel && channel.encrypted ? '🔒 ' : '#') + (channel ? channel.name : activeChannel || 'channel');

			var messages = channelMessages[activeChannel] || [];
			if (!messages.length) {
				messagesEl.innerHTML = '<div class="x402-msg system">No messages yet. Start the conversation.</div>';
				return;
			}

			var currentAddress = normalizeAddress(getAddress());
			var html = '';
			for (var i = 0; i < messages.length; i++) {
				var message = messages[i];
				var isSystem = message.role === 'system';
				if (isSystem) {
					html += '<div class="x402-msg system">' + escapeHtml(message.content || '') + '</div>';
					continue;
				}

				var sender = normalizeAddress(message.sender);
				var isMine = !!sender && sender === currentAddress;
				var msgClass = isMine ? 'user' : 'peer';
				var displayName = message.senderName || truncateAddress(message.sender) || 'Unknown';
				var timeText = formatTime(message.timestamp);
				html += '<div class="x402-msg ' + msgClass + '">'
					+ '<div class="x402-msg-head">'
					+ '<span class="x402-msg-sender">' + escapeHtml(displayName) + '</span>'
					+ '<span class="x402-msg-time">' + escapeHtml(timeText) + '</span>'
					+ '</div>'
					+ '<div>' + escapeHtml(message.content || '').replace(/\n/g, '<br>') + '</div>';

				if (server.isModerator && !isMine && sender) {
					var serverMuted = isAddressMuted(sender, 'server');
					var channelMuted = isAddressMuted(sender, 'channel');
					html += '<div class="x402-msg-actions">'
						+ '<button class="x402-msg-action" data-action="toggle-channel-mute" data-sender="' + escapeHtml(sender) + '" data-muted="' + (channelMuted ? '1' : '0') + '">' + (channelMuted ? 'Unmute channel' : 'Mute channel') + '</button>'
						+ '<button class="x402-msg-action" data-action="toggle-server-mute" data-sender="' + escapeHtml(sender) + '" data-muted="' + (serverMuted ? '1' : '0') + '">' + (serverMuted ? 'Unmute server' : 'Mute server') + '</button>';
					if (message.id) {
						html += '<button class="x402-msg-action danger" data-action="delete-message" data-message-id="' + escapeHtml(message.id) + '">Delete</button>';
					}
					html += '</div>';
				}

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

		async function loadChannels() {
			try {
					var resp = await fetch(buildApiUrl('/server'), { credentials: 'include' });
				if (!resp.ok) return;
				var data = await resp.json();
				channels = Array.isArray(data.channels) ? data.channels : [];
				server = data.server || server;
				moderation = data.moderation || { serverMuted: [], channelMuted: {} };
				ensureActiveChannel();
				renderServerHeader();
				renderChannelList();
				renderMessages();
				if (activeChannel) await pollChannelMessages();
			} catch (_e) {}
		}

		async function pollChannelMessages() {
			if (!isOpen || !activeChannel) return;
			try {
					var resp = await fetch(buildApiUrl('/server/channels/' + encodeURIComponent(activeChannel) + '/messages'), {
					credentials: 'include',
				});
				if (!resp.ok) return;
				var data = await resp.json();
				channelMessages[activeChannel] = Array.isArray(data.messages) ? data.messages : [];
				mutedState = data.muted || { server: false, channel: false };
				renderMessages();
				applyComposerState();
			} catch (_e) {}
		}

		function switchChannel(channelId) {
			if (!channelId || channelId === activeChannel) return;
			activeChannel = channelId;
			if (!channelMessages[activeChannel]) channelMessages[activeChannel] = [];
			renderChannelList();
			renderMessages();
			pollChannelMessages();
		}

		async function createChannel() {
			if (!server.isModerator) return;
			var rawName = window.prompt('New channel name');
			if (!rawName) return;
			var name = sanitizeSlug(rawName);
			if (!name) return;
			var encrypted = window.confirm('Encrypt this channel?');
			try {
					var resp = await fetch(buildApiUrl('/server/channels'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ name: name, encrypted: encrypted }),
				});
				if (!resp.ok) {
					var err = await resp.json().catch(function() { return {}; });
					addSystemMessage(err.error || 'Failed to create channel');
					return;
				}
				await loadChannels();
				switchChannel(name);
			} catch (_e) {
				addSystemMessage('Failed to create channel');
			}
		}

		async function deleteChannel(channelId) {
			if (!server.isModerator || !channelId) return;
			if (!window.confirm('Delete #' + channelId + '?')) return;
			try {
					var resp = await fetch(buildApiUrl('/server/channels/' + encodeURIComponent(channelId)), {
					method: 'DELETE',
					credentials: 'include',
				});
				if (!resp.ok) {
					var err = await resp.json().catch(function() { return {}; });
					addSystemMessage(err.error || 'Failed to delete channel');
					return;
				}
				if (activeChannel === channelId) activeChannel = 'general';
				await loadChannels();
			} catch (_e) {
				addSystemMessage('Failed to delete channel');
			}
		}

		async function toggleMute(sender, scope, currentlyMuted) {
			if (!server.isModerator || !sender) return;
			try {
					var resp = await fetch(buildApiUrl('/server/channels/' + encodeURIComponent(activeChannel) + '/mute'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						targetAddress: sender,
						scope: scope,
						muted: !currentlyMuted,
					}),
				});
				if (!resp.ok) {
					var err = await resp.json().catch(function() { return {}; });
					addSystemMessage(err.error || 'Failed to update mute');
					return;
				}
				await loadChannels();
				await pollChannelMessages();
			} catch (_e) {
				addSystemMessage('Failed to update mute');
			}
		}

		async function deleteMessage(messageId) {
			if (!messageId) return;
			try {
					var resp = await fetch(buildApiUrl('/server/channels/' + encodeURIComponent(activeChannel) + '/messages/' + encodeURIComponent(messageId)), {
					method: 'DELETE',
					credentials: 'include',
				});
				if (!resp.ok) {
					var err = await resp.json().catch(function() { return {}; });
					addSystemMessage(err.error || 'Failed to delete message');
					return;
				}
				await pollChannelMessages();
			} catch (_e) {
				addSystemMessage('Failed to delete message');
			}
		}

		async function send() {
			var text = String(inputEl.value || '').trim();
			if (!text || isSending || mutedState.server || mutedState.channel) return;
			if (!getAddress()) {
				addSystemMessage('Connect wallet to send a message.');
				return;
			}

			isSending = true;
			applyComposerState();

			try {
				var senderName = getPrimaryName();
					var resp = await fetch(buildApiUrl('/server/channels/' + encodeURIComponent(activeChannel) + '/messages'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({
						content: text,
						senderName: senderName,
						encrypted: !!(getActiveChannel() && getActiveChannel().encrypted),
					}),
				});

				if (!resp.ok) {
					var err = await resp.json().catch(function() { return {}; });
					if (err && err.code === 'MUTED') {
						mutedState.server = err.scope === 'server';
						mutedState.channel = err.scope === 'channel';
					}
					addSystemMessage(err.error || 'Failed to send message');
					return;
				}

				var data = await resp.json();
				if (!channelMessages[activeChannel]) channelMessages[activeChannel] = [];
				channelMessages[activeChannel].push(data.message);
				inputEl.value = '';
				inputEl.style.height = 'auto';
				renderMessages();
			} catch (err) {
				addSystemMessage('Network error: ' + (err && err.message ? err.message : 'Connection failed'));
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
			loadChannels();
			stopPolling();
			pollTimer = setInterval(pollChannelMessages, POLL_INTERVAL);
			inputEl.focus();
		}

		function closePanel() {
			isOpen = false;
			panel.classList.remove('open');
			backdrop.classList.remove('open');
			bubble.style.display = 'flex';
			stopPolling();
		}

		function stopPolling() {
			if (!pollTimer) return;
			clearInterval(pollTimer);
			pollTimer = null;
		}

		bubble.addEventListener('click', openPanel);
		closeBtn.addEventListener('click', closePanel);
		backdrop.addEventListener('click', closePanel);
		addChannelBtn.addEventListener('click', createChannel);
		sendBtn.addEventListener('click', send);

		channelListEl.addEventListener('click', function(event) {
			var target = event.target;
			if (!(target instanceof Element)) return;
			var actionEl = target.closest('[data-action]');
			if (actionEl && actionEl.getAttribute('data-action') === 'delete-channel') {
				event.preventDefault();
				deleteChannel(actionEl.getAttribute('data-channel'));
				return;
			}
			var item = target.closest('.x402-channel-item');
			if (!item) return;
			switchChannel(item.getAttribute('data-channel'));
		});

		messagesEl.addEventListener('click', function(event) {
			var target = event.target;
			if (!(target instanceof Element)) return;
			var actionEl = target.closest('[data-action]');
			if (!actionEl) return;
			var action = actionEl.getAttribute('data-action');
			if (action === 'delete-message') {
				deleteMessage(actionEl.getAttribute('data-message-id'));
				return;
			}
			if (action === 'toggle-channel-mute' || action === 'toggle-server-mute') {
				var sender = actionEl.getAttribute('data-sender');
				var muted = actionEl.getAttribute('data-muted') === '1';
				toggleMute(sender, action === 'toggle-server-mute' ? 'server' : 'channel', muted);
			}
		});

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

		if (typeof SuiWalletKit !== 'undefined' && SuiWalletKit.$connection) {
			SuiWalletKit.subscribe(SuiWalletKit.$connection, function() {
				if (isOpen) {
					loadChannels();
				}
			});
		}
	})();
	`
}
