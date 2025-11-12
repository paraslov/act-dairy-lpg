'use client'

import { useState } from 'react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface KnightOathModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	selectedValue: string
	selectedSubValue: string
	onValueChange: (value: string, subValue: string) => void
}

const valueSubValues: Record<string, string[]> = {
	Health: ['Fitness', 'Nutrition', 'Sleep', 'Mental Health'],
	Love: ['Family', 'Friends', 'Romance', 'Community'],
	Work: ['Career', 'Skills', 'Projects', 'Growth'],
	Play: ['Hobbies', 'Entertainment', 'Creativity', 'Adventure'],
}

export function KnightOathModal({
	open,
	onOpenChange,
	selectedValue,
	selectedSubValue,
	onValueChange,
}: KnightOathModalProps) {
	const [tempValue, setTempValue] = useState(selectedValue)
	const [tempSubValue, setTempSubValue] = useState(selectedSubValue)

	const handleConfirm = () => {
		onValueChange(tempValue, tempSubValue)
		onOpenChange(false)
	}

	const availableSubValues = valueSubValues[tempValue] || []

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Choose Your Banner</DialogTitle>
					<DialogDescription>
						Select the value you will ride under today
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-6 py-4">
					<div className="space-y-3">
						<Label>Main Value</Label>
						<RadioGroup
							value={tempValue}
							onValueChange={(value) => {
								setTempValue(value)
								setTempSubValue('')
							}}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="Health" id="health" />
								<Label htmlFor="health" className="cursor-pointer">
									Health
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="Love" id="love" />
								<Label htmlFor="love" className="cursor-pointer">
									Love
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="Work" id="work" />
								<Label htmlFor="work" className="cursor-pointer">
									Work
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="Play" id="play" />
								<Label htmlFor="play" className="cursor-pointer">
									Play
								</Label>
							</div>
						</RadioGroup>
					</div>
					{availableSubValues.length > 0 && (
						<div className="space-y-3">
							<Label>Sub-Value (Optional)</Label>
							<Select
								value={tempSubValue}
								onValueChange={setTempSubValue}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a sub-value" />
								</SelectTrigger>
								<SelectContent>
									{availableSubValues.map((subValue) => (
										<SelectItem key={subValue} value={subValue}>
											{subValue}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleConfirm}>Confirm</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

