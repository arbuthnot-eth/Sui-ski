import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { relaySignedTransaction } from '../utils/transactions'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

export function generateRegistrationPage(name: string, env: Env): string {
	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const network = env.SUI_NETWORK || 'mainnet'
	const isRegisterable = cleanName.length >= 3
	const defaultExec = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(cleanName)}.sui available | sui.ski</title>
	<style>
		:root {
			--bg: #05060c;
			--card: rgba(15, 18, 32, 0.9);
			--border: rgba(255, 255, 255, 0.08);
			--text: #e4e6f1;
			--muted: #7c819b;
			--accent: #60a5fa;
			--success: #34d399;
			--error: #f87171;
			--warning: #fbbf24;
		}
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 40%), linear-gradient(180deg, #05060c, #090d1a 60%, #05060c);
			min-height: 100vh;
			color: var(--text);
			padding: 32px 16px 64px;
		}
		.container {
			max-width: 880px;
			margin: 0 auto;
			display: flex;
			flex-direction: column;
			gap: 20px;
		}
		.card {
			background: var(--card);
			border: 1px solid var(--border);
			border-radius: 20px;
			padding: 28px;
			box-shadow: 0 25px 60px rgba(5,6,12,0.7);
		}
		.header {
			text-align: center;
			margin-bottom: 12px;
		}
		.header h1 {
			font-size: clamp(1.8rem, 3vw, 2.8rem);
			margin-bottom: 6px;
			font-weight: 800;
		}
		.header h1 span {
			color: var(--accent);
		}
		.badge {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 6px 14px;
			border-radius: 999px;
			font-size: 0.85rem;
			font-weight: 600;
		}
		.badge.success { background: rgba(52,211,153,0.15); color: var(--success); border: 1px solid rgba(52,211,153,0.3); }
		.badge.warning { background: rgba(251,191,36,0.15); color: var(--warning); border: 1px solid rgba(251,191,36,0.25); }
		.section-title {
			font-size: 1.1rem;
			font-weight: 700;
			margin-bottom: 8px;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.section-title svg { width: 18px; height: 18px; }
		.stat-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
			gap: 12px;
			margin: 18px 0;
		}
		.stat {
			padding: 14px;
			border: 1px solid var(--border);
			border-radius: 14px;
			background: rgba(255,255,255,0.02);
		}
		.stat-label {
			font-size: 0.78rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--muted);
			margin-bottom: 4px;
		}
		.stat-value {
			font-size: 1.2rem;
			font-weight: 700;
		}
		.bid-list {
			border: 1px solid var(--border);
			border-radius: 16px;
			overflow: hidden;
			margin-bottom: 18px;
		}
		.bid-list ul {
			list-style: none;
		}
		.bid-list li {
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 12px 16px;
			border-bottom: 1px solid rgba(255,255,255,0.04);
			font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
			font-size: 0.85rem;
		}
		.bid-list li:last-child { border-bottom: none; }
		.bid-main {
			display: grid;
			grid-template-columns: 2fr 1fr 1fr;
			gap: 12px;
			align-items: center;
		}
		.bid-meta {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			font-size: 0.75rem;
			color: var(--muted);
		}
		.status-chip {
			padding: 4px 10px;
			border-radius: 999px;
			background: rgba(96,165,250,0.15);
			border: 1px solid rgba(96,165,250,0.25);
			color: #c7d2fe;
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
		}
		.status-chip.auto {
			background: rgba(16,185,129,0.15);
			border-color: rgba(16,185,129,0.35);
			color: var(--success);
		}
		.status-chip.submitted {
			background: rgba(59,130,246,0.18);
			border-color: rgba(59,130,246,0.35);
			color: #bfdbfe;
		}
		.status-chip.failed {
			background: rgba(248,113,113,0.15);
			border-color: rgba(248,113,113,0.3);
			color: var(--error);
		}
		.digest-chip {
			background: rgba(255,255,255,0.04);
			border-radius: 8px;
			padding: 2px 8px;
			font-size: 0.75rem;
		}
		.form {
			display: flex;
			flex-direction: column;
			gap: 16px;
			margin-top: 10px;
		}
		.attach-toggle {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 0.85rem;
			color: var(--muted);
		}
		.attach-toggle input {
			width: auto;
			accent-color: var(--accent);
		}
		.offline-attachment {
			display: none;
			flex-direction: column;
			gap: 12px;
			border: 1px dashed var(--border);
			border-radius: 12px;
			padding: 16px;
			background: rgba(255,255,255,0.02);
		}
		label {
			font-size: 0.8rem;
			color: var(--muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 6px;
		}
		input, textarea {
			width: 100%;
			padding: 12px 14px;
			background: rgba(255,255,255,0.03);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 0.95rem;
		}
		input:focus, textarea:focus {
			outline: none;
			border-color: var(--accent);
			box-shadow: 0 0 0 3px rgba(96,165,250,0.25);
		}
		textarea { min-height: 120px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
		button {
			border: none;
			border-radius: 12px;
			padding: 12px 18px;
			font-size: 0.95rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.primary-btn {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
			box-shadow: 0 12px 30px rgba(59,130,246,0.3);
		}
		.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
		.secondary-btn {
			background: transparent;
			color: var(--muted);
			border: 1px solid var(--border);
		}
		.status-line {
			font-size: 0.85rem;
			min-height: 20px;
		}
		.status-line.success { color: var(--success); }
		.status-line.error { color: var(--error); }
		.status-line.info { color: var(--muted); }
		.instructions {
			font-size: 0.9rem;
			color: var(--muted);
			line-height: 1.6;
			margin-bottom: 12px;
		}
		.instructions ol { padding-left: 18px; margin-top: 6px; }
		pre {
			background: rgba(0,0,0,0.4);
			border-radius: 12px;
			padding: 16px;
			overflow-x: auto;
			font-size: 0.8rem;
			line-height: 1.4;
		}
		@media (max-width: 640px) {
			.card { padding: 20px; }
			.bid-main { grid-template-columns: 1fr; }
			.bid-list li { font-size: 0.8rem; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="card">
			<div class="header">
				<div class="badge ${isRegisterable ? 'success' : 'warning'}">${isRegisterable ? 'Name available for registration' : 'Minimum length is 3 characters'}</div>
				<h1>${escapeHtml(cleanName)}<span>.sui</span></h1>
				<p style="color: var(--muted); font-size: 0.95rem;">Network: ${escapeHtml(network)}</p>
			</div>
			<p style="color: var(--muted); text-align: center;">Queue a bid, attach offline-signed registrations for automatic relay, or broadcast your own transaction without exposing keys.</p>
		</div>

		<div class="card" id="queue-card">
			<div class="section-title">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
				Registration Queue
			</div>
			<div class="stat-grid" id="queue-stats">
				<div class="stat">
					<div class="stat-label">Active Bids</div>
					<div class="stat-value" id="stat-count">0</div>
				</div>
				<div class="stat">
					<div class="stat-label">Highest Bid (SUI)</div>
					<div class="stat-value" id="stat-high">0</div>
				</div>
				<div class="stat">
					<div class="stat-label">Earliest Execute</div>
					<div class="stat-value" id="stat-soon">—</div>
				</div>
				<div class="stat">
					<div class="stat-label">Auto Relays</div>
					<div class="stat-value" id="stat-auto">0</div>
				</div>
			</div>
			<div class="bid-list" id="bid-list">
				<ul>
					<li style="text-align:center;color:var(--muted);">No queued bids yet.</li>
				</ul>
			</div>
			<div class="form" id="queue-form">
				<div>
					<label for="bidder-input">Bidder Address</label>
					<input id="bidder-input" type="text" placeholder="0x..." autocomplete="off" spellcheck="false" />
				</div>
				<div style="display:flex; gap:12px; flex-wrap:wrap;">
					<div style="flex:1; min-width:160px;">
						<label for="amount-input">Bid Amount (SUI)</label>
						<input id="amount-input" type="number" min="0.1" step="0.1" value="1.0" />
					</div>
					<div style="flex:1; min-width:160px;">
						<label for="execute-input">Execute On</label>
						<input id="execute-input" type="datetime-local" value="${defaultExec}" />
					</div>
				</div>
				<label class="attach-toggle">
					<input type="checkbox" id="attach-offline-toggle" />
					<span>Attach offline-signed registration transaction for automatic relay</span>
				</label>
				<div class="offline-attachment" id="offline-attachment">
					<div>
						<label for="offline-tx-bytes">Transaction Bytes (base64)</label>
						<textarea id="offline-tx-bytes" placeholder="AAACAA..."></textarea>
					</div>
					<div>
						<label for="offline-tx-signatures">Signatures (newline or comma separated)</label>
						<textarea id="offline-tx-signatures" placeholder="AAQw..."></textarea>
					</div>
					<p class="instructions" style="margin-bottom:0;">Encrypted at rest and relayed automatically once the execution window opens.</p>
				</div>
				<button class="primary-btn" id="queue-submit">Queue Bid</button>
				<div class="status-line" id="queue-status"></div>
			</div>
			<p class="instructions" style="margin-top:8px;">Queued bids are stored off-chain until the name expires. Attach offline bytes to have sui.ski relay your transaction automatically when the window opens.</p>
		</div>

		<div class="card">
			<div class="section-title">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12l5 5L20 7"></path></svg>
				Offline Registration Relay
			</div>
			<p class="instructions">Bring your own signed Sui transaction block (for example, produced via <code>sui client</code> or an air-gapped wallet). sui.ski forwards the signed payload immediately—use the queue above if you want us to hold it until the grace period.</p>
			<ol class="instructions">
				<li>Prepare a SuiNS registration transaction offline (choose package, calculate price, build tx bytes).</li>
				<li>Sign the transaction bytes with every required signer.</li>
				<li>Paste the base64-encoded transaction bytes and signatures below, then relay via sui.ski.</li>
			</ol>
			<div class="form" id="tx-form">
				<div>
					<label for="tx-bytes">Transaction Bytes (base64)</label>
					<textarea id="tx-bytes" placeholder="AAACAA..."></textarea>
				</div>
				<div>
					<label for="tx-signatures">Signatures (newline or comma separated)</label>
					<textarea id="tx-signatures" placeholder="AAQw..."></textarea>
				</div>
				<button class="primary-btn" id="tx-submit">Relay Signed Transaction</button>
				<div class="status-line" id="tx-status"></div>
				<pre id="tx-result" style="display:none;"></pre>
			</div>
		</div>
	</div>

	<script>
	(() => {
		const NAME = '${escapeHtml(cleanName)}';
		const NETWORK = '${escapeHtml(network)}';
		const CAN_REGISTER = ${isRegisterable ? 'true' : 'false'};

		const bidListEl = document.getElementById('bid-list');
		const statCount = document.getElementById('stat-count');
		const statHigh = document.getElementById('stat-high');
		const statSoon = document.getElementById('stat-soon');
		const statAuto = document.getElementById('stat-auto');
		const queueStatus = document.getElementById('queue-status');
		const queueSubmit = document.getElementById('queue-submit');
		const bidderInput = document.getElementById('bidder-input');
		const amountInput = document.getElementById('amount-input');
		const executeInput = document.getElementById('execute-input');
		const attachToggle = document.getElementById('attach-offline-toggle');
		const offlineAttachment = document.getElementById('offline-attachment');
		const offlineTxBytesInput = document.getElementById('offline-tx-bytes');
		const offlineTxSignaturesInput = document.getElementById('offline-tx-signatures');

		const txStatus = document.getElementById('tx-status');
		const txResult = document.getElementById('tx-result');
		const txSubmit = document.getElementById('tx-submit');
		const txBytesInput = document.getElementById('tx-bytes');
		const txSignaturesInput = document.getElementById('tx-signatures');

		if (attachToggle && offlineAttachment) {
			attachToggle.addEventListener('change', () => {
				offlineAttachment.style.display = attachToggle.checked ? 'flex' : 'none';
			});
		}

		function setQueueStatus(message, type = 'info') {
			queueStatus.textContent = message || '';
			queueStatus.className = 'status-line ' + type;
		}

		function setTxStatus(message, type = 'info') {
			txStatus.textContent = message || '';
			txStatus.className = 'status-line ' + type;
		}

		async function loadBids() {
			try {
				const res = await fetch('/api/bids/' + NAME);
				if (!res.ok) throw new Error('Request failed');
				const data = await res.json();
				const bids = Array.isArray(data.bids) ? data.bids : [];
				renderBidStats(bids);
				renderBidList(bids);
			} catch (error) {
				console.error('Failed to load bids:', error);
				setQueueStatus('Unable to load queued bids right now.', 'error');
			}
		}

		function renderBidStats(bids) {
			statCount.textContent = String(bids.length);
			if (bids.length === 0) {
				statHigh.textContent = '0';
				statSoon.textContent = '—';
				if (statAuto) statAuto.textContent = '0';
				return;
			}
			const highest = bids.reduce((max, bid) => Math.max(max, Number(bid.amount) || 0), 0);
			statHigh.textContent = highest.toFixed(2);
			const soonest = bids.reduce((min, bid) => {
				const when = Number(bid.executeAt);
				return when && when < min ? when : min;
			}, Number.MAX_SAFE_INTEGER);
			statSoon.textContent = soonest === Number.MAX_SAFE_INTEGER ? '—' : formatDate(soonest);
			if (statAuto) {
				const autoCount = bids.filter(bid => bid.autoRelay).length;
				statAuto.textContent = String(autoCount);
			}
		}

		const HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

		function escapeHtml(value) {
			return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE[char] || char);
		}

		function renderBidList(bids) {
			if (bids.length === 0) {
				bidListEl.innerHTML = '<ul><li style="text-align:center;color:var(--muted);">No queued bids yet.</li></ul>';
				return;
			}
			const items = bids
				.slice()
				.sort((a, b) => Number(b.amount) - Number(a.amount))
				.slice(0, 10)
				.map((bid) => {
					const shortAddr = formatBidder(bid.bidder);
					const amt = Number(bid.amount).toFixed(2);
					const eta = formatDate(Number(bid.executeAt));
					const chips = [];
					if (bid.autoRelay) {
						chips.push('<span class="status-chip auto">Auto Relay</span>');
					}
					const statusLabel = formatBidStatusLabel(bid);
					if (statusLabel) {
						const statusClass = (bid.status || '').toLowerCase();
						chips.push('<span class="status-chip ' + statusClass + '">' + escapeHtml(statusLabel) + '</span>');
					}
					if (bid.resultDigest) {
						chips.push('<span class="digest-chip">' + escapeHtml(shortDigest(bid.resultDigest)) + '</span>');
					}
					if (bid.lastError && bid.status === 'failed') {
						chips.push('<span class="status-chip failed">' + escapeHtml(limitText(bid.lastError, 40)) + '</span>');
					}
					const metaRow = chips.length ? '<div class="bid-meta">' + chips.join('') + '</div>' : '';
					let row = '<li>';
					row += '<div class="bid-main">';
					row += '<span>' + escapeHtml(shortAddr) + '</span>';
					row += '<span>' + escapeHtml(amt) + ' SUI</span>';
					row += '<span>' + escapeHtml(eta) + '</span>';
					row += '</div>';
					row += metaRow;
					row += '</li>';
					return row;
				})
				.join('');
			bidListEl.innerHTML = '<ul>' + items + '</ul>';
		}

		function formatDate(value) {
			if (!value || Number.isNaN(value)) return '—';
			try {
				const date = new Date(Number(value));
				return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
			} catch {
				return '—';
			}
		}

		function formatBidder(value) {
			const str = String(value || '');
			return str.length > 12 ? str.slice(0, 8) + '…' + str.slice(-4) : str;
		}

		function formatBidStatusLabel(bid) {
			switch (bid.status) {
				case 'submitting':
					return 'Relaying…';
				case 'submitted':
					return 'Submitted';
				case 'failed':
					return 'Retry soon';
				case 'queued':
					return bid.autoRelay ? 'Auto-ready' : 'Queued';
				default:
					return bid.autoRelay ? 'Auto-ready' : '';
			}
		}

		function shortDigest(value) {
			const str = String(value || '');
			return str.length > 12 ? str.slice(0, 6) + '…' + str.slice(-4) : str;
		}

		function limitText(value, max) {
			const str = String(value || '');
			return str.length <= max ? str : str.slice(0, max - 1) + '…';
		}

		function parseExecuteAt(inputValue) {
			if (!inputValue) return Date.now() + 60 * 60 * 1000;
			const parsed = Date.parse(inputValue);
			return Number.isNaN(parsed) ? Date.now() + 60 * 60 * 1000 : parsed;
		}

		async function submitBid(event) {
			event.preventDefault();
			if (!CAN_REGISTER) {
				setQueueStatus('Names shorter than 3 characters cannot be registered.', 'error');
				return;
			}
			const bidder = bidderInput.value.trim();
			const amount = Number(amountInput.value);
			const executeAt = parseExecuteAt(executeInput.value);

			if (!bidder || !bidder.startsWith('0x')) {
				setQueueStatus('Enter a valid Sui address for the bidder.', 'error');
				return;
			}
			if (!amount || amount <= 0) {
				setQueueStatus('Enter a positive bid amount.', 'error');
			 return;
			}
			if (executeAt <= Date.now()) {
				setQueueStatus('Execution time must be in the future.', 'error');
				return;
			}

			let txBytes = '';
			let txSignatures = [];
			if (attachToggle?.checked) {
				txBytes = offlineTxBytesInput?.value.trim() || '';
				txSignatures = (offlineTxSignaturesInput?.value || '')
					.split(/[,\\n]+/)
					.map((entry) => entry.trim())
					.filter(Boolean);
				if (!txBytes) {
					setQueueStatus('Provide transaction bytes or disable the attachment toggle.', 'error');
					return;
				}
				if (txSignatures.length === 0) {
					setQueueStatus('Provide signatures for the offline attachment.', 'error');
					return;
				}
			}

			queueSubmit.disabled = true;
			setQueueStatus('Submitting bid...', 'info');

			try {
				const payload = { name: NAME, bidder, amount, executeAt };
				if (txBytes) payload.txBytes = txBytes;
				if (txSignatures.length) payload.signatures = txSignatures;

				const res = await fetch('/api/bids', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload),
				});
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.error || 'Queue failed');
				}
				setQueueStatus('Bid queued successfully.', 'success');
				if (attachToggle) {
					attachToggle.checked = false;
					if (offlineAttachment) offlineAttachment.style.display = 'none';
				}
				if (offlineTxBytesInput) offlineTxBytesInput.value = '';
				if (offlineTxSignaturesInput) offlineTxSignaturesInput.value = '';
				await loadBids();
			} catch (error) {
				setQueueStatus(error.message || 'Failed to queue bid.', 'error');
			} finally {
				queueSubmit.disabled = false;
			}
		}

		async function relayTransaction(event) {
			event.preventDefault();
			const txBytes = txBytesInput.value.trim();
			const signatures = txSignaturesInput.value
				.split(/[,\\n]+/)
				.map((s) => s.trim())
				.filter(Boolean);

			if (!txBytes) {
				setTxStatus('Provide base64-encoded transaction bytes.', 'error');
				return;
			}
			if (signatures.length === 0) {
				setTxStatus('Provide at least one signature.', 'error');
				return;
			}

			txSubmit.disabled = true;
			setTxStatus('Relaying signed transaction...', 'info');
			txResult.style.display = 'none';

			try {
				const res = await fetch('/api/register/submit', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ txBytes, signatures }),
				});

				const data = await res.json().catch(() => ({}));
				if (!res.ok || data.error) {
					const message = data.error?.message || data.error || 'Relay failed';
					throw new Error(message);
				}

				txResult.textContent = JSON.stringify(data, null, 2);
				txResult.style.display = 'block';
				setTxStatus('Transaction submitted to Sui RPC.', 'success');
			} catch (error) {
				setTxStatus(error.message || 'Failed to relay transaction.', 'error');
			} finally {
				txSubmit.disabled = false;
			}
		}

		loadBids();
		setInterval(loadBids, 60_000);
		document.getElementById('queue-form').addEventListener('submit', submitBid);
		document.getElementById('tx-form').addEventListener('submit', relayTransaction);
	})();
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

	// Ensure error message is surfaced even if RPC response omits details
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
