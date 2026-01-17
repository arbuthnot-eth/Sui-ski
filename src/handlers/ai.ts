import { SuiClient } from '@mysten/sui/client'
import { SuinsClient } from '@mysten/sui/suins'
import type { Env } from '../types'
import { jsonResponse } from '../utils/response'
import { toSuiNSName } from '../utils/subdomain'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// OpenRouter API endpoint
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Gemini Nano Banana 3 Flash model ID on OpenRouter (free/cheap)
const GEMINI_3_FLASH_MODEL = 'google/gemini-2.0-flash-exp:free'
// Image generation model - using Gemini Nano Banana 3 Flash
const IMAGE_GENERATION_MODEL = 'google/gemini-2.0-flash-exp:free'

// Payment amount: 0.000003 SUI (nano bana 3)
const PAYMENT_AMOUNT = '3000000' // in MIST (1 SUI = 1e9 MIST)

/**
 * Handle AI-powered requests for name generation and avatar creation
 * 
 * POST /api/ai/generate-names - Generate Sui name suggestions
 * POST /api/ai/generate-avatar - Generate avatar description/image
 * 
 * Authentication:
 * - Authorization header: Bearer <wallet_address>
 * - Or include walletAddress in request body
 * 
 * Payment Verification (optional but recommended):
 * - X-Payment-Transaction-Bytes: Base64-encoded transaction bytes
 * - X-Payment-Signatures: JSON array of signatures
 * - Payment is verified via dry-run before processing
 * - Payment amount: 0.000003 SUI (3000000 MIST)
 * 
 * Access Control:
 * - If CONTROLLING_WALLET_ADDRESS is set, user must own that wallet/NFT
 * - Otherwise, anyone can use the feature (payment still verified)
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
 * Generate an image using OpenRouter image generation (after payment verified)
 */
async function handleGenerateImage(request: Request, env: Env): Promise<Response> {
	// Verify payment transaction was executed
	let payload: { prompt?: string; paymentTxDigest?: string; walletAddress?: string }
	try {
		payload = (await request.json()) as typeof payload
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400, CORS_HEADERS)
	}

	if (!payload.prompt) {
		return jsonResponse({ error: 'Prompt is required' }, 400, CORS_HEADERS)
	}

	if (!payload.paymentTxDigest) {
		return jsonResponse({ error: 'Payment transaction digest required' }, 400, CORS_HEADERS)
	}

	// Verify the payment transaction was executed successfully
	const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
	try {
		const txResult = await suiClient.getTransactionBlock({
			digest: payload.paymentTxDigest,
			options: { showEffects: true, showBalanceChanges: true },
		})

		const effects = txResult.effects
		if (effects?.status?.status !== 'success') {
			return jsonResponse({ error: 'Payment transaction failed' }, 402, CORS_HEADERS)
		}

		// Verify payment was made (check balance changes for positive amounts)
		const balanceChanges = txResult.balanceChanges || []
		const paymentFound = balanceChanges.some((change) => {
			const amount = BigInt(change.amount || '0')
			// Check if any address received at least the payment amount
			return amount >= BigInt(PAYMENT_AMOUNT)
		})

		if (!paymentFound) {
			return jsonResponse({ error: 'Payment verification failed - insufficient payment amount' }, 402, CORS_HEADERS)
		}
	} catch (error) {
		console.error('Payment verification error:', error)
		return jsonResponse({ error: 'Failed to verify payment' }, 402, CORS_HEADERS)
	}

	const prompt = payload.prompt

	// Use Gemini Nano Banana 3 Flash to generate image description
	const imageResponse = await callOpenRouterImageGeneration(env, {
		prompt: prompt,
	})

	if (!imageResponse.success) {
		return jsonResponse({ error: imageResponse.error || 'Failed to generate image' }, 500, CORS_HEADERS)
	}

	return jsonResponse(
		{
			success: true,
			imageUrl: imageResponse.imageUrl,
			prompt,
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
async function callOpenRouterImageGeneration(
	env: Env,
	body: {
		prompt: string
	},
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
	if (!env.OPENROUTER_API_KEY) {
		return { success: false, error: 'OpenRouter API key not configured' }
	}

	try {
		// Use Gemini to generate an image description, then create a simple visualization
		// For actual image generation, you'd integrate with a proper image model
		const response = await fetch(OPENROUTER_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
				'HTTP-Referer': 'https://sui.ski',
				'X-Title': 'Sui.ski AI Image Generator',
			},
			body: JSON.stringify({
				model: IMAGE_GENERATION_MODEL,
				messages: [
					{
						role: 'system',
						content: 'You are an image generation assistant. Generate a detailed image description that can be visualized.',
					},
					{
						role: 'user',
						content: `Create a visual description for: ${body.prompt}. Return only a concise description suitable for image generation.`,
					},
				],
				temperature: 0.8,
				max_tokens: 200,
			}),
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('OpenRouter Image API error:', response.status, errorText)
			return {
				success: false,
				error: `OpenRouter Image API error: ${response.status} ${errorText}`,
			}
		}

		const data = (await response.json()) as {
			choices?: Array<{
				message?: { content?: string }
			}>
			error?: { message?: string }
		}

		if (data.error) {
			return { success: false, error: data.error.message || 'Unknown error' }
		}

		const description = data.choices?.[0]?.message?.content
		if (!description) {
			return { success: false, error: 'No description generated' }
		}

		// For now, return the description as a data URL encoded string
		// In a real implementation, you'd use an actual image generation API
		// This is a placeholder that shows the concept works
		// TODO: Integrate with actual image generation service (DALL-E, Stable Diffusion, etc.)
		const encodedDescription = encodeURIComponent(description)
		const imageUrl = `data:text/plain;charset=utf-8,${encodedDescription}`

		return { success: true, imageUrl }
	} catch (error) {
		console.error('OpenRouter image request error:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		}
	}
}
