/**
 * sui.ski Passkey Wallet - Ika dWallet + WebAuthn Integration
 *
 * Creates a cross-subdomain passkey wallet that works on all *.sui.ski domains
 * using Ika's 2PC-MPC for zero-trust threshold signatures.
 */

import type { Env } from '../types'

// Storage keys are defined in client-side JS:
// - sui_ski_passkey_credential
// - sui_ski_dwallet
// - sui_ski_encryption_keys

/**
 * Get Ika network configuration based on Sui network
 */
export function getIkaConfig(network: 'mainnet' | 'testnet') {
	if (network === 'mainnet') {
		return {
			packages: {
				ikaPackage: '0x7262fb2f7a3a14c888c438a3cd9b912469a58cf60f367352c46584262e8299aa',
				ikaCommonPackage: '0x9e1e9f8e4e51ee2421a8e7c0c6ab3ef27c337025d15333461b72b1b813c44175',
				ikaSystemOriginalPackage:
					'0xb874c9b51b63e05425b74a22891c35b8da447900e577667b52e85a16d4d85486',
				ikaSystemPackage: '0xd69f947d7ee6f224dd0dd31ec3ec30c0dd0f713a1de55d564e8e98910c4f9553',
				ikaDwallet2pcMpcOriginalPackage:
					'0xdd24c62739923fbf582f49ef190b4a007f981ca6eb209ca94f3a8eaf7c611317',
				ikaDwallet2pcMpcPackage:
					'0x23b5bd96051923f800c3a2150aacdcdd8d39e1df2dce4dac69a00d2d8c7f7e77',
			},
			objects: {
				ikaSystemObject: {
					objectID: '0x215de95d27454d102d6f82ff9c54d8071eb34d5706be85b5c73cbd8173013c80',
					initialSharedVersion: 595745916,
				},
				ikaDWalletCoordinator: {
					objectID: '0x5ea59bce034008a006425df777da925633ef384ce25761657ea89e2a08ec75f3',
					initialSharedVersion: 595876492,
				},
			},
		}
	}
	return {
		packages: {
			ikaPackage: '0x1f26bb2f711ff82dcda4d02c77d5123089cb7f8418751474b9fb744ce031526a',
			ikaCommonPackage: '0x96fc75633b6665cf84690587d1879858ff76f88c10c945e299f90bf4e0985eb0',
			ikaSystemOriginalPackage:
				'0xae71e386fd4cff3a080001c4b74a9e485cd6a209fa98fb272ab922be68869148',
			ikaSystemPackage: '0xde05f49e5f1ee13ed06c1e243c0a8e8fe858e1d8689476fdb7009af8ddc3c38b',
			ikaDwallet2pcMpcOriginalPackage:
				'0xf02f5960c94fce1899a3795b5d11fd076bc70a8d0e20a2b19923d990ed490730',
			ikaDwallet2pcMpcPackage:
				'0x6573a6c13daf26a64eb8a37d3c7a4391b353031e223072ca45b1ff9366f59293',
		},
		objects: {
			ikaSystemObject: {
				objectID: '0x2172c6483ccd24930834e30102e33548b201d0607fb1fdc336ba3267d910dec6',
				initialSharedVersion: 508060325,
			},
			ikaDWalletCoordinator: {
				objectID: '0x4d157b7415a298c56ec2cb1dcab449525fa74aec17ddba376a83a7600f2062fc',
				initialSharedVersion: 510819272,
			},
		},
	}
}

/**
 * Generate the client-side JavaScript for the passkey wallet
 */
