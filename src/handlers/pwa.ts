/**
 * PWA (Progressive Web App) support for sui.ski
 * Provides manifest.json and service worker for installable app experience
 */


/**
 * Generate the web app manifest
 */
export function getManifest(suinsName?: string): string {
	const name = suinsName ? `${suinsName}.sui` : 'sui.ski'
	const shortName = suinsName || 'sui.ski'

	return JSON.stringify({
		name: name,
		short_name: shortName,
		description: 'Sui blockchain gateway - SuiNS profiles, encrypted messaging, and decentralized content',
		start_url: '/',
		display: 'standalone',
		background_color: '#0a0a0f',
		theme_color: '#60a5fa',
		orientation: 'portrait-primary',
		categories: ['social', 'utilities', 'finance'],
		icons: [
			{
				src: '/icon-192.png',
				sizes: '192x192',
				type: 'image/png',
				purpose: 'any maskable'
			},
			{
				src: '/icon-512.png',
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any maskable'
			}
		],
		screenshots: [],
		shortcuts: [
			{
				name: 'Send Message',
				short_name: 'Message',
				description: 'Send encrypted message',
				url: '/?action=message',
				icons: [{ src: '/icon-192.png', sizes: '192x192' }]
			}
		],
		related_applications: [],
		prefer_related_applications: false,
		// Deep linking for wallet connections
		protocol_handlers: [
			{
				protocol: 'web+sui',
				url: '/?sui=%s'
			}
		],
		// Share target for receiving shared content
		share_target: {
			action: '/?action=share',
			method: 'GET',
			enctype: 'application/x-www-form-urlencoded',
			params: {
				title: 'title',
				text: 'text',
				url: 'url'
			}
		}
	}, null, 2)
}

/**
 * Generate the service worker script
 */
export function getServiceWorker(): string {
	return `
// sui.ski Service Worker
const CACHE_NAME = 'sui-ski-v1';
const STATIC_ASSETS = [
	'/',
	'/icon-192.png',
	'/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				// Only cache assets with http/https protocols
				return Promise.allSettled(
					STATIC_ASSETS.map((url) => {
						if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
							return cache.add(url).catch((err) => {
								// Silently ignore cache errors for unsupported schemes
								if (!err.message.includes('unsupported')) {
									console.warn('Failed to cache:', url, err);
								}
							});
						}
						return Promise.resolve();
					})
				);
			})
			.then(() => self.skipWaiting())
	);
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name))
			);
		}).then(() => self.clients.claim())
	);
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	// Skip API requests - always fetch fresh
	if (url.pathname.startsWith('/api/')) {
		return;
	}

	// For navigation requests, try network first
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request)
				.catch(() => caches.match(event.request))
		);
		return;
	}

	// For other requests, try cache first for static assets
	if (STATIC_ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(event.request)
				.then((cached) => cached || fetch(event.request))
		);
		return;
	}

	// Network first for everything else
	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Cache successful responses, but skip unsupported schemes (chrome-extension://, etc.)
				if (response.ok && url.protocol.startsWith('http')) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						try {
							cache.put(event.request, clone).catch((err) => {
								// Silently ignore cache errors for unsupported schemes
								if (!err.message.includes('unsupported')) {
									console.warn('Cache put failed:', err);
								}
							});
						} catch (err) {
							// Ignore cache errors
						}
					});
				}
				return response;
			})
			.catch(() => caches.match(event.request))
	);
});

// Handle push notifications (for future messaging feature)
self.addEventListener('push', (event) => {
	if (!event.data) return;

	const data = event.data.json();
	const options = {
		body: data.body || 'New message',
		icon: '/icon-192.png',
		badge: '/icon-192.png',
		vibrate: [100, 50, 100],
		data: {
			url: data.url || '/'
		},
		actions: [
			{ action: 'open', title: 'Open' },
			{ action: 'close', title: 'Close' }
		]
	};

	event.waitUntil(
		self.registration.showNotification(data.title || 'sui.ski', options)
	);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	if (event.action === 'close') return;

	const url = event.notification.data?.url || '/';
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				// Focus existing window if open
				for (const client of clientList) {
					if (client.url === url && 'focus' in client) {
						return client.focus();
					}
				}
				// Open new window
				if (clients.openWindow) {
					return clients.openWindow(url);
				}
			})
	);
});

console.log('sui.ski service worker loaded');
`
}

/**
 * Generate a simple SVG icon as PNG placeholder
 * In production, you'd want actual PNG icons
 */
export function getIcon(size: number): Response {
	const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
	<defs>
		<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" style="stop-color:#60a5fa"/>
			<stop offset="100%" style="stop-color:#8b5cf6"/>
		</linearGradient>
	</defs>
	<rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
	<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
		font-family="system-ui, -apple-system, sans-serif" font-weight="800"
		font-size="${size * 0.35}" fill="white">S</text>
</svg>`

	return new Response(svg, {
		headers: {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=31536000'
		}
	})
}

/**
 * Handle PWA-related requests
 */
export function handlePWARequest(pathname: string, suinsName?: string): Response | null {
	if (pathname === '/manifest.json') {
		return new Response(getManifest(suinsName), {
			headers: {
				'Content-Type': 'application/manifest+json',
				'Cache-Control': 'public, max-age=86400'
			}
		})
	}

	if (pathname === '/sw.js' || pathname === '/service-worker.js') {
		return new Response(getServiceWorker(), {
			headers: {
				'Content-Type': 'application/javascript',
				'Cache-Control': 'public, max-age=0',
				'Service-Worker-Allowed': '/'
			}
		})
	}

	if (pathname === '/icon-192.png' || pathname === '/icon-192.svg') {
		return getIcon(192)
	}

	if (pathname === '/icon-512.png' || pathname === '/icon-512.svg') {
		return getIcon(512)
	}

	if (pathname === '/apple-touch-icon.png') {
		return getIcon(180)
	}

	if (pathname === '/favicon.ico' || pathname === '/favicon.svg') {
		return getIcon(32)
	}

	return null
}

/**
 * Get PWA meta tags for HTML pages
 */
export function getPWAMetaTags(suinsName?: string): string {
	const name = suinsName ? `${suinsName}.sui` : 'sui.ski'

	return `
	<!-- PWA Meta Tags -->
	<link rel="manifest" href="/manifest.json">
	<meta name="theme-color" content="#60a5fa">
	<meta name="mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-capable" content="yes">
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
	<meta name="apple-mobile-web-app-title" content="${name}">
	<link rel="apple-touch-icon" href="/apple-touch-icon.png">
	<link rel="icon" type="image/svg+xml" href="/favicon.svg">
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon.ico">

	<!-- PWA Install Prompt Helper -->
	<script>
		// Register service worker
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/sw.js')
					.then(reg => console.log('SW registered:', reg.scope))
					.catch(err => console.log('SW registration failed:', err));
			});
		}

		// Handle install prompt
		let deferredPrompt;
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			// Show install button if desired
			const installBtn = document.getElementById('pwa-install-btn');
			if (installBtn) installBtn.style.display = 'block';
		});

		window.installPWA = async function() {
			if (!deferredPrompt) return;
			deferredPrompt.prompt();
			const { outcome } = await deferredPrompt.userChoice;
			console.log('Install outcome:', outcome);
			deferredPrompt = null;
		};

		// Handle app installed
		window.addEventListener('appinstalled', () => {
			console.log('PWA installed');
			deferredPrompt = null;
		});
	</script>
	`
}
