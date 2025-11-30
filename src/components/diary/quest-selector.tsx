'use client'

import { useEffect, useState } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface QuestInstance {
	id: string
	questDefinitionId: string
	scheduledDate: string
	status: string
	title: string
	description: string | null
}

interface QuestSelectorProps {
	value?: string | null
	onValueChange: (value: string | null) => void
	className?: string
}

export function QuestSelector({
	value,
	onValueChange,
	className,
}: QuestSelectorProps) {
	const [questInstances, setQuestInstances] = useState<QuestInstance[]>([])

	useEffect(() => {
		async function fetchQuestInstances() {
			try {
				const response = await fetch('/api/diary/quests/daily')
				if (response.ok) {
					const data = await response.json()
					setQuestInstances(data.questInstances || [])
				}
			} catch (error) {
				console.error('Error fetching quest instances:', error)
			}
		}

		fetchQuestInstances()
	}, [])

	return (
		<div className={className}>
			<Label htmlFor="quest-selector">Quest (optional)</Label>
			<Select
				value={value || '__none__'}
				onValueChange={val => onValueChange(val === '__none__' ? null : val)}
			>
				<SelectTrigger id="quest-selector">
					<SelectValue placeholder="Select a quest" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="__none__">None</SelectItem>
					{questInstances.map(quest => (
						<SelectItem key={quest.id} value={quest.id}>
							{quest.title}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}
