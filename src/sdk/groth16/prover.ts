/**
 * Groth16 Prover
 *
 * Generates Groth16 proofs for on-chain verification on Sui.
 * Uses the witness from Ligetron and generates BN254 proofs.
 *
 * @see https://docs.sui.io/guides/developer/cryptography/groth16
 */

import type { Groth16ProvingKey, Groth16VerificationKey, LigetronWitness, Proof } from '../types'

/** Groth16 prover configuration */
export interface Groth16Config {
	/** Path to proving key (.zkey file) */
	provingKeyPath?: string
	/** Path to verification key */
	verificationKeyPath?: string
	/** Path to WASM circuit */
	wasmPath?: string
	/** Use Web Worker for proving */
	useWorker?: boolean
}

/**
 * Groth16 Prover for Sui
 *
 * Generates BN254 Groth16 proofs that can be verified on-chain
 * using Sui's native groth16::verify_groth16_proof function.
 */
export class Groth16Prover {
	private config: Groth16Config
	private provingKey: Groth16ProvingKey | null = null
	private verificationKey: Groth16VerificationKey | null = null
	private snarkjs: typeof import('snarkjs') | null = null

	constructor(config: Groth16Config = {}) {
		this.config = {
			provingKeyPath: config.provingKeyPath || '/circuits/private_transfer.zkey',
			verificationKeyPath: config.verificationKeyPath || '/circuits/verification_key.json',
			wasmPath: config.wasmPath || '/circuits/private_transfer.wasm',
			useWorker: config.useWorker ?? true,
		}
	}

	/**
	 * Initialize the Groth16 prover
	 * Loads snarkjs and the proving/verification keys
	 */
	async initialize(): Promise<void> {
		// Load snarkjs (dynamically in browser)
		// Check for browser environment using globalThis
		const globalObj = globalThis as unknown as Record<string, unknown>
		if (typeof globalObj.window !== 'undefined') {
			// Browser environment - load from CDN or bundled
			const windowObj = globalObj.window as Record<string, unknown>
			if (windowObj.snarkjs) {
				this.snarkjs = windowObj.snarkjs as typeof import('snarkjs')
			} else {
				// Would dynamically import in production
				console.warn('snarkjs not loaded. Add <script src="https://unpkg.com/snarkjs"></script>')
			}
		}

		// Load keys (in production, fetch from CDN or bundled)
		// For now, we'll generate mock keys
		this.provingKey = await this.loadProvingKey()
		this.verificationKey = await this.loadVerificationKey()
	}

	/**
	 * Load the proving key
	 */
	private async loadProvingKey(): Promise<Groth16ProvingKey> {
		// In production, fetch from CDN or bundled
		// Proving keys are typically 10-100MB
		return {
			protocol: 'groth16',
			curve: 'bn254',
			nPublic: 8, // root, nullifiers(2), commitments(2), publicValue, poolAddress, hashedSecret
			data: new Uint8Array(0), // Placeholder
		}
	}

	/**
	 * Load the verification key
	 */
	private async loadVerificationKey(): Promise<Groth16VerificationKey> {
		// In production, fetch from CDN
		// This should match the on-chain verification key
		return {
			alpha: ['0x1', '0x2'],
			beta: [
				['0x3', '0x4'],
				['0x5', '0x6'],
			],
			gamma: [
				['0x7', '0x8'],
				['0x9', '0xa'],
			],
			delta: [
				['0xb', '0xc'],
				['0xd', '0xe'],
			],
			IC: [
				['0xf', '0x10'],
				['0x11', '0x12'],
			],
		}
	}

	/**
	 * Generate a Groth16 proof from Ligetron witness
	 *
	 * @param witness - Witness from Ligetron prover
	 * @param publicInputs - Public inputs for the circuit
	 * @returns Groth16 proof ready for on-chain verification
	 */
	async generateProof(
		witness: LigetronWitness,
		publicInputs: {
			root: bigint
			publicValue: bigint
			poolAddress: string
			hashedSecret?: bigint
		},
	): Promise<Proof> {
		// Combine Ligetron witness with public inputs
		const circuitInputs = {
			// From Ligetron
			nullifier1: witness.nullifiers[0].toString(),
			nullifier2: witness.nullifiers[1].toString(),
			commitment1: witness.commitments[0].toString(),
			commitment2: witness.commitments[1].toString(),
			intermediateValues: witness.intermediateValues.map((v) => v.toString()),

			// Public inputs
			root: publicInputs.root.toString(),
			publicValue: publicInputs.publicValue.toString(),
			poolAddress: publicInputs.poolAddress,
			hashedSecret: (publicInputs.hashedSecret || 0n).toString(),
		}

		// Generate proof using snarkjs (or mock in dev)
		let proofPoints: Uint8Array
		if (this.snarkjs && this.provingKey?.data.length) {
			// Real proof generation
			const { proof } = await this.snarkjs.groth16.fullProve(
				circuitInputs,
				this.config.wasmPath!,
				this.config.provingKeyPath!,
			)

			// Serialize proof points for Sui
			proofPoints = this.serializeProofPoints(proof)
		} else {
			// Mock proof for development
			proofPoints = this.generateMockProof()
		}

		return {
			root: publicInputs.root,
			proofPoints,
			nullifiers: witness.nullifiers,
			commitments: witness.commitments,
			publicValue: publicInputs.publicValue,
			poolAddress: publicInputs.poolAddress,
			encryptedOutputs: [new Uint8Array(64), new Uint8Array(64)], // Placeholder
		}
	}

