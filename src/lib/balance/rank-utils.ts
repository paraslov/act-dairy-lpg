/**
 * Utilities for calculating ranks from XP
 */

import type {
	GameBalanceConfig,
	PersonalValueThresholds,
	RankPointMap,
} from './types'

export type Rank =
	| 'Common'
	| 'Rare'
	| 'Elite'
	| 'Legendary'
	| 'Mythic'
	| 'Ascended'
	| 'AscendedStar1'
	| 'AscendedStar2'
	| 'AscendedStar3'
	| 'AscendedStar4'
	| 'AscendedStar5'
	| { type: 'Enlightenment'; level: number }

export interface RankInfo {
	rank: Rank
	currentXp: number
	xpForNextRank: number | null
	progressToNextRank: number // 0-1
}

/**
 * Get rank from XP for personal values
 */
export function getRankFromXp(
	xp: number,
	thresholds: PersonalValueThresholds
): Rank {
	if (xp < thresholds.Rare) {
		return 'Common'
	}
	if (xp < thresholds.Elite) {
		return 'Rare'
	}
	if (xp < thresholds.Legendary) {
		return 'Elite'
	}
	if (xp < thresholds.Mythic) {
		return 'Legendary'
	}
	if (xp < thresholds.Ascended) {
		return 'Mythic'
	}
	if (xp < thresholds.AscendedStar1) {
		return 'Ascended'
	}
	if (xp < thresholds.AscendedStar2) {
		return 'AscendedStar1'
	}
	if (xp < thresholds.AscendedStar3) {
		return 'AscendedStar2'
	}
	if (xp < thresholds.AscendedStar4) {
		return 'AscendedStar3'
	}
	if (xp < thresholds.AscendedStar5) {
		return 'AscendedStar4'
	}
	if (xp < thresholds.EnlightenmentBase) {
		return 'AscendedStar5'
	}

	// Calculate Enlightenment level
	const enlightenmentLevel = getEnlightenmentLevel(
		xp,
		thresholds.EnlightenmentBase,
		thresholds.EnlightenmentIncrement
	)

	return { type: 'Enlightenment', level: enlightenmentLevel }
}

/**
 * Calculate Enlightenment level from XP
 */
export function getEnlightenmentLevel(
	xp: number,
	base: number,
	increment: number
): number {
	if (xp < base) {
		return 0
	}

	const xpBeyondBase = xp - base
	// Enlightenment levels: base + increment, base + 2*increment, etc.
	// Level n requires: base + n * increment
	// So: n = (xp - base) / increment
	// But we need to account for the incremental growth pattern
	// Level 1: base + increment
	// Level 2: base + increment + (increment + 10)
	// Level 3: base + increment + (increment + 10) + (increment + 20)
	// Actually, according to the design: each level needs increment more than previous
	// Level 1: base + 100
	// Level 2: base + 100 + 110
	// Level 3: base + 100 + 110 + 120
	// So level n requires: base + sum(100 + i*10) for i=0 to n-1
	// = base + 100*n + 10*(0+1+2+...+(n-1))
	// = base + 100*n + 10*(n*(n-1)/2)
	// = base + 100*n + 5*n*(n-1)

	// Solve for n: xp = base + 100*n + 5*n*(n-1)
	// xp - base = 100*n + 5*n^2 - 5*n
	// xp - base = 5*n^2 + 95*n
	// 5*n^2 + 95*n - (xp - base) = 0
	// n = (-95 + sqrt(95^2 + 4*5*(xp-base))) / (2*5)

	const xpBeyond = xp - base
	if (xpBeyond < increment) {
		return 1
	}

	// Simplified: each level requires increment + (level-1)*10 more
	// Level 1: increment
	// Level 2: increment + increment + 10
	// Level 3: increment + increment + 10 + increment + 20
	// Actually simpler: level n requires n * increment + 10 * (0+1+2+...+(n-1))
	// = n * increment + 10 * (n*(n-1)/2)
	// = n * increment + 5 * n * (n-1)

	// Solve quadratic: 5*n^2 + (increment - 5)*n - xpBeyond = 0
	const a = 5
	const b = increment - 5
	const c = -xpBeyond

	const discriminant = b * b - 4 * a * c
	if (discriminant < 0) {
		return 1
	}

	const n = Math.floor((-b + Math.sqrt(discriminant)) / (2 * a))
	return Math.max(1, n)
}

/**
 * Get rank info with progress information
 */
