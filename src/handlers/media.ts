import { detectContentType, WALRUS_AGGREGATORS } from '../resolvers/content'
import type { Env, Playlist } from '../types'
import { htmlResponse } from '../utils/response'

const SUPPORTED_FORMATS = ['MP4', 'WebM', 'MP3', 'OGG', 'WAV', 'FLAC', 'M4A']

/**
 * Handle media player entry page (/play)
 */
export async function handlePlayerEntryPage(env: Env): Promise<Response> {
	return htmlResponse(generateEntryPage(env))
}

/**
 * Handle media player requests (play-{blobId}.sui.ski)
 */
export async function handlePlayRequest(subdomain: string, env: Env): Promise<Response> {
	// Extract blob ID from subdomain
	const blobId = subdomain.replace(/^play-/i, '')
	if (!blobId) {
		return htmlResponse(generateErrorPage('missing', '', env), 400)
	}

	// Fetch the blob to determine its type
	const aggregators = WALRUS_AGGREGATORS[env.WALRUS_NETWORK] || WALRUS_AGGREGATORS.testnet

	let blob: ArrayBuffer | null = null
	for (const aggregator of aggregators) {
		try {
			const response = await fetch(`${aggregator}${blobId}`, {
				headers: { 'User-Agent': 'sui.ski-gateway/1.0' },
			})

			if (response.ok) {
				blob = await response.arrayBuffer()
				break
			}
		} catch {}
	}

	if (!blob) {
		return htmlResponse(generateErrorPage('fetch', blobId, env), 502)
	}

	const contentType = detectContentType(blob)

	// If it's JSON, try to parse as playlist
	if (contentType === 'application/json') {
		try {
			const text = new TextDecoder().decode(blob)
			const playlist = JSON.parse(text) as Playlist

			if (playlist.items && Array.isArray(playlist.items)) {
				return htmlResponse(generatePlaylistPage(playlist, blobId, env))
			}
		} catch {
			// Not a valid playlist, fall through
		}
	}

	// Determine media type
	const isVideo = contentType.startsWith('video/')
	const isAudio = contentType.startsWith('audio/')

	if (!isVideo && !isAudio) {
		return htmlResponse(generateErrorPage('unsupported', blobId, env, contentType), 400)
	}

	return htmlResponse(generatePlayerPage(blobId, isVideo ? 'video' : 'audio', env))
}

/**
 * Generate error page HTML
 */
