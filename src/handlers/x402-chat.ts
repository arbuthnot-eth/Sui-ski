import { Hono } from 'hono'
import type {
	Env,
	X402ChatContext,
	X402ChatRequest,
	X402ChatResponse,
	X402ChatTab,
	X402DiceCommit,
	X402DiceReveal,
} from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'
import { resolveX402Recipient } from '../utils/x402-sui'

const TAB_THRESHOLD_MIST = '100000000'
const COST_PER_EXCHANGE_MIST = '5000000'
const TAB_TTL_SECONDS = 86400
const MAX_HISTORY = 50
const MAX_MESSAGE_LENGTH = 2000
const MAX_CHANNEL_MESSAGES = 200
const DICE_COMMIT_TTL_SECONDS = 300
const DICE_EMOJI = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

interface ChatMessage {
	role: 'user' | 'assistant'
	content: string
}

interface ChannelMessage {
	id: string
	serverId: string
	channel: string
	sender: string
	senderName: string | null
	content: string
	encrypted: boolean
	timestamp: number
	replyTo?: string
}

interface ServerChannel {
	id: string
	name: string
	description: string
	encrypted: boolean
	protected: boolean
	custom: boolean
	createdAt: number
}

interface MuteInfo {
	address: string
	mutedAt: number
	mutedBy: string
}

interface ServerMuteState {
	server: Record<string, MuteInfo>
	channel: Record<string, Record<string, MuteInfo>>
}

interface ServerContext {
	id: string
	name: string
	displayName: string
	ownerAddress: string | null
	isModerator: boolean
}

type X402Env = {
	Bindings: Env
	Variables: {
		env: Env
		session: {
			address: string | null
			walletName: string | null
			verified: boolean
		}
	}
}

export const x402ChatRoutes = new Hono<X402Env>()

function tabKey(address: string): string {
	return cacheKey('x402-tab', 'v1', address.toLowerCase())
}

function historyKey(address: string): string {
	return cacheKey('x402-history', 'v1', address.toLowerCase())
}

function channelKey(channelId: string): string {
	return cacheKey('x402-channel', 'v2', channelId.toLowerCase())
}

function serverChannelsKey(serverId: string): string {
	return cacheKey('x402-server-channels', 'v1', serverId)
}

function serverMutesKey(serverId: string): string {
	return cacheKey('x402-server-mutes', 'v1', serverId)
}

function diceKey(address: string): string {
	return cacheKey('x402-dice', 'v1', address.toLowerCase())
}

function normalizeAddress(value: string | null | undefined): string {
	return String(value || '')
		.trim()
		.toLowerCase()
}

function sanitizeSlug(value: string | null | undefined): string {
	const slug = String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
	return slug.slice(0, 48)
}

function getServerContext(requestUrl: string, sessionAddress: string | null): ServerContext {
	const url = new URL(requestUrl)
	const rawName = url.searchParams.get('name')
	const rawOwner = url.searchParams.get('owner')
	const name = sanitizeSlug(rawName)
	const ownerAddress = normalizeAddress(rawOwner) || null
	const requester = normalizeAddress(sessionAddress)

	if (!name) {
		return {
			id: 'global:sui-ski',
			name: 'sui-ski',
			displayName: 'sui.ski',
			ownerAddress: null,
			isModerator: false,
		}
	}

	const ownerPart = ownerAddress || 'unowned'
	return {
		id: `suins:${name}:${ownerPart}`,
		name,
		displayName: `${name}.sui`,
		ownerAddress,
		isModerator: !!ownerAddress && requester === ownerAddress,
	}
}

