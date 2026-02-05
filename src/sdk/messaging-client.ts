/**
 * Sui Stack Messaging SDK Client
 *
 * A framework-agnostic client library for sending and receiving encrypted messages
 * using the Sui Stack (Sui + Walrus + Seal).
 *
 * Features:
 * - End-to-end encryption with Seal protocol
 * - SuiNS name resolution (@user.sui)
 * - Wallet signature verification
 * - Decentralized storage on Walrus
 * - Framework-agnostic (no DOM dependencies)
 */

import { fromHex } from '@mysten/bcs'
import { SealClient, SessionKey } from '@mysten/seal'
import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import type { Signer } from '@mysten/sui/cryptography'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient } from '@mysten/suins'
import type { SealEncryptedEnvelope } from '../types'

// ========== Types ==========

/**
 * Wallet signer interface for message signing
 */
export interface WalletSigner {
	/** Get the wallet address */
	getAddress(): Promise<string>
	/** Sign a personal message */
	signPersonalMessage(message: Uint8Array): Promise<{ signature: string; bytes?: Uint8Array }>
	/** Get the primary SuiNS name (optional) */
	getPrimaryName?(): Promise<string | null>
}

/**
 * SuiNS name resolver interface
 */
export interface SuiNSResolver {
	/** Resolve a SuiNS name to an address */
	resolveAddress(nameOrAddress: string): Promise<string | null>
}

/**
 * Message data structure
 */
export interface MessageData {
	from: string
	fromName: string | null
	to: string
	toName: string
	content: string
	timestamp: number
	nonce: string
	signature?: string
	signaturePayload?: string
}

/**
 * Encrypted message envelope
 */
export interface EncryptedMessage {
	encrypted: string
	sealPolicy: {
		type: 'seal'
		address: string
		packageId: string
		policyId: string
	}
	version: number
}

/**
 * Message send result
 */
export interface SendMessageResult {
	id: string
	blobId?: string
	timestamp: number
	encrypted: boolean
	status: 'sent'
}

/**
 * Seal configuration
 */
export interface SealConfig {
	packageId: string
	keyServers: string[]
	rpcUrl?: string
	approveTarget?: string
	threshold?: number
}

/**
 * Messaging client configuration
 */
export interface MessagingClientConfig {
	/** Wallet signer for authentication and signing */
	signer: WalletSigner
	/** SuiNS resolver for name resolution */
	suinsResolver?: SuiNSResolver
	/** Seal encryption configuration */
	sealConfig: SealConfig
	/** API endpoint for sending messages (defaults to /api/app/messages/send) */
	apiEndpoint?: string
	/** Sui RPC URL (for Seal operations) */
	suiRpcUrl?: string
	/** Network (mainnet/testnet) */
	network?: 'mainnet' | 'testnet'
}

// ========== Default Seal Configuration ==========

/**
 * Default testnet Seal configuration (open mode servers)
 */
export const DEFAULT_SEAL_TESTNET_CONFIG: SealConfig = {
	packageId: '0x8afa5d31dbaa0a8fb07082692940ca3d56b5e856c5126cb5a3693f0a4de63b82',
	keyServers: [
		'0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', // Mysten Labs #1
		'0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', // Mysten Labs #2
		'0x4cded1abeb52a22b6becb42a91d3686a4c901cf52eee16234214d0b5b2da4c46', // Triton One
	],
	rpcUrl: 'https://fullnode.testnet.sui.io:443',
	threshold: 2,
}

// ========== MessagingClient Class ==========

/**
 * Messaging client for Sui Stack messaging
 */
export class MessagingClient {
	private signer: WalletSigner
	private suinsResolver?: SuiNSResolver
	private sealConfig: SealConfig
	private apiEndpoint: string
	private sealClient: SealClient | null = null
	private sessionKey: SessionKey | null = null
	private sealSuiClient: SuiClient | null = null
	private suiClient: SuiClient | null = null

	constructor(config: MessagingClientConfig) {
		this.signer = config.signer
		this.suinsResolver = config.suinsResolver
		this.sealConfig = config.sealConfig
		this.apiEndpoint = config.apiEndpoint || '/api/app/messages/send'

		// Initialize Sui clients
		const network = config.network || 'testnet'
		if (config.suiRpcUrl) {
			this.suiClient = new SuiClient({ url: config.suiRpcUrl, network })
		}

		const sealRpcUrl = config.sealConfig.rpcUrl || DEFAULT_SEAL_TESTNET_CONFIG.rpcUrl
		if (sealRpcUrl) {
			this.sealSuiClient = new SuiClient({ url: sealRpcUrl, network })
		}
	}

