import Link from "next/link";

import { ArrowLeft, Eye } from "@/components/icons";
import { ProposalDocument } from "@/components/proposal-document";
import { demoProposal } from "@/lib/proposal";

export const metadata = {
  title: `Preview ${demoProposal.title} — Sonder`,
};

export default function ProposalPreviewPage() {
  return (
    <main>
      <header className="sticky top-0 z-50 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#20231d] px-4 py-3 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/proposals/demo/edit"
            className="grid size-9 place-items-center rounded-full border border-white/20 hover:bg-white/10"
            aria-label="Back to editor"
          >
            <ArrowLeft />
          </Link>
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Eye /> Private preview
            </p>
            <p className="text-xs text-white/45">Only visible to you</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/proposals/demo/edit"
            className="button h-9 border border-white/20 px-4 text-white hover:bg-white/10"
          >
            Continue editing
          </Link>
          <button
            type="button"
            className="button h-9 bg-[#d6dcbf] px-4 text-ink hover:bg-white"
          >
            Publish
          </button>
        </div>
      </header>
      <ProposalDocument proposal={demoProposal} mode="preview" />
    </main>
  );
}
