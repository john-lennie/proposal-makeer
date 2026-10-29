import { describe, expect, test } from "vitest";
import { brandStyle, resolveBrand, validateBrand } from "@/lib/brand";
import { parseProposalContentSnapshot } from "@/lib/published-proposal";
import { createDefaultProposalSections } from "@/lib/draft-proposal";

const brand = { displayName: " Alder Studio ", logoAssetUrl: "https://example.com/logo.png", accentColor: "#AB1234", headingStyle: "modern" };

describe("brand validation and publication", () => {
  test("normalizes saved brand values", () => {
    expect(validateBrand(brand)).toEqual({ success: true, data: { ...brand, displayName: "Alder Studio", accentColor: "#ab1234" } });
  });
  test.each([
    { displayName: " " }, { displayName: "x".repeat(161) },
    { accentColor: "red; background: url(https://example.com)" },
    { accentColor: "#123" }, { logoAssetUrl: "javascript:alert(1)" },
    { logoAssetUrl: "data:image/svg+xml,test" }, { logoAssetUrl: "http://example.com/logo.png" },
    { logoAssetUrl: "https://user:secret@example.com/logo.png" }, { headingStyle: "arbitrary-font" },
  ])("rejects invalid or unsafe settings: %j", (changes) => {
    expect(validateBrand({ ...brand, ...changes }).success).toBe(false);
  });
  test("supports removing a logo", () => {
    expect(validateBrand({ ...brand, logoAssetUrl: "" }).success).toBe(true);
  });
  test("workspace brand wins for drafts without mutating published snapshots", () => {
    const published = { displayName: "Old studio", accentColor: "#123456" };
    expect(resolveBrand({ displayName: "New studio", logoAssetUrl: "" }, published)).toEqual({ displayName: "New studio", accentColor: "#123456", logoAssetUrl: "" });
    expect(published).toEqual({ displayName: "Old studio", accentColor: "#123456" });
  });
  test("chooses readable text on light and dark accent colors and ignores invalid CSS", () => {
    expect(brandStyle({ accentColor: "#ffffff" })).toHaveProperty("--brand-on-accent", "#000000");
    expect(brandStyle({ accentColor: "#000000" })).toHaveProperty("--brand-on-accent", "#ffffff");
    expect(brandStyle({ accentColor: "url(unsafe)" })).toHaveProperty("--brand-accent", "#677057");
  });
  test("accepts older snapshots and preserves brand settings in new snapshots", () => {
    const snapshot = { schemaVersion: 1, proposalId: "test", title: "Test", client: { name: "Client" }, provider: { displayName: "Studio" }, currency: "CAD", theme: {}, sections: createDefaultProposalSections("Test", "Client") };
    expect(parseProposalContentSnapshot(snapshot)).not.toBeNull();
    expect(parseProposalContentSnapshot({ ...snapshot, theme: { headingStyle: "modern" } })?.theme.headingStyle).toBe("modern");
    expect(parseProposalContentSnapshot({ ...snapshot, theme: { headingStyle: "invalid" } })).toBeNull();
  });
});
