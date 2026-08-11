import "server-only";

import { and, asc, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { database } from "@/db/client";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ensureUserWorkspace } from "@/lib/auth-provisioning";

export interface WorkspaceMemberContext {
  userId: string;
  workspaceId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
}

export async function requireWorkspaceMember(): Promise<WorkspaceMemberContext> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  let membership = await database
    .select({
      userId: users.id,
      workspaceId: workspaceMembers.workspaceId,
      role: workspaceMembers.role,
    })
    .from(users)
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.userId, users.id),
        eq(workspaceMembers.status, "ACTIVE"),
        isNull(workspaceMembers.deletedAt),
      ),
    )
    .innerJoin(
      workspaces,
      and(
        eq(workspaces.id, workspaceMembers.workspaceId),
        eq(workspaces.status, "ACTIVE"),
        isNull(workspaces.deletedAt),
      ),
    )
    .where(
      and(
        eq(users.id, session.user.id),
        eq(users.status, "ACTIVE"),
        isNull(users.deletedAt),
      ),
    )
    .orderBy(asc(workspaceMembers.createdAt))
    .limit(1)
    .then((rows) => rows[0]);

  if (!membership) {
    await ensureUserWorkspace({
      userId: session.user.id,
      name: session.user.name,
    });

    membership = await database
      .select({
        userId: users.id,
        workspaceId: workspaceMembers.workspaceId,
        role: workspaceMembers.role,
      })
      .from(users)
      .innerJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.userId, users.id),
          eq(workspaceMembers.status, "ACTIVE"),
          isNull(workspaceMembers.deletedAt),
        ),
      )
      .innerJoin(
        workspaces,
        and(
          eq(workspaces.id, workspaceMembers.workspaceId),
          eq(workspaces.status, "ACTIVE"),
          isNull(workspaces.deletedAt),
        ),
      )
      .where(
        and(
          eq(users.id, session.user.id),
          eq(users.status, "ACTIVE"),
          isNull(users.deletedAt),
        ),
      )
      .orderBy(asc(workspaceMembers.createdAt))
      .limit(1)
      .then((rows) => rows[0]);
  }

  if (!membership) {
    redirect("/sign-in?error=workspace-access");
  }

  return membership;
}

export async function getWorkspaceMemberProfile(context: WorkspaceMemberContext) {
  return database
    .select({
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .innerJoin(
      workspaceMembers,
      and(
        eq(workspaceMembers.userId, users.id),
        eq(workspaceMembers.workspaceId, context.workspaceId),
        eq(workspaceMembers.status, "ACTIVE"),
        isNull(workspaceMembers.deletedAt),
      ),
    )
    .where(
      and(
        eq(users.id, context.userId),
        eq(users.status, "ACTIVE"),
        isNull(users.deletedAt),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);
}
