import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DatabaseProposalEditor } from "@/components/database-proposal-editor";
import { getEditableProposal } from "@/data/proposal-drafts";
import { requireWorkspaceMember } from "@/lib/authorization";

interface EditProposalPageProps {
  params: Promise<{ proposalId: string }>;
}

export const dynamic = "force-dynamic";

const publicationDateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Toronto",
});

export async function generateMetadata({
  params,
}: EditProposalPageProps): Promise<Metadata> {
  const { proposalId } = await params;
  const { workspaceId } = await requireWorkspaceMember();
  const proposal = await getEditableProposal(workspaceId, proposalId);

  return {
    title: proposal ? `Edit ${proposal.title} — Sonder` : "Proposal not found",
    robots: { index: false, follow: false },
  };
}

export default async function EditProposalPage({
  params,
}: EditProposalPageProps) {
  const { proposalId } = await params;
  const { workspaceId } = await requireWorkspaceMember();
  const proposal = await getEditableProposal(workspaceId, proposalId);

  if (!proposal) {
    notFound();
  }

  return (
    <DatabaseProposalEditor
      proposal={proposal}
      currentPublishedAtLabel={
        proposal.publication.currentPublishedAt
          ? publicationDateFormatter.format(
              new Date(proposal.publication.currentPublishedAt),
            )
          : null
      }
    />
  );
}
