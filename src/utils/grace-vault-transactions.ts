import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { Transaction, type TransactionObjectArgument } from '@mysten/sui/transactions'
import { mainPackage, SuinsClient, SuinsTransaction } from '@mysten/suins'
import type { Env } from '../types'
import {
	calculateSuiNeededForNs,
	DEEP_TYPE,
	DEEPBOOK_DEEP_SUI_POOL,
	DEEPBOOK_NS_SUI_POOL,
	DEEPBOOK_PACKAGE,
	DEEPBOOK_SUI_USDC_POOL,
	DEFAULT_SLIPPAGE_BPS,
	getNSSuiPrice,
	getUSDCSuiPrice,
	SUI_TYPE,
	USDC_TYPE,
} from './ns-price'
import { calculateRegistrationPrice } from './pricing'
import { getDefaultRpcUrl } from './rpc'

const CLOCK_OBJECT = '0x6'
const DEEP_FEE_PERCENT = 15n
const MIN_DEEP_OUT = 50_000n
const MIN_SUI_FOR_DEEP = 10_000_000n
const DEFAULT_GAS_BUDGET = 150_000_000

type SupportedPaymentAsset = 'sui' | 'usdc' | 'ns'

export interface CreateGraceVaultParams {
	packageId?: string
	senderAddress: string
	domain: string
	beneficiaryAddress: string
	expiredAtMs: number
	years: number
	executorRewardNsMist: bigint
	protocolFeeNsMist?: bigint
	protocolFeeRecipient?: string
	paymentAsset: SupportedPaymentAsset
	paymentCoinObjectIds?: string[]
	maxInputMist?: bigint
	registrationBudgetNsMist?: bigint
	slippageBps?: number
	expirationMs?: number
}

export interface CreateGraceVaultBreakdown {
	paymentAsset: SupportedPaymentAsset
	inputUsedMist: bigint
	registrationBudgetNsMist: bigint
	executorRewardNsMist: bigint
	protocolFeeNsMist: bigint
	totalRequiredNsMist: bigint
}

export interface CreateGraceVaultResult {
	tx: Transaction
	breakdown: CreateGraceVaultBreakdown
}

export interface ExecuteGraceVaultParams {
	packageId?: string
	senderAddress: string
	vaultObjectId: string
	domain: string
	beneficiaryAddress: string
	years: number
}

function getNetwork(env: Env): 'mainnet' | 'testnet' {
	return env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
}

function getPackageId(env: Env, override?: string): string {
	const packageId = override || env.BOUNTY_ESCROW_PACKAGE_ID
	if (!packageId) {
		throw new Error('Bounty escrow package ID is required')
	}
	return packageId
}

function sanitizeName(domain: string): { name: string; fullDomain: string } {
	const name = domain.toLowerCase().replace(/\.sui$/i, '')
	return { name, fullDomain: `${name}.sui` }
}

function getDeepConfig(network: 'mainnet' | 'testnet') {
	const deepbookPackage = DEEPBOOK_PACKAGE[network]
	const nsSuiPool = DEEPBOOK_NS_SUI_POOL[network]
	const deepSuiPool = DEEPBOOK_DEEP_SUI_POOL[network]
	const suiUsdcPool = DEEPBOOK_SUI_USDC_POOL[network]
	if (!deepbookPackage || !nsSuiPool || !deepSuiPool || !suiUsdcPool) {
		throw new Error(`DeepBook pools are not configured on ${network}`)
	}
	return { deepbookPackage, nsSuiPool, deepSuiPool, suiUsdcPool }
}

function mergeCoinsOrThrow(tx: Transaction, coinObjectIds: string[] | undefined, label: string) {
	if (!coinObjectIds?.length) {
		throw new Error(`${label} coin object IDs are required`)
	}
	const primary = tx.object(coinObjectIds[0])
	if (coinObjectIds.length > 1) {
		tx.mergeCoins(
			primary,
			coinObjectIds.slice(1).map((id) => tx.object(id)),
		)
	}
	return primary
}

function estimateUsdcNeededMist(
	suiNeededMist: bigint,
	suiPerUsdc: number,
	slippageBps: number,
): bigint {
	const suiAmount = Number(suiNeededMist) / 1e9
	const usdcBase = suiAmount / suiPerUsdc
	const withSlippage = usdcBase * (1 + slippageBps / 10000)
	return BigInt(Math.ceil(withSlippage * 1e6))
}

function estimateSuiForNs(
	requiredNsMist: bigint,
	slippageBps: number,
	asks: [string, string][] | undefined,
	suiPerNs: number,
) {
	if (asks?.length) {
		const quote = calculateSuiNeededForNs(requiredNsMist, asks, slippageBps)
		return quote.suiNeeded
	}
	const nsAmount = Number(requiredNsMist) / 1e6
	return BigInt(Math.ceil(nsAmount * suiPerNs * (1 + slippageBps / 10000) * 1e9))
}

