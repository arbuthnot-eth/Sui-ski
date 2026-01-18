/// Error codes for the Private protocol
module private::private_errors {
    /// Invalid deposit value (must be in allowed set)
    public(package) macro fun invalid_allowed_deposit_value(): u64 { 0 }

    /// Invalid address provided
    public(package) macro fun invalid_address(): u64 { 1 }

    /// Value cannot be zero
    public(package) macro fun invalid_zero_value(): u64 { 2 }

    /// Merkle root is not known (not in history)
    public(package) macro fun proof_root_not_known(): u64 { 3 }

    /// ZK proof verification failed
    public(package) macro fun invalid_proof(): u64 { 4 }

    /// Nullifier has already been spent
    public(package) macro fun nullifier_already_spent(): u64 { 5 }

    /// Encryption key is already registered for this address
    public(package) macro fun key_already_registered(): u64 { 6 }

    /// Pool for this coin type already exists
    public(package) macro fun pool_already_exists(): u64 { 7 }

    /// Invalid deposit value
    public(package) macro fun invalid_deposit_value(): u64 { 8 }

    /// Invalid relayer address
    public(package) macro fun invalid_relayer(): u64 { 9 }

    /// Invalid vortex address
    public(package) macro fun invalid_vortex(): u64 { 10 }

    /// Merkle tree has reached maximum capacity
    public(package) macro fun merkle_tree_overflow(): u64 { 11 }

    /// Invalid public value in proof
    public(package) macro fun invalid_public_value(): u64 { 12 }

    /// Invalid hashed secret
    public(package) macro fun invalid_hashed_secret(): u64 { 13 }

    /// Pool not found for coin type
    public(package) macro fun pool_not_found(): u64 { 14 }
}
