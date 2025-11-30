'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface MoveTypeSelectorProps {
	value?: 'TOWARD' | 'AWAY' | null
	onValueChange: (value: 'TOWARD' | 'AWAY' | null) => void
	className?: string
}

export function MoveTypeSelector({
	value,
	onValueChange,
	className,
}: MoveTypeSelectorProps) {
	return (
		<div className={className}>
			<Label>Move Type (optional)</Label>
			<RadioGroup
				value={value || ''}
				onValueChange={(val) =>
					onValueChange((val as 'TOWARD' | 'AWAY') || null)
				}
				className="mt-2"
			>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="" id="none" />
					<Label htmlFor="none" className="font-normal cursor-pointer">
						None
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="TOWARD" id="toward" />
					<Label htmlFor="toward" className="font-normal cursor-pointer">
						Toward Move
					</Label>
				</div>
				<div className="flex items-center space-x-2">
					<RadioGroupItem value="AWAY" id="away" />
					<Label htmlFor="away" className="font-normal cursor-pointer">
						Away Move
					</Label>
				</div>
			</RadioGroup>
		</div>
	)
}
