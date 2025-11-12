import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// Example schema - replace with your actual tables
// This is a placeholder to get started

export const exampleTable = pgTable('example', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Export types for use in your application
export type Example = typeof exampleTable.$inferSelect
export type NewExample = typeof exampleTable.$inferInsert

