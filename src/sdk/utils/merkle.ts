/**
 * Merkle Tree Implementation
 *
 * Sparse Merkle tree for tracking commitments in the privacy pool.
 * Height 26 (supports ~67M leaves) with Poseidon hash.
 */

import type { MerkleProof } from '../types'
import { poseidon2 } from './poseidon'

// Tree configuration
const TREE_HEIGHT = 26
const MAX_LEAVES = 2 ** TREE_HEIGHT

// Pre-computed empty subtree hashes (same as Move contract)
const EMPTY_HASHES: bigint[] = [
	3757063126963428078851329245149448823820945803686175975676791880397262210577n,
	8824701962972029971912527712988189880422879262476635068722752063926912864602n,
	6591019491237000283694214054528217594346427482163508962157853902087214793277n,
	19825344995003898447301115197649726504652992803531862340717298098248701060696n,
	13561084045802509879126882926145420372862893923597025788562006556539515359960n,
	14249471717039063531947197960660099249746645891209235099982696982947024836189n,
	9989920697610125461426505761636033096695500054315752393186488985109451506316n,
	5994140406141478847949427351813010959380814271694394346303421923293045174430n,
	6427848377760076426945720538127992598954773546012367133029246174915152321786n,
	10812227457900959221336056737456609949081485228218108809430859932131134459696n,
	4469063795752986377192445342792859292599534068116504157406247178894685378217n,
	7217918899025867758818831001653405586817513092920579808408455124674022531432n,
	17527973816377032170685494520050879887497525168399750496431726780377308246571n,
	5188645407386263808067941279185547955212148377858508694215888099569451850840n,
	21218395356488627279355606139785048095915428209813112343489929058262850064461n,
	14562024699841147710808674608729777000011291971324306006655293834175009377894n,
	7209900272897431982179279078292404683356518044718685029955466461890346398163n,
	13330140315724744746141962574953766888010776315766097606740183857621168367855n,
	20711050984043587626927693983005656051854619541645899098243561478883006341729n,
	4623119417549555961100588543667985051069085785469655120901037830502673645471n,
	13406956536654757143811846440406846155442899652703118232047627156578316785111n,
	20424207575290279995927789672296529847207821974718091927347296801990245104287n,
	11197024653851846063316104655609166614321555858328609063994829823666413802631n,
	16506099109574754683628549847214866137817286124596936098018498289117812167461n,
	5167893016207885740988436831371711788673049273013712837512044811532395606693n,
	21487596475593605400396737827984339488506903963279124253973423719764478919671n,
]

/**
 * Sparse Merkle Tree for commitment tracking
 */
export class MerkleTree {
	private leaves: Map<number, bigint> = new Map()
	private nodes: Map<string, bigint> = new Map()
	private nextIndex = 0

	constructor() {
		// Initialize with empty tree
	}

	/**
	 * Get the current root
	 */
	get root(): bigint {
		return this.getNode(0, TREE_HEIGHT)
	}

	/**
	 * Get the next available leaf index
	 */
	get nextLeafIndex(): number {
		return this.nextIndex
	}

	/**
	 * Insert a leaf at the next available index
	 *
	 * @param leaf - Leaf value (commitment hash)
	 * @returns Leaf index
	 */
	insert(leaf: bigint): number {
		if (this.nextIndex >= MAX_LEAVES) {
			throw new Error('Merkle tree is full')
		}

		const index = this.nextIndex
		this.leaves.set(index, leaf)
		this.updatePath(index)
		this.nextIndex++

		return index
	}

	/**
	 * Insert a pair of leaves (for 2-output transactions)
	 *
	 * @param leaf1 - First commitment
	 * @param leaf2 - Second commitment
	 * @returns Indices of inserted leaves
	 */
	insertPair(leaf1: bigint, leaf2: bigint): [number, number] {
		const index1 = this.insert(leaf1)
		const index2 = this.insert(leaf2)
		return [index1, index2]
	}

