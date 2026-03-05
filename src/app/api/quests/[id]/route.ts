import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
	questDefinitions,
	questDefinitionSubValueLinks,
	questInstances,
	subValues,
} from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const updateQuestSchema = z.object({
	title: z.string().min(1).optional(),
	description: z.string().optional().nullable(),
	direction: z.enum(['TOWARD', 'AWAY']).optional(),
	difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
	duration: z.number().int().positive().optional().nullable(),
	recurrencePattern: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM']).optional(),
	subValueIds: z.array(z.string()).optional(),
})

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params

		const existing = await db
			.select()
			.from(questDefinitions)
			.where(
				and(
					eq(questDefinitions.id, id),
					eq(questDefinitions.ownerId, session.user.id),
					isNull(questDefinitions.deletedAt)
				)
			)
			.limit(1)

		if (existing.length === 0) {
			return NextResponse.json(
				{ error: 'Quest not found' },
				{ status: 404 }
			)
		}

		const body = await request.json()
		const validatedData = updateQuestSchema.parse(body)

		const updateData: Record<string, unknown> = {
			updatedAt: new Date(),
		}

		if (validatedData.title !== undefined) {
			updateData.title = validatedData.title
		}
		if (validatedData.description !== undefined) {
			updateData.description = validatedData.description
		}
		if (validatedData.direction !== undefined) {
			updateData.direction = validatedData.direction
		}
		if (validatedData.difficulty !== undefined) {
			updateData.difficulty = validatedData.difficulty
		}
		if (validatedData.duration !== undefined) {
			updateData.duration = validatedData.duration
		}
		if (validatedData.recurrencePattern !== undefined) {
			updateData.recurrencePattern = validatedData.recurrencePattern
		}

		await db
			.update(questDefinitions)
			.set(updateData)
			.where(eq(questDefinitions.id, id))

		if (validatedData.subValueIds !== undefined) {
			await db
				.delete(questDefinitionSubValueLinks)
				.where(eq(questDefinitionSubValueLinks.questDefinitionId, id))

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
						questDefinitionId: id,
						subValueId,
						relationType: 'SUPPORTS',
					})
				}
			}
		}

		const updated = await db
			.select()
			.from(questDefinitions)
			.where(eq(questDefinitions.id, id))
			.limit(1)

		return NextResponse.json({ success: true, quest: updated[0] })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.issues },
				{ status: 400 }
			)
		}

		console.error('Error updating quest:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params

		const existing = await db
			.select()
			.from(questDefinitions)
			.where(
				and(
					eq(questDefinitions.id, id),
					eq(questDefinitions.ownerId, session.user.id),
					isNull(questDefinitions.deletedAt)
				)
			)
			.limit(1)

		if (existing.length === 0) {
			return NextResponse.json(
				{ error: 'Quest not found' },
				{ status: 404 }
			)
		}

		await db
			.update(questDefinitions)
			.set({ deletedAt: new Date(), updatedAt: new Date(), isActive: false })
			.where(eq(questDefinitions.id, id))

		await db
			.update(questInstances)
			.set({ status: 'CANCELLED', updatedAt: new Date() })
			.where(
				and(
					eq(questInstances.questDefinitionId, id),
					eq(questInstances.status, 'PLANNED')
				)
			)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting quest:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
