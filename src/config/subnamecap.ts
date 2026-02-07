export const REFERENCE_SUBNAMECAP = {
	suinsPackageId: '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0',
	subdomainsPackageId: '0xe177697e191327901637f8d2c5ffbbde8b1aaac27ec1024c4b62d1ebd1cd7430',
	denylistPackageId: '',
	suinsObjectId: '0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871',
	adminCapId: '',
} as const

export const CLOCK_OBJECT = '0x6'

export const SUBNAME_CAP_ERRORS: Record<number, string> = {
	10: 'Leaf creation not allowed by this cap',
	11: 'Node creation not allowed by this cap',
	12: 'Parent domain not found in registry',
	13: 'Parent domain has expired',
	14: 'Cap is not active (revoked or surrendered)',
	15: 'Cap invalidated (parent domain was re-registered)',
	16: 'Cap usage limit reached',
	17: 'Cap duration limit exceeded',
	18: 'Cap expired',
}

export const JACKET_ERRORS: Record<string, Record<number, string>> = {
	fee_jacket: {
		0: 'Jacket is paused',
		1: 'Insufficient payment for fee',
		2: 'Not the jacket admin',
	},
	allowlist_jacket: {
		0: 'Jacket is paused',
		1: 'Address not in allowlist',
		2: 'Not the jacket admin',
	},
	rate_limit_jacket: {
		0: 'Jacket is paused',
		1: 'Rate limit exceeded for this window',
		2: 'Not the jacket admin',
	},
}
