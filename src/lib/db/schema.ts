import {
	pgTable,
	serial,
	text,
	timestamp,
	pgEnum,
	jsonb,
	boolean,
	integer,
	bigint,
	date,
	time,
	index,
	unique,
} from 'drizzle-orm/pg-core'

// User role enum
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER'])

// ACT Life RPG Enums
export const moveTypeEnum = pgEnum('move_type', ['TOWARD', 'AWAY'])
export const questDirectionEnum = pgEnum('quest_direction', ['TOWARD', 'AWAY'])
export const questStatusEnum = pgEnum('quest_status', [
	'PLANNED',
	'COMPLETED',
	'SKIPPED',
	'FAILED',
	'CANCELLED',
])
export const recurrencePatternEnum = pgEnum('recurrence_pattern', [
	'NONE',
	'DAILY',
	'WEEKLY',
	'MONTHLY',
	'CUSTOM',
])
export const statTypeCategoryEnum = pgEnum('stat_type_category', [
	'LIGHT',
	'SHADOW',
])
export const valueRelationTypeEnum = pgEnum('value_relation_type', [
	'SUPPORTS',
	'VIOLATES',
	'ALIGNED',
	'VIOLATED',
])
export const xpEntityTypeEnum = pgEnum('xp_entity_type', [
	'GLOBAL',
	'SUB_VALUE',
	'STAT',
])

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

// ============================================================================
// Core Domain Tables
// ============================================================================

// Base Values - System-level predefined values (Love, Health, Work, Play)
export const baseValues = pgTable(
	'base_values',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull().unique(),
		description: text('description'),
		color: text('color'),
		icon: text('icon'),
		displayOrder: integer('display_order').notNull().default(0),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	table => ({
		nameIdx: index('base_values_name_idx').on(table.name),
	})
)

// Sub-Values - User-defined sub-values (e.g., "Parenting", "Writing", "Fitness")
export const subValues = pgTable(
	'sub_values',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		description: text('description'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		deletedAt: timestamp('deleted_at'),
	},
	table => ({
		userIdIdx: index('sub_values_user_id_idx').on(table.userId),
		deletedAtIdx: index('sub_values_deleted_at_idx').on(table.deletedAt),
	})
)

// Sub-Value to Base-Value Links - Many-to-many relationship
export const subValueBaseValueLinks = pgTable(
	'sub_value_base_value_links',
	{
		id: text('id').primaryKey(),
		subValueId: text('sub_value_id')
			.notNull()
			.references(() => subValues.id, { onDelete: 'cascade' }),
		baseValueId: text('base_value_id')
			.notNull()
			.references(() => baseValues.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		uniqueLink: unique('sub_value_base_value_unique').on(
			table.subValueId,
			table.baseValueId
		),
		subValueIdIdx: index('sub_value_base_value_links_sub_value_id_idx').on(
			table.subValueId
		),
		baseValueIdIdx: index('sub_value_base_value_links_base_value_id_idx').on(
			table.baseValueId
		),
	})
)

// Stat Types - Registry of all stat types (light and shadow)
export const statTypes = pgTable(
	'stat_types',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull().unique(),
		displayName: text('display_name').notNull(),
		type: statTypeCategoryEnum('type').notNull(),
		counterpartStatTypeId: text('counterpart_stat_type_id').references(
			() => statTypes.id
		),
		description: text('description'),
		displayOrder: integer('display_order').notNull().default(0),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		typeIdx: index('stat_types_type_idx').on(table.type),
		nameIdx: index('stat_types_name_idx').on(table.name),
		counterpartIdx: index('stat_types_counterpart_idx').on(
			table.counterpartStatTypeId
		),
	})
)

// ============================================================================
// Quest System Tables
// ============================================================================

// Quest Definitions - Reusable quest templates (system or user-created)
export const questDefinitions = pgTable(
	'quest_definitions',
	{
		id: text('id').primaryKey(),
		ownerId: text('owner_id').references(() => users.id, {
			onDelete: 'cascade',
		}), // null = system quest
		title: text('title').notNull(),
		description: text('description'),
		direction: questDirectionEnum('direction').notNull(),
		recurrencePattern: recurrencePatternEnum('recurrence_pattern')
			.notNull()
			.default('NONE'),
		isActive: boolean('is_active').notNull().default(true),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		deletedAt: timestamp('deleted_at'),
	},
	table => ({
		ownerIdIdx: index('quest_definitions_owner_id_idx').on(table.ownerId),
		directionIdx: index('quest_definitions_direction_idx').on(table.direction),
		isActiveIdx: index('quest_definitions_is_active_idx').on(table.isActive),
	})
)

