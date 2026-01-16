# Deploying Sui Stack Messaging SDK to Mainnet

This guide will help you deploy the Sui Stack Messaging SDK contracts to Sui mainnet for use with sui.ski.

## ⚠️ Important Warnings

- **Alpha Software**: This SDK is officially in alpha and not production-tested by MystenLabs
- **No Audits**: These contracts have not undergone formal security audits
- **Gas Costs**: Deployment will cost SUI tokens (~0.5-1 SUI estimated)
- **Irreversible**: Once deployed to mainnet, contracts are permanent
- **Risk**: Use at your own risk - this is experimental

## Prerequisites

1. **Sui CLI installed**
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch mainnet sui
   ```

2. **Funded mainnet wallet**
   - You need SUI tokens for gas fees
   - Estimate: ~0.5-1 SUI for deployment

3. **Active mainnet environment**
   ```bash
   sui client active-env
   # Should show: mainnet
   ```

## Step 1: Clone the SDK Repository

```bash
cd /tmp
git clone https://github.com/MystenLabs/sui-stack-messaging-sdk.git
cd sui-stack-messaging-sdk
```

## Step 2: Build the Move Package

```bash
cd move/sui_stack_messaging
sui move build
```

**Expected output:** Package builds successfully with no errors

## Step 3: Deploy to Mainnet

```bash
# Deploy with sufficient gas budget
sui client publish --gas-budget 100000000

# Or if you want to see what will happen first (dry run):
sui client publish --gas-budget 100000000 --dry-run
```

## Step 4: Save the Package ID

After successful deployment, you'll see output like:

```
╭─────────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                                        │
│  ┌──                                                                                    │
│  │ ObjectID: 0xABCDEF1234567890...                                                     │
│  │ Sender: 0x...                                                                       │
│  │ Owner: Immutable                                                                    │
│  │ ObjectType: 0xABCDEF1234567890...::sui_stack_messaging                            │
│  └──                                                                                    │
╰─────────────────────────────────────────────────────────────────────────────────────────╯
```

**Copy the Package ID** (the long hex string starting with 0x) - this is your `MESSAGING_CONTRACT_ADDRESS`

## Step 5: Update sui.ski Configuration

Edit `/home/user/Sui-ski/wrangler.toml`:

```toml
[vars]
SUI_NETWORK = "mainnet"
SUI_RPC_URL = "https://fullnode.mainnet.sui.io:443"
WALRUS_NETWORK = "mainnet"
# Replace with your deployed package address
MESSAGING_CONTRACT_ADDRESS = "0xYOUR_PACKAGE_ID_HERE"
```

## Step 6: Test the Deployment

```bash
# Query the package to verify it's on mainnet
sui client object <YOUR_PACKAGE_ID>
```

## Contract Details

The deployed package includes these modules:

- **channel.move** - Channel creation and management
- **message.move** - Message sending and retrieval
- **config.move** - Configuration settings
  - Max 10 members per channel
  - Max 512 chars per message
  - Max 10 attachments per message
- **auth.move** - Authentication and authorization
- **attachment.move** - Walrus attachment support
- **encryption_key_history.move** - Key management
- **seal_policies.move** - Access control policies
- **member_cap.move** - Membership capabilities
- **creator_cap.move** - Creator capabilities
- **admin.move** - Admin functions

## Configuration Defaults

```
MAX_CHANNEL_MEMBERS: 10
MAX_CHANNEL_ROLES: 3
MAX_MESSAGE_TEXT_SIZE_IN_CHARS: 512
MAX_MESSAGE_ATTACHMENTS: 10
REQUIRE_INVITATION: false
REQUIRE_REQUEST: false
EMIT_EVENTS: true
```

## After Deployment

1. **Update sui.ski** with the new package address
2. **Test messaging** on mainnet
3. **Monitor** for any issues
4. **Consider** setting up monitoring/alerting
5. **Document** the deployment for your team

## Rollback Plan

⚠️ **Important**: Smart contracts on Sui are immutable once deployed. There is no rollback.

If issues arise:
- Deploy a new version with fixes
- Update sui.ski to point to the new package
- Old package remains on-chain but can be deprecated

## Alternative: Use Testnet First

**Recommended approach**: Deploy to testnet first to verify everything works

```bash
sui client switch --env testnet
cd move/sui_stack_messaging
sui client publish --gas-budget 100000000
```

Test thoroughly on testnet before mainnet deployment.

## Estimated Costs

- **Deployment**: ~0.5-1 SUI (one-time)
- **Storage**: ~0.1-0.2 SUI (one-time)
- **Transaction fees**: Per-transaction costs for users

## Support

- GitHub Issues: https://github.com/MystenLabs/sui-stack-messaging-sdk/issues
- Sui Discord: https://discord.gg/sui
- Sui Stack Docs: https://docs.sui.io

## Legal Disclaimer

This is alpha software. By deploying to mainnet, you acknowledge:
- No warranties or guarantees
- Potential for bugs or vulnerabilities
- You are responsible for all costs and consequences
- This is not officially supported by MystenLabs for mainnet use

## Ready to Deploy?

If you're ready to proceed:

1. ✅ Review all warnings above
2. ✅ Ensure you have funded mainnet wallet
3. ✅ Run the deployment commands
4. ✅ Update sui.ski configuration
5. ✅ Test thoroughly before announcing

Good luck! 🚀
