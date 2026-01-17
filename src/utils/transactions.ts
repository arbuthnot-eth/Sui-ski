import type { Env } from '../types'

export interface RelayResult {
	ok: boolean
	status: number
	response?: unknown
	error?: string
}

export async function relaySignedTransaction(
	env: Env,
	txBytes: string,
	signatures: string[],
	options: Record<string, unknown> = {},
	requestType = 'WaitForLocalExecution',
): Promise<RelayResult> {
	const executionParams = [
		txBytes,
		signatures,
		{
			showEffects: true,
			showEvents: true,
			showBalanceChanges: false,
			showInput: false,
			...options,
		},
		requestType,
	]

	try {
		const rpcResponse = await fetch(env.SUI_RPC_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: Date.now(),
				method: 'sui_executeTransactionBlock',
				params: executionParams,
			}),
		})

		const rpcJson = await rpcResponse.json().catch(() => ({}))
		const rpcError = (rpcJson as { error?: { message?: string } }).error
		const ok = rpcResponse.ok && !rpcError
		const errorMessage =
			typeof rpcError?.message === 'string'
				? rpcError.message
				: rpcError
					? JSON.stringify(rpcError)
					: undefined

		return {
			ok,
			status: rpcResponse.status,
			response: rpcJson,
			error: errorMessage,
		}
	} catch (error) {
		return {
			ok: false,
			status: 0,
			error: error instanceof Error ? error.message : 'Unable to reach Sui RPC',
		}
	}
}
