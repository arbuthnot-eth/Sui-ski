import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient, SuinsTransaction } from '@mysten/suins'
import { resolveMVRPackage } from '../resolvers/mvr'
import type { Env } from '../types'

/**
 * Bounty Transaction Builder Utilities
 *
 * These utilities generate unsigned transaction blocks for the bounty escrow system.
 * Transactions are designed to be pre-signed by the bounty creator and later
 * broadcast by an executor when the grace period ends.
 */

const DEFAULT_BOUNTY_ESCROW_PACKAGE_ID: Record<'mainnet' | 'testnet', string | null> = {
	mainnet: null,
	testnet: null,
}

function resolveNetwork(env: { SUI_NETWORK: string }): 'mainnet' | 'testnet' {
	return env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
}

/**
 * Resolve bounty escrow package ID
 *
 * Priority:
 * 1. MVR alias (if configured) - e.g., "sui.ski/bounty-escrow"
 * 2. Environment variable (BOUNTY_ESCROW_PACKAGE_MAINNET/TESTNET)
 * 3. Default hardcoded value
 */
export async function resolveBountyPackageId(
	env:
		| Pick<
				Env,
				| 'BOUNTY_ESCROW_PACKAGE_MAINNET'
				| 'BOUNTY_ESCROW_PACKAGE_TESTNET'
				| 'BOUNTY_ESCROW_MVR_ALIAS'
				| 'SUI_NETWORK'
				| 'CACHE'
				| 'SUI_RPC_URL'
				| 'MOVE_REGISTRY_PARENT_ID'
		  >
		| undefined,
	overrideNetwork?: 'mainnet' | 'testnet',
): Promise<string> {
	const network = overrideNetwork || (env ? resolveNetwork(env) : undefined)

	if (!network) {
		throw new Error('Network is required to resolve bounty package id')
	}

	// First, try MVR alias if configured
	if (env?.BOUNTY_ESCROW_MVR_ALIAS) {
		try {
			const aliasParts = env.BOUNTY_ESCROW_MVR_ALIAS.split('/')
			if (aliasParts.length === 2) {
				const [suinsName, packageName] = aliasParts
				const mvrResult = await resolveMVRPackage(
					suinsName.trim(),
					packageName.trim(),
					undefined,
					env as Env,
				)

				if (mvrResult.found && mvrResult.data && 'address' in mvrResult.data) {
					return mvrResult.data.address
				}
			}
		} catch (error) {
			console.warn('Failed to resolve bounty package from MVR alias:', error)
			// Fall through to env vars
		}
	}

	// Fallback to environment variables
	const fromEnv =
		env && network === 'mainnet'
			? env.BOUNTY_ESCROW_PACKAGE_MAINNET
			: env && network === 'testnet'
				? env.BOUNTY_ESCROW_PACKAGE_TESTNET
				: undefined

	const candidate = fromEnv?.trim() || DEFAULT_BOUNTY_ESCROW_PACKAGE_ID[network]

	if (!candidate || candidate === '0x0' || candidate === '0x' || /^0x0+$/.test(candidate)) {
		throw new Error(
			`Bounty escrow package id is not configured for ${network}. Set BOUNTY_ESCROW_MVR_ALIAS (e.g., "sui.ski/bounty-escrow") or BOUNTY_ESCROW_PACKAGE_${network.toUpperCase()}`,
		)
	}

	return candidate
}

// SuiNS package addresses
export const SUINS_PACKAGE_ID = {
	mainnet: '0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0',
	testnet: '0x22fa05f21b1ad71442571f7a5a6d9d7bd7a0e23c0818596ba29d6b6cbcb6d4b0',
} as const

// SuiNS registration config object IDs
export const SUINS_CONFIG_ID = {
	mainnet: '0x03c42dde80ad8e0e0e89fd4c1ec6c7f6e8ef001fd18dea2c5b0bc5d9c4e1a5c8', // TODO: Verify
	testnet: '0x', // TODO: Find testnet config
} as const

// Premium decay constants (must match profile.ts)
const USD_TARGET_VALUE = 10_000_000 // $10M USD target
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const NS_DISCOUNT_DAYS = 3

