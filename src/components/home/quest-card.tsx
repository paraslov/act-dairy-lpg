'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Clock } from 'lucide-react'

export interface Quest {
	id: string
	questDefinitionId: string
	title: string
	description: string | null
	difficulty: 'EASY' | 'MEDIUM' | 'HARD'
	direction: 'TOWARD' | 'AWAY'
	duration: number | null
	status: string
	subValues: Array<{ subValueId: string; subValueName: string }>
}

interface QuestCardProps {
	quest: Quest
	onComplete?: (id: string) => void
}

const difficultyLabels = {
	EASY: 'Easy',
	MEDIUM: 'Medium',
	HARD: 'Hard',
}

const difficultyColors = {
	EASY: 'bg-green-500/10 text-green-700 dark:text-green-400',
	MEDIUM: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
	HARD: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export function QuestCard({ quest, onComplete }: QuestCardProps) {
	const isCompleted = quest.status === 'COMPLETED'

	return (
		<div
			className={`rounded-lg border p-4 ${
				isCompleted
					? 'border-green-500/30 bg-green-500/5'
					: 'border-border bg-card'
			}`}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 space-y-2">
					<h4
						className={`text-sm font-medium ${
							isCompleted ? 'text-muted-foreground line-through' : ''
						}`}
					>
						{quest.title}
					</h4>
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant="outline"
							className={`text-xs font-normal ${difficultyColors[quest.difficulty]}`}
						>
							{difficultyLabels[quest.difficulty]}
						</Badge>
						{quest.duration && (
							<Badge variant="outline" className="text-xs font-normal">
								<Clock className="mr-1 h-3 w-3" />
								{quest.duration} min
							</Badge>
						)}
						<Badge variant="outline" className="text-xs font-normal">
							{quest.direction === 'TOWARD' ? 'Toward' : 'Away'}
						</Badge>
					</div>
					{quest.subValues.length > 0 && (
						<div className="flex flex-wrap gap-1">
							{quest.subValues.map(sv => (
								<Badge
									key={sv.subValueId}
									variant="secondary"
									className="text-xs font-normal"
								>
									{sv.subValueName}
								</Badge>
							))}
						</div>
					)}
				</div>
				<div className="shrink-0">
					{isCompleted ? (
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
							<Check className="h-4 w-4 text-green-600 dark:text-green-400" />
						</div>
					) : (
						<Button
							size="sm"
							onClick={() => onComplete?.(quest.id)}
							className="h-8 text-xs"
						>
							Complete
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
