---
tags: [feature, wallet, auth]
---

# Wallet Infrastructure

Cross-subdomain wallet SSO powered by Durable Objects, supporting 10+ wallet providers.

## Architecture

```
User connects wallet on brandon.sui.ski
    │
    ▼
WalletSession Durable Object (SQLite)
    │
    ├── Stores session with 30-day rolling expiry
    ├── Sets secure cookie across *.sui.ski
    └── Auto-cleanup via hourly alarm
    │
    ▼
User visits other.sui.ski → session restored automatically
```

## Supported Wallets

| Wallet | Type | Status |
|--------|------|--------|
| Sui Wallet | Extension | Working |
| Phantom | Extension + Mobile | Fixed (PR #12) |
| WalletConnect | Protocol | Working |
| Suiet | Extension | Working |
| Ethos | Extension | Working |

## Session Management

- **Storage**: SQLite in Durable Object
- **Expiry**: 30-day rolling
- **Cleanup**: Hourly alarm-based
- **Persistence**: Cookie + server-side sync

## Recent Fixes

| Commit | Fix |
|--------|-----|
| 318283f | Fix Phantom wallet double-connect race condition (#12) |
| 349d72f | Narrow in-app browser detection, handle rejected auto-connect |
| 4e69aa6 | Fix Phantom mobile wallet capture |

## Files

- `src/durable-objects/wallet-session.ts` - DO implementation
- `src/client/wallet-session-client.ts` - Client interface
- `src/handlers/wallet-api.ts` - REST endpoints
- `src/utils/wallet-session-js.ts` - Client-side JS
- `src/utils/wallet-tx-js.ts` - Wallet TX JS
- `docs/WALLET_SESSION.md` - Full documentation

## Related
- [[System Overview]]
- [[SuiNS Integration]]
- [[Configuration]]
