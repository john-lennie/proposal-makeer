# Production database operations

This application runs on Vercel with PostgreSQL hosted by Neon. Application
traffic and schema migrations have different connection requirements.

## Connection configuration

Use two Neon connection strings and keep both server-only:

- `DATABASE_URL` in Vercel: the pooled Neon URL. Its hostname normally contains
  `-pooler`. The application uses one PostgreSQL connection per function
  instance, disables prepared statements for pooler compatibility, times out
  connection attempts after 10 seconds, closes idle connections after 20
  seconds, and recycles connections after five minutes.
- A direct Neon URL for migrations: store this only in the protected CI or
  operator environment that runs migrations. Do not expose it to application
  functions and do not prefix it with `NEXT_PUBLIC_`.

Both URLs must use TLS (`sslmode=require` or stricter). Use distinct production
and preview databases or Neon branches so preview deployments cannot mutate
production data.

## Fresh database verification

Last verified on 2026-08-11: all three committed migrations applied cleanly to
an empty disposable Neon branch. The resulting schema contained the expected 11
application tables, 16 foreign keys, 32 indexes, and three migration journal
entries. All 34 integration tests passed and removed their fixtures.

Before the first production deployment, create a new disposable Neon branch
with no application tables. Set `DATABASE_URL` in the current shell to that
branch's direct connection string, without writing it to the repository, then
run:

```bash
pnpm db:check
pnpm db:migrate
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Verify that all migration files were applied in order in
`drizzle.__drizzle_migrations`. The integration tests create uniquely named
fixtures and remove them afterward. Delete the disposable branch after the
verification succeeds.

Do not use the production database for this clean-database test. Do not run
`pnpm db:seed` in production.

## Deployment order

1. Take or confirm a restorable Neon backup/restore point.
2. Review the committed SQL migrations and `pnpm db:check` output.
3. Run `pnpm db:migrate` once, using the direct production connection, from a
   protected CI job or an operator workstation.
4. Stop the deployment if migration fails. Do not start a second concurrent
   migration job.
5. Deploy the already-tested application build to Vercel.
6. Smoke-test authentication, dashboard reads, proposal editing, publishing,
   public access, and proposal responses.
7. Monitor Vercel function errors and Neon connections, latency, and storage.

Migrations must not run from `next build`, application startup, or every Vercel
function instance. A single migration runner avoids concurrent schema changes.

## Recovery

- Prefer a forward migration for application-level defects.
- For destructive or incompatible migration failures, stop writes, preserve
  logs, and restore the pre-migration Neon branch/restore point according to the
  Neon plan's documented retention.
- Record the migration journal state before retrying. Never manually mark a
  failed migration as applied without verifying every statement and constraint.
- Test restoration on a disposable branch before relying on the procedure for
  production.

The exact Neon backup/PITR retention depends on the selected Neon plan and must
be confirmed in the Neon console before launch.
