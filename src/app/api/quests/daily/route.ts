import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
	questDefinitions,
	questInstances,
	questDefinitionSubValueLinks,
	subValues,
} from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: Request) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const date =
			searchParams.get('date') ||
			new Date().toISOString().split('T')[0]

		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return NextResponse.json(
				{ error: 'Date must be YYYY-MM-DD' },
				{ status: 400 }
			)
		}

		const dailyDefinitions = await db
			.select()
			.from(questDefinitions)
			.where(
				and(
					eq(questDefinitions.ownerId, session.user.id),
					eq(questDefinitions.recurrencePattern, 'DAILY'),
					eq(questDefinitions.isActive, true),
					isNull(questDefinitions.deletedAt)
				)
			)

		const existingInstances = await db
			.select()
			.from(questInstances)
			.where(
				and(
					eq(questInstances.userId, session.user.id),
					eq(questInstances.scheduledDate, date)
				)
			)

		const existingDefIds = new Set(
			existingInstances.map(i => i.questDefinitionId)
		)

		for (const def of dailyDefinitions) {
			if (!existingDefIds.has(def.id)) {
				await db.insert(questInstances).values({
					id: crypto.randomUUID(),
					userId: session.user.id,
					questDefinitionId: def.id,
					scheduledDate: date,
					status: 'PLANNED',
				})
			}
		}

		const allInstances = await db
			.select({
				id: questInstances.id,
				questDefinitionId: questInstances.questDefinitionId,
				scheduledDate: questInstances.scheduledDate,
				status: questInstances.status,
				completedAt: questInstances.completedAt,
				title: questDefinitions.title,
				description: questDefinitions.description,
				direction: questDefinitions.direction,
				difficulty: questDefinitions.difficulty,
				duration: questDefinitions.duration,
			})
			.from(questInstances)
			.innerJoin(
				questDefinitions,
				eq(questInstances.questDefinitionId, questDefinitions.id)
			)
			.where(
				and(
					eq(questInstances.userId, session.user.id),
					eq(questInstances.scheduledDate, date),
					isNull(questDefinitions.deletedAt)
				)
			)
			.orderBy(questDefinitions.title)

		const defIdsForLinks = [
			...new Set(allInstances.map(i => i.questDefinitionId)),
		]
		const svLinks =
			defIdsForLinks.length > 0
				? await db
						.select({
							questDefinitionId:
								questDefinitionSubValueLinks.questDefinitionId,
							subValueId: questDefinitionSubValueLinks.subValueId,
							subValueName: subValues.name,
						})
						.from(questDefinitionSubValueLinks)
						.innerJoin(
							subValues,
							eq(questDefinitionSubValueLinks.subValueId, subValues.id)
						)
				: []

		const result = allInstances.map(inst => ({
			...inst,
			subValues: svLinks.filter(
				link => link.questDefinitionId === inst.questDefinitionId
			),
		}))

		return NextResponse.json({ questInstances: result })
	} catch (error) {
		console.error('Error fetching daily quests:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
