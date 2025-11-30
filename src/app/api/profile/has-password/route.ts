import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { accounts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Check if user has a credential account with password
		const userAccounts = await db
			.select()
			.from(accounts)
			.where(
				and(
					eq(accounts.userId, session.user.id),
					eq(accounts.providerId, 'credential')
				)
			)
			.limit(1)

		const hasPassword = userAccounts.length > 0 && !!userAccounts[0].password

		return NextResponse.json({
			hasPassword,
		})
	} catch (error) {
		console.error('Error checking password account:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

