---
tags: [feature, advanced]
---

# Advanced Features

Additional features beyond core SuiNS/MVR functionality.

## Black Diamond Watchlist

- Onchain watchlist tracking via `contracts/black_diamond/`
- Deployed to mainnet
- Integrated into profile pages
- Track SuiNS names of interest

## Grace Period Vaults

- Automated claiming for expiring names
- Agent monitors approaching expirations (`grace-vault-agent.ts`)
- Transaction builders (`grace-vault-transactions.ts`)
- Vault management API (`vault.ts` handler)

## Decay Auctions (Jacket Protocol)

- Dutch auction mechanism for Jacket NFTs
- Deployed to mainnet (`DECAY_AUCTION_PACKAGE_ID`)
- Multiple pricing models:
  - Single-use
  - Fee-based
  - Allowlist
  - Rate-limited

## Flash Loans

- `contracts/flash_loan/` - Flash loan protocol
- Borrow and repay in single transaction
- No collateral required

## SOL Swap

- Cross-chain SUI ↔ SOL swap
- IKA dWallet integration (`ika-transactions.ts`)
- SOL price feed (`sol-price.ts`)
- Handler: `sol-swap.ts`

## MVR Package Management

- Web UI for package registration (`mvr-ui.ts`)
- Transaction builders (`mvr-transactions.ts`)
- API endpoints for CRUD operations
- Version management

## Vortex Privacy Protocol

- Privacy transactions via ZK proofs
- Server-side API proxy (SDK too large for Worker)
- Client-side SDK loaded from CDN
- Endpoints at `/api/vortex/*`

## Ligetron ZK Integration

- Groth16 ZK proof verification
- SDK modules in `src/sdk/groth16/` and `src/sdk/ligetron/`
- Documentation: `docs/LIGETRON_INTEGRATION.md`

## Related
- [[Deployed Contracts]]
- [[SuiNS Integration]]
- [[Token Economics]]
