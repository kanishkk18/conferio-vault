import Link from "next/link";
import { prisma } from "@securevault/database";
import { requireAdminSession } from "@/lib/auth-utils";
import { banUser, unbanUser, deleteUserAccount } from "@/lib/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  await requireAdminSession();
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return <div className="p-6 text-muted">User not found.</div>;
  }

  // Deliberately excludes encryptedData/iv/encryptedDataKey/keyIv — the
  // admin panel structurally cannot render password content because it
  // never even fetches it, not just because the UI doesn't display it.
  const passwords = (await prisma.password.findMany({
    where: { userId: id, deletedAt: null },
    select: { id: true, title: true, username: true, category: true, createdAt: true, isHidden: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  })) as Array<{
    id: string;
    title: string;
    username: string;
    category: string;
    createdAt: Date;
    isHidden: boolean;
  }>;

  // Deliberately excludes storageKey/thumbnailKey/adminWrappedKey/etc from
  // this query — those are only ever read inside the /api/admin/media/*
  // decrypt routes, which the <img>/<a> tags below hit as separate,
  // audited requests. This list query can't leak them because it never
  // asks for them.
  const media = (await prisma.mediaItem.findMany({
    where: { userId: id, deletedAt: null },
    select: {
      id: true,
      originalName: true,
      fileType: true,
      mimeType: true,
      fileSize: true,
      uploadedAt: true,
      isHidden: true,
      requiresPassword: true,
      thumbnailKey: true,
    },
    orderBy: { uploadedAt: "desc" },
    take: 200,
  })) as Array<{
    id: string;
    originalName: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: Date;
    isHidden: boolean;
    requiresPassword: boolean;
    thumbnailKey: string | null;
  }>;

  const activity = (await prisma.auditLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })) as Array<{ id: string; action: string; ipAddress: string | null; createdAt: Date }>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{user.name || user.email}</h1>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.banned ? (
            <form action={unbanUser.bind(null, id)}>
              <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-xs">
                Unban
              </button>
            </form>
          ) : (
            <form action={banUser.bind(null, id, "Admin action")}>
              <button className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-xs text-danger">
                Ban
              </button>
            </form>
          )}
          <form action={deleteUserAccount.bind(null, id)}>
            <ConfirmSubmitButton
              confirmMessage={`Permanently delete ${user.email}'s account and all their data? This cannot be undone.`}
              className="px-3 py-1.5 rounded-lg bg-danger/15 text-danger hover:bg-danger/25 text-xs"
            >
              Delete account
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard label="Role" value={user.role} />
        <InfoCard label="Last login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"} />
        <InfoCard label="Login count" value={String(user.loginCount)} />
        <InfoCard label="Last IP" value={user.ipAddress || "—"} />
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">
          Passwords ({passwords.length}) — titles/IDs only, never decrypted
        </h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-hover text-muted text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-left px-4 py-2 font-medium">Username</th>
                <th className="text-left px-4 py-2 font-medium">Category</th>
                <th className="text-left px-4 py-2 font-medium">ID</th>
                <th className="text-left px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {passwords.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-2">{p.title}</td>
                  <td className="px-4 py-2 text-muted">{p.username}</td>
                  <td className="px-4 py-2 text-muted">{p.category}</td>
                  <td className="px-4 py-2 text-muted font-mono text-xs">{p.id}</td>
                  <td className="px-4 py-2 text-muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {passwords.length === 0 && (
            <div className="text-center py-6 text-muted text-sm">No passwords stored.</div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Media ({media.length})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {media.map((m) => (
            <a
              key={m.id}
              href={`/api/admin/media/${m.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="group aspect-square rounded-xl border border-border bg-surface overflow-hidden relative"
            >
              {m.thumbnailKey ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/admin/media/${m.id}/thumbnail`}
                  alt={m.originalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">📄</div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-white truncate block">{m.originalName}</span>
              </div>
              {m.requiresPassword && (
                <div className="absolute top-1 right-1 bg-black/60 rounded-full px-1.5 py-0.5 text-[9px] text-white">
                  🔒
                </div>
              )}
            </a>
          ))}
        </div>
        {media.length === 0 && (
          <div className="text-center py-6 text-muted text-sm border border-border rounded-xl bg-surface">
            No media uploaded.
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted">Recent activity</h2>
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-hover text-muted text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Action</th>
                <th className="text-left px-4 py-2 font-medium">IP</th>
                <th className="text-left px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-2">{a.action}</td>
                  <td className="px-4 py-2 text-muted">{a.ipAddress || "—"}</td>
                  <td className="px-4 py-2 text-muted">{new Date(a.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {activity.length === 0 && (
            <div className="text-center py-6 text-muted text-sm">No activity recorded.</div>
          )}
        </div>
      </section>

      <Link href="/users" className="inline-block text-sm text-accent hover:underline">
        ← Back to users
      </Link>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}
