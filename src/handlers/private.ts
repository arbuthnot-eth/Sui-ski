/**
 * Private Protocol Handler
 *
 * Provides API endpoints and UI for the @iousd/private privacy protocol.
 * This is a fork of the Vortex protocol optimized for ioUSD.
 *
 * Pattern: private--iousd.sui.ski
 * MVR: @iousd/private
 */

// import { SuiClient } from '@mysten/sui/client' // TODO: Enable when deployed
import type { Env } from '../types'
import { errorResponse, htmlResponse, jsonResponse } from '../utils/response'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

// Package IDs (to be updated after deployment)
const PRIVATE_PACKAGE_ID = {
	mainnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
	testnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
}

const PRIVATE_REGISTRY_ID = {
	mainnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
	testnet: '0x0000000000000000000000000000000000000000000000000000000000000000',
}

// Supported coin types (start with SUI, add ioUSD later)
const SUPPORTED_COINS = ['0x2::sui::SUI']

/**
 * Handle requests to private--iousd.sui.ski
 */
export async function handlePrivateRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname

	// CORS preflight
	if (request.method === 'OPTIONS') {
		return new Response(null, {
			headers: CORS_HEADERS,
		})
	}

	// Route based on path
	if (path === '/' || path === '') {
		return htmlResponse(generatePrivatePage(env))
	}

	// API routes
	if (path.startsWith('/api/')) {
		return handlePrivateApiRequest(request, env)
	}

	return errorResponse('Not found', 'NOT_FOUND', 404)
}

/**
 * Handle API requests
 */
async function handlePrivateApiRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const apiPath = url.pathname.replace('/api', '')

	switch (apiPath) {
		case '/info':
			return handleGetInfo(env)
		case '/pools':
			return handleGetPools(env)
		case '/registry':
			return handleGetRegistry(env)
		case '/commitments':
			return handleGetCommitments(request, env)
		case '/nullifiers':
			return handleCheckNullifiers(request, env)
		case '/sdk':
			return handleGetSdkInfo()
		case '/ligetron':
			return handleGetLigetronInfo()
		default:
			return errorResponse('Endpoint not found', 'NOT_FOUND', 404)
	}
}

/**
 * GET /api/info - Protocol information
 */
function handleGetInfo(env: Env): Response {
	const network = env.SUI_NETWORK as 'mainnet' | 'testnet'
	return jsonResponse({
		success: true,
		data: {
			name: 'Private Protocol',
			description: 'Privacy-preserving transactions on Sui (Vortex fork)',
			mvrName: '@iousd/private',
			subdomain: 'private--iousd.sui.ski',
			packageId: PRIVATE_PACKAGE_ID[network],
			registryId: PRIVATE_REGISTRY_ID[network],
			network,
			supportedCoins: SUPPORTED_COINS,
			features: [
				'Groth16 ZK proof verification (bn254)',
				'Merkle tree commitment tracking (height 26)',
				'2-input/2-output UTXO model',
				'Nullifier-based double-spend prevention',
				'Poseidon hash function',
			],
			documentation: 'https://github.com/interest-protocol/vortex',
			source: 'https://github.com/your-repo/private-protocol',
		},
	})
}

/**
 * GET /api/pools - List available privacy pools
 */
async function handleGetPools(env: Env): Promise<Response> {
	const network = env.SUI_NETWORK as 'mainnet' | 'testnet'
	const registryId = PRIVATE_REGISTRY_ID[network]

	// If registry is not deployed yet, return placeholder
	if (registryId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
		return jsonResponse({
			success: true,
			data: {
				pools: [],
				message: 'Registry not yet deployed. Deploy the private package first.',
			},
		})
	}

	try {
		// TODO: Query pool data from registry when deployed
		// const client = new SuiClient({ url: env.SUI_RPC_URL })
		// const registry = await client.getObject({ id: registryId, options: { showContent: true } })

		// Parse pools from registry (placeholder)
		return jsonResponse({
			success: true,
			data: {
				registryId,
				pools: SUPPORTED_COINS.map((coinType) => ({
					coinType,
					poolId: null, // To be filled after pool creation
					balance: '0',
					commitmentCount: 0,
				})),
			},
		})
	} catch (error) {
		return errorResponse(
			`Failed to fetch pools: ${error instanceof Error ? error.message : 'Unknown error'}`,
			'FETCH_ERROR',
			500,
		)
	}
}

