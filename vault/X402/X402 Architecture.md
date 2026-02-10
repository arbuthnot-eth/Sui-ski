---
tags: [x402, architecture, protocol, coinbase, critical]
aliases: [x402 Protocol Architecture]
---

# X402 Protocol Architecture

> Deep-dive into Coinbase's x402 v2 protocol internals. Source: [coinbase/x402](https://github.com/coinbase/x402)

## Three-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Transport Layer                   │
│  Headers: PAYMENT-REQUIRED, PAYMENT-SIGNATURE,           │
│           PAYMENT-RESPONSE (all Base64-encoded JSON)     │
│  Adapters: Hono, Express, Next.js, Fetch, Axios         │
├─────────────────────────────────────────────────────────┤
│                    Core Protocol Layer                    │
│  x402Client ←→ x402ResourceServer ←→ x402Facilitator    │
│  Hook system, extension registry, route matching         │
├─────────────────────────────────────────────────────────┤
│                  Scheme/Network Layer                     │
│  SchemeNetworkClient, SchemeNetworkServer,                │
│  SchemeNetworkFacilitator                                │
│  Implementations: exact-evm, exact-svm, exact-sui        │
└─────────────────────────────────────────────────────────┘
```

## Core Types

### PaymentRequirements
```typescript
type PaymentRequirements = {
  scheme: string              // e.g. "exact"
  network: Network            // CAIP-2 format: "eip155:8453", "sui:mainnet"
  asset: string               // Token address or identifier
  amount: string              // Smallest unit (mist, lamports, wei)
  payTo: string               // Recipient address
  maxTimeoutSeconds: number   // Payment validity window
  extra: Record<string, unknown>  // Scheme-specific data
}
```

### PaymentRequired (402 response)
```typescript
type PaymentRequired = {
  x402Version: number         // Protocol version (2)
  error?: string              // Error description
  resource: ResourceInfo      // { url, description, mimeType }
  accepts: PaymentRequirements[]  // One or more payment options
  extensions?: Record<string, unknown>
}
```

### PaymentPayload (client submission)
```typescript
type PaymentPayload = {
  x402Version: number
  resource: ResourceInfo
  accepted: PaymentRequirements  // Which option client chose
  payload: Record<string, unknown>  // Scheme-specific proof
  extensions?: Record<string, unknown>
}
```

### Facilitator Types
```typescript
type VerifyResponse = {
  isValid: boolean
  invalidReason?: string
  payer?: string
  extensions?: Record<string, unknown>
}

type SettleResponse = {
  success: boolean
  errorReason?: string
  payer?: string
  transaction: string
  network: Network
  extensions?: Record<string, unknown>
}
```

## Three Plugin Interfaces

The protocol is extensible via three interfaces per scheme/network combo:

### SchemeNetworkClient (buyer-side)
```typescript
interface SchemeNetworkClient {
  readonly scheme: string
  createPaymentPayload(
    x402Version: number,
    paymentRequirements: PaymentRequirements
  ): Promise<PaymentPayloadResult>
}
```

### SchemeNetworkServer (seller-side)
```typescript
interface SchemeNetworkServer {
  readonly scheme: string
  parsePrice(price: Price, network: Network): Promise<AssetAmount>
  enhancePaymentRequirements(
    paymentRequirements: PaymentRequirements,
    supportedKind: SupportedKind,
    facilitatorExtensions: string[]
  ): Promise<PaymentRequirements>
}
```

### SchemeNetworkFacilitator (verifier)
```typescript
interface SchemeNetworkFacilitator {
  readonly scheme: string
  readonly caipFamily: string  // e.g. "eip155:*", "solana:*"
  getExtra(network: Network): Record<string, unknown> | undefined
  getSigners(network: string): string[]
  verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<VerifyResponse>
  settle(payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettleResponse>
}
```

## Hook System

Every core class supports lifecycle hooks:

### Client Hooks
| Hook | Timing | Can | Use Case |
|------|--------|-----|----------|
| `onBeforePayment` | Before TX creation | Abort | Rate limiting, fraud detection |
| `onAfterPayment` | After success | Log | Analytics, receipts |
| `onPaymentFailure` | On error | Recover | Retry with different scheme |

### Server Hooks
| Hook | Timing | Can | Use Case |
|------|--------|-----|----------|
| `onProtectedRequest` | Before payment check | Grant access / Abort | API keys, free tier |
| `onBeforeVerify` | Before verification | Abort | Blocklists |
| `onAfterVerify` | After success | Log | Access logging |
| `onVerifyFailure` | On verify fail | Recover | Fallback verification |
| `onBeforeSettle` | Before settlement | Abort | Conditional settlement |
| `onAfterSettle` | After settlement | Log | Receipt generation |
| `onSettleFailure` | On settle fail | Recover | Retry settlement |

### Key Hook Pattern
```typescript
// Before hooks can ABORT
type BeforeHook = (ctx) => Promise<void | { abort: true; reason: string }>

// After hooks are fire-and-forget
type AfterHook = (ctx) => Promise<void>

// Failure hooks can RECOVER
type FailureHook = (ctx) => Promise<void | { recovered: true; result: T }>
```

## Facilitator Discovery

Facilitators expose a `/supported` endpoint:
```typescript
type SupportedResponse = {
  kinds: SupportedKind[]      // What schemes/networks are supported
  extensions: string[]         // What extensions are available
  signers: Record<string, string[]>  // CAIP family → signer addresses
}

type SupportedKind = {
  x402Version: number
  scheme: string
  network: Network
  extra?: Record<string, unknown>
}
```

## Route Configuration

```typescript
interface RouteConfig = {
  accepts: PaymentOption | PaymentOption[]  // Multiple payment methods
  description?: string
  mimeType?: string
  customPaywallHtml?: string
  unpaidResponseBody?: (ctx) => UnpaidResponseResult
  extensions?: Record<string, unknown>
}

interface PaymentOption = {
  scheme: string
  payTo: string | DynamicPayTo     // Static or per-request
  price: Price | DynamicPrice      // Static or per-request
  network: Network
  maxTimeoutSeconds?: number
  extra?: Record<string, unknown>
}
```

Dynamic functions receive the full HTTP request context, enabling per-request pricing and recipient routing.

## v1 vs v2 Differences

| Aspect | v1 | v2 |
|--------|----|----|
| Header name | `X-PAYMENT` | `PAYMENT-SIGNATURE` |
| Network format | Any string | CAIP-2 required (`eip155:8453`) |
| Amount field | `maxAmountRequired` | `amount` |
| Extensions | `extra` only | `extra` + `extensions` |
| Resource info | Inline | Separate `ResourceInfo` object |
| Validation | Manual | Zod schemas |

## Related
- [[X402 Payments]] - Overview and Sui-ski integration
- [[X402 Sui-ski Implementation]] - Our code
- [[X402 Gap Analysis]] - Upgrade opportunities
- [[X402 Coinbase Ecosystem]] - SDKs and extensions
