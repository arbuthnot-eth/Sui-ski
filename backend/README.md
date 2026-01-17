# Sui gRPC Backend Proxy

High-performance backend service that provides optimized RPC access to Sui fullnodes. Designed to work with the sui.ski Cloudflare Worker proxy.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Client    │────▶│ Cloudflare Worker │────▶│  This Backend  │
│  (Browser)  │     │   (sui.ski)       │     │   (VM/Cloud)   │
└─────────────┘     └──────────────────┘     └───────┬────────┘
                                                      │
                                                      ▼
                                             ┌────────────────┐
                                             │ Sui Fullnodes  │
                                             │  (gRPC/HTTP)   │
                                             └────────────────┘
```

## Features

- **Connection Pooling** - Maintains persistent connections to Sui nodes
- **Load Balancing** - Round-robin across multiple RPC endpoints
- **Response Caching** - In-memory cache for read-only operations
- **Request Batching** - Process up to 50 requests per batch
- **Rate Limiting** - Configurable per-client rate limits
- **Health Monitoring** - Built-in health checks and metrics
- **API Key Auth** - Optional authentication for the proxy

## Quick Start

### Using Bun (Development)

```bash
# Install dependencies
bun install

# Start server
bun run dev

# Or with custom RPC URL
SUI_RPC_URL=https://fullnode.mainnet.sui.io:443 bun run dev
```

### Using Docker

```bash
# Build image
docker build -t sui-grpc-backend .

# Run container
docker run -p 8080:8080 \
  -e SUI_RPC_URL=https://fullnode.mainnet.sui.io:443 \
  sui-grpc-backend
```

### Using Docker Compose

```bash
# Start service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop service
docker-compose down
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `8080` | Server port |
| `SUI_RPC_URL` | `https://fullnode.mainnet.sui.io:443` | Primary Sui RPC endpoint |
| `SUI_RPC_URL_BACKUP` | - | Backup RPC endpoint for failover |
| `API_KEY` | - | Optional API key for authentication |
| `MAX_BATCH_SIZE` | `50` | Maximum requests per batch |
| `CACHE_ENABLED` | `true` | Enable response caching |
| `CACHE_TTL_MS` | `5000` | Cache TTL in milliseconds |
| `RATE_LIMIT_PER_MINUTE` | `1000` | Max requests per client per minute |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

## API Endpoints

### Health Check

```bash
GET /health
```

Returns server health, latency, and statistics.

### JSON-RPC

```bash
POST /rpc
Content-Type: application/json
Authorization: Bearer <api-key>  # If API_KEY is set

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sui_getObject",
  "params": ["0x..."]
}
```

### Batch JSON-RPC

```bash
POST /rpc/batch
Content-Type: application/json

[
  { "jsonrpc": "2.0", "id": 1, "method": "sui_getObject", "params": ["0x..."] },
  { "jsonrpc": "2.0", "id": 2, "method": "sui_getObject", "params": ["0x..."] }
]
```

## Supported Methods

### Object Methods
- `sui_getObject`
- `sui_multiGetObjects`
- `sui_getOwnedObjects` / `suix_getOwnedObjects`

### Transaction Methods
- `sui_getTransactionBlock`
- `sui_multiGetTransactionBlocks`
- `sui_executeTransactionBlock`
- `sui_dryRunTransactionBlock`
- `suix_queryTransactionBlocks`

### Event Methods
- `sui_queryEvents` / `suix_queryEvents`

### Balance & Coin Methods
- `suix_getBalance`
- `suix_getAllBalances`
- `suix_getCoins`
- `suix_getAllCoins`

### Dynamic Field Methods
- `suix_getDynamicFields`
- `suix_getDynamicFieldObject`

### Name Service Methods
- `suix_resolveNameServiceAddress`
- `suix_resolveNameServiceNames`

### Chain Info Methods
- `sui_getChainIdentifier`
- `sui_getLatestCheckpointSequenceNumber`
- `sui_getCheckpoint`
- `sui_getTotalTransactionBlocks`
- `suix_getReferenceGasPrice`
- `sui_getProtocolConfig`

## Connecting to sui.ski

1. Deploy this backend to a server (VM, Cloud Run, etc.)
2. Configure the Cloudflare Worker secrets:

```bash
# In the sui-ski project directory
wrangler secret put GRPC_BACKEND_URL
# Enter: https://your-backend-url.com

wrangler secret put GRPC_BACKEND_API_KEY
# Enter: your-api-key (if using authentication)
```

3. The Worker will now route heavy operations through this backend.

## Deployment Options

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT_ID/sui-grpc-backend

# Deploy
gcloud run deploy sui-grpc-backend \
  --image gcr.io/PROJECT_ID/sui-grpc-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "SUI_RPC_URL=https://fullnode.mainnet.sui.io:443"
```

### AWS ECS / Fargate

```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URI
docker tag sui-grpc-backend:latest $ECR_URI/sui-grpc-backend:latest
docker push $ECR_URI/sui-grpc-backend:latest

# Deploy via ECS task definition
```

### DigitalOcean App Platform

```bash
# Create app from Dockerfile
doctl apps create --spec .do/app.yaml
```

### Self-hosted (systemd)

```bash
# Create service file
sudo tee /etc/systemd/system/sui-grpc-backend.service << EOF
[Unit]
Description=Sui gRPC Backend Proxy
After=network.target

[Service]
Type=simple
User=sui
WorkingDirectory=/opt/sui-grpc-backend
ExecStart=/usr/local/bin/bun run src/server.ts
Restart=always
RestartSec=10
Environment=SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
Environment=PORT=8080

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable sui-grpc-backend
sudo systemctl start sui-grpc-backend
```

## Performance Tuning

### For High Traffic

```env
# Increase batch size
MAX_BATCH_SIZE=100

# Longer cache TTL
CACHE_TTL_MS=10000

# Higher rate limits
RATE_LIMIT_PER_MINUTE=5000
```

### For Low Latency

```env
# Disable cache for real-time data
CACHE_ENABLED=false

# Use regional RPC endpoints
SUI_RPC_URL=https://sui-mainnet-rpc.allthatnode.com
SUI_RPC_URL_BACKUP=https://fullnode.mainnet.sui.io:443
```

### Multiple Backends (Load Balanced)

Deploy multiple instances behind a load balancer and configure multiple RPC endpoints:

```env
SUI_RPC_URL=https://rpc1.example.com
SUI_RPC_URL_BACKUP=https://rpc2.example.com
```

## Monitoring

The `/health` endpoint returns useful metrics:

```json
{
  "status": "healthy",
  "healthy": true,
  "latencyMs": 45,
  "chainId": "35834a8a",
  "uptime": 3600000,
  "stats": {
    "totalRequests": 15000,
    "cacheHits": 8500,
    "cacheMisses": 6500,
    "cacheSize": 250,
    "errors": 12
  }
}
```

Integrate with your monitoring system (Prometheus, Datadog, etc.) by scraping this endpoint.

## License

MIT
