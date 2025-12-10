'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { gameBalanceConfigSchema } from '@/lib/balance/schemas'
import type { GameBalanceConfig } from '@/lib/balance/types'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import axios from 'axios'
import { useAuth } from '@/hooks/use-auth'

export function BalanceSettingsForm() {
	const router = useRouter()
	const { isAdmin, isLoading: authLoading } = useAuth()

	// Redirect if not admin
	useEffect(() => {
		if (!authLoading && !isAdmin) {
			router.push('/')
		}
	}, [isAdmin, authLoading, router])
	const [config, setConfig] = useState<GameBalanceConfig | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<GameBalanceConfig>({
		resolver: zodResolver(gameBalanceConfigSchema),
	})

	// Load current configuration
	useEffect(() => {
		const loadConfig = async () => {
			try {
				const response = await axios.get('/api/admin/balance')
				const loadedConfig = response.data.config
				setConfig(loadedConfig)
				reset(loadedConfig)
			} catch (error) {
				console.error('Failed to load config:', error)
				toast.error('Failed to load balance configuration')
			} finally {
				setIsLoading(false)
			}
		}

		loadConfig()
	}, [reset])

	const onSubmit = async (data: GameBalanceConfig) => {
		setIsSaving(true)
		try {
			await axios.put('/api/admin/balance', { config: data })
			setConfig(data)
			toast.success('Balance configuration saved successfully')
		} catch (error: any) {
			console.error('Failed to save config:', error)
			const errorMessage =
				error.response?.data?.error || 'Failed to save balance configuration'
			toast.error(errorMessage)
		} finally {
			setIsSaving(false)
		}
	}

	if (authLoading || isLoading) {
		return <div className="py-8 text-center">Loading configuration...</div>
	}

	if (!isAdmin) {
		return null
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			{/* Personal Value Thresholds */}
			<Card>
				<CardHeader>
					<CardTitle>Personal Value Thresholds</CardTitle>
					<CardDescription>
						XP requirements for each rank in personal values
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
						<div>
							<Label htmlFor="Common">Common</Label>
							<Input
								id="Common"
								type="number"
								{...register('personalValueThresholds.Common', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="Rare">Rare</Label>
							<Input
								id="Rare"
								type="number"
								{...register('personalValueThresholds.Rare', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="Elite">Elite</Label>
							<Input
								id="Elite"
								type="number"
								{...register('personalValueThresholds.Elite', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="Legendary">Legendary</Label>
							<Input
								id="Legendary"
								type="number"
								{...register('personalValueThresholds.Legendary', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="Mythic">Mythic</Label>
							<Input
								id="Mythic"
								type="number"
								{...register('personalValueThresholds.Mythic', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="Ascended">Ascended</Label>
							<Input
								id="Ascended"
								type="number"
								{...register('personalValueThresholds.Ascended', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="AscendedStar1">Ascended ★1</Label>
							<Input
								id="AscendedStar1"
								type="number"
								{...register('personalValueThresholds.AscendedStar1', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="AscendedStar2">Ascended ★2</Label>
							<Input
								id="AscendedStar2"
								type="number"
								{...register('personalValueThresholds.AscendedStar2', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="AscendedStar3">Ascended ★3</Label>
							<Input
								id="AscendedStar3"
								type="number"
								{...register('personalValueThresholds.AscendedStar3', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="AscendedStar4">Ascended ★4</Label>
							<Input
								id="AscendedStar4"
								type="number"
								{...register('personalValueThresholds.AscendedStar4', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="AscendedStar5">Ascended ★5</Label>
							<Input
								id="AscendedStar5"
								type="number"
								{...register('personalValueThresholds.AscendedStar5', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="EnlightenmentBase">Enlightenment Base</Label>
							<Input
								id="EnlightenmentBase"
								type="number"
								{...register('personalValueThresholds.EnlightenmentBase', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="EnlightenmentIncrement">
								Enlightenment Increment
							</Label>
							<Input
								id="EnlightenmentIncrement"
								type="number"
								{...register('personalValueThresholds.EnlightenmentIncrement', {
									valueAsNumber: true,
								})}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Core Value Config */}
			<Card>
				<CardHeader>
					<CardTitle>Core Value Configuration</CardTitle>
					<CardDescription>
						Multiplier for core values relative to personal values
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div>
						<Label htmlFor="coreMultiplier">Core Value Multiplier</Label>
						<Input
							id="coreMultiplier"
							type="number"
							step="0.1"
							{...register('coreValueConfig.multiplier', {
								valueAsNumber: true,
							})}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Path Level Config */}
			<Card>
				<CardHeader>
					<CardTitle>Path Level Configuration</CardTitle>
					<CardDescription>XP required per path level</CardDescription>
				</CardHeader>
				<CardContent>
					<div>
						<Label htmlFor="pathXpPerLevel">XP Per Level</Label>
						<Input
							id="pathXpPerLevel"
							type="number"
							{...register('pathLevelConfig.xpPerLevel', {
								valueAsNumber: true,
							})}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Stats Config */}
			<Card>
				<CardHeader>
					<CardTitle>Stats Configuration</CardTitle>
					<CardDescription>
						XP to stat point conversion and shadow mitigation
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="statXpPerPoint">XP Per Stat Point</Label>
						<Input
							id="statXpPerPoint"
							type="number"
							{...register('statsConfig.xpPerPoint', {
								valueAsNumber: true,
							})}
						/>
					</div>
					<div>
						<Label htmlFor="shadowMitigationFactor">
							Shadow Mitigation Factor (0-1)
						</Label>
						<Input
							id="shadowMitigationFactor"
							type="number"
							step="0.01"
							min="0"
							max="1"
							{...register('statsConfig.shadowMitigationFactor', {
								valueAsNumber: true,
							})}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Integrity Rating Weights */}
			<Card>
				<CardHeader>
					<CardTitle>Integrity Rating Weights</CardTitle>
					<CardDescription>
						Weights for calculating Integrity Rating
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="irPathLevel">Path Level Weight</Label>
							<Input
								id="irPathLevel"
								type="number"
								{...register('integrityWeights.pathLevel', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="irShadowPathLevel">
								Shadow Path Level Penalty
							</Label>
							<Input
								id="irShadowPathLevel"
								type="number"
								{...register('integrityWeights.shadowPathLevel', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="irCoreValueRank">Core Value Rank Weight</Label>
							<Input
								id="irCoreValueRank"
								type="number"
								{...register('integrityWeights.coreValueRank', {
									valueAsNumber: true,
								})}
							/>
						</div>
						<div>
							<Label htmlFor="irStatPoint">Stat Point Weight</Label>
							<Input
								id="irStatPoint"
								type="number"
								step="0.1"
								{...register('integrityWeights.statPoint', {
									valueAsNumber: true,
								})}
							/>
						</div>
					</div>

					<div className="mt-4">
						<Label className="mb-2 block">Rank Point Map</Label>
						<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
							<div>
								<Label htmlFor="rankCommon" className="text-xs">
									Common
								</Label>
								<Input
									id="rankCommon"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.Common', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankRare" className="text-xs">
									Rare
								</Label>
								<Input
									id="rankRare"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.Rare', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankElite" className="text-xs">
									Elite
								</Label>
								<Input
									id="rankElite"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.Elite', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankLegendary" className="text-xs">
									Legendary
								</Label>
								<Input
									id="rankLegendary"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.Legendary', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankMythic" className="text-xs">
									Mythic
								</Label>
								<Input
									id="rankMythic"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.Mythic', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankAscended" className="text-xs">
									Ascended
								</Label>
								<Input
									id="rankAscended"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.Ascended', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankAscendedStar" className="text-xs">
									Ascended Star
								</Label>
								<Input
									id="rankAscendedStar"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.AscendedStar', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankEnlightenment" className="text-xs">
									Enlightenment
								</Label>
								<Input
									id="rankEnlightenment"
									type="number"
									step="0.1"
									{...register('integrityWeights.rankPointMap.Enlightenment', {
										valueAsNumber: true,
									})}
								/>
							</div>
							<div>
								<Label htmlFor="rankEnlightenmentIncrement" className="text-xs">
									Enlightenment Increment
								</Label>
								<Input
									id="rankEnlightenmentIncrement"
									type="number"
									step="0.1"
									{...register(
										'integrityWeights.rankPointMap.EnlightenmentIncrement',
										{
											valueAsNumber: true,
										}
									)}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end gap-4">
				<Button type="submit" disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Configuration'}
				</Button>
			</div>
		</form>
	)
}
