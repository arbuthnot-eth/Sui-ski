# Sui-ski

Cloudflare Worker gateway for the Sui blockchain. Resolves wildcard subdomains (`*.sui.ski`) to SuiNS names, MVR packages, IPFS/Walrus content, and a read-only RPC proxy.

## Deploy your own dev worker

Fork and deploy a dev instance to your Cloudflare account to test changes before submitting a PR.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/arbuthnot-eth/Sui-ski/tree/master/contribute)

The deploy button provisions a `sui-ski-dev` worker on your account with its own KV namespace and Durable Objects. No custom domain required — it runs on `*.workers.dev`.

### Local development

```bash
cd contribute
cp .dev.vars.example .dev.vars   # optional: add API keys
npx wrangler dev                 # starts local dev server
```

### What's included

| Binding | Purpose |
| ------- | ------- |
| `CACHE` (KV) | Name resolution cache |
| `WALLET_SESSIONS` (DO) | Wallet session state |

Secrets like `SUI_RPC_URL` are optional — the worker falls back to public endpoints.

## Subdomain routing

| Pattern | Route |
| ------- | ----- |
| `sui.ski` | Landing page |
| `rpc.sui.ski` | Read-only RPC proxy |
| `{name}.sui.ski` | SuiNS profile |
| `my.sui.ski` | Names dashboard |
| `app.sui.ski` | Messaging app |

## License

MIT
