import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import type {
  ProposalContentSnapshot,
  ProposalSectionContent,
} from "../src/db/types";
import { demoProposal } from "../src/lib/proposal";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

const ids = {
  user: "10000000-0000-4000-8000-000000000001",
  workspace: "20000000-0000-4000-8000-000000000001",
  member: "30000000-0000-4000-8000-000000000001",
  client: "40000000-0000-4000-8000-000000000001",
  proposal: "50000000-0000-4000-8000-000000000001",
  revision: "60000000-0000-4000-8000-000000000001",
} as const;

const sectionIds = [
  "70000000-0000-4000-8000-000000000001",
  "70000000-0000-4000-8000-000000000002",
  "70000000-0000-4000-8000-000000000003",
  "70000000-0000-4000-8000-000000000004",
  "70000000-0000-4000-8000-000000000005",
  "70000000-0000-4000-8000-000000000006",
  "70000000-0000-4000-8000-000000000007",
  "70000000-0000-4000-8000-000000000008",
  "70000000-0000-4000-8000-000000000009",
] as const;

const sourceSection = (id: (typeof demoProposal.sections)[number]["id"]) =>
  demoProposal.sections.find((section) => section.id === id)!;

const demoSections: ProposalSectionContent[] = [
  {
    id: sectionIds[0],
    type: "cover",
    eyebrow: sourceSection("cover").eyebrow,
    title: sourceSection("cover").title,
    subtitle: sourceSection("cover").body,
    preparedFor: demoProposal.client,
    preparedBy: demoProposal.company,
    location: demoProposal.clientLocation,
    dateLabel: "September 2026",
  },
  {
    id: sectionIds[1],
    type: "text",
    eyebrow: sourceSection("overview").eyebrow,
    title: sourceSection("overview").title,
    body: {
      version: 1,
      blocks: [{ type: "paragraph", text: sourceSection("overview").body }],
    },
  },
  {
    id: sectionIds[2],
    type: "objectives",
    eyebrow: sourceSection("objectives").eyebrow,
    title: sourceSection("objectives").title,
    introduction: sourceSection("objectives").body,
    items: demoProposal.objectives.map((text, index) => ({
      id: `objective-${index + 1}`,
      text,
    })),
  },
  {
    id: sectionIds[3],
    type: "scope",
    eyebrow: sourceSection("scope").eyebrow,
    title: sourceSection("scope").title,
    introduction: sourceSection("scope").body,
    items: demoProposal.scope.map((item, index) => ({
      id: `scope-${index + 1}`,
      title: item.title,
      description: item.description,
      includes: item.includes,
    })),
  },
  {
    id: sectionIds[4],
    type: "deliverables",
    eyebrow: sourceSection("deliverables").eyebrow,
    title: sourceSection("deliverables").title,
    introduction: sourceSection("deliverables").body,
    items: demoProposal.deliverables.map((title, index) => ({
      id: `deliverable-${index + 1}`,
      title,
    })),
  },
  {
    id: sectionIds[5],
    type: "timeline",
    eyebrow: sourceSection("timeline").eyebrow,
    title: sourceSection("timeline").title,
    introduction: sourceSection("timeline").body,
    phases: demoProposal.timeline.map((phase, index) => ({
      id: `phase-${index + 1}`,
      label: phase.date,
      title: phase.title,
      description: phase.description,
    })),
  },
  {
    id: sectionIds[6],
    type: "pricing",
    eyebrow: sourceSection("pricing").eyebrow,
    title: sourceSection("pricing").title,
    introduction: sourceSection("pricing").body,
    items: demoProposal.pricing.map((item, index) => ({
      id: `price-${index + 1}`,
      label: item.label,
      description: item.detail,
      amountMinor: item.amount * 100,
    })),
  },
  {
    id: sectionIds[7],
    type: "terms",
    eyebrow: sourceSection("terms").eyebrow,
    title: sourceSection("terms").title,
    items: demoProposal.terms.map((text, index) => ({
      id: `term-${index + 1}`,
      text,
    })),
  },
  {
    id: sectionIds[8],
    type: "acceptance",
    eyebrow: sourceSection("acceptance").eyebrow,
    title: sourceSection("acceptance").title,
    body: sourceSection("acceptance").body,
    acceptLabel: "Accept proposal",
    declineLabel: "Decline",
  },
];

