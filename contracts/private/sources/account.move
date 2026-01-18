/// Private Account management for the Private protocol
///
/// PrivateAccount is a shared object that can receive coins
/// and be used as an intermediary for private transactions.
module private::private_account {
    use sui::coin::{Self, Coin};
    use sui::transfer::Receiving;
    use private::private_events;
    use private::private_errors;

    /// A private account for receiving and holding coins
    ///
    /// The hashed_secret is used to identify the account owner
    /// without revealing their address on-chain.
    public struct PrivateAccount has key {
        id: UID,
        /// Hash of the owner's secret (Poseidon hash)
        hashed_secret: u256,
    }

    /// Create a new private account
    ///
    /// The hashed_secret should be computed client-side using:
    /// hashed_secret = poseidon(secret)
    public fun new(hashed_secret: u256, ctx: &mut TxContext): PrivateAccount {
        assert!(hashed_secret != 0, private_errors::invalid_hashed_secret!());

        let account = PrivateAccount {
            id: object::new(ctx),
            hashed_secret,
        };

        private_events::emit_new_account(object::uid_to_address(&account.id), hashed_secret);

        account
    }

    /// Share the account as a shared object
    public fun share(account: PrivateAccount) {
        transfer::share_object(account);
    }

    /// Create and share a new account in one call
    public entry fun create_and_share(hashed_secret: u256, ctx: &mut TxContext) {
        let account = new(hashed_secret, ctx);
        share(account);
    }

    /// Merge multiple coins and send to this account's address
    ///
    /// This is useful for funding an account with multiple small coins.
    public entry fun merge_coins<CoinType>(
        account: &PrivateAccount,
        coins: vector<Coin<CoinType>>,
        ctx: &mut TxContext,
    ) {
        let account_address = object::uid_to_address(&account.id);
        let merged = merge_all(coins, ctx);
        transfer::public_transfer(merged, account_address);
    }

    /// Receive coins sent to this account and return them
    ///
    /// This is a package-internal function used by the pool
    /// when processing transactions with account funding.
    public(package) fun receive<CoinType>(
        account: &mut PrivateAccount,
        receiving: Receiving<Coin<CoinType>>,
    ): Coin<CoinType> {
        transfer::public_receive(&mut account.id, receiving)
    }

    /// Get the hashed secret (package-internal only)
    public(package) fun hashed_secret(account: &PrivateAccount): u256 {
        account.hashed_secret
    }

    /// Get the account address
    public fun account_address(account: &PrivateAccount): address {
        object::uid_to_address(&account.id)
    }

    /// Merge all coins in a vector into one
    fun merge_all<CoinType>(
        mut coins: vector<Coin<CoinType>>,
        ctx: &mut TxContext,
    ): Coin<CoinType> {
        let mut merged = coin::zero<CoinType>(ctx);

        while (!vector::is_empty(&coins)) {
            let coin = vector::pop_back(&mut coins);
            coin::join(&mut merged, coin);
        };

        vector::destroy_empty(coins);
        merged
    }

    #[test_only]
    public fun new_for_testing(hashed_secret: u256, ctx: &mut TxContext): PrivateAccount {
        new(hashed_secret, ctx)
    }
}
