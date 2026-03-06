/**
 * PWA App Handler
 * SKI app — channels, agents, and settings.
 *
 * Routes:
 * /app           - Main dashboard
 * /app/chat      - 1:1 conversation list
 * /app/chat/:id  - Individual encrypted chat
 * /app/channels  - Channel discovery
 * /app/channels/:id - Group channel view
 * /app/news      - Subscribed news feed
 * /app/news/create - Create broadcast channel
 * /app/agents    - Agent marketplace
 * /app/agents/:id - Agency dashboard
 * /app/settings  - User settings, IKA wallet config
 *
 * API Routes:
 * /api/app/*     - Subscription/config APIs
 * /api/agents/*  - Agency registry APIs
 * /api/ika/*     - IKA dWallet APIs
 * /api/llm/*     - LLM completion proxy
 */

import type { Env } from '../types'
import { htmlResponse, jsonResponse } from '../utils/response'
import { skiScriptTag, skiStyleTag, skiWalletBridge, skiWidgetMarkup } from '../utils/ski-embed'
import { generateWalletSessionJs } from '../utils/wallet-session-js'

const llmRateLimits = new Map<string, { count: number; resetAt: number }>()

export async function handleAppRequest(
	request: Request,
	env: Env,
	session?: { address: string | null; verified: boolean },
): Promise<Response> {
	const url = new URL(request.url)
	let path = url.pathname

	// Normalize path - remove /app prefix for routing
	if (path.startsWith('/app')) {
		path = path.slice(4) || '/'
	}

	// Handle API routes
	if (path.startsWith('/api/') || url.pathname.startsWith('/api/')) {
		return handleAppApi(request, env, url)
	}

	// All other routes serve the SPA shell
	// The client-side router handles the actual navigation
	return htmlResponse(generateAppShell(env, path, session))
}

/**
 * Store encrypted data on Walrus
 * Used for Seal-encrypted subscription blobs
 */
async function storeOnWalrus(
	encryptedData: string,
	env: Env,
): Promise<{ blobId: string | null; error?: string }> {
	const publisherUrl = env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space'

	try {
		// Convert base64 to binary for Walrus storage
		const binaryData = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))

		const response = await fetch(`${publisherUrl}/v1/blobs`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/octet-stream',
			},
			body: binaryData,
		})

		if (!response.ok) {
			const errorText = await response.text()
			return { blobId: null, error: `Walrus error: ${errorText}` }
		}

		const result = (await response.json()) as {
			newlyCreated?: { blobObject?: { blobId?: string } }
			alreadyCertified?: { blobId?: string }
		}

		// Handle both new and existing blobs
		const blobId =
			result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId || null

		return { blobId }
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return { blobId: null, error: message }
	}
}

/**
 * Handle app API requests
 */
async function handleAppApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname

	// /api/app/* - Messaging APIs
	if (path.startsWith('/api/app/')) {
		return handleMessagingApi(request, env, url)
	}

	// /api/agents/* - Agency APIs
	if (path.startsWith('/api/agents/') || path === '/api/agents') {
		return handleAgencyApi(request, env, url)
	}

	// /api/ika/* - IKA dWallet APIs
	if (path.startsWith('/api/ika/')) {
		return handleIkaApi(request, env, url)
	}

	// /api/llm/* - LLM proxy
	if (path.startsWith('/api/llm/')) {
		return handleLlmApi(request, env, url)
	}

	return jsonResponse({ error: 'Unknown API endpoint' }, 404)
}