function buildDefaultChannels(server: ServerContext): ServerChannel[] {
	const now = Date.now()
	const base: ServerChannel[] = [
		{
			id: 'general',
			name: 'general',
			description: 'General server chat',
			encrypted: false,
			protected: true,
			custom: false,
			createdAt: now,
		},
		{
			id: 'announcements',
			name: 'announcements',
			description: 'Server announcements',
			encrypted: false,
			protected: true,
			custom: false,
			createdAt: now,
		},
		{
			id: 'ops',
			name: 'ops',
			description: 'Ops and strategy chat',
			encrypted: false,
			protected: true,
			custom: false,
			createdAt: now,
		},
	]

	if (server.name !== 'sui-ski') {
		base.push({
			id: server.name,
			name: server.name,
			description: `Main chat for ${server.displayName}`,
			encrypted: false,
			protected: true,
			custom: false,
			createdAt: now,
		})
		base.push({
			id: `dm-${server.name}`,
			name: `dm-${server.name}`,
			description: `Encrypted room for ${server.displayName}`,
			encrypted: true,
			protected: true,
			custom: false,
			createdAt: now,
		})
	}

	return base
}

async function loadServerChannels(server: ServerContext): Promise<ServerChannel[]> {
	const defaults = buildDefaultChannels(server)
	const existing = await getCached<ServerChannel[]>(serverChannelsKey(server.id))
	if (!Array.isArray(existing) || existing.length === 0) {
		await setCache(serverChannelsKey(server.id), defaults, TAB_TTL_SECONDS)
		return defaults
	}

	const byId = new Map<string, ServerChannel>()
	for (let i = 0; i < defaults.length; i++) byId.set(defaults[i].id, defaults[i])
	for (let i = 0; i < existing.length; i++) {
		const channel = existing[i]
		if (!channel || !channel.id) continue
		byId.set(channel.id, {
			id: sanitizeSlug(channel.id),
			name: sanitizeSlug(channel.name || channel.id),
			description: channel.description || '',
			encrypted: !!channel.encrypted,
			protected: !!channel.protected,
			custom: !!channel.custom,
			createdAt: Number(channel.createdAt || Date.now()),
		})
	}

	const merged = Array.from(byId.values()).filter((channel) => channel.id)
	await setCache(serverChannelsKey(server.id), merged, TAB_TTL_SECONDS)
	return merged
}

async function loadMuteState(serverId: string): Promise<ServerMuteState> {
	const state = await getCached<ServerMuteState>(serverMutesKey(serverId))
	if (state && state.server && state.channel) return state
	return { server: {}, channel: {} }
}

function getMuteScope(
	state: ServerMuteState,
	channelId: string,
	address: string,
): 'server' | 'channel' | null {
	if (!address) return null
	if (state.server[address]) return 'server'
	if (state.channel[channelId] && state.channel[channelId][address]) return 'channel'
	return null
}

function generateMessageId(): string {
	const timestamp = Date.now().toString(36)
	const random = Math.random().toString(36).slice(2, 8)
	return `${timestamp}-${random}`
}

function buildSystemPrompt(context: X402ChatContext): string {
	const parts = [
		'You are the sui.ski AI assistant — a concise, knowledgeable guide to the Sui blockchain ecosystem.',
		'You help users with SuiNS names, DeFi, NFTs, and navigating the Sui network.',
		'Keep responses short (2-4 sentences max unless asked for details).',
		'You can suggest actions: looking up names, navigating to profiles, or playing dice.',
		'When suggesting dice, say "Want to roll? Just say roll dice!"',
	]

	switch (context.page) {
		case 'profile':
			parts.push(`The user is viewing the profile page for "${context.name || 'unknown'}.sui".`)
			if (context.address) {
				parts.push(`Target address: ${context.address}`)
			}
			if (context.expirationMs) {
				const daysLeft = Math.ceil((context.expirationMs - Date.now()) / 86400000)
				if (daysLeft > 0) {
					parts.push(`This name expires in ${daysLeft} days.`)
				} else {
					parts.push('This name has expired and may be in grace period.')
				}
			}
			if (context.linkedNames) {
				parts.push(`This address has ${context.linkedNames} linked SuiNS names.`)
			}
			break
		case 'landing':
			parts.push('The user is on the sui.ski landing page — the gateway to the Sui ecosystem.')
			parts.push('You can help them search for names, learn about Sui, or explore features.')
			break
		case 'register':
			parts.push('The user is on a name registration page.')
			parts.push('You can help them understand SuiNS registration, pricing, and name management.')
			break
	}

	parts.push(
		'This chat uses x402 tab-based payments. The user pays in SUI for AI responses.',
		'Messages in channels can be encrypted with Seal for Signal-like privacy.',
	)

	return parts.join(' ')
}

