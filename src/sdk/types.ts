/**
 * SDK Types for @iousd/private
 */

export interface PrivateProtocolConfig {
	/** Sui network to use */
	network: 'mainnet' | 'testnet' | 'devnet'
	/** Custom RPC URL (optional) */
	rpcUrl?: string
	/** Pool address (optional, defaults to registry lookup) */
	poolAddress?: string
	/** Prover type: 'ligetron' for fast client-side, 'groth16' for standard */
	prover?: 'ligetron' | 'groth16' | 'hybrid'
	/** Path to Ligetron WASM binary */
	ligetronWasmPath?: string
	/** Path to Groth16 circuit files */
	groth16CircuitPath?: string
}

export interface Note {
	/** Random blinding factor */
	blinding: bigint
	/** Secret key (poseidon hash of user secret) */
	secret: bigint
	/** Amount in MIST */
	amount: bigint
	/** Note index in Merkle tree (set after deposit) */
	index?: number
}

export interface Commitment {
	/** Poseidon hash commitment */
	hash: bigint
	/** Original note (for spending) */
	note: Note
	/** Encrypted note data */
	encryptedData: Uint8Array
}

export interface DepositParams {
	/** Amount to deposit in MIST */
	amount: bigint
	/** User's secret (32 bytes) */
	secret?: Uint8Array
	/** Recipient public key for encrypted note */
	recipientPubKey?: string
}

export interface WithdrawParams {
	/** Notes to spend (up to 2 inputs) */
	inputNotes: Note[]
	/** Withdrawal amount */
	amount: bigint
	/** Recipient address */
	recipient: string
	/** Relayer address (optional) */
	relayer?: string
	/** Relayer fee (optional) */
	relayerFee?: bigint
	/** Current Merkle root */
	root: bigint
	/** Merkle proofs for input notes */
	merkleProofs: MerkleProof[]
}

export interface TransferParams {
	/** Notes to spend */
	inputNotes: Note[]
	/** Output amounts */
	outputAmounts: [bigint, bigint]
	/** Recipient secrets for output notes */
	recipientSecrets: [bigint, bigint]
	/** Current Merkle root */
	root: bigint
	/** Merkle proofs for input notes */
	merkleProofs: MerkleProof[]
}

export interface MerkleProof {
	/** Path elements (siblings) */
	path: bigint[]
	/** Path indices (0 = left, 1 = right) */
	indices: number[]
}

export interface Proof {
	/** Merkle root used in proof */
	root: bigint
	/** Groth16 proof points (serialized) */
	proofPoints: Uint8Array
	/** Input nullifiers */
	nullifiers: [bigint, bigint]
	/** Output commitments */
	commitments: [bigint, bigint]
	/** Public value delta */
	publicValue: bigint
	/** Pool address */
	poolAddress: string
	/** Encrypted outputs */
	encryptedOutputs: [Uint8Array, Uint8Array]
}

export interface ExtData {
	/** Recipient address */
	recipient: string
	/** Amount to recipient */
	amount: bigint
	/** Relayer address */
	relayer: string
	/** Relayer fee */
	relayerFee: bigint
	/** Encrypted output 1 */
	encryptedOutput1: Uint8Array
	/** Encrypted output 2 */
	encryptedOutput2: Uint8Array
}

export interface TransactionResult {
	/** Transaction digest */
	digest: string
	/** New commitment indices */
	commitmentIndices: [number, number]
	/** New commitments */
	commitments: [Commitment, Commitment]
}

/** Ligetron witness output */
export interface LigetronWitness {
	/** Computed nullifiers */
	nullifiers: [bigint, bigint]
	/** Computed commitments */
	commitments: [bigint, bigint]
	/** Intermediate values for Groth16 */
	intermediateValues: bigint[]
}

/** Groth16 proving key (loaded from file) */
export interface Groth16ProvingKey {
	/** Protocol type */
	protocol: 'groth16'
	/** Curve type */
	curve: 'bn254'
	/** Number of public inputs */
	nPublic: number
	/** Serialized proving key */
	data: Uint8Array
}

/** Groth16 verification key */
export interface Groth16VerificationKey {
	/** Alpha point */
	alpha: [string, string]
	/** Beta point */
	beta: [[string, string], [string, string]]
	/** Gamma point */
	gamma: [[string, string], [string, string]]
	/** Delta point */
	delta: [[string, string], [string, string]]
	/** IC points */
	IC: [string, string][]
}
