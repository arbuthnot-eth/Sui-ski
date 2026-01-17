# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sui-ski is a Cloudflare Worker gateway for the Sui blockchain ecosystem. It resolves wildcard subdomains (`*.sui.ski`) to route requests to:
- **SuiNS names** - Sui Name Service resolution (e.g., `myname.sui.ski`)
- **Move Registry packages** - MVR package lookup (e.g., `core--suifrens.sui.ski`)
- **Decentralized content** - IPFS and Walrus blob resolution
- **RPC proxy** - Read-only Sui JSON-RPC endpoint at `rpc.sui.ski`

## Commands

```bash
# Install dependencies
bun install

# Development server (runs Wrangler dev with hot reload)
bun run dev

# Run tests
bun test
bun test --watch          # Watch mode
bun test src/index.test.ts  # Single file

# Type checking
bun run typecheck

# Linting and formatting (Biome)
bun run lint              # Check for issues
bun run lint:fix          # Auto-fix issues
bun run format            # Format code

# Deployment
bun run deploy            # Deploy to Cloudflare
bun run tail              # Stream live logs
```

## Architecture

```
src/
├── index.ts              # Worker entry point, request routing by subdomain type
├── types.ts              # Shared TypeScript types (Env, ParsedSubdomain, etc.)
├── handlers/
│   ├── landing.ts        # Root domain handler (sui.ski), API endpoints
│   ├── profile.ts        # SuiNS profile page with grace period support
│   ├── vortex.ts         # Vortex privacy protocol API and UI
│   ├── mvr-management.ts # MVR package management API endpoints
│   └── mvr-ui.ts         # MVR package management web UI
├── resolvers/
│   ├── suins.ts          # SuiNS name resolution using @mysten/suins SDK
│   ├── mvr.ts            # Move Registry package lookup via on-chain registry
│   ├── content.ts        # IPFS gateway fallback + Walrus blob fetching
│   └── rpc.ts            # JSON-RPC proxy with method allowlist + rate limiting
└── utils/
    ├── subdomain.ts      # Subdomain parsing logic (pattern matching)
    ├── cache.ts          # KV-backed caching utilities
    ├── response.ts       # HTTP response helpers (JSON, HTML, CORS)
    └── mvr-transactions.ts # MVR transaction builders for offline signing
```

## Subdomain Routing Patterns

The gateway parses hostnames to determine routing:

| Pattern | Route Type | Example |
|---------|------------|---------|
| `sui.ski` | root | Landing page |
| `rpc.sui.ski` | rpc | JSON-RPC proxy |
| `{name}.sui.ski` | suins | SuiNS resolution |
| `{pkg}--{name}.sui.ski` | mvr | MVR package |
| `{pkg}--{name}--v{n}.sui.ski` | mvr | MVR package version |
| `ipfs-{cid}.sui.ski` | content | Direct IPFS |
| `walrus-{blobId}.sui.ski` | content | Direct Walrus |

## Key Dependencies

- **@mysten/sui** - Sui TypeScript SDK for RPC calls
- **@mysten/suins** - SuiNS client for name resolution
- **@mysten/walrus** - Walrus client for blob storage
- **wrangler** - Cloudflare Workers CLI

Note: The Vortex SDK (`@interest-protocol/vortex-sdk`) is available in package.json but NOT imported in the worker due to its 9MB size exceeding Cloudflare's 3MB limit. The gateway proxies Vortex API requests, and the SDK should be loaded client-side from CDN.

## Environment Configuration

`wrangler.toml` defines:
- `SUI_NETWORK` - "mainnet" | "testnet" | "devnet"
- `SUI_RPC_URL` - Sui fullnode endpoint
- `WALRUS_NETWORK` - Walrus network
- `CACHE` - KV namespace binding for caching

Use `env.dev` for testnet development. Replace KV namespace IDs before deployment.

## Cloudflare DNS Setup

Required DNS records (Cloudflare dashboard):
1. `A` record: `*` → `192.0.2.0` (proxied) - dummy IP for Worker routing
2. `A` record: `@` → `192.0.2.0` (proxied) - root domain
3. Worker route: `*.sui.ski/*` → `sui-ski-gateway`
4. Worker route: `sui.ski/*` → `sui-ski-gateway`

