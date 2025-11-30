'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { authClient } from '@/lib/auth-client'

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
	const router = useRouter()
	const [error, setError] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)

	const {
		register,
		handleSubmit,
		control,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			rememberMe: false,
		},
	})

	async function onSubmit(data: LoginFormData) {
		console.log('Form submitted with data:', { email: data.email, hasPassword: !!data.password })
		setIsLoading(true)
		setError('')

		try {
			const result = await authClient.signIn.email({
				email: data.email,
				password: data.password,
				callbackURL: '/',
			})

			if (result.error) {
				setError(result.error.message || 'Failed to sign in')
				setIsLoading(false)
				return
			}

			// Redirect to home page on success
			router.push('/')
			router.refresh()
		} catch (err) {
			console.error('Login error:', err)
			setError(err instanceof Error ? err.message : 'An unexpected error occurred')
			setIsLoading(false)
		}
	}

	function onError(errors: any) {
		console.log('Form validation errors:', errors)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4" noValidate>
			<p className="text-sm text-muted-foreground">
				Enter your email below to login to your account
			</p>

			{error && (
				<div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
					{error}
				</div>
			)}

			<div className="space-y-2">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
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
				<div className="flex items-center justify-between">
					<Label htmlFor="password">Password</Label>
					<a
						href="#"
						className="text-sm text-muted-foreground underline-offset-4 hover:underline"
					>
						Forgot your password?
					</a>
				</div>
				<Input
					id="password"
					type="password"
					placeholder="password"
					{...register('password')}
					disabled={isLoading}
				/>
				{errors.password && (
					<p className="text-sm text-destructive">{errors.password.message}</p>
				)}
			</div>

			<div className="flex items-center space-x-2">
				<Controller
					control={control}
					name="rememberMe"
					render={({ field }) => (
						<Checkbox
							id="rememberMe"
							checked={field.value}
							onCheckedChange={field.onChange}
							disabled={isLoading}
						/>
					)}
				/>
				<Label
					htmlFor="rememberMe"
					className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
				>
					Remember me
				</Label>
			</div>

			<Button 
				type="submit" 
				className="w-full" 
				disabled={isLoading}
			>
				{isLoading ? 'Logging in...' : 'Login'}
			</Button>
		</form>
	)
}