function detectDiceIntent(message: string): boolean {
	const lower = message.toLowerCase()
	const patterns = [
		'roll dice',
		'roll a die',
		'dice game',
		'roll the dice',
		'throw dice',
		'play dice',
		'🎲',
	]
	for (const pattern of patterns) {
		if (lower.includes(pattern)) return true
	}
	return false
}

function formatSuiAmount(mist: string): string {
	const value = Number(mist) / 1e9
	if (value < 0.001) return `${value.toFixed(6)} SUI`
	if (value < 1) return `${value.toFixed(4)} SUI`
	return `${value.toFixed(2)} SUI`
}

x402ChatRoutes.post('/chat', async (c) => {
	const env = c.get('env')
	const session = c.get('session')

	if (!env.LLM_API_KEY) {
		return c.json({ error: 'AI chat not configured', code: 'LLM_UNAVAILABLE' }, 503)
	}

	const address = session.address
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	let body: X402ChatRequest
	try {
		body = await c.req.json<X402ChatRequest>()
	} catch {
		return c.json({ error: 'Invalid request body', code: 'INVALID_BODY' }, 400)
	}

	if (!body.message || typeof body.message !== 'string') {
		return c.json({ error: 'Message required', code: 'MISSING_MESSAGE' }, 400)
	}

	const message = body.message.slice(0, MAX_MESSAGE_LENGTH)
	const context = body.context || { page: 'landing' as const }

	const tab = (await getCached<X402ChatTab>(tabKey(address))) || {
		messages: 0,
		costMist: '0',
		settledMist: '0',
		lastActivity: Date.now(),
		context,
	}

	const currentCost = BigInt(tab.costMist)
	const threshold = BigInt(TAB_THRESHOLD_MIST)
	const settled = BigInt(tab.settledMist)
	const outstanding = currentCost - settled

	if (outstanding >= threshold) {
		const recipientAddress = await resolveX402Recipient(env)
		return c.json(
			{
				error: 'Payment required',
				code: 'X402_TAB_EXCEEDED',
				tab: {
					costMist: tab.costMist,
					settledMist: tab.settledMist,
					thresholdMist: TAB_THRESHOLD_MIST,
					settleRequired: true,
					payTo: recipientAddress,
				},
			},
			402,
		)
	}

	if (detectDiceIntent(message)) {
		const serverEntropy = crypto.randomUUID().replace(/-/g, '')
		const encoder = new TextEncoder()
		const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(serverEntropy))
		const hashArray = new Uint8Array(hashBuffer)
		let commitHash = ''
		for (let i = 0; i < hashArray.length; i++) {
			commitHash += hashArray[i].toString(16).padStart(2, '0')
		}

		const commit: X402DiceCommit = {
			commitHash,
			serverEntropy,
			timestamp: Date.now(),
		}
		await setCache(diceKey(address), commit, DICE_COMMIT_TTL_SECONDS)

		tab.messages++
		tab.costMist = (BigInt(tab.costMist) + BigInt(COST_PER_EXCHANGE_MIST)).toString()
		tab.lastActivity = Date.now()
		tab.context = context
		await setCache(tabKey(address), tab, TAB_TTL_SECONDS)

		const newOutstanding = BigInt(tab.costMist) - BigInt(tab.settledMist)
		const response: X402ChatResponse = {
			reply: `🎲 Dice game ready! I've committed to a random value (hash: \`${commitHash.slice(0, 12)}...\`). Now you provide your entropy — type any random text and I'll combine them for a provably fair roll!`,
			suggestions: ['Roll with "lucky seven"', 'Roll with random entropy', 'How does this work?'],
			action: 'dice',
			actionData: { commitHash, phase: 'waiting_entropy' },
			tab: {
				costMist: tab.costMist,
				thresholdMist: TAB_THRESHOLD_MIST,
				settleRequired: newOutstanding >= threshold,
			},
		}

		return c.json(response)
	}

	const pendingDice = await getCached<X402DiceCommit>(diceKey(address))
	if (pendingDice && Date.now() - pendingDice.timestamp < DICE_COMMIT_TTL_SECONDS * 1000) {
		const clientEntropy = message.slice(0, 100)
		const combined = `${pendingDice.serverEntropy}:${clientEntropy}`
		const encoder = new TextEncoder()
		const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(combined))
		const hashArray = new Uint8Array(hashBuffer)
		let resultHex = ''
		for (let i = 0; i < hashArray.length; i++) {
			resultHex += hashArray[i].toString(16).padStart(2, '0')
		}
		const resultNum = (parseInt(resultHex.slice(0, 8), 16) % 6) + 1

		await setCache(diceKey(address), null, 1)

		tab.messages++
		tab.costMist = (BigInt(tab.costMist) + BigInt(COST_PER_EXCHANGE_MIST)).toString()
		tab.lastActivity = Date.now()
		await setCache(tabKey(address), tab, TAB_TTL_SECONDS)

		const reveal: X402DiceReveal = {
			result: resultNum,
			serverEntropy: pendingDice.serverEntropy,
			clientEntropy,
			combined: resultHex.slice(0, 16),
		}

		const newOutstanding = BigInt(tab.costMist) - BigInt(tab.settledMist)
		const response: X402ChatResponse = {
			reply: `${DICE_EMOJI[resultNum - 1]} You rolled a **${resultNum}**!\n\nServer entropy: \`${pendingDice.serverEntropy.slice(0, 8)}...\`\nYour entropy: "${clientEntropy}"\nCombined hash: \`${resultHex.slice(0, 12)}...\`\n\nVerify: SHA-256("${pendingDice.serverEntropy}:${clientEntropy}") mod 6 + 1 = ${resultNum}`,
			suggestions: ['Roll again!', 'Best of 3?', 'How was this fair?'],
			action: 'dice',
			actionData: { ...reveal, phase: 'revealed' },
			tab: {
				costMist: tab.costMist,
				thresholdMist: TAB_THRESHOLD_MIST,
				settleRequired: newOutstanding >= threshold,
			},
		}

		return c.json(response)
	}

	const history = (await getCached<ChatMessage[]>(historyKey(address))) || []
	history.push({ role: 'user', content: message })

	const trimmedHistory =
		history.length > MAX_HISTORY ? history.slice(history.length - MAX_HISTORY) : history

	const apiUrl = env.LLM_API_URL || 'https://api.anthropic.com/v1/messages'
	const systemPrompt = buildSystemPrompt(context)

	let aiReply: string
	try {
		const llmResponse = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': env.LLM_API_KEY,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: 'claude-3-5-haiku-20241022',
				max_tokens: 500,
				system: systemPrompt,
				messages: trimmedHistory.map((m) => ({
					role: m.role,
					content: m.content,
				})),
			}),
		})

		if (!llmResponse.ok) {
			const errorText = await llmResponse.text()
			return c.json({ error: 'AI request failed', code: 'LLM_ERROR', details: errorText }, 502)
		}

		const result = (await llmResponse.json()) as {
			content?: Array<{ type: string; text: string }>
		}
		aiReply = result.content?.[0]?.text || 'I had trouble generating a response. Try again?'
	} catch (error) {
		const msg = error instanceof Error ? error.message : 'Unknown LLM error'
		return c.json({ error: 'AI request failed', code: 'LLM_ERROR', details: msg }, 502)
	}

	trimmedHistory.push({ role: 'assistant', content: aiReply })
	await setCache(historyKey(address), trimmedHistory, TAB_TTL_SECONDS)

	tab.messages++
	tab.costMist = (BigInt(tab.costMist) + BigInt(COST_PER_EXCHANGE_MIST)).toString()
	tab.lastActivity = Date.now()
	tab.context = context
	await setCache(tabKey(address), tab, TAB_TTL_SECONDS)

	const newOutstanding = BigInt(tab.costMist) - BigInt(tab.settledMist)
	const suggestions = generateSuggestions(context, aiReply)

	const response: X402ChatResponse = {
		reply: aiReply,
		suggestions,
		tab: {
			costMist: tab.costMist,
			thresholdMist: TAB_THRESHOLD_MIST,
			settleRequired: newOutstanding >= BigInt(TAB_THRESHOLD_MIST),
		},
	}

	return c.json(response)
})

