import type { SuiGraphQLClient } from '@mysten/sui/graphql'
import type { SuiGrpcClient } from '@mysten/sui/grpc'
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { fetchNftEventsOnChain } from './onchain-activity'
import {
	graphqlGetDynamicField,
	graphqlGetObject,
	grpcGetDynamicObjectField,
	raceQueryEvents,
	raceTransports,
	rpcGetDynamicObjectField,
} from './sui-graphql'

const TRADEPORT_V2_STORE = '0xf96f9363ac5a64c058bf7140723226804d74c0dab2dd27516fb441a180cd763b'
const TRADEPORT_BIDDINGS_PACKAGE =
	'0x53134eb544c5a0b5085e99efaf7eab13b28ad123de35d61f941f8c8c40b72033'
const SINGLE_BID_TYPE = `${TRADEPORT_BIDDINGS_PACKAGE}::tradeport_biddings::SingleBid`

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
	client: SuiGraphQLClient,
	tokenId: string,
	rpcClient?: SuiJsonRpcClient,
): Promise<OnChainBid[]> {
	try {
		const bid = await fetchBestBidOnChain(client, tokenId, rpcClient)
		return bid ? [bid] : []
	} catch {
		return []
	}
}

export async function fetchListingOnChain(
	client: SuiGraphQLClient,
	tokenId: string,
	grpcClient?: SuiGrpcClient,
	rpcClient?: SuiJsonRpcClient,
): Promise<OnChainListing | null> {
	try {
		const name = { type: '0x2::object::ID', value: tokenId }
		const calls: Array<() => Promise<import('./sui-graphql').LegacyDynamicFieldObject>> = []

		if (grpcClient) {
			calls.push(() => grpcGetDynamicObjectField(grpcClient, TRADEPORT_V2_STORE, name))
		}
		calls.push(() => graphqlGetDynamicField(client, TRADEPORT_V2_STORE, name))
		if (rpcClient) {
			calls.push(() => rpcGetDynamicObjectField(rpcClient, TRADEPORT_V2_STORE, name))
		}

		const result = await raceTransports(calls)

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
	} catch (e) {
		console.error(
			'[fetchListingOnChain] failed for',
			tokenId,
			':',
			e instanceof Error ? e.message : e,
		)
		return null
	}
}

async function fetchBidViaGraphQL(
	client: SuiGraphQLClient,
	tokenId: string,
): Promise<OnChainBid | null> {
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
		const res = await client.query({
			query,
			variables: { type: SINGLE_BID_TYPE, after },
		})
		const rawData = res.data as Record<string, unknown>
		const objects = rawData?.objects as
			| {
					nodes?: Array<{
						address: string
						asMoveObject?: { contents?: { json?: Record<string, unknown> } }
					}>
					pageInfo?: { hasNextPage: boolean; endCursor: string | null }
			  }
			| undefined
		const nodes = objects?.nodes ?? []
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
		const pageInfo = objects?.pageInfo
		if (!pageInfo?.hasNextPage || !pageInfo.endCursor) break
		after = pageInfo.endCursor
	}
	return null
}

export async function fetchBestBidOnChain(
	client: SuiGraphQLClient,
	tokenId: string,
	rpcClient?: SuiJsonRpcClient,
): Promise<OnChainBid | null> {
	try {
		const cancelledOrMatched = new Set<string>()
		const createEvents: { bidId: string; price: number; bidder: string; nftId: string }[] = []

		const events = await raceQueryEvents(
			client,
			{ MoveEventModule: { package: TRADEPORT_BIDDINGS_PACKAGE, module: 'tradeport_biddings' } },
			{ limit: 50 },
			rpcClient,
		)

		for (const evt of events.data) {
			const pj = evt.parsedJson
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

		let best: (typeof createEvents)[number] | null = null
		for (const bid of createEvents) {
			if (cancelledOrMatched.has(bid.bidId)) continue
			if (!best || bid.price > best.price) best = bid
		}

		if (best) {
			const obj = await graphqlGetObject(client, best.bidId)
			if (obj.data) return { id: best.bidId, price: best.price, bidder: best.bidder, tokenId }
		}

		return fetchBidViaGraphQL(client, tokenId)
	} catch {
		try {
			return await fetchBidViaGraphQL(client, tokenId)
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
	client: SuiGraphQLClient,
	tokenId: string,
	limit = 50,
	rpcClient?: SuiJsonRpcClient,
): Promise<OnChainSale[]> {
	try {
		const events = await fetchNftEventsOnChain(client, tokenId, limit, rpcClient)
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
	client: SuiGraphQLClient,
	tokenId: string,
	rpcClient?: SuiJsonRpcClient,
	grpcClient?: SuiGrpcClient,
): Promise<OnChainNftMeta | null> {
	try {
		const obj = await graphqlGetObject(
			client,
			tokenId,
			{ showOwner: true, showContent: true, showDisplay: true },
			rpcClient,
			grpcClient,
		)
		if (!obj.data) return null

		const ownerField = obj.data.owner
		let owner = ''
		if (ownerField && typeof ownerField === 'object') {
			if ('AddressOwner' in ownerField) {
				owner = String(ownerField.AddressOwner)
			} else if ('ObjectOwner' in ownerField) {
				// Walk up the ObjectOwner chain (DynamicField → Listing → Kiosk) to find the human
				let currentId = String(ownerField.ObjectOwner)
				try {
					for (let depth = 0; depth < 4; depth++) {
						const parentObj = await graphqlGetObject(
							client,
							currentId,
							undefined,
							rpcClient,
							grpcClient,
						)
						if (!parentObj.data) break
						const parentOwner = parentObj.data.owner
						if (parentOwner?.AddressOwner) {
							owner = parentOwner.AddressOwner
							break
						}
						const pf = parentObj.data.content?.fields as Record<string, unknown> | undefined
						if (pf?.seller && typeof pf.seller === 'string') {
							owner = pf.seller
							break
						}
						if (pf?.owner && typeof pf.owner === 'string') {
							owner = pf.owner
							break
						}
						if (parentOwner?.ObjectOwner) {
							currentId = parentOwner.ObjectOwner
							continue
						}
						break
					}
				} catch {
					/* fall through */
				}
				if (!owner) owner = String(ownerField.ObjectOwner)
			}
		}

		const display = obj.data.display
		const fields = obj.data.content?.fields as Record<string, unknown> | undefined
		const name = display?.name ?? (fields?.domain_name as string) ?? ''
		const imageUrl =
			display?.image_url ??
			(fields?.domain_name
				? `https://api-mainnet.suins.io/nfts/${fields.domain_name}/${fields.expiration_timestamp_ms}`
				: null)

		return {
			id: obj.data.objectId,
			name,
			tokenId,
			owner,
			imageUrl,
		}
	} catch {
		return null
	}
}
