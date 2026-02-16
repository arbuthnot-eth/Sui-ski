/**
 * Sui Stack Messaging SDK Wrapper
 * Abstracts @mysten/messaging complexity for server-side channel resolution
 *
 * Standardized version: @mysten/sui@2.4.0
 */

export const SDK_VERSION = '2.4.0'
export const MESSAGING_SDK_VERSION = '0.4.0'
export const SEAL_SDK_VERSION = '1.0.1'

export const CDN_TAG = 'mainnet-messaging-v3.2-2026-02-16'
export const CDN_REPO = 'arbuthnot-eth/sui-stack-messaging-sdk'
export const CDN_MANIFEST_URL = `https://cdn.jsdelivr.net/gh/${CDN_REPO}@${CDN_TAG}/cdn/messaging-mainnet.json`
export const CDN_SDK_URLS = {
	messaging: [
		`https://esm.sh/gh/${CDN_REPO}@${CDN_TAG}/packages/messaging`,
		`https://cdn.jsdelivr.net/gh/${CDN_REPO}@${CDN_TAG}/packages/messaging/dist/esm/index.js`,
	],
}

export const PACKAGE_IDS = {
	mainnet: '0xbcdf77f551f12be0fa61d1eb7bb2ff4169c1587aaa86fab84d95213cc75139f9',
	testnet: '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d',
}

export const RPC_URLS = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
	devnet: 'https://fullnode.devnet.sui.io:443',
}

export const SEAL_KEY_SERVERS = {
	mainnet: [
		{ objectId: '0x145540d931f182fef76467dd8074c9839aea126852d90d18e1556fcbbd1208b6', weight: 1 },
		{ objectId: '0x1afb3a57211ceff8f6781757821847e3ddae73f64e78ec8cd9349914ad985475', weight: 1 },
	],
	testnet: [
		{ objectId: '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', weight: 1 },
		{ objectId: '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', weight: 1 },
		{ objectId: '0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46', weight: 1 },
	],
}

export const WALRUS_ENDPOINTS = {
	mainnet: {
		publisher: 'https://publisher.walrus.space',
		aggregator: 'https://aggregator.walrus.space',
	},
	testnet: {
		publisher: 'https://publisher.walrus-testnet.walrus.space',
		aggregator: 'https://aggregator.walrus-testnet.walrus.space',
	},
}

export interface ChannelMembership {
	channelId: string
	memberCapId: string
	memberAddress: string
	createdAt: number
}

export interface ChannelObject {
	id: string
	createdAt: number
	encryptedKey: Uint8Array | null
	keyVersion: number
}

export interface ChannelInfo {
	id: string
	name: string
	membership: ChannelMembership | null
	object: ChannelObject | null
	creatorCapId: string | null
}

export interface MessagingConfig {
	network: 'mainnet' | 'testnet' | 'devnet'
	rpcUrl: string
	packageId: string
	sealServers: Array<{ objectId: string; weight: number }>
	sealThreshold: number
	walrus: {
		publisher: string
		aggregator: string
	}
}

export function getMessagingConfig(network: 'mainnet' | 'testnet' | 'devnet'): MessagingConfig {
	const packageId = network === 'mainnet' ? PACKAGE_IDS.mainnet : PACKAGE_IDS.testnet
	const sealServers = network === 'mainnet' ? SEAL_KEY_SERVERS.mainnet : SEAL_KEY_SERVERS.testnet
	const walrus = network === 'mainnet' ? WALRUS_ENDPOINTS.mainnet : WALRUS_ENDPOINTS.testnet

	return {
		network,
		rpcUrl: RPC_URLS[network] || RPC_URLS.mainnet,
		packageId,
		sealServers,
		sealThreshold: Math.min(2, sealServers.length),
		walrus,
	}
}

export function getSdkImportUrls(): {
	sui: string[]
	suiClient: string[]
	suiTransactions: string[]
	seal: string[]
	messaging: string[]
} {
	return {
		sui: [
			`https://cdn.jsdelivr.net/npm/@mysten/sui@${SDK_VERSION}/+esm`,
			`https://esm.sh/@mysten/sui@${SDK_VERSION}?bundle`,
		],
		suiClient: [
			`https://cdn.jsdelivr.net/npm/@mysten/sui@${SDK_VERSION}/client/+esm`,
			`https://esm.sh/@mysten/sui@${SDK_VERSION}/client?bundle`,
		],
		suiTransactions: [
			`https://cdn.jsdelivr.net/npm/@mysten/sui@${SDK_VERSION}/transactions/+esm`,
			`https://esm.sh/@mysten/sui@${SDK_VERSION}/transactions?bundle`,
		],
		seal: [
			`https://cdn.jsdelivr.net/npm/@mysten/seal@${SEAL_SDK_VERSION}/+esm`,
			`https://esm.sh/@mysten/seal@${SEAL_SDK_VERSION}?bundle`,
		],
		messaging: CDN_SDK_URLS.messaging,
	}
}

