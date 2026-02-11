import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient, SuinsTransaction } from '@mysten/suins'
import type { Env } from '../types'
import {
	calculateSuiNeededForNs,
	DEEP_TYPE,
	DEEPBOOK_DEEP_SUI_POOL,
	DEEPBOOK_NS_SUI_POOL,
	DEEPBOOK_PACKAGE,
	DEFAULT_SLIPPAGE_BPS,
	getNSSuiPrice,
	NS_SCALE,
	NS_TYPE_MAINNET,
	SUI_TYPE,
	simulateBuyNsWithSui,
} from './ns-price'
import { calculateRegistrationPrice, calculateRenewalPrice } from './pricing'
import { getDefaultRpcUrl } from './rpc'

const CLOCK_OBJECT = '0x6'
const DUST_SINK_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000000'
const DEEP_FEE_PERCENT = 15n
const MIN_DEEP_OUT = 50_000n

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
	const deepPoolAddress = DEEPBOOK_DEEP_SUI_POOL[network]
	const deepbookPackage = DEEPBOOK_PACKAGE[network]

	if (!nsPoolAddress || !deepPoolAddress || !deepbookPackage) {
		throw new Error(`DeepBook pools not available on ${network}`)
	}

	let suiForNsSwap: bigint
	let minNsOutput: bigint
	let expectedNsOutput: bigint
	let priceImpactBps = 0

	if (nsPrice.asks?.length) {
		const quote = calculateSuiNeededForNs(registrationCostNsMist, nsPrice.asks, slippageBps)
		suiForNsSwap = quote.suiNeeded
		expectedNsOutput = quote.expectedNs
		minNsOutput = quote.worstCaseNs

		const simResult = simulateBuyNsWithSui(suiForNsSwap, nsPrice.asks)
		priceImpactBps = simResult.priceImpactBps

		if (simResult.outputNs < minNsOutput) {
			const extraBuffer = (suiForNsSwap * 20n) / 100n
			suiForNsSwap = suiForNsSwap + extraBuffer
		}
	} else {
		const bufferBps = Math.max(slippageBps * 3, 2000)
		const nsWithBuffer =
			registrationCostNsMist + (registrationCostNsMist * BigInt(bufferBps)) / 10000n
		const nsTokens = Number(nsWithBuffer) / NS_SCALE
		suiForNsSwap = BigInt(Math.ceil(nsTokens * nsPrice.suiPerNs * 1e9))
		expectedNsOutput = nsWithBuffer
		minNsOutput = registrationCostNsMist - (registrationCostNsMist * BigInt(slippageBps)) / 10000n
	}

	const suiForDeepSwap = (suiForNsSwap * DEEP_FEE_PERCENT) / 100n
	const suiInputMist = suiForNsSwap + suiForDeepSwap

	const client = new SuiClient({ url: getDefaultRpcUrl(env.SUI_NETWORK), network: env.SUI_NETWORK })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const [suiCoinForNs, suiCoinForDeep] = tx.splitCoins(tx.gas, [
		tx.pure.u64(suiForNsSwap),
		tx.pure.u64(suiForDeepSwap),
	])

	const [zeroDeepCoin] = tx.moveCall({
		target: '0x2::coin::zero',
		typeArguments: [DEEP_TYPE],
	})

	const [deepCoin, deepLeftoverSui, deepLeftoverDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
		typeArguments: [DEEP_TYPE, SUI_TYPE],
		arguments: [
			tx.object(deepPoolAddress),
			suiCoinForDeep,
			zeroDeepCoin,
			tx.pure.u64(MIN_DEEP_OUT),
			tx.object(CLOCK_OBJECT),
		],
	})

	const [nsCoin, nsLeftoverSui, nsLeftoverDeep] = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(nsPoolAddress),
			suiCoinForNs,
			deepCoin,
			tx.pure.u64(minNsOutput),
			tx.object(CLOCK_OBJECT),
		],
	})

	tx.transferObjects([deepLeftoverSui, deepLeftoverDeep], senderAddress)
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
		const quote = calculateSuiNeededForNs(renewalCostNsMist, nsPrice.asks, slippageBps)
		suiForNsSwap = quote.suiNeeded
		expectedNsOutput = quote.expectedNs
		minNsOutput = quote.worstCaseNs

		const simResult = simulateBuyNsWithSui(suiForNsSwap, nsPrice.asks)
		priceImpactBps = simResult.priceImpactBps

		if (simResult.outputNs < minNsOutput) {
			const extraBuffer = (suiForNsSwap * 20n) / 100n
			suiForNsSwap = suiForNsSwap + extraBuffer
		}
	} else {
		const bufferBps = Math.max(slippageBps * 3, 2000)
		const nsWithBuffer = renewalCostNsMist + (renewalCostNsMist * BigInt(bufferBps)) / 10000n
		const nsTokens = Number(nsWithBuffer) / NS_SCALE
		suiForNsSwap = BigInt(Math.ceil(nsTokens * nsPrice.suiPerNs * 1e9))
		expectedNsOutput = nsWithBuffer
		minNsOutput = renewalCostNsMist - (renewalCostNsMist * BigInt(slippageBps)) / 10000n
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
	const residualRecipient =
		feeRecipientLower === senderLower
			? DUST_SINK_ADDRESS
			: feeRecipient

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
