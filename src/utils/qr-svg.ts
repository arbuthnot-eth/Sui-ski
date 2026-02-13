const VERSIONS = [
	{ size: 21, dataCW: 19, ecCW: 7, align: [] as number[][] },
	{ size: 25, dataCW: 34, ecCW: 10, align: [[18, 18]] },
	{ size: 29, dataCW: 55, ecCW: 15, align: [[22, 22]] },
	{ size: 33, dataCW: 80, ecCW: 20, align: [[26, 26]] },
	{ size: 37, dataCW: 108, ecCW: 26, align: [[30, 30]] },
]

const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)
{
	let x = 1
	for (let i = 0; i < 255; i++) {
		GF_EXP[i] = x
		GF_LOG[x] = i
		x = (x << 1) ^ (x >= 128 ? 0x11d : 0)
	}
	for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255]
}

function gfMul(a: number, b: number): number {
	return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
	let gen = [1]
	for (let i = 0; i < ecCount; i++) {
		const next = new Array(gen.length + 1).fill(0)
		for (let j = 0; j < gen.length; j++) {
			next[j] ^= gen[j]
			next[j + 1] ^= gfMul(gen[j], GF_EXP[i])
		}
		gen = next
	}
	const rem = new Array(ecCount).fill(0)
	for (const byte of data) {
		const f = byte ^ rem[0]
		for (let j = 0; j < ecCount - 1; j++) rem[j] = rem[j + 1]
		rem[ecCount - 1] = 0
		for (let j = 0; j < ecCount; j++) rem[j] ^= gfMul(gen[j + 1], f)
	}
	return new Uint8Array(rem)
}

function encodeBytes(text: string, dataCW: number): Uint8Array {
	const raw = new TextEncoder().encode(text)
	const out = new Uint8Array(dataCW)
	let pos = 0
	const write = (val: number, bits: number) => {
		for (let i = bits - 1; i >= 0; i--) {
			if (val & (1 << i)) out[pos >> 3] |= 1 << (7 - (pos & 7))
			pos++
		}
	}
	write(0b0100, 4)
	write(raw.length, 8)
	for (const b of raw) write(b, 8)
	write(0, Math.min(4, dataCW * 8 - pos))
	if (pos & 7) write(0, 8 - (pos & 7))
	let pad = 0
	while (pos >> 3 < dataCW) {
		write(pad === 0 ? 0xec : 0x11, 8)
		pad ^= 1
	}
	return out
}

function maskFn(mask: number, r: number, c: number): boolean {
	switch (mask) {
		case 0:
			return (r + c) % 2 === 0
		case 1:
			return r % 2 === 0
		case 2:
			return c % 3 === 0
		case 3:
			return (r + c) % 3 === 0
		case 4:
			return ((r >> 1) + Math.floor(c / 3)) % 2 === 0
		case 5:
			return ((r * c) % 2) + ((r * c) % 3) === 0
		case 6:
			return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0
		default:
			return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
	}
}

function computeFormat(mask: number): number {
	const d = (1 << 3) | mask
	let bits = d << 10
	for (let i = 14; i >= 10; i--) {
		if (bits & (1 << i)) bits ^= 0b10100110111 << (i - 10)
	}
	return ((d << 10) | bits) ^ 0b101010000010010
}

const FINDER_A = [true, false, true, true, true, false, true, false, false, false, false]
const FINDER_B = [...FINDER_A].reverse()

function evaluate(m: boolean[][], size: number): number {
	let penalty = 0
	for (let r = 0; r < size; r++) {
		let run = 1
		for (let c = 1; c < size; c++) {
			if (m[r][c] === m[r][c - 1]) run++
			else {
				if (run >= 5) penalty += run - 2
				run = 1
			}
		}
		if (run >= 5) penalty += run - 2
	}
	for (let c = 0; c < size; c++) {
		let run = 1
		for (let r = 1; r < size; r++) {
			if (m[r][c] === m[r - 1][c]) run++
			else {
				if (run >= 5) penalty += run - 2
				run = 1
			}
		}
		if (run >= 5) penalty += run - 2
	}
	for (let r = 0; r < size - 1; r++) {
		for (let c = 0; c < size - 1; c++) {
			const v = m[r][c]
			if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) penalty += 3
		}
	}
	for (let r = 0; r < size; r++) {
		for (let c = 0; c <= size - 11; c++) {
			let a = true
			let b = true
			for (let k = 0; k < 11; k++) {
				if (m[r][c + k] !== FINDER_A[k]) a = false
				if (m[r][c + k] !== FINDER_B[k]) b = false
				if (!a && !b) break
			}
			if (a || b) penalty += 40
		}
	}
	for (let c = 0; c < size; c++) {
		for (let r = 0; r <= size - 11; r++) {
			let a = true
			let b = true
			for (let k = 0; k < 11; k++) {
				if (m[r + k][c] !== FINDER_A[k]) a = false
				if (m[r + k][c] !== FINDER_B[k]) b = false
				if (!a && !b) break
			}
			if (a || b) penalty += 40
		}
	}
	let dark = 0
	for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++
	const pct = (dark * 100) / (size * size)
	const prev5 = Math.floor(pct / 5) * 5
	penalty += Math.min(Math.abs(prev5 - 50), Math.abs(prev5 + 5 - 50)) * 2
	return penalty
}

