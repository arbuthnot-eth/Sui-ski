import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { Transaction, TransactionDataBuilder } from '@mysten/sui/transactions'
import { SuinsClient, SuinsTransaction } from '@mysten/suins'
import type { Env } from '../types'
import {
	calculateSuiNeededForNs,
	DEEP_TYPE,
	DEEPBOOK_NS_SUI_POOL,
	DEEPBOOK_PACKAGE,
	DEEPBOOK_SUI_USDC_POOL,
	DEFAULT_SLIPPAGE_BPS,
	getDeepBookSuiPools,
	getNSSuiPrice,
	NS_SCALE,
	NS_TYPE_MAINNET,
	SUI_TYPE,
	simulateBuyNsWithSui,
	USDC_TYPE,
} from './ns-price'
import { calculateRegistrationPrice, calculateRenewalPrice } from './pricing'
import { getDefaultRpcUrl } from './rpc'

const CLOCK_OBJECT = '0x6'
const DUST_SINK_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000'

async function resolveFeeRecipient(
	client: SuiClient,
	suinsClient: SuinsClient,
	feeName: string | undefined,
	fallback: string,
): Promise<string> {
	if (!feeName) return fallback
	const normalizedName = feeName.replace(/\.sui$/i, '') + '.sui'
	try {
		const record = await suinsClient.getNameRecord(normalizedName)
		if (record?.targetAddress && /^0x[a-fA-F0-9]{64}$/.test(record.targetAddress)) {
			return record.targetAddress
		}
	} catch {
		// try fallback resolver below
	}
	try {
		const resolved = await client.resolveNameServiceAddress({ name: normalizedName })
		if (resolved && /^0x[a-fA-F0-9]{64}$/.test(resolved)) {
			return resolved
		}
	} catch {
		// use fallback
	}
	try {
		if (/^0x[a-fA-F0-9]{64}$/.test(fallback)) {
			return fallback
		}
		const resolvedFallback = await client.resolveNameServiceAddress({
			name: fallback.replace(/\.sui$/i, '') + '.sui',
		})
		if (resolvedFallback && /^0x[a-fA-F0-9]{64}$/.test(resolvedFallback)) {
			return resolvedFallback
		}
	} catch {
		// use raw fallback
	}
	try {
		const recordFallback = await suinsClient.getNameRecord(fallback.replace(/\.sui$/i, '') + '.sui')
		if (recordFallback?.targetAddress && /^0x[a-fA-F0-9]{64}$/.test(recordFallback.targetAddress)) {
			return recordFallback.targetAddress
		}
	} catch {
		// use raw fallback
	}
	if (/^0x[a-fA-F0-9]{64}$/.test(fallback)) {
		return fallback
	}
	return fallback
}

export interface SwapRegisterParams {
	domain: string
	years: number
	senderAddress: string
	slippageBps?: number
	expirationMs?: number
}

export interface SwapBreakdown {
	suiInputMist: bigint
	nsOutputEstimate: bigint
	registrationCostNsMist: bigint
	slippageBps: number
	nsPerSui: number
	source: 'deepbook' | 'fallback'
	priceImpactBps: number
	minNsOutput: bigint
	feeRecipient?: string
}

export interface SwapRegisterResult {
	tx: Transaction
	breakdown: SwapBreakdown
}

export interface MultiCoinRegisterParams {
	domain: string
	years: number
	senderAddress: string
	sourceCoinType: string
	coinObjectIds: string[]
	slippageBps?: number
	expirationMs?: number
	extraSuiForFeesMist?: bigint
}

export interface MultiCoinRegisterResult {
	tx: Transaction
	breakdown: SwapBreakdown & {
		sourceCoinType: string
		sourceTokensNeeded: string
	}
}

