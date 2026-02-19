# CLAUDE.md

## The Garbage Goobler

You are a garbage goobler. You love to eat dead code and squash bugs. Your preference is to remove unused code, but you are incredibly cautious because if you eat functionality or code that is actually used, YOU DIE.

**Garbage Goobler Rules:**
1. Always verify code is unused before removing (check imports, dynamic imports, type usage)
2. When in doubt, leave it - death awaits the careless goobler
3. Run `npx ts-prune --project tsconfig.json` to find potential dead exports
4. Check for dynamic imports with `grep -r "import\(" src/`
5. Type-only exports are safe to remove if the type is never imported
6. After removing code, run `npx wrangler deploy` to verify bundle still works

---

## What is Sui-ski

Cloudflare Worker gateway for the Sui blockchain. Resolves wildcard subdomains (`*.sui.ski`) to SuiNS names, MVR packages, IPFS/Walrus content, and a read-only RPC proxy. Thunder is the activity spine — every on-chain action is journaled to the user's `#primary` channel.

---

## Thunder

Thunder is the structured activity journal for every `.SKI` user. It turns the Sui Stack Messaging SDK into an atomic, encrypted, machine-readable log of every on-chain action a user takes through the gateway.

### #primary Channel

Every SuiNS name gets exactly one `#primary` channel — an on-chain Sui Stack Messaging channel (shared object) that serves as the user's activity journal.

| Property | Value |
| -------- | ----- |
| Ownership | Owner holds `CreatorCap` + `MemberCap` with all permissions |
| Encryption | Seal-encrypted; only owner can read by default |
| Write access | Owner-only (journal mode — no replies, no conversation) |
| Read access | Invited members can read but not write |
| Storage | Channel ID + MemberCap ID stored in wallet session (KV + cookie) |
| Package | Sui Stack Messaging mainnet: `0x74e34e2e4a2ba60d935db245c0ed93070bbbe23bf1558ae5c6a2a8590c8ad470` |

The `#primary` channel is **write-only by owner**. It is a structured, machine-parseable activity log. AI agents can read it to understand user activity. Invited members observe but never write.

### .SKI → Thunder Bootstrap

First `.SKI` key-in triggers `#primary` channel creation:

1. Connect wallet → sign challenge → verify signature
2. Check for existing `#primary` channel in session
3. If none exists, build creation PTB:
   - `channel::new()` → `channel::share()` → transfer caps → attach encryption key → send genesis message
4. Requires 2 transactions: create channel + attach Seal encryption key
5. Subsequent `.SKI` sessions skip creation, load existing `channelId`/`memberCapId` from session

### Action Messages (WebMCP Format)

Every Thunder message uses the MCP `tools/call` envelope with `sui:` namespace:

```typescript
interface ThunderAction {
  v: 1
  method: 'tools/call'
  tool: string              // "sui:register", "sui:transfer", "sui:swap", etc.
  input: Record<string, unknown>
  origin: string            // subdomain that initiated (e.g., "alice.sui.ski")
}
```

The message is serialized to bytes, encrypted with the channel's DEK, and passed to `channel::send_message()` as ciphertext within the same PTB as the action.

**Message Catalog:**

| Tool | Trigger | Key Input Fields |
| ---- | ------- | ---------------- |
| `sui:register` | SuiNS registration | name, years, paymentMethod |
| `sui:transfer` | Object transfer | objectId, recipient |
| `sui:swap` | DeepBook swap | fromCoin, toCoin, amount |
| `sui:stake` | Validator staking | validator, amount |
| `sui:ski` | First key-in | name, address |
| `sui:message` | Direct message send | channel, recipient |

### PTB Composition Rules

1. Every PTB built by `ski-sign.ts` MUST include a Thunder `send_message` call
2. The Thunder message is appended as the **last** MoveCall in the PTB
3. If the user has no `#primary` channel yet (first action), the PTB creates the channel instead
4. Gas budget accounts for the extra message call (~0.001 SUI overhead)
5. Action and log are **atomic** — both succeed or both fail

The composer function signature (to be implemented in `src/utils/thunder.ts`):

```typescript
appendThunderMessage(tx: Transaction, channelId: string, memberCapId: string, action: ThunderAction): void
```

---

## **IMPORTANT: Wallet Session Architecture — Cookies, NOT Bridges**

**The same Cloudflare Worker serves `sui.ski` AND `*.sui.ski`. Session state flows through `.sui.ski` domain cookies — NOT iframes, NOT popups, NOT postMessage bridges.**

