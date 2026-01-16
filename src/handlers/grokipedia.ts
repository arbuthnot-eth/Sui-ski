import type { Env } from '../types'
import { jsonResponse } from '../utils/response'

/**
 * Handle Grokipedia article fetch requests
 * Fetches and parses Grokipedia article content
 */
export async function handleGrokipediaRequest(request: Request, _env: Env): Promise<Response> {
	const url = new URL(request.url)
	const articleName = url.searchParams.get('name')

	if (!articleName) {
		return jsonResponse({ error: 'Missing "name" parameter' }, 400)
	}

	try {
		const grokipediaUrl = `https://grokipedia.com/wiki/${encodeURIComponent(articleName)}`

		// Fetch the Grokipedia page
		const response = await fetch(grokipediaUrl, {
			headers: {
				'User-Agent': 'sui.ski/1.0',
			},
		})

		if (!response.ok) {
			if (response.status === 404) {
				return jsonResponse({ error: 'Article not found', found: false }, 404)
			}
			return jsonResponse(
				{ error: `Failed to fetch: ${response.statusText}`, found: false },
				response.status,
			)
		}

		const html = await response.text()

		// Parse HTML to extract article content
		// Grokipedia uses a similar structure to Wikipedia
		const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
		const title = titleMatch ? titleMatch[1].trim() : articleName

		// Try to extract the first paragraph or summary
		// Look for common article content patterns
		let excerpt = ''

		// Try to find the main content area
		const contentMatch =
			html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
			html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
			html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)

		if (contentMatch) {
			const content = contentMatch[1]
			// Extract first paragraph
			const pMatch = content.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/p>/i)
			if (pMatch) {
				excerpt = pMatch[1]
					.replace(/<[^>]+>/g, '') // Remove HTML tags
					.replace(/\s+/g, ' ') // Normalize whitespace
					.trim()
					.slice(0, 500) // Limit to 500 characters
			}
		}

		// If no excerpt found, try to get meta description
		if (!excerpt) {
			const metaMatch = html.match(
				/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
			)
			if (metaMatch) {
				excerpt = metaMatch[1].trim().slice(0, 500)
			}
		}

		// If still no excerpt, try og:description
		if (!excerpt) {
			const ogMatch = html.match(
				/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
			)
			if (ogMatch) {
				excerpt = ogMatch[1].trim().slice(0, 500)
			}
		}

		return jsonResponse({
			found: true,
			title,
			excerpt: excerpt || 'Content available on Grokipedia',
			url: grokipediaUrl,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		return jsonResponse({ error: message, found: false }, 500)
	}
}
