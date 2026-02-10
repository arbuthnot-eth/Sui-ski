---
tags: [architecture, routing]
---

# Subdomain Routing

The gateway parses incoming hostnames to determine how to handle each request. Defined in `src/utils/subdomain.ts`.

## Route Patterns

| Pattern | Route Type | Example | Handler |
|---------|-----------|---------|---------|
| `sui.ski` | root | Landing page | `landing.ts` |
| `my.sui.ski` | dashboard | User dashboard | `dashboard.ts` |
| `app.sui.ski` | app | Aggregator hub | `app.ts` |
| `rpc.sui.ski` | rpc | JSON-RPC proxy | `rpc.ts` resolver |
| `{name}.sui.ski` | suins | `brandon.sui.ski` | `profile.ts` |
| `{pkg}--{name}.sui.ski` | mvr | `core--suifrens.sui.ski` | `mvr.ts` resolver |
| `{pkg}--{name}--v{n}.sui.ski` | mvr | `nft--myname--v2.sui.ski` | `mvr.ts` resolver |
| `ipfs-{cid}.sui.ski` | content | Direct IPFS | `content.ts` resolver |
| `walrus-{blobId}.sui.ski` | content | Direct Walrus | `content.ts` resolver |

## Network Overrides

Subdomains can target specific networks via suffix:

| Suffix | Network | Example |
|--------|---------|---------|
| `.t.sui.ski` | Testnet | `brandon.t.sui.ski` |
| `.d.sui.ski` | Devnet | `brandon.d.sui.ski` |
| (none) | Mainnet | `brandon.sui.ski` |

## MVR Name Mapping

Subdomain patterns map to MVR names:
- `core--suifrens.sui.ski` → `@suifrens/core`
- `nft--myname--v2.sui.ski` → `@myname/nft/2`

The double-dash (`--`) separates package name from SuiNS name. Version suffix (`--v{n}`) is optional.

## Implementation

File: `src/utils/subdomain.ts` (3.4K lines)

The parser returns a `ParsedSubdomain` type containing:
- `type` - Route type enum
- `name` - SuiNS name or package identifier
- `network` - Target network
- Additional fields per route type

## Related
- [[System Overview]]
- [[Handler System]]
- [[SuiNS Integration]]
