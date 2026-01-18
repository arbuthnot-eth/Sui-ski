import { getNetworkStatus } from '../resolvers/rpc'
import type { Env } from '../types'

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
}

export async function getGatewayStatus(env: Env): Promise<GatewayStatus> {
	const rpc = await resolveRpcStatus(env)

	return {
		network: env.SUI_NETWORK,
		timestamp: new Date().toISOString(),
		rpc,
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
