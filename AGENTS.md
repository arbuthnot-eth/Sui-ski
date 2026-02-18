# Agent Guidelines for Sui-ski Gateway

## Thunder-First Development

Every feature touches Thunder. The `#primary` channel is the source of truth for a user's on-chain activity through the gateway. If you're building a new action (registration, swap, transfer, etc.), it MUST emit a Thunder message.

**Core principle:** The WebMCP format ensures all messages are machine-readable. AI agents can parse the `#primary` channel to reconstruct a user's complete activity history.

**When building any PTB-producing feature:**
1. Define the `ThunderAction` for the action (tool name, input fields)
2. Call `appendThunderMessage()` as the last step in PTB construction
3. Account for ~0.001 SUI gas overhead from the message call
4. Handle the no-channel case (first action triggers channel creation instead)

---

## Core Architecture

### Subdomain Routing (`src/utils/subdomain.ts`)

| Pattern | Route | Handler |
| ------- | ----- | ------- |
| `sui.ski` | root | Landing page, API routes |
| `my.sui.ski` | dashboard | User's names management |
| `rpc.sui.ski` | rpc | Read-only JSON-RPC proxy |
| `{name}.sui.ski` | suins | SuiNS profile + Thunder feed |
| `{pkg}--{name}.sui.ski` | mvr | MVR package resolution |
| `ipfs-{cid}.sui.ski` | content | IPFS gateway |
| `walrus-{blobId}.sui.ski` | content | Walrus aggregator |
| `app.sui.ski` | app | Messaging/chat application |
| `.t.` prefix | testnet | Override to testnet |
| `.d.` prefix | devnet | Override to devnet |

---

## Wallet Bridge Policy

All wallet interaction on any `*.sui.ski` subdomain MUST be routed through `https://sui.ski/sign` using an invisible iframe bridge.

- Subdomains may perform local wallet discovery only to collect wallet name/icon hints.
- Subdomains MUST forward those hints to the bridge (`postMessage`) and let the bridge own connect/sign/disconnect.
- Subdomains MUST NOT directly call extension connect/sign APIs for trad wallets.
- New wallet flows must keep the bridge path as the only signing authority outside `sui.ski`.
- **Solution: If a wallet is unavailable in iframe context, use a same-tab top-frame handoff to `https://sui.ski/sign` for connect/sign and then return to the subdomain. Do not use popup fallback.**

---

## Thunder Integration Points

| File | Thunder Role |
| ---- | ------------ |
| `src/handlers/ski-sign.ts` | Appends Thunder message to every PTB before signing |
| `src/handlers/ski.ts` | Triggers `#primary` channel creation on first .SKI |
| `src/durable-objects/wallet-session.ts` | Stores `channelId` + `memberCapId` in session |
| `src/handlers/thunder.ts` | Reads `#primary` channel for activity display |
| `src/handlers/profile.ts` | Renders Thunder activity feed on profile pages |
| `src/utils/thunder.ts` | **(NEW)** Thunder message builder + PTB composer |
| `contracts/storm/sources/registry.move` | Storm on-chain canonical channel registry (`SuiNS NFT -> channel`) |
| `src/handlers/app.ts` | Exposes Storm config at `/api/app/subscriptions/config` |
| `src/utils/thunder-js.ts` | Reads/writes Storm mapping; enforces primary channel identity |

---

## PTB Composition Checklist

When adding or modifying any PTB that goes through `ski-sign.ts`:

- [ ] Define the `ThunderAction` with correct `tool` name (`sui:` prefix) and `input` fields
- [ ] Serialize the action to the WebMCP envelope format (`v: 1`, `method: 'tools/call'`)
- [ ] Encrypt the serialized bytes with the channel's DEK via Seal
- [ ] Append `channel::send_message()` as the **last** MoveCall in the PTB
- [ ] Verify the PTB handles the no-channel edge case (first .SKI creates channel instead)
- [ ] Test that gas budget includes the message overhead (~0.001 SUI)
- [ ] Confirm atomicity: action + log both succeed or both revert

---

## WebMCP Message Catalog

All known Thunder action types:

| Tool | Trigger | Input Fields |
| ---- | ------- | ------------ |
| `sui:ski` | First key-in | `name`, `address` |
| `sui:register` | SuiNS registration | `name`, `years`, `paymentMethod` |
| `sui:transfer` | Object transfer | `objectId`, `recipient` |
| `sui:swap` | DeepBook swap | `fromCoin`, `toCoin`, `amount` |
| `sui:stake` | Validator staking | `validator`, `amount` |
| `sui:message` | Direct message send | `channel`, `recipient` |

When adding a new action type: add a row here, implement the `ThunderAction` in `src/utils/thunder.ts`, and wire it into the relevant handler's PTB construction.

---

## Deployment

**CRITICAL: Use `npx wrangler deploy` after every change.**

Do not use `bun run deploy` (fails with auth token errors). Do not consider work complete until deployment succeeds.

```bash
npx wrangler deploy           # Deploy (MANDATORY after changes)
bun run dev                   # Local dev server
bun test                      # Run tests
bun run typecheck             # Type checking
bun run lint                  # Biome linter
```

