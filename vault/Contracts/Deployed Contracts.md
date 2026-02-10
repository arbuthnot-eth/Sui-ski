---
tags: [contracts, move, mainnet]
---

# Deployed Contracts

10 Move contract directories, several deployed to mainnet.

## Contract Inventory

| Contract | Directory | Network | Purpose |
|----------|-----------|---------|---------|
| Black Diamond | `contracts/black_diamond/` | Mainnet | Watchlist tracking |
| Bounty Escrow | `contracts/bounty_escrow/` | - | MVR bounties |
| Decay Auction | `contracts/decay_auction/` | Mainnet | Jacket decay auctions |
| Flash Loan | `contracts/flash_loan/` | - | Flash loan protocol |
| Jacket Factory | `contracts/jacket_factory/` | - | Jacket minting |
| MVR | `contracts/mvr/` | - | Move Registry |
| Private | `contracts/private/` | - | Private protocol |
| Seal Messaging | `contracts/seal_messaging/` | Mainnet | Encrypted messaging |
| SOL Swap | `contracts/sol_swap/` | - | Cross-chain swap |
| UpgradeCap Transfer | `contracts/upgrade_cap_transfer/` | - | Cap transfers |

## Mainnet Addresses

### Decay Auction
```
DECAY_AUCTION_PACKAGE_ID=0x7f4c...
```

### Jacket Protocol
```
JACKET_SINGLE_USE_PACKAGE_ID=0x6124...
JACKET_FEE_PACKAGE_ID=0xc91a...
JACKET_ALLOWLIST_PACKAGE_ID=0x41fa...
JACKET_RATE_LIMIT_PACKAGE_ID=0x8212...
JACKET_FEE_OBJECT_ID=0x3961...
```

### Seal Messaging
```
SEAL_PACKAGE_ID=0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82
```

## SuiNS Testnet Deployment

For testing purposes:
```
suins: 0xcb631933...
denylist: 0xa3b744ed...
subdomains: 0xd96a273f...
SuiNS Object: 0x2abb88c1...
AdminCap: 0x9805de1a...
```

See [[Token Decimals]] for critical decimal handling when interacting with contracts.

## Related
- [[Advanced Features]]
- [[Seal Messaging]]
- [[Configuration]]
