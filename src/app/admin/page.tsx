import { requireAdmin } from '@/lib/auth-utils'
import { Topbar } from '@/components/topbar'
import Link from 'next/link'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function AdminPage() {
	await requireAdmin()

	return (
		<div className="bg-background flex min-h-screen flex-col">
			<Topbar />
			<main className="container mx-auto flex-1 px-6 py-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Manage system settings and configurations
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>Balance Settings</CardTitle>
							<CardDescription>
								Configure XP thresholds, multipliers, and game balance
								parameters
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/admin/balance">
								<Button className="w-full">Manage Balance</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	)
}
