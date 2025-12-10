/**
 * Utilities for calculating Integrity Rating
 */

import type { GameBalanceConfig } from './types'
import {
	getRankPoints,
	getCoreValueRankFromXp,
	getRankFromXp,
} from './rank-utils'

export interface UserProgress {
	pathLevel: number
	shadowPathLevel: number
	coreValueLightXp: Record<string, number> // baseValueId -> xp
	coreValueShadowXp: Record<string, number> // baseValueId -> xp
	lightStatValues: Record<string, number> // statTypeId -> value
	shadowStatValues: Record<string, number> // statTypeId -> value
}

/**
 * Calculate Integrity Rating from user progress
 */
export function calculateIntegrityRating(
	userProgress: UserProgress,
	config: GameBalanceConfig
): number {
	const weights = config.integrityWeights

	// 1. Path Level contribution
	const pathLevelContribution = userProgress.pathLevel * weights.pathLevel

	// 2. Shadow Path Level penalty
	const shadowPathPenalty =
		userProgress.shadowPathLevel * weights.shadowPathLevel

	// 3. Core Value contribution
	let coreLightScore = 0
	let coreShadowScore = 0

	for (const [baseValueId, lightXp] of Object.entries(
		userProgress.coreValueLightXp
	)) {
		const rank = getCoreValueRankFromXp(lightXp, config)
		coreLightScore += getRankPoints(rank, weights.rankPointMap)
	}

	for (const [baseValueId, shadowXp] of Object.entries(
		userProgress.coreValueShadowXp
	)) {
		const rank = getCoreValueRankFromXp(shadowXp, config)
		coreShadowScore += getRankPoints(rank, weights.rankPointMap)
	}

	const coreContribution =
		(coreLightScore - coreShadowScore) * weights.coreValueRank

	// 4. Stat contribution
	let totalLightStats = 0
	let totalShadowStats = 0

	for (const value of Object.values(userProgress.lightStatValues)) {
		totalLightStats += value
	}

	for (const value of Object.values(userProgress.shadowStatValues)) {
		totalShadowStats += value
	}

	const statContribution =
		(totalLightStats - totalShadowStats) * weights.statPoint

	// 5. Sum everything
	const integrityRating =
		pathLevelContribution +
		shadowPathPenalty +
		coreContribution +
		statContribution

	return Math.round(integrityRating * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate Path Level from Global XP
 */
export function calculatePathLevel(
	globalXp: number,
	config: GameBalanceConfig
): number {
	const xpPerLevel = config.pathLevelConfig.xpPerLevel
	const firstLevelXp = config.pathLevelConfig.firstLevelXp || xpPerLevel

	if (globalXp < firstLevelXp) {
		return 0
	}

	// First level uses firstLevelXp, subsequent levels use xpPerLevel
	const xpAfterFirstLevel = globalXp - firstLevelXp
	const additionalLevels = Math.floor(xpAfterFirstLevel / xpPerLevel)

	return 1 + additionalLevels
}

/**
 * Calculate Shadow Path Level from Shadow Global XP
 */
export function calculateShadowPathLevel(
	shadowGlobalXp: number,
	config: GameBalanceConfig
): number {
	// Shadow path uses the same scale as regular path
	return calculatePathLevel(shadowGlobalXp, config)
}

/**
 * Calculate stat value from stat XP
 */
export function calculateStatValue(
	statXp: number,
	config: GameBalanceConfig
): number {
	return Math.floor(statXp / config.statsConfig.xpPerPoint)
}
