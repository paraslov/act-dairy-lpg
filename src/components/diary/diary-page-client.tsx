'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Topbar } from '@/components/topbar'
import { DayEntryTab } from './day-entry-tab'
import { HistoryTab } from './history-tab'

export function DiaryPageClient() {
	const [activeTab, setActiveTab] = useState('day-entry')

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<Topbar />
			<main className="container mx-auto flex-1 px-6 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">Diary</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Write daily entries and track your progress
					</p>
				</div>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full max-w-md grid-cols-2">
						<TabsTrigger value="day-entry">Day Entry</TabsTrigger>
						<TabsTrigger value="history">History</TabsTrigger>
					</TabsList>
					<TabsContent value="day-entry" className="mt-6">
						<DayEntryTab />
					</TabsContent>
					<TabsContent value="history" className="mt-6">
						<HistoryTab />
					</TabsContent>
				</Tabs>
			</main>
		</div>
	)
}

