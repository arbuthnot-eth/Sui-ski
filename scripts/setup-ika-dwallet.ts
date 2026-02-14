import { fromBase64 } from '@mysten/bcs'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Transaction } from '@mysten/sui/transactions'
import {
	IkaClient,
	IkaTransaction,
	getNetworkConfig,
	Curve,
	UserShareEncryptionKeys,
	prepareImportedKeyDWalletVerification,
	createRandomSessionIdentifier,
	publicKeyFromDWalletOutput,
} from '@ika.xyz/sdk'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { base58 } from '@scure/base'

const IKA_COIN_TYPE = '0x2::coin::Coin<0x7262fb2f7a3a14c888c438a3cd9b912469a58cf60f367352c46584262e8299aa::ika::IKA>'
const SUI_COIN_TYPE = '0x2::coin::Coin<0x2::sui::SUI>'
const DWALLET_POLL_TIMEOUT_MS = 120_000
const DWALLET_POLL_INTERVAL_MS = 2_000
const DWALLET_POLL_MAX_INTERVAL_MS = 10_000

function loadKeypair(): Ed25519Keypair {
	const secret = process.env.AGENT_PRIVATE_KEY
	if (!secret) {
		throw new Error('AGENT_PRIVATE_KEY env var is required. Export it as suiprivkey1... or base64-encoded secret key.')
	}
	const trimmed = secret.trim()
	if (trimmed.startsWith('suiprivkey')) {
		return Ed25519Keypair.fromSecretKey(trimmed)
	}
	const bytes = fromBase64(trimmed)
	return Ed25519Keypair.fromSecretKey(bytes.length === 33 ? bytes.slice(1) : bytes)
}

function getRawSecretKey(keypair: Ed25519Keypair): Uint8Array {
	const { secretKey } = decodeSuiPrivateKey(keypair.getSecretKey())
	return secretKey
}

function evmAddressFromSecp256k1PublicKey(uncompressedPubKey: Uint8Array): string {
	const keyWithoutPrefix = uncompressedPubKey[0] === 0x04
		? uncompressedPubKey.slice(1)
		: uncompressedPubKey
	const hash = keccak_256(keyWithoutPrefix)
	const addressBytes = hash.slice(-20)
	let hex = '0x'
	for (let i = 0; i < addressBytes.length; i++) {
		hex += addressBytes[i].toString(16).padStart(2, '0')
	}
	return hex
}

function solanaAddressFromEd25519PublicKey(pubKey: Uint8Array): string {
	return base58.encode(pubKey.slice(0, 32))
}

async function findCoin(
	suiClient: SuiJsonRpcClient,
	owner: string,
	coinType: string,
): Promise<string | null> {
	const { data } = await suiClient.getCoins({ owner, coinType, limit: 1 })
	return data.length > 0 ? data[0].coinObjectId : null
}

