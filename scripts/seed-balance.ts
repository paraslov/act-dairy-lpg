/**
 * CLI script to seed default balance configuration
 * Usage: pnpm tsx scripts/seed-balance.ts [admin-user-id]
 */

import { seedDefaultBalanceConfig } from '../src/lib/balance/seed'

async function main() {
	const adminUserId = process.argv[2]

	if (!adminUserId) {
		console.error('Error: Admin user ID is required')
		console.error('Usage: pnpm tsx scripts/seed-balance.ts <admin-user-id>')
		process.exit(1)
	}

	try {
		await seedDefaultBalanceConfig(adminUserId)
		console.log('✅ Balance configuration seeded successfully')
		process.exit(0)
	} catch (error) {
		console.error('❌ Failed to seed balance configuration:', error)
		process.exit(1)
	}
}

main()