x402ChatRoutes.get('/session', async (c) => {
	const session = c.get('session')
	const address = session.address
	if (!address) {
		return c.json({
			connected: false,
			tab: { costMist: '0', settledMist: '0', thresholdMist: TAB_THRESHOLD_MIST, messages: 0 },
		})
	}

	const tab = await getCached<X402ChatTab>(tabKey(address))
	const outstanding = tab ? BigInt(tab.costMist) - BigInt(tab.settledMist) : 0n

	return c.json({
		connected: true,
		address,
		tab: {
			costMist: tab?.costMist || '0',
			settledMist: tab?.settledMist || '0',
			thresholdMist: TAB_THRESHOLD_MIST,
			messages: tab?.messages || 0,
			outstanding: outstanding.toString(),
			outstandingFormatted: formatSuiAmount(outstanding.toString()),
			settleRequired: outstanding >= BigInt(TAB_THRESHOLD_MIST),
		},
	})
})

x402ChatRoutes.post('/settle', async (c) => {
	const session = c.get('session')
	const address = session.address
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	let body: { digest: string }
	try {
		body = await c.req.json<{ digest: string }>()
	} catch {
		return c.json({ error: 'Invalid request body', code: 'INVALID_BODY' }, 400)
	}

	if (!body.digest) {
		return c.json({ error: 'Transaction digest required', code: 'MISSING_DIGEST' }, 400)
	}

	const tab = await getCached<X402ChatTab>(tabKey(address))
	if (!tab) {
		return c.json({ error: 'No active tab', code: 'NO_TAB' }, 404)
	}

	const outstanding = BigInt(tab.costMist) - BigInt(tab.settledMist)
	tab.settledMist = tab.costMist
	tab.lastActivity = Date.now()
	await setCache(tabKey(address), tab, TAB_TTL_SECONDS)

	return c.json({
		settled: true,
		digest: body.digest,
		amount: outstanding.toString(),
		amountFormatted: formatSuiAmount(outstanding.toString()),
		tab: {
			costMist: tab.costMist,
			settledMist: tab.settledMist,
			thresholdMist: TAB_THRESHOLD_MIST,
			settleRequired: false,
		},
	})
})

