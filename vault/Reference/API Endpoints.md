---
tags: [reference, api]
---

# API Endpoints

Complete list of API routes served by the gateway.

## Root Domain (`sui.ski`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/status` | Gateway status |
| GET | `/api/pricing` | Registration pricing |
| GET | `/api/resolve` | Name resolution |

## MVR Management

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/mvr/register` | Register new package |
| POST | `/api/mvr/publish-version` | Publish version |
| POST | `/api/mvr/update-metadata` | Update metadata |
| POST | `/api/mvr/transfer` | Transfer ownership |
| GET | `/api/mvr/packages/{suinsName}` | List packages |
| GET | `/api/mvr/search?q={query}` | Search packages |

## Vortex Privacy

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/vortex/info` | Protocol overview |
| GET | `/api/vortex/health` | Service health |
| GET | `/api/vortex/pools` | List privacy pools |
| GET | `/api/vortex/pools/{coinType}` | Pool details |
| GET | `/api/vortex/relayer` | Relayer info |
| GET | `/api/vortex/commitments` | Get commitments |
| POST | `/api/vortex/merkle-path` | Merkle path for proofs |
| GET | `/api/vortex/accounts` | Accounts by hashed secret |

## Wallet Session

| Method | Path | Purpose |
|--------|------|---------|
| - | `/api/wallet/*` | Wallet session CRUD |

## RPC Proxy (`rpc.sui.ski`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/` | JSON-RPC proxy (read-only) |

**Blocked methods**: `sui_executeTransactionBlock` and other write operations.
**Rate limit**: 100 requests/minute per IP.

## Related
- [[System Overview]]
- [[Handler System]]
- [[Configuration]]
