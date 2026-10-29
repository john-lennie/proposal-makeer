import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { StructuredProposalDocument } from "@/components/structured-proposal-document";
import type { ProposalContentSnapshot } from "@/db/types";
import { createDefaultProposalSections } from "@/lib/draft-proposal";
import { inlineFields } from "@/lib/inline-proposal";

const snapshot: ProposalContentSnapshot = {
  schemaVersion: 1, proposalId: "proposal", title: "Identity project", client: { name: "Client" },
  provider: { displayName: "Alder Studio", logoAssetUrl: "https://example.com/logo.png" },
  currency: "CAD", theme: { accentColor: "#123456", headingStyle: "modern" },
  sections: createDefaultProposalSections("Identity project", "Client"),
};

describe("proposal presentation", () => {
  test("renders the saved brand and content without exposing editing controls publicly", () => {
    const html = renderToStaticMarkup(<StructuredProposalDocument snapshot={snapshot} revisionLabel="Revision 3" />);
    expect(html).toContain("Alder Studio");
    expect(html).toContain('src="https://example.com/logo.png"');
    expect(html).toContain("--brand-accent:#123456");
    expect(html).toContain("Revision 3");
    expect(html).toContain("A considered proposal, prepared for your review.");
    expect(html).not.toContain("inline-field");
  });
  test("every rendered editable field maps to a server-approved field", () => {
    const paths: string[] = [];
    renderToStaticMarkup(<StructuredProposalDocument snapshot={snapshot} revisionLabel="Draft" renderField={(section, path, value) => {
      expect(inlineFields(section).find((field) => field.path === path), `${section.type}:${path}`).toBeDefined();
      paths.push(`${section.type}:${path}`);
      return value;
    }} />);
    expect(paths).toContain("cover:preparedBy");
    expect(paths).toContain("text:body.blocks.0.text");
    expect(paths).toContain("pricing:items.0.amountMinor");
    expect(paths).toContain("acceptance:acceptLabel");
  });
  test("preserves section order and rich text block structure", () => {
    const text = { id: "text", type: "text" as const, title: "Overview", body: { version: 1 as const, blocks: [{ type: "heading" as const, text: "A heading", level: 3 as const }, { type: "list" as const, items: ["First item", "Second item"] }] } };
    const html = renderToStaticMarkup(<StructuredProposalDocument snapshot={{ ...snapshot, sections: [text, snapshot.sections[0]] }} revisionLabel="Draft" />);
    expect(html.indexOf('id="overview"')).toBeLessThan(html.indexOf('id="cover"'));
    expect(html).toContain("A heading</h3>");
    expect(html).toContain("<li>First item</li>");
  });
  test("does not render unsafe logo URLs", () => {
    const html = renderToStaticMarkup(<StructuredProposalDocument snapshot={{ ...snapshot, provider: { displayName: "Studio", logoAssetUrl: "javascript:alert(1)" } }} revisionLabel="Draft" />);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("javascript:");
  });
});