export async function buildCreateGraceVaultTx(
	params: CreateGraceVaultParams,
	env: Env,
): Promise<CreateGraceVaultResult> {
	const packageId = getPackageId(env, params.packageId)
	const network = getNetwork(env)
	const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS
	const { name, fullDomain } = sanitizeName(params.domain)
	const protocolFeeNsMist = params.protocolFeeNsMist ?? 0n
	const feeRecipient = params.protocolFeeRecipient ?? params.senderAddress

	const registrationBudgetNsMist =
		params.registrationBudgetNsMist ??
		(
			await calculateRegistrationPrice({
				domain: fullDomain,
				years: params.years,
				expirationMs: params.expirationMs,
				env,
			})
		).nsNeededMist

	const totalRequiredNsMist =
		registrationBudgetNsMist + params.executorRewardNsMist + protocolFeeNsMist
	if (totalRequiredNsMist <= 0n) {
		throw new Error('Total NS requirement must be greater than zero')
	}

	const nsType =
		network === 'mainnet' ? mainPackage.mainnet.coins.NS.type : mainPackage.testnet.coins.NS.type

	const tx = new Transaction()
	tx.setSender(params.senderAddress)

	let nsFundingCoin: TransactionObjectArgument
	let inputUsedMist = 0n

	if (params.paymentAsset === 'ns') {
		const nsSource = mergeCoinsOrThrow(tx, params.paymentCoinObjectIds, 'NS')
		const amountToUse = params.maxInputMist ?? totalRequiredNsMist
		if (amountToUse < totalRequiredNsMist) {
			throw new Error('maxInputMist is lower than required NS total')
		}
		const [nsForFlow] = tx.splitCoins(nsSource, [tx.pure.u64(amountToUse)])
		tx.transferObjects([nsSource], params.senderAddress)
		nsFundingCoin = nsForFlow as TransactionObjectArgument
		inputUsedMist = amountToUse
	} else {
		const { deepbookPackage, nsSuiPool, deepSuiPool, suiUsdcPool } = getDeepConfig(network)
		const nsPrice = await getNSSuiPrice(env, true)
		const suiNeededMist = estimateSuiForNs(
			totalRequiredNsMist,
			slippageBps,
			nsPrice.asks,
			nsPrice.suiPerNs,
		)
		const suiForDeepSwap = (() => {
			const byPercent = (suiNeededMist * DEEP_FEE_PERCENT) / 100n
			return byPercent > MIN_SUI_FOR_DEEP ? byPercent : MIN_SUI_FOR_DEEP
		})()

		const [suiForDeep] = tx.splitCoins(tx.gas, [tx.pure.u64(suiForDeepSwap)])
		const [zeroDeep] = tx.moveCall({
			target: '0x2::coin::zero',
			typeArguments: [DEEP_TYPE],
		})
		const [deepCoin, deepSwapSuiLeftover, deepSwapDeepLeftover] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
			typeArguments: [DEEP_TYPE, SUI_TYPE],
			arguments: [
				tx.object(deepSuiPool),
				suiForDeep,
				zeroDeep,
				tx.pure.u64(MIN_DEEP_OUT),
				tx.object(CLOCK_OBJECT),
			],
		})
		tx.transferObjects([deepSwapSuiLeftover, deepSwapDeepLeftover], params.senderAddress)

		if (params.paymentAsset === 'sui') {
			const totalSuiNeededMist = suiNeededMist + suiForDeepSwap
			if (params.maxInputMist && params.maxInputMist < totalSuiNeededMist) {
				throw new Error('maxInputMist is lower than required SUI input')
			}

			const [suiForNsSwap] = tx.splitCoins(tx.gas, [tx.pure.u64(suiNeededMist)])
			const [nsCoin, nsSwapSuiLeftover, nsSwapDeepLeftover] = tx.moveCall({
				target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
				typeArguments: [nsType, SUI_TYPE],
				arguments: [
					tx.object(nsSuiPool),
					suiForNsSwap,
					deepCoin,
					tx.pure.u64(totalRequiredNsMist),
					tx.object(CLOCK_OBJECT),
				],
			})

			tx.transferObjects([nsSwapSuiLeftover, nsSwapDeepLeftover], params.senderAddress)
			nsFundingCoin = nsCoin as TransactionObjectArgument
			inputUsedMist = totalSuiNeededMist
		} else {
			const usdcSource = mergeCoinsOrThrow(tx, params.paymentCoinObjectIds, 'USDC')
			const usdcPrice = await getUSDCSuiPrice(env, true)
			const usdcNeededMist = estimateUsdcNeededMist(
				suiNeededMist,
				usdcPrice.suiPerUsdc,
				slippageBps,
			)

			if (params.maxInputMist && params.maxInputMist < usdcNeededMist) {
				throw new Error('maxInputMist is lower than required USDC input')
			}

			const [usdcForSwap] = tx.splitCoins(usdcSource, [tx.pure.u64(usdcNeededMist)])
			tx.transferObjects([usdcSource], params.senderAddress)

			const [suiFromUsdc, usdcLeftover, deepAfterUsdcSwap] = tx.moveCall({
				target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
				typeArguments: [SUI_TYPE, USDC_TYPE],
				arguments: [
					tx.object(suiUsdcPool),
					usdcForSwap,
					deepCoin,
					tx.pure.u64(suiNeededMist),
					tx.object(CLOCK_OBJECT),
				],
			})

			const [nsCoin, nsSwapSuiLeftover, nsSwapDeepLeftover] = tx.moveCall({
				target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
				typeArguments: [nsType, SUI_TYPE],
				arguments: [
					tx.object(nsSuiPool),
					suiFromUsdc,
					deepAfterUsdcSwap,
					tx.pure.u64(totalRequiredNsMist),
					tx.object(CLOCK_OBJECT),
				],
			})

			tx.transferObjects(
				[usdcLeftover, nsSwapSuiLeftover, nsSwapDeepLeftover],
				params.senderAddress,
			)

			nsFundingCoin = nsCoin as TransactionObjectArgument
			inputUsedMist = usdcNeededMist
		}
	}

	const [vaultFundingCoin] = tx.splitCoins(nsFundingCoin, [tx.pure.u64(totalRequiredNsMist)])
	tx.transferObjects([nsFundingCoin], params.senderAddress)

	tx.moveCall({
		target: `${packageId}::grace_registration::create_and_share_vault`,
		typeArguments: [nsType],
		arguments: [
			tx.pure.string(name),
			tx.pure.address(params.beneficiaryAddress),
			tx.pure.u64(BigInt(params.expiredAtMs)),
			tx.pure.u8(params.years),
			tx.pure.u64(registrationBudgetNsMist),
			tx.pure.u64(params.executorRewardNsMist),
			tx.pure.u64(protocolFeeNsMist),
			tx.pure.address(feeRecipient),
			vaultFundingCoin,
			tx.object(CLOCK_OBJECT),
		],
	})

	tx.setGasBudget(DEFAULT_GAS_BUDGET)

	return {
		tx,
		breakdown: {
			paymentAsset: params.paymentAsset,
			inputUsedMist,
			registrationBudgetNsMist,
			executorRewardNsMist: params.executorRewardNsMist,
			protocolFeeNsMist,
			totalRequiredNsMist,
		},
	}
}

