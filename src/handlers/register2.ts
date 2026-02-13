import type { Env } from '../types'
import { generateLogoSvg } from '../utils/og-image'
import { jsonResponse } from '../utils/response'
import { generateSharedWalletMountJs } from '../utils/shared-wallet-js'
import { relaySignedTransaction } from '../utils/transactions'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'
import { registerStyles } from './register2.css'

const SUI_ICON_PATH =
	'M240.057 159.914C255.698 179.553 265.052 204.39 265.052 231.407C265.052 258.424 255.414 284.019 239.362 303.768L237.971 305.475L237.608 303.31C237.292 301.477 236.929 299.613 236.502 297.749C228.46 262.421 202.265 232.134 159.148 207.597C130.029 191.071 113.361 171.195 108.985 148.586C106.157 133.972 108.258 119.294 112.318 106.717C116.379 94.1569 122.414 83.6187 127.549 77.2831L144.328 56.7754C147.267 53.1731 152.781 53.1731 155.719 56.7754L240.073 159.914H240.057ZM266.584 139.422L154.155 1.96703C152.007-0.655678 147.993-0.655678 145.845 1.96703L33.4316 139.422L33.0683 139.881C12.3868 165.555 0 198.181 0 233.698C0 316.408 67.1635 383.461 150 383.461C232.837 383.461 300 316.408 300 233.698C300 198.181 287.613 165.555 266.932 139.896L266.568 139.438L266.584 139.422ZM60.3381 159.472L70.3866 147.164L70.6868 149.439C70.9237 151.24 71.2239 153.041 71.5715 154.858C78.0809 189.001 101.322 217.456 140.173 239.496C173.952 258.724 193.622 280.828 199.278 305.064C201.648 315.176 202.059 325.129 201.032 333.835L200.969 334.372L200.479 334.609C185.233 342.05 168.09 346.237 149.984 346.237C86.4546 346.237 34.9484 294.826 34.9484 231.391C34.9484 204.153 44.4439 179.142 60.3065 159.44L60.3381 159.472Z'
const SUI_ICON_SVG = `<svg class="sui-icon" viewBox="0 0 300 384" fill="#4da2ff"><path fill-rule="evenodd" clip-rule="evenodd" d="${SUI_ICON_PATH}"/></svg>`

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

interface RegisterSession {
	address: string | null
	walletName: string | null
	verified: boolean
}

export function generateRegistrationPage(
	name: string,
	env: Env,
	session?: RegisterSession,
): string {
	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const network = env.SUI_NETWORK || 'mainnet'
	const isRegisterable = cleanName.length >= 3
	const serializeJson = (value: unknown) =>
		JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')
	const registrationCardHtml = isRegisterable
		? `<section class="card register-card">
			<div class="header">
				<h1 class="name-heading">
					<span class="name-title">${escapeHtml(cleanName)}<span class="name-tld">.sui</span></span>
					<button type="button" class="primary-star" id="primary-star" aria-label="Set ${escapeHtml(cleanName)}.sui as primary name" aria-pressed="false" title="Set as primary name">☆</button>
				</h1>
				<p class="subtitle">
					<span class="availability-pill">
						<span class="availability-dot" aria-hidden="true"></span>
						<span class="availability-label">Available</span>
					</span>
				</p>
			</div>
			<div class="top-row">
				<div>
					<div class="price" id="price-value">-- <span class="price-unit">${SUI_ICON_SVG}</span> <span class="price-usd">/ $-- est.</span></div>
					<div class="price-note" id="price-note">Loading pricing...</div>
				</div>
			</div>
			<div class="form">
				<div class="field">
					<label for="years">Duration</label>
					<div class="year-stepper" role="group" aria-label="Registration duration">
						<button type="button" class="year-btn" id="years-decrease" aria-label="Decrease duration">-</button>
						<div class="year-display"><span id="years-value">1</span> year</div>
						<button type="button" class="year-btn" id="years-increase" aria-label="Increase duration">+</button>
					</div>
					<input id="years" type="hidden" value="1">
				</div>
				<div class="field">
					<label for="target">Recipient (optional)</label>
					<input id="target" type="text" placeholder="0x... or name.sui">
				</div>
				<button class="button" id="register-btn">Connect Wallet</button>
				<div class="status" id="register-status"></div>
			</div>
		</section>`
		: `<section class="card"><div class="header"><h1>${escapeHtml(cleanName)}<span>.sui</span></h1><p class="subtitle">Minimum length is 3 characters.</p></div></section>`

	const nftPreviewHtml = ''
	const discoveryColumnHtml = isRegisterable
		? `<aside class="side-column">
			<section class="side-card better-search-card">
				<div class="panel-head">
					<div class="panel-title">Better Search</div>
					<a class="x402-link" id="x402-link" href="https://www.tradeport.xyz/sui/collection/suins?search=x402" target="_blank" rel="noopener noreferrer">View</a>
				</div>
				<div class="x402-row">
					<div class="x402-name">x402.sui</div>
					<div class="x402-price" id="x402-price">Loading...</div>
				</div>
			</section>
			<section class="side-card suggestions-card">
				<div class="suggestions-head">
					<div class="suggestions-title">Related Names</div>
					<button type="button" class="refresh-btn" id="refresh-suggestions">Refresh</button>
				</div>
				<div class="suggestions-grid" id="suggestions-grid">
					<div class="empty">Loading suggestions...</div>
				</div>
			</section>
		</aside>`
		: ''

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(cleanName)}.sui available | sui.ski</title>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
			${registerStyles}
			${generateWalletUiCss()}
		</style>
