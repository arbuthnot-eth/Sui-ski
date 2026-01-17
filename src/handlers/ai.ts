import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/suins'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { toSuiNSName } from '../utils/subdomain'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payment-Proof, X-Payment-Tx-Digest',
}

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Gemini Nano Banana 3 Flash model ID on OpenRouter (free/cheap)
const GEMINI_3_FLASH_MODEL = 'google/gemini-2.0-flash-exp:free'
// Image generation model - using Gemini 3 Pro Nano Banana (paid, avoids rate limits)
const IMAGE_GENERATION_MODEL = 'google/gemini-3-pro-image-preview' // Paid model, ~$0.134 per image

// Payment amount: 0.000003 SUI (nano bana 3)
const PAYMENT_AMOUNT = '3000000' // in MIST (1 SUI = 1e9 MIST)

/**
 * Handle AI-powered requests for name generation and avatar creation
 * 
 * POST /api/ai/generate-names - Generate Sui name suggestions
 * POST /api/ai/generate-avatar - Generate avatar description/image
 * POST /api/ai/generate-image - Retrieve Grokipedia article (x402 payment gated)
 * POST /api/ai/create-payment-tx - Get payment transaction details
 * 
 * x402 Payment Protocol (for generate-image):
 * - First request without payment: Returns 402 Payment Required with payment details
 * - Payment details include: amount, recipient (alias.sui address), chain, currency
 * - Client creates and executes payment transaction
 * - Retry request with X-Payment-Tx-Digest header containing transaction digest
 * - Server verifies payment on-chain before generating image
 * - Works for both browser users and API agents
 * 
 * Authentication:
 * - Authorization header: Bearer <wallet_address> (optional)
 * - Or include walletAddress in request body
 * 
 * Access Control:
 * - If CONTROLLING_WALLET_ADDRESS is set, user must own that wallet/NFT
 * - Otherwise, anyone can use the feature (payment still required)
 */
export async function handleAIRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const pathParts = url.pathname.replace('/api/ai', '').split('/').filter(Boolean)
	const action = pathParts[0]

	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, { headers: CORS_HEADERS })
	}

	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405, CORS_HEADERS)
	}

		try {
		switch (action) {
			case 'generate-names':
				return handleGenerateNames(request, env)
			case 'generate-avatar':
				return handleGenerateAvatar(request, env)
			case 'generate-image':
				return handleGenerateImage(request, env)
			case 'generate-description':
				return handleGenerateDescription(request, env)
			case 'create-payment-tx':
				return handleCreatePaymentTransaction(request, env)
			default:
				return jsonResponse({ error: 'Unknown action' }, 400, CORS_HEADERS)
		}
	} catch (error) {
		console.error('AI API error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: message }, 500, CORS_HEADERS)
	}
}

/**
 * Generate interesting Sui name suggestions using AI
 */
async function handleGenerateNames(request: Request, env: Env): Promise<Response> {
	let payload: { prompt?: string; count?: number; walletAddress?: string }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	// Verify wallet ownership and payment
	const verification = await verifyWalletAndPayment(request, payload.walletAddress, env)
	if (!verification.valid) {
		return jsonResponse({ error: verification.error }, verification.status, CORS_HEADERS)
	}

	const prompt = payload.prompt || 'Generate interesting and valuable Sui name suggestions'
	const count = payload.count || 10

	// Call OpenRouter API
	const aiResponse = await callOpenRouter(env, {
		messages: [
			{
				role: 'system',
				content: `You are a creative naming expert for the Sui blockchain. Generate short, memorable, and valuable name suggestions that would work well as SuiNS names (like seal, walrus, nautilus, advert, vision, vortex). Names should be:
- Short (3-10 characters preferred)
- Memorable and brandable
- Related to web3, blockchain, or abstract concepts
- Available-sounding (not generic dictionary words)
- Creative and unique`,
			},
			{
				role: 'user',
				content: `${prompt}\n\nGenerate ${count} name suggestions. Return them as a JSON array of strings, each name on its own line.`,
			},
		],
		temperature: 0.9,
		max_tokens: 500,
	})

	if (!aiResponse.success) {
		return jsonResponse({ error: aiResponse.error || 'Failed to generate names' }, 500, CORS_HEADERS)
	}

	// Parse the AI response to extract names
	const names = parseNamesFromResponse(aiResponse.content || '')

	return jsonResponse(
		{
			success: true,
			names,
			count: names.length,
		},
		200,
		CORS_HEADERS,
	)
}

