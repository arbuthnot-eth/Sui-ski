#[allow(lint(public_entry))]
module decay_auction::auction {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::Clock;

    const EInvalidDuration: u64 = 0;
    const EInvalidPrice: u64 = 1;
    const EInsufficientPayment: u64 = 2;
    const ENotStarted: u64 = 3;
    const EExpired: u64 = 4;
    const ENotSeller: u64 = 5;
    const ENotExpired: u64 = 6;
    const ECancelWindowClosed: u64 = 7;

    const MAX_DURATION_MS: u64 = 30 * 24 * 60 * 60 * 1000;
    const MIN_DURATION_MS: u64 = 60 * 60 * 1000;
    const CANCEL_WINDOW_MS: u64 = 24 * 60 * 60 * 1000;
    const MIN_START_PRICE_MIST: u64 = 1_000_000_000;
    const PPM: u256 = 1_000_000;
    const PPM_POW_EIGHT: u256 = 1_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000_000;

    public struct DecayListing<T: key + store> has key {
        id: UID,
        nft: T,
        seller: address,
        start_price_mist: u64,
        start_time_ms: u64,
        end_time_ms: u64,
    }

    fun pow_eight(base: u256): u256 {
        let sq = base * base;
        let q = sq * sq;
        q * q
    }

    public fun create<T: key + store>(
        nft: T,
        start_price_mist: u64,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): DecayListing<T> {
        assert!(duration_ms >= MIN_DURATION_MS && duration_ms <= MAX_DURATION_MS, EInvalidDuration);
        assert!(start_price_mist >= MIN_START_PRICE_MIST, EInvalidPrice);

        let now = clock.timestamp_ms();

        DecayListing {
            id: object::new(ctx),
            nft,
            seller: ctx.sender(),
            start_price_mist,
            start_time_ms: now,
            end_time_ms: now + duration_ms,
        }
    }

    public entry fun create_and_share<T: key + store>(
        nft: T,
        start_price_mist: u64,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let listing = create(nft, start_price_mist, duration_ms, clock, ctx);
        transfer::share_object(listing);
    }

    public entry fun buy<T: key + store>(
        listing: DecayListing<T>,
        mut payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let now = clock.timestamp_ms();
        assert!(now >= listing.start_time_ms, ENotStarted);
        assert!(now < listing.end_time_ms, EExpired);

        let price = current_price_internal(&listing, now);
        assert!(coin::value(&payment) >= price, EInsufficientPayment);

        let DecayListing { id, nft, seller, start_price_mist: _, start_time_ms: _, end_time_ms: _ } = listing;
        object::delete(id);

        if (price > 0) {
            let seller_coin = coin::split(&mut payment, price, ctx);
            transfer::public_transfer(seller_coin, seller);
        };

        let change = coin::value(&payment);
        if (change > 0) {
            transfer::public_transfer(payment, ctx.sender());
        } else {
            coin::destroy_zero(payment);
        };

        transfer::public_transfer(nft, ctx.sender());
    }

    public entry fun cancel<T: key + store>(
        listing: DecayListing<T>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let now = clock.timestamp_ms();
        assert!(listing.seller == ctx.sender(), ENotSeller);
        assert!(now <= listing.start_time_ms + CANCEL_WINDOW_MS, ECancelWindowClosed);

        let DecayListing { id, nft, seller, start_price_mist: _, start_time_ms: _, end_time_ms: _ } = listing;
        object::delete(id);

        transfer::public_transfer(nft, seller);
    }

    public entry fun reclaim_expired<T: key + store>(
        listing: DecayListing<T>,
        clock: &Clock,
        _ctx: &mut TxContext,
    ) {
        let now = clock.timestamp_ms();
        assert!(now >= listing.end_time_ms, ENotExpired);

        let DecayListing { id, nft, seller, start_price_mist: _, start_time_ms: _, end_time_ms: _ } = listing;
        object::delete(id);

        transfer::public_transfer(nft, seller);
    }

    public fun current_price<T: key + store>(listing: &DecayListing<T>, clock: &Clock): u64 {
        let now = clock.timestamp_ms();
        if (now >= listing.end_time_ms) return 0;
        if (now < listing.start_time_ms) return listing.start_price_mist;
        current_price_internal(listing, now)
    }

    fun current_price_internal<T: key + store>(listing: &DecayListing<T>, now: u64): u64 {
        let remaining = listing.end_time_ms - now;
        let total = listing.end_time_ms - listing.start_time_ms;

        let remaining_ppm = (remaining as u256) * PPM / (total as u256);
        let ratio8 = pow_eight(remaining_ppm);
        let price = (listing.start_price_mist as u256) * ratio8 / PPM_POW_EIGHT;

        (price as u64)
    }

    public fun seller<T: key + store>(listing: &DecayListing<T>): address {
        listing.seller
    }

    public fun start_price_mist<T: key + store>(listing: &DecayListing<T>): u64 {
        listing.start_price_mist
    }

    public fun start_time_ms<T: key + store>(listing: &DecayListing<T>): u64 {
        listing.start_time_ms
    }

    public fun end_time_ms<T: key + store>(listing: &DecayListing<T>): u64 {
        listing.end_time_ms
    }

    public fun is_active<T: key + store>(listing: &DecayListing<T>, clock: &Clock): bool {
        let now = clock.timestamp_ms();
        now >= listing.start_time_ms && now < listing.end_time_ms
    }

    public fun is_expired<T: key + store>(listing: &DecayListing<T>, clock: &Clock): bool {
        clock.timestamp_ms() >= listing.end_time_ms
    }
}
