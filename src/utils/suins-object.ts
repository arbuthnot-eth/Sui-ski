import type { Env } from '../types'

/**
 * Comprehensive SuiNS Registration object data
 */
export interface SuiNSObjectData {
	// Object metadata
	objectId: string
	version: string
	digest: string
	previousTransaction?: string
	owner?: {
		AddressOwner?: string
		ObjectOwner?: string
		Shared?: { initial_shared_version: string }
		Immutable?: Record<string, never>
	}
	objectType: string

	// Content fields (from Move object)
	content?: {
		domain?: string
		name?: string
		expiration_timestamp_ms?: string
		expirationTimestampMs?: string
		image_url?: string
		imageUrl?: string
		target_address?: string
		targetAddress?: string
		registration?: {
			fields?: {
				domain?: string
				name?: string
				expiration_timestamp_ms?: string
				target_address?: string
			}
		}
		// Any other fields that might exist
		[key: string]: unknown
	}

	// Display data (for NFT metadata)
	display?: {
		name?: string
		description?: string
		image_url?: string
		image?: string
		avatar?: string
		avatar_url?: string
		link?: string
		project_url?: string
		[key: string]: unknown
	}

	// Raw data for debugging
	raw?: {
		data?: unknown
		content?: unknown
		display?: unknown
	}
}

/**
 * Fetch comprehensive SuiNS Registration object data via RPC API
 * Extracts all relevant fields including metadata, content, and display data
 */
export async function fetchSuiNSObjectData(
	objectId: string,
	env: Env,
): Promise<SuiNSObjectData | null> {
	try {
		const response = await fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'sui_getObject',
				params: [
					objectId,
					{
						showContent: true,
						showDisplay: true,
						showOwner: true,
						showPreviousTransaction: true,
						showType: true,
						showBcs: false, // Not needed for most use cases
						showStorageRebate: true,
					},
				],
			}),
		})

		if (!response.ok) {
			console.error(`Failed to fetch object ${objectId}: ${response.status} ${response.statusText}`)
			return null
		}

		const data = (await response.json()) as {
			result?: {
				data?: {
					objectId: string
					version: string
					digest: string
					previousTransaction?: string
					owner?: {
						AddressOwner?: string
						ObjectOwner?: string
						Shared?: { initial_shared_version: string }
						Immutable?: Record<string, never>
					}
					type?: string
					content?: {
						dataType: string
						type?: string
						fields?: Record<string, unknown>
					}
					display?: {
						data?: Record<string, unknown>
					}
					bcs?: {
						dataType: string
						bcsBytes: string
					}
					storageRebate?: string
				}
				error?: {
					code: number
					message: string
				}
			}
		}

		if (data.result?.error) {
			console.error(`RPC error for object ${objectId}:`, data.result.error)
			return null
		}

		const result = data.result?.data
		if (!result) {
			console.error(`No data returned for object ${objectId}`)
			return null
		}

		// Extract content fields
		const contentFields: Record<string, unknown> = {}
		if (result.content?.dataType === 'moveObject' && result.content.fields) {
			Object.assign(contentFields, result.content.fields)
		}

		// Extract display data
		const displayData: Record<string, unknown> = {}
		if (result.display?.data) {
			Object.assign(displayData, result.display.data)
		}

		// Build comprehensive object data
		const objectData: SuiNSObjectData = {
			objectId: result.objectId,
			version: result.version,
			digest: result.digest,
			previousTransaction: result.previousTransaction,
			owner: result.owner,
			objectType: result.type || '',
			content: contentFields,
			display: displayData,
			raw: {
				data: result,
				content: result.content,
				display: result.display,
			},
		}

		return objectData
	} catch (error) {
		console.error(`Error fetching object ${objectId}:`, error)
		return null
	}
}

/**
 * Extract domain name from SuiNS object data
 * Handles various field name variations
 */
export function extractDomainFromObjectData(data: SuiNSObjectData): string | null {
	// Try domain_name field first (most direct)
	if (data.content?.domain_name) {
		return String(data.content.domain_name)
	}

	// Try domain object with labels array
	if (data.content?.domain && typeof data.content.domain === 'object') {
		const domainObj = data.content.domain as {
			fields?: { labels?: string[] }
			labels?: string[]
		}
		const labels = domainObj.fields?.labels || domainObj.labels
		if (Array.isArray(labels) && labels.length > 0) {
			// Reverse labels and join with dots (e.g., ["sui", "agent"] -> "agent.sui")
			return [...labels].reverse().join('.')
		}
	}

	// Try content name field
	if (data.content?.name) {
		return String(data.content.name)
	}

	// Try nested registration structure
	if (data.content?.registration && typeof data.content.registration === 'object') {
		const reg = data.content.registration as { fields?: { domain?: string; name?: string } }
		if (reg.fields?.domain) return String(reg.fields.domain)
		if (reg.fields?.name) return String(reg.fields.name)
	}

	// Try display data
	if (data.display?.name) {
		return String(data.display.name)
	}

	return null
}

/**
 * Extract expiration timestamp from SuiNS object data
 */
export function extractExpirationFromObjectData(data: SuiNSObjectData): string | null {
	// Try various field name variations
	if (data.content?.expiration_timestamp_ms) {
		return String(data.content.expiration_timestamp_ms)
	}
	if (data.content?.expirationTimestampMs) {
		return String(data.content.expirationTimestampMs)
	}

	// Try nested registration structure
	if (data.content?.registration && typeof data.content.registration === 'object') {
		const reg = data.content.registration as {
			fields?: { expiration_timestamp_ms?: string }
		}
		if (reg.fields?.expiration_timestamp_ms) {
			return String(reg.fields.expiration_timestamp_ms)
		}
	}

	return null
}

/**
 * Extract image URL from SuiNS object data
 * Checks both content and display fields
 */
export function extractImageUrlFromObjectData(data: SuiNSObjectData): string | null {
	// Try display data first (most common location)
	if (data.display?.image_url) return String(data.display.image_url)
	if (data.display?.image) return String(data.display.image)
	if (data.display?.avatar_url) return String(data.display.avatar_url)
	if (data.display?.avatar) return String(data.display.avatar)

	// Try content fields
	if (data.content?.image_url) return String(data.content.image_url)
	if (data.content?.imageUrl) return String(data.content.imageUrl)

	return null
}

/**
 * Extract target address from SuiNS object data
 */
export function extractTargetAddressFromObjectData(data: SuiNSObjectData): string | null {
	if (data.content?.target_address) {
		return String(data.content.target_address)
	}
	if (data.content?.targetAddress) {
		return String(data.content.targetAddress)
	}

	// Try nested registration structure
	if (data.content?.registration && typeof data.content.registration === 'object') {
		const reg = data.content.registration as {
			fields?: { target_address?: string }
		}
		if (reg.fields?.target_address) {
			return String(reg.fields.target_address)
		}
	}

	return null
}

/**
 * Extract owner address from SuiNS object data
 */
export function extractOwnerAddressFromObjectData(data: SuiNSObjectData): string | null {
	if (data.owner?.AddressOwner) {
		return data.owner.AddressOwner
	}
	if (data.owner?.ObjectOwner) {
		return data.owner.ObjectOwner
	}
	return null
}
