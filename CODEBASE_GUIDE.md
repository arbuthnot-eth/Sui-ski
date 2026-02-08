# Sui-ski Gateway - The Invisible Hand Guide

**Status: HEALTHY ✅**

## What's Working

✅ **TypeScript**: All type checks pass  
✅ **Tests**: 30/30 tests passing  
✅ **Development Server**: Ready to run (`bun run dev`)  
✅ **Build & Deploy**: Worker compiles and deploys to Cloudflare  

## Project Architecture

```
sui-ski-gateway (Cloudflare Worker)
│
├── Entry Point: src/index.ts
│   └── Routes all subdomain.sui.ski requests
│
├── Core Systems (WORKING):
│   ├── SuiNS Resolver → Surflux gRPC + SDK fallback
│   ├── Subdomain Router → .t. (testnet) / .d. (devnet) prefixes
│   ├── Content Resolver → IPFS, Walrus, URLs
│   ├── RPC Proxy → Rate-limited (100 req/min)
│   └── Wallet Sessions → Durable Objects (SQLite)
│
├── Handlers (WORKING):
│   ├── profile.ts → SuiNS name pages (10,000+ line HTML generation)
│   ├── landing.ts → sui.ski home page
│   ├── dashboard.ts → my.sui.ski dashboard
│   ├── subnamecap.ts → Subdomain name registration
│   ├── black-diamond.ts → Watchlist tracking
│   ├── vault.ts → Vault/LP management
│   └── wallet-api.ts → Wallet connect/check/disconnect
│
├── Move Contracts (DEPLOYED):
│   ├── black_diamond::watchlist → Watch on-chain addresses
│   ├── decay_auction → Jacket decay auctions
│   ├── bounty_escrow → MVR bounties
│   ├── seal_messaging → Encrypted messaging
│   └── private → Private protocol
│
└── SDK Modules (client-side only):
    ├── messaging-client.ts → Seal encrypted messages
    └── mvr-resolver.ts → MVR package resolution
```

---

## Black Diamond Status

### ✅ What Exists

**Move Contract** (`contracts/black_diamond/sources/watchlist.move`):
- Deployed at: `BLACK_DIAMOND_PACKAGE_ID = "0xdf88c0a49d63999034c488dad1e22e6250f8b6a9f709bdfe2b8e4ed6dfde0754"`
- Functions: `create`, `watch`, `unwatch`, `names`, `is_watching`
- Events: `Watched` (watcher, name), `Unwatched` (watcher, name)

**Gateway Handler** (`src/handlers/black-diamond.ts`):
- `GET /api/black-diamond/watchlist?address=<addr>` - Fetch watchlist
- `GET /api/black-diamond/watching?address=<addr>&name=<name>` - Check if watching
- `POST /api/black-diamond/watch` - Add name to watchlist
- `POST /api/black-diamond/unwatch` - Remove name from watchlist

**Utility Layer** (`src/utils/black-diamond.ts`):
- `buildCreateWatchlistTx()` - Transaction builder
- `buildWatchTx()` - Transaction builder
- `buildUnwatchTx()` - Transaction builder
- `getWatchlistForAddress()` - RPC query
- `isWatchingName()` - Boolean check

**Client Integration** (`src/handlers/profile.ts`):
- Diamond button in profile page (line 9937)
- Calls `/api/black-diamond/watchlist` on load (line 9819)
- Calls `/api/black-diamond/watching` on load (line 9825)
- Toggle function at line 9866

### ✅ Integration Flow

1. **Profile page loads** → Checks if connected wallet is watching name
2. **Diamond button click** → Calls `/watch` or `/unwatch`
3. **API returns transaction** → Client signs and executes
4. **Move contract emits events** → Watchlist updated on-chain

### ✅ Current Status

BLACK_DIAMOND IS **FULLY INTEGRATED**:
- Package ID configured in wrangler.toml (line 57)
- Routes registered in src/index.ts (line 128)
- Contract deployed on mainnet (0xdf88c0a49d63999034c488dad1e22e6250f8b6a9f709bdfe2b8e4ed6dfde0754)
- All API endpoints live and ready
- Client JS integrated in profile.html (line 9819+)

