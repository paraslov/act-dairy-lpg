'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DiaryNoteCard } from './diary-note-card'
import { DiaryNoteEditor } from './diary-note-editor'
import { Plus } from 'lucide-react'

interface DiaryNote {
	id: string
	content: string
	timeOfDay: string | null
	moveType: 'TOWARD' | 'AWAY' | null
	questInstanceId: string | null
	questTitle: string | null
	subValueId: string | null
	relationType: 'ALIGNED' | 'VIOLATED' | null
	subValueName: string | null
	createdAt: string
	updatedAt: string
}

export function DayEntryTab() {
	const [selectedDate, setSelectedDate] = useState(() => {
		// Default to today in YYYY-MM-DD format
		const today = new Date()
		return today.toISOString().split('T')[0]
	})
	const [notes, setNotes] = useState<DiaryNote[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isCreating, setIsCreating] = useState(false)

	const fetchNotes = useCallback(async () => {
		setIsLoading(true)
		try {
			const response = await fetch(`/api/diary/notes?date=${selectedDate}`)
			if (response.ok) {
				const data = await response.json()
				setNotes(data.notes || [])
			}
		} catch (error) {
			console.error('Error fetching notes:', error)
		} finally {
			setIsLoading(false)
		}
	}, [selectedDate])

	useEffect(() => {
		fetchNotes()
	}, [fetchNotes])

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSelectedDate(e.target.value)
		setIsCreating(false)
	}

	const handleCreateSuccess = () => {
		setIsCreating(false)
		fetchNotes()
	}

	const handleUpdateSuccess = () => {
		fetchNotes()
	}

	const handleDeleteSuccess = () => {
		fetchNotes()
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<div>
					<label htmlFor="date-selector" className="text-sm font-medium">
						Date
					</label>
					<Input
						id="date-selector"
						type="date"
						value={selectedDate}
						onChange={handleDateChange}
						className="mt-2 w-auto"
					/>
				</div>
				{!isCreating && (
					<Button
						onClick={() => setIsCreating(true)}
						className="mt-8"
						size="sm"
					>
						<Plus className="mr-2 h-4 w-4" />
						Add Note
					</Button>
				)}
			</div>

			{isCreating && (
				<DiaryNoteEditor
					date={selectedDate}
					onSave={handleCreateSuccess}
					onCancel={() => setIsCreating(false)}
				/>
			)}

			{isLoading ? (
				<div className="text-muted-foreground text-sm">Loading notes...</div>
			) : notes.length === 0 ? (
				<div className="text-muted-foreground text-sm">
					No notes for this date. Click &quot;Add Note&quot; to create one.
				</div>
			) : (
				<div className="space-y-4">
					{notes.map(note => (
						<DiaryNoteCard
							key={note.id}
							note={note}
							date={selectedDate}
							onUpdate={handleUpdateSuccess}
							onDelete={handleDeleteSuccess}
						/>
					))}
				</div>
			)}
		</div>
	)
}