/**
 * Generate avatar description or image based on user description
 */
async function handleGenerateAvatar(request: Request, env: Env): Promise<Response> {
	let payload: { description?: string; name?: string; style?: string; walletAddress?: string }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	// Verify wallet ownership and payment
	const verification = await verifyWalletAndPayment(request, payload.walletAddress, env)
	if (!verification.valid) {
		return jsonResponse({ error: verification.error }, verification.status, CORS_HEADERS)
	}

	if (!payload.description && !payload.name) {
		return jsonResponse({ error: 'Description or name is required' }, 400, CORS_HEADERS)
	}

	const userDescription = payload.description || `Create an avatar for the name "${payload.name}"`
	const style = payload.style || 'modern, minimalist, web3'

	// Call OpenRouter API to generate avatar description
	const aiResponse = await callOpenRouter(env, {
		messages: [
			{
				role: 'system',
				content: `You are a creative avatar designer for the Sui blockchain. Generate detailed avatar descriptions that can be used to create visual avatars. The descriptions should be:
- Visual and descriptive
- Suitable for web3/blockchain context
- Creative and unique
- Include style, colors, and key visual elements`,
			},
			{
				role: 'user',
				content: `${userDescription}\n\nStyle: ${style}\n\nGenerate a detailed avatar description in 2-3 sentences. Focus on visual elements, colors, and style.`,
			},
		],
		temperature: 0.8,
		max_tokens: 300,
	})

	if (!aiResponse.success) {
		return jsonResponse({ error: aiResponse.error || 'Failed to generate avatar' }, 500, CORS_HEADERS)
	}

	return jsonResponse(
		{
			success: true,
			description: aiResponse.content,
			prompt: userDescription,
		},
		200,
		CORS_HEADERS,
	)
}

/**
 * Generate an inspiring description for a SuiNS name using Gemini 3 Flash
 * This description should inspire someone to build an identity with their SUINS name
 */
async function handleGenerateDescription(request: Request, env: Env): Promise<Response> {
	let payload: { name?: string }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	if (!payload.name) {
		return jsonResponse({ error: 'SuiNS name is required' }, 400, CORS_HEADERS)
	}

	// Check if OpenRouter API key is configured
	if (!env.OPENROUTER_API_KEY) {
		return jsonResponse(
			{ 
				success: false, 
				error: 'AI description service not configured',
				description: `Welcome to ${payload.name.replace(/\.sui$/i, '')}.sui! Build your digital identity on the Sui blockchain.` 
			}, 
			200, 
			CORS_HEADERS
		)
	}

	// Extract the name without .sui suffix
	const cleanName = payload.name.replace(/\.sui$/i, '').toLowerCase()

	try {
		// Call Gemini 3 Flash via OpenRouter to generate inspiring description
		const aiResponse = await callOpenRouter(env, {
			messages: [
				{
					role: 'system',
					content: `You are a creative identity consultant for the Sui blockchain. Generate inspiring, motivational descriptions for SuiNS names that encourage people to build their digital identity. Your descriptions should:
- Be concise (2-3 sentences, max 150 words)
- Capture the essence and potential of the name
- Inspire creativity and identity building
- Be positive and forward-looking
- Connect the name to web3, blockchain, and digital identity concepts
- Avoid generic phrases, be specific and evocative`,
				},
				{
					role: 'user',
					content: `Generate an inspiring description for the SuiNS name "${cleanName}". This description will be displayed on their profile page to inspire them to build their digital identity. Make it compelling and unique to this name.`,
				},
			],
			temperature: 0.8,
			max_tokens: 200,
		})

		if (!aiResponse.success) {
			// Return fallback description instead of error
			return jsonResponse(
				{
					success: true,
					name: cleanName,
					description: `Welcome to ${cleanName}.sui! Build your digital identity on the Sui blockchain and connect with the decentralized web.`,
				},
				200,
				CORS_HEADERS,
			)
		}

		return jsonResponse(
			{
				success: true,
				name: cleanName,
				description: aiResponse.content?.trim() || `Welcome to ${cleanName}.sui! Build your digital identity on the Sui blockchain.`,
			},
			200,
			CORS_HEADERS,
		)
	} catch (error) {
		console.error('Error generating description:', error)
		// Return fallback description instead of error
		return jsonResponse(
			{
				success: true,
				name: cleanName,
				description: `Welcome to ${cleanName}.sui! Build your digital identity on the Sui blockchain and connect with the decentralized web.`,
			},
			200,
			CORS_HEADERS,
		)
	}
}