const contentSnapshot: ProposalContentSnapshot = {
  schemaVersion: 1,
  proposalId: ids.proposal,
  title: demoProposal.title,
  client: {
    name: demoProposal.client,
  },
  provider: {
    displayName: demoProposal.company,
  },
  currency: "CAD",
  theme: {
    accentColor: "#677057",
    displayName: demoProposal.company,
  },
  sections: demoSections,
  expiresAt: "2026-08-14T23:59:59.000Z",
};

async function main() {
  const { database } = await import("../src/db/client");
  try {
    const { eq } = await import("drizzle-orm");
    const {
      clients,
      proposalRevisions,
      proposalSections,
      proposals,
      users,
      workspaceMembers,
      workspaces,
    } = await import("../src/db/schema");

    await database.transaction(async (transaction) => {
    await transaction
      .insert(users)
      .values({
        id: ids.user,
        email: "demo@northandfinch.example",
        name: "Julian Laurent",
        emailVerified: true,
        status: "ACTIVE",
      })
      .onConflictDoNothing();

    await transaction
      .insert(workspaces)
      .values({
        id: ids.workspace,
        name: demoProposal.company,
        slug: "north-and-finch",
        defaultCurrency: "CAD",
        timezone: "America/Toronto",
      })
      .onConflictDoNothing();

    await transaction
      .insert(workspaceMembers)
      .values({
        id: ids.member,
        workspaceId: ids.workspace,
        userId: ids.user,
        role: "OWNER",
        status: "ACTIVE",
        joinedAt: new Date("2026-07-01T14:00:00.000Z"),
      })
      .onConflictDoNothing();

    await transaction
      .insert(clients)
      .values({
        id: ids.client,
        workspaceId: ids.workspace,
        name: demoProposal.client,
        organizationName: "The Beaumont Residence",
        status: "ACTIVE",
        createdByUserId: ids.user,
      })
      .onConflictDoNothing();

    await transaction
      .insert(proposals)
      .values({
        id: ids.proposal,
        workspaceId: ids.workspace,
        clientId: ids.client,
        title: demoProposal.title,
        slug: demoProposal.slug,
        status: "PUBLISHED",
        currency: "CAD",
        themeSettings: contentSnapshot.theme,
        publishedAt: new Date("2026-07-18T15:00:00.000Z"),
        expiresAt: new Date("2026-08-14T23:59:59.000Z"),
        createdByUserId: ids.user,
        lastEditedByUserId: ids.user,
      })
      .onConflictDoNothing();

    await transaction
      .insert(proposalSections)
      .values(
        demoSections.map((content, position) => ({
          id: sectionIds[position],
          proposalId: ids.proposal,
          type: content.type,
          position,
          content,
          isVisible: true,
        })),
      )
      .onConflictDoNothing();

    await transaction
      .insert(proposalRevisions)
      .values({
        id: ids.revision,
        proposalId: ids.proposal,
        revisionNumber: 1,
        slugSnapshot: demoProposal.slug,
        clientSnapshot: {
          name: demoProposal.client,
          organizationName: "The Beaumont Residence",
        },
        titleSnapshot: demoProposal.title,
        currencySnapshot: "CAD",
        themeSnapshot: contentSnapshot.theme,
        contentSnapshot,
        expiresAtSnapshot: new Date("2026-08-14T23:59:59.000Z"),
        status: "CURRENT",
        publishedByUserId: ids.user,
        publishedAt: new Date("2026-07-18T15:00:00.000Z"),
      })
      .onConflictDoNothing();

    await transaction
      .update(proposals)
      .set({ currentPublishedRevisionId: ids.revision })
      .where(eq(proposals.id, ids.proposal));
    });

    console.log("Seeded the North & Finch demo proposal.");
  } finally {
    await database.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? `Seed failed: ${error.message}` : "Seed failed.",
  );
  process.exitCode = 1;
});
