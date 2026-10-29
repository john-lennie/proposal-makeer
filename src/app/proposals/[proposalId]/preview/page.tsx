import { notFound } from "next/navigation";
import { DirectProposalEditor } from "@/components/direct-proposal-editor";
import { getEditableProposal } from "@/data/proposal-drafts";
import { requireWorkspaceMember } from "@/lib/authorization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Private proposal preview — Sonder", robots: { index: false, follow: false } };

export default async function ProposalPreviewPage({ params, searchParams }: {
  params: Promise<{ proposalId: string }>;
  searchParams?: Promise<{ edit?: string }>;
}) {
  const { proposalId } = await params;
  const { workspaceId } = await requireWorkspaceMember();
  const proposal = await getEditableProposal(workspaceId, proposalId);
  if (!proposal) notFound();
  const query = await searchParams;
  return <main><DirectProposalEditor key={proposal.id} proposal={proposal} initiallyEditing={query?.edit === "1"} /></main>;
}
