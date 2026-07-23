# MVP Product Specification

## Product purpose

The product helps independent creative professionals and small service businesses create polished, interactive business proposals and publish them as standalone web pages. It should shorten the time between assembling a proposal and receiving a clear client decision while presenting the provider's work with a refined, credible experience.

The MVP favors structured content, consistency, and speed over unrestricted visual control. It is not a freeform page builder.

## Target user

The primary user is an independent designer, developer, consultant, strategist, photographer, small studio, or similar service business that:

- Sends a modest number of customized proposals.
- Wants a more polished experience than a document or PDF.
- Needs reusable structure without complex design tools.
- Wants to know which published revision a client accepted or declined.

The secondary user is the proposal recipient. This client should be able to review the proposal on any common device and make a clear decision without creating an account.

## Main user journey

1. The user enters the proposal dashboard.
2. The user starts a new proposal and supplies its basic details.
3. The user builds the draft from structured proposal sections.
4. The user previews the client-facing presentation.
5. The user publishes the draft, creating an immutable published snapshot at `/p/[slug]`.
6. The client reviews the public proposal and accepts or declines that exact published revision.
7. The user sees the current proposal and decision status on the dashboard.
8. If needed, the user edits the draft and republishes a new revision without changing the previously published snapshot in place.

## Proposal lifecycle

A proposal has a mutable draft and zero or more immutable published revisions.

### Statuses

- **Draft:** The proposal has never been published.
- **Published:** At least one published revision exists and the public route resolves to the current published revision.
- **Accepted:** A client accepted a specific published revision.
- **Declined:** A client declined a specific published revision.

The draft remains editable in every status. Editing a draft after publication does not alter the public proposal. The user must explicitly republish to create and expose a new published revision.

Acceptance or decline is recorded against the exact published revision shown to the client. Republishing must not move a previous decision to the new revision. A newer revision begins without a client decision.

For the MVP, proposal status should be derived from publication and decision records rather than maintained as an independent source of truth.

## MVP features

- A marketing landing page that explains the product and leads into the app.
- A proposal dashboard with proposal title, client, last updated date, publication state, and latest decision state.
- A new-proposal flow for basic proposal and client information.
- A structured section editor that supports adding, editing, reordering, and removing sections.
- Sensible defaults and a consistent editorial presentation.
- Draft persistence.
- A private preview of the current draft.
- Explicit publishing and republishing.
- Immutable published revisions.
- A stable public slug for each proposal.
- A responsive public proposal page.
- Client acceptance and decline actions without a client account.
- Clear confirmation after a client decision.
- Loading, empty, error, and not-found states for relevant routes.

## Features explicitly excluded from the MVP

- A freeform canvas, drag-anywhere layout, or arbitrary styling controls.
- Custom domains.
- Multiple visual themes or a theme marketplace.
- Real-time collaboration, comments, or approval workflows.
- Team workspaces and granular team roles.
- Client accounts or a client portal.
- E-signatures with legal identity verification.
- Payments, deposits, invoices, or accounting integrations.
- Email delivery, reminders, or open/view analytics.
- PDF import, export, or document conversion.
- AI-generated proposal content.
- Reusable section libraries or proposal templates beyond initial defaults.
- Version comparison, rollback, or restoration of old revisions into the draft.
- Localization and multi-language authoring.

## Required screens and routes

### `/` — Marketing landing page

- Communicates the core value proposition and target audience.
- Shows the quality and structure of the client-facing result.
- Provides a clear call to action to enter the dashboard.

### `/dashboard` — Proposal dashboard

- Lists proposals with useful status and recency information.
- Supports empty, loading, and error states.
- Links to create, edit, preview, and view the current public proposal when available.
- Distinguishes unpublished draft changes from the current published revision.

### `/proposals/new` — New proposal flow

- Collects the minimum information required to create a useful draft.
- Creates a proposal only after valid input is submitted.
- Sends the user to the proposal editor after creation.

### `/proposals/[proposalId]/edit` — Proposal editor

- Edits proposal metadata and structured sections.
- Supports section addition, removal, editing, and ordering.
- Shows save state and whether the draft differs from the current published revision.
- Provides actions to preview, publish, or republish.
- Prioritizes fast, consistent authoring over unrestricted layout control.

