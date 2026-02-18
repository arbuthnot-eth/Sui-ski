import type { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'

const TRADEPORT_V2_STORE = '0xf96f9363ac5a64c058bf7140723226804d74c0dab2dd27516fb441a180cd763b'

export interface OnChainListing {
	price: number
	seller: string
	nonce: string
	tokenId: string
}

export async function fetchListingOnChain(
	client: SuiClient,
	tokenId: string,
): Promise<OnChainListing | null> {
	try {
		const result = await client.getDynamicFieldObject({
			parentId: TRADEPORT_V2_STORE,
			name: { type: '0x2::object::ID', value: tokenId },
		})

		if (!result.data?.content || result.data.content.dataType !== 'moveObject') {
			return null
		}

		const fields = result.data.content.fields as Record<string, unknown>

		const price = Number(fields.price ?? 0)
		const seller = String(fields.seller ?? '')
		const idField = fields.id as { id?: string } | undefined
		const nonce = String(idField?.id ?? result.data.objectId ?? '')

		if (!price || !seller) return null

		return { price, seller, nonce, tokenId }
	} catch {
		return null
	}
}
