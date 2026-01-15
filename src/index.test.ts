import { describe, it, expect } from 'bun:test'
import { parseSubdomain, toSuiNSName, toMVRName } from './utils/subdomain'

describe('parseSubdomain', () => {
	it('parses root domain', () => {
		const result = parseSubdomain('sui.ski')
		expect(result.type).toBe('root')
		expect(result.subdomain).toBe('')
	})

	it('parses www as root', () => {
		const result = parseSubdomain('www.sui.ski')
		expect(result.type).toBe('root')
	})

	it('parses SuiNS name subdomain', () => {
		const result = parseSubdomain('myname.sui.ski')
		expect(result.type).toBe('suins')
		expect(result.subdomain).toBe('myname')
	})

	it('parses RPC subdomain', () => {
		const result = parseSubdomain('rpc.sui.ski')
		expect(result.type).toBe('rpc')
	})

	it('parses MVR package pattern', () => {
		const result = parseSubdomain('core--suifrens.sui.ski')
		expect(result.type).toBe('mvr')
		expect(result.subdomain).toBe('suifrens')
		expect(result.packageName).toBe('core')
		expect(result.version).toBeUndefined()
	})

	it('parses MVR package with version', () => {
		const result = parseSubdomain('nft--myname--v2.sui.ski')
		expect(result.type).toBe('mvr')
		expect(result.subdomain).toBe('myname')
		expect(result.packageName).toBe('nft')
		expect(result.version).toBe(2)
	})

	it('parses IPFS content subdomain', () => {
		const result = parseSubdomain('ipfs-QmTest123.sui.ski')
		expect(result.type).toBe('content')
		expect(result.subdomain).toBe('ipfs-QmTest123')
	})

	it('parses Walrus content subdomain', () => {
		const result = parseSubdomain('walrus-abc123.sui.ski')
		expect(result.type).toBe('content')
		expect(result.subdomain).toBe('walrus-abc123')
	})

	it('parses staging environment', () => {
		const result = parseSubdomain('myname.staging.sui.ski')
		expect(result.type).toBe('suins')
		expect(result.subdomain).toBe('myname')
	})
})

describe('toSuiNSName', () => {
	it('adds .sui suffix', () => {
		expect(toSuiNSName('myname')).toBe('myname.sui')
	})

	it('preserves existing .sui suffix', () => {
		expect(toSuiNSName('myname.sui')).toBe('myname.sui')
	})
})

describe('toMVRName', () => {
	it('creates MVR name without version', () => {
		expect(toMVRName('suifrens', 'core')).toBe('@suifrens/core')
	})

	it('creates MVR name with version', () => {
		expect(toMVRName('myname', 'nft', 2)).toBe('@myname/nft/2')
	})
})
