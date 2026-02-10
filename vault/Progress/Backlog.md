---
tags: [progress, backlog, todo]
---

# Backlog

Future work items, known TODOs, and improvement ideas.

## Known TODOs in Code

Found in the codebase as of 2026-02-08:

| Location | TODO |
|----------|------|
| `src/handlers/suins-manager.ts` | Query on-chain for DayOne NFT eligibility |
| `src/handlers/suins-manager.ts` | Implement gas sponsorship |
| `src/handlers/suins-manager.ts` | Query on-chain for subdomains |
| `src/sdk/ligetron/prover.ts` | Load actual Ligetron WASM from CDN |

## X402 Upgrade Path (from [[X402 Gap Analysis]])

### P0 - High Priority
- [ ] **Hook system** - Add `onProtectedRequest`, `onAfterVerify`, `onVerifyFailure` to middleware
- [ ] **Dynamic pricing** - Accept callback for `amountMist` (per-request pricing)
- [ ] **Zod schema validation** - Runtime validation for payment payloads

### P1 - Medium Priority
- [ ] **Scheme/Network plugin abstraction** - If multi-asset support planned
- [ ] **Browser paywall UI** - Serve HTML payment page for browser requests
- [ ] **`unpaidResponseBody` callback** - Custom 402 response per route

### P2 - Future
- [ ] **Contribute `@x402/sui` upstream** - First-class Sui support in Coinbase ecosystem
- [ ] **Bazaar discovery extension** - Expose agent APIs for discovery
- [ ] **Payment Identifier extension** - Receipt tracking across services

## Potential Improvements

### Testing
- [ ] Expand test coverage beyond 3 test suites
- [ ] Add E2E tests (Playwright configured but minimal)
- [ ] Integration tests for resolver chain
- [ ] Handler unit tests

### Performance
- [ ] Evaluate additional caching opportunities
- [ ] Profile gRPC vs SDK resolution latency
- [ ] Optimize large handler files (profile.ts at 410K)

### Features
- [ ] DayOne NFT eligibility checking
- [ ] Gas sponsorship for registration
- [ ] On-chain subdomain queries
- [ ] Ligetron WASM production loading

### Infrastructure
- [ ] Monitoring and alerting
- [ ] Error tracking integration
- [ ] Analytics dashboard
- [ ] Rate limiting refinement

### Code Quality
- [ ] Break up large handler files
- [ ] Increase type coverage
- [ ] Documentation for API endpoints
- [ ] OpenAPI spec generation

## Related
- [[Current Sprint]]
- [[Changelog]]
