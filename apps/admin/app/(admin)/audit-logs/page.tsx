import { prisma } from "@securevault/database";
import { requireAdminSession } from "@/lib/auth-utils";

interface AuditLogWhereInput {
  action?: { contains: string; mode: "insensitive" };
  userId?: string;
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; userId?: string }>;
}) {
  await requireAdminSession();
  const { action, userId } = await searchParams;

  const where: AuditLogWhereInput = {
    ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    ...(userId ? { userId } : {}),
  };

  const logs = (await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } } },
  })) as Array<{
    id: string;
    action: string;
    resource: string | null;
    resourceId: string | null;
    ipAddress: string | null;
    createdAt: Date;
    userId: string | null;
    user: { email: string } | null;
  }>;

  const exportParams = new URLSearchParams();
  if (action) exportParams.set("action", action);
  if (userId) exportParams.set("userId", userId);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Audit logs</h1>
        <a
          href={`/api/admin/audit-logs/export?${exportParams.toString()}`}
          className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm"
        >
          Export CSV
        </a>
      </div>

      <form className="flex gap-2">
        <input
          type="text"
          name="action"
          defaultValue={action}
          placeholder="Filter by action (e.g. login, media_upload)…"
          className="rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent w-72"
        />
        <input
          type="text"
          name="userId"
          defaultValue={userId}
          placeholder="Filter by user ID…"
          className="rounded-lg bg-surface border border-border px-3 py-2 text-sm outline-none focus:border-accent w-56"
        />
        <button className="px-4 py-2 rounded-lg border border-border hover:bg-surface-hover text-sm">
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-hover text-muted text-xs">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Action</th>
              <th className="text-left px-4 py-2.5 font-medium">User</th>
              <th className="text-left px-4 py-2.5 font-medium">Resource</th>
              <th className="text-left px-4 py-2.5 font-medium">IP</th>
              <th className="text-left px-4 py-2.5 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-2.5">{log.action}</td>
                <td className="px-4 py-2.5 text-muted">{log.user?.email ?? log.userId ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted">
                  {log.resource ? `${log.resource}${log.resourceId ? `:${log.resourceId}` : ""}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted">{log.ipAddress || "—"}</td>
                <td className="px-4 py-2.5 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="text-center py-10 text-muted text-sm">No matching audit logs.</div>
        )}
      </div>
    </div>
  );
}
