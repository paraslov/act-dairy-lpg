import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
	globalProgress,
	subValueProgress,
	subValueBaseValueLinks,
	baseValues,
	subValues,
	questInstances,
	questDefinitions,
} from '@/lib/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { balanceConfigService } from '@/lib/balance/balance-config-service'
import {
	calculatePathLevel,
	calculateShadowPathLevel,
	calculateIntegrityRating,
	type UserProgress,
} from '@/lib/balance/integrity-rating-utils'
import {
	getRankFromXp,
	getRankInfo,
	getCoreValueRankFromXp,
	type Rank,
	type RankInfo,
} from '@/lib/balance/rank-utils'

export async function GET() {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const userId = session.user.id

		let userGlobalProgress = await db
			.select()
			.from(globalProgress)
			.where(eq(globalProgress.userId, userId))
			.limit(1)

		if (userGlobalProgress.length === 0) {
			await db.insert(globalProgress).values({
				id: crypto.randomUUID(),
				userId,
				currentXp: 0,
				shadowXp: 0,
				currentLevel: 1,
				updatedAt: new Date(),
			})

			userGlobalProgress = await db
				.select()
				.from(globalProgress)
				.where(eq(globalProgress.userId, userId))
				.limit(1)
		}

		const globalXp = userGlobalProgress[0].currentXp
		const globalShadowXp = userGlobalProgress[0].shadowXp

		const userSubValueProgress = await db
			.select({
				id: subValueProgress.id,
				subValueId: subValueProgress.subValueId,
				subValueName: subValues.name,
				currentXp: subValueProgress.currentXp,
				shadowXp: subValueProgress.shadowXp,
				currentLevel: subValueProgress.currentLevel,
			})
			.from(subValueProgress)
			.innerJoin(subValues, eq(subValueProgress.subValueId, subValues.id))
			.where(eq(subValueProgress.userId, userId))

		const config = await balanceConfigService.getActiveConfig()

		const pathLevel = calculatePathLevel(globalXp, config)
		const shadowPathLevel = calculateShadowPathLevel(globalShadowXp, config)

		const coreValueXpAggregates = await db
			.select({
				baseValueId: baseValues.id,
				baseValueName: baseValues.name,
				totalLightXp: sql<number>`COALESCE(SUM(${subValueProgress.currentXp}), 0)`,
				totalShadowXp: sql<number>`COALESCE(SUM(${subValueProgress.shadowXp}), 0)`,
			})
			.from(baseValues)
			.leftJoin(
				subValueBaseValueLinks,
				eq(baseValues.id, subValueBaseValueLinks.baseValueId)
			)
			.leftJoin(
				subValueProgress,
				sql`${subValueProgress.subValueId} = ${subValueBaseValueLinks.subValueId} AND ${subValueProgress.userId} = ${userId}`
			)
			.groupBy(baseValues.id, baseValues.name)

		const coreValues = coreValueXpAggregates.map(cv => {
			const lightXp = Number(cv.totalLightXp)
			const shadowXp = Number(cv.totalShadowXp)
			const lightRank = getCoreValueRankFromXp(lightXp, config)
			const shadowRank = getCoreValueRankFromXp(shadowXp, config)

			return {
				id: cv.baseValueId,
				name: cv.baseValueName,
				lightXp,
				lightRank,
				shadowXp,
				shadowRank,
			}
		})

		const subValuesWithRanks = userSubValueProgress.map(sv => {
			const rank = getRankFromXp(sv.currentXp, config.personalValueThresholds)
			const rankInfo = getRankInfo(sv.currentXp, config.personalValueThresholds)

			return {
				id: sv.subValueId,
				name: sv.subValueName,
				xp: sv.currentXp,
				shadowXp: sv.shadowXp,
				rank,
				rankInfo,
			}
		})

		const coreValueLightXp: Record<string, number> = {}
		const coreValueShadowXp: Record<string, number> = {}

		for (const cv of coreValues) {
			coreValueLightXp[cv.id] = cv.lightXp
			coreValueShadowXp[cv.id] = cv.shadowXp
		}

		const userProgressForIR: UserProgress = {
			pathLevel,
			shadowPathLevel,
			coreValueLightXp,
			coreValueShadowXp,
			lightStatValues: {},
			shadowStatValues: {},
		}

		const integrityRating = calculateIntegrityRating(userProgressForIR, config)

		const today = new Date().toISOString().split('T')[0]

		const todayInstances = await db
			.select({
				id: questInstances.id,
				status: questInstances.status,
				difficulty: questDefinitions.difficulty,
			})
			.from(questInstances)
			.innerJoin(
				questDefinitions,
				eq(questInstances.questDefinitionId, questDefinitions.id)
			)
			.where(
				and(
					eq(questInstances.userId, userId),
					eq(questInstances.scheduledDate, today),
					isNull(questDefinitions.deletedAt)
				)
			)

		const milestonesConfig = config.dailyMilestonesConfig
		let progressPercent = 0
		let completedQuests = 0

		for (const inst of todayInstances) {
			if (inst.status === 'COMPLETED') {
				completedQuests++
				switch (inst.difficulty) {
					case 'EASY':
						progressPercent += milestonesConfig.easyProgressPercent
						break
					case 'MEDIUM':
						progressPercent += milestonesConfig.mediumProgressPercent
						break
					case 'HARD':
						progressPercent += milestonesConfig.hardProgressPercent
						break
				}
			}
		}

		return NextResponse.json({
			pathLevel,
			shadowPathLevel,
			globalXp,
			globalShadowXp,
			integrityRating,
			coreValues,
			subValues: subValuesWithRanks,
			dailyProgress: {
				date: today,
				totalQuests: todayInstances.length,
				completedQuests,
				progressPercent: Math.min(progressPercent, 100),
			},
		})
	} catch (error) {
		console.error('Error fetching user progress:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
