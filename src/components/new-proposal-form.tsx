"use client";

import { useActionState, useState } from "react";

import { createProposalAction } from "@/app/proposals/new/actions";
import { ArrowUpRight } from "@/components/icons";
import { initialNewProposalActionState } from "@/lib/action-state";
import { suggestProposalSlug } from "@/lib/draft-proposal";

export function NewProposalForm() {
  const [state, action, pending] = useActionState(
    createProposalAction,
    initialNewProposalActionState,
  );
  const [title, setTitle] = useState(state.values?.title ?? "");
  const suggestedSlug = suggestProposalSlug(title) || "your-proposal";

  return (
    <form action={action} className="editor-panel">
      <div className="grid gap-7">
        <label>
          <span className="field-label">Proposal title</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={3}
            maxLength={240}
            placeholder="Brand identity and launch"
            aria-invalid={Boolean(state.fields?.title)}
            aria-describedby={state.fields?.title ? "title-error" : undefined}
          />
          {state.fields?.title && (
            <span id="title-error" className="mt-2 block text-sm text-red-700">
              {state.fields.title}
            </span>
          )}
        </label>

        <label>
          <span className="field-label">Client name</span>
          <input
            name="clientName"
            defaultValue={state.values?.clientName}
            required
            minLength={2}
            maxLength={160}
            placeholder="Alder House"
            aria-invalid={Boolean(state.fields?.clientName)}
            aria-describedby={
              state.fields?.clientName ? "client-error" : undefined
            }
          />
          {state.fields?.clientName && (
            <span id="client-error" className="mt-2 block text-sm text-red-700">
              {state.fields.clientName}
            </span>
          )}
        </label>

        <div className="rounded-lg bg-[#eeece5] px-4 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-[.15em] text-ink/40">
            Suggested public address
          </span>
          <p className="mt-1 truncate font-mono text-sm text-ink/70">
            /p/{suggestedSlug}
          </p>
        </div>

        {state.status === "error" && (
          <p
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="button button-dark justify-self-start disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create proposal"}
          {!pending && <ArrowUpRight />}
        </button>
      </div>
    </form>
  );
}
