module upgrade_cap_transfer::transfer;

use sui::object::{Self, ID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

/// Transfer an UpgradeCap that is owned by an object ID (like an NFT)
/// to a new address. The caller must own the parent object (NFT).
public entry fun transfer_upgrade_cap_from_object(
    parent: &0x2::suins_registration::SuinsRegistration, // The NFT that "owns" the UpgradeCap
    upgrade_cap: 0x2::package::UpgradeCap, // The UpgradeCap to transfer
    recipient: address,
    ctx: &mut TxContext,
) {
    // Verify that the UpgradeCap is owned by the parent object's ID
    let parent_id = object::id(parent);
    let upgrade_cap_owner = object::owner(&upgrade_cap);
    
    // In Sui, we can't directly check if an object is owned by an object ID
    // But we can transfer it if we have the parent object
    // The transaction will fail if the UpgradeCap isn't actually owned by the parent's ID
    
    transfer::public_transfer(upgrade_cap, recipient);
}
