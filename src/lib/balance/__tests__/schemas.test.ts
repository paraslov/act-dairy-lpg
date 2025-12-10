/**
 * Tests for Zod schemas validation
 */

import { gameBalanceConfigSchema } from '../schemas'
import { defaultBalanceConfig } from '../defaults'

describe('schemas', () => {
	describe('gameBalanceConfigSchema', () => {
		it('should validate default config', () => {
			expect(() => {
				gameBalanceConfigSchema.parse(defaultBalanceConfig)
			}).not.toThrow()
		})

		it('should reject invalid config with missing fields', () => {
			const invalidConfig = {
				personalValueThresholds: {},
			}

			expect(() => {
				gameBalanceConfigSchema.parse(invalidConfig)
			}).toThrow()
		})

		it('should reject config with negative XP thresholds', () => {
			const invalidConfig = {
				...defaultBalanceConfig,
				personalValueThresholds: {
					...defaultBalanceConfig.personalValueThresholds,
					Rare: -10,
				},
			}

			expect(() => {
				gameBalanceConfigSchema.parse(invalidConfig)
			}).toThrow()
		})

		it('should reject config with invalid threshold order', () => {
			const invalidConfig = {
				...defaultBalanceConfig,
				personalValueThresholds: {
					...defaultBalanceConfig.personalValueThresholds,
					Rare: 200, // Higher than Elite (150)
				},
			}

			expect(() => {
				gameBalanceConfigSchema.parse(invalidConfig)
			}).toThrow()
		})

		it('should reject config with invalid multiplier', () => {
			const invalidConfig = {
				...defaultBalanceConfig,
				coreValueConfig: {
					multiplier: -1,
				},
			}

			expect(() => {
				gameBalanceConfigSchema.parse(invalidConfig)
			}).toThrow()
		})
	})
})