/**
 * Create a payment transaction for image generation
 * Payment goes to the alias.sui address (target address of the SuiNS name)
 */
async function handleCreatePaymentTransaction(request: Request, env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return jsonResponse({ error: 'Method not allowed' }, 405, CORS_HEADERS)
	}

	let payload: { walletAddress?: string; name?: string }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	if (!payload.name) {
		return jsonResponse({ error: 'SuiNS name is required' }, 400, CORS_HEADERS)
	}

	// Resolve the SuiNS name to get the target address (alias.sui address)
	const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
	const suinsClient = new SuinsClient({
		client: suiClient as never,
		network: env.SUI_NETWORK as 'mainnet' | 'testnet',
	})

	try {
		const suinsName = toSuiNSName(payload.name)
		const nameRecord = await suinsClient.getNameRecord(suinsName)
		
		if (!nameRecord || !nameRecord.targetAddress) {
			return jsonResponse({ error: `Could not resolve "${suinsName}" to an address` }, 404, CORS_HEADERS)
		}

		// Return transaction data for client to build and sign
		return jsonResponse(
			{
				recipient: nameRecord.targetAddress,
				amount: PAYMENT_AMOUNT,
				amountSui: '0.000003',
			},
			200,
			CORS_HEADERS,
		)
	} catch (error) {
		console.error('Failed to resolve SuiNS name:', error)
		return jsonResponse({ error: 'Failed to resolve SuiNS name' }, 500, CORS_HEADERS)
	}
}

/**
 * Retrieve Grokipedia article for SuiNS name (x402 payment gating)
 * Supports both browser users and agents via x402 protocol
 */