// Quest Instances - Scheduled/completed quest instances for specific dates
export const questInstances = pgTable(
	'quest_instances',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		questDefinitionId: text('quest_definition_id')
			.notNull()
			.references(() => questDefinitions.id, { onDelete: 'cascade' }),
		scheduledDate: date('scheduled_date').notNull(),
		scheduledTime: time('scheduled_time'),
		status: questStatusEnum('status').notNull().default('PLANNED'),
		completedAt: timestamp('completed_at'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	table => ({
		userIdIdx: index('quest_instances_user_id_idx').on(table.userId),
		scheduledDateIdx: index('quest_instances_scheduled_date_idx').on(
			table.scheduledDate
		),
		statusIdx: index('quest_instances_status_idx').on(table.status),
		questDefinitionIdIdx: index('quest_instances_quest_definition_id_idx').on(
			table.questDefinitionId
		),
		userDateIdx: index('quest_instances_user_date_idx').on(
			table.userId,
			table.scheduledDate
		),
	})
)

// Quest Definition to Sub-Value Links
export const questDefinitionSubValueLinks = pgTable(
	'quest_definition_sub_value_links',
	{
		id: text('id').primaryKey(),
		questDefinitionId: text('quest_definition_id')
			.notNull()
			.references(() => questDefinitions.id, { onDelete: 'cascade' }),
		subValueId: text('sub_value_id')
			.notNull()
			.references(() => subValues.id, { onDelete: 'cascade' }),
		relationType: valueRelationTypeEnum('relation_type').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		uniqueLink: unique('quest_definition_sub_value_unique').on(
			table.questDefinitionId,
			table.subValueId,
			table.relationType
		),
		questDefinitionIdIdx: index(
			'quest_definition_sub_value_links_quest_definition_id_idx'
		).on(table.questDefinitionId),
		subValueIdIdx: index(
			'quest_definition_sub_value_links_sub_value_id_idx'
		).on(table.subValueId),
	})
)

// ============================================================================
// Diary System Tables
// ============================================================================

// Diary Days - One record per user per calendar date
export const diaryDays = pgTable(
	'diary_days',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		date: date('date').notNull(),
		summary: text('summary'),
		towardMovesCount: integer('toward_moves_count').notNull().default(0),
		awayMovesCount: integer('away_moves_count').notNull().default(0),
		mood: jsonb('mood'), // For future mood tracking
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	table => ({
		uniqueUserDate: unique('diary_days_user_date_unique').on(
			table.userId,
			table.date
		),
		userIdIdx: index('diary_days_user_id_idx').on(table.userId),
		dateIdx: index('diary_days_date_idx').on(table.date),
		userDateIdx: index('diary_days_user_date_idx').on(table.userId, table.date),
	})
)

// Diary Notes - Multiple notes per diary day
export const diaryNotes = pgTable(
	'diary_notes',
	{
		id: text('id').primaryKey(),
		diaryDayId: text('diary_day_id')
			.notNull()
			.references(() => diaryDays.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		content: text('content').notNull(),
		timeOfDay: time('time_of_day'),
		moveType: moveTypeEnum('move_type'), // Optional TOWARD/AWAY move type
		metadata: jsonb('metadata'), // For tags, mood, etc.
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		deletedAt: timestamp('deleted_at'),
	},
	table => ({
		diaryDayIdIdx: index('diary_notes_diary_day_id_idx').on(table.diaryDayId),
		userIdIdx: index('diary_notes_user_id_idx').on(table.userId),
		createdAtIdx: index('diary_notes_created_at_idx').on(table.createdAt),
	})
)

// Diary Note to Quest Instance Links
export const diaryNoteQuestInstanceLinks = pgTable(
	'diary_note_quest_instance_links',
	{
		id: text('id').primaryKey(),
		diaryNoteId: text('diary_note_id')
			.notNull()
			.references(() => diaryNotes.id, { onDelete: 'cascade' }),
		questInstanceId: text('quest_instance_id')
			.notNull()
			.references(() => questInstances.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		uniqueLink: unique('diary_note_quest_instance_unique').on(
			table.diaryNoteId,
			table.questInstanceId
		),
		diaryNoteIdIdx: index(
			'diary_note_quest_instance_links_diary_note_id_idx'
		).on(table.diaryNoteId),
		questInstanceIdIdx: index(
			'diary_note_quest_instance_links_quest_instance_id_idx'
		).on(table.questInstanceId),
	})
)

// Diary Note to Sub-Value Links
export const diaryNoteSubValueLinks = pgTable(
	'diary_note_sub_value_links',
	{
		id: text('id').primaryKey(),
		diaryNoteId: text('diary_note_id')
			.notNull()
			.references(() => diaryNotes.id, { onDelete: 'cascade' }),
		subValueId: text('sub_value_id')
			.notNull()
			.references(() => subValues.id, { onDelete: 'cascade' }),
		relationType: valueRelationTypeEnum('relation_type').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		uniqueLink: unique('diary_note_sub_value_unique').on(
			table.diaryNoteId,
			table.subValueId
		),
		diaryNoteIdIdx: index('diary_note_sub_value_links_diary_note_id_idx').on(
			table.diaryNoteId
		),
		subValueIdIdx: index('diary_note_sub_value_links_sub_value_id_idx').on(
			table.subValueId
		),
	})
)