	/**
	 * Initialize Seal client for encryption/decryption
	 */
	async initSealClient(): Promise<SealClient | null> {
		if (this.sealClient) return this.sealClient

		try {
			if (!this.sealSuiClient) {
				throw new Error('Seal RPC URL not configured')
			}

			this.sealClient = new SealClient({
				suiClient: this.sealSuiClient,
				serverConfigs: this.sealConfig.keyServers.map((id) => ({ objectId: id, weight: 1 })),
				verifyKeyServers: false, // Skip verification for trusted providers
			})

			return this.sealClient
		} catch (error) {
			console.error('Failed to init SealClient:', error)
			return null
		}
	}

	/**
	 * Create a session key for decryption (proves wallet ownership)
	 */
	async createSessionKey(): Promise<SessionKey | null> {
		if (this.sessionKey) return this.sessionKey

		const sealClient = await this.initSealClient()
		if (!sealClient) {
			console.warn('SealClient not available')
			return null
		}

		if (!this.sealConfig.packageId) {
			console.warn('No Seal package ID configured')
			return null
		}

		try {
			if (!this.sealSuiClient) {
				throw new Error('Seal RPC URL not configured')
			}

			const address = await this.signer.getAddress()
			const packageId = this.sealConfig.packageId

			// Create a custom signer that uses the wallet
			// SessionKey.create expects a Signer, but we only need signPersonalMessage
			const walletSigner = {
				getPublicKey: async () => {
					return { toSuiBytes: () => new Uint8Array(32) }
				},
				signPersonalMessage: async (message: Uint8Array) => {
					const result = await this.signer.signPersonalMessage(message)
					return { signature: result.signature }
				},
				// Stub methods required by Signer interface (not used by SessionKey)
				sign: async () => ({ signature: new Uint8Array(64) }),
				signWithIntent: async () => ({ signature: new Uint8Array(64) }),
				signTransaction: async () => ({ signature: new Uint8Array(64) }),
				signAndExecuteTransaction: async () => ({ digest: '' }),
				toSuiAddress: () => address,
			} as unknown as Signer

			this.sessionKey = await SessionKey.create({
				address,
				packageId,
				ttlMin: 30,
				suiClient: this.sealSuiClient,
				signer: walletSigner,
			})

			return this.sessionKey
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			console.error('Failed to create session key:', message)
			return null
		}
	}

	/**
	 * Hash content for signature (SHA-256)
	 */
	async hashContent(content: string): Promise<string> {
		const encoder = new TextEncoder()
		const data = encoder.encode(content)
		const hashBuffer = await crypto.subtle.digest('SHA-256', data)
		const hashArray = Array.from(new Uint8Array(hashBuffer))
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
	}

	/**
	 * Resolve recipient address from name or address
	 */
	async resolveRecipient(recipientNameOrAddress: string): Promise<string> {
		// If already an address, return it
		if (recipientNameOrAddress.startsWith('0x') && recipientNameOrAddress.length >= 66) {
			return recipientNameOrAddress
		}

		// Use custom resolver if provided
		if (this.suinsResolver) {
			const address = await this.suinsResolver.resolveAddress(recipientNameOrAddress)
			if (address) return address
		}

		// Fallback: try to resolve using SuinsClient
		if (this.suiClient) {
			try {
				const suinsClient = new SuinsClient({
					client: this.suiClient as never,
					network: 'testnet', // Default to testnet, should be configurable
				})

				const name = recipientNameOrAddress.replace(/^@/, '').replace(/\.sui$/i, '') + '.sui'
				const record = await suinsClient.getNameRecord(name)
				if (record?.targetAddress) {
					return record.targetAddress
				}
			} catch (error) {
				console.error('Failed to resolve SuiNS name:', error)
			}
		}

		throw new Error(`Could not resolve recipient address for ${recipientNameOrAddress}`)
	}

