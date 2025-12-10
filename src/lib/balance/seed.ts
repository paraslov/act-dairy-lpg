/**
 * Seed script for initializing default balance configuration
 */

import { db } from '@/lib/db'
import { gameBalanceConfig } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { defaultBalanceConfig } from './defaults'
import { balanceConfigService } from './balance-config-service'

/**
 * Seed default balance configuration if no active config exists
 * @param adminUserId - ID of the admin user creating the config
 */
export async function seedDefaultBalanceConfig(
	adminUserId: string
): Promise<void> {
	// Check if active config exists
	const existingConfigs = await db
		.select()
		.from(gameBalanceConfig)
		.where(eq(gameBalanceConfig.isActive, true))
		.limit(1)

	if (existingConfigs.length > 0) {
		console.log('Active balance configuration already exists, skipping seed')
		return
	}

	// Create default config
	await balanceConfigService.createConfig(defaultBalanceConfig, adminUserId)
	console.log('Default balance configuration seeded successfully')
}

/**
 * Reset to default configuration (deactivates current and creates new)
 * @param adminUserId - ID of the admin user
 */
export async function resetToDefaultConfig(adminUserId: string): Promise<void> {
	await balanceConfigService.createConfig(defaultBalanceConfig, adminUserId)
	console.log('Balance configuration reset to defaults')
}
