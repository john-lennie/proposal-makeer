# Application Data Model

## Purpose and scope

This document defines the application data model before a database, ORM, authentication provider, or validation library is selected. It is a logical contract rather than a vendor-specific schema.

The model supports:

- Multiple users working through workspaces, even though teams are not an MVP interface.
- Workspace-owned clients and proposals.
- Mutable proposal drafts made from ordered, structured sections.
- Immutable published revisions.
- Client responses tied to the exact revision reviewed.

All external input must be validated before it reaches this model. IDs should be opaque UUIDs or an equivalent non-sequential identifier. Timestamps should be stored in UTC and serialized as ISO 8601 values.

## Model overview

```text
User ──< WorkspaceMember >── Workspace
                                │
                                ├──< Client
                                │     └──< Proposal
                                │
                                └──< Proposal
                                      ├──< ProposalSection
                                      └──< ProposalRevision
                                            └──0..1 ProposalResponse
```

`Workspace` is the ownership and authorization boundary. A `User` gains access to workspace data only through an active `WorkspaceMember` record.

## Shared conventions

### IDs

- Every entity has an internal `id`.
- IDs are immutable, never derived from a title, email address, or public slug.
- Public URLs use `Proposal.slug`; internal application routes use `Proposal.id`.

### Timestamps

Unless noted otherwise, mutable entities include:

- `createdAt`: required; set once.
- `updatedAt`: required; changed whenever the record changes.
- `deletedAt`: optional; present when the record is soft-deleted.

Immutable event records use a domain-specific timestamp such as `publishedAt` or `respondedAt` and do not need a mutable `updatedAt`.

### Money

- Monetary amounts are stored as integer minor units, such as cents.
- Currency uses an ISO 4217 three-letter code such as `CAD`.
- A published revision snapshots both amounts and currency.
- Floating-point values must not be used for money.

### Deletion

- Published revisions and responses are audit records and are not hard-deleted through normal product operations.
- Workspace-owned records use soft deletion where history or public state must be retained.
- Hard deletion is reserved for verified privacy erasure or administrative retention workflows and must account for dependent records.
- Foreign-key behavior should default to `RESTRICT` for audit records, not cascading deletion.

## Entity: User

A person who can access one or more workspaces.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Internal immutable identifier. |
| `email` | normalized string | Yes | Globally unique; stored lowercase for lookup. |
| `name` | string | Yes | Display name. |
| `avatarUrl` | URL string | No | Must be validated if supplied externally. |
| `status` | `UserStatus` | Yes | Defaults to `ACTIVE` after account activation. |
| `lastActiveAt` | timestamp | No | Operational convenience, not an authorization signal. |
| `createdAt` | timestamp | Yes | Creation time. |
| `updatedAt` | timestamp | Yes | Last profile or status change. |
| `deletedAt` | timestamp | No | Soft-deletion time. |

### Status enum

```ts
type UserStatus = "INVITED" | "ACTIVE" | "DISABLED";
```

### Relationships and ownership

- A user has many `WorkspaceMember` records.
- A user does not directly own proposals or clients; workspaces do.
- Authentication identity data may live with an external provider later. Provider secrets and session credentials do not belong on this record.

### Deletion behaviour

- Disabling a user immediately prevents access without removing workspace content.
- Soft-deleting a user retains membership and audit references but removes access.
- A user who is the last `OWNER` of a workspace cannot be deleted until ownership is transferred or the workspace enters a verified deletion flow.

## Entity: Workspace

The tenant, billing, and data-ownership boundary. An independent professional has a single-person workspace; a small studio may eventually have multiple members.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Internal immutable identifier. |
| `name` | string | Yes | Studio or business name. |
| `slug` | normalized string | Yes | Unique workspace handle for internal use; not a custom proposal domain. |
| `status` | `WorkspaceStatus` | Yes | Defaults to `ACTIVE`. |
| `defaultCurrency` | ISO 4217 code | Yes | Used as the default for new proposals. |
| `timezone` | IANA timezone | Yes | Used for author-facing dates and expiry interpretation. |
| `createdAt` | timestamp | Yes | Creation time. |
| `updatedAt` | timestamp | Yes | Last settings change. |
| `deletedAt` | timestamp | No | Soft-deletion time. |

### Status enum

