import { SuiGrpcClient } from '@mysten/sui/grpc'
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import type { Env } from '../types'

const GRPC_ENDPOINTS: Record<Env['SUI_NETWORK'], string> = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
	devnet: 'https://fullnode.devnet.sui.io:443',
}

const SURFLUX_ENDPOINT = 'https://grpc.surflux.dev'

const clientCache = new Map<string, SuiGrpcClient>()

function getGrpcClient(env: Env): SuiGrpcClient {
	const useSurflux = Boolean(env.SURFLUX_API_KEY) && env.SUI_NETWORK === 'mainnet'
	const key = useSurflux ? 'surflux' : env.SUI_NETWORK

	let client = clientCache.get(key)
	if (!client) {
		if (useSurflux) {
			const transport = new GrpcWebFetchTransport({
				baseUrl: SURFLUX_ENDPOINT,
				meta: { 'x-api-key': env.SURFLUX_API_KEY! },
			})
			client = new SuiGrpcClient({ network: 'mainnet', transport })
		} else {
			client = new SuiGrpcClient({
				network: env.SUI_NETWORK,
				baseUrl: GRPC_ENDPOINTS[env.SUI_NETWORK],
			})
		}
		clientCache.set(key, client)
	}
	return client
}

export interface NameRecord {
	id?: string
	name?: string
	registrationNftId?: string
	expirationTimestampMs?: string
	targetAddress?: string
	data?: Record<string, string>
}

export async function lookupName(
	name: string,
	env: Env,
): Promise<{ record: NameRecord | null; error?: string }> {
	try {
		const client = getGrpcClient(env)
		const normalizedName = name.endsWith('.sui') ? name : `${name}.sui`

		const result = await client.nameService.lookupName({ name: normalizedName })
		const record = result.response.record

		if (!record) {
			return { record: null }
		}

		return {
			record: {
				id: record.id,
				name: record.name,
				registrationNftId: record.registrationNftId,
				expirationTimestampMs: record.expirationTimestamp?.seconds
					? String(Number(record.expirationTimestamp.seconds) * 1000)
					: undefined,
				targetAddress: record.targetAddress,
				data: record.data || {},
			},
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'gRPC lookup failed'
		return { record: null, error: message }
	}
}

export async function resolveNameViaGrpc(
	address: string,
	env: Env,
): Promise<{ name: string | null; error?: string }> {
	try {
		const client = getGrpcClient(env)
		const result = await client.nameService.reverseLookupName({ address })

		return { name: result.response.record?.name || null }
	} catch (error) {
		if (error instanceof Error && error.message === 'NOT_FOUND') {
			return { name: null }
		}
		const message = error instanceof Error ? error.message : 'gRPC reverse lookup failed'
		return { name: null, error: message }
	}
}