export function generatePasskeyWalletScript(env: Env): string {
	const network = env.SUI_NETWORK
	const rpcUrl = env.SUI_RPC_URL
	const ikaConfig = getIkaConfig(network as 'mainnet' | 'testnet')

	return `
// ========== SUI.SKI PASSKEY WALLET ==========
// Cross-subdomain passkey wallet using Ika 2PC-MPC

const PASSKEY_CREDENTIAL_KEY = 'sui_ski_passkey_credential';
const DWALLET_KEY = 'sui_ski_dwallet';
const ENCRYPTION_KEYS_KEY = 'sui_ski_encryption_keys';
const IKA_NETWORK = '${network}';
const IKA_CONFIG = ${JSON.stringify(ikaConfig)};
const SUI_RPC_URL = '${rpcUrl}';

// Passkey wallet state
let passkeyWalletState = {
	initialized: false,
	credentialId: null,
	dWalletId: null,
	dWalletAddress: null,
	encryptionKeysBytes: null,
	loading: false,
	error: null
};

// Check for existing passkey wallet on page load
async function initPasskeyWallet() {
	try {
		// Check localStorage for existing credential
		const savedCredential = localStorage.getItem(PASSKEY_CREDENTIAL_KEY);
		const savedDWallet = localStorage.getItem(DWALLET_KEY);
		const savedEncryptionKeys = localStorage.getItem(ENCRYPTION_KEYS_KEY);

		if (savedCredential && savedDWallet && savedEncryptionKeys) {
			const credential = JSON.parse(savedCredential);
			const dWallet = JSON.parse(savedDWallet);

			passkeyWalletState.credentialId = credential.id;
			passkeyWalletState.dWalletId = dWallet.id;
			passkeyWalletState.dWalletAddress = dWallet.address;
			passkeyWalletState.encryptionKeysBytes = savedEncryptionKeys;
			passkeyWalletState.initialized = true;

			console.log('[sui.ski] Passkey wallet loaded:', dWallet.address);
		}
	} catch (e) {
		console.error('[sui.ski] Failed to init passkey wallet:', e);
	}
	// Always render the UI (shows create button if not initialized)
	renderPasskeyWalletUI();
}

// Create a new passkey for sui.ski (works on all *.sui.ski subdomains)
async function createPasskey() {
	if (!window.PublicKeyCredential) {
		throw new Error('WebAuthn not supported in this browser');
	}

	// Check if passkeys are available
	const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
	if (!available) {
		console.warn('[sui.ski] Platform authenticator not available, trying cross-platform');
	}

	// Generate a random user ID
	const userId = new Uint8Array(32);
	crypto.getRandomValues(userId);

	const createOptions = {
		publicKey: {
			rp: {
				id: 'sui.ski',  // Works on ALL *.sui.ski subdomains
				name: 'sui.ski Wallet'
			},
			user: {
				id: userId,
				name: 'sui.ski User',
				displayName: 'sui.ski Passkey Wallet'
			},
			challenge: crypto.getRandomValues(new Uint8Array(32)),
			pubKeyCredParams: [
				{ type: 'public-key', alg: -7 },   // ES256 (P-256)
				{ type: 'public-key', alg: -257 }  // RS256 (fallback)
			],
			authenticatorSelection: {
				authenticatorAttachment: available ? 'platform' : 'cross-platform',
				userVerification: 'required',
				residentKey: 'required'
			},
			timeout: 60000,
			attestation: 'none',
			extensions: {
				prf: {
					eval: {
						first: new TextEncoder().encode('sui.ski-wallet-seed')
					}
				}
			}
		}
	};

	const credential = await navigator.credentials.create(createOptions);

	if (!credential) {
		throw new Error('Failed to create passkey');
	}

	// Extract the PRF result if available, otherwise use a derived seed
	let seed;
	const prfResult = credential.getClientExtensionResults?.()?.prf?.results?.first;

	if (prfResult) {
		seed = new Uint8Array(prfResult);
		console.log('[sui.ski] PRF extension supported - using hardware-derived seed');
	} else {
		// Fallback: derive seed from credential ID + authenticator data
		const rawId = new Uint8Array(credential.rawId);
		const authData = new Uint8Array(credential.response.authenticatorData || []);
		const combined = new Uint8Array(rawId.length + authData.length);
		combined.set(rawId);
		combined.set(authData, rawId.length);

		// Hash to get deterministic seed
		seed = new Uint8Array(await crypto.subtle.digest('SHA-256', combined));
		console.log('[sui.ski] PRF not available - using derived seed');
	}

	// Save credential info
	const credentialInfo = {
		id: bufferToBase64(credential.rawId),
		type: credential.type,
		created: Date.now()
	};

	localStorage.setItem(PASSKEY_CREDENTIAL_KEY, JSON.stringify(credentialInfo));
	passkeyWalletState.credentialId = credentialInfo.id;

	return { credential, seed, credentialInfo };
}

// Authenticate with existing passkey
async function authenticatePasskey() {
	const savedCredential = localStorage.getItem(PASSKEY_CREDENTIAL_KEY);
	if (!savedCredential) {
		throw new Error('No passkey found. Please create one first.');
	}

	const credentialInfo = JSON.parse(savedCredential);

	const getOptions = {
		publicKey: {
			rpId: 'sui.ski',
			challenge: crypto.getRandomValues(new Uint8Array(32)),
			allowCredentials: [{
				type: 'public-key',
				id: base64ToBuffer(credentialInfo.id)
			}],
			userVerification: 'required',
			timeout: 60000,
			extensions: {
				prf: {
					eval: {
						first: new TextEncoder().encode('sui.ski-wallet-seed')
					}
				}
			}
		}
	};

	const assertion = await navigator.credentials.get(getOptions);

	if (!assertion) {
		throw new Error('Authentication failed');
	}

	// Get the seed (same derivation as creation)
	let seed;
	const prfResult = assertion.getClientExtensionResults?.()?.prf?.results?.first;

	if (prfResult) {
		seed = new Uint8Array(prfResult);
	} else {
		const rawId = new Uint8Array(assertion.rawId);
		const authData = new Uint8Array(assertion.response.authenticatorData || []);
		const combined = new Uint8Array(rawId.length + authData.length);
		combined.set(rawId);
		combined.set(authData, rawId.length);
		seed = new Uint8Array(await crypto.subtle.digest('SHA-256', combined));
	}

	return { assertion, seed };
}

// Create a new dWallet using Ika
async function createDWallet(seed) {
	passkeyWalletState.loading = true;
	passkeyWalletState.error = null;
	renderPasskeyWalletUI();

	try {
		// Import Ika SDK dynamically
		const { IkaClient, IkaTransaction, UserShareEncryptionKeys, getNetworkConfig } =
			await import('https://esm.sh/@ika.xyz/sdk@0.2.7');
		const { SuiClient } = await import('https://esm.sh/@mysten/sui@1.27.0/client');
		const { Ed25519Keypair } = await import('https://esm.sh/@mysten/sui@1.27.0/keypairs/ed25519');
		const { toHex } = await import('https://esm.sh/@mysten/sui@1.27.0/utils');

		// Create Sui client
		const suiClient = new SuiClient({ url: SUI_RPC_URL });

		// Create Ika client
		const ikaClient = new IkaClient({
			suiClient,
			config: getNetworkConfig(IKA_NETWORK)
		});

		// Create encryption keys from passkey seed
		const userShareEncryptionKeys = await UserShareEncryptionKeys.fromRootSeedKey(
			seed,
			'SECP256K1'  // Bitcoin/Ethereum compatible
		);

		// Save encryption keys for later use
		const encryptionKeysBytes = userShareEncryptionKeys.toShareEncryptionKeysBytes();
		localStorage.setItem(ENCRYPTION_KEYS_KEY, bufferToBase64(encryptionKeysBytes));
		passkeyWalletState.encryptionKeysBytes = bufferToBase64(encryptionKeysBytes);

		// For now, we'll create a simple keypair from the seed for the Sui address
		// The full dWallet DKG requires a funded account to pay for gas
		const keypair = Ed25519Keypair.deriveKeypairFromSeed(toHex(seed));
		const address = keypair.getPublicKey().toSuiAddress();

		// Store dWallet info (simplified - full DKG would be done when user has gas)
		const dWalletInfo = {
			id: 'pending-dkg',
			address: address,
			curve: 'SECP256K1',
			created: Date.now(),
			status: 'seed-derived'  // Full dWallet requires DKG ceremony with gas
		};

		localStorage.setItem(DWALLET_KEY, JSON.stringify(dWalletInfo));

		passkeyWalletState.dWalletId = dWalletInfo.id;
		passkeyWalletState.dWalletAddress = address;
		passkeyWalletState.initialized = true;
		passkeyWalletState.loading = false;

		console.log('[sui.ski] Passkey wallet created:', address);
		renderPasskeyWalletUI();

		return { address, dWalletInfo };

	} catch (error) {
		console.error('[sui.ski] Failed to create dWallet:', error);
		passkeyWalletState.error = error.message;
		passkeyWalletState.loading = false;
		renderPasskeyWalletUI();
		throw error;
	}
}

// Full dWallet creation with DKG (requires gas)
async function initializeDWalletDKG() {
	if (!passkeyWalletState.encryptionKeysBytes) {
		throw new Error('No encryption keys found. Create a passkey first.');
	}

	passkeyWalletState.loading = true;
	passkeyWalletState.error = null;
	renderPasskeyWalletUI();

	try {
		const { IkaClient, IkaTransaction, UserShareEncryptionKeys, getNetworkConfig, prepareDKGAsync } =
			await import('https://esm.sh/@ika.xyz/sdk@0.2.7');
		const { SuiClient } = await import('https://esm.sh/@mysten/sui@1.27.0/client');
		const { Transaction } = await import('https://esm.sh/@mysten/sui@1.27.0/transactions');

		const suiClient = new SuiClient({ url: SUI_RPC_URL });
		const ikaClient = new IkaClient({
			suiClient,
			config: getNetworkConfig(IKA_NETWORK)
		});

		// Restore encryption keys
		const encryptionKeysBytes = base64ToBuffer(passkeyWalletState.encryptionKeysBytes);
		const userShareEncryptionKeys = UserShareEncryptionKeys.fromShareEncryptionKeysBytes(encryptionKeysBytes);

		// Get signer address (need connected wallet for gas)
		if (!connectedAddress) {
			throw new Error('Please connect a wallet to pay for gas fees');
		}

		// Prepare DKG
		const sessionIdentifier = crypto.randomUUID();
		const dkgRequestInput = await prepareDKGAsync(
			ikaClient,
			'SECP256K1',
			userShareEncryptionKeys,
			sessionIdentifier,
			connectedAddress
		);

		// Create transaction
		const ikaTransaction = new IkaTransaction(ikaClient);

		// Register encryption key and request DKG
		await ikaTransaction.registerEncryptionKey({ curve: 'SECP256K1' });

		const [dWalletCap, signId] = await ikaTransaction.requestDWalletDKG({
			curve: 'SECP256K1',
			dkgRequestInput,
			sessionIdentifier
		});

		// Build and return transaction for signing
		const tx = await ikaTransaction.build({ sender: connectedAddress });

		passkeyWalletState.loading = false;
		renderPasskeyWalletUI();

		return { transaction: tx, dWalletCap, signId };

	} catch (error) {
		console.error('[sui.ski] DKG initialization failed:', error);
		passkeyWalletState.error = error.message;
		passkeyWalletState.loading = false;
		renderPasskeyWalletUI();
		throw error;
	}
}

// Disconnect passkey wallet
function disconnectPasskeyWallet() {
	localStorage.removeItem(PASSKEY_CREDENTIAL_KEY);
	localStorage.removeItem(DWALLET_KEY);
	localStorage.removeItem(ENCRYPTION_KEYS_KEY);

	passkeyWalletState = {
		initialized: false,
		credentialId: null,
		dWalletId: null,
		dWalletAddress: null,
		encryptionKeysBytes: null,
		loading: false,
		error: null
	};

	renderPasskeyWalletUI();
	console.log('[sui.ski] Passkey wallet disconnected');
}

// Utility functions
function bufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToBuffer(base64) {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

// UI Rendering
function renderPasskeyWalletUI() {
	const container = document.getElementById('passkey-wallet-container');
	if (!container) return;

	if (passkeyWalletState.loading) {
		container.innerHTML = \`
			<div class="passkey-loading">
				<span class="loading"></span>
				<span>Setting up passkey wallet...</span>
			</div>
		\`;
		return;
	}

	if (passkeyWalletState.error) {
		container.innerHTML = \`
			<div class="passkey-error">
				<p>\${escapeHtmlJs(passkeyWalletState.error)}</p>
				<button onclick="passkeyWalletState.error = null; renderPasskeyWalletUI();">Dismiss</button>
			</div>
		\`;
		return;
	}

	if (passkeyWalletState.initialized && passkeyWalletState.dWalletAddress) {
		const shortAddr = passkeyWalletState.dWalletAddress.slice(0, 8) + '...' +
		                  passkeyWalletState.dWalletAddress.slice(-6);
		container.innerHTML = \`
			<div class="passkey-connected">
				<div class="passkey-header">
					<div class="passkey-icon">🔐</div>
					<div class="passkey-info">
						<div class="passkey-label">sui.ski Passkey Wallet</div>
						<div class="passkey-address">\${shortAddr}</div>
					</div>
				</div>
				<div class="passkey-actions">
					<button class="passkey-copy-btn" onclick="navigator.clipboard.writeText('\${passkeyWalletState.dWalletAddress}'); this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy', 1500);">
						Copy
					</button>
					<button class="passkey-disconnect-btn" onclick="disconnectPasskeyWallet()">
						Disconnect
					</button>
				</div>
			</div>
			<div class="passkey-badge">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
				</svg>
				<span>Works on all *.sui.ski</span>
			</div>
		\`;
	} else {
		container.innerHTML = \`
			<div class="passkey-create">
				<div class="passkey-create-header">
					<div class="passkey-icon-large">🔐</div>
					<h4>sui.ski Passkey Wallet</h4>
					<p>Create a wallet with Face ID, Touch ID, or security key</p>
				</div>
				<button class="passkey-create-btn" onclick="handleCreatePasskeyWallet()">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
					</svg>
					Create Passkey Wallet
				</button>
				<div class="passkey-features">
					<div class="passkey-feature">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>No seed phrase</span>
					</div>
					<div class="passkey-feature">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>Cross-subdomain</span>
					</div>
					<div class="passkey-feature">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>Hardware secured</span>
					</div>
				</div>
			</div>
		\`;
	}
}

// Handle passkey wallet creation
async function handleCreatePasskeyWallet() {
	try {
		passkeyWalletState.loading = true;
		renderPasskeyWalletUI();

		const { credential, seed, credentialInfo } = await createPasskey();
		await createDWallet(seed);

	} catch (error) {
		console.error('[sui.ski] Passkey wallet creation failed:', error);
		passkeyWalletState.error = error.message || 'Failed to create passkey wallet';
		passkeyWalletState.loading = false;
		renderPasskeyWalletUI();
	}
}

// Initialize on page load
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initPasskeyWallet);
} else {
	initPasskeyWallet();
}

console.log('[sui.ski] Passkey wallet module loaded');
`
}

