module sol_swap::pool {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::Clock;
    use std::string::String;

    const ENotOperator: u64 = 0;
    const EPoolPaused: u64 = 1;
    const EInsufficientLiquidity: u64 = 2;
    const ERequestExpired: u64 = 3;
    const ERequestAlreadySettled: u64 = 4;
    const EInvalidAmount: u64 = 5;
    const EStalePrice: u64 = 6;
    const EPriceDeviation: u64 = 7;
    const ERequestNotExpired: u64 = 8;

    const REQUEST_EXPIRY_MS: u64 = 30 * 60 * 1000;
    const MAX_PRICE_AGE_MS: u64 = 5 * 60 * 1000;
    const MAX_DEVIATION_BPS: u64 = 500;
    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

    public struct OperatorCap has key, store {
        id: UID,
    }

    public struct SwapPool has key {
        id: UID,
        liquidity: Balance<SUI>,
        operator: address,
        solana_address: String,
        dwallet_id: ID,
        sol_per_sui_e9: u64,
        sui_per_sol_e9: u64,
        price_updated_at: u64,
        fee_bps: u64,
        paused: bool,
        total_swaps: u64,
        total_volume_mist: u64,
    }

    public struct SwapRequest has key, store {
        id: UID,
        requester: address,
        sol_lamports: u64,
        expected_sui_mist: u64,
        solana_tx_sig: String,
        settled: bool,
        created_at: u64,
        expires_at: u64,
    }

    public struct SettlementReceipt has key, store {
        id: UID,
        request_id: ID,
        requester: address,
        sui_paid_mist: u64,
        settled_at: u64,
    }

    fun init(ctx: &mut TxContext) {
        let cap = OperatorCap { id: object::new(ctx) };
        transfer::transfer(cap, ctx.sender());
    }

    public fun create_pool(
        _cap: &OperatorCap,
        initial_sui: Coin<SUI>,
        solana_address: String,
        dwallet_id: ID,
        fee_bps: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): SwapPool {
        SwapPool {
            id: object::new(ctx),
            liquidity: coin::into_balance(initial_sui),
            operator: ctx.sender(),
            solana_address,
            dwallet_id,
            sol_per_sui_e9: 0,
            sui_per_sol_e9: 0,
            price_updated_at: clock.timestamp_ms(),
            fee_bps,
            paused: false,
            total_swaps: 0,
            total_volume_mist: 0,
        }
    }

    public fun share_pool(pool: SwapPool) {
        transfer::share_object(pool);
    }

    public fun deposit_liquidity(
        pool: &mut SwapPool,
        _cap: &OperatorCap,
        sui: Coin<SUI>,
        ctx: &TxContext,
    ) {
        assert!(pool.operator == ctx.sender(), ENotOperator);
        balance::join(&mut pool.liquidity, coin::into_balance(sui));
    }

    public fun withdraw_liquidity(
        pool: &mut SwapPool,
        _cap: &OperatorCap,
        amount_mist: u64,
        ctx: &mut TxContext,
    ): Coin<SUI> {
        assert!(pool.operator == ctx.sender(), ENotOperator);
        assert!(balance::value(&pool.liquidity) >= amount_mist, EInsufficientLiquidity);
        coin::from_balance(balance::split(&mut pool.liquidity, amount_mist), ctx)
    }

    public fun update_price(
        pool: &mut SwapPool,
        _cap: &OperatorCap,
        sol_per_sui_e9: u64,
        sui_per_sol_e9: u64,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert!(pool.operator == ctx.sender(), ENotOperator);

        if (pool.sol_per_sui_e9 > 0) {
            let old = pool.sol_per_sui_e9;
            let diff = if (sol_per_sui_e9 > old) { sol_per_sui_e9 - old } else { old - sol_per_sui_e9 };
            assert!(diff * 10000 / old <= MAX_DEVIATION_BPS, EPriceDeviation);
        };

        pool.sol_per_sui_e9 = sol_per_sui_e9;
        pool.sui_per_sol_e9 = sui_per_sol_e9;
        pool.price_updated_at = clock.timestamp_ms();
    }

