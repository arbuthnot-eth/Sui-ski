---
tags: [feature, tokens, defi]
---

# Token Economics

Sui-ski handles NS token pricing, SUI/NS swaps via DeepBook V3, and registration pricing calculations.

## NS Token

- **Decimals**: 6 (see [[Token Decimals]])
- **Use**: Pay for SuiNS name registration
- **Source**: DeepBook V3 SUI/NS pool
- **Scale constant**: `NS_SCALE = 1e6`

## DeepBook V3 Integration

### Orderbook Pricing (`ns-price.ts`)
- Reads live orderbook from DeepBook V3
- Calculates best ask/bid prices
- Determines SUI cost for given NS amount
- Handles slippage protection

### Swap Transactions (`swap-transactions.ts`)
- Builds unsigned swap TXs for client signing
- SUI → NS swaps for registration payment
- Proper decimal conversion (see [[Token Decimals]])

## Registration Pricing (`pricing.ts`)

Base prices by character length:
| Length | Price |
|--------|-------|
| 3 chars | Premium |
| 4 chars | Higher |
| 5+ chars | Standard |

Factors:
- Multi-year discounts
- Premium name multipliers
- Grace period vault support
- Service fees

## Price Feeds

- **DeepBook V3** - Primary NS/SUI pricing
- **Pyth Oracle** (`pyth-price-info.ts`) - Additional price feeds
- **SOL Price** (`sol-price.ts`) - For cross-chain swap display

## Related
- [[Token Decimals]]
- [[SuiNS Integration]]
- [[Error Codes]]