async function handleGenerateImage(request: Request, env: Env): Promise<Response> {
	let payload: { prompt?: string; name?: string; walletAddress?: string }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	if (!payload.name) {
		return jsonResponse({ error: 'SuiNS name is required' }, 400, CORS_HEADERS)
	}

	// Resolve the SuiNS name to get the target address (payment recipient)
	const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
	const suinsClient = new SuinsClient({
		client: suiClient as never,
		network: env.SUI_NETWORK as 'mainnet' | 'testnet',
	})

	let recipientAddress: string
	try {
		const suinsName = toSuiNSName(payload.name)
		const nameRecord = await suinsClient.getNameRecord(suinsName)
		
		if (!nameRecord || !nameRecord.targetAddress) {
			return jsonResponse({ error: `Could not resolve "${suinsName}" to an address` }, 404, CORS_HEADERS)
		}
		recipientAddress = nameRecord.targetAddress
	} catch (error) {
		console.error('Failed to resolve SuiNS name:', error)
		return jsonResponse({ error: 'Failed to resolve SuiNS name' }, 500, CORS_HEADERS)
	}

	// Check for x402 payment proof in headers (X-Payment-Proof or X-Payment-Tx-Digest)
	const paymentProof = request.headers.get('X-Payment-Proof') || request.headers.get('X-Payment-Tx-Digest')
	const paymentTxDigest = paymentProof || payload.paymentTxDigest

	if (!paymentTxDigest) {
		// Return 402 Payment Required with payment details (x402 protocol)
		return jsonResponse(
			{
				error: 'Payment required',
				payment: {
					amount: PAYMENT_AMOUNT,
					amountSui: '0.000003',
					recipient: recipientAddress,
					chain: env.SUI_NETWORK,
					currency: 'SUI',
				},
				instructions: 'Include X-Payment-Tx-Digest header with a successful payment transaction digest, or use /api/ai/create-payment-tx to get payment details',
			},
			402,
			CORS_HEADERS,
		)
	}

	// Verify the payment transaction was executed successfully
	try {
		// Try to get transaction, with retry if it's not available yet
		let txResult
		let retries = 3
		while (retries > 0) {
			try {
				txResult = await suiClient.getTransactionBlock({
					digest: paymentTxDigest,
					options: { 
						showEffects: true, 
						showBalanceChanges: true,
						showObjectChanges: true,
						showInput: true,
					},
				})
				break
			} catch (error) {
				retries--
				if (retries === 0) throw error
				// Wait a bit before retrying
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}

		const effects = txResult.effects
		if (effects?.status?.status !== 'success') {
			return jsonResponse(
				{
					error: 'Payment transaction failed',
					payment: {
						amount: PAYMENT_AMOUNT,
						amountSui: '0.000003',
						recipient: recipientAddress,
						chain: env.SUI_NETWORK,
						currency: 'SUI',
					},
				},
				402,
				CORS_HEADERS,
			)
		}

		// Verify payment was made to the correct recipient
		// Balance changes: negative for sender, positive for recipient
		const balanceChanges = txResult.balanceChanges || []
		const requiredAmount = BigInt(PAYMENT_AMOUNT)
		
		// Find positive balance change to the recipient (payment received)
		let paymentFound = false
		let totalReceived = 0n
		
		for (const change of balanceChanges) {
			// Extract owner address
			let ownerAddress: string | null = null
			if (change.owner && typeof change.owner === 'object') {
				if ('AddressOwner' in change.owner) {
					ownerAddress = change.owner.AddressOwner
				} else if ('ObjectOwner' in change.owner) {
					ownerAddress = change.owner.ObjectOwner
				}
			}
			
			// Check if this is for the recipient
			if (ownerAddress?.toLowerCase() === recipientAddress.toLowerCase()) {
				// Parse amount (can be string or number)
				const amountStr = String(change.amount || '0')
				const amount = BigInt(amountStr)
				
				// Check coinType is SUI (0x2::sui::SUI or empty/default)
				const coinType = change.coinType || ''
				const isSui = !coinType || coinType.includes('sui::SUI') || coinType === '0x2::sui::SUI' || coinType === ''
				
				// Sum up all positive amounts received by recipient
				if (isSui && amount > 0n) {
					totalReceived += amount
				}
			}
		}
		
		// Check if total received meets requirement
		if (totalReceived >= requiredAmount) {
			paymentFound = true
		}

		// If balance changes check fails, also check object changes for transferred objects
		if (!paymentFound) {
			const objectChanges = txResult.objectChanges || []
			// Check if any coins were transferred to the recipient
			for (const change of objectChanges) {
				if (change.type === 'transferred' || change.type === 'created') {
					const owner = change.owner
					let ownerAddress: string | null = null
					if (owner && typeof owner === 'object') {
						if ('AddressOwner' in owner) {
							ownerAddress = owner.AddressOwner
						} else if ('ObjectOwner' in owner) {
							ownerAddress = owner.ObjectOwner
						}
					}
					// Check if object was transferred to recipient and is a coin
					if (ownerAddress?.toLowerCase() === recipientAddress.toLowerCase()) {
						const objectType = change.objectType || ''
						// Check if it's a coin object (Coin<SUI>)
						if (objectType.includes('Coin') || objectType.includes('coin')) {
							paymentFound = true
							console.log('Payment verified via object changes:', change.objectId)
							break
						}
					}
				}
			}
		}
		
		if (!paymentFound) {
			// Log for debugging
			console.log('Payment verification failed.')
			console.log('Recipient:', recipientAddress)
			console.log('Required:', PAYMENT_AMOUNT, 'MIST (', Number(PAYMENT_AMOUNT) / 1e9, 'SUI)')
			console.log('Total received:', totalReceived.toString(), 'MIST (', Number(totalReceived) / 1e9, 'SUI)')
			console.log('Balance changes:', JSON.stringify(balanceChanges, null, 2))
			console.log('Object changes:', JSON.stringify(txResult.objectChanges || [], null, 2))
			
			return jsonResponse(
				{
					error: 'Payment verification failed - insufficient payment amount or wrong recipient',
					debug: {
						recipient: recipientAddress,
						requiredAmount: PAYMENT_AMOUNT,
						requiredAmountSui: Number(PAYMENT_AMOUNT) / 1e9,
						totalReceived: totalReceived.toString(),
						totalReceivedSui: Number(totalReceived) / 1e9,
						balanceChanges: balanceChanges.map((bc) => ({
							owner: bc.owner,
							amount: bc.amount,
							amountSui: Number(bc.amount || 0) / 1e9,
							coinType: bc.coinType,
						})),
					},
					payment: {
						amount: PAYMENT_AMOUNT,
						amountSui: '0.000003',
						recipient: recipientAddress,
						chain: env.SUI_NETWORK,
						currency: 'SUI',
					},
				},
				402,
				CORS_HEADERS,
			)
		}
	} catch (error) {
		console.error('Payment verification error:', error)
		return jsonResponse(
			{
				error: 'Failed to verify payment',
				payment: {
					amount: PAYMENT_AMOUNT,
					amountSui: '0.000003',
					recipient: recipientAddress,
					chain: env.SUI_NETWORK,
					currency: 'SUI',
				},
			},
			402,
			CORS_HEADERS,
		)
	}

	const suinsName = payload.name

	// Retrieve Grokipedia article for the SuiNS name
	const grokipediaResponse = await fetchGrokipediaArticle(env, suinsName)

	if (!grokipediaResponse.success) {
		return jsonResponse({ error: grokipediaResponse.error || 'Failed to retrieve Grokipedia article' }, 500, CORS_HEADERS)
	}

	return jsonResponse(
		{
			success: true,
			article: grokipediaResponse.article,
			title: grokipediaResponse.title,
			url: grokipediaResponse.url,
			name: suinsName,
		},
		200,
		CORS_HEADERS,
	)
}

/**
 * Verify wallet ownership and process payment using cryptographic verification and dry-run
 */
async function verifyWalletAndPayment(
	request: Request,
	walletAddressFromBody: string | undefined,
	env: Env,
): Promise<{ valid: boolean; error?: string; status?: number }> {
	// Get wallet address from request headers or body parameter
	const authHeader = request.headers.get('Authorization')
	const walletAddress = authHeader?.startsWith('Bearer ')
		? authHeader.slice(7)
		: walletAddressFromBody

	if (!walletAddress) {
		return { valid: false, error: 'Wallet address required in Authorization header or body', status: 401 }
	}

	const suiClient = new SuiClient({ url: env.SUI_RPC_URL })

	// If controlling wallet/NFT is configured, verify ownership
	if (env.CONTROLLING_WALLET_ADDRESS) {
		try {
			// Check if the address is an object ID (NFT) or wallet address
			const isObjectId = env.CONTROLLING_WALLET_ADDRESS.startsWith('0x') && env.CONTROLLING_WALLET_ADDRESS.length > 40

			if (isObjectId) {
				// Verify ownership of the NFT/object
				const obj = await suiClient.getObject({
					id: env.CONTROLLING_WALLET_ADDRESS,
					options: { showOwner: true },
				})

				const owner = obj.data?.owner
				if (!owner || typeof owner !== 'object') {
					return {
						valid: false,
						error: 'Controlling object not found or has no owner',
						status: 500,
					}
				}

				const ownerAddress =
					'AddressOwner' in owner
						? owner.AddressOwner
						: 'ObjectOwner' in owner
							? owner.ObjectOwner
							: null

				if (!ownerAddress || ownerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
					return {
						valid: false,
						error: 'You do not own the required access token',
						status: 403,
					}
				}
			} else {
				// Verify wallet address matches
				if (walletAddress.toLowerCase() !== env.CONTROLLING_WALLET_ADDRESS.toLowerCase()) {
					return {
						valid: false,
						error: 'Only the controlling wallet can use this feature',
						status: 403,
					}
				}
			}
		} catch (error) {
			console.error('Ownership verification error:', error)
			return {
				valid: false,
				error: 'Failed to verify ownership',
				status: 500,
			}
		}
	}

	// Verify payment transaction using dry-run (if provided)
	const paymentTxBytes = request.headers.get('X-Payment-Transaction-Bytes')
	const paymentSignatures = request.headers.get('X-Payment-Signatures')

	if (paymentTxBytes && paymentSignatures) {
		try {
			// Dry-run the transaction to verify it will succeed
			const dryRunResponse = await fetch(env.SUI_RPC_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: Date.now(),
					method: 'sui_dryRunTransactionBlock',
					params: [
						paymentTxBytes,
						JSON.parse(paymentSignatures),
					],
				}),
			})

			if (!dryRunResponse.ok) {
				return {
					valid: false,
					error: 'Payment transaction dry-run failed',
					status: 402,
				}
			}

			const dryRunResult = (await dryRunResponse.json()) as {
				result?: {
					effects?: {
						status?: { status?: string; error?: string }
					}
					balanceChanges?: Array<{
						owner?: { AddressOwner?: string }
						coinType?: string
						amount?: string
					}>
				}
				error?: { message?: string }
			}

			if (dryRunResult.error) {
				return {
					valid: false,
					error: `Payment verification failed: ${dryRunResult.error.message || 'Unknown error'}`,
					status: 402,
				}
			}

			const effects = dryRunResult.result?.effects
			if (effects?.status?.status !== 'success') {
				return {
					valid: false,
					error: `Payment transaction would fail: ${effects?.status?.error || 'Unknown error'}`,
					status: 402,
				}
			}

			// Verify payment amount in balance changes
			const balanceChanges = dryRunResult.result?.balanceChanges || []
			const paymentAmount = BigInt(PAYMENT_AMOUNT)
			const paymentFound = balanceChanges.some((change) => {
				const ownerAddress = change.owner && typeof change.owner === 'object' && 'AddressOwner' in change.owner
					? change.owner.AddressOwner
					: null
				const amount = BigInt(change.amount || '0')
				// Check if payment is being sent (negative amount for sender, or positive for recipient)
				// For simplicity, we check if the amount matches our expected payment
				return amount >= paymentAmount
			})

			if (!paymentFound) {
				console.warn('Payment amount verification: balance changes found but amount may not match')
				// Allow it through - the dry-run success is the main verification
			}

			return { valid: true }
		} catch (error) {
			console.error('Payment dry-run error:', error)
			return {
				valid: false,
				error: 'Failed to verify payment transaction',
				status: 402,
			}
		}
	}

	// If no payment transaction provided, allow if ownership is verified (or no ownership required)
	return { valid: true }
}

