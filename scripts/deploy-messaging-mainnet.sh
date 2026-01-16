#!/usr/bin/env bash
set -euo pipefail

# Sui Stack Messaging SDK Mainnet Deployment Script
# Usage: ./scripts/deploy-messaging-mainnet.sh

echo "🚀 Sui Stack Messaging SDK Mainnet Deployment"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo -e "${RED}❌ Error: sui CLI not found${NC}"
    echo "Install it with:"
    echo "  cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui"
    exit 1
fi

echo -e "${GREEN}✅ sui CLI found${NC}"

# Check active environment
ACTIVE_ENV=$(sui client active-env 2>/dev/null || echo "none")
echo "Current environment: $ACTIVE_ENV"

if [ "$ACTIVE_ENV" != "mainnet" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not on mainnet!${NC}"
    read -p "Switch to mainnet? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sui client switch --env mainnet
    else
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Check wallet balance
echo ""
echo "Checking wallet balance..."
BALANCE=$(sui client gas --json | jq -r '.[0].mistBalance' 2>/dev/null || echo "0")
BALANCE_SUI=$(echo "scale=4; $BALANCE / 1000000000" | bc)
echo "Balance: $BALANCE_SUI SUI"

if (( $(echo "$BALANCE_SUI < 1" | bc -l) )); then
    echo -e "${RED}❌ Insufficient balance${NC}"
    echo "You need at least 1 SUI for deployment"
    exit 1
fi

echo -e "${GREEN}✅ Sufficient balance${NC}"

# Clone or update SDK repository
SDK_DIR="/tmp/sui-stack-messaging-sdk"
if [ -d "$SDK_DIR" ]; then
    echo ""
    echo "SDK repository exists, pulling latest..."
    cd "$SDK_DIR"
    git pull
else
    echo ""
    echo "Cloning SDK repository..."
    git clone https://github.com/MystenLabs/sui-stack-messaging-sdk.git "$SDK_DIR"
    cd "$SDK_DIR"
fi

# Build the package
echo ""
echo "Building Move package..."
cd move/sui_stack_messaging
sui move build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Show deployment confirmation
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT WARNINGS:${NC}"
echo "  • This is ALPHA software (not production-ready)"
echo "  • No formal security audits"
echo "  • Contracts are IMMUTABLE once deployed"
echo "  • Estimated cost: ~0.5-1 SUI"
echo "  • You are responsible for all consequences"
echo ""
read -p "Deploy to MAINNET? (type 'YES' to confirm): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy to mainnet
echo ""
echo "Deploying to mainnet..."
echo "This may take a minute..."
echo ""

DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 --json)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

# Extract package ID
PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | jq -r '.objectChanges[] | select(.type == "published") | .packageId')

if [ -z "$PACKAGE_ID" ] || [ "$PACKAGE_ID" == "null" ]; then
    echo -e "${RED}❌ Could not extract package ID${NC}"
    echo "Deployment output:"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}📦 Package ID: $PACKAGE_ID${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save to file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="./deployment_${TIMESTAMP}.txt"
echo "PACKAGE_ID=$PACKAGE_ID" > "$OUTPUT_FILE"
echo "TIMESTAMP=$TIMESTAMP" >> "$OUTPUT_FILE"
echo "NETWORK=mainnet" >> "$OUTPUT_FILE"

echo "Deployment details saved to: $OUTPUT_FILE"
echo ""

# Generate wrangler.toml update
echo "Update your wrangler.toml with:"
echo ""
echo "[vars]"
echo "SUI_NETWORK = \"mainnet\""
echo "SUI_RPC_URL = \"https://fullnode.mainnet.sui.io:443\""
echo "WALRUS_NETWORK = \"mainnet\""
echo "MESSAGING_CONTRACT_ADDRESS = \"$PACKAGE_ID\""
echo ""

# Ask if user wants to update wrangler.toml automatically
read -p "Update wrangler.toml automatically? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    WRANGLER_TOML="../../Sui-ski/wrangler.toml"
    if [ -f "$WRANGLER_TOML" ]; then
        # Backup original
        cp "$WRANGLER_TOML" "${WRANGLER_TOML}.backup"

        # Update MESSAGING_CONTRACT_ADDRESS
        sed -i "s/^MESSAGING_CONTRACT_ADDRESS = .*/MESSAGING_CONTRACT_ADDRESS = \"$PACKAGE_ID\"/" "$WRANGLER_TOML"

        echo -e "${GREEN}✅ wrangler.toml updated${NC}"
        echo "Backup saved to: ${WRANGLER_TOML}.backup"
    else
        echo -e "${YELLOW}⚠️  wrangler.toml not found at expected location${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Update wrangler.toml with package ID (if not done automatically)"
echo "2. Deploy sui.ski to Cloudflare: bun run deploy"
echo "3. Test messaging at sui.ski/messages"
echo "4. Monitor for any issues"
echo ""
echo "View on explorer:"
echo "https://suiscan.xyz/mainnet/object/$PACKAGE_ID"
echo ""
