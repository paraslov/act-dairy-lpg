import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Support both DATABASE_URL and POSTGRES_URL (matching drizzle.config.ts pattern)
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

if (!databaseUrl) {
	throw new Error(
		'DATABASE_URL or POSTGRES_URL environment variable is not set'
	)
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(databaseUrl, { prepare: false })

export const db = drizzle(client)
