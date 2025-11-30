import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './db/schema'

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		camelCase: true,
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verificationTokens,
		},
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Set to true when email service is configured
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
			enabled: !!(
				process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
			),
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day (update session if older than this)
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5, // 5 minutes
		},
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'USER',
				input: false, // Don't allow users to set this directly
			},
			settings: {
				type: 'json',
				required: false,
				input: false,
			},
		},
	},
	advanced: {
		database: {
			generateId: () => {
				// Generate a random ID for users, sessions, etc.
				return crypto.randomUUID()
			},
		},
	},
})

export type Session = typeof auth.$Infer.Session
