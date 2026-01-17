# Move Registry (MVR) Improvements

This document describes the comprehensive improvements made to the Move Registry functionality in sui.ski, including signature generation for package management operations.

## Overview

The MVR improvements provide a complete package management system with:

1. **Transaction Builder Utilities** - Generate unsigned transactions for offline signing
2. **Management API Endpoints** - RESTful API for all package operations
3. **Web UI** - User-friendly interface for package management
4. **Enhanced Package Discovery** - Search and browse packages
5. **Improved Package Pages** - Better display and management options

## Features

### 1. Transaction Builder (`src/utils/mvr-transactions.ts`)

Generate unsigned transactions for all package management operations:

#### Register a New Package

```typescript
import { buildRegisterPackageTx } from './utils/mvr-transactions'

const tx = buildRegisterPackageTx({
  suinsName: 'myname',
  packageName: 'core',
  packageAddress: '0x123...',
  metadata: {
    description: 'Core utilities',
    repository: 'https://github.com/user/repo',
    documentation: 'https://docs.example.com'
  }
}, 'mainnet')

// Serialize for signing
const txBytes = await serializeTransaction(tx, env)
```

#### Publish a New Version

```typescript
const tx = buildPublishVersionTx({
  suinsName: 'myname',
  packageName: 'core',
  packageAddress: '0x456...',
  version: 2
}, 'mainnet')
```

#### Update Package Metadata

```typescript
const tx = buildUpdateMetadataTx({
  suinsName: 'myname',
  packageName: 'core',
  metadata: {
    description: 'Updated description',
    documentation: 'https://new-docs.example.com'
  }
}, 'mainnet')
```

#### Transfer Package Ownership

```typescript
const tx = buildTransferOwnershipTx({
  suinsName: 'myname',
  packageName: 'core',
  newOwner: '0x789...'
}, 'mainnet')
```

### 2. Management API Endpoints

#### POST /api/mvr/register

Register a new package in the Move Registry.

**Request:**
```json
{
  "suinsName": "myname",
  "packageName": "core",
  "packageAddress": "0x123...",
  "metadata": {
    "description": "Core utilities",
    "repository": "https://github.com/user/repo",
    "documentation": "https://docs.example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "operation": "register_package",
  "transaction": {
    "bytes": "AAACAAgB...",
    "digest": "0xabc..."
  },
  "package": {
    "name": "@myname/core",
    "address": "0x123..."
  },
  "instructions": {
    "step1": "Sign the transaction bytes with your wallet",
    "step2": "Submit the signed transaction to the network",
    "step3": "Your package will be registered in the Move Registry"
  }
}
```

#### POST /api/mvr/publish-version

Publish a new version of an existing package.

**Request:**
```json
{
  "suinsName": "myname",
  "packageName": "core",
  "packageAddress": "0x456...",
  "version": 2
}
```

#### POST /api/mvr/update-metadata

Update package metadata.

**Request:**
```json
{
  "suinsName": "myname",
  "packageName": "core",
  "metadata": {
    "description": "Updated description",
    "documentation": "https://new-docs.example.com"
  }
}
```

#### POST /api/mvr/transfer

Transfer package ownership.

**Request:**
```json
{
  "suinsName": "myname",
  "packageName": "core",
  "newOwner": "0x789..."
}
```

#### GET /api/mvr/packages/:suinsName

List all packages registered under a SuiNS name.

**Response:**
```json
{
  "suinsName": "myname",
  "packages": [
    {
      "name": "@myname/core",
      "address": "0x123...",
      "version": 2,
      "metadata": {
        "description": "Core utilities",
        "repository": "https://github.com/user/repo"
      }
    }
  ],
  "count": 1
}
```

#### GET /api/mvr/search?q={query}

Search for packages across the registry.

**Response:**
```json
{
  "query": "core",
  "results": [
    {
      "name": "@myname/core",
      "address": "0x123...",
      "version": 2
    },
    {
      "name": "@suifrens/core",
      "address": "0xabc...",
      "version": 1
    }
  ],
  "count": 2
}
```

### 3. Web UI (`/mvr`)

Access the package management UI at: **https://sui.ski/mvr**

Features:
- **Register Package** - Form to register new packages
- **Publish Version** - Form to publish new versions
- **Update Metadata** - Form to update package metadata
- **Transfer Ownership** - Form to transfer package ownership
- **Browse Packages** - Search and list packages

The UI generates unsigned transactions that can be:
1. Copied to clipboard
2. Signed with a wallet (e.g., Sui Wallet, Ethos Wallet)
3. Submitted to the network

