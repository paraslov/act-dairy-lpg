'use client'

import { Topbar } from '@/components/topbar'
import { KnightOathBanner } from '@/components/home/knight-oath-banner'
import { MilestonesBar } from '@/components/home/milestones-bar'
import { QuestsList } from '@/components/home/quests-list'
import type { Quest } from '@/components/home/quest-card'

const mockQuests: Quest[] = [
	{
		id: '1',
		title: 'Morning Meditation',
		duration: 10,
		difficulty: 'Easy',
		value: 'Health',
		actSkill: 'Present Moment',
		sphere: 'Spirit',
	},
	{
		id: '2',
		title: 'Strength Training',
		duration: 20,
		difficulty: 'Medium',
		value: 'Health',
		actSkill: 'Committed Action',
		sphere: 'Health',
		activity: 'Sport',
	},
	{
		id: '3',
		title: 'Mindful Eating',
		duration: 15,
		difficulty: 'Easy',
		value: 'Health',
		actSkill: 'Acceptance',
		sphere: 'Health',
		activity: 'Nutrition',
	},
]

export default function Home() {
	const handleQuestStart = (id: string) => {
		console.log('Start quest:', id)
	}

	const handleQuestEdit = (id: string) => {
		console.log('Edit quest:', id)
	}

	const handleQuestSwap = (id: string) => {
		console.log('Swap quest:', id)
	}

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<Topbar />
			<main className="container mx-auto flex-1 px-6 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">
						Home · Default Project
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						View your daily quests and track your progress
					</p>
				</div>
				<div className="space-y-6">
					<KnightOathBanner />
					<MilestonesBar currentProgress={45} />
					<QuestsList
						quests={mockQuests}
						onStart={handleQuestStart}
						onEdit={handleQuestEdit}
						onSwap={handleQuestSwap}
					/>
				</div>
			</main>
		</div>
	)
}
