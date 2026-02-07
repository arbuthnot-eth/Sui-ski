import { Transaction } from '@mysten/sui/transactions'
import { CLOCK_OBJECT } from '../config/subnamecap'
import type { Env } from '../types'

interface SubnameCapEnv {
	suinsPackageId: string
	subdomainsPackageId: string
	suinsObjectId: string
}

function getSubnameCapEnv(env: Env): SubnameCapEnv {
	const suinsPackageId = env.SUBNAMECAP_SUINS_PACKAGE_ID
	const subdomainsPackageId = env.SUBNAMECAP_SUBDOMAINS_PACKAGE_ID
	const suinsObjectId = env.SUBNAMECAP_SUINS_OBJECT_ID

	if (!suinsPackageId || !subdomainsPackageId || !suinsObjectId) {
		throw new Error(
			'SubnameCap not configured: SUBNAMECAP_SUINS_PACKAGE_ID, SUBNAMECAP_SUBDOMAINS_PACKAGE_ID, and SUBNAMECAP_SUINS_OBJECT_ID are required',
		)
	}

	return { suinsPackageId, subdomainsPackageId, suinsObjectId }
}

export interface TransactionResult {
	txBytes: string
	estimatedGas: number
}

export interface CapLimitArgs {
	defaultNodeAllowCreation?: boolean
	defaultNodeAllowExtension?: boolean
	maxUses?: number | null
	maxDurationMs?: number | null
	capExpirationMs?: number | null
}

export interface CreateSubnameCapArgs extends CapLimitArgs {
	parentNftId: string
	allowLeafCreation: boolean
	allowNodeCreation: boolean
	senderAddress: string
}

function capLimitArguments(tx: Transaction, args: CapLimitArgs) {
	return [
		tx.pure.bool(args.defaultNodeAllowCreation ?? true),
		tx.pure.bool(args.defaultNodeAllowExtension ?? false),
		tx.pure.option('u64', args.maxUses ?? null),
		tx.pure.option('u64', args.maxDurationMs ?? null),
		tx.pure.option('u64', args.capExpirationMs ?? null),
	]
}

export function buildCreateSubnameCapTx(args: CreateSubnameCapArgs, env: Env): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const cap = tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::create_subname_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.parentNftId),
			tx.object(CLOCK_OBJECT),
			tx.pure.bool(args.allowLeafCreation),
			tx.pure.bool(args.allowNodeCreation),
			...capLimitArguments(tx, args),
		],
	})

	tx.transferObjects([cap], args.senderAddress)
	return tx
}

export interface RevokeSubnameCapArgs {
	parentNftId: string
	capId: string
	senderAddress: string
}

export function buildRevokeSubnameCapTx(args: RevokeSubnameCapArgs, env: Env): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::revoke_subname_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.parentNftId),
			tx.object(CLOCK_OBJECT),
			tx.pure.id(args.capId),
		],
	})

	return tx
}

export interface SurrenderSubnameCapArgs {
	capObjectId: string
	senderAddress: string
}

export function buildSurrenderSubnameCapTx(args: SurrenderSubnameCapArgs, env: Env): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::surrender_subname_cap`,
		arguments: [tx.object(suinsObjectId), tx.object(args.capObjectId)],
	})

	return tx
}

export interface ClearActiveCapsArgs {
	parentNftId: string
	senderAddress: string
}

export function buildClearActiveCapsTx(args: ClearActiveCapsArgs, env: Env): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::clear_active_caps`,
		arguments: [tx.object(suinsObjectId), tx.object(args.parentNftId), tx.object(CLOCK_OBJECT)],
	})

	return tx
}

export interface NewLeafWithCapArgs {
	capObjectId: string
	subdomainName: string
	targetAddress: string
	senderAddress: string
}

export function buildNewLeafWithCapTx(args: NewLeafWithCapArgs, env: Env): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::new_leaf_with_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.capObjectId),
			tx.object(CLOCK_OBJECT),
			tx.pure.string(args.subdomainName),
			tx.pure.address(args.targetAddress),
		],
	})

	return tx
}

