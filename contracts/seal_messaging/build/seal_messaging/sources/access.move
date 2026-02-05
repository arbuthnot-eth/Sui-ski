module seal_messaging::access;

const ENotAuthorized: u64 = 0;
const EInvalidIdentity: u64 = 1;

entry fun seal_approve(id: vector<u8>, ctx: &TxContext) {
    let caller = ctx.sender();
    let caller_bytes = caller.to_bytes();

    assert!(id.length() >= 32, EInvalidIdentity);

    let mut matches = true;
    let mut i = 0;
    while (i < 32) {
        if (id[i] != caller_bytes[i]) {
            matches = false;
        };
        i = i + 1;
    };

    assert!(matches, ENotAuthorized);
}
