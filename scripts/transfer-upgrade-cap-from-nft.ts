#!/usr/bin/env tsx
/**
 * Transfer UpgradeCap from brando.sui NFT object ID address to brando.sui target address
 * 
 * This script:
 * 1. Updates brando.sui's target address to the specified address
 * 2. Transfers the UpgradeCap from the NFT object ID address to the target address
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { SuinsClient, SuinsTransaction } from '@mysten/suins'
import * as dotenv from 'dotenv'

dotenv.config()

const NETWORK = 'mainnet'
const BRANDO_NFT_ID = '0x0e531f958486055ac7d7661a14da604f3d102b0007731af9fdce8245fc3f1bad'
const UPGRADE_CAP_ID = '0x6ba7ed57e524dae7945d0a4a4a574f76b2317918bfe07cf1baf0bead7ff6c711'
const TARGET_ADDRESS = '0x3ca0da71d19d9a1837ad3da155f03aab776aa33963864064eb81569f10e5222b'

async function main() {
	const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) })
	const suinsClient = new SuinsClient({
		client: suiClient,
		network: NETWORK,
	})

	console.log('Step 1: Updating brando.sui target address...')
	
	// Step 1: Update brando.sui target address
	const tx1 = new Transaction()
	const suinsTx1 = new SuinsTransaction(suinsClient, tx1)
	
	suinsTx1.setTargetAddress({
		nft: BRANDO_NFT_ID,
		address: TARGET_ADDRESS,
		isSubname: false,
	})

	// Note: This transaction needs to be signed by the NFT owner
	// The sender should be the wallet that owns the NFT (0x3ca0da71d19d9a1837ad3da155f03aab776aa33963864064eb81569f10e5222b)
	tx1.setSender(TARGET_ADDRESS)

	const tx1Bytes = await tx1.build({ client: suiClient })
	console.log('Transaction 1 (Update target address) built successfully')
	console.log('Transaction bytes length:', tx1Bytes.length)
	console.log('\nTo execute:')
	console.log('1. Sign this transaction with the wallet that owns brando.sui NFT')
	console.log('2. Submit to network')

	console.log('\nStep 2: Transferring UpgradeCap from NFT object ID to target address...')
	
	// Step 2: Transfer UpgradeCap from NFT object ID address to target address
	// In Sui, when an object ID owns another object, we can transfer it using the parent object
	const tx2 = new Transaction()
	
	// Transfer the UpgradeCap from the NFT object ID address to the target address
	// The sender needs to be the NFT owner, and we reference the NFT object
	tx2.transferObjects(
		[tx2.object(UPGRADE_CAP_ID)],
		TARGET_ADDRESS
	)
	
	// Set sender to the NFT owner
	tx2.setSender(TARGET_ADDRESS)
	
	// We need to use the NFT object as a signer/authority
	// In Sui, objects can't directly sign, but the owner can transfer objects owned by object IDs
	// This might require a Move function that uses the NFT as a parameter
	
	const tx2Bytes = await tx2.build({ client: suiClient })
	console.log('Transaction 2 (Transfer UpgradeCap) built successfully')
	console.log('Transaction bytes length:', tx2Bytes.length)
	console.log('\nNote: This transaction may need to be executed via a Move function')
	console.log('that uses the brando.sui NFT as authorization to transfer the UpgradeCap')

	console.log('\nSummary:')
	console.log('- brando.sui NFT ID:', BRANDO_NFT_ID)
	console.log('- UpgradeCap ID:', UPGRADE_CAP_ID)
	console.log('- Target address:', TARGET_ADDRESS)
	console.log('- Current UpgradeCap owner:', BRANDO_NFT_ID, '(NFT object ID as address)')
	console.log('- Desired UpgradeCap owner:', TARGET_ADDRESS)
}

main().catch(console.error)
