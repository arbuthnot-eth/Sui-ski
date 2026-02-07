module black_diamond::watchlist;

use std::string::String;

public struct Watchlist has key, store {
    id: UID,
    names: vector<String>,
}

public struct Watched has copy, drop {
    watcher: address,
    name: String,
}

public struct Unwatched has copy, drop {
    watcher: address,
    name: String,
}

public fun create(ctx: &mut TxContext) {
    transfer::transfer(Watchlist {
        id: object::new(ctx),
        names: vector::empty(),
    }, ctx.sender());
}

public fun watch(watchlist: &mut Watchlist, name: String, ctx: &TxContext) {
    let mut i = 0;
    let len = watchlist.names.length();
    while (i < len) {
        if (&watchlist.names[i] == &name) return;
        i = i + 1;
    };
    watchlist.names.push_back(name);
    sui::event::emit(Watched { watcher: ctx.sender(), name });
}

public fun unwatch(watchlist: &mut Watchlist, name: String, ctx: &TxContext) {
    let mut i = 0;
    let len = watchlist.names.length();
    while (i < len) {
        if (&watchlist.names[i] == &name) {
            watchlist.names.remove(i);
            sui::event::emit(Unwatched { watcher: ctx.sender(), name });
            return
        };
        i = i + 1;
    };
}

public fun names(watchlist: &Watchlist): &vector<String> {
    &watchlist.names
}

public fun is_watching(watchlist: &Watchlist, name: &String): bool {
    watchlist.names.contains(name)
}
