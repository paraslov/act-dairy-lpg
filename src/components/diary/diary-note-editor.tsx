'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { QuestSelector } from './quest-selector'
import { ValueSelector } from './value-selector'
import { MoveTypeSelector } from './move-type-selector'

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

interface DiaryNoteEditorProps {
	note?: DiaryNote | null
	date: string
	onSave: () => void
	onCancel: () => void
}

export function DiaryNoteEditor({
	note,
	date,
	onSave,
	onCancel,
}: DiaryNoteEditorProps) {
	const [content, setContent] = useState('')
	const [timeOfDay, setTimeOfDay] = useState<string>('')
	const [questInstanceId, setQuestInstanceId] = useState<string | null>(null)
	const [subValueId, setSubValueId] = useState<string | null>(null)
	const [relationType, setRelationType] = useState<
		'ALIGNED' | 'VIOLATED' | null
	>(null)
	const [moveType, setMoveType] = useState<'TOWARD' | 'AWAY' | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (note) {
			setContent(note.content)
			setTimeOfDay(note.timeOfDay || '')
			setQuestInstanceId(note.questInstanceId)
			setSubValueId(note.subValueId)
			setRelationType(note.relationType)
			setMoveType(note.moveType)
		} else {
			setContent('')
			setTimeOfDay('')
			setQuestInstanceId(null)
			setSubValueId(null)
			setRelationType(null)
			setMoveType(null)
		}
	}, [note])

	const handleTimeChange = (value: string) => {
		// Convert HH:MM to HH:MM:SS format if needed
		if (value && value.length === 5) {
			setTimeOfDay(`${value}:00`)
		} else {
			setTimeOfDay(value)
		}
	}

	const handleSave = async () => {
		if (!content.trim()) {
			setError('Content is required')
			return
		}

		setIsSaving(true)
		setError(null)

		try {
			const timeValue = timeOfDay.trim() || null

			if (note) {
				// Update existing note
				const response = await fetch(`/api/diary/notes/${note.id}`, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						content,
						timeOfDay: timeValue,
						questInstanceId,
						subValueId,
						relationType,
						moveType,
					}),
				})

				if (!response.ok) {
					const data = await response.json()
					throw new Error(data.error || 'Failed to update note')
				}
			} else {
				// Create new note
				const response = await fetch('/api/diary/notes', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						content,
						date,
						timeOfDay: timeValue,
						questInstanceId,
						subValueId,
						relationType,
						moveType,
					}),
				})

				if (!response.ok) {
					const data = await response.json()
					throw new Error(data.error || 'Failed to create note')
				}
			}

			onSave()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<div className="space-y-4 rounded-lg border p-4">
			<div>
				<Label htmlFor="content">Content *</Label>
				<Textarea
					id="content"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Write your diary entry..."
					className="mt-2 min-h-[120px]"
				/>
			</div>

			<div>
				<Label htmlFor="time">Time (optional)</Label>
				<Input
					id="time"
					type="time"
					value={timeOfDay ? timeOfDay.slice(0, 5) : ''}
					onChange={(e) => handleTimeChange(e.target.value)}
					className="mt-2"
				/>
			</div>

			<QuestSelector
				value={questInstanceId}
				onValueChange={setQuestInstanceId}
			/>

			<ValueSelector
				subValueId={subValueId}
				relationType={relationType}
				onSubValueChange={setSubValueId}
				onRelationTypeChange={setRelationType}
			/>

			<MoveTypeSelector value={moveType} onValueChange={setMoveType} />

			{error && (
				<div className="text-sm text-destructive">{error}</div>
			)}

			<div className="flex justify-end gap-2 pt-2">
				<Button variant="outline" onClick={onCancel} disabled={isSaving}>
					Cancel
				</Button>
				<Button onClick={handleSave} disabled={isSaving}>
					{isSaving ? 'Saving...' : note ? 'Update' : 'Save'}
				</Button>
			</div>
		</div>
	)
}