async function createImportedKeyDWallet(
	suiClient: SuiJsonRpcClient,
	ikaClient: IkaClient,
	keypair: Ed25519Keypair,
	curve: typeof Curve.SECP256K1 | typeof Curve.ED25519,
	label: string,
): Promise<{ dwalletId: string; dwalletCapId: string; publicKey: Uint8Array }> {
	const address = keypair.toSuiAddress()
	console.log(`\n--- Creating ${label} dWallet (curve: ${curve}) ---`)

	const sessionBytes = createRandomSessionIdentifier()
	const rawSecret = getRawSecretKey(keypair)

	const userShareEncryptionKeys = await UserShareEncryptionKeys.fromRootSeedKey(
		rawSecret,
		curve,
	)

	console.log('Preparing imported key verification data...')
	const verificationInput = await prepareImportedKeyDWalletVerification(
		ikaClient,
		curve,
		sessionBytes,
		address,
		userShareEncryptionKeys,
		rawSecret,
	)

	const tx = new Transaction()
	tx.setSender(address)

	const ikaTx = new IkaTransaction({
		ikaClient,
		transaction: tx,
		userShareEncryptionKeys,
	})

	const sessionIdentifier = ikaTx.registerSessionIdentifier(sessionBytes)

	const ikaCoinId = await findCoin(suiClient, address, IKA_COIN_TYPE)
	const suiCoinId = await findCoin(suiClient, address, SUI_COIN_TYPE)

	if (!ikaCoinId) {
		throw new Error(`No IKA coins found for ${address}. Fund the account with IKA tokens first.`)
	}

	const ikaCoin = tx.object(ikaCoinId)
	const suiCoin = suiCoinId ? tx.object(suiCoinId) : tx.splitCoins(tx.gas, [100_000_000])

	console.log('Building requestImportedKeyDWalletVerification transaction...')
	const dWalletCap = await ikaTx.requestImportedKeyDWalletVerification({
		importDWalletVerificationRequestInput: verificationInput,
		curve,
		signerPublicKey: keypair.getPublicKey().toRawBytes(),
		sessionIdentifier,
		ikaCoin,
		suiCoin,
	})

	tx.transferObjects([dWalletCap], address)

	console.log('Signing and executing transaction...')
	const result = await suiClient.signAndExecuteTransaction({
		signer: keypair,
		transaction: tx,
		options: { showEffects: true, showObjectChanges: true },
	})

	if (result.effects?.status?.status !== 'success') {
		throw new Error(`Transaction failed: ${JSON.stringify(result.effects?.status)}`)
	}

	console.log(`Transaction digest: ${result.digest}`)

	const createdObjects = result.objectChanges?.filter(c => c.type === 'created') ?? []
	const capObject = createdObjects.find(c =>
		c.type === 'created' && c.objectType?.includes('DWalletCap'),
	)
	if (!capObject || capObject.type !== 'created') {
		throw new Error('DWalletCap not found in transaction results')
	}

	const dwalletCapId = capObject.objectId
	console.log(`DWalletCap ID: ${dwalletCapId}`)

	console.log('Waiting for dWallet to reach Active state...')
	const cap = await ikaClient.getOwnedDWalletCaps(address)
	const latestCap = cap.dWalletCaps.find(c => c.id === dwalletCapId)
	if (!latestCap) {
		throw new Error(`DWalletCap ${dwalletCapId} not found in owned caps`)
	}

	const dwalletId = (latestCap as any).dwallet_id ?? (latestCap as any).dwalletId
	if (!dwalletId) {
		console.log('DWalletCap fields:', JSON.stringify(latestCap, null, 2))
		throw new Error('Could not extract dWallet ID from DWalletCap')
	}

	console.log(`dWallet ID: ${dwalletId}`)

	const activeDWallet = await ikaClient.getDWalletInParticularState(
		dwalletId,
		'Active',
		{
			timeout: DWALLET_POLL_TIMEOUT_MS,
			interval: DWALLET_POLL_INTERVAL_MS,
			maxInterval: DWALLET_POLL_MAX_INTERVAL_MS,
		},
	)

	const dwalletOutput = (activeDWallet.state as any).Active?.dwallet_output
		?? (activeDWallet.state as any).Active?.dwalletOutput
	if (!dwalletOutput) {
		console.log('Active state:', JSON.stringify(activeDWallet.state, null, 2))
		throw new Error('Could not extract dWallet output from Active state')
	}

	console.log('Extracting public key from dWallet output...')
	const publicKey = await publicKeyFromDWalletOutput(curve, new Uint8Array(dwalletOutput))

	console.log(`${label} dWallet created successfully!`)
	console.log(`  dWallet ID:  ${dwalletId}`)
	console.log(`  Cap ID:      ${dwalletCapId}`)
	console.log(`  Public Key:  0x${Buffer.from(publicKey).toString('hex')}`)

	return { dwalletId, dwalletCapId, publicKey }
}

