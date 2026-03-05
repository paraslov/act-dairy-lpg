'use client'

import { Topbar } from '@/components/topbar'
import { KnightOathBanner } from '@/components/home/knight-oath-banner'
import { MilestonesBar } from '@/components/home/milestones-bar'
import { QuestsList } from '@/components/home/quests-list'
import { CreateQuestDialog } from '@/components/home/create-quest-dialog'
import type { Quest } from '@/components/home/quest-card'
import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState, useCallback } from 'react'
import type { Rank } from '@/lib/balance/rank-utils'

interface UserProgressData {
	pathLevel: number
	shadowPathLevel: number
	globalXp: number
	globalShadowXp: number
	integrityRating: number
	coreValues: Array<{
		id: string
		name: string
		lightXp: number
		lightRank: Rank
		shadowXp: number
		shadowRank: Rank
	}>
	dailyProgress: {
		date: string
		totalQuests: number
		completedQuests: number
		progressPercent: number
	}
}

function formatRank(rank: Rank): string {
	if (typeof rank === 'string') {
		return rank
	}
	return `Enlightenment ${rank.level}`
}

export default function Home() {
	const { user, isLoading } = useAuth()
	const [progress, setProgress] = useState<UserProgressData | null>(null)
	const [progressLoading, setProgressLoading] = useState(true)
	const [quests, setQuests] = useState<Quest[]>([])
	const [questsLoading, setQuestsLoading] = useState(true)
	const [showCreateDialog, setShowCreateDialog] = useState(false)

	const today = new Date().toISOString().split('T')[0]

	const fetchProgress = useCallback(async () => {
		try {
			const response = await fetch('/api/user/progress')
			if (response.ok) {
				const data = await response.json()
				setProgress(data)
			}
		} catch (error) {
			console.error('Failed to fetch progress:', error)
		} finally {
			setProgressLoading(false)
		}
	}, [])

	const fetchQuests = useCallback(async () => {
		try {
			const response = await fetch(`/api/quests/daily?date=${today}`)
			if (response.ok) {
				const data = await response.json()
				setQuests(
					data.questInstances.map(
						(inst: Record<string, unknown>) => ({
							id: inst.id,
							questDefinitionId: inst.questDefinitionId,
							title: inst.title,
							description: inst.description,
							difficulty: inst.difficulty,
							direction: inst.direction,
							duration: inst.duration,
							status: inst.status,
							subValues: inst.subValues ?? [],
						})
					)
				)
			}
		} catch (error) {
			console.error('Failed to fetch quests:', error)
		} finally {
			setQuestsLoading(false)
		}
	}, [today])

	useEffect(() => {
		if (user && !isLoading) {
			fetchProgress()
			fetchQuests()
		}
	}, [user, isLoading, fetchProgress, fetchQuests])

	async function handleComplete(id: string) {
		try {
			const response = await fetch(`/api/quests/${id}/complete`, {
				method: 'POST',
			})
			if (response.ok) {
				fetchQuests()
				fetchProgress()
			}
		} catch (error) {
			console.error('Failed to complete quest:', error)
		}
	}

	function handleQuestCreated() {
		fetchQuests()
		fetchProgress()
	}

	const displayName = isLoading
		? 'Loading...'
		: user?.name || 'Default Project'

	const dailyPercent = progress?.dailyProgress?.progressPercent ?? 0

	return (
		<div className="bg-background flex min-h-screen flex-col">
			<Topbar />
			<main className="container mx-auto flex-1 px-6 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">
						Home · {displayName}
					</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						View your daily quests and track your progress
					</p>
				</div>
				<div className="space-y-6">
					<KnightOathBanner />

					{progressLoading ? (
						<div className="bg-card rounded-lg border p-6 text-center">
							<p className="text-muted-foreground">
								Loading progress...
							</p>
						</div>
					) : progress ? (
						<>
							<div className="bg-card rounded-lg border p-6">
								<div className="mb-4 flex items-center justify-between">
									<div>
										<h2 className="text-xl font-semibold">
											Path Progress
										</h2>
										<p className="text-muted-foreground text-sm">
											Level {progress.pathLevel} ·{' '}
											{progress.globalXp} XP
										</p>
									</div>
									<div className="text-right">
										<div className="text-2xl font-bold">
											{Math.round(progress.integrityRating)}
										</div>
										<p className="text-muted-foreground text-xs">
											Integrity Rating
										</p>
									</div>
								</div>
								<MilestonesBar currentProgress={dailyPercent} />
							</div>

							<div className="bg-card rounded-lg border p-6">
								<h2 className="mb-4 text-xl font-semibold">
									Core Values
								</h2>
								<div className="grid gap-4 sm:grid-cols-2">
									{progress.coreValues.map(cv => (
										<div
											key={cv.id}
											className="bg-muted/50 rounded-lg border p-4"
										>
											<div className="mb-2 font-medium">
												{cv.name}
											</div>
											<div className="text-muted-foreground space-y-1 text-sm">
												<div className="flex justify-between">
													<span>Light:</span>
													<span className="font-medium">
														{formatRank(cv.lightRank)}
													</span>
												</div>
												<div className="flex justify-between">
													<span>Shadow:</span>
													<span className="font-medium">
														{formatRank(cv.shadowRank)}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</>
					) : (
						<div className="bg-card rounded-lg border p-6">
							<MilestonesBar currentProgress={0} />
						</div>
					)}

					<QuestsList
						quests={quests}
						onComplete={handleComplete}
						onAddQuest={() => setShowCreateDialog(true)}
						isLoading={questsLoading}
					/>
				</div>
			</main>

			<CreateQuestDialog
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
				onCreated={handleQuestCreated}
			/>
		</div>
	)
}
