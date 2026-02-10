# Transaction Executors

**Source**: [Mysten Labs SDK Docs](https://sdk.mystenlabs.com/sui/executors)
**Package**: `@mysten/sui/transactions`

## Overview

The TypeScript SDK provides two Transaction executor classes that simplify efficiently executing multiple transactions signed by the same address:

1. **SerialTransactionExecutor** - Sequential execution with object caching
2. **ParallelTransactionExecutor** - Parallel execution with gas pool management (experimental)

These executors help manage object versions and gas coins, significantly reducing RPC requests and avoiding waits for RPC indexing.

---

## SerialTransactionExecutor

Designed for wallet implementations and dApps where the sender's objects are unlikely to be changed by external transactions.

### How It Works

1. **Gas Management**: Selects all SUI coins for the first transaction, resulting in a single coin used as gas for subsequent transactions
2. **Object Caching**: Caches object versions of every object used or created
3. **Internal Queue**: Maintains a queue so you don't need to wait for previous transactions

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `client` | SuiClient | Client instance for execution |
| `signer` | Keypair | Signer for transactions |
| `defaultBudget` | bigint | Default gas budget (default: `50_000_000n`) |
| `gasMode` | `'coins'` \| `'addressBalance'` | Gas payment method |

### Usage Example

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SerialTransactionExecutor } from '@mysten/sui/transactions';

const client = new SuiGrpcClient({
	network: 'devnet',
	baseUrl: 'https://fullnode.devnet.sui.io:443',
});

const executor = new SerialTransactionExecutor({
	client,
	signer: yourKeyPair,
});

const tx1 = new Transaction();
const [coin1] = tx1.splitCoins(tx1.gas, [1]);
tx1.transferObjects([coin1], address1);

const tx2 = new Transaction();
const [coin2] = tx2.splitCoins(tx2.gas, [1]);
tx2.transferObjects([coin2], address2);

const [{ digest: digest1 }, { digest: digest2 }] = await Promise.all([
	executor.executeTransaction(tx1),
	executor.executeTransaction(tx2),
]);
```

---

## ParallelTransactionExecutor

**Status**: Experimental - may change rapidly

Allows parallel execution of transactions using a gas coin pool.

### How It Works

1. **Gas Pool Management**: Maintains a pool of gas coins for concurrent transactions
2. **Object Conflict Detection**: Automatically detects object usage and schedules transactions to avoid conflicts
3. **Automatic Refill**: Executes additional transactions to refill the gas pool as needed

### ⚠️ Important Warnings

- Don't use other wallets/clients while ParallelTransactionExecutor is active
- Don't run multiple instances with the same `sourceCoins`
- Gas coins may become locked for the remainder of the epoch if conflicts occur

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `client` | SuiJsonRpcClient | Client for execution |
| `signer` | Keypair | Transaction signer |
| `gasMode` | `'coins'` \| `'addressBalance'` | Gas payment method |
| `coinBatchSize` | number | Max new coins when refilling (default: 20) |
| `initialCoinBalance` | bigint | New coin balance in MIST (default: `200_000_000n`) |
| `minimumCoinBalance` | bigint | Minimum balance to reuse coin (default: `50_000_000n`) |
| `defaultBudget` | bigint | Default transaction budget |
| `maxPoolSize` | number | Max gas coins / concurrent tx (default: 50) |
| `sourceCoins` | string[] | Coins to create gas pool from |
| `epochBoundaryWindow` | number | Ms to wait around epoch boundaries (default: 1000) |

### Usage Example

```typescript
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { ParallelTransactionExecutor } from '@mysten/sui/transactions';

const client = new SuiJsonRpcClient({
	url: getJsonRpcFullnodeUrl('devnet'),
	network: 'devnet'
});

const executor = new ParallelTransactionExecutor({
	client,
	signer: yourKeyPair,
});

const tx1 = new Transaction();
const [coin1] = tx1.splitCoins(tx1.gas, [1]);
tx1.transferObjects([coin1], address1);

const tx2 = new Transaction();
const [coin2] = tx2.splitCoins(tx2.gas, [1]);
tx2.transferObjects([coin2], address2);

const [{ digest: digest1 }, { digest: digest2 }] = await Promise.all([
	executor.executeTransaction(tx1),
	executor.executeTransaction(tx2),
]);
```

---

## Best Practices

### Building Transactions

Always prefer unresolved object IDs:

```typescript
// ✅ Good - allows executor to use cached versions
const obj = tx.object(id);

// ❌ Avoid - may use stale versions
tx.objectRef({ objectId, version, digest });
```

### Handling External Transactions

If the signer executes transactions outside the executor:
1. The executor will invalidate the cache for those objects
2. Retry failed transactions once - they should succeed on second attempt
3. The `coinWithBalance` intent is partially supported

---

## Related

- [[Transaction-Plugins|Transaction Plugins]]
- [[Building-SDKs|Building SDKs]]
- [[DApp-Kit-State|DApp Kit State Management]]

---
*Documentation from Mysten Labs SDK - @mysten/sui v2.0*
