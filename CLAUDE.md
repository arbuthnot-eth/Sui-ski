# CLAUDE.md

Instructions for AI assistants working on this codebase.

---

## Project Overview

**Sui-ski**: Cloudflare Worker gateway for the Sui blockchain ecosystem. Routes wildcard subdomains (`*.sui.ski`) to SuiNS name profiles, Move Registry packages, decentralized content (IPFS/Walrus), an encrypted messaging app, a read-only RPC proxy, and management UIs for SuiNS subdomains. Built with **Hono** on Cloudflare Workers.

**Directory Structure:**

```
src/
├── index.ts                      # Hono app entry point, CORS middleware, subdomain routing
├── types.ts                      # Shared TypeScript types (Env, ParsedSubdomain, etc.)
├── handlers/
│   ├── app.ts                    # Encrypted messaging app (chat, channels, agents, LLM proxy)
│   ├── black-diamond.ts          # Name watchlist API
│   ├── dashboard.ts              # "My Names" management UI
│   ├── grpc-proxy.ts             # gRPC backend proxy (config-only, no backend URL set)
│   ├── landing.ts                # Root domain landing page, pricing/resolve/status APIs
│   ├── profile.ts                # SuiNS profile page with grace period, OG images
│   ├── profile.css.ts            # Embedded CSS for profile pages
│   ├── register.ts               # Registration page for available names
│   ├── renewal.ts                # SuiNS renewal with x402 payment, Seal encryption
│   ├── subnamecap.ts             # SubnameCAP management API endpoints
│   ├── subnamecap-ui.ts          # SubnameCAP web UI
│   ├── subnamecap-ui.css.ts      # Embedded CSS for SubnameCAP UI
│   ├── suins-manager.ts          # SuiNS contract interaction APIs and pricing
│   ├── transaction.ts            # Transaction data fetch and SuiNS registration detection
│   ├── vault.ts                  # Seal-encrypted bookmark/blob storage API
│   ├── views.ts                  # Page view tracking API
│   └── wallet-api.ts             # Wallet session management (Durable Object backed)
├── resolvers/
│   ├── suins.ts                  # SuiNS name resolution via @mysten/suins + Surflux gRPC
│   ├── mvr.ts                    # Move Registry package lookup via on-chain dynamic fields
│   ├── content.ts                # IPFS gateway fallback + Walrus blob fetching
│   └── rpc.ts                    # JSON-RPC proxy with method allowlist + rate limiting
├── utils/
│   ├── subdomain.ts              # Subdomain parsing (hostname → route type)
│   ├── cache.ts                  # Dual-layer caching (in-memory + Cache API + KV fallback)
│   ├── response.ts               # HTTP response helpers (JSON, HTML, CORS, error pages)
│   ├── rpc.ts                    # RPC URL selection by network
│   ├── og-image.ts               # SVG and PNG OG image generation
│   ├── social.ts                 # Social meta tags, media URL normalization
│   ├── status.ts                 # Gateway status endpoint
│   ├── pricing.ts                # SuiNS registration price calculation (premium decay, NS discount)
│   ├── ns-price.ts               # NS token price from DeepBook orderbook
│   ├── premium.ts                # Grace period premium calculation (exponential decay)
│   ├── pyth-price-info.ts        # Pyth oracle price feed lookup
│   ├── suins-object.ts           # SuiNS object querying
│   ├── sui-client.ts             # Sui client exports
│   ├── surflux-client.ts         # Surflux HTTP client wrapper
│   ├── surflux-grpc.ts           # Surflux gRPC-Web name resolution
│   ├── grpc-client.ts            # gRPC client wrapper
│   ├── subnamecap-queries.ts     # SubnameCAP RPC queries (fetch caps, active caps)
│   ├── subnamecap-transactions.ts # SubnameCAP transaction builders
│   ├── black-diamond.ts          # Watchlist transaction builders
│   ├── ika-transactions.ts       # IKA dWallet transaction builders
│   ├── swap-transactions.ts      # Token swap transaction builders
│   ├── transactions.ts           # Generic transaction relay
│   ├── vault.ts                  # Vault storage constants and key builders
│   ├── wallet-session-js.ts      # Client-side wallet session script generation
│   ├── x402-middleware.ts        # HTTP 402 payment middleware
│   └── x402-sui.ts               # X402 payment requirement builder
├── sdk/
│   ├── index.ts                  # SDK exports (provers, messaging, MVR resolver)
│   ├── types.ts                  # Privacy protocol types (Note, Commitment, Proof)
│   ├── messaging-client.ts       # Encrypted messaging client (Seal + SuiNS + signing)
│   ├── messaging-client-browser.ts # Browser-specific messaging wrapper
│   ├── messaging-client.test.ts  # Messaging client tests
│   ├── mvr-resolver.ts           # MVR package name parser and resolver with caching
│   ├── mvr-resolver.test.ts      # MVR resolver tests
│   ├── groth16/prover.ts         # Groth16 zero-knowledge proof generation
│   ├── ligetron/prover.ts        # Ligetron zkVM witness computation
│   ├── types/snarkjs.d.ts        # SnarkJS type definitions
│   └── utils/
│       ├── encryption.ts         # Message encryption/decryption
│       ├── merkle.ts             # Merkle tree implementation
│       └── poseidon.ts           # Poseidon hash function
├── client/
│   └── wallet-session.ts         # Client-side wallet session API wrapper
├── config/
│   └── subnamecap.ts             # SubnameCAP configuration constants
├── durable-objects/
│   └── wallet-session.ts         # Cloudflare Durable Object for wallet sessions (SQLite)
└── index.test.ts                 # Subdomain parsing tests

contracts/                        # Move smart contracts (7 packages)
├── black_diamond/                # Name watchlist/auction tracking
├── bounty_escrow/                # Escrow for bounty payouts
├── decay_auction/                # Premium name auction with exponential decay
├── mvr/                          # Move Registry on-chain package metadata
├── private/                      # Privacy protocol (Ligetron + Groth16)
├── seal_messaging/               # Encrypted messaging using Seal protocol
└── upgrade_cap_transfer/         # Capability transfer utilities

proxy/                            # Surflux gRPC-to-HTTP proxy service
├── src/index.ts                  # Worker entry point
├── api/                          # Lookup, reverse, health endpoints
├── protos/                       # Protocol Buffer definitions
└── fly.toml / render.yaml        # Deploy configs (Fly.io, Render)

backend/                          # Backend server (separate Node.js/Bun app)
├── src/server.ts                 # Server entry point
└── docker-compose.yml            # Container orchestration

scripts/                          # Deployment and utility scripts
├── full-deploy.sh                # Complete deployment
├── deploy-messaging-mainnet.sh   # Mainnet messaging deployment
├── set-suins-contenthash.ts      # Update SuiNS content hash
├── extract-suins-object.ts       # Extract SuiNS object info
└── transfer-upgrade-cap-from-nft.ts

docs/                             # Extended documentation
├── WALLET_SESSION.md             # Durable Objects for wallet sessions
├── MESSAGING_SDK.md              # Messaging with Seal + Walrus
├── LIGETRON_INTEGRATION.md       # Ligetron zkVM + Groth16 hybrid proving
├── MVR_COMPATIBILITY.md          # MVR package resolution strategies
├── MVR_IMPROVEMENTS.md           # MVR subdomain management and versioning
├── SUI_TRANSACTION_BUILDING.md   # Sui PTB patterns and examples
└── SUI_STACK_SYSTEM_DIAGRAM.md   # Full Sui ecosystem architecture diagram
```