```ts
type WorkspaceStatus = "ACTIVE" | "SUSPENDED" | "PENDING_DELETION";
```

### Relationships and ownership

- A workspace has many members, clients, and proposals.
- At least one active member must have the `OWNER` role.
- Every query for a client or proposal in the authoring application must be scoped by workspace ID.

### Deletion behaviour

- Workspace deletion is soft and should enter `PENDING_DELETION` before any permanent erasure.
- Suspending or deleting a workspace disables authoring and may disable public proposals according to the retention policy.
- Permanent workspace deletion must explicitly process members, clients, proposals, revisions, and responses; it must not rely on an accidental database cascade.

## Entity: WorkspaceMember

The join and authorization record between a user and a workspace.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Internal identifier. |
| `workspaceId` | ID | Yes | References `Workspace.id`. |
| `userId` | ID | Yes | References `User.id`. |
| `role` | `WorkspaceRole` | Yes | Controls workspace permissions. |
| `status` | `MembershipStatus` | Yes | Membership lifecycle state. |
| `invitedByUserId` | ID | No | Inviting user, when applicable. |
| `joinedAt` | timestamp | No | Set when an invitation is accepted. |
| `createdAt` | timestamp | Yes | Invitation or membership creation time. |
| `updatedAt` | timestamp | Yes | Last role or status change. |
| `deletedAt` | timestamp | No | Membership removal time. |

### Status enums

```ts
type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
type MembershipStatus = "INVITED" | "ACTIVE" | "SUSPENDED";
```

### Relationships and ownership

- Belongs to exactly one user and one workspace.
- The pair `(workspaceId, userId)` is unique among non-deleted memberships.
- `OWNER` can manage ownership and workspace deletion.
- `ADMIN` can manage workspace content and, later, non-owner members.
- `MEMBER` can manage content but not workspace ownership.
- The MVP may expose only a single owner, but authorization should still use this relationship.

### Deletion behaviour

- Removing a member soft-deletes the membership; it does not delete content they created.
- The last active owner cannot be removed or demoted.
- Historical `createdByUserId` values remain intact after membership removal.

## Entity: Client

A workspace-owned recipient or organization for whom proposals are created. A client is not an authenticated application user in the MVP.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Internal immutable identifier. |
| `workspaceId` | ID | Yes | Owning workspace. |
| `name` | string | Yes | Person or primary contact name. |
| `organizationName` | string | No | Client business or household name. |
| `email` | normalized email | No | Optional until client identity requirements are decided. |
| `phone` | normalized string | No | Optional contact information. |
| `notes` | plain text | No | Internal only; never included in published snapshots. |
| `status` | `ClientStatus` | Yes | Defaults to `ACTIVE`. |
| `createdByUserId` | ID | Yes | User who created the client. |
| `createdAt` | timestamp | Yes | Creation time. |
| `updatedAt` | timestamp | Yes | Last client detail change. |
| `deletedAt` | timestamp | No | Archive/deletion time. |

### Status enum

```ts
type ClientStatus = "ACTIVE" | "ARCHIVED";
```

### Relationships and ownership

- Belongs to one workspace.
- Has many proposals.
- Can be read or changed only by an active member of its workspace.
- Proposal creation must reject a client from a different workspace.

### Deletion behaviour

- A client with proposals is archived or soft-deleted, never cascade-deleted.
- Existing proposal drafts and published snapshots retain the client display details captured for them.
- A client without proposals may be hard-deleted if retention requirements allow it.

## Entity: Proposal

