import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subValues } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'

export async function GET() {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user's active sub-values (not deleted)
		const userSubValues = await db
			.select({
				id: subValues.id,
				name: subValues.name,
				description: subValues.description,
			})
			.from(subValues)
			.where(
				and(eq(subValues.userId, session.user.id), isNull(subValues.deletedAt))
			)
			.orderBy(subValues.name)

		return NextResponse.json({ subValues: userSubValues })
	} catch (error) {
		console.error('Error fetching sub-values:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
