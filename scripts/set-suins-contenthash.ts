import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography'
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519'
import { Secp256k1Keypair } from '@mysten/sui/keypairs/secp256k1'
import { Secp256r1Keypair } from '@mysten/sui/keypairs/secp256r1'
import { Transaction } from '@mysten/sui/transactions'
import { ALLOWED_METADATA, SuinsClient, SuinsTransaction } from '@mysten/suins'

type Network = 'mainnet' | 'testnet'

function parseArgs(argv: string[]) {
	const args = new Map<string, string | boolean>()
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i]
		if (!arg.startsWith('--')) continue
		const key = arg.slice(2)
		const next = argv[i + 1]
		if (!next || next.startsWith('--')) {
			args.set(key, true)
		} else {
			args.set(key, next)
			i += 1
		}
	}
	return args
}

function getRequiredArg(args: Map<string, string | boolean>, name: string, envKey?: string) {
	const value = args.get(name)
	if (typeof value === 'string') return value
	if (envKey && process.env[envKey]) return process.env[envKey]!
	return null
}

function normalizeName(name: string) {
	const trimmed = name.trim().toLowerCase()
	return trimmed.endsWith('.sui') ? trimmed : `${trimmed}.sui`
}

function deriveKeypair(privateKey: string) {
	const decoded = decodeSuiPrivateKey(privateKey)
	switch (decoded.schema) {
		case 'ED25519':
			return Ed25519Keypair.fromSecretKey(decoded.secretKey)
		case 'Secp256k1':
			return Secp256k1Keypair.fromSecretKey(decoded.secretKey)
		case 'Secp256r1':
			return Secp256r1Keypair.fromSecretKey(decoded.secretKey)
		default:
			throw new Error(`Unsupported key scheme: ${decoded.schema}`)
	}
}

function buildContentHash(value: string, forceWalrus: boolean) {
	if (!forceWalrus) return value
	return value.startsWith('walrus://') ? value : `walrus://${value}`
}

function printUsage() {
	console.log(
		[
			'Usage:',
			'  bun run scripts/set-suins-contenthash.ts --name <name> --content <value> [--network mainnet|testnet] [--rpc <url>] [--walrus] [--subname]',
			'',
			'Required:',
			'  --name     SuiNS name (e.g., myname or myname.sui)',
			'  --content  Content hash value (Walrus blob ID, IPFS CID, or URL)',
			'',
			'Auth:',
			'  SUI_PRIVATE_KEY env var must be set to a bech32 key (suiprivkey...)',
			'',
			'Options:',
			'  --network  mainnet | testnet (default: mainnet or SUI_NETWORK env var)',
			'  --rpc      Override fullnode URL (default: getFullnodeUrl(network) or SUI_RPC_URL env var)',
			'  --walrus   Prefixes value with walrus:// if missing',
			'  --subname  Treat name as a subdomain (if applicable)',
		].join('\n'),
	)
}

const args = parseArgs(process.argv.slice(2))
if (args.has('help') || args.has('h')) {
	printUsage()
	process.exit(0)
}

const rawName = getRequiredArg(args, 'name')
const rawContent = getRequiredArg(args, 'content', 'CONTENT_HASH')
const privateKey = getRequiredArg(args, 'private-key', 'SUI_PRIVATE_KEY')

if (!rawName || !rawContent || !privateKey) {
	printUsage()
	process.exit(1)
}

const network = (getRequiredArg(args, 'network', 'SUI_NETWORK') || 'mainnet') as Network
const rpcUrl = getRequiredArg(args, 'rpc', 'SUI_RPC_URL') || getFullnodeUrl(network)
const forceWalrus = args.get('walrus') === true
const isSubname = args.get('subname') === true

const name = normalizeName(rawName)
const contentHash = buildContentHash(rawContent, forceWalrus)

const client = new SuiClient({ url: rpcUrl })
const keypair = deriveKeypair(privateKey)
const suinsClient = new SuinsClient({ client, network })

const record = await suinsClient.getNameRecord(name)
if (!record?.nftId) {
	throw new Error(`Name record for "${name}" not found or missing NFT id`)
}

const tx = new Transaction()
const suinsTx = new SuinsTransaction(suinsClient, tx)

suinsTx.setUserData({
	nft: record.nftId,
	key: ALLOWED_METADATA.contentHash,
	value: contentHash,
	isSubname,
})

const result = await client.signAndExecuteTransaction({
	signer: keypair,
	transaction: tx,
	options: { showEffects: true, showEvents: true },
})

console.log('Updated content_hash for', name)
console.log('Transaction digest:', result.digest)
