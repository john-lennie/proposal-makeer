"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ArrowLeft, Eye, Mark, More, Plus } from "@/components/icons";
import type {
  DemoProposal,
  ProposalSection,
  ProposalSectionId,
} from "@/lib/proposal";

interface ProposalEditorProps {
  proposal: DemoProposal;
}

export function ProposalEditor({ proposal }: ProposalEditorProps) {
  const [selectedId, setSelectedId] = useState<ProposalSectionId>("cover");
  const selected = useMemo(
    () => proposal.sections.find((section) => section.id === selectedId)!,
    [proposal.sections, selectedId],
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f1ed] text-ink">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-ink/10 bg-[#faf9f6] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/dashboard"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/15 transition hover:bg-ink/5"
            aria-label="Back to dashboard"
          >
            <ArrowLeft />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{proposal.title}</p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-ink/45">
              <span className="size-1.5 rounded-full bg-olive" />
              Draft saved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/proposals/demo/preview"
            className="button button-light h-10 px-4"
          >
            <Eye />
            <span className="hidden sm:inline">Preview</span>
          </Link>
          <button type="button" className="button button-dark h-10 px-4">
            Publish
          </button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-ink/60 hover:bg-ink/5"
            aria-label="More proposal actions"
          >
            <More />
          </button>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-b border-ink/10 bg-[#e9e8e2] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-ink/50">
              Sections
            </p>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full border border-ink/15 hover:bg-white/50"
              aria-label="Add proposal section"
            >
              <Plus />
            </button>
          </div>
          <nav
            aria-label="Proposal sections"
            className="editor-section-scroll flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {proposal.sections.map((section, index) => {
              const isSelected = selectedId === section.id;
              return (
                <button
                  type="button"
                  key={section.id}
                  onClick={() => setSelectedId(section.id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`group flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition lg:w-full lg:rounded-none lg:px-5 ${
                    isSelected
                      ? "bg-[#d8dccb] text-ink"
                      : "text-ink/55 hover:bg-white/40 hover:text-ink"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] ${
                      isSelected ? "text-olive" : "text-ink/30"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{section.label}</span>
                  {isSelected && (
                    <span
                      className="hidden size-1.5 rounded-full bg-olive lg:block"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="mx-5 my-6 hidden border-t border-ink/10 pt-5 lg:block">
            <div className="flex gap-3">
              <Mark className="size-5 text-olive" />
              <p className="text-xs leading-5 text-ink/50">
                Structured sections keep your proposal polished on every screen.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <p className="eyebrow text-olive">Editing section</p>
              <h1 className="mt-2 font-display text-4xl tracking-[-0.035em]">
                {selected.label}
              </h1>
            </div>
            <SectionForm key={selected.id} section={selected} proposal={proposal} />
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionForm({
  section,
  proposal,
}: {
  section: ProposalSection;
  proposal: DemoProposal;
}) {
  if (section.id === "cover") {
    return (
      <div className="editor-panel">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Proposal title" className="sm:col-span-2">
            <input placeholder="Brand identity and launch" defaultValue={proposal.title} />
          </Field>
          <Field label="Prepared for">
            <input placeholder="Alder House" defaultValue={proposal.client} />
          </Field>
          <Field label="Location">
            <input placeholder="Toronto, Canada" defaultValue={proposal.clientLocation} />
          </Field>
          <Field label="Eyebrow" className="sm:col-span-2">
            <input placeholder="A new chapter" defaultValue={section.eyebrow} />
          </Field>
          <Field label="Cover heading" hint="Keep this concise and memorable." className="sm:col-span-2">
            <textarea rows={3} placeholder="Give this section a clear heading" defaultValue={section.title} />
          </Field>
          <Field label="Introduction" className="sm:col-span-2">
            <textarea rows={4} placeholder="Introduce your approach to this project…" defaultValue={section.body} />
          </Field>
        </div>
      </div>
    );
  }

  if (section.id === "pricing") {
    return (
      <div className="editor-panel">
        <div className="grid gap-6">
          <Field label="Section heading">
            <input placeholder="Give this section a clear heading" defaultValue={section.title} />
          </Field>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="field-label">Pricing items</label>
              <button type="button" className="text-link text-sm">
                <Plus /> Add item
              </button>
            </div>
            <div className="divide-y divide-ink/10 rounded-lg border border-ink/12 bg-white">
              {proposal.pricing.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-3 p-4 sm:grid-cols-[1fr_160px]"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-ink/45">{item.detail}</p>
                  </div>
                  <input
                    aria-label={`${item.label} amount`}
                    placeholder="0.00"
                    defaultValue={item.amount.toLocaleString("en-CA")}
                    className="text-right font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-panel">
      <div className="grid gap-6">
        <Field label="Eyebrow">
          <input placeholder="A new chapter" defaultValue={section.eyebrow} />
        </Field>
        <Field label="Section heading">
          <textarea rows={2} placeholder="Give this section a clear heading" defaultValue={section.title} />
        </Field>
        <Field label="Introduction">
          <textarea rows={5} placeholder="Introduce your approach to this project…" defaultValue={section.body} />
        </Field>
        <div className="rounded-lg border border-dashed border-ink/20 bg-[#f7f6f2] px-5 py-8 text-center">
          <p className="text-sm font-medium">{section.label} content</p>
          <p className="mt-1 text-xs text-ink/45">
            Structured fields for this section will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {hint && <span className="mb-2 block text-xs text-ink/45">{hint}</span>}
      {children}
    </label>
  );
}
