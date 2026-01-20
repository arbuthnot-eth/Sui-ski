/**
 * Agencies Resolver
 * Fetches agency data from the Sui blockchain.
 *
 * Agencies are stored on-chain in a registry object.
 * This resolver provides methods to query and cache agency data.
 */

import { SuiClient } from '@mysten/sui/client'
import type { Env } from '../types'
import type { Agency, AgencyMember } from '../types/agents'

/**
 * On-chain agency object structure
 */
interface OnChainAgency {
	id: { id: string }
	name: string
	description: string
	avatar: string
	owner: string
	members: Array<{
		address: string
		member_type: number  // 0: human, 1: llm_agent, 2: backend_bot
		role: number         // 0: owner, 1: admin, 2: operator
		capabilities: number // Bitmask of capabilities
		display_name: string
		model_id: string
		delegation_cap_id: string
		dwallet_permission: number
		added_at: string
		added_by: string
	}>
	dwallet_id: string
	permissions: {
		owner_required: number
		admin_required: number
		llm_autonomous: number
		two_party_required: number
		spending_limits: {
			per_transaction: string
			per_day: string
			per_month: string
		}
	}
	channel_ids: string[]
	news_channel_ids: string[]
	is_public: boolean
	tags: string[]
	created_at: string
	updated_at: string
}

/**
 * Convert member type number to string
 */
function memberTypeFromNumber(n: number): 'human' | 'llm_agent' | 'backend_bot' {
	switch (n) {
		case 0: return 'human'
		case 1: return 'llm_agent'
		case 2: return 'backend_bot'
		default: return 'human'
	}
}

/**
 * Convert role number to string
 */
function roleFromNumber(n: number): 'owner' | 'admin' | 'operator' {
	switch (n) {
		case 0: return 'owner'
		case 1: return 'admin'
		case 2: return 'operator'
		default: return 'operator'
	}
}

/**
 * Convert capability bitmask to array
 */
function capabilitiesFromBitmask(bitmask: number): AgencyMember['capabilities'] {
	const caps: AgencyMember['capabilities'] = []
	const mapping: Array<[number, AgencyMember['capabilities'][number]]> = [
		[1 << 0, 'send_messages'],
		[1 << 1, 'read_messages'],
		[1 << 2, 'manage_channels'],
		[1 << 3, 'invite_members'],
		[1 << 4, 'remove_members'],
		[1 << 5, 'update_metadata'],
		[1 << 6, 'manage_dwallet'],
		[1 << 7, 'sign_transactions'],
		[1 << 8, 'broadcast_news'],
		[1 << 9, 'moderate_content'],
	]
	for (const [bit, cap] of mapping) {
		if (bitmask & bit) {
			caps.push(cap)
		}
	}
	return caps
}

/**
 * Convert dWallet permission number to string
 */
function dwalletPermissionFromNumber(n: number): 'view' | 'propose' | 'execute' | 'full' | undefined {
	switch (n) {
		case 1: return 'view'
		case 2: return 'propose'
		case 3: return 'execute'
		case 4: return 'full'
		default: return undefined
	}
}

/**
 * Convert on-chain agency to API format
 */
function convertAgency(onChain: OnChainAgency): Agency {
	return {
		id: onChain.id.id,
		name: onChain.name,
		description: onChain.description || undefined,
		avatar: onChain.avatar || undefined,
		members: onChain.members.map(m => ({
			address: m.address,
			type: memberTypeFromNumber(m.member_type),
			role: roleFromNumber(m.role),
			capabilities: capabilitiesFromBitmask(m.capabilities),
			displayName: m.display_name || undefined,
			modelId: m.model_id || undefined,
			delegationCapId: m.delegation_cap_id || undefined,
			dwalletPermission: dwalletPermissionFromNumber(m.dwallet_permission),
			addedAt: Number(m.added_at),
			addedBy: m.added_by,
		})),
		dWalletId: onChain.dwallet_id || undefined,
		permissions: {
			ownerRequired: capabilitiesFromBitmask(onChain.permissions.owner_required),
			adminRequired: capabilitiesFromBitmask(onChain.permissions.admin_required),
			llmAutonomous: capabilitiesFromBitmask(onChain.permissions.llm_autonomous),
			twoPartyRequired: capabilitiesFromBitmask(onChain.permissions.two_party_required),
			spendingLimits: {
				perTransaction: onChain.permissions.spending_limits.per_transaction,
				perDay: onChain.permissions.spending_limits.per_day,
				perMonth: onChain.permissions.spending_limits.per_month,
			},
		},
		createdAt: Number(onChain.created_at),
		updatedAt: Number(onChain.updated_at),
		channelIds: onChain.channel_ids,
		newsChannelIds: onChain.news_channel_ids,
		isPublic: onChain.is_public,
		tags: onChain.tags,
	}
}

