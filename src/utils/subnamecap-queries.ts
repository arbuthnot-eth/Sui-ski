import type { Env } from '../types'
import { getDefaultRpcUrl } from './rpc'

export interface SubnameCapInfo {
	capId: string
	parentDomain: string
	parentNftId: string
	allowLeafCreation: boolean
	allowNodeCreation: boolean
	owner: string
}

export interface CapEntryInfo {
	capId: string
	createdAtMs: number
	allowLeaf: boolean
	allowNode: boolean
}

export interface SubnameInfo {
	name: string
	targetAddress: string
	expirationTimestampMs: number
	isLeaf: boolean
}

interface RpcResponse<T> {
	jsonrpc: string
	id: number
	result?: T
	error?: { code: number; message: string }
}

function getSubnameCapRpcUrl(env: Env): string {
	return env.SUBNAMECAP_RPC_URL || getDefaultRpcUrl('testnet')
}

async function rpcCall<T>(env: Env, method: string, params: unknown[]): Promise<T> {
	const rpcUrl = getSubnameCapRpcUrl(env)
	const response = await fetch(rpcUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
	})

	if (!response.ok) {
		throw new Error(`RPC request failed: ${response.status} ${response.statusText}`)
	}

	const data = (await response.json()) as RpcResponse<T>
	if (data.error) {
		throw new Error(`RPC error ${data.error.code}: ${data.error.message}`)
	}

	return data.result as T
}

interface ObjectData {
	data?: {
		objectId: string
		content?: {
			dataType: string
			type: string
			fields: Record<string, unknown>
		}
		owner?: {
			AddressOwner?: string
			ObjectOwner?: string
			Shared?: { initial_shared_version: number }
		}
	}
}

export async function getSubnameCapById(capId: string, env: Env): Promise<SubnameCapInfo | null> {
	const result = await rpcCall<ObjectData>(env, 'sui_getObject', [
		capId,
		{ showContent: true, showOwner: true },
	])

	if (!result?.data?.content?.fields) return null

	const fields = result.data.content.fields as Record<string, unknown>
	const parentDomain = fields.parent_domain as { fields?: { labels?: string[] } }
	const labels = parentDomain?.fields?.labels || []
	const domainName = [...labels].reverse().join('.')

	return {
		capId: result.data.objectId,
		parentDomain: domainName,
		parentNftId: fields.parent_nft_id as string,
		allowLeafCreation: fields.allow_leaf_creation as boolean,
		allowNodeCreation: fields.allow_node_creation as boolean,
		owner: result.data.owner?.AddressOwner || result.data.owner?.ObjectOwner || '',
	}
}

interface OwnedObjectsResult {
	data: Array<{
		data: {
			objectId: string
			content?: {
				type: string
				fields: Record<string, unknown>
			}
			owner?: { AddressOwner?: string }
		}
	}>
	nextCursor?: string
	hasNextPage: boolean
}

export async function getSubnameCapsOwnedBy(
	ownerAddress: string,
	env: Env,
): Promise<SubnameCapInfo[]> {
	const subdomainsPackageId = env.SUBNAMECAP_SUBDOMAINS_PACKAGE_ID
	if (!subdomainsPackageId) return []

	const structType = `${subdomainsPackageId}::subdomains::SubnameCap`

	const result = await rpcCall<OwnedObjectsResult>(env, 'suix_getOwnedObjects', [
		ownerAddress,
		{
			filter: { StructType: structType },
			options: { showContent: true, showOwner: true },
		},
	])

	const caps: SubnameCapInfo[] = []
	for (const item of result?.data || []) {
		const fields = item.data.content?.fields as Record<string, unknown> | undefined
		if (!fields) continue

		const parentDomain = fields.parent_domain as { fields?: { labels?: string[] } }
		const labels = parentDomain?.fields?.labels || []
		const domainName = [...labels].reverse().join('.')

		caps.push({
			capId: item.data.objectId,
			parentDomain: domainName,
			parentNftId: fields.parent_nft_id as string,
			allowLeafCreation: fields.allow_leaf_creation as boolean,
			allowNodeCreation: fields.allow_node_creation as boolean,
			owner: item.data.owner?.AddressOwner || ownerAddress,
		})
	}

	return caps
}

