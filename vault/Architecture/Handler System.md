---
tags: [architecture, handlers]
---

# Handler System

18 handler files in `src/handlers/` totaling ~42K lines. These generate HTML responses, process API requests, and build transactions.

## Handler Inventory

### Major Handlers

| Handler | File | Size | Purpose |
|---------|------|------|---------|
| Profile | `profile.ts` | 410K | SuiNS profile pages, NFT display, marketplace |
| Profile CSS | `profile.css.ts` | 291K | Inline CSS for profile pages |
| Landing | `landing.ts` | 113K | Root domain, APIs, status, pricing |
| Register | `register.ts` | 112K | Name registration, premium names, NS swap |
| App | `app.ts` | 72K | Aggregator hub interface |
| SuiNS Manager | `suins-manager.ts` | 41K | SuiNS management operations |
| SubnameCap UI | `subnamecap-ui.ts` | 40K | Subdomain management interface |
| Dashboard | `dashboard.ts` | 39K | User dashboard with wallet |

### Specialized Handlers

| Handler | File | Size | Purpose |
|---------|------|------|---------|
| SubnameCap | `subnamecap.ts` | 31K | Subdomain registration API |
| Transaction | `transaction.ts` | 21K | Transaction utilities |
| gRPC Proxy | `grpc-proxy.ts` | 20K | gRPC backend proxy |
| Renewal | `renewal.ts` | 14K | Name renewal |
| Grace Vault Agent | `grace-vault-agent.ts` | 11K | Grace period vault agent |
| SubnameCap CSS | `subnamecap-ui.css.ts` | 11K | SubnameCap styles |
| Vault | `vault.ts` | 6.1K | Vault management API |
| SOL Swap | `sol-swap.ts` | 3.5K | Cross-chain SOL swap routes |
| Wallet API | `wallet-api.ts` | 2.9K | Wallet session endpoints |
| Views | `views.ts` | 2.8K | Shared view components |

## Patterns

All handlers follow these patterns:

1. **Inline HTML** - Server-side rendering, no build step
2. **Transaction building** - Build unsigned TX, client signs
3. **Wallet integration** - Support 10+ wallet providers
4. **KV caching** - Cache expensive operations via `src/utils/cache.ts`
5. **CORS handling** - Via `src/utils/response.ts` helpers

## Related
- [[System Overview]]
- [[Subdomain Routing]]
- [[Wallet Infrastructure]]
