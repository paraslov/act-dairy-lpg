import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
	questInstances,
	questDefinitions,
	questDefinitionSubValueLinks,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { processQuestCompletion } from '@/lib/progression/progression-service'

export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params

		const instance = await db
			.select({
				id: questInstances.id,
				userId: questInstances.userId,
				questDefinitionId: questInstances.questDefinitionId,
				status: questInstances.status,
				direction: questDefinitions.direction,
				difficulty: questDefinitions.difficulty,
			})
			.from(questInstances)
			.innerJoin(
				questDefinitions,
				eq(questInstances.questDefinitionId, questDefinitions.id)
			)
			.where(
				and(
					eq(questInstances.id, id),
					eq(questInstances.userId, session.user.id)
				)
			)
			.limit(1)

		if (instance.length === 0) {
			return NextResponse.json(
				{ error: 'Quest instance not found' },
				{ status: 404 }
			)
		}

		if (instance[0].status !== 'PLANNED') {
			return NextResponse.json(
				{ error: 'Quest is not in PLANNED status' },
				{ status: 400 }
			)
		}

		await db
			.update(questInstances)
			.set({
				status: 'COMPLETED',
				completedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(questInstances.id, id))

		const subValueLinks = await db
			.select({ subValueId: questDefinitionSubValueLinks.subValueId })
			.from(questDefinitionSubValueLinks)
			.where(
				eq(
					questDefinitionSubValueLinks.questDefinitionId,
					instance[0].questDefinitionId
				)
			)

		const subValueIds = subValueLinks.map(l => l.subValueId)

		const result = await processQuestCompletion({
			userId: session.user.id,
			questInstanceId: id,
			questDefinitionId: instance[0].questDefinitionId,
			difficulty: instance[0].difficulty,
			direction: instance[0].direction,
			subValueIds,
		})

		return NextResponse.json({
			success: true,
			xpAwarded: result.xpAwarded,
		})
	} catch (error) {
		console.error('Error completing quest:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
