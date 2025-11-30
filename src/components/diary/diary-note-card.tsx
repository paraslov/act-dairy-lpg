'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DiaryNoteEditor } from './diary-note-editor'
import { Pencil, Trash2 } from 'lucide-react'

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
	date?: string
}

interface DiaryNoteCardProps {
	note: DiaryNote
	date: string
	onUpdate: () => void
	onDelete: () => void
}

export function DiaryNoteCard({
	note,
	date,
	onUpdate,
	onDelete,
}: DiaryNoteCardProps) {
	const [isEditing, setIsEditing] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)

	const handleDelete = async () => {
		if (!confirm('Are you sure you want to delete this note?')) {
			return
		}

		setIsDeleting(true)
		try {
			const response = await fetch(`/api/diary/notes/${note.id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				throw new Error('Failed to delete note')
			}

			onDelete()
		} catch (error) {
			console.error('Error deleting note:', error)
			alert('Failed to delete note')
		} finally {
			setIsDeleting(false)
		}
	}

	const formatTime = (time: string | null) => {
		if (!time) return null
		// Convert HH:MM:SS to HH:MM
		return time.slice(0, 5)
	}

	if (isEditing) {
		return (
			<DiaryNoteEditor
				note={note}
				date={date}
				onSave={() => {
					setIsEditing(false)
					onUpdate()
				}}
				onCancel={() => setIsEditing(false)}
			/>
		)
	}

	return (
		<div className="rounded-lg border p-4 space-y-3">
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 space-y-2">
					{note.timeOfDay && (
						<div className="text-xs text-muted-foreground">
							{formatTime(note.timeOfDay)}
						</div>
					)}
					<div className="text-sm whitespace-pre-wrap">{note.content}</div>
					<div className="flex flex-wrap gap-2">
						{note.questTitle && (
							<Badge variant="secondary">{note.questTitle}</Badge>
						)}
						{note.subValueName && note.relationType && (
							<Badge
								variant={
									note.relationType === 'ALIGNED' ? 'default' : 'destructive'
								}
							>
								{note.subValueName} — {note.relationType.toLowerCase()}
							</Badge>
						)}
						{note.moveType && (
							<Badge
								variant={note.moveType === 'TOWARD' ? 'default' : 'outline'}
							>
								{note.moveType === 'TOWARD' ? 'Toward' : 'Away'} Move
							</Badge>
						)}
					</div>
				</div>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsEditing(true)}
						className="h-8 w-8"
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleDelete}
						disabled={isDeleting}
						className="h-8 w-8 text-destructive hover:text-destructive"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