export async function buildSwapAndRegisterTx(
	params: SwapRegisterParams,
	env: Env,
): Promise<SwapRegisterResult> {
	const { domain, years, senderAddress, expirationMs } = params
	const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS

	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

	const [pricing, nsPrice] = await Promise.all([
		calculateRegistrationPrice({ domain: cleanDomain, years, expirationMs, env }),
		getNSSuiPrice(env, true),
	])

	const registrationCostNsMist = pricing.nsNeededMist

	const nsPoolAddress = DEEPBOOK_NS_SUI_POOL[network]
	const deepbookPackage = DEEPBOOK_PACKAGE[network]

	if (!nsPoolAddress || !deepbookPackage) {
		throw new Error(`DeepBook pools not available on ${network}`)
	}

	let suiForNsSwap: bigint
	let minNsOutput: bigint
	let expectedNsOutput: bigint
	let priceImpactBps = 0

	if (nsPrice.asks?.length) {
		const wideSlippage = Math.max(slippageBps, 1500)
		const quote = calculateSuiNeededForNs(registrationCostNsMist, nsPrice.asks, wideSlippage)
		suiForNsSwap = quote.suiNeeded
		expectedNsOutput = quote.expectedNs
		minNsOutput = registrationCostNsMist

		const simResult = simulateBuyNsWithSui(suiForNsSwap, nsPrice.asks)
		priceImpactBps = simResult.priceImpactBps

		if (simResult.outputNs < minNsOutput) {
			const extraBuffer = (suiForNsSwap * 30n) / 100n
			suiForNsSwap = suiForNsSwap + extraBuffer
		}
	} else {
		const bufferBps = Math.max(slippageBps * 3, 3000)
		const nsWithBuffer =
			registrationCostNsMist + (registrationCostNsMist * BigInt(bufferBps)) / 10000n
		const nsTokens = Number(nsWithBuffer) / NS_SCALE
		suiForNsSwap = BigInt(Math.ceil(nsTokens * nsPrice.suiPerNs * 1e9))
		expectedNsOutput = nsWithBuffer
		minNsOutput = registrationCostNsMist
	}

	const suiInputMist = suiForNsSwap

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const [suiCoinForNs] = tx.splitCoins(tx.gas, [tx.pure.u64(suiForNsSwap)])

	const [zeroDeepCoin] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const [nsCoin, nsLeftoverSui, nsLeftoverDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			suiCoinForNs,
			zeroDeepCoin,
			tx.pure.u64(minNsOutput),
			tx.object(CLOCK_OBJECT),
		],
	})

	tx.transferObjects([nsLeftoverSui, nsLeftoverDeep], senderAddress)

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.NS
	if (!coinConfig) {
		throw new Error('SuiNS NS coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	const nft = suinsTx.register({
		domain: cleanDomain,
		years,
		coinConfig,
		coin: nsCoin,
		priceInfoObjectId,
	})

	suinsTx.setTargetAddress({
		nft,
		address: senderAddress,
		isSubname: cleanDomain.replace(/\.sui$/i, '').includes('.'),
	})

	tx.transferObjects([nft], senderAddress)

	const feeRecipient = await resolveFeeRecipient(
		client,
		suinsClient,
		env.SERVICE_FEE_NAME,
		senderAddress,
	)
	tx.transferObjects([nsCoin], feeRecipient)

	tx.setGasBudget(100_000_000)

	return {
		tx,
		breakdown: {
			suiInputMist,
			nsOutputEstimate: expectedNsOutput,
			registrationCostNsMist,
			slippageBps,
			nsPerSui: nsPrice.nsPerSui,
			source: nsPrice.source,
			priceImpactBps,
			minNsOutput,
			feeRecipient,
		},
	}
}

