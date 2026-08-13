"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import {
  addSectionAction,
  moveSectionAction,
  publishProposalAction,
  removeSectionAction,
  unpublishProposalAction,
  updateProposalDetailsAction,
  updateSectionAction,
} from "@/app/proposals/[proposalId]/edit/actions";
import { ArrowLeft, Eye, Mark, Plus } from "@/components/icons";
import type { EditableProposal } from "@/data/proposal-drafts";
import type { ProposalSectionContent } from "@/db/types";
import {
  initialEditorActionState,
  initialPublicationActionState,
  type EditorActionState,
  type PublicationActionState,
} from "@/lib/action-state";

const SECTION_LABELS: Record<ProposalSectionContent["type"], string> = {
  cover: "Cover",
  text: "Project overview",
  objectives: "Objectives",
  scope: "Scope of work",
  deliverables: "Deliverables",
  timeline: "Timeline",
  pricing: "Pricing",
  terms: "Terms",
  acceptance: "Acceptance",
};

export function DatabaseProposalEditor({
  proposal,
  currentPublishedAtLabel,
}: {
  proposal: EditableProposal;
  currentPublishedAtLabel: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string>("details");
  const selectedSection = useMemo(
    () => proposal.sections.find((section) => section.id === selectedId),
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
              Draft workspace
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link
            href={`/proposals/${proposal.id}/preview`}
            className="button button-light h-10 px-4"
          >
            <Eye />
            <span className="hidden sm:inline">Preview</span>
          </Link>
          <PublicationControls
            proposal={proposal}
            currentPublishedAtLabel={currentPublishedAtLabel}
          />
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b border-ink/10 bg-[#e9e8e2] lg:border-b-0 lg:border-r">
          <div className="px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-ink/50">
              Proposal
            </p>
          </div>
          <nav
            aria-label="Proposal editor"
            className="editor-section-scroll flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:overflow-visible lg:px-0 lg:pb-0"
          >
            <button
              type="button"
              onClick={() => setSelectedId("details")}
              aria-current={selectedId === "details" ? "page" : undefined}
              className={`flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition lg:w-full lg:rounded-none lg:px-5 ${
                selectedId === "details"
                  ? "bg-[#d8dccb] text-ink"
                  : "text-ink/55 hover:bg-white/40 hover:text-ink"
              }`}
            >
              <span className="font-mono text-[10px] text-ink/35">00</span>
              Proposal details
            </button>
            {proposal.sections.map((section, index) => (
              <div
                key={section.id}
                className={`min-w-max lg:min-w-0 ${
                  selectedId === section.id ? "bg-[#d8dccb]" : ""
                }`}
              >
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedId(section.id)}
                    aria-current={
                      selectedId === section.id ? "page" : undefined
                    }
                    className="flex min-w-max flex-1 items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-ink/65 transition hover:text-ink lg:min-w-0 lg:rounded-none lg:px-5"
                  >
                    <span className="font-mono text-[10px] text-ink/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">
                      {SECTION_LABELS[section.type]}
                    </span>
                  </button>
                  <SectionStructureControls
                    proposal={proposal}
                    sectionId={section.id}
                    index={index}
                    sectionCount={proposal.sections.length}
                    removable={
                      section.type !== "cover" &&
                      section.type !== "acceptance"
                    }
                  />
                </div>
              </div>
            ))}
          </nav>

          <AddSectionForm proposal={proposal} />

          <div className="mx-5 my-6 hidden border-t border-ink/10 pt-5 lg:block">
            <div className="flex gap-3">
              <Mark className="size-5 text-olive" />
              <p className="text-xs leading-5 text-ink/50">
                Changes update the draft only. Published revisions stay
                unchanged.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-3xl">
            {selectedId === "details" ? (
              <ProposalDetailsForm
                key={proposal.updatedAt}
                proposal={proposal}
              />
            ) : selectedSection ? (
              <SectionForm
                key={`${selectedSection.id}-${proposal.updatedAt}`}
                proposal={proposal}
                section={selectedSection.content}
                sectionId={selectedSection.id}
              />
            ) : (
              <div className="editor-panel text-center">
                <p className="text-sm text-ink/55">
                  Select a section to continue editing.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function PublicationControls({
  proposal,
  currentPublishedAtLabel,
}: {
  proposal: EditableProposal;
  currentPublishedAtLabel: string | null;
}) {
  const [publishState, publishAction, publishPending] = useActionState(
    publishProposalAction,
    initialPublicationActionState,
  );
  const [unpublishState, unpublishAction, unpublishPending] = useActionState(
    unpublishProposalAction,
    initialPublicationActionState,
  );
  const isPublished = proposal.publication.currentRevisionNumber !== null;
  const hasHistory = proposal.publication.latestRevisionNumber > 0;
  const publishLabel = hasHistory ? "Republish" : "Publish";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="mr-1 hidden text-right md:block">
        <p className="text-xs font-medium">
          {isPublished
            ? `Published revision ${proposal.publication.currentRevisionNumber} · ${currentPublishedAtLabel ?? ""}`
            : hasHistory
              ? `Unpublished · ${proposal.publication.latestRevisionNumber} revisions preserved`
              : "Not yet published"}
        </p>
        <p className="mt-0.5 text-[11px] text-ink/45">
          {proposal.publication.hasUnpublishedChanges
            ? "Draft has unpublished changes"
            : "Draft matches the published revision"}
        </p>
      </div>

      {isPublished && (
        <>
          <Link
            href={proposal.publication.currentResponseUrl ?? `/p/${proposal.publication.currentPublishedSlug}`}
            className="button button-light h-10 px-4"
          >
            Open client link
          </Link>
          <form
            action={unpublishAction}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  "Unpublish this proposal? The public link will stop working, but revisions and client responses will be preserved.",
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <PublicationHiddenFields proposal={proposal} />
            <button
              type="submit"
              disabled={unpublishPending || publishPending}
              className="button button-light h-10 px-4 disabled:opacity-50"
            >
              {unpublishPending ? "Unpublishing…" : "Unpublish"}
            </button>
          </form>
        </>
      )}

      <form
        action={publishAction}
        onSubmit={(event) => {
          const action = hasHistory ? "republish" : "publish";
          if (
            !window.confirm(
              `Ready to ${action} this draft? This creates a new immutable revision for the client.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <PublicationHiddenFields proposal={proposal} />
        <button
          type="submit"
          disabled={publishPending || unpublishPending}
          className="button button-dark h-10 px-4 disabled:opacity-50"
        >
          {publishPending ? "Publishing…" : publishLabel}
        </button>
      </form>

      <PublicationFeedback
        state={
          publishState.status !== "idle" ? publishState : unpublishState
        }
      />
    </div>
  );
}

function PublicationHiddenFields({
  proposal,
}: {
  proposal: EditableProposal;
}) {
  return (
    <>
      <input type="hidden" name="proposalId" value={proposal.id} />
      <input
        type="hidden"
        name="expectedUpdatedAt"
        value={proposal.updatedAt}
      />
    </>
  );
}

function PublicationFeedback({
  state,
}: {
  state: PublicationActionState;
}) {
  if (state.status === "idle") return null;

  return (
    <div
      className={`basis-full text-right text-xs ${
        state.status === "success" ? "text-olive" : "text-red-700"
      }`}
      role={state.status === "success" ? "status" : "alert"}
      aria-live="polite"
    >
      <span>{state.message}</span>
      {state.publicUrl && (
        <>
          {" "}
          <Link className="underline" href={state.publicUrl}>
            Open public preview
          </Link>
        </>
      )}
      {state.responseUrl && (
        <>
          {" "}
          <Link className="underline" href={state.responseUrl}>
            Open client response link
          </Link>
        </>
      )}
    </div>
  );
}

function ProposalDetailsForm({ proposal }: { proposal: EditableProposal }) {
  const [state, action, pending] = useActionState(
    updateProposalDetailsAction,
    initialEditorActionState,
  );

  return (
    <>
      <EditorHeading eyebrow="Proposal settings" title="Proposal details" />
      <form action={action} className="editor-panel">
        <input type="hidden" name="proposalId" value={proposal.id} />
        <input
          type="hidden"
          name="expectedUpdatedAt"
          value={proposal.updatedAt}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Proposal title" className="sm:col-span-2">
            <input
              name="title"
              defaultValue={proposal.title}
              required
              maxLength={240}
            />
          </Field>
          <Field label="Client name">
            <input
              name="clientName"
              defaultValue={proposal.client.name}
              required
              maxLength={160}
            />
          </Field>
          <Field label="Public slug" hint={`Public path: /p/${proposal.slug}`}>
            <input
              name="slug"
              defaultValue={proposal.slug}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              maxLength={120}
            />
          </Field>
        </div>
        <FormFooter state={state} pending={pending} />
      </form>
    </>
  );
}

function SectionForm({
  proposal,
  section,
  sectionId,
}: {
  proposal: EditableProposal;
  section: ProposalSectionContent;
  sectionId: string;
}) {
  const [state, action, pending] = useActionState(
    updateSectionAction,
    initialEditorActionState,
  );

  return (
    <>
      <EditorHeading
        eyebrow="Editing section"
        title={SECTION_LABELS[section.type]}
      />
      <form action={action} className="editor-panel">
        <input type="hidden" name="proposalId" value={proposal.id} />
        <input type="hidden" name="sectionId" value={sectionId} />
        <input
          type="hidden"
          name="expectedUpdatedAt"
          value={proposal.updatedAt}
        />
        <div className="grid gap-6">
          <Field label="Eyebrow">
            <input
              name="eyebrow"
              defaultValue={section.eyebrow}
              maxLength={120}
            />
          </Field>
          <Field label="Section heading">
            <textarea
              name="title"
              rows={2}
              defaultValue={section.title}
              required
              maxLength={240}
            />
          </Field>
          <SectionContentFields section={section} />
        </div>
        <FormFooter state={state} pending={pending} />
      </form>
    </>
  );
}

function SectionContentFields({
  section,
}: {
  section: ProposalSectionContent;
}) {
  switch (section.type) {
    case "cover":
      return (
        <>
          <Field label="Introduction">
            <textarea
              name="subtitle"
              rows={4}
              defaultValue={section.subtitle}
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Prepared for">
              <input
                name="preparedFor"
                defaultValue={section.preparedFor}
                required
              />
            </Field>
            <Field label="Prepared by">
              <input
                name="preparedBy"
                defaultValue={section.preparedBy}
                required
              />
            </Field>
            <Field label="Location">
              <input name="location" defaultValue={section.location} />
            </Field>
            <Field label="Date label">
              <input name="dateLabel" defaultValue={section.dateLabel} />
            </Field>
          </div>
        </>
      );
    case "text":
      return (
        <Field label="Body copy">
          <textarea
            name="body"
            rows={9}
            defaultValue={section.body.blocks
              .flatMap((block) => block.text ?? block.items ?? [])
              .join("\n\n")}
            required
          />
        </Field>
      );
    case "objectives":
      return (
        <>
          <IntroductionField value={section.introduction} />
          <ListField
            label="Objectives"
            hint="One objective per line."
            value={section.items.map((item) => item.text).join("\n")}
          />
        </>
      );
    case "deliverables":
      return (
        <>
          <IntroductionField value={section.introduction} />
          <ListField
            label="Deliverables"
            hint="One deliverable per line."
            value={section.items.map((item) => item.title).join("\n")}
          />
        </>
      );
    case "terms":
      return (
        <ListField
          label="Terms"
          hint="One term per line."
          value={section.items.map((item) => item.text).join("\n")}
        />
      );
    case "scope":
      return (
        <>
          <IntroductionField value={section.introduction} />
          <ListField
            label="Scope items"
            hint="One per line: Title | Description | included item, included item"
            value={section.items
              .map(
                (item) =>
                  `${item.title} | ${item.description} | ${item.includes.join(", ")}`,
              )
              .join("\n")}
          />
        </>
      );
    case "timeline":
      return (
        <>
          <IntroductionField value={section.introduction} />
          <ListField
            label="Timeline phases"
            hint="One per line: Label | Title | Description"
            value={section.phases
              .map(
                (phase) =>
                  `${phase.label} | ${phase.title} | ${phase.description ?? ""}`,
              )
              .join("\n")}
          />
        </>
      );
    case "pricing":
      return (
        <>
          <IntroductionField value={section.introduction} />
          <ListField
            label="Pricing items"
            hint="One per line: Label | Description | Amount"
            value={section.items
              .map(
                (item) =>
                  `${item.label} | ${item.description ?? ""} | ${(item.amountMinor / 100).toFixed(2)}`,
              )
              .join("\n")}
          />
        </>
      );
    case "acceptance":
      return (
        <>
          <Field label="Closing message">
            <textarea name="body" rows={5} defaultValue={section.body} required />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Accept button label">
              <input
                name="acceptLabel"
                defaultValue={section.acceptLabel}
                required
              />
            </Field>
            <Field label="Decline button label">
              <input
                name="declineLabel"
                defaultValue={section.declineLabel}
                required
              />
            </Field>
          </div>
        </>
      );
  }
}

function IntroductionField({ value }: { value?: string }) {
  return (
    <Field label="Introduction">
      <textarea name="introduction" rows={4} defaultValue={value} />
    </Field>
  );
}

function ListField({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea name="items" rows={8} defaultValue={value} required />
    </Field>
  );
}

function AddSectionForm({ proposal }: { proposal: EditableProposal }) {
  const [state, action, pending] = useActionState(
    addSectionAction,
    initialEditorActionState,
  );
  const availableSections = Object.entries(SECTION_LABELS).filter(
    ([type]) => !proposal.sections.some((section) => section.type === type),
  );

  return (
    <form action={action} className="mx-4 mt-5 border-t border-ink/10 pt-5">
      <input type="hidden" name="proposalId" value={proposal.id} />
      <input
        type="hidden"
        name="expectedUpdatedAt"
        value={proposal.updatedAt}
      />
      <input type="hidden" name="proposalTitle" value={proposal.title} />
      <input type="hidden" name="clientName" value={proposal.client.name} />
      <label className="field-label" htmlFor="section-type">
        Add section
      </label>
      {availableSections.length > 0 ? (
        <div className="flex gap-2">
          <select
            id="section-type"
            name="sectionType"
            className="min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 text-xs"
            defaultValue={availableSections[0][0]}
          >
            {availableSections.map(([type, label]) => (
              <option key={type} value={type}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="grid size-9 place-items-center rounded-full bg-ink text-paper disabled:opacity-50"
            aria-label="Add selected section"
          >
            <Plus />
          </button>
        </div>
      ) : (
        <p className="text-xs leading-5 text-ink/45">
          All available section types are in use.
        </p>
      )}
      <ActionFeedback state={state} compact />
    </form>
  );
}

function SectionStructureControls({
  proposal,
  sectionId,
  index,
  sectionCount,
  removable,
}: {
  proposal: EditableProposal;
  sectionId: string;
  index: number;
  sectionCount: number;
  removable: boolean;
}) {
  const [moveState, moveAction, movePending] = useActionState(
    moveSectionAction,
    initialEditorActionState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeSectionAction,
    initialEditorActionState,
  );
  const hiddenFields = (
    <>
      <input type="hidden" name="proposalId" value={proposal.id} />
      <input type="hidden" name="sectionId" value={sectionId} />
      <input
        type="hidden"
        name="expectedUpdatedAt"
        value={proposal.updatedAt}
      />
    </>
  );

  return (
    <div className="flex items-center gap-0.5 pr-3">
      <form action={moveAction}>
        {hiddenFields}
        <input type="hidden" name="direction" value="up" />
        <button
          type="submit"
          disabled={index === 0 || movePending}
          className="grid size-7 place-items-center rounded text-xs hover:bg-white/50 disabled:opacity-25"
          aria-label={`Move ${SECTION_LABELS[proposal.sections[index].type]} up`}
        >
          ↑
        </button>
      </form>
      <form action={moveAction}>
        {hiddenFields}
        <input type="hidden" name="direction" value="down" />
        <button
          type="submit"
          disabled={index === sectionCount - 1 || movePending}
          className="grid size-7 place-items-center rounded text-xs hover:bg-white/50 disabled:opacity-25"
          aria-label={`Move ${SECTION_LABELS[proposal.sections[index].type]} down`}
        >
          ↓
        </button>
      </form>
      {removable && (
        <form action={removeAction}>
          {hiddenFields}
          <button
            type="submit"
            disabled={removePending}
            className="grid size-7 place-items-center rounded text-sm text-ink/45 hover:bg-red-50 hover:text-red-700 disabled:opacity-25"
            aria-label={`Remove ${SECTION_LABELS[proposal.sections[index].type]}`}
          >
            ×
          </button>
        </form>
      )}
      {(moveState.status === "error" ||
        moveState.status === "conflict" ||
        removeState.status === "error" ||
        removeState.status === "conflict") && (
        <span className="sr-only" role="alert">
          {moveState.message || removeState.message}
        </span>
      )}
    </div>
  );
}

function EditorHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="eyebrow text-olive">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl tracking-[-0.035em]">{title}</h1>
    </div>
  );
}

function FormFooter({
  state,
  pending,
}: {
  state: EditorActionState;
  pending: boolean;
}) {
  return (
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-5">
      <ActionFeedback state={state} />
      <button
        type="submit"
        disabled={pending}
        className="button button-dark h-10 px-5 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function ActionFeedback({
  state,
  compact = false,
}: {
  state: EditorActionState;
  compact?: boolean;
}) {
  if (state.status === "idle") {
    return compact ? null : (
      <span className="text-xs text-ink/40">Changes are saved manually.</span>
    );
  }

  return (
    <p
      className={`${compact ? "mt-2" : ""} text-xs ${
        state.status === "saved" ? "text-olive" : "text-red-700"
      }`}
      role={state.status === "saved" ? "status" : "alert"}
      aria-live="polite"
    >
      {state.message}
    </p>
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
