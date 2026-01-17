import type { Env } from '../types'
import { htmlResponse, jsonResponse } from '../utils/response'

interface TransactionData {
	digest: string
	checkpoint: string
	timestampMs: string
	timestamp: string
	status: string
	epoch: string
	sender: string
	gas: {
		computationCost: string
		storageCost: string
		storageRebate: string
		totalGas: string
	}
	balanceChanges: Array<{
		owner: string
		coinType: string
		amount: string
		amountSui: number
	}>
	events: Array<{
		type: string
		module: string
		packageId: string
		parsedJson: Record<string, unknown>
	}>
	objectChanges: {
		created: Array<{
			objectId: string
			objectType: string
			owner: string
		}>
		mutated: Array<{
			objectId: string
			objectType: string
		}>
	}
	suinsRegistration?: {
		domain: string
		years: number
		baseAmountUsd: number
		paymentSui: number
		isRenewal: boolean
		nftObjectId: string
		expirationMs: string
		imageUrl: string
	}
}

/**
 * Fetch comprehensive transaction data from Sui RPC
 */
export async function fetchTransactionData(
	digest: string,
	env: Env,
): Promise<TransactionData | null> {
	try {
		// Fetch full transaction data
		const response = await fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_getTransactionBlock',
				params: [
					digest,
					{
						showInput: true,
						showEffects: true,
						showEvents: true,
						showObjectChanges: true,
						showBalanceChanges: true,
					},
				],
			}),
		})

		if (!response.ok) return null

		const data = (await response.json()) as {
			result?: {
				digest: string
				checkpoint: string
				timestampMs: string
				transaction?: {
					data?: {
						sender?: string
					}
				}
				effects?: {
					status?: { status: string }
					executedEpoch?: string
					gasUsed?: {
						computationCost: string
						storageCost: string
						storageRebate: string
					}
				}
				events?: Array<{
					type: string
					transactionModule: string
					packageId: string
					parsedJson: Record<string, unknown>
				}>
				balanceChanges?: Array<{
					owner: { AddressOwner?: string; ObjectOwner?: string }
					coinType: string
					amount: string
				}>
				objectChanges?: Array<{
					type: string
					objectId: string
					objectType: string
					owner?: { AddressOwner?: string; ObjectOwner?: string }
				}>
			}
		}
		const result = data.result
		if (!result) return null

		// Parse gas
		const gasUsed = result.effects?.gasUsed
		const computationCost = Number(gasUsed?.computationCost || 0)
		const storageCost = Number(gasUsed?.storageCost || 0)
		const storageRebate = Number(gasUsed?.storageRebate || 0)
		const totalGas = computationCost + storageCost - storageRebate

		// Parse balance changes
		const balanceChanges =
			result.balanceChanges?.map((bc) => ({
				owner: bc.owner.AddressOwner || bc.owner.ObjectOwner || 'Unknown',
				coinType: bc.coinType,
				amount: bc.amount,
				amountSui: Number(bc.amount) / 1e9,
			})) || []

		// Parse events
		const events =
			result.events?.map((ev) => ({
				type: ev.type,
				module: ev.transactionModule,
				packageId: ev.packageId,
				parsedJson: ev.parsedJson,
			})) || []

		// Parse object changes
		const created =
			result.objectChanges
				?.filter((oc) => oc.type === 'created')
				.map((oc) => ({
					objectId: oc.objectId,
					objectType: oc.objectType,
					owner: oc.owner?.AddressOwner || oc.owner?.ObjectOwner || 'Unknown',
				})) || []

		const mutated =
			result.objectChanges
				?.filter((oc) => oc.type === 'mutated')
				.map((oc) => ({
					objectId: oc.objectId,
					objectType: oc.objectType,
				})) || []

		// Check for SuiNS registration event
		let suinsRegistration: TransactionData['suinsRegistration']
		const suinsEvent = events.find(
			(ev) => ev.type.includes('payment::TransactionEvent') && ev.parsedJson?.domain,
		)

		if (suinsEvent) {
			const json = suinsEvent.parsedJson as {
				domain?: { labels?: string[] }
				years?: number
				base_amount?: string
				currency_amount?: string
				is_renewal?: boolean
			}
			const labels = json.domain?.labels || []
			const domain = [...labels].reverse().join('.')

			// Find the SuiNS NFT object
			const nftObject = created.find((o) => o.objectType.includes('SuinsRegistration'))

			// Fetch NFT details if found
			let expirationMs = ''
			let imageUrl = ''
			if (nftObject) {
				const nftData = await fetchObjectData(nftObject.objectId, env)
				if (nftData) {
					expirationMs = nftData.expirationMs || ''
					imageUrl = nftData.imageUrl || ''
				}
			}

			suinsRegistration = {
				domain,
				years: json.years || 1,
				baseAmountUsd: Number(json.base_amount || 0) / 1e6,
				paymentSui: Number(json.currency_amount || 0) / 1e9,
				isRenewal: json.is_renewal || false,
				nftObjectId: nftObject?.objectId || '',
				expirationMs,
				imageUrl,
			}
		}

		// Format timestamp
		const timestampMs = result.timestampMs
		const date = new Date(Number(timestampMs))
		const timestamp = date.toISOString()

		return {
			digest: result.digest,
			checkpoint: result.checkpoint,
			timestampMs,
			timestamp,
			status: result.effects?.status?.status || 'unknown',
			epoch: result.effects?.executedEpoch || '',
			sender: result.transaction?.data?.sender || '',
			gas: {
				computationCost: (computationCost / 1e9).toFixed(6),
				storageCost: (storageCost / 1e9).toFixed(6),
				storageRebate: (storageRebate / 1e9).toFixed(6),
				totalGas: (totalGas / 1e9).toFixed(6),
			},
			balanceChanges,
			events,
			objectChanges: { created, mutated },
			suinsRegistration,
		}
	} catch (error) {
		console.error('Error fetching transaction:', error)
		return null
	}
}