</head>
<body>
	<canvas class="snow-canvas" id="snow-canvas"></canvas>
	<div id="wk-modal"></div>
	<div class="wallet-widget" id="wallet-widget">
		<button class="wallet-profile-btn" id="wallet-profile-btn" title="Go to sui.ski" aria-label="Open wallet profile">
			${generateLogoSvg(18)}
		</button>
		<div id="wk-widget"></div>
	</div>

	<div class="container">
			<nav class="nav">
				<a class="nav-home" href="https://sui.ski">${generateLogoSvg(22)} sui.ski</a>
				<div class="nav-meta">
					<span class="badge">⛷ ski</span>
				</div>
			</nav>

		<div class="layout-grid">
			<div class="main-column">
				${registrationCardHtml}
				${nftPreviewHtml}
			</div>
			${discoveryColumnHtml}
		</div>
	</div>

	<div class="tracker-footer">
		<span class="tracker-line">
			<span class="tracker-price-label">${SUI_ICON_SVG} <span id="sui-price">$--</span></span>
			<span class="tracker-sep">·</span>
			<span class="tracker-built-on">
				Built on
				<a href="https://docs.sui.io" target="_blank" rel="noopener">Sui</a>
				<span class="tracker-sep">·</span>
				<a href="https://docs.suins.io" target="_blank" rel="noopener">SuiNS</a>
				<span class="tracker-sep">·</span>
				<a href="https://moveregistry.com/docs" target="_blank" rel="noopener">MVR</a>
				<span class="tracker-sep">·</span>
				<a href="https://docs.sui.io/standards/deepbook" target="_blank" rel="noopener">DeepBook</a>
				<span class="tracker-sep">·</span>
				<a href="https://docs.wal.app" target="_blank" rel="noopener">Walrus</a>
				<span class="tracker-sep">·</span>
				<a href="https://seal-docs.wal.app" target="_blank" rel="noopener">Seal</a>
			</span>
		</span>
	</div>

	<script type="module">
		let SuiJsonRpcClient, Transaction, SuinsClient, SuinsTransaction
		{
			const pickExport = (mod, name) => {
				if (!mod || typeof mod !== 'object') return undefined
				if (name in mod) return mod[name]
				if (mod.default && typeof mod.default === 'object' && name in mod.default) return mod.default[name]
				return undefined
			}
			const SDK_TIMEOUT = 15000
			const timedImport = (url) => Promise.race([
				import(url),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: ' + url)), SDK_TIMEOUT)),
			])
			const results = await Promise.allSettled([
				timedImport('https://esm.sh/@wallet-standard/app@1.1.0'),
				timedImport('https://esm.sh/@mysten/sui@2.2.0/jsonRpc?bundle'),
				timedImport('https://esm.sh/@mysten/sui@2.2.0/transactions?bundle'),
				timedImport('https://esm.sh/@mysten/suins@1.0.0?bundle'),
			])
			if (results[1].status === 'fulfilled') ({ SuiJsonRpcClient } = results[1].value)
			if (results[2].status === 'fulfilled') ({ Transaction } = results[2].value)
			if (results[3].status === 'fulfilled') {
				const suinsModule = results[3].value
				SuinsClient = pickExport(suinsModule, 'SuinsClient')
				SuinsTransaction = pickExport(suinsModule, 'SuinsTransaction')
			}
		}
		if (typeof SuiJsonRpcClient === 'function' && typeof window !== 'undefined') {
			window.SuiJsonRpcClient = SuiJsonRpcClient
		}

		${generateWalletSessionJs()}
		${generateWalletKitJs({ network: env.SUI_NETWORK, autoConnect: true })}
		${generateWalletTxJs()}
		${generateWalletUiJs({ showPrimaryName: true, onConnect: 'onRegisterWalletConnected', onDisconnect: 'onRegisterWalletDisconnected' })}

		const NAME = ${serializeJson(cleanName)}
		const NETWORK = ${serializeJson(network)}
		const IS_REGISTERABLE = ${isRegisterable ? 'true' : 'false'}

		const yearsEl = document.getElementById('years')
		const yearsValueEl = document.getElementById('years-value')
		const yearsDecreaseBtn = document.getElementById('years-decrease')
		const yearsIncreaseBtn = document.getElementById('years-increase')
		const targetEl = document.getElementById('target')
		const primaryStarEl = document.getElementById('primary-star')
		const registerBtn = document.getElementById('register-btn')
		const registerStatus = document.getElementById('register-status')
		const priceValue = document.getElementById('price-value')
		const priceNote = document.getElementById('price-note')
		const suiPriceEl = document.getElementById('sui-price')
		const x402PriceEl = document.getElementById('x402-price')
		const x402LinkEl = document.getElementById('x402-link')
		const suggestionsGrid = document.getElementById('suggestions-grid')
		const refreshSuggestionsBtn = document.getElementById('refresh-suggestions')

		let pricingData = null
		let wantsPrimaryName = false
		let primaryStarManualOverride = null
		let primaryStarAddress = ''
		let primaryStarSyncNonce = 0
		const MIN_YEARS = 1
		const MAX_YEARS = 5
		const RPC_URLS = {
			mainnet: 'https://fullnode.mainnet.sui.io:443',
			testnet: 'https://fullnode.testnet.sui.io:443',
			devnet: 'https://fullnode.devnet.sui.io:443',
		}

		var SUI_ICON = '<svg class="sui-icon" viewBox="0 0 300 384" fill="#4da2ff"><path fill-rule="evenodd" clip-rule="evenodd" d="${SUI_ICON_PATH}"/></svg>'
		var SUI_UNIT = '<span class="price-unit">' + SUI_ICON + '</span>'

		function formatPrimaryPriceHtml(sui) {
			if (!Number.isFinite(sui) || sui <= 0) return '-- ' + SUI_UNIT
			const whole = Math.trunc(sui)
			const fraction = sui - whole
			if (fraction > 0.95) {
				return String(whole + 1) + SUI_UNIT
			}
			const decimals = Math.floor(fraction * 100)
			if (decimals < 5) {
				return String(whole) + SUI_UNIT
			}
			const decimalsText = String(decimals).padStart(2, '0')
			const normalizedDecimals = decimalsText.endsWith('0') ? decimalsText.slice(0, 1) : decimalsText
			return String(whole) + '<span class="price-decimals">.' + normalizedDecimals + '</span>' + SUI_UNIT
		}

		function formatUsdAmount(usdValue) {
			if (!Number.isFinite(usdValue) || usdValue <= 0) return null
			return new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			}).format(usdValue)
		}

		function updatePrimaryStarUi() {
			if (!primaryStarEl) return
			primaryStarEl.classList.toggle('active', wantsPrimaryName)
			primaryStarEl.textContent = wantsPrimaryName ? '★' : '☆'
			primaryStarEl.setAttribute('aria-pressed', wantsPrimaryName ? 'true' : 'false')
		}

		function showStatus(message, type = 'info', html = false) {
			if (!registerStatus) return
			registerStatus.className = 'status show ' + type
			if (html) registerStatus.innerHTML = message
			else registerStatus.textContent = message
		}

		function hideStatus() {
			if (!registerStatus) return
			registerStatus.className = 'status'
			registerStatus.textContent = ''
		}

		function getSelectedYears() {
			const years = Number(yearsEl && yearsEl.value ? yearsEl.value : '1')
			if (!Number.isFinite(years)) return MIN_YEARS
			return Math.min(MAX_YEARS, Math.max(MIN_YEARS, Math.floor(years)))
		}

		function setSelectedYears(nextYears) {
			const normalized = Math.min(MAX_YEARS, Math.max(MIN_YEARS, Math.floor(Number(nextYears) || MIN_YEARS)))
			if (yearsEl) yearsEl.value = String(normalized)
			if (yearsValueEl) yearsValueEl.textContent = String(normalized)
			if (yearsDecreaseBtn) yearsDecreaseBtn.disabled = normalized <= MIN_YEARS
			if (yearsIncreaseBtn) yearsIncreaseBtn.disabled = normalized >= MAX_YEARS
		}

		function getConnectedAddress() {
			const conn = SuiWalletKit.$connection.value
			if (!conn) return null
			if (conn.status !== 'connected' && conn.status !== 'session') return null
			return conn.address || null
		}

		function getConnectedPrimaryName() {
			const conn = SuiWalletKit.$connection.value
			if (!conn) return null
			if (conn.status !== 'connected' && conn.status !== 'session') return null
			if (!conn.primaryName || typeof conn.primaryName !== 'string') return null
			const normalized = conn.primaryName.trim().replace(/\\.sui$/i, '')
			return normalized || null
		}

		function getRpcUrlForNetwork() {
			return RPC_URLS[NETWORK] || RPC_URLS.mainnet
		}

		async function fetchPrimaryNameForAddress(address) {
			if (!address || typeof SuiJsonRpcClient !== 'function') return { resolved: false, name: null }
			try {
				const client = new SuiJsonRpcClient({ url: getRpcUrlForNetwork() })
				const result = await client.resolveNameServiceNames({ address })
				const name = result?.data?.[0]
				if (!name || typeof name !== 'string') return { resolved: true, name: null }
				const normalized = name.replace(/\\.sui$/i, '')
				return { resolved: true, name: normalized || null }
			} catch {
				return { resolved: false, name: null }
			}
		}

		async function syncPrimaryStarState() {
			const address = getConnectedAddress()
			if (!address) {
				primaryStarAddress = ''
				primaryStarManualOverride = null
				wantsPrimaryName = false
				updatePrimaryStarUi()
				return
			}

			if (primaryStarAddress !== address) {
				primaryStarAddress = address
				primaryStarManualOverride = null
			}

			if (typeof primaryStarManualOverride === 'boolean') {
				wantsPrimaryName = primaryStarManualOverride
				updatePrimaryStarUi()
				return
			}

			const connectedPrimaryName = getConnectedPrimaryName()
			if (connectedPrimaryName) {
				wantsPrimaryName = false
				updatePrimaryStarUi()
				return
			}

			const syncNonce = ++primaryStarSyncNonce
			const primaryResolution = await fetchPrimaryNameForAddress(address)
			if (syncNonce !== primaryStarSyncNonce) return
			if (getConnectedAddress() !== address) return
			if (!primaryResolution.resolved) return
			wantsPrimaryName = primaryResolution.name === null
			updatePrimaryStarUi()
		}

		function isLikelyAddress(value) {
			return !!value && typeof value === 'string' && value.startsWith('0x') && value.length >= 10
		}

		function parsePriceMist(value) {
			if (typeof value === 'bigint') return value
			if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.floor(value))
			if (typeof value === 'string' && value.trim()) {
				try {
					return BigInt(value)
				} catch {
					return null
				}
			}
			return null
		}

		function getSuiCoinConfig(suinsClient) {
			const coins = suinsClient?.config?.coins || {}
			if (coins.SUI) return coins.SUI
			if (coins.sui) return coins.sui
			const values = Object.values(coins)
			for (const cfg of values) {
				const coinType = String(cfg?.type || cfg?.coinType || '')
				if (coinType.endsWith('::sui::SUI')) return cfg
			}
			return null
		}

		async function resolveAddressOrName(raw, suinsClient) {
			const value = String(raw || '').trim()
			if (!value) return null
			if (isLikelyAddress(value)) return value
			const name = value.endsWith('.sui') ? value : value + '.sui'
			const record = await suinsClient.getNameRecord(name)
			const resolved = record?.targetAddress
			if (!isLikelyAddress(resolved)) {
				throw new Error('Could not resolve recipient name')
			}
			return resolved
		}

		function updateRegisterButton() {
			if (!registerBtn) return
			const address = getConnectedAddress()
			if (!address) {
				registerBtn.textContent = 'Connect Wallet'
				return
			}
			if (pricingData && pricingData.discountedSuiMist) {
				const sui = Number(pricingData.discountedSuiMist) / 1e9
				if (Number.isFinite(sui) && sui > 0) {
					registerBtn.innerHTML = 'Register for ' + sui.toFixed(2) + ' ' + SUI_ICON
					return
				}
			}
			registerBtn.textContent = 'Register ' + NAME + '.sui'
		}

		async function fetchPricing() {
			if (!IS_REGISTERABLE) return
			const years = getSelectedYears()
			try {
				const response = await fetch('/api/pricing?domain=' + encodeURIComponent(NAME) + '&years=' + years)
				if (!response.ok) throw new Error('Pricing request failed')
				pricingData = await response.json()
				const mist = Number(pricingData?.discountedSuiMist || pricingData?.directSuiMist || 0)
				const sui = mist / 1e9
				const discountedUsdRaw = Number(pricingData?.breakdown?.discountedPriceUsd || 0)
				const discountedUsdText = formatUsdAmount(discountedUsdRaw)
				if (priceValue) {
					const primaryPriceHtml = formatPrimaryPriceHtml(sui)
					const usdHtml = discountedUsdText ? '<span class="price-usd">/ $' + discountedUsdText + ' est.</span>' : '<span class="price-usd">/ $-- est.</span>'
					priceValue.innerHTML = primaryPriceHtml + ' ' + usdHtml
				}
				if (priceNote) {
					const rawSavingsMist = Number(pricingData?.savingsMist || 0)
					const directMist = Number(pricingData?.directSuiMist || 0)
					const discountedMist = Number(pricingData?.discountedSuiMist || 0)
					const savingsMist = Number.isFinite(rawSavingsMist) && rawSavingsMist > 0
						? rawSavingsMist
						: (Number.isFinite(directMist) && Number.isFinite(discountedMist) && directMist > discountedMist
							? directMist - discountedMist
							: 0)
					const savingsSui = savingsMist / 1e9
					const baseUsdRaw = Number(pricingData?.breakdown?.basePriceUsd || 0)
					const premiumUsdRaw = Number(pricingData?.breakdown?.premiumUsd || 0)
					const originalUsdText = formatUsdAmount(baseUsdRaw + premiumUsdRaw)
					const originalUsdLabel = originalUsdText ? ' | Original $' + originalUsdText : ''
					if (Number.isFinite(savingsSui) && savingsSui > 0) {
						priceNote.classList.add('discount')
						priceNote.innerHTML = 'SKI saved ' + savingsSui.toFixed(2) + ' ' + SUI_ICON + originalUsdLabel
					} else {
						priceNote.classList.remove('discount')
						priceNote.textContent = (years === 1 ? '1 year registration' : years + ' year registration') + originalUsdLabel
					}
				}
				updateRegisterButton()
			} catch (error) {
				if (priceValue) priceValue.innerHTML = '-- ' + SUI_UNIT + ' <span class="price-usd">/ $-- est.</span>'
				if (priceNote) {
					priceNote.classList.remove('discount')
					priceNote.textContent = 'Pricing unavailable'
				}
			}
		}

		async function updateSuiPrice() {
			if (!suiPriceEl) return
			try {
				const res = await fetch('/api/sui-price')
				if (!res.ok) throw new Error('Price request failed')
				const data = await res.json()
				if (data && typeof data.price === 'number' && Number.isFinite(data.price)) {
					suiPriceEl.textContent = '$' + data.price.toFixed(2)
					return
				}
				suiPriceEl.textContent = '$--'
			} catch {
				suiPriceEl.textContent = '$--'
			}
		}

		function formatCompactSuiPrice(suiAmount) {
			if (!Number.isFinite(suiAmount) || suiAmount <= 0) return null
			const units = [
				{ value: 1e9, suffix: 'B' },
				{ value: 1e6, suffix: 'M' },
				{ value: 1e3, suffix: 'K' },
			]
			let scaled = suiAmount
			let suffix = ''
			for (const unit of units) {
				if (suiAmount >= unit.value) {
					scaled = suiAmount / unit.value
					suffix = unit.suffix
					break
				}
			}
			if (scaled >= 100) return String(Math.trunc(scaled)) + suffix + ' ' + SUI_ICON
			const truncatedTenths = Math.floor(scaled * 10) / 10
			return truncatedTenths.toFixed(1) + suffix + ' ' + SUI_ICON
		}

		async function updateX402Listing() {
			if (!x402PriceEl) return
			x402PriceEl.textContent = 'Loading...'
			x402PriceEl.classList.remove('listed')
			try {
				const response = await fetch('/api/marketplace/x402')
				if (!response.ok) throw new Error('Listing request failed')
				const data = await response.json()
				const listingMist = Number(data?.bestListing?.price || 0)
				const tradeportUrl = typeof data?.bestListing?.tradeportUrl === 'string' && data.bestListing.tradeportUrl
					? data.bestListing.tradeportUrl
					: 'https://www.tradeport.xyz/sui/collection/suins?search=x402'
				if (x402LinkEl) x402LinkEl.href = tradeportUrl
				if (Number.isFinite(listingMist) && listingMist > 0) {
					const listingSui = listingMist / 1e9
					const compactPrice = formatCompactSuiPrice(listingSui)
					x402PriceEl.innerHTML = compactPrice || 'No listing'
					x402PriceEl.classList.add('listed')
					return
				}
				x402PriceEl.textContent = 'No listing'
			} catch {
				x402PriceEl.textContent = 'Unavailable'
			}
		}

		function trackEvent(eventName, payload) {
			try {
				window.dispatchEvent(new CustomEvent(eventName, { detail: payload }))
				if (Array.isArray(window.dataLayer)) {
					window.dataLayer.push({ event: eventName, ...payload })
				}
				if (typeof window.plausible === 'function') {
					window.plausible(eventName, { props: payload })
				}
			} catch {}
		}

		function markRegisterFlowImpression() {
			trackEvent('sui_ski_register_impression', {
				registerName: NAME,
				registerNetwork: NETWORK,
			})
		}

		function suggestionCard(item) {
			const href = 'https://' + encodeURIComponent(item.name) + '.sui.ski'
			const s = item.status || 'available'
			let dotClass = 'green'
			let stateText = 'available'
			let linkText = 'Register'
			let linkClass = 'available'

			if (s === 'listed') {
				dotClass = 'orange'
				stateText = item.listingPrice ? item.listingPrice + ' SUI' : 'listed'
				linkText = 'Buy'
				linkClass = 'listed'
			} else if (s === 'grace') {
				dotClass = 'red'
				stateText = 'grace period'
				linkText = 'View'
				linkClass = 'grace'
			} else if (s === 'expiring') {
				dotClass = 'red'
				stateText = item.expiresIn ? item.expiresIn + 'd left' : 'expiring'
				linkText = 'View'
				linkClass = 'expiring'
			} else if (s === 'taken') {
				if (item.expiresIn && item.expiresIn > 730) {
					dotClass = 'white'
					const y = Math.floor(item.expiresIn / 365)
					const d = item.expiresIn % 365
					stateText = y + 'y ' + d + 'd'
				} else {
					dotClass = 'blue'
					stateText = item.expiresIn ? item.expiresIn + 'd' : 'taken'
				}
				linkText = 'View'
				linkClass = 'taken'
			}

			return '<div class="suggestion">' +
				'<div class="suggestion-name">' + item.name + '.sui</div>' +
				'<div class="suggestion-row">' +
					'<span class="suggestion-state ' + linkClass + '"><span class="status-dot ' + dotClass + '"></span>' + stateText + '</span>' +
					'<a class="suggestion-link ' + linkClass + '" href="' + (s === 'listed' && item.tradeportUrl ? item.tradeportUrl : href) + '"' + (s === 'listed' ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' + linkText + '</a>' +
				'</div>' +
			'</div>'
		}

		async function loadSuggestions(force = false) {
			if (!suggestionsGrid || !IS_REGISTERABLE) return
			suggestionsGrid.innerHTML = '<div class="empty">Searching...</div>'

			try {
				const response = await fetch('/api/register-suggestions?q=' + encodeURIComponent(NAME))
				if (response.ok) {
					const body = await response.json()
					const items = Array.isArray(body?.suggestions) ? body.suggestions : []
					if (items.length > 0) {
						let html = ''
						for (const item of items) html += suggestionCard(item)
						suggestionsGrid.innerHTML = html
						return
					}
				}
			} catch {}

			try {
				const fallback = await fetch('/api/suggest-names?q=' + encodeURIComponent(NAME) + '&mode=related')
				if (fallback.ok) {
					const body = await fallback.json()
					const names = Array.isArray(body?.suggestions) ? body.suggestions : []
					const filtered = names.filter(function(n) { return n !== NAME }).slice(0, 12)
					if (filtered.length > 0) {
						let html = ''
						for (const n of filtered) html += suggestionCard({ name: n, status: 'available' })
						suggestionsGrid.innerHTML = html
						return
					}
				}
			} catch {}

			suggestionsGrid.innerHTML = '<div class="empty">No suggestions right now.</div>'
		}

		async function registerName() {
			if (!IS_REGISTERABLE || !registerBtn) return
			const address = getConnectedAddress()
			if (!address) {
				SuiWalletKit.openModal()
				return
			}
			if (!SuiJsonRpcClient || !Transaction || !SuinsClient || !SuinsTransaction) {
				showStatus('Wallet SDK not loaded. Refresh and try again.', 'err')
				return
			}

			registerBtn.disabled = true
			hideStatus()
			showStatus('Building transaction...', 'info')

			try {
				const rpcUrl = getRpcUrlForNetwork()
				const years = getSelectedYears()
				const domain = NAME + '.sui'

				const client = new SuiJsonRpcClient({ url: rpcUrl })
				const suinsClient = new SuinsClient({ client, network: NETWORK })
				const coinConfig = getSuiCoinConfig(suinsClient)
				if (!coinConfig) throw new Error('SUI coin config unavailable')

				let recipient = address
				if (targetEl && targetEl.value.trim()) {
					recipient = await resolveAddressOrName(targetEl.value, suinsClient)
					if (!recipient) throw new Error('Invalid recipient')
				}

				let rawPrice
				try {
					rawPrice = await suinsClient.calculatePrice({ name: domain, years })
				} catch {
					rawPrice = await suinsClient.calculatePrice({ domain, years })
				}
				const priceMist = parsePriceMist(rawPrice)
				if (!priceMist || priceMist <= 0n) throw new Error('Invalid registration price')

				const tx = new Transaction()
				tx.setSender(address)
				tx.setGasBudget(90000000)

				const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceMist)])
				const suinsTx = new SuinsTransaction(suinsClient, tx)
				const nft = suinsTx.register({
					domain,
					years,
					coinConfig,
					coin: paymentCoin,
				})

				suinsTx.setTargetAddress({
					nft,
					address: recipient,
					isSubname: domain.replace(/\\.sui$/i, '').includes('.'),
				})

				if (wantsPrimaryName && recipient !== address) {
					throw new Error('Primary star applies to your connected wallet only. Clear recipient or disable the star.')
				}

				if (wantsPrimaryName) {
					suinsTx.setDefault(domain)
				}

				tx.transferObjects([nft], recipient)

				showStatus('Approve in wallet...', 'info')
				const result = await SuiWalletKit.signAndExecute(tx, { txOptions: { showEffects: true } })
				const digest = result?.digest ? String(result.digest) : ''

				trackEvent('sui_ski_register_success', {
					registerName: NAME,
					registerNetwork: NETWORK,
					txDigest: digest,
				})

				const links = digest
					? '<a href="https://suiscan.xyz/' + NETWORK + '/tx/' + encodeURIComponent(digest) + '" target="_blank" rel="noopener noreferrer">Suiscan</a> · ' +
					  '<a href="https://suiexplorer.com/txblock/' + encodeURIComponent(digest) + '?network=' + NETWORK + '" target="_blank" rel="noopener noreferrer">Explorer</a>'
					: ''
				showStatus(
					'<strong>Registered.</strong> <a href="https://' + NAME + '.sui.ski">Open profile</a>' +
					(digest ? ' · ' + links : ''),
					'ok',
					true,
				)
				if (wantsPrimaryName && typeof SuiWalletKit.setPrimaryName === 'function') {
					SuiWalletKit.setPrimaryName(NAME)
				}
				registerBtn.textContent = 'Registered'
				registerBtn.disabled = true
			} catch (error) {
				const msg = error && error.message ? error.message : 'Registration failed'
				trackEvent('sui_ski_register_error', {
					registerName: NAME,
					registerNetwork: NETWORK,
					error: String(msg),
				})
				showStatus(msg, 'err')
				registerBtn.disabled = false
				updateRegisterButton()
			}
		}

		window.onRegisterWalletConnected = function() {
			updateRegisterButton()
			syncPrimaryStarState()
		}

		window.onRegisterWalletDisconnected = function() {
			updateRegisterButton()
			syncPrimaryStarState()
		}

		${generateSharedWalletMountJs({
			network: env.SUI_NETWORK,
			session,
			onConnect: 'onRegisterWalletConnected',
			onDisconnect: 'onRegisterWalletDisconnected',
			profileButtonId: 'wallet-profile-btn',
			profileFallbackHref: 'https://sui.ski',
		})}

		markRegisterFlowImpression()
		updatePrimaryStarUi()
		syncPrimaryStarState()
		setSelectedYears(getSelectedYears())
		updateRegisterButton()
		fetchPricing()
		updateSuiPrice()
		updateX402Listing()
		setInterval(updateSuiPrice, 60000)
		setInterval(updateX402Listing, 120000)
		loadSuggestions()

		if (yearsDecreaseBtn) {
			yearsDecreaseBtn.addEventListener('click', () => {
				setSelectedYears(getSelectedYears() - 1)
				fetchPricing()
			})
		}
		if (yearsIncreaseBtn) {
			yearsIncreaseBtn.addEventListener('click', () => {
				setSelectedYears(getSelectedYears() + 1)
				fetchPricing()
			})
		}
		if (primaryStarEl) {
			primaryStarEl.addEventListener('click', () => {
				wantsPrimaryName = !wantsPrimaryName
				primaryStarManualOverride = wantsPrimaryName
				updatePrimaryStarUi()
			})
		}
		if (refreshSuggestionsBtn) refreshSuggestionsBtn.addEventListener('click', () => loadSuggestions(true))
		if (registerBtn) registerBtn.addEventListener('click', registerName)

		{
			const canvas = document.getElementById('snow-canvas')
			if (canvas) {
				const ctx = canvas.getContext('2d')
				const PARTICLE_COUNT = 40
				const particles = []
				const resize = () => {
					canvas.width = window.innerWidth
					canvas.height = window.innerHeight
				}
				resize()
				window.addEventListener('resize', resize)
				for (let i = 0; i < PARTICLE_COUNT; i++) {
					particles.push({
						x: Math.random() * canvas.width,
						y: Math.random() * canvas.height,
						r: Math.random() * 2 + 0.5,
						dx: (Math.random() - 0.5) * 0.3,
						dy: Math.random() * 0.5 + 0.2,
						o: Math.random() * 0.4 + 0.1,
					})
				}
				const draw = () => {
					ctx.clearRect(0, 0, canvas.width, canvas.height)
					for (const p of particles) {
						ctx.beginPath()
						ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
						ctx.fillStyle = 'rgba(255, 255, 255, ' + p.o + ')'
						ctx.fill()
						p.x += p.dx
						p.y += p.dy
						if (p.y > canvas.height) { p.y = -p.r; p.x = Math.random() * canvas.width }
						if (p.x > canvas.width) p.x = 0
						if (p.x < 0) p.x = canvas.width
					}
					requestAnimationFrame(draw)
				}
				draw()
			}
		}
	</script>
