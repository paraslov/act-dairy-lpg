import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
	questDefinitions,
	questDefinitionSubValueLinks,
	subValues,
} from '@/lib/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const createQuestSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	description: z.string().optional().nullable(),
	direction: z.enum(['TOWARD', 'AWAY']),
	difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
	duration: z.number().int().positive().optional().nullable(),
	recurrencePattern: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).default('DAILY'),
	subValueIds: z.array(z.string()).optional().default([]),
})

export async function GET() {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const definitions = await db
			.select()
			.from(questDefinitions)
			.where(
				and(
					eq(questDefinitions.ownerId, session.user.id),
					eq(questDefinitions.isActive, true),
					isNull(questDefinitions.deletedAt)
				)
			)
			.orderBy(questDefinitions.createdAt)

		const defIds = definitions.map(d => d.id)
		const subValueLinks =
			defIds.length > 0
				? await db
						.select({
							questDefinitionId:
								questDefinitionSubValueLinks.questDefinitionId,
							subValueId: questDefinitionSubValueLinks.subValueId,
							relationType: questDefinitionSubValueLinks.relationType,
							subValueName: subValues.name,
						})
						.from(questDefinitionSubValueLinks)
						.innerJoin(
							subValues,
							eq(questDefinitionSubValueLinks.subValueId, subValues.id)
						)
						.where(
							inArray(
								questDefinitionSubValueLinks.questDefinitionId,
								defIds
							)
						)
				: []

		const questsWithValues = definitions.map(def => ({
			...def,
			subValues: subValueLinks.filter(
				link => link.questDefinitionId === def.id
			),
		}))

		return NextResponse.json({ quests: questsWithValues })
	} catch (error) {
		console.error('Error fetching quests:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function POST(request: Request) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const validatedData = createQuestSchema.parse(body)

		const questId = crypto.randomUUID()

		await db.insert(questDefinitions).values({
			id: questId,
			ownerId: session.user.id,
			title: validatedData.title,
			description: validatedData.description || null,
			direction: validatedData.direction,
			difficulty: validatedData.difficulty,
			duration: validatedData.duration || null,
			recurrencePattern: validatedData.recurrencePattern,
		})

		for (const subValueId of validatedData.subValueIds) {
			const subValue = await db
				.select()
				.from(subValues)
				.where(
					and(
						eq(subValues.id, subValueId),
						eq(subValues.userId, session.user.id),
						isNull(subValues.deletedAt)
					)
				)
				.limit(1)

			if (subValue.length > 0) {
				await db.insert(questDefinitionSubValueLinks).values({
					id: crypto.randomUUID(),
					questDefinitionId: questId,
					subValueId,
					relationType: 'SUPPORTS',
				})
			}
		}

		const created = await db
			.select()
			.from(questDefinitions)
			.where(eq(questDefinitions.id, questId))
			.limit(1)

		return NextResponse.json({ success: true, quest: created[0] })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.issues },
				{ status: 400 }
			)
		}

		console.error('Error creating quest:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
