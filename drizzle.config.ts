import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local for CLI usage
dotenv.config({ path: '.env.local' })

const databaseUrl =
	process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

if (!databaseUrl) {
	throw new Error('DATABASE_URL environment variable is not set')
}

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: databaseUrl,
	},
})

