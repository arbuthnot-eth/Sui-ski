/// Private Protocol - Privacy-preserving transactions on Sui
///
/// A fork of the Vortex protocol implementing:
/// - 2-input/2-output UTXO model with Groth16 proofs
/// - Merkle tree for commitment tracking
/// - Nullifier-based double-spend prevention
/// - Generic over coin type (works with SUI, ioUSD, etc.)
///
/// MVR Registration: @iousd/private
/// Subdomain: private--iousd.sui.ski
module private::private {
    use std::ascii::{Self, String};
    use std::type_name;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::groth16;
    use sui::table::{Self, Table};
    use sui::transfer::Receiving;

    use private::private_account::{Self, PrivateAccount};
    use private::private_constants;
    use private::private_errors;
    use private::private_events;
    use private::private_ext_data::{Self, ExtData};
    use private::private_merkle_tree::{Self, MerkleTree};
    use private::private_proof::{Self, Proof};

    // === Structs ===

    /// A privacy pool for a specific coin type
    ///
    /// Each pool maintains its own Merkle tree, nullifier set,
    /// and balance for deposits/withdrawals.
    public struct Private<phantom CoinType> has key, store {
        id: UID,
        /// Groth16 prepared verifying key (bn254 curve)
        verifying_key: groth16::PreparedVerifyingKey,
        /// Pool balance (sum of all deposits minus withdrawals)
        balance: Balance<CoinType>,
        /// Set of spent nullifiers (prevents double-spending)
        nullifiers: Table<u256, bool>,
        /// Merkle tree of commitments
        merkle_tree: MerkleTree,
    }

    /// Registry mapping coin types to pool addresses
    ///
    /// This is a shared object that allows pool discovery.
    public struct Registry has key {
        id: UID,
        /// Maps coin type name to pool address
        pools: Table<String, address>,
        /// User encryption keys for receiving private transfers
        encryption_keys: Table<address, String>,
    }

    // === Init ===