export interface CreateBountyParams {
	/** SuiNS name (without .sui suffix) */
	name: string
	/** Address that will receive the registered name NFT */
	beneficiary: string
	/** SUI coin object ID to deposit */
	coinObjectId: string
	/** Total amount in MIST (registration cost + executor reward) */
	totalAmountMist: string
	/** Executor reward in MIST (minimum 1 SUI = 1_000_000_000) */
	executorRewardMist: string
	/** When the name becomes available (grace period end timestamp in ms) */
	availableAt: number
	/** Registration duration in years (1-5) */
	years: number
	/** Gas budget in MIST */
	gasBudget?: string
}

export interface ExecuteBountyParams {
	/** Bounty escrow object ID */
	bountyObjectId: string
	/** SuiNS name (without .sui suffix) */
	name: string
	/** Address that will receive the registered name NFT */
	beneficiary: string
	/** Registration duration in years */
	years: number
	/** Clock object ID (usually 0x6) */
	clockObjectId?: string
	/** Gas budget in MIST */
	gasBudget?: string
}

export interface BountyTxResult {
	/** Base64-encoded transaction bytes */
	txBytes: string
	/** Transaction digest (for reference) */
	digest: string
	/** Estimated gas cost in MIST */
	estimatedGas: string
}

/**
 * Calculate the premium cost for a SuiNS name at a given timestamp
 *
 * @param expirationMs - Original expiration timestamp in ms
 * @param targetTimestamp - When the registration will occur (ms)
 * @param suiPriceUsd - Current SUI price in USD
 * @returns Premium amounts in SUI and NS tokens
 */
export function calculatePremium(
	expirationMs: number,
	targetTimestamp: number,
	suiPriceUsd: number,
): { suiPremium: number; nsPremium: number; suiUsdValue: number; nsUsdValue: number } {
	const maxSuiSupply = USD_TARGET_VALUE / suiPriceUsd
	const decayConstant = Math.log(maxSuiSupply)

	const gracePeriodEnd = expirationMs + GRACE_PERIOD_MS
	const totalWindow = gracePeriodEnd - expirationMs
	const elapsed = Math.max(0, targetTimestamp - expirationMs)
	const progress = Math.max(0, Math.min(1, elapsed / totalWindow))

	// Exponential decay: premium = maxSupply * e^(-decayConstant * progress)
	const suiPremium = Math.max(0, Math.round(maxSuiSupply * Math.exp(-decayConstant * progress)))

	// NS has 3-day discount (10% progress offset)
	const nsProgress = Math.min(1, progress + NS_DISCOUNT_DAYS / 30)
	const nsPremium = Math.max(0, Math.round(maxSuiSupply * Math.exp(-decayConstant * nsProgress)))

	return {
		suiPremium,
		nsPremium,
		suiUsdValue: suiPremium * suiPriceUsd,
		nsUsdValue: nsPremium * suiPriceUsd,
	}
}

/**
 * Build transaction to create a bounty escrow
 *
 * This transaction deposits SUI into the escrow contract and creates a shared
 * Bounty object that can be executed when the grace period ends.
 */
export async function buildCreateBountyTx(
	params: CreateBountyParams,
	env: Env,
	networkOverride?: 'mainnet' | 'testnet',
): Promise<Transaction> {
	const packageId = await resolveBountyPackageId(env, networkOverride)
	const tx = new Transaction()

	// Set gas budget
	if (params.gasBudget) {
		tx.setGasBudget(BigInt(params.gasBudget))
	}

	// Split the exact amount from the provided coin
	const [depositCoin] = tx.splitCoins(tx.object(params.coinObjectId), [
		tx.pure.u64(BigInt(params.totalAmountMist)),
	])

	// Call create_and_share_bounty
	tx.moveCall({
		target: `${packageId}::escrow::create_and_share_bounty`,
		arguments: [
			tx.pure.string(params.name),
			tx.pure.address(params.beneficiary),
			depositCoin,
			tx.pure.u64(BigInt(params.executorRewardMist)),
			tx.pure.u64(BigInt(params.availableAt)),
			tx.pure.u8(params.years),
			tx.object('0x6'), // Clock object
		],
	})

	return tx
}

/**
 * Build transaction to create a gift bounty escrow (reward only)
 *
 * This transaction deposits SUI as a reward into the escrow contract.
 * The executor provides their own SUI for the registration.
 */
