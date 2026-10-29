export interface ThemeSettings {
  accentColor?: string;
  logoAssetUrl?: string;
  displayName?: string;
  headingStyle?: "editorial" | "modern";
}

export interface RichTextDocument {
  version: 1;
  blocks: Array<{
    type: "paragraph" | "heading" | "list";
    text?: string;
    level?: 2 | 3;
    items?: string[];
  }>;
}

interface SectionBase {
  id: string;
  eyebrow?: string;
  title: string;
}

export type ProposalSectionContent =
  | (SectionBase & {
      type: "cover";
      subtitle?: string;
      preparedFor: string;
      preparedBy: string;
      location?: string;
      dateLabel?: string;
    })
  | (SectionBase & {
      type: "text";
      body: RichTextDocument;
    })
  | (SectionBase & {
      type: "objectives";
      introduction?: string;
      items: Array<{ id: string; text: string }>;
    })
  | (SectionBase & {
      type: "scope";
      introduction?: string;
      items: Array<{
        id: string;
        title: string;
        description: string;
        includes: string[];
      }>;
    })
  | (SectionBase & {
      type: "deliverables";
      introduction?: string;
      items: Array<{ id: string; title: string; description?: string }>;
    })
  | (SectionBase & {
      type: "timeline";
      introduction?: string;
      phases: Array<{
        id: string;
        label: string;
        title: string;
        description?: string;
        startsOn?: string;
        endsOn?: string;
      }>;
    })
  | (SectionBase & {
      type: "pricing";
      introduction?: string;
      items: Array<{
        id: string;
        label: string;
        description?: string;
        amountMinor: number;
      }>;
      taxLabel?: string;
      taxRateBasisPoints?: number;
    })
  | (SectionBase & {
      type: "terms";
      items: Array<{ id: string; text: string }>;
    })
  | (SectionBase & {
      type: "acceptance";
      body: string;
      acceptLabel: string;
      declineLabel: string;
    });

export type ProposalSectionType = ProposalSectionContent["type"];

export interface ProposalDraftContent {
  proposalId: string;
  title: string;
  client: {
    name: string;
    organizationName?: string;
  };
  currency: string;
  theme: ThemeSettings;
  sections: ProposalSectionContent[];
  expiresAt?: string;
}

export interface ProposalContentSnapshot {
  schemaVersion: 1;
  proposalId: string;
  title: string;
  client: {
    name: string;
    organizationName?: string;
  };
  provider: {
    displayName: string;
    logoAssetUrl?: string;
  };
  currency: string;
  theme: ThemeSettings;
  sections: ProposalSectionContent[];
  expiresAt?: string;
}

export interface ClientSnapshot {
  name: string;
  organizationName?: string;
  email?: string;
}
