import { describe, expect, it } from 'bun:test'
import { parseSubdomain, toSuiNSName } from './utils/subdomain'

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

	it('parses IPFS content subdomain', () => {
		const result = parseSubdomain('ipfs-QmTest123.sui.ski')
		expect(result.type).toBe('content')
		// Hostname is normalized to lowercase (DNS is case-insensitive)
		expect(result.subdomain).toBe('ipfs-qmtest123')
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