export async function buildCreateGiftBountyTx(
	params: Pick<
		CreateBountyParams,
		'name' | 'beneficiary' | 'coinObjectId' | 'executorRewardMist' | 'gasBudget'
	>,
	env: Env,
	networkOverride?: 'mainnet' | 'testnet',
): Promise<Transaction> {
	const packageId = await resolveBountyPackageId(env, networkOverride)
	const tx = new Transaction()

	if (params.gasBudget) {
		tx.setGasBudget(BigInt(params.gasBudget))
	}

	const [rewardCoin] = tx.splitCoins(tx.object(params.coinObjectId), [
		tx.pure.u64(BigInt(params.executorRewardMist)),
	])

	tx.moveCall({
		target: `${packageId}::escrow::create_and_share_gift_bounty`,
		arguments: [tx.pure.string(params.name), tx.pure.address(params.beneficiary), rewardCoin],
	})

	return tx
}

/**
 * Build transaction to execute a bounty (register name and claim reward)
 *
 * This PTB performs the following atomically in a single transaction:
 * 1. Calls execute_bounty to release escrowed funds (returns registration_coin, reward_coin, beneficiary)
 * 2. Registers the SuiNS name using the released registration funds
 * 3. Sets the target address on the new NFT to the beneficiary
 * 4. Transfers the NFT to the beneficiary (bounty creator)
 * 5. Executor keeps the reward_coin
 *
 * IMPORTANT: The bounty can only be claimed if the name is transferred to the beneficiary.
 * This atomic transaction ensures the executor cannot take funds without completing registration.
 */
export async function buildExecuteBountyTx(
	params: ExecuteBountyParams,
	env: Env,
): Promise<Transaction> {
	const network = resolveNetwork(env)
	const bountyPackageId = await resolveBountyPackageId(env, network)
	const tx = new Transaction()

	// Set gas budget
	if (params.gasBudget) {
		tx.setGasBudget(BigInt(params.gasBudget))
	}

	const clockId = params.clockObjectId || '0x6'

	// Step 1: Execute bounty - releases escrowed funds
	// Returns: (registration_coin, reward_coin, beneficiary_address)
	const [registrationCoin, rewardCoin, beneficiaryAddr] = tx.moveCall({
		target: `${bountyPackageId}::escrow::execute_bounty`,
		arguments: [tx.object(params.bountyObjectId), tx.object(clockId)],
	})

	// Step 2: Register the SuiNS name using escrowed funds
	const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
	const suinsClient = new SuinsClient({
		client: suiClient,
		network,
	})
	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.SUI
	if (!coinConfig) {
		throw new Error('SuiNS configuration for SUI coin is missing')
	}

	const domain = params.name.endsWith('.sui')
		? params.name.toLowerCase()
		: `${params.name.toLowerCase()}.sui`
	const isSubDomain = domain.replace(/\.sui$/i, '').includes('.')

	// Get price info object ID (required for SUI/NS coin types)
	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	const nft = suinsTx.register({
		domain,
		years: params.years,
		coinConfig,
		coin: registrationCoin,
		priceInfoObjectId,
	})

	// Step 3: Ensure the beneficiary becomes the controller/recipient
	suinsTx.setTargetAddress({
		nft,
		address: params.beneficiary,
		isSubname: isSubDomain,
	})
	tx.transferObjects([nft], beneficiaryAddr)

	// Step 4: Transfer reward to executor (tx sender)
	tx.transferObjects([rewardCoin], tx.gas)

	return tx
}

/**
 * Build transaction to execute a gift bounty (executor pays for registration)
 *
 * This PTB performs the following atomically:
 * 1. Registers the SuiNS name using the executor's own funds (gas coin)
 * 2. Calls claim_gift_reward with the resulting NFT
 * 3. The contract transfers the NFT to the beneficiary and the reward to the executor
 */
