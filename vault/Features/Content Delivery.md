---
tags: [feature, ipfs, walrus, storage]
---

# Content Delivery

Sui-ski serves decentralized content from IPFS and Walrus via dedicated subdomain patterns.

## IPFS Gateway

- Pattern: `ipfs-{cid}.sui.ski`
- Fetches content from IPFS gateways
- Automatic fallback across multiple gateways
- Content type detection

## Walrus Blob Storage

- Pattern: `walrus-{blobId}.sui.ski`
- Fetches blobs from Walrus network
- Uses `@mysten/walrus` SDK
- Red Stuff 2D erasure coding for reliability

## SuiNS Content Records

SuiNS names can set content records pointing to:
- IPFS CIDs
- Walrus blob IDs
- External URLs

When a SuiNS name has a content record, the profile page can serve that content directly.

## Files

- `src/resolvers/content.ts` - Content resolution logic
- Configuration in `wrangler.toml`:
  - `WALRUS_NETWORK` - walrus network target

## Related
- [[Resolver System]]
- [[SuiNS Integration]]
- [[Subdomain Routing]]
