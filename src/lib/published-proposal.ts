import type {
  ProposalContentSnapshot,
  ProposalSectionContent,
  RichTextDocument,
  ThemeSettings,
} from "@/db/types";
import type { PublishedProposal } from "@/data/proposals";
import type {
  DemoProposal,
  ProposalSection,
  ProposalSectionId,
} from "@/lib/proposal";

const SECTION_TYPES = new Set<ProposalSectionContent["type"]>([
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function hasSectionBase(
  value: Record<string, unknown>,
): value is Record<string, unknown> & {
  id: string;
  title: string;
  eyebrow?: string;
} {
  return (
    isString(value.id) &&
    isString(value.title) &&
    isOptionalString(value.eyebrow)
  );
}

function isRichTextDocument(value: unknown): value is RichTextDocument {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.blocks)) {
    return false;
  }

  return value.blocks.every((block) => {
    if (!isRecord(block)) return false;
    if (!["paragraph", "heading", "list"].includes(String(block.type))) {
      return false;
    }

    return (
      isOptionalString(block.text) &&
      (block.level === undefined || block.level === 2 || block.level === 3) &&
      (block.items === undefined || isStringArray(block.items))
    );
  });
}

function isIdTextItem(value: unknown): boolean {
  return isRecord(value) && isString(value.id) && isString(value.text);
}

function isSectionContent(value: unknown): value is ProposalSectionContent {
  if (!isRecord(value) || !hasSectionBase(value)) return false;
  if (
    !isString(value.type) ||
    !SECTION_TYPES.has(value.type as ProposalSectionContent["type"])
  ) {
    return false;
  }

  switch (value.type) {
    case "cover":
      return (
        isString(value.preparedFor) &&
        isString(value.preparedBy) &&
        isOptionalString(value.subtitle) &&
        isOptionalString(value.location) &&
        isOptionalString(value.dateLabel)
      );
    case "text":
      return isRichTextDocument(value.body);
    case "objectives":
      return (
        isOptionalString(value.introduction) &&
        Array.isArray(value.items) &&
        value.items.length > 0 &&
        value.items.every(isIdTextItem)
      );
    case "scope":
      return (
        isOptionalString(value.introduction) &&
        Array.isArray(value.items) &&
        value.items.length > 0 &&
        value.items.every(
          (item) =>
            isRecord(item) &&
            isString(item.id) &&
            isString(item.title) &&
            isString(item.description) &&
            isStringArray(item.includes),
        )
      );
    case "deliverables":
      return (
        isOptionalString(value.introduction) &&
        Array.isArray(value.items) &&
        value.items.length > 0 &&
        value.items.every(
          (item) =>
            isRecord(item) &&
            isString(item.id) &&
            isString(item.title) &&
            isOptionalString(item.description),
        )
      );
    case "timeline":
      return (
        isOptionalString(value.introduction) &&
        Array.isArray(value.phases) &&
        value.phases.length > 0 &&
        value.phases.every(
          (phase) =>
            isRecord(phase) &&
            isString(phase.id) &&
            isString(phase.label) &&
            isString(phase.title) &&
            isOptionalString(phase.description) &&
            isOptionalString(phase.startsOn) &&
            isOptionalString(phase.endsOn),
        )
      );
    case "pricing":
      return (
        isOptionalString(value.introduction) &&
        isOptionalString(value.taxLabel) &&
        (value.taxRateBasisPoints === undefined ||
          (Number.isInteger(value.taxRateBasisPoints) &&
            Number(value.taxRateBasisPoints) >= 0)) &&
        Array.isArray(value.items) &&
        value.items.length > 0 &&
        value.items.every(
          (item) =>
            isRecord(item) &&
            isString(item.id) &&
            isString(item.label) &&
            isOptionalString(item.description) &&
            Number.isSafeInteger(item.amountMinor) &&
            Number(item.amountMinor) >= 0,
        )
      );
    case "terms":
      return (
        Array.isArray(value.items) &&
        value.items.length > 0 &&
        value.items.every(isIdTextItem)
      );
    case "acceptance":
      return (
        isString(value.body) &&
        isString(value.acceptLabel) &&
        isString(value.declineLabel)
      );
    default:
      return false;
  }
}

function isThemeSettings(value: unknown): value is ThemeSettings {
  return (
    isRecord(value) &&
    isOptionalString(value.accentColor) &&
    isOptionalString(value.logoAssetUrl) &&
    isOptionalString(value.displayName) &&
    (value.headingStyle === undefined || value.headingStyle === "editorial" || value.headingStyle === "modern")
  );
}

export function parseProposalContentSnapshot(
  value: unknown,
): ProposalContentSnapshot | null {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !isString(value.proposalId) ||
    !isString(value.title) ||
    !isRecord(value.client) ||
    !isString(value.client.name) ||
    !isOptionalString(value.client.organizationName) ||
    !isRecord(value.provider) ||
    !isString(value.provider.displayName) ||
    !isOptionalString(value.provider.logoAssetUrl) ||
    !isString(value.currency) ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    !isThemeSettings(value.theme) ||
    !Array.isArray(value.sections) ||
    value.sections.length === 0 ||
    !value.sections.every(isSectionContent) ||
    !isOptionalString(value.expiresAt)
  ) {
    return null;
  }

  const sectionTypes = new Set(value.sections.map((section) => section.type));
  if (!sectionTypes.has("cover") || !sectionTypes.has("acceptance")) {
    return null;
  }

  if (value.expiresAt && Number.isNaN(Date.parse(value.expiresAt))) {
    return null;
  }

  return value as unknown as ProposalContentSnapshot;
}