/**
 * Fetch object data (for SuiNS NFT details)
 * @deprecated Use fetchSuiNSObjectData from utils/suins-object.ts instead
 */
async function fetchObjectData(
	objectId: string,
	env: Env,
): Promise<{ expirationMs?: string; imageUrl?: string } | null> {
	const { fetchSuiNSObjectData, extractExpirationFromObjectData, extractImageUrlFromObjectData } =
		await import('../utils/suins-object')
	const objectData = await fetchSuiNSObjectData(objectId, env)
	if (!objectData) return null

	return {
		expirationMs: extractExpirationFromObjectData(objectData) || undefined,
		imageUrl: extractImageUrlFromObjectData(objectData) || undefined,
	}
}

/**
 * Handle transaction viewer requests
 */
export async function handleTransaction(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const pathParts = url.pathname.split('/').filter(Boolean)

	// /tx/{digest} or /transaction/{digest}
	if (pathParts.length < 2) {
		return jsonResponse({ error: 'Transaction digest required' }, 400)
	}

	const digest = pathParts[1]

	// Check for JSON format request
	const wantsJson =
		url.searchParams.get('format') === 'json' ||
		request.headers.get('Accept')?.includes('application/json')

	const txData = await fetchTransactionData(digest, env)

	if (!txData) {
		if (wantsJson) {
			return jsonResponse({ error: 'Transaction not found' }, 404)
		}
		return htmlResponse(transactionNotFoundHTML(digest), 404)
	}

	if (wantsJson) {
		return jsonResponse(txData)
	}

	return htmlResponse(transactionPageHTML(txData, env.SUI_NETWORK))
}

/**
 * Generate transaction viewer HTML
 */