The stable workspace-owned aggregate for a proposal. It contains the mutable draft state and points to the currently published immutable revision.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Internal immutable identifier used by authoring routes. |
| `workspaceId` | ID | Yes | Owning workspace and authorization boundary. |
| `clientId` | ID | Yes | References a client in the same workspace. |
| `title` | string | Yes | Internal and default public title. |
| `slug` | normalized string | Yes | Public identifier; unique across active public proposals. |
| `status` | `ProposalStatus` | Yes | Publication lifecycle, not an independent response truth. |
| `currency` | ISO 4217 code | Yes | Defaults from the workspace and is snapshotted on publish. |
| `themeSettings` | `ThemeSettings` | Yes | Constrained presentation settings; defaults are valid without customization. |
| `draftContent` | `ProposalDraftContent` | Yes | Logical mutable aggregate described below. |
| `publishedContentSnapshot` | `ProposalContentSnapshot` | No | Logical read alias of the current published revision, never the mutable draft. |
| `currentPublishedRevisionId` | ID | No | References the revision currently served at `/p/[slug]`. |
| `publishedAt` | timestamp | No | Publication time of the current revision. |
| `expiresAt` | timestamp | No | Public decision deadline; copied into each revision. |
| `passwordProtectionEnabled` | boolean | Yes | Defaults to `false`. |
| `passwordHash` | string | No | Required only when protection is enabled; never store plaintext. |
| `createdByUserId` | ID | Yes | User who created the proposal. |
| `lastEditedByUserId` | ID | Yes | Most recent draft editor. |
| `createdAt` | timestamp | Yes | Creation time. |
| `updatedAt` | timestamp | Yes | Last draft or metadata change. |
| `deletedAt` | timestamp | No | Soft-deletion time. |

### Status enum

```ts
type ProposalStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
```

`ACCEPTED` and `DECLINED` are response states, not durable proposal lifecycle values. The dashboard may derive a display status from the response attached to `currentPublishedRevisionId`. This avoids falsely marking a newly republished revision as accepted because an older revision was accepted.

### Theme settings

The initial theme is constrained rather than freeform:

```ts
interface ThemeSettings {
  accentColor?: string;
  logoAssetUrl?: string;
  displayName?: string;
}
```

All values are optional, validated, and resolved against product defaults. Arbitrary CSS, scripts, font URLs, and layout definitions are not permitted.

### Relationships and ownership

- Belongs to one workspace and one client in that workspace.
- Has many mutable draft sections.
- Has many immutable revisions.
- Optionally points to one current published revision.
- `slug` should be globally unique if public URLs remain `/p/[slug]`; if uniqueness is later workspace-scoped, the public URL must gain a workspace namespace.
- Only active workspace members with an allowed role can create, edit, preview, publish, archive, or inspect responses.

### Deletion behaviour

- Draft-only proposals may be soft-deleted and later permanently removed under retention rules.
- A proposal with any published revision or response remains soft-deleted to preserve audit integrity.
- Soft deletion removes it from the dashboard and disables its public route by default.
- Proposal revisions and responses do not cascade-delete through normal product actions.

## Entity: ProposalSection

A mutable, ordered, structured block in the proposal draft.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Stable section identifier. |
| `proposalId` | ID | Yes | Parent proposal. |
| `type` | `ProposalSectionType` | Yes | Discriminator for the content union. |
| `position` | integer or sortable key | Yes | Defines display order within the proposal. |
| `content` | `ProposalSectionContent` | Yes | Validated payload matching `type`. |
| `isVisible` | boolean | Yes | Defaults to `true`; hidden sections remain in the draft but are omitted when publishing. |
| `createdAt` | timestamp | Yes | Creation time. |
| `updatedAt` | timestamp | Yes | Last content, visibility, or order change. |
| `deletedAt` | timestamp | No | Optional soft deletion for recoverability. |

### Status

Proposal sections do not need a lifecycle enum. `isVisible` controls inclusion and `deletedAt` controls removal.

### Relationships and ownership

- Belongs to exactly one proposal.
- Inherits workspace ownership through its proposal.
- Section IDs are stable during editing but are copied as data into a revision snapshot; published pages never join back to these mutable rows.
- Active positions must be unique or deterministically sortable within a proposal.

### Deletion behaviour

- Removing a draft section soft-deletes it initially or removes it from active draft order.
- Deleting or changing a draft section never alters an existing revision.
- A section can be permanently removed after an undo window because revisions retain their own copies.

## Initial proposal section union

Every block contains `id`, `type`, and optional shared presentation fields. Each `content` payload is validated according to its discriminator.

