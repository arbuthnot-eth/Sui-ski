import { fromBase64 } from '@mysten/sui/utils'
import type { Env } from '../types'
import { getSuiGraphQLClient } from './sui-graphql'

interface RelayResult {
	ok: boolean
	status: number
	response?: unknown
	error?: string
}

export async function relaySignedTransaction(
	env: Env,
	txBytes: string,
	signatures: string[],
	_options: Record<string, unknown> = {},
	_requestType = 'WaitForLocalExecution',
): Promise<RelayResult> {
	try {
		const client = getSuiGraphQLClient(env)
		const result = await client.executeTransaction({
			transaction: fromBase64(txBytes),
			signatures,
		})

		const tx = result.transaction as
			| { digest?: string; status?: string; effects?: unknown }
			| undefined
		const status = tx?.status ?? 'success'
		const ok = status === 'success' || status === 'Success'

		return {
			ok,
			status: 200,
			response: result,
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unable to reach Sui GraphQL'
		return {
			ok: false,
			status: 0,
			error: message,
		}
	}
}
