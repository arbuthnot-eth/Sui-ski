const HTML_ESCAPE_LOOKUP: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
}

const DEFAULT_DOMAIN = 'sui.ski'
const STAGING_SUFFIX = 'staging.sui.ski'

const TWITTER_BOT_PATTERNS = [/twitterbot/i, /xbot/i, /x-twitterbot/i]

export interface SocialMetaOptions {
	title: string
	description: string
	url?: string
	siteName?: string
	image?: string
	imageAlt?: string
	/** @default 'website' */
	type?: string
	/** @default summary (summary_large_image when image present) */
	cardType?: 'summary' | 'summary_large_image'
	twitterHandle?: string
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_LOOKUP[char] || char)
}

function clampText(value: string, maxLength = 280): string {
	if (value.length <= maxLength) {
		return value
	}
	return `${value.slice(0, maxLength - 3)}...`
}

function inferBaseDomain(hostname?: string | null): string {
	if (!hostname) {
		return DEFAULT_DOMAIN
	}
	if (hostname === STAGING_SUFFIX || hostname.endsWith(`.${STAGING_SUFFIX}`)) {
		return STAGING_SUFFIX
	}
	return DEFAULT_DOMAIN
}

export function normalizeMediaUrl(
	value?: string | null,
	hostname?: string | null,
): string | undefined {
	if (!value) {
		return undefined
	}
	const raw = value.trim()
	if (!raw) {
		return undefined
	}
	if (/^https?:\/\//i.test(raw)) {
		return raw
	}
	if (raw.startsWith('ipfs://')) {
		return `https://ipfs.io/ipfs/${raw.slice(7)}`
	}
	if (/^(Qm|bafy)[A-Za-z0-9]+/i.test(raw)) {
		return `https://ipfs.io/ipfs/${raw}`
	}
	let walrusId = raw
	if (walrusId.startsWith('walrus://')) {
		walrusId = walrusId.slice('walrus://'.length)
	}
	if (walrusId.startsWith('walrus-')) {
		walrusId = walrusId.slice('walrus-'.length)
	}
	if (/^[A-Za-z0-9_-]{10,}$/.test(walrusId)) {
		const baseDomain = inferBaseDomain(hostname)
		return `https://walrus-${walrusId}.${baseDomain}`
	}
	if (walrusId.startsWith('0x')) {
		const baseDomain = inferBaseDomain(hostname)
		return `https://walrus-${walrusId}.${baseDomain}`
	}
	return undefined
}

export function renderSocialMeta(options: SocialMetaOptions): string {
	const type = options.type || 'website'
	const cardType = options.cardType || (options.image ? 'summary_large_image' : 'summary')
	const normalizedDescription = clampText(options.description)
	const lines: string[] = []
	lines.push(`<meta property="og:type" content="${escapeHtml(type)}">`)
	lines.push(`<meta property="og:title" content="${escapeHtml(options.title)}">`)
	lines.push(`<meta property="og:description" content="${escapeHtml(normalizedDescription)}">`)
	if (options.url) {
		lines.push(`<meta property="og:url" content="${escapeHtml(options.url)}">`)
	}
	if (options.siteName) {
		lines.push(`<meta property="og:site_name" content="${escapeHtml(options.siteName)}">`)
	}
	if (options.image) {
		lines.push(`<meta property="og:image" content="${escapeHtml(options.image)}">`)
		if (options.imageAlt) {
			lines.push(`<meta property="og:image:alt" content="${escapeHtml(options.imageAlt)}">`)
		}
	}
	lines.push(`<meta name="twitter:card" content="${escapeHtml(cardType)}">`)
	lines.push(`<meta name="twitter:title" content="${escapeHtml(options.title)}">`)
	lines.push(`<meta name="twitter:description" content="${escapeHtml(normalizedDescription)}">`)
	if (options.url) {
		lines.push(`<meta name="twitter:url" content="${escapeHtml(options.url)}">`)
	}
	if (options.image) {
		lines.push(`<meta name="twitter:image" content="${escapeHtml(options.image)}">`)
		if (options.imageAlt) {
			lines.push(`<meta name="twitter:image:alt" content="${escapeHtml(options.imageAlt)}">`)
		}
	}
	if (options.twitterHandle) {
		lines.push(`<meta name="twitter:site" content="${escapeHtml(options.twitterHandle)}">`)
	}
	return lines.map((line) => `\t${line}`).join('\n')
}

export function isTwitterPreviewBot(userAgent: string | null): boolean {
	if (!userAgent) {
		return false
	}
	return TWITTER_BOT_PATTERNS.some((pattern) => pattern.test(userAgent))
}
