import { DurableObject } from 'cloudflare:workers';
import type { SqlStorageValue } from '@cloudflare/workers-types';
import type { Env } from '../types';

const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

interface SessionRow {
	[key: string]: SqlStorageValue;
	session_id: string;
	wallet_address: string;
	created_at: number;
	expires_at: number;
}

export class WalletSession extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          session_id TEXT PRIMARY KEY,
          wallet_address TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )
      `);
			this.ctx.storage.sql.exec(
				'CREATE INDEX IF NOT EXISTS idx_wallet ON sessions(wallet_address)',
			);
			this.ctx.storage.sql.exec(
				'CREATE INDEX IF NOT EXISTS idx_expires ON sessions(expires_at)',
			);
		});
	}

	async createSession(walletAddress: string, sessionId?: string): Promise<string> {
		const now = Date.now();
		const expiresAt = now + SESSION_EXPIRY_MS;
		const sid = sessionId || crypto.randomUUID();

		this.ctx.storage.sql.exec(
			`
      INSERT INTO sessions (session_id, wallet_address, created_at, expires_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        wallet_address = excluded.wallet_address,
        created_at = excluded.created_at,
        expires_at = excluded.expires_at
    `,
			sid,
			walletAddress,
			now,
			expiresAt,
		);

		await this.scheduleCleanup();
		return sid;
	}

	async deleteSession(sessionId: string): Promise<boolean> {
		const result = this.ctx.storage.sql.exec(
			'DELETE FROM sessions WHERE session_id = ?',
			sessionId,
		);
		return result.rowsWritten > 0;
	}

	async getSession(sessionId: string): Promise<string | null> {
		const now = Date.now();
		const result = this.ctx.storage.sql.exec<SessionRow>(
			'SELECT * FROM sessions WHERE session_id = ? AND expires_at > ?',
			sessionId,
			now,
		);

		const rows = result.toArray();
		return rows[0]?.wallet_address ?? null;
	}

	async getByWallet(walletAddress: string): Promise<string[]> {
		const now = Date.now();
		const result = this.ctx.storage.sql.exec<SessionRow>(
			'SELECT session_id FROM sessions WHERE wallet_address = ? AND expires_at > ?',
			walletAddress,
			now,
		);
		return result.toArray().map((row) => row.session_id);
	}

	async deleteAllSessions(walletAddress: string): Promise<number> {
		const result = this.ctx.storage.sql.exec(
			'DELETE FROM sessions WHERE wallet_address = ?',
			walletAddress,
		);
		return result.rowsWritten;
	}

	async extendSession(sessionId: string): Promise<boolean> {
		const now = Date.now();
		const expiresAt = now + SESSION_EXPIRY_MS;

		const result = this.ctx.storage.sql.exec(
			'UPDATE sessions SET expires_at = ? WHERE session_id = ? AND expires_at > ?',
			expiresAt,
			sessionId,
			now,
		);

		return result.rowsWritten > 0;
	}

	private async scheduleCleanup(): Promise<void> {
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
		}
	}

	async alarm(): Promise<void> {
		const now = Date.now();
		this.ctx.storage.sql.exec('DELETE FROM sessions WHERE expires_at <= ?', now);
		await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
	}
}
