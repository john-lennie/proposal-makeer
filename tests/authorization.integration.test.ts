import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

const authenticatedMember = vi.hoisted(() => ({
  current: {
    userId: "",
    workspaceId: "",
    role: "OWNER" as const,
  },
}));

class NotFoundError extends Error {}

vi.mock("@/lib/authorization", () => ({
  requireWorkspaceMember: vi.fn(async () => authenticatedMember.current),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new NotFoundError("Not found");
  }),
  redirect: vi.fn((location: string) => {
    throw new Error(`Unexpected redirect to ${location}`);
  }),
}));

import PublicProposalPage from "@/app/p/[slug]/page";
import EditProposalPage from "@/app/proposals/[proposalId]/edit/page";
import ProposalPreviewPage from "@/app/proposals/[proposalId]/preview/page";
import {
  moveSectionAction,
  publishProposalAction,
  removeSectionAction,
  unpublishProposalAction,
  updateProposalDetailsAction,
  updateSectionAction,
} from "@/app/proposals/[proposalId]/edit/actions";
import {
  getEditableProposal,
  updateDraftSection,
} from "@/data/proposal-drafts";
import {
  publishProposalDraft,
  unpublishProposal,
} from "@/data/proposal-publication";
import { recordPublicProposalResponse } from "@/data/proposal-responses";
import {
  getPublishedProposalBySlug,
  listWorkspaceProposals,
} from "@/data/proposals";
import { database } from "@/db/client";
import {
  clients,
  proposalResponses,
  proposalRevisions,
  proposalSections,
  proposals,
  users,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import type { ProposalSectionContent } from "@/db/types";
import { createDefaultProposalSections } from "@/lib/draft-proposal";
import { createProposalResponseToken } from "@/lib/proposal-response-token";

function responseInput(revisionId: string, decision: "ACCEPTED" | "DECLINED") {
  return {
    decision,
    responseToken: createProposalResponseToken(revisionId),
    respondentName: "Authorized Client",
    respondentEmail: "client@example.com",
  };
}

const runId = randomUUID().slice(0, 8);
const ids = {
  userA: randomUUID(),
  userB: randomUUID(),
  workspaceA: randomUUID(),
  workspaceB: randomUUID(),
  memberA: randomUUID(),
  memberB: randomUUID(),
  clientA: randomUUID(),
  clientB: randomUUID(),
  proposalA: randomUUID(),
  proposalB: randomUUID(),
};
const slugs = {
  proposalA: `authorization-a-${runId}`,
  proposalB: `authorization-b-${runId}`,
};

const sectionsA = createDefaultProposalSections("Proposal A", "Client A");
const sectionsB = createDefaultProposalSections("Proposal B", "Client B");
const sectionA = sectionsA.find(
  (section): section is Extract<ProposalSectionContent, { type: "text" }> =>
    section.type === "text",
)!;
const sectionB = sectionsB.find(
  (section): section is Extract<ProposalSectionContent, { type: "text" }> =>
    section.type === "text",
)!;

function authenticateAs(user: "A" | "B") {
  authenticatedMember.current =
    user === "A"
      ? { userId: ids.userA, workspaceId: ids.workspaceA, role: "OWNER" }
      : { userId: ids.userB, workspaceId: ids.workspaceB, role: "OWNER" };
}

async function editable(user: "A" | "B") {
  return getEditableProposal(
    user === "A" ? ids.workspaceA : ids.workspaceB,
    user === "A" ? ids.proposalA : ids.proposalB,
  );
}

function detailsForm(input: {
  proposalId: string;
  expectedUpdatedAt: string;
  title: string;
  clientName: string;
  slug: string;
}) {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => form.set(key, value));
  return form;
}

function publicationForm(proposalId: string, expectedUpdatedAt: string) {
  const form = new FormData();
  form.set("proposalId", proposalId);
  form.set("expectedUpdatedAt", expectedUpdatedAt);
  return form;
}

