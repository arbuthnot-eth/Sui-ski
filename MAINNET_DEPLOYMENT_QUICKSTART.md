# Mainnet Deployment Quickstart

## TL;DR - Deploy in 5 Minutes

```bash
# 1. Run the automated deployment script
cd /home/user/Sui-ski
./scripts/deploy-messaging-mainnet.sh

# 2. The script will:
#    - Check prerequisites
#    - Build Move contracts
#    - Deploy to mainnet
#    - Give you the package ID
#    - Optionally update wrangler.toml

# 3. Deploy sui.ski
bun run deploy

# 4. Test
curl https://sui.ski/api/messaging/status
```

## What Gets Deployed

```
Package: sui_stack_messaging
Modules: 10 Move modules
Size: ~50KB
Cost: ~0.5-1 SUI
```

**Modules:**
- channel.move (9.5KB) - Channel management
- message.move (2.2KB) - Message handling
- config.move (4.3KB) - Configuration
- auth.move (3.1KB) - Authentication
- attachment.move (1.1KB) - Walrus attachments
- encryption_key_history.move (2.3KB)
- seal_policies.move (1.3KB)
- member_cap.move (2.1KB)
- creator_cap.move (0.9KB)
- admin.move (0.4KB)

## Prerequisites Checklist

- [ ] Sui CLI installed (`sui --version`)
- [ ] Mainnet wallet configured (`sui client active-env`)
- [ ] At least 1 SUI in wallet (`sui client gas`)
- [ ] Read deployment warnings in `DEPLOY_MESSAGING_MAINNET.md`

## Manual Deployment (if script fails)

```bash
# Clone SDK
git clone https://github.com/MystenLabs/sui-stack-messaging-sdk.git /tmp/sui-sdk
cd /tmp/sui-sdk/move/sui_stack_messaging

# Build
sui move build

# Deploy
sui client publish --gas-budget 100000000

# Copy the package ID from output
# Update wrangler.toml manually:
MESSAGING_CONTRACT_ADDRESS = "0xYOUR_PACKAGE_ID_HERE"
```

## Verify Deployment

```bash
# Check package exists on-chain
sui client object YOUR_PACKAGE_ID

# View on explorer
open https://suiscan.xyz/mainnet/object/YOUR_PACKAGE_ID

# Test sui.ski API
curl https://sui.ski/api/messaging/status | jq
```

Expected response:
```json
{
  "enabled": true,
  "network": "mainnet",
  "contractAddress": "0xYOUR_PACKAGE_ID",
  "deployment": "mainnet",
  "features": {
    "oneToOne": true,
    "groupChat": true,
    "encryption": true,
    "walrusStorage": true,
    "eventDriven": true
  },
  "status": "alpha",
  "warning": "Self-deployed mainnet contract (alpha software)"
}
```

## Rollback (if needed)

⚠️ **Contracts are immutable** - you cannot undo a deployment.

If you need to "rollback":
1. Deploy a new fixed version
2. Update `MESSAGING_CONTRACT_ADDRESS` to new package
3. Old package remains on-chain (orphaned)

## Cost Breakdown

| Item | Cost (SUI) |
|------|-----------|
| Deployment | 0.4-0.8 |
| Storage | 0.1-0.2 |
| Gas buffer | 0.2 |
| **Total** | **~1 SUI** |

## What Happens After Deployment

1. ✅ Package is published to mainnet (immutable)
2. ✅ Package ID is your contract address
3. ✅ Anyone can interact with it
4. ✅ sui.ski can use it for messaging
5. ✅ Contracts live forever on-chain

## Security Considerations

⚠️ **This is alpha software:**
- No formal audits
- Not production-tested by MystenLabs
- Use at your own risk
- Monitor for issues
- Have a plan for user support

## Next Steps After Deployment

1. **Test thoroughly**
   - Try creating a channel
   - Send test messages
   - Test encryption
   - Verify Walrus attachments

2. **Monitor**
   - Watch for errors
   - Check transaction success rates
   - Monitor gas costs
   - Track user feedback

3. **Document**
   - Save package ID
   - Note deployment date
   - Record any issues
   - Keep deployment logs

4. **Communicate**
   - Update users about new feature
   - Explain alpha status
   - Provide feedback channels
   - Set expectations

## Support

- **SDK Issues**: https://github.com/MystenLabs/sui-stack-messaging-sdk/issues
- **Sui Discord**: https://discord.gg/sui
- **Sui Docs**: https://docs.sui.io

## Ready to Deploy?

```bash
./scripts/deploy-messaging-mainnet.sh
```

Good luck! 🚀
