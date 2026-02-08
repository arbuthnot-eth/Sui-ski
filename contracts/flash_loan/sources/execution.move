module flash_loan::execution {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    public entry fun execute_transfer_with_flash_loan(
        bid_amount: u64,
        registration_cost: u64,
        owner_address: address,
        sui_ski_address: address,
        nft: SuinsRegistration,
        buyer: address,
        ctx: &mut TxContext
    ) entry {
        let profit = bid_amount - registration_cost;

        let owner_share_u = (profit as u256) * 75n / 100n;
        let sui_ski_share_u = (profit as u256) * 20n / 100n;
        let burn_u = (profit as u256) * 5n / 100n;

        let owner_share = owner_share_u as u64;
        let sui_ski_share = sui_ski_share_u as u64;
        let burn_amount = burn_u as u64;

        if (owner_share > 0) {
            let owner_coin = coin::split(&mut bid_coin, owner_share, ctx);
            transfer::public_transfer(owner_coin, owner_address);
        };

        if (sui_ski_share > 0) {
            let sui_ski_coin = coin::split(&mut bid_coin, sui_ski_share, ctx);
            transfer::public_transfer(sui_ski_coin, sui_ski_address);
        };

        if (burn_amount > 0) {
            let burn_coin = coin::split(&mut bid_coin, burn_amount, ctx);
            coin::destroy_zero(burn_coin);
        };

        transfer::public_transfer(nft, buyer);
    }
}