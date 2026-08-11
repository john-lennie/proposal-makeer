import { and, asc, desc, eq, isNull } from "drizzle-orm";

import { database } from "@/db/client";
import {
  clients,
  proposalResponses,
  proposalRevisions,
  proposalSections,
  proposals,
} from "@/db/schema";
import type {
  ProposalContentSnapshot,
  ProposalDraftContent,
} from "@/db/types";

export interface ProposalListItem {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  clientName: string;
  currentRevisionNumber: number | null;
  currentDecision: "ACCEPTED" | "DECLINED" | null;
  updatedAt: Date;
}

export async function listWorkspaceProposals(
  workspaceId: string,
): Promise<ProposalListItem[]> {
  const rows = await database
    .select({
      id: proposals.id,
      title: proposals.title,
      slug: proposals.slug,
      status: proposals.status,
      clientName: clients.name,
      currentRevisionNumber: proposalRevisions.revisionNumber,
      currentDecision: proposalResponses.decision,
      updatedAt: proposals.updatedAt,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .leftJoin(
      proposalRevisions,
      eq(proposals.currentPublishedRevisionId, proposalRevisions.id),
    )
    .leftJoin(
      proposalResponses,
      eq(proposalRevisions.id, proposalResponses.proposalRevisionId),
    )
    .where(
      and(
        eq(proposals.workspaceId, workspaceId),
        isNull(proposals.deletedAt),
      ),
    )
    .orderBy(desc(proposals.updatedAt));

  return rows;
}

export async function getProposalDraft(
  workspaceId: string,
  proposalId: string,
): Promise<ProposalDraftContent | null> {
  const proposal = await database
    .select({
      id: proposals.id,
      title: proposals.title,
      currency: proposals.currency,
      theme: proposals.themeSettings,
      expiresAt: proposals.expiresAt,
      clientName: clients.name,
      clientOrganizationName: clients.organizationName,
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .where(
      and(
        eq(proposals.id, proposalId),
        eq(proposals.workspaceId, workspaceId),
        isNull(proposals.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!proposal) {
    return null;
  }

  const sections = await database
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

  return {
    proposalId: proposal.id,
    title: proposal.title,
    client: {
      name: proposal.clientName,
      ...(proposal.clientOrganizationName
        ? { organizationName: proposal.clientOrganizationName }
        : {}),
    },
    currency: proposal.currency,
    theme: proposal.theme,
    sections: sections.map(({ content }) => content),
    ...(proposal.expiresAt
      ? { expiresAt: proposal.expiresAt.toISOString() }
      : {}),
  };
}

export interface PublishedProposal {
  proposalId: string;
  revisionId: string;
  revisionNumber: number;
  content: ProposalContentSnapshot;
  publishedAt: Date;
  decision: "ACCEPTED" | "DECLINED" | null;
  passwordProtected: boolean;
}

export async function getPublishedProposalBySlug(
  slug: string,
): Promise<PublishedProposal | null> {
  const row = await database
    .select({
      proposalId: proposals.id,
      revisionId: proposalRevisions.id,
      revisionNumber: proposalRevisions.revisionNumber,
      content: proposalRevisions.contentSnapshot,
      publishedAt: proposalRevisions.publishedAt,
      decision: proposalResponses.decision,
      passwordProtected: proposals.passwordProtectionEnabled,
    })
    .from(proposals)
    .innerJoin(
      proposalRevisions,
      eq(proposals.currentPublishedRevisionId, proposalRevisions.id),
    )
    .leftJoin(
      proposalResponses,
      eq(proposalRevisions.id, proposalResponses.proposalRevisionId),
    )
    .where(
      and(
        eq(proposalRevisions.slugSnapshot, slug),
        eq(proposals.status, "PUBLISHED"),
        eq(proposalRevisions.status, "CURRENT"),
        isNull(proposals.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);

  return row ?? null;
}
