/**
 * Type declarations for snarkjs
 *
 * These are minimal types for the parts of snarkjs we use.
 * The full library has more functionality.
 */

declare module 'snarkjs' {
	export namespace groth16 {
		function fullProve(
			input: Record<string, unknown>,
			wasmPath: string,
			zkeyPath: string
		): Promise<{
			proof: {
				pi_a: string[]
				pi_b: string[][]
				pi_c: string[]
				protocol: string
				curve: string
			}
			publicSignals: string[]
		}>

		function verify(
			vkey: unknown,
			publicSignals: string[],
			proof: {
				pi_a: string[]
				pi_b: string[][]
				pi_c: string[]
			}
		): Promise<boolean>
	}
}