---

## Code Style

Full standards in `CLAUDE.md`. Key points:

- **No comments** — self-documenting code
- **No dead code** — git has history
- **Fail fast** — `invariant(condition, actionable message)`
- **Parallel async** — `Promise.all` for independent operations
- **Single-pass** — avoid chained array methods
- Naming: constants `UPPER_SNAKE`, functions `camelCase`, types `PascalCase`, files `kebab-case`
- Formatting: tabs, single quotes, no semicolons

---

## Key Files

### Thunder Path (action flow)

| File | Purpose |
| ---- | ------- |
| `src/handlers/ski.ts` | .SKI key-in entry point, wallet connection |
| `src/handlers/ski-sign.ts` | PTB signing bridge, Thunder message injection |
| `src/handlers/thunder.ts` | Thunder API, MCP bridge, channel/message endpoints |
| `src/utils/thunder-js.ts` | Thunder chat runtime UI + SDK transaction orchestration |
| `src/utils/thunder-css.ts` | Thunder UI styling |
| `src/durable-objects/wallet-session.ts` | Session state: address, channel/member caps, auth |

### Transaction Building

| File | Purpose |
| ---- | ------- |
| `src/utils/swap-transactions.ts` | DeepBook swap + SuiNS registration PTBs |
| `src/utils/transactions.ts` | Shared transaction helpers |
| `src/utils/ns-price.ts` | NS token pricing via DeepBook pools |
| `src/utils/pricing.ts` | SuiNS pricing + renewal calculations |
| `src/utils/grace-vault-transactions.ts` | Grace Vault transaction assembly |

### Messaging + App Surfaces

| File | Purpose |
| ---- | ------- |
| `src/handlers/app.ts` | `app.sui.ski` shell + `/api/app/*` config/messaging helpers |
| `src/handlers/profile.ts` | Profile page rendering + Thunder embed |
| `src/handlers/messaging-sdk.ts` | Messaging SDK status/config API |
| `src/sdk/messaging.ts` | Shared SDK constants/config/version pins |

### Resolution Layer

| File | Purpose |
| ---- | ------- |
| `src/resolvers/suins.ts` | SuiNS resolution |
| `src/resolvers/content.ts` | IPFS/Walrus content resolution |
| `src/resolvers/rpc.ts` | Read-only RPC proxy |

---

## Current Progress Log (2026-02-17)

### Thunder stability and UX

- Done (2026-02-18): Enforced bridge-only wallet interaction on subdomains (`sui.ski/sign` iframe) and added local wallet hint forwarding from subdomains to bridge discovery/connect/sign paths.
- Done: Robust Sui + messaging SDK module resolution in browser init path.
- Done: Fixed package-ID mismatch to mainnet messaging package `0xbcdf...39f9` in live runtime/config paths.
- Done: Added signer result hydration to recover missing transaction effects/object changes.
- Done: Removed channel-label collapsing that mixed independent channels under one label.
- Done: Added local cache reset control for channel meta/dismissed keys.

### Hardening completed

- Done: Duplicate-channel prevention at source.
  - Added on-chain membership guard before any bootstrap/create flow, so existing membership blocks new channel creation.
  - Removed “dismiss on failed burn” behavior to prevent hidden channels from spawning replacement channels.
  - Shifted duplicate channels into explicit “extras” management UI, with on-chain cleanup action.
- Done: Reduced first-message signing path.
  - Added bootstrap path using `createChannelFlow()` + append `sendMessage()` to key-attach PTB, reducing first send from 3 signatures to 2 when SDK builders are available.
- Done: Channel-key self-heal for broken legacy channels.
  - Added on-chain `add_encrypted_key` repair flow as an explicit user action (`Repair key`) when signer has required member capability.
  - Added send fallback routing to next public channel with a valid encrypted key when active channel is unrecoverable.
  - Added member-cap permission selection logic so repair uses a cap with `EditEncryptionKey` instead of arbitrary owned caps.
  - Disabled automatic repair during send to keep one send-click to one transaction attempt.
- Done: Strict send path (no implicit fallback/switching).
  - Removed automatic channel switching during send.
  - Removed “best sendable channel” fallback logic.
  - Added explicit burn wording and scope for non-primary channels only.

### Storm registry rollout

- Done: Added `contracts/storm` Move package with shared `Registry` dynamic fields keyed by SuiNS NFT object ID.
  - `set_channel_for_nft<T: key>(registry, nft, channel_id)`
  - `clear_channel_for_nft<T: key>(registry, nft)`
- Done: Added worker env wiring for Storm (`STORM_PACKAGE_ID`, `STORM_REGISTRY_ID`) and included Storm config in `/api/app/subscriptions/config`.
- Done: Thunder runtime now resolves canonical channel from Storm mapping first and pins primary channel identity to it.
- Done: Added channel-gear action `Set primary` to update Storm mapping explicitly on-chain.
- Done: Bootstrap create+attach+send PTB now appends Storm mapping write when configured, so channel creation + first message + canonical registry update are bundled into one signed finalize PTB.
- Done: Extra-channel burn paths attempt Storm mapping clear when burned channel matches current mapped primary.

