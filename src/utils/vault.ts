export interface VaultBookmark {
	name: string
	address: string
	addedAt: number
}

export interface VaultData {
	bookmarks: VaultBookmark[]
	ownerAddress: string
	version: number
	updatedAt: number
}

export interface VaultMeta {
	version: number
	updatedAt: number
	count: number
}

export const VAULT_MAX_BOOKMARKS = 100
export const VAULT_BLOB_MAX_BYTES = 512 * 1024
export const VAULT_TTL_SECONDS = 365 * 24 * 60 * 60

export function vaultKey(address: string): string {
	return `vault_${address}`
}

export function vaultMetaKey(address: string): string {
	return `vault_meta_${address}`
}
