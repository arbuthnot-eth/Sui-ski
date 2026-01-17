import type { Env } from '../types'
import { getNetworkStatus } from '../resolvers/rpc'
import { getMoveRegistryParentId } from '../resolvers/mvr'
import { getIkaConfig } from './ika'

interface JsonRpcObjectResponse {
	result?: {
		data?: unknown
	}
	error?: {
		message?: string
	}
}

export interface GatewayStatus {
	network: Env['SUI_NETWORK']
	timestamp: string
	rpc: {
		ok: boolean
		chainId?: string
		latestCheckpoint?: string
		error?: string
	}
	ika: {
		ok: boolean
		network: 'mainnet' | 'testnet'
		objects: Record<string, boolean>
		error?: string
	}
	moveRegistry: {
		ok: boolean
		configured: boolean
		registryId?: string
		error?: string
	}
	messaging: {
		configured: boolean
		contractAddress?: string | null
	}
}

export async function getGatewayStatus(env: Env): Promise<GatewayStatus> {
	const [rpc, ika, moveRegistry] = await Promise.all([
		resolveRpcStatus(env),
		resolveIkaStatus(env),
		resolveMoveRegistryStatus(env),
	])

	return {
		network: env.SUI_NETWORK,
		timestamp: new Date().toISOString(),
		rpc,
		ika,
		moveRegistry,
		messaging: {
			configured: Boolean(env.MESSAGING_CONTRACT_ADDRESS),
			contractAddress: env.MESSAGING_CONTRACT_ADDRESS || null,
		},
	}
}

async function resolveRpcStatus(env: Env): Promise<GatewayStatus['rpc']> {
	try {
		const status = await getNetworkStatus(env)
		return {
			ok: true,
			chainId: status.chainId,
			latestCheckpoint: status.latestCheckpoint,
		}
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : 'Failed to reach Sui RPC',
		}
	}
}

async function resolveIkaStatus(env: Env): Promise<GatewayStatus['ika']> {
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	try {
		const config = getIkaConfig(network)
		const checks = await Promise.all(
			Object.entries(config.objects).map(async ([key, value]) => {
				const exists = await objectExists(value.objectID, env)
				return [key, exists] as const
			}),
		)
		const objects = Object.fromEntries(checks)
		return {
			ok: Object.values(objects).every(Boolean),
			network,
			objects,
		}
	} catch (error) {
		return {
			ok: false,
			network,
			error: error instanceof Error ? error.message : 'Unable to verify Ika deployment',
			objects: {},
		}
	}
}

async function resolveMoveRegistryStatus(env: Env): Promise<GatewayStatus['moveRegistry']> {
	const registryId = getMoveRegistryParentId(env)
	if (!registryId) {
		return {
			ok: false,
			configured: false,
			error: 'Move Registry parent ID not configured',
		}
	}

	try {
		const exists = await objectExists(registryId, env)
		return {
			ok: exists,
			configured: true,
			registryId,
			error: exists ? undefined : 'Configured parent object is missing',
		}
	} catch (error) {
		return {
			ok: false,
			configured: true,
			registryId,
			error: error instanceof Error ? error.message : 'Failed to query Move Registry object',
		}
	}
}

async function objectExists(objectId: string, env: Env): Promise<boolean> {
	const response = await fetch(env.SUI_RPC_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			id: 1,
			method: 'sui_getObject',
			params: [objectId, { showContent: false }],
		}),
	})

	const data = (await response.json()) as JsonRpcObjectResponse
	if (data.error) {
		throw new Error(data.error.message || 'Unknown RPC error')
	}
	return Boolean(data.result?.data)
}
