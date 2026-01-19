import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import type { Env } from '../types'
import { cacheKey, getCached, setCache } from '../utils/cache'

/**
 * Messaging Resolution Utilities
 *
 * This module provides address and channel resolution for the Sui Messaging SDK.
 *
 * The @mysten/messaging SDK is part of a monorepo (sui-stack-messaging-sdk).
 * Once published to npm, you can import directly:
 *
 *   import {
 *     SuiNSResolver,
 *     LocalChannelRegistry,
 *     isSuiNSName,
 *     isChannelName,
 *   } from '@mysten/messaging'
 *
 * For now, we provide compatible fallback implementations below that work
 * with the existing @mysten/suins SDK.
 *
 * SDK Source: https://github.com/arbuthnot-eth/sui-stack-messaging-sdk
 * Branch: feature/suins-display-names
 */

const CACHE_TTL = 300 // 5 minutes

/**
 * Channel info from messaging SDK
 */
export interface ChannelInfo {
	id: string
	name: string
	displayName?: string
	description?: string
	createdAt?: number
	memberCount?: number
	isPublic?: boolean
}

/**
 * User messaging profile
 */
export interface MessagingProfile {
	address: string
	suinsName?: string
	displayName?: string
	avatar?: string
	channels?: string[]
}

/**
 * Check if a string is a SuiNS name format (@user.sui)
 */
export function isSuiNSName(input: string): boolean {
	// Matches @name.sui pattern
	return /^@[a-z0-9-]+\.sui$/i.test(input)
}

/**
 * Check if a string is a channel name format (#channel)
 */
export function isChannelName(input: string): boolean {
	// Matches #channel pattern
	return /^#[a-z0-9-]+$/i.test(input)
}

/**
 * Normalize a channel name to lowercase with # prefix
 */