async function main() {
	console.log('=== IKA dWallet Setup Script ===\n')

	const keypair = loadKeypair()
	const address = keypair.toSuiAddress()
	console.log(`Agent Sui address: ${address}`)

	const suiClient = new SuiJsonRpcClient({ url: getJsonRpcFullnodeUrl('mainnet') })
	const ikaConfig = getNetworkConfig('mainnet')

	console.log('IKA package:', ikaConfig.packages.ikaPackage)
	console.log('Coordinator:', ikaConfig.objects.ikaDWalletCoordinator.objectID)

	const ikaClient = new IkaClient({
		suiClient,
		config: ikaConfig,
		cache: true,
	})
	await ikaClient.initialize()
	console.log('IKA client initialized')

	const balance = await suiClient.getBalance({ owner: address })
	console.log(`SUI balance: ${(Number(balance.totalBalance) / 1e9).toFixed(4)} SUI`)

	const ikaBalance = await suiClient.getBalance({
		owner: address,
		coinType: `${ikaConfig.packages.ikaPackage}::ika::IKA`,
	})
	console.log(`IKA balance: ${(Number(ikaBalance.totalBalance) / 1e9).toFixed(4)} IKA`)

	if (Number(balance.totalBalance) < 100_000_000) {
		throw new Error('Insufficient SUI balance. Need at least 0.1 SUI for gas fees.')
	}

	const skipEvm = process.env.SKIP_EVM === 'true'
	const skipSolana = process.env.SKIP_SOLANA === 'true'

	let evmAddress: string | undefined
	let evmDwalletId: string | undefined
	let solanaAddress: string | undefined
	let solanaDwalletId: string | undefined

	if (!skipEvm) {
		const evm = await createImportedKeyDWallet(
			suiClient,
			ikaClient,
			keypair,
			Curve.SECP256K1,
			'EVM (Base)',
		)
		evmAddress = evmAddressFromSecp256k1PublicKey(evm.publicKey)
		evmDwalletId = evm.dwalletId
		console.log(`\n  EVM Address: ${evmAddress}`)
	}

	if (!skipSolana) {
		const solana = await createImportedKeyDWallet(
			suiClient,
			ikaClient,
			keypair,
			Curve.ED25519,
			'Solana',
		)
		solanaAddress = solanaAddressFromEd25519PublicKey(solana.publicKey)
		solanaDwalletId = solana.dwalletId
		console.log(`\n  Solana Address: ${solanaAddress}`)
	}

	console.log('\n\n=== SETUP COMPLETE ===\n')
	console.log('Add the following to wrangler.toml [vars]:')
	console.log('─'.repeat(50))
	if (evmAddress) {
		console.log(`X402_BASE_PAY_TO = "${evmAddress}"`)
	}
	if (solanaAddress) {
		console.log(`X402_SOL_PAY_TO = "${solanaAddress}"`)
	}
	console.log(`IKA_PACKAGE_ID = "${ikaConfig.packages.ikaPackage}"`)
	console.log('')

	console.log('Store as wrangler secrets:')
	console.log('─'.repeat(50))
	if (evmDwalletId) {
		console.log(`npx wrangler secret put EVM_DWALLET_ID  # value: ${evmDwalletId}`)
	}
	if (solanaDwalletId) {
		console.log(`npx wrangler secret put SOL_SWAP_DWALLET_ID  # value: ${solanaDwalletId}`)
	}
	console.log('')

	console.log('Then enable multi-chain verifiers:')
	console.log('─'.repeat(50))
	console.log('X402_VERIFIERS = "cloudflare,multichain"')
	console.log('')
	console.log('And set CDP API key for mainnet:')
	console.log('cd workers/x402-multichain && npx wrangler secret put CDP_API_KEY')
	console.log('')
	console.log('Finally, redeploy both workers:')
	console.log('npx wrangler deploy')
	console.log('cd workers/x402-multichain && npx wrangler deploy')
}

main().catch(err => {
	console.error('\nFATAL:', err.message || err)
	if (err.stack) console.error(err.stack)
	process.exit(1)
})
