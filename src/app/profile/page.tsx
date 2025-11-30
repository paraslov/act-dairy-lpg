import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth-utils'
import { ProfilePageClient } from '@/components/profile/profile-page-client'

export default async function ProfilePage() {
	const session = await requireAuth()

	if (!session) {
		redirect('/login')
	}

	return <ProfilePageClient initialUser={session.user} />
}