/**
 * GET /api/registry - Registry information
 */
async function handleGetRegistry(env: Env): Promise<Response> {
	const network = env.SUI_NETWORK as 'mainnet' | 'testnet'

	return jsonResponse({
		success: true,
		data: {
			network,
			packageId: PRIVATE_PACKAGE_ID[network],
			registryId: PRIVATE_REGISTRY_ID[network],
			deployed:
				PRIVATE_REGISTRY_ID[network] !==
				'0x0000000000000000000000000000000000000000000000000000000000000000',
		},
	})
}

/**
 * GET /api/commitments - Get commitments from pool
 */
async function handleGetCommitments(request: Request, _env: Env): Promise<Response> {
	const url = new URL(request.url)
	const coinType = url.searchParams.get('coinType') || '0x2::sui::SUI'
	const startIndex = Number.parseInt(url.searchParams.get('index') || '0', 10)
	const limit = Math.min(Number.parseInt(url.searchParams.get('limit') || '100', 10), 1000)

	// Placeholder - actual implementation reads from pool's Merkle tree
	return jsonResponse({
		success: true,
		data: {
			coinType,
			startIndex,
			limit,
			commitments: [],
			message: 'Pool not yet deployed. Deploy and create a pool first.',
		},
	})
}

/**
 * POST /api/nullifiers - Check if nullifiers are spent
 */
async function handleCheckNullifiers(request: Request, _env: Env): Promise<Response> {
	if (request.method !== 'POST') {
		return errorResponse('Method not allowed', 'METHOD_NOT_ALLOWED', 405)
	}

	try {
		const body = (await request.json()) as { nullifiers: string[]; coinType?: string }
		const { nullifiers, coinType = '0x2::sui::SUI' } = body

		if (!Array.isArray(nullifiers)) {
			return errorResponse('nullifiers must be an array', 'INVALID_INPUT', 400)
		}

		// Placeholder - actual implementation checks pool's nullifier table
		return jsonResponse({
			success: true,
			data: {
				coinType,
				results: nullifiers.map((n) => ({
					nullifier: n,
					spent: false,
				})),
				message: 'Pool not yet deployed. Deploy and create a pool first.',
			},
		})
	} catch (error) {
		return errorResponse('Invalid JSON body', 'INVALID_JSON', 400)
	}
}

/**
 * GET /api/sdk - SDK information and integration guide
 */
function handleGetSdkInfo(): Response {
	return jsonResponse({
		success: true,
		data: {
			name: '@iousd/private-sdk',
			version: '0.1.0',
			description: 'Client-side SDK for privacy-preserving transactions',
			architecture: 'hybrid',
			provers: {
				ligetron: {
					description: 'Fast client-side witness generation',
					capabilities: ['witness-generation', 'local-verification'],
					performance: '~100 TPS in browser',
					postQuantum: true,
				},
				groth16: {
					description: 'On-chain proof verification',
					capabilities: ['proof-generation', 'sui-verification'],
					curve: 'BN254',
					performance: '~1ms verification',
				},
			},
			installation: {
				browser: '<script src="https://private--iousd.sui.ski/sdk.js"></script>',
				npm: 'npm install @iousd/private-sdk',
			},
			endpoints: {
				info: '/api/info',
				pools: '/api/pools',
				registry: '/api/registry',
				commitments: '/api/commitments',
				nullifiers: '/api/nullifiers',
				sdk: '/api/sdk',
				ligetron: '/api/ligetron',
			},
			documentation: 'https://private--iousd.sui.ski/docs',
			github: 'https://github.com/ligeroinc/ligero-prover',
		},
	})
}

