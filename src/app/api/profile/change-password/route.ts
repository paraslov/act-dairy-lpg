import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, accounts } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getSession } from '@/lib/auth-utils'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, 'Current password is required'),
	newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: Request) {
	try {
		const session = await getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const validatedData = changePasswordSchema.parse(body)

		// Get user account to check if they have a password account
		// Better Auth stores passwords in the accounts table, not users table
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

		if (userAccounts.length === 0) {
			return NextResponse.json(
				{
					error:
						'No password account found. You may have signed up with OAuth.',
				},
				{ status: 400 }
			)
		}

		const account = userAccounts[0]

		// Check if account has a password
		if (!account.password) {
			return NextResponse.json(
				{
					error:
						'No password account found. You may have signed up with OAuth.',
				},
				{ status: 400 }
			)
		}

		// Verify current password using Better Auth's sign-in API
		// This ensures we use the same password verification method that Better Auth uses
		const requestHeaders = await headers()
		try {
			const verifyResult = await auth.api.signInEmail({
				body: {
					email: session.user.email,
					password: validatedData.currentPassword,
				},
				headers: requestHeaders,
			})

			// If sign-in fails, the password is incorrect
			if (!verifyResult || !verifyResult.user) {
				return NextResponse.json(
					{ error: 'Current password is incorrect' },
					{ status: 400 }
				)
			}
		} catch (error) {
			// Log the error for debugging
			console.error('Password verification error:', error)
			// If sign-in throws an error, the password is incorrect
			return NextResponse.json(
				{ error: 'Current password is incorrect' },
				{ status: 400 }
			)
		}

		// Hash the new password
		const saltRounds = 10
		const hashedNewPassword = await bcrypt.hash(
			validatedData.newPassword,
			saltRounds
		)

		// Update password in both users and accounts tables
		await db
			.update(users)
			.set({
				password: hashedNewPassword,
				updatedAt: new Date(),
			})
			.where(eq(users.id, session.user.id))

		await db
			.update(accounts)
			.set({
				password: hashedNewPassword,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(accounts.userId, session.user.id),
					eq(accounts.providerId, 'credential')
				)
			)

		return NextResponse.json({
			success: true,
			message: 'Password changed successfully',
		})
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation error', details: error.issues },
				{ status: 400 }
			)
		}

		console.error('Error changing password:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