```ts
interface SectionBase {
  id: string;
  eyebrow?: string;
  title: string;
}

type ProposalSectionContent =
  | (SectionBase & {
      type: "cover";
      subtitle?: string;
      preparedFor: string;
      preparedBy: string;
      location?: string;
      dateLabel?: string;
    })
  | (SectionBase & {
      type: "text";
      body: RichTextDocument;
    })
  | (SectionBase & {
      type: "objectives";
      introduction?: string;
      items: Array<{ id: string; text: string }>;
    })
  | (SectionBase & {
      type: "scope";
      introduction?: string;
      items: Array<{
        id: string;
        title: string;
        description: string;
        includes: string[];
      }>;
    })
  | (SectionBase & {
      type: "deliverables";
      introduction?: string;
      items: Array<{ id: string; title: string; description?: string }>;
    })
  | (SectionBase & {
      type: "timeline";
      introduction?: string;
      phases: Array<{
        id: string;
        label: string;
        title: string;
        description?: string;
        startsOn?: string;
        endsOn?: string;
      }>;
    })
  | (SectionBase & {
      type: "pricing";
      introduction?: string;
      items: Array<{
        id: string;
        label: string;
        description?: string;
        amountMinor: number;
      }>;
      taxLabel?: string;
      taxRateBasisPoints?: number;
    })
  | (SectionBase & {
      type: "terms";
      items: Array<{ id: string; text: string }>;
    })
  | (SectionBase & {
      type: "acceptance";
      body: string;
      acceptLabel: string;
      declineLabel: string;
    });
```

`RichTextDocument` is a constrained, versioned JSON format. It may contain paragraphs, headings, lists, emphasis, and links, but no arbitrary HTML, styles, or scripts.

The application should validate minimum and maximum item counts, string lengths, URLs, money values, dates, and type-specific required fields before saving and again before publishing.

## Entity: ProposalRevision

An immutable snapshot created by a successful publish or republish operation.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Immutable revision identifier. |
| `proposalId` | ID | Yes | Parent proposal. |
| `revisionNumber` | positive integer | Yes | Monotonically increasing within the proposal. |
| `slugSnapshot` | string | Yes | Public slug at publication time. |
| `clientSnapshot` | JSON object | Yes | Public client name and organization at publication time. |
| `titleSnapshot` | string | Yes | Published title. |
| `currencySnapshot` | ISO 4217 code | Yes | Published currency. |
| `themeSnapshot` | `ThemeSettings` | Yes | Published presentation settings. |
| `contentSnapshot` | `ProposalContentSnapshot` | Yes | Complete ordered content required to render the public page. |
| `expiresAtSnapshot` | timestamp | No | Expiry applied to this exact revision. |
| `status` | `RevisionStatus` | Yes | Visibility state; content remains immutable. |
| `publishedByUserId` | ID | Yes | Workspace member who published it. |
| `publishedAt` | timestamp | Yes | Immutable publication time. |

### Status enum

```ts
type RevisionStatus = "CURRENT" | "SUPERSEDED" | "WITHDRAWN";
```

Only one revision per proposal may be `CURRENT`. Publishing a replacement changes the old revision from `CURRENT` to `SUPERSEDED`; it does not change the old content or response.

### Relationships and ownership

- Belongs to one proposal and inherits its workspace ownership.
- Has zero or one effective `ProposalResponse` in the MVP.
- The pair `(proposalId, revisionNumber)` is unique.
- A public request resolves the slug to a proposal and then renders only its current revision.

### Deletion behaviour

- Revisions are never edited or hard-deleted through normal product operations.
- Withdrawing a revision changes visibility status but retains the snapshot.
- A proposal deletion does not cascade to revisions.

## Entity: ProposalResponse

The client's accept or decline decision for one exact published revision.

### Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | ID | Yes | Internal response identifier. |
| `proposalRevisionId` | ID | Yes | Exact revision reviewed. |
| `decision` | `ProposalDecision` | Yes | Accepted or declined. |
| `respondentName` | string | No | Optional until identity requirements are decided. |
| `respondentEmail` | normalized email | No | Optional until identity requirements are decided. |
| `message` | string | No | Optional decline reason or client note. |
| `responseTokenHash` | string | No | Optional one-way hash for idempotent public submission; never store the raw secret. |
| `sourceIpHash` | string | No | Optional privacy-preserving abuse signal, subject to policy. |
| `userAgent` | string | No | Optional operational context with a defined retention period. |
| `respondedAt` | timestamp | Yes | Immutable decision time. |

### Status enum

```ts
type ProposalDecision = "ACCEPTED" | "DECLINED";
```

### Relationships and ownership

