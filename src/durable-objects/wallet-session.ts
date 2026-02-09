import { DurableObject } from 'cloudflare:workers'
import type { SqlStorageValue } from '@cloudflare/workers-types'
import type { Env } from '../types'

const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

interface SessionRow {
	[key: string]: SqlStorageValue
	session_id: string
	wallet_address: string
	created_at: number
	expires_at: number
	verified: number
}

interface ChallengeRow {
	[key: string]: SqlStorageValue
	nonce: string
}

interface CountRow {
	[key: string]: SqlStorageValue
	count: number
}

export class WalletSession extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)
		ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          session_id TEXT PRIMARY KEY,
          wallet_address TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )
      `)
			this.ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS idx_wallet ON sessions(wallet_address)')
			this.ctx.storage.sql.exec('CREATE INDEX IF NOT EXISTS idx_expires ON sessions(expires_at)')

			try {
				this.ctx.storage.sql.exec('ALTER TABLE sessions ADD COLUMN verified INTEGER DEFAULT 0')
			} catch {}

			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS challenges (
					nonce TEXT PRIMARY KEY,
					challenge TEXT NOT NULL,
					created_at INTEGER NOT NULL,
					expires_at INTEGER NOT NULL
				)
			`)

			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS rate_limits (
					ip TEXT NOT NULL,
					created_at INTEGER NOT NULL
				)
			`)
			this.ctx.storage.sql.exec(
				'CREATE INDEX IF NOT EXISTS idx_rate_ip ON rate_limits(ip, created_at)',
			)
		})
	}

	async createChallenge(): Promise<{ challenge: string; expiresAt: number }> {
		const now = Date.now()
		const expiresAt = now + CHALLENGE_EXPIRY_MS
		const nonce = crypto.randomUUID()
		const challenge = `Sui Key-In to *.sui.ski\nTimestamp: ${now}\nNonce: ${nonce}`

		this.ctx.storage.sql.exec(
			'INSERT INTO challenges (nonce, challenge, created_at, expires_at) VALUES (?, ?, ?, ?)',
			nonce,
			challenge,
			now,
			expiresAt,
		)

		return { challenge, expiresAt }
	}

	async verifyChallenge(challenge: string): Promise<boolean> {
		const now = Date.now()
		const result = this.ctx.storage.sql.exec<ChallengeRow>(
			'SELECT nonce FROM challenges WHERE challenge = ? AND expires_at > ?',
			challenge,
			now,
		)
		const rows = result.toArray()
		if (rows.length === 0) return false
		this.ctx.storage.sql.exec('DELETE FROM challenges WHERE challenge = ?', challenge)
		return true
	}

	async checkRateLimit(ip: string): Promise<boolean> {
		const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS
		this.ctx.storage.sql.exec('DELETE FROM rate_limits WHERE created_at < ?', cutoff)
		const result = this.ctx.storage.sql.exec<CountRow>(
			'SELECT COUNT(*) as count FROM rate_limits WHERE ip = ? AND created_at > ?',
			ip,
			cutoff,
		)
		return (result.toArray()[0]?.count ?? 0) < RATE_LIMIT_MAX
	}

	async recordRateLimit(ip: string): Promise<void> {
		this.ctx.storage.sql.exec(
			'INSERT INTO rate_limits (ip, created_at) VALUES (?, ?)',
			ip,
			Date.now(),
		)
	}

	async createSession(
		walletAddress: string,
		sessionId?: string,
		verified?: boolean,
	): Promise<string> {
		const now = Date.now()
		const expiresAt = now + SESSION_EXPIRY_MS
		const sid = sessionId || crypto.randomUUID()
		const verifiedInt = verified ? 1 : 0

		this.ctx.storage.sql.exec(
			`
      INSERT INTO sessions (session_id, wallet_address, created_at, expires_at, verified)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        wallet_address = excluded.wallet_address,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at,
        verified = excluded.verified
    `,
			sid,
			walletAddress,
			now,
			expiresAt,
			verifiedInt,
		)

		await this.scheduleCleanup()
		return sid
	}

	async deleteSession(sessionId: string): Promise<boolean> {
		const result = this.ctx.storage.sql.exec('DELETE FROM sessions WHERE session_id = ?', sessionId)
		return result.rowsWritten > 0
	}

	async getSession(sessionId: string): Promise<string | null> {
		const now = Date.now()
		const result = this.ctx.storage.sql.exec<SessionRow>(
			'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ?',
			sessionId,
			now,
		)

		const rows = result.toArray()
		return rows[0]?.wallet_address ?? null
	}

	async getByWallet(walletAddress: string): Promise<string[]> {
		const now = Date.now()
		const result = this.ctx.storage.sql.exec<SessionRow>(
			'SELECT session_id FROM sessions WHERE wallet_address = ? AND expires_at > ?',
			walletAddress,
			now,
		)
		return result.toArray().map((row) => row.session_id)
	}

	async deleteAllSessions(walletAddress: string): Promise<number> {
		const result = this.ctx.storage.sql.exec(
			'DELETE FROM sessions WHERE wallet_address = ?',
			walletAddress,
		)
		return result.rowsWritten
	}

	async getSessionInfo(sessionId: string): Promise<{ address: string; verified: boolean } | null> {
		const now = Date.now()
		const result = this.ctx.storage.sql.exec<SessionRow>(
			'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ?',
			sessionId,
			now,
		)
		const rows = result.toArray()
		if (rows.length === 0) return null
		return { address: rows[0].wallet_address, verified: rows[0].verified === 1 }
	}

	async extendSession(sessionId: string): Promise<boolean> {
		const now = Date.now()
		const expiresAt = now + SESSION_EXPIRY_MS

		const result = this.ctx.storage.sql.exec(
			'UPDATE sessions SET expires_at = ? WHERE session_id = ? AND expires_at > ?',
			expiresAt,
			sessionId,
			now,
		)

		return result.rowsWritten > 0
	}

	private async scheduleCleanup(): Promise<void> {
		const currentAlarm = await this.ctx.storage.getAlarm()
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000)
		}
	}

	async alarm(): Promise<void> {
		const now = Date.now()
		this.ctx.storage.sql.exec('DELETE FROM sessions WHERE expires_at <= ?', now)
		this.ctx.storage.sql.exec('DELETE FROM challenges WHERE expires_at <= ?', now)
		this.ctx.storage.sql.exec(
			'DELETE FROM rate_limits WHERE created_at < ?',
			now - RATE_LIMIT_WINDOW_MS,
		)
		await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000)
	}
}
