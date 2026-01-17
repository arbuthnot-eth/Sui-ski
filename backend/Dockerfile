# Sui gRPC Backend Proxy
# Build: docker build -t sui-grpc-backend .
# Run: docker run -p 8080:8080 -e SUI_RPC_URL=https://fullnode.mainnet.sui.io:443 sui-grpc-backend

FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY src ./src
COPY tsconfig.json ./

# Build
RUN bun build src/server.ts --outdir dist --target bun

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Expose port
EXPOSE 8080

# Run
CMD ["bun", "run", "dist/server.js"]
