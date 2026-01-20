# Sui Stack Messaging SDK

A framework-agnostic client library for sending and receiving encrypted messages using the Sui Stack (Sui + Walrus + Seal).

## Features

- ✅ **End-to-end encryption** with Seal protocol
- ✅ **SuiNS name resolution** (@user.sui → Sui address)
- ✅ **Wallet signature verification** for message authenticity
- ✅ **Decentralized storage** on Walrus
- ✅ **Framework-agnostic** (no DOM dependencies)
- ✅ **TypeScript** support with full type definitions

## Installation

```bash
# The SDK is part of the sui.ski codebase
# Import from src/sdk/messaging-client
```

## Quick Start

### Basic Usage

```typescript
import { MessagingClient, createDefaultSuiNSResolver, DEFAULT_SEAL_TESTNET_CONFIG } from './sdk/messaging-client'

// Create a wallet signer
const signer: WalletSigner = {
  async getAddress() {
    return '0x...' // Your wallet address
  },
  async signPersonalMessage(message: Uint8Array) {
    // Sign with your wallet
    return { signature: '...' }
  },
  async getPrimaryName() {
    return 'yourname.sui' // Optional
  }
}

// Create the client
const client = new MessagingClient({
  signer,
  suinsResolver: createDefaultSuiNSResolver('https://fullnode.testnet.sui.io:443', 'testnet'),
  sealConfig: DEFAULT_SEAL_TESTNET_CONFIG,
  apiEndpoint: '/api/app/messages/send',
})

// Send a message
await client.sendMessage('@recipient.sui', 'Hello!')

// Fetch messages
const messages = await client.fetchMessages(address)
```

### Browser Integration

For browser environments, use the browser adapter:

```typescript
import { createBrowserMessagingClient } from './sdk/messaging-client-browser'

const client = createBrowserMessagingClient(
  wallet,
  account,
  () => connectedAddress,
  () => connectedPrimaryName,
  'https://fullnode.testnet.sui.io:443',
  'testnet'
)

if (client) {
  await client.sendMessage('@user.sui', 'Hello!')
}
```

## API Reference

### MessagingClient

#### Constructor

```typescript
new MessagingClient(config: MessagingClientConfig)
```

**Config Options:**
- `signer: WalletSigner` - Wallet signer for authentication
- `suinsResolver?: SuiNSResolver` - Optional SuiNS name resolver
- `sealConfig: SealConfig` - Seal encryption configuration
- `apiEndpoint?: string` - API endpoint for sending messages (default: `/api/app/messages/send`)
- `suiRpcUrl?: string` - Sui RPC URL
- `network?: 'mainnet' | 'testnet'` - Network (default: `testnet`)

#### Methods

##### `sendMessage(recipientNameOrAddress: string, content: string): Promise<SendMessageResult>`

Send an encrypted message to a recipient.

```typescript
const result = await client.sendMessage('@user.sui', 'Hello!')
// Returns: { id, blobId, timestamp, encrypted: true, status: 'sent' }
```

**Parameters:**
- `recipientNameOrAddress` - SuiNS name (@user.sui) or Sui address (0x...)
- `content` - Message content (max 1000 characters)

**Throws:**
- `Error` if wallet not connected
- `Error` if content is empty or too long
- `Error` if recipient cannot be resolved
- `Error` if encryption fails
- `Error` if API call fails

##### `fetchMessages(address: string, apiEndpoint?: string): Promise<MessageData[]>`

Fetch messages for an address (inbox).

```typescript
const messages = await client.fetchMessages('0x...')
```

**Parameters:**
- `address` - Sui address to fetch messages for
- `apiEndpoint` - Optional custom API endpoint (default: `/api/app/messages/inbox`)

**Returns:** Array of message data objects

##### `loadConversations(address: string, apiEndpoint?: string): Promise<unknown[]>`

Load conversation list for an address.

```typescript
const conversations = await client.loadConversations('0x...')
```

##### `encryptForRecipient(message: MessageData, recipientAddress: string): Promise<EncryptedMessage | null>`

Encrypt a message for a specific recipient using Seal.

##### `decryptWithSeal(encryptedEnvelope: SealEncryptedEnvelope, recipientAddress: string): Promise<MessageData | null>`

Decrypt a message using Seal SDK.

##### `resolveRecipient(recipientNameOrAddress: string): Promise<string>`

Resolve a SuiNS name or address to a Sui address.

##### `hashContent(content: string): Promise<string>`

Hash content using SHA-256 (for signatures).

##### `initSealClient(): Promise<SealClient | null>`

Initialize Seal client for encryption/decryption.

##### `createSessionKey(): Promise<SessionKey | null>`

Create a session key for decryption (proves wallet ownership).

## Types

### WalletSigner

```typescript
interface WalletSigner {
  getAddress(): Promise<string>
  signPersonalMessage(message: Uint8Array): Promise<{ signature: string; bytes?: Uint8Array }>
  getPrimaryName?(): Promise<string | null>
}
```

### MessageData

