import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { credentials, Metadata, status as GrpcStatus } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { loadPackageDefinition } from '@grpc/grpc-js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SURFLUX_ENDPOINT = 'grpc.surflux.dev:443'
const PORT = Number(process.env.PORT) || 8080
const API_KEY = process.env.SURFLUX_API_KEY

function log(level: string, message: string, data?: Record<string, unknown>) {
	const entry = { timestamp: new Date().toISOString(), level, message, ...data }
	console.log(JSON.stringify(entry))
}

if (!API_KEY) {
	log('error', 'SURFLUX_API_KEY environment variable is required')
	process.exit(1)
}

const packageDefinition = loadSync(join(__dirname, 'protos/name_service.proto'), {
	keepCase: false,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
	includeDirs: [join(__dirname, 'protos')],
})

const proto = loadPackageDefinition(packageDefinition) as any
const NameService = proto.sui.rpc.v2.NameService

let client = new NameService(SURFLUX_ENDPOINT, credentials.createSsl())

function reconnect() {
	log('info', 'Reconnecting gRPC client')
	client = new NameService(SURFLUX_ENDPOINT, credentials.createSsl())
}

function createMetadata(): Metadata {
	const metadata = new Metadata()
	metadata.set('x-api-key', API_KEY!)
	return metadata
}

interface GrpcError extends Error {
	code?: number
	details?: string
}

function shouldReconnect(err: GrpcError): boolean {
	return err.code === GrpcStatus.UNAVAILABLE || err.code === GrpcStatus.INTERNAL
}

function lookupName(name: string): Promise<any> {
	return new Promise((resolve, reject) => {
		const deadline = new Date(Date.now() + 10000)
		client.LookupName({ name }, createMetadata(), { deadline }, (err: GrpcError | null, response: any) => {
			if (err) {
				log('error', 'LookupName failed', { name, code: err.code, message: err.message })
				if (shouldReconnect(err)) reconnect()
				reject(err)
			} else {
				resolve(response)
			}
		})
	})
}

function reverseLookupName(address: string): Promise<any> {
	return new Promise((resolve, reject) => {
		const deadline = new Date(Date.now() + 10000)
		client.ReverseLookupName({ address }, createMetadata(), { deadline }, (err: GrpcError | null, response: any) => {
			if (err) {
				log('error', 'ReverseLookupName failed', { address, code: err.code, message: err.message })
				if (shouldReconnect(err)) reconnect()
				reject(err)
			} else {
				resolve(response)
			}
		})
	})
}

async function parseBody(req: IncomingMessage): Promise<any> {
	return new Promise((resolve, reject) => {
		let body = ''
		req.on('data', (chunk) => (body += chunk))
		req.on('end', () => {
			try {
				resolve(body ? JSON.parse(body) : {})
			} catch (e) {
				reject(new Error('Invalid JSON'))
			}
		})
		req.on('error', reject)
	})
}

function sendJson(res: ServerResponse, status: number, data: any) {
	res.writeHead(status, {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	})
	res.end(JSON.stringify(data))
}

const server = createServer(async (req, res) => {
	const start = Date.now()

	if (req.method === 'OPTIONS') {
		res.writeHead(204, {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		})
		res.end()
		return
	}

	const url = new URL(req.url || '/', `http://${req.headers.host}`)

	try {
		if (url.pathname === '/lookup' && req.method === 'POST') {
			const body = await parseBody(req)
			if (!body.name) {
				sendJson(res, 400, { error: 'name is required' })
				return
			}
			const result = await lookupName(body.name)
			log('info', 'LookupName', { name: body.name, duration: Date.now() - start })
			sendJson(res, 200, result)
			return
		}

		if (url.pathname === '/lookup' && req.method === 'GET') {
			const name = url.searchParams.get('name')
			if (!name) {
				sendJson(res, 400, { error: 'name query param is required' })
				return
			}
			const result = await lookupName(name)
			log('info', 'LookupName', { name, duration: Date.now() - start })
			sendJson(res, 200, result)
			return
		}

		if (url.pathname === '/reverse' && req.method === 'POST') {
			const body = await parseBody(req)
			if (!body.address) {
				sendJson(res, 400, { error: 'address is required' })
				return
			}
			const result = await reverseLookupName(body.address)
			log('info', 'ReverseLookupName', { address: body.address, duration: Date.now() - start })
			sendJson(res, 200, result)
			return
		}

		if (url.pathname === '/reverse' && req.method === 'GET') {
			const address = url.searchParams.get('address')
			if (!address) {
				sendJson(res, 400, { error: 'address query param is required' })
				return
			}
			const result = await reverseLookupName(address)
			log('info', 'ReverseLookupName', { address, duration: Date.now() - start })
			sendJson(res, 200, result)
			return
		}

		if (url.pathname === '/health') {
			sendJson(res, 200, { status: 'ok', timestamp: Date.now(), uptime: process.uptime() })
			return
		}

		sendJson(res, 404, { error: 'Not found', endpoints: ['/lookup', '/reverse', '/health'] })
	} catch (error) {
		log('error', 'Request failed', { path: url.pathname, error: error instanceof Error ? error.message : 'Unknown' })
		sendJson(res, 500, { error: error instanceof Error ? error.message : 'Internal error' })
	}
})

server.listen(PORT, () => {
	log('info', 'Server started', { port: PORT, endpoints: ['/lookup', '/reverse', '/health'] })
})
