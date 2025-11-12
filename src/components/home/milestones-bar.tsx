'use client'

import { Package } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface MilestonesBarProps {
	currentProgress?: number
}

const milestones = [0, 30, 60, 90, 110]

export function MilestonesBar({ currentProgress = 45 }: MilestonesBarProps) {
	const progressPercentage = Math.min(Math.max(currentProgress, 0), 110)

	return (
		<Card className="border">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium">Milestones</h3>
					<span className="text-sm text-muted-foreground">
						{currentProgress}%
					</span>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="h-2 w-full rounded-full bg-muted">
					<div
						className="h-2 rounded-full bg-primary transition-all"
						style={{ width: `${progressPercentage}%` }}
					/>
				</div>
				<div className="flex justify-between">
					{milestones.map((milestone) => {
						const isReached = progressPercentage >= milestone
						return (
							<div
								key={milestone}
								className="flex flex-col items-center"
							>
								<Package
									className={`h-4 w-4 ${
										isReached
											? 'text-primary'
											: 'text-muted-foreground'
									}`}
								/>
								<span className="mt-1 text-xs text-muted-foreground">
									{milestone}%
								</span>
							</div>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}

