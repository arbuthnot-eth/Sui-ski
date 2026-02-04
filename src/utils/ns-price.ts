import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import type { Env } from '../types'
import { cacheKey, getCached, setCache } from './cache'

export interface NSPriceResult {
	nsPerSui: number
	suiPerNs: number
	source: 'deepbook' | 'fallback'
	poolAddress: string | null
	timestamp: number
}

export const NS_TOKEN = {
	mainnet: '0x5145494a5f5100e645e4b797a6eeafa55fc0e089d400be81a68c0e8f952f9a39',
	testnet: null,
} as const

export const SUI_TYPE = '0x2::sui::SUI'
export const NS_TYPE_MAINNET =
	'0x5145494a5f5100e645e4b797a6eeafa55fc0e089d400be81a68c0e8f952f9a39::ns::NS'

export const DEEPBOOK_NS_SUI_POOL = {
	mainnet: '0x27c4fdb3b846aa3ae4a65ef5127a309aa3c1f466671471a806d8912a18b253e8',
	testnet: null,
} as const

export const DEEPBOOK_PACKAGE = {
	mainnet: '0x2c8d603bc51326b8c13cef9dd07031a408a48dddb541963357f37f78afea41c3',
	testnet: null,
} as const

const CLOCK_OBJECT = '0x6'

const NS_PRICE_CACHE_TTL = 30
const FALLBACK_NS_PER_SUI = 10
const DEFAULT_SLIPPAGE_BPS = 100

const PRICE_DECIMALS = 6

export async function getNSSuiPrice(env: Env): Promise<NSPriceResult> {
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const poolAddress = DEEPBOOK_NS_SUI_POOL[network]
	const deepbookPackage = DEEPBOOK_PACKAGE[network]

	const key = cacheKey('ns-sui-price', network)
	const cached = await getCached<NSPriceResult>(env, key)
	if (cached) {
		return cached
	}

	if (!poolAddress || !deepbookPackage) {
		return createFallbackResult()
	}

	try {
		const client = new SuiClient({ url: env.SUI_RPC_URL })
		const midPrice = await queryDeepBookMidPrice(client, poolAddress, deepbookPackage)

		if (midPrice === null || midPrice <= 0) {
			return createFallbackResult()
		}

		const nsPerSui = 1 / midPrice
		const suiPerNs = midPrice

		if (!Number.isFinite(nsPerSui) || nsPerSui <= 0) {
			return createFallbackResult()
		}

		const result: NSPriceResult = {
			nsPerSui,
			suiPerNs,
			source: 'deepbook',
			poolAddress,
			timestamp: Date.now(),
		}

		await setCache(env, key, result, NS_PRICE_CACHE_TTL)
		return result
	} catch (error) {
		console.error('Failed to fetch NS/SUI price from DeepBook pool:', error)
		return createFallbackResult()
	}
}

async function queryDeepBookMidPrice(
	client: SuiClient,
	poolAddress: string,
	deepbookPackage: string,
): Promise<number | null> {
	try {
		const tx = new Transaction()

		tx.moveCall({
			target: `${deepbookPackage}::pool::mid_price`,
			typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
			arguments: [tx.object(poolAddress), tx.object(CLOCK_OBJECT)],
		})

		const result = await client.devInspectTransactionBlock({
			sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
			transactionBlock: tx,
		})

		if (result.results && result.results[0]?.returnValues?.[0]) {
			const [rawBytes] = result.results[0].returnValues[0]

			if (rawBytes && rawBytes.length > 0) {
				let rawPrice = 0n
				for (let i = rawBytes.length - 1; i >= 0; i--) {
					rawPrice = (rawPrice << 8n) | BigInt(rawBytes[i])
				}

				const price = Number(rawPrice) / 10 ** PRICE_DECIMALS

				if (Number.isFinite(price) && price > 0) {
					return price
				}
			}
		}

		return null
	} catch (error) {
		console.error('Error querying DeepBook mid_price:', error)
		return null
	}
}

function createFallbackResult(): NSPriceResult {
	return {
		nsPerSui: FALLBACK_NS_PER_SUI,
		suiPerNs: 1 / FALLBACK_NS_PER_SUI,
		source: 'fallback',
		poolAddress: null,
		timestamp: Date.now(),
	}
}

export async function convertSuiToNs(suiAmount: bigint, env: Env): Promise<bigint> {
	const price = await getNSSuiPrice(env)
	return BigInt(Math.ceil(Number(suiAmount) * price.nsPerSui))
}

export async function convertNsToSui(nsAmount: bigint, env: Env): Promise<bigint> {
	const price = await getNSSuiPrice(env)
	return BigInt(Math.ceil(Number(nsAmount) * price.suiPerNs))
}

export { DEFAULT_SLIPPAGE_BPS }
