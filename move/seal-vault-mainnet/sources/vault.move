module seal_vault::vault {
    use sui::bcs;

    const ENotAuthorized: u64 = 1;

    entry fun seal_approve(id: vector<u8>, ctx: &TxContext) {
        let sender_bytes = bcs::to_bytes(&ctx.sender());
        assert!(id == sender_bytes, ENotAuthorized);
    }
}
