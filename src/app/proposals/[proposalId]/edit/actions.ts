"use server";

import { revalidatePath } from "next/cache";

import {
  addDraftSection,
  getDraftSection,
  moveDraftSection,
  removeDraftSection,
  updateDraftSection,
  updateProposalDetails,
} from "@/data/proposal-drafts";
import {
  publishProposalDraft,
  unpublishProposal,
} from "@/data/proposal-publication";
import type { ProposalSectionType } from "@/db/types";
import type {
  EditorActionState,
  PublicationActionState,
} from "@/lib/action-state";
import {
  createDefaultSection,
  validateProposalBasics,
  validateSectionForm,
} from "@/lib/draft-proposal";
import { requireWorkspaceMember } from "@/lib/authorization";

const SECTION_TYPES = new Set<ProposalSectionType>([
  "cover",
  "text",
  "objectives",
  "scope",
  "deliverables",
  "timeline",
  "pricing",
  "terms",
  "acceptance",
]);

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function validId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mutationState(
  result: Awaited<ReturnType<typeof updateProposalDetails>>,
): EditorActionState {
  if (result.status === "ok") {
    return {
      status: "saved",
      message: "Saved",
      updatedAt: result.updatedAt,
    };
  }

  return {
    status: result.status === "conflict" ? "conflict" : "error",
    message: result.message,
  };
}

