This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## Commands

```bash
pnpm dev          # Start the development server
pnpm build        # Create a production build
pnpm start        # Start the production server
pnpm test         # Run all Vitest tests
pnpm test:authorization # Run cross-workspace authorization integration tests
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript checks
```

## Testing

Server-side integration tests use Vitest and the PostgreSQL database configured
by `DATABASE_URL` in `.env.local`. Authorization fixtures use unique IDs and are
removed after each run.

```bash
pnpm test:authorization
```

## Database setup

The application uses PostgreSQL with Drizzle ORM.

1. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Set `DATABASE_URL` in `.env.local` to a PostgreSQL connection string. Never
   commit this file or paste credentials into source code.

   For Vercel production runtime traffic, use Neon's pooled connection string
   (the hostname normally contains `-pooler`). Keep the direct Neon connection
   string for the single migration job; do not use it in application functions.

3. Generate a Better Auth secret and add it to `.env.local`:

   ```bash
   openssl rand -base64 32
   ```

   Set `BETTER_AUTH_URL=http://localhost:3000` for local development. Configure
   `RESEND_API_KEY` and `AUTH_EMAIL_FROM` to deliver email verification and
   password-reset messages.

4. Review and apply the committed migrations:

   ```bash
   pnpm db:check
   pnpm db:migrate
   ```

5. Seed the fictional North & Finch demo proposal:

   ```bash
   pnpm db:seed
   ```

The seed is repeatable and uses stable IDs. It inserts only the demo workspace,
client, proposal draft, and published revision.

### Database commands

```bash
pnpm db:generate   # Generate SQL migrations from schema changes
pnpm db:check      # Check migration files for consistency
pnpm db:migrate    # Apply pending migrations
pnpm db:studio     # Open Drizzle Studio
pnpm db:seed       # Seed the local demo data
```

The typed schema is in `src/db/schema.ts`, generated SQL migrations are in
`drizzle/`, and application queries are isolated in `src/data/`. Routes and
components should use the data-access functions rather than importing the
database client directly.

See [docs/production-database.md](docs/production-database.md) for the Vercel
connection setup, safe migration order, fresh-branch verification, and recovery
checklist.

## Authentication

Better Auth provides email/password identity, sessions, email verification, and
password resets. Authentication data is stored in PostgreSQL through the
official Drizzle adapter.

Run the application and visit:

- `/sign-up` to create an account and its first workspace.
- `/sign-in` to start a session.
- `/forgot-password` to request a reset link.

The dashboard, proposal creation, editor, and private preview routes require an
active session and active `WorkspaceMember` record. The marketing page and
published proposals under `/p/[slug]` remain public.

Published proposal content is publicly viewable to anyone with its URL, but
acceptance and decline require the revision-bound private response link shown to
the proposal owner after publishing. That link is sensitive: share it only with
the intended client. Republishing creates a new link and prevents the previous
revision's link from deciding on the new revision. Rotating
`BETTER_AUTH_SECRET` also invalidates outstanding response links.

Required environment variables:

```text
DATABASE_URL
BETTER_AUTH_URL
BETTER_AUTH_SECRET
RESEND_API_KEY
AUTH_EMAIL_FROM
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production launch TODO

Production authentication email is intentionally not configured yet. Complete
all of the following before deploying the application for real users:

- [ ] Purchase or obtain a domain with editable DNS records.
- [ ] Add the domain (or a dedicated sending subdomain) to Resend.
- [ ] Add Resend's SPF and DKIM records at the DNS provider and wait for the
      domain to show as verified.
- [ ] Create a Resend API key with **Sending access** restricted to the verified
      domain.
- [ ] Add `RESEND_API_KEY` to the Vercel Production environment as a sensitive
      value.
- [ ] Add `AUTH_EMAIL_FROM` using the verified domain, for example
      `Sonder <auth@example.com>`.
- [ ] Confirm `BETTER_AUTH_URL` exactly matches the final HTTPS production
      origin, without a trailing slash.
- [ ] Redeploy after configuring the variables; Vercel environment changes do
      not affect previous deployments.
- [ ] Test sign-up verification and password-reset delivery with multiple email
      providers, and confirm every link uses the production origin.

Do not use Resend's test domain for a real launch. Production builds fail when
email delivery is missing so verification cannot be accidentally disabled for
real users.
