import type { Session as BetterAuthSession } from 'better-auth/types'

// Extend the better-auth user type with our custom fields
export interface User {
	id: string
	email: string
	emailVerified: boolean
	name: string
	image?: string | null
	role: 'ADMIN' | 'USER'
	settings?: any
	createdAt: Date
	updatedAt: Date
}

export interface Session extends Omit<BetterAuthSession, 'user'> {
	user: User
}


