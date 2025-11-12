'use client'

import { QuestCard, type Quest } from './quest-card'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface QuestsListProps {
	quests: Quest[]
	onStart?: (id: string) => void
	onEdit?: (id: string) => void
	onSwap?: (id: string) => void
}

export function QuestsList({
	quests,
	onStart,
	onEdit,
	onSwap,
}: QuestsListProps) {
	return (
		<Card className="border">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium">Today&apos;s Quests</h3>
					<Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
						<Plus className="h-3.5 w-3.5" />
						Add Quest
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{quests.length === 0 ? (
					<div className="rounded-lg border border-dashed p-8 text-center">
						<p className="text-sm text-muted-foreground">
							No quests selected for today. Add some quests to get started!
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{quests.map((quest) => (
							<QuestCard
								key={quest.id}
								quest={quest}
								onStart={onStart}
								onEdit={onEdit}
								onSwap={onSwap}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}

