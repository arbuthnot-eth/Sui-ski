---
tags: [reference, errors, debugging]
---

# Error Codes

Reference for error codes encountered in the Sui-ski ecosystem.

## DeepBook V3

| Code | Name | Meaning | Common Cause |
|------|------|---------|--------------|
| 12 | `EInsufficientBaseFundsForExactQuantitySwap` | Swap can't provide minimum output | Input too small, slippage exceeded, insufficient liquidity |

## Debugging Failed Transactions

### Step-by-step

1. **Fetch the transaction**
   ```bash
   curl -X POST <RPC_URL> -H 'Content-Type: application/json' \
     -d '{"jsonrpc":"2.0","id":1,"method":"sui_getTransactionBlock","params":["<DIGEST>",{"showEffects":true,"showInput":true}]}'
   ```

2. **Check error details**
   - `effects.status.error` - Move abort message
   - Look for module name and error code

3. **Examine inputs**
   - `inputs` array shows actual values passed
   - Compare with expected values

4. **Watch for decimal mismatches**
   - 1000x error = wrong scale factor
   - See [[Token Decimals]] for correct conversions

## SuiNS Errors

| Error | Meaning |
|-------|---------|
| Name not found | SuiNS name doesn't exist or expired |
| Grace period | Name in 90-day grace (owner can still renew) |
| Already registered | Name taken by another address |

## HTTP Status Codes (Gateway)

| Code | Meaning |
|------|---------|
| 200 | Success |
| 402 | Payment Required (see [[X402 Payments]]) |
| 404 | Name/package not found |
| 429 | Rate limited (RPC proxy: 100 req/min) |
| 500 | Internal error |

## Related
- [[Token Decimals]]
- [[Token Economics]]