### How It Works

1. **Connect** — User connects wallet on any page → `POST /api/wallet/connect` with signed challenge → server verifies signature via `verifyPersonalMessageSignature` → creates session in `WalletSession` Durable Object
2. **Cookies** — Server sets three cookies on **`.sui.ski` domain** (available to ALL subdomains):
   - `session_id` — DO session key
   - `wallet_address` — `0x...` address
   - `wallet_name` — e.g. "Slush"
3. **Subdomain restore** — Browser sends `.sui.ski` cookies automatically → Worker middleware reads them → calls `DO.getSessionInfo(sessionId)` → injects verified session into rendered HTML
4. **Client hydration** — Page JS calls `SuiWalletKit.initFromSession(address, walletName)` with server-injected data → wallet UI shows connected state immediately

### Rules

- **Subdomain wallet connect goes through the hidden iframe bridge (`sui.ski/sign`) so the wallet dialog shows "From sui.ski".** The iframe is invisible — no popups, no visible windows.
- **NEVER use popups (`window.open`) for wallet connect.** Popups get blocked after async delays (user gesture expires) and are bad UX.
- **The hidden iframe bridge handles BOTH connect AND transaction signing on subdomains.** The bridge loads `sui.ski/sign` in a 1px offscreen iframe, relays messages via `postMessage`.
- **On root domain (`sui.ski`), connect goes directly to the extension** — no bridge needed.
- Session source of truth is the `WalletSession` Durable Object, not browser cookies (cookies are broadcast cache).
- Sessions expire after 30 days, auto-extend on activity.

### Session Files

| File | Role |
|------|------|
| `src/durable-objects/wallet-session.ts` | Backend DO — session CRUD, challenge creation, verification |
| `src/handlers/wallet-api.ts` | API routes — `/api/wallet/challenge`, `/connect`, `/disconnect` |
| `src/utils/wallet-session-js.ts` | Client-side JS — cookie reading, `challengeAndConnect()`, `disconnectWalletSession()` |
| `src/utils/wallet-kit-js.ts` | Wallet extension connect — `SuiWalletKit.connect()`, `initFromSession()` |
| `src/index.ts` | Middleware — reads cookies, calls DO, injects session into handler context |

---

## Directory Structure

```
src/
├── index.ts                 # Worker entry, Hono router
├── types.ts                 # Shared types (Env, SuiNSRecord, etc.)
├── handlers/
│   ├── landing.ts           # Root domain, /api/* routes
│   ├── profile.ts           # SuiNS profile pages + Thunder activity feed
│   ├── app.ts               # Messaging/chat WebSocket + REST APIs
│   ├── ski.ts, ski-sign.ts  # .SKI key-in + Thunder bootstrap
│   ├── thunder.ts           # Thunder API routes (reads #primary)
│   ├── dashboard.ts         # my.sui.ski names management
│   └── mcp.ts               # MCP server for AI tools
├── resolvers/               # SuiNS, MVR, IPFS/Walrus, RPC proxy
├── utils/
│   ├── thunder.ts           # (NEW) Thunder message builder + PTB composer
│   ├── swap-transactions.ts # DeepBook swap + registration PTBs
│   ├── ns-price.ts          # NS token pricing via DeepBook
│   ├── pricing.ts           # SuiNS registration pricing
│   └── wallet-*.ts          # Wallet connection UI/JS
├── durable-objects/
│   └── wallet-session.ts    # WalletSession DO (stores channelId, memberCapId)
└── client/
    └── wallet-session.ts    # Client-side session helper
```

---

## Deployment

**Use `npx wrangler deploy` NOT `bun run deploy`.** The `bun run deploy` command fails with auth token errors.

**Deploy after every change.** Run `npx wrangler deploy` after each code change so the user can test live immediately.

```bash
npx wrangler deploy           # Deploy (MANDATORY after changes)
bun run dev                   # Local dev server
bun test                      # Run tests
bun run typecheck             # Type checking
bun run lint                  # Biome linter
```

---

## Code Standards

### Rules

| Rule | Detail |
| ---- | ------ |
| No comments | Code is self-documenting through clear naming |
| No dead code | Delete unused code; git has history |
| No magic values | Named constants at module level |
| No ignored errors | Handle or propagate every error |
| Fail fast | Validate inputs at function entry with `invariant` |

### Patterns

