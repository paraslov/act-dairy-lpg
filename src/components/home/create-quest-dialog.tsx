'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface CreateQuestDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreated: () => void
}

export function CreateQuestDialog({
	open,
	onOpenChange,
	onCreated,
}: CreateQuestDialogProps) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY')
	const [direction, setDirection] = useState<'TOWARD' | 'AWAY'>('TOWARD')
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!title.trim()) return

		setIsSubmitting(true)
		try {
			const response = await fetch('/api/quests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || null,
					difficulty,
					direction,
					recurrencePattern: 'DAILY',
				}),
			})

			if (response.ok) {
				setTitle('')
				setDescription('')
				setDifficulty('EASY')
				setDirection('TOWARD')
				onOpenChange(false)
				onCreated()
			}
		} catch (error) {
			console.error('Failed to create quest:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create Daily Quest</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="quest-title">Title</Label>
						<Input
							id="quest-title"
							value={title}
							onChange={e => setTitle(e.target.value)}
							placeholder="e.g. Morning Meditation"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="quest-description">
							Description (optional)
						</Label>
						<Textarea
							id="quest-description"
							value={description}
							onChange={e => setDescription(e.target.value)}
							placeholder="Describe the quest..."
							rows={3}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Difficulty</Label>
							<Select
								value={difficulty}
								onValueChange={v =>
									setDifficulty(v as 'EASY' | 'MEDIUM' | 'HARD')
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="EASY">Easy</SelectItem>
									<SelectItem value="MEDIUM">Medium</SelectItem>
									<SelectItem value="HARD">Hard</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Direction</Label>
							<Select
								value={direction}
								onValueChange={v =>
									setDirection(v as 'TOWARD' | 'AWAY')
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="TOWARD">Toward</SelectItem>
									<SelectItem value="AWAY">Away</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting || !title.trim()}>
							{isSubmitting ? 'Creating...' : 'Create Quest'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
