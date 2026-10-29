"use server";

import { revalidatePath } from "next/cache";
import { saveWorkspaceBrand } from "@/data/brand";
import { requireWorkspaceMember } from "@/lib/authorization";
import { validateBrand } from "@/lib/brand";
import type { EditorActionState } from "@/lib/action-state";

export async function saveBrandAction(_state: EditorActionState, formData: FormData): Promise<EditorActionState> {
  const { workspaceId, role } = await requireWorkspaceMember();
  if (role !== "OWNER" && role !== "ADMIN") {
    return { status: "error", message: "Only workspace owners and admins can change the brand." };
  }
  const validation = validateBrand(Object.fromEntries(formData));
  if (!validation.success) return { status: "error", message: validation.message };
  try {
    if (!await saveWorkspaceBrand(workspaceId, validation.data)) {
      return { status: "error", message: "Workspace not found." };
    }
    revalidatePath("/settings/brand");
    revalidatePath("/proposals/[proposalId]/preview", "page");
    revalidatePath("/proposals/[proposalId]/edit", "page");
    revalidatePath("/dashboard");
    return { status: "saved", message: "Brand saved. Drafts use your new brand; publish again to update a client-facing proposal." };
  } catch {
    return { status: "error", message: "Your brand could not be saved. Please try again." };
  }
}
