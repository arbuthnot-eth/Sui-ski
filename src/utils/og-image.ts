const BRAND_BLUE = '#60a5fa'
const BRAND_PURPLE = '#a78bfa'
const BG_COLOR = '#0a0a0f'
const BG_SECONDARY = '#111118'
const TEXT_MUTED = '#71717a'
const FONT_STACK = 'Inter, system-ui, -apple-system, Arial, Helvetica, sans-serif'

export function generateFaviconSvg(): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${BRAND_BLUE}"/>
<stop offset="100%" stop-color="${BRAND_PURPLE}"/>
</linearGradient>
</defs>
<rect width="512" height="512" rx="96" fill="${BG_COLOR}"/>
<path d="M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z" fill="url(#g)"/>
<path d="M128 384Q208 348 288 384Q368 420 432 384" stroke="url(#g)" stroke-width="24" fill="none" stroke-linecap="round"/>
</svg>`
}

export function generateBrandOgSvg(): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${BG_COLOR}"/>
<stop offset="100%" stop-color="${BG_SECONDARY}"/>
</linearGradient>
<linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${BRAND_BLUE}"/>
<stop offset="100%" stop-color="${BRAND_PURPLE}"/>
</linearGradient>
<linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="rgba(96,165,250,0.12)"/>
<stop offset="100%" stop-color="rgba(96,165,250,0)"/>
</linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<circle cx="500" cy="180" r="350" fill="rgba(96,165,250,0.05)"/>
<circle cx="800" cy="420" r="280" fill="rgba(167,139,250,0.04)"/>
<path d="M0 630L300 320L420 410L680 180L860 360L1200 260L1200 630Z" fill="url(#mountain)"/>
<path d="M180 520Q380 440 520 480Q660 520 780 420Q900 320 1050 370" stroke="rgba(167,139,250,0.2)" stroke-width="3" fill="none" stroke-linecap="round"/>
<text x="600" y="280" text-anchor="middle" font-family="${FONT_STACK}" font-size="96" font-weight="800" fill="url(#accent)">sui.ski</text>
<text x="600" y="345" text-anchor="middle" font-family="${FONT_STACK}" font-size="28" fill="${TEXT_MUTED}">SuiNS Gateway</text>
<text x="600" y="400" text-anchor="middle" font-family="${FONT_STACK}" font-size="22" fill="rgba(113,113,122,0.6)">Register names · Resolve profiles · Explore Sui</text>
<rect x="1" y="1" width="1198" height="628" rx="8" fill="none" stroke="rgba(96,165,250,0.1)" stroke-width="2"/>
</svg>`
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}

export function generateProfileOgSvg(name: string, address: string): string {
	const safeName = escapeXml(name)
	const shortAddr = address.length > 12 ? `${address.slice(0, 6)}···${address.slice(-4)}` : address
	const safeAddr = escapeXml(shortAddr)

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${BG_COLOR}"/>
<stop offset="100%" stop-color="${BG_SECONDARY}"/>
</linearGradient>
<linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${BRAND_BLUE}"/>
<stop offset="100%" stop-color="${BRAND_PURPLE}"/>
</linearGradient>
<linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="rgba(96,165,250,0.08)"/>
<stop offset="100%" stop-color="rgba(96,165,250,0)"/>
</linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<circle cx="900" cy="150" r="300" fill="rgba(96,165,250,0.04)"/>
<circle cx="300" cy="500" r="250" fill="rgba(167,139,250,0.03)"/>
<path d="M0 630L250 380L380 460L600 240L780 400L1200 300L1200 630Z" fill="url(#mountain)"/>
<circle cx="600" cy="200" r="64" fill="none" stroke="url(#accent)" stroke-width="3"/>
<text x="600" y="210" text-anchor="middle" font-family="${FONT_STACK}" font-size="42" fill="url(#accent)">⛷</text>
<text x="600" y="320" text-anchor="middle" font-family="${FONT_STACK}" font-size="72" font-weight="800" fill="url(#accent)">${safeName}</text>
<text x="600" y="380" text-anchor="middle" font-family="monospace, ${FONT_STACK}" font-size="22" fill="${TEXT_MUTED}">${safeAddr}</text>
<text x="600" y="540" text-anchor="middle" font-family="${FONT_STACK}" font-size="24" font-weight="600" fill="rgba(96,165,250,0.4)">sui.ski</text>
<rect x="1" y="1" width="1198" height="628" rx="8" fill="none" stroke="rgba(96,165,250,0.08)" stroke-width="2"/>
</svg>`
}

const MYSTENLABS_AVATAR = 'https://avatars.githubusercontent.com/u/111364130?s=400'

export function getDefaultOgImageUrl(origin: string): string {
	return `${origin}/og-image.svg`
}

export function getTwitterFallbackImage(): string {
	return MYSTENLABS_AVATAR
}

export function getProfileOgImageUrl(origin: string, name: string): string {
	return `${origin}/og/${encodeURIComponent(name)}.svg`
}
