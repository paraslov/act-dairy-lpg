import { Shield, Home } from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Topbar() {
	return (
		<header className="sticky top-0 z-40 w-full border-b bg-background">
			<div className="container flex h-14 items-center justify-between px-6">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						<span className="text-sm font-medium">ACT LPG</span>
					</div>
					<Button
						variant="secondary"
						size="sm"
						className="h-8 text-xs font-medium"
					>
						Default Project
					</Button>
					<nav className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 gap-1.5 text-xs font-medium"
							asChild
						>
							<Link href="/">
								<Home className="h-3.5 w-3.5" />
								Home
							</Link>
						</Button>
					</nav>
				</div>
				<div className="flex items-center gap-2">
					<ThemeSwitcher />
				</div>
			</div>
		</header>
	)
}

