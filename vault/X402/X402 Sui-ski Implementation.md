---
tags: [x402, implementation, sui-ski, code]
aliases: [x402 Implementation]
---

# X402 Sui-ski Implementation

> Complete code analysis of the current x402 implementation in Sui-ski.

## File Map

| File | Lines | Role |
|------|-------|------|
| `src/utils/x402-middleware.ts` | 265 | Hono middleware, multi-provider routing |
| `src/utils/x402-sui.ts` | 172 | Sui-specific verification handler |
| `src/types.ts` | - | Type definitions (Env, X402 types) |
| `src/handlers/grace-vault-agent.ts` | - | Consumer: grace vault endpoints |
| `src/handlers/subnamecap.ts` | - | Consumer: subdomain registration |

## Payment Flow

### Step 1: Client Requests (No Payment)
```
GET /api/agents/grace-vault/build-create
→ No PAYMENT-SIGNATURE header
```

### Step 2: Server Returns 402
```
← 402 Payment Required
← PAYMENT-REQUIRED: base64({
     x402Version: 2,
     resource: { url, description, mimeType: "application/json" },
     accepts: [{
       scheme: "exact-sui",
       network: "sui:mainnet",
       amount: "1000000000",        // 1 SUI in mist
       asset: "0x2::sui::SUI",
       payTo: "0x...",              // Resolved from x402.sui via SuiNS
       maxTimeoutSeconds: 120,
       extra: { verificationMethod: "pre-executed" }
     }]
   })
```

### Step 3: Client Pays and Retries
```
POST /api/agents/grace-vault/build-create
→ PAYMENT-SIGNATURE: base64({
     x402Version: 2,
     accepted: { scheme: "exact-sui", network: "sui:mainnet", ... },
     payload: { digest: "TX_DIGEST_HERE" }
   })
→ X-X402-Provider: cloudflare       // Optional: choose verifier
```

### Step 4: Server Verifies and Responds
```
← 200 OK
← PAYMENT-RESPONSE: base64({
     success: true,
     transaction: "TX_DIGEST",
     network: "sui:mainnet",
     payer: "0x..."
   })
← X-X402-PROVIDER: cloudflare
```

## Middleware Architecture

```typescript
x402PaymentMiddleware({
  description: string,              // Shown to user in 402
  amountMist?: string,              // Default: env.X402_AGENT_FEE_MIST or "1000000000"
  providers?: X402VerifierProvider[], // Default: env.X402_VERIFIERS or ["cloudflare"]
  requireAllProviders?: boolean,     // Default: false (any provider sufficient)
  allowBypassWhenUnconfigured?: boolean, // Default: true
})
```

### Provider Resolution
1. Check middleware config `providers` override
2. Fall back to `env.X402_VERIFIERS` (comma-separated)
3. Default to `["cloudflare"]`

### Verification Providers

**Cloudflare (on-chain)**
- Fetches TX from Sui RPC directly
- Validates: TX success, balance changes, recipient match, amount match
- Extracts payer from negative balance change
- No external dependency

**Coinbase (API)**
- POSTs to `env.COINBASE_X402_VERIFY_URL`
- Auth via `env.COINBASE_X402_API_KEY` Bearer token
- Request format:
  ```json
  {
    "paymentHeader": "base64(...)",
    "expected": {
      "network": "sui:mainnet",
      "asset": "0x2::sui::SUI",
      "amount": "1000000000",
      "payTo": "0x..."
    }
  }
  ```

## Recipient Resolution

Payment recipient is dynamically resolved via SuiNS:

```
x402.sui → SuiNS lookup → target address
```

Defined in `X402_SUINS_NAME = "x402.sui"` constant in `x402-sui.ts`.

For SubnameCap legacy payments, `atlas.sui` is used instead.

## Context Propagation

After verification, payment info is available in Hono context:
```typescript
const payment = c.get('x402Payment')
// { digest: string, payer: string, provider: 'cloudflare' | 'coinbase' }
```

## Legacy Compatibility

SubnameCap handler supports both:
1. **x402 v2** - `PAYMENT-SIGNATURE` header (modern)
2. **Legacy** - `X-Payment-Tx-Digest` header (backward compat)

Legacy verification uses the same on-chain TX check but without the x402 protocol envelope.

## Environment Variables

```
X402_VERIFIERS=cloudflare,coinbase    # Provider list
X402_AGENT_FEE_MIST=1000000000       # Default fee (1 SUI)
COINBASE_X402_VERIFY_URL=             # Coinbase verifier endpoint
COINBASE_X402_API_KEY=                # Coinbase API key (secret)
```

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `X402_PAYMENT_REQUIRED` | 402 | No payment header |
| `X402_INVALID_PAYMENT` | 402 | Malformed payment |
| `X402_INVALID_PROVIDER` | 400 | Unknown provider |
| `X402_VERIFICATION_FAILED` | 402 | Payment didn't verify |
| `X402_UNAVAILABLE` | 503 | Can't resolve recipient |

## Related
- [[X402 Payments]] - Overview
- [[X402 Architecture]] - Protocol internals
- [[X402 Gap Analysis]] - What to improve
- [[Token Decimals]] - SUI decimal handling