export async function buildExecuteGraceVaultTx(
	params: ExecuteGraceVaultParams,
	env: Env,
): Promise<Transaction> {
	const packageId = getPackageId(env, params.packageId)
	const network = getNetwork(env)
	const nsType =
		network === 'mainnet' ? mainPackage.mainnet.coins.NS.type : mainPackage.testnet.coins.NS.type
	const suinsPackage = network === 'mainnet' ? mainPackage.mainnet.suins : mainPackage.testnet.suins
	const suinsRegistrationType = `${suinsPackage}::suins_registration::SuinsRegistration`
	const { fullDomain } = sanitizeName(params.domain)

	const client = new SuiClient({
		url: env.SUI_RPC_URL || getDefaultRpcUrl(env.SUI_NETWORK),
		network: env.SUI_NETWORK,
	})
	const suinsClient = new SuinsClient({ client: client as never, network })

	const tx = new Transaction()
	tx.setSender(params.senderAddress)

	const [nsBudget, permit] = tx.moveCall({
		target: `${packageId}::grace_registration::execute_and_take_budget`,
		typeArguments: [nsType],
		arguments: [tx.object(params.vaultObjectId), tx.object(CLOCK_OBJECT)],
	})

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.NS
	if (!coinConfig) {
		throw new Error('SuiNS NS coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	const nft = suinsTx.register({
		domain: fullDomain,
		years: params.years,
		coinConfig,
		coin: nsBudget,
		priceInfoObjectId,
	})

	suinsTx.setTargetAddress({
		nft,
		address: params.beneficiaryAddress,
		isSubname: fullDomain.replace(/\.sui$/i, '').includes('.'),
	})

	tx.moveCall({
		target: `${packageId}::grace_registration::finalize_execution`,
		typeArguments: [suinsRegistrationType, nsType],
		arguments: [tx.object(params.vaultObjectId), permit, nft, tx.object(CLOCK_OBJECT)],
	})

	tx.setGasBudget(DEFAULT_GAS_BUDGET)
	return tx
}