### 4. Enhanced Package Pages

When accessing a package via subdomain (e.g., `core--myname.sui.ski`), the page now includes:

- Package icon and visual design
- Version badge and network indicator
- Package address with copy functionality
- Links to explorer, documentation, and repository
- **"Manage Package" button** - Links to management UI
- Improved styling and responsive design

## Offline Signing Workflow

The MVR management system supports offline signing for maximum security:

1. **Generate Transaction** - Use the API or UI to generate an unsigned transaction
2. **Copy Transaction Bytes** - The transaction is serialized to base64
3. **Sign Offline** - Use your wallet to sign the transaction bytes
4. **Submit Transaction** - Send the signed transaction to the network

This allows you to:
- Keep private keys offline
- Use hardware wallets
- Review transactions before signing
- Implement multi-sig workflows

## Package Naming Convention

Packages follow the format: `@{suinsName}/{packageName}`

Examples:
- `@myname/core` → `core--myname.sui.ski`
- `@suifrens/nft` → `nft--suifrens.sui.ski`
- `@myname/utils/2` → `utils--myname--v2.sui.ski`

## Configuration

### Environment Variables

Set the Move Registry parent object ID in `wrangler.toml`:

```toml
[env.production.vars]
MOVE_REGISTRY_PARENT_ID = "0x..."
```

Or configure in `src/utils/mvr-transactions.ts`:

```typescript
export const MVR_PACKAGE_ID = {
  mainnet: '0x...', // MVR package ID on mainnet
  testnet: '0x...'  // MVR package ID on testnet
}
```

## File Structure

```
src/
├── utils/
│   └── mvr-transactions.ts      # Transaction builder utilities
├── handlers/
│   ├── mvr-management.ts        # API endpoint handlers
│   └── mvr-ui.ts                # Web UI generator
├── resolvers/
│   └── mvr.ts                   # Package resolution (existing)
└── index.ts                     # Route configuration
```

## API Client Examples

### JavaScript/TypeScript

```typescript
// Register a package
const response = await fetch('https://sui.ski/api/mvr/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    suinsName: 'myname',
    packageName: 'core',
    packageAddress: '0x123...',
    metadata: {
      description: 'My package',
      repository: 'https://github.com/user/repo'
    }
  })
})

const data = await response.json()
console.log('Transaction bytes:', data.transaction.bytes)

// Sign with wallet
const signature = await wallet.signTransactionBlock({
  transactionBlock: data.transaction.bytes
})

// Submit to network
const result = await suiClient.executeTransactionBlock({
  transactionBlock: data.transaction.bytes,
  signature
})
```

### cURL

```bash
# Register a package
curl -X POST https://sui.ski/api/mvr/register \
  -H "Content-Type: application/json" \
  -d '{
    "suinsName": "myname",
    "packageName": "core",
    "packageAddress": "0x123...",
    "metadata": {
      "description": "My package"
    }
  }'

# Search packages
curl "https://sui.ski/api/mvr/search?q=core"

# List packages for a SuiNS name
curl "https://sui.ski/api/mvr/packages/myname"
```

## Security Considerations

1. **Offline Signing** - Private keys never touch the server
2. **Transaction Review** - Users can review transactions before signing
3. **Ownership Verification** - Only package owners can update/transfer
4. **Gas Budgets** - Configurable gas budgets with sensible defaults
5. **Input Validation** - All inputs validated before transaction generation

## Future Enhancements

Potential improvements for future versions:

1. **Multi-sig Support** - Support for multi-signature package ownership
2. **Package Dependencies** - Track and display package dependencies
3. **Version History** - View full version history and changelogs
4. **Package Stats** - Download counts, usage statistics
5. **Package Verification** - Verify package source code matches on-chain bytecode
6. **Batch Operations** - Manage multiple packages at once
7. **Package Templates** - Pre-configured templates for common package types
8. **CI/CD Integration** - GitHub Actions workflows for automated publishing

## Testing

To test the MVR improvements:

1. Start the development server:
   ```bash
   bun run dev
   ```

2. Access the management UI:
   ```
   http://localhost:8787/mvr
   ```

3. Test API endpoints:
   ```bash
   # Test register endpoint
   curl -X POST http://localhost:8787/api/mvr/register \
     -H "Content-Type: application/json" \
     -d '{"suinsName":"test","packageName":"demo","packageAddress":"0x1"}'
   ```

## Support

For issues or questions:
- Open an issue at https://github.com/arbuthnot-eth/Sui-ski
- Visit the documentation at https://sui.ski/mvr

## License

Same license as the main sui.ski project.
