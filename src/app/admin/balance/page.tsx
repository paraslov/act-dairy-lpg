import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth-utils'
import { Topbar } from '@/components/topbar'
import { BalanceSettingsForm } from '@/components/admin/balance-settings-form'

export default async function BalanceSettingsPage() {
	await requireAdmin()

	return (
		<div className="bg-background flex min-h-screen flex-col">
			<Topbar />
			<main className="container mx-auto flex-1 px-6 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">
						Balance Settings
					</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Configure game balance parameters for XP progression, ranks, and
						Integrity Rating
					</p>
				</div>

				<BalanceSettingsForm />
			</main>
		</div>
	)
}
