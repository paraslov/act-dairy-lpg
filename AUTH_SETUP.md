# Authentication Setup Guide

This guide will help you set up the authentication system for the ACT LPG application.

## Prerequisites

- PostgreSQL database running locally or remotely
- Node.js and pnpm installed
- Google OAuth credentials (optional, for Google sign-in)

## Setup Steps

### 0. Start PostgreSQL locally (Docker)

If you are using the provided Docker setup, spin up the database before running any migrations:

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container exposed on port `5434` with data persisted in `.docker/postgres-data`.

### 1. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/act_dairy_lpg

# Better Auth Configuration
BETTER_AUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (Optional - remove if not using Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Admin User (for seed script - optional)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin

# App URL for client-side auth
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:**

- Replace `DATABASE_URL` with your actual PostgreSQL connection string
- Generate a secure random string for `BETTER_AUTH_SECRET` (at least 32 characters)
- For production, update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to your domain

### 2. Google OAuth Setup (Optional)

If you want to enable Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Copy the Client ID and Client Secret to your `.env.local` file

If you don't want Google sign-in, you can skip this step and remove the Google OAuth button from the login page.

### 3. Database Migration

Run the database migration to create the authentication tables:

```bash
# Generate migration files
pnpm db:generate

# Apply migrations to your database
pnpm db:push
```

This will create the following tables:

- `users` - User accounts with email, password, role, etc.
- `sessions` - Active user sessions
- `accounts` - OAuth provider accounts
- `verification_tokens` - Email verification tokens (for future use)

### 4. Start the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Features

### User Roles

The system supports two user roles:

- **USER** (default) - Regular users
- **ADMIN** - Administrators with elevated privileges

### Authentication Methods

1. **Email & Password** - Traditional email/password authentication
2. **Google OAuth** - Sign in with Google (if configured)

### Protected Routes

The middleware automatically protects all routes except:

- `/login` - Public login page
- `/api/auth/*` - Authentication API endpoints
- Static files and assets

When an unauthenticated user tries to access a protected route, they are redirected to `/login`.

## Usage

### Client-Side

#### Using the `useAuth` hook:

```tsx
'use client'

import { useAuth } from '@/hooks/use-auth'

export function MyComponent() {
	const { user, isLoading, isAuthenticated, isAdmin } = useAuth()

	if (isLoading) {
		return <div>Loading...</div>
	}

	if (!isAuthenticated) {
		return <div>Please log in</div>
	}

	return (
		<div>
			<h1>Welcome, {user?.name}!</h1>
			<p>Email: {user?.email}</p>
			<p>Role: {user?.role}</p>
			{isAdmin && <p>You have admin privileges</p>}
		</div>
	)
}
```

#### Manual sign in/sign up:

```tsx
import { signIn, signUp, signOut } from '@/lib/auth-client'

// Sign up
await signUp.email({
	email: 'user@example.com',
	password: 'password123',
	name: 'User Nickname',
})

// Sign in
await signIn.email({
	email: 'user@example.com',
	password: 'password123',
	callbackURL: '/',
})

// Sign out
await signOut()
```

### Server-Side

#### Get current session:

```tsx
import { getSession, requireAuth, requireAdmin } from '@/lib/auth-utils'

// In a server component
export default async function MyPage() {
	const session = await getSession()

	if (!session) {
		return <div>Not logged in</div>
	}

	return <div>Welcome, {session.user.name}!</div>
}
```

#### Require authentication:

```tsx
import { requireAuth } from '@/lib/auth-utils'

export default async function ProtectedPage() {
	const session = await requireAuth() // Redirects to /login if not authenticated

	return <div>Protected content for {session.user.name}</div>
}
```

#### Require admin role:

```tsx
import { requireAdmin } from '@/lib/auth-utils'

export default async function AdminPage() {
	const session = await requireAdmin() // Throws error if not admin

	return <div>Admin dashboard</div>
}
```

## Creating the First Admin User

Since new users are created with the `USER` role by default, you'll need to create an admin user. The easiest way is to use the provided seed script:

### Using the Seed Script (Recommended)

1. Add the following environment variables to your `.env.local` file:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
ADMIN_NAME=Admin  # Optional, defaults to "Admin"
```

2. Run the seed script:

```bash
pnpm db:seed:admin
```

The script will:

- Create an admin user with the specified email and password
- Set the user's role to `ADMIN`
- Mark the email as verified
- Create the necessary account record for authentication

**Note:** The script is idempotent - if an admin user with the same email already exists, it will skip creation. If a regular user with that email exists, it will be promoted to admin.

### Alternative: Manual Database Update

If you prefer to create the admin user manually:

1. Sign up for a new account through the UI
2. Connect to your database and run:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## Security Considerations

1. **Password Security**: Passwords are automatically hashed using bcrypt
2. **Session Security**: Sessions are stored securely with JWT tokens
3. **CSRF Protection**: Built-in CSRF protection from better-auth
4. **Environment Variables**: Never commit `.env.local` to version control
5. **Production Secret**: Generate a strong, random secret for production

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify your `DATABASE_URL` is correct
2. Ensure PostgreSQL is running
3. Check that the database exists
4. Verify the user has the correct permissions
5. If you need to reset the local dev database completely, run:

```bash
docker compose down \
  && rm -rf ./.docker/postgres-data \
  && docker compose up -d \
  && pnpm db:push
```

This wipes the persisted volume, recreates the database, and reapplies the schema from scratch.

### Google OAuth Not Working

If Google sign-in fails:

1. Verify your OAuth credentials are correct
2. Check that redirect URIs are properly configured in Google Console
3. Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`

### Middleware Redirect Loop

If you experience redirect loops:

1. Check that `/login` is included in `publicRoutes` in `middleware.ts`
2. Verify session cookies are being set correctly
3. Clear your browser cookies and try again

## Next Steps

- Implement email verification
- Add password reset functionality
- Create user profile management pages
- Add role-based UI elements
- Implement audit logging for admin actions

## Resources

- [Better Auth Documentation](https://better-auth.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
