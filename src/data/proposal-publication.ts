import { and, asc, eq, isNull, max, ne, sql } from "drizzle-orm";

import { database } from "@/db/client";
import {
  clients,
  proposalRevisions,
  proposalSections,
  proposals,
  workspaces,
} from "@/db/schema";
import type { ProposalContentSnapshot } from "@/db/types";
import { validateProposalForPublication } from "@/lib/proposal-publication";

export type PublicationMutationResult =
  | {
      status: "ok";
      publicUrl: string;
      revisionNumber: number;
      publishedAt: string;
      updatedAt: string;
    }
  | { status: "conflict" | "invalid" | "not_found"; message: string };

function snapshotFor(input: {
  proposalId: string;
  title: string;
  clientName: string;
  clientOrganizationName: string | null;
  workspaceName: string;
  currency: string;
  theme: ProposalContentSnapshot["theme"];
  sections: ProposalContentSnapshot["sections"];
  expiresAt: Date | null;
}): ProposalContentSnapshot {
  return {
    schemaVersion: 1,
    proposalId: input.proposalId,
    title: input.title,
    client: {
      name: input.clientName,
      ...(input.clientOrganizationName
        ? { organizationName: input.clientOrganizationName }
        : {}),
    },
    provider: {
      displayName: input.theme.displayName ?? input.workspaceName,
      ...(input.theme.logoAssetUrl
        ? { logoAssetUrl: input.theme.logoAssetUrl }
        : {}),
    },
    currency: input.currency,
    theme: input.theme,
    sections: input.sections,
    ...(input.expiresAt
      ? { expiresAt: input.expiresAt.toISOString() }
      : {}),
  };
}

