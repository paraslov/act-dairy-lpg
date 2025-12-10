/**
 * Zod schemas for validating game balance configuration
 */

import { z } from 'zod'
import type {
	GameBalanceConfig,
	PersonalValueThresholds,
	CoreValueConfig,
	PathLevelConfig,
	StatsConfig,
	IntegrityRatingWeights,
	RankPointMap,
} from './types'

// Personal Value Thresholds Schema
export const personalValueThresholdsSchema: z.ZodType<PersonalValueThresholds> =
	z
		.object({
			Common: z.number().int().min(0),
			Rare: z.number().int().min(0),
			Elite: z.number().int().min(0),
			Legendary: z.number().int().min(0),
			Mythic: z.number().int().min(0),
			Ascended: z.number().int().min(0),
			AscendedStar1: z.number().int().min(0),
			AscendedStar2: z.number().int().min(0),
			AscendedStar3: z.number().int().min(0),
			AscendedStar4: z.number().int().min(0),
			AscendedStar5: z.number().int().min(0),
			EnlightenmentBase: z.number().int().min(0),
			EnlightenmentIncrement: z.number().int().min(1),
		})
		.refine(
			data =>
				data.Rare >= data.Common &&
				data.Elite >= data.Rare &&
				data.Legendary >= data.Elite &&
				data.Mythic >= data.Legendary &&
				data.Ascended >= data.Mythic &&
				data.AscendedStar1 >= data.Ascended &&
				data.AscendedStar2 >= data.AscendedStar1 &&
				data.AscendedStar3 >= data.AscendedStar2 &&
				data.AscendedStar4 >= data.AscendedStar3 &&
				data.AscendedStar5 >= data.AscendedStar4 &&
				data.EnlightenmentBase >= data.AscendedStar5,
			{
				message: 'XP thresholds must be in ascending order',
			}
		)

// Core Value Config Schema
export const coreValueConfigSchema: z.ZodType<CoreValueConfig> = z.object({
	multiplier: z.number().positive().min(1).max(100),
})

// Path Level Config Schema
export const pathLevelConfigSchema: z.ZodType<PathLevelConfig> = z.object({
	xpPerLevel: z.number().int().positive().min(1),
	firstLevelXp: z.number().int().positive().optional(),
})

// Stats Config Schema
export const statsConfigSchema: z.ZodType<StatsConfig> = z.object({
	xpPerPoint: z.number().int().positive().min(1),
	shadowMitigationFactor: z.number().min(0).max(1),
})

// Rank Point Map Schema
export const rankPointMapSchema: z.ZodType<RankPointMap> = z.object({
	Common: z.number().min(0),
	Rare: z.number().min(0),
	Elite: z.number().min(0),
	Legendary: z.number().min(0),
	Mythic: z.number().min(0),
	Ascended: z.number().min(0),
	AscendedStar: z.number().min(0),
	Enlightenment: z.number().min(0),
	EnlightenmentIncrement: z.number().min(0),
})

// Integrity Rating Weights Schema
export const integrityRatingWeightsSchema: z.ZodType<IntegrityRatingWeights> =
	z.object({
		pathLevel: z.number(),
		shadowPathLevel: z.number(),
		coreValueRank: z.number().min(0),
		statPoint: z.number().min(0),
		rankPointMap: rankPointMapSchema,
	})

// Complete Game Balance Config Schema
export const gameBalanceConfigSchema: z.ZodType<GameBalanceConfig> = z.object({
	personalValueThresholds: personalValueThresholdsSchema,
	coreValueConfig: coreValueConfigSchema,
	pathLevelConfig: pathLevelConfigSchema,
	statsConfig: statsConfigSchema,
	integrityWeights: integrityRatingWeightsSchema,
})
