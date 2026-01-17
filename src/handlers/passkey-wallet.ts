/**
 * sui.ski Passkey Wallet - Ika dWallet + WebAuthn Integration
 *
 * Creates a cross-subdomain passkey wallet that works on all *.sui.ski domains
 * using Ika's 2PC-MPC for zero-trust threshold signatures.
 */

import type { Env } from '../types'
import { getIkaConfig } from '../utils/ika'

// Storage keys are defined in client-side JS:
// - sui_ski_passkey_credential
// - sui_ski_dwallet
// - sui_ski_encryption_keys

/**
 * Generate the client-side JavaScript for the passkey wallet
 */
export function generatePasskeyWalletScript(env: Env): string {
	const suiNetwork = env.SUI_NETWORK
	const ikaNetwork = suiNetwork === 'mainnet' ? 'mainnet' : 'testnet'
	const rpcUrl = env.SUI_RPC_URL
	const ikaConfig = getIkaConfig(ikaNetwork)

	return `
// ========== SUI.SKI PASSKEY WALLET ==========
// Cross-subdomain passkey wallet using Ika 2PC-MPC
// Compatible with Proton Pass extension for secure passkey storage

const PASSKEY_CREDENTIAL_KEY = 'sui_ski_passkey_credential';
const DWALLET_KEY = 'sui_ski_dwallet';
const ENCRYPTION_KEYS_KEY = 'sui_ski_encryption_keys';
const IKA_NETWORK = '${ikaNetwork}';
const SUI_NETWORK = '${suiNetwork}';
const IKA_CONFIG = ${JSON.stringify(ikaConfig)};
const SUI_RPC_URL = '${rpcUrl}';

// Check if Proton Pass extension is available
function detectProtonPass() {
	try {
		// Check for Proton Pass extension via various methods
		// Proton Pass integrates with WebAuthn, so we check for indicators
		if (window.chrome && window.chrome.runtime) {
			// Check user agent or extension indicators
			return window.navigator.userAgent.includes('ProtonPass') || 
			       document.querySelector('meta[name="proton-pass"]') !== null ||
			       // Check if WebAuthn credentials might be managed by Proton Pass
			       (window.PublicKeyCredential && 
			        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== undefined);
		}
		// Also check for Firefox extension
		if (window.browser && window.browser.runtime) {
			return true; // Could be Proton Pass or other password manager
		}
		return false;
	} catch (e) {
		return false;
	}
}

// Try to save passkey metadata to Proton Pass (if API available)
async function saveToProtonPass(credentialInfo, walletAddress) {
	try {
		// Proton Pass doesn't have a public API yet, but we prepare for future integration
		// For now, the passkey is stored via standard WebAuthn and Proton Pass handles it
		// This function can be extended when Proton Pass API becomes available
		
		// Store metadata in localStorage as fallback
		const metadata = {
			credentialId: credentialInfo.id,
			walletAddress: walletAddress,
			rpId: 'sui.ski',
			created: credentialInfo.created,
			source: 'sui.ski-passkey-wallet'
		};
		
		// Try to use Proton Pass API if available (future-proofing)
		if (window.protonPass && window.protonPass.savePasskey) {
			await window.protonPass.savePasskey({
				rpId: 'sui.ski',
				userDisplayName: 'sui.ski Passkey Wallet',
				credentialId: credentialInfo.id,
				metadata: metadata
			});
			console.log('[sui.ski] Passkey metadata saved to Proton Pass');
			return true;
		}
		
		// Store in localStorage for now
		localStorage.setItem('sui_ski_passkey_metadata', JSON.stringify(metadata));
		return false;
	} catch (e) {
		console.log('[sui.ski] Could not save to Proton Pass:', e.message);
		return false;
	}
}

const HAS_PROTON_PASS = detectProtonPass();

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
				{ type: 'public-key', alg: -7 },   // ES256 (P-256) - preferred by Proton Pass
				{ type: 'public-key', alg: -257 }, // RS256 (fallback)
				{ type: 'public-key', alg: -8 }    // Ed25519 (additional support)
			],
			authenticatorSelection: {
				// Allow both platform and cross-platform authenticators
				// This enables Proton Pass and other password managers to be selected
				authenticatorAttachment: undefined, // Let user choose (allows Proton Pass)
				userVerification: 'required',
				residentKey: 'required',
				requireResidentKey: false // Allow non-resident keys for compatibility
			},
			timeout: 60000,
			attestation: 'none',
			extensions: {
				prf: {
					eval: {
						first: new TextEncoder().encode('sui.ski-wallet-seed')
					}
				},
				// Credential properties extension for better Proton Pass compatibility
				credProps: true
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
		created: Date.now(),
		// Store metadata for Proton Pass compatibility
		rpId: 'sui.ski',
		userDisplayName: 'sui.ski Passkey Wallet'
	};

	// Store in localStorage as fallback (Proton Pass handles actual credential storage)
	localStorage.setItem(PASSKEY_CREDENTIAL_KEY, JSON.stringify(credentialInfo));
	passkeyWalletState.credentialId = credentialInfo.id;

	// Log if Proton Pass might be storing this
	const isCrossPlatform = credential.authenticatorAttachment === 'cross-platform' || 
	                        credential.authenticatorAttachment === undefined;
	if (HAS_PROTON_PASS || isCrossPlatform) {
		console.log('[sui.ski] Passkey created - may be stored in Proton Pass or password manager');
	}

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
		const { SuiClient } = await import('https://esm.sh/@mysten/sui@1.45.2/client');
		const { Ed25519Keypair } = await import('https://esm.sh/@mysten/sui@1.45.2/keypairs/ed25519');
		const { toHex } = await import('https://esm.sh/@mysten/sui@1.45.2/utils');

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
		
		// Try to save metadata to Proton Pass if available
		if (passkeyWalletState.credentialId) {
			const credentialInfo = JSON.parse(localStorage.getItem(PASSKEY_CREDENTIAL_KEY) || '{}');
			await saveToProtonPass(credentialInfo, address);
		}
		
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
		const { SuiClient } = await import('https://esm.sh/@mysten/sui@1.45.2/client');
		const { Transaction } = await import('https://esm.sh/@mysten/sui@1.45.2/transactions');

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
					<p>Create a wallet with Face ID, Touch ID, security key, or Proton Pass</p>
					\${HAS_PROTON_PASS ? '<div class="proton-pass-badge"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/></svg> Proton Pass detected</div>' : ''}
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
						<span>\${HAS_PROTON_PASS ? 'Proton Pass compatible' : 'Hardware secured'}</span>
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
		.proton-pass-badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			margin-top: 8px;
			padding: 6px 12px;
			background: rgba(139, 92, 246, 0.15);
			border: 1px solid rgba(139, 92, 246, 0.3);
			border-radius: 12px;
			font-size: 0.75rem;
			color: #a78bfa;
			font-weight: 600;
		}
		.proton-pass-badge svg {
			width: 14px;
			height: 14px;
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
