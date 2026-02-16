/**
 * Messaging SDK Handler
 * Server-side APIs for Sui Stack Messaging channel resolution
 * Uses the messaging SDK wrapper for clean abstraction
 */

import {
	CDN_SDK_URLS,
	fetchChannelMembershipsViaRpc,
	fetchChannelObjectsViaRpc,
	formatSdkConfig,
	getMessagingConfig,
	MESSAGING_SDK_VERSION,
	normalizeAddress,
	SDK_VERSION,
	SEAL_SDK_VERSION,
} from '../sdk/messaging'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'

const MAX_CHANNELS = 32

export interface ChannelResponse {
	id: string
	name: string
	description: string
	encrypted: boolean
	protected: boolean
	custom: boolean
	createdAt: number
	sdk: 'official'
	memberCapId?: string
	creatorCapId?: string
}

export interface MembershipResponse {
	address: string
	channels: ChannelResponse[]
	total: number
	sdk: {
		version: string
		messagingVersion: string
		sealVersion: string
	}
}

export async function handleMessagingApi(request: Request, env: Env, url: URL): Promise<Response> {
	const path = url.pathname.replace('/api/messaging/', '')

	if (path === 'config' && request.method === 'GET') {
		return handleGetConfig(env)
	}

	if (path === 'channels' && request.method === 'GET') {
		return handleGetChannels(request, env, url)
	}

	if (path === 'channels/resolve' && request.method === 'POST') {
		return handleResolveChannels(request, env)
	}

	if (path.startsWith('channels/') && request.method === 'GET') {
		const channelId = path.replace('channels/', '')
		return handleGetChannel(channelId, env, url)
	}

	return jsonResponse({ error: 'Unknown messaging endpoint' }, 404)
}

async function handleGetConfig(env: Env): Promise<Response> {
	const network = env.SUI_NETWORK || 'mainnet'
	const config = formatSdkConfig(network)

	return jsonResponse({
		sdk: config.sdk,
		rpc: config.rpc,
		package: config.package,
		seal: config.seal,
		walrus: config.walrus,
		endpoints: {
			channels: '/api/messaging/channels',
			resolve: '/api/messaging/channels/resolve',
			channel: '/api/messaging/channels/:id',
		},
	})
}

async function handleGetChannels(_request: Request, env: Env, url: URL): Promise<Response> {
	const address = url.searchParams.get('address')
	if (!address) {
		return jsonResponse({ error: 'Address parameter required' }, 400)
	}

	const normalizedAddress = normalizeAddress(address)
	if (!normalizedAddress.startsWith('0x')) {
		return jsonResponse({ error: 'Invalid address format' }, 400)
	}

	const network = env.SUI_NETWORK || 'mainnet'
	const config = getMessagingConfig(network)

	try {
		const memberships = await fetchChannelMembershipsViaRpc(
			config.rpcUrl,
			normalizedAddress,
			config.packageId,
			MAX_CHANNELS,
		)

		if (memberships.length === 0) {
			return jsonResponse({
				address: normalizedAddress,
				channels: [],
				total: 0,
				sdk: {
					version: SDK_VERSION,
					messagingVersion: MESSAGING_SDK_VERSION,
					sealVersion: SEAL_SDK_VERSION,
				},
			})
		}

		const channelIds = [...new Set(memberships.map((m) => m.channelId))]
		const channelObjects = await fetchChannelObjectsViaRpc(config.rpcUrl, channelIds)

		const channels: ChannelResponse[] = memberships.map((membership, index) => {
			const obj = channelObjects.get(membership.channelId)
			return {
				id: membership.channelId,
				name: `channel-${index + 1}`,
				description: 'On-chain Sui Stack channel',
				encrypted: !!obj?.encryptedKey,
				protected: true,
				custom: false,
				createdAt: obj?.createdAt || membership.createdAt,
				sdk: 'official' as const,
				memberCapId: membership.memberCapId,
			}
		})

		return jsonResponse({
			address: normalizedAddress,
			channels,
			total: channels.length,
			sdk: {
				version: SDK_VERSION,
				messagingVersion: MESSAGING_SDK_VERSION,
				sealVersion: SEAL_SDK_VERSION,
			},
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: `Failed to fetch channels: ${message}` }, 500)
	}
}

