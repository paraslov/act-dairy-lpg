'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Edit, ArrowLeftRight, ChevronDown, ChevronUp } from 'lucide-react'

export interface Quest {
	id: string
	title: string
	duration: number
	difficulty: 'Easy' | 'Medium' | 'Hard'
	value: string
	actSkill: string
	sphere: string
	activity?: string
}

interface QuestCardProps {
	quest: Quest
	onStart?: (id: string) => void
	onEdit?: (id: string) => void
	onSwap?: (id: string) => void
}

const difficultyColors = {
	Easy: 'bg-green-500/10 text-green-700 dark:text-green-400',
	Medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
	Hard: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

export function QuestCard({ quest, onStart, onEdit, onSwap }: QuestCardProps) {
	const [isExpanded, setIsExpanded] = useState(false)

	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 space-y-3">
					<div className="flex items-start justify-between gap-4">
						<div className="flex-1">
							<h4 className="text-sm font-medium">{quest.title}</h4>
							<div className="mt-2 flex flex-wrap items-center gap-2">
								<Badge
									variant="outline"
									className="text-xs font-normal"
								>
									{quest.duration} min
								</Badge>
								<Badge
									variant="outline"
									className={`text-xs font-normal ${difficultyColors[quest.difficulty]}`}
								>
									{quest.difficulty}
								</Badge>
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsExpanded(!isExpanded)}
							className="h-7 w-7 shrink-0"
						>
							{isExpanded ? (
								<ChevronUp className="h-3.5 w-3.5" />
							) : (
								<ChevronDown className="h-3.5 w-3.5" />
							)}
						</Button>
					</div>
					{isExpanded && (
						<div className="flex flex-wrap gap-2 pt-2">
							<Badge
								variant="secondary"
								className="text-xs font-normal"
							>
								Value: {quest.value}
							</Badge>
							<Badge
								variant="secondary"
								className="text-xs font-normal"
							>
								ACT: {quest.actSkill}
							</Badge>
							<Badge
								variant="secondary"
								className="text-xs font-normal"
							>
								Sphere: {quest.sphere}
							</Badge>
							{quest.activity && (
								<Badge
									variant="secondary"
									className="text-xs font-normal"
								>
									Activity: {quest.activity}
								</Badge>
							)}
						</div>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						size="sm"
						onClick={() => onStart?.(quest.id)}
						className="h-8 gap-1.5 text-xs"
					>
						<Play className="h-3.5 w-3.5" />
						Start
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => onEdit?.(quest.id)}
						className="h-8 w-8 p-0"
					>
						<Edit className="h-3.5 w-3.5" />
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onClick={() => onSwap?.(quest.id)}
						className="h-8 w-8 p-0"
					>
						<ArrowLeftRight className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>
		</div>
	)
}

