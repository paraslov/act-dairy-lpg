'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button'

export default function LoginPage() {
	const [activeTab, setActiveTab] = useState('signin')
	const [signupSuccess, setSignupSuccess] = useState(false)

	function handleSignupSuccess() {
		setSignupSuccess(true)
		setActiveTab('signin')
		// Reset success message after 5 seconds
		setTimeout(() => setSignupSuccess(false), 5000)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md border-border bg-card p-8">
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="signin">Sign In</TabsTrigger>
						<TabsTrigger value="signup">Sign Up</TabsTrigger>
					</TabsList>

					<TabsContent value="signin" className="space-y-4">
						<div className="space-y-2">
							<h1 className="text-2xl font-semibold tracking-tight">
								Sign In
							</h1>
						</div>

						{signupSuccess && (
							<div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
								Account created successfully! Please sign in.
							</div>
						)}

						<LoginForm />

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-card px-2 text-muted-foreground">
									Or continue with
								</span>
							</div>
						</div>

						<GoogleOAuthButton />

						<div className="text-center text-sm text-muted-foreground">
							built with{' '}
							<a
								href="https://better-auth.com"
								target="_blank"
								rel="noopener noreferrer"
								className="underline underline-offset-4 hover:text-foreground"
							>
								better-auth
							</a>
							.
						</div>
					</TabsContent>

					<TabsContent value="signup" className="space-y-4">
						<div className="space-y-2">
							<h1 className="text-2xl font-semibold tracking-tight">
								Sign Up
							</h1>
						</div>

						<SignupForm onSuccess={handleSignupSuccess} />
					</TabsContent>
				</Tabs>
			</Card>
		</div>
	)
}


