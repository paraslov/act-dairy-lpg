'use client'

import {
	Shield,
	Home,
	LogOut,
	User as UserIcon,
	BookOpen,
	Settings,
} from 'lucide-react'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import type { User } from '@/types/auth'

export function Topbar() {
	const router = useRouter()
	const { data: session, isPending } = useSession()
	const user = session?.user as User | undefined

	async function handleLogout() {
		await signOut()
		router.push('/login')
		router.refresh()
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2)
	}

	return (
		<header className="bg-background sticky top-0 z-40 w-full border-b">
			<div className="container flex h-14 items-center justify-between px-6">
				<div className="flex items-center gap-6">
					<div className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						<span className="text-sm font-medium">ACT LPG</span>
					</div>
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
						<Button
							variant="ghost"
							size="sm"
							className="h-8 gap-1.5 text-xs font-medium"
							asChild
						>
							<Link href="/diary">
								<BookOpen className="h-3.5 w-3.5" />
								Diary
							</Link>
						</Button>
						{user?.role === 'ADMIN' && (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 gap-1.5 text-xs font-medium"
								asChild
							>
								<Link href="/admin">
									<Settings className="h-3.5 w-3.5" />
									Admin
								</Link>
							</Button>
						)}
					</nav>
				</div>
				<div className="flex items-center gap-2">
					<ThemeSwitcher />

					{!isPending && user && (
						<>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 text-xs font-medium"
								asChild
							>
								<Link href="/profile">Profile Settings</Link>
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										className="relative h-8 w-8 rounded-full"
									>
										<Avatar className="h-8 w-8">
											<AvatarImage
												src={user.image || undefined}
												alt={user.name}
											/>
											<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent className="w-56" align="end" forceMount>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1">
											<p className="text-sm leading-none font-medium">
												{user.name}
											</p>
											<p className="text-muted-foreground text-xs leading-none">
												{user.email}
											</p>
											<div className="pt-1">
												<Badge
													variant={
														user.role === 'ADMIN' ? 'default' : 'secondary'
													}
													className="text-xs"
												>
													{user.role}
												</Badge>
											</div>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/profile" className="cursor-pointer">
											<UserIcon className="mr-2 h-4 w-4" />
											<span>Profile</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleLogout}
										className="text-destructive focus:text-destructive cursor-pointer"
									>
										<LogOut className="mr-2 h-4 w-4" />
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}
				</div>
			</div>
		</header>
	)
}