async function handleResolveChannels(request: Request, env: Env): Promise<Response> {
	let body: { channelIds?: string[] }
	try {
		body = await request.json()
	} catch {
		return jsonResponse({ error: 'Invalid request body' }, 400)
	}

	const channelIds = body.channelIds
	if (!Array.isArray(channelIds) || channelIds.length === 0) {
		return jsonResponse({ error: 'channelIds array required' }, 400)
	}

	const normalizedIds = [
		...new Set(channelIds.map(normalizeAddress).filter((id) => id.startsWith('0x'))),
	]
	if (normalizedIds.length === 0) {
		return jsonResponse({ error: 'No valid channel IDs provided' }, 400)
	}

	const network = env.SUI_NETWORK || 'mainnet'
	const config = getMessagingConfig(network)

	try {
		const channelObjects = await fetchChannelObjectsViaRpc(config.rpcUrl, normalizedIds)

		const channels = Array.from(channelObjects.entries()).map(([id, obj]) => ({
			id,
			name: `channel-${id.slice(0, 8)}`,
			description: 'On-chain Sui Stack channel',
			encrypted: !!obj.encryptedKey,
			createdAt: obj.createdAt,
			keyVersion: obj.keyVersion,
		}))

		return jsonResponse({
			channels,
			total: channels.length,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: `Failed to resolve channels: ${message}` }, 500)
	}
}

async function handleGetChannel(channelId: string, env: Env, _url: URL): Promise<Response> {
	const normalizedId = normalizeAddress(channelId)
	if (!normalizedId.startsWith('0x')) {
		return jsonResponse({ error: 'Invalid channel ID format' }, 400)
	}

	const network = env.SUI_NETWORK || 'mainnet'
	const config = getMessagingConfig(network)

	try {
		const channelObjects = await fetchChannelObjectsViaRpc(config.rpcUrl, [normalizedId])
		const obj = channelObjects.get(normalizedId)

		if (!obj) {
			return jsonResponse({ error: 'Channel not found' }, 404)
		}

		return jsonResponse({
			id: normalizedId,
			name: `channel-${normalizedId.slice(0, 8)}`,
			description: 'On-chain Sui Stack channel',
			encrypted: !!obj.encryptedKey,
			createdAt: obj.createdAt,
			keyVersion: obj.keyVersion,
			sdk: 'official',
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: `Failed to fetch channel: ${message}` }, 500)
	}
}

export function generateSdkClientJs(config: { network: string; address?: string }): string {
	return `
(function() {
	var SDK_VERSION = '${SDK_VERSION}';
	var MESSAGING_SDK_VERSION = '${MESSAGING_SDK_VERSION}';
	var SEAL_SDK_VERSION = '${SEAL_SDK_VERSION}';
	var CONFIG = ${JSON.stringify(config)};

	function getSdkUrls() {
		return {
			sui: 'https://cdn.jsdelivr.net/npm/@mysten/sui@' + SDK_VERSION + '/+esm',
			suiClient: 'https://cdn.jsdelivr.net/npm/@mysten/sui@' + SDK_VERSION + '/client/+esm',
			suiTransactions: 'https://cdn.jsdelivr.net/npm/@mysten/sui@' + SDK_VERSION + '/transactions/+esm',
			seal: 'https://cdn.jsdelivr.net/npm/@mysten/seal@' + SEAL_SDK_VERSION + '/+esm',
			messaging: '${CDN_SDK_URLS.messaging[0]}',
		};
	}

	function normalizeAddress(value) {
		return String(value || '').trim().toLowerCase();
	}

	async function fetchServerChannels(address) {
		if (!address) return [];
		try {
			var resp = await fetch('/api/messaging/channels?address=' + encodeURIComponent(normalizeAddress(address)), {
				credentials: 'include',
			});
			if (!resp.ok) return [];
			var data = await resp.json();
			return Array.isArray(data.channels) ? data.channels : [];
		} catch (e) {
			console.warn('Failed to fetch server channels:', e);
			return [];
		}
	}

	async function resolveServerChannels(channelIds) {
		if (!Array.isArray(channelIds) || !channelIds.length) return [];
		try {
			var resp = await fetch('/api/messaging/channels/resolve', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ channelIds: channelIds }),
			});
			if (!resp.ok) return [];
			var data = await resp.json();
			return Array.isArray(data.channels) ? data.channels : [];
		} catch (e) {
			console.warn('Failed to resolve channels:', e);
			return [];
		}
	}

	async function getSdkConfig() {
		try {
			var resp = await fetch('/api/messaging/config', { credentials: 'include' });
			if (!resp.ok) return null;
			return await resp.json();
		} catch (e) {
			console.warn('Failed to fetch SDK config:', e);
			return null;
		}
	}

	window.SkiMessaging = {
		SDK_VERSION: SDK_VERSION,
		MESSAGING_SDK_VERSION: MESSAGING_SDK_VERSION,
		SEAL_SDK_VERSION: SEAL_SDK_VERSION,
		getSdkUrls: getSdkUrls,
		normalizeAddress: normalizeAddress,
		fetchServerChannels: fetchServerChannels,
		resolveServerChannels: resolveServerChannels,
		getSdkConfig: getSdkConfig,
	};
})();
`.trim()
}
