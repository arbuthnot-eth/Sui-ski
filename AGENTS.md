# Agent Guidelines for Sui-ski Gateway

This file contains instructions for AI agents working on this Cloudflare Workers project serving the Sui ecosystem.

## Commands

### Development & Testing
```bash
bun run dev           # Start development server with hot reload
bun test              # Run all tests
bun test --watch      # Watch mode test runner
bun test src/utils/subdomain.test.ts  # Run single test file
bun run typecheck     # TypeScript type checking
bun run lint          # Biome linter (checks code style)
bun run lint:fix      # Auto-fix linting issues
bun run format        # Format code
bun run deploy        # Deploy to Cloudflare
```

### Single Test
To run a specific test: `bun test <path-to-test-file>`

**Pre-commit checklist:**
- Run `bun run typecheck` (must pass)
- Run `bun run lint` (must pass, zero warnings)
- Run `bun test` (must pass)

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