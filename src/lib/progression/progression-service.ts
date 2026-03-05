/**
 * Progression Service - Handles quest completion XP awards
 */

import { db } from '@/lib/db'
import {
	moves,
	moveSubValueLinks,
	subValueProgress,
	globalProgress,
	xpHistory,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { balanceConfigService } from '@/lib/balance/balance-config-service'

export interface ProcessQuestCompletionParams {
	userId: string
	questInstanceId: string
	questDefinitionId: string
	difficulty: 'EASY' | 'MEDIUM' | 'HARD'
	direction: 'TOWARD' | 'AWAY'
	subValueIds: string[]
}

function getXpForDifficulty(
	difficulty: 'EASY' | 'MEDIUM' | 'HARD',
	config: { easyXp: number; mediumXp: number; hardXp: number }
): number {
	switch (difficulty) {
		case 'EASY':
			return config.easyXp
		case 'MEDIUM':
			return config.mediumXp
		case 'HARD':
			return config.hardXp
	}
}

export async function processQuestCompletion(
	params: ProcessQuestCompletionParams
): Promise<{ xpAwarded: number }> {
	const {
		userId,
		questInstanceId,
		questDefinitionId,
		difficulty,
		direction,
		subValueIds,
	} = params

	const config = await balanceConfigService.getActiveConfig()
	const xpAmount = getXpForDifficulty(difficulty, config.questRewardConfig)

	await db.transaction(async tx => {
		const moveId = crypto.randomUUID()

		await tx.insert(moves).values({
			id: moveId,
			userId,
			type: direction === 'TOWARD' ? 'TOWARD' : 'AWAY',
			questInstanceId,
			diaryNoteId: null,
			description: `Quest completed: ${questDefinitionId}`,
			occurredAt: new Date(),
		})

		for (const subValueId of subValueIds) {
			await tx.insert(moveSubValueLinks).values({
				id: crypto.randomUUID(),
				moveId,
				subValueId,
			})

			const existingProgress = await tx
				.select()
				.from(subValueProgress)
				.where(
					and(
						eq(subValueProgress.userId, userId),
						eq(subValueProgress.subValueId, subValueId)
					)
				)
				.limit(1)

			if (direction === 'TOWARD') {
				if (existingProgress.length > 0) {
					const progress = existingProgress[0]
					const newXp = progress.currentXp + xpAmount

					await tx
						.update(subValueProgress)
						.set({ currentXp: newXp, updatedAt: new Date() })
						.where(eq(subValueProgress.id, progress.id))

					await tx.insert(xpHistory).values({
						id: crypto.randomUUID(),
						userId,
						entityType: 'SUB_VALUE',
						entityId: subValueId,
						moveId,
						questInstanceId,
						diaryNoteId: null,
						xpChange: xpAmount,
						xpBefore: progress.currentXp,
						xpAfter: newXp,
						levelBefore: progress.currentLevel,
						levelAfter: progress.currentLevel,
					})
				} else {
					await tx.insert(subValueProgress).values({
						id: crypto.randomUUID(),
						userId,
						subValueId,
						currentXp: xpAmount,
						shadowXp: 0,
						currentLevel: 1,
						updatedAt: new Date(),
					})

					await tx.insert(xpHistory).values({
						id: crypto.randomUUID(),
						userId,
						entityType: 'SUB_VALUE',
						entityId: subValueId,
						moveId,
						questInstanceId,
						diaryNoteId: null,
						xpChange: xpAmount,
						xpBefore: 0,
						xpAfter: xpAmount,
						levelBefore: 1,
						levelAfter: 1,
					})
				}
			} else {
				if (existingProgress.length > 0) {
					const progress = existingProgress[0]
					await tx
						.update(subValueProgress)
						.set({
							shadowXp: progress.shadowXp + xpAmount,
							updatedAt: new Date(),
						})
						.where(eq(subValueProgress.id, progress.id))
				} else {
					await tx.insert(subValueProgress).values({
						id: crypto.randomUUID(),
						userId,
						subValueId,
						currentXp: 0,
						shadowXp: xpAmount,
						currentLevel: 1,
						updatedAt: new Date(),
					})
				}
			}
		}

		const existingGlobal = await tx
			.select()
			.from(globalProgress)
			.where(eq(globalProgress.userId, userId))
			.limit(1)

		if (direction === 'TOWARD') {
			if (existingGlobal.length > 0) {
				const gp = existingGlobal[0]
				const newXp = gp.currentXp + xpAmount
				const newLevel =
					Math.floor(newXp / config.pathLevelConfig.xpPerLevel) + 1

				await tx
					.update(globalProgress)
					.set({
						currentXp: newXp,
						currentLevel: newLevel,
						updatedAt: new Date(),
					})
					.where(eq(globalProgress.id, gp.id))

				await tx.insert(xpHistory).values({
					id: crypto.randomUUID(),
					userId,
					entityType: 'GLOBAL',
					entityId: 'global',
					moveId,
					questInstanceId,
					diaryNoteId: null,
					xpChange: xpAmount,
					xpBefore: gp.currentXp,
					xpAfter: newXp,
					levelBefore: gp.currentLevel,
					levelAfter: newLevel,
				})
			} else {
				const newLevel =
					Math.floor(xpAmount / config.pathLevelConfig.xpPerLevel) + 1

				await tx.insert(globalProgress).values({
					id: crypto.randomUUID(),
					userId,
					currentXp: xpAmount,
					shadowXp: 0,
					currentLevel: newLevel,
					updatedAt: new Date(),
				})

				await tx.insert(xpHistory).values({
					id: crypto.randomUUID(),
					userId,
					entityType: 'GLOBAL',
					entityId: 'global',
					moveId,
					questInstanceId,
					diaryNoteId: null,
					xpChange: xpAmount,
					xpBefore: 0,
					xpAfter: xpAmount,
					levelBefore: 1,
					levelAfter: newLevel,
				})
			}
		} else {
			if (existingGlobal.length > 0) {
				const gp = existingGlobal[0]
				await tx
					.update(globalProgress)
					.set({
						shadowXp: gp.shadowXp + xpAmount,
						updatedAt: new Date(),
					})
					.where(eq(globalProgress.id, gp.id))
			} else {
				await tx.insert(globalProgress).values({
					id: crypto.randomUUID(),
					userId,
					currentXp: 0,
					shadowXp: xpAmount,
					currentLevel: 1,
					updatedAt: new Date(),
				})
			}
		}
	})

	return { xpAwarded: xpAmount }
}