// ============================================================================
// Moves System Tables
// ============================================================================

// Moves - Atomic TOWARD/AWAY move events
export const moves = pgTable(
	'moves',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: moveTypeEnum('type').notNull(),
		questInstanceId: text('quest_instance_id').references(
			() => questInstances.id,
			{ onDelete: 'set null' }
		),
		diaryNoteId: text('diary_note_id').references(() => diaryNotes.id, {
			onDelete: 'set null',
		}),
		description: text('description'),
		occurredAt: timestamp('occurred_at').notNull().defaultNow(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		userIdIdx: index('moves_user_id_idx').on(table.userId),
		typeIdx: index('moves_type_idx').on(table.type),
		occurredAtIdx: index('moves_occurred_at_idx').on(table.occurredAt),
		questInstanceIdIdx: index('moves_quest_instance_id_idx').on(
			table.questInstanceId
		),
		diaryNoteIdIdx: index('moves_diary_note_id_idx').on(table.diaryNoteId),
		userTypeDateIdx: index('moves_user_type_date_idx').on(
			table.userId,
			table.type,
			table.occurredAt
		),
	})
)

// Move to Sub-Value Links
export const moveSubValueLinks = pgTable(
	'move_sub_value_links',
	{
		id: text('id').primaryKey(),
		moveId: text('move_id')
			.notNull()
			.references(() => moves.id, { onDelete: 'cascade' }),
		subValueId: text('sub_value_id')
			.notNull()
			.references(() => subValues.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		uniqueLink: unique('move_sub_value_unique').on(
			table.moveId,
			table.subValueId
		),
		moveIdIdx: index('move_sub_value_links_move_id_idx').on(table.moveId),
		subValueIdIdx: index('move_sub_value_links_sub_value_id_idx').on(
			table.subValueId
		),
	})
)

// ============================================================================
// Progress & XP System Tables
// ============================================================================

// User Stats - XP and level per stat type per user
export const userStats = pgTable(
	'user_stats',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		statTypeId: text('stat_type_id')
			.notNull()
			.references(() => statTypes.id, { onDelete: 'cascade' }),
		currentXp: bigint('current_xp', { mode: 'number' }).notNull().default(0),
		currentLevel: integer('current_level').notNull().default(1),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	table => ({
		uniqueUserStat: unique('user_stats_user_stat_unique').on(
			table.userId,
			table.statTypeId
		),
		userIdIdx: index('user_stats_user_id_idx').on(table.userId),
		statTypeIdIdx: index('user_stats_stat_type_id_idx').on(table.statTypeId),
	})
)

// Sub-Value Progress - XP and level per sub-value per user
export const subValueProgress = pgTable(
	'sub_value_progress',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		subValueId: text('sub_value_id')
			.notNull()
			.references(() => subValues.id, { onDelete: 'cascade' }),
		currentXp: bigint('current_xp', { mode: 'number' }).notNull().default(0),
		currentLevel: integer('current_level').notNull().default(1),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	table => ({
		uniqueUserSubValue: unique('sub_value_progress_user_sub_value_unique').on(
			table.userId,
			table.subValueId
		),
		userIdIdx: index('sub_value_progress_user_id_idx').on(table.userId),
		subValueIdIdx: index('sub_value_progress_sub_value_id_idx').on(
			table.subValueId
		),
	})
)

// Global Progress - Global player XP and level
export const globalProgress = pgTable(
	'global_progress',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: 'cascade' }),
		currentXp: bigint('current_xp', { mode: 'number' }).notNull().default(0),
		currentLevel: integer('current_level').notNull().default(1),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	table => ({
		userIdIdx: index('global_progress_user_id_idx').on(table.userId),
	})
)