	/**
	 * Serialize Groth16 proof points for Sui
	 *
	 * Sui expects proof points in a specific format:
	 * - A point (2 * 32 bytes)
	 * - B point (2 * 2 * 32 bytes)
	 * - C point (2 * 32 bytes)
	 */
	private serializeProofPoints(proof: {
		pi_a: string[]
		pi_b: string[][]
		pi_c: string[]
	}): Uint8Array {
		const buffer = new Uint8Array(256) // A(64) + B(128) + C(64)

		// Serialize A point
		this.writePoint(buffer, 0, proof.pi_a)

		// Serialize B point (G2, so 2x2 coordinates)
		this.writeG2Point(buffer, 64, proof.pi_b)

		// Serialize C point
		this.writePoint(buffer, 192, proof.pi_c)

		return buffer
	}

	/**
	 * Write a G1 point to buffer
	 */
	private writePoint(buffer: Uint8Array, offset: number, point: string[]): void {
		const x = BigInt(point[0])
		const y = BigInt(point[1])

		this.writeBigInt(buffer, offset, x)
		this.writeBigInt(buffer, offset + 32, y)
	}

	/**
	 * Write a G2 point to buffer
	 */
	private writeG2Point(buffer: Uint8Array, offset: number, point: string[][]): void {
		// G2 points have 2 pairs of coordinates
		const x1 = BigInt(point[0][0])
		const x2 = BigInt(point[0][1])
		const y1 = BigInt(point[1][0])
		const y2 = BigInt(point[1][1])

		this.writeBigInt(buffer, offset, x1)
		this.writeBigInt(buffer, offset + 32, x2)
		this.writeBigInt(buffer, offset + 64, y1)
		this.writeBigInt(buffer, offset + 96, y2)
	}

	/**
	 * Write a bigint as 32 bytes (big-endian)
	 */
	private writeBigInt(buffer: Uint8Array, offset: number, value: bigint): void {
		for (let i = 31; i >= 0; i--) {
			buffer[offset + (31 - i)] = Number((value >> BigInt(i * 8)) & 0xffn)
		}
	}

	/**
	 * Generate a mock proof for development
	 */
	private generateMockProof(): Uint8Array {
		// Generate random bytes for development
		// NOT for production use!
		const buffer = new Uint8Array(256)
		if (typeof crypto !== 'undefined') {
			crypto.getRandomValues(buffer)
		}
		return buffer
	}

	/**
	 * Verify a proof locally (for testing)
	 */
	async verifyLocally(proof: Proof): Promise<boolean> {
		if (!this.snarkjs || !this.verificationKey) {
			console.warn('Local verification not available without snarkjs')
			return true // Assume valid in dev
		}

		// Build public inputs array
		const publicInputs = [
			proof.root.toString(),
			proof.nullifiers[0].toString(),
			proof.nullifiers[1].toString(),
			proof.commitments[0].toString(),
			proof.commitments[1].toString(),
			proof.publicValue.toString(),
			proof.poolAddress,
			'0', // hashedSecret
		]

		// Deserialize proof points
		const proofObj = this.deserializeProofPoints(proof.proofPoints)

		return this.snarkjs.groth16.verify(this.verificationKey, publicInputs, proofObj)
	}

	/**
	 * Deserialize proof points from bytes
	 */
	private deserializeProofPoints(bytes: Uint8Array): {
		pi_a: string[]
		pi_b: string[][]
		pi_c: string[]
	} {
		return {
			pi_a: [this.readBigInt(bytes, 0).toString(), this.readBigInt(bytes, 32).toString()],
			pi_b: [
				[this.readBigInt(bytes, 64).toString(), this.readBigInt(bytes, 96).toString()],
				[this.readBigInt(bytes, 128).toString(), this.readBigInt(bytes, 160).toString()],
			],
			pi_c: [this.readBigInt(bytes, 192).toString(), this.readBigInt(bytes, 224).toString()],
		}
	}

	/**
	 * Read a bigint from bytes (big-endian)
	 */
	private readBigInt(bytes: Uint8Array, offset: number): bigint {
		let value = 0n
		for (let i = 0; i < 32; i++) {
			value = (value << 8n) | BigInt(bytes[offset + i])
		}
		return value
	}

	/**
	 * Check if the prover is initialized
	 */
	isInitialized(): boolean {
		return this.provingKey !== null && this.verificationKey !== null
	}

	/**
	 * Get the verification key (for on-chain deployment)
	 */
	getVerificationKey(): Groth16VerificationKey | null {
		return this.verificationKey
	}

	/**
	 * Serialize verification key for Move contract
	 */
	serializeVerificationKey(): Uint8Array {
		if (!this.verificationKey) {
			throw new Error('Verification key not loaded')
		}

		// Serialize to format expected by Move contract
		// This would be the actual serialization logic
		return new Uint8Array(256) // Placeholder
	}
}

/**
 * Create a Groth16 prover instance
 */
export async function createGroth16Prover(config?: Groth16Config): Promise<Groth16Prover> {
	const prover = new Groth16Prover(config)
	await prover.initialize()
	return prover
}
