---
tags: [architecture, core]
---

# System Overview

Sui-ski is a **Cloudflare Worker** that acts as a gateway for the Sui blockchain ecosystem. It parses incoming hostnames to determine routing, then delegates to the appropriate handler or resolver.

## Request Flow

```
Client Request
    │
    ▼
┌──────────────────┐
│  Cloudflare Edge  │
│  (DNS + Worker)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  index.ts         │  ← Entry point, subdomain parsing
│  parseSubdomain() │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼
 [root]    [suins]     [mvr]    [content]   [rpc]
 landing   profile     package   IPFS/      JSON-RPC
 page      page        page     Walrus      proxy
```

## Core Components

### Entry Point (`src/index.ts`)
- Parses hostname via [[Subdomain Routing]]
- Dispatches to appropriate handler
- Manages Hono routing framework

### [[Handler System]] (18 files, 42K lines)
- Generate HTML responses (inline, no build step)
- Handle API endpoints
- Build transactions for client-side signing

### [[Resolver System]] (4 files, 906 lines)
- SuiNS name resolution (gRPC + SDK fallback)
- MVR package lookup
- Content fetching (IPFS + Walrus)
- RPC proxy with rate limiting

### [[Utility Layer]] (28 files, 5.4K lines)
- Transaction builders
- Pricing calculations
- Caching (KV-backed)
- Response helpers

### Durable Objects
- **WalletSession** - Cross-subdomain SSO via [[Wallet Infrastructure]]

### Backend Services
- **gRPC Backend** (`backend/`) - Connection pooling, load balancing, caching
- **Proxy Service** (`proxy/`) - Vercel/Fly.io deployment

## Key Design Decisions

1. **Inline HTML generation** - No client-side framework, all HTML rendered server-side
2. **No SDK imports for large packages** - Vortex SDK (9MB) loaded client-side from CDN
3. **Transaction building** - Server builds unsigned transactions, client signs
4. **gRPC primary, SDK fallback** - Surflux gRPC for fast resolution, @mysten/suins as fallback

## File Structure

```
src/
├── index.ts              # Entry point
├── types.ts              # Shared types
├── handlers/             # 18 HTTP handlers
├── resolvers/            # 4 content resolvers
├── utils/                # 28 utility modules
├── sdk/                  # Client-side SDKs
├── workers/              # Background workers
├── durable-objects/      # Wallet sessions
└── client/               # DO client

contracts/                # 10 Move contract directories
docs/                     # 7 documentation guides
backend/                  # gRPC backend service
proxy/                    # Proxy service
```

## Related
- [[Subdomain Routing]]
- [[Handler System]]
- [[Resolver System]]
- [[Configuration]]
