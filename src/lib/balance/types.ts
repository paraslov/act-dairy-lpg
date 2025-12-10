/**
 * TypeScript interfaces for game balance configuration
 */

export interface PersonalValueThresholds {
	Common: number
	Rare: number
	Elite: number
	Legendary: number
	Mythic: number
	Ascended: number
	AscendedStar1: number
	AscendedStar2: number
	AscendedStar3: number
	AscendedStar4: number
	AscendedStar5: number
	EnlightenmentBase: number
	EnlightenmentIncrement: number
}

export interface CoreValueConfig {
	multiplier: number // Multiplier relative to personal values (e.g., 6x)
}

export interface PathLevelConfig {
	xpPerLevel: number // XP required per path level (e.g., 600)
	firstLevelXp?: number // Optional: different XP for first level
}

export interface StatsConfig {
	xpPerPoint: number // XP required per stat point (e.g., 50)
	shadowMitigationFactor: number // Factor for shadow XP mitigation (e.g., 0.1 = 10%)
}

export interface RankPointMap {
	Common: number
	Rare: number
	Elite: number
	Legendary: number
	Mythic: number
	Ascended: number
	AscendedStar: number // Per star
	Enlightenment: number // Base for Enlightenment
	EnlightenmentIncrement: number // Per level increment
}

export interface IntegrityRatingWeights {
	pathLevel: number // Points per path level (e.g., 10)
	shadowPathLevel: number // Penalty per shadow path level (e.g., -10)
	coreValueRank: number // Multiplier for core value rank points (e.g., 5)
	statPoint: number // Points per stat point (e.g., 0.5)
	rankPointMap: RankPointMap
}

export interface GameBalanceConfig {
	personalValueThresholds: PersonalValueThresholds
	coreValueConfig: CoreValueConfig
	pathLevelConfig: PathLevelConfig
	statsConfig: StatsConfig
	integrityWeights: IntegrityRatingWeights
}
