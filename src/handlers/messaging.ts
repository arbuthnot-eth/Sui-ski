/**
 * Sui Stack Messaging SDK Integration
 * Provides encrypted messaging functionality using:
 * - Sui: identity and state management
 * - Walrus: decentralized storage for attachments
 * - Seal: programmable access control and encryption
 */

import type { Env } from '../types'
import { htmlResponse, jsonResponse } from '../utils/response'

/**
 * Handle messaging-related API requests
 */
export async function handleMessagingRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url)
	const path = url.pathname

	// API endpoint for messaging status
	if (path === '/api/messaging/status') {
		const isMainnet = env.SUI_NETWORK === 'mainnet'
		const hasContract = !!env.MESSAGING_CONTRACT_ADDRESS
		const isTestnetContract =
			env.MESSAGING_CONTRACT_ADDRESS === '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d'

		return jsonResponse({
			enabled: hasContract,
			network: env.SUI_NETWORK,
			contractAddress: env.MESSAGING_CONTRACT_ADDRESS || 'Not configured',
			deployment: isMainnet && hasContract && !isTestnetContract ? 'mainnet' : 'testnet',
			features: {
				oneToOne: true,
				groupChat: true,
				encryption: true,
				walrusStorage: true,
				eventDriven: true,
			},
			status: 'alpha',
			warning: isMainnet && hasContract ? 'Self-deployed mainnet contract (alpha software)' : undefined,
		})
	}

	// API endpoint for getting user channels
	if (path === '/api/messaging/channels' && request.method === 'GET') {
		const address = url.searchParams.get('address')
		if (!address) {
			return jsonResponse({ error: 'Address parameter required' }, 400)
		}
		// This would integrate with the actual SDK
		return jsonResponse({
			message: 'Messaging SDK integration in progress',
			address,
			channels: [],
		})
	}

	return jsonResponse({ error: 'Unknown messaging endpoint' }, 404)
}

/**
 * Generate messaging UI for SuiNS profile pages
 */
