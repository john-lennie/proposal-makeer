import type {
  ProposalSectionContent,
  ProposalSectionType,
} from "@/db/types";

export interface ProposalBasicsInput {
  title: string;
  clientName: string;
  slug?: string;
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; message: string; fields?: Record<string, string> };

export function suggestProposalSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function validateProposalBasics(
  input: ProposalBasicsInput,
): ValidationResult<Required<ProposalBasicsInput>> {
  const title = input.title.trim();
  const clientName = input.clientName.trim();
  const requestedSlug = input.slug?.trim();
  const slug = suggestProposalSlug(requestedSlug || title);
  const fields: Record<string, string> = {};

  if (title.length < 3 || title.length > 240) {
    fields.title = "Use a title between 3 and 240 characters.";
  }
  if (clientName.length < 2 || clientName.length > 160) {
    fields.clientName = "Use a client name between 2 and 160 characters.";
  }
  if (slug.length < 3 || slug.length > 120) {
    fields.slug = "Use a slug between 3 and 120 letters, numbers, or hyphens.";
  }

  if (Object.keys(fields).length > 0) {
    return {
      success: false,
      message: "Please correct the highlighted fields.",
      fields,
    };
  }

  return { success: true, data: { title, clientName, slug } };
}

export function createDefaultSection(
  type: ProposalSectionType,
  context: { title: string; clientName: string },
): ProposalSectionContent {
  const id = crypto.randomUUID();
  const { title, clientName } = context;

  switch (type) {
    case "cover":
      return {
        id,
        type,
        eyebrow: "A proposal for",
        title,
        subtitle: "A considered proposal, prepared for your review.",
        preparedFor: clientName,
        preparedBy: "Your studio",
      };
    case "text":
      return {
        id,
        type,
        eyebrow: "Project overview",
        title: "The opportunity",
        body: {
          version: 1,
          blocks: [
            {
              type: "paragraph",
              text: "Describe the context, opportunity, and recommended direction.",
            },
          ],
        },
      };
    case "objectives":
      return {
        id,
        type,
        eyebrow: "Objectives",
        title: "What success looks like",
        introduction: "The engagement will focus on these outcomes.",
        items: [{ id: crypto.randomUUID(), text: "Define the primary outcome." }],
      };
    case "scope":
      return {
        id,
        type,
        eyebrow: "Scope of work",
        title: "A focused engagement",
        introduction: "The work is organized into clear areas of responsibility.",
        items: [
          {
            id: crypto.randomUUID(),
            title: "Core service",
            description: "Describe the main area of work.",
            includes: ["Key activity"],
          },
        ],
      };
    case "deliverables":
      return {
        id,
        type,
        eyebrow: "Deliverables",
        title: "What you will receive",
        introduction: "A concise set of tangible outputs.",
        items: [{ id: crypto.randomUUID(), title: "Primary deliverable" }],
      };
    case "timeline":
      return {
        id,
        type,
        eyebrow: "Timeline",
        title: "A clear path forward",
        introduction: "A practical sequence from kickoff to completion.",
        phases: [
          {
            id: crypto.randomUUID(),
            label: "Week 1",
            title: "Kickoff",
            description: "Alignment, inputs, and project planning.",
          },
        ],
      };
    case "pricing":
      return {
        id,
        type,
        eyebrow: "Investment",
        title: "Project investment",
        introduction: "A clear investment for the complete engagement.",
        items: [
          {
            id: crypto.randomUUID(),
            label: "Professional services",
            amountMinor: 0,
          },
        ],
      };
    case "terms":
      return {
        id,
        type,
        eyebrow: "Terms",
        title: "Working together",
        items: [
          {
            id: crypto.randomUUID(),
            text: "A signed proposal and initial retainer reserve the project.",
          },
        ],
      };
    case "acceptance":
      return {
        id,
        type,
        eyebrow: "Acceptance",
        title: "Ready to begin?",
        body: "Accept this proposal to confirm the engagement.",
        acceptLabel: "Accept proposal",
        declineLabel: "Decline",
      };
  }
}

export function createDefaultProposalSections(
  title: string,
  clientName: string,
): ProposalSectionContent[] {
  const context = { title, clientName };
  const types: ProposalSectionType[] = [
    "cover",
    "text",
    "objectives",
    "scope",
    "deliverables",
    "timeline",
    "pricing",
    "terms",
    "acceptance",
  ];

  return types.map((type) => createDefaultSection(type, context));
}

function requiredText(
  formData: FormData,
  name: string,
  maximum = 2_000,
): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum
    ? normalized
    : null;
}

function optionalText(
  formData: FormData,
  name: string,
  maximum = 2_000,
): string | undefined {
  const value = formData.get(name);
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maximum) : undefined;
}

function lines(value: FormDataEntryValue | null): string[] {
  return typeof value === "string"
    ? value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 50)
    : [];
}

function pipeRows(value: FormDataEntryValue | null): string[][] {
  return lines(value).map((line) =>
    line.split("|").map((part) => part.trim()),
  );
}