function generateErrorPage(
	type: 'missing' | 'fetch' | 'unsupported',
	blobId: string,
	_env: Env,
	contentType?: string,
): string {
	const titles: Record<string, string> = {
		missing: 'No Blob ID Provided',
		fetch: 'Content Not Found',
		unsupported: 'Unsupported Format',
	}

	const descriptions: Record<string, string> = {
		missing: 'Enter a Walrus blob ID to play media.',
		fetch: `Could not fetch blob <code>${escapeHtml(blobId.slice(0, 20))}${blobId.length > 20 ? '...' : ''}</code>. The blob may not exist or may have expired.`,
		unsupported: `Detected format: <code>${escapeHtml(contentType || 'unknown')}</code>. The media player supports audio and video files only.`,
	}

	const suggestions: Record<string, string> = {
		missing: 'Paste a blob ID below or upload new content.',
		fetch: 'Check the blob ID and try again, or upload new content.',
		unsupported: `For images or documents, access directly at <code>walrus-{blobId}.sui.ski</code>`,
	}

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${titles[type]} | sui.ski player</title>
	<style>
		:root {
			--bg: #0a0a0f;
			--bg-card: rgba(22, 22, 30, 0.95);
			--accent: #60a5fa;
			--accent-secondary: #a78bfa;
			--text: #e4e4e7;
			--text-muted: #71717a;
			--border: rgba(255, 255, 255, 0.08);
			--error: #f87171;
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: var(--text);
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
				radial-gradient(ellipse at 20% 20%, rgba(248, 113, 113, 0.06) 0%, transparent 50%),
				radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%);
			pointer-events: none;
		}
		.container {
			max-width: 480px;
			width: 100%;
			background: var(--bg-card);
			backdrop-filter: blur(20px);
			border-radius: 20px;
			border: 1px solid var(--border);
			padding: 40px 32px;
			text-align: center;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
			position: relative;
		}
		.container::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
		}
		.icon {
			width: 72px;
			height: 72px;
			border-radius: 18px;
			background: linear-gradient(135deg, var(--error), #dc2626);
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 auto 24px;
			box-shadow: 0 12px 24px rgba(248, 113, 113, 0.2);
		}
		.icon svg {
			width: 36px;
			height: 36px;
			color: white;
		}
		h1 {
			font-size: 1.5rem;
			font-weight: 700;
			margin-bottom: 12px;
			background: linear-gradient(135deg, #f87171, #fca5a5);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.description {
			color: var(--text-muted);
			line-height: 1.6;
			margin-bottom: 8px;
		}
		.suggestion {
			color: var(--text-muted);
			font-size: 0.9rem;
			margin-bottom: 24px;
		}
		code {
			background: rgba(96, 165, 250, 0.12);
			color: var(--accent);
			padding: 2px 8px;
			border-radius: 6px;
			font-family: ui-monospace, monospace;
			font-size: 0.85em;
		}
		.input-group {
			display: flex;
			gap: 10px;
			margin-bottom: 20px;
		}
		input {
			flex: 1;
			padding: 14px 16px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 0.95rem;
			font-family: ui-monospace, monospace;
			outline: none;
			transition: border-color 0.2s;
		}
		input:focus {
			border-color: var(--accent);
		}
		input::placeholder {
			color: var(--text-muted);
			font-family: 'Inter', system-ui, sans-serif;
		}
		button {
			padding: 14px 24px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border: none;
			border-radius: 12px;
			color: white;
			font-size: 0.95rem;
			font-weight: 600;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
		}
		button:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(96, 165, 250, 0.4);
		}
		.formats {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			justify-content: center;
			margin-bottom: 24px;
		}
		.format-badge {
			padding: 6px 12px;
			background: rgba(255, 255, 255, 0.06);
			border-radius: 8px;
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
		}
		.links {
			display: flex;
			gap: 16px;
			justify-content: center;
			padding-top: 20px;
			border-top: 1px solid var(--border);
		}
		.links a {
			color: var(--accent);
			text-decoration: none;
			font-size: 0.9rem;
			font-weight: 500;
		}
		.links a:hover {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				${type === 'missing' ? '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>' : type === 'fetch' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>' : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>'}
			</svg>
		</div>
		<h1>${titles[type]}</h1>
		<p class="description">${descriptions[type]}</p>
		<p class="suggestion">${suggestions[type]}</p>

		<form onsubmit="goToPlayer(event)">
			<div class="input-group">
				<input type="text" id="blob-input" placeholder="Paste blob ID..." value="${type !== 'missing' ? escapeHtml(blobId) : ''}" autofocus>
				<button type="submit">Play</button>
			</div>
		</form>

		<div class="formats">
			${SUPPORTED_FORMATS.map((f) => `<span class="format-badge">${f}</span>`).join('')}
		</div>

		<div class="links">
			<a href="/play">Player Home</a>
			<a href="/upload">Upload Content</a>
			<a href="/">sui.ski</a>
		</div>
	</div>

	<script>
		function goToPlayer(e) {
			e.preventDefault();
			const input = document.getElementById('blob-input').value.trim();
			const blobId = extractBlobId(input);
			if (blobId) {
				window.location.href = 'https://play-' + blobId + '.sui.ski';
			}
		}

		function extractBlobId(input) {
			if (!input) return null;
			// Handle full URLs: play-xxx.sui.ski or walrus-xxx.sui.ski
			let match = input.match(/(?:play|walrus)-([a-zA-Z0-9_-]+)(?:\\.sui\\.ski)?/);
			if (match) return match[1];
			// Handle /walrus/xxx paths
			match = input.match(/\\/walrus\\/([a-zA-Z0-9_-]+)/);
			if (match) return match[1];
			// Handle raw blob ID (alphanumeric with - and _)
			if (/^[a-zA-Z0-9_-]+$/.test(input)) return input;
			return null;
		}
	</script>
</body>
</html>`
}

/**
 * Generate player entry page HTML
 */
function generateEntryPage(_env: Env): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Media Player | sui.ski</title>
	<style>
		:root {
			--bg: #0a0a0f;
			--bg-card: rgba(22, 22, 30, 0.95);
			--accent: #60a5fa;
			--accent-secondary: #a78bfa;
			--text: #e4e4e7;
			--text-muted: #71717a;
			--border: rgba(255, 255, 255, 0.08);
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: var(--text);
			min-height: 100vh;
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 60px 20px 40px;
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
		.container {
			max-width: 600px;
			width: 100%;
			position: relative;
		}
		.header {
			text-align: center;
			margin-bottom: 40px;
		}
		.logo-icon {
			width: 80px;
			height: 80px;
			border-radius: 20px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0 auto 20px;
			box-shadow: 0 16px 32px rgba(96, 165, 250, 0.25);
		}
		.logo-icon svg {
			width: 40px;
			height: 40px;
			color: white;
		}
		h1 {
			font-size: 2.5rem;
			font-weight: 800;
			margin-bottom: 12px;
			background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.tagline {
			color: var(--text-muted);
			font-size: 1.1rem;
		}
		.card {
			background: var(--bg-card);
			backdrop-filter: blur(20px);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 28px;
			margin-bottom: 20px;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
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
			color: var(--accent);
		}
		.input-group {
			display: flex;
			gap: 12px;
		}
		input {
			flex: 1;
			padding: 16px 18px;
			background: rgba(30, 30, 40, 0.6);
			border: 1px solid var(--border);
			border-radius: 12px;
			color: var(--text);
			font-size: 1rem;
			font-family: ui-monospace, monospace;
			outline: none;
			transition: border-color 0.2s;
		}
		input:focus {
			border-color: var(--accent);
		}
		input::placeholder {
			color: var(--text-muted);
			font-family: 'Inter', system-ui, sans-serif;
		}
		button {
			padding: 16px 28px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border: none;
			border-radius: 12px;
			color: white;
			font-size: 1rem;
			font-weight: 600;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
		}
		button:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 16px rgba(96, 165, 250, 0.4);
		}
		.formats {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			margin-top: 16px;
		}
		.format-badge {
			padding: 6px 12px;
			background: rgba(96, 165, 250, 0.1);
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 8px;
			font-size: 0.8rem;
			font-weight: 600;
			color: var(--accent);
		}
		.section-title {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 12px;
		}
		.shortcuts {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 10px;
		}
		.shortcut {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 10px 14px;
			background: rgba(30, 30, 40, 0.5);
			border-radius: 10px;
		}
		.key {
			padding: 4px 10px;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 6px;
			font-family: ui-monospace, monospace;
			font-size: 0.8rem;
			font-weight: 600;
			min-width: 36px;
			text-align: center;
		}
		.shortcut-desc {
			font-size: 0.85rem;
			color: var(--text-muted);
		}
		.playlist-example {
			background: rgba(30, 30, 40, 0.5);
			border-radius: 10px;
			padding: 16px;
			overflow-x: auto;
		}
		.playlist-example pre {
			font-family: ui-monospace, monospace;
			font-size: 0.8rem;
			color: var(--text-muted);
			line-height: 1.6;
			margin: 0;
		}
		.playlist-example .key-name { color: #f472b6; }
		.playlist-example .string { color: #a5d6ff; }
		.playlist-example .number { color: #79c0ff; }
		.links {
			display: flex;
			gap: 24px;
			justify-content: center;
			margin-top: 32px;
		}
		.links a {
			color: var(--accent);
			text-decoration: none;
			font-size: 0.9rem;
			font-weight: 500;
		}
		.links a:hover {
			text-decoration: underline;
		}
		@media (max-width: 540px) {
			h1 { font-size: 2rem; }
			.input-group { flex-direction: column; }
			.shortcuts { grid-template-columns: 1fr; }
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="logo-icon">
				<svg viewBox="0 0 24 24" fill="currentColor">
					<polygon points="5 3 19 12 5 21 5 3"></polygon>
				</svg>
			</div>
			<h1>Media Player</h1>
			<p class="tagline">Play audio and video stored on Walrus</p>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polygon points="5 3 19 12 5 21 5 3"></polygon>
				</svg>
				Play Media
			</h2>
			<form onsubmit="goToPlayer(event)">
				<div class="input-group">
					<input type="text" id="blob-input" placeholder="Paste blob ID or URL..." autofocus>
					<button type="submit">Play</button>
				</div>
			</form>
			<div class="formats">
				${SUPPORTED_FORMATS.map((f) => `<span class="format-badge">${f}</span>`).join('')}
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="7" height="7"></rect>
					<rect x="14" y="3" width="7" height="7"></rect>
					<rect x="14" y="14" width="7" height="7"></rect>
					<rect x="3" y="14" width="7" height="7"></rect>
				</svg>
				Keyboard Shortcuts
			</h2>
			<div class="shortcuts">
				<div class="shortcut"><span class="key">Space</span><span class="shortcut-desc">Play / Pause</span></div>
				<div class="shortcut"><span class="key">M</span><span class="shortcut-desc">Mute / Unmute</span></div>
				<div class="shortcut"><span class="key">\u2190 \u2192</span><span class="shortcut-desc">Seek \u00b110 seconds</span></div>
				<div class="shortcut"><span class="key">\u2191 \u2193</span><span class="shortcut-desc">Volume up / down</span></div>
				<div class="shortcut"><span class="key">F</span><span class="shortcut-desc">Fullscreen (video)</span></div>
				<div class="shortcut"><span class="key">?</span><span class="shortcut-desc">Show help</span></div>
			</div>
		</div>

		<div class="card">
			<h2>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="8" y1="6" x2="21" y2="6"></line>
					<line x1="8" y1="12" x2="21" y2="12"></line>
					<line x1="8" y1="18" x2="21" y2="18"></line>
					<line x1="3" y1="6" x2="3.01" y2="6"></line>
					<line x1="3" y1="12" x2="3.01" y2="12"></line>
					<line x1="3" y1="18" x2="3.01" y2="18"></line>
				</svg>
				Playlist Format
			</h2>
			<p class="section-title">Upload a JSON file with this structure:</p>
			<div class="playlist-example">
				<pre>{
  <span class="key-name">"title"</span>: <span class="string">"My Playlist"</span>,
  <span class="key-name">"items"</span>: [
    {
      <span class="key-name">"blobId"</span>: <span class="string">"abc123..."</span>,
      <span class="key-name">"title"</span>: <span class="string">"Track Name"</span>,
      <span class="key-name">"artist"</span>: <span class="string">"Artist Name"</span>,
      <span class="key-name">"duration"</span>: <span class="number">180</span>
    }
  ]
}</pre>
			</div>
		</div>

		<div class="links">
			<a href="/upload">Upload to Walrus</a>
			<a href="/">sui.ski Home</a>
		</div>
	</div>

	<script>
		function goToPlayer(e) {
			e.preventDefault();
			const input = document.getElementById('blob-input').value.trim();
			const blobId = extractBlobId(input);
			if (blobId) {
				window.location.href = 'https://play-' + blobId + '.sui.ski';
			}
		}

		function extractBlobId(input) {
			if (!input) return null;
			// Handle full URLs: play-xxx.sui.ski or walrus-xxx.sui.ski
			let match = input.match(/(?:play|walrus)-([a-zA-Z0-9_-]+)(?:\\.sui\\.ski)?/);
			if (match) return match[1];
			// Handle /walrus/xxx paths
			match = input.match(/\\/walrus\\/([a-zA-Z0-9_-]+)/);
			if (match) return match[1];
			// Handle raw blob ID (alphanumeric with - and _)
			if (/^[a-zA-Z0-9_-]+$/.test(input)) return input;
			return null;
		}
	</script>
</body>
</html>`
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
	return str.replace(
		/[&<>"']/g,
		(c) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			})[c] || c,
	)
}