### `/proposals/[proposalId]/preview` — Private preview

- Renders the current draft using the client-facing presentation.
- Is not publicly discoverable or treated as a published proposal.
- Clearly identifies itself as a preview.
- Provides a route back to editing and an action to publish when valid.

### `/p/[slug]` — Public client-facing proposal

- Renders only the current published snapshot, never the mutable draft.
- Uses an application route for the MVP; custom domains are excluded.
- Displays proposal content and the decision controls.
- Provides not-found or unavailable states for invalid or unpublished slugs.
- Shows a clear final state after acceptance or decline.

## Core entities

### Proposal

- Stable internal identifier.
- Owner identifier.
- Title and optional summary.
- Client name and optional client organization.
- Stable public slug.
- Mutable draft metadata and sections.
- Created and updated timestamps.

### Proposal section

- Stable identifier within a proposal.
- Section type.
- Explicit display order.
- Type-specific, validated content.
- Optional visibility flag if hiding sections is included during implementation.

### Published revision

- Stable revision identifier.
- Proposal identifier.
- Monotonic revision number.
- Immutable snapshot of all public proposal data and sections.
- Publication timestamp.
- Slug used to expose the revision.

### Client decision

- Published revision identifier.
- Decision: accepted or declined.
- Decision timestamp.
- Optional client name and email if product discovery confirms they are necessary.

Each published revision may have at most one effective client decision in the MVP.

## Proposal section types

The first version should use a small set of structured sections:

- **Introduction:** Heading, short lead, and introductory copy.
- **Scope:** One or more named deliverables with descriptions.
- **Process:** Ordered phases or steps with descriptions.
- **Timeline:** Milestones, date ranges, or estimated durations.
- **Investment:** Line items, optional descriptions, and total price.
- **Terms:** Commercial terms, assumptions, and important conditions.
- **About:** Provider or studio introduction and credibility details.
- **Call to action:** Closing message shown near acceptance controls.

All types must have explicit schemas and validation. Rich text should remain constrained to the formatting needed for readable proposal content.

## Publishing behaviour

- A proposal is always edited as a draft.
- The first publish operation validates the complete draft and creates revision 1 as an immutable snapshot.
- The public route resolves the proposal slug to its current published revision.
- Draft edits after publication never change public content.
- Republishing validates the draft, creates a new immutable revision, and atomically makes it current.
- Existing revisions and their decisions remain unchanged and auditable after republishing.
- Failed publishing must leave the previous public revision intact.
- Slugs must be normalized, validated, unique, and protected from reserved route names.
- Publishing and republishing actions must be guarded against accidental duplicate submissions.
- Unpublishing and deleting published revisions are excluded until their product and audit implications are defined.

## Client acceptance behaviour

- Decision controls act on the published revision currently displayed.
- The interface clearly identifies acceptance and decline as consequential actions.
- The server validates that the revision is still valid and records the decision against its immutable identifier.
- A successful decision replaces the controls with a confirmation state.
- Duplicate submissions of the same decision are idempotent.
- Conflicting later decisions are rejected in the MVP rather than silently overwriting the original decision.
- Republishing creates a revision with no inherited decision.
- A client does not need an account in the MVP.
- The MVP records a decision, not a legally verified electronic signature.

## Important edge cases

- A new user has no proposals.
- A proposal is missing sections required for publication.
- A section contains invalid, empty, or excessively long data.
- Two proposals request the same slug.
- A slug is malformed, reserved, changed, or no longer resolves.
- The user previews or publishes while a draft save is pending.
- The user submits publish or decision actions more than once.
- Publishing fails after a previous revision is already public.
- The user edits a draft after publishing, creating an unpublished-changes state.
- A client keeps an old revision open while the owner republishes.
- A client attempts to decide on an old revision after a new one becomes current.
- A client revisits an already accepted or declined revision.
- A public proposal or private proposal identifier does not exist.
- A user attempts to access or modify another user's proposal.
- Prices, dates, and line items are incomplete or formatted inconsistently.
- Long content, large numbers of sections, or narrow screens disrupt the layout.

