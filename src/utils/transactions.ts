import { fromBase64 } from '@mysten/sui/utils'
import type { Env } from '../types'
import { getSuiGraphQLClient, unwrapTransactionResult } from './sui-graphql'

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
			include: { effects: true },
		})

		const tx = unwrapTransactionResult(result)
		const ok =
			!!tx && typeof tx.status === 'object' && 'success' in tx.status ? !!tx.status.success : false

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
