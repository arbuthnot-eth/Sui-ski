/// Bounty escrow module for SuiNS name sniping
///
/// Allows users to create bounties for expired names in grace period.
/// Funds are held in escrow until the grace period ends, when an executor
/// can claim the bounty by registering the name for the beneficiary.
module bounty_escrow::escrow {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::Clock;
    use std::string::String;

    // ============ Error Codes ============
    const EInsufficientFunds: u64 = 0;
    const EBountyNotReady: u64 = 1;
    const EBountyAlreadyExecuted: u64 = 2;
    const ENotBeneficiary: u64 = 3;
    const EBountyExpired: u64 = 4;
    const EInvalidReward: u64 = 5;
    const EBountyLocked: u64 = 6;

    // ============ Constants ============
    /// Minimum executor reward: 1 SUI (in MIST)
    const MIN_EXECUTOR_REWARD: u64 = 1_000_000_000;
    /// Bounty expires 7 days after available_at if not executed
    const EXPIRY_BUFFER_MS: u64 = 7 * 24 * 60 * 60 * 1000;

    // ============ Structs ============

    /// A bounty for sniping an expired SuiNS name
    public struct Bounty has key, store {
        id: UID,
        /// SuiNS name to claim (without .sui suffix)
        name: String,
        /// Address that will receive the registered name NFT
        beneficiary: address,
        /// Address that created the bounty
        creator: address,
        /// Escrowed SUI for registration + reward
        escrowed: Balance<SUI>,
        /// Amount reserved for executor reward (in MIST)
        executor_reward: u64,
        /// Timestamp when the name becomes available (grace period end)
        available_at: u64,
        /// Registration duration in years (1-5)
        years: u8,
        /// Whether the bounty has been executed
        executed: bool,
        /// Whether the bounty is locked (pre-signed tx attached)
        locked: bool,
        /// Creation timestamp
        created_at: u64,
    }

    /// A gift bounty for someone to register/renew a name for the beneficiary
    /// In this model, the executor provides the registration SUI, and the
    /// bounty creator provides only the reward.
    public struct GiftBounty has key, store {
        id: UID,
        /// SuiNS name to claim
        name: String,
        /// Address that will receive the registered name NFT
        beneficiary: address,
        /// Address that created the bounty
        creator: address,
        /// Escrowed reward for the executor
        reward: Balance<SUI>,
        /// Whether the bounty has been executed
        executed: bool,
    }

    /// Receipt proving bounty execution (for off-chain verification)
    public struct ExecutionReceipt has key, store {
        id: UID,
        bounty_id: ID,
        executor: address,
        reward_paid: u64,
        executed_at: u64,
    }

    // ============ Public Functions ============

    /// Create a new bounty for a SuiNS name
    ///
    /// The deposited SUI must cover:
    /// - Registration cost (determined by SuiNS pricing at execution time)
    /// - Executor reward (minimum 1 SUI)
    public fun create_bounty(
        name: String,
        beneficiary: address,
        payment: Coin<SUI>,
        executor_reward: u64,
        available_at: u64,
        years: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ): Bounty {
        assert!(executor_reward >= MIN_EXECUTOR_REWARD, EInvalidReward);
        assert!(coin::value(&payment) >= executor_reward, EInsufficientFunds);
        assert!(years >= 1 && years <= 5, EInvalidReward);

        Bounty {
            id: object::new(ctx),
            name,
            beneficiary,
            creator: ctx.sender(),
            escrowed: coin::into_balance(payment),
            executor_reward,
            available_at,
            years,
            executed: false,
            locked: false,
            created_at: clock.timestamp_ms(),
        }
    }

    /// Create a new gift bounty
    ///
    /// The deposited SUI is solely for the executor's reward.
    /// The executor is expected to provide their own SUI for the registration.
    public fun create_gift_bounty(
        name: String,
        beneficiary: address,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ): GiftBounty {
        GiftBounty {
            id: object::new(ctx),
            name,
            beneficiary,
            creator: ctx.sender(),
            reward: coin::into_balance(payment),
            executed: false,
        }
    }

    /// Create bounty and share it (convenience function)
    public entry fun create_and_share_bounty(
        name: String,
        beneficiary: address,
        payment: Coin<SUI>,
        executor_reward: u64,
        available_at: u64,
        years: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let bounty = create_bounty(
            name,
            beneficiary,
            payment,
            executor_reward,
            available_at,
            years,
            clock,
            ctx
        );
        transfer::share_object(bounty);
    }

    /// Create gift bounty and share it (convenience function)
    public entry fun create_and_share_gift_bounty(
        name: String,
        beneficiary: address,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let bounty = create_gift_bounty(name, beneficiary, payment, ctx);
        transfer::share_object(bounty);
    }

    /// Lock the bounty (called when pre-signed tx is attached)
    /// Only the creator can lock their bounty
    public entry fun lock_bounty(
        bounty: &mut Bounty,
        ctx: &TxContext
    ) {
        assert!(bounty.creator == ctx.sender(), ENotBeneficiary);
        assert!(!bounty.executed, EBountyAlreadyExecuted);
        bounty.locked = true;
    }

    /// Release funds for registration
    /// Called by the executor's transaction to get funds for SuiNS registration
    ///
    /// Returns two coins:
    /// 1. Registration funds (total - executor_reward)
    /// 2. Executor reward
    public fun release_for_registration(
        bounty: &mut Bounty,
        clock: &Clock,
        ctx: &mut TxContext
    ): (Coin<SUI>, Coin<SUI>) {
        // Verify bounty state
        assert!(!bounty.executed, EBountyAlreadyExecuted);

        let now = clock.timestamp_ms();
        assert!(now >= bounty.available_at, EBountyNotReady);
        assert!(now <= bounty.available_at + EXPIRY_BUFFER_MS, EBountyExpired);

        // Mark as executed
        bounty.executed = true;

        // Split out executor reward
        let total = balance::value(&bounty.escrowed);
        let reward_balance = balance::split(&mut bounty.escrowed, bounty.executor_reward);
        let registration_balance = balance::withdraw_all(&mut bounty.escrowed);

        (
            coin::from_balance(registration_balance, ctx),
            coin::from_balance(reward_balance, ctx)
        )
    }

