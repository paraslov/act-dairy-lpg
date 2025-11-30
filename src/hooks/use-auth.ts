'use client'

import { useSession } from '@/lib/auth-client'
import type { User } from '@/types/auth'

/**
 * Custom hook for authentication state
 * Wraps better-auth's useSession with additional utilities
 */
export function useAuth() {
	const { data: session, isPending, error } = useSession()
	const user = session?.user as User | undefined

	return {
		user: user || null,
		session: session,
		isLoading: isPending,
		isAuthenticated: !!user,
		isAdmin: user?.role === 'ADMIN',
		isUser: user?.role === 'USER',
		role: user?.role || null,
		error,
	}
}