	/**
	 * Encrypt message for recipient using Seal
	 */
	async encryptForRecipient(
		message: MessageData,
		recipientAddress: string,
	): Promise<EncryptedMessage | null> {
		const sealClient = await this.initSealClient()
		if (!sealClient) {
			throw new Error('Seal client not initialized')
		}

		if (!this.sealConfig.packageId) {
			throw new Error('Seal package ID not configured')
		}

		try {
			const packageId = this.sealConfig.packageId
			const data = JSON.stringify(message)
			const plaintext = new TextEncoder().encode(data)
			const policyId = recipientAddress.startsWith('0x')
				? recipientAddress.slice(2)
				: recipientAddress

			const threshold = this.sealConfig.threshold || 2

			const packageIdHex = packageId.startsWith('0x') ? packageId.slice(2) : packageId
			const policyIdHex = policyId.startsWith('0x') ? policyId.slice(2) : policyId

			// fromHex returns Uint8Array, which is what encrypt expects
			const { encryptedObject } = await sealClient.encrypt({
				threshold,
				packageId: fromHex(packageIdHex) as unknown as string,
				id: fromHex(policyIdHex) as unknown as string,
				data: plaintext,
			})

			// encryptedObject.data is a Uint8Array - convert to base64
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const encryptedData = (encryptedObject as any).data as Uint8Array
			const ciphertextArray = Array.from(encryptedData)
			const ciphertext = btoa(String.fromCharCode.apply(null, ciphertextArray))

			return {
				encrypted: ciphertext,
				sealPolicy: {
					type: 'seal',
					address: recipientAddress,
					packageId: packageId,
					policyId: recipientAddress,
				},
				version: 1,
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			console.error('Seal encryption failed:', error)
			throw new Error('Encryption failed: ' + message)
		}
	}

	/**
	 * Decrypt a message using Seal SDK
	 */
	async decryptWithSeal(
		encryptedEnvelope: SealEncryptedEnvelope,
		recipientAddress: string,
	): Promise<MessageData | null> {
		const sealClient = await this.initSealClient()
		if (!sealClient) {
			console.warn('SealClient not available')
			return null
		}

		const sessionKey = await this.createSessionKey()
		if (!sessionKey) {
			console.warn('Session key not available')
			return null
		}

		if (!this.sealConfig.approveTarget) {
			console.warn('No seal_approve target configured')
			return null
		}

		if (!this.suiClient) {
			throw new Error('Sui RPC URL not configured for decryption')
		}

		try {
			const policyId = encryptedEnvelope.policy?.policyId || recipientAddress

			const tx = new Transaction()
			tx.moveCall({
				target: this.sealConfig.approveTarget,
				arguments: [
					tx.pure.vector('u8', fromHex(policyId.startsWith('0x') ? policyId.slice(2) : policyId)),
				],
			})

			const txBytes = await tx.build({ client: this.suiClient, onlyTransactionKind: true })

			const ciphertext: Uint8Array =
				typeof encryptedEnvelope.ciphertext === 'string'
					? new Uint8Array(
							atob(encryptedEnvelope.ciphertext)
								.split('')
								.map((c) => c.charCodeAt(0)),
						)
					: (encryptedEnvelope.ciphertext as Uint8Array)

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const decrypted = await sealClient.decrypt({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				data: { data: ciphertext, id: policyId } as any,
				sessionKey: sessionKey,
				txBytes,
			})

			const decoder = new TextDecoder()
			const decryptedText = decoder.decode(decrypted)
			return JSON.parse(decryptedText) as MessageData
		} catch (error) {
			console.error('Seal decryption failed:', error)
			return null
		}
	}

	/**
	 * Send a message to a recipient
	 */
	async sendMessage(recipientNameOrAddress: string, content: string): Promise<SendMessageResult> {
		if (!content || typeof content !== 'string' || content.trim().length === 0) {
			throw new Error('Message content is required')
		}

		if (content.length > 1000) {
			throw new Error('Message too long (max 1000 characters)')
		}

		// Resolve recipient address
		const recipientAddr = await this.resolveRecipient(recipientNameOrAddress)
		const senderAddr = await this.signer.getAddress()
		const senderName = (await this.signer.getPrimaryName?.()) || null

		const timestamp = Date.now()
		const nonce = crypto.randomUUID()

		const messageData: MessageData = {
			from: senderAddr,
			fromName: senderName,
			to: recipientAddr,
			toName: recipientNameOrAddress.replace(/^@/, '').replace(/\.sui$/i, ''),
			content: content.trim(),
			timestamp,
			nonce,
		}

		// Create signature payload
		const contentHash = await this.hashContent(content)
		const signaturePayload = JSON.stringify({
			type: 'sui_ski_message',
			version: 1,
			from: senderAddr,
			to: recipientAddr,
			contentHash: contentHash,
			timestamp: timestamp,
			nonce: nonce,
		})

		// Sign with wallet
		const messageBytes = new TextEncoder().encode(signaturePayload)
		const signResult = await this.signer.signPersonalMessage(messageBytes)
		const signature = signResult.signature

		messageData.signature = signature
		messageData.signaturePayload = signaturePayload

		// Encrypt message
		const encrypted = await this.encryptForRecipient(messageData, recipientAddr)

		if (!encrypted) {
			throw new Error('Failed to encrypt message')
		}

		// Send to API
		const requestBody = {
			encryptedMessage: encrypted,
			sender: senderAddr,
			senderName: senderName,
			recipient: recipientAddr,
			recipientName: messageData.toName,
			signature: signature,
			signaturePayload: signaturePayload,
			timestamp: timestamp,
			nonce: nonce,
			contentHash: contentHash,
		}

		const response = await fetch(this.apiEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
		})

		if (!response.ok) {
			const errorData = (await response.json().catch(() => ({ error: 'Unknown error' }))) as {
				error?: string
			}
			throw new Error(errorData.error || 'Failed to send message')
		}

		const result = (await response.json()) as { messageId?: string; blobId?: string }

		return {
			id: result.messageId || result.blobId || nonce,
			blobId: result.blobId,
			timestamp,
			encrypted: true,
			status: 'sent',
		}
	}