function sectionForm(input: {
  proposalId: string;
  sectionId: string;
  expectedUpdatedAt: string;
}) {
  const form = new FormData();
  form.set("proposalId", input.proposalId);
  form.set("sectionId", input.sectionId);
  form.set("expectedUpdatedAt", input.expectedUpdatedAt);
  form.set("title", "Unauthorized edit");
  form.set("body", "This content must never be written.");
  return form;
}

async function updateAndMoveOwnSection(user: "A" | "B") {
  authenticateAs(user);
  const proposalId = user === "A" ? ids.proposalA : ids.proposalB;
  const sectionId = user === "A" ? sectionA.id : sectionB.id;
  let proposal = await editable(user);
  const initialPosition = proposal!.sections.find(
    ({ id }) => id === sectionId,
  )!.position;
  const updateForm = sectionForm({
    proposalId,
    sectionId,
    expectedUpdatedAt: proposal!.updatedAt,
  });
  updateForm.set("title", `Section ${user} updated`);
  updateForm.set("body", `Authorized content for User ${user}.`);
  const updated = await updateSectionAction(
    { status: "idle", message: "" },
    updateForm,
  );
  expect(updated.status).toBe("saved");

  proposal = await editable(user);
  const moveForm = sectionForm({
    proposalId,
    sectionId,
    expectedUpdatedAt: proposal!.updatedAt,
  });
  moveForm.set("direction", "down");
  const moved = await moveSectionAction(
    { status: "idle", message: "" },
    moveForm,
  );
  expect(moved.status).toBe("saved");

  const after = (await editable(user))!.sections.find(
    ({ id }) => id === sectionId,
  )!;
  expect(after.position).toBe(initialPosition + 1);
  expect(after.content.title).toBe(`Section ${user} updated`);
}

async function publishRepublishAndUnpublishOwnProposal(user: "A" | "B") {
  authenticateAs(user);
  const proposalId = user === "A" ? ids.proposalA : ids.proposalB;
  let proposal = await editable(user);
  const published = await publishProposalAction(
    { status: "idle", message: "" },
    publicationForm(proposalId, proposal!.updatedAt),
  );
  expect(published.status).toBe("success");
  expect(published.revisionNumber).toBe(1);

  proposal = await editable(user);
  const republished = await publishProposalAction(
    { status: "idle", message: "" },
    publicationForm(proposalId, proposal!.updatedAt),
  );
  expect(republished.status).toBe("success");
  expect(republished.revisionNumber).toBe(2);

  proposal = await editable(user);
  const unpublished = await unpublishProposalAction(
    { status: "idle", message: "" },
    publicationForm(proposalId, proposal!.updatedAt),
  );
  expect(unpublished.status).toBe("success");
  expect((await editable(user))!.status).toBe("DRAFT");
}

