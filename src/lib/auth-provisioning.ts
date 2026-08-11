import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { database } from "@/db/client";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { suggestProposalSlug } from "@/lib/draft-proposal";

function workspaceSlug(name: string, userId: string): string {
  const base = suggestProposalSlug(name) || "workspace";
  return `${base.slice(0, 63)}-${userId}`;
}

export async function ensureUserWorkspace(input: {
  userId: string;
  name: string;
}): Promise<void> {
  await database.transaction(async (transaction) => {
    const eligibleUser = await transaction
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, input.userId),
          eq(users.status, "ACTIVE"),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)
      .for("update")
      .then((rows) => rows[0]);

    if (!eligibleUser) return;

    const existingMembership = await transaction
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, input.userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (existingMembership) return;

    const workspace = await transaction
      .insert(workspaces)
      .values({
        name: `${input.name}'s workspace`,
        slug: workspaceSlug(input.name, input.userId),
      })
      .returning({ id: workspaces.id })
      .then((rows) => rows[0]);

    await transaction.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: input.userId,
      role: "OWNER",
      status: "ACTIVE",
      joinedAt: new Date(),
    });
  });
}
