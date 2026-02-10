---
tags: [infrastructure, dns, cloudflare]
---

# DNS Setup

Cloudflare DNS configuration for wildcard subdomain routing.

## Required Records

| Type | Name | Value | Proxied |
|------|------|-------|---------|
| A | `*` | `192.0.2.0` | Yes |
| A | `@` | `192.0.2.0` | Yes |

The `192.0.2.0` address is a dummy IP (RFC 5737 documentation range). Cloudflare proxying ensures all traffic hits the Worker, not the dummy IP.

## Worker Routes

| Pattern | Worker |
|---------|--------|
| `*.sui.ski/*` | `sui-ski-gateway` |
| `sui.ski/*` | `sui-ski-gateway` |

Plus testnet and devnet routes (`.t.sui.ski`, `.d.sui.ski`).

## How It Works

1. Browser requests `brandon.sui.ski`
2. DNS resolves via Cloudflare (proxied A record)
3. Cloudflare Worker route matches `*.sui.ski/*`
4. Worker receives request, parses subdomain
5. Routes to appropriate handler

## Related
- [[Deployment]]
- [[Configuration]]
- [[Subdomain Routing]]