	/**
	 * Fetch messages for an address (inbox)
	 */
	async fetchMessages(address: string, apiEndpoint?: string): Promise<MessageData[]> {
		const endpoint = apiEndpoint || '/api/app/messages/inbox'
		try {
			const response = await fetch(`${endpoint}?address=${encodeURIComponent(address)}`)
			if (!response.ok) {
				console.error('Failed to fetch inbox:', response.status)
				return []
			}
			const data = (await response.json()) as { messages?: unknown[] }
			return (data.messages || []).map((msg: unknown) => {
				// Transform stored message format to MessageData if needed
				if (typeof msg === 'object' && msg !== null) {
					const m = msg as Record<string, unknown>
					return {
						from: (m.from || m.sender || '') as string,
						fromName: (m.fromName || m.senderName || null) as string | null,
						to: (m.to || m.recipient || '') as string,
						toName: (m.toName || m.recipientName || '') as string,
						content: (m.content || '') as string,
						timestamp: (m.timestamp || Date.now()) as number,
						nonce: (m.nonce || m.id || '') as string,
					} as MessageData
				}
				return msg as MessageData
			})
		} catch (err) {
			console.error('Failed to fetch messages:', err)
			return []
		}
	}

	/**
	 * Load conversations for an address
	 */
	async loadConversations(address: string, apiEndpoint?: string): Promise<unknown[]> {
		const endpoint = apiEndpoint || '/api/app/conversations'
		try {
			const response = await fetch(`${endpoint}?address=${encodeURIComponent(address)}`)
			if (!response.ok) {
				throw new Error('Failed to fetch conversations')
			}
			const data = (await response.json()) as { conversations?: unknown[] }
			return data.conversations || []
		} catch (error) {
			console.error('Failed to load conversations:', error)
			return []
		}
	}
}

// ========== Helper Functions ==========

/**
 * Create a default SuiNS resolver using SuinsClient
 */
export function createDefaultSuiNSResolver(
	suiRpcUrl: string,
	network: 'mainnet' | 'testnet' = 'testnet',
): SuiNSResolver {
	const suiClient = new SuiClient({ url: suiRpcUrl, network })
	const suinsClient = new SuinsClient({
		client: suiClient as never,
		network,
	})

	return {
		async resolveAddress(nameOrAddress: string): Promise<string | null> {
			// If already an address, return it
			if (nameOrAddress.startsWith('0x') && nameOrAddress.length >= 66) {
				return nameOrAddress
			}

			try {
				const name = nameOrAddress.replace(/^@/, '').replace(/\.sui$/i, '') + '.sui'
				const record = await suinsClient.getNameRecord(name)
				return record?.targetAddress || null
			} catch (error) {
				console.error(`Failed to resolve SuiNS name ${nameOrAddress}:`, error)
				return null
			}
		},
	}
}