```typescript
interface MessageData {
  from: string
  fromName: string | null
  to: string
  toName: string
  content: string
  timestamp: number
  nonce: string
  signature?: string
  signaturePayload?: string
}
```

### SendMessageResult

```typescript
interface SendMessageResult {
  id: string
  blobId?: string
  timestamp: number
  encrypted: boolean
  status: 'sent'
}
```

### SealConfig

```typescript
interface SealConfig {
  packageId: string
  keyServers: string[]
  rpcUrl?: string
  approveTarget?: string
  threshold?: number
}
```

## Seal Encryption Configuration

### Testnet (Open Mode)

The SDK includes default testnet configuration with open mode key servers:

```typescript
import { DEFAULT_SEAL_TESTNET_CONFIG } from './sdk/messaging-client'

const client = new MessagingClient({
  signer,
  sealConfig: DEFAULT_SEAL_TESTNET_CONFIG,
  // ...
})
```

**Default Testnet Config:**
- Package ID: `0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82`
- Key Servers: Mysten Labs #1, Mysten Labs #2, Triton One
- RPC URL: `https://fullnode.testnet.sui.io:443`
- Threshold: 2

### Mainnet

For mainnet, you'll need to:
1. Register your package with Seal key server providers
2. Configure your own key servers
3. Set up the `seal_approve` target

```typescript
const mainnetSealConfig: SealConfig = {
  packageId: '0x...', // Your package ID
  keyServers: ['0x...', '0x...'], // Your key server object IDs
  rpcUrl: 'https://fullnode.mainnet.sui.io:443',
  approveTarget: '0x...::module::seal_approve',
  threshold: 2,
}
```

## SuiNS Name Resolution

The SDK supports resolving SuiNS names to addresses:

```typescript
// Automatic resolution
await client.sendMessage('@user.sui', 'Hello!')

// Manual resolution
const address = await client.resolveRecipient('@user.sui')
```

### Custom Resolver

You can provide a custom SuiNS resolver:

```typescript
const customResolver: SuiNSResolver = {
  async resolveAddress(nameOrAddress: string): Promise<string | null> {
    // Your custom resolution logic
    return address
  }
}

const client = new MessagingClient({
  signer,
  suinsResolver: customResolver,
  // ...
})
```

## Error Handling

The SDK throws errors for various failure scenarios:

```typescript
try {
  await client.sendMessage('@user.sui', 'Hello!')
} catch (error) {
  if (error.message.includes('Wallet not connected')) {
    // Handle wallet connection error
  } else if (error.message.includes('Could not resolve')) {
    // Handle name resolution error
  } else if (error.message.includes('Encryption failed')) {
    // Handle encryption error
  } else {
    // Handle other errors
  }
}
```

## Best Practices

1. **Always check wallet connection** before sending messages
2. **Handle errors gracefully** - network issues, encryption failures, etc.
3. **Cache resolved addresses** to reduce API calls
4. **Validate message content** before sending (length, format, etc.)
5. **Use proper error messages** for better user experience

## Examples

### Sending a Message

```typescript
try {
  const result = await client.sendMessage('@alice.sui', 'Hello Alice!')
  console.log('Message sent:', result.id)
} catch (error) {
  console.error('Failed to send:', error.message)
}
```

### Fetching Inbox

```typescript
const messages = await client.fetchMessages(address)
messages.forEach(msg => {
  console.log(`From: ${msg.fromName || msg.from}`)
  console.log(`Content: ${msg.content}`)
  console.log(`Time: ${new Date(msg.timestamp).toLocaleString()}`)
})
```

### Loading Conversations

```typescript
const conversations = await client.loadConversations(address)
conversations.forEach(conv => {
  console.log(`Conversation with: ${conv.participantName}`)
  console.log(`Unread: ${conv.unreadCount}`)
})
```

## Troubleshooting

### "Seal client not initialized"

Make sure you've configured the Seal package ID and key servers correctly.

### "Could not resolve recipient address"

- Check that the SuiNS name exists
- Verify the name format (@name.sui)
- Ensure the resolver is configured correctly

### "Wallet does not support message signing"

Your wallet must support `signPersonalMessage`. Most modern Sui wallets support this.

### "Message too long"

Messages are limited to 1000 characters. Split longer messages or use attachments (when supported).

## Integration Guide

### Adding Messaging to a New Project

1. **Install dependencies:**
   ```bash
   npm install @mysten/sui @mysten/seal @mysten/suins
   ```

2. **Create a wallet signer:**
   ```typescript
   const signer = createBrowserWalletSigner(wallet, account, getAddress, getPrimaryName)
   ```

3. **Initialize the client:**
   ```typescript
   const client = createBrowserMessagingClient(
     wallet,
     account,
     getAddress,
     getPrimaryName,
     rpcUrl,
     'testnet'
   )
   ```

4. **Use the client:**
   ```typescript
   await client?.sendMessage('@user.sui', 'Hello!')
   ```

## See Also

- [MVR Compatibility Layer Documentation](./MVR_COMPATIBILITY.md)
- [Seal Protocol Documentation](https://github.com/MystenLabs/seal)
- [SuiNS Documentation](https://docs.suins.io)
