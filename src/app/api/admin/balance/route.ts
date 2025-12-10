import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { balanceConfigService } from '@/lib/balance/balance-config-service'
import { gameBalanceConfigSchema } from '@/lib/balance/schemas'

/**
 * GET /api/admin/balance
 * Get the active balance configuration
 */
export async function GET() {
	try {
		const session = await requireAdmin()
		const config = await balanceConfigService.getActiveConfig()

		return NextResponse.json({ config })
	} catch (error) {
		if (error instanceof Error && error.message.includes('Unauthorized')) {
			return NextResponse.json(
				{ error: 'Unauthorized: Admin access required' },
				{ status: 403 }
			)
		}

		console.error('Error fetching balance config:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch balance configuration' },
			{ status: 500 }
		)
	}
}

/**
 * PUT /api/admin/balance
 * Update the active balance configuration
 */
export async function PUT(request: Request) {
	try {
		const session = await requireAdmin()
		const body = await request.json()

		// Validate request body
		if (!body.config) {
			return NextResponse.json(
				{ error: 'Missing config in request body' },
				{ status: 400 }
			)
		}

		// Validate configuration schema
		const validatedConfig = gameBalanceConfigSchema.parse(body.config)

		// Update configuration
		const updated = await balanceConfigService.updateActiveConfig(
			validatedConfig,
			session.user.id,
			body.reason || undefined
		)

		return NextResponse.json({
			config: updated.config,
			message: 'Balance configuration updated successfully',
		})
	} catch (error) {
		if (error instanceof Error && error.message.includes('Unauthorized')) {
			return NextResponse.json(
				{ error: 'Unauthorized: Admin access required' },
				{ status: 403 }
			)
		}

		// Zod validation errors
		if (error && typeof error === 'object' && 'issues' in error) {
			return NextResponse.json(
				{
					error: 'Invalid configuration',
					details: error.issues,
				},
				{ status: 400 }
			)
		}

		console.error('Error updating balance config:', error)
		return NextResponse.json(
			{ error: 'Failed to update balance configuration' },
			{ status: 500 }
		)
	}
}
