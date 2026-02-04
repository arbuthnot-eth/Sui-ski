import { SuiClient } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient, SuinsTransaction } from '@mysten/suins'
import type { Env } from '../types'
import {
	DEEPBOOK_NS_SUI_POOL,
	DEEPBOOK_PACKAGE,
	DEFAULT_SLIPPAGE_BPS,
	getNSSuiPrice,
	NS_TYPE_MAINNET,
	SUI_TYPE,
} from './ns-price'
import { calculateRegistrationPrice } from './pricing'

const CLOCK_OBJECT = '0x6'

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
		getNSSuiPrice(env),
	])

	const registrationCostNsMist = pricing.totalNsMist

	const nsNeededWithSlippage =
		registrationCostNsMist + (registrationCostNsMist * BigInt(slippageBps)) / 10000n

	const suiInputMist = BigInt(Math.ceil(Number(nsNeededWithSlippage) * nsPrice.suiPerNs))

	const client = new SuiClient({ url: env.SUI_RPC_URL })
	const suinsClient = new SuinsClient({ client: client as never, network })

	const tx = new Transaction()
	tx.setSender(senderAddress)

	const [suiCoinForSwap] = tx.splitCoins(tx.gas, [tx.pure.u64(suiInputMist)])

	const poolAddress = DEEPBOOK_NS_SUI_POOL[network]
	const deepbookPackage = DEEPBOOK_PACKAGE[network]

	if (!poolAddress || !deepbookPackage) {
		throw new Error(`DeepBook NS/SUI pool not available on ${network}`)
	}

	const minNsOut = registrationCostNsMist

	const swappedNsCoin = tx.moveCall({
		target: `${deepbookPackage}::pool::swap_exact_quote_for_base`,
		typeArguments: [NS_TYPE_MAINNET, SUI_TYPE],
		arguments: [
			tx.object(poolAddress),
			suiCoinForSwap,
			tx.object(CLOCK_OBJECT),
			tx.pure.u64(minNsOut),
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

	const nft = suinsTx.register({
		domain: cleanDomain,
		years,
		coinConfig,
		coin: swappedNsCoin[0],
		priceInfoObjectId,
	})

	suinsTx.setTargetAddress({
		nft,
		address: senderAddress,
		isSubname: cleanDomain.replace(/\.sui$/i, '').includes('.'),
	})

	tx.transferObjects([nft], senderAddress)

	if (swappedNsCoin[1]) {
		tx.transferObjects([swappedNsCoin[1]], senderAddress)
	}

	tx.setGasBudget(100_000_000)

	return {
		tx,
		breakdown: {
			suiInputMist,
			nsOutputEstimate: nsNeededWithSlippage,
			registrationCostNsMist,
			slippageBps,
			nsPerSui: nsPrice.nsPerSui,
			source: nsPrice.source,
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

	const client = new SuiClient({ url: env.SUI_RPC_URL })
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

	const [paymentCoin] = tx.splitCoins(tx.object(nsCoinObjectId), [tx.pure.u64(pricing.totalNsMist)])

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

	const client = new SuiClient({ url: env.SUI_RPC_URL })
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

	const priceWithBuffer = pricing.totalSuiMist + (pricing.totalSuiMist * 1n) / 100n
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
