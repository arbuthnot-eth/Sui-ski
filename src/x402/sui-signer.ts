import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'

export class SuiSigner {
	readonly #keypair: Ed25519Keypair
	readonly address: string

	constructor(privateKeyBase64: string) {
		this.#keypair = Ed25519Keypair.fromSecretKey(privateKeyBase64)
		this.address = this.#keypair.getPublicKey().toSuiAddress()
	}

	async signTransaction(txBytes: Uint8Array): Promise<string> {
		const { signature } = await this.#keypair.signTransaction(txBytes)
		return signature
	}

	getAddresses(): string[] {
		return [this.address]
	}
}