export async function buildExecuteGiftBountyTx(
	params: Pick<
		ExecuteBountyParams,
		'bountyObjectId' | 'name' | 'beneficiary' | 'years' | 'gasBudget'
	>,
	env: Env,
): Promise<Transaction> {
	const network = resolveNetwork(env)
	const bountyPackageId = await resolveBountyPackageId(env, network)
	const tx = new Transaction()

	if (params.gasBudget) {
		tx.setGasBudget(BigInt(params.gasBudget))
	}

	const suiClient = new SuiClient({ url: env.SUI_RPC_URL })
	const suinsClient = new SuinsClient({
		client: suiClient,
		network,
	})
	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.SUI
	if (!coinConfig) {
		throw new Error('SuiNS configuration for SUI coin is missing')
	}

	const domain = params.name.endsWith('.sui')
		? params.name.toLowerCase()
		: `${params.name.toLowerCase()}.sui`

	// Get price info object ID (required for SUI/NS coin types)
	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	// Step 1: Register the SuiNS name using executor's funds
	// Split from gas for registration payment
	// We need to estimate the price or get it from params
	// For now, assume the caller adds the payment coin or we split from gas
	const [regCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(10_000_000_000)]) // Placeholder 10 SUI, should be dynamic

	const nft = suinsTx.register({
		domain,
		years: params.years,
		coinConfig,
		coin: regCoin,
		priceInfoObjectId,
	})

	// Step 2: Claim reward by providing the NFT
	tx.moveCall({
		target: `${bountyPackageId}::escrow::claim_gift_reward`,
		arguments: [tx.object(params.bountyObjectId), nft],
	})

	return tx
}

/**
 * Build transaction to cancel a bounty and reclaim funds
 *
 * Only the creator can cancel, and only if the bounty is not locked.
 */
export async function buildCancelBountyTx(
	bountyObjectId: string,
	env: Env,
	gasBudget?: string,
): Promise<Transaction> {
	const packageId = await resolveBountyPackageId(env)
	const tx = new Transaction()

	if (gasBudget) {
		tx.setGasBudget(BigInt(gasBudget))
	}

	tx.moveCall({
		target: `${packageId}::escrow::cancel_bounty`,
		arguments: [tx.object(bountyObjectId)],
	})

	return tx
}

/**
 * Build transaction to lock a bounty (after pre-signing the execution tx)
 */
export async function buildLockBountyTx(
	bountyObjectId: string,
	env: Env,
	gasBudget?: string,
): Promise<Transaction> {
	const packageId = await resolveBountyPackageId(env)
	const tx = new Transaction()

	if (gasBudget) {
		tx.setGasBudget(BigInt(gasBudget))
	}

	tx.moveCall({
		target: `${packageId}::escrow::lock_bounty`,
		arguments: [tx.object(bountyObjectId)],
	})

	return tx
}

/**
 * Build transaction to reclaim an expired bounty
 *
 * Anyone can call this after the bounty expires (7 days after available_at).
 * Funds are returned to the original creator.
 */
export async function buildReclaimExpiredTx(
	bountyObjectId: string,
	env: Env,
	gasBudget?: string,
): Promise<Transaction> {
	const packageId = await resolveBountyPackageId(env)
	const tx = new Transaction()

	if (gasBudget) {
		tx.setGasBudget(BigInt(gasBudget))
	}

	tx.moveCall({
		target: `${packageId}::escrow::reclaim_expired`,
		arguments: [tx.object(bountyObjectId), tx.object('0x6')],
	})

	return tx
}

/**
 * Serialize a transaction for signing
 *
 * @param tx - Transaction to serialize
 * @param env - Environment with RPC URL
 * @param sender - Address of the transaction sender
 * @returns Base64-encoded transaction bytes
 */
export async function serializeTransaction(
	tx: Transaction,
	env: Env,
	sender: string,
): Promise<{ txBytes: string; digest: string }> {
	const client = new SuiClient({ url: env.SUI_RPC_URL })

	tx.setSender(sender)

	const txBytes = await tx.build({ client })
	const digest = await tx.getDigest({ client })

	return {
		txBytes: Buffer.from(txBytes).toString('base64'),
		digest,
	}
}

/**
 * Fetch current SUI price from CoinGecko
 */
export async function fetchSuiPrice(): Promise<number> {
	try {
		const res = await fetch(
			'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd',
		)
		const data = (await res.json()) as { sui?: { usd?: number } }
		return data.sui?.usd ?? 1 // Default to $1 if fetch fails
	} catch {
		return 1 // Default to $1 on error
	}
}
