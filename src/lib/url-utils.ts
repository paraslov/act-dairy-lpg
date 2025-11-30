import { sanitizeUrl as braintreeSanitizeUrl } from '@braintree/sanitize-url'

/**
 * Validates and sanitizes image URLs for safe storage in the database
 */

/**
 * Validates if a URL is a valid HTTP/HTTPS URL
 */
export function isValidUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString)
		return url.protocol === 'http:' || url.protocol === 'https:'
	} catch {
		return false
	}
}

/**
 * Validates if a URL points to an image
 * Checks common image extensions
 */
export function isImageUrl(urlString: string): boolean {
	if (!isValidUrl(urlString)) {
		return false
	}

	const url = new URL(urlString)
	const pathname = url.pathname.toLowerCase()
	const imageExtensions = [
		'.jpg',
		'.jpeg',
		'.png',
		'.gif',
		'.webp',
		'.svg',
		'.bmp',
		'.ico',
	]

	return imageExtensions.some(ext => pathname.endsWith(ext))
}

/**
 * Sanitizes a URL using @braintree/sanitize-url library
 * Removes dangerous protocols and ensures it's a valid HTTP/HTTPS URL
 */
export function sanitizeUrl(urlString: string): string | null {
	if (!urlString || typeof urlString !== 'string') {
		return null
	}

	// Trim whitespace
	const trimmed = urlString.trim()

	if (!trimmed) {
		return null
	}

	// Use library to sanitize URL (removes javascript:, data:, etc.)
	const sanitized = braintreeSanitizeUrl(trimmed)

	// If sanitized to about:blank, it was unsafe
	if (sanitized === 'about:blank') {
		return null
	}

	// Validate it's a valid HTTP/HTTPS URL
	if (!isValidUrl(sanitized)) {
		return null
	}

	try {
		const url = new URL(sanitized)

		// Only allow http and https protocols
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return null
		}

		// Return the normalized URL
		return url.toString()
	} catch {
		return null
	}
}

/**
 * Validates an image URL for safe storage
 * Returns the sanitized URL if valid, null otherwise
 */
export function validateImageUrl(urlString: string): string | null {
	const sanitized = sanitizeUrl(urlString)

	if (!sanitized) {
		return null
	}

	// Optionally check if it looks like an image URL
	// Note: We can't verify the actual content without fetching it,
	// so we just check the extension
	if (!isImageUrl(sanitized)) {
		// Still allow URLs without extensions (they might be image endpoints)
		return sanitized
	}

	return sanitized
}
