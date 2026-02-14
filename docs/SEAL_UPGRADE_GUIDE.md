# Seal SDK Upgrade Guide

## Current State (Feb 2026)

### Versions
- **npm (node_modules)**: `@mysten/seal@1.0.0` (package.json has `^1.0.0`)
- **CDN (esm.sh)**: `@mysten/seal@0.2.0` (loaded in profile.ts:836)
- **Latest available**: `@mysten/seal@1.0.1`

### Environment Config (wrangler.toml)
```
SEAL_NETWORK = "testnet"
SEAL_PACKAGE_ID = "0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82"
SEAL_KEY_SERVERS = "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75,0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8,0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46"
```

### What SEAL_PACKAGE_ID Points To
`0x8afa5d31...` is the **Seal example patterns package** (testnet), containing:
- `allowlist` module with `seal_approve(id, &Allowlist, &TxContext)`
- `subscription` module with `seal_approve(id, &Subscription, &Service, &Clock)`
- `utils` module

This is NOT the Seal core protocol package.

## Official Package IDs

| Network | Seal Core Protocol | Example Patterns |
|---------|-------------------|------------------|
| Testnet | `0x4016869413374eaa71df2a043d1660ed7bc927ab7962831f8b07efbc7efdb2c3` | `0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82` |
| Mainnet | `0xcb83a248bda5f7a0a431e6bf9e96d184e604130ec5218696e3f1211113b447b7` | (deploy your own) |

## Key Servers (Testnet, Open Mode)

| Provider | Object ID | URL |
|----------|-----------|-----|
| Mysten Labs #1 | `0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75` | https://seal-key-server-testnet-1.mystenlabs.com |
| Mysten Labs #2 | `0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8` | https://seal-key-server-testnet-2.mystenlabs.com |
| Triton One | `0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46` | https://seal.testnet.sui.rpcpool.com |
| Ruby Nodes | `0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2` | https://seal-testnet.api.rubynodes.io |
| NodeInfra | `0x5466b7df5c15b508678d51496ada8afab0d6f70a01c10613123382b1b8131007` | https://open-seal-testnet.nodeinfra.com |
| Studio Mirai | `0x164ac3d2b3b8694b8181c13f671950004765c23f270321a45fdd04d40cccf0f2` | https://open.key-server-testnet.seal.mirai.cloud |
| Overclock | `0x9c949e53c36ab7a9c484ed9e8b43267a77d4b8d70e79aa6b39042e3d4c434105` | https://seal-testnet-open.overclock.run |
| H2O Nodes | `0x39cef09b24b667bc6ed54f7159d82352fe2d5dd97ca9a5beaa1d21aa774f25a2` | https://seal-open.sui-testnet.h2o-nodes.com |
| Natsai | `0x3c93ec1474454e1b47cf485a4e5361a5878d722b9492daf10ef626a76adc3dad` | https://seal-open-test.natsai.xyz |
| Mhax.io | `0x6a0726a1ea3d62ba2f2ae51104f2c3633c003fb75621d06fde47f04dc930ba06` | https://seal-testnet-open.suiftly.io |

**Note:** Mainnet key servers require registration/API keys per provider. Only testnet has open-mode servers. Mainnet providers: Ruby Nodes, NodeInfra, Overclock, Studio Mirai, H2O Nodes, Triton One, Natsai, Enoki (Mysten Labs).

## Breaking Changes: v0.2.0 → v1.0.x

### v0.8.0 - BLS Scalar Encoding
Noble/curves >=1.9.6 changed default scalar encoding to little-endian. Data encrypted with v0.2.0 + newer noble/curves may need `checkLEEncoding: true` on decrypt.

### v0.9.0 - BCS Optimization
Replaced `bcs.vector(bcs.u8())` with `bcs.byteVector()`. Custom BCS serialization code may break.

### v0.4.23 - Removed getAllowlistedKeyServers
Key server IDs are now documented at seal-docs.wal.app instead of bundled in SDK.

