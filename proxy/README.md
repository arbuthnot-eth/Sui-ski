# Surflux gRPC Proxy

HTTP proxy for Surflux's gRPC NameService API. Required because Cloudflare Workers can't make native gRPC requests.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/lookup?name=example.sui` | Resolve SuiNS name → address |
| GET/POST | `/reverse?address=0x...` | Reverse lookup address → name |
| GET | `/health` | Health check |

## Local Development

```bash
export SURFLUX_API_KEY="your-api-key"
npm install
npm run dev
```

## Deploy to Fly.io

```bash
# Install flyctl if needed
curl -L https://fly.io/install.sh | sh

# Login and create app
fly auth login
fly apps create surflux-grpc-proxy

# Set the API key secret
fly secrets set SURFLUX_API_KEY="your-api-key"

# Deploy
fly deploy

# Your proxy will be at: https://surflux-grpc-proxy.fly.dev
```

## Deploy to Railway

1. Connect your repo to Railway
2. Set `SURFLUX_API_KEY` environment variable
3. Deploy

## Deploy to Render

1. Create new Web Service from repo
2. Set build command: `npm install`
3. Set start command: `node --experimental-strip-types index.ts`
4. Add `SURFLUX_API_KEY` env var

## Usage from Cloudflare Worker

```typescript
const PROXY_URL = 'https://surflux-grpc-proxy.fly.dev'

async function lookupName(name: string) {
  const res = await fetch(`${PROXY_URL}/lookup?name=${encodeURIComponent(name)}`)
  return res.json()
}

async function reverseLookup(address: string) {
  const res = await fetch(`${PROXY_URL}/reverse?address=${encodeURIComponent(address)}`)
  return res.json()
}
```

## Response Format

```json
{
  "record": {
    "id": "0x...",
    "name": "example.sui",
    "registrationNftId": "0x...",
    "expirationTimestamp": {
      "seconds": "1789532252",
      "nanos": 515000000
    },
    "targetAddress": "0x...",
    "data": {}
  }
}
```
