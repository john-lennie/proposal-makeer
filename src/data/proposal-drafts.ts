import {
  and,
  asc,
  desc,
  eq,
  ilike,
  isNull,
  max,
  sql,
} from "drizzle-orm";

import { database } from "@/db/client";
import {
  clients,
  proposalRevisions,
  proposalSections,
  proposals,
  workspaces,
} from "@/db/schema";
import type {
  ProposalSectionContent,
  ProposalSectionType,
  ThemeSettings,
} from "@/db/types";
import { resolveBrand } from "@/lib/brand";
import { createDefaultProposalSections } from "@/lib/draft-proposal";
import { proposalResponseUrl } from "@/lib/proposal-response-token";

export interface EditableProposal {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  currency: string;
  theme: ThemeSettings;
  client: {
    id: string;
    name: string;
  };
  updatedAt: string;
  publication: {
    currentRevisionNumber: number | null;
    currentPublishedAt: string | null;
    currentPublishedSlug: string | null;
    currentResponseUrl: string | null;
    latestRevisionNumber: number;
    hasUnpublishedChanges: boolean;
  };
  sections: Array<{
    id: string;
    type: ProposalSectionType;
    position: number;
    content: ProposalSectionContent;
  }>;
}

export type DraftMutationResult =
  | { status: "ok"; updatedAt: string }
  | { status: "conflict"; message: string }
  | { status: "not_found"; message: string }
  | { status: "invalid"; message: string }
  | { status: "slug_taken"; message: string };

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function getEditableProposal(
  workspaceId: string,
  proposalId: string,
): Promise<EditableProposal | null> {
  const proposal = await database
    .select({
      id: proposals.id,
      title: proposals.title,
      slug: proposals.slug,
      status: proposals.status,
      currency: proposals.currency,
      theme: proposals.themeSettings,
      workspaceBrand: workspaces.brandSettings,
      workspaceName: workspaces.name,
      clientId: clients.id,
      clientName: clients.name,
      updatedAt: proposals.updatedAt,
      currentPublishedRevisionId: proposals.currentPublishedRevisionId,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .innerJoin(workspaces, eq(proposals.workspaceId, workspaces.id))
    .where(
      and(
        eq(proposals.id, proposalId),
        eq(proposals.workspaceId, workspaceId),
        isNull(proposals.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!proposal) return null;

  const sections = await database
    .select({
      id: proposalSections.id,
      type: proposalSections.type,
      position: proposalSections.position,
      content: proposalSections.content,
    })
    .from(proposalSections)
    .where(
      and(
        eq(proposalSections.proposalId, proposal.id),
        isNull(proposalSections.deletedAt),
      ),
    )
    .orderBy(asc(proposalSections.position));

  const revisions = await database
    .select({
      id: proposalRevisions.id,
      revisionNumber: proposalRevisions.revisionNumber,
      publishedAt: proposalRevisions.publishedAt,
      slug: proposalRevisions.slugSnapshot,
    })
    .from(proposalRevisions)
    .where(eq(proposalRevisions.proposalId, proposal.id))
    .orderBy(desc(proposalRevisions.revisionNumber));
  const currentRevision = revisions.find(
    ({ id }) => id === proposal.currentPublishedRevisionId,
  );

  return {
    id: proposal.id,
    title: proposal.title,
    slug: proposal.slug,
    status: proposal.status,
    currency: proposal.currency,
    theme: resolveBrand(proposal.workspaceBrand, { displayName: proposal.workspaceName, ...proposal.theme }),
    client: { id: proposal.clientId, name: proposal.clientName },
    updatedAt: proposal.updatedAt.toISOString(),
    publication: {
      currentRevisionNumber: currentRevision?.revisionNumber ?? null,
      currentPublishedAt: currentRevision?.publishedAt.toISOString() ?? null,
      currentPublishedSlug: currentRevision?.slug ?? null,
      currentResponseUrl: currentRevision
        ? proposalResponseUrl(currentRevision.slug, currentRevision.id)
        : null,
      latestRevisionNumber: revisions[0]?.revisionNumber ?? 0,
      hasUnpublishedChanges:
        !currentRevision ||
        proposal.updatedAt.getTime() > currentRevision.publishedAt.getTime(),
    },
    sections,
  };
}

export async function getDraftSection(
  workspaceId: string,
  proposalId: string,
  sectionId: string,
) {
  return database
    .select({
      id: proposalSections.id,
      type: proposalSections.type,
      content: proposalSections.content,
    })
    .from(proposalSections)
    .innerJoin(proposals, eq(proposalSections.proposalId, proposals.id))
    .where(
      and(
        eq(proposalSections.id, sectionId),
        eq(proposalSections.proposalId, proposalId),
        eq(proposals.workspaceId, workspaceId),
        isNull(proposalSections.deletedAt),
        isNull(proposals.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

async function availableSlug(base: string): Promise<string> {
  const rows = await database
    .select({ slug: proposals.slug })
    .from(proposals)
    .where(and(ilike(proposals.slug, `${base}%`), isNull(proposals.deletedAt)));
  const existing = new Set(rows.map(({ slug }) => slug));

  if (!existing.has(base)) return base;

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!existing.has(candidate)) return candidate;
  }

  throw new Error("Unable to allocate a unique proposal slug.");
}

export async function createProposalDraft(input: {
  workspaceId: string;
  userId: string;
  title: string;
  clientName: string;
  slugBase: string;
}): Promise<{ id: string }> {
  const slug = await availableSlug(input.slugBase);
  const sectionContents = createDefaultProposalSections(
    input.title,
    input.clientName,
  );

  try {
    return await database.transaction(async (transaction) => {
      const [workspace] = await transaction.select({ name: workspaces.name, brand: workspaces.brandSettings })
        .from(workspaces).where(and(eq(workspaces.id, input.workspaceId), isNull(workspaces.deletedAt))).limit(1);
      if (!workspace) throw new Error("Workspace not found.");
      const studioName = workspace.brand.displayName ?? workspace.name;
      const [client] = await transaction
        .insert(clients)
        .values({
          workspaceId: input.workspaceId,
          name: input.clientName,
          createdByUserId: input.userId,
        })
        .returning({ id: clients.id });

      const [proposal] = await transaction
        .insert(proposals)
        .values({
          workspaceId: input.workspaceId,
          clientId: client.id,
          title: input.title,
          slug,
          status: "DRAFT",
          currency: "CAD",
          createdByUserId: input.userId,
          lastEditedByUserId: input.userId,
        })
        .returning({ id: proposals.id });

      await transaction.insert(proposalSections).values(
        sectionContents.map((content, position) => ({
          id: content.id,
          proposalId: proposal.id,
          type: content.type,
          position,
          content: content.type === "cover" ? { ...content, preparedBy: studioName } : content,
        })),
      );

      return proposal;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("That proposal slug was just taken. Please try again.");
    }
    throw error;
  }
}

export async function updateProposalDetails(input: {
  workspaceId: string;
  userId: string;
  proposalId: string;
  expectedUpdatedAt: string;
  title: string;
  clientName: string;
  slug: string;
}): Promise<DraftMutationResult> {
  const updatedAt = new Date();

  try {
    return await database.transaction(async (transaction) => {
      const [updated] = await transaction
        .update(proposals)
        .set({
          title: input.title,
          slug: input.slug,
          lastEditedByUserId: input.userId,
          updatedAt,
        })
        .where(
          and(
            eq(proposals.id, input.proposalId),
            eq(proposals.workspaceId, input.workspaceId),
            sql`date_trunc('milliseconds', ${proposals.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
            isNull(proposals.deletedAt),
          ),
        )
        .returning({ clientId: proposals.clientId });

      if (!updated) {
        return {
          status: "conflict" as const,
          message:
            "This proposal changed in another session. Refresh before saving again.",
        };
      }

      await transaction
        .update(clients)
        .set({ name: input.clientName, updatedAt })
        .where(
          and(
            eq(clients.id, updated.clientId),
            eq(clients.workspaceId, input.workspaceId),
            isNull(clients.deletedAt),
          ),
        );

      return { status: "ok" as const, updatedAt: updatedAt.toISOString() };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "slug_taken",
        message: "That public slug is already used by another proposal.",
      };
    }
    throw error;
  }
}

export async function updateDraftSection(input: {
  workspaceId: string;
  userId: string;
  proposalId: string;
  sectionId: string;
  expectedUpdatedAt: string;
  content: ProposalSectionContent;
}): Promise<DraftMutationResult> {
  const updatedAt = new Date();

  return database.transaction(async (transaction) => {
    const [claimed] = await transaction
      .update(proposals)
      .set({ updatedAt, lastEditedByUserId: input.userId })
      .where(
        and(
          eq(proposals.id, input.proposalId),
          eq(proposals.workspaceId, input.workspaceId),
          sql`date_trunc('milliseconds', ${proposals.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
          isNull(proposals.deletedAt),
        ),
      )
      .returning({ id: proposals.id });

    if (!claimed) {
      return {
        status: "conflict",
        message:
          "This proposal changed in another session. Refresh before saving again.",
      };
    }

    const [section] = await transaction
      .update(proposalSections)
      .set({ content: input.content, updatedAt })
      .where(
        and(
          eq(proposalSections.id, input.sectionId),
          eq(proposalSections.proposalId, input.proposalId),
          eq(proposalSections.type, input.content.type),
          isNull(proposalSections.deletedAt),
        ),
      )
      .returning({ id: proposalSections.id });

    if (!section) {
      transaction.rollback();
    }

    return { status: "ok", updatedAt: updatedAt.toISOString() };
  });
}

export async function addDraftSection(input: {
  workspaceId: string;
  userId: string;
  proposalId: string;
  expectedUpdatedAt: string;
  content: ProposalSectionContent;
}): Promise<DraftMutationResult> {
  const updatedAt = new Date();

  return database.transaction(async (transaction) => {
    const proposal = await transaction
      .select({ id: proposals.id })
      .from(proposals)
      .where(
        and(
          eq(proposals.id, input.proposalId),
          eq(proposals.workspaceId, input.workspaceId),
          isNull(proposals.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!proposal) {
      return { status: "not_found", message: "Proposal not found." };
    }

    const existingTypes = await transaction
      .select({ type: proposalSections.type })
      .from(proposalSections)
      .where(
        and(
          eq(proposalSections.proposalId, input.proposalId),
          isNull(proposalSections.deletedAt),
        ),
      );

    if (existingTypes.some(({ type }) => type === input.content.type)) {
      return {
        status: "invalid",
        message: "That section type is already in this proposal.",
      };
    }

    const [claimed] = await transaction
      .update(proposals)
      .set({ updatedAt, lastEditedByUserId: input.userId })
      .where(
        and(
          eq(proposals.id, input.proposalId),
          eq(proposals.workspaceId, input.workspaceId),
          sql`date_trunc('milliseconds', ${proposals.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
          isNull(proposals.deletedAt),
        ),
      )
      .returning({ id: proposals.id });

    if (!claimed) {
      return {
        status: "conflict",
        message:
          "This proposal changed in another session. Refresh before adding a section.",
      };
    }

    const [{ maximum }] = await transaction
      .select({ maximum: max(proposalSections.position) })
      .from(proposalSections)
      .where(
        and(
          eq(proposalSections.proposalId, input.proposalId),
          isNull(proposalSections.deletedAt),
        ),
      );

    await transaction.insert(proposalSections).values({
      id: input.content.id,
      proposalId: input.proposalId,
      type: input.content.type,
      position: (maximum ?? -1) + 1,
      content: input.content,
    });

    return { status: "ok", updatedAt: updatedAt.toISOString() };
  });
}

export async function removeDraftSection(input: {
  workspaceId: string;
  userId: string;
  proposalId: string;
  sectionId: string;
  expectedUpdatedAt: string;
}): Promise<DraftMutationResult> {
  const updatedAt = new Date();

  return database.transaction(async (transaction) => {
    const [section] = await transaction
      .select({ type: proposalSections.type })
      .from(proposalSections)
      .innerJoin(proposals, eq(proposalSections.proposalId, proposals.id))
      .where(
        and(
          eq(proposalSections.id, input.sectionId),
          eq(proposalSections.proposalId, input.proposalId),
          eq(proposals.workspaceId, input.workspaceId),
          isNull(proposalSections.deletedAt),
          isNull(proposals.deletedAt),
        ),
      )
      .limit(1);

    if (!section) {
      return { status: "not_found", message: "Section not found." };
    }
    if (section.type === "cover" || section.type === "acceptance") {
      return {
        status: "invalid",
        message: "Cover and acceptance sections are required.",
      };
    }

    const [claimed] = await transaction
      .update(proposals)
      .set({ updatedAt, lastEditedByUserId: input.userId })
      .where(
        and(
          eq(proposals.id, input.proposalId),
          eq(proposals.workspaceId, input.workspaceId),
          sql`date_trunc('milliseconds', ${proposals.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
          isNull(proposals.deletedAt),
        ),
      )
      .returning({ id: proposals.id });

    if (!claimed) {
      return {
        status: "conflict",
        message:
          "This proposal changed in another session. Refresh before removing a section.",
      };
    }

    await transaction
      .update(proposalSections)
      .set({ deletedAt: updatedAt, updatedAt })
      .where(eq(proposalSections.id, input.sectionId));

    return { status: "ok", updatedAt: updatedAt.toISOString() };
  });
}

export async function moveDraftSection(input: {
  workspaceId: string;
  userId: string;
  proposalId: string;
  sectionId: string;
  direction: "up" | "down";
  expectedUpdatedAt: string;
}): Promise<DraftMutationResult> {
  const updatedAt = new Date();

  return database.transaction(async (transaction) => {
    const sections = await transaction
      .select({ id: proposalSections.id, position: proposalSections.position })
      .from(proposalSections)
      .innerJoin(proposals, eq(proposalSections.proposalId, proposals.id))
      .where(
        and(
          eq(proposalSections.proposalId, input.proposalId),
          eq(proposals.workspaceId, input.workspaceId),
          isNull(proposalSections.deletedAt),
          isNull(proposals.deletedAt),
        ),
      )
      .orderBy(asc(proposalSections.position));

    const currentIndex = sections.findIndex(({ id }) => id === input.sectionId);
    const targetIndex =
      input.direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= sections.length
    ) {
      return { status: "invalid", message: "Section cannot move further." };
    }

    const [claimed] = await transaction
      .update(proposals)
      .set({ updatedAt, lastEditedByUserId: input.userId })
      .where(
        and(
          eq(proposals.id, input.proposalId),
          eq(proposals.workspaceId, input.workspaceId),
          sql`date_trunc('milliseconds', ${proposals.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
          isNull(proposals.deletedAt),
        ),
      )
      .returning({ id: proposals.id });

    if (!claimed) {
      return {
        status: "conflict",
        message:
          "This proposal changed in another session. Refresh before reordering.",
      };
    }

    const current = sections[currentIndex];
    const target = sections[targetIndex];
    const temporaryPosition =
      Math.max(...sections.map(({ position }) => position)) + 1;

    await transaction
      .update(proposalSections)
      .set({ position: temporaryPosition, updatedAt })
      .where(eq(proposalSections.id, current.id));
    await transaction
      .update(proposalSections)
      .set({ position: current.position, updatedAt })
      .where(eq(proposalSections.id, target.id));
    await transaction
      .update(proposalSections)
      .set({ position: target.position, updatedAt })
      .where(eq(proposalSections.id, current.id));

    return { status: "ok", updatedAt: updatedAt.toISOString() };
  });
}
