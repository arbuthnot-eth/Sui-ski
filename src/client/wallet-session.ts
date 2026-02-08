export interface WalletSessionClient {
	connect(address: string): Promise<{ sessionId: string; address: string }>
	check(): Promise<{ address: string | null }>
	disconnect(): Promise<{ success: boolean }>
}

export function createWalletSessionClient(baseUrl = ''): WalletSessionClient {
	return {
		async connect(address: string) {
			const response = await fetch(`${baseUrl}/api/wallet/connect`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ address }),
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error(`Failed to connect wallet: ${response.statusText}`)
			}

			return response.json()
		},

		async check() {
			const response = await fetch(`${baseUrl}/api/wallet/check`, {
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error(`Failed to check wallet: ${response.statusText}`)
			}

			return response.json()
		},

		async disconnect() {
			const response = await fetch(`${baseUrl}/api/wallet/disconnect`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: localStorage.getItem('sui_session_id') || '',
				}),
				credentials: 'include',
			})

			if (!response.ok) {
				throw new Error(`Failed to disconnect wallet: ${response.statusText}`)
			}

			localStorage.removeItem('sui_session_id')
			return response.json()
		},
	}
}

export const walletSession = createWalletSessionClient()