export function isPublishedProposalVisible(
  proposal: PublishedProposal | null,
  now = new Date(),
): proposal is PublishedProposal {
  if (!proposal || proposal.passwordProtected) return false;

  const snapshot = parseProposalContentSnapshot(proposal.content);
  if (!snapshot) return false;

  return !snapshot.expiresAt || new Date(snapshot.expiresAt) >= now;
}

const SECTION_LABELS: Record<ProposalSectionContent["type"], string> = {
  cover: "Cover",
  text: "Project overview",
  objectives: "Objectives",
  scope: "Scope of work",
  deliverables: "Deliverables",
  timeline: "Timeline",
  pricing: "Pricing",
  terms: "Terms",
  acceptance: "Acceptance",
};

function legacySectionId(
  section: ProposalSectionContent,
): ProposalSectionId {
  return section.type === "text" ? "overview" : section.type;
}

function sectionBody(section: ProposalSectionContent): string {
  switch (section.type) {
    case "cover":
      return section.subtitle ?? "";
    case "text":
      return section.body.blocks
        .flatMap((block) => block.text ?? block.items ?? [])
        .join(" ");
    case "objectives":
    case "scope":
    case "deliverables":
    case "timeline":
    case "pricing":
      return section.introduction ?? "";
    case "terms":
      return section.items.map((item) => item.text).join(" ");
    case "acceptance":
      return section.body;
  }
}

function toLegacySection(
  section: ProposalSectionContent,
): ProposalSection {
  return {
    id: legacySectionId(section),
    label: SECTION_LABELS[section.type],
    eyebrow: section.eyebrow ?? SECTION_LABELS[section.type],
    title: section.title,
    body: sectionBody(section),
  };
}

export function toProposalViewModel(
  proposal: PublishedProposal,
  snapshot: ProposalContentSnapshot,
): DemoProposal {
  const cover = snapshot.sections.find((section) => section.type === "cover");
  const objectives = snapshot.sections.find(
    (section) => section.type === "objectives",
  );
  const scope = snapshot.sections.find((section) => section.type === "scope");
  const deliverables = snapshot.sections.find(
    (section) => section.type === "deliverables",
  );
  const timeline = snapshot.sections.find(
    (section) => section.type === "timeline",
  );
  const pricing = snapshot.sections.find(
    (section) => section.type === "pricing",
  );
  const terms = snapshot.sections.find((section) => section.type === "terms");
  const acceptance = snapshot.sections.find(
    (section) => section.type === "acceptance",
  );

  return {
    id: proposal.proposalId,
    slug: "",
    title: snapshot.title,
    client: snapshot.client.organizationName ?? snapshot.client.name,
    clientLocation: cover?.type === "cover" ? (cover.location ?? "") : "",
    dateLabel: cover?.type === "cover" ? (cover.dateLabel ?? "") : "",
    company: snapshot.provider.displayName,
    companyTagline: "",
    currency: snapshot.currency,
    acceptLabel:
      acceptance?.type === "acceptance"
        ? acceptance.acceptLabel
        : "Accept proposal",
    declineLabel:
      acceptance?.type === "acceptance" ? acceptance.declineLabel : "Decline",
    revision: proposal.revisionNumber,
    status:
      proposal.decision === "ACCEPTED"
        ? "accepted"
        : proposal.decision === "DECLINED"
          ? "declined"
          : "published",
    updatedAt: proposal.publishedAt.toISOString(),
    validUntil: snapshot.expiresAt
      ? new Intl.DateTimeFormat("en-CA", {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(snapshot.expiresAt))
      : "No expiry",
    sections: snapshot.sections.map(toLegacySection),
    objectives:
      objectives?.type === "objectives"
        ? objectives.items.map((item) => item.text)
        : [],
    scope:
      scope?.type === "scope"
        ? scope.items.map((item, index) => ({
            number: String(index + 1).padStart(2, "0"),
            title: item.title,
            description: item.description,
            includes: item.includes,
          }))
        : [],
    deliverables:
      deliverables?.type === "deliverables"
        ? deliverables.items.map((item) => item.title)
        : [],
    timeline:
      timeline?.type === "timeline"
        ? timeline.phases.map((phase) => ({
            date: phase.label,
            title: phase.title,
            description: phase.description ?? "",
          }))
        : [],
    pricing:
      pricing?.type === "pricing"
        ? pricing.items.map((item) => ({
            label: item.label,
            detail: item.description ?? "",
            amount: item.amountMinor / 100,
          }))
        : [],
    terms:
      terms?.type === "terms"
        ? terms.items.map((item) => item.text)
        : [],
  };
}

export function selectPublicProposal(
  proposal: PublishedProposal | null,
  now = new Date(),
): DemoProposal | null {
  if (!isPublishedProposalVisible(proposal, now)) return null;

  const snapshot = parseProposalContentSnapshot(proposal.content);
  return snapshot ? toProposalViewModel(proposal, snapshot) : null;
}
