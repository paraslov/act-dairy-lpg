import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local for CLI usage
dotenv.config({ path: '.env.local' })

if (!process.env.POSTGRES_URL) {
	throw new Error('POSTGRES_URL environment variable is not set')
}

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.POSTGRES_URL,
	},
})

