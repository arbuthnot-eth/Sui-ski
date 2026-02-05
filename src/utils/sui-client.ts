import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import type { Env } from '../types'

export function createSuiClient(env: Env): SuiJsonRpcClient {
	return new SuiJsonRpcClient({
		url: env.SUI_RPC_URL,
		network: env.SUI_NETWORK,
	})
}
