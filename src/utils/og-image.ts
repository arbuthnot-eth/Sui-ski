const BRAND_BLUE = '#60a5fa'
const BRAND_PURPLE = '#a78bfa'
const BG_COLOR = '#000'
const BG_SECONDARY = '#111118'
const TEXT_MUTED = '#71717a'
const FONT_STACK = 'Inter, system-ui, -apple-system, Arial, Helvetica, sans-serif'

export function generateLogoSvg(size = 24): string {
	return `<svg viewBox="0 0 512 512" width="${size}" height="${size}" fill="none"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${BRAND_BLUE}"/><stop offset="100%" stop-color="${BRAND_PURPLE}"/></linearGradient></defs><path d="M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z" fill="url(#lg)"/><path d="M128 384Q208 348 288 384Q368 420 432 384" stroke="url(#lg)" stroke-width="24" fill="none" stroke-linecap="round"/></svg>`
}

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
	const metadata = `<metadata id="meta-seal">${escapeXml(
		JSON.stringify({
			schema: 'meta-seal-lite-v1',
			app: 'sui.ski',
			asset: 'brand-og',
		}),
	)}</metadata>`
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
	${metadata}
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
	const cleanName = name.replace(/\.sui$/i, '')
	const profileDomain = `${cleanName}.sui.ski`
	const safeName = escapeXml(name)
	const safeDomain = escapeXml(profileDomain)
	const shortAddr = address.length > 12 ? `${address.slice(0, 6)}···${address.slice(-4)}` : address
	const safeAddr = escapeXml(shortAddr)
	const metadata = `<metadata id="meta-seal">${escapeXml(
		JSON.stringify({
			schema: 'meta-seal-lite-v1',
			app: 'sui.ski',
			asset: 'profile-og',
			name: cleanName,
			domain: profileDomain,
		}),
	)}</metadata>`

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
	${metadata}
	<rect width="1200" height="630" fill="url(#bg)"/>
<circle cx="900" cy="150" r="300" fill="rgba(96,165,250,0.04)"/>
<circle cx="300" cy="500" r="250" fill="rgba(167,139,250,0.03)"/>
<path d="M0 630L250 380L380 460L600 240L780 400L1200 300L1200 630Z" fill="url(#mountain)"/>
<g transform="translate(90 72) scale(0.24)">
	<path d="M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z" fill="url(#accent)"/>
	<path d="M128 384Q208 348 288 384Q368 420 432 384" stroke="url(#accent)" stroke-width="24" fill="none" stroke-linecap="round"/>
</g>
<text x="232" y="146" font-family="${FONT_STACK}" font-size="36" font-weight="800" fill="url(#accent)">sui.ski</text>
<text x="600" y="305" text-anchor="middle" font-family="${FONT_STACK}" font-size="70" font-weight="800" fill="url(#accent)">${safeName}</text>
<text x="600" y="365" text-anchor="middle" font-family="${FONT_STACK}" font-size="34" font-weight="700" fill="rgba(228,228,231,0.92)">${safeDomain}</text>
<text x="600" y="416" text-anchor="middle" font-family="monospace, ${FONT_STACK}" font-size="22" fill="${TEXT_MUTED}">${safeAddr}</text>
<text x="600" y="540" text-anchor="middle" font-family="${FONT_STACK}" font-size="24" font-weight="600" fill="rgba(96,165,250,0.4)">sui.ski profile preview</text>
<rect x="1" y="1" width="1198" height="628" rx="8" fill="none" stroke="rgba(96,165,250,0.08)" stroke-width="2"/>
</svg>`
}

const BRAND_OG_PNG_BASE64 =
	'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'

let brandOgPngBytes: Uint8Array | null = null

export function generateBrandOgPng(): Uint8Array {
	if (brandOgPngBytes) return brandOgPngBytes
	const raw = atob(BRAND_OG_PNG_BASE64)
	const bytes = new Uint8Array(raw.length)
	for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
	brandOgPngBytes = bytes
	return bytes
}

export function getDefaultOgImageUrl(origin: string): string {
	return `${origin}/og-image.png`
}

export function getProfileOgImageUrl(origin: string, name: string): string {
	return `${origin}/og/${encodeURIComponent(name)}.svg`
}
