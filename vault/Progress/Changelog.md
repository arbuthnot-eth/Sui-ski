---
tags: [progress, changelog, git]
---

# Changelog

Git commit history tracking project milestones and changes.

## Recent Commits (as of 2026-02-08)

### Marketplace & NFT Improvements
| Commit | Type | Description |
|--------|------|-------------|
| `c2931c5` | perf | Cache marketplace API responses with 60s TTL |
| `7b2229a` | fix | Show sold price on NFT tag and include accept_bid in sales |
| `f31c3cf` | feat | Color-coded NFT tags and sold state after purchase |

### Mobile Wallet Fixes
| Commit | Type | Description |
|--------|------|-------------|
| `318283f` | fix | Resolve Phantom wallet double-connect race condition (#12) |
| `349d72f` | fix | Narrow in-app browser detection and handle rejected auto-connect |
| `915e352` | merge | PR #11 - mobile wallet fixes |
| `4e69aa6` | fix | Fix Phantom mobile wallet capture |

### CI/CD & Infrastructure
| Commit | Type | Description |
|--------|------|-------------|
| `6cc1a6a` | chore | Trigger CI deploy workflow |
| `0982d9e` | feat | Add GitHub Actions deploy workflow |

### Marketplace Activity
| Commit | Type | Description |
|--------|------|-------------|
| `92b5fca` | fix | Normalize marketplace activity types |
| `3f6dc7e` | feat | Color-coded activity rows with name resolution |

### Major Feature Drops
| Commit | Type | Description |
|--------|------|-------------|
| `9999025` | feat | Grace vaults, SOL swap, flash loans, x402 upgrades |
| `ef7f710` | feat | Mobile responsiveness, Seal/Playwright deps |
| `6750766` | feat | Profile redesign with watchlist |
| `d29678d` | feat | Encrypted vault bookmarks (Seal) |
| `9b42418` | feat | Dashboard, decay auctions, x402, SubnameCap |
| `81094e5` | merge | PR #9 - wallet SSO and profile |

### Registration UI
| Commit | Type | Description |
|--------|------|-------------|
| `b20c293` | feat | Crisp white target for 2+ year renewals |
| `b7955c` | feat | Clickable discount badge |
| `64a2abd` | feat | Redesigned renewal/marketplace cards |

## Milestones

### Phase 1: Core Gateway
- [x] Subdomain routing engine
- [x] SuiNS name resolution
- [x] MVR package lookup
- [x] IPFS/Walrus content delivery
- [x] RPC proxy with rate limiting

### Phase 2: Profile & Registration
- [x] Profile pages with NFT display
- [x] Name registration with NS token swap
- [x] Renewal interface
- [x] Grace period support

### Phase 3: Wallet & Auth
- [x] Cross-subdomain SSO (Durable Objects)
- [x] 10+ wallet provider support
- [x] Phantom mobile fixes
- [x] Session management

### Phase 4: Marketplace & DeFi
- [x] Tradeport indexer integration
- [x] NFT sale tracking
- [x] DeepBook V3 pricing
- [x] X402 payment protocol
- [x] Grace period vaults

### Phase 5: Advanced Features
- [x] Seal encrypted messaging
- [x] Black Diamond watchlist
- [x] Decay auctions
- [x] Flash loans
- [x] SOL swap (IKA dWallet)
- [x] Dashboard
- [x] SubnameCap management

## Related
- [[Current Sprint]]
- [[Backlog]]
