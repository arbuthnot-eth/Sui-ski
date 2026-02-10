---
tags: [architecture, resolvers]
---

# Resolver System

4 resolver files in `src/resolvers/` totaling 906 lines. These handle the core resolution logic for different content types.

## Resolvers

### SuiNS Resolver (`suins.ts`)
- Primary: Surflux gRPC for fast resolution
- Fallback: `@mysten/suins` SDK
- Resolves names to addresses, objects, and content records
- Supports forward and reverse lookup

### MVR Resolver (`mvr.ts`)
- Move Registry package lookup via on-chain registry
- Maps `@{suinsName}/{packageName}` to package addresses
- Supports versioned lookups (`/v{n}`)
- Uses MVR public endpoints (mainnet/testnet)

### Content Resolver (`content.ts`)
- **IPFS**: Gateway fallback for `ipfs-{cid}` subdomains
- **Walrus**: Blob fetching for `walrus-{blobId}` subdomains
- Content hash verification
- Automatic format detection

### RPC Resolver (`rpc.ts`)
- JSON-RPC proxy at `rpc.sui.ski`
- **Read-only**: Write operations blocked
- Rate limited: 100 requests/minute per IP
- Method allowlist enforcement

## Resolution Chain

```
Request → Parse Subdomain → Route Type?
  ├── suins  → SuiNS Resolver → Profile Handler
  ├── mvr    → MVR Resolver → Package Display
  ├── content → Content Resolver → IPFS/Walrus content
  └── rpc    → RPC Resolver → Proxied JSON-RPC
```

## Related
- [[System Overview]]
- [[Subdomain Routing]]
- [[SuiNS Integration]]
