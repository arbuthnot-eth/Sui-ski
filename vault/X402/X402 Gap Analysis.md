---
tags: [x402, analysis, improvement, actionable, critical]
aliases: [x402 Upgrade Path]
---

# X402 Gap Analysis

> What Coinbase's x402 v2 does that Sui-ski doesn't yet, and what's worth adopting.

## Priority Matrix

### P0 - Should Adopt (High Value, Moderate Effort)

#### 1. Hook System
**Gap**: Coinbase v2 has a full lifecycle hook system (before/after/failure for both verify and settle). Sui-ski has none.

**Why it matters**: Hooks enable free-tier bypass, rate limiting, analytics, receipt generation, and error recovery without modifying core middleware.

**Pattern from Coinbase:**
```typescript
server.onProtectedRequest(async (ctx, routeConfig) => {
  // Check API key → grant access without payment
  if (ctx.adapter.getHeader('x-api-key') === validKey) {
    return { grantAccess: true }
  }
  // Check blocklist → deny
  if (isBlocked(ctx)) {
    return { abort: true, reason: 'Blocked' }
  }
  // Continue to payment flow
})
```

**Upgrade path**: Add `onProtectedRequest`, `onAfterVerify`, and `onVerifyFailure` hooks to `x402-middleware.ts`. The hook pattern is simple: array of callbacks, sequential execution, first non-void result wins.

#### 2. Dynamic Pricing
**Gap**: Sui-ski uses static `amountMist` per endpoint. Coinbase supports `DynamicPrice` callbacks that receive the full request context.

**Why it matters**: Enables per-request pricing based on query params, payload size, user tier, time-of-day, etc.

**Pattern from Coinbase:**
```typescript
accepts: {
  scheme: "exact",
  price: async (ctx) => {
    const model = ctx.adapter.getBody()?.model
    return model === 'gpt-4' ? '$0.10' : '$0.01'
  },
  payTo: RECIPIENT,
  network: NETWORK,
}
```

**Upgrade path**: Accept `amountMist: string | ((c: Context) => string | Promise<string>)` in middleware config.

#### 3. Schema Validation with Zod
**Gap**: Sui-ski does manual `try/catch` + JSON parse for payment headers. Coinbase uses Zod schemas with `parse`, `validate`, and `is` type guards.

**Why it matters**: Prevents subtle bugs from malformed payment payloads. Type-safe at runtime.

**Upgrade path**: Add Zod schemas for `PaymentPayload`, `PaymentRequired`, `PaymentRequirements`. Already using Zod in some parts of the project.

---

### P1 - Should Consider (Medium Value)

#### 4. Scheme/Network Plugin Abstraction
**Gap**: Sui-ski has `exact-sui` hardcoded. Coinbase uses `SchemeNetworkClient`/`Server`/`Facilitator` interfaces.

**Why it matters**: If we ever support USDC on Sui, or other payment types, the plugin system avoids middleware rewrites.

**Evaluation**: Only worth it if we plan multi-asset support. For SUI-only, current approach is fine.

#### 5. Paywall UI for Browsers
**Gap**: Sui-ski returns JSON 402 for all clients. Coinbase serves a React-based paywall page for browser requests (detected via `Accept: text/html` + `Mozilla` user agent).

**Why it matters**: Browsers hitting paid endpoints get a payment UI instead of raw JSON.

**Evaluation**: Low priority since our paid endpoints are agent-facing APIs, not browser pages.

#### 6. `unpaidResponseBody` Callback
**Gap**: Coinbase allows custom 402 response bodies per route (e.g., preview data, teaser content).

**Why it matters**: Lets API consumers understand what they'd get before paying.

**Pattern:**
```typescript
unpaidResponseBody: async (ctx) => ({
  contentType: 'application/json',
  body: { preview: 'First 100 chars...', fullAccess: false }
})
```

---

### P2 - Future / Nice-to-Have

#### 7. Bazaar Discovery Extension
**Gap**: Coinbase's Bazaar creates a searchable catalog of x402-enabled endpoints. AI agents can discover and pay for services dynamically.

**Vision**: If Sui-ski's agent APIs grow, Bazaar would let any agent discover our endpoints.

#### 8. Sign-in-with-X Extension
**Gap**: Coinbase has a SIWE-style extension that verifies wallet ownership alongside payment.

**Evaluation**: We already have wallet SSO via Durable Objects. Not needed.

#### 9. Payment Identifier Extension
**Gap**: Unique identifiers for tracking payment lineage across services.

**Evaluation**: Useful for complex multi-hop payment chains. Not needed currently.

#### 10. Settlement Separation
**Gap**: Coinbase separates verify (check validity) from settle (execute on-chain). Sui-ski's pre-executed model bundles them.

**Why Coinbase does it**: EVM transactions can be pre-signed but not yet submitted. Settlement submits them.

**Why it doesn't apply**: Sui's model requires pre-execution. The TX is already on-chain when we verify. Settle = confirm it's there.

---

## Recommended Upgrade Order

1. **Hook system** (P0) - Biggest bang for buck. Enables free tier, analytics, error recovery.
2. **Dynamic pricing** (P0) - Small change, big flexibility.
3. **Zod validation** (P0) - Safety net for payment parsing.
4. **Plugin abstraction** (P1) - Only if multi-asset planned.
5. **Paywall UI** (P1) - Only if browser-facing paid pages needed.

## Related
- [[X402 Payments]] - Overview
- [[X402 Architecture]] - Protocol design
- [[X402 Sui-ski Implementation]] - Current code
- [[X402 Coinbase Ecosystem]] - Full SDK landscape
- [[Backlog]] - Track these as future work
