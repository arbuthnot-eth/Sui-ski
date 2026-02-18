import type { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'

const TRADEPORT_LISTINGS_PACKAGE =
	'0x6cfe7388ccf732432906d7faebcc33fd91e11d4c2f8cb3ae0082b8d3269e3d5b'
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
	evt: { id: { txDigest: string; eventSeq: string }; type: string; parsedJson: Record<string, unknown>; timestampMs?: string },
	tokenIdFilter: string,
): OnChainNftActivity | null {
	const pj = evt.parsedJson
	if (!pj) return null

	const evtTokenId = String(pj.nft_id ?? pj.maybe_nft_id ?? pj.token_id ?? '')
	if (tokenIdFilter && evtTokenId.toLowerCase() !== tokenIdFilter.toLowerCase()) return null

	const evtType = evt.type.includes('Buy') || evt.type.includes('buy')
		? 'buy'
		: evt.type.includes('List') || evt.type.includes('list')
			? 'list'
			: evt.type.includes('Delist') || evt.type.includes('delist') || evt.type.includes('Cancel') || evt.type.includes('cancel')
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

function parseEventToCollectionActivity(
	evt: { id: { txDigest: string; eventSeq: string }; type: string; parsedJson: Record<string, unknown>; timestampMs?: string },
): OnChainCollectionActivity | null {
	const pj = evt.parsedJson
	if (!pj) return null

	const nftTokenId = String(pj.nft_id ?? pj.maybe_nft_id ?? pj.token_id ?? '')
	if (!nftTokenId) return null

	const evtType = evt.type.includes('Buy') || evt.type.includes('buy')
		? 'buy'
		: evt.type.includes('Accept') || evt.type.includes('accept')
			? 'accept_bid'
			: evt.type.includes('List') || evt.type.includes('list')
				? 'list'
				: evt.type.includes('Delist') || evt.type.includes('delist') || evt.type.includes('Cancel') || evt.type.includes('cancel')
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

type SuiEvent = {
	id: { txDigest: string; eventSeq: string }
	type: string
	parsedJson: Record<string, unknown>
	timestampMs?: string
}

export async function fetchNftEventsOnChain(
	client: SuiClient,
	tokenId: string,
	limit = 200,
): Promise<OnChainNftActivity[]> {
	const activities: OnChainNftActivity[] = []

	const [listingEvents, biddingEvents] = await Promise.all([
		client.queryEvents({
			query: { MoveEventModule: { package: TRADEPORT_LISTINGS_PACKAGE, module: 'tradeport_listings' } },
			limit,
			order: 'descending',
		}),
		client.queryEvents({
			query: { MoveEventModule: { package: TRADEPORT_BIDDINGS_PACKAGE, module: 'tradeport_biddings' } },
			limit,
			order: 'descending',
		}),
	])

	const allEvents = [...listingEvents.data, ...biddingEvents.data] as SuiEvent[]
	for (const evt of allEvents) {
		const activity = parseEventToNftActivity(evt, tokenId)
		if (activity) activities.push(activity)
	}

	activities.sort((a, b) => (b.blockTime > a.blockTime ? 1 : b.blockTime < a.blockTime ? -1 : 0))
	return activities
}

export async function fetchCollectionEventsOnChain(
	client: SuiClient,
	limit = 1000,
): Promise<OnChainCollectionActivity[]> {
	const activities: OnChainCollectionActivity[] = []
	const pageSize = Math.min(limit, 200)
	let remaining = limit

	let cursor: { txDigest: string; eventSeq: string } | null = null

	while (remaining > 0) {
		const batchSize = Math.min(remaining, pageSize)
		const [listingEvents, biddingEvents] = await Promise.all([
			client.queryEvents({
				query: { MoveEventModule: { package: TRADEPORT_LISTINGS_PACKAGE, module: 'tradeport_listings' } },
				limit: batchSize,
				order: 'descending',
				cursor: cursor ?? undefined,
			}),
			client.queryEvents({
				query: { MoveEventModule: { package: TRADEPORT_BIDDINGS_PACKAGE, module: 'tradeport_biddings' } },
				limit: batchSize,
				order: 'descending',
				cursor: cursor ?? undefined,
			}),
		])

		const allEvents = [...listingEvents.data, ...biddingEvents.data] as SuiEvent[]
		if (allEvents.length === 0) break

		for (const evt of allEvents) {
			const activity = parseEventToCollectionActivity(evt)
			if (activity) activities.push(activity)
		}

		remaining -= allEvents.length
		if (!listingEvents.hasNextPage && !biddingEvents.hasNextPage) break
		if (listingEvents.data.length > 0) {
			const last = listingEvents.data[listingEvents.data.length - 1]
			cursor = last.id as { txDigest: string; eventSeq: string }
		} else {
			break
		}
	}

	activities.sort((a, b) => b.blockTimeMs - a.blockTimeMs)
	return activities
}