---

## Agent Behavior

How to approach tasks in this codebase.

### Task Execution

1. **Understand first** - Read relevant files before making changes
2. **Verify assumptions** - Check existing patterns in the codebase
3. **Incremental changes** - Small, testable changes over large refactors
4. **Validate after changes** - Run build and tests before completing

### Decision Framework

**Ask for clarification when:**

- Requirements are ambiguous
- Multiple valid approaches exist with significant tradeoffs
- Changes affect public APIs or interfaces
- Unsure about business logic intent

**Proceed autonomously when:**

- Task is well-defined
- Following established codebase patterns
- Changes are easily reversible
- Standard refactoring or bug fixes

### Change Principles

1. **Minimize blast radius** - Touch only what's necessary
2. **Preserve patterns** - Match existing code style and architecture
3. **No surprise dependencies** - Discuss before adding new packages
4. **Single responsibility** - One logical change per commit

---

## Universal Rules

These rules apply to ALL code in this project.

### Code Quality

1. **No comments** - Code must be self-documenting through clear naming
2. **No TODOs/FIXMEs** - Complete implementations before committing
3. **No dead code** - Delete unused code; git has history
4. **No magic values** - Use named constants
5. **No ignored errors** - Handle or propagate every error
6. **No re-exports** - Use `export` directly on declarations

### Implementation Standards

Write optimal code on the first attempt. These patterns are non-negotiable.

1. **Bitwise for byte conversion** - No string intermediates

   ```typescript
   // ✓ Direct bitwise (little-endian bytes to bigint)
   let result = 0n;
   for (let i = bytes.length - 1; i >= 0; i--) {
     result = (result << 8n) | BigInt(bytes[i]);
   }

   // ✗ String intermediates
   const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
   return BigInt('0x' + hex);
   ```

2. **Single-pass algorithms** - One iteration, not chained methods

   ```typescript
   // ✓ Single pass
   let sum = 0;
   for (const x of arr) sum += x * 2;

   // ✗ Multiple passes
   arr.map(x => x * 2).reduce((a, b) => a + b, 0);
   ```

3. **Parallel when independent** - Don't await sequentially

   ```typescript
   // ✓ Parallel
   const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);

   // ✗ Sequential when independent
   const a = await fetchA();
   const b = await fetchB();
   const c = await fetchC();
   ```

4. **Pre-compute constants** - Move computation out of hot paths

   ```typescript
   // ✓ Compute once
   const VALIDATOR = buildValidator();
   const validate = (data: Data) => VALIDATOR.check(data);

   // ✗ Recompute every call
   const validate = (data: Data) => buildValidator().check(data);
   ```

5. **Uint8Array for binary** - `number[]` only at serialization boundaries

   ```typescript
   // ✓ Internal binary storage
   readonly #bytes: Uint8Array;

   // ✗ Array for internal binary
   readonly #bytes: number[];
   ```

6. **Actionable errors** - Include what failed AND what's expected

   ```typescript
   // ✓ Actionable
   invariant(bytes.length === 32, `Expected 32 bytes, got ${bytes.length}`);

   // ✗ Vague
   invariant(bytes.length === 32, 'Invalid length');
   ```

7. **Fail fast** - Validate inputs at function entry

   ```typescript
   // ✓ Validate upfront
   const process = (order: Order) => {
     invariant(order.items.length > 0, 'Order must have items');
     invariant(order.total > 0, 'Total must be positive');
     // ... logic
   };
   ```

