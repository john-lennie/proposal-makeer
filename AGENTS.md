<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Product

This is a web application for creating polished, interactive business proposals that are published as standalone web pages.

# MVP user flow

1. View a dashboard of proposals.
2. Create a proposal.
3. Edit structured proposal sections.
4. Preview the client-facing proposal.
5. Publish it at `/p/[slug]`.
6. Allow the client to accept or decline it.

# Engineering standards

- Use TypeScript strictly.
- Use the Next.js App Router.
- Prefer React Server Components.
- Add `"use client"` only when interactivity requires it.
- Keep components focused and reusable.
- Avoid unnecessary dependencies.
- Validate external data.
- Include loading, empty, error, and not-found states.
- Maintain responsive and accessible interfaces.
- Run lint (`pnpm lint`) and TypeScript checks (`pnpm exec tsc --noEmit`) after meaningful changes.
- Do not make unrelated changes.
- Do not commit code unless explicitly asked.

# Design direction

- Refined, minimal, and editorial.
- Use generous spacing.
- Use strong typography.
- Use borders and shadows sparingly.
- Design for studios, consultants, and creative service businesses.
- Avoid a generic SaaS dashboard appearance.

# Testing

- Vitest is the test framework for server-side business logic and PostgreSQL
  integration tests.
- Run all tests with `pnpm test`.
- Run cross-workspace authorization tests with `pnpm test:authorization`.

- Add tests for business rules, data validation, permissions, publishing behaviour, and other logic where regressions would be costly.
- Prefer small focused tests over broad brittle tests.
- Do not add a testing framework until the project has logic that clearly benefits from automated tests.
- When a testing framework is introduced, document the chosen tools and commands in `AGENTS.md` and `README.md`.
- Run all existing tests after meaningful changes.
- Do not create superficial tests only to increase coverage.