export function generateMessagingUI(suinsName: string, ownerAddress: string, env: Env): string {
	const isMainnet = env.SUI_NETWORK === 'mainnet'
	const hasContract = !!env.MESSAGING_CONTRACT_ADDRESS
	const isTestnetContract =
		env.MESSAGING_CONTRACT_ADDRESS === '0x984960ebddd75c15c6d38355ac462621db0ffc7d6647214c802cd3b685e1af3d'
	const isMainnetDeployment = isMainnet && hasContract && !isTestnetContract

	return `
		<div class="messaging-section">
			<h3 class="messaging-title">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
				</svg>
				Encrypted Messaging
				<span class="alpha-badge">Alpha</span>
			</h3>
			<p class="messaging-subtitle">Powered by Sui Stack (Sui + Walrus + Seal)</p>

			<div class="messaging-features">
				<div class="feature-card">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
					<h4>End-to-End Encrypted</h4>
					<p>Messages encrypted with Seal protocol</p>
				</div>

				<div class="feature-card">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="2" y1="12" x2="22" y2="12"></line>
						<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
					</svg>
					<h4>Decentralized Storage</h4>
					<p>Attachments stored on Walrus</p>
				</div>

				<div class="feature-card">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
					</svg>
					<h4>Group Chats</h4>
					<p>Token-gated & DAO channels</p>
				</div>
			</div>

			${
				hasContract && (isMainnetDeployment || !isMainnet)
					? `
			<div class="messaging-cta">
				<button class="messaging-button primary" onclick="openMessaging('${suinsName}', '${ownerAddress}')">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
					Send Message to @${suinsName}
				</button>
				<p class="network-badge-small">${isMainnetDeployment ? '🚀 Mainnet (Alpha)' : '⚠️ Testnet'}</p>
			</div>
			`
					: `
			<div class="messaging-cta">
				<div class="info-box">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="16" x2="12" y2="12"></line>
						<line x1="12" y1="8" x2="12.01" y2="8"></line>
					</svg>
					<p>Sui Stack Messaging SDK contracts not configured. ${isMainnet ? 'Deploy to mainnet or configure contract address.' : 'Switch to testnet to try encrypted messaging.'}</p>
					<a href="/messages" class="docs-link">
						Learn More →
					</a>
				</div>
			</div>
			`
			}

			<div class="messaging-links">
				<a href="https://blog.sui.io/sui-stack-messaging-sdk/" target="_blank" class="link-button">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
						<line x1="16" y1="13" x2="8" y2="13"></line>
						<line x1="16" y1="17" x2="8" y2="17"></line>
					</svg>
					Learn More About Sui Stack Messaging
				</a>
				<a href="https://chat.polymedia.app/" target="_blank" class="link-button">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
					</svg>
					Try Polymedia Chat (On-chain Chat)
				</a>
			</div>
		</div>

		<style>
			.messaging-section {
				margin: 24px 0;
				padding: 28px;
				background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.08));
				border: 1px solid rgba(96, 165, 250, 0.2);
				border-radius: 16px;
			}
			.messaging-title {
				display: flex;
				align-items: center;
				gap: 12px;
				font-size: 1.25rem;
				font-weight: 700;
				color: #e4e4e7;
				margin-bottom: 8px;
			}
			.messaging-title svg {
				width: 24px;
				height: 24px;
				color: #60a5fa;
			}
			.alpha-badge {
				font-size: 0.7rem;
				padding: 4px 8px;
				background: rgba(251, 191, 36, 0.15);
				color: #fbbf24;
				border-radius: 6px;
				text-transform: uppercase;
				font-weight: 700;
				letter-spacing: 0.05em;
			}
			.messaging-subtitle {
				color: #71717a;
				margin-bottom: 24px;
				font-size: 0.9rem;
			}
			.messaging-features {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
				gap: 16px;
				margin-bottom: 24px;
			}
			.feature-card {
				background: rgba(15, 23, 42, 0.6);
				padding: 20px;
				border-radius: 12px;
				border: 1px solid rgba(255, 255, 255, 0.08);
				text-align: center;
			}
			.feature-card svg {
				width: 32px;
				height: 32px;
				color: #60a5fa;
				margin-bottom: 12px;
			}
			.feature-card h4 {
				font-size: 0.95rem;
				font-weight: 600;
				color: #e4e4e7;
				margin-bottom: 6px;
			}
			.feature-card p {
				font-size: 0.85rem;
				color: #71717a;
			}
			.messaging-cta {
				text-align: center;
				margin-bottom: 20px;
			}
			.messaging-button {
				display: inline-flex;
				align-items: center;
				gap: 10px;
				padding: 14px 28px;
				background: linear-gradient(135deg, #60a5fa, #8b5cf6);
				border: none;
				border-radius: 12px;
				color: white;
				font-size: 1rem;
				font-weight: 600;
				cursor: pointer;
				transition: transform 0.2s, box-shadow 0.2s;
				box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
			}
			.messaging-button:hover {
				transform: translateY(-2px);
				box-shadow: 0 6px 20px rgba(96, 165, 250, 0.4);
			}
			.messaging-button svg {
				width: 20px;
				height: 20px;
			}
			.network-badge-small {
				margin-top: 12px;
				font-size: 0.85rem;
				color: #fbbf24;
				font-weight: 600;
			}
			.info-box {
				background: rgba(59, 130, 246, 0.08);
				border: 1px solid rgba(96, 165, 250, 0.2);
				border-radius: 12px;
				padding: 20px;
				text-align: left;
			}
			.info-box svg {
				width: 20px;
				height: 20px;
				color: #60a5fa;
				float: left;
				margin-right: 12px;
				margin-top: 2px;
			}
			.info-box p {
				color: #cbd5f5;
				font-size: 0.9rem;
				line-height: 1.6;
				margin-bottom: 12px;
			}
			.docs-link {
				display: inline-block;
				color: #60a5fa;
				font-weight: 600;
				text-decoration: none;
				font-size: 0.9rem;
			}
			.docs-link:hover {
				text-decoration: underline;
			}
			.messaging-links {
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			.link-button {
				display: flex;
				align-items: center;
				gap: 10px;
				padding: 12px 16px;
				background: rgba(30, 30, 40, 0.6);
				border: 1px solid rgba(255, 255, 255, 0.08);
				border-radius: 10px;
				color: #60a5fa;
				font-size: 0.9rem;
				font-weight: 500;
				text-decoration: none;
				transition: all 0.2s;
			}
			.link-button:hover {
				border-color: #60a5fa;
				background: rgba(96, 165, 250, 0.1);
			}
			.link-button svg {
				width: 18px;
				height: 18px;
			}
		</style>

		<script>
		function openMessaging(suinsName, ownerAddress) {
			// This would integrate with the Sui Stack Messaging SDK
			alert('Messaging integration coming soon!\\n\\nThis will open an encrypted chat with @' + suinsName + ' using the Sui Stack Messaging SDK.\\n\\nFeatures:\\n• End-to-end encrypted messages\\n• Decentralized storage on Walrus\\n• Programmable access control with Seal\\n• Cross-device sync\\n• Event-driven messaging');

			// Future implementation would:
			// 1. Check if user has wallet connected
			// 2. Initialize SuiStackMessagingClient
			// 3. Create or open conversation channel
			// 4. Display messaging interface
		}
		</script>
	`
}