function revalidateProposal(proposalId: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/proposals/${proposalId}/edit`);
  revalidatePath(`/proposals/${proposalId}/preview`);
}

function revalidatePublication(proposalId: string, publicUrl: string) {
  revalidateProposal(proposalId);
  revalidatePath(publicUrl);
}

export async function updateProposalDetailsAction(
  _state: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  const { userId, workspaceId } = await requireWorkspaceMember();
  const proposalId = text(formData, "proposalId");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");
  const validation = validateProposalBasics({
    title: text(formData, "title"),
    clientName: text(formData, "clientName"),
    slug: text(formData, "slug"),
  });

  if (!validId(proposalId) || !expectedUpdatedAt) {
    return { status: "error", message: "Invalid proposal request." };
  }
  if (!validation.success) {
    return { status: "error", message: validation.message };
  }

  try {
    const result = await updateProposalDetails({
      workspaceId,
      userId,
      proposalId,
      expectedUpdatedAt,
      ...validation.data,
    });
    if (result.status === "ok") revalidateProposal(proposalId);
    return mutationState(result);
  } catch {
    return {
      status: "error",
      message: "The proposal details could not be saved.",
    };
  }
}

export async function updateSectionAction(
  _state: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  const { userId, workspaceId } = await requireWorkspaceMember();
  const proposalId = text(formData, "proposalId");
  const sectionId = text(formData, "sectionId");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");
  let sectionType: ProposalSectionType | undefined;

  if (
    !validId(proposalId) ||
    !validId(sectionId) ||
    !expectedUpdatedAt
  ) {
    return { status: "error", message: "Invalid section request." };
  }

  try {
    const section = await getDraftSection(
      workspaceId,
      proposalId,
      sectionId,
    );
    if (!section) {
      return { status: "error", message: "Section not found." };
    }
    sectionType = section.content.type;

    const validation = validateSectionForm(section.content, formData);
    if (!validation.success) {
      return { status: "error", message: validation.message };
    }

    const result = await updateDraftSection({
      workspaceId,
      userId,
      proposalId,
      sectionId,
      expectedUpdatedAt,
      content: validation.data,
    });
    if (result.status === "ok") revalidateProposal(proposalId);
    return mutationState(result);
  } catch (error) {
    const cause =
      error && typeof error === "object" && "cause" in error
        ? error.cause
        : error;

    console.error("Proposal section save failed.", {
      proposalId,
      sectionId,
      sectionType,
      errorName:
        cause && typeof cause === "object" && "name" in cause
          ? cause.name
          : undefined,
      errorCode:
        cause && typeof cause === "object" && "code" in cause
          ? cause.code
          : undefined,
    });

    return {
      status: "error",
      message:
        "The section could not be saved because of a server error. Refresh and try again.",
    };
  }
}

export async function addSectionAction(
  _state: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  const { userId, workspaceId } = await requireWorkspaceMember();
  const proposalId = text(formData, "proposalId");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");
  const requestedType = text(formData, "sectionType") as ProposalSectionType;
  const title = text(formData, "proposalTitle");
  const clientName = text(formData, "clientName");

  if (
    !validId(proposalId) ||
    !expectedUpdatedAt ||
    !SECTION_TYPES.has(requestedType)
  ) {
    return { status: "error", message: "Invalid section request." };
  }

  try {
    const result = await addDraftSection({
      workspaceId,
      userId,
      proposalId,
      expectedUpdatedAt,
      content: createDefaultSection(requestedType, { title, clientName }),
    });
    if (result.status === "ok") revalidateProposal(proposalId);
    return mutationState(result);
  } catch {
    return { status: "error", message: "The section could not be added." };
  }
}

export async function removeSectionAction(
  _state: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  const { userId, workspaceId } = await requireWorkspaceMember();
  const proposalId = text(formData, "proposalId");
  const sectionId = text(formData, "sectionId");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");

  if (!validId(proposalId) || !validId(sectionId) || !expectedUpdatedAt) {
    return { status: "error", message: "Invalid section request." };
  }

  try {
    const result = await removeDraftSection({
      workspaceId,
      userId,
      proposalId,
      sectionId,
      expectedUpdatedAt,
    });
    if (result.status === "ok") revalidateProposal(proposalId);
    return mutationState(result);
  } catch {
    return { status: "error", message: "The section could not be removed." };
  }
}

export async function moveSectionAction(
  _state: EditorActionState,
  formData: FormData,
): Promise<EditorActionState> {
  const { userId, workspaceId } = await requireWorkspaceMember();
  const proposalId = text(formData, "proposalId");
  const sectionId = text(formData, "sectionId");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");
  const direction = text(formData, "direction");

  if (
    !validId(proposalId) ||
    !validId(sectionId) ||
    !expectedUpdatedAt ||
    (direction !== "up" && direction !== "down")
  ) {
    return { status: "error", message: "Invalid reorder request." };
  }

  try {
    const result = await moveDraftSection({
      workspaceId,
      userId,
      proposalId,
      sectionId,
      expectedUpdatedAt,
      direction,
    });
    if (result.status === "ok") revalidateProposal(proposalId);
    return mutationState(result);
  } catch {
    return { status: "error", message: "The section could not be moved." };
  }
}

export async function publishProposalAction(
  _state: PublicationActionState,
  formData: FormData,
): Promise<PublicationActionState> {
  const { userId, workspaceId } = await requireWorkspaceMember();
  const proposalId = text(formData, "proposalId");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");

  if (
    !validId(proposalId) ||
    !expectedUpdatedAt ||
    Number.isNaN(Date.parse(expectedUpdatedAt))
  ) {
    return { status: "error", message: "Invalid publishing request." };
  }

  try {
    const result = await publishProposalDraft({
      workspaceId,
      userId,
      proposalId,
      expectedUpdatedAt,
    });

    if (result.status !== "ok") {
      return {
        status: result.status === "conflict" ? "conflict" : "error",
        message: result.message,
      };
    }

    revalidatePublication(proposalId, result.publicUrl);

    return {
      status: "success",
      message: `Revision ${result.revisionNumber} is now published.`,
      publicUrl: result.publicUrl,
      responseUrl: result.responseUrl,
      revisionNumber: result.revisionNumber,
    };
  } catch (error) {
    console.error("Proposal publishing failed.", {
      proposalId,
      errorName: error instanceof Error ? error.name : undefined,
      errorCode:
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined,
    });

    return {
      status: "error",
      message:
        "The proposal could not be published because of a server error. Refresh and try again.",
    };
  }
}

export async function unpublishProposalAction(
  _state: PublicationActionState,
  formData: FormData,
): Promise<PublicationActionState> {
  const { workspaceId } = await requireWorkspaceMember();
  const proposalId = text(formData, "proposalId");
  const expectedUpdatedAt = text(formData, "expectedUpdatedAt");

  if (
    !validId(proposalId) ||
    !expectedUpdatedAt ||
    Number.isNaN(Date.parse(expectedUpdatedAt))
  ) {
    return { status: "error", message: "Invalid unpublishing request." };
  }

  try {
    const result = await unpublishProposal({
      workspaceId,
      proposalId,
      expectedUpdatedAt,
    });

    if (result.status !== "ok") {
      return {
        status: result.status === "conflict" ? "conflict" : "error",
        message: result.message,
      };
    }

    revalidatePublication(proposalId, result.publicUrl);

    return {
      status: "success",
      message: "The proposal is now unpublished. Its revision history is preserved.",
    };
  } catch (error) {
    console.error("Proposal unpublishing failed.", {
      proposalId,
      errorName: error instanceof Error ? error.name : undefined,
      errorCode:
        error && typeof error === "object" && "code" in error
          ? error.code
          : undefined,
    });

    return {
      status: "error",
      message:
        "The proposal could not be unpublished because of a server error. Refresh and try again.",
    };
  }
}
