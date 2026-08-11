import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ProposalDocument } from "@/components/proposal-document";
import { ProposalResponseForm } from "@/components/proposal-response-form";
import { PublicProposalNav } from "@/components/public-proposal-nav";
import { getPublishedProposalBySlug } from "@/data/proposals";
import { selectPublicProposal } from "@/lib/published-proposal";

interface PublicProposalPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

const getPublicProposal = cache(async (slug: string) => {
  const publishedRevision = await getPublishedProposalBySlug(slug);
  return selectPublicProposal(publishedRevision);
});

export async function generateMetadata({
  params,
}: PublicProposalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const proposal = await getPublicProposal(slug);

  if (!proposal) {
    return {
      title: "Proposal not found — Sonder",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${proposal.title} — ${proposal.company}`,
    description: `A proposal prepared for ${proposal.client} by ${proposal.company}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicProposalPage({
  params,
}: PublicProposalPageProps) {
  const { slug } = await params;
  const proposal = await getPublicProposal(slug);

  if (!proposal) {
    notFound();
  }

  return (
    <main>
      <PublicProposalNav proposal={proposal} />
      <ProposalDocument
        proposal={proposal}
        responseForm={
          <ProposalResponseForm
            slug={slug}
            acceptLabel={proposal.acceptLabel}
            declineLabel={proposal.declineLabel}
            currentDecision={
              proposal.status === "accepted"
                ? "ACCEPTED"
                : proposal.status === "declined"
                  ? "DECLINED"
                  : undefined
            }
          />
        }
      />
    </main>
  );
}
