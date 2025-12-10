import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { balanceConfigService } from '@/lib/balance/balance-config-service'

/**
 * GET /api/admin/balance/history
 * Get configuration change history
 * Query params:
 *   - configId (optional): Get history for specific config ID
 */
export async function GET(request: Request) {
	try {
		const session = await requireAdmin()
		const { searchParams } = new URL(request.url)
		const configId = searchParams.get('configId') || undefined

		const history = await balanceConfigService.getConfigHistory(configId)

		return NextResponse.json({ history })
	} catch (error) {
		if (error instanceof Error && error.message.includes('Unauthorized')) {
			return NextResponse.json(
				{ error: 'Unauthorized: Admin access required' },
				{ status: 403 }
			)
		}

		console.error('Error fetching balance config history:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch configuration history' },
			{ status: 500 }
		)
	}
}
