'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { KnightOathModal } from './knight-oath-modal'

export function KnightOathBanner() {
	const [selectedValue, setSelectedValue] = useState('Health')
	const [selectedSubValue, setSelectedSubValue] = useState('')
	const [isModalOpen, setIsModalOpen] = useState(false)

	const handleValueChange = (value: string, subValue: string) => {
		setSelectedValue(value)
		setSelectedSubValue(subValue)
	}

	const displayValue = selectedSubValue
		? `${selectedValue} - ${selectedSubValue}`
		: selectedValue

	return (
		<>
			<Card
				className="cursor-pointer border transition-colors hover:bg-accent/50"
				onClick={() => setIsModalOpen(true)}
			>
				<CardContent className="flex items-center gap-3 p-4">
					<Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
					<div className="flex-1">
						<p className="text-xs text-muted-foreground">
							Today I ride under the banner of
						</p>
						<p className="mt-0.5 text-sm font-medium">{displayValue}</p>
					</div>
				</CardContent>
			</Card>
			<KnightOathModal
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				selectedValue={selectedValue}
				selectedSubValue={selectedSubValue}
				onValueChange={handleValueChange}
			/>
		</>
	)
}