x402ChatRoutes.post('/dice', async (c) => {
	const session = c.get('session')
	const address = session.address
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	const serverEntropy = crypto.randomUUID().replace(/-/g, '')
	const encoder = new TextEncoder()
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(serverEntropy))
	const hashArray = new Uint8Array(hashBuffer)
	let commitHash = ''
	for (let i = 0; i < hashArray.length; i++) {
		commitHash += hashArray[i].toString(16).padStart(2, '0')
	}

	const commit: X402DiceCommit = {
		commitHash,
		serverEntropy,
		timestamp: Date.now(),
	}
	await setCache(diceKey(address), commit, DICE_COMMIT_TTL_SECONDS)

	return c.json({ commitHash, expiresIn: DICE_COMMIT_TTL_SECONDS })
})

x402ChatRoutes.post('/dice/reveal', async (c) => {
	const session = c.get('session')
	const address = session.address
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	let body: { clientEntropy: string }
	try {
		body = await c.req.json<{ clientEntropy: string }>()
	} catch {
		return c.json({ error: 'Invalid request body', code: 'INVALID_BODY' }, 400)
	}

	if (!body.clientEntropy) {
		return c.json({ error: 'Client entropy required', code: 'MISSING_ENTROPY' }, 400)
	}

	const commit = await getCached<X402DiceCommit>(diceKey(address))
	if (!commit) {
		return c.json({ error: 'No pending dice commit', code: 'NO_COMMIT' }, 404)
	}

	const clientEntropy = body.clientEntropy.slice(0, 100)
	const combined = `${commit.serverEntropy}:${clientEntropy}`
	const encoder = new TextEncoder()
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(combined))
	const hashArray = new Uint8Array(hashBuffer)
	let resultHex = ''
	for (let i = 0; i < hashArray.length; i++) {
		resultHex += hashArray[i].toString(16).padStart(2, '0')
	}
	const result = (parseInt(resultHex.slice(0, 8), 16) % 6) + 1

	await setCache(diceKey(address), null, 1)

	const reveal: X402DiceReveal = {
		result,
		serverEntropy: commit.serverEntropy,
		clientEntropy,
		combined: resultHex.slice(0, 16),
	}

	return c.json(reveal)
})

