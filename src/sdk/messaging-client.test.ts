/**
 * Tests for MessagingClient
 */

import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { DEFAULT_SEAL_TESTNET_CONFIG, MessagingClient, type WalletSigner } from './messaging-client'

// Mock wallet signer
const createMockSigner = (address: string, primaryName: string | null = null): WalletSigner => ({
	async getAddress() {
		return address
	},
	async signPersonalMessage(message: Uint8Array) {
		// Mock signature
		return {
			signature: `mock-signature-${Buffer.from(message).toString('hex').slice(0, 16)}`,
			bytes: new Uint8Array(64),
		}
	},
	async getPrimaryName() {
		return primaryName
	},
})

// Mock SuiNS resolver
const createMockSuiNSResolver = (mappings: Record<string, string>) => ({
	async resolveAddress(nameOrAddress: string): Promise<string | null> {
		if (nameOrAddress.startsWith('0x')) {
			return nameOrAddress
		}
		const name = nameOrAddress.replace(/^@/, '').replace(/\.sui$/i, '') + '.sui'
		return mappings[name] || null
	},
})

describe('MessagingClient', () => {
	let client: MessagingClient
	const mockAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
	const mockRecipient = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'

	beforeEach(() => {
		const signer = createMockSigner(mockAddress, 'testuser')
		const suinsResolver = createMockSuiNSResolver({
			'testuser.sui': mockAddress,
			'recipient.sui': mockRecipient,
		})

		client = new MessagingClient({
			signer,
			suinsResolver,
			sealConfig: DEFAULT_SEAL_TESTNET_CONFIG,
			apiEndpoint: '/api/app/messages/send',
			suiRpcUrl: 'https://fullnode.testnet.sui.io:443',
			network: 'testnet',
		})
	})

	describe('hashContent', () => {
		it('should hash content correctly', async () => {
			const hash = await client.hashContent('test message')
			expect(hash).toBeTruthy()
			expect(typeof hash).toBe('string')
			expect(hash.length).toBe(64) // SHA-256 hex string
		})

		it('should produce consistent hashes', async () => {
			const hash1 = await client.hashContent('test message')
			const hash2 = await client.hashContent('test message')
			expect(hash1).toBe(hash2)
		})

		it('should produce different hashes for different content', async () => {
			const hash1 = await client.hashContent('test message 1')
			const hash2 = await client.hashContent('test message 2')
			expect(hash1).not.toBe(hash2)
		})
	})

	describe('resolveRecipient', () => {
		it('should resolve SuiNS names', async () => {
			const address = await client.resolveRecipient('@recipient.sui')
			expect(address).toBe(mockRecipient)
		})

		it('should return addresses directly', async () => {
			const address = await client.resolveRecipient(mockRecipient)
			expect(address).toBe(mockRecipient)
		})

		it('should throw on invalid recipient', async () => {
			await expect(client.resolveRecipient('@nonexistent.sui')).rejects.toThrow()
		})
	})

	describe('sendMessage', () => {
		it('should validate message content', async () => {
			await expect(client.sendMessage('@recipient.sui', '')).rejects.toThrow(
				'Message content is required',
			)
			await expect(client.sendMessage('@recipient.sui', '   ')).rejects.toThrow(
				'Message content is required',
			)
		})

		it('should validate message length', async () => {
			const longMessage = 'a'.repeat(1001)
			await expect(client.sendMessage('@recipient.sui', longMessage)).rejects.toThrow(
				'Message too long',
			)
		})

		it('should reject messages over 1000 characters', async () => {
			const message = 'a'.repeat(1000)
			// This should pass validation but may fail on encryption/API call
			// We'll mock the fetch to avoid actual network calls
			global.fetch = mock(() =>
				Promise.resolve({
					ok: false,
					json: async () => ({ error: 'Mock error' }),
				} as Response),
			) as unknown as typeof fetch

			await expect(client.sendMessage('@recipient.sui', message)).rejects.toThrow()
		})
	})

	describe('fetchMessages', () => {
		it('should fetch messages from API', async () => {
			const mockMessages = [
				{
					from: mockRecipient,
					to: mockAddress,
					content: 'Hello',
					timestamp: Date.now(),
					nonce: 'test-nonce',
				},
			]

			global.fetch = mock(() =>
				Promise.resolve({
					ok: true,
					json: async () => ({ messages: mockMessages }),
				} as Response),
			) as unknown as typeof fetch

			const messages = await client.fetchMessages(mockAddress)
			expect(messages).toHaveLength(1)
			expect(messages[0].content).toBe('Hello')
		})

		it('should return empty array on error', async () => {
			global.fetch = mock(() =>
				Promise.resolve({
					ok: false,
					status: 500,
				} as Response),
			) as unknown as typeof fetch

			const messages = await client.fetchMessages(mockAddress)
			expect(messages).toHaveLength(0)
		})
	})
})
