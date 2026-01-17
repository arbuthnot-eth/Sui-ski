import { getFullnodeUrl } from '@mysten/sui/client'
import {
	fetchSuiNSObjectData,
	extractDomainFromObjectData,
	extractExpirationFromObjectData,
	extractImageUrlFromObjectData,
	extractTargetAddressFromObjectData,
	extractOwnerAddressFromObjectData,
} from '../src/utils/suins-object'

type Network = 'mainnet' | 'testnet' | 'devnet'

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

function printUsage() {
	console.log(
		[
			'Usage:',
			'  bun run scripts/extract-suins-object.ts --object-id <id> [--network mainnet|testnet|devnet] [--rpc <url>] [--json]',
			'',
			'Required:',
			'  --object-id  SuiNS Registration object ID',
			'',
			'Options:',
			'  --network  mainnet | testnet | devnet (default: mainnet or SUI_NETWORK env var)',
			'  --rpc      Override fullnode URL (default: getFullnodeUrl(network) or SUI_RPC_URL env var)',
			'  --json     Output as JSON instead of formatted text',
		].join('\n'),
	)
}

const args = parseArgs(process.argv.slice(2))
if (args.has('help') || args.has('h')) {
	printUsage()
	process.exit(0)
}

const objectId = getRequiredArg(args, 'object-id')
if (!objectId) {
	printUsage()
	process.exit(1)
}

const network = (getRequiredArg(args, 'network', 'SUI_NETWORK') || 'mainnet') as Network
const rpcUrl = getRequiredArg(args, 'rpc', 'SUI_RPC_URL') || getFullnodeUrl(network)
const outputJson = args.get('json') === true

// Create a minimal Env-like object
const env = {
	SUI_NETWORK: network,
	SUI_RPC_URL: rpcUrl,
} as { SUI_NETWORK: Network; SUI_RPC_URL: string }

console.error(`Fetching object data for: ${objectId}`)
console.error(`Network: ${network}`)
console.error(`RPC URL: ${rpcUrl}`)
console.error('')

const objectData = await fetchSuiNSObjectData(objectId, env)

if (!objectData) {
	console.error('Failed to fetch object data')
	process.exit(1)
}

// Extract commonly used fields
const domain = extractDomainFromObjectData(objectData)
const expiration = extractExpirationFromObjectData(objectData)
const imageUrl = extractImageUrlFromObjectData(objectData)
const targetAddress = extractTargetAddressFromObjectData(objectData)
const ownerAddress = extractOwnerAddressFromObjectData(objectData)

if (outputJson) {
	// Output as JSON
	console.log(
		JSON.stringify(
			{
				objectId: objectData.objectId,
				version: objectData.version,
				digest: objectData.digest,
				previousTransaction: objectData.previousTransaction,
				objectType: objectData.objectType,
				owner: objectData.owner,
				extracted: {
					domain,
					expiration,
					imageUrl,
					targetAddress,
					ownerAddress,
				},
				content: objectData.content,
				display: objectData.display,
			},
			null,
			2,
		),
	)
} else {
	// Output as formatted text
	console.log('='.repeat(80))
	console.log('SuiNS Registration Object Data')
	console.log('='.repeat(80))
	console.log('')
	console.log('Object Metadata:')
	console.log(`  Object ID:     ${objectData.objectId}`)
	console.log(`  Version:       ${objectData.version}`)
	console.log(`  Digest:        ${objectData.digest}`)
	console.log(`  Type:          ${objectData.objectType}`)
	if (objectData.previousTransaction) {
		console.log(`  Prev TX:       ${objectData.previousTransaction}`)
	}
	console.log('')
	console.log('Owner:')
	if (objectData.owner?.AddressOwner) {
		console.log(`  Address Owner: ${objectData.owner.AddressOwner}`)
	} else if (objectData.owner?.ObjectOwner) {
		console.log(`  Object Owner:  ${objectData.owner.ObjectOwner}`)
	} else if (objectData.owner?.Shared) {
		console.log(`  Shared:        ${objectData.owner.Shared.initial_shared_version}`)
	} else if (objectData.owner?.Immutable) {
		console.log(`  Immutable:     true`)
	} else {
		console.log(`  Unknown:       ${JSON.stringify(objectData.owner)}`)
	}
	console.log('')
	console.log('Extracted Fields:')
	console.log(`  Domain:        ${domain || '(not found)'}`)
	console.log(`  Expiration:    ${expiration ? new Date(Number(expiration)).toISOString() : '(not found)'}`)
	console.log(`  Image URL:     ${imageUrl || '(not found)'}`)
	console.log(`  Target Addr:   ${targetAddress || '(not found)'}`)
	console.log(`  Owner Addr:    ${ownerAddress || '(not found)'}`)
	console.log('')
	console.log('Content Fields:')
	if (objectData.content && Object.keys(objectData.content).length > 0) {
		for (const [key, value] of Object.entries(objectData.content)) {
			const displayValue =
				typeof value === 'object' ? JSON.stringify(value, null, 2).split('\n').join('\n    ') : String(value)
			console.log(`  ${key}:`)
			console.log(`    ${displayValue}`)
		}
	} else {
		console.log('  (no content fields)')
	}
	console.log('')
	console.log('Display Data:')
	if (objectData.display && Object.keys(objectData.display).length > 0) {
		for (const [key, value] of Object.entries(objectData.display)) {
			const displayValue =
				typeof value === 'object' ? JSON.stringify(value, null, 2).split('\n').join('\n    ') : String(value)
			console.log(`  ${key}:`)
			console.log(`    ${displayValue}`)
		}
	} else {
		console.log('  (no display data)')
	}
	console.log('')
	console.log('='.repeat(80))
}