An old page already loaded by a client must submit the revision identifier it rendered. The product should reject a stale decision with a clear message if only the current revision may be decided upon; whether old revisions remain decidable is an open product question.

## Accessibility expectations

- Meet WCAG 2.2 AA as the implementation target.
- Support complete keyboard navigation with visible focus indicators.
- Use semantic headings, landmarks, lists, buttons, and form controls.
- Provide persistent labels, useful instructions, and specific validation errors.
- Associate errors with their fields and provide an error summary when helpful.
- Announce save, publish, and decision results appropriately without relying on color alone.
- Maintain sufficient color contrast and readable typography at common zoom levels.
- Respect reduced-motion preferences.
- Keep controls usable on touch targets and responsive layouts.
- Preserve a logical reading and focus order when sections are reordered.

## Phased implementation plan

### Phase 1 — Foundation and static experience

- Establish the route structure and shared responsive layout.
- Define typed domain models and validation boundaries.
- Build the marketing page and static dashboard states.
- Create reusable proposal presentation components with sample structured data.
- Implement loading, empty, error, and not-found patterns.

### Phase 2 — Draft creation and editing

- Introduce the minimum persistence and owner-access mechanism.
- Implement proposal creation and draft retrieval.
- Build structured section editing, ordering, and validation.
- Implement reliable saves and unsaved or saving states.
- Add focused tests for validation, permissions, and business rules.

### Phase 3 — Preview and publishing

- Render the draft through the private preview route.
- Implement slug allocation and validation.
- Create immutable published snapshots and atomic current-revision updates.
- Render public proposals strictly from published data.
- Test snapshot isolation, republishing, failure handling, and access boundaries.

### Phase 4 — Client decisions

- Implement revision-bound accept and decline actions.
- Add confirmation, duplicate-submission, conflict, and stale-revision states.
- Surface decision status on the dashboard.
- Test decision idempotency and revision association.

### Phase 5 — MVP hardening

- Complete responsive and accessibility review.
- Exercise all loading, empty, error, and not-found states.
- Review authorization, external input validation, and public-route safety.
- Test the complete author and client journeys.
- Refine performance and editorial presentation.

## Major architecture decisions

1. Use the Next.js App Router and prefer React Server Components; isolate client components to interactive editor controls.
2. Model the editable draft separately from immutable published revisions.
3. Render `/p/[slug]` exclusively from the current published snapshot.
4. Record client decisions against immutable published revision identifiers.
5. Use discriminated, schema-validated structured section types instead of a freeform canvas.
6. Perform mutations on the server with authorization and input validation at every boundary.
7. Make publishing, republishing, and decision submission transactional or otherwise atomic and idempotent.
8. Keep persistence, authentication, validation library, and test framework choices open until their requirements are evaluated; do not add dependencies prematurely.

## Open product questions

1. What minimum client details are required when creating a proposal?
2. Should the public proposal require an access code or be available to anyone with its unguessable URL?
3. Can owners change a slug after first publication, and should the previous URL redirect?
4. May a client decide on a revision that is no longer current?
5. Should decline require or permit a reason?
6. What author or client identity details must accompany a decision?
7. Can an owner reset or supersede a client decision, and what audit history is required?
8. Which section types are required before publishing, if any?
9. How should currency, taxes, discounts, and date formats work in the first release?
10. Is a single visual presentation sufficient for MVP, or are limited brand controls such as logo and accent color required?
11. Is authentication part of the first usable internal release, or can early development use a single-owner mode?
12. What retention and deletion rules apply to drafts, published revisions, and decisions?

## Recommended MVP implementation order

1. Typed proposal, section, revision, and decision models with validation rules.
2. Shared client-facing proposal renderer using representative structured data.
3. Route shells and complete static states for landing, dashboard, editor, preview, and public proposal.
4. Persistence and owner access controls.
5. Proposal creation and dashboard data.
6. Structured draft editor and reliable saving.
7. Private draft preview.
8. Slug handling and immutable snapshot publishing.
9. Public proposal rendering from the current published revision.
10. Revision-bound acceptance and decline.
11. Dashboard publication and decision status.
12. Accessibility, edge-case, security, and end-to-end journey hardening.
