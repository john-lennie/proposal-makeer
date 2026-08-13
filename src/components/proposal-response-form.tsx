"use client";

import { useActionState } from "react";

import {
  respondToProposalAction,
  type ProposalResponseActionState,
} from "@/app/p/[slug]/actions";

const initialState: ProposalResponseActionState = {
  status: "idle",
  message: "",
};

export function ProposalResponseForm({
  slug,
  acceptLabel,
  declineLabel,
  currentDecision,
  responseToken,
}: {
  slug: string;
  acceptLabel: string;
  declineLabel: string;
  currentDecision?: "ACCEPTED" | "DECLINED";
  responseToken?: string;
}) {
  const [state, action, pending] = useActionState(
    respondToProposalAction,
    initialState,
  );
  const recordedDecision = state.decision ?? currentDecision;

  if (!responseToken && !recordedDecision) {
    return (
      <div className="mt-10 border-t border-white/20 pt-7 text-center">
        <p className="text-sm leading-6 text-white/65">
          Use the private response link supplied by the proposal author to accept
          or decline this proposal.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-10" aria-describedby="proposal-response-status">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="responseToken" value={responseToken ?? ""} />
      {!recordedDecision && (
        <div className="mx-auto mb-7 grid max-w-xl gap-4 text-left sm:grid-cols-2">
          <label className="text-sm text-white/75">
            Your name
            <input
              required
              minLength={2}
              maxLength={160}
              name="respondentName"
              autoComplete="name"
              className="mt-2 w-full rounded-sm border border-white/25 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/60"
            />
          </label>
          <label className="text-sm text-white/75">
            Your email
            <input
              required
              maxLength={320}
              name="respondentEmail"
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-sm border border-white/25 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/60"
            />
          </label>
          <label className="flex items-start gap-3 text-sm leading-6 text-white/75 sm:col-span-2">
            <input required type="checkbox" name="confirmed" value="yes" className="mt-1 size-4" />
            I confirm that I am authorized to respond to this proposal and that
            the decision selected below will be recorded against this revision.
          </label>
          <label className="hidden" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      )}
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="submit"
          name="decision"
          value="ACCEPTED"
          disabled={pending || Boolean(recordedDecision)}
          className="button bg-[#d6dcbf] text-ink hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          {recordedDecision === "ACCEPTED" ? "Proposal accepted" : acceptLabel}
        </button>
        <button
          type="submit"
          name="decision"
          value="DECLINED"
          disabled={pending || Boolean(recordedDecision)}
          className="button border border-white/25 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {recordedDecision === "DECLINED" ? "Proposal declined" : declineLabel}
        </button>
      </div>
      <p
        id="proposal-response-status"
        aria-live="polite"
        className={`mt-5 min-h-5 text-sm ${state.status === "error" ? "text-red-200" : "text-white/65"}`}
      >
        {state.message ||
          (recordedDecision
            ? `This proposal has been ${recordedDecision === "ACCEPTED" ? "accepted" : "declined"}.`
            : "Your response will be recorded against this exact revision.")}
      </p>
    </form>
  );
}