/**
 * GET /api/ligetron - Ligetron prover information
 */
function handleGetLigetronInfo(): Response {
	return jsonResponse({
		success: true,
		data: {
			name: 'Ligetron',
			description: 'Post-quantum secure zkVM for client-side proof generation',
			provider: 'Ligero Inc.',
			website: 'https://ligero-inc.com/',
			github: 'https://github.com/ligeroinc/ligero-prover',
			features: [
				'No trusted setup required',
				'Post-quantum secure (hash-based)',
				'Browser-native WASM execution',
				'~100 TPS in browser',
				'Scales to billions of gates',
				'Memory efficient (<2GB RAM)',
			],
			integration: {
				architecture: 'Hybrid (Ligetron + Groth16)',
				witnessGeneration: 'Ligetron zkVM (client-side)',
				proofGeneration: 'Groth16 over BN254 (client-side)',
				verification: 'Sui native groth16::verify_groth16_proof',
			},
			sdkUsage: `
// Initialize with Ligetron prover
const protocol = new PrivateProtocol({
  network: 'mainnet',
  prover: 'hybrid', // Use Ligetron + Groth16
});

await protocol.initialize();

// Generate proof (Ligetron generates witness, converts to Groth16)
const proof = await protocol.generateWithdrawalProof({
  inputNotes: [note1, note2],
  amount: 1_000_000_000n,
  recipient: '0x...',
  root: currentMerkleRoot,
  merkleProofs: [proof1, proof2],
});
			`.trim(),
			resources: [
				{ name: 'Ligero Paper', url: 'https://acmccs.github.io/papers/p2087-amesA.pdf' },
				{ name: 'Ligetron IEEE', url: 'https://ieeexplore.ieee.org/document/10646776/' },
				{ name: 'zkVM Examples', url: 'https://github.com/SoundnessLabs/zkvm-examples' },
				{ name: 'sp1-sui Verifier', url: 'https://github.com/SoundnessLabs/sp1-sui' },
			],
		},
	})
}

/**
 * Generate the Private Protocol UI page
 */