### Cleanup policy

- Rule: “Remove” means on-chain delete (`member_cap::transfer_to_recipient`) whenever capability requirements are met.
- Rule: If deletion caps are missing, do not silently hide; return explicit undeletable state and recovery guidance.

---

## Full App Surface Map

### Entry + routing

| File | Surface |
| ---- | ------- |
| `src/index.ts` | Global routing, host/subdomain dispatch, API wiring, media/OG routes |
| `src/types.ts` | Worker env/type contracts |
| `src/utils/subdomain.ts` | Host parsing + network override logic |

### Durable object

| File | Surface |
| ---- | ------- |
| `src/durable-objects/wallet-session.ts` | Wallet session lifecycle, wallet linkage, messaging caps/session state |

### Handlers

| File | Surface |
| ---- | ------- |
| `src/handlers/landing.ts` | Root landing page + shared API routes |
| `src/handlers/profile.ts` | SuiNS profile pages + embedded Thunder |
| `src/handlers/app.ts` | App shell + API namespaces (`/api/app`, `/api/agents`, `/api/ika`, `/api/llm`) |
| `src/handlers/thunder.ts` | Thunder API + MCP proxy + x402 hints |
| `src/handlers/ski.ts` | `.SKI` action UI |
| `src/handlers/ski-sign.ts` | Wallet sign bridge and PTB payload signing |
| `src/handlers/dashboard.ts` | `my.sui.ski` dashboard |
| `src/handlers/vault.ts` | Vault routes |
| `src/handlers/grace-vault-agent.ts` | Grace Vault agent routes |
| `src/handlers/x402-register.ts` | x402 register agent routes |
| `src/handlers/mcp.ts` | Sui MCP server wiring |
| `src/handlers/messaging-sdk.ts` | Messaging SDK informational endpoints |
| `src/handlers/authenticated-events.ts` | Authenticated events ingestion |
| `src/handlers/register2.ts` | SuiNS register tx build/submit |
| `src/handlers/wallet-api.ts` | Wallet challenge/connect/check/disconnect |

### Resolvers

| File | Surface |
| ---- | ------- |
| `src/resolvers/suins.ts` | Name lookup / owner/address resolution |
| `src/resolvers/content.ts` | IPFS/Walrus direct blob routing |
| `src/resolvers/rpc.ts` | RPC passthrough with env controls |

### SDK + protocol utilities

| File | Surface |
| ---- | ------- |
| `src/sdk/messaging.ts` | Messaging SDK pinning/config/bootstrap URLs |
| `src/utils/x402-middleware.ts` | x402 request middleware |
| `src/utils/x402-sui.ts` | x402 Sui settlement helpers |
| `src/utils/vault.ts` | Vault utility operations |
| `src/utils/agent-keypair.ts` | Agent keypair derivation/helpers |

### Wallet + client runtime

| File | Surface |
| ---- | ------- |
| `src/utils/wallet-kit-js.ts` | Wallet integration bootstrap |
| `src/utils/wallet-session-js.ts` | Session sync in browser |
| `src/utils/wallet-ui-js.ts` | Wallet modal/UI behavior |
| `src/utils/wallet-tx-js.ts` | Browser tx helper layer |
| `src/utils/shared-wallet-js.ts` | Shared wallet mount script |
| `src/utils/thunder-js.ts` | Thunder interaction + messaging SDK write/read loop |
| `src/utils/thunder-css.ts` | Thunder presentation layer |
| `src/utils/zksend-js.ts` | zk-send utilities |

### Data, pricing, status, and cache

| File | Surface |
| ---- | ------- |
| `src/utils/cache.ts` | KV/cache helpers |
| `src/utils/status.ts` | Gateway status assembly |
| `src/utils/rpc.ts` | RPC URL/env helpers |
| `src/utils/response.ts` | response helpers |
| `src/utils/pricing.ts` | registration/renewal pricing |
| `src/utils/ns-price.ts` | NS market pricing |
| `src/utils/pyth-price-info.ts` | external price feeds |
| `src/utils/mmr.ts` | misc on-chain helpers |

### On-chain contracts (workspace)

| File | Surface |
| ---- | ------- |
| `contracts/storm/sources/registry.move` | Storm canonical channel registry for Thunder |
| `contracts/seal_messaging/sources/access.move` | Seal messaging/access control package |
| `contracts/mvr/sources/registry.move` | Move package registry |

### Media, social, and activity

| File | Surface |
| ---- | ------- |
| `src/utils/media-pack.ts` | generated static media assets |
| `src/utils/og-image.ts` | SVG/PNG OG rendering |
| `src/utils/social.ts` | social metadata + bot detection |
| `src/utils/onchain-activity.ts` | profile on-chain activity feeds |
| `src/utils/onchain-listing.ts` | on-chain listing fetch path |
| `src/utils/surflux-grpc.ts` | gRPC data integration helpers |
