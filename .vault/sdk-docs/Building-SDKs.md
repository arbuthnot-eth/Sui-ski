# Building SDKs

**Source**: [Mysten Labs SDK Docs](https://sdk.mystenlabs.com/sui/sdk-building)

## Overview

Recommended patterns for building TypeScript SDKs that integrate with the Sui SDK. Following these patterns ensures:

- Seamless ecosystem integration
- Works across transports (JSON-RPC, GraphQL, gRPC)
- Composes well with other SDKs

**Key Requirement**: All SDKs should depend on `ClientWithCoreApi`, the transport-agnostic interface implemented by all Sui clients.

---

## Package Setup

### Use Mysten Packages as Peer Dependencies

```json
{
	"name": "@your-org/your-sdk",
	"peerDependencies": {
		"@mysten/sui": "^2.0.0",
		"@mysten/bcs": "^2.0.0"
	},
	"devDependencies": {
		"@mysten/sui": "^2.0.0",
		"@mysten/bcs": "^2.0.0"
	}
}
```

**Benefits:**
- Prevents multiple versions from being bundled
- Ensures compatibility with user versions
- Reduces bundle size
- Avoids bugs from mismatched package instances

---

## Client Extensions

The recommended way to build SDKs using the **client extension pattern** via the `$extend` method.

### Extension Pattern

```typescript
import type { ClientWithCoreApi } from '@mysten/sui/client';

export interface MySDKOptions<Name = 'mySDK'> {
	name?: Name;
	apiKey?: string;
}

export function mySDK<const Name = 'mySDK'>({
	name = 'mySDK' as Name,
	...options
}: MySDKOptions<Name> = {}) {
	return {
		name,
		register: (client: ClientWithCoreApi) => {
			return new MySDKClient({ client, ...options });
		},
	};
}

export class MySDKClient {
	#client: ClientWithCoreApi;
	#apiKey?: string;

	constructor({ client, apiKey }: { client: ClientWithCoreApi; apiKey?: string }) {
		this.#client = client;
		this.#apiKey = apiKey;
	}

	async getResource(id: string) {
		const result = await this.#client.core.getObject({ objectId: id });
		return result;
	}
}
```

### Usage

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { mySDK } from '@your-org/your-sdk';

const client = new SuiGrpcClient({
	network: 'testnet',
	baseUrl: 'https://fullnode.testnet.sui.io:443',
}).$extend(mySDK());

// Access extension
await client.mySDK.getResource('0x...');
```

### Real-World Examples

- **[@mysten/walrus](https://www.npmjs.com/package/@mysten/walrus)** - Decentralized storage
- **[@mysten/seal](https://www.npmjs.com/package/@mysten/seal)** - Encryption and key management

---

## SDK Organization

Recommended structure for client extension methods:

| Property | Purpose | Example |
|----------|---------|---------|
| `methods` | Top-level operations | `sdk.readBlob()`, `sdk.getConfig()` |
| `tx` | Transaction builders (non-executing) | `sdk.tx.registerBlob()` |
| `bcs` | BCS type definitions | `sdk.bcs.MyStruct` |
| `call` | Move calls for `tx.add` | `sdk.call.myFunction()` |
| `view` | Simulate API for reading state | `sdk.view.getState()` |

### Example Organization

```typescript
import { Transaction } from '@mysten/sui/transactions';
import * as myModule from './contracts/my-package/my-module';

export class MySDKClient {
	#client: ClientWithCoreApi;

	constructor({ client }: { client: ClientWithCoreApi }) {
		this.#client = client;
	}

	// Top-level methods - execute/read
	async executeAction(options: ActionOptions) {
		const transaction = this.tx.createAction(options);
		// Execute and return
	}

	async getResource(objectId: string) {
		const { object } = await this.#client.core.getObject({
			objectId,
			include: { content: true },
		});
		return myModule.MyStruct.parse(object.content);
	}

	// Transaction builders
	tx = {
		createAction: (options: ActionOptions) => {
			const transaction = new Transaction();
			transaction.add(this.call.action(options));
			return transaction;
		},
	};

	// Move call helpers
	call = {
		action: (options: ActionOptions) => {
			return myModule.action({
				arguments: {
					obj: options.objectId,
					amount: options.amount,
				},
			});
		},
	};

	// View methods - simulate to read state
	view = {
		getBalance: async (managerId: string) => {
			const tx = new Transaction();
			tx.add(myModule.getBalance({ arguments: { manager: managerId } }));

			const res = await this.#client.core.simulateTransaction({
				transaction: tx,
				include: { commandResults: true },
			});

			return bcs.U64.parse(res.commandResults![0].returnValues[0].bcs);
		},
	};
}
```

---

## Transaction Building Patterns

### Transaction Thunks

Functions that accept a `Transaction` and mutate it, enabling composition:

```typescript
import type { Transaction, TransactionObjectArgument } from '@mysten/sui/transactions';

