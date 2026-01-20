/**
 * Private Protocol SDK
 *
 * Main entry point for interacting with @iousd/private.
 * Combines Ligetron (fast client-side witness) with Groth16 (on-chain verification).
 *
 * @example
 * ```typescript
 * const protocol = new PrivateProtocol({ network: 'mainnet' });
 * await protocol.initialize();
 *
 * // Deposit
 * const deposit = await protocol.deposit({ amount: 1_000_000_000n });
 *
 * // Withdraw
 * const proof = await protocol.generateWithdrawalProof({
 *   inputNotes: [deposit.note],
 *   amount: 500_000_000n,
 *   recipient: '0x...',
 * });
 * ```
 */

import { createGroth16Prover, type Groth16Prover } from '../groth16/prover'
import { createLigetronProver, type LigetronProver } from '../ligetron/prover'
import type {
	Commitment,
	DepositParams,
	ExtData,
	MerkleProof,
	Note,
	PrivateProtocolConfig,
	Proof,
	TransferParams,
	WithdrawParams,
} from '../types'

// Default configuration
const DEFAULT_CONFIG: PrivateProtocolConfig = {
	network: 'mainnet',
	prover: 'hybrid', // Use Ligetron + Groth16
}

// Package IDs (same as handler)
const PRIVATE_PACKAGE_ID: Record<string, string> = {
	mainnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
	testnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
}

const PRIVATE_REGISTRY_ID: Record<string, string> = {
	mainnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
	testnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
}

/**
 * Private Protocol SDK
 */
export class PrivateProtocol {
	private config: PrivateProtocolConfig
	private ligetronProver: LigetronProver | null = null
	private groth16Prover: Groth16Prover | null = null
	private initialized = false