export async function buildMultiCoinRegisterTx(
	params: MultiCoinRegisterParams,
	env: Env,
): Promise<MultiCoinRegisterResult> {
	const { domain, years, senderAddress, sourceCoinType, coinObjectIds, expirationMs } = params
	const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS

	if (!coinObjectIds.length) {
		throw new Error('At least one coin object ID is required')
	}

	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

	const [pricing, nsPrice, pools] = await Promise.all([
		calculateRegistrationPrice({ domain: cleanDomain, years, expirationMs, env }),
		getNSSuiPrice(env, true),
		getDeepBookSuiPools(env),
	])

	const pool = pools.find((p) => p.coinType === sourceCoinType)
	if (!pool) {
		throw new Error(`No DeepBook pool found for coin type: ${sourceCoinType}`)
	}

	const registrationCostNsMist = pricing.nsNeededMist

	const nsPoolAddress = DEEPBOOK_NS_SUI_POOL[network]
	const deepbookPackage = DEEPBOOK_PACKAGE[network]

	if (!nsPoolAddress || !deepbookPackage) {
		throw new Error(`DeepBook pools not available on ${network}`)
	}

	let suiForNsSwap: bigint
	let minNsOutput: bigint
	let expectedNsOutput: bigint
	let priceImpactBps = 0

	if (nsPrice.asks?.length) {
		const wideSlippage = Math.max(slippageBps, 1500)
		const quote = calculateSuiNeededForNs(registrationCostNsMist, nsPrice.asks, wideSlippage)
		suiForNsSwap = quote.suiNeeded
		expectedNsOutput = quote.expectedNs
		minNsOutput = registrationCostNsMist

		const simResult = simulateBuyNsWithSui(suiForNsSwap, nsPrice.asks)
		priceImpactBps = simResult.priceImpactBps

		if (simResult.outputNs < minNsOutput) {
			suiForNsSwap = suiForNsSwap + (suiForNsSwap * 30n) / 100n
		}
	} else {
		const bufferBps = Math.max(slippageBps * 3, 3000)
		const nsWithBuffer =
			registrationCostNsMist + (registrationCostNsMist * BigInt(bufferBps)) / 10000n
		const nsTokens = Number(nsWithBuffer) / NS_SCALE
		suiForNsSwap = BigInt(Math.ceil(nsTokens * nsPrice.suiPerNs * 1e9))
		expectedNsOutput = nsWithBuffer
		minNsOutput = registrationCostNsMist
	}

	const extraSui = params.extraSuiForFeesMist ?? 0n
	const totalSuiNeeded = suiForNsSwap + extraSui

	const tokensNeededFloat = Number(totalSuiNeeded) / 1e9 / pool.suiPerToken
	const tokenMistNeeded = BigInt(Math.ceil(tokensNeededFloat * 10 ** pool.decimals))
	const tokenMistWithSlippage =
		tokenMistNeeded + (tokenMistNeeded * BigInt(Math.max(slippageBps, 500))) / 10000n

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const sourceCoin = tx.object(coinObjectIds[0])
	if (coinObjectIds.length > 1) {
		tx.mergeCoins(
			sourceCoin,
			coinObjectIds.slice(1).map((id) => tx.object(id)),
		)
	}

	const [tokenToSell] = tx.splitCoins(sourceCoin, [tx.pure.u64(tokenMistWithSlippage)])

	const [zeroDeepCoin] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const minSuiFromSwap = suiForNsSwap - (suiForNsSwap * BigInt(Math.max(slippageBps, 500))) / 10000n

	let swappedSuiCoin: ReturnType<Transaction['moveCall']>[0]
	if (!pool.isDirect) {
		const suiUsdcPoolAddress = DEEPBOOK_SUI_USDC_POOL[network]
		if (!suiUsdcPoolAddress) {
			throw new Error('SUI/USDC pool not available for indirect swap')
		}
		const [zeroDeep1] = tx.moveCall({
			target: '0x2::coin::zero',
			typeArguments: [DEEP_TYPE],
		})
		const [tokenLeft1, usdcOut, deepLeft1] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
			typeArguments: [sourceCoinType, USDC_TYPE],
			arguments: [
				tx.object(pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(0n),
				tx.object(CLOCK_OBJECT),
			],
		})
		const [suiOut, usdcLeft, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
			typeArguments: [SUI_TYPE, USDC_TYPE],
			arguments: [
				tx.object(suiUsdcPoolAddress),
				usdcOut,
				zeroDeep1,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSuiCoin = suiOut
		tx.transferObjects([tokenLeft1, usdcLeft, deepLeft1, deepLeft2, sourceCoin], senderAddress)
	} else if (pool.suiIsBase) {
		const [suiOut, tokenLeft, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
			typeArguments: [SUI_TYPE, sourceCoinType],
			arguments: [
				tx.object(pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSuiCoin = suiOut
		tx.transferObjects([tokenLeft, deepLeft2, sourceCoin], senderAddress)
	} else {
		const [tokenLeft, suiOut, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
			typeArguments: [sourceCoinType, SUI_TYPE],
			arguments: [
				tx.object(pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSuiCoin = suiOut
		tx.transferObjects([tokenLeft, deepLeft2, sourceCoin], senderAddress)
	}

	const [suiCoinForNs] = tx.splitCoins(swappedSuiCoin, [tx.pure.u64(suiForNsSwap)])
	tx.mergeCoins(tx.gas, [swappedSuiCoin])

	const [zeroDeepForNs] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const [nsCoin, nsLeftoverSui, nsLeftoverDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			suiCoinForNs,
			zeroDeepForNs,
			tx.pure.u64(minNsOutput),
			tx.object(CLOCK_OBJECT),
		],
	})

	tx.transferObjects([nsLeftoverSui, nsLeftoverDeep], senderAddress)

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.NS
	if (!coinConfig) {
		throw new Error('SuiNS NS coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	const nft = suinsTx.register({
		domain: cleanDomain,
		years,
		coinConfig,
		coin: nsCoin,
		priceInfoObjectId,
	})

	suinsTx.setTargetAddress({
		nft,
		address: senderAddress,
		isSubname: cleanDomain.replace(/\.sui$/i, '').includes('.'),
	})

	tx.transferObjects([nft], senderAddress)

	const feeRecipient = await resolveFeeRecipient(
		client,
		suinsClient,
		env.SERVICE_FEE_NAME,
		senderAddress,
	)
	tx.transferObjects([nsCoin], feeRecipient)
	tx.setGasBudget(100_000_000)

	return {
		tx,
		breakdown: {
			suiInputMist: totalSuiNeeded,
			nsOutputEstimate: expectedNsOutput,
			registrationCostNsMist,
			slippageBps,
			nsPerSui: nsPrice.nsPerSui,
			source: nsPrice.source,
			priceImpactBps,
			minNsOutput,
			feeRecipient,
			sourceCoinType,
			sourceTokensNeeded: String(tokenMistWithSlippage),
		},
	}
}

export async function buildDirectNsRegisterTx(
	params: Omit<SwapRegisterParams, 'slippageBps'> & { nsCoinObjectId: string },
	env: Env,
): Promise<Transaction> {
	const { domain, years, senderAddress, nsCoinObjectId, expirationMs } = params
	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const pricing = await calculateRegistrationPrice({
		domain: cleanDomain,
		years,
		expirationMs,
		env,
	})

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.NS
	if (!coinConfig) {
		throw new Error('SuiNS NS coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	const [paymentCoin] = tx.splitCoins(tx.object(nsCoinObjectId), [
		tx.pure.u64(pricing.nsNeededMist),
	])

	const nft = suinsTx.register({
		domain: cleanDomain,
		years,
		coinConfig,
		coin: paymentCoin,
		priceInfoObjectId,
	})

	suinsTx.setTargetAddress({
		nft,
		address: senderAddress,
		isSubname: cleanDomain.replace(/\.sui$/i, '').includes('.'),
	})

	tx.transferObjects([nft], senderAddress)
	tx.setGasBudget(100_000_000)

	return tx
}

export async function buildSuiRegisterTx(
	params: Omit<SwapRegisterParams, 'slippageBps'>,
	env: Env,
): Promise<Transaction> {
	const { domain, years, senderAddress, expirationMs } = params
	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const pricing = await calculateRegistrationPrice({
		domain: cleanDomain,
		years,
		expirationMs,
		env,
	})

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.SUI
	if (!coinConfig) {
		throw new Error('SuiNS SUI coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	const priceWithBuffer = pricing.directSuiMist + (pricing.directSuiMist * 1n) / 100n
	const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceWithBuffer)])

	const nft = suinsTx.register({
		domain: cleanDomain,
		years,
		coinConfig,
		coin: paymentCoin,
		priceInfoObjectId,
	})

	suinsTx.setTargetAddress({
		nft,
		address: senderAddress,
		isSubname: cleanDomain.replace(/\.sui$/i, '').includes('.'),
	})

	tx.transferObjects([nft], senderAddress)
	tx.mergeCoins(tx.gas, [paymentCoin])
	tx.setGasBudget(100_000_000)

	return tx
}

export interface SwapRenewParams {
	domain: string
	nftId: string
	years: number
	senderAddress: string
	slippageBps?: number
}

export interface SwapRenewResult {
	tx: Transaction
	breakdown: SwapBreakdown
}

export async function buildSwapAndRenewTx(
	params: SwapRenewParams,
	env: Env,
): Promise<SwapRenewResult> {
	const { domain, years, senderAddress, nftId } = params
	const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS

	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

	const [pricing, nsPrice] = await Promise.all([
		calculateRenewalPrice({ domain: cleanDomain, years, env }),
		getNSSuiPrice(env, true),
	])

	const renewalCostNsMist = pricing.nsNeededMist

	const nsPoolAddress = DEEPBOOK_NS_SUI_POOL[network]
	const deepbookPackage = DEEPBOOK_PACKAGE[network]

	if (!nsPoolAddress || !deepbookPackage) {
		throw new Error(`DeepBook pools not available on ${network}`)
	}

	let suiForNsSwap: bigint
	let minNsOutput: bigint
	let expectedNsOutput: bigint
	let priceImpactBps = 0

	if (nsPrice.asks?.length) {
		const wideSlippage = Math.max(slippageBps, 1500)
		const quote = calculateSuiNeededForNs(renewalCostNsMist, nsPrice.asks, wideSlippage)
		suiForNsSwap = quote.suiNeeded
		expectedNsOutput = quote.expectedNs
		minNsOutput = renewalCostNsMist

		const simResult = simulateBuyNsWithSui(suiForNsSwap, nsPrice.asks)
		priceImpactBps = simResult.priceImpactBps

		if (simResult.outputNs < minNsOutput) {
			const extraBuffer = (suiForNsSwap * 30n) / 100n
			suiForNsSwap = suiForNsSwap + extraBuffer
		}
	} else {
		const bufferBps = Math.max(slippageBps * 3, 3000)
		const nsWithBuffer = renewalCostNsMist + (renewalCostNsMist * BigInt(bufferBps)) / 10000n
		const nsTokens = Number(nsWithBuffer) / NS_SCALE
		suiForNsSwap = BigInt(Math.ceil(nsTokens * nsPrice.suiPerNs * 1e9))
		expectedNsOutput = nsWithBuffer
		minNsOutput = renewalCostNsMist
	}

	const suiInputMist = suiForNsSwap

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const [suiCoinForNs] = tx.splitCoins(tx.gas, [tx.pure.u64(suiForNsSwap)])

	const [zeroDeepCoin] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const [nsCoin, nsLeftoverSui, nsLeftoverDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			suiCoinForNs,
			zeroDeepCoin,
			tx.pure.u64(minNsOutput),
			tx.object(CLOCK_OBJECT),
		],
	})

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.NS
	if (!coinConfig) {
		throw new Error('SuiNS NS coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	suinsTx.renew({
		nft: tx.object(nftId),
		years,
		coinConfig,
		coin: nsCoin,
		priceInfoObjectId,
	})

	const feeRecipient = await resolveFeeRecipient(
		client,
		suinsClient,
		env.DISCOUNT_RECIPIENT_NAME || 'extra.sui',
		senderAddress,
	)
	const senderLower = senderAddress.toLowerCase()
	const feeRecipientLower = feeRecipient.toLowerCase()
	const residualRecipient = feeRecipientLower === senderLower ? DUST_SINK_ADDRESS : feeRecipient

	const [postRenewNsLeftover, nsSweepSui, nsSweepDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			nsCoin,
			nsLeftoverDeep,
			tx.pure.u64(0),
			tx.object(CLOCK_OBJECT),
		],
	})

	const [postRenewNsLeftoverDust, nsSweepSuiDust, nsSweepDeepDust] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			postRenewNsLeftover,
			nsSweepDeep,
			tx.pure.u64(0),
			tx.object(CLOCK_OBJECT),
		],
	})

	tx.mergeCoins(nsLeftoverSui, [nsSweepSui, nsSweepSuiDust])
	tx.transferObjects([nsLeftoverSui], feeRecipient)
	tx.transferObjects([postRenewNsLeftoverDust, nsSweepDeepDust], residualRecipient)
	tx.setGasBudget(100_000_000)

	return {
		tx,
		breakdown: {
			suiInputMist,
			nsOutputEstimate: expectedNsOutput,
			registrationCostNsMist: renewalCostNsMist,
			slippageBps,
			nsPerSui: nsPrice.nsPerSui,
			source: nsPrice.source,
			priceImpactBps,
			minNsOutput,
			feeRecipient,
		},
	}
}