// XP History - Optional audit trail of XP changes
export const xpHistory = pgTable(
	'xp_history',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		entityType: xpEntityTypeEnum('entity_type').notNull(),
		entityId: text('entity_id').notNull(), // References sub_value_id, stat_type_id, or 'global'
		moveId: text('move_id').references(() => moves.id, {
			onDelete: 'set null',
		}),
		questInstanceId: text('quest_instance_id').references(
			() => questInstances.id,
			{ onDelete: 'set null' }
		),
		diaryNoteId: text('diary_note_id').references(() => diaryNotes.id, {
			onDelete: 'set null',
		}),
		xpChange: bigint('xp_change', { mode: 'number' }).notNull(),
		xpBefore: bigint('xp_before', { mode: 'number' }).notNull(),
		xpAfter: bigint('xp_after', { mode: 'number' }).notNull(),
		levelBefore: integer('level_before').notNull(),
		levelAfter: integer('level_after').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
	},
	table => ({
		userIdIdx: index('xp_history_user_id_idx').on(table.userId),
		entityTypeIdx: index('xp_history_entity_type_idx').on(table.entityType),
		entityIdIdx: index('xp_history_entity_id_idx').on(table.entityId),
		createdAtIdx: index('xp_history_created_at_idx').on(table.createdAt),
		moveIdIdx: index('xp_history_move_id_idx').on(table.moveId),
		userEntityIdx: index('xp_history_user_entity_idx').on(
			table.userId,
			table.entityType,
			table.entityId
		),
	})
)

// ============================================================================
// Export types for use in your application
// ============================================================================

// Authentication types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
export type VerificationToken = typeof verificationTokens.$inferSelect
export type NewVerificationToken = typeof verificationTokens.$inferInsert

// Core domain types
export type BaseValue = typeof baseValues.$inferSelect
export type NewBaseValue = typeof baseValues.$inferInsert
export type SubValue = typeof subValues.$inferSelect
export type NewSubValue = typeof subValues.$inferInsert
export type SubValueBaseValueLink = typeof subValueBaseValueLinks.$inferSelect
export type NewSubValueBaseValueLink =
	typeof subValueBaseValueLinks.$inferInsert
export type StatType = typeof statTypes.$inferSelect
export type NewStatType = typeof statTypes.$inferInsert

// Quest system types
export type QuestDefinition = typeof questDefinitions.$inferSelect
export type NewQuestDefinition = typeof questDefinitions.$inferInsert
export type QuestInstance = typeof questInstances.$inferSelect
export type NewQuestInstance = typeof questInstances.$inferInsert
export type QuestDefinitionSubValueLink =
	typeof questDefinitionSubValueLinks.$inferSelect
export type NewQuestDefinitionSubValueLink =
	typeof questDefinitionSubValueLinks.$inferInsert

// Diary system types
export type DiaryDay = typeof diaryDays.$inferSelect
export type NewDiaryDay = typeof diaryDays.$inferInsert
export type DiaryNote = typeof diaryNotes.$inferSelect
export type NewDiaryNote = typeof diaryNotes.$inferInsert
export type DiaryNoteQuestInstanceLink =
	typeof diaryNoteQuestInstanceLinks.$inferSelect
export type NewDiaryNoteQuestInstanceLink =
	typeof diaryNoteQuestInstanceLinks.$inferInsert
export type DiaryNoteSubValueLink = typeof diaryNoteSubValueLinks.$inferSelect
export type NewDiaryNoteSubValueLink =
	typeof diaryNoteSubValueLinks.$inferInsert

// Moves system types
export type Move = typeof moves.$inferSelect
export type NewMove = typeof moves.$inferInsert
export type MoveSubValueLink = typeof moveSubValueLinks.$inferSelect
export type NewMoveSubValueLink = typeof moveSubValueLinks.$inferInsert

// Progress & XP system types
export type UserStat = typeof userStats.$inferSelect
export type NewUserStat = typeof userStats.$inferInsert
export type SubValueProgress = typeof subValueProgress.$inferSelect
export type NewSubValueProgress = typeof subValueProgress.$inferInsert
export type GlobalProgress = typeof globalProgress.$inferSelect
export type NewGlobalProgress = typeof globalProgress.$inferInsert
export type XpHistory = typeof xpHistory.$inferSelect
export type NewXpHistory = typeof xpHistory.$inferInsert
