/// External data structures for the Private protocol
///
/// Contains the ExtData struct used to pass transaction metadata
/// alongside ZK proofs for deposit and withdrawal operations.
module private::private_ext_data {

    /// External data accompanying a private transaction
    ///
    /// This struct contains the non-ZK public inputs that are
    /// verified alongside the cryptographic proof.
    public struct ExtData has copy, drop, store {
        /// Recipient address for withdrawal (0 for deposits)
        recipient: address,
        /// Amount being deposited/withdrawn (net of fees)
        amount: u64,
        /// Relayer address (receives fee for processing)
        relayer: address,
        /// Fee paid to relayer in basis points
        relayer_fee: u64,
        /// Encrypted output data for recipient
        encrypted_output1: vector<u8>,
        /// Encrypted output data for change
        encrypted_output2: vector<u8>,
    }

    /// Create new external data for a transaction
    public fun new(
        recipient: address,
        amount: u64,
        relayer: address,
        relayer_fee: u64,
        encrypted_output1: vector<u8>,
        encrypted_output2: vector<u8>,
    ): ExtData {
        ExtData {
            recipient,
            amount,
            relayer,
            relayer_fee,
            encrypted_output1,
            encrypted_output2,
        }
    }

    /// Get the recipient address
    public fun recipient(ext_data: &ExtData): address {
        ext_data.recipient
    }

    /// Get the transaction amount
    public fun amount(ext_data: &ExtData): u64 {
        ext_data.amount
    }

    /// Get the relayer address
    public fun relayer(ext_data: &ExtData): address {
        ext_data.relayer
    }

    /// Get the relayer fee
    public fun relayer_fee(ext_data: &ExtData): u64 {
        ext_data.relayer_fee
    }

    /// Get the first encrypted output
    public fun encrypted_output1(ext_data: &ExtData): vector<u8> {
        ext_data.encrypted_output1
    }

    /// Get the second encrypted output
    public fun encrypted_output2(ext_data: &ExtData): vector<u8> {
        ext_data.encrypted_output2
    }

    /// Calculate total amount including relayer fee
    public fun total_amount(ext_data: &ExtData): u64 {
        ext_data.amount + ext_data.relayer_fee
    }
}
