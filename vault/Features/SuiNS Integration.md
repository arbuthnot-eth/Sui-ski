---
tags: [feature, suins, naming]
---

# SuiNS Integration

SuiNS (Sui Name Service) is the core naming layer. Sui-ski provides full resolution, profile pages, registration, and management.

## Capabilities

### Name Resolution
- **Forward lookup**: `example.sui` → target address
- **Reverse lookup**: address → default SuiNS name
- **Primary method**: Surflux gRPC (fast)
- **Fallback**: `@mysten/suins` SDK

### Profile Pages (`profile.ts`)
The largest handler (410K lines). Renders full profile pages at `{name}.sui.ski`:
- NFT gallery with marketplace integration
- Wallet connection (10+ providers)
- Registration/renewal/transfer interfaces
- Grace period indicators (90 days post-expiry)
- Black Diamond watchlist integration
- Social graph display
- OG image generation

### Registration (`register.ts`)
- Multi-year registration (1-5 years)
- Premium name handling
- NS token swap via DeepBook V3
- Real-time pricing from orderbook
- Discount support

### Management (`suins-manager.ts`)
- Set target address
- Set default name
- Transfer ownership
- Subdomain management (SubnameCap)

### Subdomain System
- `subnamecap.ts` - API for subdomain operations
- `subnamecap-ui.ts` - Web UI for management
- `subnamecap-transactions.ts` - TX builders
- `subnamecap-queries.ts` - Query helpers

## Mainnet Addresses

| Object | Address |
|--------|---------|
| SuiNS Core V3 | `0x00c2f85e07181b90c140b15c5ce27d863f93c4d9159d2a4e7bdaeb40e286d6f5` |
| SuiNS Core V2 | `0xb7004c7914308557f7afbaf0dca8dd258e18e306cb7a45b28019f3d0a693f162` |
| SuiNS Core V1 | `0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0` |
| SuiNS Object | `0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871` |

## Grace Period

Names enter a 90-day grace period after expiration:
- Original owner can still renew
- Profile page shows grace period indicator
- Grace vault agent monitors approaching expirations
- After grace period, name becomes available

## Related
- [[Resolver System]]
- [[Token Economics]]
- [[Marketplace]]
- [[Wallet Infrastructure]]
