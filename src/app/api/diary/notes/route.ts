import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
	diaryDays,
	diaryNotes,
	diaryNoteQuestInstanceLinks,
	diaryNoteSubValueLinks,
	questInstances,
	questDefinitions,
	subValues,
} from '@/lib/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

const createNoteSchema = z.object({
	content: z.string().min(1, 'Content is required'),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
	timeOfDay: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be in HH:MM:SS format').optional().nullable(),
	questInstanceId: z.string().optional().nullable(),
	subValueId: z.string().optional().nullable(),
	relationType: z.enum(['ALIGNED', 'VIOLATED']).optional().nullable(),
	moveType: z.enum(['TOWARD', 'AWAY']).optional().nullable(),
})

export async function GET(request: Request) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const date = searchParams.get('date')

		if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return NextResponse.json(
				{ error: 'Valid date parameter (YYYY-MM-DD) is required' },
				{ status: 400 }
			)
		}

		// Get or create diary day
		let diaryDay = await db
			.select()
			.from(diaryDays)
			.where(and(eq(diaryDays.userId, session.user.id), eq(diaryDays.date, date)))
			.limit(1)

		if (diaryDay.length === 0) {
			// Create diary day if it doesn't exist
			const newDiaryDayId = crypto.randomUUID()
			await db.insert(diaryDays).values({
				id: newDiaryDayId,
				userId: session.user.id,
				date,
			})
			diaryDay = await db
				.select()
				.from(diaryDays)
				.where(eq(diaryDays.id, newDiaryDayId))
				.limit(1)
		}

		const diaryDayId = diaryDay[0].id

		// Get all notes for this day (not deleted)
		const notes = await db
			.select({
				id: diaryNotes.id,
				content: diaryNotes.content,
				timeOfDay: diaryNotes.timeOfDay,
				moveType: diaryNotes.moveType,
				createdAt: diaryNotes.createdAt,
				updatedAt: diaryNotes.updatedAt,
			})
			.from(diaryNotes)
			.where(
				and(
					eq(diaryNotes.diaryDayId, diaryDayId),
					eq(diaryNotes.userId, session.user.id),
					isNull(diaryNotes.deletedAt)
				)
			)
			.orderBy(diaryNotes.timeOfDay, diaryNotes.createdAt)

		// Sort notes: by timeOfDay if present, then by createdAt
		notes.sort((a, b) => {
			if (a.timeOfDay && b.timeOfDay) {
				return a.timeOfDay.localeCompare(b.timeOfDay)
			}
			if (a.timeOfDay) return -1
			if (b.timeOfDay) return 1
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		})

		// Get quest instance links with quest definition title
		const questLinks =
			notes.length > 0
				? await db
						.select({
							diaryNoteId: diaryNoteQuestInstanceLinks.diaryNoteId,
							questInstanceId: diaryNoteQuestInstanceLinks.questInstanceId,
							questTitle: questDefinitions.title,
						})
						.from(diaryNoteQuestInstanceLinks)
						.innerJoin(
							questInstances,
							eq(
								diaryNoteQuestInstanceLinks.questInstanceId,
								questInstances.id
							)
						)
						.innerJoin(
							questDefinitions,
							eq(questInstances.questDefinitionId, questDefinitions.id)
						)
						.where(
							inArray(
								diaryNoteQuestInstanceLinks.diaryNoteId,
								notes.map((n) => n.id)
							)
						)
				: []

		// Get sub-value links
		const valueLinks =
			notes.length > 0
				? await db
						.select({
							diaryNoteId: diaryNoteSubValueLinks.diaryNoteId,
							subValueId: diaryNoteSubValueLinks.subValueId,
							relationType: diaryNoteSubValueLinks.relationType,
							subValueName: subValues.name,
						})
						.from(diaryNoteSubValueLinks)
						.innerJoin(
							subValues,
							eq(diaryNoteSubValueLinks.subValueId, subValues.id)
						)
						.where(
							inArray(
								diaryNoteSubValueLinks.diaryNoteId,
								notes.map((n) => n.id)
							)
						)
				: []

		// Combine notes with attachments
		const notesWithAttachments = notes.map((note) => {
			const questLink = questLinks.find((link) => link.diaryNoteId === note.id)
			const valueLink = valueLinks.find((link) => link.diaryNoteId === note.id)

			return {
				...note,
				questInstanceId: questLink?.questInstanceId || null,
				questTitle: questLink?.questTitle || null,
				subValueId: valueLink?.subValueId || null,
				relationType: valueLink?.relationType || null,
				subValueName: valueLink?.subValueName || null,
			}
		})

		return NextResponse.json({ notes: notesWithAttachments })
	} catch (error) {
		console.error('Error fetching diary notes:', error)
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
		const validatedData = createNoteSchema.parse(body)

		// Get or create diary day
		let diaryDay = await db
			.select()
			.from(diaryDays)
			.where(
				and(
					eq(diaryDays.userId, session.user.id),
					eq(diaryDays.date, validatedData.date)
				)
			)
			.limit(1)

		if (diaryDay.length === 0) {
			const newDiaryDayId = crypto.randomUUID()
			await db.insert(diaryDays).values({
				id: newDiaryDayId,
				userId: session.user.id,
				date: validatedData.date,
			})
			diaryDay = await db
				.select()
				.from(diaryDays)
				.where(eq(diaryDays.id, newDiaryDayId))
				.limit(1)
		}

		const diaryDayId = diaryDay[0].id
		const noteId = crypto.randomUUID()

		// Create the note
		await db.insert(diaryNotes).values({
			id: noteId,
			diaryDayId,
			userId: session.user.id,
			content: validatedData.content,
			timeOfDay: validatedData.timeOfDay || null,
			moveType: validatedData.moveType || null,
		})

		// Create quest instance link if provided
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
					diaryNoteId: noteId,
					questInstanceId: validatedData.questInstanceId,
				})
			}
		}

		// Create sub-value link if provided
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
					diaryNoteId: noteId,
					subValueId: validatedData.subValueId,
					relationType: validatedData.relationType,
				})
			}
		}

		// Fetch the created note with attachments
		const createdNote = await db
			.select()
			.from(diaryNotes)
			.where(eq(diaryNotes.id, noteId))
			.limit(1)

		if (createdNote.length === 0) {
			return NextResponse.json(
				{ error: 'Failed to create note' },
				{ status: 500 }
			)
		}

		// Get attachments
		const questLink = validatedData.questInstanceId
			? await db
					.select({
						questInstanceId: diaryNoteQuestInstanceLinks.questInstanceId,
						questTitle: questDefinitions.title,
					})
					.from(diaryNoteQuestInstanceLinks)
					.innerJoin(
						questInstances,
						eq(
							diaryNoteQuestInstanceLinks.questInstanceId,
							questInstances.id
						)
					)
					.innerJoin(
						questDefinitions,
						eq(questInstances.questDefinitionId, questDefinitions.id)
					)
					.where(eq(diaryNoteQuestInstanceLinks.diaryNoteId, noteId))
					.limit(1)
			: []

		const valueLink =
			validatedData.subValueId && validatedData.relationType
				? await db
						.select({
							subValueId: diaryNoteSubValueLinks.subValueId,
							relationType: diaryNoteSubValueLinks.relationType,
							subValueName: subValues.name,
						})
						.from(diaryNoteSubValueLinks)
						.innerJoin(
							subValues,
							eq(diaryNoteSubValueLinks.subValueId, subValues.id)
						)
						.where(eq(diaryNoteSubValueLinks.diaryNoteId, noteId))
						.limit(1)
				: []

		return NextResponse.json({
			success: true,
			note: {
				...createdNote[0],
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

		console.error('Error creating diary note:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

