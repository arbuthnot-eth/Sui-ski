---
tags: [x402, coinbase, ecosystem, sdk, reference]
aliases: [x402 Ecosystem, x402 SDKs]
---

# X402 Coinbase Ecosystem

> Complete landscape of Coinbase's x402 open-source packages, extensions, and community projects.

## TypeScript Packages (Monorepo)

### Core
| Package | Purpose |
|---------|---------|
| `@x402/core` | Protocol types, client, server, facilitator, schemas, utils |

### HTTP Adapters
| Package | Framework | Notes |
|---------|-----------|-------|
| `@x402/hono` | **Hono** | **We should use this** - native CF Workers support |
| `@x402/express` | Express | Adapter pattern |
| `@x402/next` | Next.js | SSR middleware |
| `@x402/fetch` | Fetch API | Client-side wrapper |
| `@x402/axios` | Axios | Client-side interceptor |
| `@x402/paywall` | React | Browser paywall UI component |

### Extensions
| Package | Purpose |
|---------|---------|
| `@x402/extensions` | Bazaar, Payment Identifier, Sign-in-with-X |

### Network Implementations
| Package | Chain |
|---------|-------|
| `@x402/evm` | EVM chains (Base, Ethereum, Polygon, etc.) |
| `@x402/svm` | Solana |
| (missing) | **Sui** - opportunity for contribution |

## Hono Middleware API

Since Sui-ski uses Hono, this is the most relevant adapter:

```typescript
import { paymentMiddleware, paymentMiddlewareFromConfig } from '@x402/hono'

// Option 1: From config (simplest)
app.use(paymentMiddlewareFromConfig(
  routes,
  facilitatorClient,
  [{ network: 'sui:mainnet', server: suiSchemeServer }]
))

// Option 2: With pre-configured server (more control)
const server = new x402ResourceServer(facilitatorClient)
  .register('sui:mainnet', suiSchemeServer)
app.use(paymentMiddleware(routes, server))

// Option 3: With HTTP server (full hook access)
const httpServer = new x402HTTPResourceServer(server, routes)
  .onProtectedRequest(apiKeyBypassHook)
app.use(paymentMiddlewareFromHTTPServer(httpServer))
```

### Route Configuration
```typescript
const routes = {
  "GET /api/weather": {
    accepts: {
      scheme: "exact",
      payTo: "0x...",
      price: "$0.01",       // Human-readable pricing
      network: "eip155:8453",
    },
    description: "Get current weather data",
    mimeType: "application/json",
    extensions: { bazaar: { /* discovery metadata */ } },
  },
  "POST /api/analyze": {
    accepts: [
      { scheme: "exact", payTo: "0x...", price: "$0.10", network: "eip155:8453" },
      { scheme: "exact", payTo: "...", price: "$0.10", network: "solana:mainnet" },
    ],
    description: "Run data analysis",
  },
}
```

## Fetch Client (for making paid requests)

```typescript
import { wrapFetchWithPayment } from '@x402/fetch'

const paymentFetch = wrapFetchWithPayment(
  fetch,
  httpClient,  // x402HTTPClient with wallet signer
)

// Automatically handles 402 → pay → retry
const response = await paymentFetch('https://api.example.com/weather')
const data = await response.json()
```

## Extensions Deep-Dive

### Bazaar (Discovery)
- Facilitators expose `/list` endpoint with all registered x402 services
- Agents query Bazaar to find services, compare pricing, and call
- Think "Google for paid APIs" (early stage)
- Supported on Base and Base Sepolia

### Payment Identifier
- Unique tracking IDs for payment lineage
- Enables receipt chains across multi-hop agent workflows
- Client generates ID, server validates and logs

### Sign-in-with-X
- SIWE-style wallet verification extension
- Proof of wallet ownership alongside payment
- Supports EVM and Solana signature schemes

## Community Projects (from PROJECT-IDEAS.md)

Coinbase offers **micro-grants up to $3K** for x402 projects:

### Agent Ideas
| Project | Payment Moment |
|---------|---------------|
| Unstoppable Agent | Per inference/tool call |
| Wealth-Manager Trading Bot | Per data fetch + per trade |
| Prediction Market Oracle | Resolution fee on settlement |
| KYC/AML Checker | $0.25 per wallet check |
| Purchase-With-Crypto Shopper | Per checkout |
| Bounty Hunter Agent | Entry fee + streaming compute |
| Code Review Marketplace | $5 per review bundle |
| Pay-As-You-Learn Tutor | $0.01 per explanation |
| Real-Time Fact Checker | Per page retrieval |

### Key Insight
> "Not all APIs listed natively support x402—and that's fine. Wrap any API behind a thin x402 server (a dozen lines of code), then let agents pay through the protocol."

## Sui-Specific Opportunity

There is **no official `@x402/sui` package** in the Coinbase monorepo. Current network support:
- `@x402/evm` - Ethereum, Base, Polygon, Avalanche, Arbitrum, etc.
- `@x402/svm` - Solana

**Sui-ski could contribute `@x402/sui`** implementing:
- `ExactSuiSchemeClient` (client-side TX building)
- `ExactSuiSchemeServer` (price parsing, requirement enhancement)
- `ExactSuiFacilitator` (verify + settle via Sui RPC)

This would make Sui a first-class x402 network alongside EVM and Solana.

## Coinbase Facilitator Service

Coinbase hosts a facilitator with a **free tier of 1,000 transactions/month**:
- EVM networks: Base, Ethereum, Polygon, Avalanche, Arbitrum
- Solana networks: mainnet, devnet
- **Sui: Not yet supported** by Coinbase's facilitator

## Related
- [[X402 Payments]] - Overview
- [[X402 Architecture]] - Protocol internals
- [[X402 Gap Analysis]] - Upgrade path
- [[X402 Sui-ski Implementation]] - Our code
