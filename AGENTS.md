# Agent Guidelines for Sui-ski Gateway

Sui-ski is a Cloudflare Workers gateway serving the Sui blockchain ecosystem. It resolves wildcard subdomains (`*.sui.ski`) to route requests to SuiNS names, Move Registry packages, decentralized content (IPFS/Walrus), and provides a read-only RPC proxy.

## Core Architecture

### Subdomain Routing (`src/utils/subdomain.ts`)
| Pattern                      | Route Type | Handler                    |
| ---------------------------- | ---------- | -------------------------- |
| `sui.ski`                    | root       | Landing page, API routes   |
| `my.sui.ski`                 | dashboard  | User's names management    |
| `rpc.sui.ski`                | rpc        | JSON-RPC proxy             |
| `{name}.sui.ski`             | suins      | SuiNS profile resolution   |
| `{pkg}--{name}.sui.ski`      | mvr        | MVR package resolution     |
| `ipfs-{cid}.sui.ski`         | content    | Direct IPFS gateway        |
| `walrus-{blobId}.sui.ski`    | content    | Direct Walrus aggregator   |
| `app.sui.ski`                | app        | Messaging/chat application |
| `.t.` prefix                 | testnet    | Override to testnet        |
| `.d.` prefix                 | devnet     | Override to devnet         |

### Key Handlers
- `src/handlers/landing.ts` - Root domain + API routes (`/api/*`)
- `src/handlers/profile.ts` - SuiNS profile pages with grace period support
- `src/handlers/app.ts` - Messaging/chat WebSocket and REST APIs
- `src/handlers/dashboard.ts` - My Names dashboard at `my.sui.ski`
- `src/handlers/mcp.ts` - Model Context Protocol server for AI tools
- `src/resolvers/suins.ts` - SuiNS resolution via gRPC-Web + JSON-RPC fallback
- `src/resolvers/rpc.ts` - Read-only RPC proxy with rate limiting

### Bundle Constraints
- **Worker size limit: 3MB** (Cloudflare Workers)
- **Current bundle: ~5.5MB** - needs reduction
- **@mysten/sui is 42MB** - tree-shaken but still significant
- **zod + @modelcontextprotocol/sdk** add ~12MB combined

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

1. **No console.log:** Use structured logging; errors logged to Cloudflare via `console.error`.

2. **Rate limiting:** RPC proxy enforces 100 req/min per IP.

3. **Grace period:** 30 days post-expiration before name becomes available.

4. **Security:** Only read-only RPC methods allowed (block writes like `sui_executeTransactionBlock`).

## TypeScript Version
Target: ES2022, strict mode enabled

## Local SDK Dependencies

### Sui Stack Messaging SDK
**Path:** `/home/brandon/Dev/Contributor/sui-stack-messaging-sdk`

Local fork of `@mysten/messaging` for customization and mainnet support:
- Already updated to `@mysten/sui@^2.4.0`
- Built and ready at `packages/messaging/dist/`
- Use for client-side messaging operations (decentralized, no server intermediary)

**Key exports:**
```typescript
import { SuiStackMessagingClient, messaging } from '@mysten/messaging'
import { MAINNET_MESSAGING_PACKAGE_CONFIG, TESTNET_MESSAGING_PACKAGE_CONFIG } from '@mysten/messaging'
```

**Architecture principle:** Messaging is client-side only. The server:
- Serves static HTML/JS
- Provides SDK config (package IDs, Seal servers, Walrus endpoints)
- Does NOT store messages, resolve channels, or manage memberships

All channel operations go directly to Sui RPC + Walrus from the client.
