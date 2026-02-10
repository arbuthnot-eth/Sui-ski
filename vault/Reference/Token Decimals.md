---
tags: [reference, critical, tokens, decimals]
aliases: [Decimal Handling]
---

# Token Decimals

> **CRITICAL REFERENCE** - Incorrect decimal handling has caused production bugs.

## Token Scales

| Token | Decimals | Scale | 1 Token = |
|-------|----------|-------|-----------|
| NS | 6 | 1e6 | 1,000,000 mist |
| SUI | 9 | 1e9 | 1,000,000,000 mist |

## Conversion Formulas

### NS Token
```
nsTokens * 1e6 = nsMist
nsMist / 1e6 = nsTokens
```

### SUI
```
suiAmount * 1e9 = suiMist
suiMist / 1e9 = suiAmount
```

## Common Bug Pattern (Fixed 2026-02-04)

When calculating SUI needed to buy NS tokens:

```typescript
// WRONG - treats NS mist as if it were tokens
const suiMist = BigInt(nsMist * suiPerNs);

// CORRECT - convert NS mist to tokens, then to SUI, then to SUI mist
const nsTokens = Number(nsMist) / 1e6;
const suiMist = BigInt(Math.ceil(nsTokens * suiPerNs * 1e9));
```

**Symptom**: 1000x error in amounts (decimal mismatch between 6 and 9 decimals).

## Files with Decimal Conversions

| File | What It Does |
|------|-------------|
| `src/utils/ns-price.ts` | `NS_SCALE` constant (1e6), orderbook calculations |
| `src/utils/pricing.ts` | Registration price calculations |
| `src/utils/swap-transactions.ts` | Transaction building (server-side) |
| `src/handlers/register.ts` | **Client-side JS** in HTML builds transactions too |

## Debugging Tips

1. Fetch failed TX with `sui_getTransactionBlock`
2. Check `effects.status.error` for Move abort details
3. Examine `inputs` array for actual values passed
4. Compare expected vs actual (watch for 1000x errors)

## Related
- [[Token Economics]]
- [[Error Codes]]
