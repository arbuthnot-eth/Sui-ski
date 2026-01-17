# Sui Transaction Building Skill

## Overview

Transaction building is a core functionality of Sui blockchain development. The Sui TypeScript SDK provides the `Transaction` class, allowing developers to create, serialize, sign, and execute blockchain transactions using a fluent builder pattern.

## Quick Start

### Installation and Import

```typescript
// Import Transaction class
import { Transaction } from '@mysten/sui/transactions';

// Create new transaction
const tx = new Transaction();
```

### Basic Example: Sending SUI

```typescript
import { Transaction } from '@mysten/sui/transactions';

const tx = new Transaction();

// Split 100 units of SUI from gas coin
const [coin] = tx.splitCoins(tx.gas, [100]);

// Transfer the split coin to specified address
tx.transferObjects([coin], '0xSomeSuiAddress');

// Execute transaction using signAndExecuteTransaction
const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: tx
});
```

## Core Components

### Transaction Class

**Location**: https://github.com/MystenLabs/ts-sdks/tree/main/packages/typescript/src/transactions/Transaction.ts

The `Transaction` class is the core of transaction building, providing the following key features:

- **Builder Pattern**: Fluent interface supporting method chaining
- **Command Support**: Supports all Sui transaction commands (Move calls, transfers, merges, etc.)
- **Plugin System**: Supports transaction parsing plugins
- **Serialization Capability**: Built-in BCS serialization support
- **Async Support**: Supports automatic resolution of async transaction thunks

### TransactionDataBuilder Class

**Location**: https://github.com/MystenLabs/ts-sdks/tree/main/packages/typescript/src/transactions/TransactionData.ts

Handles transaction data structure and serialization:

- Transaction data validation and serialization
- BCS serialization for blockchain compatibility
- Gas configuration and budget management
- Input and command management

### Commands Module

**Location**: https://github.com/MystenLabs/ts-sdks/tree/main/packages/typescript/src/transactions/Commands.ts

Defines all available transaction operations:

| Command | Description |
|---------|-------------|
| `MoveCall` | Execute Move smart contract functions |
| `TransferObjects` | Transfer objects between addresses |
| `SplitCoins` | Split a coin into multiple amounts |
| `MergeCoins` | Merge multiple coins |
| `Publish` | Deploy new Move modules |
| `Upgrade` | Upgrade existing Move modules |
| `MakeMoveVec` | Create Move vectors |

## Transaction Commands

### SplitCoins

Split a coin into multiple amounts:

```typescript
const tx = new Transaction();

// Split from gas coin
const [coin1, coin2] = tx.splitCoins(tx.gas, [1000, 2000]);

// Split from existing coin object
const [newCoin] = tx.splitCoins('0xCoinObjectId', [500]);
```

### MergeCoins

Merge multiple coins into one:

```typescript
const tx = new Transaction();

// Merge coin2 and coin3 into coin1
tx.mergeCoins('0xCoin1Id', ['0xCoin2Id', '0xCoin3Id']);
```

### TransferObjects

Transfer objects to an address:

```typescript
const tx = new Transaction();

// Transfer multiple objects
tx.transferObjects(
  ['0xObject1', '0xObject2'],
  '0xRecipientAddress'
);
```

### MoveCall

Execute a Move function:

```typescript
const tx = new Transaction();

tx.moveCall({
  target: '0xPackageId::module_name::function_name',
  arguments: [
    tx.pure.string('hello'),
    tx.pure.u64(100),
    tx.object('0xObjectId')
  ],
  typeArguments: ['0x2::sui::SUI']
});
```

### Publish

Deploy new Move modules:

```typescript
const tx = new Transaction();

const [upgradeCap] = tx.publish({
  modules: compiledModules,
  dependencies: ['0x1', '0x2']
});
```

## Input Types

### Pure Values

Use `tx.pure` for primitive values:

```typescript
// Different pure value types
tx.pure.u8(255);
tx.pure.u64(1000000n);
tx.pure.u128(BigInt('340282366920938463463374607431768211455'));
tx.pure.bool(true);
tx.pure.string('hello');
tx.pure.address('0x...');
tx.pure.vector('u8', [1, 2, 3]);
```

### Object References

Use `tx.object` for object inputs:

```typescript
// Object by ID
tx.object('0xObjectId');

// Receiving object (for receiving argument)
tx.object.receiving('0xObjectId');

// Shared object with initial version
tx.object.sharedObjectRef({
  objectId: '0x...',
  initialSharedVersion: 1,
  mutable: true
});
```

