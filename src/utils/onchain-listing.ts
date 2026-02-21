import type { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { fetchNftEventsOnChain } from './onchain-activity'

const TRADEPORT_V2_STORE = '0xf96f9363ac5a64c058bf7140723226804d74c0dab2dd27516fb441a180cd763b'
const TRADEPORT_BIDDINGS_PACKAGE =
	'0x53134eb544c5a0b5085e99efaf7eab13b28ad123de35d61f941f8c8c40b72033'
const SINGLE_BID_TYPE = `${TRADEPORT_BIDDINGS_PACKAGE}::tradeport_biddings::SingleBid`
const GRAPHQL_URL = 'https://graphql.mainnet.sui.io/graphql'

const INDEXER_API_URL = 'https://api.indexer.xyz/graphql'
const INDEXER_API_USER = 'imbibed.solutions'
const SUINS_COLLECTION_ID = '060fe4fb-9a3e-4170-a494-a25e62aba689'

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

const BIDS_VIA_ACTIONS_QUERY = `query($collectionId: uuid!, $tokenId: String!, $limit: Int!) {
	sui {
		actions(
			where: {
				collection_id: { _eq: $collectionId }
				nft: { token_id: { _eq: $tokenId } }
				type: { _in: ["create_bid", "bid", "cancel_bid", "accept_bid"] }
			}
			order_by: [{ block_time: desc }, { tx_index: desc }]
			limit: $limit
		) {
			type
			price
			sender
			receiver
			nonce
			block_time
		}
	}
}`

export async function fetchBidsViaIndexer(
	tokenId: string,
	apiKey: string,
): Promise<OnChainBid[]> {
	try {
		const res = await fetch(INDEXER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-user': INDEXER_API_USER,
				'x-api-key': apiKey,
			},
			body: JSON.stringify({
				query: BIDS_VIA_ACTIONS_QUERY,
				variables: {
					collectionId: SUINS_COLLECTION_ID,
					tokenId,
					limit: 100,
				},
			}),
		})

		if (!res.ok) {
			console.log('fetchBidsViaIndexer: HTTP error', res.status)
			return []
		}

		const result = (await res.json()) as {
			data?: {
				sui?: {
					actions?: Array<{
						type: string
						price: number
						sender: string
						receiver: string
						nonce: string
						block_time: string
					}>
				}
			}
			errors?: Array<{ message: string }>
		}

		if (result.errors?.length) {
			console.log('fetchBidsViaIndexer: GQL error', result.errors[0].message)
			return []
		}

		const actions = result.data?.sui?.actions ?? []
		console.log('fetchBidsViaIndexer:', tokenId, 'actions', actions.length, actions.length > 0 ? 'types: ' + [...new Set(actions.map(a => a.type))].join(',') : '')

		const cancelledNonces = new Set<string>()
		const bidCreates: Array<{ nonce: string; price: number; bidder: string }> = []

		for (const action of actions) {
			if (action.type === 'cancel_bid' || action.type === 'accept_bid') {
				if (action.nonce) cancelledNonces.add(action.nonce)
			} else if (action.type === 'create_bid' || action.type === 'bid') {
				bidCreates.push({
					nonce: action.nonce || '',
					price: action.price,
					bidder: action.sender,
				})
			}
		}

		const bids: OnChainBid[] = []
		for (const bc of bidCreates) {
			if (bc.nonce && cancelledNonces.has(bc.nonce)) continue
			if (bc.price <= 0 || !bc.bidder) continue
			bids.push({
				id: bc.nonce || String(bc.price),
				price: bc.price,
				bidder: bc.bidder,
				tokenId,
			})
		}

		bids.sort((a, b) => b.price - a.price)
		return bids
	} catch (err) {
		console.error('Indexer bids fetch failed:', err instanceof Error ? err.message : err)
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
