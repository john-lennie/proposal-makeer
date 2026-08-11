import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ArrowLeft } from "@/components/icons";
import { NewProposalForm } from "@/components/new-proposal-form";
import { requireWorkspaceMember } from "@/lib/authorization";

export const metadata = {
  title: "New proposal — Sonder",
};

export default async function NewProposalPage() {
  await requireWorkspaceMember();

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-16">
        <Link href="/dashboard" className="text-link text-sm">
          <ArrowLeft /> Back to proposals
        </Link>
        <div className="mt-12">
          <p className="eyebrow text-olive">New proposal</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-none tracking-[-0.04em] sm:text-6xl">
            Start with the essential details.
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-ink/55">
            We’ll create a polished structure you can shape in the editor.
          </p>
        </div>
        <div className="mt-10">
          <NewProposalForm />
        </div>
      </main>
    </AppShell>
  );
}