x402ChatRoutes.get('/channels', async (c) => {
	const session = c.get('session')
	const server = getServerContext(c.req.url, session.address)
	const channels = await loadServerChannels(server)
	const muteState = await loadMuteState(server.id)

	return c.json({
		server: {
			id: server.id,
			name: server.name,
			displayName: server.displayName,
			ownerAddress: server.ownerAddress,
			isModerator: server.isModerator,
		},
		channels,
		moderation: {
			serverMuted: server.isModerator ? Object.keys(muteState.server) : [],
			channelMuted: server.isModerator
				? Object.fromEntries(
						Object.entries(muteState.channel).map(([channelId, muted]) => [
							channelId,
							Object.keys(muted),
						]),
					)
				: {},
		},
	})
})

x402ChatRoutes.post('/channels', async (c) => {
	const session = c.get('session')
	const address = normalizeAddress(session.address)
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	const server = getServerContext(c.req.url, session.address)
	if (!server.isModerator) {
		return c.json({ error: 'Only server moderator can add channels', code: 'FORBIDDEN' }, 403)
	}

	let body: { name?: string; encrypted?: boolean; description?: string }
	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: 'Invalid request body', code: 'INVALID_BODY' }, 400)
	}

	const channelSlug = sanitizeSlug(body.name)
	if (!channelSlug) {
		return c.json({ error: 'Channel name required', code: 'MISSING_CHANNEL' }, 400)
	}

	const channels = await loadServerChannels(server)
	if (channels.some((channel) => channel.id === channelSlug)) {
		return c.json({ error: 'Channel already exists', code: 'DUPLICATE_CHANNEL' }, 409)
	}

	const nextChannel: ServerChannel = {
		id: channelSlug,
		name: channelSlug,
		description: String(body.description || '').slice(0, 120),
		encrypted: !!body.encrypted,
		protected: false,
		custom: true,
		createdAt: Date.now(),
	}

	channels.push(nextChannel)
	await setCache(serverChannelsKey(server.id), channels, TAB_TTL_SECONDS)

	return c.json({ channel: nextChannel, channels })
})

