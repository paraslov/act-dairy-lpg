import { auth } from './auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Session, User } from '@/types/auth'

/**
 * Get the current session on the server side
 * Returns null if no session exists
 */
export async function getSession(): Promise<Session | null> {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})
		return session as Session | null
	} catch (error) {
		return null
	}
}

/**
 * Require authentication - throws/redirects if user is not authenticated
 * Use in server components or server actions
 */
export async function requireAuth(): Promise<Session> {
	const session = await getSession()

	if (!session) {
		redirect('/login')
	}

	return session
}

/**
 * Require admin role - throws/redirects if user is not an admin
 * Use in server components or server actions that require admin access
 */
export async function requireAdmin(): Promise<Session> {
	const session = await requireAuth()
	const user = session.user as User

	if (user.role !== 'ADMIN') {
		throw new Error('Unauthorized: Admin access required')
	}

	return session
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: 'ADMIN' | 'USER'): Promise<boolean> {
	const session = await getSession()

	if (!session) {
		return false
	}

	const user = session.user as User
	return user.role === role
}

/**
 * Get the current user from the session
 * Returns null if no session exists
 */
export async function getCurrentUser(): Promise<User | null> {
	const session = await getSession()
	return session ? (session.user as User) : null
}

