/**
 * Tests for MVRResolver
 */

import { beforeEach, describe, expect, it } from 'bun:test'
import type { Env } from '../types'
import { MVRResolver } from './mvr-resolver'

// Mock environment
const createMockEnv = (network: 'mainnet' | 'testnet' = 'mainnet'): Env => ({
	SUI_NETWORK: network,
	SUI_RPC_URL:
		network === 'mainnet'
			? 'https://fullnode.mainnet.sui.io:443'
			: 'https://fullnode.testnet.sui.io:443',
	WALRUS_NETWORK: 'mainnet',
	CACHE: {} as never,
	MOVE_REGISTRY_PARENT_ID: '0x0e5d473a055b6b7d014af557a13ad9075157fdc19b6d51562a18511afd397727',
})

describe('MVRResolver', () => {
	let resolver: MVRResolver
	let env: Env

	beforeEach(() => {
		env = createMockEnv('mainnet')
		resolver = new MVRResolver(env)
	})

	describe('parsePackageName', () => {
		it('should parse @namespace/package format', () => {
			const parsed = resolver.parsePackageName('@myname/mypackage')
			expect(parsed).not.toBeNull()
			expect(parsed?.namespace).toBe('myname')
			expect(parsed?.packageName).toBe('mypackage')
			expect(parsed?.format).toBe('at-format')
			expect(parsed?.version).toBeUndefined()
		})

		it('should parse @namespace/package/version format', () => {
			const parsed = resolver.parsePackageName('@myname/mypackage/2')
			expect(parsed).not.toBeNull()
			expect(parsed?.namespace).toBe('myname')
			expect(parsed?.packageName).toBe('mypackage')
			expect(parsed?.version).toBe(2)
		})

		it('should parse namespace.sui/package format', () => {
			const parsed = resolver.parsePackageName('myname.sui/mypackage')
			expect(parsed).not.toBeNull()
			expect(parsed?.namespace).toBe('myname')
			expect(parsed?.packageName).toBe('mypackage')
			expect(parsed?.format).toBe('dot-format')
		})

		it('should parse namespace/package format', () => {
			const parsed = resolver.parsePackageName('myname/mypackage')
			expect(parsed).not.toBeNull()
			expect(parsed?.namespace).toBe('myname')
			expect(parsed?.packageName).toBe('mypackage')
			expect(parsed?.format).toBe('slash-format')
		})

		it('should reject invalid formats', () => {
			expect(resolver.parsePackageName('invalid')).toBeNull()
			expect(resolver.parsePackageName('@invalid')).toBeNull()
			expect(resolver.parsePackageName('invalid/')).toBeNull()
		})
	})

	describe('normalizePackageName', () => {
		it('should normalize to @namespace/package format', () => {
			expect(resolver.normalizePackageName('@myname/mypackage')).toBe('@myname/mypackage')
			expect(resolver.normalizePackageName('myname.sui/mypackage')).toBe('@myname/mypackage')
			expect(resolver.normalizePackageName('myname/mypackage')).toBe('@myname/mypackage')
		})

		it('should preserve version numbers', () => {
			expect(resolver.normalizePackageName('@myname/mypackage/2')).toBe('@myname/mypackage/2')
			expect(resolver.normalizePackageName('myname.sui/mypackage/3')).toBe('@myname/mypackage/3')
		})

		it('should return null for invalid names', () => {
			expect(resolver.normalizePackageName('invalid')).toBeNull()
		})
	})

	describe('cache management', () => {
		it('should clear cache', () => {
			resolver.clearCache()
			const stats = resolver.getCacheStats()
			expect(stats.size).toBe(0)
		})

		it('should clear expired cache entries', () => {
			resolver.clearExpiredCache()
			const stats = resolver.getCacheStats()
			expect(stats.size).toBe(0)
		})
	})
})
