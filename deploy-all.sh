#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== Deploying sui-ski-gateway ==="
cd "$ROOT"
npx wrangler@latest deploy

echo ""
echo "=== Deploying sui-ski-lift ==="
cd "$ROOT/lift"
npx wrangler@latest deploy

echo ""
echo "=== All workers deployed ==="
