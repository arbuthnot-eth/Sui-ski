---
tags: [infrastructure, config, env]
---

# Configuration

All configuration lives in `wrangler.toml` and environment variables.

## Environment Variables

### Network
```
SUI_NETWORK=mainnet|testnet|devnet
SUI_RPC_URL=<secret>
WALRUS_NETWORK=mainnet|testnet
```

### Seal Encryption
```
SEAL_NETWORK=testnet
SEAL_PACKAGE_ID=0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82
SEAL_KEY_SERVERS=server1,server2,server3
```

### SuiNS Mainnet
```
SUBNAMECAP_SUINS_PACKAGE_ID=0xd22b...
SUBNAMECAP_SUBDOMAINS_PACKAGE_ID=0xe177...
SUBNAMECAP_SUINS_OBJECT_ID=0x6e0d...
```

### Jacket Protocol
```
JACKET_SINGLE_USE_PACKAGE_ID=0x6124...
JACKET_FEE_PACKAGE_ID=0xc91a...
JACKET_ALLOWLIST_PACKAGE_ID=0x41fa...
JACKET_RATE_LIMIT_PACKAGE_ID=0x8212...
JACKET_FEE_OBJECT_ID=0x3961...
```

### Decay Auction
```
DECAY_AUCTION_PACKAGE_ID=0x7f4c...
```

### Service
```
SERVICE_FEE_NAME=brando.sui
DISCOUNT_RECIPIENT_NAME=extra.sui
```

## Bindings

### KV Namespace
```
CACHE=c0054cf22c6a4daa99cb36347fa5229c
```

### Durable Objects
```
WALLET_SESSIONS=WalletSession class
```

## Development

```bash
bun install               # Install dependencies
bun run dev               # Dev server (Wrangler)
bun test                  # Run tests
bun run typecheck         # Type check
bun run lint              # Lint
bun run format            # Format
```

Use `env.dev` in wrangler.toml for testnet development.

## Related
- [[Deployment]]
- [[DNS Setup]]
- [[Dependencies]]
