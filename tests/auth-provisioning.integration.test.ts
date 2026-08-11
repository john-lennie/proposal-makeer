import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { afterAll, describe, expect, test } from "vitest";

import { database } from "@/db/client";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { ensureUserWorkspace } from "@/lib/auth-provisioning";

const userId = randomUUID();
const email = `provisioning-${userId}@example.com`;

afterAll(async () => {
  const memberships = await database
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId));

  await database
    .delete(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId));
  for (const membership of memberships) {
    await database
      .delete(workspaces)
      .where(eq(workspaces.id, membership.workspaceId));
  }
  await database.delete(users).where(eq(users.id, userId));
});

describe("authentication workspace provisioning", () => {
  test("repairs an authenticated user who has no workspace", async () => {
    await database.insert(users).values({
      id: userId,
      email,
      name: "Provisioning Test User",
    });

    await ensureUserWorkspace({ userId, name: "Provisioning Test User" });

    const membership = await database
      .select({
        role: workspaceMembers.role,
        workspaceId: workspaceMembers.workspaceId,
        workspaceName: workspaces.name,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, userId));

    expect(membership).toEqual([
      expect.objectContaining({
        role: "OWNER",
        workspaceName: "Provisioning Test User's workspace",
      }),
    ]);
  });

  test("provisioning is idempotent", async () => {
    await Promise.all([
      ensureUserWorkspace({ userId, name: "Provisioning Test User" }),
      ensureUserWorkspace({ userId, name: "Provisioning Test User" }),
    ]);

    const memberships = await database
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));

    expect(memberships).toHaveLength(1);
  });

  test("does not replace a deliberately deactivated membership", async () => {
    await database
      .update(workspaceMembers)
      .set({ status: "SUSPENDED", deletedAt: new Date() })
      .where(eq(workspaceMembers.userId, userId));

    await ensureUserWorkspace({ userId, name: "Provisioning Test User" });

    const memberships = await database
      .select({ status: workspaceMembers.status })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));
    expect(memberships).toEqual([{ status: "SUSPENDED" }]);
  });
});
