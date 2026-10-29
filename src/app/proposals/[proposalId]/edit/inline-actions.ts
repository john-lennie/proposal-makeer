"use server";

import { revalidatePath } from "next/cache";
import { getDraftSection, updateDraftSection } from "@/data/proposal-drafts";
import { requireWorkspaceMember } from "@/lib/authorization";
import { updateInlineField } from "@/lib/inline-proposal";
import type { EditorActionState } from "@/lib/action-state";

export async function saveInlineFieldAction(input: {
  proposalId: string; sectionId: string; path: string; value: string; expectedUpdatedAt: string;
}): Promise<EditorActionState> {
  const { workspaceId, userId } = await requireWorkspaceMember();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!input || typeof input !== "object" || typeof input.proposalId !== "string" || typeof input.sectionId !== "string" || !uuid.test(input.proposalId) || !uuid.test(input.sectionId) || typeof input.expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(input.expectedUpdatedAt))) {
    return { status: "error", message: "Invalid proposal request." };
  }
  try {
    const section = await getDraftSection(workspaceId, input.proposalId, input.sectionId);
    if (!section) return { status: "error", message: "Section not found." };
    const validation = updateInlineField(section.content, input.path, input.value);
    if (!validation.success) return { status: "error", message: validation.message };
    const result = await updateDraftSection({ workspaceId, userId, proposalId: input.proposalId,
      sectionId: input.sectionId, expectedUpdatedAt: input.expectedUpdatedAt, content: validation.data });
    if (result.status !== "ok") return { status: result.status === "conflict" ? "conflict" : "error", message: result.message };
    revalidatePath(`/proposals/${input.proposalId}/preview`);
    revalidatePath(`/proposals/${input.proposalId}/edit`);
    revalidatePath("/dashboard");
    return { status: "saved", message: "Saved to draft. Publish when you’re ready to share the changes.", updatedAt: result.updatedAt };
  } catch {
    return { status: "error", message: "This change could not be saved. Your edit is still here; please try again." };
  }
}
