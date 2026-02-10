# DApp Kit State Management

**Source**: [Mysten Labs SDK Docs](https://sdk.mystenlabs.com/dapp-kit/state)
**Package**: `@mysten/dapp-kit-core`

## Overview

The Sui dApp Kit SDK uses [nanostores](https://github.com/nanostores/nanostores) for state management, providing a lightweight, framework-agnostic solution that works across React, Vue, Vanilla JavaScript, and other frameworks.

## Available Stores

The dApp Kit exposes four reactive stores:

| Store | Purpose |
|-------|---------|
| `$connection` | Current wallet connection state |
| `$currentNetwork` | Currently selected network |
| `$currentClient` | Client instance for the current network |
| `$wallets` | List of available wallets |

## Accessing Stores

All stores are available through the `dAppKit.stores` property:

```typescript
import { createDAppKit } from '@mysten/dapp-kit-core';

const dAppKit = createDAppKit({
	/* config */
});

// Access stores
const connection = dAppKit.stores.$connection.get();
const currentNetwork = dAppKit.stores.$currentNetwork.get();
const client = dAppKit.stores.$currentClient.get();
const wallets = dAppKit.stores.$wallets.get();
```

## Subscribing to State Changes

Subscribe to any store to react to state changes:

```typescript
// Subscribe to connection changes
const unsubscribe = dAppKit.stores.$connection.subscribe((connection) => {
	if (connection.isConnected && connection.wallet && connection.account) {
		console.log('Connected to:', connection.wallet.name);
		console.log('Account:', connection.account.address);
	} else {
		console.log('Not connected');
	}
});

// Clean up subscription when done
unsubscribe();
```

## Store Details

### Connection Store (`$connection`)

Contains the current wallet connection state with status flags:

```typescript
const connection = dAppKit.stores.$connection.get();

// Connection properties:
// - wallet: UiWallet | null
// - account: UiWalletAccount | null
// - status: 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
// - supportedIntents: string[]
// - isConnected: boolean
// - isConnecting: boolean
// - isReconnecting: boolean
// - isDisconnected: boolean
```

**Example usage:**

```typescript
const connection = dAppKit.stores.$connection.get();

if (connection.isConnected && connection.wallet && connection.account) {
	console.log('Address:', connection.account.address);
	console.log('Wallet:', connection.wallet.name);
	console.log('Available accounts:', connection.wallet.accounts);
}
```

### Current Network Store (`$currentNetwork`)

Contains the currently selected network as a string:

```typescript
const currentNetwork = dAppKit.stores.$currentNetwork.get(); // 'mainnet' | 'testnet' | ...

// Subscribe to network changes
dAppKit.stores.$currentNetwork.subscribe((network) => {
	console.log('Switched to network:', network);
});
```

**Note**: This store is read-only. Use `dAppKit.switchNetwork()` to change networks.

### Current Client Store (`$currentClient`)

Contains the SuiClient instance for the current network:

```typescript
const client = dAppKit.stores.$currentClient.get();

// Use the client to query the blockchain
const balance = await client.getBalance({
	owner: '0x...',
});
```

**Note**: This store automatically updates when the network changes.

### Wallets Store (`$wallets`)

Contains the list of available wallets:

```typescript
const wallets = dAppKit.stores.$wallets.get();

wallets.forEach((wallet) => {
	console.log('Wallet:', wallet.name);
	console.log('Icon:', wallet.icon);
});
```

## React Integration

React users can use the provided hooks instead of direct store access:
- See [[dApp-Kit-React-Hooks|React Hooks]]

## Direct Properties

Some values are available as direct properties (not stores):

```typescript
// Get available networks
const networks = dAppKit.networks; // ['mainnet', 'testnet', ...]

// Get client for specific network
const mainnetClient = dAppKit.getClient('mainnet');
const currentClient = dAppKit.getClient(); // Current network's client
```

## Related

- [[SDK-Overview|Sui SDK Overview]]
- [[Transaction-Executors|Transaction Executors]]
- [[Transaction-Plugins|Transaction Plugins]]

---
*Documentation from Mysten Labs SDK - @mysten/sui v2.0*
