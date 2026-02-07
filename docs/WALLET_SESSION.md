# Cross-Subdomain Wallet Session

Single sign-on (SSO) wallet authentication across all `*.sui.ski` subdomains using Durable Objects.

## Architecture

```
┌─────────────────┐
│   sui.ski       │  User connects wallet
│  (root domain)  │  ────────────────┐
└─────────────────┘                  │
                                     ▼
┌─────────────────┐         ┌──────────────────┐
│ brandon.sui.ski │ ◄────── │  WalletSession   │
│  (SuiNS name)   │         │ Durable Object   │
└─────────────────┘         │                  │
                            │  Global SQLite   │
┌─────────────────┐         │  - sessions      │
│ core--suins.sui │ ◄────── │  - cleanup alarm │
│  (MVR package)  │         └──────────────────┘
└─────────────────┘                  ▲
                                     │
        All subdomains share   ──────┘
        .sui.ski cookie domain
```

## Features

- **Cross-subdomain authentication** - Connect wallet once on `sui.ski`, use everywhere
- **Dual persistence** - Cookies (fast) + Durable Object (reliable, server-queryable)
- **Automatic cleanup** - Hourly alarm deletes expired sessions
- **Session extension** - Auto-extends on check (rolling expiry)
- **Multiple sessions** - Same wallet can have multiple active sessions

## API Endpoints

### POST /api/wallet/connect

Connect a wallet and create a session.

**Request:**
```json
{
  "address": "0x..."
}
```

**Response:**
```json
{
  "sessionId": "uuid-v4",
  "address": "0x..."
}
```

**Cookies set:**
- `session_id` - Session UUID
- `wallet_address` - Wallet address (for client-side convenience)

Both cookies:
- Domain: `.sui.ski` (accessible to all subdomains)
- Max-Age: 30 days
- SameSite: Lax
- Secure: true

### GET /api/wallet/check

Check if the current session is valid.

**Query params:**
- `sessionId` (optional) - Explicit session ID to check

If no `sessionId` provided, reads from `session_id` cookie.

**Response:**
```json
{
  "address": "0x..." | null
}
```

If session valid, automatically extends expiry by 30 days.

### POST /api/wallet/disconnect

Disconnect wallet session.

**Request:**
```json
{
  "sessionId": "uuid-v4"
}
```

**Response:**
```json
{
  "success": true
}
```

**Cookies cleared:**
- `session_id`
- `wallet_address`

## Durable Object Methods

The `WalletSession` Durable Object provides these RPC methods:

### createSession(walletAddress: string, sessionId?: string): Promise<string>

Create or update a session. Returns session ID.

**Note:** Method name changed from `connect` to `createSession` to avoid conflict with WebSocket `connect()` method.

### deleteSession(sessionId: string): Promise<boolean>

Delete a session. Returns true if session existed.

### getSession(sessionId: string): Promise<string | null>

Get wallet address for session. Returns null if expired/not found.

### extendSession(sessionId: string): Promise<boolean>

Extend session expiry by 30 days. Returns true if session exists.

### getByWallet(walletAddress: string): Promise<string[]>

Get all active session IDs for a wallet.

### deleteAllSessions(walletAddress: string): Promise<number>

Delete all sessions for a wallet. Returns count deleted.

### alarm()

Automatic cleanup handler (runs hourly):
- Deletes expired sessions
- Reschedules next cleanup

## Client Usage

### Browser (TypeScript)

```typescript
import { walletSession } from './client/wallet-session';

// Connect wallet
const { sessionId, address } = await walletSession.connect('0x...');

// Check if connected (auto-extends session)
const { address } = await walletSession.check();
if (address) {
  console.log('Wallet connected:', address);
}

// Disconnect
await walletSession.disconnect();
```

### Browser (Vanilla JS)