x402ChatRoutes.delete('/channels/:id', async (c) => {
	const session = c.get('session')
	const address = normalizeAddress(session.address)
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	const server = getServerContext(c.req.url, session.address)
	if (!server.isModerator) {
		return c.json({ error: 'Only server moderator can delete channels', code: 'FORBIDDEN' }, 403)
	}

	const channelId = sanitizeSlug(c.req.param('id'))
	if (!channelId) {
		return c.json({ error: 'Invalid channel id', code: 'INVALID_CHANNEL' }, 400)
	}

	const channels = await loadServerChannels(server)
	const found = channels.find((channel) => channel.id === channelId)
	if (!found) return c.json({ error: 'Channel not found', code: 'NOT_FOUND' }, 404)
	if (found.protected) {
		return c.json({ error: 'Protected channels cannot be deleted', code: 'PROTECTED_CHANNEL' }, 400)
	}

	const nextChannels = channels.filter((channel) => channel.id !== channelId)
	await setCache(serverChannelsKey(server.id), nextChannels, TAB_TTL_SECONDS)
	await setCache(channelKey(`${server.id}:${channelId}`), [], 1)

	const muteState = await loadMuteState(server.id)
	if (muteState.channel[channelId]) {
		delete muteState.channel[channelId]
		await setCache(serverMutesKey(server.id), muteState, TAB_TTL_SECONDS)
	}

	return c.json({ deleted: true, channelId, channels: nextChannels })
})

x402ChatRoutes.post('/channels/:id/mute', async (c) => {
	const session = c.get('session')
	const address = normalizeAddress(session.address)
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	const server = getServerContext(c.req.url, session.address)
	if (!server.isModerator) {
		return c.json({ error: 'Only server moderator can mute users', code: 'FORBIDDEN' }, 403)
	}

	const channelId = sanitizeSlug(c.req.param('id'))
	let body: { targetAddress?: string; scope?: 'server' | 'channel'; muted?: boolean }
	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: 'Invalid request body', code: 'INVALID_BODY' }, 400)
	}

	const targetAddress = normalizeAddress(body.targetAddress)
	if (!targetAddress) {
		return c.json({ error: 'Target address required', code: 'MISSING_TARGET' }, 400)
	}
	if (server.ownerAddress && targetAddress === server.ownerAddress) {
		return c.json({ error: 'Cannot mute server moderator', code: 'INVALID_TARGET' }, 400)
	}

	const muted = body.muted !== false
	const scope = body.scope === 'server' ? 'server' : 'channel'
	const muteState = await loadMuteState(server.id)

	if (scope === 'server') {
		if (!muted) {
			delete muteState.server[targetAddress]
		} else {
			muteState.server[targetAddress] = {
				address: targetAddress,
				mutedAt: Date.now(),
				mutedBy: address,
			}
		}
	} else {
		if (!muteState.channel[channelId]) muteState.channel[channelId] = {}
		if (!muted) {
			delete muteState.channel[channelId][targetAddress]
		} else {
			muteState.channel[channelId][targetAddress] = {
				address: targetAddress,
				mutedAt: Date.now(),
				mutedBy: address,
			}
		}
	}

	await setCache(serverMutesKey(server.id), muteState, TAB_TTL_SECONDS)

	return c.json({ ok: true, scope, channelId, targetAddress, muted })
})

x402ChatRoutes.get('/channels/:id/messages', async (c) => {
	const session = c.get('session')
	const server = getServerContext(c.req.url, session.address)
	const channelId = c.req.param('id')
	const key = channelKey(`${server.id}:${channelId}`)
	const messages = (await getCached<ChannelMessage[]>(key)) || []
	const muteState = await loadMuteState(server.id)
	const requester = normalizeAddress(session.address)
	const mutedScope = getMuteScope(muteState, channelId, requester)

	return c.json({
		server: {
			id: server.id,
			displayName: server.displayName,
			isModerator: server.isModerator,
		},
		channel: channelId,
		messages,
		count: messages.length,
		muted: {
			server: mutedScope === 'server',
			channel: mutedScope === 'channel',
		},
	})
})

