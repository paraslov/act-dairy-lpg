import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { validateImageUrl } from '@/lib/url-utils'
import { z } from 'zod'

const updateProfileSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
	email: z.string().email('Invalid email address').optional(),
	image: z.string().url('Invalid URL').nullable().optional(),
})

export async function PATCH(request: Request) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const validatedData = updateProfileSchema.parse(body)

		const updateData: {
			name?: string
			email?: string
			image?: string | null
			updatedAt?: Date
		} = {
			updatedAt: new Date(),
		}

		// Update name if provided
		if (validatedData.name !== undefined) {
			updateData.name = validatedData.name
		}

		// Update email if provided
		if (validatedData.email !== undefined) {
			// Check if email is already taken by another user
			const existingUser = await db
				.select()
				.from(users)
				.where(eq(users.email, validatedData.email))
				.limit(1)

			if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
				return NextResponse.json(
					{ error: 'Email is already taken' },
					{ status: 400 }
				)
			}

			updateData.email = validatedData.email
		}

		// Update image if provided
		if (validatedData.image !== undefined) {
			if (validatedData.image === null || validatedData.image === '') {
				updateData.image = null
			} else {
				const sanitizedUrl = validateImageUrl(validatedData.image)
				if (!sanitizedUrl) {
					return NextResponse.json(
						{ error: 'Invalid image URL' },
						{ status: 400 }
					)
				}
				updateData.image = sanitizedUrl
			}
		}

		// Update user in database
		await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, session.user.id))

		// Fetch updated user
		const updatedUser = await db
			.select()
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1)

		if (updatedUser.length === 0) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 })
		}

		return NextResponse.json({
			success: true,
			user: updatedUser[0],
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.errors },
				{ status: 400 }
			)
		}

		console.error('Error updating profile:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

