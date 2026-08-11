import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import type {
  ClientSnapshot,
  ProposalContentSnapshot,
  ProposalSectionContent,
  ThemeSettings,
} from "@/db/types";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const userStatusEnum = pgEnum("user_status", [
  "INVITED",
  "ACTIVE",
  "DISABLED",
]);
export const workspaceStatusEnum = pgEnum("workspace_status", [
  "ACTIVE",
  "SUSPENDED",
  "PENDING_DELETION",
]);
export const workspaceRoleEnum = pgEnum("workspace_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "INVITED",
  "ACTIVE",
  "SUSPENDED",
]);
export const clientStatusEnum = pgEnum("client_status", [
  "ACTIVE",
  "ARCHIVED",
]);
export const proposalStatusEnum = pgEnum("proposal_status", [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);
export const proposalSectionTypeEnum = pgEnum("proposal_section_type", [
  "cover",
  "text",
  "objectives",
  "scope",
  "deliverables",
  "timeline",
  "pricing",
  "terms",
  "acceptance",
]);
export const revisionStatusEnum = pgEnum("revision_status", [
  "CURRENT",
  "SUPERSEDED",
  "WITHDRAWN",
]);
export const proposalDecisionEnum = pgEnum("proposal_decision", [
  "ACCEPTED",
  "DECLINED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    avatarUrl: text("avatar_url"),
    emailVerified: boolean("email_verified").default(false).notNull(),
    status: userStatusEnum("status").default("ACTIVE").notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("sessions_token_unique").on(table.token),
    index("sessions_user_idx").on(table.userId),
  ],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("accounts_provider_account_unique").on(
      table.providerId,
      table.accountId,
    ),
    index("accounts_user_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("verifications_identifier_idx").on(table.identifier),
  ],
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    status: workspaceStatusEnum("status").default("ACTIVE").notNull(),
    defaultCurrency: varchar("default_currency", { length: 3 })
      .default("CAD")
      .notNull(),
    timezone: varchar("timezone", { length: 100 })
      .default("America/Toronto")
      .notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspaces_slug_unique")
      .on(table.slug)
      .where(sql`${table.deletedAt} is null`),
    check(
      "workspaces_currency_format",
      sql`${table.defaultCurrency} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    role: workspaceRoleEnum("role").notNull(),
    status: membershipStatusEnum("status").default("ACTIVE").notNull(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workspace_members_active_unique")
      .on(table.workspaceId, table.userId)
      .where(sql`${table.deletedAt} is null`),
    index("workspace_members_user_idx").on(table.userId),
  ],
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    name: varchar("name", { length: 160 }).notNull(),
    organizationName: varchar("organization_name", { length: 200 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 50 }),
    notes: text("notes"),
    status: clientStatusEnum("status").default("ACTIVE").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("clients_workspace_id_unique").on(table.workspaceId, table.id),
    index("clients_workspace_idx").on(table.workspaceId),
    index("clients_workspace_status_idx").on(table.workspaceId, table.status),
  ],
);

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "restrict" }),
    clientId: uuid("client_id").notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    status: proposalStatusEnum("status").default("DRAFT").notNull(),
    currency: varchar("currency", { length: 3 }).default("CAD").notNull(),
    themeSettings: jsonb("theme_settings")
      .$type<ThemeSettings>()
      .default({})
      .notNull(),
    currentPublishedRevisionId: uuid("current_published_revision_id").references(
      (): AnyPgColumn => proposalRevisions.id,
      { onDelete: "restrict" },
    ),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    passwordProtectionEnabled: boolean("password_protection_enabled")
      .default(false)
      .notNull(),
    passwordHash: text("password_hash"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    lastEditedByUserId: uuid("last_edited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      name: "proposals_client_workspace_fk",
      columns: [table.workspaceId, table.clientId],
      foreignColumns: [clients.workspaceId, clients.id],
    }).onDelete("restrict"),
    uniqueIndex("proposals_slug_unique")
      .on(table.slug)
      .where(sql`${table.deletedAt} is null`),
    index("proposals_workspace_idx").on(table.workspaceId),
    index("proposals_client_idx").on(table.clientId),
    check("proposals_currency_format", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    check(
      "proposals_password_consistency",
      sql`(${table.passwordProtectionEnabled} = false and ${table.passwordHash} is null) or (${table.passwordProtectionEnabled} = true and ${table.passwordHash} is not null)`,
    ),
  ],
);

export const proposalSections = pgTable(
  "proposal_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "restrict" }),
    type: proposalSectionTypeEnum("type").notNull(),
    position: integer("position").notNull(),
    content: jsonb("content").$type<ProposalSectionContent>().notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("proposal_sections_active_position_unique")
      .on(table.proposalId, table.position)
      .where(sql`${table.deletedAt} is null`),
    index("proposal_sections_proposal_idx").on(table.proposalId),
    check("proposal_sections_position_positive", sql`${table.position} >= 0`),
  ],
);

export const proposalRevisions = pgTable(
  "proposal_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "restrict" }),
    revisionNumber: integer("revision_number").notNull(),
    slugSnapshot: varchar("slug_snapshot", { length: 120 }).notNull(),
    clientSnapshot: jsonb("client_snapshot").$type<ClientSnapshot>().notNull(),
    titleSnapshot: varchar("title_snapshot", { length: 240 }).notNull(),
    currencySnapshot: varchar("currency_snapshot", { length: 3 }).notNull(),
    themeSnapshot: jsonb("theme_snapshot").$type<ThemeSettings>().notNull(),
    contentSnapshot: jsonb("content_snapshot")
      .$type<ProposalContentSnapshot>()
      .notNull(),
    expiresAtSnapshot: timestamp("expires_at_snapshot", {
      withTimezone: true,
    }),
    status: revisionStatusEnum("status").notNull(),
    publishedByUserId: uuid("published_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("proposal_revisions_number_unique").on(
      table.proposalId,
      table.revisionNumber,
    ),
    uniqueIndex("proposal_revisions_current_unique")
      .on(table.proposalId)
      .where(sql`${table.status} = 'CURRENT'`),
    index("proposal_revisions_proposal_idx").on(table.proposalId),
    check(
      "proposal_revisions_number_positive",
      sql`${table.revisionNumber} > 0`,
    ),
    check(
      "proposal_revisions_currency_format",
      sql`${table.currencySnapshot} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export const proposalResponses = pgTable(
  "proposal_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalRevisionId: uuid("proposal_revision_id")
      .notNull()
      .references(() => proposalRevisions.id, { onDelete: "restrict" }),
    decision: proposalDecisionEnum("decision").notNull(),
    respondentName: varchar("respondent_name", { length: 160 }),
    respondentEmail: varchar("respondent_email", { length: 320 }),
    message: text("message"),
    responseTokenHash: text("response_token_hash"),
    sourceIpHash: text("source_ip_hash"),
    userAgent: text("user_agent"),
    respondedAt: timestamp("responded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("proposal_responses_revision_unique").on(
      table.proposalRevisionId,
    ),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMembers),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  clients: many(clients),
  proposals: many(proposals),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
      relationName: "workspaceMemberUser",
    }),
    invitedBy: one(users, {
      fields: [workspaceMembers.invitedByUserId],
      references: [users.id],
      relationName: "workspaceMemberInviter",
    }),
  }),
);

