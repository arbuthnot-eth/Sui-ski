import { generateQrMatrix, qrToSvgPath } from './qr-svg'

const MOUNTAIN_PATH = 'M256 96L416 352H336L280 256L256 296L232 256L176 352H96Z'
const WAVE_PATH = 'M128 384Q208 348 288 384Q368 420 432 384'
const SUI_DROP =
	'M240 160C256 180 265 204 265 231C265 258 255 284 239 304L238 305L238 303C237 301 237 300 236 298C228 262 202 232 159 208C130 191 113 171 109 149C106 134 108 119 112 107C116 94 122 84 128 77L144 57C147 53 153 53 156 57L240 160ZM267 139L154 2C152-1 148-1 146 2L33 139L33 140C12 166 0 198 0 234C0 316 67 383 150 383C233 383 300 316 300 234C300 198 288 166 267 140L267 139ZM60 159L70 147L71 149C71 151 71 153 72 155C78 189 101 217 140 240C174 259 194 281 199 305C202 315 202 325 201 334L201 334L200 335C185 342 168 346 150 346C86 346 35 295 35 231C35 204 44 179 60 159Z'

const GREEN = '#00a651'
const GREEN_LIGHT = '#34d399'
const GRAY = '#9ca3af'
const GRAY_DARK = '#6b7280'

interface NameCardOptions {
	years?: number
	isPrimary?: boolean
}

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
}

export function generateNameCardSvg(name: string, options: NameCardOptions = {}): string {
	const { years = 1, isPrimary = true } = options
	const cleanName = name.replace(/\.sui$/i, '').toLowerCase()
	const url = `https://${cleanName}.sui.ski`

	const expiry = new Date()
	expiry.setFullYear(expiry.getFullYear() + years)
	const expiryText = expiry.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	})

	const nameLen = cleanName.length
	const fontSize =
		nameLen <= 6 ? 60 : nameLen <= 10 ? 48 : nameLen <= 14 ? 38 : nameLen <= 20 ? 30 : 24

	const qrMatrix = generateQrMatrix(url)
	const qrModules = qrMatrix.length
	const qrPath = qrToSvgPath(qrMatrix)
	const qrSize = 120
	const qrScale = qrSize / qrModules

	const badgeText = isPrimary ? `\u2605 ${cleanName}` : cleanName
	const badgeWidth = Math.max(badgeText.length * 8.5 + 24, 80)

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
<defs>
	<linearGradient id="ng" x1="0" y1="0" x2="1" y2="0.6">
		<stop offset="0%" stop-color="${GREEN}"/>
		<stop offset="100%" stop-color="${GREEN_LIGHT}"/>
	</linearGradient>
	<pattern id="bp" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
		<path d="M30 12L42 36H18Z" fill="${GREEN}" fill-opacity="0.025"/>
		<path d="M10 35L18 48H2Z" fill="${GREEN}" fill-opacity="0.018"/>
		<path d="M48 38L56 50H40Z" fill="${GREEN}" fill-opacity="0.015"/>
	</pattern>
	<clipPath id="card-clip"><rect width="500" height="500" rx="28"/></clipPath>
</defs>

<g clip-path="url(#card-clip)">
	<rect width="500" height="500" rx="28" fill="white"/>
	<rect width="500" height="500" fill="url(#bp)"/>
	<rect x="1" y="1" width="498" height="498" rx="27" fill="none" stroke="${GREEN}" stroke-width="2" stroke-opacity="0.35"/>

	<!-- Top accent line -->
	<line x1="36" y1="130" x2="464" y2="130" stroke="${GREEN}" stroke-opacity="0.08" stroke-width="1"/>

	<!-- Mountain logo top-right -->
	<svg x="416" y="32" width="48" height="48" viewBox="0 0 512 512">
		<path d="${MOUNTAIN_PATH}" fill="url(#ng)"/>
		<path d="${WAVE_PATH}" stroke="url(#ng)" stroke-width="24" fill="none" stroke-linecap="round"/>
	</svg>

	<!-- .sui.ski label -->
	<text x="464" y="100" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="${GRAY}" text-anchor="end" letter-spacing="0.02em">.sui.ski</text>

	<!-- Name -->
	<text x="36" y="${fontSize <= 30 ? 85 : 95}" font-family="Inter,system-ui,sans-serif" font-size="${fontSize}" font-weight="800" fill="url(#ng)" letter-spacing="-0.03em">${escapeXml(cleanName)}<tspan fill="${GRAY}" opacity="0.4">.sui</tspan></text>

	<!-- Decorative mountains in background -->
	<g opacity="0.025" fill="${GREEN}">
		<path d="M180 200L260 320H100Z"/>
		<path d="M280 220L340 320H220Z"/>
		<path d="M350 240L400 320H300Z"/>
	</g>

	<!-- Star badge -->
	<rect x="36" y="350" width="${badgeWidth}" height="30" rx="15" fill="url(#ng)"/>
	<text x="${36 + badgeWidth / 2}" y="370" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="700" fill="white" text-anchor="middle">${escapeXml(badgeText)}</text>

	<!-- QR code -->
	<g transform="translate(36,390) scale(${qrScale.toFixed(4)})">
		<path d="${qrPath}" fill="${GREEN}"/>
	</g>

	<!-- Sui droplet + NS branding -->
	<g transform="translate(320,370) scale(0.11)" opacity="0.12">
		<path d="${SUI_DROP}" fill="${GREEN}"/>
	</g>
	<text x="464" y="420" font-family="Inter,system-ui,sans-serif" font-size="44" font-weight="800" fill="${GREEN}" text-anchor="end" opacity="0.1" letter-spacing="-0.03em">.NS</text>

	<!-- Expiry date -->
	<text x="464" y="460" font-family="Inter,system-ui,sans-serif" font-size="14" font-weight="600" fill="${GRAY_DARK}" text-anchor="end">${escapeXml(expiryText)}</text>
</g>
</svg>`
}
