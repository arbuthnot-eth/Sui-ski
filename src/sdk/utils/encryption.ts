/**
 * Note Encryption Utilities
 *
 * Encrypts/decrypts note data using ECIES (Elliptic Curve Integrated Encryption Scheme)
 * so recipients can scan the blockchain for their notes.
 */

// Note: This is a simplified implementation. In production, use a proper crypto library.

/**
 * Encrypt note data for a recipient
 *
 * @param note - Note data to encrypt
 * @param recipientPubKey - Recipient's public key (hex string)
 * @returns Encrypted note data
 */
export async function encryptNote(
	note: {
		amount: bigint
		blinding: bigint
		secret?: bigint
	},
	recipientPubKey?: string,
): Promise<Uint8Array> {
	// Serialize note data
	const noteData = serializeNote(note)

	if (!recipientPubKey) {
		// No encryption - just return serialized data
		// This is for self-notes or when privacy isn't needed
		return noteData
	}

	// In production, use proper ECIES encryption
	// For now, we'll use a simple XOR cipher (NOT secure - for demo only)
	const keyBytes = hexToBytes(recipientPubKey).slice(0, 32)
	const encrypted = new Uint8Array(noteData.length)

	for (let i = 0; i < noteData.length; i++) {
		encrypted[i] = noteData[i] ^ keyBytes[i % keyBytes.length]
	}

	return encrypted
}

/**
 * Decrypt note data
 *
 * @param encryptedData - Encrypted note data
 * @param privateKey - Recipient's private key (hex string)
 * @returns Decrypted note data
 */
export async function decryptNote(
	encryptedData: Uint8Array,
	privateKey?: string,
): Promise<{
	amount: bigint
	blinding: bigint
	secret?: bigint
}> {
	let noteData: Uint8Array

	if (!privateKey) {
		// No decryption needed
		noteData = encryptedData
	} else {
		// Decrypt using private key
		// In production, use proper ECIES decryption
		const keyBytes = hexToBytes(privateKey).slice(0, 32)
		noteData = new Uint8Array(encryptedData.length)

		for (let i = 0; i < encryptedData.length; i++) {
			noteData[i] = encryptedData[i] ^ keyBytes[i % keyBytes.length]
		}
	}

	return deserializeNote(noteData)
}

/**
 * Serialize note to bytes
 */
function serializeNote(note: { amount: bigint; blinding: bigint; secret?: bigint }): Uint8Array {
	const buffer = new Uint8Array(96) // 3 * 32 bytes

	// Amount (32 bytes, big-endian)
	writeBigInt(buffer, 0, note.amount)

	// Blinding (32 bytes, big-endian)
	writeBigInt(buffer, 32, note.blinding)

	// Secret (32 bytes, big-endian)
	writeBigInt(buffer, 64, note.secret || 0n)

	return buffer
}

/**
 * Deserialize note from bytes
 */
function deserializeNote(data: Uint8Array): {
	amount: bigint
	blinding: bigint
	secret?: bigint
} {
	if (data.length < 64) {
		throw new Error('Invalid note data length')
	}

	return {
		amount: readBigInt(data, 0),
		blinding: readBigInt(data, 32),
		secret: data.length >= 96 ? readBigInt(data, 64) : undefined,
	}
}

/**
 * Write bigint to buffer (big-endian)
 */
function writeBigInt(buffer: Uint8Array, offset: number, value: bigint): void {
	for (let i = 31; i >= 0; i--) {
		buffer[offset + (31 - i)] = Number((value >> BigInt(i * 8)) & 0xffn)
	}
}

/**
 * Read bigint from buffer (big-endian)
 */
function readBigInt(buffer: Uint8Array, offset: number): bigint {
	let value = 0n
	for (let i = 0; i < 32; i++) {
		value = (value << 8n) | BigInt(buffer[offset + i])
	}
	return value
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
	const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex
	const bytes = new Uint8Array(cleanHex.length / 2)

	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16)
	}

	return bytes
}

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

/**
 * Generate a random encryption keypair
 *
 * In production, use Web Crypto API or a proper library
 */
export async function generateKeypair(): Promise<{
	publicKey: string
	privateKey: string
}> {
	// Generate 32 random bytes for private key
	const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32))
	const privateKey = bytesToHex(privateKeyBytes)

	// In production, derive public key from private key using curve math
	// For demo, we'll just hash the private key
	const publicKeyBytes = crypto.getRandomValues(new Uint8Array(32))
	const publicKey = bytesToHex(publicKeyBytes)

	return { publicKey, privateKey }
}

/**
 * Derive public key from private key
 *
 * In production, use proper curve multiplication
 */
export function derivePublicKey(_privateKey: string): string {
	// Placeholder - in production use curve math
	const bytes = crypto.getRandomValues(new Uint8Array(32))
	return bytesToHex(bytes)
}
