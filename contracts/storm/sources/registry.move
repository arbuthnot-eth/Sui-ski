module storm::registry {
    use sui::dynamic_field;
    use sui::event;

    public struct Registry has key {
        id: UID,
        owner: address,
        entry_count: u64,
    }

    public struct ChannelSet has copy, drop {
        nft_id: ID,
        channel_id: address,
        sender: address,
    }

    public struct ChannelCleared has copy, drop {
        nft_id: ID,
        sender: address,
    }

    fun init(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            entry_count: 0,
        };
        transfer::share_object(registry);
    }

    public fun set_channel_for_nft<T: key>(
        registry: &mut Registry,
        nft: &T,
        channel_id: address,
        ctx: &mut TxContext,
    ) {
        let nft_id = object::id(nft);
        if (dynamic_field::exists_(&registry.id, nft_id)) {
            let existing_channel_id: &mut address = dynamic_field::borrow_mut(&mut registry.id, nft_id);
            *existing_channel_id = channel_id;
        } else {
            dynamic_field::add(&mut registry.id, nft_id, channel_id);
            registry.entry_count = registry.entry_count + 1;
        };

        event::emit(ChannelSet {
            nft_id,
            channel_id,
            sender: tx_context::sender(ctx),
        });
    }

    public fun clear_channel_for_nft<T: key>(registry: &mut Registry, nft: &T, ctx: &mut TxContext) {
        let nft_id = object::id(nft);
        if (dynamic_field::exists_(&registry.id, nft_id)) {
            let _deleted: address = dynamic_field::remove(&mut registry.id, nft_id);
            if (registry.entry_count > 0) {
                registry.entry_count = registry.entry_count - 1;
            };
            event::emit(ChannelCleared {
                nft_id,
                sender: tx_context::sender(ctx),
            });
        };
    }

    public fun channel_for_nft_id(registry: &Registry, nft_id: ID): Option<address> {
        if (dynamic_field::exists_(&registry.id, nft_id)) {
            option::some(*dynamic_field::borrow(&registry.id, nft_id))
        } else {
            option::none()
        }
    }

    public fun owner(registry: &Registry): address {
        registry.owner
    }

    public fun entry_count(registry: &Registry): u64 {
        registry.entry_count
    }
}
