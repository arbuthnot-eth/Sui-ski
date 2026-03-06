import type { SuiGraphQLClient } from '@mysten/sui/graphql'
import type { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'
import { type LegacyEvent, raceQueryEvents } from './sui-graphql'

// Runtime module address (different from package object ID due to upgrade)
const TRADEPORT_LISTINGS_PACKAGE =
	'0xff2251ea99230ed1cbe3a347a209352711c6723fcdcd9286e16636e65bb55cab'
const TRADEPORT_BIDDINGS_PACKAGE =
	'0x53134eb544c5a0b5085e99efaf7eab13b28ad123de35d61f941f8c8c40b72033'

export interface OnChainNftActivity {
	id: string
	type: string
	price: number
	priceCoin: string
	sender: string
	receiver: string
	txId: string
	blockTime: string
	marketName: string
	boughtOnTradeport: boolean
	liquidBridgeId: string | null
	nonce: string | null
	listingNonce: string | null
}

export interface OnChainCollectionActivity {
	actionId: string
	type: string
	price: number
	priceSui: number
	usdPrice: number | null
	priceCoin: string | null
	sender: string
	receiver: string
	txId: string
	blockTimeMs: number
	marketName: string
	nftTokenId: string
	nftName: string
	nftOwner: string
	tradeportUrl: string
}

function parseEventToNftActivity(
	evt: LegacyEvent,
	tokenIdFilter: string,
): OnChainNftActivity | null {
	const pj = evt.parsedJson
	if (!pj) return null

	const evtTokenId = String(pj.nft_id ?? pj.maybe_nft_id ?? pj.token_id ?? '')
	if (tokenIdFilter && evtTokenId.toLowerCase() !== tokenIdFilter.toLowerCase()) return null

	const evtType =
		evt.type.includes('Buy') || evt.type.includes('buy')
			? 'buy'
			: evt.type.includes('List') || evt.type.includes('list')
				? 'list'
				: evt.type.includes('Delist') ||
						evt.type.includes('delist') ||
						evt.type.includes('Cancel') ||
						evt.type.includes('cancel')
					? 'delist'
					: evt.type.includes('Bid') || evt.type.includes('bid')
						? 'bid'
						: evt.type.includes('Accept') || evt.type.includes('accept')
							? 'accept_bid'
							: 'unknown'

	const price = Number(pj.price ?? 0)
	const timestamp = evt.timestampMs ? new Date(Number(evt.timestampMs)).toISOString() : ''

	return {
		id: `${evt.id.txDigest}-${evt.id.eventSeq}`,
		type: evtType,
		price,
		priceCoin: '0x2::sui::SUI',
		sender: String(pj.seller ?? pj.sender ?? ''),
		receiver: String(pj.buyer ?? pj.receiver ?? ''),
		txId: evt.id.txDigest,
		blockTime: timestamp,
		marketName: 'tradeport',
		boughtOnTradeport: true,
		liquidBridgeId: null,
		nonce: String(pj.nonce ?? ''),
		listingNonce: null,
	}
}

function parseEventToCollectionActivity(evt: LegacyEvent): OnChainCollectionActivity | null {
	const pj = evt.parsedJson
	if (!pj) return null

	const nftTokenId = String(pj.nft_id ?? pj.maybe_nft_id ?? pj.token_id ?? '')
	if (!nftTokenId) return null

	const evtType =
		evt.type.includes('Buy') || evt.type.includes('buy')
			? 'buy'
			: evt.type.includes('Accept') || evt.type.includes('accept')
				? 'accept_bid'
				: evt.type.includes('List') || evt.type.includes('list')
					? 'list'
					: evt.type.includes('Delist') ||
							evt.type.includes('delist') ||
							evt.type.includes('Cancel') ||
							evt.type.includes('cancel')
						? 'delist'
						: evt.type.includes('Bid') || evt.type.includes('bid')
							? 'bid'
							: 'unknown'

	const price = Number(pj.price ?? 0)
	const timestampMs = evt.timestampMs ? Number(evt.timestampMs) : 0

	return {
		actionId: `${evt.id.txDigest}-${evt.id.eventSeq}`,
		type: evtType,
		price,
		priceSui: price / 1e9,
		usdPrice: null,
		priceCoin: '0x2::sui::SUI',
		sender: String(pj.seller ?? pj.sender ?? ''),
		receiver: String(pj.buyer ?? pj.receiver ?? ''),
		txId: evt.id.txDigest,
		blockTimeMs: timestampMs,
		marketName: 'tradeport',
		nftTokenId,
		nftName: String(pj.nft_name ?? pj.name ?? nftTokenId),
		nftOwner: String(pj.buyer ?? pj.receiver ?? pj.seller ?? ''),
		tradeportUrl: `https://www.tradeport.xyz/sui/collection/suins/${nftTokenId}`,
	}
}

export async function fetchNftEventsOnChain(
	client: SuiGraphQLClient,
	tokenId: string,
	limit = 500,
	rpcClient?: SuiJsonRpcClient,
): Promise<OnChainNftActivity[]> {
	const activities: OnChainNftActivity[] = []

	const [listingEvents, biddingEvents] = await Promise.all([
		raceQueryEvents(
			client,
			{ MoveEventModule: { package: TRADEPORT_LISTINGS_PACKAGE, module: 'tradeport_listings' } },
			{ limit },
			rpcClient,
		),
		raceQueryEvents(
			client,
			{ MoveEventModule: { package: TRADEPORT_BIDDINGS_PACKAGE, module: 'tradeport_biddings' } },
			{ limit },
			rpcClient,
		),
	])

	const allEvents = [...listingEvents.data, ...biddingEvents.data]
	for (const evt of allEvents) {
		const activity = parseEventToNftActivity(evt, tokenId)
		if (activity) activities.push(activity)
	}

	activities.sort((a, b) => (b.blockTime > a.blockTime ? 1 : b.blockTime < a.blockTime ? -1 : 0))
	return activities
}

export async function fetchCollectionEventsOnChain(
	client: SuiGraphQLClient,
	limit = 1000,
	rpcClient?: SuiJsonRpcClient,
): Promise<OnChainCollectionActivity[]> {
	const activities: OnChainCollectionActivity[] = []
	const pageSize = Math.min(limit, 200)
	let remaining = limit
	let cursor: string | null = null

	while (remaining > 0) {
		const batchSize = Math.min(remaining, pageSize)
		const [listingEvents, biddingEvents]: [
			Awaited<ReturnType<typeof raceQueryEvents>>,
			Awaited<ReturnType<typeof raceQueryEvents>>,
		] = await Promise.all([
			raceQueryEvents(
				client,
				{
					MoveEventModule: {
						package: TRADEPORT_LISTINGS_PACKAGE,
						module: 'tradeport_listings',
					},
				},
				{ limit: batchSize, cursor },
				rpcClient,
			),
			raceQueryEvents(
				client,
				{
					MoveEventModule: {
						package: TRADEPORT_BIDDINGS_PACKAGE,
						module: 'tradeport_biddings',
					},
				},
				{ limit: batchSize, cursor },
				rpcClient,
			),
		])

		const allEvents = [...listingEvents.data, ...biddingEvents.data]
		if (allEvents.length === 0) break

		for (const evt of allEvents) {
			const activity = parseEventToCollectionActivity(evt)
			if (activity) activities.push(activity)
		}

		remaining -= allEvents.length
		if (!listingEvents.hasNextPage && !biddingEvents.hasNextPage) break
		cursor = listingEvents.nextCursor ?? biddingEvents.nextCursor ?? null
		if (!cursor) break
	}

	activities.sort((a, b) => b.blockTimeMs - a.blockTimeMs)
	return activities
}