export interface NewNodeWithCapArgs {
	capObjectId: string
	subdomainName: string
	expirationTimestampMs: number
	senderAddress: string
}

export function buildNewNodeWithCapTx(args: NewNodeWithCapArgs, env: Env): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const registration = tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::new_with_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.capObjectId),
			tx.object(CLOCK_OBJECT),
			tx.pure.string(args.subdomainName),
			tx.pure.u64(args.expirationTimestampMs),
		],
	})

	tx.transferObjects([registration], args.senderAddress)
	return tx
}

export interface NewLeafWithFeeArgs {
	jacketObjectId: string
	feeMist: number
	subdomainName: string
	targetAddress: string
	senderAddress: string
}

export function buildNewLeafWithFeeTx(args: NewLeafWithFeeArgs, env: Env): Transaction {
	const { suinsObjectId } = getSubnameCapEnv(env)
	const feeJacketPackageId = env.JACKET_FEE_PACKAGE_ID
	if (!feeJacketPackageId) {
		throw new Error('JACKET_FEE_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const [paymentCoin] = tx.splitCoins(tx.gas, [args.feeMist])

	tx.moveCall({
		target: `${feeJacketPackageId}::fee_jacket::create_leaf_with_fee`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.jacketObjectId),
			paymentCoin,
			tx.object(CLOCK_OBJECT),
			tx.pure.string(args.subdomainName),
			tx.pure.address(args.targetAddress),
		],
	})

	return tx
}

export interface NewLeafAllowedArgs {
	jacketObjectId: string
	subdomainName: string
	targetAddress: string
	senderAddress: string
}

export function buildNewLeafAllowedTx(args: NewLeafAllowedArgs, env: Env): Transaction {
	const { suinsObjectId } = getSubnameCapEnv(env)
	const allowlistJacketPackageId = env.JACKET_ALLOWLIST_PACKAGE_ID
	if (!allowlistJacketPackageId) {
		throw new Error('JACKET_ALLOWLIST_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${allowlistJacketPackageId}::allowlist_jacket::create_leaf_allowed`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.jacketObjectId),
			tx.object(CLOCK_OBJECT),
			tx.pure.string(args.subdomainName),
			tx.pure.address(args.targetAddress),
		],
	})

	return tx
}

export interface NewLeafRateLimitedArgs {
	jacketObjectId: string
	subdomainName: string
	targetAddress: string
	senderAddress: string
}

export function buildNewLeafRateLimitedTx(args: NewLeafRateLimitedArgs, env: Env): Transaction {
	const { suinsObjectId } = getSubnameCapEnv(env)
	const rateLimitJacketPackageId = env.JACKET_RATE_LIMIT_PACKAGE_ID
	if (!rateLimitJacketPackageId) {
		throw new Error('JACKET_RATE_LIMIT_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${rateLimitJacketPackageId}::rate_limit_jacket::create_leaf_rate_limited`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.jacketObjectId),
			tx.object(CLOCK_OBJECT),
			tx.pure.string(args.subdomainName),
			tx.pure.address(args.targetAddress),
		],
	})

	return tx
}

export interface CreateFeeJacketArgs extends CapLimitArgs {
	parentNftId: string
	leafFee: number
	nodeFee: number
	feeRecipient: string
	senderAddress: string
}

export function buildCreateFeeJacketTx(args: CreateFeeJacketArgs, env: Env): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const feeJacketPackageId = env.JACKET_FEE_PACKAGE_ID
	if (!feeJacketPackageId) {
		throw new Error('JACKET_FEE_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const cap = tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::create_subname_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.parentNftId),
			tx.object(CLOCK_OBJECT),
			tx.pure.bool(true),
			tx.pure.bool(true),
			...capLimitArguments(tx, args),
		],
	})

	const adminCap = tx.moveCall({
		target: `${feeJacketPackageId}::fee_jacket::create`,
		arguments: [
			cap,
			tx.pure.u64(args.leafFee),
			tx.pure.u64(args.nodeFee),
			tx.pure.address(args.feeRecipient),
		],
	})

	tx.transferObjects([adminCap], args.senderAddress)
	return tx
}

