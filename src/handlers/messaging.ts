/**
 * Sui Stack Messaging SDK Integration
 * Provides encrypted messaging functionality using:
 * - Sui: identity and state management
 * - Walrus: decentralized storage for attachments
 * - Seal: programmable access control and encryption
 *
 * Now with human-readable name resolution:
 * - @user.sui → resolves to Sui address via SuiNS
 * - #channel → resolves to channel object ID
 */

import type { Env } from '../types'
import {
	createMessagingResolver,
	isChannelName,
	isSuiNSName,
	normalizeChannelName,
	type ChannelInfo,
	type MessagingProfile,
} from '../resolvers/messaging'
import { htmlResponse, jsonResponse } from '../utils/response'
import { renderSocialMeta } from '../utils/social'

/**
 * Handle messaging-related API requests
 * Supports both legacy /api/messaging/* and new /api/channels/*, /api/users/* endpoints
 */
export async function handleMessagingRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname

	// Handle web UI routes for msg.sui.ski subdomain
	if (path === '/' || path === '') {
		return handleMessagingLandingPage(env)
	}

	// Channel web pages: /channels/#channel or /channels/:id
	if (path.startsWith('/channels/')) {
		const channelNameOrId = path.replace('/channels/', '').replace(/\/$/, '')
		if (!path.startsWith('/channels/') || !channelNameOrId) {
			return handleMessagingLandingPage(env)
		}
		return handleChannelPage(decodeURIComponent(channelNameOrId), env)
	}

	// User web pages: /users/@name.sui or /users/:address
	if (path.startsWith('/users/')) {
		const userNameOrAddress = path.replace('/users/', '').replace(/\/$/, '')
		if (!userNameOrAddress) {
			return handleMessagingLandingPage(env)
		}
		return handleUserPage(decodeURIComponent(userNameOrAddress), env)
	}

	// ========== API Endpoints ==========

	// GET /api/channels/:nameOrId - Get channel info
	const channelMatch = path.match(/^\/api\/channels\/([^/]+)$/)
	if (channelMatch && request.method === 'GET') {
		const nameOrId = decodeURIComponent(channelMatch[1])
		return handleGetChannel(nameOrId, env)
	}

	// GET /api/channels/:nameOrId/messages - Get channel messages (metadata only)
	const messagesMatch = path.match(/^\/api\/channels\/([^/]+)\/messages$/)
	if (messagesMatch && request.method === 'GET') {
		const nameOrId = decodeURIComponent(messagesMatch[1])
		return handleGetChannelMessages(nameOrId, url, env)
	}

	// POST /api/channels/register - Register channel name mapping
	if (path === '/api/channels/register' && request.method === 'POST') {
		return handleRegisterChannel(request, env)
	}

	// GET /api/users/:nameOrAddress - Get user messaging profile
	const userMatch = path.match(/^\/api\/users\/([^/]+)$/)
	if (userMatch && request.method === 'GET') {
		const nameOrAddress = decodeURIComponent(userMatch[1])
		return handleGetUser(nameOrAddress, env)
	}

	// GET /api/resolve - Universal resolver for names and channels
	if (path === '/api/resolve' && request.method === 'GET') {
		const input = url.searchParams.get('input')
		if (!input) {
			return jsonResponse({ error: 'Input parameter required' }, 400)
		}
		return handleResolve(input, env)
	}

	// ========== Legacy API Endpoints ==========

	// API endpoint for messaging status
	if (path === '/api/messaging/status') {
		const isMainnet = env.SUI_NETWORK === 'mainnet'
		const hasContract = !!env.MESSAGING_CONTRACT_ADDRESS
		const isTestnetContract =
			env.MESSAGING_CONTRACT_ADDRESS ===
			'0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d'

		return jsonResponse({
			enabled: hasContract,
			network: env.SUI_NETWORK,
			contractAddress: env.MESSAGING_CONTRACT_ADDRESS || 'Not configured',
			deployment: isMainnet && hasContract && !isTestnetContract ? 'mainnet' : 'testnet',
			features: {
				oneToOne: true,
				groupChat: true,
				encryption: true,
				walrusStorage: true,
				eventDriven: true,
				suinsResolution: true,
				channelNames: true,
			},
			status: 'alpha',
			warning:
				isMainnet && hasContract ? 'Self-deployed mainnet contract (alpha software)' : undefined,
		})
	}

	// API endpoint for getting user channels
	if (path === '/api/messaging/channels' && request.method === 'GET') {
		const address = url.searchParams.get('address')
		if (!address) {
			return jsonResponse({ error: 'Address parameter required' }, 400)
		}
		// This would integrate with the actual SDK
		return jsonResponse({
			message: 'Messaging SDK integration in progress',
			address,
			channels: [],
		})
	}

	return jsonResponse({ error: 'Unknown messaging endpoint' }, 404)
}

