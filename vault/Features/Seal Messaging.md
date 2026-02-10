---
tags: [feature, seal, encryption, messaging]
---

# Seal Encrypted Messaging

End-to-end encrypted messaging using Seal's Identity-Based Encryption (IBE) with onchain access policies.

## Architecture

```
Sender encrypts message
    │
    ▼
Seal IBE (BLS12-381)
    │
    ├── Encrypted blob → Walrus storage
    └── Access policy → Sui onchain
    │
    ▼
Recipient requests decryption
    │
    ├── Onchain policy check (seal_approve)
    ├── Key server derives key (t-of-n threshold)
    └── Client decrypts locally
```

## Components

### Onchain Contract (`contracts/seal_messaging/`)
- Deployed to mainnet
- Defines `seal_approve` entry functions
- Controls who can decrypt messages

### SDK (`src/sdk/messaging-client.ts`)
- 17K lines
- Browser-side encryption/decryption
- Session key management
- Walrus attachment storage
- Test suite: `messaging-client.test.ts`

### Configuration

```
SEAL_NETWORK=testnet
SEAL_PACKAGE_ID=0x8afa5d31dbaa...
SEAL_KEY_SERVERS=server1,server2,server3
```

## Cryptographic Primitives

| Component | Implementation |
|-----------|---------------|
| IBE Scheme | Boneh-Franklin (BLS12-381) |
| Symmetric (browser) | AES-256-GCM |
| Threshold | t-out-of-n across key servers |

## Related
- [[Advanced Features]]
- [[Deployed Contracts]]
- [[Content Delivery]]