export interface CreateAllowlistJacketArgs extends CapLimitArgs {
	parentNftId: string
	initialAddresses?: string[]
	senderAddress: string
}

export function buildCreateAllowlistJacketTx(
	args: CreateAllowlistJacketArgs,
	env: Env,
): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const allowlistJacketPackageId = env.JACKET_ALLOWLIST_PACKAGE_ID
	if (!allowlistJacketPackageId) {
		throw new Error('JACKET_ALLOWLIST_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const cap = tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::create_subname_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.parentNftId),
			tx.object(CLOCK_OBJECT),
			tx.pure.bool(true),
			tx.pure.bool(true),
			...capLimitArguments(tx, args),
		],
	})

	const adminCap = tx.moveCall({
		target: `${allowlistJacketPackageId}::allowlist_jacket::create`,
		arguments: [cap],
	})

	tx.transferObjects([adminCap], args.senderAddress)
	return tx
}

export interface CreateRateLimitJacketArgs extends CapLimitArgs {
	parentNftId: string
	maxPerWindow: number
	windowDurationMs: number
	senderAddress: string
}

export function buildCreateRateLimitJacketTx(
	args: CreateRateLimitJacketArgs,
	env: Env,
): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const rateLimitJacketPackageId = env.JACKET_RATE_LIMIT_PACKAGE_ID
	if (!rateLimitJacketPackageId) {
		throw new Error('JACKET_RATE_LIMIT_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const cap = tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::create_subname_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.parentNftId),
			tx.object(CLOCK_OBJECT),
			tx.pure.bool(true),
			tx.pure.bool(true),
			...capLimitArguments(tx, args),
		],
	})

	const adminCap = tx.moveCall({
		target: `${rateLimitJacketPackageId}::rate_limit_jacket::create`,
		arguments: [cap, tx.pure.u64(args.maxPerWindow), tx.pure.u64(args.windowDurationMs)],
	})

	tx.transferObjects([adminCap], args.senderAddress)
	return tx
}

export interface UpdateFeesArgs {
	adminCapId: string
	jacketObjectId: string
	leafFee: number
	nodeFee: number
	senderAddress: string
}

export function buildUpdateFeesTx(args: UpdateFeesArgs, env: Env): Transaction {
	const feeJacketPackageId = env.JACKET_FEE_PACKAGE_ID
	if (!feeJacketPackageId) {
		throw new Error('JACKET_FEE_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${feeJacketPackageId}::fee_jacket::update_fees`,
		arguments: [
			tx.object(args.adminCapId),
			tx.object(args.jacketObjectId),
			tx.pure.u64(args.leafFee),
			tx.pure.u64(args.nodeFee),
		],
	})

	return tx
}

export interface AddToAllowlistArgs {
	adminCapId: string
	jacketObjectId: string
	addresses: string[]
	senderAddress: string
}

export function buildAddToAllowlistTx(args: AddToAllowlistArgs, env: Env): Transaction {
	const allowlistJacketPackageId = env.JACKET_ALLOWLIST_PACKAGE_ID
	if (!allowlistJacketPackageId) {
		throw new Error('JACKET_ALLOWLIST_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${allowlistJacketPackageId}::allowlist_jacket::add_addresses`,
		arguments: [
			tx.object(args.adminCapId),
			tx.object(args.jacketObjectId),
			tx.pure.vector('address', args.addresses),
		],
	})

	return tx
}

export interface UpdateRateLimitArgs {
	adminCapId: string
	jacketObjectId: string
	maxPerWindow: number
	windowDurationMs: number
	senderAddress: string
}