/**
 * Generate single media player page
 */
function generatePlayerPage(blobId: string, mediaType: 'video' | 'audio', _env: Env): string {
	const mediaUrl = `/walrus/${blobId}`
	const isVideo = mediaType === 'video'

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>sui.ski player</title>
	<style>
		:root {
			--bg: #0a0a0f;
			--bg-card: rgba(22, 22, 30, 0.95);
			--accent: #60a5fa;
			--accent-secondary: #a78bfa;
			--accent-glow: rgba(96, 165, 250, 0.3);
			--text: #e4e4e7;
			--text-muted: #71717a;
			--border: rgba(255, 255, 255, 0.08);
			--progress-bg: rgba(255, 255, 255, 0.1);
			--progress-buffered: rgba(255, 255, 255, 0.2);
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: var(--text);
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

		.player-container {
			width: 100%;
			max-width: ${isVideo ? '900px' : '500px'};
			background: var(--bg-card);
			backdrop-filter: blur(20px);
			border-radius: 20px;
			border: 1px solid var(--border);
			overflow: hidden;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05);
			position: relative;
		}
		.player-container::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
		}

		.player-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--border);
		}

		.player-logo {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: 700;
			font-size: 0.9rem;
			color: var(--text);
		}

		.player-logo svg {
			width: 20px;
			height: 20px;
			color: var(--accent);
		}

		.header-buttons {
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.player-close, .help-btn {
			width: 32px;
			height: 32px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
			text-decoration: none;
		}

		.player-close:hover, .help-btn:hover {
			background: rgba(255, 255, 255, 0.1);
			color: var(--text);
		}

		/* Help overlay */
		.help-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.85);
			backdrop-filter: blur(8px);
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 1000;
			opacity: 0;
			visibility: hidden;
			transition: all 0.2s;
		}

		.help-overlay.visible {
			opacity: 1;
			visibility: visible;
		}

		.help-content {
			background: var(--bg-card);
			border: 1px solid var(--border);
			border-radius: 16px;
			padding: 28px;
			max-width: 400px;
			width: 90%;
			max-height: 80vh;
			overflow-y: auto;
		}

		.help-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 20px;
		}

		.help-header h2 {
			font-size: 1.1rem;
			font-weight: 700;
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.help-header h2 svg {
			width: 20px;
			height: 20px;
			color: var(--accent);
		}

		.help-close {
			width: 28px;
			height: 28px;
			border-radius: 6px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.help-close:hover {
			background: rgba(255, 255, 255, 0.1);
			color: var(--text);
		}

		.shortcuts-list {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}

		.shortcut-item {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 10px 12px;
			background: rgba(30, 30, 40, 0.5);
			border-radius: 10px;
		}

		.shortcut-key {
			padding: 4px 10px;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 6px;
			font-family: ui-monospace, monospace;
			font-size: 0.8rem;
			font-weight: 600;
			min-width: 50px;
			text-align: center;
		}

		.shortcut-action {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		.help-footer {
			margin-top: 20px;
			padding-top: 16px;
			border-top: 1px solid var(--border);
			text-align: center;
		}

		.help-footer a {
			color: var(--accent);
			text-decoration: none;
			font-size: 0.9rem;
		}

		.help-footer a:hover {
			text-decoration: underline;
		}

		.media-wrapper {
			position: relative;
			background: #000;
			${isVideo ? 'aspect-ratio: 16 / 9;' : 'padding: 60px 20px;'}
		}

		video, audio {
			width: 100%;
			${isVideo ? 'height: 100%; object-fit: contain;' : ''}
			display: block;
		}

		.audio-visual {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 24px;
		}

		.audio-icon {
			width: 120px;
			height: 120px;
			border-radius: 24px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 20px 40px var(--accent-glow);
		}

		.audio-icon svg {
			width: 60px;
			height: 60px;
			color: white;
		}

		.audio-icon.playing {
			animation: pulse 2s ease-in-out infinite;
		}

		@keyframes pulse {
			0%, 100% { transform: scale(1); }
			50% { transform: scale(1.05); }
		}

		.controls {
			padding: 20px;
		}

		.progress-container {
			margin-bottom: 16px;
		}

		.progress-bar {
			position: relative;
			height: 6px;
			background: var(--progress-bg);
			border-radius: 3px;
			cursor: pointer;
			overflow: hidden;
		}

		.progress-bar:hover {
			height: 8px;
		}

		.progress-buffered {
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			background: var(--progress-buffered);
			border-radius: 3px;
			pointer-events: none;
		}

		.progress-fill {
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			background: linear-gradient(90deg, var(--accent), #8b5cf6);
			border-radius: 3px;
			pointer-events: none;
			transition: width 0.1s linear;
		}

		.progress-handle {
			position: absolute;
			top: 50%;
			transform: translate(-50%, -50%);
			width: 14px;
			height: 14px;
			background: white;
			border-radius: 50%;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
			opacity: 0;
			transition: opacity 0.2s;
			pointer-events: none;
		}

		.progress-bar:hover .progress-handle {
			opacity: 1;
		}

		.time-display {
			display: flex;
			justify-content: space-between;
			font-size: 0.75rem;
			color: var(--text-muted);
			margin-top: 8px;
			font-family: ui-monospace, monospace;
		}

		.control-buttons {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 16px;
		}

		.control-btn {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			border: none;
			background: transparent;
			color: var(--text);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
		}

		.control-btn:hover {
			background: rgba(255, 255, 255, 0.1);
			transform: scale(1.1);
		}

		.control-btn.play-btn {
			width: 64px;
			height: 64px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			box-shadow: 0 8px 24px var(--accent-glow);
		}

		.control-btn.play-btn:hover {
			transform: scale(1.1);
			box-shadow: 0 12px 32px var(--accent-glow);
		}

		.control-btn svg {
			width: 24px;
			height: 24px;
		}

		.control-btn.play-btn svg {
			width: 28px;
			height: 28px;
		}

		.volume-container {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-left: auto;
		}

		.volume-btn {
			width: 36px;
			height: 36px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
		}

		.volume-btn:hover {
			color: var(--text);
			background: rgba(255, 255, 255, 0.1);
		}

		.volume-slider {
			width: 80px;
			height: 4px;
			-webkit-appearance: none;
			appearance: none;
			background: var(--progress-bg);
			border-radius: 2px;
			outline: none;
		}

		.volume-slider::-webkit-slider-thumb {
			-webkit-appearance: none;
			width: 12px;
			height: 12px;
			background: white;
			border-radius: 50%;
			cursor: pointer;
		}

		${
			isVideo
				? `
		.fullscreen-btn {
			width: 36px;
			height: 36px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
			margin-left: 8px;
		}

		.fullscreen-btn:hover {
			color: var(--text);
			background: rgba(255, 255, 255, 0.1);
		}

		.fullscreen-btn svg {
			width: 18px;
			height: 18px;
		}
		`
				: ''
		}

		.blob-info {
			padding: 12px 20px;
			border-top: 1px solid var(--border);
			display: flex;
			align-items: center;
			justify-content: space-between;
			font-size: 0.75rem;
			color: var(--text-muted);
		}

		.blob-info code {
			font-family: ui-monospace, monospace;
			background: rgba(255, 255, 255, 0.1);
			padding: 4px 8px;
			border-radius: 4px;
		}

		.blob-info a {
			color: var(--accent);
			text-decoration: none;
		}

		.blob-info a:hover {
			text-decoration: underline;
		}

		/* Loading state */
		.loading-overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.7);
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.3s;
		}

		.loading-overlay.visible {
			opacity: 1;
		}

		.spinner {
			width: 48px;
			height: 48px;
			border: 3px solid var(--progress-bg);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			to { transform: rotate(360deg); }
		}
	</style>
</head>
<body>
	<div class="player-container">
		<div class="player-header">
			<div class="player-logo">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polygon points="5 3 19 12 5 21 5 3"></polygon>
				</svg>
				sui.ski player
			</div>
			<div class="header-buttons">
				<button class="help-btn" id="help-btn" title="Help (?)">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
						<line x1="12" y1="17" x2="12.01" y2="17"></line>
					</svg>
				</button>
				<a href="/" class="player-close" title="Close">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</a>
			</div>
		</div>

		<div class="media-wrapper">
			${
				isVideo
					? `
			<video id="media" preload="metadata">
				<source src="${mediaUrl}" type="video/mp4">
				Your browser does not support video playback.
			</video>
			`
					: `
			<div class="audio-visual">
				<div class="audio-icon" id="audio-icon">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18V5l12-2v13"></path>
						<circle cx="6" cy="18" r="3"></circle>
						<circle cx="18" cy="16" r="3"></circle>
					</svg>
				</div>
			</div>
			<audio id="media" preload="metadata">
				<source src="${mediaUrl}" type="audio/mpeg">
				Your browser does not support audio playback.
			</audio>
			`
			}
			<div class="loading-overlay" id="loading">
				<div class="spinner"></div>
			</div>
		</div>

		<div class="controls">
			<div class="progress-container">
				<div class="progress-bar" id="progress-bar">
					<div class="progress-buffered" id="progress-buffered"></div>
					<div class="progress-fill" id="progress-fill"></div>
					<div class="progress-handle" id="progress-handle"></div>
				</div>
				<div class="time-display">
					<span id="current-time">0:00</span>
					<span id="duration">0:00</span>
				</div>
			</div>

			<div class="control-buttons">
				<button class="control-btn" id="rewind-btn" title="Rewind 10s">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M11 19l-7-7 7-7"></path>
						<text x="15" y="15" font-size="8" fill="currentColor" stroke="none">10</text>
					</svg>
				</button>

				<button class="control-btn play-btn" id="play-btn" title="Play">
					<svg id="play-icon" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="5 3 19 12 5 21 5 3"></polygon>
					</svg>
					<svg id="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
						<rect x="6" y="4" width="4" height="16"></rect>
						<rect x="14" y="4" width="4" height="16"></rect>
					</svg>
				</button>

				<button class="control-btn" id="forward-btn" title="Forward 10s">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M13 5l7 7-7 7"></path>
						<text x="3" y="15" font-size="8" fill="currentColor" stroke="none">10</text>
					</svg>
				</button>

				<div class="volume-container">
					<button class="volume-btn" id="volume-btn" title="Mute">
						<svg id="volume-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
							<path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
							<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
						</svg>
						<svg id="mute-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
							<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
							<line x1="23" y1="9" x2="17" y2="15"></line>
							<line x1="17" y1="9" x2="23" y2="15"></line>
						</svg>
					</button>
					<input type="range" class="volume-slider" id="volume-slider" min="0" max="1" step="0.1" value="1">
				</div>

				${
					isVideo
						? `
				<button class="fullscreen-btn" id="fullscreen-btn" title="Fullscreen">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
						<path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
						<path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
						<path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
					</svg>
				</button>
				`
						: ''
				}
			</div>
		</div>

		<div class="blob-info">
			<span>Blob: <code>${blobId.slice(0, 12)}...</code></span>
			<a href="${mediaUrl}" download>Download</a>
		</div>
	</div>

	<!-- Help Overlay -->
	<div class="help-overlay" id="help-overlay">
		<div class="help-content">
			<div class="help-header">
				<h2>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="3" width="7" height="7"></rect>
						<rect x="14" y="3" width="7" height="7"></rect>
						<rect x="14" y="14" width="7" height="7"></rect>
						<rect x="3" y="14" width="7" height="7"></rect>
					</svg>
					Keyboard Shortcuts
				</h2>
				<button class="help-close" id="help-close">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
			<div class="shortcuts-list">
				<div class="shortcut-item"><span class="shortcut-key">Space</span><span class="shortcut-action">Play / Pause</span></div>
				<div class="shortcut-item"><span class="shortcut-key">\u2190 \u2192</span><span class="shortcut-action">Seek \u00b110 seconds</span></div>
				<div class="shortcut-item"><span class="shortcut-key">\u2191 \u2193</span><span class="shortcut-action">Volume up / down</span></div>
				<div class="shortcut-item"><span class="shortcut-key">M</span><span class="shortcut-action">Mute / Unmute</span></div>
				${isVideo ? `<div class="shortcut-item"><span class="shortcut-key">F</span><span class="shortcut-action">Toggle fullscreen</span></div>` : ''}
				<div class="shortcut-item"><span class="shortcut-key">?</span><span class="shortcut-action">Show / hide help</span></div>
			</div>
			<div class="help-footer">
				<a href="/play">More player options</a>
			</div>
		</div>
	</div>

	<script>
		const media = document.getElementById('media');
		const playBtn = document.getElementById('play-btn');
		const playIcon = document.getElementById('play-icon');
		const pauseIcon = document.getElementById('pause-icon');
		const rewindBtn = document.getElementById('rewind-btn');
		const forwardBtn = document.getElementById('forward-btn');
		const progressBar = document.getElementById('progress-bar');
		const progressFill = document.getElementById('progress-fill');
		const progressBuffered = document.getElementById('progress-buffered');
		const progressHandle = document.getElementById('progress-handle');
		const currentTimeEl = document.getElementById('current-time');
		const durationEl = document.getElementById('duration');
		const volumeBtn = document.getElementById('volume-btn');
		const volumeIcon = document.getElementById('volume-icon');
		const muteIcon = document.getElementById('mute-icon');
		const volumeSlider = document.getElementById('volume-slider');
		const loading = document.getElementById('loading');
		const helpBtn = document.getElementById('help-btn');
		const helpOverlay = document.getElementById('help-overlay');
		const helpClose = document.getElementById('help-close');
		${isVideo ? `const fullscreenBtn = document.getElementById('fullscreen-btn');` : `const audioIcon = document.getElementById('audio-icon');`}

		function toggleHelp() {
			helpOverlay.classList.toggle('visible');
		}

		function formatTime(seconds) {
			if (isNaN(seconds)) return '0:00';
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return mins + ':' + secs.toString().padStart(2, '0');
		}

		function updateProgress() {
			const percent = (media.currentTime / media.duration) * 100 || 0;
			progressFill.style.width = percent + '%';
			progressHandle.style.left = percent + '%';
			currentTimeEl.textContent = formatTime(media.currentTime);
		}

		function updateBuffered() {
			if (media.buffered.length > 0) {
				const buffered = (media.buffered.end(media.buffered.length - 1) / media.duration) * 100;
				progressBuffered.style.width = buffered + '%';
			}
		}

		function togglePlay() {
			if (media.paused) {
				media.play();
			} else {
				media.pause();
			}
		}

		function updatePlayButton() {
			if (media.paused) {
				playIcon.style.display = 'block';
				pauseIcon.style.display = 'none';
				${!isVideo ? `audioIcon.classList.remove('playing');` : ''}
			} else {
				playIcon.style.display = 'none';
				pauseIcon.style.display = 'block';
				${!isVideo ? `audioIcon.classList.add('playing');` : ''}
			}
		}

		function seek(e) {
			const rect = progressBar.getBoundingClientRect();
			const percent = (e.clientX - rect.left) / rect.width;
			media.currentTime = percent * media.duration;
		}

		function toggleMute() {
			media.muted = !media.muted;
			volumeIcon.style.display = media.muted ? 'none' : 'block';
			muteIcon.style.display = media.muted ? 'block' : 'none';
			volumeSlider.value = media.muted ? 0 : media.volume;
		}

		// Event listeners
		playBtn.addEventListener('click', togglePlay);
		media.addEventListener('play', updatePlayButton);
		media.addEventListener('pause', updatePlayButton);
		media.addEventListener('timeupdate', updateProgress);
		media.addEventListener('progress', updateBuffered);
		media.addEventListener('loadedmetadata', () => {
			durationEl.textContent = formatTime(media.duration);
		});
		media.addEventListener('waiting', () => loading.classList.add('visible'));
		media.addEventListener('canplay', () => loading.classList.remove('visible'));

		rewindBtn.addEventListener('click', () => { media.currentTime -= 10; });
		forwardBtn.addEventListener('click', () => { media.currentTime += 10; });

		progressBar.addEventListener('click', seek);
		let isDragging = false;
		progressBar.addEventListener('mousedown', (e) => { isDragging = true; seek(e); });
		document.addEventListener('mousemove', (e) => { if (isDragging) seek(e); });
		document.addEventListener('mouseup', () => { isDragging = false; });

		volumeBtn.addEventListener('click', toggleMute);
		volumeSlider.addEventListener('input', (e) => {
			media.volume = e.target.value;
			media.muted = e.target.value == 0;
			volumeIcon.style.display = media.muted ? 'none' : 'block';
			muteIcon.style.display = media.muted ? 'block' : 'none';
		});

		helpBtn.addEventListener('click', toggleHelp);
		helpClose.addEventListener('click', toggleHelp);
		helpOverlay.addEventListener('click', (e) => {
			if (e.target === helpOverlay) toggleHelp();
		});

		${
			isVideo
				? `
		fullscreenBtn.addEventListener('click', () => {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				document.querySelector('.player-container').requestFullscreen();
			}
		});

		// Double click video to toggle fullscreen
		media.addEventListener('dblclick', () => {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				document.querySelector('.player-container').requestFullscreen();
			}
		});

		// Click video to play/pause
		media.addEventListener('click', togglePlay);
		`
				: ''
		}

		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => {
			if (e.target.tagName === 'INPUT') return;
			switch (e.code) {
				case 'Space':
					e.preventDefault();
					togglePlay();
					break;
				case 'ArrowLeft':
					media.currentTime -= 10;
					break;
				case 'ArrowRight':
					media.currentTime += 10;
					break;
				case 'ArrowUp':
					media.volume = Math.min(1, media.volume + 0.1);
					volumeSlider.value = media.volume;
					break;
				case 'ArrowDown':
					media.volume = Math.max(0, media.volume - 0.1);
					volumeSlider.value = media.volume;
					break;
				case 'KeyM':
					toggleMute();
					break;
				${
					isVideo
						? `
				case 'KeyF':
					if (document.fullscreenElement) {
						document.exitFullscreen();
					} else {
						document.querySelector('.player-container').requestFullscreen();
					}
					break;
				`
						: ''
				}
				case 'Slash':
					if (e.shiftKey) {
						e.preventDefault();
						toggleHelp();
					}
					break;
				case 'Escape':
					if (helpOverlay.classList.contains('visible')) {
						toggleHelp();
					}
					break;
			}
		});
	</script>
</body>
</html>`
}

/**
 * Generate playlist player page
 */
function generatePlaylistPage(playlist: Playlist, _playlistBlobId: string, _env: Env): string {
	const escapeHtml = (str: string) =>
		str.replace(
			/[&<>"']/g,
			(c) =>
				({
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#39;',
				})[c] || c,
		)

	const playlistJson = JSON.stringify(playlist.items)
		.replace(/</g, '\\u003c')
		.replace(/-->/g, '--\\u003e')

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(playlist.title || 'Playlist')} | sui.ski player</title>
	<style>
		:root {
			--bg: #0a0a0f;
			--bg-card: rgba(22, 22, 30, 0.95);
			--accent: #60a5fa;
			--accent-secondary: #a78bfa;
			--accent-glow: rgba(96, 165, 250, 0.3);
			--text: #e4e4e7;
			--text-muted: #71717a;
			--border: rgba(255, 255, 255, 0.08);
			--progress-bg: rgba(255, 255, 255, 0.1);
			--progress-buffered: rgba(255, 255, 255, 0.2);
		}
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: var(--text);
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

		.player-container {
			width: 100%;
			max-width: 900px;
			background: var(--bg-card);
			backdrop-filter: blur(20px);
			border-radius: 20px;
			border: 1px solid var(--border);
			overflow: hidden;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05);
			display: grid;
			grid-template-columns: 1fr 300px;
			position: relative;
		}
		.player-container::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
			z-index: 10;
		}

		@media (max-width: 768px) {
			.player-container {
				grid-template-columns: 1fr;
			}
			.playlist-panel {
				max-height: 300px;
			}
		}

		.main-player {
			display: flex;
			flex-direction: column;
		}

		.player-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 16px 20px;
			border-bottom: 1px solid var(--border);
		}

		.player-logo {
			display: flex;
			align-items: center;
			gap: 8px;
			font-weight: 700;
			font-size: 0.9rem;
			color: var(--text);
		}

		.player-logo svg {
			width: 20px;
			height: 20px;
			color: var(--accent);
		}

		.player-close {
			width: 32px;
			height: 32px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
			text-decoration: none;
		}

		.player-close:hover {
			background: rgba(255, 255, 255, 0.1);
			color: var(--text);
		}

		.media-wrapper {
			position: relative;
			background: #000;
			aspect-ratio: 16 / 9;
		}

		video, audio {
			width: 100%;
			height: 100%;
			object-fit: contain;
			display: block;
		}

		.audio-mode .media-wrapper {
			aspect-ratio: auto;
			padding: 40px 20px;
		}

		.audio-visual {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 16px;
		}

		.audio-icon {
			width: 100px;
			height: 100px;
			border-radius: 20px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 20px 40px var(--accent-glow);
		}

		.audio-icon svg {
			width: 50px;
			height: 50px;
			color: white;
		}

		.audio-icon.playing {
			animation: pulse 2s ease-in-out infinite;
		}

		@keyframes pulse {
			0%, 100% { transform: scale(1); }
			50% { transform: scale(1.05); }
		}

		.now-playing {
			text-align: center;
		}

		.now-playing-title {
			font-size: 1.1rem;
			font-weight: 600;
			margin-bottom: 4px;
		}

		.now-playing-artist {
			font-size: 0.85rem;
			color: var(--text-muted);
		}

		.controls {
			padding: 20px;
		}

		.progress-container {
			margin-bottom: 16px;
		}

		.progress-bar {
			position: relative;
			height: 6px;
			background: var(--progress-bg);
			border-radius: 3px;
			cursor: pointer;
			overflow: hidden;
		}

		.progress-bar:hover {
			height: 8px;
		}

		.progress-buffered {
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			background: var(--progress-buffered);
			border-radius: 3px;
			pointer-events: none;
		}

		.progress-fill {
			position: absolute;
			top: 0;
			left: 0;
			height: 100%;
			background: linear-gradient(90deg, var(--accent), #8b5cf6);
			border-radius: 3px;
			pointer-events: none;
			transition: width 0.1s linear;
		}

		.progress-handle {
			position: absolute;
			top: 50%;
			transform: translate(-50%, -50%);
			width: 14px;
			height: 14px;
			background: white;
			border-radius: 50%;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
			opacity: 0;
			transition: opacity 0.2s;
			pointer-events: none;
		}

		.progress-bar:hover .progress-handle {
			opacity: 1;
		}

		.time-display {
			display: flex;
			justify-content: space-between;
			font-size: 0.75rem;
			color: var(--text-muted);
			margin-top: 8px;
			font-family: ui-monospace, monospace;
		}

		.control-buttons {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12px;
		}

		.control-btn {
			width: 44px;
			height: 44px;
			border-radius: 50%;
			border: none;
			background: transparent;
			color: var(--text);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
		}

		.control-btn:hover {
			background: rgba(255, 255, 255, 0.1);
			transform: scale(1.1);
		}

		.control-btn.play-btn {
			width: 56px;
			height: 56px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			box-shadow: 0 8px 24px var(--accent-glow);
		}

		.control-btn.play-btn:hover {
			transform: scale(1.1);
			box-shadow: 0 12px 32px var(--accent-glow);
		}

		.control-btn svg {
			width: 22px;
			height: 22px;
		}

		.control-btn.play-btn svg {
			width: 26px;
			height: 26px;
		}

		.volume-container {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-left: auto;
		}

		.volume-btn {
			width: 36px;
			height: 36px;
			border-radius: 8px;
			border: none;
			background: transparent;
			color: var(--text-muted);
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
		}

		.volume-btn:hover {
			color: var(--text);
			background: rgba(255, 255, 255, 0.1);
		}

		.volume-slider {
			width: 80px;
			height: 4px;
			-webkit-appearance: none;
			appearance: none;
			background: var(--progress-bg);
			border-radius: 2px;
			outline: none;
		}

		.volume-slider::-webkit-slider-thumb {
			-webkit-appearance: none;
			width: 12px;
			height: 12px;
			background: white;
			border-radius: 50%;
			cursor: pointer;
		}

		/* Playlist Panel */
		.playlist-panel {
			border-left: 1px solid var(--border);
			display: flex;
			flex-direction: column;
			overflow: hidden;
		}

		.playlist-header {
			padding: 16px;
			border-bottom: 1px solid var(--border);
		}

		.playlist-title {
			font-weight: 700;
			font-size: 0.95rem;
			margin-bottom: 4px;
		}

		.playlist-count {
			font-size: 0.75rem;
			color: var(--text-muted);
		}

		.playlist-items {
			flex: 1;
			overflow-y: auto;
		}

		.playlist-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 12px 16px;
			cursor: pointer;
			transition: background 0.2s;
			border-bottom: 1px solid var(--border);
		}

		.playlist-item:hover {
			background: rgba(255, 255, 255, 0.05);
		}

		.playlist-item.active {
			background: rgba(14, 165, 233, 0.15);
		}

		.playlist-item-index {
			width: 24px;
			text-align: center;
			font-size: 0.8rem;
			color: var(--text-muted);
		}

		.playlist-item.active .playlist-item-index {
			color: var(--accent);
		}

		.playlist-item-playing {
			display: none;
		}

		.playlist-item.active.playing .playlist-item-index {
			display: none;
		}

		.playlist-item.active.playing .playlist-item-playing {
			display: block;
			color: var(--accent);
		}

		.playlist-item-info {
			flex: 1;
			min-width: 0;
		}

		.playlist-item-title {
			font-size: 0.85rem;
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.playlist-item-artist {
			font-size: 0.75rem;
			color: var(--text-muted);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.playlist-item-duration {
			font-size: 0.75rem;
			color: var(--text-muted);
			font-family: ui-monospace, monospace;
		}

		/* Loading */
		.loading-overlay {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: rgba(0, 0, 0, 0.7);
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.3s;
		}

		.loading-overlay.visible {
			opacity: 1;
		}

		.spinner {
			width: 48px;
			height: 48px;
			border: 3px solid var(--progress-bg);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			to { transform: rotate(360deg); }
		}
	</style>
</head>
<body>
	<div class="player-container" id="player-container">
		<div class="main-player">
			<div class="player-header">
				<div class="player-logo">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="5 3 19 12 5 21 5 3"></polygon>
					</svg>
					sui.ski player
				</div>
				<a href="/" class="player-close" title="Close">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</a>
			</div>

			<div class="media-wrapper" id="media-wrapper">
				<video id="media" preload="metadata"></video>
				<div class="audio-visual" id="audio-visual" style="display: none;">
					<div class="audio-icon" id="audio-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 18V5l12-2v13"></path>
							<circle cx="6" cy="18" r="3"></circle>
							<circle cx="18" cy="16" r="3"></circle>
						</svg>
					</div>
					<div class="now-playing">
						<div class="now-playing-title" id="now-playing-title">-</div>
						<div class="now-playing-artist" id="now-playing-artist">-</div>
					</div>
				</div>
				<div class="loading-overlay" id="loading">
					<div class="spinner"></div>
				</div>
			</div>

			<div class="controls">
				<div class="progress-container">
					<div class="progress-bar" id="progress-bar">
						<div class="progress-buffered" id="progress-buffered"></div>
						<div class="progress-fill" id="progress-fill"></div>
						<div class="progress-handle" id="progress-handle"></div>
					</div>
					<div class="time-display">
						<span id="current-time">0:00</span>
						<span id="duration">0:00</span>
					</div>
				</div>

				<div class="control-buttons">
					<button class="control-btn" id="prev-btn" title="Previous">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
						</svg>
					</button>

					<button class="control-btn" id="rewind-btn" title="Rewind 10s">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M11 19l-7-7 7-7"></path>
						</svg>
					</button>

					<button class="control-btn play-btn" id="play-btn" title="Play">
						<svg id="play-icon" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5 3 19 12 5 21 5 3"></polygon>
						</svg>
						<svg id="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
							<rect x="6" y="4" width="4" height="16"></rect>
							<rect x="14" y="4" width="4" height="16"></rect>
						</svg>
					</button>

					<button class="control-btn" id="forward-btn" title="Forward 10s">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M13 5l7 7-7 7"></path>
						</svg>
					</button>

					<button class="control-btn" id="next-btn" title="Next">
						<svg viewBox="0 0 24 24" fill="currentColor">
							<path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
						</svg>
					</button>

					<div class="volume-container">
						<button class="volume-btn" id="volume-btn" title="Mute">
							<svg id="volume-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
								<path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
								<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
							</svg>
							<svg id="mute-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
								<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
								<line x1="23" y1="9" x2="17" y2="15"></line>
								<line x1="17" y1="9" x2="23" y2="15"></line>
							</svg>
						</button>
						<input type="range" class="volume-slider" id="volume-slider" min="0" max="1" step="0.1" value="1">
					</div>
				</div>
			</div>
		</div>

		<div class="playlist-panel">
			<div class="playlist-header">
				<div class="playlist-title">${escapeHtml(playlist.title || 'Playlist')}</div>
				<div class="playlist-count">${playlist.items.length} tracks</div>
			</div>
			<div class="playlist-items" id="playlist-items"></div>
		</div>
	</div>

	<script>
		const playlist = ${playlistJson};
		let currentIndex = 0;
		let isAudioMode = false;

		const media = document.getElementById('media');
		const playerContainer = document.getElementById('player-container');
		const mediaWrapper = document.getElementById('media-wrapper');
		const audioVisual = document.getElementById('audio-visual');
		const audioIcon = document.getElementById('audio-icon');
		const nowPlayingTitle = document.getElementById('now-playing-title');
		const nowPlayingArtist = document.getElementById('now-playing-artist');
		const playBtn = document.getElementById('play-btn');
		const playIcon = document.getElementById('play-icon');
		const pauseIcon = document.getElementById('pause-icon');
		const prevBtn = document.getElementById('prev-btn');
		const nextBtn = document.getElementById('next-btn');
		const rewindBtn = document.getElementById('rewind-btn');
		const forwardBtn = document.getElementById('forward-btn');
		const progressBar = document.getElementById('progress-bar');
		const progressFill = document.getElementById('progress-fill');
		const progressBuffered = document.getElementById('progress-buffered');
		const progressHandle = document.getElementById('progress-handle');
		const currentTimeEl = document.getElementById('current-time');
		const durationEl = document.getElementById('duration');
		const volumeBtn = document.getElementById('volume-btn');
		const volumeIcon = document.getElementById('volume-icon');
		const muteIcon = document.getElementById('mute-icon');
		const volumeSlider = document.getElementById('volume-slider');
		const loading = document.getElementById('loading');
		const playlistItems = document.getElementById('playlist-items');

		function formatTime(seconds) {
			if (isNaN(seconds)) return '0:00';
			const mins = Math.floor(seconds / 60);
			const secs = Math.floor(seconds % 60);
			return mins + ':' + secs.toString().padStart(2, '0');
		}

		function renderPlaylist() {
			playlistItems.innerHTML = playlist.map((item, i) => \`
				<div class="playlist-item\${i === currentIndex ? ' active' : ''}" data-index="\${i}">
					<div class="playlist-item-index">\${i + 1}</div>
					<div class="playlist-item-playing">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<polygon points="5 3 19 12 5 21 5 3"></polygon>
						</svg>
					</div>
					<div class="playlist-item-info">
						<div class="playlist-item-title">\${item.title || 'Track ' + (i + 1)}</div>
						<div class="playlist-item-artist">\${item.artist || ''}</div>
					</div>
					\${item.duration ? \`<div class="playlist-item-duration">\${formatTime(item.duration)}</div>\` : ''}
				</div>
			\`).join('');

			// Add click handlers
			playlistItems.querySelectorAll('.playlist-item').forEach(el => {
				el.addEventListener('click', () => {
					const index = parseInt(el.dataset.index);
					loadTrack(index);
				});
			});
		}

		function loadTrack(index) {
			if (index < 0 || index >= playlist.length) return;
			currentIndex = index;
			const item = playlist[index];
			const url = '/walrus/' + item.blobId;

			media.src = url;
			media.load();

			// Update UI
			renderPlaylist();
			updateNowPlaying(item);

			// Auto play
			media.play().catch(() => {});
		}

		function updateNowPlaying(item) {
			nowPlayingTitle.textContent = item.title || 'Track ' + (currentIndex + 1);
			nowPlayingArtist.textContent = item.artist || '';
			document.title = (item.title || 'Track') + ' | sui.ski player';
		}

		function updateProgress() {
			const percent = (media.currentTime / media.duration) * 100 || 0;
			progressFill.style.width = percent + '%';
			progressHandle.style.left = percent + '%';
			currentTimeEl.textContent = formatTime(media.currentTime);
		}

		function updateBuffered() {
			if (media.buffered.length > 0) {
				const buffered = (media.buffered.end(media.buffered.length - 1) / media.duration) * 100;
				progressBuffered.style.width = buffered + '%';
			}
		}

		function togglePlay() {
			if (media.paused) {
				media.play();
			} else {
				media.pause();
			}
		}

		function updatePlayButton() {
			const isPlaying = !media.paused;
			playIcon.style.display = isPlaying ? 'none' : 'block';
			pauseIcon.style.display = isPlaying ? 'block' : 'none';
			audioIcon.classList.toggle('playing', isPlaying);

			// Update playlist item state
			playlistItems.querySelectorAll('.playlist-item').forEach((el, i) => {
				el.classList.toggle('playing', isPlaying && i === currentIndex);
			});
		}

		function seek(e) {
			const rect = progressBar.getBoundingClientRect();
			const percent = (e.clientX - rect.left) / rect.width;
			media.currentTime = percent * media.duration;
		}

		function toggleMute() {
			media.muted = !media.muted;
			volumeIcon.style.display = media.muted ? 'none' : 'block';
			muteIcon.style.display = media.muted ? 'block' : 'none';
			volumeSlider.value = media.muted ? 0 : media.volume;
		}

		function playNext() {
			if (currentIndex < playlist.length - 1) {
				loadTrack(currentIndex + 1);
			}
		}

		function playPrev() {
			if (media.currentTime > 3) {
				media.currentTime = 0;
			} else if (currentIndex > 0) {
				loadTrack(currentIndex - 1);
			}
		}

		// Check if first track is audio or video
		function checkMediaType() {
			// We'll detect based on the Content-Type when loaded
			media.addEventListener('loadedmetadata', () => {
				const hasVideo = media.videoHeight > 0;
				isAudioMode = !hasVideo;
				playerContainer.classList.toggle('audio-mode', isAudioMode);
				audioVisual.style.display = isAudioMode ? 'flex' : 'none';
				media.style.display = isAudioMode ? 'none' : 'block';
			}, { once: false });
		}

		// Event listeners
		playBtn.addEventListener('click', togglePlay);
		prevBtn.addEventListener('click', playPrev);
		nextBtn.addEventListener('click', playNext);
		rewindBtn.addEventListener('click', () => { media.currentTime -= 10; });
		forwardBtn.addEventListener('click', () => { media.currentTime += 10; });

		media.addEventListener('play', updatePlayButton);
		media.addEventListener('pause', updatePlayButton);
		media.addEventListener('timeupdate', updateProgress);
		media.addEventListener('progress', updateBuffered);
		media.addEventListener('loadedmetadata', () => {
			durationEl.textContent = formatTime(media.duration);
		});
		media.addEventListener('ended', playNext);
		media.addEventListener('waiting', () => loading.classList.add('visible'));
		media.addEventListener('canplay', () => loading.classList.remove('visible'));

		progressBar.addEventListener('click', seek);
		let isDragging = false;
		progressBar.addEventListener('mousedown', (e) => { isDragging = true; seek(e); });
		document.addEventListener('mousemove', (e) => { if (isDragging) seek(e); });
		document.addEventListener('mouseup', () => { isDragging = false; });

		volumeBtn.addEventListener('click', toggleMute);
		volumeSlider.addEventListener('input', (e) => {
			media.volume = e.target.value;
			media.muted = e.target.value == 0;
			volumeIcon.style.display = media.muted ? 'none' : 'block';
			muteIcon.style.display = media.muted ? 'block' : 'none';
		});

		// Keyboard shortcuts
		document.addEventListener('keydown', (e) => {
			if (e.target.tagName === 'INPUT') return;
			switch (e.code) {
				case 'Space':
					e.preventDefault();
					togglePlay();
					break;
				case 'ArrowLeft':
					media.currentTime -= 10;
					break;
				case 'ArrowRight':
					media.currentTime += 10;
					break;
				case 'ArrowUp':
					media.volume = Math.min(1, media.volume + 0.1);
					volumeSlider.value = media.volume;
					break;
				case 'ArrowDown':
					media.volume = Math.max(0, media.volume - 0.1);
					volumeSlider.value = media.volume;
					break;
				case 'KeyM':
					toggleMute();
					break;
				case 'KeyN':
					playNext();
					break;
				case 'KeyP':
					playPrev();
					break;
			}
		});

		// Initialize
		checkMediaType();
		renderPlaylist();
		if (playlist.length > 0) {
			loadTrack(0);
		}
	</script>
</body>
</html>`
}
