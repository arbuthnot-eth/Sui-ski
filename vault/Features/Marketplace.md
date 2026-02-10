---
tags: [feature, marketplace, nft]
---

# Marketplace Integration

Sui-ski integrates with the Tradeport indexer API for NFT marketplace functionality on profile pages.

## Status: Production

Implemented in the most recent commits (c2931c5, 7b2229a, f31c3cf).

## Capabilities

### NFT Display
- Gallery view on profile pages
- Color-coded tags by activity type
- Sold state visualization after purchase
- Price display in SUI

### Activity Tracking
Normalized activity types from Tradeport:
- **list** - NFT listed for sale
- **delist** - Listing removed
- **buy** - Direct purchase
- **accept_bid** - Bid accepted (counted as sale)

### Caching
- 60-second TTL on indexer API responses
- KV-backed via Cloudflare Workers KV
- Prevents excessive API calls to Tradeport

### Color Coding
Activity rows and NFT tags use distinct colors per activity type for at-a-glance status.

## Recent Changes

| Commit | Change |
|--------|--------|
| c2931c5 | Cache marketplace API responses (60s TTL) |
| 7b2229a | Show sold price on NFT tag, include `accept_bid` in sales |
| f31c3cf | Color-coded NFT tags and sold state after purchase |

## Files

- `src/handlers/profile.ts` - Marketplace rendering in profile pages
- `src/handlers/landing.ts` - Marketplace API endpoints
- `src/utils/cache.ts` - Caching layer

## Related
- [[SuiNS Integration]]
- [[Current Sprint]]
