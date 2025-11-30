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
import { eq, and, isNull, inArray, gte, lte } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { z } from 'zod'

export async function GET(request: Request) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const fromDate = searchParams.get('fromDate')
		const toDate = searchParams.get('toDate')
		const questInstanceId = searchParams.get('questInstanceId')
		const subValueId = searchParams.get('subValueId')
		const moveType = searchParams.get('moveType')

		// Validate date range
		if (!fromDate || !toDate) {
			return NextResponse.json(
				{ error: 'fromDate and toDate parameters are required' },
				{ status: 400 }
			)
		}

		if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
			return NextResponse.json(
				{ error: 'Dates must be in YYYY-MM-DD format' },
				{ status: 400 }
			)
		}

		// Build query conditions
		const conditions = [
			eq(diaryNotes.userId, session.user.id),
			isNull(diaryNotes.deletedAt),
			gte(diaryDays.date, fromDate),
			lte(diaryDays.date, toDate),
		]

		if (moveType && (moveType === 'TOWARD' || moveType === 'AWAY')) {
			conditions.push(eq(diaryNotes.moveType, moveType))
		}

		// Get diary days in range
		const diaryDaysInRange = await db
			.select({ id: diaryDays.id, date: diaryDays.date })
			.from(diaryDays)
			.where(
				and(
					eq(diaryDays.userId, session.user.id),
					gte(diaryDays.date, fromDate),
					lte(diaryDays.date, toDate)
				)
			)

		if (diaryDaysInRange.length === 0) {
			return NextResponse.json({ notes: [] })
		}

		const diaryDayIds = diaryDaysInRange.map((d) => d.id)

		// Build note query conditions
		const noteConditions = [
			eq(diaryNotes.userId, session.user.id),
			isNull(diaryNotes.deletedAt),
			inArray(diaryNotes.diaryDayId, diaryDayIds),
		]

		if (moveType && (moveType === 'TOWARD' || moveType === 'AWAY')) {
			noteConditions.push(eq(diaryNotes.moveType, moveType))
		}

		// Get notes
		let notes = await db
			.select({
				id: diaryNotes.id,
				diaryDayId: diaryNotes.diaryDayId,
				content: diaryNotes.content,
				timeOfDay: diaryNotes.timeOfDay,
				moveType: diaryNotes.moveType,
				createdAt: diaryNotes.createdAt,
				updatedAt: diaryNotes.updatedAt,
				date: diaryDays.date,
			})
			.from(diaryNotes)
			.innerJoin(diaryDays, eq(diaryNotes.diaryDayId, diaryDays.id))
			.where(and(...noteConditions))

		// Filter by quest instance if provided
		if (questInstanceId) {
			const noteIdsWithQuest = await db
				.select({ diaryNoteId: diaryNoteQuestInstanceLinks.diaryNoteId })
				.from(diaryNoteQuestInstanceLinks)
				.where(eq(diaryNoteQuestInstanceLinks.questInstanceId, questInstanceId))

			const filteredNoteIds = new Set(noteIdsWithQuest.map((n) => n.diaryNoteId))
			notes = notes.filter((note) => filteredNoteIds.has(note.id))
		}

		// Filter by sub-value if provided
		if (subValueId) {
			const noteIdsWithValue = await db
				.select({ diaryNoteId: diaryNoteSubValueLinks.diaryNoteId })
				.from(diaryNoteSubValueLinks)
				.where(eq(diaryNoteSubValueLinks.subValueId, subValueId))

			const filteredNoteIds = new Set(noteIdsWithValue.map((n) => n.diaryNoteId))
			notes = notes.filter((note) => filteredNoteIds.has(note.id))
		}

		// Get all note IDs for fetching attachments
		const noteIds = notes.map((n) => n.id)

		// Get quest instance links
		const questLinks =
			noteIds.length > 0
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
						.where(inArray(diaryNoteQuestInstanceLinks.diaryNoteId, noteIds))
				: []

		// Get sub-value links
		const valueLinks =
			noteIds.length > 0
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
						.where(inArray(diaryNoteSubValueLinks.diaryNoteId, noteIds))
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

		// Sort by date (desc) then time (asc)
		notesWithAttachments.sort((a, b) => {
			const dateCompare = b.date.localeCompare(a.date)
			if (dateCompare !== 0) return dateCompare

			if (a.timeOfDay && b.timeOfDay) {
				return a.timeOfDay.localeCompare(b.timeOfDay)
			}
			if (a.timeOfDay) return -1
			if (b.timeOfDay) return 1
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
		})

		// Group by date
		const groupedByDate: Record<string, typeof notesWithAttachments> = {}
		for (const note of notesWithAttachments) {
			if (!groupedByDate[note.date]) {
				groupedByDate[note.date] = []
			}
			groupedByDate[note.date].push(note)
		}

		return NextResponse.json({ notes: groupedByDate })
	} catch (error) {
		console.error('Error fetching diary history:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

