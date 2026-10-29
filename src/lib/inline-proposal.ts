import type { ProposalSectionContent } from "@/db/types";

export interface InlineFieldSpec {
  path: string;
  label: string;
  value: string;
  required: boolean;
  multiline: boolean;
  maxLength: number;
  money?: boolean;
}

/** The same allowlist drives the UI and server validation. IDs and metadata are never editable. */
export function inlineFields(section: ProposalSectionContent): InlineFieldSpec[] {
  const fields: InlineFieldSpec[] = [];
  const add = (path: string, label: string, value: string | undefined, required = false, multiline = false, maxLength = 2000, money = false) => {
    fields.push({ path, label, value: value ?? "", required, multiline, maxLength, money });
  };
  add("eyebrow", "Section label", section.eyebrow, false, false, 120);
  add("title", "Section heading", section.title, true, true, 240);
  if ("introduction" in section || ["objectives", "scope", "deliverables", "timeline", "pricing"].includes(section.type)) {
    add("introduction", "Introduction", "introduction" in section ? section.introduction : undefined, false, true);
  }
  switch (section.type) {
    case "cover":
      add("subtitle", "Cover introduction", section.subtitle, false, true);
      add("preparedFor", "Prepared for", section.preparedFor, true, false, 160);
      add("preparedBy", "Prepared by", section.preparedBy, true, false, 160);
      add("location", "Location", section.location, false, false, 160);
      add("dateLabel", "Date", section.dateLabel, false, false, 100);
      break;
    case "text":
      section.body.blocks.forEach((block, i) => {
        if (block.type === "list") block.items?.forEach((item, j) => add(`body.blocks.${i}.items.${j}`, "List item", item, true, true));
        else add(`body.blocks.${i}.text`, "Body text", block.text, true, true, 10000);
      });
      break;
    case "objectives":
    case "terms":
      section.items.forEach((item, i) => add(`items.${i}.text`, `${section.type === "terms" ? "Term" : "Objective"} ${i + 1}`, item.text, true, true));
      break;
    case "scope":
      section.items.forEach((item, i) => {
        add(`items.${i}.title`, "Scope item title", item.title, true, false, 240);
        add(`items.${i}.description`, "Scope description", item.description, true, true);
        item.includes.forEach((text, j) => add(`items.${i}.includes.${j}`, "Included item", text, true));
      });
      break;
    case "deliverables":
      section.items.forEach((item, i) => {
        add(`items.${i}.title`, "Deliverable", item.title, true, false, 240);
        add(`items.${i}.description`, "Deliverable description", item.description, false, true);
      });
      break;
    case "timeline":
      section.phases.forEach((phase, i) => {
        add(`phases.${i}.label`, "Phase date or label", phase.label, true, false, 160);
        add(`phases.${i}.title`, "Phase title", phase.title, true, false, 240);
        add(`phases.${i}.description`, "Phase description", phase.description, false, true);
      });
      break;
    case "pricing":
      section.items.forEach((item, i) => {
        add(`items.${i}.label`, "Service name", item.label, true, false, 240);
        add(`items.${i}.description`, "Service description", item.description, false, true);
        add(`items.${i}.amountMinor`, "Price", (item.amountMinor / 100).toFixed(2), true, false, 16, true);
      });
      break;
    case "acceptance":
      add("body", "Closing message", section.body, true, true);
      add("acceptLabel", "Accept button label", section.acceptLabel, true, false, 80);
      add("declineLabel", "Decline button label", section.declineLabel, true, false, 80);
      break;
  }
  return fields;
}

export function updateInlineField(section: ProposalSectionContent, path: unknown, value: unknown):
  | { success: true; data: ProposalSectionContent }
  | { success: false; message: string } {
  if (typeof path !== "string" || typeof value !== "string") return { success: false, message: "Invalid field update." };
  const field = inlineFields(section).find((item) => item.path === path);
  if (!field) return { success: false, message: "This field cannot be edited." };
  const normalized = value.trim();
  if ((field.required && !normalized) || normalized.length > field.maxLength) {
    return { success: false, message: `${field.label} ${!normalized ? "is required" : `must be ${field.maxLength} characters or fewer`}.` };
  }
  let replacement: string | number = normalized;
  if (field.money) {
    replacement = Math.round(Number(normalized) * 100);
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized) || !Number.isSafeInteger(replacement) || replacement < 0) {
      return { success: false, message: "Enter a non-negative price with up to two decimal places." };
    }
  }
  const updated = structuredClone(section);
  const keys = path.split(".");
  let target = updated as unknown as Record<string, unknown>;
  for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[keys[keys.length - 1]] = replacement;
  return { success: true, data: updated };
}