/**
 * Create an agencies resolver instance
 */
export function createAgenciesResolver(env: Env) {
	const client = new SuiClient({ url: env.SUI_RPC_URL })
	const cachePrefix = 'agency:'
	const cacheTtl = 60 // 1 minute cache

	return {
		/**
		 * Get a single agency by ID
		 */
		async getAgency(agencyId: string): Promise<Agency | null> {
			// Check cache
			const cached = await env.CACHE.get(`${cachePrefix}${agencyId}`)
			if (cached) {
				return JSON.parse(cached)
			}

			// Fetch from chain
			try {
				const result = await client.getObject({
					id: agencyId,
					options: {
						showContent: true,
						showOwner: true,
					},
				})

				if (!result.data?.content || result.data.content.dataType !== 'moveObject') {
					return null
				}

				const onChain = result.data.content.fields as unknown as OnChainAgency
				const agency = convertAgency(onChain)

				// Cache result
				await env.CACHE.put(
					`${cachePrefix}${agencyId}`,
					JSON.stringify(agency),
					{ expirationTtl: cacheTtl }
				)

				return agency
			} catch (error) {
				console.error('Failed to fetch agency:', error)
				return null
			}
		},

		/**
		 * List public agencies from the registry
		 */
		async listAgencies(options: {
			limit?: number
			cursor?: string
			tags?: string[]
		} = {}): Promise<{
			agencies: Agency[]
			cursor?: string
			hasMore: boolean
		}> {
			const registryId = env.AGENCY_REGISTRY_ID
			if (!registryId) {
				return { agencies: [], hasMore: false }
			}

			try {
				// Query the registry's dynamic fields for agency IDs
				const result = await client.getDynamicFields({
					parentId: registryId,
					limit: options.limit || 20,
					cursor: options.cursor,
				})

				// Fetch each agency
				const agencies: Agency[] = []
				for (const field of result.data) {
					const agency = await this.getAgency(field.objectId)
					if (agency && agency.isPublic) {
						// Filter by tags if specified
						if (options.tags?.length) {
							const hasMatchingTag = options.tags.some(t => agency.tags.includes(t))
							if (!hasMatchingTag) continue
						}
						agencies.push(agency)
					}
				}

				return {
					agencies,
					cursor: result.nextCursor || undefined,
					hasMore: result.hasNextPage,
				}
			} catch (error) {
				console.error('Failed to list agencies:', error)
				return { agencies: [], hasMore: false }
			}
		},

		/**
		 * Get agencies owned by an address
		 */
		async getAgenciesByOwner(ownerAddress: string): Promise<Agency[]> {
			// Check cache
			const cacheKey = `${cachePrefix}owner:${ownerAddress}`
			const cached = await env.CACHE.get(cacheKey)
			if (cached) {
				return JSON.parse(cached)
			}

			try {
				// Query owned objects of the Agency type
				// Note: This requires knowing the package ID
				// For now, return empty array
				return []
			} catch (error) {
				console.error('Failed to fetch agencies by owner:', error)
				return []
			}
		},

		/**
		 * Check if an address is a member of an agency
		 */
		async isMember(agencyId: string, address: string): Promise<boolean> {
			const agency = await this.getAgency(agencyId)
			if (!agency) return false
			return agency.members.some(m => m.address === address)
		},

		/**
		 * Get a member's role and capabilities in an agency
		 */
		async getMemberInfo(agencyId: string, address: string): Promise<AgencyMember | null> {
			const agency = await this.getAgency(agencyId)
			if (!agency) return null
			return agency.members.find(m => m.address === address) || null
		},

		/**
		 * Invalidate cache for an agency
		 */
		async invalidateCache(agencyId: string): Promise<void> {
			await env.CACHE.delete(`${cachePrefix}${agencyId}`)
		},
	}
}

export type AgenciesResolver = ReturnType<typeof createAgenciesResolver>
