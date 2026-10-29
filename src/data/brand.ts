import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { database } from "@/db/client";
import { proposals, workspaces } from "@/db/schema";
import type { ThemeSettings } from "@/db/types";

export async function getWorkspaceBrand(workspaceId: string) {
  const [workspace] = await database.select({ brand: workspaces.brandSettings, name: workspaces.name })
    .from(workspaces).where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt))).limit(1);
  return workspace ? { displayName: workspace.name, ...workspace.brand } : null;
}

export async function saveWorkspaceBrand(workspaceId: string, brand: ThemeSettings) {
  return database.transaction(async (tx) => {
    const updatedAt = new Date();
    const [workspace] = await tx.update(workspaces).set({ brandSettings: brand, updatedAt })
      .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt)))
      .returning({ id: workspaces.id });
    if (!workspace) return false;
    // Advance draft versions so an editor opened before a brand change cannot
    // silently publish a different brand than the one they previewed.
    await tx.update(proposals).set({ updatedAt }).where(and(
      eq(proposals.workspaceId, workspaceId), isNull(proposals.deletedAt),
    ));
    return true;
  });
}