8. **Typed errors** - Structured errors, not ad-hoc strings

   ```typescript
   // ✓ Typed
   class ValidationError extends Error {
     constructor(public field: string, public reason: string) {
       super(`${field}: ${reason}`);
     }
   }

   // ✗ String errors
   throw new Error('validation failed');
   ```

### Naming Conventions

| Type       | Convention    | Example                      |
| ---------- | ------------- | ---------------------------- |
| Constants  | `UPPER_SNAKE` | `MAX_RETRIES`, `API_TIMEOUT` |
| Functions  | `camelCase`   | `fetchUser`, `parseResponse` |
| Types      | `PascalCase`  | `UserProfile`, `ApiResponse` |
| Variables  | `camelCase`   | `userName`, `isValid`        |
| Files      | `kebab-case`  | `user-profile.ts`            |
| Test files | source + `.test` | `user-profile.test.ts`    |

### Security

1. **Validate inputs** - At system boundaries
2. **No hardcoded secrets** - Use environment variables
3. **Defensive copies** - Return `new Uint8Array(this.#bytes)`, not `this.#bytes`
4. **Bounds checking** - Use `bigint` for large numbers, validate ranges

---

## Anti-Patterns

Patterns to actively avoid.

### Universal

- ❌ Catching errors without handling or re-throwing
- ❌ Mutable state in module scope
- ❌ `console.log` in production (use structured logging)
- ❌ Mixing concerns in single functions

### TypeScript

- ❌ `as any` or `@ts-ignore` to bypass type errors
- ❌ `export { x }` at end of file (export inline instead)
- ❌ Optional chaining without handling undefined case
- ❌ Non-null assertion `!` without invariant

---

## Testing Philosophy

### Principles

1. **One assertion per test** - Multiple focused tests over one large test
2. **Descriptive names** - `test_withdraw_fails_when_balance_insufficient`
3. **AAA pattern** - Arrange, Act, Assert
4. **Test behavior, not implementation** - Focus on inputs and outputs

### What to Test

| Priority | What                                       |
| -------- | ------------------------------------------ |
| Always   | Public APIs, edge cases, error conditions  |
| Usually  | Complex private helpers, state transitions |
| Never    | Trivial getters, framework internals       |

### Test Files

| File                            | Covers                        |
| ------------------------------- | ----------------------------- |
| `src/index.test.ts`             | Subdomain parsing logic       |
| `src/sdk/messaging-client.test.ts` | Messaging client           |
| `src/sdk/mvr-resolver.test.ts`  | MVR name resolution           |

---

## TypeScript

### Commands

```bash
bun install               # Install dependencies
bun run dev               # Development server (Wrangler dev with hot reload)
bun test                  # Run tests (Bun test runner)
bun test --watch          # Watch mode
bun test src/index.test.ts  # Single file
bun run typecheck         # Type checking only (tsc --noEmit)
bun run lint              # Check for issues (Biome)
bun run lint:fix          # Auto-fix issues
bun run format            # Format code (Biome)
bun run deploy            # Deploy to Cloudflare
bun run tail              # Stream live logs
bun run set:contenthash   # Update SuiNS content hash
```

### Formatter & Linter (Biome)

| Setting         | Value           |
| --------------- | --------------- |
| Indent style    | Tabs            |
| Line width      | 100             |
| Quote style     | Single quotes   |
| Semicolons      | As needed       |
| Unused imports  | Error           |
| Unused variables| Error           |
| Non-null assertion | Warn         |

### Type Naming

| Pattern             | Suffix            | Example                       |
| ------------------- | ----------------- | ----------------------------- |
| Constructor args    | `ConstructorArgs` | `ClientConstructorArgs`       |
| Method args         | `Args`            | `FetchUserArgs`               |
| External API shapes | `Raw`             | `UserRaw`, `OrderResponseRaw` |
| Internal types      | (none)            | `User`, `Order`               |
| Events              | (past tense)      | `UserCreated`, `OrderPlaced`  |
| Configuration       | `Config`          | `ApiConfig`                   |
| Options             | `Options`         | `FetchOptions`                |

### Class Pattern

```typescript
import invariant from 'tiny-invariant';
import { API_URL, TIMEOUT_MS } from './constants';
import type { ConstructorArgs, FetchUserArgs, User, UserRaw } from './client.types';

export class ApiClient {
  static parseUser(raw: UserRaw): User {
    return {
      id: raw.id,
      name: raw.user_name,
      createdAt: new Date(raw.created_at),
    };
  }

  readonly #baseUrl: string;
  readonly #timeout: number;

  constructor({ baseUrl = API_URL, timeout = TIMEOUT_MS }: ConstructorArgs = {}) {
    this.#baseUrl = baseUrl;
    this.#timeout = timeout;
  }

  async fetchUser({ userId }: FetchUserArgs): Promise<User> {
    const response = await fetch(`${this.#baseUrl}/users/${userId}`, {
      signal: AbortSignal.timeout(this.#timeout),
    });
    invariant(response.ok, `Fetch failed: ${response.status}`);
    return ApiClient.parseUser(await response.json());
  }
}
```

### Value Object Pattern

```typescript
export class Address {
  static readonly LENGTH = 32;
  static readonly ZERO = new Address(new Uint8Array(Address.LENGTH));

  static fromHex(hex: string): Address {
    const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
    invariant(normalized.length === Address.LENGTH * 2, `Invalid hex length: ${normalized.length}`);
    const bytes = new Uint8Array(Address.LENGTH);
    for (let i = 0; i < Address.LENGTH; i++) {
      bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
    }
    return new Address(bytes);
  }

