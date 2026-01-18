/**
 * @iousd/private SDK
 *
 * Privacy-preserving transactions on Sui with Ligetron + Groth16 hybrid proving.
 *
 * Features:
 * - Client-side proof generation (no server required)
 * - Ligetron zkVM for fast witness computation
 * - Groth16 for on-chain verification
 * - Post-quantum secure intermediate computations
 *
 * @example
 * ```typescript
 * import { PrivateProtocol } from '@iousd/private-sdk';
 *
 * const protocol = new PrivateProtocol({ network: 'mainnet' });
 * const deposit = await protocol.deposit({ amount: 1_000_000_000n });
 * const proof = await protocol.generateWithdrawalProof({ ... });
 * ```
 */

export { PrivateProtocol } from './protocol/private-protocol'
export { LigetronProver } from './ligetron/prover'
export { Groth16Prover } from './groth16/prover'
export { MerkleTree } from './utils/merkle'
export { poseidon2, poseidonHash } from './utils/poseidon'
export { encryptNote, decryptNote } from './utils/encryption'

export type {
	PrivateProtocolConfig,
	DepositParams,
	WithdrawParams,
	TransferParams,
	Proof,
	Note,
	Commitment,
} from './types'
