import type { Env } from '../types'
import { generateWalletKitJs } from '../utils/wallet-kit-js'
import { generateWalletSessionJs } from '../utils/wallet-session-js'
import { generateWalletTxJs } from '../utils/wallet-tx-js'
import { generateWalletUiCss, generateWalletUiJs } from '../utils/wallet-ui-js'
import { subnameCapStyles } from './subnamecap-ui.css'

export function generateSubnameCapPage(env: Env): string {
	const network = env.SUI_NETWORK
	const subdomainsPackageId = env.SUBNAMECAP_SUBDOMAINS_PACKAGE_ID || ''

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>SubnameCap Manager | sui.ski</title>
	<meta name="description" content="Manage SuiNS subdomain delegation with SubnameCaps">
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
	<style>${subnameCapStyles}
	${generateWalletUiCss()}</style>
</head>
<body>
	<div class="container">
		<a href="/" class="back-link">&larr; Back to sui.ski</a>

		<div class="header">
			<h1>SubnameCap Manager</h1>
			<div class="header-actions">
				<span class="status-dot ${subdomainsPackageId ? 'online' : 'offline'}"></span>
				<span style="font-size: 0.8rem; color: var(--text-muted);">${network}</span>
				<div id="wk-widget"></div>
			</div>
		</div>

		<div class="info-banner" id="config-banner" style="${subdomainsPackageId ? 'display:none' : ''}">
			SubnameCap contracts are not configured. Set SUBNAMECAP_* environment variables for the active Sui network.
		</div>

		<div class="tabs">
			<button class="tab active" onclick="switchTab('my-caps')">My Caps</button>
			<button class="tab" onclick="switchTab('create-cap')">Create Cap</button>
			<button class="tab" onclick="switchTab('create-subname')">Create Subname</button>
			<button class="tab" onclick="switchTab('subnames')">Subnames</button>
			<button class="tab" onclick="switchTab('domain-caps')">Domain Caps</button>
			<button class="tab" onclick="switchTab('jackets')">Jackets</button>
		</div>

		<!-- My Caps Tab -->
		<div id="tab-my-caps" class="tab-content active">
			<div class="card">
				<div class="card-title">My SubnameCaps</div>
				<div id="my-caps-list" class="cap-list">
					<div class="empty-state">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
							<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
						</svg>
						<p>Connect your wallet to view SubnameCaps</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Create Cap Tab -->
		<div id="tab-create-cap" class="tab-content">
			<div class="card">
				<div class="card-title">Create SubnameCap</div>
				<p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
					Delegate subdomain creation rights by creating a SubnameCap for a domain you own.
				</p>
				<form id="create-cap-form" onsubmit="handleCreateCap(event)">
					<div class="form-group">
						<label class="form-label" for="parent-nft-id">Parent NFT Object ID</label>
						<input type="text" id="parent-nft-id" class="form-input"
							placeholder="0x..." required>
					</div>
					<div class="form-row">
						<div class="checkbox-group">
							<input type="checkbox" id="allow-leaf" checked>
							<label for="allow-leaf">Allow leaf creation</label>
						</div>
						<div class="checkbox-group">
							<input type="checkbox" id="allow-node">
							<label for="allow-node">Allow node creation</label>
						</div>
					</div>
					<div class="form-row">
						<div class="checkbox-group">
							<input type="checkbox" id="default-node-allow-creation" checked>
							<label for="default-node-allow-creation">Default: nodes allow sub-creation</label>
						</div>
						<div class="checkbox-group">
							<input type="checkbox" id="default-node-allow-extension">
							<label for="default-node-allow-extension">Default: nodes allow time extension</label>
						</div>
					</div>
					<div class="form-group">
						<label class="form-label" for="cap-max-uses">Max Uses (optional)</label>
						<input type="number" id="cap-max-uses" class="form-input"
							placeholder="Unlimited" min="1">
					</div>
					<div class="form-group">
						<label class="form-label" for="cap-max-duration">Max Duration per Subname (ms, optional)</label>
						<input type="number" id="cap-max-duration" class="form-input"
							placeholder="Unlimited" min="1">
					</div>
					<div class="form-group">
						<label class="form-label" for="cap-expiration">Cap Expiration (ms timestamp, optional)</label>
						<input type="number" id="cap-expiration" class="form-input"
							placeholder="Never expires" min="1">
					</div>
					<button type="submit" class="btn btn-primary" id="create-cap-btn">Create SubnameCap</button>
				</form>
			</div>
		</div>

		<!-- Create Subname Tab -->
		<div id="tab-create-subname" class="tab-content">
			<div class="card">
				<div class="card-title">Create Leaf Subname</div>
				<p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
					Use a SubnameCap to create a leaf subdomain pointing to a target address.
				</p>
				<form id="create-subname-form" onsubmit="handleCreateSubname(event)">
					<div class="form-group">
						<label class="form-label" for="cap-object-id">SubnameCap Object ID</label>
						<input type="text" id="cap-object-id" class="form-input"
							placeholder="0x..." required>
					</div>
					<div class="form-group">
						<label class="form-label" for="subdomain-name">Subdomain Name</label>
						<input type="text" id="subdomain-name" class="form-input"
							placeholder="e.g., alice.example.sui" required>
					</div>
					<div class="form-group">
						<label class="form-label" for="target-address">Target Address</label>
						<input type="text" id="target-address" class="form-input"
							placeholder="0x..." required>
					</div>
					<button type="submit" class="btn btn-primary" id="create-subname-btn">Create Subname</button>
				</form>
			</div>

			<div class="card">
				<div class="card-title">Create Node Subname</div>
				<p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
					Create a node subdomain that can have its own subdomains.
				</p>
				<form id="create-node-form" onsubmit="handleCreateNode(event)">
					<div class="form-group">
						<label class="form-label" for="node-cap-id">SubnameCap Object ID</label>
						<input type="text" id="node-cap-id" class="form-input"
							placeholder="0x..." required>
					</div>
					<div class="form-group">
						<label class="form-label" for="node-subdomain-name">Subdomain Name</label>
						<input type="text" id="node-subdomain-name" class="form-input"
							placeholder="e.g., team.example.sui" required>
					</div>
					<div class="form-group">
						<label class="form-label" for="node-expiration">Expiration (days from now)</label>
						<input type="number" id="node-expiration" class="form-input"
							value="365" min="1" required>
					</div>
					<p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 12px;">
						Node permissions (allow creation, allow extension) are inherited from the SubnameCap defaults.
					</p>
					<button type="submit" class="btn btn-primary" id="create-node-btn">Create Node Subname</button>
				</form>
			</div>
		</div>

		<!-- Subnames Tab -->
		<div id="tab-subnames" class="tab-content">
			<div class="card">
				<div class="card-title">Lookup Domain Subnames</div>
				<div style="display: flex; gap: 12px; margin-bottom: 16px;">
					<input type="text" id="lookup-domain" class="form-input"
						placeholder="example.sui" style="flex: 1;">
					<button class="btn btn-secondary" onclick="lookupSubnames()">Search</button>
				</div>
				<div id="subnames-list" class="subname-list">
					<div class="empty-state">
						<p>Enter a domain to view its subnames</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Domain Caps Tab -->
		<div id="tab-domain-caps" class="tab-content">
			<div class="card">
				<div class="card-title">Active Caps for Domain</div>
				<div style="display: flex; gap: 12px; margin-bottom: 16px;">
					<input type="text" id="domain-caps-input" class="form-input"
						placeholder="example.sui" style="flex: 1;">
					<button class="btn btn-secondary" onclick="lookupDomainCaps()">Search</button>
				</div>
				<div id="domain-caps-list" class="cap-list">
					<div class="empty-state">
						<p>Enter a domain to view its active caps</p>
					</div>
				</div>
			</div>
		</div>
		<!-- Jackets Tab -->
		<div id="tab-jackets" class="tab-content">
			<div class="card">
				<div class="card-title">Create Jacket</div>
				<p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
					A jacket wraps a SubnameCap with policy constraints. Single-use creates a one-time voucher that self-destructs after creating one subname.
				</p>
				<form id="create-jacket-form" onsubmit="handleCreateJacket(event)">
					<div class="form-group">
						<label class="form-label" for="jacket-type">Jacket Type</label>
						<select id="jacket-type" class="form-input" onchange="updateJacketFields()">
							<option value="single-use">Single-Use (one subname, then destroyed)</option>
							<option value="fee">Fee Jacket</option>
							<option value="allowlist">Allowlist Jacket</option>
							<option value="ratelimit">Rate Limit Jacket</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="jacket-parent-nft">Parent NFT Object ID</label>
						<input type="text" id="jacket-parent-nft" class="form-input" placeholder="0x..." required>
					</div>
						<div id="single-use-jacket-fields">
							<div class="form-group">
								<label class="form-label" for="jacket-recipient">Recipient Address or SuiNS Name (who receives the voucher)</label>
								<input type="text" id="jacket-recipient" class="form-input" placeholder="0x... or alice.sui (defaults to you)">
							</div>
							<div class="form-group">
								<label class="form-label" for="jacket-subname-type">Subname Type</label>
								<select id="jacket-subname-type" class="form-input">
								<option value="leaf">Leaf (permanent, no sub-subdomains)</option>
								<option value="node">Node (has expiration, can have sub-subdomains)</option>
							</select>
						</div>
					</div>
					<div id="fee-jacket-fields" style="display:none;">
						<div class="form-group">
							<label class="form-label" for="jacket-leaf-fee">Leaf Fee (MIST)</label>
							<input type="number" id="jacket-leaf-fee" class="form-input" value="1000000000" min="0">
						</div>
						<div class="form-group">
							<label class="form-label" for="jacket-node-fee">Node Fee (MIST)</label>
							<input type="number" id="jacket-node-fee" class="form-input" value="5000000000" min="0">
						</div>
						<div class="form-group">
							<label class="form-label" for="jacket-fee-recipient">Fee Recipient Address</label>
							<input type="text" id="jacket-fee-recipient" class="form-input" placeholder="0x...">
						</div>
					</div>
					<div id="ratelimit-jacket-fields" style="display:none;">
						<div class="form-group">
							<label class="form-label" for="jacket-max-per-window">Max Per Window</label>
							<input type="number" id="jacket-max-per-window" class="form-input" value="10" min="1">
						</div>
						<div class="form-group">
							<label class="form-label" for="jacket-window-duration">Window Duration (hours)</label>
							<input type="number" id="jacket-window-duration" class="form-input" value="1" min="1">
						</div>
					</div>
					<button type="submit" class="btn btn-primary" id="create-jacket-btn">Create Jacket</button>
				</form>
			</div>

			<div class="card">
				<div class="card-title">Jacket Info</div>
				<p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
					Look up jacket configuration by object ID.
				</p>
				<div style="display: flex; gap: 12px; margin-bottom: 16px;">
					<select id="jacket-lookup-type" class="form-input" style="width: 140px;">
						<option value="fee">Fee</option>
						<option value="allowlist">Allowlist</option>
						<option value="ratelimit">Rate Limit</option>
					</select>
					<input type="text" id="jacket-lookup-id" class="form-input" placeholder="Jacket Object ID (0x...)" style="flex: 1;">
					<button class="btn btn-secondary" onclick="lookupJacket()">Lookup</button>
				</div>
				<div id="jacket-info-result">
					<div class="empty-state"><p>Enter a jacket ID to view its configuration</p></div>
				</div>
			</div>

			<div class="card">
				<div class="card-title">Create Subname via Jacket</div>
				<p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 20px;">
					Use a jacket to create a leaf subdomain with its policy applied.
				</p>
				<form id="jacket-create-leaf-form" onsubmit="handleJacketCreateLeaf(event)">
					<div class="form-group">
						<label class="form-label" for="jacket-leaf-type">Jacket Type</label>
						<select id="jacket-leaf-type" class="form-input" onchange="updateJacketUseFields()">
							<option value="single-use-leaf">Single-Use Voucher (leaf)</option>
							<option value="single-use-node">Single-Use Voucher (node)</option>
							<option value="fee">Fee Jacket</option>
							<option value="allowlist">Allowlist Jacket</option>
							<option value="ratelimit">Rate Limit Jacket</option>
						</select>
					</div>
					<div class="form-group">
						<label class="form-label" for="jacket-leaf-id">Jacket / Voucher Object ID</label>
						<input type="text" id="jacket-leaf-id" class="form-input" placeholder="0x..." required>
					</div>
					<div class="form-group">
						<label class="form-label" for="jacket-leaf-name">Subdomain Name</label>
						<input type="text" id="jacket-leaf-name" class="form-input" placeholder="e.g., alice.example.sui" required>
					</div>
					<div class="form-group" id="jacket-use-target-group">
						<label class="form-label" for="jacket-leaf-target">Target Address</label>
						<input type="text" id="jacket-leaf-target" class="form-input" placeholder="0x...">
					</div>
					<div id="jacket-use-node-fields" style="display:none;">
						<div class="form-group">
							<label class="form-label" for="jacket-use-expiration">Expiration (days from now)</label>
							<input type="number" id="jacket-use-expiration" class="form-input" value="365" min="1">
						</div>
					</div>
					<button type="submit" class="btn btn-primary" id="jacket-create-leaf-btn">Create Subname</button>
				</form>
			</div>
		</div>
	</div>

	<div id="wk-modal"></div>

	<!-- Toast -->
	<div id="toast" class="toast"></div>

	<!-- Revoke Modal -->
	<div id="revoke-modal" class="modal-overlay">
		<div class="modal">
			<div class="modal-title">Revoke SubnameCap</div>
			<p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 12px;">
				This will revoke the selected cap. The cap holder will no longer be able to create subdomains.
			</p>
			<div class="form-group">
				<label class="form-label">Parent NFT Object ID</label>
				<input type="text" id="revoke-parent-nft" class="form-input" placeholder="0x...">
			</div>
			<input type="hidden" id="revoke-cap-id">
			<div class="modal-actions">
				<button class="btn btn-secondary" onclick="closeModal('revoke-modal')">Cancel</button>
				<button class="btn btn-danger" onclick="handleRevokeCap()">Revoke Cap</button>
			</div>
		</div>
	</div>

	<!-- Surrender Modal -->
	<div id="surrender-modal" class="modal-overlay">
		<div class="modal">
			<div class="modal-title">Surrender SubnameCap</div>
			<p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 12px;">
				Surrendering destroys this cap permanently. You will no longer be able to create subdomains with it.
			</p>
			<input type="hidden" id="surrender-cap-id">
			<div class="modal-actions">
				<button class="btn btn-secondary" onclick="closeModal('surrender-modal')">Cancel</button>
				<button class="btn btn-danger" onclick="handleSurrenderCap()">Surrender Cap</button>
			</div>
		</div>
	</div>

	<script type="module">
		${generateWalletSessionJs()}
		${generateWalletKitJs({ network: env.SUI_NETWORK, autoConnect: true })}
		${generateWalletTxJs()}
		${generateWalletUiJs({ onConnect: 'onWalletConnected' })}
		const API_BASE = '/api/subnamecap';

		window.switchTab = function(tabId) {
			document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
			document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
			document.getElementById('tab-' + tabId).classList.add('active');
			event.target.classList.add('active');
		};

		window.showToast = function(message, type = 'success') {
			const toast = document.getElementById('toast');
			toast.textContent = message;
			toast.className = 'toast ' + type + ' show';
			setTimeout(() => { toast.classList.remove('show'); }, 3000);
		};

		window.closeModal = function(id) {
			document.getElementById(id).classList.remove('show');
		};

		async function loadMyCaps() {
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) return;

			const listEl = document.getElementById('my-caps-list');
			listEl.innerHTML = '<div style="text-align:center;padding:20px;"><div class="spinner"></div></div>';

			try {
				const res = await fetch(API_BASE + '/caps/owned/' + connectedAddress);
				const data = await res.json();

				if (!data.caps || data.caps.length === 0) {
					listEl.innerHTML = '<div class="empty-state"><p>No SubnameCaps found</p></div>';
					return;
				}

				let html = '';
				for (const cap of data.caps) {
					html += renderCapItem(cap);
				}
				listEl.innerHTML = html;
			} catch (err) {
				listEl.innerHTML = '<div class="empty-state"><p>Failed to load caps</p></div>';
			}
		}

		function renderCapItem(cap) {
			const badges = [];
			if (cap.allowLeafCreation) badges.push('<span class="badge badge-leaf">Leaf</span>');
			if (cap.allowNodeCreation) badges.push('<span class="badge badge-node">Node</span>');
			if (cap.maxUses != null) badges.push('<span class="badge" style="background:var(--text-muted);color:white;">Uses: ' + (cap.usesCount || 0) + '/' + cap.maxUses + '</span>');
			if (cap.maxDurationMs != null) badges.push('<span class="badge" style="background:var(--text-muted);color:white;">Max ' + (cap.maxDurationMs / 86400000).toFixed(0) + 'd</span>');
			if (cap.capExpirationMs != null) badges.push('<span class="badge" style="background:var(--text-muted);color:white;">Exp ' + new Date(cap.capExpirationMs).toLocaleDateString() + '</span>');

			return '<div class="cap-item">' +
				'<div class="cap-info">' +
					'<div class="cap-domain">' + escapeHtml(cap.parentDomain) + '</div>' +
					'<div class="cap-id">' + cap.capId + '</div>' +
					'<div class="cap-badges">' + badges.join('') + '</div>' +
				'</div>' +
				'<div class="cap-actions">' +
					'<button class="btn btn-secondary btn-sm" onclick="prefillCreateSubname(\\'' + cap.capId + '\\')">Use</button>' +
					'<button class="btn btn-danger btn-sm" onclick="openSurrenderModal(\\'' + cap.capId + '\\')">Surrender</button>' +
				'</div>' +
			'</div>';
		}

		function escapeHtml(str) {
			const div = document.createElement('div');
			div.textContent = str;
			return div.innerHTML;
		}

		window.prefillCreateSubname = function(capId) {
			document.getElementById('cap-object-id').value = capId;
			switchTabDirect('create-subname');
		};

		function switchTabDirect(tabId) {
			document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
			document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
			document.getElementById('tab-' + tabId).classList.add('active');
			const tabs = document.querySelectorAll('.tab');
			for (const t of tabs) {
				if (t.textContent.toLowerCase().replace(/\\s+/g, '-') === tabId ||
					t.textContent.toLowerCase().includes(tabId.split('-').pop())) {
					t.classList.add('active');
					break;
				}
			}
		}

		window.openSurrenderModal = function(capId) {
			document.getElementById('surrender-cap-id').value = capId;
			document.getElementById('surrender-modal').classList.add('show');
		};

		window.openRevokeModal = function(capId) {
			document.getElementById('revoke-cap-id').value = capId;
			document.getElementById('revoke-modal').classList.add('show');
		};

		window.handleCreateCap = async function(e) {
			e.preventDefault();
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) { showToast('Connect wallet first', 'error'); return; }

			const btn = document.getElementById('create-cap-btn');
			btn.disabled = true;
			btn.innerHTML = '<div class="spinner"></div> Building...';

			try {
				const capMaxUses = document.getElementById('cap-max-uses').value;
				const capMaxDuration = document.getElementById('cap-max-duration').value;
				const capExpiration = document.getElementById('cap-expiration').value;
				const res = await fetch(API_BASE + '/create-cap', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						parentNftId: document.getElementById('parent-nft-id').value.trim(),
						allowLeafCreation: document.getElementById('allow-leaf').checked,
						allowNodeCreation: document.getElementById('allow-node').checked,
						defaultNodeAllowCreation: document.getElementById('default-node-allow-creation').checked,
						defaultNodeAllowExtension: document.getElementById('default-node-allow-extension').checked,
						maxUses: capMaxUses ? parseInt(capMaxUses) : undefined,
						maxDurationMs: capMaxDuration ? parseInt(capMaxDuration) : undefined,
						capExpirationMs: capExpiration ? parseInt(capExpiration) : undefined,
						senderAddress: connectedAddress,
					}),
				});
				const data = await res.json();

				if (data.error) { showToast(data.error, 'error'); return; }

				const result = await SuiWalletKit.signAndExecute(data.txBytes);
				if (result) {
					showToast('SubnameCap created successfully!');
					loadMyCaps();
				}
			} catch (err) {
				showToast('Failed: ' + err.message, 'error');
			} finally {
				btn.disabled = false;
				btn.textContent = 'Create SubnameCap';
			}
		};

		window.handleCreateSubname = async function(e) {
			e.preventDefault();
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) { showToast('Connect wallet first', 'error'); return; }

			const btn = document.getElementById('create-subname-btn');
			btn.disabled = true;
			btn.innerHTML = '<div class="spinner"></div> Building...';

			try {
				const res = await fetch(API_BASE + '/create-leaf', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						capObjectId: document.getElementById('cap-object-id').value.trim(),
						subdomainName: document.getElementById('subdomain-name').value.trim(),
						targetAddress: document.getElementById('target-address').value.trim(),
						senderAddress: connectedAddress,
					}),
				});
				const data = await res.json();

				if (data.error) { showToast(data.error, 'error'); return; }

				const result = await SuiWalletKit.signAndExecute(data.txBytes);
				if (result) {
					showToast('Leaf subname created!');
				}
			} catch (err) {
				showToast('Failed: ' + err.message, 'error');
			} finally {
				btn.disabled = false;
				btn.textContent = 'Create Subname';
			}
		};

		window.handleCreateNode = async function(e) {
			e.preventDefault();
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) { showToast('Connect wallet first', 'error'); return; }

			const btn = document.getElementById('create-node-btn');
			btn.disabled = true;
			btn.innerHTML = '<div class="spinner"></div> Building...';

			try {
				const days = parseInt(document.getElementById('node-expiration').value);
				const expirationTimestampMs = Date.now() + (days * 24 * 60 * 60 * 1000);

				const res = await fetch(API_BASE + '/create-node', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						capObjectId: document.getElementById('node-cap-id').value.trim(),
						subdomainName: document.getElementById('node-subdomain-name').value.trim(),
						expirationTimestampMs,
						senderAddress: connectedAddress,
					}),
				});
				const data = await res.json();

				if (data.error) { showToast(data.error, 'error'); return; }

				const result = await SuiWalletKit.signAndExecute(data.txBytes);
				if (result) {
					showToast('Node subname created!');
				}
			} catch (err) {
				showToast('Failed: ' + err.message, 'error');
			} finally {
				btn.disabled = false;
				btn.textContent = 'Create Node Subname';
			}
		};

		window.handleRevokeCap = async function() {
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) { showToast('Connect wallet first', 'error'); return; }

			const capId = document.getElementById('revoke-cap-id').value;
			const parentNftId = document.getElementById('revoke-parent-nft').value.trim();

			if (!parentNftId) { showToast('Parent NFT ID is required', 'error'); return; }

			try {
				const res = await fetch(API_BASE + '/revoke-cap', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						parentNftId,
						capId,
						senderAddress: connectedAddress,
					}),
				});
				const data = await res.json();

				if (data.error) { showToast(data.error, 'error'); return; }

				const result = await SuiWalletKit.signAndExecute(data.txBytes);
				if (result) {
					showToast('Cap revoked');
					closeModal('revoke-modal');
					lookupDomainCaps();
				}
			} catch (err) {
				showToast('Failed: ' + err.message, 'error');
			}
		};

		window.handleSurrenderCap = async function() {
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) { showToast('Connect wallet first', 'error'); return; }

			const capId = document.getElementById('surrender-cap-id').value;

			try {
				const res = await fetch(API_BASE + '/surrender-cap', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						capObjectId: capId,
						senderAddress: connectedAddress,
					}),
				});
				const data = await res.json();

				if (data.error) { showToast(data.error, 'error'); return; }

				const result = await SuiWalletKit.signAndExecute(data.txBytes);
				if (result) {
					showToast('Cap surrendered');
					closeModal('surrender-modal');
					loadMyCaps();
				}
			} catch (err) {
				showToast('Failed: ' + err.message, 'error');
			}
		};

		window.lookupDomainCaps = async function() {
			const domain = document.getElementById('domain-caps-input').value.trim();
			if (!domain) { showToast('Enter a domain', 'error'); return; }

			const listEl = document.getElementById('domain-caps-list');
			listEl.innerHTML = '<div style="text-align:center;padding:20px;"><div class="spinner"></div></div>';

			try {
				const res = await fetch(API_BASE + '/caps/' + encodeURIComponent(domain));
				const data = await res.json();

				if (!data.caps || data.caps.length === 0) {
					listEl.innerHTML = '<div class="empty-state"><p>No active caps for ' + escapeHtml(domain) + '</p></div>';
					return;
				}

				let html = '';
				for (const cap of data.caps) {
					const badges = [];
					if (cap.allowLeaf) badges.push('<span class="badge badge-leaf">Leaf</span>');
					if (cap.allowNode) badges.push('<span class="badge badge-node">Node</span>');
					if (cap.maxUses != null) badges.push('<span class="badge" style="background:var(--text-muted);color:white;">Max ' + cap.maxUses + ' uses</span>');
					if (cap.maxDurationMs != null) badges.push('<span class="badge" style="background:var(--text-muted);color:white;">Max ' + (cap.maxDurationMs / 86400000).toFixed(0) + 'd</span>');
					if (cap.capExpirationMs != null) badges.push('<span class="badge" style="background:var(--text-muted);color:white;">Exp ' + new Date(cap.capExpirationMs).toLocaleDateString() + '</span>');

					html += '<div class="cap-item">' +
						'<div class="cap-info">' +
							'<div class="cap-id">' + cap.capId + '</div>' +
							'<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Created: ' + new Date(cap.createdAtMs).toLocaleDateString() + '</div>' +
							'<div class="cap-badges">' + badges.join('') + '</div>' +
						'</div>' +
						'<div class="cap-actions">' +
							'<button class="btn btn-danger btn-sm" onclick="openRevokeModal(\\'' + cap.capId + '\\')">Revoke</button>' +
						'</div>' +
					'</div>';
				}
				listEl.innerHTML = html;
			} catch (err) {
				listEl.innerHTML = '<div class="empty-state"><p>Failed to load caps</p></div>';
			}
		};

		window.updateJacketUseFields = function() {
			const type = document.getElementById('jacket-leaf-type').value;
			const isNode = type === 'single-use-node';
			document.getElementById('jacket-use-node-fields').style.display = isNode ? 'block' : 'none';
			document.getElementById('jacket-use-target-group').style.display = isNode ? 'none' : 'block';
		};

		window.updateJacketFields = function() {
			const type = document.getElementById('jacket-type').value;
			document.getElementById('single-use-jacket-fields').style.display = type === 'single-use' ? 'block' : 'none';
			document.getElementById('fee-jacket-fields').style.display = type === 'fee' ? 'block' : 'none';
			document.getElementById('ratelimit-jacket-fields').style.display = type === 'ratelimit' ? 'block' : 'none';
		};

		window.handleCreateJacket = async function(e) {
			e.preventDefault();
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) { showToast('Connect wallet first', 'error'); return; }

			const btn = document.getElementById('create-jacket-btn');
			btn.disabled = true;
			btn.innerHTML = '<div class="spinner"></div> Building...';

			try {
				const type = document.getElementById('jacket-type').value;
				const parentNftId = document.getElementById('jacket-parent-nft').value.trim();
				let endpoint, body;

					if (type === 'single-use') {
						endpoint = '/jacket/single-use/create';
						const subnameType = document.getElementById('jacket-subname-type').value;
						const recipientInput = document.getElementById('jacket-recipient').value.trim();
						body = {
							parentNftId,
							allowNodeCreation: subnameType === 'node',
							senderAddress: connectedAddress,
						};
						if (recipientInput) {
							if (recipientInput.startsWith('0x')) {
								body.recipientAddress = recipientInput;
							} else {
								body.recipientName = recipientInput;
							}
						}
					} else if (type === 'fee') {
						endpoint = '/jacket/fee/create';
						body = {
						parentNftId,
						leafFee: parseInt(document.getElementById('jacket-leaf-fee').value),
						nodeFee: parseInt(document.getElementById('jacket-node-fee').value),
						feeRecipient: document.getElementById('jacket-fee-recipient').value.trim() || connectedAddress,
						senderAddress: connectedAddress,
					};
				} else if (type === 'allowlist') {
					endpoint = '/jacket/allowlist/create';
					body = { parentNftId, senderAddress: connectedAddress };
				} else {
					endpoint = '/jacket/ratelimit/create';
					const hours = parseInt(document.getElementById('jacket-window-duration').value);
					body = {
						parentNftId,
						maxPerWindow: parseInt(document.getElementById('jacket-max-per-window').value),
						windowDurationMs: hours * 3600000,
						senderAddress: connectedAddress,
					};
				}

				const res = await fetch(API_BASE + endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				});
					const data = await res.json();

					if (data.error) { showToast(data.error, 'error'); return; }

					if (data.requiresRecipientFallbackConfirmation) {
						const warning =
							data.recipientFallbackMessage ||
							'No target address found for the provided SuiNS name. Default recipient is your connected wallet.';
						const proceed = window.confirm(warning + '\n\nContinue with self as recipient?');
						if (!proceed) {
							showToast('Cancelled jacket creation', 'error');
							return;
						}
					}

						const result = await SuiWalletKit.signAndExecute(data.txBytes);
						if (result) {
							const recipientSummary = data.recipientAddress
								? ' Voucher recipient: ' + data.recipientAddress.slice(0, 6) + '...' + data.recipientAddress.slice(-4)
							: '';
						showToast('Jacket created successfully!' + recipientSummary);
					}
				} catch (err) {
					showToast('Failed: ' + err.message, 'error');
				} finally {
				btn.disabled = false;
				btn.textContent = 'Create Jacket';
			}
		};

		window.lookupJacket = async function() {
			const type = document.getElementById('jacket-lookup-type').value;
			const jacketId = document.getElementById('jacket-lookup-id').value.trim();
			if (!jacketId) { showToast('Enter a jacket ID', 'error'); return; }

			const resultEl = document.getElementById('jacket-info-result');
			resultEl.innerHTML = '<div style="text-align:center;padding:20px;"><div class="spinner"></div></div>';

			try {
				const res = await fetch(API_BASE + '/jacket/' + type + '/' + encodeURIComponent(jacketId));
				const data = await res.json();

				if (data.error) {
					resultEl.innerHTML = '<div class="empty-state"><p>' + escapeHtml(data.error) + '</p></div>';
					return;
				}

				let html = '<div class="cap-item"><div class="cap-info">';
				html += '<div class="cap-domain">' + type.charAt(0).toUpperCase() + type.slice(1) + ' Jacket</div>';
				html += '<div class="cap-id">' + escapeHtml(data.jacketId) + '</div>';

				if (type === 'fee') {
					const leafSui = (parseInt(data.leafFee) / 1e9).toFixed(2);
					const nodeSui = (parseInt(data.nodeFee) / 1e9).toFixed(2);
					html += '<div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted);">';
					html += 'Leaf fee: ' + leafSui + ' SUI | Node fee: ' + nodeSui + ' SUI<br>';
					html += 'Recipient: ' + escapeHtml(data.feeRecipient).slice(0, 10) + '...' + escapeHtml(data.feeRecipient).slice(-4);
					html += '</div>';
				} else if (type === 'ratelimit') {
					const windowHrs = (parseInt(data.windowDurationMs) / 3600000).toFixed(1);
					html += '<div style="margin-top:8px;font-size:0.85rem;color:var(--text-muted);">';
					html += 'Max: ' + data.maxPerWindow + ' per ' + windowHrs + 'h window';
					html += '</div>';
				}

				const pauseBadge = data.paused
					? '<span class="badge" style="background:var(--error);color:white;">Paused</span>'
					: '<span class="badge badge-leaf">Active</span>';
				html += '<div class="cap-badges">' + pauseBadge + '</div>';
				html += '</div></div>';
				resultEl.innerHTML = html;
			} catch (err) {
				resultEl.innerHTML = '<div class="empty-state"><p>Failed to fetch jacket info</p></div>';
			}
		};

		window.handleJacketCreateLeaf = async function(e) {
			e.preventDefault();
			const connectedAddress = SuiWalletKit.$connection.value.address;
			if (!connectedAddress) { showToast('Connect wallet first', 'error'); return; }

			const btn = document.getElementById('jacket-create-leaf-btn');
			btn.disabled = true;
			btn.innerHTML = '<div class="spinner"></div> Building...';

			try {
				const type = document.getElementById('jacket-leaf-type').value;
				const jacketObjectId = document.getElementById('jacket-leaf-id').value.trim();
				const subdomainName = document.getElementById('jacket-leaf-name').value.trim();
				const targetAddress = document.getElementById('jacket-leaf-target').value.trim();

				let endpoint;
				const body = { jacketObjectId, subdomainName, targetAddress, senderAddress: connectedAddress };

				if (type === 'single-use-leaf') {
					endpoint = '/jacket/single-use/use-leaf';
				} else if (type === 'single-use-node') {
					endpoint = '/jacket/single-use/use-node';
					body.expirationDays = parseInt(document.getElementById('jacket-use-expiration').value);
				} else {
					endpoint = '/jacket/' + type + '/create-leaf';
					if (type === 'fee') {
						const infoRes = await fetch(API_BASE + '/jacket/fee/' + encodeURIComponent(jacketObjectId));
						const info = await infoRes.json();
						body.feeMist = parseInt(info.leafFee || '1000000000');
					}
				}

				const res = await fetch(API_BASE + endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				});
				const data = await res.json();

				if (data.error) { showToast(data.error, 'error'); return; }

				const result = await SuiWalletKit.signAndExecute(data.txBytes);
				if (result) { showToast('Subname created via jacket!'); }
			} catch (err) {
				showToast('Failed: ' + err.message, 'error');
			} finally {
				btn.disabled = false;
				btn.textContent = 'Create Subname';
			}
		};

		window.lookupSubnames = async function() {
			const domain = document.getElementById('lookup-domain').value.trim();
			if (!domain) { showToast('Enter a domain', 'error'); return; }

			const listEl = document.getElementById('subnames-list');
			listEl.innerHTML = '<div style="text-align:center;padding:20px;"><div class="spinner"></div></div>';

			try {
				const res = await fetch('/api/resolve?name=' + encodeURIComponent(domain));
				const data = await res.json();

				if (data.error || !data.found) {
					listEl.innerHTML = '<div class="empty-state"><p>No subnames found for ' + escapeHtml(domain) + '</p></div>';
					return;
				}

				listEl.innerHTML = '<div class="subname-item">' +
					'<div>' +
						'<div class="subname-name">' + escapeHtml(domain) + '</div>' +
						'<div class="subname-target">' + (data.data?.address || 'No target') + '</div>' +
					'</div>' +
				'</div>';
			} catch (err) {
				listEl.innerHTML = '<div class="empty-state"><p>Failed to resolve domain</p></div>';
			}
		};

		SuiWalletKit.renderModal('wk-modal');
		SuiWalletKit.renderWidget('wk-widget');

		window.onWalletConnected = function() {
			loadMyCaps();
		};

		SuiWalletKit.detectWallets().then(function() {
			SuiWalletKit.autoReconnect();
		});
	</script>
</body>
</html>`
}
