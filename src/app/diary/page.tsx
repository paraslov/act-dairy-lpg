import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-utils'
import { DiaryPageClient } from '@/components/diary/diary-page-client'

export default async function DiaryPage() {
	const session = await requireAuth()

	if (!session) {
		redirect('/login')
	}

	return <DiaryPageClient />
}
