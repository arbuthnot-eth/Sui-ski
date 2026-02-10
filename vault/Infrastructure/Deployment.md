---
tags: [infrastructure, deployment, cloudflare]
---

# Deployment

Sui-ski deploys as a Cloudflare Worker with KV and Durable Object bindings.

## Deploy Command

```bash
npx wrangler deploy
```

> **Do NOT use `bun run deploy`** - it fails with auth token errors in this environment.

## CI/CD

GitHub Actions workflow added in commit `0982d9e`:
- Automatic deployment on push
- TypeScript type checking
- Biome linting

## Worker Routes

| Route | Target |
|-------|--------|
| `*.sui.ski/*` | sui-ski-gateway |
| `sui.ski/*` | sui-ski-gateway |
| `*.t.sui.ski/*` | sui-ski-gateway (testnet) |
| `t.sui.ski/*` | sui-ski-gateway (testnet) |
| `*.d.sui.ski/*` | sui-ski-gateway (devnet) |
| `d.sui.ski/*` | sui-ski-gateway (devnet) |

## Pre-Deploy Checklist

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes (zero warnings)
- [ ] `bun test` passes
- [ ] No `any` or `@ts-ignore`
- [ ] Commit message follows format
- [ ] Single logical change
- [ ] No secrets committed

## Backend Services

### gRPC Backend (`backend/`)
- Docker + Docker Compose ready
- Deployment guides for: Cloud Run, ECS, DigitalOcean, self-hosted
- Connection pooling, load balancing, caching

### Proxy Service (`proxy/`)
- Vercel or Fly.io deployment
- Health, lookup, reverse lookup endpoints

## Related
- [[Configuration]]
- [[DNS Setup]]
- [[Current Sprint]]
