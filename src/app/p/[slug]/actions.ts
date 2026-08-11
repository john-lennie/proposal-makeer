"use server";

import { revalidatePath } from "next/cache";

import { recordPublicProposalResponse } from "@/data/proposal-responses";

export interface ProposalResponseActionState {
  status: "idle" | "success" | "error";
  message: string;
  decision?: "ACCEPTED" | "DECLINED";
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function respondToProposalAction(
  _state: ProposalResponseActionState,
  formData: FormData,
): Promise<ProposalResponseActionState> {
  const slug = text(formData, "slug");
  const decision = text(formData, "decision");

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    (decision !== "ACCEPTED" && decision !== "DECLINED")
  ) {
    return { status: "error", message: "Invalid proposal response." };
  }

  try {
    const result = await recordPublicProposalResponse({ slug, decision });

    if (result.status === "not_found" || result.status === "unavailable") {
      return { status: "error", message: result.message };
    }

    revalidatePath(`/p/${slug}`);
    const accepted = result.decision === "ACCEPTED";
    return {
      status: "success",
      decision: result.decision,
      message:
        result.status === "already_recorded"
          ? `This proposal was already ${accepted ? "accepted" : "declined"}.`
          : `Proposal ${accepted ? "accepted" : "declined"}. Your response has been recorded.`,
    };
  } catch {
    return {
      status: "error",
      message: "Your response could not be recorded. Please try again.",
    };
  }
}