	constructor(config: Partial<PrivateProtocolConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config }
	}

	/**
	 * Initialize the protocol
	 * Loads provers and connects to the network
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return

		// Initialize provers based on config
		if (this.config.prover === 'ligetron' || this.config.prover === 'hybrid') {
			this.ligetronProver = await createLigetronProver({
				wasmPath: this.config.ligetronWasmPath,
			})
		}

		if (this.config.prover === 'groth16' || this.config.prover === 'hybrid') {
			this.groth16Prover = await createGroth16Prover({
				provingKeyPath: this.config.groth16CircuitPath
					? `${this.config.groth16CircuitPath}/proving_key.zkey`
					: undefined,
			})
		}

		this.initialized = true
	}

	/**
	 * Create a deposit commitment
	 *
	 * @param params - Deposit parameters
	 * @returns Commitment that can be submitted on-chain
	 */
	async deposit(params: DepositParams): Promise<{
		commitment: Commitment
		note: Note
		transactionBytes: Uint8Array
	}> {
		this.ensureInitialized()

		// Generate random secret if not provided
		const secret = params.secret || crypto.getRandomValues(new Uint8Array(32))
		const secretBigInt = this.bytesToBigInt(secret)

		// Generate random blinding factor
		const blinding = this.randomFieldElement()

		// Create note
		const note: Note = {
			secret: secretBigInt,
			blinding,
			amount: params.amount,
		}

		// Compute commitment: poseidon(amount, blinding, secret)
		const commitmentHash = await this.computeCommitment(note)

		// Encrypt note for recipient
		const encryptedData = await this.encryptNote(note, params.recipientPubKey)

		const commitment: Commitment = {
			hash: commitmentHash,
			note,
			encryptedData,
		}

		// Build transaction bytes
		const transactionBytes = await this.buildDepositTransaction(commitment, params.amount)

		return { commitment, note, transactionBytes }
	}

	/**
	 * Generate a withdrawal proof
	 *
	 * @param params - Withdrawal parameters
	 * @returns Proof ready for on-chain verification
	 */
	async generateWithdrawalProof(params: WithdrawParams): Promise<Proof> {
		this.ensureInitialized()

		// Pad inputs to 2 notes (2-input UTXO model)
		const inputNotes = this.padInputNotes(params.inputNotes)
		const merkleProofs = this.padMerkleProofs(params.merkleProofs)

		// Calculate output amounts (withdrawal + change)
		const totalInput = inputNotes.reduce((sum, n) => sum + n.amount, 0n)
		const totalFees = params.relayerFee || 0n
		const changeAmount = totalInput - params.amount - totalFees

		if (changeAmount < 0n) {
			throw new Error('Insufficient input balance')
		}

		const outputAmounts: [bigint, bigint] = [0n, changeAmount] // First output is withdrawal (goes to recipient)
		const outputBlindings: [bigint, bigint] = [this.randomFieldElement(), this.randomFieldElement()]

		// Generate witness using Ligetron (fast)
		let witness
		if (this.ligetronProver) {
			witness = await this.ligetronProver.generateWitness(
				inputNotes,
				outputAmounts,
				outputBlindings,
				merkleProofs,
			)
		} else {
			// Fallback: compute witness directly (slower)
			witness = await this.computeWitnessDirectly(inputNotes, outputAmounts, outputBlindings)
		}

		// Generate Groth16 proof
		if (!this.groth16Prover) {
			throw new Error('Groth16 prover not initialized')
		}

		const proof = await this.groth16Prover.generateProof(witness, {
			root: params.root,
			publicValue: params.amount, // Positive = withdrawal
			poolAddress: this.getPoolAddress(),
		})

		// Add encrypted outputs
		proof.encryptedOutputs = [
			await this.encryptNote(
				{ secret: 0n, blinding: outputBlindings[0], amount: outputAmounts[0] },
				undefined,
			),
			await this.encryptNote(
				{ secret: inputNotes[0].secret, blinding: outputBlindings[1], amount: outputAmounts[1] },
				undefined,
			),
		]

		return proof
	}

	/**
	 * Generate a private transfer proof
	 *
	 * @param params - Transfer parameters
	 * @returns Proof ready for on-chain verification
	 */
	async generateTransferProof(params: TransferParams): Promise<Proof> {
		this.ensureInitialized()

		const inputNotes = this.padInputNotes(params.inputNotes)
		const merkleProofs = this.padMerkleProofs(params.merkleProofs)

		// For transfers, both outputs go to recipients
		const outputBlindings: [bigint, bigint] = [this.randomFieldElement(), this.randomFieldElement()]

		// Generate witness
		let witness
		if (this.ligetronProver) {
			witness = await this.ligetronProver.generateWitness(
				inputNotes,
				params.outputAmounts,
				outputBlindings,
				merkleProofs,
			)
		} else {
			witness = await this.computeWitnessDirectly(inputNotes, params.outputAmounts, outputBlindings)
		}

		// Generate proof
		if (!this.groth16Prover) {
			throw new Error('Groth16 prover not initialized')
		}

		return this.groth16Prover.generateProof(witness, {
			root: params.root,
			publicValue: 0n, // No public value change in transfer
			poolAddress: this.getPoolAddress(),
		})
	}

	/**
	 * Build external data for a transaction
	 */
	buildExtData(params: {
		recipient: string
		amount: bigint
		relayer?: string
		relayerFee?: bigint
		encryptedOutput1: Uint8Array
		encryptedOutput2: Uint8Array
	}): ExtData {
		return {
			recipient: params.recipient,
			amount: params.amount,
			relayer: params.relayer || '0x0',
			relayerFee: params.relayerFee || 0n,
			encryptedOutput1: params.encryptedOutput1,
			encryptedOutput2: params.encryptedOutput2,
		}
	}

	/**
	 * Get the pool address for the current network
	 */
	getPoolAddress(): string {
		return this.config.poolAddress || PRIVATE_REGISTRY_ID[this.config.network]
	}

	/**
	 * Get the package ID for the current network
	 */
	getPackageId(): string {
		return PRIVATE_PACKAGE_ID[this.config.network]
	}

	// === Private Helpers ===

	private ensureInitialized(): void {
		if (!this.initialized) {
			throw new Error('Protocol not initialized. Call initialize() first.')
		}
	}

	private padInputNotes(notes: Note[]): Note[] {
		const padded = [...notes]
		while (padded.length < 2) {
			padded.push({ secret: 0n, blinding: 0n, amount: 0n })
		}
		return padded.slice(0, 2)
	}

	private padMerkleProofs(proofs: MerkleProof[]): MerkleProof[] {
		const padded = [...proofs]
		while (padded.length < 2) {
			padded.push({ path: new Array(26).fill(0n), indices: new Array(26).fill(0) })
		}
		return padded.slice(0, 2)
	}

	private randomFieldElement(): bigint {
		const bytes = crypto.getRandomValues(new Uint8Array(32))
		const value = this.bytesToBigInt(bytes)
		// Reduce modulo BN254 field
		const BN254_FIELD =
			21888242871839275222246405745257275088548364400416034343698204186575808495617n
		return value % BN254_FIELD
	}

	private bytesToBigInt(bytes: Uint8Array): bigint {
		let value = 0n
		for (const byte of bytes) {
			value = (value << 8n) | BigInt(byte)
		}
		return value
	}

	private async computeCommitment(note: Note): Promise<bigint> {
		// Mock Poseidon hash - replace with actual implementation
		return (note.amount * 31n + note.blinding * 17n + note.secret) % 2n ** 256n
	}

	private async encryptNote(_note: Note, _pubKey?: string): Promise<Uint8Array> {
		// Mock encryption - replace with actual ECIES implementation
		return crypto.getRandomValues(new Uint8Array(64))
	}

	private async buildDepositTransaction(
		_commitment: Commitment,
		_amount: bigint,
	): Promise<Uint8Array> {
		// Build PTB for deposit
		// In production, use @mysten/sui to build the transaction
		return new Uint8Array(0)
	}

	private async computeWitnessDirectly(
		inputNotes: Note[],
		outputAmounts: [bigint, bigint],
		outputBlindings: [bigint, bigint],
	): Promise<{
		nullifiers: [bigint, bigint]
		commitments: [bigint, bigint]
		intermediateValues: bigint[]
	}> {
		// Direct witness computation without Ligetron
		// Slower but works as fallback
		const nullifiers: [bigint, bigint] = [
			await this.computeNullifier(inputNotes[0]),
			await this.computeNullifier(inputNotes[1]),
		]

		const commitments: [bigint, bigint] = [
			await this.computeCommitment({
				amount: outputAmounts[0],
				blinding: outputBlindings[0],
				secret: 0n,
			}),
			await this.computeCommitment({
				amount: outputAmounts[1],
				blinding: outputBlindings[1],
				secret: inputNotes[0].secret,
			}),
		]

		return { nullifiers, commitments, intermediateValues: [] }
	}

	private async computeNullifier(note: Note): Promise<bigint> {
		// Mock nullifier computation
		return (note.secret * 31n + note.blinding) % 2n ** 256n
	}
}

/**
 * Create a configured Private Protocol instance
 */
export async function createPrivateProtocol(
	config?: Partial<PrivateProtocolConfig>,
): Promise<PrivateProtocol> {
	const protocol = new PrivateProtocol(config)
	await protocol.initialize()
	return protocol
}
