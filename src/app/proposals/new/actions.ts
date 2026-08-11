"use server";

import { redirect } from "next/navigation";

import { createProposalDraft } from "@/data/proposal-drafts";
import {
  suggestProposalSlug,
  validateProposalBasics,
} from "@/lib/draft-proposal";
import type { NewProposalActionState } from "@/lib/action-state";
import { requireWorkspaceMember } from "@/lib/authorization";

export async function createProposalAction(
  _previousState: NewProposalActionState,
  formData: FormData,
): Promise<NewProposalActionState> {
  const { userId, workspaceId } = await requireWorkspaceMember();
  const title =
    typeof formData.get("title") === "string"
      ? String(formData.get("title"))
      : "";
  const clientName =
    typeof formData.get("clientName") === "string"
      ? String(formData.get("clientName"))
      : "";
  const validation = validateProposalBasics({
    title,
    clientName,
    slug: suggestProposalSlug(title),
  });

  if (!validation.success) {
    return {
      status: "error",
      message: validation.message,
      fields: validation.fields,
      values: { title, clientName },
    };
  }

  let proposalId: string;

  try {
    const proposal = await createProposalDraft({
      workspaceId,
      userId,
      title: validation.data.title,
      clientName: validation.data.clientName,
      slugBase: validation.data.slug,
    });
    proposalId = proposal.id;
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "The proposal could not be created. Please try again.",
      values: { title, clientName },
    };
  }

  redirect(`/proposals/${proposalId}/edit`);
}
