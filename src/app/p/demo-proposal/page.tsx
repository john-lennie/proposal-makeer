import { PublicProposalNav } from "@/components/public-proposal-nav";
import { ProposalDocument } from "@/components/proposal-document";
import { demoProposal } from "@/lib/proposal";

export const metadata = {
  title: `${demoProposal.title} — ${demoProposal.company}`,
  description: `A private relocation proposal prepared for ${demoProposal.client} by ${demoProposal.company}.`,
};

export default function PublicProposalPage() {
  return (
    <main>
      <PublicProposalNav proposal={demoProposal} />
      <ProposalDocument proposal={demoProposal} />
    </main>
  );
}