export function validateSectionForm(
  existing: ProposalSectionContent,
  formData: FormData,
): ValidationResult<ProposalSectionContent> {
  const title = requiredText(formData, "title", 240);
  const eyebrow = optionalText(formData, "eyebrow", 120);

  if (!title) {
    return { success: false, message: "A section title is required." };
  }

  const base = { ...existing, title, eyebrow };

  switch (existing.type) {
    case "cover": {
      const preparedFor = requiredText(formData, "preparedFor", 160);
      const preparedBy = requiredText(formData, "preparedBy", 160);
      if (!preparedFor || !preparedBy) {
        return {
          success: false,
          message: "Prepared for and prepared by are required.",
        };
      }
      return {
        success: true,
        data: {
          ...base,
          type: "cover",
          preparedFor,
          preparedBy,
          subtitle: optionalText(formData, "subtitle"),
          location: optionalText(formData, "location", 160),
          dateLabel: optionalText(formData, "dateLabel", 100),
        },
      };
    }
    case "text": {
      const body = requiredText(formData, "body", 10_000);
      return body
        ? {
            success: true,
            data: {
              ...base,
              type: "text",
              body: {
                version: 1,
                blocks: [{ type: "paragraph", text: body }],
              },
            },
          }
        : { success: false, message: "Body copy is required." };
    }
    case "objectives": {
      const items = lines(formData.get("items"));
      return items.length
        ? {
            success: true,
            data: {
              ...base,
              type: "objectives",
              introduction: optionalText(formData, "introduction"),
              items: items.map((text, index) => ({
                id: existing.items[index]?.id ?? crypto.randomUUID(),
                text,
              })),
            },
          }
        : { success: false, message: "Add at least one objective." };
    }
    case "deliverables": {
      const items = lines(formData.get("items"));
      return items.length
        ? {
            success: true,
            data: {
              ...base,
              type: "deliverables",
              introduction: optionalText(formData, "introduction"),
              items: items.map((itemTitle, index) => ({
                id: existing.items[index]?.id ?? crypto.randomUUID(),
                title: itemTitle,
              })),
            },
          }
        : { success: false, message: "Add at least one deliverable." };
    }
    case "terms": {
      const items = lines(formData.get("items"));
      return items.length
        ? {
            success: true,
            data: {
              ...base,
              type: "terms",
              items: items.map((text, index) => ({
                id: existing.items[index]?.id ?? crypto.randomUUID(),
                text,
              })),
            },
          }
        : { success: false, message: "Add at least one term." };
    }
    case "acceptance": {
      const body = requiredText(formData, "body");
      const acceptLabel = requiredText(formData, "acceptLabel", 80);
      const declineLabel = requiredText(formData, "declineLabel", 80);
      return body && acceptLabel && declineLabel
        ? {
            success: true,
            data: {
              ...base,
              type: "acceptance",
              body,
              acceptLabel,
              declineLabel,
            },
          }
        : {
            success: false,
            message: "Acceptance copy and button labels are required.",
          };
    }
    case "scope": {
      const items = pipeRows(formData.get("items"));
      if (
        items.length === 0 ||
        items.some(([itemTitle, description]) => !itemTitle || !description)
      ) {
        return {
          success: false,
          message:
            "Add scope items as Title | Description | included item, included item.",
        };
      }
      return {
        success: true,
        data: {
          ...base,
          type: "scope",
          introduction: optionalText(formData, "introduction"),
          items: items.map(([itemTitle, description, included], index) => ({
            id: existing.items[index]?.id ?? crypto.randomUUID(),
            title: itemTitle,
            description,
            includes: (included ?? "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          })),
        },
      };
    }
    case "timeline": {
      const phases = pipeRows(formData.get("items"));
      if (
        phases.length === 0 ||
        phases.some(([label, phaseTitle]) => !label || !phaseTitle)
      ) {
        return {
          success: false,
          message: "Add timeline phases as Label | Title | Description.",
        };
      }
      return {
        success: true,
        data: {
          ...base,
          type: "timeline",
          introduction: optionalText(formData, "introduction"),
          phases: phases.map(([label, phaseTitle, description], index) => ({
            id: existing.phases[index]?.id ?? crypto.randomUUID(),
            label,
            title: phaseTitle,
            description,
          })),
        },
      };
    }
    case "pricing": {
      const items = pipeRows(formData.get("items"));
      const parsed = items.map(([label, description, amount], index) => ({
        id: existing.items[index]?.id ?? crypto.randomUUID(),
        label,
        description,
        amountMinor: Math.round(Number(amount) * 100),
      }));
      if (
        parsed.length === 0 ||
        parsed.some(
          (item) =>
            !item.label ||
            !Number.isSafeInteger(item.amountMinor) ||
            item.amountMinor < 0,
        )
      ) {
        return {
          success: false,
          message: "Add pricing items as Label | Description | Amount.",
        };
      }
      return {
        success: true,
        data: {
          ...base,
          type: "pricing",
          title,
          eyebrow,
          introduction: optionalText(formData, "introduction"),
          items: parsed,
        },
      };
    }
  }
}