export function buildUpdateRateLimitTx(args: UpdateRateLimitArgs, env: Env): Transaction {
	const rateLimitJacketPackageId = env.JACKET_RATE_LIMIT_PACKAGE_ID
	if (!rateLimitJacketPackageId) {
		throw new Error('JACKET_RATE_LIMIT_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${rateLimitJacketPackageId}::rate_limit_jacket::update_rate_limit`,
		arguments: [
			tx.object(args.adminCapId),
			tx.object(args.jacketObjectId),
			tx.pure.u64(args.maxPerWindow),
			tx.pure.u64(args.windowDurationMs),
		],
	})

	return tx
}

export interface CreateSingleUseJacketArgs extends CapLimitArgs {
	parentNftId: string
	recipientAddress: string
	allowNodeCreation?: boolean
	senderAddress: string
}

export function buildCreateSingleUseJacketTx(
	args: CreateSingleUseJacketArgs,
	env: Env,
): Transaction {
	const { subdomainsPackageId, suinsObjectId } = getSubnameCapEnv(env)
	const singleUsePackageId = env.JACKET_SINGLE_USE_PACKAGE_ID
	if (!singleUsePackageId) {
		throw new Error('JACKET_SINGLE_USE_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const cap = tx.moveCall({
		target: `${subdomainsPackageId}::subdomains::create_subname_cap`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.parentNftId),
			tx.object(CLOCK_OBJECT),
			tx.pure.bool(true),
			tx.pure.bool(args.allowNodeCreation ?? false),
			...capLimitArguments(tx, args),
		],
	})

	const jacket = tx.moveCall({
		target: `${singleUsePackageId}::single_use_jacket::create`,
		arguments: [cap],
	})

	tx.transferObjects([jacket], args.recipientAddress)
	return tx
}

export interface UseSingleUseJacketLeafArgs {
	jacketObjectId: string
	subdomainName: string
	targetAddress: string
	senderAddress: string
}

export function buildUseSingleUseJacketLeafTx(
	args: UseSingleUseJacketLeafArgs,
	env: Env,
): Transaction {
	const { suinsObjectId } = getSubnameCapEnv(env)
	const singleUsePackageId = env.JACKET_SINGLE_USE_PACKAGE_ID
	if (!singleUsePackageId) {
		throw new Error('JACKET_SINGLE_USE_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	tx.moveCall({
		target: `${singleUsePackageId}::single_use_jacket::create_leaf_and_destroy`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.jacketObjectId),
			tx.object(CLOCK_OBJECT),
			tx.pure.string(args.subdomainName),
			tx.pure.address(args.targetAddress),
		],
	})

	return tx
}

export interface UseSingleUseJacketNodeArgs {
	jacketObjectId: string
	subdomainName: string
	expirationTimestampMs: number
	senderAddress: string
}

export function buildUseSingleUseJacketNodeTx(
	args: UseSingleUseJacketNodeArgs,
	env: Env,
): Transaction {
	const { suinsObjectId } = getSubnameCapEnv(env)
	const singleUsePackageId = env.JACKET_SINGLE_USE_PACKAGE_ID
	if (!singleUsePackageId) {
		throw new Error('JACKET_SINGLE_USE_PACKAGE_ID not configured')
	}

	const tx = new Transaction()
	tx.setSender(args.senderAddress)

	const registration = tx.moveCall({
		target: `${singleUsePackageId}::single_use_jacket::create_node_and_destroy`,
		arguments: [
			tx.object(suinsObjectId),
			tx.object(args.jacketObjectId),
			tx.object(CLOCK_OBJECT),
			tx.pure.string(args.subdomainName),
			tx.pure.u64(args.expirationTimestampMs),
		],
	})

	tx.transferObjects([registration], args.senderAddress)
	return tx
}

export async function serializeTransaction(tx: Transaction, _env: Env): Promise<TransactionResult> {
	const txBytes = await tx.toJSON()
	return { txBytes, estimatedGas: 50_000_000 }
}
