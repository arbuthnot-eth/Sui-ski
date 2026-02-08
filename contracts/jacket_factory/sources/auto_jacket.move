module jacket_factory::auto_jacket {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::Clock;
    use sui::event;
    use decay_auction::auction as auction;

    public struct JacketedListingCreated has copy, drop {
        name: String,
        nft_id: ID,
        start_price_mist: u64,
        decay_duration_ms: u64,
        grace_period_start_ms: u64,
    }

    public struct GracePeriodStarted has copy, drop {
        name: String,
        nft_id: ID,
        start_time_ms: u64,
        start_price_mist: u64,
    }

    public entry fun create_jacketed_listing<T: key + store>(
        nft: T,
        start_price_mist: u64,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) entry {
        let listing = auction::create_and_share(nft, start_price_mist, duration_ms, clock, ctx);
    }

    public entry fun emit_grace_period_event(
        name: String,
        nft_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) entry {
        event::emit(GracePeriodStarted {
            name,
            nft_id,
            start_time_ms: clock.timestamp_ms(),
            start_price_mist: 100_000_000_000_000_000,
        });
    }
}