/**
 * Generate messaging page for sui.ski/messages
 */
export async function handleMessagingPage(env: Env): Promise<Response> {
	const html = `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Sui Stack Messaging | sui.ski</title>
	<style>
		* { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Inter', system-ui, -apple-system, sans-serif;
			background: linear-gradient(145deg, #0a0a0f 0%, #12121a 50%, #0d0d14 100%);
			background-attachment: fixed;
			color: #e4e4e7;
			min-height: 100vh;
			padding: 40px 20px;
		}
		.container {
			max-width: 1000px;
			margin: 0 auto;
		}
		.header {
			text-align: center;
			margin-bottom: 48px;
		}
		h1 {
			font-size: 3rem;
			font-weight: 800;
			margin-bottom: 1rem;
			background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #818cf8 100%);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-clip: text;
		}
		.tagline {
			color: #71717a;
			font-size: 1.25rem;
			margin-bottom: 1.5rem;
		}
		.card {
			background: rgba(22, 22, 30, 0.9);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 16px;
			padding: 32px;
			margin-bottom: 24px;
		}
		h2 {
			font-size: 1.5rem;
			margin-bottom: 16px;
			color: #e4e4e7;
		}
		p {
			color: #71717a;
			line-height: 1.7;
			margin-bottom: 16px;
		}
		.feature-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 20px;
			margin: 24px 0;
		}
		.feature {
			background: linear-gradient(135deg, rgba(30, 30, 40, 0.5), rgba(20, 20, 30, 0.6));
			padding: 24px;
			border-radius: 12px;
			border: 1px solid rgba(255, 255, 255, 0.06);
		}
		.feature h3 {
			font-size: 1.1rem;
			color: #60a5fa;
			margin-bottom: 12px;
		}
		a {
			color: #60a5fa;
			text-decoration: none;
		}
		a:hover {
			text-decoration: underline;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>🔒 Sui Stack Messaging</h1>
			<p class="tagline">End-to-end encrypted Web3 communication</p>
		</div>

		<div class="card">
			<h2>About Sui Stack Messaging SDK</h2>
			<p>
				The Sui Stack Messaging SDK, launched in September 2025, provides developers with a native way to build
				encrypted communication directly into Web3 applications. It combines three core components of the Sui ecosystem:
			</p>
			<div class="feature-grid">
				<div class="feature">
					<h3>Sui Blockchain</h3>
					<p>Verifiable identity and state management with smart contract-driven messaging</p>
				</div>
				<div class="feature">
					<h3>Walrus Protocol</h3>
					<p>Decentralized, content-addressed storage for attachments with proof of availability</p>
				</div>
				<div class="feature">
					<h3>Seal Encryption</h3>
					<p>Programmable access control for token-gated chats and role-based groups</p>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>Features</h2>
			<div class="feature-grid">
				<div class="feature">
					<h3>1:1 Encrypted Chat</h3>
					<p>Direct conversations encrypted end-to-end between wallet addresses</p>
				</div>
				<div class="feature">
					<h3>Group Channels</h3>
					<p>Token-gated communities, DAO governance channels, and role-based access</p>
				</div>
				<div class="feature">
					<h3>Event-Driven Messaging</h3>
					<p>Automated messages triggered by blockchain activities like NFT mints or governance votes</p>
				</div>
				<div class="feature">
					<h3>Cross-Device Sync</h3>
					<p>User recoverability to sync conversations without centralized servers</p>
				</div>
			</div>
		</div>

		<div class="card">
			<h2>Developer Resources</h2>
			<p>
				<strong>SDK Package:</strong> <code>@mysten/messaging</code><br>
				<strong>Status:</strong> Alpha (Testnet Only)<br>
				<strong>Network:</strong> ${env.SUI_NETWORK}<br>
				<strong>Contract:</strong> <code>${env.MESSAGING_CONTRACT_ADDRESS || 'Not configured'}</code>
			</p>
			<p>
				<a href="https://github.com/MystenLabs/sui-stack-messaging-sdk" target="_blank">GitHub Repository</a> •
				<a href="https://blog.sui.io/sui-stack-messaging-sdk/" target="_blank">Official Announcement</a> •
				<a href="https://chat.polymedia.app/" target="_blank">Polymedia Chat Demo</a>
			</p>
		</div>
	</div>
</body>
</html>`

	return htmlResponse(html)
}
