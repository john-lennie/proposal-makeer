import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeft, Eye } from "@/components/icons";
import { ProposalDocument } from "@/components/proposal-document";
import { getEditableProposal } from "@/data/proposal-drafts";
import type { ProposalContentSnapshot } from "@/db/types";
import { requireWorkspaceMember } from "@/lib/authorization";
import { toProposalViewModel } from "@/lib/published-proposal";

interface PreviewProposalPageProps {
  params: Promise<{ proposalId: string }>;
}

export const dynamic = "force-dynamic";

async function loadPreview(proposalId: string, workspaceId: string) {
  const draft = await getEditableProposal(workspaceId, proposalId);
  if (!draft) return null;

  const snapshot: ProposalContentSnapshot = {
    schemaVersion: 1,
    proposalId: draft.id,
    title: draft.title,
    client: { name: draft.client.name },
    provider: {
      displayName: draft.theme.displayName ?? "Your studio",
      ...(draft.theme.logoAssetUrl
        ? { logoAssetUrl: draft.theme.logoAssetUrl }
        : {}),
    },
    currency: draft.currency,
    theme: draft.theme,
    sections: draft.sections.map(({ content }) => content),
  };

  return toProposalViewModel(
    {
      proposalId: draft.id,
      revisionId: "draft-preview",
      revisionNumber: 0,
      content: snapshot,
      publishedAt: new Date(draft.updatedAt),
      decision: null,
      passwordProtected: false,
    },
    snapshot,
  );
}

export async function generateMetadata({
  params,
}: PreviewProposalPageProps): Promise<Metadata> {
  const { proposalId } = await params;
  const { workspaceId } = await requireWorkspaceMember();
  const proposal = await loadPreview(proposalId, workspaceId);

  return {
    title: proposal ? `Preview ${proposal.title} — Sonder` : "Proposal not found",
    robots: { index: false, follow: false },
  };
}

export default async function ProposalPreviewPage({
  params,
}: PreviewProposalPageProps) {
  const { proposalId } = await params;
  const { workspaceId } = await requireWorkspaceMember();
  const proposal = await loadPreview(proposalId, workspaceId);

  if (!proposal) {
    notFound();
  }

  return (
    <main>
      <header className="sticky top-0 z-50 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#20231d] px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/proposals/${proposalId}/edit`}
            className="grid size-9 place-items-center rounded-full border border-white/20 hover:bg-white/10"
            aria-label="Back to editor"
          >
            <ArrowLeft />
          </Link>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Eye /> Private preview
            </p>
            <p className="text-xs text-white/45">Current draft · only visible to you</p>
          </div>
        </div>
        <Link
          href={`/proposals/${proposalId}/edit`}
          className="button h-9 border border-white/20 px-4 text-white hover:bg-white/10"
        >
          Continue editing
        </Link>
      </header>
      <ProposalDocument proposal={proposal} mode="preview" />
    </main>
  );
}
