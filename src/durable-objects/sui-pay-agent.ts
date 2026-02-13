import { x402Client, x402HTTPClient } from '@x402/core/client'
import { Agent } from 'agents'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { ExactSuiClientScheme } from '../x402/exact-sui-client'
import { SuiSigner } from '../x402/sui-signer'

const MAX_SPEND_DEFAULT = 10_000_000_000n

interface SpendingRow {
	id: number
	url: string
	amount: string
	network: string
	digest: string
	timestamp: number
}

interface AgentState {
	address: string
	network: string
	totalSpent: string
	maxSpend: string
}

export class SuiPayAgent extends Agent<Env, AgentState> {
	#signer: SuiSigner | null = null
	#x402Client: x402Client | null = null
	#httpClient: x402HTTPClient | null = null

	initialState: AgentState = {
		address: '',
		network: '',
		totalSpent: '0',
		maxSpend: MAX_SPEND_DEFAULT.toString(),
	}

	onStart(): void {
		this.ctx.blockConcurrencyWhile(async () => {
			this.sql`
				CREATE TABLE IF NOT EXISTS spending (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					url TEXT NOT NULL,
					amount TEXT NOT NULL,
					network TEXT NOT NULL,
					digest TEXT NOT NULL,
					timestamp INTEGER NOT NULL
				)
			`
			this.sql`CREATE INDEX IF NOT EXISTS idx_spending_ts ON spending(timestamp)`
		})

		const privateKey = this.env.SUI_AGENT_PRIVATE_KEY
		if (!privateKey) return

		this.#signer = new SuiSigner(privateKey)
		const network = `sui:${this.env.SUI_NETWORK}` as `${string}:${string}`
		const rpcUrl = this.env.SUI_RPC_URL

		const clientScheme = new ExactSuiClientScheme(this.#signer, rpcUrl)
		this.#x402Client = new x402Client().register(network, clientScheme)
		this.#httpClient = new x402HTTPClient(this.#x402Client)

		const maxSpend = this.env.SUI_AGENT_MAX_SPEND_MIST || MAX_SPEND_DEFAULT.toString()
		this.setState({
			address: this.#signer.address,
			network,
			totalSpent: this.state.totalSpent || '0',
			maxSpend,
		})
	}

	async onRequest(request: Request): Promise<Response> {
		const url = new URL(request.url)
		const path = url.pathname.split('/').pop() || ''

		switch (path) {
			case 'info':
				return this.handleInfo()
			case 'balance':
				return this.handleBalance()
			case 'fetch':
				if (request.method !== 'POST') {
					return jsonResponse({ error: 'POST required' }, 405)
				}
				return this.handleFetch(request)
			case 'spending':
				return this.handleSpending(url)
			case 'budget':
				if (request.method !== 'POST') {
					return jsonResponse({ error: 'POST required' }, 405)
				}
				return this.handleBudget(request)
			default:
				return jsonResponse(
					{ error: 'Not found', endpoints: ['info', 'balance', 'fetch', 'spending', 'budget'] },
					404,
				)
		}
	}

	private handleInfo(): Response {
		return jsonResponse({
			service: 'SuiPayAgent',
			description: 'Autonomous payment agent using x402 protocol on Sui',
			address: this.state.address,
			network: this.state.network,
			totalSpent: this.state.totalSpent,
			maxSpend: this.state.maxSpend,
			configured: !!this.#signer,
		})
	}

	private async handleBalance(): Promise<Response> {
		if (!this.#signer) {
			return jsonResponse({ error: 'Agent not configured (no private key)' }, 503)
		}

		try {
			const { SuiJsonRpcClient } = await import('@mysten/sui/jsonRpc')
			const client = new SuiJsonRpcClient({
				url: this.env.SUI_RPC_URL,
				network: this.env.SUI_NETWORK,
			})
			const balance = await client.getBalance({ owner: this.#signer.address })
			return jsonResponse({
				address: this.#signer.address,
				balance: balance.totalBalance,
				network: this.state.network,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to fetch balance'
			return jsonResponse({ error: message }, 500)
		}
	}

	private async handleFetch(request: Request): Promise<Response> {
		if (!this.#httpClient || !this.#x402Client || !this.#signer) {
			return jsonResponse({ error: 'Agent not configured (no private key)' }, 503)
		}

		let body: { url: string; method?: string; body?: unknown; headers?: Record<string, string> }
		try {
			body = await request.json()
		} catch {
			return jsonResponse({ error: 'Invalid JSON body' }, 400)
		}

		if (!body.url) {
			return jsonResponse({ error: 'url field required' }, 400)
		}

		const totalSpent = BigInt(this.state.totalSpent)
		const maxSpend = BigInt(this.state.maxSpend)
		if (totalSpent >= maxSpend) {
			return jsonResponse(
				{
					error: 'Spending budget exhausted',
					totalSpent: this.state.totalSpent,
					maxSpend: this.state.maxSpend,
				},
				403,
			)
		}

		const fetchInit: RequestInit = {
			method: body.method || 'GET',
			headers: body.headers || {},
		}
		if (body.body && fetchInit.method !== 'GET') {
			fetchInit.headers = {
				...(fetchInit.headers as Record<string, string>),
				'Content-Type': 'application/json',
			}
			fetchInit.body = JSON.stringify(body.body)
		}

		const firstResponse = await fetch(body.url, fetchInit)

		if (firstResponse.status !== 402) {
			const responseBody = await firstResponse.text()
			return new Response(responseBody, {
				status: firstResponse.status,
				headers: {
					'Content-Type': firstResponse.headers.get('Content-Type') || 'application/json',
					'Access-Control-Allow-Origin': '*',
					'X-Agent-Payment': 'none',
				},
			})
		}

		try {
			const getHeader = (name: string) => firstResponse.headers.get(name)
			let responseBody: unknown
			try {
				const text = await firstResponse.text()
				if (text) responseBody = JSON.parse(text)
			} catch {}

			const paymentRequired = this.#httpClient.getPaymentRequiredResponse(getHeader, responseBody)
			const paymentPayload = await this.#x402Client.createPaymentPayload(paymentRequired)
			const paymentHeaders = this.#httpClient.encodePaymentSignatureHeader(paymentPayload)

			const secondInit: RequestInit = {
				method: body.method || 'GET',
				headers: { ...body.headers, ...paymentHeaders },
			}
			if (body.body && secondInit.method !== 'GET') {
				;(secondInit.headers as Record<string, string>)['Content-Type'] = 'application/json'
				secondInit.body = JSON.stringify(body.body)
			}

			const paidResponse = await fetch(body.url, secondInit)

			const amount = paymentRequired.accepts?.[0]?.amount || '0'
			const network = paymentRequired.accepts?.[0]?.network || this.state.network
			const digest = paidResponse.headers.get('PAYMENT-RESPONSE') || ''
			this.recordSpending(body.url, amount, network, digest)

			const paidBody = await paidResponse.text()
			return new Response(paidBody, {
				status: paidResponse.status,
				headers: {
					'Content-Type': paidResponse.headers.get('Content-Type') || 'application/json',
					'Access-Control-Allow-Origin': '*',
					'X-Agent-Payment': 'paid',
					'X-Agent-Amount': amount,
				},
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Payment failed'
			return jsonResponse({ error: `Auto-payment failed: ${message}` }, 502)
		}
	}

	private recordSpending(url: string, amount: string, network: string, digest: string): void {
		const now = Date.now()
		this.sql`
			INSERT INTO spending (url, amount, network, digest, timestamp)
			VALUES (${url}, ${amount}, ${network}, ${digest}, ${now})
		`
		const newTotal = BigInt(this.state.totalSpent) + BigInt(amount)
		this.setState({ ...this.state, totalSpent: newTotal.toString() })
	}

	private handleSpending(url: URL): Response {
		const limit = Number(url.searchParams.get('limit')) || 20
		const offset = Number(url.searchParams.get('offset')) || 0

		const rows = this.sql<SpendingRow>`
			SELECT id, url, amount, network, digest, timestamp
			FROM spending
			ORDER BY timestamp DESC
			LIMIT ${limit} OFFSET ${offset}
		`

		return jsonResponse({
			spending: rows,
			totalSpent: this.state.totalSpent,
			maxSpend: this.state.maxSpend,
		})
	}

	private async handleBudget(request: Request): Promise<Response> {
		let body: { maxSpendMist?: string }
		try {
			body = await request.json()
		} catch {
			return jsonResponse({ error: 'Invalid JSON body' }, 400)
		}

		if (!body.maxSpendMist) {
			return jsonResponse({ error: 'maxSpendMist field required' }, 400)
		}

		try {
			BigInt(body.maxSpendMist)
		} catch {
			return jsonResponse({ error: 'maxSpendMist must be a valid integer string' }, 400)
		}

		this.setState({ ...this.state, maxSpend: body.maxSpendMist })
		return jsonResponse({
			success: true,
			maxSpend: body.maxSpendMist,
			totalSpent: this.state.totalSpent,
		})
	}
}
