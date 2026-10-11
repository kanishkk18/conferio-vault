"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@securevault/database";
import { requireAdminSession } from "./auth-utils";

export async function banUser(userId: string, reason: string) {
  const session = await requireAdminSession();
  await prisma.user.update({
    where: { id: userId },
    data: { banned: true, banReason: reason || "No reason provided" },
  });
  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "admin_ban_user", resourceId: userId, metadata: { reason } },
  });
  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
}

export async function unbanUser(userId: string) {
  const session = await requireAdminSession();
  await prisma.user.update({ where: { id: userId }, data: { banned: false, banReason: null } });
  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "admin_unban_user", resourceId: userId },
  });
  revalidatePath("/users");
  revalidatePath(`/users/${userId}`);
}

export async function deleteUserAccount(userId: string) {
  const session = await requireAdminSession();
  if (userId === session.user.id) {
    throw new Error("You can't delete your own account from here.");
  }
  // Cascades to Session/Account/Password/MediaItem/ShareLink via the
  // Prisma schema's onDelete: Cascade — this genuinely deletes the user's
  // encrypted rows and their R2 objects become orphaned ciphertext with
  // no key path back to them (a separate storage GC job should sweep
  // orphaned R2 keys periodically — not implemented in this pass).
  await prisma.user.delete({ where: { id: userId } });
  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "admin_delete_user", resourceId: userId },
  });
  revalidatePath("/users");
}