- Belongs to exactly one proposal revision.
- Inherits workspace ownership through revision → proposal.
- The MVP permits at most one effective response per revision.
- Duplicate submissions of the same decision must be idempotent.
- A conflicting later decision must be rejected rather than overwriting the first response.
- A response does not automatically apply to a later revision.

### Deletion behaviour

- Responses are immutable audit records and are not deleted through normal UI actions.
- Corrections or future decision reversals should create explicit audit events rather than editing the original response.
- Privacy erasure may redact respondent personal fields while retaining the decision, revision association, and timestamp when legally permissible.

## Draft and published content boundaries

### Draft content

`Proposal.draftContent` is a logical aggregate, not a second mutable JSON source of truth. It consists of:

- Mutable proposal-level values from `Proposal`, including title, client, currency, theme, expiry, and protection settings.
- Active `ProposalSection` rows ordered by `position`.

The recommended physical database design stores proposal-level fields on `Proposal` and block content on `ProposalSection`. Application code may assemble them into a typed `ProposalDraftContent` value for validation, preview, and publishing:

```ts
interface ProposalDraftContent {
  proposalId: string;
  title: string;
  client: { name: string; organizationName?: string };
  currency: string;
  theme: ThemeSettings;
  sections: ProposalSectionContent[];
  expiresAt?: string;
}
```

Private preview renders this assembled draft aggregate. The public route must never render it.

### Published content

`Proposal.publishedContentSnapshot` is a logical read alias for:

```ts
proposal.currentPublishedRevision?.contentSnapshot
```

It should not be stored as a second independent JSON copy on `Proposal`, because that would create two published sources of truth. `ProposalRevision.contentSnapshot` is authoritative.

A `ProposalContentSnapshot` includes all data needed to render without joining mutable `Client`, `Proposal`, or `ProposalSection` records:

```ts
interface ProposalContentSnapshot {
  schemaVersion: number;
  proposalId: string;
  title: string;
  client: { name: string; organizationName?: string };
  provider: { displayName: string; logoAssetUrl?: string };
  currency: string;
  theme: ThemeSettings;
  sections: ProposalSectionContent[];
  expiresAt?: string;
}
```

`schemaVersion` allows the renderer to support or migrate older snapshots after the draft schema evolves.

### Publish transaction

Publishing must happen as one atomic operation:

1. Authorize the active workspace member.
2. Load and validate the proposal plus its ordered active sections.
3. Lock or otherwise guard the next revision number.
4. Assemble a complete `ProposalContentSnapshot`.
5. Create a new immutable `ProposalRevision`.
6. Mark the previous current revision as `SUPERSEDED`.
7. Set `Proposal.currentPublishedRevisionId`, `publishedAt`, and `status`.
8. Commit all changes together.

If any step fails, the prior current revision remains public.

After publication:

- Editing the proposal or its sections changes only the draft.
- Private preview shows the changed draft.
- `/p/[slug]` continues to render the current immutable revision.
- Republishing creates a new revision; it never updates the old snapshot in place.
- An accepted revision remains exactly as accepted, even if the draft or client record later changes.
- A response always submits and stores the rendered revision ID, preventing a stale browser tab from silently accepting different content.

## Integrity constraints

The future persistence layer should enforce these constraints where possible:

- Unique normalized `User.email`.
- Unique active `Workspace.slug`.
- Unique active `(workspaceId, userId)` membership.
- Every workspace has at least one active owner, enforced transactionally.
- `Client.workspaceId` must match `Proposal.workspaceId`.
- Unique active public `Proposal.slug`.
- Unique active section `position` per proposal, or a deterministic sortable-key policy.
- `Proposal.currentPublishedRevisionId` must reference a revision belonging to that proposal.
- Unique `(proposalId, revisionNumber)`.
- At most one `CURRENT` revision per proposal.
- At most one effective response per revision.
- `passwordHash` is present if and only if password protection is enabled.
- Published monetary amounts use the revision's snapshotted currency.

## Decisions deferred until persistence work

- Database engine and hosting provider.
- ORM or query builder.
- Runtime validation library.
- Authentication and session provider.
- Password hashing algorithm and access-token strategy for protected proposals.
- Whether slugs are globally unique forever or retained as redirect aliases after a change.
- Exact data-retention and privacy-erasure periods.
- Whether old, superseded revisions remain publicly viewable or eligible for response.
