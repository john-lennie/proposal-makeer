import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { InlineField } from "@/components/inline-field";
import type { InlineFieldSpec } from "@/lib/inline-proposal";

const spec: InlineFieldSpec = { path: "title", label: "Section heading", value: "A considered approach", required: true, multiline: true, maxLength: 240 };
function render(field = spec, disabled = false) {
  return renderToStaticMarkup(<InlineField spec={field} currency="CAD" errorMessage="" active={false} disabled={disabled} onStart={vi.fn()} onClose={vi.fn()} onSave={vi.fn()} />);
}

describe("inline text editing presentation", () => {
  test("uses a focusable text element without substituting form controls", () => {
    const html = render();
    expect(html).toContain('class="inline-field-text"');
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("A considered approach</span>");
    expect(html).not.toMatch(/<(input|textarea|button)\b/);
  });
  test("placeholders remain separate from editable text content", () => {
    const html = render({ ...spec, value: "" });
    expect(html).toContain('data-placeholder="Add section heading…"');
    expect(html).toContain('data-empty="true"');
    expect(html).toContain("></span>");
  });
  test("renders pasted markup as text, never HTML", () => {
    const html = render({ ...spec, value: '<img src="x" onerror="alert(1)">' });
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
  });
  test("other fields remain readable while a save is in progress", () => {
    const html = render(spec, true);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain("A considered approach</span>");
  });
});
