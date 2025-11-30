import {
	pgTable,
	serial,
	text,
	timestamp,
	pgEnum,
	jsonb,
	boolean,
} from 'drizzle-orm/pg-core'

// User role enum
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER'])

// Users table - core authentication
export const users = pgTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	name: text('name').notNull(), // nickname
	image: text('image'),
	password: text('password'), // hashed password (nullable for OAuth users)
	role: userRoleEnum('role').notNull().default('USER'),
	settings: jsonb('settings'), // for future user preferences
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Sessions table - JWT session management
export const sessions = pgTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Accounts table - OAuth provider accounts
export const accounts = pgTable('accounts', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(), // Provider's user ID (required by Better Auth)
	providerId: text('provider_id').notNull(), // 'google', 'github', 'credential', etc.
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	refreshToken: text('refresh_token'),
	accessToken: text('access_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	password: text('password'), // Hashed password for credential-based accounts (nullable for OAuth)
	scope: text('scope'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Verification tokens table - for email verification (future use)
export const verificationTokens = pgTable('verification_tokens', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(), // email or user ID
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Example table - placeholder for app-specific data
export const exampleTable = pgTable('example', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Export types for use in your application
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert
export type Example = typeof exampleTable.$inferSelect
export type NewExample = typeof exampleTable.$inferInsert