export const clientsRelations = relations(clients, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [clients.workspaceId],
    references: [workspaces.id],
  }),
  proposals: many(proposals),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [proposals.workspaceId],
    references: [workspaces.id],
  }),
  client: one(clients, {
    fields: [proposals.clientId],
    references: [clients.id],
  }),
  sections: many(proposalSections),
  revisions: many(proposalRevisions),
  currentPublishedRevision: one(proposalRevisions, {
    fields: [proposals.currentPublishedRevisionId],
    references: [proposalRevisions.id],
    relationName: "currentPublishedRevision",
  }),
}));

export const proposalSectionsRelations = relations(
  proposalSections,
  ({ one }) => ({
    proposal: one(proposals, {
      fields: [proposalSections.proposalId],
      references: [proposals.id],
    }),
  }),
);

export const proposalRevisionsRelations = relations(
  proposalRevisions,
  ({ one }) => ({
    proposal: one(proposals, {
      fields: [proposalRevisions.proposalId],
      references: [proposals.id],
    }),
    currentForProposal: one(proposals, {
      fields: [proposalRevisions.id],
      references: [proposals.currentPublishedRevisionId],
      relationName: "currentPublishedRevision",
    }),
    response: one(proposalResponses),
  }),
);

export const proposalResponsesRelations = relations(
  proposalResponses,
  ({ one }) => ({
    revision: one(proposalRevisions, {
      fields: [proposalResponses.proposalRevisionId],
      references: [proposalRevisions.id],
    }),
  }),
);
