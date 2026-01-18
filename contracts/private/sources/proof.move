/// ZK Proof structures and verification for the Private protocol
///
/// Implements Groth16 proof validation using Sui's native verifier.
/// The circuit verifies 2-input/2-output transactions while hiding
/// the relationship between inputs and outputs.
module private::private_proof {
    use private::private_constants;

    /// Zero-knowledge proof for a private transaction
    ///
    /// Contains the Groth16 proof points and public inputs
    /// needed to verify a 2-in/2-out transaction.
    public struct Proof<phantom CoinType> has copy, drop, store {
        /// Merkle root at time of proof generation
        root: u256,
        /// Serialized Groth16 proof (A, B, C points)
        proof_points: vector<u8>,
        /// Input nullifiers (2 for 2-input transactions)
        nullifiers: vector<u256>,
        /// Output commitments (2 for 2-output transactions)
        commitments: vector<u256>,
        /// Public value delta (positive = deposit, negative = withdraw)
        public_value: u256,
        /// Pool address this proof is valid for
        pool_address: address,
    }

    /// Create a new proof
    public fun new<CoinType>(
        root: u256,
        proof_points: vector<u8>,
        nullifier1: u256,
        nullifier2: u256,
        commitment1: u256,
        commitment2: u256,
        public_value: u256,
        pool_address: address,
    ): Proof<CoinType> {
        let mut nullifiers = vector::empty<u256>();
        vector::push_back(&mut nullifiers, nullifier1);
        vector::push_back(&mut nullifiers, nullifier2);

        let mut commitments = vector::empty<u256>();
        vector::push_back(&mut commitments, commitment1);
        vector::push_back(&mut commitments, commitment2);

        Proof<CoinType> {
            root,
            proof_points,
            nullifiers,
            commitments,
            public_value,
            pool_address,
        }
    }

    /// Build public inputs for Groth16 verification
    ///
    /// The public inputs must match the circuit's expected format:
    /// [root, nullifier1, nullifier2, commitment1, commitment2, public_value, pool_address, hashed_secret]
    public fun public_inputs<CoinType>(proof: &Proof<CoinType>): vector<u8> {
        build_public_inputs(proof, 0)
    }

    /// Build public inputs with custom hashed secret (for transfer-to-owner)
    public fun tto_public_inputs<CoinType>(proof: &Proof<CoinType>, hashed_secret: u256): vector<u8> {
        build_public_inputs(proof, hashed_secret)
    }

    /// Internal function to build public inputs
    fun build_public_inputs<CoinType>(proof: &Proof<CoinType>, hashed_secret: u256): vector<u8> {
        let mut inputs = vector::empty<u8>();

        // Append all public inputs as bytes
        append_field_bytes(&mut inputs, proof.root);
        append_field_bytes(&mut inputs, *vector::borrow(&proof.nullifiers, 0));
        append_field_bytes(&mut inputs, *vector::borrow(&proof.nullifiers, 1));
        append_field_bytes(&mut inputs, *vector::borrow(&proof.commitments, 0));
        append_field_bytes(&mut inputs, *vector::borrow(&proof.commitments, 1));
        append_field_bytes(&mut inputs, proof.public_value);
        append_address_bytes(&mut inputs, proof.pool_address);
        append_field_bytes(&mut inputs, hashed_secret);

        inputs
    }

    /// Convert a u256 field element to 32 bytes (big-endian)
    /// Ensures the value is within the BN254 scalar field
    fun append_field_bytes(out: &mut vector<u8>, value: u256) {
        let modulus = private_constants::bn254_field_modulus!();
        let normalized = value % modulus;

        // Convert to 32 bytes big-endian
        let mut i = 32u8;
        while (i > 0) {
            i = i - 1;
            let shift_amount = i * 8;
            let byte = (((normalized >> shift_amount) & 0xFF) as u8);
            vector::push_back(out, byte);
        };
    }

    /// Convert an address to 32 bytes
    fun append_address_bytes(out: &mut vector<u8>, addr: address) {
        let addr_bytes = std::bcs::to_bytes(&addr);
        let mut i = 0u64;
        while (i < 32) {
            if (i < vector::length(&addr_bytes)) {
                vector::push_back(out, *vector::borrow(&addr_bytes, i));
            } else {
                vector::push_back(out, 0);
            };
            i = i + 1;
        };
    }

    // === Accessors ===

    /// Get the Merkle root
    public(package) fun root<CoinType>(proof: &Proof<CoinType>): u256 {
        proof.root
    }

    /// Get the proof points
    public(package) fun proof_points<CoinType>(proof: &Proof<CoinType>): vector<u8> {
        proof.proof_points
    }

    /// Get the nullifiers
    public(package) fun nullifiers<CoinType>(proof: &Proof<CoinType>): vector<u256> {
        proof.nullifiers
    }

    /// Get the commitments
    public(package) fun commitments<CoinType>(proof: &Proof<CoinType>): vector<u256> {
        proof.commitments
    }

    /// Get the public value
    public(package) fun public_value<CoinType>(proof: &Proof<CoinType>): u256 {
        proof.public_value
    }

    /// Get the pool address
    public(package) fun pool_address<CoinType>(proof: &Proof<CoinType>): address {
        proof.pool_address
    }

    /// Get first nullifier
    public(package) fun nullifier1<CoinType>(proof: &Proof<CoinType>): u256 {
        *vector::borrow(&proof.nullifiers, 0)
    }

    /// Get second nullifier
    public(package) fun nullifier2<CoinType>(proof: &Proof<CoinType>): u256 {
        *vector::borrow(&proof.nullifiers, 1)
    }

    /// Get first commitment
    public(package) fun commitment1<CoinType>(proof: &Proof<CoinType>): u256 {
        *vector::borrow(&proof.commitments, 0)
    }

    /// Get second commitment
    public(package) fun commitment2<CoinType>(proof: &Proof<CoinType>): u256 {
        *vector::borrow(&proof.commitments, 1)
    }
}