function transactionPageHTML(tx: TransactionData, network: string): string {
	const suiscanUrl = `https://suiscan.xyz/${network}/tx/${tx.digest}`
	const explorerUrl = `https://suiexplorer.com/txblock/${tx.digest}?network=${network}`

	const suinsSection = tx.suinsRegistration
		? `
		<div class="section suins-section">
			<h3>SuiNS Registration</h3>
			<div class="grid">
				<div class="item">
					<span class="label">Domain</span>
					<span class="value highlight">${tx.suinsRegistration.domain}</span>
				</div>
				<div class="item">
					<span class="label">Years</span>
					<span class="value">${tx.suinsRegistration.years}</span>
				</div>
				<div class="item">
					<span class="label">Base Price (USD)</span>
					<span class="value">$${tx.suinsRegistration.baseAmountUsd}</span>
				</div>
				<div class="item">
					<span class="label">Payment</span>
					<span class="value">${tx.suinsRegistration.paymentSui.toFixed(4)} SUI</span>
				</div>
				<div class="item">
					<span class="label">Type</span>
					<span class="value">${tx.suinsRegistration.isRenewal ? 'Renewal' : 'New Registration'}</span>
				</div>
				${
					tx.suinsRegistration.expirationMs
						? `
				<div class="item">
					<span class="label">Expires</span>
					<span class="value">${new Date(Number(tx.suinsRegistration.expirationMs)).toISOString().split('T')[0]}</span>
				</div>
				`
						: ''
				}
				${
					tx.suinsRegistration.nftObjectId
						? `
				<div class="item full">
					<span class="label">NFT Object</span>
					<span class="value mono"><a href="https://suiscan.xyz/${network}/object/${tx.suinsRegistration.nftObjectId}" target="_blank">${tx.suinsRegistration.nftObjectId}</a></span>
				</div>
				`
						: ''
				}
			</div>
		</div>
	`
		: ''

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Transaction ${tx.digest.slice(0, 8)}... | sui.ski</title>
	<style>
		:root {
			--bg-gradient-start: #0a0a0f;
			--bg-gradient-end: #12121a;
			--card-bg: rgba(22, 22, 30, 0.9);
			--card-bg-solid: #16161e;
			--glass-border: rgba(255, 255, 255, 0.08);
			--text: #e4e4e7;
			--text-muted: #71717a;
			--accent: #60a5fa;
			--accent-light: rgba(96, 165, 250, 0.12);
			--accent-hover: #93c5fd;
			--accent-glow: rgba(96, 165, 250, 0.3);
			--success: #34d399;
			--success-light: rgba(52, 211, 153, 0.12);
			--border: rgba(255, 255, 255, 0.06);
			--border-strong: rgba(255, 255, 255, 0.12);
			--shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
			--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: var(--text);
			min-height: 100vh;
			padding: 24px;
		}
		body::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(ellipse at 20% 20%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
				radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
			pointer-events: none;
		}
		.container { max-width: 900px; margin: 0 auto; position: relative; }
		h1 {
			font-size: 1.5rem;
			margin-bottom: 10px;
			font-weight: 700;
			color: var(--text);
		}
		h2 {
			font-size: 1.25rem;
			margin-bottom: 18px;
			color: var(--text);
			font-weight: 700;
		}
		h3 {
			font-size: 1rem;
			margin-bottom: 14px;
			font-weight: 700;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.header {
			margin-bottom: 28px;
		}
		.digest {
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.85rem;
			color: var(--text-muted);
			word-break: break-all;
			background: var(--accent-light);
			padding: 10px 14px;
			border-radius: 10px;
			border: 1px solid var(--border);
		}
		.status-badge {
			display: inline-block;
			padding: 5px 14px;
			border-radius: 10px;
			font-size: 0.75rem;
			font-weight: 700;
			text-transform: uppercase;
			margin-left: 14px;
		}
		.status-badge.success {
			background: var(--success-light);
			color: var(--success);
			border: 1px solid rgba(16, 185, 129, 0.2);
		}
		.section {
			background: var(--card-bg);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid var(--glass-border);
			border-radius: 16px;
			padding: 24px;
			margin-bottom: 20px;
			box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,0.03);
			position: relative;
		}
		.section::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
		}
		.suins-section {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.08), rgba(139, 92, 246, 0.06));
			border-color: var(--border-strong);
		}
		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 18px;
		}
		.item {
			display: flex;
			flex-direction: column;
			gap: 6px;
		}
		.item.full {
			grid-column: 1 / -1;
		}
		.label {
			font-size: 0.7rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.06em;
		}
		.value {
			font-size: 0.95rem;
			font-weight: 500;
			color: var(--text);
		}
		.value.highlight {
			font-weight: 700;
			font-size: 1.15rem;
			background: linear-gradient(135deg, #60a5fa, #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.value.mono {
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-size: 0.8rem;
			word-break: break-all;
		}
		a {
			color: var(--accent);
			text-decoration: none;
			font-weight: 600;
		}
		a:hover {
			color: var(--accent-hover);
		}
		.links {
			display: flex;
			gap: 12px;
			margin-top: 12px;
			flex-wrap: wrap;
		}
		.link-btn {
			padding: 10px 18px;
			background: var(--card-bg-solid);
			border: 1px solid var(--border-strong);
			border-radius: 12px;
			color: var(--accent);
			font-size: 0.85rem;
			font-weight: 600;
			text-decoration: none;
			transition: all 0.2s;
		}
		.link-btn:hover {
			background: var(--accent-light);
			border-color: var(--accent);
			transform: translateY(-2px);
			box-shadow: var(--shadow);
		}
		.events {
			margin-top: 14px;
		}
		.event {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 16px;
			margin-bottom: 12px;
		}
		.event-type {
			font-size: 0.8rem;
			color: var(--accent);
			font-family: ui-monospace, SFMono-Regular, monospace;
			font-weight: 600;
			word-break: break-all;
		}
		pre {
			background: var(--card-bg-solid);
			border: 1px solid var(--border);
			padding: 14px;
			border-radius: 12px;
			overflow-x: auto;
			font-size: 0.8rem;
			margin-top: 10px;
			color: var(--text-muted);
		}
		.back-link {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			margin-bottom: 20px;
			color: var(--text-muted);
			font-size: 0.9rem;
			font-weight: 600;
			transition: color 0.2s;
		}
		.back-link:hover {
			color: var(--accent);
		}
	</style>
</head>
<body>
	<div class="container">
		<a href="/" class="back-link">← Back to sui.ski</a>

		<div class="header">
			<h1>Transaction <span class="status-badge success">${tx.status}</span></h1>
			<div class="digest">${tx.digest}</div>
			<div class="links">
				<a href="${suiscanUrl}" target="_blank" class="link-btn">View on Suiscan</a>
				<a href="${explorerUrl}" target="_blank" class="link-btn">View on SuiExplorer</a>
				<a href="?format=json" class="link-btn">JSON</a>
			</div>
		</div>

		${suinsSection}

		<div class="section">
			<h3>Overview</h3>
			<div class="grid">
				<div class="item">
					<span class="label">Timestamp</span>
					<span class="value">${tx.timestamp}</span>
				</div>
				<div class="item">
					<span class="label">Checkpoint</span>
					<span class="value">${tx.checkpoint}</span>
				</div>
				<div class="item">
					<span class="label">Epoch</span>
					<span class="value">${tx.epoch}</span>
				</div>
				<div class="item full">
					<span class="label">Sender</span>
					<span class="value mono"><a href="https://suiscan.xyz/${network}/account/${tx.sender}" target="_blank">${tx.sender}</a></span>
				</div>
			</div>
		</div>

		<div class="section">
			<h3>Gas Summary</h3>
			<div class="grid">
				<div class="item">
					<span class="label">Computation Cost</span>
					<span class="value">${tx.gas.computationCost} SUI</span>
				</div>
				<div class="item">
					<span class="label">Storage Cost</span>
					<span class="value">${tx.gas.storageCost} SUI</span>
				</div>
				<div class="item">
					<span class="label">Storage Rebate</span>
					<span class="value">${tx.gas.storageRebate} SUI</span>
				</div>
				<div class="item">
					<span class="label">Total Gas</span>
					<span class="value highlight">${tx.gas.totalGas} SUI</span>
				</div>
			</div>
		</div>

		<div class="section">
			<h3>Balance Changes</h3>
			<div class="grid">
				${tx.balanceChanges
					.map(
						(bc) => `
					<div class="item full">
						<span class="label">${bc.amountSui >= 0 ? 'Received' : 'Sent'}</span>
						<span class="value" style="color: ${bc.amountSui >= 0 ? 'var(--success)' : '#ff6b6b'}">
							${bc.amountSui >= 0 ? '+' : ''}${bc.amountSui.toFixed(6)} SUI
						</span>
						<span class="value mono" style="font-size: 0.75rem; color: var(--text-muted);">${bc.owner}</span>
					</div>
				`,
					)
					.join('')}
			</div>
		</div>

		${
			tx.objectChanges.created.length > 0
				? `
		<div class="section">
			<h3>Created Objects (${tx.objectChanges.created.length})</h3>
			${tx.objectChanges.created
				.map(
					(obj) => `
				<div class="event">
					<div class="event-type">${obj.objectType}</div>
					<div class="value mono" style="margin-top: 8px; font-size: 0.8rem;">
						<a href="https://suiscan.xyz/${network}/object/${obj.objectId}" target="_blank">${obj.objectId}</a>
					</div>
				</div>
			`,
				)
				.join('')}
		</div>
		`
				: ''
		}

		${
			tx.events.length > 0
				? `
		<div class="section">
			<h3>Events (${tx.events.length})</h3>
			${tx.events
				.map(
					(ev) => `
				<div class="event">
					<div class="event-type">${ev.type}</div>
					<pre>${JSON.stringify(ev.parsedJson, null, 2)}</pre>
				</div>
			`,
				)
				.join('')}
		</div>
		`
				: ''
		}
	</div>
</body>
</html>`
}

function transactionNotFoundHTML(digest: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Transaction Not Found | sui.ski</title>
	<style>
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		body::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background:
				radial-gradient(ellipse at 20% 20%, rgba(96, 165, 250, 0.08) 0%, transparent 50%),
				radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
			pointer-events: none;
		}
		.card {
			background: rgba(22, 22, 30, 0.9);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 20px;
			padding: 40px;
			text-align: center;
			max-width: 500px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);
			position: relative;
		}
		.card::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
		}
		h1 {
			color: #f87171;
			margin-bottom: 18px;
			font-weight: 700;
		}
		p {
			color: #71717a;
			margin-bottom: 24px;
			font-size: 1rem;
		}
		code {
			display: block;
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(255, 255, 255, 0.06);
			padding: 14px;
			border-radius: 12px;
			font-size: 0.85rem;
			font-family: ui-monospace, SFMono-Regular, monospace;
			word-break: break-all;
			margin-bottom: 28px;
			color: #60a5fa;
		}
		a {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			color: #60a5fa;
			text-decoration: none;
			font-weight: 600;
			padding: 12px 24px;
			background: rgba(96, 165, 250, 0.12);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 12px;
			transition: all 0.2s;
		}
		a:hover {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			transform: translateY(-2px);
			box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
		}
	</style>
</head>
<body>
	<div class="card">
		<h1>Transaction Not Found</h1>
		<p>Could not find transaction with digest:</p>
		<code>${digest}</code>
		<a href="/">← Back to sui.ski</a>
	</div>
</body>
</html>`
}
