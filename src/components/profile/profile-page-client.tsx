'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Home } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@/types/auth'

const profileSchema = z.object({
	name: z
		.string()
		.min(2, 'Name must be at least 2 characters')
		.max(50, 'Name must be less than 50 characters'),
	email: z.string().email('Invalid email address'),
	image: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
})

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string(),
	})
	.refine(data => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})

interface ProfilePageClientProps {
	initialUser: User
}

export function ProfilePageClient({ initialUser }: ProfilePageClientProps) {
	const router = useRouter()
	const { user } = useAuth()
	const [isEditing, setIsEditing] = useState(false)
	const [isChangingPassword, setIsChangingPassword] = useState(false)
	const [profileError, setProfileError] = useState<string>('')
	const [passwordError, setPasswordError] = useState<string>('')
	const [profileSuccess, setProfileSuccess] = useState<string>('')
	const [passwordSuccess, setPasswordSuccess] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)
	const [isPasswordLoading, setIsPasswordLoading] = useState(false)
	const [hasPassword, setHasPassword] = useState<boolean | null>(null)

	// Use the user from hook if available (more up-to-date), otherwise use initial
	const currentUser = user || initialUser

	// Check if user has a password account
	useEffect(() => {
		async function checkPasswordAccount() {
			try {
				const response = await fetch('/api/profile/has-password')
				if (response.ok) {
					const data = await response.json()
					setHasPassword(data.hasPassword)
				}
			} catch {
				// Silently fail - will just hide password section
				setHasPassword(false)
			}
		}
		checkPasswordAccount()
	}, [])

	const {
		register: registerProfile,
		handleSubmit: handleProfileSubmit,
		formState: { errors: profileErrors },
		reset: resetProfile,
	} = useForm<z.infer<typeof profileSchema>>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			name: currentUser.name,
			email: currentUser.email,
			image: currentUser.image || '',
		},
	})

	const {
		register: registerPassword,
		handleSubmit: handlePasswordSubmit,
		formState: { errors: passwordErrors },
		reset: resetPassword,
	} = useForm<z.infer<typeof passwordSchema>>({
		resolver: zodResolver(passwordSchema),
	})

	async function onProfileSubmit(data: z.infer<typeof profileSchema>) {
		setIsLoading(true)
		setProfileError('')
		setProfileSuccess('')

		try {
			const response = await fetch('/api/profile/update', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: data.name,
					email: data.email,
					image: data.image || null,
				}),
			})

			const result = await response.json()

			if (!response.ok) {
				setProfileError(result.error || 'Failed to update profile')
				setIsLoading(false)
				return
			}

			setProfileSuccess('Profile updated successfully!')
			setIsEditing(false)
			router.refresh()
		} catch {
			setProfileError('An unexpected error occurred')
			setIsLoading(false)
		}
	}

	async function onPasswordSubmit(data: z.infer<typeof passwordSchema>) {
		setIsPasswordLoading(true)
		setPasswordError('')
		setPasswordSuccess('')

		try {
			const response = await fetch('/api/profile/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					currentPassword: data.currentPassword,
					newPassword: data.newPassword,
				}),
			})

			const result = await response.json()

			if (!response.ok) {
				setPasswordError(result.error || 'Failed to change password')
				setIsPasswordLoading(false)
				return
			}

			setPasswordSuccess('Password changed successfully!')
			resetPassword()
			setIsChangingPassword(false)
		} catch {
			setPasswordError('An unexpected error occurred')
			setIsPasswordLoading(false)
		}
	}

	function handleCancelEdit() {
		resetProfile({
			name: currentUser.name,
			email: currentUser.email,
			image: currentUser.image || '',
		})
		setIsEditing(false)
		setProfileError('')
		setProfileSuccess('')
	}

	function handleCancelPassword() {
		resetPassword()
		setIsChangingPassword(false)
		setPasswordError('')
		setPasswordSuccess('')
	}

	const displayImage = currentUser.image || null
	const initials = currentUser.name
		.split(' ')
		.map(n => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2)

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8 flex items-center gap-4">
				<Button variant="ghost" size="sm" className="gap-2" asChild>
					<Link href="/">
						<Home className="h-4 w-4" />
						Back to Home
					</Link>
				</Button>
				<h1 className="text-3xl font-bold">Profile Settings</h1>
			</div>

			<div className="space-y-6">
				{/* Profile Information Card */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle>Profile Information</CardTitle>
								<CardDescription>
									Manage your account information and avatar
								</CardDescription>
							</div>
							{!isEditing && (
								<Button onClick={() => setIsEditing(true)} variant="outline">
									Edit Profile
								</Button>
							)}
						</div>
					</CardHeader>
					<CardContent>
						{profileSuccess && (
							<div className="mb-4 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
								{profileSuccess}
							</div>
						)}
						{profileError && (
							<div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
								{profileError}
							</div>
						)}

						<form
							onSubmit={handleProfileSubmit(onProfileSubmit)}
							className="space-y-6"
						>
							{/* Avatar Section */}
							<div className="flex items-center gap-6">
								<Avatar className="h-24 w-24">
									{displayImage && (
										<AvatarImage src={displayImage} alt={currentUser.name} />
									)}
									<AvatarFallback className="text-2xl">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1">
									<Label htmlFor="image">Avatar URL</Label>
									<Input
										id="image"
										type="url"
										placeholder="https://example.com/avatar.jpg"
										{...registerProfile('image')}
										disabled={!isEditing || isLoading}
									/>
									{profileErrors.image && (
										<p className="text-destructive mt-1 text-sm">
											{profileErrors.image.message}
										</p>
									)}
									<p className="text-muted-foreground mt-1 text-sm">
										Enter a URL to an image on the internet
									</p>
								</div>
							</div>

							{/* Name Field */}
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									type="text"
									{...registerProfile('name')}
									disabled={!isEditing || isLoading}
								/>
								{profileErrors.name && (
									<p className="text-destructive text-sm">
										{profileErrors.name.message}
									</p>
								)}
							</div>

							{/* Email Field */}
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									{...registerProfile('email')}
									disabled={!isEditing || isLoading}
								/>
								{profileErrors.email && (
									<p className="text-destructive text-sm">
										{profileErrors.email.message}
									</p>
								)}
							</div>

							{/* Read-only fields */}
							<div className="space-y-2">
								<Label>Account Created</Label>
								<Input
									type="text"
									value={new Date(currentUser.createdAt).toLocaleDateString()}
									disabled
									className="bg-muted"
								/>
							</div>

							{/* Action Buttons */}
							{isEditing && (
								<div className="flex gap-2">
									<Button type="submit" disabled={isLoading}>
										{isLoading ? 'Saving...' : 'Save Changes'}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={handleCancelEdit}
										disabled={isLoading}
									>
										Cancel
									</Button>
								</div>
							)}
						</form>
					</CardContent>
				</Card>

				{/* Change Password Card - Only show if user has a password account */}
				{hasPassword && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Change Password</CardTitle>
									<CardDescription>
										Update your password to keep your account secure
									</CardDescription>
								</div>
								{!isChangingPassword && (
									<Button
										onClick={() => setIsChangingPassword(true)}
										variant="outline"
									>
										Change Password
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent>
							{passwordSuccess && (
								<div className="mb-4 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
									{passwordSuccess}
								</div>
							)}
							{passwordError && (
								<div className="bg-destructive/15 text-destructive mb-4 rounded-md p-3 text-sm">
									{passwordError}
								</div>
							)}

							{isChangingPassword ? (
								<form
									onSubmit={handlePasswordSubmit(onPasswordSubmit)}
									className="space-y-4"
								>
									<div className="space-y-2">
										<Label htmlFor="currentPassword">Current Password</Label>
										<Input
											id="currentPassword"
											type="password"
											{...registerPassword('currentPassword')}
											disabled={isPasswordLoading}
										/>
										{passwordErrors.currentPassword && (
											<p className="text-destructive text-sm">
												{passwordErrors.currentPassword.message}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="newPassword">New Password</Label>
										<Input
											id="newPassword"
											type="password"
											{...registerPassword('newPassword')}
											disabled={isPasswordLoading}
										/>
										{passwordErrors.newPassword && (
											<p className="text-destructive text-sm">
												{passwordErrors.newPassword.message}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="confirmPassword">
											Confirm New Password
										</Label>
										<Input
											id="confirmPassword"
											type="password"
											{...registerPassword('confirmPassword')}
											disabled={isPasswordLoading}
										/>
										{passwordErrors.confirmPassword && (
											<p className="text-destructive text-sm">
												{passwordErrors.confirmPassword.message}
											</p>
										)}
									</div>

									<div className="flex gap-2">
										<Button type="submit" disabled={isPasswordLoading}>
											{isPasswordLoading ? 'Changing...' : 'Change Password'}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={handleCancelPassword}
											disabled={isPasswordLoading}
										>
											Cancel
										</Button>
									</div>
								</form>
							) : (
								<p className="text-muted-foreground text-sm">
									Click &quot;Change Password&quot; to update your password
								</p>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
