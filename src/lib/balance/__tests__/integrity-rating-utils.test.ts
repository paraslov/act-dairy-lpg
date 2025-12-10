/**
 * Tests for Integrity Rating calculation utilities
 */

import {
	calculateIntegrityRating,
	calculatePathLevel,
	calculateStatValue,
} from '../integrity-rating-utils'
import { defaultBalanceConfig } from '../defaults'
import type { UserProgress } from '../integrity-rating-utils'

describe('integrity-rating-utils', () => {
	describe('calculatePathLevel', () => {
		it('should return 0 for XP below first level', () => {
			expect(calculatePathLevel(300, defaultBalanceConfig)).toBe(0)
		})

		it('should return 1 for XP equal to first level', () => {
			expect(calculatePathLevel(600, defaultBalanceConfig)).toBe(1)
		})

		it('should return 2 for XP equal to two levels', () => {
			expect(calculatePathLevel(1200, defaultBalanceConfig)).toBe(2)
		})

		it('should return correct level for partial XP', () => {
			expect(calculatePathLevel(900, defaultBalanceConfig)).toBe(1)
		})
	})

	describe('calculateStatValue', () => {
		it('should return 0 for 0 XP', () => {
			expect(calculateStatValue(0, defaultBalanceConfig)).toBe(0)
		})

		it('should return 1 for 50 XP', () => {
			expect(calculateStatValue(50, defaultBalanceConfig)).toBe(1)
		})

		it('should return 2 for 100 XP', () => {
			expect(calculateStatValue(100, defaultBalanceConfig)).toBe(2)
		})

		it('should floor partial values', () => {
			expect(calculateStatValue(75, defaultBalanceConfig)).toBe(1)
		})
	})

	describe('calculateIntegrityRating', () => {
		it('should calculate basic IR with path level only', () => {
			const progress: UserProgress = {
				pathLevel: 5,
				shadowPathLevel: 0,
				coreValueLightXp: {},
				coreValueShadowXp: {},
				lightStatValues: {},
				shadowStatValues: {},
			}

			const ir = calculateIntegrityRating(progress, defaultBalanceConfig)
			// Path level 5 * 10 = 50
			expect(ir).toBe(50)
		})

		it('should subtract shadow path penalty', () => {
			const progress: UserProgress = {
				pathLevel: 5,
				shadowPathLevel: 2,
				coreValueLightXp: {},
				coreValueShadowXp: {},
				lightStatValues: {},
				shadowStatValues: {},
			}

			const ir = calculateIntegrityRating(progress, defaultBalanceConfig)
			// Path level 5 * 10 = 50, Shadow 2 * -10 = -20, Total = 30
			expect(ir).toBe(30)
		})

		it('should include stat contribution', () => {
			const progress: UserProgress = {
				pathLevel: 1,
				shadowPathLevel: 0,
				coreValueLightXp: {},
				coreValueShadowXp: {},
				lightStatValues: {
					stat1: 100,
					stat2: 50,
				},
				shadowStatValues: {
					stat3: 20,
				},
			}

			const ir = calculateIntegrityRating(progress, defaultBalanceConfig)
			// Path: 1 * 10 = 10
			// Stats: (100 + 50 - 20) * 0.5 = 130 * 0.5 = 65
			// Total: 10 + 65 = 75
			expect(ir).toBe(75)
		})
	})
})
