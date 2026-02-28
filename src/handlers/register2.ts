import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import type { Transaction } from '@mysten/sui/transactions'
import { SuinsClient, SuinsTransaction } from '@mysten/suins'
import type { Env } from '../types'
import { calculateRegistrationPrice } from '../utils/pricing'
import { jsonResponse } from '../utils/response'
import { getDefaultRpcUrl } from '../utils/rpc'
import { skiScriptTag, skiStyleTag } from '../utils/ski-embed'
import { buildSuiRegisterTx, buildSwapAndRegisterTx } from '../utils/swap-transactions'
import { relaySignedTransaction } from '../utils/transactions'

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

interface RegistrationPageOptions {
	flow?: 'register' | 'register2'
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

function parseMistAmount(value: unknown): bigint {
	if (typeof value === 'bigint') return value
	if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.floor(value))
	if (typeof value === 'string' && value.trim()) {
		try {
			return BigInt(value)
		} catch {
			return 0n
		}
	}
	return 0n
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = ''
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
	return btoa(binary)
}

function getRpcClient(env: Env): SuiJsonRpcClient {
	return new SuiJsonRpcClient({
		url: env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK),
		network: env.SUI_NETWORK,
	})
}

export function generateRegistrationPage(
	name: string,
	env: Env,
	_session?: RegisterSession,
	options: RegistrationPageOptions = {},
): string {
	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const network = env.SUI_NETWORK || 'mainnet'
	const registerFlow = options.flow === 'register2' ? 'register2' : 'register'
	const registerBucket = registerFlow === 'register2' ? 'register-v2' : 'register-v1'
	const fullName = `${cleanName}.sui`
	const serializeJson = (value: unknown) =>
		JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')

	const CDN_ASSETS = 'https://cdn.jsdelivr.net/npm/sui.ski@latest/public/assets'

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="sui-ski-register-flow" content="${registerFlow}">
	<meta name="sui-ski-register-bucket" content="${registerBucket}">
	<title>${escapeHtml(fullName)} register | sui.ski</title>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
	${skiStyleTag()}
	<style>
		:root {
			--bg: #050b08;
			--panel: #0d1712;
			--line: rgba(73, 218, 145, 0.28);
			--text: #ecfff4;
			--muted: #8fb9a3;
			--ok: #49da91;
			--err: #ffb0b0;
		}
		* { box-sizing: border-box; }
		body {
			margin: 0;
			font-family: Inter, system-ui, -apple-system, sans-serif;
			background: radial-gradient(60% 40% at 50% -10%, rgba(73,218,145,0.16), transparent 70%), var(--bg);
			color: var(--text);
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.wrap {
			width: min(480px, 100%);
			background: var(--panel);
			border: 1px solid var(--line);
			border-radius: 16px;
			padding: 20px;
			display: grid;
			gap: 12px;
		}
		h1 { margin: 0; font-size: 1.4rem; line-height: 1.2; }
		.name { color: var(--ok); }
		.row { display: flex; gap: 10px; align-items: center; }
		.stepper {
			display: inline-flex;
			align-items: center;
			border: 1px solid var(--line);
			border-radius: 10px;
			overflow: hidden;
		}
		.stepper button {
			width: 34px; height: 34px; border: 0;
			background: rgba(73, 218, 145, 0.12);
			color: var(--text); cursor: pointer;
		}
		.stepper span { min-width: 44px; text-align: center; font-weight: 700; }
		.price-box {
			display: grid; gap: 4px; padding: 10px 12px;
			border: 1px solid var(--line); border-radius: 10px;
			background: rgba(8, 16, 12, 0.8);
		}
		.price-main { font-size: 1.2rem; font-weight: 800; color: var(--ok); }
		.price-sub { font-size: 0.85rem; color: var(--muted); }
		.hint { font-size: 0.8rem; color: var(--muted); }
		/* register CTA — uses ski package wk-widget-btn styles, full-width */
		#register-btn.wk-widget-btn.connected {
			width: 100%;
			max-width: none;
			justify-content: space-between;
			cursor: pointer;
		}
		#register-btn.wk-widget-btn.connected:disabled {
			opacity: 0.6;
			cursor: not-allowed;
			transform: none;
		}
		.reg-name { color: var(--ok); font-size: 0.78rem; display: block; }
		.reg-price-row {
			display: inline-flex; align-items: center; gap: 4px;
			font-size: 0.86rem; font-weight: 800; flex-shrink: 0;
		}
		.reg-drop { width: 15px; height: 15px; }
		.status {
			display: none; padding: 10px 12px; border-radius: 10px; font-size: 0.86rem;
		}
		.status.show { display: block; }
		.status.info { color: #c8fadd; border: 1px solid var(--line); background: rgba(73,218,145,0.1); }
		.status.ok { color: #d8ffe9; border: 1px solid rgba(73,218,145,0.5); background: rgba(73,218,145,0.15); }
		.status.err { color: var(--err); border: 1px solid rgba(248,113,113,0.35); background: rgba(248,113,113,0.12); }
		label.check {
			display: inline-flex; align-items: center; gap: 8px;
			font-size: 0.9rem; color: var(--muted);
		}
	</style>
	${skiScriptTag()}
</head>
<body>
	<main class="wrap">
		<h1>Register <span class="name">${escapeHtml(fullName)}</span></h1>
		<div class="row">
			<div class="stepper">
				<button type="button" id="years-dec" aria-label="Decrease years">-</button>
				<span id="years-label">1y</span>
				<button type="button" id="years-inc" aria-label="Increase years">+</button>
			</div>
			<label class="check"><input type="checkbox" id="set-primary" checked> Set as primary</label>
		</div>
		<div class="price-box">
			<div class="price-main" id="price-sui">-- SUI</div>
			<div class="price-sub" id="price-stable">-- USDC/yr</div>
			<div class="hint" id="price-discount">NS discount pricing</div>
		</div>
		<!-- register CTA — shown once connected; uses ski package wk-widget-btn CSS + sui-drop.svg -->
		<button class="wk-widget-btn connected" id="register-btn" type="button" style="display:none" disabled>
			<span class="wk-widget-label-wrap">
				<span class="wk-widget-title">Register</span>
				<span class="reg-name">${escapeHtml(fullName)}</span>
			</span>
			<span class="reg-price-row">
				<span id="reg-sui-amount">--</span>
				<img src="${CDN_ASSETS}/sui-drop.svg" class="reg-drop" alt="SUI">
			</span>
		</button>
		<div class="status" id="status"></div>
	</main>
	<div id="ski-modal"></div>

	<script type="module">
		const NAME = ${serializeJson(cleanName)}
		const FULL_NAME = ${serializeJson(fullName)}
		const NETWORK = ${serializeJson(network)}
		const yearsLabel = document.getElementById('years-label')
		const yearsDec = document.getElementById('years-dec')
		const yearsInc = document.getElementById('years-inc')
		const setPrimary = document.getElementById('set-primary')
		const priceSui = document.getElementById('price-sui')
		const priceStable = document.getElementById('price-stable')
		const priceDiscount = document.getElementById('price-discount')
		const registerBtn = document.getElementById('register-btn')
		const regSuiAmount = document.getElementById('reg-sui-amount')
		const statusEl = document.getElementById('status')

		let years = 1
		let pricingData = null
		let currentAddr = null

		function showStatus(message, type = 'info', html = false) {
			statusEl.className = 'status show ' + type
			if (html) statusEl.innerHTML = message
			else statusEl.textContent = message
		}

		function hideStatus() {
			statusEl.className = 'status'
			statusEl.textContent = ''
		}

		function updateYearsLabel() {
			yearsLabel.textContent = years + 'y'
			yearsDec.disabled = years <= 1
			yearsInc.disabled = years >= 5
		}

		function updateCta() {
			if (!currentAddr) {
				registerBtn.style.display = 'none'
				return
			}
			const suiMist = Number(pricingData?.discountedSuiMist || 0)
			regSuiAmount.textContent = (Number.isFinite(suiMist) && suiMist > 0)
				? String(Math.ceil(suiMist / 1e9))
				: '--'
			registerBtn.style.display = ''
			registerBtn.disabled = false
		}

		function formatUsd(value) {
			if (!Number.isFinite(value) || value <= 0) return '--'
			return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))
		}

		async function loadPricing() {
			try {
				const res = await fetch('/api/pricing?domain=' + encodeURIComponent(FULL_NAME) + '&years=' + years)
				if (!res.ok) throw new Error('Pricing request failed')
				pricingData = await res.json()
				const discountedSuiMist = Number(pricingData?.discountedSuiMist || pricingData?.directSuiMist || 0)
				const discountedSui = discountedSuiMist > 0 ? discountedSuiMist / 1e9 : 0
				const discountedUsd = Number(pricingData?.breakdown?.discountedPriceUsd || 0)
				const nsDiscountPercent = Number(pricingData?.breakdown?.nsDiscountPercent || 25)
				const perYearUsd = years > 0 ? discountedUsd / years : discountedUsd
				priceSui.textContent = (discountedSui > 0 ? discountedSui.toFixed(2) : '--') + ' SUI'
				priceStable.textContent = formatUsd(perYearUsd) + ' USDC/yr'
				priceDiscount.textContent = nsDiscountPercent > 0
					? Math.round(nsDiscountPercent) + '% NS discount included'
					: 'Pricing loaded'
			} catch {
				priceSui.textContent = '-- SUI'
				priceStable.textContent = '-- USDC/yr'
				priceDiscount.textContent = 'Pricing unavailable'
			}
			updateCta()
		}

		function toTxBytes(base64) {
			const raw = atob(base64)
			const out = new Uint8Array(raw.length)
			for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
			return out
		}

		async function registerName() {
			if (!currentAddr) return

			registerBtn.disabled = true
			hideStatus()
			showStatus('Building PTB...', 'info')

			try {
				const buildRes = await fetch('/api/register/build-tx', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						domain: NAME,
						years,
						sender: currentAddr,
						wantsPrimary: !!setPrimary.checked,
						paymentMode: 'auto',
					}),
				})
				if (!buildRes.ok) {
					const err = await buildRes.json().catch(() => ({}))
					throw new Error(err.error || 'Failed to build transaction')
				}
				const build = await buildRes.json()
				const txBytesB64 = String(build?.txBytes || '')
				if (!txBytesB64) throw new Error('Missing tx bytes')

				showStatus('Approve in wallet...', 'info')

				// Use ski.js sign-and-execute event — respects Splash sponsorship + all wallet types
				const reqId = 'reg-' + Date.now()
				await new Promise((resolve, reject) => {
					function onResult(e) {
						if (e.detail?.requestId !== reqId) return
						window.removeEventListener('ski:transaction-result', onResult)
						if (e.detail.success) resolve(e.detail)
						else reject(new Error(e.detail.error || 'Transaction failed'))
					}
					window.addEventListener('ski:transaction-result', onResult)
					window.dispatchEvent(new CustomEvent('ski:sign-and-execute-transaction', {
						detail: { transaction: toTxBytes(txBytesB64), requestId: reqId }
					}))
				}).then((result) => {
					const digest = String(result?.digest || '')
					if (!digest) throw new Error('No digest returned')
					const scanUrl = 'https://suiscan.xyz/' + NETWORK + '/tx/' + encodeURIComponent(digest)
					showStatus('Registered. <a href="' + scanUrl + '" target="_blank" rel="noopener">View tx</a>', 'ok', true)
					setTimeout(() => {
						window.location.href = 'https://' + encodeURIComponent(NAME) + '.sui.ski?nocache'
					}, 1200)
				})
			} catch (error) {
				showStatus(error?.message || 'Registration failed', 'err')
				registerBtn.disabled = false
				updateCta()
			}
		}

		window.addEventListener('ski:wallet-connected', (e) => {
			currentAddr = (e && e.detail && e.detail.address) || null
			updateCta()
		})
		window.addEventListener('ski:wallet-disconnected', () => {
			currentAddr = null
			updateCta()
		})

		yearsDec.addEventListener('click', () => { years = Math.max(1, years - 1); updateYearsLabel(); loadPricing() })
		yearsInc.addEventListener('click', () => { years = Math.min(5, years + 1); updateYearsLabel(); loadPricing() })
		registerBtn.addEventListener('click', registerName)

		updateYearsLabel()
		loadPricing()
	</script>