</body>
</html>`
}

export async function handleRegistrationSubmission(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405, CORS_HEADERS)
	}

	let payload: {
		txBytes?: string
		signatures?: unknown
		options?: Record<string, unknown>
		requestType?: string
	}
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	const txBytes = typeof payload.txBytes === 'string' ? payload.txBytes.trim() : ''
	const rawSignatures = Array.isArray(payload.signatures) ? payload.signatures : []
	const signatures = rawSignatures
		.filter((sig): sig is string => typeof sig === 'string' && sig.trim().length > 0)
		.map((sig) => sig.trim())

	if (!txBytes) {
		return jsonResponse({ error: 'txBytes is required' }, 400, CORS_HEADERS)
	}
	if (signatures.length === 0) {
		return jsonResponse({ error: 'At least one signature is required' }, 400, CORS_HEADERS)
	}

	const relay = await relaySignedTransaction(
		env,
		txBytes,
		signatures,
		(payload.options as Record<string, unknown>) || {},
		payload.requestType || 'WaitForLocalExecution',
	)
	const status = relay.ok ? 200 : relay.status || 502
	const body =
		typeof relay.response === 'undefined'
			? relay.ok
				? { ok: true }
				: { error: relay.error || 'Relay failed' }
			: relay.response

	if (!relay.ok && relay.error && body && typeof body === 'object' && !('error' in body)) {
		Object.assign(body as Record<string, unknown>, { error: relay.error })
	}

	return jsonResponse(body, status, CORS_HEADERS)
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => {
		switch (char) {
			case '&':
				return '&amp;'
			case '<':
				return '&lt;'
			case '>':
				return '&gt;'
			case '"':
				return '&quot;'
			case "'":
				return '&#39;'
			default:
				return char
		}
	})
}
