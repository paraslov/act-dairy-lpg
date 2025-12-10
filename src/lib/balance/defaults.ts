/**
 * Default balance configuration values
 * Based on the game balance design document
 */

import type { GameBalanceConfig } from './types'

export const defaultBalanceConfig: GameBalanceConfig = {
	personalValueThresholds: {
		Common: 0,
		Rare: 50,
		Elite: 150,
		Legendary: 300,
		Mythic: 500,
		Ascended: 750,
		AscendedStar1: 1050,
		AscendedStar2: 1400,
		AscendedStar3: 1800,
		AscendedStar4: 2250,
		AscendedStar5: 2750,
		EnlightenmentBase: 2850,
		EnlightenmentIncrement: 10,
	},
	coreValueConfig: {
		multiplier: 6,
	},
	pathLevelConfig: {
		xpPerLevel: 600,
	},
	statsConfig: {
		xpPerPoint: 50,
		shadowMitigationFactor: 0.1,
	},
	integrityWeights: {
		pathLevel: 10,
		shadowPathLevel: -10,
		coreValueRank: 5,
		statPoint: 0.5,
		rankPointMap: {
			Common: 1,
			Rare: 2,
			Elite: 3,
			Legendary: 4,
			Mythic: 5,
			Ascended: 6,
			AscendedStar: 0.5,
			Enlightenment: 7,
			EnlightenmentIncrement: 0.5,
		},
	},
}
