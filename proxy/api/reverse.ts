import type { VercelRequest, VercelResponse } from '@vercel/node'
import { credentials, Metadata } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { loadPackageDefinition } from '@grpc/grpc-js'
import { join } from 'path'

const SURFLUX_ENDPOINT = 'grpc.surflux.dev:443'
const API_KEY = process.env.SURFLUX_API_KEY

const packageDefinition = loadSync(join(process.cwd(), 'protos/name_service.proto'), {
	keepCase: false,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
	includeDirs: [join(process.cwd(), 'protos')],
})

const proto = loadPackageDefinition(packageDefinition) as any
const NameService = proto.sui.rpc.v2.NameService
const client = new NameService(SURFLUX_ENDPOINT, credentials.createSsl())

function createMetadata(): Metadata {
	const metadata = new Metadata()
	if (API_KEY) metadata.set('x-api-key', API_KEY)
	return metadata
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

	if (req.method === 'OPTIONS') {
		return res.status(204).end()
	}

	const address = req.query.address as string || (req.body as any)?.address

	if (!address) {
		return res.status(400).json({ error: 'address is required' })
	}

	if (!API_KEY) {
		return res.status(500).json({ error: 'API key not configured' })
	}

	try {
		const result = await new Promise((resolve, reject) => {
			const deadline = new Date(Date.now() + 10000)
			client.ReverseLookupName({ address }, createMetadata(), { deadline }, (err: Error | null, response: any) => {
				if (err) reject(err)
				else resolve(response)
			})
		})
		return res.status(200).json(result)
	} catch (error) {
		return res.status(500).json({ error: error instanceof Error ? error.message : 'gRPC error' })
	}
}