```html
<script type="module">
  // Connect wallet
  async function connectWallet(address) {
    const response = await fetch('/api/wallet/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
      credentials: 'include', // Important for cookies
    });
    return response.json();
  }

  // Check if wallet connected
  async function checkWallet() {
    const response = await fetch('/api/wallet/check', {
      credentials: 'include',
    });
    const { address } = await response.json();
    return address;
  }

  // Auto-connect on page load
  window.addEventListener('DOMContentLoaded', async () => {
    const address = await checkWallet();
    if (address) {
      console.log('Auto-connected:', address);
      // Update UI to show connected state
    }
  });
</script>
```

## Storage Schema

### SQLite Table: sessions

```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_wallet ON sessions(wallet_address);
CREATE INDEX idx_expires ON sessions(expires_at);
```

## Security Considerations

1. **No signature verification** - Current implementation trusts the address. For production, require wallet signature:

```typescript
// Client generates message
const message = `Connect wallet to sui.ski\nTimestamp: ${Date.now()}`;
const signature = await wallet.signMessage(message);

// Server verifies
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
const isValid = await verifyPersonalMessageSignature(message, signature, address);
```

2. **HttpOnly cookies** - Consider adding `HttpOnly` flag to `wallet_address` cookie to prevent XSS (current implementation allows client-side JS access).

3. **CORS** - Restrict `Access-Control-Allow-Origin` in production (currently `*`).

4. **Rate limiting** - Add rate limiting to prevent session flooding.

## Deployment

### 1. Create Durable Object Namespace

Durable Object binding is already configured in `wrangler.toml`:

```toml
[[durable_objects.bindings]]
name = "WALLET_SESSIONS"
class_name = "WalletSession"
script_name = "sui-ski-gateway"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["WalletSession"]
```

### 2. Deploy

```bash
bun run deploy
```

The migration will automatically create the SQLite-backed `WalletSession` class.

### 3. Verify

```bash
# Connect wallet
curl -X POST https://sui.ski/api/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{"address":"0x123..."}' \
  -c cookies.txt

# Check session (reads from cookie)
curl https://sui.ski/api/wallet/check \
  -b cookies.txt

# Visit any subdomain - wallet should auto-connect
curl https://brandon.sui.ski/api/wallet/check \
  -b cookies.txt
```

## Why Not Tidehunter?

Tidehunter is Sui's **validator-level storage engine** (replaces RocksDB for blockchain state). It's not:
- Accessible from applications
- Queryable from Workers
- Designed for ephemeral session data

For cross-subdomain SSO, Durable Objects are the right tool:
- ✅ Low latency (~10ms)
- ✅ Strong consistency
- ✅ Automatic cleanup with alarms
- ✅ Accessible from Worker code
- ✅ SQLite-backed persistence

## Why Not On-Chain?

Could store sessions on Sui blockchain, but:
- ❌ Costs gas for every connect/disconnect
- ❌ Slower (200-500ms RPC latency vs 10ms DO)
- ❌ Overkill for ephemeral session data
- ❌ No automatic cleanup without paid automation

Use on-chain storage when you need:
- Censorship resistance
- Permanent records
- Cross-app portability
- Trustless verification

For simple SSO, Durable Objects are more practical.

## Performance

- **Session creation**: ~10-20ms
- **Session check**: ~5-10ms (cached in cookie)
- **Session extension**: ~10-15ms
- **Cleanup alarm**: ~50-100ms (runs hourly, non-blocking)

## Monitoring

```bash
# Stream live logs
bun run tail

# Watch for session operations
wrangler tail --format pretty | grep -i wallet
```

## Future Enhancements

1. **Signature verification** - Require wallet signatures for connect
2. **Rate limiting** - Prevent session flooding
3. **Analytics** - Track active sessions per wallet
4. **Revocation** - Admin API to revoke sessions
5. **Device fingerprinting** - Detect suspicious multi-device usage
6. **SuiNS integration** - Auto-lookup name from address
