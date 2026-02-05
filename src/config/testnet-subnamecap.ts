export const TESTNET_SUBNAMECAP = {
	suinsPackageId: '0xcb63193327801b8a90aa3778a6c50def5d2be3aac0630393d3329346cee58eaf',
	subdomainsPackageId: '0xd96a273f5f7ac23c7f4c2ce3d52138aae0e9a8f783cfb9f4c62fb4bfa2f9341c',
	denylistPackageId: '0xa3b744eda8cc89dab49a24c6436634b8876d68e81d997170eb577735984d52dc',
	suinsObjectId: '0x2abb88c1cdecdd3e8a33043e73bb12a7d1f2b35b787f33a26e851c1c43f9958d',
	adminCapId: '0x9805de1ad8ddff07da200a34dc90777afc640ab55f2c652e3e5c84a1138d40c4',
} as const

export const CLOCK_OBJECT = '0x6'

export const SUBNAME_CAP_ERRORS: Record<number, string> = {
	10: 'Leaf creation not allowed by this cap',
	11: 'Node creation not allowed by this cap',
	12: 'Parent domain not found in registry',
	13: 'Parent domain has expired',
	14: 'Cap is not active (revoked or surrendered)',
	15: 'Cap invalidated (parent domain was re-registered)',
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
