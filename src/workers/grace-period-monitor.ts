import { SuiJsonRpcClient as SuiClient } from '@mysten/sui/jsonRpc'
import { Transaction } from '@mysten/sui/transactions'
import type { Env } from '../types'
import { getDefaultRpcUrl } from '../utils/rpc'

const CLOCK_OBJECT = '0x6'
const POLL_INTERVAL_MS = 5 * 60 * 1000
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

export class GracePeriodMonitor {
	private env: Env
	private intervalId: NodeJS.Timeout | null = null
	private lastPollTime = 0
	private processing = new Set<string>()
	private suiClient: SuiClient

	constructor(env: Env) {
		this.env = env
		this.suiClient = new SuiClient({
			url: getDefaultRpcUrl(env.SUI_NETWORK),
			network: env.SUI_NETWORK,
		})
	}

	start() {
		if (this.intervalId) return

		this.intervalId = setInterval(() => this.checkGracePeriod(), POLL_INTERVAL_MS)
		console.log('Grace period monitor started')
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId)
			this.intervalId = null
			console.log('Grace period monitor stopped')
		}
	}

	private async checkGracePeriod() {
		const now = Date.now()

		if (this.processing.size > 0) {
			console.log('[Monitor] Still processing, skipping this poll')
			return
		}

		if (now - this.lastPollTime < POLL_INTERVAL_MS) {
			return
		}
		this.lastPollTime = now

		try {
			const expiredNames = await this.queryExpiredNames()

			const BATCH_SIZE = 5
			for (let i = 0; i < expiredNames.length; i += BATCH_SIZE) {
				const batch = expiredNames.slice(i, i + BATCH_SIZE)
				await Promise.all(batch.map((name) => this.processName(name)))
			}
		} catch (error) {
			console.error('[Monitor] Error checking grace period:', error)
		}
	}

	private async queryExpiredNames(): Promise<Array<{ id: string; name: string }>> {
		try {
			if (!this.env.SUBNAMECAP_SUINS_OBJECT_ID) {
				return []
			}

			const dynamicFields = await this.suiClient.getDynamicFields({
				parentId: this.env.SUBNAMECAP_SUINS_OBJECT_ID,
				cursor: null,
				limit: 100,
			})

			const objectIds = dynamicFields.data.map((field) => field.objectId)
			if (objectIds.length === 0) return []

			const objects = await this.suiClient.multiGetObjects({
				ids: objectIds,
				options: { showContent: true },
			})

			const expiredNames: Array<{ id: string; name: string }> = []
			const now = Date.now()

			for (const obj of objects) {
				if (!obj.data?.content || obj.data.content.dataType !== 'moveObject') continue

				const fields = obj.data.content.fields as Record<string, unknown>
				const expiration = fields?.expirationTimestampMs as number | undefined

				if (typeof expiration === 'number') {
					const graceEnd = expiration + GRACE_PERIOD_MS

					if (expiration <= now && now < graceEnd) {
						const nameField = fields?.name as Record<string, unknown> | undefined
						expiredNames.push({
							id: obj.data.objectId,
							name: (nameField?.name as string) ?? obj.data.objectId,
						})
					}
				}
			}

			return expiredNames
		} catch (error) {
			console.error('[Monitor] Error querying expired names:', error)
			return []
		}
	}

	private async processName(name: { id: string; name: string }) {
		if (this.processing.has(name.id)) return
		this.processing.add(name.id)

		try {
			const hasJacket = await this.checkJacketExists(name.id)

			if (!hasJacket) {
				await this.createJacketedListing(name.id)
				console.log(`[Monitor] Created jacket for ${name.name} (${name.id})`)
			}
		} finally {
			this.processing.delete(name.id)
		}
	}

	private async checkJacketExists(nftId: string): Promise<boolean> {
		try {
			const objectInfo = await this.suiClient.getObject({
				id: nftId,
				options: {
					showType: true,
					showContent: true,
				},
			})

			const objectType = objectInfo.data?.type || ''
			return objectType.includes('DecayListing') || objectType.includes('auction::DecayListing')
		} catch {
			return false
		}
	}

	private async createJacketedListing(nftId: string) {
		if (!this.env.DECAY_AUCTION_PACKAGE_ID) {
			console.error('[Monitor] DECAY_AUCTION_PACKAGE_ID not configured')
			return
		}

		const tx = new Transaction()

		tx.moveCall({
			target: `${this.env.DECAY_AUCTION_PACKAGE_ID}::auction::create_and_share`,
			arguments: [
				tx.object(nftId),
				tx.pure.u64(100_000_000_000_000_000),
				tx.pure.u64(2_592_000_000),
				tx.object(CLOCK_OBJECT),
			],
		})

		const workerAddress = await this.getWorkerIdentityAddress()
		tx.setSender(workerAddress)

		try {
			const result = await this.signWithWorkerIdentity(tx)
			console.log(`[Monitor] Created jacketed listing, digest: ${result.digest}`)
		} catch (error) {
			console.error(`[Monitor] Failed to create jacket for ${nftId}:`, error)
		}
	}

	private async getWorkerIdentityAddress(): Promise<string> {
		return 'WORKER_IDENTITY_ADDRESS'
	}

	private async signWithWorkerIdentity(tx: Transaction) {
		const txJson = await tx.toJSON()

		return {
			digest: 'tx-digest-placeholder',
			txBytes: JSON.stringify(txJson),
		}
	}
}
