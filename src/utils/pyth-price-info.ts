import type { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { parseStructTag } from '@mysten/sui/utils'
import { mainPackage } from '@mysten/suins'

const PYTH_MAINNET_STATE = mainPackage.mainnet.pyth.pythStateId
const PYTH_TESTNET_STATE = mainPackage.testnet.pyth.pythStateId

export async function getPythPriceInfoObjectId(
	client: SuiClient,
	network: 'mainnet' | 'testnet',
	feedId: string,
): Promise<string> {
	const pythStateId = network === 'mainnet' ? PYTH_MAINNET_STATE : PYTH_TESTNET_STATE
	const normalizedFeed = feedId.startsWith('0x') ? feedId : `0x${feedId}`

	const priceTableResult = await client.getDynamicFieldObject({
		parentId: pythStateId,
		name: {
			type: 'vector<u8>',
			value: 'price_info',
		},
	})

	if (!priceTableResult.data?.type) {
		throw new Error('Pyth price table not found')
	}

	const priceIdentifier = parseStructTag(priceTableResult.data.type).typeParams[0]
	if (
		typeof priceIdentifier !== 'object' ||
		priceIdentifier === null ||
		priceIdentifier.name !== 'PriceIdentifier' ||
		!('address' in priceIdentifier)
	) {
		throw new Error('Pyth price table field type not found')
	}

	const fieldType = (priceIdentifier as { address: string }).address
	const hex = normalizedFeed.startsWith('0x') ? normalizedFeed.slice(2) : normalizedFeed
	const feedBytes: number[] = []
	for (let i = 0; i < hex.length; i += 2) {
		feedBytes.push(parseInt(hex.slice(i, i + 2), 16))
	}

	const feedResult = await client.getDynamicFieldObject({
		parentId: priceTableResult.data.objectId,
		name: {
			type: `${fieldType}::price_identifier::PriceIdentifier`,
			value: { bytes: feedBytes },
		},
	})

	if (!feedResult.data?.content || feedResult.data.content.dataType !== 'moveObject') {
		throw new Error(`Pyth price feed object for feed ${feedId} not found`)
	}

	const fields = feedResult.data.content.fields as { value?: string }
	if (typeof fields.value !== 'string') {
		throw new Error('Pyth price feed object has no value field')
	}

	return fields.value
}