    public fun request_sol_to_sui(
        pool: &SwapPool,
        sol_lamports: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): SwapRequest {
        assert!(!pool.paused, EPoolPaused);
        assert!(sol_lamports > 0, EInvalidAmount);
        assert!(pool.sui_per_sol_e9 > 0, EStalePrice);

        let now = clock.timestamp_ms();
        assert!(now - pool.price_updated_at <= MAX_PRICE_AGE_MS, EStalePrice);

        let gross_sui_mist = (sol_lamports as u128) * (pool.sui_per_sol_e9 as u128) / (LAMPORTS_PER_SOL as u128);
        let fee_mist = gross_sui_mist * (pool.fee_bps as u128) / 10000;
        let net_sui_mist = gross_sui_mist - fee_mist;

        assert!(balance::value(&pool.liquidity) >= (net_sui_mist as u64), EInsufficientLiquidity);

        SwapRequest {
            id: object::new(ctx),
            requester: ctx.sender(),
            sol_lamports,
            expected_sui_mist: (net_sui_mist as u64),
            solana_tx_sig: std::string::utf8(b""),
            settled: false,
            created_at: now,
            expires_at: now + REQUEST_EXPIRY_MS,
        }
    }

    public fun settle_sol_to_sui(
        pool: &mut SwapPool,
        _cap: &OperatorCap,
        request: &mut SwapRequest,
        sol_tx_sig: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(pool.operator == ctx.sender(), ENotOperator);
        assert!(!request.settled, ERequestAlreadySettled);
        assert!(clock.timestamp_ms() <= request.expires_at, ERequestExpired);

        let payout_mist = request.expected_sui_mist;
        assert!(balance::value(&pool.liquidity) >= payout_mist, EInsufficientLiquidity);

        request.settled = true;
        request.solana_tx_sig = sol_tx_sig;

        pool.total_swaps = pool.total_swaps + 1;
        pool.total_volume_mist = pool.total_volume_mist + payout_mist;

        let payout = coin::from_balance(
            balance::split(&mut pool.liquidity, payout_mist),
            ctx,
        );
        transfer::public_transfer(payout, request.requester);

        let receipt = SettlementReceipt {
            id: object::new(ctx),
            request_id: object::id(request),
            requester: request.requester,
            sui_paid_mist: payout_mist,
            settled_at: clock.timestamp_ms(),
        };
        transfer::transfer(receipt, pool.operator);
    }

    public fun refund_expired(
        _pool: &SwapPool,
        request: &SwapRequest,
        clock: &Clock,
    ) {
        assert!(!request.settled, ERequestAlreadySettled);
        assert!(clock.timestamp_ms() > request.expires_at, ERequestNotExpired);
    }

    public fun pause(
        pool: &mut SwapPool,
        _cap: &OperatorCap,
        ctx: &TxContext,
    ) {
        assert!(pool.operator == ctx.sender(), ENotOperator);
        pool.paused = true;
    }

    public fun unpause(
        pool: &mut SwapPool,
        _cap: &OperatorCap,
        ctx: &TxContext,
    ) {
        assert!(pool.operator == ctx.sender(), ENotOperator);
        pool.paused = false;
    }

    public fun pool_liquidity(pool: &SwapPool): u64 {
        balance::value(&pool.liquidity)
    }

    public fun pool_paused(pool: &SwapPool): bool {
        pool.paused
    }

    public fun pool_fee_bps(pool: &SwapPool): u64 {
        pool.fee_bps
    }

    public fun pool_sui_per_sol(pool: &SwapPool): u64 {
        pool.sui_per_sol_e9
    }

    public fun pool_sol_per_sui(pool: &SwapPool): u64 {
        pool.sol_per_sui_e9
    }

    public fun pool_total_swaps(pool: &SwapPool): u64 {
        pool.total_swaps
    }

    public fun pool_solana_address(pool: &SwapPool): &String {
        &pool.solana_address
    }

    public fun request_settled(request: &SwapRequest): bool {
        request.settled
    }

    public fun request_expected_sui(request: &SwapRequest): u64 {
        request.expected_sui_mist
    }
}
