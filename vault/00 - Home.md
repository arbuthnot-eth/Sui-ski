---
aliases: [Dashboard, Index, Home]
tags: [home, navigation]
---

# Sui-ski Project Vault

> Cloudflare Worker gateway for the Sui blockchain ecosystem.
> Resolves wildcard subdomains (`*.sui.ski`) to route requests to SuiNS names, Move Registry packages, decentralized content, and more.

---

## X402 Payment Protocol (Coinbase Open Standard)

> **Deep research completed 2026-02-08.** Full protocol analysis from [coinbase/x402](https://github.com/coinbase/x402).

- [[X402 Payments]] - Overview, our implementation vs Coinbase v2, gap analysis
- [[X402 Architecture]] - Protocol internals: types, hooks, scheme/network plugins
- [[X402 Sui-ski Implementation]] - Our code: middleware, verification, providers
- [[X402 Gap Analysis]] - Actionable upgrade priorities (P0/P1/P2)
- [[X402 Coinbase Ecosystem]] - SDKs, Hono middleware, extensions, Bazaar, project ideas

**Key opportunity**: No `@x402/sui` package exists upstream. Sui-ski could contribute the first Sui network implementation to Coinbase's ecosystem.

---

## Quick Navigation

### Architecture
- [[System Overview]] - High-level architecture and routing
- [[Subdomain Routing]] - Pattern matching and route types
- [[Handler System]] - All 18 HTTP handlers
- [[Resolver System]] - SuiNS, MVR, content, RPC resolution
- [[Utility Layer]] - 28 utility modules

### Features
- [[SuiNS Integration]] - Name resolution, profiles, registration
- [[Marketplace]] - Tradeport indexer, NFT tracking
- [[Token Economics]] - NS token, DeepBook V3, pricing
- [[Wallet Infrastructure]] - Cross-subdomain SSO, 10+ wallets
- [[Content Delivery]] - IPFS, Walrus blob storage
- [[Seal Messaging]] - Encrypted messaging with IBE
- [[X402 Payments]] - HTTP 402 payment protocol
- [[Advanced Features]] - Watchlist, vaults, auctions, flash loans

### Smart Contracts
- [[Deployed Contracts]] - 10 mainnet contracts
- [[Contract Index]] - All contract source directories

### Progress
- [[Changelog]] - Git history and milestones
- [[Current Sprint]] - Active work items
- [[Backlog]] - Future work and TODOs

### Infrastructure
- [[Deployment]] - Wrangler, CI/CD, routes
- [[Configuration]] - Environment variables, KV, DOs
- [[DNS Setup]] - Cloudflare DNS records

### Reference
- [[API Endpoints]] - All API routes
- [[Dependencies]] - Package inventory
- [[Token Decimals]] - Critical decimal handling
- [[Error Codes]] - DeepBook, SuiNS error reference

### Daily Notes
- [[2026-02-08]] - Today

---

## Project Stats

| Metric | Value |
|--------|-------|
| TypeScript files | 70 |
| Move contracts | 18 source files |
| Total lines | ~140,000 |
| Handlers | 18 |
| Utility modules | 28 |
| Resolvers | 4 |
| SDK modules | 6 |
| Test suites | 3 (30 tests passing) |
| Deployed contracts | 10 (mainnet) |
| Documentation guides | 7 (152K words) |

## Health Status

- [x] TypeScript checks passing
- [x] 30/30 tests passing
- [x] Zero lint warnings
- [x] Production deployed (sui.ski)
- [x] Marketplace integration live
- [x] Multi-wallet support working
- [x] Grace period monitoring active
