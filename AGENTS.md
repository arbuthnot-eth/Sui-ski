# Agent Guidelines for Sui-ski Gateway

This file contains instructions for AI agents working on this Cloudflare Workers project serving the Sui ecosystem.

## Progress Log

### 2026-02-14
- Started messaging-only branding cleanup for the profile/landing chat widget.
- Added new `generateMessagingChatCss` and `generateMessagingChatJs` exports while keeping backward-compatible `generateX402ChatCss` and `generateX402ChatJs` aliases.
- Migrated page mounts from `x402-chat-root` to `messaging-chat-root` on landing and profile pages, with JS fallback support for legacy root IDs.
- Preserved existing moderation, channel controls, and owner-scoped server context behavior from prior fixes.
- Added `/cloudflare` searchable grace-radar page for SuiNS listings, backed by `/api/expiring-listings`.
- Extended expiring listings API with query filters (`q`, `mode`) and grace-window metrics (`daysSinceExpiry`, `daysUntilGraceEnds`, `graceEndsMs`).
- Tightened expired window handling to prioritize names still inside 30-day grace period.
- Added adjustable ranking weights (`graceWeight`, `priceWeight`) so grace mode can prioritize urgency vs cheaper listings.
- Exposed weighting controls in `/cloudflare` UI and added per-row priority score output.
- Added one-click ranking presets in `/cloudflare` (`Prime Targets`, `Balanced`, `Incoming Expiry`) with shareable URL state via `preset` query param.
- Added `/grace` route alias and configured default hard filter `minExpirationMs=1716660606618` for both TradePort listing activity and SuiNS expiration cutoff.
- Added `/grace` empty-state fallback: when no grace matches exist, UI auto-displays expiring-soon results with a visible notice.
- Switched TradePort time gating for grace ingestion to `expires_at` (SDK-aligned), with query-level and runtime filtering against `minExpirationMs`.
- Added freshness safeguards for `/api/expiring-listings` (`Cache-Control: no-store` + client cache-busting query param) to avoid stale empty responses from edge cache.
- Added resilient query fallback: if `expires_at` GraphQL selection fails/unavailable, the pipeline auto-falls back to `block_time` and reports source mode in debug.
- Added RPC-backed search augmentation for `/api/expiring-listings`: direct name searches (e.g., `usd.sui.ski`) now resolve via SuiNS and are included even when not listed on TradePort.

## CRITICAL: Always Deploy With Wrangler
- **After every change, run `npx wrangler deploy` first.**
- **Do not substitute this with other deploy commands in final verification steps.**
- Do not consider work complete until `npx wrangler deploy` has been executed and confirmed.

## Commands

### Development & Testing
```bash
npx wrangler deploy   # Deploy to Cloudflare (first step after changes)
bun run dev           # Start development server with hot reload
bun test              # Run all tests
bun test --watch      # Watch mode test runner
bun test src/utils/subdomain.test.ts  # Run single test file
bun run typecheck     # TypeScript type checking
bun run lint          # Biome linter (checks code style)
bun run lint:fix      # Auto-fix linting issues
bun run format        # Format code
```

### Single Test
To run a specific test: `bun test <path-to-test-file>`

**CRITICAL: Deployment Requirement**
- **You MUST run `npx wrangler deploy` every time you make changes, and it should be the first step after editing.**
- This ensures that the live environment reflects the latest updates immediately.
- Do not consider a task complete until the deployment command has been executed and confirmed.

**Post-change workflow:**
- **Run `npx wrangler deploy` immediately after making changes (MANDATORY).**
- Validation commands (`bun run typecheck`, `bun run lint`, `bun test`) are optional unless explicitly requested.

## Code Style

### Naming Conventions
- **Constants:** `UPPER_SNAKE` (e.g., `DEFAULT_TTL`, `CACHE_URL_PREFIX`)
- **Functions:** `camelCase` (e.g., `memGet`, `parseSubdomain`, `resolveSuiNS`)
- **Types/Interfaces:** `PascalCase` (e.g., `Env`, `ParsedSubdomain`, `SuiNSRecord`)
- **Variables:** `camelCase` (e.g., `memCache`, `networkOverride`)
- **Files:** `kebab-case` (e.g., `cache.ts`, `suins.ts`, `profile.ts`)

### Imports & Exports
- Use named imports and exports only (no default exports)
- Alphabetical imports within the same group
- Separate imports by empty lines: Node builtins → external packages → internal modules

### Formatting
- Indent with tabs (1 tab = 4 spaces)
- Single quotes for strings
- No semicolons
- Single-line lists do not need trailing commas
- Multi-line lists should have trailing commas

### Error Handling
```typescript
// Validate upfront
invariant(condition, `Expected ${expected}, got ${actual}`)

// Fail fast with actionable messages
throw new Error(`Failed to fetch: ${response.status}`)

// Try-catch with minimal logging
try {
  await fetch(...)
} catch (error) {
  console.log('Operation failed:', error)
  return null
}
```

### Type Safety
- Use `invariant` or type guards before unsafe operations
- Prefer optional chaining (`?.`) and nullish coalescing (`??`)
- Always handle errors (never silently ignore)
- Use `@ts-expect-error` for intentionally bypassed type checks