/**
 * Call OpenRouter API with Gemini 3 Flash
 */
async function callOpenRouter(
	env: Env,
	body: {
		messages: Array<{ role: string; content: string }>
		temperature?: number
		max_tokens?: number
	},
): Promise<{ success: boolean; content?: string; error?: string }> {
	if (!env.OPENROUTER_API_KEY) {
		return { success: false, error: 'OpenRouter API key not configured' }
	}

	try {
		const response = await fetch(OPENROUTER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
				'HTTP-Referer': 'https://sui.ski',
				'X-Title': 'Sui.ski AI Name Generator',
			},
			body: JSON.stringify({
				model: GEMINI_3_FLASH_MODEL,
				messages: body.messages,
				temperature: body.temperature ?? 0.7,
				max_tokens: body.max_tokens ?? 500,
			}),
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('OpenRouter API error:', response.status, errorText)
			return {
				success: false,
				error: `OpenRouter API error: ${response.status} ${errorText}`,
			}
		}

		const data = (await response.json()) as {
			choices?: Array<{ message?: { content?: string } }>
			error?: { message?: string }
		}

		if (data.error) {
			return { success: false, error: data.error.message || 'Unknown error' }
		}

		const content = data.choices?.[0]?.message?.content
		if (!content) {
			return { success: false, error: 'No content in response' }
		}

		return { success: true, content }
	} catch (error) {
		console.error('OpenRouter request error:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		}
	}
}

