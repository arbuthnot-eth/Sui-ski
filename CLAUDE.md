# CLAUDE.md

Instructions for AI assistants working on this codebase.

---

## Project Overview

**Sui-ski**: Cloudflare Worker gateway for the Sui blockchain ecosystem. Resolves wildcard subdomains (`*.sui.ski`) to route requests to SuiNS names, Move Registry packages, decentralized content (IPFS/Walrus), and a read-only RPC proxy.

**Directory Structure:**

```
src/
├── index.ts              # Worker entry point, request routing by subdomain type
├── types.ts              # Shared TypeScript types (Env, ParsedSubdomain, etc.)
├── handlers/
│   ├── landing.ts        # Root domain handler (sui.ski), API endpoints
│   ├── profile.ts        # SuiNS profile page with grace period support
│   ├── vortex.ts         # Vortex privacy protocol API and UI
│   ├── mvr-management.ts # MVR package management API endpoints
│   └── mvr-ui.ts         # MVR package management web UI
├── resolvers/
│   ├── suins.ts          # SuiNS name resolution using @mysten/suins SDK
│   ├── mvr.ts            # Move Registry package lookup via on-chain registry
│   ├── content.ts        # IPFS gateway fallback + Walrus blob fetching
│   └── rpc.ts            # JSON-RPC proxy with method allowlist + rate limiting
└── utils/
    ├── subdomain.ts      # Subdomain parsing logic (pattern matching)
    ├── cache.ts          # KV-backed caching utilities
    ├── response.ts       # HTTP response helpers (JSON, HTML, CORS)
    └── mvr-transactions.ts # MVR transaction builders for offline signing
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

---

## TypeScript

### Commands

```bash
bun install               # Install dependencies
bun run dev               # Development server (Wrangler dev with hot reload)
bun test                  # Run tests
bun test --watch          # Watch mode
bun test src/index.test.ts  # Single file
bun run typecheck         # Type checking only
bun run lint              # Check for issues (Biome)
bun run lint:fix          # Auto-fix issues
bun run format            # Format code
bun run deploy            # Deploy to Cloudflare
bun run tail              # Stream live logs
```

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

### Environment Variables

`wrangler.toml` defines:

```bash
SUI_NETWORK=mainnet|testnet|devnet
SUI_RPC_URL=                        # Sui fullnode endpoint
WALRUS_NETWORK=                     # Walrus network
CACHE=                              # KV namespace binding
```

Use `env.dev` for testnet development.

### Key Dependencies

| Package              | Purpose                    |
| -------------------- | -------------------------- |
| `@mysten/sui`        | Sui TypeScript SDK         |
| `@mysten/suins`      | SuiNS client               |
| `@mysten/walrus`     | Walrus blob storage client |
| `wrangler`           | Cloudflare Workers CLI     |

**Note:** The Vortex SDK (`@interest-protocol/vortex-sdk`) is NOT imported in the worker due to its 9MB size exceeding Cloudflare's 3MB limit. The gateway proxies Vortex API requests; the SDK should be loaded client-side from CDN.

---

## Subdomain Routing

The gateway parses hostnames to determine routing:

| Pattern                        | Route Type | Example               |
| ------------------------------ | ---------- | --------------------- |
| `sui.ski`                      | root       | Landing page          |
| `rpc.sui.ski`                  | rpc        | JSON-RPC proxy        |
| `{name}.sui.ski`               | suins      | SuiNS resolution      |
| `{pkg}--{name}.sui.ski`        | mvr        | MVR package           |
| `{pkg}--{name}--v{n}.sui.ski`  | mvr        | MVR package version   |
| `ipfs-{cid}.sui.ski`           | content    | Direct IPFS           |
| `walrus-{blobId}.sui.ski`      | content    | Direct Walrus         |

---

## RPC Proxy Security

The RPC proxy at `rpc.sui.ski` only allows read-only methods. Write operations (`sui_executeTransactionBlock`, etc.) are blocked. Rate limiting is 100 requests/minute per IP.

---

## MVR Registry Integration

MVR names follow the format `@{suins_name}/{package_name}`. The gateway translates subdomain patterns:
- `core--suifrens.sui.ski` → `@suifrens/core`
- `nft--myname--v2.sui.ski` → `@myname/nft/2`

**Management UI** (`/mvr`):
- Web interface for package registration, versioning, and metadata updates
- Generate unsigned transactions for offline signing
- Browse and search packages

**API Endpoints**:
- `POST /api/mvr/register` - Register new package
- `POST /api/mvr/publish-version` - Publish new version
- `POST /api/mvr/update-metadata` - Update package metadata
- `POST /api/mvr/transfer` - Transfer package ownership
- `GET /api/mvr/packages/{suinsName}` - List packages for a SuiNS name
- `GET /api/mvr/search?q={query}` - Search packages

See `docs/MVR_IMPROVEMENTS.md` for detailed documentation.

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