  readonly #bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    invariant(bytes.length === Address.LENGTH, `Expected ${Address.LENGTH} bytes, got ${bytes.length}`);
    this.#bytes = bytes;
  }

  equals(other: Address): boolean {
    return this.#bytes.every((b, i) => b === other.#bytes[i]);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.#bytes);
  }

  toHex(): string {
    return '0x' + Array.from(this.#bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  toString(): string {
    return this.toHex();
  }

  toJSON(): string {
    return this.toHex();
  }
}
```

### Import Order

```typescript
// 1. Node builtins
import { readFileSync } from 'fs';

// 2. External packages (alphabetized)
import axios from 'axios';
import invariant from 'tiny-invariant';

// 3. Internal imports (alphabetized)
import { API_URL } from './constants';
import type { User } from './types';
```

### Recommended Packages

| Package          | Purpose            |
| ---------------- | ------------------ |
| `tiny-invariant` | Runtime assertions |
| `zod`            | Schema validation  |
| `ky`             | HTTP client        |
| `vitest`         | Testing            |

---

## Git Conventions

### Commit Format

```
emoji type(scope): subject
```

### Types

| Emoji | Type     | Use For            |
| ----- | -------- | ------------------ |
| ✨    | feat     | New feature        |
| 🐛    | fix      | Bug fix            |
| 📝    | docs     | Documentation      |
| ♻️    | refactor | Code restructure   |
| ⚡    | perf     | Performance        |
| ✅    | test     | Tests              |
| 📦    | build    | Build/dependencies |
| 🔧    | chore    | Maintenance        |

### Examples

```
✨ feat(auth): add OAuth2 login
🐛 fix(api): handle null response
♻️ refactor(db): extract connection pool
📦 build(deps): update axios to 1.7.0
```

### Rules

- Lowercase subject
- No period at end
- One logical change per commit

---

## Pre-Commit Checklist

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes (zero warnings)
- [ ] `bun test` passes
- [ ] No `any` or `@ts-ignore`
- [ ] Commit message follows format
- [ ] Single logical change
- [ ] No secrets committed

---

## Project Configuration

### Framework

**Hono** (`^4.11.7`) is the HTTP framework. The app is a `Hono<AppEnv>` instance with typed bindings for Cloudflare Workers. Middleware handles CORS preflight, subdomain parsing, and network override injection.

### Cloudflare Bindings

| Binding           | Type            | Purpose                           |
| ----------------- | --------------- | --------------------------------- |
| `CACHE`           | KV Namespace    | Name resolution and content cache |
| `WALLET_SESSIONS` | Durable Object  | Persistent wallet sessions (SQLite) |

### Environment Variables

`wrangler.toml` defines:

```bash
SUI_NETWORK=mainnet|testnet|devnet   # Active Sui network
SUI_RPC_URL=                          # Sui fullnode endpoint (secret)
WALRUS_NETWORK=mainnet|testnet        # Walrus network
SEAL_NETWORK=testnet                  # Seal uses testnet (open key servers)
SEAL_PACKAGE_ID=                      # Seal contract address
SEAL_KEY_SERVERS=                     # Comma-separated key server object IDs
SERVICE_FEE_NAME=brando.sui           # NS token fee recipient
DISCOUNT_RECIPIENT_NAME=extra.sui     # NS discount recipient
LLM_API_KEY=                          # LLM provider API key (secret)
SURFLUX_API_KEY=                      # Surflux gRPC API key (secret)
BRAVE_SEARCH_API_KEY=                 # Brave search API key (secret)
INDEXER_API_KEY=                      # Indexer API key (secret)
```

SuiNS/SubnameCAP package IDs, jacket package IDs, decay auction, and black diamond package IDs are also configured as environment variables. See `wrangler.toml` for the full list.

Network selection uses environment overrides or hostname prefixes (`*.t.sui.ski` for testnet, `*.d.sui.ski` for devnet).

### Worker Routes

```
*.sui.ski/*       # Mainnet wildcard
sui.ski/*         # Mainnet root
*.t.sui.ski/*     # Testnet wildcard
t.sui.ski/*       # Testnet root
*.d.sui.ski/*     # Devnet wildcard
d.sui.ski/*       # Devnet root
```

### Dependencies

| Package                       | Purpose                         |
| ----------------------------- | ------------------------------- |
| `hono`                        | HTTP framework for Workers      |
| `@mysten/sui`                 | Sui TypeScript SDK              |
| `@mysten/suins`               | SuiNS client                    |
| `@mysten/walrus`              | Walrus blob storage client      |
| `@mysten/deepbook-v3`         | DeepBook AMM (pricing)          |
| `@noble/hashes`               | Cryptographic hash functions    |
| `@bufbuild/protobuf`          | Protocol Buffers runtime        |
| `@connectrpc/connect-web`     | gRPC-Web client                 |

**Dev Dependencies:**

| Package                       | Purpose                         |
| ----------------------------- | ------------------------------- |
| `wrangler`                    | Cloudflare Workers CLI          |
| `typescript`                  | Type checking                   |
| `@biomejs/biome`              | Linter and formatter            |
| `@cloudflare/workers-types`   | Worker type definitions         |
| `@types/bun`                  | Bun runtime types               |

**Note:** The Vortex SDK (`@interest-protocol/vortex-sdk`) is NOT imported in the worker due to its 9MB size exceeding Cloudflare's 3MB limit. The gateway proxies Vortex API requests; the SDK should be loaded client-side from CDN.

---

## Subdomain Routing

The gateway parses hostnames to determine routing. All patterns support optional network prefixes (`t.` for testnet, `d.` for devnet).

| Pattern                        | Route Type  | Handler                        |
| ------------------------------ | ----------- | ------------------------------ |
| `sui.ski`                      | `root`      | Landing page + API endpoints   |
| `rpc.sui.ski`                  | `rpc`       | JSON-RPC proxy                 |
| `app.sui.ski`                  | `app`       | Encrypted messaging app        |
| `my.sui.ski`                   | `dashboard` | Name management dashboard      |
| `msg.sui.ski`                  | `messaging` | Messaging protocol endpoint    |
| `{name}.sui.ski`               | `suins`     | SuiNS profile resolution       |
| `{pkg}--{name}.sui.ski`        | `mvr`       | MVR package (latest version)   |
| `{pkg}--{name}--v{n}.sui.ski`  | `mvr`       | MVR package (specific version) |
| `ipfs-{cid}.sui.ski`           | `content`   | Direct IPFS gateway            |
| `walrus-{blobId}.sui.ski`      | `content`   | Direct Walrus blob             |

Additional path-based routes on the root domain:

| Path                   | Handler                              |
| ---------------------- | ------------------------------------ |
| `/api/wallet/*`        | Wallet session management            |
| `/api/subnamecap/*`    | SubnameCAP transaction builders      |
| `/api/black-diamond/*` | Name watchlist operations            |
| `/api/vault/*`         | Encrypted vault storage              |
| `/api/app/*`           | Messaging app API                    |
| `/api/agents/*`        | Agent registry and SubnameCAP agents |
| `/api/ika/*`           | IKA dWallet operations               |
| `/api/llm/*`           | LLM completion proxy                 |
| `/api/pricing`         | Registration price calculation       |
| `/api/ns-price`        | NS/SUI exchange rate                 |
| `/api/usdc-price`      | USDC/SUI price                       |
| `/api/deepbook-pools`  | DeepBook liquidity data              |
| `/api/renewal-pricing` | Renewal cost calculation             |
| `/api/suins/contracts` | SuiNS contract addresses             |
| `/api/views/{name}`    | Page view counter                    |
| `/resolve?name=...`    | SuiNS resolution API                 |
| `/status`              | Gateway health status                |
| `/subnamecap`          | SubnameCAP management UI             |
| `/app`, `/app/*`       | Messaging app (root domain access)   |
| `/walrus/{id}`         | Walrus content (path-based)          |
| `/ipfs/{id}`           | IPFS content (path-based)            |
| `/og/{name}.svg`       | Profile OG image                     |
| `/favicon.svg`         | Favicon                              |
| `/og-image.svg`        | Brand OG image (SVG)                 |
| `/og-image.png`        | Brand OG image (PNG)                 |

---

## Key Architecture Patterns

### Subdomain Parsing Middleware

Every request passes through two Hono middleware layers:
1. **CORS** - Handles OPTIONS preflight with permissive headers
2. **Subdomain parser** - Extracts `ParsedSubdomain` from hostname, applies network overrides, sets Hono context variables (`parsed`, `hostname`, `env`)

The `X-Host` header or `?host=` query parameter can override the hostname for testing.

### Dual-Layer Caching

The caching system (`src/utils/cache.ts`) uses:
1. **In-memory cache** - LRU-style with configurable max entries (~100)
2. **Cache API** - Cloudflare edge cache
3. **KV fallback** - Persistent storage with TTL

### Transaction Building Pattern

The gateway generates unsigned PTBs (Programmable Transaction Blocks) for client-side signing. Transaction builders in `src/utils/` construct `Transaction` objects and serialize them as base64 for the client to sign and submit.

### Durable Objects

`WalletSession` is a Cloudflare Durable Object using SQLite for persistent wallet session storage. It handles connect, check, and disconnect operations.

---

## SuiNS Integration

[SuiNS (Sui Name Service)](https://docs.suins.io/developer) is a decentralized naming service on the Sui blockchain that enables users to replace complex wallet addresses with human-readable names.

### Resolution Types

SuiNS supports two types of resolution:

- **Lookup:** A name can point to an address or an object (target address). This allows you to resolve a name like `example.sui` to its target address.
- **Reverse lookup:** An address can have a default name. This allows you to find the name associated with a particular address.

### Address Types

Lookups work with different types of addresses:

- **Target address:** The address that a SuiNS name resolves to. For example, `example.sui` might point to `0x2`, making `0x2` the target address for `example.sui`. Lookup resolution retrieves this information.
- **Default address:** The SuiNS name that the owner of a particular address has selected to represent that address. For example, if you own `0x2` you can make `example.sui` its default address. The owner must sign and execute a set default transaction to establish this connection. The default address resets anytime the target address changes. Reverse lookup resolution retrieves this name.

### SuiNS NFT Ownership

Do not use ownership of a SuiNS NFT as a resolution method. An NFT is used as the key (capability) to change the target address, but should not be used to identify any name with an address.

SuiNS NFT ownership allows any address to be set as the target address. So, the `example.sui` address used in the previous section can point to any address, not just `0x2`. Consequently, when you want to display default addresses, you should trust the default address over target address because it is guaranteed on chain.

### Active Constants

**Mainnet:**
- SuiNS Core V3: `0x00c2f85e07181b90c140b15c5ce27d863f93c4d9159d2a4e7bdaeb40e286d6f5`
- SuiNS Core V2: `0xb7004c7914308557f7afbaf0dca8dd258e18e306cb7a45b28019f3d0a693f162`
- SuiNS Core V1: `0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0`
- SuiNS Core Object: `0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871`

**Testnet:**
- SuiNS Core: `0x22fa05f21b1ad71442491220bb9338f7b7095fe35000ef88d5400d28523bdd93`
- SuiNS Core Object: `0x300369e8909b9a6464da265b9a5a9ab6fe2158a040e84e808628cde7a07ee5a3`

For the complete list of active packages and objects, see the [SuiNS Developer Documentation](https://docs.suins.io/developer#addresses).

### Integration Methods

- **Off-chain resolution:** Use available Sui API endpoints (JSON-RPC or GraphQL). For GraphQL's default name resolution, use the `defaultSuinsName` field.
- **On-chain resolution:** Use the SuiNS core package. Add the appropriate dependency in your `Move.toml` file depending on which network you are targeting.

### Gateway Resolution Flow

1. Parse subdomain from hostname (`{name}.sui.ski` → `name`)
2. Check dual-layer cache (memory → Cache API → KV)
3. Resolve via `@mysten/suins` SDK or Surflux gRPC
4. Handle grace period (30-day window after expiration with premium pricing)
5. Return profile page, JSON data, or proxy to IPFS/Walrus content

---

## RPC Proxy Security

The RPC proxy at `rpc.sui.ski` only allows read-only methods. Write operations (`sui_executeTransactionBlock`, etc.) are blocked. Rate limiting is 100 requests/minute per IP. Batch requests are supported with individual method validation.

---

## Encrypted Messaging App

The messaging app (`app.sui.ski` or `sui.ski/app`) provides encrypted communication:

- **1:1 direct messages** with Seal envelope encryption
- **Group channels** with access control
- **News/broadcast channels**
- **Agent marketplace** integration with LLM proxy
- **Message signing** with Ed25519/secp256k1/secp256r1
- **Nonce replay protection** and conversation deduplication
- **Max message size:** 1MB

The app handler (`src/handlers/app.ts`) manages conversations, message routing, and agent interactions. The SDK (`src/sdk/messaging-client.ts`) provides the client-side encryption and signing logic.

---

## SubnameCAP System

SubnameCAP (Subdomain Capability) allows creating and managing subdomains under SuiNS names with constraint enforcement:

- **Fee jackets** - Require payment for subdomain creation
- **Allowlist jackets** - Restrict who can create subdomains
- **Rate limit jackets** - Throttle subdomain creation
- **Single-use jackets** - One-time subdomain creation
- **Decay auction** - Premium pricing with exponential decay for high-value subnames

Configuration constants are in `src/config/subnamecap.ts`. Transaction builders are in `src/utils/subnamecap-transactions.ts`. Query helpers are in `src/utils/subnamecap-queries.ts`.

---

## MVR Registry Integration

[Move Registry (MVR)](https://www.moveregistry.com/apps) provides uniform naming for Sui packages. Reference packages and types by name in PTBs; MVR resolves addresses across networks. Supports Mainnet and Testnet.

**Name Format:** `@{suins_name}/{package_name}` or `{suins_name}.sui/{package_name}`
- With version: `@myname/mypackage/2` (resolves to specific on-chain version)
- Without version: defaults to latest

**Gateway Subdomain Patterns:**
- `core--suifrens.sui.ski` → `@suifrens/core`
- `nft--myname--v2.sui.ski` → `@myname/nft/2`

**SDK Resolver:** `src/sdk/mvr-resolver.ts` provides a caching resolver that parses MVR names and resolves them to on-chain package addresses via dynamic field lookup.

See `docs/MVR_IMPROVEMENTS.md` and `docs/MVR_COMPATIBILITY.md` for detailed documentation.

### MVR TypeScript SDK

The `namedPackagesPlugin` from `@mysten/sui` (v1.25.0+) streamlines PTB construction by resolving MVR names to addresses with runtime caching.

**Public Endpoints:**
- Mainnet: `https://mainnet.mvr.mystenlabs.com`
- Testnet: `https://testnet.mvr.mystenlabs.com`

**Global Registration:**
```typescript
import { namedPackagesPlugin, Transaction } from '@mysten/sui/transactions';

const plugin = namedPackagesPlugin({ url: 'https://mainnet.mvr.mystenlabs.com' });
Transaction.registerGlobalSerializationPlugin('namedPackagesPlugin', plugin);
```

**Per-Transaction Registration:**
```typescript
const mainnetPlugin = namedPackagesPlugin({
  url: 'https://mainnet.mvr.mystenlabs.com'
});
const transaction = new Transaction();
transaction.addSerializationPlugin(mainnetPlugin);
```

**With Overrides (local dev/custom caching):**
```typescript
const overrides = {
  packages: { '@suifrens/accessories': '0xe177...' },
  types: { '@suifrens/core::suifren::SuiFren': '0x8894...' }
};
const plugin = namedPackagesPlugin({ url: '<endpoint>', overrides });
```

**Alternative:** Consider `@mysten/mvr-static` for build-time static resolution (better performance, no runtime API calls).

### MVR CLI

Command-line tool for managing Move project dependencies with the Move Registry.

**Installation:**
```bash
cargo install --locked --git https://github.com/mystenlabs/mvr --branch release mvr
```

**Adding Dependencies:**
```bash
mvr add <package_name> --network <mainnet|testnet>
```

This updates `Move.toml`:
```toml
[dependencies]
app = { r.mvr = "@mvr/app" }

[r.mvr]
network = "mainnet"
```

**Building:** Standard `sui move build` automatically invokes MVR dependency resolution.

---

## Sui Transaction Building

This project uses the `Transaction` class from `@mysten/sui/transactions`:

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();
const [coin] = tx.splitCoins(tx.gas, [100]);
tx.transferObjects([coin], '0xRecipientAddress');
```

See `docs/SUI_TRANSACTION_BUILDING.md` for comprehensive documentation.

---

## Privacy Protocol (SDK)

The SDK includes two ZK proving systems for privacy:

- **Groth16 prover** (`src/sdk/groth16/prover.ts`) - Zero-knowledge proof generation using SnarkJS
- **Ligetron prover** (`src/sdk/ligetron/prover.ts`) - Hybrid zkVM witness computation
- **Supporting utilities** - Poseidon hash, Merkle trees, message encryption

The `private/` contract implements the on-chain privacy protocol. See `docs/LIGETRON_INTEGRATION.md` for architecture details.

---

## Vortex Privacy Protocol

The gateway integrates with [Vortex](https://github.com/interest-protocol/vortex), a privacy protocol for confidential transactions on Sui using zero-knowledge proofs.

**Architecture:** Server-side proxies API requests (no SDK import). Client-side loads SDK from CDN for ZK proof generation.

**API Endpoints** (`/api/vortex/*`):
- `GET /api/vortex/info` - Protocol overview (local)
- `GET /api/vortex/health` - Service health check
- `GET /api/vortex/pools` - List privacy pools
- `GET /api/vortex/pools/{coinType}` - Pool details
- `GET /api/vortex/relayer` - Relayer information
- `GET /api/vortex/commitments?coinType=...&index=0` - Get commitments
- `POST /api/vortex/merkle-path` - Merkle path for proof generation
- `GET /api/vortex/accounts?hashedSecret=...` - Accounts by hashed secret

**Client-Side SDK:**
```html
<script src="https://unpkg.com/@interest-protocol/vortex-sdk"></script>
<script>
  const { VortexAPI, Vortex } = window.VortexSDK;
  const api = new VortexAPI({ apiUrl: '/api/vortex' });
</script>
```

---

## Seal Decentralized Secrets Management

[Seal](https://github.com/MystenLabs/seal) is a decentralized secrets management (DSM) service for encrypting sensitive data stored on Walrus or other on/off-chain storage, with access controlled by onchain policies on Sui.

The gateway uses Seal for:
- **Messaging encryption** - End-to-end encrypted messages via `seal_messaging` contract
- **Vault storage** - Encrypted bookmarks/blobs
- **Renewal operations** - Payment-gated encrypted data

Currently configured to use **testnet** key servers (open mode, no registration required).

### Architecture

Seal uses **Identity-Based Encryption (IBE)** with a two-component design:

1. **Onchain Access Policies (Sui Move)**: Packages control IBE identity subdomains prefixed with their package ID (`[PkgId]*`), defining authorization through `seal_approve` functions
2. **Offchain Key Servers**: Independent services each holding an IBE master secret key, deriving keys only when onchain policies approve requests

### Cryptographic Primitives

| Component | Implementation |
| --------- | -------------- |
| IBE Scheme | Boneh-Franklin with BLS12-381 |
| Symmetric (browser) | AES-256-GCM |
| Symmetric (onchain) | HMAC-based CTR mode |
| Threshold | t-out-of-n across key servers |

### SDK Usage

```typescript
import { SealClient, SessionKey } from '@mysten/seal';
import { fromHEX } from '@mysten/bcs';

const client = new SealClient({
  suiClient,
  serverConfigs: serverObjectIds.map((id) => ({ objectId: id, weight: 1 })),
  verifyKeyServers: true,
});

const { encryptedObject, key } = await client.encrypt({
  threshold: 2,
  packageId: fromHEX(packageId),
  id: fromHEX(policyId),
  data: plaintext,
});

const sessionKey = await SessionKey.create({
  address: suiAddress,
  packageId: fromHEX(packageId),
  ttlMin: 10,
  suiClient,
});

const tx = new Transaction();
tx.moveCall({
  target: `${packageId}::module::seal_approve`,
  arguments: [tx.pure.vector('u8', fromHEX(policyId))],
});

const decrypted = await client.decrypt({
  data: encryptedObject,
  sessionKey,
  txBytes: await tx.build({ client: suiClient }),
});
```

### Move Access Control

Define `seal_approve` entry functions to control decryption access:

```move
module example::access;

public entry fun seal_approve(id: vector<u8>, ctx: &TxContext) {
    let caller = ctx.sender();
    assert!(is_authorized(caller, id), ENotAuthorized);
}
```

**Requirements:**
- First parameter: requested identity (excluding package ID prefix)
- Must abort if access denied (no return value)
- Side-effect free (cannot modify onchain state)
- Use non-public entry functions for versioning flexibility

### Access Control Patterns

| Pattern | Use Case |
| ------- | -------- |
| **Allowlist** | Share with defined group; membership changes affect future decryptions |
| **Subscription** | Time-limited access with passes; no re-encryption needed |
| **Time-Locked** | Auto-unlock at specific time; useful for auctions, coordinated reveals |
| **NFT/Owned** | Single owner controls access; transfer changes custody |

### Security Considerations

- **Threshold misconfiguration** can cause permanent data loss if too many key servers become unavailable
- **Key server trust** is critical; vet providers and establish SLAs
- **Decryption keys** are exposed client-side; no onchain audit trail of key delivery
- **Envelope encryption** recommended for large/sensitive data: encrypt with symmetric key, use Seal to manage that key

### Best Practices

1. Use envelope encryption for large payloads
2. Vet key server providers with business agreements
3. Implement audit logging for key access events
4. Avoid access policies relying on frequently changing state (full nodes may observe different chain versions)

---

## Nautilus TEE Framework

[Nautilus](https://github.com/MystenLabs/nautilus) enables verifiable offchain computation using Trusted Execution Environments (TEEs). Mainnet launch: June 5, 2025.

### Architecture

Two integrated components:
1. **Offchain Server (TEE)**: Runs inside AWS Nitro Enclave, handles user inputs, scheduled tasks, and private computation
2. **Onchain Contract (Move)**: Verifies TEE attestations before accepting computation results

### Attestation Flow

1. Deploy offchain server to self-managed TEE
2. TEE generates cryptographic attestation (proves execution environment integrity)
3. Submit computation result + attestation to Sui
4. Move contract verifies attestation against provider's root of trust
5. Accept output only if attestation valid

### Nautilus + Seal Integration

Solves the problem of TEEs losing secrets on restart/migration:
- Seal stores long-term encryption keys
- Seal grants key access only to properly attested TEEs
- Nautilus handles computation over encrypted data
- Seal controls who can decrypt results

### Use Cases

- Private AI model inference
- Federated learning coordination
- ZK-ML proof generation
- High-cost offchain computation

---

## Walrus Decentralized Storage

[Walrus](https://docs.wal.app) is a decentralized blob storage network using Red Stuff 2D erasure coding. Mainnet launch: March 25, 2025. Whitepaper v2.0: April 2025.

### Red Stuff Encoding

1. Original blob organized into a data matrix (rows × columns)
2. **Primary encoding**: Columns erasure-coded independently
3. **Secondary encoding**: Rows erasure-coded independently
4. Each storage node receives one primary + one secondary sliver (3f+1 total pairs)

### Certification Flow

1. Client encodes blob into slivers
2. Distribute slivers to storage nodes
3. Collect signed acknowledgments (2/3 quorum required)
4. Form "write certificate"
5. Publish certificate on Sui as Proof of Availability (PoA)

### Key Properties

| Property | Value |
| -------- | ----- |
| Storage overhead | 4-5x (vs 3x simple replication) |
| Recovery threshold | 1/3 of slivers |
| Fault tolerance | 2/3 node failures |
| Recovery bandwidth | Proportional to sliver size (not blob size) |
| Token | WAL (delegated proof-of-stake) |

### Components

**Sui Layer (metadata):**
- **System Object**: Shared object tracking current storage node committee (ID in `client_config.yaml`)
- **Storage Resources**: Objects representing available storage capacity
- **Blob Resources**: Objects for blobs undergoing registration/certification
- **Events**: Emitted when Walrus objects change state

**Walrus Services:**
- **Client Binary**: CLI, JSON API, and HTTP API interfaces
- **Aggregator**: HTTP-based blob retrieval service
- **Publisher**: Blob storage operations service
- **Storage Nodes**: Decentralized infrastructure layer

**Typical Integration:** End users interact via aggregators/publishers (HTTP), avoiding local binary deployment.

---

## Move Smart Contracts

Seven on-chain packages in `contracts/`:

| Package               | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `black_diamond`       | Name watchlist and auction tracking                 |
| `bounty_escrow`       | Escrow for bounty payouts                           |
| `decay_auction`       | Premium name auction with exponential decay pricing |
| `mvr`                 | Move Registry on-chain package metadata             |
| `private`             | Privacy protocol using Ligetron + Groth16           |
| `seal_messaging`      | Encrypted messaging using Seal protocol             |
| `upgrade_cap_transfer`| Capability transfer utilities                       |

Each package has a `Move.toml` and published packages include `Published.toml` with on-chain addresses.

---

## Surflux gRPC Proxy

The `proxy/` directory contains a lightweight HTTP-to-gRPC bridge for Surflux's NameService API (Cloudflare Workers cannot make native gRPC calls).

**Endpoints:**
- `/lookup` - Forward name lookup
- `/reverse` - Reverse name lookup
- `/health` - Health check

**Protocol Buffers:** `proxy/protos/name_service.proto`

**Deploy targets:** Fly.io (`fly.toml`), Render (`render.yaml`), Vercel (`vercel.json`), Cloudflare Workers (`wrangler.jsonc`)

---

## Cloudflare DNS Setup

Required DNS records:
1. `A` record: `*` → `192.0.2.0` (proxied) - dummy IP for Worker routing
2. `A` record: `@` → `192.0.2.0` (proxied) - root domain
3. Worker route: `*.sui.ski/*` → `sui-ski-gateway`
4. Worker route: `sui.ski/*` → `sui-ski-gateway`

---

## Sui Stack System Diagram

For a comprehensive visual reference of the complete Sui ecosystem architecture, see `docs/SUI_STACK_SYSTEM_DIAGRAM.md`. This includes:

- High-level architecture diagrams
- Component deep dives (Sui Core, SuiNS, MVR, Walrus, Vortex, Seal, Nautilus)
- Data flow diagrams (transaction lifecycle, content resolution)
- Integration patterns for full-stack dApps
- Network topology and SDK reference
- Performance benchmarks (Mysticeti v2)
- 2026 roadmap highlights (Remora horizontal scaling, protocol-level privacy)
