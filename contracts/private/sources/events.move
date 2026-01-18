/// Events emitted by the Private protocol
module private::private_events {
    use std::ascii::String;
    use sui::event::emit;

    /// Emitted when a new privacy pool is created for a coin type
    public struct NewPool has copy, drop {
        coin_type: String,
        pool_address: address,
    }

    /// Emitted when a new private account is created
    public struct NewAccount has copy, drop {
        account_address: address,
        hashed_secret: u256,
    }

    /// Emitted when a new commitment is added to the Merkle tree
    public struct NewCommitment has copy, drop {
        index: u64,
        commitment: u256,
        encrypted_output: vector<u8>,
    }

    /// Emitted when a nullifier is spent (prevents double-spending)
    public struct NullifierSpent has copy, drop {
        nullifier: u256,
    }

    /// Emitted when a new encryption key is registered
    public struct NewEncryptionKey has copy, drop {
        user_address: address,
        encryption_key: String,
    }

    /// Emit a new pool creation event
    public(package) fun emit_new_pool(coin_type: String, pool_address: address) {
        emit(NewPool { coin_type, pool_address });
    }

    /// Emit a new account creation event
    public(package) fun emit_new_account(account_address: address, hashed_secret: u256) {
        emit(NewAccount { account_address, hashed_secret });
    }

    /// Emit a new commitment event
    public(package) fun emit_new_commitment(index: u64, commitment: u256, encrypted_output: vector<u8>) {
        emit(NewCommitment { index, commitment, encrypted_output });
    }

    /// Emit a nullifier spent event
    public(package) fun emit_nullifier_spent(nullifier: u256) {
        emit(NullifierSpent { nullifier });
    }

    /// Emit a new encryption key event
    public(package) fun emit_new_encryption_key(user_address: address, encryption_key: String) {
        emit(NewEncryptionKey { user_address, encryption_key });
    }
}
