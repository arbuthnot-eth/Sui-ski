module bounty_escrow::grace_registration {
    use std::string::String;
    use sui::balance::{Self, Balance};
    use sui::clock::Clock;
    use sui::coin::{Self, Coin};
    use sui::event;

    const ENotCreator: u64 = 0;
    const EAlreadyExecuted: u64 = 1;
    const EExecutionInProgress: u64 = 2;
    const ETooEarly: u64 = 3;
    const EInsufficientFunds: u64 = 4;
    const EWrongExecutor: u64 = 5;
    const EVaultMismatch: u64 = 6;
    const EInvalidBudget: u64 = 7;
    const ENotExecuting: u64 = 8;
    const EInvalidYears: u64 = 9;
    const EInvalidFeeRecipient: u64 = 10;

    const GRACE_PERIOD_MS: u64 = 30 * 24 * 60 * 60 * 1000;

    public struct GraceRegistrationVault<phantom CoinType> has key, store {
        id: UID,
        name: String,
        beneficiary: address,
        creator: address,
        expired_at_ms: u64,
        years: u8,
        registration_budget_mist: u64,
        executor_reward_mist: u64,
        protocol_fee_mist: u64,
        protocol_fee_recipient: address,
        escrowed: Balance<CoinType>,
        executing: bool,
        executing_executor: address,
        executed: bool,
        created_at_ms: u64,
    }

    public struct RegistrationPermit {
        vault_id: ID,
        executor: address,
    }

    public struct VaultExecuted has copy, drop {
        vault_id: ID,
        executor: address,
        beneficiary: address,
        registration_budget_mist: u64,
        executor_reward_mist: u64,
        protocol_fee_mist: u64,
        protocol_fee_recipient: address,
        executed_at_ms: u64
    }

    public fun create_vault<CoinType>(
        name: String,
        beneficiary: address,
        expired_at_ms: u64,
        years: u8,
        registration_budget_mist: u64,
        executor_reward_mist: u64,
        protocol_fee_mist: u64,
        protocol_fee_recipient: address,
        funding: Coin<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): GraceRegistrationVault<CoinType> {
        assert!(registration_budget_mist > 0, EInvalidBudget);
        assert!(years >= 1 && years <= 5, EInvalidYears);
        assert!(protocol_fee_mist == 0 || protocol_fee_recipient != @0x0, EInvalidFeeRecipient);

        GraceRegistrationVault {
            id: object::new(ctx),
            name,
            beneficiary,
            creator: ctx.sender(),
            expired_at_ms,
            years,
            registration_budget_mist,
            executor_reward_mist,
            protocol_fee_mist,
            protocol_fee_recipient,
            escrowed: coin::into_balance(funding),
            executing: false,
            executing_executor: @0x0,
            executed: false,
            created_at_ms: clock.timestamp_ms(),
        }
    }

    public fun create_and_share_vault<CoinType>(
        name: String,
        beneficiary: address,
        expired_at_ms: u64,
        years: u8,
        registration_budget_mist: u64,
        executor_reward_mist: u64,
        protocol_fee_mist: u64,
        protocol_fee_recipient: address,
        funding: Coin<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let vault = create_vault(
            name,
            beneficiary,
            expired_at_ms,
            years,
            registration_budget_mist,
            executor_reward_mist,
            protocol_fee_mist,
            protocol_fee_recipient,
            funding,
            clock,
            ctx,
        );
        transfer::share_object(vault);
    }

    public fun fund_vault<CoinType>(
        vault: &mut GraceRegistrationVault<CoinType>,
        funding: Coin<CoinType>,
    ) {
        let added = coin::into_balance(funding);
        balance::join(&mut vault.escrowed, added);
    }

    public fun execute_and_take_budget<CoinType>(
        vault: &mut GraceRegistrationVault<CoinType>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): (Coin<CoinType>, RegistrationPermit) {
        assert!(!vault.executed, EAlreadyExecuted);
        assert!(!vault.executing, EExecutionInProgress);
        assert!(clock.timestamp_ms() >= available_at_ms(vault), ETooEarly);

        let required_total = required_total_mist(vault);
        assert!(balance::value(&vault.escrowed) >= required_total, EInsufficientFunds);

        let sender = ctx.sender();
        vault.executing = true;
        vault.executing_executor = sender;

        let registration_balance = balance::split(&mut vault.escrowed, vault.registration_budget_mist);
        let permit = RegistrationPermit {
            vault_id: object::id(vault),
            executor: sender,
        };

        (coin::from_balance(registration_balance, ctx), permit)
    }

    public fun finalize_execution<Nft: key + store, CoinType>(
        vault: &mut GraceRegistrationVault<CoinType>,
        permit: RegistrationPermit,
        nft: Nft,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let RegistrationPermit { vault_id, executor } = permit;

        assert!(vault_id == object::id(vault), EVaultMismatch);
        assert!(!vault.executed, EAlreadyExecuted);
        assert!(vault.executing, ENotExecuting);
        assert!(vault.executing_executor == ctx.sender(), EWrongExecutor);
        assert!(executor == ctx.sender(), EWrongExecutor);

        vault.executed = true;
        vault.executing = false;
        vault.executing_executor = @0x0;

        transfer::public_transfer(nft, vault.beneficiary);

        if (vault.protocol_fee_mist > 0) {
            let fee_balance = balance::split(&mut vault.escrowed, vault.protocol_fee_mist);
            let fee_coin = coin::from_balance(fee_balance, ctx);
            transfer::public_transfer(fee_coin, vault.protocol_fee_recipient);
        };

        let reward_balance = balance::split(&mut vault.escrowed, vault.executor_reward_mist);
        let reward = coin::from_balance(reward_balance, ctx);
        transfer::public_transfer(reward, ctx.sender());

        if (balance::value(&vault.escrowed) > 0) {
            let refund = coin::from_balance(balance::withdraw_all(&mut vault.escrowed), ctx);
            transfer::public_transfer(refund, vault.creator);
        };

        event::emit(VaultExecuted {
            vault_id,
            executor: ctx.sender(),
            beneficiary: vault.beneficiary,
            registration_budget_mist: vault.registration_budget_mist,
            executor_reward_mist: vault.executor_reward_mist,
            protocol_fee_mist: vault.protocol_fee_mist,
            protocol_fee_recipient: vault.protocol_fee_recipient,
            executed_at_ms: clock.timestamp_ms(),
        });
    }

    public fun cancel_vault<CoinType>(vault: GraceRegistrationVault<CoinType>, ctx: &mut TxContext) {
        let GraceRegistrationVault {
            id,
            name: _,
            beneficiary: _,
            creator,
            expired_at_ms: _,
            years: _,
            registration_budget_mist: _,
            executor_reward_mist: _,
            protocol_fee_mist: _,
            protocol_fee_recipient: _,
            escrowed,
            executing,
            executing_executor: _,
            executed,
            created_at_ms: _,
        } = vault;

        assert!(creator == ctx.sender(), ENotCreator);
        assert!(!executed, EAlreadyExecuted);
        assert!(!executing, EExecutionInProgress);

        object::delete(id);

        let refund = coin::from_balance(escrowed, ctx);
        transfer::public_transfer(refund, creator);
    }

    public fun name<CoinType>(vault: &GraceRegistrationVault<CoinType>): &String {
        &vault.name
    }

    public fun beneficiary<CoinType>(vault: &GraceRegistrationVault<CoinType>): address {
        vault.beneficiary
    }

    public fun creator<CoinType>(vault: &GraceRegistrationVault<CoinType>): address {
        vault.creator
    }

    public fun expired_at_ms<CoinType>(vault: &GraceRegistrationVault<CoinType>): u64 {
        vault.expired_at_ms
    }

    public fun available_at_ms<CoinType>(vault: &GraceRegistrationVault<CoinType>): u64 {
        vault.expired_at_ms + GRACE_PERIOD_MS
    }

    public fun years<CoinType>(vault: &GraceRegistrationVault<CoinType>): u8 {
        vault.years
    }

    public fun funded_mist<CoinType>(vault: &GraceRegistrationVault<CoinType>): u64 {
        balance::value(&vault.escrowed)
    }

    public fun registration_budget_mist<CoinType>(vault: &GraceRegistrationVault<CoinType>): u64 {
        vault.registration_budget_mist
    }

    public fun executor_reward_mist<CoinType>(vault: &GraceRegistrationVault<CoinType>): u64 {
        vault.executor_reward_mist
    }

    public fun protocol_fee_mist<CoinType>(vault: &GraceRegistrationVault<CoinType>): u64 {
        vault.protocol_fee_mist
    }

    public fun protocol_fee_recipient<CoinType>(vault: &GraceRegistrationVault<CoinType>): address {
        vault.protocol_fee_recipient
    }

    public fun required_total_mist<CoinType>(vault: &GraceRegistrationVault<CoinType>): u64 {
        vault.registration_budget_mist + vault.executor_reward_mist + vault.protocol_fee_mist
    }

    public fun is_ready<CoinType>(vault: &GraceRegistrationVault<CoinType>, clock: &Clock): bool {
        !vault.executed
            && !vault.executing
            && clock.timestamp_ms() >= available_at_ms(vault)
            && funded_mist(vault) >= required_total_mist(vault)
    }

    public fun is_executed<CoinType>(vault: &GraceRegistrationVault<CoinType>): bool {
        vault.executed
    }

    public fun is_executing<CoinType>(vault: &GraceRegistrationVault<CoinType>): bool {
        vault.executing
    }
}