export async function publishProposalDraft(input: {
  workspaceId: string;
  userId: string;
  proposalId: string;
  expectedUpdatedAt: string;
}): Promise<PublicationMutationResult> {
  return database.transaction(async (transaction) => {
    await transaction.execute(
      sql`select ${proposals.id} from ${proposals}
          where ${proposals.id} = ${input.proposalId}
            and ${proposals.workspaceId} = ${input.workspaceId}
            and ${proposals.deletedAt} is null
          for update`,
    );

    const proposal = await transaction
      .select({
        id: proposals.id,
        title: proposals.title,
        slug: proposals.slug,
        currency: proposals.currency,
        theme: proposals.themeSettings,
        expiresAt: proposals.expiresAt,
        updatedAt: proposals.updatedAt,
        currentPublishedRevisionId: proposals.currentPublishedRevisionId,
        clientName: clients.name,
        clientOrganizationName: clients.organizationName,
        workspaceName: workspaces.name,
      })
      .from(proposals)
      .innerJoin(
        clients,
        and(
          eq(proposals.clientId, clients.id),
          eq(proposals.workspaceId, clients.workspaceId),
          isNull(clients.deletedAt),
        ),
      )
      .innerJoin(workspaces, eq(proposals.workspaceId, workspaces.id))
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

    if (
      proposal.updatedAt.getTime() !==
      new Date(input.expectedUpdatedAt).getTime()
    ) {
      return {
        status: "conflict",
        message:
          "The draft changed before it could be published. Refresh and try again.",
      };
    }

    const duplicateSlug = await transaction
      .select({ id: proposals.id })
      .from(proposals)
      .where(
        and(
          eq(proposals.slug, proposal.slug),
          ne(proposals.id, proposal.id),
          isNull(proposals.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (duplicateSlug) {
      return {
        status: "invalid",
        message: "That public slug is already used by another proposal.",
      };
    }

    const sections = await transaction
      .select({ content: proposalSections.content })
      .from(proposalSections)
      .where(
        and(
          eq(proposalSections.proposalId, proposal.id),
          eq(proposalSections.isVisible, true),
          isNull(proposalSections.deletedAt),
        ),
      )
      .orderBy(asc(proposalSections.position));

    const validation = validateProposalForPublication({
      slug: proposal.slug,
      snapshot: snapshotFor({
        proposalId: proposal.id,
        title: proposal.title,
        clientName: proposal.clientName,
        clientOrganizationName: proposal.clientOrganizationName,
        workspaceName: proposal.workspaceName,
        currency: proposal.currency,
        theme: proposal.theme,
        sections: sections.map(({ content }) => content),
        expiresAt: proposal.expiresAt,
      }),
    });

    if (!validation.success) {
      return { status: "invalid", message: validation.message };
    }

    const latestRevisionNumber =
      (
        await transaction
          .select({ value: max(proposalRevisions.revisionNumber) })
          .from(proposalRevisions)
          .where(eq(proposalRevisions.proposalId, proposal.id))
          .then((rows) => rows[0]?.value)
      ) ?? 0;
    const revisionNumber = latestRevisionNumber + 1;
    const publishedAt = new Date();

    if (proposal.currentPublishedRevisionId) {
      await transaction
        .update(proposalRevisions)
        .set({ status: "SUPERSEDED" })
        .where(
          and(
            eq(
              proposalRevisions.id,
              proposal.currentPublishedRevisionId,
            ),
            eq(proposalRevisions.proposalId, proposal.id),
            eq(proposalRevisions.status, "CURRENT"),
          ),
        );
    }

    const revision = await transaction
      .insert(proposalRevisions)
      .values({
        proposalId: proposal.id,
        revisionNumber,
        slugSnapshot: proposal.slug,
        clientSnapshot: validation.snapshot.client,
        titleSnapshot: validation.snapshot.title,
        currencySnapshot: validation.snapshot.currency,
        themeSnapshot: validation.snapshot.theme,
        contentSnapshot: validation.snapshot,
        expiresAtSnapshot: proposal.expiresAt,
        status: "CURRENT",
        publishedByUserId: input.userId,
        publishedAt,
      })
      .returning({ id: proposalRevisions.id })
      .then((rows) => rows[0]);

    await transaction
      .update(proposals)
      .set({
        status: "PUBLISHED",
        currentPublishedRevisionId: revision.id,
        publishedAt,
        updatedAt: publishedAt,
      })
      .where(
        and(
          eq(proposals.id, proposal.id),
          eq(proposals.workspaceId, input.workspaceId),
        ),
      );

    return {
      status: "ok",
      publicUrl: `/p/${proposal.slug}`,
      revisionNumber,
      publishedAt: publishedAt.toISOString(),
      updatedAt: publishedAt.toISOString(),
    };
  });
}

export async function unpublishProposal(input: {
  workspaceId: string;
  proposalId: string;
  expectedUpdatedAt: string;
}): Promise<PublicationMutationResult> {
  return database.transaction(async (transaction) => {
    await transaction.execute(
      sql`select ${proposals.id} from ${proposals}
          where ${proposals.id} = ${input.proposalId}
            and ${proposals.workspaceId} = ${input.workspaceId}
            and ${proposals.deletedAt} is null
          for update`,
    );

    const proposal = await transaction
      .select({
        id: proposals.id,
        slug: proposals.slug,
        updatedAt: proposals.updatedAt,
        currentPublishedRevisionId: proposals.currentPublishedRevisionId,
      })
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

    if (
      proposal.updatedAt.getTime() !==
      new Date(input.expectedUpdatedAt).getTime()
    ) {
      return {
        status: "conflict",
        message:
          "The proposal changed before it could be unpublished. Refresh and try again.",
      };
    }

    if (!proposal.currentPublishedRevisionId) {
      return {
        status: "invalid",
        message: "This proposal is already unpublished.",
      };
    }

    const unpublishedAt = new Date();

    await transaction
      .update(proposalRevisions)
      .set({ status: "WITHDRAWN" })
      .where(
        and(
          eq(proposalRevisions.id, proposal.currentPublishedRevisionId),
          eq(proposalRevisions.proposalId, proposal.id),
          eq(proposalRevisions.status, "CURRENT"),
        ),
      );

    await transaction
      .update(proposals)
      .set({
        status: "DRAFT",
        currentPublishedRevisionId: null,
        publishedAt: null,
        updatedAt: unpublishedAt,
      })
      .where(
        and(
          eq(proposals.id, proposal.id),
          eq(proposals.workspaceId, input.workspaceId),
        ),
      );

    return {
      status: "ok",
      publicUrl: `/p/${proposal.slug}`,
      revisionNumber: 0,
      publishedAt: unpublishedAt.toISOString(),
      updatedAt: unpublishedAt.toISOString(),
    };
  });
}