beforeAll(async () => {
  await database.insert(users).values([
    {
      id: ids.userA,
      email: `authorization-a-${runId}@example.com`,
      name: "Authorization User A",
    },
    {
      id: ids.userB,
      email: `authorization-b-${runId}@example.com`,
      name: "Authorization User B",
    },
  ]);
  await database.insert(workspaces).values([
    {
      id: ids.workspaceA,
      name: "Authorization Workspace A",
      slug: `authorization-workspace-a-${runId}`,
    },
    {
      id: ids.workspaceB,
      name: "Authorization Workspace B",
      slug: `authorization-workspace-b-${runId}`,
    },
  ]);
  await database.insert(workspaceMembers).values([
    {
      id: ids.memberA,
      workspaceId: ids.workspaceA,
      userId: ids.userA,
      role: "OWNER",
      joinedAt: new Date(),
    },
    {
      id: ids.memberB,
      workspaceId: ids.workspaceB,
      userId: ids.userB,
      role: "OWNER",
      joinedAt: new Date(),
    },
  ]);
  await database.insert(clients).values([
    {
      id: ids.clientA,
      workspaceId: ids.workspaceA,
      name: "Client A",
      createdByUserId: ids.userA,
    },
    {
      id: ids.clientB,
      workspaceId: ids.workspaceB,
      name: "Client B",
      createdByUserId: ids.userB,
    },
  ]);
  await database.insert(proposals).values([
    {
      id: ids.proposalA,
      workspaceId: ids.workspaceA,
      clientId: ids.clientA,
      title: "Proposal A",
      slug: slugs.proposalA,
      createdByUserId: ids.userA,
      lastEditedByUserId: ids.userA,
    },
    {
      id: ids.proposalB,
      workspaceId: ids.workspaceB,
      clientId: ids.clientB,
      title: "Proposal B",
      slug: slugs.proposalB,
      createdByUserId: ids.userB,
      lastEditedByUserId: ids.userB,
    },
  ]);
  await database.insert(proposalSections).values(
    [
      ...sectionsA.map((content, position) => ({
        id: content.id,
        proposalId: ids.proposalA,
        type: content.type,
        position,
        content,
      })),
      ...sectionsB.map((content, position) => ({
        id: content.id,
        proposalId: ids.proposalB,
        type: content.type,
        position,
        content,
      })),
    ],
  );
});

afterAll(async () => {
  await database
    .update(proposals)
    .set({ currentPublishedRevisionId: null })
    .where(inArray(proposals.id, [ids.proposalA, ids.proposalB]));
  const revisionIds = await database
    .select({ id: proposalRevisions.id })
    .from(proposalRevisions)
    .where(inArray(proposalRevisions.proposalId, [ids.proposalA, ids.proposalB]));
  if (revisionIds.length) {
    await database
      .delete(proposalResponses)
      .where(
        inArray(
          proposalResponses.proposalRevisionId,
          revisionIds.map(({ id }) => id),
        ),
      );
  }
  await database
    .delete(proposalRevisions)
    .where(inArray(proposalRevisions.proposalId, [ids.proposalA, ids.proposalB]));
  await database
    .delete(proposalSections)
    .where(inArray(proposalSections.proposalId, [ids.proposalA, ids.proposalB]));
  await database
    .delete(proposals)
    .where(inArray(proposals.id, [ids.proposalA, ids.proposalB]));
  await database.delete(clients).where(inArray(clients.id, [ids.clientA, ids.clientB]));
  await database
    .delete(workspaceMembers)
    .where(inArray(workspaceMembers.id, [ids.memberA, ids.memberB]));
  await database
    .delete(workspaces)
    .where(inArray(workspaces.id, [ids.workspaceA, ids.workspaceB]));
  await database.delete(users).where(inArray(users.id, [ids.userA, ids.userB]));
});