// Synchronous thunk
function createResource(options: { name: string }) {
	return (tx: Transaction): TransactionObjectArgument => {
		const [resource] = tx.moveCall({
			target: `${PACKAGE_ID}::module::create`,
			arguments: [tx.pure.string(options.name)],
		});
		return resource;
	};
}

// Usage
const tx = new Transaction();
const resource = tx.add(createResource({ name: 'my-resource' }));
tx.transferObjects([resource], recipient);
```

### Async Thunks

For operations requiring async work (like fetching package IDs):

```typescript
function createResourceAsync(options: { name: string }) {
	return async (tx: Transaction): Promise<TransactionObjectArgument> => {
		// Async work happens before signing
		const packageId = await getLatestPackageId();

		const [resource] = tx.moveCall({
			target: `${packageId}::module::create`,
			arguments: [tx.pure.string(options.name)],
		});
		return resource;
	};
}

// Usage - identical to synchronous
const tx = new Transaction();
const resource = tx.add(createResourceAsync({ name: 'my-resource' }));
tx.transferObjects([resource], recipient);

// Async resolves automatically when building/signing
await signer.signAndExecuteTransaction({ transaction: tx, client });
```

**Critical for web wallet compatibility** - async work during construction won't block user-triggered popups.

---

## Transaction Execution

### Accept a Signer Parameter

```typescript
import type { Signer } from '@mysten/sui/cryptography';

export class MySDKClient {
	#client: ClientWithCoreApi;

	async createAndExecute({
		signer,
		...options
	}: CreateOptions & { signer: Signer }) {
		const transaction = this.tx.create(options);

		const result = await signer.signAndExecuteTransaction({
			transaction,
			client: this.#client,
		});

		return result;
	}
}
```

**Benefits:**
- Wallet integration via dApp Kit
- Transaction sponsorship support
- Custom signing flows

---

## Code Generation

Use **[@mysten/codegen](/codegen)** to generate type-safe TypeScript bindings from Move packages.

### Benefits

- Type safety
- BCS parsing
- IDE support
- MoveRegistry support for human-readable names

### Using Generated Code

```typescript
import * as myContract from './contracts/my-package/my-module';

// Move call functions return thunks with typed options
const tx = new Transaction();
tx.add(
	myContract.doSomething({
		arguments: {
			obj: '0x123...',
			amount: 100n,
		},
	}),
);

// BCS types parse on-chain data
const { object } = await client.core.getObject({
	objectId: '0x123...',
	include: { content: true },
});
const parsed = myContract.MyStruct.parse(object.content);
```

---

## Reading Object Contents

### Single Object

```typescript
import { MyStruct } from './contracts/my-package/my-module';

async function getResource(objectId: string) {
	const { object } = await this.#client.core.getObject({
		objectId,
		include: { content: true },
	});

	if (!object) {
		throw new Error(`Object ${objectId} not found`);
	}

	return MyStruct.parse(object.content);
}
```

### Batch Fetch

```typescript
async function getResources(objectIds: string[]) {
	const { objects } = await this.#client.core.getObjects({
		objectIds,
		include: { content: true },
	});

	return objects.map((obj) => {
		if (obj instanceof Error) {
			throw obj;
		}
		return MyStruct.parse(obj.content);
	});
}
```

---

## Related

- [[Transaction-Executors|Transaction Executors]]
- [[Transaction-Plugins|Transaction Plugins]]
- [[DApp-Kit-State|DApp Kit State Management]]

---
*Documentation from Mysten Labs SDK - @mysten/sui v2.0*
