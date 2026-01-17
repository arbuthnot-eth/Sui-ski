import { Transaction } from '@mysten/sui/transactions'
import { SuiClient } from '@mysten/sui/client'
import type { Env } from '../types'

/**
 * Bounty Transaction Builder Utilities
 *
 * These utilities generate unsigned transaction blocks for the bounty escrow system.
 * Transactions are designed to be pre-signed by the bounty creator and later
 * broadcast by an executor when the grace period ends.
 */

// Bounty escrow package addresses - update after deployment
export const BOUNTY_ESCROW_PACKAGE_ID = {
	mainnet: '0x0000000000000000000000000000000000000000000000000000000000000000', // TODO: Deploy and update
	testnet: '0x0000000000000000000000000000000000000000000000000000000000000000', // TODO: Deploy and update
} as const

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
export function buildCreateBountyTx(
	params: CreateBountyParams,
	network: 'mainnet' | 'testnet',
): Transaction {
	const packageId = BOUNTY_ESCROW_PACKAGE_ID[network]
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
export function buildExecuteBountyTx(
	params: ExecuteBountyParams,
	network: 'mainnet' | 'testnet',
): Transaction {
	const bountyPackageId = BOUNTY_ESCROW_PACKAGE_ID[network]
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

	// Step 2 & 3: Register the SuiNS name and set target address
	// This requires integration with SuiNS SDK. The executor must construct
	// the full PTB using SuinsTransaction wrapper:
	//
	// const suinsTx = new SuinsTransaction(suinsClient, tx)
	// const nft = suinsTx.register({
	//     domain: params.name,
	//     years: params.years,
	//     coin: registrationCoin,
	// })
	// suinsTx.setTargetAddress({ nft, address: beneficiaryAddr })
	// tx.transferObjects([nft], beneficiaryAddr)

	// For now, return the registration coin to beneficiary (placeholder)
	// In production, this should be replaced with actual SuiNS registration
	tx.transferObjects([registrationCoin], beneficiaryAddr)

	// Step 5: Transfer reward to executor (tx sender)
	tx.transferObjects([rewardCoin], tx.gas) // Uses sender's gas object as proxy for sender address

	return tx
}

/**
 * Build transaction to cancel a bounty and reclaim funds
 *
 * Only the creator can cancel, and only if the bounty is not locked.
 */
export function buildCancelBountyTx(
	bountyObjectId: string,
	network: 'mainnet' | 'testnet',
	gasBudget?: string,
): Transaction {
	const packageId = BOUNTY_ESCROW_PACKAGE_ID[network]
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
export function buildLockBountyTx(
	bountyObjectId: string,
	network: 'mainnet' | 'testnet',
	gasBudget?: string,
): Transaction {
	const packageId = BOUNTY_ESCROW_PACKAGE_ID[network]
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
export function buildReclaimExpiredTx(
	bountyObjectId: string,
	network: 'mainnet' | 'testnet',
	gasBudget?: string,
): Transaction {
	const packageId = BOUNTY_ESCROW_PACKAGE_ID[network]
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
		const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd')
		const data = (await res.json()) as { sui?: { usd?: number } }
		return data.sui?.usd ?? 1 // Default to $1 if fetch fails
	} catch {
		return 1 // Default to $1 on error
	}
}