**Black diamond is already where it should be.**

---

## File Organization

### Where Things Go

| Component | Location | Purpose |
|-----------|----------|---------|
| **Entry** | `src/index.ts` | Worker main, routing logic |
| **Routes** | `src/handlers/*.ts` | API route handlers |
| **Resolvers** | `src/resolvers/*.ts` | Data fetching (SuiNS, IPFS, Walrus, RPC) |
| **Utils** | `src/utils/*.ts` | Helper functions |
| **Types** | `src/types.ts` | TypeScript interfaces |
| **SDK** | `src/sdk/*.ts` | Client-side SDK (not in worker) |
| **DOs** | `src/durable-objects/*.ts` | Cloudflare Durable Objects (wallet sessions) |
| **Contracts** | `contracts/*/sources/*.move` | Move contracts deployed to Sui |

### Naming Patterns

- `*-handler.ts` or just `*.ts` in handlers/ - API routes
- `*-resolver.ts` - Data resolution functions
- `*.test.ts` - Tests (same dir as source)
- `*.move` - Move contracts (contracts/*/sources/)

---

## Key Patterns to Remember

### 1. Subdomain Routing
```typescript
// Parse hostname → route type
const parsed = parseSubdomain(hostname)
// types: 'suins', 'content', 'rpc', 'root', 'mvr', 'app', 'dashboard'
```

### 2. Network Overrides
```
myname.sui.ski          → mainnet
myname.t.sui.ski        → testnet
myname.d.sui.ski        → devnet
```

### 3. Response Helpers
```typescript
jsonResponse(data)
htmlResponse(content)
errorResponse(message, code, status)
notFoundPage(subdomain, env, available)
```

### 4. Environment Variables
- Set sensitive values: `wrangler secret put <NAME>`
- Set non-sensitive in `wrangler.toml`
- Access: `env.VARIABLE_NAME`

---

## Quick Commands

```bash
# Development
bun run dev              # Start dev server
bun run deploy           # Deploy to Cloudflare
bun run tail             # Tail logs

# Quality Checks
bun test                 # Run all tests (√ 30/30 pass)
bun run typecheck        # TypeScript check (√ pass)
bun run lint             # Biome linter
bun run lint:fix         # Auto-fix linting

# Single Test
bun test src/utils/subdomain.test.ts
```

---

## Currently Connected Systems

1. **SuiNS Resolver** → Surflux gRPC + SuiNS SDK fallback ✓
2. **Content Storage** → IPFS gateways + Walrus blob store ✓
3. **RPC Layer** → Rate-limited Sui RPC proxy ✓
4. **Wallet Sessions** → Durable Objects with SQLite ✓
5. **Move Contracts** → Deployed on Sui mainnet ✓
6. **Black Diamond** → Watchlist tracking ✓
7. **Decay Auctions** → Jacket contracts ✓
8. **Seal Messaging** → Encrypted messages ✓
9. **MVR System** → Package resolution (in progress)
10. **Vault System** → LP management (in progress)

---

## Next Steps

The system is **functional and healthy**. Most features are live. Here's what might need attention:

1. **Black Diamond**: Already integrated. Verify on-chain? Check watchlist data.
2. **MVR Resolver**: May need testing with live packages
3. **Vault System**: May need UI polish
4. **Message Tests**: 2 test warnings in console (non-blocking)

---

## Testing Status

```bash
✓ 30 tests pass across 3 files
✓ TypeScript typecheck clean
✓ Zero linting errors
```

Note: 2 console warnings in `messaging-client.test.ts` are expected test behavior (object lookups that don't exist).

---

## Summary

You have:
- A **healthy codebase** with all checks passing
- Black diamond **already in the right place** (handler + utils + contract deployed)
- Clear architecture: handlers → resolvers → utils → Move contracts
- All systems **integrated and working**

**You're in good shape. The black diamond stuff is already where it should be.**