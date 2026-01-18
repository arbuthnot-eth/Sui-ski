/// Merkle Tree implementation for the Private protocol
///
/// Implements a sparse Merkle tree with:
/// - Height 26 (2^26 = ~67M leaves)
/// - Poseidon hash function
/// - Circular history of 100 roots for proof verification
module private::private_merkle_tree {
    use sui::poseidon::poseidon_bn254;
    use sui::table::{Self, Table};
    use private::private_constants;

    /// Merkle tree for storing commitments
    public struct MerkleTree has key, store {
        id: UID,
        /// Next insertion index (always even, pairs of leaves)
        next_index: u64,
        /// Subtree hashes at each level (length = tree height)
        subtrees: vector<u256>,
        /// Circular buffer of historical roots
        root_history: Table<u64, u256>,
        /// Current index in the circular root history
        root_index: u64,
    }

    /// Create a new empty Merkle tree
    public(package) fun new(ctx: &mut TxContext): MerkleTree {
        let empty_hashes = private_constants::empty_subtree_hashes!();
        let mut subtrees = vector::empty<u256>();
        let mut i = 0u64;
        let height = private_constants::max_tree_height!();

        // Initialize subtrees with empty hashes
        while (i < height) {
            vector::push_back(&mut subtrees, *vector::borrow(&empty_hashes, i));
            i = i + 1;
        };

        // Initialize root history with empty root
        let mut root_history = table::new<u64, u256>(ctx);
        table::add(&mut root_history, 0, *vector::borrow(&empty_hashes, height - 1));

        MerkleTree {
            id: object::new(ctx),
            next_index: 0,
            subtrees,
            root_history,
            root_index: 0,
        }
    }

    /// Append a pair of commitments to the tree
    ///
    /// The tree uses 2-input/2-output UTXO model, so commitments
    /// are always inserted in pairs.
    public(package) fun append_pair(
        tree: &mut MerkleTree,
        commitment1: u256,
        commitment2: u256,
    ): (u64, u64) {
        let height = private_constants::max_tree_height!();
        let max_capacity = 1u64 << (height as u8);

        // Check capacity
        assert!(tree.next_index + 2 <= max_capacity, private::private_errors::merkle_tree_overflow!());

        let index1 = tree.next_index;
        let index2 = tree.next_index + 1;

        // Hash the two leaves together for level 0
        let mut current_hash = poseidon2(commitment1, commitment2);

        // Propagate up the tree
        let mut level = 1u64;
        let mut current_index = index1 / 2;

        while (level < height) {
            let subtree_hash = *vector::borrow(&tree.subtrees, level);

            if (current_index % 2 == 0) {
                // Left child: store hash and wait for right sibling
                *vector::borrow_mut(&mut tree.subtrees, level) = current_hash;
                current_hash = poseidon2(current_hash, *vector::borrow(&private_constants::empty_subtree_hashes!(), level));
            } else {
                // Right child: combine with stored left sibling
                current_hash = poseidon2(subtree_hash, current_hash);
            };

            current_index = current_index / 2;
            level = level + 1;
        };

        // Update root history (circular buffer)
        tree.root_index = (tree.root_index + 1) % private_constants::max_root_history!();
        safe_history_add(&mut tree.root_history, tree.root_index, current_hash);

        // Advance next index
        tree.next_index = tree.next_index + 2;

        (index1, index2)
    }

    /// Get the current Merkle root
    public fun root(tree: &MerkleTree): u256 {
        *table::borrow(&tree.root_history, tree.root_index)
    }

    /// Get the next insertion index
    public fun next_index(tree: &MerkleTree): u64 {
        tree.next_index
    }

    /// Check if a root is in the history
    public fun is_known_root(tree: &MerkleTree, root: u256): bool {
        let max_history = private_constants::max_root_history!();
        let mut i = 0u64;

        while (i < max_history) {
            if (table::contains(&tree.root_history, i)) {
                let historical_root = *table::borrow(&tree.root_history, i);
                if (historical_root == root) {
                    return true
                }
            };
            i = i + 1;
        };

        false
    }

    /// Helper to add/update root in history table
    fun safe_history_add(history: &mut Table<u64, u256>, index: u64, root: u256) {
        if (table::contains(history, index)) {
            *table::borrow_mut(history, index) = root;
        } else {
            table::add(history, index, root);
        }
    }

    /// Poseidon hash of two field elements
    fun poseidon2(left: u256, right: u256): u256 {
        let mut inputs = vector::empty<u256>();
        vector::push_back(&mut inputs, left);
        vector::push_back(&mut inputs, right);
        poseidon_bn254(&inputs)
    }

    #[test_only]
    public fun new_for_testing(ctx: &mut TxContext): MerkleTree {
        new(ctx)
    }
}
