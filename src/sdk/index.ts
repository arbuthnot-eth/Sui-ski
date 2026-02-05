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

export { Groth16Prover } from './groth16/prover'
export { LigetronProver } from './ligetron/prover'
export type {
	EncryptedMessage,
	MessageData,
	MessagingClientConfig,
	SealConfig,
	SendMessageResult,
	SuiNSResolver,
	WalletSigner,
} from './messaging-client'
// Messaging SDK
export {
	createDefaultSuiNSResolver,
	DEFAULT_SEAL_TESTNET_CONFIG,
	MessagingClient,
} from './messaging-client'
export { createBrowserMessagingClient, createBrowserWalletSigner } from './messaging-client-browser'
export type {
	ParsedPackageName,
	ResolutionOptions,
	ResolutionResult,
	VersionSpec,
} from './mvr-resolver'
// MVR Compatibility Layer
export { createMVRResolver, MVRResolver } from './mvr-resolver'
export { PrivateProtocol } from './protocol/private-protocol'
export type {
	Commitment,
	DepositParams,
	Note,
	PrivateProtocolConfig,
	Proof,
	TransferParams,
	WithdrawParams,
} from './types'
export { decryptNote, encryptNote } from './utils/encryption'
export { MerkleTree } from './utils/merkle'
export { poseidon2, poseidonHash } from './utils/poseidon'