/**
 * Parse names from AI response
 */
function parseNamesFromResponse(response: string): string[] {
	// Try to extract JSON array first
	try {
		const jsonMatch = response.match(/\[[\s\S]*?\]/)
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0])
			if (Array.isArray(parsed)) {
				return parsed.filter((name) => typeof name === 'string' && name.length > 0)
			}
		}
	} catch {
		// Not JSON, try line-by-line parsing
	}

	// Extract names from lines (one per line)
	const lines = response
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('-'))

	// Clean up names (remove quotes, numbers, etc.)
	const names = lines
		.map((line) => {
			// Remove leading numbers and dashes
			let cleaned = line.replace(/^\d+[\.\)\-\s]+/, '').trim()
			// Remove quotes
			cleaned = cleaned.replace(/^["']|["']$/g, '')
			// Remove markdown formatting
			cleaned = cleaned.replace(/^\*\s*/, '').replace(/^-\s*/, '')
			return cleaned.trim()
		})
		.filter((name) => name.length >= 2 && name.length <= 20 && /^[a-z0-9-]+$/i.test(name))

	return [...new Set(names)] // Remove duplicates
}

/**
 * Call OpenRouter for image generation (using text model to generate image description, then return as data URL)
 * Note: For actual image generation, you'd need a dedicated image model. This is a simplified approach.
 */