function generatePrivatePage(env: Env): string {
	const network = env.SUI_NETWORK as 'mainnet' | 'testnet'
	const packageId = PRIVATE_PACKAGE_ID[network]
	const registryId = PRIVATE_REGISTRY_ID[network]
	const isDeployed =
		registryId !== '0x0000000000000000000000000000000000000000000000000000000000000000'

	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Private Protocol | @iousd/private</title>
    <meta name="description" content="Privacy-preserving transactions on Sui blockchain">
    <style>
        :root {
            --bg: #0a0a0f;
            --card: #12121a;
            --border: #1e1e2e;
            --text: #e0e0e0;
            --text-muted: #888;
            --accent: #7c3aed;
            --accent-glow: rgba(124, 58, 237, 0.3);
            --success: #22c55e;
            --warning: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            padding: 2rem;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, var(--accent), #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { color: var(--text-muted); margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
        }
        .card h3 {
            color: var(--accent);
            margin-bottom: 1rem;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .status {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.875rem;
            background: ${isDeployed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
            color: ${isDeployed ? 'var(--success)' : 'var(--warning)'};
        }
        .status::before {
            content: '';
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }
        .mono {
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 0.75rem;
            color: var(--text-muted);
            word-break: break-all;
        }
        .features { list-style: none; }
        .features li {
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--border);
            color: var(--text-muted);
        }
        .features li:last-child { border-bottom: none; }
        .features li::before {
            content: '✓';
            color: var(--success);
            margin-right: 0.75rem;
        }
        .api-table { width: 100%; border-collapse: collapse; }
        .api-table th, .api-table td {
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px solid var(--border);
        }
        .api-table th { color: var(--text-muted); font-weight: 500; }
        .method {
            display: inline-block;
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .method.get { background: rgba(34, 197, 94, 0.2); color: var(--success); }
        .method.post { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        code {
            background: var(--bg);
            padding: 0.125rem 0.375rem;
            border-radius: 4px;
            font-size: 0.875rem;
        }
        .footer {
            margin-top: 3rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border);
            color: var(--text-muted);
            font-size: 0.875rem;
        }
        .footer a { color: var(--accent); text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Private Protocol</h1>
        <p class="subtitle">Privacy-preserving transactions on Sui • @iousd/private</p>

        <div class="grid">
            <div class="card">
                <h3>Protocol Status</h3>
                <div class="status">${isDeployed ? 'Deployed' : 'Not Deployed'}</div>
                <p style="margin-top: 1rem; color: var(--text-muted);">
                    Network: <strong>${network}</strong>
                </p>
            </div>

            <div class="card">
                <h3>Package Info</h3>
                <p style="margin-bottom: 0.5rem;">Package ID:</p>
                <p class="mono">${packageId}</p>
                <p style="margin: 0.5rem 0;">Registry ID:</p>
                <p class="mono">${registryId}</p>
            </div>

            <div class="card">
                <h3>Supported Coins</h3>
                <ul class="features">
                    <li>SUI (0x2::sui::SUI)</li>
                    <li style="color: var(--warning);">ioUSD (coming soon)</li>
                </ul>
            </div>
        </div>

        <div class="card" style="margin-bottom: 2rem;">
            <h3>Features</h3>
            <ul class="features">
                <li>Groth16 ZK proof verification (bn254 curve)</li>
                <li>Merkle tree commitment tracking (height 26, ~67M leaves)</li>
                <li>2-input/2-output UTXO model</li>
                <li>Nullifier-based double-spend prevention</li>
                <li>Poseidon hash function</li>
                <li>Transfer-to-owner (TTO) support</li>
            </ul>
        </div>

        <div class="card">
            <h3>API Endpoints</h3>
            <table class="api-table">
                <tr>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td><span class="method get">GET</span></td>
                    <td><code>/api/info</code></td>
                    <td>Protocol information</td>
                </tr>
                <tr>
                    <td><span class="method get">GET</span></td>
                    <td><code>/api/pools</code></td>
                    <td>List privacy pools</td>
                </tr>
                <tr>
                    <td><span class="method get">GET</span></td>
                    <td><code>/api/registry</code></td>
                    <td>Registry information</td>
                </tr>
                <tr>
                    <td><span class="method get">GET</span></td>
                    <td><code>/api/commitments</code></td>
                    <td>Get pool commitments</td>
                </tr>
                <tr>
                    <td><span class="method post">POST</span></td>
                    <td><code>/api/nullifiers</code></td>
                    <td>Check nullifier status</td>
                </tr>
            </table>
        </div>

        <div class="footer">
            <p>
                Private Protocol is a fork of <a href="https://github.com/interest-protocol/vortex" target="_blank">Vortex</a>.
                All ZK proof generation should happen client-side for maximum privacy.
            </p>
            <p style="margin-top: 0.5rem;">
                MVR: <code>@iousd/private</code> •
                Subdomain: <code>private--iousd.sui.ski</code>
            </p>
        </div>
    </div>

    <script>
        // Fetch and display pool status
        async function loadStatus() {
            try {
                const [poolsRes, registryRes] = await Promise.all([
                    fetch('/api/pools'),
                    fetch('/api/registry')
                ]);
                const pools = await poolsRes.json();
                const registry = await registryRes.json();
                console.log('Pools:', pools);
                console.log('Registry:', registry);
            } catch (e) {
                console.error('Failed to load status:', e);
            }
        }
        loadStatus();
    </script>
</body>
</html>`
}
