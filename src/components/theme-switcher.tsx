'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function ThemeSwitcher() {
	const { theme, setTheme, resolvedTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<Button variant="ghost" size="icon" className="h-9 w-9" disabled>
				<div className="h-4 w-4" />
			</Button>
		)
	}

	const isDark = resolvedTheme === 'dark' || theme === 'dark'

	function handleToggleTheme() {
		if (isDark) {
			setTheme('light')
		} else {
			setTheme('dark')
		}
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={handleToggleTheme}
			className="relative h-9 w-9"
			type="button"
		>
			<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}

