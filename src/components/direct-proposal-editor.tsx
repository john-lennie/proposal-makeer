"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { saveInlineFieldAction } from "@/app/proposals/[proposalId]/edit/inline-actions";
import { StructuredProposalDocument } from "@/components/structured-proposal-document";
import type { EditableProposal } from "@/data/proposal-drafts";
import type { ProposalContentSnapshot, ProposalSectionContent } from "@/db/types";
import { inlineFields, updateInlineField } from "@/lib/inline-proposal";
import { InlineField } from "@/components/inline-field";

export function DirectProposalEditor({ proposal, initiallyEditing = false }: { proposal: EditableProposal; initiallyEditing?: boolean }) {
  const [sections, setSections] = useState(proposal.sections.map(({ id, content }) => ({ ...content, id })));
  const version = useRef(proposal.updatedAt);
  const [editing, setEditing] = useState(initiallyEditing);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const pendingSave = useRef(false);

  useEffect(() => {
    if (!activeField) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [activeField]);

  const snapshot: ProposalContentSnapshot = {
    schemaVersion: 1, proposalId: proposal.id, title: proposal.title,
    client: { name: proposal.client.name }, currency: proposal.currency, theme: proposal.theme,
    provider: { displayName: proposal.theme.displayName ?? "Your studio", logoAssetUrl: proposal.theme.logoAssetUrl },
    sections,
  };

  async function save(section: ProposalSectionContent, path: string, value: string): Promise<boolean> {
    if (pendingSave.current) return false;
    const validation = updateInlineField(section, path, value);
    if (!validation.success) { setMessage(validation.message); setIsError(true); return false; }
    pendingSave.current = true;
    setSaving(true);
    setIsError(false);
    setMessage("Saving to draft…");
    try {
      const result = await saveInlineFieldAction({ proposalId: proposal.id, sectionId: section.id, path, value, expectedUpdatedAt: version.current });
      setMessage(result.message);
      if (result.status !== "saved" || !result.updatedAt) { setIsError(true); return false; }
      version.current = result.updatedAt;
      setSections((current) => current.map((item) => item.id === section.id ? validation.data : item));
      return true;
    } catch {
      setIsError(true);
      setMessage("We couldn’t save this change. Your edit is still here; try again.");
      return false;
    } finally {
      pendingSave.current = false;
      setSaving(false);
    }
  }

  return <>
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-ink/15 bg-[#faf9f6] px-5 py-4 text-ink">
      <div><p className="text-sm font-medium">{editing ? "Edit on the page" : "Private preview"}</p><p className="mt-1 text-xs text-ink/65">{editing ? "Select text to edit. Save each change to your draft." : "Only visible to your workspace."}</p></div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button type="button" className="text-link disabled:opacity-50" disabled={Boolean(activeField) || saving} onClick={() => setEditing(!editing)}>{editing ? "Preview only" : "Edit on page"}</button>
        <Link href="/settings/brand" className={`text-link ${activeField ? "pointer-events-none opacity-50" : ""}`} aria-disabled={Boolean(activeField)} tabIndex={activeField ? -1 : undefined}>Brand settings</Link>
        <Link href={`/proposals/${proposal.id}/edit`} className={`button button-dark ${activeField ? "pointer-events-none opacity-50" : ""}`} aria-disabled={Boolean(activeField)} tabIndex={activeField ? -1 : undefined}>Sections &amp; publish</Link>
      </div>
    </header>
    <div className="border-b border-ink/10 bg-[#eeede7] px-5 py-3 text-xs leading-5 text-ink/70">
      {activeField ? "Save or cancel your current edit before editing another field or leaving this page." : "Changes update your draft. Publish again to update the client-facing proposal."}
      <p id="inline-save-status" role={isError ? "alert" : "status"} aria-live="polite" className={`mt-1 ${isError ? "text-red-700" : "text-olive"}`}>{message}</p>
    </div>
    <StructuredProposalDocument snapshot={snapshot} revisionLabel="Private draft preview" renderField={editing ? (section, path, value) => {
      const spec = inlineFields(section).find((item) => item.path === path);
      if (!spec) return value;
      const fieldId = `${section.id}:${path}`;
      return <InlineField key={fieldId} spec={spec} currency={proposal.currency} errorMessage={isError ? message : ""} active={activeField === fieldId} disabled={saving || (activeField !== null && activeField !== fieldId)} onStart={() => { setActiveField(fieldId); setMessage(""); setIsError(false); }} onClose={() => setActiveField(null)} onSave={(next) => save(section, path, next)} />;
    } : undefined} />
  </>;
}