    /// Execute bounty - returns funds for registration
    /// This is meant to be called as part of a PTB that also registers the name
    /// and transfers the NFT to the beneficiary.
    ///
    /// Returns (registration_coin, reward_coin, beneficiary_address)
    /// The caller MUST use registration_coin for SuiNS registration
    /// The caller MUST transfer the resulting NFT to beneficiary_address
    /// The caller keeps reward_coin as their execution reward
    public fun execute_bounty(
        bounty: &mut Bounty,
        clock: &Clock,
        ctx: &mut TxContext
    ): (Coin<SUI>, Coin<SUI>, address) {
        let (registration_coin, reward_coin) = release_for_registration(bounty, clock, ctx);
        (registration_coin, reward_coin, bounty.beneficiary)
    }

    /// Claim gift reward by providing the registered NFT
    /// The NFT will be transferred to the beneficiary
    public fun claim_gift_reward(
        bounty: &mut GiftBounty,
        nft: 0x2::suins_registration::SuinsRegistration,
        ctx: &mut TxContext
    ) {
        assert!(!bounty.executed, EBountyAlreadyExecuted);
        
        bounty.executed = true;
        
        // Transfer NFT to beneficiary
        transfer::public_transfer(nft, bounty.beneficiary);
        
        // Release reward to executor (sender)
        let reward_amount = balance::value(&bounty.reward);
        let reward_coin = coin::from_balance(balance::split(&mut bounty.reward, reward_amount), ctx);
        transfer::public_transfer(reward_coin, ctx.sender());
    }

    /// Convenience entry function that executes and transfers reward to executor
    /// Note: The registration and NFT transfer must be done separately in the PTB
    public entry fun execute_bounty_entry(
        bounty: &mut Bounty,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let (registration_coin, reward_coin) = release_for_registration(bounty, clock, ctx);

        // Create execution receipt
        let receipt = ExecutionReceipt {
            id: object::new(ctx),
            bounty_id: object::id(bounty),
            executor: ctx.sender(),
            reward_paid: coin::value(&reward_coin),
            executed_at: clock.timestamp_ms(),
        };

        // Transfer reward to executor
        transfer::public_transfer(reward_coin, ctx.sender());

        // Transfer registration funds to executor (they will use it for SuiNS registration)
        transfer::public_transfer(registration_coin, ctx.sender());

        // Transfer receipt to executor
        transfer::transfer(receipt, ctx.sender());
    }

    /// Cancel a bounty and reclaim funds
    /// Only the creator can cancel, and only if not locked or executed
    public entry fun cancel_bounty(
        bounty: Bounty,
        ctx: &mut TxContext
    ) {
        let Bounty {
            id,
            name: _,
            beneficiary: _,
            creator,
            escrowed,
            executor_reward: _,
            available_at: _,
            years: _,
            executed,
            locked,
            created_at: _,
        } = bounty;

        assert!(creator == ctx.sender(), ENotBeneficiary);
        assert!(!executed, EBountyAlreadyExecuted);
        assert!(!locked, EBountyLocked);

        object::delete(id);

        let refund = coin::from_balance(escrowed, ctx);
        transfer::public_transfer(refund, creator);
    }

    /// Reclaim expired bounty funds
    /// Anyone can call this after expiry to return funds to creator
    public entry fun reclaim_expired(
        bounty: Bounty,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let Bounty {
            id,
            name: _,
            beneficiary: _,
            creator,
            escrowed,
            executor_reward: _,
            available_at,
            years: _,
            executed,
            locked: _,
            created_at: _,
        } = bounty;

        assert!(!executed, EBountyAlreadyExecuted);

        let now = clock.timestamp_ms();
        assert!(now > available_at + EXPIRY_BUFFER_MS, EBountyNotReady);

        object::delete(id);

        let refund = coin::from_balance(escrowed, ctx);
        transfer::public_transfer(refund, creator);
    }

    // ============ View Functions ============

    public fun name(bounty: &Bounty): &String {
        &bounty.name
    }

    public fun beneficiary(bounty: &Bounty): address {
        bounty.beneficiary
    }

    public fun creator(bounty: &Bounty): address {
        bounty.creator
    }

    public fun escrowed_amount(bounty: &Bounty): u64 {
        balance::value(&bounty.escrowed)
    }

    public fun executor_reward(bounty: &Bounty): u64 {
        bounty.executor_reward
    }

    public fun available_at(bounty: &Bounty): u64 {
        bounty.available_at
    }

    public fun years(bounty: &Bounty): u8 {
        bounty.years
    }

    public fun is_executed(bounty: &Bounty): bool {
        bounty.executed
    }

    public fun is_locked(bounty: &Bounty): bool {
        bounty.locked
    }

    public fun is_ready(bounty: &Bounty, clock: &Clock): bool {
        let now = clock.timestamp_ms();
        !bounty.executed && now >= bounty.available_at && now <= bounty.available_at + EXPIRY_BUFFER_MS
    }

    public fun is_expired(bounty: &Bounty, clock: &Clock): bool {
        let now = clock.timestamp_ms();
        now > bounty.available_at + EXPIRY_BUFFER_MS
    }
}
