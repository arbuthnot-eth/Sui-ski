---
tags: [reference, dependencies, packages]
---

# Dependencies

## Production

| Package | Version | Purpose |
|---------|---------|---------|
| `@bufbuild/protobuf` | ^2.11.0 | Protobuf for gRPC |
| `@connectrpc/connect-web` | ^2.1.1 | Connect RPC framework |
| `@mysten/deepbook-v3` | ^1.0.1 | DeepBook V3 SDK |
| `@mysten/seal` | ^1.0.0 | Seal encryption |
| `@mysten/sui` | ^2.2.0 | Sui TypeScript SDK |
| `@mysten/suins` | ^1.0.0 | SuiNS client |
| `@mysten/walrus` | ^0.9.0 | Walrus storage |
| `@noble/hashes` | ^2.0.1 | Cryptographic hashing |
| `hono` | ^4.11.7 | Web framework |
| `tiny-invariant` | ^1.3.3 | Runtime assertions |

## Development

| Package | Version | Purpose |
|---------|---------|---------|
| `@biomejs/biome` | 2.3.11 | Linter/formatter |
| `@cloudflare/workers-types` | ^4.20260116.0 | CF Worker types |
| `@playwright/test` | ^1.58.2 | E2E testing |
| `@types/bun` | ^1.3.6 | Bun type defs |
| `typescript` | ^5.9.3 | TypeScript compiler |
| `wrangler` | ^4.63.0 | Cloudflare CLI |

## Notable Constraints

- **Vortex SDK** (`@interest-protocol/vortex-sdk`) is NOT imported in the Worker (9MB exceeds CF's 3MB limit). Loaded client-side from CDN instead.
- **Hono** is the web framework (lightweight, CF Workers native)
- **Biome** replaces ESLint + Prettier (single tool)

## Related
- [[Configuration]]
- [[Deployment]]