export function generateQrMatrix(text: string): boolean[][] {
	const raw = new TextEncoder().encode(text)
	let vi = 0
	for (; vi < VERSIONS.length; vi++) {
		if (raw.length <= VERSIONS[vi].dataCW - 2) break
	}
	if (vi >= VERSIONS.length) vi = VERSIONS.length - 1
	const ver = VERSIONS[vi]
	const { size, dataCW, ecCW } = ver

	const data = encodeBytes(text, dataCW)
	const ec = rsEncode(data, ecCW)
	const cw = new Uint8Array(dataCW + ecCW)
	cw.set(data)
	cw.set(ec, dataCW)

	const mat: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
	const res: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))

	const placeFinder = (r0: number, c0: number) => {
		for (let r = -1; r <= 7; r++) {
			for (let c = -1; c <= 7; c++) {
				const mr = r0 + r
				const mc = c0 + c
				if (mr < 0 || mr >= size || mc < 0 || mc >= size) continue
				mat[mr][mc] =
					(r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
					(c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
					(r >= 2 && r <= 4 && c >= 2 && c <= 4)
				res[mr][mc] = true
			}
		}
	}
	placeFinder(0, 0)
	placeFinder(0, size - 7)
	placeFinder(size - 7, 0)

	for (const [ar, ac] of ver.align) {
		for (let r = -2; r <= 2; r++) {
			for (let c = -2; c <= 2; c++) {
				mat[ar + r][ac + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1
				res[ar + r][ac + c] = true
			}
		}
	}

	for (let i = 8; i < size - 8; i++) {
		const v = i % 2 === 0
		if (!res[6][i]) {
			mat[6][i] = v
			res[6][i] = true
		}
		if (!res[i][6]) {
			mat[i][6] = v
			res[i][6] = true
		}
	}

	for (let i = 0; i <= 8; i++) {
		res[8][i] = true
		res[i][8] = true
	}
	for (let i = 0; i <= 7; i++) {
		res[8][size - 1 - i] = true
		res[size - 1 - i][8] = true
	}
	mat[size - 8][8] = true
	res[size - 8][8] = true

	let bitIdx = 0
	const totalBits = cw.length * 8
	let upward = true
	for (let right = size - 1; right >= 1; right -= 2) {
		if (right === 6) right = 5
		for (let v = 0; v < size; v++) {
			const row = upward ? size - 1 - v : v
			for (let dx = 0; dx <= 1; dx++) {
				const col = right - dx
				if (col < 0 || res[row][col]) continue
				if (bitIdx < totalBits) {
					mat[row][col] = ((cw[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1) === 1
				}
				bitIdx++
			}
		}
		upward = !upward
	}

	const fmtPos: [number, number][][] = [
		[
			[8, 0],
			[8, 1],
			[8, 2],
			[8, 3],
			[8, 4],
			[8, 5],
			[8, 7],
			[8, 8],
			[7, 8],
			[5, 8],
			[4, 8],
			[3, 8],
			[2, 8],
			[1, 8],
			[0, 8],
		],
		[
			[size - 1, 8],
			[size - 2, 8],
			[size - 3, 8],
			[size - 4, 8],
			[size - 5, 8],
			[size - 6, 8],
			[size - 7, 8],
			[8, size - 8],
			[8, size - 7],
			[8, size - 6],
			[8, size - 5],
			[8, size - 4],
			[8, size - 3],
			[8, size - 2],
			[8, size - 1],
		],
	]

	const writeFormat = (target: boolean[][], fmt: number) => {
		for (let i = 0; i < 15; i++) {
			const bit = ((fmt >> (14 - i)) & 1) === 1
			target[fmtPos[0][i][0]][fmtPos[0][i][1]] = bit
			target[fmtPos[1][i][0]][fmtPos[1][i][1]] = bit
		}
	}

	let bestMask = 0
	let bestPenalty = Infinity
	for (let mask = 0; mask < 8; mask++) {
		const test = mat.map((row) => [...row])
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (!res[r][c] && maskFn(mask, r, c)) test[r][c] = !test[r][c]
			}
		}
		writeFormat(test, computeFormat(mask))
		const pen = evaluate(test, size)
		if (pen < bestPenalty) {
			bestPenalty = pen
			bestMask = mask
		}
	}

	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			if (!res[r][c] && maskFn(bestMask, r, c)) mat[r][c] = !mat[r][c]
		}
	}
	writeFormat(mat, computeFormat(bestMask))

	return mat
}

export function qrToSvgPath(matrix: boolean[][], quiet = 0): string {
	let path = ''
	const n = matrix.length
	for (let r = 0; r < n; r++) {
		for (let c = 0; c < n; c++) {
			if (matrix[r][c]) path += `M${c + quiet},${r + quiet}h1v1h-1z`
		}
	}
	return path
}
