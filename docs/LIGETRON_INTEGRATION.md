# Ligetron Integration Architecture

## Overview

This document describes the integration of [Ligetron](https://ligero-inc.com/) (by Ligero Inc) with the `@iousd/private` privacy protocol for client-side zero-knowledge proof generation.

## Why Ligetron?

| Feature | Groth16 (Current) | Ligetron |
|---------|-------------------|----------|
| Trusted Setup | Required | None |
| Client-side | Heavy/impractical | Native browser support |
| Browser TPS | N/A | ~100 TPS |
| Memory | GB+ | <2GB RAM |
| Post-Quantum | No | Yes |
| Hardware | Server GPUs | Raspberry Pi to H100 |

## Architecture

### Challenge: Sui Native Verifier Support

Sui blockchain natively supports:
- ✅ Groth16 over BN254 (`sui::groth16::verify_groth16_proof`)
- ✅ Groth16 over BLS12-381
- ❌ Ligero/Ligetron (hash-based, Reed-Solomon)

### Solution: Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │   User      │───▶│  Ligetron    │───▶│  Groth16 Proof   │  │
│  │   Inputs    │    │  zkVM (WASM) │    │  Generator       │  │
│  │  (private)  │    │              │    │  (WASM/snarkjs)  │  │
│  └─────────────┘    └──────────────┘    └────────┬─────────┘  │
│                                                   │             │
│                     Witness Generation       Proof Points      │
│                     (fast, private)          (for on-chain)    │
│                                                   │             │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUI BLOCKCHAIN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                 @iousd/private                          │    │
│  │  ┌─────────────┐  ┌────────────┐  ┌────────────────┐   │    │
│  │  │ Groth16     │  │ Merkle     │  │  Nullifier     │   │    │
│  │  │ Verifier    │  │ Tree       │  │  Registry      │   │    │
│  │  │ (BN254)     │  │ (Poseidon) │  │                │   │    │
│  │  └─────────────┘  └────────────┘  └────────────────┘   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Hybrid?

1. **Ligetron for Witness Generation**:
   - Fast client-side computation (100 TPS in browser)
   - Private - inputs never leave the device
   - Complex computation (balance checks, Merkle proofs)
   - Post-quantum secure intermediate computations

2. **Groth16 for On-Chain Verification**:
   - Native Sui support (no custom verifier needed)
   - Constant-size proofs (~200 bytes)
   - Fast verification (~1ms on-chain)
   - Proven security model

### Alternative: Soundness Layer

For full Ligetron verification, use [SoundnessLabs' Soundness Layer](https://github.com/SoundnessLabs/soundness-layer):
- Decentralized verification layer on Sui + Walrus
- Supports multiple zkVMs including Ligetron
- Off-chain verification with on-chain settlement

## Browser SDK Integration

### Installation

```html
<!-- Ligetron zkVM (WASM) -->
<script src="https://cdn.ligetron.com/ligetron.js"></script>

<!-- Groth16 prover (for on-chain proofs) -->
<script src="https://unpkg.com/snarkjs@0.7.0/build/snarkjs.min.js"></script>

<!-- Private Protocol SDK -->
<script src="https://private--iousd.sui.ski/sdk.js"></script>
```

### API Usage

```javascript
import { PrivateProtocol } from '@iousd/private-sdk';

// Initialize with Ligetron
const protocol = new PrivateProtocol({
  network: 'mainnet',
  prover: 'ligetron', // Use Ligetron for witness generation
  poolAddress: '0x...',
});

// Create a private deposit
const deposit = await protocol.deposit({
  amount: 1000000000n, // 1 SUI in MIST
  secret: crypto.getRandomValues(new Uint8Array(32)),
});

// Generate proof (Ligetron generates witness, converts to Groth16)
const proof = await protocol.generateProof({
  inputs: [deposit.commitment],
  outputs: [newCommitment1, newCommitment2],
  recipient: '0x...',
});

// Submit to blockchain
const tx = await protocol.submitTransaction(proof);
```

## SDK Architecture

```
src/sdk/
├── index.ts              # Main SDK entry
├── ligetron/
│   ├── worker.ts         # Web Worker for Ligetron prover
│   ├── witness.ts        # Witness generation logic
│   └── wasm/             # Ligetron WASM binaries
├── groth16/
│   ├── prover.ts         # Groth16 proof generation
│   ├── circuits/         # Circuit definitions
│   └── keys/             # Proving/verification keys
├── protocol/
│   ├── deposit.ts        # Deposit logic
│   ├── withdraw.ts       # Withdrawal logic
│   └── transfer.ts       # Private transfer logic
└── utils/
    ├── merkle.ts         # Merkle tree operations
    ├── poseidon.ts       # Poseidon hash
    └── encryption.ts     # Note encryption
```

## Ligetron Prover Integration

### Building the Prover Circuit

```cpp
// circuits/private_transfer.cpp
#include <ligetron/sdk.h>

// Verify Merkle inclusion
bool verify_merkle_proof(
    uint256_t root,
    uint256_t leaf,
    uint256_t* path,
    int* indices,
    int depth
) {
    uint256_t current = leaf;
    for (int i = 0; i < depth; i++) {
        if (indices[i] == 0) {
            current = poseidon2(current, path[i]);
        } else {
            current = poseidon2(path[i], current);
        }
    }
    return current == root;
}

// Main circuit
int main(int argc, char** argv) {
    // Parse inputs (private)
    uint256_t secret = parse_private_input(argv[1]);
    uint256_t nullifier1 = poseidon2(secret, 0);
    uint256_t nullifier2 = poseidon2(secret, 1);

    // Parse Merkle proof (private)
    MerkleProof proof1 = parse_merkle_proof(argv[2]);
    MerkleProof proof2 = parse_merkle_proof(argv[3]);

    // Parse public inputs
    uint256_t root = parse_public_input(argv[4]);
    uint256_t commitment1 = parse_public_input(argv[5]);
    uint256_t commitment2 = parse_public_input(argv[6]);

    // Verify Merkle proofs
    assert(verify_merkle_proof(root, nullifier1, proof1.path, proof1.indices, 26));
    assert(verify_merkle_proof(root, nullifier2, proof2.path, proof2.indices, 26));

    // Output witness for Groth16
    output_witness(nullifier1, nullifier2, commitment1, commitment2);

    return 0;
}
```

### Compiling to WASM

```bash
cd circuits
emcc private_transfer.cpp -o private_transfer.wasm \
  -I/path/to/ligetron/sdk \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_main"]' \
  -O3
```

## On-Chain Verification

The Move package continues to use Groth16 verification:

```move
// In private.move
use sui::groth16;

public fun verify_and_process<CoinType>(
    pool: &mut Private<CoinType>,
    proof_points: vector<u8>,
    public_inputs: vector<u8>,
    // ... other params
) {
    // Verify using native Sui Groth16 verifier
    let public_inputs_obj = groth16::public_proof_inputs_from_bytes(public_inputs);
    let proof_obj = groth16::proof_points_from_bytes(proof_points);

    assert!(
        groth16::verify_groth16_proof(
            &groth16::bn254(),
            &pool.verifying_key,
            &public_inputs_obj,
            &proof_obj
        ),
        EInvalidProof
    );

    // Process transaction...
}
```

## Performance Comparison

| Operation | Groth16 Only | Ligetron + Groth16 |
|-----------|--------------|-------------------|
| Client Witness Gen | N/A | ~50ms |
| Client Proof Gen | 5-30s (needs server) | ~500ms (browser) |
| On-chain Verify | ~1ms | ~1ms |
| Total Client Time | Impractical | ~600ms |

## Future: Full Ligetron Verification

When Sui adds native Ligero verification (or via Soundness Layer):

```move
// Future: Native Ligetron verification
use sui::ligero; // Hypothetical

public fun verify_ligetron_proof(
    proof: vector<u8>,
    public_inputs: vector<u8>,
    vk: vector<u8>,
): bool {
    ligero::verify_ligero_proof(proof, public_inputs, vk)
}
```

## Resources

- [Ligetron Platform](https://platform.ligetron.com/)
- [Ligero Prover GitHub](https://github.com/ligeroinc/ligero-prover)
- [SoundnessLabs zkVM Examples](https://github.com/SoundnessLabs/zkvm-examples)
- [Sui Groth16 Documentation](https://docs.sui.io/guides/developer/cryptography/groth16)
- [Ligero Academic Paper](https://acmccs.github.io/papers/p2087-amesA.pdf)