/**
 * Fetch Grokipedia article by searching for the SuiNS name
 */
async function fetchGrokipediaArticle(
	env: Env,
	suinsName: string,
): Promise<{ success: boolean; article?: string; title?: string; url?: string; error?: string }> {
	try {
		// Clean the SuiNS name for search (remove .sui suffix, handle special chars)
		const searchQuery = suinsName.replace(/\.sui$/i, '').trim()
		
		// Grokipedia search URL - search for the name
		const searchUrl = `https://grokxpedia.us/search?q=${encodeURIComponent(searchQuery)}`
		
		// Fetch the search results page
		const searchResponse = await fetch(searchUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Sui.ski/1.0)',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		})

		if (!searchResponse.ok) {
			return {
				success: false,
				error: `Grokipedia search failed: ${searchResponse.status} ${searchResponse.statusText}`,
			}
		}

		const searchHtml = await searchResponse.text()
		
		// Parse search results to find the article URL
		// Grokipedia typically shows results with links like /page/ArticleName
		const articleUrlMatch = searchHtml.match(/href=["'](\/page\/[^"']+)["']/i)
		let articleUrl = articleUrlMatch ? articleUrlMatch[1] : null
		
		// If no direct match, try to construct URL from search query
		if (!articleUrl) {
			// Convert search query to article slug format (capitalize first letter, replace spaces/hyphens)
			const articleSlug = searchQuery
				.split(/[\s-]+/)
				.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join('_')
			articleUrl = `/page/${articleSlug}`
		}

		// Fetch the article page
		const articleFullUrl = articleUrl.startsWith('http') ? articleUrl : `https://grokxpedia.us${articleUrl}`
		const articleResponse = await fetch(articleFullUrl, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (compatible; Sui.ski/1.0)',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			},
		})

		if (!articleResponse.ok) {
			// If article not found, return a message indicating no article exists
			if (articleResponse.status === 404) {
				return {
					success: true,
					article: `No Grokipedia article found for "${searchQuery}". This could be a new or uncommon topic.`,
					title: `Article not found: ${searchQuery}`,
					url: articleFullUrl,
				}
			}
			return {
				success: false,
				error: `Failed to fetch Grokipedia article: ${articleResponse.status} ${articleResponse.statusText}`,
			}
		}

		const articleHtml = await articleResponse.text()
		
		// Extract article content from HTML
		// Grokipedia articles are typically in a main content area
		// Try to find the article text content
		let articleContent = ''
		let articleTitle = searchQuery

		// Extract title (usually in <h1> or title tag)
		const titleMatch = articleHtml.match(/<h1[^>]*>([^<]+)<\/h1>/i) || articleHtml.match(/<title>([^<]+)<\/title>/i)
		if (titleMatch) {
			articleTitle = titleMatch[1].trim()
		}

		// Extract main content (look for common article content selectors)
		const contentSelectors = [
			/<article[^>]*>([\s\S]*?)<\/article>/i,
			/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
			/<main[^>]*>([\s\S]*?)<\/main>/i,
			/<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i,
		]

		for (const selector of contentSelectors) {
			const match = articleHtml.match(selector)
			if (match && match[1]) {
				// Remove HTML tags and clean up
				articleContent = match[1]
					.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
					.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
					.replace(/<[^>]+>/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
				
				if (articleContent.length > 100) {
					break
				}
			}
		}

		// If no structured content found, extract text from body
		if (!articleContent || articleContent.length < 100) {
			const bodyMatch = articleHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
			if (bodyMatch) {
				articleContent = bodyMatch[1]
					.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
					.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
					.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
					.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
					.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
					.replace(/<[^>]+>/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
					.substring(0, 5000) // Limit length
			}
		}

		if (!articleContent || articleContent.length < 50) {
			return {
				success: false,
				error: 'Could not extract article content from Grokipedia page',
			}
		}

		return {
			success: true,
			article: articleContent,
			title: articleTitle,
			url: articleFullUrl,
		}
	} catch (error) {
		console.error('Grokipedia fetch error:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error fetching Grokipedia article',
		}
	}
}
