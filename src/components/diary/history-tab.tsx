'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DiaryNoteCard } from './diary-note-card'

interface QuestInstance {
	id: string
	questDefinitionId: string
	scheduledDate: string
	status: string
	title: string
	description: string | null
}

interface SubValue {
	id: string
	name: string
	description: string | null
}

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
	date: string
}

export function HistoryTab() {
	const [fromDate, setFromDate] = useState(() => {
		// Default to 7 days ago
		const date = new Date()
		date.setDate(date.getDate() - 7)
		return date.toISOString().split('T')[0]
	})
	const [toDate, setToDate] = useState(() => {
		// Default to today
		return new Date().toISOString().split('T')[0]
	})
	const [questInstanceId, setQuestInstanceId] = useState<string | null>(null)
	const [subValueId, setSubValueId] = useState<string | null>(null)
	const [moveType, setMoveType] = useState<'TOWARD' | 'AWAY' | null>(null)
	const [questInstances, setQuestInstances] = useState<QuestInstance[]>([])
	const [subValues, setSubValues] = useState<SubValue[]>([])
	const [notes, setNotes] = useState<Record<string, DiaryNote[]>>({})
	const [isLoading, setIsLoading] = useState(false)

	// Fetch reference data
	useEffect(() => {
		async function fetchReferenceData() {
			try {
				const [questsResponse, valuesResponse] = await Promise.all([
					fetch('/api/diary/quests/daily'),
					fetch('/api/diary/sub-values'),
				])

				if (questsResponse.ok) {
					const questsData = await questsResponse.json()
					setQuestInstances(questsData.questInstances || [])
				}

				if (valuesResponse.ok) {
					const valuesData = await valuesResponse.json()
					setSubValues(valuesData.subValues || [])
				}
			} catch (error) {
				console.error('Error fetching reference data:', error)
			}
		}

		fetchReferenceData()
	}, [])

	// Fetch filtered notes
	const fetchNotes = useCallback(async () => {
		setIsLoading(true)
		try {
			const params = new URLSearchParams({
				fromDate,
				toDate,
			})

			if (questInstanceId) {
				params.append('questInstanceId', questInstanceId)
			}
			if (subValueId) {
				params.append('subValueId', subValueId)
			}
			if (moveType) {
				params.append('moveType', moveType)
			}

			const response = await fetch(`/api/diary/history?${params.toString()}`)
			if (response.ok) {
				const data = await response.json()
				setNotes(data.notes || {})
			}
		} catch (error) {
			console.error('Error fetching history:', error)
		} finally {
			setIsLoading(false)
		}
	}, [fromDate, toDate, questInstanceId, subValueId, moveType])

	useEffect(() => {
		fetchNotes()
	}, [fetchNotes])

	const handleUpdateSuccess = () => {
		fetchNotes()
	}

	const handleDeleteSuccess = () => {
		fetchNotes()
	}

	const sortedDates = Object.keys(notes).sort((a, b) => b.localeCompare(a))

	return (
		<div className="space-y-6">
			<div className="space-y-4 rounded-lg border p-4">
				<h3 className="text-lg font-semibold">Filters</h3>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label htmlFor="from-date">From Date</Label>
						<Input
							id="from-date"
							type="date"
							value={fromDate}
							onChange={e => setFromDate(e.target.value)}
							className="mt-2"
						/>
					</div>
					<div>
						<Label htmlFor="to-date">To Date</Label>
						<Input
							id="to-date"
							type="date"
							value={toDate}
							onChange={e => setToDate(e.target.value)}
							className="mt-2"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<Label htmlFor="quest-filter">Quest</Label>
						<Select
							value={questInstanceId || '__all__'}
							onValueChange={val =>
								setQuestInstanceId(val === '__all__' ? null : val)
							}
						>
							<SelectTrigger id="quest-filter" className="mt-2">
								<SelectValue placeholder="All quests" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">All quests</SelectItem>
								{questInstances.map(quest => (
									<SelectItem key={quest.id} value={quest.id}>
										{quest.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="value-filter">Value</Label>
						<Select
							value={subValueId || '__all__'}
							onValueChange={val =>
								setSubValueId(val === '__all__' ? null : val)
							}
						>
							<SelectTrigger id="value-filter" className="mt-2">
								<SelectValue placeholder="All values" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">All values</SelectItem>
								{subValues.map(subValue => (
									<SelectItem key={subValue.id} value={subValue.id}>
										{subValue.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="move-type-filter">Move Type</Label>
						<Select
							value={moveType || '__all__'}
							onValueChange={val =>
								setMoveType(
									val === '__all__' ? null : (val as 'TOWARD' | 'AWAY')
								)
							}
						>
							<SelectTrigger id="move-type-filter" className="mt-2">
								<SelectValue placeholder="All moves" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__all__">All moves</SelectItem>
								<SelectItem value="TOWARD">Toward moves only</SelectItem>
								<SelectItem value="AWAY">Away moves only</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="text-muted-foreground text-sm">Loading history...</div>
			) : sortedDates.length === 0 ? (
				<div className="text-muted-foreground text-sm">
					No notes found for the selected filters.
				</div>
			) : (
				<div className="space-y-6">
					{sortedDates.map(date => (
						<div key={date} className="space-y-4">
							<h4 className="border-b pb-2 text-lg font-semibold">
								{new Date(date).toLocaleDateString('en-US', {
									weekday: 'long',
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</h4>
							<div className="space-y-4">
								{notes[date].map(note => (
									<DiaryNoteCard
										key={note.id}
										note={note}
										date={date}
										onUpdate={handleUpdateSuccess}
										onDelete={handleDeleteSuccess}
									/>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}
