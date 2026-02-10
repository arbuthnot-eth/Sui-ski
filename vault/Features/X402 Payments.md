---
tags: [feature, payments, x402, critical, coinbase]
aliases: [x402, HTTP 402, Payment Protocol]
---

# X402 Payment Protocol

> **This is a TIER-1 feature.** x402 is a Coinbase-backed open standard for internet-native payments over HTTP. Sui-ski has a working implementation, but the upstream protocol has evolved significantly into a v2 architecture with facilitators, schemes, extensions, and multi-network support. This note covers both our implementation and the full Coinbase protocol.

## What is x402?

x402 activates the dormant [HTTP 402 Payment Required](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402) status code to enable **programmatic, stateless payments** between any HTTP client and server. No accounts, sessions, or credentials needed - just a crypto wallet.

**Six foundational principles:**
1. **Open Access** - No single-entity dependency
2. **Transport Integration** - Native HTTP, no custom protocols
3. **Network Agnosticism** - Crypto + fiat, any chain
4. **Backward Compatibility** - v1 and v2 coexist
5. **Trust Minimization** - Payment schemes prevent unauthorized fund movement
6. **User Simplicity** - Cryptographic complexity abstracted away

**Repository**: [coinbase/x402](https://github.com/coinbase/x402)
**Website**: [x402.org](https://www.x402.org/)
**Docs**: [docs.cdp.coinbase.com/x402](https://docs.cdp.coinbase.com/x402/welcome)

---

## Protocol Architecture (v2)

See [[X402 Architecture]] for the complete deep-dive.

```
┌─────────┐     1. Request      ┌──────────────────┐
│  Client  │ ──────────────────► │  Resource Server  │
│ (Buyer)  │                     │    (Seller)       │
│          │ ◄────────────────── │                   │
│          │  2. 402 + PAYMENT-  │                   │
│          │     REQUIRED header │                   │
│          │                     │                   │
│          │  3. Retry with      │                   │
│          │  PAYMENT-SIGNATURE  │                   │
│          │ ──────────────────► │                   │
│          │                     │   ┌────────────┐  │
│          │                     │   │ Facilitator│  │
│          │                     │   │  (Verify   │  │
│          │                     │   │  + Settle) │  │
│          │                     │   └────────────┘  │
│          │ ◄────────────────── │                   │
│          │  4. 200 + resource  │                   │
│          │  + PAYMENT-RESPONSE │                   │
└─────────┘                     └──────────────────┘
```

### Four Roles

| Role | Purpose | In Sui-ski |
|------|---------|------------|
| **Client** | Requests resource, submits payment | Browser/agent calling API |
| **Resource Server** | Enforces payment, serves content | Cloudflare Worker |
| **Facilitator** | Verifies + settles payments | Cloudflare (on-chain) or Coinbase API |
| **Scheme** | Payment logic (e.g., "exact" transfer) | `exact-sui` scheme |

### HTTP Headers (v2)

| Header | Direction | Format | Purpose |
|--------|-----------|--------|---------|
| `PAYMENT-REQUIRED` | Server → Client | Base64 JSON | Payment requirements |
| `PAYMENT-SIGNATURE` | Client → Server | Base64 JSON | Signed payment payload |
| `PAYMENT-RESPONSE` | Server → Client | Base64 JSON | Settlement confirmation |

---

## Sui-ski Implementation

See [[X402 Sui-ski Implementation]] for the complete code analysis.

### Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/utils/x402-middleware.ts` | 265 | Hono middleware, provider routing |
| `src/utils/x402-sui.ts` | 172 | Sui-specific verification + settlement |
| `src/types.ts` | - | Type definitions |

### Current Capabilities

- [x] `exact-sui` payment scheme (pre-executed TX verification)
- [x] Dual provider support (Cloudflare on-chain + Coinbase API)
- [x] SuiNS-based recipient resolution (`x402.sui`)
- [x] Configurable per-endpoint pricing
- [x] Legacy fallback (`X-Payment-Tx-Digest` header)
- [x] Payment context propagation via Hono middleware

### Endpoints Using x402

| Endpoint | Handler | Default Fee |
|----------|---------|-------------|
| `/api/agents/grace-vault/build-create` | `grace-vault-agent.ts` | 1 SUI |
| `/api/agents/subnamecap/register` | `subnamecap.ts` | 1 SUI |

---

## Gap Analysis: Our Implementation vs Coinbase v2

See [[X402 Gap Analysis]] for actionable upgrade paths.

| Feature | Coinbase v2 | Sui-ski | Gap |
|---------|-------------|---------|-----|
| Scheme/Network abstraction | Full plugin system | Hardcoded `exact-sui` | Major |
| Facilitator protocol | Verify + Settle endpoints | Direct on-chain check | Moderate |
| Hook system | Before/After/Failure for verify + settle | None | Major |
| Paywall UI | React component (`@x402/paywall`) | None (JSON 402 only) | Minor |
| Bazaar discovery | Extension for service catalog | None | Future |
| CAIP-2 network IDs | `eip155:8453`, `solana:mainnet` | `sui:mainnet` | Aligned |
| Multi-network | EVM + Solana + extensible | Sui only | By design |
| Extensions system | Bazaar, Payment Identifier, Sign-in-with-X | None | Future |
| Route pattern matching | `"GET /api/*"` with regex | Hono native routing | Different approach |
| Schema validation | Zod schemas for all types | Manual validation | Moderate |
| Dynamic pricing | `DynamicPrice` callback per request | Static per-endpoint | Moderate |
| Dynamic payTo | `DynamicPayTo` callback per request | SuiNS resolution | Partial |

---

## Related Notes

- [[X402 Architecture]] - Deep protocol internals
- [[X402 Sui-ski Implementation]] - Our code analysis
- [[X402 Gap Analysis]] - Upgrade opportunities
- [[X402 Coinbase Ecosystem]] - SDKs, extensions, project ideas
- [[API Endpoints]]
- [[Token Decimals]]
- [[Configuration]]
