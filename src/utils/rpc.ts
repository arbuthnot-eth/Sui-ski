import type { Env } from '../types'

const DEFAULT_RPC_URLS: Record<Env['SUI_NETWORK'], string> = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
	devnet: 'https://fullnode.devnet.sui.io:443',
}

export function getDefaultRpcUrl(network: Env['SUI_NETWORK']): string {
	return DEFAULT_RPC_URLS[network] || DEFAULT_RPC_URLS.mainnet
}

export function ensureRpcEnv(env: Env): Env {
	const configured = (env.SUI_RPC_URL ?? '').trim()
	if (configured) {
		if (configured === env.SUI_RPC_URL) {
			return env
		}
		return { ...env, SUI_RPC_URL: configured }
	}

	const fallback = getDefaultRpcUrl(env.SUI_NETWORK)
	console.warn(`[sui.ski] SUI_RPC_URL not configured. Falling back to public RPC ${fallback}`)
	return { ...env, SUI_RPC_URL: fallback }
}
