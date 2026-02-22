import type { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { fetchNftEventsOnChain } from './onchain-activity'

const TRADEPORT_V2_STORE = '0xf96f9363ac5a64c058bf7140723226804d74c0dab2dd27516fb441a180cd763b'
const TRADEPORT_BIDDINGS_PACKAGE =
	'0x53134eb544c5a0b5085e99efaf7eab13b28ad123de35d61f941f8c8c40b72033'
const SINGLE_BID_TYPE = `${TRADEPORT_BIDDINGS_PACKAGE}::tradeport_biddings::SingleBid`
const GRAPHQL_URL = 'https://graphql.mainnet.sui.io/graphql'

export interface OnChainListing {
	price: number
	seller: string
	nonce: string
	tokenId: string
}

export interface OnChainBid {
	id: string
	price: number
	bidder: string
	tokenId: string
}

export async function fetchAllBidsForNft(
	client: SuiClient,
	tokenId: string,
): Promise<OnChainBid[]> {
	try {
		const bid = await fetchBestBidOnChain(client, tokenId)
		return bid ? [bid] : []
	} catch {
		return []
	}
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

async function fetchBidViaGraphQL(tokenId: string): Promise<OnChainBid | null> {
	const query = `query($type: String!, $after: String) {
		objects(filter: { type: $type }, first: 50, after: $after) {
			nodes { address asMoveObject { contents { json } } }
			pageInfo { hasNextPage endCursor }
		}
	}`
	const lowerToken = tokenId.toLowerCase()
	let after: string | null = null
	const MAX_PAGES = 20

	for (let page = 0; page < MAX_PAGES; page++) {
		const res = await fetch(GRAPHQL_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables: { type: SINGLE_BID_TYPE, after } }),
		})
		if (!res.ok) return null
		const result = (await res.json()) as {
			data?: {
				objects?: {
					nodes?: Array<{
						address: string
						asMoveObject?: { contents?: { json?: Record<string, unknown> } }
					}>
					pageInfo?: { hasNextPage: boolean; endCursor: string | null }
				}
			}
		}
		const nodes = result.data?.objects?.nodes ?? []
		for (const node of nodes) {
			const json = node.asMoveObject?.contents?.json
			if (!json) continue
			const nftId = String(json.maybe_nft_id ?? '')
			if (nftId.toLowerCase() !== lowerToken) continue
			const price = Number(json.price ?? 0)
			const bidder = String(json.buyer ?? '')
			if (!price || !bidder) continue
			return { id: node.address, price, bidder, tokenId }
		}
		const pageInfo = result.data?.objects?.pageInfo
		if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break
		after = pageInfo.endCursor
	}
	return null
}

export async function fetchBestBidOnChain(
	client: SuiClient,
	tokenId: string,
): Promise<OnChainBid | null> {
	try {
		const cancelledOrMatched = new Set<string>()
		const createEvents: { bidId: string; price: number; bidder: string; nftId: string }[] = []

		const events = await client.queryEvents({
			query: { MoveEventModule: { package: TRADEPORT_BIDDINGS_PACKAGE, module: 'tradeport_biddings' } },
			limit: 50,
			order: 'descending',
		})

		for (const evt of events.data) {
			const pj = evt.parsedJson as Record<string, unknown> | undefined
			if (!pj) continue

			const evtType = evt.type
			const bidId = String(pj.bid_id ?? '')

			if (evtType.includes('CancelSingleBid') || evtType.includes('MatchSingleBid')) {
				if (bidId) cancelledOrMatched.add(bidId)
				continue
			}

			if (evtType.includes('CreateSingleBid')) {
				const nftId = String(pj.maybe_nft_id ?? pj.nft_id ?? '')
				if (nftId.toLowerCase() !== tokenId.toLowerCase()) continue
				createEvents.push({
					bidId,
					price: Number(pj.price ?? 0),
					bidder: String(pj.buyer ?? pj.bidder ?? ''),
					nftId,
				})
			}
		}

		let best: typeof createEvents[number] | null = null
		for (const bid of createEvents) {
			if (cancelledOrMatched.has(bid.bidId)) continue
			if (!best || bid.price > best.price) best = bid
		}

		if (best) {
			const obj = await client.getObject({ id: best.bidId, options: { showContent: true } })
			if (obj.data) return { id: best.bidId, price: best.price, bidder: best.bidder, tokenId }
		}

		return fetchBidViaGraphQL(tokenId)
	} catch {
		try {
			return await fetchBidViaGraphQL(tokenId)
		} catch {
			return null
		}
	}
}

export interface OnChainSale {
	price: number
	buyer: string
	seller: string
	blockTime: string
	txHash: string
	tokenId: string
}

export async function fetchOnChainSales(
	client: SuiClient,
	tokenId: string,
	limit = 50,
): Promise<OnChainSale[]> {
	try {
		const events = await fetchNftEventsOnChain(client, tokenId, limit)
		const sales: OnChainSale[] = []
		for (const evt of events) {
			if (evt.type !== 'buy' && evt.type !== 'accept_bid') continue
			sales.push({
				price: evt.price,
				buyer: evt.receiver,
				seller: evt.sender,
				blockTime: evt.blockTime,
				txHash: evt.txId,
				tokenId,
			})
		}
		return sales
	} catch {
		return []
	}
}

export interface OnChainNftMeta {
	id: string
	name: string
	tokenId: string
	owner: string
	imageUrl: string | null
}

export async function fetchNftMetadata(
	client: SuiClient,
	tokenId: string,
): Promise<OnChainNftMeta | null> {
	try {
		const obj = await client.getObject({
			id: tokenId,
			options: { showDisplay: true, showOwner: true },
		})
		if (!obj.data) return null

		const display = obj.data.display?.data as Record<string, string> | null | undefined
		const ownerField = obj.data.owner
		let owner = ''
		if (ownerField && typeof ownerField === 'object') {
			if ('AddressOwner' in ownerField) owner = String(ownerField.AddressOwner)
			else if ('ObjectOwner' in ownerField) owner = String(ownerField.ObjectOwner)
		}

		return {
			id: obj.data.objectId,
			name: display?.name ?? '',
			tokenId,
			owner,
			imageUrl: display?.image_url ?? null,
		}
	} catch {
		return null
	}
}
