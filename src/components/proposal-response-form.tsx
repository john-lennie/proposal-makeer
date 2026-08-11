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
}: {
  slug: string;
  acceptLabel: string;
  declineLabel: string;
  currentDecision?: "ACCEPTED" | "DECLINED";
}) {
  const [state, action, pending] = useActionState(
    respondToProposalAction,
    initialState,
  );
  const recordedDecision = state.decision ?? currentDecision;

  return (
    <form action={action} className="mt-10" aria-describedby="proposal-response-status">
      <input type="hidden" name="slug" value={slug} />
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
