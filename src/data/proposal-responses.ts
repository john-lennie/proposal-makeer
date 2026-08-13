import { and, eq, isNull, sql } from "drizzle-orm";

import { database } from "@/db/client";
import {
  proposalResponses,
  proposalRevisions,
  proposals,
} from "@/db/schema";
import { parseProposalContentSnapshot } from "@/lib/published-proposal";
import {
  hashProposalResponseMetadata,
  verifyProposalResponseToken,
} from "@/lib/proposal-response-token";

export type ProposalDecision = "ACCEPTED" | "DECLINED";

export type ProposalResponseResult =
  | { status: "ok"; decision: ProposalDecision }
  | { status: "already_recorded"; decision: ProposalDecision }
  | { status: "not_found"; message: string }
  | { status: "unavailable"; message: string };

export async function recordPublicProposalResponse(input: {
  slug: string;
  decision: ProposalDecision;
  responseToken: string;
  respondentName: string;
  respondentEmail: string;
  sourceIpHash?: string;
  userAgent?: string;
  now?: Date;
}): Promise<ProposalResponseResult> {
  return database.transaction(async (transaction) => {
    await transaction.execute(
      sql`select ${proposals.id} from ${proposals}
          inner join ${proposalRevisions}
            on ${proposalRevisions.id} = ${proposals.currentPublishedRevisionId}
          where ${proposalRevisions.slugSnapshot} = ${input.slug}
            and ${proposals.status} = 'PUBLISHED'
            and ${proposalRevisions.status} = 'CURRENT'
            and ${proposals.deletedAt} is null
          for update of ${proposals}`,
    );

    const published = await transaction
      .select({
        revisionId: proposalRevisions.id,
        content: proposalRevisions.contentSnapshot,
        expiresAt: proposalRevisions.expiresAtSnapshot,
        passwordProtected: proposals.passwordProtectionEnabled,
      })
      .from(proposals)
      .innerJoin(
        proposalRevisions,
        eq(proposals.currentPublishedRevisionId, proposalRevisions.id),
      )
      .where(
        and(
          eq(proposalRevisions.slugSnapshot, input.slug),
          eq(proposals.status, "PUBLISHED"),
          eq(proposalRevisions.status, "CURRENT"),
          isNull(proposals.deletedAt),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!published) {
      return { status: "not_found", message: "Proposal not found." };
    }

    const now = input.now ?? new Date();
    if (
      published.passwordProtected ||
      !parseProposalContentSnapshot(published.content) ||
      (published.expiresAt && published.expiresAt < now) ||
      !verifyProposalResponseToken(published.revisionId, input.responseToken)
    ) {
      return {
        status: "unavailable",
        message: "This proposal is no longer available for a response.",
      };
    }

    const existing = await transaction
      .select({ decision: proposalResponses.decision })
      .from(proposalResponses)
      .where(eq(proposalResponses.proposalRevisionId, published.revisionId))
      .limit(1)
      .then((rows) => rows[0]);

    if (existing) {
      return { status: "already_recorded", decision: existing.decision };
    }

    await transaction.insert(proposalResponses).values({
      proposalRevisionId: published.revisionId,
      decision: input.decision,
      respondentName: input.respondentName,
      respondentEmail: input.respondentEmail,
      responseTokenHash: hashProposalResponseMetadata(input.responseToken),
      sourceIpHash: input.sourceIpHash,
      userAgent: input.userAgent,
    });

    return { status: "ok", decision: input.decision };
  });
}