describe("cross-workspace proposal authorization", () => {
  test("User A can read Proposal A", async () => {
    await expect(getEditableProposal(ids.workspaceA, ids.proposalA)).resolves.toMatchObject({
      id: ids.proposalA,
      title: "Proposal A",
    });
  });

  test("User A can update Proposal A", async () => {
    authenticateAs("A");
    const proposal = await editable("A");
    const result = await updateProposalDetailsAction(
      { status: "idle", message: "" },
      detailsForm({
        proposalId: ids.proposalA,
        expectedUpdatedAt: proposal!.updatedAt,
        title: "Proposal A updated",
        clientName: "Client A",
        slug: slugs.proposalA,
      }),
    );
    expect(result.status).toBe("saved");
    await expect(editable("A")).resolves.toMatchObject({ title: "Proposal A updated" });
  });

  test("User A can edit and reorder Section A", async () => {
    await updateAndMoveOwnSection("A");
  });

  test("User A can view protected edit and draft preview routes", async () => {
    authenticateAs("A");
    await expect(
      EditProposalPage({ params: Promise.resolve({ proposalId: ids.proposalA }) }),
    ).resolves.toBeTruthy();
    await expect(
      ProposalPreviewPage({
        params: Promise.resolve({ proposalId: ids.proposalA }),
      }),
    ).resolves.toBeTruthy();
  });

  test("User A can publish, republish, and unpublish Proposal A", async () => {
    await publishRepublishAndUnpublishOwnProposal("A");
  });

  test("User B can read Proposal B", async () => {
    await expect(getEditableProposal(ids.workspaceB, ids.proposalB)).resolves.toMatchObject({
      id: ids.proposalB,
      title: "Proposal B",
    });
  });

  test("User B can update Proposal B", async () => {
    authenticateAs("B");
    const proposal = await editable("B");
    const result = await updateProposalDetailsAction(
      { status: "idle", message: "" },
      detailsForm({
        proposalId: ids.proposalB,
        expectedUpdatedAt: proposal!.updatedAt,
        title: "Proposal B updated",
        clientName: "Client B",
        slug: slugs.proposalB,
      }),
    );
    expect(result.status).toBe("saved");
    await expect(editable("B")).resolves.toMatchObject({ title: "Proposal B updated" });
  });

  test("User B can edit and reorder Section B", async () => {
    await updateAndMoveOwnSection("B");
  });

  test("User B can view protected edit and draft preview routes", async () => {
    authenticateAs("B");
    await expect(
      EditProposalPage({ params: Promise.resolve({ proposalId: ids.proposalB }) }),
    ).resolves.toBeTruthy();
    await expect(
      ProposalPreviewPage({
        params: Promise.resolve({ proposalId: ids.proposalB }),
      }),
    ).resolves.toBeTruthy();
  });

  test("User B can publish, republish, and unpublish Proposal B", async () => {
    await publishRepublishAndUnpublishOwnProposal("B");
  });

  test("User A cannot read Proposal B", async () => {
    await expect(getEditableProposal(ids.workspaceA, ids.proposalB)).resolves.toBeNull();
  });

  test("User B cannot read Proposal A", async () => {
    await expect(getEditableProposal(ids.workspaceB, ids.proposalA)).resolves.toBeNull();
  });

  test("User A cannot update Proposal B", async () => {
    authenticateAs("A");
    const proposal = await editable("B");
    const before = proposal!.title;
    const form = detailsForm({
      proposalId: ids.proposalB,
      expectedUpdatedAt: proposal!.updatedAt,
      title: "Cross-workspace overwrite",
      clientName: "Compromised",
      slug: slugs.proposalB,
    });
    form.set("workspaceId", ids.workspaceB);
    form.set("userId", ids.userB);
    const result = await updateProposalDetailsAction(
      { status: "idle", message: "" },
      form,
    );
    expect(result.status).not.toBe("saved");
    await expect(editable("B")).resolves.toMatchObject({ title: before });
  });

  test("User B cannot update Proposal A", async () => {
    authenticateAs("B");
    const proposal = await editable("A");
    const before = proposal!.title;
    const form = detailsForm({
      proposalId: ids.proposalA,
      expectedUpdatedAt: proposal!.updatedAt,
      title: "Cross-workspace overwrite",
      clientName: "Compromised",
      slug: slugs.proposalA,
    });
    form.set("workspaceId", ids.workspaceA);
    form.set("userId", ids.userA);
    const result = await updateProposalDetailsAction(
      { status: "idle", message: "" },
      form,
    );
    expect(result.status).not.toBe("saved");
    await expect(editable("A")).resolves.toMatchObject({ title: before });
  });

  test("User B cannot update, delete, or reorder Section A by ID", async () => {
    authenticateAs("B");
    const proposal = await editable("A");
    const before = proposal!.sections.find(({ id }) => id === sectionA.id)!;

    const updateResult = await updateSectionAction(
      { status: "idle", message: "" },
      sectionForm({
        proposalId: ids.proposalA,
        sectionId: sectionA.id,
        expectedUpdatedAt: proposal!.updatedAt,
      }),
    );
    const removeResult = await removeSectionAction(
      { status: "idle", message: "" },
      sectionForm({
        proposalId: ids.proposalA,
        sectionId: sectionA.id,
        expectedUpdatedAt: proposal!.updatedAt,
      }),
    );
    const moveForm = sectionForm({
      proposalId: ids.proposalA,
      sectionId: sectionA.id,
      expectedUpdatedAt: proposal!.updatedAt,
    });
    moveForm.set("direction", "down");
    const moveResult = await moveSectionAction(
      { status: "idle", message: "" },
      moveForm,
    );

    expect(updateResult.status).not.toBe("saved");
    expect(removeResult.status).not.toBe("saved");
    expect(moveResult.status).not.toBe("saved");
    const after = (await editable("A"))!.sections.find(({ id }) => id === sectionA.id)!;
    expect(after).toEqual(before);
  });

  test("User A cannot update, delete, or reorder Section B by ID", async () => {
    authenticateAs("A");
    const proposal = await editable("B");
    const before = proposal!.sections.find(({ id }) => id === sectionB.id)!;

    const updateResult = await updateSectionAction(
      { status: "idle", message: "" },
      sectionForm({
        proposalId: ids.proposalB,
        sectionId: sectionB.id,
        expectedUpdatedAt: proposal!.updatedAt,
      }),
    );
    const removeResult = await removeSectionAction(
      { status: "idle", message: "" },
      sectionForm({
        proposalId: ids.proposalB,
        sectionId: sectionB.id,
        expectedUpdatedAt: proposal!.updatedAt,
      }),
    );
    const moveForm = sectionForm({
      proposalId: ids.proposalB,
      sectionId: sectionB.id,
      expectedUpdatedAt: proposal!.updatedAt,
    });
    moveForm.set("direction", "down");
    const moveResult = await moveSectionAction(
      { status: "idle", message: "" },
      moveForm,
    );

    expect(updateResult.status).not.toBe("saved");
    expect(removeResult.status).not.toBe("saved");
    expect(moveResult.status).not.toBe("saved");
    const after = (await editable("B"))!.sections.find(
      ({ id }) => id === sectionB.id,
    )!;
    expect(after).toEqual(before);
  });

  test("both users receive not found for the other workspace protected routes", async () => {
    authenticateAs("A");
    await expect(
      EditProposalPage({ params: Promise.resolve({ proposalId: ids.proposalB }) }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      ProposalPreviewPage({
        params: Promise.resolve({ proposalId: ids.proposalB }),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    authenticateAs("B");
    await expect(
      EditProposalPage({ params: Promise.resolve({ proposalId: ids.proposalA }) }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      ProposalPreviewPage({
        params: Promise.resolve({ proposalId: ids.proposalA }),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("User B cannot publish Proposal A", async () => {
    authenticateAs("B");
    const proposal = await editable("A");
    const result = await publishProposalAction(
      { status: "idle", message: "" },
      publicationForm(ids.proposalA, proposal!.updatedAt),
    );
    expect(result.status).toBe("error");
    expect((await editable("A"))!.status).toBe("DRAFT");
  });

  test("User B cannot republish or unpublish Proposal A", async () => {
    let proposal = await editable("A");
    const published = await publishProposalDraft({
      workspaceId: ids.workspaceA,
      userId: ids.userA,
      proposalId: ids.proposalA,
      expectedUpdatedAt: proposal!.updatedAt,
    });
    expect(published.status).toBe("ok");

    authenticateAs("B");
    proposal = await editable("A");
    const republish = await publishProposalAction(
      { status: "idle", message: "" },
      publicationForm(ids.proposalA, proposal!.updatedAt),
    );
    const unpublish = await unpublishProposalAction(
      { status: "idle", message: "" },
      publicationForm(ids.proposalA, proposal!.updatedAt),
    );
    expect(republish.status).toBe("error");
    expect(unpublish.status).toBe("error");
    expect((await editable("A"))!.status).toBe("PUBLISHED");
  });

  test("User A cannot publish Proposal B", async () => {
    authenticateAs("A");
    const proposal = await editable("B");
    const result = await publishProposalAction(
      { status: "idle", message: "" },
      publicationForm(ids.proposalB, proposal!.updatedAt),
    );
    expect(result.status).toBe("error");
    expect((await editable("B"))!.status).toBe("DRAFT");
  });

  test("User A cannot republish or unpublish Proposal B", async () => {
    let proposal = await editable("B");
    const published = await publishProposalDraft({
      workspaceId: ids.workspaceB,
      userId: ids.userB,
      proposalId: ids.proposalB,
      expectedUpdatedAt: proposal!.updatedAt,
    });
    expect(published.status).toBe("ok");

    authenticateAs("A");
    proposal = await editable("B");
    const republish = await publishProposalAction(
      { status: "idle", message: "" },
      publicationForm(ids.proposalB, proposal!.updatedAt),
    );
    const unauthorizedUnpublish = await unpublishProposalAction(
      { status: "idle", message: "" },
      publicationForm(ids.proposalB, proposal!.updatedAt),
    );
    expect(republish.status).toBe("error");
    expect(unauthorizedUnpublish.status).toBe("error");
    expect((await editable("B"))!.status).toBe("PUBLISHED");

    const restored = await unpublishProposal({
      workspaceId: ids.workspaceB,
      proposalId: ids.proposalB,
      expectedUpdatedAt: proposal!.updatedAt,
    });
    expect(restored.status).toBe("ok");
  });

  test("dashboard queries only return the authenticated workspace proposals", async () => {
    const forA = await listWorkspaceProposals(ids.workspaceA);
    const forB = await listWorkspaceProposals(ids.workspaceB);
    expect(forA.map(({ id }) => id)).toEqual([ids.proposalA]);
    expect(forB.map(({ id }) => id)).toEqual([ids.proposalB]);
  });

  test("draft preview returns not found across workspaces", async () => {
    authenticateAs("B");
    await expect(
      ProposalPreviewPage({ params: Promise.resolve({ proposalId: ids.proposalA }) }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("public access succeeds for a published proposal without authentication", async () => {
    await expect(getPublishedProposalBySlug(slugs.proposalA)).resolves.not.toBeNull();
    await expect(
      PublicProposalPage({
        params: Promise.resolve({ slug: slugs.proposalA }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toBeTruthy();
  });

  test("public access to an unpublished proposal returns not found", async () => {
    await expect(getPublishedProposalBySlug(slugs.proposalB)).resolves.toBeNull();
    await expect(
      PublicProposalPage({
        params: Promise.resolve({ slug: slugs.proposalB }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test("editing draft content does not change the current published revision", async () => {
    const before = await getPublishedProposalBySlug(slugs.proposalA);
    const proposal = await editable("A");
    const changedContent: ProposalSectionContent = {
      ...sectionA,
      title: "Changed after publication",
      body: {
        version: 1,
        blocks: [{ type: "paragraph", text: "Unpublished draft content" }],
      },
    };
    const result = await updateDraftSection({
      workspaceId: ids.workspaceA,
      userId: ids.userA,
      proposalId: ids.proposalA,
      sectionId: sectionA.id,
      expectedUpdatedAt: proposal!.updatedAt,
      content: changedContent,
    });
    expect(result.status).toBe("ok");

    const after = await getPublishedProposalBySlug(slugs.proposalA);
    expect(after!.revisionId).toBe(before!.revisionId);
    expect(after!.content).toEqual(before!.content);
    expect(
      (await editable("A"))!.sections.find(({ id }) => id === sectionA.id)!.content,
    ).toEqual(changedContent);

    const draft = await editable("A");
    const republished = await publishProposalDraft({
      workspaceId: ids.workspaceA,
      userId: ids.userA,
      proposalId: ids.proposalA,
      expectedUpdatedAt: draft!.updatedAt,
    });
    expect(republished.status).toBe("ok");
    const current = await getPublishedProposalBySlug(slugs.proposalA);
    expect(current!.revisionId).not.toBe(before!.revisionId);
    expect(
      current!.content.sections.find(({ id }) => id === sectionA.id),
    ).toEqual(changedContent);
  });

  test("an unpublished proposal cannot receive a public response", async () => {
    await expect(
      recordPublicProposalResponse({
        slug: slugs.proposalB,
        ...responseInput(ids.proposalB, "ACCEPTED"),
      }),
    ).resolves.toEqual({ status: "not_found", message: "Proposal not found." });
  });

  test("an expired current revision cannot receive a public response", async () => {
    const current = await getPublishedProposalBySlug(slugs.proposalA);
    const expiredAt = new Date(Date.now() - 60_000);
    await database
      .update(proposalRevisions)
      .set({
        expiresAtSnapshot: expiredAt,
        contentSnapshot: {
          ...current!.content,
          expiresAt: expiredAt.toISOString(),
        },
      })
      .where(eq(proposalRevisions.id, current!.revisionId));

    await expect(
      recordPublicProposalResponse({
        slug: slugs.proposalA,
        ...responseInput(current!.revisionId, "ACCEPTED"),
      }),
    ).resolves.toEqual({
      status: "unavailable",
      message: "This proposal is no longer available for a response.",
    });

    await database
      .update(proposalRevisions)
      .set({
        expiresAtSnapshot: null,
        contentSnapshot: current!.content,
      })
      .where(eq(proposalRevisions.id, current!.revisionId));
  });

  test("a response is recorded only against the current published revision", async () => {
    const current = await getPublishedProposalBySlug(slugs.proposalA);

    await expect(
      recordPublicProposalResponse({
        slug: slugs.proposalA,
        ...responseInput(ids.proposalB, "DECLINED"),
      }),
    ).resolves.toEqual({
      status: "unavailable",
      message: "This proposal is no longer available for a response.",
    });

    await expect(
      recordPublicProposalResponse({
        slug: slugs.proposalA,
        ...responseInput(current!.revisionId, "ACCEPTED"),
      }),
    ).resolves.toEqual({ status: "ok", decision: "ACCEPTED" });

    await expect(getPublishedProposalBySlug(slugs.proposalA)).resolves.toMatchObject({
      revisionId: current!.revisionId,
      decision: "ACCEPTED",
    });

    const recorded = await database
      .select({
        respondentName: proposalResponses.respondentName,
        respondentEmail: proposalResponses.respondentEmail,
        responseTokenHash: proposalResponses.responseTokenHash,
      })
      .from(proposalResponses)
      .where(eq(proposalResponses.proposalRevisionId, current!.revisionId))
      .limit(1)
      .then((rows) => rows[0]);
    expect(recorded).toMatchObject({
      respondentName: "Authorized Client",
      respondentEmail: "client@example.com",
    });
    expect(recorded!.responseTokenHash).not.toBe(
      createProposalResponseToken(current!.revisionId),
    );
  });

  test("a repeated response is idempotent and cannot change the decision", async () => {
    const current = await getPublishedProposalBySlug(slugs.proposalA);
    await expect(
      recordPublicProposalResponse({
        slug: slugs.proposalA,
        ...responseInput(current!.revisionId, "DECLINED"),
      }),
    ).resolves.toEqual({
      status: "already_recorded",
      decision: "ACCEPTED",
    });
  });

  test("foreign proposal section types are not disclosed before authorization", async () => {
    const proposalB = await editable("B");
    const { addDraftSection } = await import("@/data/proposal-drafts");
    const result = await addDraftSection({
      workspaceId: ids.workspaceB,
      userId: ids.userB,
      proposalId: ids.proposalA,
      expectedUpdatedAt: proposalB!.updatedAt,
      content: sectionB,
    });
    expect(result).toEqual({ status: "not_found", message: "Proposal not found." });
  });
});
