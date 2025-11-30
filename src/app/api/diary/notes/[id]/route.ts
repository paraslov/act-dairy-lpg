import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
	diaryNotes,
	diaryNoteQuestInstanceLinks,
	diaryNoteSubValueLinks,
	questInstances,
	subValues,
	questDefinitions,
} from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const updateNoteSchema = z.object({
	content: z.string().min(1, 'Content is required').optional(),
	timeOfDay: z
		.string()
		.regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format')
		.optional()
		.nullable(),
	questInstanceId: z.string().optional().nullable(),
	subValueId: z.string().optional().nullable(),
	relationType: z.enum(['ALIGNED', 'VIOLATED']).optional().nullable(),
	moveType: z.enum(['TOWARD', 'AWAY']).optional().nullable(),
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

		// Verify note belongs to user
		const existingNote = await db
			.select()
			.from(diaryNotes)
			.where(
				and(
					eq(diaryNotes.id, id),
					eq(diaryNotes.userId, session.user.id),
					isNull(diaryNotes.deletedAt)
				)
			)
			.limit(1)

		if (existingNote.length === 0) {
			return NextResponse.json({ error: 'Note not found' }, { status: 404 })
		}

		const body = await request.json()
		const validatedData = updateNoteSchema.parse(body)

		// Update note fields
		const updateData: {
			content?: string
			timeOfDay?: string | null
			moveType?: 'TOWARD' | 'AWAY' | null
			updatedAt: Date
		} = {
			updatedAt: new Date(),
		}

		if (validatedData.content !== undefined) {
			updateData.content = validatedData.content
		}

		if (validatedData.timeOfDay !== undefined) {
			updateData.timeOfDay = validatedData.timeOfDay || null
		}

		if (validatedData.moveType !== undefined) {
			updateData.moveType = validatedData.moveType || null
		}

		await db.update(diaryNotes).set(updateData).where(eq(diaryNotes.id, id))

		// Handle quest instance link
		if (validatedData.questInstanceId !== undefined) {
			// Delete existing link
			await db
				.delete(diaryNoteQuestInstanceLinks)
				.where(eq(diaryNoteQuestInstanceLinks.diaryNoteId, id))

			// Create new link if provided
			if (validatedData.questInstanceId) {
				// Verify the quest instance belongs to the user
				const questInstance = await db
					.select()
					.from(questInstances)
					.where(
						and(
							eq(questInstances.id, validatedData.questInstanceId),
							eq(questInstances.userId, session.user.id)
						)
					)
					.limit(1)

				if (questInstance.length > 0) {
					await db.insert(diaryNoteQuestInstanceLinks).values({
						id: crypto.randomUUID(),
						diaryNoteId: id,
						questInstanceId: validatedData.questInstanceId,
					})
				}
			}
		}

		// Handle sub-value link
		if (
			validatedData.subValueId !== undefined ||
			validatedData.relationType !== undefined
		) {
			// Delete existing link
			await db
				.delete(diaryNoteSubValueLinks)
				.where(eq(diaryNoteSubValueLinks.diaryNoteId, id))

			// Create new link if both provided
			if (validatedData.subValueId && validatedData.relationType) {
				// Verify the sub-value belongs to the user
				const subValue = await db
					.select()
					.from(subValues)
					.where(
						and(
							eq(subValues.id, validatedData.subValueId),
							eq(subValues.userId, session.user.id),
							isNull(subValues.deletedAt)
						)
					)
					.limit(1)

				if (subValue.length > 0) {
					await db.insert(diaryNoteSubValueLinks).values({
						id: crypto.randomUUID(),
						diaryNoteId: id,
						subValueId: validatedData.subValueId,
						relationType: validatedData.relationType,
					})
				}
			}
		}

		// Fetch updated note with attachments
		const updatedNote = await db
			.select()
			.from(diaryNotes)
			.where(eq(diaryNotes.id, id))
			.limit(1)

		// Get attachments
		const questLink = await db
			.select({
				questInstanceId: diaryNoteQuestInstanceLinks.questInstanceId,
				questTitle: questDefinitions.title,
			})
			.from(diaryNoteQuestInstanceLinks)
			.innerJoin(
				questInstances,
				eq(diaryNoteQuestInstanceLinks.questInstanceId, questInstances.id)
			)
			.innerJoin(
				questDefinitions,
				eq(questInstances.questDefinitionId, questDefinitions.id)
			)
			.where(eq(diaryNoteQuestInstanceLinks.diaryNoteId, id))
			.limit(1)

		const valueLink = await db
			.select({
				subValueId: diaryNoteSubValueLinks.subValueId,
				relationType: diaryNoteSubValueLinks.relationType,
				subValueName: subValues.name,
			})
			.from(diaryNoteSubValueLinks)
			.innerJoin(subValues, eq(diaryNoteSubValueLinks.subValueId, subValues.id))
			.where(eq(diaryNoteSubValueLinks.diaryNoteId, id))
			.limit(1)

		return NextResponse.json({
			success: true,
			note: {
				...updatedNote[0],
				questInstanceId: questLink[0]?.questInstanceId || null,
				questTitle: questLink[0]?.questTitle || null,
				subValueId: valueLink[0]?.subValueId || null,
				relationType: valueLink[0]?.relationType || null,
				subValueName: valueLink[0]?.subValueName || null,
			},
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.issues },
				{ status: 400 }
			)
		}

		console.error('Error updating diary note:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await params

		// Verify note belongs to user
		const existingNote = await db
			.select()
			.from(diaryNotes)
			.where(
				and(
					eq(diaryNotes.id, id),
					eq(diaryNotes.userId, session.user.id),
					isNull(diaryNotes.deletedAt)
				)
			)
			.limit(1)

		if (existingNote.length === 0) {
			return NextResponse.json({ error: 'Note not found' }, { status: 404 })
		}

		// Soft delete
		await db
			.update(diaryNotes)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(diaryNotes.id, id))

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting diary note:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