interface DynamicFieldResult {
	data?: {
		content?: {
			fields: {
				value?: {
					fields?: {
						caps?: Array<{
							fields: {
								cap_id: string
								created_at_ms: string
								allow_leaf: boolean
								allow_node: boolean
							}
						}>
					}
				}
			}
		}
	}
}

export async function getActiveCapsForDomain(domain: string, env: Env): Promise<CapEntryInfo[]> {
	const suinsObjectId = env.SUBNAMECAP_SUINS_OBJECT_ID
	const subdomainsPackageId = env.SUBNAMECAP_SUBDOMAINS_PACKAGE_ID
	if (!suinsObjectId || !subdomainsPackageId) return []

	const parts = domain.replace(/\.sui$/i, '').split('.')
	const labels = ['sui', ...parts.reverse()]

	const dynamicFieldName = {
		type: `${subdomainsPackageId}::subdomains::ActiveCapsKey`,
		value: {
			domain: { labels },
		},
	}

	try {
		const result = await rpcCall<DynamicFieldResult>(env, 'suix_getDynamicFieldObject', [
			suinsObjectId,
			dynamicFieldName,
		])

		const capsData = result?.data?.content?.fields?.value?.fields?.caps
		if (!capsData) return []

		return capsData.map((cap) => ({
			capId: cap.fields.cap_id,
			createdAtMs: Number(cap.fields.created_at_ms),
			allowLeaf: cap.fields.allow_leaf,
			allowNode: cap.fields.allow_node,
		}))
	} catch {
		return []
	}
}

export async function getCapOwner(capId: string, env: Env): Promise<string | null> {
	const result = await rpcCall<ObjectData>(env, 'sui_getObject', [capId, { showOwner: true }])

	return result?.data?.owner?.AddressOwner || result?.data?.owner?.ObjectOwner || null
}

export async function relaySignedTransaction(
	txBytes: string,
	signatures: string[],
	env: Env,
): Promise<{ digest: string; effects: unknown }> {
	const result = await rpcCall<{ digest: string; effects: unknown }>(
		env,
		'sui_executeTransactionBlock',
		[
			txBytes,
			signatures,
			{ showEffects: true, showEvents: true, showObjectChanges: true },
			'WaitForLocalExecution',
		],
	)

	return result
}

export interface FeeJacketInfo {
	jacketId: string
	leafFee: string
	nodeFee: string
	feeRecipient: string
	paused: boolean
}

export async function getFeeJacketById(jacketId: string, env: Env): Promise<FeeJacketInfo | null> {
	const result = await rpcCall<ObjectData>(env, 'sui_getObject', [
		jacketId,
		{ showContent: true },
	])

	if (!result?.data?.content?.fields) return null

	const fields = result.data.content.fields as Record<string, unknown>

	return {
		jacketId: result.data.objectId,
		leafFee: String(fields.leaf_fee),
		nodeFee: String(fields.node_fee),
		feeRecipient: fields.fee_recipient as string,
		paused: fields.paused as boolean,
	}
}

export interface AllowlistJacketInfo {
	jacketId: string
	paused: boolean
}

export async function getAllowlistJacketById(jacketId: string, env: Env): Promise<AllowlistJacketInfo | null> {
	const result = await rpcCall<ObjectData>(env, 'sui_getObject', [
		jacketId,
		{ showContent: true },
	])

	if (!result?.data?.content?.fields) return null

	const fields = result.data.content.fields as Record<string, unknown>

	return {
		jacketId: result.data.objectId,
		paused: fields.paused as boolean,
	}
}

export interface RateLimitJacketInfo {
	jacketId: string
	maxPerWindow: string
	windowDurationMs: string
	paused: boolean
}

export async function getRateLimitJacketById(jacketId: string, env: Env): Promise<RateLimitJacketInfo | null> {
	const result = await rpcCall<ObjectData>(env, 'sui_getObject', [
		jacketId,
		{ showContent: true },
	])

	if (!result?.data?.content?.fields) return null

	const fields = result.data.content.fields as Record<string, unknown>

	return {
		jacketId: result.data.objectId,
		maxPerWindow: String(fields.max_per_window),
		windowDurationMs: String(fields.window_duration_ms),
		paused: fields.paused as boolean,
	}
}
