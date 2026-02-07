import { Transaction } from '@mysten/sui/transactions'
import type { Env } from '../types'
import { getDefaultRpcUrl } from './rpc'

function getPackageId(env: Env): string {
	const packageId = env.BLACK_DIAMOND_PACKAGE_ID
	if (!packageId) {
		throw new Error('BLACK_DIAMOND_PACKAGE_ID not configured')
	}
	return packageId
}

export interface CreateWatchlistArgs {
	senderAddress: string
}

export function buildCreateWatchlistTx(args: CreateWatchlistArgs, env: Env): Transaction {
	const packageId = getPackageId(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${packageId}::watchlist::create`,
	})

	return tx
}

export interface WatchArgs {
	watchlistId: string
	name: string
	senderAddress: string
}

export function buildWatchTx(args: WatchArgs, env: Env): Transaction {
	const packageId = getPackageId(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${packageId}::watchlist::watch`,
		arguments: [tx.object(args.watchlistId), tx.pure.string(args.name)],
	})

	return tx
}

export interface UnwatchArgs {
	watchlistId: string
	name: string
	senderAddress: string
}

export function buildUnwatchTx(args: UnwatchArgs, env: Env): Transaction {
	const packageId = getPackageId(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${packageId}::watchlist::unwatch`,
		arguments: [tx.object(args.watchlistId), tx.pure.string(args.name)],
	})

	return tx
}

interface RpcResponse<T> {
	jsonrpc: string
	id: number
	result?: T
	error?: { code: number; message: string }
}

async function rpcCall<T>(env: Env, method: string, params: unknown[]): Promise<T> {
	const rpcUrl = env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK)
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

interface OwnedObjectsResult {
	data: Array<{
		data: {
			objectId: string
			content?: {
				fields: Record<string, unknown>
			}
			owner?: { AddressOwner?: string }
		}
	}>
	nextCursor?: string
	hasNextPage: boolean
}

export interface WatchlistInfo {
	watchlistId: string
	names: string[]
	owner: string
}

export async function getWatchlistForAddress(
	address: string,
	env: Env,
): Promise<WatchlistInfo | null> {
	const packageId = env.BLACK_DIAMOND_PACKAGE_ID
	if (!packageId) return null

	const structType = `${packageId}::watchlist::Watchlist`

	const result = await rpcCall<OwnedObjectsResult>(env, 'suix_getOwnedObjects', [
		address,
		{
			filter: { StructType: structType },
			options: { showContent: true, showOwner: true },
		},
	])

	const first = result?.data?.[0]
	if (!first) return null

	const fields = first.data.content?.fields as Record<string, unknown> | undefined
	if (!fields) return null

	const names = (fields.names as string[]) || []

	return {
		watchlistId: first.data.objectId,
		names,
		owner: first.data.owner?.AddressOwner || address,
	}
}

export async function isWatchingName(address: string, name: string, env: Env): Promise<boolean> {
	const watchlist = await getWatchlistForAddress(address, env)
	if (!watchlist) return false
	return watchlist.names.includes(name)
}