export function normalizeChannelName(name: string): string {
	const cleaned = name.replace(/^#/, '').toLowerCase().trim()
	return `#${cleaned}`
}

/**
 * Format a channel name for display
 */
export function formatChannelName(name: string): string {
	return normalizeChannelName(name)
}

/**
 * Messaging resolver for SuiNS names and channel names
 * Uses the @mysten/messaging SDK for resolution
 */
export class MessagingResolver {
	private suiClient: SuiClient
	private suinsClient: SuinsClient
	private channelRegistry: Map<string, string>
	private env: Env

	constructor(env: Env, channelMappings?: Record<string, string>) {
		this.env = env
		this.suiClient = new SuiClient({ url: env.SUI_RPC_URL })
		this.suinsClient = new SuinsClient({
			client: this.suiClient as never,
			network: env.SUI_NETWORK as 'mainnet' | 'testnet',
		})
		// Initialize with any pre-configured channel mappings
		this.channelRegistry = new Map(Object.entries(channelMappings || {}))
	}

	/**
	 * Resolve a SuiNS name (@user.sui) to a Sui address
	 */
	async resolveAddress(nameOrAddress: string): Promise<string | null> {
		// If already a Sui address, return it
		if (nameOrAddress.startsWith('0x') && nameOrAddress.length >= 66) {
			return nameOrAddress
		}

		// Remove @ prefix if present
		const name = nameOrAddress.replace(/^@/, '')

		// Ensure .sui suffix
		const suinsName = name.endsWith('.sui') ? name : `${name}.sui`

		// Check cache first
		const key = cacheKey('msg-addr', this.env.SUI_NETWORK, suinsName)
		const cached = await getCached<string>(this.env, key)
		if (cached) {
			return cached
		}

		try {
			const nameRecord = await this.suinsClient.getNameRecord(suinsName)
			if (nameRecord?.targetAddress) {
				await setCache(this.env, key, nameRecord.targetAddress, CACHE_TTL)
				return nameRecord.targetAddress
			}
			return null
		} catch (error) {
			console.error(`Failed to resolve SuiNS name ${suinsName}:`, error)
			return null
		}
	}

	/**
	 * Resolve a channel name (#channel) to a channel object ID
	 */
	async resolveChannel(nameOrId: string): Promise<string | null> {
		// If already a Sui object ID, return it
		if (nameOrId.startsWith('0x') && nameOrId.length >= 66) {
			return nameOrId
		}

		const normalizedName = normalizeChannelName(nameOrId)

		// Check KV-backed cache first
		const key = cacheKey('msg-channel', this.env.SUI_NETWORK, normalizedName)
		const cached = await getCached<string>(this.env, key)
		if (cached) {
			return cached
		}

		// Check local registry
		const localId = this.channelRegistry.get(normalizedName)
		if (localId) {
			return localId
		}

		// Could query on-chain registry here if available
		// For now, return null for unregistered channels
		return null
	}

	/**
	 * Register a channel name mapping (local only)
	 */
	async registerChannel(name: string, channelId: string): Promise<void> {
		const normalizedName = normalizeChannelName(name)
		this.channelRegistry.set(normalizedName, channelId)

		// Persist to KV cache
		const key = cacheKey('msg-channel', this.env.SUI_NETWORK, normalizedName)
		await setCache(this.env, key, channelId, CACHE_TTL * 12) // Longer TTL for channel mappings
	}

	/**
	 * Get channel info by name or ID
	 */
	async getChannelInfo(nameOrId: string): Promise<ChannelInfo | null> {
		const channelId = await this.resolveChannel(nameOrId)
		if (!channelId) {
			return null
		}

		// Check cache
		const key = cacheKey('msg-channel-info', this.env.SUI_NETWORK, channelId)
		const cached = await getCached<ChannelInfo>(this.env, key)
		if (cached) {
			return cached
		}

		try {
			// Fetch channel object from chain
			const channelObject = await this.suiClient.getObject({
				id: channelId,
				options: {
					showContent: true,
					showType: true,
				},
			})

			if (!channelObject.data?.content || channelObject.data.content.dataType !== 'moveObject') {
				return null
			}

			const fields = channelObject.data.content.fields as Record<string, unknown>

			const info: ChannelInfo = {
				id: channelId,
				name: (fields.name as string) || normalizeChannelName(nameOrId),
				displayName: fields.display_name as string | undefined,
				description: fields.description as string | undefined,
				memberCount: fields.member_count as number | undefined,
				isPublic: fields.is_public as boolean | undefined,
			}

			await setCache(this.env, key, info, CACHE_TTL)
			return info
		} catch (error) {
			console.error(`Failed to fetch channel info for ${channelId}:`, error)
			return null
		}
	}

	/**
	 * Get messaging profile for a user by name or address
	 */
	async getUserProfile(nameOrAddress: string): Promise<MessagingProfile | null> {
		const address = await this.resolveAddress(nameOrAddress)
		if (!address) {
			return null
		}

		// Check cache
		const key = cacheKey('msg-profile', this.env.SUI_NETWORK, address)
		const cached = await getCached<MessagingProfile>(this.env, key)
		if (cached) {
			return cached
		}

		try {
			// Get reverse lookup for primary name
			let suinsName: string | undefined
			try {
				// @ts-expect-error - getDefaultName exists at runtime
				const defaultName = await this.suinsClient.getDefaultName(address)
				if (defaultName) {
					suinsName = defaultName
				}
			} catch {
				// Reverse lookup optional
			}

			// Get avatar if we have a name
			let avatar: string | undefined
			if (suinsName) {
				try {
					const nameRecord = await this.suinsClient.getNameRecord(suinsName)
					avatar = nameRecord?.avatar
				} catch {
					// Avatar optional
				}
			}

			const profile: MessagingProfile = {
				address,
				suinsName,
				displayName: suinsName ? suinsName.replace(/\.sui$/i, '') : undefined,
				avatar,
				channels: [], // Would need to query on-chain for user's channels
			}

			await setCache(this.env, key, profile, CACHE_TTL)
			return profile
		} catch (error) {
			console.error(`Failed to fetch messaging profile for ${address}:`, error)
			return null
		}
	}

	/**
	 * Check if input is a SuiNS name
	 */
	isSuiNSName(input: string): boolean {
		return isSuiNSName(input)
	}

	/**
	 * Check if input is a channel name
	 */
	isChannelName(input: string): boolean {
		return isChannelName(input)
	}
}

/**
 * Create a messaging resolver instance
 */
export function createMessagingResolver(
	env: Env,
	channelMappings?: Record<string, string>,
): MessagingResolver {
	return new MessagingResolver(env, channelMappings)
}
