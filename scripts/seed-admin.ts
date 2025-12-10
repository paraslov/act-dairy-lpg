/**
 * CLI script to seed default admin user
 * Usage: pnpm db:seed:admin
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD environment variables
 */

// Load environment variables from .env.local BEFORE any other imports
// Using require() instead of import to ensure it runs before hoisted imports
require('dotenv').config({ path: '.env.local' })

import { users } from '../src/lib/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
	// Dynamically import db and auth after environment variables are loaded
	const { db } = await import('../src/lib/db')
	const { auth } = await import('../src/lib/auth')
	const adminEmail = process.env.ADMIN_EMAIL
	const adminPassword = process.env.ADMIN_PASSWORD
	const adminName = process.env.ADMIN_NAME || 'Admin'

	if (!adminEmail) {
		console.error('Error: ADMIN_EMAIL environment variable is required')
		console.error(
			'Set it in your .env.local file: ADMIN_EMAIL=admin@example.com'
		)
		process.exit(1)
	}

	if (!adminPassword) {
		console.error('Error: ADMIN_PASSWORD environment variable is required')
		console.error(
			'Set it in your .env.local file: ADMIN_PASSWORD=your-secure-password'
		)
		process.exit(1)
	}

	try {
		// Check if admin user already exists
		const existingUsers = await db
			.select()
			.from(users)
			.where(eq(users.email, adminEmail))
			.limit(1)

		if (existingUsers.length > 0) {
			const existingUser = existingUsers[0]
			if (existingUser.role === 'ADMIN') {
				console.log(
					`✅ Admin user with email ${adminEmail} already exists, skipping seed`
				)
				process.exit(0)
			} else {
				// User exists but is not admin - update to admin
				await db
					.update(users)
					.set({ role: 'ADMIN', updatedAt: new Date() })
					.where(eq(users.id, existingUser.id))
				console.log(`✅ Updated existing user ${adminEmail} to ADMIN role`)
				process.exit(0)
			}
		}

		// Use Better Auth's API to create the user (handles password hashing correctly)
		// This works in any environment since we're calling the API directly, not making HTTP requests
		const response = await auth.api.signUpEmail({
			body: {
				email: adminEmail,
				password: adminPassword,
				name: adminName,
			},
			headers: new Headers({
				'Content-Type': 'application/json',
			}),
		})

		if (response.error || !response.user) {
			throw new Error(
				response.error?.message || 'Failed to create user via Better Auth'
			)
		}

		// Update the user role to ADMIN
		await db
			.update(users)
			.set({ role: 'ADMIN', updatedAt: new Date() })
			.where(eq(users.id, response.user.id))

		console.log(`✅ Admin user created successfully: ${adminEmail}`)
		process.exit(0)
	} catch (error) {
		console.error('❌ Failed to seed admin user:', error)
		process.exit(1)
	}
}

main()
