import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { ArrowUpRight, Eye, More, Plus } from "@/components/icons";
import { demoProposal } from "@/lib/proposal";

export const metadata = {
  title: "Proposals — Sonder",
};

export default function DashboardPage() {
  return (
    <AppShell active="dashboard">
      <main className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-olive">Studio</p>
            <h1 className="mt-3 font-display text-5xl tracking-[-0.04em] sm:text-6xl">
              Proposals
            </h1>
            <p className="mt-3 text-sm text-ink/50">
              Create, refine, and publish work worth saying yes to.
            </p>
          </div>
          <Link href="/proposals/demo/edit" className="button button-dark">
            <Plus /> New proposal
          </Link>
        </div>

        <section aria-labelledby="proposal-list-title" className="mt-12">
          <div className="mb-4 flex items-center justify-between border-b border-ink/15 pb-3">
            <h2
              id="proposal-list-title"
              className="text-xs font-semibold uppercase tracking-[.16em]"
            >
              All proposals <span className="ml-2 text-ink/35">01</span>
            </h2>
            <span className="text-xs text-ink/40">Last updated</span>
          </div>

          <article className="group overflow-hidden rounded-xl border border-ink/10 bg-[#fbfaf7] transition hover:border-ink/20">
            <div className="grid lg:grid-cols-[240px_1fr]">
              <Link
                href="/proposals/demo/preview"
                className="relative min-h-60 overflow-hidden bg-[#d8ddc8] p-6 lg:min-h-[280px]"
                aria-label={`Preview ${demoProposal.title}`}
              >
                <div className="absolute -right-12 -top-10 size-52 rounded-full border border-ink/10 bg-[#c3cbae]" />
                <div className="relative flex h-full flex-col justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[.18em]">
                    North &amp; Finch
                  </span>
                  <h3 className="max-w-[170px] font-display text-3xl leading-[.95] tracking-[-0.04em]">
                    A considered move, beautifully handled.
                  </h3>
                  <span className="text-[10px] uppercase tracking-[.15em] text-ink/50">
                    {demoProposal.clientLocation}
                  </span>
                </div>
              </Link>
              <div className="flex flex-col justify-between p-6 sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="status-badge">
                        <span className="size-1.5 rounded-full bg-olive" />
                        Published
                      </span>
                      <span className="status-badge bg-[#efe9dc] text-ink/55">
                        Draft changes
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-3xl tracking-[-0.03em] sm:text-4xl">
                      {demoProposal.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink/50">
                      Prepared for {demoProposal.client}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-ink/5"
                    aria-label="More actions"
                  >
                    <More />
                  </button>
                </div>
                <div className="mt-12 flex flex-col justify-between gap-6 border-t border-ink/10 pt-5 sm:flex-row sm:items-center">
                  <div className="grid grid-cols-2 gap-8 text-xs">
                    <div>
                      <span className="block text-ink/40">Edited</span>
                      <span className="mt-1 block">{demoProposal.updatedAt}</span>
                    </div>
                    <div>
                      <span className="block text-ink/40">Public revision</span>
                      <span className="mt-1 block">Revision {demoProposal.revision}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/proposals/demo/preview"
                      className="button button-light h-10 px-4"
                    >
                      <Eye /> Preview
                    </Link>
                    <Link
                      href="/proposals/demo/edit"
                      className="button button-dark h-10 px-4"
                    >
                      Edit <ArrowUpRight />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </AppShell>
  );
}
