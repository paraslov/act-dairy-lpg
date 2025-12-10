/**
 * Tests for rank calculation utilities
 */

import {
	getRankFromXp,
	getEnlightenmentLevel,
	getRankPoints,
	getRankInfo,
} from '../rank-utils'
import { defaultBalanceConfig } from '../defaults'
import type { Rank } from '../rank-utils'

describe('rank-utils', () => {
	const thresholds = defaultBalanceConfig.personalValueThresholds

	describe('getRankFromXp', () => {
		it('should return Common for 0 XP', () => {
			expect(getRankFromXp(0, thresholds)).toBe('Common')
		})

		it('should return Rare for 50 XP', () => {
			expect(getRankFromXp(50, thresholds)).toBe('Rare')
		})

		it('should return Elite for 150 XP', () => {
			expect(getRankFromXp(150, thresholds)).toBe('Elite')
		})

		it('should return Legendary for 300 XP', () => {
			expect(getRankFromXp(300, thresholds)).toBe('Legendary')
		})

		it('should return Mythic for 500 XP', () => {
			expect(getRankFromXp(500, thresholds)).toBe('Mythic')
		})

		it('should return Ascended for 750 XP', () => {
			expect(getRankFromXp(750, thresholds)).toBe('Ascended')
		})

		it('should return AscendedStar1 for 1050 XP', () => {
			expect(getRankFromXp(1050, thresholds)).toBe('AscendedStar1')
		})

		it('should return AscendedStar5 for 2750 XP', () => {
			expect(getRankFromXp(2750, thresholds)).toBe('AscendedStar5')
		})

		it('should return Enlightenment level for 2850+ XP', () => {
			const rank = getRankFromXp(2850, thresholds)
			expect(rank).toHaveProperty('type', 'Enlightenment')
			if (typeof rank !== 'string') {
				expect(rank.level).toBeGreaterThan(0)
			}
		})
	})

	describe('getEnlightenmentLevel', () => {
		it('should return 0 for XP below base', () => {
			expect(
				getEnlightenmentLevel(2800, thresholds.EnlightenmentBase, 10)
			).toBe(0)
		})

		it('should return 1 for base XP', () => {
			expect(
				getEnlightenmentLevel(2850, thresholds.EnlightenmentBase, 10)
			).toBeGreaterThanOrEqual(1)
		})
	})

	describe('getRankPoints', () => {
		const rankPointMap = defaultBalanceConfig.integrityWeights.rankPointMap

		it('should return correct points for Common', () => {
			expect(getRankPoints('Common', rankPointMap)).toBe(rankPointMap.Common)
		})

		it('should return correct points for Rare', () => {
			expect(getRankPoints('Rare', rankPointMap)).toBe(rankPointMap.Rare)
		})

		it('should return correct points for AscendedStar1', () => {
			const expected = rankPointMap.Ascended + rankPointMap.AscendedStar
			expect(getRankPoints('AscendedStar1', rankPointMap)).toBe(expected)
		})

		it('should return correct points for Enlightenment', () => {
			const enlightenmentRank: Rank = { type: 'Enlightenment', level: 1 }
			const expected =
				rankPointMap.Enlightenment + 1 * rankPointMap.EnlightenmentIncrement
			expect(getRankPoints(enlightenmentRank, rankPointMap)).toBe(expected)
		})
	})

	describe('getRankInfo', () => {
		it('should return correct info for Common rank', () => {
			const info = getRankInfo(25, thresholds)
			expect(info.rank).toBe('Common')
			expect(info.currentXp).toBe(25)
			expect(info.xpForNextRank).toBe(thresholds.Rare)
			expect(info.progressToNextRank).toBeGreaterThan(0)
			expect(info.progressToNextRank).toBeLessThanOrEqual(1)
		})

		it('should return correct info for Rare rank', () => {
			const info = getRankInfo(75, thresholds)
			expect(info.rank).toBe('Rare')
			expect(info.xpForNextRank).toBe(thresholds.Elite)
		})
	})
})