    /// Initialize the registry (called once at package publish)
    fun init(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            pools: table::new(ctx),
            encryption_keys: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    // === Pool Management ===

    /// Create a new privacy pool for a coin type
    public fun new<CoinType>(ctx: &mut TxContext): Private<CoinType> {
        let vk_bytes = private_constants::verification_key!();
        let verifying_key = groth16::prepare_verifying_key(&groth16::bn254(), &vk_bytes);

        Private<CoinType> {
            id: object::new(ctx),
            verifying_key,
            balance: balance::zero(),
            nullifiers: table::new(ctx),
            merkle_tree: private_merkle_tree::new(ctx),
        }
    }

    /// Share a pool as a shared object and register it
    public fun share<CoinType>(pool: Private<CoinType>, registry: &mut Registry) {
        let pool_address = object::uid_to_address(&pool.id);
        let coin_type = type_name::get<CoinType>();
        let coin_type_string = ascii::string(std::ascii::into_bytes(type_name::into_string(coin_type)));

        // Check pool doesn't already exist
        assert!(!table::contains(&registry.pools, coin_type_string), private_errors::pool_already_exists!());

        // Register and emit event
        table::add(&mut registry.pools, coin_type_string, pool_address);
        private_events::emit_new_pool(coin_type_string, pool_address);

        transfer::share_object(pool);
    }

    /// Create and share a new pool (convenience function)
    public entry fun create_pool<CoinType>(registry: &mut Registry, ctx: &mut TxContext) {
        let pool = new<CoinType>(ctx);
        share(pool, registry);
    }

    // === Transactions ===

    /// Process a private transaction (deposit or withdrawal)
    ///
    /// This is the core function that:
    /// 1. Verifies the Groth16 proof
    /// 2. Checks nullifiers haven't been spent
    /// 3. Updates the Merkle tree with new commitments
    /// 4. Handles deposits/withdrawals
    public fun transact<CoinType>(
        pool: &mut Private<CoinType>,
        proof: Proof<CoinType>,
        ext_data: ExtData,
        deposit: Coin<CoinType>,
        ctx: &mut TxContext,
    ): (Coin<CoinType>, Coin<CoinType>) {
        process_transaction(pool, proof, ext_data, deposit, 0, ctx)
    }

    /// Process a transaction funded from a PrivateAccount
    ///
    /// This variant allows using coins held by a shared PrivateAccount
    /// instead of directly providing coins.
    public fun transact_with_account<CoinType>(
        pool: &mut Private<CoinType>,
        account: &mut PrivateAccount,
        proof: Proof<CoinType>,
        ext_data: ExtData,
        mut deposit: Coin<CoinType>,
        receiving: Receiving<Coin<CoinType>>,
        ctx: &mut TxContext,
    ): (Coin<CoinType>, Coin<CoinType>) {
        // Receive coins from account and merge with deposit
        let account_coins = private_account::receive(account, receiving);
        let hashed_secret = private_account::hashed_secret(account);

        // Merge the coins
        coin::join(&mut deposit, account_coins);

        process_transaction(pool, proof, ext_data, deposit, hashed_secret, ctx)
    }

    /// Internal transaction processing
    fun process_transaction<CoinType>(
        pool: &mut Private<CoinType>,
        proof: Proof<CoinType>,
        ext_data: ExtData,
        mut deposit: Coin<CoinType>,
        hashed_secret: u256,
        ctx: &mut TxContext,
    ): (Coin<CoinType>, Coin<CoinType>) {
        // 1. Verify pool address matches proof
        let pool_address = object::uid_to_address(&pool.id);
        assert!(private_proof::pool_address(&proof) == pool_address, private_errors::invalid_vortex!());

        // 2. Verify Merkle root is known
        let proof_root = private_proof::root(&proof);
        assert!(private_merkle_tree::is_known_root(&pool.merkle_tree, proof_root), private_errors::proof_root_not_known!());

        // 3. Verify nullifiers haven't been spent
        let nullifier1 = private_proof::nullifier1(&proof);
        let nullifier2 = private_proof::nullifier2(&proof);
        assert!(!table::contains(&pool.nullifiers, nullifier1), private_errors::nullifier_already_spent!());
        assert!(!table::contains(&pool.nullifiers, nullifier2), private_errors::nullifier_already_spent!());

        // 4. Verify the Groth16 proof
        let public_inputs = if (hashed_secret == 0) {
            private_proof::public_inputs(&proof)
        } else {
            private_proof::tto_public_inputs(&proof, hashed_secret)
        };
        let proof_points = private_proof::proof_points(&proof);
        let public_inputs_obj = groth16::public_proof_inputs_from_bytes(public_inputs);
        let proof_obj = groth16::proof_points_from_bytes(proof_points);

        assert!(
            groth16::verify_groth16_proof(&groth16::bn254(), &pool.verifying_key, &public_inputs_obj, &proof_obj),
            private_errors::invalid_proof!()
        );

        // 5. Mark nullifiers as spent
        table::add(&mut pool.nullifiers, nullifier1, true);
        table::add(&mut pool.nullifiers, nullifier2, true);
        private_events::emit_nullifier_spent(nullifier1);
        private_events::emit_nullifier_spent(nullifier2);

        // 6. Add commitments to Merkle tree
        let commitment1 = private_proof::commitment1(&proof);
        let commitment2 = private_proof::commitment2(&proof);
        let (index1, _index2) = private_merkle_tree::append_pair(&mut pool.merkle_tree, commitment1, commitment2);
        private_events::emit_new_commitment(index1, commitment1, private_ext_data::encrypted_output1(&ext_data));
        private_events::emit_new_commitment(index1 + 1, commitment2, private_ext_data::encrypted_output2(&ext_data));

        // 7. Handle value transfer
        let _deposit_amount = coin::value(&deposit); // Used for validation
        let withdraw_amount = private_ext_data::amount(&ext_data);
        let relayer_fee = private_ext_data::relayer_fee(&ext_data);
        let recipient = private_ext_data::recipient(&ext_data);
        let relayer = private_ext_data::relayer(&ext_data);

        // Deposit into pool (consume the deposit coin)
        let deposit_balance = coin::into_balance(deposit);
        balance::join(&mut pool.balance, deposit_balance);

        // Withdraw from pool for recipient
        let withdrawal = if (withdraw_amount > 0 && recipient != @0x0) {
            let withdraw_balance = balance::split(&mut pool.balance, withdraw_amount);
            let withdraw_coin = coin::from_balance(withdraw_balance, ctx);
            transfer::public_transfer(withdraw_coin, recipient);
            coin::zero<CoinType>(ctx)
        } else if (withdraw_amount > 0) {
            // Return withdrawal to caller if no recipient
            let withdraw_balance = balance::split(&mut pool.balance, withdraw_amount);
            coin::from_balance(withdraw_balance, ctx)
        } else {
            coin::zero<CoinType>(ctx)
        };

        // Pay relayer fee
        if (relayer_fee > 0 && relayer != @0x0) {
            let relayer_balance = balance::split(&mut pool.balance, relayer_fee);
            let relayer_coin = coin::from_balance(relayer_balance, ctx);
            transfer::public_transfer(relayer_coin, relayer);
        };

        // Return remaining funds (withdrawal if not transferred, and empty second coin)
        (withdrawal, coin::zero(ctx))
    }

    // === Encryption Key Registry ===

    /// Register an encryption key for receiving private transfers
    public entry fun register_encryption_key(
        registry: &mut Registry,
        key: String,
        ctx: &TxContext,
    ) {
        let sender = ctx.sender();
        assert!(!table::contains(&registry.encryption_keys, sender), private_errors::key_already_registered!());

        table::add(&mut registry.encryption_keys, sender, key);
        private_events::emit_new_encryption_key(sender, key);
    }

    // === View Functions ===

    /// Get the current Merkle root
    public fun root<CoinType>(pool: &Private<CoinType>): u256 {
        private_merkle_tree::root(&pool.merkle_tree)
    }

    /// Get the next commitment index
    public fun next_index<CoinType>(pool: &Private<CoinType>): u64 {
        private_merkle_tree::next_index(&pool.merkle_tree)
    }

    /// Check if a nullifier has been spent
    public fun is_nullifier_spent<CoinType>(pool: &Private<CoinType>, nullifier: u256): bool {
        table::contains(&pool.nullifiers, nullifier)
    }

    /// Get pool balance
    public fun pool_balance<CoinType>(pool: &Private<CoinType>): u64 {
        balance::value(&pool.balance)
    }

    /// Get pool address from registry
    public fun get_pool_address(registry: &Registry, coin_type: String): Option<address> {
        if (table::contains(&registry.pools, coin_type)) {
            option::some(*table::borrow(&registry.pools, coin_type))
        } else {
            option::none()
        }
    }

    /// Get encryption key for an address
    public fun get_encryption_key(registry: &Registry, addr: address): Option<String> {
        if (table::contains(&registry.encryption_keys, addr)) {
            option::some(*table::borrow(&registry.encryption_keys, addr))
        } else {
            option::none()
        }
    }

    // === Test Helpers ===

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun new_for_testing<CoinType>(ctx: &mut TxContext): Private<CoinType> {
        new(ctx)
    }
}