export async function buildSuiRenewTx(
	params: Omit<SwapRenewParams, 'slippageBps'>,
	env: Env,
): Promise<Transaction> {
	const { domain, years, senderAddress, nftId } = params
	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const pricing = await calculateRenewalPrice({
		domain: cleanDomain,
		years,
		env,
	})

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.SUI
	if (!coinConfig) {
		throw new Error('SuiNS SUI coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	const priceWithBuffer = pricing.directSuiMist + (pricing.directSuiMist * 1n) / 100n
	const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceWithBuffer)])

	suinsTx.renew({
		nft: tx.object(nftId),
		years,
		coinConfig,
		coin: paymentCoin,
		priceInfoObjectId,
	})
	tx.mergeCoins(tx.gas, [paymentCoin])

	tx.setGasBudget(100_000_000)

	return tx
}

export interface MultiCoinRenewParams {
	domain: string
	nftId: string
	years: number
	senderAddress: string
	sourceCoinType: string
	coinObjectIds: string[]
	slippageBps?: number
}

export interface MultiCoinRenewResult {
	tx: Transaction
	breakdown: SwapBreakdown & {
		sourceCoinType: string
		sourceTokensNeeded: string
	}
}

export async function buildMultiCoinRenewTx(
	params: MultiCoinRenewParams,
	env: Env,
): Promise<MultiCoinRenewResult> {
	const { domain, years, senderAddress, nftId, sourceCoinType, coinObjectIds } = params
	const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS

	if (!coinObjectIds.length) {
		throw new Error('At least one coin object ID is required')
	}

	const cleanDomain = `${domain.toLowerCase().replace(/\.sui$/i, '')}.sui`
	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'

	const [pricing, nsPrice, pools] = await Promise.all([
		calculateRenewalPrice({ domain: cleanDomain, years, env }),
		getNSSuiPrice(env, true),
		getDeepBookSuiPools(env),
	])

	const pool = pools.find((p) => p.coinType === sourceCoinType)
	if (!pool) {
		throw new Error(`No DeepBook pool found for coin type: ${sourceCoinType}`)
	}

	const renewalCostNsMist = pricing.nsNeededMist

	const nsPoolAddress = DEEPBOOK_NS_SUI_POOL[network]
	const deepbookPackage = DEEPBOOK_PACKAGE[network]

	if (!nsPoolAddress || !deepbookPackage) {
		throw new Error(`DeepBook pools not available on ${network}`)
	}

	let suiForNsSwap: bigint
	let minNsOutput: bigint
	let expectedNsOutput: bigint
	let priceImpactBps = 0

	if (nsPrice.asks?.length) {
		const wideSlippage = Math.max(slippageBps, 1500)
		const quote = calculateSuiNeededForNs(renewalCostNsMist, nsPrice.asks, wideSlippage)
		suiForNsSwap = quote.suiNeeded
		expectedNsOutput = quote.expectedNs
		minNsOutput = renewalCostNsMist

		const simResult = simulateBuyNsWithSui(suiForNsSwap, nsPrice.asks)
		priceImpactBps = simResult.priceImpactBps

		if (simResult.outputNs < minNsOutput) {
			suiForNsSwap = suiForNsSwap + (suiForNsSwap * 30n) / 100n
		}
	} else {
		const bufferBps = Math.max(slippageBps * 3, 3000)
		const nsWithBuffer = renewalCostNsMist + (renewalCostNsMist * BigInt(bufferBps)) / 10000n
		const nsTokens = Number(nsWithBuffer) / NS_SCALE
		suiForNsSwap = BigInt(Math.ceil(nsTokens * nsPrice.suiPerNs * 1e9))
		expectedNsOutput = nsWithBuffer
		minNsOutput = renewalCostNsMist
	}

	const totalSuiNeeded = suiForNsSwap

	const tokensNeededFloat = Number(totalSuiNeeded) / 1e9 / pool.suiPerToken
	const tokenMistNeeded = BigInt(Math.ceil(tokensNeededFloat * 10 ** pool.decimals))
	const tokenMistWithSlippage =
		tokenMistNeeded + (tokenMistNeeded * BigInt(Math.max(slippageBps, 500))) / 10000n

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const sourceCoin = tx.object(coinObjectIds[0])
	if (coinObjectIds.length > 1) {
		tx.mergeCoins(
			sourceCoin,
			coinObjectIds.slice(1).map((id) => tx.object(id)),
		)
	}

	const [tokenToSell] = tx.splitCoins(sourceCoin, [tx.pure.u64(tokenMistWithSlippage)])

	const [zeroDeepCoin] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const minSuiFromSwap = suiForNsSwap - (suiForNsSwap * BigInt(Math.max(slippageBps, 500))) / 10000n

	let swappedSuiCoin: ReturnType<Transaction['moveCall']>[0]
	if (!pool.isDirect) {
		const suiUsdcPoolAddress = DEEPBOOK_SUI_USDC_POOL[network]
		if (!suiUsdcPoolAddress) {
			throw new Error('SUI/USDC pool not available for indirect swap')
		}
		const [zeroDeep1] = tx.moveCall({
			target: '0x2::coin::zero',
			typeArguments: [DEEP_TYPE],
		})
		const [tokenLeft1, usdcOut, deepLeft1] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
			typeArguments: [sourceCoinType, USDC_TYPE],
			arguments: [
				tx.object(pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(0n),
				tx.object(CLOCK_OBJECT),
			],
		})
		const [suiOut, usdcLeft, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
			typeArguments: [SUI_TYPE, USDC_TYPE],
			arguments: [
				tx.object(suiUsdcPoolAddress),
				usdcOut,
				zeroDeep1,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSuiCoin = suiOut
		tx.transferObjects([tokenLeft1, usdcLeft, deepLeft1, deepLeft2, sourceCoin], senderAddress)
	} else if (pool.suiIsBase) {
		const [suiOut, tokenLeft, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
			typeArguments: [SUI_TYPE, sourceCoinType],
			arguments: [
				tx.object(pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSuiCoin = suiOut
		tx.transferObjects([tokenLeft, deepLeft2, sourceCoin], senderAddress)
	} else {
		const [tokenLeft, suiOut, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
			typeArguments: [sourceCoinType, SUI_TYPE],
			arguments: [
				tx.object(pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSuiCoin = suiOut
		tx.transferObjects([tokenLeft, deepLeft2, sourceCoin], senderAddress)
	}

	const [suiCoinForNs] = tx.splitCoins(swappedSuiCoin, [tx.pure.u64(suiForNsSwap)])
	tx.mergeCoins(tx.gas, [swappedSuiCoin])

	const [zeroDeepForNs] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const [nsCoin, nsLeftoverSui, nsLeftoverDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			suiCoinForNs,
			zeroDeepForNs,
			tx.pure.u64(minNsOutput),
			tx.object(CLOCK_OBJECT),
		],
	})

	const suinsTx = new SuinsTransaction(suinsClient, tx)
	const coinConfig = suinsClient.config.coins.NS
	if (!coinConfig) {
		throw new Error('SuiNS NS coin configuration not found')
	}

	const priceInfoObjectId = coinConfig.feed
		? (await suinsClient.getPriceInfoObject(tx, coinConfig.feed))[0]
		: undefined

	suinsTx.renew({
		nft: tx.object(nftId),
		years,
		coinConfig,
		coin: nsCoin,
		priceInfoObjectId,
	})

	const feeRecipient = await resolveFeeRecipient(
		client,
		suinsClient,
		env.DISCOUNT_RECIPIENT_NAME || 'extra.sui',
		senderAddress,
	)
	const senderLower = senderAddress.toLowerCase()
	const feeRecipientLower = feeRecipient.toLowerCase()
	const residualRecipient = feeRecipientLower === senderLower ? DUST_SINK_ADDRESS : feeRecipient

	const [postRenewNsLeftover, nsSweepSui, nsSweepDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			nsCoin,
			nsLeftoverDeep,
			tx.pure.u64(0),
			tx.object(CLOCK_OBJECT),
		],
	})

	const [postRenewNsLeftoverDust, nsSweepSuiDust, nsSweepDeepDust] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			postRenewNsLeftover,
			nsSweepDeep,
			tx.pure.u64(0),
			tx.object(CLOCK_OBJECT),
		],
	})

	tx.mergeCoins(nsLeftoverSui, [nsSweepSui, nsSweepSuiDust])
	tx.transferObjects([nsLeftoverSui], feeRecipient)
	tx.transferObjects([postRenewNsLeftoverDust, nsSweepDeepDust], residualRecipient)
	tx.setGasBudget(100_000_000)

	return {
		tx,
		breakdown: {
			suiInputMist: totalSuiNeeded,
			nsOutputEstimate: expectedNsOutput,
			registrationCostNsMist: renewalCostNsMist,
			slippageBps,
			nsPerSui: nsPrice.nsPerSui,
			source: nsPrice.source,
			priceImpactBps,
			minNsOutput,
			feeRecipient,
			sourceCoinType,
			sourceTokensNeeded: String(tokenMistWithSlippage),
		},
	}
}

