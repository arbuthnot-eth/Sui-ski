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
│   └── landing.ts        # Root domain handler (sui.ski), API endpoints
├── resolvers/
│   ├── suins.ts          # SuiNS name resolution using @mysten/suins SDK
│   ├── mvr.ts            # Move Registry package lookup via on-chain registry
│   ├── content.ts        # IPFS gateway fallback + Walrus blob fetching
│   └── rpc.ts            # JSON-RPC proxy with method allowlist + rate limiting
└── utils/
    ├── subdomain.ts      # Subdomain parsing logic (pattern matching)
    ├── cache.ts          # KV-backed caching utilities
    └── response.ts       # HTTP response helpers (JSON, HTML, CORS)
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