### Transaction Results

Use results from previous commands:

```typescript
const [coin] = tx.splitCoins(tx.gas, [100]);
tx.transferObjects([coin], '0xAddress'); // coin is a TransactionResult
```

## Gas Configuration

### Setting Gas Budget

```typescript
const tx = new Transaction();

// Set gas budget (in MIST, 1 SUI = 1e9 MIST)
tx.setGasBudget(10000000); // 0.01 SUI
```

### Setting Gas Price

```typescript
// Set gas price
tx.setGasPrice(1000);
```

### Setting Gas Payment

```typescript
// Use specific coins for gas
tx.setGasPayment([
  { objectId: '0x...', version: '1', digest: '...' }
]);
```

### Gas Coin Access

```typescript
// tx.gas refers to the gas coin, can be used in splitCoins
const [coin] = tx.splitCoins(tx.gas, [1000]);
```

## Transaction Serialization

### Building Transaction Bytes

```typescript
const tx = new Transaction();
// ... add commands ...

// Build for signing (requires client for gas estimation)
const bytes = await tx.build({ client });

// Build with explicit gas data
tx.setGasBudget(10000000);
tx.setSender('0xSenderAddress');
const bytes = await tx.build({ client });
```

### Deserializing Transactions

```typescript
// From bytes
const tx = Transaction.from(bytes);

// From base64
const tx = Transaction.fromBase64(base64String);
```

### Offline Building

```typescript
// Set all required data for offline building
tx.setSender('0xSenderAddress');
tx.setGasBudget(10000000);
tx.setGasPrice(1000);
tx.setGasPayment([{ objectId: '0x...', version: '1', digest: '...' }]);

// Build without client
const bytes = await tx.build();
```

## Advanced Features

### Sponsored Transactions

```typescript
const tx = new Transaction();
// ... add commands ...

// Set sponsor
tx.setSender('0xUserAddress');
tx.setGasOwner('0xSponsorAddress');

// Sponsor signs the transaction
const sponsorSignature = await sponsor.signTransaction(tx);

// User signs the transaction
const userSignature = await user.signTransaction(tx);

// Execute with both signatures
await client.executeTransactionBlock({
  transactionBlock: await tx.build({ client }),
  signature: [userSignature, sponsorSignature]
});
```

### Transaction Intents

```typescript
// Add intent message
tx.setIntentMessage('Transfer NFT to friend');
```

## Usage Patterns

### Sign and Execute

```typescript
const tx = new Transaction();
// ... build transaction ...

const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: tx,
  options: {
    showEffects: true,
    showEvents: true,
    showObjectChanges: true
  }
});
```

### Dry Run

```typescript
const tx = new Transaction();
// ... build transaction ...

const dryRunResult = await client.dryRunTransactionBlock({
  transactionBlock: await tx.build({ client })
});
```

### Inspect Transaction

```typescript
const tx = new Transaction();
// ... build transaction ...

// Get transaction data for inspection
const txData = tx.getData();
console.log(txData.commands);
console.log(txData.inputs);
```

## Best Practices

1. **Always set appropriate gas budget** - Estimate gas or set a reasonable budget
2. **Use type-safe pure values** - Use `tx.pure.u64()` instead of raw numbers for clarity
3. **Handle transaction results** - Capture and use results from commands that return values
4. **Validate before execution** - Use dry run to validate transactions before executing
5. **Error handling** - Wrap transaction execution in try-catch blocks

## Integration with Sui-ski

This project uses the Transaction class in `src/utils/mvr-transactions.ts` for MVR package management operations:

- Package registration
- Version publishing
- Metadata updates
- Ownership transfers

See [MVR Improvements](./MVR_IMPROVEMENTS.md) for details on MVR transaction building.

## References

- [Official Documentation](https://sdk.mystenlabs.com/typescript/transaction-building)
- [Source Code](https://github.com/MystenLabs/ts-sdks/tree/main/packages/typescript/src/transactions/)
- [Test Cases](https://github.com/MystenLabs/ts-sdks/tree/main/packages/typescript/src/transactions/__tests__/)
- [TypeScript Type Definitions](https://github.com/MystenLabs/ts-sdks/tree/main/packages/typescript/src/transactions/types.ts)

---

*Credit: Based on the [sui-transaction-building skill](https://skillsmp.com/skills/randypen-sui-eco-skills-sui-transaction-building-skill-md) by RandyPen*