	/**
	 * Get the Merkle proof for a leaf
	 *
	 * @param index - Leaf index
	 * @returns Merkle proof
	 */
	getProof(index: number): MerkleProof {
		if (index < 0 || index >= this.nextIndex) {
			throw new Error(`Invalid leaf index: ${index}`)
		}

		const path: bigint[] = []
		const indices: number[] = []

		let currentIndex = index

		for (let level = 0; level < TREE_HEIGHT; level++) {
			const isRight = currentIndex % 2 === 1
			const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1

			indices.push(isRight ? 1 : 0)
			path.push(this.getNode(siblingIndex, level))

			currentIndex = Math.floor(currentIndex / 2)
		}

		return { path, indices }
	}

	/**
	 * Verify a Merkle proof
	 *
	 * @param leaf - Leaf value
	 * @param proof - Merkle proof
	 * @param root - Expected root (optional, uses current if not provided)
	 * @returns True if proof is valid
	 */
	verify(leaf: bigint, proof: MerkleProof, root?: bigint): boolean {
		const expectedRoot = root ?? this.root

		let current = leaf

		for (let i = 0; i < proof.path.length; i++) {
			if (proof.indices[i] === 0) {
				// Current is left child
				current = poseidon2(current, proof.path[i])
			} else {
				// Current is right child
				current = poseidon2(proof.path[i], current)
			}
		}

		return current === expectedRoot
	}

	/**
	 * Get node value at a specific position
	 */
	private getNode(index: number, level: number): bigint {
		const key = `${level}:${index}`

		if (this.nodes.has(key)) {
			return this.nodes.get(key)!
		}

		// If level 0 (leaves), check leaves map
		if (level === 0) {
			if (this.leaves.has(index)) {
				return this.leaves.get(index)!
			}
			return EMPTY_HASHES[0]
		}

		// Return empty hash for this level
		return EMPTY_HASHES[level]
	}

	/**
	 * Update the path from a leaf to the root
	 */
	private updatePath(leafIndex: number): void {
		let currentIndex = leafIndex
		let currentValue = this.leaves.get(leafIndex)!

		for (let level = 0; level < TREE_HEIGHT; level++) {
			const isRight = currentIndex % 2 === 1
			const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1
			const sibling = this.getNode(siblingIndex, level)

			// Compute parent
			const parentValue = isRight
				? poseidon2(sibling, currentValue)
				: poseidon2(currentValue, sibling)

			// Store in nodes
			const parentIndex = Math.floor(currentIndex / 2)
			const parentKey = `${level + 1}:${parentIndex}`
			this.nodes.set(parentKey, parentValue)

			// Move up
			currentIndex = parentIndex
			currentValue = parentValue
		}
	}

	/**
	 * Serialize tree state
	 */
	toJSON(): {
		nextIndex: number
		leaves: [number, string][]
	} {
		return {
			nextIndex: this.nextIndex,
			leaves: Array.from(this.leaves.entries()).map(([i, v]) => [i, v.toString()]),
		}
	}

	/**
	 * Deserialize tree state
	 */
	static fromJSON(data: { nextIndex: number; leaves: [number, string][] }): MerkleTree {
		const tree = new MerkleTree()
		tree.nextIndex = data.nextIndex

		for (const [index, value] of data.leaves) {
			tree.leaves.set(index, BigInt(value))
		}

		// Rebuild internal nodes
		for (const [index] of tree.leaves) {
			tree.updatePath(index)
		}

		return tree
	}
}

/**
 * Compute root from leaves using proof path
 */
export function computeRootFromPath(leaf: bigint, path: bigint[], indices: number[]): bigint {
	let current = leaf

	for (let i = 0; i < path.length; i++) {
		if (indices[i] === 0) {
			current = poseidon2(current, path[i])
		} else {
			current = poseidon2(path[i], current)
		}
	}

	return current
}

/**
 * Get empty root for a tree of given height
 */
export function getEmptyRoot(height: number = TREE_HEIGHT): bigint {
	return EMPTY_HASHES[height - 1]
}
