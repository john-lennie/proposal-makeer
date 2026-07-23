import { ProposalEditor } from "@/components/proposal-editor";
import { demoProposal } from "@/lib/proposal";

export const metadata = {
  title: `Edit ${demoProposal.title} — Sonder`,
};

export default function ProposalEditorPage() {
  return <ProposalEditor proposal={demoProposal} />;
}