</body>
</html>`
}

export async function handleBuildRegisterTx(request: Request, env: Env): Promise<Response> {
	if (request.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405, CORS_HEADERS)
	}

	let body: {
		domain?: string
		years?: number
		sender?: string
		wantsPrimary?: boolean
	}

	try {
		body = (await request.json()) as typeof body
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	const domain =
		typeof body.domain === 'string'
			? body.domain
					.trim()
					.toLowerCase()
					.replace(/\.sui$/i, '')
			: ''
	const years =
		typeof body.years === 'number' && Number.isFinite(body.years)
			? Math.max(1, Math.min(5, Math.floor(body.years)))
			: 1
	const sender = typeof body.sender === 'string' ? body.sender.trim() : ''
	const wantsPrimary = body.wantsPrimary === true

	if (!domain || domain.length < 3) {
		return jsonResponse({ error: 'Invalid domain (minimum 3 characters)' }, 400, CORS_HEADERS)
	}
	if (!sender || !/^0x[0-9a-fA-F]{64}$/.test(sender)) {
		return jsonResponse({ error: 'Invalid sender address' }, 400, CORS_HEADERS)
	}

	const fullDomain = `${domain}.sui`

	try {
		let tx: Transaction
		let method: 'ns-swap' | 'sui-direct' = 'ns-swap'

		try {
			const swapResult = await buildSwapAndRegisterTx(
				{ domain: fullDomain, years, senderAddress: sender },
				env,
			)
			tx = swapResult.tx
			method = 'ns-swap'
		} catch {
			tx = await buildSuiRegisterTx({ domain: fullDomain, years, senderAddress: sender }, env)
			method = 'sui-direct'
		}

		if (wantsPrimary) {
			const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
			const client = getRpcClient(env)
			const suinsClient = new SuinsClient({ client: client as never, network })
			const suinsTx = new SuinsTransaction(suinsClient, tx)
			suinsTx.setDefault(fullDomain)
		}

		const txBytes = await tx.build({ client: getRpcClient(env) })
		return jsonResponse({ txBytes: uint8ArrayToBase64(txBytes), method }, 200, CORS_HEADERS)
	} catch (error) {
		const message =
			error instanceof Error && error.message
				? error.message
				: 'Failed to build registration transaction'
		return jsonResponse({ error: message }, 400, CORS_HEADERS)
	}
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

export async function getSimplePricingSummary(domain: string, years: number, env: Env) {
	const pricing = await calculateRegistrationPrice({ domain, years, env })
	return {
		discountedSuiMist: String(parseMistAmount(pricing.discountedSuiMist)),
		discountedUsd: Number(pricing.breakdown.discountedPriceUsd || 0),
		nsDiscountPercent: Number(pricing.breakdown.nsDiscountPercent || 25),
	}
}