## RPC Proxy Security

The RPC proxy at `rpc.sui.ski` only allows read-only methods. Write operations (`sui_executeTransactionBlock`, etc.) are blocked. Rate limiting is 100 requests/minute per IP.

## MVR Registry Integration

MVR names follow the format `@{suins_name}/{package_name}`. The gateway translates subdomain patterns:
- `core--suifrens.sui.ski` → `@suifrens/core`
- `nft--myname--v2.sui.ski` → `@myname/nft/2`

The MVR registry object IDs in `src/resolvers/mvr.ts` need to be updated with actual mainnet/testnet addresses.

### MVR Package Management

The gateway now includes comprehensive package management capabilities:

**Management UI** (`/mvr`):
- Web interface for package registration, versioning, and metadata updates
- Generate unsigned transactions for offline signing
- Browse and search packages

**API Endpoints**:
- `POST /api/mvr/register` - Register new package
- `POST /api/mvr/publish-version` - Publish new version
- `POST /api/mvr/update-metadata` - Update package metadata
- `POST /api/mvr/transfer` - Transfer package ownership
- `GET /api/mvr/packages/{suinsName}` - List packages for a SuiNS name
- `GET /api/mvr/search?q={query}` - Search packages

**Transaction Building** (`src/utils/mvr-transactions.ts`):
- Utilities to generate unsigned transactions for all package operations
- Support for offline signing workflows
- Transaction serialization and digest generation

See `docs/MVR_IMPROVEMENTS.md` for detailed documentation.

## Sui Transaction Building

For building Sui blockchain transactions, this project uses the `Transaction` class from `@mysten/sui/transactions`. Quick reference:

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();
const [coin] = tx.splitCoins(tx.gas, [100]);
tx.transferObjects([coin], '0xRecipientAddress');
```

See `docs/SUI_TRANSACTION_BUILDING.md` for comprehensive documentation on:
- Transaction commands (SplitCoins, MergeCoins, TransferObjects, MoveCall, Publish)
- Input types (pure values, object references, transaction results)
- Gas configuration and optimization
- Transaction serialization and offline building
- Sponsored transactions and advanced features

## Vortex Privacy Protocol Integration

The gateway integrates with [Vortex](https://github.com/interest-protocol/vortex), a privacy protocol for confidential transactions on Sui using zero-knowledge proofs.

**Architecture Note:** The Vortex SDK is ~9MB which exceeds Cloudflare's 3MB worker limit. This gateway uses a lightweight proxy approach:
- Server-side: Proxies API requests to the Vortex API (no SDK import)
- Client-side: Load the SDK from CDN for ZK proof generation in the browser

**How Vortex Works:**
- Breaks the on-chain link between deposit and withdrawal addresses
- Uses 2-input/2-output UTXO model with Groth16 proofs
- Deposits go into a shared pool; withdrawals prove note ownership without revealing source

**UI Page** (`/vortex`):
- Dashboard showing protocol status, pools, and relayer info
- Real-time health monitoring of Vortex services
- Instructions for loading the SDK client-side

**API Endpoints** (`/api/vortex/*`) - Proxy to Vortex API:
- `GET /api/vortex/info` - Protocol overview (local, no proxy)
- `GET /api/vortex/health` - Service health check
- `GET /api/vortex/pools` - List available privacy pools
- `GET /api/vortex/pools/{coinType}` - Get pool details
- `GET /api/vortex/relayer` - Get relayer information
- `GET /api/vortex/commitments?coinType=...&index=0` - Get commitments
- `POST /api/vortex/merkle-path` - Get merkle path for proof generation
- `GET /api/vortex/accounts?hashedSecret=...` - Get accounts by hashed secret

**Client-Side SDK Usage:**
```html
<!-- Load SDK from CDN in browser -->
<script src="https://unpkg.com/@interest-protocol/vortex-sdk"></script>
<script>
  // All ZK proof generation happens client-side for privacy
  const { VortexAPI, Vortex } = window.VortexSDK;
  const api = new VortexAPI({ apiUrl: '/api/vortex' }); // Use gateway proxy
</script>
```