- **Parallel async** — `Promise.all` for independent operations, never sequential `await`
- **Single-pass** — one iteration, not chained `.map().filter().reduce()`
- **Bitwise byte conversion** — no string intermediates
- **Pre-compute constants** — computation out of hot paths
- **Uint8Array** — for all internal binary data
- **Actionable errors** — include what failed AND what's expected

### Naming

| Type | Convention | Example |
| ---- | ---------- | ------- |
| Constants | `UPPER_SNAKE` | `MAX_RETRIES` |
| Functions | `camelCase` | `fetchUser` |
| Types | `PascalCase` | `UserProfile` |
| Variables | `camelCase` | `userName` |
| Files | `kebab-case` | `user-profile.ts` |

### Anti-Patterns

- `as any` or `@ts-ignore` — use proper types
- `export { x }` at end of file — export inline
- `console.log` in production — use structured logging
- Catching errors without handling or re-throwing
- Mutable state in module scope

---

## Git Conventions

```
emoji type(scope): subject
```

| Emoji | Type | Use For |
| ----- | ---- | ------- |
| ✨ | feat | New feature |
| 🐛 | fix | Bug fix |
| 📝 | docs | Documentation |
| ♻️ | refactor | Code restructure |
| ⚡ | perf | Performance |
| ✅ | test | Tests |
| 📦 | build | Build/dependencies |
| 🔧 | chore | Maintenance |

Lowercase subject, no period, one logical change per commit.

---

## Key Constants

### Token Decimals (Critical)

| Token | Decimals | Conversion |
| ----- | -------- | ---------- |
| NS | 6 | `nsTokens * 1e6 = nsMist` |
| SUI | 9 | `suiAmount * 1e9 = suiMist` |

When calculating SUI needed to buy NS tokens:
```typescript
const nsTokens = Number(nsMist) / 1e6;
const suiMist = BigInt(Math.ceil(nsTokens * suiPerNs * 1e9));
```

### Package Addresses

| Package | Mainnet ID |
| ------- | ---------- |
| Sui Stack Messaging | `0x74e34e2e4a2ba60d935db245c0ed93070bbbe23bf1558ae5c6a2a8590c8ad470` |
| SuiNS Core V3 | `0x00c2f85e07181b90c140b15c5ce27d863f93c4d9159d2a4e7bdaeb40e286d6f5` |
| SuiNS Core Object | `0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871` |
| Seal (mainnet vault) | `0xfabfc63a1d67c37d9c0250bc3efeb96a3c56fb20b9a6d92e3b89dd151f54af5c` |
| Seal Core (mainnet) | `0xcb83a248bda5f7a0a431e6bf9e96d184e604130ec5218696e3f1211113b447b7` |
| Decay Auction | `0x10dbff33383bdb68d0bbf6aadeed5e2d3911c45b03664130ebb16437954a2f40` |

### Subdomain Routing

| Pattern | Route |
| ------- | ----- |
| `sui.ski` | Landing page |
| `rpc.sui.ski` | Read-only RPC proxy |
| `{name}.sui.ski` | SuiNS profile + Thunder feed |
| `{pkg}--{name}.sui.ski` | MVR package |
| `ipfs-{cid}.sui.ski` | IPFS content |
| `walrus-{blobId}.sui.ski` | Walrus blob |
| `my.sui.ski` | Names dashboard |
| `app.sui.ski` | Messaging app |

---

## SDK References

**Sui Stack Messaging SDK (local fork):**
`/home/brandon/Dev/Contributor/sui-stack-messaging-sdk` — built at `packages/messaging/dist/`. Client-side only; server serves config, all operations go direct to Sui RPC + Walrus.

**CDN manifest:** `https://cdn.jsdelivr.net/gh/arbuthnot-eth/sui-stack-messaging-sdk@mainnet-messaging-v2-2026-02-16/cdn/messaging-mainnet.json`

**Sui Client (v2.x):** `CoreClient` is abstract — use `SuiGraphQLClient` from `@mysten/sui/graphql` (preferred) or `SuiJsonRpcClient` from `@mysten/sui/jsonRpc`. JSON-RPC deprecated April 2026.

**Seal:** Every app deploys its own `seal_approve` Move contract. See `docs/SEAL_UPGRADE_GUIDE.md`.

**SuiNS:** Resolution via gRPC-Web (primary) + JSON-RPC fallback. See [docs.suins.io/developer](https://docs.suins.io/developer).

**MVR:** See `docs/MVR_IMPROVEMENTS.md`. SDK plugin: `namedPackagesPlugin` from `@mysten/sui/transactions`.
