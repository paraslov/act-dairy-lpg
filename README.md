This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies:

```bash
pnpm install
```

### Database Setup

This project uses PostgreSQL with Drizzle ORM. For local development:

1. **Start PostgreSQL with Docker Compose:**

```bash
docker-compose up -d
```

This will start a PostgreSQL 16 container with persistent data storage in `.docker/postgres-data`.

2. **Configure Environment Variables:**

Create a `.env.local` file in the project root:

```bash
POSTGRES_URL=postgresql://act_dairy_user:act_dairy_password@localhost:5434/act_dairy_db
```

3. **Run Database Migrations:**

```bash
pnpm db:generate  # Generate migration files from schema
pnpm db:push      # Push schema changes to database (dev mode)
```

Or use migrations for production:

```bash
pnpm db:migrate   # Run migrations
```

4. **Optional: Open Drizzle Studio:**

```bash
pnpm db:studio    # Opens database browser UI
```

### Development Server

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Database Scripts

- `pnpm db:generate` - Generate migration files from schema changes
- `pnpm db:migrate` - Run migrations against the database
- `pnpm db:push` - Push schema changes directly (development only)
- `pnpm db:studio` - Open Drizzle Studio for database inspection

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Business Documentation

For detailed business requirements, domain knowledge, and application context, see [`.cursor/rules/business-context.mdc`](.cursor/rules/business-context.mdc).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
