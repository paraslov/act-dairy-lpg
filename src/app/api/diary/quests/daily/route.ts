import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { questInstances, questDefinitions } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: Request) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get daily quest instances for the user
		// Only include quests where recurrencePattern is 'DAILY'
		const dailyQuestInstances = await db
			.select({
				id: questInstances.id,
				questDefinitionId: questInstances.questDefinitionId,
				scheduledDate: questInstances.scheduledDate,
				status: questInstances.status,
				title: questDefinitions.title,
				description: questDefinitions.description,
			})
			.from(questInstances)
			.innerJoin(
				questDefinitions,
				eq(questInstances.questDefinitionId, questDefinitions.id)
			)
			.where(
				and(
					eq(questInstances.userId, session.user.id),
					eq(questDefinitions.recurrencePattern, 'DAILY'),
					eq(questDefinitions.isActive, true),
					isNull(questDefinitions.deletedAt)
				)
			)
			.orderBy(questInstances.scheduledDate, questDefinitions.title)

		return NextResponse.json({ questInstances: dailyQuestInstances })
	} catch (error) {
		console.error('Error fetching daily quest instances:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

