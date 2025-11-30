'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

const signupSchema = z
	.object({
		nickname: z
			.string()
			.min(2, 'Nickname must be at least 2 characters')
			.max(50, 'Nickname must be less than 50 characters'),
		email: z.string().email('Invalid email address'),
		password: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})

type SignupFormData = z.infer<typeof signupSchema>

interface SignupFormProps {
	onSuccess?: () => void
}

export function SignupForm({ onSuccess }: SignupFormProps) {
	const router = useRouter()
	const [error, setError] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignupFormData>({
		resolver: zodResolver(signupSchema),
	})

	async function onSubmit(data: SignupFormData) {
		setIsLoading(true)
		setError('')

		try {
			const result = await authClient.signUp.email({
				email: data.email,
				password: data.password,
				name: data.nickname,
			})

			if (result.error) {
				setError(result.error.message || 'Failed to create account')
				setIsLoading(false)
				return
			}

			// Call onSuccess callback if provided
			if (onSuccess) {
				onSuccess()
			}
		} catch (err) {
			setError('An unexpected error occurred')
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
			<p className="text-sm text-muted-foreground">
				Enter your information to create an account
			</p>

			{error && (
				<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
					{error}
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="nickname">Nickname</Label>
				<Input
					id="nickname"
					type="text"
					placeholder="Your nickname"
					{...register('nickname')}
					disabled={isLoading}
				/>
				{errors.nickname && (
					<p className="text-sm text-destructive">{errors.nickname.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="signup-email">Email</Label>
				<Input
					id="signup-email"
					type="email"
					placeholder="m@example.com"
					{...register('email')}
					disabled={isLoading}
				/>
				{errors.email && (
					<p className="text-sm text-destructive">{errors.email.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="signup-password">Password</Label>
				<Input
					id="signup-password"
					type="password"
					placeholder="Password"
					{...register('password')}
					disabled={isLoading}
				/>
				{errors.password && (
					<p className="text-sm text-destructive">{errors.password.message}</p>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="confirmPassword">Confirm Password</Label>
				<Input
					id="confirmPassword"
					type="password"
					placeholder="Confirm Password"
					{...register('confirmPassword')}
					disabled={isLoading}
				/>
				{errors.confirmPassword && (
					<p className="text-sm text-destructive">
						{errors.confirmPassword.message}
					</p>
				)}
			</div>

			<Button type="submit" className="w-full" disabled={isLoading}>
				{isLoading ? 'Creating account...' : 'Create an account'}
			</Button>
		</form>
	)
}