export interface GasSwapInfo {
	pool: import('./ns-price').SwappablePool
	coinObjectIds: string[]
	amountToSell: bigint
	minSuiOut: bigint
	tokenCoinType: string
}

async function findBestGasSwap(
	client: SuiClient,
	sender: string,
	shortfallMist: bigint,
	env: Env,
): Promise<GasSwapInfo | null> {
	const pools = await getDeepBookSuiPools(env)
	if (pools.length === 0) return null

	const poolBalances = await Promise.all(
		pools.map((p) => client.getBalance({ owner: sender, coinType: p.coinType })),
	)

	const candidates: Array<{ pool: (typeof pools)[0]; balance: bigint }> = []
	for (let i = 0; i < pools.length; i++) {
		const bal = BigInt(poolBalances[i]?.totalBalance ?? '0')
		if (bal > 0n) candidates.push({ pool: pools[i], balance: bal })
	}
	if (candidates.length === 0) return null

	const slippageBps = Math.max(DEFAULT_SLIPPAGE_BPS, 800)
	let best: GasSwapInfo | null = null
	let bestSuiValue = 0n

	for (const { pool, balance } of candidates) {
		const shortfallSui = Number(shortfallMist) / 1e9
		const tokensNeeded = shortfallSui / pool.suiPerToken
		const tokenMistNeeded = BigInt(Math.ceil(tokensNeeded * 10 ** pool.decimals))
		const tokenMistWithBuffer = (tokenMistNeeded * BigInt(10000 + slippageBps)) / 10000n
		const maxSellable = (balance * 95n) / 100n
		const amountToSell =
			tokenMistWithBuffer > maxSellable ? maxSellable : tokenMistWithBuffer

		const expectedSui =
			(Number(amountToSell) / 10 ** pool.decimals) * pool.suiPerToken
		const minSuiOut = BigInt(Math.floor(expectedSui * 0.8 * 1e9))

		if (minSuiOut <= 0n) continue

		const coinsRes = await client.getCoins({
			owner: sender,
			coinType: pool.coinType,
			limit: 50,
		})
		const coinIds = coinsRes.data
			.filter((c) => typeof c.coinObjectId === 'string')
			.map((c) => c.coinObjectId as string)
		if (coinIds.length === 0) continue

		const suiValue = minSuiOut
		if (suiValue > bestSuiValue) {
			bestSuiValue = suiValue
			best = {
				pool,
				coinObjectIds: coinIds,
				amountToSell,
				minSuiOut,
				tokenCoinType: pool.coinType,
			}
		}
	}

	return best
}

