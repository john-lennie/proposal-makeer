import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ member: vi.fn(), saveBrand: vi.fn(), getSection: vi.fn(), updateSection: vi.fn() }));
vi.mock("@/lib/authorization", () => ({ requireWorkspaceMember: mocks.member }));
vi.mock("@/data/brand", () => ({ saveWorkspaceBrand: mocks.saveBrand }));
vi.mock("@/data/proposal-drafts", () => ({ getDraftSection: mocks.getSection, updateDraftSection: mocks.updateSection }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { saveBrandAction } from "@/app/settings/brand/actions";
import { saveInlineFieldAction } from "@/app/proposals/[proposalId]/edit/inline-actions";
import { initialEditorActionState } from "@/lib/action-state";
import { createDefaultSection } from "@/lib/draft-proposal";

const proposalId = "12345678-1234-4234-8234-123456789012";
const sectionId = "12345678-1234-4234-8234-123456789013";
const request = { proposalId, sectionId, path: "title", value: "New title", expectedUpdatedAt: "2026-10-29T12:00:00.000Z" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.member.mockResolvedValue({ workspaceId: "workspace-a", userId: "user-a", role: "OWNER" });
});
function brandForm() {
  const form = new FormData();
  Object.entries({ workspaceId: "workspace-b", displayName: "Studio", logoAssetUrl: "", accentColor: "#123456", headingStyle: "modern" }).forEach(([key, value]) => form.set(key, value));
  return form;
}

describe("brand and direct-edit permissions", () => {
  test("brand writes use the authenticated workspace, never a submitted workspace", async () => {
    mocks.saveBrand.mockResolvedValue(true);
    expect((await saveBrandAction(initialEditorActionState, brandForm())).status).toBe("saved");
    expect(mocks.saveBrand).toHaveBeenCalledWith("workspace-a", expect.objectContaining({ displayName: "Studio" }));
  });
  test("ordinary members cannot change workspace branding", async () => {
    mocks.member.mockResolvedValue({ workspaceId: "workspace-a", userId: "user-a", role: "MEMBER" });
    expect((await saveBrandAction(initialEditorActionState, brandForm())).status).toBe("error");
    expect(mocks.saveBrand).not.toHaveBeenCalled();
  });
  test("brand validation runs before persistence", async () => {
    const form = brandForm(); form.set("logoAssetUrl", "javascript:alert(1)");
    expect((await saveBrandAction(initialEditorActionState, form)).status).toBe("error");
    expect(mocks.saveBrand).not.toHaveBeenCalled();
  });
  test("a section outside the authenticated workspace cannot be changed", async () => {
    mocks.getSection.mockResolvedValue(null);
    expect((await saveInlineFieldAction(request)).status).toBe("error");
    expect(mocks.getSection).toHaveBeenCalledWith("workspace-a", proposalId, sectionId);
    expect(mocks.updateSection).not.toHaveBeenCalled();
  });
  test("saves preserve workspace scope, actor, and optimistic concurrency token", async () => {
    mocks.getSection.mockResolvedValue({ content: createDefaultSection("text", { title: "Proposal", clientName: "Client" }) });
    mocks.updateSection.mockResolvedValue({ status: "ok", updatedAt: "2026-10-29T12:01:00.000Z" });
    expect((await saveInlineFieldAction(request)).status).toBe("saved");
    expect(mocks.updateSection).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: "workspace-a", userId: "user-a", expectedUpdatedAt: request.expectedUpdatedAt, content: expect.objectContaining({ title: "New title" }) }));
  });
  test("stale drafts return a conflict without reporting success", async () => {
    mocks.getSection.mockResolvedValue({ content: createDefaultSection("text", { title: "Proposal", clientName: "Client" }) });
    mocks.updateSection.mockResolvedValue({ status: "conflict", message: "Refresh before saving." });
    expect(await saveInlineFieldAction(request)).toEqual({ status: "conflict", message: "Refresh before saving." });
  });
});