### Constants
- Extract magic values to named constants at module level
- Constants computed once, not in hot paths
- Use readonly for data structures that shouldn't mutate

### No Comments
Code must be self-documenting. Only add comments when:
- Explaining why (not what)
- Documenting complex algorithms
- JSDoc @param/@return for APIs

### Implementation Patterns
- Single-pass algorithms (avoid chained `.map().filter().reduce()`)
- Parallel independent async operations (`Promise.all`)
- Uint8Array for binary data internally
- Bitwise for byte conversion (no string intermediates)

### Testing
- Test filename: `source-file-name.test.ts` (same directory)
- Use Bun's built-in test framework
- One assertion per test
- Descriptive test names
- AAA pattern: Arrange, Act, Assert

## Project Structure

```
src/
├── index.ts              # Worker entry point
├── types.ts              # Shared TypeScript types
├── handlers/             # Request handlers by subdomain type
├── resolvers/            # Data resolution (SuiNS, MVR, IPFS, Walrus, RPC)
├── utils/                # Helper functions
└── sdk/                  # TypeScript SDK utilities
```

## Key Patterns

### Subdomain Routing
- Parse hostnames in `src/utils/subdomain.ts`
- Route types: `suins`, `content`, `rpc`, `root`, `mvr`, `app`, `dashboard`
- Network overrides: `.t.` prefix → testnet, `.d.` prefix → devnet

### SuiNS Resolution
- Primary: Surflux gRPC-Web (faster, proper protobuf)
- Fallback: SuiNS SDK via JSON-RPC
- Cache in-memory with 100-entry LRU

### Response Helpers
Use helper functions from `src/utils/response.ts`:
- `jsonResponse(data)`
- `htmlResponse(content)`
- `errorResponse(message, code, status)`
- `notFoundPage(subdomain, env, available)`

### Environment Variables
- Set in `wrangler.toml` (non-sensitive)
- Secrets via `wrangler secret put <NAME>` (sensitive keys)
- Network selection: `SUI_NETWORK`, `WALRUS_NETWORK`, `SEAL_NETWORK`

## Important Notes

1. **Vortex SDK:** NOT imported in worker (9MB > 3MB limit). Client-side SDK loaded from CDN.

2. **No console.log:** Use structured logging; errors logged to Cloudflare via `console.error`.

3. **Rate limiting:** RPC proxy enforces 100 req/min per IP.

4. **Grace period:** 30 days post-expiration before name becomes available.

5. **Security:** Only read-only RPC methods allowed (block writes like `sui_executeTransactionBlock`).

## TypeScript Version
Target: ES2022, strict mode enabled

## Progress Log (2026-02-15)
- Replaced `/grace` UI with a plain expiring-names feed (search, status filter, pagination only).
- `/grace` now reads `/api/grace-feed` (registrations feed), not `/api/expiring-listings` (listings feed).
- Extended `/api/grace-feed` response with `expired`, `inGracePeriod`, `daysSinceExpiry`, and `daysUntilGraceEnds`.
- Added `status` query support to `/api/grace-feed`: `all`, `expiring`, `grace`.
- Increased default feed horizon to `windowDays=3650` so non-imminent expirations are still tracked.
- Added cache-backed registration snapshot keys (`grace-feed-source-v2`, `grace-feed-snapshot-v2`) for rolling tracking.
- Added direct SuiNS resolve fallback for explicit name searches (e.g. `usd.sui.ski`) when missing from indexer scan.
- Fixed duplicate constant collision by renaming NFT activity cache constant to `NFT_ACTIVITY_CACHE_TTL`.
- Upgraded the profile/landing chat widget to initialize the official Sui Stack Messaging SDK client (`@mysten/messaging@0.3.0`) with Seal + Walrus config from `/api/app/subscriptions/config`.
- Added on-chain channel ingestion to the widget (`getChannelMemberships`, `getChannelMessages`, `executeSendMessageTransaction`) with safe fallback to existing `/api/app/messages/server/*` transport.
- Extended `/api/app/subscriptions/config` with explicit SDK/runtime fields (`seal.rpcUrl`, `sdk.messagingVersion`, `sdk.messagingPackageConfig`) and network-aware Walrus defaults.
- Fixed chat header control visibility by hiding `#wallet-widget` while the chat panel is open (`body.x402-chat-open`), and switched chat/badge visuals to square style.
- Mounted `x402ChatRoutes` at `/api/x402-chat/*` with root-domain guard so x402 chat APIs are now live.
- Added `/api/x402-chat/integrations` to publish Sui Stack Messaging SDK config, WebMCP proxy info, agent endpoint map, and x402 payment hints.
- Added `/api/x402-chat/webmcp` (+ wildcard) as a WebMCP proxy bridge that forwards payment headers and surfaces x402 response headers.
- Added `/api/x402-chat/agents/dispatch` and `/api/x402-chat/agents/webmcp/tool` for allowlisted agent dispatch + MCP tool calls with x402/webMCP header passthrough.
