interface SharedWalletSession {
	address: string | null
	walletName: string | null
	verified: boolean
}

interface SharedWalletMountOptions {
	network: string
	session?: SharedWalletSession
	onConnect: string
	onDisconnect: string
	modalId?: string
	widgetId?: string
	profileButtonId?: string
	profileFallbackHref?: string
	autoResolvePrimaryName?: boolean
	autoReconnect?: boolean
}

function serializeJs(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')
}

export function generateSharedWalletMountJs(options: SharedWalletMountOptions): string {
	const config = {
		network: options.network || 'mainnet',
		onConnect: options.onConnect,
		onDisconnect: options.onDisconnect,
		modalId: options.modalId || 'wk-modal',
		widgetId: options.widgetId || 'wk-widget',
		profileButtonId: options.profileButtonId || null,
		profileFallbackHref: options.profileFallbackHref || 'https://sui.ski',
		autoResolvePrimaryName: options.autoResolvePrimaryName !== false,
		autoReconnect: options.autoReconnect !== false,
		session: options.session?.address
			? {
					address: options.session.address,
					walletName: options.session.walletName,
					verified: options.session.verified,
				}
			: null,
	}

	return `;(function() {
		var config = ${serializeJs(config)}
		var walletKit = window.SuiWalletKit
		if (!walletKit && typeof SuiWalletKit !== 'undefined') {
			walletKit = SuiWalletKit
		}
		if (!walletKit) return
		if (config.session && config.session.address && typeof window.initSessionFromServer === 'function') {
			window.initSessionFromServer(config.session)
		}

		var wrapHandler = function(name, handler) {
			if (!name) return
			var current = window[name]
			var userHandler = null
			if (typeof current === 'function') {
				userHandler = current.__suiSkiUserHandler || current
			}
			var wrapped = function() {
				handler()
				if (typeof userHandler === 'function') {
					return userHandler.apply(this, arguments)
				}
				return undefined
			}
			wrapped.__suiSkiUserHandler = userHandler
			window[name] = wrapped
		}

		var profileBtn = config.profileButtonId ? document.getElementById(config.profileButtonId) : null
		var rpcClient = null
		var resolvingForAddress = ''
		var rpcUrls = {
			mainnet: 'https://fullnode.mainnet.sui.io:443',
			testnet: 'https://fullnode.testnet.sui.io:443',
			devnet: 'https://fullnode.devnet.sui.io:443',
		}
		var getClient = function() {
			if (rpcClient) return rpcClient
			if (typeof window.SuiJsonRpcClient !== 'function') return null
			var url = rpcUrls[config.network] || rpcUrls.mainnet
			rpcClient = new window.SuiJsonRpcClient({ url: url })
			return rpcClient
		}

		var getProfileHref = function() {
			var conn = walletKit.$connection.value
			if (conn && conn.primaryName) {
				return 'https://' + encodeURIComponent(conn.primaryName) + '.sui.ski'
			}
			return config.profileFallbackHref
		}

		var updateProfileButton = function() {
			if (!profileBtn) return
			var conn = walletKit.$connection.value
			var href = getProfileHref()
			profileBtn.dataset.href = href
			profileBtn.title = conn && conn.primaryName
				? 'View my primary profile'
				: 'Go to sui.ski'
		}

		if (profileBtn && profileBtn.dataset.walletSharedBound !== '1') {
			profileBtn.dataset.walletSharedBound = '1'
			profileBtn.addEventListener('click', function(event) {
				event.stopPropagation()
				window.location.href = profileBtn.dataset.href || config.profileFallbackHref
			})
		}

		var resolvePrimaryName = function() {
			if (!config.autoResolvePrimaryName) return
			var conn = walletKit.$connection.value
			if (!conn || !conn.address) return
			if (conn.primaryName) {
				updateProfileButton()
				return
			}
			if (resolvingForAddress === conn.address) return
			var client = getClient()
			if (!client) return
			resolvingForAddress = conn.address
			client.resolveNameServiceNames({ address: conn.address }).then(function(result) {
				var name = result && result.data && result.data[0]
				if (!name) return
				walletKit.setPrimaryName(String(name).replace(/\\.sui$/i, ''))
				updateProfileButton()
			}).catch(function() {}).finally(function() {
				resolvingForAddress = ''
			})
		}

		wrapHandler(config.onConnect, function() {
		updateProfileButton()
		resolvePrimaryName()
		if (typeof walletKit.subscribe === 'function' && walletKit.$connection) {
			walletKit.subscribe(walletKit.$connection, function() {
				updateProfileButton()
				resolvePrimaryName()
			})
		}
			resolvePrimaryName()
		})
		wrapHandler(config.onDisconnect, function() {
			updateProfileButton()
		})

		try {
			walletKit.renderModal(config.modalId)
		} catch (_) {}
			try {
				walletKit.renderWidget(config.widgetId)
			} catch (_) {}
			updateProfileButton()

			if (config.autoReconnect) {
				walletKit.detectWallets().then(function() {
					return walletKit.autoReconnect()
				}).catch(function() {})
			}
	})()`
}
