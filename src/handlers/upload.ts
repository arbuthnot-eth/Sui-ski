import type { Env } from '../types'
import { htmlResponse } from '../utils/response'

/**
 * Handle upload page and API requests
 */
export async function handleUploadPage(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)

	// API endpoint for uploading to Walrus via publisher
	if (url.pathname === '/upload/api' && request.method === 'PUT') {
		return handleWalrusUpload(request, env)
	}

	// Serve the upload page
	return htmlResponse(generateUploadPage(env))
}

/**
 * Proxy upload to Walrus publisher (handles CORS)
 */
async function handleWalrusUpload(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const epochs = url.searchParams.get('epochs') || '1'

	// Public publishers (upload relay requires SDK with on-chain registration)
	const mainnetPublishers = [
		'https://walrus-mainnet-publisher-1.staketab.org/v1/blobs',
		'https://walrus-mainnet-publisher.nodes.guru/v1/blobs',
	]
	const testnetPublishers = ['https://publisher.walrus-testnet.walrus.space/v1/blobs']
	const publishers = env.WALRUS_NETWORK === 'mainnet' ? mainnetPublishers : testnetPublishers

	try {
		const body = await request.arrayBuffer()
		const contentType = request.headers.get('Content-Type') || 'application/octet-stream'

		let lastError: { status: number; message: string } | null = null

		for (const publisher of publishers) {
			const targetUrl = `${publisher}?epochs=${epochs}`

			try {
				const response = await fetch(targetUrl, {
					method: 'PUT',
					body,
					headers: { 'Content-Type': contentType },
				})

				const responseText = await response.text()
				let data: unknown = null
				if (responseText) {
					try {
						data = JSON.parse(responseText)
					} catch {
						data = null
					}
				}

				if (!response.ok) {
					const message =
						typeof data === 'object' && data !== null
							? String((data as { error?: unknown }).error || responseText || 'Upload failed')
							: responseText || 'Upload failed'
					lastError = { status: response.status, message }
					continue
				}

				return new Response(JSON.stringify(data), {
					status: response.status,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type',
					},
				})
			} catch {
				lastError = { status: 502, message: 'Network error' }
			}
		}

		return new Response(JSON.stringify({ error: lastError?.message || 'All publishers failed' }), {
			status: lastError?.status || 502,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Upload failed'
		return new Response(JSON.stringify({ error: message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		})
	}
}

function generateUploadPage(env: Env): string {
	const network = env.SUI_NETWORK
	const walrusNetwork = env.WALRUS_NETWORK || 'testnet'

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Upload to Walrus | sui.ski</title>
	<meta name="description" content="Upload files to Walrus decentralized storage with optional Seal encryption">
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			padding: 40px 20px;
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
		.container { max-width: 640px; margin: 0 auto; position: relative; }
		.header {
			text-align: center;
			margin-bottom: 32px;
		}
		.back-link {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			color: #71717a;
			text-decoration: none;
			font-size: 0.875rem;
			margin-bottom: 16px;
			transition: color 0.2s;
		}
		.back-link:hover { color: #60a5fa; }
		.back-link svg { width: 16px; height: 16px; }
		h1 {
			font-size: 2.5rem;
			font-weight: 800;
			margin-bottom: 0.5rem;
			background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			letter-spacing: -0.02em;
		}
		.tagline {
			color: #71717a;
			font-size: 1rem;
			margin-bottom: 1rem;
		}
		.badges {
			display: flex;
			justify-content: center;
			gap: 8px;
			flex-wrap: wrap;
		}
		.badge {
			display: inline-block;
			padding: 6px 12px;
			background: rgba(255, 255, 255, 0.08);
			border-radius: 8px;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}
		.badge.network {
			background: ${network === 'mainnet' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)'};
			color: ${network === 'mainnet' ? '#34d399' : '#fbbf24'};
		}
		.badge.walrus {
			background: rgba(96, 165, 250, 0.12);
			color: #60a5fa;
		}
		.card {
			background: rgba(22, 22, 30, 0.9);
			backdrop-filter: blur(20px);
			-webkit-backdrop-filter: blur(20px);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 16px;
			padding: 28px;
			margin-bottom: 20px;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05);
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
		.card h2 {
			font-size: 1.1rem;
			font-weight: 700;
			margin-bottom: 16px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.card h2 svg {
			width: 20px;
			height: 20px;
			color: #60a5fa;
		}

		/* Drop Zone */
		.drop-zone {
			border: 2px dashed rgba(96, 165, 250, 0.3);
			border-radius: 12px;
			padding: 48px 24px;
			text-align: center;
			cursor: pointer;
			transition: all 0.3s ease;
			background: rgba(30, 30, 40, 0.3);
		}
		.drop-zone:hover, .drop-zone.dragover {
			border-color: #60a5fa;
			background: rgba(96, 165, 250, 0.08);
		}
		.drop-zone.uploading {
			pointer-events: none;
			opacity: 0.7;
		}
		.drop-zone svg {
			width: 48px;
			height: 48px;
			color: #60a5fa;
			margin-bottom: 16px;
		}
		.drop-zone p {
			color: #71717a;
			margin-bottom: 8px;
		}
		.drop-zone .hint {
			font-size: 0.8rem;
			color: #52525b;
		}
		.file-input {
			display: none;
		}

		/* Options */
		.options {
			display: grid;
			gap: 16px;
			margin-top: 20px;
		}
		.option-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 14px 16px;
			background: rgba(30, 30, 40, 0.4);
			border: 1px solid rgba(255, 255, 255, 0.06);
			border-radius: 10px;
		}
		.option-label {
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.option-label svg {
			width: 18px;
			height: 18px;
			color: #71717a;
		}
		.option-label span {
			font-size: 0.9rem;
			font-weight: 500;
		}
		.option-label small {
			display: block;
			font-size: 0.75rem;
			color: #52525b;
			margin-top: 2px;
		}
		select, input[type="number"] {
			background: rgba(20, 20, 30, 0.8);
			border: 1px solid rgba(255, 255, 255, 0.1);
			color: #e4e4e7;
			padding: 8px 12px;
			border-radius: 8px;
			font-size: 0.875rem;
			min-width: 100px;
		}
		select:focus, input:focus {
			outline: none;
			border-color: #60a5fa;
		}

		/* Toggle switch */
		.toggle {
			position: relative;
			width: 48px;
			height: 26px;
		}
		.toggle input {
			opacity: 0;
			width: 0;
			height: 0;
		}
		.toggle-slider {
			position: absolute;
			cursor: pointer;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(40, 40, 50, 0.8);
			border-radius: 13px;
			transition: 0.3s;
		}
		.toggle-slider:before {
			position: absolute;
			content: "";
			height: 20px;
			width: 20px;
			left: 3px;
			bottom: 3px;
			background: #71717a;
			border-radius: 50%;
			transition: 0.3s;
		}
		.toggle input:checked + .toggle-slider {
			background: rgba(96, 165, 250, 0.3);
		}
		.toggle input:checked + .toggle-slider:before {
			transform: translateX(22px);
			background: #60a5fa;
		}
		.toggle input:disabled + .toggle-slider {
			opacity: 0.5;
			cursor: not-allowed;
		}

		/* Progress */
		.progress-container {
			display: none;
			margin-top: 20px;
		}
		.progress-container.visible {
			display: block;
		}
		.progress-bar {
			height: 6px;
			background: rgba(40, 40, 50, 0.8);
			border-radius: 3px;
			overflow: hidden;
		}
		.progress-fill {
			height: 100%;
			background: linear-gradient(90deg, #60a5fa, #a78bfa);
			border-radius: 3px;
			transition: width 0.3s ease;
			width: 0%;
		}
		.progress-status {
			margin-top: 10px;
			font-size: 0.85rem;
			color: #71717a;
			text-align: center;
		}

		/* Result */
		.result {
			display: none;
			margin-top: 20px;
			padding: 20px;
			background: rgba(52, 211, 153, 0.08);
			border: 1px solid rgba(52, 211, 153, 0.2);
			border-radius: 12px;
		}
		.result.visible {
			display: block;
		}
		.result.error {
			background: rgba(239, 68, 68, 0.08);
			border-color: rgba(239, 68, 68, 0.2);
		}
		.result h3 {
			font-size: 0.9rem;
			font-weight: 600;
			margin-bottom: 12px;
			color: #34d399;
			display: flex;
			align-items: center;
			gap: 8px;
		}
		.result.error h3 {
			color: #ef4444;
		}
		.result-row {
			display: flex;
			align-items: flex-start;
			gap: 10px;
			margin-bottom: 10px;
			padding: 10px 12px;
			background: rgba(0, 0, 0, 0.2);
			border-radius: 8px;
		}
		.result-row:last-child {
			margin-bottom: 0;
		}
		.result-label {
			font-size: 0.75rem;
			font-weight: 600;
			color: #71717a;
			text-transform: uppercase;
			min-width: 80px;
			flex-shrink: 0;
		}
		.result-value {
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			font-size: 0.8rem;
			color: #e4e4e7;
			word-break: break-all;
			flex: 1;
		}
		.result-actions {
			display: flex;
			gap: 10px;
			margin-top: 16px;
		}
		.btn {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			padding: 10px 18px;
			border-radius: 10px;
			font-size: 0.875rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			border: none;
			text-decoration: none;
		}
		.btn-primary {
			background: linear-gradient(135deg, #3b82f6, #8b5cf6);
			color: white;
		}
		.btn-primary:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
		}
		.btn-secondary {
			background: rgba(40, 40, 50, 0.8);
			border: 1px solid rgba(255, 255, 255, 0.1);
			color: #e4e4e7;
		}
		.btn-secondary:hover {
			border-color: #60a5fa;
			color: #60a5fa;
		}
		.btn svg {
			width: 16px;
			height: 16px;
		}

		/* Info section */
		.info-section {
			margin-top: 12px;
			padding: 16px;
			background: rgba(96, 165, 250, 0.06);
			border-radius: 10px;
			border: 1px solid rgba(96, 165, 250, 0.1);
		}
		.info-section h4 {
			font-size: 0.8rem;
			font-weight: 600;
			color: #60a5fa;
			margin-bottom: 8px;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}
		.info-section p {
			font-size: 0.85rem;
			color: #a1a1aa;
			line-height: 1.6;
		}
		.info-section code {
			background: rgba(0, 0, 0, 0.3);
			padding: 2px 6px;
			border-radius: 4px;
			font-size: 0.8rem;
			color: #60a5fa;
		}

		footer {
			margin-top: 40px;
			text-align: center;
			color: #52525b;
			font-size: 0.8rem;
		}
		footer a { color: #60a5fa; text-decoration: none; }
		footer a:hover { text-decoration: underline; }

		@media (max-width: 540px) {
			h1 { font-size: 2rem; }
			.option-row { flex-direction: column; align-items: flex-start; gap: 12px; }
			.result-actions { flex-direction: column; }
			.btn { width: 100%; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<a href="/" class="back-link">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
				Back to sui.ski
			</a>
			<h1>Upload to Walrus</h1>
			<p class="tagline">Decentralized storage with optional encryption</p>
			<div class="badges">
				<span class="badge network">${network}</span>
				<span class="badge walrus">Walrus ${walrusNetwork}</span>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
				Upload File
			</h2>

			<div class="drop-zone" id="dropZone">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/>
					<path d="M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
				<p><strong>Drop your file here</strong></p>
				<p>or click to browse</p>
				<p class="hint">Max 10MB per file</p>
			</div>
			<label for="fileInput" class="visually-hidden">Choose file to upload</label>
			<input type="file" id="fileInput" class="file-input">

			<div class="options">
				<div class="option-row">
					<div class="option-label">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
						<div>
							<span>Storage Duration</span>
							<small>How long to store (in epochs)</small>
						</div>
					</div>
					<select id="epochs">
						<option value="1">1 epoch (~1 day)</option>
						<option value="5">5 epochs (~5 days)</option>
						<option value="10">10 epochs (~10 days)</option>
						<option value="30">30 epochs (~1 month)</option>
						<option value="100">100 epochs (~3 months)</option>
						<option value="365">365 epochs (~1 year)</option>
					</select>
				</div>

				<div class="option-row">
					<div class="option-label">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
						<div>
							<span>Seal Encryption</span>
							<small>Encrypt with access control (coming soon)</small>
						</div>
					</div>
					<label class="toggle">
						<input type="checkbox" id="enableEncryption" disabled>
						<span class="toggle-slider"></span>
					</label>
				</div>
			</div>

			<div class="progress-container" id="progressContainer">
				<div class="progress-bar">
					<div class="progress-fill" id="progressFill"></div>
				</div>
				<div class="progress-status" id="progressStatus">Preparing upload...</div>
			</div>

			<div class="result" id="result">
				<h3>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
					Upload Complete
				</h3>
				<div class="result-row">
					<span class="result-label">Blob ID</span>
					<span class="result-value" id="resultBlobId">-</span>
				</div>
				<div class="result-row">
					<span class="result-label">Size</span>
					<span class="result-value" id="resultSize">-</span>
				</div>
				<div class="result-row">
					<span class="result-label">Gateway URL</span>
					<span class="result-value" id="resultUrl">-</span>
				</div>
				<div class="result-actions">
					<a id="viewLink" href="#" target="_blank" class="btn btn-primary">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
						View File
					</a>
					<button id="copyBtn" class="btn btn-secondary">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
						Copy URL
					</button>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
				How it Works
			</h2>
			<div class="info-section">
				<h4>Walrus Storage</h4>
				<p>
					Your file is uploaded to Walrus, a decentralized blob storage system built on Sui.
					Files are stored across multiple nodes with erasure coding for reliability.
					Access your content via <code>walrus-{blobId}.sui.ski</code> or <code>sui.ski/walrus/{blobId}</code>.
				</p>
			</div>
			<div class="info-section" style="margin-top: 12px;">
				<h4>Seal Encryption (Coming Soon)</h4>
				<p>
					Seal provides threshold encryption with on-chain access control policies.
					Define who can decrypt your data using Move smart contracts.
					Perfect for gated content, time-locked data, or subscription-based access.
				</p>
			</div>
		</div>
	</div>

	<footer>
		<p>Powered by <a href="https://walrus.xyz">Walrus</a> · <a href="https://seal.mystenlabs.com">Seal</a> · <a href="https://sui.io">Sui</a></p>
	</footer>

	<script>
		const dropZone = document.getElementById('dropZone');
		const fileInput = document.getElementById('fileInput');
		const progressContainer = document.getElementById('progressContainer');
		const progressFill = document.getElementById('progressFill');
		const progressStatus = document.getElementById('progressStatus');
		const result = document.getElementById('result');
		const epochsSelect = document.getElementById('epochs');

		let uploadedBlobId = null;

		// Click to upload
		dropZone.addEventListener('click', () => fileInput.click());

		// Drag and drop events
		['dragenter', 'dragover'].forEach(event => {
			dropZone.addEventListener(event, (e) => {
				e.preventDefault();
				dropZone.classList.add('dragover');
			});
		});

		['dragleave', 'drop'].forEach(event => {
			dropZone.addEventListener(event, (e) => {
				e.preventDefault();
				dropZone.classList.remove('dragover');
			});
		});

		dropZone.addEventListener('drop', (e) => {
			const files = e.dataTransfer.files;
			if (files.length > 0) {
				handleFile(files[0]);
			}
		});

		fileInput.addEventListener('change', (e) => {
			if (e.target.files.length > 0) {
				handleFile(e.target.files[0]);
			}
		});

		async function handleFile(file) {
			// Check file size (10MB limit)
			if (file.size > 10 * 1024 * 1024) {
				showError('File too large. Maximum size is 10MB.');
				return;
			}

			// Show progress
			dropZone.classList.add('uploading');
			progressContainer.classList.add('visible');
			result.classList.remove('visible');
			progressFill.style.width = '0%';
			progressStatus.textContent = 'Preparing upload...';

			try {
				// Read file
				progressFill.style.width = '20%';
				progressStatus.textContent = 'Reading file...';

				const arrayBuffer = await file.arrayBuffer();

				// Upload to Walrus via proxy
				progressFill.style.width = '40%';
				progressStatus.textContent = 'Uploading to Walrus...';

				const epochs = epochsSelect.value;
				const response = await fetch('/upload/api?epochs=' + epochs, {
					method: 'PUT',
					headers: {
						'Content-Type': file.type || 'application/octet-stream',
					},
					body: arrayBuffer,
				});

				progressFill.style.width = '80%';
				progressStatus.textContent = 'Processing response...';

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Upload failed');
				}

				// Extract blob ID from response
				let blobId = null;
				if (data.newlyCreated) {
					blobId = data.newlyCreated.blobObject.blobId;
				} else if (data.alreadyCertified) {
					blobId = data.alreadyCertified.blobId;
				} else if (data.blobId) {
					blobId = data.blobId;
				}

				if (!blobId) {
					throw new Error('No blob ID in response');
				}

				progressFill.style.width = '100%';
				progressStatus.textContent = 'Complete!';

				// Show result
				showResult(blobId, file.size);

			} catch (error) {
				showError(error.message || 'Upload failed');
			} finally {
				dropZone.classList.remove('uploading');
			}
		}

		function showResult(blobId, size) {
			uploadedBlobId = blobId;
			const gatewayUrl = window.location.origin + '/walrus/' + blobId;

			document.getElementById('resultBlobId').textContent = blobId;
			document.getElementById('resultSize').textContent = formatSize(size);
			document.getElementById('resultUrl').textContent = gatewayUrl;
			document.getElementById('viewLink').href = gatewayUrl;

			result.classList.remove('error');
			result.classList.add('visible');

			setTimeout(() => {
				progressContainer.classList.remove('visible');
			}, 1000);
		}

		function showError(message) {
			result.innerHTML = \`
				<h3 style="color: #ef4444;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;">
						<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
					Upload Failed
				</h3>
				<p style="color: #a1a1aa; font-size: 0.9rem;">\${message}</p>
			\`;
			result.classList.add('error', 'visible');
			progressContainer.classList.remove('visible');
		}

		function formatSize(bytes) {
			if (bytes < 1024) return bytes + ' B';
			if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
			return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
		}

		// Copy URL button
		document.getElementById('copyBtn').addEventListener('click', () => {
			const url = window.location.origin + '/walrus/' + uploadedBlobId;
			navigator.clipboard.writeText(url).then(() => {
				const btn = document.getElementById('copyBtn');
				btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
				setTimeout(() => {
					btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy URL';
				}, 2000);
			});
		});
	</script>
</body>
</html>`
}
