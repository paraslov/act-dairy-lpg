/**
 * Service for managing game balance configuration
 * Provides CRUD operations, caching, and fallback to defaults
 */

import { db } from '@/lib/db'
import {
	gameBalanceConfig,
	gameBalanceConfigHistory,
	type GameBalanceConfig as DbGameBalanceConfig,
} from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { gameBalanceConfigSchema } from './schemas'
import { defaultBalanceConfig } from './defaults'
import type { GameBalanceConfig } from './types'

interface CachedConfig {
	config: GameBalanceConfig
	timestamp: number
}

class BalanceConfigService {
	private cache: CachedConfig | null = null
	private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

	/**
	 * Get the active configuration with caching
	 */
	async getActiveConfig(): Promise<GameBalanceConfig> {
		// Check cache first
		if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL_MS) {
			return this.cache.config
		}

		// Fetch from database
		const result = await db
			.select()
			.from(gameBalanceConfig)
			.where(eq(gameBalanceConfig.isActive, true))
			.limit(1)

		if (result.length === 0) {
			// No active config found, return defaults
			return defaultBalanceConfig
		}

		const dbConfig = result[0]
		const parsedConfig = dbConfig.config as GameBalanceConfig

		// Validate the config
		const validatedConfig = gameBalanceConfigSchema.parse(parsedConfig)

		// Update cache
		this.cache = {
			config: validatedConfig,
			timestamp: Date.now(),
		}

		return validatedConfig
	}

	/**
	 * Get configuration by ID
	 */
	async getConfigById(id: string): Promise<GameBalanceConfig | null> {
		const result = await db
			.select()
			.from(gameBalanceConfig)
			.where(eq(gameBalanceConfig.id, id))
			.limit(1)

		if (result.length === 0) {
			return null
		}

		const dbConfig = result[0]
		const parsedConfig = dbConfig.config as GameBalanceConfig

		return gameBalanceConfigSchema.parse(parsedConfig)
	}

	/**
	 * Create a new configuration
	 * Note: This will deactivate any existing active config
	 */
	async createConfig(
		config: GameBalanceConfig,
		userId: string
	): Promise<DbGameBalanceConfig> {
		// Validate config
		const validatedConfig = gameBalanceConfigSchema.parse(config)

		// Deactivate all existing configs
		await db
			.update(gameBalanceConfig)
			.set({ isActive: false })
			.where(eq(gameBalanceConfig.isActive, true))

		// Create new config
		const newConfigId = crypto.randomUUID()
		const newConfig = await db
			.insert(gameBalanceConfig)
			.values({
				id: newConfigId,
				config: validatedConfig,
				isActive: true,
				version: 1,
				createdBy: userId,
			})
			.returning()

		// Invalidate cache
		this.invalidateCache()

		return newConfig[0]
	}

	/**
	 * Update the active configuration
	 */
	async updateActiveConfig(
		config: GameBalanceConfig,
		userId: string,
		reason?: string
	): Promise<DbGameBalanceConfig> {
		// Validate config
		const validatedConfig = gameBalanceConfigSchema.parse(config)

		// Get current active config
		const currentConfigs = await db
			.select()
			.from(gameBalanceConfig)
			.where(eq(gameBalanceConfig.isActive, true))
			.limit(1)

		if (currentConfigs.length === 0) {
			// No active config, create a new one
			return this.createConfig(validatedConfig, userId)
		}

		const currentConfig = currentConfigs[0]
		const oldConfig = currentConfig.config as GameBalanceConfig

		// Save history
		await db.insert(gameBalanceConfigHistory).values({
			id: crypto.randomUUID(),
			configId: currentConfig.id,
			oldConfig: oldConfig,
			newConfig: validatedConfig,
			changedBy: userId,
			changeReason: reason || null,
		})

		// Update config
		const updated = await db
			.update(gameBalanceConfig)
			.set({
				config: validatedConfig,
				version: currentConfig.version + 1,
				updatedAt: new Date(),
			})
			.where(eq(gameBalanceConfig.id, currentConfig.id))
			.returning()

		// Invalidate cache
		this.invalidateCache()

		return updated[0]
	}

	/**
	 * Get configuration history
	 */
	async getConfigHistory(configId?: string) {
		if (configId) {
			return db
				.select()
				.from(gameBalanceConfigHistory)
				.where(eq(gameBalanceConfigHistory.configId, configId))
				.orderBy(desc(gameBalanceConfigHistory.createdAt))
		}

		// Get history for active config
		const activeConfigs = await db
			.select()
			.from(gameBalanceConfig)
			.where(eq(gameBalanceConfig.isActive, true))
			.limit(1)

		if (activeConfigs.length === 0) {
			return []
		}

		return db
			.select()
			.from(gameBalanceConfigHistory)
			.where(eq(gameBalanceConfigHistory.configId, activeConfigs[0].id))
			.orderBy(desc(gameBalanceConfigHistory.createdAt))
	}

	/**
	 * Validate a configuration
	 */
	validateConfig(config: unknown): GameBalanceConfig {
		return gameBalanceConfigSchema.parse(config)
	}

	/**
	 * Invalidate the cache
	 */
	invalidateCache(): void {
		this.cache = null
	}
}

// Export singleton instance
export const balanceConfigService = new BalanceConfigService()
