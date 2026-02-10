---
tags: [architecture, utils]
---

# Utility Layer

28 utility modules in `src/utils/` totaling ~5.4K lines. These provide shared functionality across handlers.

## Module Inventory

### Transaction Builders
| Module | Size | Purpose |
|--------|------|---------|
| `swap-transactions.ts` | 15K | DeepBook V3 swap TX builders |
| `subnamecap-transactions.ts` | 16K | Subdomain TX builders |
| `grace-vault-transactions.ts` | 12K | Grace period vault TXs |
| `ika-transactions.ts` | 5.2K | IKA dWallet TXs |
| `transactions.ts` | 1.4K | Generic TX utilities |
| `wallet-tx-js.ts` | 5.4K | Wallet TX client JS |

### Pricing & Economics
| Module | Size | Purpose |
|--------|------|---------|
| `ns-price.ts` | 15K | NS token pricing (DeepBook orderbook) |
| `pricing.ts` | 9.2K | SuiNS registration pricing |
| `sol-price.ts` | 1.9K | SOL price fetching |
| `pyth-price-info.ts` | 2K | Pyth oracle price feeds |
| `premium.ts` | 1K | Premium name detection |

### Infrastructure
| Module | Size | Purpose |
|--------|------|---------|
| `cache.ts` | 2.2K | KV-backed caching |
| `response.ts` | 5.1K | HTTP response helpers (JSON, HTML, CORS) |
| `subdomain.ts` | 3.4K | Subdomain parsing |
| `sui-client.ts` | 243B | Sui client factory |
| `rpc.ts` | 1.5K | RPC utilities |
| `status.ts` | 829B | Status utilities |
| `vault.ts` | 614B | Vault utilities |

### External Services
| Module | Size | Purpose |
|--------|------|---------|
| `surflux-grpc.ts` | 6.6K | Surflux gRPC client |
| `surflux-client.ts` | 3.2K | Surflux API client |
| `grpc-client.ts` | 2.7K | gRPC client utilities |
| `x402-middleware.ts` | 7K | HTTP 402 payment middleware |
| `x402-sui.ts` | 5K | Sui payment verification |

### Content & Display
| Module | Size | Purpose |
|--------|------|---------|
| `og-image.ts` | 18K | OG image generation (SVG/PNG) |
| `social.ts` | 4.4K | Social meta utilities |
| `suins-object.ts` | 7.4K | SuiNS object parsing |
| `subnamecap-queries.ts` | 9K | Subdomain queries |
| `wallet-session-js.ts` | 1.9K | Wallet session client JS |

## Key Patterns

- All utils are **pure functions** or **factory functions** - no mutable module state
- Transaction builders return `Transaction` objects for client-side signing
- Pricing functions handle [[Token Decimals]] conversions carefully
- Cache utilities use Cloudflare KV with configurable TTL

## Related
- [[System Overview]]
- [[Token Decimals]]
- [[Dependencies]]