### v1.0.0 - Major Breaking Changes
1. **Client type changed**: `SuiClient` → `SuiJsonRpcClient` from `@mysten/sui/jsonRpc`
2. **Extension removed**: `asClientExtension` static method deleted
3. **Parameter types changed**: `encrypt()` and `SessionKey.create()` now take `packageId` and `id` as **strings** (hex addresses), not `Uint8Array` via `fromHEX()`
4. **Dependencies bumped**: `@mysten/sui@2.0.0`, `@mysten/bcs@2.0.0`

## API Comparison

### Encrypt

**v0.2.0 (CDN):**
```typescript
import { fromHEX } from '@mysten/bcs';
const { encryptedObject, key } = await client.encrypt({
  threshold: 2,
  packageId: fromHEX(packageId),  // Uint8Array
  id: fromHEX(policyId),          // Uint8Array
  data: plaintext,                 // Uint8Array
});
```

**v1.0.0+ (npm):**
```typescript
const { encryptedObject, key } = await client.encrypt({
  threshold: 2,
  packageId: '0x...',  // string
  id: '0x...',         // string
  data: plaintext,     // Uint8Array
});
```

### SessionKey.create

**v0.2.0:**
```typescript
const sessionKey = await SessionKey.create({
  address: userAddress,
  packageId: fromHEX(packageId),  // Uint8Array
  ttlMin: 10,
  suiClient,                       // SuiClient
});
```

**v1.0.0+:**
```typescript
const sessionKey = await SessionKey.create({
  address: userAddress,
  packageId: '0x...',  // string
  ttlMin: 10,
  suiClient,           // SuiJsonRpcClient
});
```

### SealClient Constructor

**v0.2.0:**
```typescript
new SealClient({
  suiClient,  // SuiClient from @mysten/sui/client
  serverConfigs: [...],
  verifyKeyServers: false,
});
```

**v1.0.0+:**
```typescript
new SealClient({
  suiClient,  // SuiJsonRpcClient from @mysten/sui/jsonRpc
  serverConfigs: [...],
  verifyKeyServers: false,
});
```

## Upgrade Steps

### Step 1: Deploy a Custom seal_approve Contract

For vault encryption (owner-only access), deploy a Move contract:

```move
module vault::vault {
    use sui::tx_context::TxContext;

    const ENotAuthorized: u64 = 1;

    entry fun seal_approve(id: vector<u8>, ctx: &TxContext) {
        // id contains the owner address bytes
        // Only the data owner can decrypt their vault
        let sender_bytes = sui::bcs::to_bytes(&ctx.sender());
        assert!(id == sender_bytes, ENotAuthorized);
    }
}
```

### Step 2: Set SEAL_APPROVE_TARGET

After deploying, set the environment variable:
```
SEAL_APPROVE_TARGET = "{your_package_id}::vault::seal_approve"
```

### Step 3: Bump CDN Version

In `src/handlers/profile.ts:836`, change:
```typescript
import('https://esm.sh/@mysten/seal@0.2.0?bundle')
```
to:
```typescript
import('https://esm.sh/@mysten/seal@1.0.1?bundle')
```

### Step 4: Update Client-Side encrypt/decrypt Calls

Remove `fromHex()` calls for `packageId` and `id` parameters - they should be plain hex strings now.

### Step 5: Handle Legacy Encrypted Data

Add `checkLEEncoding: true` to decrypt calls for data that may have been encrypted with v0.2.0:
```typescript
await client.decrypt({
  data: encryptedBytes,
  sessionKey,
  txBytes,
  checkLEEncoding: true,  // Handle v0.2.0 encrypted data
});
```

## Type Definitions (v1.0.0)

```typescript
interface EncryptOptions {
  kemType?: KemType;
  demType?: DemType;
  threshold: number;
  packageId: string;       // hex address string
  id: string;              // hex address string (identity)
  data: Uint8Array;
  aad?: Uint8Array;
}

interface DecryptOptions {
  data: Uint8Array;
  sessionKey: SessionKey;
  txBytes: Uint8Array;
  checkShareConsistency?: boolean;
  checkLEEncoding?: boolean;
}

interface SealClientOptions {
  suiClient: SealCompatibleClient;  // SuiJsonRpcClient
  serverConfigs: KeyServerConfig[];
  verifyKeyServers?: boolean;
  timeout?: number;
}

interface KeyServerConfig {
  objectId: string;
  weight: number;
  apiKeyName?: string;
  apiKey?: string;
  aggregatorUrl?: string;
}
```