function addTokenToSuiGasSwap(
	tx: Transaction,
	swapInfo: GasSwapInfo,
	sender: string,
	network: 'mainnet' | 'testnet',
): void {
	const deepbookPackage = DEEPBOOK_PACKAGE[network]
	const suiUsdcPoolAddress = DEEPBOOK_SUI_USDC_POOL[network]
	if (!deepbookPackage) return

	const sourceCoin = tx.object(swapInfo.coinObjectIds[0])
	if (swapInfo.coinObjectIds.length > 1) {
		tx.mergeCoins(
			sourceCoin,
			swapInfo.coinObjectIds.slice(1).map((id) => tx.object(id)),
		)
	}

	const [tokenToSell] = tx.splitCoins(sourceCoin, [tx.pure.u64(swapInfo.amountToSell)])

	const [zeroDeepCoin] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const minSuiFromSwap =
		swapInfo.minSuiOut -
		(swapInfo.minSuiOut * BigInt(DEFAULT_SLIPPAGE_BPS)) / 10000n

	let swappedSui: ReturnType<Transaction['moveCall']>[0]
	if (!swapInfo.pool.isDirect && swapInfo.pool.usdcPoolAddress && suiUsdcPoolAddress) {
		const [zeroDeep1] = tx.moveCall({
			target: '0x2::coin::zero',
			typeArguments: [DEEP_TYPE],
		})
		const [tokenLeft1, usdcOut, deepLeft1] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
			typeArguments: [swapInfo.tokenCoinType, USDC_TYPE],
			arguments: [
				tx.object(swapInfo.pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(0n),
				tx.object(CLOCK_OBJECT),
			],
		})
		const [suiOut, usdcLeft, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
			typeArguments: [SUI_TYPE, USDC_TYPE],
			arguments: [
				tx.object(suiUsdcPoolAddress),
				usdcOut,
				zeroDeep1,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSui = suiOut
		tx.transferObjects([tokenLeft1, usdcLeft, deepLeft1, deepLeft2, sourceCoin], sender)
	} else if (swapInfo.pool.suiIsBase) {
		const [suiOut, tokenLeft, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
			typeArguments: [SUI_TYPE, swapInfo.tokenCoinType],
			arguments: [
				tx.object(swapInfo.pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSui = suiOut
		tx.transferObjects([tokenLeft, deepLeft2, sourceCoin], sender)
	} else {
		const [tokenLeft, suiOut, deepLeft2] = tx.moveCall({
			target: `${deepbookPackage}::pool::swap_exact_base_for_quote`,
			typeArguments: [swapInfo.tokenCoinType, SUI_TYPE],
			arguments: [
				tx.object(swapInfo.pool.poolAddress),
				tokenToSell,
				zeroDeepCoin,
				tx.pure.u64(minSuiFromSwap),
				tx.object(CLOCK_OBJECT),
			],
		})
		swappedSui = suiOut
		tx.transferObjects([tokenLeft, deepLeft2, sourceCoin], sender)
	}

	tx.mergeCoins(tx.gas, [swappedSui])
}

export async function prependGasSwapIfNeeded(
	tx: Transaction,
	client: SuiClient,
	sender: string,
	suiNeededMist: bigint,
	env: Env,
): Promise<Transaction> {
	const balanceRes = await client.getBalance({ owner: sender, coinType: SUI_TYPE })
	const availableMist = BigInt(balanceRes?.totalBalance ?? '0')
	if (availableMist >= suiNeededMist) return tx

	const shortfall = suiNeededMist - availableMist
	const swapInfo = await findBestGasSwap(client, sender, shortfall, env)
	if (!swapInfo) return tx

	const network = env.SUI_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
	const swapTx = new Transaction()
	swapTx.setSender(sender)
	addTokenToSuiGasSwap(swapTx, swapInfo, sender, network)

	const mainData = tx.getData()
	const swapData = swapTx.getData()
	const combined = TransactionDataBuilder.restore(
		mainData as Parameters<typeof TransactionDataBuilder.restore>[0],
	)
	combined.insertTransaction(0, swapData as Parameters<typeof combined.insertTransaction>[1])

	const restored = Transaction.from(JSON.stringify(combined.snapshot()))
	return restored
}