// ========== Channel API Handlers ==========

/**
 * GET /api/channels/:nameOrId
 */
async function handleGetChannel(nameOrId: string, env: Env): Promise<Response> {
	const resolver = createMessagingResolver(env)
	const channelInfo = await resolver.getChannelInfo(nameOrId)

	if (!channelInfo) {
		return jsonResponse(
			{
				error: 'Channel not found',
				code: 'CHANNEL_NOT_FOUND',
				query: nameOrId,
			},
			404,
		)
	}

	return jsonResponse({
		channel: channelInfo,
		links: {
			messages: `/api/channels/${encodeURIComponent(nameOrId)}/messages`,
			web: `/channels/${encodeURIComponent(nameOrId)}`,
		},
	})
}

/**
 * GET /api/channels/:nameOrId/messages
 * Returns message metadata (not encrypted content)
 */
async function handleGetChannelMessages(nameOrId: string, url: URL, env: Env): Promise<Response> {
	const resolver = createMessagingResolver(env)
	const channelId = await resolver.resolveChannel(nameOrId)

	if (!channelId) {
		return jsonResponse(
			{
				error: 'Channel not found',
				code: 'CHANNEL_NOT_FOUND',
				query: nameOrId,
			},
			404,
		)
	}

	// Pagination params
	const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '50', 10), 100)
	const cursor = url.searchParams.get('cursor')

	// Note: Full message retrieval would require the messaging SDK client
	return jsonResponse({
		channelId,
		messages: [],
		pagination: {
			limit,
			cursor,
			hasMore: false,
		},
		note: 'Message content is encrypted. Use the @mysten/messaging SDK client-side to decrypt.',
	})
}

/**
 * POST /api/channels/register - Register a channel name mapping
 */