export function getRankInfo(
	xp: number,
	thresholds: PersonalValueThresholds
): RankInfo {
	const rank = getRankFromXp(xp, thresholds)

	// Calculate XP for next rank
	let xpForNextRank: number | null = null
	let progressToNextRank = 0

	if (typeof rank === 'string') {
		// Find next threshold
		const rankOrder = [
			'Common',
			'Rare',
			'Elite',
			'Legendary',
			'Mythic',
			'Ascended',
			'AscendedStar1',
			'AscendedStar2',
			'AscendedStar3',
			'AscendedStar4',
			'AscendedStar5',
		] as const

		const currentIndex = rankOrder.indexOf(rank as any)
		if (currentIndex < rankOrder.length - 1) {
			const nextRank = rankOrder[currentIndex + 1]
			const currentThreshold = thresholds[rank as keyof PersonalValueThresholds]
			const nextThreshold =
				thresholds[nextRank as keyof PersonalValueThresholds]

			xpForNextRank = nextThreshold
			const xpInCurrentRank = xp - currentThreshold
			const xpNeededForNext = nextThreshold - currentThreshold
			progressToNextRank = Math.min(1, xpInCurrentRank / xpNeededForNext)
		} else if (rank === 'AscendedStar5') {
			// Next is Enlightenment 1
			xpForNextRank = thresholds.EnlightenmentBase
			const xpInCurrentRank = xp - thresholds.AscendedStar5
			const xpNeededForNext =
				thresholds.EnlightenmentBase - thresholds.AscendedStar5
			progressToNextRank = Math.min(1, xpInCurrentRank / xpNeededForNext)
		}
	} else {
		// Enlightenment level
		const level = rank.level
		const xpForThisLevel = getEnlightenmentXpForLevel(
			level,
			thresholds.EnlightenmentBase,
			thresholds.EnlightenmentIncrement
		)
		const xpForNextLevel = getEnlightenmentXpForLevel(
			level + 1,
			thresholds.EnlightenmentBase,
			thresholds.EnlightenmentIncrement
		)

		xpForNextRank = xpForNextLevel
		const xpInCurrentLevel = xp - xpForThisLevel
		const xpNeededForNext = xpForNextLevel - xpForThisLevel
		progressToNextRank = Math.min(1, xpInCurrentLevel / xpNeededForNext)
	}

	return {
		rank,
		currentXp: xp,
		xpForNextRank,
		progressToNextRank,
	}
}

/**
 * Get XP required for a specific Enlightenment level
 */
function getEnlightenmentXpForLevel(
	level: number,
	base: number,
	increment: number
): number {
	if (level <= 0) {
		return base
	}

	// Level n requires: base + sum(increment + i*10) for i=0 to n-1
	// = base + n * increment + 10 * (0+1+2+...+(n-1))
	// = base + n * increment + 10 * (n*(n-1)/2)
	// = base + n * increment + 5 * n * (n-1)
	return base + level * increment + 5 * level * (level - 1)
}

/**
 * Get rank points for Integrity Rating calculation
 */
export function getRankPoints(rank: Rank, rankPointMap: RankPointMap): number {
	if (typeof rank === 'string') {
		switch (rank) {
			case 'Common':
				return rankPointMap.Common
			case 'Rare':
				return rankPointMap.Rare
			case 'Elite':
				return rankPointMap.Elite
			case 'Legendary':
				return rankPointMap.Legendary
			case 'Mythic':
				return rankPointMap.Mythic
			case 'Ascended':
				return rankPointMap.Ascended
			case 'AscendedStar1':
				return rankPointMap.Ascended + rankPointMap.AscendedStar
			case 'AscendedStar2':
				return rankPointMap.Ascended + 2 * rankPointMap.AscendedStar
			case 'AscendedStar3':
				return rankPointMap.Ascended + 3 * rankPointMap.AscendedStar
			case 'AscendedStar4':
				return rankPointMap.Ascended + 4 * rankPointMap.AscendedStar
			case 'AscendedStar5':
				return rankPointMap.Ascended + 5 * rankPointMap.AscendedStar
			default:
				return 0
		}
	} else {
		// Enlightenment: base + increment per level
		return (
			rankPointMap.Enlightenment +
			rank.level * rankPointMap.EnlightenmentIncrement
		)
	}
}

/**
 * Get core value rank from XP (using multiplier)
 */
export function getCoreValueRankFromXp(
	xp: number,
	config: GameBalanceConfig
): Rank {
	// Core values use the same thresholds but multiplied
	const coreThresholds: PersonalValueThresholds = {
		Common:
			config.personalValueThresholds.Common * config.coreValueConfig.multiplier,
		Rare:
			config.personalValueThresholds.Rare * config.coreValueConfig.multiplier,
		Elite:
			config.personalValueThresholds.Elite * config.coreValueConfig.multiplier,
		Legendary:
			config.personalValueThresholds.Legendary *
			config.coreValueConfig.multiplier,
		Mythic:
			config.personalValueThresholds.Mythic * config.coreValueConfig.multiplier,
		Ascended:
			config.personalValueThresholds.Ascended *
			config.coreValueConfig.multiplier,
		AscendedStar1:
			config.personalValueThresholds.AscendedStar1 *
			config.coreValueConfig.multiplier,
		AscendedStar2:
			config.personalValueThresholds.AscendedStar2 *
			config.coreValueConfig.multiplier,
		AscendedStar3:
			config.personalValueThresholds.AscendedStar3 *
			config.coreValueConfig.multiplier,
		AscendedStar4:
			config.personalValueThresholds.AscendedStar4 *
			config.coreValueConfig.multiplier,
		AscendedStar5:
			config.personalValueThresholds.AscendedStar5 *
			config.coreValueConfig.multiplier,
		EnlightenmentBase:
			config.personalValueThresholds.EnlightenmentBase *
			config.coreValueConfig.multiplier,
		EnlightenmentIncrement:
			config.personalValueThresholds.EnlightenmentIncrement *
			config.coreValueConfig.multiplier,
	}

	return getRankFromXp(xp, coreThresholds)
}
