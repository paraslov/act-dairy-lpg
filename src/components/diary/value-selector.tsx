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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface SubValue {
	id: string
	name: string
	description: string | null
}

interface ValueSelectorProps {
	subValueId?: string | null
	relationType?: 'ALIGNED' | 'VIOLATED' | null
	onSubValueChange: (value: string | null) => void
	onRelationTypeChange: (value: 'ALIGNED' | 'VIOLATED' | null) => void
	className?: string
}

export function ValueSelector({
	subValueId,
	relationType,
	onSubValueChange,
	onRelationTypeChange,
	className,
}: ValueSelectorProps) {
	const [subValues, setSubValues] = useState<SubValue[]>([])

	useEffect(() => {
		async function fetchSubValues() {
			try {
				const response = await fetch('/api/diary/sub-values')
				if (response.ok) {
					const data = await response.json()
					setSubValues(data.subValues || [])
				}
			} catch (error) {
				console.error('Error fetching sub-values:', error)
			}
		}

		fetchSubValues()
	}, [])

	const handleSubValueChange = (value: string) => {
		if (value === '__none__') {
			onSubValueChange(null)
			onRelationTypeChange(null)
		} else {
			onSubValueChange(value)
			// If no relation type is set, default to ALIGNED
			if (!relationType) {
				onRelationTypeChange('ALIGNED')
			}
		}
	}

	return (
		<div className={className}>
			<Label htmlFor="value-selector">Value (optional)</Label>
			<Select
				value={subValueId || '__none__'}
				onValueChange={handleSubValueChange}
			>
				<SelectTrigger id="value-selector">
					<SelectValue placeholder="Select a value" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="__none__">None</SelectItem>
					{subValues.map(subValue => (
						<SelectItem key={subValue.id} value={subValue.id}>
							{subValue.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{subValueId && (
				<div className="mt-3">
					<Label>Relation Type</Label>
					<RadioGroup
						value={relationType || ''}
						onValueChange={val =>
							onRelationTypeChange((val as 'ALIGNED' | 'VIOLATED') || null)
						}
						className="mt-2"
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="ALIGNED" id="aligned" />
							<Label htmlFor="aligned" className="cursor-pointer font-normal">
								Aligned
							</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="VIOLATED" id="violated" />
							<Label htmlFor="violated" className="cursor-pointer font-normal">
								Violated
							</Label>
						</div>
					</RadioGroup>
				</div>
			)}
		</div>
	)
}