/**
 * Generate CSS styles for the passkey wallet UI
 */
export function generatePasskeyWalletStyles(): string {
	return `
		/* Passkey Wallet Styles */
		.passkey-section {
			background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
			border: 1px solid rgba(139, 92, 246, 0.3);
			border-radius: 16px;
			padding: 20px;
			margin-bottom: 20px;
		}
		.passkey-section-title {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 0.95rem;
			font-weight: 700;
			color: var(--text);
			margin-bottom: 16px;
		}
		.passkey-section-title svg {
			width: 20px;
			height: 20px;
			color: #a78bfa;
		}
		.passkey-loading {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 12px;
			padding: 24px;
			color: var(--text-muted);
		}
		.passkey-error {
			background: var(--error-light);
			border: 1px solid rgba(248, 113, 113, 0.3);
			border-radius: 12px;
			padding: 16px;
			text-align: center;
		}
		.passkey-error p {
			color: var(--error);
			margin-bottom: 12px;
			font-size: 0.85rem;
		}
		.passkey-error button {
			padding: 8px 16px;
			background: transparent;
			border: 1px solid var(--error);
			color: var(--error);
			border-radius: 8px;
			cursor: pointer;
			font-size: 0.8rem;
		}
		.passkey-connected {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			flex-wrap: wrap;
		}
		.passkey-header {
			display: flex;
			align-items: center;
			gap: 12px;
		}
		.passkey-icon {
			font-size: 1.5rem;
		}
		.passkey-icon-large {
			font-size: 2.5rem;
			margin-bottom: 8px;
		}
		.passkey-info {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}
		.passkey-label {
			font-size: 0.75rem;
			color: var(--text-muted);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
		.passkey-address {
			font-family: ui-monospace, monospace;
			font-size: 0.9rem;
			font-weight: 600;
			color: #a78bfa;
		}
		.passkey-actions {
			display: flex;
			gap: 8px;
		}
		.passkey-copy-btn {
			padding: 8px 14px;
			background: rgba(139, 92, 246, 0.15);
			border: 1px solid rgba(139, 92, 246, 0.3);
			border-radius: 8px;
			color: #a78bfa;
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
		}
		.passkey-copy-btn:hover {
			background: rgba(139, 92, 246, 0.25);
		}
		.passkey-disconnect-btn {
			padding: 8px 14px;
			background: transparent;
			border: 1px solid var(--border);
			border-radius: 8px;
			color: var(--text-muted);
			font-size: 0.8rem;
			cursor: pointer;
			transition: all 0.2s;
		}
		.passkey-disconnect-btn:hover {
			border-color: var(--error);
			color: var(--error);
		}
		.passkey-badge {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-top: 12px;
			padding: 6px 12px;
			background: rgba(52, 211, 153, 0.1);
			border-radius: 20px;
			font-size: 0.7rem;
			color: var(--success);
			width: fit-content;
		}
		.passkey-create {
			text-align: center;
			padding: 8px;
		}
		.passkey-create-header {
			margin-bottom: 20px;
		}
		.passkey-create-header h4 {
			font-size: 1.1rem;
			font-weight: 700;
			color: var(--text);
			margin-bottom: 6px;
		}
		.passkey-create-header p {
			font-size: 0.85rem;
			color: var(--text-muted);
		}
		.passkey-create-btn {
			display: inline-flex;
			align-items: center;
			gap: 10px;
			padding: 14px 28px;
			background: linear-gradient(135deg, #8b5cf6, #6366f1);
			border: none;
			border-radius: 12px;
			color: white;
			font-size: 0.95rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;
			box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
		}
		.passkey-create-btn:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
		}
		.passkey-features {
			display: flex;
			justify-content: center;
			gap: 20px;
			margin-top: 20px;
			flex-wrap: wrap;
		}
		.passkey-feature {
			display: flex;
			align-items: center;
			gap: 6px;
			font-size: 0.8rem;
			color: var(--text-muted);
		}
		.passkey-feature svg {
			color: var(--success);
		}
		@media (max-width: 600px) {
			.passkey-connected {
				flex-direction: column;
				align-items: flex-start;
			}
			.passkey-actions {
				width: 100%;
			}
			.passkey-actions button {
				flex: 1;
			}
			.passkey-features {
				flex-direction: column;
				align-items: center;
				gap: 10px;
			}
		}
	`
}

/**
 * Generate HTML for the passkey wallet section
 */
export function generatePasskeyWalletHTML(): string {
	return `
		<div class="passkey-section">
			<div class="passkey-section-title">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
				</svg>
				<span>Passkey Wallet</span>
				<span style="font-size: 0.65rem; padding: 2px 8px; background: rgba(251, 191, 36, 0.15); color: #fbbf24; border-radius: 6px; font-weight: 600; text-transform: uppercase; margin-left: auto;">Beta</span>
			</div>
			<div id="passkey-wallet-container">
				<!-- Passkey wallet UI will be rendered here -->
			</div>
		</div>
	`
}