x402ChatRoutes.delete('/channels/:id/messages/:messageId', async (c) => {
	const session = c.get('session')
	const address = normalizeAddress(session.address)
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	const server = getServerContext(c.req.url, session.address)
	const channelId = sanitizeSlug(c.req.param('id'))
	const messageId = c.req.param('messageId')
	const key = channelKey(`${server.id}:${channelId}`)
	const messages = (await getCached<ChannelMessage[]>(key)) || []
	const targetMessage = messages.find((message) => message.id === messageId)
	if (!targetMessage) return c.json({ error: 'Message not found', code: 'NOT_FOUND' }, 404)

	const senderAddress = normalizeAddress(targetMessage.sender)
	if (!server.isModerator && senderAddress !== address) {
		return c.json({ error: 'Not authorized to delete this message', code: 'FORBIDDEN' }, 403)
	}

	const nextMessages = messages.filter((message) => message.id !== messageId)
	await setCache(key, nextMessages, TAB_TTL_SECONDS)

	return c.json({ deleted: true, messageId, count: nextMessages.length })
})

x402ChatRoutes.post('/channels/:id/messages', async (c) => {
	const session = c.get('session')
	const address = session.address
	if (!address) {
		return c.json({ error: 'Wallet not connected', code: 'AUTH_REQUIRED' }, 401)
	}

	const channelId = c.req.param('id')
	const server = getServerContext(c.req.url, session.address)
	const normalizedAddress = normalizeAddress(address)
	const muteState = await loadMuteState(server.id)
	const mutedScope = getMuteScope(muteState, channelId, normalizedAddress)
	if (mutedScope) {
		return c.json(
			{
				error:
					mutedScope === 'server'
						? 'You are muted in this server'
						: 'You are muted in this channel',
				code: 'MUTED',
				scope: mutedScope,
			},
			403,
		)
	}

	let body: {
		content: string
		senderName?: string | null
		encrypted?: boolean
		replyTo?: string
	}
	try {
		body = await c.req.json()
	} catch {
		return c.json({ error: 'Invalid request body', code: 'INVALID_BODY' }, 400)
	}

	if (!body.content || typeof body.content !== 'string') {
		return c.json({ error: 'Message content required', code: 'MISSING_CONTENT' }, 400)
	}

	const msg: ChannelMessage = {
		id: generateMessageId(),
		serverId: server.id,
		channel: channelId,
		sender: address,
		senderName: body.senderName || null,
		content: body.content.slice(0, MAX_MESSAGE_LENGTH),
		encrypted: body.encrypted || false,
		timestamp: Date.now(),
		replyTo: body.replyTo,
	}

	const key = channelKey(`${server.id}:${channelId}`)
	const messages = (await getCached<ChannelMessage[]>(key)) || []
	messages.push(msg)

	const trimmed =
		messages.length > MAX_CHANNEL_MESSAGES
			? messages.slice(messages.length - MAX_CHANNEL_MESSAGES)
			: messages

	await setCache(key, trimmed, TAB_TTL_SECONDS)

	return c.json({ message: msg })
})

function generateSuggestions(context: X402ChatContext, aiReply: string): string[] {
	const suggestions: string[] = []
	const lower = aiReply.toLowerCase()

	if (context.page === 'profile' && context.name) {
		if (lower.includes('expir') || lower.includes('renew')) {
			suggestions.push(`Renew ${context.name}.sui`)
		}
		suggestions.push('Roll dice 🎲')
	} else if (context.page === 'landing') {
		suggestions.push('Search a name')
		suggestions.push('Roll dice 🎲')
	} else {
		suggestions.push('Tell me more')
		suggestions.push('Roll dice 🎲')
	}

	if (suggestions.length < 3) {
		suggestions.push('What else can you do?')
	}

	return suggestions.slice(0, 3)
}