## Implementation Plan (for fresh-eyes execution)

### Task 1: Write & Deploy seal_approve Move Contract (Testnet)

Create a minimal Move project at `move/seal-vault/`:

```
move/seal-vault/
├── Move.toml
└── sources/
    └── vault.move
```

**Move.toml:**
```toml
[package]
name = "seal_vault"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
seal_vault = "0x0"
```

**vault.move:**
```move
module seal_vault::vault {
    const ENotAuthorized: u64 = 1;

    entry fun seal_approve(id: vector<u8>, ctx: &TxContext) {
        let sender_bytes = bcs::to_bytes(&ctx.sender());
        assert!(id == sender_bytes, ENotAuthorized);
    }
}
```

Deploy with: `sui client publish --gas-budget 100000000`

Save the published package ID.

### Task 2: Set SEAL_APPROVE_TARGET

In `wrangler.toml`, add:
```
SEAL_APPROVE_TARGET = "{deployed_package}::vault::seal_approve"
```

### Task 3: Bump CDN Version (profile.ts:836)

**File:** `src/handlers/profile.ts`
**Line:** ~836

Change:
```typescript
import('https://esm.sh/@mysten/seal@0.2.0?bundle'),
```
To:
```typescript
import('https://esm.sh/@mysten/seal@1.0.1?bundle'),
```

### Task 4: Update Client-Side Seal Encrypt/Decrypt Calls

**File:** `src/handlers/profile.ts`

In `encryptSubscriptions()` (~line 12210-12230), the `fromHex()` calls for packageId and id must be removed since v1.0.0 takes plain strings:

Change:
```javascript
packageId: fromHex(config.packageId.replace(/^0x/i, '')),
id: ownerBytes,  // was fromHex(subscriberAddress...)
```
To:
```javascript
packageId: config.packageId,
id: subscriberAddress,
```

In `decryptWithSeal()` (~line 12240-12260), same change:

Change:
```javascript
packageId: fromHex(config.packageId.replace(/^0x/i, '')),
```
To:
```javascript
packageId: config.packageId,
```

And the seal_approve tx `tx.pure.vector('u8', ownerBytes)` should use the address string directly if the contract expects it as bytes of the address. The `fromHex` was only needed for the old Uint8Array API.

### Task 5: Add checkLEEncoding for Legacy Data

In `decryptWithSeal()`, add backward compat flag:
```javascript
var decryptedBytes = await client.decrypt({
    data: encryptedBytes,
    sessionKey: sessionKey,
    txBytes: txBytes,
    checkLEEncoding: true,
});
```

### Task 6: Update node_modules

Run `bun install` to ensure `@mysten/seal@1.0.1` is installed (package.json already has `^1.0.0`).

### Task 7: Verify & Deploy

1. `bun run typecheck`
2. `npx wrangler deploy`
3. Test vault encrypt/decrypt flow

### Files Modified Summary

| File | Change |
|------|--------|
| `move/seal-vault/Move.toml` | New - Move project config |
| `move/seal-vault/sources/vault.move` | New - seal_approve contract |
| `wrangler.toml` | Add SEAL_APPROVE_TARGET |
| `src/handlers/profile.ts:836` | Bump esm.sh version 0.2.0 → 1.0.1 |
| `src/handlers/profile.ts:~12210` | Remove fromHex() in encrypt, use plain strings |
| `src/handlers/profile.ts:~12240` | Remove fromHex() in decrypt, add checkLEEncoding |

## References

- [Seal SDK Docs](https://sdk.mystenlabs.com/seal)
- [Seal Documentation](https://seal-docs.wal.app)
- [Seal GitHub](https://github.com/MystenLabs/seal)
- [SessionKey API](https://sdk.mystenlabs.com/typedoc/classes/_mysten_seal.SessionKey.html)
- [SealClient API](https://sdk.mystenlabs.com/typedoc/classes/_mysten_seal.SealClient.html)
- [Seal CHANGELOG](https://github.com/MystenLabs/ts-sdks/blob/main/packages/seal/CHANGELOG.md)