async function handleRegisterChannel(request: Request, env: Env): Promise<Response> {
	try {
		const body = (await request.json()) as { name?: string; channelId?: string }
		const { name, channelId } = body

		if (!name || !channelId) {
			return jsonResponse(
				{
					error: 'Name and channelId are required',
					code: 'INVALID_REQUEST',
				},
				400,
			)
		}

		if (!isChannelName(name) && !name.startsWith('#')) {
			return jsonResponse(
				{
					error: 'Invalid channel name format. Use #channel format.',
					code: 'INVALID_CHANNEL_NAME',
				},
				400,
			)
		}

		if (!channelId.startsWith('0x')) {
			return jsonResponse(
				{
					error: 'Invalid channelId. Must be a Sui object ID.',
					code: 'INVALID_CHANNEL_ID',
				},
				400,
			)
		}

		const resolver = createMessagingResolver(env)
		await resolver.registerChannel(name, channelId)

		return jsonResponse({
			success: true,
			name: normalizeChannelName(name),
			channelId,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to register channel'
		return jsonResponse({ error: message, code: 'REGISTER_FAILED' }, 500)
	}
}

// ========== User API Handlers ==========

/**
 * GET /api/users/:nameOrAddress
 */
async function handleGetUser(nameOrAddress: string, env: Env): Promise<Response> {
	const resolver = createMessagingResolver(env)
	const profile = await resolver.getUserProfile(nameOrAddress)

	if (!profile) {
		return jsonResponse(
			{
				error: 'User not found',
				code: 'USER_NOT_FOUND',
				query: nameOrAddress,
			},
			404,
		)
	}

	return jsonResponse({
		profile,
		links: {
			suiski: profile.suinsName
				? `https://${profile.suinsName.replace('.sui', '')}.sui.ski`
				: null,
			explorer: `https://suiscan.xyz/${env.SUI_NETWORK}/account/${profile.address}`,
			messaging: `/users/${profile.suinsName || profile.address}`,
		},
	})
}

/**
 * GET /api/resolve - Universal resolver for addresses and channels
 */
async function handleResolve(input: string, env: Env): Promise<Response> {
	const resolver = createMessagingResolver(env)

	if (isChannelName(input)) {
		const channelId = await resolver.resolveChannel(input)
		return jsonResponse({
			type: 'channel',
			input,
			resolved: channelId,
			found: !!channelId,
		})
	}

	if (isSuiNSName(input) || input.includes('.sui') || input.startsWith('@')) {
		const address = await resolver.resolveAddress(input)
		return jsonResponse({
			type: 'address',
			input,
			resolved: address,
			found: !!address,
		})
	}

	// Assume it's an address if starts with 0x
	if (input.startsWith('0x')) {
		return jsonResponse({
			type: 'address',
			input,
			resolved: input,
			found: true,
		})
	}

	return jsonResponse({
		type: 'unknown',
		input,
		resolved: null,
		found: false,
		error: 'Unknown input format. Use @name.sui for addresses or #channel for channels.',
	})
}

// ========== Web UI Pages ==========

/**
 * Channel info page
 */
async function handleChannelPage(nameOrId: string, env: Env): Promise<Response> {
	const resolver = createMessagingResolver(env)
	const channelInfo = await resolver.getChannelInfo(nameOrId)

	if (!channelInfo) {
		return htmlResponse(notFoundChannelPage(nameOrId), 404)
	}

	return htmlResponse(channelPageHTML(channelInfo, env))
}

/**
 * User profile page
 */
async function handleUserPage(nameOrAddress: string, env: Env): Promise<Response> {
	const resolver = createMessagingResolver(env)
	const profile = await resolver.getUserProfile(nameOrAddress)

	if (!profile) {
		return htmlResponse(notFoundUserPage(nameOrAddress), 404)
	}

	return htmlResponse(userPageHTML(profile, env))
}

/**
 * Messaging landing page for msg.sui.ski
 */
function handleMessagingLandingPage(env: Env): Response {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Sui Messaging | sui.ski</title>
	${renderSocialMeta({
		title: 'Sui Messaging | sui.ski',
		description: 'Secure, decentralized messaging on Sui blockchain with SuiNS name support',
		url: 'https://msg.sui.ski',
		siteName: 'sui.ski',
	})}
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
			color: #e7e9ea;
			min-height: 100vh;
			display: flex;
			flex-direction: column;
		}
		.container {
			max-width: 800px;
			margin: 0 auto;
			padding: 2rem;
			flex: 1;
		}
		h1 {
			font-size: 2.5rem;
			margin-bottom: 1rem;
			background: linear-gradient(90deg, #4ca2ff, #7c3aed);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.subtitle {
			color: #71767b;
			font-size: 1.1rem;
			margin-bottom: 2rem;
		}
		.card {
			background: rgba(255,255,255,0.05);
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 12px;
			padding: 1.5rem;
			margin-bottom: 1.5rem;
		}
		.card h2 {
			color: #4ca2ff;
			margin-bottom: 1rem;
			font-size: 1.3rem;
		}
		.feature-list {
			list-style: none;
		}
		.feature-list li {
			padding: 0.5rem 0;
			padding-left: 1.5rem;
			position: relative;
		}
		.feature-list li::before {
			content: '→';
			position: absolute;
			left: 0;
			color: #4ca2ff;
		}
		code {
			background: rgba(255,255,255,0.1);
			padding: 0.2rem 0.5rem;
			border-radius: 4px;
			font-family: 'SF Mono', Monaco, monospace;
			font-size: 0.9em;
		}
		.api-endpoint {
			background: rgba(76, 162, 255, 0.1);
			border-left: 3px solid #4ca2ff;
			padding: 1rem;
			margin: 0.5rem 0;
			border-radius: 0 8px 8px 0;
		}
		.api-method {
			color: #7c3aed;
			font-weight: bold;
			margin-right: 0.5rem;
		}
		footer {
			text-align: center;
			padding: 1rem;
			color: #71767b;
			border-top: 1px solid rgba(255,255,255,0.1);
		}
		a { color: #4ca2ff; text-decoration: none; }
		a:hover { text-decoration: underline; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Sui Messaging</h1>
		<p class="subtitle">Secure, decentralized messaging on Sui with human-readable names</p>

		<div class="card">
			<h2>Name Resolution</h2>
			<p>The Sui Messaging SDK supports human-readable names:</p>
			<ul class="feature-list">
				<li><code>@alice.sui</code> → Resolves to Sui address via SuiNS</li>
				<li><code>#general</code> → Resolves to channel object ID</li>
			</ul>
		</div>

		<div class="card">
			<h2>API Endpoints</h2>
			<div class="api-endpoint">
				<span class="api-method">GET</span>
				<code>/api/channels/:nameOrId</code>
				<p style="margin-top: 0.5rem; color: #71767b;">Get channel information</p>
			</div>
			<div class="api-endpoint">
				<span class="api-method">GET</span>
				<code>/api/channels/:nameOrId/messages</code>
				<p style="margin-top: 0.5rem; color: #71767b;">Get message metadata (content is encrypted)</p>
			</div>
			<div class="api-endpoint">
				<span class="api-method">GET</span>
				<code>/api/users/:nameOrAddress</code>
				<p style="margin-top: 0.5rem; color: #71767b;">Get user messaging profile</p>
			</div>
			<div class="api-endpoint">
				<span class="api-method">GET</span>
				<code>/api/resolve?input=@name.sui</code>
				<p style="margin-top: 0.5rem; color: #71767b;">Universal resolver for names and channels</p>
			</div>
		</div>

		<div class="card">
			<h2>Client-Side Usage</h2>
			<p>Messages are end-to-end encrypted. Load the SDK client-side for full functionality:</p>
			<pre style="margin-top: 1rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; overflow-x: auto;"><code>import { SuiStackMessagingClient } from '@mysten/messaging';

const client = new SuiStackMessagingClient({
  // Your config here
});

// Resolve and send to a SuiNS name
await client.sendMessage('@alice.sui', 'Hello!');</code></pre>
		</div>

		<div class="card">
			<h2>Integration with sui.ski</h2>
			<ul class="feature-list">
				<li><a href="https://alice.sui.ski">alice.sui.ski</a> → Profile page with messaging link</li>
				<li><a href="/users/@alice.sui">/users/@alice.sui</a> → Messaging profile</li>
				<li><a href="/channels/%23general">/channels/#general</a> → Channel info</li>
			</ul>
		</div>
	</div>

	<footer>
		<p>Part of <a href="https://sui.ski">sui.ski</a> gateway • Network: ${env.SUI_NETWORK}</p>
	</footer>
</body>
</html>`

	return htmlResponse(html)
}

/**
 * Channel info page HTML
 */
function channelPageHTML(channel: ChannelInfo, env: Env): string {
	const title = channel.displayName || channel.name
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title} | Sui Messaging</title>
	${renderSocialMeta({
		title: `${title} | Sui Messaging`,
		description: channel.description || 'Channel on Sui Messaging',
		url: `https://msg.sui.ski/channels/${encodeURIComponent(channel.name)}`,
		siteName: 'sui.ski',
	})}
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
			color: #e7e9ea;
			min-height: 100vh;
			padding: 2rem;
		}
		.container { max-width: 600px; margin: 0 auto; }
		h1 {
			font-size: 2rem;
			margin-bottom: 0.5rem;
			color: #4ca2ff;
		}
		.channel-id {
			font-family: 'SF Mono', Monaco, monospace;
			font-size: 0.85rem;
			color: #71767b;
			word-break: break-all;
			margin-bottom: 1.5rem;
		}
		.card {
			background: rgba(255,255,255,0.05);
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 12px;
			padding: 1.5rem;
			margin-bottom: 1rem;
		}
		.stat {
			display: flex;
			justify-content: space-between;
			padding: 0.5rem 0;
			border-bottom: 1px solid rgba(255,255,255,0.1);
		}
		.stat:last-child { border-bottom: none; }
		.stat-label { color: #71767b; }
		a { color: #4ca2ff; text-decoration: none; }
		a:hover { text-decoration: underline; }
		.back { margin-top: 2rem; }
	</style>
</head>
<body>
	<div class="container">
		<h1>${title}</h1>
		<p class="channel-id">${channel.id}</p>

		<div class="card">
			${channel.description ? `<p style="margin-bottom: 1rem;">${channel.description}</p>` : ''}
			<div class="stat">
				<span class="stat-label">Type</span>
				<span>${channel.isPublic ? 'Public' : 'Private'}</span>
			</div>
			${
				channel.memberCount
					? `
			<div class="stat">
				<span class="stat-label">Members</span>
				<span>${channel.memberCount}</span>
			</div>
			`
					: ''
			}
			<div class="stat">
				<span class="stat-label">Network</span>
				<span>${env.SUI_NETWORK}</span>
			</div>
		</div>

		<div class="card">
			<p style="color: #71767b;">To join this channel and view messages, use the @mysten/messaging SDK client-side.</p>
		</div>

		<p class="back"><a href="/">← Back to Messaging</a></p>
	</div>
</body>
</html>`
}

/**
 * User profile page HTML
 */
function userPageHTML(profile: MessagingProfile, env: Env): string {
	const title =
		profile.displayName || profile.suinsName || `${profile.address.slice(0, 8)}...`
	const suiskiLink = profile.suinsName
		? `https://${profile.suinsName.replace('.sui', '')}.sui.ski`
		: null

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${title} | Sui Messaging</title>
	${renderSocialMeta({
		title: `${title} | Sui Messaging`,
		description: 'Messaging profile on Sui',
		url: `https://msg.sui.ski/users/${profile.suinsName || profile.address}`,
		siteName: 'sui.ski',
		image: profile.avatar,
	})}
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
			color: #e7e9ea;
			min-height: 100vh;
			padding: 2rem;
		}
		.container { max-width: 600px; margin: 0 auto; }
		.profile-header {
			display: flex;
			align-items: center;
			gap: 1.5rem;
			margin-bottom: 1.5rem;
		}
		.avatar {
			width: 80px;
			height: 80px;
			border-radius: 50%;
			background: linear-gradient(135deg, #4ca2ff, #7c3aed);
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 2rem;
			overflow: hidden;
		}
		.avatar img { width: 100%; height: 100%; object-fit: cover; }
		h1 { font-size: 1.8rem; color: #4ca2ff; }
		.address {
			font-family: 'SF Mono', Monaco, monospace;
			font-size: 0.85rem;
			color: #71767b;
			word-break: break-all;
		}
		.card {
			background: rgba(255,255,255,0.05);
			border: 1px solid rgba(255,255,255,0.1);
			border-radius: 12px;
			padding: 1.5rem;
			margin-bottom: 1rem;
		}
		.links { display: flex; flex-direction: column; gap: 0.5rem; }
		a { color: #4ca2ff; text-decoration: none; }
		a:hover { text-decoration: underline; }
		.back { margin-top: 2rem; }
		code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="profile-header">
			<div class="avatar">
				${profile.avatar ? `<img src="${profile.avatar}" alt="${title}">` : title.charAt(0).toUpperCase()}
			</div>
			<div>
				<h1>${title}</h1>
				${profile.suinsName ? `<p style="color: #71767b; margin-bottom: 0.25rem;">@${profile.suinsName}</p>` : ''}
				<p class="address">${profile.address}</p>
			</div>
		</div>

		<div class="card">
			<h3 style="margin-bottom: 1rem; color: #fff;">Links</h3>
			<div class="links">
				${suiskiLink ? `<a href="${suiskiLink}" target="_blank">→ sui.ski profile</a>` : ''}
				<a href="https://suiscan.xyz/${env.SUI_NETWORK}/account/${profile.address}" target="_blank">→ View on Suiscan</a>
			</div>
		</div>

		<div class="card">
			<p style="color: #71767b;">To message this user, use the @mysten/messaging SDK client-side with <code>@${profile.suinsName || profile.address}</code></p>
		</div>

		<p class="back"><a href="/">← Back to Messaging</a></p>
	</div>
</body>
</html>`
}

/**
 * Channel not found page
 */
function notFoundChannelPage(nameOrId: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Channel Not Found | Sui Messaging</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
			color: #e7e9ea;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.container { text-align: center; padding: 2rem; }
		h1 { color: #ef4444; margin-bottom: 1rem; }
		p { color: #71767b; margin-bottom: 1.5rem; }
		code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; }
		a { color: #4ca2ff; text-decoration: none; }
	</style>
</head>
<body>
	<div class="container">
		<h1>Channel Not Found</h1>
		<p>The channel <code>${nameOrId}</code> could not be found.</p>
		<a href="/">← Back to Messaging</a>
	</div>
</body>
</html>`
}

/**
 * User not found page
 */
function notFoundUserPage(nameOrAddress: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>User Not Found | Sui Messaging</title>
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: linear-gradient(135deg, #0f1419 0%, #1a2332 100%);
			color: #e7e9ea;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.container { text-align: center; padding: 2rem; }
		h1 { color: #ef4444; margin-bottom: 1rem; }
		p { color: #71767b; margin-bottom: 1.5rem; }
		code { background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; }
		a { color: #4ca2ff; text-decoration: none; }
	</style>
</head>
<body>
	<div class="container">
		<h1>User Not Found</h1>
		<p>The user <code>${nameOrAddress}</code> could not be found.</p>
		<a href="/">← Back to Messaging</a>
	</div>
</body>
</html>`
}

/**
 * Generate messaging UI for SuiNS profile pages
 */
export function generateMessagingUI(suinsName: string, ownerAddress: string, env: Env): string {
	const isMainnet = env.SUI_NETWORK === 'mainnet'
	const hasContract = !!env.MESSAGING_CONTRACT_ADDRESS
	const isTestnetContract =
		env.MESSAGING_CONTRACT_ADDRESS ===
		'0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d'
	const isMainnetDeployment = isMainnet && hasContract && !isTestnetContract
	const escapeHtml = (value: string) =>
		value.replace(/[&<>"']/g, (char) => {
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
	const serializeJson = (value: unknown) =>
		JSON.stringify(value).replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')
	const safeSuinsName = escapeHtml(suinsName)
	const suinsNameJson = serializeJson(suinsName)
	const ownerAddressJson = serializeJson(ownerAddress)

	return `
		<div class="messaging-section">
			<h3 class="messaging-title">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				Encrypted Messaging
				<span class="alpha-badge">Alpha</span>
			</h3>
			<p class="messaging-subtitle">Powered by Sui Stack (Sui + Walrus + Seal)</p>

			<div class="messaging-features">
				<div class="feature-card">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
					<h4>End-to-End Encrypted</h4>
					<p>Messages encrypted with Seal protocol</p>
				</div>

				<div class="feature-card">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="2" y1="12" x2="22" y2="12"></line>
						<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
					</svg>
					<h4>Decentralized Storage</h4>
					<p>Attachments stored on Walrus</p>
				</div>

				<div class="feature-card">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
					</svg>
					<h4>Group Chats</h4>
					<p>Token-gated & DAO channels</p>
				</div>
			</div>

			${
				hasContract && (isMainnetDeployment || !isMainnet)
					? `
			<div class="messaging-cta">
				<button class="messaging-button primary" onclick='openMessaging(${suinsNameJson}, ${ownerAddressJson})'>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
					Send Message to @${safeSuinsName}
				</button>
				<p class="network-badge-small">${isMainnetDeployment ? '🚀 Mainnet (Alpha)' : '⚠️ Testnet'}</p>
			</div>
			`
					: `
			<div class="messaging-cta">
				<div class="info-box">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="16" x2="12" y2="12"></line>
						<line x1="12" y1="8" x2="12.01" y2="8"></line>
					</svg>
					<p>Sui Stack Messaging SDK contracts not configured. ${isMainnet ? 'Deploy to mainnet or configure contract address.' : 'Switch to testnet to try encrypted messaging.'}</p>
					<a href="/messages" class="docs-link">
						Learn More →
					</a>
				</div>
			</div>
			`
			}

			<div class="messaging-links">
				<a href="https://blog.sui.io/sui-stack-messaging-sdk/" target="_blank" class="link-button">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
						<line x1="16" y1="13" x2="8" y2="13"></line>
						<line x1="16" y1="17" x2="8" y2="17"></line>
					</svg>
					Learn More About Sui Stack Messaging
				</a>
				<a href="https://chat.polymedia.app/" target="_blank" class="link-button">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
					Try Polymedia Chat (On-chain Chat)
				</a>
			</div>
		</div>

		<style>
			.messaging-section {
				margin: 24px 0;
				padding: 28px;
				background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.08));
				border: 1px solid rgba(96, 165, 250, 0.2);
				border-radius: 16px;
			}
			.messaging-title {
				display: flex;
				align-items: center;
				gap: 12px;
				font-size: 1.25rem;
				font-weight: 700;
				color: #e4e4e7;
				margin-bottom: 8px;
			}
			.messaging-title svg {
				width: 24px;
				height: 24px;
				color: #60a5fa;
			}
			.alpha-badge {
				font-size: 0.7rem;
				padding: 4px 8px;
				background: rgba(251, 191, 36, 0.15);
				color: #fbbf24;
				border-radius: 6px;
				text-transform: uppercase;
				font-weight: 700;
				letter-spacing: 0.05em;
			}
			.messaging-subtitle {
				color: #71717a;
				margin-bottom: 24px;
				font-size: 0.9rem;
			}
			.messaging-features {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
				gap: 16px;
				margin-bottom: 24px;
			}
			.feature-card {
				background: rgba(15, 23, 42, 0.6);
				padding: 20px;
				border-radius: 12px;
				border: 1px solid rgba(255, 255, 255, 0.08);
				text-align: center;
			}
			.feature-card svg {
				width: 32px;
				height: 32px;
				color: #60a5fa;
				margin-bottom: 12px;
			}
			.feature-card h4 {
				font-size: 0.95rem;
				font-weight: 600;
				color: #e4e4e7;
				margin-bottom: 6px;
			}
			.feature-card p {
				font-size: 0.85rem;
				color: #71717a;
			}
			.messaging-cta {
				text-align: center;
				margin-bottom: 20px;
			}
			.messaging-button {
				display: inline-flex;
				align-items: center;
				gap: 10px;
				padding: 14px 28px;
				background: linear-gradient(135deg, #60a5fa, #8b5cf6);
				border: none;
				border-radius: 12px;
				color: white;
				font-size: 1rem;
				font-weight: 600;
				cursor: pointer;
				transition: transform 0.2s, box-shadow 0.2s;
				box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
			}
			.messaging-button:hover {
				transform: translateY(-2px);
				box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
			}
			.messaging-button svg {
				width: 20px;
				height: 20px;
			}
			.network-badge-small {
				margin-top: 12px;
				font-size: 0.85rem;
				color: #fbbf24;
				font-weight: 600;
			}
			.info-box {
				background: rgba(59, 130, 246, 0.08);
				border: 1px solid rgba(96, 165, 250, 0.2);
				border-radius: 12px;
				padding: 20px;
				text-align: left;
			}
			.info-box svg {
				width: 20px;
				height: 20px;
				color: #60a5fa;
				float: left;
				margin-right: 12px;
				margin-top: 2px;
			}
			.info-box p {
				color: #cbd5f5;
				font-size: 0.9rem;
				line-height: 1.6;
				margin-bottom: 12px;
			}
			.docs-link {
				display: inline-block;
				color: #60a5fa;
				font-weight: 600;
				text-decoration: none;
				font-size: 0.9rem;
			}
			.docs-link:hover {
				text-decoration: underline;
			}
			.messaging-links {
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			.link-button {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 12px 16px;
				background: rgba(30, 30, 40, 0.6);
				border: 1px solid rgba(255, 255, 255, 0.08);
				border-radius: 10px;
				color: #60a5fa;
				font-size: 0.9rem;
				font-weight: 500;
				text-decoration: none;
				transition: all 0.2s;
			}
			.link-button:hover {
				border-color: #60a5fa;
				background: rgba(96, 165, 250, 0.1);
			}
			.link-button svg {
				width: 18px;
				height: 18px;
			}
		</style>

		<script>
		function openMessaging(suinsName, ownerAddress) {
			// This would integrate with the Sui Stack Messaging SDK
			alert('Messaging integration coming soon!\\n\\nThis will open an encrypted chat with @' + suinsName + ' using the Sui Stack Messaging SDK.\\n\\nFeatures:\\n• End-to-end encrypted messages\\n• Decentralized storage on Walrus\\n• Programmable access control with Seal\\n• Cross-device sync\\n• Event-driven messaging');

			// Future implementation would:
			// 1. Check if user has wallet connected
			// 2. Initialize SuiStackMessagingClient
			// 3. Create or open conversation channel
			// 4. Display messaging interface
		}
		</script>
	`
}

/**
 * Generate messaging page for sui.ski/messages
 */
export async function handleMessagingPage(env: Env): Promise<Response> {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Sui Stack Messaging | sui.ski</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			padding: 40px 20px;
		}
		.container {
			max-width: 1000px;
			margin: 0 auto;
		}
		.header {
			text-align: center;
			margin-bottom: 48px;
		}
		h1 {
			font-size: 3rem;
			font-weight: 800;
			margin-bottom: 1rem;
			background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.tagline {
			color: #71717a;
			font-size: 1.25rem;
			margin-bottom: 1.5rem;
		}
		.card {
			background: rgba(22, 22, 30, 0.9);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 16px;
			padding: 32px;
			margin-bottom: 24px;
		}
		h2 {
			font-size: 1.5rem;
			margin-bottom: 16px;
			color: #e4e4e7;
		}
		p {
			color: #71717a;
			line-height: 1.7;
			margin-bottom: 16px;
		}
		.feature-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 20px;
			margin: 24px 0;
		}
		.feature {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			padding: 24px;
			border-radius: 12px;
			border: 1px solid rgba(255, 255, 255, 0.06);
		}
		.feature h3 {
			font-size: 1.1rem;
			color: #60a5fa;
			margin-bottom: 12px;
		}
		a {
			color: #60a5fa;
			text-decoration: none;
		}
		a:hover {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🔒 Sui Stack Messaging</h1>
			<p class="tagline">End-to-end encrypted Web3 communication</p>
		</div>

		<div class="card">
			<h2>About Sui Stack Messaging SDK</h2>
			<p>
				The Sui Stack Messaging SDK, launched in September 2025, provides developers with a native way to build
				encrypted communication directly into Web3 applications. It combines three core components of the Sui ecosystem:
			</p>
			<div class="feature-grid">
				<div class="feature">
					<h3>Sui Blockchain</h3>
					<p>Verifiable identity and state management with smart contract-driven messaging</p>
				</div>
				<div class="feature">
					<h3>Walrus Protocol</h3>
					<p>Decentralized, content-addressed storage for attachments with proof of availability</p>
				</div>
				<div class="feature">
					<h3>Seal Encryption</h3>
					<p>Programmable access control for token-gated chats and role-based groups</p>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>Features</h2>
			<div class="feature-grid">
				<div class="feature">
					<h3>1:1 Encrypted Chat</h3>
					<p>Direct conversations encrypted end-to-end between wallet addresses</p>
				</div>
				<div class="feature">
					<h3>Group Channels</h3>
					<p>Token-gated communities, DAO governance channels, and role-based access</p>
				</div>
				<div class="feature">
					<h3>Event-Driven Messaging</h3>
					<p>Automated messages triggered by blockchain activities like NFT mints or governance votes</p>
				</div>
				<div class="feature">
					<h3>Cross-Device Sync</h3>
					<p>User recoverability to sync conversations without centralized servers</p>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>Developer Resources</h2>
			<p>
				<strong>SDK Package:</strong> <code>@mysten/messaging</code><br>
				<strong>Status:</strong> Alpha (Testnet Only)<br>
				<strong>Network:</strong> ${env.SUI_NETWORK}<br>
				<strong>Contract:</strong> <code>${env.MESSAGING_CONTRACT_ADDRESS || 'Not configured'}</code>
			</p>
			<p>
				<a href="https://github.com/MystenLabs/sui-stack-messaging-sdk" target="_blank">GitHub Repository</a> •
				<a href="https://blog.sui.io/sui-stack-messaging-sdk/" target="_blank">Official Announcement</a> •
				<a href="https://chat.polymedia.app/" target="_blank">Polymedia Chat Demo</a>
			</p>
		</div>
	</div>
</body>
</html>`

	return htmlResponse(html)
}
