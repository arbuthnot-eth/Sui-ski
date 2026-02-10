# Transaction Plugins

**Source**: [Mysten Labs SDK Docs](https://sdk.mystenlabs.com/sui/plugins)
**Package**: `@mysten/sui/transactions`
**Status**: Experimental - API may change rapidly

## Overview

The `Transaction` builder includes a plugin system for extending transaction functionality:

1. **Serialization Plugins** - Modify data before JSON serialization
2. **Build Plugins** - Resolve data during BCS building
3. **Transaction Intents** - Custom user intent representations

## Transaction Contents

When creating a `Transaction`, it initializes with a `TransactionDataBuilder` storing:

### Commands
Stored in sequence, each with arguments of types:
- `GasCoin` - Reference to gas payment coin
- `Input` - Transaction input (see below)
- `Result` - Result from previous command
- `NestedResult` - Specific value from tuple result

### Inputs
User-provided values, either:
- **Pure**: Scalar values serialized to BCS
- **Object**: Fully resolved references
  - `ImmOrOwnedObject` - Object with id/version/digest
  - `SharedObject` - Shared object with id/initialSharedVersion/mutable flag
  - `Receiving` - Receiving object reference
- **UnresolvedPure**: Placeholder for unserialized values
- **UnresolvedObject**: Partial reference (often just object ID)

## Transaction Lifecycle

1. **Serialization Phase**: Runs serialization plugins, resolves unsupported intents
2. **Build Phase**: Runs build plugins, resolves `UnresolvedPure`/`UnresolvedObject`, serializes to BCS

## Serialization Plugins

Add middleware to modify transaction data before JSON serialization:

```typescript
const transaction = new Transaction();

transaction.addSerializationPlugin(async (transactionData, buildOptions, next) => {
	// Modify data before other serialization steps
	await next();
	// Modify data after other serialization steps
});
```

## Build Plugins

Hook into the build phase to resolve data from cache instead of API calls:

```typescript
import {
	BuildTransactionOptions,
	Transaction,
	TransactionDataBuilder,
} from '@mysten/sui/transactions';

const objectCache = new Map<string, { objectId: string; version: string; digest: string }>();

function simpleObjectCachePlugin(
	transactionData: TransactionDataBuilder,
	_options: BuildTransactionOptions,
	next: () => Promise<void>,
) {
	for (const input of transactionData.inputs) {
		if (!input.UnresolvedObject) continue;

		const cached = objectCache.get(input.UnresolvedObject.objectId);
		if (!cached) continue;

		if (cached.version && !input.UnresolvedObject.version) {
			input.UnresolvedObject.version = cached.version;
		}
		if (cached.digest && !input.UnresolvedObject.digest) {
			input.UnresolvedObject.digest = cached.digest;
		}
	}

	return next();
}

// Usage
const transaction = new Transaction();
transaction.addBuildPlugin(simpleObjectCachePlugin);
```

## Transaction Intents

Custom representations that resolve to standard commands.

### Adding an Intent

```typescript
import { Commands, Transaction } from '@mysten/sui/transactions';

const transaction = new Transaction();

transaction.add(
	Commands.Intent({
		name: 'TransferToSender',
		inputs: {
			objects: [transaction.object(someId)],
		},
	}),
);
```

### Helper Function Pattern

```typescript
import { Commands, Transaction, TransactionObjectInput } from '@mysten/sui/transactions';

function transferToSender(objects: TransactionObjectInput[]) {
	return (tx: Transaction) => {
		tx.add(
			Commands.Intent({
				name: 'TransferToSender',
				inputs: {
					objects: objects.map((obj) => tx.object(obj)),
				},
			}),
		);
	};
}

// Usage
const transaction = new Transaction();
transaction.add(transferToSender(['0x1234']));
```

### Intent Resolver

Resolve intents to standard commands:

```typescript
import { Transaction, Inputs } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

const transaction = new Transaction();
transaction.addIntentResolver('TransferToSender', resolveTransferToSender);

async function resolveTransferToSender(
	transactionData: TransactionDataBuilder,
	buildOptions: BuildTransactionOptions,
	next: () => Promise<void>,
) {
	if (!transactionData.sender) {
		throw new Error('Sender must be set to resolve TransferToSender');
	}

	// Add sender address input
	const addressInput = Inputs.Pure(bcs.Address.serialize(transactionData.sender));
	transactionData.inputs.push(addressInput);
	const addressIndex = transactionData.inputs.length - 1;

	for (const [index, transaction] of transactionData.commands.entries()) {
		if (transaction.$kind !== '$Intent' || transaction.$Intent.name !== 'TransferToSender') {
			continue;
		}

		// Replace intent with TransferObjects command
		transactionData.replaceCommand(index, [
			Commands.TransferObjects(
				transaction.$Intent.inputs.objects as Extract<
					TransactionObjectArgument,
					{ $kind: 'Input' }
				>,
				{ Input: addressIndex },
			),
		]);
	}

	return next();
}
```

### Combined Pattern

Add resolver automatically when helper is called:

```typescript
function transferToSender(objects: TransactionObjectInput[]) {
	return (tx: Transaction) => {
		// Same function reference = only added once
		tx.addIntentResolver('TransferToSender', resolveTransferToSender);
		tx.add(
			Commands.Intent({
				name: 'TransferToSender',
				inputs: {
					objects: objects.map((obj) => tx.object(obj)),
				},
			}),
		);
	};
}

const transaction = new Transaction();
transaction.add(transferToSender(['0x1234']));
```

## Related

- [[Transaction-Executors|Transaction Executors]]
- [[Building-SDKs|Building SDKs]]
- [[DApp-Kit-State|DApp Kit State Management]]

---
*Documentation from Mysten Labs SDK - @mysten/sui v2.0*