async function handleMessagingApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/app/', '')

	// GET /api/app/subscriptions/config - Get Seal/Walrus config for subscriptions
	if (path === 'subscriptions/config' && request.method === 'GET') {
		const network = env.SUI_NETWORK || 'mainnet'
		const rpcUrl =
			env.SUI_RPC_URL ||
			(network === 'testnet'
				? 'https://fullnode.testnet.sui.io:443'
				: network === 'devnet'
					? 'https://fullnode.devnet.sui.io:443'
					: 'https://fullnode.mainnet.sui.io:443')
		const defaultSealKeyServers =
			network === 'mainnet'
				? ['0x145540d931f182fef76467dd8074c9839aea126852d90d18e1556fcbbd1208b6']
				: [
						'0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
						'0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
						'0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46',
					]
		const sealKeyServers = (env.SEAL_KEY_SERVERS || defaultSealKeyServers.join(','))
			.split(',')
			.map((id: string) => id.trim())
			.filter(Boolean)
		const walrusNetwork =
			network === 'mainnet' && env.WALRUS_NETWORK !== 'testnet'
				? 'mainnet'
				: env.WALRUS_NETWORK || 'testnet'
		const walrusPublisherDefault =
			walrusNetwork === 'mainnet'
				? 'https://publisher.walrus.space'
				: 'https://publisher.walrus-testnet.walrus.space'
		const walrusAggregatorDefault =
			walrusNetwork === 'mainnet'
				? 'https://aggregator.walrus.space'
				: 'https://aggregator.walrus-testnet.walrus.space'
		const messagingPackageId =
			network === 'mainnet'
				? '0xbcdf77f551f12be0fa61d1eb7bb2ff4169c1587aaa86fab84d95213cc75139f9'
				: '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d'
		const messagingPackageConfig = { packageId: messagingPackageId }
		const stormPackageId = String(env.STORM_PACKAGE_ID || '').trim() || null
		const stormRegistryId = String(env.STORM_REGISTRY_ID || '').trim() || null

		return jsonResponse({
			seal: {
				packageId:
					env.SEAL_PACKAGE_ID ||
					'0x7f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d4f4f8d',
				network,
				rpcUrl,
				supportedPolicies: [
					{
						type: 'address',
						description: 'Only specific address can decrypt',
						useCase: '1:1 direct messages',
					},
					{
						type: 'nft',
						description: 'Current NFT holder can decrypt',
						useCase: 'Transferable access rights',
					},
					{
						type: 'allowlist',
						description: 'Any address in allowlist can decrypt',
						useCase: 'Group chats, team access',
					},
					{
						type: 'threshold',
						description: 't-of-n signers required',
						useCase: 'Multi-sig controlled access',
					},
					{
						type: 'time_locked',
						description: 'Auto-unlocks at specified timestamp',
						useCase: 'Scheduled reveals, auctions',
					},
					{
						type: 'subscription',
						description: 'Valid subscription pass required',
						useCase: 'Paid content, premium features',
					},
				],
				keyServers: sealKeyServers.map((id: string) => ({ objectId: id, weight: 1 })),
				threshold: 2,
				approveTarget: env.SEAL_APPROVE_TARGET || null,
				encryption: {
					scheme: 'IBE',
					curve: 'BLS12-381',
					symmetric: 'AES-256-GCM',
				},
			},
			walrus: {
				publisherUrl: env.WALRUS_PUBLISHER_URL || walrusPublisherDefault,
				aggregatorUrl: env.WALRUS_AGGREGATOR_URL || walrusAggregatorDefault,
				network: walrusNetwork,
				encoding: 'Red Stuff 2D',
				replication: '4-5x',
			},
			sdk: {
				messagingSdk:
					'https://esm.sh/gh/arbuthnot-eth/sui-stack-messaging-sdk@mainnet-messaging-v3.3-2026-02-16/packages/messaging',
				sealSdk: 'https://cdn.jsdelivr.net/npm/@mysten/seal@1.0.1/+esm',
				suiSdk: 'https://cdn.jsdelivr.net/npm/@mysten/sui@2.6.0/+esm',
				messagingVersion: '0.4.0',
				messagingPackageConfig,
			},
			storm: {
				packageId: stormPackageId,
				registryId: stormRegistryId,
				module: 'registry',
				setFunction: 'set_channel_for_nft',
				clearFunction: 'clear_channel_for_nft',
				keyType: '0x2::object::ID',
				valueType: 'address',
			},
			security: {
				signatureSchemes: ['ed25519', 'secp256k1', 'secp256r1'],
				nonceExpiry: 300_000,
				maxMessageSize: 1_048_576,
				replayProtection: true,
				integrityAlgorithm: 'sha256',
			},
			version: 3,
		})
	}

	// POST /api/app/subscriptions/sync - Store encrypted subscription blob on Walrus
	if (path === 'subscriptions/sync' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				encryptedBlob?: string // Base64 encoded Seal-encrypted data
				subscriberAddress?: string
				sealPolicyId?: string
				signature?: string // Wallet signature to verify ownership
			}

			if (!body.encryptedBlob || !body.subscriberAddress) {
				return jsonResponse({ error: 'Encrypted blob and subscriber address required' }, 400)
			}

			// Verify the signature matches the subscriber address
			// In production, this would verify the wallet signature

			// Store on Walrus (encrypted blob - server never sees plaintext)
			const walrusResponse = await storeOnWalrus(body.encryptedBlob, env)

			if (!walrusResponse.blobId) {
				return jsonResponse({ error: 'Failed to store on Walrus' }, 500)
			}

			// Return the blob ID for client to store
			return jsonResponse({
				success: true,
				blobId: walrusResponse.blobId,
				subscriberAddress: body.subscriberAddress,
				sealPolicyId: body.sealPolicyId,
				version: Date.now(),
				storage: 'walrus',
				note: 'Encrypted subscriptions stored on Walrus. Only you can decrypt with your wallet.',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/app/subscriptions/blob/:blobId - Retrieve encrypted subscription blob
	const blobMatch = path.match(/^subscriptions\/blob\/([^/]+)$/)
	if (blobMatch && request.method === 'GET') {
		const blobId = blobMatch[1]

		try {
			// Fetch encrypted blob from Walrus
			const aggregatorUrl =
				env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space'
			const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`)

			if (!response.ok) {
				return jsonResponse({ error: 'Blob not found' }, 404)
			}

			const encryptedData = await response.text()

			return jsonResponse({
				blobId,
				encryptedData,
				note: 'Decrypt client-side with Seal SDK using your wallet',
			})
		} catch {
			return jsonResponse({ error: 'Failed to fetch blob' }, 500)
		}
	}

	// Join request routes: /api/app/messages/server/channels/:channel/join-requests[/:id[/approve]]
	const joinMatch = path.match(
		/^messages\/server\/channels\/([^/]+)\/join-requests(?:\/([^/]+))?(?:\/(approve))?$/,
	)
	if (joinMatch) {
		const channelSlug = decodeURIComponent(joinMatch[1])
		const requestId = joinMatch[2] ? decodeURIComponent(joinMatch[2]) : null
		const approveAction = joinMatch[3] === 'approve'
		const serverName = url.searchParams.get('name') || ''
		const doStub = env.WALLET_SESSIONS.getByName('global')

		if (request.method === 'GET' && !requestId) {
			const requests = await doStub.listJoinRequests(serverName, channelSlug)
			return jsonResponse({ requests })
		}

		if (request.method === 'POST') {
			if (requestId && approveAction) {
				const ok = await doStub.approveJoinRequest(requestId)
				if (!ok) return jsonResponse({ error: 'Request not found' }, 404)
				return jsonResponse({ success: true })
			}

			const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
			const requesterAddress = String(body.requesterAddress || '').trim()
			const requesterName = String(body.requesterName || '').trim()

			if (!requesterAddress) {
				return jsonResponse({ error: 'Requester address is required' }, 400)
			}

			const result = await doStub.createJoinRequest(
				serverName,
				channelSlug,
				requesterAddress,
				requesterName || undefined,
			)
			if (result.duplicate) {
				return jsonResponse({ duplicate: true, id: result.id })
			}
			return jsonResponse({ success: true, id: result.id })
		}

		if (request.method === 'DELETE' && requestId) {
			await doStub.deleteJoinRequest(requestId)
			return jsonResponse({ success: true })
		}
	}

	return jsonResponse({ error: 'Unknown messaging endpoint' }, 404)
}

/**
 * Agency API handlers
 */
async function handleAgencyApi(request: Request, _env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/agents/', '').replace('/api/agents', '')

	// GET /api/agents - List agencies
	if ((path === '' || path === '/') && request.method === 'GET') {
		const filter = url.searchParams.get('filter') || 'public'
		// Placeholder - would query on-chain agency registry
		return jsonResponse({
			agencies: [],
			filter,
			note: 'Agency registry coming soon. Configure AGENCY_REGISTRY_ID in env.',
		})
	}

	// POST /api/agents/register - Register new agency (returns tx builder)
	if (path === 'register' && request.method === 'POST') {
		try {
			const body = (await request.json()) as { name?: string }
			if (!body.name) {
				return jsonResponse({ error: 'Agency name required' }, 400)
			}
			return jsonResponse({
				action: 'register_agency',
				params: body,
				note: 'Build and sign transaction client-side',
			})
		} catch {
			return jsonResponse({ error: 'Invalid request body' }, 400)
		}
	}

	// GET /api/agents/:id - Get agency details
	const agencyMatch = path.match(/^([^/]+)$/)
	if (agencyMatch && request.method === 'GET') {
		const agencyId = agencyMatch[1]
		// Placeholder - would fetch from chain
		return jsonResponse(
			{
				error: 'Agency not found',
				agencyId,
				note: 'Agency registry not yet configured',
			},
			404,
		)
	}

	// POST /api/agents/:id/delegate - Create delegation capability
	const delegateMatch = path.match(/^([^/]+)\/delegate$/)
	if (delegateMatch && request.method === 'POST') {
		const agencyId = delegateMatch[1]
		return jsonResponse({
			action: 'create_delegation',
			agencyId,
			note: 'Delegation requires IKA dWallet setup',
		})
	}

	// GET /api/agents/:id/members - List agency members
	const membersMatch = path.match(/^([^/]+)\/members$/)
	if (membersMatch && request.method === 'GET') {
		const agencyId = membersMatch[1]
		return jsonResponse({
			agencyId,
			members: [],
			note: 'Agency not found',
		})
	}

	return jsonResponse({ error: 'Unknown agency endpoint' }, 404)
}

/**
 * IKA dWallet API handlers
 */
async function handleIkaApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/ika/', '')

	// Check if IKA is configured
	if (!env.IKA_PACKAGE_ID) {
		return jsonResponse(
			{
				error: 'IKA not configured',
				note: 'Set IKA_PACKAGE_ID in environment variables',
				docs: 'https://docs.ika.xyz',
			},
			503,
		)
	}

	// POST /api/ika/dwallet/create - Create dWallet (returns tx builder)
	if (path === 'dwallet/create' && request.method === 'POST') {
		return jsonResponse({
			action: 'create_dwallet',
			packageId: env.IKA_PACKAGE_ID,
			note: 'Load @ika.xyz/sdk client-side to create dWallet',
			sdk: 'https://unpkg.com/@ika.xyz/sdk',
		})
	}

	// GET /api/ika/dwallet/:id/addresses - Get foreign chain addresses
	const addressesMatch = path.match(/^dwallet\/([^/]+)\/addresses$/)
	if (addressesMatch && request.method === 'GET') {
		const dWalletId = addressesMatch[1]
		// Placeholder - would fetch from IKA
		return jsonResponse({
			dWalletId,
			addresses: {},
			note: 'dWallet not found or not yet created',
		})
	}

	// POST /api/ika/dwallet/:id/sign - Request cross-chain signature
	const signMatch = path.match(/^dwallet\/([^/]+)\/sign$/)
	if (signMatch && request.method === 'POST') {
		const dWalletId = signMatch[1]
		return jsonResponse({
			action: 'sign_crosschain',
			dWalletId,
			note: '2PC-MPC signing requires client-side SDK and user approval',
		})
	}

	// GET /api/ika/status - IKA integration status
	if (path === 'status') {
		return jsonResponse({
			enabled: true,
			packageId: env.IKA_PACKAGE_ID,
			network: env.SUI_NETWORK,
			features: {
				bitcoin: true,
				ethereum: true,
				solana: true,
			},
		})
	}

	return jsonResponse({ error: 'Unknown IKA endpoint' }, 404)
}

/**
 * LLM proxy API handlers (rate-limited)
 */
async function handleLlmApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/llm/', '')

	// Check if LLM is configured
	if (!env.LLM_API_KEY) {
		return jsonResponse(
			{
				error: 'LLM not configured',
				note: 'Set LLM_API_KEY in environment variables',
			},
			503,
		)
	}

	const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown'
	const now = Date.now()
	const entry = llmRateLimits.get(clientIP)

	if (entry && now < entry.resetAt) {
		if (entry.count >= 10) {
			return jsonResponse(
				{
					error: 'Rate limit exceeded',
					retryAfter: Math.ceil((entry.resetAt - now) / 1000),
				},
				429,
			)
		}
		entry.count++
	} else {
		llmRateLimits.set(clientIP, { count: 1, resetAt: now + 60_000 })
	}

	// POST /api/llm/complete - Completion endpoint
	if (path === 'complete' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				prompt?: string
				context?: string
				maxTokens?: number
			}
			if (!body.prompt) {
				return jsonResponse({ error: 'Prompt required' }, 400)
			}

			const apiUrl = env.LLM_API_URL || 'https://api.anthropic.com/v1/messages'
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': env.LLM_API_KEY,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: 'claude-3-haiku-20240307',
					max_tokens: Math.min(body.maxTokens || 500, 1000),
					messages: [
						{
							role: 'user',
							content: body.context ? `Context: ${body.context}\n\n${body.prompt}` : body.prompt,
						},
					],
				}),
			})

			if (!response.ok) {
				const error = await response.text()
				return jsonResponse({ error: 'LLM request failed', details: error }, response.status)
			}

			const result = await response.json()
			return jsonResponse(result)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return jsonResponse({ error: 'LLM request failed', details: message }, 500)
		}
	}

	// POST /api/llm/summarize - Summarize conversation
	if (path === 'summarize' && request.method === 'POST') {
		try {
			const body = (await request.json()) as { messages?: string[] }
			if (!body.messages?.length) {
				return jsonResponse({ error: 'Messages array required' }, 400)
			}

			const apiUrl = env.LLM_API_URL || 'https://api.anthropic.com/v1/messages'
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': env.LLM_API_KEY,
					'anthropic-version': '2023-06-01',
				},
				body: JSON.stringify({
					model: 'claude-3-haiku-20240307',
					max_tokens: 300,
					messages: [
						{
							role: 'user',
							content: `Summarize this conversation concisely:\n\n${body.messages.join('\n\n')}`,
						},
					],
				}),
			})

			if (!response.ok) {
				const error = await response.text()
				return jsonResponse({ error: 'Summarization failed', details: error }, response.status)
			}

			const result = await response.json()
			return jsonResponse(result)
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return jsonResponse({ error: 'Summarization failed', details: message }, 500)
		}
	}

	return jsonResponse({ error: 'Unknown LLM endpoint' }, 404)
}

/**
 * Generate the PWA app shell HTML
 * This serves as the SPA container with client-side routing
 */
function generateAppShell(
	env: Env,
	currentPath: string,
	session?: { address: string | null; verified: boolean },
): string {
	const title = getPageTitle(currentPath)

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
	<title>${title} | sui.ski</title>
	<meta name="description" content="Secure, decentralized communications on Sui blockchain">
	<meta name="theme-color" content="#000">
	
	<style>
		${getAppStyles()}
	</style>
	${skiStyleTag()}
</head>
<body>
	<div id="app">
		${generateAppContent(currentPath, env)}
	</div>

	${skiWidgetMarkup()}
	<script>
		${getAppScript(env, session)}
	</script>
	${skiScriptTag()}
</body>
</html>`
}

function getPageTitle(path: string): string {
	if (path === '/' || path === '') return 'SKI'
	if (path.startsWith('/chat')) return 'Chat'
	if (path.startsWith('/channels')) return 'Channels'
	if (path.startsWith('/news')) return 'News'
	if (path.startsWith('/agents')) return 'Agents'
	if (path.startsWith('/settings')) return 'Settings'
	return 'SKI'
}

function getAppStyles(): string {
	return `
		* { margin: 0; padding: 0; box-sizing: border-box; }

		:root {
			--bg-primary: #000;
			--bg-secondary: #12121a;
			--bg-tertiary: #1a1a24;
			--text-primary: #e4e4e7;
			--text-secondary: #71717a;
			--accent: #60a5fa;
			--accent-hover: #3b82f6;
			--success: #22c55e;
			--warning: #f59e0b;
			--error: #ef4444;
			--border: rgba(255, 255, 255, 0.08);
		}

		html, body {
			height: 100%;
			overflow: hidden;
		}

		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			background: var(--bg-primary);
			color: var(--text-primary);
		}

		#app {
			display: flex;
			flex-direction: column;
			height: 100%;
			max-width: 100%;
		}

		/* Header */
		.app-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 12px 16px;
			background: var(--bg-secondary);
			border-bottom: 1px solid var(--border);
			position: sticky;
			top: 0;
			z-index: 100;
		}

		.app-logo {
			font-size: 1.25rem;
			font-weight: 700;
			background: linear-gradient(135deg, var(--accent), #a78bfa);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
			text-decoration: none;
		}

		.wallet-bar {
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.wallet-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 8px 16px;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			border: none;
			border-radius: 8px;
			color: white;
			font-weight: 600;
			font-size: 0.875rem;
			cursor: pointer;
			transition: transform 0.2s, box-shadow 0.2s;
		}

		.wallet-btn:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
		}

		.wallet-connected {
			background: var(--bg-tertiary);
			border: 1px solid var(--border);
		}

		/* Main content */
		.app-main {
			flex: 1;
			overflow-y: auto;
			padding: 0;
		}

		/* Bottom navigation */
		.app-nav {
			display: flex;
			background: var(--bg-secondary);
			border-top: 1px solid var(--border);
			padding: 8px 0;
			padding-bottom: max(8px, env(safe-area-inset-bottom));
		}

		.nav-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			padding: 8px;
			color: var(--text-secondary);
			text-decoration: none;
			font-size: 0.75rem;
			transition: color 0.2s;
		}

		.nav-item:hover, .nav-item.active {
			color: var(--accent);
		}

		.nav-item svg {
			width: 24px;
			height: 24px;
		}

		/* Dashboard cards */
		.dashboard {
			padding: 16px;
			display: flex;
			flex-direction: column;
			gap: 16px;
		}

		.welcome-card {
			background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(139, 92, 246, 0.1));
			border: 1px solid rgba(96, 165, 250, 0.2);
			border-radius: 16px;
			padding: 24px;
		}

		.welcome-card h1 {
			font-size: 1.5rem;
			margin-bottom: 8px;
		}

		.welcome-card p {
			color: var(--text-secondary);
			margin-bottom: 16px;
		}

		.feature-grid {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 12px;
		}

		.feature-card {
			background: var(--bg-secondary);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 16px;
			text-decoration: none;
			color: inherit;
			transition: border-color 0.2s, transform 0.2s;
		}

		.feature-card:hover {
			border-color: var(--accent);
			transform: translateY(-2px);
		}

		.feature-card h3 {
			font-size: 1rem;
			margin-bottom: 4px;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.feature-card p {
			font-size: 0.85rem;
			color: var(--text-secondary);
		}

		.feature-card svg {
			width: 20px;
			height: 20px;
			color: var(--accent);
		}

		/* Status badges */
		.status-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 4px 10px;
			border-radius: 999px;
			font-size: 0.75rem;
			font-weight: 600;
		}

		.status-alpha {
			background: rgba(251, 191, 36, 0.15);
			color: #fbbf24;
		}

		.status-connected {
			background: rgba(34, 197, 94, 0.15);
			color: var(--success);
		}

		/* Empty states */
		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 48px 24px;
			text-align: center;
		}

		.empty-state svg {
			width: 64px;
			height: 64px;
			color: var(--text-secondary);
			margin-bottom: 16px;
			opacity: 0.5;
		}

		.empty-state h2 {
			font-size: 1.25rem;
			margin-bottom: 8px;
		}

		.empty-state p {
			color: var(--text-secondary);
			max-width: 280px;
		}

		/* Chat list */
		.chat-list {
			display: flex;
			flex-direction: column;
		}

		.chat-item {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 16px;
			border-bottom: 1px solid var(--border);
			text-decoration: none;
			color: inherit;
			transition: background 0.2s;
		}

		.chat-item:hover {
			background: var(--bg-secondary);
		}

		.chat-avatar {
			width: 48px;
			height: 48px;
			border-radius: 50%;
			background: linear-gradient(135deg, var(--accent), #8b5cf6);
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 700;
			font-size: 1.25rem;
		}

		.chat-info {
			flex: 1;
			min-width: 0;
		}

		.chat-name {
			font-weight: 600;
			margin-bottom: 2px;
		}

		.chat-preview {
			color: var(--text-secondary);
			font-size: 0.875rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.chat-meta {
			text-align: right;
		}

		.chat-time {
			font-size: 0.75rem;
			color: var(--text-secondary);
		}

		.unread-badge {
			background: var(--accent);
			color: white;
			font-size: 0.75rem;
			font-weight: 700;
			padding: 2px 8px;
			border-radius: 999px;
			margin-top: 4px;
			display: inline-block;
		}

		/* Loading state */
		.loading {
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 48px;
		}

		.spinner {
			width: 32px;
			height: 32px;
			border: 3px solid var(--border);
			border-top-color: var(--accent);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		@keyframes spin {
			to { transform: rotate(360deg); }
		}

		/* Responsive */
		@media (min-width: 768px) {
			.feature-grid {
				grid-template-columns: repeat(4, 1fr);
			}
		}
	`
}

function generateAppContent(path: string, env: Env): string {
	// Header with wallet connection
	const header = `
		<header class="app-header">
			<a href="/app" class="app-logo">sui.ski</a>
			<div class="wallet-bar">
				<span class="status-badge status-alpha">Alpha</span>
				<button class="wallet-btn" id="connect-wallet" onclick="connectWallet()">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
						<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
						<line x1="1" y1="10" x2="23" y2="10"></line>
					</svg>
					<span id="wallet-text">Connect</span>
				</button>
			</div>
		</header>
	`

	// Bottom navigation
	const nav = `
		<nav class="app-nav">
			<a href="/app/chat" class="nav-item ${path.startsWith('/chat') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				Chat
			</a>
			<a href="/app/channels" class="nav-item ${path.startsWith('/channels') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
					<circle cx="9" cy="7" r="4"></circle>
					<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
					<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
				</svg>
				Channels
			</a>
			<a href="/app/news" class="nav-item ${path.startsWith('/news') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
				</svg>
				News
			</a>
			<a href="/app/agents" class="nav-item ${path.startsWith('/agents') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="3"></circle>
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
				</svg>
				Agents
			</a>
			<a href="/app/settings" class="nav-item ${path.startsWith('/settings') ? 'active' : ''}">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10"></circle>
					<circle cx="12" cy="12" r="4"></circle>
					<line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
					<line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
					<line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
					<line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
				</svg>
				Settings
			</a>
		</nav>
	`

	// Page content based on path
	let content = ''
	if (path === '/' || path === '') {
		content = generateDashboard(env)
	} else if (path === '/chat' || path.startsWith('/chat/')) {
		content = generateChatPage(path, env)
	} else if (path === '/channels' || path.startsWith('/channels/')) {
		content = generateChannelsPage(path, env)
	} else if (path === '/news' || path.startsWith('/news/')) {
		content = generateNewsPage(path, env)
	} else if (path === '/agents' || path.startsWith('/agents/')) {
		content = generateAgentsPage(path, env)
	} else if (path === '/settings') {
		content = generateSettingsPage(env)
	} else {
		content = `<div class="empty-state"><h2>Page Not Found</h2></div>`
	}

	return `${header}<main class="app-main">${content}</main>${nav}`
}

function generateDashboard(env: Env): string {
	return `
		<div class="dashboard">
			<div class="welcome-card">
				<h1>Welcome to SKI</h1>
				<p>Secure, decentralized communications on Sui blockchain</p>
				<div class="feature-grid">
					<a href="/app/chat" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
							</svg>
							Chat
						</h3>
						<p>E2E encrypted 1:1 messaging</p>
					</a>
					<a href="/app/channels" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
								<circle cx="9" cy="7" r="4"></circle>
								<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
								<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
							</svg>
							Channels
						</h3>
						<p>Token-gated group chats</p>
					</a>
					<a href="/app/news" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
							</svg>
							News
						</h3>
						<p>Community broadcasts</p>
					</a>
					<a href="/app/agents" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="3"></circle>
								<path d="M12 1v4"></path>
								<path d="M12 19v4"></path>
								<path d="M1 12h4"></path>
								<path d="M19 12h4"></path>
							</svg>
							Agents
						</h3>
						<p>AI + human delegation</p>
					</a>
				</div>
			</div>

			<div class="feature-card" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(96, 165, 250, 0.1)); border-color: rgba(139, 92, 246, 0.2);">
				<h3 style="margin-bottom: 12px;">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<path d="M12 16v-4"></path>
						<path d="M12 8h.01"></path>
					</svg>
					How It Works
				</h3>
				<p style="margin-bottom: 8px;">This app uses the <strong>Sui Stack Messaging SDK</strong> for encrypted communications:</p>
				<ul style="color: var(--text-secondary); font-size: 0.85rem; padding-left: 20px; margin-bottom: 12px;">
					<li>Messages encrypted with Seal protocol</li>
					<li>Attachments stored on Walrus</li>
					<li>Cross-chain control via IKA dWallets</li>
					<li>AI agents with guardrails</li>
				</ul>
				<p style="font-size: 0.85rem;">Network: <strong>${env.SUI_NETWORK}</strong></p>
			</div>
		</div>
	`
}

function generateChatPage(path: string, _env: Env): string {
	if (path === '/chat') {
		// Chat list
		return `
			<div class="chat-list">
				<div class="empty-state">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
					<h2>No Conversations Yet</h2>
					<p>Connect your wallet and start a conversation with any Sui address or SuiNS name.</p>
				</div>
			</div>
		`
	}

	// Individual chat view
	const chatId = path.replace('/chat/', '')
	return `
		<div class="empty-state">
			<h2>Chat with ${chatId}</h2>
			<p>Connect wallet to load encrypted messages.</p>
		</div>
	`
}

function generateChannelsPage(path: string, _env: Env): string {
	if (path === '/channels') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>Channels</h1>
					<p>Join token-gated communities and group chats</p>
				</div>
				<div class="empty-state">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
					</svg>
					<h2>No Channels Found</h2>
					<p>Public channels will appear here. Create your own or join with an invite.</p>
				</div>
			</div>
		`
	}

	const channelId = path.replace('/channels/', '')
	return `
		<div class="empty-state">
			<h2>Channel: ${channelId}</h2>
			<p>Connect wallet to view channel content.</p>
		</div>
	`
}

function generateNewsPage(path: string, _env: Env): string {
	if (path === '/news') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>News Feed</h1>
					<p>Subscribe to broadcast channels from your favorite projects</p>
				</div>
				<div class="empty-state">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
					</svg>
					<h2>No Subscriptions</h2>
					<p>Browse and subscribe to news channels to see updates here.</p>
				</div>
			</div>
		`
	}

	if (path === '/news/create') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>Create News Channel</h1>
					<p>Start a broadcast channel for your community</p>
				</div>
			</div>
		`
	}

	return `<div class="empty-state"><h2>News Post</h2></div>`
}

function generateAgentsPage(path: string, _env: Env): string {
	if (path === '/agents') {
		return `
			<div class="dashboard">
				<div class="welcome-card">
					<h1>Agent Marketplace</h1>
					<p>Create agencies with AI agents and human members</p>
				</div>
				<div class="feature-grid">
					<a href="/app/agents/create" class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="12" y1="8" x2="12" y2="16"></line>
								<line x1="8" y1="12" x2="16" y2="12"></line>
							</svg>
							Create Agency
						</h3>
						<p>Start your own agency with delegated permissions</p>
					</a>
					<div class="feature-card">
						<h3>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="11" cy="11" r="8"></circle>
								<path d="M21 21l-4.35-4.35"></path>
							</svg>
							Browse Agencies
						</h3>
						<p>Find and join existing agencies</p>
					</div>
				</div>
				<div class="feature-card" style="margin-top: 8px;">
					<h3>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
						</svg>
						IKA Cross-Chain Control
					</h3>
					<p>Agencies can control dWallets on Bitcoin, Ethereum, and Solana with 2PC-MPC security. LLM agents require human approval for sensitive actions.</p>
				</div>
			</div>
		`
	}

	const agencyId = path.replace('/agents/', '')
	return `
		<div class="empty-state">
			<h2>Agency: ${agencyId}</h2>
			<p>Agency dashboard coming soon.</p>
		</div>
	`
}

function generateSettingsPage(env: Env): string {
	return `
		<div class="dashboard">
			<div class="welcome-card">
				<h1>Settings</h1>
				<p>Configure your account and preferences</p>
			</div>
			<div class="feature-card">
				<h3>Network</h3>
				<p>Connected to: <strong>${env.SUI_NETWORK}</strong></p>
			</div>
			<div class="feature-card">
				<h3>IKA dWallet</h3>
				<p>${env.IKA_PACKAGE_ID ? 'Configured' : 'Not configured'}</p>
			</div>
			<div class="feature-card">
				<h3>AI Copilot</h3>
				<p>${env.LLM_API_KEY ? 'Enabled' : 'Not configured'}</p>
			</div>
		</div>
	`
}

function getAppScript(env: Env, session?: { address: string | null; verified: boolean }): string {
	return `
		${generateWalletSessionJs()}
		var __skiServerSession = ${session?.address ? JSON.stringify({ address: session.address, verified: session.verified }) : 'null'};
		if (__skiServerSession && __skiServerSession.address) { initSessionFromServer(__skiServerSession); }
		
		${skiWalletBridge({ network: env.SUI_NETWORK })}

		let connectedAddress = null;

		function onAppWalletConnected() {
			if (!window._skiAddr) return;
			connectedAddress = window._skiAddr;
			
			const text = document.getElementById('wallet-text');
			const btn = document.getElementById('connect-wallet');
			if (text) text.textContent = connectedAddress.slice(0, 6) + '...' + connectedAddress.slice(-4);
			if (btn) btn.classList.add('wallet-connected');
		}

		function onAppWalletDisconnected() {
			connectedAddress = null;
			const text = document.getElementById('wallet-text');
			const btn = document.getElementById('connect-wallet');
			if (text) text.textContent = 'Connect';
			if (btn) btn.classList.remove('wallet-connected');
		}

		window.connectWallet = function() {
			if (connectedAddress) {
				window._skiDisconnect();
				return;
			}
			window.dispatchEvent(new CustomEvent('ski:request-signin'));
		};

		window.addEventListener('load', function() { window.dispatchEvent(new CustomEvent('ski:request-signin')); });

		window._skiSubscribe(function(conn) {
			if (conn && conn.address) {
				onAppWalletConnected();
			}
		}, function() {
			onAppWalletDisconnected();
		});

		// Client-side routing
		document.addEventListener('click', (e) => {
			const link = e.target.closest('a[href^="/app"]');
			if (link) {
				e.preventDefault();
				const href = link.getAttribute('href');
				history.pushState(null, '', href);
				// In a full SPA, this would update the view
				window.location.href = href;
			}
		});

		// Handle back/forward
		window.addEventListener('popstate', () => {
			window.location.reload();
		});

		// Initial state
		if (window._skiAddr) {
			onAppWalletConnected();
		}

		Promise.resolve([]).then(function() {
			// autoReconnect handled by ski embed
		});
	`
}
