import type { ProposalContentSnapshot } from "@/db/types";
import { parseProposalContentSnapshot } from "@/lib/published-proposal";

export type PublicationValidationResult =
  | { success: true; snapshot: ProposalContentSnapshot }
  | { success: false; message: string };

export function validateProposalForPublication(input: {
  slug: string;
  snapshot: ProposalContentSnapshot;
}): PublicationValidationResult {
  if (!input.snapshot.title.trim()) {
    return { success: false, message: "Add a proposal title before publishing." };
  }

  if (!input.snapshot.client.name.trim()) {
    return { success: false, message: "Add a client before publishing." };
  }

  if (
    input.slug.length < 3 ||
    input.slug.length > 120 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)
  ) {
    return {
      success: false,
      message: "Use a valid public slug before publishing.",
    };
  }

  if (
    !input.snapshot.sections.some(
      (section) => section.type !== "cover" && section.type !== "acceptance",
    )
  ) {
    return {
      success: false,
      message: "Add at least one content section before publishing.",
    };
  }

  const snapshot = parseProposalContentSnapshot(input.snapshot);
  if (!snapshot) {
    return {
      success: false,
      message:
        "One or more proposal sections are incomplete. Review the draft before publishing.",
    };
  }

  return { success: true, snapshot };
}