export function formatSdkConfig(network: 'mainnet' | 'testnet' | 'devnet'): {
	sdk: { version: string; messagingVersion: string; sealVersion: string }
	rpc: { url: string; network: string }
	package: { id: string }
	seal: { servers: Array<{ objectId: string; weight: number }>; threshold: number }
	walrus: { publisher: string; aggregator: string }
} {
	const config = getMessagingConfig(network)
	return {
		sdk: {
			version: SDK_VERSION,
			messagingVersion: MESSAGING_SDK_VERSION,
			sealVersion: SEAL_SDK_VERSION,
		},
		rpc: {
			url: config.rpcUrl,
			network: config.network,
		},
		package: {
			id: config.packageId,
		},
		seal: {
			servers: config.sealServers,
			threshold: config.sealThreshold,
		},
		walrus: config.walrus,
	}
}

export async function fetchChannelMembershipsViaRpc(
	rpcUrl: string,
	address: string,
	packageId: string,
	limit: number = 32,
): Promise<ChannelMembership[]> {
	const response = await fetch(rpcUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'suix_getOwnedObjects',
			params: [
				address,
				{
					filter: {
						StructType: `${packageId}::member_cap::MemberCap`,
					},
					options: { showContent: true, showOwner: true },
				},
				null,
				limit,
			],
		}),
	})

	if (!response.ok) {
		throw new Error(`RPC request failed: ${response.status}`)
	}

	const result = (await response.json()) as {
		result?: { data: Array<unknown> }
		error?: { message: string }
	}
	if (result.error) {
		throw new Error(`RPC error: ${result.error.message}`)
	}

	const objects = result.result?.data || []
	const memberships: ChannelMembership[] = []

	for (const obj of objects) {
		const data = obj as {
			data?: {
				objectId?: string
				content?: { fields?: { channel_id?: string; created_at?: number } }
			}
		}
		const objectId = data.data?.objectId
		const channelId = data.data?.content?.fields?.channel_id
		const createdAt = data.data?.content?.fields?.created_at

		if (objectId && channelId) {
			memberships.push({
				channelId,
				memberCapId: objectId,
				memberAddress: address,
				createdAt: typeof createdAt === 'number' ? createdAt : Date.now(),
			})
		}
	}

	return memberships
}

export async function fetchChannelObjectsViaRpc(
	rpcUrl: string,
	channelIds: string[],
): Promise<Map<string, ChannelObject>> {
	const result = new Map<string, ChannelObject>()

	if (channelIds.length === 0) return result

	const response = await fetch(rpcUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'suix_multiGetObjects',
			params: [
				channelIds,
				{
					showContent: true,
					showOwner: true,
				},
			],
		}),
	})

	if (!response.ok) {
		throw new Error(`RPC request failed: ${response.status}`)
	}

	const json = (await response.json()) as { result?: Array<unknown>; error?: { message: string } }
	if (json.error) {
		throw new Error(`RPC error: ${json.error.message}`)
	}

	const objects = json.result || []

	for (const obj of objects) {
		const data = obj as {
			data?: {
				objectId?: string
				content?: {
					fields?: {
						created_at_ms?: number
						encryption_key_history?: {
							fields?: {
								latest?: Array<number> | string
								latest_version?: number
							}
						}
					}
				}
			}
		}
		const objectId = data.data?.objectId
		if (!objectId) continue

		const fields = data.data?.content?.fields
		const encryptedKeyRaw = fields?.encryption_key_history?.fields?.latest
		const keyVersion = fields?.encryption_key_history?.fields?.latest_version || 0

		let encryptedKey: Uint8Array | null = null
		if (Array.isArray(encryptedKeyRaw)) {
			encryptedKey = Uint8Array.from(encryptedKeyRaw)
		} else if (typeof encryptedKeyRaw === 'string') {
			const clean = encryptedKeyRaw.replace(/^0x/i, '')
			if (clean.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(clean)) {
				encryptedKey = new Uint8Array(clean.length / 2)
				for (let i = 0; i < encryptedKey.length; i++) {
					encryptedKey[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16)
				}
			}
		}

		result.set(objectId, {
			id: objectId,
			createdAt: typeof fields?.created_at_ms === 'number' ? fields.created_at_ms : Date.now(),
			encryptedKey,
			keyVersion: typeof keyVersion === 'number' ? keyVersion : 0,
		})
	}

	return result
}

export function normalizeAddress(value: string | null | undefined): string {
	return String(value || '')
		.trim()
		.toLowerCase()
}

export function sanitizeSlug(value: string | null | undefined, maxLength: number = 48): string {
	const slug = String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
	return slug.slice(0, maxLength)
}
