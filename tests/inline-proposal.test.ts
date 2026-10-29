import { describe, expect, test } from "vitest";
import { createDefaultProposalSections } from "@/lib/draft-proposal";
import { inlineFields, updateInlineField } from "@/lib/inline-proposal";
import type { ProposalSectionContent } from "@/db/types";

const sections = createDefaultProposalSections("Brand identity", "Client");
const pricing = sections.find((section) => section.type === "pricing")!;

describe("direct proposal editing", () => {
  test.each(sections)("all editable fields in $type can round-trip without changing content", (section) => {
    for (const field of inlineFields(section)) {
      const result = updateInlineField(section, field.path, field.value);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(section.id);
        expect(result.data.type).toBe(section.type);
      }
    }
  });
  test("changes one item without losing rich text structure or other metadata", () => {
    const section: ProposalSectionContent = { id: "overview", type: "text", title: "Overview", body: { version: 1, blocks: [ { type: "heading", level: 3, text: "Heading" }, { type: "list", items: ["One", "Two"] } ] } };
    const result = updateInlineField(section, "body.blocks.1.items.0", " Revised ");
    expect(result).toEqual({ success: true, data: { ...section, body: { ...section.body, blocks: [section.body.blocks[0], { type: "list", items: ["Revised", "Two"] }] } } });
    expect(section.body.blocks[1].items).toEqual(["One", "Two"]);
  });
  test.each(["id", "type", "items.0.id", "items.999.label", "__proto__.polluted", "constructor.prototype.polluted"])("rejects non-editable paths: %s", (path) => {
    expect(updateInlineField(pricing, path, "changed").success).toBe(false);
  });
  test.each(["-1", "NaN", "Infinity", "1.999", "1e4", "1,000", "", "9007199254740991"])("rejects invalid prices: %s", (value) => {
    expect(updateInlineField(pricing, "items.0.amountMinor", value).success).toBe(false);
  });
  test.each([["0", 0], ["1234.56", 123456], ["0.29", 29]])("stores %s as integer minor units", (value, amount) => {
    const result = updateInlineField(pricing, "items.0.amountMinor", value);
    expect(result.success && result.data.type === "pricing" && result.data.items[0].amountMinor).toBe(amount);
  });
  test("rejects empty headings and oversized text rather than truncating", () => {
    expect(updateInlineField(pricing, "title", " ").success).toBe(false);
    expect(updateInlineField(pricing, "title", "x".repeat(241)).success).toBe(false);
  });
});
