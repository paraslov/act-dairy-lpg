import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login']
const authRoutes = ['/api/auth']

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Allow all auth API routes
	if (authRoutes.some((route) => pathname.startsWith(route))) {
		return NextResponse.next()
	}

	// Allow public routes
	if (publicRoutes.includes(pathname)) {
		return NextResponse.next()
	}

	// Allow static files
	if (
		pathname.startsWith('/_next') ||
		pathname.startsWith('/public') ||
		pathname.includes('.')
	) {
		return NextResponse.next()
	}

	// Check for session token in cookies
	const sessionToken = request.cookies.get('better-auth.session_token')

	// Redirect to login if no session token
	if (!sessionToken) {
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('from', pathname)
		return NextResponse.redirect(loginUrl)
	}

	// Allow authenticated requests
	return NextResponse.next()
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
	],
}
